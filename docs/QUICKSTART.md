# Interceptor Brain — 5-Minute Quick Start

**Goal:** Minimum impactful workflow. One session, start to finish.

---

## The 5 Essential Tools

| Tool | When | What |
|------|------|------|
| **`brain_begin_feature`** | Start a feature | Handoff + create task + start task + load phase rules (one call) |
| **`brain_require_task`** | Before coding | Gate: enforce task exists (and optionally is `in_progress`) |
| **`brain_log_decision`** | When you make an arch choice | Capture decision + rationale for the audit trail |
| **`brain_handoff`** | Return to work / hand off | Read last session + phase rules for your phase |
| **`brain_update_session`** | End of session | Record done/next/watchouts for the next person |

---

## One Session: Start to Finish

### 1. Session Start (2 min)

**Scenario:** It's Monday morning. You're resuming from last week.

```bash
# Call this FIRST to see what was last done and what's next
brain_handoff implementation
```

**Output** (compact):
```
phase: implementation
last session: sess-001
done last time: Auth model; JWT validation logic
next steps: Write refresh-token tests; Fix token rotation edge case
watchouts: Refresh token expiry is 7 days (config-driven, check .env)
next task: jwt-refresh-001 Implement refresh-token flow
phase rules:
- [REQUIRED] Run tests before committing
- [REQUIRED] Update CHANGELOG for API changes
```

### 2. Start Your Work (1 min)

**Scenario:** You're starting a new feature from scratch.

```bash
# This creates the task, starts it, and loads phase rules all at once
brain_begin_feature "add-email-notifications" implementation
```

**Output**:
```
Handoff loaded (if there was a prior session on this phase).
Task created: notify-001 "add-email-notifications"
Task started: in_progress
Phase rules for "implementation" loaded.
```

### 3. Gate Before You Code (30 sec, per file)

**Scenario:** You're about to edit `src/notification/email-sender.ts`.

```bash
# Ensure you have a task before editing code
brain_require_task notify-001
```

**Output** (if passing):
```
✓ Task notify-001 (add-email-notifications) is in_progress.
OK to proceed.
```

**Output** (if failing):
```
✗ No active task. Run brain_begin_feature first.
```

**Or, if strict mode is enabled and task is not started:**
```
✗ Task notify-001 exists but is not in_progress (status: pending).
Run brain_start_task notify-001 to begin.
```

### 4. Log an Architecture Decision (1 min, as needed)

**Scenario:** You're choosing between SMTP and a transactional email service.

```bash
brain_log_decision \
  "SMTP vs managed email service?" \
  "Use managed service (SendGrid)" \
  "SMTP is stateless but requires infra; SendGrid scales without ops" \
  --task notify-001
```

**Output**:
```
Decision logged.
id: dec-042
question: SMTP vs managed email service?
task: notify-001
```

This becomes searchable: `brain_find_decisions "email"` later will surface it.

### 5. End Your Session (1 min)

**Scenario:** End of day. You've done a lot; next person should know where to pick up.

```bash
brain_update_session \
  --phase implementation \
  --done "Email service integration; SendGrid auth" \
  --next "Write unit tests for email formatting; Add retry logic" \
  --watchouts "SendGrid API key in .env; test with staging credentials first"
```

**Output**:
```
Session updated.
id: sess-002
done: Email service integration; SendGrid auth
next: Write unit tests for email formatting; Add retry logic
watchouts: SendGrid API key in .env; test with staging credentials first
```

---

## One-Liner Summary

**Your session is:**

```
brain_handoff [phase]
  ↓
brain_begin_feature [name] [phase]
  ↓
brain_require_task [task_id] (repeat as you move to new files)
  ↓
brain_log_decision [...] (when you make a big choice)
  ↓
brain_update_session [...done/next/watchouts...]
```

---

## When Things Go Wrong

### "I don't have a task for this code."

```bash
# Create and start a task on the spot
brain_create_task "my-feature" implementation
brain_start_task "my-feature"
brain_require_task "my-feature"  # Should now pass
```

### "I want to see what decisions were made before."

```bash
# Search decisions by keyword
brain_find_decisions "caching"  # Find all decisions about caching strategy
```

### "I have a team preference: always strict task gate."

```bash
# Set this once (persisted to your local username in store.json)
brain_set_engineer_preferences strictTaskGate true
```

Then `brain_require_task` will always enforce `in_progress` status.

### "I want to read the rules for my current phase."

```bash
# Phase rules are auto-loaded in brain_begin_feature and brain_handoff,
# but you can fetch them explicitly:
brain_rules_for_phase implementation
```

---

## Phases & When to Use Them

- **`discovery`**: Exploratory; spiking options, listing constraints. Rules are permissive.
- **`implementation`**: Building code. Rules enforce tests, commits, changelog updates.
- **`review`**: Hardening; edge cases, security, perf. Rules enforce detailed testing.
- **`release`**: Rollout readiness. Rules enforce validation, runbooks, comms.

---

## Next: Full Tool Reference

See **[`TOOLS.md`](TOOLS.md)** for:
- Complete parameter lists and schemas.
- Advanced patterns (bulk operations, searching, filtering).
- Less-common tools and optional features.
