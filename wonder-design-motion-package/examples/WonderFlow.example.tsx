import { PageTransition } from "@/components/wonder";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { WelcomeScreen } from "@/components/flow/WelcomeScreen";
import { StoryScreen } from "@/components/flow/StoryScreen";
import { WonderPauseScreen } from "@/components/flow/WonderPauseScreen";
import { WonderMissionScreen } from "@/components/flow/WonderMissionScreen";
import { WonderMomentScreen } from "@/components/flow/WonderMomentScreen";
import { CelebrateScreen } from "@/components/flow/CelebrateScreen";

export function ActiveWonderScreen() {
  const { step } = useWonderCycle();

  const screen = {
    welcome: <WelcomeScreen />,
    story: <StoryScreen />,
    pause: <WonderPauseScreen />,
    mission: <WonderMissionScreen />,
    moment: <WonderMomentScreen />,
    celebrate: <CelebrateScreen />,
  }[step];

  return <PageTransition sceneKey={step}>{screen}</PageTransition>;
}
