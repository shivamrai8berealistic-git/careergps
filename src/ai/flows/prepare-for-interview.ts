'use server';
/**
 * @fileOverview This file provides an AI agent for generating interview preparation materials.
 *
 * - prepareForInterview - A function that generates interview questions and answer guidance based on a job description and user profile.
 * - InterviewPrepInput - The input type for the prepareForInterview function.
 * - InterviewPrepOutput - The return type for the prepareForInterview function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const JobJsonSchema = z.object({
  title: z.string().describe('The job title.'),
  company: z.string().describe('The company offering the job.'),
  location: z.string().optional().describe('The location of the job.'),
  employmentType: z.string().optional().describe('The employment type (e.g., Full-time, Contract).'),
  responsibilities: z.string().describe('The key responsibilities of the role.'),
  requiredSkills: z.array(z.string()).describe('A list of skills required for the job.'),
  preferredSkills: z.array(z.string()).optional().describe('A list of preferred skills for the job.'),
  seniority: z.string().optional().describe('The seniority level of the role (e.g., Junior, Senior, Lead).'),
});

const UserProfileSchema = z.object({
  fullName: z.string().optional().describe('The full name of the user.'),
  yearsOfExperience: z.number().optional().describe('The user\'s total years of professional experience.'),
  keySkills: z.array(z.string()).optional().describe('A list of the user\'s key professional skills.'),
  preferredRoles: z.array(z.string()).optional().describe('A list of job roles the user prefers.'),
  currentOrLastJobTitle: z.string().optional().describe('The user\'s current or last job title.'),
});

const InterviewPrepInputSchema = z.object({
  jobId: z.string().optional().describe('The ID of the job this interview prep is for.'),
  jobJson: JobJsonSchema.describe('The structured job description for which to prepare.'),
  userProfile: UserProfileSchema.describe('The user\'s professional profile.'),
});
export type InterviewPrepInput = z.infer<typeof InterviewPrepInputSchema>;

const InterviewPrepOutputSchema = z.object({
  behavioralQuestions: z.array(z.string()).describe('A list of likely behavioral interview questions.'),
  technicalQuestions: z.array(z.string()).describe('A list of likely technical interview questions.'),
  roleFitQuestions: z.array(z.string()).describe('A list of likely role-fit interview questions.'),
  answerGuidance: z.array(z.string()).describe('General guidance bullets for answering interview questions effectively.'),
});
export type InterviewPrepOutput = z.infer<typeof InterviewPrepOutputSchema>;

import { spendCredits } from '@/lib/credit-ledger';
import { logCareerEvent } from '@/lib/memory-engine';
import { adminDb } from '@/lib/firebase-admin';

export async function prepareForInterview(input: InterviewPrepInput & { userId: string }): Promise<InterviewPrepOutput> {
  const { userId, ...flowInput } = input;

  const quota = await spendCredits(userId, 'interviewPrep');
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: You need ${quota.required} credits for this action. You have ${quota.remaining} credits. Please upgrade or earn more credits.`);
  }

  const result = await prepareForInterviewFlow(flowInput);

  if (flowInput.jobId) {
    await logCareerEvent(userId, 'interview_prep_run', { jobId: flowInput.jobId });
    
    // Optimistically update the GPS route step
    const jobRef = adminDb.collection('users').doc(userId).collection('jobs').doc(flowInput.jobId);
    const jobDoc = await jobRef.get();
    if (jobDoc.exists) {
      const jobData = jobDoc.data();
      if (jobData?.computedRoute?.steps) {
        const updatedSteps = jobData.computedRoute.steps.map((step: any) => 
          step.actionType === 'mock_interview' ? { ...step, isCompleted: true } : step
        );
        await jobRef.update({ 'computedRoute.steps': updatedSteps, updatedAt: new Date() });
      }
    }
  }

  return result;
}

const prepareForInterviewPrompt = ai.definePrompt({
  name: 'prepareForInterviewPrompt',
  input: { schema: InterviewPrepInputSchema },
  output: { schema: InterviewPrepOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI career coach specializing in interview preparation.

Your task is to generate likely interview questions (behavioral, technical, and role-fit) based on the provided job description and the user's profile. Additionally, provide concise, actionable guidance for answering these types of questions.

Consider the following information:

### Job Description:
Title: {{{jobJson.title}}}
Company: {{{jobJson.company}}}
Location: {{{jobJson.location}}}
Employment Type: {{{jobJson.employmentType}}}
Responsibilities: {{{jobJson.responsibilities}}}
Required Skills: {{#each jobJson.requiredSkills}}- {{{this}}}\n{{/each}}
Preferred Skills: {{#each jobJson.preferredSkills}}- {{{this}}}\n{{/each}}
Seniority: {{{jobJson.seniority}}}

### User Profile:
Full Name: {{{userProfile.fullName}}}
Years of Experience: {{{userProfile.yearsOfExperience}}}
Key Skills: {{#each userProfile.keySkills}}- {{{this}}}\n{{/each}}
Preferred Roles: {{#each userProfile.preferredRoles}}- {{{this}}}\n{{/each}}
Current/Last Job Title: {{{userProfile.currentOrLastJobTitle}}}

---

Based on the above, generate:

1.  **5-7 relevant behavioral questions.** These should explore past experiences and behaviors relevant to the role and company culture.
2.  **5-7 relevant technical questions.** These should assess the skills specifically mentioned as required or preferred, tailored to the user's reported experience level if available.
3.  **3-5 relevant role-fit questions.** These should gauge the candidate's understanding of the role, the company, and how they would contribute to the team.
4.  **5-7 general answer guidance bullets.** These should be high-level tips applicable to all interview questions (e.g., STAR method, quantifying achievements, asking questions).

Ensure the output is directly parsable into the specified JSON schema.`,
});

const prepareForInterviewFlow = ai.defineFlow(
  {
    name: 'prepareForInterviewFlow',
    inputSchema: InterviewPrepInputSchema,
    outputSchema: InterviewPrepOutputSchema,
  },
  async (input) => {
    const { output } = await prepareForInterviewPrompt(input);
    return output!;
  },
);
