import {
    WonderQueue,
  } from "./queue/WonderQueue";
  
  import type {
    WonderQueueOptions,
    WonderQueueStatistics,
  } from "./queue/WonderQueue";
  
  import {
    WonderWorkerRegistry,
  } from "./workers/WonderWorker";
  
  import type {
    WonderWorker,
    WonderWorkerRegistryStatistics,
    WonderWorkerSnapshot,
  } from "./workers/WonderWorker";
  
  import type {
    WonderJob,
    WonderJobCreateInput,
    WonderJobType,
  } from "./types/WonderJob";
  
  import {
    wonderOSEventBus,
  } from "@/core/WonderEvents";
  
  import type {
    WonderOSEventBus,
  } from "@/core/WonderEvents";
  
  // =========================================================
  // FACTORY TYPES
  // =========================================================
  
  export type WonderFactoryStatus =
    | "idle"
    | "running"
    | "paused"
    | "stopping"
    | "stopped"
    | "error";
  
  export type WonderFactoryExecutionMode =
    | "single"
    | "parallel";
  
  export interface WonderFactoryOptions {
    /**
     * Human-readable Factory identifier.
     */
    id?: string;
  
    /**
     * Human-readable Factory name.
     */
    name?: string;
  
    /**
     * Maximum jobs allowed to execute concurrently.
     */
    maximumConcurrentJobs?: number;
  
    /**
     * Execution mode used by future Factory ticks.
     */
    executionMode?: WonderFactoryExecutionMode;
  
    /**
     * Delay between automatic polling cycles.
     */
    pollingIntervalMilliseconds?: number;
  
    /**
     * Worker heartbeat expiry limit.
     */
    workerHeartbeatTimeoutMilliseconds?: number;
  
    /**
     * Queue lock duration when jobs are claimed.
     */
    jobLockDurationMilliseconds?: number;
  
    /**
     * Automatically retry retryable failed jobs.
     */
    autoRetryFailedJobs?: boolean;
  
    /**
     * Base retry delay.
     */
    retryDelayMilliseconds?: number;
  
    /**
     * Stop execution when one job fails.
     */
    stopOnJobFailure?: boolean;
  
    /**
     * Emit WonderOS events.
     */
    emitEvents?: boolean;
  
    /**
     * Optional settings used when the Factory creates its queue.
     */
    queue?: WonderQueueOptions;
  }
  
  export interface WonderFactoryDependencies {
    queue?: WonderQueue;
  
    workers?: WonderWorkerRegistry;
  
    eventBus?: WonderOSEventBus;
  }
  
  export interface WonderFactorySnapshot {
    id: string;
  
    name: string;
  
    status: WonderFactoryStatus;
  
    executionMode: WonderFactoryExecutionMode;
  
    maximumConcurrentJobs: number;
  
    activeJobCount: number;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    startedAt: Date | null;
  
    stoppedAt: Date | null;
  
    queue: WonderQueueStatistics;
  
    workers: WonderWorkerRegistryStatistics;
  }
  
  export interface WonderFactoryStatistics {
    factoryId: string;
  
    status: WonderFactoryStatus;
  
    totalWorkers: number;
  
    availableWorkers: number;
  
    busyWorkers: number;
  
    totalJobs: number;
  
    queuedJobs: number;
  
    processingJobs: number;
  
    completedJobs: number;
  
    failedJobs: number;
  
    cancelledJobs: number;
  
    activeExecutions: number;
  
    totalExecutionStarted: number;
  
    totalExecutionCompleted: number;
  
    totalExecutionFailed: number;
  
    uptimeMilliseconds: number;
  }
  
  export interface WonderFactoryHealthReport {
    healthy: boolean;
  
    status: WonderFactoryStatus;
  
    checkedAt: Date;
  
    issues: WonderFactoryHealthIssue[];
  
    queue: WonderQueueStatistics;
  
    workers: WonderWorkerRegistryStatistics;
  }
  
  export interface WonderFactoryHealthIssue {
    code: string;
  
    severity:
      | "info"
      | "warning"
      | "error";
  
    message: string;
  }
  
  export interface WonderFactoryWorkerRegistrationResult {
    success: boolean;
  
    worker: WonderWorkerSnapshot;
  
    totalWorkers: number;
  }
  
  export interface WonderFactoryJobSubmissionResult<
    TPayload = unknown
  > {
    success: boolean;
  
    job: WonderJob<
      TPayload,
      never
    >;
  
    queueSize: number;
  
    eventErrors: string[];
  }
  
  export interface WonderFactoryStartOptions {
    /**
     * Jalankan polling loop secara automatik.
     *
     * Defaults to true.
     */
    automaticPolling?: boolean;
  }
  
  export interface WonderFactoryStopOptions {
    /**
     * Tunggu active executions selesai sebelum berhenti.
     */
    graceful?: boolean;
  
    /**
     * Tempoh maksimum menunggu graceful shutdown.
     */
    timeoutMilliseconds?: number;
  
    /**
     * Batalkan kerja aktif apabila timeout dicapai.
     */
    cancelActiveJobsOnTimeout?: boolean;
  }
  
  export interface WonderFactoryTickResult {
    tickNumber: number;
  
    startedAt: Date;
  
    completedAt: Date;
  
    durationMilliseconds: number;
  
    status: WonderFactoryStatus;
  
    releasedExpiredLocks: number;
  
    unavailableWorkers: number;
  
    availableExecutionSlots: number;
  
    jobsStarted: number;
  
    activeJobCount: number;
  
    queue: WonderQueueStatistics;
  
    errors: string[];
  }
  
  export interface WonderFactoryRunUntilIdleOptions {
    /**
     * Bilangan maksimum tick sebelum proses dihentikan.
     */
    maximumTicks?: number;
  
    /**
     * Tempoh maksimum keseluruhan operasi.
     */
    timeoutMilliseconds?: number;
  
    /**
     * Jeda antara setiap tick.
     */
    intervalMilliseconds?: number;
  
    /**
     * Berhenti jika tiada progress selepas beberapa tick.
     */
    maximumIdleTicks?: number;
  
    /**
     * Mulakan Factory secara automatik jika belum running.
     */
    startIfNeeded?: boolean;
  }
  
  export interface WonderFactoryRunUntilIdleResult {
    success: boolean;
  
    idle: boolean;
  
    startedAt: Date;
  
    completedAt: Date;
  
    durationMilliseconds: number;
  
    tickCount: number;
  
    jobsStarted: number;
  
    finalStatistics: WonderFactoryStatistics;
  
    errors: string[];
  }
  
  export interface WonderFactoryLifecycleResult {
    success: boolean;
  
    previousStatus: WonderFactoryStatus;
  
    currentStatus: WonderFactoryStatus;
  
    changedAt: Date;
  }

  interface ResolvedWonderFactoryOptions {
    id: string;
  
    name: string;
  
    maximumConcurrentJobs: number;
  
    executionMode: WonderFactoryExecutionMode;
  
    pollingIntervalMilliseconds: number;
  
    workerHeartbeatTimeoutMilliseconds: number;
  
    jobLockDurationMilliseconds: number;
  
    autoRetryFailedJobs: boolean;
  
    retryDelayMilliseconds: number;
  
    stopOnJobFailure: boolean;
  
    emitEvents: boolean;
  
    queue: WonderQueueOptions;
  }
  
  const DEFAULT_FACTORY_ID =
    "wonder-factory";
  
  const DEFAULT_FACTORY_NAME =
    "Wonder Factory";
  
  const DEFAULT_MAXIMUM_CONCURRENT_JOBS =
    4;
  
  const MAXIMUM_CONCURRENT_JOBS =
    1_000;
  
  const DEFAULT_POLLING_INTERVAL_MILLISECONDS =
    1_000;
  
  const DEFAULT_HEARTBEAT_TIMEOUT_MILLISECONDS =
    30_000;
  
  const DEFAULT_JOB_LOCK_DURATION_MILLISECONDS =
    5 * 60 * 1_000;
  
  const DEFAULT_RETRY_DELAY_MILLISECONDS =
    5_000;
  
    const DEFAULT_STOP_TIMEOUT_MILLISECONDS =
  30_000;

