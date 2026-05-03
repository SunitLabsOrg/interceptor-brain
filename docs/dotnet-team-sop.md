# .NET Team SOP (Interceptor Brain)

This SOP defines how backend engineers should use Interceptor Brain in daily development.

## Scope

- Applies to .NET backend projects (`.sln`, `.csproj`, API/services, worker apps).
- Focus is session continuity, task discipline, and architecture traceability.

## Quick Start (5 minutes)

For a **visual walkthrough**, see **[QUICKSTART.md](QUICKSTART.md)**.

The essential workflow is:

1. **Start session:** `brain_handoff implementation`
2. **Start feature:** `brain_begin_feature "my-feature" implementation`
3. **Gate before code:** `brain_require_task "my-feature"`
4. **Log big decisions:** `brain_log_decision "Question?" "Decision" "Rationale"`
5. **End session:** `brain_update_session --done "X" --next "Y" --watchouts "Z"`

---

## One-Time Setup Per Engineer

1. Run initializer: `interceptor-brain-init` (or `npm run init:project`).
2. Configure MCP server using `docs/mcp-client-config.md` for Cursor, Claude Desktop, Windsurf, or Copilot if you need manual overrides.
3. Ensure `INTERCEPTOR_BRAIN_STORE` points to this repo's local store file.
4. (Optional) Set your strict task gate default:
   ```bash
   brain_set_engineer_preferences strictTaskGate true
   ```

---

## Session Start Checklist

1. **Read handoff from last session:**
   ```bash
   brain_handoff implementation
   ```
   Outputs: what was done, what's next, watchouts, and phase rules.

2. **Start your feature (if new):**
   ```bash
   brain_begin_feature "my-feature-name" implementation
   ```
   Creates a task, marks it in_progress, loads phase rules.

---

## Implementation Gate Policy

**Before you write code, gate it:**

```bash
brain_require_task "my-feature-name"
```

**If strict mode is on** (default if you set it), the task **must be `in_progress`**.

**If gate fails:**

```bash
# Create and start a new task on the spot
brain_create_task "my-task" "Description" implementation
brain_start_task "my-task"
brain_require_task "my-task"  # Now should pass
```

---

## Architecture Decision Logging

When you make an **architectural choice**, log it immediately so the next engineer knows the "why":

**Examples:**

- Auth strategy (JWT vs sessions vs OAuth)
- Data consistency approach (transactions, outbox pattern, event sourcing)
- Caching strategy (Redis, in-memory, none)
- Error retry strategy (exponential backoff, circuit breaker)

**Log it:**

```bash
brain_log_decision \
  "Transactional integrity for orders?" \
  "Outbox pattern (write event to events table, async processor)" \
  "Ensures consistency; trades off complexity for reliability" \
  --task "my-feature-name"
```

**Later, the team can search:**

```bash
brain_find_decisions "transaction"
```

And see all past decisions on consistency, with rationale.

---

## Session End Checklist

**Before you stop work, update the session so the next person can continue:**

```bash
brain_update_session \
  --phase implementation \
  --done "Implemented order service; added validation" \
  --next "Write payment processing logic; add tests" \
  --watchouts "Payment gateway creds in .env; test with sandbox first"
```

**Next engineer resumes with:**

```bash
brain_handoff implementation
```

---

## Phase Mapping for .NET Projects

- **`discovery`:** Design spikes, options, constraints. (Rules: exploratory, draft design docs.)
- **`implementation`:** Coding and integration. (Rules: unit tests, API contracts, CHANGELOG.)
- **`review`:** Test hardening, quality checks. (Rules: integration tests, security audit, perf baseline.)
- **`release`:** Readiness, rollout. (Rules: upgrade runbooks, monitoring setup, comms plan.)

**Most of the time, you're in `implementation`.**

---

## Strict Task Gate

By default, `brain_require_task` just checks that a task **exists**. If you want **stricter** discipline (task must be **in_progress** before coding), set it once:

```bash
brain_set_engineer_preferences strictTaskGate true
```

Then every call to `brain_require_task` will fail unless the task is in_progress. (You can override per-call with `--strictMode false` if needed.)

---

## Team Best Practices

1. **One task per feature.** Don't work on multiple unrelated tasks simultaneously; context-switch via session update + handoff.
2. **Log decisions as you make them.** Don't rely on memory or chat history.
3. **Update session before you leave.** Even if it's mid-sprint, log what you've done and what's next.
4. **Use watchouts liberally.** "Don't forget to X," "Creds in Y," "Check Z before deploy."

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Task doesn't exist | `brain_create_task "name" "desc" implementation` |
| Task exists but not in_progress | `brain_start_task "task-id"` |
| Strict mode blocked me | `brain_require_task "task" --strictMode false` (one-time override) |
| Need to search past decisions | `brain_find_decisions "keyword"` (e.g., "transaction", "caching") |
| Want to see your preferences | `brain_get_engineer_preferences` |

---

## Example: Full Workday

**Morning (start session):**

```bash
brain_handoff implementation
# Output: last done, next, watchouts, phase rules
brain_begin_feature "add-order-retry" implementation
# Output: Task started, phase rules loaded
```

**Throughout the day:**

```bash
# Before editing code
brain_require_task "add-order-retry"

# When you decide on retry strategy
brain_log_decision \
  "Retry strategy for failed orders?" \
  "Exponential backoff + circuit breaker" \
  "Prevents cascade failures; aligns with payment gateway limits"

# (Repeat brain_require_task as you move to new files)
```

**End of day (end session):**

```bash
brain_update_session \
  --phase implementation \
  --done "Order retry service; exponential backoff logic; 85% unit test coverage" \
  --next "Integration tests with payment gateway; add monitoring alerts" \
  --watchouts "Circuit breaker timeout is 5s (config-driven); test with sandbox gateway"
```

---

## Full Reference

For all tools, parameters, and advanced patterns, see **[TOOLS.md](TOOLS.md)**.
