import type {
    WonderStudioBatch,
    WonderStudioContentType,
    WonderStudioDraft,
    WonderStudioMissionContent,
    WonderStudioQualityScores,
    WonderStudioStoryContent,
    WonderStudioValidationIssue,
    WonderStudioValidationResult,
    WonderStudioValidationSeverity,
  } from "../types/WonderStudioTypes";
  
  export interface WonderContentValidatorOptions {
    /**
     * Minimum overall score required for automatic approval.
     *
     * Score range: 0–10.
     */
    minimumOverallScore?: number;
  
    /**
     * Minimum score required for every critical quality category.
     *
     * Score range: 0–10.
     */
    minimumCriticalScore?: number;
  
    /**
     * Additional banned words or phrases.
     */
    bannedWords?: readonly string[];
  
    /**
     * Words that must appear somewhere in the content.
     */
    requiredWords?: readonly string[];
  
    /**
     * Previously approved drafts used for duplicate detection.
     */
    existingDrafts?: readonly WonderStudioDraft[];
  
    /**
     * Duplicate similarity threshold.
     *
     * Range: 0–1.
     */
    duplicateThreshold?: number;
  
    /**
     * Whether warnings should cause validation failure.
     */
    warningsAreErrors?: boolean;
  }
  
  export interface WonderDraftValidationRecord {
    draft: WonderStudioDraft;
  
    result: WonderStudioValidationResult;
  }
  
  export interface WonderBatchValidationSummary {
    valid: boolean;
  
    validatedAt: Date;
  
    totalDrafts: number;
  
    validDrafts: number;
  
    invalidDrafts: number;
  
    averageOverallScore: number;
  
    records: WonderDraftValidationRecord[];
  }
  
  interface ValidationContext {
    issues: WonderStudioValidationIssue[];
  
    options: Required<
      Omit<
        WonderContentValidatorOptions,
        "existingDrafts"
      >
    > & {
      existingDrafts: readonly WonderStudioDraft[];
    };
  }
  
  interface ContentTextCollection {
    all: string;
  
    title: string;
  
    story: string;
  
    mission: string;
  }
  
  const DEFAULT_MINIMUM_OVERALL_SCORE = 7.5;
  
  const DEFAULT_MINIMUM_CRITICAL_SCORE = 7;
  
  const DEFAULT_DUPLICATE_THRESHOLD = 0.82;
  
  const MINIMUM_TITLE_LENGTH = 3;
  
  const MAXIMUM_TITLE_LENGTH = 90;
  
  const MINIMUM_STORY_SECTION_LENGTH = 12;
  
  const MAXIMUM_STORY_SECTION_LENGTH = 700;
  
  const MINIMUM_MISSION_SECTION_LENGTH = 8;
  
  const MAXIMUM_MISSION_SECTION_LENGTH = 700;
  
  const MAXIMUM_SUPPLIES = 10;
  
  const MAXIMUM_TAGS = 20;
  
  const MAXIMUM_DURATION = 60;
  
  const DEFAULT_BANNED_WORDS: readonly string[] = [
    "kill",
    "killing",
    "murder",
    "murdering",
    "blood",
    "bloody",
    "weapon",
    "weapons",
    "gun",
    "guns",
    "knife",
    "knives",
    "suicide",
    "die",
    "death",
    "dead body",
    "horror",
    "terrifying",
    "nightmare",
    "monster will eat",
    "hate you",
    "stupid child",
    "bad child",
    "useless",
    "punishment",
    "punish the child",
    "keep it secret from your parents",
    "do not tell your parents",
    "run away from home",
    "meet a stranger",
    "play with fire",
    "touch the stove",
    "drink medicine",
    "take medicine alone",
    "cross the road alone",
    "climb onto the roof",
    "jump from",
    "hold your breath",
    "choking game",
    "gambling",
    "bet money",
    "alcohol",
    "cigarette",
    "vape",
    "drug",
    "drugs",
  ];
  
  const RISKY_ACTIVITY_PHRASES: readonly string[] = [
    "use a sharp knife",
    "use sharp scissors alone",
    "light a fire",
    "start a fire",
    "touch boiling water",
    "boil water alone",
    "cook without an adult",
    "leave the house alone",
    "go outside alone at night",
    "talk to strangers",
    "meet a stranger",
    "climb a tall tree",
    "climb on furniture",
    "stand on a chair",
    "jump from a height",
    "swim without an adult",
    "hold your breath underwater",
    "taste an unknown plant",
    "eat an unknown berry",
    "mix cleaning products",
    "use chemicals",
    "open medicine",
    "take medicine",
    "use a power tool",
    "plug in",
    "touch an electrical socket",
  ];
  
  const SHAMING_PHRASES: readonly string[] = [
    "you failed",
    "you are bad",
    "you are naughty",
    "you are stupid",
    "you are useless",
    "only good children",
    "good children always",
    "do not disappoint",
    "everyone will laugh",
    "your parents will be angry",
    "you should be ashamed",
    "stop being a baby",
  ];
  
  const SCREEN_REWARD_PHRASES: readonly string[] = [
    "earn more screen time",
    "reward yourself with screen time",
    "watch more videos",
    "play on the tablet",
    "unlock more phone time",
    "use your phone as a reward",
  ];
  
  const OFFLINE_ACTION_WORDS: readonly string[] = [
    "draw",
    "colour",
    "color",
    "create",
    "build",
    "make",
    "pretend",
    "imagine",
    "talk",
    "share",
    "tell",
    "act",
    "move",
    "walk",
    "find",
    "look",
    "listen",
    "sort",
    "count",
    "write",
    "craft",
    "paper",
    "pencil",
    "crayon",
    "blocks",
    "family",
    "together",
  ];
  
  const POSITIVE_CLOSING_WORDS: readonly string[] = [
    "hope",
    "proud",
    "together",
    "wonderful",
    "kind",
    "brave",
    "ready",
    "smile",
    "happy",
    "safe",
    "friend",
    "friends",
    "adventure",
    "again",
    "next time",
    "well done",
    "you did it",
  ];
  
  const EDUCATIONAL_WORDS: readonly string[] = [
    "learn",
    "notice",
    "discover",
    "explore",
    "practise",
    "practice",
    "remember",
    "understand",
    "question",
    "think",
    "imagine",
    "create",
    "kindness",
    "curiosity",
    "courage",
    "patience",
    "gratitude",
    "sharing",
    "helping",
    "teamwork",
  ];
  
  const EMOTIONAL_WORDS: readonly string[] = [
    "feel",
    "feeling",
    "feelings",
    "kind",
    "care",
    "calm",
    "proud",
    "happy",
    "hope",
    "brave",
    "safe",
    "together",
    "friend",
    "share",
    "listen",
  ];
  
  const CREATIVE_WORDS: readonly string[] = [
    "imagine",
    "create",
    "invent",
    "pretend",
    "design",
    "dream",
    "magical",
    "mystery",
    "wonder",
    "colour",
    "color",
    "story",
    "build",
  ];
  
  /**
   * Validates Wonder Studio content before it can enter
   * the production catalog.
   *
   * Validation includes:
   *
   * - schema checks
   * - catalog metadata checks
   * - child-safety checks
   * - age suitability checks
   * - educational quality checks
   * - offline activity checks
   * - duplicate detection
   * - quality scoring
   */
  export class WonderContentValidator {
    validateDraft(
      draft: WonderStudioDraft,
      options: WonderContentValidatorOptions = {}
    ): WonderStudioValidationResult {
      const context: ValidationContext = {
        issues: [],
  
        options:
          normaliseValidatorOptions(
            options
          ),
      };
  
      this.validateDraftSchema(
        draft,
        context
      );
  
      this.validateMetadata(
        draft,
        context
      );
  
      this.validateContentType(
        draft,
        context
      );
  
      this.validateStory(
        draft.story,
        draft.contentType,
        context
      );
  
      this.validateMission(
        draft.mission,
        draft.contentType,
        context
      );
  
      const texts =
        collectDraftText(draft);
  
      this.validateSafety(
        texts,
        context
      );
  
      this.validateRequiredWords(
        texts,
        context
      );
  
      this.validateAgeSuitability(
        draft,
        texts,
        context
      );
  
      this.validateOfflinePlay(
        draft,
        texts,
        context
      );
  
      this.validateDuplicateContent(
        draft,
        context
      );
  
      const scores =
        this.calculateQualityScores(
          draft,
          texts,
          context.issues
        );
  
      this.applyQualityThresholdRules(
        scores,
        context
      );
  
      const hasErrors =
        context.issues.some(
          (issue) =>
            issue.severity ===
            "error"
        );
  
      const hasWarnings =
        context.issues.some(
          (issue) =>
            issue.severity ===
            "warning"
        );
  
      return {
        valid:
          !hasErrors &&
          (
            !context.options
              .warningsAreErrors ||
            !hasWarnings
          ),
  
        validatedAt: new Date(),
  
        issues:
          context.issues.map(
            cloneValidationIssue
          ),
  
        scores,
      };
    }
  
    /**
     * Validates a draft and returns a defensive copy with
     * the result attached.
     */
    validateAndAttach(
      draft: WonderStudioDraft,
      options: WonderContentValidatorOptions = {}
    ): WonderStudioDraft {
      const result =
        this.validateDraft(
          draft,
          options
        );
  
      return {
        ...cloneStudioDraft(draft),
  
        updatedAt: new Date(),
  
        status: result.valid
          ? "needs-review"
          : "rejected",
  
        validation: result,
      };
    }
  
    /**
     * Validates several drafts and performs cross-draft
     * duplicate detection.
     */
    validateDrafts(
      drafts: readonly WonderStudioDraft[],
      options: WonderContentValidatorOptions = {}
    ): WonderDraftValidationRecord[] {
      const records: WonderDraftValidationRecord[] =
        [];
  
      const previouslyValidated: WonderStudioDraft[] = [
        ...(options.existingDrafts ?? []).map(
          cloneStudioDraft
        ),
      ];
  
      for (const draft of drafts) {
        const result =
          this.validateDraft(
            draft,
            {
              ...options,
  
              existingDrafts:
                previouslyValidated,
            }
          );
  
        records.push({
          draft:
            cloneStudioDraft(draft),
  
          result,
        });
  
        previouslyValidated.push(
          cloneStudioDraft(draft)
        );
      }
  
      return records;
    }
  
    /**
     * Validates an entire Studio batch.
     */
    validateBatch(
      batch: WonderStudioBatch,
      options: WonderContentValidatorOptions = {}
    ): WonderBatchValidationSummary {
      const records =
        this.validateDrafts(
          batch.drafts,
          options
        );
  
      const validDrafts =
        records.filter(
          (record) =>
            record.result.valid
        ).length;
  
      const invalidDrafts =
        records.length -
        validDrafts;
  
      const averageOverallScore =
        records.length > 0
          ? roundScore(
              records.reduce(
                (
                  total,
                  record
                ) =>
                  total +
                  record.result
                    .scores.overall,
                0
              ) / records.length
            )
          : 0;
  
      return {
        valid:
          records.length > 0 &&
          invalidDrafts === 0,
  
        validatedAt: new Date(),
  
        totalDrafts:
          records.length,
  
        validDrafts,
  
        invalidDrafts,
  
        averageOverallScore,
  
        records,
      };
    }
  
    /**
     * Returns whether the draft contains content identical
     * or highly similar to another draft.
     */
    isDuplicate(
      draft: WonderStudioDraft,
      candidates: readonly WonderStudioDraft[],
      threshold =
        DEFAULT_DUPLICATE_THRESHOLD
    ): boolean {
      const safeThreshold =
        clampNumber(
          threshold,
          0,
          1
        );
  
      return candidates.some(
        (candidate) =>
          draft.id !== candidate.id &&
          calculateDraftSimilarity(
            draft,
            candidate
          ) >= safeThreshold
      );
    }
  
    // =========================================================
    // SCHEMA
    // =========================================================
  
    private validateDraftSchema(
      draft: WonderStudioDraft,
      context: ValidationContext
    ): void {
      if (!hasText(draft.id)) {
        addIssue(
          context,
          "schema.draft-id",
          "error",
          "id",
          "Draft ID is required.",
          "Assign a stable unique draft ID."
        );
      }
  
      if (!hasText(draft.batchId)) {
        addIssue(
          context,
          "schema.batch-id",
          "error",
          "batchId",
          "Batch ID is required.",
          "Attach the draft to a valid Studio batch."
        );
      }
  
      if (
        !Number.isFinite(
          draft.version
        ) ||
        draft.version < 1
      ) {
        addIssue(
          context,
          "schema.version",
          "error",
          "version",
          "Draft version must be a positive number.",
          "Use version 1 or greater."
        );
      }
  
      if (
        !isValidDate(
          draft.createdAt
        )
      ) {
        addIssue(
          context,
          "schema.created-at",
          "error",
          "createdAt",
          "Draft creation date is invalid.",
          "Provide a valid Date."
        );
      }
  
      if (
        !isValidDate(
          draft.updatedAt
        )
      ) {
        addIssue(
          context,
          "schema.updated-at",
          "error",
          "updatedAt",
          "Draft update date is invalid.",
          "Provide a valid Date."
        );
      }
  
      if (
        !isContentType(
          draft.contentType
        )
      ) {
        addIssue(
          context,
          "schema.content-type",
          "error",
          "contentType",
          "Draft content type is invalid.",
          'Use "story", "mission", or "adventure".'
        );
      }
  
      if (
        !hasText(
          draft.sourcePrompt
        )
      ) {
        addIssue(
          context,
          "schema.source-prompt",
          "warning",
          "sourcePrompt",
          "The source prompt is empty.",
          "Store the source prompt for audit and regeneration."
        );
      }
    }
  
    private validateMetadata(
      draft: WonderStudioDraft,
      context: ValidationContext
    ): void {
      const metadata =
        draft.metadata;
  
      if (!metadata) {
        addIssue(
          context,
          "metadata.missing",
          "error",
          "metadata",
          "Draft metadata is missing.",
          "Include all required catalog metadata."
        );
  
        return;
      }
  
      const requiredFields: Array<{
        field: string;
        value: string;
      }> = [
        {
          field:
            "metadata.friendId",
          value:
            metadata.friendId,
        },
        {
          field:
            "metadata.worldId",
          value:
            metadata.worldId,
        },
        {
          field:
            "metadata.valueId",
          value:
            metadata.valueId,
        },
        {
          field:
            "metadata.templateId",
          value:
            metadata.templateId,
        },
        {
          field:
            "metadata.language",
          value:
            metadata.language,
        },
        {
          field:
            "metadata.locale",
          value:
            metadata.locale,
        },
        {
          field:
            "metadata.emotion",
          value:
            metadata.emotion,
        },
        {
          field:
            "metadata.location",
          value:
            metadata.location,
        },
      ];
  
      for (
        const item of
          requiredFields
      ) {
        if (!hasText(item.value)) {
          addIssue(
            context,
            `metadata.${createRuleSlug(
              item.field
            )}`,
            "error",
            item.field,
            `${item.field} is required.`,
            "Provide a valid catalog reference."
          );
        }
      }
  
      if (
        !Number.isFinite(
          metadata.ageRange.min
        ) ||
        !Number.isFinite(
          metadata.ageRange.max
        ) ||
        metadata.ageRange.min < 0 ||
        metadata.ageRange.max <
          metadata.ageRange.min
      ) {
        addIssue(
          context,
          "metadata.age-range",
          "error",
          "metadata.ageRange",
          "The age range is invalid.",
          "Use a valid minimum and maximum age."
        );
      }
  
      if (
        !Number.isFinite(
          metadata.duration
        ) ||
        metadata.duration <= 0 ||
        metadata.duration >
          MAXIMUM_DURATION
      ) {
        addIssue(
          context,
          "metadata.duration",
          "error",
          "metadata.duration",
          `Duration must be between 1 and ${MAXIMUM_DURATION} minutes.`,
          "Choose a realistic duration for the target age."
        );
      }
  
      if (
        metadata.tags.length >
        MAXIMUM_TAGS
      ) {
        addIssue(
          context,
          "metadata.tags-limit",
          "warning",
          "metadata.tags",
          `A draft should not contain more than ${MAXIMUM_TAGS} tags.`,
          "Keep only useful discovery and reporting tags."
        );
      }
  
      if (
        new Set(
          metadata.tags.map(
            normaliseText
          )
        ).size !==
        metadata.tags.length
      ) {
        addIssue(
          context,
          "metadata.duplicate-tags",
          "info",
          "metadata.tags",
          "The metadata contains duplicate tags.",
          "Remove duplicate tags before publishing."
        );
      }
    }
  
    private validateContentType(
      draft: WonderStudioDraft,
      context: ValidationContext
    ): void {
      switch (draft.contentType) {
        case "story":
          if (!draft.story) {
            addIssue(
              context,
              "content.story-required",
              "error",
              "story",
              "Story content is required for a story draft.",
              "Generate or add the story fields."
            );
          }
  
          if (draft.mission) {
            addIssue(
              context,
              "content.unexpected-mission",
              "info",
              "mission",
              "A story-only draft contains mission content.",
              "Remove the mission or change the content type to adventure."
            );
          }
  
          return;
  
        case "mission":
          if (!draft.mission) {
            addIssue(
              context,
              "content.mission-required",
              "error",
              "mission",
              "Mission content is required for a mission draft.",
              "Generate or add the mission fields."
            );
          }
  
          if (draft.story) {
            addIssue(
              context,
              "content.unexpected-story",
              "info",
              "story",
              "A mission-only draft contains story content.",
              "Remove the story or change the content type to adventure."
            );
          }
  
          return;
  
        case "adventure":
          if (!draft.story) {
            addIssue(
              context,
              "content.adventure-story",
              "error",
              "story",
              "A complete adventure requires story content.",
              "Add all required story fields."
            );
          }
  
          if (!draft.mission) {
            addIssue(
              context,
              "content.adventure-mission",
              "error",
              "mission",
              "A complete adventure requires mission content.",
              "Add all required mission fields."
            );
          }
  
          return;
  
        default:
          return;
      }
    }
  
    // =========================================================
    // STORY
    // =========================================================
  
    private validateStory(
      story:
        | WonderStudioStoryContent
        | null,
      contentType:
        WonderStudioContentType,
      context: ValidationContext
    ): void {
      if (!story) {
        return;
      }
  
      validateTextField(
        context,
        "story.title",
        story.title,
        MINIMUM_TITLE_LENGTH,
        MAXIMUM_TITLE_LENGTH,
        true
      );
  
      validateTextField(
        context,
        "story.intro",
        story.intro,
        MINIMUM_STORY_SECTION_LENGTH,
        MAXIMUM_STORY_SECTION_LENGTH
      );
  
      validateTextField(
        context,
        "story.problem",
        story.problem,
        MINIMUM_STORY_SECTION_LENGTH,
        MAXIMUM_STORY_SECTION_LENGTH
      );
  
      validateTextField(
        context,
        "story.goal",
        story.goal,
        MINIMUM_STORY_SECTION_LENGTH,
        MAXIMUM_STORY_SECTION_LENGTH
      );
  
      validateTextField(
        context,
        "story.closing",
        story.closing,
        MINIMUM_STORY_SECTION_LENGTH,
        MAXIMUM_STORY_SECTION_LENGTH
      );
  
      if (
        containsAnyPhrase(
          story.closing,
          POSITIVE_CLOSING_WORDS
        ) === false
      ) {
        addIssue(
          context,
          "story.positive-closing",
          "warning",
          "story.closing",
          "The story closing may not feel hopeful or encouraging.",
          "End with warmth, hope, pride, connection, or encouragement."
        );
      }
  
      if (
        normaliseText(
          story.intro
        ) ===
          normaliseText(
            story.problem
          ) ||
        normaliseText(
          story.problem
        ) ===
          normaliseText(
            story.goal
          )
      ) {
        addIssue(
          context,
          "story.repeated-sections",
          "error",
          "story",
          "Story sections contain repeated text.",
          "Give the intro, problem, and goal distinct functions."
        );
      }
  
      if (
        contentType ===
          "adventure" &&
        countWords(
          collectStoryText(story)
        ) < 35
      ) {
        addIssue(
          context,
          "story.too-thin",
          "warning",
          "story",
          "The story may be too thin for a complete adventure.",
          "Add enough context to create a clear beginning, challenge, goal, and ending."
        );
      }
    }
  
    // =========================================================
    // MISSION
    // =========================================================
  
    private validateMission(
      mission:
        | WonderStudioMissionContent
        | null,
      contentType:
        WonderStudioContentType,
      context: ValidationContext
    ): void {
      if (!mission) {
        return;
      }
  
      validateTextField(
        context,
        "mission.title",
        mission.title,
        MINIMUM_TITLE_LENGTH,
        MAXIMUM_TITLE_LENGTH,
        true
      );
  
      validateTextField(
        context,
        "mission.objective",
        mission.objective,
        MINIMUM_MISSION_SECTION_LENGTH,
        MAXIMUM_MISSION_SECTION_LENGTH
      );
  
      validateTextField(
        context,
        "mission.activity",
        mission.activity,
        MINIMUM_MISSION_SECTION_LENGTH,
        MAXIMUM_MISSION_SECTION_LENGTH
      );
  
      validateTextField(
        context,
        "mission.successMessage",
        mission.successMessage,
        MINIMUM_MISSION_SECTION_LENGTH,
        MAXIMUM_MISSION_SECTION_LENGTH
      );
  
      if (
        !Array.isArray(
          mission.supplies
        )
      ) {
        addIssue(
          context,
          "mission.supplies-schema",
          "error",
          "mission.supplies",
          "Mission supplies must be an array.",
          "Use an empty array when no supplies are required."
        );
  
        return;
      }
  
      if (
        mission.supplies.length >
        MAXIMUM_SUPPLIES
      ) {
        addIssue(
          context,
          "mission.too-many-supplies",
          "warning",
          "mission.supplies",
          `The mission uses more than ${MAXIMUM_SUPPLIES} supplies.`,
          "Reduce the mission to common household items."
        );
      }
  
      for (
        const supply of
          mission.supplies
      ) {
        if (!hasText(supply)) {
          addIssue(
            context,
            "mission.empty-supply",
            "error",
            "mission.supplies",
            "The supplies list contains an empty item.",
            "Remove empty supply entries."
          );
        }
      }
  
      if (
        contentType !== "story" &&
        !containsAnyPhrase(
          mission.activity,
          OFFLINE_ACTION_WORDS
        )
      ) {
        addIssue(
          context,
          "mission.offline-action",
          "warning",
          "mission.activity",
          "The activity does not clearly describe an offline action.",
          "Ask the family to make, draw, build, move, discuss, imagine, or explore something together."
        );
      }
  
      if (
        normaliseText(
          mission.objective
        ) ===
        normaliseText(
          mission.activity
        )
      ) {
        addIssue(
          context,
          "mission.repeated-objective",
          "warning",
          "mission",
          "The objective and activity are identical.",
          "Use the objective for the learning goal and the activity for practical instructions."
        );
      }
    }
  
    // =========================================================
    // SAFETY
    // =========================================================
  
    private validateSafety(
      texts: ContentTextCollection,
      context: ValidationContext
    ): void {
      const bannedWords = [
        ...DEFAULT_BANNED_WORDS,
        ...context.options
          .bannedWords,
      ];
  
      for (
        const bannedWord of
          uniqueStrings(
            bannedWords
          )
      ) {
        if (
          containsPhrase(
            texts.all,
            bannedWord
          )
        ) {
          addIssue(
            context,
            `safety.banned-${createRuleSlug(
              bannedWord
            )}`,
            "error",
            null,
            `Content contains the banned word or phrase "${bannedWord}".`,
            "Remove or replace the unsafe content."
          );
        }
      }
  
      for (
        const phrase of
          RISKY_ACTIVITY_PHRASES
      ) {
        if (
          containsPhrase(
            texts.all,
            phrase
          )
        ) {
          addIssue(
            context,
            `safety.risky-${createRuleSlug(
              phrase
            )}`,
            "error",
            "mission.activity",
            `Content may encourage unsafe imitation: "${phrase}".`,
            "Replace it with a safe, supervised, age-appropriate activity."
          );
        }
      }
  
      for (
        const phrase of
          SHAMING_PHRASES
      ) {
        if (
          containsPhrase(
            texts.all,
            phrase
          )
        ) {
          addIssue(
            context,
            `safety.shaming-${createRuleSlug(
              phrase
            )}`,
            "error",
            null,
            `Content contains shaming or emotionally harmful language: "${phrase}".`,
            "Use supportive, respectful, and encouraging language."
          );
        }
      }
  
      for (
        const phrase of
          SCREEN_REWARD_PHRASES
      ) {
        if (
          containsPhrase(
            texts.all,
            phrase
          )
        ) {
          addIssue(
            context,
            `safety.screen-reward-${createRuleSlug(
              phrase
            )}`,
            "error",
            null,
            "Content rewards the child with additional screen time.",
            "Reward connection, creativity, movement, reflection, or offline play instead."
          );
        }
      }
    }
  
    // =========================================================
    // REQUIRED WORDS
    // =========================================================
  
    private validateRequiredWords(
      texts: ContentTextCollection,
      context: ValidationContext
    ): void {
      for (
        const requiredWord of
          context.options
            .requiredWords
      ) {
        if (
          !containsPhrase(
            texts.all,
            requiredWord
          )
        ) {
          addIssue(
            context,
            `requirements.missing-${createRuleSlug(
              requiredWord
            )}`,
            "error",
            null,
            `Required word or phrase "${requiredWord}" is missing.`,
            `Include "${requiredWord}" naturally in the content.`
          );
        }
      }
    }
  
    // =========================================================
    // AGE
    // =========================================================
  
    private validateAgeSuitability(
      draft: WonderStudioDraft,
      texts: ContentTextCollection,
      context: ValidationContext
    ): void {
      const minimumAge =
        draft.metadata.ageRange.min;
  
      const maximumAge =
        draft.metadata.ageRange.max;
  
      const averageSentenceLength =
        calculateAverageSentenceLength(
          texts.all
        );
  
      const averageWordLength =
        calculateAverageWordLength(
          texts.all
        );
  
      if (
        maximumAge <= 6 &&
        averageSentenceLength > 15
      ) {
        addIssue(
          context,
          "age.long-sentences",
          "warning",
          null,
          "Sentence length may be too complex for children aged six or younger.",
          "Use shorter sentences with one clear idea each."
        );
      }
  
      if (
        maximumAge <= 6 &&
        averageWordLength > 5.8
      ) {
        addIssue(
          context,
          "age.complex-vocabulary",
          "warning",
          null,
          "Vocabulary may be too complex for the selected age range.",
          "Use shorter, familiar words and explain unusual terms."
        );
      }
  
      if (
        minimumAge <= 4 &&
        countWords(
          texts.all
        ) > 350
      ) {
        addIssue(
          context,
          "age.content-length",
          "warning",
          null,
          "The content may be too long for the youngest target age.",
          "Reduce repetition and keep the experience focused."
        );
      }
    }
  
    // =========================================================
    // OFFLINE PLAY
    // =========================================================
  
    private validateOfflinePlay(
      draft: WonderStudioDraft,
      texts: ContentTextCollection,
      context: ValidationContext
    ): void {
      if (
        draft.contentType ===
        "story"
      ) {
        return;
      }
  
      if (
        !draft.mission
      ) {
        return;
      }
  
      const offlineMatches =
        countPhraseMatches(
          texts.mission,
          OFFLINE_ACTION_WORDS
        );
  
      if (offlineMatches === 0) {
        addIssue(
          context,
          "offline.missing",
          "error",
          "mission.activity",
          "The mission does not provide a clear offline activity.",
          "Include a practical activity using conversation, imagination, movement, art, building, or household materials."
        );
      }
  
      if (
        containsAnyPhrase(
          texts.mission,
          [
            "open the app",
            "watch the video",
            "search online",
            "go to a website",
            "use social media",
            "download",
          ]
        )
      ) {
        addIssue(
          context,
          "offline.external-screen",
          "error",
          "mission.activity",
          "The mission depends on another screen, website, app, or online activity.",
          "Make the activity fully playable offline."
        );
      }
    }
  
    // =========================================================
    // DUPLICATES
    // =========================================================
  
    private validateDuplicateContent(
      draft: WonderStudioDraft,
      context: ValidationContext
    ): void {
      for (
        const candidate of
          context.options
            .existingDrafts
      ) {
        if (
          candidate.id ===
          draft.id
        ) {
          continue;
        }
  
        const similarity =
          calculateDraftSimilarity(
            draft,
            candidate
          );
  
        if (
          similarity >=
          context.options
            .duplicateThreshold
        ) {
          addIssue(
            context,
            `duplicate.${createRuleSlug(
              candidate.id
            )}`,
            "error",
            null,
            `Draft is too similar to "${candidate.id}" (${Math.round(
              similarity * 100
            )}% similarity).`,
            "Change the premise, wording, goal, activity, and emotional moment."
          );
        }
      }
    }
  
    // =========================================================
    // SCORES
    // =========================================================
  
    private calculateQualityScores(
      draft: WonderStudioDraft,
      texts: ContentTextCollection,
      issues: readonly WonderStudioValidationIssue[]
    ): WonderStudioQualityScores {
      const safety =
        calculateSafetyScore(
          issues
        );
  
      const ageMatch =
        calculateAgeMatchScore(
          issues,
          draft,
          texts
        );
  
      const educationalValue =
        calculateKeywordScore(
          texts.all,
          EDUCATIONAL_WORDS,
          2,
          6
        );
  
      const creativity =
        calculateKeywordScore(
          texts.all,
          CREATIVE_WORDS,
          2,
          6
        );
  
      const clarity =
        calculateClarityScore(
          texts.all,
          issues
        );
  
      const emotionalQuality =
        calculateKeywordScore(
          texts.all,
          EMOTIONAL_WORDS,
          2,
          6
        );
  
      const offlinePlayValue =
        calculateOfflineScore(
          draft,
          texts,
          issues
        );
  
      const overall =
        roundScore(
          safety * 0.22 +
          ageMatch * 0.16 +
          educationalValue *
            0.15 +
          creativity * 0.12 +
          clarity * 0.13 +
          emotionalQuality *
            0.10 +
          offlinePlayValue *
            0.12
        );
  
      return {
        safety,
  
        ageMatch,
  
        educationalValue,
  
        creativity,
  
        clarity,
  
        emotionalQuality,
  
        offlinePlayValue,
  
        overall,
      };
    }
  
    private applyQualityThresholdRules(
      scores: WonderStudioQualityScores,
      context: ValidationContext
    ): void {
      if (
        scores.overall <
        context.options
          .minimumOverallScore
      ) {
        addIssue(
          context,
          "quality.overall",
          "error",
          null,
          `Overall quality score ${scores.overall} is below the required ${context.options.minimumOverallScore}.`,
          "Revise the content before approval."
        );
      }
  
      const criticalScores: Array<{
        field: keyof WonderStudioQualityScores;
        label: string;
        score: number;
      }> = [
        {
          field: "safety",
          label: "Safety",
          score: scores.safety,
        },
        {
          field: "ageMatch",
          label: "Age match",
          score:
            scores.ageMatch,
        },
        {
          field:
            "educationalValue",
          label:
            "Educational value",
          score:
            scores.educationalValue,
        },
        {
          field:
            "offlinePlayValue",
          label:
            "Offline play value",
          score:
            scores.offlinePlayValue,
        },
      ];
  
      for (
        const item of
          criticalScores
      ) {
        if (
          item.score <
          context.options
            .minimumCriticalScore
        ) {
          addIssue(
            context,
            `quality.${String(
              item.field
            )}`,
            "error",
            null,
            `${item.label} score ${item.score} is below the required ${context.options.minimumCriticalScore}.`,
            `Improve the content's ${item.label.toLowerCase()}.`
          );
        }
      }
    }
  }
  
  // =========================================================
  // TEXT FIELD VALIDATION
  // =========================================================
  
  function validateTextField(
    context: ValidationContext,
    field: string,
    value: string,
    minimumLength: number,
    maximumLength: number,
    isTitle = false
  ): void {
    if (!hasText(value)) {
      addIssue(
        context,
        `${createRuleSlug(
          field
        )}.missing`,
        "error",
        field,
        `${field} is required.`,
        "Provide meaningful content."
      );
  
      return;
    }
  
    const cleaned =
      value.trim();
  
    if (
      cleaned.length <
      minimumLength
    ) {
      addIssue(
        context,
        `${createRuleSlug(
          field
        )}.too-short`,
        "error",
        field,
        `${field} is too short.`,
        `Use at least ${minimumLength} characters.`
      );
    }
  
    if (
      cleaned.length >
      maximumLength
    ) {
      addIssue(
        context,
        `${createRuleSlug(
          field
        )}.too-long`,
        "warning",
        field,
        `${field} exceeds ${maximumLength} characters.`,
        "Make the writing more focused and concise."
      );
    }
  
    if (
      /\s{2,}/.test(cleaned)
    ) {
      addIssue(
        context,
        `${createRuleSlug(
          field
        )}.spacing`,
        "info",
        field,
        `${field} contains repeated spaces.`,
        "Normalise whitespace before publishing."
      );
    }
  
    if (
      hasExcessiveRepetition(
        cleaned
      )
    ) {
      addIssue(
        context,
        `${createRuleSlug(
          field
        )}.repetition`,
        "warning",
        field,
        `${field} contains excessive word repetition.`,
        "Rewrite repeated phrases with more natural language."
      );
    }
  
    if (
      isTitle &&
      /[.!?]{2,}/.test(cleaned)
    ) {
      addIssue(
        context,
        `${createRuleSlug(
          field
        )}.punctuation`,
        "info",
        field,
        "The title uses excessive punctuation.",
        "Use simple, confident title punctuation."
      );
    }
  }
  
  // =========================================================
  // SCORE HELPERS
  // =========================================================
  
  function calculateSafetyScore(
    issues: readonly WonderStudioValidationIssue[]
  ): number {
    const safetyErrors =
      issues.filter(
        (issue) =>
          issue.rule.startsWith(
            "safety."
          ) &&
          issue.severity ===
            "error"
      ).length;
  
    const safetyWarnings =
      issues.filter(
        (issue) =>
          issue.rule.startsWith(
            "safety."
          ) &&
          issue.severity ===
            "warning"
      ).length;
  
    return clampScore(
      10 -
        safetyErrors * 5 -
        safetyWarnings * 1.5
    );
  }
  
  function calculateAgeMatchScore(
    issues: readonly WonderStudioValidationIssue[],
    draft: WonderStudioDraft,
    texts: ContentTextCollection
  ): number {
    const ageIssues =
      issues.filter(
        (issue) =>
          issue.rule.startsWith(
            "age."
          )
      );
  
    let score =
      10 -
      ageIssues.filter(
        (issue) =>
          issue.severity ===
          "error"
      ).length *
        4 -
      ageIssues.filter(
        (issue) =>
          issue.severity ===
          "warning"
      ).length *
        1.5;
  
    const maximumAge =
      draft.metadata.ageRange.max;
  
    const averageSentenceLength =
      calculateAverageSentenceLength(
        texts.all
      );
  
    if (
      maximumAge <= 6 &&
      averageSentenceLength <= 10
    ) {
      score += 0.5;
    }
  
    return clampScore(score);
  }
  
  function calculateKeywordScore(
    text: string,
    words: readonly string[],
    minimumMatches: number,
    fullScoreMatches: number
  ): number {
    const matches =
      countPhraseMatches(
        text,
        words
      );
  
    if (
      matches <
      minimumMatches
    ) {
      return clampScore(
        4 +
          matches * 1.5
      );
    }
  
    const progress =
      Math.min(
        1,
        matches /
          fullScoreMatches
      );
  
    return clampScore(
      6 + progress * 4
    );
  }
  
  function calculateClarityScore(
    text: string,
    issues: readonly WonderStudioValidationIssue[]
  ): number {
    const averageSentenceLength =
      calculateAverageSentenceLength(
        text
      );
  
    let score = 10;
  
    if (
      averageSentenceLength > 18
    ) {
      score -= 2;
    } else if (
      averageSentenceLength > 14
    ) {
      score -= 1;
    }
  
    const repetitionIssues =
      issues.filter(
        (issue) =>
          issue.rule.includes(
            "repetition"
          )
      ).length;
  
    score -=
      repetitionIssues * 1.5;
  
    return clampScore(score);
  }
  
  function calculateOfflineScore(
    draft: WonderStudioDraft,
    texts: ContentTextCollection,
    issues: readonly WonderStudioValidationIssue[]
  ): number {
    if (
      draft.contentType ===
      "story"
    ) {
      return 8;
    }
  
    const offlineIssues =
      issues.filter(
        (issue) =>
          issue.rule.startsWith(
            "offline."
          ) ||
          issue.rule ===
            "mission.offline-action"
      );
  
    const matches =
      countPhraseMatches(
        texts.mission,
        OFFLINE_ACTION_WORDS
      );
  
    return clampScore(
      6 +
        Math.min(
          matches,
          4
        ) -
        offlineIssues.filter(
          (issue) =>
            issue.severity ===
            "error"
        ).length *
          4 -
        offlineIssues.filter(
          (issue) =>
            issue.severity ===
            "warning"
        ).length *
          1.5
    );
  }
  
  // =========================================================
  // DUPLICATE SIMILARITY
  // =========================================================
  
  function calculateDraftSimilarity(
    first: WonderStudioDraft,
    second: WonderStudioDraft
  ): number {
    const firstText =
      collectDraftText(first);
  
    const secondText =
      collectDraftText(second);
  
    const titleSimilarity =
      jaccardSimilarity(
        tokenise(firstText.title),
        tokenise(secondText.title)
      );
  
    const contentSimilarity =
      jaccardSimilarity(
        tokenise(firstText.all),
        tokenise(secondText.all)
      );
  
    const metadataSimilarity =
      calculateMetadataSimilarity(
        first,
        second
      );
  
    return clampNumber(
      titleSimilarity * 0.35 +
        contentSimilarity * 0.5 +
        metadataSimilarity * 0.15,
      0,
      1
    );
  }
  
  function calculateMetadataSimilarity(
    first: WonderStudioDraft,
    second: WonderStudioDraft
  ): number {
    const fields = [
      [
        first.metadata.friendId,
        second.metadata.friendId,
      ],
      [
        first.metadata.worldId,
        second.metadata.worldId,
      ],
      [
        first.metadata.valueId,
        second.metadata.valueId,
      ],
      [
        first.metadata.templateId,
        second.metadata
          .templateId,
      ],
      [
        first.metadata.location,
        second.metadata.location,
      ],
    ];
  
    const matches =
      fields.filter(
        ([firstValue, secondValue]) =>
          normaliseText(
            firstValue
          ) ===
          normaliseText(
            secondValue
          )
      ).length;
  
    return matches /
      fields.length;
  }
  
  function jaccardSimilarity(
    first: ReadonlySet<string>,
    second: ReadonlySet<string>
  ): number {
    if (
      first.size === 0 &&
      second.size === 0
    ) {
      return 1;
    }
  
    const intersection =
      Array.from(first).filter(
        (item) =>
          second.has(item)
      ).length;
  
    const union =
      new Set([
        ...first,
        ...second,
      ]).size;
  
    return union > 0
      ? intersection / union
      : 0;
  }
  
  // =========================================================
  // TEXT HELPERS
  // =========================================================
  
  function collectDraftText(
    draft: WonderStudioDraft
  ): ContentTextCollection {
    const story =
      draft.story
        ? collectStoryText(
            draft.story
          )
        : "";
  
    const mission =
      draft.mission
        ? collectMissionText(
            draft.mission
          )
        : "";
  
    const title = [
      draft.story?.title ?? "",
      draft.mission?.title ?? "",
    ]
      .filter(hasText)
      .join(" ");
  
    return {
      all: [
        title,
        story,
        mission,
        draft.metadata.emotion,
        draft.metadata.location,
        ...draft.metadata.tags,
      ]
        .filter(hasText)
        .join(" "),
  
      title,
  
      story,
  
      mission,
    };
  }
  
  function collectStoryText(
    story: WonderStudioStoryContent
  ): string {
    return [
      story.title,
      story.intro,
      story.problem,
      story.goal,
      story.closing,
    ]
      .filter(hasText)
      .join(" ");
  }
  
  function collectMissionText(
    mission: WonderStudioMissionContent
  ): string {
    return [
      mission.title,
      mission.objective,
      mission.activity,
      mission.successMessage,
      ...mission.supplies,
    ]
      .filter(hasText)
      .join(" ");
  }
  
  function containsPhrase(
    text: string,
    phrase: string
  ): boolean {
    const normalisedPhrase =
      normaliseText(phrase);
  
    if (
      normalisedPhrase.length === 0
    ) {
      return false;
    }
  
    return normaliseText(
      text
    ).includes(
      normalisedPhrase
    );
  }
  
  function containsAnyPhrase(
    text: string,
    phrases: readonly string[]
  ): boolean {
    return phrases.some(
      (phrase) =>
        containsPhrase(
          text,
          phrase
        )
    );
  }
  
  function countPhraseMatches(
    text: string,
    phrases: readonly string[]
  ): number {
    return uniqueStrings(
      phrases
    ).filter(
      (phrase) =>
        containsPhrase(
          text,
          phrase
        )
    ).length;
  }
  
  function tokenise(
    text: string
  ): Set<string> {
    return new Set(
      normaliseText(text)
        .split(" ")
        .filter(
          (word) =>
            word.length >= 3
        )
    );
  }
  
  function normaliseText(
    text: string
  ): string {
    return text
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }
  
  function countWords(
    text: string
  ): number {
    const cleaned =
      normaliseText(text);
  
    return cleaned.length > 0
      ? cleaned.split(" ").length
      : 0;
  }
  
  function calculateAverageSentenceLength(
    text: string
  ): number {
    const sentences =
      text
        .split(/[.!?]+/)
        .map(
          (sentence) =>
            sentence.trim()
        )
        .filter(
          (sentence) =>
            sentence.length > 0
        );
  
    if (
      sentences.length === 0
    ) {
      return 0;
    }
  
    const totalWords =
      sentences.reduce(
        (
          total,
          sentence
        ) =>
          total +
          countWords(sentence),
        0
      );
  
    return totalWords /
      sentences.length;
  }
  
  function calculateAverageWordLength(
    text: string
  ): number {
    const words =
      normaliseText(text)
        .split(" ")
        .filter(Boolean);
  
    if (words.length === 0) {
      return 0;
    }
  
    return (
      words.reduce(
        (
          total,
          word
        ) =>
          total +
          word.length,
        0
      ) / words.length
    );
  }
  
  function hasExcessiveRepetition(
    text: string
  ): boolean {
    const words =
      normaliseText(text)
        .split(" ")
        .filter(
          (word) =>
            word.length >= 3
        );
  
    if (words.length < 8) {
      return false;
    }
  
    const counts =
      new Map<
        string,
        number
      >();
  
    for (const word of words) {
      counts.set(
        word,
        (counts.get(word) ?? 0) +
          1
      );
    }
  
    const highestCount =
      Math.max(
        ...counts.values()
      );
  
    return (
      highestCount /
        words.length >
      0.24
    );
  }
  
  // =========================================================
  // ISSUES
  // =========================================================
  
  function addIssue(
    context: ValidationContext,
    rule: string,
    severity: WonderStudioValidationSeverity,
    field: string | null,
    message: string,
    suggestion: string | null
  ): void {
    const duplicate =
      context.issues.some(
        (issue) =>
          issue.rule === rule &&
          issue.field === field &&
          issue.message ===
            message
      );
  
    if (duplicate) {
      return;
    }
  
    context.issues.push({
      id: createIssueId(
        rule,
        field,
        message,
        context.issues.length
      ),
  
      rule,
  
      severity,
  
      field,
  
      message,
  
      suggestion,
    });
  }
  
  function createIssueId(
    rule: string,
    field: string | null,
    message: string,
    index: number
  ): string {
    const hash =
      hashText(
        [
          rule,
          field ?? "",
          message,
          index,
        ].join(":")
      )
        .toString(36)
        .padStart(7, "0");
  
    return `wonder-validation-${hash}`;
  }
  
  function cloneValidationIssue(
    issue: WonderStudioValidationIssue
  ): WonderStudioValidationIssue {
    return {
      ...issue,
    };
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneStudioDraft(
    draft: WonderStudioDraft
  ): WonderStudioDraft {
    return {
      ...draft,
  
      createdAt: new Date(
        draft.createdAt.getTime()
      ),
  
      updatedAt: new Date(
        draft.updatedAt.getTime()
      ),
  
      metadata: {
        ...draft.metadata,
  
        ageRange: {
          ...draft.metadata
            .ageRange,
        },
  
        tags: [
          ...draft.metadata.tags,
        ],
      },
  
      story: draft.story
        ? {
            ...draft.story,
          }
        : null,
  
      mission: draft.mission
        ? {
            ...draft.mission,
  
            supplies: [
              ...draft.mission
                .supplies,
            ],
          }
        : null,
  
      validation:
        draft.validation
          ? {
              ...draft.validation,
  
              validatedAt:
                new Date(
                  draft.validation.validatedAt.getTime()
                ),
  
              issues:
                draft.validation.issues.map(
                  cloneValidationIssue
                ),
  
              scores: {
                ...draft.validation
                  .scores,
              },
            }
          : null,
    };
  }
  
  // =========================================================
  // OPTIONS
  // =========================================================
  
  function normaliseValidatorOptions(
    options: WonderContentValidatorOptions
  ): ValidationContext["options"] {
    return {
      minimumOverallScore:
        clampNumber(
          options.minimumOverallScore ??
            DEFAULT_MINIMUM_OVERALL_SCORE,
          0,
          10
        ),
  
      minimumCriticalScore:
        clampNumber(
          options.minimumCriticalScore ??
            DEFAULT_MINIMUM_CRITICAL_SCORE,
          0,
          10
        ),
  
      bannedWords:
        uniqueStrings(
          options.bannedWords ??
            []
        ),
  
      requiredWords:
        uniqueStrings(
          options.requiredWords ??
            []
        ),
  
      existingDrafts:
        options.existingDrafts ??
        [],
  
      duplicateThreshold:
        clampNumber(
          options.duplicateThreshold ??
            DEFAULT_DUPLICATE_THRESHOLD,
          0,
          1
        ),
  
      warningsAreErrors:
        options.warningsAreErrors ??
        false,
    };
  }
  
  // =========================================================
  // GENERAL HELPERS
  // =========================================================
  
  function uniqueStrings(
    values: readonly string[]
  ): string[] {
    return Array.from(
      new Set(
        values
          .map(
            (value) =>
              value.trim()
          )
          .filter(
            (value) =>
              value.length > 0
          )
      )
    );
  }
  
  function hasText(
    value: unknown
  ): value is string {
    return (
      typeof value ===
        "string" &&
      value.trim().length > 0
    );
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
  
  function isContentType(
    value: string
  ): value is WonderStudioContentType {
    return (
      value === "story" ||
      value === "mission" ||
      value === "adventure"
    );
  }
  
  function clampNumber(
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
        value
      )
    );
  }
  
  function clampScore(
    value: number
  ): number {
    return roundScore(
      clampNumber(
        value,
        0,
        10
      )
    );
  }
  
  function roundScore(
    value: number
  ): number {
    return (
      Math.round(
        value * 10
      ) / 10
    );
  }
  
  function createRuleSlug(
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
  
  function hashText(
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
  
  export const wonderContentValidator =
    new WonderContentValidator();
  
  export default WonderContentValidator;