const DEFAULT_RUN_TIMEOUT_MILLISECONDS =
  5 * 60 * 1_000;

const DEFAULT_MAXIMUM_RUN_TICKS =
  10_000;

const DEFAULT_MAXIMUM_IDLE_TICKS =
  3;

const MINIMUM_POLLING_INTERVAL_MILLISECONDS =
  10;

  // =========================================================
  // FACTORY
  // =========================================================
  
  /**
   * Main orchestration layer for Wonder Factory.
   *
   * Foundation A owns:
   *
   * - Factory identity and configuration
   * - Queue dependency
   * - Worker registry dependency
   * - Event Bus dependency
   * - Worker registration
   * - Job submission
   * - Factory statistics and snapshots
   *
   * Later foundations will add:
   *
   * - lifecycle
   * - tick orchestration
   * - parallel execution
   * - retry handling
   * - health recovery
   * - automatic polling
   */
  export class WonderFactory {


    readonly id: string;
  
    readonly name: string;
  
    private readonly options:
      ResolvedWonderFactoryOptions;
  
    private readonly queue:
      WonderQueue;
  
    private readonly workers:
      WonderWorkerRegistry;
  
    private readonly eventBus:
      WonderOSEventBus;
  
    private status:
      WonderFactoryStatus =
      "idle";
  
    private readonly activeJobIds =
      new Set<string>();
  
    private totalExecutionStarted = 0;
  
    private totalExecutionCompleted = 0;
  
    private totalExecutionFailed = 0;
  
    private readonly createdAt:
      Date;
  
    private updatedAt:
      Date;
  
    private startedAt:
      Date | null = null;
  
    private stoppedAt:
      Date | null = null;
  
      private pollingTimer:
  ReturnType<
    typeof setTimeout
  > | null = null;

private pollingEnabled = false;

private tickInProgress = false;

private tickSequence = 0;

private lastTickAt:
  Date | null = null;

private lastTickResult:
  WonderFactoryTickResult | null = null;

    constructor(
      options: WonderFactoryOptions = {},
      dependencies: WonderFactoryDependencies = {}
    ) {
      const now =
        new Date();
  
      this.options =
        resolveWonderFactoryOptions(
          options
        );
  
      this.id =
        this.options.id;
  
      this.name =
        this.options.name;
  
      this.eventBus =
        dependencies.eventBus ??
        wonderOSEventBus;
  
      this.queue =
        dependencies.queue ??
        new WonderQueue(
          {
            ...this.options.queue,
  
            defaultLockDurationMilliseconds:
              this.options
                .jobLockDurationMilliseconds,
  
            emitEvents:
              this.options.emitEvents,
          },
          this.eventBus
        );
  
      this.workers =
        dependencies.workers ??
        new WonderWorkerRegistry();
  
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
  
    getStatus(): WonderFactoryStatus {
      return this.status;
    }
  
    getOptions(): Readonly<
      ResolvedWonderFactoryOptions
    > {
      return {
        ...this.options,
  
        queue: {
          ...this.options.queue,
        },
      };
    }
  
    getQueue(): WonderQueue {
      return this.queue;
    }
  
    getWorkerRegistry(): WonderWorkerRegistry {
      return this.workers;
    }
  
    getEventBus(): WonderOSEventBus {
      return this.eventBus;
    }
  
    getActiveJobIds(): string[] {
      return Array.from(
        this.activeJobIds
      );
    }
  
    getActiveJobCount(): number {
      return this.activeJobIds.size;
    }
  
    getAvailableExecutionSlots(): number {
      return Math.max(
        0,
        this.options
          .maximumConcurrentJobs -
          this.activeJobIds.size
      );
    }
  
    isRunning(): boolean {
      return (
        this.status ===
        "running"
      );
    }
  
    isPaused(): boolean {
      return (
        this.status ===
        "paused"
      );
    }
  
    isStopped(): boolean {
      return (
        this.status ===
          "stopped" ||
        this.status ===
          "stopping"
      );
    }
  
    hasCapacity(): boolean {
      return (
        this.getAvailableExecutionSlots() >
        0
      );
    }
  // =========================================================
// LIFECYCLE
// =========================================================

async start(
    options: WonderFactoryStartOptions = {}
  ): Promise<WonderFactoryLifecycleResult> {
    const previousStatus =
      this.status;
  
    if (
      this.status === "running"
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
  
    if (
      this.status === "stopping"
    ) {
      throw new Error(
        `WonderFactory: factory "${this.id}" is currently stopping.`
      );
    }
  
    if (
      this.status === "error"
    ) {
      throw new Error(
        `WonderFactory: factory "${this.id}" must be recovered before it can start.`
      );
    }
  
    const now =
      new Date();
  
    this.markStarted(now);
  
    this.setStatus(
      "running"
    );
  
    this.pollingEnabled =
      options.automaticPolling ??
      true;
  
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
        new Date(
          now.getTime()
        ),
    };
  }
  
  pause(): WonderFactoryLifecycleResult {
    const previousStatus =
      this.status;
  
    if (
      this.status === "paused"
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
  
    if (
      this.status !== "running"
    ) {
      throw new Error(
        `WonderFactory: factory "${this.id}" cannot pause from status "${this.status}".`
      );
    }
  
    this.pollingEnabled =
      false;
  
    this.clearPollingTimer();
  
    this.setStatus(
      "paused"
    );
  
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
    options: WonderFactoryStartOptions = {}
  ): WonderFactoryLifecycleResult {
    const previousStatus =
      this.status;
  
    if (
      this.status === "running"
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
  
    if (
      this.status !== "paused"
    ) {
      throw new Error(
        `WonderFactory: factory "${this.id}" cannot resume from status "${this.status}".`
      );
    }
  
    this.setStatus(
      "running"
    );
  
    this.pollingEnabled =
      options.automaticPolling ??
      true;
  
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
    options: WonderFactoryStopOptions = {}
  ): Promise<WonderFactoryLifecycleResult> {
    const previousStatus =
      this.status;
  
    if (
      this.status === "stopped"
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
  
    this.pollingEnabled =
      false;
  
    this.clearPollingTimer();
  
    this.setStatus(
      "stopping"
    );
  
    const graceful =
      options.graceful ??
      true;
  
    const timeoutMilliseconds =
      normalisePositiveInteger(
        options.timeoutMilliseconds,
        DEFAULT_STOP_TIMEOUT_MILLISECONDS
      );
  
    const cancelOnTimeout =
      options.cancelActiveJobsOnTimeout ??
      true;
  
    if (
      graceful &&
      this.activeJobIds.size > 0
    ) {
      const deadline =
        Date.now() +
        timeoutMilliseconds;
  
      while (
        this.activeJobIds.size > 0 &&
        Date.now() < deadline
      ) {
        await sleep(25);
      }
    }
  
    if (
      this.activeJobIds.size > 0 &&
      cancelOnTimeout
    ) {
      for (
        const worker of
          this.workers.listWorkers()
      ) {
        if (
          worker.isBusy()
        ) {
          worker.cancelCurrentJob(
            `Wonder Factory "${this.id}" is stopping.`
          );
        }
      }
    }
  
    const now =
      new Date();
  
    this.markStopped(now);
  
    this.setStatus(
      "stopped"
    );
  
    return {
      success:
        this.activeJobIds.size ===
        0,
  
      previousStatus,
  
      currentStatus:
        this.status,
  
      changedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  recover(): WonderFactoryLifecycleResult {
    const previousStatus =
      this.status;
  
    this.pollingEnabled =
      false;
  
    this.clearPollingTimer();
  
    for (
      const worker of
        this.workers.listWorkers()
    ) {
      if (
        worker.getStatus() ===
          "error" ||
        worker.getStatus() ===
          "offline" ||
        worker.getStatus() ===
          "stopped"
      ) {
        worker.recover();
      }
    }
  
    this.queue.releaseExpiredLocks();
  
    this.activeJobIds.clear();
  
    this.setStatus(
      "idle"
    );
  
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
  // FACTORY TICKS
  // =========================================================
  
  async tick(): Promise<WonderFactoryTickResult> {
    const startedAt =
      new Date();
  
    this.tickSequence += 1;
  
    const tickNumber =
      this.tickSequence;
  
    const errors: string[] =
      [];
  
    if (
      this.status !== "running"
    ) {
      const completedAt =
        new Date();
  
      const result:
        WonderFactoryTickResult = {
        tickNumber,
  
        startedAt,
  
        completedAt,
  
        durationMilliseconds:
          Math.max(
            0,
            completedAt.getTime() -
              startedAt.getTime()
          ),
  
        status:
          this.status,
  
        releasedExpiredLocks: 0,
  
        unavailableWorkers: 0,
  
        availableExecutionSlots:
          this.getAvailableExecutionSlots(),
  
        jobsStarted: 0,
  
        activeJobCount:
          this.activeJobIds.size,
  
        queue:
          this.queue
            .getStatistics(),
  
        errors: [
          `Factory is not running. Current status: "${this.status}".`,
        ],
      };
  
      this.storeTickResult(
        result
      );
  
      return result;
    }
  
    if (
      this.tickInProgress
    ) {
      const completedAt =
        new Date();
  
      const result:
        WonderFactoryTickResult = {
        tickNumber,
  
        startedAt,
  
        completedAt,
  
        durationMilliseconds:
          Math.max(
            0,
            completedAt.getTime() -
              startedAt.getTime()
          ),
  
        status:
          this.status,
  
        releasedExpiredLocks: 0,
  
        unavailableWorkers: 0,
  
        availableExecutionSlots:
          this.getAvailableExecutionSlots(),
  
        jobsStarted: 0,
  
        activeJobCount:
          this.activeJobIds.size,
  
        queue:
          this.queue
            .getStatistics(),
  
        errors: [
          "A Factory tick is already in progress.",
        ],
      };
  
      this.storeTickResult(
        result
      );
  
      return result;
    }
  
    this.tickInProgress =
      true;
  
    let releasedExpiredLocks =
      0;
  
    let unavailableWorkers =
      0;
  
    let jobsStarted =
      0;
  
    try {
      releasedExpiredLocks =
        this.queue
          .releaseExpiredLocks();
  
      unavailableWorkers =
        this.markExpiredWorkersUnavailable(
          startedAt
        );
  
      jobsStarted =
        await this.executeAvailableWork();
  
      this.touch();
    } catch (error) {
      errors.push(
        getErrorMessage(error)
      );
  
      if (
        this.options
          .stopOnJobFailure
      ) {
        this.setStatus(
          "error"
        );
  
        this.pollingEnabled =
          false;
  
        this.clearPollingTimer();
      }
    } finally {
      this.tickInProgress =
        false;
    }
  
    const completedAt =
      new Date();
  
    const result:
      WonderFactoryTickResult = {
      tickNumber,
  
      startedAt,
  
      completedAt,
  
      durationMilliseconds:
        Math.max(
          0,
          completedAt.getTime() -
            startedAt.getTime()
        ),
  
      status:
        this.status,
  
      releasedExpiredLocks,
  
      unavailableWorkers,
  
      availableExecutionSlots:
        this.getAvailableExecutionSlots(),
  
      jobsStarted,
  
      activeJobCount:
        this.activeJobIds.size,
  
      queue:
        this.queue
          .getStatistics(),
  
      errors,
    };
  
    this.storeTickResult(
      result
    );
  
    return cloneTickResult(
      result
    );
  }
  
  async runUntilIdle(
    options: WonderFactoryRunUntilIdleOptions = {}
  ): Promise<WonderFactoryRunUntilIdleResult> {
    const startedAt =
      new Date();
  
    const maximumTicks =
      clampInteger(
        options.maximumTicks ??
          DEFAULT_MAXIMUM_RUN_TICKS,
        1,
        1_000_000
      );
  
    const timeoutMilliseconds =
      normalisePositiveInteger(
        options.timeoutMilliseconds,
        DEFAULT_RUN_TIMEOUT_MILLISECONDS
      );
  
    const intervalMilliseconds =
      normaliseNonNegativeInteger(
        options.intervalMilliseconds,
        this.options
          .pollingIntervalMilliseconds
      );
  
    const maximumIdleTicks =
      clampInteger(
        options.maximumIdleTicks ??
          DEFAULT_MAXIMUM_IDLE_TICKS,
        1,
        10_000
      );
  
    const startIfNeeded =
      options.startIfNeeded ??
      true;
  
    const errors: string[] =
      [];
  
    let tickCount = 0;
  
    let jobsStarted = 0;
  
    let consecutiveIdleTicks =
      0;
  
    if (
      this.status !== "running"
    ) {
      if (!startIfNeeded) {
        throw new Error(
          `WonderFactory: factory "${this.id}" is not running.`
        );
      }
  
      await this.start({
        automaticPolling: false,
      });
    } else {
      this.pollingEnabled =
        false;
  
      this.clearPollingTimer();
    }
  
    const deadline =
      Date.now() +
      timeoutMilliseconds;
  
    while (
      tickCount < maximumTicks &&
      Date.now() < deadline
    ) {
      const statisticsBefore =
        this.queue.getStatistics();
  
      if (
        statisticsBefore.queuedJobs ===
          0 &&
        statisticsBefore.processingJobs ===
          0 &&
        this.activeJobIds.size ===
          0
      ) {
        break;
      }
  
      const tickResult =
        await this.tick();
  
      tickCount += 1;
  
      jobsStarted +=
        tickResult.jobsStarted;
  
      errors.push(
        ...tickResult.errors
      );
  
      const statisticsAfter =
        this.queue.getStatistics();
  
      const noProgress =
        tickResult.jobsStarted ===
          0 &&
        statisticsAfter.processingJobs ===
          statisticsBefore.processingJobs &&
        statisticsAfter.completedJobs ===
          statisticsBefore.completedJobs &&
        statisticsAfter.failedJobs ===
          statisticsBefore.failedJobs;
  
      if (noProgress) {
        consecutiveIdleTicks +=
          1;
      } else {
        consecutiveIdleTicks =
          0;
      }
  
      if (
        consecutiveIdleTicks >=
        maximumIdleTicks
      ) {
        break;
      }
  
      if (
        intervalMilliseconds > 0
      ) {
        await sleep(
          intervalMilliseconds
        );
      }
    }
  
    const finalStatistics =
      this.getStatistics();
  
    const idle =
      finalStatistics.queuedJobs ===
        0 &&
      finalStatistics.processingJobs ===
        0 &&
      finalStatistics.activeExecutions ===
        0;
  
    const completedAt =
      new Date();
  
    return {
      success:
        idle &&
        errors.length === 0,
  
      idle,
  
      startedAt,
  
      completedAt,
  
      durationMilliseconds:
        Math.max(
          0,
          completedAt.getTime() -
            startedAt.getTime()
        ),
  
      tickCount,
  
      jobsStarted,
  
      finalStatistics,
  
      errors:
        uniqueStrings(errors),
    };
  }
  
  getLastTickResult(): WonderFactoryTickResult | null {
    return this.lastTickResult
      ? cloneTickResult(
          this.lastTickResult
        )
      : null;
  }
  
  getLastTickAt(): Date | null {
    return this.lastTickAt
      ? new Date(
          this.lastTickAt.getTime()
        )
      : null;
  }
  
  // =========================================================
  // AUTOMATIC POLLING
  // =========================================================
  
  private scheduleNextPoll(): void {
    if (
      !this.pollingEnabled ||
      this.status !== "running" ||
      this.pollingTimer !== null
    ) {
      return;
    }
  
    const interval =
      Math.max(
        MINIMUM_POLLING_INTERVAL_MILLISECONDS,
        this.options
          .pollingIntervalMilliseconds
      );
  
    this.pollingTimer =
      setTimeout(
        () => {
          this.pollingTimer =
            null;
  
          void this.runAutomaticPoll();
        },
        interval
      );
  }
  
  private async runAutomaticPoll(): Promise<void> {
    if (
      !this.pollingEnabled ||
      this.status !== "running"
    ) {
      return;
    }
  
    try {
      await this.tick();
    } catch {
      if (
        this.options
          .stopOnJobFailure
      ) {
        this.setStatus(
          "error"
        );
  
        this.pollingEnabled =
          false;
  
        return;
      }
    }
  
    this.scheduleNextPoll();
  }
  
  private clearPollingTimer(): void {
    if (
      this.pollingTimer === null
    ) {
      return;
    }
  
    clearTimeout(
      this.pollingTimer
    );
  
    this.pollingTimer =
      null;
  }
  
  private markExpiredWorkersUnavailable(
    at: Date
  ): number {
    let unavailableWorkers =
      0;
  
    for (
      const worker of
        this.workers.listWorkers()
    ) {
      if (
        !worker.isOnline() ||
        !worker.isHeartbeatExpired(
          this.options
            .workerHeartbeatTimeoutMilliseconds,
          at
        )
      ) {
        continue;
      }
  
      /*
       * Busy workers remain active because their execution
       * might still report progress. Idle stale workers are
       * taken offline and may later be recovered.
       */
      if (
        !worker.isBusy()
      ) {
        worker.setOffline();
  
        unavailableWorkers +=
          1;
      }
    }
  
    return unavailableWorkers;
  }
  
  private storeTickResult(
    result: WonderFactoryTickResult
  ): void {
    this.lastTickAt =
      new Date(
        result.completedAt.getTime()
      );

    this.lastTickResult =
      cloneTickResult(
        result
      );
  }

  // =========================================================
  // WORKERS
  // =========================================================

  registerWorker(

      worker: WonderWorker
    ): WonderFactoryWorkerRegistrationResult {
      const registeredWorker =
        this.workers.register(
          worker
        );
  
      this.touch();
  
      return {
        success: true,
  
        worker:
          registeredWorker
            .getSnapshot(),
  
        totalWorkers:
          this.workers.size(),
      };
    }
  
    unregisterWorker(
      workerId: string,
      force = false
    ): boolean {
      const removed =
        this.workers.unregister(
          workerId,
          force
        );
  
      if (removed) {
        this.touch();
      }
  
      return removed;
    }
  
    getWorker(
      workerId: string
    ): WonderWorker | null {
      return this.workers.getWorker(
        workerId
      );
    }
  
    listWorkers(): WonderWorkerSnapshot[] {
      return this.workers
        .listSnapshots();
    }
  
    getAvailableWorkers(
      jobType?: WonderJobType
    ): WonderWorker[] {
      return this.workers
        .findAvailableWorkers(
          jobType
        );
    }
  
    hasAvailableWorker(
      jobType?: WonderJobType
    ): boolean {
      return (
        this.getAvailableWorkers(
          jobType
        ).length > 0
      );
    }
  
    // =========================================================
    // JOB SUBMISSION
    // =========================================================
  
    async submitJob<
      TPayload
    >(
      input: WonderJobCreateInput<TPayload>
    ): Promise<
      WonderFactoryJobSubmissionResult<TPayload>
    > {
      const result =
        await this.queue
          .createAndEnqueue(
            input
          );
  
      this.touch();
  
      return {
        success:
          result.success,
  
        job:
          result.job,
  
        queueSize:
          this.queue.size(),
  
        eventErrors: [
          ...result.eventErrors,
        ],
      };
    }
  
    getJob<
      TPayload = unknown,
      TResult = unknown
    >(
      jobId: string
    ): WonderJob<
      TPayload,
      TResult
    > | null {
      return this.queue.getJob<
        TPayload,
        TResult
      >(
        jobId
      );
    }
  
    listJobs() {
      return this.queue.listJobs();
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    getStatistics(
      at = new Date()
    ): WonderFactoryStatistics {
      const queueStatistics =
        this.queue.getStatistics(
          at
        );
  
      const workerStatistics =
        this.workers
          .getStatistics();
  
      return {
        factoryId:
          this.id,
  
        status:
          this.status,
  
        totalWorkers:
          workerStatistics
            .totalWorkers,
  
        availableWorkers:
          workerStatistics
            .idleWorkers,
  
        busyWorkers:
          workerStatistics
            .busyWorkers,
  
        totalJobs:
          queueStatistics
            .totalJobs,
  
        queuedJobs:
          queueStatistics
            .queuedJobs,
  
        processingJobs:
          queueStatistics
            .processingJobs,
  
        completedJobs:
          queueStatistics
            .completedJobs,
  
        failedJobs:
          queueStatistics
            .failedJobs,
  
        cancelledJobs:
          queueStatistics
            .cancelledJobs,
  
        activeExecutions:
          this.activeJobIds.size,
  
        totalExecutionStarted:
          this.totalExecutionStarted,
  
        totalExecutionCompleted:
          this.totalExecutionCompleted,
  
        totalExecutionFailed:
          this.totalExecutionFailed,
  
        uptimeMilliseconds:
          calculateUptime(
            this.startedAt,
            this.stoppedAt,
            at
          ),
      };
    }
  
    getHealthReport(
      at = new Date()
    ): WonderFactoryHealthReport {
      const queueStatistics =
        this.queue.getStatistics(
          at
        );
  
      const workerStatistics =
        this.workers
          .getStatistics();
  
      const issues:
        WonderFactoryHealthIssue[] = [];
  
      if (
        workerStatistics
          .totalWorkers === 0
      ) {
        issues.push({
          code:
            "NO_WORKERS",
  
          severity:
            "warning",
  
          message:
            "Wonder Factory has no registered workers.",
        });
      }
  
      if (
        queueStatistics
          .readyJobs > 0 &&
        workerStatistics
          .idleWorkers === 0
      ) {
        issues.push({
          code:
            "NO_AVAILABLE_WORKERS",
  
          severity:
            "warning",
  
          message:
            `${queueStatistics.readyJobs} ready job(s) are waiting without an available worker.`,
        });
      }
  
      if (
        queueStatistics
          .expiredLocks > 0
      ) {
        issues.push({
          code:
            "EXPIRED_JOB_LOCKS",
  
          severity:
            "warning",
  
          message:
            `${queueStatistics.expiredLocks} job lock(s) have expired.`,
        });
      }
  
      if (
        workerStatistics
          .errorWorkers > 0
      ) {
        issues.push({
          code:
            "WORKERS_IN_ERROR",
  
          severity:
            "error",
  
          message:
            `${workerStatistics.errorWorkers} worker(s) are in an error state.`,
        });
      }
  
      if (
        this.status ===
        "error"
      ) {
        issues.push({
          code:
            "FACTORY_ERROR",
  
          severity:
            "error",
  
          message:
            "Wonder Factory is in an error state.",
        });
      }
  
      return {
        healthy:
          !issues.some(
            (issue) =>
              issue.severity ===
              "error"
          ),
  
        status:
          this.status,
  
        checkedAt:
          new Date(
            at.getTime()
          ),
  
        issues,
  
        queue:
          queueStatistics,
  
        workers:
          workerStatistics,
      };
    }
  
    getSnapshot(): WonderFactorySnapshot {
      return {
        id:
          this.id,
  
        name:
          this.name,
  
        status:
          this.status,
  
        executionMode:
          this.options
            .executionMode,
  
        maximumConcurrentJobs:
          this.options
            .maximumConcurrentJobs,
  
        activeJobCount:
          this.activeJobIds.size,
  
        createdAt:
          new Date(
            this.createdAt.getTime()
          ),
  
        updatedAt:
          new Date(
            this.updatedAt.getTime()
          ),
  
        startedAt:
          this.startedAt
            ? new Date(
                this.startedAt.getTime()
              )
            : null,
  
        stoppedAt:
          this.stoppedAt
            ? new Date(
                this.stoppedAt.getTime()
              )
            : null,
  
        queue:
          this.queue
            .getStatistics(),
  
        workers:
          this.workers
            .getStatistics(),
      };
    }
  
    // =========================================================
    // FOUNDATION INTERNAL STATE
    // =========================================================
  
    /**
     * Reserved for Foundation B lifecycle implementation.
     */
    protected setStatus(
      status: WonderFactoryStatus
    ): void {
      this.status =
        status;
  
      this.touch();
    }
  
      /**
   * Foundation C will replace this placeholder with
   * real queue-to-worker orchestration.
   */
      protected async executeAvailableWork(): Promise<number> {
        const availableSlots =
          this.options.executionMode ===
          "single"
            ? Math.min(
                1,
                this.getAvailableExecutionSlots()
              )
            : this.getAvailableExecutionSlots();
    
        if (
          availableSlots <= 0
        ) {
          return 0;
        }
    
        const readyJobs =
          this.queue.getReadyJobs();
    
        if (
          readyJobs.length === 0
        ) {
          return 0;
        }
    
        const reservedWorkerIds =
          new Set<string>();
    
        const executions:
          Promise<void>[] = [];
    
        for (
          const readyJob of
            readyJobs
        ) {
          if (
            executions.length >=
            availableSlots
          ) {
            break;
          }
    
          const worker =
            this.findAvailableWorkerForJob(
              readyJob.type,
              reservedWorkerIds
            );
    
          if (!worker) {
            continue;
          }
    
          const claimedJob =
            await this.queue.claimNext(
              worker.id,
              {
                types: [
                  readyJob.type,
                ],
    
                batchId:
                  readyJob.batchId,
    
                lockDurationMilliseconds:
                  this.options
                    .jobLockDurationMilliseconds,
              }
            );
    
          if (!claimedJob) {
            continue;
          }
    
          const startedResult =
            await this.queue.start(
              claimedJob.id,
              worker.id
            );
    
          reservedWorkerIds.add(
            worker.id
          );
    
          this.markJobActive(
            startedResult.job.id
          );
    
          executions.push(
            this.executeClaimedJob(
              worker,
              startedResult.job
            )
          );
        }
    
        if (
          executions.length === 0
        ) {
          return 0;
        }
    
        const results =
          await Promise.allSettled(
            executions
          );
    
        const rejectedResult =
          results.find(
            (
              result
            ): result is PromiseRejectedResult =>
              result.status ===
              "rejected"
          );
    
        if (
          rejectedResult &&
          this.options
            .stopOnJobFailure
        ) {
          throw toError(
            rejectedResult.reason
          );
        }
    
        return executions.length;
      }
    
      private findAvailableWorkerForJob(
        jobType: WonderJobType,
        reservedWorkerIds:
          ReadonlySet<string>
      ): WonderWorker | null {
        const workers =
          this.workers
            .findAvailableWorkers(
              jobType
            );
    
        return (
          workers.find(
            (worker) =>
              !reservedWorkerIds.has(
                worker.id
              )
          ) ??
          null
        );
      }
    
      private async executeClaimedJob(
        worker: WonderWorker,
        job: WonderJob<
          unknown,
          unknown
        >
      ): Promise<void> {
        let lifecycleFinished =
          false;
    
        try {
          const executionResult =
            await worker.execute(
              job,
              {
                onProgress:
                  async (
                    progress
                  ): Promise<void> => {
                    const currentJob =
                      this.queue.getJob(
                        job.id
                      );
    
                    if (
                      !currentJob ||
                      currentJob.status !==
                        "processing"
                    ) {
                      return;
                    }
    
                    await this.queue.updateProgress(
                      job.id,
                      {
                        completedItems:
                          progress.completedItems,
    
                        totalItems:
                          progress.totalItems,
    
                        message:
                          progress.message,
    
                        status:
                          "running",
                      }
                    );
                  },
              }
            );
    
          if (
            executionResult.success
          ) {
            await this.queue.complete(
              job.id,
              executionResult.result
            );
    
            this.markJobCompleted(
              job.id
            );
    
            lifecycleFinished =
              true;
    
            return;
          }
    
          const workerError =
            executionResult.error;
    
          await this.queue.fail(
            job.id,
            {
              message:
                workerError?.message ??
                `Worker "${worker.id}" failed while executing job "${job.id}".`,
    
              code:
                workerError?.code ??
                "WORKER_EXECUTION_FAILED",
    
              retryable:
                workerError?.retryable ??
                true,
    
              details: {
                workerId:
                  worker.id,
    
                durationMilliseconds:
                  executionResult
                    .durationMilliseconds,
    
                ...(workerError
                  ?.details ??
                  {}),
              },
            },
            {
              autoRetry:
                this.options
                  .autoRetryFailedJobs,
    
              retry: {
                delayMilliseconds:
                  this.options
                    .retryDelayMilliseconds,
    
                resetProgress:
                  false,
              },
            }
          );
    
          this.markJobFailed(
            job.id
          );
    
          lifecycleFinished =
            true;
    
          if (
            this.options
              .stopOnJobFailure
          ) {
            throw new Error(
              workerError?.message ??
              `WonderFactory: job "${job.id}" failed.`
            );
          }
        } catch (error) {
          if (!lifecycleFinished) {
            await this.handleUnexpectedExecutionFailure(
              worker,
              job,
              error
            );
    
            this.markJobFailed(
              job.id
            );
          }
    
          if (
            this.options
              .stopOnJobFailure
          ) {
            throw error;
          }
        }
      }
    
      private async handleUnexpectedExecutionFailure(
        worker: WonderWorker,
        job: WonderJob<
          unknown,
          unknown
        >,
        error: unknown
      ): Promise<void> {
        const currentJob =
          this.queue.getJob(
            job.id
          );
    
        if (!currentJob) {
          return;
        }
    
        if (
          currentJob.status !==
            "processing" &&
          currentJob.status !==
            "queued"
        ) {
          return;
        }
    
        try {
          await this.queue.fail(
            job.id,
            {
              message:
                getErrorMessage(
                  error
                ),
    
              code:
                "FACTORY_EXECUTION_ERROR",
    
              retryable:
                true,
    
              details: {
                factoryId:
                  this.id,
    
                workerId:
                  worker.id,
    
                jobType:
                  job.type,
              },
            },
            {
              autoRetry:
                this.options
                  .autoRetryFailedJobs,
    
              retry: {
                delayMilliseconds:
                  this.options
                    .retryDelayMilliseconds,
    
                resetProgress:
                  false,
              },
            }
          );
        } catch {
          const latestJob =
            this.queue.getJob(
              job.id
            );
    
          if (
            latestJob?.lock
          ) {
            try {
              this.queue.releaseLock(
                job.id
              );
            } catch {
              // Preserve the original execution error.
            }
          }
        }
      } 

    /**
     * Reserved for Foundation C execution implementation.
     */
    protected markJobActive(
      jobId: string
    ): void {
      const cleanJobId =
        normaliseRequiredText(
          jobId,
          "jobId"
        );
  
      this.activeJobIds.add(
        cleanJobId
      );
  
      this.totalExecutionStarted +=
        1;
  
      this.touch();
    }
  
    /**
     * Reserved for Foundation C execution implementation.
     */
    protected markJobCompleted(
      jobId: string
    ): void {
      const cleanJobId =
        normaliseRequiredText(
          jobId,
          "jobId"
        );
  
      this.activeJobIds.delete(
        cleanJobId
      );
  
      this.totalExecutionCompleted +=
        1;
  
      this.touch();
    }
  
    /**
     * Reserved for Foundation C execution implementation.
     */
    protected markJobFailed(
      jobId: string
    ): void {
      const cleanJobId =
        normaliseRequiredText(
          jobId,
          "jobId"
        );
  
      this.activeJobIds.delete(
        cleanJobId
      );
  
      this.totalExecutionFailed +=
        1;
  
      this.touch();
    }
  
    protected markStarted(
      at = new Date()
    ): void {
      this.startedAt =
        new Date(
          at.getTime()
        );
  
      this.stoppedAt =
        null;
  
      this.touch();
    }
  
    protected markStopped(
      at = new Date()
    ): void {
      this.stoppedAt =
        new Date(
          at.getTime()
        );
  
      this.touch();
    }
  
    private touch(): void {
      this.updatedAt =
        new Date();
    }
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolveWonderFactoryOptions(
    options: WonderFactoryOptions
  ): ResolvedWonderFactoryOptions {
    return {
      id:
        normaliseOptionalText(
          options.id
        ) ??
        DEFAULT_FACTORY_ID,
  
      name:
        normaliseOptionalText(
          options.name
        ) ??
        DEFAULT_FACTORY_NAME,
  
      maximumConcurrentJobs:
        clampInteger(
          options
            .maximumConcurrentJobs ??
            DEFAULT_MAXIMUM_CONCURRENT_JOBS,
          1,
          MAXIMUM_CONCURRENT_JOBS
        ),
  
      executionMode:
        isWonderFactoryExecutionMode(
          options.executionMode
        )
          ? options.executionMode
          : "parallel",
  
      pollingIntervalMilliseconds:
        normalisePositiveInteger(
          options
            .pollingIntervalMilliseconds,
          DEFAULT_POLLING_INTERVAL_MILLISECONDS
        ),
  
      workerHeartbeatTimeoutMilliseconds:
        normalisePositiveInteger(
          options
            .workerHeartbeatTimeoutMilliseconds,
          DEFAULT_HEARTBEAT_TIMEOUT_MILLISECONDS
        ),
  
      jobLockDurationMilliseconds:
        normalisePositiveInteger(
          options
            .jobLockDurationMilliseconds,
          DEFAULT_JOB_LOCK_DURATION_MILLISECONDS
        ),
  
      autoRetryFailedJobs:
        options
          .autoRetryFailedJobs ??
        true,
  
      retryDelayMilliseconds:
        normaliseNonNegativeInteger(
          options
            .retryDelayMilliseconds,
          DEFAULT_RETRY_DELAY_MILLISECONDS
        ),
  
      stopOnJobFailure:
        options
          .stopOnJobFailure ??
        false,
  
      emitEvents:
        options.emitEvents ??
        true,
  
      queue: {
        ...(options.queue ??
          {}),
      },
    };
  }
  
  // =========================================================
  // TYPE GUARDS
  // =========================================================
  
  export function isWonderFactoryStatus(
    value: unknown
  ): value is WonderFactoryStatus {
    return (
      value === "idle" ||
      value === "running" ||
      value === "paused" ||
      value === "stopping" ||
      value === "stopped" ||
      value === "error"
    );
  }
  
  export function isWonderFactoryExecutionMode(
    value: unknown
  ): value is WonderFactoryExecutionMode {
    return (
      value === "single" ||
      value === "parallel"
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
        `WonderFactory: "${fieldName}" must be a string.`
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new Error(
        `WonderFactory: "${fieldName}" is required.`
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
  
  function normalisePositiveInteger(
    value:
      | number
      | undefined,
    fallback: number
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value) ||
      value < 1
    ) {
      return fallback;
    }
  
    return Math.floor(value);
  }
  
  function normaliseNonNegativeInteger(
    value:
      | number
      | undefined,
    fallback: number
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return fallback;
    }
  
    return Math.floor(value);
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
  
  function calculateUptime(
    startedAt: Date | null,
    stoppedAt: Date | null,
    at: Date
  ): number {
    if (!startedAt) {
      return 0;
    }
  
    const endTime =
      stoppedAt?.getTime() ??
      at.getTime();
  
    return Math.max(
      0,
      endTime -
        startedAt.getTime()
    );
  }

    // =========================================================
// FOUNDATION B HELPERS
// =========================================================

function cloneTickResult(
    result: WonderFactoryTickResult
  ): WonderFactoryTickResult {
    return {
      ...result,
  
      startedAt:
        new Date(
          result.startedAt.getTime()
        ),
  
      completedAt:
        new Date(
          result.completedAt.getTime()
        ),
  
      queue: {
        ...result.queue,
  
        jobsByType: {
          ...result.queue
            .jobsByType,
        },
  
        jobsByPriority: {
          ...result.queue
            .jobsByPriority,
        },
      },
  
      errors: [
        ...result.errors,
      ],
    };
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
  
  function toError(
    error: unknown
  ): Error {
    if (
      error instanceof Error
    ) {
      return error;
    }
  
    return new Error(
      String(error)
    );
  }
  
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
  
  function sleep(
    milliseconds: number
  ): Promise<void> {
    const duration =
      Math.max(
        0,
        Math.floor(milliseconds)
      );
  
    return new Promise(
      (resolvePromise) => {
        setTimeout(
          resolvePromise,
          duration
        );
      }
    );
  }
  
  // =========================================================
  // DEFAULT INSTANCE
  // =========================================================
  
  export const wonderFactory =
    new WonderFactory();
  
  export default WonderFactory;