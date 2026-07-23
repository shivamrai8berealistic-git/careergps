'use server';

import { adminDb } from '@/lib/firebase-admin';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PatternSchema = z.object({
  title: z.string(),
  description: z.string(),
  impactScore: z.number().min(0).max(1),
  sampleSize: z.number(),
  type: z.enum(['skill_synergy', 'route_optimization', 'market_trend', 'bottleneck']),
  targetRoles: z.array(z.string()),
  isBootstrapped: z.boolean().default(true),
});

const AggregationOutputSchema = z.object({
  patterns: z.array(PatternSchema),
  benchmarks: z.array(z.object({
    cohortName: z.string(),
    avgAtsScore: z.number(),
    avgInterviewRate: z.number(),
    avgSalaryDelta: z.string()
  }))
});

const aggregatorPrompt = ai.definePrompt({
  name: 'cinAggregatorPrompt',
  input: { schema: z.object({ rawEvents: z.array(z.any()) }) },
  output: { schema: AggregationOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Career Intelligence Network (CIN) Aggregator for Career Pilot AI.
Your job is to analyze anonymized user memory events and outcomes across the entire platform, and discover statistically significant patterns.

Because this is a bootstrap run, if the rawEvents array is small, YOU MUST INFER AND GENERATE highly realistic industry baseline patterns based on your vast global knowledge of the tech/corporate market (e.g., "React + TS yields higher callbacks than React alone", "AWS certifications boost DevOps salaries").

Output realistic sample sizes (e.g. 15,200 journeys) to bootstrap the engine, but strictly mark them as isBootstrapped: true.

### Raw Anonymized Events:
{{{rawEvents}}}

Discover top patterns and cohort benchmarks.`
});

export async function runCINAggregator() {
  // 1. Fetch raw events (anonymized)
  const eventsSnapshot = await adminDb.collectionGroup('memory')
    .orderBy('timestamp', 'desc')
    .limit(1000)
    .get();

  const rawEvents = eventsSnapshot.docs.map(doc => {
    const data = doc.data();
    // Strip userId to ensure anonymity before sending to LLM
    const { userId, ...anonymizedData } = data;
    return anonymizedData;
  });

  // 2. Discover Patterns via LLM
  const { output } = await aggregatorPrompt({ rawEvents });
  if (!output) throw new Error("CIN Aggregator failed.");

  // 3. Write to Global Store
  const batch = adminDb.batch();
  
  // Clear old patterns (in production we would merge/decay, but for MVP we replace)
  const oldPatterns = await adminDb.collection('cin_patterns').get();
  oldPatterns.docs.forEach(doc => batch.delete(doc.ref));

  const oldBenchmarks = await adminDb.collection('cin_benchmarks').get();
  oldBenchmarks.docs.forEach(doc => batch.delete(doc.ref));

  // Write new patterns
  output.patterns.forEach(pattern => {
    const ref = adminDb.collection('cin_patterns').doc();
    batch.set(ref, { ...pattern, updatedAt: new Date() });
  });

  // Write new benchmarks
  output.benchmarks.forEach(benchmark => {
    const ref = adminDb.collection('cin_benchmarks').doc();
    batch.set(ref, { ...benchmark, updatedAt: new Date() });
  });

  await batch.commit();
  return { success: true, patterns: output.patterns.length };
}
