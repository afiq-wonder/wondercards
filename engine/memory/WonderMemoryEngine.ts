import {
  WonderRepository,
  wonderRepository,
} from "@/engine/repository/WonderRepository";

import type { WonderSession } from "@/engine/session/WonderSessionEngine";
import type { WonderCard } from "@/types/wonderCard";

export interface WonderMemoryCounters {
  values: Record<string, number>;
  friends: Record<string, number>;
  worlds: Record<string, number>;
  templates: Record<string, number>;
  emotions: Record<string, number>;
}

export interface WonderMemoryAdventure {
  id: string;
  sessionId: string | null;
  cardId: string;
  genomeId: string;

  valueId: string;
  valueName: string;

  friendId: string;
  friendName: string;

  worldId: string;
  worldName: string;

  templateId: string;
  templateName: string;

  emotion: string;
  location: string;

  wonderScore: number;

  completedAt: Date;
}

export interface WonderMemoryProfile {
  id: string;
  version: number;
  familyId: string;

  createdAt: Date;
  updatedAt: Date;

  completedAdventures: number;
  totalWonderScore: number;

  counters: WonderMemoryCounters;

  recentAdventures: WonderMemoryAdventure[];
}

export interface WonderMemorySummary {
  familyId: string;

  completedAdventures: number;
  totalWonderScore: number;
  averageWonderScore: number;

  topValue: WonderMemoryRanking | null;
  topFriend: WonderMemoryRanking | null;
  topWorld: WonderMemoryRanking | null;
  topTemplate: WonderMemoryRanking | null;
  topEmotion: WonderMemoryRanking | null;

  recentAdventureCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface WonderMemoryRanking {
  id: string;
  count: number;
}

export interface WonderMemoryPreferences {
  preferredValueIds: string[];
  preferredFriendIds: string[];
  preferredWorldIds: string[];
  preferredTemplateIds: string[];
  preferredEmotions: string[];
}

export interface RecordWonderAdventureOptions {
  familyId: string;

  sessionId?: string | null;

  wonderScore?: number;

  completedAt?: Date;

  save?: boolean;
}

interface WonderProgressContainer {
  memory?: WonderMemoryProfile;

  [key: string]: unknown;
}

const MEMORY_VERSION = 1;

const MAX_RECENT_ADVENTURES = 365;

const DEFAULT_PREFERENCE_LIMIT = 3;

/**
 * Learns from completed Wonder adventures.
 *
 * Closed loop:
 *
 * Wonder Session
 * -> Wonder Memory
 * -> Preferences
 * -> Wonder DNA
 * -> Better future adventures
 */
export class WonderMemoryEngine {
  constructor(
    private readonly repository: WonderRepository =
      wonderRepository
  ) {}

  // =========================================================
  // CREATE
  // =========================================================

  createMemory(
    familyId: string
  ): WonderMemoryProfile {
    const cleanFamilyId =
      normaliseRequiredText(
        familyId,
        "familyId"
      );

    const now = new Date();

    return {
      id: createMemoryId(cleanFamilyId),

      version: MEMORY_VERSION,

      familyId: cleanFamilyId,

      createdAt: now,

      updatedAt: now,

      completedAdventures: 0,

      totalWonderScore: 0,

      counters:
        createEmptyCounters(),

      recentAdventures: [],
    };
  }

  /**
   * Loads the existing profile or creates a new in-memory profile.
   *
   * A newly created profile is not persisted until saveMemory()
   * or recordAdventure() is called.
   */
  getOrCreateMemory(
    familyId: string
  ): WonderMemoryProfile {
    const storedMemory =
      this.loadMemory();

    if (
      storedMemory &&
      normaliseValue(
        storedMemory.familyId
      ) ===
        normaliseValue(familyId)
    ) {
      return storedMemory;
    }

    return this.createMemory(
      familyId
    );
  }

  // =========================================================
  // RECORD ADVENTURES
  // =========================================================

