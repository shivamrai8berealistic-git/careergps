'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getRouteData, generateChaptersForModule } from '@/actions/route-actions';
import { Route, RouteCheckpoint, RouteModule, RouteChapter } from '@/types/route';
import { Loader2, Navigation2, CheckCircle2, Circle, Lock, AlertTriangle, Play, CheckCircle, ChevronRight, GitBranchPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// =============================================================================
// Helper: group checkpoints into sequential "lanes" — parallelizable checkpoints
// are grouped together.
// =============================================================================
function groupCheckpointsIntoLanes(checkpoints: RouteCheckpoint[]): RouteCheckpoint[][] {
  if (checkpoints.length === 0) return [];
  
  const lanes: RouteCheckpoint[][] = [];
  let currentGroup: RouteCheckpoint[] = [];
  
  // Simple heuristic: checkpoints with no dependencies OR with the same set of
  // dependencies as their siblings can run in parallel.
  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i];
    
    if (currentGroup.length === 0) {
      currentGroup.push(cp);
    } else {
      // Check if this checkpoint can run in parallel with the current group
      const prevCp = currentGroup[0];
      const sameDeps = JSON.stringify(cp.dependencies.sort()) === JSON.stringify(prevCp.dependencies.sort());
      const neitherDependsOnOther = !cp.dependencies.includes(prevCp.id) && !prevCp.dependencies.includes(cp.id);
      
      if (sameDeps && neitherDependsOnOther) {
        currentGroup.push(cp);
      } else {
        lanes.push(currentGroup);
        currentGroup = [cp];
      }
    }
  }
  
  if (currentGroup.length > 0) lanes.push(currentGroup);
  
  return lanes;
}

