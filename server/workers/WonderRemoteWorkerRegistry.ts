import { randomUUID } from "node:crypto";

export type WonderRemoteWorkerStatus =
  | "created"
  | "registering"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "error";

export type WonderRemoteWorkerMetadata =
  Record<string, unknown>;

export interface WonderRemoteWorkerMetrics {
  startedAt: string | null;
  stoppedAt: string | null;
  uptimeMilliseconds: number;
  activeJobCount: number;
  maximumConcurrency: number;
  totalClaimAttempts: number;
  totalJobsClaimed: number;
  totalJobsStarted: number;
  totalJobsCompleted: number;
  totalJobsFailed: number;
  totalJobsReleased: number;
  totalHandlerTimeouts: number;
  totalHeartbeats: number;
  failedHeartbeats: number;
  averageExecutionMilliseconds: number;
  maximumExecutionMilliseconds: number;
  minimumExecutionMilliseconds: number | null;
  lastJobStartedAt: string | null;
  lastJobCompletedAt: string | null;
  lastJobFailedAt: string | null;
  lastHeartbeatAt: string | null;
  lastError: unknown;
}

export interface WonderRemoteWorkerRegistrationInput {
  workerId: string;
  name: string;
  capabilities: string[];
  concurrency: number;
  metadata: WonderRemoteWorkerMetadata;
  startedAt: string;
}

export interface WonderRemoteWorkerRegistration {
  workerId: string;
  registrationId: string;
  registeredAt: string;
  leaseDurationMilliseconds: number;
}

export interface WonderRemoteWorkerHeartbeatInput {
  workerId: string;
  registrationId: string;
  status: WonderRemoteWorkerStatus;
  activeJobCount: number;
  availableConcurrency: number;
  metrics: WonderRemoteWorkerMetrics;
  sentAt: string;
}

export interface WonderRemoteWorkerUnregisterInput {
  workerId: string;
  registrationId: string;
  stoppedAt: string;
  reason: string;
}

export interface WonderRemoteWorkerSnapshot {
  workerId: string;
  registrationId: string;
  name: string;
  status: WonderRemoteWorkerStatus;
  capabilities: string[];
  concurrency: number;
  activeJobCount: number;
  availableConcurrency: number;
  metadata: WonderRemoteWorkerMetadata;
  startedAt: string;
  registeredAt: string;
  lastHeartbeatAt: string;
  leaseDurationMilliseconds: number;
  leaseExpiresAt: string;
  metrics: WonderRemoteWorkerMetrics | null;
}

interface WonderRemoteWorkerRecord
  extends WonderRemoteWorkerSnapshot {}

export class WonderRemoteWorkerRegistrationError
  extends Error {
  public constructor(
    message: string,
    public readonly code:
      | "REMOTE_WORKER_NOT_FOUND"
      | "REMOTE_WORKER_REGISTRATION_INVALID"
      | "REMOTE_WORKER_ALREADY_REGISTERED",
  ) {
    super(message);
    this.name = "WonderRemoteWorkerRegistrationError";
  }
}

/**
 * Sprint 5.1A registry.
 *
 * This class owns only remote-worker presence:
 * registration, heartbeat leases, lookup and unregister.
 *
 * Job claiming and Factory queue leasing are intentionally deferred
 * to Sprint 5.1B.
 */
export class WonderRemoteWorkerRegistry {
  private readonly workers =
    new Map<string, WonderRemoteWorkerRecord>();

  public constructor(
    private readonly leaseDurationMilliseconds = 30_000,
  ) {
    if (
      !Number.isInteger(leaseDurationMilliseconds) ||
      leaseDurationMilliseconds < 1_000
    ) {
      throw new Error(
        "WonderRemoteWorkerRegistry lease duration must be at least 1000 ms.",
      );
    }
  }

  public register(
    input: WonderRemoteWorkerRegistrationInput,
  ): WonderRemoteWorkerRegistration {
    this.removeExpiredWorkers();

    const workerId =
      requireText(input.workerId, "workerId");

    if (this.workers.has(workerId)) {
      throw new WonderRemoteWorkerRegistrationError(
        `Remote worker "${workerId}" is already registered.`,
        "REMOTE_WORKER_ALREADY_REGISTERED",
      );
    }

    const name =
      requireText(input.name, "name");

    const capabilities =
      normaliseCapabilities(input.capabilities);

    const concurrency =
      requirePositiveInteger(
        input.concurrency,
        "concurrency",
      );

    const startedAt =
      requireDateString(input.startedAt, "startedAt");

    const now = new Date();
    const registeredAt = now.toISOString();
    const registrationId =
      `wonder-registration-${randomUUID()}`;

    const record: WonderRemoteWorkerRecord = {
      workerId,
      registrationId,
      name,
      status: "running",
      capabilities,
      concurrency,
      activeJobCount: 0,
      availableConcurrency: concurrency,
      metadata: cloneRecord(input.metadata),
      startedAt,
      registeredAt,
      lastHeartbeatAt: registeredAt,
      leaseDurationMilliseconds:
        this.leaseDurationMilliseconds,
      leaseExpiresAt: new Date(
        now.getTime() +
          this.leaseDurationMilliseconds,
      ).toISOString(),
      metrics: null,
    };

    this.workers.set(workerId, record);

    return {
      workerId,
      registrationId,
      registeredAt,
      leaseDurationMilliseconds:
        this.leaseDurationMilliseconds,
    };
  }

