import type { WonderTemplate } from "@/types/wonderTemplate";

export const DEFAULT_WONDER_TEMPLATE_ID = "tiny-mystery";

export const wonderTemplates: WonderTemplate[] = [
  {
    id: "tiny-mystery",
    name: "Tiny Mystery",
  },
  {
    id: "lost-and-found",
    name: "Lost and Found",
  },
  {
    id: "hidden-treasure",
    name: "Hidden Treasure",
  },
  {
    id: "helping-a-friend",
    name: "Helping a Friend",
  },
  {
    id: "new-friend",
    name: "New Friend",
  },
  {
    id: "secret-trail",
    name: "Secret Trail",
  },
  {
    id: "brave-journey",
    name: "Brave Journey",
  },
  {
    id: "build-a-dream",
    name: "Build a Dream",
  },
  {
    id: "magic-creation",
    name: "Magic Creation",
  },
  {
    id: "kind-surprise",
    name: "A Kind Surprise",
  },
  {
    id: "rescue-mission",
    name: "Rescue Mission",
  },
  {
    id: "story-spark",
    name: "Story Spark",
  },
  {
    id: "hidden-path",
    name: "Hidden Path",
  },
  {
    id: "wonder-discovery",
    name: "Wonder Discovery",
  },
  {
    id: "family-quest",
    name: "Family Quest",
  },
];

export function getDefaultWonderTemplate(): WonderTemplate {
  const template = wonderTemplates.find(
    (item) => item.id === DEFAULT_WONDER_TEMPLATE_ID
  );

  if (!template) {
    throw new Error(
      `Default Wonder Template "${DEFAULT_WONDER_TEMPLATE_ID}" was not found.`
    );
  }

  return template;
}

export function getWonderTemplateById(
  id: string
): WonderTemplate {
  const normalisedId = normaliseValue(id);

  return (
    wonderTemplates.find(
      (template) =>
        normaliseValue(template.id) === normalisedId
    ) ?? getDefaultWonderTemplate()
  );
}

export function getWonderTemplateByName(
  name: string
): WonderTemplate {
  const normalisedName = normaliseValue(name);

  return (
    wonderTemplates.find(
      (template) =>
        normaliseValue(template.name) === normalisedName
    ) ?? getDefaultWonderTemplate()
  );
}

export function getAllWonderTemplates(): WonderTemplate[] {
  return [...wonderTemplates];
}

export function isWonderTemplateId(
  id: string
): boolean {
  const normalisedId = normaliseValue(id);

  return wonderTemplates.some(
    (template) =>
      normaliseValue(template.id) === normalisedId
  );
}

function normaliseValue(value: string): string {
  return value.trim().toLowerCase();
}

export default wonderTemplates;