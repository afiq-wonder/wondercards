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
  
  import {
    WonderBaseStorageAdapter,
    WonderStorageError,
  } from "../WonderStorageAdapter";
  
  import type {
    WonderStorageBackupAdapter,
    WonderStorageBackupCreateOptions,
    WonderStorageBackupCreateResult,
    WonderStorageBackupDeleteResult,
    WonderStorageBackupMetadata,
    WonderStorageBackupRestoreOptions,
    WonderStorageBackupRestoreResult,
    WonderStorageDeleteOptions,
    WonderStorageDeleteResult,
    WonderStorageHealthReport,
    WonderStorageLoadOptions,
    WonderStorageLoadResult,
    WonderStorageRevision,
    WonderStorageRevisionCheck,
    WonderStorageRevisionCheckResult,
    WonderStorageSaveOptions,
    WonderStorageSaveResult,
    WonderStorageStatistics,
    WonderStorageVersionedAdapter,
  } from "../WonderStorageAdapter";
  
  import {
    WonderStorageSerializer,
    wonderStorageSerializer,
  } from "../serialization/WonderStorageSerializer";
  
  import {
    WonderStorageChecksumService,
  } from "../validation/WonderStorageIntegrity";
  
  // =========================================================
  // TYPES
  // =========================================================
  
  export interface WonderFilesystemAdapterOptions {
    /**
     * Main state-file path.
     */
    filePath: string;
  
    /**
     * Base directory used when filePath is relative.
     */
    workingDirectory?: string;
  
    /**
     * Human-readable adapter name.
     */
    name?: string;
  
    /**
     * Adapter version.
     */
    version?: string;
  
    /**
     * Create missing directories automatically.
     */
    createDirectories?: boolean;
  
    /**
     * Write using a temporary file before replacing state.
     */
    atomicWrite?: boolean;
  
    /**
     * Automatically verify checksum during load.
     */
    validateChecksumOnLoad?: boolean;
  
    /**
     * Automatically create a backup before overwriting state.
     */
    createBackupBeforeWrite?: boolean;
  
    /**
     * Automatically create a backup before deleting state.
     */
    createBackupBeforeDelete?: boolean;
  
    /**
     * Maximum backups retained automatically.
     */
    maximumBackups?: number;
  
    /**
     * Optional serializer instance.
     */
    serializer?: WonderStorageSerializer;
  }
  
  export interface WonderFilesystemAdapterSnapshot {
    backend: "file";
  
    name: string;
  
    version: string;
  
    filePath: string;
  
    backupDirectory: string;
  
    exists: boolean;
  
    revision: WonderStorageRevision | null;
  
    backupCount: number;
  }
  
  interface ResolvedWonderFilesystemAdapterOptions {
    filePath: string;
  
    workingDirectory: string;
  
    name: string;
  
    version: string;
  
    createDirectories: boolean;
  
    atomicWrite: boolean;
  
    validateChecksumOnLoad: boolean;
  
    createBackupBeforeWrite: boolean;
  
    createBackupBeforeDelete: boolean;
  
    maximumBackups: number;
  }
  
  interface WonderFilesystemDocument<
    TValue
  > {
    format: "wonder-filesystem-storage";
  
    documentVersion: number;
  
    metadata: {
      backend: "file";
  
      adapterName: string;
  
      adapterVersion: string;
  
      revision: number;
  
      etag: string;
  
      checksum: string;
  
      sizeBytes: number;
  
      createdAt: Date;
  
      updatedAt: Date;
  
      custom: Record<
        string,
        unknown
      >;
    };
  
    value: TValue;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const WONDER_FILESYSTEM_DOCUMENT_VERSION =
    1;
  
  const WONDER_FILESYSTEM_DOCUMENT_FORMAT =
    "wonder-filesystem-storage" as const;
  
  const DEFAULT_ADAPTER_NAME =
    "Wonder Filesystem Adapter";
  
  const DEFAULT_ADAPTER_VERSION =
    "1.0.0";
  
  const DEFAULT_MAXIMUM_BACKUPS =
    10;
  
  const MAXIMUM_BACKUPS =
    1_000;
  
  // =========================================================
  // ADAPTER
  // =========================================================
  
  /**
   * Local filesystem implementation of the Wonder storage
   * contracts.
   *
   * Foundation A supports:
   *
   * - save
   * - load
   * - exists
   * - delete
   * - atomic writes
   * - deterministic serialization
   * - checksum validation
   * - revision and ETag checking
   * - backup creation
   * - backup restoration
   * - backup retention
   * - health reporting
   */
  export class WonderFilesystemAdapter<
    TValue
  > extends WonderBaseStorageAdapter<TValue>
    implements
      WonderStorageVersionedAdapter,
      WonderStorageBackupAdapter {
    readonly backend =
      "file" as const;
  
    readonly name: string;
  
    readonly version: string;
  
    private readonly options:
      ResolvedWonderFilesystemAdapterOptions;
  
    private readonly serializer:
      WonderStorageSerializer;
  
    private readonly checksumService:
      WonderStorageChecksumService;
  
    private lastSavedAt:
      Date | null = null;
  
    private lastLoadedAt:
      Date | null = null;
  
    private lastBackupAt:
      Date | null = null;
  
    constructor(
      options:
        WonderFilesystemAdapterOptions
    ) {
      super();
  
      const workingDirectory =
        resolve(
          options.workingDirectory ??
          process.cwd()
        );
  
      this.options = {
        filePath:
          resolve(
            workingDirectory,
            normaliseRequiredText(
              options.filePath,
              "filePath"
            )
          ),
  
        workingDirectory,
  
        name:
          normaliseOptionalText(
            options.name
          ) ??
          DEFAULT_ADAPTER_NAME,
  
        version:
          normaliseOptionalText(
            options.version
          ) ??
          DEFAULT_ADAPTER_VERSION,
  
        createDirectories:
          options.createDirectories ??
          true,
  
        atomicWrite:
          options.atomicWrite ??
          true,
  
        validateChecksumOnLoad:
          options.validateChecksumOnLoad ??
          true,
  
        createBackupBeforeWrite:
          options.createBackupBeforeWrite ??
          true,
  
        createBackupBeforeDelete:
          options.createBackupBeforeDelete ??
          true,
  
        maximumBackups:
          clampInteger(
            options.maximumBackups ??
            DEFAULT_MAXIMUM_BACKUPS,
            0,
            MAXIMUM_BACKUPS
          ),
      };
  
      this.name =
        this.options.name;
  
      this.version =
        this.options.version;
  
      this.serializer =
        options.serializer ??
        wonderStorageSerializer;
  
      this.checksumService =
        new WonderStorageChecksumService(
          this.serializer
        );
    }
  
    // =========================================================
    // ACCESSORS
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
  
    getOptions(): Readonly<
      ResolvedWonderFilesystemAdapterOptions
    > {
      return {
        ...this.options,
      };
    }
  
    // =========================================================
    // SAVE
    // =========================================================
  
    async save(
      value: TValue,
      options:
        WonderStorageSaveOptions = {}
    ): Promise<WonderStorageSaveResult> {
      await this.ensureParentDirectory();
  
      const currentDocument =
        await this.readDocumentIfExists(
          this.options.filePath
        );
  
      const currentRevision =
        currentDocument
          ? documentToRevision(
              currentDocument
            )
          : null;
  
      this.assertRevisionMatch(
        currentRevision,
        {
          expectedRevision:
            options.expectedRevision,
  
          expectedEtag:
            options.expectedEtag,
        }
      );
  
      if (
        currentDocument &&
        options.overwrite ===
          false
      ) {
        throw new WonderStorageError(
          `WonderFilesystemAdapter: storage already exists at "${this.options.filePath}".`,
          {
            code:
              "STORAGE_ALREADY_EXISTS",
  
            retryable: false,
  
            details: {
              filePath:
                this.options.filePath,
            },
          }
        );
      }
  
      let backupId:
        string | null = null;
  
      const shouldCreateBackup =
        (
          options.createBackup ??
          this.options
            .createBackupBeforeWrite
        ) &&
        currentDocument !==
          null;
  
      if (
        shouldCreateBackup
      ) {
        const backupResult =
          await this.createBackup({
            label:
              "before-save",
  
            metadata: {
              source:
                "WonderFilesystemAdapter.save",
            },
          });
  
        backupId =
          backupResult.backup.id;
      }
  
      const now =
        new Date();
  
      const revision =
        (
          currentDocument
            ?.metadata.revision ??
          0
        ) + 1;
  
      const serializedValue =
        this.serializer.serialize(
          value
        );
  
      const checksumResult =
        this.checksumService
          .calculateString(
            serializedValue.content,
            {
              algorithm:
                "sha256",
            }
          );
  
      const etag =
        createEtag(
          revision,
          checksumResult.checksum
        );
  
      const document:
        WonderFilesystemDocument<TValue> = {
        format:
          WONDER_FILESYSTEM_DOCUMENT_FORMAT,
  
        documentVersion:
          WONDER_FILESYSTEM_DOCUMENT_VERSION,
  
        metadata: {
          backend:
            "file",
  
          adapterName:
            this.name,
  
          adapterVersion:
            this.version,
  
          revision,
  
          etag,
  
          checksum:
            checksumResult.checksum,
  
          sizeBytes:
            serializedValue.bytes,
  
          createdAt:
            currentDocument
              ? new Date(
                  currentDocument
                    .metadata
                    .createdAt
                    .getTime()
                )
              : new Date(
                  now.getTime()
                ),
  
          updatedAt:
            new Date(
              now.getTime()
            ),
  
          custom: {
            ...(
              currentDocument
                ?.metadata.custom ??
              {}
            ),
  
            ...(
              options.metadata ??
              {}
            ),
          },
        },
  
        value,
      };
  
      const serializedDocument =
        this.serializer.serialize(
          document
        );
  
      await this.writeContent(
        serializedDocument.content
      );
  
      this.lastSavedAt =
        new Date(
          now.getTime()
        );
  
      await this.pruneBackups(
        this.options.maximumBackups
      );
  
      return {
        success: true,
  
        savedAt:
          new Date(
            now.getTime()
          ),
  
        metadata:
          this.createMetadata({
            revision,
  
            createdAt:
              document.metadata
                .createdAt,
  
            updatedAt:
              document.metadata
                .updatedAt,
  
            checksum:
              document.metadata
                .checksum,
  
            etag:
              document.metadata
                .etag,
  
            sizeBytes:
              document.metadata
                .sizeBytes,
  
            custom:
              document.metadata
                .custom,
          }),
  
        backupCreated:
          backupId !== null,
  
        backupId,
      };
    }
  
    // =========================================================
    // LOAD
    // =========================================================
  
    async load(
      options:
        WonderStorageLoadOptions = {}
    ): Promise<
      WonderStorageLoadResult<TValue>
    > {
      try {
        const document =
          await this.readDocument(
            this.options.filePath
          );
  
        this.validateRequestedRevision(
          document,
          options.revision
        );
  
        const validateChecksum =
          options.validateChecksum ??
          this.options
            .validateChecksumOnLoad;
  
        if (
          validateChecksum
        ) {
          this.assertDocumentChecksum(
            document
          );
        }
  
        const loadedAt =
          new Date();
  
        this.lastLoadedAt =
          new Date(
            loadedAt.getTime()
          );
  
        return {
          success: true,
  
          loadedAt,
  
          restoredFromBackup:
            false,
  
          backupId: null,
  
          metadata:
            this.createMetadata({
              revision:
                document.metadata
                  .revision,
  
              createdAt:
                document.metadata
                  .createdAt,
  
              updatedAt:
                document.metadata
                  .updatedAt,
  
              checksum:
                document.metadata
                  .checksum,
  
              etag:
                document.metadata
                  .etag,
  
              sizeBytes:
                document.metadata
                  .sizeBytes,
  
              custom:
                document.metadata
                  .custom,
            }),
  
          value:
            document.value,
        };
      } catch (error) {
        if (
          options.allowBackupFallback !==
          true
        ) {
          throw error;
        }
  
        const backups =
          await this.listBackups();
  
        const latestBackup =
          backups.find(
            (backup) =>
              backup.status ===
              "available"
          );
  
        if (!latestBackup) {
          throw new WonderStorageError(
            "WonderFilesystemAdapter: primary state failed to load and no backup is available.",
            {
              code:
                "STORAGE_BACKUP_NOT_FOUND",
  
              cause:
                error,
  
              details: {
                filePath:
                  this.options.filePath,
  
                originalError:
                  getErrorMessage(
                    error
                  ),
              },
            }
          );
        }
  
        const document =
          await this.readDocument(
            this.getBackupPath(
              latestBackup.id
            )
          );
  
        this.validateRequestedRevision(
          document,
          options.revision
        );
  
        if (
          options.validateChecksum ??
          true
        ) {
          this.assertDocumentChecksum(
            document
          );
        }
  
        const loadedAt =
          new Date();
  
        this.lastLoadedAt =
          new Date(
            loadedAt.getTime()
          );
  
        return {
          success: true,
  
          loadedAt,
  
          restoredFromBackup:
            true,
  
          backupId:
            latestBackup.id,
  
          metadata:
            this.createMetadata({
              revision:
                document.metadata
                  .revision,
  
              createdAt:
                document.metadata
                  .createdAt,
  
              updatedAt:
                document.metadata
                  .updatedAt,
  
              checksum:
                document.metadata
                  .checksum,
  
              etag:
                document.metadata
                  .etag,
  
              sizeBytes:
                document.metadata
                  .sizeBytes,
  
              custom:
                document.metadata
                  .custom,
            }),
  
          value:
            document.value,
        };
      }
    }
  
    // =========================================================
    // EXISTS
    // =========================================================
  
    async exists(): Promise<boolean> {
      return pathExists(
        this.options.filePath
      );
    }
  
    // =========================================================
    // DELETE
    // =========================================================
  
    async delete(
      options:
        WonderStorageDeleteOptions = {}
    ): Promise<
      WonderStorageDeleteResult
    > {
      const document =
        await this.readDocumentIfExists(
          this.options.filePath
        );
  
      if (!document) {
        throw new WonderStorageError(
          `WonderFilesystemAdapter: storage does not exist at "${this.options.filePath}".`,
          {
            code:
              "STORAGE_NOT_FOUND",
  
            details: {
              filePath:
                this.options.filePath,
            },
          }
        );
      }
  
      const revision =
        documentToRevision(
          document
        );
  
      this.assertRevisionMatch(
        revision,
        {
          expectedRevision:
            options.expectedRevision,
  
          expectedEtag:
            options.expectedEtag,
        }
      );
  
      let backupId:
        string | null = null;
  
      const shouldCreateBackup =
        options.createBackup ??
        this.options
          .createBackupBeforeDelete;
  
      if (
        shouldCreateBackup
      ) {
        const backupResult =
          await this.createBackup({
            label:
              "before-delete",
  
            metadata: {
              source:
                "WonderFilesystemAdapter.delete",
            },
          });
  
        backupId =
          backupResult.backup.id;
      }
  
      await rm(
        this.options.filePath,
        {
          force: true,
        }
      );
  
      return {
        success: true,
  
        deletedAt:
          new Date(),
  
        previousRevision:
          revision.revision,
  
        backupCreated:
          backupId !== null,
  
        backupId,
      };
    }
  
    // =========================================================
    // REVISION
    // =========================================================
  
    async getRevision(): Promise<
      WonderStorageRevision | null
    > {
      const document =
        await this.readDocumentIfExists(
          this.options.filePath
        );
  
      return document
        ? documentToRevision(
            document
          )
        : null;
    }
  
    async checkRevision(
      check:
        WonderStorageRevisionCheck
    ): Promise<
      WonderStorageRevisionCheckResult
    > {
      const current =
        await this.getRevision();
  
      const expectedRevision =
        check.expectedRevision ??
        null;
  
      const expectedEtag =
        check.expectedEtag ??
        null;
  
      const revisionMatches =
        expectedRevision ===
          null ||
        current?.revision ===
          expectedRevision;
  
      const etagMatches =
        expectedEtag ===
          null ||
        current?.etag ===
          expectedEtag;
  
      return {
        matched:
          revisionMatches &&
          etagMatches,
  
        current:
          current
            ? {
                revision:
                  current.revision,
  
                etag:
                  current.etag,
  
                updatedAt:
                  new Date(
                    current.updatedAt
                      .getTime()
                  ),
              }
            : null,
  
        expectedRevision,
  
        expectedEtag,
      };
    }
  
    // =========================================================
    // BACKUPS
    // =========================================================
  
    async createBackup(
      options:
        WonderStorageBackupCreateOptions = {}
    ): Promise<
      WonderStorageBackupCreateResult
    > {
      const document =
        await this.readDocumentIfExists(
          this.options.filePath
        );
  
      if (!document) {
        throw new WonderStorageError(
          "WonderFilesystemAdapter: cannot create a backup because primary storage does not exist.",
          {
            code:
              "STORAGE_NOT_FOUND",
  
            details: {
              filePath:
                this.options.filePath,
            },
          }
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
  
      const id =
        await this.createUniqueBackupId();
  
      const backupPath =
        this.getBackupPath(id);
  
      await copyFile(
        this.options.filePath,
        backupPath
      );
  
      const createdAt =
        new Date();
  
      this.lastBackupAt =
        new Date(
          createdAt.getTime()
        );
  
      const backup: WonderStorageBackupMetadata = {
        id,
  
        backend:
          "file",
  
        status:
          "available",
  
        revision:
          document.metadata
            .revision,
  
        createdAt,
  
        restoredAt: null,
  
        deletedAt: null,
  
        checksum:
          document.metadata
            .checksum,
  
        sizeBytes:
          (
            await stat(
              backupPath
            )
          ).size,
  
        metadata: {
          label:
            normaliseOptionalText(
              options.label
            ),
  
          sourceFile:
            this.options.filePath,
  
          adapterName:
            this.name,
  
          ...(
            options.metadata ??
            {}
          ),
        },
      };
  
      return {
        success: true,
  
        backup,
      };
    }
  
    async restoreBackup(
      backupId: string,
      options:
        WonderStorageBackupRestoreOptions = {}
    ): Promise<
      WonderStorageBackupRestoreResult
    > {
      const cleanBackupId =
        normaliseRequiredText(
          backupId,
          "backupId"
        );
  
      const backupPath =
        this.getBackupPath(
          cleanBackupId
        );
  
      if (
        !await pathExists(
          backupPath
        )
      ) {
        throw new WonderStorageError(
          `WonderFilesystemAdapter: backup "${cleanBackupId}" was not found.`,
          {
            code:
              "STORAGE_BACKUP_NOT_FOUND",
  
            details: {
              backupId:
                cleanBackupId,
            },
          }
        );
      }
  
      if (
        await this.exists() &&
        options.overwrite ===
          false
      ) {
        throw new WonderStorageError(
          "WonderFilesystemAdapter: primary storage already exists and overwrite is disabled.",
          {
            code:
              "STORAGE_ALREADY_EXISTS",
  
            details: {
              filePath:
                this.options.filePath,
            },
          }
        );
      }
  
      const document =
        await this.readDocument(
          backupPath
        );
  
      if (
        options.validateChecksum ??
        true
      ) {
        this.assertDocumentChecksum(
          document
        );
      }
  
      const content =
        await readFile(
          backupPath,
          {
            encoding: "utf8",
          }
        );
  
      await this.ensureParentDirectory();
  
      await this.writeContent(
        content
      );
  
      const restoredAt =
        new Date();
  
      return {
        success: true,
  
        backupId:
          cleanBackupId,
  
        restoredAt,
  
        restoredRevision:
          document.metadata
            .revision,
      };
    }
  
    async deleteBackup(
      backupId: string
    ): Promise<
      WonderStorageBackupDeleteResult
    > {
      const cleanBackupId =
        normaliseRequiredText(
          backupId,
          "backupId"
        );
  
      const backupPath =
        this.getBackupPath(
          cleanBackupId
        );
  
      if (
        !await pathExists(
          backupPath
        )
      ) {
        throw new WonderStorageError(
          `WonderFilesystemAdapter: backup "${cleanBackupId}" was not found.`,
          {
            code:
              "STORAGE_BACKUP_NOT_FOUND",
  
            details: {
              backupId:
                cleanBackupId,
            },
          }
        );
      }
  
      await rm(
        backupPath,
        {
          force: true,
        }
      );
  
      return {
        success: true,
  
        backupId:
          cleanBackupId,
  
        deletedAt:
          new Date(),
      };
    }
  
    async getBackup(
      backupId: string
    ): Promise<
      WonderStorageBackupMetadata | null
    > {
      const cleanBackupId =
        normaliseRequiredText(
          backupId,
          "backupId"
        );
  
      const backupPath =
        this.getBackupPath(
          cleanBackupId
        );
  
      if (
        !await pathExists(
          backupPath
        )
      ) {
        return null;
      }
  
      return this.readBackupMetadata(
        cleanBackupId,
        backupPath
      );
    }
  
    async listBackups(): Promise<
      WonderStorageBackupMetadata[]
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
        WonderStorageBackupMetadata[] =
        [];
  
      for (
        const entry of
          entries
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
  
        const backupId =
          basename(
            entry.name,
            ".json"
          );
  
        const backupPath =
          join(
            backupDirectory,
            entry.name
          );
  
        try {
          backups.push(
            await this.readBackupMetadata(
              backupId,
              backupPath
            )
          );
        } catch {
          const information =
            await stat(
              backupPath
            );
  
          backups.push({
            id:
              backupId,
  
            backend:
              "file",
  
            status:
              "invalid",
  
            revision: 0,
  
            createdAt:
              new Date(
                information.mtimeMs
              ),
  
            restoredAt: null,
  
            deletedAt: null,
  
            checksum: null,
  
            sizeBytes:
              information.size,
  
            metadata: {
              filePath:
                backupPath,
            },
          });
        }
      }
  
      return backups.sort(
        (
          first,
          second
        ) =>
          second.createdAt
            .getTime() -
          first.createdAt
            .getTime()
      );
    }
  
    async pruneBackups(
      maximumBackups: number
    ): Promise<number> {
      const maximum =
        clampInteger(
          maximumBackups,
          0,
          MAXIMUM_BACKUPS
        );
  
      const backups =
        await this.listBackups();
  
      if (
        backups.length <=
        maximum
      ) {
        return 0;
      }
  
      const backupsToDelete =
        backups.slice(
          maximum
        );
  
      for (
        const backup of
          backupsToDelete
      ) {
        await rm(
          this.getBackupPath(
            backup.id
          ),
          {
            force: true,
          }
        );
      }
  
      return backupsToDelete.length;
    }
  
    // =========================================================
    // HEALTH
    // =========================================================
  
    async health(): Promise<
      WonderStorageHealthReport
    > {
      const startedAt =
        Date.now();
  
      const details:
        Record<string, unknown> = {
        filePath:
          this.options.filePath,
  
        backupDirectory:
          this.getBackupDirectory(),
      };
  
      try {
        await this.ensureParentDirectory();
  
        const exists =
          await this.exists();
  
        details.exists =
          exists;
  
        if (exists) {
          const document =
            await this.readDocument(
              this.options.filePath
            );
  
          this.assertDocumentChecksum(
            document
          );
  
          details.revision =
            document.metadata
              .revision;
  
          details.etag =
            document.metadata.etag;
  
          details.sizeBytes =
            document.metadata
              .sizeBytes;
        }
  
        return {
          healthy: true,
  
          status:
            "healthy",
  
          checkedAt:
            new Date(),
  
          backend:
            "file",
  
          latencyMilliseconds:
            Math.max(
              0,
              Date.now() -
                startedAt
            ),
  
          details,
        };
      } catch (error) {
        return {
          healthy: false,
  
          status:
            await pathExists(
              dirname(
                this.options.filePath
              )
            )
              ? "degraded"
              : "offline",
  
          checkedAt:
            new Date(),
  
          backend:
            "file",
  
          latencyMilliseconds:
            Math.max(
              0,
              Date.now() -
                startedAt
            ),
  
          details: {
            ...details,
  
            error:
              getErrorMessage(
                error
              ),
          },
        };
      }
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    async getStatistics(): Promise<
      WonderStorageStatistics
    > {
      const exists =
        await this.exists();
  
      let totalBytes =
        0;
  
      let currentRevision:
        number | null = null;
  
      if (exists) {
        const information =
          await stat(
            this.options.filePath
          );
  
        totalBytes =
          information.size;
  
        const revision =
          await this.getRevision();
  
        currentRevision =
          revision?.revision ??
          null;
      }
  
      const backups =
        await this.listBackups();
  
      return {
        backend:
          "file",
  
        exists,
  
        objectCount:
          exists
            ? 1
            : 0,
  
        totalBytes,
  
        currentRevision,
  
        backupCount:
          backups.length,
  
        activeLockCount: 0,
  
        activeTransactionCount: 0,
  
        lastSavedAt:
          cloneNullableDate(
            this.lastSavedAt
          ),
  
        lastLoadedAt:
          cloneNullableDate(
            this.lastLoadedAt
          ),
  
        lastBackupAt:
          cloneNullableDate(
            this.lastBackupAt
          ),
      };
    }
  
    // =========================================================
    // SNAPSHOT
    // =========================================================
  
    async getSnapshot(): Promise<
      WonderFilesystemAdapterSnapshot
    > {
      const backups =
        await this.listBackups();
  
      return {
        backend:
          "file",
  
        name:
          this.name,
  
        version:
          this.version,
  
        filePath:
          this.options.filePath,
  
        backupDirectory:
          this.getBackupDirectory(),
  
        exists:
          await this.exists(),
  
        revision:
          await this.getRevision(),
  
        backupCount:
          backups.length,
      };
    }
  
    // =========================================================
    // INTERNAL DOCUMENT OPERATIONS
    // =========================================================
  
    private async readDocument(
      filePath: string
    ): Promise<
      WonderFilesystemDocument<TValue>
    > {
      let content: string;
  
      try {
        content =
          await readFile(
            filePath,
            {
              encoding: "utf8",
            }
          );
      } catch (error) {
        throw new WonderStorageError(
          `WonderFilesystemAdapter: could not read "${filePath}".`,
          {
            code:
              "STORAGE_NOT_FOUND",
  
            cause:
              error,
  
            details: {
              filePath,
            },
          }
        );
      }
  
      let decoded: unknown;
  
      try {
        decoded =
          this.serializer
            .deserialize<unknown>(
              content
            ).value;
      } catch (error) {
        throw new WonderStorageError(
          `WonderFilesystemAdapter: "${filePath}" contains invalid storage data.`,
          {
            code:
              "STORAGE_VALIDATION_FAILED",
  
            cause:
              error,
  
            details: {
              filePath,
            },
          }
        );
      }
  
      return validateDocument<TValue>(
        decoded,
        filePath
      );
    }
  
    private async readDocumentIfExists(
      filePath: string
    ): Promise<
      WonderFilesystemDocument<TValue> | null
    > {
      if (
        !await pathExists(
          filePath
        )
      ) {
        return null;
      }
  
      return this.readDocument(
        filePath
      );
    }
  
    private assertDocumentChecksum(
      document:
        WonderFilesystemDocument<TValue>
    ): void {
      const serializedValue =
        this.serializer.serialize(
          document.value
        );
  
      const result =
        this.checksumService
          .verifyString(
            serializedValue.content,
            document.metadata
              .checksum,
            {
              algorithm:
                "sha256",
            }
          );
  
      if (!result.valid) {
        throw new WonderStorageError(
          "WonderFilesystemAdapter: stored checksum does not match the persisted value.",
          {
            code:
              "STORAGE_CHECKSUM_MISMATCH",
  
            retryable: false,
  
            details: {
              expectedChecksum:
                result.expectedChecksum,
  
              actualChecksum:
                result.actualChecksum,
  
              revision:
                document.metadata
                  .revision,
            },
          }
        );
      }
    }
  
    private validateRequestedRevision(
      document:
        WonderFilesystemDocument<TValue>,
      requestedRevision:
        number | undefined
    ): void {
      if (
        requestedRevision ===
        undefined
      ) {
        return;
      }
  
      if (
        document.metadata
          .revision !==
        requestedRevision
      ) {
        throw new WonderStorageError(
          `WonderFilesystemAdapter: revision "${requestedRevision}" was not found.`,
          {
            code:
              "STORAGE_NOT_FOUND",
  
            details: {
              requestedRevision,
  
              currentRevision:
                document.metadata
                  .revision,
            },
          }
        );
      }
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
        [
          this.options.filePath,
          process.pid,
          Date.now(),
          "tmp",
        ].join(".");
  
      try {
        await writeFile(
          temporaryPath,
          content,
          {
            encoding: "utf8",
          }
        );
  
        if (
          await pathExists(
            this.options.filePath
          )
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
  
        throw new WonderStorageError(
          `WonderFilesystemAdapter: failed to write "${this.options.filePath}".`,
          {
            code:
              "STORAGE_UNKNOWN_ERROR",
  
            retryable: true,
  
            cause:
              error,
  
            details: {
              filePath:
                this.options.filePath,
            },
          }
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
        throw new WonderStorageError(
          `WonderFilesystemAdapter: directory "${parentDirectory}" does not exist.`,
          {
            code:
              "STORAGE_NOT_FOUND",
  
            details: {
              parentDirectory,
            },
          }
        );
      }
    }
  
    // =========================================================
    // INTERNAL BACKUP OPERATIONS
    // =========================================================
  
    private getBackupPath(
      backupId: string
    ): string {
      return join(
        this.getBackupDirectory(),
        `${backupId}.json`
      );
    }
  
    private async createUniqueBackupId(): Promise<string> {
      const extension =
        extname(
          this.options.filePath
        );
  
      const fileName =
        basename(
          this.options.filePath,
          extension
        )
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          ) ||
        "wonder-storage";
  
      const timestamp =
        new Date()
          .toISOString()
          .replace(
            /[:.]/g,
            "-"
          );
  
      let backupId =
        `${fileName}-${timestamp}`;
  
      let collision =
        1;
  
      while (
        await pathExists(
          this.getBackupPath(
            backupId
          )
        )
      ) {
        backupId =
          `${fileName}-${timestamp}-${collision}`;
  
        collision += 1;
      }
  
      return backupId;
    }
  
    private async readBackupMetadata(
      backupId: string,
      backupPath: string
    ): Promise<
      WonderStorageBackupMetadata
    > {
      const document =
        await this.readDocument(
          backupPath
        );
  
      const information =
        await stat(
          backupPath
        );
  
      return {
        id:
          backupId,
  
        backend:
          "file",
  
        status:
          "available",
  
        revision:
          document.metadata
            .revision,
  
        createdAt:
          new Date(
            information.mtimeMs
          ),
  
        restoredAt: null,
  
        deletedAt: null,
  
        checksum:
          document.metadata
            .checksum,
  
        sizeBytes:
          information.size,
  
        metadata: {
          filePath:
            backupPath,
  
          adapterName:
            document.metadata
              .adapterName,
  
          adapterVersion:
            document.metadata
              .adapterVersion,
        },
      };
    }
  }
  
  // =========================================================
  // DOCUMENT VALIDATION
  // =========================================================
  
  function validateDocument<
    TValue
  >(
    value: unknown,
    filePath: string
  ): WonderFilesystemDocument<TValue> {
    if (
      !isRecord(value) ||
      value.format !==
        WONDER_FILESYSTEM_DOCUMENT_FORMAT ||
      value.documentVersion !==
        WONDER_FILESYSTEM_DOCUMENT_VERSION ||
      !isRecord(
        value.metadata
      )
    ) {
      throw invalidDocument(
        filePath
      );
    }
  
    const metadata =
      value.metadata;
  
    if (
      metadata.backend !==
        "file" ||
      typeof metadata.adapterName !==
        "string" ||
      typeof metadata.adapterVersion !==
        "string" ||
      !Number.isInteger(
        metadata.revision
      ) ||
      (
        metadata.revision as number
      ) < 1 ||
      typeof metadata.etag !==
        "string" ||
      typeof metadata.checksum !==
        "string" ||
      typeof metadata.sizeBytes !==
        "number" ||
      !isValidDate(
        metadata.createdAt
      ) ||
      !isValidDate(
        metadata.updatedAt
      ) ||
      !isRecord(
        metadata.custom
      ) ||
      !Object.prototype
        .hasOwnProperty.call(
          value,
          "value"
        )
    ) {
      throw invalidDocument(
        filePath
      );
    }
  
    return {
      format:
        WONDER_FILESYSTEM_DOCUMENT_FORMAT,
  
      documentVersion:
        WONDER_FILESYSTEM_DOCUMENT_VERSION,
  
      metadata: {
        backend:
          "file",
  
        adapterName:
          metadata.adapterName,
  
        adapterVersion:
          metadata.adapterVersion,
  
        revision:
          metadata.revision as number,
  
        etag:
          metadata.etag,
  
        checksum:
          metadata.checksum,
  
        sizeBytes:
          metadata.sizeBytes,
  
        createdAt:
          new Date(
            metadata.createdAt
              .getTime()
          ),
  
        updatedAt:
          new Date(
            metadata.updatedAt
              .getTime()
          ),
  
        custom: {
          ...metadata.custom,
        },
      },
  
      value:
        value.value as TValue,
    };
  }
  
  function invalidDocument(
    filePath: string
  ): WonderStorageError {
    return new WonderStorageError(
      `WonderFilesystemAdapter: "${filePath}" is not a valid Wonder storage document.`,
      {
        code:
          "STORAGE_VALIDATION_FAILED",
  
        retryable: false,
  
        details: {
          filePath,
        },
      }
    );
  }
  
  // =========================================================
  // REVISION HELPERS
  // =========================================================
  
  function documentToRevision<
    TValue
  >(
    document:
      WonderFilesystemDocument<TValue>
  ): WonderStorageRevision {
    return {
      revision:
        document.metadata
          .revision,
  
      etag:
        document.metadata
          .etag,
  
      updatedAt:
        new Date(
          document.metadata
            .updatedAt
            .getTime()
        ),
    };
  }
  
  function createEtag(
    revision: number,
    checksum: string
  ): string {
    return [
      "wonder",
      revision,
      checksum.slice(
        0,
        24
      ),
    ].join("-");
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  async function pathExists(
    filePath: string
  ): Promise<boolean> {
    try {
      await access(
        filePath
      );
  
      return true;
    } catch {
      return false;
    }
  }
  
  function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    if (
      typeof value !==
      "string"
    ) {
      throw new WonderStorageError(
        `WonderFilesystemAdapter: "${fieldName}" must be a string.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length ===
      0
    ) {
      throw new WonderStorageError(
        `WonderFilesystemAdapter: "${fieldName}" is required.`,
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
  
  export default WonderFilesystemAdapter;