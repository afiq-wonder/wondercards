export type WonderCLICommand =
  | "prompt"
  | "validate"
  | "publish"
  | "pipeline";

export type WonderCLIExportFormat =
  | "json"
  | "typescript";

export type WonderCLIOverwriteMode =
  | "never"
  | "replace"
  | "timestamp";

export interface WonderCLIQualityConfig {
  minimumOverallScore: number;

  minimumCriticalScore: number;

  duplicateThreshold: number;

  warningsAreErrors: boolean;
}

export interface WonderCLIPathConfig {
  rootDirectory: string;

  briefsDirectory: string;

  generatedDirectory: string;

  draftsDirectory: string;

  reportsDirectory: string;

  catalogsDirectory: string;

  promptsDirectory: string;
}

export interface WonderCLIFileConfig {
  briefFile: string;

  generatedFile: string;

  draftFile: string;

  validationReportFile: string;

  catalogFile: string;

  manifestFile: string;

  promptFile: string;
}

export interface WonderCLIPublishConfig {
  packageName: string;

  packageDescription: string;

  version: number;

  destination: string;

  exportFormat: WonderCLIExportFormat;

  exportName: string;

  requireCompleteImport: boolean;

  requireApprovedDrafts: boolean;

  notes: string;
}

export interface WonderCLIExecutionConfig {
  command: WonderCLICommand;

  batchSize: number;

  autoApproveValidDrafts: boolean;

  stopOnValidationFailure: boolean;

  overwriteMode: WonderCLIOverwriteMode;

  prettyPrint: boolean;

  verbose: boolean;
}

export interface WonderCLIConfig {
  version: number;

  paths: WonderCLIPathConfig;

  files: WonderCLIFileConfig;

  quality: WonderCLIQualityConfig;

  publish: WonderCLIPublishConfig;

  execution: WonderCLIExecutionConfig;
}

export interface WonderCLIConfigOverrides {
  version?: number;

  paths?: Partial<WonderCLIPathConfig>;

  files?: Partial<WonderCLIFileConfig>;

  quality?: Partial<WonderCLIQualityConfig>;

  publish?: Partial<WonderCLIPublishConfig>;

  execution?: Partial<WonderCLIExecutionConfig>;
}

const DEFAULT_CONFIG_VERSION = 1;

const DEFAULT_BATCH_SIZE = 25;

const MIN_BATCH_SIZE = 1;

const MAX_BATCH_SIZE = 500;

const DEFAULT_MINIMUM_OVERALL_SCORE = 7.5;

const DEFAULT_MINIMUM_CRITICAL_SCORE = 7;

const DEFAULT_DUPLICATE_THRESHOLD = 0.82;

const DEFAULT_ROOT_DIRECTORY =
  "wonder-studio";

const DEFAULT_PATHS: WonderCLIPathConfig = {
  rootDirectory:
    DEFAULT_ROOT_DIRECTORY,

  briefsDirectory:
    `${DEFAULT_ROOT_DIRECTORY}/briefs`,

  generatedDirectory:
    `${DEFAULT_ROOT_DIRECTORY}/generated`,

  draftsDirectory:
    `${DEFAULT_ROOT_DIRECTORY}/drafts`,

  reportsDirectory:
    `${DEFAULT_ROOT_DIRECTORY}/reports`,

  catalogsDirectory:
    `${DEFAULT_ROOT_DIRECTORY}/catalogs`,

  promptsDirectory:
    `${DEFAULT_ROOT_DIRECTORY}/prompts`,
};

const DEFAULT_FILES: WonderCLIFileConfig = {
  briefFile:
    "content-brief.json",

  generatedFile:
    "generated-content.json",

  draftFile:
    "studio-batch.json",

  validationReportFile:
    "validation-report.json",

  catalogFile:
    "wonder-catalog.json",

  manifestFile:
    "publish-manifest.json",

  promptFile:
    "wonder-prompt.txt",
};

