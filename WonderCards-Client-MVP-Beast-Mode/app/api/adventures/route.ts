import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  wonderCardBuilder,
  wonderDNAEngine,
} from "@/engine";

import {
  WONDER_THEME_IDS,
  type WonderAdventureAPIEnvelope,
  type WonderAdventureRequest,
  type WonderAdventureResponse,
  type WonderCardWire,
  type WonderThemeId,
} from "@/types/adventureGeneration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THEME_WORLD_MAP: Record<WonderThemeId, string> = {
  ocean: "coral-world",
  forest: "forest-world",
  space: "space-world",
  dinosaurs: "dinosaur-world",
  dreams: "dream-world",
  garden: "wonder-garden",
  sky: "sky-world",
  jungle: "jungle-world",
};

const MINIMUM_AGE = 3;
const MAXIMUM_AGE = 12;
const MINIMUM_DURATION = 3;
const MAXIMUM_DURATION = 20;

export async function POST(
  request: Request
): Promise<NextResponse<WonderAdventureAPIEnvelope<WonderAdventureResponse>>> {
  const requestId = `wonder-request-${randomUUID()}`;

  try {
    const body = await readJsonBody(request);
    const input = validateRequest(body);
    const generatedAt = new Date();

    const genome = wonderDNAEngine.generateDailyGenome({
      familyId: input.familyId,
      date: generatedAt,
      archetypeId: "wonder",
      ageRange: {
        min: input.ageMin,
        max: input.ageMax,
      },
      duration: input.duration,
      preferredWorldIds: [THEME_WORLD_MAP[input.theme]],
      seedSalt: `${input.theme}:${requestId}`,
    });

    const card = wonderCardBuilder.build(genome, {
      version: genome.version,
      status: "ready",
      wonderScore: 0,
      createdAt: generatedAt,
    });

    const response: WonderAdventureResponse = {
      requestId,
      generatedAt: generatedAt.toISOString(),
      card: serialiseCard(card),
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      {
        status: 201,
        headers: {
          "cache-control": "no-store",
          "x-wonder-request-id": requestId,
        },
      }
    );
  } catch (error) {
    const normalised = normaliseError(error, requestId);

    return NextResponse.json(
      {
        success: false,
        error: normalised,
      },
      {
        status: normalised.code === "INVALID_REQUEST" ? 400 : 500,
        headers: {
          "cache-control": "no-store",
          "x-wonder-request-id": requestId,
        },
      }
    );
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      "Content-Type must be application/json."
    );
  }

  try {
    return await request.json();
  } catch {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      "Request body must contain valid JSON."
    );
  }
}

function validateRequest(value: unknown): WonderAdventureRequest {
  const body = requireRecord(value);
  const familyId = requireText(body.familyId, "familyId", 80);
  const theme = requireTheme(body.theme);
  const ageMin = requireInteger(body.ageMin, "ageMin", MINIMUM_AGE, MAXIMUM_AGE);
  const ageMax = requireInteger(body.ageMax, "ageMax", MINIMUM_AGE, MAXIMUM_AGE);
  const duration = requireInteger(
    body.duration,
    "duration",
    MINIMUM_DURATION,
    MAXIMUM_DURATION
  );

  if (ageMin > ageMax) {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      "ageMin cannot be greater than ageMax."
    );
  }

  return {
    familyId,
    theme,
    ageMin,
    ageMax,
    duration,
  };
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      "Request body must be a JSON object."
    );
  }

  return value as Record<string, unknown>;
}

function requireText(value: unknown, field: string, maximumLength: number): string {
  if (typeof value !== "string") {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      `${field} must be a string.`
    );
  }

  const clean = value.trim();

  if (!clean || clean.length > maximumLength) {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      `${field} must contain between 1 and ${maximumLength} characters.`
    );
  }

  return clean;
}

function requireInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number
): number {
  if (!Number.isInteger(value) || typeof value !== "number") {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      `${field} must be an integer.`
    );
  }

  if (value < minimum || value > maximum) {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      `${field} must be between ${minimum} and ${maximum}.`
    );
  }

  return value;
}

function requireTheme(value: unknown): WonderThemeId {
  if (
    typeof value !== "string" ||
    !WONDER_THEME_IDS.includes(value as WonderThemeId)
  ) {
    throw new WonderAdventureRouteError(
      "INVALID_REQUEST",
      `theme must be one of: ${WONDER_THEME_IDS.join(", ")}.`
    );
  }

  return value as WonderThemeId;
}

function serialiseCard(card: ReturnType<typeof wonderCardBuilder.build>): WonderCardWire {
  return {
    ...card,
    createdAt: card.createdAt.toISOString(),
    genome: {
      ...card.genome,
      createdAt: card.genome.createdAt.toISOString(),
    },
  };
}

class WonderAdventureRouteError extends Error {
  public constructor(
    public readonly code: "INVALID_REQUEST" | "GENERATION_FAILED",
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "WonderAdventureRouteError";
  }
}

function normaliseError(error: unknown, requestId: string) {
  if (error instanceof WonderAdventureRouteError) {
    return {
      code: error.code,
      message: error.message,
      requestId,
      details: error.details,
    };
  }

  console.error("[WonderCards] Adventure generation failed.", {
    requestId,
    error,
  });

  return {
    code: "GENERATION_FAILED",
    message: "WonderCards could not create this adventure. Please try again.",
    requestId,
  };
}
