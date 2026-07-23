'use server';
/**
 * @fileOverview A Genkit flow for parsing a resume (PDF/DOCX) and extracting key information.
 *
 * - parseResume - A function that handles the resume parsing process.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const ExperienceEntrySchema = z.object({
  title: z.string().describe('The job title.'),
  company: z.string().describe('The company name.'),
  location: z.string().optional().describe('The location of the job (e.g., city, state, country).'),
  startDate: z.string().describe('The start date of the experience (e.g., "YYYY-MM" or "Month YYYY").'),
  endDate: z.string().optional().describe('The end date of the experience (e.g., "YYYY-MM", "Month YYYY", or "Present").'),
  description: z.string().describe('A detailed description of responsibilities and achievements, ideally in bullet points.'),
});

const EducationEntrySchema = z.object({
  degree: z.string().describe('The degree obtained (e.g., "Bachelor of Science in Computer Science").'),
  institution: z.string().describe('The name of the educational institution.'),
  location: z.string().optional().describe('The location of the institution.'),
  graduationDate: z.string().optional().describe('The graduation date (e.g., "YYYY" or "YYYY-MM").'),
});

const ProjectEntrySchema = z.object({
  name: z.string().describe('The name of the project.'),
  description: z.string().describe('A brief description of the project, including its purpose and your role.'),
  url: z.string().url().optional().describe('An optional URL to the project (e.g., GitHub, portfolio link).'),
});

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Supported mimetypes: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document."
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  name: z.string().describe('The full name of the candidate.'),
  headline: z.string().optional().describe('A concise professional headline or title.'),
  summary: z.string().optional().describe('A professional summary or objective statement.'),
  skills: z.array(z.string()).describe('A list of key technical and soft skills.'),
  experienceEntries: z.array(ExperienceEntrySchema).describe('A list of professional work experiences.'),
  education: z.array(EducationEntrySchema).describe('A list of educational background entries.'),
  certifications: z.array(z.string()).optional().describe('A list of professional certifications.'),
  projects: z.array(ProjectEntrySchema).optional().describe('A list of personal or professional projects.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

import { spendCredits } from '@/lib/credit-ledger';

export async function parseResume(input: ParseResumeInput & { userId: string }): Promise<ParseResumeOutput> {
  const { userId, ...flowInput } = input;

  const quota = await spendCredits(userId, 'resumeParse');
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: You need ${quota.required} credits for this action. You have ${quota.remaining} credits. Please upgrade or earn more credits.`);
  }

  return parseResumeFlow(flowInput);
}

const resumeParsingPrompt = ai.definePrompt({
  name: 'resumeParsingPrompt',
  input: { schema: ParseResumeInputSchema },
  output: { schema: ParseResumeOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert resume parser. Your task is to extract all relevant information from the provided resume and structure it into a JSON object according to the specified output schema.

Carefully read through the resume and identify:
- The candidate's full name.
- A professional headline or current job title.
- A professional summary or objective statement.
- A comprehensive list of technical and soft skills.
- Detailed entries for all work experience, including job title, company, location, start date, end date (or 'Present'), and a description of responsibilities and achievements.
- All educational background, including degree, institution, location, and graduation date.
- Any professional certifications.
- Any significant personal or professional projects, including project name, description, and an optional URL.

Ensure that all dates are parsed into a consistent 'YYYY-MM' or 'Month YYYY' format where possible, and for ongoing positions, use 'Present' as the end date.

Resume content: {{media url=resumeDataUri}}`,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async (input) => {
    const { output } = await resumeParsingPrompt(input);
    if (!output) {
      throw new Error('Failed to parse resume: No output from AI model.');
    }
    return output;
  },
);
