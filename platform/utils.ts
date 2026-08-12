export function createId(prefix: string): string {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomPart}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function hashString(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function selectDeterministically<T>(
  items: readonly T[],
  seed: string,
): T {
  if (items.length === 0) {
    throw new Error("Cannot select from an empty collection.");
  }

  return items[hashString(seed) % items.length] as T;
}
