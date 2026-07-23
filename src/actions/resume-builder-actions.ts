'use server';

import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { logCareerEvent } from '@/lib/memory-engine';
import { recalculateActiveRouteProgress } from '@/actions/route-actions';

async function getUserId(idToken: string): Promise<string> {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  const decodedClaims = await getAuth(admin.app()).verifyIdToken(idToken);
  return decodedClaims.uid;
}

// ── Types ──────────────────────────────────────────────────────────────

export type ResumeExperience = {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  bullets: string[];
};

export type ResumeEducation = {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  graduationDate?: string;
};

export type ResumeProject = {
  id: string;
  name: string;
  description: string;
  url?: string;
  techStack?: string[];
};

export type MasterResume = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  portfolioUrl?: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  updatedAt?: any;
};

export type ResumeVersion = {
  id?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  optimizedSummary: string;
  optimizedSkills: string[];
  optimizedExperience: ResumeExperience[];
  atsScore?: number;
  createdAt?: any;
};

// ── Master Resume CRUD ─────────────────────────────────────────────────

export async function getMasterResume(idToken: string): Promise<{ success: boolean; resume: MasterResume | null }> {
  const userId = await getUserId(idToken);
  const ref = adminDb.collection('users').doc(userId).collection('masterResume').doc('current');
  const doc = await ref.get();

  if (!doc.exists) {
    // Try to bootstrap from parsed resume data
    const profileDoc = await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').get();
    const profileData = profileDoc.data();

    // Try to find parsed resume to pre-fill
    const resumesSnap = await adminDb.collection('users').doc(userId).collection('resumes').limit(1).get();
    let parsedData: any = null;
    if (!resumesSnap.empty) {
      const resumeId = resumesSnap.docs[0].id;
      const parsedDoc = await adminDb.collection('users').doc(userId)
        .collection('resumes').doc(resumeId)
        .collection('parsedResumeData').doc('parsedResumeData').get();
      if (parsedDoc.exists) parsedData = parsedDoc.data();
    }

    // Construct a starter resume from whatever data is available
    const starter: MasterResume = {
      fullName: parsedData?.name || profileData?.fullName || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      location: profileData?.preferredLocations?.[0] || '',
      headline: parsedData?.headline || profileData?.currentOrLastJobTitle || '',
      summary: parsedData?.summary || profileData?.rawResumeText || '',
      skills: parsedData?.skills || profileData?.keySkills || [],
      experience: (parsedData?.experience || []).map((e: any, i: number) => ({
        id: `exp-${i}`,
        title: e.title || '',
        company: e.company || '',
        location: e.location || '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        bullets: Array.isArray(e.descriptionBullets) ? e.descriptionBullets :
                 typeof e.description === 'string' ? e.description.split('\n').filter(Boolean) : [],
      })),
      education: (parsedData?.education || []).map((e: any, i: number) => ({
        id: `edu-${i}`,
        degree: e.degree || '',
        institution: e.institution || '',
        fieldOfStudy: e.fieldOfStudy || '',
        graduationDate: '',
      })),
      projects: [],
    };

    return { success: true, resume: starter };
  }

  return { success: true, resume: doc.data() as MasterResume };
}

export async function saveMasterResume(idToken: string, data: MasterResume) {
  const userId = await getUserId(idToken);
  const ref = adminDb.collection('users').doc(userId).collection('masterResume').doc('current');

  await ref.set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Also update profile skills/headline for Career Twin consistency
  await adminDb.collection('users').doc(userId).collection('profile').doc('main-profile').set({
    fullName: data.fullName,
    currentOrLastJobTitle: data.headline,
    keySkills: data.skills,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true }).catch(() => {});

  await logCareerEvent(userId, 'resume_updated' as any, { source: 'resume_builder' });
  await recalculateActiveRouteProgress(userId);

  return { success: true };
}

// ── Resume Versions ────────────────────────────────────────────────────

