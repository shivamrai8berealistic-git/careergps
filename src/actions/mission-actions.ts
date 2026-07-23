'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { generateDailyMission } from '@/ai/flows/daily-mission';
import { logCareerEvent } from '@/lib/memory-engine';
import { hydrateUserContext } from '@/ai/engines/context-engine';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

export async function fetchDailyMission(idToken: string, forceRecalculate = false) {
  const userId = await getUserId(idToken);
  
  // Format today's date as YYYY-MM-DD for the document ID
  const today = new Date().toISOString().split('T')[0];
  const missionRef = adminDb.collection('users').doc(userId).collection('missions').doc(today);

  if (!forceRecalculate) {
    const missionDoc = await missionRef.get();
    if (missionDoc.exists) {
      return { success: true, fromCache: true, mission: missionDoc.data() };
    }
  }

  // Hydrate all context via ContextEngine
  const context = await hydrateUserContext(userId);

  try {
    // Generate Mission and Route State in one single LLM pass
    const mission = await generateDailyMission({
      careerTwin: context.twin,
      activeJobs: context.activeJobs,
      recentMemory: context.recentMemory,
      cinPatterns: context.cinPatterns
    });

    const payload = {
      ...mission,
      generatedAt: new Date(),
      progress: 0
    };

    // Save to Firestore
    await missionRef.set(payload);

    return { success: true, fromCache: false, mission: payload };
  } catch (error) {
    console.error("Mission Engine LLM failed:", error);
    // Graceful fallback UI state
    return {
      success: false,
      fromCache: false,
      mission: {
        summary: "Intelligence Engine temporarily degraded. Your progress is safe.",
        estimatedTotalTime: 0,
        estimatedSalaryImpact: "---",
        totalScoreIncrease: 0,
        tasks: [],
        biggestOpportunity: "Systems analyzing... check back shortly.",
        biggestRisk: "---",
        progress: 0,
        routeState: {
          routeStatus: 'analyzing',
          routeCompletion: 0,
          estimatedMonths: 0
        }
      }
    };
  }
}

export async function markTaskCompleted(idToken: string, taskId: string) {
  const userId = await getUserId(idToken);
  const today = new Date().toISOString().split('T')[0];
  const missionRef = adminDb.collection('users').doc(userId).collection('missions').doc(today);

  const missionDoc = await missionRef.get();
  if (!missionDoc.exists) throw new Error("Mission not found");
  
  const mission = missionDoc.data() as any;
  const taskIndex = mission.tasks.findIndex((t: any) => t.id === taskId);
  
  if (taskIndex > -1 && !mission.tasks[taskIndex].isCompleted) {
    const completedTask = mission.tasks[taskIndex];
    mission.tasks[taskIndex].isCompleted = true;
    
    // Recalculate progress
    const completedCount = mission.tasks.filter((t: any) => t.isCompleted).length;
    mission.progress = mission.tasks.length > 0 ? Math.round((completedCount / mission.tasks.length) * 100) : 100;

    // Optimistically reduce ETA if available
    let optimisticEtaReduction = null;
    if (mission.routeState && mission.routeState.estimatedMonths > 0) {
       // Rough approximation: completing a major task cuts ETA slightly.
       // In a real app, the NavigationEngine would recalculate this.
       mission.routeState.estimatedMonths = Math.max(0.1, mission.routeState.estimatedMonths - 0.25); 
       optimisticEtaReduction = "-1 Week";
    }

    await missionRef.update({
      tasks: mission.tasks,
      progress: mission.progress,
      routeState: mission.routeState,
      updatedAt: new Date()
    });

    await logCareerEvent(userId, 'mission_task_completed' as any, { taskId, actionType: completedTask.actionType, title: completedTask.title });

    return { success: true, progress: mission.progress, optimisticEtaReduction };
  }

  return { success: false };
}

export async function markTaskRejected(idToken: string, taskId: string, reason: string = 'irrelevant') {
  const userId = await getUserId(idToken);
  const today = new Date().toISOString().split('T')[0];
  const missionRef = adminDb.collection('users').doc(userId).collection('missions').doc(today);

  const missionDoc = await missionRef.get();
  if (!missionDoc.exists) throw new Error("Mission not found");
  
  const mission = missionDoc.data() as any;
  const taskIndex = mission.tasks.findIndex((t: any) => t.id === taskId);
  
  if (taskIndex > -1) {
    // Remove the task or mark as rejected
    const rejectedTask = mission.tasks[taskIndex];
    mission.tasks.splice(taskIndex, 1);
    
    // Recalculate progress
    const completedCount = mission.tasks.filter((t: any) => t.isCompleted).length;
    mission.progress = mission.tasks.length > 0 ? Math.round((completedCount / mission.tasks.length) * 100) : 100;

    // Optimistically increase ETA (penalty for skipping)
    let optimisticEtaIncrease = null;
    if (mission.routeState && mission.routeState.estimatedMonths > 0) {
       mission.routeState.estimatedMonths = mission.routeState.estimatedMonths + 0.1;
       mission.routeState.routeStatus = 'delayed';
       optimisticEtaIncrease = "+4 Days (Skipped Task)";
    }

    await missionRef.update({
      tasks: mission.tasks,
      progress: mission.progress,
      routeState: mission.routeState,
      updatedAt: new Date()
    });

    // Log negative signal for CIN
    await logCareerEvent(userId, 'mission_task_rejected' as any, { 
      taskId, 
      actionType: rejectedTask.actionType,
      title: rejectedTask.title,
      reason 
    });

    return { success: true, progress: mission.progress, optimisticEtaIncrease };
  }

  return { success: false };
}
