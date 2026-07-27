import type { WonderGenome } from "@/types/wonderGenome";
import type { WonderMission } from "@/types/wonderMission";

import { buildMission } from "@/builders/missionBuilder";

export function generateMission(
  genome: WonderGenome
): WonderMission {

  return buildMission(genome);

}