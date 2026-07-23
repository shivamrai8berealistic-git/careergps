'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getRouteJobStatus, retryRouteJob } from '@/actions/route-actions';
import { Loader2, AlertCircle, RefreshCw, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function GeneratingRoutePage() {
  const { user, isUserLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | 'not_found'>('pending');
  const [error, setError] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!user || !jobId) return;

    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const token = await user.getIdToken();
        const jobStatus = await getRouteJobStatus(token, jobId);
        
        setStatus(jobStatus.status as any);
        
        if (jobStatus.status === 'completed' && jobStatus.routeId) {
          clearInterval(interval);
          toast.success("Career Route generated successfully!");
          router.push(`/routes/${jobStatus.routeId}`);
        } else if (jobStatus.status === 'failed') {
          clearInterval(interval);
          setError(jobStatus.error || "An unknown error occurred during generation.");
        } else if (jobStatus.status === 'not_found') {
          clearInterval(interval);
          setError("Generation job not found.");
        }
      } catch (err: any) {
        console.error("Failed to check status", err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 3000); // poll every 3 seconds

    return () => clearInterval(interval);
  }, [user, jobId, router]);

  const handleRetry = async () => {
    if (!user) return;
    setIsRetrying(true);
    try {
      const token = await user.getIdToken();
      await retryRouteJob(token, jobId);
      setStatus('pending');
      setError('');
      toast.success("Retrying route generation...");
    } catch (err: any) {
      toast.error(err.message || "Failed to retry generation");
    } finally {
      setIsRetrying(false);
    }
  };

  if (isUserLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex h-[80vh] items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-primary/20">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <Navigation className="w-6 h-6 text-primary" />
            {status === 'failed' ? "Generation Failed" : "Generating Route"}
          </CardTitle>
          <CardDescription>
            {status === 'failed' 
              ? "We encountered an issue building your career roadmap." 
              : "Our AI engines are mapping your optimal career trajectory."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-6">
          {status === 'pending' || status === 'processing' ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                {status === 'pending' ? "Queuing your request..." : "Analyzing career twin and synthesizing checkpoints..."}
              </p>
            </>
          ) : status === 'failed' ? (
            <>
              <AlertCircle className="w-16 h-16 text-destructive" />
              <p className="text-sm text-destructive max-w-sm">
                {error}
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-xs text-left w-full border border-border/50">
                <p className="font-semibold mb-1">Don't worry, your credits are safe.</p>
                <p className="text-muted-foreground">Your credits were automatically refunded. You will only be charged when the generation successfully completes.</p>
              </div>
              <div className="flex gap-4 w-full pt-4">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/routes')}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleRetry} disabled={isRetrying}>
                  {isRetrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Retry Generation
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
