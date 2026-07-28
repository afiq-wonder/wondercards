export interface WonderMemoryCounters {
    values: Record<string, number>;
  
    friends: Record<string, number>;
  
    worlds: Record<string, number>;
  
    templates: Record<string, number>;
  
    emotions: Record<string, number>;
  }
  
  export interface WonderMemoryAdventure {
    id: string;
  
    sessionId: string | null;
  
    cardId: string;
  
    genomeId: string;
  
    valueId: string;
  
    valueName: string;
  
    friendId: string;
  
    friendName: string;
  
    worldId: string;
  
    worldName: string;
  
    templateId: string;
  
    templateName: string;
  
    emotion: string;
  
    location: string;
  
    wonderScore: number;
  
    completedAt: Date;
  }
  
  export interface WonderMemoryProfile {
    id: string;
  
    version: number;
  
    familyId: string;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    completedAdventures: number;
  
    totalWonderScore: number;
  
    counters: WonderMemoryCounters;
  
    recentAdventures: WonderMemoryAdventure[];
  }
  
  export interface WonderMemoryRanking {
    id: string;
  
    count: number;
  }
  
  export interface WonderMemorySummary {
    familyId: string;
  
    completedAdventures: number;
  
    totalWonderScore: number;
  
    averageWonderScore: number;
  
    topValue: WonderMemoryRanking | null;
  
    topFriend: WonderMemoryRanking | null;
  
    topWorld: WonderMemoryRanking | null;
  
    topTemplate: WonderMemoryRanking | null;
  
    topEmotion: WonderMemoryRanking | null;
  
    recentAdventureCount: number;
  
    createdAt: Date;
  
    updatedAt: Date;
  }
  
  export interface WonderMemoryPreferences {
    preferredValueIds: string[];
  
    preferredFriendIds: string[];
  
    preferredWorldIds: string[];
  
    preferredTemplateIds: string[];
  
    preferredEmotions: string[];
  }
  
  export interface RecordWonderAdventureOptions {
    familyId: string;
  
    sessionId?: string | null;
  
    wonderScore?: number;
  
    completedAt?: Date;
  
    save?: boolean;
  }
  
  export interface WonderMemoryProgressContainer {
    memory?: WonderMemoryProfile;
  
    [key: string]: unknown;
  }