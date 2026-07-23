'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getRelevantPatterns } from '@/ai/cin/intelligence-api';
import { executeMatch } from '@/ai/engines/match-engine';

const RadarInputSchema = z.object({
  careerTwin: z.any().describe('The user\'s current Career Twin snapshot'),
  targetRoles: z.array(z.string()).describe('The roles the user is interested in'),
  cinGlobalPatterns: z.array(z.any()).describe('Anonymized population-level intelligence'),
});

// Step 1: Generate raw opportunity list (no scoring — scoring delegated to MatchEngine)
const opportunityListPrompt = ai.definePrompt({
  name: 'opportunityListPrompt',
  input: { schema: RadarInputSchema },
  output: { 
    schema: z.object({
      opportunities: z.array(z.object({
        id: z.string(),
        title: z.string(),
        company: z.string(),
        location: z.string(),
        salaryRange: z.string(),
        requirements: z.array(z.string()),
      })),
      marketInsight: z.string(),
    })
  },
  model: 'googleai/gemini-2.5-flash',
  prompt: `Generate 3-5 highly realistic mock job postings for the target roles below.
Output only the job listing details. Do NOT score them.

### Career Twin Context:
{{{careerTwin}}}

### Target Roles:
{{{targetRoles}}}

### Market Intelligence (CIN):
{{{cinGlobalPatterns}}}`
});

export async function runRadarEngine(input: any) {
  const cinGlobalPatterns = await getRelevantPatterns(input.targetRoles);
  
  // Step 1: Generate raw opportunity list
  const { output: listOutput } = await opportunityListPrompt({ ...input, cinGlobalPatterns });
  if (!listOutput) throw new Error('Radar Engine failed to generate opportunity list.');

  // Step 2: Score each opportunity via the unified MatchEngine (no duplicated logic)
  const scoredOpportunities = await Promise.all(
    listOutput.opportunities.map(async (opp) => {
      const match = await executeMatch(input.careerTwin, opp, false);
      return {
        ...opp,
        currentMatchScore: match.score,
        potentialMatchScore: Math.min(100, match.score + 15),
        missingSkills: match.missingSkills,
        nextActionTitle: match.nextAction,
        cinRationale: cinGlobalPatterns[0]?.pattern || undefined,
      };
    })
  );

  return {
    opportunities: scoredOpportunities,
    marketInsight: listOutput.marketInsight,
  };
}