export async function getResumeVersions(idToken: string) {
  const userId = await getUserId(idToken);
  const snap = await adminDb.collection('users').doc(userId)
    .collection('resumeVersions').orderBy('createdAt', 'desc').get();

  const versions = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
  })) as ResumeVersion[];

  return { success: true, versions };
}

export async function getResumeVersion(idToken: string, versionId: string) {
  const userId = await getUserId(idToken);
  const doc = await adminDb.collection('users').doc(userId)
    .collection('resumeVersions').doc(versionId).get();

  if (!doc.exists) return { success: false, error: 'Version not found' };

  const version = {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
  } as ResumeVersion;

  return { success: true, version };
}

export async function saveResumeVersion(idToken: string, version: Omit<ResumeVersion, 'id' | 'createdAt'>) {
  const userId = await getUserId(idToken);
  const ref = adminDb.collection('users').doc(userId).collection('resumeVersions').doc();
  await ref.set({
    ...version,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logCareerEvent(userId, 'resume_version_created' as any, {
    jobId: version.jobId,
    jobTitle: version.jobTitle,
  });

  return { success: true, id: ref.id };
}

export async function deleteResumeVersion(idToken: string, versionId: string) {
  const userId = await getUserId(idToken);
  await adminDb.collection('users').doc(userId).collection('resumeVersions').doc(versionId).delete();
  return { success: true };
}

import { optimizeResumeForJob } from '@/ai/flows/optimize-resume-for-job';

export async function generateResumeVersionAction(idToken: string, jobId: string) {
  const userId = await getUserId(idToken);

  // Fetch Master Resume
  const { resume: masterResume } = await getMasterResume(idToken);
  if (!masterResume) {
    throw new Error('Master resume not found.');
  }

  // Fetch Target Job
  const jobDoc = await adminDb.collection('users').doc(userId).collection('jobs').doc(jobId).get();
  if (!jobDoc.exists) {
    throw new Error('Target job not found.');
  }
  const jobData = jobDoc.data() as any;

  // Map to structured format expected by AI
  const structuredResume = {
    name: masterResume.fullName,
    headline: masterResume.headline,
    summary: masterResume.summary,
    skills: masterResume.skills,
    experience: masterResume.experience.map(e => ({
      title: e.title,
      company: e.company,
      description: e.bullets.join('\n')
    })),
    education: masterResume.education.map(e => ({
      degree: e.degree,
      institution: e.institution,
      description: `${e.fieldOfStudy || ''} ${e.graduationDate || ''}`.trim()
    }))
  };

  const structuredJob = {
    title: jobData.title,
    company: jobData.company,
    location: jobData.location,
    description: jobData.description || `${jobData.title} at ${jobData.company}`,
    requiredSkills: [],
    responsibilities: []
  };

  // Generate optimization
  const output = await optimizeResumeForJob({
    userId,
    structuredResume,
    structuredJob
  });

  // Apply suggestions to create a ResumeVersion
  const newExperience = masterResume.experience.map(exp => {
    const optimizedBullets = exp.bullets.map(b => {
      const suggestion = output.revisedBulletSuggestions.find(s => s.originalBullet === b);
      return suggestion ? suggestion.revisedBullet : b;
    });
    return { ...exp, bullets: optimizedBullets };
  });

  const mergedSkills = Array.from(new Set([...masterResume.skills, ...output.keywordSuggestions]));

  const version: Omit<ResumeVersion, 'id' | 'createdAt'> = {
    jobId,
    jobTitle: jobData.title,
    company: jobData.company,
    optimizedSummary: output.revisedSummarySuggestion,
    optimizedSkills: mergedSkills,
    optimizedExperience: newExperience,
    atsScore: Math.floor(Math.random() * (98 - 85 + 1)) + 85 // Mock ATS score for now
  };

  const res = await saveResumeVersion(idToken, version);
  return { success: true, versionId: res.id, version };
}
