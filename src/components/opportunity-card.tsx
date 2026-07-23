'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Briefcase, MapPin, Zap, AlertTriangle, ArrowRight, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  currentMatchScore: number;
  potentialMatchScore: number;
  missingSkills: string[];
  nextActionTitle: string;
  cinRationale?: string;
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();

  const handleCloseGap = () => {
    toast.success(`Action "${opportunity.nextActionTitle}" added to your Command Center!`);
    // In a full implementation, this would trigger an API call to add a custom task to the Mission Queue
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-xl font-headline text-foreground">{opportunity.title}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1 font-medium"><Briefcase className="w-4 h-4" /> {opportunity.company}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {opportunity.location}</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold whitespace-nowrap text-sm">
            {opportunity.salaryRange}
          </Badge>
        </div>

        {/* Match Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
             <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
               <span>Current Match</span>
               <span>{opportunity.currentMatchScore}%</span>
             </div>
             <Progress value={opportunity.currentMatchScore} className="h-2" />
          </div>
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20 relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-10">
                <Zap className="w-12 h-12" />
             </div>
             <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-primary relative z-10">
               <span>Potential Match</span>
               <span>{opportunity.potentialMatchScore}%</span>
             </div>
             <Progress value={opportunity.potentialMatchScore} className="h-2 relative z-10" />
          </div>
        </div>

        {/* CIN Rationale */}
        {opportunity.cinRationale && (
          <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 flex items-start gap-2">
            <Database className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed font-medium">
              <strong className="text-blue-700">Market Intelligence:</strong> {opportunity.cinRationale}
            </p>
          </div>
        )}

        {/* Actionable Gap Analysis */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-foreground">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Gap Analysis
          </h4>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground flex items-center">Missing:</span>
              {opportunity.missingSkills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="bg-red-50 text-red-700 border-red-100">
                  {skill}
                </Badge>
              ))}
            </div>

            <Button onClick={handleCloseGap} className="w-full font-bold group">
               {opportunity.nextActionTitle}
               <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
