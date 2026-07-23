'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProofSignal {
  signal: string;
  score: number;
  status: 'strong' | 'weak' | 'missing';
  gap: string;
  highestROIAction: string;
  etaImpactDays: number;
}

interface ProjectRecommendation {
  title: string;
  problemSolved: string;
  relevanceToTarget: string;
  techStack: string[];
  proofValue: {
    resumeImpact: string;
    githubImpact: string;
    linkedinImpact: string;
    interviewValue: string;
  };
  estimatedHours: number;
  confidenceBoost: number;
  isPrimary: boolean;
}

const SIGNAL_LABELS: Record<string, string> = {
  resume: 'Resume', linkedin: 'LinkedIn', github: 'GitHub', portfolio: 'Portfolio',
  projects: 'Projects', interview: 'Interview Readiness', skills: 'Skill Signals',
  experience: 'Experience', reputation: 'Reputation', visibility: 'Recruiter Visibility',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'strong') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === 'weak') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

export function ProofGapCard({ signal }: { signal: ProofSignal }) {
  const color = signal.status === 'strong' ? 'bg-green-500' : signal.status === 'weak' ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
      <div className="flex flex-col items-center gap-1 w-16 shrink-0">
        <StatusIcon status={signal.status} />
        <span className="text-xs font-bold">{signal.score}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-sm">{SIGNAL_LABELS[signal.signal] || signal.signal}</span>
          {signal.etaImpactDays > 0 && (
            <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">
              -{signal.etaImpactDays}d ETA
            </Badge>
          )}
        </div>
        <Progress value={signal.score} className={`h-1.5 mb-2`} />
        <p className="text-xs text-muted-foreground leading-relaxed">{signal.gap}</p>
        {signal.status !== 'strong' && (
          <p className="text-xs font-medium text-primary mt-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3" /> {signal.highestROIAction}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProjectCard({ project, onStart }: { project: ProjectRecommendation; onStart?: () => void }) {
  return (
    <Card className={`overflow-hidden transition-all ${project.isPrimary ? 'border-primary/40 shadow-md ring-1 ring-primary/20' : 'border-border/60'}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            {project.isPrimary && (
              <Badge className="mb-2 text-xs bg-primary/10 text-primary border-primary/20">
                ⚡ Highest ROI
              </Badge>
            )}
            <h3 className="font-bold text-base leading-tight">{project.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{project.problemSolved}</p>
          </div>
          <div className="text-center shrink-0">
            <p className="text-2xl font-bold text-primary">+{project.confidenceBoost}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
          </div>
        </div>

        <p className="text-xs text-foreground/80 italic border-l-2 border-primary/30 pl-3">{project.relevanceToTarget}</p>

        <div className="flex flex-wrap gap-1.5">
          {project.techStack.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <p className="font-semibold text-foreground mb-0.5">📄 Resume</p>
            <p className="text-muted-foreground">{project.proofValue.resumeImpact}</p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="font-semibold text-foreground mb-0.5">💻 GitHub</p>
            <p className="text-muted-foreground">{project.proofValue.githubImpact}</p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="font-semibold text-foreground mb-0.5">🔗 LinkedIn</p>
            <p className="text-muted-foreground">{project.proofValue.linkedinImpact}</p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="font-semibold text-foreground mb-0.5">🎤 Interview</p>
            <p className="text-muted-foreground">{project.proofValue.interviewValue}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> ~{project.estimatedHours}h to complete
          </span>
          <Button size="sm" onClick={onStart} className="group">
            Start Building <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
