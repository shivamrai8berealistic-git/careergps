/**
 * @fileOverview Central configuration for the credit wallet and economy.
 * All credit values, rewards, and feature costs should be defined here
 * so they can be easily adjusted by admins later.
 */

// -----------------------------------------------------------------------------
// Transaction Types (used in the ledger)
// -----------------------------------------------------------------------------
export type CreditTransactionType = 
  | 'signup'
  | 'monthly_recharge'
  | 'profile_completion'
  | 'resume_upload'
  | 'referral_signup'
  | 'referral_paid'
  | 'ad_reward'
  | 'success_story'
  | 'first_application_tracked'
  | 'feature_spend'
  | 'manual_adjustment';

// -----------------------------------------------------------------------------
// Earning Rules (Rewards)
// -----------------------------------------------------------------------------
export const CREDIT_REWARDS = {
  SIGNUP: 20,
  MONTHLY_RECHARGE: 5,
  PROFILE_COMPLETION_80_PERCENT: 5,
  RESUME_UPLOAD: 3,
  REFERRAL_SIGNUP: 10,
  REFERRAL_PAID: 30,
  AD_REWARD: 2,
  SUCCESS_STORY: 5,
  FIRST_APPLICATION_TRACKED: 2,
} as const;

// -----------------------------------------------------------------------------
// Spending Rules (Feature Costs)
// -----------------------------------------------------------------------------
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
  | 'jobFitAnalysis'
  | 'resumeParse' // Keeping free to build habit
  | 'jobAnalysis' // Keeping basic ATS score free
  | 'careerSimulator' // Premium feature
  | 'buildRoute' // Expensive blueprint routing
  | 'generateValidation'; // Custom chapter validation

export const CREDIT_COSTS: Record<AIAction, number> = {
  resumeRewrite: 5,
  careerStreamMap: 5,
  voiceInterview: 4,
  coverLetter: 3,
  interviewPrep: 3,
  deepSkillAnalysis: 2,
  jobFitAnalysis: 2,
  linkedinOptimize: 2,
  chatMessage: 1,
  salaryInsights: 1,
  resumeParse: 0,
  jobAnalysis: 0,
  careerSimulator: 20,
  buildRoute: 50,
  generateValidation: 10,
};

// -----------------------------------------------------------------------------
// Premium Benefits
// -----------------------------------------------------------------------------
export type UserPlan = 'free' | 'pro';

export const PREMIUM_BENEFITS = {
  MONTHLY_CREDITS: 500, // Premium users get a much higher monthly pool
  DISABLE_ADS: true,
  UNLOCK_AUTO_FOLLOWUP: true,
} as const;
