"use client";

import type { WonderCard } from "@/types/wondercard";
import {
  WonderCycleProvider,
  useWonderCycle,
} from "@/platform/WonderCycleContext";
import { WelcomeScreen } from "./WelcomeScreen";
import { StoryScreen } from "./StoryScreen";
import { WonderPauseScreen } from "./WonderPauseScreen";
import { WonderMissionScreen } from "./WonderMissionScreen";
import { WonderMomentScreen } from "./WonderMomentScreen";
import { CelebrateScreen } from "./CelebrateScreen";

function ActiveWonderScreen() {
  const { step } = useWonderCycle();

  switch (step) {
    case "welcome":
      return <WelcomeScreen />;
    case "story":
      return <StoryScreen />;
    case "pause":
      return <WonderPauseScreen />;
    case "mission":
      return <WonderMissionScreen />;
    case "moment":
      return <WonderMomentScreen />;
    case "celebrate":
      return <CelebrateScreen />;
    default: {
      const exhaustiveCheck: never = step;
      return exhaustiveCheck;
    }
  }
}

export function WonderFlow({
  card,
  familyId = "family-demo",
}: {
  card: WonderCard;
  familyId?: string;
}) {
  return (
    <WonderCycleProvider
      card={card}
      familyId={familyId}
    >
      <ActiveWonderScreen />
    </WonderCycleProvider>
  );
}
