export type WonderEventMap =
  object;

export type WonderEventName<
  TEvents extends WonderEventMap
> = Extract<
  keyof TEvents,
  string
>;

export type WonderEventDispatchMode =
  | "sequential"
  | "parallel";

export interface WonderEvent<
  TPayload = unknown
> {
  id: string;

  name: string;

  payload: TPayload;

  createdAt: Date;

  source: string | null;

  metadata: Readonly<
    Record<string, unknown>
  >;
}

export interface WonderEvent<
  TPayload = unknown
> {
  id: string;

  name: string;

  payload: TPayload;

  createdAt: Date;

  source: string | null;

  metadata: Readonly<
    Record<string, unknown>
  >;
}

export interface WonderEventEmitOptions {
  source?: string | null;

  metadata?: Record<
    string,
    unknown
  >;

  mode?: WonderEventDispatchMode;

  stopOnError?: boolean;
}

export interface WonderEventDispatchError {
  subscriptionId: string;

  eventName: string;

  message: string;

  error: unknown;
}

export interface WonderEventDispatchResult<
  TPayload = unknown
> {
  event: WonderEvent<TPayload>;

  listenerCount: number;

  successfulListeners: number;

  failedListeners: number;

  errors: WonderEventDispatchError[];

  completedAt: Date;

  durationMilliseconds: number;
}

export interface WonderEventBusOptions {
  captureHistory?: boolean;

  maximumHistory?: number;

  defaultDispatchMode?: WonderEventDispatchMode;

  stopOnError?: boolean;
}

export interface WonderEventSubscription {
  id: string;

  eventName: string;

  once: boolean;

  unsubscribe(): void;

  isActive(): boolean;
}

export type WonderEventHandler<
  TPayload = unknown
> = (
  event: WonderEvent<TPayload>
) => void | Promise<void>;

export type WonderAnyEventHandler = (
  event: WonderEvent<unknown>
) => void | Promise<void>;

interface InternalListener {
  id: string;

  eventName: string;

  once: boolean;

  handler: WonderEventHandler<unknown>;

  active: boolean;

  createdAt: Date;
}

interface ResolvedEventBusOptions {
  captureHistory: boolean;

  maximumHistory: number;

  defaultDispatchMode: WonderEventDispatchMode;

  stopOnError: boolean;
}

const ANY_EVENT_NAME = "*";

const DEFAULT_MAXIMUM_HISTORY = 100;

const MAXIMUM_ALLOWED_HISTORY = 10_000;

/**
 * Central event system for WonderOS.
 *
 * WonderEventBus allows independent modules to communicate
 * without importing or directly depending on one another.
 *
 * Example:
 *
 * wonderEventBus.on(
 *   "studio:draft-validated",
 *   async event => {
 *     console.log(event.payload);
 *   }
 * );
 *
 * await wonderEventBus.emit(
 *   "studio:draft-validated",
 *   {
 *     draftId: "draft-001",
 *     valid: true,
 *   }
 * );
 */
export class WonderEventBus<
  TEvents extends WonderEventMap =
    Record<string, unknown>
