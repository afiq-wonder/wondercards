type WonderStorageKey =
  | "genome"
  | "session"
  | "story"
  | "mission"
  | "moments"
  | "progress"
  | "friendship"
  | "dailyAdventure"
  | "rewards";

interface WonderStorageEnvelope<T> {
  schemaVersion: number;
  savedAt: Date;
  value: T;
}

interface WonderDateMarker {
  __wonderType: "Date";
  value: string;
}

export interface WonderRepositoryStatus {
  available: boolean;
  schemaVersion: number;
  storedKeys: WonderStorageKey[];
}

const WONDER_STORAGE_KEYS: readonly WonderStorageKey[] = [
  "genome",
  "session",
  "story",
  "mission",
  "moments",
  "progress",
  "friendship",
  "dailyAdventure",
  "rewards",
];

export class WonderRepository {
  private static readonly PREFIX = "wonderlabs";

  private static readonly SCHEMA_VERSION = 1;

  // =========================================================
  // GENERIC STORAGE HELPERS
  // =========================================================

  private buildKey(key: WonderStorageKey): string {
    return `${WonderRepository.PREFIX}:${key}`;
  }

  private canUseStorage(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const testKey =
        `${WonderRepository.PREFIX}:storage-test`;

      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);

      return true;
    } catch {
      return false;
    }
  }

  private save<T>(
    key: WonderStorageKey,
    value: T
  ): boolean {
    if (!this.canUseStorage()) {
      return false;
    }

    const envelope: WonderStorageEnvelope<T> = {
      schemaVersion:
        WonderRepository.SCHEMA_VERSION,

      savedAt: new Date(),

      value,
    };

    try {
      const serialised = JSON.stringify(
        envelope,
        wonderJSONReplacer
      );

      window.localStorage.setItem(
        this.buildKey(key),
        serialised
      );

      return true;
    } catch (error) {
      console.error(
        `[WonderRepository] Failed to save "${key}".`,
        error
      );

      return false;
    }
  }

  private load<T>(
    key: WonderStorageKey
  ): T | null {
    if (!this.canUseStorage()) {
      return null;
    }

    try {
      const rawValue =
        window.localStorage.getItem(
          this.buildKey(key)
        );

      if (!rawValue) {
        return null;
      }

      const parsedValue = JSON.parse(
        rawValue,
        wonderJSONReviver
      ) as unknown;

      if (
        this.isStorageEnvelope<T>(
          parsedValue
        )
      ) {
        return parsedValue.value;
      }

      /*
       * Backward compatibility:
       *
       * Older WonderLabs versions stored the raw value
       * without a storage envelope.
       */
      return parsedValue as T;
    } catch (error) {
      console.error(
        `[WonderRepository] Failed to load "${key}".`,
        error
      );

      /*
       * Remove corrupted data so the same parsing error
       * does not happen every time the app starts.
       */
      this.remove(key);

      return null;
    }
  }

  private remove(
    key: WonderStorageKey
  ): boolean {
    if (!this.canUseStorage()) {
      return false;
    }

    try {
      window.localStorage.removeItem(
        this.buildKey(key)
      );

      return true;
    } catch (error) {
      console.error(
        `[WonderRepository] Failed to remove "${key}".`,
        error
      );

      return false;
    }
  }

  private exists(
    key: WonderStorageKey
  ): boolean {
    if (!this.canUseStorage()) {
      return false;
    }

    try {
      return (
        window.localStorage.getItem(
          this.buildKey(key)
        ) !== null
      );
    } catch {
      return false;
    }
  }

  private isStorageEnvelope<T>(
    value: unknown
  ): value is WonderStorageEnvelope<T> {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      return false;
    }

    const record =
      value as Record<string, unknown>;

    return (
      typeof record.schemaVersion ===
        "number" &&
      "savedAt" in record &&
      "value" in record
    );
  }

  // =========================================================
  // GENOME
  // =========================================================

  saveGenome<T>(genome: T): boolean {
    return this.save("genome", genome);
  }

  loadGenome<T>(): T | null {
    return this.load<T>("genome");
  }

  hasGenome(): boolean {
    return this.exists("genome");
  }

  clearGenome(): boolean {
    return this.remove("genome");
  }

  // =========================================================
  // WONDER SESSION
  // =========================================================

  saveSession<T>(session: T): boolean {
    return this.save("session", session);
  }

  loadSession<T>(): T | null {
    return this.load<T>("session");
  }

  hasSession(): boolean {
    return this.exists("session");
  }

  clearSession(): boolean {
    return this.remove("session");
  }

  // =========================================================
  // WONDER STORY
  // =========================================================

  saveStory<T>(story: T): boolean {
    return this.save("story", story);
  }

  loadStory<T>(): T | null {
    return this.load<T>("story");
  }

  hasStory(): boolean {
    return this.exists("story");
  }

  clearStory(): boolean {
    return this.remove("story");
  }

  // =========================================================
  // WONDER MISSION
  // =========================================================

  saveMission<T>(mission: T): boolean {
    return this.save("mission", mission);
  }

  loadMission<T>(): T | null {
    return this.load<T>("mission");
  }

  hasMission(): boolean {
    return this.exists("mission");
  }

  clearMission(): boolean {
    return this.remove("mission");
  }

  // =========================================================
  // WONDER MOMENTS
  // =========================================================

  saveMoments<T>(
    moments: readonly T[]
  ): boolean {
    return this.save(
      "moments",
      [...moments]
    );
  }

  loadMoments<T>(): T[] {
    return this.load<T[]>("moments") ?? [];
  }

  addMoment<T>(moment: T): boolean {
    const moments =
      this.loadMoments<T>();

    return this.saveMoments([
      ...moments,
      moment,
    ]);
  }

  hasMoments(): boolean {
    return this.exists("moments");
  }

  clearMoments(): boolean {
    return this.remove("moments");
  }

  // =========================================================
  // FAMILY PROGRESS
  // =========================================================

  saveProgress<T>(progress: T): boolean {
    return this.save(
      "progress",
      progress
    );
  }

  loadProgress<T>(): T | null {
    return this.load<T>("progress");
  }

  hasProgress(): boolean {
    return this.exists("progress");
  }

  clearProgress(): boolean {
    return this.remove("progress");
  }

  // =========================================================
  // FRIENDSHIP
  // =========================================================

  saveFriendship<T>(
    friendship: T
  ): boolean {
    return this.save(
      "friendship",
      friendship
    );
  }

  loadFriendship<T>(): T | null {
    return this.load<T>("friendship");
  }

  hasFriendship(): boolean {
    return this.exists("friendship");
  }

  clearFriendship(): boolean {
    return this.remove("friendship");
  }

  // =========================================================
  // DAILY ADVENTURE
  // =========================================================

  saveDailyAdventure<T>(
    adventure: T
  ): boolean {
    return this.save(
      "dailyAdventure",
      adventure
    );
  }

  loadDailyAdventure<T>(): T | null {
    return this.load<T>(
      "dailyAdventure"
    );
  }

  hasDailyAdventure(): boolean {
    return this.exists(
      "dailyAdventure"
    );
  }

  clearDailyAdventure(): boolean {
    return this.remove(
      "dailyAdventure"
    );
  }

  // =========================================================
  // REWARDS
  // =========================================================

  saveRewards<T>(
    rewards: readonly T[]
  ): boolean {
    return this.save(
      "rewards",
      [...rewards]
    );
  }

  loadRewards<T>(): T[] {
    return this.load<T[]>("rewards") ?? [];
  }

  addReward<T>(reward: T): boolean {
    const rewards =
      this.loadRewards<T>();

    return this.saveRewards([
      ...rewards,
      reward,
    ]);
  }

  hasRewards(): boolean {
    return this.exists("rewards");
  }

  clearRewards(): boolean {
    return this.remove("rewards");
  }

  // =========================================================
  // REPOSITORY STATUS
  // =========================================================

  getStatus(): WonderRepositoryStatus {
    return {
      available: this.canUseStorage(),

      schemaVersion:
        WonderRepository.SCHEMA_VERSION,

      storedKeys:
        WONDER_STORAGE_KEYS.filter(
          (key) => this.exists(key)
        ),
    };
  }

  // =========================================================
  // RESET EVERYTHING
  // =========================================================

  clearAll(): boolean {
    if (!this.canUseStorage()) {
      return false;
    }

    try {
      /*
       * Copy matching keys first.
       *
       * Removing keys while iterating directly over
       * localStorage indexes can skip some entries.
       */
      const keysToRemove: string[] = [];

      for (
        let index = 0;
        index < window.localStorage.length;
        index += 1
      ) {
        const key =
          window.localStorage.key(index);

        if (
          key?.startsWith(
            `${WonderRepository.PREFIX}:`
          )
        ) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        window.localStorage.removeItem(key);
      }

      return true;
    } catch (error) {
      console.error(
        "[WonderRepository] Failed to clear repository.",
        error
      );

      return false;
    }
  }
}

function wonderJSONReplacer(
  this: Record<string, unknown>,
  key: string,
  value: unknown
): unknown {
  const originalValue =
    key === ""
      ? value
      : this[key];

  if (originalValue instanceof Date) {
    const marker: WonderDateMarker = {
      __wonderType: "Date",
      value:
        originalValue.toISOString(),
    };

    return marker;
  }

  return value;
}

function wonderJSONReviver(
  _key: string,
  value: unknown
): unknown {
  if (!isWonderDateMarker(value)) {
    return value;
  }

  const date = new Date(value.value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value.value;
  }

  return date;
}

function isWonderDateMarker(
  value: unknown
): value is WonderDateMarker {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record =
    value as Record<string, unknown>;

  return (
    record.__wonderType === "Date" &&
    typeof record.value === "string"
  );
}

export const wonderRepository =
  new WonderRepository();

export default WonderRepository;