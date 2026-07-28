import type {
    WonderFactory,
    WonderFactorySnapshot,
  } from "../WonderFactory";
  
  import type {
    WonderScheduler,
    WonderSchedulerSnapshot,
  } from "../scheduler/WonderScheduler";
  
  import {
    WonderStorageError,
  } from "../storage/WonderStorageAdapter";
  
  import type {
    WonderStorageAdapter,
    WonderStorageLoadResult,
    WonderStorageSaveResult,
  } from "../storage/WonderStorageAdapter";
  
  // =========================================================
  // PERSISTED STATE
  // =========================================================
  
  export interface WonderRuntimePersistedState {
    version: number;
  
    runtimeId: string;
  
    runtimeName: string;
  
    savedAt: Date;
  
    factory:
      WonderFactorySnapshot;
  
    scheduler:
      WonderSchedulerSnapshot;
  
    metadata: Record<
      string,
      unknown
    >;
  }
  
  // =========================================================
  // CAPTURE / RESTORE CONTRACTS
  // =========================================================
  
  export interface WonderRuntimePersistenceCaptureContext {
    runtimeId: string;
  
    runtimeName: string;
  
    factory: WonderFactory;
  
    scheduler: WonderScheduler;
  
    savedAt: Date;
  
    metadata: Readonly<
      Record<string, unknown>
    >;
  }
  
  export interface WonderRuntimePersistenceRestoreContext {
    runtimeId: string;
  
    runtimeName: string;
  
    factory: WonderFactory;
  
    scheduler: WonderScheduler;
  
    state: WonderRuntimePersistedState;
  
    loadedAt: Date;
  
    restoredFromBackup: boolean;
  }
  
  export type WonderRuntimeFactoryCapture =
    (
      context:
        WonderRuntimePersistenceCaptureContext
    ) => WonderFactorySnapshot;
  
  export type WonderRuntimeSchedulerCapture =
    (
      context:
        WonderRuntimePersistenceCaptureContext
    ) => WonderSchedulerSnapshot;
  
  export type WonderRuntimeFactoryRestore =
    (
      context:
        WonderRuntimePersistenceRestoreContext
    ) =>
      | void
      | Promise<void>;
  
  export type WonderRuntimeSchedulerRestore =
    (
      context:
        WonderRuntimePersistenceRestoreContext
    ) =>
      | void
      | Promise<void>;
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  export interface WonderRuntimePersistenceOptions {
    runtimeId: string;
  
    runtimeName?: string;
  
    metadata?: Readonly<
      Record<string, unknown>
    >;
  
    captureFactory?:
      WonderRuntimeFactoryCapture;
  
    captureScheduler?:
      WonderRuntimeSchedulerCapture;
  
    restoreFactory?:
      WonderRuntimeFactoryRestore;
  
    restoreScheduler?:
      WonderRuntimeSchedulerRestore;
  }
  
  export interface WonderRuntimePersistenceSaveOptions {
    createBackup?: boolean;
  
    overwrite?: boolean;
  
    expectedRevision?: number;
  
    expectedEtag?: string;
  
    metadata?: Readonly<
      Record<string, unknown>
    >;
  }
  
  export interface WonderRuntimePersistenceLoadOptions {
    allowBackupFallback?: boolean;
  
    validateChecksum?: boolean;
  
    revision?: number;
  }
  
  export interface WonderRuntimePersistenceRestoreOptions
    extends WonderRuntimePersistenceLoadOptions {
    restoreFactory?: boolean;
  
    restoreScheduler?: boolean;
  }
  
  // =========================================================
  // RESULTS
  // =========================================================
  
  export interface WonderRuntimePersistenceSaveResult {
    success: boolean;
  
    state:
      WonderRuntimePersistedState;
  
    storage:
      WonderStorageSaveResult;
  }
  
  export interface WonderRuntimePersistenceLoadResult {
    success: boolean;
  
    state:
      WonderRuntimePersistedState;
  
    storage:
      WonderStorageLoadResult<
        WonderRuntimePersistedState
      >;
  }
  
  export interface WonderRuntimePersistenceRestoreResult {
    success: boolean;
  
    state:
      WonderRuntimePersistedState;
  
    factoryRestored: boolean;
  
    schedulerRestored: boolean;
  
    restoredFromBackup: boolean;
  
    backupId: string | null;
  
    revision: number;
  
    etag: string | null;
  }
  
  export interface WonderRuntimePersistenceStatistics {
    runtimeId: string;
  
    runtimeName: string;
  
    saveCount: number;
  
    loadCount: number;
  
    restoreCount: number;
  
    failedSaveCount: number;
  
    failedLoadCount: number;
  
    failedRestoreCount: number;
  
    lastSavedAt: Date | null;
  
    lastLoadedAt: Date | null;
  
    lastRestoredAt: Date | null;
  
    lastRevision: number | null;
  
    lastEtag: string | null;
  }
  
  interface ResolvedWonderRuntimePersistenceOptions {
    runtimeId: string;
  
    runtimeName: string;
  
    metadata: Record<
      string,
      unknown
    >;
  
    captureFactory:
      WonderRuntimeFactoryCapture;
  
    captureScheduler:
      WonderRuntimeSchedulerCapture;
  
    restoreFactory:
      WonderRuntimeFactoryRestore | null;
  
    restoreScheduler:
      WonderRuntimeSchedulerRestore | null;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const WONDER_RUNTIME_PERSISTENCE_VERSION =
    1;
  
  const DEFAULT_RUNTIME_NAME =
    "Wonder Runtime";
  
  // =========================================================
  // PERSISTENCE COORDINATOR
  // =========================================================
  
  /**
   * Connects WonderRuntime state to any WonderStorageAdapter.
   *
   * The coordinator does not know whether storage is:
   *
   * - filesystem
   * - PostgreSQL
   * - Supabase
   * - SQLite
   * - S3 / R2
   * - in-memory
   *
   * It only depends on WonderStorageAdapter.
   */
  export class WonderRuntimePersistence {
    private readonly factory:
      WonderFactory;
  
    private readonly scheduler:
      WonderScheduler;
  
    private readonly storage:
      WonderStorageAdapter<
        WonderRuntimePersistedState
      >;
  
    private readonly options:
      ResolvedWonderRuntimePersistenceOptions;
  
    private saveInProgress =
      false;
  
    private loadInProgress =
      false;
  
    private restoreInProgress =
      false;
  
    private saveCount =
      0;
  
    private loadCount =
      0;
  
    private restoreCount =
      0;
  
    private failedSaveCount =
      0;
  
    private failedLoadCount =
      0;
  
    private failedRestoreCount =
      0;
  
    private lastSavedAt:
      Date | null = null;
  
    private lastLoadedAt:
      Date | null = null;
  
    private lastRestoredAt:
      Date | null = null;
  
    private lastRevision:
      number | null = null;
  
    private lastEtag:
      string | null = null;
  
    constructor(
      factory: WonderFactory,
      scheduler: WonderScheduler,
      storage:
        WonderStorageAdapter<
          WonderRuntimePersistedState
        >,
      options:
        WonderRuntimePersistenceOptions
    ) {
      this.factory =
        factory;
  
      this.scheduler =
        scheduler;
  
      this.storage =
        storage;
  
      this.options =
        resolvePersistenceOptions(
          options
        );
  
      if (
        this.scheduler.getFactory() !==
        this.factory
      ) {
        throw new WonderStorageError(
          "WonderRuntimePersistence: Scheduler must use the same Factory instance.",
          {
            code:
              "STORAGE_VALIDATION_FAILED",
  
            details: {
              runtimeId:
                this.options.runtimeId,
            },
          }
        );
      }
    }
  
    // =========================================================
    // ACCESSORS
    // =========================================================
  
    getFactory(): WonderFactory {
      return this.factory;
    }
  
    getScheduler(): WonderScheduler {
      return this.scheduler;
    }
  
    getStorage(): WonderStorageAdapter<
      WonderRuntimePersistedState
    > {
      return this.storage;
    }
  
    getRuntimeId(): string {
      return this.options.runtimeId;
    }
  
    getRuntimeName(): string {
      return this.options.runtimeName;
    }
  
    isSaving(): boolean {
      return this.saveInProgress;
    }
  
    isLoading(): boolean {
      return this.loadInProgress;
    }
  
    isRestoring(): boolean {
      return this.restoreInProgress;
    }
  
    // =========================================================
    // CAPTURE
    // =========================================================
  
    capture(
      metadata:
        Readonly<
          Record<string, unknown>
        > = {}
    ): WonderRuntimePersistedState {
      const savedAt =
        new Date();
  
      const context:
        WonderRuntimePersistenceCaptureContext = {
        runtimeId:
          this.options.runtimeId,
  
        runtimeName:
          this.options.runtimeName,
  
        factory:
          this.factory,
  
        scheduler:
          this.scheduler,
  
        savedAt:
          new Date(
            savedAt.getTime()
          ),
  
        metadata: {
          ...this.options.metadata,
  
          ...metadata,
        },
      };
  
      return {
        version:
          WONDER_RUNTIME_PERSISTENCE_VERSION,
  
        runtimeId:
          this.options.runtimeId,
  
        runtimeName:
          this.options.runtimeName,
  
        savedAt,
  
        factory:
          cloneFactorySnapshot(
            this.options
              .captureFactory(
                context
              )
          ),
  
        scheduler:
          cloneSchedulerSnapshot(
            this.options
              .captureScheduler(
                context
              )
          ),
  
        metadata: {
          ...this.options.metadata,
  
          ...metadata,
        },
      };
    }
  
    // =========================================================
    // SAVE
    // =========================================================
  
    async save(
      options:
        WonderRuntimePersistenceSaveOptions = {}
    ): Promise<
      WonderRuntimePersistenceSaveResult
    > {
      if (
        this.saveInProgress
      ) {
        throw new WonderStorageError(
          "WonderRuntimePersistence: save is already in progress.",
          {
            code:
              "STORAGE_CONFLICT",
  
            retryable:
              true,
  
            details: {
              runtimeId:
                this.options.runtimeId,
            },
          }
        );
      }
  
      this.saveInProgress =
        true;
  
      try {
        const state =
          this.capture(
            options.metadata
          );
  
        const storageResult =
          await this.storage.save(
            state,
            {
              createBackup:
                options.createBackup,
  
              overwrite:
                options.overwrite,
  
              expectedRevision:
                options.expectedRevision,
  
              expectedEtag:
                options.expectedEtag,
  
              metadata: {
                runtimeId:
                  state.runtimeId,
  
                runtimeName:
                  state.runtimeName,
  
                persistedStateVersion:
                  state.version,
  
                ...(
                  options.metadata ??
                  {}
                ),
              },
            }
          );
  
        this.saveCount +=
          1;
  
        this.lastSavedAt =
          new Date(
            storageResult.savedAt
              .getTime()
          );
  
        this.lastRevision =
          storageResult.metadata
            .revision;
  
        this.lastEtag =
          storageResult.metadata
            .etag ??
          null;
  
        return {
          success: true,
  
          state:
            clonePersistedState(
              state
            ),
  
          storage:
            cloneSaveResult(
              storageResult
            ),
        };
      } catch (error) {
        this.failedSaveCount +=
          1;
  
        throw toPersistenceError(
          error,
          this.options.runtimeId,
          "save"
        );
      } finally {
        this.saveInProgress =
          false;
      }
    }
  
    // =========================================================
    // LOAD
    // =========================================================
  
    async load(
      options:
        WonderRuntimePersistenceLoadOptions = {}
    ): Promise<
      WonderRuntimePersistenceLoadResult
    > {
      if (
        this.loadInProgress
      ) {
        throw new WonderStorageError(
          "WonderRuntimePersistence: load is already in progress.",
          {
            code:
              "STORAGE_CONFLICT",
  
            retryable:
              true,
  
            details: {
              runtimeId:
                this.options.runtimeId,
            },
          }
        );
      }
  
      this.loadInProgress =
        true;
  
      try {
        const storageResult =
          await this.storage.load({
            allowBackupFallback:
              options
                .allowBackupFallback,
  
            validateChecksum:
              options
                .validateChecksum,
  
            revision:
              options.revision,
          });
  
        const state =
          validatePersistedState(
            storageResult.value
          );
  
        this.loadCount +=
          1;
  
        this.lastLoadedAt =
          new Date(
            storageResult.loadedAt
              .getTime()
          );
  
        this.lastRevision =
          storageResult.metadata
            .revision;
  
        this.lastEtag =
          storageResult.metadata
            .etag ??
          null;
  
        return {
          success: true,
  
          state:
            clonePersistedState(
              state
            ),
  
          storage:
            cloneLoadResult(
              storageResult
            ),
        };
      } catch (error) {
        this.failedLoadCount +=
          1;
  
        throw toPersistenceError(
          error,
          this.options.runtimeId,
          "load"
        );
      } finally {
        this.loadInProgress =
          false;
      }
    }
  
    // =========================================================
    // RESTORE
    // =========================================================
  
    async restore(
      options:
        WonderRuntimePersistenceRestoreOptions = {}
    ): Promise<
      WonderRuntimePersistenceRestoreResult
    > {
      if (
        this.restoreInProgress
      ) {
        throw new WonderStorageError(
          "WonderRuntimePersistence: restore is already in progress.",
          {
            code:
              "STORAGE_CONFLICT",
  
            retryable:
              true,
  
            details: {
              runtimeId:
                this.options.runtimeId,
            },
          }
        );
      }
  
      this.restoreInProgress =
        true;
  
      try {
        const loaded =
          await this.load({
            allowBackupFallback:
              options
                .allowBackupFallback,
  
            validateChecksum:
              options
                .validateChecksum,
  
            revision:
              options.revision,
          });
  
        const context:
          WonderRuntimePersistenceRestoreContext = {
          runtimeId:
            this.options.runtimeId,
  
          runtimeName:
            this.options.runtimeName,
  
          factory:
            this.factory,
  
          scheduler:
            this.scheduler,
  
          state:
            clonePersistedState(
              loaded.state
            ),
  
          loadedAt:
            new Date(
              loaded.storage
                .loadedAt
                .getTime()
            ),
  
          restoredFromBackup:
            loaded.storage
              .restoredFromBackup,
        };
  
        let factoryRestored =
          false;
  
        let schedulerRestored =
          false;
  
        if (
          options.restoreFactory !==
            false
        ) {
          if (
            !this.options
              .restoreFactory
          ) {
            throw new WonderStorageError(
              "WonderRuntimePersistence: no Factory restore handler is configured.",
              {
                code:
                  "STORAGE_VALIDATION_FAILED",
  
                details: {
                  runtimeId:
                    this.options
                      .runtimeId,
                },
              }
            );
          }
  
          await this.options
            .restoreFactory(
              context
            );
  
          factoryRestored =
            true;
        }
  
        if (
          options.restoreScheduler !==
            false
        ) {
          if (
            !this.options
              .restoreScheduler
          ) {
            throw new WonderStorageError(
              "WonderRuntimePersistence: no Scheduler restore handler is configured.",
              {
                code:
                  "STORAGE_VALIDATION_FAILED",
  
                details: {
                  runtimeId:
                    this.options
                      .runtimeId,
                },
              }
            );
          }
  
          await this.options
            .restoreScheduler(
              context
            );
  
          schedulerRestored =
            true;
        }
  
        this.restoreCount +=
          1;
  
        this.lastRestoredAt =
          new Date();
  
        return {
          success: true,
  
          state:
            clonePersistedState(
              loaded.state
            ),
  
          factoryRestored,
  
          schedulerRestored,
  
          restoredFromBackup:
            loaded.storage
              .restoredFromBackup,
  
          backupId:
            loaded.storage
              .backupId,
  
          revision:
            loaded.storage
              .metadata.revision,
  
          etag:
            loaded.storage
              .metadata.etag ??
            null,
        };
      } catch (error) {
        this.failedRestoreCount +=
          1;
  
        throw toPersistenceError(
          error,
          this.options.runtimeId,
          "restore"
        );
      } finally {
        this.restoreInProgress =
          false;
      }
    }
  
    // =========================================================
    // STORAGE OPERATIONS
    // =========================================================
  
    async exists(): Promise<boolean> {
      return this.storage.exists();
    }
  
    async delete(
      createBackup =
        true
    ) {
      return this.storage.delete({
        createBackup,
      });
    }
  
    async health() {
      return this.storage.health();
    }
  
    async getStorageStatistics() {
      return this.storage
        .getStatistics();
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    getStatistics():
      WonderRuntimePersistenceStatistics {
      return {
        runtimeId:
          this.options.runtimeId,
  
        runtimeName:
          this.options.runtimeName,
  
        saveCount:
          this.saveCount,
  
        loadCount:
          this.loadCount,
  
        restoreCount:
          this.restoreCount,
  
        failedSaveCount:
          this.failedSaveCount,
  
        failedLoadCount:
          this.failedLoadCount,
  
        failedRestoreCount:
          this.failedRestoreCount,
  
        lastSavedAt:
          cloneNullableDate(
            this.lastSavedAt
          ),
  
        lastLoadedAt:
          cloneNullableDate(
            this.lastLoadedAt
          ),
  
        lastRestoredAt:
          cloneNullableDate(
            this.lastRestoredAt
          ),
  
        lastRevision:
          this.lastRevision,
  
        lastEtag:
          this.lastEtag,
      };
    }
  }
  
  // =========================================================
  // DEFAULT CAPTURE FUNCTIONS
  // =========================================================
  
  export function captureWonderFactorySnapshot(
    context:
      WonderRuntimePersistenceCaptureContext
  ): WonderFactorySnapshot {
    return context.factory
      .getSnapshot();
  }
  
  export function captureWonderSchedulerSnapshot(
    context:
      WonderRuntimePersistenceCaptureContext
  ): WonderSchedulerSnapshot {
    return context.scheduler
      .createSnapshot();
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolvePersistenceOptions(
    options:
      WonderRuntimePersistenceOptions
  ): ResolvedWonderRuntimePersistenceOptions {
    return {
      runtimeId:
        normaliseRequiredText(
          options.runtimeId,
          "runtimeId"
        ),
  
      runtimeName:
        normaliseOptionalText(
          options.runtimeName
        ) ??
        DEFAULT_RUNTIME_NAME,
  
      metadata: {
        ...(options.metadata ??
          {}),
      },
  
      captureFactory:
        options.captureFactory ??
        captureWonderFactorySnapshot,
  
      captureScheduler:
        options.captureScheduler ??
        captureWonderSchedulerSnapshot,
  
      restoreFactory:
        options.restoreFactory ??
        null,
  
      restoreScheduler:
        options.restoreScheduler ??
        null,
    };
  }
  
  // =========================================================
  // VALIDATION
  // =========================================================
  
  export function validatePersistedState(
    value: unknown
  ): WonderRuntimePersistedState {
    if (
      !isRecord(value) ||
      value.version !==
        WONDER_RUNTIME_PERSISTENCE_VERSION ||
      typeof value.runtimeId !==
        "string" ||
      typeof value.runtimeName !==
        "string" ||
      !isValidDate(
        value.savedAt
      ) ||
      !isRecord(
        value.factory
      ) ||
      !isRecord(
        value.scheduler
      ) ||
      !isRecord(
        value.metadata
      )
    ) {
      throw new WonderStorageError(
        "WonderRuntimePersistence: persisted Runtime state is invalid.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    return clonePersistedState(
      value as unknown as
        WonderRuntimePersistedState
    );
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  export function clonePersistedState(
    state:
      WonderRuntimePersistedState
  ): WonderRuntimePersistedState {
    return {
      version:
        state.version,
  
      runtimeId:
        state.runtimeId,
  
      runtimeName:
        state.runtimeName,
  
      savedAt:
        new Date(
          state.savedAt.getTime()
        ),
  
      factory:
        cloneFactorySnapshot(
          state.factory
        ),
  
      scheduler:
        cloneSchedulerSnapshot(
          state.scheduler
        ),
  
      metadata:
        cloneUnknownRecord(
          state.metadata
        ),
    };
  }
  
  function cloneFactorySnapshot(
    snapshot:
      WonderFactorySnapshot
  ): WonderFactorySnapshot {
    return cloneUnknownValue(
      snapshot
    ) as WonderFactorySnapshot;
  }
  
  function cloneSchedulerSnapshot(
    snapshot:
      WonderSchedulerSnapshot
  ): WonderSchedulerSnapshot {
    return cloneUnknownValue(
      snapshot
    ) as WonderSchedulerSnapshot;
  }
  
  function cloneSaveResult(
    result:
      WonderStorageSaveResult
  ): WonderStorageSaveResult {
    return cloneUnknownValue(
      result
    ) as WonderStorageSaveResult;
  }
  
  function cloneLoadResult(
    result:
      WonderStorageLoadResult<
        WonderRuntimePersistedState
      >
  ): WonderStorageLoadResult<
    WonderRuntimePersistedState
  > {
    return {
      ...cloneUnknownValue(
        result
      ) as
        WonderStorageLoadResult<
          WonderRuntimePersistedState
        >,
  
      value:
        clonePersistedState(
          result.value
        ),
    };
  }
  
  function cloneUnknownRecord(
    value:
      Readonly<
        Record<string, unknown>
      >
  ): Record<string, unknown> {
    return cloneUnknownValue(
      value
    ) as Record<
      string,
      unknown
    >;
  }
  
  function cloneUnknownValue(
    value: unknown
  ): unknown {
    if (
      value === null ||
      value === undefined ||
      typeof value ===
        "string" ||
      typeof value ===
        "number" ||
      typeof value ===
        "boolean" ||
      typeof value ===
        "bigint"
    ) {
      return value;
    }
  
    if (
      value instanceof Date
    ) {
      return new Date(
        value.getTime()
      );
    }
  
    if (
      value instanceof RegExp
    ) {
      return new RegExp(
        value.source,
        value.flags
      );
    }
  
    if (
      value instanceof
      Uint8Array
    ) {
      return new Uint8Array(
        value
      );
    }
  
    if (
      Array.isArray(value)
    ) {
      return value.map(
        cloneUnknownValue
      );
    }
  
    if (
      value instanceof Map
    ) {
      const cloned =
        new Map<
          unknown,
          unknown
        >();
  
      for (
        const [
          key,
          item,
        ] of value
      ) {
        cloned.set(
          cloneUnknownValue(
            key
          ),
  
          cloneUnknownValue(
            item
          )
        );
      }
  
      return cloned;
    }
  
    if (
      value instanceof Set
    ) {
      const cloned =
        new Set<unknown>();
  
      for (
        const item of
          value
      ) {
        cloned.add(
          cloneUnknownValue(
            item
          )
        );
      }
  
      return cloned;
    }
  
    if (
      isRecord(value)
    ) {
      const cloned:
        Record<string, unknown> = {};
  
      for (
        const [
          key,
          item,
        ] of Object.entries(
          value
        )
      ) {
        cloned[key] =
          cloneUnknownValue(
            item
          );
      }
  
      return cloned;
    }
  
    return value;
  }
  
  // =========================================================
  // HELPERS
  // =========================================================
  
  function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    if (
      typeof value !==
      "string"
    ) {
      throw new WonderStorageError(
        `WonderRuntimePersistence: "${fieldName}" must be a string.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new WonderStorageError(
        `WonderRuntimePersistence: "${fieldName}" is required.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
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
  
  function isRecord(
    value: unknown
  ): value is Record<
    string,
    unknown
  > {
    return (
      typeof value ===
        "object" &&
      value !== null &&
      !Array.isArray(value)
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
  
  function toPersistenceError(
    error: unknown,
    runtimeId: string,
    operation:
      | "save"
      | "load"
      | "restore"
  ): WonderStorageError {
    if (
      error instanceof
      WonderStorageError
    ) {
      return error;
    }
  
    return new WonderStorageError(
      `WonderRuntimePersistence: Runtime "${runtimeId}" failed during ${operation}.`,
      {
        code:
          "STORAGE_UNKNOWN_ERROR",
  
        retryable:
          operation !==
          "restore",
  
        cause:
          error,
  
        details: {
          runtimeId,
  
          operation,
  
          cause:
            error instanceof Error
              ? error.message
              : String(error),
        },
      }
    );
  }
  
  export default WonderRuntimePersistence;