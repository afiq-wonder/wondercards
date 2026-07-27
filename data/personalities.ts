export interface PersonalityProfile {

    id: string;
  
    name: string;
  
    title: string;
  
    description: string;
  
    greeting: string;
  
    primaryTraits: string[];
  
    treeProfile: string;
  
    coralStyle: string;
  
    villageStyle: string;
  
    musicTheme: string;
  
  }
  
  export const PERSONALITIES: PersonalityProfile[] = [
  
    {
      id: "explorer",
  
      name: "Explorer Family",
  
      title: "Curious Explorers",
  
      description:
        "Your family loves discovering new places, asking questions and exploring together.",
  
      greeting:
        "I found something exciting today. Shall we discover it together?",
  
      primaryTraits: [
        "Curiosity",
        "Exploration"
      ],
  
      treeProfile: "ocean",
  
      coralStyle: "explorer",
  
      villageStyle: "coral-coast",
  
      musicTheme: "ocean-breeze"
    },
  
    {
      id: "dream-builder",
  
      name: "Dream Builder Family",
  
      title: "Creative Dreamers",
  
      description:
        "Your family enjoys imagining, building and creating magical ideas together.",
  
      greeting:
        "I have a wonderful idea we can build together today!",
  
      primaryTraits: [
        "Creativity",
        "Imagination"
      ],
  
      treeProfile: "sunset",
  
      coralStyle: "creative",
  
      villageStyle: "rainbow-meadow",
  
      musicTheme: "dreamy"
    },
  
    {
      id: "kind-heart",
  
      name: "Kind Heart Family",
  
      title: "Kind Hearts",
  
      description:
        "Your family's greatest strength is kindness, generosity and caring for others.",
  
      greeting:
        "I wonder whose day we'll brighten together today.",
  
      primaryTraits: [
        "Kindness",
        "Gratitude"
      ],
  
      treeProfile: "blossom",
  
      coralStyle: "gentle",
  
      villageStyle: "flower-garden",
  
      musicTheme: "morning-light"
    },
  
    {
      id: "adventure",
  
      name: "Adventure Family",
  
      title: "Fearless Explorers",
  
      description:
        "Your family loves trying new experiences with courage and confidence.",
  
      greeting:
        "Are you ready for another brave adventure?",
  
      primaryTraits: [
        "Bravery",
        "Resilience"
      ],
  
      treeProfile: "forest",
  
      coralStyle: "energetic",
  
      villageStyle: "mountain-valley",
  
      musicTheme: "adventure"
    },
  
    {
      id: "wonder",
  
      name: "Wonder Family",
  
      title: "Wonderful Together",
  
      description:
        "Your family is growing beautifully through every Wonder Moment you share.",
  
      greeting:
        "It's Wonder Time! Let's make another beautiful memory together.",
  
      primaryTraits: [],
  
      treeProfile: "wonder",
  
      coralStyle: "default",
  
      villageStyle: "coral-village",
  
      musicTheme: "wonder"
    }
  
  ];
  
  /**
   * --------------------------------------------------
   * Helpers
   * --------------------------------------------------
   */
  
  export function getPersonalityByName(
  
    name: string
  
  ): PersonalityProfile {
  
    return (
  
      PERSONALITIES.find(
  
        p => p.name === name
  
      ) ??
  
      PERSONALITIES.find(
  
        p => p.id === "wonder"
  
      )!
  
    );
  
  }
  
  export function getPersonalityByTraits(
  
    primary: string,
  
    secondary: string
  
  ): PersonalityProfile {
  
    const match = PERSONALITIES.find(profile => {
  
      if (profile.primaryTraits.length < 2) {
  
        return false;
  
      }
  
      return (
  
        profile.primaryTraits[0] === primary &&
  
        profile.primaryTraits[1] === secondary
  
      );
  
    });
  
    return (
  
      match ??
  
      PERSONALITIES.find(
  
        p => p.id === "wonder"
  
      )!
  
    );
  
  }