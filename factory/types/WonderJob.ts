import type {
    WonderJobStatus,
  } from "@/core/WonderEvents";
  
  export type WonderJobType =
    | "generation"
    | "validation"
    | "repair"
    | "approval"
    | "publication"
    | "export";
  
  export type WonderJobPriority =
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10;
  
  export type WonderJobFailureStrategy =
    | "retry"
    | "fail"
    | "manual-review";
  
  export type WonderJobProgressStatus =
    | "pending"
    | "running"
    | "completed"
    | "failed";
  
  export interface WonderJobProgress {
    completedItems: number;
  
    totalItems: number;
  
    percentage: number;
  
    message: string | null;
  
    status: WonderJobProgressStatus;
  
    updatedAt: Date;
  }
  
  export interface WonderJobError {
    message: string;
  
    code: string | null;
  
    retryable: boolean;
  
    details: Record<
      string,
      unknown
    >;
  
    occurredAt: Date;
  }
  
  export interface WonderJobAttempt {
    attemptNumber: number;
  
    workerId: string | null;
  
    startedAt: Date;
  
    completedAt: Date | null;
  
    durationMilliseconds: number | null;
  
    success: boolean | null;
  
    error: WonderJobError | null;
  }
  
  export interface WonderJobLock {
    workerId: string;
  
    lockedAt: Date;
  
    expiresAt: Date;
  }
  
  export interface WonderJobMetadata {
    source: string | null;
  
    tags: string[];
  
    correlationId: string | null;
  
    parentJobId: string | null;
  
    createdBy: string | null;
  
    values: Record<
      string,
      unknown
    >;
  }
  
  export interface WonderJob<
    TPayload = unknown,
    TResult = unknown
  > {
    id: string;
  
    batchId: string;
  
    type: WonderJobType;
  
    status: WonderJobStatus;
  
    priority: WonderJobPriority;
  
    payload: TPayload;
  
    result: TResult | null;
  
    progress: WonderJobProgress;
  
    attemptCount: number;
  
    maximumAttempts: number;
  
    attempts: WonderJobAttempt[];
  
    failureStrategy: WonderJobFailureStrategy;
  
    lastError: WonderJobError | null;
  
    lock: WonderJobLock | null;
  
    scheduledAt: Date;
  
    retryAt: Date | null;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    startedAt: Date | null;
  
    completedAt: Date | null;
  
    cancelledAt: Date | null;
  
    metadata: WonderJobMetadata;
  }
  
  export interface WonderJobCreateInput<
    TPayload = unknown
  > {
    id?: string;
  
    batchId: string;
  
    type: WonderJobType;
  
    payload: TPayload;
  
    priority?: WonderJobPriority;
  
    totalItems?: number;
  
    maximumAttempts?: number;
  
    failureStrategy?: WonderJobFailureStrategy;
  
    scheduledAt?: Date;
  
    metadata?: Partial<
      WonderJobMetadata
    >;
  }
  
  export interface WonderJobFailureInput {
    message: string;
  
    code?: string | null;
  
    retryable?: boolean;
  
    details?: Record<
      string,
      unknown
    >;
  
    occurredAt?: Date;
  }
  
  export interface WonderJobRetryOptions {
    retryAt?: Date;
  
    delayMilliseconds?: number;
  
    resetProgress?: boolean;
  }
  
  export interface WonderJobProgressUpdate {
    completedItems?: number;
  
    totalItems?: number;
  
    message?: string | null;
  
    status?: WonderJobProgressStatus;
  }
  
  export interface WonderJobValidationResult {
    valid: boolean;
  
    errors: string[];
  }
  
  const DEFAULT_PRIORITY: WonderJobPriority =
    5;
  
  const DEFAULT_MAXIMUM_ATTEMPTS = 3;
  
  const DEFAULT_LOCK_DURATION_MILLISECONDS =
    5 * 60 * 1000;
  
  const MAXIMUM_ATTEMPTS = 100;
  
  const MAXIMUM_TOTAL_ITEMS = 1_000_000;
  
  /**
   * Creates a new queued Wonder Factory job.
   */
  export function createWonderJob<
    TPayload
  >(
    input: WonderJobCreateInput<TPayload>
  ): WonderJob<TPayload, never> {
    const now = new Date();
  
    const batchId =
      normaliseRequiredText(
        input.batchId,
        "batchId"
      );
  
    const totalItems =
      clampInteger(
        input.totalItems ?? 1,
        0,
        MAXIMUM_TOTAL_ITEMS
      );
  
    const scheduledAt =
      cloneValidDate(
        input.scheduledAt,
        now
      );
  
    const id =
      normaliseOptionalText(
        input.id
      ) ??
      createWonderJobId({
        batchId,
  
        type:
          input.type,
  
        createdAt:
          now,
      });
  
    const job: WonderJob<
      TPayload,
      never
    > = {
      id,
  
      batchId,
  
      type:
        input.type,
  
      status:
        "queued",
  
      priority:
        input.priority ??
        DEFAULT_PRIORITY,
  
      payload:
        input.payload,
  
      result: null,
  
      progress:
        createInitialProgress(
          totalItems,
          now
        ),
  
      attemptCount: 0,
  
      maximumAttempts:
        clampInteger(
          input.maximumAttempts ??
            DEFAULT_MAXIMUM_ATTEMPTS,
          1,
          MAXIMUM_ATTEMPTS
        ),
  
      attempts: [],
  
      failureStrategy:
        input.failureStrategy ??
        "retry",
  
      lastError: null,
  
      lock: null,
  
      scheduledAt,
  
      retryAt: null,
  
      createdAt:
        new Date(
          now.getTime()
        ),
  
      updatedAt:
        new Date(
          now.getTime()
        ),
  
      startedAt: null,
  
      completedAt: null,
  
      cancelledAt: null,
  
      metadata:
        createJobMetadata(
          input.metadata
        ),
    };
  
    validateWonderJobOrThrow(
      job
    );
  
    return job;
  }
  
  /**
   * Creates a defensive copy of a Wonder job.
   */
  export function cloneWonderJob<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >
  ): WonderJob<
    TPayload,
    TResult
  > {
    return {
      ...job,
  
      progress: {
        ...job.progress,
  
        updatedAt:
          new Date(
            job.progress
              .updatedAt
              .getTime()
          ),
      },
  
      attempts:
        job.attempts.map(
          cloneWonderJobAttempt
        ),
  
      lastError:
        job.lastError
          ? cloneWonderJobError(
              job.lastError
            )
          : null,
  
      lock:
        job.lock
          ? {
              ...job.lock,
  
              lockedAt:
                new Date(
                  job.lock
                    .lockedAt
                    .getTime()
                ),
  
              expiresAt:
                new Date(
                  job.lock
                    .expiresAt
                    .getTime()
                ),
            }
          : null,
  
      scheduledAt:
        new Date(
          job.scheduledAt.getTime()
        ),
  
      retryAt:
        job.retryAt
          ? new Date(
              job.retryAt.getTime()
            )
          : null,
  
      createdAt:
        new Date(
          job.createdAt.getTime()
        ),
  
      updatedAt:
        new Date(
          job.updatedAt.getTime()
        ),
  
      startedAt:
        job.startedAt
          ? new Date(
              job.startedAt.getTime()
            )
          : null,
  
      completedAt:
        job.completedAt
          ? new Date(
              job.completedAt.getTime()
            )
          : null,
  
      cancelledAt:
        job.cancelledAt
          ? new Date(
              job.cancelledAt.getTime()
            )
          : null,
  
      metadata: {
        ...job.metadata,
  
        tags: [
          ...job.metadata.tags,
        ],
  
        values: {
          ...job.metadata.values,
        },
      },
    };
  }
  
  /**
   * Assigns and locks a queued job to one worker.
   */
  export function assignWonderJob<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >,
    workerId: string,
    lockDurationMilliseconds =
      DEFAULT_LOCK_DURATION_MILLISECONDS
  ): WonderJob<
    TPayload,
    TResult
  > {
    assertJobCanBeAssigned(job);
  
    const now = new Date();
  
    const cleanWorkerId =
      normaliseRequiredText(
        workerId,
        "workerId"
      );
  
    const duration =
      Math.max(
        1,
        Math.floor(
          lockDurationMilliseconds
        )
      );
  
    return {
      ...cloneWonderJob(job),
  
      lock: {
        workerId:
          cleanWorkerId,
  
        lockedAt:
          new Date(
            now.getTime()
          ),
  
        expiresAt:
          new Date(
            now.getTime() +
              duration
          ),
      },
  
      updatedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  /**
   * Removes the current worker lock.
   */
  export function releaseWonderJobLock<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >
  ): WonderJob<
    TPayload,
    TResult
  > {
    return {
      ...cloneWonderJob(job),
  
      lock: null,
  
      updatedAt:
        new Date(),
    };
  }
  
  /**
   * Starts a queued job and opens a new attempt.
   */
  export function startWonderJob<
  TPayload,
  TResult
>(
  job: WonderJob<
    TPayload,
    TResult
  >,
  workerId?: string
): WonderJob<
  TPayload,
  TResult
> {
  if (
    job.status !== "queued"
  ) {
    throw new Error(
      `WonderJob: job "${job.id}" cannot start from status "${job.status}".`
    );
  }

  const now =
    new Date();

  if (
    job.scheduledAt.getTime() >
    now.getTime()
  ) {
    throw new Error(
      `WonderJob: job "${job.id}" is not ready to run.`
    );
  }

  if (
    job.retryAt &&
    job.retryAt.getTime() >
      now.getTime()
  ) {
    throw new Error(
      `WonderJob: job "${job.id}" is waiting for its retry time.`
    );
  }

  if (
    job.attemptCount >=
    job.maximumAttempts
  ) {
    throw new Error(
      `WonderJob: job "${job.id}" has reached its maximum attempt count.`
    );
  }

  const requestedWorkerId =
    normaliseOptionalText(
      workerId
    );

  const lockIsActive =
    job.lock !== null &&
    job.lock.expiresAt.getTime() >
      now.getTime();

  if (
    lockIsActive &&
    requestedWorkerId !== null &&
    job.lock?.workerId !==
      requestedWorkerId
  ) {
    throw new Error(
      `WonderJob: job "${job.id}" is locked by worker "${job.lock?.workerId}".`
    );
  }

  const assignedWorkerId =
    requestedWorkerId ??
    (
      lockIsActive
        ? job.lock?.workerId ??
          null
        : null
    );

  const attemptNumber =
    job.attemptCount + 1;

  const attempt: WonderJobAttempt = {
    attemptNumber,

    workerId:
      assignedWorkerId,

    startedAt:
      new Date(
        now.getTime()
      ),

    completedAt: null,

    durationMilliseconds:
      null,

    success: null,

    error: null,
  };

  return {
    ...cloneWonderJob(job),

    status:
      "processing",

    progress: {
      ...job.progress,

      status:
        "running",

      message:
        job.progress.message ??
        "Job processing started.",

      updatedAt:
        new Date(
          now.getTime()
        ),
    },

    attemptCount:
      attemptNumber,

    attempts: [
      ...job.attempts.map(
        cloneWonderJobAttempt
      ),

      attempt,
    ],

    lock:
      lockIsActive
        ? job.lock
          ? {
              workerId:
                job.lock.workerId,

              lockedAt:
                new Date(
                  job.lock
                    .lockedAt
                    .getTime()
                ),

              expiresAt:
                new Date(
                  job.lock
                    .expiresAt
                    .getTime()
                ),
            }
          : null
        : null,

    startedAt:
      job.startedAt ??
      new Date(
        now.getTime()
      ),

    completedAt: null,

    cancelledAt: null,

    retryAt: null,

    lastError: null,

    updatedAt:
      new Date(
        now.getTime()
      ),
  };
}
  
  /**
   * Updates job progress while it is processing.
   */
  export function updateWonderJobProgress<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >,
    update: WonderJobProgressUpdate
  ): WonderJob<
    TPayload,
    TResult
  > {
    if (
      job.status !==
      "processing"
    ) {
      throw new Error(
        `WonderJob: progress cannot be updated while job "${job.id}" has status "${job.status}".`
      );
    }
  
    const now = new Date();
  
    const totalItems =
      clampInteger(
        update.totalItems ??
          job.progress.totalItems,
        0,
        MAXIMUM_TOTAL_ITEMS
      );
  
    const completedItems =
      clampInteger(
        update.completedItems ??
          job.progress.completedItems,
        0,
        Math.max(
          totalItems,
          0
        )
      );
  
    return {
      ...cloneWonderJob(job),
  
      progress: {
        completedItems,
  
        totalItems,
  
        percentage:
          calculateWonderJobProgress(
            completedItems,
            totalItems
          ),
  
        message:
          update.message ===
          undefined
            ? job.progress.message
            : normaliseOptionalText(
                update.message
              ),
  
        status:
          update.status ??
          job.progress.status,
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      },
  
      updatedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  /**
   * Completes a processing job successfully.
   */
  export function completeWonderJob<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >,
    result: TResult
  ): WonderJob<
    TPayload,
    TResult
  > {
    if (
      job.status !==
      "processing"
    ) {
      throw new Error(
        `WonderJob: job "${job.id}" cannot complete from status "${job.status}".`
      );
    }
  
    const now = new Date();
  
    const attempts =
      completeLatestAttempt(
        job.attempts,
        now,
        true,
        null
      );
  
    return {
      ...cloneWonderJob(job),
  
      status:
        "completed",
  
      result,
  
      progress: {
        completedItems:
          job.progress
            .totalItems,
  
        totalItems:
          job.progress
            .totalItems,
  
        percentage:
          100,
  
        message:
          "Job completed successfully.",
  
        status:
          "completed",
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      },
  
      attempts,
  
      completedAt:
        new Date(
          now.getTime()
        ),
  
      cancelledAt: null,
  
      retryAt: null,
  
      lock: null,
  
      lastError: null,
  
      updatedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  /**
   * Marks a processing job as failed.
   */
  export function failWonderJob<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >,
    failure: WonderJobFailureInput
  ): WonderJob<
    TPayload,
    TResult
  > {
    if (
      job.status !==
        "processing" &&
      job.status !==
        "queued"
    ) {
      throw new Error(
        `WonderJob: job "${job.id}" cannot fail from status "${job.status}".`
      );
    }
  
    const now =
      cloneValidDate(
        failure.occurredAt,
        new Date()
      );
  
    const error =
      createWonderJobError(
        failure,
        now
      );
  
    const attempts =
      job.status ===
        "processing"
        ? completeLatestAttempt(
            job.attempts,
            now,
            false,
            error
          )
        : job.attempts.map(
            cloneWonderJobAttempt
          );
  
    return {
      ...cloneWonderJob(job),
  
      status:
        "failed",
  
      progress: {
        ...job.progress,
  
        message:
          error.message,
  
        status:
          "failed",
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      },
  
      attempts,
  
      completedAt:
        new Date(
          now.getTime()
        ),
  
      retryAt: null,
  
      lock: null,
  
      lastError:
        cloneWonderJobError(
          error
        ),
  
      updatedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  /**
   * Queues a failed job for another attempt.
   */
  export function retryWonderJob<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >,
    options: WonderJobRetryOptions = {}
  ): WonderJob<
    TPayload,
    TResult
  > {
    if (
      job.status !== "failed"
    ) {
      throw new Error(
        `WonderJob: only failed jobs can be retried. Job "${job.id}" has status "${job.status}".`
      );
    }
  
    if (
      !canRetryWonderJob(job)
    ) {
      throw new Error(
        `WonderJob: job "${job.id}" cannot be retried.`
      );
    }
  
    const now = new Date();
  
    const retryAt =
      options.retryAt
        ? cloneValidDate(
            options.retryAt,
            now
          )
        : new Date(
            now.getTime() +
              Math.max(
                0,
                Math.floor(
                  options
                    .delayMilliseconds ??
                    0
                )
              )
          );
  
    const progress =
      options.resetProgress
        ? createInitialProgress(
            job.progress.totalItems,
            now
          )
        : {
            ...job.progress,
  
            status:
              "pending" as const,
  
            message:
              "Job queued for retry.",
  
            updatedAt:
              new Date(
                now.getTime()
              ),
          };
  
    return {
      ...cloneWonderJob(job),
  
      status:
        "queued",
  
      progress,
  
      result: null,
  
      retryAt,
  
      completedAt: null,
  
      cancelledAt: null,
  
      lock: null,
  
      updatedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  /**
   * Cancels a queued or processing job.
   */
  export function cancelWonderJob<
    TPayload,
    TResult
  >(
    job: WonderJob<
      TPayload,
      TResult
    >,
    reason?: string
  ): WonderJob<
    TPayload,
    TResult
  > {
    if (
      isTerminalWonderJob(job)
    ) {
      throw new Error(
        `WonderJob: terminal job "${job.id}" cannot be cancelled.`
      );
    }
  
    const now = new Date();
  
    const cleanReason =
      normaliseOptionalText(
        reason
      );
  
    const attempts =
      job.status ===
        "processing"
        ? completeLatestAttempt(
            job.attempts,
            now,
            false,
            {
              message:
                cleanReason ??
                "Job cancelled.",
  
              code:
                "JOB_CANCELLED",
  
              retryable: false,
  
              details: {},
  
              occurredAt:
                new Date(
                  now.getTime()
                ),
            }
          )
        : job.attempts.map(
            cloneWonderJobAttempt
          );
  
    return {
      ...cloneWonderJob(job),
  
      status:
        "cancelled",
  
      progress: {
        ...job.progress,
  
        message:
          cleanReason ??
          "Job cancelled.",
  
        status:
          "failed",
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      },
  
      attempts,
  
      cancelledAt:
        new Date(
          now.getTime()
        ),
  
      completedAt:
        new Date(
          now.getTime()
        ),
  
      retryAt: null,
  
      lock: null,
  
      updatedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  /**
   * Returns true when the job can be retried.
   */
  export function canRetryWonderJob(
    job: WonderJob<
      unknown,
      unknown
    >
  ): boolean {
    return (
      job.status === "failed" &&
      job.failureStrategy ===
        "retry" &&
      job.attemptCount <
        job.maximumAttempts &&
      job.lastError?.retryable !==
        false
    );
  }
  
  /**
   * Returns true when a queued job is ready to be processed.
   */
  export function isWonderJobReady(
    job: WonderJob<
      unknown,
      unknown
    >,
    at = new Date()
  ): boolean {
    if (
      job.status !== "queued"
    ) {
      return false;
    }
  
    if (
      job.attemptCount >=
      job.maximumAttempts
    ) {
      return false;
    }
  
    if (
      job.scheduledAt.getTime() >
      at.getTime()
    ) {
      return false;
    }
  
    if (
      job.retryAt &&
      job.retryAt.getTime() >
        at.getTime()
    ) {
      return false;
    }
  
    if (
      job.lock &&
      job.lock.expiresAt.getTime() >
        at.getTime()
    ) {
      return false;
    }
  
    return true;
  }
  
  /**
   * Returns true when a worker lock has expired.
   */
  export function isWonderJobLockExpired(
    job: WonderJob<
      unknown,
      unknown
    >,
    at = new Date()
  ): boolean {
    return (
      job.lock !== null &&
      job.lock.expiresAt.getTime() <=
        at.getTime()
    );
  }
  
  /**
   * Returns true when no further processing is expected.
   */
  export function isTerminalWonderJob(
    job: WonderJob<
      unknown,
      unknown
    >
  ): boolean {
    return (
      job.status ===
        "completed" ||
      job.status ===
        "failed" ||
      job.status ===
        "cancelled"
    );
  }
  
  /**
   * Calculates progress as a number between 0 and 100.
   */
  export function calculateWonderJobProgress(
    completedItems: number,
    totalItems: number
  ): number {
    if (
      totalItems <= 0
    ) {
      return completedItems > 0
        ? 100
        : 0;
    }
  
    return roundNumber(
      Math.min(
        100,
        Math.max(
          0,
          (
            completedItems /
            totalItems
          ) * 100
        )
      ),
      2
    );
  }
  
  /**
   * Validates a Wonder job.
   */
  export function validateWonderJob(
    job: WonderJob<
      unknown,
      unknown
    >
  ): WonderJobValidationResult {
    const errors: string[] = [];
  
    if (!hasText(job.id)) {
      errors.push(
        "Job ID is required."
      );
    }
  
    if (!hasText(job.batchId)) {
      errors.push(
        "Batch ID is required."
      );
    }
  
    if (
      !isWonderJobType(
        job.type
      )
    ) {
      errors.push(
        "Job type is invalid."
      );
    }
  
    if (
      !isWonderJobStatus(
        job.status
      )
    ) {
      errors.push(
        "Job status is invalid."
      );
    }
  
    if (
      !isWonderJobPriority(
        job.priority
      )
    ) {
      errors.push(
        "Job priority must be between 1 and 10."
      );
    }
  
    if (
      !Number.isInteger(
        job.attemptCount
      ) ||
      job.attemptCount < 0
    ) {
      errors.push(
        "Attempt count must be a non-negative integer."
      );
    }
  
    if (
      !Number.isInteger(
        job.maximumAttempts
      ) ||
      job.maximumAttempts < 1 ||
      job.maximumAttempts >
        MAXIMUM_ATTEMPTS
    ) {
      errors.push(
        `Maximum attempts must be between 1 and ${MAXIMUM_ATTEMPTS}.`
      );
    }
  
    if (
      job.attemptCount >
      job.maximumAttempts
    ) {
      errors.push(
        "Attempt count cannot exceed maximum attempts."
      );
    }
  
    if (
      job.attempts.length !==
      job.attemptCount
    ) {
      errors.push(
        "Attempt history count does not match attemptCount."
      );
    }
  
    if (
      !isValidDate(
        job.createdAt
      ) ||
      !isValidDate(
        job.updatedAt
      ) ||
      !isValidDate(
        job.scheduledAt
      )
    ) {
      errors.push(
        "Job contains an invalid required date."
      );
    }
  
    if (
      job.retryAt &&
      !isValidDate(
        job.retryAt
      )
    ) {
      errors.push(
        "Job retryAt is invalid."
      );
    }
  
    if (
      job.startedAt &&
      !isValidDate(
        job.startedAt
      )
    ) {
      errors.push(
        "Job startedAt is invalid."
      );
    }
  
    if (
      job.completedAt &&
      !isValidDate(
        job.completedAt
      )
    ) {
      errors.push(
        "Job completedAt is invalid."
      );
    }
  
    if (
      job.cancelledAt &&
      !isValidDate(
        job.cancelledAt
      )
    ) {
      errors.push(
        "Job cancelledAt is invalid."
      );
    }
  
    if (
      job.progress.completedItems <
        0 ||
      job.progress.totalItems <
        0 ||
      job.progress.completedItems >
        job.progress.totalItems
    ) {
      errors.push(
        "Job progress item counts are invalid."
      );
    }
  
    const expectedPercentage =
      calculateWonderJobProgress(
        job.progress.completedItems,
        job.progress.totalItems
      );
  
    if (
      Math.abs(
        expectedPercentage -
          job.progress.percentage
      ) > 0.01
    ) {
      errors.push(
        "Job progress percentage does not match completed and total items."
      );
    }
  
    if (
      job.status ===
        "completed" &&
      job.completedAt === null
    ) {
      errors.push(
        "Completed jobs require completedAt."
      );
    }
  
    if (
      job.status ===
        "processing" &&
      job.startedAt === null
    ) {
      errors.push(
        "Processing jobs require startedAt."
      );
    }
  
    if (
      job.status ===
        "cancelled" &&
      job.cancelledAt === null
    ) {
      errors.push(
        "Cancelled jobs require cancelledAt."
      );
    }
  
    return {
      valid:
        errors.length === 0,
  
      errors,
    };
  }
  
  /**
   * Throws when a job is invalid.
   */
  export function validateWonderJobOrThrow(
    job: WonderJob<
      unknown,
      unknown
    >
  ): void {
    const result =
      validateWonderJob(job);
  
    if (!result.valid) {
      throw new Error(
        [
          `WonderJob: job "${job.id}" is invalid.`,
          ...result.errors,
        ].join(" ")
      );
    }
  }
  
  // =========================================================
  // CREATION HELPERS
  // =========================================================
  
  function createInitialProgress(
    totalItems: number,
    createdAt: Date
  ): WonderJobProgress {
    return {
      completedItems: 0,
  
      totalItems,
  
      percentage: 0,
  
      message:
        "Waiting in queue.",
  
      status:
        "pending",
  
      updatedAt:
        new Date(
          createdAt.getTime()
        ),
    };
  }
  
  function createJobMetadata(
    metadata:
      | Partial<WonderJobMetadata>
      | undefined
  ): WonderJobMetadata {
    return {
      source:
        normaliseOptionalText(
          metadata?.source
        ),
  
      tags:
        uniqueStrings(
          metadata?.tags ??
            []
        ),
  
      correlationId:
        normaliseOptionalText(
          metadata?.correlationId
        ),
  
      parentJobId:
        normaliseOptionalText(
          metadata?.parentJobId
        ),
  
      createdBy:
        normaliseOptionalText(
          metadata?.createdBy
        ),
  
      values: {
        ...(metadata?.values ??
          {}),
      },
    };
  }
  
  function createWonderJobError(
    failure: WonderJobFailureInput,
    occurredAt: Date
  ): WonderJobError {
    return {
      message:
        normaliseRequiredText(
          failure.message,
          "failure.message"
        ),
  
      code:
        normaliseOptionalText(
          failure.code
        ),
  
      retryable:
        failure.retryable ??
        true,
  
      details: {
        ...(failure.details ??
          {}),
      },
  
      occurredAt:
        new Date(
          occurredAt.getTime()
        ),
    };
  }
  
  function createWonderJobId({
    batchId,
    type,
    createdAt,
  }: {
    batchId: string;
  
    type: WonderJobType;
  
    createdAt: Date;
  }): string {
    const readableBatchId =
      createSlug(
        batchId
      ) ||
      "batch";
  
    const hash =
      hashText(
        [
          batchId,
          type,
          createdAt.toISOString(),
          Math.random(),
        ].join(":")
      )
        .toString(36)
        .padStart(
          7,
          "0"
        );
  
    return [
      "wonder-job",
      type,
      readableBatchId,
      hash,
    ].join("-");
  }
  
  // =========================================================
  // ATTEMPT HELPERS
  // =========================================================
  
  function completeLatestAttempt(
    attempts:
      readonly WonderJobAttempt[],
    completedAt: Date,
    success: boolean,
    error: WonderJobError | null
  ): WonderJobAttempt[] {
    if (
      attempts.length === 0
    ) {
      return [];
    }
  
    return attempts.map(
      (
        attempt,
        index
      ) => {
        if (
          index !==
          attempts.length - 1
        ) {
          return cloneWonderJobAttempt(
            attempt
          );
        }
  
        const durationMilliseconds =
          Math.max(
            0,
            completedAt.getTime() -
              attempt.startedAt.getTime()
          );
  
        return {
          ...cloneWonderJobAttempt(
            attempt
          ),
  
          completedAt:
            new Date(
              completedAt.getTime()
            ),
  
          durationMilliseconds,
  
          success,
  
          error:
            error
              ? cloneWonderJobError(
                  error
                )
              : null,
        };
      }
    );
  }
  
  function cloneWonderJobAttempt(
    attempt: WonderJobAttempt
  ): WonderJobAttempt {
    return {
      ...attempt,
  
      startedAt:
        new Date(
          attempt.startedAt.getTime()
        ),
  
      completedAt:
        attempt.completedAt
          ? new Date(
              attempt.completedAt.getTime()
            )
          : null,
  
      error:
        attempt.error
          ? cloneWonderJobError(
              attempt.error
            )
          : null,
    };
  }
  
  function cloneWonderJobError(
    error: WonderJobError
  ): WonderJobError {
    return {
      ...error,
  
      details: {
        ...error.details,
      },
  
      occurredAt:
        new Date(
          error.occurredAt.getTime()
        ),
    };
  }
  
  // =========================================================
  // ASSIGNMENT HELPERS
  // =========================================================
  
  function assertJobCanBeAssigned(
    job: WonderJob<
      unknown,
      unknown
    >
  ): void {
    if (
      job.status !== "queued"
    ) {
      throw new Error(
        `WonderJob: only queued jobs can be assigned. Job "${job.id}" has status "${job.status}".`
      );
    }
  
    if (
      job.lock &&
      !isWonderJobLockExpired(
        job
      )
    ) {
      throw new Error(
        `WonderJob: job "${job.id}" is already locked by worker "${job.lock.workerId}".`
      );
    }
  }
  
  // =========================================================
  // TYPE GUARDS
  // =========================================================
  
  export function isWonderJobType(
    value: unknown
  ): value is WonderJobType {
    return (
      value ===
        "generation" ||
      value ===
        "validation" ||
      value === "repair" ||
      value === "approval" ||
      value ===
        "publication" ||
      value === "export"
    );
  }
  
  export function isWonderJobStatus(
    value: unknown
  ): value is WonderJobStatus {
    return (
      value === "queued" ||
      value ===
        "processing" ||
      value ===
        "completed" ||
      value === "failed" ||
      value === "cancelled"
    );
  }
  
  export function isWonderJobPriority(
    value: unknown
  ): value is WonderJobPriority {
    return (
      typeof value ===
        "number" &&
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 10
    );
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    if (
      typeof value !== "string"
    ) {
      throw new Error(
        `WonderJob: "${fieldName}" must be a string.`
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new Error(
        `WonderJob: "${fieldName}" is required.`
      );
    }
  
    return cleaned;
  }
  
  function normaliseOptionalText(
    value:
      | string
      | null
      | undefined
  ): string | null {
    if (
      typeof value !== "string"
    ) {
      return null;
    }
  
    const cleaned =
      value.trim();
  
    return cleaned.length > 0
      ? cleaned
      : null;
  }
  
  function uniqueStrings(
    values: readonly string[]
  ): string[] {
    return Array.from(
      new Set(
        values
          .map(
            (value) =>
              value.trim()
          )
          .filter(
            (value) =>
              value.length > 0
          )
      )
    );
  }
  
  function cloneValidDate(
    value:
      | Date
      | undefined,
    fallback: Date
  ): Date {
    return isValidDate(value)
      ? new Date(
          value.getTime()
        )
      : new Date(
          fallback.getTime()
        );
  }
  
  function isValidDate(
    value: unknown
  ): value is Date {
    return (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime()
      )
    );
  }
  
  function hasText(
    value: unknown
  ): value is string {
    return (
      typeof value ===
        "string" &&
      value.trim().length > 0
    );
  }
  
  function clampInteger(
    value: number,
    minimum: number,
    maximum: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
      return minimum;
    }
  
    return Math.min(
      maximum,
      Math.max(
        minimum,
        Math.floor(value)
      )
    );
  }
  
  function roundNumber(
    value: number,
    decimalPlaces: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
      return 0;
    }
  
    const multiplier =
      10 **
      Math.max(
        0,
        Math.floor(
          decimalPlaces
        )
      );
  
    return (
      Math.round(
        value * multiplier
      ) / multiplier
    );
  }
  
  function createSlug(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }
  
  function hashText(
    text: string
  ): number {
    let hash = 2166136261;
  
    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(index);
  
      hash =
        Math.imul(
          hash,
          16777619
        );
    }
  
    return hash >>> 0;
  }