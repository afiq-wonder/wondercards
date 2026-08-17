"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";

export function StoryScreen() {
  const { card, cycle, goToStep } = useWonderCycle();

  if (!cycle) {
    return null;
  }

  const { genome } = cycle;

  return (
    <section className="relative mx-auto min-h-[72vh] w-full max-w-md overflow-hidden rounded-[2.25rem] border border-white/60 bg-gradient-to-b from-cyan-950 via-sky-900 to-teal-950 px-6 py-8 text-white shadow-2xl shadow-sky-950/25">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-16 top-16 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -right-20 bottom-12 h-56 w-56 rounded-full bg-violet-300/10 blur-3xl" />

        <span className="absolute left-[12%] top-[72%] h-2 w-2 animate-pulse rounded-full border border-white/45" />
        <span className="absolute left-[24%] top-[42%] h-3 w-3 animate-pulse rounded-full border border-cyan-100/45 [animation-delay:700ms]" />
        <span className="absolute right-[16%] top-[56%] h-2.5 w-2.5 animate-pulse rounded-full border border-white/40 [animation-delay:1200ms]" />
        <span className="absolute right-[28%] top-[24%] h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-100/50 [animation-delay:400ms]" />
      </div>

      <div className="relative flex min-h-[64vh] flex-col">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
          <span>{genome.world}</span>
          <span>{genome.location}</span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10 text-center">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-100/20 bg-white/10 text-3xl shadow-[0_0_40px_rgba(103,232,249,0.16)] backdrop-blur-sm">
            {card.emoji}
          </div>

          <p className="text-sm font-medium tracking-wide text-cyan-100/75">
            {genome.friend} found something...
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Something is moving beneath the reef.
          </h1>

          <div className="mx-auto my-7 h-px w-16 bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" />

          <p className="mx-auto max-w-sm text-lg leading-8 text-sky-50/90">
            {card.storyPrompt}
          </p>

          <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-cyan-50/75 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-200" />
            <span>
              Feel it with {genome.emotion} curiosity · {genome.value}
            </span>
          </div>
        </div>

        <div className="pb-1">
          <p className="mb-4 text-center text-xs leading-5 text-cyan-100/60">
            No pages to turn. Stay with the story.
          </p>
          <PrimaryButton onClick={() => goToStep("pause")}>
            Follow the Bubbles
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
