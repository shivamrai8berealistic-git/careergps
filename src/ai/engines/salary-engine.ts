'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SalaryOutputSchema = z.object({
  medianSalary: z.string().describe('e.g. "₹14–18 LPA"'),
  entryBand: z.string(),
  midBand: z.string(),
  seniorBand: z.string(),
  topPayerCompanies: z.array(z.string()).describe('3-5 companies known for top pay in this role/city'),
  salaryDrivers: z.array(z.string()).describe('Skills/certs that increase salary most in this market'),
  negotiationTip: z.string().describe('One high-value India-specific negotiation insight'),
  cityPremium: z.string().describe('How this city compares to national median (e.g. "+22% vs national median")'),
  noticePeriodNote: z.string().describe('Typical notice period in this market and its impact'),
  growthOutlook: z.string().describe('Short salary growth forecast for this role/city'),
});

const salaryEnginePrompt = ai.definePrompt({
  name: 'salaryEnginePrompt',
  input: {
    schema: z.object({
      role: z.string(),
      city: z.string(),
      experience: z.string(),
      skills: z.array(z.string()).optional(),
    })
  },
  output: { schema: SalaryOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Salary Intelligence Engine for Career Pilot AI. India-first.

Provide accurate, realistic India salary data. Use actual Indian market knowledge.

IMPORTANT: 
- All salaries must be in INR (LPA or per month).
- Calibrate for Indian cities, not global averages.
- Bangalore tech salaries are different from Tier-2 city salaries.
- Include ESOP/equity context where relevant (startups vs. MNCs).
- Be honest about notice period realities in India.

### Role: {{{role}}}
### City: {{{city}}}
### Experience Level: {{{experience}}}
{{#if skills}}### Key Skills: {{{skills}}}{{/if}}

Provide the full India salary intelligence report.`
});

/**
 * The Salary Engine is India-first and city-aware.
 * Used by both the public salary-check tool and the Navigation Engine
 * to frame salary impact as a navigation metric (salary delta = route progress).
 */
export async function runSalaryEngine(role: string, city: string, experience: string, skills?: string[]) {
  const { output } = await salaryEnginePrompt({ role, city, experience, skills });
  if (!output) throw new Error('Salary Engine failed.');
  return output;
}
