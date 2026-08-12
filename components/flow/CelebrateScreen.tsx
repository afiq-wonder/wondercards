"use client";

import { useState } from "react";
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
    rateExperience,
    restartAdventure,
  } = useWonderCycle();

  const [rating, setRating] =
    useState<number | null>(null);

  const [isRating, setIsRating] =
    useState(false);

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

  const handleRating = async (
    value: number,
  ) => {
    if (rating !== null || isRating) {
      return;
    }

    setIsRating(true);

    try {
      await rateExperience(value);
      setRating(value);
    } finally {
      setIsRating(false);
    }
  };

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

      {/* WONDER PROOF RATING */}

      <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-center text-lg font-semibold text-slate-900">
          How did Wonder Time feel?
        </p>

        <p className="mt-1 text-center text-sm text-slate-500">
          Your feedback helps us make every
          adventure better.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <button
            type="button"
            disabled={
              rating !== null ||
              isRating
            }
            onClick={() =>
              void handleRating(2)
            }
            className={`rounded-2xl border p-3 text-center transition ${
              rating === 2
                ? "border-slate-500 bg-slate-100"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-3xl">
              😕
            </span>

            <span className="mt-2 block text-xs font-medium text-slate-600">
              Not really
            </span>
          </button>

          <button
            type="button"
            disabled={
              rating !== null ||
              isRating
            }
            onClick={() =>
              void handleRating(4)
            }
            className={`rounded-2xl border p-3 text-center transition ${
              rating === 4
                ? "border-sky-400 bg-sky-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-3xl">
              🙂
            </span>

            <span className="mt-2 block text-xs font-medium text-slate-600">
              It was fun
            </span>
          </button>

          <button
            type="button"
            disabled={
              rating !== null ||
              isRating
            }
            onClick={() =>
              void handleRating(5)
            }
            className={`rounded-2xl border p-3 text-center transition ${
              rating === 5
                ? "border-emerald-400 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-3xl">
              😍
            </span>

            <span className="mt-2 block text-xs font-medium text-slate-600">
              Loved it!
            </span>
          </button>
        </div>

        {rating !== null ? (
          <p className="mt-4 text-center text-sm font-medium text-emerald-700">
            ✨ Thank you! Your Wonder feedback
            was saved.
          </p>
        ) : null}
      </div>

      <div className="mt-7">
        <PrimaryButton
          onClick={restartAdventure}
        >
          Return Home
        </PrimaryButton>
      </div>
    </FlowShell>
  );
}