export type WonderTraitName =
  | "curiosity"
  | "creativity"
  | "kindness"
  | "bravery"
  | "exploration"
  | "imagination"
  | "gratitude"
  | "resilience";

export interface GrowthTrait {
  level: number;
  xp: number;
}

export type WonderTraits = Record<WonderTraitName, GrowthTrait>;

export interface WonderDNA {
  version: 1;
  familyId: string;
  createdAt: string;
  updatedAt: string;
  adventureCount: number;
  wonderMoments: number;
  friendshipLevel: number;
  traits: WonderTraits;
}

export interface WonderGenome {
  id: string;
  familyId: string;
  date: string;
  friend: string;
  world: string;
  location: string;
  value: WonderTraitName;
  emotion: string;
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  seed: string;
}

export interface WonderMoment {
  id: string;
  familyId: string;
  cycleId: string;
  adventureId: string;
  reflection: string;
  createdAt: string;
}

export interface WonderCycle {
  id: string;
  familyId: string;
  adventureId: string;
  genome: WonderGenome;
  status: "started" | "completed";
  startedAt: string;
  completedAt?: string;
}

export interface GrowthEvent {
  id: string;
  familyId: string;
  cycleId: string;
  trait: WonderTraitName;
  xpAwarded: number;
  previousLevel: number;
  currentLevel: number;
  createdAt: string;
}

export interface CompleteCycleResult {
  cycle: WonderCycle;
  moment: WonderMoment;
  dna: WonderDNA;
  growthEvent: GrowthEvent;
}
