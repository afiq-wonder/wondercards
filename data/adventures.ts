import type { WonderCard } from "@/types/wonderCard";

export const adventures: WonderCard[] = [
  {
    id: "coral-reef-001",

    version: 1,

    createdAt: new Date("2026-07-27T00:00:00.000Z"),

    status: "ready",

    genome: {
      id: "genome-coral-reef-001",

      version: 1,

      seed: "coral-reef-adventure",

      createdAt: new Date("2026-07-27T00:00:00.000Z"),

      friend: {
        id: "coral",
        name: "Coral",
        emoji: "🐠",
      },

      world: {
        id: "coral-world",
        name: "Coral World",
      },

      location: "Coral Reef City",

      value: {
        id: "curiosity",
        name: "Curiosity",
      },

      template: {
        id: "tiny-mystery",
        name: "Tiny Mystery",
      },

      emotion: "Wonder",

      difficulty: "easy",

      ageRange: {
        min: 4,
        max: 8,
      },

      duration: 5,
    },

    story: {
      id: "story-coral-reef-001",

      title: "Coral Reef Adventure",

      intro:
        "Coral was swimming through the colourful underwater city when she noticed something unusual. The reef was much quieter than normal.",

      problem:
        "The tiny fish were hiding, and nobody knew why the coral gardens had become so still.",

      goal:
        "Help Coral explore the reef, notice the clues and discover what made the tiny fish hide.",

      closing:
        "Together, Coral and the Explorer discovered that the tiny fish were waiting for the reef lights to glow again. Soon the whole underwater city sparkled with colour, music and happy bubbles.",
    },

    mission: {
      id: "mission-coral-reef-001",

      title: "Create Your Own Coral Reef",

      objective:
        "Continue the adventure away from the screen by creating a colourful coral reef together.",

      activity:
        "Use paper, crayons and scissors to create your own coral reef. Draw or cut out several tiny fish, give each fish a name and tell a short story about where they live.",

      successMessage:
        "Wonderful work! Your family created a brand-new underwater world together.",
    },

    world: "Coral World",

    friend: "Coral",

    value: "Curiosity",

    duration: 5,

    wonderScore: 0,
  },
];