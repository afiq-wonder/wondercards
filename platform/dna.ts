import type {
  WonderDNA,
  WonderTraitName,
  WonderTraits,
} from "./types";
import { nowISO } from "./utils";

export const WONDER_TRAITS: WonderTraitName[] = [
  "curiosity",
  "creativity",
  "kindness",
  "bravery",
  "exploration",
  "imagination",
  "gratitude",
  "resilience",
];

function createInitialTraits(): WonderTraits {
  return Object.fromEntries(
    WONDER_TRAITS.map((trait) => [
      trait,
      {
        level: 1,
        xp: 0,
      },
    ]),
  ) as WonderTraits;
}

export function createWonderDNA(familyId: string): WonderDNA {
  const timestamp = nowISO();

  return {
    version: 1,
    familyId,
    createdAt: timestamp,
    updatedAt: timestamp,
    adventureCount: 0,
    wonderMoments: 0,
    friendshipLevel: 1,
    traits: createInitialTraits(),
  };
}
