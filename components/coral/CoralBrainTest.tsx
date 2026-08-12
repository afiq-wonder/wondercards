"use client";

import { useCoralBrain } from "@/hooks/useCoralBrain";

export default function CoralBrainTest() {
  const { state, send } = useCoralBrain();

  return (
    <div className="space-y-4 p-6">
      <div>
        <p>Behaviour: {state.behaviour}</p>
        <p>Emotion: {state.emotion}</p>
        <p>Attention: {state.attention}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            send({ type: "JOURNEY_STARTED" })
          }
        >
          Start Journey
        </button>

        <button
          onClick={() =>
            send({ type: "PLAYER_MOVING" })
          }
        >
          Player Moving
        </button>

        <button
          onClick={() =>
            send({ type: "PLAYER_STOPPED" })
          }
        >
          Player Stopped
        </button>

        <button
          onClick={() =>
            send({ type: "SHELF_SELECTED" })
          }
        >
          Select Shelf
        </button>

        <button
          onClick={() =>
            send({ type: "STORY_STARTED" })
          }
        >
          Start Story
        </button>

        <button
          onClick={() =>
            send({ type: "MISSION_COMPLETED" })
          }
        >
          Complete Mission
        </button>

        <button
          onClick={() =>
            send({ type: "RESET" })
          }
        >
          Reset
        </button>
      </div>
    </div>
  );
}