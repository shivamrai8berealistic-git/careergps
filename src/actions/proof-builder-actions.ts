'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { logCareerEvent } from '@/lib/memory-engine';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
      const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
      return decodedClaims.uid;
  } catch (error) {
      throw new Error('Unauthorized: Invalid token');
  }
}

export type ProofItem = {
  id?: string;
  title: string;
  projectType: string; // 'portfolio', 'github_repo', 'case_study', 'project'
  description: string;
  relevanceToTarget: string; 
  status: 'complete' | 'in_progress' | 'forthcoming';
  visibility: 'public' | 'private' | 'employers_only';
  githubUrl?: string;
  liveDemoUrl?: string;
  portfolioUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function getProofItems(idToken: string) {
  const userId = await getUserId(idToken);
  const snapshot = await adminDb.collection('users').doc(userId).collection('proofItems').orderBy('createdAt', 'desc').get();
  
  const items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
  })) as ProofItem[];

  return { success: true, items };
}

export async function saveProofItem(idToken: string, payload: Partial<ProofItem>) {
  const userId = await getUserId(idToken);
  
  let docRef;
  if (payload.id) {
    docRef = adminDb.collection('users').doc(userId).collection('proofItems').doc(payload.id);
    await docRef.update({
      ...payload,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    docRef = adminDb.collection('users').doc(userId).collection('proofItems').doc();
    await docRef.set({
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log creation
    await logCareerEvent(userId, 'proof_item_created' as any, { 
      itemId: docRef.id, 
      title: payload.title 
    });
  }

  return { success: true, id: docRef.id };
}

export async function deleteProofItem(idToken: string, itemId: string) {
  const userId = await getUserId(idToken);
  await adminDb.collection('users').doc(userId).collection('proofItems').doc(itemId).delete();
  return { success: true };
}

export async function updatePublicSlug(idToken: string, slug: string) {
  const userId = await getUserId(idToken);
  
  // Clean slug
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  // Verify uniqueness
  const query = await adminDb.collectionGroup('profile').where('publicSlug', '==', cleanSlug).get();
  const existingDocs = query.docs.filter(doc => doc.ref.parent.parent?.id !== userId);
  
  if (existingDocs.length > 0) {
    return { success: false, error: 'Slug is already taken.' };
  }

  await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').set({
    publicSlug: cleanSlug,
    isPublicProfileEnabled: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, slug: cleanSlug };
}

export async function getPublicProfile(slug: string) {
  // 1. Find user by slug
  const profileQuery = await adminDb.collectionGroup('profile').where('publicSlug', '==', slug).where('isPublicProfileEnabled', '==', true).limit(1).get();
  
  if (profileQuery.empty) {
    return { success: false, error: 'Profile not found or is private.' };
  }

  const profileDoc = profileQuery.docs[0];
  const profileData = profileDoc.data();
  const userId = profileDoc.ref.parent.parent?.id;

  if (!userId) return { success: false, error: 'User ID missing.' };

  // 2. Fetch public proof items
  const itemsQuery = await adminDb.collection('users').doc(userId).collection('proofItems')
    .where('visibility', '==', 'public')
    .orderBy('createdAt', 'desc')
    .get();

  const proofItems = itemsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
  })) as ProofItem[];

  return { 
    success: true, 
    profile: {
      fullName: profileData.fullName || 'Anonymous User',
      headline: profileData.linkedinHeadline || profileData.currentOrLastJobTitle || 'Professional',
      topSkills: profileData.keySkills?.slice(0, 5) || [],
      about: profileData.about || '',
    },
    proofItems 
  };
}

export async function pushProofToMasterResume(idToken: string, proofItemId: string) {
  const userId = await getUserId(idToken);

  // 1. Get Proof Item
  const proofDoc = await adminDb.collection('users').doc(userId).collection('proofItems').doc(proofItemId).get();
  if (!proofDoc.exists) {
    return { success: false, error: 'Proof project not found.' };
  }
  const proofItem = proofDoc.data() as ProofItem;

  // 2. Get Master Resume
  const profileRef = adminDb.collection('users').doc(userId).collection('profile').doc('main-profile');
  const profileDoc = await profileRef.get();
  
  if (!profileDoc.exists) {
    return { success: false, error: 'Master resume not found. Please create one first.' };
  }
  
  const profileData = profileDoc.data();
  const existingProjects = profileData?.projects || [];

  // 3. Check for duplicates
  const exists = existingProjects.some((p: any) => p.name === proofItem.title);
  if (exists) {
    return { success: false, error: 'This project is already in your master resume.' };
  }

  // 4. Append and Save
  const newProject = {
    id: Math.random().toString(36).substring(2, 9),
    name: proofItem.title,
    description: proofItem.description,
    url: proofItem.liveDemoUrl || proofItem.githubUrl || proofItem.portfolioUrl || '',
    techStack: []
  };

  await profileRef.update({
    projects: [...existingProjects, newProject],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
}
