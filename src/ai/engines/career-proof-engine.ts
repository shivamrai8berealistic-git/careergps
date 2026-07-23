'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// The 10 employer trust signals
const ProofSignalSchema = z.object({
  signal: z.enum(['resume', 'linkedin', 'github', 'portfolio', 'projects', 'interview', 'skills', 'experience', 'reputation', 'visibility']),
  score: z.number().describe('0-100 score for this signal'),
  status: z.enum(['strong', 'weak', 'missing']),
  gap: z.string().describe('What is missing or weak'),
  highestROIAction: z.string().describe('Single best action to improve this signal'),
  etaImpactDays: z.number().describe('Estimated days ETA reduction if this gap is fixed'),
});

const ProjectRecommendationSchema = z.object({
  title: z.string().describe('Project name (e.g. "Build a Real-Time Job Notification Engine")'),
  problemSolved: z.string().describe('The real-world problem this project solves'),
  relevanceToTarget: z.string().describe('Why this is directly relevant to the target role'),
  techStack: z.array(z.string()),
  proofValue: z.object({
    resumeImpact: z.string(),
    githubImpact: z.string(),
    linkedinImpact: z.string(),
    interviewValue: z.string(),
  }),
  estimatedHours: z.number(),
  confidenceBoost: z.number().describe('Expected Employer Confidence Score increase (0-20)'),
  isPrimary: z.boolean().describe('True for the single highest-ROI recommendation'),
});

export const CareerProofOutputSchema = z.object({
  employerConfidenceScore: z.number().describe('Overall 0-100 employer confidence score'),
  signals: z.array(ProofSignalSchema),
  topProofGap: z.string().describe('The single biggest proof gap (1 sentence)'),
  topProofGapReason: z.string().describe('Why this gap hurts the user\'s employability specifically'),
  projectRecommendations: z.array(ProjectRecommendationSchema).describe('1 primary + 2 alternative projects'),
  proofRoute: z.array(z.string()).describe('Ordered list of 3-5 proof-building actions in priority order'),
  specialNote: z.string().optional().describe('Personalized note for Tier-2/Tier-3, career switcher, self-taught, or gap users'),
});

const careerProofEnginePrompt = ai.definePrompt({
  name: 'careerProofEnginePrompt',
  input: {
    schema: z.object({
      twin: z.any(),
      targetRole: z.string(),
      targetJobs: z.array(z.any()),
    })
  },
  output: { schema: CareerProofOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the Career Proof Engine for Career Pilot AI.

Your job is to help users become the employer's PREFERRED choice, not just a qualified candidate.

This is especially critical for users from:
- Tier-2 / Tier-3 college backgrounds
- Career switchers
- Self-taught backgrounds
- Users with employment gaps
- Users with little experience

You MUST be honest. If their GitHub is empty, say so. If they have no projects, say so. Do not pretend. The honesty is what makes this engine trustworthy.

### Career Twin (Current State):
{{{twin}}}

### Target Role:
{{{targetRole}}}

### Target Job Destinations:
{{{targetJobs}}}

### Instructions:
1. Calculate 'employerConfidenceScore' (0-100). This is NOT an ATS score. It represents how confident an employer would feel hiring this person based on all available signals.
2. Score each of the 10 proof signals.
3. Identify the single 'topProofGap' that is hurting employability the most.
4. Recommend 3 REAL PROBLEM-SOLVING projects. NOT tutorials. NOT "Build a Todo App." Real projects that:
   - Solve a real problem relevant to the target role
   - Can be explained clearly in interviews
   - Simultaneously improve Resume + GitHub + LinkedIn + Portfolio
   - The first project (isPrimary: true) must be the highest-ROI single action
5. Generate a prioritized 'proofRoute' (ordered list of proof-building steps).
6. If the user has a non-traditional background, write a personalized 'specialNote' about how to position their unique path as a strength, not a weakness.

Output the full Career Proof analysis.`
});

/**
 * The Career Proof Engine scores employer confidence and recommends the highest-ROI proof-building actions.
 * This is distinct from the Match Engine (which compares skills to JDs).
 * The Proof Engine asks: "Would an employer PREFER to hire this person over other candidates?"
 */
export async function runCareerProofEngine(twin: any, targetJobs: any[]) {
  const targetRole = targetJobs?.[0]?.title || twin?.targetRoles?.[0] || 'Software Engineer';
  
  const { output } = await careerProofEnginePrompt({ twin, targetRole, targetJobs });
  if (!output) throw new Error('Career Proof Engine failed.');
  return output;
}
