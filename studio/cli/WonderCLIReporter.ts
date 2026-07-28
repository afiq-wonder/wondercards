import type {
    WonderBatchImportResult,
  } from "../import/WonderContentImporter";
  
  import type {
    WonderPublishResult,
    WonderStudioExport,
  } from "../publish/WonderPublisher";
  
  import type {
    WonderBatchValidationSummary,
  } from "../validation/WonderContentValidator";
  
  import type {
    WonderStudioBatch,
    WonderStudioDraft,
    WonderStudioStatistics,
    WonderStudioValidationIssue,
  } from "../types/WonderStudioTypes";
  
  import type {
    WonderCLICommand,
    WonderCLIConfig,
  } from "./WonderCLIConfig";
  
  export type WonderCLIReportLevel =
    | "info"
    | "success"
    | "warning"
    | "error"
    | "debug";
  
  export interface WonderCLIReportEntry {
    id: string;
  
    timestamp: Date;
  
    level: WonderCLIReportLevel;
  
    message: string;
  
    details: string[];
  }
  
  export interface WonderCLIReporterOptions {
    verbose?: boolean;
  
    useColours?: boolean;
  
    showTimestamp?: boolean;
  
    showDetails?: boolean;
  
    silent?: boolean;
  }
  
  export interface WonderCLICommandSummary {
    command: WonderCLICommand;
  
    success: boolean;
  
    startedAt: Date;
  
    completedAt: Date;
  
    durationMilliseconds: number;
  
    messages: string[];
  
    errors: string[];
  
    warnings: string[];
  }
  
  export interface WonderCLIValidationReport {
    generatedAt: Date;
  
    success: boolean;
  
    totalDrafts: number;
  
    validDrafts: number;
  
    invalidDrafts: number;
  
    averageOverallScore: number;
  
    issueCount: number;
  
    errorCount: number;
  
    warningCount: number;
  
    infoCount: number;
  
    drafts: WonderCLIDraftValidationReport[];
  }
  
  export interface WonderCLIDraftValidationReport {
    draftId: string;
  
    status: WonderStudioDraft["status"];
  
    valid: boolean;
  
    overallScore: number;
  
    safetyScore: number;
  
    ageMatchScore: number;
  
    educationalValueScore: number;
  
    creativityScore: number;
  
    clarityScore: number;
  
    emotionalQualityScore: number;
  
    offlinePlayValueScore: number;
  
    issues: WonderStudioValidationIssue[];
  }
  
  export interface WonderCLIImportReport {
    generatedAt: Date;
  
    success: boolean;
  
    batchId: string;
  
    totalDrafts: number;
  
    totalImported: number;
  
    totalRejected: number;
  
    importedStories: number;
  
    importedMissions: number;
  
    importedAdventures: number;
  
    rejectedDraftIds: string[];
  
    errors: string[];
  }
  
  export interface WonderCLIPublishReport {
    generatedAt: Date;
  
    success: boolean;
  
    packageId: string | null;
  
    catalogName: string | null;
  
    version: number | null;
  
    totalStories: number;
  
    totalMissions: number;
  
    totalAdventures: number;
  
    manifestStatus: string;
  
    errors: string[];
  
    warnings: string[];
  }
  
  export interface WonderCLIPipelineReport {
    generatedAt: Date;
  
    success: boolean;
  
    batchId: string;
  
    statistics: WonderStudioStatistics;
  
    validation: WonderCLIValidationReport;
  
    importResult: WonderCLIImportReport | null;
  
    publication: WonderCLIPublishReport | null;
  
    export: {
      filename: string;
  
      format: string;
  
      mimeType: string;
  
      bytes: number;
    } | null;
  }
  
  interface ResolvedReporterOptions {
    verbose: boolean;
  
    useColours: boolean;
  
    showTimestamp: boolean;
  
    showDetails: boolean;
  
    silent: boolean;
  }
  
  const ANSI_RESET = "\u001b[0m";
  
  const ANSI_COLOURS = {
    info: "\u001b[36m",
  
    success: "\u001b[32m",
  
    warning: "\u001b[33m",
  
    error: "\u001b[31m",
  
    debug: "\u001b[90m",
  
    heading: "\u001b[35m",
  
    bold: "\u001b[1m",
  } as const;
  
  /**
   * Produces consistent terminal output and serialisable reports
   * for WonderOS CLI commands.
   *
   * Responsibilities:
   *
   * - terminal status messages
   * - validation summaries
   * - import summaries
   * - publication summaries
   * - complete pipeline reports
   * - human-readable command output
   * - JSON-safe report objects
   */
  export class WonderCLIReporter {
    private readonly options: ResolvedReporterOptions;
  
    private readonly entries: WonderCLIReportEntry[] = [];
  
    constructor(
      options: WonderCLIReporterOptions = {}
    ) {
      this.options =
        resolveReporterOptions(
          options
        );
    }
  
    // =========================================================
    // BASIC LOGGING
    // =========================================================
  
    info(
      message: string,
      details: readonly string[] = []
    ): WonderCLIReportEntry {
      return this.report(
        "info",
        message,
        details
      );
    }
  
    success(
      message: string,
      details: readonly string[] = []
    ): WonderCLIReportEntry {
      return this.report(
        "success",
        message,
        details
      );
    }
  
    warning(
      message: string,
      details: readonly string[] = []
    ): WonderCLIReportEntry {
      return this.report(
        "warning",
        message,
        details
      );
    }
  
    error(
      message: string,
      details: readonly string[] = []
    ): WonderCLIReportEntry {
      return this.report(
        "error",
        message,
        details
      );
    }
  
    debug(
      message: string,
      details: readonly string[] = []
    ): WonderCLIReportEntry {
      if (!this.options.verbose) {
        return createReportEntry(
          "debug",
          message,
          details
        );
      }
  
      return this.report(
        "debug",
        message,
        details
      );
    }
  
    heading(
      title: string
    ): void {
      if (this.options.silent) {
        return;
      }
  
      const line =
        "─".repeat(
          Math.max(
            12,
            Math.min(
              72,
              title.length + 8
            )
          )
        );
  
      this.writeLine("");
  
      this.writeLine(
        colourise(
          line,
          ANSI_COLOURS.heading,
          this.options.useColours
        )
      );
  
      this.writeLine(
        colourise(
          `  ${title}`,
          `${ANSI_COLOURS.bold}${ANSI_COLOURS.heading}`,
          this.options.useColours
        )
      );
  
      this.writeLine(
        colourise(
          line,
          ANSI_COLOURS.heading,
          this.options.useColours
        )
      );
    }
  
    divider(): void {
      if (this.options.silent) {
        return;
      }
  
      this.writeLine(
        "─".repeat(56)
      );
    }
  
    blankLine(): void {
      if (this.options.silent) {
        return;
      }
  
      this.writeLine("");
    }
  
    // =========================================================
    // COMMAND STATUS
    // =========================================================
  
    commandStarted(
      command: WonderCLICommand
    ): Date {
      const startedAt =
        new Date();
  
      this.heading(
        `WonderOS CLI · ${command}`
      );
  
      this.info(
        `Starting "${command}" command.`
      );
  
      return startedAt;
    }
  
    commandCompleted(
      command: WonderCLICommand,
      startedAt: Date,
      success: boolean,
      errors: readonly string[] = [],
      warnings: readonly string[] = []
    ): WonderCLICommandSummary {
      const completedAt =
        new Date();
  
      const durationMilliseconds =
        Math.max(
          0,
          completedAt.getTime() -
            startedAt.getTime()
        );
  
      if (success) {
        this.success(
          `"${command}" completed successfully.`,
          [
            `Duration: ${formatDuration(
              durationMilliseconds
            )}`,
          ]
        );
      } else {
        this.error(
          `"${command}" failed.`,
          [
            `Duration: ${formatDuration(
              durationMilliseconds
            )}`,
            ...errors,
          ]
        );
      }
  
      for (const warning of warnings) {
        this.warning(warning);
      }
  
      return {
        command,
  
        success,
  
        startedAt:
          new Date(
            startedAt.getTime()
          ),
  
        completedAt:
          new Date(
            completedAt.getTime()
          ),
  
        durationMilliseconds,
  
        messages:
          this.entries
            .filter(
              (entry) =>
                entry.level ===
                  "info" ||
                entry.level ===
                  "success"
            )
            .map(
              (entry) =>
                entry.message
            ),
  
        errors:
          uniqueStrings([
            ...errors,
  
            ...this.entries
              .filter(
                (entry) =>
                  entry.level ===
                  "error"
              )
              .map(
                (entry) =>
                  entry.message
              ),
          ]),
  
        warnings:
          uniqueStrings([
            ...warnings,
  
            ...this.entries
              .filter(
                (entry) =>
                  entry.level ===
                  "warning"
              )
              .map(
                (entry) =>
                  entry.message
              ),
          ]),
      };
    }
  
    // =========================================================
    // CONFIGURATION
    // =========================================================
  
    reportConfig(
      config: WonderCLIConfig
    ): void {
      if (!this.options.verbose) {
        return;
      }
  
      this.heading(
        "CLI Configuration"
      );
  
      this.keyValue(
        "Command",
        config.execution.command
      );
  
      this.keyValue(
        "Root",
        config.paths.rootDirectory
      );
  
      this.keyValue(
        "Batch size",
        config.execution.batchSize
      );
  
      this.keyValue(
        "Minimum overall score",
        config.quality
          .minimumOverallScore
      );
  
      this.keyValue(
        "Minimum critical score",
        config.quality
          .minimumCriticalScore
      );
  
      this.keyValue(
        "Export format",
        config.publish.exportFormat
      );
  
      this.keyValue(
        "Overwrite mode",
        config.execution
          .overwriteMode
      );
    }
  
    // =========================================================
    // PROMPT
    // =========================================================
  
    reportPromptCreated(
      promptPath: string,
      expectedQuantity: number
    ): void {
      this.success(
        "Prompt created.",
        [
          `Output: ${promptPath}`,
  
          `Expected items: ${expectedQuantity}`,
        ]
      );
    }
  
    // =========================================================
    // VALIDATION
    // =========================================================
  
    createValidationReport(
      batch: WonderStudioBatch,
      summary: WonderBatchValidationSummary
    ): WonderCLIValidationReport {
      const draftMap =
        new Map(
          batch.drafts.map(
            (draft) => [
              draft.id,
              draft,
            ]
          )
        );
  
      const drafts =
        summary.records.map(
          (
            record
          ): WonderCLIDraftValidationReport => {
            const storedDraft =
              draftMap.get(
                record.draft.id
              );
  
            return {
              draftId:
                record.draft.id,
  
              status:
                storedDraft?.status ??
                record.draft.status,
  
              valid:
                record.result.valid,
  
              overallScore:
                record.result.scores
                  .overall,
  
              safetyScore:
                record.result.scores
                  .safety,
  
              ageMatchScore:
                record.result.scores
                  .ageMatch,
  
              educationalValueScore:
                record.result.scores
                  .educationalValue,
  
              creativityScore:
                record.result.scores
                  .creativity,
  
              clarityScore:
                record.result.scores
                  .clarity,
  
              emotionalQualityScore:
                record.result.scores
                  .emotionalQuality,
  
              offlinePlayValueScore:
                record.result.scores
                  .offlinePlayValue,
  
              issues:
                record.result.issues.map(
                  cloneValidationIssue
                ),
            };
          }
        );
  
      const issues =
        drafts.flatMap(
          (draft) =>
            draft.issues
        );
  
      return {
        generatedAt:
          new Date(),
  
        success:
          summary.invalidDrafts ===
          0,
  
        totalDrafts:
          summary.totalDrafts,
  
        validDrafts:
          summary.validDrafts,
  
        invalidDrafts:
          summary.invalidDrafts,
  
        averageOverallScore:
          summary.averageOverallScore,
  
        issueCount:
          issues.length,
  
        errorCount:
          countIssuesBySeverity(
            issues,
            "error"
          ),
  
        warningCount:
          countIssuesBySeverity(
            issues,
            "warning"
          ),
  
        infoCount:
          countIssuesBySeverity(
            issues,
            "info"
          ),
  
        drafts,
      };
    }
  
    reportValidation(
      report: WonderCLIValidationReport
    ): void {
      this.heading(
        "Content Validation"
      );
  
      this.keyValue(
        "Total drafts",
        report.totalDrafts
      );
  
      this.keyValue(
        "Valid",
        report.validDrafts
      );
  
      this.keyValue(
        "Invalid",
        report.invalidDrafts
      );
  
      this.keyValue(
        "Average score",
        `${report.averageOverallScore}/10`
      );
  
      this.keyValue(
        "Errors",
        report.errorCount
      );
  
      this.keyValue(
        "Warnings",
        report.warningCount
      );
  
      if (report.success) {
        this.success(
          `${report.validDrafts} draft(s) passed validation.`
        );
      } else {
        this.error(
          `${report.invalidDrafts} draft(s) failed validation.`
        );
      }
  
      if (
        this.options.showDetails
      ) {
        this.reportDraftIssues(
          report
        );
      }
    }
  
    // =========================================================
    // IMPORT
    // =========================================================
  
    createImportReport(
      result: WonderBatchImportResult
    ): WonderCLIImportReport {
      return {
        generatedAt:
          new Date(),
  
        success:
          result.success,
  
        batchId:
          result.batchId,
  
        totalDrafts:
          result.totalDrafts,
  
        totalImported:
          result.totalImported,
  
        totalRejected:
          result.totalRejected,
  
        importedStories:
          result.stories.length,
  
        importedMissions:
          result.missions.length,
  
        importedAdventures:
          result.adventures.length,
  
        rejectedDraftIds: [
          ...result.rejectedDraftIds,
        ],
  
        errors: [
          ...result.errors,
        ],
      };
    }
  
    reportImport(
      report: WonderCLIImportReport
    ): void {
      this.heading(
        "Content Import"
      );
  
      this.keyValue(
        "Batch",
        report.batchId
      );
  
      this.keyValue(
        "Imported",
        report.totalImported
      );
  
      this.keyValue(
        "Rejected",
        report.totalRejected
      );
  
      this.keyValue(
        "Stories",
        report.importedStories
      );
  
      this.keyValue(
        "Missions",
        report.importedMissions
      );
  
      this.keyValue(
        "Adventures",
        report.importedAdventures
      );
  
      if (report.success) {
        this.success(
          `${report.totalImported} draft(s) imported.`
        );
      } else {
        this.error(
          "One or more drafts failed import.",
          report.errors
        );
      }
    }
  
    // =========================================================
    // PUBLICATION
    // =========================================================
  
    createPublishReport(
      result: WonderPublishResult
    ): WonderCLIPublishReport {
      return {
        generatedAt:
          new Date(),
  
        success:
          result.success,
  
        packageId:
          result.catalog?.id ??
          result.package?.id ??
          null,
  
        catalogName:
          result.catalog?.name ??
          result.package?.name ??
          null,
  
        version:
          result.catalog?.version ??
          result.package?.version ??
          null,
  
        totalStories:
          result.catalog
            ?.statistics
            .totalRuntimeStories ??
          0,
  
        totalMissions:
          result.catalog
            ?.statistics
            .totalRuntimeMissions ??
          0,
  
        totalAdventures:
          result.catalog
            ?.statistics
            .totalAdventures ??
          0,
  
        manifestStatus:
          result.manifest.status,
  
        errors: [
          ...result.errors,
        ],
  
        warnings: [
          ...result.warnings,
        ],
      };
    }
  
    reportPublication(
      report: WonderCLIPublishReport
    ): void {
      this.heading(
        "Catalog Publication"
      );
  
      this.keyValue(
        "Package",
        report.packageId ??
          "Not created"
      );
  
      this.keyValue(
        "Name",
        report.catalogName ??
          "Not created"
      );
  
      this.keyValue(
        "Version",
        report.version ??
          "-"
      );
  
      this.keyValue(
        "Stories",
        report.totalStories
      );
  
      this.keyValue(
        "Missions",
        report.totalMissions
      );
  
      this.keyValue(
        "Adventures",
        report.totalAdventures
      );
  
      this.keyValue(
        "Manifest",
        report.manifestStatus
      );
  
      if (report.success) {
        this.success(
          "Catalog published successfully."
        );
      } else {
        this.error(
          "Catalog publication failed.",
          report.errors
        );
      }
  
      for (
        const warning of
          report.warnings
      ) {
        this.warning(warning);
      }
    }
  
    reportExport(
      studioExport: WonderStudioExport,
      outputPath: string
    ): void {
      this.success(
        "Catalog export created.",
        [
          `Filename: ${studioExport.filename}`,
  
          `Format: ${studioExport.format}`,
  
          `Output: ${outputPath}`,
  
          `Size: ${formatBytes(
            Buffer.byteLength(
              studioExport.content,
              "utf8"
            )
          )}`,
        ]
      );
    }
  
    // =========================================================
    // PIPELINE
    // =========================================================
  
    createPipelineReport({
      batch,
      statistics,
      validation,
      importResult,
      publication,
      studioExport,
    }: {
      batch: WonderStudioBatch;
  
      statistics: WonderStudioStatistics;
  
      validation: WonderCLIValidationReport;
  
      importResult:
        | WonderBatchImportResult
        | null;
  
      publication:
        | WonderPublishResult
        | null;
  
      studioExport:
        | WonderStudioExport
        | null;
    }): WonderCLIPipelineReport {
      return {
        generatedAt:
          new Date(),
  
        success:
          validation.validDrafts > 0 &&
          (
            importResult?.totalImported ??
            0
          ) > 0 &&
          publication?.success ===
            true,
  
        batchId:
          batch.id,
  
        statistics: {
          ...statistics,
        },
  
        validation,
  
        importResult:
          importResult
            ? this.createImportReport(
                importResult
              )
            : null,
  
        publication:
          publication
            ? this.createPublishReport(
                publication
              )
            : null,
  
        export:
          studioExport
            ? {
                filename:
                  studioExport.filename,
  
                format:
                  studioExport.format,
  
                mimeType:
                  studioExport.mimeType,
  
                bytes:
                  Buffer.byteLength(
                    studioExport.content,
                    "utf8"
                  ),
              }
            : null,
      };
    }
  
    reportPipeline(
      report: WonderCLIPipelineReport
    ): void {
      this.heading(
        "WonderOS Pipeline Summary"
      );
  
      this.keyValue(
        "Batch",
        report.batchId
      );
  
      this.keyValue(
        "Drafts",
        report.statistics
          .totalDrafts
      );
  
      this.keyValue(
        "Validation pass rate",
        `${report.statistics.validationPassRate}%`
      );
  
      this.keyValue(
        "Average quality",
        `${report.statistics.averageQualityScore}/10`
      );
  
      this.keyValue(
        "Approved",
        report.statistics
          .approvedDrafts
      );
  
      this.keyValue(
        "Published",
        report.statistics
          .publishedDrafts
      );
  
      this.keyValue(
        "Publication rate",
        `${report.statistics.publicationRate}%`
      );
  
      if (report.export) {
        this.keyValue(
          "Export",
          report.export.filename
        );
  
        this.keyValue(
          "Export size",
          formatBytes(
            report.export.bytes
          )
        );
      }
  
      if (report.success) {
        this.success(
          "WonderOS content pipeline completed."
        );
      } else {
        this.error(
          "WonderOS content pipeline did not complete successfully."
        );
      }
    }
  
    // =========================================================
    // ENTRIES
    // =========================================================
  
    getEntries(): WonderCLIReportEntry[] {
      return this.entries.map(
        cloneReportEntry
      );
    }
  
    clear(): void {
      this.entries.length = 0;
    }
  
    toJSON(
      pretty = true
    ): string {
      return JSON.stringify(
        this.entries.map(
          serialiseReportEntry
        ),
        null,
        pretty ? 2 : undefined
      );
    }
  
    // =========================================================
    // INTERNAL REPORTING
    // =========================================================
  
    private report(
      level: WonderCLIReportLevel,
      message: string,
      details: readonly string[]
    ): WonderCLIReportEntry {
      const entry =
        createReportEntry(
          level,
          message,
          details
        );
  
      this.entries.push(
        entry
      );
  
      if (
        !this.options.silent
      ) {
        this.printEntry(entry);
      }
  
      return cloneReportEntry(
        entry
      );
    }
  
    private printEntry(
      entry: WonderCLIReportEntry
    ): void {
      const prefix =
        getLevelPrefix(
          entry.level
        );
  
      const timestamp =
        this.options.showTimestamp
          ? `${formatTime(
              entry.timestamp
            )} `
          : "";
  
      const line =
        `${timestamp}${prefix} ${entry.message}`;
  
      this.writeLine(
        colourise(
          line,
          getLevelColour(
            entry.level
          ),
          this.options.useColours
        )
      );
  
      if (
        this.options.showDetails
      ) {
        for (
          const detail of
            entry.details
        ) {
          this.writeLine(
            `    ${detail}`
          );
        }
      }
    }
  
    private reportDraftIssues(
      report: WonderCLIValidationReport
    ): void {
      for (
        const draft of
          report.drafts
      ) {
        if (
          draft.issues.length === 0
        ) {
          continue;
        }
  
        this.writeLine("");
  
        this.writeLine(
          `  ${draft.draftId} · ${draft.overallScore}/10`
        );
  
        for (
          const issue of
            draft.issues
        ) {
          const prefix =
            getLevelPrefix(
              issue.severity
            );
  
          this.writeLine(
            `    ${prefix} ${issue.message}`
          );
  
          if (
            issue.suggestion
          ) {
            this.writeLine(
              `      Suggestion: ${issue.suggestion}`
            );
          }
        }
      }
    }
  
    private keyValue(
      key: string,
      value:
        | string
        | number
        | boolean
    ): void {
      if (this.options.silent) {
        return;
      }
  
      this.writeLine(
        `  ${key.padEnd(
          24,
          " "
        )}${String(value)}`
      );
    }
  
    private writeLine(
      value: string
    ): void {
      console.log(value);
    }
  }
  
  // =========================================================
  // REPORT CREATION
  // =========================================================
  
  function createReportEntry(
    level: WonderCLIReportLevel,
    message: string,
    details: readonly string[]
  ): WonderCLIReportEntry {
    const timestamp =
      new Date();
  
    const cleanMessage =
      normaliseRequiredText(
        message,
        "CLI report message"
      );
  
    const cleanDetails =
      uniqueStrings(details);
  
    const source = [
      level,
      cleanMessage,
      timestamp.toISOString(),
      cleanDetails.join("|"),
    ].join(":");
  
    return {
      id:
        `wonder-cli-report-${hashText(
          source
        )
          .toString(36)
          .padStart(
            7,
            "0"
          )}`,
  
      timestamp,
  
      level,
  
      message:
        cleanMessage,
  
      details:
        cleanDetails,
    };
  }
  
  // =========================================================
  // ISSUE HELPERS
  // =========================================================
  
  function countIssuesBySeverity(
    issues:
      readonly WonderStudioValidationIssue[],
    severity:
      WonderStudioValidationIssue["severity"]
  ): number {
    return issues.filter(
      (issue) =>
        issue.severity ===
        severity
    ).length;
  }
  
  function cloneValidationIssue(
    issue: WonderStudioValidationIssue
  ): WonderStudioValidationIssue {
    return {
      ...issue,
    };
  }
  
  // =========================================================
  // CLONING AND SERIALISATION
  // =========================================================
  
  function cloneReportEntry(
    entry: WonderCLIReportEntry
  ): WonderCLIReportEntry {
    return {
      ...entry,
  
      timestamp:
        new Date(
          entry.timestamp.getTime()
        ),
  
      details: [
        ...entry.details,
      ],
    };
  }
  
  function serialiseReportEntry(
    entry: WonderCLIReportEntry
  ): Record<string, unknown> {
    return {
      id:
        entry.id,
  
      timestamp:
        entry.timestamp.toISOString(),
  
      level:
        entry.level,
  
      message:
        entry.message,
  
      details: [
        ...entry.details,
      ],
    };
  }
  
  // =========================================================
  // TERMINAL FORMATTING
  // =========================================================
  
  function getLevelPrefix(
    level:
      | WonderCLIReportLevel
      | WonderStudioValidationIssue["severity"]
  ): string {
    switch (level) {
      case "success":
        return "✓";
  
      case "warning":
        return "⚠";
  
      case "error":
        return "✗";
  
      case "debug":
        return "·";
  
      case "info":
        return "ℹ";
  
      default:
        return "•";
    }
  }
  
  function getLevelColour(
    level: WonderCLIReportLevel
  ): string {
    switch (level) {
      case "success":
        return ANSI_COLOURS.success;
  
      case "warning":
        return ANSI_COLOURS.warning;
  
      case "error":
        return ANSI_COLOURS.error;
  
      case "debug":
        return ANSI_COLOURS.debug;
  
      case "info":
        return ANSI_COLOURS.info;
  
      default:
        return "";
    }
  }
  
  function colourise(
    value: string,
    colour: string,
    enabled: boolean
  ): string {
    if (
      !enabled ||
      colour.length === 0
    ) {
      return value;
    }
  
    return `${colour}${value}${ANSI_RESET}`;
  }
  
  function formatTime(
    date: Date
  ): string {
    return [
      String(
        date.getHours()
      ).padStart(2, "0"),
  
      String(
        date.getMinutes()
      ).padStart(2, "0"),
  
      String(
        date.getSeconds()
      ).padStart(2, "0"),
    ].join(":");
  }
  
  function formatDuration(
    milliseconds: number
  ): string {
    if (milliseconds < 1000) {
      return `${milliseconds} ms`;
    }
  
    const seconds =
      milliseconds / 1000;
  
    if (seconds < 60) {
      return `${roundNumber(
        seconds,
        2
      )} s`;
    }
  
    const minutes =
      Math.floor(
        seconds / 60
      );
  
    const remainingSeconds =
      Math.floor(
        seconds % 60
      );
  
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  function formatBytes(
    bytes: number
  ): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
  
    const kilobytes =
      bytes / 1024;
  
    if (kilobytes < 1024) {
      return `${roundNumber(
        kilobytes,
        1
      )} KB`;
    }
  
    const megabytes =
      kilobytes / 1024;
  
    return `${roundNumber(
      megabytes,
      1
    )} MB`;
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolveReporterOptions(
    options: WonderCLIReporterOptions
  ): ResolvedReporterOptions {
    return {
      verbose:
        options.verbose ??
        true,
  
      useColours:
        options.useColours ??
        Boolean(
          process.stdout.isTTY
        ),
  
      showTimestamp:
        options.showTimestamp ??
        false,
  
      showDetails:
        options.showDetails ??
        true,
  
      silent:
        options.silent ??
        false,
    };
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new Error(
        `WonderCLIReporter: "${fieldName}" is required.`
      );
    }
  
    return cleaned;
  }
  
  function uniqueStrings(
    values: readonly string[]
  ): string[] {
    return Array.from(
      new Set(
        values
          .map(
            (value) =>
              value.trim()
          )
          .filter(
            (value) =>
              value.length > 0
          )
      )
    );
  }
  
  function roundNumber(
    value: number,
    decimalPlaces: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
  
    const safeDecimalPlaces =
      Math.max(
        0,
        Math.floor(
          decimalPlaces
        )
      );
  
    const multiplier =
      10 **
      safeDecimalPlaces;
  
    return (
      Math.round(
        value * multiplier
      ) / multiplier
    );
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
  
  export const wonderCLIReporter =
    new WonderCLIReporter();
  
  export default WonderCLIReporter;