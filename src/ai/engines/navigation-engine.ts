'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { attachExplanation } from './explanation-engine';

const RouteStateSchema = z.object({
  routeCompletion: z.number().describe('0-100 percentage of how close they are to the destination'),
  routeConfidence: z.number().describe('0-100 percentage of how confident the system is in the user reaching the destination based on validated readiness and freshness.'),
  estimatedMonths: z.number().describe('Estimated months to reach destination'),
  routeStatus: z.enum(['on_track', 'accelerating', 'delayed', 'blocked']),
  topBlocker: z.string().describe('The single biggest obstacle (e.g. "Missing React experience" or "Stale validation on core skills")'),
  accelerationOpportunity: z.string().describe('What action would reduce the ETA the most?'),
  explanationRaw: z.string().describe('Why this route status and ETA was chosen'),
});

const navigationEnginePrompt = ai.definePrompt({
  name: 'navigationEnginePrompt',
  input: { 
    schema: z.object({
      twin: z.any(),
      activeJobs: z.array(z.any()),
      recentMemory: z.array(z.any()),
      cinPatterns: z.array(z.any()),
      activeRoute: z.any().optional(),
      routeExecutionState: z.any().optional(),
    })
  },
  output: { schema: RouteStateSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Navigation Engine for Career Pilot AI.
Your job is to act like a GPS calculating a route. 
Given the user's current location (Career Twin), their destination (Target Jobs), and their active route execution progress, determine the ETA (in months), route completion percentage, and route confidence.

### Career Twin (Point A):
{{{twin}}}

### Target Destinations (Point B):
{{{activeJobs}}}

### Active Route & Execution State:
{{{activeRoute}}}
Execution Progress (Checkpoints/Modules/Chapters):
{{{routeExecutionState}}}
*Pay close attention to stale validations or blocked dependencies. They reduce Route Confidence and may be the Top Blocker.*

### Recent History (Speed/Momentum):
{{{recentMemory}}}

### Global Intelligence (Traffic/Patterns):
{{{cinPatterns}}}

Calculate the macro-level Route State.`
});

export async function calculateRouteState(context: any) {
  const { output } = await navigationEnginePrompt({
    twin: context.twin,
    activeJobs: context.activeJobs,
    recentMemory: context.recentMemory,
    cinPatterns: context.cinPatterns,
    activeRoute: context.activeRoute,
    routeExecutionState: context.routeExecutionState,
  });

  if (!output) throw new Error("Navigation Engine failed");

  // Attach trusted explanation
  const explanation = await attachExplanation(output.explanationRaw, context.cinPatterns);

  return {
    ...output,
    cinRationale: explanation.cinRationale,
    cinConfidence: explanation.cinConfidence,
    isBootstrapped: explanation.isBootstrapped
  };
}
