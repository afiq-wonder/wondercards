// ============================================
// WonderCards
// Coral Memory
// Version: 1.0
// ============================================

import type {
    CoralAttentionTarget,
    CoralBehaviourState,
    CoralEmotionState,
  } from "@/types/coral";
  
  export interface CoralInteractionMemory {
    type: string;
    occurredAt: Date;
  }
  
  export interface CoralMemoryState {
    lastInteraction?: CoralInteractionMemory;
  
    lastBehaviour?: CoralBehaviourState;
  
    lastEmotion?: CoralEmotionState;
  
    lastAttention?: CoralAttentionTarget;
  
    lastVisitedLocationId?: string;
  
    lastAdventureId?: string;
  
    lastWonderMomentId?: string;
  
    timesVisitedHome: number;
  
    completedJourneyCount: number;
  
    firstMetAt?: Date;
  
    lastSeenAt?: Date;
  }
  
  export interface CoralMemorySnapshot {
    lastInteraction?: {
      type: string;
      occurredAt: string;
    };
  
    lastBehaviour?: CoralBehaviourState;
  
    lastEmotion?: CoralEmotionState;
  
    lastAttention?: CoralAttentionTarget;
  
    lastVisitedLocationId?: string;
  
    lastAdventureId?: string;
  
    lastWonderMomentId?: string;
  
    timesVisitedHome: number;
  
    completedJourneyCount: number;
  
    firstMetAt?: string;
  
    lastSeenAt?: string;
  }
  
  export const initialCoralMemory: CoralMemoryState = {
    timesVisitedHome: 0,
    completedJourneyCount: 0,
  };
  
  export class CoralMemory {
    private state: CoralMemoryState;
  
    constructor(initialState: CoralMemoryState = initialCoralMemory) {
      this.state = {
        ...initialCoralMemory,
        ...initialState,
      };
    }
  
    public getState(): Readonly<CoralMemoryState> {
      return {
        ...this.state,
  
        lastInteraction: this.state.lastInteraction
          ? {
              ...this.state.lastInteraction,
              occurredAt: new Date(
                this.state.lastInteraction.occurredAt,
              ),
            }
          : undefined,
      };
    }
  
    public rememberInteraction(type: string): void {
      const now = new Date();
  
      this.state = {
        ...this.state,
  
        lastInteraction: {
          type,
          occurredAt: now,
        },
  
        firstMetAt: this.state.firstMetAt ?? now,
  
        lastSeenAt: now,
      };
    }
  
    public rememberCoralState(input: {
      behaviour: CoralBehaviourState;
      emotion: CoralEmotionState;
      attention: CoralAttentionTarget;
    }): void {
      this.state = {
        ...this.state,
  
        lastBehaviour: input.behaviour,
  
        lastEmotion: input.emotion,
  
        lastAttention: input.attention,
  
        lastSeenAt: new Date(),
      };
    }
  
    public visitLocation(locationId: string): void {
      const isHome = locationId === "CORAL_HOME";
  
      this.state = {
        ...this.state,
  
        lastVisitedLocationId: locationId,
  
        timesVisitedHome:
          this.state.timesVisitedHome + (isHome ? 1 : 0),
  
        lastSeenAt: new Date(),
      };
    }
  
    public selectAdventure(adventureId: string): void {
      this.state = {
        ...this.state,
  
        lastAdventureId: adventureId,
  
        lastSeenAt: new Date(),
      };
    }
  
    public saveWonderMoment(momentId: string): void {
      this.state = {
        ...this.state,
  
        lastWonderMomentId: momentId,
  
        lastSeenAt: new Date(),
      };
    }
  
    public completeJourney(): void {
      this.state = {
        ...this.state,
  
        completedJourneyCount:
          this.state.completedJourneyCount + 1,
  
        lastSeenAt: new Date(),
      };
    }
  
    public hasVisited(locationId: string): boolean {
      return this.state.lastVisitedLocationId === locationId;
    }
  
    public hasCompletedJourney(): boolean {
      return this.state.completedJourneyCount > 0;
    }
  
    public reset(): void {
      this.state = {
        ...initialCoralMemory,
      };
    }
  
    /**
     * Converts Date objects into JSON-safe strings.
     * Suitable for localStorage or a future database adapter.
     */
    public toSnapshot(): CoralMemorySnapshot {
      return {
        lastInteraction: this.state.lastInteraction
          ? {
              type: this.state.lastInteraction.type,
              occurredAt:
                this.state.lastInteraction.occurredAt.toISOString(),
            }
          : undefined,
  
        lastBehaviour: this.state.lastBehaviour,
  
        lastEmotion: this.state.lastEmotion,
  
        lastAttention: this.state.lastAttention,
  
        lastVisitedLocationId:
          this.state.lastVisitedLocationId,
  
        lastAdventureId: this.state.lastAdventureId,
  
        lastWonderMomentId:
          this.state.lastWonderMomentId,
  
        timesVisitedHome: this.state.timesVisitedHome,
  
        completedJourneyCount:
          this.state.completedJourneyCount,
  
        firstMetAt:
          this.state.firstMetAt?.toISOString(),
  
        lastSeenAt:
          this.state.lastSeenAt?.toISOString(),
      };
    }
  
    /**
     * Restores domain state from a JSON-safe snapshot.
     */
    public static fromSnapshot(
      snapshot: CoralMemorySnapshot,
    ): CoralMemory {
      return new CoralMemory({
        lastInteraction: snapshot.lastInteraction
          ? {
              type: snapshot.lastInteraction.type,
              occurredAt: new Date(
                snapshot.lastInteraction.occurredAt,
              ),
            }
          : undefined,
  
        lastBehaviour: snapshot.lastBehaviour,
  
        lastEmotion: snapshot.lastEmotion,
  
        lastAttention: snapshot.lastAttention,
  
        lastVisitedLocationId:
          snapshot.lastVisitedLocationId,
  
        lastAdventureId: snapshot.lastAdventureId,
  
        lastWonderMomentId:
          snapshot.lastWonderMomentId,
  
        timesVisitedHome:
          snapshot.timesVisitedHome ?? 0,
  
        completedJourneyCount:
          snapshot.completedJourneyCount ?? 0,
  
        firstMetAt: snapshot.firstMetAt
          ? new Date(snapshot.firstMetAt)
          : undefined,
  
        lastSeenAt: snapshot.lastSeenAt
          ? new Date(snapshot.lastSeenAt)
          : undefined,
      });
    }
  }
  
  export function createCoralMemory(
    initialState?: CoralMemoryState,
  ): CoralMemory {
    return new CoralMemory(initialState);
  }