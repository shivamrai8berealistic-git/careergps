export type UserPlan = 'free' | 'pro';

export type AIAction = 
  | 'resumeRewrite' 
  | 'careerStreamMap'
  | 'voiceInterview'
  | 'coverLetter'
  | 'interviewPrep'
  | 'deepSkillAnalysis'
  | 'linkedinOptimize'
  | 'chatMessage'
  | 'salaryInsights'
  | 'resumeParse' // 0 credits
  | 'jobAnalysis'; // 0 credits for basic

export const CREDIT_COSTS: Record<AIAction, number> = {
  resumeRewrite: 5,
  careerStreamMap: 5,
  voiceInterview: 4,
  coverLetter: 3,
  interviewPrep: 3,
  deepSkillAnalysis: 2,
  linkedinOptimize: 2,
  chatMessage: 1,
  salaryInsights: 1,
  resumeParse: 0,
  jobAnalysis: 0, 
};

export const INITIAL_FREE_CREDITS = 20;
export const MONTHLY_FREE_CREDITS = 5;
export const PRO_MONTHLY_CREDITS = 500;

export const QUOTA_LIMITS = {
  free: {
    jobAnalyses: 5,
    credits: INITIAL_FREE_CREDITS,
  },
  pro: {
    jobAnalyses: 100,
    credits: PRO_MONTHLY_CREDITS,
  },
};

