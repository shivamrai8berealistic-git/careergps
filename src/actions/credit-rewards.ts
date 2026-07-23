'use server';

import { getAuth } from 'firebase-admin/auth';
import { admin, adminDb } from '@/lib/firebase-admin';
import { recordTransaction, getWallet } from '@/lib/credit-ledger';
import { CREDIT_REWARDS, PREMIUM_BENEFITS } from '@/lib/credit-config';
import { format } from 'date-fns';
import { logCareerEvent } from '@/lib/memory-engine';

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

/**
 * Triggers the +20 signup bonus.
 */
export async function processSignupReward(idToken: string) {
  try {
    const userId = await getUserId(idToken);
    const idempotencyKey = `signup_${userId}`;
    
    const result = await recordTransaction({
      userId,
      type: 'signup',
      amount: CREDIT_REWARDS.SIGNUP,
      direction: 'credit',
      idempotencyKey,
      description: 'Welcome bonus for signing up!'
    });
    
    // Log signup to Memory Engine for Analytics
    await logCareerEvent(userId, 'signup_completed', { timestamp: Date.now() });

    return result;
  } catch (error: any) {
    console.error("Failed to process signup reward:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Checks and applies the monthly recharge if eligible.
 */
export async function claimMonthlyRecharge(idToken: string) {
  try {
    const userId = await getUserId(idToken);
    const currentMonth = format(new Date(), 'yyyy-MM');
    const wallet = await getWallet(userId);

    if (wallet.lastMonthlyRechargeDate !== currentMonth) {
      // Check if user is Pro
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const plan = userDoc.data()?.plan || 'free';
      
      const amount = plan === 'pro' 
        ? PREMIUM_BENEFITS.MONTHLY_CREDITS 
        : CREDIT_REWARDS.MONTHLY_RECHARGE;

      const idempotencyKey = `recharge_${userId}_${currentMonth}`;

      return await recordTransaction({
        userId,
        type: 'monthly_recharge',
        amount,
        direction: 'credit',
        idempotencyKey,
        description: `Monthly recharge for ${currentMonth}`
      });
    }
    return { success: false, reason: 'already_recharged' };
  } catch (error: any) {
    console.error("Failed to claim monthly recharge:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Claims the one-time +5 reward for reaching 80% profile completeness.
 */
export async function claimProfileCompletionReward(idToken: string) {
  try {
    const userId = await getUserId(idToken);
    const wallet = await getWallet(userId);
    
    if (wallet.hasReceivedProfileReward) {
      return { success: false, reason: 'already_received' };
    }

    const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
    const score = profileDoc.data()?.profileCompletenessScore || 0;

    if (score >= 80) {
      const idempotencyKey = `profile_complete_${userId}`;
      return await recordTransaction({
        userId,
        type: 'profile_completion',
        amount: CREDIT_REWARDS.PROFILE_COMPLETION_80_PERCENT,
        direction: 'credit',
        idempotencyKey,
        description: 'Completed profile to 80%!'
      });
    }
    
    return { success: false, reason: 'score_too_low' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Claims +3 for uploading a new resume. Uses a hash to prevent spamming the same file.
 */
export async function claimResumeUploadReward(idToken: string, fileHash: string) {
  try {
    const userId = await getUserId(idToken);
    const idempotencyKey = `resume_upload_${userId}_${fileHash}`;
    
    return await recordTransaction({
      userId,
      type: 'resume_upload',
      amount: CREDIT_REWARDS.RESUME_UPLOAD,
      direction: 'credit',
      idempotencyKey,
      description: 'Uploaded a new resume'
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
