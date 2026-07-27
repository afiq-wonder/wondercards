import { wonderCardBuilder } from "@/engine";

import type { WonderGenome } from "@/types/wonderGenome";

const genome: WonderGenome = {
  id: "sandbox-coral-001",
  version: 1,
  seed: "sandbox-coral-alpha",
  createdAt: new Date(),

  friend: {
    id: "coral",
    name: "Coral",
    emoji: "🐠",
  },

  world: {
    id: "coral-world",
    name: "Coral World",
  },

  location: "Treasure Cove",

  value: {
    id: "curiosity",
    name: "Curiosity",
  },

  template: {
    id: "tiny-mystery",
    name: "Tiny Mystery",
  },

  emotion: "wonder",

  difficulty: "easy",

  ageRange: {
    min: 4,
    max: 6,
  },

  duration: 5,
};

export const testCard =
  wonderCardBuilder.build(genome, {
    version: 1,
    status: "ready",
    wonderScore: 0,
    createdAt: genome.createdAt,
  });