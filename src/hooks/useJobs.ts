'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp, 
  doc, 
  updateDoc,
  orderBy,
  onSnapshot,
  QueryConstraint,
  limit
} from 'firebase/firestore';

export type UserPlan = 'free' | 'pro';

export interface Job {
  id: string;
  userId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl?: string;
  sourceUrl?: string;
  employmentType?: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  // Career GPS additions
  destinationState?: 'analyzing' | 'ready' | 'archived';
  computedRoute?: {
    matchProbability: number;
    salaryDelta?: string;
    missingSkills: string[];
    steps: {
      id: string;
      title: string;
      description: string;
      actionType: 'rewrite_resume' | 'generate_cover_letter' | 'mock_interview' | 'upskill' | 'apply';
      isCompleted: boolean;
    }[];
  };
  appliedDate?: any;
  followUpDate?: string;
  followUpNotes?: string;
  followUpCompleted?: boolean;
  createdAt: any;
  updatedAt: any;
}

export function useJobs() {
  const { user } = useUser();
  const firestore = useFirestore();

  const jobsQuery = useMemoFirebase(() => {
    if (!user) return null;
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(50)
    ];
    return query(collection(firestore, 'users', user.uid, 'jobs'), ...constraints);
  }, [user, firestore]);

  const { data: jobs, isLoading, error } = useCollection<Job>(jobsQuery);

  const addJob = async (jobData: Partial<Job>) => {
    if (!user) throw new Error('User must be logged in to add a job');
    
    if (jobData.sourceUrl && jobs) {
      const isDuplicate = jobs.some(j => j.sourceUrl === jobData.sourceUrl);
      if (isDuplicate) {
        throw new Error('You have already saved this job.');
      }
    }
    
    return addDoc(collection(firestore, 'users', user.uid, 'jobs'), {
      ...jobData,
      userId: user.uid,
      status: jobData.status || 'saved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    if (!user) throw new Error('User must be logged in to update a job');
    const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    // Auto-set appliedDate when moving to 'applied' for the first time
    if (status === 'applied') {
      updateData.appliedDate = serverTimestamp();
    }
    return updateDoc(jobRef, updateData);
  };

  const updateJobFollowUp = async (jobId: string, followUpData: { followUpDate?: string; followUpNotes?: string; followUpCompleted?: boolean }) => {
    if (!user) throw new Error('User must be logged in');
    const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
    return updateDoc(jobRef, {
      ...followUpData,
      updatedAt: serverTimestamp(),
    });
  };

  const getJob = async (jobId: string) => {
    if (!user) return null;
    const jobDoc = await getDoc(doc(firestore, 'users', user.uid, 'jobs', jobId));
    if (!jobDoc.exists()) return null;
    return { id: jobDoc.id, ...jobDoc.data() } as Job;
  };

  const saveAnalysis = async (jobId: string, analysisResults: any) => {
    if (!user) throw new Error('User must be logged in to save analysis');
    
    return addDoc(collection(firestore, 'users', user.uid, 'jobAnalyses'), {
      jobId,
      userId: user.uid,
      ...analysisResults,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return {
    jobs,
    isLoading,
    error,
    addJob,
    updateJobStatus,
    updateJobFollowUp,
    getJob,
    saveAnalysis,
  };
}

export function useJobAnalysis(jobId: string) {
  const { user } = useUser();
  const firestore = useFirestore();

  const analysisQuery = useMemoFirebase(() => {
    if (!user || !jobId) return null;
    const constraints: QueryConstraint[] = [
      where('jobId', '==', jobId),
      orderBy('createdAt', 'desc')
    ];
    return query(collection(firestore, 'users', user.uid, 'jobAnalyses'), ...constraints);
  }, [user, firestore, jobId]);

  const { data: analysis, isLoading, error } = useCollection<any>(analysisQuery);

  return {
    analysis: analysis?.[0] || null,
    isLoading,
    error,
  };
}

export function useProfile() {
  const { user } = useUser();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid, 'profile', 'profile');
  }, [user, firestore]);

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileRef) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(profileRef as any);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [profileRef]);

  const updateProfile = async (data: any) => {
    if (!user) throw new Error('User must be logged in to update profile');
    const ref = doc(firestore, 'users', user.uid, 'profile', 'profile');
    return updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    profile,
    isLoading,
    updateProfile,
  };
}

