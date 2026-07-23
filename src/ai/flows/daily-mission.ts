'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getRelevantPatterns } from '@/ai/cin/intelligence-api';

const MissionInputSchema = z.object({
  careerTwin: z.any().describe('The user\'s current Career Twin snapshot (score, health, bottlenecks)'),
  activeJobs: z.array(z.any()).describe('Jobs the user is currently targeting/tracking'),
  recentMemory: z.array(z.any()).describe('Events from the last 7 days'),
  cinGlobalPatterns: z.array(z.any()).describe('Anonymized population-level intelligence to guide your recommendations'),
  activeRoute: z.any().optional().describe('The user\'s current active career route'),
  routeExecutionState: z.any().optional().describe('Checkpoints, modules, chapters, and validation freshness'),
});

const TaskSchema = z.object({
  id: z.string(),
  title: z.string().describe('Short, imperative title (e.g., "Rewrite Resume Summary")'),
  description: z.string().describe('Why this needs to be done right now.'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  estimatedTimeMins: z.number().min(1).max(240).describe('Estimated minutes to complete'),
  expectedScoreIncrease: z.number().min(0).max(10).describe('Estimated Career Score increase (0-10)'),
  actionType: z.enum(['resume_rewrite', 'ats_scan', 'simulator', 'learning', 'interview_prep', 'profile_update', 'custom', 'route_chapter_prep', 'route_validation_refresh']),
  targetJobId: z.string().optional().describe('If this task is tied to a specific job destination'),
  routeId: z.string().optional().describe('If this task is tied to a specific route'),
  chapterId: z.string().optional().describe('If this task is tied to a specific chapter'),
  isCompleted: z.boolean().default(false),
  cinConfidence: z.number().min(0).max(100).optional().describe('Probability of success (0-100) based on global data'),
  cinRationale: z.string().optional().describe('Data-backed reason (e.g. "Based on 14,200 journeys, doing X improves Y by Z%")'),
  isBootstrapped: z.boolean().optional().describe('True if the pattern driving this is a synthetic prior'),
});

const RouteStateSchema = z.object({
  routeCompletion: z.number().min(0).max(100).describe('0-100 percentage of how close they are to the destination'),
  routeConfidence: z.number().min(0).max(100).describe('0-100 percentage based on validated readiness and freshness'),
  estimatedMonths: z.number().min(0).max(120).describe('Estimated months to reach destination'),
  routeStatus: z.enum(['on_track', 'accelerating', 'delayed', 'blocked']),
  topBlocker: z.string().describe('The single biggest obstacle (e.g. "Stale validation on core skills")'),
  accelerationOpportunity: z.string().describe('What action would reduce the ETA the most?'),
  explanationRaw: z.string().describe('Why this route status and ETA was chosen'),
});

const MissionOutputSchema = z.object({
  summary: z.string().describe('A 1-sentence executive brief for today (e.g., "Focus on your ATS score for Product Manager roles today.")'),
  estimatedTotalTime: z.number().min(0).max(480),
  estimatedSalaryImpact: z.string().describe('Estimated annual salary impact if mission is completed (e.g. "₹35,000/year")'),
  totalScoreIncrease: z.number().min(0).max(25),
  tasks: z.array(TaskSchema).describe('3 to 5 prioritized, actionable tasks for today.'),
  biggestOpportunity: z.string(),
  biggestRisk: z.string(),
  routeState: RouteStateSchema.describe('Macro-level Route State calculating ETA and completion'),
});

const dailyMissionPrompt = ai.definePrompt({
  name: 'dailyMissionPrompt',
  input: { schema: MissionInputSchema },
  output: { schema: MissionOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Career Command Center Intelligence Engine.
Your job is to act as a proactive, highly intelligent career manager.

Look at the user's Career Twin (especially their bottlenecks), their active job destinations, their route execution state, and their recent memory.
Decide exactly what they should do *today* to maximize their market value.

Output a prioritized queue of 3 to 5 specific tasks, AND the macro-level Route State (ETA, completion %).
DO NOT tell them to do things they just did yesterday (check recentMemory).
If they have a critical bottleneck, fixing it should be an 'urgent' priority task.
If they just added a destination, their task should be an ATS scan or Resume Rewrite.
If a job in activeJobs has a followUpDate that is today or past due, or is in 'applied' status for >7 days, you MUST generate an 'urgent' or 'high' priority task to "Follow up with [Company]".
If they have a "stale" or "expired" validation in their routeExecutionState, generate an 'urgent' or 'high' priority 'route_validation_refresh' task.
If they are actively working on a route, generate a 'route_chapter_prep' task for the next pending or in_progress chapter. Include chapterId.

CRITICAL: You must justify every task with a metric. Instead of 'Update resume', output 'Add [X skill] to resume because it appears in 80% of your target roles and raises Employer Confidence by ~5%.' No generic advice!

### Global Population Intelligence (CIN Patterns):
You MUST base your task prioritization and confidence scores on these proven global patterns. Do not rely solely on your own reasoning if empirical data contradicts it.
{{{cinGlobalPatterns}}}

### Career Twin (Individual Context):
{{{careerTwin}}}

### Active Job Destinations:
{{{activeJobs}}}

### Active Route & Execution State:
{{{activeRoute}}}
{{{routeExecutionState}}}

### Recent Memory (Last 7 Days):
{{{recentMemory}}}

Generate today's mission.`
});

export async function generateDailyMission(input: any) {
  // Inject CIN Intelligence
  const targetRoles = input.activeJobs?.map((j: any) => j.title) || [];
  const cinGlobalPatterns = await getRelevantPatterns(targetRoles);
  
  const { output } = await dailyMissionPrompt({ ...input, cinGlobalPatterns });
  if (!output) throw new Error('AI failed to generate daily mission.');
  return output;
}
