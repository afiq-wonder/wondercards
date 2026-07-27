import type { WonderValue } from "@/types/wonderValue";

export const DEFAULT_WONDER_VALUE_ID = "curiosity";

export const wonderValues: WonderValue[] = [
  {
    id: "curiosity",
    name: "Curiosity",
  },
  {
    id: "kindness",
    name: "Kindness",
  },
  {
    id: "bravery",
    name: "Bravery",
  },
  {
    id: "gratitude",
    name: "Gratitude",
  },
  {
    id: "creativity",
    name: "Creativity",
  },
  {
    id: "teamwork",
    name: "Teamwork",
  },
  {
    id: "empathy",
    name: "Empathy",
  },
  {
    id: "responsibility",
    name: "Responsibility",
  },
  {
    id: "perseverance",
    name: "Perseverance",
  },
  {
    id: "confidence",
    name: "Confidence",
  },
];

export function getDefaultWonderValue(): WonderValue {
  const value = wonderValues.find(
    (item) => item.id === DEFAULT_WONDER_VALUE_ID
  );

  if (!value) {
    throw new Error(
      `Default Wonder Value "${DEFAULT_WONDER_VALUE_ID}" was not found.`
    );
  }

  return value;
}

export function getWonderValueById(
  id: string
): WonderValue {
  const normalisedId = normaliseValue(id);

  return (
    wonderValues.find(
      (value) =>
        normaliseValue(value.id) === normalisedId
    ) ?? getDefaultWonderValue()
  );
}

export function getWonderValueByName(
  name: string
): WonderValue {
  const normalisedName = normaliseValue(name);

  return (
    wonderValues.find(
      (value) =>
        normaliseValue(value.name) === normalisedName
    ) ?? getDefaultWonderValue()
  );
}

export function getAllWonderValues(): WonderValue[] {
  return [...wonderValues];
}

export function isWonderValueId(
  id: string
): boolean {
  const normalisedId = normaliseValue(id);

  return wonderValues.some(
    (value) =>
      normaliseValue(value.id) === normalisedId
  );
}

function normaliseValue(value: string): string {
  return value.trim().toLowerCase();
}

export default wonderValues;