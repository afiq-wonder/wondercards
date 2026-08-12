import type {
  GrowthEvent,
  WonderDNA,
  WonderTraitName,
} from "./types";
import { createId, nowISO } from "./utils";

export const XP_PER_COMPLETED_CYCLE = 10;
export const XP_PER_LEVEL = 100;

export function applyGrowth(input: {
  dna: WonderDNA;
  familyId: string;
  cycleId: string;
  trait: WonderTraitName;
  xpAwarded?: number;
}): {
  dna: WonderDNA;
  growthEvent: GrowthEvent;
} {
  const xpAwarded =
    input.xpAwarded ?? XP_PER_COMPLETED_CYCLE;
  const currentTrait = input.dna.traits[input.trait];
  const totalXP = currentTrait.xp + xpAwarded;
  const nextLevel = Math.max(
    currentTrait.level,
    Math.floor(totalXP / XP_PER_LEVEL) + 1,
  );
  const timestamp = nowISO();

  const dna: WonderDNA = {
    ...input.dna,
    updatedAt: timestamp,
    adventureCount: input.dna.adventureCount + 1,
    wonderMoments: input.dna.wonderMoments + 1,
    friendshipLevel:
      1 +
      Math.floor(
        (input.dna.adventureCount + 1) / 5,
      ),
    traits: {
      ...input.dna.traits,
      [input.trait]: {
        level: nextLevel,
        xp: totalXP,
      },
    },
  };

  const growthEvent: GrowthEvent = {
    id: createId("growth"),
    familyId: input.familyId,
    cycleId: input.cycleId,
    trait: input.trait,
    xpAwarded,
    previousLevel: currentTrait.level,
    currentLevel: nextLevel,
    createdAt: timestamp,
  };

  return {
    dna,
    growthEvent,
  };
}
