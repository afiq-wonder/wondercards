import type { WonderCard } from "@/types/wondercard";

export const adventures: WonderCard[] = [
  {
    id: "coral-reef-001",
    emoji: "🐠",
    title: "Coral Reef Adventure",
    description:
      "Discover the colourful underwater city together, then continue the adventure in the real world.",
    storyPrompt:
      "Today, Coral needs your help. Tiny fish are hiding because the reef has become very quiet. Can you explore the ocean and find out why?",
    pauseQuestion:
      "If you found a tiny colourful fish today, what would you name it?",
    offlineMission:
      "Create your own coral reef using paper, crayons and scissors. Give every fish a name and tell a short story together.",
    reflectionPrompt:
      "What was your favourite moment from today's adventure?",
    duration: "5 min",
    category: "Family",
    activityType: "offline",
    ageRange: "4-8",
    difficulty: "easy",
    supplies: ["Paper", "Blue crayons", "Scissors"],
    memoryMoment: "Create a paper ocean together after the adventure.",
  },
];
