import {
    WonderFactory,
  } from "../WonderFactory";
  
  import type {
    WonderFactoryHealthReport,
    WonderFactoryOptions,
    WonderFactorySnapshot,
    WonderFactoryStatistics,
  } from "../WonderFactory";
  
  import {
    WonderScheduler,
  } from "../scheduler/WonderScheduler";
  
  import type {
    WonderSchedulerOptions,
    WonderSchedulerSnapshot,
    WonderSchedulerStatistics,
  } from "../scheduler/WonderScheduler";
  
  import {
    WonderFactoryStorage,
  } from "../storage/WonderFactoryStorage";
  
  import type {
    WonderFactoryAutoSaveHandle,
    WonderFactoryStorageOptions,
    WonderFactoryStorageRestoreResult,
    WonderFactoryStorageSaveResult,
    WonderFactoryStorageStatistics,
  } from "../storage/WonderFactoryStorage";
  
  import {
    WonderSchedulerStorage,
  } from "../storage/WonderSchedulerStorage";
  
  import type {
    WonderSchedulerAutoSaveHandle,
    WonderSchedulerStorageOptions,
    WonderSchedulerStorageRestoreResult,
    WonderSchedulerStorageSaveResult,
    WonderSchedulerStorageStatistics,
  } from "../storage/WonderSchedulerStorage";
  
  // =========================================================
  // RUNTIME TYPES
  // =========================================================
  
  export type WonderRuntimeStatus =
    | "idle"
    | "booting"
    | "running"
    | "paused"
    | "shutting-down"
    | "stopped"
    | "error";
  
  export interface WonderRuntimeOptions {
    /**
     * Runtime identifier.
     */
    id?: string;
  
    /**
     * Human-readable Runtime name.
     */
    name?: string;
  
    /**
     * Factory configuration used when Runtime creates a Factory.
     */
    factory?: WonderFactoryOptions;
  
    /**
     * Scheduler configuration used when Runtime creates a Scheduler.
     */
    scheduler?: WonderSchedulerOptions;
  
    /**
     * Factory persistence configuration.
     */
    factoryStorage?: WonderFactoryStorageOptions;
  
    /**
     * Scheduler persistence configuration.
     */
    schedulerStorage?: WonderSchedulerStorageOptions;
  
    /**
     * Restore Factory state during boot when a state file exists.
     */
    restoreFactoryOnBoot?: boolean;
  
    /**
     * Restore Scheduler state during boot when a state file exists.
     */
    restoreSchedulerOnBoot?: boolean;
  
    /**
     * Recover Factory jobs that were processing before restart.
     */
    recoverProcessingJobsOnBoot?: boolean;
  
    /**
     * Recover overdue Scheduler schedules after restart.
     */
    recoverOverdueSchedulesOnBoot?: boolean;
  
    /**
     * Start Factory automatically during boot.
     */
    startFactoryOnBoot?: boolean;
  
    /**
     * Start Scheduler automatically during boot.
     */
    startSchedulerOnBoot?: boolean;
  
    /**
     * Allow Factory to poll automatically after boot.
     */
    automaticFactoryPolling?: boolean;
  
    /**
     * Allow Scheduler to poll automatically after boot.
     */
    automaticSchedulerPolling?: boolean;
  
    /**
     * Enable Factory state auto-save.
     */
    autoSaveFactory?: boolean;
  
    /**
     * Enable Scheduler state auto-save.
     */
    autoSaveScheduler?: boolean;
  
    /**
     * Shared auto-save interval.
     */
    autoSaveIntervalMilliseconds?: number;
  
    /**
     * Persist immediately when auto-save starts.
     */
    saveImmediatelyOnAutoSaveStart?: boolean;
  
    /**
     * Save final state during shutdown.
     */
    saveOnShutdown?: boolean;
  
    /**
     * Default graceful Factory shutdown timeout.
     */
    shutdownTimeoutMilliseconds?: number;
  }
  
  export interface WonderRuntimeDependencies {
    factory?: WonderFactory;
  
    scheduler?: WonderScheduler;
  
    factoryStorage?: WonderFactoryStorage;
  
    schedulerStorage?: WonderSchedulerStorage;
  }
  
  export interface WonderRuntimeBootOptions {
    restoreFactory?: boolean;
  
    restoreScheduler?: boolean;
  
    recoverProcessingJobs?: boolean;
  
    recoverOverdueSchedules?: boolean;
  
    startFactory?: boolean;
  
    startScheduler?: boolean;
  
    automaticFactoryPolling?: boolean;
  
    automaticSchedulerPolling?: boolean;
  
    startAutoSave?: boolean;
  }
  
  export interface WonderRuntimeShutdownOptions {
    graceful?: boolean;
  
    timeoutMilliseconds?: number;
  
    saveState?: boolean;
  
    cancelActiveJobsOnTimeout?: boolean;
  }
  
  export interface WonderRuntimeRestartOptions {
    shutdown?: WonderRuntimeShutdownOptions;
  
    boot?: WonderRuntimeBootOptions;
  }
  
  export interface WonderRuntimeSaveOptions {
    saveFactory?: boolean;
  
    saveScheduler?: boolean;
  
    createBackup?: boolean;
  }
  
  export interface WonderRuntimeBootResult {
    success: boolean;
  
    previousStatus: WonderRuntimeStatus;
  
    currentStatus: WonderRuntimeStatus;
  
    startedAt: Date;
  
    completedAt: Date;
  
    durationMilliseconds: number;
  
    factoryRestored: boolean;
  
    schedulerRestored: boolean;
  
    factoryStarted: boolean;
  
    schedulerStarted: boolean;
  
    autoSaveStarted: boolean;
  
    factoryRestoreResult:
      WonderFactoryStorageRestoreResult | null;
  
    schedulerRestoreResult:
      WonderSchedulerStorageRestoreResult | null;
  
    warnings: string[];
  }
  
  export interface WonderRuntimeShutdownResult {
    success: boolean;
  
    previousStatus: WonderRuntimeStatus;
  
    currentStatus: WonderRuntimeStatus;
  
    startedAt: Date;
  
    completedAt: Date;
  
    durationMilliseconds: number;
  
    schedulerStopped: boolean;
  
    factoryStopped: boolean;
  
    stateSaved: boolean;
  
    saveResult:
      WonderRuntimeSaveResult | null;
  
    errors: string[];
  }
  
  export interface WonderRuntimeSaveResult {
    success: boolean;
  
    savedAt: Date;
  
    factory:
      WonderFactoryStorageSaveResult | null;
  
    scheduler:
      WonderSchedulerStorageSaveResult | null;
  
    errors: string[];
  }
  
  export interface WonderRuntimeLifecycleResult {
    success: boolean;
  
    previousStatus: WonderRuntimeStatus;
  
    currentStatus: WonderRuntimeStatus;
  
    changedAt: Date;
  }
  
  export interface WonderRuntimeError {
    message: string;
  
    occurredAt: Date;
  
    details: Record<
      string,
      unknown
    >;
  }
  
  export interface WonderRuntimeSnapshot {
    id: string;
  
    name: string;
  
    status: WonderRuntimeStatus;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    bootedAt: Date | null;
  
    stoppedAt: Date | null;
  
    lastSavedAt: Date | null;
  
    factory: WonderFactorySnapshot;
  
    scheduler: WonderSchedulerSnapshot;
  
    lastError: WonderRuntimeError | null;
  }
  
  export interface WonderRuntimeStatistics {
    runtimeId: string;
  
    runtimeStatus: WonderRuntimeStatus;
  
    uptimeMilliseconds: number;
  
    factory: WonderFactoryStatistics;
  
    scheduler: WonderSchedulerStatistics;
  
    factoryStorage: WonderFactoryStorageStatistics;
  
    schedulerStorage: WonderSchedulerStorageStatistics;
  
    autoSaveFactoryRunning: boolean;
  
    autoSaveSchedulerRunning: boolean;
  
    lastSavedAt: Date | null;
  }
  
  export interface WonderRuntimeHealthIssue {
    code: string;
  
    severity:
      | "info"
      | "warning"
      | "error";
  
    message: string;
  }
  
  export interface WonderRuntimeHealthReport {
    healthy: boolean;
  
    checkedAt: Date;
  
    runtimeStatus: WonderRuntimeStatus;
  
    factory: WonderFactoryHealthReport;
  
    factoryStorage: WonderFactoryStorageStatistics;
  
    schedulerStorage: WonderSchedulerStorageStatistics;
  
    issues: WonderRuntimeHealthIssue[];
  }
  
  interface ResolvedWonderRuntimeOptions {
    id: string;
  
    name: string;
  
    factory: WonderFactoryOptions;
  
    scheduler: WonderSchedulerOptions;
  
    factoryStorage: WonderFactoryStorageOptions;
  
    schedulerStorage: WonderSchedulerStorageOptions;
  
    restoreFactoryOnBoot: boolean;
  
    restoreSchedulerOnBoot: boolean;
  
    recoverProcessingJobsOnBoot: boolean;
  
    recoverOverdueSchedulesOnBoot: boolean;
  
    startFactoryOnBoot: boolean;
  
    startSchedulerOnBoot: boolean;
  
    automaticFactoryPolling: boolean;
  
    automaticSchedulerPolling: boolean;
  
    autoSaveFactory: boolean;
  
    autoSaveScheduler: boolean;
  
    autoSaveIntervalMilliseconds: number;
  
    saveImmediatelyOnAutoSaveStart: boolean;
  
    saveOnShutdown: boolean;
  
    shutdownTimeoutMilliseconds: number;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const DEFAULT_RUNTIME_ID =
    "wonder-runtime";
  
  const DEFAULT_RUNTIME_NAME =
    "Wonder Runtime";
  
  const DEFAULT_AUTO_SAVE_INTERVAL_MILLISECONDS =
    30_000;
  
  const MINIMUM_AUTO_SAVE_INTERVAL_MILLISECONDS =
    1_000;
  
  const DEFAULT_SHUTDOWN_TIMEOUT_MILLISECONDS =
    30_000;
  
  const MAXIMUM_SHUTDOWN_TIMEOUT_MILLISECONDS =
    30 * 60 * 1_000;
  
  // =========================================================
  // RUNTIME
  // =========================================================
  
  /**
   * WonderRuntime is the top-level WonderOS orchestrator.
   *
   * Responsibilities:
   *
   * - create or receive Factory and Scheduler instances
   * - restore persisted Factory and Scheduler state
   * - start both execution systems in the correct order
   * - coordinate auto-save
   * - pause and resume the platform
   * - perform graceful shutdown
   * - save final state
   * - expose unified statistics, snapshots and health reports
   *
   * Boot order:
   *
   * storage restore
   * → Factory start
   * → Scheduler start
   * → auto-save start
   *
   * Shutdown order:
   *
   * stop auto-save
   * → stop Scheduler
   * → stop Factory
   * → save final state
   */
  export class WonderRuntime {
    readonly id: string;
  
    readonly name: string;
  
    private readonly options:
      ResolvedWonderRuntimeOptions;
  
    private readonly factory:
      WonderFactory;
  
    private readonly scheduler:
      WonderScheduler;
  
    private readonly factoryStorage:
      WonderFactoryStorage;
  
    private readonly schedulerStorage:
      WonderSchedulerStorage;
  
    private status:
      WonderRuntimeStatus =
      "idle";
  
    private factoryAutoSaveHandle:
      WonderFactoryAutoSaveHandle | null =
      null;
  
    private schedulerAutoSaveHandle:
      WonderSchedulerAutoSaveHandle | null =
      null;
  
    private bootInProgress =
      false;
  
    private shutdownInProgress =
      false;
  
    private saveInProgress =
      false;
  
    private readonly createdAt:
      Date;
  
    private updatedAt:
      Date;
  
    private bootedAt:
      Date | null = null;
  
    private stoppedAt:
      Date | null = null;
  
    private lastSavedAt:
      Date | null = null;
  
    private lastError:
      WonderRuntimeError | null =
      null;
  
    constructor(
      options:
        WonderRuntimeOptions = {},
      dependencies:
        WonderRuntimeDependencies = {}
    ) {
      const now =
        new Date();
  
      this.options =
        resolveWonderRuntimeOptions(
          options
        );
  
      this.id =
        this.options.id;
  
      this.name =
        this.options.name;
  
      this.factory =
        dependencies.factory ??
        new WonderFactory(
          this.options.factory
        );
  
      this.scheduler =
        dependencies.scheduler ??
        new WonderScheduler(
          this.factory,
          this.options.scheduler
        );
  
      if (
        this.scheduler.getFactory() !==
        this.factory
      ) {
        throw new Error(
          "WonderRuntime: Scheduler must use the same Factory instance as the Runtime."
        );
      }
  
      this.factoryStorage =
        dependencies.factoryStorage ??
        new WonderFactoryStorage(
          this.options
            .factoryStorage
        );
  
      this.schedulerStorage =
        dependencies.schedulerStorage ??
        new WonderSchedulerStorage(
          this.options
            .schedulerStorage
        );
  
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
  
    getStatus(): WonderRuntimeStatus {
      return this.status;
    }
  
    getFactory(): WonderFactory {
      return this.factory;
    }
  
    getScheduler(): WonderScheduler {
      return this.scheduler;
    }
  
    getFactoryStorage(): WonderFactoryStorage {
      return this.factoryStorage;
    }
  
    getSchedulerStorage(): WonderSchedulerStorage {
      return this.schedulerStorage;
    }
  
    getOptions(): Readonly<
      ResolvedWonderRuntimeOptions
    > {
      return {
        ...this.options,
  
        factory: {
          ...this.options.factory,
        },
  
        scheduler: {
          ...this.options.scheduler,
        },
  
        factoryStorage: {
          ...this.options
            .factoryStorage,
        },
  
        schedulerStorage: {
          ...this.options
            .schedulerStorage,
        },
      };
    }
  
    getLastError(): WonderRuntimeError | null {
      return this.lastError
        ? cloneRuntimeError(
            this.lastError
          )
        : null;
    }
  
    isRunning(): boolean {
      return this.status ===
        "running";
    }
  
    isPaused(): boolean {
      return this.status ===
        "paused";
    }
  
    isStopped(): boolean {
      return (
        this.status ===
          "stopped" ||
        this.status ===
          "shutting-down"
      );
    }
  
    isAutoSaveRunning(): boolean {
      return (
        this.isFactoryAutoSaveRunning() ||
        this.isSchedulerAutoSaveRunning()
      );
    }
  
    isFactoryAutoSaveRunning(): boolean {
      return (
        this.factoryAutoSaveHandle
          ?.isRunning() ??
        false
      );
    }
  
    isSchedulerAutoSaveRunning(): boolean {
      return (
        this.schedulerAutoSaveHandle
          ?.isRunning() ??
        false
      );
    }
  
    // =========================================================
    // BOOT
    // =========================================================
  
    async boot(
      options:
        WonderRuntimeBootOptions = {}
    ): Promise<WonderRuntimeBootResult> {
      const previousStatus =
        this.status;
  
      const startedAt =
        new Date();
  
      if (
        this.bootInProgress
      ) {
        throw new Error(
          `WonderRuntime: Runtime "${this.id}" is already booting.`
        );
      }
  
      if (
        this.shutdownInProgress
      ) {
        throw new Error(
          `WonderRuntime: Runtime "${this.id}" cannot boot while shutting down.`
        );
      }
  
      if (
        this.status ===
        "running"
      ) {
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          startedAt,
  
          completedAt:
            new Date(),
  
          durationMilliseconds: 0,
  
          factoryRestored: false,
  
          schedulerRestored: false,
  
          factoryStarted:
            this.factory.isRunning(),
  
          schedulerStarted:
            this.scheduler.isRunning(),
  
          autoSaveStarted:
            this.isAutoSaveRunning(),
  
          factoryRestoreResult:
            null,
  
          schedulerRestoreResult:
            null,
  
          warnings: [],
        };
      }
  
      this.bootInProgress =
        true;
  
      this.setStatus(
        "booting"
      );
  
      this.lastError =
        null;
  
      const warnings: string[] =
        [];
  
      let factoryRestoreResult:
        WonderFactoryStorageRestoreResult | null =
        null;
  
      let schedulerRestoreResult:
        WonderSchedulerStorageRestoreResult | null =
        null;
  
      let factoryStarted =
        false;
  
      let schedulerStarted =
        false;
  
      let autoSaveStarted =
        false;
  
      try {
        const restoreFactory =
          options.restoreFactory ??
          this.options
            .restoreFactoryOnBoot;
  
        const restoreScheduler =
          options.restoreScheduler ??
          this.options
            .restoreSchedulerOnBoot;
  
        if (restoreFactory) {
          if (
            await this.factoryStorage
              .exists()
          ) {
            factoryRestoreResult =
              await this.factoryStorage
                .restore(
                  this.factory,
                  {
                    replaceExisting:
                      true,
  
                    recoverProcessingJobs:
                      options
                        .recoverProcessingJobs ??
                      this.options
                        .recoverProcessingJobsOnBoot,
                  }
                );
          } else {
            warnings.push(
              "Factory state file does not exist. Runtime started with the current Factory state."
            );
          }
        }
  
        if (restoreScheduler) {
          if (
            await this.schedulerStorage
              .exists()
          ) {
            schedulerRestoreResult =
              await this.schedulerStorage
                .restore(
                  this.scheduler,
                  {
                    replaceExisting:
                      true,
  
                    recoverOverdueSchedules:
                      options
                        .recoverOverdueSchedules ??
                      this.options
                        .recoverOverdueSchedulesOnBoot,
  
                    recoveryDate:
                      new Date(),
                  }
                );
          } else {
            warnings.push(
              "Scheduler state file does not exist. Runtime started with the current Scheduler state."
            );
          }
        }
  
        const startFactory =
          options.startFactory ??
          this.options
            .startFactoryOnBoot;
  
        if (startFactory) {
          if (
            this.factory.getStatus() ===
            "error"
          ) {
            this.factory.recover();
          }
  
          if (
            !this.factory.isRunning()
          ) {
            await this.factory.start({
              automaticPolling:
                options
                  .automaticFactoryPolling ??
                this.options
                  .automaticFactoryPolling,
            });
          }
  
          factoryStarted =
            this.factory.isRunning();
        }
  
        const startScheduler =
          options.startScheduler ??
          this.options
            .startSchedulerOnBoot;
  
        if (startScheduler) {
          if (
            this.scheduler.getStatus() ===
            "error"
          ) {
            this.scheduler.recover();
          }
  
          if (
            !this.scheduler.isRunning()
          ) {
            await this.scheduler.start({
              automaticPolling:
                options
                  .automaticSchedulerPolling ??
                this.options
                  .automaticSchedulerPolling,
  
              startFactoryIfNeeded:
                startFactory,
            });
          }
  
          schedulerStarted =
            this.scheduler.isRunning();
        }
  
        const startAutoSave =
          options.startAutoSave ??
          (
            this.options
              .autoSaveFactory ||
            this.options
              .autoSaveScheduler
          );
  
        if (startAutoSave) {
          this.startAutoSave();
  
          autoSaveStarted =
            this.isAutoSaveRunning();
        }
  
        const completedAt =
          new Date();
  
        this.bootedAt =
          new Date(
            completedAt.getTime()
          );
  
        this.stoppedAt =
          null;
  
        this.setStatus(
          "running"
        );
  
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          startedAt,
  
          completedAt,
  
          durationMilliseconds:
            Math.max(
              0,
              completedAt.getTime() -
                startedAt.getTime()
            ),
  
          factoryRestored:
            factoryRestoreResult !==
            null,
  
          schedulerRestored:
            schedulerRestoreResult !==
            null,
  
          factoryStarted,
  
          schedulerStarted,
  
          autoSaveStarted,
  
          factoryRestoreResult,
  
          schedulerRestoreResult,
  
          warnings,
        };
      } catch (error) {
        this.stopAutoSave();
  
        this.recordError(
          error,
          {
            operation:
              "boot",
          }
        );
  
        this.setStatus(
          "error"
        );
  
        throw error;
      } finally {
        this.bootInProgress =
          false;
      }
    }
  
    // =========================================================
    // SAVE
    // =========================================================
  
    async save(
      options:
        WonderRuntimeSaveOptions = {}
    ): Promise<WonderRuntimeSaveResult> {
      if (
        this.saveInProgress
      ) {
        return {
          success: false,
  
          savedAt:
            new Date(),
  
          factory: null,
  
          scheduler: null,
  
          errors: [
            "A WonderRuntime save operation is already in progress.",
          ],
        };
      }
  
      this.saveInProgress =
        true;
  
      const saveFactory =
        options.saveFactory ??
        true;
  
      const saveScheduler =
        options.saveScheduler ??
        true;
  
      const createBackup =
        options.createBackup ??
        true;
  
      let factoryResult:
        WonderFactoryStorageSaveResult | null =
        null;
  
      let schedulerResult:
        WonderSchedulerStorageSaveResult | null =
        null;
  
      const errors: string[] =
        [];
  
      try {
        if (saveFactory) {
          try {
            factoryResult =
              await this.factoryStorage
                .save(
                  this.factory,
                  {
                    createBackup,
                  }
                );
          } catch (error) {
            errors.push(
              `Factory save failed: ${getErrorMessage(
                error
              )}`
            );
          }
        }
  
        if (saveScheduler) {
          try {
            schedulerResult =
              await this.schedulerStorage
                .save(
                  this.scheduler,
                  {
                    createBackup,
                  }
                );
          } catch (error) {
            errors.push(
              `Scheduler save failed: ${getErrorMessage(
                error
              )}`
            );
          }
        }
  
        const savedAt =
          new Date();
  
        if (
          factoryResult ||
          schedulerResult
        ) {
          this.lastSavedAt =
            new Date(
              savedAt.getTime()
            );
  
          this.touch();
        }
  
        return {
          success:
            errors.length === 0,
  
          savedAt,
  
          factory:
            factoryResult,
  
          scheduler:
            schedulerResult,
  
          errors,
        };
      } finally {
        this.saveInProgress =
          false;
      }
    }
  
    // =========================================================
    // AUTO SAVE
    // =========================================================
  
    startAutoSave(): void {
      if (
        this.options
          .autoSaveFactory &&
        !this.isFactoryAutoSaveRunning()
      ) {
        this.factoryAutoSaveHandle =
          this.factoryStorage
            .startAutoSave(
              this.factory,
              {
                intervalMilliseconds:
                  this.options
                    .autoSaveIntervalMilliseconds,
  
                saveImmediately:
                  this.options
                    .saveImmediatelyOnAutoSaveStart,
  
                onSaved:
                  async (
                    result
                  ) => {
                    this.lastSavedAt =
                      new Date(
                        result.savedAt
                          .getTime()
                      );
  
                    this.touch();
                  },
  
                onError:
                  async (
                    error
                  ) => {
                    this.recordError(
                      error,
                      {
                        operation:
                          "factory-auto-save",
                      }
                    );
                  },
              }
            );
      }
  
      if (
        this.options
          .autoSaveScheduler &&
        !this.isSchedulerAutoSaveRunning()
      ) {
        this.schedulerAutoSaveHandle =
          this.schedulerStorage
            .startAutoSave(
              this.scheduler,
              {
                intervalMilliseconds:
                  this.options
                    .autoSaveIntervalMilliseconds,
  
                saveImmediately:
                  this.options
                    .saveImmediatelyOnAutoSaveStart,
  
                onSaved:
                  async (
                    result
                  ) => {
                    this.lastSavedAt =
                      new Date(
                        result.savedAt
                          .getTime()
                      );
  
                    this.touch();
                  },
  
                onError:
                  async (
                    error
                  ) => {
                    this.recordError(
                      error,
                      {
                        operation:
                          "scheduler-auto-save",
                      }
                    );
                  },
              }
            );
      }
  
      this.touch();
    }
  
    stopAutoSave(): void {
      this.factoryAutoSaveHandle
        ?.stop();
  
      this.schedulerAutoSaveHandle
        ?.stop();
  
      this.factoryAutoSaveHandle =
        null;
  
      this.schedulerAutoSaveHandle =
        null;
  
      this.factoryStorage
        .stopAutoSave();
  
      this.schedulerStorage
        .stopAutoSave();
  
      this.touch();
    }
  
    // =========================================================
    // PAUSE AND RESUME
    // =========================================================
  
    pause(): WonderRuntimeLifecycleResult {
      const previousStatus =
        this.status;
  
      if (
        this.status ===
        "paused"
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
        this.status !==
        "running"
      ) {
        throw new Error(
          `WonderRuntime: Runtime "${this.id}" cannot pause from status "${this.status}".`
        );
      }
  
      if (
        this.scheduler.isRunning()
      ) {
        this.scheduler.pause();
      }
  
      if (
        this.factory.isRunning()
      ) {
        this.factory.pause();
      }
  
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
  
    resume(): WonderRuntimeLifecycleResult {
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
  
      if (
        this.status !==
        "paused"
      ) {
        throw new Error(
          `WonderRuntime: Runtime "${this.id}" cannot resume from status "${this.status}".`
        );
      }
  
      if (
        this.factory.isPaused()
      ) {
        this.factory.resume({
          automaticPolling:
            this.options
              .automaticFactoryPolling,
        });
      }
  
      if (
        this.scheduler.isPaused()
      ) {
        this.scheduler.resume(
          this.options
            .automaticSchedulerPolling
        );
      }
  
      this.setStatus(
        "running"
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
    // SHUTDOWN
    // =========================================================
  
    async shutdown(
      options:
        WonderRuntimeShutdownOptions = {}
    ): Promise<WonderRuntimeShutdownResult> {
      const previousStatus =
        this.status;
  
      const startedAt =
        new Date();
  
      if (
        this.shutdownInProgress
      ) {
        throw new Error(
          `WonderRuntime: Runtime "${this.id}" is already shutting down.`
        );
      }
  
      if (
        this.bootInProgress
      ) {
        throw new Error(
          `WonderRuntime: Runtime "${this.id}" cannot shut down while booting.`
        );
      }
  
      if (
        this.status ===
        "stopped"
      ) {
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          startedAt,
  
          completedAt:
            new Date(),
  
          durationMilliseconds: 0,
  
          schedulerStopped: true,
  
          factoryStopped: true,
  
          stateSaved: false,
  
          saveResult: null,
  
          errors: [],
        };
      }
  
      this.shutdownInProgress =
        true;
  
      this.setStatus(
        "shutting-down"
      );
  
      this.stopAutoSave();
  
      const errors: string[] =
        [];
  
      let schedulerStopped =
        false;
  
      let factoryStopped =
        false;
  
      let saveResult:
        WonderRuntimeSaveResult | null =
        null;
  
      try {
        if (
          this.scheduler.getStatus() ===
            "running" ||
          this.scheduler.getStatus() ===
            "paused" ||
          this.scheduler.getStatus() ===
            "error"
        ) {
          try {
            await this.scheduler.stop({
              stopFactory:
                false,
            });
  
            schedulerStopped =
              this.scheduler.getStatus() ===
              "stopped";
          } catch (error) {
            errors.push(
              `Scheduler shutdown failed: ${getErrorMessage(
                error
              )}`
            );
          }
        } else {
          schedulerStopped =
            true;
        }
  
        if (
          !this.factory.isStopped()
        ) {
          try {
            const stopResult =
              await this.factory.stop({
                graceful:
                  options.graceful ??
                  true,
  
                timeoutMilliseconds:
                  normaliseShutdownTimeout(
                    options
                      .timeoutMilliseconds,
                    this.options
                      .shutdownTimeoutMilliseconds
                  ),
  
                cancelActiveJobsOnTimeout:
                  options
                    .cancelActiveJobsOnTimeout ??
                  true,
              });
  
            factoryStopped =
              stopResult.currentStatus ===
              "stopped";
          } catch (error) {
            errors.push(
              `Factory shutdown failed: ${getErrorMessage(
                error
              )}`
            );
          }
        } else {
          factoryStopped =
            true;
        }
  
        const saveState =
          options.saveState ??
          this.options
            .saveOnShutdown;
  
        if (saveState) {
          saveResult =
            await this.save({
              saveFactory:
                true,
  
              saveScheduler:
                true,
  
              createBackup:
                true,
            });
  
          if (
            !saveResult.success
          ) {
            errors.push(
              ...saveResult.errors
            );
          }
        }
  
        const completedAt =
          new Date();
  
        this.stoppedAt =
          new Date(
            completedAt.getTime()
          );
  
        const success =
          schedulerStopped &&
          factoryStopped &&
          errors.length === 0;
  
        this.setStatus(
          success
            ? "stopped"
            : "error"
        );
  
        return {
          success,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          startedAt,
  
          completedAt,
  
          durationMilliseconds:
            Math.max(
              0,
              completedAt.getTime() -
                startedAt.getTime()
            ),
  
          schedulerStopped,
  
          factoryStopped,
  
          stateSaved:
            saveResult?.success ??
            false,
  
          saveResult,
  
          errors:
            uniqueStrings(
              errors
            ),
        };
      } catch (error) {
        this.recordError(
          error,
          {
            operation:
              "shutdown",
          }
        );
  
        this.setStatus(
          "error"
        );
  
        throw error;
      } finally {
        this.shutdownInProgress =
          false;
      }
    }
  
    async restart(
      options:
        WonderRuntimeRestartOptions = {}
    ): Promise<WonderRuntimeBootResult> {
      await this.shutdown(
        options.shutdown
      );
  
      return this.boot(
        options.boot
      );
    }
  
    // =========================================================
    // RECOVERY
    // =========================================================
  
    recover(): WonderRuntimeLifecycleResult {
      const previousStatus =
        this.status;
  
      this.stopAutoSave();
  
      if (
        this.factory.getStatus() ===
          "error"
      ) {
        this.factory.recover();
      }
  
      if (
        this.scheduler.getStatus() ===
          "error"
      ) {
        this.scheduler.recover();
      }
  
      this.lastError =
        null;
  
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
    // SNAPSHOT AND STATISTICS
    // =========================================================
  
    getSnapshot(): WonderRuntimeSnapshot {
      return {
        id:
          this.id,
  
        name:
          this.name,
  
        status:
          this.status,
  
        createdAt:
          new Date(
            this.createdAt.getTime()
          ),
  
        updatedAt:
          new Date(
            this.updatedAt.getTime()
          ),
  
        bootedAt:
          cloneNullableDate(
            this.bootedAt
          ),
  
        stoppedAt:
          cloneNullableDate(
            this.stoppedAt
          ),
  
        lastSavedAt:
          cloneNullableDate(
            this.lastSavedAt
          ),
  
        factory:
          this.factory
            .getSnapshot(),
  
        scheduler:
          this.scheduler
            .createSnapshot(),
  
        lastError:
          this.lastError
            ? cloneRuntimeError(
                this.lastError
              )
            : null,
      };
    }
  
    async getStatistics(
      at = new Date()
    ): Promise<WonderRuntimeStatistics> {
      const [
        factoryStorageStatistics,
        schedulerStorageStatistics,
      ] =
        await Promise.all([
          this.factoryStorage
            .getStatistics(),
  
          this.schedulerStorage
            .getStatistics(),
        ]);
  
      return {
        runtimeId:
          this.id,
  
        runtimeStatus:
          this.status,
  
        uptimeMilliseconds:
          calculateUptime(
            this.bootedAt,
            this.stoppedAt,
            at
          ),
  
        factory:
          this.factory
            .getStatistics(at),
  
        scheduler:
          this.scheduler
            .getStatistics(at),
  
        factoryStorage:
          factoryStorageStatistics,
  
        schedulerStorage:
          schedulerStorageStatistics,
  
        autoSaveFactoryRunning:
          this.isFactoryAutoSaveRunning(),
  
        autoSaveSchedulerRunning:
          this.isSchedulerAutoSaveRunning(),
  
        lastSavedAt:
          cloneNullableDate(
            this.lastSavedAt
          ),
      };
    }
  
    async getHealthReport(
      at = new Date()
    ): Promise<WonderRuntimeHealthReport> {
      const [
        factoryStorageStatistics,
        schedulerStorageStatistics,
      ] =
        await Promise.all([
          this.factoryStorage
            .getStatistics(),
  
          this.schedulerStorage
            .getStatistics(),
        ]);
  
      const factoryHealth =
        this.factory
          .getHealthReport(at);
  
      const issues:
        WonderRuntimeHealthIssue[] =
        [];
  
      if (
        this.status ===
        "error"
      ) {
        issues.push({
          code:
            "RUNTIME_ERROR",
  
          severity:
            "error",
  
          message:
            this.lastError?.message ??
            "Wonder Runtime is in an error state.",
        });
      }
  
      if (
        this.status ===
          "running" &&
        !this.factory.isRunning()
      ) {
        issues.push({
          code:
            "FACTORY_NOT_RUNNING",
  
          severity:
            "error",
  
          message:
            "Wonder Runtime is running but its Factory is not running.",
        });
      }
  
      if (
        this.status ===
          "running" &&
        !this.scheduler.isRunning()
      ) {
        issues.push({
          code:
            "SCHEDULER_NOT_RUNNING",
  
          severity:
            "warning",
  
          message:
            "Wonder Runtime is running but its Scheduler is not running.",
        });
      }
  
      if (
        !factoryStorageStatistics
          .exists
      ) {
        issues.push({
          code:
            "FACTORY_STATE_NOT_SAVED",
  
          severity:
            "info",
  
          message:
            "Factory persistence file does not exist yet.",
        });
      }
  
      if (
        !schedulerStorageStatistics
          .exists
      ) {
        issues.push({
          code:
            "SCHEDULER_STATE_NOT_SAVED",
  
          severity:
            "info",
  
          message:
            "Scheduler persistence file does not exist yet.",
        });
      }
  
      for (
        const factoryIssue of
          factoryHealth.issues
      ) {
        issues.push({
          code:
            `FACTORY_${factoryIssue.code}`,
  
          severity:
            factoryIssue.severity,
  
          message:
            factoryIssue.message,
        });
      }
  
      return {
        healthy:
          !issues.some(
            (issue) =>
              issue.severity ===
              "error"
          ),
  
        checkedAt:
          new Date(
            at.getTime()
          ),
  
        runtimeStatus:
          this.status,
  
        factory:
          factoryHealth,
  
        factoryStorage:
          factoryStorageStatistics,
  
        schedulerStorage:
          schedulerStorageStatistics,
  
        issues,
      };
    }
  
    // =========================================================
    // INTERNAL
    // =========================================================
  
    private setStatus(
      status:
        WonderRuntimeStatus
    ): void {
      this.status =
        status;
  
      this.touch();
    }
  
    private recordError(
      error: unknown,
      details:
        Record<
          string,
          unknown
        > = {}
    ): void {
      this.lastError = {
        message:
          getErrorMessage(
            error
          ),
  
        occurredAt:
          new Date(),
  
        details: {
          ...details,
        },
      };
  
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
  
  function resolveWonderRuntimeOptions(
    options:
      WonderRuntimeOptions
  ): ResolvedWonderRuntimeOptions {
    return {
      id:
        normaliseOptionalText(
          options.id
        ) ??
        DEFAULT_RUNTIME_ID,
  
      name:
        normaliseOptionalText(
          options.name
        ) ??
        DEFAULT_RUNTIME_NAME,
  
      factory: {
        ...(options.factory ??
          {}),
      },
  
      scheduler: {
        ...(options.scheduler ??
          {}),
      },
  
      factoryStorage: {
        ...(options.factoryStorage ??
          {}),
      },
  
      schedulerStorage: {
        ...(options.schedulerStorage ??
          {}),
      },
  
      restoreFactoryOnBoot:
        options
          .restoreFactoryOnBoot ??
        true,
  
      restoreSchedulerOnBoot:
        options
          .restoreSchedulerOnBoot ??
        true,
  
      recoverProcessingJobsOnBoot:
        options
          .recoverProcessingJobsOnBoot ??
        true,
  
      recoverOverdueSchedulesOnBoot:
        options
          .recoverOverdueSchedulesOnBoot ??
        true,
  
      startFactoryOnBoot:
        options
          .startFactoryOnBoot ??
        true,
  
      startSchedulerOnBoot:
        options
          .startSchedulerOnBoot ??
        true,
  
      automaticFactoryPolling:
        options
          .automaticFactoryPolling ??
        true,
  
      automaticSchedulerPolling:
        options
          .automaticSchedulerPolling ??
        true,
  
      autoSaveFactory:
        options.autoSaveFactory ??
        true,
  
      autoSaveScheduler:
        options.autoSaveScheduler ??
        true,
  
      autoSaveIntervalMilliseconds:
        Math.max(
          MINIMUM_AUTO_SAVE_INTERVAL_MILLISECONDS,
          Math.floor(
            options
              .autoSaveIntervalMilliseconds ??
            DEFAULT_AUTO_SAVE_INTERVAL_MILLISECONDS
          )
        ),
  
      saveImmediatelyOnAutoSaveStart:
        options
          .saveImmediatelyOnAutoSaveStart ??
        false,
  
      saveOnShutdown:
        options.saveOnShutdown ??
        true,
  
      shutdownTimeoutMilliseconds:
        normaliseShutdownTimeout(
          options
            .shutdownTimeoutMilliseconds,
          DEFAULT_SHUTDOWN_TIMEOUT_MILLISECONDS
        ),
    };
  }
  
  // =========================================================
  // TYPE GUARDS
  // =========================================================
  
  export function isWonderRuntimeStatus(
    value: unknown
  ): value is WonderRuntimeStatus {
    return (
      value === "idle" ||
      value === "booting" ||
      value === "running" ||
      value === "paused" ||
      value ===
        "shutting-down" ||
      value === "stopped" ||
      value === "error"
    );
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneRuntimeError(
    error:
      WonderRuntimeError
  ): WonderRuntimeError {
    return {
      message:
        error.message,
  
      occurredAt:
        new Date(
          error.occurredAt
            .getTime()
        ),
  
      details: {
        ...error.details,
      },
    };
  }
  
  function cloneNullableDate(
    value:
      Date | null
  ): Date | null {
    return value
      ? new Date(
          value.getTime()
        )
      : null;
  }
  
  // =========================================================
  // HELPERS
  // =========================================================
  
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
  
  function normaliseShutdownTimeout(
    value:
      | number
      | undefined,
    fallback: number
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return fallback;
    }
  
    return Math.min(
      MAXIMUM_SHUTDOWN_TIMEOUT_MILLISECONDS,
      Math.max(
        1,
        Math.floor(value)
      )
    );
  }
  
  function calculateUptime(
    bootedAt: Date | null,
    stoppedAt: Date | null,
    at: Date
  ): number {
    if (!bootedAt) {
      return 0;
    }
  
    const endTime =
      stoppedAt?.getTime() ??
      at.getTime();
  
    return Math.max(
      0,
      endTime -
        bootedAt.getTime()
    );
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
              value.length > 0
          )
      )
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
  
  // =========================================================
  // DEFAULT INSTANCE
  // =========================================================
  
  export const wonderRuntime =
    new WonderRuntime();
  
  export default WonderRuntime;