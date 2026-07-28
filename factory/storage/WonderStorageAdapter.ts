/* ============================================================
 * Wonder Storage Adapter
 *
 * Foundation A
 * - Core persistence contract
 * - Health, metadata and statistics
 *
 * Foundation B
 * - Transactions
 * - Optimistic concurrency
 * - Distributed locking
 * - Backup contracts
 * ============================================================ */

// =========================================================
// CORE TYPES
// =========================================================

export type WonderStorageBackend =
  | "memory"
  | "file"
  | "sqlite"
  | "postgres"
  | "mysql"
  | "supabase"
  | "cloud"
  | "custom";

export type WonderStorageHealth =
  | "healthy"
  | "degraded"
  | "offline";

export type WonderStorageIsolationLevel =
  | "read-uncommitted"
  | "read-committed"
  | "repeatable-read"
  | "serializable";

export type WonderStorageTransactionStatus =
  | "active"
  | "committed"
  | "rolled-back"
  | "failed";

export type WonderStorageLockStatus =
  | "active"
  | "released"
  | "expired";

export type WonderStorageBackupStatus =
  | "available"
  | "restored"
  | "deleted"
  | "invalid";

// =========================================================
// METADATA
// =========================================================

export interface WonderStorageMetadata {
  backend: WonderStorageBackend;

  version: string;

  revision: number;

  createdAt: Date;

  updatedAt: Date;

  checksum?: string;

  etag?: string;

  sizeBytes?: number;

  custom?: Record<
    string,
    unknown
  >;
}

// =========================================================
// SAVE / LOAD / DELETE
// =========================================================

export interface WonderStorageSaveOptions {
  createBackup?: boolean;

  overwrite?: boolean;

  /**
   * Reject the save unless the stored revision matches.
   */
  expectedRevision?: number;

  /**
   * Reject the save unless the current ETag matches.
   */
  expectedEtag?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface WonderStorageLoadOptions {
  allowBackupFallback?: boolean;

  validateChecksum?: boolean;

  revision?: number;
}

export interface WonderStorageDeleteOptions {
  createBackup?: boolean;

  expectedRevision?: number;

  expectedEtag?: string;
}

export interface WonderStorageSaveResult {
  success: boolean;

  savedAt: Date;

  metadata: WonderStorageMetadata;

  backupCreated: boolean;

  backupId: string | null;
}

export interface WonderStorageLoadResult<TValue> {
  success: boolean;

  loadedAt: Date;

  restoredFromBackup: boolean;

  backupId: string | null;

  metadata: WonderStorageMetadata;

  value: TValue;
}

export interface WonderStorageDeleteResult {
  success: boolean;

  deletedAt: Date;

  previousRevision: number | null;

  backupCreated: boolean;

  backupId: string | null;
}

// =========================================================
// HEALTH AND STATISTICS
// =========================================================

export interface WonderStorageHealthReport {
  healthy: boolean;

  status: WonderStorageHealth;

  checkedAt: Date;

  backend: WonderStorageBackend;

  latencyMilliseconds: number;

  details: Record<
    string,
    unknown
  >;
}

export interface WonderStorageStatistics {
  backend: WonderStorageBackend;

  exists: boolean;

  objectCount: number;

  totalBytes: number;

  currentRevision: number | null;

  backupCount: number;

  activeLockCount: number;

  activeTransactionCount: number;

  lastSavedAt: Date | null;

  lastLoadedAt: Date | null;

  lastBackupAt: Date | null;
}

// =========================================================
// TRANSACTIONS
// =========================================================

export interface WonderStorageTransactionOptions {
  isolationLevel?: WonderStorageIsolationLevel;

  timeoutMilliseconds?: number;

