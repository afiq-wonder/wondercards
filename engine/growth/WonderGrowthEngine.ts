import type { WonderDNA } from "@/types/wonderDNA";
import type { WonderMoment } from "@/types/wonderMoment";
import type { GrowthTrait } from "@/types/GrowthTrait";

export class WonderGrowthEngine {

  /**
   * Apply one Wonder Moment
   * into Wonder DNA
   */

  grow(

    dna: WonderDNA,

    moment: WonderMoment

  ): WonderDNA {

    const updated: WonderDNA = structuredClone(dna);

    updated.updatedAt = new Date().toISOString();

    updated.adventureCount += 1;

    updated.wonderMoments += 1;

    this.updateStreak(updated);

    this.applyMoment(updated, moment);

    return updated;

  }

  // --------------------------------------------------

  private applyMoment(

    dna: WonderDNA,

    moment: WonderMoment

  ) {

    for (const tag of moment.tags) {

      switch (tag) {

        case "curious":
          this.addXp(
            dna.curiosity,
            20,
            moment
          );
          break;

        case "creative":
          this.addXp(
            dna.creativity,
            20,
            moment
          );
          break;

        case "kind":
          this.addXp(
            dna.kindness,
            20,
            moment
          );
          break;

        case "brave":
          this.addXp(
            dna.bravery,
            20,
            moment
          );
          break;

        case "explore":
          this.addXp(
            dna.exploration,
            20,
            moment
          );
          break;

        case "imagination":
          this.addXp(
            dna.imagination,
            20,
            moment
          );
          break;

        case "gratitude":
          this.addXp(
            dna.gratitude,
            20,
            moment
          );
          break;

        case "resilient":
          this.addXp(
            dna.resilience,
            20,
            moment
          );
          break;

      }

    }

  }

  // --------------------------------------------------

  private addXp(

    trait: GrowthTrait,

    amount: number,

    moment: WonderMoment

  ) {

    trait.xp += amount;

    trait.totalXp += amount;

    trait.lastGrowth = new Date().toISOString();

    if (!trait.memories.includes(moment.id)) {

      trait.memories.push(moment.id);

    }

    while (trait.xp >= trait.nextLevelXp) {

      trait.xp -= trait.nextLevelXp;

      trait.level++;

      trait.nextLevelXp =
        this.calculateNextLevelXp(
          trait.level
        );

      trait.milestones.push({

        id:
          crypto.randomUUID(),

        title:
          `${trait.name} Level ${trait.level}`,

        description:
          `${trait.name} has grown stronger.`,

        achievedAt:
          new Date().toISOString()

      });

    }

  }

  // --------------------------------------------------

  private calculateNextLevelXp(

    level: number

  ): number {

    return 100 + (level - 1) * 50;

  }

  // --------------------------------------------------

  private updateStreak(

    dna: WonderDNA

  ) {

    dna.currentStreak++;

    if (

      dna.currentStreak >

      dna.longestStreak

    ) {

      dna.longestStreak =
        dna.currentStreak;

    }

    dna.friendshipLevel =
      this.calculateFriendshipLevel(

        dna.adventureCount

      );

  }

  // --------------------------------------------------

  private calculateFriendshipLevel(

    adventures: number

  ): number {

    if (adventures >= 500) return 10;

    if (adventures >= 300) return 9;

    if (adventures >= 200) return 8;

    if (adventures >= 150) return 7;

    if (adventures >= 100) return 6;

    if (adventures >= 70) return 5;

    if (adventures >= 40) return 4;

    if (adventures >= 20) return 3;

    if (adventures >= 10) return 2;

    return 1;

  }

}

export const wonderGrowthEngine =
  new WonderGrowthEngine();