'use server';
/**
 * @fileOverview A Genkit flow for an AI Career Assistant chat.
 *
 * - chatCareerAssistant - A function that handles the AI career assistant chat.
 * - AICareerAssistantChatInput - The input type for the chatCareerAssistant function.
 * - AICareerAssistantChatOutput - The return type for the chatCareerAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


// Input Schema for the external function and flow
const AICareerAssistantChatInputSchema = z.object({
  userQuestion: z.string().describe("The user's question or query for the AI career assistant."),
  userProfile: z.any().describe('Structured data of the user\u0027s profile (e.g., name, skills, experience).'),
  userResume: z.any().describe('Structured data of the user\u0027s primary resume (e.g., summary, experience entries).'),
  savedJobsContext: z.array(z.any()).describe('An array of structured data for relevant saved jobs (e.g., title, company, description).'),
});
export type AICareerAssistantChatInput = z.infer<typeof AICareerAssistantChatInputSchema>;

// Output Schema - A simple string for the assistant's response.
const AICareerAssistantChatOutputSchema = z.string().describe("The AI assistant's contextual advice or answer to the user's question.");
export type AICareerAssistantChatOutput = z.infer<typeof AICareerAssistantChatOutputSchema>;

// Wrapper function to call the Genkit flow
import { spendCredits } from '@/lib/credit-ledger';

export async function chatCareerAssistant(input: AICareerAssistantChatInput & { userId: string }): Promise<AICareerAssistantChatOutput> {
  const { userId, ...flowInput } = input;

  const quota = await spendCredits(userId, 'chatMessage');
  if (!quota.allowed) {
    throw new Error(`QUOTA_EXCEEDED: You need ${quota.required} credits for this action. You have ${quota.remaining} credits. Please upgrade or earn more credits.`);
  }

  return aiCareerAssistantChatFlow(flowInput);
}

// Internal input schema for the prompt, where complex objects are stringified for better LLM parsing
const CareerAssistantPromptInputSchema = z.object({
  userQuestion: z.string().describe("The user's question or query."),
  userProfileString: z.string().describe('Stringified JSON of the user\u0027s profile.'),
  userResumeString: z.string().describe('Stringified JSON of the user\u0027s primary resume.'),
  savedJobsContextString: z.string().describe('Stringified JSON of relevant saved jobs context.'),
});

// Genkit Prompt Definition
const careerAssistantPrompt = ai.definePrompt({
  name: 'careerAssistantPrompt',
  input: {schema: CareerAssistantPromptInputSchema},
  output: {schema: AICareerAssistantChatOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI Career Assistant, designed to help job seekers with their career questions.
You have access to the user's profile, resume, and saved job information.
Use this information to provide accurate, helpful, and contextual advice.
Be concise but comprehensive, focusing on the user's specific question.

User Profile:
{{{userProfileString}}}

User Resume:
{{{userResumeString}}}

Saved Jobs Context:
{{{savedJobsContextString}}}

User's Question: {{{userQuestion}}}

Your advice:`,
});

// Genkit Flow Definition
const aiCareerAssistantChatFlow = ai.defineFlow(
  {
    name: 'aiCareerAssistantChatFlow',
    inputSchema: AICareerAssistantChatInputSchema,
    outputSchema: AICareerAssistantChatOutputSchema,
  },
  async (input) => {
    // Stringify complex objects before passing to the prompt to ensure proper representation
    const promptInput = {
      userQuestion: input.userQuestion,
      userProfileString: JSON.stringify(input.userProfile || {}, null, 2), // Ensure empty object if null/undefined
      userResumeString: JSON.stringify(input.userResume || {}, null, 2),   // Ensure empty object if null/undefined
      savedJobsContextString: JSON.stringify(input.savedJobsContext || [], null, 2), // Ensure empty array if null/undefined
    };
    const {output} = await careerAssistantPrompt(promptInput);
    return output!;
  }
);
