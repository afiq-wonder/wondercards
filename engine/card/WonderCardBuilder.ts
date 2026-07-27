import {
    WonderContentRepository,
    wonderContentRepository,
  } from "@/engine/repository/WonderContentRepository";
  
  import type {
    WonderCard,
    WonderCardStatus,
  } from "@/types/wonderCard";
  
  import type { WonderGenome } from "@/types/wonderGenome";
  import type { WonderMission } from "@/types/wonderMission";
  import type { WonderStory } from "@/types/wonderStory";
  
  export interface WonderCardBuildOptions {
    /**
     * Optional card ID.
     *
     * When omitted, the builder creates a deterministic ID
     * from the genome ID and seed.
     */
    id?: string;
  
    /**
     * WonderCard schema/content version.
     */
    version?: number;
  
    /**
     * Initial card status.
     */
    status?: WonderCardStatus;
  
    /**
     * Initial Wonder Score.
     */
    wonderScore?: number;
  
    /**
     * Creation timestamp.
     */
    createdAt?: Date;
  }
  
  export interface WonderCardRebuildOptions {
    /**
     * Preserve the existing card ID.
     */
    preserveId?: boolean;
  
    /**
     * Preserve the existing creation date.
     */
    preserveCreatedAt?: boolean;
  
    /**
     * Preserve the existing status.
     */
    preserveStatus?: boolean;
  
    /**
     * Preserve the existing Wonder Score.
     */
    preserveWonderScore?: boolean;
  }
  
  /**
   * Creates complete WonderCards from WonderGenome.
   *
   * Flow:
   *
   * WonderGenome
   *   -> WonderContentRepository
   *   -> WonderStory
   *   -> WonderMission
   *   -> WonderCard
   */
  export class WonderCardBuilder {
    constructor(
      private readonly contentRepository: WonderContentRepository =
        wonderContentRepository
    ) {}
  
    /**
     * Builds a complete WonderCard from a WonderGenome.
     */
    build(
      genome: WonderGenome,
      options: WonderCardBuildOptions = {}
    ): WonderCard {
      const safeGenome = cloneWonderGenome(genome);
  
      this.validateGenome(safeGenome);
  
      const cardId =
        normaliseOptionalText(options.id) ??
        createWonderCardId(safeGenome);
  
      const story =
        this.buildStory(safeGenome, cardId);
  
      const mission =
        this.buildMission(safeGenome);
  
      return {
        id: cardId,
  
        version: normalisePositiveInteger(
          options.version,
          1
        ),
  
        createdAt: normaliseDate(
          options.createdAt
        ),
  
        status:
          options.status ?? "ready",
  
        genome: safeGenome,
  
        story,
  
        mission,
  
        world: safeGenome.world.name,
  
        friend: safeGenome.friend.name,
  
        value: safeGenome.value.name,
  
        duration: normaliseDuration(
          safeGenome.duration
        ),
  
        wonderScore: normaliseScore(
          options.wonderScore
        ),
      };
    }
  
    /**
     * Alias maintained for expressive engine usage.
     */
    buildFromGenome(
      genome: WonderGenome,
      options: WonderCardBuildOptions = {}
    ): WonderCard {
      return this.build(genome, options);
    }
  
    /**
     * Rebuilds story and mission content from an existing card's genome.
     *
     * Useful after:
     *
     * - content pack updates,
     * - template changes,
     * - mission library changes,
     * - development-time content regeneration.
     */
    rebuild(
      card: WonderCard,
      options: WonderCardRebuildOptions = {}
    ): WonderCard {
      const {
        preserveId = true,
        preserveCreatedAt = true,
        preserveStatus = true,
        preserveWonderScore = true,
      } = options;
  
      return this.build(
        card.genome,
        {
          id: preserveId
            ? card.id
            : undefined,
  
          version:
            normalisePositiveInteger(
              card.version,
              1
            ) + 1,
  
          createdAt: preserveCreatedAt
            ? card.createdAt
            : undefined,
  
          status: preserveStatus
            ? card.status
            : "ready",
  
          wonderScore: preserveWonderScore
            ? card.wonderScore
            : 0,
        }
      );
    }
  
    /**
     * Creates a copy of a card with a new status.
     */
    withStatus(
      card: WonderCard,
      status: WonderCardStatus
    ): WonderCard {
      return {
        ...cloneWonderCard(card),
        status,
      };
    }
  
    /**
     * Creates a copy of a card with an updated Wonder Score.
     */
    withWonderScore(
      card: WonderCard,
      wonderScore: number
    ): WonderCard {
      return {
        ...cloneWonderCard(card),
  
        wonderScore:
          normaliseScore(wonderScore),
      };
    }
  
    /**
     * Marks a card as played.
     */
    markPlayed(
      card: WonderCard
    ): WonderCard {
      return this.withStatus(
        card,
        "played"
      );
    }
  
    /**
     * Marks a card as completed and optionally updates its score.
     */
    markCompleted(
      card: WonderCard,
      wonderScore: number =
        card.wonderScore
    ): WonderCard {
      return {
        ...cloneWonderCard(card),
  
        status: "completed",
  
        wonderScore:
          normaliseScore(wonderScore),
      };
    }
  
    /**
     * Returns true when a card has all required runtime content.
     */
    isValidCard(
      card: WonderCard
    ): boolean {
      try {
        this.validateGenome(card.genome);
  
        return (
          hasText(card.id) &&
          hasText(card.story.id) &&
          hasText(card.story.title) &&
          hasText(card.story.intro) &&
          hasText(card.story.problem) &&
          hasText(card.story.goal) &&
          hasText(card.story.closing) &&
          hasText(card.mission.id) &&
          hasText(card.mission.title) &&
          hasText(card.mission.objective) &&
          hasText(card.mission.activity) &&
          hasText(
            card.mission.successMessage
          ) &&
          hasText(card.world) &&
          hasText(card.friend) &&
          hasText(card.value) &&
          Number.isFinite(card.duration) &&
          card.duration > 0 &&
          Number.isFinite(
            card.wonderScore
          ) &&
          card.wonderScore >= 0
        );
      } catch {
        return false;
      }
    }
  
    /**
     * Builds story content and gives the generated story a stable ID.
     */
    private buildStory(
      genome: WonderGenome,
      cardId: string
    ): WonderStory {
      const generatedStory =
        this.contentRepository.buildStory(
          genome
        );
  
      return {
        ...generatedStory,
  
        id: `${cardId}:story`,
      };
    }
  
    /**
     * Builds the compatible offline mission.
     */
    private buildMission(
      genome: WonderGenome
    ): WonderMission {
      return this.contentRepository.buildMission(
        genome
      );
    }
  
    /**
     * Fails early when required genome content is missing.
     */
    private validateGenome(
      genome: WonderGenome
    ): void {
      const requiredTextFields: Array<{
        name: string;
        value: string;
      }> = [
        {
          name: "genome.id",
          value: genome.id,
        },
        {
          name: "genome.seed",
          value: genome.seed,
        },
        {
          name: "genome.friend.id",
          value: genome.friend.id,
        },
        {
          name: "genome.friend.name",
          value: genome.friend.name,
        },
        {
          name: "genome.world.id",
          value: genome.world.id,
        },
        {
          name: "genome.world.name",
          value: genome.world.name,
        },
        {
          name: "genome.location",
          value: genome.location,
        },
        {
          name: "genome.value.id",
          value: genome.value.id,
        },
        {
          name: "genome.value.name",
          value: genome.value.name,
        },
        {
          name: "genome.template.id",
          value: genome.template.id,
        },
        {
          name: "genome.template.name",
          value: genome.template.name,
        },
        {
          name: "genome.emotion",
          value: genome.emotion,
        },
      ];
  
      for (
        const field of requiredTextFields
      ) {
        if (!hasText(field.value)) {
          throw new Error(
            `WonderCardBuilder: "${field.name}" is required.`
          );
        }
      }
  
      if (
        !Number.isFinite(
          genome.version
        ) ||
        genome.version < 1
      ) {
        throw new Error(
          'WonderCardBuilder: "genome.version" must be a positive number.'
        );
      }
  
      if (
        !(genome.createdAt instanceof Date) ||
        Number.isNaN(
          genome.createdAt.getTime()
        )
      ) {
        throw new Error(
          'WonderCardBuilder: "genome.createdAt" must be a valid Date.'
        );
      }
  
      if (
        !Number.isFinite(
          genome.ageRange.min
        ) ||
        !Number.isFinite(
          genome.ageRange.max
        )
      ) {
        throw new Error(
          'WonderCardBuilder: "genome.ageRange" must contain valid numbers.'
        );
      }
  
      if (
        genome.ageRange.min < 0 ||
        genome.ageRange.max <
          genome.ageRange.min
      ) {
        throw new Error(
          'WonderCardBuilder: "genome.ageRange" is invalid.'
        );
      }
  
      if (
        !Number.isFinite(
          genome.duration
        ) ||
        genome.duration <= 0
      ) {
        throw new Error(
          'WonderCardBuilder: "genome.duration" must be greater than zero.'
        );
      }
    }
  }
  
  /**
   * Creates a deterministic card ID.
   *
   * The same genome ID and seed always produce the same ID.
   */
  function createWonderCardId(
    genome: WonderGenome
  ): string {
    const genomeId =
      createSlug(genome.id) || "genome";
  
    const seedHash =
      hashText(
        `${genome.id}:${genome.seed}`
      )
        .toString(36)
        .padStart(6, "0");
  
    return `wonder-card-${genomeId}-${seedHash}`;
  }
  
  /**
   * Deterministic unsigned string hash.
   */
  function hashText(
    text: string
  ): number {
    let hash = 2166136261;
  
    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^= text.charCodeAt(index);
  
      hash = Math.imul(
        hash,
        16777619
      );
    }
  
    return hash >>> 0;
  }
  
  function createSlug(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }
  
  function normaliseDuration(
    value: number
  ): number {
    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return 5;
    }
  
    return Math.max(
      1,
      Math.round(value)
    );
  }
  
  function normaliseScore(
    value: number | undefined
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return 0;
    }
  
    return Math.max(
      0,
      Math.round(value)
    );
  }
  
  function normalisePositiveInteger(
    value: number | undefined,
    fallback: number
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value) ||
      value < 1
    ) {
      return fallback;
    }
  
    return Math.max(
      1,
      Math.floor(value)
    );
  }
  
  function normaliseDate(
    value: Date | undefined
  ): Date {
    if (
      value instanceof Date &&
      !Number.isNaN(value.getTime())
    ) {
      return new Date(
        value.getTime()
      );
    }
  
    return new Date();
  }
  
  function normaliseOptionalText(
    value: string | undefined
  ): string | null {
    if (!value) {
      return null;
    }
  
    const cleaned = value.trim();
  
    return cleaned.length > 0
      ? cleaned
      : null;
  }
  
  function hasText(
    value: string
  ): boolean {
    return value.trim().length > 0;
  }
  
  function cloneWonderGenome(
    genome: WonderGenome
  ): WonderGenome {
    return {
      ...genome,
  
      createdAt: new Date(
        genome.createdAt.getTime()
      ),
  
      friend: {
        ...genome.friend,
      },
  
      world: {
        ...genome.world,
      },
  
      value: {
        ...genome.value,
      },
  
      template: {
        ...genome.template,
      },
  
      ageRange: {
        ...genome.ageRange,
      },
    };
  }
  
  function cloneWonderStory(
    story: WonderStory
  ): WonderStory {
    return {
      ...story,
    };
  }
  
  function cloneWonderMission(
    mission: WonderMission
  ): WonderMission {
    return {
      ...mission,
    };
  }
  
  function cloneWonderCard(
    card: WonderCard
  ): WonderCard {
    return {
      ...card,
  
      createdAt: new Date(
        card.createdAt.getTime()
      ),
  
      genome:
        cloneWonderGenome(
          card.genome
        ),
  
      story:
        cloneWonderStory(
          card.story
        ),
  
      mission:
        cloneWonderMission(
          card.mission
        ),
    };
  }
  
  export const wonderCardBuilder =
    new WonderCardBuilder();
  
  export default WonderCardBuilder;