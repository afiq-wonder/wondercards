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
  
  import type {
    WonderOSEventName,
  } from "@/core/WonderEvents";
  
  import {
    wonderStudio,
  } from "@/studio/WonderStudio";
  
  import {
    createWonderCLIConfig,
  } from "@/studio/cli/WonderCLIConfig";
  
  import {
    WonderCLIReporter,
  } from "@/studio/cli/WonderCLIReporter";
  
  import {
    WonderStudioCLI,
  } from "@/studio/cli/WonderStudioCLI";
  
  interface WonderStudioCLIEventTestResult {
    success: boolean;
  
    pipelineSuccess: boolean;
  
    receivedEvents: WonderOSEventName[];
  
    promptEventCount: number;
  
    validationEventCount: number;
  
    publicationEventCount: number;
  
    historyCount: number;
  
    batchId: string;
  
    catalogPath: string | null;
  
    manifestPath: string | null;
  }
  
  const TEST_BATCH_ID =
    "studio-cli-events-coral-001";
  
  async function runWonderStudioCLIEventTest(): Promise<WonderStudioCLIEventTestResult> {
    const workingDirectory =
      join(
        tmpdir(),
        `wonderos-cli-event-test-${Date.now()}`
      );
  
    const studioRoot =
      join(
        workingDirectory,
        "wonder-studio"
      );
  
    const briefsDirectory =
      join(
        studioRoot,
        "briefs"
      );
  
    const generatedDirectory =
      join(
        studioRoot,
        "generated"
      );
  
    const briefPath =
      join(
        briefsDirectory,
        "content-brief.json"
      );
  
    const generatedPath =
      join(
        generatedDirectory,
        "generated-content.json"
      );
  
    const eventBus =
      createWonderOSEventBus();
  
    const receivedEvents:
      WonderOSEventName[] = [];
  
    let promptEventCount = 0;
  
    let validationEventCount = 0;
  
    let publicationEventCount = 0;
  
    try {
      await mkdir(
        briefsDirectory,
        {
          recursive: true,
        }
      );
  
      await mkdir(
        generatedDirectory,
        {
          recursive: true,
        }
      );
  
      await writeJSONFile(
        briefPath,
        createTestBrief()
      );
  
      await writeJSONFile(
        generatedPath,
        createGeneratedContent()
      );
  
      const promptSubscription =
        eventBus.on(
          "studio:prompt-created",
          async (event) => {
            receivedEvents.push(
               "studio:prompt-created"
            );
  
            promptEventCount += 1;
  
            assertEqual(
              event.payload.batchId,
              TEST_BATCH_ID,
              "Prompt event batch ID should match."
            );
  
            assertEqual(
              event.payload.promptCount,
              1,
              "Prompt event should report one prompt."
            );
  
            assertEqual(
              event.payload.expectedQuantity,
              1,
              "Prompt event should expect one generated item."
            );
  
            assertTrue(
              event.payload.outputPath !==
                null,
              "Prompt output path should exist."
            );
  
            assertEqual(
              event.source,
              "WonderStudioCLI",
              "Prompt event source should be WonderStudioCLI."
            );
          }
        );
  
      const validationSubscription =
        eventBus.on(
          "studio:validation-completed",
          async (event) => {
            receivedEvents.push(
              "studio:validation-completed"
            );
  
            validationEventCount += 1;
  
            assertEqual(
              event.payload.batchId,
              TEST_BATCH_ID,
              "Validation event batch ID should match."
            );
  
            assertEqual(
              event.payload.summary.totalDrafts,
              1,
              "Validation event should report one draft."
            );
  
            assertEqual(
              event.payload.summary.validDrafts,
              1,
              "Validation event should report one valid draft."
            );
  
            assertEqual(
              event.payload.summary.invalidDrafts,
              0,
              "Validation event should report zero invalid drafts."
            );
  
            assertTrue(
              event.payload.summary
                .averageOverallScore >
                0,
              "Validation score should be greater than zero."
            );
  
            assertTrue(
              event.payload.reportPath !==
                null,
              "Validation report path should exist."
            );
  
            assertEqual(
              event.source,
              "WonderStudioCLI",
              "Validation event source should be WonderStudioCLI."
            );
          }
        );
  
      const publicationSubscription =
        eventBus.on(
          "studio:catalog-published",
          async (event) => {
            receivedEvents.push(
              "studio:catalog-published"
            );
  
            publicationEventCount += 1;
  
            assertEqual(
              event.payload.batchId,
              TEST_BATCH_ID,
              "Publication event batch ID should match."
            );
  
            assertEqual(
              event.payload.catalogName,
              "WonderOS CLI Event Test Catalog",
              "Published catalog name should match."
            );
  
            assertEqual(
              event.payload.version,
              1,
              "Published catalog version should match."
            );
  
            assertEqual(
              event.payload.format,
              "json",
              "Published catalog format should be JSON."
            );
  
            assertEqual(
              event.payload.counts.adventures,
              1,
              "Published catalog should contain one adventure."
            );
  
            assertEqual(
              event.payload.counts.runtimeStories,
              1,
              "Published catalog should contain one runtime story."
            );
  
            assertEqual(
              event.payload.counts.runtimeMissions,
              1,
              "Published catalog should contain one runtime mission."
            );
  
            assertTrue(
              event.payload.catalogPath !==
                null,
              "Published catalog path should exist."
            );
  
            assertTrue(
              event.payload.manifestPath !==
                null,
              "Published manifest path should exist."
            );
  
            assertEqual(
              event.source,
              "WonderStudioCLI",
              "Publication event source should be WonderStudioCLI."
            );
          }
        );
  
      const config =
        createWonderCLIConfig({
          paths: {
            rootDirectory:
              "wonder-studio",
          },
  
          quality: {
            minimumOverallScore: 6,
  
            minimumCriticalScore: 6,
  
            duplicateThreshold: 0.82,
  
            warningsAreErrors: false,
          },
  
          publish: {
            packageName:
              "WonderOS CLI Event Test Catalog",
  
            packageDescription:
              "Sandbox catalog used to test WonderStudioCLI events.",
  
            version: 1,
  
            destination:
              "sandbox-runtime-catalog",
  
            exportFormat:
              "json",
  
            exportName:
              "WONDER_CLI_EVENT_TEST_CATALOG",
  
            requireCompleteImport:
              true,
  
            requireApprovedDrafts:
              true,
  
            notes:
              "Generated by sandbox/testWonderStudioCLIEvents.ts.",
          },
  
          execution: {
            command:
              "pipeline",
  
            batchSize: 25,
  
            autoApproveValidDrafts:
              true,
  
            stopOnValidationFailure:
              true,
  
            overwriteMode:
              "replace",
  
            prettyPrint:
              true,
  
            verbose:
              false,
          },
        });
  
      const reporter =
        new WonderCLIReporter({
          verbose: false,
  
          useColours: false,
  
          showTimestamp: false,
  
          showDetails: false,
  
          silent: true,
        });
  
      const cli =
        new WonderStudioCLI(
          config,
          workingDirectory,
          wonderStudio,
          reporter,
          eventBus
        );
  
      const pipelineResult =
        await cli.runPipeline();
  
      assertTrue(
        pipelineResult.success,
        [
          "WonderStudioCLI pipeline should complete successfully.",
          ...pipelineResult.errors,
        ].join(" ")
      );
  
      assertTrue(
        pipelineResult.publishResult
          ?.success === true,
        "Publication result should be successful."
      );
  
      assertTrue(
        pipelineResult.studioExport !==
          null,
        "Pipeline should create a Studio export."
      );
  
      assertEqual(
        promptEventCount,
        1,
        "Prompt event should be emitted exactly once."
      );
  
      assertEqual(
        validationEventCount,
        1,
        "Validation event should be emitted exactly once."
      );
  
      assertEqual(
        publicationEventCount,
        1,
        "Publication event should be emitted exactly once."
      );
  
      assertArrayEqual(
        receivedEvents,
        [
          "studio:prompt-created",
          "studio:validation-completed",
          "studio:catalog-published",
        ],
        "Studio CLI events should be emitted in pipeline order."
      );
  
      const history =
        eventBus.getHistory();
  
      assertEqual(
        history.length,
        3,
        "Event history should contain exactly three events."
      );
  
      const promptHistory =
        eventBus.getEventHistory(
          "studio:prompt-created"
        );
  
      const validationHistory =
        eventBus.getEventHistory(
          "studio:validation-completed"
        );
  
      const publicationHistory =
        eventBus.getEventHistory(
          "studio:catalog-published"
        );
  
      assertEqual(
        promptHistory.length,
        1,
        "Prompt history should contain one event."
      );
  
      assertEqual(
        validationHistory.length,
        1,
        "Validation history should contain one event."
      );
  
      assertEqual(
        publicationHistory.length,
        1,
        "Publication history should contain one event."
      );
  
      const lastPublishedEvent =
        eventBus.getLastEvent(
          "studio:catalog-published"
        );
  
      assertTrue(
        lastPublishedEvent !== null,
        "Last catalog publication event should exist."
      );
  
      assertEqual(
        lastPublishedEvent?.payload
          .catalogName,
        "WonderOS CLI Event Test Catalog",
        "Last published catalog name should match."
      );
  
      promptSubscription.unsubscribe();
  
      validationSubscription.unsubscribe();
  
      publicationSubscription.unsubscribe();
  
      assertEqual(
        eventBus.totalListenerCount(),
        0,
        "All test listeners should be unsubscribed."
      );
  
      return {
        success: true,
  
        pipelineSuccess:
          pipelineResult.success,
  
        receivedEvents: [
          ...receivedEvents,
        ],
  
        promptEventCount,
  
        validationEventCount,
  
        publicationEventCount,
  
        historyCount:
          history.length,
  
        batchId:
          pipelineResult.batch?.id ??
          TEST_BATCH_ID,
  
        catalogPath:
          pipelineResult.catalogPath,
  
        manifestPath:
          pipelineResult.manifestPath,
      };
    } finally {
      eventBus.clear();
  
      eventBus.clearHistory();
  
      await rm(
        workingDirectory,
        {
          recursive: true,
  
          force: true,
        }
      );
    }
  }
  
  // =========================================================
  // TEST DATA
  // =========================================================
  
  function createTestBrief(): Record<string, unknown> {
    return {
      id:
        TEST_BATCH_ID,
  
      createdAt:
        new Date().toISOString(),
  
      contentType:
        "adventure",
  
      quantity: 1,
  
      language:
        "English",
  
      locale:
        "en-GB",
  
      friendId:
        "coral",
  
      worldId:
        "coral-world",
  
      valueId:
        "curiosity",
  
      templateId:
        "tiny-mystery",
  
      ageRange: {
        min: 4,
  
        max: 6,
      },
  
      difficulty:
        "easy",
  
      duration: 5,
  
      emotion:
        "wonder",
  
      location:
        "Treasure Cove",
  
      learningObjective:
        "Encourage children to notice details, ask questions, and explore ideas together.",
  
      creativeDirection:
        "Create a gentle underwater mystery with a practical family activity.",
  
      requiredWords: [
        "wonder",
        "discover",
        "together",
      ],
  
      bannedWords: [
        "scary",
        "dangerous",
      ],
  
      tags: [
        "ocean",
        "curiosity",
        "family",
        "offline-play",
      ],
  
      seed:
        "studio-cli-event-test-seed",
    };
  }
  
  function createGeneratedContent(): Record<string, unknown> {
    return {
      batchId:
        TEST_BATCH_ID,
  
      contentType:
        "adventure",
  
      items: [
        {
          temporaryId:
            "the-singing-shell-map",
  
          metadata: {
            friendId:
              "coral",
  
            worldId:
              "coral-world",
  
            valueId:
              "curiosity",
  
            templateId:
              "tiny-mystery",
  
            language:
              "English",
  
            locale:
              "en-GB",
  
            ageRange: {
              min: 4,
  
              max: 6,
            },
  
            difficulty:
              "easy",
  
            duration: 5,
  
            emotion:
              "wonder",
  
            location:
              "Treasure Cove",
  
            tags: [
              "ocean",
              "curiosity",
              "family",
              "offline-play",
            ],
          },
  
          story: {
            title:
              "The Singing Shell Map",
  
            intro:
              "Coral discovered a tiny shell beside the blue sea grass. When the water moved, the shell made a soft musical sound.",
  
            problem:
              "The shell wanted to guide the little fish home, but nobody understood the gentle song or knew which path to follow.",
  
            goal:
              "Coral invited the family to listen carefully, notice each clue, ask curious questions, and discover the hidden path together.",
  
            closing:
              "The family followed the clues and found the shell garden. Coral smiled proudly because their curiosity created a wonderful discovery.",
          },
  
          mission: {
            title:
              "Create a Singing Shell Map",
  
            objective:
              "Practise curiosity, careful listening, imagination, and teamwork through a simple family treasure activity.",
  
            activity:
              "Draw a treasure map on paper. Add three landmarks and hide one small object nearby. Take turns asking questions, listening to clues, and finding the hidden treasure together.",
  
            successMessage:
              "Wonderful exploring! Your careful questions and creative ideas helped everyone discover the treasure together.",
  
            supplies: [
              "Paper",
              "Crayons",
              "One small household object",
            ],
          },
        },
      ],
    };
  }
  
  // =========================================================
  // FILE HELPERS
  // =========================================================
  
  async function writeJSONFile(
    filePath: string,
    value: unknown
  ): Promise<void> {
    await writeFile(
      filePath,
      `${JSON.stringify(
        value,
        null,
        2
      )}\n`,
      {
        encoding: "utf8",
      }
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
  // EXECUTION
  // =========================================================
  
  runWonderStudioCLIEventTest()
    .then(
      (result) => {
        console.log(
          "Wonder Studio CLI Event Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Studio CLI Event Test Failed",
          error
        );
  
        process.exitCode = 1;
      }
    );
  
  export {
    runWonderStudioCLIEventTest,
  };