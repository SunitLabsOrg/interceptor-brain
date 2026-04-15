import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createProjectBrainService } from "../features/project-brain/application/factories/create-project-brain-service.js";
import { FileSystemProjectStructureAnalyzer } from "../features/prompt-rewriter/infrastructure/providers/filesystem-project-structure-analyzer.js";
import type { ProjectPhase } from "../features/project-brain/domain/contracts/brain-models.js";

interface Scenario {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly phase: ProjectPhase;
  readonly doneItems: ReadonlyArray<string>;
  readonly nextItems: ReadonlyArray<string>;
  readonly watchouts: ReadonlyArray<string>;
  readonly decisionQuestion?: string;
  readonly decision?: string;
  readonly rationale?: string;
}

interface ScenarioMetric {
  readonly scenarioId: string;
  readonly baselineTokens: number;
  readonly brainTokens: number;
}

const SCENARIOS: ReadonlyArray<Scenario> = [
  {
    id: "session-1",
    title: "Add order validation",
    description: "Validate request payload and add domain constraints for order totals.",
    phase: "implementation",
    doneItems: ["Created order validation service", "Hooked service into controller"],
    nextItems: ["Add integration tests", "Document validation rules"],
    watchouts: ["Do not swallow API validation exceptions"],
    decisionQuestion: "Should validation run in controller or domain service?",
    decision: "Use domain service validation",
    rationale: "Keeps business rules reusable across API and background jobs"
  },
  {
    id: "session-2",
    title: "Implement JWT auth checks",
    description: "Add auth middleware and role checks for update endpoints.",
    phase: "implementation",
    doneItems: ["Added JWT middleware", "Added role guard for admin-only path"],
    nextItems: ["Add auth test matrix", "Review security failure paths"],
    watchouts: ["Avoid exposing token parsing errors to clients"],
    decisionQuestion: "JWT or server sessions?",
    decision: "JWT",
    rationale: "Supports stateless scaling and simpler service boundaries"
  },
  {
    id: "session-3",
    title: "Prepare release hardening",
    description: "Finalize tests and release checklist for backend reliability.",
    phase: "review",
    doneItems: ["Added regression tests", "Updated release checklist"],
    nextItems: ["Run final smoke test", "Collect deployment notes"],
    watchouts: ["Ensure all failed auth paths are tested"]
  }
];

