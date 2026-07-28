export function hasText(
    value: unknown
  ): value is string {
    return (
      typeof value === "string" &&
      value.trim().length > 0
    );
  }
  
  export function isValidDate(
    value: unknown
  ): value is Date {
    return (
      value instanceof Date &&
      !Number.isNaN(value.getTime())
    );
  }
  
  export function normaliseRequiredText(
    value: string,
    fieldName: string
  ): string {
    const cleanedValue =
      value.trim();
  
    if (cleanedValue.length === 0) {
      throw new Error(
        `WonderMemoryEngine: "${fieldName}" is required.`
      );
    }
  
    return cleanedValue;
  }
  
  export function normaliseOptionalText(
    value:
      | string
      | null
      | undefined
  ): string | null {
    if (
      typeof value !== "string"
    ) {
      return null;
    }
  
    const cleanedValue =
      value.trim();
  
    return cleanedValue.length > 0
      ? cleanedValue
      : null;
  }
  
  export function normaliseValue(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase();
  }
  
  export function normaliseDate(
    value:
      | Date
      | undefined
  ): Date {
    return isValidDate(value)
      ? new Date(value.getTime())
      : new Date();
  }
  
  export function hydrateDate(
    value:
      | Date
      | string
  ): Date {
    if (value instanceof Date) {
      return new Date(
        value.getTime()
      );
    }
  
    const hydratedDate =
      new Date(value);
  
    return isValidDate(hydratedDate)
      ? hydratedDate
      : new Date();
  }
  
  export function normalisePositiveInteger(
    value: number,
    fallback: number
  ): number {
    if (
      !Number.isFinite(value) ||
      value < 1
    ) {
      return fallback;
    }
  
    return Math.floor(value);
  }
  
  export function normaliseNonNegativeInteger(
    value: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
      return 0;
    }
  
    return Math.max(
      0,
      Math.round(value)
    );
  }
  
  export function clampInteger(
    value: number,
    minimum: number,
    maximum: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
      return minimum;
    }
  
    return Math.min(
      maximum,
      Math.max(
        minimum,
        Math.floor(value)
      )
    );
  }
  
  export function roundNumber(
    value: number,
    decimalPlaces: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
  
    const safeDecimalPlaces =
      clampInteger(
        decimalPlaces,
        0,
        10
      );
  
    const multiplier =
      10 ** safeDecimalPlaces;
  
    return (
      Math.round(
        value * multiplier
      ) / multiplier
    );
  }
  
  export function createSlug(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }
  
  export function hashText(
    text: string
  ): number {
    let hash = 2166136261;
  
    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^= text.charCodeAt(
        index
      );
  
      hash = Math.imul(
        hash,
        16777619
      );
    }
  
    return hash >>> 0;
  }
  
  export function createLocalDateKey(
    date: Date
  ): string {
    const safeDate =
      isValidDate(date)
        ? date
        : new Date();
  
    return [
      safeDate.getFullYear(),
  
      String(
        safeDate.getMonth() + 1
      ).padStart(2, "0"),
  
      String(
        safeDate.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }
  
  export function dateKeyToLocalDate(
    dateKey: string
  ): Date {
    const parts =
      dateKey
        .split("-")
        .map(Number);
  
    const year =
      parts[0] ?? 1970;
  
    const month =
      parts[1] ?? 1;
  
    const day =
      parts[2] ?? 1;
  
    const date =
      new Date(
        year,
        month - 1,
        day
      );
  
    if (
      date.getFullYear() !== year ||
      date.getMonth() !==
        month - 1 ||
      date.getDate() !== day
    ) {
      return new Date(
        1970,
        0,
        1
      );
    }
  
    return date;
  }
  
  export function startOfLocalDay(
    date: Date
  ): Date {
    const safeDate =
      isValidDate(date)
        ? date
        : new Date();
  
    return new Date(
      safeDate.getFullYear(),
      safeDate.getMonth(),
      safeDate.getDate()
    );
  }
  
  export function differenceInCalendarDays(
    laterDate: Date,
    earlierDate: Date
  ): number {
    const millisecondsPerDay =
      24 * 60 * 60 * 1000;
  
    const safeLaterDate =
      startOfLocalDay(
        laterDate
      );
  
    const safeEarlierDate =
      startOfLocalDay(
        earlierDate
      );
  
    const laterUtc =
      Date.UTC(
        safeLaterDate.getFullYear(),
        safeLaterDate.getMonth(),
        safeLaterDate.getDate()
      );
  
    const earlierUtc =
      Date.UTC(
        safeEarlierDate.getFullYear(),
        safeEarlierDate.getMonth(),
        safeEarlierDate.getDate()
      );
  
    return Math.round(
      (laterUtc - earlierUtc) /
        millisecondsPerDay
    );
  }
  
  export function cloneDate(
    value: Date
  ): Date {
    return new Date(
      value.getTime()
    );
  }