import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";
import type { RuleDefinition, RuleProvider } from "../../domain/contracts/prompt-services.js";

export class CursorRuleProvider implements RuleProvider {
  public async getRules(workspacePath: string): Promise<ReadonlyArray<RuleDefinition>> {
    const cursorRules = await this.loadCursorRuleFiles(workspacePath);
    const rootRule = await this.loadRootRuleFile(workspacePath);

    const combined = [...rootRule, ...cursorRules];
    return combined.sort((left, right) => left.priority - right.priority);
  }

  private async loadCursorRuleFiles(workspacePath: string): Promise<RuleDefinition[]> {
    const rulesDirectory = path.join(workspacePath, ".cursor", "rules");
    let entries: Dirent[] = [];

    try {
      const items = await readdir(rulesDirectory, { withFileTypes: true });
      entries = items.filter((item) => item.isFile() && item.name.endsWith(".mdc"));
    } catch {
      return [];
    }

    const loadedRules = await Promise.all(entries.map(async (entry, index) => {
      const filePath = path.join(rulesDirectory, entry.name);
      const content = await readFile(filePath, "utf8");
      const description = readDescription(content) ?? "No description";

      return {
        name: entry.name.replace(".mdc", ""),
        description,
        priority: index + 10
      } satisfies RuleDefinition;
    }));

    return loadedRules;
  }

  private async loadRootRuleFile(workspacePath: string): Promise<RuleDefinition[]> {
    const filePath = path.join(workspacePath, ".cursorrules");

    try {
      const content = await readFile(filePath, "utf8");
      const firstTextLine = content
        .split("\n")
        .map((line: string) => line.trim())
        .find((line: string) => line.length > 0);

      return [{
        name: ".cursorrules",
        description: firstTextLine ?? "Global project guidance",
        priority: 1
      }];
    } catch {
      return [];
    }
  }
}

function readDescription(content: string): string | undefined {
  const match = content.match(/description:\s*(.+)/);
  return match?.[1]?.trim();
}