const DEFAULT_QUALITY: WonderCLIQualityConfig = {
  minimumOverallScore:
    DEFAULT_MINIMUM_OVERALL_SCORE,

  minimumCriticalScore:
    DEFAULT_MINIMUM_CRITICAL_SCORE,

  duplicateThreshold:
    DEFAULT_DUPLICATE_THRESHOLD,

  warningsAreErrors: false,
};

const DEFAULT_PUBLISH: WonderCLIPublishConfig = {
  packageName:
    "WonderOS Content Catalog",

  packageDescription:
    "Validated educational content produced by Wonder Studio.",

  version: 1,

  destination:
    "wonder-runtime-catalog",

  exportFormat: "json",

  exportName:
    "WONDER_CATALOG",

  requireCompleteImport: true,

  requireApprovedDrafts: true,

  notes: "",
};

const DEFAULT_EXECUTION: WonderCLIExecutionConfig = {
  command: "pipeline",

  batchSize:
    DEFAULT_BATCH_SIZE,

  autoApproveValidDrafts: true,

  stopOnValidationFailure: true,

  overwriteMode: "timestamp",

  prettyPrint: true,

  verbose: true,
};

/**
 * Returns a complete, validated Wonder CLI configuration.
 */
export function createWonderCLIConfig(
  overrides: WonderCLIConfigOverrides = {}
): WonderCLIConfig {
  const paths =
    resolvePaths(
      overrides.paths
    );

  const config: WonderCLIConfig = {
    version:
      normalisePositiveInteger(
        overrides.version,
        DEFAULT_CONFIG_VERSION
      ),

    paths,

    files:
      resolveFiles(
        overrides.files
      ),

    quality:
      resolveQuality(
        overrides.quality
      ),

    publish:
      resolvePublish(
        overrides.publish
      ),

    execution:
      resolveExecution(
        overrides.execution
      ),
  };

  validateWonderCLIConfig(
    config
  );

  return cloneWonderCLIConfig(
    config
  );
}

/**
 * Throws when a CLI configuration is invalid.
 */
export function validateWonderCLIConfig(
  config: WonderCLIConfig
): void {
  const errors =
    getWonderCLIConfigErrors(
      config
    );

  if (
    errors.length > 0
  ) {
    throw new Error(
      [
        "WonderCLIConfig: invalid configuration.",
        ...errors,
      ].join(" ")
    );
  }
}

/**
 * Returns all configuration validation errors.
 */
export function getWonderCLIConfigErrors(
  config: WonderCLIConfig
): string[] {
  const errors: string[] = [];

  if (
    !Number.isInteger(
      config.version
    ) ||
    config.version < 1
  ) {
    errors.push(
      "Config version must be a positive integer."
    );
  }

  validatePathConfig(
    config.paths,
    errors
  );

  validateFileConfig(
    config.files,
    errors
  );

  validateQualityConfig(
    config.quality,
    errors
  );

  validatePublishConfig(
    config.publish,
    errors
  );

  validateExecutionConfig(
    config.execution,
    errors
  );

  return errors;
}

/**
 * Creates a defensive copy of the configuration.
 */
export function cloneWonderCLIConfig(
  config: WonderCLIConfig
): WonderCLIConfig {
  return {
    version:
      config.version,

    paths: {
      ...config.paths,
    },

    files: {
      ...config.files,
    },

    quality: {
      ...config.quality,
    },

    publish: {
      ...config.publish,
    },

    execution: {
      ...config.execution,
    },
  };
}

/**
 * Converts an unknown JSON value into a valid configuration.
 */
export function parseWonderCLIConfig(
  value: unknown
): WonderCLIConfig {
  if (
    !isRecord(value)
  ) {
    throw new Error(
      "WonderCLIConfig: configuration must be an object."
    );
  }

  return createWonderCLIConfig({
    version:
      readOptionalNumber(
        value.version
      ),

    paths:
      readPathOverrides(
        value.paths
      ),

    files:
      readFileOverrides(
        value.files
      ),

    quality:
      readQualityOverrides(
        value.quality
      ),

    publish:
      readPublishOverrides(
        value.publish
      ),

    execution:
      readExecutionOverrides(
        value.execution
      ),
  });
}

