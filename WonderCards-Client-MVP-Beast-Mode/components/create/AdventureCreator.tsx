"use client";

import {
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  WonderAdventureRequest,
  WonderThemeId,
} from "@/types/adventureGeneration";

interface AdventureCreatorProps {
  isCreating: boolean;
  errorMessage: string | null;
  onCreate: (input: WonderAdventureRequest) => Promise<void>;
}

interface ThemeOption {
  id: WonderThemeId;
  emoji: string;
  title: string;
  description: string;
}

const THEMES: readonly ThemeOption[] = [
  {
    id: "ocean",
    emoji: "🐠",
    title: "Ocean",
    description: "Coral cities, pearl lagoons and friendly sea explorers.",
  },
  {
    id: "forest",
    emoji: "🌲",
    title: "Forest",
    description: "Whispering trees, tiny clues and woodland friends.",
  },
  {
    id: "space",
    emoji: "🚀",
    title: "Space",
    description: "Moon gardens, rainbow nebulae and cosmic mysteries.",
  },
  {
    id: "dinosaurs",
    emoji: "🦕",
    title: "Dinosaurs",
    description: "Gentle giants, fossil trails and prehistoric discoveries.",
  },
  {
    id: "dreams",
    emoji: "🌙",
    title: "Dreams",
    description: "Cloud castles, storybook hills and imagination magic.",
  },
  {
    id: "garden",
    emoji: "🌻",
    title: "Wonder Garden",
    description: "Kindness ponds, butterfly corners and growing ideas.",
  },
  {
    id: "sky",
    emoji: "☁️",
    title: "Sky",
    description: "Floating gardens, rainbow bridges and wind adventures.",
  },
  {
    id: "jungle",
    emoji: "🦜",
    title: "Jungle",
    description: "Hidden waterfalls, emerald lagoons and lively trails.",
  },
];

const AGE_OPTIONS = [
  { label: "Ages 4–5", min: 4, max: 5 },
  { label: "Ages 6–7", min: 6, max: 7 },
  { label: "Ages 8–9", min: 8, max: 9 },
] as const;

const DURATION_OPTIONS = [5, 10, 15] as const;

