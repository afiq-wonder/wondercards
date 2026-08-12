import type {
  WonderGenome,
  WonderTraitName,
} from "./types";
import {
  createId,
  selectDeterministically,
} from "./utils";

const friends = ["Coral", "Lumi", "Miko", "Pip"] as const;
const worlds = ["Ocean", "Forest", "Sky", "Garden"] as const;
const locations = [
  "Coral Reef",
  "Moonlit Cove",
  "Cloud Bridge",
  "Secret Meadow",
] as const;
const emotions = [
  "curious",
  "hopeful",
  "calm",
  "excited",
] as const;
const difficulties = ["easy", "medium", "hard"] as const;
const durations = [5, 7, 10] as const;

const values: WonderTraitName[] = [
  "curiosity",
  "creativity",
  "kindness",
  "bravery",
  "exploration",
  "imagination",
  "gratitude",
  "resilience",
];

export function generateWonderGenome(input: {
  familyId: string;
  date: string;
  seed?: string;
}): WonderGenome {
  const baseSeed =
    input.seed ?? `${input.familyId}:${input.date}`;

  return {
    id: createId("genome"),
    familyId: input.familyId,
    date: input.date,
    friend: selectDeterministically(
      friends,
      `${baseSeed}:friend`,
    ),
    world: selectDeterministically(
      worlds,
      `${baseSeed}:world`,
    ),
    location: selectDeterministically(
      locations,
      `${baseSeed}:location`,
    ),
    value: selectDeterministically(
      values,
      `${baseSeed}:value`,
    ),
    emotion: selectDeterministically(
      emotions,
      `${baseSeed}:emotion`,
    ),
    difficulty: selectDeterministically(
      difficulties,
      `${baseSeed}:difficulty`,
    ),
    durationMinutes: selectDeterministically(
      durations,
      `${baseSeed}:duration`,
    ),
    seed: baseSeed,
  };
}
