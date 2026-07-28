import { randomUUID } from "node:crypto";

export type WonderWorkerStatus =
  | "created"
  | "registering"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "error";

export type WonderUnknownRecord = Record<string, unknown>;

export interface WonderSerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  details?: unknown;
}

export interface WonderWorkerJob<TPayload = WonderUnknownRecord> {
  id: string;
  type: string;
  payload: TPayload;
  attempt: number;
  maximumAttempts: number;
  createdAt: string;
  metadata?: WonderUnknownRecord;
}

export interface WonderWorkerMetricsSnapshot {
  startedAt: string | null;
  stoppedAt: string | null;
  uptimeMilliseconds: number;
  activeJobCount: number;
  maximumConcurrency: number;
  totalClaimAttempts: number;
  totalJobsClaimed: number;
  totalJobsStarted: number;
  totalJobsCompleted: number;
  totalJobsFailed: number;
  totalJobsReleased: number;
  totalHandlerTimeouts: number;
  totalHeartbeats: number;
  failedHeartbeats: number;
  averageExecutionMilliseconds: number;
  maximumExecutionMilliseconds: number;
  minimumExecutionMilliseconds: number | null;
  lastJobStartedAt: string | null;
  lastJobCompletedAt: string | null;
  lastJobFailedAt: string | null;
  lastHeartbeatAt: string | null;
  lastError: WonderSerializedError | null;
}

export interface WonderWorkerRegistrationInput {
  workerId: string;
  name: string;
  capabilities: string[];
  concurrency: number;
  metadata: WonderUnknownRecord;
  startedAt: string;
}

export interface WonderWorkerRegistration {
  workerId: string;
  registrationId: string;
  registeredAt: string;
  leaseDurationMilliseconds: number;
}

export interface WonderWorkerHeartbeatInput {
  workerId: string;
  registrationId: string;
  status: WonderWorkerStatus;
  activeJobCount: number;
  availableConcurrency: number;
  metrics: WonderWorkerMetricsSnapshot;
  sentAt: string;
}

export interface WonderWorkerClaimInput {
  workerId: string;
  registrationId: string;
  capabilities: string[];
  leaseDurationMilliseconds: number;
}

export interface WonderWorkerProgressInput {
  workerId: string;
  registrationId: string;
  jobId: string;
  progress: number;
  message?: string;
}

export interface WonderWorkerCompleteInput {
  workerId: string;
  registrationId: string;
  jobId: string;
  result: unknown;
  durationMilliseconds: number;
  completedAt: string;
}

export interface WonderWorkerFailInput {
  workerId: string;
  registrationId: string;
  jobId: string;
  error: WonderSerializedError;
  durationMilliseconds: number;
  retryable: boolean;
  failedAt: string;
}

export interface WonderWorkerReleaseInput {
  workerId: string;
  registrationId: string;
  jobId: string;
  reason: string;
}

export interface WonderWorkerUnregisterInput {
  workerId: string;
  registrationId: string;
  stoppedAt: string;
  reason: string;
}

export interface WonderWorkerAdapter {
  register(input: WonderWorkerRegistrationInput): Promise<WonderWorkerRegistration>;
  heartbeat(input: WonderWorkerHeartbeatInput): Promise<void>;
  claim(input: WonderWorkerClaimInput): Promise<WonderWorkerJob | null>;
  reportProgress(input: WonderWorkerProgressInput): Promise<void>;
  complete(input: WonderWorkerCompleteInput): Promise<void>;
  fail(input: WonderWorkerFailInput): Promise<void>;
  release(input: WonderWorkerReleaseInput): Promise<void>;
  unregister?(input: WonderWorkerUnregisterInput): Promise<void>;
}

export interface WonderWorkerLogger {
  debug(message: string, metadata?: WonderUnknownRecord): void;
  info(message: string, metadata?: WonderUnknownRecord): void;
  warn(message: string, metadata?: WonderUnknownRecord): void;
  error(message: string, metadata?: WonderUnknownRecord): void;
}

export interface WonderWorkerConfiguration {
  id?: string;
  name: string;
  capabilities?: string[];
  concurrency?: number;
  pollIntervalMilliseconds?: number;
  emptyQueueDelayMilliseconds?: number;
  heartbeatIntervalMilliseconds?: number;
  leaseDurationMilliseconds?: number;
  handlerTimeoutMilliseconds?: number;
  shutdownTimeoutMilliseconds?: number;
  retryDelayMilliseconds?: number;
  maximumConsecutivePollErrors?: number;
  metadata?: WonderUnknownRecord;
  logger?: WonderWorkerLogger;
}

