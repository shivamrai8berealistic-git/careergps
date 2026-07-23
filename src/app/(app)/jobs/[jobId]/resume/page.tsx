'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { executeResumeRewrite, acceptResumeChanges } from '@/actions/tool-actions';
import { toast } from 'sonner';

export default function ResumeRewritePage({ params }: { params: { jobId: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [job, setJob] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || !params.jobId) return;

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', params.jobId);
    const reportRef = doc(firestore, 'users', user.uid, 'jobs', params.jobId, 'ai_reports', 'resume_rewrite');

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

  const handleRunRewrite = async () => {
    if (!user || !job?.id) return;
    setIsRewriting(true);
    try {
      const token = await user.getIdToken();
      await executeResumeRewrite(token, job.id);
      toast.success("Resume optimized successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to rewrite resume.");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAcceptChanges = async () => {
    if (!user || !job?.id || !report) return;
    setIsSaving(true);
    try {
      // In a full implementation, this would patch the specific `users/{userId}/resumes/{id}` doc.
      // For this MVP UI, we simulate the save and mark the GPS route step as completed.
      
      // Update the GPS Route step if it exists
      let updatedRoute = job.computedRoute;
      if (updatedRoute && updatedRoute.steps) {
         updatedRoute.steps = updatedRoute.steps.map((step: any) => 
           step.actionType === 'rewrite_resume' ? { ...step, isCompleted: true } : step
         );
      }

      const token = await user.getIdToken();
      await acceptResumeChanges(token, job.id, updatedRoute);

      toast.success("Profile updated! Your GPS route has been recalculated.");
    } catch (error: any) {
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to GPS
          </Link>
          <h2 className="text-3xl font-bold font-headline text-primary tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-violet-500" />
            1-Click Resume Rewriter
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Destination: <span className="font-semibold text-foreground">{job.title} at {job.company}</span>
          </p>
        </div>
      </div>

      {!report ? (
        <Card className="border-primary/20 bg-primary/5 shadow-md text-center py-16">
          <CardHeader>
            <Sparkles className="h-16 w-16 text-primary/40 mx-auto mb-4" />
            <CardTitle className="text-2xl">Optimize for this Destination</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2 text-base">
              Instantly rewrite your resume bullets and professional summary to highlight the exact keywords and experiences this specific job is looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleRunRewrite} disabled={isRewriting} className="shadow-lg hover:scale-105 transition-transform bg-violet-600 hover:bg-violet-700 text-white">
              {isRewriting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Optimizing...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> 1-Click AI Rewrite (5 Credits)</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          
          <div className="flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
             <div>
               <h3 className="font-semibold">Optimization Complete!</h3>
               <p className="text-sm text-muted-foreground">Review the AI suggestions below and accept them to update your Career Twin.</p>
             </div>
             <Button onClick={handleAcceptChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
               Accept All Changes
             </Button>
          </div>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Targeted Keyword Injection</CardTitle>
              <CardDescription>We've integrated these missing ATS keywords into the revisions below.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-wrap gap-2">
                 {report.keywordSuggestions.map((kw: string) => (
                   <Badge key={kw} variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-200 border-none">
                     {kw}
                   </Badge>
                 ))}
               </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm overflow-hidden">
             <div className="bg-muted/50 p-4 border-b">
                <CardTitle className="text-lg">Professional Summary</CardTitle>
             </div>
             <CardContent className="p-0">
               <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                 <div className="p-6 bg-red-50/10">
                   <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Original Profile Summary</p>
                   <p className="text-sm text-foreground/80 line-through decoration-red-300">
                     (Your current standard summary will be replaced)
                   </p>
                 </div>
                 <div className="p-6 bg-green-50/30">
                   <p className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1">
                     <Sparkles className="h-3 w-3" /> Optimized Summary
                   </p>
                   <p className="text-sm font-medium text-foreground">{report.revisedSummarySuggestion}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-headline mt-8">Experience Bullet Revisions</h3>
            {report.revisedBulletSuggestions.map((suggestion: any, index: number) => (
               <Card key={index} className="border-primary/10 shadow-sm overflow-hidden">
                 <CardContent className="p-0">
                   <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                     <div className="p-6 bg-red-50/10">
                       <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Original Bullet</p>
                       <p className="text-sm text-foreground/80">{suggestion.originalBullet}</p>
                     </div>
                     <div className="p-6 bg-green-50/30 relative">
                       <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 hidden md:flex h-6 w-6 rounded-full bg-border items-center justify-center border-2 border-background">
                         <ArrowRight className="h-3 w-3 text-muted-foreground" />
                       </div>
                       <p className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1">
                         <Sparkles className="h-3 w-3" /> Optimized Bullet
                       </p>
                       <p className="text-sm font-medium text-foreground">{suggestion.revisedBullet}</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
