export type ProjectPhase = "discovery" | "implementation" | "review" | "release";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type RuleSeverity = "must" | "should";

export interface BrainTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly createdAtUtc: string;
  readonly updatedAtUtc: string;
}

export interface BrainSession {
  readonly id: string;
  readonly phase: ProjectPhase;
  readonly taskId: string | null;
  readonly doneItems: ReadonlyArray<string>;
  readonly nextItems: ReadonlyArray<string>;
  readonly watchouts: ReadonlyArray<string>;
  readonly updatedAtUtc: string;
}

export interface DecisionRecord {
  readonly id: string;
  readonly question: string;
  readonly decision: string;
  readonly rationale: string;
  readonly alternatives: ReadonlyArray<string>;
  readonly taskId: string | null;
  readonly createdAtUtc: string;
}

export interface PhaseRule {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly phases: ReadonlyArray<ProjectPhase>;
  readonly severity: RuleSeverity;
}

export interface EngineerPreferences {
  readonly strictTaskGate: boolean;
  readonly updatedAtUtc: string;
}

export interface BrainStore {
  readonly tasks: ReadonlyArray<BrainTask>;
  readonly sessions: ReadonlyArray<BrainSession>;
  readonly decisions: ReadonlyArray<DecisionRecord>;
  readonly rules: ReadonlyArray<PhaseRule>;
  readonly engineerPreferences: Readonly<Record<string, EngineerPreferences>>;
}
