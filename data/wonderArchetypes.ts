import type { WonderArchetype } from "@/types/WonderArchetype";

export const DEFAULT_WONDER_ARCHETYPE_ID = "wonder";

export const WONDER_ARCHETYPES: WonderArchetype[] = [
  {
    meta: {
      id: "wonder",
      name: "Wonder Family",
      title: "Wonderful Together",
      description:
        "A warm and balanced family world shaped by curiosity, kindness, creativity and meaningful moments together.",
      icon: "✨",
    },

    identity: {
      primaryTraits: [],
      secondaryTraits: [],
      familyMotto: "We Choose To Make Today Wonderful.",
      signatureColor: "#A9DDEB",
      signatureSymbol: "✨",
    },

    world: {
      biome: "Coral Village Lagoon",
      village: "Coral Village",
      home: "Pearl Nook",
      tree: {
        profile: "wonder",
        trunkStyle: "Soft Pearlwood",
        branchStyle: "Gentle Round Branches",
        leafStyle: "Seafoam Wonder Leaves",
        flowerStyle: "Pearl Blossom",
        fruitStyle: "Golden Wonder Fruit",
        rootStyle: "Warm Family Roots",
      },
      palette: {
        primary: "#A9DDEB",
        secondary: "#D9F1F2",
        accent: "#DCCFF6",
      },
      sky: "Soft Underwater Dawn",
      weather: "Gentle Lagoon Current",
      lighting: "Pearl Morning Glow",
      ambience: "Quiet bubbles, distant waves and friendly village sounds",
      soundtrack: "Make Today Wonderful",
      particles: "Soft Pearls and Tiny Bubbles",
      creatures: {
        birds: "Wonder Finches",
        butterflies: "Pearlwing Butterflies",
        fish: "Rainbow Minnows",
      },
    },

    coral: {
      style: "Classic Coral",
      personality:
        "Warm, curious, gentle, playful, patient and always ready to explore together.",
      energy: "medium",
      speakingSpeed: "normal",
      voice: "Warm and friendly",
      animation: "Gentle floating swim",
      dialogueStyle: "Simple, encouraging and wonder-filled",
      greetings: [
        "Hey Explorer! How wonderful are you today?",
        "It’s Wonder Time! Shall we discover something together?",
        "I’m so happy you’re here. A new adventure is waiting!",
        "Hello, Wonder Family! Let’s make today wonderful.",
      ],
      celebrationStyle:
        "Celebrate shared effort, imagination and the memory created together.",
      reflectionStyle:
        "Invite a short, gentle conversation about what surprised or delighted the family.",
      encouragementStyle:
        "Recognise effort without judgement, pressure or comparison.",
      goodbyeStyle:
        "End warmly and remind the family that another wonderful day is waiting.",
      favouriteWords: [
        "wonder",
        "together",
        "explore",
        "discover",
        "imagine",
        "create",
        "remember",
        "friend",
        "family",
        "adventure",
      ],
    },

    content: {
      stories: {
        favouriteWorlds: ["Coral World"],
        favouriteTemplates: [
          "Tiny Mystery",
          "Lost and Found",
          "New Friend",
          "Hidden Treasure",
        ],
        favouriteFriends: ["Coral"],
        preferredEmotions: [
          "wonder",
          "joy",
          "curiosity",
          "calm",
          "kindness",
        ],
      },

      missions: {
        favouriteIndoorActivities: [
          "Family Conversation",
          "Simple Drawing",
          "Object Discovery",
          "Imaginative Play",
        ],
        favouriteOutdoorActivities: [
          "Nature Walk",
          "Colour Hunt",
          "Cloud Watching",
          "Family Exploration",
        ],
        favouriteCreativeActivities: [
          "Drawing",
          "Storytelling",
          "Building",
          "Pretend Play",
        ],
        favouriteAdventureActivities: [
          "Tiny Mystery",
          "Treasure Search",
          "Observation Challenge",
          "Family Quest",
        ],
      },

      rewards: {
        favouriteRewardType: "Wonder Pearl",
        celebrationAnimation: "Soft Pearl Glow",
        celebrationSound: "Gentle Wonder Chime",
      },
    },

    progression: {
      growth: {
        flowerMultiplier: 1,
        fruitMultiplier: 1,
        birdMultiplier: 1,
        butterflyMultiplier: 1,
      },

      milestones: {
        seed: 0,
        sprout: 5,
        youngTree: 20,
        growingTree: 60,
        bloomingTree: 120,
        greatTree: 250,
        legacyTree: 500,
      },

      unlocks: {
        villageDecorations: true,
        coralAccessories: true,
        newBiome: false,
        newMusic: true,
        seasonalEvents: true,
      },

      evolution: {
        treeEvolutionEnabled: true,
        coralEvolutionEnabled: true,
        villageEvolutionEnabled: true,
      },
    },

    future: {
      avatarStyle: "Classic Wonder Explorer",
      companionPet: "Tiny Pearl Fish",
      badgeStyle: "Soft Pearl Emblem",
      collectibleStyle: "Wonder Shells",
      seasonalTheme: "Coral Village Seasons",
      homeDecorationStyle: "Warm Pearl Cottage",
      bookIllustrationStyle: "Soft Storybook Watercolour",
      merchandiseTheme: "Make Today Wonderful",
    },
  },

  {
    meta: {
      id: "explorer",
      name: "Explorer Family",
      title: "Curious Explorers",
      description:
        "A family that loves asking questions, noticing tiny details and discovering new places together.",
      icon: "🧭",
    },

    identity: {
      primaryTraits: ["Curiosity", "Exploration"],
      secondaryTraits: ["Bravery", "Resilience"],
      familyMotto: "Every question begins an adventure.",
      signatureColor: "#6CBFD6",
      signatureSymbol: "🧭",
    },

    world: {
      biome: "Coral Coast",
      village: "Explorer’s Harbour",
      home: "Shelllight Lighthouse",
      tree: {
        profile: "ocean",
        trunkStyle: "Weathered Coralwood",
        branchStyle: "Flowing Wave Branches",
        leafStyle: "Ocean Compass Leaves",
        flowerStyle: "Blue Coral Bloom",
        fruitStyle: "Discovery Pearls",
        rootStyle: "Deep Explorer Roots",
      },
      palette: {
        primary: "#6CBFD6",
        secondary: "#BCE4EA",
        accent: "#F2D38A",
      },
      sky: "Blue-Gold Underwater Sunrise",
      weather: "Fresh Sea Breeze",
      lighting: "Moving Ocean Light",
      ambience: "Gentle waves, bubbles, distant bells and curious sea life",
      soundtrack: "Ocean Breeze Adventure",
      particles: "Rising Bubbles and Compass Sparks",
      creatures: {
        birds: "Coral Coast Terns",
        butterflies: "Bubblewing Fish",
        fish: "Silver Trailfish",
      },
    },

    coral: {
      style: "Explorer Coral",
      personality:
        "Energetic, observant, curious and delighted by every tiny mystery.",
      energy: "high",
      speakingSpeed: "fast",
      voice: "Bright and adventurous",
      animation: "Quick curious swimming with playful turns",
      dialogueStyle: "Excited questions and discovery-focused invitations",
      greetings: [
        "Guess what I discovered today?",
        "Explorer! I found a tiny clue near the reef.",
        "A mystery is waiting. Shall we investigate together?",
        "I was hoping you’d come! There’s something new to explore.",
      ],
      celebrationStyle:
        "Celebrate discoveries, thoughtful questions and careful observation.",
      reflectionStyle:
        "Ask what the family noticed, wondered about or wants to explore next.",
      encouragementStyle:
        "Remind the family that every question can open a new adventure.",
      goodbyeStyle:
        "End with anticipation for the next mystery or discovery.",
      favouriteWords: [
        "discover",
        "explore",
        "mystery",
        "clue",
        "question",
        "observe",
        "adventure",
        "trail",
        "map",
        "together",
      ],
    },

    content: {
      stories: {
        favouriteWorlds: [
          "Coral World",
          "Jungle World",
          "Space World",
        ],
        favouriteTemplates: [
          "Tiny Mystery",
          "Hidden Treasure",
          "Secret Trail",
          "Lost and Found",
        ],
        favouriteFriends: ["Coral"],
        preferredEmotions: [
          "curiosity",
          "wonder",
          "excitement",
          "bravery",
        ],
      },

      missions: {
        favouriteIndoorActivities: [
          "Clue Hunt",
          "Household Object Investigation",
          "Map Drawing",
          "Mystery Sorting",
        ],
        favouriteOutdoorActivities: [
          "Nature Exploration",
          "Mini Treasure Hunt",
          "Texture Discovery",
          "Sound Safari",
        ],
        favouriteCreativeActivities: [
          "Adventure Map",
          "Explorer Journal",
          "Build a Telescope",
          "Create a Discovery Box",
        ],
        favouriteAdventureActivities: [
          "Treasure Search",
          "Trail Mission",
          "Observation Challenge",
          "Family Expedition",
        ],
      },

      rewards: {
        favouriteRewardType: "Discovery Pearl",
        celebrationAnimation: "Compass Spark Burst",
        celebrationSound: "Explorer Bell Chime",
      },
    },

    progression: {
      growth: {
        flowerMultiplier: 0.9,
        fruitMultiplier: 1,
        birdMultiplier: 1.4,
        butterflyMultiplier: 0.9,
      },

      milestones: {
        seed: 0,
        sprout: 5,
        youngTree: 18,
        growingTree: 55,
        bloomingTree: 110,
        greatTree: 230,
        legacyTree: 480,
      },

      unlocks: {
        villageDecorations: true,
        coralAccessories: true,
        newBiome: true,
        newMusic: true,
        seasonalEvents: true,
      },

      evolution: {
        treeEvolutionEnabled: true,
        coralEvolutionEnabled: true,
        villageEvolutionEnabled: true,
      },
    },

    future: {
      avatarStyle: "Coral Coast Explorer",
      companionPet: "Tiny Compass Crab",
      badgeStyle: "Explorer Compass Emblem",
      collectibleStyle: "Discovery Pearls and Map Pieces",
      seasonalTheme: "Great Coral Expedition",
      homeDecorationStyle: "Ocean Explorer Lighthouse",
      bookIllustrationStyle: "Detailed Adventure Storybook",
      merchandiseTheme: "Curious Explorer Collection",
    },
  },

  {
    meta: {
      id: "dream-builder",
      name: "Dream Builder Family",
      title: "Creative Dreamers",
      description:
        "A family that loves imagining, inventing and creating wonderful new possibilities together.",
      icon: "🎨",
    },

    identity: {
      primaryTraits: ["Creativity", "Imagination"],
      secondaryTraits: ["Curiosity", "Gratitude"],
      familyMotto: "Every idea can become something wonderful.",
      signatureColor: "#C7AFE8",
      signatureSymbol: "🎨",
    },

    world: {
      biome: "Rainbow Meadow",
      village: "Dreamlight Village",
      home: "Imagination Cottage",
      tree: {
        profile: "sunset",
        trunkStyle: "Curved Dreamwood",
        branchStyle: "Spiral Story Branches",
        leafStyle: "Rainbow Idea Leaves",
        flowerStyle: "Magic Dream Blossom",
        fruitStyle: "Crystal Imagination Fruit",
        rootStyle: "Creative Story Roots",
      },
      palette: {
        primary: "#C7AFE8",
        secondary: "#F2C9D8",
        accent: "#F4D98D",
      },
      sky: "Lavender-Pink Underwater Sunset",
      weather: "Golden Dream Current",
      lighting: "Soft Rainbow Glow",
      ambience: "Gentle chimes, dreamy water movement and distant laughter",
      soundtrack: "Dream Builder Waltz",
      particles: "Magic Dust and Floating Colour Sparks",
      creatures: {
        birds: "Dreamlight Bluebirds",
        butterflies: "Rainbowfin Butterflies",
        fish: "Paintdrop Fish",
      },
    },

    coral: {
      style: "Dream Builder Coral",
      personality:
        "Playful, imaginative, expressive and always excited by a new idea.",
      energy: "medium",
      speakingSpeed: "normal",
      voice: "Dreamy and expressive",
      animation: "Graceful spins with tiny colour trails",
      dialogueStyle: "Playful ideas, creative choices and imaginative prompts",
      greetings: [
        "I have a magical idea!",
        "What shall we imagine together today?",
        "I found a blank page waiting for our wonderful idea.",
        "Explorer, I think we can create something amazing!",
      ],
      celebrationStyle:
        "Celebrate imagination, self-expression and the joy of making something together.",
      reflectionStyle:
        "Ask what the family imagined, created or would change next time.",
      encouragementStyle:
        "Remind the family that every idea can grow into something special.",
      goodbyeStyle:
        "End with an invitation to keep imagining after the screen is closed.",
      favouriteWords: [
        "create",
        "imagine",
        "colour",
        "story",
        "idea",
        "dream",
        "build",
        "invent",
        "magic",
        "together",
      ],
    },

    content: {
      stories: {
        favouriteWorlds: [
          "Coral World",
          "Dream World",
          "Space World",
        ],
        favouriteTemplates: [
          "Build a Dream",
          "Magic Creation",
          "New Friend",
          "Story Spark",
        ],
        favouriteFriends: ["Coral"],
        preferredEmotions: [
          "joy",
          "wonder",
          "creativity",
          "playfulness",
        ],
      },

      missions: {
        favouriteIndoorActivities: [
          "Pretend Play",
          "Story Creation",
          "Building Challenge",
          "Costume Adventure",
        ],
        favouriteOutdoorActivities: [
          "Cloud Imagination",
          "Nature Art",
          "Shadow Story",
          "Outdoor Building",
        ],
        favouriteCreativeActivities: [
          "Drawing",
          "Crafting",
          "Painting",
          "Storytelling",
          "Model Building",
        ],
        favouriteAdventureActivities: [
          "Create a New World",
          "Build a Magical Object",
          "Invent a Character",
          "Family Story Quest",
        ],
      },

      rewards: {
        favouriteRewardType: "Imagination Crystal",
        celebrationAnimation: "Rainbow Dream Bloom",
        celebrationSound: "Crystal Story Chime",
      },
    },

    progression: {
      growth: {
        flowerMultiplier: 1.35,
        fruitMultiplier: 1.1,
        birdMultiplier: 0.9,
        butterflyMultiplier: 1.5,
      },

      milestones: {
        seed: 0,
        sprout: 5,
        youngTree: 18,
        growingTree: 52,
        bloomingTree: 100,
        greatTree: 220,
        legacyTree: 460,
      },

      unlocks: {
        villageDecorations: true,
        coralAccessories: true,
        newBiome: true,
        newMusic: true,
        seasonalEvents: true,
      },

      evolution: {
        treeEvolutionEnabled: true,
        coralEvolutionEnabled: true,
        villageEvolutionEnabled: true,
      },
    },

    future: {
      avatarStyle: "Dreamlight Creator",
      companionPet: "Tiny Rainbow Ray",
      badgeStyle: "Imagination Crystal Emblem",
      collectibleStyle: "Story Sparks and Colour Crystals",
      seasonalTheme: "Festival of Imagination",
      homeDecorationStyle: "Creative Dream Cottage",
      bookIllustrationStyle: "Whimsical Painted Storybook",
      merchandiseTheme: "Dream Builder Collection",
    },
  },

  {
    meta: {
      id: "kind-heart",
      name: "Kind Heart Family",
      title: "Kind Hearts",
      description:
        "A family whose shared adventures are shaped by kindness, gratitude, empathy and care for one another.",
      icon: "💖",
    },

    identity: {
      primaryTraits: ["Kindness", "Gratitude"],
      secondaryTraits: ["Resilience", "Imagination"],
      familyMotto: "Kindness helps every wonderful thing bloom.",
      signatureColor: "#E8B9C8",
      signatureSymbol: "💖",
    },

    world: {
      biome: "Bloom Garden",
      village: "Kindness Cove",
      home: "Heartblossom Cottage",
      tree: {
        profile: "blossom",
        trunkStyle: "Warm Cherrywood",
        branchStyle: "Welcoming Embrace Branches",
        leafStyle: "Soft Heart Leaves",
        flowerStyle: "Kindness Blossom",
        fruitStyle: "Gratitude Berry",
        rootStyle: "Connected Family Roots",
      },
      palette: {
        primary: "#E8B9C8",
        secondary: "#F5DEE2",
        accent: "#BFDCCB",
      },
      sky: "Soft Rose Underwater Morning",
      weather: "Peaceful Spring Current",
      lighting: "Warm Heart Glow",
      ambience: "Flower petals, gentle bubbles and calming garden sounds",
      soundtrack: "Kindness Morning",
      particles: "Floating Petals and Heart Pearls",
      creatures: {
        birds: "Kindness Sparrows",
        butterflies: "Pink Pearl Butterflies",
        fish: "Heartfin Fish",
      },
    },

    coral: {
      style: "Kind Heart Coral",
      personality:
        "Gentle, caring, patient and attentive to how everyone feels.",
      energy: "low",
      speakingSpeed: "slow",
      voice: "Soft and reassuring",
      animation: "Slow comforting float",
      dialogueStyle: "Warm, thoughtful and emotionally supportive",
      greetings: [
        "I’m so happy to see you.",
        "Hello, kind hearts. Shall we make someone smile today?",
        "I was thinking about the wonderful moments we’ve shared.",
        "Your kindness makes Coral Village feel brighter.",
      ],
      celebrationStyle:
        "Celebrate care, sharing, listening and the warmth created together.",
      reflectionStyle:
        "Ask how an action made someone feel and what the family appreciated.",
      encouragementStyle:
        "Offer calm reassurance and recognise thoughtful effort.",
      goodbyeStyle:
        "End with gratitude and an invitation to carry kindness into the day.",
      favouriteWords: [
        "kind",
        "care",
        "share",
        "listen",
        "help",
        "thankful",
        "friend",
        "family",
        "together",
        "heart",
      ],
    },

    content: {
      stories: {
        favouriteWorlds: [
          "Coral World",
          "Jungle World",
          "Wonder Garden",
        ],
        favouriteTemplates: [
          "Helping a Friend",
          "New Friend",
          "A Kind Surprise",
          "Lost and Found",
        ],
        favouriteFriends: ["Coral"],
        preferredEmotions: [
          "kindness",
          "calm",
          "gratitude",
          "joy",
          "hope",
        ],
      },

      missions: {
        favouriteIndoorActivities: [
          "Create a Thank You Note",
          "Help a Family Member",
          "Share a Story",
          "Kindness Conversation",
        ],
        favouriteOutdoorActivities: [
          "Care for Nature",
          "Neighbourhood Kindness Walk",
          "Garden Helper Mission",
          "Gratitude Picnic",
        ],
        favouriteCreativeActivities: [
          "Kindness Card",
          "Family Gratitude Jar",
          "Friendship Drawing",
          "Create a Helpful Gift",
        ],
        favouriteAdventureActivities: [
          "Help a Wonder Friend",
          "Kindness Quest",
          "Family Helper Mission",
          "Gratitude Treasure Hunt",
        ],
      },

      rewards: {
        favouriteRewardType: "Heart Blossom",
        celebrationAnimation: "Kindness Flower Bloom",
        celebrationSound: "Warm Blossom Chime",
      },
    },

    progression: {
      growth: {
        flowerMultiplier: 1.6,
        fruitMultiplier: 1.35,
        birdMultiplier: 1.1,
        butterflyMultiplier: 1.2,
      },

      milestones: {
        seed: 0,
        sprout: 4,
        youngTree: 16,
        growingTree: 48,
        bloomingTree: 95,
        greatTree: 210,
        legacyTree: 450,
      },

      unlocks: {
        villageDecorations: true,
        coralAccessories: true,
        newBiome: true,
        newMusic: true,
        seasonalEvents: true,
      },

      evolution: {
        treeEvolutionEnabled: true,
        coralEvolutionEnabled: true,
        villageEvolutionEnabled: true,
      },
    },

    future: {
      avatarStyle: "Kindness Garden Friend",
      companionPet: "Tiny Heartfin Fish",
      badgeStyle: "Heart Blossom Emblem",
      collectibleStyle: "Kindness Petals and Gratitude Berries",
      seasonalTheme: "Festival of Kind Hearts",
      homeDecorationStyle: "Heartblossom Family Cottage",
      bookIllustrationStyle: "Warm Pastel Storybook",
      merchandiseTheme: "Kind Heart Collection",
    },
  },

  {
    meta: {
      id: "adventure",
      name: "Adventure Family",
      title: "Brave Adventurers",
      description:
        "A family that grows through courage, persistence and the joy of trying new experiences together.",
      icon: "⭐",
    },

    identity: {
      primaryTraits: ["Bravery", "Resilience"],
      secondaryTraits: ["Exploration", "Curiosity"],
      familyMotto: "We grow whenever we try something new together.",
      signatureColor: "#86B6A4",
      signatureSymbol: "⭐",
    },

    world: {
      biome: "Mountain Reef Valley",
      village: "Bravewater Outpost",
      home: "Startrail Treehouse",
      tree: {
        profile: "forest",
        trunkStyle: "Strong Ancient Wood",
        branchStyle: "High Adventure Branches",
        leafStyle: "Brave Forest Leaves",
        flowerStyle: "Courage Starflower",
        fruitStyle: "Resilience Berry",
        rootStyle: "Deep Strong Roots",
      },
      palette: {
        primary: "#86B6A4",
        secondary: "#C5DED3",
        accent: "#E7C56C",
      },
      sky: "Emerald-Gold Underwater Dawn",
      weather: "Fresh Valley Current",
      lighting: "Confident Morning Rays",
      ambience: "Moving leaves, distant waterfalls and lively reef sounds",
      soundtrack: "Bravewater Journey",
      particles: "Golden Trail Sparks and Drifting Leaves",
      creatures: {
        birds: "Startrail Owls",
        butterflies: "Golden Courage Butterflies",
        fish: "Bravefin Fish",
      },
    },

    coral: {
      style: "Adventure Coral",
      personality:
        "Confident, energetic and encouraging without ever creating pressure.",
      energy: "high",
      speakingSpeed: "fast",
      voice: "Bright and confident",
      animation: "Bold swimming arcs and happy jumps",
      dialogueStyle: "Energetic invitations focused on trying and continuing",
      greetings: [
        "Adventure is waiting!",
        "Ready to try something new together?",
        "Explorer, today’s quest might need a little courage.",
        "I’m glad you’re here. We make a wonderful adventure team!",
      ],
      celebrationStyle:
        "Celebrate persistence, courage and willingness to try rather than winning.",
      reflectionStyle:
        "Ask what felt challenging and what helped the family continue.",
      encouragementStyle:
        "Remind the family that bravery means trying even when something feels unfamiliar.",
      goodbyeStyle:
        "End with confidence that the family can return whenever they are ready.",
      favouriteWords: [
        "brave",
        "try",
        "journey",
        "quest",
        "challenge",
        "continue",
        "discover",
        "strong",
        "adventure",
        "together",
      ],
    },

    content: {
      stories: {
        favouriteWorlds: [
          "Coral World",
          "Jungle World",
          "Dinosaur World",
          "Space World",
        ],
        favouriteTemplates: [
          "Brave Journey",
          "Hidden Path",
          "Rescue Mission",
          "Mountain Mystery",
        ],
        favouriteFriends: ["Coral"],
        preferredEmotions: [
          "bravery",
          "excitement",
          "hope",
          "wonder",
          "confidence",
        ],
      },

      missions: {
        favouriteIndoorActivities: [
          "Build an Obstacle Course",
          "Try a New Creation",
          "Family Challenge",
          "Balance Mission",
        ],
        favouriteOutdoorActivities: [
          "Adventure Walk",
          "Movement Quest",
          "New Place Exploration",
          "Nature Challenge",
        ],
        favouriteCreativeActivities: [
          "Build Adventure Equipment",
          "Design a Courage Shield",
          "Create a Quest Map",
          "Invent a Brave Character",
        ],
        favouriteAdventureActivities: [
          "Family Quest",
          "Movement Challenge",
          "Brave Discovery",
          "Resilience Mission",
        ],
      },

      rewards: {
        favouriteRewardType: "Courage Star",
        celebrationAnimation: "Golden Star Trail",
        celebrationSound: "Brave Adventure Chime",
      },
    },

    progression: {
      growth: {
        flowerMultiplier: 0.85,
        fruitMultiplier: 1.2,
        birdMultiplier: 1.25,
        butterflyMultiplier: 0.8,
      },

      milestones: {
        seed: 0,
        sprout: 5,
        youngTree: 19,
        growingTree: 56,
        bloomingTree: 115,
        greatTree: 240,
        legacyTree: 490,
      },

      unlocks: {
        villageDecorations: true,
        coralAccessories: true,
        newBiome: true,
        newMusic: true,
        seasonalEvents: true,
      },

      evolution: {
        treeEvolutionEnabled: true,
        coralEvolutionEnabled: true,
        villageEvolutionEnabled: true,
      },
    },

    future: {
      avatarStyle: "Bravewater Adventurer",
      companionPet: "Tiny Startrail Turtle",
      badgeStyle: "Courage Star Emblem",
      collectibleStyle: "Quest Stars and Trail Stones",
      seasonalTheme: "Great Wonder Quest",
      homeDecorationStyle: "Adventure Treehouse",
      bookIllustrationStyle: "Cinematic Adventure Storybook",
      merchandiseTheme: "Brave Adventure Collection",
    },
  },
];