> { 
  private readonly options:
    ResolvedEventBusOptions;

  private readonly listeners =
    new Map<
      string,
      Map<string, InternalListener>
    >();

  private readonly history:
    WonderEvent<unknown>[] = [];

  private eventSequence = 0;

  private subscriptionSequence = 0;

  constructor(
    options: WonderEventBusOptions = {}
  ) {
    this.options =
      resolveEventBusOptions(
        options
      );
  }

  // =========================================================
  // SUBSCRIPTIONS
  // =========================================================

  on<
    TName extends WonderEventName<TEvents>
  >(
    eventName: TName,
    handler: WonderEventHandler<
      TEvents[TName]
    >
  ): WonderEventSubscription {
    return this.addListener(
      String(eventName),
      handler as WonderEventHandler<unknown>,
      false
    );
  }

  once<
    TName extends WonderEventName<TEvents>
  >(
    eventName: TName,
    handler: WonderEventHandler<
      TEvents[TName]
    >
  ): WonderEventSubscription {
    return this.addListener(
      String(eventName),
      handler as WonderEventHandler<unknown>,
      true
    );
  }

  onAny(
    handler: WonderAnyEventHandler
  ): WonderEventSubscription {
    return this.addListener(
      ANY_EVENT_NAME,
      handler,
      false
    );
  }

  onceAny(
    handler: WonderAnyEventHandler
  ): WonderEventSubscription {
    return this.addListener(
      ANY_EVENT_NAME,
      handler,
      true
    );
  }

  off(
    subscriptionId: string
  ): boolean {
    const cleanSubscriptionId =
      normaliseRequiredText(
        subscriptionId,
        "subscriptionId"
      );

    for (
      const [
        eventName,
        eventListeners,
      ] of this.listeners
    ) {
      const listener =
        eventListeners.get(
          cleanSubscriptionId
        );

      if (!listener) {
        continue;
      }

      listener.active = false;

      eventListeners.delete(
        cleanSubscriptionId
      );

      if (
        eventListeners.size === 0
      ) {
        this.listeners.delete(
          eventName
        );
      }

      return true;
    }

    return false;
  }

  clear(
    eventName?:
      | WonderEventName<TEvents>
      | typeof ANY_EVENT_NAME
  ): void {
    if (
      eventName === undefined
    ) {
      for (
        const eventListeners of
          this.listeners.values()
      ) {
        for (
          const listener of
            eventListeners.values()
        ) {
          listener.active = false;
        }
      }

      this.listeners.clear();

      return;
    }

    const key =
      String(eventName);

    const eventListeners =
      this.listeners.get(key);

    if (!eventListeners) {
      return;
    }

    for (
      const listener of
        eventListeners.values()
    ) {
      listener.active = false;
    }

    this.listeners.delete(key);
  }

  // =========================================================
  // EMISSION
  // =========================================================

  async emit<
    TName extends WonderEventName<TEvents>
  >(
    eventName: TName,
    payload: TEvents[TName],
    options: WonderEventEmitOptions = {}
  ): Promise<
    WonderEventDispatchResult<
      TEvents[TName]
    >
  > {
    const startedAt =
      new Date();

    const event =
      this.createEvent(
        String(eventName),
        payload,
        options
      );

    this.captureEvent(event);

    const listeners =
      this.getListenersForEvent(
        String(eventName)
      );

    const mode =
      options.mode ??
      this.options
        .defaultDispatchMode;

    const stopOnError =
      options.stopOnError ??
      this.options.stopOnError;

    const errors:
      WonderEventDispatchError[] = [];

    let successfulListeners = 0;

    if (mode === "parallel") {
      const results =
        await Promise.all(
          listeners.map(
            async listener =>
              this.invokeListener(
                listener,
                event
              )
          )
        );

      for (
        const result of results
      ) {
        if (result === null) {
          successfulListeners += 1;
        } else {
          errors.push(result);
        }
      }
    } else {
      for (
        const listener of listeners
      ) {
        const error =
          await this.invokeListener(
            listener,
            event
          );

        if (error === null) {
          successfulListeners += 1;
        } else {
          errors.push(error);

          if (stopOnError) {
            break;
          }
        }
      }
    }

    const completedAt =
      new Date();

    return {
      event:
        cloneEvent(
          event
        ) as WonderEvent<
          TEvents[TName]
        >,

      listenerCount:
        listeners.length,

      successfulListeners,

      failedListeners:
        errors.length,

      errors: errors.map(
        cloneDispatchError
      ),

      completedAt,

      durationMilliseconds:
        Math.max(
          0,
          completedAt.getTime() -
            startedAt.getTime()
        ),
    };
  }

  // =========================================================
  // STATUS
  // =========================================================

  hasListeners<
    TName extends WonderEventName<TEvents>
  >(
    eventName: TName
  ): boolean {
    return (
      this.listenerCount(
        eventName
      ) > 0
    );
  }

  listenerCount<
    TName extends WonderEventName<TEvents>
  >(
    eventName: TName
  ): number {
    const namedListeners =
      this.listeners.get(
        String(eventName)
      )?.size ?? 0;

    const anyListeners =
      this.listeners.get(
        ANY_EVENT_NAME
      )?.size ?? 0;

    return (
      namedListeners +
      anyListeners
    );
  }

  totalListenerCount(): number {
    let total = 0;

    for (
      const listeners of
        this.listeners.values()
    ) {
      total += listeners.size;
    }

    return total;
  }

  getRegisteredEventNames(): string[] {
    return Array.from(
      this.listeners.keys()
    )
      .filter(
        eventName =>
          eventName !==
          ANY_EVENT_NAME
      )
      .sort();
  }

  // =========================================================
  // HISTORY
  // =========================================================

  getHistory(): WonderEvent<unknown>[] {
    return this.history.map(
      cloneEvent
    );
  }

  getEventHistory<
    TName extends WonderEventName<TEvents>
  >(
    eventName: TName
  ): Array<
    WonderEvent<TEvents[TName]>
  > {
    const targetName =
      String(eventName);

    return this.history
      .filter(
        event =>
          event.name ===
          targetName
      )
      .map(
        event =>
          cloneEvent(
            event
          ) as WonderEvent<
            TEvents[TName]
          >
      );
  }

  getLastEvent<
    TName extends WonderEventName<TEvents>
  >(
    eventName: TName
  ): WonderEvent<
    TEvents[TName]
  > | null {
    const targetName =
      String(eventName);

    for (
      let index =
        this.history.length - 1;
      index >= 0;
      index -= 1
    ) {
      const event =
        this.history[index];

      if (
        event.name ===
        targetName
      ) {
        return cloneEvent(
          event
        ) as WonderEvent<
          TEvents[TName]
        >;
      }
    }

    return null;
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  // =========================================================
  // INTERNAL SUBSCRIPTIONS
  // =========================================================

  private addListener<
    TPayload
  >(
    eventName: string,
    handler: WonderEventHandler<TPayload>,
    once: boolean
  ): WonderEventSubscription {
    const cleanEventName =
      normaliseRequiredText(
        eventName,
        "eventName"
      );

    if (
      typeof handler !==
      "function"
    ) {
      throw new Error(
        "WonderEventBus: handler must be a function."
      );
    }

    const listenerId =
      this.createSubscriptionId(
        cleanEventName
      );

    const listener: InternalListener = {
      id: listenerId,

      eventName:
        cleanEventName,

      once,

      handler:
        handler as WonderEventHandler<unknown>,

      active: true,

      createdAt:
        new Date(),
    };

    const eventListeners =
      this.listeners.get(
        cleanEventName
      ) ??
      new Map<
        string,
        InternalListener
      >();

    eventListeners.set(
      listenerId,
      listener
    );

    this.listeners.set(
      cleanEventName,
      eventListeners
    );

    return this.createSubscription(
      listener
    );
  }

  private createSubscription(
    listener: InternalListener
  ): WonderEventSubscription {
    return {
      id:
        listener.id,

      eventName:
        listener.eventName,

      once:
        listener.once,

      unsubscribe: () => {
        this.off(
          listener.id
        );
      },

      isActive: () =>
        listener.active,
    };
  }

  // =========================================================
  // INTERNAL DISPATCH
  // =========================================================

  private getListenersForEvent(
    eventName: string
  ): InternalListener[] {
    const namedListeners =
      Array.from(
        this.listeners
          .get(eventName)
          ?.values() ?? []
      );

    const anyListeners =
      Array.from(
        this.listeners
          .get(ANY_EVENT_NAME)
          ?.values() ?? []
      );

    return [
      ...namedListeners,
      ...anyListeners,
    ].filter(
      listener =>
        listener.active
    );
  }

  private async invokeListener(
    listener: InternalListener,
    event: WonderEvent<unknown>
  ): Promise<
    WonderEventDispatchError | null
  > {
    if (!listener.active) {
      return null;
    }

    if (listener.once) {
      this.off(listener.id);
    }

    try {
      await listener.handler(
        cloneEvent(event)
      );

      return null;
    } catch (error) {
      return {
        subscriptionId:
          listener.id,

        eventName:
          event.name,

        message:
          getErrorMessage(error),

        error,
      };
    }
  }

  // =========================================================
  // INTERNAL EVENTS
  // =========================================================

  private createEvent<
    TPayload
  >(
    eventName: string,
    payload: TPayload,
    options: WonderEventEmitOptions
  ): WonderEvent<TPayload> {
    const createdAt =
      new Date();

    return {
      id:
        this.createEventId(
          eventName,
          createdAt
        ),

      name:
        normaliseRequiredText(
          eventName,
          "eventName"
        ),

      payload,

      createdAt,

      source:
        normaliseOptionalText(
          options.source
        ),

      metadata:
        Object.freeze({
          ...(options.metadata ??
            {}),
        }),
    };
  }

  private captureEvent(
    event: WonderEvent<unknown>
  ): void {
    if (
      !this.options
        .captureHistory ||
      this.options
        .maximumHistory === 0
    ) {
      return;
    }

    this.history.push(
      cloneEvent(event)
    );

    if (
      this.history.length >
      this.options.maximumHistory
    ) {
      this.history.splice(
        0,
        this.history.length -
          this.options
            .maximumHistory
      );
    }
  }

  // =========================================================
  // INTERNAL IDS
  // =========================================================

  private createEventId(
    eventName: string,
    createdAt: Date
  ): string {
    this.eventSequence += 1;

    const hash =
      hashText(
        [
          eventName,
          createdAt.toISOString(),
          this.eventSequence,
        ].join(":")
      )
        .toString(36)
        .padStart(
          7,
          "0"
        );

    return `wonder-event-${hash}`;
  }

  private createSubscriptionId(
    eventName: string
  ): string {
    this.subscriptionSequence += 1;

    const hash =
      hashText(
        [
          eventName,
          Date.now(),
          this.subscriptionSequence,
        ].join(":")
      )
        .toString(36)
        .padStart(
          7,
          "0"
        );

    return `wonder-subscription-${hash}`;
  }
}

// =========================================================
// OPTIONS
// =========================================================

function resolveEventBusOptions(
  options: WonderEventBusOptions
): ResolvedEventBusOptions {
  return {
    captureHistory:
      options.captureHistory ??
      true,

    maximumHistory:
      clampInteger(
        options.maximumHistory ??
          DEFAULT_MAXIMUM_HISTORY,
        0,
        MAXIMUM_ALLOWED_HISTORY
      ),

    defaultDispatchMode:
      options.defaultDispatchMode ??
      "sequential",

    stopOnError:
      options.stopOnError ??
      false,
  };
}

// =========================================================
// CLONING
// =========================================================

function cloneEvent<
  TPayload
>(
  event: WonderEvent<TPayload>
): WonderEvent<TPayload> {
  return {
    ...event,

    createdAt:
      new Date(
        event.createdAt.getTime()
      ),

    metadata:
      Object.freeze({
        ...event.metadata,
      }),
  };
}

function cloneDispatchError(
  error: WonderEventDispatchError
): WonderEventDispatchError {
  return {
    ...error,
  };
}

// =========================================================
// TEXT HELPERS
// =========================================================

function normaliseRequiredText(
  value: string,
  fieldName: string
): string {
  if (
    typeof value !== "string"
  ) {
    throw new Error(
      `WonderEventBus: "${fieldName}" must be a string.`
    );
  }

  const cleaned =
    value.trim();

  if (
    cleaned.length === 0
  ) {
    throw new Error(
      `WonderEventBus: "${fieldName}" is required.`
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
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned.length > 0
    ? cleaned
    : null;
}

// =========================================================
// NUMBER HELPERS
// =========================================================

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

// =========================================================
// GENERAL HELPERS
// =========================================================

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

function hashText(
  text: string
): number {
  let hash = 2166136261;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    hash ^=
      text.charCodeAt(index);

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}

// =========================================================
// DEFAULT INSTANCE
// =========================================================

export const wonderEventBus =
  new WonderEventBus();

export default WonderEventBus;