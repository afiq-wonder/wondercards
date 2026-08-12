// ============================================
// WonderCards
// Coral Attention Engine
// ============================================

import type { CoralAttentionTarget } from "@/types/coral";
import type { CoralEvent } from "./CoralBrain";

type CoralEventType = CoralEvent["type"];

export function getNextAttention(

  current: CoralAttentionTarget,

  event: CoralEvent,

): CoralAttentionTarget {

  switch (event.type) {

    case "PLAYER_MOVING":
    case "PLAYER_STOPPED":
    case "PLAYER_TAPPED_CORAL":
    case "PLAYER_FOLLOWING":
      return "PLAYER";

    case "SHELF_SELECTED":
    case "OBJECT_READY":
      return "SHELF";

    case "STORY_STARTED":
    case "STORY_FINISHED":
      return "BOOK";

    case "MEMORY_WALL_UPDATED":
    case "MOMENT_SAVED":
      return "MEMORY_WALL";

    case "WONDER_TREE_REACHED":
      return "TREE";

    case "SET_ATTENTION":
      return event.target;

    case "RESET":
      return "PLAYER";

    default:
      return current;
  }
}

export const INITIAL_ATTENTION: CoralAttentionTarget = "PLAYER";