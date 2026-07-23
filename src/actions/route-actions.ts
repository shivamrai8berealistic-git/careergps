'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { admin } from '@/lib/firebase-admin';
import { buildCareerRouteFlow } from '@/ai/flows/build-career-route';
import { generateValidationFlow, gradeValidationFlow } from '@/ai/flows/generate-validation';
import { RouteStyle, Route, RouteCheckpoint, RouteModule, RouteChapter } from '@/types/route';
import { logCareerEvent } from '@/lib/memory-engine';
import { reserveCredits, commitCredits, rollbackCredits } from '@/lib/credit-ledger';
import { enqueueTask } from '@/lib/task-queue';
import { checkRateLimit } from '@/lib/rate-limit';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
    const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
    return decodedClaims.uid;
  } catch (error) {
    throw new Error('Unauthorized: Invalid token');
  }
}

import { truncateProfileContext } from '@/lib/profile-utils';

export async function generateRoute(idToken: string, blueprintId: string, optimizationStyle: RouteStyle, targetJobTitle: string) {
  const userId = await getUserId(idToken);

  const rateLimit = await checkRateLimit(userId, 'ai_action');
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((rateLimit.resetInMs || 60000)/1000)} seconds before trying again.`);
  }

  // 1. Fetch Blueprint to ensure it exists
  const blueprintDoc = await adminDb.collection('knowledge_graph/role_blueprints/blueprints').doc(blueprintId).get();
  if (!blueprintDoc.exists) throw new Error("Blueprint not found");

  const jobId = adminDb.collection('users').doc(userId).collection('route_jobs').doc().id;

  // 2. Paywall Check & Reserve Credits
  const spendResult = await reserveCredits(userId, 'buildRoute', jobId);
  if (!spendResult.allowed) {
    throw new Error(`Insufficient credits. Required: ${spendResult.required}, Remaining: ${spendResult.remaining}`);
  }

  // 3. Create Job Document
  await adminDb.collection('users').doc(userId).collection('route_jobs').doc(jobId).set({
    id: jobId,
    status: 'pending',
    targetJobTitle,
    blueprintId,
    optimizationStyle,
    createdAt: new Date().toISOString()
  });

  // 4. Enqueue Background Task
  try {
    await enqueueTask('generate-route-queue', '/api/tasks/generate-route', {
      userId,
      blueprintId,
      optimizationStyle,
      targetJobTitle,
      jobId
    });
  } catch (error) {
    // Rollback reservation if task failed to enqueue
    await rollbackCredits(userId, 'buildRoute', jobId);
    await adminDb.collection('users').doc(userId).collection('route_jobs').doc(jobId).update({
      status: 'failed',
      error: 'Failed to queue generation task.'
    });
    throw new Error("Failed to start route generation.");
  }

  return { success: true, jobId };
}



export async function getRouteJobStatus(idToken: string, jobId: string) {
  const userId = await getUserId(idToken);
  const jobDoc = await adminDb.collection('users').doc(userId).collection('route_jobs').doc(jobId).get();
  
  if (!jobDoc.exists) {
    return { status: 'not_found' };
  }
  
  return jobDoc.data() as {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    routeId?: string;
    error?: string;
    targetJobTitle: string;
    createdAt: string;
  };
}

export async function retryRouteJob(idToken: string, jobId: string) {
  const userId = await getUserId(idToken);
  const jobRef = adminDb.collection('users').doc(userId).collection('route_jobs').doc(jobId);
  const jobDoc = await jobRef.get();
  
  if (!jobDoc.exists) throw new Error("Job not found");
  const jobData = jobDoc.data();
  
  if (jobData?.status !== 'failed') {
    throw new Error("Only failed jobs can be retried");
  }

  // Re-reserve credits for this exact jobId
  const spendResult = await reserveCredits(userId, 'buildRoute', jobId);
  if (!spendResult.allowed) {
    throw new Error(`Insufficient credits to retry. Required: ${spendResult.required}, Remaining: ${spendResult.remaining}`);
  }

  await jobRef.update({ status: 'pending', error: admin.firestore.FieldValue.delete() });

  try {
    await enqueueTask('generate-route-queue', '/api/tasks/generate-route', {
      userId,
      blueprintId: jobData.blueprintId || 'frontend-engineer-react',
      optimizationStyle: jobData.optimizationStyle || 'highest_success',
      targetJobTitle: jobData.targetJobTitle,
      jobId
    });
  } catch (error) {
    await rollbackCredits(userId, 'buildRoute', jobId);
    await jobRef.update({ status: 'failed', error: 'Failed to queue generation task.' });
    throw new Error("Failed to restart route generation.");
  }
  
  return { success: true };
}

import { buildModuleChaptersFlow } from '@/ai/flows/build-module-chapters';

export async function generateChaptersForModule(idToken: string, moduleId: string) {
  const userId = await getUserId(idToken);
  
  const rateLimit = await checkRateLimit(userId, 'ai_action');
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((rateLimit.resetInMs || 60000)/1000)} seconds before trying again.`);
  }

  const moduleDoc = await adminDb.collection('users').doc(userId).collection('route_modules').doc(moduleId).get();
  if (!moduleDoc.exists) throw new Error("Module not found");
  const moduleData = moduleDoc.data() as RouteModule;
  
  const routeDoc = await adminDb.collection('users').doc(userId).collection('routes').doc(moduleData.routeId).get();
  const route = routeDoc.data() as Route;
  
  const blueprintDoc = await adminDb.collection('knowledge_graph/role_blueprints/blueprints').doc(route.blueprintId).get();
  const blueprint = blueprintDoc.data() as any;
  
  const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
  const userProfile = truncateProfileContext(profileDoc.data());
  
  // Find the template
  let moduleTemplate = null;
  for (const cp of (blueprint.checkpointTemplates || [])) {
    const found = (cp.moduleTemplates || []).find((m: any) => m.title === moduleData.title || m.id === moduleData.title); // Simple matching since we didn't store templateId on RouteModule
    if (found) {
      moduleTemplate = found;
      break;
    }
  }
  
  if (!moduleTemplate) {
    throw new Error("Could not find matching module template in blueprint.");
  }
  
  let result;
  try {
    result = await buildModuleChaptersFlow({
      userProfile,
      targetJobTitle: route.targetPosition.title,
      optimizationStyle: route.routeStyle,
      moduleTemplate
    });
  } catch (error) {
    console.error("AI Chapter Generation Failed:", error);
    throw new Error("Failed to generate personalized chapters due to high AI load. Please retry.");
  }
  
  const batch = adminDb.batch();
  let chOrder = 0;
  
  for (const ch of result.chapters) {
    const chRef = adminDb.collection('users').doc(userId).collection('route_chapters').doc();
    const chData: RouteChapter = {
      id: chRef.id,
      routeId: moduleData.routeId,
      checkpointId: moduleData.checkpointId,
      moduleId,
      userId,
      title: ch.title,
      order: chOrder++,
      skillTag: ch.skillTag,
      status: 'pending',
      preparation: {
        type: ch.recommendedContent.type,
        url: ch.recommendedContent.url,
        toolId: ch.recommendedContent.toolId,
        summary: ch.actionableSummary,
        estimatedMins: ch.estimatedMins,
        lastVerifiedAt: new Date().toISOString(),
      },
      validation: {
        method: 'objective',
      },
      notes: '',
      freshnessStatus: 'fresh',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(chRef, chData);
  }
  
  batch.update(moduleDoc.ref, {
    totalChapters: result.chapters.length,
    updatedAt: new Date().toISOString(),
  });
  
  await batch.commit();
  
  await logCareerEvent(userId, 'MODULE_INITIALIZED', { moduleId, chaptersGenerated: result.chapters.length });
  
  return { success: true, chaptersCount: result.chapters.length };
}

