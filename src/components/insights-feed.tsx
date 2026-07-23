'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { runWeeklyReview } from '@/actions/memory-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle, Compass, Target, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function InsightsFeed() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await runWeeklyReview(token);
        setData(response.data);
      } catch (error) {
        console.error("Failed to load insights:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInsights();
  }, [user]);

  if (isLoading) {
    return (
      <Card className="border-dashed border-2 shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Analyzing your career memory for new insights...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || (!data.summary && !data.insights)) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 border-b pb-2 w-full">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-2xl font-bold font-headline">Intelligence Feed</h2>
        </div>
      </div>

      {/* Summary Block */}
      {data.summary && (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Compass className="w-24 h-24" />
        </div>
        <p className="text-lg text-foreground/90 leading-relaxed font-medium relative z-10">{data.summary}</p>
        {data.nextFocus && <p className="text-sm font-bold text-primary mt-4 uppercase tracking-wider">Next Focus: {data.nextFocus}</p>}
      </div>
      )}

      {/* Actionable Insights */}
      {data.insights && data.insights.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.insights.map((insight: any) => {
          let Icon = TrendingUp;
          let color = 'text-green-500';
          let bg = 'bg-green-50/50';
          let border = 'border-green-200';

          if (insight.type === 'warning') {
            Icon = AlertCircle;
            color = 'text-red-500';
            bg = 'bg-red-50/50';
            border = 'border-red-200';
          } else if (insight.type === 'market_update') {
            Icon = Target;
            color = 'text-blue-500';
            bg = 'bg-blue-50/50';
            border = 'border-blue-200';
          } else if (insight.type === 'celebration') {
            Icon = Sparkles;
            color = 'text-amber-500';
            bg = 'bg-amber-50/50';
            border = 'border-amber-200';
          }

          return (
            <Card key={insight.id} className={`border ${border} ${bg} shadow-sm overflow-hidden`}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex gap-3 mb-2">
                  <Icon className={`w-5 h-5 shrink-0 ${color} mt-0.5`} />
                  <h4 className="font-bold text-foreground leading-tight">{insight.title}</h4>
                </div>
                <p className="text-sm text-foreground/80 mb-4 ml-8 flex-1">{insight.description}</p>
                {insight.actionLabel && (
                  <div className="ml-8 mt-auto">
                    <Link href={insight.actionHref || '/'} className="inline-flex items-center text-sm font-bold text-primary hover:underline">
                      {insight.actionLabel} <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
