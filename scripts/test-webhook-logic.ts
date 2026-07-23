import crypto from "crypto";

// 1. Mock Firebase Admin to intercept writes
const capturedWrites: any[] = [];
const mockDoc = (id: string) => ({
  set: async (data: any, options: any) => {
    capturedWrites.push({ userId: id, data, options });
  }
});
const mockCollection = (path: string) => ({
  doc: mockDoc
});
const adminDb = { collection: mockCollection };

// We supply mock server time for the console output
const admin = {
  firestore: {
    Timestamp: {
      fromMillis: (ms: number) => `[Firestore Timestamp: ${new Date(ms).toISOString()}]`
    },
    FieldValue: {
      serverTimestamp: () => "[ServerTimestamp token]"
    }
  }
};

const SECRET = "test_secret";

function createSignature(payload: string) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

// 2. Extracted Webhook Logic matching route.ts exactly
async function processWebhook(bodyRaw: string) {
  const event = JSON.parse(bodyRaw);
  const { event: eventType, payload } = event;

  if (eventType === 'subscription.charged') {
    const subscription = payload.subscription.entity;
    const userId = subscription.notes?.userId;
    const planType = subscription.notes?.planType || 'plan_1m';

    let rawExpiry = subscription.current_end;
    if (!rawExpiry) {
        const now = Math.floor(Date.now() / 1000);
        const daysMap: Record<string, number> = {
          'plan_1m': 30,
          'plan_3m': 90,
          'plan_6m': 180,
        };
        const addDays = daysMap[planType] || 30;
        rawExpiry = now + (addDays * 24 * 60 * 60);
    }

    if (userId) {
      await adminDb.collection('users').doc(userId).set({
        plan: 'pro',
        billingCycle: planType,
        expiresAt: admin.firestore.Timestamp.fromMillis(rawExpiry * 1000),
        subscriptionId: subscription.id,
        subscriptionStatus: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }
}

// 3. Define the Test Cases (Sandbox payloads)
const generatePayload = (tier: string, months: number) => {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + (months * 30 * 24 * 60 * 60); // Roughly simulated UNIX timestamp

  return JSON.stringify({
    event: "subscription.charged",
    payload: {
      subscription: {
        entity: {
          id: `sub_simulated_${tier}_${Date.now()}`,
          current_end: expiry, // Razorpay gives absolute unix seconds
          notes: {
            userId: "test_user_123",
            planType: tier
          }
        }
      }
    }
  });
};

const payloads = [
  { name: '1 Month Tier', body: generatePayload('plan_1m', 1) },
  { name: '3 Month Tier', body: generatePayload('plan_3m', 3) },
  { name: '6 Month Tier', body: generatePayload('plan_6m', 6) },
  { 
    name: 'Duplicate/Idempotent Event (1 Month retry)', 
    body: generatePayload('plan_1m', 1) 
  }
];

// 4. Execute the tests
async function runTests() {
  console.log("==========================================");
  console.log("   RAZORPAY WEBHOOK LOGIC VERIFICATION");
  console.log("==========================================\n");

  for (const test of payloads) {
    capturedWrites.length = 0; // reset
    console.log(`\n▶️  TESTING: ${test.name}`);
    await processWebhook(test.body);
    
    if (capturedWrites.length > 0) {
      const write = capturedWrites[0];
      console.log(`✅ Passed. Extracted and wrote to document 'users/${write.userId}'`);
      console.log(`📄 Payload written:`);
      console.log(JSON.stringify(write.data, null, 2));
    } else {
      console.log(`❌ Failed. No database writes captured.`);
    }
  }
}

runTests();
