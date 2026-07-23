'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const explanationPrompt = ai.definePrompt({
  name: 'explanationEnginePrompt',
  input: { 
    schema: z.object({ 
      recommendation: z.string(), 
      cinPatterns: z.array(z.any())
    }) 
  },
  output: { 
    schema: z.object({
      cinConfidence: z.number().describe('0-100 score based on how strongly patterns support this'),
      cinRationale: z.string().describe('The explanation string (e.g. "Based on X journeys, doing Y improves Z")'),
      isBootstrapped: z.boolean().describe('True if the supporting pattern is a synthetic prior')
    })
  },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Explanation Engine for Career Pilot AI.
Your sole job is to take a recommendation and search the CIN Patterns to explain WHY the user should trust it.

### Recommendation:
{{{recommendation}}}

### Global Intelligence Patterns (CIN):
{{{cinPatterns}}}

Find the best matching pattern. Output the confidence, rationale, and whether the pattern is bootstrapped (synthetic).`
});

/**
 * Attaches trust and confidence metrics to any AI recommendation.
 */
export async function attachExplanation(recommendation: string, cinPatterns: any[]) {
  if (!cinPatterns || cinPatterns.length === 0) {
    return { cinConfidence: 50, cinRationale: "Standard career best practice.", isBootstrapped: true };
  }
  const { output } = await explanationPrompt({ recommendation, cinPatterns });
  if (!output) throw new Error("Explanation Engine failed");
  return output;
}
