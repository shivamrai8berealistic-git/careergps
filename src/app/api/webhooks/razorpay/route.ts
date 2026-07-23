export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { recordTransaction } from '@/lib/credit-ledger';
import { PREMIUM_BENEFITS } from '@/lib/credit-config';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  let eventId: string | null = null;
  
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    eventId = req.headers.get('x-razorpay-event-id');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (!eventId) {
      console.warn('Webhook received without event ID in headers');
      return NextResponse.json({ error: 'Missing event ID' }, { status: 200 }); // 200 to prevent retries
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 200 }); // 200 to prevent retries
    }

    const eventRef = adminDb.collection('webhook_events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      console.log(`[Webhook] Duplicate event blocked: ${eventId}`);
      return NextResponse.json({ status: 'ok', duplicated: true }, { status: 200 });
    }

    await eventRef.set({
      eventId,
      status: 'processing',
      receivedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const event = JSON.parse(body);
    const eventType = event.event;

    const subscription = event.payload?.subscription?.entity;

    console.log(`[Webhook] Event ID: ${eventId}`);
    console.log(`[Webhook] Event Type: ${eventType}`);

    if (!subscription) {
      console.warn('Webhook event missing subscription entity');

      await eventRef.update({
        status: 'processed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        note: 'ignored_missing_subscription'
      });

      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const userId = subscription.notes?.userId;
    console.log(`[Webhook] User ID: ${userId}`);

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        if (userId) {
          await adminDb.collection('users').doc(userId).set({
            plan: 'pro',
            subscriptionStatus: 'active',
            subscriptionId: subscription.id,
            currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
            updatedAt: new Date()
          }, { merge: true });

          if (eventType === 'subscription.charged') {
            const idempotencyKey = `sub_charged_${subscription.id}_${event.created_at || Date.now()}`;
            await recordTransaction({
              userId,
              type: 'monthly_recharge',
              amount: PREMIUM_BENEFITS.MONTHLY_CREDITS,
              direction: 'credit',
              idempotencyKey,
              description: 'Premium subscription credits granted'
            });
          }
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        if (userId) {
          await adminDb.collection('users').doc(userId).set({
            subscriptionStatus: 'inactive',
            updatedAt: new Date()
          }, { merge: true });
        }
        break;
      }
    }

    await eventRef.update({
      status: 'processed',
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    
    if (eventId) {
      await adminDb.collection('webhook_events').doc(eventId).update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
    }

    return NextResponse.json({ status: 'error', message: 'Webhook processing failed but returning 200' }, { status: 200 });
  }
}
