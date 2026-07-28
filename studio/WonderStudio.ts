import {
    WonderPromptBuilder,
    wonderPromptBuilder,
  } from "./prompt/WonderPromptBuilder";
  
  import {
    WonderContentValidator,
    wonderContentValidator,
  } from "./validation/WonderContentValidator";
  
  import type {
    WonderBatchValidationSummary,
    WonderContentValidatorOptions,
  } from "./validation/WonderContentValidator";
  
  import {
    WonderContentImporter,
    wonderContentImporter,
  } from "./import/WonderContentImporter";
  
  import type {
    WonderBatchImportResult,
    WonderContentImportOptions,
  } from "./import/WonderContentImporter";
  
  import {
    WonderPublisher,
    wonderPublisher,
  } from "./publish/WonderPublisher";
  
  import type {
    WonderPublisherOptions,
    WonderPublishResult,
    WonderStudioExport,
  } from "./publish/WonderPublisher";
  
  import {
    createEmptyStudioStatistics,
  } from "./types/WonderStudioTypes";
  
  import type {
    WonderStudioAgeRange,
    WonderStudioBatch,
    WonderStudioContentType,
    WonderStudioDraft,
    WonderStudioDraftMetadata,
    WonderStudioDraftStatus,
    WonderStudioGenerationRequest,
    WonderStudioMissionContent,
    WonderStudioPrompt,
    WonderStudioStatistics,
    WonderStudioStoryContent,
  } from "./types/WonderStudioTypes";
 
  export interface WonderStudioIngestOptions {
    /**
     * Source prompt used to generate the response.
     */
    sourcePrompt?: string;
  
    /**
     * Model name used during development.
     *
     * Examples:
     * - gpt-5
     * - gemini-2.5-pro
     * - claude-sonnet
     */
    sourceModel?: string | null;
  
    /**
     * Replace all existing drafts in the batch.
     *
     * Defaults to false.
     */
    replaceExistingDrafts?: boolean;
  }
  
  export interface WonderStudioIngestResult {
    success: boolean;
  
    batch: WonderStudioBatch;
  
    importedDraftCount: number;
  
    skippedDraftCount: number;
  
    errors: string[];
  }
  
  export interface WonderStudioPipelineOptions {
    validation?: WonderContentValidatorOptions;
  
    import?: WonderContentImportOptions;
  
    publish?: WonderPublisherOptions;
  }
  
  export interface WonderStudioPipelineResult {
    success: boolean;
  
    batch: WonderStudioBatch;
  
    validation: WonderBatchValidationSummary;
  
    importResult: WonderBatchImportResult | null;
  
    publishResult: WonderPublishResult | null;
  
    errors: string[];
  }
  
  export interface WonderStudioPublicationResult {
    batch: WonderStudioBatch;
  
    importResult: WonderBatchImportResult;
  
    publishResult: WonderPublishResult;
  }
  
  interface WonderGeneratedResponse {
    batchId: string;
  
    contentType: WonderStudioContentType;
  
    items: WonderGeneratedItem[];
  }
  
  interface WonderGeneratedItem {
    temporaryId: string;
  
    metadata:
      | Partial<WonderStudioDraftMetadata>
      | null;
  
    story:
      | Partial<WonderStudioStoryContent>
      | null;
  
    mission:
      | Partial<WonderStudioMissionContent>
      | null;
  }
  
  const WONDER_STUDIO_BATCH_VERSION = 1;
  
  const MINIMUM_QUANTITY = 1;
  
  const MAXIMUM_QUANTITY = 500;
  
  const DEFAULT_BATCH_SIZE = 25;
  
  const DEFAULT_LANGUAGE = "English";
  
  const DEFAULT_LOCALE = "en-GB";
  
  const DEFAULT_DURATION = 5;
  
  /**
   * Main Wonder Studio orchestrator.
   *
   * Production pipeline:
   *
   * Generation Request
   * -> Prompt Builder
   * -> AI JSON
   * -> Draft Ingestion
   * -> Validation
   * -> Human Approval
   * -> Importer
   * -> Publisher
   * -> Runtime Catalog
   *
   * AI is used only during content development.
   *
   * Runtime applications consume approved and published catalogs
   * without calling an AI model.
   */
  export class WonderStudio {
    constructor(
      private readonly promptBuilder: WonderPromptBuilder =
        wonderPromptBuilder,
  
      private readonly validator: WonderContentValidator =
        wonderContentValidator,
  
      private readonly importer: WonderContentImporter =
        wonderContentImporter,
  
      private readonly publisher: WonderPublisher =
        wonderPublisher
    ) {}
  
    // =========================================================
    // BATCH CREATION
    // =========================================================
  
    createBatch(
      request: WonderStudioGenerationRequest
    ): WonderStudioBatch {
      const cleanRequest =
        normaliseGenerationRequest(
          request
        );
  
      const now = new Date();
  
      return {
        id:
          cleanRequest.id,
  
        createdAt:
          new Date(
            now.getTime()
          ),
  
        updatedAt:
          new Date(
            now.getTime()
          ),
  
        request:
          cloneGenerationRequest(
            cleanRequest
          ),
  
        status: "created",
  
        drafts: [],
  
        totalGenerated: 0,
  
        totalValid: 0,
  
        totalApproved: 0,
  
        totalRejected: 0,
      };
    }
  
    /**
     * Creates a generation request with safe defaults.
     */
    createRequest(
      input: Partial<WonderStudioGenerationRequest> & {
        friendId: string;
  
        worldId: string;
  
        valueId: string;
  
        templateId: string;
      }
    ): WonderStudioGenerationRequest {
      const now = new Date();
  
      const contentType =
        isContentType(
          input.contentType
        )
          ? input.contentType
          : "adventure";
  
      const quantity =
        clampInteger(
          input.quantity ??
            1,
          MINIMUM_QUANTITY,
          MAXIMUM_QUANTITY
        );
  
      const id =
        safeText(
          input.id,
          createBatchId({
            contentType,
  
            friendId:
              input.friendId,
  
            worldId:
              input.worldId,
  
            valueId:
              input.valueId,
  
            createdAt: now,
          })
        );
  
      return normaliseGenerationRequest({
        id,
  
        createdAt:
          input.createdAt ??
          now,
  
        contentType,
  
        quantity,
  
        language:
          input.language ??
          DEFAULT_LANGUAGE,
  
        locale:
          input.locale ??
          DEFAULT_LOCALE,
  
        friendId:
          input.friendId,
  
        worldId:
          input.worldId,
  
        valueId:
          input.valueId,
  
        templateId:
          input.templateId,
  
        ageRange:
          input.ageRange ?? {
            min: 4,
  
            max: 8,
          },
  
        difficulty:
          input.difficulty ??
          "easy",
  
        duration:
          input.duration ??
          DEFAULT_DURATION,
  
        emotion:
          input.emotion,
  
        location:
          input.location,
  
        archetypeId:
          input.archetypeId,
  
        titleDirection:
          input.titleDirection,
  
        creativeDirection:
          input.creativeDirection,
  
        learningObjective:
          input.learningObjective,
  
        requiredWords:
          input.requiredWords,
  
        bannedWords:
          input.bannedWords,
  
        tags:
          input.tags,
  
        seed:
          input.seed,
      });
    }
  
    // =========================================================
    // PROMPTS
    // =========================================================
  
    buildPrompt(
      request: WonderStudioGenerationRequest
    ): WonderStudioPrompt {
      return this.promptBuilder.build(
        request
      );
    }
  
    buildPromptForBatch(
      batch: WonderStudioBatch
    ): WonderStudioPrompt {
      return this.buildPrompt(
        batch.request
      );
    }
  
    buildPromptBatches(
      request: WonderStudioGenerationRequest,
      batchSize =
        DEFAULT_BATCH_SIZE
    ): WonderStudioPrompt[] {
      return this.promptBuilder.buildBatches(
        request,
        batchSize
      );
    }
  
    buildPromptsForBatch(
      batch: WonderStudioBatch,
      batchSize =
        DEFAULT_BATCH_SIZE
    ): WonderStudioPrompt[] {
      return this.buildPromptBatches(
        batch.request,
        batchSize
      );
    }
  
    markGenerating(
      batch: WonderStudioBatch
    ): WonderStudioBatch {
      return {
        ...cloneStudioBatch(
          batch
        ),
  
        updatedAt:
          new Date(),
  
        status: "generating",
      };
    }
  
    // =========================================================
    // AI RESPONSE INGESTION
    // =========================================================
  
    ingestGeneratedJSON(
      batch: WonderStudioBatch,
      response:
        | string
        | unknown,
      options: WonderStudioIngestOptions = {}
    ): WonderStudioBatch {
      const result =
        this.tryIngestGeneratedJSON(
          batch,
          response,
          options
        );
  
      if (!result.success) {
        throw new Error(
          [
            "WonderStudio: generated response could not be ingested.",
            ...result.errors,
          ].join(" ")
        );
      }
  
      return result.batch;
    }
  
    tryIngestGeneratedJSON(
      batch: WonderStudioBatch,
      response:
        | string
        | unknown,
      options: WonderStudioIngestOptions = {}
    ): WonderStudioIngestResult {
      const errors: string[] = [];
  
      let parsedValue: unknown;
  
      try {
        parsedValue =
          typeof response ===
          "string"
            ? JSON.parse(response)
            : response;
      } catch (error) {
        return {
          success: false,
  
          batch:
            cloneStudioBatch(
              batch
            ),
  
          importedDraftCount: 0,
  
          skippedDraftCount: 0,
  
          errors: [
            `Generated response is not valid JSON: ${getErrorMessage(
              error
            )}`,
          ],
        };
      }
  
      const generatedResponse =
        parseGeneratedResponse(
          parsedValue,
          batch,
          errors
        );
  
      if (!generatedResponse) {
        return {
          success: false,
  
          batch:
            cloneStudioBatch(
              batch
            ),
  
          importedDraftCount: 0,
  
          skippedDraftCount: 0,
  
          errors,
        };
      }
  
      const sourcePrompt =
        safeText(
          options.sourcePrompt,
          ""
        );
  
      const sourceModel =
        normaliseNullableText(
          options.sourceModel
        );
  
      const existingDrafts =
        options.replaceExistingDrafts
          ? []
          : batch.drafts.map(
              cloneStudioDraft
            );
  
      const existingDraftIds =
        new Set(
          existingDrafts.map(
            (draft) =>
              draft.id
          )
        );
  
      const generatedDrafts: WonderStudioDraft[] =
        [];
  
      let skippedDraftCount = 0;
  
      generatedResponse.items.forEach(
        (item, index) => {
          try {
            const draft =
              createDraftFromGeneratedItem({
                batch,
  
                response:
                  generatedResponse,
  
                item,
  
                index,
  
                sourcePrompt,
  
                sourceModel,
              });
  
            if (
              existingDraftIds.has(
                draft.id
              )
            ) {
              skippedDraftCount += 1;
  
              return;
            }
  
            existingDraftIds.add(
              draft.id
            );
  
            generatedDrafts.push(
              draft
            );
          } catch (error) {
            skippedDraftCount += 1;
  
            errors.push(
              `Item ${index + 1}: ${getErrorMessage(
                error
              )}`
            );
          }
        }
      );
  
      if (
        generatedDrafts.length === 0
      ) {
        return {
          success: false,
  
          batch:
            cloneStudioBatch(
              batch
            ),
  
          importedDraftCount: 0,
  
          skippedDraftCount,
  
          errors:
            errors.length > 0
              ? errors
              : [
                  "Generated response did not contain any usable content items.",
                ],
        };
      }
  
      const drafts = [
        ...existingDrafts,
  
        ...generatedDrafts,
      ];
  
      const updatedBatch =
        updateBatchStatistics({
          ...cloneStudioBatch(
            batch
          ),
  
          updatedAt:
            new Date(),
  
          status: "reviewing",
  
          drafts,
        });
  
      return {
        success: true,
  
        batch:
          updatedBatch,
  
        importedDraftCount:
          generatedDrafts.length,
  
        skippedDraftCount,
  
        errors,
      };
    }
  
    // =========================================================
    // VALIDATION
    // =========================================================
  
    validateBatch(
      batch: WonderStudioBatch,
      options: WonderContentValidatorOptions = {}
    ): WonderStudioBatch {
      const validation =
        this.validator.validateBatch(
          batch,
          options
        );
  
      const resultMap =
        new Map(
          validation.records.map(
            (record) => [
              record.draft.id,
              record.result,
            ]
          )
        );
  
        const drafts: WonderStudioDraft[] =
        batch.drafts.map(
          (
            draft
          ): WonderStudioDraft => {
            const result =
              resultMap.get(
                draft.id
              );
      
            if (!result) {
              return cloneStudioDraft(
                draft
              );
            }
      
            const status: WonderStudioDraftStatus =
              result.valid
                ? "needs-review"
                : "rejected";
      
            return {
              ...cloneStudioDraft(
                draft
              ),
      
              updatedAt:
                new Date(),
      
              status,
      
              validation:
                cloneValidationResult(
                  result
                ),
            };
          }
        );
      return updateBatchStatistics({
        ...cloneStudioBatch(
          batch
        ),
  
        updatedAt:
          new Date(),
  
        status: "reviewing",
  
        drafts,
      });
    }
  
    validateBatchWithSummary(
      batch: WonderStudioBatch,
      options: WonderContentValidatorOptions = {}
    ): {
      batch: WonderStudioBatch;
  
      summary: WonderBatchValidationSummary;
    } {
      const summary =
        this.validator.validateBatch(
          batch,
          options
        );
  
      const resultMap =
        new Map(
          summary.records.map(
            (record) => [
              record.draft.id,
              record.result,
            ]
          )
        );
  
        const drafts: WonderStudioDraft[] =
        batch.drafts.map(
          (
            draft
          ): WonderStudioDraft => {
            const result =
              resultMap.get(
                draft.id
              );
      
            if (!result) {
              return cloneStudioDraft(
                draft
              );
            }
      
            const status: WonderStudioDraftStatus =
              result.valid
                ? "needs-review"
                : "rejected";
      
            return {
              ...cloneStudioDraft(
                draft
              ),
      
              updatedAt:
                new Date(),
      
              status,
      
              validation:
                cloneValidationResult(
                  result
                ),
            };
          }
        );
      return {
        batch:
          updateBatchStatistics({
            ...cloneStudioBatch(
              batch
            ),
  
            updatedAt:
              new Date(),
  
            status: "reviewing",
  
            drafts,
          }),
  
        summary,
      };
    }
  
    validateDraft(
      draft: WonderStudioDraft,
      options: WonderContentValidatorOptions = {}
    ): WonderStudioDraft {
      return this.validator.validateAndAttach(
        draft,
        options
      );
    }
  
    // =========================================================
    // HUMAN REVIEW
    // =========================================================
  
    approveDraft(
      batch: WonderStudioBatch,
      draftId: string
    ): WonderStudioBatch {
      const targetId =
        normaliseRequiredText(
          draftId,
          "draftId"
        );
  
      let found = false;
  
      const drafts =
        batch.drafts.map(
          (draft) => {
            if (
              draft.id !==
              targetId
            ) {
              return cloneStudioDraft(
                draft
              );
            }
  
            found = true;
  
            if (
              !draft.validation
            ) {
              throw new Error(
                `WonderStudio: draft "${targetId}" must be validated before approval.`
              );
            }
  
            if (
              !draft.validation.valid
            ) {
              throw new Error(
                `WonderStudio: draft "${targetId}" failed validation and cannot be approved.`
              );
            }
  
            return {
              ...cloneStudioDraft(
                draft
              ),
  
              updatedAt:
                new Date(),
  
              status:
                "approved" as const,
            };
          }
        );
  
      if (!found) {
        throw new Error(
          `WonderStudio: draft "${targetId}" was not found.`
        );
      }
  
      return updateBatchStatistics({
        ...cloneStudioBatch(
          batch
        ),
  
        updatedAt:
          new Date(),
  
        status: "reviewing",
  
        drafts,
      });
    }
  
    approveValidDrafts(
      batch: WonderStudioBatch
    ): WonderStudioBatch {
      const drafts =
        batch.drafts.map(
          (draft) => {
            if (
              draft.validation
                ?.valid !== true
            ) {
              return cloneStudioDraft(
                draft
              );
            }
  
            if (
              draft.status ===
              "published"
            ) {
              return cloneStudioDraft(
                draft
              );
            }
  
            return {
              ...cloneStudioDraft(
                draft
              ),
  
              updatedAt:
                new Date(),
  
              status:
                "approved" as const,
            };
          }
        );
  
      return updateBatchStatistics({
        ...cloneStudioBatch(
          batch
        ),
  
        updatedAt:
          new Date(),
  
        status: "reviewing",
  
        drafts,
      });
    }
  
    rejectDraft(
      batch: WonderStudioBatch,
      draftId: string
    ): WonderStudioBatch {
      return this.setDraftStatus(
        batch,
        draftId,
        "rejected"
      );
    }
  
    returnDraftToReview(
      batch: WonderStudioBatch,
      draftId: string
    ): WonderStudioBatch {
      return this.setDraftStatus(
        batch,
        draftId,
        "needs-review"
      );
    }
  
    removeDraft(
      batch: WonderStudioBatch,
      draftId: string
    ): WonderStudioBatch {
      const cleanDraftId =
        normaliseRequiredText(
          draftId,
          "draftId"
        );
  
      const drafts =
        batch.drafts.filter(
          (draft) =>
            draft.id !==
            cleanDraftId
        );
  
      if (
        drafts.length ===
        batch.drafts.length
      ) {
        throw new Error(
          `WonderStudio: draft "${cleanDraftId}" was not found.`
        );
      }
  
      return updateBatchStatistics({
        ...cloneStudioBatch(
          batch
        ),
  
        updatedAt:
          new Date(),
  
        drafts,
      });
    }
  
    // =========================================================
    // IMPORT
    // =========================================================
  
    importBatch(
      batch: WonderStudioBatch,
      options: WonderContentImportOptions = {}
    ): WonderBatchImportResult {
      return this.importer.importBatch(
        batch,
        options
      );
    }
  
    previewDraft(
      draft: WonderStudioDraft,
      options: WonderContentImportOptions = {}
    ) {
      return this.importer.previewDraft(
        draft,
        options
      );
    }
  
    // =========================================================
    // PUBLISH
    // =========================================================
  
    publishBatch(
      batch: WonderStudioBatch,
      importOptions: WonderContentImportOptions = {},
      publisherOptions: WonderPublisherOptions = {}
    ): WonderStudioPublicationResult {
      const importResult =
        this.importBatch(
          batch,
          importOptions
        );
  
      const publishResult =
        this.publisher.publish(
          batch,
          importResult,
          publisherOptions
        );
  
      return {
        batch:
          publishResult.updatedBatch,
  
        importResult,
  
        publishResult,
      };
    }
  
    preparePublication(
      batch: WonderStudioBatch,
      importOptions: WonderContentImportOptions = {},
      publisherOptions: WonderPublisherOptions = {}
    ) {
      const importResult =
        this.importBatch(
          batch,
          importOptions
        );
  
      return this.publisher.prepare(
        batch,
        importResult,
        publisherOptions
      );
    }
  
    createExport(
      publishResult: WonderPublishResult,
      options: WonderPublisherOptions = {}
    ): WonderStudioExport {
      return this.publisher.createExport(
        publishResult,
        options
      );
    }
  
    // =========================================================
    // COMPLETE PIPELINE
    // =========================================================
  
    /**
     * Runs validation, optional automatic approval, import,
     * and publication.
     *
     * Generated AI JSON must already have been ingested.
     */
    runPipeline(
      batch: WonderStudioBatch,
      options: WonderStudioPipelineOptions = {}
    ): WonderStudioPipelineResult {
      const validationResult =
        this.validateBatchWithSummary(
          batch,
          options.validation
        );
  
      let workingBatch =
        validationResult.batch;
  
      workingBatch =
        this.approveValidDrafts(
          workingBatch
        );
  
      if (
        validationResult.summary
          .validDrafts === 0
      ) {
        return {
          success: false,
  
          batch:
            workingBatch,
  
          validation:
            validationResult.summary,
  
          importResult: null,
  
          publishResult: null,
  
          errors: [
            "WonderStudio: no valid drafts are available for publication.",
          ],
        };
      }
  
      const importResult =
        this.importBatch(
          workingBatch,
          options.import
        );
  
      if (
        importResult.totalImported ===
        0
      ) {
        return {
          success: false,
  
          batch:
            workingBatch,
  
          validation:
            validationResult.summary,
  
          importResult,
  
          publishResult: null,
  
          errors: [
            ...importResult.errors,
            "WonderStudio: no drafts were imported.",
          ],
        };
      }
  
      const publishResult =
        this.publisher.publish(
          workingBatch,
          importResult,
          options.publish
        );
  
      return {
        success:
          publishResult.success,
  
        batch:
          publishResult.updatedBatch,
  
        validation:
          validationResult.summary,
  
        importResult,
  
        publishResult,
  
        errors: [
          ...importResult.errors,
  
          ...publishResult.errors,
        ],
      };
    }
  
    // =========================================================
    // STATISTICS
    // =========================================================
  
    getStatistics(
      batch: WonderStudioBatch
    ): WonderStudioStatistics {
      if (
        batch.drafts.length === 0
      ) {
        return createEmptyStudioStatistics();
      }
  
      const totalDrafts =
        batch.drafts.length;
  
      const generatedDrafts =
        batch.drafts.filter(
          (draft) =>
            draft.status ===
            "generated"
        ).length;
  
      const reviewDrafts =
        batch.drafts.filter(
          (draft) =>
            draft.status ===
              "needs-review" ||
            draft.status ===
              "validating"
        ).length;
  
      const approvedDrafts =
        batch.drafts.filter(
          (draft) =>
            draft.status ===
            "approved"
        ).length;
  
      const rejectedDrafts =
        batch.drafts.filter(
          (draft) =>
            draft.status ===
            "rejected"
        ).length;
  
      const publishedDrafts =
        batch.drafts.filter(
          (draft) =>
            draft.status ===
            "published"
        ).length;
  
      const scoredDrafts =
        batch.drafts.filter(
          (draft) =>
            draft.validation !==
            null
        );
  
      const averageQualityScore =
        scoredDrafts.length > 0
          ? roundNumber(
              scoredDrafts.reduce(
                (
                  total,
                  draft
                ) =>
                  total +
                  (
                    draft.validation
                      ?.scores.overall ??
                    0
                  ),
                0
              ) /
                scoredDrafts.length,
              1
            )
          : 0;
  
      const validDrafts =
        batch.drafts.filter(
          (draft) =>
            draft.validation
              ?.valid === true
        ).length;
  
      return {
        totalDrafts,
  
        generatedDrafts,
  
        reviewDrafts,
  
        approvedDrafts,
  
        rejectedDrafts,
  
        publishedDrafts,
  
        averageQualityScore,
  
        validationPassRate:
          percentage(
            validDrafts,
            totalDrafts
          ),
  
        publicationRate:
          percentage(
            publishedDrafts,
            totalDrafts
          ),
      };
    }
  
    // =========================================================
    // INTERNAL STATUS
    // =========================================================
  
    private setDraftStatus(
      batch: WonderStudioBatch,
      draftId: string,
      status: WonderStudioDraftStatus
    ): WonderStudioBatch {
      const targetId =
        normaliseRequiredText(
          draftId,
          "draftId"
        );
  
      let found = false;
  
      const drafts =
        batch.drafts.map(
          (draft) => {
            if (
              draft.id !==
              targetId
            ) {
              return cloneStudioDraft(
                draft
              );
            }
  
            found = true;
  
            return {
              ...cloneStudioDraft(
                draft
              ),
  
              updatedAt:
                new Date(),
  
              status,
            };
          }
        );
  
      if (!found) {
        throw new Error(
          `WonderStudio: draft "${targetId}" was not found.`
        );
      }
  
      return updateBatchStatistics({
        ...cloneStudioBatch(
          batch
        ),
  
        updatedAt:
          new Date(),
  
        status: "reviewing",
  
        drafts,
      });
    }
  }
  
  // =========================================================
  // GENERATED RESPONSE PARSING
  // =========================================================
  
  function parseGeneratedResponse(
    value: unknown,
    batch: WonderStudioBatch,
    errors: string[]
  ): WonderGeneratedResponse | null {
    if (!isRecord(value)) {
      errors.push(
        "Generated response must be a JSON object."
      );
  
      return null;
    }
  
    const batchId =
      safeText(
        value.batchId,
        batch.id
      );
  
    const contentType =
      isContentType(
        value.contentType
      )
        ? value.contentType
        : batch.request
            .contentType;
  
    if (
      contentType !==
      batch.request.contentType
    ) {
      errors.push(
        `Generated content type "${contentType}" does not match batch content type "${batch.request.contentType}".`
      );
  
      return null;
    }
  
    if (
      !Array.isArray(
        value.items
      )
    ) {
      errors.push(
        'Generated response must contain an "items" array.'
      );
  
      return null;
    }
  
    const items =
      value.items
        .map(
          (
            item,
            index
          ): WonderGeneratedItem | null =>
            parseGeneratedItem(
              item,
              index,
              errors
            )
        )
        .filter(
          (
            item
          ): item is WonderGeneratedItem =>
            item !== null
        );
  
    if (items.length === 0) {
      errors.push(
        "Generated response does not contain any valid items."
      );
  
      return null;
    }
  
    return {
      batchId,
  
      contentType,
  
      items,
    };
  }
  
  function parseGeneratedItem(
    value: unknown,
    index: number,
    errors: string[]
  ): WonderGeneratedItem | null {
    if (!isRecord(value)) {
      errors.push(
        `Item ${index + 1} must be an object.`
      );
  
      return null;
    }
  
    const temporaryId =
      safeText(
        value.temporaryId,
        `item-${String(
          index + 1
        ).padStart(3, "0")}`
      );
  
    return {
      temporaryId,
  
      metadata:
        isRecord(value.metadata)
          ? value.metadata
          : null,
  
      story:
        isRecord(value.story)
          ? value.story
          : null,
  
      mission:
        isRecord(value.mission)
          ? value.mission
          : null,
    };
  }
  
  // =========================================================
  // DRAFT CREATION
  // =========================================================
  
  function createDraftFromGeneratedItem({
    batch,
    response,
    item,
    index,
    sourcePrompt,
    sourceModel,
  }: {
    batch: WonderStudioBatch;
  
    response: WonderGeneratedResponse;
  
    item: WonderGeneratedItem;
  
    index: number;
  
    sourcePrompt: string;
  
    sourceModel: string | null;
  }): WonderStudioDraft {
    const now = new Date();
  
    const metadata =
      createDraftMetadata(
        batch.request,
        item.metadata
      );
  
    const contentType =
      response.contentType;
  
    const story =
      contentType === "story" ||
      contentType === "adventure"
        ? createStoryContent(
            item.story
          )
        : null;
  
    const mission =
      contentType === "mission" ||
      contentType === "adventure"
        ? createMissionContent(
            item.mission
          )
        : null;
  
    if (
      (
        contentType === "story" ||
        contentType === "adventure"
      ) &&
      !story
    ) {
      throw new Error(
        "Story content is missing."
      );
    }
  
    if (
      (
        contentType === "mission" ||
        contentType === "adventure"
      ) &&
      !mission
    ) {
      throw new Error(
        "Mission content is missing."
      );
    }
  
    return {
      id:
        createDraftId({
          batchId:
            batch.id,
  
          temporaryId:
            item.temporaryId,
  
          index,
        }),
  
      batchId:
        batch.id,
  
      version: 1,
  
      createdAt:
        new Date(
          now.getTime()
        ),
  
      updatedAt:
        new Date(
          now.getTime()
        ),
  
      status: "generated",
  
      contentType,
  
      metadata,
  
      story,
  
      mission,
  
      sourcePrompt,
  
      sourceModel,
  
      validation: null,
    };
  }
  
  function createDraftMetadata(
    request: WonderStudioGenerationRequest,
    metadata:
      | Partial<WonderStudioDraftMetadata>
      | null
  ): WonderStudioDraftMetadata {
    const generatedAgeRange =
      readAgeRange(
        metadata?.ageRange
      );
  
    return {
      friendId:
        safeText(
          metadata?.friendId,
          request.friendId
        ),
  
      worldId:
        safeText(
          metadata?.worldId,
          request.worldId
        ),
  
      valueId:
        safeText(
          metadata?.valueId,
          request.valueId
        ),
  
      templateId:
        safeText(
          metadata?.templateId,
          request.templateId
        ),
  
      language:
        safeText(
          metadata?.language,
          request.language
        ),
  
      locale:
        safeText(
          metadata?.locale,
          request.locale
        ),
  
      ageRange:
        normaliseAgeRange(
          generatedAgeRange ??
            request.ageRange
        ),
  
      difficulty:
        isDifficulty(
          metadata?.difficulty
        )
          ? metadata.difficulty
          : request.difficulty,
  
      duration:
        normalisePositiveInteger(
          metadata?.duration,
          request.duration
        ),
  
      emotion:
        safeText(
          metadata?.emotion,
          request.emotion ??
            "wonder"
        ),
  
      location:
        safeText(
          metadata?.location,
          request.location ??
            "Wonder Village"
        ),
  
      tags:
        uniqueStrings([
          ...(request.tags ??
            []),
  
          ...readStringArray(
            metadata?.tags
          ),
        ]),
    };
  }
  
  function createStoryContent(
    value:
      | Partial<WonderStudioStoryContent>
      | null
  ): WonderStudioStoryContent | null {
    if (!value) {
      return null;
    }
  
    return {
      title:
        safeText(
          value.title,
          ""
        ),
  
      intro:
        safeText(
          value.intro,
          ""
        ),
  
      problem:
        safeText(
          value.problem,
          ""
        ),
  
      goal:
        safeText(
          value.goal,
          ""
        ),
  
      closing:
        safeText(
          value.closing,
          ""
        ),
    };
  }
  
  function createMissionContent(
    value:
      | Partial<WonderStudioMissionContent>
      | null
  ): WonderStudioMissionContent | null {
    if (!value) {
      return null;
    }
  
    return {
      title:
        safeText(
          value.title,
          ""
        ),
  
      objective:
        safeText(
          value.objective,
          ""
        ),
  
      activity:
        safeText(
          value.activity,
          ""
        ),
  
      successMessage:
        safeText(
          value.successMessage,
          ""
        ),
  
      supplies:
        readStringArray(
          value.supplies
        ),
    };
  }
  
  // =========================================================
  // BATCH STATISTICS
  // =========================================================
  
  function updateBatchStatistics(
    batch: WonderStudioBatch
  ): WonderStudioBatch {
    const totalGenerated =
      batch.drafts.length;
  
    const totalValid =
      batch.drafts.filter(
        (draft) =>
          draft.validation
            ?.valid === true
      ).length;
  
    const totalApproved =
      batch.drafts.filter(
        (draft) =>
          draft.status ===
            "approved" ||
          draft.status ===
            "published"
      ).length;
  
    const totalRejected =
      batch.drafts.filter(
        (draft) =>
          draft.status ===
          "rejected"
      ).length;
  
    return {
      ...cloneStudioBatch(
        batch
      ),
  
      totalGenerated,
  
      totalValid,
  
      totalApproved,
  
      totalRejected,
    };
  }
  
  // =========================================================
  // REQUEST NORMALISATION
  // =========================================================
  
  function normaliseGenerationRequest(
    request: WonderStudioGenerationRequest
  ): WonderStudioGenerationRequest {
    const ageRange =
      normaliseAgeRange(
        request.ageRange
      );
  
    return {
      ...request,
  
      id:
        normaliseRequiredText(
          request.id,
          "id"
        ),
  
      createdAt:
        isValidDate(
          request.createdAt
        )
          ? new Date(
              request.createdAt.getTime()
            )
          : new Date(),
  
      contentType:
        request.contentType,
  
      quantity:
        clampInteger(
          request.quantity,
          MINIMUM_QUANTITY,
          MAXIMUM_QUANTITY
        ),
  
      language:
        safeText(
          request.language,
          DEFAULT_LANGUAGE
        ),
  
      locale:
        safeText(
          request.locale,
          DEFAULT_LOCALE
        ),
  
      friendId:
        normaliseRequiredText(
          request.friendId,
          "friendId"
        ),
  
      worldId:
        normaliseRequiredText(
          request.worldId,
          "worldId"
        ),
  
      valueId:
        normaliseRequiredText(
          request.valueId,
          "valueId"
        ),
  
      templateId:
        normaliseRequiredText(
          request.templateId,
          "templateId"
        ),
  
      ageRange,
  
      difficulty:
        request.difficulty,
  
      duration:
        normalisePositiveInteger(
          request.duration,
          DEFAULT_DURATION
        ),
  
      emotion:
        normaliseOptionalText(
          request.emotion
        ),
  
      location:
        normaliseOptionalText(
          request.location
        ),
  
      archetypeId:
        normaliseOptionalText(
          request.archetypeId
        ),
  
      titleDirection:
        normaliseOptionalText(
          request.titleDirection
        ),
  
      creativeDirection:
        normaliseOptionalText(
          request.creativeDirection
        ),
  
      learningObjective:
        normaliseOptionalText(
          request.learningObjective
        ),
  
      requiredWords:
        uniqueStrings(
          request.requiredWords ??
            []
        ),
  
      bannedWords:
        uniqueStrings(
          request.bannedWords ??
            []
        ),
  
      tags:
        uniqueStrings(
          request.tags ??
            []
        ),
  
      seed:
        normaliseOptionalText(
          request.seed
        ),
    };
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneGenerationRequest(
    request: WonderStudioGenerationRequest
  ): WonderStudioGenerationRequest {
    return {
      ...request,
  
      createdAt:
        new Date(
          request.createdAt.getTime()
        ),
  
      ageRange: {
        ...request.ageRange,
      },
  
      requiredWords: [
        ...(request.requiredWords ??
          []),
      ],
  
      bannedWords: [
        ...(request.bannedWords ??
          []),
      ],
  
      tags: [
        ...(request.tags ?? []),
      ],
    };
  }
  
  function cloneStudioBatch(
    batch: WonderStudioBatch
  ): WonderStudioBatch {
    return {
      ...batch,
  
      createdAt:
        new Date(
          batch.createdAt.getTime()
        ),
  
      updatedAt:
        new Date(
          batch.updatedAt.getTime()
        ),
  
      request:
        cloneGenerationRequest(
          batch.request
        ),
  
      drafts:
        batch.drafts.map(
          cloneStudioDraft
        ),
    };
  }
  
  function cloneStudioDraft(
    draft: WonderStudioDraft
  ): WonderStudioDraft {
    return {
      ...draft,
  
      createdAt:
        new Date(
          draft.createdAt.getTime()
        ),
  
      updatedAt:
        new Date(
          draft.updatedAt.getTime()
        ),
  
      metadata: {
        ...draft.metadata,
  
        ageRange: {
          ...draft.metadata
            .ageRange,
        },
  
        tags: [
          ...draft.metadata.tags,
        ],
      },
  
      story:
        draft.story
          ? {
              ...draft.story,
            }
          : null,
  
      mission:
        draft.mission
          ? {
              ...draft.mission,
  
              supplies: [
                ...draft.mission
                  .supplies,
              ],
            }
          : null,
  
      validation:
        draft.validation
          ? cloneValidationResult(
              draft.validation
            )
          : null,
    };
  }
  
  function cloneValidationResult(
    result: NonNullable<
      WonderStudioDraft["validation"]
    >
  ): NonNullable<
    WonderStudioDraft["validation"]
  > {
    return {
      ...result,
  
      validatedAt:
        new Date(
          result.validatedAt.getTime()
        ),
  
      issues:
        result.issues.map(
          (issue) => ({
            ...issue,
          })
        ),
  
      scores: {
        ...result.scores,
      },
    };
  }
  
  // =========================================================
  // VALUE READERS
  // =========================================================
  
  function readAgeRange(
    value: unknown
  ): WonderStudioAgeRange | null {
    if (!isRecord(value)) {
      return null;
    }
  
    if (
      typeof value.min !==
        "number" ||
      typeof value.max !==
        "number"
    ) {
      return null;
    }
  
    return {
      min:
        value.min,
  
      max:
        value.max,
    };
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
          typeof item ===
          "string"
      )
    );
  }
  
  // =========================================================
  // IDS
  // =========================================================
  
  function createBatchId({
    contentType,
    friendId,
    worldId,
    valueId,
    createdAt,
  }: {
    contentType: WonderStudioContentType;
  
    friendId: string;
  
    worldId: string;
  
    valueId: string;
  
    createdAt: Date;
  }): string {
    const source = [
      contentType,
      friendId,
      worldId,
      valueId,
      createdAt.toISOString(),
    ].join(":");
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(7, "0");
  
    return [
      "wonder-studio",
      createSlug(
        contentType
      ),
      createSlug(
        worldId
      ),
      createSlug(
        valueId
      ),
      hash,
    ]
      .filter(Boolean)
      .join("-");
  }
  
  function createDraftId({
    batchId,
    temporaryId,
    index,
  }: {
    batchId: string;
  
    temporaryId: string;
  
    index: number;
  }): string {
    const readableId =
      createSlug(
        temporaryId
      ) ||
      `item-${index + 1}`;
  
    const source = [
      batchId,
      temporaryId,
      index,
    ].join(":");
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(7, "0");
  
    return [
      createSlug(batchId),
      readableId,
      hash,
    ]
      .filter(Boolean)
      .join("-");
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
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
  
  function isContentType(
    value: unknown
  ): value is WonderStudioContentType {
    return (
      value === "story" ||
      value === "mission" ||
      value === "adventure"
    );
  }
  
  function isDifficulty(
    value: unknown
  ): value is WonderStudioGenerationRequest["difficulty"] {
    return (
      value === "easy" ||
      value === "medium" ||
      value === "hard"
    );
  }
  
  function normaliseAgeRange(
    value: WonderStudioAgeRange
  ): WonderStudioAgeRange {
    const minimum =
      clampInteger(
        value.min,
        0,
        17
      );
  
    const maximum =
      clampInteger(
        value.max,
        minimum,
        17
      );
  
    return {
      min:
        minimum,
  
      max:
        maximum,
    };
  }
  
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
        `WonderStudio: "${fieldName}" is required.`
      );
    }
  
    return cleaned;
  }
  
  function normaliseOptionalText(
    value:
      | string
      | null
      | undefined
  ): string | undefined {
    if (
      typeof value !==
      "string"
    ) {
      return undefined;
    }
  
    const cleaned =
      value.trim();
  
    return cleaned.length > 0
      ? cleaned
      : undefined;
  }
  
  function normaliseNullableText(
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
  
    return cleaned.length > 0
      ? cleaned
      : null;
  }
  
  function safeText(
    value: unknown,
    fallback: string
  ): string {
    if (
      typeof value !==
      "string"
    ) {
      return fallback;
    }
  
    const cleaned =
      value.trim();
  
    return cleaned.length > 0
      ? cleaned
      : fallback;
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
  
  function normalisePositiveInteger(
    value: unknown,
    fallback: number
  ): number {
    if (
      typeof value !==
        "number" ||
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
    if (!Number.isFinite(value)) {
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
  
  function percentage(
    value: number,
    total: number
  ): number {
    if (total <= 0) {
      return 0;
    }
  
    return roundNumber(
      (
        value /
        total
      ) * 100,
      1
    );
  }
  
  function roundNumber(
    value: number,
    decimalPlaces: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
  
    const multiplier =
      10 **
      Math.max(
        0,
        Math.floor(
          decimalPlaces
        )
      );
  
    return (
      Math.round(
        value * multiplier
      ) / multiplier
    );
  }
  
  function createSlug(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
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
  
  export const wonderStudio =
    new WonderStudio();
  
  export default WonderStudio;