import type { WonderCard } from "@/types/wondercard";
import type { WonderSession } from "@/types/wonderSession";

function generateSessionId(
  card: WonderCard,
): string {
  const randomId =
    globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `session-${card.id}-${randomId}`;
  }

  return `session-${card.id}-${Date.now()}`;
}

export function createWonderSession(
  card: WonderCard,
): WonderSession {
  return {
    id: generateSessionId(card),
    card,
    currentStep: "story",
    startedAt: new Date(),
    completedAt: null,
    completed: false,
    wonderScore: 0,
  };
}