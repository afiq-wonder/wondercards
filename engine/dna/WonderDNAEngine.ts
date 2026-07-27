import {
    getAllWonderFriends,
    getDefaultWonderFriend,
  } from "@/data/friends";
  
  import {
    getAllWonderTemplates,
    getDefaultWonderTemplate,
  } from "@/data/templates";
  
  import {
    getAllWonderValues,
    getDefaultWonderValue,
  } from "@/data/values";
  
  import {
    getAllWonderWorlds,
    getDefaultWonderWorld,
  } from "@/data/worlds";
  
  import {
    getWonderArchetypeById,
  } from "@/data/wonderArchetypes";
  
  import type { WonderFriend } from "@/types/wonderFriend";
  import type { WonderGenome } from "@/types/wonderGenome";
  import type { WonderTemplate } from "@/types/wonderTemplate";
  import type { WonderValue } from "@/types/wonderValue";
  import type { WonderWorld } from "@/types/wonderWorld";
  
  export type WonderDNADifficulty =
    | "easy"
    | "medium"
    | "hard";
  
  export interface WonderDNAAgeRange {
    min: number;
    max: number;
  }
  
  export interface WonderDNAGenerationOptions {
    /**
     * Stable family identifier.
     *
     * The same family ID and date generate the same adventure.
     */
    familyId: string;
  
    /**
     * Daily adventure date.
     *
     * Supported formats:
     * - Date
     * - "YYYY-MM-DD"
     *
     * Defaults to today.
     */
    date?: Date | string;
  
    /**
     * Optional archetype used to bias content selection.
     *
     * Examples:
     * - wonder
     * - explorer
     * - dream-builder
     * - kind-heart
     * - adventure
     */
    archetypeId?: string;
  
    /**
     * Child age range.
     *
     * Defaults to ages 4–8.
     */
    ageRange?: WonderDNAAgeRange;
  
    /**
     * Optional explicit difficulty.
     *
     * When omitted, difficulty is derived from age.
     */
    difficulty?: WonderDNADifficulty;
  
    /**
     * Adventure duration in minutes.
     *
     * Defaults to five minutes.
     */
    duration?: number;
  
    /**
     * Optional content preferences.
     *
     * Invalid IDs are ignored safely.
     */
    preferredFriendIds?: readonly string[];
  
    preferredWorldIds?: readonly string[];
  
    preferredValueIds?: readonly string[];
  
    preferredTemplateIds?: readonly string[];
  
    /**
     * Optional explicit values.
     *
     * When provided, these override generated values.
     */
    location?: string;
  
    emotion?: string;
  
    /**
     * Additional deterministic variation.
     *
     * Useful when generating multiple adventures for the same day.
     */
    seedSalt?: string;
  
    /**
     * WonderGenome version.
     */
    version?: number;
  }
  
  export interface WonderDNAPreview {
    seed: string;
  
    dateKey: string;
  
    familyId: string;
  
    archetypeId: string;
  
    friend: WonderFriend;
  
    world: WonderWorld;
  
    location: string;
  
    value: WonderValue;
  
    template: WonderTemplate;
  
    emotion: string;
  
    difficulty: WonderDNADifficulty;
  
    ageRange: WonderDNAAgeRange;
  
    duration: number;
  }
  
  interface WonderWorldLocationMap {
    [worldId: string]: readonly string[];
  }
  
  const DEFAULT_ARCHETYPE_ID = "wonder";
  
  const DEFAULT_AGE_RANGE: WonderDNAAgeRange = {
    min: 4,
    max: 8,
  };
  
  const DEFAULT_DURATION = 5;
  
  const MIN_DURATION = 3;
  const MAX_DURATION = 30;
  
  const DEFAULT_EMOTIONS: readonly string[] = [
    "wonder",
    "curiosity",
    "joy",
    "kindness",
    "hope",
    "excitement",
    "calm",
    "confidence",
  ];
  
  const WORLD_LOCATIONS: WonderWorldLocationMap = {
    "coral-world": [
      "Treasure Cove",
      "Coral Reef City",
      "Pearl Lagoon",
      "Bubble Bay",
      "Rainbow Reef",
      "Shelllight Harbour",
      "Starfish Garden",
      "Whispering Kelp Forest",
    ],
  
    "forest-world": [
      "Whispering Woods",
      "Mossy Trail",
      "Acorn Village",
      "Sunbeam Clearing",
      "Fern Valley",
      "Moonlit Grove",
      "Old Oak Crossing",
      "Butterfly Meadow",
    ],
  
    "space-world": [
      "Moon Garden",
      "Starlight Station",
      "Comet Valley",
      "Rainbow Nebula",
      "Planet Wonder",
      "Meteor Meadow",
      "Cosmic Library",
      "Saturn Ring Trail",
    ],
  
    "dream-world": [
      "Dreamlight Village",
      "Rainbow Meadow",
      "Cloud Castle",
      "Imagination Lake",
      "Storybook Hill",
      "Star Pillow Valley",
      "Magic Paint Garden",
      "Moonbeam Bridge",
    ],
  
    "dinosaur-world": [
      "Dinosaur Valley",
      "Fossil Forest",
      "Volcano Meadow",
      "Footprint Trail",
      "Amber Cave",
      "Fern Lagoon",
      "Eggshell Canyon",
      "Gentle Giant Grove",
    ],
  
    "wonder-garden": [
      "Heartblossom Garden",
      "Sunflower Path",
      "Butterfly Corner",
      "Gratitude Grove",
      "Rainbow Greenhouse",
      "Tiny Seed Village",
      "Kindness Pond",
      "Moonflower Meadow",
    ],
  
    "sky-world": [
      "Cloud Kingdom",
      "Rainbow Bridge",
      "Sunbeam Station",
      "Windmill Island",
      "Starlight Peak",
      "Floating Garden",
      "Feather Cloud Valley",
      "Skyship Harbour",
    ],
  
    "jungle-world": [
      "Jungle River",
      "Hidden Waterfall",
      "Parrot Village",
      "Banana Leaf Trail",
      "Emerald Lagoon",
      "Monkey Bridge",
      "Ancient Tree Temple",
      "Firefly Clearing",
    ],
  };
  
  /**
   * Generates deterministic, offline WonderGenomes.
   *
   * The same:
   *
   * familyId + date + seedSalt
   *
   * always generates the same genome.
   */
  export class WonderDNAEngine {
    /**
     * Generates a complete WonderGenome.
     */
    generate(
      options: WonderDNAGenerationOptions
    ): WonderGenome {
      const preview = this.preview(options);
  
      return {
        id: createGenomeId(
          preview.familyId,
          preview.dateKey,
          preview.seed
        ),
  
        version: normalisePositiveInteger(
          options.version,
          1
        ),
  
        seed: preview.seed,
  
        createdAt: dateKeyToDate(
          preview.dateKey
        ),
  
        friend: cloneFriend(
          preview.friend
        ),
  
        world: cloneWorld(
          preview.world
        ),
  
        location: preview.location,
  
        value: cloneValue(
          preview.value
        ),
  
        template: cloneTemplate(
          preview.template
        ),
  
        emotion: preview.emotion,
  
        difficulty:
          preview.difficulty,
  
        ageRange: {
          ...preview.ageRange,
        },
  
        duration: preview.duration,
      };
    }
  
    /**
     * Recommended alias for daily adventures.
     */
    generateDailyGenome(
      options: WonderDNAGenerationOptions
    ): WonderGenome {
      return this.generate(options);
    }
  
    /**
     * Generates selection information without creating the genome.
     *
     * Useful for debugging and content previews.
     */
    preview(
      options: WonderDNAGenerationOptions
    ): WonderDNAPreview {
      const familyId =
        normaliseRequiredText(
          options.familyId,
          "familyId"
        );
  
      const dateKey =
        resolveDateKey(options.date);
  
      const archetypeId =
        normaliseOptionalText(
          options.archetypeId
        ) ?? DEFAULT_ARCHETYPE_ID;
  
      const archetype =
        getWonderArchetypeById(
          archetypeId
        );
  
      const ageRange =
        normaliseAgeRange(
          options.ageRange
        );
  
      const duration =
        normaliseDuration(
          options.duration
        );
  
      const seed = createDailySeed({
        familyId,
        dateKey,
        archetypeId:
          archetype.meta.id,
        seedSalt:
          options.seedSalt,
      });
  
      const friends =
        resolvePreferredEntities(
          getAllWonderFriends(),
          options.preferredFriendIds
        );
  
      const archetypeWorldIds =
        namesToEntityIds(
          getAllWonderWorlds(),
          archetype.content.stories
            .favouriteWorlds
        );
  
      const worlds =
        resolvePreferredEntities(
          getAllWonderWorlds(),
          mergePreferences(
            options.preferredWorldIds,
            archetypeWorldIds
          )
        );
  
      const archetypeValueIds =
        namesToEntityIds(
          getAllWonderValues(),
          [
            ...archetype.identity
              .primaryTraits,
  
            ...archetype.identity
              .secondaryTraits,
          ]
        );
  
      const values =
        resolvePreferredEntities(
          getAllWonderValues(),
          mergePreferences(
            options.preferredValueIds,
            archetypeValueIds
          )
        );
  
      const archetypeTemplateIds =
        namesToEntityIds(
          getAllWonderTemplates(),
          archetype.content.stories
            .favouriteTemplates
        );
  
      const templates =
        resolvePreferredEntities(
          getAllWonderTemplates(),
          mergePreferences(
            options.preferredTemplateIds,
            archetypeTemplateIds
          )
        );
  
      const friend =
        deterministicPick(
          friends,
          `${seed}:friend`
        ) ??
        getDefaultWonderFriend();
  
      const world =
        deterministicPick(
          worlds,
          `${seed}:world`
        ) ??
        getDefaultWonderWorld();
  
      const value =
        deterministicPick(
          values,
          `${seed}:value`
        ) ??
        getDefaultWonderValue();
  
      const template =
        deterministicPick(
          templates,
          `${seed}:template`
        ) ??
        getDefaultWonderTemplate();
  
      const location =
        normaliseOptionalText(
          options.location
        ) ??
        this.selectLocation(
          world.id,
          `${seed}:location`
        );
  
      const emotion =
        normaliseOptionalText(
          options.emotion
        ) ??
        this.selectEmotion(
          archetype.content.stories
            .preferredEmotions,
          `${seed}:emotion`
        );
  
      const difficulty =
        options.difficulty ??
        deriveDifficulty(ageRange);
  
      return {
        seed,
  
        dateKey,
  
        familyId,
  
        archetypeId:
          archetype.meta.id,
  
        friend:
          cloneFriend(friend),
  
        world:
          cloneWorld(world),
  
        location,
  
        value:
          cloneValue(value),
  
        template:
          cloneTemplate(template),
  
        emotion,
  
        difficulty,
  
        ageRange: {
          ...ageRange,
        },
  
        duration,
      };
    }
  
    /**
     * Generates multiple deterministic adventures for one day.
     *
     * Each genome receives a different seedSalt.
     */
    generateDailySet(
      options: WonderDNAGenerationOptions,
      count: number
    ): WonderGenome[] {
      const safeCount = clampInteger(
        count,
        1,
        20
      );
  
      return Array.from(
        {
          length: safeCount,
        },
        (_, index) =>
          this.generate({
            ...options,
  
            seedSalt: combineSeedSalt(
              options.seedSalt,
              `slot-${index + 1}`
            ),
          })
      );
    }
  
    /**
     * Generates the next day's genome.
     */
    generateNextDay(
      options: WonderDNAGenerationOptions
    ): WonderGenome {
      const date =
        resolveInputDate(
          options.date
        );
  
      date.setDate(
        date.getDate() + 1
      );
  
      return this.generate({
        ...options,
        date,
      });
    }
  
    /**
     * Checks whether two generation requests will create
     * the same deterministic seed.
     */
    isSameAdventure(
      first: WonderDNAGenerationOptions,
      second: WonderDNAGenerationOptions
    ): boolean {
      return (
        this.preview(first).seed ===
        this.preview(second).seed
      );
    }
  
    private selectLocation(
      worldId: string,
      seed: string
    ): string {
      const locations =
        WORLD_LOCATIONS[worldId];
  
      if (
        !locations ||
        locations.length === 0
      ) {
        return "Wonder Village";
      }
  
      return (
        deterministicPick(
          locations,
          seed
        ) ?? "Wonder Village"
      );
    }
  
    private selectEmotion(
      archetypeEmotions: readonly string[],
      seed: string
    ): string {
      const validArchetypeEmotions =
        archetypeEmotions
          .map(normaliseOptionalText)
          .filter(
            (
              emotion
            ): emotion is string =>
              emotion !== null
          );
  
      const emotions =
        validArchetypeEmotions.length >
        0
          ? validArchetypeEmotions
          : [...DEFAULT_EMOTIONS];
  
      return (
        deterministicPick(
          emotions,
          seed
        ) ?? "wonder"
      );
    }
  }
  
  // =========================================================
  // DETERMINISTIC SELECTION
  // =========================================================
  
  function deterministicPick<T>(
    items: readonly T[],
    seed: string
  ): T | null {
    if (items.length === 0) {
      return null;
    }
  
    const index =
      hashText(seed) %
      items.length;
  
    return items[index] ?? null;
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
      hash ^= text.charCodeAt(index);
  
      hash = Math.imul(
        hash,
        16777619
      );
    }
  
    return hash >>> 0;
  }
  
  // =========================================================
  // SEED AND ID
  // =========================================================
  
  function createDailySeed({
    familyId,
    dateKey,
    archetypeId,
    seedSalt,
  }: {
    familyId: string;
    dateKey: string;
    archetypeId: string;
    seedSalt?: string;
  }): string {
    const source = [
      "wonderlabs",
      createSlug(familyId),
      dateKey,
      createSlug(archetypeId),
      createSlug(
        seedSalt ?? "daily"
      ),
    ].join(":");
  
    const hash = hashText(source)
      .toString(36)
      .padStart(7, "0");
  
    return `${source}:${hash}`;
  }
  
  function createGenomeId(
    familyId: string,
    dateKey: string,
    seed: string
  ): string {
    const familySlug =
      createSlug(familyId) ||
      "family";
  
    const seedHash = hashText(seed)
      .toString(36)
      .padStart(7, "0");
  
    return [
      "wonder-genome",
      familySlug,
      dateKey,
      seedHash,
    ].join("-");
  }
  
  function combineSeedSalt(
    original: string | undefined,
    addition: string
  ): string {
    const originalValue =
      normaliseOptionalText(original);
  
    return originalValue
      ? `${originalValue}:${addition}`
      : addition;
  }
  
  // =========================================================
  // ENTITY PREFERENCES
  // =========================================================
  
  function resolvePreferredEntities<
    T extends {
      id: string;
    },
  >(
    allEntities: readonly T[],
    preferredIds:
      | readonly string[]
      | undefined
  ): T[] {
    if (
      !preferredIds ||
      preferredIds.length === 0
    ) {
      return [...allEntities];
    }
  
    const normalisedIds = new Set(
      preferredIds
        .map(normaliseOptionalText)
        .filter(
          (
            id
          ): id is string =>
            id !== null
        )
        .map(normaliseValue)
    );
  
    const matches =
      allEntities.filter((entity) =>
        normalisedIds.has(
          normaliseValue(entity.id)
        )
      );
  
    return matches.length > 0
      ? matches
      : [...allEntities];
  }
  
  function mergePreferences(
    explicit:
      | readonly string[]
      | undefined,
    archetype:
      | readonly string[]
      | undefined
  ): string[] | undefined {
    const combined = [
      ...(explicit ?? []),
      ...(archetype ?? []),
    ];
  
    if (combined.length === 0) {
      return undefined;
    }
  
    return Array.from(
      new Set(
        combined
          .map(normaliseOptionalText)
          .filter(
            (
              value
            ): value is string =>
              value !== null
          )
      )
    );
  }
  
  function namesToEntityIds<
    T extends {
      id: string;
      name: string;
    },
  >(
    entities: readonly T[],
    names: readonly string[]
  ): string[] {
    const normalisedNames =
      new Set(
        names.map(normaliseValue)
      );
  
    return entities
      .filter((entity) =>
        normalisedNames.has(
          normaliseValue(
            entity.name
          )
        )
      )
      .map((entity) => entity.id);
  }
  
  // =========================================================
  // DATE
  // =========================================================
  
  function resolveDateKey(
    value: Date | string | undefined
  ): string {
    const date =
      resolveInputDate(value);
  
    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }
  
  function resolveInputDate(
    value: Date | string | undefined
  ): Date {
    if (value instanceof Date) {
      if (
        !Number.isNaN(
          value.getTime()
        )
      ) {
        return new Date(
          value.getTime()
        );
      }
  
      return new Date();
    }
  
    if (
      typeof value === "string"
    ) {
      const match =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(
          value.trim()
        );
  
      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
  
        const date = new Date(
          year,
          month - 1,
          day
        );
  
        if (
          date.getFullYear() === year &&
          date.getMonth() ===
            month - 1 &&
          date.getDate() === day
        ) {
          return date;
        }
      }
  
      throw new Error(
        'WonderDNAEngine: date must use the "YYYY-MM-DD" format.'
      );
    }
  
    return new Date();
  }
  
  function dateKeyToDate(
    dateKey: string
  ): Date {
    const [
      year,
      month,
      day,
    ] = dateKey
      .split("-")
      .map(Number);
  
    return new Date(
      year,
      month - 1,
      day
    );
  }
  
  // =========================================================
  // NORMALISATION
  // =========================================================
  
  function normaliseAgeRange(
    value:
      | WonderDNAAgeRange
      | undefined
  ): WonderDNAAgeRange {
    if (!value) {
      return {
        ...DEFAULT_AGE_RANGE,
      };
    }
  
    const min = clampInteger(
      value.min,
      0,
      17
    );
  
    const max = clampInteger(
      value.max,
      min,
      17
    );
  
    return {
      min,
      max,
    };
  }
  
  function normaliseDuration(
    value: number | undefined
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return DEFAULT_DURATION;
    }
  
    return clampInteger(
      value,
      MIN_DURATION,
      MAX_DURATION
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
  
    return Math.max(
      1,
      Math.floor(value)
    );
  }
  
  function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    const cleaned =
      value.trim();
  
    if (cleaned.length === 0) {
      throw new Error(
        `WonderDNAEngine: "${fieldName}" is required.`
      );
    }
  
    return cleaned;
  }
  
  function normaliseOptionalText(
    value:
      | string
      | undefined
      | null
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
  
  function normaliseValue(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase();
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
  
  function deriveDifficulty(
    ageRange: WonderDNAAgeRange
  ): WonderDNADifficulty {
    const averageAge =
      (
        ageRange.min +
        ageRange.max
      ) / 2;
  
    if (averageAge <= 5) {
      return "easy";
    }
  
    if (averageAge <= 8) {
      return "medium";
    }
  
    return "hard";
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneFriend(
    friend: WonderFriend
  ): WonderFriend {
    return {
      ...friend,
    };
  }
  
  function cloneWorld(
    world: WonderWorld
  ): WonderWorld {
    return {
      ...world,
    };
  }
  
  function cloneValue(
    value: WonderValue
  ): WonderValue {
    return {
      ...value,
    };
  }
  
  function cloneTemplate(
    template: WonderTemplate
  ): WonderTemplate {
    return {
      ...template,
    };
  }
  
  export const wonderDNAEngine =
    new WonderDNAEngine();
  
  export default WonderDNAEngine;