import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    // Fallback to default credentials if no explicit config is found (e.g. on GCP/Vercel)
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      initializeApp();
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}
export const adminDb = getFirestore();
export const adminAuth = getAuth();
export { admin };
