import type { WonderFriend } from "./wonderFriend";
import type { WonderTemplate } from "./wonderTemplate";
import type { WonderValue } from "./wonderValue";
import type { WonderWorld } from "./wonderWorld";

export interface WonderGenome {

  id: string;

  version: number;

  seed: string;

  createdAt: Date;

  friend: WonderFriend;

  world: WonderWorld;

  location: string;

  value: WonderValue;

  template: WonderTemplate;

  emotion: string;

  difficulty: "easy" | "medium" | "hard";

  ageRange: {

    min: number;

    max: number;

  };

  duration: number;

}