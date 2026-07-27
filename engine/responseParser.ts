import type { WonderResponse } from "@/types/wonderResponse";

export function parseResponse(
  raw: string
): WonderResponse {

  return JSON.parse(raw) as WonderResponse;

}