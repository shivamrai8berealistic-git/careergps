export type RouteStyle = 'fastest' | 'highest_success' | 'highest_salary' | 'lowest_effort' | 'fast_career_switch';

export type RouteHealth = 'on_track' | 'accelerating' | 'delayed' | 'blocked';

export type ChapterStatus = 'pending' | 'in_progress' | 'done';

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'expired';

export interface Route {
  id: string;
  userId: string;
  routeStyle: RouteStyle;
  blueprintId: string;
  currentPosition: {
    title: string;
    company?: string;
    skills: string[];
    yearsExp?: number;
  };
  targetPosition: {
    jobId?: string;
    title: string;
    company?: string;
  };
  estimatedWeeks: number;
  routeConfidence: number; // 0-100
  routeHealth: RouteHealth;
  totalCheckpoints: number;
  completedCheckpoints: number;
  isActive: boolean;
  selectedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RouteCheckpoint {
  id: string;
  routeId: string;
  userId: string;
  title: string;
  order: number;
  skillCategory: string;
  estimatedWeeks: number;
  readinessScore: number; // 0-100
  status: 'locked' | 'active' | 'completed';
  dependencies: string[]; // checkpointIds
  totalModules: number;
  completedModules: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RouteModule {
  id: string;
  routeId: string;
  checkpointId: string;
  userId: string;
  title: string;
  order: number;
  progress: number; // 0-100
  totalChapters: number;
  completedChapters: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PreparationType = 'platform_tool' | 'video' | 'article' | 'ai_summary' | 'practice';

export interface Preparation {
  type: PreparationType;
  url?: string;
  toolId?: string;
  summary: string;
  relevantSections?: string;
  estimatedMins: number;
  lastVerifiedAt: Date | string;
}

export interface ValidationResult {
  method: string;
  passed?: boolean;
  confidence?: number; // 0-100
  strengths?: string[];
  gaps?: string[];
  recommendation?: string;
  responses?: any;
  completedAt?: Date | string;
  bypassed?: boolean;
}

export interface RouteChapter {
  id: string;
  routeId: string;
  checkpointId: string;
  moduleId: string;
  userId: string;
  title: string;
  order: number;
  skillTag: string;
  status: ChapterStatus;
  preparation: Preparation;
  validation: ValidationResult;
  notes: string;
  freshnessStatus: FreshnessStatus;
  lastValidatedAt?: Date | string;
  completedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Knowledge Graph Types

export interface SeedQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'free_text' | 'scenario';
  options?: string[];                    // For multiple_choice
  correctAnswer?: string;               // For objective grading
  evaluationRubric?: string;            // For free_text / scenario grading
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ChapterTemplate {
  id: string;
  title: string;
  skillTag: string;
  validationMethod: string;
  estimatedMins: number;
  preparationHints: {
    preferredContentType: PreparationType;
    keyTopics: string[];
  };
  seedQuestions?: SeedQuestion[];        // Curated question bank for hybrid validation
}

export interface ModuleTemplate {
  id: string;
  title: string;
  isOptional: boolean;
  chapterTemplates: ChapterTemplate[];
}

export interface CheckpointTemplate {
  id: string;
  title: string;
  skillCategory: string;
  isOptional: boolean;
  dependencies: string[]; // IDs of other checkpoint templates
  estimatedWeeks: number;
  moduleTemplates: ModuleTemplate[];
}

export interface RoleBlueprint {
  id: string;
  metadata: {
    title: string;
    industry: string;
    level: string; // junior, mid, senior, etc.
    avgSalaryRange: string;
  };
  prerequisites: string[];
  checkpointTemplates: CheckpointTemplate[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
