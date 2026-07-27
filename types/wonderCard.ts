import type { WonderGenome } from "./wonderGenome";
import type { WonderMission } from "./wonderMission";
import type { WonderStory } from "./wonderStory";

export type WonderCardStatus =
  | "draft"
  | "ready"
  | "played"
  | "completed";

export interface WonderCard {

  id: string;

  version: number;

  createdAt: Date;

  status: WonderCardStatus;

  genome: WonderGenome;

  story: WonderStory;

  mission: WonderMission;

  world: string;

  friend: string;

  value: string;

  duration: number;

  wonderScore: number;

}