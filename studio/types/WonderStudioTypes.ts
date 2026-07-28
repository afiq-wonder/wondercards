export type WonderStudioContentType =
  | "story"
  | "mission"
  | "adventure";

export type WonderStudioDifficulty =
  | "easy"
  | "medium"
  | "hard";

export type WonderStudioDraftStatus =
  | "generated"
  | "validating"
  | "needs-review"
  | "approved"
  | "rejected"
  | "published";

export type WonderStudioValidationSeverity =
  | "info"
  | "warning"
  | "error";

export interface WonderStudioAgeRange {
  min: number;

  max: number;
}

export interface WonderStudioGenerationRequest {
  id: string;

  createdAt: Date;

  contentType: WonderStudioContentType;

  quantity: number;

  language: string;

  locale: string;

  friendId: string;

  worldId: string;

  valueId: string;

  templateId: string;

  ageRange: WonderStudioAgeRange;

  difficulty: WonderStudioDifficulty;

  duration: number;

  emotion?: string;

  location?: string;

  archetypeId?: string;

  titleDirection?: string;

  creativeDirection?: string;

  learningObjective?: string;

  requiredWords?: string[];

  bannedWords?: string[];

  tags?: string[];

  seed?: string;
}

export interface WonderStudioStoryContent {
  title: string;

  intro: string;

  problem: string;

  goal: string;

  closing: string;
}

export interface WonderStudioMissionContent {
  title: string;

  objective: string;

  activity: string;

  successMessage: string;

  supplies: string[];
}

export interface WonderStudioDraftMetadata {
  friendId: string;

  worldId: string;

  valueId: string;

  templateId: string;

  language: string;

  locale: string;

  ageRange: WonderStudioAgeRange;

  difficulty: WonderStudioDifficulty;

  duration: number;

  emotion: string;

  location: string;

  tags: string[];
}

export interface WonderStudioDraft {
  id: string;

  batchId: string;

  version: number;

  createdAt: Date;

  updatedAt: Date;

  status: WonderStudioDraftStatus;

  contentType: WonderStudioContentType;

  metadata: WonderStudioDraftMetadata;

  story: WonderStudioStoryContent | null;

  mission: WonderStudioMissionContent | null;

  sourcePrompt: string;

  sourceModel: string | null;

  validation: WonderStudioValidationResult | null;
}

export interface WonderStudioValidationIssue {
  id: string;

  rule: string;

  severity: WonderStudioValidationSeverity;

  field: string | null;

  message: string;

  suggestion: string | null;
}

export interface WonderStudioQualityScores {
  safety: number;

  ageMatch: number;

  educationalValue: number;

  creativity: number;

  clarity: number;

  emotionalQuality: number;

  offlinePlayValue: number;

  overall: number;
}

export interface WonderStudioValidationResult {
  valid: boolean;

  validatedAt: Date;

  issues: WonderStudioValidationIssue[];

  scores: WonderStudioQualityScores;
}

export interface WonderStudioBatch {
  id: string;

  createdAt: Date;

  updatedAt: Date;

  request: WonderStudioGenerationRequest;

  status:
    | "created"
    | "generating"
    | "validating"
    | "reviewing"
    | "completed"
    | "failed";

  drafts: WonderStudioDraft[];

  totalGenerated: number;

  totalValid: number;

  totalApproved: number;

  totalRejected: number;
}

export interface WonderStudioPrompt {
  id: string;

  batchId: string;

  createdAt: Date;

  system: string;

  user: string;

  expectedContentType: WonderStudioContentType;

  expectedQuantity: number;
}

export interface WonderStudioImportRecord {
  id: string;

  draftId: string;

  importedAt: Date;

  contentType: WonderStudioContentType;

  destination: string;

  success: boolean;

  message: string;
}

export interface WonderStudioPublishManifest {
  id: string;

  version: number;

  createdAt: Date;

  publishedAt: Date | null;

  status:
    | "draft"
    | "ready"
    | "published"
    | "failed";

  storyDraftIds: string[];

  missionDraftIds: string[];

  importRecords: WonderStudioImportRecord[];

  notes: string;
}

export interface WonderStudioCatalogCoverage {
  friendId: string;

  worldId: string;

  valueId: string;

  templateId: string;

  ageRange: WonderStudioAgeRange;

  availableStories: number;

  availableMissions: number;

  targetStories: number;

  targetMissions: number;

  missingStories: number;

  missingMissions: number;

  coveragePercentage: number;
}

export interface WonderStudioStatistics {
  totalDrafts: number;

  generatedDrafts: number;

  reviewDrafts: number;

  approvedDrafts: number;

  rejectedDrafts: number;

  publishedDrafts: number;

  averageQualityScore: number;

  validationPassRate: number;

  publicationRate: number;
}

export interface WonderStudioContentPackage {
  id: string;

  version: number;

  createdAt: Date;

  name: string;

  description: string;

  stories: WonderStudioDraft[];

  missions: WonderStudioDraft[];

  manifest: WonderStudioPublishManifest;
}

export function createEmptyQualityScores(): WonderStudioQualityScores {
  return {
    safety: 0,

    ageMatch: 0,

    educationalValue: 0,

    creativity: 0,

    clarity: 0,

    emotionalQuality: 0,

    offlinePlayValue: 0,

    overall: 0,
  };
}

export function createEmptyValidationResult(): WonderStudioValidationResult {
  return {
    valid: false,

    validatedAt: new Date(),

    issues: [],

    scores:
      createEmptyQualityScores(),
  };
}

export function createEmptyStudioStatistics(): WonderStudioStatistics {
  return {
    totalDrafts: 0,

    generatedDrafts: 0,

    reviewDrafts: 0,

    approvedDrafts: 0,

    rejectedDrafts: 0,

    publishedDrafts: 0,

    averageQualityScore: 0,

    validationPassRate: 0,

    publicationRate: 0,
  };
}