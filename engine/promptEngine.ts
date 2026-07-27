import type { WonderGenome } from "@/types/wonderGenome";
import type { WonderPrompt } from "@/types/wonderPrompt";

import { buildStoryPrompt } from "../builders/promptBuilder";

export function generatePrompt(
  genome: WonderGenome
): WonderPrompt {
  return buildStoryPrompt(genome);
}