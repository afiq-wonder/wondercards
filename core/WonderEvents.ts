/**
 * Official event contracts for WonderOS.
 *
 * This file contains event names and payload definitions only.
 * It must not contain runtime logic or import higher-level modules.
 *
 * This keeps the WonderOS event layer independent from:
 *
 * - Studio
 * - CLI
 * - Runtime
 * - Factory
 * - Analytics
 * - Cloud
 */

// =========================================================
// SHARED TYPES
// =========================================================

export type WonderEventIdentifier =
  string;

export type WonderEventTimestamp =
  string;

export type WonderContentType =
  | "story"
  | "mission"
  | "adventure";

export type WonderExportFormat =
  | "json"
  | "typescript";

export type WonderJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface WonderEventErrorPayload {
  message: string;

  code: string | null;

  details: Readonly<
    Record<string, unknown>
  >;
}

export interface WonderQualityScoreSummary {
  safety: number;

  ageMatch: number;

  educationalValue: number;

  creativity: number;

  clarity: number;

  emotionalQuality: number;

  offlinePlayValue: number;

  overall: number;
}

export interface WonderValidationCountSummary {
  totalDrafts: number;

  validDrafts: number;

  invalidDrafts: number;

  errorCount: number;

  warningCount: number;

  informationCount: number;

  averageOverallScore: number;
}

export interface WonderCatalogCountSummary {
  stories: number;

  missions: number;

  adventures: number;

  runtimeStories: number;

  runtimeMissions: number;
}

// =========================================================
// STUDIO EVENTS
// =========================================================

export interface WonderStudioBatchCreatedPayload {
  batchId: WonderEventIdentifier;

  contentType: WonderContentType;

  requestedQuantity: number;

  friendId: string;

  worldId: string;

  valueId: string;

  templateId: string;

  createdAt: WonderEventTimestamp;
}

export interface WonderStudioPromptCreatedPayload {
  batchId: WonderEventIdentifier;

  promptIds: string[];

  promptCount: number;

  expectedQuantity: number;

  outputPath: string | null;

  createdAt: WonderEventTimestamp;
}

export interface WonderStudioContentIngestedPayload {
  batchId: WonderEventIdentifier;

  importedDraftCount: number;

  skippedDraftCount: number;

  totalDraftCount: number;

  sourceModel: string | null;

  ingestedAt: WonderEventTimestamp;
}

export interface WonderStudioValidationStartedPayload {
  batchId: WonderEventIdentifier;

  draftCount: number;

  startedAt: WonderEventTimestamp;
}

export interface WonderStudioDraftValidatedPayload {
  batchId: WonderEventIdentifier;

  draftId: WonderEventIdentifier;

  valid: boolean;

  status:
    | "needs-review"
    | "rejected";

  scores: WonderQualityScoreSummary;

  errorCount: number;

  warningCount: number;

  validatedAt: WonderEventTimestamp;
}

export interface WonderStudioValidationCompletedPayload {
  batchId: WonderEventIdentifier;

  summary: WonderValidationCountSummary;

  reportPath: string | null;

  completedAt: WonderEventTimestamp;
}

export interface WonderStudioDraftApprovedPayload {
  batchId: WonderEventIdentifier;

  draftId: WonderEventIdentifier;

  approvedAt: WonderEventTimestamp;

  approvedBy: string | null;
}

export interface WonderStudioDraftRejectedPayload {
  batchId: WonderEventIdentifier;

  draftId: WonderEventIdentifier;

  reason: string | null;

  rejectedAt: WonderEventTimestamp;

  rejectedBy: string | null;
}

export interface WonderStudioImportCompletedPayload {
  batchId: WonderEventIdentifier;

  totalDrafts: number;

  totalImported: number;

  totalRejected: number;

  importedStories: number;

  importedMissions: number;

  importedAdventures: number;

  completedAt: WonderEventTimestamp;
}

export interface WonderStudioCatalogPublishedPayload {
  batchId: WonderEventIdentifier;

  packageId: WonderEventIdentifier;

  catalogName: string;

  version: number;

  destination: string;

  format: WonderExportFormat;

  counts: WonderCatalogCountSummary;

