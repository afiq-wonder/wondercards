// =========================================================
// WONDER SDK
// Official TypeScript client for WonderOS API
// =========================================================

// =========================================================
// CORE TYPES
// =========================================================

export type WonderHTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export type WonderRetryMethod =
  | WonderHTTPMethod
  | "OPTIONS";

export interface WonderAPIErrorPayload {
  code: string;

  message: string;

  requestId?: string;

  details?: unknown;

  stack?: string;
}

export interface WonderAPIEnvelope<
  TValue = unknown,
> {
  success: boolean;

  requestId?: string;

  data?: TValue;

  error?: WonderAPIErrorPayload;
}

export interface WonderSDKConfiguration {
  /**
   * WonderOS server origin.
   *
   * Example:
   * http://127.0.0.1:8080
   */
  baseUrl: string;

  /**
   * Optional WonderOS API key.
   */
  apiKey?: string;

  /**
   * API-key header expected by WonderAPIServer.
   *
   * Default:
   * x-wonder-api-key
   */
  apiKeyHeader?: string;

  /**
   * API prefix.
   *
   * Default:
   * /api
   */
  apiPrefix?: string;

  /**
   * Default timeout for every HTTP request.
   *
   * Default:
   * 30000
   */
  timeoutMilliseconds?: number;

  /**
   * Number of automatic retry attempts.
   *
   * Default:
   * 2
   */
  retryAttempts?: number;

  /**
   * Initial retry delay.
   *
   * Default:
   * 250
   */
  retryDelayMilliseconds?: number;

  /**
   * Maximum retry delay.
   *
   * Default:
   * 5000
   */
  maximumRetryDelayMilliseconds?: number;

  /**
   * Enable retries for non-idempotent requests such as POST.
   *
   * Disabled by default to avoid submitting duplicate jobs.
   */
  retryUnsafeMethods?: boolean;

  /**
   * Additional headers included with every request.
   */
  headers?: Record<string, string>;

  /**
   * Custom fetch implementation.
   */
  fetchImplementation?: typeof fetch;

  /**
   * Optional request hook.
   */
  onRequest?: (
    event: WonderSDKRequestEvent
  ) => void | Promise<void>;

  /**
   * Optional response hook.
   */
  onResponse?: (
    event: WonderSDKResponseEvent
  ) => void | Promise<void>;

  /**
   * Optional retry hook.
   */
  onRetry?: (
    event: WonderSDKRetryEvent
  ) => void | Promise<void>;
}

export interface WonderSDKResolvedConfiguration {
  baseUrl: string;

  apiKey: string | null;

  apiKeyHeader: string;

  apiPrefix: string;

  timeoutMilliseconds: number;

  retryAttempts: number;

  retryDelayMilliseconds: number;

  maximumRetryDelayMilliseconds: number;

  retryUnsafeMethods: boolean;

  headers: Readonly<
    Record<string, string>
  >;

  fetchImplementation: typeof fetch;

  onRequest:
    | WonderSDKConfiguration["onRequest"]
    | null;

  onResponse:
    | WonderSDKConfiguration["onResponse"]
    | null;

  onRetry:
    | WonderSDKConfiguration["onRetry"]
    | null;
}

export interface WonderSDKRequestOptions {
  method?: WonderHTTPMethod;

  query?: WonderQueryParameters;

  body?: unknown;

  headers?: Record<string, string>;

  requestId?: string;

  timeoutMilliseconds?: number;

  signal?: AbortSignal;

  retryAttempts?: number;

  retryUnsafeMethods?: boolean;

  expectedStatusCodes?: number[];
}

export type WonderQueryPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined;

export type WonderQueryValue =
  | WonderQueryPrimitive
  | WonderQueryPrimitive[];

export type WonderQueryParameters =
  Record<
    string,
    WonderQueryValue
  >;

export interface WonderSDKRequestEvent {
  method: WonderHTTPMethod;

  url: string;

  requestId: string;

  attempt: number;

  headers: Readonly<
    Record<string, string>
  >;

  body?: unknown;
}

export interface WonderSDKResponseEvent {
  method: WonderHTTPMethod;

  url: string;

  requestId: string;

  attempt: number;

  statusCode: number;

  durationMilliseconds: number;

  success: boolean;
}

export interface WonderSDKRetryEvent {
  method: WonderHTTPMethod;

  url: string;

  requestId: string;

  attempt: number;

  nextAttempt: number;

  delayMilliseconds: number;

  error: unknown;
}

export interface WonderSDKResponse<
  TValue,
> {
  data: TValue;

  requestId: string;

  statusCode: number;

  headers: Headers;

  durationMilliseconds: number;
}

// =========================================================
// DOMAIN TYPES
// =========================================================

export interface WonderServerAddress {
  host: string;

  port: number;

  origin: string;

  apiBaseUrl: string;
}

export interface WonderServerInformation {
  address?: WonderServerAddress;

  statistics?: Record<
    string,
    unknown
  >;

  routes?: unknown[];

  [key: string]: unknown;
}

export interface WonderHealthInformation {
  server?: {
    status?: string;

    [key: string]: unknown;
  };

  runtime?: {
    status?: string;

    [key: string]: unknown;
  };

  [key: string]: unknown;
}

export interface WonderRuntimeSnapshot {
  status?: string;

  [key: string]: unknown;
}

export interface WonderRuntimeHealth {
  status?: string;

  healthy?: boolean;

  [key: string]: unknown;
}

export interface WonderStatistics {
  [key: string]: unknown;
}

export interface WonderJobCreateInput<
  TPayload = unknown,
> {
  batchId: string;

  type: string;

  payload: TPayload;

  id?: string;

  priority?: number;

  maximumAttempts?: number;

  timeoutMilliseconds?: number;

  metadata?: Record<
    string,
    unknown
  >;

  tags?: string[];

  scheduledAt?: string | Date;

  [key: string]: unknown;
}

export interface WonderJob<
  TPayload = unknown,
  TResult = unknown,
> {
  id?: string;

  batchId?: string;

  type?: string;

  payload?: TPayload;

  result?: TResult;

  status?: string;

  createdAt?: string;

  updatedAt?: string;

  startedAt?: string | null;

  completedAt?: string | null;

  failedAt?: string | null;

  attempts?: number;

  error?: unknown;

  [key: string]: unknown;
}

