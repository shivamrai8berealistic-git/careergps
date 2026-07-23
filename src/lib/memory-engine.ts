import { adminDb, admin } from './firebase-admin';

export type CareerEventType = 
  | 'onboarding_completed'
  | 'resume_uploaded'
  | 'resume_rewritten'
  | 'ats_scan_run'
  | 'simulator_executed'
  | 'destination_added'
  | 'bottleneck_fixed'
  | 'skill_added'
  | 'interview_scheduled'
  | 'offer_received'
  | 'mission_task_completed'
  | 'route_accelerated'
  | 'proof_improved'
  | 'salary_impact_gained'
  | 'tool_used_public'
  | 'proof_analyzed';

export interface CareerEvent {
  type: CareerEventType;
  userId: string;
  timestamp: admin.firestore.Timestamp;
  metadata?: Record<string, any>;
  expiresAt?: Date; // For Firestore TTL
}

export async function logCareerEvent(userId: string, type: CareerEventType, metadata?: Record<string, any>) {
  if (!userId) return;
  
  try {
    const eventRef = adminDb.collection('users').doc(userId).collection('memory').doc();
    
    // Set TTL for 90 days
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const event: CareerEvent = {
      type,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      metadata: metadata || {},
      expiresAt
    };

    await eventRef.set(event);

    // Momentum System: Bump momentum for taking action
    const profileRef = adminDb.collection('users').doc(userId).collection('profile').doc('main-profile');
    const profileDoc = await profileRef.get();
    let momentum = profileDoc.data()?.momentumScore || 0;
    
    // Cap momentum at 100
    momentum = Math.min(100, momentum + 2);

    await profileRef.set({ momentumScore: momentum }, { merge: true });

    return eventRef.id;
  } catch (error) {
    console.error(`Failed to log career event [${type}] for user ${userId}:`, error);
  }
}