  public heartbeat(
    input: WonderRemoteWorkerHeartbeatInput,
  ): WonderRemoteWorkerSnapshot {
    const worker = this.requireRegistration(
      input.workerId,
      input.registrationId,
    );

    const sentAt =
      requireDateString(input.sentAt, "sentAt");

    worker.status =
      normaliseStatus(input.status);

    worker.activeJobCount =
      requireNonNegativeInteger(
        input.activeJobCount,
        "activeJobCount",
      );

    worker.availableConcurrency =
      Math.min(
        worker.concurrency,
        requireNonNegativeInteger(
          input.availableConcurrency,
          "availableConcurrency",
        ),
      );

    worker.lastHeartbeatAt = sentAt;
    worker.leaseExpiresAt = new Date(
      Date.now() +
        worker.leaseDurationMilliseconds,
    ).toISOString();

    worker.metrics =
      cloneValue(input.metrics);

    return cloneWorker(worker);
  }

  public unregister(
    input: WonderRemoteWorkerUnregisterInput,
  ): WonderRemoteWorkerSnapshot {
    const worker = this.requireRegistration(
      input.workerId,
      input.registrationId,
    );

    requireDateString(
      input.stoppedAt,
      "stoppedAt",
    );

    requireText(input.reason, "reason");

    const snapshot =
      cloneWorker({
        ...worker,
        status: "stopped",
        activeJobCount: 0,
        availableConcurrency: 0,
      });

    this.workers.delete(worker.workerId);

    return snapshot;
  }

  public getWorker(
    workerId: string,
  ): WonderRemoteWorkerSnapshot | null {
    this.removeExpiredWorkers();

    const worker =
      this.workers.get(
        requireText(workerId, "workerId"),
      );

    return worker
      ? cloneWorker(worker)
      : null;
  }

  public listWorkers():
    WonderRemoteWorkerSnapshot[] {
    this.removeExpiredWorkers();

    return Array.from(this.workers.values())
      .map(cloneWorker)
      .sort((left, right) =>
        left.workerId.localeCompare(
          right.workerId,
        ),
      );
  }

  public size(): number {
    this.removeExpiredWorkers();
    return this.workers.size;
  }

  public removeExpiredWorkers(
    now = new Date(),
  ): number {
    let removed = 0;
    const nowMilliseconds = now.getTime();

    for (const worker of this.workers.values()) {
      if (
        Date.parse(worker.leaseExpiresAt) >
        nowMilliseconds
      ) {
        continue;
      }

      this.workers.delete(worker.workerId);
      removed += 1;
    }

    return removed;
  }

  private requireRegistration(
    workerIdValue: string,
    registrationIdValue: string,
  ): WonderRemoteWorkerRecord {
    this.removeExpiredWorkers();

    const workerId =
      requireText(workerIdValue, "workerId");

    const registrationId =
      requireText(
        registrationIdValue,
        "registrationId",
      );

    const worker =
      this.workers.get(workerId);

    if (!worker) {
      throw new WonderRemoteWorkerRegistrationError(
        `Remote worker "${workerId}" was not found or its lease expired.`,
        "REMOTE_WORKER_NOT_FOUND",
      );
    }

    if (
      worker.registrationId !==
      registrationId
    ) {
      throw new WonderRemoteWorkerRegistrationError(
        `Registration "${registrationId}" is invalid for remote worker "${workerId}".`,
        "REMOTE_WORKER_REGISTRATION_INVALID",
      );
    }

    return worker;
  }
}

function normaliseCapabilities(
  value: string[],
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'Remote worker field "capabilities" must be an array.',
    );
  }

  const capabilities =
    Array.from(
      new Set(
        value.map((capability) =>
          requireText(
            capability,
            "capability",
          ),
        ),
      ),
    );

  if (capabilities.length === 0) {
    throw new Error(
      "Remote worker requires at least one capability.",
    );
  }

  return capabilities;
}

function normaliseStatus(
  value: WonderRemoteWorkerStatus,
): WonderRemoteWorkerStatus {
  const allowed:
    WonderRemoteWorkerStatus[] = [
      "created",
      "registering",
      "starting",
      "running",
      "stopping",
      "stopped",
      "error",
    ];

  if (!allowed.includes(value)) {
    throw new Error(
      `Invalid remote worker status "${String(value)}".`,
    );
  }

  return value;
}

function requireText(
  value: string,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new Error(
      `Remote worker field "${fieldName}" must be a string.`,
    );
  }

  const clean = value.trim();

  if (!clean) {
    throw new Error(
      `Remote worker field "${fieldName}" is required.`,
    );
  }

  return clean;
}

function requirePositiveInteger(
  value: number,
  fieldName: string,
): number {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `Remote worker field "${fieldName}" must be a positive integer.`,
    );
  }

  return value;
}

function requireNonNegativeInteger(
  value: number,
  fieldName: string,
): number {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `Remote worker field "${fieldName}" must be a non-negative integer.`,
    );
  }

  return value;
}

function requireDateString(
  value: string,
  fieldName: string,
): string {
  const clean =
    requireText(value, fieldName);

  if (
    Number.isNaN(
      Date.parse(clean),
    )
  ) {
    throw new Error(
      `Remote worker field "${fieldName}" must be a valid ISO date string.`,
    );
  }

  return new Date(clean).toISOString();
}

function cloneRecord(
  value: WonderRemoteWorkerMetadata,
): WonderRemoteWorkerMetadata {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      'Remote worker field "metadata" must be an object.',
    );
  }

  return cloneValue(value);
}

function cloneWorker(
  worker: WonderRemoteWorkerRecord,
): WonderRemoteWorkerSnapshot {
  return cloneValue(worker);
}

function cloneValue<T>(
  value: T,
): T {
  return structuredClone(value);
}
