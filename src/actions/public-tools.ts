'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import crypto from 'crypto';

// Basic in-memory cache to prevent abuse from repeated identical requests
const responseCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getCacheKey(type: string, resumeText: string, jobText: string) {
  return crypto.createHash('sha256').update(`${type}-${resumeText}-${jobText}`).digest('hex');
}

function getFromCache(key: string) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  responseCache.set(key, { data, timestamp: Date.now() });
}

const PublicATSSchema = z.object({
  score: z.number().describe("Overall match score 0-100"),
  topStrength: z.string().describe("The single most important strength"),
  topGap: z.string().describe("The single most critical gap or weakness"),
  teaserMissingKeywords: z.array(z.string()).describe("Exactly 2 missing keywords to act as a teaser"),
});

const publicATSPrompt = ai.definePrompt({
  name: 'publicATSPrompt',
  input: { schema: z.object({ resumeText: z.string(), jobText: z.string() }) },
  output: { schema: PublicATSSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI Career Copilot generating a free teaser ATS report.
Given the following resume and job description, calculate a realistic ATS match score, identify their top strength, their biggest gap, and exactly 2 missing keywords.
Keep it extremely concise.

Resume:
{{{resumeText}}}

Job Description:
{{{jobText}}}`
});

export async function publicDeepATSScan(resumeText: string, jobText: string) {
  if (!resumeText || !jobText) throw new Error("Missing input");
  
  // Strict size limits
  const safeResume = resumeText.slice(0, 3000);
  const safeJob = jobText.slice(0, 3000);

  const cacheKey = getCacheKey('ats', safeResume, safeJob);
  const cached = getFromCache(cacheKey);
  if (cached) return { success: true, data: cached };

  const { output } = await publicATSPrompt({ resumeText: safeResume, jobText: safeJob });
  
  setCache(cacheKey, output);
  
  return { success: true, data: output };
}


const PublicRewriteSchema = z.object({
  originalBullet: z.string().describe("Extract one poorly written or weak bullet from the resume"),
  revisedBullet: z.string().describe("Provide a highly optimized, ATS-friendly revision of that single bullet based on the job description"),
  teaserKeywordsUsed: z.array(z.string()).describe("List 1 or 2 ATS keywords from the JD that were injected into this revised bullet")
});

const publicRewritePrompt = ai.definePrompt({
  name: 'publicRewritePrompt',
  input: { schema: z.object({ resumeText: z.string(), jobText: z.string() }) },
  output: { schema: PublicRewriteSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert Resume Writer generating a free preview of your services.
Given the following resume and job description, identify exactly ONE bullet point from the resume that could be improved to better match the job.
Rewrite that single bullet point to be highly impactful, metric-driven, and packed with relevant keywords from the job description.

Resume:
{{{resumeText}}}

Job Description:
{{{jobText}}}`
});

export async function publicResumeRewrite(resumeText: string, jobText: string) {
  if (!resumeText || !jobText) throw new Error("Missing input");
  
  const safeResume = resumeText.slice(0, 3000);
  const safeJob = jobText.slice(0, 3000);

  const cacheKey = getCacheKey('rewrite', safeResume, safeJob);
  const cached = getFromCache(cacheKey);
  if (cached) return { success: true, data: cached };

  const { output } = await publicRewritePrompt({ resumeText: safeResume, jobText: safeJob });
  
  setCache(cacheKey, output);
  
  return { success: true, data: output };
}
