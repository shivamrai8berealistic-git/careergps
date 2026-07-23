import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import type { SeedQuestion } from '@/types/route';

// =============================================================================
// SCHEMAS
// =============================================================================

export const GenerateValidationInputSchema = z.object({
  chapterTitle: z.string(),
  skillTag: z.string(),
  validationMethod: z.string(),
  userProfile: z.string(),
  targetJobTitle: z.string(),
  seedQuestions: z.array(z.any()).optional(), // Curated question bank from Knowledge Graph
});

export const ValidationQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  questionType: z.enum(['multiple_choice', 'free_text', 'scenario']),
  options: z.array(z.string()).optional().describe("Only for multiple_choice"),
  correctAnswer: z.string().optional().describe("For objective grading"),
  evaluationRubric: z.string().optional().describe("For free_text or scenario grading"),
  sourceType: z.enum(['seed_personalized', 'ai_generated']).optional().describe("Whether this question came from the seed bank or was fully AI-generated"),
});

export const GenerateValidationOutputSchema = z.object({
  methodUsed: z.string(),
  questions: z.array(ValidationQuestionSchema),
  context: z.string().describe("Background context for the user before they start the validation."),
  isSeedBacked: z.boolean().describe("True if validation was grounded in curated seed questions."),
});

export type GenerateValidationInput = z.infer<typeof GenerateValidationInputSchema>;
export type GenerateValidationOutput = z.infer<typeof GenerateValidationOutputSchema>;

// =============================================================================
// GENERATE VALIDATION — Hybrid approach
// Uses seed questions when available, personalizes them for the user.
// Falls back to fully-live generation when no seeds exist.
// =============================================================================

export const generateValidationFlow = ai.defineFlow({
  name: 'generateValidation',
  inputSchema: GenerateValidationInputSchema,
  outputSchema: GenerateValidationOutputSchema,
}, async (input) => {
  const { chapterTitle, skillTag, validationMethod, userProfile, targetJobTitle, seedQuestions } = input;

  const hasSeedQuestions = seedQuestions && seedQuestions.length > 0;

  // Build the prompt based on whether we have seed questions
  const seedSection = hasSeedQuestions
    ? `
CURATED SEED QUESTIONS (from the Career Knowledge Graph):
${JSON.stringify(seedQuestions, null, 2)}

IMPORTANT INSTRUCTIONS FOR SEED QUESTIONS:
- You MUST use 2-3 of these seed questions as the foundation for the validation.
- Personalize each question for this specific user: adjust difficulty, add context from their target role, vary the wording slightly to prevent memorization.
- Keep the correctAnswer and evaluationRubric from the seed questions intact — do not change what constitutes a correct answer.
- You may add 1 additional AI-generated question if needed, but the foundation must come from the seeds.
- Mark each question's sourceType as "seed_personalized" or "ai_generated".
- Set isSeedBacked to true.
`
    : `
NO SEED QUESTIONS AVAILABLE for this chapter.
Generate 2-3 questions entirely from your knowledge.
Mark all questions with sourceType "ai_generated".
Set isSeedBacked to false.
NOTE: This validation has lower confidence because it is not grounded in a curated question bank.
`;

  const prompt = `
You are the Validation Engine for Career Pilot AI. You create personalized readiness checks for career route chapters.

This is NOT a quiz. This is a readiness check that helps users prove they are prepared for their target role.

USER PROFILE (Current Position):
${userProfile}

TARGET ROLE: ${targetJobTitle}

CHAPTER TOPIC: ${chapterTitle}
SKILL TAG: ${skillTag}
REQUESTED METHOD: ${validationMethod}

${seedSection}

RULES:
1. Tailor difficulty to the user's current experience level.
2. Make questions relevant to the target role's industry and typical challenges.
3. For "objective" methods, prefer multiple_choice.
4. For "practical" or "scenario" methods, use free_text or scenario with a clear evaluation rubric.
5. Provide a short, engaging context paragraph to set the stage.
6. V1 launch methods: multiple_choice, free_text, scenario ONLY. Do not use coding or roleplay_scenario types.

Generate the validation.
`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: GenerateValidationOutputSchema }
  });

  if (!output) {
    throw new Error('Failed to generate validation.');
  }

  return output;
});

// =============================================================================
// GRADE VALIDATION
// =============================================================================

export const GradeValidationInputSchema = z.object({
  questions: z.array(ValidationQuestionSchema),
  userAnswers: z.record(z.string(), z.string()),
});

export const GradeValidationOutputSchema = z.object({
  passed: z.boolean(),
  confidenceScore: z.number().describe("0-100"),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendation: z.string(),
});

export const gradeValidationFlow = ai.defineFlow({
  name: 'gradeValidation',
  inputSchema: GradeValidationInputSchema,
  outputSchema: GradeValidationOutputSchema,
}, async (input) => {
  const { questions, userAnswers } = input;

  const prompt = `
You are the Validation Engine Grader for Career Pilot AI.

Grade the user's answers and determine a confidence score (0-100).

QUESTIONS & RUBRICS:
${JSON.stringify(questions, null, 2)}

USER ANSWERS:
${JSON.stringify(userAnswers, null, 2)}

GRADING RULES:
1. For multiple_choice: compare against correctAnswer. Correct = full marks. Incorrect = 0.
2. For free_text / scenario: evaluate against the evaluationRubric. Award partial credit for partially correct answers.
3. Determine overall confidence score (0-100). Threshold for passing: 70.
4. Identify specific strengths the user demonstrated.
5. Identify specific gaps or misunderstandings — be precise, not generic.
6. Provide an actionable recommendation: what to review if confidence is low, or encouragement to proceed if high.

Be objective but encouraging. This is a readiness check, not a punitive exam.
`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: GradeValidationOutputSchema }
  });

  if (!output) {
    throw new Error('Failed to grade validation.');
  }

  return output;
});
