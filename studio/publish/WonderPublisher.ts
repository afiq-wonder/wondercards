import type {
    WonderBatchImportResult,
    WonderImportedAdventure,
    WonderImportedContentMetadata,
    WonderImportedMission,
    WonderImportedStory,
  } from "../import/WonderContentImporter";
  
  import type {
    WonderStudioBatch,
    WonderStudioContentPackage,
    WonderStudioDraft,
    WonderStudioImportRecord,
    WonderStudioPublishManifest,
  } from "../types/WonderStudioTypes";
  
  import type { WonderMission } from "@/types/wonderMission";
  import type { WonderStory } from "@/types/wonderStory";
  
  export type WonderPublishFormat =
    | "json"
    | "typescript";
  
  export interface WonderPublisherOptions {
    /**
     * Human-readable catalog name.
     */
    name?: string;
  
    /**
     * Human-readable catalog description.
     */
    description?: string;
  
    /**
     * Catalog version.
     */
    version?: number;
  
    /**
     * Package identifier.
     *
     * Generated automatically when omitted.
     */
    packageId?: string;
  
    /**
     * Export format used by createExport().
     */
    format?: WonderPublishFormat;
  
    /**
     * TypeScript constant name used when exporting a module.
     */
    exportName?: string;
  
    /**
     * Refuse publication when any draft failed import.
     */
    requireCompleteImport?: boolean;
  
    /**
     * Only approved or already-published drafts are included.
     */
    requireApprovedDrafts?: boolean;
  
    /**
     * Destination recorded in the publish manifest.
     */
    destination?: string;
  
    /**
     * Optional release notes.
     */
    notes?: string;
  }
  
  export interface WonderPublishedAdventure {
    draftId: string;
  
    batchId: string;
  
    story: WonderStory;
  
    mission: WonderMission;
  
    metadata: WonderImportedContentMetadata;
  }
  
  export interface WonderPublishedStory {
    draftId: string;
  
    batchId: string;
  
    story: WonderStory;
  
    metadata: WonderImportedContentMetadata;
  }
  
  export interface WonderPublishedMission {
    draftId: string;
  
    batchId: string;
  
    mission: WonderMission;
  
    metadata: WonderImportedContentMetadata;
  }
  
  export interface WonderPublishedRuntimeCatalog {
    id: string;
  
    version: number;
  
    name: string;
  
    description: string;
  
    createdAt: Date;
  
    publishedAt: Date;
  
    sourceBatchId: string;
  
    stories: WonderPublishedStory[];
  
    missions: WonderPublishedMission[];
  
    adventures: WonderPublishedAdventure[];
  
    statistics: WonderPublishedCatalogStatistics;
  }
  
  export interface WonderPublishedCatalogStatistics {
    totalStories: number;
  
    totalMissions: number;
  
    totalAdventures: number;
  
    totalRuntimeStories: number;
  
    totalRuntimeMissions: number;
  
    uniqueFriends: number;
  
    uniqueWorlds: number;
  
    uniqueValues: number;
  
    uniqueTemplates: number;
  
    languages: string[];
  
    locales: string[];
  }
  
  export interface WonderPublishResult {
    success: boolean;
  
    publishedAt: Date;
  
    package: WonderStudioContentPackage | null;
  
    manifest: WonderStudioPublishManifest;
  
    catalog: WonderPublishedRuntimeCatalog | null;
  
    updatedBatch: WonderStudioBatch;
  
    errors: string[];
  
    warnings: string[];
  }
  
  export interface WonderStudioExport {
    filename: string;
  
    mimeType: string;
  
    format: WonderPublishFormat;
  
    content: string;
  }
  
  interface ResolvedPublisherOptions {
    name: string;
  
    description: string;
  
    version: number;
  
    packageId: string;
  
    format: WonderPublishFormat;
  
    exportName: string;
  
    requireCompleteImport: boolean;
  
    requireApprovedDrafts: boolean;
  
    destination: string;
  
    notes: string;
  }
  
  const DEFAULT_PACKAGE_NAME =
    "WonderLabs Adventure Catalog";
  
  const DEFAULT_PACKAGE_DESCRIPTION =
    "Validated educational adventures produced by Wonder Studio.";
  
  const DEFAULT_PACKAGE_VERSION = 1;
  
  const DEFAULT_EXPORT_NAME =
    "WONDER_CATALOG";
  
  const DEFAULT_DESTINATION =
    "wonder-runtime-catalog";
  
  /**
   * Packages imported Wonder Studio content into a versioned,
   * runtime-ready catalog.
   *
   * WonderPublisher does not directly write to the file system.
   *
   * It produces:
   *
   * - publication manifest
   * - runtime catalog
   * - updated batch
   * - serialised JSON or TypeScript output
   *
   * A CLI, build script, browser download, or backend service can
   * write the generated content to its final destination.
   */
  export class WonderPublisher {
    // =========================================================
    // PUBLISH
    // =========================================================
  
    publish(
      batch: WonderStudioBatch,
      importResult: WonderBatchImportResult,
      options: WonderPublisherOptions = {}
    ): WonderPublishResult {
      const resolvedOptions =
        resolvePublisherOptions(
          batch,
          options
        );
  
      const publishedAt =
        new Date();
  
      const validation =
        validatePublication({
          batch,
          importResult,
          options:
            resolvedOptions,
        });
  
      const manifest =
        this.createManifest(
          batch,
          importResult,
          resolvedOptions,
          publishedAt,
          validation.errors.length === 0
            ? "ready"
            : "failed"
        );
  
      if (
        validation.errors.length > 0
      ) {
        return {
          success: false,
  
          publishedAt,
  
          package: null,
  
          manifest,
  
          catalog: null,
  
          updatedBatch:
            cloneStudioBatch(
              batch
            ),
  
          errors:
            validation.errors,
  
          warnings:
            validation.warnings,
        };
      }
  
      const catalog =
        createRuntimeCatalog(
          batch,
          importResult,
          resolvedOptions,
          publishedAt
        );
  
      const publishedManifest: WonderStudioPublishManifest = {
        ...manifest,
  
        publishedAt:
          new Date(
            publishedAt.getTime()
          ),
  
        status: "published",
      };
  
      const updatedBatch =
        markBatchAsPublished(
          batch,
          importResult
        );
  
      const contentPackage =
        createContentPackage({
          batch: updatedBatch,
  
          manifest:
            publishedManifest,
  
          options:
            resolvedOptions,
  
          publishedAt,
        });
  
      return {
        success: true,
  
        publishedAt:
          new Date(
            publishedAt.getTime()
          ),
  
        package:
          cloneContentPackage(
            contentPackage
          ),
  
        manifest:
          clonePublishManifest(
            publishedManifest
          ),
  
        catalog:
          cloneRuntimeCatalog(
            catalog
          ),
  
        updatedBatch,
  
        errors: [],
  
        warnings:
          validation.warnings,
      };
    }
  
    // =========================================================
    // MANIFEST
    // =========================================================
  
    createManifest(
      batch: WonderStudioBatch,
      importResult: WonderBatchImportResult,
      options: WonderPublisherOptions | ResolvedPublisherOptions = {},
      createdAt = new Date(),
      status: WonderStudioPublishManifest["status"] = "draft"
    ): WonderStudioPublishManifest {
      const resolvedOptions =
        isResolvedPublisherOptions(
          options
        )
          ? options
          : resolvePublisherOptions(
              batch,
              options
            );
  
      const importedDraftIds =
        new Set(
          importResult.records
            .filter(
              (record) =>
                record.success
            )
            .map(
              (record) =>
                record.draftId
            )
        );
  
      const storyDraftIds =
        batch.drafts
          .filter(
            (draft) =>
              importedDraftIds.has(
                draft.id
              ) &&
              (
                draft.contentType ===
                  "story" ||
                draft.contentType ===
                  "adventure"
              )
          )
          .map(
            (draft) =>
              draft.id
          );
  
      const missionDraftIds =
        batch.drafts
          .filter(
            (draft) =>
              importedDraftIds.has(
                draft.id
              ) &&
              (
                draft.contentType ===
                  "mission" ||
                draft.contentType ===
                  "adventure"
              )
          )
          .map(
            (draft) =>
              draft.id
          );
  
      return {
        id:
          createManifestId(
            resolvedOptions.packageId,
            resolvedOptions.version,
            createdAt
          ),
  
        version:
          resolvedOptions.version,
  
        createdAt:
          new Date(
            createdAt.getTime()
          ),
  
        publishedAt:
          status === "published"
            ? new Date(
                createdAt.getTime()
              )
            : null,
  
        status,
  
        storyDraftIds:
          uniqueStrings(
            storyDraftIds
          ),
  
        missionDraftIds:
          uniqueStrings(
            missionDraftIds
          ),
  
        importRecords:
          importResult.records.map(
            cloneImportRecord
          ),
  
        notes: [
          resolvedOptions.notes,
  
          `Destination: ${resolvedOptions.destination}`,
  
          `Source batch: ${batch.id}`,
        ]
          .filter(hasText)
          .join("\n"),
      };
    }
  
    // =========================================================
    // EXPORT
    // =========================================================
  
    createExport(
      result: WonderPublishResult,
      options: WonderPublisherOptions = {}
    ): WonderStudioExport {
      if (
        !result.success ||
        !result.catalog
      ) {
        throw new Error(
          "WonderPublisher: only successful publication results can be exported."
        );
      }
  
      const batchId =
        result.updatedBatch.id;
  
      const resolvedOptions =
        resolvePublisherOptions(
          result.updatedBatch,
          options
        );
  
      const format =
        options.format ??
        resolvedOptions.format;
  
      if (format === "json") {
        return {
          filename:
            `${createSlug(
              result.catalog.name
            ) || createSlug(batchId) || "wonder-catalog"}.json`,
  
          mimeType:
            "application/json",
  
          format,
  
          content:
            this.toJSON(
              result.catalog
            ),
        };
      }
  
      return {
        filename:
          `${createSlug(
            result.catalog.name
          ) || createSlug(batchId) || "wonder-catalog"}.ts`,
  
        mimeType:
          "text/typescript",
  
        format,
  
        content:
          this.toTypeScript(
            result.catalog,
            resolvedOptions.exportName
          ),
      };
    }
  
    /**
     * Serialises the runtime catalog as JSON.
     *
     * Dates are stored as ISO strings.
     */
    toJSON(
      catalog: WonderPublishedRuntimeCatalog,
      pretty = true
    ): string {
      return JSON.stringify(
        serialiseRuntimeCatalog(
          catalog
        ),
        null,
        pretty ? 2 : undefined
      );
    }
  
    /**
     * Generates a TypeScript module containing the catalog.
     *
     * This output has no dependency on Wonder Studio.
     */
    toTypeScript(
      catalog: WonderPublishedRuntimeCatalog,
      exportName =
        DEFAULT_EXPORT_NAME
    ): string {
      const safeExportName =
        createTypeScriptIdentifier(
          exportName
        );
  
      const serialisedCatalog =
        serialiseRuntimeCatalog(
          catalog
        );
  
      return [
        "/*",
        " * Auto-generated by Wonder Studio.",
        " *",
        " * Do not edit this file manually.",
        " */",
        "",
        `export const ${safeExportName} = ${JSON.stringify(
          serialisedCatalog,
          null,
          2
        )} as const;`,
        "",
        `export default ${safeExportName};`,
        "",
      ].join("\n");
    }
  
    // =========================================================
    // PREPARE
    // =========================================================
  
    /**
     * Creates a ready manifest without marking content as published.
     */
    prepare(
      batch: WonderStudioBatch,
      importResult: WonderBatchImportResult,
      options: WonderPublisherOptions = {}
    ): WonderStudioPublishManifest {
      const validation =
        validatePublication({
          batch,
  
          importResult,
  
          options:
            resolvePublisherOptions(
              batch,
              options
            ),
        });
  
      return this.createManifest(
        batch,
        importResult,
        options,
        new Date(),
        validation.errors.length === 0
          ? "ready"
          : "failed"
      );
    }
  }
  
  // =========================================================
  // PUBLICATION VALIDATION
  // =========================================================
  
  function validatePublication({
    batch,
    importResult,
    options,
  }: {
    batch: WonderStudioBatch;
  
    importResult: WonderBatchImportResult;
  
    options: ResolvedPublisherOptions;
  }): {
    errors: string[];
  
    warnings: string[];
  } {
    const errors: string[] = [];
  
    const warnings: string[] = [];
  
    if (!hasText(batch.id)) {
      errors.push(
        "Studio batch ID is required."
      );
    }
  
    if (
      batch.drafts.length === 0
    ) {
      errors.push(
        "The Studio batch does not contain any drafts."
      );
    }
  
    if (
      importResult.totalImported === 0
    ) {
      errors.push(
        "No imported content is available for publication."
      );
    }
  
    if (
      options.requireCompleteImport &&
      importResult.totalRejected > 0
    ) {
      errors.push(
        `${importResult.totalRejected} draft(s) failed import.`
      );
    }
  
    if (
      importResult.batchId !==
        batch.id &&
      !importResult.batchId.startsWith(
        "wonder-mixed-batch-"
      )
    ) {
      warnings.push(
        `Import batch "${importResult.batchId}" differs from Studio batch "${batch.id}".`
      );
    }
  
    const successfulDraftIds =
      new Set(
        importResult.records
          .filter(
            (record) =>
              record.success
          )
          .map(
            (record) =>
              record.draftId
          )
      );
  
    for (
      const draft of
        batch.drafts
    ) {
      if (
        !successfulDraftIds.has(
          draft.id
        )
      ) {
        continue;
      }
  
      if (
        options.requireApprovedDrafts &&
        draft.status !==
          "approved" &&
        draft.status !==
          "published"
      ) {
        errors.push(
          `Draft "${draft.id}" is not approved for publication.`
        );
      }
  
      if (
        !draft.validation
      ) {
        warnings.push(
          `Draft "${draft.id}" has no validation record.`
        );
      } else if (
        !draft.validation.valid
      ) {
        errors.push(
          `Draft "${draft.id}" did not pass validation.`
        );
      }
    }
  
    const duplicateRuntimeIds =
      findDuplicateRuntimeIds(
        importResult
      );
  
    for (
      const duplicateId of
        duplicateRuntimeIds
    ) {
      errors.push(
        `Duplicate runtime content ID detected: "${duplicateId}".`
      );
    }
  
    if (
      importResult.totalRejected > 0 &&
      !options.requireCompleteImport
    ) {
      warnings.push(
        `${importResult.totalRejected} rejected draft(s) were excluded from publication.`
      );
    }
  
    return {
      errors:
        uniqueStrings(errors),
  
      warnings:
        uniqueStrings(warnings),
    };
  }
  
  function findDuplicateRuntimeIds(
    importResult: WonderBatchImportResult
  ): string[] {
    const duplicateIds =
      new Set<string>();
  
    const duplicateStoryIds =
      collectDuplicateIds(
        importResult.stories.map(
          (item) =>
            item.story.id
        )
      );
  
    const duplicateMissionIds =
      collectDuplicateIds(
        importResult.missions.map(
          (item) =>
            item.mission.id
        )
      );
  
    const duplicateAdventureIds =
      collectDuplicateIds(
        importResult.adventures.map(
          (item) =>
            [
              item.story.id,
              item.mission.id,
            ].join(":")
        )
      );
  
    for (
      const id of
        duplicateStoryIds
    ) {
      duplicateIds.add(
        `story:${id}`
      );
    }
  
    for (
      const id of
        duplicateMissionIds
    ) {
      duplicateIds.add(
        `mission:${id}`
      );
    }
  
    for (
      const id of
        duplicateAdventureIds
    ) {
      duplicateIds.add(
        `adventure:${id}`
      );
    }
  
    return Array.from(
      duplicateIds
    );
  }
  
  function collectDuplicateIds(
    ids: readonly string[]
  ): string[] {
    const counts =
      new Map<string, number>();
  
    for (const id of ids) {
      counts.set(
        id,
        (counts.get(id) ?? 0) + 1
      );
    }
  
    return Array.from(
      counts.entries()
    )
      .filter(
        ([, count]) =>
          count > 1
      )
      .map(
        ([id]) =>
          id
      );
  }
  
  // =========================================================
  // RUNTIME CATALOG
  // =========================================================
  
  function createRuntimeCatalog(
    batch: WonderStudioBatch,
    importResult: WonderBatchImportResult,
    options: ResolvedPublisherOptions,
    publishedAt: Date
  ): WonderPublishedRuntimeCatalog {
    const stories =
      deduplicateStories(
        importResult.stories
      ).map(
        convertPublishedStory
      );
  
    const missions =
      deduplicateMissions(
        importResult.missions
      ).map(
        convertPublishedMission
      );
  
    const adventures =
      deduplicateAdventures(
        importResult.adventures
      ).map(
        convertPublishedAdventure
      );
  
    return {
      id:
        options.packageId,
  
      version:
        options.version,
  
      name:
        options.name,
  
      description:
        options.description,
  
      createdAt:
        new Date(
          batch.createdAt.getTime()
        ),
  
      publishedAt:
        new Date(
          publishedAt.getTime()
        ),
  
      sourceBatchId:
        batch.id,
  
      stories,
  
      missions,
  
      adventures,
  
      statistics:
        createCatalogStatistics(
          stories,
          missions,
          adventures
        ),
    };
  }
  
  function convertPublishedStory(
    imported: WonderImportedStory
  ): WonderPublishedStory {
    return {
      draftId:
        imported.draftId,
  
      batchId:
        imported.batchId,
  
      story: {
        ...imported.story,
      },
  
      metadata:
        cloneImportedMetadata(
          imported.metadata
        ),
    };
  }
  
  function convertPublishedMission(
    imported: WonderImportedMission
  ): WonderPublishedMission {
    return {
      draftId:
        imported.draftId,
  
      batchId:
        imported.batchId,
  
      mission: {
        ...imported.mission,
      },
  
      metadata:
        cloneImportedMetadata(
          imported.metadata
        ),
    };
  }
  
  function convertPublishedAdventure(
    imported: WonderImportedAdventure
  ): WonderPublishedAdventure {
    return {
      draftId:
        imported.draftId,
  
      batchId:
        imported.batchId,
  
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
  // STATISTICS
  // =========================================================
  
  function createCatalogStatistics(
    stories: readonly WonderPublishedStory[],
    missions: readonly WonderPublishedMission[],
    adventures: readonly WonderPublishedAdventure[]
  ): WonderPublishedCatalogStatistics {
    const allMetadata = [
      ...stories.map(
        (item) =>
          item.metadata
      ),
  
      ...missions.map(
        (item) =>
          item.metadata
      ),
  
      ...adventures.map(
        (item) =>
          item.metadata
      ),
    ];
  
    return {
      totalStories:
        stories.length,
  
      totalMissions:
        missions.length,
  
      totalAdventures:
        adventures.length,
  
      totalRuntimeStories:
        stories.length +
        adventures.length,
  
      totalRuntimeMissions:
        missions.length +
        adventures.length,
  
      uniqueFriends:
        countUniqueMetadata(
          allMetadata,
          "friendId"
        ),
  
      uniqueWorlds:
        countUniqueMetadata(
          allMetadata,
          "worldId"
        ),
  
      uniqueValues:
        countUniqueMetadata(
          allMetadata,
          "valueId"
        ),
  
      uniqueTemplates:
        countUniqueMetadata(
          allMetadata,
          "templateId"
        ),
  
      languages:
        uniqueStrings(
          allMetadata.map(
            (metadata) =>
              metadata.language
          )
        ),
  
      locales:
        uniqueStrings(
          allMetadata.map(
            (metadata) =>
              metadata.locale
          )
        ),
    };
  }
  
  function countUniqueMetadata(
    metadata:
      readonly WonderImportedContentMetadata[],
    field:
      | "friendId"
      | "worldId"
      | "valueId"
      | "templateId"
  ): number {
    return new Set(
      metadata
        .map(
          (item) =>
            item[field]
        )
        .filter(hasText)
    ).size;
  }
  
  // =========================================================
  // CONTENT PACKAGE
  // =========================================================
  
  function createContentPackage({
    batch,
    manifest,
    options,
    publishedAt,
  }: {
    batch: WonderStudioBatch;
  
    manifest: WonderStudioPublishManifest;
  
    options: ResolvedPublisherOptions;
  
    publishedAt: Date;
  }): WonderStudioContentPackage {
    const publishedDraftIds =
      new Set([
        ...manifest.storyDraftIds,
        ...manifest.missionDraftIds,
      ]);
  
    const publishedDrafts =
      batch.drafts.filter(
        (draft) =>
          publishedDraftIds.has(
            draft.id
          )
      );
  
    const storyDrafts =
      publishedDrafts.filter(
        (draft) =>
          draft.contentType ===
            "story" ||
          draft.contentType ===
            "adventure"
      );
  
    const missionDrafts =
      publishedDrafts.filter(
        (draft) =>
          draft.contentType ===
            "mission" ||
          draft.contentType ===
            "adventure"
      );
  
    return {
      id:
        options.packageId,
  
      version:
        options.version,
  
      createdAt:
        new Date(
          publishedAt.getTime()
        ),
  
      name:
        options.name,
  
      description:
        options.description,
  
      stories:
        storyDrafts.map(
          cloneStudioDraft
        ),
  
      missions:
        missionDrafts.map(
          cloneStudioDraft
        ),
  
      manifest:
        clonePublishManifest(
          manifest
        ),
    };
  }
  
  // =========================================================
  // BATCH UPDATE
  // =========================================================
  
  function markBatchAsPublished(
    batch: WonderStudioBatch,
    importResult: WonderBatchImportResult
  ): WonderStudioBatch {
    const publishedDraftIds =
      new Set(
        importResult.records
          .filter(
            (record) =>
              record.success
          )
          .map(
            (record) =>
              record.draftId
          )
      );
  
    const updatedDrafts =
      batch.drafts.map(
        (draft) => {
          if (
            !publishedDraftIds.has(
              draft.id
            )
          ) {
            return cloneStudioDraft(
              draft
            );
          }
  
          return {
            ...cloneStudioDraft(
              draft
            ),
  
            status:
              "published" as const,
  
            updatedAt:
              new Date(),
          };
        }
      );
  
    const publishedCount =
      updatedDrafts.filter(
        (draft) =>
          draft.status ===
          "published"
      ).length;
  
    const approvedCount =
      updatedDrafts.filter(
        (draft) =>
          draft.status ===
          "approved"
      ).length;
  
    const rejectedCount =
      updatedDrafts.filter(
        (draft) =>
          draft.status ===
          "rejected"
      ).length;
  
    const validCount =
      updatedDrafts.filter(
        (draft) =>
          draft.validation?.valid ===
          true
      ).length;
  
    return {
      ...cloneStudioBatch(
        batch
      ),
  
      updatedAt: new Date(),
  
      status: "completed",
  
      drafts: updatedDrafts,
  
      totalGenerated:
        updatedDrafts.length,
  
      totalValid:
        validCount,
  
      totalApproved:
        approvedCount +
        publishedCount,
  
      totalRejected:
        rejectedCount,
    };
  }
  
  // =========================================================
  // DEDUPLICATION
  // =========================================================
  
  function deduplicateStories(
    stories:
      readonly WonderImportedStory[]
  ): WonderImportedStory[] {
    const seen =
      new Set<string>();
  
    return stories.filter(
      (item) => {
        if (
          seen.has(
            item.story.id
          )
        ) {
          return false;
        }
  
        seen.add(
          item.story.id
        );
  
        return true;
      }
    );
  }
  
  function deduplicateMissions(
    missions:
      readonly WonderImportedMission[]
  ): WonderImportedMission[] {
    const seen =
      new Set<string>();
  
    return missions.filter(
      (item) => {
        if (
          seen.has(
            item.mission.id
          )
        ) {
          return false;
        }
  
        seen.add(
          item.mission.id
        );
  
        return true;
      }
    );
  }
  
  function deduplicateAdventures(
    adventures:
      readonly WonderImportedAdventure[]
  ): WonderImportedAdventure[] {
    const seen =
      new Set<string>();
  
    return adventures.filter(
      (item) => {
        const key = [
          item.story.id,
          item.mission.id,
        ].join(":");
  
        if (seen.has(key)) {
          return false;
        }
  
        seen.add(key);
  
        return true;
      }
    );
  }
  
  // =========================================================
  // SERIALISATION
  // =========================================================
  
  function serialiseRuntimeCatalog(
    catalog: WonderPublishedRuntimeCatalog
  ): Record<string, unknown> {
    return {
      id:
        catalog.id,
  
      version:
        catalog.version,
  
      name:
        catalog.name,
  
      description:
        catalog.description,
  
      createdAt:
        catalog.createdAt.toISOString(),
  
      publishedAt:
        catalog.publishedAt.toISOString(),
  
      sourceBatchId:
        catalog.sourceBatchId,
  
      stories:
        catalog.stories.map(
          serialisePublishedStory
        ),
  
      missions:
        catalog.missions.map(
          serialisePublishedMission
        ),
  
      adventures:
        catalog.adventures.map(
          serialisePublishedAdventure
        ),
  
      statistics: {
        ...catalog.statistics,
  
        languages: [
          ...catalog.statistics
            .languages,
        ],
  
        locales: [
          ...catalog.statistics
            .locales,
        ],
      },
    };
  }
  
  function serialisePublishedStory(
    item: WonderPublishedStory
  ): Record<string, unknown> {
    return {
      draftId:
        item.draftId,
  
      batchId:
        item.batchId,
  
      story: {
        ...item.story,
      },
  
      metadata:
        serialiseMetadata(
          item.metadata
        ),
    };
  }
  
  function serialisePublishedMission(
    item: WonderPublishedMission
  ): Record<string, unknown> {
    return {
      draftId:
        item.draftId,
  
      batchId:
        item.batchId,
  
      mission: {
        ...item.mission,
      },
  
      metadata:
        serialiseMetadata(
          item.metadata
        ),
    };
  }
  
  function serialisePublishedAdventure(
    item: WonderPublishedAdventure
  ): Record<string, unknown> {
    return {
      draftId:
        item.draftId,
  
      batchId:
        item.batchId,
  
      story: {
        ...item.story,
      },
  
      mission: {
        ...item.mission,
      },
  
      metadata:
        serialiseMetadata(
          item.metadata
        ),
    };
  }
  
  function serialiseMetadata(
    metadata: WonderImportedContentMetadata
  ): Record<string, unknown> {
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
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneRuntimeCatalog(
    catalog: WonderPublishedRuntimeCatalog
  ): WonderPublishedRuntimeCatalog {
    return {
      ...catalog,
  
      createdAt:
        new Date(
          catalog.createdAt.getTime()
        ),
  
      publishedAt:
        new Date(
          catalog.publishedAt.getTime()
        ),
  
      stories:
        catalog.stories.map(
          (item) => ({
            ...item,
  
            story: {
              ...item.story,
            },
  
            metadata:
              cloneImportedMetadata(
                item.metadata
              ),
          })
        ),
  
      missions:
        catalog.missions.map(
          (item) => ({
            ...item,
  
            mission: {
              ...item.mission,
            },
  
            metadata:
              cloneImportedMetadata(
                item.metadata
              ),
          })
        ),
  
      adventures:
        catalog.adventures.map(
          (item) => ({
            ...item,
  
            story: {
              ...item.story,
            },
  
            mission: {
              ...item.mission,
            },
  
            metadata:
              cloneImportedMetadata(
                item.metadata
              ),
          })
        ),
  
      statistics: {
        ...catalog.statistics,
  
        languages: [
          ...catalog.statistics
            .languages,
        ],
  
        locales: [
          ...catalog.statistics
            .locales,
        ],
      },
    };
  }
  
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
  
      request: {
        ...batch.request,
  
        createdAt:
          new Date(
            batch.request.createdAt.getTime()
          ),
  
        ageRange: {
          ...batch.request.ageRange,
        },
  
        requiredWords: [
          ...(batch.request
            .requiredWords ?? []),
        ],
  
        bannedWords: [
          ...(batch.request
            .bannedWords ?? []),
        ],
  
        tags: [
          ...(batch.request.tags ??
            []),
        ],
      },
  
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
          ...draft.metadata.ageRange,
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
          ? {
              ...draft.validation,
  
              validatedAt:
                new Date(
                  draft.validation
                    .validatedAt
                    .getTime()
                ),
  
              issues:
                draft.validation.issues.map(
                  (issue) => ({
                    ...issue,
                  })
                ),
  
              scores: {
                ...draft.validation.scores,
              },
            }
          : null,
    };
  }
  
  function clonePublishManifest(
    manifest: WonderStudioPublishManifest
  ): WonderStudioPublishManifest {
    return {
      ...manifest,
  
      createdAt:
        new Date(
          manifest.createdAt.getTime()
        ),
  
      publishedAt:
        manifest.publishedAt
          ? new Date(
              manifest.publishedAt.getTime()
            )
          : null,
  
      storyDraftIds: [
        ...manifest.storyDraftIds,
      ],
  
      missionDraftIds: [
        ...manifest.missionDraftIds,
      ],
  
      importRecords:
        manifest.importRecords.map(
          cloneImportRecord
        ),
    };
  }
  
  function cloneImportRecord(
    record: WonderStudioImportRecord
  ): WonderStudioImportRecord {
    return {
      ...record,
  
      importedAt:
        new Date(
          record.importedAt.getTime()
        ),
    };
  }
  
  function cloneContentPackage(
    contentPackage: WonderStudioContentPackage
  ): WonderStudioContentPackage {
    return {
      ...contentPackage,
  
      createdAt:
        new Date(
          contentPackage.createdAt.getTime()
        ),
  
      stories:
        contentPackage.stories.map(
          cloneStudioDraft
        ),
  
      missions:
        contentPackage.missions.map(
          cloneStudioDraft
        ),
  
      manifest:
        clonePublishManifest(
          contentPackage.manifest
        ),
    };
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function resolvePublisherOptions(
    batch: WonderStudioBatch,
    options: WonderPublisherOptions
  ): ResolvedPublisherOptions {
    const version =
      normalisePositiveInteger(
        options.version,
        DEFAULT_PACKAGE_VERSION
      );
  
    const name =
      safeText(
        options.name,
        DEFAULT_PACKAGE_NAME
      );
  
    const packageId =
      safeText(
        options.packageId,
        createPackageId(
          batch.id,
          name,
          version
        )
      );
  
    return {
      name,
  
      description:
        safeText(
          options.description,
          DEFAULT_PACKAGE_DESCRIPTION
        ),
  
      version,
  
      packageId,
  
      format:
        options.format ??
        "json",
  
      exportName:
        createTypeScriptIdentifier(
          safeText(
            options.exportName,
            DEFAULT_EXPORT_NAME
          )
        ),
  
      requireCompleteImport:
        options.requireCompleteImport ??
        true,
  
      requireApprovedDrafts:
        options.requireApprovedDrafts ??
        true,
  
      destination:
        safeText(
          options.destination,
          DEFAULT_DESTINATION
        ),
  
      notes:
        safeText(
          options.notes,
          ""
        ),
    };
  }
  
  function isResolvedPublisherOptions(
    options:
      | WonderPublisherOptions
      | ResolvedPublisherOptions
  ): options is ResolvedPublisherOptions {
    return (
      typeof (
        options as ResolvedPublisherOptions
      ).packageId === "string" &&
      typeof (
        options as ResolvedPublisherOptions
      ).requireCompleteImport ===
        "boolean" &&
      typeof (
        options as ResolvedPublisherOptions
      ).requireApprovedDrafts ===
        "boolean"
    );
  }
  
  // =========================================================
  // IDS
  // =========================================================
  
  function createPackageId(
    batchId: string,
    name: string,
    version: number
  ): string {
    const readableName =
      createSlug(name) ||
      "wonder-catalog";
  
    const source = [
      batchId,
      name,
      version,
    ].join(":");
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(7, "0");
  
    return `${readableName}-v${version}-${hash}`;
  }
  
  function createManifestId(
    packageId: string,
    version: number,
    date: Date
  ): string {
    const source = [
      packageId,
      version,
      date.toISOString(),
    ].join(":");
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(7, "0");
  
    return `wonder-manifest-${hash}`;
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function createTypeScriptIdentifier(
    value: string
  ): string {
    const cleaned =
      value
        .trim()
        .replace(
          /[^a-zA-Z0-9_$]+/g,
          "_"
        )
        .replace(
          /^([0-9])/,
          "_$1"
        );
  
    return cleaned.length > 0
      ? cleaned
      : DEFAULT_EXPORT_NAME;
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
  
  function hasText(
    value: unknown
  ): value is string {
    return (
      typeof value === "string" &&
      value.trim().length > 0
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
  
  function normalisePositiveInteger(
    value: number | undefined,
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
  
  export const wonderPublisher =
    new WonderPublisher();
  
  export default WonderPublisher;