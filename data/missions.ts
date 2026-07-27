import type { WonderMission } from "@/types/wonderMission";

export type WonderMissionActivityType =
  | "create"
  | "draw"
  | "build"
  | "observe"
  | "search"
  | "move"
  | "help"
  | "imagine"
  | "talk"
  | "collect";

export type WonderMissionEnvironment =
  | "indoor"
  | "outdoor"
  | "either";

export type WonderMissionDifficulty =
  | "easy"
  | "medium"
  | "hard";

export interface WonderMissionContent
  extends WonderMission {
  valueIds: string[];

  worldIds: string[];

  templateIds: string[];

  activityType: WonderMissionActivityType;

  environment: WonderMissionEnvironment;

  difficulty: WonderMissionDifficulty;

  ageRange: {
    min: number;
    max: number;
  };

  estimatedMinutes: number;

  supplies: string[];

  requiresAdult: boolean;
}

export interface WonderMissionFilter {
  valueId?: string;

  worldId?: string;

  templateId?: string;

  activityType?: WonderMissionActivityType;

  environment?: WonderMissionEnvironment;

  difficulty?: WonderMissionDifficulty;

  age?: number;
}

export interface WonderMissionRenderContext {
  friend: string;

  world: string;

  location: string;

  value: string;
}

export const DEFAULT_WONDER_MISSION_ID =
  "mission-colour-discovery";

