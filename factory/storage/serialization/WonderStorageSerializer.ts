import {
  WonderStorageError,
} from "../WonderStorageAdapter";

// =========================================================
// SERIALIZER TYPES
// =========================================================

export type WonderStorageEncodedPrimitive =
  | null
  | boolean
  | number
  | string;

export interface WonderStorageDateEnvelope {
  __wonderType: "Date";

  value: string;
}

export interface WonderStorageUndefinedEnvelope {
  __wonderType: "Undefined";
}

export interface WonderStorageBigIntEnvelope {
  __wonderType: "BigInt";

  value: string;
}

export interface WonderStorageMapEnvelope {
  __wonderType: "Map";

  entries: [
    WonderStorageEncodedValue,
    WonderStorageEncodedValue,
  ][];
}

export interface WonderStorageSetEnvelope {
  __wonderType: "Set";

  values: WonderStorageEncodedValue[];
}

export interface WonderStorageRegExpEnvelope {
  __wonderType: "RegExp";

  source: string;

  flags: string;
}

export interface WonderStorageUint8ArrayEnvelope {
  __wonderType: "Uint8Array";

  values: number[];
}

export interface WonderStorageCustomEnvelope {
  __wonderType: "Custom";

  codec: string;

  value: WonderStorageEncodedValue;
}

export type WonderStorageEncodedEnvelope =
  | WonderStorageDateEnvelope
  | WonderStorageUndefinedEnvelope
  | WonderStorageBigIntEnvelope
  | WonderStorageMapEnvelope
  | WonderStorageSetEnvelope
  | WonderStorageRegExpEnvelope
  | WonderStorageUint8ArrayEnvelope
  | WonderStorageCustomEnvelope;

export type WonderStorageEncodedValue =
  | WonderStorageEncodedPrimitive
  | WonderStorageEncodedEnvelope
  | WonderStorageEncodedValue[]
  | {
      [key: string]:
        WonderStorageEncodedValue;
    };

export interface WonderStorageSerializerOptions {
  prettyPrint?: boolean;

  indentationSpaces?: number;

  maximumDepth?: number;

  sortObjectKeys?: boolean;

  rejectNonFiniteNumbers?: boolean;

  rejectUnsupportedObjects?: boolean;
}

export interface WonderStorageSerializeResult {
  content: string;

  bytes: number;

  encodedValue:
    WonderStorageEncodedValue;
}

export interface WonderStorageDeserializeResult<
  TValue = unknown
> {
  value: TValue;

  bytes: number;
}

export interface WonderStorageCustomCodec<
  TValue = unknown,
  TEncoded = unknown
> {
  readonly name: string;

  canEncode(
    value: unknown
  ): value is TValue;

  encode(
    value: TValue
  ): TEncoded;

  decode(
    value: TEncoded
  ): TValue;
}

interface ResolvedWonderStorageSerializerOptions {
  prettyPrint: boolean;

  indentationSpaces: number;

  maximumDepth: number;

  sortObjectKeys: boolean;

  rejectNonFiniteNumbers: boolean;

  rejectUnsupportedObjects: boolean;
}

// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_INDENTATION_SPACES =
  2;

const MAXIMUM_INDENTATION_SPACES =
  10;

const DEFAULT_MAXIMUM_DEPTH =
  100;

const MAXIMUM_ALLOWED_DEPTH =
  1_000;

// =========================================================
// SERIALIZER
// =========================================================

/**
 * Date-safe and adapter-independent WonderOS serializer.
 *
 * Supported values:
 *
 * - null
 * - boolean
 * - finite number
 * - string
 * - undefined
 * - bigint
 * - Date
 * - RegExp
 * - Uint8Array
 * - Array
 * - Map
 * - Set
 * - plain objects
 * - values supported by registered custom codecs
 *
 * Circular references are deliberately rejected because
 * persisted WonderOS state must remain deterministic.
 */
export class WonderStorageSerializer {
  private readonly options:
    ResolvedWonderStorageSerializerOptions;

  private readonly codecs =
    new Map<
      string,
      WonderStorageCustomCodec<
        unknown,
        unknown
      >
    >();

  constructor(
    options:
      WonderStorageSerializerOptions = {}
  ) {
    this.options =
      resolveSerializerOptions(
        options
      );
  }

  // =========================================================
  // CODECS
  // =========================================================