  /**
   * Records one completed WonderCard.
   */
  recordAdventure(
    card: WonderCard,
    options: RecordWonderAdventureOptions
  ): WonderMemoryProfile {
    const memory =
      this.getOrCreateMemory(
        options.familyId
      );

    const adventure =
      this.createAdventureMemory(
        card,
        options
      );

    /*
     * Prevent the same completed card/session from being counted twice.
     */
    const alreadyRecorded =
      memory.recentAdventures.some(
        (item) =>
          item.id === adventure.id ||
          (
            adventure.sessionId !== null &&
            item.sessionId ===
              adventure.sessionId
          )
      );

    if (alreadyRecorded) {
      return cloneMemoryProfile(
        memory
      );
    }

    const updatedMemory: WonderMemoryProfile = {
      ...cloneMemoryProfile(memory),

      version: Math.max(
        MEMORY_VERSION,
        memory.version
      ),

      updatedAt: new Date(),

      completedAdventures:
        memory.completedAdventures + 1,

      totalWonderScore:
        memory.totalWonderScore +
        adventure.wonderScore,

      counters: {
        values: incrementCounter(
          memory.counters.values,
          adventure.valueId
        ),

        friends: incrementCounter(
          memory.counters.friends,
          adventure.friendId
        ),

        worlds: incrementCounter(
          memory.counters.worlds,
          adventure.worldId
        ),

        templates: incrementCounter(
          memory.counters.templates,
          adventure.templateId
        ),

        emotions: incrementCounter(
          memory.counters.emotions,
          adventure.emotion
        ),
      },

      recentAdventures: [
        adventure,
        ...memory.recentAdventures,
      ].slice(
        0,
        MAX_RECENT_ADVENTURES
      ),
    };

    if (options.save !== false) {
      this.saveMemory(
        updatedMemory
      );
    }

    return cloneMemoryProfile(
      updatedMemory
    );
  }

  /**
   * Records a completed WonderSession.
   */
  recordSession(
    session: WonderSession,
    familyId: string
  ): WonderMemoryProfile {
    if (
      session.status !== "completed"
    ) {
      throw new Error(
        "WonderMemoryEngine: only completed sessions can be recorded."
      );
    }

    return this.recordAdventure(
      session.card,
      {
        familyId,

        sessionId: session.id,

        wonderScore:
          session.wonderScore,

        completedAt:
          session.completedAt ??
          session.updatedAt,

        save: true,
      }
    );
  }

  // =========================================================
  // STORAGE
  // =========================================================

  saveMemory(
    memory: WonderMemoryProfile
  ): boolean {
    const validMemory =
      hydrateMemoryProfile(memory);

    this.assertValidMemory(
      validMemory
    );

    const existingProgress =
      this.repository.loadProgress<WonderProgressContainer>() ??
      {};

    const updatedProgress: WonderProgressContainer = {
      ...existingProgress,

      memory:
        cloneMemoryProfile(
          validMemory
        ),
    };

    return this.repository.saveProgress(
      updatedProgress
    );
  }

  loadMemory(): WonderMemoryProfile | null {
    const progress =
      this.repository.loadProgress<WonderProgressContainer>();

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

      this.assertValidMemory(
        memory
      );

      return cloneMemoryProfile(
        memory
      );
    } catch (error) {
      console.error(
        "[WonderMemoryEngine] Invalid stored memory.",
        error
      );

      return null;
    }
  }

  hasMemory(): boolean {
    return this.loadMemory() !== null;
  }

