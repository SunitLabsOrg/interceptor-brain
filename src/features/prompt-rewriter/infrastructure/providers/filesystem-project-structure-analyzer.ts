import { readdir } from "node:fs/promises";
import path from "node:path";
import type { LanguageKind } from "../../../shared/domain/contracts/common.js";
import type { ProjectSnapshot, ProjectStructureAnalyzer } from "../../domain/contracts/prompt-services.js";

const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MAX_ENTRIES = 400;

export class FileSystemProjectStructureAnalyzer implements ProjectStructureAnalyzer {
  private readonly maxDepth: number;
  private readonly maxEntries: number;

  public constructor(maxDepth = DEFAULT_MAX_DEPTH, maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxDepth = maxDepth;
    this.maxEntries = maxEntries;
  }

  public async analyze(workspacePath: string): Promise<ProjectSnapshot> {
    const collected: string[] = [];
    await walk(workspacePath, workspacePath, 0, this.maxDepth, this.maxEntries, collected);

    const importantPaths = collected.filter((value) => isImportantPath(value));
    const detectedStacks = detectStacks(collected);

    return {
      rootPath: workspacePath,
      importantPaths: importantPaths.slice(0, 40),
      detectedStacks
    };
  }
}

async function walk(
  basePath: string,
  currentPath: string,
  depth: number,
  maxDepth: number,
  maxEntries: number,
  output: string[]
): Promise<void> {
  if (depth > maxDepth || output.length >= maxEntries) {
    return;
  }

  let entries;
  try {
    entries = await readdir(currentPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (output.length >= maxEntries) {
      break;
    }

    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    const relativePath = path.relative(basePath, absolutePath).replaceAll("\\", "/");
    output.push(relativePath);

    if (entry.isDirectory()) {
      await walk(basePath, absolutePath, depth + 1, maxDepth, maxEntries, output);
    }
  }
}

function isImportantPath(relativePath: string): boolean {
  return (
    relativePath.endsWith("pyproject.toml")
    || relativePath.endsWith("requirements.txt")
    || relativePath.endsWith(".sln")
    || relativePath.endsWith(".csproj")
    || relativePath.endsWith(".cursor/rules")
    || relativePath.includes("/src")
    || relativePath.startsWith("src")
  );
}

function detectStacks(paths: ReadonlyArray<string>): LanguageKind[] {
  const hasPython = paths.some((entry) =>
    entry.endsWith(".py") || entry.endsWith("pyproject.toml") || entry.endsWith("requirements.txt"));

  const hasDotNet = paths.some((entry) =>
    entry.endsWith(".sln") || entry.endsWith(".csproj") || entry.endsWith(".cs"));

  const stacks: LanguageKind[] = [];
  if (hasPython) {
    stacks.push("python");
  }
  if (hasDotNet) {
    stacks.push("dotnet");
  }
  return stacks;
}