interface ResolvedWonderWorkerConfiguration {
  id: string;
  name: string;
  capabilities: string[];
  concurrency: number;
  pollIntervalMilliseconds: number;
  emptyQueueDelayMilliseconds: number;
  heartbeatIntervalMilliseconds: number;
  leaseDurationMilliseconds: number;
  handlerTimeoutMilliseconds: number;
  shutdownTimeoutMilliseconds: number;
  retryDelayMilliseconds: number;
  maximumConsecutivePollErrors: number;
  metadata: WonderUnknownRecord;
  logger: WonderWorkerLogger;
}

export interface WonderWorkerSnapshot {
  workerId: string;
  name: string;
  status: WonderWorkerStatus;
  capabilities: string[];
  activeJobIds: string[];
  registration: WonderWorkerRegistration | null;
  metrics: WonderWorkerMetricsSnapshot;
  lastError: WonderSerializedError | null;
}

export interface WonderWorkerHandlerContext {
  readonly workerId: string;
  readonly jobId: string;
  readonly attempt: number;
  readonly signal: AbortSignal;
  readonly logger: WonderWorkerLogger;
  progress(percentage: number, message?: string): Promise<void>;
  isCancelled(): boolean;
  throwIfCancelled(): void;
  getWorkerSnapshot(): WonderWorkerSnapshot;
}

export type WonderWorkerHandler<TPayload = WonderUnknownRecord, TResult = unknown> = (
  job: WonderWorkerJob<TPayload>,
  context: WonderWorkerHandlerContext,
) => Promise<TResult> | TResult;

export class WonderWorkerError extends Error {
  public constructor(
    message: string,
    public readonly code = "WONDER_WORKER_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "WonderWorkerError";
  }
}

export class WonderWorkerLifecycleError extends WonderWorkerError {
  public constructor(message: string, details?: unknown) {
    super(message, "WONDER_WORKER_LIFECYCLE_ERROR", details);
    this.name = "WonderWorkerLifecycleError";
  }
}

export class WonderWorkerTimeoutError extends WonderWorkerError {
  public constructor(jobId: string, timeoutMilliseconds: number) {
    super(
      `WonderWorker job "${jobId}" exceeded its ${timeoutMilliseconds} ms timeout.`,
      "WONDER_WORKER_HANDLER_TIMEOUT",
      { jobId, timeoutMilliseconds },
    );
    this.name = "WonderWorkerTimeoutError";
  }
}

export class WonderWorkerCancelledError extends WonderWorkerError {
  public constructor(jobId: string) {
    super(
      `WonderWorker job "${jobId}" was cancelled.`,
      "WONDER_WORKER_JOB_CANCELLED",
      { jobId },
    );
    this.name = "WonderWorkerCancelledError";
  }
}

export function serializeWonderWorkerError(error: unknown): WonderSerializedError {
  if (error instanceof WonderWorkerError) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    const candidate = error as Error & { code?: unknown; details?: unknown };
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      details: candidate.details,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "An unknown WonderWorker error occurred.",
    details: error,
  };
}

class ConsoleWonderWorkerLogger implements WonderWorkerLogger {
  public debug(message: string, metadata?: WonderUnknownRecord): void {
    console.debug(`[WonderWorker] ${message}`, metadata ?? "");
  }
  public info(message: string, metadata?: WonderUnknownRecord): void {
    console.info(`[WonderWorker] ${message}`, metadata ?? "");
  }
  public warn(message: string, metadata?: WonderUnknownRecord): void {
    console.warn(`[WonderWorker] ${message}`, metadata ?? "");
  }
  public error(message: string, metadata?: WonderUnknownRecord): void {
    console.error(`[WonderWorker] ${message}`, metadata ?? "");
  }
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new WonderWorkerError(`${field} must be a positive integer.`, "WONDER_WORKER_CONFIGURATION_ERROR", { field, value });
  }
  return value;
}

