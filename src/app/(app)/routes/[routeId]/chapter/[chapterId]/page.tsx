'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { getChapterData, generateChapterValidation, submitChapterValidation, markChapterDone } from '@/actions/route-actions';
import { RouteChapter } from '@/types/route';
import { Loader2, ArrowLeft, BrainCircuit, Play, CheckCircle2, AlertTriangle, ExternalLink, PenTool, Circle, Save, CheckCircle, Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

// Bookish icon workaround (lucide)
const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);

export default function ChapterExecutionPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const router = useRouter();
  
  const [chapter, setChapter] = useState<RouteChapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationDraft, setValidationDraft] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Notes state with auto-save
  const [notes, setNotes] = useState('');
  const [notesSaveStatus, setNotesSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Bypass warning dialog
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  const [bypassReason, setBypassReason] = useState<'no_validation' | 'failed_validation'>('no_validation');

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await getChapterData(token, params.chapterId as string);
        if (res.success) {
          setChapter(res.chapter);
          setNotes(res.chapter.notes || '');
        }
      } catch (e: any) {
         toast.error(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, params.chapterId]);

  // =========================================================================
  // AUTO-SAVE NOTES (debounced 2-second delay, direct Firestore client write)
  // =========================================================================
  const saveNotes = useCallback(async (value: string) => {
    if (!user || !chapter) return;
    try {
      setNotesSaveStatus('saving');
      const chapterRef = doc(firestore, 'users', user.uid, 'route_chapters', chapter.id);
      await updateDoc(chapterRef, { notes: value });
      setNotesSaveStatus('saved');
      // Reset to idle after 2 seconds
      setTimeout(() => setNotesSaveStatus('idle'), 2000);
    } catch (e: any) {
      console.error('Failed to save notes:', e);
      setNotesSaveStatus('idle');
    }
  }, [user, chapter]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    setNotesSaveStatus('idle');
    
    // Debounce: clear previous timer, set new one
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveNotes(value), 2000);
  }, [saveNotes]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // =========================================================================
  // VALIDATION
  // =========================================================================
  const handleStartValidation = async () => {
    if (!user || !chapter) return;
    setIsValidating(true);
    try {
      const token = await user.getIdToken();
      const res = await generateChapterValidation(token, chapter.id);
      if (res.success) {
        setValidationDraft(res.validation);
      }
    } catch (e: any) {
      if (e.message?.includes('Insufficient credits')) {
        toast.error('Not enough credits to generate validation. Please upgrade to continue.');
        router.push('/pricing');
      } else {
        toast.error('Failed to start validation: ' + e.message);
      }
      setIsValidating(false);
    }
  };

  const handleSubmitValidation = async () => {
    if (!user || !chapter || !validationDraft) return;
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await submitChapterValidation(token, chapter.id, validationDraft.questions, answers);
      
      if (res.success) {
        toast.success(res.grade.passed ? "✅ Validation Passed!" : "Validation not passed. Review feedback below.");
        
        setChapter(prev => prev ? {
          ...prev,
          status: res.grade.passed ? 'done' : prev.status,
          validation: {
            ...prev.validation,
            passed: res.grade.passed,
            confidence: res.grade.confidenceScore,
            strengths: res.grade.strengths,
            gaps: res.grade.gaps,
            recommendation: res.grade.recommendation,
          },
          freshnessStatus: 'fresh'
        } : null);
        
        setValidationDraft(null);
        setIsValidating(false);
        setAnswers({});
      }
    } catch (e: any) {
       toast.error(e.message);
    } finally {
       setIsSubmitting(false);
    }
  };

  // =========================================================================
  // MARK DONE — with bypass warnings
  // =========================================================================
  const handleMarkDone = () => {
    if (!chapter) return;
    
    const hasValidation = chapter.validation?.completedAt;
    const validationPassed = chapter.validation?.passed;
    
    if (!hasValidation) {
      // No validation attempted
      setBypassReason('no_validation');
      setShowBypassDialog(true);
    } else if (!validationPassed) {
      // Validation attempted but failed
      setBypassReason('failed_validation');
      setShowBypassDialog(true);
    } else {
      // Validation passed — simple confirmation
      handleConfirmDone(false);
    }
  };

  const handleConfirmDone = async (bypassed: boolean) => {
    if (!user || !chapter) return;
    try {
      const token = await user.getIdToken();
      await markChapterDone(token, chapter.id, bypassed);
      toast.success(bypassed ? "Chapter marked done (validation bypassed)." : "Chapter completed!");
      setChapter(prev => prev ? { ...prev, status: 'done', validation: { ...prev.validation, bypassed } } : null);
      setShowBypassDialog(false);
    } catch(e: any) {
      toast.error(e.message);
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  if (isUserLoading || isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!chapter) {
    return <div className="text-center mt-20 text-muted-foreground">Chapter not found.</div>;
  }

  const confidenceText = chapter.validation?.confidence != null ? `${chapter.validation.confidence}%` : '—';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24">
      
      {/* Back Nav */}
      <Button variant="ghost" className="text-muted-foreground -ml-4" onClick={() => router.push(`/routes/${params.routeId}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Route
      </Button>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary uppercase font-bold tracking-widest text-[10px]">
              Chapter • {chapter.skillTag}
            </Badge>
            <h1 className="text-3xl font-bold font-headline">{chapter.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {chapter.status === 'done' && (
              <Badge className="bg-green-500 text-white text-sm py-1 px-3">
                <CheckCircle2 className="w-4 h-4 mr-1 inline-block" /> Completed
              </Badge>
            )}
            {chapter.validation?.bypassed && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">
                <AlertTriangle className="w-3 h-3 mr-1 inline-block" /> Bypassed
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* PREPARATION SECTION                                              */}
      {/* ================================================================= */}
      <Card className="border-primary/20 shadow-md bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
             <BookOpen className="w-5 h-5 text-primary" /> Preparation
          </CardTitle>
          <CardDescription>
            Estimated time: {chapter.preparation.estimatedMins} minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="p-4 bg-muted/50 rounded-xl border">
             <p className="text-sm leading-relaxed whitespace-pre-wrap">{chapter.preparation.summary}</p>
           </div>
           
           {chapter.preparation.relevantSections && (
             <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg text-sm text-blue-800 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800">
               📌 Focus on: <strong>{chapter.preparation.relevantSections}</strong>
             </div>
           )}
           
           {chapter.preparation.url && (
             <div>
               <h4 className="font-bold text-sm mb-2">Recommended Material:</h4>
               <Button variant="outline" asChild>
                 <a href={chapter.preparation.url} target="_blank" rel="noopener noreferrer">
                   Open Resource <ExternalLink className="w-4 h-4 ml-2" />
                 </a>
               </Button>
             </div>
           )}
           
           {/* NOTES — Auto-Save */}
           <div>
             <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
               <PenTool className="w-4 h-4" /> Personal Notes
               {notesSaveStatus === 'saving' && (
                 <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>
               )}
               {notesSaveStatus === 'saved' && (
                 <span className="text-xs text-green-600 flex items-center gap-1"><Save className="w-3 h-3" /> Saved</span>
               )}
             </h4>
             <Textarea 
                placeholder="Take notes here... They auto-save as you type." 
                value={notes}
                onChange={handleNotesChange}
                className="min-h-[100px] bg-background"
             />
           </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* VALIDATION SECTION                                               */}
      {/* ================================================================= */}
      <Card className={`border transition-all ${chapter.status === 'done' && chapter.freshnessStatus === 'fresh' && !chapter.validation?.bypassed ? 'border-green-500/30 bg-green-50/10' : 'border-amber-500/30'}`}>
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-xl">
             <div className="flex items-center gap-2">
               <BrainCircuit className="w-5 h-5 text-amber-500" /> AI Validation
               <Badge variant="outline" className="text-[10px] ml-2">Free • Unlimited</Badge>
             </div>
             {chapter.validation?.confidence != null && (
                <Badge variant="outline" className={chapter.validation.passed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                  Confidence: {confidenceText}
                </Badge>
             )}
          </CardTitle>
          <CardDescription>
            Prove your readiness. Your validation is personalized to your profile and target role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {/* Prior Feedback */}
          {chapter.validation?.recommendation && !validationDraft && (
            <div className="mb-6 space-y-4">
               <div className={`p-4 rounded-xl border ${chapter.validation.passed ? 'bg-green-50/50 border-green-200 text-green-900 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50/50 border-red-200 text-red-900 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800'}`}>
                  <p className="text-sm font-medium">{chapter.validation.recommendation}</p>
               </div>
               
               {chapter.validation.strengths && chapter.validation.strengths.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Strengths Demonstrated</h5>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {chapter.validation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
               )}
               {chapter.validation.gaps && chapter.validation.gaps.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Gaps Identified</h5>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {chapter.validation.gaps.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
               )}
            </div>
          )}

          {/* Proof Handoff */}
          {chapter.status === 'done' && ['practical', 'project'].includes(chapter.validation?.method || '') && (
             <div className="mb-6 p-5 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 flex flex-col md:flex-row gap-4 items-center justify-between animate-in fade-in zoom-in duration-500">
                <div>
                   <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                     <Briefcase className="w-5 h-5" /> Add to Career Proof
                   </h4>
                   <p className="text-sm text-blue-800/90 dark:text-blue-400 mt-1">
                     You successfully completed a practical validation. Add this artifact to your Proof Portfolio so hiring managers can see your skills in action.
                   </p>
                </div>
                <Button asChild className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                   <Link href="/proof-builder">Go to Proof Builder</Link>
                </Button>
             </div>
          )}
          
          {/* Action Buttons (Not validating) */}
          {!validationDraft && !isValidating && (
             <div className="flex gap-4 flex-wrap">
               <Button 
                 onClick={handleStartValidation} 
                 className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
               >
                 <Play className="w-4 h-4 mr-2" /> 
                 {chapter.status === 'done' ? 'Re-Validate (Refresh)' : 'Start Validation'}
               </Button>
               
               {chapter.status !== 'done' && (
                 <Button variant="outline" onClick={handleMarkDone} className="text-muted-foreground">
                   Mark as Done
                 </Button>
               )}
             </div>
          )}

          {/* Next Steps after completion */}
          {chapter.status === 'done' && !isValidating && !validationDraft && (
            <div className="mt-8 flex justify-center animate-in fade-in zoom-in duration-500">
              <Button size="lg" className="w-full sm:w-auto shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-14 px-8" onClick={() => router.push(`/routes/${params.routeId}`)}>
                Continue Journey <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Generating Validation */}
          {isValidating && !validationDraft && (
             <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
                <p className="font-bold">Generating Personalized Validation...</p>
                <p className="text-sm text-muted-foreground">Using curated question bank + AI personalization for {chapter.skillTag}</p>
             </div>
          )}

          {/* Active Validation Session */}
          {validationDraft && (
             <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="p-4 bg-muted/50 rounded-xl border border-border italic text-sm">
                   {validationDraft.context}
                </div>
                
                {!validationDraft.isSeedBacked && (
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800">
                    ⚠️ This validation was fully AI-generated (no curated question bank for this chapter yet). Confidence may be slightly lower.
                  </div>
                )}
                
                {validationDraft.questions.map((q: any, idx: number) => (
                  <div key={q.id} className="space-y-3">
                     <h4 className="font-bold text-sm">
                       {idx + 1}. {q.questionText}
                     </h4>
                     
                     {q.questionType === 'multiple_choice' && q.options ? (
                       <div className="space-y-2">
                         {q.options.map((opt: string) => (
                           <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${answers[q.id] === opt ? 'border-primary bg-primary/5' : 'bg-background'}`}>
                              <input 
                                type="radio" 
                                name={q.id} 
                                value={opt} 
                                checked={answers[q.id] === opt}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-4 h-4 accent-primary"
                              />
                              <span className="text-sm">{opt}</span>
                           </label>
                         ))}
                       </div>
                     ) : (
                       <Textarea 
                         placeholder="Your answer..." 
                         value={answers[q.id] || ''}
                         onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                         className="min-h-[120px]"
                       />
                     )}
                  </div>
                ))}
                
                <div className="pt-4 flex gap-4">
                  <Button 
                    onClick={handleSubmitValidation} 
                    disabled={isSubmitting || Object.keys(answers).length !== validationDraft.questions.length}
                    className="flex-1 font-bold"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit for Evaluation
                  </Button>
                  <Button variant="outline" onClick={() => {setValidationDraft(null); setIsValidating(false); setAnswers({});}} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
             </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* BYPASS WARNING DIALOG                                            */}
      {/* ================================================================= */}
      <AlertDialog open={showBypassDialog} onOpenChange={setShowBypassDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {bypassReason === 'no_validation' ? 'No Validation Attempted' : 'Validation Not Passed'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {bypassReason === 'no_validation' ? (
                <p>You haven&apos;t validated this skill yet. Validation helps ensure you&apos;re truly ready for your target role. Marking this done without validation will lower your <strong>Route Confidence</strong>.</p>
              ) : (
                <p>Your last validation scored <strong>{chapter?.validation?.confidence ?? 0}%</strong> (below the 70% threshold). Marking this done anyway will lower your <strong>Route Confidence</strong> and flag this chapter as bypassed.</p>
              )}
              <p className="text-xs text-muted-foreground">
                Validation is free and unlimited. You can always come back to validate later.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmDone(true)} className="bg-transparent border border-muted-foreground/30 text-muted-foreground hover:bg-muted">
              Skip Validation for Now
            </AlertDialogAction>
            <Button onClick={() => { setShowBypassDialog(false); handleStartValidation(); }} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
              <Play className="w-4 h-4 mr-2" /> Take Validation
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