async function main(): Promise<void> {
  const workspacePath = process.cwd();
  const fixturePath = path.resolve(workspacePath, "benchmark", "test-project");
  const resultPath = path.resolve(workspacePath, "benchmark", "results");
  const storePath = path.resolve(workspacePath, ".interceptor-brain", "benchmark-store.json");

  await mkdir(resultPath, { recursive: true });
  await rm(storePath, { force: true });

  const fixtureFiles = await collectFixtureFiles(fixturePath);
  const fixtureContent = await loadFileContent(fixturePath, fixtureFiles);

  const analyzer = new FileSystemProjectStructureAnalyzer(4, 1000);
  const projectSnapshot = await analyzer.analyze(fixturePath);
  const brain = createProjectBrainService(storePath);
  const engineerId = "benchmark-engineer";
  await brain.setEngineerPreferences(true, engineerId);

  const metrics: ScenarioMetric[] = [];
  const baselineHistory: string[] = [];
  const progress = createProgressRenderer(SCENARIOS.length);
  progress.start();

  for (const [index, scenario] of SCENARIOS.entries()) {
    progress.update(index, scenario.id, "running");
    const baselinePrompt = buildBaselinePrompt(
      scenario,
      baselineHistory,
      projectSnapshot.importantPaths,
      fixtureContent
    );
    const baselineTokens = estimateTokens(baselinePrompt);
    baselineHistory.push(
      [
        `task: ${scenario.title}`,
        `done: ${scenario.doneItems.join("; ")}`,
        `next: ${scenario.nextItems.join("; ")}`,
        `watchouts: ${scenario.watchouts.join("; ")}`
      ].join("\n")
    );

    const workflow = await brain.beginFeature({
      title: scenario.title,
      description: scenario.description,
      phase: scenario.phase,
      sessionId: scenario.id,
      nextItems: scenario.nextItems,
      watchouts: scenario.watchouts
    });

    await brain.requireTask(workflow.activeTask.id, {
      engineerId,
      enforceInProgress: undefined
    });

    if (
      scenario.decisionQuestion !== undefined
      && scenario.decision !== undefined
      && scenario.rationale !== undefined
    ) {
      await brain.addDecision(
        scenario.decisionQuestion,
        scenario.decision,
        scenario.rationale,
        [],
        workflow.activeTask.id
      );
    }

    await brain.addSessionProgress({
      sessionId: scenario.id,
      phase: scenario.phase,
      taskId: workflow.activeTask.id,
      doneItems: scenario.doneItems,
      nextItems: scenario.nextItems,
      watchouts: scenario.watchouts
    });

    const handoff = await brain.getSessionHandoff(scenario.phase);
    const decisions = await brain.searchDecisions("");
    const brainPrompt = buildBrainPrompt(scenario, handoff, decisions.length);
    const brainTokens = estimateTokens(brainPrompt);

    metrics.push({
      scenarioId: scenario.id,
      baselineTokens,
      brainTokens
    });

    progress.update(index + 1, scenario.id, "done");
  }

  progress.finish();

  const totals = summarize(metrics);
  const jsonOutput = {
    generatedAtUtc: new Date().toISOString(),
    fixturePath,
    scenarios: metrics,
    totals
  };
  const markdownOutput = renderMarkdown(metrics, totals);

  await writeFile(path.join(resultPath, "latest.json"), JSON.stringify(jsonOutput, null, 2), "utf8");
  await writeFile(path.join(resultPath, "latest.md"), markdownOutput, "utf8");

  console.log(colorize("green", "Benchmark completed."));
  console.log(colorize("cyan", `Baseline tokens: ${totals.baselineTokens}`));
  console.log(colorize("magenta", `Project-brain tokens: ${totals.brainTokens}`));
  console.log(colorize("yellow", `Token reduction: ${totals.reductionPercent.toFixed(2)}%`));
  console.log(colorize("blue", `Results: ${path.join(resultPath, "latest.md")}`));
}

function buildBaselinePrompt(
  scenario: Scenario,
  history: ReadonlyArray<string>,
  importantPaths: ReadonlyArray<string>,
  fixtureContent: string
): string {
  return [
    "You are continuing backend work.",
    `Current task: ${scenario.title}`,
    `Task details: ${scenario.description}`,
    "Project important paths:",
    ...importantPaths.map((item) => `- ${item}`),
    "Previous session context (full replay):",
    ...history,
    "Relevant codebase content:",
    fixtureContent
  ].join("\n");
}

function buildBrainPrompt(
  scenario: Scenario,
  handoff: {
    readonly lastSession: { readonly doneItems: ReadonlyArray<string>; readonly watchouts: ReadonlyArray<string> } | null;
    readonly nextTask: { readonly title: string } | null;
    readonly rules: ReadonlyArray<{ readonly title: string; readonly content: string }>;
  },
  decisionCount: number
): string {
  return [
    "Project-brain session context",
    `Task: ${scenario.title}`,
    `Phase: ${scenario.phase}`,
    `Last done: ${(handoff.lastSession?.doneItems ?? []).join("; ") || "none"}`,
    `Watchouts: ${(handoff.lastSession?.watchouts ?? []).join("; ") || "none"}`,
    `Next task candidate: ${handoff.nextTask?.title ?? "none"}`,
    `Active rules: ${handoff.rules.map((rule) => rule.title).join("; ") || "none"}`,
    `Decision entries available: ${decisionCount}`
  ].join("\n");
}

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function createProgressRenderer(total: number): {
  start(): void;
  update(completed: number, scenarioId: string, state: "running" | "done"): void;
  finish(): void;
} {
  const interactive = Boolean(process.stdout.isTTY);
  const width = 36;

  return {
    start(): void {
      if (!interactive) {
        console.log("Running benchmark scenarios...");
        return;
      }
      console.log(colorize("blue", "Brainly-SP benchmark in progress"));
    },

    update(completed: number, scenarioId: string, state: "running" | "done"): void {
      if (!interactive) {
        if (state === "done") {
          console.log(`Completed ${completed}/${total}: ${scenarioId}`);
        }
        return;
      }

      const ratio = Math.max(0, Math.min(1, completed / total));
      const filled = Math.round(width * ratio);
      const empty = width - filled;
      const bar = `${"#".repeat(filled)}${"-".repeat(empty)}`;
      const percentage = Math.round(ratio * 100)
        .toString()
        .padStart(3, " ");
      const stateText = state === "running"
        ? colorize("yellow", "running")
        : colorize("green", "done   ");
      const line = `${colorize("cyan", "[" + bar + "]")} ${percentage}% ${stateText} ${scenarioId}`;

      process.stdout.write(`\r${line}`);
    },

    finish(): void {
      if (interactive) {
        process.stdout.write("\n");
      }
    }
  };
}

