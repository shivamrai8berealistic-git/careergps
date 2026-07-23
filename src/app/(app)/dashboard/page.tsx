'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useProfile, useJobs } from '@/hooks/useJobs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Zap, Brain, Crosshair, TrendingUp, AlertTriangle, RefreshCw, Database, Radar, ArrowRight, Navigation2, CheckCircle2, MapPin, ShieldCheck, Briefcase, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { CareerScoreRing } from '@/components/career-score-ring';
import { MissionCard } from '@/components/mission-card';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';
import { fetchDailyMission } from '@/actions/mission-actions';
import { runTwinSync } from '@/actions/intelligence-actions';
import { getCohortBenchmarks } from '@/ai/cin/intelligence-api';
import { toast } from 'sonner';
import { InsightsFeed } from '@/components/insights-feed';

export default function CommandCenterPage() {
  const { user, isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { jobs } = useJobs();
  const activeRouteId = jobs?.find(j => j.computedRoute)?.computedRoute?.id;
  
  const [mission, setMission] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('careerPilot_cachedMission');
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return null;
  });
  const [benchmark, setBenchmark] = useState<any>(null);
  const [isMissionLoading, setIsMissionLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastRegenerated, setLastRegenerated] = useState<number>(0);
  
  // Progressive disclosure states
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [isIntelligenceExpanded, setIsIntelligenceExpanded] = useState(false);

  useEffect(() => {
    if (profile?.createdAt) {
      try {
        const createdAtDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        const isNewUser = (new Date().getTime() - createdAtDate.getTime()) < 24 * 60 * 60 * 1000;
        if (isNewUser) {
          setIsIntelligenceExpanded(true);
        }
      } catch (e) {}
    }
  }, [profile?.createdAt]);

  useEffect(() => {
    async function init() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const [res, benchRes] = await Promise.all([
          fetchDailyMission(token),
          getCohortBenchmarks("Software Engineer_Mid") // Mock cohort for MVP
        ]);
        if (res.success) {
          setMission(res.mission);
          localStorage.setItem('careerPilot_cachedMission', JSON.stringify(res.mission));
        }
        if (benchRes) setBenchmark(benchRes);
      } catch (e) {
        console.error("Failed to fetch mission:", e);
      } finally {
        setIsMissionLoading(false);
      }
    }
    init();
  }, [user]);

  useEffect(() => {
    async function syncTwin() {
      if (!user || !profile) return;
      const needsSync = !profile.careerScore || 
        !profile.lastIntelligenceSync || 
        (new Date().getTime() - new Date(profile.lastIntelligenceSync.toDate?.() || profile.lastIntelligenceSync).getTime() > 7 * 24 * 60 * 60 * 1000);
      
      if (needsSync) {
        try {
          const token = await user.getIdToken();
          await runTwinSync(token);
        } catch (error) {
          console.error("Failed background twin sync:", error);
        }
      }
    }
    syncTwin();
  }, [user, profile]);

  const handleRegenerate = async () => {
    if (!user) return;
    
    const now = Date.now();
    if (now - lastRegenerated < 15 * 60 * 1000) {
      toast.error("You can only recalculate your route every 15 minutes.");
      return;
    }

    setIsRegenerating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetchDailyMission(token, true);
      if (res.success) {
        setMission(res.mission);
        localStorage.setItem('careerPilot_cachedMission', JSON.stringify(res.mission));
        setLastRegenerated(now);
        toast.success("Mission recalculated.");
      }
    } catch (e) {
      toast.error("Failed to recalculate mission.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTaskProgress = (progress: number, optimisticEtaUpdate?: string) => {
    setMission((prev: any) => ({ ...prev, progress }));
    if (optimisticEtaUpdate) {
       toast.success(`Route Updated: ETA ${optimisticEtaUpdate}`);
    }
  };

  if (isUserLoading || isProfileLoading || (isMissionLoading && !mission)) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-24 px-4 sm:px-0">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl bg-muted/60" />
      </div>
    );
  }

  // Derive next action logic
  const tasks = mission?.tasks || [];
  const primaryTask = tasks.find((t: any) => !t.isCompleted);
  const remainingTasks = tasks.filter((t: any) => t !== primaryTask && !t.isCompleted);
  const completedTasks = tasks.filter((t: any) => t.isCompleted);
  const allTasksCompleted = tasks.length > 0 && !primaryTask;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24">
      
      {/* Calm Header Context (Progressive Disclosure: High Level Only) */}
      <header className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {mission?.routeState?.routeStatus === 'blocked' ? 'Route blocked. Address the top blocker to continue.' : 
             mission?.routeState?.routeStatus === 'delayed' ? 'Route delayed. Let\'s get back on track.' : 
             'On track. Continue your journey.'}
          </p>
        </div>
        
        {/* Simple text summary instead of heavy 3-card grid */}
        {mission?.routeState && (
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
             <div className="flex flex-col items-end">
               <span className="text-muted-foreground text-xs uppercase tracking-wider">Est. Arrival</span>
               <span className={mission.routeState.routeStatus === 'delayed' ? 'text-amber-500' : 'text-green-500'}>
                 {mission.routeState.estimatedMonths ? `${mission.routeState.estimatedMonths} months` : '---'}
               </span>
             </div>
             <div className="flex flex-col items-end border-l pl-4 border-border/50">
               <span className="text-muted-foreground text-xs uppercase tracking-wider">Momentum</span>
               <span className="flex items-center gap-1 text-amber-500">
                 <Zap className="w-3 h-3" /> {profile?.momentumScore || 0}
               </span>
             </div>
             {activeRouteId && (
               <Button asChild size="sm" className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
                 <Link href={`/routes/${activeRouteId}`}>Continue Journey <ArrowRight className="w-4 h-4 ml-1" /></Link>
               </Button>
             )}
          </div>
        )}
      </header>

      {/* The Single Primary Focus (What should I do next?) */}
      {!mission?.routeState ? (
        <div className="mt-8 glass p-10 rounded-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
             <MapPin className="w-10 h-10 text-primary" />
          </div>
          <h4 className="text-2xl font-bold font-headline mb-3">Set Your Destination</h4>
          <p className="text-muted-foreground max-w-md mb-8">
            Your career GPS needs a target. Add a job destination to calculate your personalized path.
          </p>
          <Button size="lg" className="active:scale-95 transition-transform" asChild>
            <Link href="/jobs"><MapPin className="w-4 h-4 mr-2"/> Set Target Job</Link>
          </Button>
        </div>
      ) : allTasksCompleted ? (
        <Card className="glass p-10 rounded-2xl text-center flex flex-col items-center justify-center min-h-[250px] border-primary/10">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold font-headline mb-2">Mission Accomplished</h3>
          <p className="text-muted-foreground max-w-md mb-6">You have completed all high-priority tasks for today.</p>
          <Button onClick={handleRegenerate} variant="outline" className="border-primary/20 hover:bg-primary/5 hover:text-primary">
            Plan Next Mission
          </Button>
        </Card>
      ) : primaryTask ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" /> Your Next Action
            </span>
            <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={isMissionLoading || isRegenerating} className="h-6 text-xs px-2">
              <RefreshCw className={`w-3 h-3 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              Recalculate Route
            </Button>
          </h3>
          <div className="transform scale-100 origin-top">
            <MissionCard key={primaryTask.id} task={primaryTask} onCompleted={handleTaskProgress} />
          </div>
        </div>
      ) : null}

      {/* Progressively Disclosed Queue */}
      {(remainingTasks.length > 0 || completedTasks.length > 0) && !allTasksCompleted && (
        <div className="pt-4">
          <Button 
            variant="ghost" 
            className="w-full justify-between text-muted-foreground bg-muted/30 hover:bg-muted/50 rounded-xl h-14"
            onClick={() => setIsQueueExpanded(!isQueueExpanded)}
          >
            <span className="flex items-center gap-2">
              <Crosshair className="w-4 h-4" /> View Full Mission Queue ({remainingTasks.length} remaining)
            </span>
            {isQueueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {isQueueExpanded && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="mb-2 space-y-2 px-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Mission Progress</span>
                  <span className={mission.progress === 100 ? 'text-green-500' : ''}>{mission.progress || 0}%</span>
                </div>
                <Progress value={mission.progress || 0} className="h-2" />
              </div>
              
              {remainingTasks.map((task: any) => (
                <MissionCard key={task.id} task={task} onCompleted={handleTaskProgress} />
              ))}
              
              {completedTasks.length > 0 && (
                <div className="pt-4 mt-4 border-t border-border/50 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Completed Today</h4>
                  {completedTasks.map((task: any) => (
                    <MissionCard key={task.id} task={task} onCompleted={handleTaskProgress} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progressively Disclosed Intelligence & Teasers */}
      {mission?.routeState && (
        <div className="pt-10 border-t border-border/50">
          <Button 
            variant="ghost" 
            className="w-full justify-between text-foreground hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/20 h-16 px-4"
            onClick={() => setIsIntelligenceExpanded(!isIntelligenceExpanded)}
          >
            <span className="flex items-center gap-3 font-bold font-headline text-lg">
              <div className="p-2 bg-primary/10 rounded-md">
                 <Brain className="w-5 h-5 text-primary" />
              </div>
              Career Intelligence & Insights
            </span>
            {isIntelligenceExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </Button>

          {isIntelligenceExpanded && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 fade-in duration-500">
              
              {/* Twin Status & Score */}
              <Card className="border-primary/5 shadow-md overflow-hidden bg-card rounded-2xl">
                <CardContent className="p-0">
                   <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-transparent text-center border-b border-border/50">
                     <CareerScoreRing score={profile?.careerScore || 0} size={140} />
                   </div>
                   <div className="p-6 bg-card space-y-4">
                     <div>
                       <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
                         <Zap className="w-3 h-3 text-amber-500" /> Biggest Opportunity
                       </h4>
                       <p className="text-sm font-medium leading-relaxed">{mission.routeState?.accelerationOpportunity || mission.biggestOpportunity}</p>
                     </div>
                   </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {/* Cohort Benchmark */}
                {benchmark && (
                  <Card className="border-border shadow-sm overflow-hidden bg-card rounded-2xl">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-sm flex items-center gap-2 mb-4">
                        <Database className="w-4 h-4 text-primary" /> Cohort Benchmarks
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs pb-2 border-b border-border/50">
                          <span className="text-muted-foreground">Your Cohort</span>
                          <span className="font-bold">{benchmark.cohortName}</span>
                        </div>
                        <div className="flex justify-between text-xs pb-2 border-b border-border/50">
                          <span className="text-muted-foreground">Avg. ATS Score</span>
                          <span className="font-bold">{benchmark.avgAtsScore}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Avg. Interview Rate</span>
                          <span className="font-bold">{benchmark.avgInterviewRate}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Proof & Radar Quick Links */}
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/proof-builder" className="block group">
                    <Card className="h-full border-border/50 shadow-sm hover:border-primary/30 transition-colors rounded-xl bg-card">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-xs">Manage Proof</h4>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/radar" className="block group">
                    <Card className="h-full border-border/50 shadow-sm hover:border-primary/30 transition-colors rounded-xl bg-card">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 relative">
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[8px] px-1 py-0 h-4 bg-primary/10 text-primary">New</Badge>
                        <Radar className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-xs">Opportunity Radar</h4>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>

              {/* Insights Feed */}
              <div className="md:col-span-2">
                 <InsightsFeed />
              </div>
              
            </div>
          )}
        </div>
      )}
    </div>
  );
}
