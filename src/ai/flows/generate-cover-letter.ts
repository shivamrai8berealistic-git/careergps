'use server';
/**
 * @fileOverview A Genkit flow for generating tailored cover letters based on user profile, resume summary, job details, and a specified tone.
 *
 * - generateCoverLetter - A function that handles the cover letter generation process.
 * - GenerateCoverLetterInput - The input type for the generateCoverLetter function.
 * - GenerateCoverLetterOutput - The return type for the generateCoverLetter function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const GenerateCoverLetterInputSchema = z.object({
  jobId: z.string().optional().describe('The ID of the job this cover letter is for.'),
  userProfile: z.object({
    name: z.string().describe('The full name of the applicant.'),
    email: z.string().email().describe('The email address of the applicant.'),
    phone: z.string().optional().describe('The phone number of the applicant.'),
    headline: z.string().describe('A brief professional headline for the applicant.'),
    yearsOfExperience: z.number().int().min(0).describe('Total years of professional experience.'),
    keySkills: z.array(z.string()).describe('A list of key skills possessed by the applicant.'),
    preferredRoles: z.array(z.string()).describe('A list of job roles the applicant is interested in.'),
  }).describe('Structured details about the user\'s profile.'),
  resumeSummary: z.string().describe('A concise summary of the applicant\'s resume.'),
  jobJSON: z.object({
    title: z.string().describe('The job title.'),
    company: z.string().describe('The company name.'),
    location: z.string().optional().describe('The job location.'),
    responsibilities: z.array(z.string()).describe('Key responsibilities of the job.'),
    requiredSkills: z.array(z.string()).describe('Essential skills required for the job.'),
  }).describe('Structured data for the job description.'),
  tone: z.enum(['professional', 'confident', 'concise']).describe('The desired tone for the cover letter.'),
});
export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

const GenerateCoverLetterOutputSchema = z.object({
  coverLetterText: z.string().describe('The full, tailored cover letter text.'),
  conciseVariant: z.string().describe('A shorter, more concise version of the cover letter.'),
  strongPointsUsed: z.array(z.string()).describe('A list of specific strengths (skills, experiences) from the applicant\'s profile/resume that were highlighted in the cover letter.'),
});
export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

import { spendCredits } from '@/lib/credit-ledger';
import { logCareerEvent } from '@/lib/memory-engine';
import { adminDb } from '@/lib/firebase-admin';

export async function generateCoverLetter(input: GenerateCoverLetterInput & { userId: string }): Promise<GenerateCoverLetterOutput> {
  const { userId, ...flowInput } = input;

  const quota = await spendCredits(userId, 'coverLetter');
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: You need ${quota.required} credits for this action. You have ${quota.remaining} credits. Please upgrade or earn more credits.`);
  }

  const result = await generateCoverLetterFlow(flowInput);

  if (flowInput.jobId) {
    await logCareerEvent(userId, 'cover_letter_generated', { jobId: flowInput.jobId });
    
    // Optimistically update the GPS route step
    const jobRef = adminDb.collection('users').doc(userId).collection('jobs').doc(flowInput.jobId);
    const jobDoc = await jobRef.get();
    if (jobDoc.exists) {
      const jobData = jobDoc.data();
      if (jobData?.computedRoute?.steps) {
        const updatedSteps = jobData.computedRoute.steps.map((step: any) => 
          step.actionType === 'generate_cover_letter' ? { ...step, isCompleted: true } : step
        );
        await jobRef.update({ 'computedRoute.steps': updatedSteps, updatedAt: new Date() });
      }
    }
  }

  return result;
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: { schema: GenerateCoverLetterInputSchema },
  output: { schema: GenerateCoverLetterOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert career coach and cover letter writer. Your task is to generate a tailored cover letter for a job applicant, based on their profile, resume summary, the job description, and a specified tone.

Applicant's Profile:
Name: {{{userProfile.name}}}
Email: {{{userProfile.email}}}
Phone: {{{userProfile.phone}}}
Headline: {{{userProfile.headline}}}
Years of Experience: {{{userProfile.yearsOfExperience}}}
Key Skills: {{#each userProfile.keySkills}}- {{{this}}}\n{{/each}}
Preferred Roles: {{#each userProfile.preferredRoles}}- {{{this}}}\n{{/each}}

Resume Summary:
{{{resumeSummary}}}

Job Details:
Title: {{{jobJSON.title}}}
Company: {{{jobJSON.company}}}
Location: {{{jobJSON.location}}}
Responsibilities:
{{#each jobJSON.responsibilities}}- {{{this}}}\n{{/each}}
Required Skills:
{{#each jobJSON.requiredSkills}}- {{{this}}}\n{{/each}}

Desired Tone for the Cover Letter: {{{tone}}}

Please generate:
1. A full, detailed cover letter.
2. A concise variant of the cover letter, suitable for quick review.
3. A list of specific strong points (skills, experiences, achievements) from the applicant's profile/resume that were highlighted in the cover letter to match the job requirements.

Ensure the cover letter is professional, highlights how the applicant's background aligns with the job's requirements, and reflects the specified tone.

Output must be a JSON object with the following structure:
{{jsonSchema output}}`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate cover letter output.');
    }
    return output;
  }
);
