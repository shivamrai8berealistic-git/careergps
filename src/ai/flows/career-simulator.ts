'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CareerSimulatorInputSchema = z.object({
  userProfile: z.string(),
  userResume: z.string(),
  scenarioQuery: z.string().describe('The What-If scenario (e.g. "What if I pivot to Product Management?")'),
});

const SimulatorStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  timeframe: z.string().describe('Estimated time to complete (e.g. "3 Months")'),
});

const CareerSimulatorOutputSchema = z.object({
  scenarioAnalysis: z.string().describe('A paragraph analyzing the feasibility of this pivot/scenario.'),
  probabilityOfSuccess: z.number().min(0).max(100).describe('Estimated probability of achieving this scenario based on current standing.'),
  projectedSalaryDelta: z.string().describe('Estimated salary change (e.g. "+$20k/yr", "-10% initially")'),
  newTargetRoles: z.array(z.string()).describe('Job titles they would qualify for after this scenario.'),
  actionPlan: z.array(SimulatorStepSchema).describe('The step-by-step route to make this scenario a reality.'),
});

const careerSimulatorPrompt = ai.definePrompt({
  name: 'careerSimulatorPrompt',
  input: { schema: CareerSimulatorInputSchema },
  output: { schema: CareerSimulatorOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Career Pilot AI Simulator. 
A user is running a "What-If" simulation to project their career path based on a specific change or pivot.

### Current User Profile:
{{{userProfile}}}

### Current Resume:
{{{userResume}}}

### Target Scenario:
"{{{scenarioQuery}}}"

Based on their current market value (Career Twin) and the requested scenario, project the reality of this move. Is it feasible? What is the exact step-by-step route required to pull it off? What is the expected salary impact? Be realistic and data-driven.`
});

export async function careerSimulator(input: { userProfile: string, userResume: string, scenarioQuery: string }) {
  const { output } = await careerSimulatorPrompt(input);
  if (!output) throw new Error('AI failed to generate simulation.');
  return output;
}