  catalogPath: string | null;

  manifestPath: string | null;

  publishedAt: WonderEventTimestamp;
}

export interface WonderStudioPipelineStartedPayload {
  batchId: WonderEventIdentifier;

  contentType: WonderContentType;

  requestedQuantity: number;

  startedAt: WonderEventTimestamp;
}

export interface WonderStudioPipelineCompletedPayload {
  batchId: WonderEventIdentifier;

  success: boolean;

  validation: WonderValidationCountSummary;

  importedCount: number;

  publishedCount: number;

  catalogPath: string | null;

  durationMilliseconds: number;

  completedAt: WonderEventTimestamp;
}

export interface WonderStudioPipelineFailedPayload {
  batchId: WonderEventIdentifier | null;

  stage:
    | "brief"
    | "prompt"
    | "ingestion"
    | "validation"
    | "approval"
    | "import"
    | "publication"
    | "export";

  error: WonderEventErrorPayload;

  failedAt: WonderEventTimestamp;
}

// =========================================================
// CLI EVENTS
// =========================================================

export interface WonderCLICommandStartedPayload {
  command:
    | "prompt"
    | "validate"
    | "publish"
    | "pipeline";

  workingDirectory: string;

  startedAt: WonderEventTimestamp;
}

export interface WonderCLICommandCompletedPayload {
  command:
    | "prompt"
    | "validate"
    | "publish"
    | "pipeline";

  success: boolean;

  durationMilliseconds: number;

  errorCount: number;

  warningCount: number;

  completedAt: WonderEventTimestamp;
}

export interface WonderCLIWorkspaceInitialisedPayload {
  rootDirectory: string;

  directories: string[];

  initialisedAt: WonderEventTimestamp;
}

export interface WonderCLIFileWrittenPayload {
  fileType:
    | "prompt"
    | "generated"
    | "draft"
    | "validation-report"
    | "catalog"
    | "manifest"
    | "pipeline-report";

  path: string;

  bytesWritten: number;

  overwritten: boolean;

  backupPath: string | null;

  writtenAt: WonderEventTimestamp;
}

// =========================================================
// FACTORY EVENTS
// =========================================================

export interface WonderFactoryJobQueuedPayload {
  jobId: WonderEventIdentifier;

  batchId: WonderEventIdentifier;

  jobType:
    | "generation"
    | "validation"
    | "repair"
    | "approval"
    | "publication"
    | "export";

  priority: number;

  queuedAt: WonderEventTimestamp;
}

export interface WonderFactoryJobStartedPayload {
  jobId: WonderEventIdentifier;

  batchId: WonderEventIdentifier;

  jobType:
    | "generation"
    | "validation"
    | "repair"
    | "approval"
    | "publication"
    | "export";

  workerId: WonderEventIdentifier;

  startedAt: WonderEventTimestamp;
}

export interface WonderFactoryJobProgressPayload {
  jobId: WonderEventIdentifier;

  batchId: WonderEventIdentifier;

  completedItems: number;

  totalItems: number;

  progressPercentage: number;

  message: string | null;

  updatedAt: WonderEventTimestamp;
}

export interface WonderFactoryJobCompletedPayload {
  jobId: WonderEventIdentifier;

  batchId: WonderEventIdentifier;

  workerId: WonderEventIdentifier;

  processedItems: number;

  durationMilliseconds: number;

  completedAt: WonderEventTimestamp;
}

export interface WonderFactoryJobFailedPayload {
  jobId: WonderEventIdentifier;

  batchId: WonderEventIdentifier;

  workerId: WonderEventIdentifier | null;

  error: WonderEventErrorPayload;

  retryCount: number;

  failedAt: WonderEventTimestamp;
}

export interface WonderFactoryDraftRepairRequestedPayload {
  jobId: WonderEventIdentifier;

  batchId: WonderEventIdentifier;

  draftId: WonderEventIdentifier;

  validationErrors: string[];

  repairAttempt: number;

  requestedAt: WonderEventTimestamp;
}

export interface WonderFactoryDraftRepairedPayload {
  jobId: WonderEventIdentifier;

  batchId: WonderEventIdentifier;

  originalDraftId: WonderEventIdentifier;

