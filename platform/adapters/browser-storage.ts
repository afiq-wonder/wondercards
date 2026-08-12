import type {
  CycleRepository,
  DNARepository,
  MemoryRepository,
} from "../repositories";
import type {
  WonderCycle,
  WonderDNA,
  WonderMoment,
} from "../types";

const DNA_KEY = "wonderlabs:dna";
const CYCLE_KEY = "wonderlabs:cycles";
const MEMORY_KEY = "wonderlabs:moments";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function readRecord<T>(
  key: string,
): Record<string, T> {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const value = window.localStorage.getItem(key);
    return value
      ? (JSON.parse(value) as Record<string, T>)
      : {};
  } catch {
    return {};
  }
}

function writeRecord<T>(
  key: string,
  value: Record<string, T>,
): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    key,
    JSON.stringify(value),
  );
}

function readList<T>(key: string): T[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    key,
    JSON.stringify(value),
  );
}

export class BrowserDNARepository
  implements DNARepository
{
  async getByFamilyId(
    familyId: string,
  ): Promise<WonderDNA | null> {
    const store = readRecord<WonderDNA>(DNA_KEY);
    return store[familyId] ?? null;
  }

  async save(dna: WonderDNA): Promise<void> {
    const store = readRecord<WonderDNA>(DNA_KEY);
    store[dna.familyId] = dna;
    writeRecord(DNA_KEY, store);
  }
}

export class BrowserCycleRepository
  implements CycleRepository
{
  async getById(
    cycleId: string,
  ): Promise<WonderCycle | null> {
    const store =
      readRecord<WonderCycle>(CYCLE_KEY);
    return store[cycleId] ?? null;
  }

  async save(cycle: WonderCycle): Promise<void> {
    const store =
      readRecord<WonderCycle>(CYCLE_KEY);
    store[cycle.id] = cycle;
    writeRecord(CYCLE_KEY, store);
  }
}

export class BrowserMemoryRepository
  implements MemoryRepository
{
  async save(moment: WonderMoment): Promise<void> {
    const moments =
      readList<WonderMoment>(MEMORY_KEY);
    const withoutDuplicate = moments.filter(
      (existing) => existing.id !== moment.id,
    );

    writeList(MEMORY_KEY, [
      ...withoutDuplicate,
      moment,
    ]);
  }

  async listByFamilyId(
    familyId: string,
  ): Promise<WonderMoment[]> {
    return readList<WonderMoment>(MEMORY_KEY)
      .filter(
        (moment) => moment.familyId === familyId,
      )
      .sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
  }
}
