'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { runRadarEngine } from '@/ai/flows/radar-engine';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

// Background worker function (runs outside the request lifecycle)
async function processRadarScanInBackground(userId: string, docId: string) {
  const radarRef = adminDb.collection('users').doc(userId).collection('radar').doc(docId);
  try {
    const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
    const careerTwin = profileDoc.data() || {};
    
    // Fallback to generic roles if none defined
    const targetRoles = careerTwin.targetRoles || ['Software Engineer'];

    const radarData = await runRadarEngine({
      careerTwin,
      targetRoles
    });

    const payload = {
      status: 'complete',
      ...radarData,
      generatedAt: new Date()
    };

    await radarRef.set(payload);
  } catch (error) {
    console.error("Background Radar Engine Error:", error);
    // On failure, set error so UI can recover
    await radarRef.set({ status: 'error', error: String(error) }, { merge: true });
  }
}

export async function fetchRadarOpportunities(idToken: string, forceRefresh = false) {
  const userId = await getUserId(idToken);
  
  // Cache radar results for 24h
  const today = new Date().toISOString().split('T')[0];
  const radarRef = adminDb.collection('users').doc(userId).collection('radar').doc(today);

  const doc = await radarRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    
    // If we're forcing a refresh, we wipe and restart
    if (forceRefresh) {
      await radarRef.set({ status: 'in_progress', requestedAt: new Date() });
      // Fire and forget
      processRadarScanInBackground(userId, today).catch(console.error);
      return { success: true, status: 'in_progress' };
    }

    // If it's already complete, return it (legacy support: if no status, assume complete)
    if (data?.status === 'complete' || (!data?.status && data?.opportunities)) {
      return { success: true, status: 'complete', fromCache: true, data };
    }

    // If it's in progress, tell the UI to wait
    if (data?.status === 'in_progress') {
      return { success: true, status: 'in_progress' };
    }

    // If error, we'll let it retry below
  }

  // No doc exists, kick off the first scan for today
  await radarRef.set({ status: 'in_progress', requestedAt: new Date() });
  processRadarScanInBackground(userId, today).catch(console.error);
  
  // To keep the UI usable while loading, we can check if there's a previous day's scan to fall back on
  const previousScans = await adminDb.collection('users').doc(userId).collection('radar')
    .where('status', '==', 'complete')
    .orderBy('generatedAt', 'desc')
    .limit(1)
    .get();

  if (!previousScans.empty) {
    return { 
      success: true, 
      status: 'in_progress', 
      fallbackData: previousScans.docs[0].data() 
    };
  }

  return { success: true, status: 'in_progress' };
}