function resolveConfiguration(input: WonderWorkerConfiguration): ResolvedWonderWorkerConfiguration {
  const name = input.name?.trim();
  if (!name) {
    throw new WonderWorkerError("WonderWorker name is required.", "WONDER_WORKER_CONFIGURATION_ERROR");
  }

  const capabilities = Array.from(
    new Set((input.capabilities ?? [name]).map((value) => value.trim()).filter(Boolean)),
  );

  if (capabilities.length === 0) {
    throw new WonderWorkerError("WonderWorker requires at least one capability.", "WONDER_WORKER_CONFIGURATION_ERROR");
  }

  return {
    id: input.id?.trim() || `wonder-worker-${randomUUID()}`,
    name,
    capabilities,
    concurrency: positiveInteger(input.concurrency ?? 1, "concurrency"),
    pollIntervalMilliseconds: positiveInteger(input.pollIntervalMilliseconds ?? 250, "pollIntervalMilliseconds"),
    emptyQueueDelayMilliseconds: positiveInteger(input.emptyQueueDelayMilliseconds ?? 1_000, "emptyQueueDelayMilliseconds"),
    heartbeatIntervalMilliseconds: positiveInteger(input.heartbeatIntervalMilliseconds ?? 5_000, "heartbeatIntervalMilliseconds"),
    leaseDurationMilliseconds: positiveInteger(input.leaseDurationMilliseconds ?? 30_000, "leaseDurationMilliseconds"),
    handlerTimeoutMilliseconds: positiveInteger(input.handlerTimeoutMilliseconds ?? 60_000, "handlerTimeoutMilliseconds"),
    shutdownTimeoutMilliseconds: positiveInteger(input.shutdownTimeoutMilliseconds ?? 30_000, "shutdownTimeoutMilliseconds"),
    retryDelayMilliseconds: positiveInteger(input.retryDelayMilliseconds ?? 1_000, "retryDelayMilliseconds"),
    maximumConsecutivePollErrors: positiveInteger(input.maximumConsecutivePollErrors ?? 10, "maximumConsecutivePollErrors"),
    metadata: input.metadata ?? {},
    logger: input.logger ?? new ConsoleWonderWorkerLogger(),
  };
}

class WonderWorkerMetrics {
  private startedAt: Date | null = null;
  private stoppedAt: Date | null = null;
  private activeJobCount = 0;
  private totalClaimAttempts = 0;
  private totalJobsClaimed = 0;
  private totalJobsStarted = 0;
  private totalJobsCompleted = 0;
  private totalJobsFailed = 0;
  private totalJobsReleased = 0;
  private totalHandlerTimeouts = 0;
  private totalHeartbeats = 0;
  private failedHeartbeats = 0;
  private totalExecutionMilliseconds = 0;
  private maximumExecutionMilliseconds = 0;
  private minimumExecutionMilliseconds: number | null = null;
  private lastJobStartedAt: Date | null = null;
  private lastJobCompletedAt: Date | null = null;
  private lastJobFailedAt: Date | null = null;
  private lastHeartbeatAt: Date | null = null;
  private lastError: WonderSerializedError | null = null;

  public constructor(private readonly maximumConcurrency: number) {}

  public markStarted(): void { this.startedAt ??= new Date(); this.stoppedAt = null; }
  public markStopped(): void { this.stoppedAt = new Date(); }
  public markClaimAttempt(): void { this.totalClaimAttempts += 1; }
  public markJobClaimed(): void { this.totalJobsClaimed += 1; }
  public markJobStarted(): void { this.totalJobsStarted += 1; this.activeJobCount += 1; this.lastJobStartedAt = new Date(); }
  public markJobReleased(): void { this.totalJobsReleased += 1; }
  public markTimeout(): void { this.totalHandlerTimeouts += 1; }
  public markHeartbeatSucceeded(): void { this.totalHeartbeats += 1; this.lastHeartbeatAt = new Date(); }
  public markHeartbeatFailed(error: WonderSerializedError): void { this.failedHeartbeats += 1; this.lastError = error; }
  public markError(error: WonderSerializedError): void { this.lastError = error; }

  public markJobCompleted(duration: number): void {
    this.totalJobsCompleted += 1;
    this.activeJobCount = Math.max(0, this.activeJobCount - 1);
    this.lastJobCompletedAt = new Date();
    this.recordDuration(duration);
  }

  public markJobFailed(duration: number, error: WonderSerializedError): void {
    this.totalJobsFailed += 1;
    this.activeJobCount = Math.max(0, this.activeJobCount - 1);
    this.lastJobFailedAt = new Date();
    this.lastError = error;
    this.recordDuration(duration);
  }