export async function generateChapterValidation(idToken: string, chapterId: string) {
  const userId = await getUserId(idToken);

  const chapterDoc = await adminDb.collection('users').doc(userId).collection('route_chapters').doc(chapterId).get();
  if (!chapterDoc.exists) throw new Error("Chapter not found");
  const chapter = chapterDoc.data() as RouteChapter;

  // Fetch user profile
  const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
  const userProfile = truncateProfileContext(profileDoc.data());

  // Fetch target role from route
  const routeDoc = await adminDb.collection('users').doc(userId).collection('routes').doc(chapter.routeId).get();
  const route = routeDoc.data() as Route;
  const targetJobTitle = route?.targetPosition?.title || 'Target Role';

  // Fetch seed questions from Knowledge Graph blueprint
  let seedQuestions: any[] = [];
  if (route?.blueprintId) {
    try {
      const blueprintDoc = await adminDb.collection('knowledge_graph/role_blueprints/blueprints').doc(route.blueprintId).get();
      if (blueprintDoc.exists) {
        const blueprint = blueprintDoc.data() as any;
        // Walk the blueprint tree to find matching chapter template by skillTag
        for (const cp of (blueprint.checkpointTemplates || [])) {
          for (const mod of (cp.moduleTemplates || [])) {
            for (const ch of (mod.chapterTemplates || [])) {
              if (ch.skillTag === chapter.skillTag && ch.seedQuestions) {
                seedQuestions = ch.seedQuestions;
                break;
              }
            }
            if (seedQuestions.length > 0) break;
          }
          if (seedQuestions.length > 0) break;
        }
      }
    } catch (e) {
      console.warn('Could not fetch seed questions from Knowledge Graph:', e);
    }
  }

  // Paywall Check
  const spendResult = await spendCredits(userId, 'generateValidation');
  if (!spendResult.allowed) {
    throw new Error(`Insufficient credits. Required: ${spendResult.required}, Remaining: ${spendResult.remaining}`);
  }

  let validation;
  try {
    validation = await generateValidationFlow({
      chapterTitle: chapter.title,
      skillTag: chapter.skillTag,
      validationMethod: chapter.validation.method,
      userProfile,
      targetJobTitle,
      seedQuestions,
    });
  } catch (error) {
    console.error("AI Validation Generation Failed:", error);
    throw new Error("Could not generate validation test at this time. Please try again later.");
  }

  return { success: true, validation };
}

