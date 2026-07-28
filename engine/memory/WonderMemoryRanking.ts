import {
    clampInteger,
    normaliseNonNegativeInteger,
    normaliseValue,
  } from "./WonderMemoryHelpers";
  
  import type {
    WonderMemoryCounters,
    WonderMemoryPreferences,
    WonderMemoryProfile,
    WonderMemoryRanking,
  } from "./WonderMemoryTypes";
  
  export const DEFAULT_MEMORY_PREFERENCE_LIMIT = 3;
  
  const MAX_RANKING_LIMIT = 100;
  
  /**
   * Creates a fresh collection of Wonder Memory counters.
   */
  export function createEmptyMemoryCounters(): WonderMemoryCounters {
    return {
      values: {},
  
      friends: {},
  
      worlds: {},
  
      templates: {},
  
      emotions: {},
    };
  }
  
  /**
   * Returns a new counter with the selected ID incremented.
   *
   * The original counter is never mutated.
   */
  export function incrementMemoryCounter(
    counter: Readonly<Record<string, number>>,
    id: string,
    amount = 1
  ): Record<string, number> {
    const cleanId =
      normaliseValue(id);
  
    if (cleanId.length === 0) {
      return {
        ...counter,
      };
    }
  
    const safeAmount =
      normaliseNonNegativeInteger(
        amount
      );
  
    if (safeAmount === 0) {
      return {
        ...counter,
      };
    }
  
    const currentCount =
      normaliseNonNegativeInteger(
        counter[cleanId] ?? 0
      );
  
    return {
      ...counter,
  
      [cleanId]:
        currentCount + safeAmount,
    };
  }
  
  /**
   * Converts one counter object into a sorted ranking.
   *
   * Ranking rules:
   *
   * 1. Highest count first.
   * 2. Alphabetical ID order when counts are equal.
   */
  export function rankMemoryCounter(
    counter: Readonly<Record<string, number>>,
    limit = DEFAULT_MEMORY_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    const safeLimit =
      clampInteger(
        limit,
        0,
        MAX_RANKING_LIMIT
      );
  
    if (safeLimit === 0) {
      return [];
    }
  
    return Object.entries(counter)
      .map(
        ([rawId, rawCount]) => {
          const id =
            normaliseValue(rawId);
  
          const count =
            normaliseNonNegativeInteger(
              rawCount
            );
  
          return {
            id,
            count,
          };
        }
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
      .slice(
        0,
        safeLimit
      );
  }
  
  /**
   * Returns the highest-ranked item from a counter.
   */
  export function getTopMemoryRanking(
    counter: Readonly<Record<string, number>>
  ): WonderMemoryRanking | null {
    return (
      rankMemoryCounter(
        counter,
        1
      )[0] ?? null
    );
  }
  
  /**
   * Returns the top Wonder Values.
   */
  export function getTopMemoryValues(
    memory: WonderMemoryProfile,
    limit = DEFAULT_MEMORY_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankMemoryCounter(
      memory.counters.values,
      limit
    );
  }
  
  /**
   * Returns the most frequently played Wonder Friends.
   */
  export function getTopMemoryFriends(
    memory: WonderMemoryProfile,
    limit = DEFAULT_MEMORY_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankMemoryCounter(
      memory.counters.friends,
      limit
    );
  }
  
  /**
   * Returns the most frequently explored Wonder Worlds.
   */
  export function getTopMemoryWorlds(
    memory: WonderMemoryProfile,
    limit = DEFAULT_MEMORY_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankMemoryCounter(
      memory.counters.worlds,
      limit
    );
  }
  
  /**
   * Returns the most frequently played story templates.
   */
  export function getTopMemoryTemplates(
    memory: WonderMemoryProfile,
    limit = DEFAULT_MEMORY_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankMemoryCounter(
      memory.counters.templates,
      limit
    );
  }
  
  /**
   * Returns the most frequently experienced emotions.
   */
  export function getTopMemoryEmotions(
    memory: WonderMemoryProfile,
    limit = DEFAULT_MEMORY_PREFERENCE_LIMIT
  ): WonderMemoryRanking[] {
    return rankMemoryCounter(
      memory.counters.emotions,
      limit
    );
  }
  
  /**
   * Converts Wonder Memory rankings into preferences accepted
   * by WonderDNAEngine.
   */
  export function createMemoryPreferences(
    memory: WonderMemoryProfile,
    limit = DEFAULT_MEMORY_PREFERENCE_LIMIT
  ): WonderMemoryPreferences {
    return {
      preferredValueIds:
        getTopMemoryValues(
          memory,
          limit
        ).map(
          (item) => item.id
        ),
  
      preferredFriendIds:
        getTopMemoryFriends(
          memory,
          limit
        ).map(
          (item) => item.id
        ),
  
      preferredWorldIds:
        getTopMemoryWorlds(
          memory,
          limit
        ).map(
          (item) => item.id
        ),
  
      preferredTemplateIds:
        getTopMemoryTemplates(
          memory,
          limit
        ).map(
          (item) => item.id
        ),
  
      preferredEmotions:
        getTopMemoryEmotions(
          memory,
          limit
        ).map(
          (item) => item.id
        ),
    };
  }
  
  /**
   * Creates an empty preference object.
   */
  export function createEmptyMemoryPreferences(): WonderMemoryPreferences {
    return {
      preferredValueIds: [],
  
      preferredFriendIds: [],
  
      preferredWorldIds: [],
  
      preferredTemplateIds: [],
  
      preferredEmotions: [],
    };
  }
  
  /**
   * Hydrates one counter loaded from storage.
   *
   * Invalid IDs and zero or negative counts are removed.
   */
  export function hydrateMemoryCounter(
    value:
      | Record<string, number>
      | null
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
  
  /**
   * Hydrates all Wonder Memory counters loaded from storage.
   */
  export function hydrateMemoryCounters(
    counters:
      | Partial<WonderMemoryCounters>
      | null
      | undefined
  ): WonderMemoryCounters {
    return {
      values:
        hydrateMemoryCounter(
          counters?.values
        ),
  
      friends:
        hydrateMemoryCounter(
          counters?.friends
        ),
  
      worlds:
        hydrateMemoryCounter(
          counters?.worlds
        ),
  
      templates:
        hydrateMemoryCounter(
          counters?.templates
        ),
  
      emotions:
        hydrateMemoryCounter(
          counters?.emotions
        ),
    };
  }
  
  /**
   * Creates a defensive copy of all counters.
   */
  export function cloneMemoryCounters(
    counters: WonderMemoryCounters
  ): WonderMemoryCounters {
    return {
      values: {
        ...counters.values,
      },
  
      friends: {
        ...counters.friends,
      },
  
      worlds: {
        ...counters.worlds,
      },
  
      templates: {
        ...counters.templates,
      },
  
      emotions: {
        ...counters.emotions,
      },
    };
  }
  
  /**
   * Returns the total number of recorded counter events.
   */
  export function getMemoryCounterTotal(
    counter: Readonly<Record<string, number>>
  ): number {
    return Object.values(counter).reduce(
      (total, count) =>
        total +
        normaliseNonNegativeInteger(
          count
        ),
      0
    );
  }
  
  /**
   * Returns whether a counter contains a positive entry.
   */
  export function hasMemoryCounterEntry(
    counter: Readonly<Record<string, number>>,
    id: string
  ): boolean {
    const cleanId =
      normaliseValue(id);
  
    if (cleanId.length === 0) {
      return false;
    }
  
    return (
      normaliseNonNegativeInteger(
        counter[cleanId] ?? 0
      ) > 0
    );
  }