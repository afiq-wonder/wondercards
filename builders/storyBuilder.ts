import type { WonderGenome } from "@/types/wonderGenome";
import type { WonderStory } from "@/types/wonderStory";

export function buildTinyMystery(
  genome: WonderGenome
): WonderStory {

  return {

    id: genome.id,

    title: "A Tiny Mystery",

    intro:
      `${genome.friend.name} was happily exploring ${genome.location}.`,

    problem:
      "Something strange suddenly appeared beneath the colourful reef.",

    goal:
      `Can you help ${genome.friend.name} discover what happened?`,

    closing:
      "Let's begin today's Wonder Adventure!",

  };

}