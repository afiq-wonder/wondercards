import {
    WonderStorageError,
  } from "../WonderStorageAdapter";
  
  import type {
    WonderStorageTransactionCommitResult,
    WonderStorageTransactionRollbackResult,
    WonderStorageTransactionStatus,
  } from "../WonderStorageAdapter";
  
  import {
    WonderInMemoryTransaction,
  } from "./WonderInMemoryTransaction";
  
  import type {
    WonderInMemoryTransactionOptions,
    WonderInMemoryTransactionState,
  } from "./WonderInMemoryTransaction";
  
  // =========================================================
  // TYPES
  // =========================================================
  
  export type WonderManagedTransactionStatus =
    WonderStorageTransactionStatus;
  
  export interface WonderTransactionManagerOptions {
    /**
     * Maximum number of transactions retained in memory.
     */
    maximumTransactions?: number;
  
    /**
     * Remove completed transactions automatically.
     */
    removeTerminalTransactions?: boolean;
  
    /**
     * Automatically roll back child transactions when a
     * parent transaction rolls back.
     */
    cascadeRollback?: boolean;
  
    /**
     * Automatically roll back active transactions during clear.
     */
    rollbackActiveTransactionsOnClear?: boolean;
  
    /**
     * Interval used by automatic timeout cleanup.
     */
    cleanupIntervalMilliseconds?: number;
  
    /**
     * Begin automatic timeout cleanup immediately.
     */
    automaticCleanup?: boolean;
  }
  
  export interface WonderManagedTransactionOptions<
    TValue = unknown
  > extends WonderInMemoryTransactionOptions<TValue> {
    /**
     * Optional parent transaction.
     */
    parentTransactionId?: string | null;
  
    /**
     * Human-readable transaction label.
     */
    label?: string;
  
    /**
     * Extra manager-level metadata.
     */
    managerMetadata?: Readonly<
      Record<string, unknown>
    >;
  }
  
  export interface WonderManagedTransactionSnapshot<
    TValue = unknown
  > {
    id: string;
  
    label: string;
  
    parentTransactionId: string | null;
  
    childTransactionIds: string[];
  
    createdAt: Date;
  
    updatedAt: Date;
  
    managerMetadata: Record<
      string,
      unknown
    >;
  
    transaction:
      WonderInMemoryTransactionState<TValue>;
  }
  
  export interface WonderTransactionManagerStatistics {
    totalTransactions: number;
  
    activeTransactions: number;
  
    committedTransactions: number;
  
    rolledBackTransactions: number;
  
    failedTransactions: number;
  
    rootTransactions: number;
  
    childTransactions: number;
  
    maximumDepth: number;
  
    cleanupRunning: boolean;
  
    createdTransactionCount: number;
  
    committedTransactionCount: number;
  
    rolledBackTransactionCount: number;
  
    failedTransactionCount: number;
  
    removedTransactionCount: number;
  
    lastCleanupAt: Date | null;
  }
  
  export interface WonderTransactionManagerCommitResult {
    success: boolean;
  
    transactionId: string;
  
    committedTransactions: string[];
  
    result:
      WonderStorageTransactionCommitResult;
  }
  
  export interface WonderTransactionManagerRollbackResult {
    success: boolean;
  
    transactionId: string;
  
    rolledBackTransactions: string[];
  
    result:
      WonderStorageTransactionRollbackResult;
  }
  
  export interface WonderTransactionCleanupResult {
    checkedAt: Date;
  
    checkedTransactions: number;
  
    rolledBackTransactions: number;
  
    removedTransactions: number;
  
    errors: string[];
  }
  
  interface ManagedTransactionRecord {
    transaction:
      WonderInMemoryTransaction<unknown>;
  
    label: string;
  
    parentTransactionId:
      string | null;
  
    childTransactionIds:
      Set<string>;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    managerMetadata:
      Record<string, unknown>;
  }
  
  interface ResolvedWonderTransactionManagerOptions {
    maximumTransactions: number;
  
    removeTerminalTransactions: boolean;
  
    cascadeRollback: boolean;
  
    rollbackActiveTransactionsOnClear: boolean;
  
    cleanupIntervalMilliseconds: number;
  
    automaticCleanup: boolean;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const DEFAULT_MAXIMUM_TRANSACTIONS =
    10_000;
  
  const MINIMUM_MAXIMUM_TRANSACTIONS =
    1;
  
  const MAXIMUM_MAXIMUM_TRANSACTIONS =
    1_000_000;
  
  const DEFAULT_CLEANUP_INTERVAL_MILLISECONDS =
    5_000;
  
  const MINIMUM_CLEANUP_INTERVAL_MILLISECONDS =
    100;
  
  // =========================================================
  // MANAGER
  // =========================================================
  
  /**
   * Coordinates WonderInMemoryTransaction instances.
   *
   * Responsibilities:
   *
   * - transaction registry
   * - parent and child relationships
   * - nested transaction ordering
   * - commit ordering
   * - rollback cascading
   * - timeout cleanup
   * - terminal transaction pruning
   * - transaction statistics
   */
  export class WonderTransactionManager {
    private readonly options:
      ResolvedWonderTransactionManagerOptions;
  
    private readonly transactions =
      new Map<
        string,
        ManagedTransactionRecord
      >();
  
    private cleanupTimer:
      ReturnType<
        typeof setTimeout
      > | null = null;
  
    private cleanupInProgress =
      false;
  
    private createdTransactionCount =
      0;
  
    private committedTransactionCount =
      0;
  
    private rolledBackTransactionCount =
      0;
  
    private failedTransactionCount =
      0;
  
    private removedTransactionCount =
      0;
  
    private lastCleanupAt:
      Date | null = null;
  
    constructor(
      options:
        WonderTransactionManagerOptions = {}
    ) {
      this.options =
        resolveManagerOptions(
          options
        );
  
      if (
        this.options
          .automaticCleanup
      ) {
        this.startCleanup();
      }
    }
  
    // =========================================================
    // CREATION
    // =========================================================
  
    beginTransaction<
      TValue = unknown
    >(
      options:
        WonderManagedTransactionOptions<TValue> = {}
    ): WonderInMemoryTransaction<TValue> {
      this.assertCapacity();
  
      const parentTransactionId =
        normaliseOptionalText(
          options
            .parentTransactionId
        );
  
      if (
        parentTransactionId
      ) {
        const parent =
          this.requireRecord(
            parentTransactionId
          );
  
        if (
          !parent.transaction
            .isActive()
        ) {
          throw new WonderStorageError(
            `WonderStorage: parent transaction "${parentTransactionId}" is not active.`,
            {
              code:
                "STORAGE_TRANSACTION_INACTIVE",
  
              details: {
                parentTransactionId,
  
                status:
                  parent.transaction
                    .getStatus(),
              },
            }
          );
        }
      }
  
      const transaction =
        new WonderInMemoryTransaction<TValue>(
          options
        );
  
      const now =
        new Date();
  
      const record:
        ManagedTransactionRecord = {
        transaction:
          transaction as
            WonderInMemoryTransaction<unknown>,
  
        label:
          normaliseOptionalText(
            options.label
          ) ??
          transaction.id,
  
        parentTransactionId,
  
        childTransactionIds:
          new Set<string>(),
  
        createdAt:
          new Date(
            now.getTime()
          ),
  
        updatedAt:
          new Date(
            now.getTime()
          ),
  
        managerMetadata: {
          ...(
            options
              .managerMetadata ??
            {}
          ),
        },
      };
  
      this.transactions.set(
        transaction.id,
        record
      );
  
      if (
        parentTransactionId
      ) {
        const parent =
          this.requireRecord(
            parentTransactionId
          );
  
        parent.childTransactionIds
          .add(
            transaction.id
          );
  
        parent.updatedAt =
          new Date();
      }
  
      this.createdTransactionCount +=
        1;
  
      return transaction;
    }
  
    registerTransaction<
      TValue = unknown
    >(
      transaction:
        WonderInMemoryTransaction<TValue>,
      options: {
        parentTransactionId?: string | null;
  
        label?: string;
  
        metadata?: Readonly<
          Record<string, unknown>
        >;
      } = {}
    ): void {
      if (
        this.transactions.has(
          transaction.id
        )
      ) {
        throw new WonderStorageError(
          `WonderStorage: transaction "${transaction.id}" is already registered.`,
          {
            code:
              "STORAGE_ALREADY_EXISTS",
          }
        );
      }
  
      this.assertCapacity();
  
      const parentTransactionId =
        normaliseOptionalText(
          options
            .parentTransactionId
        );
  
      if (
        parentTransactionId
      ) {
        this.requireRecord(
          parentTransactionId
        );
      }
  
      const now =
        new Date();
  
      this.transactions.set(
        transaction.id,
        {
          transaction:
            transaction as
              WonderInMemoryTransaction<unknown>,
  
          label:
            normaliseOptionalText(
              options.label
            ) ??
            transaction.id,
  
          parentTransactionId,
  
          childTransactionIds:
            new Set<string>(),
  
          createdAt:
            new Date(
              now.getTime()
            ),
  
          updatedAt:
            new Date(
              now.getTime()
            ),
  
          managerMetadata: {
            ...(
              options.metadata ??
              {}
            ),
          },
        }
      );
  
      if (
        parentTransactionId
      ) {
        const parent =
          this.requireRecord(
            parentTransactionId
          );
  
        parent.childTransactionIds
          .add(
            transaction.id
          );
  
        parent.updatedAt =
          new Date();
      }
  
      this.createdTransactionCount +=
        1;
    }
  
    // =========================================================
    // RETRIEVAL
    // =========================================================
  
    getTransaction<
      TValue = unknown
    >(
      transactionId: string
    ): WonderInMemoryTransaction<TValue> | null {
      const record =
        this.transactions.get(
          normaliseRequiredText(
            transactionId,
            "transactionId"
          )
        );
  
      return record
        ? record.transaction as
            WonderInMemoryTransaction<TValue>
        : null;
    }
  
    requireTransaction<
      TValue = unknown
    >(
      transactionId: string
    ): WonderInMemoryTransaction<TValue> {
      return this.requireRecord(
        transactionId
      ).transaction as
        WonderInMemoryTransaction<TValue>;
    }
  
    hasTransaction(
      transactionId: string
    ): boolean {
      return this.transactions.has(
        normaliseRequiredText(
          transactionId,
          "transactionId"
        )
      );
    }
  
    listTransactions():
      WonderManagedTransactionSnapshot[] {
      return Array.from(
        this.transactions.values()
      )
        .map(
          cloneManagedRecord
        )
        .sort(
          (
            first,
            second
          ) =>
            first.createdAt
              .getTime() -
            second.createdAt
              .getTime()
        );
    }
  
    listActiveTransactions():
      WonderManagedTransactionSnapshot[] {
      return this.listTransactions()
        .filter(
          (snapshot) =>
            snapshot.transaction
              .status ===
            "active"
        );
    }
  
    listChildTransactions(
      transactionId: string
    ): WonderManagedTransactionSnapshot[] {
      const record =
        this.requireRecord(
          transactionId
        );
  
      return Array.from(
        record.childTransactionIds
      )
        .map(
          (childTransactionId) =>
            cloneManagedRecord(
              this.requireRecord(
                childTransactionId
              )
            )
        );
    }
  
    getSnapshot(
      transactionId: string
    ): WonderManagedTransactionSnapshot {
      return cloneManagedRecord(
        this.requireRecord(
          transactionId
        )
      );
    }
  
    // =========================================================
    // COMMIT
    // =========================================================
  
    async commit(
      transactionId: string
    ): Promise<
      WonderTransactionManagerCommitResult
    > {
      const record =
        this.requireRecord(
          transactionId
        );
  
      this.assertTransactionActive(
        record.transaction
      );
  
      const activeChildren =
        this.getActiveDescendants(
          transactionId
        );
  
      /*
       * Child transactions commit before their parent.
       * Deepest descendants are committed first.
       */
      const orderedChildren =
        activeChildren.sort(
          (
            first,
            second
          ) =>
            this.getDepth(
              second.id
            ) -
            this.getDepth(
              first.id
            )
        );
  
      const committedTransactions:
        string[] = [];
  
      try {
        for (
          const child of
            orderedChildren
        ) {
          await child.commit();
  
          committedTransactions.push(
            child.id
          );
  
          this.committedTransactionCount +=
            1;
  
          this.touchRecord(
            child.id
          );
  
          this.removeIfTerminal(
            child.id
          );
        }
  
        const result =
          await record.transaction
            .commit();
  
        committedTransactions.push(
          record.transaction.id
        );
  
        this.committedTransactionCount +=
          1;
  
        this.touchRecord(
          record.transaction.id
        );
  
        this.removeIfTerminal(
          record.transaction.id
        );
  
        return {
          success: true,
  
          transactionId:
            record.transaction.id,
  
          committedTransactions,
  
          result:
            cloneCommitResult(
              result
            ),
        };
      } catch (error) {
        this.failedTransactionCount +=
          1;
  
        this.touchRecord(
          transactionId
        );
  
        throw error;
      }
    }
  
    // =========================================================
    // ROLLBACK
    // =========================================================
  
    async rollback(
      transactionId: string,
      reason?: string
    ): Promise<
      WonderTransactionManagerRollbackResult
    > {
      const record =
        this.requireRecord(
          transactionId
        );
  
      this.assertTransactionActive(
        record.transaction
      );
  
      const rolledBackTransactions:
        string[] = [];
  
      try {
        if (
          this.options
            .cascadeRollback
        ) {
          const descendants =
            this.getActiveDescendants(
              transactionId
            ).sort(
              (
                first,
                second
              ) =>
                this.getDepth(
                  second.id
                ) -
                this.getDepth(
                  first.id
                )
            );
  
          for (
            const child of
              descendants
          ) {
            await child.rollback(
              reason ??
              `Parent transaction "${transactionId}" rolled back.`
            );
  
            rolledBackTransactions
              .push(
                child.id
              );
  
            this.rolledBackTransactionCount +=
              1;
  
            this.touchRecord(
              child.id
            );
  
            this.removeIfTerminal(
              child.id
            );
          }
        } else {
          const activeChildren =
            this.getActiveDescendants(
              transactionId
            );
  
          if (
            activeChildren.length >
            0
          ) {
            throw new WonderStorageError(
              `WonderStorage: transaction "${transactionId}" has active child transactions.`,
              {
                code:
                  "STORAGE_TRANSACTION_INACTIVE",
  
                details: {
                  transactionId,
  
                  activeChildTransactionIds:
                    activeChildren.map(
                      (child) =>
                        child.id
                    ),
                },
              }
            );
          }
        }
  
        const result =
          await record.transaction
            .rollback(
              reason
            );
  
        rolledBackTransactions
          .push(
            record.transaction.id
          );
  
        this.rolledBackTransactionCount +=
          1;
  
        this.touchRecord(
          record.transaction.id
        );
  
        this.removeIfTerminal(
          record.transaction.id
        );
  
        return {
          success: true,
  
          transactionId:
            record.transaction.id,
  
          rolledBackTransactions,
  
          result:
            cloneRollbackResult(
              result
            ),
        };
      } catch (error) {
        this.failedTransactionCount +=
          1;
  
        this.touchRecord(
          transactionId
        );
  
        throw error;
      }
    }
  
    // =========================================================
    // REMOVAL
    // =========================================================
  
    removeTransaction(
      transactionId: string,
      force = false
    ): boolean {
      const record =
        this.requireRecord(
          transactionId
        );
  
      if (
        !force &&
        record.transaction
          .isActive()
      ) {
        throw new WonderStorageError(
          `WonderStorage: active transaction "${transactionId}" cannot be removed without force.`,
          {
            code:
              "STORAGE_TRANSACTION_INACTIVE",
          }
        );
      }
  
      if (
        record.childTransactionIds
          .size > 0
      ) {
        const childIds =
          Array.from(
            record.childTransactionIds
          );
  
        for (
          const childId of
            childIds
        ) {
          this.removeTransaction(
            childId,
            force
          );
        }
      }
  
      if (
        record.parentTransactionId
      ) {
        const parent =
          this.transactions.get(
            record.parentTransactionId
          );
  
        parent?.childTransactionIds
          .delete(
            transactionId
          );
  
        if (parent) {
          parent.updatedAt =
            new Date();
        }
      }
  
      const removed =
        this.transactions.delete(
          transactionId
        );
  
      if (removed) {
        this.removedTransactionCount +=
          1;
      }
  
      return removed;
    }
  
    async clear(): Promise<number> {
      const transactionIds =
        Array.from(
          this.transactions.keys()
        );
  
      let removedCount =
        0;
  
      for (
        const transactionId of
          transactionIds
      ) {
        const record =
          this.transactions.get(
            transactionId
          );
  
        if (!record) {
          continue;
        }
  
        if (
          record.transaction
            .isActive()
        ) {
          if (
            !this.options
              .rollbackActiveTransactionsOnClear
          ) {
            continue;
          }
  
          try {
            await this.rollback(
              transactionId,
              "Transaction manager cleared."
            );
          } catch {
            this.failedTransactionCount +=
              1;
          }
        }
  
        if (
          this.transactions.has(
            transactionId
          ) &&
          this.removeTransaction(
            transactionId,
            true
          )
        ) {
          removedCount +=
            1;
        }
      }
  
      return removedCount;
    }
  
    // =========================================================
    // TIMEOUT CLEANUP
    // =========================================================
  
    startCleanup(): void {
      if (
        this.cleanupTimer !==
        null
      ) {
        return;
      }
  
      this.scheduleNextCleanup();
    }
  
    stopCleanup(): void {
      if (
        this.cleanupTimer ===
        null
      ) {
        return;
      }
  
      clearTimeout(
        this.cleanupTimer
      );
  
      this.cleanupTimer =
        null;
    }
  
    isCleanupRunning(): boolean {
      return (
        this.cleanupTimer !==
        null
      );
    }
  
    async cleanup(): Promise<
      WonderTransactionCleanupResult
    > {
      const checkedAt =
        new Date();
  
      if (
        this.cleanupInProgress
      ) {
        return {
          checkedAt,
  
          checkedTransactions: 0,
  
          rolledBackTransactions: 0,
  
          removedTransactions: 0,
  
          errors: [
            "Transaction cleanup is already running.",
          ],
        };
      }
  
      this.cleanupInProgress =
        true;
  
      const errors: string[] =
        [];
  
      let checkedTransactions =
        0;
  
      let rolledBackTransactions =
        0;
  
      let removedTransactions =
        0;
  
      try {
        const transactionIds =
          Array.from(
            this.transactions.keys()
          );
  
        for (
          const transactionId of
            transactionIds
        ) {
          const record =
            this.transactions.get(
              transactionId
            );
  
          if (!record) {
            continue;
          }
  
          checkedTransactions +=
            1;
  
          const active =
            record.transaction
              .isActive();
  
          const status =
            record.transaction
              .getStatus();
  
          if (
            !active &&
            status === "failed"
          ) {
            this.failedTransactionCount +=
              1;
          }
  
          if (
            !active &&
            status !== "committed" &&
            status !==
              "rolled-back"
          ) {
            /*
             * Timeout transitions the base transaction to failed.
             * It can no longer call rollback(), so cleanup removes
             * the terminal record safely.
             */
            if (
              this.removeTransaction(
                transactionId,
                true
              )
            ) {
              removedTransactions +=
                1;
            }
  
            continue;
          }
  
          if (
            status === "committed" ||
            status ===
              "rolled-back" ||
            status === "failed"
          ) {
            if (
              this.options
                .removeTerminalTransactions &&
              this.transactions.has(
                transactionId
              ) &&
              this.removeTransaction(
                transactionId,
                true
              )
            ) {
              removedTransactions +=
                1;
            }
  
            continue;
          }
  
          if (!active) {
            try {
              const result =
                await this.rollback(
                  transactionId,
                  "Transaction expired during cleanup."
                );
  
              rolledBackTransactions +=
                result
                  .rolledBackTransactions
                  .length;
            } catch (error) {
              errors.push(
                getErrorMessage(
                  error
                )
              );
            }
          }
        }
  
        this.lastCleanupAt =
          new Date();
  
        return {
          checkedAt,
  
          checkedTransactions,
  
          rolledBackTransactions,
  
          removedTransactions,
  
          errors,
        };
      } finally {
        this.cleanupInProgress =
          false;
      }
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    getStatistics():
      WonderTransactionManagerStatistics {
      const snapshots =
        this.listTransactions();
  
      let activeTransactions =
        0;
  
      let committedTransactions =
        0;
  
      let rolledBackTransactions =
        0;
  
      let failedTransactions =
        0;
  
      let rootTransactions =
        0;
  
      let childTransactions =
        0;
  
      let maximumDepth =
        0;
  
      for (
        const snapshot of
          snapshots
      ) {
        switch (
          snapshot.transaction
            .status
        ) {
          case "active":
            activeTransactions +=
              1;
            break;
  
          case "committed":
            committedTransactions +=
              1;
            break;
  
          case "rolled-back":
            rolledBackTransactions +=
              1;
            break;
  
          case "failed":
            failedTransactions +=
              1;
            break;
        }
  
        if (
          snapshot
            .parentTransactionId
        ) {
          childTransactions +=
            1;
        } else {
          rootTransactions +=
            1;
        }
  
        maximumDepth =
          Math.max(
            maximumDepth,
            this.getDepth(
              snapshot.id
            )
          );
      }
  
      return {
        totalTransactions:
          snapshots.length,
  
        activeTransactions,
  
        committedTransactions,
  
        rolledBackTransactions,
  
        failedTransactions,
  
        rootTransactions,
  
        childTransactions,
  
        maximumDepth,
  
        cleanupRunning:
          this.isCleanupRunning(),
  
        createdTransactionCount:
          this.createdTransactionCount,
  
        committedTransactionCount:
          this.committedTransactionCount,
  
        rolledBackTransactionCount:
          this.rolledBackTransactionCount,
  
        failedTransactionCount:
          this.failedTransactionCount,
  
        removedTransactionCount:
          this.removedTransactionCount,
  
        lastCleanupAt:
          cloneNullableDate(
            this.lastCleanupAt
          ),
      };
    }
  
    // =========================================================
    // INTERNAL RELATIONSHIPS
    // =========================================================
  
    private getActiveDescendants(
      transactionId: string
    ): WonderInMemoryTransaction<unknown>[] {
      const descendants:
        WonderInMemoryTransaction<unknown>[] =
        [];
  
      const visit =
        (
          currentTransactionId:
            string
        ): void => {
          const record =
            this.requireRecord(
              currentTransactionId
            );
  
          for (
            const childTransactionId of
              record.childTransactionIds
          ) {
            const childRecord =
              this.requireRecord(
                childTransactionId
              );
  
            if (
              childRecord.transaction
                .isActive()
            ) {
              descendants.push(
                childRecord.transaction
              );
            }
  
            visit(
              childTransactionId
            );
          }
        };
  
      visit(
        transactionId
      );
  
      return descendants;
    }
  
    private getDepth(
      transactionId: string
    ): number {
      let depth =
        0;
  
      let current =
        this.transactions.get(
          transactionId
        );
  
      const visited =
        new Set<string>();
  
      while (
        current
          ?.parentTransactionId
      ) {
        if (
          visited.has(
            current
              .parentTransactionId
          )
        ) {
          throw new WonderStorageError(
            "WonderStorage: cyclic transaction relationship detected.",
            {
              code:
                "STORAGE_VALIDATION_FAILED",
            }
          );
        }
  
        visited.add(
          current
            .parentTransactionId
        );
  
        depth +=
          1;
  
        current =
          this.transactions.get(
            current
              .parentTransactionId
          );
      }
  
      return depth;
    }
  
    // =========================================================
    // INTERNAL REGISTRY
    // =========================================================
  
    private requireRecord(
      transactionId: string
    ): ManagedTransactionRecord {
      const cleanTransactionId =
        normaliseRequiredText(
          transactionId,
          "transactionId"
        );
  
      const record =
        this.transactions.get(
          cleanTransactionId
        );
  
      if (!record) {
        throw new WonderStorageError(
          `WonderStorage: transaction "${cleanTransactionId}" was not found.`,
          {
            code:
              "STORAGE_NOT_FOUND",
  
            details: {
              transactionId:
                cleanTransactionId,
            },
          }
        );
      }
  
      return record;
    }
  
    private touchRecord(
      transactionId: string
    ): void {
      const record =
        this.transactions.get(
          transactionId
        );
  
      if (record) {
        record.updatedAt =
          new Date();
      }
    }
  
    private removeIfTerminal(
      transactionId: string
    ): void {
      if (
        !this.options
          .removeTerminalTransactions
      ) {
        return;
      }
  
      const record =
        this.transactions.get(
          transactionId
        );
  
      if (!record) {
        return;
      }
  
      const status =
        record.transaction
          .getStatus();
  
      if (
        status === "committed" ||
        status ===
          "rolled-back" ||
        status === "failed"
      ) {
        this.removeTransaction(
          transactionId,
          true
        );
      }
    }
  
    private assertTransactionActive(
      transaction:
        WonderInMemoryTransaction<unknown>
    ): void {
      if (
        transaction.isActive()
      ) {
        return;
      }
  
      throw new WonderStorageError(
        `WonderStorage: transaction "${transaction.id}" is not active.`,
        {
          code:
            "STORAGE_TRANSACTION_INACTIVE",
  
          details: {
            transactionId:
              transaction.id,
  
            status:
              transaction
                .getStatus(),
          },
        }
      );
    }
  
    private assertCapacity(): void {
      if (
        this.transactions.size <
        this.options
          .maximumTransactions
      ) {
        return;
      }
  
      throw new WonderStorageError(
        "WonderStorage: transaction manager capacity has been reached.",
        {
          code:
            "STORAGE_CONFLICT",
  
          retryable:
            true,
  
          details: {
            maximumTransactions:
              this.options
                .maximumTransactions,
          },
        }
      );
    }
  
    // =========================================================
    // AUTOMATIC CLEANUP
    // =========================================================
  
    private scheduleNextCleanup(): void {
      if (
        this.cleanupTimer !==
        null
      ) {
        return;
      }
  
      this.cleanupTimer =
        setTimeout(
          () => {
            this.cleanupTimer =
              null;
  
            void this.cleanup()
              .finally(
                () => {
                  if (
                    this.options
                      .automaticCleanup
                  ) {
                    this.scheduleNextCleanup();
                  }
                }
              );
          },
          this.options
            .cleanupIntervalMilliseconds
        );
    }
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolveManagerOptions(
    options:
      WonderTransactionManagerOptions
  ): ResolvedWonderTransactionManagerOptions {
    return {
      maximumTransactions:
        clampInteger(
          options.maximumTransactions ??
          DEFAULT_MAXIMUM_TRANSACTIONS,
          MINIMUM_MAXIMUM_TRANSACTIONS,
          MAXIMUM_MAXIMUM_TRANSACTIONS
        ),
  
      removeTerminalTransactions:
        options
          .removeTerminalTransactions ??
        false,
  
      cascadeRollback:
        options.cascadeRollback ??
        true,
  
      rollbackActiveTransactionsOnClear:
        options
          .rollbackActiveTransactionsOnClear ??
        true,
  
      cleanupIntervalMilliseconds:
        Math.max(
          MINIMUM_CLEANUP_INTERVAL_MILLISECONDS,
          Math.floor(
            options
              .cleanupIntervalMilliseconds ??
            DEFAULT_CLEANUP_INTERVAL_MILLISECONDS
          )
        ),
  
      automaticCleanup:
        options.automaticCleanup ??
        false,
    };
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneManagedRecord(
    record:
      ManagedTransactionRecord
  ): WonderManagedTransactionSnapshot {
    return {
      id:
        record.transaction.id,
  
      label:
        record.label,
  
      parentTransactionId:
        record.parentTransactionId,
  
      childTransactionIds:
        Array.from(
          record.childTransactionIds
        ),
  
      createdAt:
        new Date(
          record.createdAt
            .getTime()
        ),
  
      updatedAt:
        new Date(
          record.updatedAt
            .getTime()
        ),
  
      managerMetadata: {
        ...record.managerMetadata,
      },
  
      transaction:
        record.transaction
          .getState(),
    };
  }
  
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
  // GENERAL HELPERS
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
        `WonderStorage: "${fieldName}" must be a string.`,
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
        `WonderStorage: "${fieldName}" is required.`,
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
  
    return cleaned.length >
      0
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
  // DEFAULT MANAGER
  // =========================================================
  
  export const wonderTransactionManager =
    new WonderTransactionManager();
  
  export default WonderTransactionManager;  