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
  goToStep(step: WonderFlowStep): void;
  completeAdventure(
    reflection: string,
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
    useState<CompleteCycleResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

    const beginAdventure = useCallback(async () => {
      console.log("1. beginAdventure called");
    
      setIsBusy(true);
      setError(null);
    
      try {
        console.log("2. Calling platform.startCycle...");
    
        const startedCycle = await platform.startCycle({
          familyId,
          adventureId: card.id,
        });
    
        console.log("3. startCycle returned:", startedCycle);
    
        setCycle(startedCycle);
        setCompletion(null);
    
        console.log("4. Moving to story screen");
    
        setStep("story");
      } catch (cause) {
        console.error("START CYCLE ERROR:", cause);
    
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to start the adventure.",
        );
      } finally {
        setIsBusy(false);
      }
    }, [card.id, familyId, platform]);

  const completeAdventure = useCallback(
    async (reflection: string) => {
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

        setCycle(result.cycle);
        setDNA(result.dna);
        setCompletion(result);
        setStep("celebrate");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to save the Wonder Moment.",
        );
      } finally {
        setIsBusy(false);
      }
    },
    [cycle, platform],
  );

  const restartAdventure = useCallback(() => {
    setStep("welcome");
    setCycle(null);
    setCompletion(null);
    setError(null);
  }, []);

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
      goToStep: setStep,
      completeAdventure,
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
      completeAdventure,
      restartAdventure,
    ],
  );

  return (
    <WonderCycleContext.Provider value={value}>
      {children}
    </WonderCycleContext.Provider>
  );
}

export function useWonderCycle(): WonderCycleContextValue {
  const context = useContext(WonderCycleContext);

  if (!context) {
    throw new Error(
      "useWonderCycle must be used inside WonderCycleProvider.",
    );
  }

  return context;
}
