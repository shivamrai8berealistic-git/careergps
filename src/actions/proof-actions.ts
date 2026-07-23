'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { runCareerProofEngine } from '@/ai/engines/career-proof-engine';
import { hydrateUserContext } from '@/ai/engines/context-engine';
import { logCareerEvent } from '@/lib/memory-engine';
import { logger } from '@/lib/logger';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized');
  const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
  return decodedClaims.uid;
}

export async function fetchEmployerConfidence(idToken: string, forceRefresh = false) {
  const userId = await getUserId(idToken);

  const cacheRef = adminDb.collection('users').doc(userId).collection('proof').doc('latest');
  
  const cached = await cacheRef.get();
  
  // Hardened Cache: Enforce 1-hour minimum cooldown even on forceRefresh to prevent LLM cost abuse
  if (cached.exists) {
    const data = cached.data()!;
    const age = Date.now() - (data.generatedAt?.toMillis?.() || 0);
    
    // Normal cache: 48 hours. Force refresh cooldown: 1 hour.
    if (!forceRefresh && age < 48 * 60 * 60 * 1000) {
      return { success: true, fromCache: true, proof: data };
    }
    if (forceRefresh && age < 60 * 60 * 1000) {
      // Return cached data and softly reject the refresh if it's too soon
      return { success: true, fromCache: true, proof: data, rateLimited: true };
    }
  }

  try {
    // Hydrate full context
    const context = await hydrateUserContext(userId);
    
    // Wrap engine execution in our structured logger for observability
    const proofData = await logger.trackExecution('proof', userId, async () => {
      return await runCareerProofEngine(context.twin, context.activeJobs);
    });

    const payload = {
      ...proofData,
      generatedAt: new Date(),
    };

    await cacheRef.set(payload);

    await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').update({
      employerConfidenceScore: proofData.employerConfidenceScore,
      topProofGap: proofData.topProofGap,
      lastProofSync: new Date(),
    }).catch(() => {});

    await logCareerEvent(userId, 'proof_analyzed', {
      score: proofData.employerConfidenceScore,
      topGap: proofData.topProofGap,
    });

    return { success: true, fromCache: false, proof: payload };
  } catch (error) {
    logger.error(`Proof Engine failed to run for user ${userId}`, { engine: 'proof', userId });
    
    // Fallback to stale cache if available rather than crashing the UI
    if (cached.exists) {
      return { success: true, fromCache: true, proof: cached.data()!, error: true };
    }
    throw new Error('Failed to analyze employer confidence.');
  }
}
