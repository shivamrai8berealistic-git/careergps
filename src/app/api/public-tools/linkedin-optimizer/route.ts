import { NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const linkedinOptimizerPrompt = ai.definePrompt({
  name: 'publicLinkedinOptimizerPrompt',
  input: { schema: z.object({ headline: z.string(), about: z.string(), targetRole: z.string() }) },
  output: { 
    schema: z.object({ 
      score: z.number(),
      topIssue: z.string(),
      improvedHeadline: z.string(),
      quickWins: z.array(z.string())
    }) 
  },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert LinkedIn recruiter. Review this profile snippet.
Generate a score (0-100), identify the single biggest issue hurting their visibility, write a highly optimized new headline, and list 2 quick wins.
Target Role: {{{targetRole}}}
Headline: {{{headline}}}
About: {{{about}}}`
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { headline, about, targetRole } = await req.json();
    if (!headline) return NextResponse.json({ error: 'Missing headline' }, { status: 400 });

    const { output } = await linkedinOptimizerPrompt({ 
      headline: headline.slice(0, 300), 
      about: (about || '').slice(0, 1000), 
      targetRole: (targetRole || '').slice(0, 100) 
    });
    
    return NextResponse.json(output);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
