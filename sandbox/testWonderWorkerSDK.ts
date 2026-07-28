import {
  WonderInMemoryWorkerAdapter,
  WonderWorker,
} from "../worker";

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main(): Promise<void> {
  const adapter = new WonderInMemoryWorkerAdapter();

  const worker = new WonderWorker(
    {
      name: "wonder-card-generator",
      capabilities: ["wondercard.generate"],
      concurrency: 2,
      pollIntervalMilliseconds: 25,
      emptyQueueDelayMilliseconds: 50,
      heartbeatIntervalMilliseconds: 250,
      handlerTimeoutMilliseconds: 5_000,
    },
    adapter,
  );

  worker.process<{ theme: string; ageRange: string }>(
    "wondercard.generate",
    async (job, context) => {
      await context.progress(25, "Creating adventure concept.");
      await sleep(100);
      await context.progress(70, "Preparing offline mission.");
      await sleep(100);
      await context.progress(100, "WonderCard ready.");

      return {
        title: `${job.payload.theme} Adventure`,
        ageRange: job.payload.ageRange,
        storyPrompt: `Explore ${job.payload.theme} together.`,
        offlineMission: `Create a ${job.payload.theme} scene using paper and crayons.`,
      };
    },
  );

  const job = adapter.enqueue({
    type: "wondercard.generate",
    payload: { theme: "Ocean", ageRange: "4-8" },
  });

  console.log("Worker Started", await worker.start());

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const current = adapter.getJob(job.id);
    if (current?.status === "completed" || current?.status === "failed") break;
    await sleep(50);
  }

  console.log("Completed Job", adapter.getJob(job.id));
  console.log("Worker Snapshot", worker.getSnapshot());
  console.log("Worker Stopped", await worker.stop("Integration test completed."));
}

main().catch((error) => {
  console.error("WonderWorker SDK Test Failed", error);
  process.exitCode = 1;
});
