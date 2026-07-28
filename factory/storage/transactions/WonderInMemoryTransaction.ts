import {
  WonderBaseStorageTransaction,
  WonderStorageError,
} from "../WonderStorageAdapter";

import type {
  WonderStorageTransactionCommitResult,
  WonderStorageTransactionOptions,
  WonderStorageTransactionRollbackResult,
  WonderStorageTransactionSnapshot,
  WonderStorageTransactionStatus,
} from "../WonderStorageAdapter";

// =========================================================
// TRANSACTION VALUE STATE
// =========================================================

export interface WonderTransactionValueState<
  TValue = unknown
> {
  exists: boolean;

  value: TValue | null;
}

// =========================================================
// STAGED OPERATIONS
// =========================================================

export type WonderTransactionOperationType =
  | "save"
  | "update"
  | "delete";

export interface WonderTransactionOperationMetadata {
  reason?: string;

  source?: string;

  values?: Readonly<
    Record<string, unknown>
  >;
}

export interface WonderTransactionOperationSnapshot {
  id: string;

  sequence: number;

  type: WonderTransactionOperationType;

  stagedAt: Date;

  metadata: {
    reason: string | null;

    source: string | null;

    values: Record<
      string,
      unknown
    >;
  };
}

interface WonderTransactionOperation<
  TValue
> {
  snapshot:
    WonderTransactionOperationSnapshot;

  stateAfterOperation:
    WonderTransactionValueState<TValue>;
}

// =========================================================
// CALLBACK CONTEXTS
// =========================================================

export interface WonderInMemoryTransactionCommitContext<
  TValue = unknown