/**
 * Serialises configuration into stable JSON.
 */
export function serialiseWonderCLIConfig(
  config: WonderCLIConfig,
  pretty = true
): string {
  validateWonderCLIConfig(
    config
  );

  return JSON.stringify(
    cloneWonderCLIConfig(
      config
    ),
    null,
    pretty ? 2 : undefined
  );
}

/**
 * Creates default configuration JSON for a new workspace.
 */
export function createDefaultWonderCLIConfigJSON(
  pretty = true
): string {
  return serialiseWonderCLIConfig(
    createWonderCLIConfig(),
    pretty
  );
}

// =========================================================
// RESOLUTION
// =========================================================

function resolvePaths(
  overrides:
    | Partial<WonderCLIPathConfig>
    | undefined
): WonderCLIPathConfig {
  const rootDirectory =
    normalisePath(
      overrides?.rootDirectory,
      DEFAULT_PATHS.rootDirectory
    );

  return {
    rootDirectory,

    briefsDirectory:
      normalisePath(
        overrides?.briefsDirectory,
        `${rootDirectory}/briefs`
      ),

    generatedDirectory:
      normalisePath(
        overrides?.generatedDirectory,
        `${rootDirectory}/generated`
      ),

    draftsDirectory:
      normalisePath(
        overrides?.draftsDirectory,
        `${rootDirectory}/drafts`
      ),

    reportsDirectory:
      normalisePath(
        overrides?.reportsDirectory,
        `${rootDirectory}/reports`
      ),

    catalogsDirectory:
      normalisePath(
        overrides?.catalogsDirectory,
        `${rootDirectory}/catalogs`
      ),

    promptsDirectory:
      normalisePath(
        overrides?.promptsDirectory,
        `${rootDirectory}/prompts`
      ),
  };
}

function resolveFiles(
  overrides:
    | Partial<WonderCLIFileConfig>
    | undefined
): WonderCLIFileConfig {
  return {
    briefFile:
      normaliseFileName(
        overrides?.briefFile,
        DEFAULT_FILES.briefFile
      ),

    generatedFile:
      normaliseFileName(
        overrides?.generatedFile,
        DEFAULT_FILES.generatedFile
      ),

    draftFile:
      normaliseFileName(
        overrides?.draftFile,
        DEFAULT_FILES.draftFile
      ),

    validationReportFile:
      normaliseFileName(
        overrides?.validationReportFile,
        DEFAULT_FILES.validationReportFile
      ),

    catalogFile:
      normaliseFileName(
        overrides?.catalogFile,
        DEFAULT_FILES.catalogFile
      ),

    manifestFile:
      normaliseFileName(
        overrides?.manifestFile,
        DEFAULT_FILES.manifestFile
      ),

    promptFile:
      normaliseFileName(
        overrides?.promptFile,
        DEFAULT_FILES.promptFile
      ),
  };
}

function resolveQuality(
  overrides:
    | Partial<WonderCLIQualityConfig>
    | undefined
): WonderCLIQualityConfig {
  return {
    minimumOverallScore:
      clampNumber(
        overrides?.minimumOverallScore ??
          DEFAULT_QUALITY.minimumOverallScore,
        0,
        10
      ),

    minimumCriticalScore:
      clampNumber(
        overrides?.minimumCriticalScore ??
          DEFAULT_QUALITY.minimumCriticalScore,
        0,
        10
      ),

    duplicateThreshold:
      clampNumber(
        overrides?.duplicateThreshold ??
          DEFAULT_QUALITY.duplicateThreshold,
        0,
        1
      ),

    warningsAreErrors:
      overrides?.warningsAreErrors ??
      DEFAULT_QUALITY.warningsAreErrors,
  };
}

