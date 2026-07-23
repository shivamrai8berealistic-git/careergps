import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

export function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay keys are missing in environment variables');
    // Return a dummy instance during build if keys are missing
    razorpayInstance = { dummy: true } as any;
    return razorpayInstance;
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

export async function createSubscription(userId: string, planId: string) {
  const razorpay = getRazorpay();

  // Map internal plan IDs → Razorpay plan IDs (from env)
  const planMap: Record<string, string | undefined> = {
    plan_1m: process.env.RAZORPAY_PLAN_ID_1M,
    plan_3m: process.env.RAZORPAY_PLAN_ID_3M,
    plan_6m: process.env.RAZORPAY_PLAN_ID_6M,
  };

  const razorpayPlanId = planMap[planId];

  // Safety check
  if (!razorpayPlanId) {
    console.error('PLAN CONFIG ERROR:', {
      receivedPlanId: planId,
      availablePlans: planMap,
    });

    throw new Error(
      `Razorpay Plan ID for ${planId} is not configured in environment variables.`
    );
  }

  // Better total_count (1 year billing instead of 2056)
  const totalCountMap: Record<string, number> = {
    plan_1m: 12, // 12 months
    plan_3m: 4,  // 4 quarters
    plan_6m: 2,  // 2 half-years
  };

  const totalCount = totalCountMap[planId] || 12;

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: totalCount,
      notes: {
        userId: userId,
        planType: planId,
      },
    });

    return subscription;
  } catch (error: any) {
    console.error('Razorpay subscription creation failed:', error);

    throw new Error(
      error?.error?.description ||
      error?.message ||
      'Failed to create Razorpay subscription'
    );
  }
}
