import type { SkillDefinition, SkillProvider } from "../../domain/contracts/prompt-services.js";

export class DefaultSkillProvider implements SkillProvider {
  public async getSkills(_workspacePath: string): Promise<ReadonlyArray<SkillDefinition>> {
    return [
      {
        name: "python-backend-focus",
        description: "Prefer concise Python backend context and framework-aware summaries.",
        supportedLanguages: ["python"]
      },
      {
        name: "dotnet-core-backend-focus",
        description: "Prioritize .NET Core project metadata, service layers, and API boundaries.",
        supportedLanguages: ["dotnet"]
      },
      {
        name: "token-budget-optimizer",
        description: "Compress context into deterministic sections for lower token usage.",
        supportedLanguages: ["python", "dotnet"]
      }
    ];
  }
}
