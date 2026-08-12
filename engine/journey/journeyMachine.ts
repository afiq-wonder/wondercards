import {
    JourneyScene,
    JourneyEvent,
    JourneyState,
  } from "@/types/journey";
  
  type TransitionMap = {
    [K in JourneyScene]?: Partial<Record<JourneyEvent, JourneyScene>>;
  };
  
  const transitions: TransitionMap = {
  
    VILLAGE_ENTRANCE: {
      BEGIN: "WONDER_PATH",
    },
  
    WONDER_PATH: {
      ARRIVE_HOME: "CORAL_HOME",
    },
  
    CORAL_HOME: {
      OPEN_SHELF: "WONDER_SHELF",
    },
  
    WONDER_SHELF: {
      SELECT_ADVENTURE: "STORY_REEF",
    },
  
    STORY_REEF: {
      FINISH_STORY: "WONDER_PAUSE",
    },
  
    WONDER_PAUSE: {
      COMPLETE_PAUSE: "WONDER_MISSION",
    },
  
    WONDER_MISSION: {
      START_MISSION: "WONDER_MOMENT",
    },
  
    WONDER_MOMENT: {
      SAVE_MOMENT: "RETURN_HOME",
    },
  
    RETURN_HOME: {
      ARRIVE_BACK_HOME: "MEMORY_WALL",
    },
  
    MEMORY_WALL: {
      UPDATE_MEMORY: "WONDER_TREE",
    },
  
    WONDER_TREE: {
      GROW_TREE: "JOURNEY_END",
    },
  
  };