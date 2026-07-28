import {
    WonderAPIServer,
    type WonderAPIServerAddress,
  } from "@/server/WonderAPIServer";
  
  import {
    wonderRuntime,
  } from "@/factory/runtime/WonderRuntime";
  
  // =========================================================
  // TYPES
  // =========================================================
  
  type WonderEnvironment =
    | "development"
    | "test"
    | "production";
  
  interface WonderServerConfiguration {
    environment: WonderEnvironment;
  
    host: string;
  
    port: number;
  
    apiPrefix: string;
  
    apiKey: string | null;
  
    maximumBodyBytes: number;
  
    requestTimeoutMilliseconds: number;
  
    corsEnabled: boolean;
  
    corsOrigin: string;
  
    bootRuntimeOnStart: boolean;
  
    shutdownRuntimeOnStop: boolean;
  
    exposeErrorDetails: boolean;
  }
  
  interface WonderServerInstance {
    server: WonderAPIServer;
  
    address: WonderAPIServerAddress;
  
    configuration: WonderServerConfiguration;
  
    shutdown: (
      reason?: string
    ) => Promise<void>;
  }
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const DEFAULT_HOST =
    "0.0.0.0";
  
  const DEFAULT_PORT =
    8080;
  
  const DEFAULT_API_PREFIX =
    "/api";
  
  const DEFAULT_MAXIMUM_BODY_BYTES =
    1_048_576;
  
  const DEFAULT_REQUEST_TIMEOUT_MILLISECONDS =
    30_000;
  
  const DEFAULT_CORS_ORIGIN =
    "*";
  
  const SHUTDOWN_TIMEOUT_MILLISECONDS =
    15_000;
  
  // =========================================================
  // STATE
  // =========================================================
  
  let activeServer:
    WonderServerInstance | null =
    null;
  
  let startupPromise:
    Promise<WonderServerInstance> | null =
    null;
  
  let shutdownPromise:
    Promise<void> | null =
    null;
  
  let signalHandlersInstalled =
    false;
  
  // =========================================================
  // PUBLIC STARTUP
  // =========================================================
  
  export async function startWonderServer(): Promise<void> {
    await startWonderServerInstance();
  }
  
  export async function startWonderServerInstance(): Promise<
    WonderServerInstance
  > {
    if (activeServer !== null) {
      return activeServer;
    }
  
    if (startupPromise !== null) {
      return startupPromise;
    }
  
    startupPromise =
      performStartup();
  
    try {
      activeServer =
        await startupPromise;
  
      return activeServer;
    } finally {
      startupPromise =
        null;
    }
  }
  
  // =========================================================
  // STARTUP IMPLEMENTATION
  // =========================================================
  
  async function performStartup(): Promise<
    WonderServerInstance
  > {
    const configuration =
      loadConfiguration();
  
    validateConfiguration(
      configuration
    );
  
    logStartupBeginning(
      configuration
    );
  
    const server =
      new WonderAPIServer(
        wonderRuntime,
        {
          id:
            "wonder-os-api-server",
  
          host:
            configuration.host,
  
          port:
            configuration.port,
  
          apiPrefix:
            configuration.apiPrefix,
  
          authMode:
            configuration.apiKey ===
            null
              ? "none"
              : "api-key",
  
          apiKey:
            configuration.apiKey ??
            undefined,
  
          apiKeyHeader:
            "x-wonder-api-key",
  
          maximumBodyBytes:
            configuration
              .maximumBodyBytes,
  
          requestTimeoutMilliseconds:
            configuration
              .requestTimeoutMilliseconds,
  
          cors:
            configuration
              .corsEnabled,
  
          corsOrigin:
            configuration
              .corsOrigin,
  
          exposeErrorDetails:
            configuration
              .exposeErrorDetails,
  
          bootRuntimeOnStart:
            configuration
              .bootRuntimeOnStart,
  
          shutdownRuntimeOnStop:
            configuration
              .shutdownRuntimeOnStop,
        }
      );
  
    try {
      const result =
        await server.start({
          host:
            configuration.host,
  
          port:
            configuration.port,
  
          bootRuntime:
            configuration
              .bootRuntimeOnStart,
        });
  
      if (
        !result.success ||
        result.currentStatus !==
          "running"
      ) {
        throw new Error(
          [
            "Wonder API Server failed to start.",
  
            `Current status: ${result.currentStatus}.`,
          ].join(" ")
        );
      }
  
      const address =
        server.getAddress();
  
      if (address === null) {
        throw new Error(
          "Wonder API Server started without exposing a listening address."
        );
      }
  
      const instance:
        WonderServerInstance = {
          server,
  
          address,
  
          configuration,
  
          shutdown:
            async (
              reason =
                "manual shutdown"
            ) => {
              await stopWonderServer(
                reason
              );
            },
        };
  
      activeServer =
        instance;
  
      installProcessHandlers();
  
      logStartupComplete(
        instance
      );
  
      return instance;
    } catch (error) {
      await attemptFailedStartupCleanup(
        server
      );
  
      throw error;
    }
  }
  
  // =========================================================
  // PUBLIC SHUTDOWN
  // =========================================================
  
  export async function stopWonderServer(
    reason =
      "manual shutdown"
  ): Promise<void> {
    if (
      shutdownPromise !==
      null
    ) {
      return shutdownPromise;
    }
  
    shutdownPromise =
      performShutdown(
        reason
      );
  
    try {
      await shutdownPromise;
    } finally {
      shutdownPromise =
        null;
    }
  }
  
  // =========================================================
  // SHUTDOWN IMPLEMENTATION
  // =========================================================
  
  async function performShutdown(
    reason: string
  ): Promise<void> {
    const instance =
      activeServer;
  
    if (instance === null) {
      return;
    }
  
    activeServer =
      null;
  
    console.log("");
    console.log(
      "Stopping WonderOS..."
    );
    console.log(
      `Reason: ${reason}`
    );
  
    const startedAt =
      Date.now();
  
    try {
      const stopOperation =
        instance.server.stop({
          shutdownRuntime:
            instance.configuration
              .shutdownRuntimeOnStop,
        });
  
      const result =
        await withTimeout(
          stopOperation,
          SHUTDOWN_TIMEOUT_MILLISECONDS,
          "WonderOS shutdown timed out."
        );
  
      if (!result.success) {
        throw new Error(
          [
            "Wonder API Server reported an unsuccessful shutdown.",
  
            `Current status: ${result.currentStatus}.`,
          ].join(" ")
        );
      }
  
      const durationMilliseconds =
        Date.now() -
        startedAt;
  
      console.log(
        "HTTP server stopped."
      );
  
      if (
        instance.configuration
          .shutdownRuntimeOnStop
      ) {
        console.log(
          "Wonder runtime stopped."
        );
      }
  
      console.log(
        `Shutdown completed in ${durationMilliseconds} ms.`
      );
    } catch (error) {
      activeServer =
        instance;
  
      throw error;
    }
  }
  
  // =========================================================
  // CONFIGURATION
  // =========================================================
  
  function loadConfiguration(): WonderServerConfiguration {
    const environment =
      parseEnvironment(
        process.env.NODE_ENV
      );
  
    const apiKey =
      parseOptionalString(
        process.env
          .WONDER_API_KEY
      );
  
    return {
      environment,
  
      host:
        parseString(
          process.env
            .WONDER_HOST,
          DEFAULT_HOST
        ),
  
      port:
        parseInteger(
          process.env
            .WONDER_PORT,
          DEFAULT_PORT,
          {
            minimum:
              0,
  
            maximum:
              65_535,
  
            variableName:
              "WONDER_PORT",
          }
        ),
  
      apiPrefix:
        normaliseApiPrefix(
          parseString(
            process.env
              .WONDER_API_PREFIX,
            DEFAULT_API_PREFIX
          )
        ),
  
      apiKey,
  
      maximumBodyBytes:
        parseInteger(
          process.env
            .WONDER_MAXIMUM_BODY_BYTES,
          DEFAULT_MAXIMUM_BODY_BYTES,
          {
            minimum:
              1,
  
            maximum:
              100 * 1024 * 1024,
  
            variableName:
              "WONDER_MAXIMUM_BODY_BYTES",
          }
        ),
  
      requestTimeoutMilliseconds:
        parseInteger(
          process.env
            .WONDER_REQUEST_TIMEOUT_MS,
          DEFAULT_REQUEST_TIMEOUT_MILLISECONDS,
          {
            minimum:
              1,
  
            maximum:
              10 * 60 * 1000,
  
            variableName:
              "WONDER_REQUEST_TIMEOUT_MS",
          }
        ),
  
      corsEnabled:
        parseBoolean(
          process.env
            .WONDER_CORS_ENABLED,
          true
        ),
  
      corsOrigin:
        parseString(
          process.env
            .WONDER_CORS_ORIGIN,
          DEFAULT_CORS_ORIGIN
        ),
  
      bootRuntimeOnStart:
        parseBoolean(
          process.env
            .WONDER_BOOT_RUNTIME,
          true
        ),
  
      shutdownRuntimeOnStop:
        parseBoolean(
          process.env
            .WONDER_SHUTDOWN_RUNTIME,
          true
        ),
  
      exposeErrorDetails:
        parseBoolean(
          process.env
            .WONDER_EXPOSE_ERROR_DETAILS,
          environment !==
            "production"
        ),
    };
  }
  
  function validateConfiguration(
    configuration:
      WonderServerConfiguration
  ): void {
    if (
      configuration.environment ===
        "production" &&
      configuration.apiKey ===
        null
    ) {
      throw new Error(
        [
          "WONDER_API_KEY is required in production.",
  
          "Set a secure API key before starting WonderOS.",
        ].join(" ")
      );
    }
  
    if (
      configuration.apiKey !==
        null &&
      configuration.apiKey.length <
        12
    ) {
      throw new Error(
        "WONDER_API_KEY must contain at least 12 characters."
      );
    }
  
    if (
      configuration.host.trim()
        .length ===
      0
    ) {
      throw new Error(
        "WONDER_HOST cannot be empty."
      );
    }
  
    if (
      configuration.corsOrigin
        .trim()
        .length ===
      0
    ) {
      throw new Error(
        "WONDER_CORS_ORIGIN cannot be empty."
      );
    }
  }
  
  // =========================================================
  // PROCESS HANDLERS
  // =========================================================
  
  function installProcessHandlers(): void {
    if (
      signalHandlersInstalled
    ) {
      return;
    }
  
    signalHandlersInstalled =
      true;
  
    process.once(
      "SIGINT",
      () => {
        void handleShutdownSignal(
          "SIGINT"
        );
      }
    );
  
    process.once(
      "SIGTERM",
      () => {
        void handleShutdownSignal(
          "SIGTERM"
        );
      }
    );
  
    process.on(
      "uncaughtException",
      (
        error: Error
      ) => {
        void handleFatalError(
          "uncaughtException",
          error
        );
      }
    );
  
    process.on(
      "unhandledRejection",
      (
        reason: unknown
      ) => {
        void handleFatalError(
          "unhandledRejection",
          reason
        );
      }
    );
  }
  
  async function handleShutdownSignal(
    signal:
      NodeJS.Signals
  ): Promise<void> {
    try {
      await stopWonderServer(
        `received ${signal}`
      );
  
      process.exitCode =
        0;
    } catch (error) {
      console.error(
        "WonderOS failed to shut down cleanly.",
        error
      );
  
      process.exitCode =
        1;
    }
  }
  
  async function handleFatalError(
    source: string,
    error: unknown
  ): Promise<void> {
    console.error(
      `WonderOS fatal error (${source}).`,
      error
    );
  
    process.exitCode =
      1;
  
    try {
      await stopWonderServer(
        `fatal error: ${source}`
      );
    } catch (
      shutdownError
    ) {
      console.error(
        "WonderOS also failed during emergency shutdown.",
        shutdownError
      );
    }
  }
  
  // =========================================================
  // LOGGING
  // =========================================================
  
  function logStartupBeginning(
    configuration:
      WonderServerConfiguration
  ): void {
    console.log("");
    console.log(
      "Starting WonderOS..."
    );
  
    console.log(
      [
        "Environment:",
        configuration.environment,
      ].join(" ")
    );
  
    console.log(
      [
        "Runtime boot:",
        configuration
          .bootRuntimeOnStart
          ? "enabled"
          : "disabled",
      ].join(" ")
    );
  
    console.log(
      [
        "Authentication:",
        configuration.apiKey ===
        null
          ? "disabled"
          : "API key",
      ].join(" ")
    );
  }
  
  function logStartupComplete(
    instance:
      WonderServerInstance
  ): void {
    const {
      address,
      configuration,
    } =
      instance;
  
    const startedAt =
      new Date().toISOString();
  
    const separator =
      "──────────────────────────────────────────────";
  
    console.log("");
    console.log(separator);
    console.log(
      "WonderOS Server"
    );
    console.log(separator);
    console.log("");
    console.log(
      formatBannerLine(
        "Status",
        "Running"
      )
    );
    console.log(
      formatBannerLine(
        "Environment",
        configuration.environment
      )
    );
    console.log("");
    console.log(
      formatBannerLine(
        "HTTP",
        address.origin
      )
    );
    console.log(
      formatBannerLine(
        "API",
        address.apiBaseUrl
      )
    );
    console.log("");
    console.log(
      formatBannerLine(
        "Runtime",
        String(
          wonderRuntime.getStatus()
        )
      )
    );
    console.log(
      formatBannerLine(
        "Authentication",
        configuration.apiKey ===
        null
          ? "Disabled"
          : "API key enabled"
      )
    );
    console.log(
      formatBannerLine(
        "CORS",
        configuration.corsEnabled
          ? configuration.corsOrigin
          : "Disabled"
      )
    );
    console.log("");
    console.log(
      formatBannerLine(
        "Started",
        startedAt
      )
    );
    console.log(separator);
    console.log("");
  }
  
  function formatBannerLine(
    label: string,
    value: string
  ): string {
    return `${label.padEnd(14)}: ${value}`;
  }
  
  // =========================================================
  // FAILED STARTUP CLEANUP
  // =========================================================
  
  async function attemptFailedStartupCleanup(
    server:
      WonderAPIServer
  ): Promise<void> {
    if (!server.isRunning()) {
      return;
    }
  
    try {
      await server.stop({
        shutdownRuntime:
          true,
      });
    } catch (cleanupError) {
      console.error(
        "WonderOS failed to clean up after a startup error.",
        cleanupError
      );
    }
  }
  
  // =========================================================
  // PARSING HELPERS
  // =========================================================
  
  function parseEnvironment(
    value:
      string | undefined
  ): WonderEnvironment {
    const normalised =
      value
        ?.trim()
        .toLowerCase();
  
    switch (normalised) {
      case "production":
        return "production";
  
      case "test":
        return "test";
  
      case "development":
      case undefined:
      case "":
        return "development";
  
      default:
        throw new Error(
          [
            `Unsupported NODE_ENV value "${value}".`,
  
            "Expected development, test, or production.",
          ].join(" ")
        );
    }
  }
  
  function parseString(
    value:
      string | undefined,
    fallback:
      string
  ): string {
    const normalised =
      value?.trim();
  
    if (
      normalised ===
        undefined ||
      normalised.length ===
        0
    ) {
      return fallback;
    }
  
    return normalised;
  }
  
  function parseOptionalString(
    value:
      string | undefined
  ): string | null {
    const normalised =
      value?.trim();
  
    if (
      normalised ===
        undefined ||
      normalised.length ===
        0
    ) {
      return null;
    }
  
    return normalised;
  }
  
  function parseBoolean(
    value:
      string | undefined,
    fallback:
      boolean
  ): boolean {
    if (
      value ===
      undefined
    ) {
      return fallback;
    }
  
    const normalised =
      value
        .trim()
        .toLowerCase();
  
    if (
      [
        "1",
        "true",
        "yes",
        "on",
        "enabled",
      ].includes(
        normalised
      )
    ) {
      return true;
    }
  
    if (
      [
        "0",
        "false",
        "no",
        "off",
        "disabled",
      ].includes(
        normalised
      )
    ) {
      return false;
    }
  
    throw new Error(
      `Invalid boolean value "${value}".`
    );
  }
  
  function parseInteger(
    value:
      string | undefined,
    fallback:
      number,
    options: {
      minimum: number;
  
      maximum: number;
  
      variableName: string;
    }
  ): number {
    if (
      value ===
      undefined ||
      value.trim().length ===
        0
    ) {
      return fallback;
    }
  
    const parsed =
      Number(value);
  
    if (
      !Number.isSafeInteger(
        parsed
      )
    ) {
      throw new Error(
        `${options.variableName} must be a valid integer.`
      );
    }
  
    if (
      parsed <
        options.minimum ||
      parsed >
        options.maximum
    ) {
      throw new Error(
        [
          `${options.variableName} must be between`,
  
          `${options.minimum} and ${options.maximum}.`,
        ].join(" ")
      );
    }
  
    return parsed;
  }
  
  function normaliseApiPrefix(
    value: string
  ): string {
    const trimmed =
      value.trim();
  
    if (
      trimmed.length ===
        0 ||
      trimmed ===
        "/"
    ) {
      return DEFAULT_API_PREFIX;
    }
  
    const withLeadingSlash =
      trimmed.startsWith("/")
        ? trimmed
        : `/${trimmed}`;
  
    if (
      withLeadingSlash.length >
        1 &&
      withLeadingSlash.endsWith(
        "/"
      )
    ) {
      return withLeadingSlash.slice(
        0,
        -1
      );
    }
  
    return withLeadingSlash;
  }
  
  // =========================================================
  // ASYNC HELPERS
  // =========================================================
  
  async function withTimeout<
    TValue
  >(
    promise:
      Promise<TValue>,
    timeoutMilliseconds:
      number,
    message:
      string
  ): Promise<TValue> {
    let timeout:
      ReturnType<
        typeof setTimeout
      > | null =
      null;
  
    const timeoutPromise =
      new Promise<never>(
        (
          _resolve,
          reject
        ) => {
          timeout =
            setTimeout(
              () => {
                reject(
                  new Error(
                    message
                  )
                );
              },
              timeoutMilliseconds
            );
        }
      );
  
    try {
      return await Promise.race([
        promise,
        timeoutPromise,
      ]);
    } finally {
      if (
        timeout !==
        null
      ) {
        clearTimeout(
          timeout
        );
      }
    }
  }
  
  // =========================================================
  // DIRECT EXECUTION
  // =========================================================
  
  function isDirectExecution(): boolean {
    const entryFile =
      process.argv[1];
  
    if (
      entryFile ===
      undefined
    ) {
      return false;
    }
  
    const normalisedEntryFile =
      entryFile
        .replaceAll(
          "\\",
          "/"
        )
        .toLowerCase();
  
    return (
      normalisedEntryFile.endsWith(
        "/server/startwonderserver.ts"
      ) ||
      normalisedEntryFile.endsWith(
        "/server/startwonderserver.js"
      )
    );
  }
  
  if (isDirectExecution()) {
    void startWonderServer().catch(
      (
        error: unknown
      ) => {
        console.error("");
        console.error(
          "WonderOS failed to start."
        );
        console.error(
          error
        );
  
        process.exitCode =
          1;
      }
    );
  }