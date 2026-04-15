import { randomUUID } from "node:crypto";
import type { BrainRepository } from "../../domain/contracts/brain-repository.js";
import type {
  BrainSession,
  BrainStore,
  BrainTask,
  DecisionRecord,
  EngineerPreferences,
  PhaseRule,
  ProjectPhase
} from "../../domain/contracts/brain-models.js";

export interface SessionProgressInput {
  readonly sessionId: string;
  readonly phase: ProjectPhase;
  readonly taskId: string;
  readonly doneItems: ReadonlyArray<string>;
  readonly nextItems: ReadonlyArray<string>;
  readonly watchouts: ReadonlyArray<string>;
}

export interface BeginFeatureInput {
  readonly title: string;
  readonly description: string;
  readonly phase: ProjectPhase;
  readonly sessionId: string | null;
  readonly nextItems: ReadonlyArray<string>;
  readonly watchouts: ReadonlyArray<string>;
}

export interface RequireTaskOptions {
  readonly enforceInProgress?: boolean;
  readonly engineerId?: string;
}

export class ProjectBrainService {
  private readonly repository: BrainRepository;

  public constructor(repository: BrainRepository) {
    this.repository = repository;
  }

  public async createTask(title: string, description: string): Promise<BrainTask> {
    const store = await this.loadOrCreate();
    const now = new Date().toISOString();

    const task: BrainTask = {
      id: randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status: "todo",
      createdAtUtc: now,
      updatedAtUtc: now
    };

    await this.repository.save({
      ...store,
      tasks: [...store.tasks, task]
    });

    return task;
  }

  public async startTask(taskId: string): Promise<BrainTask> {
    const store = await this.loadOrCreate();
    const existing = store.tasks.find((task) => task.id === taskId);
    if (existing === undefined) {
      throw new Error(`Task not found: ${taskId}. Create task first.`);
    }

    const now = new Date().toISOString();
    const updated: BrainTask = {
      ...existing,
      status: "in_progress",
      updatedAtUtc: now
    };

    await this.repository.save({
      ...store,
      tasks: store.tasks.map((task) => task.id === taskId ? updated : task)
    });

    return updated;
  }

  public async requireTask(
    taskId: string,
    options: RequireTaskOptions = {}
  ): Promise<BrainTask> {
    const store = await this.loadOrCreate();
    const task = store.tasks.find((value) => value.id === taskId);
    if (task === undefined) {
      throw new Error(`Task gate blocked: task ${taskId} does not exist.`);
    }

    const engineerId = options.engineerId ?? defaultEngineerId();
    const preferences = this.getPreferencesFromStore(store, engineerId);
    const enforceInProgress = options.enforceInProgress ?? preferences.strictTaskGate;

    if (enforceInProgress && task.status !== "in_progress") {
      throw new Error(
        `Task gate blocked: task ${taskId} status is ${task.status}. `
        + "Implementation requires status in_progress."
      );
    }

    return task;
  }

  public async addSessionProgress(input: SessionProgressInput): Promise<BrainSession> {
    const store = await this.loadOrCreate();
    const task = store.tasks.find((value) => value.id === input.taskId);
    if (task === undefined) {
      throw new Error(`Task gate blocked: task ${input.taskId} does not exist.`);
    }

    const now = new Date().toISOString();
    const session: BrainSession = {
      id: input.sessionId,
      phase: input.phase,
      taskId: input.taskId,
      doneItems: input.doneItems,
      nextItems: input.nextItems,
      watchouts: input.watchouts,
      updatedAtUtc: now
    };

    const existingSession = store.sessions.some((value) => value.id === input.sessionId);
    const sessions = existingSession
      ? store.sessions.map((value) => value.id === input.sessionId ? session : value)
      : [...store.sessions, session];

    await this.repository.save({
      ...store,
      sessions
    });

    return session;
  }

  public async getSessionHandoff(phase: ProjectPhase): Promise<{
    readonly lastSession: BrainSession | null;
    readonly nextTask: BrainTask | null;
    readonly rules: ReadonlyArray<PhaseRule>;
  }> {
    const store = await this.loadOrCreate();
    const rules = this.rulesForPhase(store.rules, phase);

    const lastSession = [...store.sessions]
      .sort((left, right) => left.updatedAtUtc.localeCompare(right.updatedAtUtc))
      .at(-1) ?? null;

    const nextTask = store.tasks.find((task) => task.status === "in_progress")
      ?? store.tasks.find((task) => task.status === "todo")
      ?? null;

    return {
      lastSession,
      nextTask,
      rules
    };
  }

