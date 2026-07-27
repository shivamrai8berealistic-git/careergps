import { adminDb, admin } from './firebase-admin';

export interface RateLimitConfig {
  maxTokens: number;
  refillRateMs: number; // e.g. 60000 for 1 minute
}

// Limits heavy AI actions to 5 requests per minute per user to prevent abuse
const AI_ACTION_LIMIT: RateLimitConfig = {
  maxTokens: 5,
  refillRateMs: 60000,
};

/**
 * Enforces rate limits using a basic token bucket pattern in Firestore.
 * @returns { allowed: boolean, remaining: number, resetInMs?: number }
 */
export async function checkRateLimit(userId: string, actionType: 'ai_action'): Promise<{ allowed: boolean, remaining: number, resetInMs?: number }> {
  const limitRef = adminDb.collection('users').doc(userId).collection('rate_limits').doc(actionType);
  const config = actionType === 'ai_action' ? AI_ACTION_LIMIT : AI_ACTION_LIMIT;

  return await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(limitRef);
    const now = Date.now();

    if (!doc.exists) {
      // First time, initialize bucket
      transaction.set(limitRef, {
        tokens: config.maxTokens - 1,
        lastRefill: now
      });
      return { allowed: true, remaining: config.maxTokens - 1 };
    }

    const data = doc.data()!;
    let currentTokens = data.tokens as number;
    let lastRefill = data.lastRefill as number;

    const timePassed = now - lastRefill;
    
    // If refill period has passed, reset the bucket
    if (timePassed >= config.refillRateMs) {
      currentTokens = config.maxTokens;
      lastRefill = now;
    }

    if (currentTokens > 0) {
      transaction.set(limitRef, {
        tokens: currentTokens - 1,
        lastRefill
      }, { merge: true });
      return { allowed: true, remaining: currentTokens - 1 };
    }

    // Rate limited
    const resetInMs = config.refillRateMs - timePassed;
    return { allowed: false, remaining: 0, resetInMs };
  });
}

export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function isRateLimited(identifier: string, maxTokens: number = 5, windowMs: number = 60000): Promise<boolean> {
  const limitRef = adminDb.collection('public_rate_limits').doc(identifier);
  
  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(limitRef);
      const now = Date.now();
      
      if (!doc.exists) {
        transaction.set(limitRef, { tokens: maxTokens - 1, lastUpdate: now });
        return false;
      }
      
      const data = doc.data()!;
      const timePassed = now - data.lastUpdate;
      const tokensToAdd = Math.floor(timePassed / windowMs) * maxTokens;
      
      let newTokens = Math.min(data.tokens + tokensToAdd, maxTokens);
      
      if (newTokens > 0) {
        transaction.update(limitRef, { tokens: newTokens - 1, lastUpdate: now });
        return false;
      }
      
      return true;
    });
    return result;
  } catch (error) {
    console.error('Rate limit error:', error);
    return true; // Fail closed (block request to protect Genkit on contention)
  }
}
