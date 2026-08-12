"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { FlowShell } from "./FlowShell";

export function WonderPauseScreen() {
  const { card, cycle, goToStep } =
    useWonderCycle();

  if (!cycle) {
    return null;
  }

  return (
    <FlowShell
      eyebrow="Wonder Pause"
      title="Look away from the screen"
    >
      <p className="text-lg leading-8 text-slate-700">
        Take one slow breath together.
      </p>

      <blockquote className="mt-5 rounded-2xl border-l-4 border-violet-300 bg-violet-50 p-5 text-xl font-medium leading-8 text-violet-950">
        {card.pauseQuestion}
      </blockquote>

      <p className="mt-4 text-sm text-slate-500">
        Listen with{" "}
        <strong>{cycle.genome.emotion}</strong>{" "}
        curiosity. There is no wrong answer.
      </p>

      <div className="mt-7">
        <PrimaryButton
          onClick={() => goToStep("mission")}
        >
          We Shared Our Answer
        </PrimaryButton>
      </div>
    </FlowShell>
  );
}
