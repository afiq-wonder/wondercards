import type { WonderCard } from "./wonderCard";
import type { WonderStep } from "./wonderStep";

export interface WonderSession {
  id: string;
  card: WonderCard;
  currentStep: WonderStep;
  startedAt: Date;
  completedAt: Date | null;
  completed: boolean;
  wonderScore: number;
}