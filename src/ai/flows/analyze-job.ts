'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing a job description
 * against a user's profile and resume to calculate a match score, identify skills,
 * and provide a fit summary.
 *
 * - analyzeJob - A function that orchestrates the job analysis process.
 * - AnalyzeJobInput - The input type for the analyzeJob function.
 * - AnalyzeJobOutput - The return type for the analyzeJob function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


// From "3. User profile system"
const UserProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  preferredRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  yearsOfExperience: z.number().optional(),
  currentOrLastJobTitle: z.string().optional(),
  keySkills: z.array(z.string()).optional(),
  industriesOfInterest: z.array(z.string()).optional(),
  salaryExpectation: z.string().optional(),
  workModePreference: z.enum(['remote', 'hybrid', 'onsite']).optional()
});
export type UserProfile = z.infer<typeof UserProfileSchema>;


// From "4. Resume system" -> "A. Resume parsing flow"
const ResumeExperienceEntrySchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string().optional() // detailed responsibilities/achievements
});

const ResumeEducationEntrySchema = z.object({
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const StructuredResumeSchema = z.object({
  name: z.string(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(ResumeExperienceEntrySchema),
  education: z.array(ResumeEducationEntrySchema).optional(),
  certifications: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional()
});
export type StructuredResume = z.infer<typeof StructuredResumeSchema>;


// From "5. Job import and job analysis" -> "B. Job extraction flow"
const StructuredJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  seniority: z.string().optional(),
  applicationUrl: z.string().url().optional(),
  description: z.string().optional() // Full job description text if available
});
export type StructuredJob = z.infer<typeof StructuredJobSchema>;


const AnalyzeJobInputSchema = z.object({
  userProfile: UserProfileSchema.describe('The structured user profile data.'),
  structuredResume: StructuredResumeSchema.describe('The structured resume data parsed from the user\'s primary resume.'),
  structuredJob: StructuredJobSchema.describe('The structured job description data.')
});
export type AnalyzeJobInput = z.infer<typeof AnalyzeJobInputSchema>;

const AnalyzeJobOutputSchema = z.object({
  score: z.number().min(0).max(100).describe('An overall match score between 0 and 100, indicating how well the user\'s profile and resume match the job requirements.'),
  strengths: z.array(z.string()).describe('Key areas where the user\'s profile and resume align strongly with the job requirements.'),
  gaps: z.array(z.string()).describe('Key areas or skills where the user\'s profile and resume fall short of the job requirements.'),
  recommendationSummary: z.string().describe('A concise summary of the match, including overall fit and critical next steps.'),
  nextActions: z.array(z.string()).describe('Actionable suggestions for the user to improve their application or chances of success for this job.'),
  matchedSkills: z.array(z.string()).describe('A list of skills from the user\'s resume/profile that directly match the job\'s required or preferred skills.'),
  missingSkills: z.array(z.string()).describe('A list of skills required or preferred by the job that are NOT present in the user\'s resume/profile.')
});
export type AnalyzeJobOutput = z.infer<typeof AnalyzeJobOutputSchema>;

import { spendCredits } from '@/lib/credit-ledger';

export async function analyzeJob(input: AnalyzeJobInput & { userId: string }): Promise<AnalyzeJobOutput> {
  const { userId, ...flowInput } = input;
  
  const quota = await spendCredits(userId, 'jobAnalysis');
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: You need ${quota.required} credits for this action. You have ${quota.remaining} credits. Please upgrade or earn more credits.`);
  }

  return analyzeJobFlow(flowInput);
}

const analyzeJobPrompt = ai.definePrompt({
  name: 'analyzeJobPrompt',
  input: { schema: AnalyzeJobInputSchema },
  output: { schema: AnalyzeJobOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert AI Job Application Copilot. Your task is to analyze a job description, a user's profile, and their structured resume to determine the match, identify skill alignments and gaps, and provide actionable recommendations.

Consider the following information:

### User Profile:
{{json userProfile}}

### Structured Resume:
{{json structuredResume}}

### Structured Job Description:
{{json structuredJob}}

Based on the provided user profile, structured resume, and structured job description, perform the following analysis:
1.  **Calculate a Match Score (0-100):** Evaluate the overall fit, considering skills, experience, education, and preferences.
2.  **Identify Strengths:** List specific aspects where the user is a strong candidate for this role.
3.  **Identify Gaps:** List specific areas (skills, experience, etc.) where the user falls short of the job requirements.
4.  **Generate Matched Skills:** List all skills from the job description that are present in the user's profile or resume.
5.  **Generate Missing Skills:** List all required or preferred skills from the job description that are NOT present in the user's profile or resume.
6.  **Provide a Recommendation Summary:** A short paragraph summarizing the overall fit and any immediate critical advice.
7.  **Suggest Next Actions:** List concrete, actionable steps the user can take to improve their application or prepare for this specific job.

Ensure your output adheres strictly to the AnalyzeJobOutputSchema JSON format.
`
});

const analyzeJobFlow = ai.defineFlow(
  {
    name: 'analyzeJobFlow',
    inputSchema: AnalyzeJobInputSchema,
    outputSchema: AnalyzeJobOutputSchema
  },
  async (input) => {
    const { output } = await analyzeJobPrompt(input);
    if (!output) {
      throw new Error('AI prompt did not return output.');
    }
    return output;
  }
);
