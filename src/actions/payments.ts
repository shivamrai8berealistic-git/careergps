'use server';

import { createSubscription } from '@/lib/razorpay';
import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

export async function initiateProSubscription(idToken: string, planId: string) {
  const userId = await getUserId(idToken);
  if (!planId) {
    return { success: false, error: 'Plan ID is required' };
  }

  try {
    const subscription = await createSubscription(userId, planId);
    
    // Store preliminary intent in DB
    await adminDb.collection('users').doc(userId).set({
      pendingSubscriptionId: subscription.id,
      pendingPlanId: planId,
      updatedAt: new Date(),
    }, { merge: true });

    return { 
      success: true, 
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    console.error('Subscription initiation failed:', error);
    return { success: false, error: error.message };
  }
}
