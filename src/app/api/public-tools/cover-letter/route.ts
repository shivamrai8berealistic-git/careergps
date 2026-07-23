import { NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const coverLetterPrompt = ai.definePrompt({
  name: 'publicCoverLetterPrompt',
  input: { schema: z.object({ resume: z.string(), jobDescription: z.string() }) },
  output: { schema: z.object({ preview: z.string() }) },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert career coach writing a highly tailored cover letter.
Using the provided resume and job description, write a compelling cover letter.
IMPORTANT: Return ONLY the FIRST paragraph of the cover letter. Do not return the full letter. Make it punchy and highlight the most relevant metric or achievement from the resume that matches the job description.

Resume:
{{{resume}}}

Job Description:
{{{jobDescription}}}`
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { resume, jobDescription } = await req.json();
    if (!resume || !jobDescription) return NextResponse.json({ error: 'Missing input' }, { status: 400 });

    const safeResume = resume.slice(0, 3000);
    const safeJob = jobDescription.slice(0, 2000);

    const { output } = await coverLetterPrompt({ resume: safeResume, jobDescription: safeJob });
    
    return NextResponse.json({ preview: output?.preview || 'Dear Hiring Manager...' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