function resolvePublish(
  overrides:
    | Partial<WonderCLIPublishConfig>
    | undefined
): WonderCLIPublishConfig {
  return {
    packageName:
      normaliseText(
        overrides?.packageName,
        DEFAULT_PUBLISH.packageName
      ),

    packageDescription:
      normaliseText(
        overrides?.packageDescription,
        DEFAULT_PUBLISH.packageDescription
      ),

    version:
      normalisePositiveInteger(
        overrides?.version,
        DEFAULT_PUBLISH.version
      ),

    destination:
      normaliseText(
        overrides?.destination,
        DEFAULT_PUBLISH.destination
      ),

    exportFormat:
      isExportFormat(
        overrides?.exportFormat
      )
        ? overrides.exportFormat
        : DEFAULT_PUBLISH.exportFormat,

    exportName:
      normaliseText(
        overrides?.exportName,
        DEFAULT_PUBLISH.exportName
      ),

    requireCompleteImport:
      overrides?.requireCompleteImport ??
      DEFAULT_PUBLISH.requireCompleteImport,

    requireApprovedDrafts:
      overrides?.requireApprovedDrafts ??
      DEFAULT_PUBLISH.requireApprovedDrafts,

    notes:
      normaliseOptionalText(
        overrides?.notes
      ) ?? "",
  };
}

function resolveExecution(
  overrides:
    | Partial<WonderCLIExecutionConfig>
    | undefined
): WonderCLIExecutionConfig {
  return {
    command:
      isCLICommand(
        overrides?.command
      )
        ? overrides.command
        : DEFAULT_EXECUTION.command,

    batchSize:
      clampInteger(
        overrides?.batchSize ??
          DEFAULT_EXECUTION.batchSize,
        MIN_BATCH_SIZE,
        MAX_BATCH_SIZE
      ),

    autoApproveValidDrafts:
      overrides?.autoApproveValidDrafts ??
      DEFAULT_EXECUTION.autoApproveValidDrafts,

    stopOnValidationFailure:
      overrides?.stopOnValidationFailure ??
      DEFAULT_EXECUTION.stopOnValidationFailure,

    overwriteMode:
      isOverwriteMode(
        overrides?.overwriteMode
      )
        ? overrides.overwriteMode
        : DEFAULT_EXECUTION.overwriteMode,

    prettyPrint:
      overrides?.prettyPrint ??
      DEFAULT_EXECUTION.prettyPrint,

    verbose:
      overrides?.verbose ??
      DEFAULT_EXECUTION.verbose,
  };
}

// =========================================================
// VALIDATION
// =========================================================

function validatePathConfig(
  paths: WonderCLIPathConfig,
  errors: string[]
): void {
  for (
    const [
      key,
      value,
    ] of Object.entries(paths)
  ) {
    if (
      !hasText(value)
    ) {
      errors.push(
        `Path "${key}" is required.`
      );
    }

    if (
      containsUnsafePathSegment(
        value
      )
    ) {
      errors.push(
        `Path "${key}" contains an unsafe segment.`
      );
    }
  }
}

function validateFileConfig(
  files: WonderCLIFileConfig,
  errors: string[]
): void {
  for (
    const [
      key,
      value,
    ] of Object.entries(files)
  ) {
    if (
      !hasText(value)
    ) {
      errors.push(
        `File name "${key}" is required.`
      );
    }

    if (
      value.includes("/") ||
      value.includes("\\")
    ) {
      errors.push(
        `File name "${key}" must not contain directory separators.`
      );
    }
  }
}

function validateQualityConfig(
  quality: WonderCLIQualityConfig,
  errors: string[]
): void {
  if (
    !isNumberBetween(
      quality.minimumOverallScore,
      0,
      10
    )
  ) {
    errors.push(
      "minimumOverallScore must be between 0 and 10."
    );
  }

  if (
    !isNumberBetween(
      quality.minimumCriticalScore,
      0,
      10
    )
  ) {
    errors.push(
      "minimumCriticalScore must be between 0 and 10."
    );
  }

  if (
    !isNumberBetween(
      quality.duplicateThreshold,
      0,
      1
    )
  ) {
    errors.push(
      "duplicateThreshold must be between 0 and 1."
    );
  }
}

