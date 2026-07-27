export interface CoralStyle {
    id: string;
  
    name: string;
  
    personality: string;
  
    energy: "low" | "medium" | "high";
  
    speakingSpeed: "slow" | "normal" | "fast";
  
    emoji: string;
  
    greetingPrefix: string;
  
    celebrationPrefix: string;
  
    reflectionPrefix: string;
  
    goodbyePrefix: string;
  
    favouriteWords: string[];
  
    sentenceStyle:
      | "gentle"
      | "playful"
      | "excited";
  
    animationStyle: string;
  
    voiceStyle: string;
  }
  
  export const CORAL_STYLES: CoralStyle[] = [
    {
      id: "default",
  
      name: "Classic Coral",
  
      personality: "Wonder Family",
  
      energy: "medium",
  
      speakingSpeed: "normal",
  
      emoji: "🐠",
  
      greetingPrefix:
        "Hello, my wonderful friends!",
  
      celebrationPrefix:
        "That was wonderful!",
  
      reflectionPrefix:
        "Let's remember this together.",
  
      goodbyePrefix:
        "See you on our next adventure!",
  
      favouriteWords: [
        "wonder",
        "together",
        "explore",
        "friend",
        "beautiful",
      ],
  
      sentenceStyle: "gentle",
  
      animationStyle: "gentle-float",
  
      voiceStyle: "warm",
    },
  
    {
      id: "explorer",
  
      name: "Explorer Coral",
  
      personality: "Explorer Family",
  
      energy: "high",
  
      speakingSpeed: "fast",
  
      emoji: "🧭",
  
      greetingPrefix:
        "Guess what I discovered today?",
  
      celebrationPrefix:
        "Amazing discovery!",
  
      reflectionPrefix:
        "What do you think we discovered?",
  
      goodbyePrefix:
        "Let's keep exploring!",
  
      favouriteWords: [
        "discover",
        "explore",
        "mystery",
        "adventure",
        "question",
      ],
  
      sentenceStyle: "excited",
  
      animationStyle: "swim-fast",
  
      voiceStyle: "energetic",
    },
  
    {
      id: "creative",
  
      name: "Dream Builder Coral",
  
      personality:
        "Dream Builder Family",
  
      energy: "medium",
  
      speakingSpeed: "normal",
  
      emoji: "🎨",
  
      greetingPrefix:
        "I have a magical idea!",
  
      celebrationPrefix:
        "Look what we created!",
  
      reflectionPrefix:
        "What else could we imagine?",
  
      goodbyePrefix:
        "Let's dream again soon!",
  
      favouriteWords: [
        "create",
        "imagine",
        "colour",
        "magic",
        "story",
      ],
  
      sentenceStyle: "playful",
  
      animationStyle: "spin",
  
      voiceStyle: "dreamy",
    },
  
    {
      id: "gentle",
  
      name: "Kind Heart Coral",
  
      personality:
        "Kind Heart Family",
  
      energy: "low",
  
      speakingSpeed: "slow",
  
      emoji: "💖",
  
      greetingPrefix:
        "I'm so happy to see you.",
  
      celebrationPrefix:
        "That was so kind.",
  
      reflectionPrefix:
        "How did that make you feel?",
  
      goodbyePrefix:
        "Keep spreading kindness.",
  
      favouriteWords: [
        "kind",
        "share",
        "love",
        "friend",
        "care",
      ],
  
      sentenceStyle: "gentle",
  
      animationStyle: "slow-float",
  
      voiceStyle: "soft",
    },
  
    {
      id: "energetic",
  
      name: "Adventure Coral",
  
      personality: "Adventure Family",
  
      energy: "high",
  
      speakingSpeed: "fast",
  
      emoji: "⭐",
  
      greetingPrefix:
        "Adventure is waiting!",
  
      celebrationPrefix:
        "We did it!",
  
      reflectionPrefix:
        "That took courage!",
  
      goodbyePrefix:
        "See you on the next quest!",
  
      favouriteWords: [
        "brave",
        "challenge",
        "journey",
        "quest",
        "together",
      ],
  
      sentenceStyle: "excited",
  
      animationStyle: "jump",
  
      voiceStyle: "confident",
    },
  ];
  
  /**
   * Returns a Coral style by ID.
   *
   * Falls back safely to the default style.
   */
  export function getCoralStyle(
    id: string
  ): CoralStyle {
    const normalisedId =
      normaliseValue(id);
  
    return (
      CORAL_STYLES.find(
        (style) =>
          normaliseValue(
            style.id
          ) === normalisedId
      ) ??
      getDefaultCoralStyle()
    );
  }
  
  /**
   * Returns a Coral style by personality.
   *
   * Falls back safely to the default style.
   */
  export function getCoralStyleByPersonality(
    personality: string
  ): CoralStyle {
    const normalisedPersonality =
      normaliseValue(personality);
  
    return (
      CORAL_STYLES.find(
        (style) =>
          normaliseValue(
            style.personality
          ) ===
          normalisedPersonality
      ) ??
      getDefaultCoralStyle()
    );
  }
  
  /**
   * Returns a defensive copy of all styles.
   */
  export function getAllCoralStyles(): CoralStyle[] {
    return CORAL_STYLES.map(
      cloneCoralStyle
    );
  }
  
  /**
   * Checks whether a style ID exists.
   */
  export function isCoralStyleId(
    id: string
  ): boolean {
    const normalisedId =
      normaliseValue(id);
  
    return CORAL_STYLES.some(
      (style) =>
        normaliseValue(
          style.id
        ) === normalisedId
    );
  }
  
  function getDefaultCoralStyle(): CoralStyle {
    const defaultStyle =
      CORAL_STYLES.find(
        (style) =>
          style.id === "default"
      );
  
    if (!defaultStyle) {
      throw new Error(
        'Default Coral style "default" was not found.'
      );
    }
  
    return defaultStyle;
  }
  
  function cloneCoralStyle(
    style: CoralStyle
  ): CoralStyle {
    return {
      ...style,
  
      favouriteWords: [
        ...style.favouriteWords,
      ],
    };
  }
  
  function normaliseValue(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase();
  }
  
  export default CORAL_STYLES;