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
    WonderScheduler,
  } from "@/factory/scheduler/WonderScheduler";
  
  import {
    WonderSchedulerStorage,
  } from "@/factory/storage/WonderSchedulerStorage";
  
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
  
  interface SchedulerStorageTestPayload {
    scheduleKey: string;
  
    title: string;
  
    createdAt: Date;
  
    details: {
      category: string;
  
      optionalValue?: string;
    };
  }
  
  interface SchedulerStorageTestResult {
    scheduleKey: string;
  
    title: string;
  
    processedBy: string;
  
    processedAt: Date;
  }
  
  interface WonderSchedulerStorageTestSummary {
    success: boolean;
  
    originalSchedules: number;
  
    savedSchedules: number;
  
    loadedSchedules: number;
  
    backupsCreated: number;
  
    fallbackUsed: boolean;
  
    restoredSchedules: number;
  
    recoveredSchedules: number;
  
    submittedJobs: number;
  
    completedJobs: number;
  
    failedJobs: number;
  
    queuedJobs: number;
  
    processingJobs: number;
  
    completedSchedules: number;
  
    pausedSchedules: number;
  
    onceRuns: number;
  
    catchUpRuns: number;
  
    datesPreserved: boolean;
  
    queueIdle: boolean;
  
    schedulerStatus: string;
  
    factoryStatus: string;
  
    storagePath: string;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const TEST_BATCH_ID =
    "wonder-scheduler-storage-test-001";
  
  const ONCE_SCHEDULE_ID =
    "scheduler-storage-once-001";
  
  const CATCH_UP_SCHEDULE_ID =
    "scheduler-storage-catch-up-001";
  
  const PAUSED_SCHEDULE_ID =
    "scheduler-storage-paused-001";
  
  const EXPECTED_SCHEDULES =
    3;
  
  const EXPECTED_SUBMITTED_JOBS =
    4;
  
  // =========================================================
  // TEST
  // =========================================================
  
  async function runWonderSchedulerStorageTest(): Promise<WonderSchedulerStorageTestSummary> {
    const workingDirectory =
      join(
        tmpdir(),
        `wonder-scheduler-storage-test-${Date.now()}`
      );
  
    const storagePath =
      join(
        workingDirectory,
        "state",
        "wonder-scheduler-state.json"
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
        "scheduler-storage-source-factory",
        sourceEventBus
      );
  
    const restoredFactory =
      createTestFactory(
        "scheduler-storage-restored-factory",
        restoredEventBus
      );
  
    const sourceScheduler =
      createTestScheduler(
        "scheduler-storage-source",
        sourceFactory
      );
  
    const restoredScheduler =
      createTestScheduler(
        "scheduler-storage-restored",
        restoredFactory
      );
  
    const storage =
      new WonderSchedulerStorage({
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
  
    let queuedEventCount =
      0;
  
    let completedEventCount =
      0;
  
    const queuedSubscription =
      restoredEventBus.on(
        "factory:job-queued",
        async (event) => {
          queuedEventCount +=
            1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Queued event batch ID should match."
          );
        }
      );
  
    const completedSubscription =
      restoredEventBus.on(
        "factory:job-completed",
        async (event) => {
          completedEventCount +=
            1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Completed event batch ID should match."
          );
        }
      );
  
    try {
      const baseTime =
        new Date();
  
      createSourceSchedules(
        sourceScheduler,
        baseTime
      );
  
      assertEqual(
        sourceScheduler.size(),
        EXPECTED_SCHEDULES,
        "Source Scheduler should contain three schedules."
      );
  
      const pausedSchedule =
        sourceScheduler.getSchedule(
          PAUSED_SCHEDULE_ID
        );
  
      assertEqual(
        pausedSchedule?.status,
        "paused",
        "Control schedule should be paused before persistence."
      );
  
      // =======================================================
      // FIRST SAVE
      // =======================================================
  
      const firstSave =
        await storage.save(
          sourceScheduler,
          {
            createBackup:
              true,
          }
        );
  
      assertTrue(
        firstSave.success,
        "First Scheduler save should succeed."
      );
  
      assertEqual(
        firstSave.scheduleCount,
        EXPECTED_SCHEDULES,
        "First save should contain every schedule."
      );
  
      // =======================================================
      // SECOND SAVE CREATES BACKUP
      // =======================================================
  
      const secondSave =
        await storage.save(
          sourceScheduler,
          {
            createBackup:
              true,
          }
        );
  
      assertTrue(
        secondSave.success,
        "Second Scheduler save should succeed."
      );
  
      assertTrue(
        secondSave.backupPath !==
          null,
        "Second save should create a Scheduler backup."
      );
  
      const initialStorageStatistics =
        await storage.getStatistics();
  
      assertTrue(
        initialStorageStatistics.exists,
        "Scheduler state file should exist."
      );
  
      assertTrue(
        initialStorageStatistics.backupCount >=
          1,
        "At least one Scheduler backup should exist."
      );
  
      // =======================================================
      // LOAD PRIMARY
      // =======================================================
  
      const primaryLoad =
        await storage.load();
  
      assertTrue(
        primaryLoad.success,
        "Primary Scheduler state should load."
      );
  
      assertFalse(
        primaryLoad.usedBackup,
        "Healthy primary Scheduler state should not use a backup."
      );
  
      assertEqual(
        primaryLoad.state
          .snapshot.schedules.length,
        EXPECTED_SCHEDULES,
        "Loaded Scheduler state should contain three schedules."
      );
  
      const loadedOnceSchedule =
        findSchedule(
          primaryLoad.state
            .snapshot.schedules,
          ONCE_SCHEDULE_ID
        );
  
      assertTrue(
        loadedOnceSchedule !==
          null,
        "Persisted once schedule should exist."
      );
  
      const loadedPayload =
        readSchedulerStoragePayload(
          loadedOnceSchedule
            ?.job.payload
        );
  
      assertTrue(
        loadedPayload.createdAt instanceof
          Date,
        "Date inside a scheduled payload should remain a Date."
      );
  
      // =======================================================
      // CORRUPT PRIMARY AND FALL BACK TO BACKUP
      // =======================================================
  
      await writeFile(
        storage.getPath(),
        "{ intentionally invalid scheduler JSON",
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
        "Scheduler storage should fall back to its latest backup."
      );
  
      assertTrue(
        fallbackLoad.usedBackup,
        "Corrupt primary state should trigger backup fallback."
      );
  
      assertEqual(
        fallbackLoad.state
          .snapshot.schedules.length,
        EXPECTED_SCHEDULES,
        "Backup should contain every Scheduler schedule."
      );
  
      // =======================================================
      // RESTORE TO A NEW SCHEDULER
      // =======================================================
  
      const recoveryDate =
        new Date(
          baseTime.getTime() +
            1_000
        );
  
      const restoreResult =
        await storage.restore(
          restoredScheduler,
          {
            replaceExisting:
              true,
  
            recoverOverdueSchedules:
              true,
  
            recoveryDate,
          }
        );
  
      assertTrue(
        restoreResult.success,
        "Scheduler restore should succeed."
      );
  
      assertTrue(
        restoreResult.usedBackup,
        "Scheduler restore should use the valid backup."
      );
  
      assertEqual(
        restoreResult.importedSchedules,
        EXPECTED_SCHEDULES,
        "Restore should import all Scheduler schedules."
      );
  
      assertEqual(
        restoreResult.skippedSchedules,
        0,
        "No Scheduler schedules should be skipped."
      );
  
      assertEqual(
        restoreResult.recoveredSchedules,
        2,
        "The overdue once and catch-up schedules should be recovered."
      );
  
      assertEqual(
        restoredScheduler.size(),
        EXPECTED_SCHEDULES,
        "Restored Scheduler should contain three schedules."
      );
  
      const restoredOnceSchedule =
        restoredScheduler.getSchedule(
          ONCE_SCHEDULE_ID
        );
  
      const restoredCatchUpSchedule =
        restoredScheduler.getSchedule(
          CATCH_UP_SCHEDULE_ID
        );
  
      const restoredPausedSchedule =
        restoredScheduler.getSchedule(
          PAUSED_SCHEDULE_ID
        );
  
      assertEqual(
        restoredOnceSchedule?.status,
        "active",
        "Recovered once schedule should remain active until submitted."
      );
  
      assertEqual(
        restoredCatchUpSchedule?.status,
        "active",
        "Recovered catch-up schedule should remain active."
      );
  
      assertEqual(
        restoredPausedSchedule?.status,
        "paused",
        "Paused schedule should remain paused after restoration."
      );
  
      assertTrue(
        typeof restoredOnceSchedule
          ?.metadata.restartRecovery ===
          "object",
        "Recovered once schedule should record restart metadata."
      );
  
      assertTrue(
        typeof restoredCatchUpSchedule
          ?.metadata.restartRecovery ===
          "object",
        "Recovered catch-up schedule should record restart metadata."
      );
  
      assertEqual(
        restoredPausedSchedule
          ?.metadata.restartRecovery,
        undefined,
        "Paused schedule should not be marked as recovered."
      );
  
      const restoredPayload =
        readSchedulerStoragePayload(
          restoredCatchUpSchedule
            ?.job.payload
        );
  
      assertTrue(
        restoredPayload.createdAt instanceof
          Date,
        "Restored scheduled payload should preserve Date values."
      );
  
      // =======================================================
      // REGISTER WORKERS
      // =======================================================
  
      registerWorkers(
        restoredFactory
      );
  
      assertEqual(
        restoredFactory.listWorkers()
          .length,
        2,
        "Restored Factory should contain two workers."
      );
  
      // =======================================================
      // START FACTORY AND SCHEDULER
      // =======================================================
  
      await restoredFactory.start({
        automaticPolling:
          false,
      });
  
      await restoredScheduler.start({
        automaticPolling:
          false,
  
        startFactoryIfNeeded:
          false,
      });
  
      // =======================================================
      // PROCESS RECOVERED SCHEDULES
      // =======================================================
  
      const schedulerTick =
        await restoredScheduler.tick(
          recoveryDate
        );
  
      /*
       * Expected:
       *
       * overdue once:
       *   1 job
       *
       * overdue catch-up interval:
       *   3 jobs
       *
       * paused schedule:
       *   0 jobs
       */
      assertEqual(
        schedulerTick.submittedJobs,
        EXPECTED_SUBMITTED_JOBS,
        "Recovered Scheduler tick should submit four jobs."
      );
  
      assertEqual(
        schedulerTick.failures.length,
        0,
        "Recovered Scheduler tick should have no submission failures."
      );
  
      assertEqual(
        queuedEventCount,
        EXPECTED_SUBMITTED_JOBS,
        "Every recovered occurrence should emit a queued event."
      );
  
      const onceAfterTick =
        restoredScheduler.getSchedule(
          ONCE_SCHEDULE_ID
        );
  
      const catchUpAfterTick =
        restoredScheduler.getSchedule(
          CATCH_UP_SCHEDULE_ID
        );
  
      const pausedAfterTick =
        restoredScheduler.getSchedule(
          PAUSED_SCHEDULE_ID
        );
  
      assertEqual(
        onceAfterTick?.status,
        "completed",
        "Recovered once schedule should complete after submission."
      );
  
      assertEqual(
        onceAfterTick?.runCount,
        1,
        "Recovered once schedule should run exactly once."
      );
  
      assertEqual(
        catchUpAfterTick?.status,
        "completed",
        "Recovered catch-up schedule should complete after maximumRuns."
      );
  
      assertEqual(
        catchUpAfterTick?.runCount,
        3,
        "Recovered catch-up schedule should submit all three missed runs."
      );
  
      assertEqual(
        pausedAfterTick?.status,
        "paused",
        "Paused schedule should remain paused after ticking."
      );
  
      // =======================================================
      // PROCESS FACTORY QUEUE
      // =======================================================
  
      const factoryRun =
        await restoredFactory
          .runUntilIdle({
            maximumTicks: 30,
  
            timeoutMilliseconds:
              15_000,
  
            intervalMilliseconds:
              0,
  
            maximumIdleTicks:
              5,
  
            startIfNeeded:
              false,
          });
  
      assertTrue(
        factoryRun.success,
        [
          "Restored Factory should process every recovered job.",
          ...factoryRun.errors,
        ].join(" ")
      );
  
      assertTrue(
        factoryRun.idle,
        "Restored Factory queue should become idle."
      );
  
      const queueStatistics =
        restoredFactory
          .getQueue()
          .getStatistics();
  
      assertEqual(
        queueStatistics.totalJobs,
        EXPECTED_SUBMITTED_JOBS,
        "Factory queue should contain four restored jobs."
      );
  
      assertEqual(
        queueStatistics.completedJobs,
        EXPECTED_SUBMITTED_JOBS,
        "All recovered scheduled jobs should complete."
      );
  
      assertEqual(
        queueStatistics.failedJobs,
        0,
        "No recovered scheduled jobs should remain failed."
      );
  
      assertEqual(
        queueStatistics.queuedJobs,
        0,
        "No recovered scheduled jobs should remain queued."
      );
  
      assertEqual(
        queueStatistics.processingJobs,
        0,
        "No recovered scheduled jobs should remain processing."
      );
  
      assertEqual(
        completedEventCount,
        EXPECTED_SUBMITTED_JOBS,
        "Every recovered scheduled job should emit a completion event."
      );
  
      // =======================================================
      // VERIFY RESULTS
      // =======================================================
  
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
          isSchedulerStorageResult
        ),
        "Every completed job should contain a valid Scheduler result."
      );
  
      assertTrue(
        completedResults.every(
          (result) =>
            result.processedAt instanceof
              Date
        ),
        "Every completed result should contain a Date."
      );
  
      const persistedPayloadDates =
        completedJobs.map(
          (job) =>
            readSchedulerStoragePayload(
              job.payload
            ).createdAt
        );
  
      assertTrue(
        persistedPayloadDates.every(
          (date) =>
            date instanceof Date &&
            !Number.isNaN(
              date.getTime()
            )
        ),
        "All restored scheduled payload Dates should remain valid."
      );
  
      const onceResults =
        completedResults.filter(
          (
            result
          ): result is SchedulerStorageTestResult =>
            isSchedulerStorageResult(
              result
            ) &&
            result.scheduleKey ===
              "once"
        );
  
      const catchUpResults =
        completedResults.filter(
          (
            result
          ): result is SchedulerStorageTestResult =>
            isSchedulerStorageResult(
              result
            ) &&
            result.scheduleKey ===
              "catch-up"
        );
  
      assertEqual(
        onceResults.length,
        1,
        "Once schedule should produce one result."
      );
  
      assertEqual(
        catchUpResults.length,
        3,
        "Catch-up schedule should produce three results."
      );
  
      // =======================================================
      // FINAL STATISTICS
      // =======================================================
  
      const schedulerStatistics =
        restoredScheduler
          .getStatistics();
  
      assertEqual(
        schedulerStatistics
          .totalSchedules,
        EXPECTED_SCHEDULES,
        "Restored Scheduler should report three schedules."
      );
  
      assertEqual(
        schedulerStatistics
          .completedSchedules,
        2,
        "Two restored schedules should be completed."
      );
  
      assertEqual(
        schedulerStatistics
          .pausedSchedules,
        1,
        "One restored schedule should remain paused."
      );
  
      assertEqual(
        schedulerStatistics
          .errorSchedules,
        0,
        "No restored schedules should be in error."
      );
  
      assertEqual(
        schedulerStatistics
          .successfulRuns,
        EXPECTED_SUBMITTED_JOBS,
        "Scheduler should record four successful submissions."
      );
  
      // =======================================================
      // SHUTDOWN
      // =======================================================
  
      await restoredScheduler.stop({
        stopFactory:
          true,
  
        gracefulFactoryStop:
          true,
      });
  
      assertEqual(
        restoredScheduler.getStatus(),
        "stopped",
        "Restored Scheduler should stop cleanly."
      );
  
      assertEqual(
        restoredFactory.getStatus(),
        "stopped",
        "Restored Factory should stop cleanly."
      );
  
      const finalStorageStatistics =
        await storage.getStatistics();
  
      return {
        success: true,
  
        originalSchedules:
          sourceScheduler.size(),
  
        savedSchedules:
          secondSave.scheduleCount,
  
        loadedSchedules:
          primaryLoad.state
            .snapshot.schedules.length,
  
        backupsCreated:
          finalStorageStatistics
            .backupCount,
  
        fallbackUsed:
          fallbackLoad.usedBackup,
  
        restoredSchedules:
          restoreResult
            .importedSchedules,
  
        recoveredSchedules:
          restoreResult
            .recoveredSchedules,
  
        submittedJobs:
          schedulerTick
            .submittedJobs,
  
        completedJobs:
          queueStatistics
            .completedJobs,
  
        failedJobs:
          queueStatistics
            .failedJobs,
  
        queuedJobs:
          queueStatistics
            .queuedJobs,
  
        processingJobs:
          queueStatistics
            .processingJobs,
  
        completedSchedules:
          schedulerStatistics
            .completedSchedules,
  
        pausedSchedules:
          schedulerStatistics
            .pausedSchedules,
  
        onceRuns:
          onceAfterTick
            ?.runCount ??
          0,
  
        catchUpRuns:
          catchUpAfterTick
            ?.runCount ??
          0,
  
        datesPreserved:
          persistedPayloadDates.every(
            (date) =>
              date instanceof Date
          ),
  
        queueIdle:
          factoryRun.idle,
  
        schedulerStatus:
          restoredScheduler
            .getStatus(),
  
        factoryStatus:
          restoredFactory
            .getStatus(),
  
        storagePath:
          storage.getPath(),
      };
    } finally {
      queuedSubscription.unsubscribe();
  
      completedSubscription.unsubscribe();
  
      if (
        sourceScheduler.getStatus() ===
          "running" ||
        sourceScheduler.getStatus() ===
          "paused" ||
        sourceScheduler.getStatus() ===
          "error"
      ) {
        await sourceScheduler.stop({
          stopFactory:
            false,
        });
      }
  
      if (
        restoredScheduler.getStatus() ===
          "running" ||
        restoredScheduler.getStatus() ===
          "paused" ||
        restoredScheduler.getStatus() ===
          "error"
      ) {
        await restoredScheduler.stop({
          stopFactory:
            false,
        });
      }
  
      if (
        sourceFactory.getStatus() ===
          "running" ||
        sourceFactory.getStatus() ===
          "paused" ||
        sourceFactory.getStatus() ===
          "error"
      ) {
        await sourceFactory.stop({
          graceful:
            false,
  
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
          graceful:
            false,
  
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
          `Scheduler Storage Test ${id}`,
  
        maximumConcurrentJobs:
          2,
  
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
  
  function createTestScheduler(
    id: string,
    factory: WonderFactory
  ): WonderScheduler {
    return new WonderScheduler(
      factory,
      {
        id,
  
        name:
          `Scheduler Storage Test ${id}`,
  
        pollingIntervalMilliseconds:
          10,
  
        maximumSubmissionsPerTick:
          100,
  
        startFactoryIfNeeded:
          false,
  
        continueOnSubmissionError:
          true,
  
        automaticPolling:
          false,
      }
    );
  }
  
  // =========================================================
  // SCHEDULE CREATION
  // =========================================================
  
  function createSourceSchedules(
    scheduler: WonderScheduler,
    baseTime: Date
  ): void {
    scheduler.createOnceSchedule<
      SchedulerStorageTestPayload
    >({
      id:
        ONCE_SCHEDULE_ID,
  
      name:
        "Persistent Once Schedule",
  
      runAt:
        new Date(
          baseTime.getTime() -
            500
        ),
  
      job:
        createJobTemplate(
          "once",
          "Persistent Once Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "scheduler-storage",
        "once",
      ],
  
      metadata: {
        storageTest:
          true,
  
        scheduleKey:
          "once",
      },
    });
  
    scheduler.createIntervalSchedule<
      SchedulerStorageTestPayload
    >({
      id:
        CATCH_UP_SCHEDULE_ID,
  
      name:
        "Persistent Catch-Up Schedule",
  
      startAt:
        new Date(
          baseTime.getTime() -
            300
        ),
  
      intervalMilliseconds:
        100,
  
      maximumRuns: 3,
  
      misfirePolicy:
        "catch-up",
  
      job:
        createJobTemplate(
          "catch-up",
          "Persistent Catch-Up Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "scheduler-storage",
        "catch-up",
      ],
  
      metadata: {
        storageTest:
          true,
  
        scheduleKey:
          "catch-up",
      },
    });
  
    scheduler.createIntervalSchedule<
      SchedulerStorageTestPayload
    >({
      id:
        PAUSED_SCHEDULE_ID,
  
      name:
        "Persistent Paused Schedule",
  
      enabled: false,
  
      startAt:
        new Date(
          baseTime.getTime() -
            200
        ),
  
      intervalMilliseconds:
        100,
  
      maximumRuns: 2,
  
      misfirePolicy:
        "run-once",
  
      job:
        createJobTemplate(
          "paused",
          "Persistent Paused Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "scheduler-storage",
        "paused",
      ],
  
      metadata: {
        storageTest:
          true,
  
        scheduleKey:
          "paused",
      },
    });
  }
  
  function createJobTemplate(
    scheduleKey: string,
    title: string,
    createdAt: Date
  ) {
    return {
      batchId:
        TEST_BATCH_ID,
  
      type:
        "generation" as const,
  
      payload: {
        scheduleKey,
  
        title,
  
        createdAt:
          new Date(
            createdAt.getTime()
          ),
  
        details: {
          category:
            "scheduler-storage",
  
          optionalValue:
            scheduleKey ===
              "catch-up"
              ? undefined
              : `value-${scheduleKey}`,
        },
      },
  
      priority:
        5 as const,
  
      totalItems: 2,
  
      maximumAttempts: 3,
  
      failureStrategy:
        "retry" as const,
  
      metadata: {
        source:
          "sandbox/testWonderSchedulerStorage",
  
        tags: [
          "scheduler-storage-test",
          scheduleKey,
        ],
  
        correlationId:
          TEST_BATCH_ID,
  
        createdBy:
          "WonderLabs",
  
        values: {
          scheduleKey,
  
          persisted:
            true,
        },
      },
    };
  }
  
  // =========================================================
  // WORKERS
  // =========================================================
  
  function registerWorkers(
    factory: WonderFactory
  ): void {
    for (
      let index = 1;
      index <= 2;
      index += 1
    ) {
      const worker =
        new WonderWorker({
          id:
            `scheduler-storage-worker-${String(
              index
            ).padStart(
              3,
              "0"
            )}`,
  
          name:
            `Scheduler Storage Worker ${index}`,
  
          capabilities: [
            "generation",
          ],
  
          executor:
            async (
              job,
              context
            ): Promise<SchedulerStorageTestResult> => {
              const payload =
                readSchedulerStoragePayload(
                  job.payload
                );
  
              await context.reportProgress({
                completedItems: 1,
  
                totalItems: 2,
  
                message:
                  `Processing ${payload.title}.`,
              });
  
              await delay(2);
  
              await context.reportProgress({
                completedItems: 2,
  
                totalItems: 2,
  
                message:
                  `Completed ${payload.title}.`,
              });
  
              return {
                scheduleKey:
                  payload.scheduleKey,
  
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
  }
  
  // =========================================================
  // DATA HELPERS
  // =========================================================
  
  function findSchedule(
    schedules:
      readonly ReturnType<
        WonderScheduler["listSchedules"]
      >[number][],
    scheduleId: string
  ) {
    return (
      schedules.find(
        (schedule) =>
          schedule.id ===
          scheduleId
      ) ??
      null
    );
  }
  
  function readSchedulerStoragePayload(
    value: unknown
  ): SchedulerStorageTestPayload {
    if (
      typeof value !==
        "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        "Scheduler storage payload must be an object."
      );
    }
  
    const record =
      value as Record<
        string,
        unknown
      >;
  
    if (
      typeof record.scheduleKey !==
        "string" ||
      typeof record.title !==
        "string" ||
      !(record.createdAt instanceof Date) ||
      typeof record.details !==
        "object" ||
      record.details === null ||
      Array.isArray(
        record.details
      )
    ) {
      throw new Error(
        "Scheduler storage payload is invalid."
      );
    }
  
    const details =
      record.details as Record<
        string,
        unknown
      >;
  
    if (
      typeof details.category !==
        "string"
    ) {
      throw new Error(
        "Scheduler storage payload details are invalid."
      );
    }
  
    return {
      scheduleKey:
        record.scheduleKey,
  
      title:
        record.title,
  
      createdAt:
        new Date(
          record.createdAt.getTime()
        ),
  
      details: {
        category:
          details.category,
  
        optionalValue:
          typeof details.optionalValue ===
            "string"
            ? details.optionalValue
            : undefined,
      },
    };
  }
  
  function isSchedulerStorageResult(
    value: unknown
  ): value is SchedulerStorageTestResult {
    if (
      typeof value !==
        "object" ||
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
      typeof record.scheduleKey ===
        "string" &&
      typeof record.title ===
        "string" &&
      typeof record.processedBy ===
        "string" &&
      record.processedAt instanceof
        Date
    );
  }
  
  // Prevent strict noUnusedLocals failures if this project
  // enables them while preserving a useful typed helper.
  function findJobByScheduleId(
    jobs: readonly WonderJob<
      unknown,
      unknown
    >[],
    scheduleId: string
  ): WonderJob<
    unknown,
    unknown
  > | null {
    return (
      jobs.find(
        (job) =>
          job.metadata.values
            .scheduleId ===
          scheduleId
      ) ??
      null
    );
  }
  
  void findJobByScheduleId;
  
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
  
  runWonderSchedulerStorageTest()
    .then(
      (result) => {
        console.log(
          "Wonder Scheduler Storage Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Scheduler Storage Test Failed",
          error
        );
  
        process.exitCode = 1;
      }
    );
  
  export {
    runWonderSchedulerStorageTest,
  };