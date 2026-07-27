import type {
    WonderStoryFragment,
    WonderStoryFragmentContext,
    WonderStoryFragmentType,
  } from "@/types/wonderStoryFragment";
  
  export interface WonderStoryFragmentFilter {
    type: WonderStoryFragmentType;
    templateId?: string;
    worldId?: string;
    valueId?: string;
    emotion?: string;
    age?: number;
  }
  
  export const wonderStoryFragments: WonderStoryFragment[] = [
    // =========================================================
    // INTROS
    // =========================================================
  
    {
      id: "intro-curious-sound",
      type: "intro",
      text:
        "{{friend}} was exploring {{location}} when a tiny sound made everyone stop and listen.",
      templateIds: [
        "tiny-mystery",
        "wonder-discovery",
        "secret-trail",
      ],
      worldIds: [],
      valueIds: ["curiosity"],
      emotions: ["wonder", "curiosity", "excitement"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "intro-mysterious-glow",
      type: "intro",
      text:
        "A soft glow appeared near {{location}}, and {{friend}} wondered where it had come from.",
      templateIds: [
        "tiny-mystery",
        "hidden-treasure",
        "magic-creation",
      ],
      worldIds: [],
      valueIds: ["curiosity", "creativity"],
      emotions: ["wonder", "curiosity"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "intro-lost-object",
      type: "intro",
      text:
        "While visiting {{location}}, {{friend}} discovered a small object that did not seem to belong there.",
      templateIds: [
        "lost-and-found",
        "tiny-mystery",
        "helping-a-friend",
      ],
      worldIds: [],
      valueIds: [
        "curiosity",
        "kindness",
        "responsibility",
      ],
      emotions: ["curiosity", "care"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "intro-new-friend",
      type: "intro",
      text:
        "{{friend}} noticed a shy new friend waiting quietly beside {{location}}.",
      templateIds: [
        "new-friend",
        "helping-a-friend",
        "kind-surprise",
      ],
      worldIds: [],
      valueIds: ["kindness", "empathy", "confidence"],
      emotions: ["kindness", "calm", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "intro-hidden-map",
      type: "intro",
      text:
        "A folded map floated towards {{friend}} and showed a secret path through {{world}}.",
      templateIds: [
        "hidden-treasure",
        "secret-trail",
        "family-quest",
        "hidden-path",
      ],
      worldIds: [],
      valueIds: [
        "curiosity",
        "bravery",
        "teamwork",
      ],
      emotions: ["excitement", "wonder"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "intro-creative-spark",
      type: "intro",
      text:
        "A colourful spark danced around {{friend}} and filled {{location}} with brand-new ideas.",
      templateIds: [
        "build-a-dream",
        "magic-creation",
        "story-spark",
      ],
      worldIds: [
        "dream-world",
        "wonder-garden",
        "sky-world",
      ],
      valueIds: ["creativity"],
      emotions: ["joy", "wonder", "playfulness"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "intro-brave-path",
      type: "intro",
      text:
        "{{friend}} reached a path in {{location}} that nobody had explored before.",
      templateIds: [
        "brave-journey",
        "hidden-path",
        "family-quest",
      ],
      worldIds: [],
      valueIds: [
        "bravery",
        "confidence",
        "perseverance",
      ],
      emotions: ["bravery", "excitement"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "intro-kindness-request",
      type: "intro",
      text:
        "Someone in {{location}} needed a little help, and {{friend}} knew that kindness could make a difference.",
      templateIds: [
        "helping-a-friend",
        "kind-surprise",
        "rescue-mission",
      ],
      worldIds: [],
      valueIds: [
        "kindness",
        "empathy",
        "teamwork",
      ],
      emotions: ["kindness", "hope", "care"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "intro-coral-bubbles",
      type: "intro",
      text:
        "{{friend}} followed a trail of shimmering bubbles through {{location}}.",
      templateIds: [
        "tiny-mystery",
        "secret-trail",
        "wonder-discovery",
      ],
      worldIds: ["coral-world"],
      valueIds: ["curiosity", "bravery"],
      emotions: ["wonder", "excitement"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "intro-forest-whisper",
      type: "intro",
      text:
        "The leaves in {{location}} whispered a gentle message to {{friend}}.",
      templateIds: [
        "tiny-mystery",
        "hidden-path",
        "wonder-discovery",
      ],
      worldIds: [
        "forest-world",
        "jungle-world",
        "wonder-garden",
      ],
      valueIds: ["curiosity", "empathy"],
      emotions: ["wonder", "calm"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    // =========================================================
    // PROBLEMS
    // =========================================================
  
    {
      id: "problem-missing-colours",
      type: "problem",
      text:
        "The colours around {{location}} were slowly fading, and nobody knew how to bring them back.",
      templateIds: [
        "tiny-mystery",
        "magic-creation",
        "wonder-discovery",
      ],
      worldIds: [],
      valueIds: [
        "creativity",
        "curiosity",
        "teamwork",
      ],
      emotions: ["concern", "curiosity", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "problem-lost-friend",
      type: "problem",
      text:
        "A little friend had wandered away from home and could not remember the path back.",
      templateIds: [
        "lost-and-found",
        "helping-a-friend",
        "rescue-mission",
      ],
      worldIds: [],
      valueIds: [
        "kindness",
        "empathy",
        "responsibility",
      ],
      emotions: ["care", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "problem-broken-bridge",
      type: "problem",
      text:
        "The tiny bridge ahead had come apart, and everyone needed a safe way to cross.",
      templateIds: [
        "family-quest",
        "brave-journey",
        "rescue-mission",
      ],
      worldIds: [],
      valueIds: [
        "teamwork",
        "creativity",
        "perseverance",
      ],
      emotions: ["challenge", "hope"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "problem-shy-newcomer",
      type: "problem",
      text:
        "The new friend wanted to join the adventure but felt too shy to say hello.",
      templateIds: [
        "new-friend",
        "helping-a-friend",
        "kind-surprise",
      ],
      worldIds: [],
      valueIds: [
        "empathy",
        "kindness",
        "confidence",
      ],
      emotions: ["shyness", "kindness", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "problem-incomplete-map",
      type: "problem",
      text:
        "Part of the map was missing, leaving the final path hidden from view.",
      templateIds: [
        "hidden-treasure",
        "secret-trail",
        "hidden-path",
        "family-quest",
      ],
      worldIds: [],
      valueIds: [
        "curiosity",
        "perseverance",
        "teamwork",
      ],
      emotions: ["curiosity", "challenge"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "problem-quiet-world",
      type: "problem",
      text:
        "{{world}} had become unusually quiet, as though everyone was waiting for something important.",
      templateIds: [
        "tiny-mystery",
        "wonder-discovery",
        "story-spark",
      ],
      worldIds: [],
      valueIds: [
        "curiosity",
        "empathy",
        "confidence",
      ],
      emotions: ["wonder", "curiosity"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "problem-creation-wont-work",
      type: "problem",
      text:
        "{{friend}} had a wonderful idea, but the first attempt did not work as planned.",
      templateIds: [
        "build-a-dream",
        "magic-creation",
        "story-spark",
      ],
      worldIds: [],
      valueIds: [
        "creativity",
        "perseverance",
        "confidence",
      ],
      emotions: ["challenge", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "problem-hidden-door",
      type: "problem",
      text:
        "A mysterious door appeared at {{location}}, but it would only open after a thoughtful choice.",
      templateIds: [
        "hidden-path",
        "tiny-mystery",
        "brave-journey",
      ],
      worldIds: [],
      valueIds: [
        "bravery",
        "responsibility",
        "curiosity",
      ],
      emotions: ["wonder", "bravery"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "problem-friends-disagree",
      type: "problem",
      text:
        "Two friends had different ideas about what to do next and needed help listening to each other.",
      templateIds: [
        "helping-a-friend",
        "family-quest",
        "new-friend",
      ],
      worldIds: [],
      valueIds: [
        "teamwork",
        "empathy",
        "kindness",
      ],
      emotions: ["care", "calm"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "problem-treasure-not-valuable",
      type: "problem",
      text:
        "The treasure chest was empty, making everyone wonder what the real treasure might be.",
      templateIds: [
        "hidden-treasure",
        "family-quest",
        "wonder-discovery",
      ],
      worldIds: [],
      valueIds: [
        "gratitude",
        "curiosity",
        "kindness",
      ],
      emotions: ["surprise", "wonder"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    // =========================================================
    // GOALS
    // =========================================================
  
    {
      id: "goal-follow-clues",
      type: "goal",
      text:
        "Can you help {{friend}} notice the clues and discover what is happening?",
      templateIds: [
        "tiny-mystery",
        "secret-trail",
        "hidden-treasure",
      ],
      worldIds: [],
      valueIds: ["curiosity"],
      emotions: ["curiosity", "excitement"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-help-friend",
      type: "goal",
      text:
        "Help {{friend}} find a gentle way to make the new friend feel welcome.",
      templateIds: [
        "new-friend",
        "helping-a-friend",
        "kind-surprise",
      ],
      worldIds: [],
      valueIds: ["kindness", "empathy"],
      emotions: ["kindness", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-create-solution",
      type: "goal",
      text:
        "Use your imagination to create something that could solve the problem.",
      templateIds: [
        "build-a-dream",
        "magic-creation",
        "story-spark",
      ],
      worldIds: [],
      valueIds: [
        "creativity",
        "perseverance",
      ],
      emotions: ["wonder", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-try-bravely",
      type: "goal",
      text:
        "Can your family help {{friend}} take one brave step and continue the journey?",
      templateIds: [
        "brave-journey",
        "hidden-path",
        "family-quest",
      ],
      worldIds: [],
      valueIds: [
        "bravery",
        "confidence",
        "perseverance",
      ],
      emotions: ["bravery", "hope"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "goal-work-together",
      type: "goal",
      text:
        "Work together, share your ideas and help everyone reach the other side.",
      templateIds: [
        "family-quest",
        "rescue-mission",
        "helping-a-friend",
      ],
      worldIds: [],
      valueIds: [
        "teamwork",
        "kindness",
        "responsibility",
      ],
      emotions: ["hope", "confidence"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-find-way-home",
      type: "goal",
      text:
        "Help {{friend}} discover the safest and kindest way to guide everyone home.",
      templateIds: [
        "lost-and-found",
        "rescue-mission",
        "secret-trail",
      ],
      worldIds: [],
      valueIds: [
        "responsibility",
        "kindness",
        "bravery",
      ],
      emotions: ["care", "hope"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-understand-feelings",
      type: "goal",
      text:
        "Listen carefully and help {{friend}} understand how everyone is feeling.",
      templateIds: [
        "helping-a-friend",
        "new-friend",
        "kind-surprise",
      ],
      worldIds: [],
      valueIds: [
        "empathy",
        "kindness",
      ],
      emotions: ["calm", "care"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-keep-trying",
      type: "goal",
      text:
        "Help {{friend}} try a new idea and keep going even if it takes more than one attempt.",
      templateIds: [
        "build-a-dream",
        "magic-creation",
        "brave-journey",
      ],
      worldIds: [],
      valueIds: [
        "perseverance",
        "creativity",
        "confidence",
      ],
      emotions: ["hope", "confidence"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-gratitude-discovery",
      type: "goal",
      text:
        "Look closely with {{friend}} and discover something wonderful that was there all along.",
      templateIds: [
        "wonder-discovery",
        "hidden-treasure",
        "tiny-mystery",
      ],
      worldIds: [],
      valueIds: [
        "gratitude",
        "curiosity",
      ],
      emotions: ["wonder", "gratitude"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "goal-responsible-choice",
      type: "goal",
      text:
        "Help {{friend}} choose an action that keeps {{location}} safe and cared for.",
      templateIds: [
        "family-quest",
        "rescue-mission",
        "wonder-discovery",
      ],
      worldIds: [],
      valueIds: [
        "responsibility",
        "kindness",
      ],
      emotions: ["care", "confidence"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    // =========================================================
    // CLOSINGS
    // =========================================================
  
    {
      id: "closing-colours-return",
      type: "closing",
      text:
        "The colours returned to {{location}}, and {{friend}} smiled as {{world}} became bright again.",
      templateIds: [
        "tiny-mystery",
        "magic-creation",
        "wonder-discovery",
      ],
      worldIds: [],
      valueIds: [
        "curiosity",
        "creativity",
        "teamwork",
      ],
      emotions: ["joy", "wonder"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "closing-friend-home",
      type: "closing",
      text:
        "The little friend returned home safely and thanked everyone for helping.",
      templateIds: [
        "lost-and-found",
        "helping-a-friend",
        "rescue-mission",
      ],
      worldIds: [],
      valueIds: [
        "kindness",
        "empathy",
        "responsibility",
      ],
      emotions: ["joy", "gratitude"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "closing-new-friendship",
      type: "closing",
      text:
        "A new friendship began, and nobody in {{location}} felt left out anymore.",
      templateIds: [
        "new-friend",
        "helping-a-friend",
        "kind-surprise",
      ],
      worldIds: [],
      valueIds: [
        "kindness",
        "empathy",
        "confidence",
      ],
      emotions: ["joy", "kindness"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "closing-creation-success",
      type: "closing",
      text:
        "After trying again, {{friend}} completed the creation and discovered that every attempt had helped.",
      templateIds: [
        "build-a-dream",
        "magic-creation",
        "story-spark",
      ],
      worldIds: [],
      valueIds: [
        "creativity",
        "perseverance",
        "confidence",
      ],
      emotions: ["joy", "confidence"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "closing-brave-step",
      type: "closing",
      text:
        "{{friend}} discovered that bravery did not mean feeling fearless. It meant taking one careful step forward.",
      templateIds: [
        "brave-journey",
        "hidden-path",
        "family-quest",
      ],
      worldIds: [],
      valueIds: [
        "bravery",
        "confidence",
        "perseverance",
      ],
      emotions: ["confidence", "hope"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "closing-teamwork",
      type: "closing",
      text:
        "Everyone shared a different idea, and together they created a solution that nobody could have made alone.",
      templateIds: [
        "family-quest",
        "rescue-mission",
        "helping-a-friend",
      ],
      worldIds: [],
      valueIds: [
        "teamwork",
        "creativity",
        "kindness",
      ],
      emotions: ["joy", "confidence"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "closing-real-treasure",
      type: "closing",
      text:
        "The real treasure was not inside a chest. It was the wonderful moment everyone had created together.",
      templateIds: [
        "hidden-treasure",
        "family-quest",
        "wonder-discovery",
      ],
      worldIds: [],
      valueIds: [
        "gratitude",
        "kindness",
        "teamwork",
      ],
      emotions: ["gratitude", "joy"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "closing-kindness-spreads",
      type: "closing",
      text:
        "One kind action inspired another, until all of {{location}} felt warmer and brighter.",
      templateIds: [
        "kind-surprise",
        "helping-a-friend",
        "new-friend",
      ],
      worldIds: [],
      valueIds: [
        "kindness",
        "empathy",
        "gratitude",
      ],
      emotions: ["kindness", "joy"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  
    {
      id: "closing-world-cared-for",
      type: "closing",
      text:
        "Because everyone made a responsible choice, {{location}} became a safer and happier place.",
      templateIds: [
        "rescue-mission",
        "family-quest",
        "wonder-discovery",
      ],
      worldIds: [],
      valueIds: [
        "responsibility",
        "teamwork",
        "kindness",
      ],
      emotions: ["confidence", "joy"],
      ageRange: {
        min: 5,
        max: 8,
      },
    },
  
    {
      id: "closing-wonder-day",
      type: "closing",
      text:
        "{{friend}} looked around {{world}} and knew that today had become another wonderful adventure.",
      templateIds: [],
      worldIds: [],
      valueIds: [],
      emotions: ["joy", "wonder", "gratitude"],
      ageRange: {
        min: 4,
        max: 8,
      },
    },
  ];
  
  // =========================================================
  // QUERIES
  // =========================================================
  
  export function getStoryFragmentById(
    id: string
  ): WonderStoryFragment | null {
    const normalisedId = normaliseValue(id);
  
    return (
      wonderStoryFragments.find(
        (fragment) =>
          normaliseValue(fragment.id) === normalisedId
      ) ?? null
    );
  }
  
  export function getStoryFragmentsByType(
    type: WonderStoryFragmentType
  ): WonderStoryFragment[] {
    return wonderStoryFragments.filter(
      (fragment) => fragment.type === type
    );
  }
  
  export function getCompatibleStoryFragments(
    filter: WonderStoryFragmentFilter
  ): WonderStoryFragment[] {
    const candidates = getStoryFragmentsByType(
      filter.type
    );
  
    const compatible = candidates.filter(
      (fragment) =>
        matchesOptionalList(
          fragment.templateIds,
          filter.templateId
        ) &&
        matchesOptionalList(
          fragment.worldIds,
          filter.worldId
        ) &&
        matchesOptionalList(
          fragment.valueIds,
          filter.valueId
        ) &&
        matchesOptionalList(
          fragment.emotions,
          filter.emotion
        ) &&
        matchesAge(
          fragment,
          filter.age
        )
    );
  
    /*
     * Every story section must always have a fallback.
     * If no perfect match exists, return all fragments
     * of the requested type that match the child's age.
     */
    if (compatible.length > 0) {
      return compatible;
    }
  
    const ageCompatible = candidates.filter(
      (fragment) =>
        matchesAge(fragment, filter.age)
    );
  
    return ageCompatible.length > 0
      ? ageCompatible
      : candidates;
  }
  
  export function renderStoryFragment(
    fragment: WonderStoryFragment,
    context: WonderStoryFragmentContext
  ): string {
    return fragment.text
      .replaceAll(
        "{{friend}}",
        context.friend
      )
      .replaceAll(
        "{{world}}",
        context.world
      )
      .replaceAll(
        "{{location}}",
        context.location
      )
      .replaceAll(
        "{{value}}",
        context.value
      )
      .trim();
  }
  
  export function getAllStoryFragments(): WonderStoryFragment[] {
    return [...wonderStoryFragments];
  }
  
  // =========================================================
  // INTERNAL HELPERS
  // =========================================================
  
  function matchesOptionalList(
    values: readonly string[],
    selectedValue?: string
  ): boolean {
    /*
     * An empty list means the fragment is universal.
     */
    if (values.length === 0) {
      return true;
    }
  
    if (!selectedValue) {
      return true;
    }
  
    const normalisedSelected =
      normaliseValue(selectedValue);
  
    return values.some(
      (value) =>
        normaliseValue(value) ===
        normalisedSelected
    );
  }
  
  function matchesAge(
    fragment: WonderStoryFragment,
    age?: number
  ): boolean {
    if (age === undefined) {
      return true;
    }
  
    if (!Number.isFinite(age)) {
      return true;
    }
  
    return (
      age >= fragment.ageRange.min &&
      age <= fragment.ageRange.max
    );
  }
  
  function normaliseValue(
    value: string
  ): string {
    return value.trim().toLowerCase();
  }
  
  export default wonderStoryFragments;