export interface WonderJobListQuery {
  status?: string;

  type?: string;

  batchId?: string;

  limit?: number;

  offset?: number;

  [key: string]:
    | WonderQueryValue;
}

export interface WonderScheduleCreateInput<
  TPayload = unknown,
> {
  id?: string;

  name?: string;

  type: string;

  payload: TPayload;

  batchId?: string;

  enabled?: boolean;

  scheduledAt?: string | Date;

  executeAt?: string | Date;

  intervalMilliseconds?: number;

  cronExpression?: string;

  metadata?: Record<
    string,
    unknown
  >;

  [key: string]: unknown;
}

export interface WonderSchedule<
  TPayload = unknown,
> {
  id?: string;

  name?: string;

  type?: string;

  payload?: TPayload;

  enabled?: boolean;

  nextExecutionAt?: string | null;

  lastExecutionAt?: string | null;

  createdAt?: string;

  updatedAt?: string;

  [key: string]: unknown;
}

export interface WonderScheduleListQuery {
  enabled?: boolean;

  type?: string;

  limit?: number;

  offset?: number;

  [key: string]:
    | WonderQueryValue;
}

export interface WonderSchedulerTickInput {
  now?: string | Date;

  maximumSchedules?: number;

  [key: string]: unknown;
}

export interface WonderSchedulerTickResult {
  [key: string]: unknown;
}

export interface WonderRuntimeOperationResult {
  [key: string]: unknown;
}

// =========================================================
// SDK ERRORS
// =========================================================

export class WonderSDKError extends Error {
  public readonly code: string;

  public readonly requestId:
    | string
    | undefined;

  public readonly statusCode:
    | number
    | undefined;

  public readonly details:
    | unknown;

  public readonly cause:
    | unknown;

  public constructor(
    message: string,
    options: {
      code?: string;

      requestId?: string;

      statusCode?: number;

      details?: unknown;

      cause?: unknown;
    } = {}
  ) {
    super(message);

    this.name =
      "WonderSDKError";

    this.code =
      options.code ??
      "WONDER_SDK_ERROR";

    this.requestId =
      options.requestId;

    this.statusCode =
      options.statusCode;

    this.details =
      options.details;

    this.cause =
      options.cause;

    Object.setPrototypeOf(
      this,
      new.target.prototype
    );
  }
}

export class WonderAPIError extends WonderSDKError {
  public constructor(
    message: string,
    options: {
      code: string;

      requestId?: string;

      statusCode: number;

      details?: unknown;

      cause?: unknown;
    }
  ) {
    super(
      message,
      options
    );

    this.name =
      "WonderAPIError";
  }
}

export class WonderNetworkError extends WonderSDKError {
  public constructor(
    message: string,
    options: {
      requestId?: string;

      cause?: unknown;
    } = {}
  ) {
    super(
      message,
      {
        code:
          "WONDER_NETWORK_ERROR",

        requestId:
          options.requestId,

        cause:
          options.cause,
      }
    );

    this.name =
      "WonderNetworkError";
  }
}

export class WonderTimeoutError extends WonderSDKError {
  public readonly timeoutMilliseconds:
    number;

  public constructor(
    message: string,
    options: {
      requestId?: string;

      timeoutMilliseconds: number;

      cause?: unknown;
    }
  ) {
    super(
      message,
      {
        code:
          "WONDER_REQUEST_TIMEOUT",

        requestId:
          options.requestId,

        details: {
          timeoutMilliseconds:
            options.timeoutMilliseconds,
        },

        cause:
          options.cause,
      }
    );

    this.name =
      "WonderTimeoutError";

    this.timeoutMilliseconds =
      options.timeoutMilliseconds;
  }
}

export class WonderResponseError extends WonderSDKError {
  public constructor(
    message: string,
    options: {
      requestId?: string;

      statusCode?: number;

      details?: unknown;

      cause?: unknown;
    } = {}
  ) {
    super(
      message,
      {
        code:
          "WONDER_INVALID_RESPONSE",

        requestId:
          options.requestId,

        statusCode:
          options.statusCode,

        details:
          options.details,

        cause:
          options.cause,
      }
    );

    this.name =
      "WonderResponseError";
  }
}

// =========================================================
// INTERNAL TRANSPORT
// =========================================================

class WonderTransport {
  private readonly configuration:
    WonderSDKResolvedConfiguration;

  public constructor(
    configuration:
      WonderSDKResolvedConfiguration
  ) {
    this.configuration =
      configuration;
  }

  public getConfiguration(): WonderSDKResolvedConfiguration {
    return this.configuration;
  }

  public async request<
    TValue,
  >(
    path: string,
    options:
      WonderSDKRequestOptions = {}
  ): Promise<
    WonderSDKResponse<TValue>
  > {
    const method =
      options.method ??
      "GET";

    const requestId =
      options.requestId ??
      createRequestId();

    const url =
      buildRequestUrl(
        this.configuration
          .baseUrl,
        path,
        options.query
      );

    const retryAttempts =
      options.retryAttempts ??
      this.configuration
        .retryAttempts;

    const retryUnsafeMethods =
      options.retryUnsafeMethods ??
      this.configuration
        .retryUnsafeMethods;

    const timeoutMilliseconds =
      options.timeoutMilliseconds ??
      this.configuration
        .timeoutMilliseconds;

    const maximumAttempts =
      retryAttempts +
      1;

    let lastError:
      unknown = null;

    for (
      let attempt = 1;
      attempt <=
      maximumAttempts;
      attempt += 1
    ) {
      try {
        return await this.executeRequest<
          TValue
        >(
          url,
          {
            ...options,

            method,

            requestId,

            timeoutMilliseconds,
          },
          attempt
        );
      } catch (error) {
        lastError =
          error;

        const shouldRetry =
          attempt <
            maximumAttempts &&
          isRetryAllowed(
            method,
            retryUnsafeMethods
          ) &&
          isRetryableError(
            error
          );

        if (!shouldRetry) {
          throw error;
        }

        const delayMilliseconds =
          calculateRetryDelay(
            attempt,
            this.configuration
              .retryDelayMilliseconds,
            this.configuration
              .maximumRetryDelayMilliseconds
          );

        await this.configuration
          .onRetry?.({
            method,

            url,

            requestId,

            attempt,

            nextAttempt:
              attempt + 1,

            delayMilliseconds,

            error,
          });

        await delay(
          delayMilliseconds
        );
      }
    }

    throw new WonderSDKError(
      "Wonder SDK request failed after all retry attempts.",
      {
        code:
          "WONDER_RETRY_EXHAUSTED",

        requestId,

        cause:
          lastError,
      }
    );
  }

