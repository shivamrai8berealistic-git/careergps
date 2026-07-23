'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { generateWeeklyReview } from '@/ai/flows/weekly-review';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

export async function fetchMemoryTimeline(idToken: string) {
  const userId = await getUserId(idToken);
  
  const eventsSnapshot = await adminDb.collection('users').doc(userId).collection('memory')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();
    
  return eventsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate().toISOString()
  }));
}

export async function runWeeklyReview(idToken: string) {
  const userId = await getUserId(idToken);
  
  const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
  const currentTwin = profileDoc.data() || {};
  
  // Idempotency / Lazy evaluation: Only run if it's been 7 days since last review
  const lastReviewTime = currentTwin.lastWeeklyReview?.toDate()?.getTime() || 0;
  const now = new Date().getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  if (now - lastReviewTime < sevenDays) {
    // If we already have a recent review, return the cached insights
    if (currentTwin.latestInsights) {
      return { success: true, fromCache: true, data: currentTwin.latestInsights };
    }
  }

  // Fetch past 7 days of events
  const sevenDaysAgo = new Date(now - sevenDays);
  const eventsSnapshot = await adminDb.collection('users').doc(userId).collection('memory')
    .where('timestamp', '>=', sevenDaysAgo)
    .orderBy('timestamp', 'desc')
    .get();
  
  const recentEvents = eventsSnapshot.docs.map(doc => doc.data());

  // Fetch the twin snapshot from roughly 7 days ago
  const snapshots = await adminDb.collection('users').doc(userId).collection('twinSnapshots')
    .where('createdAt', '<=', sevenDaysAgo)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
    
  const previousTwin = snapshots.empty ? null : snapshots.docs[0].data();

  // Run AI Flow
  const result = await generateWeeklyReview({
    currentTwin,
    previousTwin,
    recentEvents
  });

  // Cache the insights
  await profileDoc.ref.update({
    lastWeeklyReview: new Date(),
    latestInsights: result
  });

  return { success: true, fromCache: false, data: result };
}