  public snapshot(): WonderWorkerMetricsSnapshot {
    const executionCount = this.totalJobsCompleted + this.totalJobsFailed;
    const end = this.stoppedAt?.getTime() ?? Date.now();
    return {
      startedAt: this.startedAt?.toISOString() ?? null,
      stoppedAt: this.stoppedAt?.toISOString() ?? null,
      uptimeMilliseconds: this.startedAt ? Math.max(0, end - this.startedAt.getTime()) : 0,
      activeJobCount: this.activeJobCount,
      maximumConcurrency: this.maximumConcurrency,
      totalClaimAttempts: this.totalClaimAttempts,
      totalJobsClaimed: this.totalJobsClaimed,
      totalJobsStarted: this.totalJobsStarted,
      totalJobsCompleted: this.totalJobsCompleted,
      totalJobsFailed: this.totalJobsFailed,
      totalJobsReleased: this.totalJobsReleased,
      totalHandlerTimeouts: this.totalHandlerTimeouts,
      totalHeartbeats: this.totalHeartbeats,
      failedHeartbeats: this.failedHeartbeats,
      averageExecutionMilliseconds: executionCount === 0 ? 0 : Math.round(this.totalExecutionMilliseconds / executionCount),
      maximumExecutionMilliseconds: this.maximumExecutionMilliseconds,
      minimumExecutionMilliseconds: this.minimumExecutionMilliseconds,
      lastJobStartedAt: this.lastJobStartedAt?.toISOString() ?? null,
      lastJobCompletedAt: this.lastJobCompletedAt?.toISOString() ?? null,
      lastJobFailedAt: this.lastJobFailedAt?.toISOString() ?? null,
      lastHeartbeatAt: this.lastHeartbeatAt?.toISOString() ?? null,
      lastError: this.lastError,
    };
  }

  private recordDuration(duration: number): void {
    const safe = Math.max(0, Math.round(duration));
    this.totalExecutionMilliseconds += safe;
    this.maximumExecutionMilliseconds = Math.max(this.maximumExecutionMilliseconds, safe);
    this.minimumExecutionMilliseconds = this.minimumExecutionMilliseconds === null ? safe : Math.min(this.minimumExecutionMilliseconds, safe);
  }
}

class WonderWorkerContext implements WonderWorkerHandlerContext {
  public constructor(
    public readonly workerId: string,
    public readonly jobId: string,
    public readonly attempt: number,
    public readonly signal: AbortSignal,
    public readonly logger: WonderWorkerLogger,
    private readonly progressCallback: (percentage: number, message?: string) => Promise<void>,
    private readonly snapshotCallback: () => WonderWorkerSnapshot,
  ) {}

  public async progress(percentage: number, message?: string): Promise<void> {
    this.throwIfCancelled();
    await this.progressCallback(Math.max(0, Math.min(100, Math.round(percentage))), message);
  }

  public isCancelled(): boolean { return this.signal.aborted; }
  public throwIfCancelled(): void { if (this.signal.aborted) throw new WonderWorkerCancelledError(this.jobId); }
  public getWorkerSnapshot(): WonderWorkerSnapshot { return this.snapshotCallback(); }
}

function sleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve(); }, milliseconds);
    const onAbort = (): void => { clearTimeout(timer); resolve(); };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class WonderWorker {
  private readonly configuration: ResolvedWonderWorkerConfiguration;
  private readonly metrics: WonderWorkerMetrics;
  private readonly handlers = new Map<string, WonderWorkerHandler>();
  private readonly activeExecutions = new Map<string, { controller: AbortController; promise: Promise<void> }>();
  private status: WonderWorkerStatus = "created";
  private registration: WonderWorkerRegistration | null = null;
  private lastError: WonderSerializedError | null = null;
  private pollController: AbortController | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  public constructor(configuration: WonderWorkerConfiguration, private readonly adapter: WonderWorkerAdapter) {
    this.configuration = resolveConfiguration(configuration);
    this.metrics = new WonderWorkerMetrics(this.configuration.concurrency);
  }

  public process<TPayload = WonderUnknownRecord, TResult = unknown>(jobType: string, handler: WonderWorkerHandler<TPayload, TResult>): this {
    if (this.status !== "created" && this.status !== "stopped") {
      throw new WonderWorkerLifecycleError("Handlers can only be registered while the worker is created or stopped.", { status: this.status });
    }
    const type = jobType.trim();
    if (!type) throw new WonderWorkerLifecycleError("WonderWorker job type cannot be empty.");
    this.handlers.set(type, handler as WonderWorkerHandler);
    if (type !== "*" && !this.configuration.capabilities.includes(type)) this.configuration.capabilities.push(type);
    return this;
  }

  public processAll(handler: WonderWorkerHandler): this { return this.process("*", handler); }

  public async start(): Promise<WonderWorkerSnapshot> {
    if (["running", "starting", "registering"].includes(this.status)) return this.getSnapshot();
    if (this.handlers.size === 0) throw new WonderWorkerLifecycleError("Register at least one process handler before start().");

    try {
      this.status = "registering";
      this.registration = await this.adapter.register({
        workerId: this.configuration.id,
        name: this.configuration.name,
        capabilities: [...this.configuration.capabilities],
        concurrency: this.configuration.concurrency,
        metadata: this.configuration.metadata,
        startedAt: new Date().toISOString(),
      });

      this.status = "starting";
      this.metrics.markStarted();
      this.status = "running";
      this.startHeartbeat();
      this.startPolling();
      this.configuration.logger.info("WonderWorker started.", {
        workerId: this.configuration.id,
        capabilities: this.configuration.capabilities,
        concurrency: this.configuration.concurrency,
      });
      return this.getSnapshot();
    } catch (error) {
      this.lastError = serializeWonderWorkerError(error);
      this.metrics.markError(this.lastError);
      this.status = "error";
      throw error;
    }
  }

  public async stop(reason = "WonderWorker stop requested."): Promise<WonderWorkerSnapshot> {
    if (this.status === "stopped" || this.status === "created") {
      this.status = "stopped";
      this.metrics.markStopped();
      return this.getSnapshot();
    }

    this.status = "stopping";
    this.pollController?.abort();
    this.pollController = null;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;

    const deadline = Date.now() + this.configuration.shutdownTimeoutMilliseconds;
    while (this.activeExecutions.size > 0 && Date.now() < deadline) await sleep(25);
    if (this.activeExecutions.size > 0) {
      for (const execution of this.activeExecutions.values()) execution.controller.abort();
      await Promise.allSettled(Array.from(this.activeExecutions.values()).map((item) => item.promise));
    }

    if (this.registration && this.adapter.unregister) {
      await this.adapter.unregister({
        workerId: this.configuration.id,
        registrationId: this.registration.registrationId,
        stoppedAt: new Date().toISOString(),
        reason,
      });
    }

    this.status = "stopped";
    this.metrics.markStopped();
    this.configuration.logger.info("WonderWorker stopped.", { workerId: this.configuration.id, reason });
    return this.getSnapshot();
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(jobId);
    if (!execution) return false;
    execution.controller.abort();
    return true;
  }

  public getSnapshot(): WonderWorkerSnapshot {
    return {
      workerId: this.configuration.id,
      name: this.configuration.name,
      status: this.status,
      capabilities: [...this.configuration.capabilities],
      activeJobIds: Array.from(this.activeExecutions.keys()),
      registration: this.registration ? { ...this.registration } : null,
      metrics: this.metrics.snapshot(),
      lastError: this.lastError,
    };
  }

  private startHeartbeat(): void {
    void this.sendHeartbeat();
    this.heartbeatTimer = setInterval(() => void this.sendHeartbeat(), this.configuration.heartbeatIntervalMilliseconds);
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.registration) return;
    try {
      await this.adapter.heartbeat({
        workerId: this.configuration.id,
        registrationId: this.registration.registrationId,
        status: this.status,
        activeJobCount: this.activeExecutions.size,
        availableConcurrency: Math.max(0, this.configuration.concurrency - this.activeExecutions.size),
        metrics: this.metrics.snapshot(),
        sentAt: new Date().toISOString(),
      });
      this.metrics.markHeartbeatSucceeded();
    } catch (error) {
      const serialized = serializeWonderWorkerError(error);
      this.metrics.markHeartbeatFailed(serialized);
      this.configuration.logger.warn("Worker heartbeat failed.", { error: serialized });
    }
  }

  private startPolling(): void {
    this.pollController = new AbortController();
    void this.pollLoop(this.pollController.signal);
  }

  private async pollLoop(signal: AbortSignal): Promise<void> {
    let consecutiveErrors = 0;
    while (this.status === "running" && !signal.aborted) {
      if (this.activeExecutions.size >= this.configuration.concurrency) {
        await sleep(this.configuration.pollIntervalMilliseconds, signal);
        continue;
      }

      try {
        if (!this.registration) return;
        this.metrics.markClaimAttempt();
        const job = await this.adapter.claim({
          workerId: this.configuration.id,
          registrationId: this.registration.registrationId,
          capabilities: [...this.configuration.capabilities],
          leaseDurationMilliseconds: this.configuration.leaseDurationMilliseconds,
        });
        consecutiveErrors = 0;

        if (!job) {
          await sleep(this.configuration.emptyQueueDelayMilliseconds, signal);
          continue;
        }

        this.metrics.markJobClaimed();
        const controller = new AbortController();
        const promise = this.executeJob(job, controller).finally(() => this.activeExecutions.delete(job.id));
        this.activeExecutions.set(job.id, { controller, promise });
        void promise;
        await sleep(this.configuration.pollIntervalMilliseconds, signal);
      } catch (error) {
        consecutiveErrors += 1;
        const serialized = serializeWonderWorkerError(error);
        this.metrics.markError(serialized);
        this.configuration.logger.warn("Worker poll failed.", { consecutiveErrors, error: serialized });
        if (consecutiveErrors >= this.configuration.maximumConsecutivePollErrors) {
          this.lastError = serialized;
          this.status = "error";
          return;
        }
        await sleep(this.configuration.retryDelayMilliseconds, signal);
      }
    }
  }

  private async executeJob(job: WonderWorkerJob, controller: AbortController): Promise<void> {
    if (!this.registration) return;
    const handler = this.handlers.get(job.type) ?? this.handlers.get("*");
    const started = performance.now();
    this.metrics.markJobStarted();

    if (!handler) {
      const error = new WonderWorkerError(`No handler registered for job type "${job.type}".`, "WONDER_WORKER_HANDLER_NOT_FOUND");
      const serialized = serializeWonderWorkerError(error);
      await this.adapter.fail({
        workerId: this.configuration.id,
        registrationId: this.registration.registrationId,
        jobId: job.id,
        error: serialized,
        durationMilliseconds: 0,
        retryable: false,
        failedAt: new Date().toISOString(),
      });
      this.metrics.markJobFailed(0, serialized);
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const context = new WonderWorkerContext(
        this.configuration.id,
        job.id,
        job.attempt,
        controller.signal,
        this.configuration.logger,
        async (progress, message) => {
          await this.adapter.reportProgress({
            workerId: this.configuration.id,
            registrationId: this.registration!.registrationId,
            jobId: job.id,
            progress,
            message,
          });
        },
        () => this.getSnapshot(),
      );

      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          const error = new WonderWorkerTimeoutError(job.id, this.configuration.handlerTimeoutMilliseconds);
          controller.abort(error);
          reject(error);
        }, this.configuration.handlerTimeoutMilliseconds);
      });

      const result = await Promise.race([Promise.resolve(handler(job, context)), timeoutPromise]);
      const duration = Math.round(performance.now() - started);
      await this.adapter.complete({
        workerId: this.configuration.id,
        registrationId: this.registration.registrationId,
        jobId: job.id,
        result,
        durationMilliseconds: duration,
        completedAt: new Date().toISOString(),
      });
      this.metrics.markJobCompleted(duration);
      this.configuration.logger.info("Job completed.", { jobId: job.id, jobType: job.type, durationMilliseconds: duration });
    } catch (error) {
      const duration = Math.round(performance.now() - started);
      const serialized = serializeWonderWorkerError(error);
      if (serialized.code === "WONDER_WORKER_HANDLER_TIMEOUT") this.metrics.markTimeout();
      const retryable = job.attempt < job.maximumAttempts && serialized.code !== "WONDER_WORKER_HANDLER_NOT_FOUND";
      await this.adapter.fail({
        workerId: this.configuration.id,
        registrationId: this.registration.registrationId,
        jobId: job.id,
        error: serialized,
        durationMilliseconds: duration,
        retryable,
        failedAt: new Date().toISOString(),
      });
      this.metrics.markJobFailed(duration, serialized);
      this.configuration.logger.error("Job failed.", { jobId: job.id, retryable, error: serialized });
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}

