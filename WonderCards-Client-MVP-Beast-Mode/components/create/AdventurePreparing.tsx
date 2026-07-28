"use client";

const STEPS = [
  "Finding a wonderful world",
  "Meeting today’s Wonder Friend",
  "Creating an offline family mission",
] as const;

export default function AdventurePreparing({ onCancel }: { onCancel: () => void }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.8),transparent_35%),linear-gradient(180deg,#f7fdff_0%,#ffffff_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[15%] top-[18%] text-6xl opacity-20 motion-safe:animate-[wonderFloat_4s_ease-in-out_infinite]">🫧</div>
        <div className="absolute right-[14%] top-[24%] text-5xl opacity-20 motion-safe:animate-[wonderFloat_5s_ease-in-out_infinite_reverse]">✨</div>
        <div className="absolute bottom-[16%] left-[22%] text-5xl opacity-15">🐚</div>
      </div>

      <section className="relative w-full max-w-xl rounded-[2.25rem] border border-white/80 bg-white/82 p-7 text-center shadow-[0_30px_100px_rgba(14,116,144,0.14)] backdrop-blur-xl sm:p-10">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-sky-200 via-cyan-100 to-violet-200 text-5xl shadow-xl shadow-sky-100 ring-1 ring-white">
          <span className="motion-safe:animate-[wonderFloat_2.8s_ease-in-out_infinite]">🐠</span>
          <span className="absolute -right-2 -top-2 text-2xl motion-safe:animate-pulse">✨</span>
        </div>

        <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.28em] text-sky-600">WonderOS is creating</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your family adventure is taking shape…</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
          Coral is gathering a story, a moment of wonder and a mission you can enjoy away from the screen.
        </p>

        <div className="mt-8 space-y-3 text-left">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-sky-600 shadow-sm ring-1 ring-sky-100">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-slate-700">{step}</span>
              <span className="ml-auto h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: `${index * 180}ms` }} />
            </div>
          ))}
        </div>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-400 motion-safe:animate-[wonderLoading_1.4s_ease-in-out_infinite]" />
        </div>

        <button type="button" onClick={onCancel} className="mt-7 text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-800">
          Cancel and go back
        </button>
      </section>
    </main>
  );
}
