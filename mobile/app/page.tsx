import { WonderFlow } from "@/components/flow/WonderFlow";
import { getTodayAdventure } from "@/engine/wonderEngine";

export default function HomePage() {
  const todayAdventure = getTodayAdventure();

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50 px-4 py-10">
      <WonderFlow card={todayAdventure} familyId="family-demo" />
    </main>
  );
}
