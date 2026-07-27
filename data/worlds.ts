import type { WonderWorld } from "@/types/wonderWorld";

export const DEFAULT_WONDER_WORLD_ID = "coral-world";

export const wonderWorlds: WonderWorld[] = [
  {
    id: "coral-world",
    name: "Coral World",
  },
  {
    id: "forest-world",
    name: "Forest World",
  },
  {
    id: "space-world",
    name: "Space World",
  },
  {
    id: "dream-world",
    name: "Dream World",
  },
  {
    id: "dinosaur-world",
    name: "Dinosaur World",
  },
  {
    id: "wonder-garden",
    name: "Wonder Garden",
  },
  {
    id: "sky-world",
    name: "Sky World",
  },
  {
    id: "jungle-world",
    name: "Jungle World",
  },
];

export function getDefaultWonderWorld(): WonderWorld {
  const world = wonderWorlds.find(
    (item) => item.id === DEFAULT_WONDER_WORLD_ID
  );

  if (!world) {
    throw new Error(
      `Default Wonder World "${DEFAULT_WONDER_WORLD_ID}" was not found.`
    );
  }

  return world;
}

export function getWonderWorldById(
  id: string
): WonderWorld {
  const normalisedId = normaliseValue(id);

  return (
    wonderWorlds.find(
      (world) =>
        normaliseValue(world.id) === normalisedId
    ) ?? getDefaultWonderWorld()
  );
}

export function getWonderWorldByName(
  name: string
): WonderWorld {
  const normalisedName = normaliseValue(name);

  return (
    wonderWorlds.find(
      (world) =>
        normaliseValue(world.name) === normalisedName
    ) ?? getDefaultWonderWorld()
  );
}

export function getAllWonderWorlds(): WonderWorld[] {
  return [...wonderWorlds];
}

export function isWonderWorldId(
  id: string
): boolean {
  const normalisedId = normaliseValue(id);

  return wonderWorlds.some(
    (world) =>
      normaliseValue(world.id) === normalisedId
  );
}

function normaliseValue(value: string): string {
  return value.trim().toLowerCase();
}

export default wonderWorlds;