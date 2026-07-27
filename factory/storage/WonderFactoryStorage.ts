import {
    access,
    copyFile,
    mkdir,
    readFile,
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
    WonderFactory,
    WonderFactorySnapshot,
    WonderFactoryStatus,
  } from "../WonderFactory";
  
  import type {
    WonderQueueSnapshot,
  } from "../queue/WonderQueue";
  
  import type {
    WonderJob,
    WonderJobAttempt,
    WonderJobError,
    WonderJobLock,
    WonderJobMetadata,
    WonderJobProgress,
  } from "../types/WonderJob";
  
  import type {
    WonderJobStatus,
  } from "@/core/WonderEvents";
  
  // =========================================================
  // STORAGE TYPES
  // =========================================================
  
  export type WonderFactoryStorageWriteMode =
    | "replace"
    | "error-if-exists";
  
  export interface WonderFactoryStorageOptions {
    /**
     * Path to the primary Factory state file.
     */
    filePath?: string;
  
    /**
     * Working directory used when filePath is relative.
     */
    workingDirectory?: string;
  
    /**
     * Format JSON with indentation.
     */
    prettyPrint?: boolean;
  
    /**
     * Create missing parent directories.
     */
    createDirectories?: boolean;
  
    /**
     * Write to a temporary file before replacing the state file.
     */
    atomicWrite?: boolean;
  
    /**
     * Create a backup before replacing an existing state file.
     */
    createBackupBeforeWrite?: boolean;
  
    /**
     * Maximum number of automatic backups retained.
     */
    maximumBackups?: number;
  
    /**
     * Existing-file behaviour.
     */
    writeMode?: WonderFactoryStorageWriteMode;
  }
  
  export interface WonderFactoryStorageSaveOptions {
    createBackup?: boolean;
  
    writeMode?: WonderFactoryStorageWriteMode;
  
    prettyPrint?: boolean;
  }
  
  export interface WonderFactoryStorageLoadOptions {
    /**
     * Load a backup when the primary state cannot be read.
     */
    fallbackToLatestBackup?: boolean;
  }
  
  export interface WonderFactoryStorageRestoreOptions {
    /**
     * Remove existing jobs before importing the snapshot.
     */
    replaceExisting?: boolean;
  
    /**
     * Recover jobs that were processing when the snapshot was saved.
     */
    recoverProcessingJobs?: boolean;
  }
  
  export interface WonderFactoryStoredMetadata {
    factoryId: string;
  
    factoryName: string;
  
    factoryStatus: WonderFactoryStatus;
  
    executionMode:
      | "single"
      | "parallel";
  
    maximumConcurrentJobs: number;
  
    activeJobCount: number;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    startedAt: Date | null;
  
    stoppedAt: Date | null;
  }
  
  export interface WonderFactoryStoredState {
    version: number;
  
    savedAt: Date;
  
    metadata: WonderFactoryStoredMetadata;
  
    queue: WonderQueueSnapshot;
  }
  
  export interface WonderFactoryStorageSaveResult {
    success: boolean;
  
    path: string;
  
    backupPath: string | null;
  
    bytesWritten: number;
  
    savedAt: Date;
  
    jobCount: number;
  }
  
  export interface WonderFactoryStorageLoadResult {
    success: boolean;
  
    path: string;
  
    usedBackup: boolean;
  
    state: WonderFactoryStoredState;
  }
  
  export interface WonderFactoryStorageRestoreResult {
    success: boolean;
  
    importedJobs: number;
  
    recoveredProcessingJobs: number;
  
    skippedJobs: number;
  
    sourcePath: string;
  
    usedBackup: boolean;
  }
  
  export interface WonderFactoryStorageBackup {
    path: string;
  
    filename: string;
  
    createdAt: Date;
  
    sizeBytes: number;
  }
  
  export interface WonderFactoryStorageStatistics {
    exists: boolean;
  
    path: string;
  
    sizeBytes: number;
  
    modifiedAt: Date | null;
  
    backupCount: number;
  
    backupSizeBytes: number;
  
    autoSaveRunning: boolean;
  }
  
  export interface WonderFactoryAutoSaveOptions {
    intervalMilliseconds?: number;
  
    saveImmediately?: boolean;
  
    onSaved?: (
      result: WonderFactoryStorageSaveResult
    ) => void | Promise<void>;
  
    onError?: (
      error: Error
    ) => void | Promise<void>;
  }
  
  export interface WonderFactoryAutoSaveHandle {
    stop(): void;
  
    isRunning(): boolean;
  }
  
  // =========================================================
  // SERIALISATION TYPES
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
  
  interface WonderFactoryStorageDocument {
    format: "wonder-factory-state";
  
    version: number;
  
    encodedState: WonderEncodedValue;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const WONDER_FACTORY_STORAGE_VERSION =
    1;
  
  const WONDER_FACTORY_DOCUMENT_FORMAT =
    "wonder-factory-state" as const;
  
  const DEFAULT_STORAGE_DIRECTORY =
    "wonder-factory";
  
  const DEFAULT_STORAGE_FILENAME =
    "factory-state.json";
  
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
   * Persistent local storage for Wonder Factory.
   *
   * Responsibilities:
   *
   * - save Factory and Queue state
   * - restore queued and completed jobs
   * - recover interrupted processing jobs
   * - preserve Date objects inside payloads and results
   * - atomic file replacement
   * - backup creation and retention
   * - optional automatic saving
   */
  export class WonderFactoryStorage {
    private readonly options:
      Required<
        Omit<
          WonderFactoryStorageOptions,
          "filePath" |
          "workingDirectory"
        >
      > & {
        filePath: string;
  
        workingDirectory: string;
      };
  
    private autoSaveTimer:
      ReturnType<
        typeof setTimeout
      > | null = null;
  
    private autoSaveInProgress =
      false;
  
    constructor(
      options: WonderFactoryStorageOptions = {}
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
      factory: WonderFactory,
      options: WonderFactoryStorageSaveOptions = {}
    ): Promise<WonderFactoryStorageSaveResult> {
      const writeMode =
        options.writeMode ??
        this.options.writeMode;
  
      const shouldCreateBackup =
        options.createBackup ??
        this.options
          .createBackupBeforeWrite;
  
      const prettyPrint =
        options.prettyPrint ??
        this.options.prettyPrint;
  
      if (
        writeMode ===
          "error-if-exists" &&
        await this.exists()
      ) {
        throw new Error(
          `WonderFactoryStorage: state file already exists at "${this.options.filePath}".`
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
        createStoredState(factory);
  
      const document:
        WonderFactoryStorageDocument = {
        format:
          WONDER_FACTORY_DOCUMENT_FORMAT,
  
        version:
          WONDER_FACTORY_STORAGE_VERSION,
  
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
  
        savedAt:
          new Date(
            state.savedAt.getTime()
          ),
  
        jobCount:
          state.queue.jobs.length,
      };
    }
  
    // =========================================================
    // LOAD
    // =========================================================
  
    async load(
      options: WonderFactoryStorageLoadOptions = {}
    ): Promise<WonderFactoryStorageLoadResult> {
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
              "WonderFactoryStorage: primary state could not be loaded and no backup is available.",
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
      factory: WonderFactory,
      options: WonderFactoryStorageRestoreOptions = {}
    ): Promise<WonderFactoryStorageRestoreResult> {
      const loaded =
        await this.load({
          fallbackToLatestBackup:
            true,
        });
  
      const replaceExisting =
        options.replaceExisting ??
        true;
  
      const recoverProcessingJobs =
        options.recoverProcessingJobs ??
        true;
  
      const sourceJobs =
        loaded.state.queue.jobs;
  
      const preparedJobs:
        WonderJob<
          unknown,
          unknown
        >[] = [];
  
      let recoveredProcessingJobs =
        0;
  
      for (
        const sourceJob of
          sourceJobs
      ) {
        if (
          sourceJob.status ===
            "processing" &&
          recoverProcessingJobs
        ) {
          preparedJobs.push(
            recoverInterruptedJob(
              sourceJob
            )
          );
  
          recoveredProcessingJobs +=
            1;
  
          continue;
        }
  
        preparedJobs.push(
          cloneStoredJob(
            sourceJob
          )
        );
      }
  
      const existingJobIds =
        new Set(
          factory
            .getQueue()
            .listJobs()
            .map(
              (job) =>
                job.id
            )
        );
  
      const snapshot:
        WonderQueueSnapshot = {
        version:
          loaded.state.queue
            .version,
  
        createdAt:
          new Date(
            loaded.state.queue
              .createdAt
              .getTime()
          ),
  
        jobs:
          preparedJobs,
      };
  
      const importedJobs =
        factory
          .getQueue()
          .importSnapshot(
            snapshot,
            replaceExisting
          );
  
      const skippedJobs =
        replaceExisting
          ? preparedJobs.length -
            importedJobs
          : preparedJobs.filter(
              (job) =>
                existingJobIds.has(
                  job.id
                )
            ).length;
  
      return {
        success: true,
  
        importedJobs,
  
        recoveredProcessingJobs,
  
        skippedJobs,
  
        sourcePath:
          loaded.path,
  
        usedBackup:
          loaded.usedBackup,
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
          "WonderFactoryStorage: cannot back up a state file that does not exist."
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
      WonderFactoryStorageBackup[]
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
  
      const {
        readdir,
      } =
        await import(
          "node:fs/promises"
        );
  
      const entries =
        await readdir(
          backupDirectory,
          {
            withFileTypes: true,
          }
        );
  
      const backups:
        WonderFactoryStorageBackup[] = [];
  
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
      const maximumBackups =
        this.options
          .maximumBackups;
  
      const backups =
        await this.listBackups();
  
      if (
        backups.length <=
        maximumBackups
      ) {
        return 0;
      }
  
      const backupsToDelete =
        backups.slice(
          maximumBackups
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
    // DELETE
    // =========================================================
  
    async delete(
      includeBackups = false
    ): Promise<void> {
      await rm(
        this.options.filePath,
        {
          force: true,
        }
      );
  
      if (
        includeBackups
      ) {
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
    // STATUS
    // =========================================================
  
    async exists(): Promise<boolean> {
      return pathExists(
        this.options.filePath
      );
    }
  
    async getStatistics(): Promise<WonderFactoryStorageStatistics> {
      const exists =
        await this.exists();
  
      let sizeBytes = 0;
  
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
    // AUTO SAVE
    // =========================================================
  
    startAutoSave(
      factory: WonderFactory,
      options: WonderFactoryAutoSaveOptions = {}
    ): WonderFactoryAutoSaveHandle {
      if (
        this.isAutoSaveRunning()
      ) {
        throw new Error(
          "WonderFactoryStorage: automatic saving is already running."
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
                factory
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
        this.autoSaveTimer
      ) {
        clearTimeout(
          this.autoSaveTimer
        );
  
        this.autoSaveTimer =
          null;
      }
    }
  
    isAutoSaveRunning(): boolean {
      return (
        this.autoSaveTimer !==
        null
      );
    }
  
    // =========================================================
    // INTERNAL FILE OPERATIONS
    // =========================================================
  
    private async readStateFile(
      path: string
    ): Promise<WonderFactoryStoredState> {
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
            `WonderFactoryStorage: could not read "${path}".`,
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
            `WonderFactoryStorage: state file "${path}" contains invalid JSON.`,
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
            `WonderFactoryStorage: failed to write "${this.options.filePath}".`,
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
          `WonderFactoryStorage: directory "${parentDirectory}" does not exist.`
        );
      }
    }
  }
  
  // =========================================================
  // STATE CREATION
  // =========================================================
  
  function createStoredState(
    factory: WonderFactory
  ): WonderFactoryStoredState {
    const factorySnapshot =
      factory.getSnapshot();
  
    return {
      version:
        WONDER_FACTORY_STORAGE_VERSION,
  
      savedAt:
        new Date(),
  
      metadata:
        createStoredMetadata(
          factorySnapshot
        ),
  
      queue:
        factory
          .getQueue()
          .createSnapshot(),
    };
  }
  
  function createStoredMetadata(
    snapshot: WonderFactorySnapshot
  ): WonderFactoryStoredMetadata {
    return {
      factoryId:
        snapshot.id,
  
      factoryName:
        snapshot.name,
  
      factoryStatus:
        snapshot.status,
  
      executionMode:
        snapshot.executionMode,
  
      maximumConcurrentJobs:
        snapshot
          .maximumConcurrentJobs,
  
      activeJobCount:
        snapshot.activeJobCount,
  
      createdAt:
        new Date(
          snapshot.createdAt.getTime()
        ),
  
      updatedAt:
        new Date(
          snapshot.updatedAt.getTime()
        ),
  
      startedAt:
        snapshot.startedAt
          ? new Date(
              snapshot.startedAt.getTime()
            )
          : null,
  
      stoppedAt:
        snapshot.stoppedAt
          ? new Date(
              snapshot.stoppedAt.getTime()
            )
          : null,
    };
  }
  
  // =========================================================
  // DOCUMENT PARSING
  // =========================================================
  
  function parseStorageDocument(
    value: unknown
  ): WonderFactoryStoredState {
    if (
      !isRecord(value)
    ) {
      throw new Error(
        "WonderFactoryStorage: storage document must be an object."
      );
    }
  
    if (
      value.format !==
      WONDER_FACTORY_DOCUMENT_FORMAT
    ) {
      throw new Error(
        "WonderFactoryStorage: unsupported storage document format."
      );
    }
  
    if (
      value.version !==
      WONDER_FACTORY_STORAGE_VERSION
    ) {
      throw new Error(
        `WonderFactoryStorage: unsupported document version "${String(
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
  ): WonderFactoryStoredState {
    if (
      !isRecord(value)
    ) {
      throw new Error(
        "WonderFactoryStorage: decoded state must be an object."
      );
    }
  
    if (
      value.version !==
      WONDER_FACTORY_STORAGE_VERSION
    ) {
      throw new Error(
        "WonderFactoryStorage: state version is invalid."
      );
    }
  
    if (
      !isValidDate(
        value.savedAt
      )
    ) {
      throw new Error(
        "WonderFactoryStorage: savedAt is invalid."
      );
    }
  
    const metadata =
      validateStoredMetadata(
        value.metadata
      );
  
    const queue =
      validateQueueSnapshot(
        value.queue
      );
  
    return {
      version:
        WONDER_FACTORY_STORAGE_VERSION,
  
      savedAt:
        new Date(
          value.savedAt.getTime()
        ),
  
      metadata,
  
      queue,
    };
  }
  
  function validateStoredMetadata(
    value: unknown
  ): WonderFactoryStoredMetadata {
    if (
      !isRecord(value)
    ) {
      throw new Error(
        "WonderFactoryStorage: Factory metadata is invalid."
      );
    }
  
    if (
      typeof value.factoryId !==
        "string" ||
      typeof value.factoryName !==
        "string" ||
      !isWonderFactoryStatus(
        value.factoryStatus
      ) ||
      (
        value.executionMode !==
          "single" &&
        value.executionMode !==
          "parallel"
      ) ||
      typeof value.maximumConcurrentJobs !==
        "number" ||
      typeof value.activeJobCount !==
        "number" ||
      !isValidDate(
        value.createdAt
      ) ||
      !isValidDate(
        value.updatedAt
      )
    ) {
      throw new Error(
        "WonderFactoryStorage: Factory metadata contains invalid fields."
      );
    }
  
    return {
      factoryId:
        value.factoryId,
  
      factoryName:
        value.factoryName,
  
      factoryStatus:
        value.factoryStatus,
  
      executionMode:
        value.executionMode,
  
      maximumConcurrentJobs:
        Math.max(
          1,
          Math.floor(
            value.maximumConcurrentJobs
          )
        ),
  
      activeJobCount:
        Math.max(
          0,
          Math.floor(
            value.activeJobCount
          )
        ),
  
      createdAt:
        new Date(
          value.createdAt.getTime()
        ),
  
      updatedAt:
        new Date(
          value.updatedAt.getTime()
        ),
  
      startedAt:
        isValidDate(
          value.startedAt
        )
          ? new Date(
              value.startedAt.getTime()
            )
          : null,
  
      stoppedAt:
        isValidDate(
          value.stoppedAt
        )
          ? new Date(
              value.stoppedAt.getTime()
            )
          : null,
    };
  }
  
  function validateQueueSnapshot(
    value: unknown
  ): WonderQueueSnapshot {
    if (
      !isRecord(value) ||
      typeof value.version !==
        "number" ||
      !isValidDate(
        value.createdAt
      ) ||
      !Array.isArray(
        value.jobs
      )
    ) {
      throw new Error(
        "WonderFactoryStorage: Queue snapshot is invalid."
      );
    }
  
    return {
      version:
        Math.floor(
          value.version
        ),
  
      createdAt:
        new Date(
          value.createdAt.getTime()
        ),
  
      jobs:
        value.jobs.map(
          validateStoredJob
        ),
    };
  }
  
  // =========================================================
  // JOB VALIDATION AND RECOVERY
  // =========================================================
  
  function validateStoredJob(
    value: unknown
  ): WonderJob<
    unknown,
    unknown
  > {
    if (
      !isRecord(value) ||
      typeof value.id !==
        "string" ||
      typeof value.batchId !==
        "string" ||
      typeof value.type !==
        "string" ||
      !isWonderJobStatus(
        value.status
      ) ||
      typeof value.priority !==
        "number" ||
      !isRecord(
        value.progress
      ) ||
      !Array.isArray(
        value.attempts
      ) ||
      typeof value.attemptCount !==
        "number" ||
      typeof value.maximumAttempts !==
        "number" ||
      typeof value.failureStrategy !==
        "string" ||
      !isValidDate(
        value.scheduledAt
      ) ||
      !isValidDate(
        value.createdAt
      ) ||
      !isValidDate(
        value.updatedAt
      ) ||
      !isRecord(
        value.metadata
      )
    ) {
      throw new Error(
        "WonderFactoryStorage: stored job is invalid."
      );
    }
  
    return value as unknown as
      WonderJob<
        unknown,
        unknown
      >;
  }
  
  function recoverInterruptedJob(
    job: WonderJob<
      unknown,
      unknown
    >
  ): WonderJob<
    unknown,
    unknown
  > {
    const now =
      new Date();
  
    const recoveryError:
      WonderJobError = {
      message:
        "Job was interrupted by a Factory restart and returned to the queue.",
  
      code:
        "FACTORY_RESTART_RECOVERY",
  
      retryable: true,
  
      details: {
        previousStatus:
          job.status,
  
        recoveredAt:
          now.toISOString(),
      },
  
      occurredAt:
        new Date(
          now.getTime()
        ),
    };
  
    const attempts =
      job.attempts.map(
        (
          attempt,
          index
        ) => {
          if (
            index !==
            job.attempts.length - 1 ||
            attempt.completedAt !==
              null
          ) {
            return cloneAttempt(
              attempt
            );
          }
  
          return {
            ...cloneAttempt(
              attempt
            ),
  
            completedAt:
              new Date(
                now.getTime()
              ),
  
            durationMilliseconds:
              Math.max(
                0,
                now.getTime() -
                attempt.startedAt.getTime()
              ),
  
            success: false,
  
            error:
              cloneJobError(
                recoveryError
              ),
          };
        }
      );
  
    return {
      ...cloneStoredJob(job),
  
      status:
        job.attemptCount <
          job.maximumAttempts
          ? "queued"
          : "failed",
  
      result: null,
  
      progress: {
        ...cloneProgress(
          job.progress
        ),
  
        status:
          job.attemptCount <
            job.maximumAttempts
            ? "pending"
            : "failed",
  
        message:
          recoveryError.message,
  
        updatedAt:
          new Date(
            now.getTime()
          ),
      },
  
      attempts,
  
      lastError:
        cloneJobError(
          recoveryError
        ),
  
      lock: null,
  
      retryAt:
        job.attemptCount <
          job.maximumAttempts
          ? new Date(
              now.getTime()
            )
          : null,
  
      completedAt:
        job.attemptCount <
          job.maximumAttempts
          ? null
          : new Date(
              now.getTime()
            ),
  
      cancelledAt: null,
  
      updatedAt:
        new Date(
          now.getTime()
        ),
    };
  }
  
  // =========================================================
  // JOB CLONING
  // =========================================================
  
  function cloneStoredJob(
    job: WonderJob<
      unknown,
      unknown
    >
  ): WonderJob<
    unknown,
    unknown
  > {
    return {
      ...job,
  
      progress:
        cloneProgress(
          job.progress
        ),
  
      attempts:
        job.attempts.map(
          cloneAttempt
        ),
  
      lastError:
        job.lastError
          ? cloneJobError(
              job.lastError
            )
          : null,
  
      lock:
        job.lock
          ? cloneLock(
              job.lock
            )
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
  
      metadata:
        cloneMetadata(
          job.metadata
        ),
    };
  }
  
  function cloneProgress(
    progress: WonderJobProgress
  ): WonderJobProgress {
    return {
      ...progress,
  
      updatedAt:
        new Date(
          progress.updatedAt.getTime()
        ),
    };
  }
  
  function cloneAttempt(
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
              attempt.completedAt
                .getTime()
            )
          : null,
  
      error:
        attempt.error
          ? cloneJobError(
              attempt.error
            )
          : null,
    };
  }
  
  function cloneJobError(
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
  
  function cloneLock(
    lock: WonderJobLock
  ): WonderJobLock {
    return {
      ...lock,
  
      lockedAt:
        new Date(
          lock.lockedAt.getTime()
        ),
  
      expiresAt:
        new Date(
          lock.expiresAt.getTime()
        ),
    };
  }
  
  function cloneMetadata(
    metadata: WonderJobMetadata
  ): WonderJobMetadata {
    return {
      ...metadata,
  
      tags: [
        ...metadata.tags,
      ],
  
      values: {
        ...metadata.values,
      },
    };
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
          "WonderFactoryStorage: non-finite numbers cannot be persisted."
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
          "WonderFactoryStorage: invalid Date cannot be persisted."
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
        `WonderFactoryStorage: unsupported value type "${typeof value}".`
      );
    }
  
    if (
      seen.has(value)
    ) {
      throw new Error(
        "WonderFactoryStorage: circular values cannot be persisted."
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
  
      const encodedRecord: {
        [key: string]:
          WonderEncodedValue;
      } = {};
  
      for (
        const [
          key,
          item,
        ] of Object.entries(
          value
        )
      ) {
        encodedRecord[key] =
          encodeValue(
            item,
            seen
          );
      }
  
      return encodedRecord;
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
  
    if (
      !isRecord(value)
    ) {
      throw new Error(
        "WonderFactoryStorage: encoded value is invalid."
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
          "WonderFactoryStorage: encoded Date is invalid."
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
          "WonderFactoryStorage: encoded Date value is invalid."
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
  
    const decodedRecord:
      Record<string, unknown> = {};
  
    for (
      const [
        key,
        item,
      ] of Object.entries(
        value
      )
    ) {
      decodedRecord[key] =
        decodeValue(item);
    }
  
    return decodedRecord;
  }
  
  // =========================================================
  // TYPE GUARDS
  // =========================================================
  
  function isWonderFactoryStatus(
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
  
  function isWonderJobStatus(
    value: unknown
  ): value is WonderJobStatus {
    return (
      value === "queued" ||
      value === "processing" ||
      value === "completed" ||
      value === "failed" ||
      value === "cancelled"
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
  
  export const wonderFactoryStorage =
    new WonderFactoryStorage();
  
  export default WonderFactoryStorage;