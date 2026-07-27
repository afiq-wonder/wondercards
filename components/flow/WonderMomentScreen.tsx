"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { WonderCard } from "@/types/wonderCard";

interface WonderMomentScreenProps {
  card: WonderCard;
  onBack: () => void;
  onSave: (moment: string) => void;
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
        className="h-6 w-full opacity-55"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 20 Q 15 0 30 20 T 60 20 T 90 20 T 120 20 T 150 20 T 180 20 T 210 20 T 240 20 T 270 20 T 300 20 T 330 20 T 360 20 T 390 20 T 420 20 T 450 20 T 480 20 T 510 20 T 540 20 T 570 20 T 600 20 T 630 20 T 660 20 T 690 20 T 720 20 T 750 20 T 780 20 T 810 20 T 840 20 T 870 20 T 900 20 T 930 20 T 960 20 T 990 20 T 1020 20 T 1050 20 T 1080 20 T 1110 20 T 1140 20 T 1170 20 T 1200 20"
          fill="none"
          stroke="rgba(148, 197, 222, 0.85)"
          strokeWidth="2"
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
    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-sky-100">
      <span className="h-2 w-2 rounded-full bg-gradient-to-br from-sky-200 via-cyan-200 to-white shadow-[0_0_0_3px_rgba(186,230,253,0.24)]" />
      <span>{children}</span>
    </span>
  );
}

export default function WonderMomentScreen({
  card,
  onBack,
  onSave,
}: WonderMomentScreenProps) {
  const [moment, setMoment] = useState("");

  function handleSave() {
    const cleaned = moment.trim();

    onSave(
      cleaned.length > 0
        ? cleaned
        : `Today felt wonderful exploring ${card.genome.location} with ${card.friend}.`
    );
  }

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.75))]" />

        <div className="relative p-8 md:p-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-sky-200 via-cyan-200 to-violet-200 text-4xl shadow-md shadow-cyan-100/50 ring-1 ring-white/70">
              💙
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <PearlBadge>Wonder Moment</PearlBadge>
              <PearlBadge>{card.friend}</PearlBadge>
              <PearlBadge>{card.genome.location}</PearlBadge>
            </div>

            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Save today&apos;s memory
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              What would you like to remember from this adventure?
            </p>
          </div>

          <WaveSeparator className="mt-8" />

          <div className="relative mt-8 rounded-[1.6rem] bg-sky-50 p-6 ring-1 ring-sky-100">
            <label
              htmlFor="wonder-moment"
              className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-500"
            >
              Write your Wonder Moment
            </label>

            <textarea
              id="wonder-moment"
              value={moment}
              onChange={(event) => setMoment(event.target.value)}
              rows={6}
              placeholder="Today we..."
              className="mt-4 w-full rounded-2xl border border-white/70 bg-white/90 p-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white"
            />
          </div>

          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-300 via-cyan-200 to-violet-200 px-6 py-4 text-base font-bold text-slate-800 shadow-sm shadow-cyan-100/60 transition hover:brightness-105 active:scale-[0.99]"
            >
              Save Wonder Moment ✨
            </button>
          </div>

          <WaveSeparator className="mt-8" />
        </div>
      </div>
    </article>
  );
}