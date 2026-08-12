"use client";

import { useWonderCycle } from "@/platform/WonderCycleContext";
import {
  AnimatedHost,
  PageTransition,
  ProgressDots,
  StoryCard,
  WonderPanel,
  WonderPrimaryButton,
  WonderScene,
} from "@/components/wonder";

export function WelcomeScreen() {
  const { card, beginAdventure, isBusy, error } = useWonderCycle();

  return (
    <WonderScene>
      <PageTransition sceneKey="welcome">
        <WonderPanel>
          <div className="mb-5">
            <ProgressDots current={1} total={6} />
          </div>

          <div className="flex flex-col items-center text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-sky-700">
              ✨ It’s Wonder Time!
            </p>

            <h1 className="mt-3 text-4xl font-black text-slate-900">
              Hello Explorer!
            </h1>

            <p className="mt-2 text-lg leading-8 text-slate-600">
              Ready for today’s wonderful adventure?
            </p>

            <AnimatedHost
              src="/worlds/coral/host/coral-happy.png"
              alt="Coral, the cheerful host of Coral World"
            />
          </div>

          <StoryCard>
            <p className="text-sm text-slate-500">Today’s Adventure</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {card.title}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">{card.description}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">{card.duration}</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Ages {card.ageRange}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{card.activityType}</span>
            </div>
          </StoryCard>

          {error ? <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <div className="mt-5">
            <WonderPrimaryButton onClick={() => void beginAdventure()} disabled={isBusy}>
              {isBusy ? "Opening Coral World..." : "Begin Adventure! ✨"}
            </WonderPrimaryButton>
          </div>
        </WonderPanel>
      </PageTransition>
    </WonderScene>
  );
}