function validatePublishConfig(
  publish: WonderCLIPublishConfig,
  errors: string[]
): void {
  if (
    !hasText(
      publish.packageName
    )
  ) {
    errors.push(
      "Publish packageName is required."
    );
  }

  if (
    !hasText(
      publish.destination
    )
  ) {
    errors.push(
      "Publish destination is required."
    );
  }

  if (
    !Number.isInteger(
      publish.version
    ) ||
    publish.version < 1
  ) {
    errors.push(
      "Publish version must be a positive integer."
    );
  }

  if (
    !isExportFormat(
      publish.exportFormat
    )
  ) {
    errors.push(
      "Publish exportFormat is invalid."
    );
  }
}

function validateExecutionConfig(
  execution: WonderCLIExecutionConfig,
  errors: string[]
): void {
  if (
    !isCLICommand(
      execution.command
    )
  ) {
    errors.push(
      "Execution command is invalid."
    );
  }

  if (
    !Number.isInteger(
      execution.batchSize
    ) ||
    execution.batchSize <
      MIN_BATCH_SIZE ||
    execution.batchSize >
      MAX_BATCH_SIZE
  ) {
    errors.push(
      `Execution batchSize must be between ${MIN_BATCH_SIZE} and ${MAX_BATCH_SIZE}.`
    );
  }

  if (
    !isOverwriteMode(
      execution.overwriteMode
    )
  ) {
    errors.push(
      "Execution overwriteMode is invalid."
    );
  }
}

// =========================================================
// JSON READERS
// =========================================================

function readPathOverrides(
  value: unknown
): Partial<WonderCLIPathConfig> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    rootDirectory:
      readOptionalString(
        value.rootDirectory
      ),

    briefsDirectory:
      readOptionalString(
        value.briefsDirectory
      ),

    generatedDirectory:
      readOptionalString(
        value.generatedDirectory
      ),

    draftsDirectory:
      readOptionalString(
        value.draftsDirectory
      ),

    reportsDirectory:
      readOptionalString(
        value.reportsDirectory
      ),

    catalogsDirectory:
      readOptionalString(
        value.catalogsDirectory
      ),

    promptsDirectory:
      readOptionalString(
        value.promptsDirectory
      ),
  };
}

function readFileOverrides(
  value: unknown
): Partial<WonderCLIFileConfig> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    briefFile:
      readOptionalString(
        value.briefFile
      ),

    generatedFile:
      readOptionalString(
        value.generatedFile
      ),

    draftFile:
      readOptionalString(
        value.draftFile
      ),

    validationReportFile:
      readOptionalString(
        value.validationReportFile
      ),

    catalogFile:
      readOptionalString(
        value.catalogFile
      ),

    manifestFile:
      readOptionalString(
        value.manifestFile
      ),

    promptFile:
      readOptionalString(
        value.promptFile
      ),
  };
}

function readQualityOverrides(
  value: unknown
): Partial<WonderCLIQualityConfig> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    minimumOverallScore:
      readOptionalNumber(
        value.minimumOverallScore
      ),

    minimumCriticalScore:
      readOptionalNumber(
        value.minimumCriticalScore
      ),

    duplicateThreshold:
      readOptionalNumber(
        value.duplicateThreshold
      ),

    warningsAreErrors:
      readOptionalBoolean(
        value.warningsAreErrors
      ),
  };
}

