import { adminDb } from '@/lib/firebase-admin';
import { RouteStyle } from '@/types/route';
import { truncateProfileContext } from '@/lib/profile-utils';
import { buildCareerRouteFlow } from '@/ai/flows/build-career-route';
import { logCareerEvent } from '@/lib/memory-engine';
import { commitCredits, rollbackCredits } from '@/lib/credit-ledger';
import { Route, RouteCheckpoint, RouteModule } from '@/types/route';

export async function executeRouteGeneration(
  userId: string, 
  blueprintId: string, 
  optimizationStyle: RouteStyle, 
  targetJobTitle: string,
  jobId: string
) {
  const jobRef = adminDb.collection('users').doc(userId).collection('route_jobs').doc(jobId);
  
  try {
    await jobRef.update({ status: 'processing' });
    
    const blueprintDoc = await adminDb.collection('knowledge_graph/role_blueprints/blueprints').doc(blueprintId).get();
    const blueprint = blueprintDoc.data() as any;

    const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
    const profile = profileDoc.data();
    const userProfile = truncateProfileContext(profile);

    // 3. Generate Personalized Route
    const generatedRoute = await buildCareerRouteFlow({
      blueprint,
      userProfile,
      targetJobTitle,
      optimizationStyle
    });

    // 4. Save to Firestore (Flat structure linked by IDs)
    const routeRef = adminDb.collection('users').doc(userId).collection('routes').doc();
    const routeId = routeRef.id;

    const batch = adminDb.batch();

    // Root Route Document
    const routeData: Route = {
      id: routeId,
      userId,
      routeStyle: optimizationStyle,
      blueprintId,
      currentPosition: {
        title: profile?.currentTitle || 'Unknown',
        skills: profile?.skills || [],
      },
      targetPosition: {
        title: targetJobTitle,
      },
      estimatedWeeks: generatedRoute.estimatedTotalWeeks,
      routeConfidence: 0,
      routeHealth: 'on_track',
      totalCheckpoints: generatedRoute.checkpoints.length,
      completedCheckpoints: 0,
      isActive: true,
      selectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(routeRef, routeData);

    // Save Checkpoints, Modules, Chapters
    let cpOrder = 0;
    for (const cp of generatedRoute.checkpoints) {
      const cpRef = adminDb.collection('users').doc(userId).collection('route_checkpoints').doc();
      const checkpointId = cpRef.id;

      const cpData: RouteCheckpoint = {
        id: checkpointId,
        routeId,
        userId,
        title: cp.title,
        order: cpOrder++,
        skillCategory: 'technical',
        estimatedWeeks: cp.estimatedWeeks,
        readinessScore: 0,
        status: cp.dependencies.length > 0 ? 'locked' : 'active',
        dependencies: cp.dependencies,
        totalModules: cp.modules.length,
        completedModules: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      batch.set(cpRef, cpData);

      let modOrder = 0;
      for (const mod of cp.modules) {
        const modRef = adminDb.collection('users').doc(userId).collection('route_modules').doc();
        const moduleId = modRef.id;

        const modData: RouteModule = {
          id: moduleId,
          routeId,
          checkpointId,
          userId,
          title: mod.title,
          order: modOrder++,
          progress: 0,
          totalChapters: 0,
          completedChapters: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        batch.set(modRef, modData);
      }
    }

    // Deactivate other routes
    const existingRoutes = await adminDb.collection('users').doc(userId).collection('routes').where('isActive', '==', true).get();
    existingRoutes.forEach(doc => {
      batch.update(doc.ref, { isActive: false, updatedAt: new Date().toISOString() });
    });

    await batch.commit();

    await logCareerEvent(userId, 'ROUTE_GENERATED', { routeId, optimizationStyle, targetJobTitle });
    await commitCredits(userId, jobId);
    await jobRef.update({ status: 'completed', routeId });

    return { success: true, routeId };
  } catch (error: any) {
    console.error("Background AI Route Generation Failed:", error);
    await rollbackCredits(userId, 'buildRoute', jobId);
    await jobRef.update({ status: 'failed', error: error.message });
    throw error;
  }
}