  readOnly?: boolean;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface WonderStorageTransactionSnapshot {
  id: string;

  status: WonderStorageTransactionStatus;

  isolationLevel: WonderStorageIsolationLevel;

  readOnly: boolean;

  startedAt: Date;

  completedAt: Date | null;

  timeoutAt: Date | null;

  metadata: Record<
    string,
    unknown
  >;
}

export interface WonderStorageTransactionCommitResult {
  success: boolean;

  transactionId: string;

  committedAt: Date;

  revision: number | null;
}

export interface WonderStorageTransactionRollbackResult {
  success: boolean;

  transactionId: string;

  rolledBackAt: Date;

  reason: string | null;
}

export interface WonderStorageTransaction {
  readonly id: string;

  getStatus(): WonderStorageTransactionStatus;

  getSnapshot(): WonderStorageTransactionSnapshot;

  isActive(): boolean;

  commit(): Promise<
    WonderStorageTransactionCommitResult
  >;

  rollback(
    reason?: string
  ): Promise<
    WonderStorageTransactionRollbackResult
  >;
}

export interface WonderStorageTransactionalAdapter {
  beginTransaction(
    options?: WonderStorageTransactionOptions
  ): Promise<
    WonderStorageTransaction
  >;
}

// =========================================================
// OPTIMISTIC CONCURRENCY
// =========================================================

export interface WonderStorageRevision {
  revision: number;

  etag: string | null;

  updatedAt: Date;
}

export interface WonderStorageRevisionCheck {
  expectedRevision?: number;

  expectedEtag?: string;
}

export interface WonderStorageRevisionCheckResult {
  matched: boolean;

  current: WonderStorageRevision | null;

  expectedRevision: number | null;

  expectedEtag: string | null;
}

export interface WonderStorageVersionedAdapter {
  getRevision(): Promise<
    WonderStorageRevision | null
  >;

  checkRevision(
    check: WonderStorageRevisionCheck
  ): Promise<
    WonderStorageRevisionCheckResult
  >;
}

// =========================================================
// DISTRIBUTED LOCKING
// =========================================================

export interface WonderStorageLockOptions {
  ownerId: string;

  durationMilliseconds?: number;

  waitTimeoutMilliseconds?: number;

  retryIntervalMilliseconds?: number;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface WonderStorageLockSnapshot {
  key: string;

  token: string;

  ownerId: string;

  status: WonderStorageLockStatus;

  acquiredAt: Date;

  expiresAt: Date;

  releasedAt: Date | null;

  metadata: Record<
    string,
    unknown
  >;
}

export interface WonderStorageLockRenewResult {
  success: boolean;

  lock: WonderStorageLockSnapshot;
}

export interface WonderStorageLockReleaseResult {
  success: boolean;

  lockKey: string;

  releasedAt: Date;
}

export interface WonderStorageLock {
  readonly key: string;

  readonly token: string;

  readonly ownerId: string;

  getStatus(): WonderStorageLockStatus;

  getSnapshot(): WonderStorageLockSnapshot;

  isActive(
    at?: Date
  ): boolean;

  renew(
    durationMilliseconds?: number
  ): Promise<
    WonderStorageLockRenewResult
  >;

  release(): Promise<
    WonderStorageLockReleaseResult
  >;
}

export interface WonderStorageLockAdapter {
  acquireLock(
    key: string,
    options: WonderStorageLockOptions
  ): Promise<
    WonderStorageLock
  >;

  getLock(
    key: string
  ): Promise<
    WonderStorageLockSnapshot | null
  >;

  releaseLock(
    key: string,
    token?: string
  ): Promise<
    WonderStorageLockReleaseResult
  >;

  listLocks(): Promise<
    WonderStorageLockSnapshot[]
  >;

  clearExpiredLocks(
    at?: Date
  ): Promise<number>;
}

// =========================================================
// BACKUPS
// =========================================================

export interface WonderStorageBackupMetadata {
  id: string;

  backend: WonderStorageBackend;

  status: WonderStorageBackupStatus;

  revision: number;

  createdAt: Date;

  restoredAt: Date | null;