  repairedDraftId: WonderEventIdentifier;

  repairAttempt: number;

  repairedAt: WonderEventTimestamp;
}

// =========================================================
// RUNTIME EVENTS
// =========================================================

export interface WonderRuntimeCardCreatedPayload {
  cardId: WonderEventIdentifier;

  genomeId: WonderEventIdentifier;

  friendId: string;

  worldId: string;

  valueId: string;

  templateId: string;

  createdAt: WonderEventTimestamp;
}

export interface WonderRuntimeSessionStartedPayload {
  sessionId: WonderEventIdentifier;

  cardId: WonderEventIdentifier;

  genomeId: WonderEventIdentifier;

  startedAt: WonderEventTimestamp;
}

export interface WonderRuntimeSessionStepChangedPayload {
  sessionId: WonderEventIdentifier;

  previousStep: number;

  currentStep: number;

  totalSteps: number;

  changedAt: WonderEventTimestamp;
}

export interface WonderRuntimeWonderScoreChangedPayload {
  sessionId: WonderEventIdentifier;

  previousScore: number;

  currentScore: number;

  difference: number;

  changedAt: WonderEventTimestamp;
}

export interface WonderRuntimeSessionCompletedPayload {
  sessionId: WonderEventIdentifier;

  cardId: WonderEventIdentifier;

  genomeId: WonderEventIdentifier;

  wonderScore: number;

  durationMilliseconds: number;

  completedAt: WonderEventTimestamp;
}

// =========================================================
// MEMORY EVENTS
// =========================================================

export interface WonderMemoryAdventureRecordedPayload {
  memoryId: WonderEventIdentifier;

  familyId: WonderEventIdentifier;

  adventureId: WonderEventIdentifier;

  sessionId: WonderEventIdentifier | null;

  cardId: WonderEventIdentifier;

  completedAdventures: number;

  totalWonderScore: number;

  recordedAt: WonderEventTimestamp;
}

export interface WonderMemoryFriendshipLevelChangedPayload {
  familyId: WonderEventIdentifier;

  previousLevel: number;

  currentLevel: number;

  adventureCount: number;

  changedAt: WonderEventTimestamp;
}

export interface WonderMemoryStreakChangedPayload {
  familyId: WonderEventIdentifier;

  previousStreak: number;

  currentStreak: number;

  changedAt: WonderEventTimestamp;
}

// =========================================================
// ANALYTICS EVENTS
// =========================================================

export interface WonderAnalyticsMetricRecordedPayload {
  metric: string;

  value: number;

  unit: string | null;

  dimensions: Readonly<
    Record<string, string | number | boolean>
  >;

  recordedAt: WonderEventTimestamp;
}

export interface WonderAnalyticsContentPerformancePayload {
  contentId: WonderEventIdentifier;

  contentType: WonderContentType;

  impressions: number;

  starts: number;

  completions: number;

  completionRate: number;

  averageWonderScore: number;

  measuredAt: WonderEventTimestamp;
}

// =========================================================
// CLOUD EVENTS
// =========================================================

export interface WonderCloudSyncStartedPayload {
  syncId: WonderEventIdentifier;

  resourceType:
    | "catalog"
    | "batch"
    | "memory"
    | "analytics";

  resourceId: WonderEventIdentifier;

  startedAt: WonderEventTimestamp;
}

export interface WonderCloudSyncCompletedPayload {
  syncId: WonderEventIdentifier;

  resourceType:
    | "catalog"
    | "batch"
    | "memory"
    | "analytics";

  resourceId: WonderEventIdentifier;

  uploadedBytes: number;

  durationMilliseconds: number;

  completedAt: WonderEventTimestamp;
}

export interface WonderCloudSyncFailedPayload {
  syncId: WonderEventIdentifier;

  resourceType:
    | "catalog"
    | "batch"
    | "memory"
    | "analytics";

  resourceId: WonderEventIdentifier;

  error: WonderEventErrorPayload;

  failedAt: WonderEventTimestamp;
}

// =========================================================
// OFFICIAL EVENT MAP
// =========================================================

export interface WonderOSEventMap {
  "studio:batch-created":
    WonderStudioBatchCreatedPayload;

