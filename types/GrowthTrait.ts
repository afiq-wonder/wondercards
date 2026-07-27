export interface GrowthMilestone {

    id: string;
  
    title: string;
  
    description: string;
  
    achievedAt: string;
  
  }
  
  export interface GrowthTrait {
  
    /**
     * Trait identifier
     * curiosity
     * creativity
     * kindness
     */
  
    id: string;
  
    /**
     * Display name
     */
  
    name: string;
  
    /**
     * Current level
     */
  
    level: number;
  
    /**
     * Current XP inside current level
     */
  
    xp: number;
  
    /**
     * XP required to reach next level
     */
  
    nextLevelXp: number;
  
    /**
     * Total accumulated XP
     */
  
    totalXp: number;
  
    /**
     * Recent growth
     */
  
    lastGrowth: string | null;
  
    /**
     * Important memories
     */
  
    memories: string[];
  
    /**
     * Growth milestones
     */
  
    milestones: GrowthMilestone[];
  
  }