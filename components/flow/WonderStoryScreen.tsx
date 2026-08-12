"use client";

import type { ReactNode } from "react";
import type { WonderCard } from "@/types/wondercard";

interface WonderStoryScreenProps {
  card: WonderCard;
  onContinue: () => void;
}

interface WaveSeparatorProps {
  className?: string;
}

function WaveSeparator({
  className = "",
}: WaveSeparatorProps) {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1200 40"
        className="h-6 w-full opacity-70"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 20 Q 15 0 30 20 T 60 20 T 90 20 T 120 20 T 150 20 T 180 20 T 210 20 T 240 20 T 270 20 T 300 20 T 330 20 T 360 20 T 390 20 T 420 20 T 450 20 T 480 20 T 510 20 T 540 20 T 570 20 T 600 20 T 630 20 T 660 20 T 690 20 T 720 20 T 750 20 T 780 20 T 810 20 T 840 20 T 870 20 T 900 20 T 930 20 T 960 20 T 990 20 T 1020 20 T 1050 20 T 1080 20 T 1110 20 T 1140 20 T 1170 20 T 1200 20"
          fill="none"
          stroke="rgba(125, 211, 252, 0.9)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function PearlBadge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-sky-100">
      <span className="h-2 w-2 rounded-full bg-gradient-to-br from-sky-300 via-cyan-300 to-white shadow-[0_0_0_3px_rgba(186,230,253,0.35)]" />
      <span>{children}</span>
    </span>
  );
}

export default function WonderStoryScreen({
  card,
  onContinue,
}: WonderStoryScreenProps) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.10),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.93),rgba(255,255,255,0.74))]" />

        <div className="relative p-8 md:p-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-sky-300 via-cyan-300 to-violet-400 text-4xl shadow-lg shadow-cyan-200/50 ring-1 ring-white/70">
              {card.genome.friend.emoji}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <PearlBadge>Hey Explorer!</PearlBadge>
              <PearlBadge>{card.world}</PearlBadge>
              <PearlBadge>{card.genome.location}</PearlBadge>
            </div>

            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {card.friend}
            </h2>

            <p className="mt-3 max-w-lg text-lg leading-8 text-slate-700">
              How wonderful are you today?
            </p>
          </div>

          <WaveSeparator className="mt-8" />

          <div className="relative mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] bg-sky-50 p-6 ring-1 ring-sky-100">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-500">
                Story Intro
              </p>

              <p className="mt-3 leading-7 text-slate-800">
                {card.story.intro}
              </p>
            </div>

            <div className="rounded-[1.6rem] bg-cyan-50 p-6 ring-1 ring-cyan-100">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-600">
                The Mystery
              </p>

              <p className="mt-3 leading-7 text-slate-800">
                {card.story.problem}
              </p>
            </div>
          </div>

          <div className="relative mt-4 rounded-[1.6rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Wonder Goal
            </p>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-900">
              {card.story.goal}
            </p>
          </div>

          <div className="relative mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-400 px-6 py-4 text-base font-bold text-white shadow-lg shadow-cyan-200/60 transition hover:brightness-105 active:scale-[0.99]"
            >
              ✨ Start Wonder Adventure
            </button>
          </div>

          <WaveSeparator className="mt-8" />
        </div>
      </div>
    </article>
  );
}
