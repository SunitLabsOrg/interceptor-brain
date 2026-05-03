# MCP Client Configuration

This doc shows how to wire Interceptor Brain into `Cursor`, `Claude Desktop`, `Windsurf`, and `GitHub Copilot`.

## Quick Note

For a **5-minute walkthrough** of how to use the tools once wired up, see **[QUICKSTART.md](QUICKSTART.md)**.

If you run `interceptor-brain-init`, the repo will generate merge-ready snippets in `.interceptor-brain/` for the clients you choose:

- `.interceptor-brain/claude_desktop_config.snippet.json`
- `.interceptor-brain/windsurf_mcp_config.snippet.json`
- `.interceptor-brain/copilot_mcp_config.snippet.json`

Cursor is written directly to `.cursor/mcp.json` because that is the config file Cursor reads.

---

## Shared Server Entry

Use the same server entry in every client. The only difference is the target config file.

### Local install

```json
{
  "command": "node",
  "args": [
    "c:/path/to/your/repo/dist/server/main.js"
  ],
  "env": {
    "INTERCEPTOR_BRAIN_STORE": "c:/path/to/your/repo/.interceptor-brain/store.json"
  }
}
```

### Global install

If you installed globally, use:

```json
{
  "command": "interceptor-brain-mcp",
  "env": {
    "INTERCEPTOR_BRAIN_STORE": "c:/path/to/your/repo/.interceptor-brain/store.json"
  }
}
```

---

## Cursor

Cursor reads `.cursor/mcp.json` in the repo root.

```json
{
  "mcpServers": {
    "interceptor-brain": {
      "command": "node",
      "args": [
        "c:/path/to/your/repo/dist/server/main.js"
      ],
      "env": {
        "INTERCEPTOR_BRAIN_STORE": "c:/path/to/your/repo/.interceptor-brain/store.json"
      }
    }
  }
}
```

If you use the global npm install, swap the `command` to `interceptor-brain-mcp`.

---

## Claude Desktop

Claude Desktop uses a JSON config file:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the same `mcpServers` object under the top-level config. The generated snippet file is `.interceptor-brain/claude_desktop_config.snippet.json`.

```json
{
  "mcpServers": {
    "interceptor-brain": {
      "command": "node",
      "args": [
        "c:/path/to/your/repo/dist/server/main.js"
      ],
      "env": {
        "INTERCEPTOR_BRAIN_STORE": "c:/path/to/your/repo/.interceptor-brain/store.json"
      }
    }
  }
}
```

Claude Desktop currently requires a restart after config changes.

---

## Windsurf

Windsurf reads `mcp_config.json` from the user profile:

- **Windows:** `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
- **macOS/Linux:** `~/.codeium/windsurf/mcp_config.json`

Merge the generated snippet file `.interceptor-brain/windsurf_mcp_config.snippet.json` into that config.

```json
{
  "mcpServers": {
    "interceptor-brain": {
      "command": "node",
      "args": [
        "c:/path/to/your/repo/dist/server/main.js"
      ],
      "env": {
        "INTERCEPTOR_BRAIN_STORE": "c:/path/to/your/repo/.interceptor-brain/store.json"
      }
    }
  }
}
```

---

## GitHub Copilot

Copilot supports MCP in two useful places for this project:

1. **Copilot CLI** via `~/.copilot/mcp-config.json`
2. **Copilot cloud agent** in repository settings under **Copilot > Cloud agent**

The generated snippet file is `.interceptor-brain/copilot_mcp_config.snippet.json`.

### Copilot CLI

Use the same `mcpServers` entry, but include the Copilot-required `type` and `tools` fields:

```json
{
  "mcpServers": {
    "interceptor-brain": {
      "type": "local",
      "command": "node",
      "args": [
        "c:/path/to/your/repo/dist/server/main.js"
      ],
      "env": {
        "INTERCEPTOR_BRAIN_STORE": "c:/path/to/your/repo/.interceptor-brain/store.json"
      },
      "tools": ["*"]
    }
  }
}
```

### Copilot cloud agent

Use the same JSON structure in the repository's **MCP configuration** section. If you need secrets for other servers later, only names beginning with `COPILOT_MCP_` are available there. Interceptor Brain itself does not require secrets.

---

## Configuration Tips

- Keep **one store file per repository**.
- Keep **server name repo-specific** if you have more than one brain package.
- Keep `.interceptor-brain/` local unless your team explicitly wants to commit the generated snippets.

## Your First Call

After wiring up, **refresh MCP servers** in your client and try:

```bash
brain_begin_feature "my-feature" implementation
```

See **[QUICKSTART.md](QUICKSTART.md)** for the full workflow.
