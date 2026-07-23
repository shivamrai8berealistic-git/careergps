import { NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const interviewFeedbackPrompt = ai.definePrompt({
  name: 'publicInterviewFeedbackPrompt',
  input: { schema: z.object({ question: z.string(), answer: z.string() }) },
  output: { schema: z.object({ feedback: z.string() }) },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert interview coach. Review this answer to the following interview question.
Provide ONE concise sentence of positive reinforcement, and ONE concise sentence on how to improve it using the STAR method. Keep it very brief as this is a free teaser.

Question: {{{question}}}
Answer: {{{answer}}}`
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { question, answer } = await req.json();
    if (!question || !answer) return NextResponse.json({ error: 'Missing input' }, { status: 400 });

    const { output } = await interviewFeedbackPrompt({ question: question.slice(0, 300), answer: answer.slice(0, 2000) });
    
    return NextResponse.json({ feedback: output?.feedback || 'Good attempt. Focus on structuring your answer with the STAR method for better impact.' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
