import type { PromptRewriter } from "../../domain/contracts/prompt-services.js";
import { InMemorySessionContextCache } from "../../../memory-tree/infrastructure/cache/in-memory-session-context-cache.js";
import { DefaultPromptRewriter } from "../services/default-prompt-rewriter.js";
import { CursorRuleProvider } from "../../infrastructure/providers/cursor-rule-provider.js";
import { DefaultSkillProvider } from "../../infrastructure/providers/default-skill-provider.js";
import { FileSystemProjectStructureAnalyzer } from "../../infrastructure/providers/filesystem-project-structure-analyzer.js";

export function createDefaultPromptRewriter(): PromptRewriter {
  return new DefaultPromptRewriter({
    ruleProvider: new CursorRuleProvider(),
    skillProvider: new DefaultSkillProvider(),
    projectStructureAnalyzer: new FileSystemProjectStructureAnalyzer(),
    sessionContextCache: new InMemorySessionContextCache()
  });
}
