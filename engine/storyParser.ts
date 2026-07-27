import type { WonderStory } from "@/types/wonderStory";

export function parseStory(
  raw: string
): WonderStory {

  return JSON.parse(raw);

}