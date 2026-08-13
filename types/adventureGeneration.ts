import type { WonderEngineCard } from "@/types/wonderEngineCard";

export const WONDER_THEME_IDS = [
  "ocean",
  "forest",
  "space",
  "dinosaurs",
  "dreams",
  "garden",
  "sky",
  "jungle",
] as const;

export type WonderThemeId =
  (typeof WONDER_THEME_IDS)[number];

export interface WonderAdventureRequest {
  familyId: string;
  theme: WonderThemeId;
  ageMin: number;
  ageMax: number;
  duration: number;
}

export interface WonderAdventureResponse {
  requestId: string;
  generatedAt: string;
  card: WonderCardWire;
}

/** JSON-safe representation returned by the route handler. */
export type WonderCardWire = Omit<
  WonderEngineCard,
  "createdAt" | "genome"
> & {
  createdAt: string;
  genome: Omit<
    WonderEngineCard["genome"],
    "createdAt"
  > & {
    createdAt: string;
  };
};

export interface WonderAdventureAPIError {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export interface WonderAdventureAPIEnvelope<T> {
  success: boolean;
  data?: T;
  error?: WonderAdventureAPIError;
}