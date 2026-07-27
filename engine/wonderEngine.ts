/**
 * Wonder Engine
 *
 * Responsible for selecting
 * today's WonderCard.
 *
 * Future versions may support:
 * - Personalisation
 * - Seasons
 * - Family preferences
 * - AI recommendations
 */
import { adventures } from "@/data/adventures";

export function getTodayAdventure() {
  return adventures[0];
}