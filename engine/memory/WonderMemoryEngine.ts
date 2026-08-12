import type { WonderSession } from "@/engine/session/WonderSessionEngine";
import type { WonderCard } from "@/types/wondercard";

import {
  createLocalDateKey,
  createSlug,
  dateKeyToLocalDate,
  differenceInCalendarDays,
  hashText,
  normaliseDate,
  normaliseNonNegativeInteger,
  normaliseOptionalText,
  normaliseRequiredText,
  normaliseValue,
  roundNumber,
  startOfLocalDay,
} from "./WonderMemoryHelpers";

import {
  createEmptyMemoryCounters,
  createEmptyMemoryPreferences,
  createMemoryPreferences,
  getTopMemoryEmotions,
  getTopMemoryFriends,
  getTopMemoryRanking,
  getTopMemoryTemplates,
  getTopMemoryValues,
  getTopMemoryWorlds,
  incrementMemoryCounter,
} from "./WonderMemoryRanking";

import {
  MAX_STORED_MEMORY_ADVENTURES,
  WONDER_MEMORY_VERSION,
  WonderMemoryStorage,
  cloneMemoryAdventure,
  cloneMemoryProfile,
  wonderMemoryStorage,
} from "./WonderMemoryStorage";

import type {
  RecordWonderAdventureOptions,
  WonderMemoryAdventure,
  WonderMemoryPreferences,
  WonderMemoryProfile,
  WonderMemoryRanking,
  WonderMemorySummary,
} from "./WonderMemoryTypes";

export type {
  RecordWonderAdventureOptions,
  WonderMemoryAdventure,
  WonderMemoryCounters,
  WonderMemoryPreferences,
  WonderMemoryProfile,
  WonderMemoryProgressContainer,
  WonderMemoryRanking,
  WonderMemorySummary,
} from "./WonderMemoryTypes";

const DEFAULT_PREFERENCE_LIMIT = 3;

const ADVENTURES_PER_FRIENDSHIP_LEVEL = 5;

const MAX_FRIENDSHIP_LEVEL = 10;

/**
 * Learns from completed Wonder adventures.
 *
 * Responsibilities:
 *
 * - record completed adventures
 * - update family counters
 * - produce memory summaries
 * - calculate family preferences
 * - expose relationship compatibility methods
 *
 * Persistence and hydration are delegated to WonderMemoryStorage.
 * Ranking logic is delegated to WonderMemoryRanking.
 */
