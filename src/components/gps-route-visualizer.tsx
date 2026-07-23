'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/hooks/useJobs";
import { 
  CheckCircle2, 
  Circle, 
  FileText, 
  MessageSquare, 
  Mic, 
  BookOpen, 
  Send,
  AlertTriangle,
  TrendingUp,
  MapPin
} from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { generateRouteForJob } from '@/actions/gps-actions';
import { toast } from 'sonner';

interface GpsRouteVisualizerProps {
  destination: Job;
  onActionClick?: (actionType: string, stepId: string) => void;
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'rewrite_resume': return <FileText className="h-4 w-4" />;
    case 'generate_cover_letter': return <MessageSquare className="h-4 w-4" />;
    case 'mock_interview': return <Mic className="h-4 w-4" />;
    case 'upskill': return <BookOpen className="h-4 w-4" />;
    case 'apply': return <Send className="h-4 w-4" />;
    default: return <Circle className="h-4 w-4" />;
  }
};

const getActionLabel = (type: string) => {
  switch (type) {
    case 'rewrite_resume': return "Rewrite Resume (5c)";
    case 'generate_cover_letter': return "Generate Letter (3c)";
    case 'mock_interview': return "Practice Now (3c)";
    case 'upskill': return "Find Training";
    case 'apply': return "Mark Applied";
    default: return "Start";
  }
};

export function GpsRouteVisualizer({ destination, onActionClick }: GpsRouteVisualizerProps) {
  const route = destination.computedRoute;
  const { user } = useUser();
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    async function calculateMissingRoute() {
      if (!route && destination.id && user && !isCalculating && destination.destinationState !== 'ready') {
        setIsCalculating(true);
        try {
          const token = await user.getIdToken();
          await generateRouteForJob(token, destination.id);
          toast.success("Route calculation complete!");
        } catch (error) {
          console.error("Failed to calculate route:", error);
          toast.error("Failed to calculate route.");
        } finally {
          setIsCalculating(false);
        }
      }
    }
    calculateMissingRoute();
  }, [route, destination.id, user, isCalculating, destination.destinationState]);

  if (!route) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <MapPin className="h-8 w-8 text-primary/40 mb-3 animate-bounce" />
          <h3 className="font-semibold text-lg text-primary">Destination Set</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mt-1">
            Analyzing your profile against this role to calculate the fastest route...
          </p>
          {/* Usually the parent component triggers the calculation, or a button here if manual */}
          <Button variant="outline" className="mt-4" disabled>
            {isCalculating ? "Calculating Route..." : "Waiting for route..."}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Route Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Match Probability</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold ${route.matchProbability >= 70 ? 'text-green-600' : route.matchProbability >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {route.matchProbability}%
            </span>
          </div>
        </div>
        
        {route.salaryDelta && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Salary Impact</p>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-lg font-bold text-foreground">{route.salaryDelta}</span>
            </div>
          </div>
        )}

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 md:col-span-2">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Missing Critical Skills</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {route.missingSkills.length > 0 ? (
              route.missingSkills.map(skill => (
                <Badge key={skill} variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                  {skill}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">None detected!</Badge>
            )}
          </div>
        </div>
      </div>

      {/* The Line X Timeline */}
      <div className="relative pt-4 pl-4 md:pl-8">
        <div className="absolute left-[27px] md:left-[43px] top-6 bottom-0 w-0.5 bg-border z-0" />
        
        <div className="space-y-8 relative z-10">
          {/* Point A */}
          <div className="flex items-start gap-4">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 border-4 border-background shadow-sm">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-primary">Point A: Current Profile</p>
              <p className="text-sm text-muted-foreground">Based on your verified skills and resume.</p>
            </div>
          </div>

          {/* Action Steps */}
          {route.steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4 group">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-4 border-background shadow-sm transition-colors ${step.isCompleted ? 'bg-green-500' : 'bg-muted border-border'}`}>
                {step.isCompleted ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className="h-2 w-2 rounded-full bg-border" />}
              </div>
              <div className={`flex-1 rounded-xl border p-4 transition-all ${step.isCompleted ? 'bg-green-50/50 border-green-200 opacity-70' : 'bg-card border-border hover:border-primary/30 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Step {index + 1}</span>
                      <h4 className={`font-semibold ${step.isCompleted ? 'text-green-700 line-through' : 'text-foreground'}`}>{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                  {!step.isCompleted && (
                    <Button 
                      size="sm" 
                      onClick={() => onActionClick?.(step.actionType, step.id)}
                      className="shrink-0"
                      variant={step.actionType === 'apply' ? 'default' : 'secondary'}
                    >
                      {getActionIcon(step.actionType)}
                      <span className="ml-2">{getActionLabel(step.actionType)}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Point B */}
          <div className="flex items-start gap-4">
            <div className="h-6 w-6 rounded-full bg-black flex items-center justify-center shrink-0 mt-0.5 border-4 border-background shadow-sm">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">Point B: {destination.title}</p>
              <p className="text-sm text-muted-foreground">{destination.company}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