  deletedAt: Date | null;

  checksum: string | null;

  sizeBytes: number | null;

  metadata: Record<
    string,
    unknown
  >;
}

export interface WonderStorageBackupCreateOptions {
  label?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface WonderStorageBackupCreateResult {
  success: boolean;

  backup: WonderStorageBackupMetadata;
}

export interface WonderStorageBackupRestoreOptions {
  overwrite?: boolean;

  validateChecksum?: boolean;
}

export interface WonderStorageBackupRestoreResult {
  success: boolean;

  backupId: string;

  restoredAt: Date;

  restoredRevision: number;
}

export interface WonderStorageBackupDeleteResult {
  success: boolean;

  backupId: string;

  deletedAt: Date;
}

export interface WonderStorageBackupAdapter {
  createBackup(
    options?: WonderStorageBackupCreateOptions
  ): Promise<
    WonderStorageBackupCreateResult
  >;

  restoreBackup(
    backupId: string,
    options?: WonderStorageBackupRestoreOptions
  ): Promise<
    WonderStorageBackupRestoreResult
  >;

  deleteBackup(
    backupId: string
  ): Promise<
    WonderStorageBackupDeleteResult
  >;

  getBackup(
    backupId: string
  ): Promise<
    WonderStorageBackupMetadata | null
  >;

  listBackups(): Promise<
    WonderStorageBackupMetadata[]
  >;

