// engine/coral/CoralBehaviour.ts

import type { CoralBehaviourState } from "@/types/coral";
import type { CoralEvent } from "./CoralBrain";

type CoralEventType = CoralEvent["type"];

type BehaviourTransitions = Partial<
  Record<
    CoralBehaviourState,
    Partial<Record<CoralEventType, CoralBehaviourState>>
  >
>;

const transitions: BehaviourTransitions = {
  IDLE: {
    PLAYER_MOVING: "LEAD",
    PLAYER_STOPPED: "WAIT",
    PLAYER_TAPPED_CORAL: "CELEBRATE",
    SHELF_SELECTED: "APPROACH",
    STORY_STARTED: "LISTEN",
  },

  LEAD: {
    PLAYER_STOPPED: "LOOK_BACK",
    ARRIVED_HOME: "WAIT",
    PLAYER_TAPPED_CORAL: "CELEBRATE",
    SHELF_SELECTED: "APPROACH",
    STORY_STARTED: "LISTEN",
  },

  LOOK_BACK: {
    PLAYER_FOLLOWING: "LEAD",
    PLAYER_MOVING: "LEAD",
    PLAYER_TAPPED_CORAL: "CELEBRATE",

    // Tambah ini
    SHELF_SELECTED: "APPROACH",
    STORY_STARTED: "LISTEN",
  },

  WAIT: {
    PLAYER_MOVING: "LEAD",
    PLAYER_FOLLOWING: "LEAD",
    SHELF_SELECTED: "APPROACH",
    STORY_STARTED: "LISTEN",
  },

  APPROACH: {
    OBJECT_READY: "RETRIEVE",
    STORY_STARTED: "LISTEN",
  },

  RETRIEVE: {
    OBJECT_READY: "PRESENT",
    STORY_STARTED: "LISTEN",
  },

  PRESENT: {
    STORY_STARTED: "LISTEN",
  },

  LISTEN: {
    STORY_FINISHED: "IDLE",
    MISSION_STARTED: "IDLE",
    MISSION_COMPLETED: "CELEBRATE",
  },

  CELEBRATE: {
    PLAYER_MOVING: "LEAD",
    JOURNEY_COMPLETED: "IDLE",
    SHELF_SELECTED: "APPROACH",
    STORY_STARTED: "LISTEN",
  },

  SLEEP: {
    JOURNEY_STARTED: "IDLE",
  },
};

export function getNextBehaviour(
  current: CoralBehaviourState,
  event: CoralEventType,
): CoralBehaviourState {
  return transitions[current]?.[event] ?? current;
}

export function canTransition(
  current: CoralBehaviourState,
  event: CoralEventType,
): boolean {
  return transitions[current]?.[event] !== undefined;
}

export function getAvailableEvents(
  current: CoralBehaviourState,
): CoralEventType[] {
  return Object.keys(
    transitions[current] ?? {},
  ) as CoralEventType[];
}

export const INITIAL_BEHAVIOUR: CoralBehaviourState =
  "IDLE";