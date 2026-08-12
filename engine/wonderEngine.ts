import { adventures } from "@/data/adventures";
import type { WonderCard } from "@/types/wondercard";

export function getTodayAdventure(): WonderCard {
  const adventure = adventures[0];

  if (!adventure) {
    throw new Error("No WonderCard adventure is available.");
  }

  return adventure;
}
