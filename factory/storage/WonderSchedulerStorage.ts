import {
    access,
    copyFile,
    mkdir,
    readFile,
    readdir,
    rename,
    rm,
    stat,
    writeFile,
  } from "node:fs/promises";
  
  import {
    basename,
    dirname,
    extname,
    join,
    resolve,
  } from "node:path";
  
  import type {
    WonderSchedule,
    WonderScheduleConfiguration,
    WonderScheduleError,
    WonderScheduleStatus,
    WonderScheduleType,
    WonderScheduledJobTemplate,
    WonderScheduler,
    WonderSchedulerSnapshot,
  } from "../scheduler/WonderScheduler";
  
  // =========================================================
  // STORAGE TYPES
  // =========================================================
  
  export type WonderSchedulerStorageWriteMode =
    | "replace"
    | "error-if-exists";
  
  export interface WonderSchedulerStorageOptions {
    /**
     * Scheduler state file path.
     */
    filePath?: string;
  
    /**
     * Base directory used for relative paths.
     */
    workingDirectory?: string;
  
    /**
     * Format persisted JSON using indentation.
     */
    prettyPrint?: boolean;
  
    /**
     * Create parent directories automatically.
     */
    createDirectories?: boolean;
  
    /**
     * Write through a temporary file before replacing state.
     */
    atomicWrite?: boolean;
  
    /**
     * Create a backup before replacing existing state.
     */
    createBackupBeforeWrite?: boolean;
  
    /**
     * Maximum automatic backups retained.
     */
    maximumBackups?: number;
  
    /**
     * Behaviour when the destination already exists.
     */
    writeMode?: WonderSchedulerStorageWriteMode;
  }
  
  export interface WonderSchedulerStorageSaveOptions {
    createBackup?: boolean;
  
    prettyPrint?: boolean;
  
    writeMode?: WonderSchedulerStorageWriteMode;
  }
  
  export interface WonderSchedulerStorageLoadOptions {
    fallbackToLatestBackup?: boolean;
  }
  
  export interface WonderSchedulerStorageRestoreOptions {
    replaceExisting?: boolean;
  
    /**
     * Recalculate overdue active schedules after restart.
     *
     * When false, the original nextRunAt value is retained.
     */
    recoverOverdueSchedules?: boolean;
  
    /**
     * Date used for overdue recovery.
     */
    recoveryDate?: Date;
  }
  
  export interface WonderSchedulerStoredState {
    version: number;
  
    savedAt: Date;
  
    schedulerId: string;
  
    schedulerName: string;
  
    snapshot: WonderSchedulerSnapshot;
  }
  
  export interface WonderSchedulerStorageSaveResult {
    success: boolean;
  
    path: string;
  
    backupPath: string | null;
  
    bytesWritten: number;
  
    scheduleCount: number;
  
    savedAt: Date;
  }
  
  export interface WonderSchedulerStorageLoadResult {
    success: boolean;
  
    path: string;
  
    usedBackup: boolean;
  
    state: WonderSchedulerStoredState;
  }
  
  export interface WonderSchedulerStorageRestoreResult {
    success: boolean;
  
    sourcePath: string;
  
    usedBackup: boolean;
  
    importedSchedules: number;
  
    skippedSchedules: number;
  
    recoveredSchedules: number;
  
    replacedExisting: boolean;
  }
  
  export interface WonderSchedulerStorageBackup {
    path: string;
  
    filename: string;
  
    createdAt: Date;
  
    sizeBytes: number;
  }
  
  export interface WonderSchedulerStorageStatistics {
    exists: boolean;
  
    path: string;
  
    sizeBytes: number;
  
    modifiedAt: Date | null;
  
    backupCount: number;
  
    backupSizeBytes: number;
  
    autoSaveRunning: boolean;
  }
  
  export interface WonderSchedulerAutoSaveOptions {
    intervalMilliseconds?: number;
  
    saveImmediately?: boolean;
  
    onSaved?: (
      result: WonderSchedulerStorageSaveResult
    ) => void | Promise<void>;
  
    onError?: (
      error: Error
    ) => void | Promise<void>;
  }
  
  export interface WonderSchedulerAutoSaveHandle {
    stop(): void;
  
    isRunning(): boolean;
  }
  
  // =========================================================
  // ENCODED DOCUMENT TYPES
  // =========================================================
  
  interface WonderDateEnvelope {
    __wonderType: "Date";
  
    value: string;
  }
  
  interface WonderUndefinedEnvelope {
    __wonderType: "Undefined";
  }
  
  type WonderEncodedValue =
    | null
    | boolean
    | number
    | string
    | WonderDateEnvelope
    | WonderUndefinedEnvelope
    | WonderEncodedValue[]
    | {
        [key: string]: WonderEncodedValue;
      };
  
  interface WonderSchedulerStorageDocument {
    format: "wonder-scheduler-state";
  
    version: number;
  
    encodedState: WonderEncodedValue;
  }
  
  interface ResolvedWonderSchedulerStorageOptions {
    filePath: string;
  
    workingDirectory: string;
  
    prettyPrint: boolean;
  
    createDirectories: boolean;
  
    atomicWrite: boolean;
  
    createBackupBeforeWrite: boolean;
  
    maximumBackups: number;
  
    writeMode: WonderSchedulerStorageWriteMode;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const WONDER_SCHEDULER_STORAGE_VERSION =
    1;
  
  const WONDER_SCHEDULER_DOCUMENT_FORMAT =
    "wonder-scheduler-state" as const;
  
  const DEFAULT_STORAGE_DIRECTORY =
    "wonder-scheduler";
  
  const DEFAULT_STORAGE_FILENAME =
    "scheduler-state.json";
  
  const DEFAULT_MAXIMUM_BACKUPS =
    10;
  
  const MAXIMUM_BACKUPS =
    1_000;
  
  const DEFAULT_AUTO_SAVE_INTERVAL_MILLISECONDS =
    30_000;
  
  const MINIMUM_AUTO_SAVE_INTERVAL_MILLISECONDS =
    1_000;
  
  // =========================================================
  // STORAGE
  // =========================================================
  
  /**
   * Persistent local storage for WonderScheduler.
   *
   * Responsibilities:
   *
   * - save Scheduler snapshots
   * - preserve Dates in payloads and metadata
   * - restore schedules after restart
   * - recover overdue active schedules
   * - atomic file writes
   * - backups and backup fallback
   * - automatic periodic persistence
   */
  export class WonderSchedulerStorage {
    private readonly options:
      ResolvedWonderSchedulerStorageOptions;
  
    private autoSaveTimer:
      ReturnType<
        typeof setTimeout
      > | null = null;
  
    private autoSaveInProgress =
      false;
  
    constructor(
      options:
        WonderSchedulerStorageOptions = {}
    ) {
      const workingDirectory =
        resolve(
          options.workingDirectory ??
            process.cwd()
        );
  
      const configuredPath =
        options.filePath ??
        join(
          DEFAULT_STORAGE_DIRECTORY,
          DEFAULT_STORAGE_FILENAME
        );
  
      this.options = {
        filePath:
          resolve(
            workingDirectory,
            configuredPath
          ),
  
        workingDirectory,
  
        prettyPrint:
          options.prettyPrint ??
          true,
  
        createDirectories:
          options.createDirectories ??
          true,
  
        atomicWrite:
          options.atomicWrite ??
          true,
  
        createBackupBeforeWrite:
          options.createBackupBeforeWrite ??
          true,
  
        maximumBackups:
          clampInteger(
            options.maximumBackups ??
              DEFAULT_MAXIMUM_BACKUPS,
            0,
            MAXIMUM_BACKUPS
          ),
  
        writeMode:
          options.writeMode ??
          "replace",
      };
    }
  
    // =========================================================
    // ACCESS
    // =========================================================
  
    getPath(): string {
      return this.options.filePath;
    }
  
    getBackupDirectory(): string {
      return join(
        dirname(
          this.options.filePath
        ),
        "backups"
      );
    }
  
    // =========================================================
    // SAVE
    // =========================================================
  
    async save(
      scheduler: WonderScheduler,
      options:
        WonderSchedulerStorageSaveOptions = {}
    ): Promise<WonderSchedulerStorageSaveResult> {
      const writeMode =
        options.writeMode ??
        this.options.writeMode;
  
      const prettyPrint =
        options.prettyPrint ??
        this.options.prettyPrint;
  
      const shouldCreateBackup =
        options.createBackup ??
        this.options
          .createBackupBeforeWrite;
  
      if (
        writeMode ===
          "error-if-exists" &&
        await this.exists()
      ) {
        throw new Error(
          `WonderSchedulerStorage: state file already exists at "${this.options.filePath}".`
        );
      }
  
      await this.ensureParentDirectory();
  
      let backupPath:
        string | null = null;
  
      if (
        shouldCreateBackup &&
        await this.exists()
      ) {
        backupPath =
          await this.createBackup();
      }
  
      const state =
        createStoredState(
          scheduler
        );
  
      const document:
        WonderSchedulerStorageDocument = {
        format:
          WONDER_SCHEDULER_DOCUMENT_FORMAT,
  
        version:
          WONDER_SCHEDULER_STORAGE_VERSION,
  
        encodedState:
          encodeValue(
            state
          ),
      };
  
      const content =
        `${JSON.stringify(
          document,
          null,
          prettyPrint
            ? 2
            : undefined
        )}\n`;
  
      await this.writeContent(
        content
      );
  
      await this.pruneBackups();
  
      return {
        success: true,
  
        path:
          this.options.filePath,
  
        backupPath,
  
        bytesWritten:
          Buffer.byteLength(
            content,
            "utf8"
          ),
  
        scheduleCount:
          state.snapshot
            .schedules.length,
  
        savedAt:
          new Date(
            state.savedAt.getTime()
          ),
      };
    }
  
    // =========================================================
    // LOAD
    // =========================================================
  
    async load(
      options:
        WonderSchedulerStorageLoadOptions = {}
    ): Promise<WonderSchedulerStorageLoadResult> {
      try {
        const state =
          await this.readStateFile(
            this.options.filePath
          );
  
        return {
          success: true,
  
          path:
            this.options.filePath,
  
          usedBackup: false,
  
          state,
        };
      } catch (error) {
        if (
          options.fallbackToLatestBackup !==
          true
        ) {
          throw error;
        }
  
        const backups =
          await this.listBackups();
  
        const latestBackup =
          backups[0];
  
        if (!latestBackup) {
          throw new Error(
            [
              "WonderSchedulerStorage: primary state could not be loaded and no backup is available.",
              getErrorMessage(error),
            ].join(" ")
          );
        }
  
        const state =
          await this.readStateFile(
            latestBackup.path
          );
  
        return {
          success: true,
  
          path:
            latestBackup.path,
  
          usedBackup: true,
  
          state,
        };
      }
    }
  
    // =========================================================
    // RESTORE
    // =========================================================
  
    async restore(
      scheduler: WonderScheduler,
      options:
        WonderSchedulerStorageRestoreOptions = {}
    ): Promise<WonderSchedulerStorageRestoreResult> {
      const loaded =
        await this.load({
          fallbackToLatestBackup:
            true,
        });
  
      const replaceExisting =
        options.replaceExisting ??
        true;
  
      const recoverOverdueSchedules =
        options.recoverOverdueSchedules ??
        true;
  
      const recoveryDate =
        options.recoveryDate
          ? cloneValidDateOrThrow(
              options.recoveryDate,
              "recoveryDate"
            )
          : new Date();
  
      let recoveredSchedules =
        0;
  
      const schedules =
        loaded.state.snapshot
          .schedules.map(
            (schedule) => {
              if (
                !recoverOverdueSchedules
              ) {
                return cloneStoredSchedule(
                  schedule
                );
              }
  
              const recovery =
                recoverScheduleAfterRestart(
                  schedule,
                  recoveryDate
                );
  
              if (recovery.recovered) {
                recoveredSchedules +=
                  1;
              }
  
              return recovery.schedule;
            }
          );
  
      const restoredSnapshot:
        WonderSchedulerSnapshot = {
        version:
          loaded.state.snapshot
            .version,
  
        schedulerId:
          loaded.state.snapshot
            .schedulerId,
  
        schedulerName:
          loaded.state.snapshot
            .schedulerName,
  
        createdAt:
          new Date(
            loaded.state.snapshot
              .createdAt
              .getTime()
          ),
  
        schedules,
      };
  
      const importResult =
        scheduler.importSnapshot(
          restoredSnapshot,
          replaceExisting
        );
  
      return {
        success: true,
  
        sourcePath:
          loaded.path,
  
        usedBackup:
          loaded.usedBackup,
  
        importedSchedules:
          importResult
            .importedSchedules,
  
        skippedSchedules:
          importResult
            .skippedSchedules,
  
        recoveredSchedules,
  
        replacedExisting:
          importResult
            .replacedExisting,
      };
    }
  
    // =========================================================
    // BACKUPS
    // =========================================================
  
    async createBackup(): Promise<string> {
      if (
        !await this.exists()
      ) {
        throw new Error(
          "WonderSchedulerStorage: cannot back up a state file that does not exist."
        );
      }
  
      const backupDirectory =
        this.getBackupDirectory();
  
      await mkdir(
        backupDirectory,
        {
          recursive: true,
        }
      );
  
      const extension =
        extname(
          this.options.filePath
        ) || ".json";
  
      const nameWithoutExtension =
        basename(
          this.options.filePath,
          extension
        );
  
      const timestamp =
        createFileTimestamp(
          new Date()
        );
  
      let backupPath =
        join(
          backupDirectory,
          `${nameWithoutExtension}-${timestamp}${extension}`
        );
  
      let collisionIndex =
        1;
  
      while (
        await pathExists(
          backupPath
        )
      ) {
        backupPath =
          join(
            backupDirectory,
            `${nameWithoutExtension}-${timestamp}-${collisionIndex}${extension}`
          );
  
        collisionIndex +=
          1;
      }
  
      await copyFile(
        this.options.filePath,
        backupPath
      );
  
      return backupPath;
    }
  
    async listBackups(): Promise<
      WonderSchedulerStorageBackup[]
    > {
      const backupDirectory =
        this.getBackupDirectory();
  
      if (
        !await pathExists(
          backupDirectory
        )
      ) {
        return [];
      }
  
      const entries =
        await readdir(
          backupDirectory,
          {
            withFileTypes: true,
          }
        );
  
      const backups:
        WonderSchedulerStorageBackup[] =
        [];
  
      for (
        const entry of entries
      ) {
        if (
          !entry.isFile() ||
          extname(
            entry.name
          ).toLowerCase() !==
            ".json"
        ) {
          continue;
        }
  
        const path =
          join(
            backupDirectory,
            entry.name
          );
  
        const information =
          await stat(path);
  
        backups.push({
          path,
  
          filename:
            entry.name,
  
          createdAt:
            new Date(
              information.mtimeMs
            ),
  
          sizeBytes:
            information.size,
        });
      }
  
      return backups.sort(
        (
          first,
          second
        ) =>
          second.createdAt.getTime() -
          first.createdAt.getTime()
      );
    }
  
    async pruneBackups(): Promise<number> {
      const backups =
        await this.listBackups();
  
      if (
        backups.length <=
        this.options.maximumBackups
      ) {
        return 0;
      }
  
      const backupsToDelete =
        backups.slice(
          this.options.maximumBackups
        );
  
      for (
        const backup of
          backupsToDelete
      ) {
        await rm(
          backup.path,
          {
            force: true,
          }
        );
      }
  
      return backupsToDelete.length;
    }
  
    // =========================================================
    // STATUS
    // =========================================================
  
    async exists(): Promise<boolean> {
      return pathExists(
        this.options.filePath
      );
    }
  
    async getStatistics(): Promise<WonderSchedulerStorageStatistics> {
      const exists =
        await this.exists();
  
      let sizeBytes =
        0;
  
      let modifiedAt:
        Date | null = null;
  
      if (exists) {
        const information =
          await stat(
            this.options.filePath
          );
  
        sizeBytes =
          information.size;
  
        modifiedAt =
          new Date(
            information.mtimeMs
          );
      }
  
      const backups =
        await this.listBackups();
  
      return {
        exists,
  
        path:
          this.options.filePath,
  
        sizeBytes,
  
        modifiedAt,
  
        backupCount:
          backups.length,
  
        backupSizeBytes:
          backups.reduce(
            (
              total,
              backup
            ) =>
              total +
              backup.sizeBytes,
            0
          ),
  
        autoSaveRunning:
          this.isAutoSaveRunning(),
      };
    }
  
    // =========================================================
    // DELETE
    // =========================================================
  
    async delete(
      includeBackups =
        false
    ): Promise<void> {
      await rm(
        this.options.filePath,
        {
          force: true,
        }
      );
  
      if (includeBackups) {
        await rm(
          this.getBackupDirectory(),
          {
            recursive: true,
  
            force: true,
          }
        );
      }
    }
  
    // =========================================================
    // AUTO SAVE
    // =========================================================
  
    startAutoSave(
      scheduler: WonderScheduler,
      options:
        WonderSchedulerAutoSaveOptions = {}
    ): WonderSchedulerAutoSaveHandle {
      if (
        this.isAutoSaveRunning()
      ) {
        throw new Error(
          "WonderSchedulerStorage: automatic saving is already running."
        );
      }
  
      const intervalMilliseconds =
        Math.max(
          MINIMUM_AUTO_SAVE_INTERVAL_MILLISECONDS,
          Math.floor(
            options.intervalMilliseconds ??
              DEFAULT_AUTO_SAVE_INTERVAL_MILLISECONDS
          )
        );
  
      let running =
        true;
  
      const runSave =
        async (): Promise<void> => {
          if (
            !running ||
            this.autoSaveInProgress
          ) {
            return;
          }
  
          this.autoSaveInProgress =
            true;
  
          try {
            const result =
              await this.save(
                scheduler
              );
  
            await options.onSaved?.(
              result
            );
          } catch (error) {
            await options.onError?.(
              toError(error)
            );
          } finally {
            this.autoSaveInProgress =
              false;
          }
        };
  
      const scheduleNext =
        (): void => {
          if (!running) {
            return;
          }
  
          this.autoSaveTimer =
            setTimeout(
              () => {
                this.autoSaveTimer =
                  null;
  
                void runSave()
                  .finally(
                    scheduleNext
                  );
              },
              intervalMilliseconds
            );
        };
  
      if (
        options.saveImmediately
      ) {
        void runSave()
          .finally(
            scheduleNext
          );
      } else {
        scheduleNext();
      }
  
      return {
        stop: () => {
          running =
            false;
  
          this.stopAutoSave();
        },
  
        isRunning: () =>
          running &&
          this.isAutoSaveRunning(),
      };
    }
  
    stopAutoSave(): void {
      if (
        this.autoSaveTimer ===
        null
      ) {
        return;
      }
  
      clearTimeout(
        this.autoSaveTimer
      );
  
      this.autoSaveTimer =
        null;
    }
  
    isAutoSaveRunning(): boolean {
      return (
        this.autoSaveTimer !==
        null
      );
    }
  
    // =========================================================
    // FILE OPERATIONS
    // =========================================================
  
    private async readStateFile(
      path: string
    ): Promise<WonderSchedulerStoredState> {
      let content: string;
  
      try {
        content =
          await readFile(
            path,
            {
              encoding: "utf8",
            }
          );
      } catch (error) {
        throw new Error(
          [
            `WonderSchedulerStorage: could not read "${path}".`,
            getErrorMessage(error),
          ].join(" ")
        );
      }
  
      let document: unknown;
  
      try {
        document =
          JSON.parse(
            removeByteOrderMark(
              content
            )
          );
      } catch (error) {
        throw new Error(
          [
            `WonderSchedulerStorage: state file "${path}" contains invalid JSON.`,
            getErrorMessage(error),
          ].join(" ")
        );
      }
  
      return parseStorageDocument(
        document
      );
    }
  
    private async writeContent(
      content: string
    ): Promise<void> {
      if (
        !this.options.atomicWrite
      ) {
        await writeFile(
          this.options.filePath,
          content,
          {
            encoding: "utf8",
          }
        );
  
        return;
      }
  
      const temporaryPath =
        `${this.options.filePath}.${process.pid}.${Date.now()}.tmp`;
  
      try {
        await writeFile(
          temporaryPath,
          content,
          {
            encoding: "utf8",
          }
        );
  
        if (
          await this.exists()
        ) {
          await rm(
            this.options.filePath,
            {
              force: true,
            }
          );
        }
  
        await rename(
          temporaryPath,
          this.options.filePath
        );
      } catch (error) {
        await rm(
          temporaryPath,
          {
            force: true,
          }
        );
  
        throw new Error(
          [
            `WonderSchedulerStorage: failed to write "${this.options.filePath}".`,
            getErrorMessage(error),
          ].join(" ")
        );
      }
    }
  
    private async ensureParentDirectory(): Promise<void> {
      const parentDirectory =
        dirname(
          this.options.filePath
        );
  
      if (
        this.options
          .createDirectories
      ) {
        await mkdir(
          parentDirectory,
          {
            recursive: true,
          }
        );
  
        return;
      }
  
      if (
        !await pathExists(
          parentDirectory
        )
      ) {
        throw new Error(
          `WonderSchedulerStorage: directory "${parentDirectory}" does not exist.`
        );
      }
    }
  }
  
  // =========================================================
  // STATE CREATION
  // =========================================================
  
  function createStoredState(
    scheduler: WonderScheduler
  ): WonderSchedulerStoredState {
    const snapshot =
      scheduler.createSnapshot();
  
    return {
      version:
        WONDER_SCHEDULER_STORAGE_VERSION,
  
      savedAt:
        new Date(),
  
      schedulerId:
        snapshot.schedulerId,
  
      schedulerName:
        snapshot.schedulerName,
  
      snapshot,
    };
  }
  
  // =========================================================
  // DOCUMENT PARSING
  // =========================================================
  
  function parseStorageDocument(
    value: unknown
  ): WonderSchedulerStoredState {
    if (!isRecord(value)) {
      throw new Error(
        "WonderSchedulerStorage: storage document must be an object."
      );
    }
  
    if (
      value.format !==
      WONDER_SCHEDULER_DOCUMENT_FORMAT
    ) {
      throw new Error(
        "WonderSchedulerStorage: unsupported document format."
      );
    }
  
    if (
      value.version !==
      WONDER_SCHEDULER_STORAGE_VERSION
    ) {
      throw new Error(
        `WonderSchedulerStorage: unsupported document version "${String(
          value.version
        )}".`
      );
    }
  
    const decoded =
      decodeValue(
        value.encodedState
      );
  
    return validateStoredState(
      decoded
    );
  }
  
  function validateStoredState(
    value: unknown
  ): WonderSchedulerStoredState {
    if (!isRecord(value)) {
      throw new Error(
        "WonderSchedulerStorage: decoded state must be an object."
      );
    }
  
    if (
      value.version !==
      WONDER_SCHEDULER_STORAGE_VERSION ||
      typeof value.schedulerId !==
        "string" ||
      typeof value.schedulerName !==
        "string" ||
      !isValidDate(
        value.savedAt
      )
    ) {
      throw new Error(
        "WonderSchedulerStorage: stored state contains invalid metadata."
      );
    }
  
    const snapshot =
      validateSchedulerSnapshot(
        value.snapshot
      );
  
    return {
      version:
        WONDER_SCHEDULER_STORAGE_VERSION,
  
      savedAt:
        new Date(
          value.savedAt.getTime()
        ),
  
      schedulerId:
        value.schedulerId,
  
      schedulerName:
        value.schedulerName,
  
      snapshot,
    };
  }
  
  function validateSchedulerSnapshot(
    value: unknown
  ): WonderSchedulerSnapshot {
    if (
      !isRecord(value) ||
      typeof value.version !==
        "number" ||
      typeof value.schedulerId !==
        "string" ||
      typeof value.schedulerName !==
        "string" ||
      !isValidDate(
        value.createdAt
      ) ||
      !Array.isArray(
        value.schedules
      )
    ) {
      throw new Error(
        "WonderSchedulerStorage: Scheduler snapshot is invalid."
      );
    }
  
    return {
      version:
        Math.floor(
          value.version
        ),
  
      schedulerId:
        value.schedulerId,
  
      schedulerName:
        value.schedulerName,
  
      createdAt:
        new Date(
          value.createdAt.getTime()
        ),
  
      schedules:
        value.schedules.map(
          validateStoredSchedule
        ),
    };
  }
  
  function validateStoredSchedule(
    value: unknown
  ): WonderSchedule<unknown> {
    if (
      !isRecord(value) ||
      typeof value.id !==
        "string" ||
      typeof value.name !==
        "string" ||
      !isWonderScheduleType(
        value.type
      ) ||
      !isWonderScheduleStatus(
        value.status
      ) ||
      !isRecord(
        value.job
      ) ||
      !isRecord(
        value.configuration
      ) ||
      !Array.isArray(
        value.tags
      ) ||
      !isRecord(
        value.metadata
      ) ||
      typeof value.runCount !==
        "number" ||
      typeof value.successfulRunCount !==
        "number" ||
      typeof value.failedRunCount !==
        "number" ||
      !isValidDate(
        value.createdAt
      ) ||
      !isValidDate(
        value.updatedAt
      )
    ) {
      throw new Error(
        "WonderSchedulerStorage: stored schedule is invalid."
      );
    }
  
    return cloneStoredSchedule(
      value as unknown as
        WonderSchedule<unknown>
    );
  }
  
  // =========================================================
  // RESTART RECOVERY
  // =========================================================
  
  function recoverScheduleAfterRestart(
    schedule:
      WonderSchedule<unknown>,
    recoveryDate: Date
  ): {
    schedule:
      WonderSchedule<unknown>;
  
    recovered: boolean;
  } {
    const cloned =
      cloneStoredSchedule(
        schedule
      );
  
    if (
      cloned.status !==
        "active" ||
      cloned.nextRunAt ===
        null ||
      cloned.nextRunAt.getTime() >
        recoveryDate.getTime()
    ) {
      return {
        schedule:
          cloned,
  
        recovered: false,
      };
    }
  
    /*
     * We deliberately preserve overdue nextRunAt.
     *
     * This allows WonderScheduler's own misfire policy to decide:
     *
     * - catch-up: submit every missed occurrence
     * - run-once: submit one occurrence and advance
     * - once: submit the missed one-time occurrence
     */
    return {
      schedule: {
        ...cloned,
  
        metadata: {
          ...cloned.metadata,
  
          restartRecovery: {
            recoveredAt:
              recoveryDate
                .toISOString(),
  
            previousNextRunAt:
              cloned.nextRunAt
                .toISOString(),
          },
        },
  
        updatedAt:
          new Date(
            recoveryDate.getTime()
          ),
      },
  
      recovered: true,
    };
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneStoredSchedule(
    schedule:
      WonderSchedule<unknown>
  ): WonderSchedule<unknown> {
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
  
      metadata:
        cloneRecord(
          schedule.metadata
        ),
  
      lastRunAt:
        cloneNullableDate(
          schedule.lastRunAt
        ),
  
      lastScheduledFor:
        cloneNullableDate(
          schedule.lastScheduledFor
        ),
  
      nextRunAt:
        cloneNullableDate(
          schedule.nextRunAt
        ),
  
      lastError:
        schedule.lastError
          ? cloneScheduleError(
              schedule.lastError
            )
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
        cloneNullableDate(
          schedule.completedAt
        ),
  
      cancelledAt:
        cloneNullableDate(
          schedule.cancelledAt
        ),
    };
  }
  
  function cloneJobTemplate(
    template:
      WonderScheduledJobTemplate<unknown>
  ): WonderScheduledJobTemplate<unknown> {
    return {
      ...template,
  
      payload:
        cloneUnknownValue(
          template.payload
        ),
  
      metadata:
        template.metadata
          ? {
              ...template.metadata,
  
              tags:
                template.metadata.tags
                  ? [
                      ...template
                        .metadata.tags,
                    ]
                  : undefined,
  
              values:
                template.metadata.values
                  ? cloneRecord(
                      template.metadata
                        .values
                    )
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
        cloneNullableDate(
          configuration.endAt
        ),
  
      maximumRuns:
        configuration
          .maximumRuns,
  
      misfirePolicy:
        configuration
          .misfirePolicy,
    };
  }
  
  function cloneScheduleError(
    error:
      WonderScheduleError
  ): WonderScheduleError {
    return {
      ...error,
  
      occurredAt:
        new Date(
          error.occurredAt
            .getTime()
        ),
  
      details:
        cloneRecord(
          error.details
        ),
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
        "boolean"
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
      Array.isArray(value)
    ) {
      return value.map(
        cloneUnknownValue
      );
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
  
  function cloneRecord(
    value:
      Readonly<
        Record<string, unknown>
      >
  ): Record<string, unknown> {
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
  
  // =========================================================
  // VALUE ENCODING
  // =========================================================
  
  function encodeValue(
    value: unknown,
    seen =
      new WeakSet<object>()
  ): WonderEncodedValue {
    if (
      value === undefined
    ) {
      return {
        __wonderType:
          "Undefined",
      };
    }
  
    if (
      value === null ||
      typeof value ===
        "boolean" ||
      typeof value ===
        "string"
    ) {
      return value;
    }
  
    if (
      typeof value ===
        "number"
    ) {
      if (
        !Number.isFinite(value)
      ) {
        throw new Error(
          "WonderSchedulerStorage: non-finite numbers cannot be persisted."
        );
      }
  
      return value;
    }
  
    if (
      value instanceof Date
    ) {
      if (
        Number.isNaN(
          value.getTime()
        )
      ) {
        throw new Error(
          "WonderSchedulerStorage: invalid Date cannot be persisted."
        );
      }
  
      return {
        __wonderType:
          "Date",
  
        value:
          value.toISOString(),
      };
    }
  
    if (
      typeof value !==
        "object"
    ) {
      throw new Error(
        `WonderSchedulerStorage: unsupported value type "${typeof value}".`
      );
    }
  
    if (
      seen.has(value)
    ) {
      throw new Error(
        "WonderSchedulerStorage: circular values cannot be persisted."
      );
    }
  
    seen.add(value);
  
    try {
      if (
        Array.isArray(value)
      ) {
        return value.map(
          (item) =>
            encodeValue(
              item,
              seen
            )
        );
      }
  
      const encoded:
        Record<
          string,
          WonderEncodedValue
        > = {};
  
      for (
        const [
          key,
          item,
        ] of Object.entries(
          value
        )
      ) {
        encoded[key] =
          encodeValue(
            item,
            seen
          );
      }
  
      return encoded;
    } finally {
      seen.delete(value);
    }
  }
  
  function decodeValue(
    value: unknown
  ): unknown {
    if (
      value === null ||
      typeof value ===
        "boolean" ||
      typeof value ===
        "number" ||
      typeof value ===
        "string"
    ) {
      return value;
    }
  
    if (
      Array.isArray(value)
    ) {
      return value.map(
        decodeValue
      );
    }
  
    if (!isRecord(value)) {
      throw new Error(
        "WonderSchedulerStorage: encoded value is invalid."
      );
    }
  
    if (
      value.__wonderType ===
        "Date"
    ) {
      if (
        typeof value.value !==
          "string"
      ) {
        throw new Error(
          "WonderSchedulerStorage: encoded Date is invalid."
        );
      }
  
      const date =
        new Date(
          value.value
        );
  
      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        throw new Error(
          "WonderSchedulerStorage: encoded Date value is invalid."
        );
      }
  
      return date;
    }
  
    if (
      value.__wonderType ===
        "Undefined"
    ) {
      return undefined;
    }
  
    const decoded:
      Record<string, unknown> = {};
  
    for (
      const [
        key,
        item,
      ] of Object.entries(
        value
      )
    ) {
      decoded[key] =
        decodeValue(item);
    }
  
    return decoded;
  }
  
  // =========================================================
  // TYPE GUARDS
  // =========================================================
  
  function isWonderScheduleType(
    value: unknown
  ): value is WonderScheduleType {
    return (
      value === "once" ||
      value === "interval"
    );
  }
  
  function isWonderScheduleStatus(
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
  
  // =========================================================
  // FILE HELPERS
  // =========================================================
  
  async function pathExists(
    path: string
  ): Promise<boolean> {
    try {
      await access(path);
  
      return true;
    } catch {
      return false;
    }
  }
  
  function createFileTimestamp(
    date: Date
  ): string {
    return date
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );
  }
  
  function removeByteOrderMark(
    value: string
  ): string {
    return value.replace(
      /^\uFEFF/,
      ""
    );
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function cloneValidDateOrThrow(
    value: Date,
    fieldName: string
  ): Date {
    if (!isValidDate(value)) {
      throw new Error(
        `WonderSchedulerStorage: "${fieldName}" must be a valid Date.`
      );
    }
  
    return new Date(
      value.getTime()
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
    return toError(
      error
    ).message;
  }
  
  // =========================================================
  // DEFAULT INSTANCE
  // =========================================================
  
  export const wonderSchedulerStorage =
    new WonderSchedulerStorage();
  
  export default WonderSchedulerStorage;