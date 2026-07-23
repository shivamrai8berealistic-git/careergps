'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { computeRoute } from '@/ai/flows/compute-route';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

export async function convertGuestSession(idToken: string, resumeText: string, jobText: string, toolContext?: any) {
  const userId = await getUserId(idToken);

  const batch = adminDb.batch();
  
  // 1. Create/Update Profile with raw resume text (Point A) and any tool context (e.g. linkedin headline)
  const profileRef = adminDb.collection('users').doc(userId).collection('profile').doc('main-profile');
  
  const profileData: any = {
    rawResumeText: resumeText,
    updatedAt: new Date()
  };
  
  if (toolContext) {
    if (toolContext.linkedinHeadline) profileData.linkedinHeadline = toolContext.linkedinHeadline;
    if (toolContext.githubUrl) profileData.githubUrl = toolContext.githubUrl;
  }
  
  batch.set(profileRef, profileData, { merge: true });

  // 2. Create Job Destination (Point B) if jobText is provided
  let jobRef = null;
  if (jobText) {
    jobRef = adminDb.collection('users').doc(userId).collection('jobs').doc();
    
    // Try to extract a rough title/company from the job text (in a real app, AI would do this)
    const jobPreview = jobText.substring(0, 100).replace(/\n/g, ' ');
    
    batch.set(jobRef, {
      title: toolContext?.targetRole || "Imported Job Destination",
      company: jobPreview,
      description: jobText,
      status: 'saved',
      destinationState: 'analyzing', // Marks it for GPS route computation
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // 3. Log the tool usage in memory ledger
  if (toolContext?.toolUsed) {
    const memoryRef = adminDb.collection('users').doc(userId).collection('memory').doc();
    batch.set(memoryRef, {
      type: 'tool_used_public',
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { tool: toolContext.toolUsed, ...toolContext }
    });
  }

  await batch.commit();

  // 4. Automatically trigger Line X route calculation if job exists
  if (jobRef && jobText) {
    try {
      const route = await computeRoute({
        userId,
        jobTitle: toolContext?.targetRole || "Imported Job Destination",
        jobDescription: jobText,
        userProfile: JSON.stringify({ rawResumeText: resumeText }),
        userResume: resumeText
      });
      
      // Update the job with the calculated route
      await jobRef.update({
        computedRoute: route,
        destinationState: 'ready',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Failed to automatically compute route for imported job:", error);
    }
  }

  return { success: true, newJobId: jobRef?.id };
}