  clearMemory(): boolean {
    const progress =
      this.repository.loadProgress<WonderProgressContainer>();

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
  // SUMMARY
  // =========================================================

  getSummary(
    memory: WonderMemoryProfile
  ): WonderMemorySummary {
    this.assertValidMemory(memory);

    const completedAdventures =
      normaliseNonNegativeInteger(
        memory.completedAdventures
      );

    const totalWonderScore =
      normaliseNonNegativeInteger(
        memory.totalWonderScore
      );

    return {
      familyId: memory.familyId,

      completedAdventures,

      totalWonderScore,

      averageWonderScore:
        completedAdventures > 0
          ? roundNumber(
              totalWonderScore /
                completedAdventures,
              1
            )
          : 0,

      topValue: getTopRanking(
        memory.counters.values
      ),

      topFriend: getTopRanking(
        memory.counters.friends
      ),

      topWorld: getTopRanking(
        memory.counters.worlds
      ),

      topTemplate: getTopRanking(
        memory.counters.templates
      ),

      topEmotion: getTopRanking(
        memory.counters.emotions
      ),

      recentAdventureCount:
        memory.recentAdventures.length,

      createdAt: new Date(
        memory.createdAt.getTime()
      ),

      updatedAt: new Date(
        memory.updatedAt.getTime()
      ),
    };
  }

  getStoredSummary(): WonderMemorySummary | null {
    const memory =
      this.loadMemory();

    return memory
      ? this.getSummary(memory)
      : null;
  }

  // =========================================================
  // RANKINGS
  // =========================================================

  getTopValues(
    memory: WonderMemoryProfile,
    limit = DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankCounters(
      memory.counters.values,
      limit
    );
  }

  getTopFriends(
    memory: WonderMemoryProfile,
    limit = DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankCounters(
      memory.counters.friends,
      limit
    );
  }

  getTopWorlds(
    memory: WonderMemoryProfile,
    limit = DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankCounters(
      memory.counters.worlds,
      limit
    );
  }

  getTopTemplates(
    memory: WonderMemoryProfile,
    limit = DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankCounters(
      memory.counters.templates,
      limit
    );
  }

  getTopEmotions(
    memory: WonderMemoryProfile,
    limit = DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankCounters(
      memory.counters.emotions,
      limit
    );
  }

  // =========================================================
  // DNA PREFERENCES
  // =========================================================

  /**
   * Converts family memory into preferences accepted by WonderDNAEngine.
   */
  getPreferences(
    memory: WonderMemoryProfile,
    limit = DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryPreferences {
    return {
      preferredValueIds:
        this.getTopValues(
          memory,
          limit
        ).map(
          (item) => item.id
        ),

      preferredFriendIds:
        this.getTopFriends(
          memory,
          limit
        ).map(
          (item) => item.id
        ),

      preferredWorldIds:
        this.getTopWorlds(
          memory,
          limit
        ).map(
          (item) => item.id
        ),

      preferredTemplateIds:
        this.getTopTemplates(
          memory,
          limit
        ).map(
          (item) => item.id
        ),

      preferredEmotions:
        this.getTopEmotions(
          memory,
          limit
        ).map(
          (item) => item.id
        ),
    };
  }

  getStoredPreferences(
    limit = DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryPreferences {
    const memory =
      this.loadMemory();

    if (!memory) {
      return {
        preferredValueIds: [],
        preferredFriendIds: [],
        preferredWorldIds: [],
        preferredTemplateIds: [],
        preferredEmotions: [],
      };
    }

    return this.getPreferences(
      memory,
      limit
    );
  }

  // =========================================================
  // RECENT HISTORY
  // =========================================================

  getRecentAdventures(
    memory: WonderMemoryProfile,
    limit = 10
  ): WonderMemoryAdventure[] {
    const safeLimit =
      clampInteger(
        limit,
        0,
        MAX_RECENT_ADVENTURES
      );

    return memory.recentAdventures
      .slice(0, safeLimit)
      .map(
        cloneMemoryAdventure
      );
  }

  hasRecentlyPlayedValue(
    memory: WonderMemoryProfile,
    valueId: string,
    withinLast = 5
  ): boolean {
    return this.hasRecentlyPlayed(
      memory,
      "valueId",
      valueId,
      withinLast
    );
  }

  hasRecentlyPlayedWorld(
    memory: WonderMemoryProfile,
    worldId: string,
    withinLast = 5
  ): boolean {
    return this.hasRecentlyPlayed(
      memory,
      "worldId",
      worldId,
      withinLast
    );
  }

  hasRecentlyPlayedTemplate(
    memory: WonderMemoryProfile,
    templateId: string,
    withinLast = 5
  ): boolean {
    return this.hasRecentlyPlayed(
      memory,
      "templateId",
      templateId,
      withinLast
    );
  }

  private hasRecentlyPlayed(
    memory: WonderMemoryProfile,
    field:
      | "valueId"
      | "worldId"
      | "templateId",
    id: string,
    withinLast: number
  ): boolean {
    const target =
      normaliseValue(id);

    const safeLimit =
      clampInteger(
        withinLast,
        0,
        MAX_RECENT_ADVENTURES
      );

    return memory.recentAdventures
      .slice(0, safeLimit)
      .some(
        (adventure) =>
          normaliseValue(
            adventure[field]
          ) === target
      );
  }
  // =========================================================
  // RELATIONSHIP COMPATIBILITY
  // =========================================================

  /**
   * Returns the number of completed adventures stored
   * in the current family memory.
   */
  getAdventureCount(): number {
    const memory =
      this.loadMemory();

    return memory
      ? normaliseNonNegativeInteger(
          memory.completedAdventures
        )
      : 0;
  }

  /**
   * Calculates the current friendship level.
   *
   * Every five completed adventures increases the level.
   * A new family begins at level one.
   */
  getFriendshipLevel(): number {
    const adventureCount =
      this.getAdventureCount();

    return Math.min(
      100,
      Math.floor(
        adventureCount / 5
      ) + 1
    );
  }

  /**
   * Returns the most frequently experienced emotion.
   */
  getFavouriteEmotion(): string {
    const memory =
      this.loadMemory();

    if (!memory) {
      return "wonder";
    }

    return (
      getTopRanking(
        memory.counters.emotions
      )?.id ?? "wonder"
    );
  }

  /**
   * Calculates consecutive play days.
   *
   * A streak remains active when the latest adventure
   * was completed today or yesterday.
   */
  getCurrentStreak(): number {
    const memory =
      this.loadMemory();

    if (
      !memory ||
      memory.recentAdventures.length ===
        0
    ) {
      return 0;
    }

    const uniqueDayKeys =
      Array.from(
        new Set(
          memory.recentAdventures.map(
            (adventure) =>
              createLocalDateKey(
                adventure.completedAt
              )
          )
        )
      ).sort(
        (first, second) =>
          second.localeCompare(first)
      );

    if (
      uniqueDayKeys.length === 0
    ) {
      return 0;
    }

    const today =
      startOfLocalDay(
        new Date()
      );

    const latestDay =
      dateKeyToLocalDate(
        uniqueDayKeys[0]
      );

    const daysSinceLatest =
      differenceInCalendarDays(
        today,
        latestDay
      );

    if (
      daysSinceLatest > 1
    ) {
      return 0;
    }

    let streak = 1;
    let previousDay =
      latestDay;

    for (
      let index = 1;
      index < uniqueDayKeys.length;
      index += 1
    ) {
      const currentDay =
        dateKeyToLocalDate(
          uniqueDayKeys[index]
        );

      const dayDifference =
        differenceInCalendarDays(
          previousDay,
          currentDay
        );

      if (dayDifference !== 1) {
        break;
      }

      streak += 1;
      previousDay = currentDay;
    }

    return streak;
  }  



  // =========================================================
  // INTERNAL
  // =========================================================

  private createAdventureMemory(
    card: WonderCard,
    options: RecordWonderAdventureOptions
  ): WonderMemoryAdventure {
    const completedAt =
      normaliseDate(
        options.completedAt
      );

    const sessionId =
      normaliseOptionalText(
        options.sessionId
      );

    const wonderScore =
      normaliseNonNegativeInteger(
        options.wonderScore ??
          card.wonderScore
      );

    const sourceId = [
      sessionId ?? card.id,
      card.genome.id,
      completedAt.toISOString(),
    ].join(":");

    return {
      id: createAdventureId(
        sourceId
      ),

      sessionId,

      cardId: card.id,

      genomeId:
        card.genome.id,

      valueId:
        normaliseRequiredText(
          card.genome.value.id,
          "card.genome.value.id"
        ),

      valueName:
        normaliseRequiredText(
          card.genome.value.name,
          "card.genome.value.name"
        ),

      friendId:
        normaliseRequiredText(
          card.genome.friend.id,
          "card.genome.friend.id"
        ),

      friendName:
        normaliseRequiredText(
          card.genome.friend.name,
          "card.genome.friend.name"
        ),

      worldId:
        normaliseRequiredText(
          card.genome.world.id,
          "card.genome.world.id"
        ),

      worldName:
        normaliseRequiredText(
          card.genome.world.name,
          "card.genome.world.name"
        ),

      templateId:
        normaliseRequiredText(
          card.genome.template.id,
          "card.genome.template.id"
        ),

      templateName:
        normaliseRequiredText(
          card.genome.template.name,
          "card.genome.template.name"
        ),

      emotion:
        normaliseRequiredText(
          card.genome.emotion,
          "card.genome.emotion"
        ),

      location:
        normaliseRequiredText(
          card.genome.location,
          "card.genome.location"
        ),

      wonderScore,

      completedAt,
    };
  }
  
  private assertValidMemory(
    memory: WonderMemoryProfile
  ): void {
    if (!hasText(memory.id)) {
      throw new Error(
        "WonderMemoryEngine: memory ID is required."
      );
    }

    if (!hasText(memory.familyId)) {
      throw new Error(
        "WonderMemoryEngine: family ID is required."
      );
    }

    if (
      !isValidDate(
        memory.createdAt
      )
    ) {
      throw new Error(
        "WonderMemoryEngine: createdAt is invalid."
      );
    }

    if (
      !isValidDate(
        memory.updatedAt
      )
    ) {
      throw new Error(
        "WonderMemoryEngine: updatedAt is invalid."
      );
    }

    if (
      !Number.isFinite(
        memory.completedAdventures
      ) ||
      memory.completedAdventures < 0
    ) {
      throw new Error(
        "WonderMemoryEngine: completedAdventures is invalid."
      );
    }

    if (
      !Number.isFinite(
        memory.totalWonderScore
      ) ||
      memory.totalWonderScore < 0
    ) {
      throw new Error(
        "WonderMemoryEngine: totalWonderScore is invalid."
      );
    }

    if (
      !Array.isArray(
        memory.recentAdventures
      )
    ) {
      throw new Error(
        "WonderMemoryEngine: recentAdventures must be an array."
      );
    }
  }
}

// =========================================================
// COUNTERS
// =========================================================

function createEmptyCounters(): WonderMemoryCounters {
  return {
    values: {},
    friends: {},
    worlds: {},
    templates: {},
    emotions: {},
  };
}

function incrementCounter(
  counter: Record<string, number>,
  id: string
): Record<string, number> {
  const cleanId =
    normaliseValue(id);

  return {
    ...counter,

    [cleanId]:
      normaliseNonNegativeInteger(
        counter[cleanId] ?? 0
      ) + 1,
  };
}

function rankCounters(
  counter: Record<string, number>,
  limit: number
): WonderMemoryRanking[] {
  const safeLimit =
    clampInteger(
      limit,
      0,
      100
    );

  return Object.entries(counter)
    .map(
      ([id, count]) => ({
        id,

        count:
          normaliseNonNegativeInteger(
            count
          ),
      })
    )
    .filter(
      (item) =>
        item.id.length > 0 &&
        item.count > 0
    )
    .sort(
      (first, second) => {
        if (
          second.count !==
          first.count
        ) {
          return (
            second.count -
            first.count
          );
        }

        return first.id.localeCompare(
          second.id
        );
      }
    )
    .slice(0, safeLimit);
}

function getTopRanking(
  counter: Record<string, number>
): WonderMemoryRanking | null {
  return (
    rankCounters(
      counter,
      1
    )[0] ?? null
  );
}

// =========================================================
// STORAGE HYDRATION
// =========================================================

function hydrateMemoryProfile(
  memory: WonderMemoryProfile
): WonderMemoryProfile {
  return {
    ...memory,

    id:
      typeof memory.id === "string"
        ? memory.id
        : "",

    familyId:
      typeof memory.familyId ===
      "string"
        ? memory.familyId
        : "",

    version:
      normalisePositiveInteger(
        memory.version,
        MEMORY_VERSION
      ),

    createdAt:
      hydrateDate(
        memory.createdAt
      ),

    updatedAt:
      hydrateDate(
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
      hydrateCounters(
        memory.counters
      ),

    recentAdventures:
      Array.isArray(
        memory.recentAdventures
      )
        ? memory.recentAdventures
            .map(
              hydrateMemoryAdventure
            )
            .slice(
              0,
              MAX_RECENT_ADVENTURES
            )
        : [],
  };
}

function hydrateCounters(
  counters:
    | WonderMemoryCounters
    | undefined
): WonderMemoryCounters {
  return {
    values: hydrateCounter(
      counters?.values
    ),

    friends: hydrateCounter(
      counters?.friends
    ),

    worlds: hydrateCounter(
      counters?.worlds
    ),

    templates: hydrateCounter(
      counters?.templates
    ),

    emotions: hydrateCounter(
      counters?.emotions
    ),
  };
}

function hydrateCounter(
  value:
    | Record<string, number>
    | undefined
): Record<string, number> {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return {};
  }

  return Object.entries(value).reduce<
    Record<string, number>
  >(
    (
      hydratedCounter,
      [rawId, rawCount]
    ) => {
      const id =
        normaliseValue(rawId);

      const count =
        normaliseNonNegativeInteger(
          rawCount
        );

      if (
        id.length > 0 &&
        count > 0
      ) {
        hydratedCounter[id] =
          count;
      }

      return hydratedCounter;
    },
    {}
  );

}

function hydrateMemoryAdventure(
  adventure: WonderMemoryAdventure
): WonderMemoryAdventure {
  return {
    ...adventure,

    sessionId:
      normaliseOptionalText(
        adventure.sessionId
      ),

    wonderScore:
      normaliseNonNegativeInteger(
        adventure.wonderScore
      ),

    completedAt:
      hydrateDate(
        adventure.completedAt
      ),
  };
}

// =========================================================
// CLONING
// =========================================================

function cloneMemoryProfile(
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

    counters: {
      values: {
        ...memory.counters.values,
      },

      friends: {
        ...memory.counters.friends,
      },

      worlds: {
        ...memory.counters.worlds,
      },

      templates: {
        ...memory.counters.templates,
      },

      emotions: {
        ...memory.counters.emotions,
      },
    },

    recentAdventures:
      memory.recentAdventures.map(
        cloneMemoryAdventure
      ),
  };
}

function cloneMemoryAdventure(
  adventure: WonderMemoryAdventure
): WonderMemoryAdventure {
  return {
    ...adventure,

    completedAt: new Date(
      adventure.completedAt.getTime()
    ),
  };
}

// =========================================================
// IDS
// =========================================================

function createMemoryId(
  familyId: string
): string {
  const familySlug =
    createSlug(familyId) ||
    "family";

  return `wonder-memory-${familySlug}`;
}

function createAdventureId(
  source: string
): string {
  const hash =
    hashText(source)
      .toString(36)
      .padStart(7, "0");

  return `wonder-memory-adventure-${hash}`;
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
    hash ^= text.charCodeAt(
      index
    );

    hash = Math.imul(
      hash,
      16777619
    );
  }

  return hash >>> 0;
}

// =========================================================
// NORMALISATION
// =========================================================

function normaliseRequiredText(
  value: string,
  fieldName: string
): string {
  const cleanValue =
    value.trim();

  if (
    cleanValue.length === 0
  ) {
    throw new Error(
      `WonderMemoryEngine: "${fieldName}" is required.`
    );
  }

  return cleanValue;
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

  const cleanValue =
    value.trim();

  return cleanValue.length > 0
    ? cleanValue
    : null;
}

function normaliseValue(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
}

function normaliseDate(
  value: Date | undefined
): Date {
  return isValidDate(value)
    ? new Date(value.getTime())
    : new Date();
}

function hydrateDate(
  value: Date | string
): Date {
  if (value instanceof Date) {
    return new Date(
      value.getTime()
    );
  }

  return new Date(value);
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

function normaliseNonNegativeInteger(
  value: number
): number {
  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(value)
  );
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

function roundNumber(
  value: number,
  decimalPlaces: number
): number {
  const multiplier =
    10 ** decimalPlaces;

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

function hasText(
  value: string
): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}


  value: unknown
): value is Date {
  return (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  );
}

  
    value: unknown
  ): value is Date {
    return (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime()
      )
    );
  }
  
  function createLocalDateKey(
    date: Date
  ): string {
    const safeDate =
      isValidDate(date)
        ? date
        : new Date();
  
    return [
      safeDate.getFullYear(),
      String(
        safeDate.getMonth() + 1
      ).padStart(2, "0"),
      String(
        safeDate.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }
  
  function dateKeyToLocalDate(
    dateKey: string
  ): Date {
    const parts = dateKey
      .split("-")
      .map(Number);
  
    const year =
      parts[0] ?? 1970;
  
    const month =
      parts[1] ?? 1;
  
    const day =
      parts[2] ?? 1;
  
    return new Date(
      year,
      month - 1,
      day
    );
  }
  
  function startOfLocalDay(
    date: Date
  ): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }
  
  function differenceInCalendarDays(
    laterDate: Date,
    earlierDate: Date
  ): number {
    const millisecondsPerDay =
      24 * 60 * 60 * 1000;
  
    const laterUtc = Date.UTC(
      laterDate.getFullYear(),
      laterDate.getMonth(),
      laterDate.getDate()
    );
  
    const earlierUtc = Date.UTC(
      earlierDate.getFullYear(),
      earlierDate.getMonth(),
      earlierDate.getDate()
    );
  
    return Math.round(
      (laterUtc - earlierUtc) /
        millisecondsPerDay
    );
  }
  
  export const wonderMemoryEngine =
    new WonderMemoryEngine();
  
  export default WonderMemoryEngine;
