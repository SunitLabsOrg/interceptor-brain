import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { createProjectBrainService } from "../../application/factories/create-project-brain-service.js";
import type { ProjectPhase } from "../../domain/contracts/brain-models.js";

const PHASES: ReadonlyArray<ProjectPhase> = ["discovery", "implementation", "review", "release"];

export function registerProjectBrainTools(server: McpServer): void {
  const brain = createProjectBrainService();

  server.registerTool(
    "brain_help",
    {
      title: "Brain workflow help",
      description: "Show recommended tool call order for daily engineering usage.",
      inputSchema: {}
    },
    async () => {
      return textResult(
        [
          "Recommended call order",
          "1) brain_get_engineer_preferences",
          "2) brain_begin_feature",
          "3) brain_require_task",
          "4) brain_rules_for_phase",
          "5) brain_log_decision (when a key choice is made)",
          "6) brain_update_session (before ending session)",
          "",
          "Common variants",
          "- Use brain_create_task + brain_start_task for manual task flow.",
          "- Use brain_handoff at the start of a resumed session.",
          "- Use brain_find_decisions to answer design-history questions."
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_begin_feature",
    {
      title: "Begin feature workflow",
      description: "One-call workflow: get prior handoff, create+start task, apply phase rules.",
      inputSchema: {
        title: z.string().min(5),
        description: z.string().min(10),
        phase: z.enum(PHASES as [ProjectPhase, ...ProjectPhase[]]).default("implementation"),
        sessionId: z.string().nullable().default(null),
        nextItems: z.array(z.string()).default([]),
        watchouts: z.array(z.string()).default([])
      }
    },
    async ({ title, description, phase, sessionId, nextItems, watchouts }) => {
      const workflow = await brain.beginFeature({
        title,
        description,
        phase,
        sessionId,
        nextItems,
        watchouts
      });

      const rulesText = workflow.activeRules.length === 0
        ? "none"
        : workflow.activeRules.map((rule) => `- [${rule.severity}] ${rule.title}: ${rule.content}`).join("\n");

      return textResult(
        [
          "Feature workflow started.",
          `phase: ${phase}`,
          "",
          "Previous session handoff:",
          `last session: ${workflow.previousHandoff.lastSession?.id ?? "none"}`,
          `done last time: ${(workflow.previousHandoff.lastSession?.doneItems ?? []).join("; ") || "none"}`,
          `next from last time: ${(workflow.previousHandoff.lastSession?.nextItems ?? []).join("; ") || "none"}`,
          `watchouts: ${(workflow.previousHandoff.lastSession?.watchouts ?? []).join("; ") || "none"}`,
          "",
          "Active task:",
          `task id: ${workflow.activeTask.id}`,
          `task title: ${workflow.activeTask.title}`,
          `task status: ${workflow.activeTask.status}`,
          `session linked: ${workflow.activeSession?.id ?? "none"}`,
          "",
          "Active rules:",
          rulesText
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_create_task",
    {
      title: "Create task",
      description: "Create a new project task before implementation begins.",
      inputSchema: {
        title: z.string().min(5),
        description: z.string().min(10)
      }
    },
    async ({ title, description }) => {
      const task = await brain.createTask(title, description);
      return textResult(`Task created.\nid: ${task.id}\nstatus: ${task.status}\ntitle: ${task.title}`);
    }
  );

  server.registerTool(
    "brain_start_task",
    {
      title: "Start task",
      description: "Move an existing task to in_progress.",
      inputSchema: {
        taskId: z.string().min(1)
      }
    },
    async ({ taskId }) => {
      const task = await brain.startTask(taskId);
      return textResult(`Task started.\nid: ${task.id}\nstatus: ${task.status}`);
    }
  );

  server.registerTool(
    "brain_require_task",
    {
      title: "Task gate",
      description: "Hard gate with engineer-specific strict mode by default.",
      inputSchema: {
        taskId: z.string().min(1),
        intent: z.string().min(3).describe("What implementation work is about to happen"),
        strictMode: z.boolean().nullable().default(null)
      }
    },
    async ({ taskId, intent, strictMode }) => {
      const preference = await brain.getEngineerPreferences();
      const effectiveStrictMode = strictMode ?? preference.preferences.strictTaskGate;
      const task = await brain.requireTask(taskId, { enforceInProgress: effectiveStrictMode });
      return textResult(
        [
          "Task gate passed.",
          `intent: ${intent}`,
          `strict mode: ${effectiveStrictMode}`,
          `task: ${task.id}`,
          `title: ${task.title}`,
          `status: ${task.status}`
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_set_engineer_preferences",
    {
      title: "Set engineer preferences",
      description: "Set local engineer defaults for strict task gate behavior.",
      inputSchema: {
        strictTaskGate: z.boolean()
      }
    },
    async ({ strictTaskGate }) => {
      const updated = await brain.setEngineerPreferences(strictTaskGate);
      return textResult(
        [
          "Engineer preferences updated.",
          `engineer: ${updated.engineerId}`,
          `strict task gate: ${updated.preferences.strictTaskGate}`,
          `updated: ${updated.preferences.updatedAtUtc}`
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_get_engineer_preferences",
    {
      title: "Get engineer preferences",
      description: "Get current local engineer defaults for task gate behavior.",
      inputSchema: {}
    },
    async () => {
      const current = await brain.getEngineerPreferences();
      return textResult(
        [
          "Engineer preferences.",
          `engineer: ${current.engineerId}`,
          `strict task gate: ${current.preferences.strictTaskGate}`,
          `updated: ${current.preferences.updatedAtUtc}`
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_update_session",
    {
      title: "Update session",
      description: "Store done/next/watchouts for future session handoffs.",
      inputSchema: {
        sessionId: z.string().min(1),
        phase: z.enum(PHASES as [ProjectPhase, ...ProjectPhase[]]),
        taskId: z.string().min(1),
        doneItems: z.array(z.string()).default([]),
        nextItems: z.array(z.string()).default([]),
        watchouts: z.array(z.string()).default([])
      }
    },
    async ({ sessionId, phase, taskId, doneItems, nextItems, watchouts }) => {
      const updated = await brain.addSessionProgress({
        sessionId,
        phase,
        taskId,
        doneItems,
        nextItems,
        watchouts
      });

      return textResult(
        [
          "Session updated.",
          `session: ${updated.id}`,
          `phase: ${updated.phase}`,
          `done: ${updated.doneItems.length}`,
          `next: ${updated.nextItems.length}`,
          `watchouts: ${updated.watchouts.length}`
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_handoff",
    {
      title: "Session handoff",
      description: "Get last session context, next task, and phase rules in one call.",
      inputSchema: {
        phase: z.enum(PHASES as [ProjectPhase, ...ProjectPhase[]])
      }
    },
    async ({ phase }) => {
      const handoff = await brain.getSessionHandoff(phase);
      const rulesText = handoff.rules.length === 0
        ? "none"
        : handoff.rules.map((rule) => `- [${rule.severity}] ${rule.title}: ${rule.content}`).join("\n");

      return textResult(
        [
          `phase: ${phase}`,
          `last session: ${handoff.lastSession?.id ?? "none"}`,
          `done last time: ${(handoff.lastSession?.doneItems ?? []).join("; ") || "none"}`,
          `next steps: ${(handoff.lastSession?.nextItems ?? []).join("; ") || "none"}`,
          `watchouts: ${(handoff.lastSession?.watchouts ?? []).join("; ") || "none"}`,
          `next task: ${handoff.nextTask?.id ?? "none"} ${handoff.nextTask?.title ?? ""}`.trim(),
          "phase rules:",
          rulesText
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_log_decision",
    {
      title: "Log decision",
      description: "Record architecture decisions and rationale for future sessions.",
      inputSchema: {
        question: z.string().min(5),
        decision: z.string().min(5),
        rationale: z.string().min(5),
        alternatives: z.array(z.string()).default([]),
        taskId: z.string().nullable().default(null)
      }
    },
    async ({ question, decision, rationale, alternatives, taskId }) => {
      const created = await brain.addDecision(question, decision, rationale, alternatives, taskId);
      return textResult(
        [
          "Decision logged.",
          `id: ${created.id}`,
          `question: ${created.question}`,
          `task: ${created.taskId ?? "none"}`
        ].join("\n")
      );
    }
  );

  server.registerTool(
    "brain_find_decisions",
    {
      title: "Find decisions",
      description: "Search prior decisions by keyword.",
      inputSchema: {
        searchText: z.string().default("")
      }
    },
    async ({ searchText }) => {
      const decisions = await brain.searchDecisions(searchText);
      return textResult(
        decisions.length === 0
          ? "No decisions found."
          : decisions
            .map((item) => `- ${item.question}\n  decision: ${item.decision}\n  rationale: ${item.rationale}`)
            .join("\n")
      );
    }
  );

  server.registerTool(
    "brain_rules_for_phase",
    {
      title: "Rules by phase",
      description: "Load automatic rules for a project phase.",
      inputSchema: {
        phase: z.enum(PHASES as [ProjectPhase, ...ProjectPhase[]])
      }
    },
    async ({ phase }) => {
      const rules = await brain.listRulesByPhase(phase);
      return textResult(
        rules.length === 0
          ? "No phase rules."
          : rules.map((rule) => `- [${rule.severity}] ${rule.title}: ${rule.content}`).join("\n")
      );
    }
  );
}

function textResult(text: string): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}
