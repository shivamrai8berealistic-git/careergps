import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Bottleneck {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  fixAction: string;
}

export function BottleneckAlerts({ bottlenecks }: { bottlenecks: Bottleneck[] }) {
  if (!bottlenecks || bottlenecks.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-red-500" /> 
        Active Bottlenecks
      </h3>
      {bottlenecks.map((b, i) => {
        const isHigh = b.severity === 'high';
        return (
          <Card key={i} className={`border-l-4 ${isHigh ? 'border-l-red-500 bg-red-50/50' : 'border-l-amber-500 bg-amber-50/50'} shadow-sm`}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex gap-3 items-start">
                {isHigh ? (
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-semibold ${isHigh ? 'text-red-900' : 'text-amber-900'}`}>{b.title}</h4>
                  <p className={`text-sm mt-1 ${isHigh ? 'text-red-800/80' : 'text-amber-800/80'}`}>{b.description}</p>
                  <p className="text-xs font-bold uppercase mt-3 text-muted-foreground">{b.fixAction}</p>
                </div>
              </div>
              <Link href="/simulator">
                <Button size="sm" variant={isHigh ? "destructive" : "outline"} className="shrink-0 whitespace-nowrap">
                  Fix Bottleneck
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
