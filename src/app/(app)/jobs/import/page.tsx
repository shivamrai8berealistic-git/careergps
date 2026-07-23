'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { importJobAction } from '@/actions/tool-actions';
import { Loader2, Rocket, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function ImportJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading: authLoading } = useUser();
  const [status, setStatus] = useState<'loading' | 'processing' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processImport() {
      if (authLoading) return;

      if (!user) {
        setStatus('error');
        setError('You must be logged in to import jobs.');
        return;
      }

      const dataParam = searchParams.get('data');
      if (!dataParam) {
        setStatus('error');
        setError('No job data found in the request.');
        return;
      }

      try {
        setStatus('processing');

        // 1. Decode Base64 data from extension
        const decodedJson = atob(decodeURIComponent(dataParam));
        const jobData = JSON.parse(decodedJson);

        // 2. Validate essential fields
        if (!jobData.title || !jobData.company) {
          throw new Error('Invalid job data received from extension.');
        }

        // 3. Save to Firestore via Server Action
        const token = await user.getIdToken();
        const result = await importJobAction(token, jobData);
        if (!result.success) throw new Error("Failed to import");

        setStatus('success');
        
        // 4. Redirect after a short delay so the user sees the success state
        setTimeout(() => {
        setTimeout(() => {
          router.push(`/jobs/${result.id}`);
        }, 1500);
        }, 1500);

      } catch (err: any) {
        console.error('Import failed:', err);
        setStatus('error');
        setError(err.message || 'An unexpected error occurred during import.');
      }
    }

    processImport();
  }, [user, authLoading, searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full shadow-lg border-2 border-primary/10">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Rocket className="text-primary w-6 h-6" />
                CareerPilot Import
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-8">
          {status === 'loading' || status === 'processing' ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium">
                {status === 'loading' ? 'Preparing import...' : 'Saving job to your dashboard...'}
              </p>
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center">
                <p className="text-lg font-semibold">Job Saved Successfully!</p>
                <p className="text-muted-foreground text-sm">Redirecting to your analysis...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 animate-in fade-in">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="text-lg font-semibold text-destructive">Import Failed</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImportJobPage() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    }>
      <ImportJobContent />
    </Suspense>
  );
}
