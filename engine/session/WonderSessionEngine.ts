import {
    WonderCardBuilder,
    wonderCardBuilder,
  } from "@/engine/card/WonderCardBuilder";
  
  import {
    WonderRepository,
    wonderRepository,
  } from "@/engine/repository/WonderRepository";
  
  import type { WonderEngineCard, WonderCardStatus } from "@/types/wonderEngineCard";
  
  import type { WonderGenome } from "@/types/wonderGenome";
  
  export type WonderSessionStatus =
    | "created"
    | "playing"
    | "paused"
    | "completed";
  
  export interface WonderSession {
    id: string;
  
    version: number;
  
    createdAt: Date;
  
    updatedAt: Date;
  
    startedAt: Date | null;
  
    completedAt: Date | null;
  
    status: WonderSessionStatus;
  
    genome: WonderGenome;
  
    card: WonderEngineCard;
  
    currentStep: number;
  
    wonderScore: number;
  
    savedMoment: string;
  }
  
  export interface WonderSessionMoment {
    id: string;
  
    sessionId: string;
  
    cardId: string;
  
    text: string;
  
    world: string;
  
    friend: string;
  
    value: string;
  
    createdAt: Date;
  }
  
  export interface CreateWonderSessionOptions {
    id?: string;
  
    version?: number;
  
    createdAt?: Date;
  
    wonderScore?: number;
  
    currentStep?: number;
  
    autoSave?: boolean;
  }
  
  export interface CompleteWonderSessionOptions {
    wonderScore?: number;
  
    savedMoment?: string;
  
    saveMomentToHistory?: boolean;
  }
  
  export interface WonderSessionValidationResult {
    valid: boolean;
  
    errors: string[];
  }
  
  /**
   * Coordinates one complete WonderLabs play session.
   *
   * Flow:
   *
   * WonderGenome
   *   -> WonderCardBuilder
   *   -> WonderSession
   *   -> WonderRepository
   *   -> WonderFlow UI
   */
  export class WonderSessionEngine {
    constructor(
      private readonly cardBuilder: WonderCardBuilder =
        wonderCardBuilder,
  
      private readonly repository: WonderRepository =
        wonderRepository
    ) {}
  
    // =========================================================
    // CREATE
    // =========================================================
  
    /**
     * Creates a complete offline Wonder Session from a genome.
     */
    createSession(
      genome: WonderGenome,
      options: CreateWonderSessionOptions = {}
    ): WonderSession {
      const createdAt = normaliseDate(
        options.createdAt
      );
  
      const wonderScore = normaliseScore(
        options.wonderScore
      );
  
      const card = this.cardBuilder.build(
        genome,
        {
          status: "ready",
          wonderScore,
          createdAt,
        }
      );
  
      const session: WonderSession = {
        id:
          normaliseOptionalText(options.id) ??
          createWonderSessionId(
            card,
            createdAt
          ),
  
        version: normalisePositiveInteger(
          options.version,
          1
        ),
  
        createdAt,
  
        updatedAt: new Date(
          createdAt.getTime()
        ),
  
        startedAt: null,
  
        completedAt: null,
  
        status: "created",
  
        genome: cloneWonderGenome(
          card.genome
        ),
  
        card: cloneWonderCard(card),
  
        currentStep: normaliseStep(
          options.currentStep
        ),
  
        wonderScore,
  
        savedMoment: "",
      };
  
      this.assertValidSession(session);
  
      if (options.autoSave !== false) {
        this.saveSession(session);
      }
  
      return cloneWonderSession(session);
    }
  
    /**
     * Recommended alias for creating a new session.
     */
    create(
      genome: WonderGenome,
      options: CreateWonderSessionOptions = {}
    ): WonderSession {
      return this.createSession(
        genome,
        options
      );
    }
  
    // =========================================================
    // START AND RESUME
    // =========================================================
  
    /**
     * Starts a newly created session.
     */
    startSession(
      session: WonderSession
    ): WonderSession {
      this.assertValidSession(session);
  
      const now = new Date();
  
      const updatedCard =
        this.cardBuilder.markPlayed(
          session.card
        );
  
      const updatedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        status: "playing",
  
        startedAt:
          session.startedAt instanceof Date
            ? new Date(
                session.startedAt.getTime()
              )
            : now,
  
        completedAt: null,
  
        updatedAt: now,
  
        card: updatedCard,
      };
  
      this.saveSession(updatedSession);
  
      return cloneWonderSession(
        updatedSession
      );
    }
  
    /**
     * Alias used by UI and director engines.
     */
    start(
      session: WonderSession
    ): WonderSession {
      return this.startSession(session);
    }
  
    /**
     * Loads the saved session and resumes it.
     *
     * Returns null when no session exists.
     */
    resumeSession(): WonderSession | null {
      const session = this.loadSession();
  
      if (!session) {
        return null;
      }
  
      if (
        session.status === "completed"
      ) {
        return session;
      }
  
      if (
        session.status === "created"
      ) {
        return this.startSession(session);
      }
  
      const resumedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        status: "playing",
  
        updatedAt: new Date(),
      };
  
      this.saveSession(resumedSession);
  
      return cloneWonderSession(
        resumedSession
      );
    }
  
    // =========================================================
    // PAUSE
    // =========================================================
  
    /**
     * Pauses an active session.
     */
    pauseSession(
      session: WonderSession
    ): WonderSession {
      this.assertValidSession(session);
  
      if (
        session.status === "completed"
      ) {
        return cloneWonderSession(session);
      }
  
      const updatedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        status: "paused",
  
        updatedAt: new Date(),
      };
  
      this.saveSession(updatedSession);
  
      return cloneWonderSession(
        updatedSession
      );
    }
  
    /**
     * Alias for pauseSession.
     */
    pause(
      session: WonderSession
    ): WonderSession {
      return this.pauseSession(session);
    }
  
    // =========================================================
    // FLOW PROGRESS
    // =========================================================
  
    /**
     * Updates the current WonderFlow step.
     */
    setCurrentStep(
      session: WonderSession,
      step: number
    ): WonderSession {
      this.assertValidSession(session);
  
      const updatedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        currentStep: normaliseStep(step),
  
        updatedAt: new Date(),
      };
  
      this.saveSession(updatedSession);
  
      return cloneWonderSession(
        updatedSession
      );
    }
  
    /**
     * Moves the flow forward by one step.
     */
    nextStep(
      session: WonderSession
    ): WonderSession {
      return this.setCurrentStep(
        session,
        session.currentStep + 1
      );
    }
  
    /**
     * Moves the flow backwards by one step.
     */
    previousStep(
      session: WonderSession
    ): WonderSession {
      return this.setCurrentStep(
        session,
        Math.max(
          0,
          session.currentStep - 1
        )
      );
    }
  
    // =========================================================
    // WONDER SCORE
    // =========================================================
  
    /**
     * Replaces the current Wonder Score.
     */
    setWonderScore(
      session: WonderSession,
      wonderScore: number
    ): WonderSession {
      this.assertValidSession(session);
  
      const score =
        normaliseScore(wonderScore);
  
      const updatedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        wonderScore: score,
  
        updatedAt: new Date(),
  
        card:
          this.cardBuilder.withWonderScore(
            session.card,
            score
          ),
      };
  
      this.saveSession(updatedSession);
  
      return cloneWonderSession(
        updatedSession
      );
    }
  
    /**
     * Adds points to the current Wonder Score.
     */
    addWonderScore(
      session: WonderSession,
      points: number
    ): WonderSession {
      const safePoints =
        normaliseScore(points);
  
      return this.setWonderScore(
        session,
        session.wonderScore + safePoints
      );
    }
  
    // =========================================================
    // WONDER MOMENT
    // =========================================================
  
    /**
     * Saves the current session's Wonder Moment.
     */
    saveWonderMoment(
      session: WonderSession,
      moment: string,
      addToHistory = true
    ): WonderSession {
      this.assertValidSession(session);
  
      const cleanedMoment =
        normaliseMoment(
          moment,
          session
        );
  
      const updatedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        savedMoment: cleanedMoment,
  
        updatedAt: new Date(),
      };
  
      this.saveSession(updatedSession);
  
      if (addToHistory) {
        const momentRecord =
          this.createMomentRecord(
            updatedSession,
            cleanedMoment
          );
  
        this.repository.addMoment(
          momentRecord
        );
      }
  
      return cloneWonderSession(
        updatedSession
      );
    }
  
    /**
     * Creates a persistent Wonder Moment record.
     */
    private createMomentRecord(
      session: WonderSession,
      text: string
    ): WonderSessionMoment {
      const createdAt = new Date();
  
      return {
        id: createWonderMomentId(
          session.id,
          createdAt
        ),
  
        sessionId: session.id,
  
        cardId: session.card.id,
  
        text,
  
        world: session.card.world,
  
        friend: session.card.friend,
  
        value: session.card.value,
  
        createdAt,
      };
    }
  
    // =========================================================
    // COMPLETE
    // =========================================================
  
    /**
     * Completes a Wonder Session.
     */
    completeSession(
      session: WonderSession,
      options: CompleteWonderSessionOptions = {}
    ): WonderSession {
      this.assertValidSession(session);
  
      const completedAt = new Date();
  
      const score =
        options.wonderScore === undefined
          ? session.wonderScore
          : normaliseScore(
              options.wonderScore
            );
  
      const savedMoment =
        options.savedMoment === undefined
          ? session.savedMoment
          : normaliseMoment(
              options.savedMoment,
              session
            );
  
      const completedCard =
        this.cardBuilder.markCompleted(
          session.card,
          score
        );
  
      const completedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        status: "completed",
  
        completedAt,
  
        updatedAt: completedAt,
  
        wonderScore: score,
  
        savedMoment,
  
        card: completedCard,
      };
  
      this.saveSession(
        completedSession
      );
  
      if (
        options.savedMoment !== undefined &&
        options.saveMomentToHistory !== false
      ) {
        this.repository.addMoment(
          this.createMomentRecord(
            completedSession,
            savedMoment
          )
        );
      }
  
      this.repository.saveDailyAdventure(
        completedCard
      );
  
      return cloneWonderSession(
        completedSession
      );
    }
  
    /**
     * Alias for completeSession.
     */
    complete(
      session: WonderSession,
      options: CompleteWonderSessionOptions = {}
    ): WonderSession {
      return this.completeSession(
        session,
        options
      );
    }
  
    // =========================================================
    // CARD STATUS
    // =========================================================
  
    /**
     * Updates the card status inside a session.
     */
    setCardStatus(
      session: WonderSession,
      status: WonderCardStatus
    ): WonderSession {
      this.assertValidSession(session);
  
      const updatedSession: WonderSession = {
        ...cloneWonderSession(session),
  
        updatedAt: new Date(),
  
        card: this.cardBuilder.withStatus(
          session.card,
          status
        ),
      };
  
      this.saveSession(updatedSession);
  
      return cloneWonderSession(
        updatedSession
      );
    }
  
    // =========================================================
    // STORAGE
    // =========================================================
  
    /**
     * Saves the active session.
     */
    saveSession(
      session: WonderSession
    ): boolean {
      this.assertValidSession(session);
  
      return this.repository.saveSession(
        cloneWonderSession(session)
      );
    }
  
    /**
     * Loads the active session.
     */
    loadSession(): WonderSession | null {
      const session =
        this.repository.loadSession<WonderSession>();
  
      if (!session) {
        return null;
      }
  
      const hydratedSession =
        hydrateWonderSession(session);
  
      const validation =
        this.validateSession(
          hydratedSession
        );
  
      if (!validation.valid) {
        console.error(
          "[WonderSessionEngine] Invalid stored session.",
          validation.errors
        );
  
        this.repository.clearSession();
  
        return null;
      }
  
      return cloneWonderSession(
        hydratedSession
      );
    }
  
    /**
     * Returns whether a saved session exists.
     */
    hasSession(): boolean {
      return this.repository.hasSession();
    }
  
    /**
     * Clears the active session.
     */
    clearSession(): boolean {
      return this.repository.clearSession();
    }
  
    // =========================================================
    // VALIDATION
    // =========================================================
  
    /**
     * Validates a Wonder Session without throwing.
     */
    validateSession(
      session: WonderSession
    ): WonderSessionValidationResult {
      const errors: string[] = [];
  
      if (!hasText(session.id)) {
        errors.push(
          "Session ID is required."
        );
      }
  
      if (
        !Number.isFinite(
          session.version
        ) ||
        session.version < 1
      ) {
        errors.push(
          "Session version must be positive."
        );
      }
  
      if (
        !isValidDate(
          session.createdAt
        )
      ) {
        errors.push(
          "Session createdAt is invalid."
        );
      }
  
      if (
        !isValidDate(
          session.updatedAt
        )
      ) {
        errors.push(
          "Session updatedAt is invalid."
        );
      }
  
      if (
        session.startedAt !== null &&
        !isValidDate(
          session.startedAt
        )
      ) {
        errors.push(
          "Session startedAt is invalid."
        );
      }
  
      if (
        session.completedAt !== null &&
        !isValidDate(
          session.completedAt
        )
      ) {
        errors.push(
          "Session completedAt is invalid."
        );
      }
  
      if (
        !isWonderSessionStatus(
          session.status
        )
      ) {
        errors.push(
          "Session status is invalid."
        );
      }
  
      if (
        !Number.isFinite(
          session.currentStep
        ) ||
        session.currentStep < 0
      ) {
        errors.push(
          "Session currentStep is invalid."
        );
      }
  
      if (
        !Number.isFinite(
          session.wonderScore
        ) ||
        session.wonderScore < 0
      ) {
        errors.push(
          "Session Wonder Score is invalid."
        );
      }
  
      if (
        !this.cardBuilder.isValidCard(
          session.card
        )
      ) {
        errors.push(
          "Session WonderEngineCard is invalid."
        );
      }
  
      if (
        session.card.genome.id !==
        session.genome.id
      ) {
        errors.push(
          "Session genome does not match the card genome."
        );
      }
  
      if (
        session.card.wonderScore !==
        session.wonderScore
      ) {
        errors.push(
          "Session score does not match the card score."
        );
      }
  
      if (
        session.status === "completed" &&
        session.completedAt === null
      ) {
        errors.push(
          "Completed session requires completedAt."
        );
      }
  
      return {
        valid: errors.length === 0,
  
        errors,
      };
    }
  
    /**
     * Throws when the session is invalid.
     */
    private assertValidSession(
      session: WonderSession
    ): void {
      const result =
        this.validateSession(session);
  
      if (result.valid) {
        return;
      }
  
      throw new Error(
        [
          "WonderSessionEngine: invalid session.",
          ...result.errors,
        ].join(" ")
      );
    }
  }
  
  // =========================================================
  // ID HELPERS
  // =========================================================
  
  function createWonderSessionId(
    card: WonderEngineCard,
    createdAt: Date
  ): string {
    const source =
      `${card.id}:${createdAt.toISOString()}`;
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(7, "0");
  
    return `wonder-session-${hash}`;
  }
  
  function createWonderMomentId(
    sessionId: string,
    createdAt: Date
  ): string {
    const source =
      `${sessionId}:${createdAt.toISOString()}`;
  
    const hash =
      hashText(source)
        .toString(36)
        .padStart(7, "0");
  
    return `wonder-moment-${hash}`;
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
  // NORMALISATION
  // =========================================================
  
  function normaliseDate(
    value: Date | undefined
  ): Date {
    if (isValidDate(value)) {
      return new Date(
        value.getTime()
      );
    }
  
    return new Date();
  }
  
  function normalisePositiveInteger(
    value: number | undefined,
    fallback: number
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value) ||
      value < 1
    ) {
      return fallback;
    }
  
    return Math.max(
      1,
      Math.floor(value)
    );
  }
  
  function normaliseScore(
    value: number | undefined
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return 0;
    }
  
    return Math.max(
      0,
      Math.round(value)
    );
  }
  
  function normaliseStep(
    value: number | undefined
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return 0;
    }
  
    return Math.max(
      0,
      Math.floor(value)
    );
  }
  
  function normaliseOptionalText(
    value: string | undefined
  ): string | null {
    if (!value) {
      return null;
    }
  
    const cleaned = value.trim();
  
    return cleaned.length > 0
      ? cleaned
      : null;
  }
  
  function normaliseMoment(
    moment: string,
    session: WonderSession
  ): string {
    const cleaned = moment.trim();
  
    if (cleaned.length > 0) {
      return cleaned;
    }
  
    return `Today felt wonderful exploring ${session.card.world} with ${session.card.friend}.`;
  }
  
  // =========================================================
  // HYDRATION
  // =========================================================
  
  function hydrateWonderSession(
    session: WonderSession
  ): WonderSession {
    return {
      ...session,
  
      createdAt: hydrateDate(
        session.createdAt
      ),
  
      updatedAt: hydrateDate(
        session.updatedAt
      ),
  
      startedAt:
        session.startedAt === null
          ? null
          : hydrateDate(
              session.startedAt
            ),
  
      completedAt:
        session.completedAt === null
          ? null
          : hydrateDate(
              session.completedAt
            ),
  
      genome:
        hydrateWonderGenome(
          session.genome
        ),
  
      card:
        hydrateWonderCard(
          session.card
        ),
  
      currentStep:
        normaliseStep(
          session.currentStep
        ),
  
      wonderScore:
        normaliseScore(
          session.wonderScore
        ),
  
      savedMoment:
        typeof session.savedMoment ===
          "string"
          ? session.savedMoment
          : "",
    };
  }
  
  function hydrateWonderCard(
    card: WonderEngineCard
  ): WonderEngineCard {
    return {
      ...card,
  
      createdAt: hydrateDate(
        card.createdAt
      ),
  
      genome:
        hydrateWonderGenome(
          card.genome
        ),
  
      story: {
        ...card.story,
      },
  
      mission: {
        ...card.mission,
      },
  
      duration:
        Number.isFinite(card.duration)
          ? card.duration
          : 5,
  
      wonderScore:
        normaliseScore(
          card.wonderScore
        ),
    };
  }
  
  function hydrateWonderGenome(
    genome: WonderGenome
  ): WonderGenome {
    return {
      ...genome,
  
      createdAt: hydrateDate(
        genome.createdAt
      ),
  
      friend: {
        ...genome.friend,
      },
  
      world: {
        ...genome.world,
      },
  
      value: {
        ...genome.value,
      },
  
      template: {
        ...genome.template,
      },
  
      ageRange: {
        ...genome.ageRange,
      },
    };
  }
  
  function hydrateDate(
    value: Date | string
  ): Date {
    if (value instanceof Date) {
      return new Date(
        value.getTime()
      );
    }
  
    return new Date(value);
  }
  
  // =========================================================
  // CLONING
  // =========================================================
  
  function cloneWonderSession(
    session: WonderSession
  ): WonderSession {
    return {
      ...session,
  
      createdAt: new Date(
        session.createdAt.getTime()
      ),
  
      updatedAt: new Date(
        session.updatedAt.getTime()
      ),
  
      startedAt:
        session.startedAt
          ? new Date(
              session.startedAt.getTime()
            )
          : null,
  
      completedAt:
        session.completedAt
          ? new Date(
              session.completedAt.getTime()
            )
          : null,
  
      genome:
        cloneWonderGenome(
          session.genome
        ),
  
      card:
        cloneWonderCard(
          session.card
        ),
    };
  }
  
  function cloneWonderCard(
    card: WonderEngineCard
  ): WonderEngineCard {
    return {
      ...card,
  
      createdAt: new Date(
        card.createdAt.getTime()
      ),
  
      genome:
        cloneWonderGenome(
          card.genome
        ),
  
      story: {
        ...card.story,
      },
  
      mission: {
        ...card.mission,
      },
    };
  }
  
  function cloneWonderGenome(
    genome: WonderGenome
  ): WonderGenome {
    return {
      ...genome,
  
      createdAt: new Date(
        genome.createdAt.getTime()
      ),
  
      friend: {
        ...genome.friend,
      },
  
      world: {
        ...genome.world,
      },
  
      value: {
        ...genome.value,
      },
  
      template: {
        ...genome.template,
      },
  
      ageRange: {
        ...genome.ageRange,
      },
    };
  }
  
  // =========================================================
  // VALIDATION HELPERS
  // =========================================================
  
  function hasText(
    value: string
  ): boolean {
    return (
      typeof value === "string" &&
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
  
  function isWonderSessionStatus(
    value: string
  ): value is WonderSessionStatus {
    return (
      value === "created" ||
      value === "playing" ||
      value === "paused" ||
      value === "completed"
    );
  }
  
  export const wonderSessionEngine =
    new WonderSessionEngine();
  
  export default WonderSessionEngine;

