// hooks/useCoralBrain.ts

"use client";

import { useSyncExternalStore } from "react";

import {
  createCoralBrain,
  type CoralEvent,
} from "@/engine/coral";

const coralBrain = createCoralBrain();

export function useCoralBrain() {
  const state = useSyncExternalStore(
    coralBrain.subscribe,
    coralBrain.getSnapshot,
    coralBrain.getServerSnapshot,
  );

  const send = (event: CoralEvent) => {
    coralBrain.send(event);
  };

  return {
    state,
    send,
    brain: coralBrain,
  };
}