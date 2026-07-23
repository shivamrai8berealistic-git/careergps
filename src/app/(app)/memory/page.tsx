'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { fetchMemoryTimeline } from '@/actions/memory-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Calendar, ArrowUpRight, Loader2, PlayCircle, FileText, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MemoryPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const data = await fetchMemoryTimeline(token);
        setEvents(data);
      } catch (error) {
        console.error("Failed to load memory timeline:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTimeline();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Accessing Career Memory...</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'onboarding_completed': return <Brain className="w-5 h-5 text-primary" />;
      case 'simulator_executed': return <PlayCircle className="w-5 h-5 text-amber-500" />;
      case 'resume_rewritten': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'ats_scan_run': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Calendar className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getEventTitle = (event: any) => {
    switch (event.type) {
      case 'onboarding_completed': return 'Career Twin Initialized';
      case 'simulator_executed': return 'Ran Career Simulation';
      case 'resume_rewritten': return 'Optimized Resume';
      case 'ats_scan_run': return 'Checked ATS Score';
      default: return event.type;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24">
      <header className="space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Career Memory</h1>
        <p className="text-lg text-muted-foreground">Your complete, immutable professional timeline.</p>
      </header>

      <div className="relative border-l-2 border-primary/20 ml-4 space-y-12 pb-12">
        {events.map((event, index) => (
          <div key={event.id} className="relative pl-8">
            {/* Timeline Dot */}
            <div className="absolute -left-[21px] top-1 h-10 w-10 rounded-full bg-background border-4 border-card flex items-center justify-center shadow-sm">
               {getEventIcon(event.type)}
            </div>
            
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{getEventTitle(event)}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Event specific metadata rendering */}
                {event.type === 'simulator_executed' && event.metadata?.query && (
                  <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                    <p className="text-sm font-medium italic">"{event.metadata.query}"</p>
                    {event.metadata.salaryDelta && (
                      <Badge variant="secondary" className="mt-3 text-green-600 bg-green-100">
                        Projected: {event.metadata.salaryDelta}
                      </Badge>
                    )}
                  </div>
                )}
                
                {event.type === 'onboarding_completed' && event.metadata?.initialScore && (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <p className="text-sm">Initial Career Score: <span className="font-bold text-lg">{event.metadata.initialScore}/100</span></p>
                  </div>
                )}

                {(event.type === 'ats_scan_run' || event.type === 'resume_rewritten') && event.metadata?.score && (
                  <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                    <p className="text-sm">Achieved Score: <span className="font-bold text-lg">{event.metadata.score}%</span></p>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        ))}

        {events.length === 0 && (
          <div className="pl-8 text-muted-foreground text-center py-12 border-2 border-dashed rounded-lg ml-8">
            <p>Your career timeline is empty.</p>
            <p className="text-sm">Complete actions to start building your memory.</p>
          </div>
        )}
      </div>
    </div>
  );
}