  "studio:prompt-created":
    WonderStudioPromptCreatedPayload;

  "studio:content-ingested":
    WonderStudioContentIngestedPayload;

  "studio:validation-started":
    WonderStudioValidationStartedPayload;

  "studio:draft-validated":
    WonderStudioDraftValidatedPayload;

  "studio:validation-completed":
    WonderStudioValidationCompletedPayload;

  "studio:draft-approved":
    WonderStudioDraftApprovedPayload;

  "studio:draft-rejected":
    WonderStudioDraftRejectedPayload;

  "studio:import-completed":
    WonderStudioImportCompletedPayload;

  "studio:catalog-published":
    WonderStudioCatalogPublishedPayload;

  "studio:pipeline-started":
    WonderStudioPipelineStartedPayload;

  "studio:pipeline-completed":
    WonderStudioPipelineCompletedPayload;

  "studio:pipeline-failed":
    WonderStudioPipelineFailedPayload;

  "cli:command-started":
    WonderCLICommandStartedPayload;

  "cli:command-completed":
    WonderCLICommandCompletedPayload;

  "cli:workspace-initialised":
    WonderCLIWorkspaceInitialisedPayload;

  "cli:file-written":
    WonderCLIFileWrittenPayload;

  "factory:job-queued":
    WonderFactoryJobQueuedPayload;

  "factory:job-started":
    WonderFactoryJobStartedPayload;

  "factory:job-progress":
    WonderFactoryJobProgressPayload;

  "factory:job-completed":
    WonderFactoryJobCompletedPayload;

  "factory:job-failed":
    WonderFactoryJobFailedPayload;

  "factory:draft-repair-requested":
    WonderFactoryDraftRepairRequestedPayload;

  "factory:draft-repaired":
    WonderFactoryDraftRepairedPayload;

  "runtime:card-created":
    WonderRuntimeCardCreatedPayload;

  "runtime:session-started":
    WonderRuntimeSessionStartedPayload;

  "runtime:session-step-changed":
    WonderRuntimeSessionStepChangedPayload;

  "runtime:wonder-score-changed":
    WonderRuntimeWonderScoreChangedPayload;

  "runtime:session-completed":
    WonderRuntimeSessionCompletedPayload;

  "memory:adventure-recorded":
    WonderMemoryAdventureRecordedPayload;

  "memory:friendship-level-changed":
    WonderMemoryFriendshipLevelChangedPayload;

  "memory:streak-changed":
    WonderMemoryStreakChangedPayload;

  "analytics:metric-recorded":
    WonderAnalyticsMetricRecordedPayload;

  "analytics:content-performance":
    WonderAnalyticsContentPerformancePayload;

  "cloud:sync-started":
    WonderCloudSyncStartedPayload;

  "cloud:sync-completed":
    WonderCloudSyncCompletedPayload;

  "cloud:sync-failed":
    WonderCloudSyncFailedPayload;
}

// =========================================================
// EVENT NAMES
// =========================================================

export const WONDER_EVENT_NAMES = [
  "studio:batch-created",
  "studio:prompt-created",
  "studio:content-ingested",
  "studio:validation-started",
  "studio:draft-validated",
  "studio:validation-completed",
  "studio:draft-approved",
  "studio:draft-rejected",
  "studio:import-completed",
  "studio:catalog-published",
  "studio:pipeline-started",
  "studio:pipeline-completed",
  "studio:pipeline-failed",

  "cli:command-started",
  "cli:command-completed",
  "cli:workspace-initialised",
  "cli:file-written",

  "factory:job-queued",
  "factory:job-started",
  "factory:job-progress",
  "factory:job-completed",
  "factory:job-failed",
  "factory:draft-repair-requested",
  "factory:draft-repaired",

  "runtime:card-created",
  "runtime:session-started",
  "runtime:session-step-changed",
  "runtime:wonder-score-changed",
  "runtime:session-completed",

  "memory:adventure-recorded",
  "memory:friendship-level-changed",
  "memory:streak-changed",

  "analytics:metric-recorded",
  "analytics:content-performance",

  "cloud:sync-started",
  "cloud:sync-completed",
  "cloud:sync-failed",
] as const satisfies readonly (
  keyof WonderOSEventMap
)[];

