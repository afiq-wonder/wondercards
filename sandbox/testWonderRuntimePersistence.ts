import {
    mkdir,
    rm,
    writeFile,
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
  
  import type {
    WonderFactorySnapshot,
  } from "@/factory/WonderFactory";
  
  import {
    WonderQueue,
  } from "@/factory/queue/WonderQueue";
  
  import {
    WonderRuntimePersistence,
  } from "@/factory/runtime/WonderRuntimePersistence";
  
  import {
    WonderScheduler,
  } from "@/factory/scheduler/WonderScheduler";
  
  import type {
    WonderSchedulerSnapshot,
  } from "@/factory/scheduler/WonderScheduler";
  
  import {
    WonderFilesystemAdapter,
  } from "@/factory/storage/adapters/WonderFilesystemAdapter";
  
  import {
    WonderStorageError,
  } from "@/factory/storage/WonderStorageAdapter";
  
  import {
    WonderWorker,
    WonderWorkerRegistry,
  } from "@/factory/workers/WonderWorker";
  
  // =========================================================
  // TEST TYPES
  // =========================================================
  
  interface RuntimePersistencePayload {
    scheduleKey: string;
  
    title: string;
  
    createdAt: Date;
  
    sequence: number;
  }
  
  interface RuntimePersistenceResult {
    scheduleKey: string;
  
    title: string;
  
    sequence: number;
  
    processedBy: string;
  
    processedAt: Date;
  }
  
  interface WonderRuntimePersistenceTestSummary {
    success: boolean;
  
    initialStorageExists: boolean;
  
    firstSaveSucceeded: boolean;
  
    firstRevision: number;
  
    firstJobCount: number;
  
    firstScheduleCount: number;
  
    secondSaveSucceeded: boolean;
  
    secondRevision: number;
  
    secondJobCount: number;
  
    secondScheduleCount: number;
  
    backupCreated: boolean;
  
    backupCount: number;
  
    revisionConflictDetected: boolean;
  
    healthyLoadSucceeded: boolean;
  
    healthyLoadRevision: number;
  
    corruptionDetected: boolean;
  
    fallbackUsed: boolean;
  
    fallbackRevision: number;
  
    fallbackJobCount: number;
  
    fallbackScheduleCount: number;
  
    restoreSucceeded: boolean;
  
    factoryRestoreCallbackCalled: boolean;
  
    schedulerRestoreCallbackCalled: boolean;
  
    restoredFactoryCompletedJobs: number;
  
    restoredSchedulerSchedules: number;
  
    payloadDatesPreserved: boolean;
  
    saveCount: number;
  
    loadCount: number;
  
    restoreCount: number;
  
    failedSaveCount: number;
  
    failedLoadCount: number;
  
    failedRestoreCount: number;
  
    storageHealthy: boolean;
  
    storageObjectCount: number;
  
    storageBackupCount: number;
  
    deleteSucceeded: boolean;
  
    deleteBackupCreated: boolean;
  
    existsAfterDelete: boolean;
  
    sourceFactoryStatus: string;
  
    sourceSchedulerStatus: string;
  
    storagePath: string;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const TEST_BATCH_ID =
    "wonder-runtime-persistence-test-batch-001";
  
  const FIRST_SCHEDULE_ID =
    "runtime-persistence-schedule-001";
  
  const SECOND_SCHEDULE_ID =
    "runtime-persistence-schedule-002";
  
  // =========================================================
  // TEST
  // =========================================================
  
  async function runWonderRuntimePersistenceTest(): Promise<WonderRuntimePersistenceTestSummary> {
    const workingDirectory =
      join(
        tmpdir(),
        `wonder-runtime-persistence-test-${Date.now()}`
      );
  
    const storagePath =
      join(
        workingDirectory,
        "state",
        "wonder-runtime-state.json"
      );
  
    await mkdir(
      workingDirectory,
      {
        recursive: true,
      }
    );
  
    const sourceSystem =
      createRuntimePersistenceSystem(
        "source",
        workingDirectory,
        storagePath
      );
  
    const restoredSystem =
      createRuntimePersistenceSystem(
        "restored",
        workingDirectory,
        storagePath
      );
  
    let factoryRestoreCallbackCalled =
      false;
  
    let schedulerRestoreCallbackCalled =
      false;
  
    let restoredFactorySnapshot:
      WonderFactorySnapshot | null =
      null;
  
    let restoredSchedulerSnapshot:
      WonderSchedulerSnapshot | null =
      null;
  
    const sourcePersistence =
      new WonderRuntimePersistence(
        sourceSystem.factory,
        sourceSystem.scheduler,
        sourceSystem.adapter,
        {
          runtimeId:
            "wonder-runtime-persistence-source",
  
          runtimeName:
            "Wonder Runtime Persistence Source",
  
          metadata: {
            environment:
              "sandbox",
  
            test:
              "runtime-persistence",
          },
        }
      );
  
    const restoredPersistence =
      new WonderRuntimePersistence(
        restoredSystem.factory,
        restoredSystem.scheduler,
        restoredSystem.adapter,
        {
          runtimeId:
            "wonder-runtime-persistence-restored",
  
          runtimeName:
            "Wonder Runtime Persistence Restored",
  
          metadata: {
            environment:
              "sandbox",
  
            test:
              "runtime-persistence-restore",
          },
  
          restoreFactory:
            async ({
              state,
            }) => {
              factoryRestoreCallbackCalled =
                true;
  
              restoredFactorySnapshot =
                cloneUnknownValue(
                  state.factory
                ) as WonderFactorySnapshot;
            },
  
          restoreScheduler:
            async ({
              scheduler,
              state,
            }) => {
              schedulerRestoreCallbackCalled =
                true;
  
              restoredSchedulerSnapshot =
                cloneUnknownValue(
                  state.scheduler
                ) as WonderSchedulerSnapshot;
  
              scheduler.importSnapshot(
                state.scheduler,
                true
              );
            },
        }
      );
  
    let firstJobCount =
      0;
  
    let firstScheduleCount =
      0;
  
    let secondJobCount =
      0;
  
    let secondScheduleCount =
      0;
  
    let revisionConflictDetected =
      false;
  
    let corruptionDetected =
      false;
  
    try {
      // =======================================================
      // INITIAL STATE
      // =======================================================
  
      const initialStorageExists =
        await sourcePersistence
          .exists();
  
      assertEqual(
        initialStorageExists,
        false,
        "Runtime persistence storage should not exist initially."
      );
  
      registerWorkers(
        sourceSystem.factory,
        "source"
      );
  
      assertEqual(
        sourceSystem.factory
          .listWorkers()
          .length,
        2,
        "Source Factory should contain two workers."
      );
  
      await sourceSystem.factory.start({
        automaticPolling:
          false,
      });
  
      await sourceSystem.scheduler.start({
        automaticPolling:
          false,
  
        startFactoryIfNeeded:
          false,
      });
  
      assertEqual(
        sourceSystem.factory
          .getStatus(),
        "running",
        "Source Factory should be running."
      );
  
      assertEqual(
        sourceSystem.scheduler
          .getStatus(),
        "running",
        "Source Scheduler should be running."
      );
  
      // =======================================================
      // FIRST RUNTIME CHANGE
      // =======================================================
  
      const firstBaseTime =
        new Date();
  
      createOnceSchedule(
        sourceSystem.scheduler,
        {
          id:
            FIRST_SCHEDULE_ID,
  
          scheduleKey:
            "first",
  
          title:
            "First Runtime Persistence Job",
  
          sequence: 1,
  
          runAt:
            new Date(
              firstBaseTime.getTime() -
                100
            ),
        }
      );
  
      const firstTick =
        await sourceSystem.scheduler
          .tick(
            firstBaseTime
          );
  
      assertEqual(
        firstTick.submittedJobs,
        1,
        "First Scheduler tick should submit one job."
      );
  
      assertEqual(
        firstTick.failures.length,
        0,
        "First Scheduler tick should have no failures."
      );
  
      const firstFactoryRun =
        await sourceSystem.factory
          .runUntilIdle({
            maximumTicks:
              20,
  
            timeoutMilliseconds:
              10_000,
  
            intervalMilliseconds:
              0,
  
            maximumIdleTicks:
              5,
  
            startIfNeeded:
              false,
          });
  
      assertTrue(
        firstFactoryRun.success,
        [
          "Factory should process the first persisted Runtime job.",
          ...firstFactoryRun.errors,
        ].join(" ")
      );
  
      assertTrue(
        firstFactoryRun.idle,
        "Factory should become idle after the first job."
      );
  
      const firstQueueStatistics =
        sourceSystem.factory
          .getQueue()
          .getStatistics();
  
      const firstSchedulerStatistics =
        sourceSystem.scheduler
          .getStatistics();
  
      firstJobCount =
        firstQueueStatistics
          .totalJobs;
  
      firstScheduleCount =
        firstSchedulerStatistics
          .totalSchedules;
  
      assertEqual(
        firstQueueStatistics
          .completedJobs,
        1,
        "One job should be completed before the first save."
      );
  
      assertEqual(
        firstSchedulerStatistics
          .completedSchedules,
        1,
        "One schedule should be completed before the first save."
      );
  
      // =======================================================
      // FIRST SAVE — REVISION 1
      // =======================================================
  
      const firstSave =
        await sourcePersistence.save({
          createBackup:
            true,
  
          overwrite:
            true,
  
          metadata: {
            phase:
              "first-save",
          },
        });
  
      assertTrue(
        firstSave.success,
        "First Runtime persistence save should succeed."
      );
  
      assertEqual(
        firstSave.storage
          .metadata.revision,
        1,
        "First Runtime persistence save should create revision one."
      );
  
      assertEqual(
        firstSave.storage
          .backupCreated,
        false,
        "First save should not create a backup."
      );
  
      assertEqual(
        firstSave.state
          .factory.queue
          .completedJobs,
        1,
        "First persisted Factory snapshot should report one completed job."
      );
  
      assertEqual(
        firstSave.state
          .scheduler.schedules
          .length,
        1,
        "First persisted Scheduler snapshot should contain one schedule."
      );
  
      const firstEtag =
        firstSave.storage
          .metadata.etag;
  
      assertTrue(
        typeof firstEtag ===
          "string" &&
        firstEtag.length >
          0,
        "First persistence revision should contain an ETag."
      );
  
      // =======================================================
      // SECOND RUNTIME CHANGE
      // =======================================================
  
      const secondBaseTime =
        new Date();
  
      createOnceSchedule(
        sourceSystem.scheduler,
        {
          id:
            SECOND_SCHEDULE_ID,
  
          scheduleKey:
            "second",
  
          title:
            "Second Runtime Persistence Job",
  
          sequence: 2,
  
          runAt:
            new Date(
              secondBaseTime.getTime() -
                100
            ),
        }
      );
  
      const secondTick =
        await sourceSystem.scheduler
          .tick(
            secondBaseTime
          );
  
      assertEqual(
        secondTick.submittedJobs,
        1,
        "Second Scheduler tick should submit one job."
      );
  
      assertEqual(
        secondTick.failures.length,
        0,
        "Second Scheduler tick should have no failures."
      );
  
      const secondFactoryRun =
        await sourceSystem.factory
          .runUntilIdle({
            maximumTicks:
              20,
  
            timeoutMilliseconds:
              10_000,
  
            intervalMilliseconds:
              0,
  
            maximumIdleTicks:
              5,
  
            startIfNeeded:
              false,
          });
  
      assertTrue(
        secondFactoryRun.success,
        [
          "Factory should process the second persisted Runtime job.",
          ...secondFactoryRun.errors,
        ].join(" ")
      );
  
      assertTrue(
        secondFactoryRun.idle,
        "Factory should become idle after the second job."
      );
  
      const secondQueueStatistics =
        sourceSystem.factory
          .getQueue()
          .getStatistics();
  
      const secondSchedulerStatistics =
        sourceSystem.scheduler
          .getStatistics();
  
      secondJobCount =
        secondQueueStatistics
          .totalJobs;
  
      secondScheduleCount =
        secondSchedulerStatistics
          .totalSchedules;
  
      assertEqual(
        secondQueueStatistics
          .completedJobs,
        2,
        "Two jobs should be completed before the second save."
      );
  
      assertEqual(
        secondSchedulerStatistics
          .completedSchedules,
        2,
        "Two schedules should be completed before the second save."
      );
  
      // =======================================================
      // REVISION CONFLICT TEST
      // =======================================================
  
      try {
        await sourcePersistence.save({
          expectedRevision:
            999,
  
          metadata: {
            phase:
              "invalid-revision",
          },
        });
      } catch (error) {
        revisionConflictDetected =
          isStorageErrorCode(
            error,
            "STORAGE_REVISION_MISMATCH"
          );
      }
  
      assertTrue(
        revisionConflictDetected,
        "Incorrect expected Runtime revision should be rejected."
      );
  
      // =======================================================
      // SECOND SAVE — REVISION 2 + BACKUP
      // =======================================================
  
      const secondSave =
        await sourcePersistence.save({
          createBackup:
            true,
  
          expectedRevision:
            1,
  
          expectedEtag:
            firstEtag,
  
          metadata: {
            phase:
              "second-save",
          },
        });
  
      assertTrue(
        secondSave.success,
        "Second Runtime persistence save should succeed."
      );
  
      assertEqual(
        secondSave.storage
          .metadata.revision,
        2,
        "Second Runtime persistence save should create revision two."
      );
  
      assertTrue(
        secondSave.storage
          .backupCreated,
        "Second Runtime save should create a backup of revision one."
      );
  
      assertTrue(
        typeof secondSave.storage
          .backupId ===
          "string",
        "Second save should return a backup ID."
      );
  
      assertEqual(
        secondSave.state
          .factory.queue
          .completedJobs,
        2,
        "Second persisted Factory snapshot should report two completed jobs."
      );
  
      assertEqual(
        secondSave.state
          .scheduler.schedules
          .length,
        2,
        "Second persisted Scheduler snapshot should contain two schedules."
      );
  
      const backupList =
        await sourceSystem.adapter
          .listBackups();
  
      assertEqual(
        backupList.length,
        1,
        "One Runtime persistence backup should exist."
      );
  
      assertEqual(
        backupList[0]
          ?.revision,
        1,
        "The Runtime persistence backup should contain revision one."
      );
  
      // =======================================================
      // HEALTHY LOAD — REVISION 2
      // =======================================================
  
      const healthyLoad =
        await sourcePersistence.load({
          validateChecksum:
            true,
        });
  
      assertTrue(
        healthyLoad.success,
        "Healthy Runtime persistence load should succeed."
      );
  
      assertEqual(
        healthyLoad.storage
          .restoredFromBackup,
        false,
        "Healthy load should use primary storage."
      );
  
      assertEqual(
        healthyLoad.storage
          .metadata.revision,
        2,
        "Healthy load should return revision two."
      );
  
      assertEqual(
        healthyLoad.state
          .factory.queue
          .completedJobs,
        2,
        "Healthy load should contain two completed jobs."
      );
  
      assertEqual(
        healthyLoad.state
          .scheduler.schedules
          .length,
        2,
        "Healthy load should contain two schedules."
      );
  
      const healthyPayloadDates =
        healthyLoad.state
          .scheduler.schedules
          .map(
            (schedule) =>
              readRuntimePersistencePayload(
                schedule.job.payload
              ).createdAt
          );
  
      assertTrue(
        healthyPayloadDates.every(
          (date) =>
            date instanceof Date &&
            !Number.isNaN(
              date.getTime()
            )
        ),
        "Healthy Runtime load should preserve payload Date values."
      );
  
      // =======================================================
      // CORRUPT PRIMARY
      // =======================================================
  
      await writeFile(
        sourceSystem.adapter
          .getPath(),
        "{ intentionally corrupted runtime persistence",
        {
          encoding:
            "utf8",
        }
      );
  
      try {
        await sourcePersistence.load({
          allowBackupFallback:
            false,
  
          validateChecksum:
            true,
        });
      } catch (error) {
        corruptionDetected =
          error instanceof
            WonderStorageError;
      }
  
      assertTrue(
        corruptionDetected,
        "Corrupt Runtime persistence state should be detected."
      );
  
      // =======================================================
      // BACKUP FALLBACK — REVISION 1
      // =======================================================
  
      const fallbackLoad =
        await sourcePersistence.load({
          allowBackupFallback:
            true,
  
          validateChecksum:
            true,
        });
  
      assertTrue(
        fallbackLoad.success,
        "Runtime persistence backup fallback should succeed."
      );
  
      assertTrue(
        fallbackLoad.storage
          .restoredFromBackup,
        "Fallback load should report backup usage."
      );
  
      assertEqual(
        fallbackLoad.storage
          .metadata.revision,
        1,
        "Fallback load should return revision one."
      );
  
      assertEqual(
        fallbackLoad.state
          .factory.queue
          .completedJobs,
        1,
        "Fallback Factory snapshot should contain one completed job."
      );
  
      assertEqual(
        fallbackLoad.state
          .scheduler.schedules
          .length,
        1,
        "Fallback Scheduler snapshot should contain one schedule."
      );
  
      const fallbackPayloadDates =
        fallbackLoad.state
          .scheduler.schedules
          .map(
            (schedule) =>
              readRuntimePersistencePayload(
                schedule.job.payload
              ).createdAt
          );
  
      assertTrue(
        fallbackPayloadDates.every(
          (date) =>
            date instanceof Date
        ),
        "Backup fallback should preserve payload Date values."
      );
  
      // =======================================================
      // RESTORE CALLBACKS
      // =======================================================
  
      const restoreResult =
        await restoredPersistence.restore({
          allowBackupFallback:
            true,
  
          validateChecksum:
            true,
  
          restoreFactory:
            true,
  
          restoreScheduler:
            true,
        });
  
      assertTrue(
        restoreResult.success,
        "Generic Runtime persistence restore should succeed."
      );
  
      assertTrue(
        restoreResult.restoredFromBackup,
        "Generic Runtime restore should use the valid backup."
      );
  
      assertEqual(
        restoreResult.revision,
        1,
        "Generic Runtime restore should restore revision one."
      );
  
      assertTrue(
        factoryRestoreCallbackCalled,
        "Factory restore callback should be called."
      );
  
      assertTrue(
        schedulerRestoreCallbackCalled,
        "Scheduler restore callback should be called."
      );
  
      assertTrue(
        restoredFactorySnapshot !== null
      );
      
      const factorySnapshot =
        restoredFactorySnapshot;
      
      assertEqual(
        factorySnapshot.queue.completedJobs,
        1
      );
      assertEqual(
        restoredSchedulerSnapshot
          ?.schedules.length,
        1,
        "Scheduler restore callback should receive one schedule."
      );
  
      assertEqual(
        restoredSystem.scheduler
          .size(),
        1,
        "Restored Scheduler instance should import one schedule."
      );
  
      const importedSchedule =
        restoredSystem.scheduler
          .getSchedule(
            FIRST_SCHEDULE_ID
          );
  
      assertTrue(
        importedSchedule !==
          null,
        "Restored Scheduler should contain the first schedule."
      );
  
      assertEqual(
        importedSchedule
          ?.status,
        "completed",
        "Imported first schedule should retain completed status."
      );
  
      const restoredPayload =
        readRuntimePersistencePayload(
          importedSchedule
            ?.job.payload
        );
  
      assertTrue(
        restoredPayload.createdAt instanceof
          Date,
        "Imported Scheduler payload should preserve its Date."
      );
  
      // =======================================================
      // STATISTICS AND HEALTH
      // =======================================================
  
      const sourcePersistenceStatistics =
        sourcePersistence
          .getStatistics();
  
      const restoredPersistenceStatistics =
        restoredPersistence
          .getStatistics();
  
      assertEqual(
        sourcePersistenceStatistics
          .saveCount,
        2,
        "Source persistence should record two successful saves."
      );
  
      assertEqual(
        sourcePersistenceStatistics
          .failedSaveCount,
        1,
        "Source persistence should record one failed save."
      );
  
      assertEqual(
        sourcePersistenceStatistics
          .loadCount,
        2,
        "Source persistence should record two successful loads."
      );
  
      assertEqual(
        sourcePersistenceStatistics
          .failedLoadCount,
        1,
        "Source persistence should record one failed load."
      );
  
      assertEqual(
        restoredPersistenceStatistics
          .restoreCount,
        1,
        "Restored persistence should record one restore."
      );
  
      assertEqual(
        restoredPersistenceStatistics
          .failedRestoreCount,
        0,
        "Restored persistence should not record failed restores."
      );
  
      const storageHealth =
        await sourcePersistence
          .health();
  
      /*
       * Primary state remains corrupted at this point, therefore
       * the direct adapter health check may report degraded.
       * Restore the valid backup before checking final health.
       */
      assertEqual(
        storageHealth.healthy,
        false,
        "Corrupted primary storage should not report healthy."
      );
  
      const fallbackBackupId =
        fallbackLoad.storage
          .backupId;
  
      assertTrue(
        typeof fallbackBackupId ===
          "string",
        "Fallback backup ID should exist."
      );
  
      const primaryRestore =
        await sourceSystem.adapter
          .restoreBackup(
            fallbackBackupId,
            {
              overwrite:
                true,
  
              validateChecksum:
                true,
            }
          );
  
      assertTrue(
        primaryRestore.success,
        "Primary Runtime state should restore from backup."
      );
  
      const finalHealth =
        await sourcePersistence
          .health();
  
      assertTrue(
        finalHealth.healthy,
        "Restored Runtime persistence storage should be healthy."
      );
  
      const finalStorageStatistics =
        await sourcePersistence
          .getStorageStatistics();
  
      assertEqual(
        finalStorageStatistics
          .objectCount,
        1,
        "Final Runtime persistence storage should contain one object."
      );
  
      assertTrue(
        finalStorageStatistics
          .backupCount >=
          1,
        "Final Runtime persistence storage should retain backups."
      );
  
      // =======================================================
      // SHUTDOWN SOURCE SYSTEM
      // =======================================================
  
      await sourceSystem.scheduler.stop({
        stopFactory:
          false,
      });
  
      await sourceSystem.factory.stop({
        graceful:
          true,
  
        timeoutMilliseconds:
          5_000,
  
        cancelActiveJobsOnTimeout:
          true,
      });
  
      assertEqual(
        sourceSystem.scheduler
          .getStatus(),
        "stopped",
        "Source Scheduler should stop cleanly."
      );
  
      assertEqual(
        sourceSystem.factory
          .getStatus(),
        "stopped",
        "Source Factory should stop cleanly."
      );
  
      // =======================================================
      // DELETE GENERIC RUNTIME STATE
      // =======================================================
  
      const deleteResult =
        await sourcePersistence
          .delete(
            true
          );
  
      assertTrue(
        deleteResult.success,
        "Generic Runtime persistence delete should succeed."
      );
  
      assertTrue(
        deleteResult.backupCreated,
        "Generic Runtime delete should create a backup."
      );
  
      const existsAfterDelete =
        await sourcePersistence
          .exists();
  
      assertEqual(
        existsAfterDelete,
        false,
        "Runtime persistence storage should not exist after delete."
      );
  
      return {
        success: true,
  
        initialStorageExists,
  
        firstSaveSucceeded:
          firstSave.success,
  
        firstRevision:
          firstSave.storage
            .metadata.revision,
  
        firstJobCount,
  
        firstScheduleCount,
  
        secondSaveSucceeded:
          secondSave.success,
  
        secondRevision:
          secondSave.storage
            .metadata.revision,
  
        secondJobCount,
  
        secondScheduleCount,
  
        backupCreated:
          secondSave.storage
            .backupCreated,
  
        backupCount:
          backupList.length,
  
        revisionConflictDetected,
  
        healthyLoadSucceeded:
          healthyLoad.success,
  
        healthyLoadRevision:
          healthyLoad.storage
            .metadata.revision,
  
        corruptionDetected,
  
        fallbackUsed:
          fallbackLoad.storage
            .restoredFromBackup,
  
        fallbackRevision:
          fallbackLoad.storage
            .metadata.revision,
  
        fallbackJobCount:
          fallbackLoad.state
            .factory.queue
            .completedJobs,
  
        fallbackScheduleCount:
          fallbackLoad.state
            .scheduler.schedules
            .length,
  
        restoreSucceeded:
          restoreResult.success,
  
        factoryRestoreCallbackCalled,
  
        schedulerRestoreCallbackCalled,
  
        restoredFactoryCompletedJobs:
          restoredFactorySnapshot
            ?.queue.completedJobs ??
          0,
  
        restoredSchedulerSchedules:
          restoredSystem.scheduler
            .size(),
  
        payloadDatesPreserved:
          restoredPayload
            .createdAt instanceof
            Date,
  
        saveCount:
          sourcePersistenceStatistics
            .saveCount,
  
        loadCount:
          sourcePersistenceStatistics
            .loadCount,
  
        restoreCount:
          restoredPersistenceStatistics
            .restoreCount,
  
        failedSaveCount:
          sourcePersistenceStatistics
            .failedSaveCount,
  
        failedLoadCount:
          sourcePersistenceStatistics
            .failedLoadCount,
  
        failedRestoreCount:
          restoredPersistenceStatistics
            .failedRestoreCount,
  
        storageHealthy:
          finalHealth.healthy,
  
        storageObjectCount:
          finalStorageStatistics
            .objectCount,
  
        storageBackupCount:
          finalStorageStatistics
            .backupCount,
  
        deleteSucceeded:
          deleteResult.success,
  
        deleteBackupCreated:
          deleteResult.backupCreated,
  
        existsAfterDelete,
  
        sourceFactoryStatus:
          sourceSystem.factory
            .getStatus(),
  
        sourceSchedulerStatus:
          sourceSystem.scheduler
            .getStatus(),
  
        storagePath:
          sourceSystem.adapter
            .getPath(),
      };
    } finally {
      await safelyStopScheduler(
        sourceSystem.scheduler
      );
  
      await safelyStopFactory(
        sourceSystem.factory
      );
  
      await safelyStopScheduler(
        restoredSystem.scheduler
      );
  
      await safelyStopFactory(
        restoredSystem.factory
      );
  
      await rm(
        workingDirectory,
        {
          recursive:
            true,
  
          force:
            true,
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
  // SYSTEM CREATION
  // =========================================================
  
  function createRuntimePersistenceSystem(
    suffix: string,
    workingDirectory: string,
    storagePath: string
  ) {
    const eventBus =
      createWonderOSEventBus();
  
    const queue =
      new WonderQueue(
        {
          maximumJobs:
            100,
  
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
            `runtime-persistence-${suffix}-factory`,
  
          name:
            `Runtime Persistence ${suffix} Factory`,
  
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
            `runtime-persistence-${suffix}-scheduler`,
  
          name:
            `Runtime Persistence ${suffix} Scheduler`,
  
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
      const adapter =
      new WonderFilesystemAdapter<
        WonderRuntimePersistedState
      >({
        filePath:
          storagePath,
  
        workingDirectory,
  
        name:
          `Runtime Persistence ${suffix} Filesystem Adapter`,
  
        version:
          "1.0.0-test",
  
        createDirectories:
          true,
  
        atomicWrite:
          true,
  
        validateChecksumOnLoad:
          true,
  
        createBackupBeforeWrite:
          true,
  
        createBackupBeforeDelete:
          true,
  
        maximumBackups:
          10,
      });
  
    return {
      eventBus,
  
      queue,
  
      workers,
  
      factory,
  
      scheduler,
  
      adapter,
    };
  }
  
  // =========================================================
  // SCHEDULES
  // =========================================================
  
  function createOnceSchedule(
    scheduler: WonderScheduler,
    input: {
      id: string;
  
      scheduleKey: string;
  
      title: string;
  
      sequence: number;
  
      runAt: Date;
    }
  ): void {
    scheduler.createOnceSchedule<
      RuntimePersistencePayload
    >({
      id:
        input.id,
  
      name:
        input.title,
  
      runAt:
        new Date(
          input.runAt.getTime()
        ),
  
      job: {
        batchId:
          TEST_BATCH_ID,
  
        type:
          "generation",
  
        payload: {
          scheduleKey:
            input.scheduleKey,
  
          title:
            input.title,
  
          createdAt:
            new Date(),
  
          sequence:
            input.sequence,
        },
  
        priority:
          5,
  
        totalItems:
          2,
  
        maximumAttempts:
          3,
  
        failureStrategy:
          "retry",
  
        metadata: {
          source:
            "sandbox/testWonderRuntimePersistence",
  
          tags: [
            "runtime-persistence",
            input.scheduleKey,
          ],
  
          correlationId:
            TEST_BATCH_ID,
  
          createdBy:
            "WonderLabs",
  
          values: {
            scheduleKey:
              input.scheduleKey,
  
            sequence:
              input.sequence,
          },
        },
      },
  
      tags: [
        "sandbox",
        "runtime-persistence",
        input.scheduleKey,
      ],
  
      metadata: {
        runtimePersistenceTest:
          true,
  
        scheduleKey:
          input.scheduleKey,
      },
    });
  }
  
  // =========================================================
  // WORKERS
  // =========================================================
  
  function registerWorkers(
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
            `runtime-persistence-${suffix}-worker-${String(
              index
            ).padStart(
              3,
              "0"
            )}`,
  
          name:
            `Runtime Persistence ${suffix} Worker ${index}`,
  
          capabilities: [
            "generation",
          ],
  
          executor:
            async (
              job,
              context
            ): Promise<RuntimePersistenceResult> => {
              const payload =
                readRuntimePersistencePayload(
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
  
                sequence:
                  payload.sequence,
  
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
  // PAYLOAD
  // =========================================================
  
  function readRuntimePersistencePayload(
    value: unknown
  ): RuntimePersistencePayload {
    if (
      !isRecord(value) ||
      typeof value.scheduleKey !==
        "string" ||
      typeof value.title !==
        "string" ||
      !(value.createdAt instanceof Date) ||
      typeof value.sequence !==
        "number"
    ) {
      throw new Error(
        "Runtime persistence payload is invalid."
      );
    }
  
    return {
      scheduleKey:
        value.scheduleKey,
  
      title:
        value.title,
  
      createdAt:
        new Date(
          value.createdAt.getTime()
        ),
  
      sequence:
        value.sequence,
    };
  }
  
  // =========================================================
  // CLEANUP
  // =========================================================
  
  async function safelyStopScheduler(
    scheduler: WonderScheduler
  ): Promise<void> {
    const status =
      scheduler.getStatus();
  
    if (
      status === "stopped" ||
      status === "idle"
    ) {
      return;
    }
  
    try {
      await scheduler.stop({
        stopFactory:
          false,
      });
    } catch {
      // Cleanup should not hide the original test failure.
    }
  }
  
  async function safelyStopFactory(
    factory: WonderFactory
  ): Promise<void> {
    if (
      factory.getStatus() ===
        "stopped"
    ) {
      return;
    }
  
    try {
      await factory.stop({
        graceful:
          false,
  
        timeoutMilliseconds:
          100,
  
        cancelActiveJobsOnTimeout:
          true,
      });
    } catch {
      // Cleanup should not hide the original test failure.
    }
  }
  
  // =========================================================
  // ERROR HELPERS
  // =========================================================
  
  function isStorageErrorCode(
    error: unknown,
    code:
      WonderStorageError["code"]
  ): boolean {
    return (
      error instanceof
        WonderStorageError &&
      error.code ===
        code
    );
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
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
      value instanceof Uint8Array
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
        const item of value
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
      isRecord(value)
    ) {
      const cloned:
        Record<string, unknown> =
        {};
  
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
      throw new Error(
        message
      );
    }
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
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
  
  runWonderRuntimePersistenceTest()
    .then(
      (result) => {
        console.log(
          "Wonder Runtime Persistence Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Runtime Persistence Test Failed",
          error
        );
  
        process.exitCode =
          1;
      }
    );
  
  export {
    runWonderRuntimePersistenceTest,
  };