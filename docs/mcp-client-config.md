# MCP Client Configuration

This doc shows how to wire Interceptor Brain into Cursor, Claude Desktop, and other clients.

## Quick Note

For a **5-minute walkthrough** of how to use the tools once wired up, see **[QUICKSTART.md](QUICKSTART.md)**.

---

## Cursor MCP Configuration

Add this to your Cursor MCP config (or merge into existing servers):

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

**Notes:**

- Replace `c:/path/to/your/repo` with your actual repo path.
- If you installed globally (`npm i -g @sunit24blr/brain-mcp`), use:
  ```json
  {
    "command": "interceptor-brain-mcp"
  }
  ```

## Claude Desktop MCP Configuration

Add this to Claude Desktop config (or merge into existing `mcpServers`):

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

## .NET Solution Example (Ready to Paste)

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

## Configuration Tips

- Keep **one store file per repository** (don't share stores across repos).
- Keep **server name repo-specific** (e.g., `interceptor-brain-orders-api`, `interceptor-brain-inventory`).
- **Commit policy is up to your team**; most teams keep `.interceptor-brain/` local only (add to `.gitignore`).

## Your First Call

After wiring up, **refresh MCP servers** in your client and try:

```
brain_begin_feature "my-feature" implementation
```

See **[QUICKSTART.md](QUICKSTART.md)** for a full walkthrough.
