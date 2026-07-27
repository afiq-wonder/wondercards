import {
    assignWonderJob,
    calculateWonderJobProgress,
    cancelWonderJob,
    canRetryWonderJob,
    cloneWonderJob,
    completeWonderJob,
    createWonderJob,
    failWonderJob,
    isTerminalWonderJob,
    isWonderJobLockExpired,
    isWonderJobReady,
    releaseWonderJobLock,
    retryWonderJob,
    startWonderJob,
    updateWonderJobProgress,
    validateWonderJobOrThrow,
  } from "../types/WonderJob";
  
  import type {
    WonderJob,
    WonderJobCreateInput,
    WonderJobFailureInput,
    WonderJobPriority,
    WonderJobProgressUpdate,
    WonderJobRetryOptions,
    WonderJobType,
  } from "../types/WonderJob";
  
  import type {
    WonderJobStatus,
  } from "@/core/WonderEvents";
  
  import {
    wonderOSEventBus,
  } from "@/core/WonderEvents";
  
  import type {
    WonderOSEventBus,
  } from "@/core/WonderEvents";
  
  export interface WonderQueueOptions {
    /**
     * Maximum number of jobs stored in memory.
     */
    maximumJobs?: number;
  
    /**
     * Default worker lock duration.
     */
    defaultLockDurationMilliseconds?: number;
  
    /**
     * Automatically remove the oldest completed jobs when
     * the queue reaches maximum capacity.
     */
    pruneCompletedJobsWhenFull?: boolean;
  
    /**
     * Maximum number of completed jobs retained during pruning.
     */
    completedJobRetention?: number;
  
    /**
     * Emit WonderOS Factory events.
     */
    emitEvents?: boolean;
  }
  
  export interface WonderQueueClaimOptions {
    types?: readonly WonderJobType[];
  
    batchId?: string;
  
    minimumPriority?: WonderJobPriority;
  
    lockDurationMilliseconds?: number;
  
    now?: Date;
  }
  
  export interface WonderQueueListFilter {
    statuses?: readonly WonderJobStatus[];
  
    types?: readonly WonderJobType[];
  
    batchId?: string;
  
    workerId?: string;
  
    minimumPriority?: WonderJobPriority;
  
    maximumPriority?: WonderJobPriority;
  
    readyOnly?: boolean;
  
    terminalOnly?: boolean;
  
    includeExpiredLocks?: boolean;
  }
  
  export interface WonderQueueFailOptions {
    /**
     * Automatically queue the job for retry when allowed.
     */
    autoRetry?: boolean;
  
    /**
     * Retry configuration used when autoRetry is enabled.
     */
    retry?: WonderJobRetryOptions;
  }
  
  export interface WonderQueueClearOptions {
    statuses?: readonly WonderJobStatus[];
  
    batchId?: string;
  
    terminalOnly?: boolean;
  }
  
  export interface WonderQueueSnapshot {
    version: number;
  
    createdAt: Date;
  
    jobs: WonderJob<unknown, unknown>[];
  }
  
  export interface WonderQueueStatistics {
    totalJobs: number;
  
    queuedJobs: number;
  
    processingJobs: number;
  
    completedJobs: number;
  
    failedJobs: number;
  
    cancelledJobs: number;
  
    readyJobs: number;
  
    lockedJobs: number;
  
    expiredLocks: number;
  
    retryableJobs: number;
  
    averageProgress: number;
  
    jobsByType: Record<
      WonderJobType,
      number
    >;
  
    jobsByPriority: Record<
      WonderJobPriority,
      number
    >;
  }
  
  export interface WonderQueueOperationResult<
    TPayload = unknown,
    TResult = unknown
  > {
    success: boolean;
  
    job: WonderJob<
      TPayload,
      TResult
    >;
  
    eventErrors: string[];
  }
  
  interface ResolvedWonderQueueOptions {
    maximumJobs: number;
  
    defaultLockDurationMilliseconds: number;
  
    pruneCompletedJobsWhenFull: boolean;
  
    completedJobRetention: number;
  
    emitEvents: boolean;
  }
  
  const WONDER_QUEUE_SNAPSHOT_VERSION =
    1;
  
  const DEFAULT_MAXIMUM_JOBS =
    10_000;
  
  const MAXIMUM_ALLOWED_JOBS =
    1_000_000;
  
  const DEFAULT_LOCK_DURATION_MILLISECONDS =
    5 * 60 * 1000;
  
  const DEFAULT_COMPLETED_JOB_RETENTION =
    1_000;
  
  /**
   * In-memory priority queue for Wonder Factory.
   *
   * Responsibilities:
   *
   * - enqueue jobs
   * - priority ordering
   * - scheduled execution
   * - worker locking
   * - progress tracking
   * - retries
   * - cancellation
   * - lifecycle events
   * - queue statistics
   *
   * Higher priority numbers are processed first.
   *
   * Jobs with equal priority are ordered by:
   *
   * 1. scheduledAt
   * 2. createdAt
   * 3. job ID
   */
  export class WonderQueue {
    private readonly jobs =
      new Map<
        string,
        WonderJob<
          unknown,
          unknown
        >
      >();
  
    private readonly options:
      ResolvedWonderQueueOptions;
  
    private readonly eventBus:
      WonderOSEventBus;
  
    constructor(
      options: WonderQueueOptions = {},
      eventBus: WonderOSEventBus =
        wonderOSEventBus
    ) {
      this.options =
        resolveWonderQueueOptions(
          options
        );
  
      this.eventBus =
        eventBus;
    }
  
    // =========================================================
    // CREATION AND ENQUEUE
    // =========================================================
  
    async createAndEnqueue<
      TPayload
    >(
      input: WonderJobCreateInput<TPayload>
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        never
      >
    > {
      const job =
        createWonderJob(input);
  
      return this.enqueue(job);
    }
  
    async enqueue<
      TPayload,
      TResult
    >(
      job: WonderJob<
        TPayload,
        TResult
      >
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      >
    > {
      validateWonderJobOrThrow(
        job
      );
  
      if (
        this.jobs.has(job.id)
      ) {
        throw new Error(
          `WonderQueue: job "${job.id}" already exists.`
        );
      }
  
      if (
        job.status !== "queued"
      ) {
        throw new Error(
          `WonderQueue: only queued jobs can be enqueued. Job "${job.id}" has status "${job.status}".`
        );
      }
  
      this.ensureCapacity();
  
      const storedJob =
        cloneWonderJob(job);
  
      this.jobs.set(
        storedJob.id,
        storedJob as WonderJob<
          unknown,
          unknown
        >
      );
  
      const eventErrors =
        await this.emitJobQueued(
          storedJob
        );
  
      return {
        success: true,
  
        job:
          cloneWonderJob(
            storedJob
          ),
  
        eventErrors,
      };
    }
  
    // =========================================================
    // CLAIMING
    // =========================================================
  
    async claimNext<
      TPayload = unknown,
      TResult = unknown
    >(
      workerId: string,
      options: WonderQueueClaimOptions = {}
    ): Promise<
      WonderJob<
        TPayload,
        TResult
      > | null
    > {
      const cleanWorkerId =
        normaliseRequiredText(
          workerId,
          "workerId"
        );
  
      const now =
        cloneValidDate(
          options.now,
          new Date()
        );
  
      const readyJobs =
        this.getReadyJobs(
          now
        ).filter(
          (job) =>
            matchesClaimOptions(
              job,
              options
            )
        );
  
      const nextJob =
        readyJobs[0];
  
      if (!nextJob) {
        return null;
      }
  
      const assignedJob =
        assignWonderJob(
          nextJob,
          cleanWorkerId,
          options
            .lockDurationMilliseconds ??
            this.options
              .defaultLockDurationMilliseconds
        );
  
      this.storeJob(
        assignedJob
      );
  
      return cloneWonderJob(
        assignedJob
      ) as WonderJob<
        TPayload,
        TResult
      >;
    }
  
    async claimAndStart<
      TPayload = unknown,
      TResult = unknown
    >(
      workerId: string,
      options: WonderQueueClaimOptions = {}
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      > | null
    > {
      const claimed =
        await this.claimNext<
          TPayload,
          TResult
        >(
          workerId,
          options
        );
  
      if (!claimed) {
        return null;
      }
  
      return this.start<
        TPayload,
        TResult
      >(
        claimed.id,
        workerId
      );
    }
  
    // =========================================================
    // START
    // =========================================================
  
    async start<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string,
      workerId?: string
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      >
    > {
      const job =
        this.requireJob<
          TPayload,
          TResult
        >(jobId);
  
      const resolvedWorkerId =
        normaliseOptionalText(
          workerId
        ) ??
        job.lock?.workerId ??
        null;
  
      const startedJob =
        startWonderJob(
          job,
          resolvedWorkerId ??
            undefined
        );
  
      this.storeJob(
        startedJob
      );
  
      const eventErrors =
        await this.emitJobStarted(
          startedJob,
          resolvedWorkerId
        );
  
      return {
        success: true,
  
        job:
          cloneWonderJob(
            startedJob
          ),
  
        eventErrors,
      };
    }
  
    // =========================================================
    // PROGRESS
    // =========================================================
  
    async updateProgress<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string,
      update: WonderJobProgressUpdate
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      >
    > {
      const job =
        this.requireJob<
          TPayload,
          TResult
        >(jobId);
  
      const updatedJob =
        updateWonderJobProgress(
          job,
          update
        );
  
      this.storeJob(
        updatedJob
      );
  
      const eventErrors =
        await this.emitJobProgress(
          updatedJob
        );
  
      return {
        success: true,
  
        job:
          cloneWonderJob(
            updatedJob
          ),
  
        eventErrors,
      };
    }
  
    // =========================================================
    // COMPLETION
    // =========================================================
  
    async complete<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string,
      result: TResult
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      >
    > {
      const job =
        this.requireJob<
          TPayload,
          TResult
        >(jobId);
  
      const completedJob =
        completeWonderJob(
          job,
          result
        );
  
      this.storeJob(
        completedJob
      );
  
      const eventErrors =
        await this.emitJobCompleted(
          completedJob
        );
  
      return {
        success: true,
  
        job:
          cloneWonderJob(
            completedJob
          ),
  
        eventErrors,
      };
    }
  
    // =========================================================
    // FAILURE
    // =========================================================
  
    async fail<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string,
      failure: WonderJobFailureInput,
      options: WonderQueueFailOptions = {}
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      >
    > {
      const job =
        this.requireJob<
          TPayload,
          TResult
        >(jobId);
  
      const failedJob =
        failWonderJob(
          job,
          failure
        );
  
      this.storeJob(
        failedJob
      );
  
      const eventErrors =
        await this.emitJobFailed(
          failedJob
        );
  
      if (
        options.autoRetry &&
        canRetryWonderJob(
          failedJob
        )
      ) {
        const retriedJob =
          retryWonderJob(
            failedJob,
            options.retry
          );
  
        this.storeJob(
          retriedJob
        );
  
        return {
          success: true,
  
          job:
            cloneWonderJob(
              retriedJob
            ),
  
          eventErrors,
        };
      }
  
      return {
        success: true,
  
        job:
          cloneWonderJob(
            failedJob
          ),
  
        eventErrors,
      };
    }
  
    // =========================================================
    // RETRY
    // =========================================================
  
    async retry<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string,
      options: WonderJobRetryOptions = {}
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      >
    > {
      const job =
        this.requireJob<
          TPayload,
          TResult
        >(jobId);
  
      const retriedJob =
        retryWonderJob(
          job,
          options
        );
  
      this.storeJob(
        retriedJob
      );
  
      const eventErrors =
        await this.emitJobQueued(
          retriedJob
        );
  
      return {
        success: true,
  
        job:
          cloneWonderJob(
            retriedJob
          ),
  
        eventErrors,
      };
    }
  
    // =========================================================
    // CANCELLATION
    // =========================================================
  
    async cancel<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string,
      reason?: string
    ): Promise<
      WonderQueueOperationResult<
        TPayload,
        TResult
      >
    > {
      const job =
        this.requireJob<
          TPayload,
          TResult
        >(jobId);
  
      const cancelledJob =
        cancelWonderJob(
          job,
          reason
        );
  
      this.storeJob(
        cancelledJob
      );
  
      return {
        success: true,
  
        job:
          cloneWonderJob(
            cancelledJob
          ),
  
        eventErrors: [],
      };
    }
  
    // =========================================================
    // LOCKS
    // =========================================================
  
    releaseLock<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string
    ): WonderJob<
      TPayload,
      TResult
    > {
      const job =
        this.requireJob<
          TPayload,
          TResult
        >(jobId);
  
      const updatedJob =
        releaseWonderJobLock(
          job
        );
  
      this.storeJob(
        updatedJob
      );
  
      return cloneWonderJob(
        updatedJob
      );
    }
  
    releaseExpiredLocks(
      at = new Date()
    ): number {
      let releasedCount = 0;
  
      for (
        const job of
          this.jobs.values()
      ) {
        if (
          !isWonderJobLockExpired(
            job,
            at
          )
        ) {
          continue;
        }
  
        const releasedJob =
          releaseWonderJobLock(
            job
          );
  
        this.storeJob(
          releasedJob
        );
  
        releasedCount += 1;
      }
  
      return releasedCount;
    }
  
    // =========================================================
    // RETRIEVAL
    // =========================================================
  
    getJob<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string
    ): WonderJob<
      TPayload,
      TResult
    > | null {
      const cleanJobId =
        normaliseRequiredText(
          jobId,
          "jobId"
        );
  
      const job =
        this.jobs.get(
          cleanJobId
        );
  
      return job
        ? cloneWonderJob(
            job
          ) as WonderJob<
            TPayload,
            TResult
          >
        : null;
    }
  
    hasJob(
      jobId: string
    ): boolean {
      return this.jobs.has(
        normaliseRequiredText(
          jobId,
          "jobId"
        )
      );
    }
  
    listJobs(
      filter: WonderQueueListFilter = {}
    ): WonderJob<
      unknown,
      unknown
    >[] {
      const now =
        new Date();
  
      return Array.from(
        this.jobs.values()
      )
        .filter(
          (job) =>
            matchesListFilter(
              job,
              filter,
              now
            )
        )
        .sort(
          compareWonderJobs
        )
        .map(
          cloneWonderJob
        );
    }
  
    getReadyJobs(
      at = new Date()
    ): WonderJob<
      unknown,
      unknown
    >[] {
      return Array.from(
        this.jobs.values()
      )
        .filter(
          (job) =>
            isWonderJobReady(
              job,
              at
            )
        )
        .sort(
          compareWonderJobs
        )
        .map(
          cloneWonderJob
        );
    }
  
    getJobsByBatch(
      batchId: string
    ): WonderJob<
      unknown,
      unknown
    >[] {
      const cleanBatchId =
        normaliseRequiredText(
          batchId,
          "batchId"
        );
  
      return this.listJobs({
        batchId:
          cleanBatchId,
      });
    }
  
    getJobsByStatus(
      status: WonderJobStatus
    ): WonderJob<
      unknown,
      unknown
    >[] {
      return this.listJobs({
        statuses: [
          status,
        ],
      });
    }
  
    getJobsByType(
      type: WonderJobType
    ): WonderJob<
      unknown,
      unknown
    >[] {
      return this.listJobs({
        types: [
          type,
        ],
      });
    }
  
    peekNext(
      options: WonderQueueClaimOptions = {}
    ): WonderJob<
      unknown,
      unknown
    > | null {
      const now =
        cloneValidDate(
          options.now,
          new Date()
        );
  
      const job =
        this.getReadyJobs(now)
          .find(
            (candidate) =>
              matchesClaimOptions(
                candidate,
                options
              )
          );
  
      return job
        ? cloneWonderJob(job)
        : null;
    }
  
    // =========================================================
    // REMOVAL
    // =========================================================
  
    remove(
      jobId: string,
      force = false
    ): boolean {
      const job =
        this.requireJob(
          jobId
        );
  
      if (
        !force &&
        !isTerminalWonderJob(
          job
        )
      ) {
        throw new Error(
          `WonderQueue: active job "${job.id}" cannot be removed without force.`
        );
      }
  
      return this.jobs.delete(
        job.id
      );
    }
  
    clear(
      options: WonderQueueClearOptions = {}
    ): number {
      const jobsToRemove =
        this.listJobs({
          statuses:
            options.statuses,
  
          batchId:
            options.batchId,
  
          terminalOnly:
            options.terminalOnly,
        });
  
      let removedCount = 0;
  
      for (
        const job of
          jobsToRemove
      ) {
        if (
          this.jobs.delete(
            job.id
          )
        ) {
          removedCount += 1;
        }
      }
  
      return removedCount;
    }
  
    pruneCompletedJobs(
      retain =
        this.options
          .completedJobRetention
    ): number {
      const completedJobs =
        this.listJobs({
          statuses: [
            "completed",
          ],
        }).sort(
          compareOldestCompletedJobs
        );
  
      const safeRetention =
        Math.max(
          0,
          Math.floor(retain)
        );
  
      const removeCount =
        Math.max(
          0,
          completedJobs.length -
            safeRetention
        );
  
      for (
        let index = 0;
        index < removeCount;
        index += 1
      ) {
        this.jobs.delete(
          completedJobs[index].id
        );
      }
  
      return removeCount;
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    getStatistics(
      at = new Date()
    ): WonderQueueStatistics {
      const jobs =
        Array.from(
          this.jobs.values()
        );
  
      const jobsByType =
        createEmptyTypeCounts();
  
      const jobsByPriority =
        createEmptyPriorityCounts();
  
      let queuedJobs = 0;
      let processingJobs = 0;
      let completedJobs = 0;
      let failedJobs = 0;
      let cancelledJobs = 0;
      let readyJobs = 0;
      let lockedJobs = 0;
      let expiredLocks = 0;
      let retryableJobs = 0;
      let totalProgress = 0;
  
      for (const job of jobs) {
        jobsByType[job.type] +=
          1;
  
        jobsByPriority[
          job.priority
        ] += 1;
  
        totalProgress +=
          job.progress.percentage;
  
        switch (job.status) {
          case "queued":
            queuedJobs += 1;
            break;
  
          case "processing":
            processingJobs += 1;
            break;
  
          case "completed":
            completedJobs += 1;
            break;
  
          case "failed":
            failedJobs += 1;
            break;
  
          case "cancelled":
            cancelledJobs += 1;
            break;
        }
  
        if (
          isWonderJobReady(
            job,
            at
          )
        ) {
          readyJobs += 1;
        }
  
        if (job.lock) {
          lockedJobs += 1;
  
          if (
            isWonderJobLockExpired(
              job,
              at
            )
          ) {
            expiredLocks += 1;
          }
        }
  
        if (
          canRetryWonderJob(
            job
          )
        ) {
          retryableJobs += 1;
        }
      }
  
      return {
        totalJobs:
          jobs.length,
  
        queuedJobs,
  
        processingJobs,
  
        completedJobs,
  
        failedJobs,
  
        cancelledJobs,
  
        readyJobs,
  
        lockedJobs,
  
        expiredLocks,
  
        retryableJobs,
  
        averageProgress:
          jobs.length > 0
            ? roundNumber(
                totalProgress /
                  jobs.length,
                2
              )
            : 0,
  
        jobsByType,
  
        jobsByPriority,
      };
    }
  
    size(): number {
      return this.jobs.size;
    }
  
    isEmpty(): boolean {
      return this.jobs.size === 0;
    }
  
    // =========================================================
    // SNAPSHOTS
    // =========================================================
  
    createSnapshot(): WonderQueueSnapshot {
      return {
        version:
          WONDER_QUEUE_SNAPSHOT_VERSION,
  
        createdAt:
          new Date(),
  
        jobs:
          this.listJobs(),
      };
    }
  
    importSnapshot(
      snapshot: WonderQueueSnapshot,
      replaceExisting = false
    ): number {
      if (
        snapshot.version !==
        WONDER_QUEUE_SNAPSHOT_VERSION
      ) {
        throw new Error(
          `WonderQueue: unsupported snapshot version "${snapshot.version}".`
        );
      }
  
      if (
        !isValidDate(
          snapshot.createdAt
        )
      ) {
        throw new Error(
          "WonderQueue: snapshot createdAt is invalid."
        );
      }
  
      if (replaceExisting) {
        this.jobs.clear();
      }
  
      let importedCount = 0;
  
      for (
        const snapshotJob of
          snapshot.jobs
      ) {
        validateWonderJobOrThrow(
          snapshotJob
        );
  
        if (
          this.jobs.has(
            snapshotJob.id
          )
        ) {
          continue;
        }
  
        this.ensureCapacity();
  
        this.storeJob(
          snapshotJob
        );
  
        importedCount += 1;
      }
  
      return importedCount;
    }
  
    // =========================================================
    // INTERNAL STORAGE
    // =========================================================
  
    private requireJob<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string
    ): WonderJob<
      TPayload,
      TResult
    > {
      const cleanJobId =
        normaliseRequiredText(
          jobId,
          "jobId"
        );
  
      const job =
        this.jobs.get(
          cleanJobId
        );
  
      if (!job) {
        throw new Error(
          `WonderQueue: job "${cleanJobId}" was not found.`
        );
      }
  
      return cloneWonderJob(
        job
      ) as WonderJob<
        TPayload,
        TResult
      >;
    }
  
    private storeJob<
      TPayload,
      TResult
    >(
      job: WonderJob<
        TPayload,
        TResult
      >
    ): void {
      validateWonderJobOrThrow(
        job
      );
  
      this.jobs.set(
        job.id,
        cloneWonderJob(
          job
        ) as WonderJob<
          unknown,
          unknown
        >
      );
    }
  
    private ensureCapacity(): void {
      if (
        this.jobs.size <
        this.options.maximumJobs
      ) {
        return;
      }
  
      if (
        this.options
          .pruneCompletedJobsWhenFull
      ) {
        this.pruneCompletedJobs(
          this.options
            .completedJobRetention
        );
      }
  
      if (
        this.jobs.size >=
        this.options.maximumJobs
      ) {
        throw new Error(
          `WonderQueue: maximum capacity of ${this.options.maximumJobs} jobs has been reached.`
        );
      }
    }
  
    // =========================================================
    // EVENTS
    // =========================================================
  
    private async emitJobQueued(
      job: WonderJob<
        unknown,
        unknown
      >
    ): Promise<string[]> {
      if (
        !this.options.emitEvents
      ) {
        return [];
      }
  
      const result =
        await this.eventBus.emit(
          "factory:job-queued",
          {
            jobId:
              job.id,
  
            batchId:
              job.batchId,
  
            jobType:
              job.type,
  
            priority:
              job.priority,
  
            queuedAt:
              new Date().toISOString(),
          },
          {
            source:
              "WonderQueue",
          }
        );
  
      return result.errors.map(
        (error) =>
          error.message
      );
    }
  
    private async emitJobStarted(
      job: WonderJob<
        unknown,
        unknown
      >,
      workerId: string | null
    ): Promise<string[]> {
      if (
        !this.options.emitEvents
      ) {
        return [];
      }
  
      const result =
        await this.eventBus.emit(
          "factory:job-started",
          {
            jobId:
              job.id,
  
            batchId:
              job.batchId,
  
            jobType:
              job.type,
  
            workerId:
              workerId ??
              job.lock?.workerId ??
              "unassigned-worker",
  
            startedAt:
              (
                job.startedAt ??
                new Date()
              ).toISOString(),
          },
          {
            source:
              "WonderQueue",
          }
        );
  
      return result.errors.map(
        (error) =>
          error.message
      );
    }
  
    private async emitJobProgress(
      job: WonderJob<
        unknown,
        unknown
      >
    ): Promise<string[]> {
      if (
        !this.options.emitEvents
      ) {
        return [];
      }
  
      const result =
        await this.eventBus.emit(
          "factory:job-progress",
          {
            jobId:
              job.id,
  
            batchId:
              job.batchId,
  
            completedItems:
              job.progress
                .completedItems,
  
            totalItems:
              job.progress
                .totalItems,
  
            progressPercentage:
              calculateWonderJobProgress(
                job.progress
                  .completedItems,
                job.progress
                  .totalItems
              ),
  
            message:
              job.progress.message,
  
            updatedAt:
              job.progress
                .updatedAt
                .toISOString(),
          },
          {
            source:
              "WonderQueue",
          }
        );
  
      return result.errors.map(
        (error) =>
          error.message
      );
    }
  
    private async emitJobCompleted(
      job: WonderJob<
        unknown,
        unknown
      >
    ): Promise<string[]> {
      if (
        !this.options.emitEvents
      ) {
        return [];
      }
  
      const latestAttempt =
        job.attempts[
          job.attempts.length - 1
        ];
  
      const result =
        await this.eventBus.emit(
          "factory:job-completed",
          {
            jobId:
              job.id,
  
            batchId:
              job.batchId,
  
            workerId:
              latestAttempt
                ?.workerId ??
              "unassigned-worker",
  
            processedItems:
              job.progress
                .completedItems,
  
            durationMilliseconds:
              latestAttempt
                ?.durationMilliseconds ??
              0,
  
            completedAt:
              (
                job.completedAt ??
                new Date()
              ).toISOString(),
          },
          {
            source:
              "WonderQueue",
          }
        );
  
      return result.errors.map(
        (error) =>
          error.message
      );
    }
  
    private async emitJobFailed(
      job: WonderJob<
        unknown,
        unknown
      >
    ): Promise<string[]> {
      if (
        !this.options.emitEvents
      ) {
        return [];
      }
  
      const latestAttempt =
        job.attempts[
          job.attempts.length - 1
        ];
  
      const error =
        job.lastError;
  
      const result =
        await this.eventBus.emit(
          "factory:job-failed",
          {
            jobId:
              job.id,
  
            batchId:
              job.batchId,
  
            workerId:
              latestAttempt
                ?.workerId ??
              job.lock?.workerId ??
              null,
  
            error: {
              message:
                error?.message ??
                "Unknown job failure.",
  
              code:
                error?.code ??
                null,
  
              details: {
                ...(error?.details ??
                  {}),
              },
            },
  
            retryCount:
              Math.max(
                0,
                job.attemptCount - 1
              ),
  
            failedAt:
              (
                job.completedAt ??
                error?.occurredAt ??
                new Date()
              ).toISOString(),
          },
          {
            source:
              "WonderQueue",
          }
        );
  
      return result.errors.map(
        (dispatchError) =>
          dispatchError.message
      );
    }
  }
  
  // =========================================================
  // SORTING
  // =========================================================
  
  function compareWonderJobs(
    first: WonderJob<
      unknown,
      unknown
    >,
    second: WonderJob<
      unknown,
      unknown
    >
  ): number {
    if (
      first.priority !==
      second.priority
    ) {
      return (
        second.priority -
        first.priority
      );
    }
  
    const scheduledDifference =
      first.scheduledAt.getTime() -
      second.scheduledAt.getTime();
  
    if (
      scheduledDifference !== 0
    ) {
      return scheduledDifference;
    }
  
    const createdDifference =
      first.createdAt.getTime() -
      second.createdAt.getTime();
  
    if (
      createdDifference !== 0
    ) {
      return createdDifference;
    }
  
    return first.id.localeCompare(
      second.id
    );
  }
  
  function compareOldestCompletedJobs(
    first: WonderJob<
      unknown,
      unknown
    >,
    second: WonderJob<
      unknown,
      unknown
    >
  ): number {
    const firstTime =
      first.completedAt?.getTime() ??
      first.updatedAt.getTime();
  
    const secondTime =
      second.completedAt?.getTime() ??
      second.updatedAt.getTime();
  
    return firstTime - secondTime;
  }
  
  // =========================================================
  // FILTERING
  // =========================================================
  
  function matchesClaimOptions(
    job: WonderJob<
      unknown,
      unknown
    >,
    options: WonderQueueClaimOptions
  ): boolean {
    if (
      options.types &&
      options.types.length > 0 &&
      !options.types.includes(
        job.type
      )
    ) {
      return false;
    }
  
    if (
      options.batchId &&
      job.batchId !==
        options.batchId
    ) {
      return false;
    }
  
    if (
      options.minimumPriority &&
      job.priority <
        options.minimumPriority
    ) {
      return false;
    }
  
    return true;
  }
  
  function matchesListFilter(
    job: WonderJob<
      unknown,
      unknown
    >,
    filter: WonderQueueListFilter,
    now: Date
  ): boolean {
    if (
      filter.statuses &&
      filter.statuses.length > 0 &&
      !filter.statuses.includes(
        job.status
      )
    ) {
      return false;
    }
  
    if (
      filter.types &&
      filter.types.length > 0 &&
      !filter.types.includes(
        job.type
      )
    ) {
      return false;
    }
  
    if (
      filter.batchId &&
      job.batchId !==
        filter.batchId
    ) {
      return false;
    }
  
    if (
      filter.workerId &&
      job.lock?.workerId !==
        filter.workerId &&
      !job.attempts.some(
        (attempt) =>
          attempt.workerId ===
          filter.workerId
      )
    ) {
      return false;
    }
  
    if (
      filter.minimumPriority &&
      job.priority <
        filter.minimumPriority
    ) {
      return false;
    }
  
    if (
      filter.maximumPriority &&
      job.priority >
        filter.maximumPriority
    ) {
      return false;
    }
  
    if (
      filter.readyOnly &&
      !isWonderJobReady(
        job,
        now
      )
    ) {
      return false;
    }
  
    if (
      filter.terminalOnly &&
      !isTerminalWonderJob(
        job
      )
    ) {
      return false;
    }
  
    if (
      filter.includeExpiredLocks ===
        false &&
      isWonderJobLockExpired(
        job,
        now
      )
    ) {
      return false;
    }
  
    return true;
  }
  
  // =========================================================
  // STATISTICS HELPERS
  // =========================================================
  
  function createEmptyTypeCounts(): Record<
    WonderJobType,
    number
  > {
    return {
      generation: 0,
  
      validation: 0,
  
      repair: 0,
  
      approval: 0,
  
      publication: 0,
  
      export: 0,
    };
  }
  
  function createEmptyPriorityCounts(): Record<
    WonderJobPriority,
    number
  > {
    return {
      1: 0,
  
      2: 0,
  
      3: 0,
  
      4: 0,
  
      5: 0,
  
      6: 0,
  
      7: 0,
  
      8: 0,
  
      9: 0,
  
      10: 0,
    };
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolveWonderQueueOptions(
    options: WonderQueueOptions
  ): ResolvedWonderQueueOptions {
    const maximumJobs =
      clampInteger(
        options.maximumJobs ??
          DEFAULT_MAXIMUM_JOBS,
        1,
        MAXIMUM_ALLOWED_JOBS
      );
  
    return {
      maximumJobs,
  
      defaultLockDurationMilliseconds:
        Math.max(
          1,
          Math.floor(
            options
              .defaultLockDurationMilliseconds ??
              DEFAULT_LOCK_DURATION_MILLISECONDS
          )
        ),
  
      pruneCompletedJobsWhenFull:
        options
          .pruneCompletedJobsWhenFull ??
        true,
  
      completedJobRetention:
        clampInteger(
          options
            .completedJobRetention ??
            DEFAULT_COMPLETED_JOB_RETENTION,
          0,
          maximumJobs
        ),
  
      emitEvents:
        options.emitEvents ??
        true,
    };
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
        `WonderQueue: "${fieldName}" must be a string.`
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new Error(
        `WonderQueue: "${fieldName}" is required.`
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
  
  export const wonderQueue =
    new WonderQueue();
  
  export default WonderQueue;