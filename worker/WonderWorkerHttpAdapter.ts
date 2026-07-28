import type {
  WonderWorkerAdapter,
  WonderWorkerClaimInput,
  WonderWorkerCompleteInput,
  WonderWorkerFailInput,
  WonderWorkerHeartbeatInput,
  WonderWorkerJob,
  WonderWorkerProgressInput,
  WonderWorkerRegistration,
  WonderWorkerRegistrationInput,
  WonderWorkerReleaseInput,
  WonderWorkerUnregisterInput,
} from "./WonderWorkerSDK";

export interface WonderWorkerHttpAdapterConfiguration {
  baseUrl: string;
  apiKey?: string;
  apiKeyHeader?: string;
  requestTimeoutMilliseconds?: number;
  headers?: Record<string, string>;
}

interface WonderApiEnvelope<T> {
  success: boolean;
  requestId?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class WonderWorkerHttpError
  extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code =
      "WONDER_WORKER_HTTP_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "WonderWorkerHttpError";
  }
}

/**
 * HTTP transport for WonderWorker SDK.
 *
 * Sprint 5.1A server support:
 * - register
 * - heartbeat
 * - unregister
 * - listWorkers
 * - getWorker
 *
 * Claim/progress/complete/fail/release are implemented here already,
 * but their server routes arrive in Sprint 5.1B.
 */
export class WonderWorkerHttpAdapter
  implements WonderWorkerAdapter {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly apiKeyHeader: string;
  private readonly requestTimeoutMilliseconds:
    number;
  private readonly headers:
    Record<string, string>;

  public constructor(
    configuration:
      WonderWorkerHttpAdapterConfiguration,
  ) {
    this.baseUrl =
      configuration.baseUrl.replace(
        /\/+$/,
        "",
      );

    this.apiKey =
      configuration.apiKey;

    this.apiKeyHeader =
      configuration.apiKeyHeader ??
      "x-wonder-api-key";

    this.requestTimeoutMilliseconds =
      configuration
        .requestTimeoutMilliseconds ??
      10_000;

    this.headers =
      configuration.headers ?? {};
  }

  public register(
    input: WonderWorkerRegistrationInput,
  ): Promise<WonderWorkerRegistration> {
    return this.request(
      "POST",
      "/api/workers/register",
      input,
    );
  }

  public async heartbeat(
    input: WonderWorkerHeartbeatInput,
  ): Promise<void> {
    await this.request(
      "POST",
      "/api/workers/heartbeat",
      input,
    );
  }

  public claim(
    input: WonderWorkerClaimInput,
  ): Promise<WonderWorkerJob | null> {
    return this.request(
      "POST",
      "/api/workers/claim",
      input,
    );
  }

  public async reportProgress(
    input: WonderWorkerProgressInput,
  ): Promise<void> {
    await this.request(
      "POST",
      "/api/workers/progress",
      input,
    );
  }

  public async complete(
    input: WonderWorkerCompleteInput,
  ): Promise<void> {
    await this.request(
      "POST",
      "/api/workers/complete",
      input,
    );
  }

  public async fail(
    input: WonderWorkerFailInput,
  ): Promise<void> {
    await this.request(
      "POST",
      "/api/workers/fail",
      input,
    );
  }

  public async release(
    input: WonderWorkerReleaseInput,
  ): Promise<void> {
    await this.request(
      "POST",
      "/api/workers/release",
      input,
    );
  }

  public async unregister(
    input: WonderWorkerUnregisterInput,
  ): Promise<void> {
    await this.request(
      "POST",
      "/api/workers/unregister",
      input,
    );
  }

  public listWorkers(): Promise<unknown[]> {
    return this.request(
      "GET",
      "/api/workers",
    );
  }

  public getWorker(
    workerId: string,
  ): Promise<unknown> {
    return this.request(
      "GET",
      `/api/workers/${encodeURIComponent(workerId)}`,
    );
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        this.requestTimeoutMilliseconds,
      );

    try {
      const headers:
        Record<string, string> = {
          accept: "application/json",
          ...this.headers,
        };

      if (body !== undefined) {
        headers["content-type"] =
          "application/json";
      }

      if (this.apiKey) {
        headers[this.apiKeyHeader] =
          this.apiKey;
      }

      const response =
        await fetch(
          `${this.baseUrl}${path}`,
          {
            method,
            headers,
            body:
              body === undefined
                ? undefined
                : JSON.stringify(body),
            signal:
              controller.signal,
          },
        );

      const rawText =
        await response.text();

      let parsed:
        WonderApiEnvelope<T> |
        T |
        null = null;

      if (rawText) {
        try {
          parsed =
            JSON.parse(rawText) as
              | WonderApiEnvelope<T>
              | T;
        } catch {
          throw new WonderWorkerHttpError(
            "WonderOS returned invalid JSON.",
            response.status,
            "WONDER_WORKER_INVALID_JSON",
            { rawText },
          );
        }
      }

      const envelope =
        parsed &&
        typeof parsed === "object" &&
        "success" in parsed
          ? parsed as WonderApiEnvelope<T>
          : null;

      if (
        !response.ok ||
        envelope?.success === false
      ) {
        throw new WonderWorkerHttpError(
          envelope?.error?.message ??
            `WonderOS request failed with HTTP ${response.status}.`,
          response.status,
          envelope?.error?.code ??
            "WONDER_WORKER_HTTP_ERROR",
          envelope?.error?.details,
        );
      }

      if (envelope) {
        return envelope.data as T;
      }

      return parsed as T;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw new WonderWorkerHttpError(
          `WonderOS request timed out after ${this.requestTimeoutMilliseconds} ms.`,
          408,
          "WONDER_WORKER_HTTP_TIMEOUT",
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
