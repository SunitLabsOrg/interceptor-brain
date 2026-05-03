# The Interceptor Brain MCP

MCP server that acts as the project's persistent brain.

[![npm version](https://img.shields.io/npm/v/%40interceptor%2Fbrain-mcp)](https://www.npmjs.com/package/@interceptor/brain-mcp)
[![npm downloads](https://img.shields.io/npm/dm/%40interceptor%2Fbrain-mcp)](https://www.npmjs.com/package/@interceptor/brain-mcp)
[![license](https://img.shields.io/npm/l/%40interceptor%2Fbrain-mcp)](./LICENSE)

## Getting Started in 60 Seconds

```bash
npm i -g @interceptor/brain-mcp
interceptor-brain-init
```

After a global install, npm runs `postinstall` and prints the **BRAIN SP** banner (red in a normal terminal). The same banner appears when you run **`interceptor-brain-init`** in any directory, before prompts or non-interactive setup.

Then in your AI client:

1. Refresh MCP servers.
2. Run `brain_begin_feature "my-feature" implementation`.
3. Gate code changes with `brain_require_task "my-feature"`.
4. Log decisions with `brain_log_decision` (when you make an arch choice).
5. End session with `brain_update_session` (done/next/watchouts).

**For a walkthrough**, see **[docs/QUICKSTART.md](docs/QUICKSTART.md)**.

## What It Solves

- **Session handoff** in one tool call (what was done, what is next, what to watch out for).
- **Task gate enforcement** (implementation must map to an existing task).
- **Decision logging** with rationale for long-term traceability.
- **Phase-based rules** (`discovery`, `implementation`, `review`, `release`).

## The 5 Essential Tools

| Tool | Purpose |
|------|---------|
| **`brain_begin_feature`** | Start feature: handoff + create task + start task + phase rules (one call) |
| **`brain_require_task`** | Gate: enforce task exists (and optionally is `in_progress`) before coding |
| **`brain_update_session`** | End session: log done/next/watchouts for the next person |
| **`brain_handoff`** | Resume: read last session + phase rules for your phase |
| **`brain_log_decision`** | Capture architecture decisions + rationale for audit trail |

**Optional / Advanced:**

- `brain_create_task` — Create a task manually (if not using `brain_begin_feature`).
- `brain_start_task` — Mark a task `in_progress` manually.
- `brain_find_decisions` — Search past decisions by keyword.
- `brain_help` — Print best-practice call order.
- `brain_get_engineer_preferences` — View your preferences.
- `brain_set_engineer_preferences` — Set strict task gate default.
- `brain_rules_for_phase` — Fetch phase rules explicitly.

**Full reference:** See **[docs/TOOLS.md](docs/TOOLS.md)**.

## Storage

- Default JSON store: `.interceptor-brain/store.json` (created automatically).
- Override path with `INTERCEPTOR_BRAIN_STORE`.
- Engineer preferences are persisted in the same store and keyed by local username.

## Run

```bash
npm install
npm run build
npm run start:mcp
```

## Interactive Project Init (Python/.NET)

Engineers can initialize local config with prompts and choices:

```bash
npm run build
npm run init:project
```

Or, if installed globally:

```bash
interceptor-brain-init
```

The initializer configures project-local files based on selected options:

- `.interceptor-brain/brain.config.json`
- `.cursor/mcp.json` (if Cursor target is selected)
- `.interceptor-brain/claude_desktop_config.snippet.json` (if Claude target is selected)
- `.interceptor-brain/SETUP.md`

## Non-Interactive Init Examples

Use non-interactive flags for scripts, CI, or mass onboarding.

Dotnet project:

```bash
interceptor-brain-init \
  --projectPath ./orders-api \
  --language dotnet \
  --strict true \
  --installMode global \
  --clients cursor
```

Python project:

```bash
interceptor-brain-init \
  --projectPath ./inventory-service \
  --language python \
  --strict true \
  --installMode global \
  --clients cursor,claude
```

Flags:

- `--projectPath` (or `--path`): target repository path
- `--language`: `python` or `dotnet`
- `--strict`: `true` or `false`
- `--installMode`: `global` or `local`
- `--clients`: `cursor`, `claude`, or `cursor,claude`

## Benchmark (Before vs After)

A local test project is included at `benchmark/test-project` (Python + .NET backend fixture).

Run comparison:

```bash
npm run build
npm run benchmark:compare
```

Outputs:

- `benchmark/results/latest.json`
- `benchmark/results/latest.md`

## Client Setup

- **Quick 5-minute walkthrough:** [docs/QUICKSTART.md](docs/QUICKSTART.md)
- **Full tool reference:** [docs/TOOLS.md](docs/TOOLS.md)
- **MCP config setup:** [docs/mcp-client-config.md](docs/mcp-client-config.md)
- **.NET team SOP:** [docs/dotnet-team-sop.md](docs/dotnet-team-sop.md)
- **npm publish guide:** [docs/publish-public-npm.md](docs/publish-public-npm.md)

## High-Level Design

- **Transport layer**: MCP stdio server in `src/server/main.ts` exposes project-brain tools.
- **Tool adapter layer**: `register-project-brain-tools` maps MCP tool inputs/outputs to application use-cases.
- **Application layer**: `ProjectBrainService` orchestrates handoffs, task gating, decisions, and phase rules.
- **Domain layer**: strongly-typed contracts in `project-brain/domain/contracts` define task/session/decision/rule models.
- **Infrastructure layer**: `JsonFileBrainRepository` persists all state in `.interceptor-brain/store.json`.

## Architecture Flow

1. Engineer (or agent) calls an MCP tool.
2. Tool adapter validates input via Zod and invokes `ProjectBrainService`.
3. Service loads/persists brain state via repository abstraction.
4. Service enforces business rules:
   - task must exist before implementation
   - strict mode optionally requires `in_progress`
   - phase-based rules are loaded automatically
5. Tool returns compact text output for low token overhead in agent prompts.

## Feature Folder Structure

The project follows feature-first layering:

- `src/features/project-brain/domain`: business models and repository contracts.
- `src/features/project-brain/application`: orchestration services and factory.
- `src/features/project-brain/infrastructure`: MCP tool registration and JSON persistence.
- `src/server`: MCP host bootstrap.

## Engineering Principles

- Feature-folder structure.
- SOLID and dependency inversion at boundaries.
- Keep code simple, explicit, and testable.
