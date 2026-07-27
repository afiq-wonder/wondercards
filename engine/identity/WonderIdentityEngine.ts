import {
    getDefaultWonderArchetype,
    getWonderArchetypeByTraits,
  } from "@/data/wonderArchetypes";
  import type { WonderArchetype } from "@/types/WonderArchetype";
  import type { WonderDNA } from "@/types/wonderDNA";
  
  /**
   * The eight permanent WonderLabs growth traits.
   *
   * Display names intentionally match the trait names stored inside
   * WonderArchetype.identity.primaryTraits and secondaryTraits.
   */
  export type WonderTraitName =
    | "Curiosity"
    | "Creativity"
    | "Kindness"
    | "Bravery"
    | "Exploration"
    | "Imagination"
    | "Gratitude"
    | "Resilience";
  
  /**
   * Supported property keys inside WonderDNA.
   */
  export type WonderTraitKey =
    | "curiosity"
    | "creativity"
    | "kindness"
    | "bravery"
    | "exploration"
    | "imagination"
    | "gratitude"
    | "resilience";
  
  /**
   * Normalised score for one WonderDNA trait.
   */
  export interface WonderTraitScore {
    key: WonderTraitKey;
    name: WonderTraitName;
    score: number;
    rank: number;
  }
  
  /**
   * Complete identity result produced by WonderIdentityEngine.
   *
   * Legacy fields are preserved so existing screens and engines can
   * continue using personality, title, description and coralGreeting.
   *
   * New systems should prefer the archetype property because it contains
   * the complete world blueprint.
   */
  export interface WonderIdentity {
    /**
     * Full archetype blueprint selected from WonderDNA.
     */
    archetype: WonderArchetype;
  
    /**
     * Unique archetype identifier.
     */
    archetypeId: string;
  
    /**
     * Public archetype family name.
     *
     * Preserved for compatibility with existing consumers.
     */
    personality: string;
  
    /**
     * Highest-scoring WonderDNA trait.
     */
    primaryStrength: WonderTraitName;
  
    /**
     * Second-highest WonderDNA trait.
     */
    secondaryStrength: WonderTraitName;
  
    /**
     * Alias for the strongest trait.
     *
     * Preserved for compatibility with existing consumers.
     */
    favouriteTrait: WonderTraitName;
  
    /**
     * Public archetype title.
     */
    title: string;
  
    /**
     * Public archetype description.
     */
    description: string;
  
    /**
     * Deterministically selected Coral greeting.
     */
    coralGreeting: string;
  
    /**
     * Numeric score of the strongest trait.
     */
    primaryScore: number;
  
    /**
     * Numeric score of the second-strongest trait.
     */
    secondaryScore: number;
  
    /**
     * Total score across all WonderDNA traits.
     */
    totalScore: number;
  
    /**
     * Fully ranked WonderDNA profile.
     */
    rankedTraits: WonderTraitScore[];
  }
  
  /**
   * Internal definition used to connect WonderDNA property keys with
   * public-facing trait names.
   *
   * The array order is also the deterministic tie-break order.
   */
  const TRAIT_DEFINITIONS: ReadonlyArray<{
    key: WonderTraitKey;
    name: WonderTraitName;
  }> = [
    {
      key: "curiosity",
      name: "Curiosity",
    },
    {
      key: "creativity",
      name: "Creativity",
    },
    {
      key: "kindness",
      name: "Kindness",
    },
    {
      key: "bravery",
      name: "Bravery",
    },
    {
      key: "exploration",
      name: "Exploration",
    },
    {
      key: "imagination",
      name: "Imagination",
    },
    {
      key: "gratitude",
      name: "Gratitude",
    },
    {
      key: "resilience",
      name: "Resilience",
    },
  ];
  
  /**
   * Resolves a complete Wonder Identity from WonderDNA.
   *
   * Resolution flow:
   *
   * WonderDNA
   *   -> ranked traits
   *   -> two strongest traits
   *   -> WonderArchetype
   *   -> complete WonderIdentity
   */
  export function resolveWonderIdentity(dna: WonderDNA): WonderIdentity {
    const rankedTraits = rankWonderTraits(dna);
  
    const primaryTrait = rankedTraits[0];
    const secondaryTrait = rankedTraits[1];
  
    const totalScore = rankedTraits.reduce(
      (total, trait) => total + trait.score,
      0
    );
  
    const archetype =
      totalScore > 0
        ? getWonderArchetypeByTraits(
            primaryTrait.name,
            secondaryTrait.name
          )
        : getDefaultWonderArchetype();
  
    return {
      archetype,
      archetypeId: archetype.meta.id,
      personality: archetype.meta.name,
      primaryStrength: primaryTrait.name,
      secondaryStrength: secondaryTrait.name,
      favouriteTrait: primaryTrait.name,
      title: archetype.meta.title,
      description: archetype.meta.description,
      coralGreeting: selectCoralGreeting(
        archetype,
        rankedTraits
      ),
      primaryScore: primaryTrait.score,
      secondaryScore: secondaryTrait.score,
      totalScore,
      rankedTraits,
    };
  }
  
  /**
   * Ranks every WonderDNA trait from strongest to weakest.
   *
   * Ranking is deterministic:
   *
   * 1. Higher score wins.
   * 2. Equal scores use TRAIT_DEFINITIONS order.
   */
  export function rankWonderTraits(
    dna: WonderDNA
  ): WonderTraitScore[] {
    const traits = TRAIT_DEFINITIONS.map(
      (definition, originalIndex) => ({
        key: definition.key,
        name: definition.name,
        score: readWonderDNAScore(dna, definition.key),
        originalIndex,
      })
    );
  
    traits.sort((first, second) => {
      const scoreDifference = second.score - first.score;
  
      if (scoreDifference !== 0) {
        return scoreDifference;
      }
  
      return first.originalIndex - second.originalIndex;
    });
  
    return traits.map((trait, index) => ({
      key: trait.key,
      name: trait.name,
      score: trait.score,
      rank: index + 1,
    }));
  }
  
  /**
   * Returns the strongest WonderDNA trait.
   */
  export function getPrimaryWonderTrait(
    dna: WonderDNA
  ): WonderTraitScore {
    return rankWonderTraits(dna)[0];
  }
  
  /**
   * Returns the two strongest WonderDNA traits.
   */
  export function getTopWonderTraits(
    dna: WonderDNA
  ): [WonderTraitScore, WonderTraitScore] {
    const rankedTraits = rankWonderTraits(dna);
  
    return [rankedTraits[0], rankedTraits[1]];
  }
  
  /**
   * Returns the matching world blueprint directly.
   *
   * Useful for engines that need the archetype but do not need the
   * complete identity result.
   */
  export function resolveWonderArchetype(
    dna: WonderDNA
  ): WonderArchetype {
    return resolveWonderIdentity(dna).archetype;
  }
  
  /**
   * Checks whether a supplied value is a supported Wonder trait name.
   */
  export function isWonderTraitName(
    value: string
  ): value is WonderTraitName {
    const normalisedValue = normaliseText(value);
  
    return TRAIT_DEFINITIONS.some(
      (trait) => normaliseText(trait.name) === normalisedValue
    );
  }
  
  /**
   * Main WonderLabs identity engine.
   *
   * `generate` is the recommended public method.
   *
   * `resolve`, `identify` and `generateIdentity` are maintained as
   * compatible aliases so existing consumers can migrate gradually.
   */
  export class WonderIdentityEngine {
    static generate(dna: WonderDNA): WonderIdentity {
      return resolveWonderIdentity(dna);
    }
  
    static resolve(dna: WonderDNA): WonderIdentity {
      return resolveWonderIdentity(dna);
    }
  
    static identify(dna: WonderDNA): WonderIdentity {
      return resolveWonderIdentity(dna);
    }
  
    static generateIdentity(dna: WonderDNA): WonderIdentity {
      return resolveWonderIdentity(dna);
    }
  
    static getArchetype(dna: WonderDNA): WonderArchetype {
      return resolveWonderArchetype(dna);
    }
  
    static rankTraits(dna: WonderDNA): WonderTraitScore[] {
      return rankWonderTraits(dna);
    }
  
    static getPrimaryTrait(
      dna: WonderDNA
    ): WonderTraitScore {
      return getPrimaryWonderTrait(dna);
    }
  
    static getTopTraits(
      dna: WonderDNA
    ): [WonderTraitScore, WonderTraitScore] {
      return getTopWonderTraits(dna);
    }
  }
  
  /**
   * Reads one trait score safely.
   *
   * Supported DNA structures:
   *
   * {
   *   curiosity: 10
   * }
   *
   * {
   *   traits: {
   *     curiosity: 10
   *   }
   * }
   *
   * {
   *   scores: {
   *     curiosity: 10
   *   }
   * }
   */
  function readWonderDNAScore(
    dna: WonderDNA,
    key: WonderTraitKey
  ): number {
    const dnaRecord = asUnknownRecord(dna);
  
    const directValue = dnaRecord[key];
  
    if (directValue !== undefined) {
      return normaliseScore(directValue);
    }
  
    const capitalisedKey =
      `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  
    const capitalisedValue = dnaRecord[capitalisedKey];
  
    if (capitalisedValue !== undefined) {
      return normaliseScore(capitalisedValue);
    }
  
    const traits = asUnknownRecord(dnaRecord.traits);
    const traitValue = traits[key];
  
    if (traitValue !== undefined) {
      return normaliseScore(traitValue);
    }
  
    const scores = asUnknownRecord(dnaRecord.scores);
    const scoreValue = scores[key];
  
    if (scoreValue !== undefined) {
      return normaliseScore(scoreValue);
    }
  
    return 0;
  }
  
  /**
   * Converts unknown score values into safe, non-negative numbers.
   */
  function normaliseScore(value: unknown): number {
    if (typeof value === "number") {
      return Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
    }
  
    if (typeof value === "string") {
      const parsedValue = Number(value);
  
      return Number.isFinite(parsedValue)
        ? Math.max(0, parsedValue)
        : 0;
    }
  
    return 0;
  }
  
  /**
   * Selects a Coral greeting without using Math.random().
   *
   * A deterministic greeting prevents hydration differences between
   * server and client rendering while still allowing different DNA
   * profiles to receive different greetings.
   */
  function selectCoralGreeting(
    archetype: WonderArchetype,
    rankedTraits: WonderTraitScore[]
  ): string {
    const greetings = archetype.coral.greetings;
  
    if (greetings.length === 0) {
      return `Welcome to ${archetype.meta.name}.`;
    }
  
    const greetingSeed = rankedTraits.reduce(
      (seed, trait, index) =>
        seed + Math.round(trait.score * (index + 1)),
      0
    );
  
    const greetingIndex =
      Math.abs(greetingSeed) % greetings.length;
  
    return greetings[greetingIndex];
  }
  
  /**
   * Safely converts unknown values into string-keyed objects.
   */
  function asUnknownRecord(
    value: unknown
  ): Record<string, unknown> {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      return value as Record<string, unknown>;
    }
  
    return {};
  }
  
  /**
   * Normalises text for safe comparisons.
   */
  function normaliseText(value: string): string {
    return value.trim().toLowerCase();
  }
  
  export default WonderIdentityEngine;