import { adminDb, admin } from './firebase-admin';
import { format } from 'date-fns';
import { CREDIT_COSTS, AIAction, UserPlan, INITIAL_FREE_CREDITS, MONTHLY_FREE_CREDITS, PRO_MONTHLY_CREDITS } from './quota-limits';

export { CREDIT_COSTS };
export type { UserPlan, AIAction };

export async function deductCredits(userId: string, action: AIAction) {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const userRef = adminDb.collection('users').doc(userId);
  const usageRef = userRef.collection('usage').doc('current');
  const cost = CREDIT_COSTS[action] || 0;

  // Use a transaction to ensure atomicity
  return await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const usageDoc = await transaction.get(usageRef);

    let plan: UserPlan = 'free';
    if (userDoc.exists) {
      plan = userDoc.data()?.plan || 'free';
    } else {
      // Initialize user if missing
      transaction.set(userRef, {
        plan: 'free',
        subscriptionStatus: 'none',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Lazy initialization of usage doc
    if (!usageDoc.exists) {
       // First time ever using the app
       const initialCredits = plan === 'pro' ? PRO_MONTHLY_CREDITS : INITIAL_FREE_CREDITS;
       
       if (initialCredits < cost) {
          return { allowed: false, plan, required: cost, remaining: initialCredits };
       }

       transaction.set(usageRef, {
         month: currentMonth,
         creditsRemaining: initialCredits - cost,
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
       });
       
       return { allowed: true, plan, remaining: initialCredits - cost, cost };
    }

    const currentUsage = usageDoc.data()!;
    let creditsRemaining = currentUsage.creditsRemaining ?? 0;

    // Monthly recharge logic
    if (currentUsage.month !== currentMonth) {
       if (plan === 'pro') {
          creditsRemaining = PRO_MONTHLY_CREDITS;
       } else {
          // Carry over previous credits and add monthly bonus
          creditsRemaining += MONTHLY_FREE_CREDITS;
       }
       
       if (creditsRemaining < cost) {
          return { allowed: false, plan, required: cost, remaining: creditsRemaining };
       }

       transaction.set(usageRef, {
         month: currentMonth,
         creditsRemaining: creditsRemaining - cost,
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
       });

       return { allowed: true, plan, remaining: creditsRemaining - cost, cost };
    }

    // Normal deduction in the same month
    if (creditsRemaining < cost) {
      return { allowed: false, plan, required: cost, remaining: creditsRemaining };
    }

    transaction.update(usageRef, {
      creditsRemaining: admin.firestore.FieldValue.increment(-cost),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      allowed: true, 
      plan, 
      remaining: creditsRemaining - cost,
      cost
    };
  });
}
