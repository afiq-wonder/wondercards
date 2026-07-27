export interface TreeProfile {

    id: string;
  
    name: string;
  
    palette: string;
  
    environment: string;
  
    sky: string;
  
    ground: string;
  
    lighting: string;
  
    music: string;
  
    trunkStyle: string;
  
    branchStyle: string;
  
    leafStyle: string;
  
    flowerStyle: string;
  
    fruitStyle: string;
  
    rootStyle: string;
  
    birdType: string;
  
    butterflyType: string;
  
    particleEffect: string;
  
    weather: string;
  
    coralHome: string;
  
  }
  
  export const TREE_PROFILES: TreeProfile[] = [
  
    {
  
      id: "wonder",
  
      name: "Wonder Tree",
  
      palette: "Wonder",
  
      environment: "Coral Village",
  
      sky: "Soft Morning",
  
      ground: "Green Meadow",
  
      lighting: "Golden",
  
      music: "Wonder Theme",
  
      trunkStyle: "Classic",
  
      branchStyle: "Round",
  
      leafStyle: "Emerald",
  
      flowerStyle: "White Blossom",
  
      fruitStyle: "Golden Apple",
  
      rootStyle: "Gentle",
  
      birdType: "Robin",
  
      butterflyType: "Blue Butterfly",
  
      particleEffect: "Sparkles",
  
      weather: "Sunny",
  
      coralHome: "Village"
  
    },
  
    {
  
      id: "ocean",
  
      name: "Ocean Tree",
  
      palette: "Ocean",
  
      environment: "Coral Coast",
  
      sky: "Sunrise",
  
      ground: "Coral Sand",
  
      lighting: "Blue Glow",
  
      music: "Ocean Breeze",
  
      trunkStyle: "Coral Wood",
  
      branchStyle: "Wave",
  
      leafStyle: "Sea Leaf",
  
      flowerStyle: "Blue Coral",
  
      fruitStyle: "Pearl",
  
      rootStyle: "Sea Root",
  
      birdType: "Seagull",
  
      butterflyType: "Bubble Fish",
  
      particleEffect: "Bubbles",
  
      weather: "Sea Breeze",
  
      coralHome: "Lighthouse"
  
    },
  
    {
  
      id: "forest",
  
      name: "Forest Tree",
  
      palette: "Forest",
  
      environment: "Wonder Forest",
  
      sky: "Morning Mist",
  
      ground: "Moss",
  
      lighting: "Soft Forest",
  
      music: "Forest Song",
  
      trunkStyle: "Oak",
  
      branchStyle: "Wide",
  
      leafStyle: "Forest Leaf",
  
      flowerStyle: "Wild Flower",
  
      fruitStyle: "Berry",
  
      rootStyle: "Ancient",
  
      birdType: "Owl",
  
      butterflyType: "Yellow Butterfly",
  
      particleEffect: "Leaves",
  
      weather: "Light Wind",
  
      coralHome: "Tree House"
  
    },
  
    {
  
      id: "sunset",
  
      name: "Dream Tree",
  
      palette: "Sunset",
  
      environment: "Rainbow Meadow",
  
      sky: "Pink Sunset",
  
      ground: "Soft Grass",
  
      lighting: "Warm Sunset",
  
      music: "Dream Waltz",
  
      trunkStyle: "Curved",
  
      branchStyle: "Elegant",
  
      leafStyle: "Rainbow Leaf",
  
      flowerStyle: "Magic Blossom",
  
      fruitStyle: "Crystal Fruit",
  
      rootStyle: "Dream Root",
  
      birdType: "Bluebird",
  
      butterflyType: "Rainbow Butterfly",
  
      particleEffect: "Magic Dust",
  
      weather: "Golden Wind",
  
      coralHome: "Dream Cottage"
  
    },
  
    {
  
      id: "blossom",
  
      name: "Blossom Tree",
  
      palette: "Blossom",
  
      environment: "Flower Garden",
  
      sky: "Spring Sky",
  
      ground: "Flower Field",
  
      lighting: "Soft Pink",
  
      music: "Spring Melody",
  
      trunkStyle: "Cherry",
  
      branchStyle: "Elegant",
  
      leafStyle: "Soft Green",
  
      flowerStyle: "Cherry Blossom",
  
      fruitStyle: "Pink Berry",
  
      rootStyle: "Peaceful",
  
      birdType: "Sparrow",
  
      butterflyType: "Pink Butterfly",
  
      particleEffect: "Flower Petals",
  
      weather: "Spring Breeze",
  
      coralHome: "Garden Cottage"
  
    }
  
  ];
  
  /**
   * -------------------------------------------------------
   * Helpers
   * -------------------------------------------------------
   */
  
  export function getTreeProfile(
  
    id: string
  
  ): TreeProfile {
  
    return (
  
      TREE_PROFILES.find(
  
        profile => profile.id === id
  
      ) ??
  
      TREE_PROFILES[0]
  
    );
  
  }