function colorize(
  color: "blue" | "cyan" | "green" | "yellow" | "magenta",
  text: string
): string {
  const code = ({
    blue: 34,
    cyan: 36,
    green: 32,
    yellow: 33,
    magenta: 35
  })[color];
  return `\u001b[${code}m${text}\u001b[0m`;
}

function summarize(metrics: ReadonlyArray<ScenarioMetric>): {
  readonly baselineTokens: number;
  readonly brainTokens: number;
  readonly savedTokens: number;
  readonly reductionPercent: number;
} {
  const baselineTokens = metrics.reduce((total, metric) => total + metric.baselineTokens, 0);
  const brainTokens = metrics.reduce((total, metric) => total + metric.brainTokens, 0);
  const savedTokens = baselineTokens - brainTokens;
  const reductionPercent = baselineTokens === 0
    ? 0
    : (savedTokens / baselineTokens) * 100;

  return {
    baselineTokens,
    brainTokens,
    savedTokens,
    reductionPercent
  };
}

function renderMarkdown(
  metrics: ReadonlyArray<ScenarioMetric>,
  totals: {
    readonly baselineTokens: number;
    readonly brainTokens: number;
    readonly savedTokens: number;
    readonly reductionPercent: number;
  }
): string {
  const lines = [
    "# Project-Brain Benchmark",
    "",
    "| Scenario | Baseline Tokens | Brain Tokens | Saved |",
    "|---|---:|---:|---:|"
  ];

  for (const metric of metrics) {
    const saved = metric.baselineTokens - metric.brainTokens;
    lines.push(`| ${metric.scenarioId} | ${metric.baselineTokens} | ${metric.brainTokens} | ${saved} |`);
  }

  lines.push(
    "",
    `- Baseline total tokens: ${totals.baselineTokens}`,
    `- Brain total tokens: ${totals.brainTokens}`,
    `- Saved tokens: ${totals.savedTokens}`,
    `- Reduction: ${totals.reductionPercent.toFixed(2)}%`
  );

  return lines.join("\n");
}

async function collectFixtureFiles(basePath: string): Promise<string[]> {
  const output: string[] = [];
  await walk(basePath, basePath, output);
  return output;
}

async function walk(basePath: string, currentPath: string, output: string[]): Promise<void> {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "bin" || entry.name === "obj" || entry.name === ".git") {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      await walk(basePath, absolutePath, output);
      continue;
    }

    output.push(path.relative(basePath, absolutePath).replaceAll("\\", "/"));
  }
}

async function loadFileContent(basePath: string, files: ReadonlyArray<string>): Promise<string> {
  const chunks: string[] = [];
  for (const file of files) {
    const absolutePath = path.join(basePath, file);
    const content = await readFile(absolutePath, "utf8");
    chunks.push(`### ${file}\n${content}`);
  }
  return chunks.join("\n\n");
}

try {
  await main();
} catch (error: unknown) {
  console.error("Benchmark failed:", error);
  process.exit(1);
}