> {
  transactionId: string;

  snapshot:
    WonderStorageTransactionSnapshot;

  startedRevision:
    number | null;

  initialState:
    WonderTransactionValueState<TValue>;

  finalState:
    WonderTransactionValueState<TValue>;

  operations:
    WonderTransactionOperationSnapshot[];

  metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface WonderInMemoryTransactionRollbackContext<
  TValue = unknown
> {
  transactionId: string;

  snapshot:
    WonderStorageTransactionSnapshot;

  reason: string | null;

  startedRevision:
    number | null;

  initialState:
    WonderTransactionValueState<TValue>;

  discardedState:
    WonderTransactionValueState<TValue>;

  discardedOperations:
    WonderTransactionOperationSnapshot[];

  metadata:
    Readonly<
      Record<string, unknown>
    >;
}

// =========================================================
// OPTIONS
// =========================================================

export interface WonderInMemoryTransactionOptions<
  TValue = unknown
> extends WonderStorageTransactionOptions {
  /**
   * Revision visible when the transaction begins.
   */
  startedRevision?: number | null;

  /**
   * Initial value visible to the transaction.
   */
  initialState?:
    WonderTransactionValueState<TValue>;

  /**
   * Custom cloning strategy.
   */
  cloneValue?: (
    value: TValue
  ) => TValue;

  /**
   * Atomically apply the final staged state.
   *
   * The returned number becomes the committed revision.
   */
  onCommit?: (
    context:
      WonderInMemoryTransactionCommitContext<TValue>
  ) =>
    | number
    | null
    | Promise<
        number | null
      >;

  /**
   * Invoked before rollback completes.
   */
  onRollback?: (
    context:
      WonderInMemoryTransactionRollbackContext<TValue>
  ) =>
    | void
    | Promise<void>;

  /**
   * Invoked after commit succeeds.
   */
  onCommitted?: (
    result:
      WonderStorageTransactionCommitResult
  ) =>
    | void
    | Promise<void>;

  /**
   * Invoked after rollback succeeds.
   */
  onRolledBack?: (
    result:
      WonderStorageTransactionRollbackResult
  ) =>
    | void
    | Promise<void>;
}

// =========================================================
// STATE SNAPSHOT
// =========================================================

export interface WonderInMemoryTransactionState<
  TValue = unknown
> {
  id: string;

  status:
    WonderStorageTransactionStatus;

  startedRevision:
    number | null;

  committedRevision:
    number | null;

  commitStartedAt:
    Date | null;

  rollbackStartedAt:
    Date | null;

  lastRollbackReason:
    string | null;

  operationInProgress:
    | "commit"
    | "rollback"
    | null;

  hasStagedChanges:
    boolean;

  stagedOperationCount:
    number;

  initialState:
    WonderTransactionValueState<TValue>;

  workingState:
    WonderTransactionValueState<TValue>;

  operations:
    WonderTransactionOperationSnapshot[];

  snapshot:
    WonderStorageTransactionSnapshot;
}

// =========================================================
// TRANSACTION
// =========================================================

/**
 * In-memory transactional staging engine.
 *
 * Supported behaviour:
 *
 * - stageSave()
 * - stageUpdate()
 * - stageDelete()
 * - read-your-own-writes
 * - clear staged changes
 * - atomic application through onCommit()
 * - full rollback
 * - lifecycle and timeout protection
 */
export class WonderInMemoryTransaction<
  TValue = unknown
> extends WonderBaseStorageTransaction {
  private readonly startedRevision:
    number | null;

  private committedRevision:
    number | null = null;

  private commitStartedAt:
    Date | null = null;

  private rollbackStartedAt:
    Date | null = null;

  private lastRollbackReason:
    string | null = null;

  private operationInProgress:
    | "commit"
    | "rollback"
    | null = null;

  private operationSequence =
    0;

  private readonly initialState:
    WonderTransactionValueState<TValue>;

  private workingState:
    WonderTransactionValueState<TValue>;

  private readonly operations:
    WonderTransactionOperation<TValue>[] =
    [];

  private readonly cloneValue:
    (
      value: TValue
    ) => TValue;

  private readonly onCommit:
    WonderInMemoryTransactionOptions<TValue>[
      "onCommit"
    ];

  private readonly onRollback:
    WonderInMemoryTransactionOptions<TValue>[
      "onRollback"
    ];

  private readonly onCommitted:
    WonderInMemoryTransactionOptions<TValue>[
      "onCommitted"
    ];

  private readonly onRolledBack:
    WonderInMemoryTransactionOptions<TValue>[
      "onRolledBack"
    ];

  constructor(
    options:
      WonderInMemoryTransactionOptions<TValue> = {}
  ) {
    super(options);

    this.startedRevision =
      normaliseNullableRevision(
        options.startedRevision
      );

    this.cloneValue =
      options.cloneValue ??
      defaultCloneValue;

    this.initialState =
      cloneValueState(
        options.initialState ?? {
          exists: false,

          value: null,
        },
        this.cloneValue
      );

    this.workingState =
      cloneValueState(
        this.initialState,
        this.cloneValue
      );

    this.onCommit =
      options.onCommit;

    this.onRollback =
      options.onRollback;

    this.onCommitted =
      options.onCommitted;

    this.onRolledBack =
      options.onRolledBack;
  }

  // =========================================================
  // ACCESS
  // =========================================================

  getStartedRevision():
    number | null {
    return this.startedRevision;
  }

  getCommittedRevision():
    number | null {
    return this.committedRevision;
  }

  getOperationInProgress():
    | "commit"
    | "rollback"
    | null {
    return this.operationInProgress;
  }

  hasStagedChanges(): boolean {
    return (
      this.operations.length >
      0
    );
  }

  getStagedOperationCount(): number {
    return this.operations.length;
  }

  getInitialState():
    WonderTransactionValueState<TValue> {
    return cloneValueState(
      this.initialState,
      this.cloneValue
    );
  }

  getWorkingState():
    WonderTransactionValueState<TValue> {
    return cloneValueState(
      this.workingState,
      this.cloneValue
    );
  }

  listOperations():
    WonderTransactionOperationSnapshot[] {
    return this.operations.map(
      (operation) =>
        cloneOperationSnapshot(
          operation.snapshot
        )
    );
  }

  getState():
    WonderInMemoryTransactionState<TValue> {
    return {
      id:
        this.id,

      status:
        this.getStatus(),

      startedRevision:
        this.startedRevision,

      committedRevision:
        this.committedRevision,

      commitStartedAt:
        cloneNullableDate(
          this.commitStartedAt
        ),

      rollbackStartedAt:
        cloneNullableDate(
          this.rollbackStartedAt
        ),

      lastRollbackReason:
        this.lastRollbackReason,

      operationInProgress:
        this.operationInProgress,

      hasStagedChanges:
        this.hasStagedChanges(),

      stagedOperationCount:
        this.operations.length,

      initialState:
        this.getInitialState(),

      workingState:
        this.getWorkingState(),

      operations:
        this.listOperations(),

      snapshot:
        this.getSnapshot(),
    };
  }

  // =========================================================
  // READ-YOUR-OWN-WRITES
  // =========================================================

  read():
    WonderTransactionValueState<TValue> {
    this.assertTransactionActive();

    return this.getWorkingState();
  }

  readValue(): TValue | null {
    const state =
      this.read();

    return state.exists
      ? state.value
      : null;
  }

  valueExists(): boolean {
    return this.read().exists;
  }

  // =========================================================
  // STAGE SAVE
  // =========================================================

  stageSave(
    value: TValue,
    metadata:
      WonderTransactionOperationMetadata = {}
  ): WonderTransactionOperationSnapshot {
    this.assertCanStage(
      "save"
    );

    const nextState:
      WonderTransactionValueState<TValue> = {
      exists: true,

      value:
        this.cloneValue(
          value
        ),
    };

    return this.stageOperation(
      "save",
      nextState,
      metadata
    );
  }

  // =========================================================
  // STAGE UPDATE
  // =========================================================

  stageUpdate(
    updater:
      (
        currentValue: TValue
      ) => TValue,
    metadata:
      WonderTransactionOperationMetadata = {}
  ): WonderTransactionOperationSnapshot {
    this.assertCanStage(
      "update"
    );

    if (
      typeof updater !==
      "function"
    ) {
      throw new WonderStorageError(
        "WonderStorage: transaction updater must be a function.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",

          retryable:
            false,

          details: {
            transactionId:
              this.id,
          },
        }
      );
    }

    if (
      !this.workingState
        .exists ||
      this.workingState
        .value === null
    ) {
      throw new WonderStorageError(
        `WonderStorage: transaction "${this.id}" cannot update a value that does not exist.`,
        {
          code:
            "STORAGE_NOT_FOUND",

          retryable:
            false,

          details: {
            transactionId:
              this.id,
          },
        }
      );
    }

    const currentValue =
      this.cloneValue(
        this.workingState
          .value
      );

    let updatedValue:
      TValue;

    try {
      updatedValue =
        updater(
          currentValue
        );
    } catch (error) {
      throw new WonderStorageError(
        `WonderStorage: transaction "${this.id}" update function failed.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",

          retryable:
            false,

          cause:
            error,

          details: {
            transactionId:
              this.id,

            cause:
              getErrorMessage(
                error
              ),
          },
        }
      );
    }

    const nextState:
      WonderTransactionValueState<TValue> = {
      exists: true,

      value:
        this.cloneValue(
          updatedValue
        ),
    };

    return this.stageOperation(
      "update",
      nextState,
      metadata
    );
  }

  // =========================================================
  // STAGE DELETE
  // =========================================================

  stageDelete(
    metadata:
      WonderTransactionOperationMetadata = {}
  ): WonderTransactionOperationSnapshot {
    this.assertCanStage(
      "delete"
    );

    const nextState:
      WonderTransactionValueState<TValue> = {
      exists: false,

      value: null,
    };

    return this.stageOperation(
      "delete",
      nextState,
      metadata
    );
  }

  // =========================================================
  // CLEAR STAGED OPERATIONS
  // =========================================================

  clearStagedOperations(): number {
    this.assertCanStage(
      "clear"
    );

    const removedCount =
      this.operations.length;

    this.operations.splice(
      0,
      this.operations.length
    );

    this.workingState =
      cloneValueState(
        this.initialState,
        this.cloneValue
      );

    return removedCount;
  }

  // =========================================================
  // COMMIT / ROLLBACK
  // =========================================================

  override async commit(): Promise<
    WonderStorageTransactionCommitResult
  > {
    this.assertNoOperationInProgress(
      "commit"
    );

    const result =
      await super.commit();

    try {
      await this.onCommitted?.(
        cloneCommitResult(
          result
        )
      );
    } catch (error) {
      throw new WonderStorageError(
        `WonderStorage: transaction "${this.id}" committed, but its completion callback failed.`,
        {
          code:
            "STORAGE_UNKNOWN_ERROR",

          retryable:
            false,

          cause:
            error,

          details: {
            transactionId:
              this.id,

            committedRevision:
              result.revision,
          },
        }
      );
    }

    return cloneCommitResult(
      result
    );
  }

  override async rollback(
    reason?: string
  ): Promise<
    WonderStorageTransactionRollbackResult
  > {
    this.assertNoOperationInProgress(
      "rollback"
    );

    const result =
      await super.rollback(
        reason
      );

    try {
      await this.onRolledBack?.(
        cloneRollbackResult(
          result
        )
      );
    } catch (error) {
      throw new WonderStorageError(
        `WonderStorage: transaction "${this.id}" rolled back, but its completion callback failed.`,
        {
          code:
            "STORAGE_UNKNOWN_ERROR",

          retryable:
            false,

          cause:
            error,

          details: {
            transactionId:
              this.id,

            rollbackReason:
              result.reason,
          },
        }
      );
    }

    return cloneRollbackResult(
      result
    );
  }

  // =========================================================
  // BASE COMMIT IMPLEMENTATION
  // =========================================================

  protected override async performCommit():
    Promise<number | null> {
    this.assertNoOperationInProgress(
      "commit"
    );

    this.operationInProgress =
      "commit";

    this.commitStartedAt =
      new Date();

    try {
      const context:
        WonderInMemoryTransactionCommitContext<TValue> = {
        transactionId:
          this.id,

        snapshot:
          this.getSnapshot(),

        startedRevision:
          this.startedRevision,

        initialState:
          this.getInitialState(),

        finalState:
          this.getWorkingState(),

        operations:
          this.listOperations(),

        metadata:
          cloneRecord(
            this.metadata
          ),
      };

      const revision =
        this.onCommit
          ? await this.onCommit(
              context
            )
          : this.startedRevision;

      this.committedRevision =
        normaliseNullableRevision(
          revision
        );

      return this.committedRevision;
    } catch (error) {
      throw toTransactionError(
        error,
        this.id,
        "commit"
      );
    } finally {
      this.operationInProgress =
        null;
    }
  }

  // =========================================================
  // BASE ROLLBACK IMPLEMENTATION
  // =========================================================

  protected override async performRollback(
    reason?: string
  ): Promise<void> {
    this.assertNoOperationInProgress(
      "rollback"
    );

    this.operationInProgress =
      "rollback";

    this.rollbackStartedAt =
      new Date();

    this.lastRollbackReason =
      normaliseOptionalText(
        reason
      );

    const discardedState =
      this.getWorkingState();

    const discardedOperations =
      this.listOperations();

    try {
      await this.onRollback?.({
        transactionId:
          this.id,

        snapshot:
          this.getSnapshot(),

        reason:
          this.lastRollbackReason,

        startedRevision:
          this.startedRevision,

        initialState:
          this.getInitialState(),

        discardedState,

        discardedOperations,

        metadata:
          cloneRecord(
            this.metadata
          ),
      });

      this.operations.splice(
        0,
        this.operations.length
      );

      this.workingState =
        cloneValueState(
          this.initialState,
          this.cloneValue
        );
    } catch (error) {
      throw toTransactionError(
        error,
        this.id,
        "rollback"
      );
    } finally {
      this.operationInProgress =
        null;
    }
  }

  // =========================================================
  // INTERNAL STAGING
  // =========================================================

  private stageOperation(
    type:
      WonderTransactionOperationType,
    nextState:
      WonderTransactionValueState<TValue>,
    metadata:
      WonderTransactionOperationMetadata
  ): WonderTransactionOperationSnapshot {
    this.operationSequence +=
      1;

    const snapshot:
      WonderTransactionOperationSnapshot = {
      id:
        createOperationId(
          this.id,
          this.operationSequence
        ),

      sequence:
        this.operationSequence,

      type,

      stagedAt:
        new Date(),

      metadata:
        normaliseOperationMetadata(
          metadata
        ),
    };

    this.workingState =
      cloneValueState(
        nextState,
        this.cloneValue
      );

    this.operations.push({
      snapshot:
        cloneOperationSnapshot(
          snapshot
        ),

      stateAfterOperation:
        cloneValueState(
          nextState,
          this.cloneValue
        ),
    });

    return cloneOperationSnapshot(
      snapshot
    );
  }

  // =========================================================
  // INTERNAL GUARDS
  // =========================================================

  private assertCanStage(
    requestedOperation:
      | WonderTransactionOperationType
      | "clear"
  ): void {
    this.assertTransactionActive();

    if (
      this.readOnly
    ) {
      throw new WonderStorageError(
        `WonderStorage: read-only transaction "${this.id}" cannot stage "${requestedOperation}".`,
        {
          code:
            "STORAGE_TRANSACTION_INACTIVE",

          retryable:
            false,

          details: {
            transactionId:
              this.id,

            requestedOperation,

            readOnly: true,
          },
        }
      );
    }

    this.assertNoOperationInProgress(
      requestedOperation
    );
  }

  private assertTransactionActive(): void {
    if (
      this.isActive()
    ) {
      return;
    }

    throw new WonderStorageError(
      `WonderStorage: transaction "${this.id}" is not active.`,
      {
        code:
          "STORAGE_TRANSACTION_INACTIVE",

        retryable:
          false,

        details: {
          transactionId:
            this.id,

          status:
            this.getStatus(),
        },
      }
    );
  }

  private assertNoOperationInProgress(
    requestedOperation:
      string
  ): void {
    if (
      this.operationInProgress ===
      null
    ) {
      return;
    }

    throw new WonderStorageError(
      `WonderStorage: transaction "${this.id}" is already performing "${this.operationInProgress}".`,
      {
        code:
          "STORAGE_TRANSACTION_INACTIVE",

        retryable:
          false,

        details: {
          transactionId:
            this.id,

          activeOperation:
            this.operationInProgress,

          requestedOperation,
        },
      }
    );
  }
}

// =========================================================
// FACTORY
// =========================================================

export function createWonderInMemoryTransaction<
  TValue = unknown
>(
  options:
    WonderInMemoryTransactionOptions<TValue> = {}
): WonderInMemoryTransaction<TValue> {
  return new WonderInMemoryTransaction<TValue>(
    options
  );
}

// =========================================================
// TYPE GUARD
// =========================================================

export function isWonderInMemoryTransaction(
  value: unknown
): value is WonderInMemoryTransaction<unknown> {
  return (
    value instanceof
    WonderInMemoryTransaction
  );
}

// =========================================================
// OPERATION CLONING
// =========================================================

export function cloneOperationSnapshot(
  operation:
    WonderTransactionOperationSnapshot
): WonderTransactionOperationSnapshot {
  return {
    id:
      operation.id,

    sequence:
      operation.sequence,

    type:
      operation.type,

    stagedAt:
      new Date(
        operation.stagedAt
          .getTime()
      ),

    metadata: {
      reason:
        operation.metadata
          .reason,

      source:
        operation.metadata
          .source,

      values: {
        ...operation.metadata
          .values,
      },
    },
  };
}

// =========================================================
// RESULT CLONING
// =========================================================

function cloneCommitResult(
  result:
    WonderStorageTransactionCommitResult
): WonderStorageTransactionCommitResult {
  return {
    success:
      result.success,

    transactionId:
      result.transactionId,

    committedAt:
      new Date(
        result.committedAt
          .getTime()
      ),

    revision:
      result.revision,
  };
}

function cloneRollbackResult(
  result:
    WonderStorageTransactionRollbackResult
): WonderStorageTransactionRollbackResult {
  return {
    success:
      result.success,

    transactionId:
      result.transactionId,

    rolledBackAt:
      new Date(
        result.rolledBackAt
          .getTime()
      ),

    reason:
      result.reason,
  };
}

// =========================================================
// VALUE STATE CLONING
// =========================================================

function cloneValueState<
  TValue
>(
  state:
    WonderTransactionValueState<TValue>,
  cloneValue:
    (
      value: TValue
    ) => TValue
): WonderTransactionValueState<TValue> {
  if (
    !state.exists ||
    state.value ===
      null
  ) {
    return {
      exists: false,

      value: null,
    };
  }

  return {
    exists: true,

    value:
      cloneValue(
        state.value
      ),
  };
}

function defaultCloneValue<
  TValue
>(
  value: TValue
): TValue {
  return cloneUnknownValue(
    value
  ) as TValue;
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
    typeof value ===
      "object"
  ) {
    const cloned:
      Record<
        string,
        unknown
      > = {};

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
// NORMALISATION
// =========================================================

function normaliseOperationMetadata(
  metadata:
    WonderTransactionOperationMetadata
): WonderTransactionOperationSnapshot[
  "metadata"
] {
  return {
    reason:
      normaliseOptionalText(
        metadata.reason
      ),

    source:
      normaliseOptionalText(
        metadata.source
      ),

    values: {
      ...(metadata.values ??
        {}),
    },
  };
}

function normaliseNullableRevision(
  value:
    number | null | undefined
): number | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new WonderStorageError(
      "WonderStorage: transaction revision must be a non-negative integer.",
      {
        code:
          "STORAGE_VALIDATION_FAILED",

        retryable:
          false,

        details: {
          revision:
            value,
        },
      }
    );
  }

  return value;
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

// =========================================================
// IDS
// =========================================================

function createOperationId(
  transactionId: string,
  sequence: number
): string {
  return [
    transactionId,
    "operation",
    String(
      sequence
    ).padStart(
      4,
      "0"
    ),
  ].join("-");
}

// =========================================================
// GENERAL CLONING
// =========================================================

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

function cloneRecord(
  value:
    Readonly<
      Record<string, unknown>
    >
): Record<string, unknown> {
  return {
    ...value,
  };
}

// =========================================================
// ERRORS
// =========================================================

function toTransactionError(
  error: unknown,
  transactionId: string,
  operation:
    | "commit"
    | "rollback"
): WonderStorageError {
  if (
    error instanceof
    WonderStorageError
  ) {
    return error;
  }

  return new WonderStorageError(
    `WonderStorage: transaction "${transactionId}" failed during ${operation}.`,
    {
      code:
        "STORAGE_UNKNOWN_ERROR",

      retryable:
        false,

      cause:
        error,

      details: {
        transactionId,

        operation,

        cause:
          getErrorMessage(
            error
          ),
      },
    }
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

export default WonderInMemoryTransaction;