import type { WonderDNA } from "@/types/wonderDNA";
import type { GrowthTrait } from "@/types/GrowthTrait";

function createTrait(

  id: string,

  name: string

): GrowthTrait {

  return {

    id,

    name,

    level: 1,

    xp: 0,

    nextLevelXp: 100,

    totalXp: 0,

    lastGrowth: null,

    memories: [],

    milestones: []

  };

}

export function createWonderDNA(

  familyId: string

): WonderDNA {

  const now = new Date().toISOString();

  return {

    version: 1,

    familyId,

    createdAt: now,

    updatedAt: now,

    adventureCount: 0,

    wonderMoments: 0,

    friendshipLevel: 1,

    currentStreak: 0,

    longestStreak: 0,

    curiosity: createTrait(

      "curiosity",

      "Curiosity"

    ),

    creativity: createTrait(

      "creativity",

      "Creativity"

    ),

    kindness: createTrait(

      "kindness",

      "Kindness"

    ),

    bravery: createTrait(

      "bravery",

      "Bravery"

    ),

    exploration: createTrait(

      "exploration",

      "Exploration"

    ),

    imagination: createTrait(

      "imagination",

      "Imagination"

    ),

    gratitude: createTrait(

      "gratitude",

      "Gratitude"

    ),

    resilience: createTrait(

      "resilience",

      "Resilience"

    )

  };

}