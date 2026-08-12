export type CoralBehaviourState =
  | "IDLE"
  | "LEAD"
  | "FOLLOW"
  | "WAIT"
  | "LOOK_BACK"
  | "APPROACH"
  | "RETRIEVE"
  | "PRESENT"
  | "LISTEN"
  | "CELEBRATE"
  | "SLEEP";

export type CoralEmotionState =
  | "CALM"
  | "CURIOUS"
  | "HAPPY"
  | "WONDER"
  | "PROUD"
  | "COMFORT"
  | "THINKING";

export type CoralAttentionTarget =
  | "PLAYER"
  | "PATH"
  | "SHELF"
  | "TREE"
  | "BOOK"
  | "MEMORY_WALL"
  | "NONE";

export interface CoralState {
  behaviour: CoralBehaviourState;
  emotion: CoralEmotionState;
  attention: CoralAttentionTarget;
}