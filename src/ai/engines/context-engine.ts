'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getRelevantPatterns } from '@/ai/cin/intelligence-api';
import { truncateProfileContext } from '@/lib/profile-utils';

export interface UserContext {
  twin: any;
  activeJobs: any[];
  recentMemory: any[];
  cinPatterns: any[];
}

/**
 * The Context Engine hydrates all necessary state for AI decision making in a single, parallelized call.
 * This prevents duplicated database reads across different flows (Missions, Radar, ATS).
 */
export async function hydrateUserContext(userId: string): Promise<UserContext> {
  const profileRef = adminDb.collection('users').doc(userId).collection('profile').doc('main-profile');
  const jobsRef = adminDb.collection('users').doc(userId).collection('jobs').limit(5);
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const memoryRef = adminDb.collection('users').doc(userId).collection('memory')
    .where('timestamp', '>=', sevenDaysAgo)
    .orderBy('timestamp', 'desc');

  // Parallel fetch to minimize latency
  const [profileDoc, jobsSnapshot, memorySnapshot] = await Promise.all([
    profileRef.get(),
    jobsRef.get(),
    memoryRef.get()
  ]);

  const twin = profileDoc.data() || {};
  const activeJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const recentMemory = memorySnapshot.docs.map(doc => doc.data());

  // Derive target roles for CIN pattern fetching
  let targetRoles = twin.targetRoles || [];
  if (targetRoles.length === 0 && activeJobs.length > 0) {
    targetRoles = activeJobs.map(j => j.title);
  }

  const cinPatterns = await getRelevantPatterns(targetRoles);
  const truncatedTwin = JSON.parse(truncateProfileContext(twin));

  return {
    twin: truncatedTwin,
    activeJobs,
    recentMemory,
    cinPatterns
  };
}
