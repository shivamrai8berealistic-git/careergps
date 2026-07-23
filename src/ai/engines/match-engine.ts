'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const MatchSchema = z.object({
  score: z.number().describe('Match percentage 0-100'),
  missingSkills: z.array(z.string()).describe('Critical required skills the user is missing'),
  matchedSkills: z.array(z.string()),
  bottlenecks: z.array(z.string()).describe('Why the score is not 100'),
  resumeImprovements: z.array(z.string()).optional().describe('Specific resume fixes if requested'),
  nextAction: z.string().describe('The single highest-impact action to improve this match'),
});

const matchEnginePrompt = ai.definePrompt({
  name: 'matchEnginePrompt',
  input: { 
    schema: z.object({ 
      twin: z.any(), 
      targetJob: z.any(),
      includeResumeImprovements: z.boolean().default(false)
    }) 
  },
  output: { schema: MatchSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Match Engine for Career Pilot AI.
Your sole responsibility is comparing a Career Twin to a Target Job and outputting a precise match score and gap analysis.

### Career Twin:
{{{twin}}}

### Target Job:
{{{targetJob}}}

Instructions:
1. Calculate the 'score' strictly based on skills, experience, and requirements matching.
2. Identify 'missingSkills'.
3. Formulate the precise 'nextAction' to close the gap.
{{#if includeResumeImprovements}}
4. The user specifically wants to rewrite their resume. Provide 3-5 'resumeImprovements' that would immediately increase the ATS score.
{{/if}}
`
});

/**
 * The Match Engine unifies logic previously duplicated across ATS Scanner, Resume Rewriter, and Opportunity Radar.
 */
export async function executeMatch(twin: any, targetJob: any, includeResumeImprovements = false) {
  const { output } = await matchEnginePrompt({ twin, targetJob, includeResumeImprovements });
  if (!output) throw new Error("Match Engine failed");
  return output;
}
