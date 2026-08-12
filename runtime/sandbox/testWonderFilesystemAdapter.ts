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
    WonderFilesystemAdapter,
  } from "@/factory/storage/adapters/WonderFilesystemAdapter";
  
  import {
    WonderStorageError,
  } from "@/factory/storage/WonderStorageAdapter";
  
  // =========================================================
  // TEST TYPES
  // =========================================================
  
  interface FilesystemTestValue {
    id: string;
  
    title: string;
  
    revisionLabel: string;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    optionalValue?: string;
  
    metadata: {
      category: string;
  
      active: boolean;
  
      score: number;
    };
  
    tags: string[];
  
    counters: Map<
      string,
      number
    >;
  
    permissions: Set<string>;
  
    binary: Uint8Array;
  }
  
  interface WonderFilesystemAdapterTestSummary {
    success: boolean;
  
    initialSaveSucceeded: boolean;
  
    secondSaveSucceeded: boolean;
  
    initialRevision: number;
  
    secondRevision: number;
  
    revisionConflictDetected: boolean;
  
    etagConflictDetected: boolean;
  
    datesPreserved: boolean;
  
    mapPreserved: boolean;
  
    setPreserved: boolean;
  
    binaryPreserved: boolean;
  
    backupsCreated: number;
  
    corruptionDetected: boolean;
  
    fallbackUsed: boolean;
  
    fallbackRevision: number;
  
    backupRestored: boolean;
  
    restoredRevision: number;
  
    deleteSucceeded: boolean;
  
    deleteBackupCreated: boolean;
  
    existsAfterDelete: boolean;
  
    existsAfterRestore: boolean;
  
    healthBeforeDelete: boolean;
  
    healthAfterRestore: boolean;
  
    finalObjectCount: number;
  
    finalBackupCount: number;
  
    finalRevision: number | null;
  
    storagePath: string;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const TEST_VALUE_ID =
    "wonder-filesystem-test-001";
  
  // =========================================================
  // TEST
  // =========================================================
  
  async function runWonderFilesystemAdapterTest(): Promise<WonderFilesystemAdapterTestSummary> {
    const workingDirectory =
      join(
        tmpdir(),
        `wonder-filesystem-adapter-test-${Date.now()}`
      );
  
    const storagePath =
      join(
        workingDirectory,
        "state",
        "wonder-storage.json"
      );
  
    await mkdir(
      workingDirectory,
      {
        recursive: true,
      }
    );
  
    const adapter =
      new WonderFilesystemAdapter<FilesystemTestValue>({
        filePath:
          storagePath,
  
        workingDirectory,
  
        name:
          "Wonder Filesystem Sandbox Adapter",
  
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
  
    try {
      // =======================================================
      // INITIAL STATE
      // =======================================================
  
      assertEqual(
        await adapter.exists(),
        false,
        "Storage should not exist before the first save."
      );
  
      const initialStatistics =
        await adapter.getStatistics();
  
      assertEqual(
        initialStatistics.exists,
        false,
        "Initial statistics should report missing storage."
      );
  
      assertEqual(
        initialStatistics.objectCount,
        0,
        "Initial object count should be zero."
      );
  
      // =======================================================
      // FIRST SAVE
      // =======================================================
  
      const firstValue =
        createTestValue(
          "revision-one",
          1
        );
  
      const firstSave =
        await adapter.save(
          firstValue,
          {
            createBackup:
              true,
  
            overwrite:
              true,
  
            metadata: {
              test:
                "first-save",
  
              environment:
                "sandbox",
            },
          }
        );
  
      assertTrue(
        firstSave.success,
        "First filesystem save should succeed."
      );
  
      assertEqual(
        firstSave.metadata.revision,
        1,
        "First save should create revision one."
      );
  
      assertEqual(
        firstSave.backupCreated,
        false,
        "First save should not create a backup because no previous state exists."
      );
  
      assertEqual(
        firstSave.backupId,
        null,
        "First save should not return a backup ID."
      );
  
      assertEqual(
        await adapter.exists(),
        true,
        "Storage should exist after the first save."
      );
  
      const firstRevision =
        await adapter.getRevision();
  
      assertTrue(
        firstRevision !==
          null,
        "First revision should exist."
      );
  
      assertEqual(
        firstRevision?.revision,
        1,
        "Stored revision should be one."
      );
  
      assertTrue(
        typeof firstRevision?.etag ===
          "string" &&
        firstRevision.etag.length >
          0,
        "First revision should contain an ETag."
      );
  
      // =======================================================
      // FIRST LOAD
      // =======================================================
  
      const firstLoad =
        await adapter.load({
          validateChecksum:
            true,
        });
  
      assertTrue(
        firstLoad.success,
        "First filesystem load should succeed."
      );
  
      assertEqual(
        firstLoad.restoredFromBackup,
        false,
        "Healthy primary storage should not use a backup."
      );
  
      assertEqual(
        firstLoad.metadata.revision,
        1,
        "First load should return revision one."
      );
  
      assertTestValue(
        firstLoad.value,
        "revision-one",
        1
      );
  
      // =======================================================
      // REVISION CHECK
      // =======================================================
  
      const matchingRevisionCheck =
        await adapter.checkRevision({
          expectedRevision:
            1,
  
          expectedEtag:
            firstRevision?.etag ??
            undefined,
        });
  
      assertTrue(
        matchingRevisionCheck.matched,
        "Correct revision and ETag should match."
      );
  
      const nonMatchingRevisionCheck =
        await adapter.checkRevision({
          expectedRevision:
            999,
        });
  
      assertEqual(
        nonMatchingRevisionCheck.matched,
        false,
        "Incorrect revision should not match."
      );
  
      // =======================================================
      // REVISION CONFLICT
      // =======================================================
  
      let revisionConflictDetected =
        false;
  
      try {
        await adapter.save(
          createTestValue(
            "invalid-revision-write",
            999
          ),
          {
            expectedRevision:
              999,
          }
        );
      } catch (error) {
        revisionConflictDetected =
          isStorageErrorCode(
            error,
            "STORAGE_REVISION_MISMATCH"
          );
      }
  
      assertTrue(
        revisionConflictDetected,
        "Incorrect expected revision should be rejected."
      );
  
      // =======================================================
      // ETAG CONFLICT
      // =======================================================
  
      let etagConflictDetected =
        false;
  
      try {
        await adapter.save(
          createTestValue(
            "invalid-etag-write",
            999
          ),
          {
            expectedRevision:
              1,
  
            expectedEtag:
              "incorrect-etag",
          }
        );
      } catch (error) {
        etagConflictDetected =
          isStorageErrorCode(
            error,
            "STORAGE_ETAG_MISMATCH"
          );
      }
  
      assertTrue(
        etagConflictDetected,
        "Incorrect expected ETag should be rejected."
      );
  
      // =======================================================
      // SECOND SAVE AND AUTOMATIC BACKUP
      // =======================================================
  
      const secondValue =
        createTestValue(
          "revision-two",
          2
        );
  
      const secondSave =
        await adapter.save(
          secondValue,
          {
            expectedRevision:
              1,
  
            expectedEtag:
              firstRevision?.etag ??
              undefined,
  
            createBackup:
              true,
  
            metadata: {
              test:
                "second-save",
  
              environment:
                "sandbox",
            },
          }
        );
  
      assertTrue(
        secondSave.success,
        "Second filesystem save should succeed."
      );
  
      assertEqual(
        secondSave.metadata.revision,
        2,
        "Second save should create revision two."
      );
  
      assertTrue(
        secondSave.backupCreated,
        "Second save should back up revision one."
      );
  
      assertTrue(
        typeof secondSave.backupId ===
          "string" &&
        secondSave.backupId.length >
          0,
        "Second save should return a backup ID."
      );
  
      const backupsAfterSecondSave =
        await adapter.listBackups();
  
      assertEqual(
        backupsAfterSecondSave.length,
        1,
        "Exactly one backup should exist after the second save."
      );
  
      assertEqual(
        backupsAfterSecondSave[0]
          ?.revision,
        1,
        "The first backup should contain revision one."
      );
  
      assertEqual(
        backupsAfterSecondSave[0]
          ?.status,
        "available",
        "The first backup should be available."
      );
  
      const secondLoad =
        await adapter.load({
          revision:
            2,
  
          validateChecksum:
            true,
        });
  
      assertEqual(
        secondLoad.metadata.revision,
        2,
        "Second load should return revision two."
      );
  
      assertTestValue(
        secondLoad.value,
        "revision-two",
        2
      );
  
      // =======================================================
      // HEALTH BEFORE CORRUPTION
      // =======================================================
  
      const healthBeforeCorruption =
        await adapter.health();
  
      assertTrue(
        healthBeforeCorruption.healthy,
        "Healthy filesystem storage should pass its health check."
      );
  
      assertEqual(
        healthBeforeCorruption.status,
        "healthy",
        "Healthy filesystem storage should report healthy status."
      );
  
      // =======================================================
      // CORRUPT PRIMARY FILE
      // =======================================================
  
      await writeFile(
        adapter.getPath(),
        "{ intentionally corrupted wonder storage",
        {
          encoding:
            "utf8",
        }
      );
  
      let corruptionDetected =
        false;
  
      try {
        await adapter.load({
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
        "Corrupt primary storage should be rejected."
      );
  
      // =======================================================
      // BACKUP FALLBACK
      // =======================================================
  
      const fallbackLoad =
        await adapter.load({
          allowBackupFallback:
            true,
  
          validateChecksum:
            true,
        });
  
      assertTrue(
        fallbackLoad.success,
        "Backup fallback load should succeed."
      );
  
      assertTrue(
        fallbackLoad.restoredFromBackup,
        "Fallback load should report that a backup was used."
      );
  
      assertEqual(
        fallbackLoad.backupId,
        secondSave.backupId,
        "Fallback should use the backup created before revision two."
      );
  
      assertEqual(
        fallbackLoad.metadata.revision,
        1,
        "Fallback backup should contain revision one."
      );
  
      assertTestValue(
        fallbackLoad.value,
        "revision-one",
        1
      );
  
      // =======================================================
      // RESTORE BACKUP TO PRIMARY
      // =======================================================
  
      const backupId =
        fallbackLoad.backupId;
  
      assertTrue(
        typeof backupId ===
          "string",
        "Fallback backup ID should exist."
      );
  
      const restoreResult =
        await adapter.restoreBackup(
          backupId,
          {
            overwrite:
              true,
  
            validateChecksum:
              true,
          }
        );
  
      assertTrue(
        restoreResult.success,
        "Backup restore should succeed."
      );
  
      assertEqual(
        restoreResult.restoredRevision,
        1,
        "Restoring the first backup should restore revision one."
      );
  
      const loadAfterRestore =
        await adapter.load({
          validateChecksum:
            true,
        });
  
      assertEqual(
        loadAfterRestore.restoredFromBackup,
        false,
        "A restored primary file should load directly."
      );
  
      assertEqual(
        loadAfterRestore.metadata.revision,
        1,
        "Primary storage should contain restored revision one."
      );
  
      assertTestValue(
        loadAfterRestore.value,
        "revision-one",
        1
      );
  
      // =======================================================
      // SAVE AGAIN AFTER RESTORE
      // =======================================================
  
      const restoredRevision =
        await adapter.getRevision();
  
      assertTrue(
        restoredRevision !==
          null,
        "Restored primary revision should exist."
      );
  
      const thirdSave =
        await adapter.save(
          createTestValue(
            "revision-two-after-restore",
            3
          ),
          {
            expectedRevision:
              restoredRevision?.revision,
  
            expectedEtag:
              restoredRevision?.etag ??
              undefined,
  
            createBackup:
              true,
  
            metadata: {
              test:
                "save-after-restore",
            },
          }
        );
  
      assertTrue(
        thirdSave.success,
        "Saving after a backup restore should succeed."
      );
  
      assertEqual(
        thirdSave.metadata.revision,
        2,
        "Saving after restored revision one should create revision two."
      );
  
      // =======================================================
      // DELETE WITH BACKUP
      // =======================================================
  
      const revisionBeforeDelete =
        await adapter.getRevision();
  
      assertTrue(
        revisionBeforeDelete !==
          null,
        "Revision should exist before delete."
      );
  
      const deleteResult =
        await adapter.delete({
          createBackup:
            true,
  
          expectedRevision:
            revisionBeforeDelete?.revision,
  
          expectedEtag:
            revisionBeforeDelete?.etag ??
            undefined,
        });
  
      assertTrue(
        deleteResult.success,
        "Filesystem delete should succeed."
      );
  
      assertEqual(
        deleteResult.previousRevision,
        2,
        "Delete should report the previous revision."
      );
  
      assertTrue(
        deleteResult.backupCreated,
        "Delete should create a backup."
      );
  
      assertTrue(
        typeof deleteResult.backupId ===
          "string",
        "Delete should return its backup ID."
      );
  
      const existsAfterDelete =
        await adapter.exists();
  
      assertEqual(
        existsAfterDelete,
        false,
        "Primary storage should not exist after deletion."
      );
  
      const statisticsAfterDelete =
        await adapter.getStatistics();
  
      assertEqual(
        statisticsAfterDelete.objectCount,
        0,
        "Object count should be zero after delete."
      );
  
      // =======================================================
      // RESTORE DELETE BACKUP
      // =======================================================
  
      const deleteBackupId =
        deleteResult.backupId;
  
      assertTrue(
        typeof deleteBackupId ===
          "string",
        "Delete backup ID should exist."
      );
  
      const restoreDeletedState =
        await adapter.restoreBackup(
          deleteBackupId,
          {
            overwrite:
              true,
  
            validateChecksum:
              true,
          }
        );
  
      assertTrue(
        restoreDeletedState.success,
        "Deleted state should restore from its backup."
      );
  
      const existsAfterRestore =
        await adapter.exists();
  
      assertTrue(
        existsAfterRestore,
        "Primary storage should exist after restoring the delete backup."
      );
  
      const finalLoad =
        await adapter.load({
          validateChecksum:
            true,
        });
  
      assertEqual(
        finalLoad.metadata.revision,
        2,
        "Final restored state should contain revision two."
      );
  
      assertTestValue(
        finalLoad.value,
        "revision-two-after-restore",
        3
      );
  
      // =======================================================
      // FINAL HEALTH AND STATISTICS
      // =======================================================
  
      const healthAfterRestore =
        await adapter.health();
  
      assertTrue(
        healthAfterRestore.healthy,
        "Restored storage should be healthy."
      );
  
      const finalStatistics =
        await adapter.getStatistics();
  
      const finalSnapshot =
        await adapter.getSnapshot();
  
      assertTrue(
        finalStatistics.exists,
        "Final statistics should report existing storage."
      );
  
      assertEqual(
        finalStatistics.objectCount,
        1,
        "Final object count should be one."
      );
  
      assertEqual(
        finalStatistics.currentRevision,
        2,
        "Final current revision should be two."
      );
  
      assertTrue(
        finalStatistics.backupCount >=
          3,
        "Multiple backups should exist after save, restore and delete flows."
      );
  
      assertEqual(
        finalSnapshot.exists,
        true,
        "Final adapter snapshot should report existing storage."
      );
  
      assertEqual(
        finalSnapshot.revision
          ?.revision,
        2,
        "Final adapter snapshot should report revision two."
      );
  
      return {
        success: true,
  
        initialSaveSucceeded:
          firstSave.success,
  
        secondSaveSucceeded:
          secondSave.success,
  
        initialRevision:
          firstSave.metadata
            .revision,
  
        secondRevision:
          secondSave.metadata
            .revision,
  
        revisionConflictDetected,
  
        etagConflictDetected,
  
        datesPreserved:
          finalLoad.value
            .createdAt instanceof
            Date &&
          finalLoad.value
            .updatedAt instanceof
            Date,
  
        mapPreserved:
          finalLoad.value
            .counters instanceof
            Map,
  
        setPreserved:
          finalLoad.value
            .permissions instanceof
            Set,
  
        binaryPreserved:
          finalLoad.value
            .binary instanceof
            Uint8Array,
  
        backupsCreated:
          finalStatistics
            .backupCount,
  
        corruptionDetected,
  
        fallbackUsed:
          fallbackLoad
            .restoredFromBackup,
  
        fallbackRevision:
          fallbackLoad.metadata
            .revision,
  
        backupRestored:
          restoreResult.success,
  
        restoredRevision:
          restoreResult
            .restoredRevision,
  
        deleteSucceeded:
          deleteResult.success,
  
        deleteBackupCreated:
          deleteResult
            .backupCreated,
  
        existsAfterDelete,
  
        existsAfterRestore,
  
        healthBeforeDelete:
          healthBeforeCorruption
            .healthy,
  
        healthAfterRestore:
          healthAfterRestore
            .healthy,
  
        finalObjectCount:
          finalStatistics
            .objectCount,
  
        finalBackupCount:
          finalStatistics
            .backupCount,
  
        finalRevision:
          finalStatistics
            .currentRevision,
  
        storagePath:
          adapter.getPath(),
      };
    } finally {
      await rm(
        workingDirectory,
        {
          recursive:
            true,
  
          force:
            true,
        }
      );
    }
  }
  
  // =========================================================
  // TEST DATA
  // =========================================================
  
  function createTestValue(
    revisionLabel: string,
    score: number
  ): FilesystemTestValue {
    const now =
      new Date();
  
    return {
      id:
        TEST_VALUE_ID,
  
      title:
        "Wonder Filesystem Test",
  
      revisionLabel,
  
      createdAt:
        new Date(
          now.getTime() -
          1_000
        ),
  
      updatedAt:
        new Date(
          now.getTime()
        ),
  
      optionalValue:
        score % 2 === 0
          ? undefined
          : `value-${score}`,
  
      metadata: {
        category:
          "filesystem-test",
  
        active:
          true,
  
        score,
      },
  
      tags: [
        "wonder",
        "filesystem",
        revisionLabel,
      ],
  
      counters:
        new Map<
          string,
          number
        >([
          [
            "save",
            score,
          ],
          [
            "load",
            score + 1,
          ],
        ]),
  
      permissions:
        new Set<string>([
          "read",
          "write",
          revisionLabel,
        ]),
  
      binary:
        new Uint8Array([
          score,
          score + 1,
          score + 2,
        ]),
    };
  }
  
  // =========================================================
  // VALUE ASSERTIONS
  // =========================================================
  
  function assertTestValue(
    value: FilesystemTestValue,
    expectedRevisionLabel: string,
    expectedScore: number
  ): void {
    assertEqual(
      value.id,
      TEST_VALUE_ID,
      "Loaded value ID should match."
    );
  
    assertEqual(
      value.revisionLabel,
      expectedRevisionLabel,
      "Loaded revision label should match."
    );
  
    assertEqual(
      value.metadata.score,
      expectedScore,
      "Loaded score should match."
    );
  
    assertTrue(
      value.createdAt instanceof
        Date,
      "Loaded createdAt should remain a Date."
    );
  
    assertTrue(
      value.updatedAt instanceof
        Date,
      "Loaded updatedAt should remain a Date."
    );
  
    assertTrue(
      value.counters instanceof
        Map,
      "Loaded counters should remain a Map."
    );
  
    assertEqual(
      value.counters.get(
        "save"
      ),
      expectedScore,
      "Loaded Map value should match."
    );
  
    assertTrue(
      value.permissions instanceof
        Set,
      "Loaded permissions should remain a Set."
    );
  
    assertTrue(
      value.permissions.has(
        expectedRevisionLabel
      ),
      "Loaded Set should contain the revision label."
    );
  
    assertTrue(
      value.binary instanceof
        Uint8Array,
      "Loaded binary value should remain a Uint8Array."
    );
  
    assertEqual(
      value.binary[0],
      expectedScore,
      "Loaded binary content should match."
    );
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
  // EXECUTION
  // =========================================================
  
  runWonderFilesystemAdapterTest()
    .then(
      (result) => {
        console.log(
          "Wonder Filesystem Adapter Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Filesystem Adapter Test Failed",
          error
        );
  
        process.exitCode =
          1;
      }
    );
  
  export {
    runWonderFilesystemAdapterTest,
  };