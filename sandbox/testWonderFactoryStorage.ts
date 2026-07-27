import {
    mkdir,
    rm,
    writeFile,
  } from "node:fs/promises";
  
  import {
    join,
  } from "node:path";
  
  import {
    tmpdir,
  } from "node:os";
  
  import {
    createWonderOSEventBus,
  } from "@/core/WonderEvents";
  
  import {
    WonderFactory,
  } from "@/factory/WonderFactory";
  
  import {
    WonderQueue,
  } from "@/factory/queue/WonderQueue";
  
  import {
    WonderFactoryStorage,
  } from "@/factory/storage/WonderFactoryStorage";
  
  import {
    WonderWorker,
    WonderWorkerRegistry,
  } from "@/factory/workers/WonderWorker";
  
  import type {
    WonderJob,
  } from "@/factory/types/WonderJob";
  
  // =========================================================
  // TEST TYPES
  // =========================================================
  
  interface StorageTestPayload {
    itemNumber: number;
  
    title: string;
  
    createdAt: Date;
  
    metadata: {
      category: string;
  
      optionalValue?: string;
    };
  }
  
  interface StorageTestResult {
    itemNumber: number;
  
    title: string;
  
    processedBy: string;
  
    processedAt: Date;
  }
  
  interface WonderFactoryStorageTestSummary {
    success: boolean;
  
    initialJobs: number;
  
    savedJobs: number;
  
    loadedJobs: number;
  
    backupsCreated: number;
  
    fallbackUsed: boolean;
  
    restoredJobs: number;
  
    recoveredProcessingJobs: number;
  
    completedJobs: number;
  
    failedJobs: number;
  
    queuedJobs: number;
  
    processingJobs: number;
  
    resultsCreated: number;
  
    datesPreserved: boolean;
  
    primaryFileExists: boolean;
  
    queueIdle: boolean;
  
    finalFactoryStatus: string;
  
    storagePath: string;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const TEST_BATCH_ID =
    "wonder-factory-storage-test-001";
  
  const TOTAL_JOBS = 3;
  
  const INTERRUPTED_JOB_ID =
    "storage-test-job-001";
  
  // =========================================================
  // TEST
  // =========================================================
  
  async function runWonderFactoryStorageTest(): Promise<WonderFactoryStorageTestSummary> {
    const workingDirectory =
      join(
        tmpdir(),
        `wonder-factory-storage-test-${Date.now()}`
      );
  
    const storagePath =
      join(
        workingDirectory,
        "state",
        "wonder-factory-state.json"
      );
  
    await mkdir(
      workingDirectory,
      {
        recursive: true,
      }
    );
  
    const sourceEventBus =
      createWonderOSEventBus();
  
    const restoredEventBus =
      createWonderOSEventBus();
  
    const sourceFactory =
      createTestFactory(
        "source-storage-factory",
        sourceEventBus
      );
  
    const restoredFactory =
      createTestFactory(
        "restored-storage-factory",
        restoredEventBus
      );
  
    const storage =
      new WonderFactoryStorage({
        filePath:
          storagePath,
  
        workingDirectory,
  
        prettyPrint: true,
  
        createDirectories: true,
  
        atomicWrite: true,
  
        createBackupBeforeWrite:
          true,
  
        maximumBackups: 5,
  
        writeMode:
          "replace",
      });
  
    try {
      // =======================================================
      // CREATE SOURCE STATE
      // =======================================================
  
      await submitStorageTestJobs(
        sourceFactory
      );
  
      assertEqual(
        sourceFactory
          .getQueue()
          .size(),
        TOTAL_JOBS,
        "Source Factory should contain all submitted jobs."
      );
  
      /*
       * Simulate a process crash:
       *
       * - claim the highest-priority job
       * - start processing it
       * - save before it completes
       *
       * The restored Factory must return this job to the queue.
       */
      const interruptedResult =
        await sourceFactory
          .getQueue()
          .claimAndStart(
            "worker-before-restart",
            {
              types: [
                "generation",
              ],
  
              batchId:
                TEST_BATCH_ID,
  
              lockDurationMilliseconds:
                60_000,
            }
          );
  
      assertTrue(
        interruptedResult !== null,
        "One job should be claimed and started."
      );
  
      assertEqual(
        interruptedResult?.job.id,
        INTERRUPTED_JOB_ID,
        "The highest-priority job should become the interrupted job."
      );
  
      assertEqual(
        interruptedResult?.job.status,
        "processing",
        "Interrupted job should be processing before persistence."
      );
  
      await sourceFactory
        .getQueue()
        .updateProgress(
          INTERRUPTED_JOB_ID,
          {
            completedItems: 1,
  
            totalItems: 3,
  
            message:
              "Processing was interrupted before completion.",
  
            status:
              "running",
          }
        );
  
      // =======================================================
      // SAVE TWICE TO CREATE A BACKUP
      // =======================================================
  
      const firstSave =
        await storage.save(
          sourceFactory,
          {
            createBackup:
              true,
          }
        );
  
      assertTrue(
        firstSave.success,
        "First Factory state save should succeed."
      );
  
      assertEqual(
        firstSave.jobCount,
        TOTAL_JOBS,
        "First save should persist every job."
      );
  
      const secondSave =
        await storage.save(
          sourceFactory,
          {
            createBackup:
              true,
          }
        );
  
      assertTrue(
        secondSave.success,
        "Second Factory state save should succeed."
      );
  
      assertTrue(
        secondSave.backupPath !==
          null,
        "Second save should create a backup."
      );
  
      const storageStatistics =
        await storage.getStatistics();
  
      assertTrue(
        storageStatistics.exists,
        "Primary Factory state file should exist."
      );
  
      assertTrue(
        storageStatistics.backupCount >=
          1,
        "At least one Factory backup should exist."
      );
  
      // =======================================================
      // LOAD PRIMARY STATE
      // =======================================================
  
      const primaryLoad =
        await storage.load();
  
      assertTrue(
        primaryLoad.success,
        "Primary Factory state should load successfully."
      );
  
      assertFalse(
        primaryLoad.usedBackup,
        "Healthy primary state should not use a backup."
      );
  
      assertEqual(
        primaryLoad.state
          .queue.jobs.length,
        TOTAL_JOBS,
        "Loaded state should contain every persisted job."
      );
  
      const loadedInterruptedJob =
        findJob(
          primaryLoad.state
            .queue.jobs,
          INTERRUPTED_JOB_ID
        );
  
      assertTrue(
        loadedInterruptedJob !==
          null,
        "Interrupted job should exist in loaded state."
      );
  
      assertEqual(
        loadedInterruptedJob?.status,
        "processing",
        "Loaded interrupted job should preserve its processing status."
      );
  
      const loadedPayload =
        readStorageTestPayload(
          loadedInterruptedJob?.payload
        );
  
      assertTrue(
        loadedPayload.createdAt instanceof
          Date,
        "Date values inside job payloads should remain Date objects."
      );
  
      // =======================================================
      // CORRUPT PRIMARY FILE AND TEST BACKUP FALLBACK
      // =======================================================
  
      await writeFile(
        storage.getPath(),
        "{ this is intentionally invalid JSON",
        {
          encoding: "utf8",
        }
      );
  
      const fallbackLoad =
        await storage.load({
          fallbackToLatestBackup:
            true,
        });
  
      assertTrue(
        fallbackLoad.success,
        "Storage should load the latest backup when primary state is corrupt."
      );
  
      assertTrue(
        fallbackLoad.usedBackup,
        "Corrupt primary state should trigger backup fallback."
      );
  
      assertEqual(
        fallbackLoad.state
          .queue.jobs.length,
        TOTAL_JOBS,
        "Backup state should contain every persisted job."
      );
  
      // =======================================================
      // RESTORE INTO A NEW FACTORY
      // =======================================================
  
      registerRestoredWorker(
        restoredFactory
      );
  
      const restoreResult =
        await storage.restore(
          restoredFactory,
          {
            replaceExisting: true,
  
            recoverProcessingJobs:
              true,
          }
        );
  
      assertTrue(
        restoreResult.success,
        "Factory restore should succeed."
      );
  
      assertTrue(
        restoreResult.usedBackup,
        "Restore should use the valid backup after primary corruption."
      );
  
      assertEqual(
        restoreResult.importedJobs,
        TOTAL_JOBS,
        "Restore should import every persisted job."
      );
  
      assertEqual(
        restoreResult
          .recoveredProcessingJobs,
        1,
        "Exactly one interrupted processing job should be recovered."
      );
  
      const recoveredJob =
        restoredFactory.getJob(
          INTERRUPTED_JOB_ID
        );
  
      assertTrue(
        recoveredJob !== null,
        "Recovered interrupted job should exist."
      );
  
      assertEqual(
        recoveredJob?.status,
        "queued",
        "Interrupted processing job should return to queued status."
      );
  
      assertEqual(
        recoveredJob?.attemptCount,
        1,
        "Recovered job should preserve its first interrupted attempt."
      );
  
      assertEqual(
        recoveredJob?.lock,
        null,
        "Recovered job should not retain its previous worker lock."
      );
  
      assertEqual(
        recoveredJob?.lastError?.code,
        "FACTORY_RESTART_RECOVERY",
        "Recovered job should record the restart recovery error."
      );
  
      assertEqual(
        recoveredJob
          ?.attempts[0]
          ?.success,
        false,
        "Interrupted attempt should be closed as unsuccessful."
      );
  
      // =======================================================
      // COMPLETE RESTORED QUEUE
      // =======================================================
  
      await restoredFactory.start({
        automaticPolling:
          false,
      });
  
      const runResult =
        await restoredFactory
          .runUntilIdle({
            maximumTicks: 30,
  
            timeoutMilliseconds:
              15_000,
  
            intervalMilliseconds:
              0,
  
            maximumIdleTicks: 5,
  
            startIfNeeded:
              false,
          });
  
      assertTrue(
        runResult.success,
        [
          "Restored Factory should run until idle.",
          ...runResult.errors,
        ].join(" ")
      );
  
      assertTrue(
        runResult.idle,
        "Restored Factory queue should become idle."
      );
  
      const finalQueueStatistics =
        restoredFactory
          .getQueue()
          .getStatistics();
  
      assertEqual(
        finalQueueStatistics
          .completedJobs,
        TOTAL_JOBS,
        "Every restored job should complete."
      );
  
      assertEqual(
        finalQueueStatistics
          .failedJobs,
        0,
        "No restored jobs should remain failed."
      );
  
      assertEqual(
        finalQueueStatistics
          .queuedJobs,
        0,
        "No restored jobs should remain queued."
      );
  
      assertEqual(
        finalQueueStatistics
          .processingJobs,
        0,
        "No restored jobs should remain processing."
      );
  
      const finalInterruptedJob =
        restoredFactory.getJob<
          StorageTestPayload,
          StorageTestResult
        >(
          INTERRUPTED_JOB_ID
        );
  
      assertEqual(
        finalInterruptedJob
          ?.status,
        "completed",
        "Recovered interrupted job should eventually complete."
      );
  
      assertEqual(
        finalInterruptedJob
          ?.attemptCount,
        2,
        "Recovered interrupted job should complete on its second attempt."
      );
  
      const completedJobs =
        restoredFactory
          .getQueue()
          .getJobsByStatus(
            "completed"
          );
  
      const completedResults =
        completedJobs.map(
          (job) =>
            job.result
        );
  
      assertTrue(
        completedResults.every(
          isStorageTestResult
        ),
        "Every completed restored job should contain a valid result."
      );
  
      assertTrue(
        completedResults.every(
          (result) =>
            result.processedAt instanceof
            Date
        ),
        "Worker results should contain Date objects."
      );
  
      const restoredPayloadDates =
        completedJobs.map(
          (job) =>
            readStorageTestPayload(
              job.payload
            ).createdAt
        );
  
      assertTrue(
        restoredPayloadDates.every(
          (date) =>
            date instanceof Date &&
            !Number.isNaN(
              date.getTime()
            )
        ),
        "All persisted payload dates should survive restoration."
      );
  
      await restoredFactory.stop({
        graceful: true,
  
        timeoutMilliseconds:
          5_000,
  
        cancelActiveJobsOnTimeout:
          true,
      });
  
      const finalStorageStatistics =
        await storage.getStatistics();
  
      return {
        success: true,
  
        initialJobs:
          TOTAL_JOBS,
  
        savedJobs:
          secondSave.jobCount,
  
        loadedJobs:
          primaryLoad.state
            .queue.jobs.length,
  
        backupsCreated:
          finalStorageStatistics
            .backupCount,
  
        fallbackUsed:
          fallbackLoad.usedBackup,
  
        restoredJobs:
          restoreResult
            .importedJobs,
  
        recoveredProcessingJobs:
          restoreResult
            .recoveredProcessingJobs,
  
        completedJobs:
          finalQueueStatistics
            .completedJobs,
  
        failedJobs:
          finalQueueStatistics
            .failedJobs,
  
        queuedJobs:
          finalQueueStatistics
            .queuedJobs,
  
        processingJobs:
          finalQueueStatistics
            .processingJobs,
  
        resultsCreated:
          completedResults.length,
  
        datesPreserved:
          restoredPayloadDates.every(
            (date) =>
              date instanceof Date
          ),
  
        primaryFileExists:
          finalStorageStatistics.exists,
  
        queueIdle:
          runResult.idle,
  
        finalFactoryStatus:
          restoredFactory.getStatus(),
  
        storagePath:
          storage.getPath(),
      };
    } finally {
      if (
        sourceFactory.getStatus() ===
          "running" ||
        sourceFactory.getStatus() ===
          "paused" ||
        sourceFactory.getStatus() ===
          "error"
      ) {
        await sourceFactory.stop({
          graceful: false,
  
          timeoutMilliseconds:
            100,
  
          cancelActiveJobsOnTimeout:
            true,
        });
      }
  
      if (
        restoredFactory.getStatus() ===
          "running" ||
        restoredFactory.getStatus() ===
          "paused" ||
        restoredFactory.getStatus() ===
          "error"
      ) {
        await restoredFactory.stop({
          graceful: false,
  
          timeoutMilliseconds:
            100,
  
          cancelActiveJobsOnTimeout:
            true,
        });
      }
  
      storage.stopAutoSave();
  
      await storage.delete(
        true
      );
  
      await rm(
        workingDirectory,
        {
          recursive: true,
  
          force: true,
        }
      );
  
      sourceEventBus.clear();
  
      sourceEventBus.clearHistory();
  
      restoredEventBus.clear();
  
      restoredEventBus.clearHistory();
    }
  }
  
  // =========================================================
  // FACTORY CREATION
  // =========================================================
  
  function createTestFactory(
    id: string,
    eventBus:
      ReturnType<
        typeof createWonderOSEventBus
      >
  ): WonderFactory {
    const queue =
      new WonderQueue(
        {
          maximumJobs: 100,
  
          defaultLockDurationMilliseconds:
            60_000,
  
          pruneCompletedJobsWhenFull:
            true,
  
          completedJobRetention:
            100,
  
          emitEvents:
            true,
        },
        eventBus
      );
  
    const workers =
      new WonderWorkerRegistry();
  
    return new WonderFactory(
      {
        id,
  
        name:
          `Storage Test ${id}`,
  
        maximumConcurrentJobs: 2,
  
        executionMode:
          "parallel",
  
        pollingIntervalMilliseconds:
          10,
  
        workerHeartbeatTimeoutMilliseconds:
          60_000,
  
        jobLockDurationMilliseconds:
          60_000,
  
        autoRetryFailedJobs:
          true,
  
        retryDelayMilliseconds:
          0,
  
        stopOnJobFailure:
          false,
  
        emitEvents:
          true,
      },
      {
        queue,
  
        workers,
  
        eventBus,
      }
    );
  }
  
  // =========================================================
  // WORKER
  // =========================================================
  
  function registerRestoredWorker(
    factory: WonderFactory
  ): void {
    const worker =
      new WonderWorker({
        id:
          "storage-recovery-worker",
  
        name:
          "Storage Recovery Worker",
  
        capabilities: [
          "generation",
        ],
  
        executor:
          async (
            job,
            context
          ): Promise<StorageTestResult> => {
            const payload =
              readStorageTestPayload(
                job.payload
              );
  
            await context.reportProgress({
              completedItems: 1,
  
              totalItems: 3,
  
              message:
                `Restoring ${payload.title}.`,
            });
  
            await delay(2);
  
            await context.reportProgress({
              completedItems: 2,
  
              totalItems: 3,
  
              message:
                `Processing ${payload.title}.`,
            });
  
            await delay(2);
  
            await context.reportProgress({
              completedItems: 3,
  
              totalItems: 3,
  
              message:
                `Completed ${payload.title}.`,
            });
  
            return {
              itemNumber:
                payload.itemNumber,
  
              title:
                payload.title,
  
              processedBy:
                context.workerId,
  
              processedAt:
                new Date(),
            };
          },
      });
  
    factory.registerWorker(
      worker
    );
  }
  
  // =========================================================
  // JOB SUBMISSION
  // =========================================================
  
  async function submitStorageTestJobs(
    factory: WonderFactory
  ): Promise<void> {
    for (
      let index = 0;
      index < TOTAL_JOBS;
      index += 1
    ) {
      const itemNumber =
        index + 1;
  
      await factory.submitJob<
        StorageTestPayload
      >({
        id:
          `storage-test-job-${String(
            itemNumber
          ).padStart(
            3,
            "0"
          )}`,
  
        batchId:
          TEST_BATCH_ID,
  
        type:
          "generation",
  
        payload: {
          itemNumber,
  
          title:
            `Persistent Wonder Item ${itemNumber}`,
  
          createdAt:
            new Date(
              Date.now() +
              itemNumber
            ),
  
          metadata: {
            category:
              "storage-test",
  
            optionalValue:
              itemNumber === 2
                ? undefined
                : `value-${itemNumber}`,
          },
        },
  
        priority:
          readPriority(
            11 -
            itemNumber
          ),
  
        totalItems: 3,
  
        maximumAttempts: 3,
  
        failureStrategy:
          "retry",
  
        metadata: {
          source:
            "sandbox/testWonderFactoryStorage",
  
          tags: [
            "sandbox",
            "storage",
            "persistence",
          ],
  
          correlationId:
            TEST_BATCH_ID,
  
          createdBy:
            "WonderLabs",
  
          values: {
            itemNumber,
  
            persisted:
              true,
          },
        },
      });
    }
  }
  
  // =========================================================
  // DATA HELPERS
  // =========================================================
  
  function findJob(
    jobs: readonly WonderJob<
      unknown,
      unknown
    >[],
    jobId: string
  ): WonderJob<
    unknown,
    unknown
  > | null {
    return (
      jobs.find(
        (job) =>
          job.id === jobId
      ) ??
      null
    );
  }
  
  function readStorageTestPayload(
    value: unknown
  ): StorageTestPayload {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        "Storage test payload must be an object."
      );
    }
  
    const record =
      value as Record<
        string,
        unknown
      >;
  
    if (
      typeof record.itemNumber !==
        "number" ||
      typeof record.title !==
        "string" ||
      !(record.createdAt instanceof Date) ||
      typeof record.metadata !==
        "object" ||
      record.metadata === null ||
      Array.isArray(
        record.metadata
      )
    ) {
      throw new Error(
        "Storage test payload is invalid."
      );
    }
  
    const metadata =
      record.metadata as Record<
        string,
        unknown
      >;
  
    if (
      typeof metadata.category !==
        "string"
    ) {
      throw new Error(
        "Storage test payload metadata is invalid."
      );
    }
  
    return {
      itemNumber:
        record.itemNumber,
  
      title:
        record.title,
  
      createdAt:
        new Date(
          record.createdAt.getTime()
        ),
  
      metadata: {
        category:
          metadata.category,
  
        optionalValue:
          typeof metadata.optionalValue ===
            "string"
            ? metadata.optionalValue
            : undefined,
      },
    };
  }
  
  function isStorageTestResult(
    value: unknown
  ): value is StorageTestResult {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      return false;
    }
  
    const record =
      value as Record<
        string,
        unknown
      >;
  
    return (
      typeof record.itemNumber ===
        "number" &&
      typeof record.title ===
        "string" &&
      typeof record.processedBy ===
        "string" &&
      record.processedAt instanceof
        Date
    );
  }
  
  function readPriority(
    value: number
  ):
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10 {
    const priority =
      Math.min(
        10,
        Math.max(
          1,
          Math.floor(value)
        )
      );
  
    return priority as
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10;
  }
  
  // =========================================================
  // ASSERTIONS
  // =========================================================
  
  function assertEqual<T>(
    actual: T,
    expected: T,
    message: string
  ): void {
    if (
      actual !== expected
    ) {
      throw new Error(
        [
          message,
          `Expected: ${String(
            expected
          )}`,
          `Actual: ${String(
            actual
          )}`,
        ].join(" ")
      );
    }
  }
  
  function assertTrue(
    value: boolean,
    message: string
  ): asserts value {
    if (!value) {
      throw new Error(message);
    }
  }
  
  function assertFalse(
    value: boolean,
    message: string
  ): void {
    if (value) {
      throw new Error(message);
    }
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function delay(
    milliseconds: number
  ): Promise<void> {
    return new Promise(
      (resolvePromise) => {
        setTimeout(
          resolvePromise,
          Math.max(
            0,
            milliseconds
          )
        );
      }
    );
  }
  
  // =========================================================
  // EXECUTION
  // =========================================================
  
  runWonderFactoryStorageTest()
    .then(
      (result) => {
        console.log(
          "Wonder Factory Storage Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Factory Storage Test Failed",
          error
        );
  
        process.exitCode = 1;
      }
    );
  
  export {
    runWonderFactoryStorageTest,
  };