/**
 * Returns the default balanced Wonder Family archetype.
 */
export function getDefaultWonderArchetype(): WonderArchetype {
  const archetype = WONDER_ARCHETYPES.find(
    (item) => item.meta.id === DEFAULT_WONDER_ARCHETYPE_ID
  );

  if (!archetype) {
    throw new Error(
      `Default Wonder Archetype "${DEFAULT_WONDER_ARCHETYPE_ID}" was not found.`
    );
  }

  return archetype;
}

/**
 * Finds an archetype by its unique ID.
 */
export function getWonderArchetypeById(
  id: string
): WonderArchetype {
  const normalizedId = normalizeValue(id);

  return (
    WONDER_ARCHETYPES.find(
      (item) => normalizeValue(item.meta.id) === normalizedId
    ) ?? getDefaultWonderArchetype()
  );
}

/**
 * Finds an archetype by its public name.
 */
export function getWonderArchetypeByName(
  name: string
): WonderArchetype {
  const normalizedName = normalizeValue(name);

  return (
    WONDER_ARCHETYPES.find(
      (item) => normalizeValue(item.meta.name) === normalizedName
    ) ?? getDefaultWonderArchetype()
  );
}

/**
 * Selects the best archetype for the two strongest Wonder DNA traits.
 *
 * Exact primary-trait pairs are preferred. When no exact pair exists,
 * a weighted match is used. The balanced Wonder Family is returned
 * when no meaningful match can be found.
 */
