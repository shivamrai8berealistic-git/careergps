'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { computeRoute } from '@/ai/flows/compute-route';
import { truncateProfileContext } from '@/lib/profile-utils';

/**
 * Validates the user's Firebase ID token safely on the server.
 */
async function getUserId(idToken: string): Promise<string> {
  if (!idToken) {
      throw new Error('Unauthorized: No token provided');
  }
  
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

export async function generateRouteForJob(idToken: string, jobId: string) {
  const userId = await getUserId(idToken);

  // 1. Fetch Job
  const jobDoc = await adminDb.collection('users').doc(userId).collection('jobs').doc(jobId).get();
  if (!jobDoc.exists) throw new Error("Job not found");
  const job = jobDoc.data();

  // 2. Fetch Profile
  const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
  const profile = profileDoc.data();

  // 3. Fetch Primary Resume Data (if any)
  const resumesSnapshot = await adminDb.collection('users').doc(userId).collection('resumes').where('isPrimary', '==', true).limit(1).get();
  let resumeText = '';
  if (!resumesSnapshot.empty) {
    const resumeId = resumesSnapshot.docs[0].id;
    const parsedDoc = await adminDb.collection('users').doc(userId).collection('resumes').doc(resumeId).collection('parsedResumeData').doc('parsedResumeData').get();
    if (parsedDoc.exists) {
       resumeText = JSON.stringify(parsedDoc.data());
    }
  }

  // 4. Construct Profile Text
  const userProfileText = truncateProfileContext(profile);

  // 5. Compute Route
  const route = await computeRoute({
    userId,
    jobTitle: job?.title || 'Unknown Role',
    jobDescription: job?.description || '',
    userProfile: userProfileText,
    userResume: resumeText
  });

  // 6. Update Job Document
  await adminDb.collection('users').doc(userId).collection('jobs').doc(jobId).update({
    destinationState: 'ready',
    computedRoute: route,
    updatedAt: new Date()
  });

  return { success: true, route };
}