export const wonderMissions: WonderMissionContent[] = [
  // =========================================================
  // CURIOSITY
  // =========================================================

  {
    id: "mission-colour-discovery",

    title: "Colour Discovery Hunt",

    objective:
      "Notice colours, compare them and discover something new together.",

    activity:
      "Explore your home or outdoor space and find five objects with different colours. Place them together, name each colour and let everyone choose their favourite.",

    successMessage:
      "Wonderful discovering! Your family noticed colours that may have been hiding in plain sight.",

    valueIds: ["curiosity"],

    worldIds: [],

    templateIds: [
      "tiny-mystery",
      "wonder-discovery",
      "secret-trail",
    ],

    activityType: "search",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 8,

    supplies: [],

    requiresAdult: true,
  },

  {
    id: "mission-sound-safari",

    title: "Sound Safari",

    objective:
      "Listen carefully and discover the different sounds around you.",

    activity:
      "Stay quiet together for one minute. Count every sound you hear. Afterwards, take turns describing the loudest, softest, nearest and farthest sounds.",

    successMessage:
      "Amazing listening! Your family discovered a whole world of sounds together.",

    valueIds: ["curiosity"],

    worldIds: [
      "forest-world",
      "jungle-world",
      "coral-world",
      "wonder-garden",
    ],

    templateIds: [
      "tiny-mystery",
      "hidden-path",
      "wonder-discovery",
    ],

    activityType: "observe",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 7,

    supplies: [],

    requiresAdult: true,
  },

  {
    id: "mission-mystery-object",

    title: "Mystery Object Investigation",

    objective:
      "Use questions and observations to identify a mystery object.",

    activity:
      "An adult secretly chooses a safe household object and places it inside a bag. Everyone may touch the object without looking and ask questions before making a guess.",

    successMessage:
      "Mystery solved! Every question helped your family get closer to the answer.",

    valueIds: ["curiosity", "confidence"],

    worldIds: [],

    templateIds: [
      "tiny-mystery",
      "hidden-treasure",
      "wonder-discovery",
    ],

    activityType: "observe",

    environment: "indoor",

    difficulty: "medium",

    ageRange: {
      min: 5,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [
      "A bag",
      "One safe household object",
    ],

    requiresAdult: true,
  },

  // =========================================================
  // KINDNESS
  // =========================================================

  {
    id: "mission-kindness-card",

    title: "Create a Kindness Card",

    objective:
      "Create a small message that helps someone feel appreciated.",

    activity:
      "Choose someone your family cares about. Fold a piece of paper, draw something cheerful and write or say one kind message for an adult to help record.",

    successMessage:
      "Your kind message created a wonderful moment for someone special.",

    valueIds: [
      "kindness",
      "gratitude",
      "empathy",
    ],

    worldIds: [],

    templateIds: [
      "kind-surprise",
      "helping-a-friend",
      "new-friend",
    ],

    activityType: "create",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 12,

    supplies: [
      "Paper",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-secret-helper",

    title: "Secret Family Helper",

    objective:
      "Practise kindness by completing a helpful action without being asked.",

    activity:
      "Choose one safe way to help at home. You might arrange books, place toys in their basket or help prepare the table. Complete the action together as a surprise.",

    successMessage:
      "Wonderful teamwork! Your helpful action made your family space feel happier.",

    valueIds: [
      "kindness",
      "responsibility",
      "teamwork",
    ],

    worldIds: [],

    templateIds: [
      "helping-a-friend",
      "kind-surprise",
      "family-quest",
    ],

    activityType: "help",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [],

    requiresAdult: true,
  },

  {
    id: "mission-welcome-a-friend",

    title: "Welcome a New Friend",

    objective:
      "Think of gentle ways to help someone feel included.",

    activity:
      "Pretend that {{friend}} has just arrived at your home. Take turns showing how you would say hello, invite {{friend}} to play and ask what activity they might enjoy.",

    successMessage:
      "Your warm welcome showed how small actions can help a new friend feel safe and included.",

    valueIds: [
      "kindness",
      "empathy",
      "confidence",
    ],

    worldIds: [],

    templateIds: [
      "new-friend",
      "helping-a-friend",
      "kind-surprise",
    ],

    activityType: "imagine",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 8,

    supplies: [],

    requiresAdult: true,
  },

  // =========================================================
  // BRAVERY AND CONFIDENCE
  // =========================================================

  {
    id: "mission-courage-shield",

    title: "Design a Courage Shield",

    objective:
      "Create a reminder of the strengths that help your family try new things.",

    activity:
      "Draw a large shield on paper. Divide it into sections and fill each section with a picture or word representing something that helps you feel brave.",

    successMessage:
      "Your Courage Shield is a reminder that bravery can grow one small step at a time.",

    valueIds: [
      "bravery",
      "confidence",
      "creativity",
    ],

    worldIds: [
      "dinosaur-world",
      "forest-world",
      "sky-world",
    ],

    templateIds: [
      "brave-journey",
      "family-quest",
      "hidden-path",
    ],

    activityType: "draw",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "Paper",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-brave-new-move",

    title: "Try a Brave New Move",

    objective:
      "Build confidence by trying a safe movement that feels new.",

    activity:
      "Create three safe movements such as a slow balance, a gentle jump or an animal walk. Let every family member choose one movement to try, with encouragement from the others.",

    successMessage:
      "You tried something new together. That is what growing bravery looks like.",

    valueIds: [
      "bravery",
      "confidence",
      "perseverance",
    ],

    worldIds: [
      "jungle-world",
      "dinosaur-world",
      "forest-world",
      "sky-world",
    ],

    templateIds: [
      "brave-journey",
      "family-quest",
      "wonder-discovery",
    ],

    activityType: "move",

    environment: "either",

    difficulty: "medium",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [],

    requiresAdult: true,
  },

  {
    id: "mission-confidence-message",

    title: "My Strong Voice",

    objective:
      "Practise speaking with confidence in a safe family space.",

    activity:
      "Stand like a confident explorer and take turns completing this sentence: “I am learning to...” Everyone responds with one encouraging sentence.",

    successMessage:
      "Every confident voice deserves to be heard. Your family encouraged one another beautifully.",

    valueIds: [
      "confidence",
      "bravery",
      "empathy",
    ],

    worldIds: [],

    templateIds: [
      "brave-journey",
      "new-friend",
      "family-quest",
    ],

    activityType: "talk",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 5,
      max: 8,
    },

    estimatedMinutes: 7,

    supplies: [],

    requiresAdult: true,
  },

  // =========================================================
  // GRATITUDE AND EMPATHY
  // =========================================================

  {
    id: "mission-gratitude-treasure",

    title: "Gratitude Treasure Hunt",

    objective:
      "Discover ordinary things that make family life feel special.",

    activity:
      "Find three things around your home or outdoor space that your family appreciates. For each one, explain why it feels useful, comforting or wonderful.",

    successMessage:
      "The greatest treasures are often the small things we notice and appreciate together.",

    valueIds: [
      "gratitude",
      "curiosity",
      "kindness",
    ],

    worldIds: [],

    templateIds: [
      "hidden-treasure",
      "wonder-discovery",
      "family-quest",
    ],

    activityType: "search",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [],

    requiresAdult: true,
  },

  {
    id: "mission-gratitude-jar",

    title: "Start a Gratitude Jar",

    objective:
      "Create a place to save thankful family moments.",

    activity:
      "Decorate a clean container. Each family member draws or writes one thing they feel thankful for, then places it inside. Add another note whenever you create a new Wonder Moment.",

    successMessage:
      "Your Gratitude Jar is ready to collect wonderful family memories.",

    valueIds: [
      "gratitude",
      "creativity",
      "kindness",
    ],

    worldIds: [
      "wonder-garden",
      "dream-world",
      "coral-world",
    ],

    templateIds: [
      "kind-surprise",
      "build-a-dream",
      "wonder-discovery",
    ],

    activityType: "create",

    environment: "indoor",

    difficulty: "medium",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "A clean container",
      "Small pieces of paper",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-feeling-detective",

    title: "Feeling Detective",

    objective:
      "Practise recognising emotions through faces, voices and body language.",

    activity:
      "Take turns silently acting out a gentle emotion such as happy, worried, excited, calm or shy. The others guess the emotion and suggest one caring response.",

    successMessage:
      "Excellent empathy! Your family noticed feelings and responded with care.",

    valueIds: [
      "empathy",
      "kindness",
      "confidence",
    ],

    worldIds: [],

    templateIds: [
      "helping-a-friend",
      "new-friend",
      "tiny-mystery",
    ],

    activityType: "imagine",

    environment: "either",

    difficulty: "medium",

    ageRange: {
      min: 5,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [],

    requiresAdult: true,
  },

  // =========================================================
  // CREATIVITY
  // =========================================================

  {
    id: "mission-build-new-world",

    title: "Build a New Wonder World",

    objective:
      "Use imagination and simple materials to create a brand-new world.",

    activity:
      "Use paper, blocks, boxes or safe household objects to build a small version of {{world}}. Add a home for {{friend}} and one surprising place to explore.",

    successMessage:
      "Your imagination transformed simple materials into an entirely new world.",

    valueIds: [
      "creativity",
      "teamwork",
      "curiosity",
    ],

    worldIds: [],

    templateIds: [
      "build-a-dream",
      "magic-creation",
      "story-spark",
    ],

    activityType: "build",

    environment: "indoor",

    difficulty: "medium",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 20,

    supplies: [
      "Paper or cardboard",
      "Building blocks or safe household objects",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-invent-creature",

    title: "Invent a Wonder Creature",

    objective:
      "Combine different ideas to create an original friendly creature.",

    activity:
      "Draw a creature that could live in {{location}}. Give it a name, choose how it moves and decide what special skill it uses to help others.",

    successMessage:
      "A brand-new Wonder Creature now lives in your family’s imagination.",

    valueIds: [
      "creativity",
      "kindness",
      "curiosity",
    ],

    worldIds: [
      "dream-world",
      "space-world",
      "dinosaur-world",
      "jungle-world",
    ],

    templateIds: [
      "magic-creation",
      "story-spark",
      "new-friend",
    ],

    activityType: "draw",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 12,

    supplies: [
      "Paper",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-story-circle",

    title: "Family Story Circle",

    objective:
      "Build one shared story by listening and adding ideas together.",

    activity:
      "Begin with: “One day, {{friend}} found something surprising in {{location}}.” Each person adds one sentence until the story reaches a hopeful ending.",

    successMessage:
      "Every idea became part of one wonderful family story.",

    valueIds: [
      "creativity",
      "teamwork",
      "confidence",
    ],

    worldIds: [],

    templateIds: [
      "story-spark",
      "tiny-mystery",
      "family-quest",
    ],

    activityType: "talk",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [],

    requiresAdult: true,
  },

  // =========================================================
  // TEAMWORK
  // =========================================================

  {
    id: "mission-family-tower",

    title: "Build a Teamwork Tower",

    objective:
      "Plan, build and improve something as one family team.",

    activity:
      "Use blocks, paper cups or small boxes to build the tallest stable tower you can. Everyone must contribute at least one idea and place at least one piece.",

    successMessage:
      "Your tower grew because everyone contributed something important.",

    valueIds: [
      "teamwork",
      "creativity",
      "perseverance",
    ],

    worldIds: [
      "space-world",
      "dream-world",
      "sky-world",
    ],

    templateIds: [
      "build-a-dream",
      "family-quest",
      "magic-creation",
    ],

    activityType: "build",

    environment: "indoor",

    difficulty: "medium",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "Building blocks, paper cups or small boxes",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-guide-the-explorer",

    title: "Guide the Explorer",

    objective:
      "Practise giving clear directions and listening carefully.",

    activity:
      "Create a safe path using cushions or paper markers. One person becomes the Explorer while another gives simple directions to guide them through the path. Keep eyes open and move slowly.",

    successMessage:
      "Clear directions and careful listening helped your exploration team succeed.",

    valueIds: [
      "teamwork",
      "responsibility",
      "confidence",
    ],

    worldIds: [
      "forest-world",
      "jungle-world",
      "dinosaur-world",
      "sky-world",
    ],

    templateIds: [
      "secret-trail",
      "hidden-path",
      "family-quest",
    ],

    activityType: "move",

    environment: "indoor",

    difficulty: "medium",

    ageRange: {
      min: 5,
      max: 8,
    },

    estimatedMinutes: 12,

    supplies: [
      "Cushions or paper markers",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-family-puzzle-picture",

    title: "One Family Picture",

    objective:
      "Combine different creative contributions into one shared artwork.",

    activity:
      "Divide a large piece of paper into sections. Each person decorates one section without hiding the others. At the end, connect every section into one shared picture.",

    successMessage:
      "Every section was different, but together they created one complete family artwork.",

    valueIds: [
      "teamwork",
      "creativity",
      "empathy",
    ],

    worldIds: [
      "dream-world",
      "wonder-garden",
      "coral-world",
    ],

    templateIds: [
      "magic-creation",
      "build-a-dream",
      "kind-surprise",
    ],

    activityType: "draw",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "Large paper",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  // =========================================================
  // RESPONSIBILITY
  // =========================================================

  {
    id: "mission-care-for-nature",

    title: "Care for Our World",

    objective:
      "Complete one small action that helps care for the environment.",

    activity:
      "Choose a safe family action such as watering a plant, sorting recyclable items or collecting safe litter with an adult. Talk about how the action helps living things.",

    successMessage:
      "Your responsible action helped make the world a little healthier.",

    valueIds: [
      "responsibility",
      "kindness",
      "teamwork",
    ],

    worldIds: [
      "forest-world",
      "jungle-world",
      "wonder-garden",
      "coral-world",
    ],

    templateIds: [
      "rescue-mission",
      "helping-a-friend",
      "wonder-discovery",
    ],

    activityType: "help",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 12,

    supplies: [],

    requiresAdult: true,
  },

  {
    id: "mission-home-for-toys",

    title: "Find Every Toy a Home",

    objective:
      "Create a simple organisation system and care for shared belongings.",

    activity:
      "Choose one small group of toys or books. Sort them into categories and decide where each category belongs. Add simple picture labels if helpful.",

    successMessage:
      "Every item found a safe home because your family made a responsible plan.",

    valueIds: [
      "responsibility",
      "teamwork",
      "creativity",
    ],

    worldIds: [],

    templateIds: [
      "lost-and-found",
      "helping-a-friend",
      "family-quest",
    ],

    activityType: "help",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 12,

    supplies: [
      "Optional paper labels",
      "Optional crayons or pencils",
    ],

    requiresAdult: true,
  },

  // =========================================================
  // PERSEVERANCE
  // =========================================================

  {
    id: "mission-paper-bridge",

    title: "Build a Paper Bridge",

    objective:
      "Test ideas, learn from each attempt and improve a simple structure.",

    activity:
      "Place two books a short distance apart. Use one or more sheets of paper to build a bridge between them. Test whether it can hold a small lightweight toy, then improve the design.",

    successMessage:
      "Every attempt taught your family something new. That is perseverance in action.",

    valueIds: [
      "perseverance",
      "creativity",
      "teamwork",
    ],

    worldIds: [
      "forest-world",
      "jungle-world",
      "dinosaur-world",
      "space-world",
    ],

    templateIds: [
      "brave-journey",
      "family-quest",
      "build-a-dream",
    ],

    activityType: "build",

    environment: "indoor",

    difficulty: "hard",

    ageRange: {
      min: 6,
      max: 8,
    },

    estimatedMinutes: 20,

    supplies: [
      "Paper",
      "Two books",
      "One small lightweight toy",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-keep-going-drawing",

    title: "The Changing Drawing",

    objective:
      "Practise adapting when the first idea does not work as expected.",

    activity:
      "Begin a drawing together. After one minute, gently rotate the paper and let another person add something new. Continue until everyone has contributed.",

    successMessage:
      "Your family kept going and transformed every unexpected change into a new idea.",

    valueIds: [
      "perseverance",
      "creativity",
      "teamwork",
    ],

    worldIds: [
      "dream-world",
      "wonder-garden",
      "sky-world",
    ],

    templateIds: [
      "story-spark",
      "magic-creation",
      "build-a-dream",
    ],

    activityType: "draw",

    environment: "indoor",

    difficulty: "medium",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 12,

    supplies: [
      "Paper",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-balance-trail",

    title: "Balance Trail Challenge",

    objective:
      "Practise a safe movement more than once and notice improvement.",

    activity:
      "Create a straight trail using tape, string or paper markers. Walk slowly along the trail with arms stretched out. Try again while carrying a lightweight soft object.",

    successMessage:
      "Practice helped your balance grow stronger with every careful attempt.",

    valueIds: [
      "perseverance",
      "confidence",
      "bravery",
    ],

    worldIds: [
      "sky-world",
      "forest-world",
      "dinosaur-world",
    ],

    templateIds: [
      "brave-journey",
      "hidden-path",
      "family-quest",
    ],

    activityType: "move",

    environment: "indoor",

    difficulty: "medium",

    ageRange: {
      min: 5,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [
      "Tape, string or paper markers",
      "One lightweight soft object",
    ],

    requiresAdult: true,
  },

  // =========================================================
  // WORLD-SPECIFIC MISSIONS
  // =========================================================

  {
    id: "mission-coral-reef-art",

    title: "Create a Coral Reef",

    objective:
      "Continue the underwater adventure by creating a colourful reef together.",

    activity:
      "Draw or build a coral reef using paper and safe craft materials. Add at least three sea creatures, give each one a name and describe how they help the reef.",

    successMessage:
      "Your family created a colourful underwater home filled with helpful new friends.",

    valueIds: [
      "creativity",
      "kindness",
      "responsibility",
    ],

    worldIds: ["coral-world"],

    templateIds: [
      "magic-creation",
      "new-friend",
      "wonder-discovery",
    ],

    activityType: "create",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "Paper",
      "Crayons or pencils",
      "Optional safe craft materials",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-space-constellation",

    title: "Create a Family Constellation",

    objective:
      "Turn family strengths into a new constellation.",

    activity:
      "Draw several stars on dark paper. Give each star the name of a family member or family strength. Connect the stars and invent a story about your constellation.",

    successMessage:
      "Your family strengths now shine together as one unique constellation.",

    valueIds: [
      "gratitude",
      "creativity",
      "confidence",
    ],

    worldIds: ["space-world"],

    templateIds: [
      "story-spark",
      "magic-creation",
      "wonder-discovery",
    ],

    activityType: "draw",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "Dark paper",
      "Crayons, pencils or stickers",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-dinosaur-footprints",

    title: "Follow the Dinosaur Trail",

    objective:
      "Observe clues and follow a playful trail together.",

    activity:
      "An adult creates a short trail of paper dinosaur footprints. Follow the trail, stopping at each footprint to complete a simple movement or answer a curious question.",

    successMessage:
      "Your family followed every clue and completed the dinosaur trail together.",

    valueIds: [
      "curiosity",
      "bravery",
      "teamwork",
    ],

    worldIds: ["dinosaur-world"],

    templateIds: [
      "secret-trail",
      "hidden-path",
      "family-quest",
    ],

    activityType: "search",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 12,

    supplies: [
      "Paper dinosaur footprints",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-jungle-texture-hunt",

    title: "Jungle Texture Hunt",

    objective:
      "Explore and compare different safe textures.",

    activity:
      "Find objects with five different textures such as smooth, rough, soft, bumpy and fuzzy. Describe each texture and imagine where it might appear in {{world}}.",

    successMessage:
      "Your family discovered a jungle of textures using careful hands and curious minds.",

    valueIds: [
      "curiosity",
      "creativity",
      "responsibility",
    ],

    worldIds: [
      "jungle-world",
      "forest-world",
    ],

    templateIds: [
      "wonder-discovery",
      "secret-trail",
      "tiny-mystery",
    ],

    activityType: "collect",

    environment: "either",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 10,

    supplies: [],

    requiresAdult: true,
  },

  {
    id: "mission-dream-cloud",

    title: "Design a Dream Cloud",

    objective:
      "Create a picture filled with hopeful family ideas.",

    activity:
      "Draw a large cloud and fill it with pictures of places your family would love to explore, things you would like to create and kind actions you hope to complete.",

    successMessage:
      "Your Dream Cloud is filled with hopeful ideas waiting to grow.",

    valueIds: [
      "creativity",
      "gratitude",
      "confidence",
    ],

    worldIds: [
      "dream-world",
      "sky-world",
    ],

    templateIds: [
      "build-a-dream",
      "story-spark",
      "magic-creation",
    ],

    activityType: "draw",

    environment: "indoor",

    difficulty: "easy",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "Paper",
      "Crayons or pencils",
    ],

    requiresAdult: true,
  },

  {
    id: "mission-wonder-garden",

    title: "Grow a Wonder Garden",

    objective:
      "Create or care for something that can grow over time.",

    activity:
      "Plant a safe seed with an adult or care for an existing plant. Give it a name, notice what it needs and decide how your family will remember to care for it.",

    successMessage:
      "Your family began a growing Wonder Moment that can continue every day.",

    valueIds: [
      "responsibility",
      "kindness",
      "gratitude",
    ],

    worldIds: ["wonder-garden"],

    templateIds: [
      "helping-a-friend",
      "build-a-dream",
      "wonder-discovery",
    ],

    activityType: "help",

    environment: "either",

    difficulty: "medium",

    ageRange: {
      min: 4,
      max: 8,
    },

    estimatedMinutes: 15,

    supplies: [
      "A safe seed or existing plant",
      "Soil and container when planting",
      "Water",
    ],

    requiresAdult: true,
  },
];

// =========================================================
// QUERIES
// =========================================================

export function getDefaultWonderMission(): WonderMissionContent {
  const mission = wonderMissions.find(
    (item) =>
      item.id === DEFAULT_WONDER_MISSION_ID
  );

  if (!mission) {
    throw new Error(
      `Default Wonder Mission "${DEFAULT_WONDER_MISSION_ID}" was not found.`
    );
  }

  return cloneMissionContent(mission);
}

export function getWonderMissionById(
  id: string
): WonderMissionContent {
  const normalisedId = normaliseValue(id);

  const mission = wonderMissions.find(
    (item) =>
      normaliseValue(item.id) ===
      normalisedId
  );

  return mission
    ? cloneMissionContent(mission)
    : getDefaultWonderMission();
}

export function getWonderMissionsByActivityType(
  activityType: WonderMissionActivityType
): WonderMissionContent[] {
  return wonderMissions
    .filter(
      (mission) =>
        mission.activityType === activityType
    )
    .map(cloneMissionContent);
}

export function getWonderMissionsByValue(
  valueId: string
): WonderMissionContent[] {
  const normalisedValueId =
    normaliseValue(valueId);

  return wonderMissions
    .filter((mission) =>
      mission.valueIds.some(
        (id) =>
          normaliseValue(id) ===
          normalisedValueId
      )
    )
    .map(cloneMissionContent);
}

export function getCompatibleWonderMissions(
  filter: WonderMissionFilter
): WonderMissionContent[] {
  const ageCompatible = wonderMissions.filter(
    (mission) =>
      matchesAge(mission, filter.age)
  );

  const candidates =
    ageCompatible.length > 0
      ? ageCompatible
      : wonderMissions;

  return candidates
    .map((mission) => ({
      mission,
      score: calculateMissionScore(
        mission,
        filter
      ),
    }))
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return first.mission.id.localeCompare(
        second.mission.id
      );
    })
    .map(({ mission }) =>
      cloneMissionContent(mission)
    );
}

export function renderWonderMission(
  mission: WonderMissionContent,
  context: WonderMissionRenderContext
): WonderMission {
  return {
    id: mission.id,

    title: replaceMissionTokens(
      mission.title,
      context
    ),

    objective: replaceMissionTokens(
      mission.objective,
      context
    ),

    activity: replaceMissionTokens(
      mission.activity,
      context
    ),

    successMessage: replaceMissionTokens(
      mission.successMessage,
      context
    ),
  };
}

export function getAllWonderMissions(): WonderMissionContent[] {
  return wonderMissions.map(
    cloneMissionContent
  );
}

// =========================================================
// SCORING
// =========================================================

function calculateMissionScore(
  mission: WonderMissionContent,
  filter: WonderMissionFilter
): number {
  let score = 0;

  score += scoreListMatch(
    mission.valueIds,
    filter.valueId,
    12,
    1
  );

  score += scoreListMatch(
    mission.templateIds,
    filter.templateId,
    7,
    1
  );

  score += scoreListMatch(
    mission.worldIds,
    filter.worldId,
    5,
    1
  );

  if (
    filter.activityType &&
    mission.activityType === filter.activityType
  ) {
    score += 4;
  }

  if (
    filter.difficulty &&
    mission.difficulty === filter.difficulty
  ) {
    score += 3;
  }

  if (
    filter.environment &&
    (
      mission.environment === filter.environment ||
      mission.environment === "either"
    )
  ) {
    score += 2;
  }

  if (
    filter.age !== undefined &&
    matchesAge(mission, filter.age)
  ) {
    score += 4;
  }

  return score;
}

function scoreListMatch(
  values: readonly string[],
  selectedValue: string | undefined,
  matchingScore: number,
  universalScore: number
): number {
  if (!selectedValue) {
    return 0;
  }

  if (values.length === 0) {
    return universalScore;
  }

  const normalisedSelectedValue =
    normaliseValue(selectedValue);

  return values.some(
    (value) =>
      normaliseValue(value) ===
      normalisedSelectedValue
  )
    ? matchingScore
    : 0;
}

// =========================================================
// RENDERING
// =========================================================

function replaceMissionTokens(
  text: string,
  context: WonderMissionRenderContext
): string {
  return text
    .replaceAll(
      "{{friend}}",
      context.friend
    )
    .replaceAll(
      "{{world}}",
      context.world
    )
    .replaceAll(
      "{{location}}",
      context.location
    )
    .replaceAll(
      "{{value}}",
      context.value
    )
    .trim();
}

// =========================================================
// INTERNAL HELPERS
// =========================================================

function matchesAge(
  mission: WonderMissionContent,
  age?: number
): boolean {
  if (age === undefined) {
    return true;
  }

  if (!Number.isFinite(age)) {
    return true;
  }

  return (
    age >= mission.ageRange.min &&
    age <= mission.ageRange.max
  );
}

function cloneMissionContent(
  mission: WonderMissionContent
): WonderMissionContent {
  return {
    ...mission,

    valueIds: [...mission.valueIds],

    worldIds: [...mission.worldIds],

    templateIds: [...mission.templateIds],

    ageRange: {
      ...mission.ageRange,
    },

    supplies: [...mission.supplies],
  };
}

function normaliseValue(
  value: string
): string {
  return value.trim().toLowerCase();
}

export default wonderMissions;