'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Link2, ClipboardList, PenLine, Zap, ArrowRight, ExternalLink, ShieldAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useJobs, useProfile, useResumes } from '@/hooks/useJobs';
import { useUser } from '@/firebase';
import { EmptyState } from '@/components/ui/empty-state';
import { scrapeJobFromUrl } from '@/actions/scrape-job';
import { QuickCaptureDialog } from '@/components/QuickCaptureDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  saved: 'bg-slate-100 text-slate-700 border-slate-200',
  applied: 'bg-blue-50 text-blue-700 border-blue-100',
  interview: 'bg-violet-50 text-violet-700 border-violet-100',
  offer: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
};

export default function JobTrackerPage() {
  const router = useRouter();
  const { user } = useUser();
  const { jobs, isLoading, addJob } = useJobs();

  const [heroUrl, setHeroUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredJobs = statusFilter === 'all' ? jobs : jobs?.filter(j => j.status === statusFilter);

  const handleHeroImport = async () => {
    if (!heroUrl.trim()) return;
    setIsImporting(true);
    try {
      if (!user) throw new Error("Please log in to import jobs.");
      const idToken = await user.getIdToken();
      toast.loading('Fetching job details…', { id: 'hero-import' });
      const result = await scrapeJobFromUrl(idToken, heroUrl.trim());

      if (result.status === 'blocked') {
        toast.error(
          '🛡️ Site blocked automated import. Use "Paste Job Description" below instead.',
          { id: 'hero-import', duration: 6000 }
        );
        return;
      }

      if (result.status === 'unsupported') {
        toast.error(result.error || 'This URL is not supported. Try a direct job listing URL.', { id: 'hero-import' });
        return;
      }

      const extracted = result.job!;

      if (result.status === 'partial') {
        toast.warning(`Partial data found. Please use the "Add Job" button above to review before saving.`, { id: 'hero-import', duration: 8000 });
        return;
      }

      toast.success(`Found: ${extracted.title} at ${extracted.company}`, { id: 'hero-import' });

      const doc = await addJob({
        title: extracted.title,
        company: extracted.company,
        location: extracted.location || '',
        description: extracted.description || '',
        status: 'saved',
        ...(extracted.applyUrl && { applyUrl: extracted.applyUrl }),
        sourceUrl: extracted.sourceUrl,
      });
      setHeroUrl('');
      router.push(`/jobs/${doc.id}?analyze=true`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed. Try pasting the JD instead.', { id: 'hero-import' });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading your application tracker...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Job Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Import a job instantly or track your applications.
        </p>
      </div>

      {/* ── Follow-ups Due Widget ── */}
      {filteredJobs && filteredJobs.filter(j => j.status === 'applied' && j.appliedDate && (Date.now() - (j.appliedDate?.toDate?.()?.getTime?.() || Date.now())) > 7 * 24 * 60 * 60 * 1000).length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-red-500" /> Follow-ups Due
            </CardTitle>
            <CardDescription className="text-red-600/80">
              You applied to these jobs over a week ago. Time to follow up!
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filteredJobs.filter(j => j.status === 'applied' && j.appliedDate && (Date.now() - (j.appliedDate?.toDate?.()?.getTime?.() || Date.now())) > 7 * 24 * 60 * 60 * 1000).map(job => (
              <div key={job.id} className="flex items-center justify-between bg-background p-3 rounded-md border border-red-100 shadow-sm">
                <div>
                  <p className="font-bold text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs" asChild>
                   <Link href={`/jobs/${job.id}`}>Follow Up</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Hero Capture Bar ── */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-background overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <CardContent className="pt-6 pb-6 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Import a job in one step</p>
            <Badge variant="secondary" className="text-xs font-normal">Fastest</Badge>
          </div>

          {/* URL input row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-11 text-sm bg-background/80 border-primary/20 focus:border-primary"
                placeholder="Paste a job URL — LinkedIn, Naukri, Indeed, Glassdoor..."
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isImporting && handleHeroImport()}
                disabled={isImporting}
              />
            </div>
            <Button
              className="h-11 px-5 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 shrink-0"
              onClick={handleHeroImport}
              disabled={isImporting || !heroUrl.trim()}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Import <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Alt paths */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground">Or:</span>
            <QuickCaptureDialog
              defaultTab="paste"
              trigger={
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground px-2">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Paste Job Description
                </Button>
              }
            />
            <QuickCaptureDialog
              defaultTab="manual"
              trigger={
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground px-2">
                  <PenLine className="h-3.5 w-3.5" />
                  Enter Manually
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Safety Banner ── */}
      <Alert className="bg-blue-50/50 border-blue-200 text-blue-900 mt-6">
        <ShieldAlert className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-bold">CareerPilot Safety Tip</AlertTitle>
        <AlertDescription className="text-blue-700/90 text-sm">
          Legitimate employers will never ask for payment, bank details, or sensitive personal information during the interview process. Always verify the company independently.
        </AlertDescription>
      </Alert>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-2">
        {['all', 'saved', 'applied', 'interview', 'offer', 'rejected'].map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            className="capitalize text-xs h-8"
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s}
            {s !== 'all' && jobs && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{jobs.filter(j => j.status === s).length}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* ── Job Table ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>
              {jobs?.length
                ? `${jobs.length} job${jobs.length === 1 ? '' : 's'} tracked`
                : 'No jobs tracked yet.'}
            </CardDescription>
          </div>
          <QuickCaptureDialog />
        </CardHeader>
        <CardContent>
          {filteredJobs && filteredJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => {
                  // Compute follow-up needed: applied > 7 days ago, still 'applied'
                  const needsFollowUp = job.status === 'applied' && job.appliedDate &&
                    (Date.now() - (job.appliedDate?.toDate?.()?.getTime?.() || Date.now())) > 7 * 24 * 60 * 60 * 1000;
                  return (
                  <TableRow key={job.id} className="hover:bg-muted/50 transition-colors group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {job.company?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span>{job.company}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.title}</p>
                        {job.location && (
                          <p className="text-xs text-muted-foreground">{job.location}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs ${STATUS_COLORS[job.status] || ''}`}
                        >
                          {job.status}
                        </Badge>
                        {needsFollowUp && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Follow Up</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {job.createdAt?.toDate
                        ? format(job.createdAt.toDate(), 'MMM d, yyyy')
                        : 'Recently'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {job.applyUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            asChild
                          >
                            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Link href={`/jobs/${job.id}`} passHref>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-primary transition-colors font-semibold text-xs"
                          >
                            View Analysis
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<Zap className="h-8 w-8" />}
              title="No jobs tracked yet"
              description="Paste a job URL above to get started in seconds."
              action={
                <QuickCaptureDialog
                  trigger={
                    <Button size="sm">
                      <PenLine className="mr-2 h-4 w-4" />
                      Add First Job
                    </Button>
                  }
                />
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
