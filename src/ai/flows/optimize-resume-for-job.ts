'use server';
/**
 * @fileOverview An AI agent that optimizes a user's resume for a specific job.
 *
 * - optimizeResumeForJob - A function that handles the resume optimization process.
 * - OptimizeResumeForJobInput - The input type for the optimizeResumeForJob function.
 * - OptimizeResumeForJobOutput - The return type for the optimizeResumeForJob function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const ResumeExperienceEntrySchema = z.object({
  title: z.string().describe('Job title or role.'),
  company: z.string().describe('Company name.'),
  description: z.string().describe('Detailed description of responsibilities and achievements in this role, in bullet points.'),
});

const ResumeEducationEntrySchema = z.object({
  degree: z.string().describe('Degree or certification obtained.'),
  institution: z.string().describe('Educational institution name.'),
  description: z.string().optional().describe('Additional details about education, e.g., major, GPA, relevant coursework.'),
});

const StructuredResumeSchema = z.object({
  name: z.string().describe('Full name of the job seeker.'),
  headline: z.string().describe('Professional headline or title.'),
  summary: z.string().describe('A concise professional summary or objective.'),
  skills: z.array(z.string()).describe('A list of key skills.'),
  experience: z.array(ResumeExperienceEntrySchema).describe('A list of professional experience entries.'),
  education: z.array(ResumeEducationEntrySchema).describe('A list of educational background entries.'),
  // Add other fields as per full resume parsing flow output if available
});
export type StructuredResume = z.infer<typeof StructuredResumeSchema>;

const StructuredJobSchema = z.object({
  title: z.string().describe('Job title.'),
  company: z.string().describe('Company name.'),
  location: z.string().optional().describe('Job location.'),
  employmentType: z.string().optional().describe('e.g., Full-time, Part-time, Contract.'),
  description: z.string().describe('Full job description text.'),
  requiredSkills: z.array(z.string()).describe('A list of required skills mentioned in the job description.'),
  preferredSkills: z.array(z.string()).optional().describe('A list of preferred skills mentioned in the job description.'),
  responsibilities: z.array(z.string()).describe('A list of responsibilities from the job description.'),
  seniority: z.string().optional().describe('e.g., Junior, Senior, Lead.'),
  applicationUrl: z.string().optional().describe('URL to apply for the job.'),
});
export type StructuredJob = z.infer<typeof StructuredJobSchema>;

const OptimizeResumeForJobInputSchema = z.object({
  structuredResume: StructuredResumeSchema.describe('The user\u2019s structured resume data.'),
  structuredJob: StructuredJobSchema.describe('The structured job description data.'),
});
export type OptimizeResumeForJobInput = z.infer<typeof OptimizeResumeForJobInputSchema>;

const BulletSuggestionSchema = z.object({
  originalBullet: z.string().describe('The original bullet point from the resume.'),
  revisedBullet: z.string().describe('The suggested revised bullet point, optimized for the job.'),
});

const OptimizeResumeForJobOutputSchema = z.object({
  keywordSuggestions: z.array(z.string()).describe('A list of ATS keywords from the job description that should be integrated into the resume.'),
  revisedSummarySuggestion: z.string().describe('A suggested revised professional summary for the resume, tailored to the job description.'),
  revisedBulletSuggestions: z.array(BulletSuggestionSchema).describe('Suggestions for improving existing resume bullet points or adding new ones, showing original and revised versions.'),
  atsImprovementNotes: z.string().describe('General notes and tips for improving the resume\u2019s Applicant Tracking System (ATS) compatibility for this specific job.'),
});
export type OptimizeResumeForJobOutput = z.infer<typeof OptimizeResumeForJobOutputSchema>;

import { spendCredits } from '@/lib/credit-ledger';

export async function optimizeResumeForJob(input: OptimizeResumeForJobInput & { userId: string }): Promise<OptimizeResumeForJobOutput> {
  const { userId, ...flowInput } = input;

  const quota = await spendCredits(userId, 'resumeRewrite');
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: You need ${quota.required} credits for this action. You have ${quota.remaining} credits. Please upgrade or earn more credits.`);
  }

  return optimizeResumeForJobFlow(flowInput);
}

const prompt = ai.definePrompt({
  name: 'optimizeResumeForJobPrompt',
  input: { schema: OptimizeResumeForJobInputSchema },
  output: { schema: OptimizeResumeForJobOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert career coach and resume writer. Your task is to analyze a job description and a candidate's resume, then provide actionable suggestions to optimize the resume for that specific job, focusing on Applicant Tracking System (ATS) compatibility and relevance.

Here is the job description:
Job Title: {{{structuredJob.title}}}
Company: {{{structuredJob.company}}}
Location: {{{structuredJob.location}}}
Employment Type: {{{structuredJob.employmentType}}}
Responsibilities:
{{#each structuredJob.responsibilities}}- {{{this}}}
{{/each}}
Required Skills:
{{#each structuredJob.requiredSkills}}- {{{this}}}
{{/each}}
Preferred Skills:
{{#each structuredJob.preferredSkills}}- {{{this}}}
{{/each}}

Full Job Description:
{{{structuredJob.description}}}

Here is the candidate's resume:
Name: {{{structuredResume.name}}}
Headline: {{{structuredResume.headline}}}
Summary: {{{structuredResume.summary}}}
Skills:
{{#each structuredResume.skills}}- {{{this}}}
{{/each}}
Experience:
{{#each structuredResume.experience}}
  - Job Title: {{{this.title}}} at {{{this.company}}}
    Description: {{{this.description}}}
{{/each}}
Education:
{{#each structuredResume.education}}
  - Degree: {{{this.degree}}} from {{{this.institution}}}
    Description: {{{this.description}}}
{{/each}}

Provide the following:
1.  **Keyword Suggestions**: List key terms and phrases directly from the job description that are critical for ATS matching and should be included or emphasized in the resume.
2.  **Revised Summary Suggestion**: Propose a new, concise professional summary that highlights the candidate's most relevant qualifications and aligns with the job requirements and company's needs.
3.  **Revised Bullet Suggestions**: Suggest specific improvements for existing resume bullet points to better align with the job's responsibilities and required skills. If the resume lacks certain relevant experiences, suggest new bullet points that could be added based on the job description, assuming the candidate has relevant experience. For each suggestion, show the original bullet and the revised version (or 'N/A' for original if it's a new suggestion).
4.  **ATS Improvement Notes**: Offer general advice and specific notes on how to further optimize the resume for ATS, considering both the current resume and the target job description. Focus on formatting, common pitfalls, and keyword density.

Ensure the output is structured clearly as requested by the output schema.`,
});

const optimizeResumeForJobFlow = ai.defineFlow(
  {
    name: 'optimizeResumeForJobFlow',
    inputSchema: OptimizeResumeForJobInputSchema,
    outputSchema: OptimizeResumeForJobOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate resume optimization suggestions.');
    }
    return output;
  }
);
