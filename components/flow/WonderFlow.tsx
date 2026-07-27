"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  wonderSessionEngine,
  type WonderSession,
} from "@/engine/session/WonderSessionEngine";

import type { WonderCard } from "@/types/wonderCard";
import type { WonderGenome } from "@/types/wonderGenome";

import WonderCelebrateScreen from "./WonderCelebrateScreen";
import WonderMissionScreen from "./WonderMissionScreen";
import WonderMomentScreen from "./WonderMomentScreen";
import WonderPauseScreen from "./WonderPauseScreen";
import WonderStoryScreen from "./WonderStoryScreen";

interface WonderFlowProps {
  card: WonderCard;
}

type WonderFlowStep =
  | "story"
  | "mission"
  | "pause"
  | "moment"
  | "celebrate"
  | "complete";

interface WonderFlowStepDefinition {
  step: WonderFlowStep;
  label: string;
}

const FLOW_STEPS: readonly WonderFlowStepDefinition[] = [
  {
    step: "story",
    label: "Story",
  },
  {
    step: "mission",
    label: "Mission",
  },
  {
    step: "pause",
    label: "Pause",
  },
  {
    step: "moment",
    label: "Moment",
  },
  {
    step: "celebrate",
    label: "Celebrate",
  },
  {
    step: "complete",
    label: "Complete",
  },
];

const STORY_STEP_INDEX = 0;
const MISSION_STEP_INDEX = 1;
const PAUSE_STEP_INDEX = 2;
const MOMENT_STEP_INDEX = 3;
const CELEBRATE_STEP_INDEX = 4;
const COMPLETE_STEP_INDEX = 5;

const MISSION_COMPLETION_SCORE = 20;

