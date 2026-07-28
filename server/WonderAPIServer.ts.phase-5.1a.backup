import {
    randomUUID,
    timingSafeEqual,
  } from "node:crypto";
  
  import {
    createServer,
  } from "node:http";
  
  import type {
    IncomingMessage,
    Server,
    ServerResponse,
  } from "node:http";
  
  import {
    URL,
  } from "node:url";
  
  import {
    WonderRuntime,
    wonderRuntime,
  } from "@/factory/runtime/WonderRuntime";
  
  import type {
    WonderFactory,
  } from "@/factory/WonderFactory";
  
  import type {
    WonderScheduler,
  } from "@/factory/scheduler/WonderScheduler";
  
  // =========================================================
  // API TYPES
  // =========================================================
  
  export type WonderAPIServerStatus =
    | "idle"
    | "starting"
    | "running"
    | "stopping"
    | "stopped"
    | "error";
  
  export type WonderAPIAuthMode =
    | "none"
    | "api-key";
  
  export type WonderAPILogLevel =
    | "debug"
    | "info"
    | "warning"
    | "error";
  
  export interface WonderAPIServerOptions {
    /**
     * Human-readable server identifier.
     */
    id?: string;
  
    /**
     * Host interface.
     *
     * Use 127.0.0.1 for local development.
     * Use 0.0.0.0 inside a deployment container.
     */
    host?: string;
  
    /**
     * HTTP port.
     *
     * Use 0 to request an available random port.
     */
    port?: number;
  
    /**
     * Prefix applied to WonderOS API routes.
     */
    apiPrefix?: string;
  
    /**
     * Authentication strategy.
     */
    authMode?: WonderAPIAuthMode;
  
    /**
     * API key used when authMode is api-key.
     */
    apiKey?: string;
  
    /**
     * Header used for API-key authentication.
     */
    apiKeyHeader?: string;
  
    /**
     * Maximum accepted request-body size.
     */
    maximumBodyBytes?: number;
  
    /**
     * Request timeout.
     */
    requestTimeoutMilliseconds?: number;
  
    /**
     * Enables browser CORS headers.
     */
    cors?: boolean;
  
    /**
     * Allowed CORS origin.
     */
    corsOrigin?: string;
  
    /**
     * Include stack traces in development error responses.
     */
    exposeErrorDetails?: boolean;
  
    /**
     * Automatically boot WonderRuntime when the API starts.
     */
    bootRuntimeOnStart?: boolean;
  
    /**
     * Automatically shut down WonderRuntime when the API stops.
     */
    shutdownRuntimeOnStop?: boolean;
  
    /**
     * Optional request logger.
     */
    logger?: WonderAPILogger;
  }
  
  export interface WonderAPIServerStartOptions {
    bootRuntime?: boolean;
  
    host?: string;
  
    port?: number;
  }
  
  export interface WonderAPIServerStopOptions {
    shutdownRuntime?: boolean;
  
    gracefulRuntimeShutdown?: boolean;
  
    runtimeShutdownTimeoutMilliseconds?: number;
  }
  
  export interface WonderAPIServerAddress {
    host: string;
  
    port: number;
  
    origin: string;
  
    apiBaseUrl: string;
  }
  
  export interface WonderAPIServerStartResult {
    success: boolean;
  
    previousStatus: WonderAPIServerStatus;
  
    currentStatus: WonderAPIServerStatus;
  
    startedAt: Date;
  
    address: WonderAPIServerAddress;
  
    runtimeBooted: boolean;
  }
  
  export interface WonderAPIServerStopResult {
    success: boolean;
  
    previousStatus: WonderAPIServerStatus;
  
    currentStatus: WonderAPIServerStatus;
  
    stoppedAt: Date;
  
    runtimeStopped: boolean;
  }
  
  export interface WonderAPIServerStatistics {
    serverId: string;
  
    status: WonderAPIServerStatus;
  
    startedAt: Date | null;
  
    stoppedAt: Date | null;
  
    uptimeMilliseconds: number;
  
    totalRequests: number;
  
    successfulRequests: number;
  
    clientErrorRequests: number;
  
    serverErrorRequests: number;
  
    activeRequests: number;
  
    rejectedRequests: number;
  
    bytesReceived: number;
  
    bytesSent: number;
  
    lastRequestAt: Date | null;
  }
  
  export interface WonderAPIRequestContext {
    requestId: string;
  
    method: string;
  
    pathname: string;
  
    url: URL;
  
    request: IncomingMessage;
  
    response: ServerResponse;
  
    runtime: WonderRuntime;
  
    factory: WonderFactory;
  
    scheduler: WonderScheduler;
  
    receivedAt: Date;
  
    bodyBytes: number;
  }
  
  export interface WonderAPILogEntry {
    level: WonderAPILogLevel;
  
    message: string;
  
    occurredAt: Date;
  
    requestId?: string;
  
    method?: string;
  
    pathname?: string;
  
    statusCode?: number;
  
    durationMilliseconds?: number;
  
    details?: Record<
      string,
      unknown
    >;
  }
  
  export type WonderAPILogger =
    (
      entry: WonderAPILogEntry
    ) => void | Promise<void>;
  
  export interface WonderAPIErrorResponse {
    success: false;
  
    error: {
      code: string;
  
      message: string;
  
      requestId: string;
  
      details?: unknown;
  
      stack?: string;
    };
  }
  
  export interface WonderAPISuccessResponse<
    TValue = unknown
  > {
    success: true;
  
    requestId: string;
  
    data: TValue;
  }
  
  interface WonderAPIRoute {
    method: string;
  
    pattern: RegExp;
  
    parameterNames: string[];
  
    authRequired: boolean;
  
    handler:
      WonderAPIRouteHandler;
  }
  
  type WonderAPIRouteHandler =
    (
      context:
        WonderAPIRequestContext,
      parameters:
        Record<string, string>
    ) =>
      | unknown
      | Promise<unknown>;
  
  interface ResolvedWonderAPIServerOptions {
    id: string;
  
    host: string;
  
    port: number;
  
    apiPrefix: string;
  
    authMode: WonderAPIAuthMode;
  
    apiKey: string | null;
  
    apiKeyHeader: string;
  
    maximumBodyBytes: number;
  
    requestTimeoutMilliseconds: number;
  
    cors: boolean;
  
    corsOrigin: string;
  
    exposeErrorDetails: boolean;
  
    bootRuntimeOnStart: boolean;
  
    shutdownRuntimeOnStop: boolean;
  
    logger: WonderAPILogger;
  }
  
  interface WonderAPIParsedBody {
    value: unknown;
  
    bytes: number;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const DEFAULT_SERVER_ID =
    "wonder-api-server";
  
  const DEFAULT_HOST =
    "127.0.0.1";
  
  const DEFAULT_PORT =
    3_000;
  
  const DEFAULT_API_PREFIX =
    "/api";
  
  const DEFAULT_API_KEY_HEADER =
    "x-wonder-api-key";
  
  const DEFAULT_MAXIMUM_BODY_BYTES =
    1_048_576;
  
  const DEFAULT_REQUEST_TIMEOUT_MILLISECONDS =
    30_000;
  
  const MAXIMUM_PORT =
    65_535;
  
  const MINIMUM_REQUEST_TIMEOUT_MILLISECONDS =
    100;
  
  const MAXIMUM_REQUEST_TIMEOUT_MILLISECONDS =
    10 * 60 * 1_000;
  
  const MAXIMUM_BODY_BYTES_LIMIT =
    100 * 1_024 * 1_024;
  
  // =========================================================
  // API SERVER
  // =========================================================
  
  /**
   * Native Node.js HTTP API for WonderOS.
   *
   * No external web-framework dependency is required.
   *
   * Main routes:
   *
   * GET  /health
   *
   * GET  /api
   * GET  /api/runtime
   * GET  /api/runtime/statistics
   * GET  /api/runtime/health
   *
   * POST /api/runtime/boot
   * POST /api/runtime/pause
   * POST /api/runtime/resume
   * POST /api/runtime/save
   * POST /api/runtime/shutdown
   *
   * GET  /api/factory/statistics
   * GET  /api/factory/health
   *
   * GET  /api/jobs
   * GET  /api/jobs/:jobId
   * POST /api/jobs
   *
   * GET  /api/scheduler/statistics
   * POST /api/scheduler/tick
   *
   * GET  /api/schedules
   * GET  /api/schedules/:scheduleId
   * POST /api/schedules/once
   * POST /api/schedules/interval
   */
  export class WonderAPIServer {
    readonly id: string;
  
    private readonly runtime:
      WonderRuntime;
  
    private readonly options:
      ResolvedWonderAPIServerOptions;
  
    private readonly routes:
      WonderAPIRoute[] = [];
  
    private server:
      Server | null = null;
  
    private status:
      WonderAPIServerStatus =
      "idle";
  
    private address:
      WonderAPIServerAddress | null =
      null;
  
    private startedAt:
      Date | null = null;
  
    private stoppedAt:
      Date | null = null;
  
    private totalRequests =
      0;
  
    private successfulRequests =
      0;
  
    private clientErrorRequests =
      0;
  
    private serverErrorRequests =
      0;
  
    private activeRequests =
      0;
  
    private rejectedRequests =
      0;
  
    private bytesReceived =
      0;
  
    private bytesSent =
      0;
  
    private lastRequestAt:
      Date | null = null;
  
    constructor(
      runtime:
        WonderRuntime =
        wonderRuntime,
      options:
        WonderAPIServerOptions = {}
    ) {
      this.runtime =
        runtime;
  
      this.options =
        resolveServerOptions(
          options
        );
  
      this.id =
        this.options.id;
  
      this.registerCoreRoutes();
    }
  
    // =========================================================
    // ACCESS
    // =========================================================
  
    getStatus(): WonderAPIServerStatus {
      return this.status;
    }
  
    getRuntime(): WonderRuntime {
      return this.runtime;
    }
  
    getAddress(): WonderAPIServerAddress | null {
      return this.address
        ? {
            ...this.address,
          }
        : null;
    }
  
    isRunning(): boolean {
      return (
        this.status ===
          "running" &&
        this.server !==
          null
      );
    }
  
    listRoutes(): {
      method: string;
  
      pattern: string;
  
      authRequired: boolean;
    }[] {
      return this.routes.map(
        (route) => ({
          method:
            route.method,
  
          pattern:
            route.pattern.source,
  
          authRequired:
            route.authRequired,
        })
      );
    }
  
    // =========================================================
    // START
    // =========================================================
  
    async start(
      options:
        WonderAPIServerStartOptions = {}
    ): Promise<
      WonderAPIServerStartResult
    > {
      const previousStatus =
        this.status;
  
      if (
        this.status ===
          "starting" ||
        this.status ===
          "stopping"
      ) {
        throw new WonderAPIError(
          "API_SERVER_LIFECYCLE_CONFLICT",
          `Wonder API Server cannot start from status "${this.status}".`,
          409
        );
      }
  
      if (
        this.isRunning()
      ) {
        const address =
          this.requireAddress();
  
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          startedAt:
            cloneDate(
              this.startedAt ??
              new Date()
            ),
  
          address,
  
          runtimeBooted:
            this.runtime
              .getStatus() ===
            "running",
        };
      }
  
      this.setStatus(
        "starting"
      );
  
      let runtimeBooted =
        false;
  
      try {
        const bootRuntime =
          options.bootRuntime ??
          this.options
            .bootRuntimeOnStart;
  
        if (
          bootRuntime &&
          this.runtime.getStatus() !==
            "running"
        ) {
          await this.runtime.boot();
  
          runtimeBooted =
            true;
        } else {
          runtimeBooted =
            this.runtime
              .getStatus() ===
            "running";
        }
  
        const host =
          normaliseOptionalText(
            options.host
          ) ??
          this.options.host;
  
        const port =
          options.port ===
          undefined
            ? this.options.port
            : normalisePort(
                options.port
              );
  
        const server =
          createServer(
            (
              request,
              response
            ) => {
              void this.handleRequest(
                request,
                response
              );
            }
          );
  
        server.requestTimeout =
          this.options
            .requestTimeoutMilliseconds;
  
        server.headersTimeout =
          Math.max(
            server.requestTimeout +
              1_000,
            5_000
          );
  
        server.keepAliveTimeout =
          5_000;
  
        await listen(
          server,
          host,
          port
        );
  
        this.server =
          server;
  
        const resolvedAddress =
          server.address();
  
        if (
          !resolvedAddress ||
          typeof resolvedAddress ===
            "string"
        ) {
          throw new WonderAPIError(
            "API_SERVER_ADDRESS_UNAVAILABLE",
            "Wonder API Server could not resolve its listening address.",
            500
          );
        }
  
        const publicHost =
          host === "0.0.0.0"
            ? "127.0.0.1"
            : host;
  
        const origin =
          `http://${formatHost(
            publicHost
          )}:${resolvedAddress.port}`;
  
        this.address = {
          host,
  
          port:
            resolvedAddress.port,
  
          origin,
  
          apiBaseUrl:
            `${origin}${this.options.apiPrefix}`,
        };
  
        this.startedAt =
          new Date();
  
        this.stoppedAt =
          null;
  
        this.setStatus(
          "running"
        );
  
        await this.log({
          level:
            "info",
  
          message:
            "Wonder API Server started.",
  
          occurredAt:
            new Date(),
  
          details: {
            address:
              this.address,
          },
        });
  
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          startedAt:
            cloneDate(
              this.startedAt
            ),
  
          address:
            this.requireAddress(),
  
          runtimeBooted,
        };
      } catch (error) {
        this.setStatus(
          "error"
        );
  
        await this.safeCloseServer();
  
        throw error;
      }
    }
  
    // =========================================================
    // STOP
    // =========================================================
  
    async stop(
      options:
        WonderAPIServerStopOptions = {}
    ): Promise<
      WonderAPIServerStopResult
    > {
      const previousStatus =
        this.status;
  
      if (
        this.status ===
        "stopped" ||
        (
          this.status ===
            "idle" &&
          this.server ===
            null
        )
      ) {
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            "stopped",
  
          stoppedAt:
            new Date(),
  
          runtimeStopped:
            this.runtime
              .getStatus() ===
            "stopped",
        };
      }
  
      if (
        this.status ===
        "stopping"
      ) {
        throw new WonderAPIError(
          "API_SERVER_ALREADY_STOPPING",
          "Wonder API Server is already stopping.",
          409
        );
      }
  
      this.setStatus(
        "stopping"
      );
  
      let runtimeStopped =
        false;
  
      try {
        await this.safeCloseServer();
  
        const shutdownRuntime =
          options.shutdownRuntime ??
          this.options
            .shutdownRuntimeOnStop;
  
        if (
          shutdownRuntime &&
          this.runtime.getStatus() !==
            "stopped" &&
          this.runtime.getStatus() !==
            "idle"
        ) {
          const shutdown =
            await this.runtime.shutdown({
              graceful:
                options
                  .gracefulRuntimeShutdown ??
                true,
  
              timeoutMilliseconds:
                options
                  .runtimeShutdownTimeoutMilliseconds,
  
              saveState:
                true,
  
              cancelActiveJobsOnTimeout:
                true,
            });
  
          runtimeStopped =
            shutdown.currentStatus ===
            "stopped";
        } else {
          runtimeStopped =
            this.runtime
              .getStatus() ===
            "stopped";
        }
  
        this.stoppedAt =
          new Date();
  
        this.setStatus(
          "stopped"
        );
  
        await this.log({
          level:
            "info",
  
          message:
            "Wonder API Server stopped.",
  
          occurredAt:
            new Date(),
        });
  
        return {
          success: true,
  
          previousStatus,
  
          currentStatus:
            this.status,
  
          stoppedAt:
            cloneDate(
              this.stoppedAt
            ),
  
          runtimeStopped,
        };
      } catch (error) {
        this.setStatus(
          "error"
        );
  
        throw error;
      }
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    getStatistics(
      at =
        new Date()
    ): WonderAPIServerStatistics {
      return {
        serverId:
          this.id,
  
        status:
          this.status,
  
        startedAt:
          cloneNullableDate(
            this.startedAt
          ),
  
        stoppedAt:
          cloneNullableDate(
            this.stoppedAt
          ),
  
        uptimeMilliseconds:
          calculateUptime(
            this.startedAt,
            this.stoppedAt,
            at
          ),
  
        totalRequests:
          this.totalRequests,
  
        successfulRequests:
          this.successfulRequests,
  
        clientErrorRequests:
          this.clientErrorRequests,
  
        serverErrorRequests:
          this.serverErrorRequests,
  
        activeRequests:
          this.activeRequests,
  
        rejectedRequests:
          this.rejectedRequests,
  
        bytesReceived:
          this.bytesReceived,
  
        bytesSent:
          this.bytesSent,
  
        lastRequestAt:
          cloneNullableDate(
            this.lastRequestAt
          ),
      };
    }
  
    // =========================================================
    // ROUTE REGISTRATION
    // =========================================================
  
    registerRoute(
      method: string,
      path: string,
      handler:
        WonderAPIRouteHandler,
      options: {
        authRequired?: boolean;
      } = {}
    ): void {
      const cleanMethod =
        normaliseRequiredText(
          method,
          "method"
        ).toUpperCase();
  
      const compiled =
        compileRoutePath(
          path
        );
  
      const duplicate =
        this.routes.some(
          (route) =>
            route.method ===
              cleanMethod &&
            route.pattern.source ===
              compiled.pattern.source
        );
  
      if (duplicate) {
        throw new WonderAPIError(
          "API_ROUTE_ALREADY_EXISTS",
          `Wonder API route "${cleanMethod} ${path}" already exists.`,
          409
        );
      }
  
      this.routes.push({
        method:
          cleanMethod,
  
        pattern:
          compiled.pattern,
  
        parameterNames:
          compiled.parameterNames,
  
        authRequired:
          options.authRequired ??
          true,
  
        handler,
      });
    }
  
    // =========================================================
    // CORE ROUTES
    // =========================================================
  
    private registerCoreRoutes(): void {
      const api =
        this.options.apiPrefix;
  
      this.registerRoute(
        "GET",
        "/health",
        async () => {
          const runtimeHealth =
            await this.runtime
              .getHealthReport();
  
          return {
            server: {
              id:
                this.id,
  
              status:
                this.status,
  
              healthy:
                this.status ===
                "running",
            },
  
            runtime:
              runtimeHealth,
          };
        },
        {
          authRequired:
            false,
        }
      );
  
      this.registerRoute(
        "GET",
        api,
        () => ({
          name:
            "WonderOS API",
  
          serverId:
            this.id,
  
          status:
            this.status,
  
          runtimeStatus:
            this.runtime
              .getStatus(),
  
          version:
            1,
  
          endpoints: {
            health:
              "/health",
  
            runtime:
              `${api}/runtime`,
  
            jobs:
              `${api}/jobs`,
  
            schedules:
              `${api}/schedules`,
          },
        }),
        {
          authRequired:
            false,
        }
      );
  
      // =======================================================
      // SERVER
      // =======================================================
  
      this.registerRoute(
        "GET",
        `${api}/server`,
        () => ({
          address:
            this.getAddress(),
  
          statistics:
            this.getStatistics(),
  
          routes:
            this.listRoutes(),
        })
      );
  
      // =======================================================
      // RUNTIME
      // =======================================================
  
      this.registerRoute(
        "GET",
        `${api}/runtime`,
        () =>
          this.runtime
            .getSnapshot()
      );
  
      this.registerRoute(
        "GET",
        `${api}/runtime/statistics`,
        async () =>
          this.runtime
            .getStatistics()
      );
  
      this.registerRoute(
        "GET",
        `${api}/runtime/health`,
        async () =>
          this.runtime
            .getHealthReport()
      );
  
      this.registerRoute(
        "POST",
        `${api}/runtime/boot`,
        async (
          context
        ) => {
          const parsed =
            await readOptionalJsonBody(
              context,
              this.options
                .maximumBodyBytes
            );
  
          return this.runtime.boot(
            asRecord(
              parsed.value
            )
          );
        }
      );
  
      this.registerRoute(
        "POST",
        `${api}/runtime/pause`,
        () =>
          this.runtime.pause()
      );
  
      this.registerRoute(
        "POST",
        `${api}/runtime/resume`,
        () =>
          this.runtime.resume()
      );
  
      this.registerRoute(
        "POST",
        `${api}/runtime/save`,
        async (
          context
        ) => {
          const parsed =
            await readOptionalJsonBody(
              context,
              this.options
                .maximumBodyBytes
            );
  
          return this.runtime.save(
            asRecord(
              parsed.value
            )
          );
        }
      );
  
      this.registerRoute(
        "POST",
        `${api}/runtime/shutdown`,
        async (
          context
        ) => {
          const parsed =
            await readOptionalJsonBody(
              context,
              this.options
                .maximumBodyBytes
            );
  
          return this.runtime.shutdown(
            asRecord(
              parsed.value
            )
          );
        }
      );
  
      // =======================================================
      // FACTORY
      // =======================================================
  
      this.registerRoute(
        "GET",
        `${api}/factory/statistics`,
        () =>
          this.runtime
            .getFactory()
            .getStatistics()
      );
  
      this.registerRoute(
        "GET",
        `${api}/factory/health`,
        () =>
          this.runtime
            .getFactory()
            .getHealthReport()
      );
  
      // =======================================================
      // JOBS
      // =======================================================
  
      this.registerRoute(
        "GET",
        `${api}/jobs`,
        () =>
          this.runtime
            .getFactory()
            .listJobs()
      );
  
      this.registerRoute(
        "GET",
        `${api}/jobs/:jobId`,
        (
          _context,
          parameters
        ) => {
          const job =
            this.runtime
              .getFactory()
              .getJob(
                parameters.jobId
              );
  
          if (!job) {
            throw new WonderAPIError(
              "JOB_NOT_FOUND",
              `Wonder job "${parameters.jobId}" was not found.`,
              404
            );
          }
  
          return job;
        }
      );
  
      this.registerRoute(
        "POST",
        `${api}/jobs`,
        async (
          context
        ) => {
          const parsed =
            await readRequiredJsonBody(
              context,
              this.options
                .maximumBodyBytes
            );
  
            const body =
            asRecord(
              parsed.value
            );
          
          const input =
            body as unknown as Parameters<
              WonderFactory[
                "submitJob"
              ]
            >[0];
  
          return this.runtime
            .getFactory()
            .submitJob(
              input
            );
        }
      );
  
      // =======================================================
      // SCHEDULER
      // =======================================================
  
      this.registerRoute(
        "GET",
        `${api}/scheduler/statistics`,
        () =>
          this.runtime
            .getScheduler()
            .getStatistics()
      );
  
      this.registerRoute(
        "POST",
        `${api}/scheduler/tick`,
        async (
          context
        ) => {
          const parsed =
            await readOptionalJsonBody(
              context,
              this.options
                .maximumBodyBytes
            );
  
          const body =
            asRecord(
              parsed.value
            );
  
          const at =
            body.at ===
            undefined
              ? new Date()
              : parseDate(
                  body.at,
                  "at"
                );
  
          return this.runtime
            .getScheduler()
            .tick(at);
        }
      );
  
      // =======================================================
      // SCHEDULES
      // =======================================================
  
      this.registerRoute(
        "GET",
        `${api}/schedules`,
        () =>
          this.runtime
            .getScheduler()
            .listSchedules()
      );
  
      this.registerRoute(
        "GET",
        `${api}/schedules/:scheduleId`,
        (
          _context,
          parameters
        ) => {
          const schedule =
            this.runtime
              .getScheduler()
              .getSchedule(
                parameters
                  .scheduleId
              );
  
          if (!schedule) {
            throw new WonderAPIError(
              "SCHEDULE_NOT_FOUND",
              `Wonder schedule "${parameters.scheduleId}" was not found.`,
              404
            );
          }
  
          return schedule;
        }
      );
  
      this.registerRoute(
        "POST",
        `${api}/schedules/once`,
        async (
          context
        ) => {
          const parsed =
            await readRequiredJsonBody(
              context,
              this.options
                .maximumBodyBytes
            );
  
          const input =
            normaliseOnceScheduleInput(
              asRecord(
                parsed.value
              )
            ) as Parameters<
              WonderScheduler[
                "createOnceSchedule"
              ]
            >[0];
  
          return this.runtime
            .getScheduler()
            .createOnceSchedule(
              input
            );
        }
      );
  
      this.registerRoute(
        "POST",
        `${api}/schedules/interval`,
        async (
          context
        ) => {
          const parsed =
            await readRequiredJsonBody(
              context,
              this.options
                .maximumBodyBytes
            );
  
          const input =
            normaliseIntervalScheduleInput(
              asRecord(
                parsed.value
              )
            ) as Parameters<
              WonderScheduler[
                "createIntervalSchedule"
              ]
            >[0];
  
          return this.runtime
            .getScheduler()
            .createIntervalSchedule(
              input
            );
        }
      );
    }
  
    // =========================================================
    // REQUEST HANDLING
    // =========================================================
  
    private async handleRequest(
      request:
        IncomingMessage,
      response:
        ServerResponse
    ): Promise<void> {
      const requestId =
        readRequestId(
          request
        ) ??
        randomUUID();
  
      const receivedAt =
        new Date();
  
      const startedAt =
        Date.now();
  
      this.totalRequests +=
        1;
  
      this.activeRequests +=
        1;
  
      this.lastRequestAt =
        new Date(
          receivedAt.getTime()
        );
  
      response.setHeader(
        "x-wonder-request-id",
        requestId
      );
  
      this.applyCorsHeaders(
        response
      );
  
      try {
        const method =
          (
            request.method ??
            "GET"
          ).toUpperCase();
  
        const host =
          request.headers.host ??
          `${this.options.host}:${this.options.port}`;
  
        const url =
          new URL(
            request.url ??
            "/",
            `http://${host}`
          );
  
        if (
          method ===
          "OPTIONS"
        ) {
          response.statusCode =
            204;
  
          response.end();
  
          this.recordStatusCode(
            response.statusCode
          );
  
          return;
        }
  
        const match =
          this.findRoute(
            method,
            url.pathname
          );
  
        if (!match) {
          throw new WonderAPIError(
            "ROUTE_NOT_FOUND",
            `No Wonder API route matches "${method} ${url.pathname}".`,
            404
          );
        }
  
        if (
          match.route
            .authRequired
        ) {
          this.assertAuthenticated(
            request
          );
        }
  
        const context:
          WonderAPIRequestContext = {
          requestId,
  
          method,
  
          pathname:
            url.pathname,
  
          url,
  
          request,
  
          response,
  
          runtime:
            this.runtime,
  
          factory:
            this.runtime
              .getFactory(),
  
          scheduler:
            this.runtime
              .getScheduler(),
  
          receivedAt,
  
          bodyBytes: 0,
        };
  
        const result =
          await match.route
            .handler(
              context,
              match.parameters
            );
  
        const sentBytes =
          sendJson(
            response,
            200,
            {
              success: true,
  
              requestId,
  
              data:
                result,
            } satisfies
              WonderAPISuccessResponse
          );
  
        this.bytesReceived +=
          context.bodyBytes;
  
        this.bytesSent +=
          sentBytes;
  
        this.recordStatusCode(
          response.statusCode
        );
  
        await this.log({
          level:
            "info",
  
          message:
            `${method} ${url.pathname}`,
  
          occurredAt:
            new Date(),
  
          requestId,
  
          method,
  
          pathname:
            url.pathname,
  
          statusCode:
            response.statusCode,
  
          durationMilliseconds:
            Math.max(
              0,
              Date.now() -
                startedAt
            ),
        });
      } catch (error) {
        const apiError =
          toWonderAPIError(
            error
          );
  
        if (
          apiError.statusCode >=
          400 &&
          apiError.statusCode <
          500
        ) {
          this.rejectedRequests +=
            1;
        }
  
        const responseBody:
          WonderAPIErrorResponse = {
          success: false,
  
          error: {
            code:
              apiError.code,
  
            message:
              apiError.message,
  
            requestId,
  
            details:
              apiError.details,
  
            stack:
              this.options
                .exposeErrorDetails
                ? apiError.stack
                : undefined,
          },
        };
  
        const sentBytes =
          sendJson(
            response,
            apiError.statusCode,
            responseBody
          );
  
        this.bytesSent +=
          sentBytes;
  
        this.recordStatusCode(
          apiError.statusCode
        );
  
        await this.log({
          level:
            apiError.statusCode >=
            500
              ? "error"
              : "warning",
  
          message:
            apiError.message,
  
          occurredAt:
            new Date(),
  
          requestId,
  
          method:
            request.method,
  
          pathname:
            request.url,
  
          statusCode:
            apiError.statusCode,
  
          durationMilliseconds:
            Math.max(
              0,
              Date.now() -
                startedAt
            ),
  
          details: {
            code:
              apiError.code,
  
            error:
              apiError.details,
          },
        });
      } finally {
        this.activeRequests =
          Math.max(
            0,
            this.activeRequests -
              1
          );
      }
    }
  
    // =========================================================
    // ROUTING
    // =========================================================
  
    private findRoute(
      method: string,
      pathname: string
    ): {
      route: WonderAPIRoute;
  
      parameters:
        Record<string, string>;
    } | null {
      for (
        const route of
          this.routes
      ) {
        if (
          route.method !==
          method
        ) {
          continue;
        }
  
        const match =
          route.pattern.exec(
            pathname
          );
  
        if (!match) {
          continue;
        }
  
        const parameters:
          Record<string, string> = {};
  
        for (
          let index = 0;
          index <
          route.parameterNames
            .length;
          index += 1
        ) {
          const value =
            match[index + 1];
  
          if (
            value !==
            undefined
          ) {
            parameters[
              route
                .parameterNames[
                  index
                ]!
            ] =
              decodeURIComponent(
                value
              );
          }
        }
  
        return {
          route,
  
          parameters,
        };
      }
  
      return null;
    }
  
    // =========================================================
    // AUTHENTICATION
    // =========================================================
  
    private assertAuthenticated(
      request:
        IncomingMessage
    ): void {
      if (
        this.options.authMode ===
        "none"
      ) {
        return;
      }
  
      const configuredApiKey =
        this.options.apiKey;
  
      if (!configuredApiKey) {
        throw new WonderAPIError(
          "API_AUTH_CONFIGURATION_INVALID",
          "Wonder API authentication is enabled but no API key is configured.",
          500
        );
      }
  
      const rawHeader =
        request.headers[
          this.options
            .apiKeyHeader
        ];
  
      const providedApiKey =
        Array.isArray(
          rawHeader
        )
          ? rawHeader[0]
          : rawHeader;
  
      if (
        !providedApiKey ||
        !secureTextEqual(
          configuredApiKey,
          providedApiKey
        )
      ) {
        throw new WonderAPIError(
          "API_UNAUTHORISED",
          "A valid Wonder API key is required.",
          401
        );
      }
    }
  
    // =========================================================
    // RESPONSE CONFIGURATION
    // =========================================================
  
    private applyCorsHeaders(
      response:
        ServerResponse
    ): void {
      if (
        !this.options.cors
      ) {
        return;
      }
  
      response.setHeader(
        "access-control-allow-origin",
        this.options
          .corsOrigin
      );
  
      response.setHeader(
        "access-control-allow-methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      );
  
      response.setHeader(
        "access-control-allow-headers",
        [
          "content-type",
          "x-wonder-request-id",
          this.options
            .apiKeyHeader,
        ].join(", ")
      );
  
      response.setHeader(
        "access-control-max-age",
        "86400"
      );
    }
  
    // =========================================================
    // INTERNAL LIFECYCLE
    // =========================================================
  
    private setStatus(
      status:
        WonderAPIServerStatus
    ): void {
      this.status =
        status;
    }
  
    private requireAddress(): WonderAPIServerAddress {
      if (!this.address) {
        throw new WonderAPIError(
          "API_SERVER_NOT_LISTENING",
          "Wonder API Server is not listening.",
          503
        );
      }
  
      return {
        ...this.address,
      };
    }
  
    private async safeCloseServer(): Promise<void> {
      const server =
        this.server;
  
      this.server =
        null;
  
      this.address =
        null;
  
      if (!server) {
        return;
      }
  
      await closeServer(
        server
      );
    }
  
    private recordStatusCode(
      statusCode: number
    ): void {
      if (
        statusCode >= 200 &&
        statusCode < 400
      ) {
        this.successfulRequests +=
          1;
  
        return;
      }
  
      if (
        statusCode >= 400 &&
        statusCode < 500
      ) {
        this.clientErrorRequests +=
          1;
  
        return;
      }
  
      this.serverErrorRequests +=
        1;
    }
  
    private async log(
      entry:
        WonderAPILogEntry
    ): Promise<void> {
      try {
        await this.options
          .logger(entry);
      } catch {
        // Logging failure must never crash the API server.
      }
    }
  }
  
  // =========================================================
  // API ERROR
  // =========================================================
  
  export class WonderAPIError
    extends Error {
    readonly code: string;
  
    readonly statusCode: number;
  
    readonly details:
      unknown;
  
    constructor(
      code: string,
      message: string,
      statusCode =
        500,
      details?: unknown,
      options: {
        cause?: unknown;
      } = {}
    ) {
      super(
        normaliseRequiredText(
          message,
          "message"
        ),
        {
          cause:
            options.cause,
        }
      );
  
      this.name =
        "WonderAPIError";
  
      this.code =
        normaliseRequiredText(
          code,
          "code"
        );
  
      this.statusCode =
        normaliseStatusCode(
          statusCode
        );
  
      this.details =
        details;
    }
  }
  
  // =========================================================
  // BODY PARSING
  // =========================================================
  
  async function readRequiredJsonBody(
    context:
      WonderAPIRequestContext,
    maximumBodyBytes: number
  ): Promise<
    WonderAPIParsedBody
  > {
    const parsed =
      await readJsonBody(
        context.request,
        maximumBodyBytes
      );
  
    context.bodyBytes =
      parsed.bytes;
  
    if (
      parsed.value ===
      undefined
    ) {
      throw new WonderAPIError(
        "REQUEST_BODY_REQUIRED",
        "A JSON request body is required.",
        400
      );
    }
  
    return parsed;
  }
  
  async function readOptionalJsonBody(
    context:
      WonderAPIRequestContext,
    maximumBodyBytes: number
  ): Promise<
    WonderAPIParsedBody
  > {
    const parsed =
      await readJsonBody(
        context.request,
        maximumBodyBytes
      );
  
    context.bodyBytes =
      parsed.bytes;
  
    return parsed;
  }
  
  async function readJsonBody(
    request:
      IncomingMessage,
    maximumBodyBytes: number
  ): Promise<
    WonderAPIParsedBody
  > {
    const chunks:
      Buffer[] = [];
  
    let bytes =
      0;
  
    for await (
      const chunk of request
    ) {
      const buffer =
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk);
  
      bytes +=
        buffer.byteLength;
  
      if (
        bytes >
        maximumBodyBytes
      ) {
        throw new WonderAPIError(
          "REQUEST_BODY_TOO_LARGE",
          `Request body exceeds the ${maximumBodyBytes}-byte limit.`,
          413,
          {
            maximumBodyBytes,
  
            receivedBytes:
              bytes,
          }
        );
      }
  
      chunks.push(buffer);
    }
  
    if (
      chunks.length ===
      0
    ) {
      return {
        value:
          undefined,
  
        bytes: 0,
      };
    }
  
    const content =
      Buffer.concat(
        chunks
      ).toString(
        "utf8"
      );
  
    if (
      content.trim()
        .length ===
      0
    ) {
      return {
        value:
          undefined,
  
        bytes,
      };
    }
  
    const contentType =
      request.headers[
        "content-type"
      ];
  
    if (
      contentType &&
      !contentType
        .toLowerCase()
        .includes(
          "application/json"
        )
    ) {
      throw new WonderAPIError(
        "UNSUPPORTED_CONTENT_TYPE",
        "Wonder API accepts application/json request bodies.",
        415,
        {
          contentType,
        }
      );
    }
  
    try {
      return {
        value:
          JSON.parse(
            content
          ),
  
        bytes,
      };
    } catch (error) {
      throw new WonderAPIError(
        "INVALID_JSON",
        "Request body contains invalid JSON.",
        400,
        {
          cause:
            getErrorMessage(
              error
            ),
        },
        {
          cause:
            error,
        }
      );
    }
  }
  
  // =========================================================
  // SCHEDULE NORMALISATION
  // =========================================================
  
  function normaliseOnceScheduleInput(
    value:
      Record<string, unknown>
  ): Record<string, unknown> {
    const result = {
      ...value,
    };
  
    if (
      result.runAt !==
      undefined
    ) {
      result.runAt =
        parseDate(
          result.runAt,
          "runAt"
        );
    }
  
    return result;
  }
  
  function normaliseIntervalScheduleInput(
    value:
      Record<string, unknown>
  ): Record<string, unknown> {
    const result = {
      ...value,
    };
  
    if (
      result.startAt !==
      undefined
    ) {
      result.startAt =
        parseDate(
          result.startAt,
          "startAt"
        );
    }
  
    if (
      result.endAt !==
        undefined &&
      result.endAt !==
        null
    ) {
      result.endAt =
        parseDate(
          result.endAt,
          "endAt"
        );
    }
  
    return result;
  }
  
  // =========================================================
  // ROUTE COMPILATION
  // =========================================================
  
  function compileRoutePath(
    path: string
  ): {
    pattern: RegExp;
  
    parameterNames: string[];
  } {
    const cleanPath =
      normalisePath(path);
  
    const parameterNames:
      string[] = [];
  
    const segments =
      cleanPath
        .split("/")
        .filter(
          (segment) =>
            segment.length >
            0
        );
  
    const patternSegments =
      segments.map(
        (segment) => {
          if (
            segment.startsWith(
              ":"
            )
          ) {
            const name =
              normaliseRequiredText(
                segment.slice(1),
                "route parameter"
              );
  
            parameterNames.push(
              name
            );
  
            return "([^/]+)";
          }
  
          return escapeRegularExpression(
            segment
          );
        }
      );
  
    const source =
      patternSegments.length ===
      0
        ? "^/$"
        : `^/${patternSegments.join(
            "/"
          )}/?$`;
  
    return {
      pattern:
        new RegExp(
          source
        ),
  
      parameterNames,
    };
  }
  
  // =========================================================
  // JSON RESPONSES
  // =========================================================
  
  function sendJson(
    response:
      ServerResponse,
    statusCode: number,
    value: unknown
  ): number {
    if (
      response.headersSent
    ) {
      return 0;
    }
  
    const content =
      JSON.stringify(
        value,
        wonderJsonReplacer,
        2
      );
  
    const bytes =
      Buffer.byteLength(
        content,
        "utf8"
      );
  
    response.statusCode =
      statusCode;
  
    response.setHeader(
      "content-type",
      "application/json; charset=utf-8"
    );
  
    response.setHeader(
      "content-length",
      String(bytes)
    );
  
    response.setHeader(
      "cache-control",
      "no-store"
    );
  
    response.end(content);
  
    return bytes;
  }
  
  function wonderJsonReplacer(
    _key: string,
    value: unknown
  ): unknown {
    if (
      typeof value ===
      "bigint"
    ) {
      return value.toString();
    }
  
    if (
      value instanceof Map
    ) {
      return Object.fromEntries(
        value
      );
    }
  
    if (
      value instanceof Set
    ) {
      return Array.from(
        value
      );
    }
  
    if (
      value instanceof Uint8Array
    ) {
      return Array.from(
        value
      );
    }
  
    if (
      value instanceof Error
    ) {
      return {
        name:
          value.name,
  
        message:
          value.message,
  
        stack:
          value.stack,
      };
    }
  
    return value;
  }
  
  // =========================================================
  // ERROR CONVERSION
  // =========================================================
  
  function toWonderAPIError(
    error: unknown
  ): WonderAPIError {
    if (
      error instanceof
      WonderAPIError
    ) {
      return error;
    }
  
    if (
      error instanceof Error
    ) {
      const statusCode =
        inferErrorStatusCode(
          error
        );
  
      return new WonderAPIError(
        inferErrorCode(
          error
        ),
        error.message,
        statusCode,
        {
          name:
            error.name,
  
          cause:
            error.cause,
        },
        {
          cause:
            error,
        }
      );
    }
  
    return new WonderAPIError(
      "INTERNAL_SERVER_ERROR",
      String(error),
      500,
      {
        error,
      }
    );
  }
  
  function inferErrorCode(
    error: Error
  ): string {
    const candidate =
      (
        error as Error & {
          code?: unknown;
        }
      ).code;
  
    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
        .length > 0
    ) {
      return candidate;
    }
  
    return "INTERNAL_SERVER_ERROR";
  }
  
  function inferErrorStatusCode(
    error: Error
  ): number {
    const candidate =
      (
        error as Error & {
          statusCode?:
            unknown;
        }
      ).statusCode;
  
    if (
      typeof candidate ===
        "number" &&
      candidate >= 400 &&
      candidate <= 599
    ) {
      return Math.floor(
        candidate
      );
    }
  
    const code =
      inferErrorCode(
        error
      );
  
    if (
      code.includes(
        "NOT_FOUND"
      )
    ) {
      return 404;
    }
  
    if (
      code.includes(
        "ALREADY_EXISTS"
      ) ||
      code.includes(
        "CONFLICT"
      ) ||
      code.includes(
        "MISMATCH"
      )
    ) {
      return 409;
    }
  
    if (
      code.includes(
        "VALIDATION"
      ) ||
      code.includes(
        "INVALID"
      )
    ) {
      return 400;
    }
  
    if (
      code.includes(
        "UNAUTHORISED"
      ) ||
      code.includes(
        "UNAUTHORIZED"
      )
    ) {
      return 401;
    }
  
    return 500;
  }
  
  // =========================================================
  // NETWORK HELPERS
  // =========================================================
  
  function listen(
    server: Server,
    host: string,
    port: number
  ): Promise<void> {
    return new Promise(
      (
        resolvePromise,
        rejectPromise
      ) => {
        const handleError =
          (
            error: Error
          ): void => {
            server.off(
              "listening",
              handleListening
            );
  
            rejectPromise(
              error
            );
          };
  
        const handleListening =
          (): void => {
            server.off(
              "error",
              handleError
            );
  
            resolvePromise();
          };
  
        server.once(
          "error",
          handleError
        );
  
        server.once(
          "listening",
          handleListening
        );
  
        server.listen(
          port,
          host
        );
      }
    );
  }
  
  function closeServer(
    server: Server
  ): Promise<void> {
    return new Promise(
      (
        resolvePromise,
        rejectPromise
      ) => {
        if (
          !server.listening
        ) {
          resolvePromise();
  
          return;
        }
  
        server.close(
          (error) => {
            if (error) {
              rejectPromise(
                error
              );
  
              return;
            }
  
            resolvePromise();
          }
        );
  
        server.closeIdleConnections?.();
      }
    );
  }
  
  // =========================================================
  // AUTH HELPERS
  // =========================================================
  
  function secureTextEqual(
    expected: string,
    actual: string
  ): boolean {
    const expectedBuffer =
      Buffer.from(
        expected,
        "utf8"
      );
  
    const actualBuffer =
      Buffer.from(
        actual,
        "utf8"
      );
  
    if (
      expectedBuffer.length !==
      actualBuffer.length
    ) {
      return false;
    }
  
    return timingSafeEqual(
      expectedBuffer,
      actualBuffer
    );
  }
  
  function readRequestId(
    request:
      IncomingMessage
  ): string | null {
    const value =
      request.headers[
        "x-wonder-request-id"
      ];
  
    if (
      Array.isArray(value)
    ) {
      return (
        normaliseOptionalText(
          value[0]
        )
      );
    }
  
    return normaliseOptionalText(
      value
    );
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolveServerOptions(
    options:
      WonderAPIServerOptions
  ): ResolvedWonderAPIServerOptions {
    const authMode =
      options.authMode ??
      "none";
  
    const apiKey =
      normaliseOptionalText(
        options.apiKey ??
        process.env
          .WONDER_API_KEY
      );
  
    if (
      authMode ===
        "api-key" &&
      !apiKey
    ) {
      throw new WonderAPIError(
        "API_AUTH_CONFIGURATION_INVALID",
        "authMode is api-key but no API key was provided.",
        500
      );
    }
  
    return {
      id:
        normaliseOptionalText(
          options.id
        ) ??
        DEFAULT_SERVER_ID,
  
      host:
        normaliseOptionalText(
          options.host ??
          process.env.HOST
        ) ??
        DEFAULT_HOST,
  
      port:
        normalisePort(
          options.port ??
          readEnvironmentPort() ??
          DEFAULT_PORT
        ),
  
      apiPrefix:
        normalisePath(
          options.apiPrefix ??
          DEFAULT_API_PREFIX
        ),
  
      authMode,
  
      apiKey,
  
      apiKeyHeader:
        (
          normaliseOptionalText(
            options.apiKeyHeader
          ) ??
          DEFAULT_API_KEY_HEADER
        ).toLowerCase(),
  
      maximumBodyBytes:
        clampInteger(
          options.maximumBodyBytes ??
          DEFAULT_MAXIMUM_BODY_BYTES,
          1,
          MAXIMUM_BODY_BYTES_LIMIT
        ),
  
      requestTimeoutMilliseconds:
        clampInteger(
          options
            .requestTimeoutMilliseconds ??
          DEFAULT_REQUEST_TIMEOUT_MILLISECONDS,
          MINIMUM_REQUEST_TIMEOUT_MILLISECONDS,
          MAXIMUM_REQUEST_TIMEOUT_MILLISECONDS
        ),
  
      cors:
        options.cors ??
        true,
  
      corsOrigin:
        normaliseOptionalText(
          options.corsOrigin
        ) ??
        "*",
  
      exposeErrorDetails:
        options.exposeErrorDetails ??
        process.env.NODE_ENV !==
          "production",
  
      bootRuntimeOnStart:
        options.bootRuntimeOnStart ??
        false,
  
      shutdownRuntimeOnStop:
        options
          .shutdownRuntimeOnStop ??
        false,
  
      logger:
        options.logger ??
        defaultLogger,
    };
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function asRecord(
    value: unknown
  ): Record<string, unknown> {
    if (
      value ===
      undefined
    ) {
      return {};
    }
  
    if (
      !isRecord(value)
    ) {
      throw new WonderAPIError(
        "REQUEST_BODY_INVALID",
        "Request body must be a JSON object.",
        400
      );
    }
  
    return value;
  }
  
  function parseDate(
    value: unknown,
    fieldName: string
  ): Date {
    if (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime()
      )
    ) {
      return new Date(
        value.getTime()
      );
    }
  
    if (
      typeof value !==
        "string" &&
      typeof value !==
        "number"
    ) {
      throw new WonderAPIError(
        "DATE_INVALID",
        `"${fieldName}" must be a valid date string or timestamp.`,
        400
      );
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new WonderAPIError(
        "DATE_INVALID",
        `"${fieldName}" is not a valid date.`,
        400
      );
    }
  
    return date;
  }
  
  function normalisePath(
    value: string
  ): string {
    const cleaned =
      normaliseRequiredText(
        value,
        "path"
      );
  
    const withLeadingSlash =
      cleaned.startsWith("/")
        ? cleaned
        : `/${cleaned}`;
  
    if (
      withLeadingSlash ===
      "/"
    ) {
      return "/";
    }
  
    return withLeadingSlash
      .replace(
        /\/+/g,
        "/"
      )
      .replace(
        /\/+$/,
        ""
      );
  }
  
  function normalisePort(
    value: number
  ): number {
    if (
      !Number.isInteger(
        value
      ) ||
      value < 0 ||
      value >
        MAXIMUM_PORT
    ) {
      throw new WonderAPIError(
        "API_PORT_INVALID",
        `Wonder API port must be an integer between 0 and ${MAXIMUM_PORT}.`,
        500,
        {
          port:
            value,
        }
      );
    }
  
    return value;
  }
  
  function readEnvironmentPort(): number | null {
    const value =
      process.env.PORT;
  
    if (!value) {
      return null;
    }
  
    const parsed =
      Number(value);
  
    return Number.isInteger(
      parsed
    )
      ? parsed
      : null;
  }
  
  function normaliseStatusCode(
    value: number
  ): number {
    if (
      !Number.isInteger(
        value
      ) ||
      value < 400 ||
      value > 599
    ) {
      return 500;
    }
  
    return value;
  }
  
  function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    if (
      typeof value !==
      "string"
    ) {
      throw new Error(
        `"${fieldName}" must be a string.`
      );
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length ===
      0
    ) {
      throw new Error(
        `"${fieldName}" is required.`
      );
    }
  
    return cleaned;
  }
  
  function normaliseOptionalText(
    value:
      | string
      | null
      | undefined
  ): string | null {
    if (
      typeof value !==
      "string"
    ) {
      return null;
    }
  
    const cleaned =
      value.trim();
  
    return cleaned.length >
      0
      ? cleaned
      : null;
  }
  
  function clampInteger(
    value: number,
    minimum: number,
    maximum: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
      return minimum;
    }
  
    return Math.min(
      maximum,
      Math.max(
        minimum,
        Math.floor(value)
      )
    );
  }
  
  function formatHost(
    host: string
  ): string {
    return host.includes(":")
      ? `[${host}]`
      : host;
  }
  
  function escapeRegularExpression(
    value: string
  ): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }
  
  function calculateUptime(
    startedAt: Date | null,
    stoppedAt: Date | null,
    at: Date
  ): number {
    if (!startedAt) {
      return 0;
    }
  
    const endTime =
      stoppedAt?.getTime() ??
      at.getTime();
  
    return Math.max(
      0,
      endTime -
        startedAt.getTime()
    );
  }
  
  function cloneDate(
    value: Date
  ): Date {
    return new Date(
      value.getTime()
    );
  }
  
  function cloneNullableDate(
    value:
      Date | null
  ): Date | null {
    return value
      ? cloneDate(value)
      : null;
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
  // DEFAULT LOGGER
  // =========================================================
  
  async function defaultLogger(
    entry:
      WonderAPILogEntry
  ): Promise<void> {
    const output = {
      timestamp:
        entry.occurredAt
          .toISOString(),
  
      level:
        entry.level,
  
      message:
        entry.message,
  
      requestId:
        entry.requestId,
  
      method:
        entry.method,
  
      pathname:
        entry.pathname,
  
      statusCode:
        entry.statusCode,
  
      durationMilliseconds:
        entry.durationMilliseconds,
  
      details:
        entry.details,
    };
  
    if (
      entry.level ===
      "error"
    ) {
      console.error(
        "[WonderAPI]",
        output
      );
  
      return;
    }
  
    if (
      entry.level ===
      "warning"
    ) {
      console.warn(
        "[WonderAPI]",
        output
      );
  
      return;
    }
  
    if (
      entry.level ===
      "debug"
    ) {
      console.debug(
        "[WonderAPI]",
        output
      );
  
      return;
    }
  
    console.log(
      "[WonderAPI]",
      output
    );
  }
  
  // =========================================================
  // DEFAULT INSTANCE
  // =========================================================
  
  export const wonderAPIServer =
    new WonderAPIServer(
      wonderRuntime
    );
  
  export default WonderAPIServer;