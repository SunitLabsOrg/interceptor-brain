import type { LanguageKind } from "../../../shared/domain/contracts/common.js";

export interface PromptInput {
  readonly rawPrompt: string;
  readonly workspacePath: string;
  readonly language: LanguageKind;
  readonly sessionId: string;
}

export interface PromptSection {
  readonly title: string;
  readonly content: string;
}

export interface PromptOutput {
  readonly finalPrompt: string;
  readonly sections: ReadonlyArray<PromptSection>;
  readonly tokenEstimate: number;
}
