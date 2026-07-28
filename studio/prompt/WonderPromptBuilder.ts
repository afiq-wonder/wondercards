import type {
    WonderStudioContentType,
    WonderStudioGenerationRequest,
    WonderStudioPrompt,
  } from "../types/WonderStudioTypes";
  
  const MIN_QUANTITY = 1;
  const MAX_QUANTITY = 500;
  
  const DEFAULT_LANGUAGE = "English";
  const DEFAULT_LOCALE = "en-GB";
  
  const WONDER_STUDIO_PROMPT_VERSION = 1;
  
  /**
   * Converts Wonder Studio generation requests into strict,
   * reusable AI prompts.
   *
   * The generated prompt is intended for development-time
   * content production only.
   *
   * Runtime applications should consume validated catalog data
   * and should not call AI models directly.
   */
  export class WonderPromptBuilder {
    /**
     * Builds one complete AI prompt from a Studio request.
     */
    build(
      request: WonderStudioGenerationRequest
    ): WonderStudioPrompt {
      const cleanRequest =
        normaliseGenerationRequest(request);
  
      validateGenerationRequest(
        cleanRequest
      );
  
      const createdAt = new Date();
  
      return {
        id: createPromptId(
          cleanRequest,
          createdAt
        ),
  
        batchId: cleanRequest.id,
  
        createdAt,
  
        system:
          this.buildSystemPrompt(
            cleanRequest
          ),
  
        user:
          this.buildUserPrompt(
            cleanRequest
          ),
  
        expectedContentType:
          cleanRequest.contentType,
  
        expectedQuantity:
          cleanRequest.quantity,
      };
    }
  
    /**
     * Alias for build().
     */
    buildPrompt(
      request: WonderStudioGenerationRequest
    ): WonderStudioPrompt {
      return this.build(request);
    }
  
    /**
     * Builds only the system instruction.
     */
    buildSystemPrompt(
      request: WonderStudioGenerationRequest
    ): string {
      const cleanRequest =
        normaliseGenerationRequest(request);
  
      validateGenerationRequest(
        cleanRequest
      );
  
      const outputSchema =
        createOutputSchema(
          cleanRequest.contentType
        );
  
      return [
        "You are Wonder Studio, the educational content authoring system for WonderLabs.",
        "",
        "Your role is to create high-quality interactive adventures for children.",
        "",
        "WONDERLABS CORE PRINCIPLES",
        "",
        "- Every experience should encourage family connection.",
        "- Every experience should inspire safe offline play.",
        "- Every experience should strengthen imagination.",
        "- Every experience should focus on one clear educational value.",
        "- Every experience should create a memorable Wonder Moment.",
        "- Every experience should end with hope, warmth, or encouragement.",
        "- Content must be emotionally safe.",
        "- Content must be suitable for the requested age range.",
        "- Never shame, frighten, pressure, or manipulate children.",
        "- Never include violence, horror, cruelty, dangerous imitation, or adult themes.",
        "- Never encourage unsupervised risky behaviour.",
        "- Never reward excessive screen time.",
        "",
        "WRITING STYLE",
        "",
        "- Warm",
        "- Gentle",
        "- Playful",
        "- Magical",
        "- Clear",
        "- Short sentences",
        "- Age-appropriate vocabulary",
        "- Easy for a parent to read aloud",
        "- Designed to transition from screen activity to real-world activity",
        "",
        "CONTENT QUALITY REQUIREMENTS",
        "",
        "- Each item must be meaningfully different.",
        "- Avoid repeating plots, sentences, activities, titles, or solutions.",
        "- Avoid generic filler.",
        "- Avoid vague learning objectives.",
        "- Make every activity practical and achievable.",
        "- Use only common household supplies unless specifically requested.",
        "- Keep the selected Wonder Value visible throughout the experience.",
        "- The child must feel capable, included, and encouraged.",
        "",
        "OUTPUT RULES",
        "",
        "- Return only valid JSON.",
        "- Do not use Markdown.",
        "- Do not add explanations before or after the JSON.",
        "- Do not wrap the JSON in code fences.",
        "- Use double quotes for every JSON property and string.",
        "- Do not include comments.",
        "- Do not include trailing commas.",
        `- Return exactly ${cleanRequest.quantity} content item${cleanRequest.quantity === 1 ? "" : "s"}.`,
        "- Every generated item must have a unique temporaryId.",
        "- Every generated item must follow the exact schema below.",
        "",
        "REQUIRED JSON SCHEMA",
        "",
        outputSchema,
      ].join("\n");
    }
  
    /**
     * Builds only the user instruction.
     */
    buildUserPrompt(
      request: WonderStudioGenerationRequest
    ): string {
      const cleanRequest =
        normaliseGenerationRequest(request);
  
      validateGenerationRequest(
        cleanRequest
      );
  
      const sections: string[] = [
        "Create a WonderLabs content batch using the following production brief.",
        "",
        "BATCH",
        `Batch ID: ${cleanRequest.id}`,
        `Prompt Version: ${WONDER_STUDIO_PROMPT_VERSION}`,
        `Content Type: ${cleanRequest.contentType}`,
        `Quantity: ${cleanRequest.quantity}`,
        `Seed: ${cleanRequest.seed ?? cleanRequest.id}`,
        "",
        "AUDIENCE",
        `Language: ${cleanRequest.language}`,
        `Locale: ${cleanRequest.locale}`,
        `Minimum Age: ${cleanRequest.ageRange.min}`,
        `Maximum Age: ${cleanRequest.ageRange.max}`,
        `Difficulty: ${cleanRequest.difficulty}`,
        `Target Duration: ${cleanRequest.duration} minutes`,
        "",
        "WONDER CATALOG REFERENCES",
        `Friend ID: ${cleanRequest.friendId}`,
        `World ID: ${cleanRequest.worldId}`,
        `Value ID: ${cleanRequest.valueId}`,
        `Template ID: ${cleanRequest.templateId}`,
      ];
  
      if (cleanRequest.archetypeId) {
        sections.push(
          `Archetype ID: ${cleanRequest.archetypeId}`
        );
      }
  
      if (cleanRequest.emotion) {
        sections.push(
          `Emotion: ${cleanRequest.emotion}`
        );
      }
  
      if (cleanRequest.location) {
        sections.push(
          `Location: ${cleanRequest.location}`
        );
      }
  
      appendOptionalSection(
        sections,
        "TITLE DIRECTION",
        cleanRequest.titleDirection
      );
  
      appendOptionalSection(
        sections,
        "CREATIVE DIRECTION",
        cleanRequest.creativeDirection
      );
  
      appendOptionalSection(
        sections,
        "LEARNING OBJECTIVE",
        cleanRequest.learningObjective
      );
  
      appendListSection(
        sections,
        "REQUIRED WORDS",
        cleanRequest.requiredWords
      );
  
      appendListSection(
        sections,
        "BANNED WORDS",
        cleanRequest.bannedWords
      );
  
      appendListSection(
        sections,
        "CONTENT TAGS",
        cleanRequest.tags
      );
  
      sections.push(
        "",
        "FINAL PRODUCTION INSTRUCTIONS",
        "",
        `Generate exactly ${cleanRequest.quantity} ${getContentTypeLabel(cleanRequest.contentType)} item${cleanRequest.quantity === 1 ? "" : "s"}.`,
        "Ensure each item has a distinct title, premise, activity, and emotional moment.",
        "Keep all catalog IDs exactly as supplied.",
        "Do not invent replacement IDs.",
        "The output must be parseable directly with JSON.parse().",
        "Return only the JSON object."
      );
  
      return sections.join("\n");
    }
  
    /**
     * Builds several prompts by splitting a large request into
     * smaller deterministic batches.
     *
     * Useful when an AI provider performs better with smaller outputs.
     */
    buildBatches(
      request: WonderStudioGenerationRequest,
      batchSize = 25
    ): WonderStudioPrompt[] {
      const cleanRequest =
        normaliseGenerationRequest(request);
  
      validateGenerationRequest(
        cleanRequest
      );
  
      const safeBatchSize =
        clampInteger(
          batchSize,
          MIN_QUANTITY,
          MAX_QUANTITY
        );
  
      const prompts: WonderStudioPrompt[] =
        [];
  
      let remaining =
        cleanRequest.quantity;
  
      let batchIndex = 1;
  
      while (remaining > 0) {
        const quantity =
          Math.min(
            safeBatchSize,
            remaining
          );
  
        const batchRequest: WonderStudioGenerationRequest = {
          ...cleanRequest,
  
          id:
            `${cleanRequest.id}-part-${String(batchIndex).padStart(3, "0")}`,
  
          quantity,
  
          seed:
            combineSeed(
              cleanRequest.seed ??
                cleanRequest.id,
              `part-${batchIndex}`
            ),
  
          createdAt:
            new Date(
              cleanRequest.createdAt.getTime()
            ),
  
          ageRange: {
            ...cleanRequest.ageRange,
          },
  
          requiredWords: [
            ...(cleanRequest.requiredWords ??
              []),
          ],
  
          bannedWords: [
            ...(cleanRequest.bannedWords ??
              []),
          ],
  
          tags: [
            ...(cleanRequest.tags ?? []),
          ],
        };
  
        prompts.push(
          this.build(batchRequest)
        );
  
        remaining -= quantity;
        batchIndex += 1;
      }
  
      return prompts;
    }
  }
  
  // =========================================================
  // OUTPUT SCHEMAS
  // =========================================================
  
  function createOutputSchema(
    contentType: WonderStudioContentType
  ): string {
    switch (contentType) {
      case "story":
        return createStorySchema();
  
      case "mission":
        return createMissionSchema();
  
      case "adventure":
        return createAdventureSchema();
  
      default:
        return assertNever(contentType);
    }
  }
  
  function createStorySchema(): string {
    return JSON.stringify(
      {
        batchId: "",
        contentType: "story",
        items: [
          {
            temporaryId: "",
            metadata: {
              friendId: "",
              worldId: "",
              valueId: "",
              templateId: "",
              language: "",
              locale: "",
              ageRange: {
                min: 0,
                max: 0,
              },
              difficulty: "easy",
              duration: 0,
              emotion: "",
              location: "",
              tags: [],
            },
            story: {
              title: "",
              intro: "",
              problem: "",
              goal: "",
              closing: "",
            },
          },
        ],
      },
      null,
      2
    );
  }
  
  function createMissionSchema(): string {
    return JSON.stringify(
      {
        batchId: "",
        contentType: "mission",
        items: [
          {
            temporaryId: "",
            metadata: {
              friendId: "",
              worldId: "",
              valueId: "",
              templateId: "",
              language: "",
              locale: "",
              ageRange: {
                min: 0,
                max: 0,
              },
              difficulty: "easy",
              duration: 0,
              emotion: "",
              location: "",
              tags: [],
            },
            mission: {
              title: "",
              objective: "",
              activity: "",
              successMessage: "",
              supplies: [],
            },
          },
        ],
      },
      null,
      2
    );
  }
  
  function createAdventureSchema(): string {
    return JSON.stringify(
      {
        batchId: "",
        contentType: "adventure",
        items: [
          {
            temporaryId: "",
            metadata: {
              friendId: "",
              worldId: "",
              valueId: "",
              templateId: "",
              language: "",
              locale: "",
              ageRange: {
                min: 0,
                max: 0,
              },
              difficulty: "easy",
              duration: 0,
              emotion: "",
              location: "",
              tags: [],
            },
            story: {
              title: "",
              intro: "",
              problem: "",
              goal: "",
              closing: "",
            },
            mission: {
              title: "",
              objective: "",
              activity: "",
              successMessage: "",
              supplies: [],
            },
          },
        ],
      },
      null,
      2
    );
  }
  
  // =========================================================
  // VALIDATION
  // =========================================================
  
  function validateGenerationRequest(
    request: WonderStudioGenerationRequest
  ): void {
    const requiredTextFields: Array<{
      field: string;
      value: string;
    }> = [
      {
        field: "id",
        value: request.id,
      },
      {
        field: "language",
        value: request.language,
      },
      {
        field: "locale",
        value: request.locale,
      },
      {
        field: "friendId",
        value: request.friendId,
      },
      {
        field: "worldId",
        value: request.worldId,
      },
      {
        field: "valueId",
        value: request.valueId,
      },
      {
        field: "templateId",
        value: request.templateId,
      },
    ];
  
    for (const item of requiredTextFields) {
      if (!hasText(item.value)) {
        throw new Error(
          `WonderPromptBuilder: "${item.field}" is required.`
        );
      }
    }
  
    if (
      !isStudioContentType(
        request.contentType
      )
    ) {
      throw new Error(
        'WonderPromptBuilder: "contentType" is invalid.'
      );
    }
  
    if (
      !Number.isInteger(
        request.quantity
      ) ||
      request.quantity <
        MIN_QUANTITY ||
      request.quantity >
        MAX_QUANTITY
    ) {
      throw new Error(
        `WonderPromptBuilder: "quantity" must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}.`
      );
    }
  
    if (
      !Number.isFinite(
        request.ageRange.min
      ) ||
      !Number.isFinite(
        request.ageRange.max
      ) ||
      request.ageRange.min < 0 ||
      request.ageRange.max <
        request.ageRange.min
    ) {
      throw new Error(
        'WonderPromptBuilder: "ageRange" is invalid.'
      );
    }
  
    if (
      !Number.isFinite(
        request.duration
      ) ||
      request.duration <= 0
    ) {
      throw new Error(
        'WonderPromptBuilder: "duration" must be greater than zero.'
      );
    }
  
    if (
      !isValidDate(
        request.createdAt
      )
    ) {
      throw new Error(
        'WonderPromptBuilder: "createdAt" must be a valid Date.'
      );
    }
  }
  
  // =========================================================
  // NORMALISATION
  // =========================================================
  
  function normaliseGenerationRequest(
    request: WonderStudioGenerationRequest
  ): WonderStudioGenerationRequest {
    return {
      ...request,
  
      id:
        normaliseRequiredText(
          request.id,
          "studio-batch"
        ),
  
      createdAt:
        isValidDate(
          request.createdAt
        )
          ? new Date(
              request.createdAt.getTime()
            )
          : new Date(),
  
      quantity:
        clampInteger(
          request.quantity,
          MIN_QUANTITY,
          MAX_QUANTITY
        ),
  
      language:
        normaliseOptionalText(
          request.language
        ) ?? DEFAULT_LANGUAGE,
  
      locale:
        normaliseOptionalText(
          request.locale
        ) ?? DEFAULT_LOCALE,
  
      friendId:
        normaliseRequiredText(
          request.friendId,
          "unknown-friend"
        ),
  
      worldId:
        normaliseRequiredText(
          request.worldId,
          "unknown-world"
        ),
  
      valueId:
        normaliseRequiredText(
          request.valueId,
          "unknown-value"
        ),
  
      templateId:
        normaliseRequiredText(
          request.templateId,
          "unknown-template"
        ),
  
      ageRange: {
        min:
          normaliseNonNegativeInteger(
            request.ageRange.min
          ),
  
        max: Math.max(
          normaliseNonNegativeInteger(
            request.ageRange.min
          ),
          normaliseNonNegativeInteger(
            request.ageRange.max
          )
        ),
      },
  
      duration: Math.max(
        1,
        normalisePositiveInteger(
          request.duration,
          5
        )
      ),
  
      emotion:
        normaliseOptionalText(
          request.emotion
        ) ?? undefined,
  
      location:
        normaliseOptionalText(
          request.location
        ) ?? undefined,
  
      archetypeId:
        normaliseOptionalText(
          request.archetypeId
        ) ?? undefined,
  
      titleDirection:
        normaliseOptionalText(
          request.titleDirection
        ) ?? undefined,
  
      creativeDirection:
        normaliseOptionalText(
          request.creativeDirection
        ) ?? undefined,
  
      learningObjective:
        normaliseOptionalText(
          request.learningObjective
        ) ?? undefined,
  
      requiredWords:
        normaliseStringList(
          request.requiredWords
        ),
  
      bannedWords:
        normaliseStringList(
          request.bannedWords
        ),
  
      tags:
        normaliseStringList(
          request.tags
        ),
  
      seed:
        normaliseOptionalText(
          request.seed
        ) ?? undefined,
    };
  }
  
  function normaliseStringList(
    values:
      | string[]
      | undefined
  ): string[] {
    if (!values) {
      return [];
    }
  
    return Array.from(
      new Set(
        values
          .map(
            normaliseOptionalText
          )
          .filter(
            (
              value
            ): value is string =>
              value !== null
          )
      )
    );
  }
  
  function normaliseRequiredText(
    value: string,
    fallback: string
  ): string {
    const cleaned =
      value.trim();
  
    return cleaned.length > 0
      ? cleaned
      : fallback;
  }
  
  function normaliseOptionalText(
    value:
      | string
      | undefined
      | null
  ): string | null {
    if (
      typeof value !== "string"
    ) {
      return null;
    }
  
    const cleaned =
      value.trim();
  
    return cleaned.length > 0
      ? cleaned
      : null;
  }
  
  function normaliseNonNegativeInteger(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
  
    return Math.max(
      0,
      Math.floor(value)
    );
  }
  
  function normalisePositiveInteger(
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
  
  function clampInteger(
    value: number,
    minimum: number,
    maximum: number
  ): number {
    if (!Number.isFinite(value)) {
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
  
  // =========================================================
  // PROMPT HELPERS
  // =========================================================
  
  function appendOptionalSection(
    sections: string[],
    title: string,
    value: string | undefined
  ): void {
    if (!value) {
      return;
    }
  
    sections.push(
      "",
      title,
      value
    );
  }
  
  function appendListSection(
    sections: string[],
    title: string,
    values:
      | string[]
      | undefined
  ): void {
    if (
      !values ||
      values.length === 0
    ) {
      return;
    }
  
    sections.push(
      "",
      title,
      ...values.map(
        (value) => `- ${value}`
      )
    );
  }
  
  function getContentTypeLabel(
    contentType: WonderStudioContentType
  ): string {
    switch (contentType) {
      case "story":
        return "story";
  
      case "mission":
        return "mission";
  
      case "adventure":
        return "complete adventure";
  
      default:
        return assertNever(contentType);
    }
  }
  
  function combineSeed(
    first: string,
    second: string
  ): string {
    return `${first}:${second}`;
  }
  
  // =========================================================
  // IDS
  // =========================================================
  
  function createPromptId(
    request: WonderStudioGenerationRequest,
    createdAt: Date
  ): string {
    const source = [
      request.id,
      request.contentType,
      request.quantity,
      request.seed ?? "",
      createdAt.toISOString(),
    ].join(":");
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(7, "0");
  
    return `wonder-studio-prompt-${hash}`;
  }
  
  function hashText(
    text: string
  ): number {
    let hash = 2166136261;
  
    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^= text.charCodeAt(index);
  
      hash = Math.imul(
        hash,
        16777619
      );
    }
  
    return hash >>> 0;
  }
  
  // =========================================================
  // TYPE HELPERS
  // =========================================================
  
  function hasText(
    value: string
  ): boolean {
    return value.trim().length > 0;
  }
  
  function isValidDate(
    value: unknown
  ): value is Date {
    return (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime()
      )
    );
  }
  
  function isStudioContentType(
    value: string
  ): value is WonderStudioContentType {
    return (
      value === "story" ||
      value === "mission" ||
      value === "adventure"
    );
  }
  
  function assertNever(
    value: never
  ): never {
    throw new Error(
      `WonderPromptBuilder: unsupported content type "${String(value)}".`
    );
  }
  
  export const wonderPromptBuilder =
    new WonderPromptBuilder();
  
  export default WonderPromptBuilder;