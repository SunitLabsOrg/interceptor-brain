#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerProjectBrainTools } from "../features/project-brain/infrastructure/mcp/register-project-brain-tools.js";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "interceptor-project-brain",
    version: "0.1.0"
  });

  registerProjectBrainTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("interceptor-project-brain failed to start", error);
  process.exit(1);
});
