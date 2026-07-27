import type { WonderStory } from "./wonderStory";
import type { WonderMission } from "./wonderMission";
import type { WonderMoment } from "./wonderMoment";

export interface WonderCelebration {
  title: string;
  message: string;
}

export interface WonderResponse {
  story: WonderStory;
  mission: WonderMission;
  moment: WonderMoment;
  celebration: WonderCelebration;
}