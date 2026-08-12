"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { FlowShell } from "./FlowShell";

function titleCase(value: string): string {
  return value
    .split(" ")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function CelebrateScreen() {
  const {
    completion,
    restartAdventure,
  } = useWonderCycle();

  if (!completion) {
    return null;
  }

  const {
    growthEvent,
    dna,
    cycle,
  } = completion;

  const levelUp =
    growthEvent.currentLevel >
    growthEvent.previousLevel;

  return (
    <FlowShell
      eyebrow="Wonder Cycle Complete"
      title="🎉 Your WonderDNA evolved!"
    >
      <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-sky-50 p-5">
        <p className="text-sm text-slate-500">
          Today’s growth
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {titleCase(growthEvent.trait)} +
          {growthEvent.xpAwarded} XP
        </p>

        <p className="mt-2 text-slate-700">
          Level {growthEvent.currentLevel}
          {levelUp ? " unlocked!" : ""}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Adventures
          </dt>
          <dd className="mt-1 text-2xl font-bold">
            {dna.adventureCount}
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Wonder Moments
          </dt>
          <dd className="mt-1 text-2xl font-bold">
            {dna.wonderMoments}
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-center text-lg text-slate-700">
        {cycle.genome.friend} is proud of your
        family.
      </p>

      <div className="mt-7">
        <PrimaryButton onClick={restartAdventure}>
          Return Home
        </PrimaryButton>
      </div>
    </FlowShell>
  );
}
