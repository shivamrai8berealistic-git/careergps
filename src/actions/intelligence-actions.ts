'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { careerTwinSync } from '@/ai/flows/career-twin-sync';
import { careerSimulator } from '@/ai/flows/career-simulator';
import { spendCredits } from '@/lib/credit-ledger';
import { logCareerEvent } from '@/lib/memory-engine';
import { truncateProfileContext } from '@/lib/profile-utils';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

async function fetchTwinData(userId: string) {
  const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
  const profile = profileDoc.data() || {};
  
  const resumesSnapshot = await adminDb.collection('users').doc(userId).collection('resumes').where('isPrimary', '==', true).limit(1).get();
  let resumeText = '';
  if (!resumesSnapshot.empty) {
    const resumeId = resumesSnapshot.docs[0].id;
    const parsedDoc = await adminDb.collection('users').doc(userId).collection('resumes').doc(resumeId).collection('parsedResumeData').doc('parsedResumeData').get();
    if (parsedDoc.exists) {
       resumeText = JSON.stringify(parsedDoc.data());
    }
  }

  // Fallback to raw text if parsing didn't happen yet
  if (!resumeText && profile.rawResumeText) {
    resumeText = profile.rawResumeText;
  }

  const truncatedProfileString = truncateProfileContext(profile);
  return { userProfile: truncatedProfileString, userResume: resumeText };
}

export async function runTwinSync(idToken: string) {
  const userId = await getUserId(idToken);
  
  const profileRef = adminDb.collection('users').doc(userId).collection('profile').doc('main-profile');
  
  // Idempotency check: Don't run if already syncing
  const profileDoc = await profileRef.get();
  if (profileDoc.exists && profileDoc.data()?.isSyncingTwin) {
     return { success: false, reason: "Already syncing" };
  }
  
  // Lock the sync
  await profileRef.set({ isSyncingTwin: true }, { merge: true });

  try {
    const data = await fetchTwinData(userId);

    const result = await careerTwinSync(data);

    // [NEW] Save Twin Snapshot for history
    const snapshotRef = adminDb.collection('users').doc(userId).collection('twinSnapshots').doc();
    await snapshotRef.set({
      careerScore: result.careerScore,
      healthMetrics: result.healthMetrics,
      bottlenecks: result.bottlenecks,
      radarMatches: result.radarMatches,
      twinSummary: result.summary,
      createdAt: new Date()
    });

    // Update profile with twin intelligence and unlock
    await profileRef.set({
      careerScore: result.careerScore,
      healthMetrics: result.healthMetrics,
      bottlenecks: result.bottlenecks,
      radarMatches: result.radarMatches,
      twinSummary: result.summary,
      lastIntelligenceSync: new Date(),
      isSyncingTwin: false 
    }, { merge: true });

    return { success: true, data: result };
  } catch (err) {
    // Release lock on failure
    await profileRef.set({ isSyncingTwin: false }, { merge: true });
    throw err;
  }
}

export async function runSimulator(idToken: string, scenarioQuery: string) {
  const userId = await getUserId(idToken);
  
  // High compute cost action
  const quota = await spendCredits(userId, 'careerSimulator');
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: This high-compute simulation requires ${quota.required} credits. You have ${quota.remaining} credits.`);
  }

  const data = await fetchTwinData(userId);
  const result = await careerSimulator({ ...data, scenarioQuery });

  // Optionally log the simulation to history
  await adminDb.collection('users').doc(userId).collection('simulations').add({
    query: scenarioQuery,
    result,
    createdAt: new Date()
  });

  // Log to Career Memory
  await logCareerEvent(userId, 'simulator_executed', { query: scenarioQuery, salaryDelta: result.projectedSalaryDelta });

  return { success: true, data: result };
}
