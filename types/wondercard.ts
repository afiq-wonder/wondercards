export interface WonderCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  storyPrompt: string;
  pauseQuestion: string;
  offlineMission: string;
  reflectionPrompt?: string;
  duration: string;
  category: string;
  activityType: "offline" | "digital" | "hybrid";
  ageRange: string;
  difficulty: "easy" | "medium" | "hard";
  supplies: string[];
  memoryMoment: string;
}
