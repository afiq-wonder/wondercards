import {
    wonderFactory,
  } from "../WonderFactory";
  
  import type {
    WonderFactory,
    WonderFactoryJobSubmissionResult,
  } from "../WonderFactory";
  
  import type {
    WonderJobCreateInput,
    WonderJobFailureStrategy,
    WonderJobMetadata,
    WonderJobPriority,
    WonderJobType,
  } from "../types/WonderJob";
  
  // =========================================================
  // SCHEDULER TYPES
  // =========================================================
  
  export type WonderSchedulerStatus =
    | "idle"
    | "running"
    | "paused"
    | "stopped"
    | "error";
  
  export type WonderScheduleType =
    | "once"
    | "interval";
  
  export type WonderScheduleStatus =
    | "active"
    | "paused"
    | "completed"
    | "cancelled"
    | "error";
  
  export type WonderScheduleMisfirePolicy =
    | "run-once"
    | "catch-up";
  
  export interface WonderScheduledJobTemplate<
    TPayload = unknown
  > {
    batchId: string;
  
    type: WonderJobType;
  
    payload: TPayload;
  
    priority?: WonderJobPriority;
  
    totalItems?: number;
  
    maximumAttempts?: number;
  
    failureStrategy?: WonderJobFailureStrategy;
  
    metadata?: Partial<
      WonderJobMetadata
    >;
  }
  
  export interface WonderScheduleCommonInput<
    TPayload = unknown
  > {
    id?: string;
  
    name?: string;
  
    enabled?: boolean;
  
    job: WonderScheduledJobTemplate<TPayload>;
  
    tags?: readonly string[];
  
    metadata?: Readonly<
      Record<string, unknown>
    >;
  }
  
  export interface WonderOnceScheduleInput<
    TPayload = unknown
  > extends WonderScheduleCommonInput<TPayload> {
    type: "once";
  
    runAt: Date;
  }
  
  export interface WonderIntervalScheduleInput<
    TPayload = unknown
  > extends WonderScheduleCommonInput<TPayload> {
    type: "interval";
  
    startAt?: Date;
  
    intervalMilliseconds: number;
  
    endAt?: Date | null;
  
    maximumRuns?: number | null;
  
    misfirePolicy?: WonderScheduleMisfirePolicy;
  }
  
  export type WonderScheduleCreateInput<
    TPayload = unknown
  > =
    | WonderOnceScheduleInput<TPayload>
    | WonderIntervalScheduleInput<TPayload>;
  
  export interface WonderOnceScheduleConfiguration {
    type: "once";
  
    runAt: Date;
  }
  
  export interface WonderIntervalScheduleConfiguration {
    type: "interval";
  
    startAt: Date;
  
    intervalMilliseconds: number;
  
    endAt: Date | null;
  
    maximumRuns: number | null;
  
    misfirePolicy: WonderScheduleMisfirePolicy;
  }
  
  export type WonderScheduleConfiguration =
    | WonderOnceScheduleConfiguration
    | WonderIntervalScheduleConfiguration;
  
  export interface WonderScheduleError {
    message: string;
  
    occurredAt: Date;
  
    details: Record<
      string,
      unknown
    >;
  }
  
  export interface WonderSchedule<
    TPayload = unknown
  > {
    id: string;
  
    name: string;
  
    type: WonderScheduleType;
  
    status: WonderScheduleStatus;
  
    job: WonderScheduledJobTemplate<TPayload>;
  
    configuration: WonderScheduleConfiguration;
  
    tags: string[];
  
    metadata: Record<
      string,
      unknown
    >;
  
    runCount: number;
  
    successfulRunCount: number;
  
    failedRunCount: number;
  
    lastRunAt: Date | null;
  
    lastScheduledFor: Date | null;
  
    nextRunAt: Date | null;
  
    lastJobId: string | null;
  
    lastError: WonderScheduleError | null;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    completedAt: Date | null;
  
    cancelledAt: Date | null;
  }
  
  export interface WonderSchedulerOptions {
    id?: string;
  
    name?: string;
  
    pollingIntervalMilliseconds?: number;
  
    maximumSubmissionsPerTick?: number;
  
    startFactoryIfNeeded?: boolean;
  
    continueOnSubmissionError?: boolean;
  
    automaticPolling?: boolean;
  }
  
  export interface WonderSchedulerStartOptions {
    automaticPolling?: boolean;
  
    startFactoryIfNeeded?: boolean;
  }
  
  export interface WonderSchedulerStopOptions {
    stopFactory?: boolean;
  
    gracefulFactoryStop?: boolean;
  }
  
  export interface WonderSchedulerTickSubmission {
    scheduleId: string;
  
    scheduleName: string;
  
    scheduledFor: Date;
  
    jobId: string;
  
    batchId: string;
  
    jobType: WonderJobType;
  }
  
  export interface WonderSchedulerTickFailure {
    scheduleId: string;
  
    scheduleName: string;
  
    scheduledFor: Date;
  
    message: string;
  }
  
  export interface WonderSchedulerTickResult {
    tickNumber: number;
  
    startedAt: Date;
  
    completedAt: Date;
  
    durationMilliseconds: number;
  
    dueSchedules: number;
  
    submittedJobs: number;
  
    completedSchedules: number;
  
    failedSchedules: number;
  
    submissions: WonderSchedulerTickSubmission[];
  
    failures: WonderSchedulerTickFailure[];
  }
  
  export interface WonderSchedulerStatistics {
    schedulerId: string;
  
    status: WonderSchedulerStatus;
  
    totalSchedules: number;
  
    activeSchedules: number;
  
    pausedSchedules: number;
  
    completedSchedules: number;
  
    cancelledSchedules: number;
  
    errorSchedules: number;
  
    dueSchedules: number;
  
    totalRuns: number;
  
    successfulRuns: number;
  
    failedRuns: number;
  
    tickCount: number;
  
    submittedJobCount: number;
  
    lastTickAt: Date | null;
  
    nextRunAt: Date | null;
  }
  
  export interface WonderSchedulerSnapshot {
    version: number;
  
    schedulerId: string;
  
    schedulerName: string;
  
    createdAt: Date;
  
    schedules: WonderSchedule<
      unknown
    >[];
  }
  
  export interface WonderSchedulerImportResult {
    importedSchedules: number;
  
    skippedSchedules: number;
  
    replacedExisting: boolean;
  }
  
  export interface WonderSchedulerLifecycleResult {
    success: boolean;
  
    previousStatus: WonderSchedulerStatus;
  
    currentStatus: WonderSchedulerStatus;
  
    changedAt: Date;
  }
  
  interface ResolvedWonderSchedulerOptions {
    id: string;
  
    name: string;
  
    pollingIntervalMilliseconds: number;
  
    maximumSubmissionsPerTick: number;
  
    startFactoryIfNeeded: boolean;
  
    continueOnSubmissionError: boolean;
  
    automaticPolling: boolean;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const WONDER_SCHEDULER_SNAPSHOT_VERSION =
    1;
  
  const DEFAULT_SCHEDULER_ID =
    "wonder-scheduler";
  
  const DEFAULT_SCHEDULER_NAME =
    "Wonder Scheduler";
  
  const DEFAULT_POLLING_INTERVAL_MILLISECONDS =
    1_000;
  
  const MINIMUM_POLLING_INTERVAL_MILLISECONDS =
    10;
  
  const DEFAULT_MAXIMUM_SUBMISSIONS_PER_TICK =
    100;
  
  const MAXIMUM_SUBMISSIONS_PER_TICK =
    10_000;
  
  const MINIMUM_INTERVAL_MILLISECONDS =
    1;
  
  const MAXIMUM_RUNS =
    1_000_000;
  
  // =========================================================
  // SCHEDULER
  // =========================================================
  
  /**
   * Schedules jobs for Wonder Factory.
   *
   * Supported schedule types:
   *
   * - once
   * - interval
   *
   * Flow:
   *
   * schedule becomes due
   * → scheduler submits job
   * → Wonder Factory queue receives job
   * → Wonder Factory worker processes job
   */
  export class WonderScheduler {
    readonly id: string;
  
    readonly name: string;
  
    private readonly factory:
      WonderFactory;
  
    private readonly options:
      ResolvedWonderSchedulerOptions;
  
    private readonly schedules =
      new Map<
        string,
        WonderSchedule<unknown>
      >();
  
    private status:
      WonderSchedulerStatus =
      "idle";
  
    private pollingEnabled =
      false;
  
    private pollingTimer:
      ReturnType<
        typeof setTimeout
      > | null = null;
  
    private tickInProgress =
      false;
  
    private tickSequence =
      0;
  
    private submittedJobCount =
      0;
  
    private lastTickAt:
      Date | null = null;
  
    private readonly createdAt:
      Date;
  
    private updatedAt:
      Date;
  
    constructor(
      factoryInstance:
        WonderFactory =
        wonderFactory,
      options:
        WonderSchedulerOptions = {}
    ) {
      const now =
        new Date();
  
      this.factory =
        factoryInstance;
  
      this.options =
        resolveSchedulerOptions(
          options
        );
  
      this.id =
        this.options.id;
  
      this.name =
        this.options.name;
  
      this.createdAt =
        new Date(
          now.getTime()
        );
  
      this.updatedAt =
        new Date(
          now.getTime()
        );
    }
  
    // =========================================================
    // ACCESSORS
    // =========================================================
  
    getStatus(): WonderSchedulerStatus {
      return this.status;
    }
  
    getFactory(): WonderFactory {
      return this.factory;
    }
  
    getOptions(): Readonly<
      ResolvedWonderSchedulerOptions
    > {
      return {
        ...this.options,
      };
    }
  
    size(): number {
      return this.schedules.size;
    }
  
    isEmpty(): boolean {
      return this.schedules.size ===
        0;
    }
  
    isRunning(): boolean {
      return this.status ===
        "running";
    }
  
    isPaused(): boolean {
      return this.status ===
        "paused";
    }
  
    isPolling(): boolean {
      return (
        this.pollingEnabled &&
        this.pollingTimer !==
          null
      );
    }
  
    // =========================================================
    // SCHEDULE CREATION
    // =========================================================
  
    createSchedule<
      TPayload
    >(
      input:
        WonderScheduleCreateInput<TPayload>
    ): WonderSchedule<TPayload> {
      const schedule =
        createWonderSchedule(
          input
        );
  
      if (
        this.schedules.has(
          schedule.id
        )
      ) {
        throw new Error(
          `WonderScheduler: schedule "${schedule.id}" already exists.`
        );
      }
  
      this.schedules.set(
        schedule.id,
        cloneSchedule(
          schedule
        ) as WonderSchedule<unknown>
      );
  
      this.touch();
  
      return cloneSchedule(
        schedule
      );
    }
  
    createOnceSchedule<
      TPayload
    >(
      input:
        Omit<
          WonderOnceScheduleInput<TPayload>,
          "type"
        >
    ): WonderSchedule<TPayload> {
      return this.createSchedule({
        ...input,
  
        type:
          "once",
      });
    }
  
    createIntervalSchedule<
      TPayload
    >(
      input:
        Omit<
          WonderIntervalScheduleInput<TPayload>,
          "type"
        >
    ): WonderSchedule<TPayload> {
      return this.createSchedule({
        ...input,
  
        type:
          "interval",
      });
    }
  
    // =========================================================
    // RETRIEVAL
    // =========================================================
  
    getSchedule<
      TPayload = unknown
    >(
      scheduleId: string
    ): WonderSchedule<TPayload> | null {
      const cleanScheduleId =
        normaliseRequiredText(
          scheduleId,
          "scheduleId"
        );
  
      const schedule =
        this.schedules.get(
          cleanScheduleId
        );
  
      return schedule
        ? cloneSchedule(
            schedule
          ) as WonderSchedule<TPayload>
        : null;
    }
  
    hasSchedule(
      scheduleId: string
    ): boolean {
      return this.schedules.has(
        normaliseRequiredText(
          scheduleId,
          "scheduleId"
        )
      );
    }
  
    listSchedules(): WonderSchedule<
      unknown
    >[] {
      return Array.from(
        this.schedules.values()
      )
        .map(
          cloneSchedule
        )
        .sort(
          compareSchedules
        );
    }
  
    listDueSchedules(
      at = new Date()
    ): WonderSchedule<
      unknown
    >[] {
      return this.listSchedules()
        .filter(
          (schedule) =>
            isScheduleDue(
              schedule,
              at
            )
        );
    }
  
    // =========================================================
    // SCHEDULE CONTROL
    // =========================================================
  
    pauseSchedule(
      scheduleId: string
    ): WonderSchedule<unknown> {
      const schedule =
        this.requireSchedule(
          scheduleId
        );
  
      if (
        schedule.status ===
          "completed" ||
        schedule.status ===
          "cancelled"
      ) {
        throw new Error(
          `WonderScheduler: terminal schedule "${schedule.id}" cannot be paused.`
        );
      }
  
      const updatedSchedule:
        WonderSchedule<unknown> = {
        ...cloneSchedule(
          schedule
        ),
  
        status:
          "paused",
  
        updatedAt:
          new Date(),
      };
  
      this.storeSchedule(
        updatedSchedule
      );
  
      return cloneSchedule(
        updatedSchedule
      );
    }
  
    resumeSchedule(
      scheduleId: string,
      nextRunAt?: Date
    ): WonderSchedule<unknown> {
      const schedule =
        this.requireSchedule(
          scheduleId
        );
  
      if (
        schedule.status !==
          "paused" &&
        schedule.status !==
          "error"
      ) {
        throw new Error(
          `WonderScheduler: schedule "${schedule.id}" cannot resume from status "${schedule.status}".`
        );
      }
  
      const resolvedNextRunAt =
        nextRunAt
          ? cloneValidDateOrThrow(
              nextRunAt,
              "nextRunAt"
            )
          : calculateResumeDate(
              schedule,
              new Date()
            );
  
      const updatedSchedule:
        WonderSchedule<unknown> = {
        ...cloneSchedule(
          schedule
        ),
  
        status:
          "active",
  
        nextRunAt:
          resolvedNextRunAt,
  
        lastError: null,
  
        completedAt: null,
  
        cancelledAt: null,
  
        updatedAt:
          new Date(),
      };
  
      this.storeSchedule(
        updatedSchedule
      );
  
      return cloneSchedule(
        updatedSchedule
      );
    }
  
    cancelSchedule(
      scheduleId: string
    ): WonderSchedule<unknown> {
      const schedule =
        this.requireSchedule(
          scheduleId
        );
  
      if (
        schedule.status ===
        "cancelled"
      ) {
        return cloneSchedule(
          schedule
        );
      }
  
      const now =
        new Date();
  
      const updatedSchedule:
        WonderSchedule<unknown> = {
        ...cloneSchedule(
          schedule
        ),
  
        status:
          "cancelled",
  
        nextRunAt: null,
  
        cancelledAt:
          new Date(
            now.getTime()
          ),
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      };
  
      this.storeSchedule(
        updatedSchedule
      );
  
      return cloneSchedule(
        updatedSchedule
      );
    }
  
    removeSchedule(
      scheduleId: string,
      force = false
    ): boolean {
      const schedule =
        this.requireSchedule(
          scheduleId
        );
  
      if (
        !force &&
        schedule.status ===
          "active"
      ) {
        throw new Error(
          `WonderScheduler: active schedule "${schedule.id}" cannot be removed without force.`
        );
      }
  
      const removed =
        this.schedules.delete(
          schedule.id
        );
  
      if (removed) {
        this.touch();
      }
  
      return removed;
    }
  
    clearSchedules(
      force = false
    ): number {
      const schedules =
        this.listSchedules();
  
      let removedCount =
        0;
  
      for (
        const schedule of
          schedules
      ) {
        if (
          schedule.status ===
            "active" &&
          !force
        ) {
          continue;
        }
  
        if (
          this.schedules.delete(
            schedule.id
          )
        ) {
          removedCount +=
            1;
        }
      }
  
      if (
        removedCount > 0
      ) {
        this.touch();
      }
  
      return removedCount;
    }
  
    // =========================================================
    // LIFECYCLE
    // =========================================================
  
    async start(
      options:
        WonderSchedulerStartOptions = {}
    ): Promise<
      WonderSchedulerLifecycleResult
    > {
      const previousStatus =
        this.status;
  
      if (
        this.status ===
        "running"
      ) {
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          changedAt:
            new Date(),
        };
      }
  
      const startFactoryIfNeeded =
        options.startFactoryIfNeeded ??
        this.options
          .startFactoryIfNeeded;
  
      if (
        startFactoryIfNeeded &&
        !this.factory.isRunning()
      ) {
        await this.factory.start({
          automaticPolling: true,
        });
      }
  
      this.status =
        "running";
  
      this.pollingEnabled =
        options.automaticPolling ??
        this.options
          .automaticPolling;
  
      this.touch();
  
      if (
        this.pollingEnabled
      ) {
        this.scheduleNextPoll();
      }
  
      return {
        success: true,
  
        previousStatus,
  
        currentStatus:
          this.status,
  
        changedAt:
          new Date(),
      };
    }
  
    pause(): WonderSchedulerLifecycleResult {
      const previousStatus =
        this.status;
  
      if (
        this.status !==
        "running"
      ) {
        throw new Error(
          `WonderScheduler: scheduler "${this.id}" cannot pause from status "${this.status}".`
        );
      }
  
      this.pollingEnabled =
        false;
  
      this.clearPollingTimer();
  
      this.status =
        "paused";
  
      this.touch();
  
      return {
        success: true,
  
        previousStatus,
  
        currentStatus:
          this.status,
  
        changedAt:
          new Date(),
      };
    }
  
    resume(
      automaticPolling =
        this.options
          .automaticPolling
    ): WonderSchedulerLifecycleResult {
      const previousStatus =
        this.status;
  
      if (
        this.status !==
        "paused"
      ) {
        throw new Error(
          `WonderScheduler: scheduler "${this.id}" cannot resume from status "${this.status}".`
        );
      }
  
      this.status =
        "running";
  
      this.pollingEnabled =
        automaticPolling;
  
      this.touch();
  
      if (
        this.pollingEnabled
      ) {
        this.scheduleNextPoll();
      }
  
      return {
        success: true,
  
        previousStatus,
  
        currentStatus:
          this.status,
  
        changedAt:
          new Date(),
      };
    }
  
    async stop(
      options:
        WonderSchedulerStopOptions = {}
    ): Promise<
      WonderSchedulerLifecycleResult
    > {
      const previousStatus =
        this.status;
  
      this.pollingEnabled =
        false;
  
      this.clearPollingTimer();
  
      this.status =
        "stopped";
  
      this.touch();
  
      if (
        options.stopFactory &&
        !this.factory.isStopped()
      ) {
        await this.factory.stop({
          graceful:
            options
              .gracefulFactoryStop ??
            true,
        });
      }
  
      return {
        success: true,
  
        previousStatus,
  
        currentStatus:
          this.status,
  
        changedAt:
          new Date(),
      };
    }
  
    recover(): WonderSchedulerLifecycleResult {
      const previousStatus =
        this.status;
  
      this.pollingEnabled =
        false;
  
      this.clearPollingTimer();
  
      this.status =
        "idle";
  
      this.touch();
  
      return {
        success: true,
  
        previousStatus,
  
        currentStatus:
          this.status,
  
        changedAt:
          new Date(),
      };
    }
  
    // =========================================================
    // TICK
    // =========================================================
  
    async tick(
      at = new Date()
    ): Promise<WonderSchedulerTickResult> {
      const startedAt =
        new Date();
  
      this.tickSequence +=
        1;
  
      const tickNumber =
        this.tickSequence;
  
      if (
        this.tickInProgress
      ) {
        const completedAt =
          new Date();
  
        return {
          tickNumber,
  
          startedAt,
  
          completedAt,
  
          durationMilliseconds:
            Math.max(
              0,
              completedAt.getTime() -
                startedAt.getTime()
            ),
  
          dueSchedules: 0,
  
          submittedJobs: 0,
  
          completedSchedules: 0,
  
          failedSchedules: 0,
  
          submissions: [],
  
          failures: [
            {
              scheduleId:
                this.id,
  
              scheduleName:
                this.name,
  
              scheduledFor:
                new Date(
                  at.getTime()
                ),
  
              message:
                "A scheduler tick is already in progress.",
            },
          ],
        };
      }
  
      this.tickInProgress =
        true;
  
      const submissions:
        WonderSchedulerTickSubmission[] =
        [];
  
      const failures:
        WonderSchedulerTickFailure[] =
        [];
  
      let completedSchedules =
        0;
  
      let failedSchedules =
        0;
  
      const dueSchedules =
        this.listDueSchedules(
          at
        );
  
      try {
        for (
          const schedule of
            dueSchedules
        ) {
          if (
            submissions.length >=
            this.options
              .maximumSubmissionsPerTick
          ) {
            break;
          }
  
          const result =
            await this.processDueSchedule(
              schedule,
              at,
              this.options
                .maximumSubmissionsPerTick -
                submissions.length
            );
  
          submissions.push(
            ...result.submissions
          );
  
          failures.push(
            ...result.failures
          );
  
          completedSchedules +=
            result.completed
              ? 1
              : 0;
  
          failedSchedules +=
            result.failed
              ? 1
              : 0;
  
          if (
            result.failed &&
            !this.options
              .continueOnSubmissionError
          ) {
            break;
          }
        }
      } finally {
        this.tickInProgress =
          false;
  
        this.lastTickAt =
          new Date();
  
        this.touch();
      }
  
      const completedAt =
        new Date();
  
      return {
        tickNumber,
  
        startedAt,
  
        completedAt,
  
        durationMilliseconds:
          Math.max(
            0,
            completedAt.getTime() -
              startedAt.getTime()
          ),
  
        dueSchedules:
          dueSchedules.length,
  
        submittedJobs:
          submissions.length,
  
        completedSchedules,
  
        failedSchedules,
  
        submissions,
  
        failures,
      };
    }
  
    // =========================================================
    // PROCESSING
    // =========================================================
  
    private async processDueSchedule(
      inputSchedule:
        WonderSchedule<unknown>,
      at: Date,
      remainingSubmissionSlots: number
    ): Promise<{
      submissions:
        WonderSchedulerTickSubmission[];
  
      failures:
        WonderSchedulerTickFailure[];
  
      completed: boolean;
  
      failed: boolean;
    }> {
      let schedule =
        this.requireSchedule(
          inputSchedule.id
        );
  
      const submissions:
        WonderSchedulerTickSubmission[] =
        [];
  
      const failures:
        WonderSchedulerTickFailure[] =
        [];
  
      let completed =
        false;
  
      let failed =
        false;
  
      while (
        remainingSubmissionSlots >
          submissions.length &&
        isScheduleDue(
          schedule,
          at
        )
      ) {
        const scheduledFor =
          schedule.nextRunAt
            ? new Date(
                schedule.nextRunAt
                  .getTime()
              )
            : new Date(
                at.getTime()
              );
  
        try {
          const submission =
            await this.submitScheduleOccurrence(
              schedule,
              scheduledFor
            );
  
          submissions.push(
            submission
          );
  
          schedule =
            this.recordSuccessfulRun(
              schedule,
              scheduledFor,
              submission.jobId,
              at
            );
  
          this.storeSchedule(
            schedule
          );
  
          if (
            schedule.status ===
              "completed"
          ) {
            completed =
              true;
  
            break;
          }
  
          if (
            schedule.type ===
              "interval" &&
            schedule.configuration
              .type ===
              "interval" &&
            schedule.configuration
              .misfirePolicy ===
              "run-once"
          ) {
            schedule =
              advanceScheduleBeyondDate(
                schedule,
                at
              );
  
            this.storeSchedule(
              schedule
            );
  
            break;
          }
        } catch (error) {
          const message =
            getErrorMessage(
              error
            );
  
          failures.push({
            scheduleId:
              schedule.id,
  
            scheduleName:
              schedule.name,
  
            scheduledFor,
  
            message,
          });
  
          schedule =
            this.recordFailedRun(
              schedule,
              scheduledFor,
              error
            );
  
          this.storeSchedule(
            schedule
          );
  
          failed =
            true;
  
          break;
        }
      }
  
      return {
        submissions,
  
        failures,
  
        completed,
  
        failed,
      };
    }
  
    private async submitScheduleOccurrence(
      schedule:
        WonderSchedule<unknown>,
      scheduledFor: Date
    ): Promise<
      WonderSchedulerTickSubmission
    > {
      const input =
        createJobInputFromSchedule(
          schedule,
          scheduledFor
        );
  
      const result:
        WonderFactoryJobSubmissionResult<unknown> =
        await this.factory
          .submitJob(input);
  
      if (!result.success) {
        throw new Error(
          `WonderScheduler: Factory rejected schedule "${schedule.id}".`
        );
      }
  
      this.submittedJobCount +=
        1;
  
      return {
        scheduleId:
          schedule.id,
  
        scheduleName:
          schedule.name,
  
        scheduledFor:
          new Date(
            scheduledFor.getTime()
          ),
  
        jobId:
          result.job.id,
  
        batchId:
          result.job.batchId,
  
        jobType:
          result.job.type,
      };
    }
  
    private recordSuccessfulRun(
      schedule:
        WonderSchedule<unknown>,
      scheduledFor: Date,
      jobId: string,
      at: Date
    ): WonderSchedule<unknown> {
      const nextRunCount =
        schedule.runCount + 1;
  
      const nextRunAt =
        calculateNextRunAt(
          schedule,
          scheduledFor,
          nextRunCount,
          at
        );
  
      const completed =
        nextRunAt === null;
  
      const now =
        new Date();
  
      return {
        ...cloneSchedule(
          schedule
        ),
  
        status:
          completed
            ? "completed"
            : "active",
  
        runCount:
          nextRunCount,
  
        successfulRunCount:
          schedule
            .successfulRunCount +
          1,
  
        lastRunAt:
          new Date(
            now.getTime()
          ),
  
        lastScheduledFor:
          new Date(
            scheduledFor.getTime()
          ),
  
        nextRunAt,
  
        lastJobId:
          jobId,
  
        lastError: null,
  
        completedAt:
          completed
            ? new Date(
                now.getTime()
              )
            : null,
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      };
    }
  
    private recordFailedRun(
      schedule:
        WonderSchedule<unknown>,
      scheduledFor: Date,
      error: unknown
    ): WonderSchedule<unknown> {
      const now =
        new Date();
  
      return {
        ...cloneSchedule(
          schedule
        ),
  
        status:
          "error",
  
        runCount:
          schedule.runCount +
          1,
  
        failedRunCount:
          schedule.failedRunCount +
          1,
  
        lastRunAt:
          new Date(
            now.getTime()
          ),
  
        lastScheduledFor:
          new Date(
            scheduledFor.getTime()
          ),
  
        nextRunAt: null,
  
        lastError: {
          message:
            getErrorMessage(
              error
            ),
  
          occurredAt:
            new Date(
              now.getTime()
            ),
  
          details: {
            scheduleId:
              schedule.id,
  
            scheduledFor:
              scheduledFor
                .toISOString(),
          },
        },
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      };
    }
  
    // =========================================================
    // AUTOMATIC POLLING
    // =========================================================
  
    private scheduleNextPoll(): void {
      if (
        !this.pollingEnabled ||
        this.status !==
          "running" ||
        this.pollingTimer !==
          null
      ) {
        return;
      }
  
      this.pollingTimer =
        setTimeout(
          () => {
            this.pollingTimer =
              null;
  
            void this.runAutomaticPoll();
          },
          this.options
            .pollingIntervalMilliseconds
        );
    }
  
    private async runAutomaticPoll(): Promise<void> {
      if (
        !this.pollingEnabled ||
        this.status !==
          "running"
      ) {
        return;
      }
  
      try {
        await this.tick();
      } catch {
        this.status =
          "error";
  
        this.pollingEnabled =
          false;
  
        this.touch();
  
        return;
      }
  
      this.scheduleNextPoll();
    }
  
    private clearPollingTimer(): void {
      if (
        this.pollingTimer ===
        null
      ) {
        return;
      }
  
      clearTimeout(
        this.pollingTimer
      );
  
      this.pollingTimer =
        null;
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    getStatistics(
      at = new Date()
    ): WonderSchedulerStatistics {
      const schedules =
        this.listSchedules();
  
      let activeSchedules =
        0;
  
      let pausedSchedules =
        0;
  
      let completedSchedules =
        0;
  
      let cancelledSchedules =
        0;
  
      let errorSchedules =
        0;
  
      let dueSchedules =
        0;
  
      let totalRuns =
        0;
  
      let successfulRuns =
        0;
  
      let failedRuns =
        0;
  
      let nextRunAt:
        Date | null = null;
  
      for (
        const schedule of
          schedules
      ) {
        totalRuns +=
          schedule.runCount;
  
        successfulRuns +=
          schedule
            .successfulRunCount;
  
        failedRuns +=
          schedule.failedRunCount;
  
        switch (
          schedule.status
        ) {
          case "active":
            activeSchedules +=
              1;
            break;
  
          case "paused":
            pausedSchedules +=
              1;
            break;
  
          case "completed":
            completedSchedules +=
              1;
            break;
  
          case "cancelled":
            cancelledSchedules +=
              1;
            break;
  
          case "error":
            errorSchedules +=
              1;
            break;
        }
  
        if (
          isScheduleDue(
            schedule,
            at
          )
        ) {
          dueSchedules +=
            1;
        }
  
        if (
          schedule.status ===
            "active" &&
          schedule.nextRunAt &&
          (
            nextRunAt === null ||
            schedule.nextRunAt
              .getTime() <
              nextRunAt.getTime()
          )
        ) {
          nextRunAt =
            new Date(
              schedule.nextRunAt
                .getTime()
            );
        }
      }
  
      return {
        schedulerId:
          this.id,
  
        status:
          this.status,
  
        totalSchedules:
          schedules.length,
  
        activeSchedules,
  
        pausedSchedules,
  
        completedSchedules,
  
        cancelledSchedules,
  
        errorSchedules,
  
        dueSchedules,
  
        totalRuns,
  
        successfulRuns,
  
        failedRuns,
  
        tickCount:
          this.tickSequence,
  
        submittedJobCount:
          this.submittedJobCount,
  
        lastTickAt:
          this.lastTickAt
            ? new Date(
                this.lastTickAt
                  .getTime()
              )
            : null,
  
        nextRunAt,
      };
    }
  
    // =========================================================
    // SNAPSHOT
    // =========================================================
  
    createSnapshot(): WonderSchedulerSnapshot {
      return {
        version:
          WONDER_SCHEDULER_SNAPSHOT_VERSION,
  
        schedulerId:
          this.id,
  
        schedulerName:
          this.name,
  
        createdAt:
          new Date(),
  
        schedules:
          this.listSchedules(),
      };
    }
  
    importSnapshot(
      snapshot:
        WonderSchedulerSnapshot,
      replaceExisting = false
    ): WonderSchedulerImportResult {
      validateSchedulerSnapshot(
        snapshot
      );
  
      if (replaceExisting) {
        this.schedules.clear();
      }
  
      let importedSchedules =
        0;
  
      let skippedSchedules =
        0;
  
      for (
        const schedule of
          snapshot.schedules
      ) {
        if (
          this.schedules.has(
            schedule.id
          )
        ) {
          skippedSchedules +=
            1;
  
          continue;
        }
  
        this.schedules.set(
          schedule.id,
          cloneSchedule(
            schedule
          )
        );
  
        importedSchedules +=
          1;
      }
  
      this.touch();
  
      return {
        importedSchedules,
  
        skippedSchedules,
  
        replacedExisting:
          replaceExisting,
      };
    }
  
    // =========================================================
    // INTERNAL STORAGE
    // =========================================================
  
    private requireSchedule(
      scheduleId: string
    ): WonderSchedule<unknown> {
      const cleanScheduleId =
        normaliseRequiredText(
          scheduleId,
          "scheduleId"
        );
  
      const schedule =
        this.schedules.get(
          cleanScheduleId
        );
  
      if (!schedule) {
        throw new Error(
          `WonderScheduler: schedule "${cleanScheduleId}" was not found.`
        );
      }
  
      return cloneSchedule(
        schedule
      );
    }
  
    private storeSchedule(
      schedule:
        WonderSchedule<unknown>
    ): void {
      this.schedules.set(
        schedule.id,
        cloneSchedule(
          schedule
        )
      );
  
      this.touch();
    }
  
    private touch(): void {
      this.updatedAt =
        new Date();
    }
  }
  
  // =========================================================
  // SCHEDULE CREATION
  // =========================================================
  
  function createWonderSchedule<
    TPayload
  >(
    input:
      WonderScheduleCreateInput<TPayload>
  ): WonderSchedule<TPayload> {
    const now =
      new Date();
  
    const id =
      normaliseOptionalText(
        input.id
      ) ??
      createScheduleId(
        input.type,
        now
      );
  
    const name =
      normaliseOptionalText(
        input.name
      ) ??
      id;
  
    const job =
      cloneJobTemplate(
        input.job
      );
  
    const enabled =
      input.enabled ??
      true;
  
    const configuration =
      createScheduleConfiguration(
        input,
        now
      );
  
    const nextRunAt =
      enabled
        ? getInitialRunAt(
            configuration
          )
        : getInitialRunAt(
            configuration
          );
  
    return {
      id,
  
      name,
  
      type:
        input.type,
  
      status:
        enabled
          ? "active"
          : "paused",
  
      job,
  
      configuration,
  
      tags:
        uniqueStrings(
          input.tags ??
          []
        ),
  
      metadata: {
        ...(input.metadata ??
          {}),
      },
  
      runCount: 0,
  
      successfulRunCount: 0,
  
      failedRunCount: 0,
  
      lastRunAt: null,
  
      lastScheduledFor: null,
  
      nextRunAt,
  
      lastJobId: null,
  
      lastError: null,
  
      createdAt:
        new Date(
          now.getTime()
        ),
  
      updatedAt:
        new Date(
          now.getTime()
        ),
  
      completedAt: null,
  
      cancelledAt: null,
    };
  }
  
  function createScheduleConfiguration<
    TPayload
  >(
    input:
      WonderScheduleCreateInput<TPayload>,
    now: Date
  ): WonderScheduleConfiguration {
    if (
      input.type ===
      "once"
    ) {
      return {
        type:
          "once",
  
        runAt:
          cloneValidDateOrThrow(
            input.runAt,
            "runAt"
          ),
      };
    }
  
    const startAt =
      input.startAt
        ? cloneValidDateOrThrow(
            input.startAt,
            "startAt"
          )
        : new Date(
            now.getTime()
          );
  
    const intervalMilliseconds =
      Math.max(
        MINIMUM_INTERVAL_MILLISECONDS,
        Math.floor(
          input.intervalMilliseconds
        )
      );
  
    if (
      !Number.isFinite(
        input.intervalMilliseconds
      ) ||
      input.intervalMilliseconds <
        MINIMUM_INTERVAL_MILLISECONDS
    ) {
      throw new Error(
        "WonderScheduler: intervalMilliseconds must be a positive finite number."
      );
    }
  
    const endAt =
      input.endAt
        ? cloneValidDateOrThrow(
            input.endAt,
            "endAt"
          )
        : null;
  
    if (
      endAt &&
      endAt.getTime() <
        startAt.getTime()
    ) {
      throw new Error(
        "WonderScheduler: endAt cannot occur before startAt."
      );
    }
  
    const maximumRuns =
      input.maximumRuns ===
        undefined ||
      input.maximumRuns ===
        null
        ? null
        : clampInteger(
            input.maximumRuns,
            1,
            MAXIMUM_RUNS
          );
  
    return {
      type:
        "interval",
  
      startAt,
  
      intervalMilliseconds,
  
      endAt,
  
      maximumRuns,
  
      misfirePolicy:
        input.misfirePolicy ??
        "run-once",
    };
  }
  
  function getInitialRunAt(
    configuration:
      WonderScheduleConfiguration
  ): Date {
    if (
      configuration.type ===
      "once"
    ) {
      return new Date(
        configuration.runAt
          .getTime()
      );
    }
  
    return new Date(
      configuration.startAt
        .getTime()
    );
  }
  
  // =========================================================
  // JOB CREATION
  // =========================================================
  
  function createJobInputFromSchedule(
    schedule:
      WonderSchedule<unknown>,
    scheduledFor: Date
  ): WonderJobCreateInput<unknown> {
    const scheduleMetadata =
      schedule.job.metadata;
  
    return {
      batchId:
        schedule.job.batchId,
  
      type:
        schedule.job.type,
  
      payload:
        schedule.job.payload,
  
      priority:
        schedule.job.priority,
  
      totalItems:
        schedule.job.totalItems,
  
      maximumAttempts:
        schedule.job
          .maximumAttempts,
  
      failureStrategy:
        schedule.job
          .failureStrategy,
  
      scheduledAt:
        new Date(
          scheduledFor.getTime()
        ),
  
      metadata: {
        ...scheduleMetadata,
  
        source:
          scheduleMetadata
            ?.source ??
          "WonderScheduler",
  
        tags:
          uniqueStrings([
            ...(
              scheduleMetadata
                ?.tags ??
              []
            ),
            ...schedule.tags,
            "scheduled",
            schedule.type,
          ]),
  
        correlationId:
          scheduleMetadata
            ?.correlationId ??
          schedule.id,
  
        values: {
          ...(
            scheduleMetadata
              ?.values ??
            {}
          ),
  
          scheduleId:
            schedule.id,
  
          scheduleName:
            schedule.name,
  
          scheduleType:
            schedule.type,
  
          scheduledFor:
            scheduledFor
              .toISOString(),
  
          scheduleRunNumber:
            schedule.runCount +
            1,
  
          ...schedule.metadata,
        },
      },
    };
  }
  
  // =========================================================
  // NEXT RUN CALCULATION
  // =========================================================
  
  function calculateNextRunAt(
    schedule:
      WonderSchedule<unknown>,
    scheduledFor: Date,
    nextRunCount: number,
    at: Date
  ): Date | null {
    if (
      schedule.configuration
        .type === "once"
    ) {
      return null;
    }
  
    const configuration =
      schedule.configuration;
  
    if (
      configuration.maximumRuns !==
        null &&
      nextRunCount >=
        configuration.maximumRuns
    ) {
      return null;
    }
  
    let nextRunAt =
      new Date(
        scheduledFor.getTime() +
        configuration
          .intervalMilliseconds
      );
  
    if (
      configuration.misfirePolicy ===
        "run-once"
    ) {
      while (
        nextRunAt.getTime() <=
        at.getTime()
      ) {
        nextRunAt =
          new Date(
            nextRunAt.getTime() +
            configuration
              .intervalMilliseconds
          );
      }
    }
  
    if (
      configuration.endAt &&
      nextRunAt.getTime() >
        configuration.endAt
          .getTime()
    ) {
      return null;
    }
  
    return nextRunAt;
  }
  
  function advanceScheduleBeyondDate(
    schedule:
      WonderSchedule<unknown>,
    at: Date
  ): WonderSchedule<unknown> {
    if (
      schedule.configuration
        .type !== "interval" ||
      schedule.nextRunAt ===
        null
    ) {
      return cloneSchedule(
        schedule
      );
    }
  
    let nextRunAt =
      new Date(
        schedule.nextRunAt
          .getTime()
      );
  
    while (
      nextRunAt.getTime() <=
      at.getTime()
    ) {
      nextRunAt =
        new Date(
          nextRunAt.getTime() +
          schedule.configuration
            .intervalMilliseconds
        );
    }
  
    if (
      schedule.configuration
        .endAt &&
      nextRunAt.getTime() >
        schedule.configuration
          .endAt.getTime()
    ) {
      return {
        ...cloneSchedule(
          schedule
        ),
  
        status:
          "completed",
  
        nextRunAt: null,
  
        completedAt:
          new Date(),
  
        updatedAt:
          new Date(),
      };
    }
  
    return {
      ...cloneSchedule(
        schedule
      ),
  
      nextRunAt,
  
      updatedAt:
        new Date(),
    };
  }
  
  function calculateResumeDate(
    schedule:
      WonderSchedule<unknown>,
    at: Date
  ): Date {
    if (
      schedule.configuration
        .type === "once"
    ) {
      return schedule.nextRunAt
        ? new Date(
            Math.max(
              schedule.nextRunAt
                .getTime(),
              at.getTime()
            )
          )
        : new Date(
            at.getTime()
          );
    }
  
    const configuration =
      schedule.configuration;
  
    let nextRunAt =
      schedule.nextRunAt
        ? new Date(
            schedule.nextRunAt
              .getTime()
          )
        : new Date(
            configuration
              .startAt.getTime()
          );
  
    while (
      nextRunAt.getTime() <
      at.getTime()
    ) {
      nextRunAt =
        new Date(
          nextRunAt.getTime() +
          configuration
            .intervalMilliseconds
        );
    }
  
    return nextRunAt;
  }
  
  // =========================================================
  // DUE CHECK
  // =========================================================
  
  export function isScheduleDue(
    schedule:
      WonderSchedule<unknown>,
    at = new Date()
  ): boolean {
    return (
      schedule.status ===
        "active" &&
      schedule.nextRunAt !==
        null &&
      schedule.nextRunAt
        .getTime() <=
        at.getTime()
    );
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  export function cloneSchedule<
    TPayload
  >(
    schedule:
      WonderSchedule<TPayload>
  ): WonderSchedule<TPayload> {
    return {
      ...schedule,
  
      job:
        cloneJobTemplate(
          schedule.job
        ),
  
      configuration:
        cloneConfiguration(
          schedule.configuration
        ),
  
      tags: [
        ...schedule.tags,
      ],
  
      metadata: {
        ...schedule.metadata,
      },
  
      lastRunAt:
        schedule.lastRunAt
          ? new Date(
              schedule.lastRunAt
                .getTime()
            )
          : null,
  
      lastScheduledFor:
        schedule
          .lastScheduledFor
          ? new Date(
              schedule
                .lastScheduledFor
                .getTime()
            )
          : null,
  
      nextRunAt:
        schedule.nextRunAt
          ? new Date(
              schedule.nextRunAt
                .getTime()
            )
          : null,
  
      lastError:
        schedule.lastError
          ? {
              ...schedule.lastError,
  
              occurredAt:
                new Date(
                  schedule
                    .lastError
                    .occurredAt
                    .getTime()
                ),
  
              details: {
                ...schedule
                  .lastError
                  .details,
              },
            }
          : null,
  
      createdAt:
        new Date(
          schedule.createdAt
            .getTime()
        ),
  
      updatedAt:
        new Date(
          schedule.updatedAt
            .getTime()
        ),
  
      completedAt:
        schedule.completedAt
          ? new Date(
              schedule.completedAt
                .getTime()
            )
          : null,
  
      cancelledAt:
        schedule.cancelledAt
          ? new Date(
              schedule.cancelledAt
                .getTime()
            )
          : null,
    };
  }
  
  function cloneJobTemplate<
    TPayload
  >(
    template:
      WonderScheduledJobTemplate<TPayload>
  ): WonderScheduledJobTemplate<TPayload> {
    return {
      ...template,
  
      metadata:
        template.metadata
          ? {
              ...template.metadata,
  
              tags:
                template.metadata
                  .tags
                  ? [
                      ...template
                        .metadata
                        .tags,
                    ]
                  : undefined,
  
              values:
                template.metadata
                  .values
                  ? {
                      ...template
                        .metadata
                        .values,
                    }
                  : undefined,
            }
          : undefined,
    };
  }
  
  function cloneConfiguration(
    configuration:
      WonderScheduleConfiguration
  ): WonderScheduleConfiguration {
    if (
      configuration.type ===
      "once"
    ) {
      return {
        type:
          "once",
  
        runAt:
          new Date(
            configuration.runAt
              .getTime()
          ),
      };
    }
  
    return {
      type:
        "interval",
  
      startAt:
        new Date(
          configuration.startAt
            .getTime()
        ),
  
      intervalMilliseconds:
        configuration
          .intervalMilliseconds,
  
      endAt:
        configuration.endAt
          ? new Date(
              configuration.endAt
                .getTime()
            )
          : null,
  
      maximumRuns:
        configuration
          .maximumRuns,
  
      misfirePolicy:
        configuration
          .misfirePolicy,
    };
  }
  
  // =========================================================
  // SNAPSHOT VALIDATION
  // =========================================================
  
  function validateSchedulerSnapshot(
    snapshot:
      WonderSchedulerSnapshot
  ): void {
    if (
      snapshot.version !==
      WONDER_SCHEDULER_SNAPSHOT_VERSION
    ) {
      throw new Error(
        `WonderScheduler: unsupported snapshot version "${snapshot.version}".`
      );
    }
  
    if (
      !isValidDate(
        snapshot.createdAt
      )
    ) {
      throw new Error(
        "WonderScheduler: snapshot createdAt is invalid."
      );
    }
  
    if (
      !Array.isArray(
        snapshot.schedules
      )
    ) {
      throw new Error(
        "WonderScheduler: snapshot schedules must be an array."
      );
    }
  
    for (
      const schedule of
        snapshot.schedules
    ) {
      validateSchedule(
        schedule
      );
    }
  }
  
  function validateSchedule(
    schedule:
      WonderSchedule<unknown>
  ): void {
    normaliseRequiredText(
      schedule.id,
      "schedule.id"
    );
  
    normaliseRequiredText(
      schedule.name,
      "schedule.name"
    );
  
    if (
      !isWonderScheduleStatus(
        schedule.status
      )
    ) {
      throw new Error(
        `WonderScheduler: schedule "${schedule.id}" has an invalid status.`
      );
    }
  
    if (
      !isValidDate(
        schedule.createdAt
      ) ||
      !isValidDate(
        schedule.updatedAt
      )
    ) {
      throw new Error(
        `WonderScheduler: schedule "${schedule.id}" contains invalid dates.`
      );
    }
  
    if (
      schedule.nextRunAt &&
      !isValidDate(
        schedule.nextRunAt
      )
    ) {
      throw new Error(
        `WonderScheduler: schedule "${schedule.id}" has an invalid nextRunAt.`
      );
    }
  }
  
  // =========================================================
  // SORTING
  // =========================================================
  
  function compareSchedules(
    first:
      WonderSchedule<unknown>,
    second:
      WonderSchedule<unknown>
  ): number {
    if (
      first.nextRunAt &&
      second.nextRunAt
    ) {
      const difference =
        first.nextRunAt
          .getTime() -
        second.nextRunAt
          .getTime();
  
      if (
        difference !== 0
      ) {
        return difference;
      }
    } else if (
      first.nextRunAt
    ) {
      return -1;
    } else if (
      second.nextRunAt
    ) {
      return 1;
    }
  
    return first.id.localeCompare(
      second.id
    );
  }
  
  // =========================================================
  // TYPE GUARDS
  // =========================================================
  
  export function isWonderSchedulerStatus(
    value: unknown
  ): value is WonderSchedulerStatus {
    return (
      value === "idle" ||
      value === "running" ||
      value === "paused" ||
      value === "stopped" ||
      value === "error"
    );
  }
  
  export function isWonderScheduleStatus(
    value: unknown
  ): value is WonderScheduleStatus {
    return (
      value === "active" ||
      value === "paused" ||
      value === "completed" ||
      value === "cancelled" ||
      value === "error"
    );
  }
  
  export function isWonderScheduleType(
    value: unknown
  ): value is WonderScheduleType {
    return (
      value === "once" ||
      value === "interval"
    );
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolveSchedulerOptions(
    options:
      WonderSchedulerOptions
  ): ResolvedWonderSchedulerOptions {
    return {
      id:
        normaliseOptionalText(
          options.id
        ) ??
        DEFAULT_SCHEDULER_ID,
  
      name:
        normaliseOptionalText(
          options.name
        ) ??
        DEFAULT_SCHEDULER_NAME,
  
      pollingIntervalMilliseconds:
        Math.max(
          MINIMUM_POLLING_INTERVAL_MILLISECONDS,
          Math.floor(
            options
              .pollingIntervalMilliseconds ??
            DEFAULT_POLLING_INTERVAL_MILLISECONDS
          )
        ),
  
      maximumSubmissionsPerTick:
        clampInteger(
          options
            .maximumSubmissionsPerTick ??
          DEFAULT_MAXIMUM_SUBMISSIONS_PER_TICK,
          1,
          MAXIMUM_SUBMISSIONS_PER_TICK
        ),
  
      startFactoryIfNeeded:
        options
          .startFactoryIfNeeded ??
        true,
  
      continueOnSubmissionError:
        options
          .continueOnSubmissionError ??
        true,
  
      automaticPolling:
        options.automaticPolling ??
        true,
    };
  }
  
  // =========================================================
  // IDS
  // =========================================================
  
  function createScheduleId(
    type: WonderScheduleType,
    createdAt: Date
  ): string {
    const hash =
      hashText(
        [
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
      "wonder-schedule",
      type,
      hash,
    ].join("-");
  }
  
  function hashText(
    text: string
  ): number {
    let hash =
      2166136261;
  
    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(
          index
        );
  
      hash =
        Math.imul(
          hash,
          16777619
        );
    }
  
    return hash >>> 0;
  }
  
  // =========================================================
  // TEXT HELPERS
  // =========================================================
  
  function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    if (
      typeof value !==
      "string"
    ) {
      throw new Error(
        `WonderScheduler: "${fieldName}" must be a string.`
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new Error(
        `WonderScheduler: "${fieldName}" is required.`
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
      typeof value !==
      "string"
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
    values:
      readonly string[]
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
              value.length >
              0
          )
      )
    );
  }
  
  // =========================================================
  // DATE HELPERS
  // =========================================================
  
  function cloneValidDateOrThrow(
    value: Date,
    fieldName: string
  ): Date {
    if (
      !isValidDate(value)
    ) {
      throw new Error(
        `WonderScheduler: "${fieldName}" must be a valid Date.`
      );
    }
  
    return new Date(
      value.getTime()
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
  
  // =========================================================
  // NUMBER HELPERS
  // =========================================================
  
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
  
  // =========================================================
  // ERROR HELPERS
  // =========================================================
  
  function getErrorMessage(
    error: unknown
  ): string {
    if (
      error instanceof Error
    ) {
      return error.message;
    }
  
    return String(error);
  }
  
  // =========================================================
  // DEFAULT INSTANCE
  // =========================================================
  
  export const wonderScheduler =
    new WonderScheduler();
  
  export default WonderScheduler;