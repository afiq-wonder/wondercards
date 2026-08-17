"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";

export function WonderPauseScreen() {
  const { card, cycle, goToStep } = useWonderCycle();

  if (!cycle) {
    return null;
  }

  return (
    <section className="relative mx-auto min-h-[72vh] w-full max-w-md overflow-hidden rounded-[2.25rem] border border-white/60 bg-gradient-to-b from-indigo-950 via-slate-950 to-cyan-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/30">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-20 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-200/10 blur-3xl" />
        <span className="absolute left-[18%] top-[28%] h-2 w-2 animate-pulse rounded-full border border-cyan-100/35" />
        <span className="absolute right-[20%] top-[48%] h-3 w-3 animate-pulse rounded-full border border-white/25 [animation-delay:900ms]" />
      </div>

      <div className="relative flex min-h-[64vh] flex-col">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/65">
            Wonder Pause
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl backdrop-blur-sm">
            ✨
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            The screen has done its part.
          </h1>

          <p className="mt-4 max-w-xs text-lg leading-8 text-sky-50/80">
            Put the iPad down. Look at each other. Take one slow breath together.
          </p>

          <div className="my-8 h-px w-20 bg-gradient-to-r from-transparent via-cyan-100/50 to-transparent" />

          <blockquote className="max-w-sm text-2xl font-medium leading-9 text-white">
            “{card.pauseQuestion}”
          </blockquote>

          <p className="mt-6 max-w-xs text-sm leading-6 text-cyan-100/60">
            Listen with <strong className="font-semibold text-cyan-50">{cycle.genome.emotion}</strong> curiosity. There is no wrong answer.
          </p>

          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-white/35">
            Come back when the moment feels complete
          </p>
        </div>

        <div className="pb-1">
          <PrimaryButton onClick={() => goToStep("mission")}>
            We’re Ready
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
