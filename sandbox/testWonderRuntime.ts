import {
    mkdir,
    rm,
  } from "node:fs/promises";
  
  import {
    tmpdir,
  } from "node:os";
  
  import {
    join,
  } from "node:path";
  
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
    WonderRuntime,
  } from "@/factory/runtime/WonderRuntime";
  
  import {
    WonderScheduler,
  } from "@/factory/scheduler/WonderScheduler";
  
  import {
    WonderFactoryStorage,
  } from "@/factory/storage/WonderFactoryStorage";
  
  import {
    WonderSchedulerStorage,
  } from "@/factory/storage/WonderSchedulerStorage";
  
  import {
    WonderWorker,
    WonderWorkerRegistry,
  } from "@/factory/workers/WonderWorker";
  
  // =========================================================
  // TEST TYPES
  // =========================================================
  
  interface RuntimeTestPayload {
    scheduleKey: string;
  
    title: string;
  
    createdAt: Date;
  }
  
  interface RuntimeTestResult {
    scheduleKey: string;
  
    title: string;
  
    processedBy: string;
  
    processedAt: Date;
  }
  
  interface WonderRuntimeTestSummary {
    success: boolean;
  
    sourceBooted: boolean;
  
    sourceRuntimeStatus: string;
  
    sourceFactoryStatus: string;
  
    sourceSchedulerStatus: string;
  
    sourceSchedules: number;
  
    sourceSubmittedJobs: number;
  
    sourceCompletedJobs: number;
  
    sourceFailedJobs: number;
  
    sourceQueueIdle: boolean;
  
    runtimePaused: boolean;
  
    runtimeResumed: boolean;
  
    manualSaveSucceeded: boolean;
  
    shutdownSaveSucceeded: boolean;
  
    factoryStateExists: boolean;
  
    schedulerStateExists: boolean;
  
    restoredBooted: boolean;
  
    factoryRestored: boolean;
  
    schedulerRestored: boolean;
  
    restoredJobs: number;
  
    restoredSchedules: number;
  
    restoredCompletedJobs: number;
  
    restoredPayloadDatesPreserved: boolean;
  
    restoredRuntimeHealthy: boolean;
  
    restoredRuntimeStatus: string;
  
    restoredFactoryStatus: string;
  
    restoredSchedulerStatus: string;
  
    storageDirectory: string;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const TEST_BATCH_ID =
    "wonder-runtime-test-batch-001";
  
  const ONCE_SCHEDULE_ID =
    "runtime-once-schedule-001";
  
  const INTERVAL_SCHEDULE_ID =
    "runtime-interval-schedule-001";
  
  const EXPECTED_SCHEDULES =
    2;
  
  const EXPECTED_JOBS =
    3;
  
  // =========================================================
  // TEST
  // =========================================================
  
  async function runWonderRuntimeTest(): Promise<WonderRuntimeTestSummary> {
    const workingDirectory =
      join(
        tmpdir(),
        `wonder-runtime-test-${Date.now()}`
      );
  
    const factoryStoragePath =
      join(
        workingDirectory,
        "state",
        "factory-state.json"
      );
  
    const schedulerStoragePath =
      join(
        workingDirectory,
        "state",
        "scheduler-state.json"
      );
  
    await mkdir(
      workingDirectory,
      {
        recursive: true,
      }
    );
  
    const sourceSystem =
      createRuntimeSystem(
        "source",
        workingDirectory,
        factoryStoragePath,
        schedulerStoragePath
      );
  
    const restoredSystem =
      createRuntimeSystem(
        "restored",
        workingDirectory,
        factoryStoragePath,
        schedulerStoragePath
      );
  
    let sourceBooted =
      false;
  
    let restoredBooted =
      false;
  
    try {
      // =======================================================
      // SOURCE RUNTIME
      // =======================================================
  
      registerRuntimeWorkers(
        sourceSystem.factory,
        "source"
      );
  
      const sourceBootResult =
        await sourceSystem.runtime.boot({
          restoreFactory:
            false,
  
          restoreScheduler:
            false,
  
          startFactory:
            true,
  
          startScheduler:
            true,
  
          automaticFactoryPolling:
            false,
  
          automaticSchedulerPolling:
            false,
  
          startAutoSave:
            false,
        });
  
      sourceBooted =
        sourceBootResult.success;
  
      assertTrue(
        sourceBootResult.success,
        "Source Runtime should boot successfully."
      );
  
      assertEqual(
        sourceSystem.runtime.getStatus(),
        "running",
        "Source Runtime should be running."
      );
  
      assertEqual(
        sourceSystem.factory.getStatus(),
        "running",
        "Source Factory should be running."
      );
  
      assertEqual(
        sourceSystem.scheduler.getStatus(),
        "running",
        "Source Scheduler should be running."
      );
  
      // =======================================================
      // PAUSE AND RESUME
      // =======================================================
  
      const pauseResult =
        sourceSystem.runtime.pause();
  
      assertTrue(
        pauseResult.success,
        "Runtime should pause successfully."
      );
  
      assertEqual(
        sourceSystem.runtime.getStatus(),
        "paused",
        "Runtime status should become paused."
      );
  
      assertEqual(
        sourceSystem.factory.getStatus(),
        "paused",
        "Factory should pause with Runtime."
      );
  
      assertEqual(
        sourceSystem.scheduler.getStatus(),
        "paused",
        "Scheduler should pause with Runtime."
      );
  
      const runtimePaused =
        sourceSystem.runtime.isPaused();
  
      const resumeResult =
        sourceSystem.runtime.resume();
  
      assertTrue(
        resumeResult.success,
        "Runtime should resume successfully."
      );
  
      assertEqual(
        sourceSystem.runtime.getStatus(),
        "running",
        "Runtime should return to running."
      );
  
      assertEqual(
        sourceSystem.factory.getStatus(),
        "running",
        "Factory should resume with Runtime."
      );
  
      assertEqual(
        sourceSystem.scheduler.getStatus(),
        "running",
        "Scheduler should resume with Runtime."
      );
  
      const runtimeResumed =
        sourceSystem.runtime.isRunning();
  
      // =======================================================
      // SCHEDULE JOBS
      // =======================================================
  
      const baseTime =
        new Date();
  
      createRuntimeSchedules(
        sourceSystem.scheduler,
        baseTime
      );
  
      assertEqual(
        sourceSystem.scheduler.size(),
        EXPECTED_SCHEDULES,
        "Runtime Scheduler should contain two schedules."
      );
  
      const schedulerTick =
        await sourceSystem.scheduler.tick(
          baseTime
        );
  
      assertEqual(
        schedulerTick.submittedJobs,
        EXPECTED_JOBS,
        "Scheduler should submit three jobs."
      );
  
      assertEqual(
        schedulerTick.failures.length,
        0,
        "Scheduler tick should not contain failures."
      );
  
      // =======================================================
      // PROCESS FACTORY QUEUE
      // =======================================================
  
      const factoryRun =
        await sourceSystem.factory.runUntilIdle({
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
          "Source Factory should process all Runtime jobs.",
          ...factoryRun.errors,
        ].join(" ")
      );
  
      assertTrue(
        factoryRun.idle,
        "Source Factory queue should become idle."
      );
  
      const sourceQueueStatistics =
        sourceSystem.factory
          .getQueue()
          .getStatistics();
  
      const sourceSchedulerStatistics =
        sourceSystem.scheduler
          .getStatistics();
  
      assertEqual(
        sourceQueueStatistics.totalJobs,
        EXPECTED_JOBS,
        "Source queue should contain three jobs."
      );
  
      assertEqual(
        sourceQueueStatistics.completedJobs,
        EXPECTED_JOBS,
        "Every Runtime job should complete."
      );
  
      assertEqual(
        sourceQueueStatistics.failedJobs,
        0,
        "No Runtime jobs should remain failed."
      );
  
      assertEqual(
        sourceQueueStatistics.queuedJobs,
        0,
        "No Runtime jobs should remain queued."
      );
  
      assertEqual(
        sourceQueueStatistics.processingJobs,
        0,
        "No Runtime jobs should remain processing."
      );
  
      assertEqual(
        sourceSchedulerStatistics.completedSchedules,
        EXPECTED_SCHEDULES,
        "Both Runtime schedules should complete."
      );
  
      assertEqual(
        sourceSchedulerStatistics.successfulRuns,
        EXPECTED_JOBS,
        "Scheduler should record three successful runs."
      );
  
      // =======================================================
      // VERIFY RESULTS
      // =======================================================
  
      const completedJobs =
        sourceSystem.factory
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
          isRuntimeTestResult
        ),
        "Every completed Runtime job should contain a valid result."
      );
  
      assertTrue(
        completedResults.every(
          (result) =>
            result.processedAt instanceof
            Date
        ),
        "Every Runtime result should contain a Date."
      );
  
      // =======================================================
      // MANUAL SAVE
      // =======================================================
  
      const manualSaveResult =
        await sourceSystem.runtime.save({
          saveFactory:
            true,
  
          saveScheduler:
            true,
  
          createBackup:
            true,
        });
  
      assertTrue(
        manualSaveResult.success,
        [
          "Runtime manual save should succeed.",
          ...manualSaveResult.errors,
        ].join(" ")
      );
  
      assertTrue(
        manualSaveResult.factory !==
          null,
        "Runtime save should persist Factory state."
      );
  
      assertTrue(
        manualSaveResult.scheduler !==
          null,
        "Runtime save should persist Scheduler state."
      );
  
      const sourceStatistics =
        await sourceSystem.runtime
          .getStatistics();
  
      assertTrue(
        sourceStatistics
          .factoryStorage.exists,
        "Factory state file should exist after save."
      );
  
      assertTrue(
        sourceStatistics
          .schedulerStorage.exists,
        "Scheduler state file should exist after save."
      );
  
      const sourceHealth =
        await sourceSystem.runtime
          .getHealthReport();
  
      assertTrue(
        sourceHealth.healthy,
        "Source Runtime health report should be healthy."
      );
  
      // =======================================================
      // SOURCE SHUTDOWN
      // =======================================================
  
      const sourceShutdownResult =
        await sourceSystem.runtime.shutdown({
          graceful:
            true,
  
          timeoutMilliseconds:
            5_000,
  
          saveState:
            true,
  
          cancelActiveJobsOnTimeout:
            true,
        });
  
      assertTrue(
        sourceShutdownResult.success,
        [
          "Source Runtime should shut down successfully.",
          ...sourceShutdownResult.errors,
        ].join(" ")
      );
  
      assertTrue(
        sourceShutdownResult.stateSaved,
        "Source Runtime should save final state during shutdown."
      );
  
      assertEqual(
        sourceSystem.runtime.getStatus(),
        "stopped",
        "Source Runtime should be stopped."
      );
  
      assertEqual(
        sourceSystem.factory.getStatus(),
        "stopped",
        "Source Factory should be stopped."
      );
  
      assertEqual(
        sourceSystem.scheduler.getStatus(),
        "stopped",
        "Source Scheduler should be stopped."
      );
  
      // =======================================================
      // RESTORED RUNTIME
      // =======================================================
  
      registerRuntimeWorkers(
        restoredSystem.factory,
        "restored"
      );
  
      const restoredBootResult =
        await restoredSystem.runtime.boot({
          restoreFactory:
            true,
  
          restoreScheduler:
            true,
  
          recoverProcessingJobs:
            true,
  
          recoverOverdueSchedules:
            true,
  
          startFactory:
            true,
  
          startScheduler:
            true,
  
          automaticFactoryPolling:
            false,
  
          automaticSchedulerPolling:
            false,
  
          startAutoSave:
            false,
        });
  
      restoredBooted =
        restoredBootResult.success;
  
      assertTrue(
        restoredBootResult.success,
        "Restored Runtime should boot successfully."
      );
  
      assertTrue(
        restoredBootResult.factoryRestored,
        "Restored Runtime should restore Factory state."
      );
  
      assertTrue(
        restoredBootResult.schedulerRestored,
        "Restored Runtime should restore Scheduler state."
      );
  
      assertTrue(
        restoredBootResult.factoryStarted,
        "Restored Factory should start."
      );
  
      assertTrue(
        restoredBootResult.schedulerStarted,
        "Restored Scheduler should start."
      );
  
      assertEqual(
        restoredSystem.runtime.getStatus(),
        "running",
        "Restored Runtime should be running."
      );
  
      const restoredQueueStatistics =
        restoredSystem.factory
          .getQueue()
          .getStatistics();
  
      const restoredSchedulerStatistics =
        restoredSystem.scheduler
          .getStatistics();
  
      assertEqual(
        restoredQueueStatistics.totalJobs,
        EXPECTED_JOBS,
        "Restored Factory should contain all persisted jobs."
      );
  
      assertEqual(
        restoredQueueStatistics.completedJobs,
        EXPECTED_JOBS,
        "Restored jobs should retain completed status."
      );
  
      assertEqual(
        restoredSchedulerStatistics.totalSchedules,
        EXPECTED_SCHEDULES,
        "Restored Scheduler should contain both schedules."
      );
  
      assertEqual(
        restoredSchedulerStatistics.completedSchedules,
        EXPECTED_SCHEDULES,
        "Restored schedules should retain completed status."
      );
  
      // =======================================================
      // VERIFY RESTORED DATE VALUES
      // =======================================================
  
      const restoredSchedules =
        restoredSystem.scheduler
          .listSchedules();
  
      const restoredPayloadDates =
        restoredSchedules.map(
          (schedule) =>
            readRuntimePayload(
              schedule.job.payload
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
        "Persisted Runtime payload Dates should survive restoration."
      );
  
      const restoredHealth =
        await restoredSystem.runtime
          .getHealthReport();
  
      assertTrue(
        restoredHealth.healthy,
        "Restored Runtime health report should be healthy."
      );
  
      const restoredSnapshot =
        restoredSystem.runtime
          .getSnapshot();
  
      assertEqual(
        restoredSnapshot.factory
          .queue.completedJobs,
        EXPECTED_JOBS,
        "Runtime snapshot should report all completed jobs."
      );
  
      assertEqual(
        restoredSnapshot.scheduler
          .schedules.length,
        EXPECTED_SCHEDULES,
        "Runtime snapshot should contain restored schedules."
      );
  
      // =======================================================
      // RESTORED SHUTDOWN
      // =======================================================
  
      const restoredShutdownResult =
        await restoredSystem.runtime.shutdown({
          graceful:
            true,
  
          timeoutMilliseconds:
            5_000,
  
          saveState:
            false,
  
          cancelActiveJobsOnTimeout:
            true,
        });
  
      assertTrue(
        restoredShutdownResult.success,
        [
          "Restored Runtime should shut down successfully.",
          ...restoredShutdownResult.errors,
        ].join(" ")
      );
  
      assertEqual(
        restoredSystem.runtime.getStatus(),
        "stopped",
        "Restored Runtime should stop cleanly."
      );
  
      return {
        success: true,
  
        sourceBooted,
  
        sourceRuntimeStatus:
          sourceSystem.runtime
            .getStatus(),
  
        sourceFactoryStatus:
          sourceSystem.factory
            .getStatus(),
  
        sourceSchedulerStatus:
          sourceSystem.scheduler
            .getStatus(),
  
        sourceSchedules:
          sourceSchedulerStatistics
            .totalSchedules,
  
        sourceSubmittedJobs:
          sourceSchedulerStatistics
            .submittedJobCount,
  
        sourceCompletedJobs:
          sourceQueueStatistics
            .completedJobs,
  
        sourceFailedJobs:
          sourceQueueStatistics
            .failedJobs,
  
        sourceQueueIdle:
          factoryRun.idle,
  
        runtimePaused,
  
        runtimeResumed,
  
        manualSaveSucceeded:
          manualSaveResult.success,
  
        shutdownSaveSucceeded:
          sourceShutdownResult
            .stateSaved,
  
        factoryStateExists:
          sourceStatistics
            .factoryStorage.exists,
  
        schedulerStateExists:
          sourceStatistics
            .schedulerStorage.exists,
  
        restoredBooted,
  
        factoryRestored:
          restoredBootResult
            .factoryRestored,
  
        schedulerRestored:
          restoredBootResult
            .schedulerRestored,
  
        restoredJobs:
          restoredQueueStatistics
            .totalJobs,
  
        restoredSchedules:
          restoredSchedulerStatistics
            .totalSchedules,
  
        restoredCompletedJobs:
          restoredQueueStatistics
            .completedJobs,
  
        restoredPayloadDatesPreserved:
          restoredPayloadDates.every(
            (date) =>
              date instanceof Date
          ),
  
        restoredRuntimeHealthy:
          restoredHealth.healthy,
  
        restoredRuntimeStatus:
          restoredSystem.runtime
            .getStatus(),
  
        restoredFactoryStatus:
          restoredSystem.factory
            .getStatus(),
  
        restoredSchedulerStatus:
          restoredSystem.scheduler
            .getStatus(),
  
        storageDirectory:
          workingDirectory,
      };
    } finally {
      await safelyStopRuntime(
        sourceSystem.runtime
      );
  
      await safelyStopRuntime(
        restoredSystem.runtime
      );
  
      sourceSystem.factoryStorage
        .stopAutoSave();
  
      sourceSystem.schedulerStorage
        .stopAutoSave();
  
      restoredSystem.factoryStorage
        .stopAutoSave();
  
      restoredSystem.schedulerStorage
        .stopAutoSave();
  
      await rm(
        workingDirectory,
        {
          recursive: true,
  
          force: true,
        }
      );
  
      sourceSystem.eventBus.clear();
  
      sourceSystem.eventBus
        .clearHistory();
  
      restoredSystem.eventBus.clear();
  
      restoredSystem.eventBus
        .clearHistory();
    }
  }
  
  // =========================================================
  // RUNTIME SYSTEM CREATION
  // =========================================================
  
  function createRuntimeSystem(
    suffix: string,
    workingDirectory: string,
    factoryStoragePath: string,
    schedulerStoragePath: string
  ) {
    const eventBus =
      createWonderOSEventBus();
  
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
  
    const factory =
      new WonderFactory(
        {
          id:
            `runtime-${suffix}-factory`,
  
          name:
            `Runtime ${suffix} Factory`,
  
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
  
    const scheduler =
      new WonderScheduler(
        factory,
        {
          id:
            `runtime-${suffix}-scheduler`,
  
          name:
            `Runtime ${suffix} Scheduler`,
  
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
  
    const factoryStorage =
      new WonderFactoryStorage({
        filePath:
          factoryStoragePath,
  
        workingDirectory,
  
        prettyPrint:
          true,
  
        createDirectories:
          true,
  
        atomicWrite:
          true,
  
        createBackupBeforeWrite:
          true,
  
        maximumBackups:
          5,
  
        writeMode:
          "replace",
      });
  
    const schedulerStorage =
      new WonderSchedulerStorage({
        filePath:
          schedulerStoragePath,
  
        workingDirectory,
  
        prettyPrint:
          true,
  
        createDirectories:
          true,
  
        atomicWrite:
          true,
  
        createBackupBeforeWrite:
          true,
  
        maximumBackups:
          5,
  
        writeMode:
          "replace",
      });
  
    const runtime =
      new WonderRuntime(
        {
          id:
            `wonder-runtime-${suffix}`,
  
          name:
            `Wonder Runtime ${suffix}`,
  
          restoreFactoryOnBoot:
            true,
  
          restoreSchedulerOnBoot:
            true,
  
          recoverProcessingJobsOnBoot:
            true,
  
          recoverOverdueSchedulesOnBoot:
            true,
  
          startFactoryOnBoot:
            true,
  
          startSchedulerOnBoot:
            true,
  
          automaticFactoryPolling:
            false,
  
          automaticSchedulerPolling:
            false,
  
          autoSaveFactory:
            false,
  
          autoSaveScheduler:
            false,
  
          autoSaveIntervalMilliseconds:
            1_000,
  
          saveImmediatelyOnAutoSaveStart:
            false,
  
          saveOnShutdown:
            true,
  
          shutdownTimeoutMilliseconds:
            5_000,
        },
        {
          factory,
  
          scheduler,
  
          factoryStorage,
  
          schedulerStorage,
        }
      );
  
    return {
      eventBus,
  
      queue,
  
      workers,
  
      factory,
  
      scheduler,
  
      factoryStorage,
  
      schedulerStorage,
  
      runtime,
    };
  }
  
  // =========================================================
  // SCHEDULE CREATION
  // =========================================================
  
  function createRuntimeSchedules(
    scheduler: WonderScheduler,
    baseTime: Date
  ): void {
    scheduler.createOnceSchedule<
      RuntimeTestPayload
    >({
      id:
        ONCE_SCHEDULE_ID,
  
      name:
        "Runtime Once Schedule",
  
      runAt:
        new Date(
          baseTime.getTime() -
            100
        ),
  
      job:
        createRuntimeJobTemplate(
          "once",
          "Runtime Once Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "runtime",
        "once",
      ],
  
      metadata: {
        runtimeTest:
          true,
      },
    });
  
    scheduler.createIntervalSchedule<
      RuntimeTestPayload
    >({
      id:
        INTERVAL_SCHEDULE_ID,
  
      name:
        "Runtime Interval Schedule",
  
      startAt:
        new Date(
          baseTime.getTime() -
            100
        ),
  
      intervalMilliseconds:
        100,
  
      maximumRuns:
        2,
  
      misfirePolicy:
        "catch-up",
  
      job:
        createRuntimeJobTemplate(
          "interval",
          "Runtime Interval Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "runtime",
        "interval",
      ],
  
      metadata: {
        runtimeTest:
          true,
      },
    });
  }
  
  function createRuntimeJobTemplate(
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
      },
  
      priority:
        5 as const,
  
      totalItems:
        2,
  
      maximumAttempts:
        3,
  
      failureStrategy:
        "retry" as const,
  
      metadata: {
        source:
          "sandbox/testWonderRuntime",
  
        tags: [
          "runtime-test",
          scheduleKey,
        ],
  
        correlationId:
          TEST_BATCH_ID,
  
        createdBy:
          "WonderLabs",
  
        values: {
          scheduleKey,
        },
      },
    };
  }
  
  // =========================================================
  // WORKERS
  // =========================================================
  
  function registerRuntimeWorkers(
    factory: WonderFactory,
    suffix: string
  ): void {
    for (
      let index = 1;
      index <= 2;
      index += 1
    ) {
      const worker =
        new WonderWorker({
          id:
            `runtime-${suffix}-worker-${String(
              index
            ).padStart(
              3,
              "0"
            )}`,
  
          name:
            `Runtime ${suffix} Worker ${index}`,
  
          capabilities: [
            "generation",
          ],
  
          executor:
            async (
              job,
              context
            ): Promise<RuntimeTestResult> => {
              const payload =
                readRuntimePayload(
                  job.payload
                );
  
              await context.reportProgress({
                completedItems:
                  1,
  
                totalItems:
                  2,
  
                message:
                  `Processing ${payload.title}.`,
              });
  
              await delay(2);
  
              await context.reportProgress({
                completedItems:
                  2,
  
                totalItems:
                  2,
  
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
  
  function readRuntimePayload(
    value: unknown
  ): RuntimeTestPayload {
    if (
      typeof value !==
        "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        "Runtime test payload must be an object."
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
      !(record.createdAt instanceof Date)
    ) {
      throw new Error(
        "Runtime test payload is invalid."
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
    };
  }
  
  function isRuntimeTestResult(
    value: unknown
  ): value is RuntimeTestResult {
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
  
  // =========================================================
  // CLEANUP
  // =========================================================
  
  async function safelyStopRuntime(
    runtime: WonderRuntime
  ): Promise<void> {
    const status =
      runtime.getStatus();
  
    if (
      status === "stopped" ||
      status === "idle"
    ) {
      return;
    }
  
    try {
      await runtime.shutdown({
        graceful:
          false,
  
        timeoutMilliseconds:
          100,
  
        saveState:
          false,
  
        cancelActiveJobsOnTimeout:
          true,
      });
    } catch {
      // Cleanup should not hide the original test failure.
    }
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
  
  runWonderRuntimeTest()
    .then(
      (result) => {
        console.log(
          "Wonder Runtime Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Runtime Test Failed",
          error
        );
  
        process.exitCode =
          1;
      }
    );
  
  export {
    runWonderRuntimeTest,
  };