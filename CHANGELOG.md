# Changelog

All notable changes to **Interceptor Brain** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned

- CLI flags to export decisions / sessions as JSON for external tools
- Phase-based rule templates (discovery, implementation, review, release)
- Performance optimization for large decision/session histories

---

## [0.1.3] — 2026-05-03

### Added

- **Client compatibility matrix and setup snippets**
  - Clarifies support for `Cursor`, `Claude Desktop`, `Windsurf`, and `GitHub Copilot`
  - `interceptor-brain-init` now generates Windsurf and Copilot snippet files in `.interceptor-brain/`
  - `docs/mcp-client-config.md` now documents the exact merge locations for each client

### Changed

- **README.md** now includes a support matrix and updated init examples for all supported clients
- **docs/dotnet-team-sop.md** now points engineers to the per-client setup guide
- **src/cli/init.ts** accepts `windsurf` and `copilot` in interactive and non-interactive setup
- **src/features/project-bootstrap/application/services/project-bootstrapper.ts** writes Windsurf and Copilot snippet files alongside the existing Cursor and Claude outputs

---

## [0.1.1] — 2026-05-03

### Added

- **BRAIN SP console banner** — Visual identification on `npm` scripts and `interceptor-brain-init` CLI
  - Red FIGlet-style ASCII art (no external dependencies)
  - Appears on: `npm run build`, `npm run check`, `npm run start:mcp`, `npm install` (postinstall)
  - New files: `scripts/brain-sp-banner.mjs`, `src/cli/render-brain-sp-banner.ts`

- **Documentation refactor — 5-minute Quickstart**
  - New: `docs/QUICKSTART.md` — Scenario-based walkthrough (start/resume/code/end session)
  - Real examples with expected outputs
  - Troubleshooting for common issues

- **Documentation refactor — Complete tool reference**
  - New: `docs/TOOLS.md` — Full reference for all 12 tools (5 core + 7 optional/advanced)
  - Parameter schemas and examples for each tool
  - Advanced patterns (multi-engineer handoff, decision audit trail, team onboarding)

- **Project CHANGELOG.md** — Track major releases and improvements

### Changed

- **README.md — Simplified tool introduction**
  - Reduced "Key Tools" from 12-item bullet list → 5-tool table (essential workflow)
  - Added "Optional / Advanced" section
  - Links to `docs/QUICKSTART.md` for walkthrough and `docs/TOOLS.md` for complete reference
  - Updated "Getting Started" to show concrete 5-step workflow

- **docs/dotnet-team-sop.md — Rewritten for clarity**
  - Added "Quick Start (5 minutes)" section
  - Real-world example: morning session → code → decision logging → end of day
  - Troubleshooting table for common issues
  - Clearer phase mapping for .NET projects

- **docs/mcp-client-config.md — Streamlined**
  - Removed outdated "first 5 commands" section (moved to QUICKSTART)
  - Added quick note linking to QUICKSTART for walkthrough
  - Kept config examples unchanged

- **package.json — Improve npm lifecycle**
  - Added `scripts/brain-sp-banner.mjs` to published files
  - New npm scripts: `brain:banner` (explicit), pre-hooks on build/check/init
  - Updated `postinstall` message to reference `interceptor-brain-init`

### Improved

- **Documentation clarity**
  - Benchmark shows ~90% token savings in handoff prompts; docs now guide teams to 5-tool workflow
  - Reduced cognitive load: focus on essential tools first, advanced tools second
  - All docs now link together (README → QUICKSTART → TOOLS)

- **First-session experience**
  - `npm i -g @sunit24blr/brain-mcp` → BRAIN SP banner + setup prompt
  - `interceptor-brain-init` → BRAIN SP banner before interactive prompts
  - Clearer next steps in SETUP.md

### Technical

- New: `src/cli/render-brain-sp-banner.ts` — Helper to resolve and run banner from installed package
- Updated: `src/cli/init.ts` — Calls banner at CLI startup (before prompts)
- No breaking changes to MCP tool logic or data storage

---

## [0.1.0] — 2026-04-15

### Initial Release

- **12 MCP tools** for session handoff, task gating, decision logging, and phase-based rules
  - Core: `brain_help`, `brain_begin_feature`, `brain_create_task`, `brain_start_task`, `brain_require_task`, `brain_set_engineer_preferences`, `brain_get_engineer_preferences`, `brain_update_session`, `brain_handoff`, `brain_log_decision`, `brain_find_decisions`, `brain_rules_for_phase`

- **JSON-based persistence** (`.interceptor-brain/store.json`)
  - Tasks, sessions, decisions, engineer preferences per username

- **Interactive project init** (`interceptor-brain-init`)
  - Prompts for language (Python/.NET), install mode (global/local), client targets (Cursor/Claude)
  - Generates `.interceptor-brain/brain.config.json`, `.cursor/mcp.json`, `SETUP.md`

- **Non-interactive init** (CLI flags for CI/scripts)
  - Supports `--projectPath`, `--language`, `--strict`, `--installMode`, `--clients`

- **Benchmark suite** (`npm run benchmark:compare`)
  - Compares baseline vs brain-style handoff tokens
  - ~90% token savings on handoff prompts

- **Documentation**
  - README.md, docs/mcp-client-config.md, docs/dotnet-team-sop.md, docs/publish-public-npm.md

---

## Version Links

- [Unreleased](https://github.com/SunitLabsOrg/interceptor-brain/compare/v0.1.3...main)
- [0.1.3](https://github.com/SunitLabsOrg/interceptor-brain/releases/tag/v0.1.3) — 2026-05-03
- [0.1.1](https://github.com/SunitLabsOrg/interceptor-brain/releases/tag/v0.1.1) — 2026-05-03
- [0.1.0](https://github.com/SunitLabsOrg/interceptor-brain/releases/tag/v0.1.0) — 2026-04-15
