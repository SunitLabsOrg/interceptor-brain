# Interceptor Brain: Complete Tool Reference

For a **quick 5-minute overview**, see **[QUICKSTART.md](QUICKSTART.md)**.

This document is a **complete reference** for all tools, parameters, and advanced patterns.

---

## Table of Contents

1. [Core Tools (5)](#core-tools-5)
2. [Convenience / Setup Tools (3)](#convenience--setup-tools-3)
3. [Advanced Patterns](#advanced-patterns)
4. [Decision Trail](#decision-trail)
5. [Troubleshooting](#troubleshooting)

---

## Core Tools (5)

### 1. `brain_begin_feature`

**One-call workflow:** Handoff + create task + start task + load phase rules.

**Use when:** Starting a new feature or resuming a feature after a break.

**Parameters:**

```typescript
{
  featureName: string;           // e.g., "add-email-notifications"
  phase: "discovery" | "implementation" | "review" | "release";
  description?: string;          // Optional: task description
}
```

**Example:**

```bash
brain_begin_feature "user-auth-jwt" implementation
```

**Output:**

```
Handoff loaded (last session context if any).
Task created: auth-jwt-001 "user-auth-jwt"
Task started: in_progress
Phase rules for "implementation" loaded:
  - [REQUIRED] Run unit tests before committing
  - [REQUIRED] Security review for auth changes
  - [REQUIRED] Update CHANGELOG
```

**What it does internally:**

1. Calls `brain_handoff` (retrieves last session for this phase).
2. Creates a new task (if one doesn't exist with that name).
3. Marks the task `in_progress`.
4. Loads and displays phase rules.

---

### 2. `brain_require_task`

**Gate implementation:** Enforce that a task exists (and optionally is `in_progress`).

**Use when:** Before implementing code, to ensure you're not working in a vacuum.

**Parameters:**

```typescript
{
  taskId: string;                // e.g., "auth-jwt-001" or "user-auth-jwt"
  strictMode?: boolean;          // If true, task must be in_progress. Defaults to your engineer preference.
}
```

**Example:**

```bash
brain_require_task auth-jwt-001
```

**Output (pass):**

```
✓ Task auth-jwt-001 (user-auth-jwt) is in_progress.
OK to proceed.
```

**Output (fail, no task):**

```
✗ Task not found: auth-jwt-001
Create with: brain_create_task "user-auth-jwt" implementation
```

**Output (fail, task exists but not started):**

```
✗ Task auth-jwt-001 exists but is not in_progress (status: pending).
Run: brain_start_task auth-jwt-001
```

---

### 3. `brain_update_session`

**End-of-session handoff:** Record what was done, what's next, and watchouts for the next person.

**Use when:** End of a work session (day, sprint, before handoff).

**Parameters:**

```typescript
{
  phase: "discovery" | "implementation" | "review" | "release";
  doneItems: string[];           // e.g., ["Auth model", "JWT validation"]
  nextItems: string[];           // e.g., ["Write refresh-token tests"]
  watchouts: string[];           // e.g., ["Secrets are in .env"]
  taskId?: string;               // (Optional) associate with a task
}
```

**Example:**

```bash
brain_update_session \
  --phase implementation \
  --done "Implemented JWT auth; Added token validation middleware" \
  --next "Write refresh-token flow; Add token rotation" \
  --watchouts "JWT secret in .env; expiry is 1 hour (config-driven)"
```

**Output:**

```
Session updated.
id: sess-042
phase: implementation
done: Implemented JWT auth; Added token validation middleware
next: Write refresh-token flow; Add token rotation
watchouts: JWT secret in .env; expiry is 1 hour (config-driven)
```

**Next person resumes with:**

```bash
brain_handoff implementation
```

---

### 4. `brain_handoff`

**Resume point:** Read last session context + phase rules.

**Use when:** Returning to work, resuming after a break, or taking over from a teammate.

**Parameters:**

```typescript
{
  phase: "discovery" | "implementation" | "review" | "release";
}
```

**Example:**

```bash
brain_handoff implementation
```

**Output:**

```
phase: implementation
last session: sess-042
done last time: Implemented JWT auth; Added token validation middleware
next steps: Write refresh-token flow; Add token rotation
watchouts: JWT secret in .env; expiry is 1 hour (config-driven)
next task: jwt-refresh-001
phase rules:
  - [REQUIRED] Run unit tests before committing
  - [REQUIRED] Security review for auth changes
  - [REQUIRED] Update CHANGELOG
```

---

### 5. `brain_log_decision`

**Architecture audit trail:** Capture a design decision, rationale, and alternatives.

**Use when:** Making an important architecture choice (auth strategy, caching, error handling, etc.).

**Parameters:**

```typescript
{
  question: string;              // e.g., "JWT vs session-based auth?"
  decision: string;              // e.g., "JWT with refresh tokens"
  rationale: string;             // e.g., "Stateless, scales, no server session store needed"
  alternatives?: string[];       // e.g., ["Session-based auth", "OAuth2"]
  taskId?: string;               // (Optional) associate with a task
}
```

**Example:**

```bash
brain_log_decision \
  "JWT vs session-based auth?" \
  "JWT with refresh tokens" \
  "Stateless, scales, no server session store needed" \
  --alternatives "Session-based auth" "OAuth2" \
  --task auth-jwt-001
```

**Output:**

```
Decision logged.
id: dec-042
question: JWT vs session-based auth?
decision: JWT with refresh tokens
rationale: Stateless, scales, no server session store needed
task: auth-jwt-001
```

**Later, search for it:**

```bash
brain_find_decisions "JWT"
```

---

## Convenience / Setup Tools (3)

### 6. `brain_create_task`

**Manual task creation** (if you don't want to use `brain_begin_feature`).

**Parameters:**

```typescript
{
  taskId: string;                // e.g., "auth-jwt-001"
  title: string;                 // e.g., "Implement JWT auth"
  phase: "discovery" | "implementation" | "review" | "release";
  description?: string;          // Optional details
}
```

**Example:**

```bash
brain_create_task "email-sender-001" "Email service integration" implementation
```

---

### 7. `brain_start_task`

**Mark a task as `in_progress`** (if you created it manually with `brain_create_task`).

**Parameters:**

```typescript
{
  taskId: string;
}
```

**Example:**

```bash
brain_start_task "email-sender-001"
```

---

### 8. `brain_find_decisions`

**Search audit trail:** Find past decisions by keyword.

**Parameters:**

```typescript
{
  searchText: string;            // e.g., "caching", "auth"
}
```

**Example:**

```bash
brain_find_decisions "caching strategy"
```

**Output:**

```
- When should we cache? (decision: In-memory cache for reads)
  decision: In-memory cache for reads
  rationale: Simple, fast, fits current scale; revisit if peak load > 1000 RPS

- Cache invalidation? (decision: TTL + explicit invalidation on writes)
  decision: TTL + explicit invalidation on writes
  rationale: Prevents stale reads; trade-off: code complexity
```

---

## Convenience: Help & Preferences

### 9. `brain_help`

**Print recommended tool call order.**

**Parameters:** None.

**Output:**

```
Recommended call order:
1) brain_begin_feature (or brain_handoff if resuming)
2) brain_require_task (before implementing)
3) brain_log_decision (when a key choice is made)
4) brain_update_session (before ending session)

Common variants:
- Use brain_create_task + brain_start_task for manual task flow.
- Use brain_find_decisions to answer design-history questions.
```

### 10. `brain_set_engineer_preferences`

**Set your local defaults** (persisted by username).

**Parameters:**

```typescript
{
  strictTaskGate: boolean;       // If true, brain_require_task always enforces in_progress
}
```

**Example:**

```bash
brain_set_engineer_preferences strictTaskGate true
```

**Effect:** From now on, `brain_require_task` will fail unless the task is `in_progress`.

### 11. `brain_get_engineer_preferences`

**View your current preferences.**

**Parameters:** None.

**Output:**

```
strictTaskGate: true
```

---

## Advanced Patterns

### Scenario 1: Multi-Engineer Handoff (Async)

**Engineer A (end of day):**

```bash
brain_update_session \
  --phase implementation \
  --done "Designed email schema; wrote migrations" \
  --next "Build email service client; write tests" \
  --watchouts "Migration runs on startup; ensure backwards compat"
```

**Engineer B (next day, in a different timezone):**

```bash
brain_handoff implementation
# Reads: done, next, watchouts, phase rules
# Calls brain_begin_feature or brain_require_task to resume
```

---

### Scenario 2: Decision-Driven Architecture (Audit Trail)

**Session 1 (Discovery):**

```bash
brain_begin_feature "auth-system-design" discovery

brain_log_decision \
  "Stateless or stateful auth?" \
  "Stateless (JWT)" \
  "Scales, no server coupling"

brain_log_decision \
  "Session storage if needed?" \
  "Redis (optional, for rate-limiting)" \
  "Minimal, only for throttling"

brain_update_session \
  --phase discovery \
  --done "Auth strategy decided: JWT + optional Redis" \
  --next "Implement JWT middleware; write tests" \
  --watchouts "Redis is optional; prototype without it first"
```

**Later (Review phase):**

```bash
brain_find_decisions "auth"
# Retrieves all prior decisions on auth
# Engineer can answer: "Why did we choose JWT? What were the trade-offs?"
```

---

### Scenario 3: Team Onboarding

**New engineer joins; gets up to speed in 5 minutes:**

```bash
# 1. See what phase the team is in and what's next
brain_handoff implementation

# 2. Start their first task
brain_begin_feature "fix-bug-123" implementation

# 3. See past architecture decisions
brain_find_decisions "caching"
brain_find_decisions "error handling"

# 4. Code with task gate
brain_require_task "fix-bug-123"  # confirm task is active before touching code

# 5. End session
brain_update_session --phase implementation --done "..." --next "..." --watchouts "..."
```

---

## Decision Trail

All decisions are stored in `.interceptor-brain/store.json` under `decisions[]`.

**Example entry:**

```json
{
  "id": "dec-042",
  "question": "JWT vs session-based auth?",
  "decision": "JWT with refresh tokens",
  "rationale": "Stateless, scales, no server session store needed",
  "alternatives": ["Session-based auth", "OAuth2"],
  "taskId": "auth-jwt-001",
  "createdAtUtc": "2026-05-03T15:30:00Z"
}
```

**Why this matters:**

- **Traceability:** "When did we decide to use JWT? Why?"
- **Onboarding:** New engineer reads decisions, understands rationale.
- **Audit:** Track who proposed what and when.

---

## Troubleshooting

### Q: "I called `brain_require_task` and it failed. What do I do?"

**A:** Your task either doesn't exist or isn't `in_progress`.

**Fix:**

```bash
# Option 1: Create and start a task in one call
brain_begin_feature "my-feature" implementation

# Option 2: Create, then start manually
brain_create_task "my-task" "My feature" implementation
brain_start_task "my-task"
brain_require_task "my-task"  # Should now pass
```

---

### Q: "I want to see all tasks for this phase."

**A:** No dedicated tool, but all tasks are in `.interceptor-brain/store.json` under `tasks[]`.

**Workaround:** Check the file directly or use `brain_begin_feature` (which shows next task in handoff).

---

### Q: "Strict mode is on, but I need to disable it for one call."

**A:** Pass `strictMode: false` to override:

```bash
brain_require_task my-task --strictMode false
```

---

### Q: "How do I export all decisions / sessions for a report?"

**A:** They're in JSON. Query `.interceptor-brain/store.json` directly:

```bash
# Linux/Mac
jq '.decisions' .interceptor-brain/store.json

# PowerShell
Get-Content .interceptor-brain/store.json | ConvertFrom-Json | Select -ExpandProperty decisions
```

---

## See Also

- **[QUICKSTART.md](QUICKSTART.md)** — 5-minute workflow
- **[../README.md](../README.md)** — Project overview
- **[dotnet-team-sop.md](dotnet-team-sop.md)** — .NET team specific guidance
