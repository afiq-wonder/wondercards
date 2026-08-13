import type { WonderGenome } from "@/types/wonderGenome";
import type { WonderMission } from "@/types/wonderMission";
import type { WonderStory } from "@/types/wonderStory";

export type WonderCardStatus =
  | "ready"
  | "played"
  | "completed";

export interface WonderEngineCard {
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