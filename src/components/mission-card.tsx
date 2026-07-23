'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, ArrowRight, Zap, Database, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { markTaskCompleted, markTaskRejected } from '@/actions/mission-actions';
import { useUser } from '@/firebase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface MissionTask {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedTimeMins: number;
  expectedScoreIncrease: number;
  actionType: string;
  targetJobId?: string;
  isCompleted: boolean;
  cinConfidence?: number;
  cinRationale?: string;
  isBootstrapped?: boolean;
  routeId?: string;
  chapterId?: string;
}

export function MissionCard({ task, onCompleted }: { task: MissionTask, onCompleted: (progress: number) => void }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(task.isCompleted);
  const [rejected, setRejected] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handleAction = async () => {
    if (completed) return;
    
    // Instead of completing it immediately, we should ideally route them to the tool
    // For this MVP, if they click the button, we route them. If they click the circle, we mark complete.
    if (task.actionType === 'ats_scan' && task.targetJobId) {
      router.push(`/jobs/${task.targetJobId}/ats`);
    } else if (task.actionType === 'resume_rewrite' && task.targetJobId) {
      router.push(`/jobs/${task.targetJobId}/resume`);
    } else if (task.actionType === 'simulator') {
      router.push(`/simulator`);
    } else if ((task.actionType === 'route_chapter_prep' || task.actionType === 'route_validation_refresh' || task.actionType === 'learning') && task.routeId && task.chapterId) {
      router.push(`/routes/${task.routeId}/chapter/${task.chapterId}`);
    } else if (task.actionType === 'proof' || task.actionType === 'portfolio') {
      router.push(`/proof-builder`);
    } else if (task.actionType === 'profile_update') {
      router.push(`/profile`);
    } else {
      // Direct complete for custom tasks
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (completed || !user) return;
    setIsCompleting(true);
    try {
      const token = await user.getIdToken();
      const res = await markTaskCompleted(token, task.id);
      if (res.success) {
        setCompleted(true);
        onCompleted(res.progress);
        toast.success("Task completed! Momentum increased.");
      }
    } catch (e) {
      toast.error("Failed to update task.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleReject = async () => {
    if (completed || rejected || !user) return;
    setIsCompleting(true);
    try {
      const token = await user.getIdToken();
      const res = await markTaskRejected(token, task.id, 'user_skipped');
      if (res.success) {
        setRejected(true);
        onCompleted(res.progress);
        toast.info("Task skipped. We'll learn from this.");
      }
    } catch (e) {
      toast.error("Failed to skip task.");
    } finally {
      setIsCompleting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getIcon = () => {
    if (completed) return <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />;
    return <Circle className="w-6 h-6 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors" onClick={handleComplete} />;
  };

  if (rejected) return null; // Hide from view entirely

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${completed ? 'opacity-60 bg-muted/50 border-dashed shadow-none' : 'border-primary/20 shadow-sm hover:shadow-md'}`}>
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        
        {getIcon()}
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-bold text-lg relative w-fit ${completed ? 'text-muted-foreground' : ''}`}>
              {task.title}
              {completed && (
                <span className="absolute left-0 top-1/2 w-full h-0.5 bg-muted-foreground/60 -translate-y-1/2 animate-in slide-in-from-left-full duration-500 rounded-full" />
              )}
            </h4>
            {!completed && <Badge variant="outline" className={getPriorityColor(task.priority)}>{task.priority}</Badge>}
            {!completed && task.expectedScoreIncrease > 0 && (
               <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                 <Zap className="w-3 h-3" /> +{task.expectedScoreIncrease} Score
               </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          
          {!completed && task.cinRationale && (
             <div className={`rounded-md p-2 mt-2 border ${task.isBootstrapped ? 'bg-muted/50 border-border/50' : 'bg-primary/5 border-primary/10'}`}>
               <p className={`text-xs font-medium flex items-start gap-2 ${task.isBootstrapped ? 'text-muted-foreground' : 'text-primary/80'}`}>
                 <Database className="w-4 h-4 shrink-0" />
                 <span>
                   <strong className={task.isBootstrapped ? 'text-foreground' : 'text-primary'}>
                     {task.isBootstrapped ? 'Synthetic Confidence (Prior):' : `${task.cinConfidence}% Data Confidence:`}
                   </strong> {task.cinRationale}
                 </span>
               </p>
             </div>
          )}
          
          {!completed && (
            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.estimatedTimeMins} mins</span>
            </div>
          )}
        </div>

          {!completed && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 items-center">
              <button onClick={handleReject} disabled={isCompleting} className="shrink-0 text-xs text-muted-foreground/50 hover:text-red-500 transition-colors px-2 py-1">
                Skip
              </button>
              <Button onClick={handleAction} disabled={isCompleting} className="shrink-0 w-full sm:w-auto active:scale-95 transition-transform shadow-md hover:shadow-lg">
                Execute <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

      </CardContent>
    </Card>
  );
}
