export interface WonderArchetype {

    /**
     * ==========================================================
     * META
     * ==========================================================
     */
  
    meta: {
  
      id: string;
  
      name: string;
  
      title: string;
  
      description: string;
  
      icon: string;
  
    };
  
    /**
     * ==========================================================
     * IDENTITY
     * ==========================================================
     */
  
    identity: {
  
      primaryTraits: string[];
  
      secondaryTraits: string[];
  
      familyMotto: string;
  
      signatureColor: string;
  
      signatureSymbol: string;
  
    };
  
    /**
     * ==========================================================
     * WORLD
     * ==========================================================
     */
  
    world: {
  
      biome: string;
  
      village: string;
  
      home: string;
  
      tree: {
  
        profile: string;
  
        trunkStyle: string;
  
        branchStyle: string;
  
        leafStyle: string;
  
        flowerStyle: string;
  
        fruitStyle: string;
  
        rootStyle: string;
  
      };
  
      palette: {
  
        primary: string;
  
        secondary: string;
  
        accent: string;
  
      };
  
      sky: string;
  
      weather: string;
  
      lighting: string;
  
      ambience: string;
  
      soundtrack: string;
  
      particles: string;
  
      creatures: {
  
        birds: string;
  
        butterflies: string;
  
        fish: string;
  
      };
  
    };
  
    /**
     * ==========================================================
     * CORAL
     * ==========================================================
     */
  
    coral: {
  
      style: string;
  
      personality: string;
  
      energy: "low" | "medium" | "high";
  
      speakingSpeed: "slow" | "normal" | "fast";
  
      voice: string;
  
      animation: string;
  
      dialogueStyle: string;
  
      greetings: string[];
  
      celebrationStyle: string;
  
      reflectionStyle: string;
  
      encouragementStyle: string;
  
      goodbyeStyle: string;
  
      favouriteWords: string[];
  
    };
  
    /**
     * ==========================================================
     * CONTENT
     * ==========================================================
     */
  
    content: {
  
      stories: {
  
        favouriteWorlds: string[];
  
        favouriteTemplates: string[];
  
        favouriteFriends: string[];
  
        preferredEmotions: string[];
  
      };
  
      missions: {
  
        favouriteIndoorActivities: string[];
  
        favouriteOutdoorActivities: string[];
  
        favouriteCreativeActivities: string[];
  
        favouriteAdventureActivities: string[];
  
      };
  
      rewards: {
  
        favouriteRewardType: string;
  
        celebrationAnimation: string;
  
        celebrationSound: string;
  
      };
  
    };
  
    /**
     * ==========================================================
     * PROGRESSION
     * ==========================================================
     */
  
    progression: {
  
      growth: {
  
        flowerMultiplier: number;
  
        fruitMultiplier: number;
  
        birdMultiplier: number;
  
        butterflyMultiplier: number;
  
      };
  
      milestones: {
  
        seed: number;
  
        sprout: number;
  
        youngTree: number;
  
        growingTree: number;
  
        bloomingTree: number;
  
        greatTree: number;
  
        legacyTree: number;
  
      };
  
      unlocks: {
  
        villageDecorations: boolean;
  
        coralAccessories: boolean;
  
        newBiome: boolean;
  
        newMusic: boolean;
  
        seasonalEvents: boolean;
  
      };
  
      evolution: {
  
        treeEvolutionEnabled: boolean;
  
        coralEvolutionEnabled: boolean;
  
        villageEvolutionEnabled: boolean;
  
      };
  
    };
  
    /**
     * ==========================================================
     * FUTURE
     * ==========================================================
     */
  
    future: {
  
      avatarStyle: string;
  
      companionPet: string;
  
      badgeStyle: string;
  
      collectibleStyle: string;
  
      seasonalTheme: string;
  
      homeDecorationStyle: string;
  
      bookIllustrationStyle: string;
  
      merchandiseTheme: string;
  
    };
  
  }