export default function AdventureCreator({
  isCreating,
  errorMessage,
  onCreate,
}: AdventureCreatorProps) {
  const familyIdInputId = useId();
  const [familyName, setFamilyName] = useState("Afiq Family");
  const [theme, setTheme] = useState<WonderThemeId>("ocean");
  const [ageIndex, setAgeIndex] = useState(0);
  const [duration, setDuration] = useState<(typeof DURATION_OPTIONS)[number]>(5);

  const selectedTheme = useMemo(
    () => THEMES.find((item) => item.id === theme) ?? THEMES[0],
    [theme]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedAge = AGE_OPTIONS[ageIndex] ?? AGE_OPTIONS[0];

    await onCreate({
      familyId: normaliseFamilyId(familyName),
      theme,
      ageMin: selectedAge.min,
      ageMax: selectedAge.max,
      duration,
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_16%_10%,rgba(186,230,253,0.62),transparent_26%),radial-gradient(circle_at_88%_16%,rgba(221,214,254,0.58),transparent_24%),linear-gradient(180deg,#f8fdff_0%,#f7fbff_45%,#fffaf5_100%)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[8%] top-16 text-5xl opacity-20 motion-safe:animate-[wonderFloat_5s_ease-in-out_infinite]">🫧</div>
        <div className="absolute right-[8%] top-24 text-5xl opacity-15 motion-safe:animate-[wonderFloat_6s_ease-in-out_infinite_reverse]">✨</div>
        <div className="absolute bottom-20 left-[14%] text-6xl opacity-10">🌊</div>
        <div className="absolute bottom-24 right-[12%] text-5xl opacity-10">🐚</div>
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/76 p-7 shadow-[0_28px_90px_rgba(30,64,175,0.10)] backdrop-blur-xl sm:p-9 lg:sticky lg:top-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-sky-700 ring-1 ring-sky-100">
            <span>✨</span>
            WonderCards
          </div>

          <h1 className="mt-7 max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            Make today a
            <span className="block bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-500 bg-clip-text text-transparent">
              wonderful journey.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Choose a world. WonderCards creates a short family story, a playful offline mission and a memory worth keeping.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              ["01", "Explore", "A story made for your family"],
              ["02", "Pause", "A gentle screen-break ritual"],
              ["03", "Create", "Turn imagination into a memory"],
            ].map(([number, title, copy]) => (
              <div key={number} className="rounded-[1.5rem] bg-white/85 p-4 shadow-sm ring-1 ring-slate-200/70">
                <p className="text-xs font-black tracking-[0.2em] text-sky-500">{number}</p>
                <p className="mt-2 font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.75rem] bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl shadow-slate-200/70">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-200">Tonight’s ritual</p>
            <p className="mt-2 text-xl font-bold">“It’s Wonder Time!”</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Five meaningful minutes together can become the story your children remember for years.
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-[2.25rem] border border-white/80 bg-white/82 p-5 shadow-[0_28px_90px_rgba(30,64,175,0.10)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-violet-600">Create an adventure</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Where shall we go today?</h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              ● Ready to create
            </div>
          </div>

          <div className="mt-7">
            <label htmlFor={familyIdInputId} className="text-sm font-bold text-slate-800">Family name</label>
            <input
              id={familyIdInputId}
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
              maxLength={80}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="e.g. Afiq Family"
            />
          </div>

          <fieldset className="mt-7">
            <legend className="text-sm font-bold text-slate-800">Choose a Wonder World</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {THEMES.map((item) => {
                const selected = item.id === theme;
                return (
                  <label
                    key={item.id}
                    className={[
                      "group cursor-pointer rounded-[1.4rem] border p-4 transition duration-200",
                      selected
                        ? "border-sky-300 bg-gradient-to-br from-sky-50 to-violet-50 shadow-md shadow-sky-100/70 ring-2 ring-sky-100"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={item.id}
                      checked={selected}
                      onChange={() => setTheme(item.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-100">{item.emoji}</span>
                      <span>
                        <span className="block font-bold text-slate-900">{item.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-bold text-slate-800">Child age</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {AGE_OPTIONS.map((option, index) => (
                  <label key={option.label} className="cursor-pointer">
                    <input
                      type="radio"
                      name="age"
                      checked={ageIndex === index}
                      onChange={() => setAgeIndex(index)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-center text-xs font-bold text-slate-600 transition peer-checked:border-violet-300 peer-checked:bg-violet-50 peer-checked:text-violet-700 peer-checked:ring-2 peer-checked:ring-violet-100">
                      {option.label.replace("Ages ", "")}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-bold text-slate-800">Adventure time</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((minutes) => (
                  <label key={minutes} className="cursor-pointer">
                    <input
                      type="radio"
                      name="duration"
                      checked={duration === minutes}
                      onChange={() => setDuration(minutes)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-center text-xs font-bold text-slate-600 transition peer-checked:border-cyan-300 peer-checked:bg-cyan-50 peer-checked:text-cyan-700 peer-checked:ring-2 peer-checked:ring-cyan-100">
                      {minutes} min
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-7 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{selectedTheme.emoji}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Today’s selection</p>
                <p className="mt-1 font-bold text-slate-900">{selectedTheme.title} · {AGE_OPTIONS[ageIndex]?.label} · {duration} min</p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-violet-500 px-6 text-base font-black text-white shadow-xl shadow-sky-200/70 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
          >
            {isCreating ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
                Creating your adventure…
              </>
            ) : (
              <>
                <span aria-hidden="true">✨</span>
                Create Today’s Adventure
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-400">
            Designed for family co-play. No endless scrolling. Your Wonder Mission happens in the real world.
          </p>
        </form>
      </div>
    </main>
  );
}

function normaliseFamilyId(value: string): string {
  const clean = value.trim().toLowerCase();

  return (
    clean
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "wonder-family"
  );
}
