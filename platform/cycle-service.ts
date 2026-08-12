import type {
  WonderOSEventBus,
} from "@/core";
import { createWonderDNA } from "./dna";
import { generateWonderGenome } from "./genome";
import { applyGrowth } from "./growth";
import type {
  CycleRepository,
  DNARepository,
  MemoryRepository,
} from "./repositories";
import type {
  CompleteCycleResult,
  WonderCycle,
} from "./types";
import { createId, nowISO } from "./utils";

export class WonderCycleService {
  constructor(
    private readonly dependencies: {
      dnaRepository: DNARepository;
      cycleRepository: CycleRepository;
      memoryRepository: MemoryRepository;
      eventBus: WonderOSEventBus;
    },
  ) {}

  async startCycle(input: {
    familyId: string;
    adventureId: string;
    date?: string;
    seed?: string;
  }): Promise<WonderCycle> {
    console.log("[startCycle] entered", input);
  
    const date =
      input.date ??
      new Date().toISOString().slice(0, 10);
  
    const genome = generateWonderGenome({
      familyId: input.familyId,
      date,
      seed: input.seed,
    });
  
    console.log("[startCycle] genome generated", genome);
  
    const cycle: WonderCycle = {
      id: createId("cycle"),
      familyId: input.familyId,
      adventureId: input.adventureId,
      genome,
      status: "started",
      startedAt: nowISO(),
    };
  
    console.log("[startCycle] saving cycle", cycle);
  
    await this.dependencies.cycleRepository.save(cycle);
  
    console.log("[startCycle] cycle saved");
  
    await this.dependencies.eventBus.emit(
      "genome:generated",
      {
        genomeId: genome.id,
        familyId: genome.familyId,
        date: genome.date,
        generatedAt: cycle.startedAt,
      },
      {
        source: "wonder-platform:genome-service",
      },
    );
  
    console.log("[startCycle] genome event emitted");
  
    await this.dependencies.eventBus.emit(
      "cycle:started",
      {
        cycleId: cycle.id,
        familyId: cycle.familyId,
        adventureId: cycle.adventureId,
        genomeId: genome.id,
        startedAt: cycle.startedAt,
      },
      {
        source: "wonder-platform:cycle-service",
      },
    );
  
    console.log("[startCycle] cycle event emitted");
  
    return cycle;
  }

  async completeCycle(input: {
    cycleId: string;
    reflection: string;
  }): Promise<CompleteCycleResult> {
    const reflection = input.reflection.trim();

    if (!reflection) {
      throw new Error(
        "A Wonder Moment reflection is required.",
      );
    }

    const cycle =
      await this.dependencies.cycleRepository.getById(
        input.cycleId,
      );

    if (!cycle) {
      throw new Error(
        `Wonder Cycle not found: ${input.cycleId}`,
      );
    }

    if (cycle.status === "completed") {
      throw new Error(
        `Wonder Cycle already completed: ${input.cycleId}`,
      );
    }

    const dna =
      (await this.dependencies.dnaRepository.getByFamilyId(
        cycle.familyId,
      )) ?? createWonderDNA(cycle.familyId);

    const moment = {
      id: createId("moment"),
      familyId: cycle.familyId,
      cycleId: cycle.id,
      adventureId: cycle.adventureId,
      reflection,
      createdAt: nowISO(),
    };

    await this.dependencies.memoryRepository.save(moment);

    await this.dependencies.eventBus.emit(
      "memory:wonder-moment-created",
      {
        momentId: moment.id,
        cycleId: cycle.id,
        familyId: cycle.familyId,
        adventureId: cycle.adventureId,
        createdAt: moment.createdAt,
      },
      {
        source: "wonder-platform:memory-service",
      },
    );

    const growthResult = applyGrowth({
      dna,
      familyId: cycle.familyId,
      cycleId: cycle.id,
      trait: cycle.genome.value,
    });

    await this.dependencies.dnaRepository.save(
      growthResult.dna,
    );

    await this.dependencies.eventBus.emit(
      "growth:calculated",
      {
        growthEventId: growthResult.growthEvent.id,
        familyId: growthResult.growthEvent.familyId,
        cycleId: growthResult.growthEvent.cycleId,
        trait: growthResult.growthEvent.trait,
        xpAwarded: growthResult.growthEvent.xpAwarded,
        previousLevel:
          growthResult.growthEvent.previousLevel,
        currentLevel:
          growthResult.growthEvent.currentLevel,
        calculatedAt: growthResult.growthEvent.createdAt,
      },
      {
        source: "wonder-platform:growth-service",
      },
    );
    
    await this.dependencies.eventBus.emit(
      "dna:updated",
      {
        familyId: growthResult.dna.familyId,
        cycleId: cycle.id,
        adventureCount: growthResult.dna.adventureCount,
        wonderMoments: growthResult.dna.wonderMoments,
        updatedAt: growthResult.dna.updatedAt,
      },
      {
        source: "wonder-platform:dna-service",
      },
    );

    const completedCycle: WonderCycle = {
      ...cycle,
      status: "completed",
      completedAt: nowISO(),
    };

    await this.dependencies.cycleRepository.save(
      completedCycle,
    );

    await this.dependencies.eventBus.emit(
      "cycle:completed",
      {
        cycleId: completedCycle.id,
        familyId: completedCycle.familyId,
        adventureId: completedCycle.adventureId,
        completedAt:
          completedCycle.completedAt ?? nowISO(),
      },
      {
        source: "wonder-platform:cycle-service",
      },
    );

    return {
      cycle: completedCycle,
      moment,
      dna: growthResult.dna,
      growthEvent: growthResult.growthEvent,
    };
  }
}
