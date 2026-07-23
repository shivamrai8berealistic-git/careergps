'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { fetchEmployerConfidence } from '@/actions/proof-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProofGapCard, ProjectCard } from '@/components/proof-gap-card';
import { Loader2, ShieldCheck, AlertTriangle, RefreshCw, Star, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ProofPage() {
  const { user } = useUser();
  const [proof, setProof] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetchEmployerConfidence(token);
        if (res.success) setProof(res.proof);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetchEmployerConfidence(token, true);
      if (res.success) { setProof(res.proof); toast.success('Employer Confidence recalculated.'); }
    } catch (e) { toast.error('Failed to recalculate.'); } finally { setIsRefreshing(false); }
  };

  const scoreColor = proof?.employerConfidenceScore >= 70 ? 'text-green-600' :
    proof?.employerConfidenceScore >= 45 ? 'text-amber-600' : 'text-red-600';

  if (isLoading) return (
    <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
      <ShieldCheck className="w-16 h-16 text-primary animate-pulse" />
      <p className="text-muted-foreground font-medium text-lg">Analyzing Employer Confidence...</p>
      <p className="text-sm text-muted-foreground/70">Scoring 10 proof signals across your Twin</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 rounded-2xl border border-primary/20">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-background rounded-full border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> Career Proof Engine
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Employer Confidence</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-base">
            Not just skill scores. How confident would an employer be hiring you today — based on all 10 proof signals?
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Recalculate
        </Button>
      </header>

      {proof && (
        <>
          {/* Score Hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <ShieldCheck className={`w-12 h-12 mb-3 ${scoreColor}`} />
                <p className={`text-6xl font-black font-headline ${scoreColor}`}>{proof.employerConfidenceScore}</p>
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2">Employer Confidence</p>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">vs. ATS Score which only checks keywords</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-amber-200/60 bg-amber-50/30">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Top Proof Gap
                  </h3>
                  <p className="font-bold text-lg mt-2 text-foreground">{proof.topProofGap}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{proof.topProofGapReason}</p>
                </div>
                {proof.specialNote && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      <Star className="w-4 h-4 text-primary inline mr-1" />
                      {proof.specialNote}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Proof Route */}
          {proof.proofRoute?.length > 0 && (
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Proof-Building Route (Line X)</h3>
                <div className="flex flex-col gap-2">
                  {proof.proofRoute.map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                      <p className="text-sm font-medium leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 10 Proof Signals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Proof Signals</h3>
                <div className="space-y-1">
                  {proof.signals?.map((signal: any) => (
                    <ProofGapCard key={signal.signal} signal={signal} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Recommendations */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1">Project Recommendations</h3>
              {proof.projectRecommendations?.map((project: any, i: number) => (
                <ProjectCard key={i} project={project} onStart={() => toast.info(`Starting: ${project.title}`)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
