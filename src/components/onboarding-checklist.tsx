'use client';

import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Step {
  id: number;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
}

interface OnboardingChecklistProps {
  steps: Step[];
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const completedCount = steps.filter(s => s.isCompleted).length;
  const progress = (completedCount / steps.length) * 100;

  if (completedCount === steps.length) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <CheckCircle2 className="h-32 w-32 text-primary" />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-2xl font-headline text-primary">Rocket Start Checklist 🚀</CardTitle>
          <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {completedCount} / {steps.length} Steps
          </span>
        </div>
        <CardDescription className="text-lg">
          Complete these steps to unlock the full power of your Smart Career Copilot.
        </CardDescription>
        <Progress value={progress} className="h-2 mt-4" />
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
              step.isCompleted 
                ? 'bg-green-50/50 border-green-200 opacity-80' 
                : 'bg-white border-primary/10 hover:border-primary/30 shadow-sm'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <h4 className={`font-semibold ${step.isCompleted ? 'text-green-700 line-through decoration-1' : 'text-foreground'}`}>
                  {step.title}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
            
            {!step.isCompleted && (
              <Button size="sm" variant="outline" className="w-full text-xs font-semibold group" asChild>
                <Link href={step.href}>
                  Let's Go <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
