import type { WonderGenome } from "@/types/wonderGenome";
import type { WonderMission } from "@/types/wonderMission";

export function buildMission(
  genome: WonderGenome
): WonderMission {

  return {

    id: genome.id,

    title: "Today's Wonder Mission",

    objective:
      `Help ${genome.friend.name} investigate the mystery together.`,

    activity:
      "Look around your home and find three objects that remind you of the ocean. Share why you chose them.",

    successMessage:
      "Amazing! You completed today's Wonder Mission!",

  };

}