function readPublishOverrides(
  value: unknown
): Partial<WonderCLIPublishConfig> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    packageName:
      readOptionalString(
        value.packageName
      ),

    packageDescription:
      readOptionalString(
        value.packageDescription
      ),

    version:
      readOptionalNumber(
        value.version
      ),

    destination:
      readOptionalString(
        value.destination
      ),

    exportFormat:
      isExportFormat(
        value.exportFormat
      )
        ? value.exportFormat
        : undefined,

    exportName:
      readOptionalString(
        value.exportName
      ),

    requireCompleteImport:
      readOptionalBoolean(
        value.requireCompleteImport
      ),

    requireApprovedDrafts:
      readOptionalBoolean(
        value.requireApprovedDrafts
      ),

    notes:
      readOptionalString(
        value.notes
      ),
  };
}

function readExecutionOverrides(
  value: unknown
): Partial<WonderCLIExecutionConfig> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    command:
      isCLICommand(
        value.command
      )
        ? value.command
        : undefined,

    batchSize:
      readOptionalNumber(
        value.batchSize
      ),

    autoApproveValidDrafts:
      readOptionalBoolean(
        value.autoApproveValidDrafts
      ),

    stopOnValidationFailure:
      readOptionalBoolean(
        value.stopOnValidationFailure
      ),

    overwriteMode:
      isOverwriteMode(
        value.overwriteMode
      )
        ? value.overwriteMode
        : undefined,

    prettyPrint:
      readOptionalBoolean(
        value.prettyPrint
      ),

    verbose:
      readOptionalBoolean(
        value.verbose
      ),
  };
}

// =========================================================
// NORMALISATION
// =========================================================

function normalisePath(
  value:
    | string
    | undefined,
  fallback: string
): string {
  const cleaned =
    normaliseText(
      value,
      fallback
    )
      .replace(
        /\\/g,
        "/"
      )
      .replace(
        /\/+/g,
        "/"
      )
      .replace(
        /\/$/,
        ""
      );

  return cleaned.length > 0
    ? cleaned
    : fallback;
}

function normaliseFileName(
  value:
    | string
    | undefined,
  fallback: string
): string {
  return normaliseText(
    value,
    fallback
  )
    .replace(
      /[\\/]/g,
      "-"
    )
    .trim();
}

function normaliseText(
  value:
    | string
    | undefined,
  fallback: string
): string {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  const cleaned =
    value.trim();

  return cleaned.length > 0
    ? cleaned
    : fallback;
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

function normalisePositiveInteger(
  value:
    | number
    | undefined,
  fallback: number
): number {
  if (
    value === undefined ||
    !Number.isFinite(value) ||
    value < 1
  ) {
    return fallback;
  }

  return Math.floor(value);
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

function clampNumber(
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
      value
    )
  );
}
function containsUnsafePathSegment(
    path: string
  ): boolean {
    const normalised =
      path.replace(
        /\\/g,
        "/"
      );
  
    return (
      normalised.includes("../") ||
      normalised.includes("..\\") ||
      normalised.startsWith("..") ||
      normalised.includes("\0")
    );
  }
// =========================================================
// TYPE GUARDS
// =========================================================

function isCLICommand(
  value: unknown
): value is WonderCLICommand {
  return (
    value === "prompt" ||
    value === "validate" ||
    value === "publish" ||
    value === "pipeline"
  );
}

function isExportFormat(
  value: unknown
): value is WonderCLIExportFormat {
  return (
    value === "json" ||
    value === "typescript"
  );
}

function isOverwriteMode(
  value: unknown
): value is WonderCLIOverwriteMode {
  return (
    value === "never" ||
    value === "replace" ||
    value === "timestamp"
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

function hasText(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isNumberBetween(
  value: number,
  minimum: number,
  maximum: number
): boolean {
  return (
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

// =========================================================
// SAFE READERS
// =========================================================

function readOptionalString(
  value: unknown
): string | undefined {
  return typeof value ===
    "string"
    ? value
    : undefined;
}

function readOptionalNumber(
  value: unknown
): number | undefined {
  return typeof value ===
      "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function readOptionalBoolean(
  value: unknown
): boolean | undefined {
  return typeof value ===
    "boolean"
    ? value
    : undefined;
}

export const defaultWonderCLIConfig =
  createWonderCLIConfig();

export default defaultWonderCLIConfig;