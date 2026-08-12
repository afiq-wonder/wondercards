"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { WonderCard } from "@/types/wondercard";
import type {
  CompleteCycleResult,
  WonderCycle,
  WonderDNA,
} from "./types";

import { useWonderPlatform } from "./PlatformProvider";

export type WonderFlowStep =
  | "welcome"
  | "story"
  | "pause"
  | "mission"
  | "moment"
  | "celebrate";

interface WonderCycleContextValue {
  card: WonderCard;
  familyId: string;
  step: WonderFlowStep;
  cycle: WonderCycle | null;
  dna: WonderDNA | null;
  completion: CompleteCycleResult | null;
  isBusy: boolean;
  error: string | null;

  beginAdventure(): Promise<void>;

  goToStep(
    step: WonderFlowStep,
  ): Promise<void>;

  markMissionCompleted(): Promise<void>;

  completeAdventure(
    reflection: string,
  ): Promise<void>;

  rateExperience(
    rating: number,
  ): Promise<void>;

  restartAdventure(): void;
}

const WonderCycleContext =
  createContext<WonderCycleContextValue | null>(
    null,
  );

export function WonderCycleProvider({
  card,
  familyId = "family-demo",
  children,
}: {
  card: WonderCard;
  familyId?: string;
  children: ReactNode;
}) {
  const platform = useWonderPlatform();

  const [step, setStep] =
    useState<WonderFlowStep>("welcome");

  const [cycle, setCycle] =
    useState<WonderCycle | null>(null);

  const [dna, setDNA] =
    useState<WonderDNA | null>(null);

  const [completion, setCompletion] =
    useState<CompleteCycleResult | null>(
      null,
    );

  const [isBusy, setIsBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // -----------------------------------------
  // 1. ADVENTURE STARTED
  // -----------------------------------------

  const beginAdventure =
    useCallback(async () => {
      setIsBusy(true);
      setError(null);

      try {
        const startedCycle =
          await platform.startCycle({
            familyId,
            adventureId: card.id,
          });

        await platform.saveProofEvent({
          id: crypto.randomUUID(),
          familyId,
          cycleId: startedCycle.id,
          adventureId: card.id,
          type: "adventure_started",
          createdAt:
            new Date().toISOString(),
        });

        setCycle(startedCycle);
        setCompletion(null);
        setStep("story");
      } catch (cause) {
        console.error(
          "START CYCLE ERROR:",
          cause,
        );

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to start the adventure.",
        );
      } finally {
        setIsBusy(false);
      }
    }, [
      card.id,
      familyId,
      platform,
    ]);

  // -----------------------------------------
  // 2. FLOW PROGRESS
  // -----------------------------------------

  const goToStep = useCallback(
    async (
      nextStep: WonderFlowStep,
    ) => {
      if (cycle) {
        const eventType =
          nextStep === "pause"
            ? "pause_reached"
            : nextStep === "mission"
              ? "mission_reached"
              : null;

        if (eventType) {
          await platform.saveProofEvent({
            id: crypto.randomUUID(),
            familyId,
            cycleId: cycle.id,
            adventureId: card.id,
            type: eventType,
            createdAt:
              new Date().toISOString(),
          });
        }
      }

      setStep(nextStep);
    },
    [
      card.id,
      cycle,
      familyId,
      platform,
    ],
  );

  // -----------------------------------------
  // 3. REAL-WORLD MISSION COMPLETED
  // -----------------------------------------

  const markMissionCompleted =
    useCallback(async () => {
      if (!cycle) {
        return;
      }

      await platform.saveProofEvent({
        id: crypto.randomUUID(),
        familyId,
        cycleId: cycle.id,
        adventureId: card.id,
        type: "mission_completed",
        createdAt:
          new Date().toISOString(),
      });
    }, [
      card.id,
      cycle,
      familyId,
      platform,
    ]);

  // -----------------------------------------
  // 4. WONDER MOMENT + ADVENTURE COMPLETED
  // -----------------------------------------

  const completeAdventure =
    useCallback(
      async (
        reflection: string,
      ) => {
        if (!cycle) {
          setError(
            "Start the Wonder Cycle before completing it.",
          );
          return;
        }

        setIsBusy(true);
        setError(null);

        try {
          const result =
            await platform.completeCycle({
              cycleId: cycle.id,
              reflection,
            });

          await platform.saveProofEvent({
            id: crypto.randomUUID(),
            familyId,
            cycleId: cycle.id,
            adventureId: card.id,
            type: "moment_saved",
            createdAt:
              new Date().toISOString(),
          });

          await platform.saveProofEvent({
            id: crypto.randomUUID(),
            familyId,
            cycleId: cycle.id,
            adventureId: card.id,
            type: "adventure_completed",
            createdAt:
              new Date().toISOString(),
          });

          setCycle(result.cycle);
          setDNA(result.dna);
          setCompletion(result);
          setStep("celebrate");
        } catch (cause) {
          console.error(
            "COMPLETE CYCLE ERROR:",
            cause,
          );

          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to save the Wonder Moment.",
          );
        } finally {
          setIsBusy(false);
        }
      },
      [
        card.id,
        cycle,
        familyId,
        platform,
      ],
    );

  // -----------------------------------------
  // 5. EXPERIENCE RATED
  // -----------------------------------------

  const rateExperience =
    useCallback(
      async (rating: number) => {
        if (!cycle) {
          return;
        }

        await platform.saveProofEvent({
          id: crypto.randomUUID(),
          familyId,
          cycleId: cycle.id,
          adventureId: card.id,
          type: "experience_rated",
          createdAt:
            new Date().toISOString(),
          metadata: {
            rating,
          },
        });
      },
      [
        card.id,
        cycle,
        familyId,
        platform,
      ],
    );

  // -----------------------------------------
  // 6. RESTART
  // -----------------------------------------

  const restartAdventure =
    useCallback(() => {
      setStep("welcome");
      setCycle(null);
      setCompletion(null);
      setError(null);
    }, []);

  // -----------------------------------------
  // CONTEXT
  // -----------------------------------------

  const value = useMemo(
    () => ({
      card,
      familyId,
      step,
      cycle,
      dna,
      completion,
      isBusy,
      error,
      beginAdventure,
      goToStep,
      markMissionCompleted,
      completeAdventure,
      rateExperience,
      restartAdventure,
    }),
    [
      card,
      familyId,
      step,
      cycle,
      dna,
      completion,
      isBusy,
      error,
      beginAdventure,
      goToStep,
      markMissionCompleted,
      completeAdventure,
      rateExperience,
      restartAdventure,
    ],
  );

  return (
    <WonderCycleContext.Provider
      value={value}
    >
      {children}
    </WonderCycleContext.Provider>
  );
}

export function useWonderCycle():
  WonderCycleContextValue {
  const context =
    useContext(WonderCycleContext);

  if (!context) {
    throw new Error(
      "useWonderCycle must be used inside WonderCycleProvider.",
    );
  }

  return context;
}