export function getWonderArchetypeByTraits(
  primaryTrait: string,
  secondaryTrait: string
): WonderArchetype {
  const primary = normalizeValue(primaryTrait);
  const secondary = normalizeValue(secondaryTrait);

  if (!primary && !secondary) {
    return getDefaultWonderArchetype();
  }

  const exactMatch = WONDER_ARCHETYPES.find((archetype) => {
    if (archetype.meta.id === DEFAULT_WONDER_ARCHETYPE_ID) {
      return false;
    }

    const traits = archetype.identity.primaryTraits.map(normalizeValue);

    if (traits.length < 2) {
      return false;
    }

    const first = traits[0];
    const second = traits[1];

    return (
      (first === primary && second === secondary) ||
      (first === secondary && second === primary)
    );
  });

  if (exactMatch) {
    return exactMatch;
  }

  let bestMatch = getDefaultWonderArchetype();
  let bestScore = 0;

  for (const archetype of WONDER_ARCHETYPES) {
    if (archetype.meta.id === DEFAULT_WONDER_ARCHETYPE_ID) {
      continue;
    }

    const primaryTraits =
      archetype.identity.primaryTraits.map(normalizeValue);

    const secondaryTraits =
      archetype.identity.secondaryTraits.map(normalizeValue);

    let score = 0;

    if (primaryTraits[0] === primary) {
      score += 6;
    }

    if (primaryTraits.includes(primary)) {
      score += 4;
    }

    if (primaryTraits.includes(secondary)) {
      score += 3;
    }

    if (secondaryTraits.includes(primary)) {
      score += 2;
    }

    if (secondaryTraits.includes(secondary)) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = archetype;
    }
  }

  return bestMatch;
}

/**
 * Returns a new array so callers cannot accidentally replace
 * entries inside the exported master collection.
 */
export function getAllWonderArchetypes(): WonderArchetype[] {
  return [...WONDER_ARCHETYPES];
}

/**
 * Checks whether an archetype ID exists.
 */
export function isWonderArchetypeId(id: string): boolean {
  const normalizedId = normalizeValue(id);

  return WONDER_ARCHETYPES.some(
    (item) => normalizeValue(item.meta.id) === normalizedId
  );
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}