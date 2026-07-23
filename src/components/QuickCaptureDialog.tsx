'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import { useUser } from '@/firebase';
import { scrapeJobFromUrl, extractJobFromText } from '@/actions/scrape-job';
import type { ExtractedJob } from '@/actions/scrape-job';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Link2,
  ClipboardList,
  PenLine,
  Loader2,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  Zap,
  AlertTriangle,
  ShieldX,
  Puzzle,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickCaptureDialogProps {
  trigger?: React.ReactNode;
  defaultTab?: 'url' | 'paste' | 'manual';
}

export function QuickCaptureDialog({
  trigger,
  defaultTab = 'url',
}: QuickCaptureDialogProps) {
  const router = useRouter();
  const { addJob } = useJobs();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // URL tab
  const [url, setUrl] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [urlStatusMsg, setUrlStatusMsg] = useState('');
  const [urlBlockedError, setUrlBlockedError] = useState('');

  // Paste tab
  const [pastedJd, setPastedJd] = useState('');
  const [companyHint, setCompanyHint] = useState('');
  const [isExtractingText, setIsExtractingText] = useState(false);

  // Manual tab
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualApplyUrl, setManualApplyUrl] = useState('');
  const [manualSourceUrl, setManualSourceUrl] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const saveAndRedirect = async (
    jobData: Partial<ExtractedJob> & { sourceUrl?: string },
    autoAnalyze = true
  ) => {
    const doc = await addJob({
      title: jobData.title || 'Untitled Role',
      company: jobData.company || 'Unknown Company',
      location: jobData.location || '',
      description: jobData.description || '',
      status: 'saved',
      ...(jobData.applyUrl && { applyUrl: jobData.applyUrl }),
      ...(jobData.sourceUrl && { sourceUrl: jobData.sourceUrl }),
    });
    setOpen(false);
    router.push(`/jobs/${doc.id}${autoAnalyze ? '?analyze=true' : ''}`);
  };

  // ── Tab 1: URL Import ──────────────────────────────────────────────────────
  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a job posting URL.');
      return;
    }
    setIsScrapingUrl(true);
    setUrlBlockedError('');
    setUrlStatusMsg('Fetching job details…');

    try {
      // Dynamic status hint for slow AI paths
      const slowTimer = setTimeout(() => {
        setUrlStatusMsg('Almost there — AI is reading the page…');
      }, 6000);

      if (!user) throw new Error("Please log in to import jobs.");
      const idToken = await user.getIdToken();
      const result = await scrapeJobFromUrl(idToken, url.trim());
      clearTimeout(slowTimer);
      setUrlStatusMsg('');

      if (result.status === 'blocked') {
        setUrlBlockedError(result.error || 'This site is blocking automated import.');
        setActiveTab('paste');
        toast.error('Site blocked — switched to Paste JD', { id: 'url-import' });
        return;
      }

      if (result.status === 'unsupported') {
        setUrlBlockedError(result.error || 'This URL is not supported for import.');
        toast.error(result.error || 'Unsupported URL', { id: 'url-import' });
        return;
      }

      const extracted = result.job!;

      if (result.status === 'partial') {
        toast.warning(
          `Partial data: "${extracted.title}" at "${extracted.company}". Please review before saving.`,
          { id: 'url-import', duration: 6000 }
        );
        setManualTitle(extracted.title === 'Untitled Role' ? '' : extracted.title);
        setManualCompany(extracted.company === 'Unknown Company' ? '' : extracted.company);
        setManualLocation(extracted.location || '');
        setManualDescription(extracted.description || '');
        setManualApplyUrl(extracted.applyUrl || '');
        setManualSourceUrl(extracted.sourceUrl || '');
        setActiveTab('manual');
        return;
      }

      toast.success(`Found: ${extracted.title} at ${extracted.company}`, { id: 'url-import' });
      await saveAndRedirect(extracted, true);
    } catch (err: any) {
      setUrlStatusMsg('');
      toast.error(err.message || 'Failed to import from URL.', { id: 'url-import' });
    } finally {
      setIsScrapingUrl(false);
      setUrlStatusMsg('');
    }
  };

  // ── Tab 2: Paste JD ────────────────────────────────────────────────────────
  const handlePasteExtract = async () => {
    if (!pastedJd.trim() || pastedJd.length < 50) {
      toast.error('Please paste a bit more text (at least 50 characters).');
      return;
    }
    setIsExtractingText(true);
    try {
      if (!user) throw new Error("Please log in to import jobs.");
      const idToken = await user.getIdToken();
      const extracted = await extractJobFromText(idToken, pastedJd, companyHint);
      toast.success(`Extracted: ${extracted.title} at ${extracted.company}`, { id: 'paste-import' });
      await saveAndRedirect(extracted, true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract job details.', { id: 'paste-extract' });
    } finally {
      setIsExtractingText(false);
    }
  };

  // ── Tab 3: Manual ──────────────────────────────────────────────────────────
  const handleManualSave = async () => {
    if (!manualTitle.trim() || !manualCompany.trim()) {
      toast.error('Please fill in at least the job title and company.');
      return;
    }
    setIsSavingManual(true);
    try {
      await saveAndRedirect(
        { 
          title: manualTitle, 
          company: manualCompany, 
          location: manualLocation, 
          description: manualDescription,
          applyUrl: manualApplyUrl,
          sourceUrl: manualSourceUrl
        },
        !!manualDescription.trim()
      );
      toast.success('Job saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save job.');
    } finally {
      setIsSavingManual(false);
    }
  };

  const isAnyLoading = isScrapingUrl || isExtractingText || isSavingManual;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setUrlBlockedError(''); setUrlStatusMsg(''); } }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Navigation className="h-4 w-4 mr-2" />
            Set Destination
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-violet-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Set New Destination</DialogTitle>
            <DialogDescription className="text-white/80 mt-1">
              Import a job to calculate the optimal route for your career.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setUrlBlockedError(''); }} className="w-full">
          <TabsList className="w-full rounded-none border-b h-auto p-0 bg-muted/50">
            <TabsTrigger value="url" className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none">
              <Link2 className="h-4 w-4 mr-2" /> Paste URL
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none">
              <ClipboardList className="h-4 w-4 mr-2" /> Paste JD
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none">
              <PenLine className="h-4 w-4 mr-2" /> Manual
            </TabsTrigger>
          </TabsList>

          {/* ── URL Tab ── */}
          <TabsContent value="url" className="p-6 space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="job-url" className="text-sm font-medium">Job Posting URL</Label>
              <Input
                id="job-url"
                type="url"
                placeholder="https://linkedin.com/jobs/view/... or naukri.com/..."
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlBlockedError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && !isAnyLoading && handleUrlImport()}
                disabled={isAnyLoading}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Works with LinkedIn and FoundIt instantly. Naukri may take ~20s. Glassdoor/Indeed → use Paste JD.
              </p>
            </div>

            {/* Slow-load status */}
            {isScrapingUrl && urlStatusMsg && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary" />
                {urlStatusMsg}
              </div>
            )}

            {/* Blocked state banner */}
            {urlBlockedError && !isScrapingUrl && (
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
                <ShieldX className="h-4 w-4" />
                <AlertDescription className="text-xs whitespace-pre-line leading-relaxed">
                  {urlBlockedError}
                </AlertDescription>
              </Alert>
            )}

            {/* Extension tip */}
            <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 flex items-start gap-3">
              <Puzzle className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-violet-700">Browser Extension = Fastest</p>
                <p className="text-xs text-violet-600/80 mt-0.5">
                  Open any job page in your browser, click the CareerPilot extension, and it saves instantly — no copy-paste needed.
                </p>
              </div>
            </div>

            <Button
              className="w-full h-11 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
              onClick={handleUrlImport}
              disabled={isAnyLoading || !url.trim()}
            >
              {isScrapingUrl ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing & Analyzing…</>
              ) : (
                <><Zap className="mr-2 h-4 w-4" /> Import & Analyze</>
              )}
            </Button>
          </TabsContent>

          {/* ── Paste JD Tab ── */}
          <TabsContent value="paste" className="p-6 space-y-4 mt-0">
            {/* Show context if switched from blocked URL */}
            {urlBlockedError && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-700">
                  The site blocked the URL import. Paste the job description here instead.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="company-hint" className="text-sm font-medium">
                Company Name <span className="text-muted-foreground font-normal">(optional hint)</span>
              </Label>
              <Input
                id="company-hint"
                placeholder="e.g. Google, Infosys, Swiggy…"
                value={companyHint}
                onChange={(e) => setCompanyHint(e.target.value)}
                disabled={isAnyLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pasted-jd" className="text-sm font-medium">Job Description</Label>
              <Textarea
                id="pasted-jd"
                placeholder="Paste the full job description here. The more text, the better the AI match…"
                value={pastedJd}
                onChange={(e) => setPastedJd(e.target.value)}
                disabled={isAnyLoading}
                className="min-h-[180px] resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                AI extracts role, requirements, and skills — then runs your match score.
              </p>
            </div>

            <Button
              className="w-full h-11 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
              onClick={handlePasteExtract}
              disabled={isAnyLoading || pastedJd.trim().length < 50}
            >
              {isExtractingText ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting & Analyzing…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Extract & Analyze</>
              )}
            </Button>
          </TabsContent>

          {/* ── Manual Tab ── */}
          <TabsContent value="manual" className="p-6 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="m-title">Job Title *</Label>
                <Input id="m-title" placeholder="e.g. Senior Frontend Engineer" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} disabled={isAnyLoading} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-company">Company *</Label>
                <Input id="m-company" placeholder="e.g. Google" value={manualCompany} onChange={(e) => setManualCompany(e.target.value)} disabled={isAnyLoading} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-location">Location</Label>
                <Input id="m-location" placeholder="e.g. Bangalore / Remote" value={manualLocation} onChange={(e) => setManualLocation(e.target.value)} disabled={isAnyLoading} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="m-desc">
                  Job Description <span className="text-muted-foreground font-normal">(recommended for AI analysis)</span>
                </Label>
                <Textarea
                  id="m-desc"
                  placeholder="Paste the job description for a better AI match score…"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  disabled={isAnyLoading}
                  className="min-h-[120px] resize-none text-sm"
                />
              </div>
            </div>

            {manualDescription.trim().length > 50 && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg p-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                AI analysis will run automatically after saving.
              </div>
            )}

            <Button
              className="w-full h-11"
              onClick={handleManualSave}
              disabled={isAnyLoading || !manualTitle.trim() || !manualCompany.trim()}
            >
              {isSavingManual ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <><PlusCircle className="mr-2 h-4 w-4" /> Save Job</>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
