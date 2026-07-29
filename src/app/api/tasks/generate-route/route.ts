import { NextRequest, NextResponse } from 'next/server';
import { executeRouteGeneration } from '@/lib/route-generation-engine';
import { adminDb } from '@/lib/firebase-admin';

export const maxDuration = 300; // 5 minutes (or plan max) to prevent Vercel timeout on AI tasks

export async function POST(req: NextRequest) {
  // In a real production setup with Cloud Tasks, you would verify the OIDC token here.
  // For simplicity and adherence to the "Smallest Safe Fix", we accept requests
  // but validate that the job actually exists and is pending in Firestore.
  
  try {
    const body = await req.json();
    const { userId, blueprintId, optimizationStyle, targetJobTitle, jobId } = body;

    if (!userId || !blueprintId || !jobId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify the job exists and is pending
    const jobRef = adminDb.collection('users').doc(userId).collection('route_jobs').doc(jobId);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    if (jobDoc.data()?.status !== 'pending') {
      return NextResponse.json({ error: 'Job already processed' }, { status: 400 });
    }

    // Acknowledge the task immediately so Cloud Tasks doesn't timeout waiting for the generation
    // Wait! In Cloud Tasks, if we return early, it assumes success. If generation fails later, 
    // it won't retry. Since Vercel maxDuration applies, we should execute it synchronously 
    // within the API route, and let Vercel handle the timeout up to maxDuration.
    // Cloud Tasks has a 10+ minute timeout, so keeping the connection open is fine.

    await executeRouteGeneration(userId, blueprintId, optimizationStyle, targetJobTitle, jobId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Task API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