  public async addDecision(
    question: string,
    decision: string,
    rationale: string,
    alternatives: ReadonlyArray<string>,
    taskId: string | null
  ): Promise<DecisionRecord> {
    const store = await this.loadOrCreate();
    if (taskId !== null) {
      await this.requireTask(taskId);
    }

    const created: DecisionRecord = {
      id: randomUUID(),
      question: question.trim(),
      decision: decision.trim(),
      rationale: rationale.trim(),
      alternatives,
      taskId,
      createdAtUtc: new Date().toISOString()
    };

    await this.repository.save({
      ...store,
      decisions: [...store.decisions, created]
    });

    return created;
  }

  public async searchDecisions(searchText: string): Promise<ReadonlyArray<DecisionRecord>> {
    const store = await this.loadOrCreate();
    const term = searchText.trim().toLowerCase();
    if (term.length === 0) {
      return store.decisions;
    }

    return store.decisions.filter((item) =>
      item.question.toLowerCase().includes(term) || item.decision.toLowerCase().includes(term));
  }

  public async listRulesByPhase(phase: ProjectPhase): Promise<ReadonlyArray<PhaseRule>> {
    const store = await this.loadOrCreate();
    return this.rulesForPhase(store.rules, phase);
  }

  public async getEngineerPreferences(engineerId = defaultEngineerId()): Promise<{
    readonly engineerId: string;
    readonly preferences: EngineerPreferences;
  }> {
    const store = await this.loadOrCreate();
    return {
      engineerId,
      preferences: this.getPreferencesFromStore(store, engineerId)
    };
  }

  public async setEngineerPreferences(
    strictTaskGate: boolean,
    engineerId = defaultEngineerId()
  ): Promise<{
    readonly engineerId: string;
    readonly preferences: EngineerPreferences;
  }> {
    const store = await this.loadOrCreate();
    const preferences: EngineerPreferences = {
      strictTaskGate,
      updatedAtUtc: new Date().toISOString()
    };

    await this.repository.save({
      ...store,
      engineerPreferences: {
        ...store.engineerPreferences,
        [engineerId]: preferences
      }
    });

    return {
      engineerId,
      preferences
    };
  }

  public async beginFeature(input: BeginFeatureInput): Promise<{
    readonly previousHandoff: {
      readonly lastSession: BrainSession | null;
      readonly nextTask: BrainTask | null;
      readonly rules: ReadonlyArray<PhaseRule>;
    };
    readonly activeTask: BrainTask;
    readonly activeSession: BrainSession | null;
    readonly activeRules: ReadonlyArray<PhaseRule>;
  }> {
    const previousHandoff = await this.getSessionHandoff(input.phase);
    const createdTask = await this.createTask(input.title, input.description);
    const activeTask = await this.startTask(createdTask.id);

    let activeSession: BrainSession | null = null;
    if (input.sessionId !== null && input.sessionId.trim().length > 0) {
      activeSession = await this.addSessionProgress({
        sessionId: input.sessionId,
        phase: input.phase,
        taskId: activeTask.id,
        doneItems: [],
        nextItems: input.nextItems,
        watchouts: input.watchouts
      });
    }

    const activeRules = await this.listRulesByPhase(input.phase);

    return {
      previousHandoff,
      activeTask,
      activeSession,
      activeRules
    };
  }

  private rulesForPhase(
    rules: ReadonlyArray<PhaseRule>,
    phase: ProjectPhase
  ): ReadonlyArray<PhaseRule> {
    return rules.filter((rule) => rule.phases.includes(phase));
  }

  private async loadOrCreate(): Promise<BrainStore> {
    const current = await this.repository.load();
    if (current.rules.length > 0) {
      return current;
    }

    const initialized: BrainStore = {
      ...current,
      rules: defaultRules()
    };
    await this.repository.save(initialized);
    return initialized;
  }

  private getPreferencesFromStore(store: BrainStore, engineerId: string): EngineerPreferences {
    return store.engineerPreferences[engineerId] ?? {
      strictTaskGate: true,
      updatedAtUtc: new Date(0).toISOString()
    };
  }
}

function defaultEngineerId(): string {
  return process.env.USERNAME ?? process.env.USER ?? "unknown-engineer";
}

function defaultRules(): ReadonlyArray<PhaseRule> {
  return [
    {
      id: "validate-inputs",
      title: "Always validate inputs",
      content: "Validate command payloads and user-supplied values at boundaries.",
      phases: ["discovery", "implementation", "review", "release"],
      severity: "must"
    },
    {
      id: "no-error-swallowing",
      title: "Never skip error handling",
      content: "Handle and return actionable error context instead of swallowing exceptions.",
      phases: ["implementation", "review"],
      severity: "must"
    },
    {
      id: "ship-with-test-plan",
      title: "Define a test plan",
      content: "Document how to validate feature behavior before release.",
      phases: ["review", "release"],
      severity: "should"
    }
  ];
}
