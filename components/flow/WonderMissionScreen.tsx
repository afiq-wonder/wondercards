"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";

export function WonderMissionScreen() {
  const { card, cycle, goToStep } = useWonderCycle();

  if (!cycle) {
    return null;
  }

  return (
    <section className="relative mx-auto min-h-[78vh] w-full max-w-md overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-cyan-950 via-sky-950 to-slate-950 px-6 py-8 text-white shadow-2xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-16 top-12 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-20 bottom-24 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full border border-cyan-200/35" />
        <div className="absolute right-[18%] top-[29%] h-3 w-3 rounded-full border border-sky-200/25" />
      </div>

      <div className="relative flex min-h-[68vh] flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
          {cycle.genome.friend}&apos;s Wonder Mission
        </p>

        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
          The adventure leaves the screen now.
        </h1>

        <p className="mt-4 text-base leading-7 text-cyan-50/75">
          Coral World will stay right here. Your next part happens together in the real world.
        </p>

        <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Your mission
          </p>
          <p className="mt-3 text-xl font-semibold leading-8">
            {card.offlineMission}
          </p>
        </div>

        {card.supplies.length > 0 ? (
          <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-semibold text-cyan-100">Gather these first</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.supplies.map((supply) => (
                <span key={supply} className="rounded-full border border-cyan-100/15 bg-cyan-50/10 px-3 py-2 text-sm text-cyan-50">
                  {supply}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl bg-amber-200/10 p-4 ring-1 ring-amber-100/10">
          <p className="text-sm leading-6 text-amber-50/85">
            ✨ This mission grows <strong className="capitalize text-white">{cycle.genome.value}</strong>. There is no perfect result—the Wonder is doing it together.
          </p>
        </div>

        <div className="mt-auto pt-8 text-center">
          <p className="text-lg font-semibold">Put the iPad somewhere safe.</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-cyan-50/65">
            Come back only when your mission is finished. We&apos;ll save what you remember next.
          </p>

          <div className="mt-6">
            <PrimaryButton onClick={() => goToStep("moment")}>
              We Finished Our Mission
            </PrimaryButton>
          </div>

          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-cyan-100/35">
            Wonder Time continues away from the screen
          </p>
        </div>
      </div>
    </section>
  );
}