export class WonderMemoryEngine {
  constructor(
    private readonly storage: WonderMemoryStorage =
      wonderMemoryStorage
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
      id: createMemoryId(
        cleanFamilyId
      ),

      version:
        WONDER_MEMORY_VERSION,

      familyId:
        cleanFamilyId,

      createdAt: now,

      updatedAt: new Date(
        now.getTime()
      ),

      completedAdventures: 0,

      totalWonderScore: 0,

      counters:
        createEmptyMemoryCounters(),

      recentAdventures: [],
    };
  }

  getOrCreateMemory(
    familyId: string
  ): WonderMemoryProfile {
    const cleanFamilyId =
      normaliseRequiredText(
        familyId,
        "familyId"
      );

    const storedMemory =
      this.loadMemory();

    if (
      storedMemory &&
      normaliseValue(
        storedMemory.familyId
      ) ===
        normaliseValue(
          cleanFamilyId
        )
    ) {
      return storedMemory;
    }

    return this.createMemory(
      cleanFamilyId
    );
  }

  // =========================================================
  // RECORDING
  // =========================================================

  recordAdventure(
    card: WonderCard,
    options: RecordWonderAdventureOptions
  ): WonderMemoryProfile {
    const memory =
      this.getOrCreateMemory(
        options.familyId
      );

    const adventure =
      createAdventureMemory(
        card,
        options
      );

    if (
      hasRecordedAdventure(
        memory,
        adventure
      )
    ) {
      return cloneMemoryProfile(
        memory
      );
    }

    const updatedMemory: WonderMemoryProfile = {
      ...cloneMemoryProfile(
        memory
      ),

      version: Math.max(
        memory.version,
        WONDER_MEMORY_VERSION
      ),

      updatedAt: new Date(),

      completedAdventures:
        normaliseNonNegativeInteger(
          memory.completedAdventures
        ) + 1,

      totalWonderScore:
        normaliseNonNegativeInteger(
          memory.totalWonderScore
        ) +
        adventure.wonderScore,

      counters: {
        values:
          incrementMemoryCounter(
            memory.counters.values,
            adventure.valueId
          ),

        friends:
          incrementMemoryCounter(
            memory.counters.friends,
            adventure.friendId
          ),

        worlds:
          incrementMemoryCounter(
            memory.counters.worlds,
            adventure.worldId
          ),

        templates:
          incrementMemoryCounter(
            memory.counters.templates,
            adventure.templateId
          ),

        emotions:
          incrementMemoryCounter(
            memory.counters.emotions,
            adventure.emotion
          ),
      },

      recentAdventures: [
        adventure,

        ...memory.recentAdventures.map(
          cloneMemoryAdventure
        ),
      ].slice(
        0,
        MAX_STORED_MEMORY_ADVENTURES
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

  recordSession(
    session: WonderSession,
    familyId: string
  ): WonderMemoryProfile {
    if (
      session.status !==
      "completed"
    ) {
      throw new Error(
        "WonderMemoryEngine: only completed sessions can be recorded."
      );
    }

    return this.recordAdventure(
      session.card,
      {
        familyId,

        sessionId:
          session.id,

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
    return this.storage.save(
      memory
    );
  }

  loadMemory(): WonderMemoryProfile | null {
    return this.storage.load();
  }

  hasMemory(): boolean {
    return this.storage.has();
  }

  clearMemory(): boolean {
    return this.storage.clear();
  }

  replaceMemory(
    memory: WonderMemoryProfile
  ): WonderMemoryProfile {
    return this.storage.replace(
      memory
    );
  }

  // =========================================================
  // SUMMARY
  // =========================================================

  getSummary(
    memory: WonderMemoryProfile
  ): WonderMemorySummary {
    const completedAdventures =
      normaliseNonNegativeInteger(
        memory.completedAdventures
      );

    const totalWonderScore =
      normaliseNonNegativeInteger(
        memory.totalWonderScore
      );

    return {
      familyId:
        memory.familyId,

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

      topValue:
        getTopMemoryRanking(
          memory.counters.values
        ),

      topFriend:
        getTopMemoryRanking(
          memory.counters.friends
        ),

      topWorld:
        getTopMemoryRanking(
          memory.counters.worlds
        ),

      topTemplate:
        getTopMemoryRanking(
          memory.counters.templates
        ),

      topEmotion:
        getTopMemoryRanking(
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
    limit =
      DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return getTopMemoryValues(
      memory,
      limit
    );
  }

  getTopFriends(
    memory: WonderMemoryProfile,
    limit =
      DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return getTopMemoryFriends(
      memory,
      limit
    );
  }

  getTopWorlds(
    memory: WonderMemoryProfile,
    limit =
      DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return getTopMemoryWorlds(
      memory,
      limit
    );
  }

  getTopTemplates(
    memory: WonderMemoryProfile,
    limit =
      DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return getTopMemoryTemplates(
      memory,
      limit
    );
  }

  getTopEmotions(
    memory: WonderMemoryProfile,
    limit =
      DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return getTopMemoryEmotions(
      memory,
      limit
    );
  }

  // =========================================================
  // DNA PREFERENCES
  // =========================================================

  getPreferences(
    memory: WonderMemoryProfile,
    limit =
      DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryPreferences {
    return createMemoryPreferences(
      memory,
      limit
    );
  }

  getStoredPreferences(
    limit =
      DEFAULT_PREFERENCE_LIMIT
  ): WonderMemoryPreferences {
    const memory =
      this.loadMemory();

    if (!memory) {
      return createEmptyMemoryPreferences();
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
      normaliseHistoryLimit(
        limit
      );

    return memory.recentAdventures
      .slice(
        0,
        safeLimit
      )
      .map(
        cloneMemoryAdventure
      );
  }

  hasRecentlyPlayedValue(
    memory: WonderMemoryProfile,
    valueId: string,
    withinLast = 5
  ): boolean {
    return hasRecentlyPlayed(
      memory,
      "valueId",
      valueId,
      withinLast
    );
  }

  hasRecentlyPlayedFriend(
    memory: WonderMemoryProfile,
    friendId: string,
    withinLast = 5
  ): boolean {
    return hasRecentlyPlayed(
      memory,
      "friendId",
      friendId,
      withinLast
    );
  }

  hasRecentlyPlayedWorld(
    memory: WonderMemoryProfile,
    worldId: string,
    withinLast = 5
  ): boolean {
    return hasRecentlyPlayed(
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
    return hasRecentlyPlayed(
      memory,
      "templateId",
      templateId,
      withinLast
    );
  }

  hasRecentlyPlayedEmotion(
    memory: WonderMemoryProfile,
    emotion: string,
    withinLast = 5
  ): boolean {
    return hasRecentlyPlayed(
      memory,
      "emotion",
      emotion,
      withinLast
    );
  }

  // =========================================================
  // RELATIONSHIP COMPATIBILITY
  // =========================================================

  getAdventureCount(): number {
    const memory =
      this.loadMemory();

    return memory
      ? normaliseNonNegativeInteger(
          memory.completedAdventures
        )
      : 0;
  }

  getTotalWonderScore(): number {
    const memory =
      this.loadMemory();

    return memory
      ? normaliseNonNegativeInteger(
          memory.totalWonderScore
        )
      : 0;
  }

  getFriendshipLevel(): number {
    const adventureCount =
      this.getAdventureCount();

    return Math.min(
      MAX_FRIENDSHIP_LEVEL,

      Math.floor(
        adventureCount /
          ADVENTURES_PER_FRIENDSHIP_LEVEL
      ) + 1
    );
  }

  getFavouriteEmotion(): string {
    const memory =
      this.loadMemory();

    if (!memory) {
      return "wonder";
    }

    return (
      getTopMemoryRanking(
        memory.counters.emotions
      )?.id ??
      "wonder"
    );
  }

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

    return calculateCurrentStreak(
      memory.recentAdventures
    );
  }
}

// =========================================================
// ADVENTURE CREATION
// =========================================================

function createAdventureMemory(
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

  const source = [
    sessionId ?? card.id,

    card.genome.id,

    completedAt.toISOString(),
  ].join(":");

  return {
    id:
      createAdventureId(
        source
      ),

    sessionId,

    cardId:
      normaliseRequiredText(
        card.id,
        "card.id"
      ),

    genomeId:
      normaliseRequiredText(
        card.genome.id,
        "card.genome.id"
      ),

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

function hasRecordedAdventure(
  memory: WonderMemoryProfile,
  adventure: WonderMemoryAdventure
): boolean {
  return memory.recentAdventures.some(
    (recordedAdventure) => {
      if (
        recordedAdventure.id ===
        adventure.id
      ) {
        return true;
      }

      if (
        adventure.sessionId !==
          null &&
        recordedAdventure.sessionId ===
          adventure.sessionId
      ) {
        return true;
      }

      return (
        recordedAdventure.cardId ===
          adventure.cardId &&
        recordedAdventure.genomeId ===
          adventure.genomeId
      );
    }
  );
}

// =========================================================
// RECENT HISTORY
// =========================================================

type RecentAdventureField =
  | "valueId"
  | "friendId"
  | "worldId"
  | "templateId"
  | "emotion";

function hasRecentlyPlayed(
  memory: WonderMemoryProfile,
  field: RecentAdventureField,
  id: string,
  withinLast: number
): boolean {
  const target =
    normaliseValue(id);

  if (target.length === 0) {
    return false;
  }

  const safeLimit =
    normaliseHistoryLimit(
      withinLast
    );

  return memory.recentAdventures
    .slice(
      0,
      safeLimit
    )
    .some(
      (adventure) =>
        normaliseValue(
          adventure[field]
        ) === target
    );
}

function normaliseHistoryLimit(
  value: number
): number {
  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.min(
    MAX_STORED_MEMORY_ADVENTURES,

    Math.max(
      0,
      Math.floor(value)
    )
  );
}

// =========================================================
// STREAK
// =========================================================

function calculateCurrentStreak(
  adventures:
    readonly WonderMemoryAdventure[]
): number {
  const uniqueDayKeys =
    Array.from(
      new Set(
        adventures.map(
          (adventure) =>
            createLocalDateKey(
              adventure.completedAt
            )
        )
      )
    ).sort(
      (first, second) =>
        second.localeCompare(
          first
        )
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
    daysSinceLatest < 0 ||
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

    const difference =
      differenceInCalendarDays(
        previousDay,
        currentDay
      );

    if (difference !== 1) {
      break;
    }

    streak += 1;

    previousDay =
      currentDay;
  }

  return streak;
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
      .padStart(
        7,
        "0"
      );

  return `wonder-memory-adventure-${hash}`;
}

export const wonderMemoryEngine =
  new WonderMemoryEngine();

export default WonderMemoryEngine;
