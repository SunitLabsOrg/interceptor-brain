import type { LanguageKind } from "../../../shared/domain/contracts/common.js";

export type ClientTarget = "cursor" | "claude";
export type InstallMode = "global" | "local";

export interface BootstrapInitOptions {
  readonly projectPath: string;
  readonly language: LanguageKind;
  readonly strictTaskGateDefault: boolean;
  readonly clientTargets: ReadonlyArray<ClientTarget>;
  readonly installMode: InstallMode;
}

export interface BootstrapInitResult {
  readonly projectPath: string;
  readonly language: LanguageKind;
  readonly writtenFiles: ReadonlyArray<string>;
}
