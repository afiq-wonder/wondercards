import {
    getAllStoryFragments,
    getCompatibleStoryFragments,
    renderStoryFragment,
  } from "@/data/storyFragments";
  
  import {
    getAllWonderMissions,
    getCompatibleWonderMissions,
    renderWonderMission,
  } from "@/data/missions";
  
  import {
    getAllWonderFriends,
    getWonderFriendById,
  } from "@/data/friends";
  
  import {
    getAllWonderWorlds,
    getWonderWorldById,
  } from "@/data/worlds";
  
  import {
    getAllWonderValues,
    getWonderValueById,
  } from "@/data/values";
  
  import {
    getAllWonderTemplates,
    getWonderTemplateById,
  } from "@/data/templates";
  
  import type { WonderGenome } from "@/types/wonderGenome";
  import type { WonderStory } from "@/types/wonderStory";
  import type { WonderMission } from "@/types/wonderMission";
  import type { WonderFriend } from "@/types/wonderFriend";
  import type { WonderWorld } from "@/types/wonderWorld";
  import type { WonderValue } from "@/types/wonderValue";
  import type { WonderTemplate } from "@/types/wonderTemplate";
  
  export class WonderContentRepository {
  
    // =====================================================
    // PUBLIC LOOKUPS
    // =====================================================
  
    getFriend(
      id: string
    ): WonderFriend {
  
      return structuredClone(
        getWonderFriendById(id)
      );
  
    }
  
    getWorld(
      id: string
    ): WonderWorld {
  
      return structuredClone(
        getWonderWorldById(id)
      );
  
    }
  
    getValue(
      id: string
    ): WonderValue {
  
      return structuredClone(
        getWonderValueById(id)
      );
  
    }
  
    getTemplate(
      id: string
    ): WonderTemplate {
  
      return structuredClone(
        getWonderTemplateById(id)
      );
  
    }
  
    getFriends(): WonderFriend[] {
  
      return structuredClone(
        getAllWonderFriends()
      );
  
    }
  
    getWorlds(): WonderWorld[] {
  
      return structuredClone(
        getAllWonderWorlds()
      );
  
    }
  
    getValues(): WonderValue[] {
  
      return structuredClone(
        getAllWonderValues()
      );
  
    }
  
    getTemplates(): WonderTemplate[] {
  
      return structuredClone(
        getAllWonderTemplates()
      );
  
    }
  
    // =====================================================
    // STORY
    // =====================================================
  
    buildStory(
      genome: WonderGenome
    ): WonderStory {
  
      const intro =
        this.pickStoryFragment(
          genome,
          "intro"
        );
  
      const problem =
        this.pickStoryFragment(
          genome,
          "problem"
        );
  
      const goal =
        this.pickStoryFragment(
          genome,
          "goal"
        );
  
      const closing =
        this.pickStoryFragment(
          genome,
          "closing"
        );
  
      return {
  
        id: crypto.randomUUID(),
  
        title: `${genome.friend.name}'s Wonder Adventure`,
  
        intro,
  
        problem,
  
        goal,
  
        closing,
  
      };
  
    }
  
    // =====================================================
    // MISSION
    // =====================================================
  
    buildMission(
      genome: WonderGenome
    ): WonderMission {
  
      const missions =
        getCompatibleWonderMissions({
  
          valueId:
            genome.value.id,
  
          worldId:
            genome.world.id,
  
          templateId:
            genome.template.id,
  
          difficulty:
            genome.difficulty,
  
          age:
            genome.ageRange.min,
  
        });
  
      const mission =
        this.seedPick(
  
          genome.seed,
  
          missions
  
        );
  
      return renderWonderMission(
  
        mission,
  
        {
  
          friend:
            genome.friend.name,
  
          world:
            genome.world.name,
  
          location:
            genome.location,
  
          value:
            genome.value.name,
  
        }
  
      );
  
    }
  
    // =====================================================
    // RANDOM STORY
    // =====================================================
  
    private pickStoryFragment(
  
      genome: WonderGenome,
  
      type:
        | "intro"
        | "problem"
        | "goal"
        | "closing"
  
    ): string {
  
      const fragments =
        getCompatibleStoryFragments({
  
          type,
  
          templateId:
            genome.template.id,
  
          worldId:
            genome.world.id,
  
          valueId:
            genome.value.id,
  
          emotion:
            genome.emotion,
  
          age:
            genome.ageRange.min,
  
        });
  
      const fragment =
        this.seedPick(
  
          genome.seed + "-" + type,
  
          fragments
  
        );
  
      return renderStoryFragment(
  
        fragment,
  
        {
  
          friend:
            genome.friend.name,
  
          world:
            genome.world.name,
  
          location:
            genome.location,
  
          value:
            genome.value.name,
  
        }
  
      );
  
    }
  
    // =====================================================
    // DETERMINISTIC RANDOM
    // =====================================================
  
    private seedPick<T>(
  
      seed: string,
  
      items: T[]
  
    ): T {
  
      if (items.length === 0) {
  
        throw new Error(
  
          "WonderContentRepository: empty collection."
  
        );
  
      }
  
      const index =
        this.hash(seed) %
        items.length;
  
      return items[index];
  
    }
  
    private hash(
      text: string
    ): number {
  
      let hash = 0;
  
      for (
  
        let i = 0;
  
        i < text.length;
  
        i++
  
      ) {
  
        hash =
  
          (hash << 5) -
  
          hash +
  
          text.charCodeAt(i);
  
        hash |= 0;
  
      }
  
      return Math.abs(hash);
  
    }
  
    // =====================================================
    // DEBUG
    // =====================================================
  
    printStats() {
  
      console.table({
  
        friends:
          getAllWonderFriends().length,
  
        worlds:
          getAllWonderWorlds().length,
  
        values:
          getAllWonderValues().length,
  
        templates:
          getAllWonderTemplates().length,
  
        storyFragments:
          getAllStoryFragments().length,
  
        missions:
          getAllWonderMissions().length,
  
      });
  
    }
  
  }
  
  export const wonderContentRepository =
    new WonderContentRepository();