'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Lock, ArrowRight, Loader2, FileText } from 'lucide-react';

export default function PublicCoverLetterPage() {
  const router = useRouter();
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleGenerate = async () => {
    if (!resume.trim() || !jobDescription.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/public-tools/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resume.slice(0, 3000), jobDescription: jobDescription.slice(0, 2000) }),
      });
      const data = await res.json();
      if (data.preview) setPreview(data.preview);
    } catch (e) {
      setPreview("Dear Hiring Manager,\n\nI am writing to express my strong interest in this role...");
    } finally {
      setIsLoading(false);
      setHasSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">

        <header className="text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30 text-xs font-bold uppercase tracking-widest">Free Tool</Badge>
          <h1 className="text-4xl font-bold font-headline tracking-tight">AI Cover Letter Generator</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Generate a role-specific, personalized cover letter in seconds. Tuned to the exact job description — not a generic template.
          </p>
        </header>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your Resume / Profile Summary</label>
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume or a brief summary of your experience..."
              className="min-h-[140px] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Job Description</label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[140px] resize-none"
            />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading || !resume.trim() || !jobDescription.trim()} className="w-full font-bold text-base py-6">
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
            Generate Cover Letter
          </Button>
        </div>

        {hasSubmitted && preview && (
          <Card className="border-primary/20 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 bg-muted/30 border-b flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Preview</span>
                <Badge variant="secondary">First paragraph unlocked</Badge>
              </div>
              <div className="p-5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {preview}
              </div>
              {/* Soft gate */}
              <div className="relative">
                <div className="p-5 blur-sm text-sm leading-relaxed text-foreground select-none pointer-events-none">
                  I have consistently delivered results in fast-paced engineering environments. At [Company], I led a team of 4 engineers to refactor our legacy authentication system, cutting login time by 40% and improving security compliance scores to 98%...
                  {'\n\n'}Thank you for considering my application. I look forward to discussing how my experience can contribute to [Company]'s continued success.
                  {'\n\n'}Sincerely,
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-background/95 via-background/80 to-transparent p-8 text-center">
                  <Lock className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-1">Unlock the Full Letter</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-sm">Sign up free to download the complete cover letter, save it to your Career Twin, and tailor it to multiple destinations.</p>
                  <Button className="font-bold group" onClick={() => {
                    sessionStorage.setItem('guestContext', JSON.stringify({ toolUsed: 'cover-letter', targetRole: jobDescription }));
                    router.push('/signup');
                  }}>
                    Unlock 1-Click Generator — Free <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
