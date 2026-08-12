// ============================================
// WonderCards
// Coral Configuration
// Version: 1.0
// ============================================

export interface CoralTimingConfig {
    lookBackDelayMs: number;
    idleReactionDelayMs: number;
    waitReminderDelayMs: number;
    celebrationDurationMs: number;
    presentObjectDurationMs: number;
    transitionDurationMs: number;
  }
  
  export interface CoralMovementConfig {
    swimSpeed: number;
    leadDistancePx: number;
    followDistancePx: number;
    arrivalThresholdPx: number;
    approachDistancePx: number;
  }
  
  export interface CoralAmbientConfig {
    bubbleIntervalMs: number;
    blinkMinIntervalMs: number;
    blinkMaxIntervalMs: number;
    idleMotionAmplitudePx: number;
    idleMotionDurationMs: number;
  }
  
  export interface CoralBehaviourConfig {
    allowAutomaticLookBack: boolean;
    allowIdleReactions: boolean;
    allowTapCelebration: boolean;
  }
  
  export interface CoralConfig {
    timing: CoralTimingConfig;
    movement: CoralMovementConfig;
    ambient: CoralAmbientConfig;
    behaviour: CoralBehaviourConfig;
  }
  
  export const coralConfig: Readonly<CoralConfig> = {
    timing: {
      lookBackDelayMs: 2_000,
  
      idleReactionDelayMs: 4_000,
  
      waitReminderDelayMs: 8_000,
  
      celebrationDurationMs: 2_500,
  
      presentObjectDurationMs: 2_000,
  
      transitionDurationMs: 600,
    },
  
    movement: {
      /**
       * Abstract speed multiplier.
       * The renderer decides how this maps to pixels or animation time.
       */
      swimSpeed: 1,
  
      leadDistancePx: 120,
  
      followDistancePx: 80,
  
      arrivalThresholdPx: 16,
  
      approachDistancePx: 48,
    },
  
    ambient: {
      bubbleIntervalMs: 4_000,
  
      blinkMinIntervalMs: 3_000,
  
      blinkMaxIntervalMs: 7_000,
  
      idleMotionAmplitudePx: 6,
  
      idleMotionDurationMs: 2_800,
    },
  
    behaviour: {
      allowAutomaticLookBack: true,
  
      allowIdleReactions: true,
  
      allowTapCelebration: true,
    },
  };
  
  /**
   * Development helper.
   *
   * Allows temporary config overrides without mutating the
   * production configuration.
   */
  export function createCoralConfig(
    overrides: Partial<{
      timing: Partial<CoralTimingConfig>;
      movement: Partial<CoralMovementConfig>;
      ambient: Partial<CoralAmbientConfig>;
      behaviour: Partial<CoralBehaviourConfig>;
    }> = {},
  ): CoralConfig {
    return {
      timing: {
        ...coralConfig.timing,
        ...overrides.timing,
      },
  
      movement: {
        ...coralConfig.movement,
        ...overrides.movement,
      },
  
      ambient: {
        ...coralConfig.ambient,
        ...overrides.ambient,
      },
  
      behaviour: {
        ...coralConfig.behaviour,
        ...overrides.behaviour,
      },
    };
  }