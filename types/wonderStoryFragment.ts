export type WonderStoryFragmentType =
  | "intro"
  | "problem"
  | "goal"
  | "closing";

export interface WonderStoryFragment {
  id: string;

  type: WonderStoryFragmentType;

  text: string;

  templateIds: string[];

  worldIds: string[];

  valueIds: string[];

  emotions: string[];

  ageRange: {
    min: number;
    max: number;
  };
}

export interface WonderStoryFragmentContext {
  friend: string;
  world: string;
  location: string;
  value: string;
}