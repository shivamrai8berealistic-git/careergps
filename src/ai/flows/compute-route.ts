import { z } from 'genkit';
import { ai } from '@/ai/genkit';

export const ComputeRouteInputSchema = z.object({
  jobTitle: z.string(),
  jobDescription: z.string(),
  userProfile: z.string(),
  userResume: z.string().optional(),
});

export const RouteStepSchema = z.object({
  id: z.string(),
  title: z.string().describe("Short, punchy action title (e.g., 'Rewrite Resume', 'Learn React')"),
  description: z.string().describe("Clear explanation of why this step is needed and how to do it."),
  actionType: z.enum(['rewrite_resume', 'generate_cover_letter', 'mock_interview', 'upskill', 'apply']),
  isCompleted: z.boolean().default(false),
});

export const ComputeRouteOutputSchema = z.object({
  matchProbability: z.number().describe("Estimated probability (0-100) of landing this job based on current skills."),
  salaryDelta: z.string().optional().describe("E.g., '+20% bump', 'Lateral move', 'Needs negotiation'"),
  missingSkills: z.array(z.string()).describe("List of critical skills missing from the user's profile/resume."),
  steps: z.array(RouteStepSchema).describe("Sequential actionable steps the user must take to maximize their chances. Always include rewriting the resume and generating a cover letter if the match is not 100%."),
});

export type ComputeRouteInput = z.infer<typeof ComputeRouteInputSchema>;
export type ComputeRouteOutput = z.infer<typeof ComputeRouteOutputSchema>;

export const computeRouteFlow = ai.defineFlow({
  name: 'computeRoute',
  inputSchema: ComputeRouteInputSchema,
  outputSchema: ComputeRouteOutputSchema,
}, async (input) => {
  const { jobTitle, jobDescription, userProfile, userResume } = input;

  const prompt = `
You are the intelligence engine for Career Pilot AI, an advanced Career GPS system.

Your job is to calculate the optimal route (Line X) from the user's current state (Point A) to their desired job destination (Point B).

POINT A (User Current State):
Profile:
${userProfile}

Resume (if provided):
${userResume || 'No resume provided. Assume baseline profile skills only.'}

POINT B (Destination):
Job Title: ${jobTitle}
Job Description:
${jobDescription}

TASK:
1. Compare Point A to Point B.
2. Determine the Match Probability (0-100%).
3. Identify Missing Skills.
4. Estimate Salary Delta (e.g., is this a senior step up, a lateral move, or a pivot?).
5. Generate a sequence of actionable steps to bridge the gap.
   - Use 'rewrite_resume' if their current resume doesn't highlight the right skills for Point B.
   - Use 'upskill' for any critical missing skills.
   - Use 'mock_interview' if the role requires complex behavioral or technical interviews.
   - Use 'generate_cover_letter' to help them apply.
   - Use 'apply' as the final step.

Be highly analytical, encouraging, and extremely practical. This is a navigation system.
`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: ComputeRouteOutputSchema }
  });

  if (!output) {
    throw new Error('Failed to generate computed route.');
  }

  return output;
});

import { spendCredits } from '@/lib/credit-ledger';

export async function computeRoute(input: ComputeRouteInput & { userId: string }): Promise<ComputeRouteOutput> {
  const { userId, ...flowInput } = input;
  
  // Basic route generation is currently free to build habit, but we still log it.
  const quota = await spendCredits(userId, 'jobAnalysis'); 
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: You need ${quota.required} credits for this action. You have ${quota.remaining} credits.`);
  }

  return computeRouteFlow(flowInput);
}
