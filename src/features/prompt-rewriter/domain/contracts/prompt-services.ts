import type { PromptInput, PromptOutput } from "./prompt-contracts.js";

export interface RuleDefinition {
  readonly name: string;
  readonly priority: number;
  readonly description: string;
}

export interface SkillDefinition {
  readonly name: string;
  readonly description: string;
  readonly supportedLanguages: ReadonlyArray<"python" | "dotnet">;
}

export interface ProjectSnapshot {
  readonly rootPath: string;
  readonly importantPaths: ReadonlyArray<string>;
  readonly detectedStacks: ReadonlyArray<"python" | "dotnet">;
}

export interface RuleProvider {
  getRules(workspacePath: string): Promise<ReadonlyArray<RuleDefinition>>;
}

export interface SkillProvider {
  getSkills(workspacePath: string): Promise<ReadonlyArray<SkillDefinition>>;
}

export interface ProjectStructureAnalyzer {
  analyze(workspacePath: string): Promise<ProjectSnapshot>;
}

export interface PromptRewriter {
  rewrite(input: PromptInput): Promise<PromptOutput>;
}
