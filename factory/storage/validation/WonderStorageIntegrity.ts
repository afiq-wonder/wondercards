import {
    WonderStorageSerializer,
    wonderStorageSerializer,
  } from "../serialization";

import {
    createHash,
    timingSafeEqual,
  } from "node:crypto";
  
  import type {
    BinaryToTextEncoding,
} from "crypto";

  import {
    WonderStorageError,
  } from "../WonderStorageAdapter";
  
  import type {
    WonderStorageMetadata,
    WonderStorageRevision,
  } from "../WonderStorageAdapter";
   
  
  // =========================================================
  // CORE TYPES
  // =========================================================
  
  export type WonderStorageChecksumAlgorithm =
    | "sha256"
    | "sha384"
    | "sha512";
  
  export type WonderStorageValidationSeverity =
    | "info"
    | "warning"
    | "error";
  
  export type WonderStorageIntegrityStatus =
    | "valid"
    | "invalid"
    | "unchecked";
  
  export interface WonderStorageValidationIssue {
    code: string;
  
    severity:
      WonderStorageValidationSeverity;
  
    message: string;
  
    path: string | null;
  
    details: Record<
      string,
      unknown
    >;
  }
  
  export interface WonderStorageValidationContext {
    operation:
      | "save"
      | "load"
      | "restore"
      | "backup"
      | "migration"
      | "manual";
  
    backend?: string;
  
    revision?: number | null;
  
    metadata?: Readonly<
      Record<string, unknown>
    >;
  }
  
  export interface WonderStorageValidationResult {
    valid: boolean;
  
    checkedAt: Date;
  
    issues: WonderStorageValidationIssue[];
  
    errorCount: number;
  
    warningCount: number;
  
    infoCount: number;
  }
  
  export interface WonderStorageValidator<
    TValue = unknown
  > {
    readonly name: string;
  
    validate(
      value: TValue,
      context?: WonderStorageValidationContext
    ):
      | WonderStorageValidationResult
      | Promise<WonderStorageValidationResult>;
  }
  
  // =========================================================
  // CHECKSUM TYPES
  // =========================================================
  
  export interface WonderStorageChecksumOptions {
    algorithm?: WonderStorageChecksumAlgorithm;
  
    encoding?:
    | "hex"
    | "base64"
    | "base64url";
  
    includeAlgorithmPrefix?: boolean;
  }
  
  export interface WonderStorageChecksumResult {
    algorithm: WonderStorageChecksumAlgorithm;
  
    checksum: string;
  
    bytes: number;
  
    createdAt: Date;
  }
  
  export interface WonderStorageChecksumVerificationResult {
    valid: boolean;
  
    algorithm: WonderStorageChecksumAlgorithm;
  
    expectedChecksum: string;
  
    actualChecksum: string;
  
    checkedAt: Date;
  }
  
  // =========================================================
  // INTEGRITY TYPES
  // =========================================================
  
  export interface WonderStorageIntegrityManifest {
    version: number;
  
    algorithm: WonderStorageChecksumAlgorithm;
  
    checksum: string;
  
    sizeBytes: number;
  
    revision: number | null;
  
    etag: string | null;
  
    createdAt: Date;
  
    metadata: Record<
      string,
      unknown
    >;
  }
  
  export interface WonderStorageIntegrityCreateOptions {
    algorithm?: WonderStorageChecksumAlgorithm;
  
    revision?: number | null;
  
    etag?: string | null;
  
    metadata?: Record<
      string,
      unknown
    >;
  }
  
  export interface WonderStorageIntegrityVerifyOptions {
    validateValue?: boolean;
  
    context?: WonderStorageValidationContext;
  
    throwOnFailure?: boolean;
  }
  
  export interface WonderStorageIntegrityReport {
    valid: boolean;
  
    status: WonderStorageIntegrityStatus;
  
    checkedAt: Date;
  
    checksum:
      WonderStorageChecksumVerificationResult;
  
    validation:
      WonderStorageValidationResult | null;
  
    manifest:
      WonderStorageIntegrityManifest;
  
    issues: WonderStorageValidationIssue[];
  }
  
  // =========================================================
  // METADATA VALIDATION TYPES
  // =========================================================
  
  export interface WonderStorageMetadataValidationOptions {
    requireChecksum?: boolean;
  
    requireEtag?: boolean;
  
    allowZeroRevision?: boolean;
  
    maximumSizeBytes?: number | null;
  }
  
  export interface WonderStorageObjectShapeRule {
    required?: boolean;
  
    type?:
      | "string"
      | "number"
      | "boolean"
      | "object"
      | "array"
      | "date"
      | "unknown";
  
    minimumLength?: number;
  
    maximumLength?: number;
  
    minimum?: number;
  
    maximum?: number;
  
    validator?: (
      value: unknown
    ) => boolean;
  }
  
  export type WonderStorageObjectShape =
    Record<
      string,
      WonderStorageObjectShapeRule
    >;
  
  // =========================================================
  // CONSTANTS
  // =========================================================
  
  const WONDER_STORAGE_INTEGRITY_VERSION =
    1;
  
  const DEFAULT_CHECKSUM_ALGORITHM:
    WonderStorageChecksumAlgorithm =
    "sha256";
  
  const DEFAULT_CHECKSUM_ENCODING:
    BufferEncoding =
    "hex";
  
  // =========================================================
  // CHECKSUM SERVICE
  // =========================================================
  
  export class WonderStorageChecksumService {
    private readonly serializer:
      WonderStorageSerializer;
  
    constructor(
      serializer:
        WonderStorageSerializer =
        wonderStorageSerializer
    ) {
      this.serializer =
        serializer;
    }
  
    calculateValue(
      value: unknown,
      options:
        WonderStorageChecksumOptions = {}
    ): WonderStorageChecksumResult {
      const serialized =
        this.serializer.serialize(
          value
        );
  
      return this.calculateString(
        serialized.content,
        options
      );
    }
  
    calculateString(
      content: string,
      options:
        WonderStorageChecksumOptions = {}
    ): WonderStorageChecksumResult {
      if (
        typeof content !==
        "string"
      ) {
        throw new WonderStorageError(
          "WonderStorageIntegrity: checksum content must be a string.",
          {
            code:
              "STORAGE_VALIDATION_FAILED",
          }
        );
      }
  
      return this.calculateBytes(
        Buffer.from(
          content,
          "utf8"
        ),
        options
      );
    }
  
    calculateBytes(
      content:
        Uint8Array,
      options:
        WonderStorageChecksumOptions = {}
    ): WonderStorageChecksumResult {
      const algorithm =
        resolveChecksumAlgorithm(
          options.algorithm
        );

        const encoding:
        "hex" | "base64" | "base64url" =
        options.encoding ??
        "hex";
      
      const checksum: string =
        createHash(
          algorithm
        )
          .update(content)
          .digest(
            encoding
          );
  
      return {
        algorithm,
  
        checksum,
  
        bytes:
          content.byteLength,
  
        createdAt:
          new Date(),
      };
    }
  
    verifyValue(
      value: unknown,
      expectedChecksum: string,
      options:
        WonderStorageChecksumOptions = {}
    ): WonderStorageChecksumVerificationResult {
      const serialized =
        this.serializer.serialize(
          value
        );
  
      return this.verifyString(
        serialized.content,
        expectedChecksum,
        options
      );
    }
  
    verifyString(
      content: string,
      expectedChecksum: string,
      options:
        WonderStorageChecksumOptions = {}
    ): WonderStorageChecksumVerificationResult {
      return this.verifyBytes(
        Buffer.from(
          content,
          "utf8"
        ),
        expectedChecksum,
        options
      );
    }
  
    verifyBytes(
      content: Uint8Array,
      expectedChecksum: string,
      options:
        WonderStorageChecksumOptions = {}
    ): WonderStorageChecksumVerificationResult {
      const parsedExpected =
        parseExpectedChecksum(
          expectedChecksum,
          options.algorithm
        );
  
      const actual =
        this.calculateBytes(
          content,
          {
            ...options,
  
            algorithm:
              parsedExpected.algorithm,
  
            includeAlgorithmPrefix:
              false,
          }
        );
  
      return {
        valid:
          secureTextEqual(
            parsedExpected.checksum,
            actual.checksum
          ),
  
        algorithm:
          parsedExpected.algorithm,
  
        expectedChecksum:
          parsedExpected.checksum,
  
        actualChecksum:
          actual.checksum,
  
        checkedAt:
          new Date(),
      };
    }
  }
  
  // =========================================================
  // COMPOSITE VALIDATOR
  // =========================================================
  
  export class WonderCompositeStorageValidator<
    TValue = unknown
  > implements WonderStorageValidator<TValue> {
    readonly name:
      string;
  
    private readonly validators:
      WonderStorageValidator<TValue>[] =
      [];
  
    constructor(
      name =
        "Wonder Composite Storage Validator"
    ) {
      this.name =
        normaliseRequiredText(
          name,
          "name"
        );
    }
  
    add(
      validator:
        WonderStorageValidator<TValue>
    ): this {
      if (
        this.validators.some(
          (current) =>
            current.name ===
            validator.name
        )
      ) {
        throw new WonderStorageError(
          `WonderStorageIntegrity: validator "${validator.name}" is already registered.`,
          {
            code:
              "STORAGE_VALIDATION_FAILED",
          }
        );
      }
  
      this.validators.push(
        validator
      );
  
      return this;
    }
  
    remove(
      validatorName: string
    ): boolean {
      const cleanName =
        normaliseRequiredText(
          validatorName,
          "validatorName"
        );
  
      const index =
        this.validators.findIndex(
          (validator) =>
            validator.name ===
            cleanName
        );
  
      if (index < 0) {
        return false;
      }
  
      this.validators.splice(
        index,
        1
      );
  
      return true;
    }
  
    listValidatorNames(): string[] {
      return this.validators.map(
        (validator) =>
          validator.name
      );
    }
  
    async validate(
      value: TValue,
      context:
        WonderStorageValidationContext = {
          operation:
            "manual",
        }
    ): Promise<WonderStorageValidationResult> {
      const issues:
        WonderStorageValidationIssue[] =
        [];
  
      for (
        const validator of
          this.validators
      ) {
        try {
          const result =
            await validator.validate(
              value,
              context
            );
  
          issues.push(
            ...result.issues
          );
        } catch (error) {
          issues.push({
            code:
              "VALIDATOR_EXECUTION_FAILED",
  
            severity:
              "error",
  
            message:
              `Validator "${validator.name}" failed: ${getErrorMessage(
                error
              )}`,
  
            path: null,
  
            details: {
              validator:
                validator.name,
            },
          });
        }
      }
  
      return createValidationResult(
        issues
      );
    }
  }
  
  // =========================================================
  // FUNCTION VALIDATOR
  // =========================================================
  
  export class WonderFunctionStorageValidator<
    TValue = unknown
  > implements WonderStorageValidator<TValue> {
    readonly name:
      string;
  
    private readonly validationFunction:
      (
        value: TValue,
        context:
          WonderStorageValidationContext
      ) =>
        | WonderStorageValidationIssue[]
        | Promise<
            WonderStorageValidationIssue[]
          >;
  
    constructor(
      name: string,
      validationFunction:
        (
          value: TValue,
          context:
            WonderStorageValidationContext
        ) =>
          | WonderStorageValidationIssue[]
          | Promise<
              WonderStorageValidationIssue[]
            >
    ) {
      this.name =
        normaliseRequiredText(
          name,
          "name"
        );
  
      this.validationFunction =
        validationFunction;
    }
  
    async validate(
      value: TValue,
      context:
        WonderStorageValidationContext = {
          operation:
            "manual",
        }
    ): Promise<WonderStorageValidationResult> {
      const issues =
        await this.validationFunction(
          value,
          context
        );
  
      return createValidationResult(
        issues
      );
    }
  }
  
  // =========================================================
  // OBJECT SHAPE VALIDATOR
  // =========================================================
  
  export class WonderObjectShapeValidator
    implements WonderStorageValidator<unknown> {
    readonly name:
      string;
  
    private readonly shape:
      WonderStorageObjectShape;
  
    constructor(
      shape:
        WonderStorageObjectShape,
      name =
        "Wonder Object Shape Validator"
    ) {
      this.name =
        normaliseRequiredText(
          name,
          "name"
        );
  
      this.shape = {
        ...shape,
      };
    }
  
    validate(
      value: unknown
    ): WonderStorageValidationResult {
      const issues:
        WonderStorageValidationIssue[] =
        [];
  
      if (!isRecord(value)) {
        issues.push({
          code:
            "VALUE_NOT_OBJECT",
  
          severity:
            "error",
  
          message:
            "Stored value must be an object.",
  
          path: null,
  
          details: {
            actualType:
              describeValueType(
                value
              ),
          },
        });
  
        return createValidationResult(
          issues
        );
      }
  
      for (
        const [
          field,
          rule,
        ] of Object.entries(
          this.shape
        )
      ) {
        const fieldExists =
          Object.prototype
            .hasOwnProperty.call(
              value,
              field
            );
  
        const fieldValue =
          value[field];
  
        if (
          rule.required &&
          (
            !fieldExists ||
            fieldValue ===
              undefined ||
            fieldValue ===
              null
          )
        ) {
          issues.push({
            code:
              "REQUIRED_FIELD_MISSING",
  
            severity:
              "error",
  
            message:
              `Required field "${field}" is missing.`,
  
            path:
              field,
  
            details: {},
          });
  
          continue;
        }
  
        if (
          !fieldExists ||
          fieldValue ===
            undefined ||
          fieldValue ===
            null
        ) {
          continue;
        }
  
        if (
          rule.type &&
          rule.type !==
            "unknown" &&
          !matchesValueType(
            fieldValue,
            rule.type
          )
        ) {
          issues.push({
            code:
              "FIELD_TYPE_INVALID",
  
            severity:
              "error",
  
            message:
              `Field "${field}" must be of type "${rule.type}".`,
  
            path:
              field,
  
            details: {
              expectedType:
                rule.type,
  
              actualType:
                describeValueType(
                  fieldValue
                ),
            },
          });
  
          continue;
        }
  
        if (
          typeof fieldValue ===
            "string"
        ) {
          if (
            rule.minimumLength !==
              undefined &&
            fieldValue.length <
              rule.minimumLength
          ) {
            issues.push({
              code:
                "STRING_TOO_SHORT",
  
              severity:
                "error",
  
              message:
                `Field "${field}" is shorter than the minimum length.`,
  
              path:
                field,
  
              details: {
                minimumLength:
                  rule.minimumLength,
  
                actualLength:
                  fieldValue.length,
              },
            });
          }
  
          if (
            rule.maximumLength !==
              undefined &&
            fieldValue.length >
              rule.maximumLength
          ) {
            issues.push({
              code:
                "STRING_TOO_LONG",
  
              severity:
                "error",
  
              message:
                `Field "${field}" exceeds the maximum length.`,
  
              path:
                field,
  
              details: {
                maximumLength:
                  rule.maximumLength,
  
                actualLength:
                  fieldValue.length,
              },
            });
          }
        }
  
        if (
          typeof fieldValue ===
            "number"
        ) {
          if (
            rule.minimum !==
              undefined &&
            fieldValue <
              rule.minimum
          ) {
            issues.push({
              code:
                "NUMBER_BELOW_MINIMUM",
  
              severity:
                "error",
  
              message:
                `Field "${field}" is below the minimum value.`,
  
              path:
                field,
  
              details: {
                minimum:
                  rule.minimum,
  
                actual:
                  fieldValue,
              },
            });
          }
  
          if (
            rule.maximum !==
              undefined &&
            fieldValue >
              rule.maximum
          ) {
            issues.push({
              code:
                "NUMBER_ABOVE_MAXIMUM",
  
              severity:
                "error",
  
              message:
                `Field "${field}" exceeds the maximum value.`,
  
              path:
                field,
  
              details: {
                maximum:
                  rule.maximum,
  
                actual:
                  fieldValue,
              },
            });
          }
        }
  
        if (
          rule.validator &&
          !rule.validator(
            fieldValue
          )
        ) {
          issues.push({
            code:
              "CUSTOM_FIELD_VALIDATION_FAILED",
  
            severity:
              "error",
  
            message:
              `Field "${field}" failed custom validation.`,
  
            path:
              field,
  
            details: {},
          });
        }
      }
  
      return createValidationResult(
        issues
      );
    }
  }
  
  // =========================================================
  // METADATA VALIDATOR
  // =========================================================
  
  export class WonderStorageMetadataValidator
    implements WonderStorageValidator<WonderStorageMetadata> {
    readonly name =
      "Wonder Storage Metadata Validator";
  
    private readonly options:
      Required<
        Omit<
          WonderStorageMetadataValidationOptions,
          "maximumSizeBytes"
        >
      > & {
        maximumSizeBytes:
          number | null;
      };
  
    constructor(
      options:
        WonderStorageMetadataValidationOptions = {}
    ) {
      this.options = {
        requireChecksum:
          options.requireChecksum ??
          false,
  
        requireEtag:
          options.requireEtag ??
          false,
  
        allowZeroRevision:
          options.allowZeroRevision ??
          true,
  
        maximumSizeBytes:
          options.maximumSizeBytes ??
          null,
      };
    }
  
    validate(
      metadata:
        WonderStorageMetadata
    ): WonderStorageValidationResult {
      const issues:
        WonderStorageValidationIssue[] =
        [];
  
      if (
        !Number.isInteger(
          metadata.revision
        ) ||
        metadata.revision < 0
      ) {
        issues.push({
          code:
            "METADATA_REVISION_INVALID",
  
          severity:
            "error",
  
          message:
            "Storage revision must be a non-negative integer.",
  
          path:
            "revision",
  
          details: {
            revision:
              metadata.revision,
          },
        });
      }
  
      if (
        !this.options
          .allowZeroRevision &&
        metadata.revision ===
          0
      ) {
        issues.push({
          code:
            "METADATA_ZERO_REVISION_NOT_ALLOWED",
  
          severity:
            "error",
  
          message:
            "Storage revision must be greater than zero.",
  
          path:
            "revision",
  
          details: {},
        });
      }
  
      if (
        !isValidDate(
          metadata.createdAt
        )
      ) {
        issues.push({
          code:
            "METADATA_CREATED_AT_INVALID",
  
          severity:
            "error",
  
          message:
            "Storage createdAt must be a valid Date.",
  
          path:
            "createdAt",
  
          details: {},
        });
      }
  
      if (
        !isValidDate(
          metadata.updatedAt
        )
      ) {
        issues.push({
          code:
            "METADATA_UPDATED_AT_INVALID",
  
          severity:
            "error",
  
          message:
            "Storage updatedAt must be a valid Date.",
  
          path:
            "updatedAt",
  
          details: {},
        });
      }
  
      if (
        isValidDate(
          metadata.createdAt
        ) &&
        isValidDate(
          metadata.updatedAt
        ) &&
        metadata.updatedAt
          .getTime() <
          metadata.createdAt
            .getTime()
      ) {
        issues.push({
          code:
            "METADATA_DATE_ORDER_INVALID",
  
          severity:
            "error",
  
          message:
            "Storage updatedAt cannot be earlier than createdAt.",
  
          path:
            "updatedAt",
  
          details: {},
        });
      }
  
      if (
        this.options
          .requireChecksum &&
        !normaliseOptionalText(
          metadata.checksum
        )
      ) {
        issues.push({
          code:
            "METADATA_CHECKSUM_REQUIRED",
  
          severity:
            "error",
  
          message:
            "Storage checksum is required.",
  
          path:
            "checksum",
  
          details: {},
        });
      }
  
      if (
        this.options
          .requireEtag &&
        !normaliseOptionalText(
          metadata.etag
        )
      ) {
        issues.push({
          code:
            "METADATA_ETAG_REQUIRED",
  
          severity:
            "error",
  
          message:
            "Storage ETag is required.",
  
          path:
            "etag",
  
          details: {},
        });
      }
  
      if (
        metadata.sizeBytes !==
          undefined &&
        (
          !Number.isFinite(
            metadata.sizeBytes
          ) ||
          metadata.sizeBytes <
            0
        )
      ) {
        issues.push({
          code:
            "METADATA_SIZE_INVALID",
  
          severity:
            "error",
  
          message:
            "Storage sizeBytes must be a non-negative finite number.",
  
          path:
            "sizeBytes",
  
          details: {
            sizeBytes:
              metadata.sizeBytes,
          },
        });
      }
  
      if (
        metadata.sizeBytes !==
          undefined &&
        this.options
          .maximumSizeBytes !==
          null &&
        metadata.sizeBytes >
          this.options
            .maximumSizeBytes
      ) {
        issues.push({
          code:
            "METADATA_SIZE_LIMIT_EXCEEDED",
  
          severity:
            "error",
  
          message:
            "Stored value exceeds the configured size limit.",
  
          path:
            "sizeBytes",
  
          details: {
            maximumSizeBytes:
              this.options
                .maximumSizeBytes,
  
            actualSizeBytes:
              metadata.sizeBytes,
          },
        });
      }
  
      return createValidationResult(
        issues
      );
    }
  }
  
  // =========================================================
  // REVISION VALIDATOR
  // =========================================================
  
  export class WonderStorageRevisionValidator
    implements WonderStorageValidator<WonderStorageRevision> {
    readonly name =
      "Wonder Storage Revision Validator";
  
    validate(
      revision:
        WonderStorageRevision
    ): WonderStorageValidationResult {
      const issues:
        WonderStorageValidationIssue[] =
        [];
  
      if (
        !Number.isInteger(
          revision.revision
        ) ||
        revision.revision <
          0
      ) {
        issues.push({
          code:
            "REVISION_INVALID",
  
          severity:
            "error",
  
          message:
            "Revision must be a non-negative integer.",
  
          path:
            "revision",
  
          details: {
            revision:
              revision.revision,
          },
        });
      }
  
      if (
        revision.etag !==
          null &&
        normaliseOptionalText(
          revision.etag
        ) === null
      ) {
        issues.push({
          code:
            "REVISION_ETAG_INVALID",
  
          severity:
            "error",
  
          message:
            "Revision ETag cannot be empty.",
  
          path:
            "etag",
  
          details: {},
        });
      }
  
      if (
        !isValidDate(
          revision.updatedAt
        )
      ) {
        issues.push({
          code:
            "REVISION_UPDATED_AT_INVALID",
  
          severity:
            "error",
  
          message:
            "Revision updatedAt must be a valid Date.",
  
          path:
            "updatedAt",
  
          details: {},
        });
      }
  
      return createValidationResult(
        issues
      );
    }
  }
  
  // =========================================================
  // INTEGRITY MANAGER
  // =========================================================
  
  export class WonderStorageIntegrityManager<
    TValue = unknown
  > {
    private readonly checksumService:
      WonderStorageChecksumService;
  
    private readonly validator:
      WonderStorageValidator<TValue> | null;
  
    constructor(
      options: {
        serializer?:
          WonderStorageSerializer;
  
        checksumService?:
          WonderStorageChecksumService;
  
        validator?:
          WonderStorageValidator<TValue>;
      } = {}
    ) {
      this.checksumService =
        options.checksumService ??
        new WonderStorageChecksumService(
          options.serializer ??
          wonderStorageSerializer
        );
  
      this.validator =
        options.validator ??
        null;
    }
  
    createManifest(
      value: TValue,
      options:
        WonderStorageIntegrityCreateOptions = {}
    ): WonderStorageIntegrityManifest {
      const checksum =
        this.checksumService
          .calculateValue(
            value,
            {
              algorithm:
                options.algorithm ??
                DEFAULT_CHECKSUM_ALGORITHM,
            }
          );
  
      return {
        version:
          WONDER_STORAGE_INTEGRITY_VERSION,
  
        algorithm:
          checksum.algorithm,
  
        checksum:
          checksum.checksum,
  
        sizeBytes:
          checksum.bytes,
  
        revision:
          normaliseNullableRevision(
            options.revision
          ),
  
        etag:
          normaliseOptionalText(
            options.etag
          ),
  
        createdAt:
          new Date(),
  
        metadata: {
          ...(options.metadata ??
            {}),
        },
      };
    }
  
    async verify(
      value: TValue,
      manifest:
        WonderStorageIntegrityManifest,
      options:
        WonderStorageIntegrityVerifyOptions = {}
    ): Promise<WonderStorageIntegrityReport> {
      validateIntegrityManifest(
        manifest
      );
  
      const checksum =
        this.checksumService
          .verifyValue(
            value,
            manifest.checksum,
            {
              algorithm:
                manifest.algorithm,
            }
          );
  
      const validation =
        options.validateValue ===
          false ||
        this.validator ===
          null
          ? null
          : await this.validator
              .validate(
                value,
                options.context ??
                {
                  operation:
                    "manual",
                }
              );
  
      const issues:
        WonderStorageValidationIssue[] =
        [];
  
      if (!checksum.valid) {
        issues.push({
          code:
            "CHECKSUM_MISMATCH",
  
          severity:
            "error",
  
          message:
            "Stored value checksum does not match the integrity manifest.",
  
          path: null,
  
          details: {
            algorithm:
              checksum.algorithm,
  
            expectedChecksum:
              checksum
                .expectedChecksum,
  
            actualChecksum:
              checksum
                .actualChecksum,
          },
        });
      }
  
      if (validation) {
        issues.push(
          ...validation.issues
        );
      }
  
      const valid =
        checksum.valid &&
        (
          validation?.valid ??
          true
        );
  
      const report:
        WonderStorageIntegrityReport = {
        valid,
  
        status:
          valid
            ? "valid"
            : "invalid",
  
        checkedAt:
          new Date(),
  
        checksum,
  
        validation,
  
        manifest:
          cloneIntegrityManifest(
            manifest
          ),
  
        issues,
      };
  
      if (
        !report.valid &&
        options.throwOnFailure
      ) {
        throw new WonderStorageError(
          "WonderStorageIntegrity: integrity verification failed.",
          {
            code:
              checksum.valid
                ? "STORAGE_VALIDATION_FAILED"
                : "STORAGE_CHECKSUM_MISMATCH",
  
            retryable:
              false,
  
            details: {
              issues:
                report.issues.map(
                  cloneValidationIssue
                ),
            },
          }
        );
      }
  
      return report;
    }
  }
  
  // =========================================================
  // VALIDATION HELPERS
  // =========================================================
  
  export function createValidationIssue(
    input: {
      code: string;
  
      severity?:
        WonderStorageValidationSeverity;
  
      message: string;
  
      path?: string | null;
  
      details?: Record<
        string,
        unknown
      >;
    }
  ): WonderStorageValidationIssue {
    return {
      code:
        normaliseRequiredText(
          input.code,
          "code"
        ),
  
      severity:
        input.severity ??
        "error",
  
      message:
        normaliseRequiredText(
          input.message,
          "message"
        ),
  
      path:
        normaliseOptionalText(
          input.path
        ),
  
      details: {
        ...(input.details ??
          {}),
      },
    };
  }
  
  export function createValidationResult(
    issues:
      readonly WonderStorageValidationIssue[]
  ): WonderStorageValidationResult {
    const clonedIssues =
      issues.map(
        cloneValidationIssue
      );
  
    const errorCount =
      clonedIssues.filter(
        (issue) =>
          issue.severity ===
          "error"
      ).length;
  
    const warningCount =
      clonedIssues.filter(
        (issue) =>
          issue.severity ===
          "warning"
      ).length;
  
    const infoCount =
      clonedIssues.filter(
        (issue) =>
          issue.severity ===
          "info"
      ).length;
  
    return {
      valid:
        errorCount === 0,
  
      checkedAt:
        new Date(),
  
      issues:
        clonedIssues,
  
      errorCount,
  
      warningCount,
  
      infoCount,
    };
  }
  
  export function mergeValidationResults(
    results:
      readonly WonderStorageValidationResult[]
  ): WonderStorageValidationResult {
    return createValidationResult(
      results.flatMap(
        (result) =>
          result.issues
      )
    );
  }
  
  export function assertStorageValidation(
    result:
      WonderStorageValidationResult,
    message =
      "WonderStorage validation failed."
  ): void {
    if (result.valid) {
      return;
    }
  
    throw new WonderStorageError(
      message,
      {
        code:
          "STORAGE_VALIDATION_FAILED",
  
        retryable:
          false,
  
        details: {
          issues:
            result.issues.map(
              cloneValidationIssue
            ),
        },
      }
    );
  }
  
  // =========================================================
  // MANIFEST VALIDATION
  // =========================================================
  
  export function validateIntegrityManifest(
    manifest:
      WonderStorageIntegrityManifest
  ): void {
    if (
      manifest.version !==
      WONDER_STORAGE_INTEGRITY_VERSION
    ) {
      throw new WonderStorageError(
        `WonderStorageIntegrity: unsupported manifest version "${manifest.version}".`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    if (
      !isWonderStorageChecksumAlgorithm(
        manifest.algorithm
      )
    ) {
      throw new WonderStorageError(
        "WonderStorageIntegrity: manifest checksum algorithm is invalid.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    if (
      normaliseOptionalText(
        manifest.checksum
      ) === null
    ) {
      throw new WonderStorageError(
        "WonderStorageIntegrity: manifest checksum is required.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    if (
      !Number.isInteger(
        manifest.sizeBytes
      ) ||
      manifest.sizeBytes <
        0
    ) {
      throw new WonderStorageError(
        "WonderStorageIntegrity: manifest sizeBytes is invalid.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    if (
      manifest.revision !==
        null &&
      (
        !Number.isInteger(
          manifest.revision
        ) ||
        manifest.revision <
          0
      )
    ) {
      throw new WonderStorageError(
        "WonderStorageIntegrity: manifest revision is invalid.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    if (
      !isValidDate(
        manifest.createdAt
      )
    ) {
      throw new WonderStorageError(
        "WonderStorageIntegrity: manifest createdAt is invalid.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  export function cloneValidationIssue(
    issue:
      WonderStorageValidationIssue
  ): WonderStorageValidationIssue {
    return {
      code:
        issue.code,
  
      severity:
        issue.severity,
  
      message:
        issue.message,
  
      path:
        issue.path,
  
      details: {
        ...issue.details,
      },
    };
  }
  
  export function cloneValidationResult(
    result:
      WonderStorageValidationResult
  ): WonderStorageValidationResult {
    return {
      valid:
        result.valid,
  
      checkedAt:
        new Date(
          result.checkedAt
            .getTime()
        ),
  
      issues:
        result.issues.map(
          cloneValidationIssue
        ),
  
      errorCount:
        result.errorCount,
  
      warningCount:
        result.warningCount,
  
      infoCount:
        result.infoCount,
    };
  }
  
  export function cloneIntegrityManifest(
    manifest:
      WonderStorageIntegrityManifest
  ): WonderStorageIntegrityManifest {
    return {
      ...manifest,
  
      createdAt:
        new Date(
          manifest.createdAt
            .getTime()
        ),
  
      metadata: {
        ...manifest.metadata,
      },
    };
  }
  
  // =========================================================
  // TYPE GUARDS
  // =========================================================
  
  export function isWonderStorageChecksumAlgorithm(
    value: unknown
  ): value is WonderStorageChecksumAlgorithm {
    return (
      value === "sha256" ||
      value === "sha384" ||
      value === "sha512"
    );
  }
  
  export function isWonderStorageValidationSeverity(
    value: unknown
  ): value is WonderStorageValidationSeverity {
    return (
      value === "info" ||
      value === "warning" ||
      value === "error"
    );
  }
  
  export function isWonderStorageIntegrityStatus(
    value: unknown
  ): value is WonderStorageIntegrityStatus {
    return (
      value === "valid" ||
      value === "invalid" ||
      value === "unchecked"
    );
  }
  
  // =========================================================
  // INTERNAL HELPERS
  // =========================================================
  
  function resolveChecksumAlgorithm(
    value:
      WonderStorageChecksumAlgorithm | undefined
  ): WonderStorageChecksumAlgorithm {
    if (value === undefined) {
      return DEFAULT_CHECKSUM_ALGORITHM;
    }
  
    if (
      !isWonderStorageChecksumAlgorithm(
        value
      )
    ) {
      throw new WonderStorageError(
        `WonderStorageIntegrity: unsupported checksum algorithm "${String(
          value
        )}".`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
    }
  
    return value;
  }
  
  function parseExpectedChecksum(
    value: string,
    fallbackAlgorithm:
      WonderStorageChecksumAlgorithm | undefined
  ): {
    algorithm:
      WonderStorageChecksumAlgorithm;
  
    checksum: string;
  } {
    const cleanValue =
      normaliseRequiredText(
        value,
        "expectedChecksum"
      );
  
    const separatorIndex =
      cleanValue.indexOf(
        ":"
      );
  
    if (
      separatorIndex >
      0
    ) {
      const possibleAlgorithm =
        cleanValue.slice(
          0,
          separatorIndex
        );
  
      const checksum =
        cleanValue.slice(
          separatorIndex + 1
        );
  
      if (
        isWonderStorageChecksumAlgorithm(
          possibleAlgorithm
        )
      ) {
        return {
          algorithm:
            possibleAlgorithm,
  
          checksum:
            normaliseRequiredText(
              checksum,
              "checksum"
            ),
        };
      }
    }
  
    return {
      algorithm:
        resolveChecksumAlgorithm(
          fallbackAlgorithm
        ),
  
      checksum:
        cleanValue,
    };
  }
  
  function secureTextEqual(
    first: string,
    second: string
  ): boolean {
    const firstBuffer =
      Buffer.from(
        first,
        "utf8"
      );
  
    const secondBuffer =
      Buffer.from(
        second,
        "utf8"
      );
  
    if (
      firstBuffer.length !==
      secondBuffer.length
    ) {
      return false;
    }
  
    return timingSafeEqual(
      firstBuffer,
      secondBuffer
    );
  }
  
  function matchesValueType(
    value: unknown,
    expectedType:
      WonderStorageObjectShapeRule[
        "type"
      ]
  ): boolean {
    switch (expectedType) {
      case "string":
        return (
          typeof value ===
          "string"
        );
  
      case "number":
        return (
          typeof value ===
            "number" &&
          Number.isFinite(value)
        );
  
      case "boolean":
        return (
          typeof value ===
          "boolean"
        );
  
      case "object":
        return isRecord(
          value
        );
  
      case "array":
        return Array.isArray(
          value
        );
  
      case "date":
        return isValidDate(
          value
        );
  
      case "unknown":
      case undefined:
        return true;
    }
  }
  
  function describeValueType(
    value: unknown
  ): string {
    if (value === null) {
      return "null";
    }
  
    if (
      Array.isArray(value)
    ) {
      return "array";
    }
  
    if (
      value instanceof Date
    ) {
      return "date";
    }
  
    return typeof value;
  }
  
  function normaliseNullableRevision(
    value:
      number | null | undefined
  ): number | null {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }
  
    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new WonderStorageError(
        "WonderStorageIntegrity: revision must be a non-negative integer.",
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
      );
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
      throw new WonderStorageError(
        `WonderStorageIntegrity: "${fieldName}" must be a string.`,
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
        `WonderStorageIntegrity: "${fieldName}" is required.`,
        {
          code:
            "STORAGE_VALIDATION_FAILED",
        }
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
  
  function isValidDate(
    value: unknown
  ): value is Date {
    return (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime()
      )
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
  // DEFAULT SERVICES
  // =========================================================
  
  export const wonderStorageChecksumService =
    new WonderStorageChecksumService();
  
  export const wonderStorageIntegrityManager =
    new WonderStorageIntegrityManager();