"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { FlowShell } from "./FlowShell";

export function WelcomeScreen() {
  const {
    card,
    beginAdventure,
    isBusy,
    error,
  } = useWonderCycle();

  return (
    <FlowShell
      eyebrow="✨ It’s Wonder Time!"
      title={`${card.emoji} ${card.title}`}
    >
      <p className="text-lg leading-8 text-slate-600">
        {card.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
          {card.duration}
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
          Ages {card.ageRange}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
          {card.activityType}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-7">
        <PrimaryButton
          onClick={() => void beginAdventure()}
          disabled={isBusy}
        >
          {isBusy
            ? "Starting Wonder Cycle..."
            : "Begin Adventure!"}
        </PrimaryButton>
      </div>
    </FlowShell>
  );
}
