'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bookmark,
  CheckCircle,
  ExternalLink,
  Wand2,
  XCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
  Zap,
  Globe,
  ShieldAlert,
  Trophy,
  PartyPopper
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useJobs, useJobAnalysis, useProfile, useResumes } from '@/hooks/useJobs';
import { useUser } from '@/firebase';
import { analyzeJob } from '@/ai/flows/analyze-job';
import { toast } from 'sonner';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Suspense } from 'react';

import { triggerActiveRouteRecalculation } from '@/actions/route-actions';

function JobAnalysisContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = params?.jobId as string;

  const { user } = useUser();
  const { getJob, updateJobStatus, updateJobFollowUp, saveAnalysis } = useJobs();
  const { analysis, isLoading: isAnalysisLoading } = useJobAnalysis(jobId);
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { getPrimaryResume, getParsedResume, isLoading: isResumesLoading } = useResumes();

  const [job, setJob] = useState<any>(null);
  const [isJobLoading, setIsJobLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const autoAnalyzeTriggered = useRef(false);
  const shouldAutoAnalyze = searchParams.get('analyze') === 'true';

  useEffect(() => {
    if (jobId) {
      getJob(jobId).then((data) => {
        setJob(data);
        setIsJobLoading(false);
      });
    }
  }, [jobId]);

  const handleAnalyze = async () => {
    if (!profile) {
      toast.error('Please complete your profile first.', {
        action: { label: 'Go to Profile', onClick: () => router.push('/profile') },
      });
      return;
    }

    const resume = getPrimaryResume();
    if (!resume) {
      toast.error('Please upload a resume first.', {
        action: { label: 'Upload Resume', onClick: () => router.push('/resumes') },
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const parsedResume = await getParsedResume(resume.id);
      if (!parsedResume) {
        toast.error('Resume data not found. Try re-uploading.');
        return;
      }

      const currentJob = job;
      const results = await analyzeJob({
        userId: user?.uid || '',
        userProfile: profile,
        structuredResume: parsedResume as any,
        structuredJob: {
          title: currentJob.title,
          company: currentJob.company,
          location: currentJob.location,
          description: currentJob.description,
        },
      });

      await saveAnalysis(jobId, results);
      toast.success('Match analysis complete!');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      if (error.message?.includes('QUOTA_EXCEEDED')) {
        toast.error(error.message.replace('QUOTA_EXCEEDED: ', ''), {
          action: { label: 'Upgrade', onClick: () => router.push('/pricing') },
        });
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-trigger analysis if ?analyze=true and we have everything needed
  useEffect(() => {
    if (
      shouldAutoAnalyze &&
      !autoAnalyzeTriggered.current &&
      !isJobLoading &&
      !isProfileLoading &&
      !isResumesLoading &&
      !isAnalysisLoading &&
      job &&
      profile &&
      getPrimaryResume() &&
      !analysis &&
      !isAnalyzing
    ) {
      autoAnalyzeTriggered.current = true;
      // Small delay so the page renders first
      setTimeout(() => {
        handleAnalyze();
      }, 800);
    }
  }, [
    shouldAutoAnalyze,
    isJobLoading,
    isProfileLoading,
    isResumesLoading,
    isAnalysisLoading,
    job,
    profile,
    analysis,
    isAnalyzing,
  ]);

  const handleUpdateStatus = async (status: any) => {
    try {
      await updateJobStatus(jobId, status);
      setJob({ ...job, status });
      toast.success(`Status updated to ${status}`);
      
      if (user) {
        const token = await user.getIdToken();
        await triggerActiveRouteRecalculation(token);
      }
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleUpdateFollowUpDate = async (dateStr: string) => {
    try {
      await updateJobFollowUp(jobId, { followUpDate: dateStr });
      setJob({ ...job, followUpDate: dateStr });
      toast.success('Follow-up date saved.');
    } catch {
      toast.error('Failed to save follow-up date.');
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    try {
      await updateJobFollowUp(jobId, { followUpNotes: notes });
      setJob({ ...job, followUpNotes: notes });
      toast.success('Notes saved.');
    } catch {
      toast.error('Failed to save notes.');
    }
  };

  const isPageLoading = isJobLoading || isProfileLoading || isResumesLoading || isAnalysisLoading;

  if (isPageLoading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading job insights...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Job not found</h2>
        <p className="text-muted-foreground mt-2">
          The job you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/jobs">Return to Tracker</Link>
        </Button>
      </div>
    );
  }

  const hasMissingRequirements = !profile || !getPrimaryResume();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Offer Celebration Banner ── */}
      {job.status === 'offer' && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg animate-in slide-in-from-top-4 duration-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Offer Received! <PartyPopper className="h-5 w-5" />
              </h2>
              <p className="text-green-50">Congratulations on landing the offer at {job.company}!</p>
            </div>
          </div>
          <Button variant="secondary" className="whitespace-nowrap font-bold" asChild>
            <Link href="/dashboard">Set Next Career Goal</Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tracker
            </Link>
          </Button>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shrink-0">
              {job.company?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight font-headline leading-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-muted-foreground font-medium">{job.company}</span>
                {job.location && (
                  <Badge variant="outline" className="text-xs">
                    {job.location}
                  </Badge>
                )}
                {job.employmentType && (
                  <Badge variant="outline" className="text-xs">
                    {job.employmentType}
                  </Badge>
                )}
              </div>
              {/* Source / apply links */}
              <div className="flex items-center gap-3 mt-2">
                {job.sourceUrl && (
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    Source posting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {job.applyUrl && job.applyUrl !== job.sourceUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    Apply now
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {!analysis && !isAnalyzing && (
            <Button
              onClick={handleAnalyze}
              className="bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 transition-opacity"
              disabled={hasMissingRequirements}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze My Fit
            </Button>
          )}
          {isAnalyzing && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </Button>
          )}
          {analysis && (
            <Button
              onClick={handleAnalyze}
              variant="outline"
              className="border-primary/20 hover:bg-primary/5"
              disabled={isAnalyzing}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Re-run Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Auto-analyze banner */}
      {shouldAutoAnalyze && isAnalyzing && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div>
            <p className="font-medium text-sm">Running your match analysis...</p>
            <p className="text-xs text-muted-foreground">
              AI is comparing your profile and resume to this job. This takes ~10 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Missing requirements banner */}
      {hasMissingRequirements && !isAnalyzing && !analysis && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-amber-800">Set up your profile to get a match score</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {!profile && !getPrimaryResume()
                ? 'Both your profile and a resume are needed for analysis.'
                : !profile
                ? 'Complete your profile to enable AI analysis.'
                : 'Upload a resume to enable AI analysis.'}
            </p>
            <div className="flex gap-2 mt-2">
              {!profile && (
                <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300" asChild>
                  <Link href="/profile">Complete Profile</Link>
                </Button>
              )}
              {!getPrimaryResume() && (
                <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300" asChild>
                  <Link href="/resumes">Upload Resume</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty analysis state */}
      {!analysis && !isAnalyzing && (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No Analysis Yet</CardTitle>
            <CardDescription className="max-w-sm mx-auto mb-6">
              Run a match analysis to see your fit score, matched skills, skill gaps, and personalized recommendations.
            </CardDescription>
            <Button onClick={handleAnalyze} size="lg" disabled={hasMissingRequirements}>
              Analyze My Fit Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Analysis Results ── */}
      {analysis && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Score card */}
          <Card className="lg:col-span-2 overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
            <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Career Fit Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-muted/30"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 58}
                      strokeDashoffset={2 * Math.PI * 58 * (1 - analysis.score / 100)}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{analysis.score}%</span>
                  </div>
                </div>
                <Badge variant="secondary" className="px-4 py-1 text-sm font-medium">
                  {analysis.score >= 80
                    ? 'Excellent Match'
                    : analysis.score >= 60
                    ? 'Good Match'
                    : 'Potential Match'}
                </Badge>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-muted">
                <p className="text-muted-foreground leading-relaxed italic">
                  &ldquo;{analysis.recommendationSummary}&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions card */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Smart match recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {analysis.nextActions.map((action: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </CardContent>
            <div className="p-6 pt-0 flex flex-col gap-2">
              <Button
                variant={job.status === 'applied' ? 'secondary' : 'default'}
                onClick={() => handleUpdateStatus('applied')}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                {job.status === 'applied' ? 'Already Applied' : 'Mark as Applied'}
              </Button>
              {job.status !== 'offer' && (
                <Button
                  variant="outline"
                  className="border-green-200 hover:bg-green-50 text-green-700"
                  onClick={() => handleUpdateStatus('offer')}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  I Got an Offer!
                </Button>
              )}
              {job.applyUrl && (
                <Button variant="outline" className="group" asChild>
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                    Apply Now
                  </a>
                </Button>
              )}
              <Button variant="outline" className="group" asChild>
                <Link href={`/cover-letters?jobId=${jobId}`}>
                  <Wand2 className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                  Generate Cover Letter
                </Link>
              </Button>
            </div>
          </Card>

          {/* Skills grid */}
          <div className="lg:col-span-3 grid gap-6 md:grid-cols-2">
            <Card className="bg-green-50/30 dark:bg-green-950/10 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Matched Skills
                </CardTitle>
                <CardDescription>
                  Skills and experience aligning with this role.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {analysis.matchedSkills.map((skill: string) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  >
                    {skill}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Skill Gaps
                </CardTitle>
                <CardDescription>
                  Areas to improve before applying to this role.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((skill: string) => (
                  <Badge
                    key={skill}
                    variant="destructive"
                    className="bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Strengths & Potential</CardTitle>
                <CardDescription>Intelligent profile deep dive.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {analysis.strengths.map((str: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full shrink-0" />
                      {str}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* ── Safety Banner ── */}
      <Alert className="bg-blue-50/50 border-blue-200 text-blue-900 mt-6">
        <ShieldAlert className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-bold">CareerPilot Safety Tip</AlertTitle>
        <AlertDescription className="text-blue-700/90 text-sm">
          Legitimate employers will never ask for payment, bank details, or sensitive personal information during the interview process. Always verify the company independently.
        </AlertDescription>
      </Alert>

      {/* Follow-Up & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Follow-Up & Notes</CardTitle>
          <CardDescription>Track your follow-up dates and application notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Applied Date</label>
              <p className="text-sm text-muted-foreground">
                {job.appliedDate?.toDate ? format(job.appliedDate.toDate(), 'PPP') : job.status === 'applied' ? 'Not recorded' : 'Not yet applied'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Follow-Up Date</label>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={job.followUpDate || ''}
                onChange={(e) => handleUpdateFollowUpDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Notes</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Add any notes about this application, interview feedback, recruiter contacts..."
              value={job.followUpNotes || ''}
              onChange={(e) => setJob({ ...job, followUpNotes: e.target.value })}
              onBlur={(e) => handleUpdateNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Job Description */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>
            {job.sourceUrl ? (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                View original posting <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              'Details retrieved from the job posting.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap rounded-xl bg-muted/30 p-4 border overflow-auto max-h-[400px] leading-relaxed">
            {job.description || 'No description available.'}
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <p>
              Added on{' '}
              {job.createdAt?.toDate
                ? format(job.createdAt.toDate(), 'PPP')
                : 'Recently'}
            </p>
            {job.location && <p>Location: {job.location}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-64 items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }
    >
      <JobAnalysisContent />
    </Suspense>
  );
}
