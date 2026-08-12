import {
  BrowserCycleRepository,
  BrowserDNARepository,
  BrowserMemoryRepository,
} from "./adapters/browser-storage";

import { createWonderOSEventBus } from "@/core";

import { WonderCycleService } from "./cycle-service";

export function createWonderPlatform() {
  const events = createWonderOSEventBus();

  const dnaRepository = new BrowserDNARepository();
  const cycleRepository = new BrowserCycleRepository();
  const memoryRepository = new BrowserMemoryRepository();

  const cycleService = new WonderCycleService({
    dnaRepository,
    cycleRepository,
    memoryRepository,
    eventBus: events,
  });

  return {
    events,

    startCycle: cycleService.startCycle.bind(cycleService),

    completeCycle: cycleService.completeCycle.bind(cycleService),

    getWonderDNA: (familyId: string) =>
      dnaRepository.getByFamilyId(familyId),

    getTimeline: (familyId: string) =>
      memoryRepository.listByFamilyId(familyId),
  };
}

export type WonderPlatform = ReturnType<
  typeof createWonderPlatform
>;