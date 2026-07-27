import { wonderMemoryEngine } from "@/engine/memory/WonderMemoryEngine";

export interface WonderRelationship {

  friendshipLevel: number;

  adventureCount: number;

  streak: number;

  favouriteEmotion: string | null;

  title: string;

  encouragement: string;

}

export class WonderRelationshipEngine {

  getRelationship(): WonderRelationship {

    const friendshipLevel =
      wonderMemoryEngine.getFriendshipLevel();

    const adventureCount =
      wonderMemoryEngine.getAdventureCount();

    const streak =
      wonderMemoryEngine.getCurrentStreak();

    const favouriteEmotion =
      wonderMemoryEngine.getFavouriteEmotion();

    return {

      friendshipLevel,

      adventureCount,

      streak,

      favouriteEmotion,

      title: this.getFriendshipTitle(friendshipLevel),

      encouragement: this.getEncouragement(friendshipLevel)

    };

  }

  private getFriendshipTitle(

    level: number

  ): string {

    if (level >= 10) return "Wonder Legend";

    if (level >= 9) return "Lifelong Friend";

    if (level >= 8) return "Master Explorer";

    if (level >= 7) return "Trusted Explorer";

    if (level >= 6) return "Adventure Buddy";

    if (level >= 5) return "Brave Explorer";

    if (level >= 4) return "Curious Friend";

    if (level >= 3) return "Growing Explorer";

    if (level >= 2) return "Little Explorer";

    if (level >= 1) return "New Friend";

    return "New Visitor";

  }

  private getEncouragement(

    level: number

  ): string {

    if (level >= 10)

      return "Thank you for creating so many wonderful memories with Coral.";

    if (level >= 8)

      return "Every adventure makes our friendship even stronger.";

    if (level >= 6)

      return "Coral always looks forward to exploring with you.";

    if (level >= 4)

      return "You're becoming a wonderful explorer.";

    if (level >= 2)

      return "Coral is excited for your next adventure.";

    return "Let's create our very first Wonder Moment together.";

  }

  isBestFriend(): boolean {

    return wonderMemoryEngine.getFriendshipLevel() >= 10;

  }

  hasStartedJourney(): boolean {

    return wonderMemoryEngine.getAdventureCount() > 0;

  }

}

export const wonderRelationshipEngine =
  new WonderRelationshipEngine();