export async function submitChapterValidation(idToken: string, chapterId: string, questions: any[], userAnswers: Record<string, string>) {
  const userId = await getUserId(idToken);

  const chapterDoc = await adminDb.collection('users').doc(userId).collection('route_chapters').doc(chapterId).get();
  if (!chapterDoc.exists) throw new Error("Chapter not found");
  const chapter = chapterDoc.data() as RouteChapter;

  let grade;
  try {
    grade = await gradeValidationFlow({
      questions,
      userAnswers,
    });
  } catch (error) {
    console.error("AI Grading Failed:", error);
    throw new Error("Grading engine is temporarily unavailable. Please submit your answers again.");
  }

  // Update Chapter
  await adminDb.collection('users').doc(userId).collection('route_chapters').doc(chapterId).update({
    'validation.passed': grade.passed,
    'validation.confidence': grade.confidenceScore,
    'validation.strengths': grade.strengths,
    'validation.gaps': grade.gaps,
    'validation.recommendation': grade.recommendation,
    'validation.completedAt': new Date().toISOString(),
    'status': grade.passed ? 'done' : chapter.status,
    'freshnessStatus': 'fresh',
    'lastValidatedAt': new Date().toISOString(),
    'updatedAt': new Date().toISOString(),
  });

  await logCareerEvent(userId, 'CHAPTER_VALIDATED', { chapterId, passed: grade.passed, score: grade.confidenceScore });

  // Recalculate route progress logic would go here
  await recalculateRouteProgress(userId, chapter.routeId);

  return { success: true, grade };
}

