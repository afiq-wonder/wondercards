import {
    createWonderOSEventBus,
  } from "@/core/WonderEvents";
  
  import type {
    WonderOSEventName,
  } from "@/core/WonderEvents";
  
  import {
    WonderFactory,
  } from "@/factory/WonderFactory";
  
  import {
    WonderQueue,
  } from "@/factory/queue/WonderQueue";
  
  import {
    WonderWorker,
    WonderWorkerExecutionError,
    WonderWorkerRegistry,
  } from "@/factory/workers/WonderWorker";
  
  import type {
    WonderJob,
    WonderJobType,
  } from "@/factory/types/WonderJob";
  
  // =========================================================
  // TEST TYPES
  // =========================================================
  
  interface TestJobPayload {
    itemNumber: number;
  
    contentType: WonderJobType;
  
    title: string;
  
    shouldFailOnce: boolean;
  }
  
  interface TestJobResult {
    itemNumber: number;
  
    title: string;
  
    processedBy: string;
  
    output: string;
  }
  
  interface WonderFactoryTestSummary {
    success: boolean;
  
    factoryStatus: string;
  
    submittedJobs: number;
  
    completedJobs: number;
  
    failedJobs: number;
  
    queuedJobs: number;
  
    processingJobs: number;
  
    cancelledJobs: number;
  
    totalWorkers: number;
  
    idleWorkers: number;
  
    workerCompletedJobs: number;
  
    workerFailedJobs: number;
  
    executionStarted: number;
  
    executionCompleted: number;
  
    executionFailed: number;
  
    factoryEventCount: number;
  
    queuedEventCount: number;
  
    startedEventCount: number;
  
    progressEventCount: number;
  
    completedEventCount: number;
  
    failedEventCount: number;
  
    retriedJobAttempts: number;
  
    resultCount: number;
  
    queueIdle: boolean;
  
    receivedEvents: WonderOSEventName[];
  }
  
  // =========================================================
  // TEST CONSTANTS
  // =========================================================
  
  const TEST_BATCH_ID =
    "wonder-factory-test-batch-001";
  
  const TOTAL_JOBS = 10;
  
  const EXPECTED_RETRY_JOB_NUMBER = 7;
  
  // =========================================================
  // TEST
  // =========================================================
  
  async function runWonderFactoryTest(): Promise<WonderFactoryTestSummary> {
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
            "wonder-factory-sandbox",
  
          name:
            "Wonder Factory Sandbox",
  
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
  
    const receivedEvents:
      WonderOSEventName[] = [];
  
    let queuedEventCount = 0;
  
    let startedEventCount = 0;
  
    let progressEventCount = 0;
  
    let completedEventCount = 0;
  
    let failedEventCount = 0;
  
    const attemptCounts =
      new Map<
        number,
        number
      >();
  
    const subscriptions = [
      eventBus.on(
        "factory:job-queued",
        async (event) => {
          receivedEvents.push(
            "factory:job-queued"
          );
  
          queuedEventCount += 1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Queued event batch ID should match."
          );
  
          assertTrue(
            event.payload.priority >= 1 &&
              event.payload.priority <= 10,
            "Queued event priority should be between 1 and 10."
          );
        }
      ),
  
      eventBus.on(
        "factory:job-started",
        async (event) => {
          receivedEvents.push(
            "factory:job-started"
          );
  
          startedEventCount += 1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Started event batch ID should match."
          );
  
          assertTrue(
            event.payload.workerId.length >
              0,
            "Started event should contain a worker ID."
          );
        }
      ),
  
      eventBus.on(
        "factory:job-progress",
        async (event) => {
          receivedEvents.push(
            "factory:job-progress"
          );
  
          progressEventCount += 1;
  
          assertTrue(
            event.payload
              .progressPercentage >= 0 &&
              event.payload
                .progressPercentage <= 100,
            "Progress percentage should remain between 0 and 100."
          );
        }
      ),
  
      eventBus.on(
        "factory:job-completed",
        async (event) => {
          receivedEvents.push(
            "factory:job-completed"
          );
  
          completedEventCount += 1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Completed event batch ID should match."
          );
  
          assertTrue(
            event.payload.processedItems >
              0,
            "Completed event should report processed items."
          );
        }
      ),
  
      eventBus.on(
        "factory:job-failed",
        async (event) => {
          receivedEvents.push(
            "factory:job-failed"
          );
  
          failedEventCount += 1;
  
          assertEqual(
            event.payload.batchId,
            TEST_BATCH_ID,
            "Failed event batch ID should match."
          );
  
          assertTrue(
            event.payload.error.message
              .length > 0,
            "Failed event should contain an error message."
          );
        }
      ),
    ];
  
    try {
      registerWorkers(
        factory,
        attemptCounts
      );
  
      assertEqual(
        factory.listWorkers().length,
        3,
        "Factory should contain three workers."
      );
  
      await submitJobs(factory);
  
      assertEqual(
        factory.getQueue().size(),
        TOTAL_JOBS,
        "Queue should contain all submitted jobs."
      );
  
      const initialStatistics =
        factory.getStatistics();
  
      assertEqual(
        initialStatistics.queuedJobs,
        TOTAL_JOBS,
        "All submitted jobs should initially be queued."
      );
  
      const startResult =
        await factory.start({
          automaticPolling: false,
        });
  
      assertTrue(
        startResult.success,
        "Factory should start successfully."
      );
  
      assertEqual(
        factory.getStatus(),
        "running",
        "Factory status should be running."
      );
  
      const runResult =
        await factory.runUntilIdle({
          maximumTicks: 50,
  
          timeoutMilliseconds:
            30_000,
  
          intervalMilliseconds: 0,
  
          maximumIdleTicks: 5,
  
          startIfNeeded: false,
        });
  
      assertTrue(
        runResult.success,
        [
          "Factory should run until idle successfully.",
          ...runResult.errors,
        ].join(" ")
      );
  
      assertTrue(
        runResult.idle,
        "Factory should be idle after processing all jobs."
      );
  
      const finalStatistics =
        factory.getStatistics();
  
      const queueStatistics =
        factory
          .getQueue()
          .getStatistics();
  
      const workerStatistics =
        factory
          .getWorkerRegistry()
          .getStatistics();
  
      assertEqual(
        queueStatistics.completedJobs,
        TOTAL_JOBS,
        "All jobs should complete."
      );
  
      assertEqual(
        queueStatistics.failedJobs,
        0,
        "No jobs should remain failed after retry."
      );
  
      assertEqual(
        queueStatistics.queuedJobs,
        0,
        "No jobs should remain queued."
      );
  
      assertEqual(
        queueStatistics.processingJobs,
        0,
        "No jobs should remain processing."
      );
  
      assertEqual(
        finalStatistics.activeExecutions,
        0,
        "Factory should have no active executions."
      );
  
      assertEqual(
        workerStatistics.totalWorkers,
        3,
        "Worker registry should contain three workers."
      );
  
      assertEqual(
        workerStatistics.busyWorkers,
        0,
        "No worker should remain busy."
      );
  
      assertEqual(
        workerStatistics.idleWorkers,
        3,
        "All workers should return to idle."
      );
  
      assertEqual(
        failedEventCount,
        1,
        "Exactly one intentional failure event should be emitted."
      );
  
      assertEqual(
        startedEventCount,
        TOTAL_JOBS + 1,
        "One retried job should produce one additional start event."
      );
  
      assertEqual(
        completedEventCount,
        TOTAL_JOBS,
        "Every job should produce a completion event."
      );
  
      assertEqual(
        queuedEventCount,
        TOTAL_JOBS,
        "Initial job submission should produce one queued event per job."
      );
  
      assertTrue(
        progressEventCount >=
          TOTAL_JOBS * 2,
        "Workers should report multiple progress events."
      );
  
      const retryJob =
        findJobByItemNumber(
          factory
            .getQueue()
            .listJobs(),
          EXPECTED_RETRY_JOB_NUMBER
        );
  
      assertTrue(
        retryJob !== null,
        "Retry test job should exist."
      );
  
      assertEqual(
        retryJob?.attemptCount,
        2,
        "Intentional failure job should complete on its second attempt."
      );
  
      assertEqual(
        retryJob?.status,
        "completed",
        "Retried job should finish completed."
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
            job.result as
              | TestJobResult
              | null
        );
  
      assertTrue(
        results.every(
          (
            result
          ): result is TestJobResult =>
            result !== null
        ),
        "Every completed job should contain a result."
      );
  
      assertEqual(
        results.length,
        TOTAL_JOBS,
        "Factory should produce one result for every job."
      );
  
      const processedItemNumbers =
        results
          .map(
            (result) =>
              result.itemNumber
          )
          .sort(
            (
              first,
              second
            ) =>
              first - second
          );
  
      assertArrayEqual(
        processedItemNumbers,
        Array.from(
          {
            length:
              TOTAL_JOBS,
          },
          (
            _value,
            index
          ) =>
            index + 1
        ),
        "Factory should process every submitted item."
      );
  
      const healthReport =
        factory.getHealthReport();
  
      assertTrue(
        healthReport.healthy,
        "Factory health report should be healthy."
      );
  
      const stopResult =
        await factory.stop({
          graceful: true,
  
          timeoutMilliseconds:
            5_000,
  
          cancelActiveJobsOnTimeout:
            true,
        });
  
      assertTrue(
        stopResult.success,
        "Factory should stop successfully."
      );
  
      assertEqual(
        factory.getStatus(),
        "stopped",
        "Factory status should be stopped."
      );
  
      const history =
        eventBus.getHistory();
  
      return {
        success: true,
  
        factoryStatus:
          factory.getStatus(),
  
        submittedJobs:
          TOTAL_JOBS,
  
        completedJobs:
          queueStatistics.completedJobs,
  
        failedJobs:
          queueStatistics.failedJobs,
  
        queuedJobs:
          queueStatistics.queuedJobs,
  
        processingJobs:
          queueStatistics.processingJobs,
  
        cancelledJobs:
          queueStatistics.cancelledJobs,
  
        totalWorkers:
          workerStatistics.totalWorkers,
  
        idleWorkers:
          workerStatistics.idleWorkers,
  
        workerCompletedJobs:
          workerStatistics.completedJobs,
  
        workerFailedJobs:
          workerStatistics.failedJobs,
  
        executionStarted:
          finalStatistics
            .totalExecutionStarted,
  
        executionCompleted:
          finalStatistics
            .totalExecutionCompleted,
  
        executionFailed:
          finalStatistics
            .totalExecutionFailed,
  
        factoryEventCount:
          history.filter(
            (event) =>
              event.name.startsWith(
                "factory:"
              )
          ).length,
  
        queuedEventCount,
  
        startedEventCount,
  
        progressEventCount,
  
        completedEventCount,
  
        failedEventCount,
  
        retriedJobAttempts:
          retryJob?.attemptCount ??
          0,
  
        resultCount:
          results.length,
  
        queueIdle:
          runResult.idle,
  
        receivedEvents: [
          ...receivedEvents,
        ],
      };
    } finally {
      for (
        const subscription of
          subscriptions
      ) {
        subscription.unsubscribe();
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
          graceful: false,
  
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
  // WORKERS
  // =========================================================
  
  function registerWorkers(
    factory: WonderFactory,
    attemptCounts: Map<
      number,
      number
    >
  ): void {
    const generationWorker =
      new WonderWorker({
        id:
          "worker-generation-001",
  
        name:
          "Generation Worker",
  
        capabilities: [
          "generation",
        ],
  
        executor:
          createTestExecutor(
            attemptCounts
          ),
      });
  
    const validationWorker =
      new WonderWorker({
        id:
          "worker-validation-001",
  
        name:
          "Validation Worker",
  
        capabilities: [
          "validation",
          "approval",
        ],
  
        executor:
          createTestExecutor(
            attemptCounts
          ),
      });
  
    const universalWorker =
      new WonderWorker({
        id:
          "worker-universal-001",
  
        name:
          "Universal Worker",
  
        capabilities: [
          "generation",
          "validation",
          "repair",
          "approval",
          "publication",
          "export",
        ],
  
        executor:
          createTestExecutor(
            attemptCounts
          ),
      });
  
    factory.registerWorker(
      generationWorker
    );
  
    factory.registerWorker(
      validationWorker
    );
  
    factory.registerWorker(
      universalWorker
    );
  }
  
  function createTestExecutor(
    attemptCounts: Map<
      number,
      number
    >
  ) {
    return async (
      job: WonderJob<
        unknown,
        unknown
      >,
      context: {
        workerId: string;
  
        reportProgress(
          update: {
            completedItems?: number;
  
            totalItems?: number;
  
            message?: string | null;
          }
        ): Promise<void>;
      }
    ): Promise<TestJobResult> => {
      const payload =
        readTestPayload(
          job.payload
        );
  
      const attemptCount =
        (
          attemptCounts.get(
            payload.itemNumber
          ) ??
          0
        ) + 1;
  
      attemptCounts.set(
        payload.itemNumber,
        attemptCount
      );
  
      await context.reportProgress({
        completedItems: 1,
  
        totalItems: 3,
  
        message:
          `Worker ${context.workerId} started ${payload.title}.`,
      });
  
      await delay(2);
  
      if (
        payload.shouldFailOnce &&
        attemptCount === 1
      ) {
        throw new WonderWorkerExecutionError(
          `Intentional retry test for item ${payload.itemNumber}.`,
          {
            code:
              "INTENTIONAL_RETRY_TEST",
  
            retryable:
              true,
  
            details: {
              itemNumber:
                payload.itemNumber,
  
              attemptCount,
            },
          }
        );
      }
  
      await context.reportProgress({
        completedItems: 2,
  
        totalItems: 3,
  
        message:
          `Worker ${context.workerId} is processing ${payload.title}.`,
      });
  
      await delay(2);
  
      await context.reportProgress({
        completedItems: 3,
  
        totalItems: 3,
  
        message:
          `Worker ${context.workerId} completed ${payload.title}.`,
      });
  
      return {
        itemNumber:
          payload.itemNumber,
  
        title:
          payload.title,
  
        processedBy:
          context.workerId,
  
        output:
          `Processed ${payload.contentType} item ${payload.itemNumber}.`,
      };
    };
  }
  
  // =========================================================
  // JOB SUBMISSION
  // =========================================================
  
  async function submitJobs(
    factory: WonderFactory
  ): Promise<void> {
    const jobTypes:
      WonderJobType[] = [
        "generation",
        "validation",
        "generation",
        "approval",
        "generation",
        "validation",
        "repair",
        "generation",
        "publication",
        "export",
      ];
  
    for (
      let index = 0;
      index < TOTAL_JOBS;
      index += 1
    ) {
      const itemNumber =
        index + 1;
  
      const contentType =
        jobTypes[index];
  
      await factory.submitJob<
        TestJobPayload
      >({
        id:
          `wonder-factory-test-job-${String(
            itemNumber
          ).padStart(
            3,
            "0"
          )}`,
  
        batchId:
          TEST_BATCH_ID,
  
        type:
          contentType,
  
        payload: {
          itemNumber,
  
          contentType,
  
          title:
            `Wonder Factory Test Item ${itemNumber}`,
  
          shouldFailOnce:
            itemNumber ===
            EXPECTED_RETRY_JOB_NUMBER,
        },
  
        priority:
          readPriority(
            10 -
            (
              index % 5
            )
          ),
  
        totalItems: 3,
  
        maximumAttempts: 3,
  
        failureStrategy:
          "retry",
  
        metadata: {
          source:
            "sandbox/testWonderFactory",
  
          tags: [
            "sandbox",
            "factory-test",
            contentType,
          ],
  
          correlationId:
            TEST_BATCH_ID,
  
          createdBy:
            "WonderLabs",
  
          values: {
            testItemNumber:
              itemNumber,
          },
        },
      });
    }
  }
  
  // =========================================================
  // JOB HELPERS
  // =========================================================
  
  function findJobByItemNumber(
    jobs: readonly WonderJob<
      unknown,
      unknown
    >[],
    itemNumber: number
  ): WonderJob<
    unknown,
    unknown
  > | null {
    return (
      jobs.find(
        (job) => {
          if (
            typeof job.payload !==
              "object" ||
            job.payload === null ||
            Array.isArray(
              job.payload
            )
          ) {
            return false;
          }
  
          return (
            (
              job.payload as Record<
                string,
                unknown
              >
            ).itemNumber ===
            itemNumber
          );
        }
      ) ??
      null
    );
  }
  
  function readTestPayload(
    value: unknown
  ): TestJobPayload {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        "Wonder Factory test payload must be an object."
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
      typeof record.contentType !==
        "string" ||
      typeof record.shouldFailOnce !==
        "boolean"
    ) {
      throw new Error(
        "Wonder Factory test payload is invalid."
      );
    }
  
    if (
      !isWonderJobType(
        record.contentType
      )
    ) {
      throw new Error(
        "Wonder Factory test payload contains an invalid job type."
      );
    }
  
    return {
      itemNumber:
        record.itemNumber,
  
      title:
        record.title,
  
      contentType:
        record.contentType,
  
      shouldFailOnce:
        record.shouldFailOnce,
    };
  }
  
  function isWonderJobType(
    value: unknown
  ): value is WonderJobType {
    return (
      value ===
        "generation" ||
      value ===
        "validation" ||
      value ===
        "repair" ||
      value ===
        "approval" ||
      value ===
        "publication" ||
      value ===
        "export"
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
  
  function assertArrayEqual<T>(
    actual: readonly T[],
    expected: readonly T[],
    message: string
  ): void {
    if (
      actual.length !==
      expected.length
    ) {
      throw new Error(
        [
          message,
          `Expected length: ${expected.length}`,
          `Actual length: ${actual.length}`,
        ].join(" ")
      );
    }
  
    for (
      let index = 0;
      index < expected.length;
      index += 1
    ) {
      if (
        actual[index] !==
        expected[index]
      ) {
        throw new Error(
          [
            message,
            `Mismatch at index ${index}.`,
            `Expected: ${String(
              expected[index]
            )}`,
            `Actual: ${String(
              actual[index]
            )}`,
          ].join(" ")
        );
      }
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
  
  runWonderFactoryTest()
    .then(
      (result) => {
        console.log(
          "Wonder Factory Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Factory Test Failed",
          error
        );
  
        process.exitCode = 1;
      }
    );
  
  export {
    runWonderFactoryTest,
  };