# MCP Client Configuration

Use the built server binary after running `npm run build`.

## Cursor MCP configuration

Add this to your Cursor MCP config (or merge into existing servers):

```json
{
  "mcpServers": {
    "interceptor-brain": {
      "command": "node",
      "args": [
        "c:/jll_software/POC/SunitGitHub/the-interceptor/dist/server/main.js"
      ],
      "env": {
        "INTERCEPTOR_BRAIN_STORE": "c:/jll_software/POC/SunitGitHub/the-interceptor/.interceptor-brain/store.json"
      }
    }
  }
}
```

## Claude Desktop MCP configuration

Add this to Claude Desktop config (or merge into existing `mcpServers`):

```json
{
  "mcpServers": {
    "interceptor-brain": {
      "command": "node",
      "args": [
        "c:/jll_software/POC/SunitGitHub/the-interceptor/dist/server/main.js"
      ],
      "env": {
        "INTERCEPTOR_BRAIN_STORE": "c:/jll_software/POC/SunitGitHub/the-interceptor/.interceptor-brain/store.json"
      }
    }
  }
}
```

## .NET solution example (ready to paste)

Use this pattern when your .NET repo is at `c:/work/orders-api`:

```json
{
  "mcpServers": {
    "interceptor-brain-orders-api": {
      "command": "node",
      "args": [
        "c:/jll_software/POC/SunitGitHub/the-interceptor/dist/server/main.js"
      ],
      "env": {
        "INTERCEPTOR_BRAIN_STORE": "c:/work/orders-api/.interceptor-brain/store.json"
      }
    }
  }
}
```

Tips:

- Keep one store file per repository.
- Keep server name repo-specific (example: `interceptor-brain-orders-api`).
- Commit policy is up to your team; most teams keep `.interceptor-brain` local only.

## Recommended first call

Run `brain_begin_feature` at session start to get previous handoff, create/start task, and load active rules in one step.

## Quickstart: first 5 commands

Use this sequence in a new workspace to bootstrap with low friction:

1. `brain_help` (see full recommended workflow)
2. `brain_get_engineer_preferences`
3. `brain_set_engineer_preferences` with `strictTaskGate: true` (or `false`)
4. `brain_begin_feature` with title, description, and phase
5. `brain_require_task` before implementation calls

Before ending your session, call `brain_update_session` with done/next/watchouts so handoff stays fresh.

## Engineer-level strict mode

Each engineer can control strict task-gate behavior independently:

1. Call `brain_set_engineer_preferences` with `strictTaskGate: true|false`.
2. Call `brain_require_task` without `strictMode` to use your local default.
3. Optionally pass `strictMode` in `brain_require_task` to override for one call.
