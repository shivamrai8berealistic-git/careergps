import { NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

// NOTE: A real implementation would fetch from the GitHub API using a PAT.
// For the MVP teaser, we generate a mock analysis based on typical issues.

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (await isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { username, targetRole } = await req.json();
    if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

    // Mock response simulating a GitHub API heuristic check
    return NextResponse.json({
      score: 45,
      topIssue: `Your repositories lack descriptive READMEs. Recruiters won't read raw code to understand what you built.`,
      quickWins: [
        'Add a structured README to your top 2 pinned repositories',
        'Create a GitHub Profile README (username/username)',
        'Add relevant topics/tags to your repositories'
      ],
      profileReadmeExists: false,
      pinnedRepos: 2
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