  private async executeRequest<
    TValue,
  >(
    url: string,
    options:
      WonderSDKRequestOptions & {
        method: WonderHTTPMethod;

        requestId: string;

        timeoutMilliseconds: number;
      },
    attempt: number
  ): Promise<
    WonderSDKResponse<TValue>
  > {
    const headers =
      this.createHeaders(
        options
      );

    const encodedBody =
      encodeRequestBody(
        options.body,
        headers
      );

    await this.configuration
      .onRequest?.({
        method:
          options.method,

        url,

        requestId:
          options.requestId,

        attempt,

        headers,

        body:
          options.body,
      });

    const controller =
      new AbortController();

    const removeExternalAbortListener =
      connectAbortSignals(
        options.signal,
        controller
      );

    const timeout =
      setTimeout(
        () => {
          controller.abort(
            new Error(
              `Request timed out after ${options.timeoutMilliseconds} ms.`
            )
          );
        },
        options.timeoutMilliseconds
      );

    const startedAt =
      Date.now();

    let response:
      Response;

    try {
      response =
        await this.configuration
          .fetchImplementation(
            url,
            {
              method:
                options.method,

              headers,

              body:
                encodedBody,

              signal:
                controller.signal,
            }
          );
    } catch (error) {
      if (
        controller.signal
          .aborted
      ) {
        if (
          options.signal
            ?.aborted
        ) {
          throw new WonderNetworkError(
            "Wonder SDK request was aborted.",
            {
              requestId:
                options.requestId,

              cause:
                options.signal.reason ??
                error,
            }
          );
        }

        throw new WonderTimeoutError(
          `Wonder SDK request timed out after ${options.timeoutMilliseconds} ms.`,
          {
            requestId:
              options.requestId,

            timeoutMilliseconds:
              options.timeoutMilliseconds,

            cause:
              error,
          }
        );
      }

      throw new WonderNetworkError(
        `Unable to connect to WonderOS at "${url}".`,
        {
          requestId:
            options.requestId,

          cause:
            error,
        }
      );
    } finally {
      clearTimeout(
        timeout
      );

      removeExternalAbortListener();
    }

    const durationMilliseconds =
      Date.now() -
      startedAt;

    const envelope =
      await parseAPIEnvelope<
        TValue
      >(
        response,
        options.requestId
      );

    const responseRequestId =
      response.headers.get(
        "x-wonder-request-id"
      ) ??
      envelope.requestId ??
      options.requestId;

    const expectedStatusCodes =
      options.expectedStatusCodes;

    const statusAccepted =
      expectedStatusCodes ===
        undefined
        ? response.ok
        : expectedStatusCodes.includes(
            response.status
          );

    await this.configuration
      .onResponse?.({
        method:
          options.method,

        url,

        requestId:
          responseRequestId,

        attempt,

        statusCode:
          response.status,

        durationMilliseconds,

        success:
          statusAccepted &&
          envelope.success,
      });

    if (
      !statusAccepted ||
      !envelope.success
    ) {
      const apiError =
        envelope.error;

      throw new WonderAPIError(
        apiError?.message ??
          `WonderOS returned HTTP ${response.status}.`,
        {
          code:
            apiError?.code ??
            `HTTP_${response.status}`,

          requestId:
            apiError?.requestId ??
            responseRequestId,

          statusCode:
            response.status,

          details:
            apiError?.details ??
            envelope,
        }
      );
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        envelope,
        "data"
      )
    ) {
      throw new WonderResponseError(
        "WonderOS returned a successful response without a data property.",
        {
          requestId:
            responseRequestId,

          statusCode:
            response.status,

          details:
            envelope,
        }
      );
    }

    return {
      data:
        envelope.data as TValue,

      requestId:
        responseRequestId,

      statusCode:
        response.status,

      headers:
        response.headers,

      durationMilliseconds,
    };
  }

  private createHeaders(
    options:
      WonderSDKRequestOptions & {
        requestId: string;
      }
  ): Record<
    string,
    string
  > {
    const headers: Record<
      string,
      string
    > = {
      accept:
        "application/json",

      ...this.configuration
        .headers,

      ...options.headers,

      "x-wonder-request-id":
        options.requestId,
    };

    if (
      this.configuration
        .apiKey !==
      null
    ) {
      headers[
        this.configuration
          .apiKeyHeader
      ] =
        this.configuration
          .apiKey;
    }

    if (
      options.body !==
        undefined &&
      findHeader(
        headers,
        "content-type"
      ) ===
        null
    ) {
      headers[
        "content-type"
      ] =
        "application/json";
    }

    return headers;
  }
}

// =========================================================
// RESOURCE BASE
// =========================================================

abstract class WonderResource {
  protected readonly transport:
    WonderTransport;

  protected readonly apiPrefix:
    string;

  public constructor(
    transport:
      WonderTransport
  ) {
    this.transport =
      transport;

    this.apiPrefix =
      transport
        .getConfiguration()
        .apiPrefix;
  }

  protected createPath(
    path: string
  ): string {
    const normalisedPath =
      normalisePath(
        path
      );

    if (
      normalisedPath ===
      "/"
    ) {
      return this.apiPrefix;
    }

    return `${this.apiPrefix}${normalisedPath}`;
  }
}

// =========================================================
// HEALTH RESOURCE
// =========================================================

export class WonderHealthResource {
  private readonly transport:
    WonderTransport;

  public constructor(
    transport:
      WonderTransport
  ) {
    this.transport =
      transport;
  }

  public async get(): Promise<
    WonderHealthInformation
  > {
    const response =
      await this.getWithResponse();

    return response.data;
  }

  public getWithResponse(): Promise<
    WonderSDKResponse<
      WonderHealthInformation
    >
  > {
    return this.transport.request<
      WonderHealthInformation
    >(
      "/health"
    );
  }
}

// =========================================================
// SERVER RESOURCE
// =========================================================

