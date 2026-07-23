'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OnboardingInputSchema = z.object({
  rawResumeText: z.string().describe('The raw text of the user\'s primary resume.'),
  destinations: z.array(z.string()).describe('Target job titles or domains they want to reach.'),
  preferences: z.object({
    currentCTC: z.string().optional(),
    expectedSalary: z.string().optional(),
    workType: z.string().optional(),
    cities: z.string().optional(),
  }).optional(),
  constraints: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
});

const BottleneckSchema = z.object({
  type: z.enum(['resume', 'skills', 'experience', 'strategy']),
  severity: z.enum(['high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  fixAction: z.string(),
});

const OnboardingOutputSchema = z.object({
  careerScore: z.number().min(0).max(100),
  healthMetrics: z.object({
    marketRelevance: z.number().min(0).max(100),
    resumeStrength: z.number().min(0).max(100),
    interviewReadiness: z.number().min(0).max(100),
  }),
  careerDNA: z.string().describe('A 2-3 sentence summary defining their professional identity.'),
  skillGraph: z.array(z.string()).describe('Top 5-7 verified core skills extracted from their resume.'),
  opportunityRadar: z.array(z.string()).describe('3-5 job titles they are highly matched for today.'),
  salaryEstimate: z.string().describe('Estimated fair market value (e.g. "12 LPA - 15 LPA")'),
  bottlenecks: z.array(BottleneckSchema).describe('The top 1-2 critical bottlenecks holding them back.'),
  recommendedDestinations: z.array(z.string()).describe('2-4 suggested roles that align with their goals and constraints.'),
  confidenceScore: z.number().min(0).max(100).describe('How confident the AI is in this analysis based on data quality.'),
  extractedRole: z.string().describe('The user\'s most recent or current job title, extracted from the resume.'),
});

const onboardingTwinPrompt = ai.definePrompt({
  name: 'onboardingTwinPrompt',
  input: { schema: OnboardingInputSchema },
  output: { schema: OnboardingOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the core Intelligence Engine for Career Pilot AI.
A new user has just completed onboarding. Your job is to analyze their raw inputs and instantly construct their "Career Twin"—a digital representation of their market value.

Be brutal but fair. If their resume lacks metrics, lower their resumeStrength. If their expected salary is unrealistic for their skills, flag it as a bottleneck. 
Adhere strictly to their constraints (e.g. if they cannot relocate, do not suggest jobs requiring relocation).

### Raw Resume:
{{{rawResumeText}}}

### Stated Target Destinations:
{{{destinations}}}

### Career Preferences:
{{{preferences}}}

### Career Constraints:
{{{constraints}}}

### Career Goals:
{{{goals}}}

Generate the complete Career Twin intelligence snapshot.`
});

export async function buildOnboardingTwin(input: any) {
  const { output } = await onboardingTwinPrompt(input);
  if (!output) throw new Error('AI failed to generate initial Career Twin.');
  return output;
}
