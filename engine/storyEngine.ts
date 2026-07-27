import type { WonderGenome } from "@/types/wonderGenome";
import type { WonderStory } from "@/types/wonderStory";

import { buildTinyMystery } from "@/builders/storyBuilder";

export function generateStory(
  genome: WonderGenome
): WonderStory {

  switch (genome.template.name) {

    case "Tiny Mystery":

      return buildTinyMystery(genome);

    default:

      throw new Error(
        `Unknown Story Template: ${genome.template.name}`
      );

  }

}