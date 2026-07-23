import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { RouteStyle } from '@/types/route';

export const ChapterTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  skillTag: z.string(),
  validationMethod: z.string(),
  estimatedMins: z.number(),
  preparationHints: z.object({
    preferredContentType: z.enum(['platform_tool', 'video', 'article', 'ai_summary', 'practice']),
    keyTopics: z.array(z.string()),
  }),
});

export const ModuleTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  isOptional: z.boolean(),
  chapterTemplates: z.array(ChapterTemplateSchema),
});

export const CheckpointTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  skillCategory: z.string(),
  isOptional: z.boolean(),
  dependencies: z.array(z.string()),
  estimatedWeeks: z.number(),
  moduleTemplates: z.array(ModuleTemplateSchema),
});

export const BlueprintSchema = z.object({
  id: z.string(),
  metadata: z.object({
    title: z.string(),
    industry: z.string(),
    level: z.string(),
    avgSalaryRange: z.string(),
  }),
  prerequisites: z.array(z.string()),
  checkpointTemplates: z.array(CheckpointTemplateSchema),
});

export const BuildRouteInputSchema = z.object({
  blueprint: BlueprintSchema,
  userProfile: z.string(), // Career Twin profile
  targetJobTitle: z.string(),
  optimizationStyle: z.enum(['fastest', 'highest_success', 'highest_salary', 'lowest_effort', 'fast_career_switch']).default('fastest'),
});

const PersonalizedModuleSchema = z.object({
  templateId: z.string(),
  title: z.string(),
  isSkipped: z.boolean().describe("True if the user already knows this material, false otherwise."),
  rationale: z.string().describe("Why is this module included or skipped based on the user's current profile?"),
});

const PersonalizedCheckpointSchema = z.object({
  templateId: z.string(),
  title: z.string(),
  estimatedWeeks: z.number(),
  dependencies: z.array(z.string()),
  modules: z.array(PersonalizedModuleSchema),
  rationale: z.string().describe("Why is this checkpoint included or modified based on the user's current profile?"),
});

export const BuildRouteOutputSchema = z.object({
  routeStyle: z.enum(['fastest', 'highest_success', 'highest_salary', 'lowest_effort', 'fast_career_switch']),
  explanation: z.string().describe("Why this route is optimal for this optimization style given the user's profile."),
  estimatedTotalWeeks: z.number(),
  checkpoints: z.array(PersonalizedCheckpointSchema),
});

export type BuildRouteInput = z.infer<typeof BuildRouteInputSchema>;
export type BuildRouteOutput = z.infer<typeof BuildRouteOutputSchema>;

export const buildCareerRouteFlow = ai.defineFlow({
  name: 'buildCareerRoute',
  inputSchema: BuildRouteInputSchema,
  outputSchema: BuildRouteOutputSchema,
}, async (input) => {
  const { blueprint, userProfile, targetJobTitle, optimizationStyle } = input;

  const prompt = `
You are the Route Builder for Career Pilot AI. Your job is to take a standardized Career Knowledge Graph blueprint and personalize it for a specific user.

USER PROFILE (Current Position):
${userProfile}

TARGET ROLE: ${targetJobTitle}
BLUEPRINT ROLE: ${blueprint.metadata.title} (${blueprint.metadata.level})

OPTIMIZATION STYLE: ${optimizationStyle}
- fastest: Skip optional modules, assume fast learning velocity, prioritize direct path.
- highest_success: Include all deep-dives, maximize preparation, assume normal velocity.
- highest_salary: Focus heavily on negotiation, premium skills, and systemic design.
- lowest_effort: Aggressively skip things the user already knows. Minimum viable path.
- fast_career_switch: Focus on transferable skills and portfolio building.

THE BLUEPRINT:
${JSON.stringify(blueprint.checkpointTemplates, null, 2)}

TASK:
1. Compare the User Profile against the Blueprint.
2. Determine which Checkpoints/Modules/Chapters the user already knows. Either skip them (if optimization style allows) or reduce their estimated time.
3. Keep the structural IDs (templateId) intact so we can link back to the Knowledge Graph.
4. Do NOT generate chapters. You are only generating the high-level Checkpoint and Module skeleton.
5. Provide an explanation of why this personalized route fits the selected optimization style.

Be highly analytical, encouraging, and extremely practical.
`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: BuildRouteOutputSchema }
  });

  if (!output) {
    throw new Error('Failed to generate personalized route.');
  }

  return output;
});
