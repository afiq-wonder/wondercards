// ============================================
// WonderCards
// Journey Types
// Version: 1.0
// ============================================

export type JourneyScene =
  | "VILLAGE_ENTRANCE"
  | "WONDER_PATH"
  | "CORAL_HOME"
  | "WONDER_SHELF"
  | "STORY_REEF"
  | "WONDER_PAUSE"
  | "WONDER_MISSION"
  | "WONDER_MOMENT"
  | "RETURN_HOME"
  | "MEMORY_WALL"
  | "WONDER_TREE"
  | "JOURNEY_END";

export type JourneyEvent =
  | "BEGIN"
  | "FOLLOW_CORAL"
  | "ARRIVE_HOME"
  | "OPEN_SHELF"
  | "SELECT_ADVENTURE"
  | "FINISH_STORY"
  | "COMPLETE_PAUSE"
  | "START_MISSION"
  | "SAVE_MOMENT"
  | "ARRIVE_BACK_HOME"
  | "UPDATE_MEMORY"
  | "GROW_TREE"
  | "FINISH_JOURNEY";

export interface JourneyContext {
  selectedAdventureId?: string;

  reflection?: string;

  memoryId?: string;

  startedAt: Date;

  completedAt?: Date;
}

export interface JourneyState {
  scene: JourneyScene;

  context: JourneyContext;
}