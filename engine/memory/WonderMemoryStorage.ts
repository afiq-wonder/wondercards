import {
    WonderRepository,
    wonderRepository,
  } from "@/engine/repository/WonderRepository";
  
  import {
    hasText,
    hydrateDate,
    isValidDate,
    normaliseNonNegativeInteger,
    normaliseOptionalText,
    normalisePositiveInteger,
  } from "./WonderMemoryHelpers";
  
  import {
    cloneMemoryCounters,
    hydrateMemoryCounters,
  } from "./WonderMemoryRanking";
  
  import type {
    WonderMemoryAdventure,
    WonderMemoryProfile,
    WonderMemoryProgressContainer,
  } from "./WonderMemoryTypes";
  
  export const WONDER_MEMORY_VERSION = 1;
  
  export const MAX_STORED_MEMORY_ADVENTURES = 365;
  
  export interface WonderMemoryValidationResult {
    valid: boolean;
  
    errors: string[];
  }
  
  /**
   * Handles persistence, hydration, validation and cloning
   * for Wonder Memory profiles.
   *
   * WonderMemoryEngine should focus on business logic.
   * This class owns all storage responsibilities.
   */
  export class WonderMemoryStorage {
    constructor(
      private readonly repository: WonderRepository =
        wonderRepository
    ) {}
  
    // =========================================================
    // SAVE
    // =========================================================
  
    save(
      memory: WonderMemoryProfile
    ): boolean {
      const hydratedMemory =
        hydrateMemoryProfile(memory);
  
      assertValidMemoryProfile(
        hydratedMemory
      );
  
      const existingProgress =
        this.repository.loadProgress<WonderMemoryProgressContainer>() ??
        {};
  
      const updatedProgress: WonderMemoryProgressContainer = {
        ...existingProgress,
  
        memory:
          cloneMemoryProfile(
            hydratedMemory
          ),
      };
  
      return this.repository.saveProgress(
        updatedProgress
      );
    }
  
    // =========================================================
    // LOAD
    // =========================================================
  
    load(): WonderMemoryProfile | null {
      const progress =
        this.repository.loadProgress<WonderMemoryProgressContainer>();
  
      if (
        !progress ||
        !progress.memory
      ) {
        return null;
      }
  
      try {
        const memory =
          hydrateMemoryProfile(
            progress.memory
          );
  
        assertValidMemoryProfile(
          memory
        );
  
        return cloneMemoryProfile(
          memory
        );
      } catch (error) {
        console.error(
          "[WonderMemoryStorage] Invalid stored memory.",
          error
        );
  
        return null;
      }
    }
  
    // =========================================================
    // STATUS
    // =========================================================
  
    has(): boolean {
      return this.load() !== null;
    }
  
    // =========================================================
    // CLEAR
    // =========================================================
  
    clear(): boolean {
      const progress =
        this.repository.loadProgress<WonderMemoryProgressContainer>();
  
      if (!progress) {
        return true;
      }
  
      const {
        memory: _memory,
        ...remainingProgress
      } = progress;
  
      if (
        Object.keys(
          remainingProgress
        ).length === 0
      ) {
        return this.repository.clearProgress();
      }
  
      return this.repository.saveProgress(
        remainingProgress
      );
    }
  
    // =========================================================
    // REPLACE
    // =========================================================
  
    replace(
      memory: WonderMemoryProfile
    ): WonderMemoryProfile {
      const hydratedMemory =
        hydrateMemoryProfile(memory);
  
      assertValidMemoryProfile(
        hydratedMemory
      );
  
      this.save(
        hydratedMemory
      );
  
      return cloneMemoryProfile(
        hydratedMemory
      );
    }
  }
  
  // =========================================================
  // VALIDATION
  // =========================================================
  
  export function validateMemoryProfile(
    memory: WonderMemoryProfile
  ): WonderMemoryValidationResult {
    const errors: string[] = [];
  
    if (!hasText(memory.id)) {
      errors.push(
        "Memory ID is required."
      );
    }
  
    if (!hasText(memory.familyId)) {
      errors.push(
        "Family ID is required."
      );
    }
  
    if (
      !Number.isFinite(
        memory.version
      ) ||
      memory.version < 1
    ) {
      errors.push(
        "Memory version must be a positive number."
      );
    }
  
    if (
      !isValidDate(
        memory.createdAt
      )
    ) {
      errors.push(
        "Memory createdAt is invalid."
      );
    }
  
    if (
      !isValidDate(
        memory.updatedAt
      )
    ) {
      errors.push(
        "Memory updatedAt is invalid."
      );
    }
  
    if (
      !Number.isFinite(
        memory.completedAdventures
      ) ||
      memory.completedAdventures < 0
    ) {
      errors.push(
        "Completed adventure count is invalid."
      );
    }
  
    if (
      !Number.isFinite(
        memory.totalWonderScore
      ) ||
      memory.totalWonderScore < 0
    ) {
      errors.push(
        "Total Wonder Score is invalid."
      );
    }
  
    if (
      !memory.counters ||
      typeof memory.counters !==
        "object"
    ) {
      errors.push(
        "Memory counters are invalid."
      );
    }
  
    if (
      !Array.isArray(
        memory.recentAdventures
      )
    ) {
      errors.push(
        "Recent adventures must be an array."
      );
    }
  
    if (
      memory.recentAdventures.length >
      MAX_STORED_MEMORY_ADVENTURES
    ) {
      errors.push(
        `Recent adventures cannot exceed ${MAX_STORED_MEMORY_ADVENTURES} records.`
      );
    }
  
    for (
      const adventure of
        memory.recentAdventures
    ) {
      const adventureValidation =
        validateMemoryAdventure(
          adventure
        );
  
      errors.push(
        ...adventureValidation.errors
      );
    }
  
    return {
      valid:
        errors.length === 0,
  
      errors,
    };
  }
  
  export function assertValidMemoryProfile(
    memory: WonderMemoryProfile
  ): void {
    const validation =
      validateMemoryProfile(
        memory
      );
  
    if (validation.valid) {
      return;
    }
  
    throw new Error(
      [
        "WonderMemoryStorage: invalid memory profile.",
        ...validation.errors,
      ].join(" ")
    );
  }
  
  export function validateMemoryAdventure(
    adventure: WonderMemoryAdventure
  ): WonderMemoryValidationResult {
    const errors: string[] = [];
  
    if (!hasText(adventure.id)) {
      errors.push(
        "Memory adventure ID is required."
      );
    }
  
    if (!hasText(adventure.cardId)) {
      errors.push(
        "Memory adventure card ID is required."
      );
    }
  
    if (!hasText(adventure.genomeId)) {
      errors.push(
        "Memory adventure genome ID is required."
      );
    }
  
    if (!hasText(adventure.valueId)) {
      errors.push(
        "Memory adventure value ID is required."
      );
    }
  
    if (!hasText(adventure.valueName)) {
      errors.push(
        "Memory adventure value name is required."
      );
    }
  
    if (!hasText(adventure.friendId)) {
      errors.push(
        "Memory adventure friend ID is required."
      );
    }
  
    if (!hasText(adventure.friendName)) {
      errors.push(
        "Memory adventure friend name is required."
      );
    }
  
    if (!hasText(adventure.worldId)) {
      errors.push(
        "Memory adventure world ID is required."
      );
    }
  
    if (!hasText(adventure.worldName)) {
      errors.push(
        "Memory adventure world name is required."
      );
    }
  
    if (!hasText(adventure.templateId)) {
      errors.push(
        "Memory adventure template ID is required."
      );
    }
  
    if (!hasText(adventure.templateName)) {
      errors.push(
        "Memory adventure template name is required."
      );
    }
  
    if (!hasText(adventure.emotion)) {
      errors.push(
        "Memory adventure emotion is required."
      );
    }
  
    if (!hasText(adventure.location)) {
      errors.push(
        "Memory adventure location is required."
      );
    }
  
    if (
      !Number.isFinite(
        adventure.wonderScore
      ) ||
      adventure.wonderScore < 0
    ) {
      errors.push(
        "Memory adventure Wonder Score is invalid."
      );
    }
  
    if (
      !isValidDate(
        adventure.completedAt
      )
    ) {
      errors.push(
        "Memory adventure completion date is invalid."
      );
    }
  
    return {
      valid:
        errors.length === 0,
  
      errors,
    };
  }
  
  // =========================================================
  // HYDRATION
  // =========================================================
  
  export function hydrateMemoryProfile(
    memory: WonderMemoryProfile
  ): WonderMemoryProfile {
    const recentAdventures =
      Array.isArray(
        memory.recentAdventures
      )
        ? memory.recentAdventures
            .map(
              hydrateMemoryAdventure
            )
            .filter(
              (
                adventure
              ): adventure is WonderMemoryAdventure =>
                adventure !== null
            )
            .slice(
              0,
              MAX_STORED_MEMORY_ADVENTURES
            )
        : [];
  
    return {
      ...memory,
  
      id:
        typeof memory.id === "string"
          ? memory.id.trim()
          : "",
  
      familyId:
        typeof memory.familyId ===
          "string"
          ? memory.familyId.trim()
          : "",
  
      version:
        normalisePositiveInteger(
          memory.version,
          WONDER_MEMORY_VERSION
        ),
  
      createdAt:
        hydrateUnknownDate(
          memory.createdAt
        ),
  
      updatedAt:
        hydrateUnknownDate(
          memory.updatedAt
        ),
  
      completedAdventures:
        normaliseNonNegativeInteger(
          memory.completedAdventures
        ),
  
      totalWonderScore:
        normaliseNonNegativeInteger(
          memory.totalWonderScore
        ),
  
      counters:
        hydrateMemoryCounters(
          memory.counters
        ),
  
      recentAdventures,
    };
  }
  
  export function hydrateMemoryAdventure(
    adventure: WonderMemoryAdventure
  ): WonderMemoryAdventure | null {
    if (
      !adventure ||
      typeof adventure !== "object"
    ) {
      return null;
    }
  
    const completedAt =
      hydrateUnknownDate(
        adventure.completedAt
      );
  
    return {
      ...adventure,
  
      id:
        typeof adventure.id === "string"
          ? adventure.id.trim()
          : "",
  
      sessionId:
        normaliseOptionalText(
          adventure.sessionId
        ),
  
      cardId:
        typeof adventure.cardId ===
          "string"
          ? adventure.cardId.trim()
          : "",
  
      genomeId:
        typeof adventure.genomeId ===
          "string"
          ? adventure.genomeId.trim()
          : "",
  
      valueId:
        typeof adventure.valueId ===
          "string"
          ? adventure.valueId.trim()
          : "",
  
      valueName:
        typeof adventure.valueName ===
          "string"
          ? adventure.valueName.trim()
          : "",
  
      friendId:
        typeof adventure.friendId ===
          "string"
          ? adventure.friendId.trim()
          : "",
  
      friendName:
        typeof adventure.friendName ===
          "string"
          ? adventure.friendName.trim()
          : "",
  
      worldId:
        typeof adventure.worldId ===
          "string"
          ? adventure.worldId.trim()
          : "",
  
      worldName:
        typeof adventure.worldName ===
          "string"
          ? adventure.worldName.trim()
          : "",
  
      templateId:
        typeof adventure.templateId ===
          "string"
          ? adventure.templateId.trim()
          : "",
  
      templateName:
        typeof adventure.templateName ===
          "string"
          ? adventure.templateName.trim()
          : "",
  
      emotion:
        typeof adventure.emotion ===
          "string"
          ? adventure.emotion.trim()
          : "",
  
      location:
        typeof adventure.location ===
          "string"
          ? adventure.location.trim()
          : "",
  
      wonderScore:
        normaliseNonNegativeInteger(
          adventure.wonderScore
        ),
  
      completedAt,
    };
  }
  
  function hydrateUnknownDate(
    value: unknown
  ): Date {
    if (value instanceof Date) {
      return isValidDate(value)
        ? new Date(
            value.getTime()
          )
        : new Date();
    }
  
    if (
      typeof value === "string"
    ) {
      return hydrateDate(value);
    }
  
    return new Date();
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  export function cloneMemoryProfile(
    memory: WonderMemoryProfile
  ): WonderMemoryProfile {
    return {
      ...memory,
  
      createdAt: new Date(
        memory.createdAt.getTime()
      ),
  
      updatedAt: new Date(
        memory.updatedAt.getTime()
      ),
  
      counters:
        cloneMemoryCounters(
          memory.counters
        ),
  
      recentAdventures:
        memory.recentAdventures.map(
          cloneMemoryAdventure
        ),
    };
  }
  
  export function cloneMemoryAdventure(
    adventure: WonderMemoryAdventure
  ): WonderMemoryAdventure {
    return {
      ...adventure,
  
      completedAt: new Date(
        adventure.completedAt.getTime()
      ),
    };
  }
  
  export const wonderMemoryStorage =
    new WonderMemoryStorage();
  
  export default WonderMemoryStorage;