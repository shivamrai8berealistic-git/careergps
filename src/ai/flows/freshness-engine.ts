import { adminDb } from '@/lib/firebase-admin';
import { RouteChapter } from '@/types/route';

/**
 * Calculates freshness based on lastValidatedAt.
 * Fresh: < 30 days
 * Aging: 30 - 60 days
 * Stale: 60 - 90 days
 * Expired: > 90 days
 */
export function calculateFreshness(lastValidatedAt: Date | string): RouteChapter['freshnessStatus'] {
  const lastDate = new Date(lastValidatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays < 30) return 'fresh';
  if (diffDays < 60) return 'aging';
  if (diffDays < 90) return 'stale';
  return 'expired';
}

/**
 * This function should run as a daily cron job.
 * It sweeps all route_chapters across all users and updates their freshnessStatus.
 */
export async function runFreshnessSweep() {
  console.log('🧹 Starting Route Chapter Freshness Sweep...');
  
  // Since route_chapters is a subcollection across all users, 
  // we use a collectionGroup query in Firestore.
  const chaptersSnapshot = await adminDb.collectionGroup('route_chapters').get();
  
  let updatedCount = 0;
  const batch = adminDb.batch();
  
  let operationsInBatch = 0;

  for (const doc of chaptersSnapshot.docs) {
    const data = doc.data() as RouteChapter;
    if (data.status === 'done' && data.lastValidatedAt) {
      const currentFreshness = data.freshnessStatus;
      const newFreshness = calculateFreshness(data.lastValidatedAt);
      
      if (currentFreshness !== newFreshness) {
        batch.update(doc.ref, { 
          freshnessStatus: newFreshness,
          updatedAt: new Date().toISOString()
        });
        updatedCount++;
        operationsInBatch++;
        
        // Firestore batches max out at 500 operations
        if (operationsInBatch >= 450) {
          await batch.commit();
          operationsInBatch = 0;
        }
      }
    }
  }

  if (operationsInBatch > 0) {
    await batch.commit();
  }

  console.log(`✅ Freshness Sweep Complete. Updated ${updatedCount} chapters.`);
  return { success: true, updatedCount };
}