  pruneBackups(
    maximumBackups: number
  ): Promise<number>;
}

// =========================================================
// PRIMARY ADAPTER CONTRACT
// =========================================================

export interface WonderStorageAdapter<
  TValue
> {
  readonly backend: WonderStorageBackend;

  readonly name: string;

  readonly version: string;

  save(
    value: TValue,
    options?: WonderStorageSaveOptions
  ): Promise<
    WonderStorageSaveResult
  >;

  load(
    options?: WonderStorageLoadOptions
  ): Promise<
    WonderStorageLoadResult<TValue>
  >;

  exists(): Promise<boolean>;

  delete(
    options?: WonderStorageDeleteOptions
  ): Promise<
    WonderStorageDeleteResult
  >;

  health(): Promise<
    WonderStorageHealthReport
  >;

  getStatistics(): Promise<
    WonderStorageStatistics
  >;
}

export type WonderProductionStorageAdapter<
  TValue
> =
  WonderStorageAdapter<TValue> &
  WonderStorageTransactionalAdapter &
  WonderStorageVersionedAdapter &
  WonderStorageLockAdapter &
  WonderStorageBackupAdapter;

// =========================================================
// ERROR TYPES
// =========================================================

export type WonderStorageErrorCode =
  | "STORAGE_NOT_FOUND"
  | "STORAGE_ALREADY_EXISTS"
  | "STORAGE_CONFLICT"
  | "STORAGE_REVISION_MISMATCH"
  | "STORAGE_ETAG_MISMATCH"
  | "STORAGE_TRANSACTION_INACTIVE"
  | "STORAGE_TRANSACTION_TIMEOUT"
  | "STORAGE_LOCKED"
  | "STORAGE_LOCK_NOT_FOUND"
  | "STORAGE_LOCK_TOKEN_MISMATCH"
  | "STORAGE_LOCK_EXPIRED"
  | "STORAGE_BACKUP_NOT_FOUND"
  | "STORAGE_CHECKSUM_MISMATCH"
  | "STORAGE_BACKEND_OFFLINE"
  | "STORAGE_VALIDATION_FAILED"
  | "STORAGE_UNKNOWN_ERROR";

export class WonderStorageError
  extends Error {
  readonly code:
    WonderStorageErrorCode;

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
      code?: WonderStorageErrorCode;

      retryable?: boolean;

      details?: Record<
        string,
        unknown
      >;

      cause?: unknown;
    } = {}
  ) {
    super(
      normaliseRequiredText(
        message,
        "message"
      ),
      {
        cause:
          options.cause,
      }
    );

    this.name =
      "WonderStorageError";

    this.code =
      options.code ??
      "STORAGE_UNKNOWN_ERROR";

    this.retryable =
      options.retryable ??
      false;

    this.details = {
      ...(options.details ??
        {}),
    };
  }
}

// =========================================================
// BASE ADAPTER
// =========================================================

export abstract class WonderBaseStorageAdapter<
  TValue
> implements WonderStorageAdapter<TValue> {
  abstract readonly backend:
    WonderStorageBackend;

  abstract readonly name:
    string;

  abstract readonly version:
    string;

  abstract save(
    value: TValue,
    options?: WonderStorageSaveOptions
  ): Promise<
    WonderStorageSaveResult
  >;

  abstract load(
    options?: WonderStorageLoadOptions
  ): Promise<
    WonderStorageLoadResult<TValue>
  >;

  abstract exists():
    Promise<boolean>;

  abstract delete(
    options?: WonderStorageDeleteOptions
  ): Promise<
    WonderStorageDeleteResult
  >;

  abstract health():
    Promise<
      WonderStorageHealthReport
    >;

  abstract getStatistics():
    Promise<
      WonderStorageStatistics
    >;

  protected createMetadata(
    input: {
      revision: number;

      createdAt?: Date;

      updatedAt?: Date;

      checksum?: string;

      etag?: string;

      sizeBytes?: number;

      custom?: Record<
        string,
        unknown
      >;
    }
  ): WonderStorageMetadata {
    const now =
      new Date();

    return {
      backend:
        this.backend,

      version:
        this.version,

      revision:
        Math.max(
          0,
          Math.floor(
            input.revision
          )
        ),

      createdAt:
        cloneDate(
          input.createdAt ??
          now
        ),

      updatedAt:
        cloneDate(
          input.updatedAt ??
          now
        ),

      checksum:
        normaliseOptionalText(
          input.checksum
        ) ??
        undefined,

      etag:
        normaliseOptionalText(
          input.etag
        ) ??
        undefined,

      sizeBytes:
        input.sizeBytes ===
        undefined
          ? undefined
          : Math.max(
              0,
              Math.floor(
                input.sizeBytes
              )
            ),

      custom: {
        ...(input.custom ??
          {}),
      },
    };
  }

  protected assertRevisionMatch(
    current:
      WonderStorageRevision | null,
    check:
      WonderStorageRevisionCheck
  ): void {
    if (
      check.expectedRevision !==
        undefined &&
      current?.revision !==
        check.expectedRevision
    ) {
      throw new WonderStorageError(
        "WonderStorage: revision does not match the expected revision.",
        {
          code:
            "STORAGE_REVISION_MISMATCH",

          retryable:
            true,

          details: {
            expectedRevision:
              check.expectedRevision,

            currentRevision:
              current?.revision ??
              null,
          },
        }
      );
    }

    if (
      check.expectedEtag !==
        undefined &&
      current?.etag !==
        check.expectedEtag
    ) {
      throw new WonderStorageError(
        "WonderStorage: ETag does not match the expected ETag.",
        {
          code:
            "STORAGE_ETAG_MISMATCH",

          retryable:
            true,

          details: {
            expectedEtag:
              check.expectedEtag,

            currentEtag:
              current?.etag ??
              null,
          },
        }
      );
    }
  }
}

// =========================================================
// ABSTRACT TRANSACTION BASE
// =========================================================

export abstract class WonderBaseStorageTransaction
  implements WonderStorageTransaction {
  readonly id: string;

  protected status:
    WonderStorageTransactionStatus =
    "active";

  protected readonly isolationLevel:
    WonderStorageIsolationLevel;

  protected readonly readOnly:
    boolean;

  protected readonly startedAt:
    Date;

  protected completedAt:
    Date | null = null;

  protected readonly timeoutAt:
    Date | null;

  protected readonly metadata:
    Record<
      string,
      unknown
    >;

  constructor(
    options:
      WonderStorageTransactionOptions = {}
  ) {
    const now =
      new Date();

    this.id =
      createStorageIdentifier(
        "transaction"
      );

    this.isolationLevel =
      options.isolationLevel ??
      "read-committed";

    this.readOnly =
      options.readOnly ??
      false;

    this.startedAt =
      cloneDate(now);

    this.timeoutAt =
      options.timeoutMilliseconds ===
      undefined
        ? null
        : new Date(
            now.getTime() +
            Math.max(
              1,
              Math.floor(
                options
                  .timeoutMilliseconds
              )
            )
          );

    this.metadata = {
      ...(options.metadata ??
        {}),
    };
  }

  getStatus(): WonderStorageTransactionStatus {
    return this.status;
  }

  isActive(): boolean {
    if (
      this.status !==
      "active"
    ) {
      return false;
    }

    if (
      this.timeoutAt &&
      this.timeoutAt.getTime() <=
        Date.now()
    ) {
      this.status =
        "failed";

      this.completedAt =
        new Date();

      return false;
    }

    return true;
  }

  getSnapshot(): WonderStorageTransactionSnapshot {
    return {
      id:
        this.id,

      status:
        this.status,

      isolationLevel:
        this.isolationLevel,

      readOnly:
        this.readOnly,

      startedAt:
        cloneDate(
          this.startedAt
        ),

      completedAt:
        cloneNullableDate(
          this.completedAt
        ),

      timeoutAt:
        cloneNullableDate(
          this.timeoutAt
        ),

      metadata: {
        ...this.metadata,
      },
    };
  }

  async commit(): Promise<
    WonderStorageTransactionCommitResult
  > {
    this.assertActive();

    try {
      const revision =
        await this.performCommit();

      const committedAt =
        new Date();

      this.status =
        "committed";

      this.completedAt =
        cloneDate(
          committedAt
        );

      return {
        success: true,

        transactionId:
          this.id,

        committedAt,

        revision,
      };
    } catch (error) {
      this.status =
        "failed";

      this.completedAt =
        new Date();

      throw error;
    }
  }

  async rollback(
    reason?: string
  ): Promise<
    WonderStorageTransactionRollbackResult
  > {
    this.assertActive();

    try {
      await this.performRollback(
        reason
      );

      const rolledBackAt =
        new Date();

      this.status =
        "rolled-back";

      this.completedAt =
        cloneDate(
          rolledBackAt
        );

      return {
        success: true,

        transactionId:
          this.id,

        rolledBackAt,

        reason:
          normaliseOptionalText(
            reason
          ),
      };
    } catch (error) {
      this.status =
        "failed";

      this.completedAt =
        new Date();

      throw error;
    }
  }

  protected abstract performCommit():
    Promise<number | null>;

  protected abstract performRollback(
    reason?: string
  ): Promise<void>;

  protected assertActive(): void {
    if (
      !this.isActive()
    ) {
      throw new WonderStorageError(
        `WonderStorage: transaction "${this.id}" is not active.`,
        {
          code:
            this.timeoutAt &&
            this.timeoutAt.getTime() <=
              Date.now()
              ? "STORAGE_TRANSACTION_TIMEOUT"
              : "STORAGE_TRANSACTION_INACTIVE",

          retryable:
            false,

          details: {
            transactionId:
              this.id,

            status:
              this.status,
          },
        }
      );
    }
  }
}

// =========================================================
// TYPE GUARDS
// =========================================================

export function isWonderStorageBackend(
  value: unknown
): value is WonderStorageBackend {
  return (
    value === "memory" ||
    value === "file" ||
    value === "sqlite" ||
    value === "postgres" ||
    value === "mysql" ||
    value === "supabase" ||
    value === "cloud" ||
    value === "custom"
  );
}

export function isWonderStorageHealth(
  value: unknown
): value is WonderStorageHealth {
  return (
    value === "healthy" ||
    value === "degraded" ||
    value === "offline"
  );
}

export function isWonderStorageIsolationLevel(
  value: unknown
): value is WonderStorageIsolationLevel {
  return (
    value ===
      "read-uncommitted" ||
    value ===
      "read-committed" ||
    value ===
      "repeatable-read" ||
    value ===
      "serializable"
  );
}

export function isWonderStorageTransactionStatus(
  value: unknown
): value is WonderStorageTransactionStatus {
  return (
    value === "active" ||
    value === "committed" ||
    value ===
      "rolled-back" ||
    value === "failed"
  );
}

export function isWonderStorageLockStatus(
  value: unknown
): value is WonderStorageLockStatus {
  return (
    value === "active" ||
    value === "released" ||
    value === "expired"
  );
}

export function isWonderStorageBackupStatus(
  value: unknown
): value is WonderStorageBackupStatus {
  return (
    value === "available" ||
    value === "restored" ||
    value === "deleted" ||
    value === "invalid"
  );
}

export function isWonderStorageError(
  value: unknown
): value is WonderStorageError {
  return (
    value instanceof
    WonderStorageError
  );
}

// =========================================================
// HELPERS
// =========================================================

export function createStorageIdentifier(
  prefix: string
): string {
  const cleanPrefix =
    normaliseRequiredText(
      prefix,
      "prefix"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  const timestamp =
    Date.now()
      .toString(36);

  const random =
    Math.random()
      .toString(36)
      .slice(
        2,
        10
      );

  return [
    cleanPrefix,
    timestamp,
    random,
  ].join("-");
}

export function cloneStorageMetadata(
  metadata:
    WonderStorageMetadata
): WonderStorageMetadata {
  return {
    ...metadata,

    createdAt:
      cloneDate(
        metadata.createdAt
      ),

    updatedAt:
      cloneDate(
        metadata.updatedAt
      ),

    custom: {
      ...(metadata.custom ??
        {}),
    },
  };
}

export function cloneStorageRevision(
  revision:
    WonderStorageRevision
): WonderStorageRevision {
  return {
    revision:
      revision.revision,

    etag:
      revision.etag,

    updatedAt:
      cloneDate(
        revision.updatedAt
      ),
  };
}

export function cloneStorageLockSnapshot(
  lock:
    WonderStorageLockSnapshot
): WonderStorageLockSnapshot {
  return {
    ...lock,

    acquiredAt:
      cloneDate(
        lock.acquiredAt
      ),

    expiresAt:
      cloneDate(
        lock.expiresAt
      ),

    releasedAt:
      cloneNullableDate(
        lock.releasedAt
      ),

    metadata: {
      ...lock.metadata,
    },
  };
}

export function cloneStorageBackupMetadata(
  backup:
    WonderStorageBackupMetadata
): WonderStorageBackupMetadata {
  return {
    ...backup,

    createdAt:
      cloneDate(
        backup.createdAt
      ),

    restoredAt:
      cloneNullableDate(
        backup.restoredAt
      ),

    deletedAt:
      cloneNullableDate(
        backup.deletedAt
      ),

    metadata: {
      ...backup.metadata,
    },
  };
}

function normaliseRequiredText(
  value: string,
  fieldName: string
): string {
  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      `WonderStorage: "${fieldName}" must be a string.`
    );
  }

  const cleaned =
    value.trim();

  if (
    cleaned.length === 0
  ) {
    throw new Error(
      `WonderStorage: "${fieldName}" is required.`
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

  return cleaned.length >
    0
    ? cleaned
    : null;
}

function cloneDate(
  value: Date
): Date {
  return new Date(
    value.getTime()
  );
}

function cloneNullableDate(
  value:
    Date | null
): Date | null {
  return value
    ? cloneDate(value)
    : null;
}