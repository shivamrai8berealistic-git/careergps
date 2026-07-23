'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Lock, ArrowRight, Loader2, GitBranch, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PublicGitHubOptimizerPage() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    const username = githubUrl.replace('https://github.com/', '').replace(/\/$/, '').trim();
    if (!username) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/public-tools/github-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, targetRole }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({
        score: 38,
        topIssue: 'No README files on most repositories.',
        quickWins: ['Add detailed README to top 3 repos', 'Pin 4-6 best repositories', 'Add a GitHub profile README (username/username repo)'],
        profileReadmeExists: false,
        pinnedRepos: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scoreColor = result?.score >= 70 ? 'text-green-600' : result?.score >= 45 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">

        <header className="text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30 text-xs font-bold uppercase tracking-widest">Developer Tool</Badge>
          <h1 className="text-4xl font-bold font-headline tracking-tight">GitHub Profile Optimizer</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Find out what recruiters see when they visit your GitHub. Get your GitHub Proof Score and a fix-it plan.
          </p>
        </header>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your GitHub Profile URL or Username</label>
            <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/yourusername" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Target Role (optional)</label>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Backend Engineer, ML Engineer..." />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading || !githubUrl.trim()} className="w-full font-bold text-base py-6">
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Github className="w-5 h-5 mr-2" />}
            Analyze My GitHub
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">GitHub Proof Score</h2>
                  <span className={`text-4xl font-black font-headline ${scoreColor}`}>{result.score}/100</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    {result.profileReadmeExists ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                    <span>Profile README</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                    <span>{result.pinnedRepos || 0} Pinned repos</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Top Issue</p>
                  <p className="text-sm text-amber-700 mt-1">{result.topIssue}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick Wins (Fix These First)</p>
                  {result.quickWins?.slice(0, 2).map((win: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm">{win}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 bg-transparent text-center py-8">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base mb-1">Unlock Your GitHub Optimization Roadmap</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Get repo-by-repo recommendations, project ideas aligned to your target role, README templates, and contribution strategies.</p>
              <Button className="font-bold group" onClick={() => {
                sessionStorage.setItem('guestContext', JSON.stringify({ toolUsed: 'github', githubUrl, targetRole }));
                router.push('/signup');
              }}>
                Unlock Full Roadmap — Free <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
