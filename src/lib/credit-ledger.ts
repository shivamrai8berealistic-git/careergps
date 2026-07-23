import { adminDb, admin } from './firebase-admin';
import { 
  CreditTransactionType, 
  CREDIT_REWARDS, 
  CREDIT_COSTS, 
  AIAction, 
  UserPlan,
  PREMIUM_BENEFITS
} from './credit-config';
import { format } from 'date-fns';

export interface WalletData {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastMonthlyRechargeDate: string; // e.g. "2026-06"
  // Reward Statuses
  hasReceivedSignupReward: boolean;
  hasReceivedProfileReward: boolean;
  hasReceivedFirstJobReward: boolean;
}

export interface TransactionData {
  userId: string;
  type: CreditTransactionType;
  amount: number;
  direction: 'credit' | 'debit';
  timestamp: admin.firestore.Timestamp;
  sourceMetadata?: Record<string, any>;
  idempotencyKey: string;
  description: string;
  status?: 'pending' | 'completed' | 'refunded';
}

const DEFAULT_WALLET: WalletData = {
  balance: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
  lastMonthlyRechargeDate: '',
  hasReceivedSignupReward: false,
  hasReceivedProfileReward: false,
  hasReceivedFirstJobReward: false,
};

/**
 * Core engine for recording any credit change.
 * Ensures atomicity and idempotency.
 */
export async function recordTransaction(params: {
  userId: string;
  type: CreditTransactionType;
  amount: number;
  direction: 'credit' | 'debit';
  sourceMetadata?: Record<string, any>;
  idempotencyKey: string;
  description: string;
  status?: 'pending' | 'completed' | 'refunded';
}) {
  const { userId, type, amount, direction, sourceMetadata, idempotencyKey, description, status = 'completed' } = params;
  
  if (amount < 0) throw new Error("Amount must be positive.");
  if (amount === 0) return { success: true, reason: "zero_amount" };

  const walletRef = adminDb.collection('users').doc(userId).collection('wallet').doc('main');
  // Use idempotency key as the transaction document ID to enforce uniqueness natively
  const txnRef = adminDb.collection('users').doc(userId).collection('transactions').doc(idempotencyKey);

  return await adminDb.runTransaction(async (transaction) => {
    // 1. Check idempotency
    const txnDoc = await transaction.get(txnRef);
    if (txnDoc.exists) {
      return { success: false, reason: "idempotency_key_exists", code: "ALREADY_APPLIED" };
    }

    // 2. Get current wallet state
    const walletDoc = await transaction.get(walletRef);
    let wallet = walletDoc.exists ? (walletDoc.data() as WalletData) : { ...DEFAULT_WALLET };

    // 3. Ensure sufficient funds for debit
    if (direction === 'debit' && wallet.balance < amount) {
      return { 
        success: false, 
        reason: "insufficient_funds", 
        code: "INSUFFICIENT_FUNDS",
        required: amount,
        remaining: wallet.balance
      };
    }

    // 4. Update Wallet state
    if (direction === 'credit') {
      wallet.balance += amount;
      wallet.lifetimeEarned += amount;
    } else {
      wallet.balance -= amount;
      wallet.lifetimeSpent += amount;
    }

    // Update specific reward flags if applicable
    if (type === 'signup') wallet.hasReceivedSignupReward = true;
    if (type === 'profile_completion') wallet.hasReceivedProfileReward = true;
    if (type === 'first_application_tracked') wallet.hasReceivedFirstJobReward = true;
    if (type === 'monthly_recharge') {
       wallet.lastMonthlyRechargeDate = format(new Date(), 'yyyy-MM');
    }

    // 5. Commit writes
    transaction.set(walletRef, wallet, { merge: true });
    
    const txnData: TransactionData = {
      userId,
      type,
      amount,
      direction,
      timestamp: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      sourceMetadata,
      idempotencyKey,
      description,
      status
    };
    transaction.set(txnRef, txnData);

    return { success: true, balance: wallet.balance, amount };
  });
}

/**
 * Helper to deduct credits for AI features.
 */
export async function spendCredits(userId: string, action: AIAction) {
  const cost = CREDIT_COSTS[action];
  if (cost === 0) {
     return { allowed: true, required: 0, remaining: -1 }; // -1 indicates bypass
  }

  // Generate a somewhat unique idempotency key for this specific spend action.
  // We use timestamp + random to allow multiple spends of the same type.
  const idempotencyKey = `spend_${action}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const result = await recordTransaction({
    userId,
    type: 'feature_spend',
    amount: cost,
    direction: 'debit',
    idempotencyKey,
    description: `Used AI feature: ${action}`,
    sourceMetadata: { action }
  });

  if (result.success) {
    return { allowed: true, required: cost, remaining: result.balance };
  } else {
    return { allowed: false, required: cost, remaining: result.remaining };
  }
}

/**
 * Reserves credits for a long-running asynchronous operation.
 * Deducts balance immediately but marks transaction as 'pending'.
 */
export async function reserveCredits(userId: string, action: AIAction, operationId: string) {
  const cost = CREDIT_COSTS[action];
  if (cost === 0) {
     return { allowed: true, required: 0, remaining: -1 }; 
  }

  const result = await recordTransaction({
    userId,
    type: 'feature_spend',
    amount: cost,
    direction: 'debit',
    idempotencyKey: `reserve_${operationId}`,
    description: `Reserved AI feature: ${action}`,
    sourceMetadata: { action, operationId },
    status: 'pending'
  });

  if (result.success) {
    return { allowed: true, required: cost, remaining: result.balance };
  } else {
    return { allowed: false, required: cost, remaining: result.remaining };
  }
}

/**
 * Commits a previously reserved credit transaction, marking it 'completed'.
 */
export async function commitCredits(userId: string, operationId: string) {
  const txnRef = adminDb.collection('users').doc(userId).collection('transactions').doc(`reserve_${operationId}`);
  await txnRef.update({ status: 'completed' });
}

/**
 * Rolls back a previously reserved credit transaction.
 * Refunds the balance and marks the transaction as 'refunded'.
 */
export async function rollbackCredits(userId: string, action: AIAction, operationId: string) {
  const cost = CREDIT_COSTS[action];
  if (cost === 0) return;

  const txnRef = adminDb.collection('users').doc(userId).collection('transactions').doc(`reserve_${operationId}`);
  
  await adminDb.runTransaction(async (transaction) => {
    const txnDoc = await transaction.get(txnRef);
    if (!txnDoc.exists) return; // Nothing to rollback
    if (txnDoc.data()?.status !== 'pending') return; // Already completed or refunded

    const walletRef = adminDb.collection('users').doc(userId).collection('wallet').doc('main');
    const walletDoc = await transaction.get(walletRef);
    if (!walletDoc.exists) return;

    const wallet = walletDoc.data() as WalletData;
    wallet.balance += cost; // Refund
    // Do not adjust lifetimeSpent so it doesn't skew historical spending, 
    // or subtract it back. Usually safest to subtract back so lifetimeSpent reflects true spend.
    wallet.lifetimeSpent -= cost;

    transaction.set(walletRef, wallet, { merge: true });
    transaction.update(txnRef, { status: 'refunded', description: `Refunded AI feature (Failed): ${action}` });
  });
}

/**
 * Gets the user's wallet, ensuring it's initialized.
 */
export async function getWallet(userId: string): Promise<WalletData> {
  const walletRef = adminDb.collection('users').doc(userId).collection('wallet').doc('main');
  const doc = await walletRef.get();
  if (doc.exists) {
    return doc.data() as WalletData;
  }
  return { ...DEFAULT_WALLET };
}
