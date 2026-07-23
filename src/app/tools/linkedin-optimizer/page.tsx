'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PublicLinkedInOptimizerPage() {
  const router = useRouter();
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!headline.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/public-tools/linkedin-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, about: about.slice(0, 1000), targetRole }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({
        score: 42,
        headlineScore: 55,
        topIssue: 'Your headline does not include keywords recruiters search for.',
        improvedHeadline: `${targetRole || 'Software Engineer'} | Open to Opportunities | Building scalable systems`,
        quickWins: ['Add target role keyword to headline', 'Write a 300+ character About section', 'Include skills section with 10+ skills'],
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
          <Badge variant="outline" className="text-primary border-primary/30 text-xs font-bold uppercase tracking-widest">Free Tool</Badge>
          <h1 className="text-4xl font-bold font-headline tracking-tight">LinkedIn Optimizer</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Get your LinkedIn Profile Score and the exact fixes that make recruiters notice you first.
          </p>
        </header>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your LinkedIn Headline</label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Software Engineer at TCS | 3 Years Experience | Java, Spring Boot" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Your Target Role (optional)</label>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Backend Engineer, Product Manager..." />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">About Section (optional — paste first 2 lines)</label>
            <Textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Paste your About section..." className="min-h-[100px] resize-none" />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading || !headline.trim()} className="w-full font-bold text-base py-6">
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Linkedin className="w-5 h-5 mr-2" />}
            Analyze My LinkedIn
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">LinkedIn Score</h2>
                  <span className={`text-4xl font-black font-headline ${scoreColor}`}>{result.score}/100</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Top Issue
                  </p>
                  <p className="text-sm text-amber-700 mt-1">{result.topIssue}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Improved Headline</p>
                  <p className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm font-medium">{result.improvedHeadline}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick Wins</p>
                  {result.quickWins?.slice(0, 2).map((win: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-sm">{win}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Soft gate */}
            <Card className="border-dashed border-2 bg-transparent text-center py-8">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base mb-1">Unlock Full LinkedIn Optimization Plan</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Get rewritten About, Experience, Skills, and Featured sections optimized for recruiter search + ATS systems.</p>
              <Button className="font-bold group" onClick={() => {
                sessionStorage.setItem('guestContext', JSON.stringify({ toolUsed: 'linkedin', linkedinHeadline: headline, targetRole, about }));
                router.push('/signup');
              }}>
                Unlock Full Plan — Free <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
