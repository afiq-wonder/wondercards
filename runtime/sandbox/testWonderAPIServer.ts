import {
    WonderAPIServer,
    type WonderAPIServerAddress,
    type WonderAPIServerStatistics,
  } from "@/server/WonderAPIServer";
  
  import {
    wonderRuntime,
  } from "@/factory/runtime/WonderRuntime";
  
  // =========================================================
  // TEST TYPES
  // =========================================================
  
  interface WonderAPIEnvelope<
    TValue = unknown
  > {
    success: boolean;
  
    requestId?: string;
  
    data?: TValue;
  
    error?: {
      code: string;
  
      message: string;
  
      requestId: string;
  
      details?: unknown;
  
      stack?: string;
    };
  }
  
  interface WonderAPIServerTestSummary {
    success: boolean;
  
    serverStarted: boolean;
  
    serverStopped: boolean;
  
    randomPortAssigned: boolean;
  
    healthSucceeded: boolean;
  
    publicRootSucceeded: boolean;
  
    unauthorisedRequestRejected: boolean;
  
    authorisedRequestSucceeded: boolean;
  
    requestIdPreserved: boolean;
  
    corsHeadersPresent: boolean;
  
    runtimeSnapshotSucceeded: boolean;
  
    runtimeHealthSucceeded: boolean;
  
    factoryStatisticsSucceeded: boolean;
  
    schedulerStatisticsSucceeded: boolean;
  
    jobsListSucceeded: boolean;
  
    schedulesListSucceeded: boolean;
  
    missingJobReturned404: boolean;
  
    missingScheduleReturned404: boolean;
  
    malformedJsonRejected: boolean;
  
    unsupportedContentTypeRejected: boolean;
  
    customRouteSucceeded: boolean;
  
    unknownRouteReturned404: boolean;
  
    optionsRequestSucceeded: boolean;
  
    totalRequests: number;
  
    successfulRequests: number;
  
    clientErrorRequests: number;
  
    serverErrorRequests: number;
  
    rejectedRequests: number;
  
    bytesSent: number;
  
    runtimeStatus: string;
  
    address: WonderAPIServerAddress;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const TEST_API_KEY =
    "wonder-api-test-key";
  
  const TEST_REQUEST_ID =
    "wonder-api-test-request-id";
  
  const JSON_CONTENT_TYPE =
    "application/json";
  
  const TEXT_CONTENT_TYPE =
    "text/plain";
  
  // =========================================================
  // MAIN TEST
  // =========================================================
  
  export async function runWonderAPIServerTest(): Promise<
    WonderAPIServerTestSummary
  > {
    const server =
      new WonderAPIServer(
        wonderRuntime,
        {
          id:
            "wonder-api-server-integration-test",
  
          host:
            "127.0.0.1",
  
          port:
            0,
  
          apiPrefix:
            "/api",
  
          authMode:
            "api-key",
  
          apiKey:
            TEST_API_KEY,
  
          apiKeyHeader:
            "x-wonder-api-key",
  
          maximumBodyBytes:
            16_384,
  
          requestTimeoutMilliseconds:
            10_000,
  
          cors:
            true,
  
          corsOrigin:
            "*",
  
          exposeErrorDetails:
            true,
  
          bootRuntimeOnStart:
            false,
  
          shutdownRuntimeOnStop:
            false,
  
          logger:
            async () => {
              // Suppress integration-test request logs.
            },
        }
      );
  
    server.registerRoute(
      "GET",
      "/api/test/echo/:value",
      (
        context,
        parameters
      ) => ({
        requestId:
          context.requestId,
  
        value:
          parameters.value,
  
        query:
          context.url.searchParams
            .get("query"),
  
        method:
          context.method,
  
        pathname:
          context.pathname,
      })
    );
  
    let serverStarted =
      false;
  
    let serverStopped =
      false;
  
    try {
      const startResult =
        await server.start({
          bootRuntime:
            false,
  
          host:
            "127.0.0.1",
  
          port:
            0,
        });
  
      serverStarted =
        startResult.success &&
        startResult.currentStatus ===
          "running" &&
        server.isRunning();
  
      assertTrue(
        serverStarted,
        "Wonder API Server should start successfully."
      );
  
      const address =
        server.getAddress();
  
      assertNotNull(
        address,
        "Wonder API Server should expose its listening address."
      );
  
      const resolvedAddress =
        address;
  
      assertTrue(
        resolvedAddress.port >
          0,
        "Wonder API Server should receive a random operating-system port."
      );
  
      assertEqual(
        startResult.address.port,
        resolvedAddress.port,
        "Start result and server address should use the same port."
      );
  
      const origin =
        resolvedAddress.origin;
  
      // =======================================================
      // PUBLIC HEALTH
      // =======================================================
  
      const healthResponse =
        await requestJson(
          `${origin}/health`
        );
  
      assertEqual(
        healthResponse.response.status,
        200,
        "GET /health should return HTTP 200."
      );
  
      assertTrue(
        healthResponse.body.success,
        "GET /health should return a successful API envelope."
      );
  
      assertTrue(
        isRecord(
          healthResponse.body.data
        ),
        "GET /health should return health data."
      );
  
      const healthData =
        requireRecord(
          healthResponse.body.data,
          "Health response data"
        );
  
      const healthServer =
        requireRecord(
          healthData.server,
          "Health server data"
        );
  
      assertEqual(
        healthServer.status,
        "running",
        "Health endpoint should report the server as running."
      );
  
      // =======================================================
      // PUBLIC API ROOT
      // =======================================================
  
      const rootResponse =
        await requestJson(
          `${origin}/api`
        );
  
      assertEqual(
        rootResponse.response.status,
        200,
        "GET /api should return HTTP 200."
      );
  
      assertTrue(
        rootResponse.body.success,
        "GET /api should return a successful API envelope."
      );
  
      const rootData =
        requireRecord(
          rootResponse.body.data,
          "API root data"
        );
  
      assertEqual(
        rootData.name,
        "WonderOS API",
        "GET /api should identify the WonderOS API."
      );
  
      // =======================================================
      // AUTHENTICATION
      // =======================================================
  
      const unauthorisedResponse =
        await requestJson(
          `${origin}/api/server`
        );
  
      assertEqual(
        unauthorisedResponse
          .response.status,
        401,
        "Protected API route should reject a missing API key."
      );
  
      assertFalse(
        unauthorisedResponse
          .body.success,
        "Unauthorised response should use an unsuccessful envelope."
      );
  
      assertEqual(
        unauthorisedResponse
          .body.error?.code,
        "API_UNAUTHORISED",
        "Missing API key should return API_UNAUTHORISED."
      );
  
      const authorisedServerResponse =
        await requestJson(
          `${origin}/api/server`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        authorisedServerResponse
          .response.status,
        200,
        "Protected route should accept the configured API key."
      );
  
      assertTrue(
        authorisedServerResponse
          .body.success,
        "Authorised server request should succeed."
      );
  
      // =======================================================
      // REQUEST ID
      // =======================================================
  
      const requestIdResponse =
        await requestJson(
          `${origin}/api/server`,
          {
            headers: {
              ...createAuthHeaders(),
  
              "x-wonder-request-id":
                TEST_REQUEST_ID,
            },
          }
        );
  
      assertEqual(
        requestIdResponse
          .response.headers
          .get(
            "x-wonder-request-id"
          ),
        TEST_REQUEST_ID,
        "Response should preserve a provided Wonder request ID."
      );
  
      assertEqual(
        requestIdResponse
          .body.requestId,
        TEST_REQUEST_ID,
        "Response envelope should preserve the request ID."
      );
  
      // =======================================================
      // CORS
      // =======================================================
  
      assertEqual(
        authorisedServerResponse
          .response.headers
          .get(
            "access-control-allow-origin"
          ),
        "*",
        "Server should include the configured CORS origin."
      );
  
      const optionsResponse =
        await fetch(
          `${origin}/api/jobs`,
          {
            method:
              "OPTIONS",
  
            headers: {
              Origin:
                "https://wonder.test",
  
              "access-control-request-method":
                "POST",
            },
          }
        );
  
      assertEqual(
        optionsResponse.status,
        204,
        "OPTIONS request should return HTTP 204."
      );
  
      assertEqual(
        optionsResponse.headers
          .get(
            "access-control-allow-origin"
          ),
        "*",
        "OPTIONS response should include CORS headers."
      );
  
      // =======================================================
      // RUNTIME
      // =======================================================
  
      const runtimeResponse =
        await requestJson(
          `${origin}/api/runtime`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        runtimeResponse.response.status,
        200,
        "GET /api/runtime should return HTTP 200."
      );
  
      assertTrue(
        runtimeResponse.body.success,
        "Runtime snapshot endpoint should succeed."
      );
  
      assertTrue(
        isRecord(
          runtimeResponse.body.data
        ),
        "Runtime snapshot endpoint should return an object."
      );
  
      const runtimeHealthResponse =
        await requestJson(
          `${origin}/api/runtime/health`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        runtimeHealthResponse
          .response.status,
        200,
        "GET /api/runtime/health should return HTTP 200."
      );
  
      assertTrue(
        runtimeHealthResponse
          .body.success,
        "Runtime health endpoint should succeed."
      );
  
      // =======================================================
      // FACTORY
      // =======================================================
  
      const factoryStatisticsResponse =
        await requestJson(
          `${origin}/api/factory/statistics`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        factoryStatisticsResponse
          .response.status,
        200,
        "GET /api/factory/statistics should return HTTP 200."
      );
  
      assertTrue(
        factoryStatisticsResponse
          .body.success,
        "Factory statistics endpoint should succeed."
      );
  
      // =======================================================
      // SCHEDULER
      // =======================================================
  
      const schedulerStatisticsResponse =
        await requestJson(
          `${origin}/api/scheduler/statistics`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        schedulerStatisticsResponse
          .response.status,
        200,
        "GET /api/scheduler/statistics should return HTTP 200."
      );
  
      assertTrue(
        schedulerStatisticsResponse
          .body.success,
        "Scheduler statistics endpoint should succeed."
      );
  
      // =======================================================
      // JOBS
      // =======================================================
  
      const jobsResponse =
        await requestJson(
          `${origin}/api/jobs`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        jobsResponse.response.status,
        200,
        "GET /api/jobs should return HTTP 200."
      );
  
      assertTrue(
        jobsResponse.body.success,
        "Jobs list endpoint should succeed."
      );
  
      assertTrue(
        Array.isArray(
          jobsResponse.body.data
        ),
        "Jobs endpoint should return an array."
      );
  
      const missingJobResponse =
        await requestJson(
          `${origin}/api/jobs/missing-job-id`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        missingJobResponse
          .response.status,
        404,
        "Missing job should return HTTP 404."
      );
  
      assertEqual(
        missingJobResponse
          .body.error?.code,
        "JOB_NOT_FOUND",
        "Missing job should return JOB_NOT_FOUND."
      );
  
      // =======================================================
      // SCHEDULES
      // =======================================================
  
      const schedulesResponse =
        await requestJson(
          `${origin}/api/schedules`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        schedulesResponse
          .response.status,
        200,
        "GET /api/schedules should return HTTP 200."
      );
  
      assertTrue(
        schedulesResponse
          .body.success,
        "Schedules list endpoint should succeed."
      );
  
      assertTrue(
        Array.isArray(
          schedulesResponse.body.data
        ),
        "Schedules endpoint should return an array."
      );
  
      const missingScheduleResponse =
        await requestJson(
          `${origin}/api/schedules/missing-schedule-id`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        missingScheduleResponse
          .response.status,
        404,
        "Missing schedule should return HTTP 404."
      );
  
      assertEqual(
        missingScheduleResponse
          .body.error?.code,
        "SCHEDULE_NOT_FOUND",
        "Missing schedule should return SCHEDULE_NOT_FOUND."
      );
  
      // =======================================================
      // INVALID JSON
      // =======================================================
  
      const malformedJsonResponse =
        await requestJson(
          `${origin}/api/jobs`,
          {
            method:
              "POST",
  
            headers: {
              ...createAuthHeaders(),
  
              "content-type":
                JSON_CONTENT_TYPE,
            },
  
            body:
              "{invalid-json",
          }
        );
  
      assertEqual(
        malformedJsonResponse
          .response.status,
        400,
        "Malformed JSON should return HTTP 400."
      );
  
      assertEqual(
        malformedJsonResponse
          .body.error?.code,
        "INVALID_JSON",
        "Malformed JSON should return INVALID_JSON."
      );
  
      // =======================================================
      // UNSUPPORTED CONTENT TYPE
      // =======================================================
  
      const unsupportedContentTypeResponse =
        await requestJson(
          `${origin}/api/jobs`,
          {
            method:
              "POST",
  
            headers: {
              ...createAuthHeaders(),
  
              "content-type":
                TEXT_CONTENT_TYPE,
            },
  
            body:
              JSON.stringify({
                batchId:
                  "unsupported-content-type",
  
                type:
                  "test",
  
                payload: {},
              }),
          }
        );
  
      assertEqual(
        unsupportedContentTypeResponse
          .response.status,
        415,
        "Unsupported request content type should return HTTP 415."
      );
  
      assertEqual(
        unsupportedContentTypeResponse
          .body.error?.code,
        "UNSUPPORTED_CONTENT_TYPE",
        "Unsupported content type should return UNSUPPORTED_CONTENT_TYPE."
      );
  
      // =======================================================
      // CUSTOM ROUTE + PARAMETER DECODING
      // =======================================================
  
      const customRouteResponse =
        await requestJson(
          `${origin}/api/test/echo/hello%20wonder?query=beast-mode`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        customRouteResponse
          .response.status,
        200,
        "Custom API route should return HTTP 200."
      );
  
      const customRouteData =
        requireRecord(
          customRouteResponse
            .body.data,
          "Custom route data"
        );
  
      assertEqual(
        customRouteData.value,
        "hello wonder",
        "Route parameter should be URI-decoded."
      );
  
      assertEqual(
        customRouteData.query,
        "beast-mode",
        "Custom route should expose URL query parameters."
      );
  
      // =======================================================
      // UNKNOWN ROUTE
      // =======================================================
  
      const unknownRouteResponse =
        await requestJson(
          `${origin}/api/does-not-exist`,
          {
            headers:
              createAuthHeaders(),
          }
        );
  
      assertEqual(
        unknownRouteResponse
          .response.status,
        404,
        "Unknown route should return HTTP 404."
      );
  
      assertEqual(
        unknownRouteResponse
          .body.error?.code,
        "ROUTE_NOT_FOUND",
        "Unknown route should return ROUTE_NOT_FOUND."
      );
  
      // =======================================================
      // STATISTICS
      // =======================================================
  
      const statistics =
        server.getStatistics();
  
      assertTrue(
        statistics.totalRequests >
          0,
        "Server statistics should count requests."
      );
  
      assertTrue(
        statistics.successfulRequests >
          0,
        "Server statistics should count successful requests."
      );
  
      assertTrue(
        statistics.clientErrorRequests >
          0,
        "Server statistics should count client errors."
      );
  
      assertEqual(
        statistics.serverErrorRequests,
        0,
        "Integration test should not produce server errors."
      );
  
      assertTrue(
        statistics.rejectedRequests >
          0,
        "Server statistics should count rejected requests."
      );
  
      assertTrue(
        statistics.bytesSent >
          0,
        "Server statistics should count sent response bytes."
      );
  
      const summary =
        createSummary(
          resolvedAddress,
          statistics,
          {
            serverStarted,
  
            serverStopped:
              false,
          }
        );
  
      return summary;
    } finally {
      const stopResult =
        await server.stop({
          shutdownRuntime:
            false,
        });
  
      serverStopped =
        stopResult.success &&
        stopResult.currentStatus ===
          "stopped" &&
        !server.isRunning();
  
      assertTrue(
        serverStopped,
        "Wonder API Server should stop successfully."
      );
    }
  }
  
  // =========================================================
  // SUMMARY
  // =========================================================
  
  function createSummary(
    address:
      WonderAPIServerAddress,
    statistics:
      WonderAPIServerStatistics,
    lifecycle: {
      serverStarted: boolean;
  
      serverStopped: boolean;
    }
  ): WonderAPIServerTestSummary {
    return {
      success:
        true,
  
      serverStarted:
        lifecycle.serverStarted,
  
      serverStopped:
        true,
  
      randomPortAssigned:
        address.port >
        0,
  
      healthSucceeded:
        true,
  
      publicRootSucceeded:
        true,
  
      unauthorisedRequestRejected:
        true,
  
      authorisedRequestSucceeded:
        true,
  
      requestIdPreserved:
        true,
  
      corsHeadersPresent:
        true,
  
      runtimeSnapshotSucceeded:
        true,
  
      runtimeHealthSucceeded:
        true,
  
      factoryStatisticsSucceeded:
        true,
  
      schedulerStatisticsSucceeded:
        true,
  
      jobsListSucceeded:
        true,
  
      schedulesListSucceeded:
        true,
  
      missingJobReturned404:
        true,
  
      missingScheduleReturned404:
        true,
  
      malformedJsonRejected:
        true,
  
      unsupportedContentTypeRejected:
        true,
  
      customRouteSucceeded:
        true,
  
      unknownRouteReturned404:
        true,
  
      optionsRequestSucceeded:
        true,
  
      totalRequests:
        statistics.totalRequests,
  
      successfulRequests:
        statistics.successfulRequests,
  
      clientErrorRequests:
        statistics.clientErrorRequests,
  
      serverErrorRequests:
        statistics.serverErrorRequests,
  
      rejectedRequests:
        statistics.rejectedRequests,
  
      bytesSent:
        statistics.bytesSent,
  
      runtimeStatus:
        wonderRuntime.getStatus(),
  
      address,
    };
  }
  
  // =========================================================
  // HTTP HELPERS
  // =========================================================
  
  async function requestJson<
    TValue = unknown
  >(
    url: string,
    options:
      RequestInit = {}
  ): Promise<{
    response: Response;
  
    body:
      WonderAPIEnvelope<TValue>;
  }> {
    const response =
      await fetch(
        url,
        options
      );
  
    const content =
      await response.text();
  
    let body:
      WonderAPIEnvelope<TValue>;
  
    try {
      body =
        JSON.parse(
          content
        ) as WonderAPIEnvelope<TValue>;
    } catch (error) {
      throw new Error(
        [
          `Response from "${url}" was not valid JSON.`,
  
          `HTTP status: ${response.status}.`,
  
          `Response body: ${content}`,
  
          `Parse error: ${getErrorMessage(error)}.`,
        ].join(" ")
      );
    }
  
    return {
      response,
  
      body,
    };
  }
  
  function createAuthHeaders(): Record<
    string,
    string
  > {
    return {
      "x-wonder-api-key":
        TEST_API_KEY,
  
      accept:
        JSON_CONTENT_TYPE,
    };
  }
  
  // =========================================================
  // VALUE HELPERS
  // =========================================================
  
  function requireRecord(
    value: unknown,
    message: string
  ): Record<string, unknown> {
    assertTrue(
      isRecord(value),
      `${message} should be an object.`
    );
  
    return value;
  }
  
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
  
  function getErrorMessage(
    error: unknown
  ): string {
    if (
      error instanceof Error
    ) {
      return error.message;
    }
  
    return String(error);
  }
  
  // =========================================================
  // ASSERTIONS
  // =========================================================
  
  function assertTrue(
    value: boolean,
    message: string
  ): asserts value {
    if (!value) {
      throw new Error(
        `Assertion failed: ${message}`
      );
    }
  }
  
  function assertFalse(
    value: boolean,
    message: string
  ): void {
    assertTrue(
      !value,
      message
    );
  }
  
  function assertNotNull<
    TValue
  >(
    value:
      TValue | null,
    message: string
  ): asserts value is TValue {
    assertTrue(
      value !== null,
      message
    );
  }
  
  function assertEqual<
    TActual,
    TExpected
  >(
    actual: TActual,
    expected: TExpected,
    message: string
  ): void {
    if (
      !Object.is(
        actual,
        expected
      )
    ) {
      throw new Error(
        [
          `Assertion failed: ${message}`,
  
          `Expected: ${formatValue(expected)}.`,
  
          `Actual: ${formatValue(actual)}.`,
        ].join(" ")
      );
    }
  }
  
  function formatValue(
    value: unknown
  ): string {
    if (
      typeof value ===
      "string"
    ) {
      return JSON.stringify(
        value
      );
    }
  
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return String(value);
    }
  }
  
  // =========================================================
  // EXECUTION
  // =========================================================
  
  void runWonderAPIServerTest()
    .then(
      (summary) => {
        console.log(
          "Wonder API Server Test Summary",
          summary
        );
      }
    )
    .catch(
      (error: unknown) => {
        console.error(
          "Wonder API Server Test Failed",
          error
        );
  
        process.exitCode =
          1;
      }
    );