export default function RouteExecutionPage() {
  const { user, isUserLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  
  const [route, setRoute] = useState<Route | null>(null);
  const [checkpoints, setCheckpoints] = useState<RouteCheckpoint[]>([]);
  const [modules, setModules] = useState<RouteModule[]>([]);
  const [chapters, setChapters] = useState<RouteChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const routeId = params.routeId as string;
        const res = await getRouteData(token, routeId);
        if (res.success) {
          setRoute(res.route);
          setCheckpoints(res.checkpoints);
          setModules(res.modules);
          setChapters(res.chapters);
        }
      } catch (e: any) {
         toast.error(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, params.routeId]);

  const checkpointLanes = useMemo(() => groupCheckpointsIntoLanes(checkpoints), [checkpoints]);

  if (isUserLoading || isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!route) {
    return <div className="text-center mt-20 text-muted-foreground">Route not found.</div>;
  }

  const completionPercentage = route.totalCheckpoints > 0 ? Math.round((route.completedCheckpoints / route.totalCheckpoints) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
        <div>
          <Badge variant="outline" className="mb-3 bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-xs font-bold">
            <Navigation2 className="w-3 h-3 mr-1 inline-block" /> Active Route
          </Badge>
          <h2 className="text-3xl font-bold font-headline tracking-tight">
            {route.targetPosition.title}
          </h2>
          <div className="flex items-center gap-3 mt-2 text-muted-foreground flex-wrap">
             <span className="text-sm">Style: <strong className="uppercase">{route.routeStyle.replace('_', ' ')}</strong></span>
             <span className="text-muted-foreground/30">•</span>
             <span className="text-sm">ETA: <strong>{route.estimatedWeeks} weeks</strong></span>
             <span className="text-muted-foreground/30">•</span>
             <span className="text-sm">Confidence: <strong>{route.routeConfidence}%</strong></span>
          </div>
        </div>
        
        <div className="flex flex-col items-end min-w-[200px] w-full md:w-auto">
          <div className="flex justify-between w-full text-sm font-bold uppercase tracking-wider mb-2">
            <span>Overall Progress</span>
            <span className={completionPercentage === 100 ? 'text-green-500' : ''}>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3 w-full" />
        </div>
      </header>

      {/* ================================================================= */}
      {/* ROUTE TIMELINE                                                   */}
      {/* ================================================================= */}
      <div className="space-y-10 mt-8">
        {checkpointLanes.map((lane, laneIdx) => {
          const isParallelLane = lane.length > 1;
          
          return (
            <div key={`lane-${laneIdx}`} className="relative">
              {/* Timeline connector to next lane */}
              {laneIdx !== checkpointLanes.length - 1 && (
                <div className="absolute left-6 top-16 bottom-[-2.5rem] w-0.5 bg-border -z-10" />
              )}
              
              {/* Parallel indicator */}
              {isParallelLane && (
                <div className="flex items-center gap-2 mb-4 ml-14 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <GitBranchPlus className="w-4 h-4 text-primary" />
                  <span>Can be done in parallel ({lane.length} checkpoints)</span>
                </div>
              )}
              
              <div className={isParallelLane ? 'grid grid-cols-1 md:grid-cols-2 gap-4 ml-14' : ''}>
                {lane.map((cp) => {
                  const cpModules = modules.filter(m => m.checkpointId === cp.id);
                  const isCpLocked = cp.status === 'locked';
                  const globalCpIdx = checkpoints.findIndex(c => c.id === cp.id);
                  
                  // Find which checkpoints are blocking this one
                  const blockingCheckpoints = cp.dependencies
                    .map(depId => checkpoints.find(c => c.id === depId))
                    .filter(Boolean) as RouteCheckpoint[];
                  
                  if (isParallelLane) {
                    // Compact card for parallel layout
                    return (
                      <Card key={cp.id} className={`border transition-all ${isCpLocked ? 'opacity-60 bg-muted/30 border-dashed' : cp.status === 'completed' ? 'border-green-500/20 bg-green-50/10' : 'shadow-md border-primary/20'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                cp.status === 'completed' ? 'bg-green-500 text-white border-green-500' : 
                                isCpLocked ? 'bg-muted text-muted-foreground border-muted' : 
                                'bg-primary text-primary-foreground border-primary'
                              }`}>
                                {cp.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                                 isCpLocked ? <Lock className="w-4 h-4" /> : 
                                 <span className="font-bold text-sm">{globalCpIdx + 1}</span>}
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold">{cp.title}</CardTitle>
                                <CardDescription className="text-xs mt-0.5">{cp.estimatedWeeks}w • {cp.totalModules} modules</CardDescription>
                              </div>
                            </div>
                            <Badge variant={cp.status === 'completed' ? 'default' : isCpLocked ? 'outline' : 'secondary'} className={`text-[10px] ${cp.status === 'completed' ? 'bg-green-500' : ''}`}>
                              {cp.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {/* Locked explanation */}
                          {isCpLocked && blockingCheckpoints.length > 0 && (
                            <div className="mt-3 p-2 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800">
                              🔒 Requires: {blockingCheckpoints.map(b => <strong key={b.id}>{b.title}</strong>).reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, ' + ', curr] as any, [] as any)}
                            </div>
                          )}
                        </CardHeader>
                        
                        {!isCpLocked && cpModules.length > 0 && (
                          <CardContent className="pt-0 space-y-4">
                            {cpModules.map((mod, modIdx) => (
                                <ModuleCard 
                                  key={mod.id} 
                                  mod={mod} 
                                  modIdx={modIdx} 
                                  modChapters={chapters.filter(c => c.moduleId === mod.id)} 
                                  route={route} 
                                  router={router} 
                                />
                            ))}
                          </CardContent>
                        )}
                      </Card>
                    );
                  }
                  
                  // Standard single-lane checkpoint
                  return (
                    <div key={cp.id} className="flex flex-col md:flex-row gap-4 md:gap-6 relative">
                      {/* Node */}
                      <div className="flex flex-col items-center md:mt-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background z-10 ${
                          cp.status === 'completed' ? 'bg-green-500 text-white' : 
                          isCpLocked ? 'bg-muted text-muted-foreground' : 
                          'bg-primary text-primary-foreground'
                        }`}>
                          {cp.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                           isCpLocked ? <Lock className="w-5 h-5" /> : 
                           <span className="font-bold">{globalCpIdx + 1}</span>}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-4 w-full">
                        <Card className={`border transition-all w-full overflow-hidden ${isCpLocked ? 'opacity-60 bg-muted/30 border-dashed' : cp.status === 'completed' ? 'border-green-500/20' : 'shadow-md border-primary/20'}`}>
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl font-bold">{cp.title}</CardTitle>
                                <CardDescription className="uppercase tracking-wider text-xs font-bold mt-1">
                                  Checkpoint • {cp.estimatedWeeks} Weeks • Readiness: {cp.readinessScore}%
                                </CardDescription>
                              </div>
                              <Badge variant={cp.status === 'completed' ? 'default' : isCpLocked ? 'outline' : 'secondary'} className={cp.status === 'completed' ? 'bg-green-500' : ''}>
                                {cp.status.toUpperCase()}
                              </Badge>
                            </div>
                            
                            {/* Locked explanation */}
                            {isCpLocked && blockingCheckpoints.length > 0 && (
                              <div className="mt-3 p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800">
                                🔒 This checkpoint requires completing {blockingCheckpoints.map((b, i) => (
                                  <span key={b.id}><strong>{b.title}</strong>{i < blockingCheckpoints.length - 1 ? ' and ' : ''}</span>
                                ))} first.
                                {blockingCheckpoints.some(b => b.status === 'active') && (
                                  <span className="block mt-1 text-xs">
                                    ({blockingCheckpoints.filter(b => b.status === 'active').map(b => `${b.title}: ${Math.round((b.completedModules / b.totalModules) * 100)}% complete`).join(', ')})
                                  </span>
                                )}
                              </div>
                            )}
                          </CardHeader>
                          
                          {!isCpLocked && cpModules.length > 0 && (
                            <CardContent className="pt-0 space-y-4">
                              {cpModules.map((mod, modIdx) => (
                                <ModuleCard 
                                  key={mod.id} 
                                  mod={mod} 
                                  modIdx={modIdx} 
                                  modChapters={chapters.filter(c => c.moduleId === mod.id)} 
                                  route={route} 
                                  router={router} 
                                />
                              ))}
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Module + Chapter rendering (shared between parallel and single-lane layouts)
// =============================================================================

function ModuleCard({ mod, modIdx, modChapters, route, router }: { mod: RouteModule, modIdx: number, modChapters: RouteChapter[], route: Route, router: any }) {
  const { user } = useUser();
  const [isInitializing, setIsInitializing] = useState(false);
  
  const handleInitialize = async () => {
    if (!user) return;
    setIsInitializing(true);
    try {
      const token = await user.getIdToken();
      await generateChaptersForModule(token, mod.id);
      toast.success("Module ready. Let's begin.");
      // Hard reload to fetch new chapters and update states
      window.location.reload(); 
    } catch (e: any) {
      toast.error("We encountered an issue preparing your path. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const isUninitialized = mod.totalChapters === 0 && modChapters.length === 0;

  return (
    <div className="p-4 rounded-xl border bg-card/50">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-sm">Module {modIdx + 1}: {mod.title}</h4>
        {!isUninitialized && <span className="text-xs text-muted-foreground font-bold">{Math.round(mod.progress)}%</span>}
      </div>
      
      {isUninitialized ? (
        <div className="flex flex-col items-center justify-center p-10 border border-dashed border-primary/20 rounded-xl bg-primary/5 text-center transition-all duration-500 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
             <Navigation2 className="w-6 h-6 text-primary" />
          </div>
          <h4 className="text-lg font-bold mb-2">Ready for the next step?</h4>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">We'll craft a personalized path for this module based on your current profile.</p>
          <Button 
            onClick={handleInitialize} 
            disabled={isInitializing} 
            size="lg"
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
          >
            {isInitializing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing your path...</>
            ) : (
              "Start this Module"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {modChapters.map((ch) => (
            <div key={ch.id} className={\`flex items-center justify-between p-3 rounded-lg border transition-colors \${
              ch.status === 'done' ? 'bg-green-50/50 border-green-200 dark:bg-green-950/10 dark:border-green-800' :
              ch.status === 'in_progress' ? 'bg-primary/5 border-primary/20' :
              'bg-background hover:bg-muted/50'
            }\`}>
              <div className="flex items-center gap-3 min-w-0">
                {ch.status === 'done' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : ch.status === 'in_progress' ? (
                  <Play className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={\`text-sm font-medium truncate \${ch.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}\`}>
                    {ch.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                     <Badge variant="outline" className="text-[10px] h-4 py-0 px-1">{ch.skillTag}</Badge>
                     <span className="text-[10px] text-muted-foreground">{ch.preparation.estimatedMins}m</span>
                     
                     {ch.status === 'done' && ch.freshnessStatus !== 'fresh' && (
                       <Badge variant="secondary" className={\`text-[10px] h-4 py-0 px-1 \${
                         ch.freshnessStatus === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 
                         ch.freshnessStatus === 'stale' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                         'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                       }\`}>
                         <AlertTriangle className="w-3 h-3 mr-0.5 inline-block" />
                         {ch.freshnessStatus === 'expired' ? 'Re-validate' :
                          ch.freshnessStatus === 'stale' ? 'Refresh' : 'Aging'}
                       </Badge>
                     )}
                     
                     {ch.validation?.bypassed && (
                       <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1 bg-amber-100 text-amber-700">
                         Bypassed
                       </Badge>
                     )}
                  </div>
                </div>
              </div>
              
              <Button 
                variant={ch.status === 'done' && ch.freshnessStatus !== 'fresh' ? 'destructive' : 'ghost'}
                size="sm"
                className="flex-shrink-0 ml-2"
                onClick={() => router.push(\`/routes/\${route.id}/chapter/\${ch.id}\`)}
              >
                {ch.status === 'done' && ch.freshnessStatus !== 'fresh' ? 'Refresh' : 'Open'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
