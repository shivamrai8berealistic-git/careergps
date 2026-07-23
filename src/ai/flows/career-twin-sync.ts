'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CareerTwinSyncInputSchema = z.object({
  userProfile: z.string().describe('JSON string of the user profile.'),
  userResume: z.string().describe('The raw text of the user\'s primary resume.'),
});

const BottleneckSchema = z.object({
  type: z.enum(['resume', 'skills', 'experience', 'strategy']),
  severity: z.enum(['high', 'medium', 'low']),
  title: z.string().describe('Short title for the bottleneck (e.g. "Missing Leadership Keywords")'),
  description: z.string().describe('Detailed explanation of why this is holding them back.'),
  fixAction: z.string().describe('Actionable advice on how to resolve it.'),
});

const CareerTwinSyncOutputSchema = z.object({
  careerScore: z.number().min(0).max(100).describe('Overall career strength score based on market demand and profile completeness.'),
  healthMetrics: z.object({
    marketRelevance: z.number().min(0).max(100),
    resumeStrength: z.number().min(0).max(100),
    interviewReadiness: z.number().min(0).max(100),
  }),
  bottlenecks: z.array(BottleneckSchema).describe('The top 1-3 critical bottlenecks holding the user back.'),
  radarMatches: z.array(z.string()).describe('List of 3-5 job titles or domains the user is highly matched for right now based on their current twin.'),
  summary: z.string().describe('A 2-sentence executive summary of their market standing.'),
});

const careerTwinSyncPrompt = ai.definePrompt({
  name: 'careerTwinSyncPrompt',
  input: { schema: CareerTwinSyncInputSchema },
  output: { schema: CareerTwinSyncOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Career Twin Intelligence Engine for Career Pilot AI. 
Your job is to analyze a user's entire professional profile and resume, and compute their market value, health metrics, and identify critical bottlenecks holding them back.

Evaluate them as a brutal but fair career coach. Look for inconsistencies, missing high-value keywords, lack of metrics in their resume, or unrealistic expectations in their profile.

### User Profile Data:
{{{userProfile}}}

### Primary Resume:
{{{userResume}}}

Based on this data, provide the CareerScore (0-100), Health Metrics, critical Bottlenecks, and Opportunity Radar (radarMatches).`
});

export async function careerTwinSync(input: { userProfile: string, userResume: string }) {
  const { output } = await careerTwinSyncPrompt(input);
  if (!output) throw new Error('AI failed to generate Career Twin sync data.');
  return output;
}
