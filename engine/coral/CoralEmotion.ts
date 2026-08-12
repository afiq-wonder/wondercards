// ============================================
// WonderCards
// Coral Emotion Engine
// Version: 1.0
// ============================================

import type { CoralEmotionState } from "@/types/coral";
import type { CoralEvent } from "./CoralBrain";

type CoralEventType = CoralEvent["type"];

const emotionTransitions: Partial<
  Record<CoralEventType, CoralEmotionState>
> = {

  JOURNEY_STARTED: "CALM",

  PLAYER_TAPPED_CORAL: "HAPPY",

  PLAYER_MOVING: "CALM",

  PLAYER_STOPPED: "CURIOUS",

  SHELF_SELECTED: "CURIOUS",

  STORY_STARTED: "CURIOUS",

  STORY_FINISHED: "THINKING",

  MISSION_STARTED: "CURIOUS",

  MISSION_COMPLETED: "PROUD",

  MOMENT_SAVED: "WONDER",

  MEMORY_WALL_UPDATED: "PROUD",

  WONDER_TREE_REACHED: "WONDER",

  JOURNEY_COMPLETED: "HAPPY",
};

export function getNextEmotion(
  current: CoralEmotionState,
  event: CoralEventType,
): CoralEmotionState {
  return emotionTransitions[event] ?? current;
}

export function isPositiveEmotion(
  emotion: CoralEmotionState,
): boolean {
  return ["HAPPY", "PROUD", "WONDER"].includes(emotion);
}

export const INITIAL_EMOTION: CoralEmotionState = "CALM";