  registerCodec<
    TValue,
    TEncoded
  >(
    codec:
      WonderStorageCustomCodec<
        TValue,
        TEncoded
      >
  ): void {
    const name =
      normaliseCodecName(
        codec.name
      );

    if (
      this.codecs.has(name)
    ) {
      throw new WonderStorageError(
        `WonderStorageSerializer: codec "${name}" is already registered.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",

          details: {
            codec:
              name,
          },
        }
      );
    }

    if (
      typeof codec.canEncode !==
        "function" ||
      typeof codec.encode !==
        "function" ||
      typeof codec.decode !==
        "function"
    ) {
      throw new WonderStorageError(
        `WonderStorageSerializer: codec "${name}" is invalid.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }

    this.codecs.set(
      name,
      codec as WonderStorageCustomCodec<
        unknown,
        unknown
      >
    );
  }

  unregisterCodec(
    name: string
  ): boolean {
    return this.codecs.delete(
      normaliseCodecName(
        name
      )
    );
  }

  hasCodec(
    name: string
  ): boolean {
    return this.codecs.has(
      normaliseCodecName(
        name
      )
    );
  }

  listCodecNames(): string[] {
    return Array.from(
      this.codecs.keys()
    ).sort();
  }

  // =========================================================
  // SERIALIZE
  // =========================================================

  serialize(
    value: unknown
  ): WonderStorageSerializeResult {
    const encodedValue =
      this.encode(
        value
      );

    let content: string;

    try {
      content =
        JSON.stringify(
          encodedValue,
          null,
          this.options.prettyPrint
            ? this.options
                .indentationSpaces
            : undefined
        );
    } catch (error) {
      throw createSerializerError(
        "WonderStorageSerializer: failed to convert encoded value to JSON.",
        error
      );
    }

    return {
      content,

      bytes:
        Buffer.byteLength(
          content,
          "utf8"
        ),

      encodedValue,
    };
  }

  encode(
    value: unknown
  ): WonderStorageEncodedValue {
    return this.encodeValue(
      value,
      new WeakSet<object>(),
      0
    );
  }

  // =========================================================
  // DESERIALIZE
  // =========================================================

  deserialize<
    TValue = unknown
  >(
    content: string
  ): WonderStorageDeserializeResult<TValue> {
    if (
      typeof content !==
      "string"
    ) {
      throw new WonderStorageError(
        "WonderStorageSerializer: content must be a string.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }

    let parsed: unknown;

    try {
      parsed =
        JSON.parse(
          removeByteOrderMark(
            content
          )
        );
    } catch (error) {
      throw createSerializerError(
        "WonderStorageSerializer: content contains invalid JSON.",
        error
      );
    }

    return {
      value:
        this.decode<TValue>(
          parsed
        ),

      bytes:
        Buffer.byteLength(
          content,
          "utf8"
        ),
    };
  }

  decode<
    TValue = unknown
  >(
    value: unknown
  ): TValue {
    return this.decodeValue(
      value,
      0
    ) as TValue;
  }

  // =========================================================
  // ENCODING INTERNAL
  // =========================================================

  private encodeValue(
    value: unknown,
    seen: WeakSet<object>,
    depth: number
  ): WonderStorageEncodedValue {
    this.assertDepth(depth);

    if (
      value === null ||
      typeof value ===
        "boolean" ||
      typeof value ===
        "string"
    ) {
      return value;
    }

    if (
      typeof value ===
      "number"
    ) {
      if (
        !Number.isFinite(value)
      ) {
        if (
          this.options
            .rejectNonFiniteNumbers
        ) {
          throw new WonderStorageError(
            "WonderStorageSerializer: non-finite numbers cannot be persisted.",
            {
              code:
                "STORAGE_VALIDATION_FAILED",

              details: {
                value:
                  String(value),
              },
            }
          );
        }

        return String(value);
      }

      return value;
    }

    if (
      value === undefined
    ) {
      return {
        __wonderType:
          "Undefined",
      };
    }

    if (
      typeof value ===
      "bigint"
    ) {
      return {
        __wonderType:
          "BigInt",

        value:
          value.toString(),
      };
    }

    if (
      typeof value ===
        "function" ||
      typeof value ===
        "symbol"
    ) {
      throw new WonderStorageError(
        `WonderStorageSerializer: unsupported value type "${typeof value}".`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }

    if (
      typeof value !==
      "object"
    ) {
      throw new WonderStorageError(
        `WonderStorageSerializer: unsupported value type "${typeof value}".`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }

    const customValue =
      this.tryEncodeCustomValue(
        value,
        seen,
        depth
      );

    if (customValue) {
      return customValue;
    }

    if (
      value instanceof Date
    ) {
      if (
        Number.isNaN(
          value.getTime()
        )
      ) {
        throw new WonderStorageError(
          "WonderStorageSerializer: invalid Date cannot be persisted.",
          {
            code:
              "STORAGE_VALIDATION_FAILED",
          }
        );
      }

      return {
        __wonderType:
          "Date",

        value:
          value.toISOString(),
      };
    }

    if (
      value instanceof RegExp
    ) {
      return {
        __wonderType:
          "RegExp",

        source:
          value.source,

        flags:
          value.flags,
      };
    }

    if (
      value instanceof
      Uint8Array
    ) {
      return {
        __wonderType:
          "Uint8Array",

        values:
          Array.from(value),
      };
    }

    this.assertNotCircular(
      value,
      seen
    );

    seen.add(value);

    try {
      if (
        Array.isArray(value)
      ) {
        return value.map(
          (item) =>
            this.encodeValue(
              item,
              seen,
              depth + 1
            )
        );
      }

      if (
        value instanceof Map
      ) {
        return {
          __wonderType:
            "Map",

          entries:
            Array.from(
              value.entries()
            ).map(
              (
                [
                  key,
                  item,
                ]
              ) => [
                this.encodeValue(
                  key,
                  seen,
                  depth + 1
                ),

                this.encodeValue(
                  item,
                  seen,
                  depth + 1
                ),
              ]
            ),
        };
      }

      if (
        value instanceof Set
      ) {
        return {
          __wonderType:
            "Set",

          values:
            Array.from(value)
              .map(
                (item) =>
                  this.encodeValue(
                    item,
                    seen,
                    depth + 1
                  )
              ),
        };
      }

      if (
        !isPlainObject(value) &&
        this.options
          .rejectUnsupportedObjects
      ) {
        throw new WonderStorageError(
          `WonderStorageSerializer: object "${value.constructor?.name ?? "Unknown"}" requires a custom codec.`,
          {
            code:
              "STORAGE_VALIDATION_FAILED",

            details: {
              constructor:
                value.constructor
                  ?.name ??
                null,
            },
          }
        );
      }

      const entries =
        Object.entries(value);

      if (
        this.options
          .sortObjectKeys
      ) {
        entries.sort(
          (
            first,
            second
          ) =>
            first[0].localeCompare(
              second[0]
            )
        );
      }

      const encodedObject: {
        [key: string]:
          WonderStorageEncodedValue;
      } = {};

      for (
        const [
          key,
          item,
        ] of entries
      ) {
        encodedObject[key] =
          this.encodeValue(
            item,
            seen,
            depth + 1
          );
      }

      return encodedObject;
    } finally {
      seen.delete(value);
    }
  }

  private tryEncodeCustomValue(
    value: object,
    seen: WeakSet<object>,
    depth: number
  ): WonderStorageCustomEnvelope | null {
    for (
      const [
        name,
        codec,
      ] of this.codecs
    ) {
      let canEncode =
        false;

      try {
        canEncode =
          codec.canEncode(
            value
          );
      } catch (error) {
        throw createSerializerError(
          `WonderStorageSerializer: codec "${name}" failed during detection.`,
          error
        );
      }

      if (!canEncode) {
        continue;
      }

      this.assertNotCircular(
        value,
        seen
      );

      seen.add(value);

      try {
        const encoded =
          codec.encode(
            value
          );

        return {
          __wonderType:
            "Custom",

          codec:
            name,

          value:
            this.encodeValue(
              encoded,
              seen,
              depth + 1
            ),
        };
      } catch (error) {
        throw createSerializerError(
          `WonderStorageSerializer: codec "${name}" failed to encode its value.`,
          error
        );
      } finally {
        seen.delete(value);
      }
    }

    return null;
  }

  // =========================================================
  // DECODING INTERNAL
  // =========================================================

  private decodeValue(
    value: unknown,
    depth: number
  ): unknown {
    this.assertDepth(depth);

    if (
      value === null ||
      typeof value ===
        "boolean" ||
      typeof value ===
        "number" ||
      typeof value ===
        "string"
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {
      return value.map(
        (item) =>
          this.decodeValue(
            item,
            depth + 1
          )
      );
    }

    if (
      !isRecord(value)
    ) {
      throw new WonderStorageError(
        "WonderStorageSerializer: encoded value is invalid.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }

    const envelope =
      readEnvelopeType(value);

    switch (envelope) {
      case "Date":
        return decodeDateEnvelope(
          value
        );

      case "Undefined":
        return undefined;

      case "BigInt":
        return decodeBigIntEnvelope(
          value
        );

      case "RegExp":
        return decodeRegExpEnvelope(
          value
        );

      case "Uint8Array":
        return decodeUint8ArrayEnvelope(
          value
        );

      case "Map":
        return this.decodeMapEnvelope(
          value,
          depth
        );

      case "Set":
        return this.decodeSetEnvelope(
          value,
          depth
        );

      case "Custom":
        return this.decodeCustomEnvelope(
          value,
          depth
        );

      case null:
        break;
    }

    const decoded:
      Record<string, unknown> = {};

    for (
      const [
        key,
        item,
      ] of Object.entries(
        value
      )
    ) {
      decoded[key] =
        this.decodeValue(
          item,
          depth + 1
        );
    }

    return decoded;
  }

  private decodeMapEnvelope(
    value:
      Record<string, unknown>,
    depth: number
  ): Map<unknown, unknown> {
    if (
      !Array.isArray(
        value.entries
      )
    ) {
      throw invalidEnvelope(
        "Map"
      );
    }

    const result =
      new Map<
        unknown,
        unknown
      >();

    for (
      const entry of
        value.entries
    ) {
      if (
        !Array.isArray(entry) ||
        entry.length !== 2
      ) {
        throw invalidEnvelope(
          "Map"
        );
      }

      result.set(
        this.decodeValue(
          entry[0],
          depth + 1
        ),

        this.decodeValue(
          entry[1],
          depth + 1
        )
      );
    }

    return result;
  }

  private decodeSetEnvelope(
    value:
      Record<string, unknown>,
    depth: number
  ): Set<unknown> {
    if (
      !Array.isArray(
        value.values
      )
    ) {
      throw invalidEnvelope(
        "Set"
      );
    }

    return new Set(
      value.values.map(
        (item) =>
          this.decodeValue(
            item,
            depth + 1
          )
      )
    );
  }

  private decodeCustomEnvelope(
    value:
      Record<string, unknown>,
    depth: number
  ): unknown {
    if (
      typeof value.codec !==
        "string" ||
      !Object.prototype
        .hasOwnProperty.call(
          value,
          "value"
        )
    ) {
      throw invalidEnvelope(
        "Custom"
      );
    }

    const name =
      normaliseCodecName(
        value.codec
      );

    const codec =
      this.codecs.get(name);

    if (!codec) {
      throw new WonderStorageError(
        `WonderStorageSerializer: codec "${name}" is not registered.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",

          details: {
            codec:
              name,
          },
        }
      );
    }

    const decodedValue =
      this.decodeValue(
        value.value,
        depth + 1
      );

    try {
      return codec.decode(
        decodedValue
      );
    } catch (error) {
      throw createSerializerError(
        `WonderStorageSerializer: codec "${name}" failed to decode its value.`,
        error
      );
    }
  }

  // =========================================================
  // VALIDATION INTERNAL
  // =========================================================

  private assertDepth(
    depth: number
  ): void {
    if (
      depth >
      this.options.maximumDepth
    ) {
      throw new WonderStorageError(
        `WonderStorageSerializer: maximum depth of ${this.options.maximumDepth} was exceeded.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",

          details: {
            maximumDepth:
              this.options
                .maximumDepth,
          },
        }
      );
    }
  }

  private assertNotCircular(
    value: object,
    seen: WeakSet<object>
  ): void {
    if (
      seen.has(value)
    ) {
      throw new WonderStorageError(
        "WonderStorageSerializer: circular values cannot be persisted.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  }
}

// =========================================================
// ENVELOPE DECODERS
// =========================================================

function decodeDateEnvelope(
  value:
    Record<string, unknown>
): Date {
  if (
    typeof value.value !==
      "string"
  ) {
    throw invalidEnvelope(
      "Date"
    );
  }

  const date =
    new Date(
      value.value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw invalidEnvelope(
      "Date"
    );
  }

  return date;
}

function decodeBigIntEnvelope(
  value:
    Record<string, unknown>
): bigint {
  if (
    typeof value.value !==
      "string" ||
    !/^-?\d+$/.test(
      value.value
    )
  ) {
    throw invalidEnvelope(
      "BigInt"
    );
  }

  try {
    return BigInt(
      value.value
    );
  } catch {
    throw invalidEnvelope(
      "BigInt"
    );
  }
}

function decodeRegExpEnvelope(
  value:
    Record<string, unknown>
): RegExp {
  if (
    typeof value.source !==
      "string" ||
    typeof value.flags !==
      "string"
  ) {
    throw invalidEnvelope(
      "RegExp"
    );
  }

  try {
    return new RegExp(
      value.source,
      value.flags
    );
  } catch {
    throw invalidEnvelope(
      "RegExp"
    );
  }
}

function decodeUint8ArrayEnvelope(
  value:
    Record<string, unknown>
): Uint8Array {
  if (
    !Array.isArray(
      value.values
    ) ||
    !value.values.every(
      (item) =>
        typeof item ===
          "number" &&
        Number.isInteger(item) &&
        item >= 0 &&
        item <= 255
    )
  ) {
    throw invalidEnvelope(
      "Uint8Array"
    );
  }

  return new Uint8Array(
    value.values as number[]
  );
}

// =========================================================
// ENVELOPE HELPERS
// =========================================================

function readEnvelopeType(
  value:
    Record<string, unknown>
):
  | WonderStorageEncodedEnvelope[
      "__wonderType"
    ]
  | null {
  const type =
    value.__wonderType;

  if (
    type === "Date" ||
    type === "Undefined" ||
    type === "BigInt" ||
    type === "Map" ||
    type === "Set" ||
    type === "RegExp" ||
    type === "Uint8Array" ||
    type === "Custom"
  ) {
    return type;
  }

  return null;
}

function invalidEnvelope(
  type: string
): WonderStorageError {
  return new WonderStorageError(
    `WonderStorageSerializer: encoded ${type} envelope is invalid.`,
    {
      code:
        "STORAGE_VALIDATION_FAILED",

      details: {
        envelopeType:
          type,
      },
    }
  );
}

// =========================================================
// OPTIONS
// =========================================================

function resolveSerializerOptions(
  options:
    WonderStorageSerializerOptions
): ResolvedWonderStorageSerializerOptions {
  return {
    prettyPrint:
      options.prettyPrint ??
      true,

    indentationSpaces:
      clampInteger(
        options.indentationSpaces ??
          DEFAULT_INDENTATION_SPACES,
        0,
        MAXIMUM_INDENTATION_SPACES
      ),

    maximumDepth:
      clampInteger(
        options.maximumDepth ??
          DEFAULT_MAXIMUM_DEPTH,
        1,
        MAXIMUM_ALLOWED_DEPTH
      ),

    sortObjectKeys:
      options.sortObjectKeys ??
      true,

    rejectNonFiniteNumbers:
      options
        .rejectNonFiniteNumbers ??
      true,

    rejectUnsupportedObjects:
      options
        .rejectUnsupportedObjects ??
      true,
  };
}

// =========================================================
// GENERAL HELPERS
// =========================================================

function normaliseCodecName(
  value: string
): string {
  if (
    typeof value !==
    "string"
  ) {
    throw new WonderStorageError(
      "WonderStorageSerializer: codec name must be a string.",
      {
        code:
          "STORAGE_VALIDATION_FAILED",
      }
    );
  }

  const cleaned =
    value.trim();

  if (
    cleaned.length === 0
  ) {
    throw new WonderStorageError(
      "WonderStorageSerializer: codec name is required.",
      {
        code:
          "STORAGE_VALIDATION_FAILED",
      }
    );
  }

  return cleaned;
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

function isPlainObject(
  value: object
): value is Record<
  string,
  unknown
> {
  const prototype =
    Object.getPrototypeOf(
      value
    );

  return (
    prototype ===
      Object.prototype ||
    prototype ===
      null
  );
}

function removeByteOrderMark(
  value: string
): string {
  return value.replace(
    /^\uFEFF/,
    ""
  );
}

function createSerializerError(
  message: string,
  cause: unknown
): WonderStorageError {
  return new WonderStorageError(
    message,
    {
      code:
        "STORAGE_VALIDATION_FAILED",

      retryable:
        false,

      cause,

      details: {
        cause:
          cause instanceof Error
            ? cause.message
            : String(cause),
      },
    }
  );
}

// =========================================================
// DEFAULT SERIALIZER
// =========================================================

export const wonderStorageSerializer =
  new WonderStorageSerializer();

export default WonderStorageSerializer;