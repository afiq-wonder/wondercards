import type {
  WonderCycle,
  WonderDNA,
  WonderMoment,
} from "./types";

export interface DNARepository {
  getByFamilyId(
    familyId: string,
  ): Promise<WonderDNA | null>;
  save(dna: WonderDNA): Promise<void>;
}

export interface CycleRepository {
  getById(cycleId: string): Promise<WonderCycle | null>;
  save(cycle: WonderCycle): Promise<void>;
}

export interface MemoryRepository {
  save(moment: WonderMoment): Promise<void>;
  listByFamilyId(
    familyId: string,
  ): Promise<WonderMoment[]>;
}
