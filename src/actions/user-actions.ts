'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
    const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
    return decodedClaims.uid;
  } catch (error) {
    throw new Error('Unauthorized: Invalid token');
  }
}

/**
 * Deletes a user's account and all associated Firestore data recursively.
 */
export async function deleteUserAccountAction(idToken: string) {
  const userId = await getUserId(idToken);
  
  if (!userId) {
    throw new Error('Invalid user ID');
  }

  try {
    // 1. Delete all Firestore data recursively
    // This removes the user document and all subcollections:
    // profile, wallet, transactions, routes, route_checkpoints, route_modules, route_chapters, missions, memory, etc.
    const userRef = adminDb.collection('users').doc(userId);
    await adminDb.recursiveDelete(userRef);

    // 2. Delete the user from Firebase Auth
    await admin.auth().deleteUser(userId);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}
