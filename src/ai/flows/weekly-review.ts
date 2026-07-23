'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReviewInputSchema = z.object({
  currentTwin: z.any().describe('The user\'s current Career Twin snapshot'),
  previousTwin: z.any().describe('The user\'s Career Twin snapshot from 7+ days ago (if available)'),
  recentEvents: z.array(z.any()).describe('The user\'s career events from the memory ledger over the last 7 days'),
});

const InsightSchema = z.object({
  id: z.string(),
  type: z.enum(['celebration', 'warning', 'recommendation', 'market_update']),
  title: z.string(),
  description: z.string(),
  actionLabel: z.string().optional(),
  actionHref: z.string().optional(),
});

const ReviewOutputSchema = z.object({
  summary: z.string().describe('A personalized 2-3 sentence summary of their week.'),
  insights: z.array(InsightSchema).describe('3-5 highly actionable, personalized insights based on their recent activity and Twin changes.'),
  nextFocus: z.string().describe('The single most important thing they should focus on next week.'),
});

const weeklyReviewPrompt = ai.definePrompt({
  name: 'weeklyReviewPrompt',
  input: { schema: ReviewInputSchema },
  output: { schema: ReviewOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the core Intelligence Engine for Career Pilot AI.
Your task is to generate a personalized "Weekly Career Review" and a set of actionable insights for the user's dashboard feed.

Analyze their current Career Twin, compare it to their past Twin (if available), and review the actions they took this week (recentEvents).

### Current Career Twin:
{{{currentTwin}}}

### Previous Career Twin:
{{{previousTwin}}}

### Recent Events (Last 7 Days):
{{{recentEvents}}}

Generate insights that celebrate wins (e.g. "You ran 3 simulations this week, exploring new paths!"), warn about stagnation (e.g. "Your score dropped because you haven't updated your skills in 30 days"), or provide market updates based on their goals.

If they did nothing, encourage them to take a small step.
Make the insights feel like a personalized, highly intelligent career coach.`
});

export async function generateWeeklyReview(input: any) {
  const { output } = await weeklyReviewPrompt(input);
  if (!output) throw new Error('AI failed to generate weekly review.');
  return output;
}
