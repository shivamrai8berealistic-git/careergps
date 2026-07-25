import { NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const interviewQuestionsPrompt = ai.definePrompt({
  name: 'publicInterviewQuestionsPrompt',
  input: { schema: z.object({ role: z.string() }) },
  output: { schema: z.object({ questions: z.array(z.string()) }) },
  model: 'googleai/gemini-2.5-flash',
  prompt: `Generate exactly 3 highly realistic interview questions for the role: {{{role}}}.
Include one behavioral question, one technical/domain question, and one situational question.`
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (await isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { role } = await req.json();
    if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 });

    const { output } = await interviewQuestionsPrompt({ role: role.slice(0, 100) });
    
    return NextResponse.json({ questions: output?.questions || ['Tell me about yourself.'] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
