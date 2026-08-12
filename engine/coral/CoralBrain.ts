// ============================================
// WonderCards
// Coral Brain
// Version: 1.1
// React-compatible external store
// ============================================

import type {
    CoralAttentionTarget,
    CoralBehaviourState,
    CoralEmotionState,
    CoralState,
  } from "@/types/coral";
  
  import {
    getNextAttention,
    INITIAL_ATTENTION,
  } from "./CoralAttention";
  
  import {
    getNextBehaviour,
    INITIAL_BEHAVIOUR,
  } from "./CoralBehaviour";
  
  import {
    getNextEmotion,
    INITIAL_EMOTION,
  } from "./CoralEmotion";
  
  /**
   * Semua event yang boleh diterima oleh CoralBrain.
   */
  export type CoralEvent =
    | { type: "JOURNEY_STARTED" }
    | { type: "PLAYER_MOVING" }
    | { type: "PLAYER_STOPPED" }
    | { type: "PLAYER_FOLLOWING" }
    | { type: "PLAYER_TAPPED_CORAL" }
    | { type: "ARRIVED_HOME" }
    | { type: "SHELF_SELECTED" }
    | { type: "OBJECT_READY" }
    | { type: "STORY_STARTED" }
    | { type: "STORY_FINISHED" }
    | { type: "MISSION_STARTED" }
    | { type: "MISSION_COMPLETED" }
    | { type: "MOMENT_SAVED" }
    | { type: "MEMORY_WALL_UPDATED" }
    | { type: "WONDER_TREE_REACHED" }
    | { type: "JOURNEY_COMPLETED" }
    | {
        type: "SET_ATTENTION";
        target: CoralAttentionTarget;
      }
    | {
        type: "SET_BEHAVIOUR";
        behaviour: CoralBehaviourState;
      }
    | {
        type: "SET_EMOTION";
        emotion: CoralEmotionState;
      }
    | { type: "RESET" };
  
  /**
   * Listener ringkas untuk React.
   *
   * React hanya perlu tahu bahawa state telah berubah.
   */
  export type CoralStoreListener = () => void;
  
  /**
   * Listener terperinci untuk animation, audio,
   * debugger dan sistem engine lain.
   */
  export type CoralEventListener = (
    nextState: Readonly<CoralState>,
    previousState: Readonly<CoralState>,
    event: CoralEvent,
  ) => void;
  
  export const initialCoralState: Readonly<CoralState> =
    Object.freeze({
      behaviour: INITIAL_BEHAVIOUR,
      emotion: INITIAL_EMOTION,
      attention: INITIAL_ATTENTION,
    });
  
  export class CoralBrain {
    /**
     * State disimpan sebagai immutable snapshot.
     *
     * Penting untuk useSyncExternalStore:
     * getSnapshot mesti memulangkan object yang sama
     * selagi state belum berubah.
     */
    private state: Readonly<CoralState>;
  
    /**
     * Subscribers daripada React.
     */
    private readonly storeListeners =
      new Set<CoralStoreListener>();
  
    /**
     * Subscribers daripada animation engine,
     * audio engine, debugger dan sistem lain.
     */
    private readonly eventListeners =
      new Set<CoralEventListener>();
  
    constructor(
      initialState: CoralState = {
        ...initialCoralState,
      },
    ) {
      this.state = Object.freeze({
        ...initialState,
      });
    }
  
    /**
     * React-compatible snapshot.
     *
     * Gunakan method ini bersama useSyncExternalStore.
     */
    public getSnapshot = (): Readonly<CoralState> => {
      return this.state;
    };
  
    /**
     * Server snapshot untuk Next.js SSR/hydration.
     */
    public getServerSnapshot = (): Readonly<CoralState> => {
      return initialCoralState;
    };
  
    /**
     * Alias untuk kod engine yang sudah menggunakan getState().
     */
    public getState = (): Readonly<CoralState> => {
      return this.state;
    };
  
    public current = (): Readonly<CoralState> => {
      return this.state;
    };
  
    /**
     * React subscription.
     *
     * Signature ini serasi dengan useSyncExternalStore.
     */
    public subscribe = (
      listener: CoralStoreListener,
    ): (() => void) => {
      this.storeListeners.add(listener);
  
      return () => {
        this.storeListeners.delete(listener);
      };
    };
  
    /**
     * Subscription terperinci untuk sistem bukan React.
     */
    public subscribeEvents = (
      listener: CoralEventListener,
    ): (() => void) => {
      this.eventListeners.add(listener);
  
      return () => {
        this.eventListeners.delete(listener);
      };
    };
  
    /**
     * Hantar event kepada CoralBrain.
     */
    public send = (
      event: CoralEvent,
    ): Readonly<CoralState> => {
      const previousState = this.state;
  
      const nextState =
        event.type === "RESET"
          ? initialCoralState
          : this.reduce(previousState, event);
  
      if (!this.hasChanged(previousState, nextState)) {
        return this.state;
      }
  
      this.state = Object.freeze({
        ...nextState,
      });
  
      this.notifyStoreListeners();
  
      this.notifyEventListeners(
        previousState,
        event,
      );
  
      return this.state;
    };
  
    public isBehaviour(
      behaviour: CoralBehaviourState,
    ): boolean {
      return this.state.behaviour === behaviour;
    }
  
    public isEmotion(
      emotion: CoralEmotionState,
    ): boolean {
      return this.state.emotion === emotion;
    }
  
    public isLookingAt(
      target: CoralAttentionTarget,
    ): boolean {
      return this.state.attention === target;
    }
  
    /**
     * Buang semua subscriptions.
     *
     * Gunakan hanya apabila instance CoralBrain
     * benar-benar tidak akan digunakan lagi.
     */
    public destroy(): void {
      this.storeListeners.clear();
      this.eventListeners.clear();
    }
  
    /**
     * Pure reducer:
     *
     * current state + event = next state
     */
    private reduce(
      currentState: Readonly<CoralState>,
      event: CoralEvent,
    ): CoralState {
      const behaviour =
        event.type === "SET_BEHAVIOUR"
          ? event.behaviour
          : getNextBehaviour(
              currentState.behaviour,
              event.type,
            );
  
      const emotion =
        event.type === "SET_EMOTION"
          ? event.emotion
          : getNextEmotion(
              currentState.emotion,
              event.type,
            );
  
      const attention = getNextAttention(
        currentState.attention,
        event,
      );
  
      return {
        behaviour,
        emotion,
        attention,
      };
    }
  
    private notifyStoreListeners(): void {
      this.storeListeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          console.error(
            "[CoralBrain] Store listener failed:",
            error,
          );
        }
      });
    }
  
    private notifyEventListeners(
      previousState: Readonly<CoralState>,
      event: CoralEvent,
    ): void {
      const nextState = this.state;
  
      this.eventListeners.forEach((listener) => {
        try {
          listener(
            nextState,
            previousState,
            event,
          );
        } catch (error) {
          console.error(
            "[CoralBrain] Event listener failed:",
            error,
          );
        }
      });
    }
  
    private hasChanged(
      previousState: Readonly<CoralState>,
      nextState: Readonly<CoralState>,
    ): boolean {
      return (
        previousState.behaviour !==
          nextState.behaviour ||
        previousState.emotion !==
          nextState.emotion ||
        previousState.attention !==
          nextState.attention
      );
    }
  }
  
  export function createCoralBrain(
    initialState?: CoralState,
  ): CoralBrain {
    return new CoralBrain(initialState);
  }