"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { FlowShell } from "./FlowShell";

export function StoryScreen() {
  const { card, cycle, goToStep } =
    useWonderCycle();

  if (!cycle) {
    return null;
  }

  const { genome } = cycle;

  return (
    <FlowShell
      eyebrow={`${genome.friend} • ${genome.world}`}
      title={`Welcome to ${genome.location}`}
    >
      <p className="text-lg leading-8 text-slate-700">
        {card.storyPrompt}
      </p>

      <div className="mt-5 rounded-2xl bg-sky-50 p-4 text-slate-700">
        <p>
          Today’s adventure feels{" "}
          <strong>{genome.emotion}</strong>.
        </p>
        <p className="mt-1">
          Wonder trait:{" "}
          <strong className="capitalize">
            {genome.value}
          </strong>
        </p>
      </div>

      <div className="mt-7">
        <PrimaryButton
          onClick={() => goToStep("pause")}
        >
          Continue the Adventure
        </PrimaryButton>
      </div>
    </FlowShell>
  );
}