export function useResumes() {
  const { user } = useUser();
  const firestore = useFirestore();

  const resumesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'resumes'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: resumes, isLoading, error } = useCollection<any>(resumesQuery);

  const getPrimaryResume = () => {
    return resumes?.find(r => r.isPrimary) || resumes?.[0] || null;
  };

  const getParsedResume = async (resumeId: string) => {
    if (!user) return null;
    const docSnap = await getDoc(doc(firestore, 'users', user.uid, 'resumes', resumeId, 'parsedResumeData', 'parsedResumeData'));
    if (!docSnap.exists()) return null;
    return docSnap.data();
  };

  const addResume = async (name: string, storagePath: string) => {
    if (!user) throw new Error('User must be logged in to add a resume');
    
    return addDoc(collection(firestore, 'users', user.uid, 'resumes'), {
      name,
      storagePath,
      userId: user.uid,
      isPrimary: (resumes?.length || 0) === 0, // Make primary if it's the first one
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const deleteResume = async (resumeId: string) => {
    if (!user) throw new Error('User must be logged in to delete a resume');
    return deleteDoc(doc(firestore, 'users', user.uid, 'resumes', resumeId));
  };

  const setPrimaryResume = async (resumeId: string) => {
    if (!user || !resumes) throw new Error('User must be logged in');
    
    // Batch this or just do sequential
    const promises = resumes.map(r => {
      const ref = doc(firestore, 'users', user.uid, 'resumes', r.id);
      return updateDoc(ref, { isPrimary: r.id === resumeId, updatedAt: serverTimestamp() });
    });
    return Promise.all(promises);
  };

  const saveParsedData = async (resumeId: string, data: any) => {
    if (!user) throw new Error('User must be logged in');
    const ref = doc(firestore, 'users', user.uid, 'resumes', resumeId, 'parsedResumeData', 'parsedResumeData');
    return setDoc(ref, {
      ...data,
      userId: user.uid,
      resumeId,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    resumes,
    isLoading,
    error,
    getPrimaryResume,
    getParsedResume,
    addResume,
    deleteResume,
    setPrimaryResume,
    saveParsedData,
  };
}

export function useCoverLetters() {
  const { user } = useUser();
  const firestore = useFirestore();

  const queryRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'coverLetters'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: coverLetters, isLoading, error } = useCollection<any>(queryRef);

  const saveCoverLetter = async (data: any) => {
    if (!user) throw new Error('User must be logged in');
    return addDoc(collection(firestore, 'users', user.uid, 'coverLetters'), {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return {
    coverLetters,
    isLoading,
    error,
    saveCoverLetter,
  };
}

export function useInterviewPreps() {
  const { user } = useUser();
  const firestore = useFirestore();

  const queryRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'interviewPreps'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: interviewPreps, isLoading, error } = useCollection<any>(queryRef);

  const saveInterviewPrep = async (data: any) => {
    if (!user) throw new Error('User must be logged in');
    return addDoc(collection(firestore, 'users', user.uid, 'interviewPreps'), {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return {
    interviewPreps,
    isLoading,
    error,
    saveInterviewPrep,
  };
}
export function useUserUsage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const usageRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'main');
  }, [user, firestore]);

  const [usage, setUsage] = useState<any>(null);
  const [plan, setPlan] = useState<UserPlan>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Fetch user doc for plan
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlan(docSnap.data().plan || 'free');
      }
    });

    // Fetch usage doc
    let unsubscribeUsage = () => {};
    if (usageRef) {
      unsubscribeUsage = onSnapshot(usageRef as any, (docSnap: any) => {
        if (docSnap.exists()) {
          setUsage(docSnap.data());
        }
      });
    }

    setIsLoading(false);
    return () => {
      unsubscribeUser();
      unsubscribeUsage();
    };
  }, [user, firestore, usageRef]);

  return { usage, plan, isLoading };
}
