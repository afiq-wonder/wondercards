import {
    createWonderOSEventBus,
  } from "@/core/WonderEvents";
  
  import type {
    WonderOSEventBus,
  } from "@/core/WonderEvents";
  
  interface WonderEventBusTestResult {
    success: boolean;
  
    receivedEvents: string[];
  
    onceListenerCalls: number;
  
    anyListenerCalls: number;
  
    historyCount: number;
  
    promptHistoryCount: number;
  
    unsubscribedListenerCalled: boolean;
  
    dispatchErrors: number;
  }
  
  async function runWonderEventBusTest(): Promise<WonderEventBusTestResult> {
    const eventBus: WonderOSEventBus =
      createWonderOSEventBus();
  
    const receivedEvents: string[] =
      [];
  
    let onceListenerCalls = 0;
  
    let anyListenerCalls = 0;
  
    let unsubscribedListenerCalled =
      false;
  
    let dispatchErrors = 0;
  
    // =========================================================
    // STANDARD LISTENER
    // =========================================================
  
    const promptSubscription =
      eventBus.on(
        "studio:prompt-created",
        async (event) => {
          receivedEvents.push(
            event.name
          );
  
          assertEqual(
            event.payload.batchId,
            "batch-coral-001",
            "Prompt batch ID should match."
          );
  
          assertEqual(
            event.payload.promptCount,
            2,
            "Prompt count should match."
          );
  
          assertEqual(
            event.payload.expectedQuantity,
            50,
            "Expected quantity should match."
          );
  
          assertEqual(
            event.source,
            "testWonderEventBus",
            "Prompt event source should match."
          );
        }
      );
  
    // =========================================================
    // ONCE LISTENER
    // =========================================================
  
    eventBus.once(
      "studio:validation-completed",
      async (event) => {
        onceListenerCalls += 1;
  
        receivedEvents.push(
          event.name
        );
  
        assertEqual(
          event.payload.summary.validDrafts,
          48,
          "Valid draft count should match."
        );
      }
    );
  
    // =========================================================
    // ANY-EVENT LISTENER
    // =========================================================
  
    const anySubscription =
      eventBus.onAny(
        async (event) => {
          anyListenerCalls += 1;
  
          assertTrue(
            event.name.length > 0,
            "Any-event listener should receive an event name."
          );
        }
      );
  
    // =========================================================
    // LISTENER THAT WILL BE UNSUBSCRIBED
    // =========================================================
  
    const removedSubscription =
      eventBus.on(
        "studio:catalog-published",
        async () => {
          unsubscribedListenerCalled =
            true;
        }
      );
  
    removedSubscription.unsubscribe();
  
    assertFalse(
      removedSubscription.isActive(),
      "Removed subscription should be inactive."
    );
  
    // =========================================================
    // FAILING LISTENER
    // =========================================================
  
    const failingSubscription =
      eventBus.on(
        "studio:catalog-published",
        async () => {
          throw new Error(
            "Intentional test error."
          );
        }
      );
  
    // =========================================================
    // EMIT PROMPT EVENT
    // =========================================================
  
    const promptResult =
      await eventBus.emit(
        "studio:prompt-created",
        {
          batchId:
            "batch-coral-001",
  
          promptIds: [
            "prompt-001",
            "prompt-002",
          ],
  
          promptCount: 2,
  
          expectedQuantity: 50,
  
          outputPath:
            "wonder-studio/prompts/wonder-prompt.txt",
  
          createdAt:
            new Date().toISOString(),
        },
        {
          source:
            "testWonderEventBus",
  
          metadata: {
            environment:
              "sandbox",
          },
  
          mode:
            "sequential",
  
          stopOnError: false,
        }
      );
  
    assertEqual(
      promptResult.listenerCount,
      2,
      "Prompt event should have one named listener and one any-event listener."
    );
  
    assertEqual(
      promptResult.failedListeners,
      0,
      "Prompt event should not fail."
    );
  
    // =========================================================
    // EMIT VALIDATION EVENT TWICE
    // =========================================================
  
    await eventBus.emit(
      "studio:validation-completed",
      {
        batchId:
          "batch-coral-001",
  
        summary: {
          totalDrafts: 50,
  
          validDrafts: 48,
  
          invalidDrafts: 2,
  
          errorCount: 2,
  
          warningCount: 4,
  
          informationCount: 3,
  
          averageOverallScore: 8.7,
        },
  
        reportPath:
          "wonder-studio/reports/validation-report.json",
  
        completedAt:
          new Date().toISOString(),
      },
      {
        source:
          "testWonderEventBus",
      }
    );
  
    await eventBus.emit(
      "studio:validation-completed",
      {
        batchId:
          "batch-coral-001",
  
        summary: {
          totalDrafts: 50,
  
          validDrafts: 48,
  
          invalidDrafts: 2,
  
          errorCount: 2,
  
          warningCount: 4,
  
          informationCount: 3,
  
          averageOverallScore: 8.7,
        },
  
        reportPath:
          "wonder-studio/reports/validation-report.json",
  
        completedAt:
          new Date().toISOString(),
      },
      {
        source:
          "testWonderEventBus",
      }
    );
  
    assertEqual(
      onceListenerCalls,
      1,
      "Once listener should run exactly once."
    );
  
    // =========================================================
    // EMIT CATALOG EVENT
    // =========================================================
  
    const publishResult =
      await eventBus.emit(
        "studio:catalog-published",
        {
          batchId:
            "batch-coral-001",
  
          packageId:
            "wonder-coral-catalog-v1",
  
          catalogName:
            "Wonder Coral Catalog",
  
          version: 1,
  
          destination:
            "wonder-runtime-catalog",
  
          format:
            "json",
  
          counts: {
            stories: 0,
  
            missions: 0,
  
            adventures: 48,
  
            runtimeStories: 48,
  
            runtimeMissions: 48,
          },
  
          catalogPath:
            "wonder-studio/catalogs/wonder-coral-catalog.json",
  
          manifestPath:
            "wonder-studio/catalogs/publish-manifest.json",
  
          publishedAt:
            new Date().toISOString(),
        },
        {
          source:
            "testWonderEventBus",
  
          mode:
            "parallel",
  
          stopOnError: false,
        }
      );
  
    dispatchErrors +=
      publishResult.failedListeners;
  
    assertEqual(
      publishResult.failedListeners,
      1,
      "Catalog event should capture one intentional listener failure."
    );
  
    assertFalse(
      unsubscribedListenerCalled,
      "Unsubscribed listener must not be called."
    );
  
    // =========================================================
    // HISTORY TESTS
    // =========================================================
  
    const history =
      eventBus.getHistory();
  
    const promptHistory =
      eventBus.getEventHistory(
        "studio:prompt-created"
      );
  
    const lastPublishedEvent =
      eventBus.getLastEvent(
        "studio:catalog-published"
      );
  
    assertEqual(
      history.length,
      4,
      "Event history should contain four emitted events."
    );
  
    assertEqual(
      promptHistory.length,
      1,
      "Prompt history should contain one event."
    );
  
    assertTrue(
      lastPublishedEvent !== null,
      "Last published event should exist."
    );
  
    assertEqual(
      lastPublishedEvent?.payload.packageId,
      "wonder-coral-catalog-v1",
      "Last published package ID should match."
    );
  
    // =========================================================
    // LISTENER STATUS
    // =========================================================
  
    assertTrue(
      promptSubscription.isActive(),
      "Prompt subscription should still be active."
    );
  
    assertTrue(
      anySubscription.isActive(),
      "Any-event subscription should still be active."
    );
  
    assertTrue(
      failingSubscription.isActive(),
      "Failing subscription should remain active."
    );
  
    assertTrue(
      eventBus.hasListeners(
        "studio:prompt-created"
      ),
      "Prompt event should have listeners."
    );
  
    assertEqual(
      eventBus.totalListenerCount(),
      3,
      "Three active subscriptions should remain."
    );
  
    // =========================================================
    // UNSUBSCRIBE REMAINING LISTENERS
    // =========================================================
  
    promptSubscription.unsubscribe();
  
    anySubscription.unsubscribe();
  
    failingSubscription.unsubscribe();
  
    assertEqual(
      eventBus.totalListenerCount(),
      0,
      "All listeners should be removed."
    );
  
    return {
      success: true,
  
      receivedEvents,
  
      onceListenerCalls,
  
      anyListenerCalls,
  
      historyCount:
        history.length,
  
      promptHistoryCount:
        promptHistory.length,
  
      unsubscribedListenerCalled,
  
      dispatchErrors,
    };
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
  ): void {
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
  // EXECUTION
  // =========================================================
  
  runWonderEventBusTest()
    .then(
      (result) => {
        console.log(
          "Wonder Event Bus Test Summary",
          result
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder Event Bus Test Failed",
          error
        );
  
        process.exitCode = 1;
      }
    );
  
  export {
    runWonderEventBusTest,
  };