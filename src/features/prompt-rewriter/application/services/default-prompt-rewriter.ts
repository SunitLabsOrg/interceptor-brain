import type { SessionContextCache } from "../../../memory-tree/domain/contracts/memory-contracts.js";
import type { PromptInput, PromptOutput, PromptSection } from "../../domain/contracts/prompt-contracts.js";
import type {
  ProjectStructureAnalyzer,
  PromptRewriter,
  RuleProvider,
  SkillProvider
} from "../../domain/contracts/prompt-services.js";

export interface PromptRewriterDependencies {
  readonly ruleProvider: RuleProvider;
  readonly skillProvider: SkillProvider;
  readonly projectStructureAnalyzer: ProjectStructureAnalyzer;
  readonly sessionContextCache?: SessionContextCache;
}

export class DefaultPromptRewriter implements PromptRewriter {
  private readonly ruleProvider: RuleProvider;
  private readonly skillProvider: SkillProvider;
  private readonly projectStructureAnalyzer: ProjectStructureAnalyzer;
  private readonly sessionContextCache?: SessionContextCache;

  public constructor(dependencies: PromptRewriterDependencies) {
    this.ruleProvider = dependencies.ruleProvider;
    this.skillProvider = dependencies.skillProvider;
    this.projectStructureAnalyzer = dependencies.projectStructureAnalyzer;
    this.sessionContextCache = dependencies.sessionContextCache;
  }

  public async rewrite(input: PromptInput): Promise<PromptOutput> {
    const [rules, skills, projectSnapshot, cachedSession] = await Promise.all([
      this.ruleProvider.getRules(input.workspacePath),
      this.skillProvider.getSkills(input.workspacePath),
      this.projectStructureAnalyzer.analyze(input.workspacePath),
      this.sessionContextCache?.get(input.sessionId)
    ]);

    const sections: PromptSection[] = [
      {
        title: "input",
        content: input.rawPrompt.trim()
      },
      {
        title: "rules",
        content: rules.length === 0
          ? "No explicit rules found."
          : rules
            .map((rule) => `- (${rule.priority}) ${rule.name}: ${rule.description}`)
            .join("\n")
      },
      {
        title: "skills",
        content: skills.length === 0
          ? "No explicit skills found."
          : skills
            .filter((skill) => skill.supportedLanguages.includes(input.language))
            .map((skill) => `- ${skill.name}: ${skill.description}`)
            .join("\n")
      },
      {
        title: "project",
        content: [
          `workspace: ${projectSnapshot.rootPath}`,
          `detected stacks: ${projectSnapshot.detectedStacks.join(", ") || "none"}`,
          `important paths:`,
          ...projectSnapshot.importantPaths.map((path) => `- ${path}`)
        ].join("\n")
      },
      {
        title: "memory",
        content: cachedSession === undefined
          ? "No cached session context."
          : [
              `session: ${cachedSession.sessionId}`,
              `summary: ${cachedSession.summary}`,
              `tags: ${cachedSession.tags.join(", ") || "none"}`,
              `fingerprint: ${cachedSession.promptFingerprint}`
            ].join("\n")
      }
    ];

    const finalPrompt = sections
      .map((section) => `## ${section.title}\n${section.content}`)
      .join("\n\n");

    return {
      finalPrompt,
      sections,
      tokenEstimate: estimateTokenCount(finalPrompt)
    };
  }
}

function estimateTokenCount(value: string): number {
  return Math.ceil(value.length / 4);
}
