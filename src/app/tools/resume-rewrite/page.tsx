'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { publicResumeRewrite } from '@/actions/public-tools';
import { SoftGate } from '@/components/soft-gate-overlay';
import { Badge } from '@/components/ui/badge';

export default function PublicResumeRewritePage() {
  const [resumeText, setResumeText] = useState('');
  const [jobText, setJobText] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  // Auto-fill from sessionStorage if they return
  useEffect(() => {
    const savedResume = sessionStorage.getItem('guestResume');
    const savedJob = sessionStorage.getItem('guestJob');
    if (savedResume) setResumeText(savedResume);
    if (savedJob) setJobText(savedJob);
  }, []);

  const handleRewrite = async () => {
    if (!resumeText.trim() || !jobText.trim()) {
      setError("Please paste both your resume and the job description.");
      return;
    }
    setError('');
    setIsRewriting(true);
    
    // Save to session storage for post-signup handoff
    sessionStorage.setItem('guestResume', resumeText);
    sessionStorage.setItem('guestJob', jobText);
    sessionStorage.setItem('guestIntent', 'rewrite');

    try {
      const result = await publicResumeRewrite(resumeText, jobText);
      setReport(result.data);
    } catch (err: any) {
      setError("Failed to generate preview. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-violet-100 rounded-full mb-2">
            <FileText className="h-8 w-8 text-violet-600" />
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground">Free Resume Rewriter Preview</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See the magic of the Career AI. We'll pick one bullet from your resume and optimize it for your target job description instantly.
          </p>
        </div>

        {/* Input Form */}
        {!report && (
          <Card className="border-primary/10 shadow-lg">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">1. Paste Your Resume</label>
                  <Textarea 
                    placeholder="Paste your full resume text here..." 
                    className="min-h-[250px] resize-none"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">2. Paste Job Description</label>
                  <Textarea 
                    placeholder="Paste the job description you want to apply for..." 
                    className="min-h-[250px] resize-none"
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleRewrite} disabled={isRewriting} className="w-full md:w-auto px-12 h-14 text-lg shadow-xl hover:scale-105 transition-transform bg-violet-600 hover:bg-violet-700 text-white">
                  {isRewriting ? (
                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Optimizing Bullet...</>
                  ) : (
                    <><Sparkles className="mr-2 h-5 w-5" /> Generate Free Preview</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {report && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            
            <div className="text-center">
              <h2 className="text-2xl font-bold font-headline text-foreground mb-2">Here is your optimized bullet point:</h2>
              <p className="text-muted-foreground">We injected exactly what the hiring manager is looking for.</p>
            </div>

            <Card className="border-primary/10 shadow-xl overflow-hidden">
               <CardContent className="p-0">
                 <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                   <div className="p-8 bg-red-50/10">
                     <p className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-wider">Your Original Bullet</p>
                     <p className="text-base text-foreground/80 leading-relaxed">{report.originalBullet}</p>
                   </div>
                   <div className="p-8 bg-green-50/30 relative">
                     <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 hidden md:flex h-8 w-8 rounded-full bg-border items-center justify-center border-4 border-background">
                       <ArrowRight className="h-4 w-4 text-muted-foreground" />
                     </div>
                     <p className="text-xs font-bold text-green-700 uppercase mb-4 tracking-wider flex items-center gap-1">
                       <Sparkles className="h-3 w-3" /> AI Optimized Bullet
                     </p>
                     <p className="text-base font-medium text-foreground leading-relaxed">{report.revisedBullet}</p>
                     
                     <div className="mt-6 pt-4 border-t border-green-200/50">
                       <p className="text-xs font-bold text-green-700/70 uppercase mb-2">Keywords Injected:</p>
                       <div className="flex flex-wrap gap-2">
                         {report.teaserKeywordsUsed.map((kw: string) => (
                           <Badge key={kw} variant="secondary" className="bg-white text-green-700 border border-green-200 shadow-sm">{kw}</Badge>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               </CardContent>
            </Card>

            {/* The Soft Gate for the rest of the resume */}
            <SoftGate 
              isLocked={true} 
              title="Unlock Your Full Optimized Resume"
              description="Sign up to rewrite your entire resume (all bullets and summary), save it to your Career Twin, and calculate your exact GPS Route to landing this job."
            >
              <div className="space-y-4">
                 <Card className="border-primary/10 shadow-sm overflow-hidden opacity-80">
                   <CardContent className="p-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 divide-x">
                       <div className="p-6 bg-red-50/10 text-muted-foreground/50">Original bullet point...</div>
                       <div className="p-6 bg-green-50/30 text-green-700/50">Optimized bullet point...</div>
                     </div>
                   </CardContent>
                 </Card>
                 <Card className="border-primary/10 shadow-sm overflow-hidden opacity-60">
                   <CardContent className="p-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 divide-x">
                       <div className="p-6 bg-red-50/10 text-muted-foreground/50">Original bullet point...</div>
                       <div className="p-6 bg-green-50/30 text-green-700/50">Optimized bullet point...</div>
                     </div>
                   </CardContent>
                 </Card>
              </div>
            </SoftGate>

          </div>
        )}

      </div>
    </div>
  );
}