export interface WonderInMemoryJobRecord extends WonderWorkerJob {
  status: "queued" | "processing" | "completed" | "failed";
  workerId?: string;
  progress: number;
  progressMessage?: string;
  result?: unknown;
  error?: WonderSerializedError;
  completedAt?: string;
  failedAt?: string;
}

export class WonderInMemoryWorkerAdapter implements WonderWorkerAdapter {
  private readonly jobs = new Map<string, WonderInMemoryJobRecord>();
  private readonly registrations = new Map<string, WonderWorkerRegistration>();

  public enqueue(input: { id?: string; type: string; payload?: WonderUnknownRecord; maximumAttempts?: number; metadata?: WonderUnknownRecord }): WonderInMemoryJobRecord {
    const job: WonderInMemoryJobRecord = {
      id: input.id ?? `wonder-job-${randomUUID()}`,
      type: input.type,
      payload: input.payload ?? {},
      attempt: 0,
      maximumAttempts: input.maximumAttempts ?? 3,
      createdAt: new Date().toISOString(),
      metadata: input.metadata,
      status: "queued",
      progress: 0,
    };
    this.jobs.set(job.id, job);
    return structuredClone(job);
  }

  public getJob(jobId: string): WonderInMemoryJobRecord | null {
    const job = this.jobs.get(jobId);
    return job ? structuredClone(job) : null;
  }

