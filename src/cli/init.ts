#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import process from "node:process";
import { detectProjectLanguage, ensureProjectPathExists, ProjectBootstrapper } from "../features/project-bootstrap/application/services/project-bootstrapper.js";
import type { ClientTarget, InstallMode } from "../features/project-bootstrap/domain/contracts/bootstrap-contracts.js";
import type { LanguageKind } from "../features/shared/domain/contracts/common.js";

async function main(): Promise<void> {
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
