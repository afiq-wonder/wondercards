import type {
    WonderIdentity,
  } from "@/engine/identity/WonderIdentityEngine";
  import type { WonderArchetype } from "@/types/WonderArchetype";
  
  export type WonderTreeStage =
    | "Seed"
    | "Sprout"
    | "Young Tree"
    | "Growing Tree"
    | "Blooming Tree"
    | "Great Wonder Tree"
    | "Legacy Tree";
  
  export interface WonderTreePalette {
    primary: string;
    secondary: string;
    accent: string;
  }
  
  export interface WonderTreeStyle {
    profile: string;
    trunkStyle: string;
    branchStyle: string;
    leafStyle: string;
    flowerStyle: string;
    fruitStyle: string;
    rootStyle: string;
  }
  
  export interface WonderTreeCreatures {
    birdType: string;
    butterflyType: string;
  }
  
  export interface WonderTree {
    stage: WonderTreeStage;
  
    height: number;
  
    trunkThickness: number;
  
    roots: number;
  
    branches: number;
  
    leaves: number;
  
    flowers: number;
  
    fruits: number;
  
    birds: number;
  
    butterflies: number;
  
    /**
     * Legacy-friendly palette profile name.
     *
     * Examples:
     * wonder
     * ocean
     * sunset
     * blossom
     * forest
     */
    palette: string;
  
    /**
     * Primary biome or environment name.
     */
    environment: string;
  
    /**
     * Complete visual colour palette.
     */
    paletteColors: WonderTreePalette;
  
    /**
     * Complete tree appearance blueprint.
     */
    style: WonderTreeStyle;
  
    /**
     * Creature types belonging to this tree world.
     */
    creatures: WonderTreeCreatures;
  
    /**
     * World presentation metadata.
     */
    sky: string;
  
    weather: string;
  
    lighting: string;
  
    ambience: string;
  
    soundtrack: string;
  
    particles: string;
  }
  
  export class WonderTreeEngine {
    /**
     * Builds a complete Wonder Tree from the resolved family identity.
     *
     * WonderDNA
     *   -> WonderIdentity
     *   -> WonderArchetype
     *   -> WonderTree
     */
    buildTree(
      identity: WonderIdentity,
      adventureCount: number
    ): WonderTree {
      const archetype = identity.archetype;
      const adventures = this.normaliseAdventureCount(
        adventureCount
      );
  
      return {
        stage: this.getStage(
          adventures,
          archetype
        ),
  
        height: this.getHeight(adventures),
  
        trunkThickness:
          this.getTrunkThickness(adventures),
  
        roots: this.getRoots(adventures),
  
        branches: this.getBranches(adventures),
  
        leaves: this.getLeaves(adventures),
  
        flowers: this.getFlowers(
          adventures,
          archetype
        ),
  
        fruits: this.getFruits(
          adventures,
          archetype
        ),
  
        birds: this.getBirds(
          adventures,
          archetype
        ),
  
        butterflies: this.getButterflies(
          adventures,
          archetype
        ),
  
        palette: archetype.world.tree.profile,
  
        environment: archetype.world.biome,
  
        paletteColors: {
          primary:
            archetype.world.palette.primary,
  
          secondary:
            archetype.world.palette.secondary,
  
          accent:
            archetype.world.palette.accent,
        },
  
        style: {
          profile:
            archetype.world.tree.profile,
  
          trunkStyle:
            archetype.world.tree.trunkStyle,
  
          branchStyle:
            archetype.world.tree.branchStyle,
  
          leafStyle:
            archetype.world.tree.leafStyle,
  
          flowerStyle:
            archetype.world.tree.flowerStyle,
  
          fruitStyle:
            archetype.world.tree.fruitStyle,
  
          rootStyle:
            archetype.world.tree.rootStyle,
        },
  
        creatures: {
          birdType:
            archetype.world.creatures.birds,
  
          butterflyType:
            archetype.world.creatures.butterflies,
        },
  
        sky: archetype.world.sky,
  
        weather: archetype.world.weather,
  
        lighting: archetype.world.lighting,
  
        ambience: archetype.world.ambience,
  
        soundtrack: archetype.world.soundtrack,
  
        particles: archetype.world.particles,
      };
    }
  
    /**
     * Returns only the current growth stage.
     */
    getTreeStage(
      identity: WonderIdentity,
      adventureCount: number
    ): WonderTreeStage {
      return this.getStage(
        this.normaliseAdventureCount(
          adventureCount
        ),
        identity.archetype
      );
    }
  
    /**
     * Returns the progress percentage toward the next tree stage.
     *
     * The value is always between 0 and 100.
     */
    getStageProgress(
      identity: WonderIdentity,
      adventureCount: number
    ): number {
      const adventures =
        this.normaliseAdventureCount(
          adventureCount
        );
  
      const milestones =
        identity.archetype.progression.milestones;
  
      const ranges: Array<{
        minimum: number;
        maximum: number;
      }> = [
        {
          minimum: milestones.seed,
          maximum: milestones.sprout,
        },
        {
          minimum: milestones.sprout,
          maximum: milestones.youngTree,
        },
        {
          minimum: milestones.youngTree,
          maximum: milestones.growingTree,
        },
        {
          minimum: milestones.growingTree,
          maximum: milestones.bloomingTree,
        },
        {
          minimum: milestones.bloomingTree,
          maximum: milestones.greatTree,
        },
        {
          minimum: milestones.greatTree,
          maximum: milestones.legacyTree,
        },
      ];
  
      if (
        adventures >= milestones.legacyTree
      ) {
        return 100;
      }
  
      const currentRange = ranges.find(
        (range) =>
          adventures >= range.minimum &&
          adventures < range.maximum
      );
  
      if (!currentRange) {
        return 0;
      }
  
      const rangeSize =
        currentRange.maximum -
        currentRange.minimum;
  
      if (rangeSize <= 0) {
        return 100;
      }
  
      const progress =
        adventures - currentRange.minimum;
  
      return this.clamp(
        Math.round(
          (progress / rangeSize) * 100
        ),
        0,
        100
      );
    }
  
    /**
     * Returns how many adventures remain before the next stage.
     */
    getAdventuresUntilNextStage(
      identity: WonderIdentity,
      adventureCount: number
    ): number {
      const adventures =
        this.normaliseAdventureCount(
          adventureCount
        );
  
      const milestones =
        identity.archetype.progression.milestones;
  
      const orderedMilestones = [
        milestones.sprout,
        milestones.youngTree,
        milestones.growingTree,
        milestones.bloomingTree,
        milestones.greatTree,
        milestones.legacyTree,
      ];
  
      const nextMilestone =
        orderedMilestones.find(
          (milestone) =>
            milestone > adventures
        );
  
      if (nextMilestone === undefined) {
        return 0;
      }
  
      return nextMilestone - adventures;
    }
  
    private getStage(
      adventures: number,
      archetype: WonderArchetype
    ): WonderTreeStage {
      const milestones =
        archetype.progression.milestones;
  
      if (
        adventures >= milestones.legacyTree
      ) {
        return "Legacy Tree";
      }
  
      if (
        adventures >= milestones.greatTree
      ) {
        return "Great Wonder Tree";
      }
  
      if (
        adventures >= milestones.bloomingTree
      ) {
        return "Blooming Tree";
      }
  
      if (
        adventures >= milestones.growingTree
      ) {
        return "Growing Tree";
      }
  
      if (
        adventures >= milestones.youngTree
      ) {
        return "Young Tree";
      }
  
      if (
        adventures >= milestones.sprout
      ) {
        return "Sprout";
      }
  
      return "Seed";
    }
  
    private getHeight(
      adventures: number
    ): number {
      return this.clamp(
        10 + adventures,
        10,
        100
      );
    }
  
    private getTrunkThickness(
      adventures: number
    ): number {
      return this.clamp(
        5 + Math.floor(adventures / 10),
        5,
        40
      );
    }
  
    private getRoots(
      adventures: number
    ): number {
      return this.clamp(
        Math.floor(adventures / 8),
        0,
        25
      );
    }
  
    private getBranches(
      adventures: number
    ): number {
      return this.clamp(
        2 + Math.floor(adventures / 6),
        2,
        30
      );
    }
  
    private getLeaves(
      adventures: number
    ): number {
      return this.clamp(
        adventures,
        0,
        500
      );
    }
  
    private getFlowers(
      adventures: number,
      archetype: WonderArchetype
    ): number {
      const multiplier =
        this.normaliseMultiplier(
          archetype.progression.growth
            .flowerMultiplier
        );
  
      const baseFlowers =
        adventures * 0.25;
  
      return this.clamp(
        Math.floor(
          baseFlowers * multiplier
        ),
        0,
        500
      );
    }
  
    private getFruits(
      adventures: number,
      archetype: WonderArchetype
    ): number {
      const multiplier =
        this.normaliseMultiplier(
          archetype.progression.growth
            .fruitMultiplier
        );
  
      const baseFruits =
        adventures * 0.1;
  
      return this.clamp(
        Math.floor(
          baseFruits * multiplier
        ),
        0,
        250
      );
    }
  
    private getBirds(
      adventures: number,
      archetype: WonderArchetype
    ): number {
      const multiplier =
        this.normaliseMultiplier(
          archetype.progression.growth
            .birdMultiplier
        );
  
      const baseBirds =
        adventures / 30;
  
      return this.clamp(
        Math.floor(
          baseBirds * multiplier
        ),
        0,
        20
      );
    }
  
    private getButterflies(
      adventures: number,
      archetype: WonderArchetype
    ): number {
      const multiplier =
        this.normaliseMultiplier(
          archetype.progression.growth
            .butterflyMultiplier
        );
  
      const baseButterflies =
        adventures / 35;
  
      return this.clamp(
        Math.floor(
          baseButterflies * multiplier
        ),
        0,
        20
      );
    }
  
    private normaliseAdventureCount(
      value: number
    ): number {
      if (!Number.isFinite(value)) {
        return 0;
      }
  
      return Math.max(
        0,
        Math.floor(value)
      );
    }
  
    private normaliseMultiplier(
      value: number
    ): number {
      if (!Number.isFinite(value)) {
        return 1;
      }
  
      return Math.max(0, value);
    }
  
    private clamp(
      value: number,
      minimum: number,
      maximum: number
    ): number {
      return Math.min(
        maximum,
        Math.max(minimum, value)
      );
    }
  }
  
  export const wonderTreeEngine =
    new WonderTreeEngine();
  
  export default WonderTreeEngine;