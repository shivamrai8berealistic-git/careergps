'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { executeMatch } from '@/ai/engines/match-engine';
import { logCareerEvent } from '@/lib/memory-engine';
import { recordTransaction } from '@/lib/credit-ledger';
import { CREDIT_COSTS } from '@/lib/credit-config';

export async function acceptResumeChanges(idToken: string, jobId: string, updatedRoute: any) {
  const userId = await getUserId(idToken);
  
  const jobRef = adminDb.collection('users').doc(userId).collection('jobs').doc(jobId);
  await jobRef.update({
    computedRoute: updatedRoute,
    updatedAt: new Date()
  });

  return { success: true };
}

export async function importJobAction(idToken: string, jobData: any) {
  const userId = await getUserId(idToken);
  
  const jobRef = await adminDb.collection('users').doc(userId).collection('jobs').add({
    ...jobData,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return { success: true, id: jobRef.id };
}

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

async function fetchUserContext(userId: string, jobId: string) {
  // 1. Fetch Job
  const jobDoc = await adminDb.collection('users').doc(userId).collection('jobs').doc(jobId).get();
  if (!jobDoc.exists) throw new Error("Job not found");
  const job = jobDoc.data() as any;

  // 2. Fetch Profile
  const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
  const profile = profileDoc.data() || {};

  // 3. Fetch Primary Resume Data (if any)
  const resumesSnapshot = await adminDb.collection('users').doc(userId).collection('resumes').where('isPrimary', '==', true).limit(1).get();
  let resumeData = {} as any;
  if (!resumesSnapshot.empty) {
    const resumeId = resumesSnapshot.docs[0].id;
    const parsedDoc = await adminDb.collection('users').doc(userId).collection('resumes').doc(resumeId).collection('parsedResumeData').doc('parsedResumeData').get();
    if (parsedDoc.exists) {
       resumeData = parsedDoc.data();
    }
  }

  // Map to structured formats expected by Genkit flows
  const structuredJob = {
    title: job.title || 'Unknown',
    company: job.company || 'Unknown',
    description: job.description || '',
    requiredSkills: [],
    responsibilities: []
  };

  const structuredResume = {
    name: profile.fullName || resumeData?.name || 'Unknown',
    skills: profile.keySkills || resumeData?.skills || [],
    experience: resumeData?.experience || [],
    education: resumeData?.education || []
  };

  return { job, profile, structuredJob, structuredResume };
}

export async function executeDeepATSScan(idToken: string, jobId: string) {
  const userId = await getUserId(idToken);
  
  // Debit credit
  const txnResult = await recordTransaction({
    userId,
    type: 'feature_spend',
    amount: CREDIT_COSTS.jobFitAnalysis,
    direction: 'debit',
    idempotencyKey: `ats_scan_${jobId}_${Date.now()}`,
    description: 'Deep ATS Scan'
  });
  
  if (!txnResult.success) {
    throw new Error(`Insufficient credits for Deep ATS Scan`);
  }

  const context = await fetchUserContext(userId, jobId);

  const result = await executeMatch(context.structuredResume, context.structuredJob, false);

  // Write heavy AI report to subcollection to save egress costs
  await adminDb.collection('users').doc(userId)
    .collection('jobs').doc(jobId)
    .collection('ai_reports').doc('ats_scan')
    .set({
      report: result,
      updatedAt: new Date()
    });
    
  // Touch the main job doc lightly
  await adminDb.collection('users').doc(userId).collection('jobs').doc(jobId).update({
    hasAtsScan: true,
    updatedAt: new Date()
  });

  await logCareerEvent(userId, 'ats_scan_run', { jobId, score: result.matchScore });

  return { success: true, data: result };
}

export async function executeResumeRewrite(idToken: string, jobId: string) {
  const userId = await getUserId(idToken);

  // Debit credit
  const txnResult = await recordTransaction({
    userId,
    type: 'feature_spend',
    amount: CREDIT_COSTS.resumeRewrite,
    direction: 'debit',
    idempotencyKey: `resume_rewrite_${jobId}_${Date.now()}`,
    description: 'Resume Rewrite'
  });
  
  if (!txnResult.success) {
    throw new Error(`Insufficient credits for Resume Rewrite`);
  }

  const context = await fetchUserContext(userId, jobId);

  const result = await executeMatch(context.structuredResume, context.structuredJob, true);

  // Write heavy AI report to subcollection to save egress costs
  await adminDb.collection('users').doc(userId)
    .collection('jobs').doc(jobId)
    .collection('ai_reports').doc('resume_rewrite')
    .set({
      report: result,
      updatedAt: new Date()
    });
    
  // Touch the main job doc lightly
  await adminDb.collection('users').doc(userId).collection('jobs').doc(jobId).update({
    hasResumeRewrite: true,
    updatedAt: new Date()
  });

  await logCareerEvent(userId, 'resume_rewritten', { jobId });

  return { success: true, data: result };
}
