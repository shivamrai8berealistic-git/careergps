'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ScanSearch, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { publicDeepATSScan } from '@/actions/public-tools';
import { SoftGate } from '@/components/soft-gate-overlay';
import { Badge } from '@/components/ui/badge';

export default function PublicATSScanPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobText, setJobText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  // Auto-fill from sessionStorage if they return
  useEffect(() => {
    const savedResume = sessionStorage.getItem('guestResume');
    const savedJob = sessionStorage.getItem('guestJob');
    if (savedResume) setResumeText(savedResume);
    if (savedJob) setJobText(savedJob);
  }, []);

  const handleScan = async () => {
    if (!resumeText.trim() || !jobText.trim()) {
      setError("Please paste both your resume and the job description.");
      return;
    }
    setError('');
    setIsScanning(true);
    
    // Save to session storage for post-signup handoff
    sessionStorage.setItem('guestResume', resumeText);
    sessionStorage.setItem('guestJob', jobText);
    sessionStorage.setItem('guestIntent', 'ats');

    try {
      const result = await publicDeepATSScan(resumeText, jobText);
      setReport(result.data);
    } catch (err: any) {
      setError("Failed to run scan. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-2">
            <ScanSearch className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground">Free Deep ATS Scan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find out exactly what the screening bots see. Paste your resume and a target job to uncover hidden gaps and missing keywords instantly.
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
                <Button size="lg" onClick={handleScan} disabled={isScanning} className="w-full md:w-auto px-12 h-14 text-lg shadow-xl hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700">
                  {isScanning ? (
                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Analyzing Match...</>
                  ) : (
                    <><ScanSearch className="mr-2 h-5 w-5" /> Run Free ATS Scan</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {report && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Top Level Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 border-primary/10 shadow-sm flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-card to-blue-50">
                <div className="relative">
                  <svg className="w-32 h-32" viewBox="0 0 100 100">
                    <circle className="text-muted/20 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                    <circle 
                      className={`${report.score >= 70 ? 'text-green-500' : report.score >= 40 ? 'text-amber-500' : 'text-red-500'} stroke-current transition-all duration-1000 ease-out`} 
                      strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" 
                      strokeDasharray={`${report.score * 2.51} 251.2`} 
                      transform="rotate(-90 50 50)"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold">{report.score}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Score</span>
                  </div>
                </div>
              </Card>

              <Card className="md:col-span-2 border-primary/10 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">Initial Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-sm uppercase text-muted-foreground">Top Strength</span>
                      <p className="text-foreground">{report.topStrength}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-sm uppercase text-muted-foreground">Critical Gap</span>
                      <p className="text-foreground">{report.topGap}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* The Soft Gate for Missing Keywords */}
            <SoftGate isLocked={true} title="Unlock Full Keyword Analysis">
              <Card className="border-primary/10 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ScanSearch className="h-5 w-5" />
                    Missing ATS Keywords
                  </CardTitle>
                  <CardDescription>The screening bots are looking for these specific terms which are missing from your resume.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.teaserMissingKeywords.map((kw: string) => (
                      <Badge key={kw} variant="destructive" className="bg-red-100 text-red-700 border-red-200">{kw}</Badge>
                    ))}
                    {/* Dummy badges for the blur effect */}
                    <Badge variant="outline" className="opacity-50">Project Management</Badge>
                    <Badge variant="outline" className="opacity-50">Agile</Badge>
                    <Badge variant="outline" className="opacity-50">Data Analysis</Badge>
                    <Badge variant="outline" className="opacity-50">KPIs</Badge>
                  </div>
                  
                  <h4 className="font-semibold text-sm mt-6 mb-2">Recommended Next Actions</h4>
                  <ul className="space-y-2 opacity-60">
                    <li className="flex items-start gap-2 text-sm"><ArrowRight className="h-4 w-4 mt-0.5" /> Rewrite your professional summary to include [Hidden Keyword].</li>
                    <li className="flex items-start gap-2 text-sm"><ArrowRight className="h-4 w-4 mt-0.5" /> Add a new bullet point under your most recent role demonstrating [Hidden Skill].</li>
                  </ul>
                </CardContent>
              </Card>
            </SoftGate>

          </div>
        )}

      </div>
    </div>
  );
}
