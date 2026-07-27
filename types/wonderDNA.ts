import type { GrowthTrait } from "./GrowthTrait";

export interface WonderDNA {

  /**
   * DNA Version
   *
   * Allows future migrations.
   */
  version: number;

  /**
   * Owner
   *
   * Family ID
   */
  familyId: string;

  /**
   * Created Date
   */
  createdAt: string;

  /**
   * Last Updated
   */
  updatedAt: string;

  /**
   * Adventure Statistics
   */
  adventureCount: number;

  wonderMoments: number;

  friendshipLevel: number;

  currentStreak: number;

  longestStreak: number;

  /**
   * Core Growth Traits
   */

  curiosity: GrowthTrait;

  creativity: GrowthTrait;

  kindness: GrowthTrait;

  bravery: GrowthTrait;

  exploration: GrowthTrait;

  imagination: GrowthTrait;

  gratitude: GrowthTrait;

  resilience: GrowthTrait;

}