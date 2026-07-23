'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/firebase';
import { fetchRadarOpportunities } from '@/actions/radar-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radar, Loader2, ArrowRight, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { OpportunityCard } from '@/components/opportunity-card';
import { toast } from 'sonner';

export default function RadarPage() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'in_progress' | 'complete' | 'error'>('idle');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const loadRadar = async (forceRefresh = false) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetchRadarOpportunities(token, forceRefresh);
      
      if (response.success) {
        if (response.status === 'in_progress') {
          setStatus('in_progress');
          // If we have fallback data (e.g., yesterday's scan), show it while polling
          if (response.fallbackData && !data) {
            setData(response.fallbackData);
          }
        } else if (response.status === 'complete') {
          setStatus('complete');
          setData(response.data);
          if (isRefreshing) {
            setIsRefreshing(false);
            toast.success("New opportunities found.");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load radar:", error);
      setStatus('error');
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRadar();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [user]);

  // Polling logic
  useEffect(() => {
    if (status === 'in_progress') {
      pollInterval.current = setInterval(() => {
        loadRadar(false);
      }, 5000); // Poll every 5 seconds
    } else {
      if (pollInterval.current) clearInterval(pollInterval.current);
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [status, user]);

  const handleRefresh = async () => {
    if (!user || status === 'in_progress') return;
    setIsRefreshing(true);
    // This will trigger forceRefresh, kick off the background job, and set status to 'in_progress'
    await loadRadar(true);
  };

  if (status === 'idle' || (status === 'in_progress' && !data)) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <Radar className="w-16 h-16 text-primary animate-pulse" />
          <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold font-headline">Finding opportunities for you...</h2>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">
            We are reviewing the market to find roles that match your career journey. This may take a minute.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-background rounded-full border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <Radar className="w-4 h-4" /> Opportunity Radar
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Market Discovery
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-lg">
            High-value roles matching your profile, prioritized by global intelligence.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={status === 'in_progress'}>
            <Filter className="w-4 h-4 mr-2" /> Adjust Filters
          </Button>
          <Button onClick={handleRefresh} disabled={status === 'in_progress'} className="min-w-[160px]">
            {status === 'in_progress' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reviewing Market...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Find New Roles</>
            )}
          </Button>
        </div>
      </header>

      {status === 'in_progress' && data && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-700 font-medium flex items-center justify-center gap-3 animate-pulse">
           <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
           We are finding new opportunities for you. You can continue reviewing these previous matches while you wait.
        </div>
      )}

      {data?.marketInsight && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-primary font-medium text-center">
          {data.marketInsight}
        </div>
      )}

      {/* Grid */}
      {data?.opportunities && data.opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.opportunities.map((opp: any) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 bg-transparent text-center py-16">
          <Radar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-foreground">No matches found</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
            We couldn't find any opportunities matching your current profile right now. Try expanding your target roles.
          </p>
          <Button onClick={handleRefresh} variant="outline" disabled={status === 'in_progress'}>
            {status === 'in_progress' ? 'Reviewing...' : 'Scan Again'}
          </Button>
        </Card>
      )}

    </div>
  );
}