function WaveSeparator({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden ${className}`}
    >
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

function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const safeValue = clamp(
    value,
    0,
    100
  );

  const size = 104;
  const strokeWidth = 9;
  const radius =
    (size - strokeWidth) / 2;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (safeValue / 100) *
      circumference;

  return (
    <div className="relative flex h-[104px] w-[104px] items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="wonder-ring-soft"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#bfdbfe"
            />

            <stop
              offset="55%"
              stopColor="#bae6fd"
            />

            <stop
              offset="100%"
              stopColor="#c4b5fd"
            />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.14)"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#wonder-ring-soft)"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          Progress
        </p>

        <p className="mt-1 text-xl font-bold text-slate-900">
          {Math.round(safeValue)}%
        </p>

        <p className="mt-1 text-[11px] font-medium text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function ScreenFrame({
  children,
  stepKey,
}: {
  children: ReactNode;
  stepKey: string;
}) {
  return (
    <div
      key={stepKey}
      className="w-full"
      style={{
        animation:
          "wonderFadeIn 260ms ease-out",
      }}
    >
      {children}
    </div>
  );
}

function createInitialSession(
  card: WonderCard
): WonderSession {
  return wonderSessionEngine.createSession(
    card.genome,
    {
      version: card.version,
      createdAt: card.createdAt,
      wonderScore: card.wonderScore,
      currentStep: STORY_STEP_INDEX,
      autoSave: false,
    }
  );
}

function belongsToCard(
  session: WonderSession,
  card: WonderCard
): boolean {
  return (
    session.genome.id ===
      card.genome.id &&
    session.genome.seed ===
      card.genome.seed
  );
}

function getFlowStep(
  currentStep: number
): WonderFlowStep {
  const safeIndex = clamp(
    Math.floor(currentStep),
    STORY_STEP_INDEX,
    COMPLETE_STEP_INDEX
  );

  return (
    FLOW_STEPS[safeIndex]?.step ??
    "story"
  );
}

function createReplayGenome(
  genome: WonderGenome
): WonderGenome {
  const now = new Date();

  return {
    ...genome,

    id: genome.id,

    version: genome.version + 1,

    seed:
      `${genome.seed}:replay:${now.getTime()}`,

    createdAt: now,

    friend: {
      ...genome.friend,
    },

    world: {
      ...genome.world,
    },

    value: {
      ...genome.value,
    },

    template: {
      ...genome.template,
    },

    ageRange: {
      ...genome.ageRange,
    },
  };
}

export default function WonderFlow({
  card,
}: WonderFlowProps) {
  const [
    sessionState,
    setSessionState,
  ] = useState<WonderSession>(
    () => createInitialSession(card)
  );

  const [isReady, setIsReady] =
    useState(false);

  useEffect(() => {
    const storedSession =
      wonderSessionEngine.loadSession();

    if (
      storedSession &&
      belongsToCard(
        storedSession,
        card
      )
    ) {
      if (
        storedSession.status ===
        "completed"
      ) {
        setSessionState(
          storedSession
        );

        setIsReady(true);

        return;
      }

      const resumedSession =
        wonderSessionEngine.resumeSession();

      setSessionState(
        resumedSession ??
          storedSession
      );

      setIsReady(true);

      return;
    }

    const createdSession =
      wonderSessionEngine.createSession(
        card.genome,
        {
          version: card.version,
          createdAt: card.createdAt,
          wonderScore:
            card.wonderScore,
          currentStep:
            STORY_STEP_INDEX,
          autoSave: true,
        }
      );

    const startedSession =
      wonderSessionEngine.startSession(
        createdSession
      );

    setSessionState(
      startedSession
    );

    setIsReady(true);
  }, [
    card.id,
    card.version,
    card.createdAt,
    card.genome,
    card.wonderScore,
  ]);

  const activeCard =
    sessionState.card;

  const currentStep =
    getFlowStep(
      sessionState.currentStep
    );

  const currentIndex = clamp(
    sessionState.currentStep,
    STORY_STEP_INDEX,
    COMPLETE_STEP_INDEX
  );

  const progress =
    currentStep === "complete"
      ? 100
      : (
          currentIndex /
          COMPLETE_STEP_INDEX
        ) * 100;

  const currentLabel =
    FLOW_STEPS[currentIndex]
      ?.label ?? "Story";

  function handleNext(): void {
    if (
      currentStep === "celebrate"
    ) {
      const completedSession =
        wonderSessionEngine.completeSession(
          sessionState,
          {
            wonderScore:
              sessionState.wonderScore,

            saveMomentToHistory:
              false,
          }
        );

      const finalSession =
        wonderSessionEngine.setCurrentStep(
          completedSession,
          COMPLETE_STEP_INDEX
        );

      setSessionState(
        finalSession
      );

      return;
    }

    if (
      currentStep === "complete"
    ) {
      return;
    }

    const updatedSession =
      wonderSessionEngine.nextStep(
        sessionState
      );

    setSessionState(
      updatedSession
    );
  }

  function handleBack(): void {
    if (
      sessionState.currentStep <=
      STORY_STEP_INDEX
    ) {
      return;
    }

    const updatedSession =
      wonderSessionEngine.previousStep(
        sessionState
      );

    setSessionState(
      updatedSession
    );
  }

  function handleMissionComplete(): void {
    const scoredSession =
      wonderSessionEngine.addWonderScore(
        sessionState,
        MISSION_COMPLETION_SCORE
      );

    const updatedSession =
      wonderSessionEngine.nextStep(
        scoredSession
      );

    setSessionState(
      updatedSession
    );
  }

  function handleSaveMoment(
    moment: string
  ): void {
    const momentSession =
      wonderSessionEngine.saveWonderMoment(
        sessionState,
        moment,
        true
      );

    const updatedSession =
      wonderSessionEngine.nextStep(
        momentSession
      );

    setSessionState(
      updatedSession
    );
  }

  function handleRestart(): void {
    wonderSessionEngine.clearSession();

    const replayGenome =
      createReplayGenome(
        sessionState.genome
      );

    const createdSession =
      wonderSessionEngine.createSession(
        replayGenome,
        {
          version:
            sessionState.version + 1,

          createdAt:
            replayGenome.createdAt,

          wonderScore: 0,

          currentStep:
            STORY_STEP_INDEX,

          autoSave: true,
        }
      );

    const startedSession =
      wonderSessionEngine.startSession(
        createdSession
      );

    setSessionState(
      startedSession
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.55),transparent_34%),linear-gradient(180deg,#f6fbfc_0%,#fbfefe_46%,#ffffff_100%)] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-8 top-10 animate-pulse text-6xl opacity-8 blur-[0.2px]">
          🫧
        </div>

        <div className="absolute right-16 top-20 animate-bounce text-5xl opacity-8">
          🐚
        </div>

        <div className="absolute left-1/2 top-14 text-5xl opacity-8">
          🌊
        </div>

        <div className="absolute bottom-24 left-16 text-6xl opacity-8">
          ⭐
        </div>

        <div className="absolute bottom-32 right-10 text-6xl opacity-8">
          🫧
        </div>

        <div className="absolute bottom-16 right-1/4 animate-pulse text-4xl opacity-8">
          ✨
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="overflow-hidden rounded-[2.1rem] border border-white/70 bg-white/72 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="bg-gradient-to-b from-white/90 via-sky-50/55 to-cyan-50/35 px-5 pt-5 md:px-7 md:pt-7">
            <div className="flex flex-wrap gap-2">
              <PearlBadge>
                Coral Village
              </PearlBadge>

              <PearlBadge>
                {activeCard.world}
              </PearlBadge>

              <PearlBadge>
                {activeCard.value}
              </PearlBadge>
            </div>

            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-sky-200 via-cyan-200 to-violet-200 text-3xl shadow-md shadow-cyan-100/50 ring-1 ring-white/70">
                  {activeCard.genome
                    .friend.emoji ||
                    "🐠"}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">
                    Wonder World
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                    {activeCard.friend}{" "}
                    Adventure Flow
                  </h1>

                  <p className="mt-2 text-sm text-slate-600 md:text-base">
                    {activeCard.world}
                    {" · "}
                    {
                      activeCard.genome
                        .location
                    }
                    {" · "}
                    {
                      activeCard.duration
                    }{" "}
                    min
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                    <span className="text-sky-500">
                      ✦
                    </span>

                    <span>
                      {currentLabel}
                    </span>

                    <span className="text-slate-300">
                      •
                    </span>

                    <span>
                      {
                        activeCard.story
                          .title
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:items-end">
                <div className="rounded-[1.8rem] bg-white/85 p-3 shadow-sm ring-1 ring-slate-200/70">
                  <ProgressRing
                    value={progress}
                    label={currentLabel}
                  />
                </div>

                <div className="rounded-[1.8rem] bg-gradient-to-b from-sky-50 to-white px-5 py-4 shadow-sm ring-1 ring-sky-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Wonder Score
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {
                      sessionState.wonderScore
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Emotional progress
                    through the adventure
                  </p>
                </div>
              </div>
            </div>

            <WaveSeparator className="mt-6" />

            <div className="relative mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
              {FLOW_STEPS.map(
                (item, index) => {
                  const active =
                    item.step ===
                    currentStep;

                  const completed =
                    index <
                      currentIndex ||
                    currentStep ===
                      "complete";

                  return (
                    <div
                      key={item.step}
                      className={[
                        "rounded-full px-3 py-2 text-center text-xs font-semibold transition-all duration-300",

                        active
                          ? "bg-gradient-to-r from-sky-300 via-cyan-200 to-violet-200 text-slate-800 shadow-sm shadow-cyan-100/60"
                          : completed
                            ? "bg-sky-50 text-sky-700"
                            : "bg-slate-100 text-slate-400",
                      ].join(" ")}
                    >
                      {item.label}
                    </div>
                  );
                }
              )}
            </div>

            <WaveSeparator className="mt-5 pb-2" />
          </div>
        </header>

        <section className="mx-auto w-full max-w-3xl">
          {!isReady && (
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur">
              <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-200 via-cyan-200 to-violet-200 text-3xl">
                🫧
              </div>

              <p className="mt-5 text-lg font-semibold text-slate-800">
                Preparing your Wonder
                Adventure...
              </p>
            </div>
          )}

          {isReady &&
            currentStep === "story" && (
              <ScreenFrame stepKey="story">
                <WonderStoryScreen
                  card={activeCard}
                  onContinue={
                    handleNext
                  }
                />
              </ScreenFrame>
            )}

          {isReady &&
            currentStep ===
              "mission" && (
              <ScreenFrame stepKey="mission">
                <WonderMissionScreen
                  card={activeCard}
                  onBack={handleBack}
                  onComplete={
                    handleMissionComplete
                  }
                />
              </ScreenFrame>
            )}

          {isReady &&
            currentStep === "pause" && (
              <ScreenFrame stepKey="pause">
                <WonderPauseScreen
                  card={activeCard}
                  onBack={handleBack}
                  onContinue={
                    handleNext
                  }
                />
              </ScreenFrame>
            )}

          {isReady &&
            currentStep === "moment" && (
              <ScreenFrame stepKey="moment">
                <WonderMomentScreen
                  card={activeCard}
                  onBack={handleBack}
                  onSave={
                    handleSaveMoment
                  }
                />
              </ScreenFrame>
            )}

          {isReady &&
            currentStep ===
              "celebrate" && (
              <ScreenFrame stepKey="celebrate">
                <WonderCelebrateScreen
                  card={activeCard}
                  wonderScore={
                    sessionState.wonderScore
                  }
                  savedMoment={
                    sessionState.savedMoment
                  }
                  completed={false}
                  onPrimary={
                    handleNext
                  }
                />
              </ScreenFrame>
            )}

          {isReady &&
            currentStep ===
              "complete" && (
              <ScreenFrame stepKey="complete">
                <WonderCelebrateScreen
                  card={activeCard}
                  wonderScore={
                    sessionState.wonderScore
                  }
                  savedMoment={
                    sessionState.savedMoment
                  }
                  completed
                  onPrimary={
                    handleRestart
                  }
                />
              </ScreenFrame>
            )}
        </section>
      </div>

      <style jsx>{`
        @keyframes wonderFadeIn {
          from {
            opacity: 0;
            transform: translateY(14px)
              scale(0.99);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }
      `}</style>
    </main>
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.floor(value)
    )
  );
}