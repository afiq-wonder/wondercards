"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { FlowShell } from "./FlowShell";

export function WonderMomentScreen() {
  const {
    card,
    markMissionCompleted,
    completeAdventure,
    isBusy,
    error,
  } = useWonderCycle();

  const [reflection, setReflection] =
    useState("");

  const [
    missionCompleted,
    setMissionCompleted,
  ] = useState<boolean | null>(null);

  const canSave =
    missionCompleted !== null &&
    reflection.trim().length >= 3 &&
    !isBusy;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    if (missionCompleted === true) {
      await markMissionCompleted();
    }

    await completeAdventure(reflection);
  };

  return (
    <FlowShell
      eyebrow="Wonder Moment"
      title="Save today’s memory"
    >
      <div className="mb-7">
        <p className="text-lg font-medium text-slate-800">
          Did you complete your Wonder Mission?
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Tell us if your family made it into the
          real-world activity.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setMissionCompleted(true)
            }
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              missionCompleted === true
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            🎉 We did!
          </button>

          <button
            type="button"
            onClick={() =>
              setMissionCompleted(false)
            }
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              missionCompleted === false
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            ⏳ Not yet
          </button>
        </div>
      </div>

      <label
        htmlFor="wonder-reflection"
        className="block text-lg font-medium text-slate-800"
      >
        {card.reflectionPrompt ??
          "What was your favourite moment?"}
      </label>

      <textarea
        id="wonder-reflection"
        value={reflection}
        onChange={(event) =>
          setReflection(event.target.value)
        }
        rows={5}
        maxLength={500}
        placeholder="We laughed when..."
        className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />

      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>
          Write one simple family memory.
        </span>
        <span>{reflection.length}/500</span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-7">
        <PrimaryButton
          onClick={() => void handleSave()}
          disabled={!canSave}
        >
          {isBusy
            ? "Saving Wonder Moment..."
            : "Save Our Wonder Moment"}
        </PrimaryButton>
      </div>
    </FlowShell>
  );
}