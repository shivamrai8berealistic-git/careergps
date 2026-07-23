'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { buildOnboardingTwin } from '@/ai/flows/onboarding-twin-builder';
import { computeRoute } from '@/ai/flows/compute-route';
import { claimProfileCompletionReward } from './credit-rewards';
import { logCareerEvent } from '@/lib/memory-engine';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

export async function submitOnboarding(idToken: string, rawInputs: any) {
  const userId = await getUserId(idToken);
  
  // 1. Generate the Intelligence Snapshot
  const twinIntelligence = await buildOnboardingTwin(rawInputs);

  const batch = adminDb.batch();
  const profileRef = adminDb.collection('users').doc(userId).collection('profile').doc('main-profile');

  // 2. Save Raw Inputs + Computed Intelligence atomically
  batch.set(profileRef, {
    isOnboarded: true,
    currentRole: twinIntelligence.extractedRole,
    rawResumeText: rawInputs.rawResumeText,
    keySkills: twinIntelligence.skillGraph,
    rawOnboardingInputs: {
      destinations: rawInputs.destinations,
      preferences: rawInputs.preferences,
      constraints: rawInputs.constraints,
      goals: rawInputs.goals,
    },
    careerScore: twinIntelligence.careerScore,
    healthMetrics: twinIntelligence.healthMetrics,
    careerDNA: twinIntelligence.careerDNA,
    opportunityRadar: twinIntelligence.opportunityRadar,
    salaryEstimate: twinIntelligence.salaryEstimate,
    bottlenecks: twinIntelligence.bottlenecks,
    twinSummary: `Your Career Twin is active. You have a ${twinIntelligence.careerScore}/100 market score with strong potential in ${twinIntelligence.opportunityRadar[0] || 'your field'}.`,
    lastIntelligenceSync: new Date(),
    updatedAt: new Date()
  }, { merge: true });

  // 3. Automatically Create Target Destinations (Point B)
  // Take the top recommended destination (or the user's first explicit choice)
  const topTarget = rawInputs.destinations[0] || twinIntelligence.recommendedDestinations[0] || 'Software Engineer';
  
  const jobRef = adminDb.collection('users').doc(userId).collection('jobs').doc();
  batch.set(jobRef, {
    title: topTarget,
    company: "Target Industry Average",
    description: "An optimal role calculated by your Career GPS based on your twin and goals.",
    status: 'saved',
    destinationState: 'analyzing', // Will be set to 'ready' after computeRoute
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Also reward them 5 credits for completing their profile
  await batch.commit();

  // 4. Trigger initial Line X Calculation for the top target (fire and forget)
  (async () => {
    try {
      const route = await computeRoute({
        userId,
        jobTitle: topTarget,
        jobDescription: "Industry standard requirements for this role.",
        userProfile: JSON.stringify({ careerDNA: twinIntelligence.careerDNA, skills: twinIntelligence.skillGraph }),
        userResume: rawInputs.rawResumeText
      });
      
      await jobRef.update({
        computedRoute: route,
        destinationState: 'ready',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Failed to automatically compute first route:", error);
    }
  })();

  // Attempt to credit reward (fire and forget)
  claimProfileCompletionReward(idToken).catch(e => console.error(e));

  // Log to Career Memory
  await logCareerEvent(userId, 'onboarding_completed', { initialScore: twinIntelligence.careerScore });

  return { success: true, twinData: twinIntelligence };
}
