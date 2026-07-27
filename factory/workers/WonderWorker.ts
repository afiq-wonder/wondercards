import type {
    WonderJob,
    WonderJobType,
  } from "../types/WonderJob";
  
  import {
    cloneWonderJob,
  } from "../types/WonderJob";
  
  export type WonderWorkerStatus =
    | "idle"
    | "busy"
    | "offline"
    | "stopped"
    | "error";
  
  export type WonderWorkerCapability =
    WonderJobType;
  
  export interface WonderWorkerHeartbeat {
    workerId: string;
  
    status: WonderWorkerStatus;
  
    currentJobId: string | null;
  
    recordedAt: Date;
  }
  
  export interface WonderWorkerProgress {
    completedItems: number;
  
    totalItems: number;
  
    percentage: number;
  
    message: string | null;
  }
  
  export interface WonderWorkerExecutionContext {
    workerId: string;
  
    jobId: string;
  
    batchId: string;
  
    attemptNumber: number;
  
    signal: AbortSignal;
  
    heartbeat(): WonderWorkerHeartbeat;
  
    reportProgress(
      update: WonderWorkerProgressUpdate
    ): Promise<void>;
  }
  
  export interface WonderWorkerProgressUpdate {
    completedItems?: number;
  
    totalItems?: number;
  
    message?: string | null;
  }
  
  export interface WonderWorkerExecutionResult<
    TResult = unknown
  > {
    success: boolean;
  
    workerId: string;
  
    jobId: string;
  
    result: TResult | null;
  
    error: WonderWorkerError | null;
  
    startedAt: Date;
  
    completedAt: Date;
  
    durationMilliseconds: number;
  }
  
  export interface WonderWorkerError {
    message: string;
  
    code: string | null;
  
    retryable: boolean;
  
    details: Record<
      string,
      unknown
    >;
  }
  
  export interface WonderWorkerSnapshot {
    id: string;
  
    name: string;
  
    status: WonderWorkerStatus;
  
    capabilities: WonderWorkerCapability[];
  
    currentJobId: string | null;
  
    completedJobs: number;
  
    failedJobs: number;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    lastHeartbeatAt: Date;
  }
  
  export interface WonderWorkerOptions {
    id: string;
  
    name?: string;
  
    capabilities:
      readonly WonderWorkerCapability[];
  
    executor: WonderWorkerExecutor;
  
    initiallyOnline?: boolean;
  }
  
  export interface WonderWorkerExecuteOptions {
    onProgress?: (
      update: WonderWorkerProgress
    ) => void | Promise<void>;
  
    signal?: AbortSignal;
  }
  
  export type WonderWorkerExecutor<
    TPayload = unknown,
    TResult = unknown
  > = (
    job: WonderJob<
      TPayload,
      TResult
    >,
    context: WonderWorkerExecutionContext
  ) => TResult | Promise<TResult>;
  
  export interface WonderWorkerRegistryStatistics {
    totalWorkers: number;
  
    idleWorkers: number;
  
    busyWorkers: number;
  
    offlineWorkers: number;
  
    stoppedWorkers: number;
  
    errorWorkers: number;
  
    completedJobs: number;
  
    failedJobs: number;
  
    workersByCapability: Record<
      WonderWorkerCapability,
      number
    >;
  }
  
  const MAXIMUM_PROGRESS_ITEMS =
    1_000_000_000;
  
  /**
   * Executes Wonder Factory jobs.
   *
   * Queue lifecycle remains owned by WonderQueue:
   *
   * queued
   * → processing
   * → completed / failed
   *
   * WonderWorker only performs the job's actual work and returns
   * an execution result to WonderFactory.
   */
  export class WonderWorker {
    readonly id: string;
  
    readonly name: string;
  
    private readonly capabilities:
      Set<WonderWorkerCapability>;
  
    private readonly executor:
      WonderWorkerExecutor;
  
    private status:
      WonderWorkerStatus;
  
    private currentJobId:
      string | null = null;
  
    private completedJobs = 0;
  
    private failedJobs = 0;
  
    private readonly createdAt:
      Date;
  
    private updatedAt:
      Date;
  
    private lastHeartbeatAt:
      Date;
  
    private activeAbortController:
      AbortController | null = null;
  
    constructor(
      options: WonderWorkerOptions
    ) {
      const now = new Date();
  
      this.id =
        normaliseRequiredText(
          options.id,
          "id"
        );
  
      this.name =
        normaliseOptionalText(
          options.name
        ) ??
        this.id;
  
      this.capabilities =
        new Set(
          normaliseCapabilities(
            options.capabilities
          )
        );
  
      if (
        this.capabilities.size === 0
      ) {
        throw new Error(
          `WonderWorker: worker "${this.id}" requires at least one capability.`
        );
      }
  
      if (
        typeof options.executor !==
        "function"
      ) {
        throw new Error(
          `WonderWorker: worker "${this.id}" requires an executor function.`
        );
      }
  
      this.executor =
        options.executor;
  
      this.status =
        options.initiallyOnline ===
        false
          ? "offline"
          : "idle";
  
      this.createdAt =
        new Date(
          now.getTime()
        );
  
      this.updatedAt =
        new Date(
          now.getTime()
        );
  
      this.lastHeartbeatAt =
        new Date(
          now.getTime()
        );
    }
  
    // =========================================================
    // CAPABILITIES
    // =========================================================
  
    getCapabilities(): WonderWorkerCapability[] {
      return Array.from(
        this.capabilities
      );
    }
  
    canHandle(
      type: WonderJobType
    ): boolean {
      return this.capabilities.has(
        type
      );
    }
  
    supportsAll(
      types:
        readonly WonderJobType[]
    ): boolean {
      return types.every(
        (type) =>
          this.canHandle(type)
      );
    }
  
    supportsAny(
      types:
        readonly WonderJobType[]
    ): boolean {
      return types.some(
        (type) =>
          this.canHandle(type)
      );
    }
  
    // =========================================================
    // STATUS
    // =========================================================
  
    getStatus(): WonderWorkerStatus {
      return this.status;
    }
  
    getCurrentJobId(): string | null {
      return this.currentJobId;
    }
  
    isAvailable(
      jobType?: WonderJobType
    ): boolean {
      if (
        this.status !== "idle" ||
        this.currentJobId !== null
      ) {
        return false;
      }
  
      return jobType
        ? this.canHandle(
            jobType
          )
        : true;
    }
  
    isBusy(): boolean {
      return this.status === "busy";
    }
  
    isOnline(): boolean {
      return (
        this.status === "idle" ||
        this.status === "busy"
      );
    }
  
    start(): void {
      if (
        this.status === "busy"
      ) {
        throw new Error(
          `WonderWorker: busy worker "${this.id}" cannot be started again.`
        );
      }
  
      this.setStatus("idle");
    }
  
    setOffline(): void {
      if (
        this.status === "busy"
      ) {
        throw new Error(
          `WonderWorker: busy worker "${this.id}" cannot be taken offline.`
        );
      }
  
      this.setStatus("offline");
    }
  
    stop(): void {
      if (
        this.activeAbortController
      ) {
        this.activeAbortController.abort(
          new Error(
            `WonderWorker "${this.id}" was stopped.`
          )
        );
      }
  
      this.currentJobId = null;
  
      this.activeAbortController =
        null;
  
      this.setStatus("stopped");
    }
  
    recover(): void {
      if (
        this.status !== "error" &&
        this.status !== "offline" &&
        this.status !== "stopped"
      ) {
        return;
      }
  
      this.currentJobId = null;
  
      this.activeAbortController =
        null;
  
      this.setStatus("idle");
    }
  
    // =========================================================
    // HEARTBEAT
    // =========================================================
  
    heartbeat(): WonderWorkerHeartbeat {
      const now = new Date();
  
      this.lastHeartbeatAt =
        new Date(
          now.getTime()
        );
  
      this.updatedAt =
        new Date(
          now.getTime()
        );
  
      return {
        workerId:
          this.id,
  
        status:
          this.status,
  
        currentJobId:
          this.currentJobId,
  
        recordedAt:
          new Date(
            now.getTime()
          ),
      };
    }
  
    getLastHeartbeatAt(): Date {
      return new Date(
        this.lastHeartbeatAt.getTime()
      );
    }
  
    isHeartbeatExpired(
      maximumAgeMilliseconds: number,
      at = new Date()
    ): boolean {
      const maximumAge =
        Math.max(
          0,
          Math.floor(
            maximumAgeMilliseconds
          )
        );
  
      return (
        at.getTime() -
          this.lastHeartbeatAt.getTime() >
        maximumAge
      );
    }
  
    // =========================================================
    // EXECUTION
    // =========================================================
  
    async execute<
      TPayload = unknown,
      TResult = unknown
    >(
      job: WonderJob<
        TPayload,
        TResult
      >,
      options: WonderWorkerExecuteOptions = {}
    ): Promise<
      WonderWorkerExecutionResult<TResult>
    > {
      this.assertCanExecute(job);
  
      const startedAt =
        new Date();
  
      const controller =
        new AbortController();
  
      this.activeAbortController =
        controller;
  
      this.currentJobId =
        job.id;
  
      this.setStatus("busy");
  
      const externalSignal =
        options.signal;
  
      const abortFromExternalSignal =
        (): void => {
          controller.abort(
            externalSignal?.reason
          );
        };
  
      if (externalSignal) {
        if (externalSignal.aborted) {
          abortFromExternalSignal();
        } else {
          externalSignal.addEventListener(
            "abort",
            abortFromExternalSignal,
            {
              once: true,
            }
          );
        }
      }
  
      try {
        const context:
          WonderWorkerExecutionContext = {
          workerId:
            this.id,
  
          jobId:
            job.id,
  
          batchId:
            job.batchId,
  
          attemptNumber:
            job.attemptCount,
  
          signal:
            controller.signal,
  
          heartbeat:
            () =>
              this.heartbeat(),
  
          reportProgress:
            async (
              update
            ): Promise<void> => {
              const progress =
                createProgressUpdate(
                  job,
                  update
                );
  
              await options.onProgress?.(
                progress
              );
  
              this.heartbeat();
            },
        };
  
        const result =
          await this.executor(
            cloneWonderJob(
              job
            ),
            context
          ) as TResult;
  
        const completedAt =
          new Date();
  
        this.completedJobs += 1;
  
        this.currentJobId = null;
  
        this.activeAbortController =
          null;
  
        this.setStatus("idle");
  
        return {
          success: true,
  
          workerId:
            this.id,
  
          jobId:
            job.id,
  
          result,
  
          error: null,
  
          startedAt:
            new Date(
              startedAt.getTime()
            ),
  
          completedAt:
            new Date(
              completedAt.getTime()
            ),
  
          durationMilliseconds:
            Math.max(
              0,
              completedAt.getTime() -
                startedAt.getTime()
            ),
        };
      } catch (error) {
        const completedAt =
          new Date();
  
        const workerError =
          createWorkerError(
            error,
            controller.signal.aborted
          );
  
        this.failedJobs += 1;
  
        this.currentJobId = null;
  
        this.activeAbortController =
          null;
  
        this.setStatus(
          workerError.retryable
            ? "idle"
            : "error"
        );
  
        return {
          success: false,
  
          workerId:
            this.id,
  
          jobId:
            job.id,
  
          result: null,
  
          error:
            workerError,
  
          startedAt:
            new Date(
              startedAt.getTime()
            ),
  
          completedAt:
            new Date(
              completedAt.getTime()
            ),
  
          durationMilliseconds:
            Math.max(
              0,
              completedAt.getTime() -
                startedAt.getTime()
            ),
        };
      } finally {
        if (externalSignal) {
          externalSignal.removeEventListener(
            "abort",
            abortFromExternalSignal
          );
        }
      }
    }
  
    cancelCurrentJob(
      reason =
        `WonderWorker "${this.id}" cancelled its current job.`
    ): boolean {
      if (
        !this.activeAbortController ||
        !this.currentJobId
      ) {
        return false;
      }
  
      this.activeAbortController.abort(
        new Error(reason)
      );
  
      return true;
    }
  
    // =========================================================
    // SNAPSHOT
    // =========================================================
  
    getSnapshot(): WonderWorkerSnapshot {
      return {
        id:
          this.id,
  
        name:
          this.name,
  
        status:
          this.status,
  
        capabilities:
          this.getCapabilities(),
  
        currentJobId:
          this.currentJobId,
  
        completedJobs:
          this.completedJobs,
  
        failedJobs:
          this.failedJobs,
  
        createdAt:
          new Date(
            this.createdAt.getTime()
          ),
  
        updatedAt:
          new Date(
            this.updatedAt.getTime()
          ),
  
        lastHeartbeatAt:
          new Date(
            this.lastHeartbeatAt.getTime()
          ),
      };
    }
  
    // =========================================================
    // INTERNAL
    // =========================================================
  
    private assertCanExecute(
      job: WonderJob<
        unknown,
        unknown
      >
    ): void {
      if (
        this.status !== "idle"
      ) {
        throw new Error(
          `WonderWorker: worker "${this.id}" is not idle. Current status: "${this.status}".`
        );
      }
  
      if (
        this.currentJobId !== null
      ) {
        throw new Error(
          `WonderWorker: worker "${this.id}" is already assigned to job "${this.currentJobId}".`
        );
      }
  
      if (
        job.status !==
        "processing"
      ) {
        throw new Error(
          `WonderWorker: job "${job.id}" must be processing before execution. Current status: "${job.status}".`
        );
      }
  
      if (
        !this.canHandle(
          job.type
        )
      ) {
        throw new Error(
          `WonderWorker: worker "${this.id}" cannot handle job type "${job.type}".`
        );
      }
    }
  
    private setStatus(
      status: WonderWorkerStatus
    ): void {
      this.status = status;
  
      this.updatedAt =
        new Date();
  
      this.lastHeartbeatAt =
        new Date();
    }
  }
  
  // =========================================================
  // WORKER REGISTRY
  // =========================================================
  
  export class WonderWorkerRegistry {
    private readonly workers =
      new Map<
        string,
        WonderWorker
      >();
  
    register(
      worker: WonderWorker
    ): WonderWorker {
      if (
        this.workers.has(
          worker.id
        )
      ) {
        throw new Error(
          `WonderWorkerRegistry: worker "${worker.id}" is already registered.`
        );
      }
  
      this.workers.set(
        worker.id,
        worker
      );
  
      return worker;
    }
  
    unregister(
      workerId: string,
      force = false
    ): boolean {
      const worker =
        this.requireWorker(
          workerId
        );
  
      if (
        worker.isBusy() &&
        !force
      ) {
        throw new Error(
          `WonderWorkerRegistry: busy worker "${worker.id}" cannot be removed without force.`
        );
      }
  
      if (
        force &&
        worker.isBusy()
      ) {
        worker.stop();
      }
  
      return this.workers.delete(
        worker.id
      );
    }
  
    getWorker(
      workerId: string
    ): WonderWorker | null {
      return (
        this.workers.get(
          normaliseRequiredText(
            workerId,
            "workerId"
          )
        ) ??
        null
      );
    }
  
    hasWorker(
      workerId: string
    ): boolean {
      return this.workers.has(
        normaliseRequiredText(
          workerId,
          "workerId"
        )
      );
    }
  
    listWorkers(): WonderWorker[] {
      return Array.from(
        this.workers.values()
      );
    }
  
    listSnapshots(): WonderWorkerSnapshot[] {
      return this.listWorkers()
        .map(
          (worker) =>
            worker.getSnapshot()
        )
        .sort(
          (
            first,
            second
          ) =>
            first.id.localeCompare(
              second.id
            )
        );
    }
  
    findAvailableWorker(
      jobType: WonderJobType
    ): WonderWorker | null {
      return (
        this.listWorkers()
          .filter(
            (worker) =>
              worker.isAvailable(
                jobType
              )
          )
          .sort(
            compareAvailableWorkers
          )[0] ??
        null
      );
    }
  
    findAvailableWorkers(
      jobType?: WonderJobType
    ): WonderWorker[] {
      return this.listWorkers()
        .filter(
          (worker) =>
            worker.isAvailable(
              jobType
            )
        )
        .sort(
          compareAvailableWorkers
        );
    }
  
    getWorkersByCapability(
      capability:
        WonderWorkerCapability
    ): WonderWorker[] {
      return this.listWorkers()
        .filter(
          (worker) =>
            worker.canHandle(
              capability
            )
        );
    }
  
    getStatistics(): WonderWorkerRegistryStatistics {
      const snapshots =
        this.listSnapshots();
  
      const workersByCapability =
        createEmptyCapabilityCounts();
  
      let idleWorkers = 0;
      let busyWorkers = 0;
      let offlineWorkers = 0;
      let stoppedWorkers = 0;
      let errorWorkers = 0;
      let completedJobs = 0;
      let failedJobs = 0;
  
      for (
        const snapshot of
          snapshots
      ) {
        completedJobs +=
          snapshot.completedJobs;
  
        failedJobs +=
          snapshot.failedJobs;
  
        for (
          const capability of
            snapshot.capabilities
        ) {
          workersByCapability[
            capability
          ] += 1;
        }
  
        switch (
          snapshot.status
        ) {
          case "idle":
            idleWorkers += 1;
            break;
  
          case "busy":
            busyWorkers += 1;
            break;
  
          case "offline":
            offlineWorkers += 1;
            break;
  
          case "stopped":
            stoppedWorkers += 1;
            break;
  
          case "error":
            errorWorkers += 1;
            break;
        }
      }
  
      return {
        totalWorkers:
          snapshots.length,
  
        idleWorkers,
  
        busyWorkers,
  
        offlineWorkers,
  
        stoppedWorkers,
  
        errorWorkers,
  
        completedJobs,
  
        failedJobs,
  
        workersByCapability,
      };
    }
  
    clear(
      force = false
    ): number {
      const workerIds =
        Array.from(
          this.workers.keys()
        );
  
      let removed = 0;
  
      for (
        const workerId of
          workerIds
      ) {
        try {
          if (
            this.unregister(
              workerId,
              force
            )
          ) {
            removed += 1;
          }
        } catch {
          // Busy workers remain when force is false.
        }
      }
  
      return removed;
    }
  
    size(): number {
      return this.workers.size;
    }
  
    private requireWorker(
      workerId: string
    ): WonderWorker {
      const cleanWorkerId =
        normaliseRequiredText(
          workerId,
          "workerId"
        );
  
      const worker =
        this.workers.get(
          cleanWorkerId
        );
  
      if (!worker) {
        throw new Error(
          `WonderWorkerRegistry: worker "${cleanWorkerId}" was not found.`
        );
      }
  
      return worker;
    }
  }
  
  // =========================================================
  // PROGRESS
  // =========================================================
  
  function createProgressUpdate(
    job: WonderJob<
      unknown,
      unknown
    >,
    update:
      WonderWorkerProgressUpdate
  ): WonderWorkerProgress {
    const totalItems =
      clampInteger(
        update.totalItems ??
          job.progress.totalItems,
        0,
        MAXIMUM_PROGRESS_ITEMS
      );
  
    const completedItems =
      clampInteger(
        update.completedItems ??
          job.progress.completedItems,
        0,
        totalItems
      );
  
    return {
      completedItems,
  
      totalItems,
  
      percentage:
        calculatePercentage(
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
    };
  }
  
  // =========================================================
  // ERRORS
  // =========================================================
  
  function createWorkerError(
    error: unknown,
    aborted: boolean
  ): WonderWorkerError {
    if (
      error instanceof
      WonderWorkerExecutionError
    ) {
      return {
        message:
          error.message,
  
        code:
          error.code,
  
        retryable:
          error.retryable,
  
        details: {
          ...error.details,
        },
      };
    }
  
    if (
      error instanceof Error
    ) {
      return {
        message:
          error.message,
  
        code:
          aborted
            ? "WORKER_ABORTED"
            : null,
  
        retryable:
          aborted,
  
        details: {
          name:
            error.name,
  
          stack:
            error.stack ??
            null,
        },
      };
    }
  
    return {
      message:
        String(error),
  
      code:
        aborted
          ? "WORKER_ABORTED"
          : null,
  
      retryable:
        aborted,
  
      details: {},
    };
  }
  
  export class WonderWorkerExecutionError
    extends Error {
    readonly code:
      string | null;
  
    readonly retryable:
      boolean;
  
    readonly details:
      Record<
        string,
        unknown
      >;
  
    constructor(
      message: string,
      options: {
        code?: string | null;
  
        retryable?: boolean;
  
        details?: Record<
          string,
          unknown
        >;
      } = {}
    ) {
      super(
        normaliseRequiredText(
          message,
          "message"
        )
      );
  
      this.name =
        "WonderWorkerExecutionError";
  
      this.code =
        normaliseOptionalText(
          options.code
        );
  
      this.retryable =
        options.retryable ??
        true;
  
      this.details = {
        ...(options.details ??
          {}),
      };
    }
  }
  
  // =========================================================
  // SORTING
  // =========================================================
  
  function compareAvailableWorkers(
    first: WonderWorker,
    second: WonderWorker
  ): number {
    const firstSnapshot =
      first.getSnapshot();
  
    const secondSnapshot =
      second.getSnapshot();
  
    if (
      firstSnapshot.completedJobs !==
      secondSnapshot.completedJobs
    ) {
      return (
        firstSnapshot.completedJobs -
        secondSnapshot.completedJobs
      );
    }
  
    if (
      firstSnapshot.failedJobs !==
      secondSnapshot.failedJobs
    ) {
      return (
        firstSnapshot.failedJobs -
        secondSnapshot.failedJobs
      );
    }
  
    return first.id.localeCompare(
      second.id
    );
  }
  
  // =========================================================
  // COUNTS
  // =========================================================
  
  function createEmptyCapabilityCounts(): Record<
    WonderWorkerCapability,
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
  
  // =========================================================
  // NORMALISATION
  // =========================================================
  
  function normaliseCapabilities(
    capabilities:
      readonly WonderWorkerCapability[]
  ): WonderWorkerCapability[] {
    return Array.from(
      new Set(
        capabilities.filter(
          isWonderWorkerCapability
        )
      )
    );
  }
  
  export function isWonderWorkerCapability(
    value: unknown
  ): value is WonderWorkerCapability {
    return (
      value ===
        "generation" ||
      value ===
        "validation" ||
      value ===
        "repair" ||
      value ===
        "approval" ||
      value ===
        "publication" ||
      value ===
        "export"
    );
  }
  
  export function isWonderWorkerStatus(
    value: unknown
  ): value is WonderWorkerStatus {
    return (
      value === "idle" ||
      value === "busy" ||
      value === "offline" ||
      value === "stopped" ||
      value === "error"
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
        `WonderWorker: "${fieldName}" must be a string.`
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new Error(
        `WonderWorker: "${fieldName}" is required.`
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
  
  function calculatePercentage(
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
  
  export const wonderWorkerRegistry =
    new WonderWorkerRegistry();
  
  export default WonderWorker;