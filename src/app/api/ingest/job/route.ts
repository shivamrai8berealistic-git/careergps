import { NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { logCareerEvent } from '@/lib/memory-engine';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedClaims;
    try {
      decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    const userId = decodedClaims.uid;
    const data = await req.json();

    if (!data.url || !data.title) {
      return NextResponse.json({ error: 'Missing url or title' }, { status: 400 });
    }

    // Deduplication check
    const jobsRef = adminDb.collection('users').doc(userId).collection('jobs');
    const existingJobQuery = await jobsRef.where('url', '==', data.url).limit(1).get();

    let jobId = '';

    if (!existingJobQuery.empty) {
      // Job already exists, check if status changed to 'applied'
      const existingJob = existingJobQuery.docs[0];
      jobId = existingJob.id;
      
      if (data.status === 'applied' && existingJob.data().status !== 'applied') {
         await existingJob.ref.update({ status: 'applied', updatedAt: new Date() });
         await logCareerEvent(userId, 'job_applied' as any, { jobId, title: data.title });
      } else {
         return NextResponse.json({ success: true, message: 'Job already captured.' });
      }
    } else {
      // New Job
      const newJobRef = jobsRef.doc();
      jobId = newJobRef.id;
      await newJobRef.set({
        title: data.title,
        company: data.company,
        location: data.location,
        url: data.url,
        status: data.status || 'viewed',
        source: 'chrome_extension',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const eventType = data.status === 'applied' ? 'job_applied' : 'job_viewed';
      await logCareerEvent(userId, eventType as any, { jobId, title: data.title });
    }

    // Force recalculation of ETA / Daily Mission by deleting today's mission cache
    const today = new Date().toISOString().split('T')[0];
    await adminDb.collection('users').doc(userId).collection('missions').doc(today).delete().catch(() => {});

    return NextResponse.json({ success: true, jobId });
    
  } catch (error: any) {
    console.error('Ingestion API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