  public listJobs(): WonderInMemoryJobRecord[] {
    return Array.from(this.jobs.values()).map((job) => structuredClone(job));
  }

  public async register(input: WonderWorkerRegistrationInput): Promise<WonderWorkerRegistration> {
    const registration: WonderWorkerRegistration = {
      workerId: input.workerId,
      registrationId: `wonder-registration-${randomUUID()}`,
      registeredAt: new Date().toISOString(),
      leaseDurationMilliseconds: 30_000,
    };
    this.registrations.set(input.workerId, registration);
    return structuredClone(registration);
  }

  public async heartbeat(input: WonderWorkerHeartbeatInput): Promise<void> {
    this.assertRegistration(input.workerId, input.registrationId);
  }

  public async claim(input: WonderWorkerClaimInput): Promise<WonderWorkerJob | null> {
    this.assertRegistration(input.workerId, input.registrationId);
    const job = Array.from(this.jobs.values()).find((candidate) => candidate.status === "queued" && input.capabilities.includes(candidate.type));
    if (!job) return null;
    job.status = "processing";
    job.workerId = input.workerId;
    job.attempt += 1;
    return structuredClone(job);
  }

  public async reportProgress(input: WonderWorkerProgressInput): Promise<void> {
    this.assertRegistration(input.workerId, input.registrationId);
    const job = this.requireJob(input.jobId);
    job.progress = input.progress;
    job.progressMessage = input.message;
  }

  public async complete(input: WonderWorkerCompleteInput): Promise<void> {
    this.assertRegistration(input.workerId, input.registrationId);
    const job = this.requireJob(input.jobId);
    job.status = "completed";
    job.progress = 100;
    job.result = input.result;
    job.completedAt = input.completedAt;
  }

  public async fail(input: WonderWorkerFailInput): Promise<void> {
    this.assertRegistration(input.workerId, input.registrationId);
    const job = this.requireJob(input.jobId);
    job.error = input.error;
    job.failedAt = input.failedAt;
    if (input.retryable && job.attempt < job.maximumAttempts) {
      job.status = "queued";
      job.workerId = undefined;
    } else {
      job.status = "failed";
    }
  }

  public async release(input: WonderWorkerReleaseInput): Promise<void> {
    this.assertRegistration(input.workerId, input.registrationId);
    const job = this.requireJob(input.jobId);
    job.status = "queued";
    job.workerId = undefined;
  }

  public async unregister(input: WonderWorkerUnregisterInput): Promise<void> {
    this.assertRegistration(input.workerId, input.registrationId);
    this.registrations.delete(input.workerId);
  }

  private requireJob(jobId: string): WonderInMemoryJobRecord {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job "${jobId}" does not exist.`);
    return job;
  }

  private assertRegistration(workerId: string, registrationId: string): void {
    const registration = this.registrations.get(workerId);
    if (!registration || registration.registrationId !== registrationId) {
      throw new Error(`Worker registration for "${workerId}" is invalid.`);
    }
  }
}

export function createWonderWorker(configuration: WonderWorkerConfiguration, adapter: WonderWorkerAdapter): WonderWorker {
  return new WonderWorker(configuration, adapter);
}
