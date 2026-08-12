import {
    WonderClient,
    WonderAPIError,
  } from "@/sdk/WonderSDK";
  
  const client =
    new WonderClient({
      baseUrl:
        "http://127.0.0.1:8080",
  
      apiKey:
        "wonder-local-secure-key",
  
      timeoutMilliseconds:
        10_000,
  
      retryAttempts:
        2,
  
      onRetry:
        (event) => {
          console.warn(
            [
              "Retrying WonderOS request:",
              event.method,
              event.url,
              `attempt ${event.nextAttempt}`,
            ].join(" ")
          );
        },
    });
  
  async function main(): Promise<void> {
    const health =
      await client.health.get();
  
    console.log(
      "WonderOS Health",
      health
    );
  
    const server =
      await client.server.get();
  
    console.log(
      "WonderOS Server",
      server
    );
  
    const runtime =
      await client.runtime.get();
  
    console.log(
      "Wonder Runtime",
      runtime
    );
  
    const runtimeHealth =
      await client.runtime.health();
  
    console.log(
      "Wonder Runtime Health",
      runtimeHealth
    );
  
    const factoryStatistics =
      await client.factory
        .statistics();
  
    console.log(
      "Wonder Factory Statistics",
      factoryStatistics
    );
  
    const schedulerStatistics =
      await client.scheduler
        .statistics();
  
    console.log(
      "Wonder Scheduler Statistics",
      schedulerStatistics
    );
  
    const jobs =
      await client.jobs.list();
  
    console.log(
      "Wonder Jobs",
      jobs
    );
  
    const schedules =
      await client.schedules
        .list();
  
    console.log(
      "Wonder Schedules",
      schedules
    );
  
    const detailedResponse =
      await client.server
        .getWithResponse();
  
    console.log(
      "Request Metadata",
      {
        requestId:
          detailedResponse.requestId,
  
        statusCode:
          detailedResponse.statusCode,
  
        durationMilliseconds:
          detailedResponse
            .durationMilliseconds,
      }
    );
  }
  
  void main().catch(
    (
      error: unknown
    ) => {
      if (
        error instanceof
        WonderAPIError
      ) {
        console.error(
          "WonderOS API Error",
          {
            code:
              error.code,
  
            message:
              error.message,
  
            requestId:
              error.requestId,
  
            statusCode:
              error.statusCode,
  
            details:
              error.details,
          }
        );
      } else {
        console.error(
          "Wonder SDK Test Failed",
          error
        );
      }
  
      process.exitCode =
        1;
    }
  );