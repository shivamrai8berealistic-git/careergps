'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useProfile } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Zap, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { runSimulator } from '@/actions/intelligence-actions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function SimulatorPage() {
  const { user } = useUser();
  const { profile } = useProfile();
  
  const [scenario, setScenario] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    if (!scenario.trim()) {
      toast.error("Please enter a scenario to simulate.");
      return;
    }
    if (!user) return;

    setIsSimulating(true);
    setResult(null);

    try {
      const token = await user.getIdToken();
      const response = await runSimulator(token, scenario);
      setResult(response.data);
      toast.success("Simulation complete!");
    } catch (error: any) {
      if (error.message?.includes('QUOTA_EXCEEDED')) {
        toast.error("Insufficient credits for a Career Simulation (Costs 20).");
      } else {
        toast.error("Failed to run simulation. Please try again.");
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
      
      <header className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full mb-2">
          <Zap className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Career Simulator</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Project your exact route, timeline, and salary delta before making a major career move. 
          Cost: <Badge variant="secondary" className="ml-1 font-bold">20 Credits</Badge>
        </p>
      </header>

      <Card className="border-primary/20 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
            
            {/* Input Section */}
            <div className="md:col-span-1 bg-muted/10 p-6 flex flex-col">
              <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-4">The "What If" Scenario</h3>
              <Textarea 
                placeholder="What if I learn React and Node.js?" 
                className="flex-1 min-h-[150px] resize-none text-lg shadow-inner mb-6"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              />
              <Button 
                size="lg" 
                onClick={handleSimulate} 
                disabled={isSimulating} 
                className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 text-lg"
              >
                {isSimulating ? (
                  <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Simulating...</>
                ) : (
                  <>Run Simulation</>
                )}
              </Button>
            </div>

            {/* Results Section */}
            <div className="md:col-span-2 p-8 bg-card">
              {!result && !isSimulating && (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                  <Zap className="h-16 w-16 text-muted-foreground/20 mb-4" />
                  <p className="text-lg">Enter a pivot scenario on the left to see your projected reality.</p>
                  <p className="text-sm mt-2">Try: "What if I pivot from Sales to Product Management?"</p>
                </div>
              )}
              
              {isSimulating && (
                <div className="h-full flex flex-col items-center justify-center p-12 space-y-6">
                  <div className="relative h-24 w-24">
                     <div className="absolute inset-0 rounded-full border-4 border-amber-500/20"></div>
                     <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                     <Zap className="absolute inset-0 m-auto h-8 w-8 text-amber-500 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold animate-pulse">Running Multi-Agent Simulation...</h3>
                    <p className="text-sm text-muted-foreground">Evaluating market demand against your Twin...</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                  
                  {/* Summary */}
                  <div className="flex gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg">Scenario Analysis</h4>
                      <p className="text-foreground/80 leading-relaxed mt-1">{result.scenarioAnalysis}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-xl border border-border/50 bg-card shadow-sm text-center">
                       <p className="text-3xl font-bold font-headline text-foreground">{result.probabilityOfSuccess}%</p>
                       <p className="text-xs uppercase font-bold text-muted-foreground mt-1 tracking-wider">Probability of Success</p>
                     </div>
                     <div className="p-4 rounded-xl border border-border/50 bg-card shadow-sm text-center">
                       <p className="text-3xl font-bold font-headline text-green-600">{result.projectedSalaryDelta}</p>
                       <p className="text-xs uppercase font-bold text-muted-foreground mt-1 tracking-wider">Salary Impact</p>
                     </div>
                  </div>

                  {/* Target Roles */}
                  <div>
                    <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-3">Qualifying Target Roles</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.newTargetRoles.map((role: string) => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Step by Step Route */}
                  <div>
                    <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-4">Projected Route</h4>
                    <div className="space-y-4">
                      {result.actionPlan.map((step: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-200">
                              {index + 1}
                            </div>
                            {index !== result.actionPlan.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-2"></div>
                            )}
                          </div>
                          <div className="pb-6">
                            <h5 className="font-bold text-foreground flex items-center gap-2">
                              {step.title}
                              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{step.timeframe}</Badge>
                            </h5>
                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