export async function markChapterDone(idToken: string, chapterId: string, bypassedValidation: boolean = false) {
  const userId = await getUserId(idToken);

  const chapterDoc = await adminDb.collection('users').doc(userId).collection('route_chapters').doc(chapterId).get();
  if (!chapterDoc.exists) throw new Error("Chapter not found");
  const chapter = chapterDoc.data() as RouteChapter;

  await adminDb.collection('users').doc(userId).collection('route_chapters').doc(chapterId).update({
    status: 'done',
    'validation.bypassed': bypassedValidation,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await logCareerEvent(userId, 'CHAPTER_COMPLETED', { chapterId, bypassedValidation });
  
  await recalculateRouteProgress(userId, chapter.routeId);

  return { success: true };
}

export async function recalculateActiveRouteProgress(userId: string) {
  const activeRoutes = await adminDb.collection('users').doc(userId)
    .collection('routes').where('isActive', '==', true).limit(1).get();
  
  if (!activeRoutes.empty) {
    const routeId = activeRoutes.docs[0].id;
    await recalculateRouteProgress(userId, routeId);
  }
}

export async function triggerActiveRouteRecalculation(idToken: string) {
  const userId = await getUserId(idToken);
  await recalculateActiveRouteProgress(userId);
  return { success: true };
}

export async function recalculateRouteProgress(userId: string, routeId: string) {
  // Aggregate chapter status up to modules -> checkpoints -> route
  // Note: For a production app, we would use Firestore transactions or a cloud function trigger.
  // This is a simplified server-side recalculation.
  
  const modulesSnapshot = await adminDb.collection('users').doc(userId).collection('route_modules').where('routeId', '==', routeId).get();
  const checkpointsSnapshot = await adminDb.collection('users').doc(userId).collection('route_checkpoints').where('routeId', '==', routeId).get();
  
  const batch = adminDb.batch();
  let totalRouteCheckpoints = checkpointsSnapshot.size;
  let completedRouteCheckpoints = 0;

  for (const cpDoc of checkpointsSnapshot.docs) {
    const cpId = cpDoc.id;
    const cpModules = modulesSnapshot.docs.filter(m => m.data().checkpointId === cpId);
    
    let totalModules = cpModules.length;
    let completedModules = 0;

    for (const modDoc of cpModules) {
      const modId = modDoc.id;
      const chaptersSnapshot = await adminDb.collection('users').doc(userId).collection('route_chapters').where('moduleId', '==', modId).get();
      
      const totalChapters = chaptersSnapshot.size;
      const completedChapters = chaptersSnapshot.docs.filter(c => c.data().status === 'done').length;
      
      if (completedChapters === totalChapters && totalChapters > 0) completedModules++;
      
      batch.update(modDoc.ref, { 
        totalChapters, 
        completedChapters,
        progress: totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0
      });
    }

    if (completedModules === totalModules && totalModules > 0) completedRouteCheckpoints++;
    
    batch.update(cpDoc.ref, {
      totalModules,
      completedModules,
      status: completedModules === totalModules ? 'completed' : cpDoc.data().status
    });
  }

  const routeRef = adminDb.collection('users').doc(userId).collection('routes').doc(routeId);
  batch.update(routeRef, {
    totalCheckpoints: totalRouteCheckpoints,
    completedCheckpoints: completedRouteCheckpoints,
    updatedAt: new Date().toISOString()
  });

  await batch.commit();
}

export async function getRouteData(idToken: string, routeId: string) {
  const userId = await getUserId(idToken);

  const routeDoc = await adminDb.collection('users').doc(userId).collection('routes').doc(routeId).get();
  if (!routeDoc.exists) throw new Error("Route not found");
  
  const checkpointsSnapshot = await adminDb.collection('users').doc(userId).collection('route_checkpoints').where('routeId', '==', routeId).orderBy('order', 'asc').get();
  const modulesSnapshot = await adminDb.collection('users').doc(userId).collection('route_modules').where('routeId', '==', routeId).orderBy('order', 'asc').get();
  const chaptersSnapshot = await adminDb.collection('users').doc(userId).collection('route_chapters').where('routeId', '==', routeId).orderBy('order', 'asc').get();

  return {
    success: true,
    route: routeDoc.data() as Route,
    checkpoints: checkpointsSnapshot.docs.map(d => d.data() as RouteCheckpoint),
    modules: modulesSnapshot.docs.map(d => d.data() as RouteModule),
    chapters: chaptersSnapshot.docs.map(d => d.data() as RouteChapter),
  };
}

export async function getChapterData(idToken: string, chapterId: string) {
  const userId = await getUserId(idToken);
  const chapterDoc = await adminDb.collection('users').doc(userId).collection('route_chapters').doc(chapterId).get();
  if (!chapterDoc.exists) throw new Error("Chapter not found");
  
  return {
    success: true,
    chapter: chapterDoc.data() as RouteChapter,
  };
}
