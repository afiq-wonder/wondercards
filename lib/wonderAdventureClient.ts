import type { WonderCard } from "@/types/wondercard";

import type {
  WonderAdventureAPIEnvelope,
  WonderAdventureRequest,
  WonderAdventureResponse,
  WonderCardWire,
} from "@/types/adventureGeneration";

export class WonderAdventureClientError extends Error {
  public constructor(
    message: string,
    public readonly code = "WONDER_ADVENTURE_CLIENT_ERROR",
    public readonly requestId?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "WonderAdventureClientError";
  }
}

export async function createWonderAdventure(
  input: WonderAdventureRequest,
  options: {
    signal?: AbortSignal;
  } = {}
): Promise<{ card: WonderCard; requestId: string }> {
  let response: Response;

  try {
    response = await fetch("/api/adventures", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new WonderAdventureClientError(
      "WonderCards could not reach the adventure service.",
      "NETWORK_ERROR",
      undefined,
      error
    );
  }

  const envelope = await readEnvelope(response);

  if (!response.ok || !envelope.success || !envelope.data) {
    throw new WonderAdventureClientError(
      envelope.error?.message ?? "Adventure generation failed.",
      envelope.error?.code ?? "GENERATION_FAILED",
      envelope.error?.requestId,
      envelope.error?.details
    );
  }

  return {
    card: hydrateCard(envelope.data.card),
    requestId: envelope.data.requestId,
  };
}

async function readEnvelope(
  response: Response
): Promise<WonderAdventureAPIEnvelope<WonderAdventureResponse>> {
  try {
    return (await response.json()) as WonderAdventureAPIEnvelope<WonderAdventureResponse>;
  } catch (error) {
    throw new WonderAdventureClientError(
      "The adventure service returned an invalid response.",
      "INVALID_RESPONSE",
      response.headers.get("x-wonder-request-id") ?? undefined,
      error
    );
  }
}

function hydrateCard(card: WonderCardWire): WonderCard {
  return {
    ...card,
    createdAt: new Date(card.createdAt),
    genome: {
      ...card.genome,
      createdAt: new Date(card.genome.createdAt),
    },
  };
}
