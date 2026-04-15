#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import process from "node:process";
import { detectProjectLanguage, ensureProjectPathExists, ProjectBootstrapper } from "../features/project-bootstrap/application/services/project-bootstrapper.js";
import type { ClientTarget, InstallMode } from "../features/project-bootstrap/domain/contracts/bootstrap-contracts.js";
import type { LanguageKind } from "../features/shared/domain/contracts/common.js";

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed !== null) {
    await runNonInteractive(parsed);
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const projectPathInput = await rl.question(`Project path (${process.cwd()}): `);
    const projectPath = projectPathInput.trim().length > 0 ? projectPathInput.trim() : process.cwd();
    await ensureProjectPathExists(projectPath);

    const detected = await detectProjectLanguage(projectPath);
    const language = await askLanguage(rl, detected);
    const strictTaskGateDefault = await askYesNo(
      rl,
      "Enable strict task gate by default? (y/n, default y): ",
      true
    );
    const installMode = await askInstallMode(rl);
    const clientTargets = await askClientTargets(rl);

    const bootstrapper = new ProjectBootstrapper();
    const result = await bootstrapper.initialize({
      projectPath,
      language,
      strictTaskGateDefault,
      clientTargets,
      installMode
    });

    console.log("\nInitialization complete.");
    console.log(`Project: ${result.projectPath}`);
    console.log(`Language: ${result.language}`);
    console.log("Files written:");
    for (const file of result.writtenFiles) {
      console.log(`- ${file}`);
    }
  } finally {
    rl.close();
  }
}

async function askLanguage(
  rl: ReturnType<typeof createInterface>,
  detected: LanguageKind | null
): Promise<LanguageKind> {
  const autoLabel = detected === null ? "none" : detected;
  console.log(`Detected language: ${autoLabel}`);
  console.log("Select language: 1) python  2) dotnet");

  const choice = await rl.question("Choice (default auto/2): ");
  const trimmed = choice.trim();

  if (trimmed === "1") {
    return "python";
  }
  if (trimmed === "2") {
    return "dotnet";
  }
  if (detected !== null) {
    return detected;
  }
  return "dotnet";
}

async function askInstallMode(rl: ReturnType<typeof createInterface>): Promise<InstallMode> {
  console.log("Install mode: 1) global npm package  2) local project dependency");
  const mode = await rl.question("Choice (default 2): ");
  return mode.trim() === "1" ? "global" : "local";
}

async function askClientTargets(rl: ReturnType<typeof createInterface>): Promise<ReadonlyArray<ClientTarget>> {
  console.log("Client config target: 1) Cursor only  2) Claude snippet only  3) Both");
  const target = await rl.question("Choice (default 1): ");
  const trimmed = target.trim();

  if (trimmed === "2") {
    return ["claude"];
  }
  if (trimmed === "3") {
    return ["cursor", "claude"];
  }
  return ["cursor"];
}

async function askYesNo(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  defaultYes: boolean
): Promise<boolean> {
  const value = (await rl.question(prompt)).trim().toLowerCase();
  if (value === "y" || value === "yes") {
    return true;
  }
  if (value === "n" || value === "no") {
    return false;
  }
  return defaultYes;
}

main().catch((error: unknown) => {
  console.error("Initialization failed:", error);
  process.exit(1);
});

async function runNonInteractive(parsed: ParsedArgs): Promise<void> {
  await ensureProjectPathExists(parsed.projectPath);

  const bootstrapper = new ProjectBootstrapper();
  const result = await bootstrapper.initialize({
    projectPath: parsed.projectPath,
    language: parsed.language,
    strictTaskGateDefault: parsed.strictTaskGateDefault,
    clientTargets: parsed.clientTargets,
    installMode: parsed.installMode
  });

  console.log("\nInitialization complete.");
  console.log(`Project: ${result.projectPath}`);
  console.log(`Language: ${result.language}`);
  console.log("Files written:");
  for (const file of result.writtenFiles) {
    console.log(`- ${file}`);
  }
}

interface ParsedArgs {
  readonly projectPath: string;
  readonly language: LanguageKind;
  readonly strictTaskGateDefault: boolean;
  readonly installMode: InstallMode;
  readonly clientTargets: ReadonlyArray<ClientTarget>;
}

function parseArgs(args: ReadonlyArray<string>): ParsedArgs | null {
  if (args.length === 0) {
    return null;
  }

  const get = (name: string): string | undefined => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };

  const projectPath = get("--projectPath") ?? get("--path");
  const language = get("--language");
  const strict = get("--strict");
  const installMode = get("--installMode");
  const clientsRaw = get("--clients");

  if (projectPath === undefined || language === undefined || strict === undefined || installMode === undefined) {
    throw new Error(
      "Non-interactive usage requires --projectPath, --language, --strict, --installMode, and optional --clients."
    );
  }

  const normalizedLanguage = normalizeLanguage(language);
  const normalizedInstallMode = normalizeInstallMode(installMode);
  const strictTaskGateDefault = normalizeBoolean(strict);
  const clientTargets = normalizeClients(clientsRaw ?? "cursor");

  return {
    projectPath,
    language: normalizedLanguage,
    strictTaskGateDefault,
    installMode: normalizedInstallMode,
    clientTargets
  };
}

function normalizeLanguage(value: string): LanguageKind {
  if (value === "python" || value === "dotnet") {
    return value;
  }
  throw new Error(`Unsupported language: ${value}. Use python or dotnet.`);
}

function normalizeInstallMode(value: string): InstallMode {
  if (value === "global" || value === "local") {
    return value;
  }
  throw new Error(`Unsupported install mode: ${value}. Use global or local.`);
}

function normalizeBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "n") {
    return false;
  }
  throw new Error(`Unsupported strict value: ${value}. Use true or false.`);
}

function normalizeClients(value: string): ReadonlyArray<ClientTarget> {
  const parts = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

  const targets: ClientTarget[] = [];
  for (const item of parts) {
    if (item === "cursor" || item === "claude") {
      if (!targets.includes(item)) {
        targets.push(item);
      }
      continue;
    }
    throw new Error(`Unsupported client target: ${item}. Use cursor and/or claude.`);
  }

  return targets.length === 0 ? ["cursor"] : targets;
}