export class WonderServerResource extends WonderResource {
  public async get(): Promise<
    WonderServerInformation
  > {
    const response =
      await this.getWithResponse();

    return response.data;
  }

  public getWithResponse(): Promise<
    WonderSDKResponse<
      WonderServerInformation
    >
  > {
    return this.transport.request<
      WonderServerInformation
    >(
      this.createPath(
        "/server"
      )
    );
  }

  public async apiRoot(): Promise<
    Record<string, unknown>
  > {
    const response =
      await this.apiRootWithResponse();

    return response.data;
  }

  public apiRootWithResponse(): Promise<
    WonderSDKResponse<
      Record<string, unknown>
    >
  > {
    return this.transport.request<
      Record<string, unknown>
    >(
      this.apiPrefix
    );
  }
}

// =========================================================
// RUNTIME RESOURCE
// =========================================================

export class WonderRuntimeResource extends WonderResource {
  public async get(): Promise<
    WonderRuntimeSnapshot
  > {
    const response =
      await this.getWithResponse();

    return response.data;
  }

  public getWithResponse(): Promise<
    WonderSDKResponse<
      WonderRuntimeSnapshot
    >
  > {
    return this.transport.request<
      WonderRuntimeSnapshot
    >(
      this.createPath(
        "/runtime"
      )
    );
  }

  public async health(): Promise<
    WonderRuntimeHealth
  > {
    const response =
      await this.healthWithResponse();

    return response.data;
  }

  public healthWithResponse(): Promise<
    WonderSDKResponse<
      WonderRuntimeHealth
    >
  > {
    return this.transport.request<
      WonderRuntimeHealth
    >(
      this.createPath(
        "/runtime/health"
      )
    );
  }

  public async boot(): Promise<
    WonderRuntimeOperationResult
  > {
    const response =
      await this.bootWithResponse();

    return response.data;
  }

