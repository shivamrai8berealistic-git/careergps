import { NextResponse } from 'next/server';
import { runSalaryEngine } from '@/ai/engines/salary-engine';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { role, city, experience } = await req.json();
    if (!role || !city || !experience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Input length limits (abuse protection)
    if (role.length > 100 || city.length > 60) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }

    const result = await runSalaryEngine(role.trim(), city.trim(), experience.trim());

    // Return only the public preview (medianSalary + limited data)
    return NextResponse.json({
      medianSalary: result.medianSalary,
      role: role.trim(),
      city: city.trim(),
      cityPremium: result.cityPremium,
      growthOutlook: result.growthOutlook,
      // Full bands locked behind auth
    });
    
  } catch (error) {
    console.error('Salary check API error:', error);
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many')) {
      return NextResponse.json({ error: 'Too many requests. AI capacity is currently at limit.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