export type WonderOSEventName =
  typeof WONDER_EVENT_NAMES[number];

// =========================================================
// EVENT GROUPS
// =========================================================

export const WONDER_STUDIO_EVENT_NAMES =
  WONDER_EVENT_NAMES.filter(
    (
      eventName
    ): eventName is Extract<
      WonderOSEventName,
      `studio:${string}`
    > =>
      eventName.startsWith(
        "studio:"
      )
  );

export const WONDER_CLI_EVENT_NAMES =
  WONDER_EVENT_NAMES.filter(
    (
      eventName
    ): eventName is Extract<
      WonderOSEventName,
      `cli:${string}`
    > =>
      eventName.startsWith(
        "cli:"
      )
  );

export const WONDER_FACTORY_EVENT_NAMES =
  WONDER_EVENT_NAMES.filter(
    (
      eventName
    ): eventName is Extract<
      WonderOSEventName,
      `factory:${string}`
    > =>
      eventName.startsWith(
        "factory:"
      )
  );

export const WONDER_RUNTIME_EVENT_NAMES =
  WONDER_EVENT_NAMES.filter(
    (
      eventName
    ): eventName is Extract<
      WonderOSEventName,
      `runtime:${string}`
    > =>
      eventName.startsWith(
        "runtime:"
      )
  );

export const WONDER_MEMORY_EVENT_NAMES =
  WONDER_EVENT_NAMES.filter(
    (
      eventName
    ): eventName is Extract<
      WonderOSEventName,
      `memory:${string}`
    > =>
      eventName.startsWith(
        "memory:"
      )
  );

export const WONDER_ANALYTICS_EVENT_NAMES =
  WONDER_EVENT_NAMES.filter(
    (
      eventName
    ): eventName is Extract<
      WonderOSEventName,
      `analytics:${string}`
    > =>
      eventName.startsWith(
        "analytics:"
      )
  );

export const WONDER_CLOUD_EVENT_NAMES =
  WONDER_EVENT_NAMES.filter(
    (
      eventName
    ): eventName is Extract<
      WonderOSEventName,
      `cloud:${string}`
    > =>
      eventName.startsWith(
        "cloud:"
      )
  );

// =========================================================
// TYPE GUARDS
// =========================================================

export function isWonderOSEventName(
  value: unknown
): value is WonderOSEventName {
  return (
    typeof value === "string" &&
    (
      WONDER_EVENT_NAMES as
        readonly string[]
    ).includes(value)
  );
}

export function isWonderStudioEventName(
  value: unknown
): value is Extract<
  WonderOSEventName,
  `studio:${string}`
> {
  return (
    isWonderOSEventName(value) &&
    value.startsWith(
      "studio:"
    )
  );
}

export function isWonderCLIEventName(
  value: unknown
): value is Extract<
  WonderOSEventName,
  `cli:${string}`
> {
  return (
    isWonderOSEventName(value) &&
    value.startsWith(
      "cli:"
    )
  );
}

export function isWonderFactoryEventName(
  value: unknown
): value is Extract<
  WonderOSEventName,
  `factory:${string}`
> {
  return (
    isWonderOSEventName(value) &&
    value.startsWith(
      "factory:"
    )
  );
}

export function isWonderRuntimeEventName(
  value: unknown
): value is Extract<
  WonderOSEventName,
  `runtime:${string}`
> {
  return (
    isWonderOSEventName(value) &&
    value.startsWith(
      "runtime:"
    )
  );
}

// =========================================================
// DEFAULT TYPED EVENT BUS FACTORY
// =========================================================

import {
  WonderEventBus,
} from "./WonderEventBus";

export type WonderOSEventBus =
  WonderEventBus<WonderOSEventMap>;

export function createWonderOSEventBus(): WonderOSEventBus {
  return new WonderEventBus<WonderOSEventMap>({
    captureHistory: true,

    maximumHistory: 500,

    defaultDispatchMode:
      "sequential",

    stopOnError: false,
  });
}

export const wonderOSEventBus =
  createWonderOSEventBus();

export default wonderOSEventBus;