  public bootWithResponse(): Promise<
    WonderSDKResponse<
      WonderRuntimeOperationResult
    >
  > {
    return this.transport.request<
      WonderRuntimeOperationResult
    >(
      this.createPath(
        "/runtime/boot"
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async shutdown(): Promise<
    WonderRuntimeOperationResult
  > {
    const response =
      await this.shutdownWithResponse();

    return response.data;
  }

  public shutdownWithResponse(): Promise<
    WonderSDKResponse<
      WonderRuntimeOperationResult
    >
  > {
    return this.transport.request<
      WonderRuntimeOperationResult
    >(
      this.createPath(
        "/runtime/shutdown"
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async start(): Promise<
    WonderRuntimeOperationResult
  > {
    const response =
      await this.startWithResponse();

    return response.data;
  }

  public startWithResponse(): Promise<
    WonderSDKResponse<
      WonderRuntimeOperationResult
    >
  > {
    return this.transport.request<
      WonderRuntimeOperationResult
    >(
      this.createPath(
        "/runtime/start"
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async stop(): Promise<
    WonderRuntimeOperationResult
  > {
    const response =
      await this.stopWithResponse();

    return response.data;
  }

  public stopWithResponse(): Promise<
    WonderSDKResponse<
      WonderRuntimeOperationResult
    >
  > {
    return this.transport.request<
      WonderRuntimeOperationResult
    >(
      this.createPath(
        "/runtime/stop"
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async tick(): Promise<
    WonderRuntimeOperationResult
  > {
    const response =
      await this.tickWithResponse();

    return response.data;
  }

  public tickWithResponse(): Promise<
    WonderSDKResponse<
      WonderRuntimeOperationResult
    >
  > {
    return this.transport.request<
      WonderRuntimeOperationResult
    >(
      this.createPath(
        "/runtime/tick"
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }
}

// =========================================================
// FACTORY RESOURCE
// =========================================================

export class WonderFactoryResource extends WonderResource {
  public async statistics(): Promise<
    WonderStatistics
  > {
    const response =
      await this.statisticsWithResponse();

    return response.data;
  }

  public statisticsWithResponse(): Promise<
    WonderSDKResponse<
      WonderStatistics
    >
  > {
    return this.transport.request<
      WonderStatistics
    >(
      this.createPath(
        "/factory/statistics"
      )
    );
  }
}

// =========================================================
// SCHEDULER RESOURCE
// =========================================================

export class WonderSchedulerResource extends WonderResource {
  public async statistics(): Promise<
    WonderStatistics
  > {
    const response =
      await this.statisticsWithResponse();

    return response.data;
  }

  public statisticsWithResponse(): Promise<
    WonderSDKResponse<
      WonderStatistics
    >
  > {
    return this.transport.request<
      WonderStatistics
    >(
      this.createPath(
        "/scheduler/statistics"
      )
    );
  }

  public async tick(
    input:
      WonderSchedulerTickInput = {}
  ): Promise<
    WonderSchedulerTickResult
  > {
    const response =
      await this.tickWithResponse(
        input
      );

    return response.data;
  }

  public tickWithResponse(
    input:
      WonderSchedulerTickInput = {}
  ): Promise<
    WonderSDKResponse<
      WonderSchedulerTickResult
    >
  > {
    return this.transport.request<
      WonderSchedulerTickResult
    >(
      this.createPath(
        "/scheduler/tick"
      ),
      {
        method:
          "POST",

        body:
          serialiseTemporalValues(
            input
          ),
      }
    );
  }
}

// =========================================================
// JOBS RESOURCE
// =========================================================

export class WonderJobsResource extends WonderResource {
  public async list<
    TPayload = unknown,
    TResult = unknown,
  >(
    query:
      WonderJobListQuery = {}
  ): Promise<
    WonderJob<
      TPayload,
      TResult
    >[]
  > {
    const response =
      await this.listWithResponse<
        TPayload,
        TResult
      >(
        query
      );

    return response.data;
  }

  public listWithResponse<
    TPayload = unknown,
    TResult = unknown,
  >(
    query:
      WonderJobListQuery = {}
  ): Promise<
    WonderSDKResponse<
      WonderJob<
        TPayload,
        TResult
      >[]
    >
  > {
    return this.transport.request<
      WonderJob<
        TPayload,
        TResult
      >[]
    >(
      this.createPath(
        "/jobs"
      ),
      {
        query,
      }
    );
  }

  public async get<
    TPayload = unknown,
    TResult = unknown,
  >(
    jobId: string
  ): Promise<
    WonderJob<
      TPayload,
      TResult
    >
  > {
    const response =
      await this.getWithResponse<
        TPayload,
        TResult
      >(
        jobId
      );

    return response.data;
  }

  public getWithResponse<
    TPayload = unknown,
    TResult = unknown,
  >(
    jobId: string
  ): Promise<
    WonderSDKResponse<
      WonderJob<
        TPayload,
        TResult
      >
    >
  > {
    requireIdentifier(
      jobId,
      "jobId"
    );

    return this.transport.request<
      WonderJob<
        TPayload,
        TResult
      >
    >(
      this.createPath(
        `/jobs/${encodeURIComponent(
          jobId
        )}`
      )
    );
  }

  public async create<
    TPayload = unknown,
    TResult = unknown,
  >(
    input:
      WonderJobCreateInput<TPayload>
  ): Promise<
    WonderJob<
      TPayload,
      TResult
    >
  > {
    const response =
      await this.createWithResponse<
        TPayload,
        TResult
      >(
        input
      );

    return response.data;
  }

  public createWithResponse<
    TPayload = unknown,
    TResult = unknown,
  >(
    input:
      WonderJobCreateInput<TPayload>
  ): Promise<
    WonderSDKResponse<
      WonderJob<
        TPayload,
        TResult
      >
    >
  > {
    validateJobCreateInput(
      input
    );

    return this.transport.request<
      WonderJob<
        TPayload,
        TResult
      >
    >(
      this.createPath(
        "/jobs"
      ),
      {
        method:
          "POST",

        body:
          serialiseTemporalValues(
            input
          ),
      }
    );
  }

  public async cancel<
    TPayload = unknown,
    TResult = unknown,
  >(
    jobId: string
  ): Promise<
    WonderJob<
      TPayload,
      TResult
    >
  > {
    const response =
      await this.cancelWithResponse<
        TPayload,
        TResult
      >(
        jobId
      );

    return response.data;
  }

  public cancelWithResponse<
    TPayload = unknown,
    TResult = unknown,
  >(
    jobId: string
  ): Promise<
    WonderSDKResponse<
      WonderJob<
        TPayload,
        TResult
      >
    >
  > {
    requireIdentifier(
      jobId,
      "jobId"
    );

    return this.transport.request<
      WonderJob<
        TPayload,
        TResult
      >
    >(
      this.createPath(
        `/jobs/${encodeURIComponent(
          jobId
        )}/cancel`
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async retry<
    TPayload = unknown,
    TResult = unknown,
  >(
    jobId: string
  ): Promise<
    WonderJob<
      TPayload,
      TResult
    >
  > {
    const response =
      await this.retryWithResponse<
        TPayload,
        TResult
      >(
        jobId
      );

    return response.data;
  }

  public retryWithResponse<
    TPayload = unknown,
    TResult = unknown,
  >(
    jobId: string
  ): Promise<
    WonderSDKResponse<
      WonderJob<
        TPayload,
        TResult
      >
    >
  > {
    requireIdentifier(
      jobId,
      "jobId"
    );

    return this.transport.request<
      WonderJob<
        TPayload,
        TResult
      >
    >(
      this.createPath(
        `/jobs/${encodeURIComponent(
          jobId
        )}/retry`
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async remove(
    jobId: string
  ): Promise<
    unknown
  > {
    const response =
      await this.removeWithResponse(
        jobId
      );

    return response.data;
  }

  public removeWithResponse(
    jobId: string
  ): Promise<
    WonderSDKResponse<unknown>
  > {
    requireIdentifier(
      jobId,
      "jobId"
    );

    return this.transport.request<
      unknown
    >(
      this.createPath(
        `/jobs/${encodeURIComponent(
          jobId
        )}`
      ),
      {
        method:
          "DELETE",
      }
    );
  }
}

// =========================================================
// SCHEDULES RESOURCE
// =========================================================

export class WonderSchedulesResource extends WonderResource {
  public async list<
    TPayload = unknown,
  >(
    query:
      WonderScheduleListQuery = {}
  ): Promise<
    WonderSchedule<TPayload>[]
  > {
    const response =
      await this.listWithResponse<
        TPayload
      >(
        query
      );

    return response.data;
  }

  public listWithResponse<
    TPayload = unknown,
  >(
    query:
      WonderScheduleListQuery = {}
  ): Promise<
    WonderSDKResponse<
      WonderSchedule<TPayload>[]
    >
  > {
    return this.transport.request<
      WonderSchedule<TPayload>[]
    >(
      this.createPath(
        "/schedules"
      ),
      {
        query,
      }
    );
  }

  public async get<
    TPayload = unknown,
  >(
    scheduleId: string
  ): Promise<
    WonderSchedule<TPayload>
  > {
    const response =
      await this.getWithResponse<
        TPayload
      >(
        scheduleId
      );

    return response.data;
  }

  public getWithResponse<
    TPayload = unknown,
  >(
    scheduleId: string
  ): Promise<
    WonderSDKResponse<
      WonderSchedule<TPayload>
    >
  > {
    requireIdentifier(
      scheduleId,
      "scheduleId"
    );

    return this.transport.request<
      WonderSchedule<TPayload>
    >(
      this.createPath(
        `/schedules/${encodeURIComponent(
          scheduleId
        )}`
      )
    );
  }

  public async once<
    TPayload = unknown,
  >(
    input:
      WonderScheduleCreateInput<TPayload>
  ): Promise<
    WonderSchedule<TPayload>
  > {
    const response =
      await this.onceWithResponse(
        input
      );

    return response.data;
  }

  public onceWithResponse<
    TPayload = unknown,
  >(
    input:
      WonderScheduleCreateInput<TPayload>
  ): Promise<
    WonderSDKResponse<
      WonderSchedule<TPayload>
    >
  > {
    validateScheduleCreateInput(
      input
    );

    return this.transport.request<
      WonderSchedule<TPayload>
    >(
      this.createPath(
        "/schedules/once"
      ),
      {
        method:
          "POST",

        body:
          serialiseTemporalValues(
            input
          ),
      }
    );
  }

  public async create<
    TPayload = unknown,
  >(
    input:
      WonderScheduleCreateInput<TPayload>
  ): Promise<
    WonderSchedule<TPayload>
  > {
    const response =
      await this.createWithResponse(
        input
      );

    return response.data;
  }

  public createWithResponse<
    TPayload = unknown,
  >(
    input:
      WonderScheduleCreateInput<TPayload>
  ): Promise<
    WonderSDKResponse<
      WonderSchedule<TPayload>
    >
  > {
    validateScheduleCreateInput(
      input
    );

    return this.transport.request<
      WonderSchedule<TPayload>
    >(
      this.createPath(
        "/schedules"
      ),
      {
        method:
          "POST",

        body:
          serialiseTemporalValues(
            input
          ),
      }
    );
  }

  public async enable<
    TPayload = unknown,
  >(
    scheduleId: string
  ): Promise<
    WonderSchedule<TPayload>
  > {
    const response =
      await this.enableWithResponse<
        TPayload
      >(
        scheduleId
      );

    return response.data;
  }

  public enableWithResponse<
    TPayload = unknown,
  >(
    scheduleId: string
  ): Promise<
    WonderSDKResponse<
      WonderSchedule<TPayload>
    >
  > {
    requireIdentifier(
      scheduleId,
      "scheduleId"
    );

    return this.transport.request<
      WonderSchedule<TPayload>
    >(
      this.createPath(
        `/schedules/${encodeURIComponent(
          scheduleId
        )}/enable`
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async disable<
    TPayload = unknown,
  >(
    scheduleId: string
  ): Promise<
    WonderSchedule<TPayload>
  > {
    const response =
      await this.disableWithResponse<
        TPayload
      >(
        scheduleId
      );

    return response.data;
  }

  public disableWithResponse<
    TPayload = unknown,
  >(
    scheduleId: string
  ): Promise<
    WonderSDKResponse<
      WonderSchedule<TPayload>
    >
  > {
    requireIdentifier(
      scheduleId,
      "scheduleId"
    );

    return this.transport.request<
      WonderSchedule<TPayload>
    >(
      this.createPath(
        `/schedules/${encodeURIComponent(
          scheduleId
        )}/disable`
      ),
      {
        method:
          "POST",

        body: {},
      }
    );
  }

  public async remove(
    scheduleId: string
  ): Promise<
    unknown
  > {
    const response =
      await this.removeWithResponse(
        scheduleId
      );

    return response.data;
  }

  public removeWithResponse(
    scheduleId: string
  ): Promise<
    WonderSDKResponse<unknown>
  > {
    requireIdentifier(
      scheduleId,
      "scheduleId"
    );

    return this.transport.request<
      unknown
    >(
      this.createPath(
        `/schedules/${encodeURIComponent(
          scheduleId
        )}`
      ),
      {
        method:
          "DELETE",
      }
    );
  }
}

// =========================================================
// WONDER CLIENT
// =========================================================

export class WonderClient {
  public readonly health:
    WonderHealthResource;

  public readonly server:
    WonderServerResource;

  public readonly runtime:
    WonderRuntimeResource;

  public readonly factory:
    WonderFactoryResource;

  public readonly scheduler:
    WonderSchedulerResource;

  public readonly jobs:
    WonderJobsResource;

  public readonly schedules:
    WonderSchedulesResource;

  private readonly transport:
    WonderTransport;

  public constructor(
    configuration:
      WonderSDKConfiguration
  ) {
    const resolvedConfiguration =
      resolveConfiguration(
        configuration
      );

    this.transport =
      new WonderTransport(
        resolvedConfiguration
      );

    this.health =
      new WonderHealthResource(
        this.transport
      );

    this.server =
      new WonderServerResource(
        this.transport
      );

    this.runtime =
      new WonderRuntimeResource(
        this.transport
      );

    this.factory =
      new WonderFactoryResource(
        this.transport
      );

    this.scheduler =
      new WonderSchedulerResource(
        this.transport
      );

    this.jobs =
      new WonderJobsResource(
        this.transport
      );

    this.schedules =
      new WonderSchedulesResource(
        this.transport
      );
  }

  public getConfiguration(): WonderSDKResolvedConfiguration {
    return this.transport
      .getConfiguration();
  }

  public async request<
    TValue,
  >(
    path: string,
    options:
      WonderSDKRequestOptions = {}
  ): Promise<TValue> {
    const response =
      await this.requestWithResponse<
        TValue
      >(
        path,
        options
      );

    return response.data;
  }

  public requestWithResponse<
    TValue,
  >(
    path: string,
    options:
      WonderSDKRequestOptions = {}
  ): Promise<
    WonderSDKResponse<TValue>
  > {
    return this.transport.request<
      TValue
    >(
      path,
      options
    );
  }
}

// =========================================================
// FACTORY FUNCTION
// =========================================================

export function createWonderClient(
  configuration:
    WonderSDKConfiguration
): WonderClient {
  return new WonderClient(
    configuration
  );
}

// =========================================================
// CONFIGURATION HELPERS
// =========================================================

function resolveConfiguration(
  configuration:
    WonderSDKConfiguration
): WonderSDKResolvedConfiguration {
  if (
    typeof configuration !==
      "object" ||
    configuration ===
      null
  ) {
    throw new WonderSDKError(
      "Wonder SDK configuration is required.",
      {
        code:
          "WONDER_INVALID_CONFIGURATION",
      }
    );
  }

  const baseUrl =
    normaliseBaseUrl(
      configuration.baseUrl
    );

  const apiPrefix =
    normaliseApiPrefix(
      configuration.apiPrefix ??
        "/api"
    );

  const apiKeyHeader =
    normaliseHeaderName(
      configuration.apiKeyHeader ??
        "x-wonder-api-key"
    );

  const timeoutMilliseconds =
    requirePositiveInteger(
      configuration
        .timeoutMilliseconds ??
        30_000,
      "timeoutMilliseconds"
    );

  const retryAttempts =
    requireNonNegativeInteger(
      configuration
        .retryAttempts ??
        2,
      "retryAttempts"
    );

  const retryDelayMilliseconds =
    requireNonNegativeInteger(
      configuration
        .retryDelayMilliseconds ??
        250,
      "retryDelayMilliseconds"
    );

  const maximumRetryDelayMilliseconds =
    requirePositiveInteger(
      configuration
        .maximumRetryDelayMilliseconds ??
        5_000,
      "maximumRetryDelayMilliseconds"
    );

  if (
    maximumRetryDelayMilliseconds <
    retryDelayMilliseconds
  ) {
    throw new WonderSDKError(
      "maximumRetryDelayMilliseconds cannot be smaller than retryDelayMilliseconds.",
      {
        code:
          "WONDER_INVALID_CONFIGURATION",
      }
    );
  }

  const fetchImplementation =
    configuration
      .fetchImplementation ??
    globalThis.fetch;

  if (
    typeof fetchImplementation !==
    "function"
  ) {
    throw new WonderSDKError(
      "No Fetch API implementation is available.",
      {
        code:
          "WONDER_FETCH_UNAVAILABLE",
      }
    );
  }

  const apiKey =
    normaliseOptionalString(
      configuration.apiKey
    );

  return Object.freeze({
    baseUrl,

    apiKey,

    apiKeyHeader,

    apiPrefix,

    timeoutMilliseconds,

    retryAttempts,

    retryDelayMilliseconds,

    maximumRetryDelayMilliseconds,

    retryUnsafeMethods:
      configuration
        .retryUnsafeMethods ??
      false,

    headers:
      Object.freeze({
        ...(configuration
          .headers ??
        {}),
      }),

    fetchImplementation,

    onRequest:
      configuration.onRequest ??
      null,

    onResponse:
      configuration.onResponse ??
      null,

    onRetry:
      configuration.onRetry ??
      null,
  });
}

// =========================================================
// REQUEST HELPERS
// =========================================================

function buildRequestUrl(
  baseUrl: string,
  path: string,
  query:
    WonderQueryParameters
      | undefined
): string {
  const url =
    isAbsoluteUrl(
      path
    )
      ? new URL(path)
      : new URL(
          normalisePath(
            path
          ),
          `${baseUrl}/`
        );

  if (
    query !==
    undefined
  ) {
    appendQueryParameters(
      url,
      query
    );
  }

  return url.toString();
}

function appendQueryParameters(
  url: URL,
  query:
    WonderQueryParameters
): void {
  for (
    const [
      key,
      value,
    ] of Object.entries(
      query
    )
  ) {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      continue;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      for (
        const item of value
      ) {
        if (
          item ===
            undefined ||
          item ===
            null
        ) {
          continue;
        }

        url.searchParams.append(
          key,
          String(item)
        );
      }

      continue;
    }

    url.searchParams.set(
      key,
      String(value)
    );
  }
}

function encodeRequestBody(
  body: unknown,
  headers:
    Record<string, string>
):
  | string
  | BodyInit
  | undefined {
  if (
    body ===
    undefined
  ) {
    return undefined;
  }

  if (
    typeof body ===
      "string" ||
    body instanceof
      ArrayBuffer ||
    ArrayBuffer.isView(
      body
    ) ||
    body instanceof
      Blob ||
    body instanceof
      FormData ||
    body instanceof
      URLSearchParams
  ) {
    return body as BodyInit;
  }

  const contentType =
    findHeader(
      headers,
      "content-type"
    );

  if (
    contentType
      ?.toLowerCase()
      .includes(
        "application/json"
      )
  ) {
    try {
      return JSON.stringify(
        body
      );
    } catch (error) {
      throw new WonderSDKError(
        "Unable to serialise Wonder SDK request body.",
        {
          code:
            "WONDER_BODY_SERIALISATION_FAILED",

          cause:
            error,
        }
      );
    }
  }

  return String(body);
}

async function parseAPIEnvelope<
  TValue,
>(
  response: Response,
  requestId: string
): Promise<
  WonderAPIEnvelope<TValue>
> {
  const responseText =
    await response.text();

  if (
    responseText.trim()
      .length ===
    0
  ) {
    throw new WonderResponseError(
      "WonderOS returned an empty response body.",
      {
        requestId,

        statusCode:
          response.status,
      }
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        responseText
      );
  } catch (error) {
    throw new WonderResponseError(
      "WonderOS returned invalid JSON.",
      {
        requestId,

        statusCode:
          response.status,

        details: {
          responseText,
        },

        cause:
          error,
      }
    );
  }

  if (
    !isRecord(
      parsed
    ) ||
    typeof parsed.success !==
      "boolean"
  ) {
    throw new WonderResponseError(
      "WonderOS returned an invalid API envelope.",
      {
        requestId,

        statusCode:
          response.status,

        details:
          parsed,
      }
    );
  }

  return parsed as unknown as WonderAPIEnvelope<TValue>;
}

function connectAbortSignals(
  externalSignal:
    AbortSignal | undefined,
  controller:
    AbortController
): () => void {
  if (
    externalSignal ===
    undefined
  ) {
    return () => {
      // No external listener.
    };
  }

  if (
    externalSignal.aborted
  ) {
    controller.abort(
      externalSignal.reason
    );

    return () => {
      // No listener was installed.
    };
  }

  const listener =
    (): void => {
      controller.abort(
        externalSignal.reason
      );
    };

  externalSignal.addEventListener(
    "abort",
    listener,
    {
      once:
        true,
    }
  );

  return () => {
    externalSignal.removeEventListener(
      "abort",
      listener
    );
  };
}

// =========================================================
// RETRY HELPERS
// =========================================================

function isRetryAllowed(
  method:
    WonderRetryMethod,
  retryUnsafeMethods:
    boolean
): boolean {
  if (
    retryUnsafeMethods
  ) {
    return true;
  }

  return [
    "GET",
    "PUT",
    "DELETE",
    "OPTIONS",
  ].includes(
    method
  );
}

function isRetryableError(
  error: unknown
): boolean {
  if (
    error instanceof
      WonderTimeoutError ||
    error instanceof
      WonderNetworkError
  ) {
    return true;
  }

  if (
    error instanceof
    WonderAPIError
  ) {
    return (
      error.statusCode ===
        408 ||
      error.statusCode ===
        425 ||
      error.statusCode ===
        429 ||
      (
        error.statusCode !==
          undefined &&
        error.statusCode >=
          500
      )
    );
  }

  return false;
}

function calculateRetryDelay(
  attempt: number,
  baseDelayMilliseconds:
    number,
  maximumDelayMilliseconds:
    number
): number {
  const exponentialDelay =
    baseDelayMilliseconds *
    2 **
      Math.max(
        0,
        attempt - 1
      );

  const jitter =
    Math.floor(
      Math.random() *
        Math.max(
          1,
          baseDelayMilliseconds
        )
    );

  return Math.min(
    maximumDelayMilliseconds,
    exponentialDelay +
      jitter
  );
}

// =========================================================
// VALIDATION HELPERS
// =========================================================

function validateJobCreateInput<
  TPayload,
>(
  input:
    WonderJobCreateInput<TPayload>
): void {
  if (
    !isRecord(
      input
    )
  ) {
    throw new WonderSDKError(
      "Job creation input must be an object.",
      {
        code:
          "WONDER_INVALID_JOB_INPUT",
      }
    );
  }

  requireNonEmptyString(
    input.batchId,
    "input.batchId"
  );

  requireNonEmptyString(
    input.type,
    "input.type"
  );

  if (
    !Object.prototype.hasOwnProperty.call(
      input,
      "payload"
    )
  ) {
    throw new WonderSDKError(
      "Job creation input requires a payload property.",
      {
        code:
          "WONDER_INVALID_JOB_INPUT",
      }
    );
  }
}

function validateScheduleCreateInput<
  TPayload,
>(
  input:
    WonderScheduleCreateInput<TPayload>
): void {
  if (
    !isRecord(
      input
    )
  ) {
    throw new WonderSDKError(
      "Schedule creation input must be an object.",
      {
        code:
          "WONDER_INVALID_SCHEDULE_INPUT",
      }
    );
  }

  requireNonEmptyString(
    input.type,
    "input.type"
  );

  if (
    !Object.prototype.hasOwnProperty.call(
      input,
      "payload"
    )
  ) {
    throw new WonderSDKError(
      "Schedule creation input requires a payload property.",
      {
        code:
          "WONDER_INVALID_SCHEDULE_INPUT",
      }
    );
  }
}

function requireIdentifier(
  value: string,
  name: string
): void {
  requireNonEmptyString(
    value,
    name
  );
}

function requireNonEmptyString(
  value: unknown,
  name: string
): asserts value is string {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new WonderSDKError(
      `${name} must be a non-empty string.`,
      {
        code:
          "WONDER_INVALID_ARGUMENT",
      }
    );
  }
}

function requirePositiveInteger(
  value: number,
  name: string
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value <=
      0
  ) {
    throw new WonderSDKError(
      `${name} must be a positive integer.`,
      {
        code:
          "WONDER_INVALID_CONFIGURATION",
      }
    );
  }

  return value;
}

function requireNonNegativeInteger(
  value: number,
  name: string
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value <
      0
  ) {
    throw new WonderSDKError(
      `${name} must be a non-negative integer.`,
      {
        code:
          "WONDER_INVALID_CONFIGURATION",
      }
    );
  }

  return value;
}

// =========================================================
// GENERAL HELPERS
// =========================================================

function normaliseBaseUrl(
  value: string
): string {
  requireNonEmptyString(
    value,
    "baseUrl"
  );

  let url:
    URL;

  try {
    url =
      new URL(
        value
      );
  } catch (error) {
    throw new WonderSDKError(
      `"${value}" is not a valid WonderOS base URL.`,
      {
        code:
          "WONDER_INVALID_BASE_URL",

        cause:
          error,
      }
    );
  }

  if (
    ![
      "http:",
      "https:",
    ].includes(
      url.protocol
    )
  ) {
    throw new WonderSDKError(
      "WonderOS baseUrl must use HTTP or HTTPS.",
      {
        code:
          "WONDER_INVALID_BASE_URL",
      }
    );
  }

  url.pathname =
    url.pathname.replace(
      /\/+$/,
      ""
    );

  url.search =
    "";

  url.hash =
    "";

  return url.toString().replace(
    /\/$/,
    ""
  );
}

function normaliseApiPrefix(
  value: string
): string {
  requireNonEmptyString(
    value,
    "apiPrefix"
  );

  const path =
    normalisePath(
      value
    );

  if (
    path ===
    "/"
  ) {
    return "/api";
  }

  return path;
}

function normalisePath(
  value: string
): string {
  const trimmed =
    value.trim();

  if (
    trimmed.length ===
      0
  ) {
    return "/";
  }

  const withLeadingSlash =
    trimmed.startsWith(
      "/"
    )
      ? trimmed
      : `/${trimmed}`;

  if (
    withLeadingSlash.length >
      1
  ) {
    return withLeadingSlash.replace(
      /\/+$/,
      ""
    );
  }

  return withLeadingSlash;
}

function normaliseHeaderName(
  value: string
): string {
  requireNonEmptyString(
    value,
    "apiKeyHeader"
  );

  return value
    .trim()
    .toLowerCase();
}

function normaliseOptionalString(
  value:
    string | undefined
): string | null {
  const trimmed =
    value?.trim();

  if (
    trimmed ===
      undefined ||
    trimmed.length ===
      0
  ) {
    return null;
  }

  return trimmed;
}

function findHeader(
  headers:
    Record<string, string>,
  headerName: string
): string | null {
  const normalisedName =
    headerName
      .trim()
      .toLowerCase();

  for (
    const [
      key,
      value,
    ] of Object.entries(
      headers
    )
  ) {
    if (
      key
        .trim()
        .toLowerCase() ===
      normalisedName
    ) {
      return value;
    }
  }

  return null;
}

function isAbsoluteUrl(
  value: string
): boolean {
  return /^https?:\/\//i.test(
    value
  );
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
    !Array.isArray(
      value
    )
  );
}

function serialiseTemporalValues<
  TValue,
>(
  value: TValue
): TValue {
  return transformTemporalValues(
    value
  ) as TValue;
}

function transformTemporalValues(
  value: unknown
): unknown {
  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value.map(
      transformTemporalValues
    );
  }

  if (
    isRecord(
      value
    )
  ) {
    const output: Record<
      string,
      unknown
    > = {};

    for (
      const [
        key,
        nestedValue,
      ] of Object.entries(
        value
      )
    ) {
      output[key] =
        transformTemporalValues(
          nestedValue
        );
    }

    return output;
  }

  return value;
}

function createRequestId(): string {
  if (
    typeof globalThis.crypto
      ?.randomUUID ===
    "function"
  ) {
    return globalThis.crypto
      .randomUUID();
  }

  return [
    "wonder",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

function delay(
  milliseconds: number
): Promise<void> {
  return new Promise(
    (
      resolve
    ) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}