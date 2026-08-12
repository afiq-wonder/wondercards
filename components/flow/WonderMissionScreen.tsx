"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { FlowShell } from "./FlowShell";

export function WonderMissionScreen() {
  const { card, cycle, goToStep } =
    useWonderCycle();

  if (!cycle) {
    return null;
  }

  return (
    <FlowShell
      eyebrow={`${cycle.genome.friend}'s Wonder Mission`}
      title="Create something together"
    >
      <p className="text-lg leading-8 text-slate-700">
        {card.offlineMission}
      </p>

      <div className="mt-5 rounded-2xl bg-amber-50 p-4">
        <p className="font-semibold text-amber-950">
          Supplies
        </p>
        <ul className="mt-2 list-inside list-disc text-amber-900">
          {card.supplies.map((supply) => (
            <li key={supply}>{supply}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Today’s mission grows{" "}
        <strong className="capitalize">
          {cycle.genome.value}
        </strong>
        .
      </p>

      <div className="mt-7">
        <PrimaryButton
          onClick={() => goToStep("moment")}
        >
          Mission Complete
        </PrimaryButton>
      </div>
    </FlowShell>
  );
}
