import {
    join,
  } from "node:path";
  
  import {
    wonderOSEventBus,
  } from "@/core/WonderEvents";
  
  import type {
    WonderOSEventBus,
  } from "@/core/WonderEvents";

  import {
    WonderStudio,
    wonderStudio,
  } from "../WonderStudio";
  
  import type {
  WonderStudioBatch,
  WonderStudioContentType,
  WonderStudioDraft,
  WonderStudioDraftStatus,
  WonderStudioGenerationRequest,
  WonderStudioPrompt,
  WonderStudioValidationResult,
} from "../types/WonderStudioTypes";
  
  import {
    cloneWonderCLIConfig,
    createWonderCLIConfig,
  } from "./WonderCLIConfig";
  
  import type {
    WonderCLICommand,
    WonderCLIConfig,
    WonderCLIConfigOverrides,
  } from "./WonderCLIConfig";
  
  import {
    WonderCLIFileSystem,
  } from "./WonderCLIFileSystem";
  
  import type {
    WonderCLIWorkspaceResult,
    WonderCLIWriteResult,
  } from "./WonderCLIFileSystem";
  
  import {
    WonderCLIReporter,
  } from "./WonderCLIReporter";
  
  import type {
    WonderCLICommandSummary,
    WonderCLIImportReport,
    WonderCLIPipelineReport,
    WonderCLIPublishReport,
    WonderCLIValidationReport,
  } from "./WonderCLIReporter";
  
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
  
  export interface WonderCLICommandResult {
    command: WonderCLICommand;
  
    success: boolean;
  
    summary: WonderCLICommandSummary;
  
    errors: string[];
  
    warnings: string[];
  }
  
  export interface WonderCLIPromptCommandResult
    extends WonderCLICommandResult {
    batch: WonderStudioBatch | null;
  
    promptPath: string | null;
  
    batchPath: string | null;
  
    promptCount: number;
  }
  
  export interface WonderCLIValidateCommandResult
    extends WonderCLICommandResult {
    batch: WonderStudioBatch | null;
  
    validationSummary:
      | WonderBatchValidationSummary
      | null;
  
    validationReport:
      | WonderCLIValidationReport
      | null;
  
    batchPath: string | null;
  
    reportPath: string | null;
  }
  
  export interface WonderCLIPublishCommandResult
    extends WonderCLICommandResult {
    batch: WonderStudioBatch | null;
  
    importResult:
      | WonderBatchImportResult
      | null;
  
    importReport:
      | WonderCLIImportReport
      | null;
  
    publishResult:
      | WonderPublishResult
      | null;
  
    publishReport:
      | WonderCLIPublishReport
      | null;
  
    studioExport:
      | WonderStudioExport
      | null;
  
    catalogPath: string | null;
  
    manifestPath: string | null;
  
    batchPath: string | null;
  }
  
  export interface WonderCLIPipelineCommandResult
    extends WonderCLICommandResult {
    batch: WonderStudioBatch | null;
  
    validationSummary:
      | WonderBatchValidationSummary
      | null;
  
    importResult:
      | WonderBatchImportResult
      | null;
  
    publishResult:
      | WonderPublishResult
      | null;
  
    studioExport:
      | WonderStudioExport
      | null;
  
    pipelineReport:
      | WonderCLIPipelineReport
      | null;
  
    promptPath: string | null;
  
    batchPath: string | null;
  
    reportPath: string | null;
  
    catalogPath: string | null;
  
    manifestPath: string | null;
  }
  
  export interface WonderCLIInitialiseResult {
    config: WonderCLIConfig;
  
    workspace: WonderCLIWorkspaceResult;
  }
  
  export type WonderStudioCLIResult =
    | WonderCLIPromptCommandResult
    | WonderCLIValidateCommandResult
    | WonderCLIPublishCommandResult
    | WonderCLIPipelineCommandResult;
  
  /**
   * Main command-line orchestrator for WonderOS Studio.
   *
   * Supported commands:
   *
   * prompt
   *   Reads a content brief and generates AI prompts.
   *
   * validate
   *   Reads generated content or an existing Studio batch,
   *   validates every draft, and writes a validation report.
   *
   * publish
   *   Imports approved drafts and publishes a runtime catalog.
   *
   * pipeline
   *   Runs prompt, ingestion, validation, approval, import,
   *   publication, and catalog export.
   *
   * AI generation remains external during development.
   * The CLI prepares prompts and consumes generated JSON.
   */
  export class WonderStudioCLI {
    private readonly config: WonderCLIConfig;
  
    private readonly studio: WonderStudio;
  
    private readonly fileSystem: WonderCLIFileSystem;
  
    private readonly reporter: WonderCLIReporter;
  
    private readonly eventBus: WonderOSEventBus;
  
    constructor(
        config:
          | WonderCLIConfig
          | WonderCLIConfigOverrides =
          createWonderCLIConfig(),
      
        workingDirectory =
          process.cwd(),
      
        studioInstance: WonderStudio =
          wonderStudio,
      
        reporter?: WonderCLIReporter,
      
        eventBus: WonderOSEventBus =
          wonderOSEventBus
      ) {
        
      this.config =
        isCompleteCLIConfig(config)
          ? cloneWonderCLIConfig(config)
          : createWonderCLIConfig(config);
  
      this.studio =
        studioInstance;
  
      this.fileSystem =
        new WonderCLIFileSystem(
          this.config,
          workingDirectory
        );
  
      this.reporter =
        reporter ??
        new WonderCLIReporter({
          verbose:
            this.config.execution.verbose,
  
          showDetails: true,
  
          showTimestamp: false,
        });

        this.eventBus =
  eventBus;
    }
  
    // =========================================================
    // ACCESS
    // =========================================================
  
    getConfig(): WonderCLIConfig {
      return cloneWonderCLIConfig(
        this.config
      );
    }
  
    getFileSystem(): WonderCLIFileSystem {
      return this.fileSystem;
    }
  
    getReporter(): WonderCLIReporter {
      return this.reporter;
    }
  
    // =========================================================
    // INITIALISE
    // =========================================================
  
    async initialise(): Promise<WonderCLIInitialiseResult> {
      const workspace =
        await this.fileSystem.initialiseWorkspace();
  
      this.reporter.debug(
        "WonderOS workspace initialised.",
        workspace.directories
      );
  
      return {
        config:
          this.getConfig(),
  
        workspace,
      };
    }
  
    // =========================================================
    // COMMAND ROUTER
    // =========================================================
  
    async run(
      command: WonderCLICommand =
        this.config.execution.command
    ): Promise<WonderStudioCLIResult> {
      switch (command) {
        case "prompt":
          return this.runPrompt();
  
        case "validate":
          return this.runValidate();
  
        case "publish":
          return this.runPublish();
  
        case "pipeline":
          return this.runPipeline();
  
        default:
          return assertNever(command);
      }
    }
  
    // =========================================================
    // PROMPT COMMAND
    // =========================================================
  
    async runPrompt(): Promise<WonderCLIPromptCommandResult> {
      const command: WonderCLICommand =
        "prompt";
  
      const startedAt =
        this.reporter.commandStarted(
          command
        );
  
      const errors: string[] = [];
  
      const warnings: string[] = [];
  
      let batch:
        | WonderStudioBatch
        | null = null;
  
      let promptPath:
        | string
        | null = null;
  
      let batchPath:
        | string
        | null = null;
  
      let promptCount = 0;
  
      try {
        await this.initialise();
  
        this.reporter.reportConfig(
          this.config
        );
  
        const request =
          await this.readGenerationRequest();
  
        batch =
          this.studio.createBatch(
            request
          );
  
        const prompts =
          this.studio.buildPromptsForBatch(
            batch,
            this.config.execution
              .batchSize
          );
  
        promptCount =
          prompts.length;
  
        const promptContent =
          createPromptDocument(
            prompts
          );
  
        const promptWrite =
          await this.fileSystem.writePrompt(
            promptContent,
            {
              overwriteMode:
                this.config.execution
                  .overwriteMode,
            }
          );
  
        promptPath =
          promptWrite.path;
  
        this.reporter.reportPromptCreated(
          promptWrite.path,
          prompts.reduce(
            (
              total,
              prompt
            ) =>
              total +
              prompt.expectedQuantity,
            0
          )
        );
  
        const batchWrite =
          await this.writeBatch(
            batch
          );
  
        batchPath =
          batchWrite.path;
  
          await this.emitPromptCreated(
            batch,
            prompts,
            promptWrite.path
          );

        this.reporter.success(
          "Studio batch created.",
          [
            `Batch: ${batch.id}`,
            `Output: ${batchWrite.path}`,
            `Prompt parts: ${promptCount}`,
          ]
        );
      } catch (error) {
        errors.push(
          getErrorMessage(error)
        );
      }
  
      const success =
        errors.length === 0 &&
        batch !== null &&
        promptPath !== null;
  
      const summary =
        this.reporter.commandCompleted(
          command,
          startedAt,
          success,
          errors,
          warnings
        );
  
      return {
        command,
  
        success,
  
        summary,
  
        errors,
  
        warnings,
  
        batch,
  
        promptPath,
  
        batchPath,
  
        promptCount,
      };
    }
  
    // =========================================================
    // VALIDATE COMMAND
    // =========================================================
  
    async runValidate(): Promise<WonderCLIValidateCommandResult> {
      const command: WonderCLICommand =
        "validate";
  
      const startedAt =
        this.reporter.commandStarted(
          command
        );
  
      const errors: string[] = [];
  
      const warnings: string[] = [];
  
      let batch:
        | WonderStudioBatch
        | null = null;
  
      let validationSummary:
        | WonderBatchValidationSummary
        | null = null;
  
      let validationReport:
        | WonderCLIValidationReport
        | null = null;
  
      let batchPath:
        | string
        | null = null;
  
      let reportPath:
        | string
        | null = null;
  
      try {
        await this.initialise();
  
        this.reporter.reportConfig(
          this.config
        );
  
        batch =
          await this.loadOrCreateIngestedBatch();
  
        const validation =
          this.studio.validateBatchWithSummary(
            batch,
            this.createValidationOptions()
          );
  
        batch =
          validation.batch;
  
        validationSummary =
          validation.summary;
  
        if (
          this.config.execution
            .autoApproveValidDrafts
        ) {
          batch =
            this.studio.approveValidDrafts(
              batch
            );
        }
  
        validationReport =
          this.reporter.createValidationReport(
            batch,
            validationSummary
          );
  
        this.reporter.reportValidation(
          validationReport
        );
  
        const batchWrite =
          await this.writeBatch(
            batch
          );
  
        batchPath =
          batchWrite.path;
  
        const reportWrite =
          await this.fileSystem.writeValidationReport(
            validationReport,
            {
              overwriteMode:
                this.config.execution
                  .overwriteMode,
  
              prettyPrint:
                this.config.execution
                  .prettyPrint,
            }
          );
  
        reportPath =
          reportWrite.path;
  
          await this.emitValidationCompleted(
            batch,
            validationSummary,
            validationReport,
            reportWrite.path
          );
          
        this.reporter.success(
          "Validation report written.",
          [
            `Output: ${reportWrite.path}`,
          ]
        );
  
        if (
          this.config.execution
            .stopOnValidationFailure &&
          validationSummary.invalidDrafts >
            0
        ) {
          errors.push(
            `${validationSummary.invalidDrafts} draft(s) failed validation.`
          );
        }
      } catch (error) {
        errors.push(
          getErrorMessage(error)
        );
      }
  
      const success =
        errors.length === 0 &&
        batch !== null &&
        validationSummary !== null;
  
      const summary =
        this.reporter.commandCompleted(
          command,
          startedAt,
          success,
          errors,
          warnings
        );
  
      return {
        command,
  
        success,
  
        summary,
  
        errors,
  
        warnings,
  
        batch,
  
        validationSummary,
  
        validationReport,
  
        batchPath,
  
        reportPath,
      };
    }
  
    // =========================================================
    // PUBLISH COMMAND
    // =========================================================
  
    async runPublish(): Promise<WonderCLIPublishCommandResult> {
      const command: WonderCLICommand =
        "publish";
  
      const startedAt =
        this.reporter.commandStarted(
          command
        );
  
      const errors: string[] = [];
  
      const warnings: string[] = [];
  
      let batch:
        | WonderStudioBatch
        | null = null;
  
      let importResult:
        | WonderBatchImportResult
        | null = null;
  
      let importReport:
        | WonderCLIImportReport
        | null = null;
  
      let publishResult:
        | WonderPublishResult
        | null = null;
  
      let publishReport:
        | WonderCLIPublishReport
        | null = null;
  
      let studioExport:
        | WonderStudioExport
        | null = null;
  
      let catalogPath:
        | string
        | null = null;
  
      let manifestPath:
        | string
        | null = null;
  
      let batchPath:
        | string
        | null = null;
  
      try {
        await this.initialise();
  
        this.reporter.reportConfig(
          this.config
        );
  
        batch =
          await this.readStoredBatch();
  
        if (
          this.config.execution
            .autoApproveValidDrafts
        ) {
          batch =
            this.studio.approveValidDrafts(
              batch
            );
        }
  
        importResult =
          this.studio.importBatch(
            batch,
            this.createImportOptions()
          );
  
        importReport =
          this.reporter.createImportReport(
            importResult
          );
  
        this.reporter.reportImport(
          importReport
        );
  
        publishResult =
          this.studio.publishBatch(
            batch,
            this.createImportOptions(),
            this.createPublisherOptions()
          ).publishResult;
  
        publishReport =
          this.reporter.createPublishReport(
            publishResult
          );
  
        this.reporter.reportPublication(
          publishReport
        );
  
        warnings.push(
          ...publishResult.warnings
        );
  
        if (!publishResult.success) {
          errors.push(
            ...publishResult.errors
          );
        } else {
          studioExport =
            this.studio.createExport(
              publishResult,
              this.createPublisherOptions()
            );
  
          const exportWrite =
            await this.writeStudioExport(
              studioExport
            );
  
          catalogPath =
            exportWrite.path;
  
          this.reporter.reportExport(
            studioExport,
            exportWrite.path
          );
  
          const manifestWrite =
            await this.fileSystem.writeManifest(
              publishResult.manifest,
              {
                overwriteMode:
                  this.config.execution
                    .overwriteMode,
  
                prettyPrint:
                  this.config.execution
                    .prettyPrint,
              }
            );
  
          manifestPath =
            manifestWrite.path;
  
            await this.emitCatalogPublished(
                batch,
                publishResult,
                studioExport,
                catalogPath,
                manifestPath
              );
              
          this.reporter.success(
            "Publication manifest written.",
            [
              `Output: ${manifestWrite.path}`,
            ]
          );
  
          batch =
            publishResult.updatedBatch;
  
          const batchWrite =
            await this.writeBatch(
              batch
            );
  
          batchPath =
            batchWrite.path;
        }
      } catch (error) {
        errors.push(
          getErrorMessage(error)
        );
      }
  
      const success =
        errors.length === 0 &&
        publishResult?.success === true &&
        studioExport !== null;
  
      const summary =
        this.reporter.commandCompleted(
          command,
          startedAt,
          success,
          errors,
          warnings
        );
  
      return {
        command,
  
        success,
  
        summary,
  
        errors:
          uniqueStrings(errors),
  
        warnings:
          uniqueStrings(warnings),
  
        batch,
  
        importResult,
  
        importReport,
  
        publishResult,
  
        publishReport,
  
        studioExport,
  
        catalogPath,
  
        manifestPath,
  
        batchPath,
      };
    }
  
    // =========================================================
    // PIPELINE COMMAND
    // =========================================================
  
    async runPipeline(): Promise<WonderCLIPipelineCommandResult> {
      const command: WonderCLICommand =
        "pipeline";
  
      const startedAt =
        this.reporter.commandStarted(
          command
        );
  
      const errors: string[] = [];
  
      const warnings: string[] = [];
  
      let batch:
        | WonderStudioBatch
        | null = null;
  
      let validationSummary:
        | WonderBatchValidationSummary
        | null = null;
  
      let importResult:
        | WonderBatchImportResult
        | null = null;
  
      let publishResult:
        | WonderPublishResult
        | null = null;
  
      let studioExport:
        | WonderStudioExport
        | null = null;
  
      let pipelineReport:
        | WonderCLIPipelineReport
        | null = null;
  
      let promptPath:
        | string
        | null = null;
  
      let batchPath:
        | string
        | null = null;
  
      let reportPath:
        | string
        | null = null;
  
      let catalogPath:
        | string
        | null = null;
  
      let manifestPath:
        | string
        | null = null;
  
      try {
        await this.initialise();
  
        this.reporter.reportConfig(
          this.config
        );
  
        const request =
          await this.readGenerationRequest();
  
        batch =
          this.studio.createBatch(
            request
          );
  
        const prompts =
          this.studio.buildPromptsForBatch(
            batch,
            this.config.execution
              .batchSize
          );
  
        const promptWrite =
          await this.fileSystem.writePrompt(
            createPromptDocument(
              prompts
            ),
            {
              overwriteMode:
                this.config.execution
                  .overwriteMode,
            }
          );
  
        promptPath =
          promptWrite.path;
  
          await this.emitPromptCreated(
            batch,
            prompts,
            promptWrite.path
          );

        this.reporter.reportPromptCreated(
          promptWrite.path,
          request.quantity
        );
  
        const generated =
          await this.fileSystem.readGeneratedContent<unknown>();
  
        const ingestResult =
          this.studio.tryIngestGeneratedJSON(
            batch,
            generated.value,
            {
              sourcePrompt:
                createPromptDocument(
                  prompts
                ),
  
              sourceModel:
                "external-development-model",
            }
          );
  
        if (!ingestResult.success) {
          throw new Error(
            [
              "WonderStudioCLI: generated content ingestion failed.",
              ...ingestResult.errors,
            ].join(" ")
          );
        }
  
        batch =
          ingestResult.batch;
  
        this.reporter.success(
          "Generated content ingested.",
          [
            `Imported drafts: ${ingestResult.importedDraftCount}`,
            `Skipped drafts: ${ingestResult.skippedDraftCount}`,
          ]
        );
  
        const validation =
          this.studio.validateBatchWithSummary(
            batch,
            this.createValidationOptions()
          );
  
        batch =
          validation.batch;
  
        validationSummary =
          validation.summary;
  
        if (
          this.config.execution
            .autoApproveValidDrafts
        ) {
          batch =
            this.studio.approveValidDrafts(
              batch
            );
        }
  
        const validationReport =
          this.reporter.createValidationReport(
            batch,
            validationSummary
          );
  
        this.reporter.reportValidation(
          validationReport
        );
  
        const reportWrite =
          await this.fileSystem.writeValidationReport(
            validationReport,
            {
              overwriteMode:
                this.config.execution
                  .overwriteMode,
  
              prettyPrint:
                this.config.execution
                  .prettyPrint,
            }
          );
  
        reportPath =
          reportWrite.path;
  
          await this.emitValidationCompleted(
            batch,
            validationSummary,
            validationReport,
            reportWrite.path
          );

        if (
          validationSummary.validDrafts ===
          0
        ) {
          throw new Error(
            "WonderStudioCLI: no drafts passed validation."
          );
        }
  
        if (
          this.config.execution
            .stopOnValidationFailure &&
          validationSummary.invalidDrafts >
            0
        ) {
          throw new Error(
            `${validationSummary.invalidDrafts} draft(s) failed validation.`
          );
        }
  
        importResult =
          this.studio.importBatch(
            batch,
            this.createImportOptions()
          );
  
        const importReport =
          this.reporter.createImportReport(
            importResult
          );
  
        this.reporter.reportImport(
          importReport
        );
  
        if (
          importResult.totalImported ===
          0
        ) {
          throw new Error(
            "WonderStudioCLI: no drafts were imported."
          );
        }
  
        const publication =
          this.studio.publishBatch(
            batch,
            this.createImportOptions(),
            this.createPublisherOptions()
          );
  
        publishResult =
          publication.publishResult;
  
        batch =
          publication.batch;
  
        const publishReport =
          this.reporter.createPublishReport(
            publishResult
          );
  
        this.reporter.reportPublication(
          publishReport
        );
  
        warnings.push(
          ...publishResult.warnings
        );
  
        if (!publishResult.success) {
          throw new Error(
            publishResult.errors.join(" ") ||
            "WonderStudioCLI: publication failed."
          );
        }
  
        studioExport =
          this.studio.createExport(
            publishResult,
            this.createPublisherOptions()
          );
  
        const catalogWrite =
          await this.writeStudioExport(
            studioExport
          );
  
        catalogPath =
          catalogWrite.path;
  
        this.reporter.reportExport(
          studioExport,
          catalogWrite.path
        );
  
        const manifestWrite =
          await this.fileSystem.writeManifest(
            publishResult.manifest,
            {
              overwriteMode:
                this.config.execution
                  .overwriteMode,
  
              prettyPrint:
                this.config.execution
                  .prettyPrint,
            }
          );
  
        manifestPath =
          manifestWrite.path;
  
          await this.emitCatalogPublished(
            batch,
            publishResult,
            studioExport,
            catalogPath,
            manifestPath
          );

        const batchWrite =
          await this.writeBatch(
            batch
          );
  
        batchPath =
          batchWrite.path;
  
        pipelineReport =
          this.reporter.createPipelineReport({
            batch,
  
            statistics:
              this.studio.getStatistics(
                batch
              ),
  
            validation:
              validationReport,
  
            importResult,
  
            publication:
              publishResult,
  
            studioExport,
          });
  
        this.reporter.reportPipeline(
          pipelineReport
        );
  
        await this.fileSystem.writeJSON(
          join(
            this.fileSystem
              .getResolvedPaths()
              .reportsDirectory,
            "pipeline-report.json"
          ),
          pipelineReport,
          {
            overwriteMode:
              this.config.execution
                .overwriteMode,
  
            prettyPrint:
              this.config.execution
                .prettyPrint,
          }
        );
      } catch (error) {
        errors.push(
          getErrorMessage(error)
        );
  
        if (batch) {
          try {
            const batchWrite =
              await this.writeBatch(
                batch
              );
  
            batchPath =
              batchWrite.path;
          } catch (writeError) {
            warnings.push(
              `Failed to save the current batch: ${getErrorMessage(
                writeError
              )}`
            );
          }
        }
      }
  
      const success =
        errors.length === 0 &&
        publishResult?.success === true &&
        studioExport !== null;
  
      const summary =
        this.reporter.commandCompleted(
          command,
          startedAt,
          success,
          errors,
          warnings
        );
  
      return {
        command,
  
        success,
  
        summary,
  
        errors:
          uniqueStrings(errors),
  
        warnings:
          uniqueStrings(warnings),
  
        batch,
  
        validationSummary,
  
        importResult,
  
        publishResult,
  
        studioExport,
  
        pipelineReport,
  
        promptPath,
  
        batchPath,
  
        reportPath,
  
        catalogPath,
  
        manifestPath,
      };
    }
  
    // =========================================================
// WONDEROS EVENTS
// =========================================================

private async emitPromptCreated(
    batch: WonderStudioBatch,
    prompts: readonly WonderStudioPrompt[],
    outputPath: string | null
  ): Promise<void> {
    const expectedQuantity =
      prompts.reduce(
        (
          total,
          prompt
        ) =>
          total +
          prompt.expectedQuantity,
        0
      );
  
    const result =
      await this.eventBus.emit(
        "studio:prompt-created",
        {
          batchId:
            batch.id,
  
          promptIds:
            prompts.map(
              (prompt) =>
                prompt.id
            ),
  
          promptCount:
            prompts.length,
  
          expectedQuantity,
  
          outputPath,
  
          createdAt:
            new Date().toISOString(),
        },
        {
          source:
            "WonderStudioCLI",
  
          metadata: {
            command:
              this.config.execution.command,
          },
        }
      );
  
    this.reportEventDispatchErrors(
      "studio:prompt-created",
      result.errors
    );
  }
  
  private async emitValidationCompleted(
    batch: WonderStudioBatch,
    summary: WonderBatchValidationSummary,
    report: WonderCLIValidationReport,
    reportPath: string | null
  ): Promise<void> {
    const result =
      await this.eventBus.emit(
        "studio:validation-completed",
        {
          batchId:
            batch.id,
  
          summary: {
            totalDrafts:
              summary.totalDrafts,
  
            validDrafts:
              summary.validDrafts,
  
            invalidDrafts:
              summary.invalidDrafts,
  
            errorCount:
              report.errorCount,
  
            warningCount:
              report.warningCount,
  
            informationCount:
              report.infoCount,
  
            averageOverallScore:
              summary.averageOverallScore,
          },
  
          reportPath,
  
          completedAt:
            new Date().toISOString(),
        },
        {
          source:
            "WonderStudioCLI",
  
          metadata: {
            command:
              this.config.execution.command,
          },
        }
      );
  
    this.reportEventDispatchErrors(
      "studio:validation-completed",
      result.errors
    );
  }
  
  private async emitCatalogPublished(
    batch: WonderStudioBatch,
    publishResult: WonderPublishResult,
    studioExport: WonderStudioExport,
    catalogPath: string | null,
    manifestPath: string | null
  ): Promise<void> {
    const catalog =
      publishResult.catalog;
  
    if (!catalog) {
      return;
    }
  
    const statistics =
      catalog.statistics;
  
    const result =
      await this.eventBus.emit(
        "studio:catalog-published",
        {
          batchId:
            batch.id,
  
          packageId:
            catalog.id,
  
          catalogName:
            catalog.name,
  
          version:
            catalog.version,
  
          destination:
            this.config.publish.destination,
  
          format:
            studioExport.format,
  
          counts: {
            stories:
              statistics.totalStories,
  
            missions:
              statistics.totalMissions,
  
            adventures:
              statistics.totalAdventures,
  
            runtimeStories:
              statistics.totalRuntimeStories,
  
            runtimeMissions:
              statistics.totalRuntimeMissions,
          },
  
          catalogPath,
  
          manifestPath,
  
          publishedAt:
            publishResult.publishedAt.toISOString(),
        },
        {
          source:
            "WonderStudioCLI",
  
          metadata: {
            command:
              this.config.execution.command,
  
            exportFilename:
              studioExport.filename,
          },
        }
      );
  
    this.reportEventDispatchErrors(
      "studio:catalog-published",
      result.errors
    );
  }
  
  private reportEventDispatchErrors(
    eventName: string,
    errors: readonly {
      message: string;
    }[]
  ): void {
    if (
      errors.length === 0
    ) {
      return;
    }
  
    this.reporter.warning(
      `Event "${eventName}" completed with listener errors.`,
      errors.map(
        (error) =>
          error.message
      )
    );
  }

    // =========================================================
    // INPUT
    // =========================================================
  
    private async readGenerationRequest(): Promise<WonderStudioGenerationRequest> {
      const brief =
        await this.fileSystem.readBrief<unknown>();
  
      return parseGenerationRequest(
        brief.value,
        this.studio
      );
    }
  
    private async readStoredBatch(): Promise<WonderStudioBatch> {
      const stored =
        await this.fileSystem.readStudioBatch<unknown>();
  
      return hydrateStudioBatch(
        stored.value
      );
    }
  
    private async loadOrCreateIngestedBatch(): Promise<WonderStudioBatch> {
      const hasStoredBatch =
        await this.fileSystem.configuredFileExists(
          "draft"
        );
  
      if (hasStoredBatch) {
        return this.readStoredBatch();
      }
  
      const request =
        await this.readGenerationRequest();
  
      const initialBatch =
        this.studio.createBatch(
          request
        );
  
      const generated =
        await this.fileSystem.readGeneratedContent<unknown>();
  
      return this.studio.ingestGeneratedJSON(
        initialBatch,
        generated.value,
        {
          sourceModel:
            "external-development-model",
        }
      );
    }
  
    // =========================================================
    // OUTPUT
    // =========================================================
  
    private async writeBatch(
      batch: WonderStudioBatch
    ): Promise<WonderCLIWriteResult> {
      return this.fileSystem.writeStudioBatch(
        batch,
        {
          overwriteMode:
            this.config.execution
              .overwriteMode,
  
          prettyPrint:
            this.config.execution
              .prettyPrint,
        }
      );
    }
  
    private async writeStudioExport(
      studioExport: WonderStudioExport
    ): Promise<WonderCLIWriteResult> {
      const outputPath =
        join(
          this.fileSystem
            .getResolvedPaths()
            .catalogsDirectory,
          studioExport.filename
        );
  
      return this.fileSystem.writeText(
        outputPath,
        studioExport.content,
        {
          overwriteMode:
            this.config.execution
              .overwriteMode,
        }
      );
    }
  
    // =========================================================
    // OPTIONS
    // =========================================================
  
    private createValidationOptions() {
      return {
        minimumOverallScore:
          this.config.quality
            .minimumOverallScore,
  
        minimumCriticalScore:
          this.config.quality
            .minimumCriticalScore,
  
        duplicateThreshold:
          this.config.quality
            .duplicateThreshold,
  
        warningsAreErrors:
          this.config.quality
            .warningsAreErrors,
      };
    }
  
    private createImportOptions() {
      return {
        destination:
          this.config.publish
            .destination,
  
        requireValidValidation:
          true,
  
        allowNeedsReview:
          !this.config.execution
            .autoApproveValidDrafts,
  
        allowPublished:
          true,
      };
    }
  
    private createPublisherOptions() {
      return {
        name:
          this.config.publish
            .packageName,
  
        description:
          this.config.publish
            .packageDescription,
  
        version:
          this.config.publish
            .version,
  
        destination:
          this.config.publish
            .destination,
  
        format:
          this.config.publish
            .exportFormat,
  
        exportName:
          this.config.publish
            .exportName,
  
        requireCompleteImport:
          this.config.publish
            .requireCompleteImport,
  
        requireApprovedDrafts:
          this.config.publish
            .requireApprovedDrafts,
  
        notes:
          this.config.publish.notes,
      };
    }
  }
  
  // =========================================================
  // PROMPT DOCUMENT
  // =========================================================
  
  function createPromptDocument(
    prompts: readonly {
      id: string;
  
      batchId: string;
  
      system: string;
  
      user: string;
  
      expectedQuantity: number;
    }[]
  ): string {
    return prompts
      .map(
        (
          prompt,
          index
        ) =>
          [
            `WONDEROS PROMPT ${index + 1}/${prompts.length}`,
            `Prompt ID: ${prompt.id}`,
            `Batch ID: ${prompt.batchId}`,
            `Expected quantity: ${prompt.expectedQuantity}`,
            "",
            "SYSTEM",
            prompt.system,
            "",
            "USER",
            prompt.user,
          ].join("\n")
      )
      .join(
        "\n\n============================================================\n\n"
      );
  }
  
  // =========================================================
  // BRIEF PARSING
  // =========================================================
  
  function parseGenerationRequest(
    value: unknown,
    studio: WonderStudio
  ): WonderStudioGenerationRequest {
    if (!isRecord(value)) {
      throw new Error(
        "WonderStudioCLI: content brief must be a JSON object."
      );
    }
  
    const friendId =
      readRequiredString(
        value.friendId,
        "friendId"
      );
  
    const worldId =
      readRequiredString(
        value.worldId,
        "worldId"
      );
  
    const valueId =
      readRequiredString(
        value.valueId,
        "valueId"
      );
  
    const templateId =
      readRequiredString(
        value.templateId,
        "templateId"
      );
  
    return studio.createRequest({
      id:
        readOptionalString(
          value.id
        ),
  
      createdAt:
        readDate(
          value.createdAt
        ) ??
        new Date(),
  
      contentType:
        readContentType(
          value.contentType
        ),
  
      quantity:
        readOptionalNumber(
          value.quantity
        ),
  
      language:
        readOptionalString(
          value.language
        ),
  
      locale:
        readOptionalString(
          value.locale
        ),
  
      friendId,
  
      worldId,
  
      valueId,
  
      templateId,
  
      ageRange:
        readAgeRange(
          value.ageRange
        ) ??
        undefined,
  
      difficulty:
        readDifficulty(
          value.difficulty
        ),
  
      duration:
        readOptionalNumber(
          value.duration
        ),
  
      emotion:
        readOptionalString(
          value.emotion
        ),
  
      location:
        readOptionalString(
          value.location
        ),
  
      archetypeId:
        readOptionalString(
          value.archetypeId
        ),
  
      titleDirection:
        readOptionalString(
          value.titleDirection
        ),
  
      creativeDirection:
        readOptionalString(
          value.creativeDirection
        ),
  
      learningObjective:
        readOptionalString(
          value.learningObjective
        ),
  
      requiredWords:
        readStringArray(
          value.requiredWords
        ),
  
      bannedWords:
        readStringArray(
          value.bannedWords
        ),
  
      tags:
        readStringArray(
          value.tags
        ),
  
      seed:
        readOptionalString(
          value.seed
        ),
    });
  }
  
  // =========================================================
  // BATCH HYDRATION
  // =========================================================
  
  function hydrateStudioBatch(
    value: unknown
  ): WonderStudioBatch {
    if (!isRecord(value)) {
      throw new Error(
        "WonderStudioCLI: stored Studio batch must be an object."
      );
    }
  
    const request =
      hydrateGenerationRequest(
        value.request
      );
  
    const drafts =
      Array.isArray(
        value.drafts
      )
        ? value.drafts.map(
            hydrateStudioDraft
          )
        : [];
  
    return {
      id:
        readRequiredString(
          value.id,
          "batch.id"
        ),
  
      createdAt:
        readRequiredDate(
          value.createdAt,
          "batch.createdAt"
        ),
  
      updatedAt:
        readRequiredDate(
          value.updatedAt,
          "batch.updatedAt"
        ),
  
      request,
  
      status:
        readBatchStatus(
          value.status
        ),
  
      drafts,
  
      totalGenerated:
        readNonNegativeInteger(
          value.totalGenerated
        ),
  
      totalValid:
        readNonNegativeInteger(
          value.totalValid
        ),
  
      totalApproved:
        readNonNegativeInteger(
          value.totalApproved
        ),
  
      totalRejected:
        readNonNegativeInteger(
          value.totalRejected
        ),
    };
  }
  
  function hydrateGenerationRequest(
    value: unknown
  ): WonderStudioGenerationRequest {
    if (!isRecord(value)) {
      throw new Error(
        "WonderStudioCLI: stored generation request is invalid."
      );
    }
  
    return {
      id:
        readRequiredString(
          value.id,
          "request.id"
        ),
  
      createdAt:
        readRequiredDate(
          value.createdAt,
          "request.createdAt"
        ),
  
      contentType:
        readContentType(
          value.contentType
        ) ??
        "adventure",
  
      quantity:
        readPositiveInteger(
          value.quantity,
          1
        ),
  
      language:
        readRequiredString(
          value.language,
          "request.language"
        ),
  
      locale:
        readRequiredString(
          value.locale,
          "request.locale"
        ),
  
      friendId:
        readRequiredString(
          value.friendId,
          "request.friendId"
        ),
  
      worldId:
        readRequiredString(
          value.worldId,
          "request.worldId"
        ),
  
      valueId:
        readRequiredString(
          value.valueId,
          "request.valueId"
        ),
  
      templateId:
        readRequiredString(
          value.templateId,
          "request.templateId"
        ),
  
      ageRange:
        readAgeRange(
          value.ageRange
        ) ?? {
          min: 4,
          max: 8,
        },
  
      difficulty:
        readDifficulty(
          value.difficulty
        ) ??
        "easy",
  
      duration:
        readPositiveInteger(
          value.duration,
          5
        ),
  
      emotion:
        readOptionalString(
          value.emotion
        ),
  
      location:
        readOptionalString(
          value.location
        ),
  
      archetypeId:
        readOptionalString(
          value.archetypeId
        ),
  
      titleDirection:
        readOptionalString(
          value.titleDirection
        ),
  
      creativeDirection:
        readOptionalString(
          value.creativeDirection
        ),
  
      learningObjective:
        readOptionalString(
          value.learningObjective
        ),
  
      requiredWords:
        readStringArray(
          value.requiredWords
        ),
  
      bannedWords:
        readStringArray(
          value.bannedWords
        ),
  
      tags:
        readStringArray(
          value.tags
        ),
  
      seed:
        readOptionalString(
          value.seed
        ),
    };
  }
  
  function hydrateStudioDraft(
    value: unknown
  ): WonderStudioDraft {
    if (!isRecord(value)) {
      throw new Error(
        "WonderStudioCLI: stored draft must be an object."
      );
    }
  
    const metadata =
      isRecord(
        value.metadata
      )
        ? value.metadata
        : {};
  
    return {
      id:
        readRequiredString(
          value.id,
          "draft.id"
        ),
  
      batchId:
        readRequiredString(
          value.batchId,
          "draft.batchId"
        ),
  
      version:
        readPositiveInteger(
          value.version,
          1
        ),
  
      createdAt:
        readRequiredDate(
          value.createdAt,
          "draft.createdAt"
        ),
  
      updatedAt:
        readRequiredDate(
          value.updatedAt,
          "draft.updatedAt"
        ),
  
      status:
        readDraftStatus(
          value.status
        ),
  
      contentType:
        readContentType(
          value.contentType
        ) ??
        "adventure",
  
      metadata: {
        friendId:
          readRequiredString(
            metadata.friendId,
            "draft.metadata.friendId"
          ),
  
        worldId:
          readRequiredString(
            metadata.worldId,
            "draft.metadata.worldId"
          ),
  
        valueId:
          readRequiredString(
            metadata.valueId,
            "draft.metadata.valueId"
          ),
  
        templateId:
          readRequiredString(
            metadata.templateId,
            "draft.metadata.templateId"
          ),
  
        language:
          readRequiredString(
            metadata.language,
            "draft.metadata.language"
          ),
  
        locale:
          readRequiredString(
            metadata.locale,
            "draft.metadata.locale"
          ),
  
        ageRange:
          readAgeRange(
            metadata.ageRange
          ) ?? {
            min: 4,
            max: 8,
          },
  
        difficulty:
          readDifficulty(
            metadata.difficulty
          ) ??
          "easy",
  
        duration:
          readPositiveInteger(
            metadata.duration,
            5
          ),
  
        emotion:
          readRequiredString(
            metadata.emotion,
            "draft.metadata.emotion"
          ),
  
        location:
          readRequiredString(
            metadata.location,
            "draft.metadata.location"
          ),
  
        tags:
          readStringArray(
            metadata.tags
          ),
      },
  
      story:
        hydrateStory(
          value.story
        ),
  
      mission:
        hydrateMission(
          value.mission
        ),
  
      sourcePrompt:
        readOptionalString(
          value.sourcePrompt
        ) ?? "",
  
      sourceModel:
        readNullableString(
          value.sourceModel
        ),
  
      validation:
        hydrateValidationResult(
          value.validation
        ),
    };
  }
  
  function hydrateStory(
    value: unknown
  ): WonderStudioDraft["story"] {
    if (!isRecord(value)) {
      return null;
    }
  
    return {
      title:
        readOptionalString(
          value.title
        ) ?? "",
  
      intro:
        readOptionalString(
          value.intro
        ) ?? "",
  
      problem:
        readOptionalString(
          value.problem
        ) ?? "",
  
      goal:
        readOptionalString(
          value.goal
        ) ?? "",
  
      closing:
        readOptionalString(
          value.closing
        ) ?? "",
    };
  }
  
  function hydrateMission(
    value: unknown
  ): WonderStudioDraft["mission"] {
    if (!isRecord(value)) {
      return null;
    }
  
    return {
      title:
        readOptionalString(
          value.title
        ) ?? "",
  
      objective:
        readOptionalString(
          value.objective
        ) ?? "",
  
      activity:
        readOptionalString(
          value.activity
        ) ?? "",
  
      successMessage:
        readOptionalString(
          value.successMessage
        ) ?? "",
  
      supplies:
        readStringArray(
          value.supplies
        ),
    };
  }
  
  function hydrateValidationResult(
    value: unknown
  ): WonderStudioValidationResult | null {
    if (!isRecord(value)) {
      return null;
    }
  
    const scores =
      isRecord(
        value.scores
      )
        ? value.scores
        : {};
  
    return {
      valid:
        value.valid === true,
  
      validatedAt:
        readRequiredDate(
          value.validatedAt,
          "validation.validatedAt"
        ),
  
      issues:
        Array.isArray(
          value.issues
        )
          ? value.issues
              .filter(isRecord)
              .map(
                (issue) => ({
                  id:
                    readRequiredString(
                      issue.id,
                      "validation.issue.id"
                    ),
  
                  rule:
                    readRequiredString(
                      issue.rule,
                      "validation.issue.rule"
                    ),
  
                  severity:
                    readValidationSeverity(
                      issue.severity
                    ),
  
                  field:
                    readNullableString(
                      issue.field
                    ),
  
                  message:
                    readRequiredString(
                      issue.message,
                      "validation.issue.message"
                    ),
  
                  suggestion:
                    readNullableString(
                      issue.suggestion
                    ),
                })
              )
          : [],
  
      scores: {
        safety:
          readScore(
            scores.safety
          ),
  
        ageMatch:
          readScore(
            scores.ageMatch
          ),
  
        educationalValue:
          readScore(
            scores.educationalValue
          ),
  
        creativity:
          readScore(
            scores.creativity
          ),
  
        clarity:
          readScore(
            scores.clarity
          ),
  
        emotionalQuality:
          readScore(
            scores.emotionalQuality
          ),
  
        offlinePlayValue:
          readScore(
            scores.offlinePlayValue
          ),
  
        overall:
          readScore(
            scores.overall
          ),
      },
    };
  }
  
  // =========================================================
  // SAFE READERS
  // =========================================================
  
  function isRecord(
    value: unknown
  ): value is Record<
    string,
    unknown
  > {
    return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    );
  }
  
  function readRequiredString(
    value: unknown,
    fieldName: string
  ): string {
    if (
      typeof value !== "string" ||
      value.trim().length === 0
    ) {
      throw new Error(
        `WonderStudioCLI: "${fieldName}" is required.`
      );
    }
  
    return value.trim();
  }
  
  function readOptionalString(
    value: unknown
  ): string | undefined {
    if (
      typeof value !== "string"
    ) {
      return undefined;
    }
  
    const cleanValue =
      value.trim();
  
    return cleanValue.length > 0
      ? cleanValue
      : undefined;
  }
  
  function readNullableString(
    value: unknown
  ): string | null {
    return (
      readOptionalString(
        value
      ) ??
      null
    );
  }
  
  function readOptionalNumber(
    value: unknown
  ): number | undefined {
    return (
      typeof value === "number" &&
      Number.isFinite(value)
    )
      ? value
      : undefined;
  }
  
  function readNonNegativeInteger(
    value: unknown
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return 0;
    }
  
    return Math.max(
      0,
      Math.floor(value)
    );
  }
  
  function readPositiveInteger(
    value: unknown,
    fallback: number
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 1
    ) {
      return fallback;
    }
  
    return Math.floor(value);
  }
  
  function readScore(
    value: unknown
  ): number {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return 0;
    }
  
    return Math.min(
      10,
      Math.max(
        0,
        value
      )
    );
  }
  
  function readDate(
    value: unknown
  ): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(
        value.getTime()
      )
        ? null
        : new Date(
            value.getTime()
          );
    }
  
    if (
      typeof value !== "string"
    ) {
      return null;
    }
  
    const date =
      new Date(value);
  
    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }
  
  function readRequiredDate(
    value: unknown,
    fieldName: string
  ): Date {
    const date =
      readDate(value);
  
    if (!date) {
      throw new Error(
        `WonderStudioCLI: "${fieldName}" must be a valid date.`
      );
    }
  
    return date;
  }
  
  function readStringArray(
    value: unknown
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
  
    return uniqueStrings(
      value.filter(
        (
          item
        ): item is string =>
          typeof item === "string"
      )
    );
  }
  
  function readAgeRange(
    value: unknown
  ): {
    min: number;
  
    max: number;
  } | null {
    if (!isRecord(value)) {
      return null;
    }
  
    if (
      typeof value.min !== "number" ||
      typeof value.max !== "number"
    ) {
      return null;
    }
  
    const minimum =
      Math.max(
        0,
        Math.floor(value.min)
      );
  
    const maximum =
      Math.max(
        minimum,
        Math.floor(value.max)
      );
  
    return {
      min: minimum,
  
      max: maximum,
    };
  }
  
  function readContentType(
    value: unknown
  ): WonderStudioContentType | undefined {
    return (
      value === "story" ||
      value === "mission" ||
      value === "adventure"
    )
      ? value
      : undefined;
  }
  
  function readDifficulty(
    value: unknown
  ): WonderStudioGenerationRequest["difficulty"] | undefined {
    return (
      value === "easy" ||
      value === "medium" ||
      value === "hard"
    )
      ? value
      : undefined;
  }
  
  function readDraftStatus(
    value: unknown
  ): WonderStudioDraftStatus {
    const statuses:
      readonly WonderStudioDraftStatus[] = [
        "generated",
        "validating",
        "needs-review",
        "approved",
        "rejected",
        "published",
      ];
  
    return statuses.includes(
      value as WonderStudioDraftStatus
    )
      ? value as WonderStudioDraftStatus
      : "generated";
  }
  
  function readBatchStatus(
    value: unknown
  ): WonderStudioBatch["status"] {
    switch (value) {
      case "created":
      case "generating":
      case "validating":
      case "reviewing":
      case "completed":
      case "failed":
        return value;
  
      default:
        return "created";
    }
  }
  
  function readValidationSeverity(
    value: unknown
  ): "info" | "warning" | "error" {
    switch (value) {
      case "warning":
        return "warning";
  
      case "error":
        return "error";
  
      default:
        return "info";
    }
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function isCompleteCLIConfig(
    value:
      | WonderCLIConfig
      | WonderCLIConfigOverrides
  ): value is WonderCLIConfig {
    return (
      typeof (
        value as WonderCLIConfig
      ).paths?.rootDirectory ===
        "string" &&
      typeof (
        value as WonderCLIConfig
      ).execution?.command ===
        "string" &&
      typeof (
        value as WonderCLIConfig
      ).publish?.packageName ===
        "string"
    );
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
  
  function assertNever(
    value: never
  ): never {
    throw new Error(
      `WonderStudioCLI: unsupported command "${String(
        value
      )}".`
    );
  }
  
  export const wonderStudioCLI =
    new WonderStudioCLI();
  
  export default WonderStudioCLI;