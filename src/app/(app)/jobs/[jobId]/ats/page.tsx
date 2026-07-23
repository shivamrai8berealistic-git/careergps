'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  ScanSearch,
  ArrowLeft,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { executeDeepATSScan } from '@/actions/tool-actions';
import { toast } from 'sonner';

export default function ATSScorePage({ params }: { params: { jobId: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [job, setJob] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.jobId) return;

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', params.jobId);
    const reportRef = doc(firestore, 'users', user.uid, 'jobs', params.jobId, 'ai_reports', 'ats_scan');

    const unsubscribeJob = onSnapshot(jobRef, (docSnap) => {
      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() });
      } else {
        setJob(null);
      }
      setIsLoading(false);
    });

    const unsubscribeReport = onSnapshot(reportRef, (docSnap) => {
      if (docSnap.exists()) {
        setReport(docSnap.data().report);
      }
    });

    return () => { unsubscribeJob(); unsubscribeReport(); };
  }, [user, firestore, params.jobId]);

  const handleRunScan = async () => {
    if (!user || !job?.id) return;
    setIsScanning(true);
    try {
      const token = await user.getIdToken();
      await executeDeepATSScan(token, job.id);
      toast.success("Deep ATS Scan completed!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to run scan.");
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading destination data...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Destination Not Found</h2>
        <Link href="/dashboard" className="text-primary hover:underline mt-4 inline-block">Return to Dashboard</Link>
      </div>
    );
  }



  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to GPS
          </Link>
          <h2 className="text-3xl font-bold font-headline text-primary tracking-tight flex items-center gap-2">
            <ScanSearch className="h-8 w-8 text-blue-500" />
            Deep ATS Scan
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Destination: <span className="font-semibold text-foreground">{job.title} at {job.company}</span>
          </p>
        </div>
      </div>

      {!report ? (
        <Card className="border-primary/20 bg-primary/5 shadow-md text-center py-12">
          <CardHeader>
            <ScanSearch className="h-16 w-16 text-primary/40 mx-auto mb-4" />
            <CardTitle className="text-2xl">Unlock Deep Analysis</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2 text-base">
              Run a Deep ATS scan to get a full breakdown of your strengths, hidden gaps, and the exact keywords you are missing to beat the screening bots for this role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleRunScan} disabled={isScanning} className="shadow-lg hover:scale-105 transition-transform">
              {isScanning ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Scanning...</>
              ) : (
                <><Lock className="mr-2 h-4 w-4" /> Run Deep Scan (2 Credits)</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Top Level Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-primary/10 shadow-sm flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-card to-primary/5">
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
                <CardTitle>AI Copilot Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{report.recommendationSummary}</p>
                
                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Recommended Next Steps</h4>
                  <ul className="space-y-2">
                    {report.nextActions.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gaps & Missing */}
            <Card className="border-red-200 bg-red-50/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Gaps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3">Missing Keywords (Add these to resume)</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.missingSkills.length > 0 ? report.missingSkills.map((skill: string) => (
                      <Badge key={skill} variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">{skill}</Badge>
                    )) : <span className="text-sm text-muted-foreground italic">No missing skills detected.</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Weaknesses</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                    {report.gaps.map((gap: string, i: number) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Matched */}
            <Card className="border-green-200 bg-green-50/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3">Matched Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.matchedSkills.length > 0 ? report.matchedSkills.map((skill: string) => (
                      <Badge key={skill} variant="outline" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">{skill}</Badge>
                    )) : <span className="text-sm text-muted-foreground italic">No exact skill matches detected.</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Advantages</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                    {report.strengths.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-4">
             <Link href={`/jobs/${job.id}/resume`}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8">
                  Proceed to 1-Click Resume Rewrite &rarr;
                </Button>
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
