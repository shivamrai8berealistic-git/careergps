import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { ModuleTemplateSchema, ChapterTemplateSchema } from './build-career-route';

export const BuildModuleChaptersInputSchema = z.object({
  userProfile: z.string(),
  targetJobTitle: z.string(),
  optimizationStyle: z.string(),
  moduleTemplate: ModuleTemplateSchema,
});

export const PersonalizedChapterSchema = z.object({
  templateId: z.string(),
  title: z.string(),
  skillTag: z.string(),
  estimatedMins: z.number(),
  actionableSummary: z.string().describe("Short AI-generated summary of what the user needs to learn here based on their profile gaps."),
  recommendedContent: z.object({
    type: z.enum(['platform_tool', 'video', 'article', 'ai_summary', 'practice']),
    url: z.string().optional(),
    toolId: z.string().optional(),
  }),
});

export const BuildModuleChaptersOutputSchema = z.object({
  chapters: z.array(PersonalizedChapterSchema),
});

export type BuildModuleChaptersInput = z.infer<typeof BuildModuleChaptersInputSchema>;
export type BuildModuleChaptersOutput = z.infer<typeof BuildModuleChaptersOutputSchema>;

export const buildModuleChaptersFlow = ai.defineFlow({
  name: 'buildModuleChapters',
  inputSchema: BuildModuleChaptersInputSchema,
  outputSchema: BuildModuleChaptersOutputSchema,
}, async (input) => {
  const { userProfile, targetJobTitle, optimizationStyle, moduleTemplate } = input;

  const prompt = `
You are the Curriculum Generator for Career Pilot AI.
Your job is to personalize the chapters for a specific module based on the user's current profile and target job.

USER PROFILE:
${userProfile}

TARGET ROLE: ${targetJobTitle}
OPTIMIZATION STYLE: ${optimizationStyle}

MODULE TO PERSONALIZE:
Title: ${moduleTemplate.title}
Chapters:
${JSON.stringify(moduleTemplate.chapterTemplates, null, 2)}

TASK:
1. Review each chapter in the module template.
2. Generate an \`actionableSummary\` for each chapter tailored to the user's current gaps. If they already know 80% of it, focus the summary on the missing 20%.
3. Recommend the best content type for them to learn this.
4. If the optimization style is "lowest_effort" or "fastest", and the user already heavily over-indexes on a skill, reduce the \`estimatedMins\`.
5. Keep the \`templateId\` intact.

Return the personalized chapters.
`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: BuildModuleChaptersOutputSchema }
  });

  if (!output) {
    throw new Error('Failed to generate module chapters.');
  }

  return output;
});
