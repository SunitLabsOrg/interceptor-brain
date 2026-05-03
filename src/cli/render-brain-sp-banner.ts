import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Prints the packaged BRAIN SP banner (scripts/brain-sp-banner.mjs).
 * Resolves from this module so it works for global installs (`interceptor-brain-init`).
 */
export function renderBrainSpBanner(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.join(here, "..", "..", "scripts", "brain-sp-banner.mjs");
  if (!existsSync(scriptPath)) {
    return;
  }
  spawnSync(process.execPath, [scriptPath], { stdio: "inherit" });
}
