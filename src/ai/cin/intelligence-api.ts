'use server';

import { adminDb } from '@/lib/firebase-admin';

/**
 * Retrieves the most relevant globally discovered patterns for a given target role.
 */
export async function getRelevantPatterns(targetRoles: string[]) {
  if (!targetRoles || targetRoles.length === 0) return [];
  
  // In a production SQL/Vector DB, this would be a semantic search.
  // For MVP Firestore, we fetch top 10 patterns and filter in memory.
  const snapshot = await adminDb.collection('cin_patterns')
    .orderBy('impactScore', 'desc')
    .limit(20)
    .get();

  const allPatterns = snapshot.docs.map(doc => doc.data());
  
  // Naive filter by target role (fallback to generic patterns if none found)
  const relevant = allPatterns.filter(p => {
    if (!p.targetRoles || p.targetRoles.length === 0) return true; // Generic pattern
    return targetRoles.some(role => 
      p.targetRoles.some((tr: string) => tr.toLowerCase().includes(role.toLowerCase()))
    );
  });

  return relevant.slice(0, 5); // Return top 5
}

/**
 * Retrieves the cohort benchmarking averages for a given cohort name.
 */
export async function getCohortBenchmarks(cohortName: string) {
  // Simplistic matching for MVP
  const snapshot = await adminDb.collection('cin_benchmarks').limit(5).get();
  const benchmarks = snapshot.docs.map(doc => doc.data());
  
  // Return the best match or a generic one
  return benchmarks[0] || null;
}
