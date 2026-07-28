import type {
    WonderStudioBatch,
    WonderStudioContentType,
    WonderStudioDraft,
    WonderStudioImportRecord,
    WonderStudioMissionContent,
    WonderStudioStoryContent,
  } from "../types/WonderStudioTypes";
  
  import type { WonderMission } from "@/types/wonderMission";
  import type { WonderStory } from "@/types/wonderStory";
  
  export interface WonderImportedStory {
    draftId: string;
  
    batchId: string;
  
    story: WonderStory;
  
    metadata: WonderImportedContentMetadata;
  }
  
  export interface WonderImportedMission {
    draftId: string;
  
    batchId: string;
  
    mission: WonderMission;
  
    metadata: WonderImportedContentMetadata;
  }
  
  export interface WonderImportedAdventure {
    draftId: string;
  
    batchId: string;
  
    story: WonderStory;
  
    mission: WonderMission;
  
    metadata: WonderImportedContentMetadata;
  }
  
  export interface WonderImportedContentMetadata {
    friendId: string;
  
    worldId: string;
  
    valueId: string;
  
    templateId: string;
  
    language: string;
  
    locale: string;
  
    ageRange: {
      min: number;
  
      max: number;
    };
  
    difficulty:
      | "easy"
      | "medium"
      | "hard";
  
    duration: number;
  
    emotion: string;
  
    location: string;
  
    tags: string[];
  }
  
  export interface WonderContentImportOptions {
    /**
     * By default, only approved drafts may be imported.
     *
     * Set this to true for development previews.
     */
    allowNeedsReview?: boolean;
  
    /**
     * Published drafts are normally allowed to be imported again.
     */
    allowPublished?: boolean;
  
    /**
     * Require a successful validation result.
     */
    requireValidValidation?: boolean;
  
    /**
     * Optional destination label used in import records.
     *
     * Examples:
     * - runtime-catalog
     * - preview-catalog
     * - wonder-family-en
     */
    destination?: string;
  
    /**
     * Optional ID prefix for generated runtime objects.
     */
    idPrefix?: string;
  }
  
  export interface WonderDraftImportResult {
    success: boolean;
  
    draftId: string;
  
    contentType: WonderStudioContentType;
  
    story: WonderImportedStory | null;
  
    mission: WonderImportedMission | null;
  
    adventure: WonderImportedAdventure | null;
  
    record: WonderStudioImportRecord;
  
    errors: string[];
  }
  
  export interface WonderBatchImportResult {
    success: boolean;
  
    batchId: string;
  
    importedAt: Date;
  
    totalDrafts: number;
  
    totalImported: number;
  
    totalRejected: number;
  
    stories: WonderImportedStory[];
  
    missions: WonderImportedMission[];
  
    adventures: WonderImportedAdventure[];
  
    records: WonderStudioImportRecord[];
  
    rejectedDraftIds: string[];
  
    errors: string[];
  }
  
  interface ResolvedImportOptions {
    allowNeedsReview: boolean;
  
    allowPublished: boolean;
  
    requireValidValidation: boolean;
  
    destination: string;
  
    idPrefix: string;
  }
  
  const DEFAULT_DESTINATION =
    "wonder-runtime-catalog";
  
  const DEFAULT_ID_PREFIX =
    "wonder";
  
  const MAX_ID_LENGTH = 160;
  
  /**
   * Converts validated Wonder Studio drafts into runtime-compatible
   * WonderStory and WonderMission objects.
   *
   * This class does not write files directly.
   *
   * Its responsibility is to transform approved Studio content into
   * clean catalog-ready data that can later be published as JSON,
   * TypeScript modules, database records, or another destination.
   */
  export class WonderContentImporter {
    // =========================================================
    // SINGLE DRAFT
    // =========================================================
  
    importDraft(
      draft: WonderStudioDraft,
      options: WonderContentImportOptions = {}
    ): WonderDraftImportResult {
      const resolvedOptions =
        resolveImportOptions(options);
  
      const importedAt =
        new Date();
  
      const errors =
        validateDraftForImport(
          draft,
          resolvedOptions
        );
  
      if (errors.length > 0) {
        return {
          success: false,
  
          draftId:
            safeText(
              draft.id,
              "unknown-draft"
            ),
  
          contentType:
            draft.contentType,
  
          story: null,
  
          mission: null,
  
          adventure: null,
  
          record:
            createImportRecord({
              draft,
              importedAt,
              destination:
                resolvedOptions.destination,
              success: false,
              message:
                errors.join(" "),
            }),
  
          errors,
        };
      }
  
      try {
        const metadata =
          createImportedMetadata(
            draft
          );
  
        switch (draft.contentType) {
          case "story": {
            const story =
              this.importStoryDraft(
                draft,
                metadata,
                resolvedOptions
              );
  
            return {
              success: true,
  
              draftId: draft.id,
  
              contentType:
                draft.contentType,
  
              story,
  
              mission: null,
  
              adventure: null,
  
              record:
                createImportRecord({
                  draft,
                  importedAt,
                  destination:
                    resolvedOptions.destination,
                  success: true,
                  message:
                    `Story "${story.story.id}" imported successfully.`,
                }),
  
              errors: [],
            };
          }
  
          case "mission": {
            const mission =
              this.importMissionDraft(
                draft,
                metadata,
                resolvedOptions
              );
  
            return {
              success: true,
  
              draftId: draft.id,
  
              contentType:
                draft.contentType,
  
              story: null,
  
              mission,
  
              adventure: null,
  
              record:
                createImportRecord({
                  draft,
                  importedAt,
                  destination:
                    resolvedOptions.destination,
                  success: true,
                  message:
                    `Mission "${mission.mission.id}" imported successfully.`,
                }),
  
              errors: [],
            };
          }
  
          case "adventure": {
            const adventure =
              this.importAdventureDraft(
                draft,
                metadata,
                resolvedOptions
              );
  
            return {
              success: true,
  
              draftId: draft.id,
  
              contentType:
                draft.contentType,
  
              story: {
                draftId:
                  adventure.draftId,
  
                batchId:
                  adventure.batchId,
  
                story: {
                  ...adventure.story,
                },
  
                metadata:
                  cloneImportedMetadata(
                    adventure.metadata
                  ),
              },
  
              mission: {
                draftId:
                  adventure.draftId,
  
                batchId:
                  adventure.batchId,
  
                mission: {
                  ...adventure.mission,
                },
  
                metadata:
                  cloneImportedMetadata(
                    adventure.metadata
                  ),
              },
  
              adventure,
  
              record:
                createImportRecord({
                  draft,
                  importedAt,
                  destination:
                    resolvedOptions.destination,
                  success: true,
                  message:
                    `Adventure "${draft.id}" imported successfully.`,
                }),
  
              errors: [],
            };
          }
  
          default:
            return assertNever(
              draft.contentType
            );
        }
      } catch (error) {
        const message =
          getErrorMessage(error);
  
        return {
          success: false,
  
          draftId:
            safeText(
              draft.id,
              "unknown-draft"
            ),
  
          contentType:
            draft.contentType,
  
          story: null,
  
          mission: null,
  
          adventure: null,
  
          record:
            createImportRecord({
              draft,
              importedAt,
              destination:
                resolvedOptions.destination,
              success: false,
              message,
            }),
  
          errors: [
            message,
          ],
        };
      }
    }
  
    // =========================================================
    // MULTIPLE DRAFTS
    // =========================================================
  
    importDrafts(
      drafts: readonly WonderStudioDraft[],
      options: WonderContentImportOptions = {}
    ): WonderBatchImportResult {
      const importedAt =
        new Date();
  
      const results =
        drafts.map(
          (draft) =>
            this.importDraft(
              draft,
              options
            )
        );
  
      const stories =
        results
          .map(
            (result) =>
              result.story
          )
          .filter(
            (
              story
            ): story is WonderImportedStory =>
              story !== null
          );
  
      const missions =
        results
          .map(
            (result) =>
              result.mission
          )
          .filter(
            (
              mission
            ): mission is WonderImportedMission =>
              mission !== null
          );
  
      const adventures =
        results
          .map(
            (result) =>
              result.adventure
          )
          .filter(
            (
              adventure
            ): adventure is WonderImportedAdventure =>
              adventure !== null
          );
  
      const rejectedResults =
        results.filter(
          (result) =>
            !result.success
        );
  
      const batchIds =
        Array.from(
          new Set(
            drafts
              .map(
                (draft) =>
                  draft.batchId
              )
              .filter(hasText)
          )
        );
  
      const batchId =
        batchIds.length === 1
          ? batchIds[0]
          : createMixedBatchId(
              drafts
            );
  
      return {
        success:
          results.length > 0 &&
          rejectedResults.length === 0,
  
        batchId,
  
        importedAt,
  
        totalDrafts:
          drafts.length,
  
        totalImported:
          results.length -
          rejectedResults.length,
  
        totalRejected:
          rejectedResults.length,
  
        stories:
          stories.map(
            cloneImportedStory
          ),
  
        missions:
          missions.map(
            cloneImportedMission
          ),
  
        adventures:
          adventures.map(
            cloneImportedAdventure
          ),
  
        records:
          results.map(
            (result) => ({
              ...result.record,
  
              importedAt:
                new Date(
                  result.record
                    .importedAt
                    .getTime()
                ),
            })
          ),
  
        rejectedDraftIds:
          rejectedResults.map(
            (result) =>
              result.draftId
          ),
  
        errors:
          rejectedResults.flatMap(
            (result) =>
              result.errors.map(
                (error) =>
                  `${result.draftId}: ${error}`
              )
          ),
      };
    }
  
    // =========================================================
    // BATCH
    // =========================================================
  
    importBatch(
      batch: WonderStudioBatch,
      options: WonderContentImportOptions = {}
    ): WonderBatchImportResult {
      const result =
        this.importDrafts(
          batch.drafts,
          options
        );
  
      return {
        ...result,
  
        batchId:
          safeText(
            batch.id,
            result.batchId
          ),
      };
    }
  
    // =========================================================
    // PREVIEW
    // =========================================================
  
    /**
     * Converts a draft without requiring approval.
     *
     * Validation is still required by default.
     */
    previewDraft(
      draft: WonderStudioDraft,
      options: WonderContentImportOptions = {}
    ): WonderDraftImportResult {
      return this.importDraft(
        draft,
        {
          ...options,
  
          allowNeedsReview: true,
  
          destination:
            options.destination ??
            "wonder-preview-catalog",
        }
      );
    }
  
    // =========================================================
    // STORY
    // =========================================================
  
    private importStoryDraft(
      draft: WonderStudioDraft,
      metadata: WonderImportedContentMetadata,
      options: ResolvedImportOptions
    ): WonderImportedStory {
      if (!draft.story) {
        throw new Error(
          "WonderContentImporter: story content is missing."
        );
      }
  
      return {
        draftId:
          draft.id,
  
        batchId:
          draft.batchId,
  
        story:
          createRuntimeStory(
            draft,
            draft.story,
            options
          ),
  
        metadata:
          cloneImportedMetadata(
            metadata
          ),
      };
    }
  
    // =========================================================
    // MISSION
    // =========================================================
  
    private importMissionDraft(
      draft: WonderStudioDraft,
      metadata: WonderImportedContentMetadata,
      options: ResolvedImportOptions
    ): WonderImportedMission {
      if (!draft.mission) {
        throw new Error(
          "WonderContentImporter: mission content is missing."
        );
      }
  
      return {
        draftId:
          draft.id,
  
        batchId:
          draft.batchId,
  
        mission:
          createRuntimeMission(
            draft,
            draft.mission,
            options
          ),
  
        metadata:
          cloneImportedMetadata(
            metadata
          ),
      };
    }
  
    // =========================================================
    // ADVENTURE
    // =========================================================
  
    private importAdventureDraft(
      draft: WonderStudioDraft,
      metadata: WonderImportedContentMetadata,
      options: ResolvedImportOptions
    ): WonderImportedAdventure {
      if (!draft.story) {
        throw new Error(
          "WonderContentImporter: adventure story is missing."
        );
      }
  
      if (!draft.mission) {
        throw new Error(
          "WonderContentImporter: adventure mission is missing."
        );
      }
  
      return {
        draftId:
          draft.id,
  
        batchId:
          draft.batchId,
  
        story:
          createRuntimeStory(
            draft,
            draft.story,
            options
          ),
  
        mission:
          createRuntimeMission(
            draft,
            draft.mission,
            options
          ),
  
        metadata:
          cloneImportedMetadata(
            metadata
          ),
      };
    }
  }
  
  // =========================================================
  // RUNTIME CONTENT CREATION
  // =========================================================
  
  function createRuntimeStory(
    draft: WonderStudioDraft,
    story: WonderStudioStoryContent,
    options: ResolvedImportOptions
  ): WonderStory {
    return {
      id:
        createRuntimeContentId({
          prefix:
            options.idPrefix,
  
          contentType:
            "story",
  
          draft,
        }),
  
      title:
        requiredText(
          story.title,
          "story.title"
        ),
  
      intro:
        requiredText(
          story.intro,
          "story.intro"
        ),
  
      problem:
        requiredText(
          story.problem,
          "story.problem"
        ),
  
      goal:
        requiredText(
          story.goal,
          "story.goal"
        ),
  
      closing:
        requiredText(
          story.closing,
          "story.closing"
        ),
    };
  }
  
  function createRuntimeMission(
    draft: WonderStudioDraft,
    mission: WonderStudioMissionContent,
    options: ResolvedImportOptions
  ): WonderMission {
    return {
      id:
        createRuntimeContentId({
          prefix:
            options.idPrefix,
  
          contentType:
            "mission",
  
          draft,
        }),
  
      title:
        requiredText(
          mission.title,
          "mission.title"
        ),
  
      objective:
        requiredText(
          mission.objective,
          "mission.objective"
        ),
  
      activity:
        createMissionActivity(
          mission
        ),
  
      successMessage:
        requiredText(
          mission.successMessage,
          "mission.successMessage"
        ),
    };
  }
  
  /**
   * WonderMission currently stores supplies inside the activity text.
   *
   * The Studio preserves supplies separately in imported metadata,
   * while the runtime mission receives a complete readable activity.
   */
  function createMissionActivity(
    mission: WonderStudioMissionContent
  ): string {
    const activity =
      requiredText(
        mission.activity,
        "mission.activity"
      );
  
    const supplies =
      normaliseStringArray(
        mission.supplies
      );
  
    if (
      supplies.length === 0
    ) {
      return activity;
    }
  
    return [
      activity,
  
      `Supplies: ${supplies.join(", ")}.`,
    ].join("\n\n");
  }
  
  // =========================================================
  // METADATA
  // =========================================================
  
  function createImportedMetadata(
    draft: WonderStudioDraft
  ): WonderImportedContentMetadata {
    const metadata =
      draft.metadata;
  
    return {
      friendId:
        requiredText(
          metadata.friendId,
          "metadata.friendId"
        ),
  
      worldId:
        requiredText(
          metadata.worldId,
          "metadata.worldId"
        ),
  
      valueId:
        requiredText(
          metadata.valueId,
          "metadata.valueId"
        ),
  
      templateId:
        requiredText(
          metadata.templateId,
          "metadata.templateId"
        ),
  
      language:
        requiredText(
          metadata.language,
          "metadata.language"
        ),
  
      locale:
        requiredText(
          metadata.locale,
          "metadata.locale"
        ),
  
      ageRange: {
        min:
          normaliseNonNegativeInteger(
            metadata.ageRange.min
          ),
  
        max:
          Math.max(
            normaliseNonNegativeInteger(
              metadata.ageRange.min
            ),
  
            normaliseNonNegativeInteger(
              metadata.ageRange.max
            )
          ),
      },
  
      difficulty:
        metadata.difficulty,
  
      duration:
        normalisePositiveInteger(
          metadata.duration,
          5
        ),
  
      emotion:
        requiredText(
          metadata.emotion,
          "metadata.emotion"
        ),
  
      location:
        requiredText(
          metadata.location,
          "metadata.location"
        ),
  
      tags:
        normaliseStringArray(
          metadata.tags
        ),
    };
  }
  
  // =========================================================
  // IMPORT VALIDATION
  // =========================================================
  
  function validateDraftForImport(
    draft: WonderStudioDraft,
    options: ResolvedImportOptions
  ): string[] {
    const errors: string[] = [];
  
    if (!hasText(draft.id)) {
      errors.push(
        "Draft ID is required."
      );
    }
  
    if (!hasText(draft.batchId)) {
      errors.push(
        "Batch ID is required."
      );
    }
  
    if (
      !isValidDate(
        draft.createdAt
      )
    ) {
      errors.push(
        "Draft createdAt is invalid."
      );
    }
  
    if (
      !isValidDate(
        draft.updatedAt
      )
    ) {
      errors.push(
        "Draft updatedAt is invalid."
      );
    }
  
    if (
      !canImportStatus(
        draft.status,
        options
      )
    ) {
      errors.push(
        `Draft status "${draft.status}" cannot be imported.`
      );
    }
  
    if (
      options.requireValidValidation
    ) {
      if (!draft.validation) {
        errors.push(
          "Draft must be validated before import."
        );
      } else if (
        !draft.validation.valid
      ) {
        errors.push(
          "Draft validation did not pass."
        );
      }
    }
  
    if (!draft.metadata) {
      errors.push(
        "Draft metadata is required."
      );
    }
  
    switch (draft.contentType) {
      case "story":
        if (!draft.story) {
          errors.push(
            "Story content is required."
          );
        }
  
        break;
  
      case "mission":
        if (!draft.mission) {
          errors.push(
            "Mission content is required."
          );
        }
  
        break;
  
      case "adventure":
        if (!draft.story) {
          errors.push(
            "Adventure story content is required."
          );
        }
  
        if (!draft.mission) {
          errors.push(
            "Adventure mission content is required."
          );
        }
  
        break;
  
      default:
        errors.push(
          "Draft content type is invalid."
        );
    }
  
    return errors;
  }
  
  function canImportStatus(
    status: WonderStudioDraft["status"],
    options: ResolvedImportOptions
  ): boolean {
    if (status === "approved") {
      return true;
    }
  
    if (
      status === "published" &&
      options.allowPublished
    ) {
      return true;
    }
  
    if (
      status === "needs-review" &&
      options.allowNeedsReview
    ) {
      return true;
    }
  
    return false;
  }
  
  // =========================================================
  // IMPORT RECORDS
  // =========================================================
  
  function createImportRecord({
    draft,
    importedAt,
    destination,
    success,
    message,
  }: {
    draft: WonderStudioDraft;
  
    importedAt: Date;
  
    destination: string;
  
    success: boolean;
  
    message: string;
  }): WonderStudioImportRecord {
    const source = [
      draft.id,
      draft.batchId,
      destination,
      success ? "success" : "failed",
      importedAt.toISOString(),
    ].join(":");
  
    return {
      id:
        `wonder-import-${hashText(
          source
        )
          .toString(36)
          .padStart(
            7,
            "0"
          )}`,
  
      draftId:
        safeText(
          draft.id,
          "unknown-draft"
        ),
  
      importedAt:
        new Date(
          importedAt.getTime()
        ),
  
      contentType:
        draft.contentType,
  
      destination,
  
      success,
  
      message,
    };
  }
  
  // =========================================================
  // CONTENT IDS
  // =========================================================
  
  function createRuntimeContentId({
    prefix,
    contentType,
    draft,
  }: {
    prefix: string;
  
    contentType:
      | "story"
      | "mission";
  
    draft: WonderStudioDraft;
  }): string {
    const readableParts = [
      createSlug(prefix),
      contentType,
      createSlug(
        draft.metadata.worldId
      ),
      createSlug(
        draft.metadata.valueId
      ),
      createSlug(
        draft.id
      ),
    ].filter(
      (part) =>
        part.length > 0
    );
  
    const readableId =
      readableParts.join("-");
  
    const hashSource = [
      draft.id,
      draft.batchId,
      contentType,
      draft.metadata.friendId,
      draft.metadata.worldId,
      draft.metadata.valueId,
      draft.metadata.templateId,
    ].join(":");
  
    const hash =
      hashText(hashSource)
        .toString(36)
        .padStart(
          7,
          "0"
        );
  
    const maximumReadableLength =
      Math.max(
        1,
        MAX_ID_LENGTH -
          hash.length -
          1
      );
  
    return `${readableId.slice(
      0,
      maximumReadableLength
    )}-${hash}`;
  }
  
  function createMixedBatchId(
    drafts: readonly WonderStudioDraft[]
  ): string {
    const source =
      drafts
        .map(
          (draft) =>
            `${draft.batchId}:${draft.id}`
        )
        .sort()
        .join("|");
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(
          7,
          "0"
        );
  
    return `wonder-mixed-batch-${hash}`;
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneImportedMetadata(
    metadata: WonderImportedContentMetadata
  ): WonderImportedContentMetadata {
    return {
      ...metadata,
  
      ageRange: {
        ...metadata.ageRange,
      },
  
      tags: [
        ...metadata.tags,
      ],
    };
  }
  
  function cloneImportedStory(
    imported: WonderImportedStory
  ): WonderImportedStory {
    return {
      ...imported,
  
      story: {
        ...imported.story,
      },
  
      metadata:
        cloneImportedMetadata(
          imported.metadata
        ),
    };
  }
  
  function cloneImportedMission(
    imported: WonderImportedMission
  ): WonderImportedMission {
    return {
      ...imported,
  
      mission: {
        ...imported.mission,
      },
  
      metadata:
        cloneImportedMetadata(
          imported.metadata
        ),
    };
  }
  
  function cloneImportedAdventure(
    imported: WonderImportedAdventure
  ): WonderImportedAdventure {
    return {
      ...imported,
  
      story: {
        ...imported.story,
      },
  
      mission: {
        ...imported.mission,
      },
  
      metadata:
        cloneImportedMetadata(
          imported.metadata
        ),
    };
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolveImportOptions(
    options: WonderContentImportOptions
  ): ResolvedImportOptions {
    return {
      allowNeedsReview:
        options.allowNeedsReview ??
        false,
  
      allowPublished:
        options.allowPublished ??
        true,
  
      requireValidValidation:
        options.requireValidValidation ??
        true,
  
      destination:
        safeText(
          options.destination,
          DEFAULT_DESTINATION
        ),
  
      idPrefix:
        createSlug(
          safeText(
            options.idPrefix,
            DEFAULT_ID_PREFIX
          )
        ) ||
        DEFAULT_ID_PREFIX,
    };
  }
  
  // =========================================================
  // STRING HELPERS
  // =========================================================
  
  function requiredText(
    value: string,
    fieldName: string
  ): string {
    const cleaned =
      value.trim();
  
    if (
      cleaned.length === 0
    ) {
      throw new Error(
        `WonderContentImporter: "${fieldName}" is required.`
      );
    }
  
    return cleaned;
  }
  
  function safeText(
    value:
      | string
      | null
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
  
  function normaliseStringArray(
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
  
  function hasText(
    value: unknown
  ): value is string {
    return (
      typeof value === "string" &&
      value.trim().length > 0
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
  
  // =========================================================
  // NUMBER AND DATE HELPERS
  // =========================================================
  
  function normaliseNonNegativeInteger(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
  
    return Math.max(
      0,
      Math.floor(value)
    );
  }
  
  function normalisePositiveInteger(
    value: number,
    fallback: number
  ): number {
    if (
      !Number.isFinite(value) ||
      value < 1
    ) {
      return fallback;
    }
  
    return Math.floor(value);
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
      `WonderContentImporter: unsupported content type "${String(
        value
      )}".`
    );
  }
  
  export const wonderContentImporter =
    new WonderContentImporter();
  
  export default WonderContentImporter;