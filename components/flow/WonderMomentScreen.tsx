"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { FlowShell } from "./FlowShell";

export function WonderMomentScreen() {
  const {
    card,
    completeAdventure,
    isBusy,
    error,
  } = useWonderCycle();

  const [reflection, setReflection] =
    useState("");

  const canSave =
    reflection.trim().length >= 3 && !isBusy;

  return (
    <FlowShell
      eyebrow="Wonder Moment"
      title="Save today’s memory"
    >
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
        <span>Write one simple family memory.</span>
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
          onClick={() =>
            void completeAdventure(reflection)
          }
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
