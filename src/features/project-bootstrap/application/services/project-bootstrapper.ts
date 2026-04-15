import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LanguageKind } from "../../../shared/domain/contracts/common.js";
import type {
  BootstrapInitOptions,
  BootstrapInitResult,
  ClientTarget,
  InstallMode
} from "../../domain/contracts/bootstrap-contracts.js";

export async function detectProjectLanguage(projectPath: string): Promise<LanguageKind | null> {
  const markers = await collectMarkers(projectPath, 2);
  const hasPython = markers.some((item) =>
    item.endsWith(".py") || item.endsWith("pyproject.toml") || item.endsWith("requirements.txt"));
  const hasDotnet = markers.some((item) =>
    item.endsWith(".sln") || item.endsWith(".csproj") || item.endsWith(".cs"));

  if (hasDotnet && !hasPython) {
    return "dotnet";
  }
  if (hasPython && !hasDotnet) {
    return "python";
  }
  return null;
}

export class ProjectBootstrapper {
  public async initialize(options: BootstrapInitOptions): Promise<BootstrapInitResult> {
    const projectPath = path.resolve(options.projectPath);
    const writtenFiles: string[] = [];

    const brainDirectory = path.join(projectPath, ".interceptor-brain");
    await mkdir(brainDirectory, { recursive: true });

    const storePath = toForwardSlashes(path.join(brainDirectory, "store.json"));
    const brainConfigPath = path.join(brainDirectory, "brain.config.json");
    await writeFile(
      brainConfigPath,
      JSON.stringify({
        language: options.language,
        strictTaskGateDefault: options.strictTaskGateDefault,
        mcpStorePath: storePath,
        createdAtUtc: new Date().toISOString()
      }, null, 2),
      "utf8"
    );
    writtenFiles.push(brainConfigPath);

    if (options.clientTargets.includes("cursor")) {
      const cursorPath = await writeCursorConfig(projectPath, storePath, options.installMode);
      writtenFiles.push(cursorPath);
    }

    if (options.clientTargets.includes("claude")) {
      const claudePath = path.join(brainDirectory, "claude_desktop_config.snippet.json");
      await writeFile(
        claudePath,
        JSON.stringify({
          mcpServers: {
            "interceptor-brain": buildMcpServerEntry(projectPath, storePath, options.installMode)
          }
        }, null, 2),
        "utf8"
      );
      writtenFiles.push(claudePath);
    }

    const setupGuidePath = path.join(brainDirectory, "SETUP.md");
    await writeFile(setupGuidePath, buildSetupGuide(options.clientTargets), "utf8");
    writtenFiles.push(setupGuidePath);

    return {
      projectPath,
      language: options.language,
      writtenFiles
    };
  }
}

async function writeCursorConfig(
  projectPath: string,
  storePath: string,
  installMode: InstallMode
): Promise<string> {
  const cursorDirectory = path.join(projectPath, ".cursor");
  await mkdir(cursorDirectory, { recursive: true });
  const cursorConfigPath = path.join(cursorDirectory, "mcp.json");
  const serverEntry = buildMcpServerEntry(projectPath, storePath, installMode);

  let existing: { mcpServers?: Record<string, unknown> } = {};
  try {
    const content = await readFile(cursorConfigPath, "utf8");
    existing = JSON.parse(content) as { mcpServers?: Record<string, unknown> };
  } catch {
    existing = {};
  }

  await writeFile(
    cursorConfigPath,
    JSON.stringify({
      ...existing,
      mcpServers: {
        ...(existing.mcpServers ?? {}),
        "interceptor-brain": serverEntry
      }
    }, null, 2),
    "utf8"
  );

  return cursorConfigPath;
}

function buildMcpServerEntry(
  projectPath: string,
  storePath: string,
  installMode: InstallMode
): { command: string; args?: string[]; env: Record<string, string> } {
  if (installMode === "global") {
    return {
      command: "interceptor-brain-mcp",
      env: {
        INTERCEPTOR_BRAIN_STORE: storePath
      }
    };
  }

  const localServerPath = toForwardSlashes(
    path.join(projectPath, "node_modules", "@interceptor", "brain-mcp", "dist", "server", "main.js")
  );
  return {
    command: "node",
    args: [localServerPath],
    env: {
      INTERCEPTOR_BRAIN_STORE: storePath
    }
  };
}

function buildSetupGuide(clientTargets: ReadonlyArray<ClientTarget>): string {
  const lines = [
    "# Project Brain Setup",
    "",
    "Initialization complete.",
    "",
    "Next steps:",
    "1. Open your AI client and refresh MCP servers.",
    "2. Call `brain_set_engineer_preferences` to choose strict gate behavior.",
    "3. Start work with `brain_begin_feature`.",
    "4. End each session with `brain_update_session`."
  ];

  if (clientTargets.includes("claude")) {
    lines.push("");
    lines.push("For Claude Desktop, merge `claude_desktop_config.snippet.json` into your app config.");
  }

  return lines.join("\n");
}

async function collectMarkers(basePath: string, maxDepth: number): Promise<string[]> {
  const markers: string[] = [];
  await walk(basePath, basePath, 0, maxDepth, markers);
  return markers;
}

async function walk(
  basePath: string,
  currentPath: string,
  depth: number,
  maxDepth: number,
  output: string[]
): Promise<void> {
  if (depth > maxDepth) {
    return;
  }

  let entries;
  try {
    entries = await readdir(currentPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "bin" || entry.name === "obj") {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    const relativePath = path.relative(basePath, absolutePath).replaceAll("\\", "/");
    output.push(relativePath);

    if (entry.isDirectory()) {
      await walk(basePath, absolutePath, depth + 1, maxDepth, output);
    }
  }
}

function toForwardSlashes(value: string): string {
  return value.replaceAll("\\", "/");
}

export async function ensureProjectPathExists(projectPath: string): Promise<void> {
  try {
    await access(projectPath);
  } catch {
    throw new Error(`Project path does not exist: ${projectPath}`);
  }
}
