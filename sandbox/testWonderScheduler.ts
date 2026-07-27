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
    WonderWorker,
    WonderWorkerRegistry,
  } from "@/factory/workers/WonderWorker";
  
  import type {
    WonderJob,
  } from "@/factory/types/WonderJob";
  
  // =========================================================
  // TEST TYPES
  // =========================================================
  
  interface SchedulerTestPayload {
    scheduleKey: string;
  
    itemName: string;
  
    createdAt: Date;
  }
  
  interface SchedulerTestResult {
    scheduleKey: string;
  
    itemName: string;
  
    processedBy: string;
  
    processedAt: Date;
  }
  
  interface WonderSchedulerTestSummary {
    success: boolean;
  
    schedulerStatus: string;
  
    factoryStatus: string;
  
    totalSchedules: number;
  
    completedSchedules: number;
  
    cancelledSchedules: number;
  
    submittedJobs: number;
  
    firstTickJobs: number;
  
    secondTickJobs: number;
  
    completedJobs: number;
  
    failedJobs: number;
  
    queuedJobs: number;
  
    processingJobs: number;
  
    onceRuns: number;
  
    catchUpRuns: number;
  
    runOnceRuns: number;
  
    queuedEventCount: number;
  
    startedEventCount: number;
  
    completedEventCount: number;
  
    snapshotSchedules: number;
  
    importedSchedules: number;
  
    resultCount: number;
  
    queueIdle: boolean;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const TEST_BATCH_ID =
    "wonder-scheduler-test-batch-001";
  
  const ONCE_SCHEDULE_ID =
    "scheduler-once-001";
  
  const CATCH_UP_SCHEDULE_ID =
    "scheduler-catch-up-001";
  
  const RUN_ONCE_SCHEDULE_ID =
    "scheduler-run-once-001";
  
  const CONTROL_SCHEDULE_ID =
    "scheduler-control-001";
  
  const EXPECTED_TOTAL_JOBS = 6;
  
  // =========================================================
  // TEST
  // =========================================================
  
  async function runWonderSchedulerTest(): Promise<WonderSchedulerTestSummary> {
    const eventBus =
      createWonderOSEventBus();
  
    const queue =
      new WonderQueue(
        {
          maximumJobs: 100,
  
          defaultLockDurationMilliseconds:
            30_000,
  
          pruneCompletedJobsWhenFull:
            true,
  
          completedJobRetention:
            100,
  
          emitEvents:
            true,
        },
        eventBus
      );
  
    const workerRegistry =
      new WonderWorkerRegistry();
  
    const factory =
      new WonderFactory(
        {
          id:
            "wonder-scheduler-test-factory",
  
          name:
            "Wonder Scheduler Test Factory",
  
          maximumConcurrentJobs: 3,
  
          executionMode:
            "parallel",
  
          pollingIntervalMilliseconds:
            10,
  
          workerHeartbeatTimeoutMilliseconds:
            60_000,
  
          jobLockDurationMilliseconds:
            30_000,
  
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
  
          workers:
            workerRegistry,
  
          eventBus,
        }
      );
  
    const scheduler =
      new WonderScheduler(
        factory,
        {
          id:
            "wonder-scheduler-sandbox",
  
          name:
            "Wonder Scheduler Sandbox",
  
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
  
    let queuedEventCount = 0;
  
    let startedEventCount = 0;
  
    let completedEventCount = 0;
  
    const queuedSubscription =
      eventBus.on(
        "factory:job-queued",
        async (event) => {
          queuedEventCount += 1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Queued event batch ID should match."
          );
        }
      );
  
    const startedSubscription =
      eventBus.on(
        "factory:job-started",
        async (event) => {
          startedEventCount += 1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Started event batch ID should match."
          );
        }
      );
  
    const completedSubscription =
      eventBus.on(
        "factory:job-completed",
        async (event) => {
          completedEventCount += 1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Completed event batch ID should match."
          );
        }
      );
  
    try {
      registerSchedulerWorkers(
        factory
      );
  
      assertEqual(
        factory.listWorkers().length,
        3,
        "Factory should contain three workers."
      );
  
      const baseTime =
        new Date();
  
      createTestSchedules(
        scheduler,
        baseTime
      );
  
      assertEqual(
        scheduler.size(),
        4,
        "Scheduler should contain four schedules."
      );
  
      testScheduleControls(
        scheduler,
        baseTime
      );
  
      const factoryStartResult =
        await factory.start({
          automaticPolling:
            false,
        });
  
      assertTrue(
        factoryStartResult.success,
        "Factory should start successfully."
      );
  
      const schedulerStartResult =
        await scheduler.start({
          automaticPolling:
            false,
  
          startFactoryIfNeeded:
            false,
        });
  
      assertTrue(
        schedulerStartResult.success,
        "Scheduler should start successfully."
      );
  
      assertEqual(
        scheduler.getStatus(),
        "running",
        "Scheduler should be running."
      );
  
      // =======================================================
      // FIRST SCHEDULER TICK
      // =======================================================
  
      const firstTick =
        await scheduler.tick(
          baseTime
        );
  
      /*
       * Expected submissions:
       *
       * once schedule:
       *   1
       *
       * catch-up interval:
       *   3
       *
       * run-once misfire:
       *   1
       *
       * cancelled control schedule:
       *   0
       *
       * Total:
       *   5
       */
      assertEqual(
        firstTick.submittedJobs,
        5,
        "First scheduler tick should submit five jobs."
      );
  
      assertEqual(
        firstTick.failures.length,
        0,
        "First scheduler tick should not fail."
      );
  
      const onceAfterFirstTick =
        scheduler.getSchedule(
          ONCE_SCHEDULE_ID
        );
  
      const catchUpAfterFirstTick =
        scheduler.getSchedule(
          CATCH_UP_SCHEDULE_ID
        );
  
      const runOnceAfterFirstTick =
        scheduler.getSchedule(
          RUN_ONCE_SCHEDULE_ID
        );
  
      assertEqual(
        onceAfterFirstTick?.status,
        "completed",
        "Once schedule should complete after one submission."
      );
  
      assertEqual(
        onceAfterFirstTick?.runCount,
        1,
        "Once schedule should run once."
      );
  
      assertEqual(
        catchUpAfterFirstTick?.status,
        "completed",
        "Catch-up schedule should reach its maximum runs."
      );
  
      assertEqual(
        catchUpAfterFirstTick?.runCount,
        3,
        "Catch-up schedule should submit three missed occurrences."
      );
  
      assertEqual(
        runOnceAfterFirstTick?.status,
        "active",
        "Run-once interval schedule should remain active after its first run."
      );
  
      assertEqual(
        runOnceAfterFirstTick?.runCount,
        1,
        "Run-once interval should submit only one occurrence per tick."
      );
  
      assertTrue(
        runOnceAfterFirstTick?.nextRunAt instanceof
          Date,
        "Run-once interval should have another scheduled run."
      );
  
      // =======================================================
      // PROCESS FIRST BATCH
      // =======================================================
  
      const firstFactoryRun =
        await factory.runUntilIdle({
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
        firstFactoryRun.success,
        [
          "Factory should process the first scheduled batch.",
          ...firstFactoryRun.errors,
        ].join(" ")
      );
  
      assertTrue(
        firstFactoryRun.idle,
        "Factory should become idle after the first batch."
      );
  
      // =======================================================
      // SECOND SCHEDULER TICK
      // =======================================================
  
      const nextRunAt =
  runOnceAfterFirstTick
    ?.nextRunAt;

assertTrue(
  nextRunAt instanceof Date,
  "Second run date should exist."
);

const waitUntilNextRun =
  Math.max(
    0,
    nextRunAt.getTime() -
      Date.now() +
      10
  );

if (
  waitUntilNextRun > 0
) {
  await delay(
    waitUntilNextRun
  );
}

const secondTick =
  await scheduler.tick(
    new Date()
  );

assertEqual(
  secondTick.submittedJobs,
  1,
  "Second scheduler tick should submit one final interval job."
);
  
      assertEqual(
        secondTick.failures.length,
        0,
        "Second scheduler tick should not fail."
      );
  
      const runOnceAfterSecondTick =
        scheduler.getSchedule(
          RUN_ONCE_SCHEDULE_ID
        );
  
      assertEqual(
        runOnceAfterSecondTick?.status,
        "completed",
        "Run-once interval should complete after reaching maximumRuns."
      );
  
      assertEqual(
        runOnceAfterSecondTick?.runCount,
        2,
        "Run-once interval should run twice."
      );
  
      // =======================================================
      // PROCESS SECOND BATCH
      // =======================================================
  
      const secondFactoryRun =
        await factory.runUntilIdle({
          maximumTicks: 20,
  
          timeoutMilliseconds:
            15_000,
  
          intervalMilliseconds:
            0,
  
          maximumIdleTicks: 5,
  
          startIfNeeded:
            false,
        });
  
      assertTrue(
        secondFactoryRun.success,
        [
          "Factory should process the second scheduled batch.",
          ...secondFactoryRun.errors,
        ].join(" ")
      );
  
      assertTrue(
        secondFactoryRun.idle,
        "Factory should become idle after all scheduled work."
      );
  
      // =======================================================
      // FINAL ASSERTIONS
      // =======================================================
  
      const schedulerStatistics =
        scheduler.getStatistics();
  
      const queueStatistics =
        factory
          .getQueue()
          .getStatistics();
  
      assertEqual(
        schedulerStatistics.totalSchedules,
        4,
        "Scheduler should retain all four schedules."
      );
  
      assertEqual(
        schedulerStatistics.completedSchedules,
        3,
        "Three schedules should be completed."
      );
  
      assertEqual(
        schedulerStatistics.cancelledSchedules,
        1,
        "One control schedule should be cancelled."
      );
  
      assertEqual(
        schedulerStatistics.activeSchedules,
        0,
        "No schedules should remain active."
      );
  
      assertEqual(
        schedulerStatistics.errorSchedules,
        0,
        "No schedules should remain in error."
      );
  
      assertEqual(
        schedulerStatistics.totalRuns,
        EXPECTED_TOTAL_JOBS,
        "Scheduler should record six total runs."
      );
  
      assertEqual(
        schedulerStatistics.successfulRuns,
        EXPECTED_TOTAL_JOBS,
        "Every schedule run should submit successfully."
      );
  
      assertEqual(
        schedulerStatistics.failedRuns,
        0,
        "No schedule runs should fail."
      );
  
      assertEqual(
        schedulerStatistics.submittedJobCount,
        EXPECTED_TOTAL_JOBS,
        "Scheduler should submit six jobs."
      );
  
      assertEqual(
        queueStatistics.totalJobs,
        EXPECTED_TOTAL_JOBS,
        "Factory queue should contain six jobs."
      );
  
      assertEqual(
        queueStatistics.completedJobs,
        EXPECTED_TOTAL_JOBS,
        "Every scheduled job should complete."
      );
  
      assertEqual(
        queueStatistics.failedJobs,
        0,
        "No scheduled jobs should remain failed."
      );
  
      assertEqual(
        queueStatistics.queuedJobs,
        0,
        "No scheduled jobs should remain queued."
      );
  
      assertEqual(
        queueStatistics.processingJobs,
        0,
        "No scheduled jobs should remain processing."
      );
  
      assertEqual(
        queuedEventCount,
        EXPECTED_TOTAL_JOBS,
        "Every scheduled job should emit a queued event."
      );
  
      assertEqual(
        startedEventCount,
        EXPECTED_TOTAL_JOBS,
        "Every scheduled job should emit a started event."
      );
  
      assertEqual(
        completedEventCount,
        EXPECTED_TOTAL_JOBS,
        "Every scheduled job should emit a completed event."
      );
  
      const completedJobs =
        factory
          .getQueue()
          .getJobsByStatus(
            "completed"
          );
  
      const results =
        completedJobs.map(
          (job) =>
            job.result
        );
  
      assertTrue(
        results.every(
          isSchedulerTestResult
        ),
        "Every completed scheduled job should contain a valid result."
      );
  
      assertTrue(
        results.every(
          (result) =>
            result.processedAt instanceof
            Date
        ),
        "Every result should contain a Date."
      );
  
      const scheduleKeys =
        results
          .map(
            (result) =>
              result.scheduleKey
          )
          .sort();
  
      assertEqual(
        scheduleKeys.filter(
          (key) =>
            key === "once"
        ).length,
        1,
        "Once schedule should create one result."
      );
  
      assertEqual(
        scheduleKeys.filter(
          (key) =>
            key === "catch-up"
        ).length,
        3,
        "Catch-up schedule should create three results."
      );
  
      assertEqual(
        scheduleKeys.filter(
          (key) =>
            key === "run-once"
        ).length,
        2,
        "Run-once schedule should create two results."
      );
  
      // =======================================================
      // SNAPSHOT TEST
      // =======================================================
  
      const snapshot =
        scheduler.createSnapshot();
  
      assertEqual(
        snapshot.schedules.length,
        4,
        "Scheduler snapshot should contain four schedules."
      );
  
      const importedScheduler =
        new WonderScheduler(
          factory,
          {
            id:
              "imported-scheduler",
  
            name:
              "Imported Scheduler",
  
            automaticPolling:
              false,
  
            startFactoryIfNeeded:
              false,
          }
        );
  
      const importResult =
        importedScheduler
          .importSnapshot(
            snapshot,
            true
          );
  
      assertEqual(
        importResult.importedSchedules,
        4,
        "Imported scheduler should receive all schedules."
      );
  
      assertEqual(
        importResult.skippedSchedules,
        0,
        "No schedules should be skipped during replacement import."
      );
  
      assertEqual(
        importedScheduler.size(),
        4,
        "Imported scheduler should contain four schedules."
      );
  
      // =======================================================
      // SHUTDOWN
      // =======================================================
  
      const schedulerStopResult =
        await scheduler.stop({
          stopFactory:
            true,
  
          gracefulFactoryStop:
            true,
        });
  
      assertTrue(
        schedulerStopResult.success,
        "Scheduler should stop successfully."
      );
  
      assertEqual(
        scheduler.getStatus(),
        "stopped",
        "Scheduler status should be stopped."
      );
  
      assertEqual(
        factory.getStatus(),
        "stopped",
        "Factory should be stopped by Scheduler."
      );
  
      return {
        success: true,
  
        schedulerStatus:
          scheduler.getStatus(),
  
        factoryStatus:
          factory.getStatus(),
  
        totalSchedules:
          schedulerStatistics
            .totalSchedules,
  
        completedSchedules:
          schedulerStatistics
            .completedSchedules,
  
        cancelledSchedules:
          schedulerStatistics
            .cancelledSchedules,
  
        submittedJobs:
          schedulerStatistics
            .submittedJobCount,
  
        firstTickJobs:
          firstTick.submittedJobs,
  
        secondTickJobs:
          secondTick.submittedJobs,
  
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
  
        onceRuns:
          onceAfterFirstTick
            ?.runCount ??
          0,
  
        catchUpRuns:
          catchUpAfterFirstTick
            ?.runCount ??
          0,
  
        runOnceRuns:
          runOnceAfterSecondTick
            ?.runCount ??
          0,
  
        queuedEventCount,
  
        startedEventCount,
  
        completedEventCount,
  
        snapshotSchedules:
          snapshot.schedules.length,
  
        importedSchedules:
          importResult
            .importedSchedules,
  
        resultCount:
          results.length,
  
        queueIdle:
          secondFactoryRun.idle,
      };
    } finally {
      queuedSubscription.unsubscribe();
  
      startedSubscription.unsubscribe();
  
      completedSubscription.unsubscribe();
  
      if (
        scheduler.getStatus() ===
          "running" ||
        scheduler.getStatus() ===
          "paused" ||
        scheduler.getStatus() ===
          "error"
      ) {
        await scheduler.stop({
          stopFactory:
            false,
        });
      }
  
      if (
        factory.getStatus() ===
          "running" ||
        factory.getStatus() ===
          "paused" ||
        factory.getStatus() ===
          "error"
      ) {
        await factory.stop({
          graceful:
            false,
  
          timeoutMilliseconds:
            100,
  
          cancelActiveJobsOnTimeout:
            true,
        });
      }
  
      eventBus.clear();
  
      eventBus.clearHistory();
    }
  }
  
  // =========================================================
  // SCHEDULE CREATION
  // =========================================================
  
  function createTestSchedules(
    scheduler: WonderScheduler,
    baseTime: Date
  ): void {
    scheduler.createOnceSchedule<
      SchedulerTestPayload
    >({
      id:
        ONCE_SCHEDULE_ID,
  
      name:
        "One-Time Wonder Job",
  
      runAt:
        new Date(
          baseTime.getTime() -
          100
        ),
  
      job:
        createJobTemplate(
          "once",
          "One-Time Scheduled Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "once",
      ],
  
      metadata: {
        testType:
          "once",
      },
    });
  
    scheduler.createIntervalSchedule<
      SchedulerTestPayload
    >({
      id:
        CATCH_UP_SCHEDULE_ID,
  
      name:
        "Catch-Up Wonder Jobs",
  
      startAt:
        new Date(
          baseTime.getTime() -
          200
        ),
  
      intervalMilliseconds:
        100,
  
      maximumRuns: 3,
  
      misfirePolicy:
        "catch-up",
  
      job:
        createJobTemplate(
          "catch-up",
          "Catch-Up Scheduled Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "interval",
        "catch-up",
      ],
  
      metadata: {
        testType:
          "catch-up",
      },
    });
  
    scheduler.createIntervalSchedule<
      SchedulerTestPayload
    >({
      id:
        RUN_ONCE_SCHEDULE_ID,
  
      name:
        "Run-Once Misfire Jobs",
  
      startAt:
        new Date(
          baseTime.getTime() -
          500
        ),
  
      intervalMilliseconds:
        100,
  
      maximumRuns: 2,
  
      misfirePolicy:
        "run-once",
  
      job:
        createJobTemplate(
          "run-once",
          "Run-Once Scheduled Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "interval",
        "run-once",
      ],
  
      metadata: {
        testType:
          "run-once",
      },
    });
  
    scheduler.createIntervalSchedule<
      SchedulerTestPayload
    >({
      id:
        CONTROL_SCHEDULE_ID,
  
      name:
        "Schedule Control Test",
  
      startAt:
        new Date(
          baseTime.getTime() +
          60_000
        ),
  
      intervalMilliseconds:
        1_000,
  
      maximumRuns: 2,
  
      misfirePolicy:
        "run-once",
  
      job:
        createJobTemplate(
          "control",
          "Control Scheduled Item",
          baseTime
        ),
  
      tags: [
        "sandbox",
        "control",
      ],
  
      metadata: {
        testType:
          "control",
      },
    });
  }
  
  function createJobTemplate(
    scheduleKey: string,
    itemName: string,
    createdAt: Date
  ) {
    return {
      batchId:
        TEST_BATCH_ID,
  
      type:
        "generation" as const,
  
      payload: {
        scheduleKey,
  
        itemName,
  
        createdAt:
          new Date(
            createdAt.getTime()
          ),
      },
  
      priority:
        5 as const,
  
      totalItems: 2,
  
      maximumAttempts: 3,
  
      failureStrategy:
        "retry" as const,
  
      metadata: {
        source:
          "sandbox/testWonderScheduler",
  
        tags: [
          "scheduler-test",
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
  // SCHEDULE CONTROL TESTS
  // =========================================================
  
  function testScheduleControls(
    scheduler: WonderScheduler,
    baseTime: Date
  ): void {
    const pausedSchedule =
      scheduler.pauseSchedule(
        CONTROL_SCHEDULE_ID
      );
  
    assertEqual(
      pausedSchedule.status,
      "paused",
      "Control schedule should pause."
    );
  
    const resumedSchedule =
      scheduler.resumeSchedule(
        CONTROL_SCHEDULE_ID,
        new Date(
          baseTime.getTime() +
          60_000
        )
      );
  
    assertEqual(
      resumedSchedule.status,
      "active",
      "Control schedule should resume."
    );
  
    const cancelledSchedule =
      scheduler.cancelSchedule(
        CONTROL_SCHEDULE_ID
      );
  
    assertEqual(
      cancelledSchedule.status,
      "cancelled",
      "Control schedule should cancel."
    );
  
    assertEqual(
      cancelledSchedule.nextRunAt,
      null,
      "Cancelled schedule should not have a next run."
    );
  }
  
  // =========================================================
  // WORKERS
  // =========================================================
  
  function registerSchedulerWorkers(
    factory: WonderFactory
  ): void {
    for (
      let index = 1;
      index <= 3;
      index += 1
    ) {
      const worker =
        new WonderWorker({
          id:
            `scheduler-worker-${String(
              index
            ).padStart(
              3,
              "0"
            )}`,
  
          name:
            `Scheduler Worker ${index}`,
  
          capabilities: [
            "generation",
          ],
  
          executor:
            async (
              job,
              context
            ): Promise<SchedulerTestResult> => {
              const payload =
                readSchedulerTestPayload(
                  job.payload
                );
  
              await context.reportProgress({
                completedItems: 1,
  
                totalItems: 2,
  
                message:
                  `Processing ${payload.itemName}.`,
              });
  
              await delay(2);
  
              await context.reportProgress({
                completedItems: 2,
  
                totalItems: 2,
  
                message:
                  `Completed ${payload.itemName}.`,
              });
  
              return {
                scheduleKey:
                  payload.scheduleKey,
  
                itemName:
                  payload.itemName,
  
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
  
  function readSchedulerTestPayload(
    value: unknown
  ): SchedulerTestPayload {
    if (
      typeof value !==
        "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        "Scheduler test payload must be an object."
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
      typeof record.itemName !==
        "string" ||
      !(record.createdAt instanceof Date)
    ) {
      throw new Error(
        "Scheduler test payload is invalid."
      );
    }
  
    return {
      scheduleKey:
        record.scheduleKey,
  
      itemName:
        record.itemName,
  
      createdAt:
        new Date(
          record.createdAt.getTime()
        ),
    };
  }
  
  function isSchedulerTestResult(
    value: unknown
  ): value is SchedulerTestResult {
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
      typeof record.itemName ===
        "string" &&
      typeof record.processedBy ===
        "string" &&
      record.processedAt instanceof
        Date
    );
  }
  
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
  
  // Prevent the helper from becoming unused if strict
  // noUnusedLocals is enabled in the project.
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
  
  runWonderSchedulerTest()
    .then(
      (result) => {
        console.log(
          "Wonder Scheduler Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Scheduler Test Failed",
          error
        );
  
        process.exitCode = 1;
      }
    );
  
  export {
    runWonderSchedulerTest,
  };