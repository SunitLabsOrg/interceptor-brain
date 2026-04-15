# .NET Team SOP (Project Brain)

This SOP defines how backend engineers should use Project Brain in daily development.

## Scope

- Applies to .NET backend projects (`.sln`, `.csproj`, API/services, worker apps).
- Focus is session continuity, task discipline, and architecture traceability.

## One-time setup per engineer

1. Run initializer: `interceptor-brain-init` (or `npm run init:project`).
2. Configure MCP server using `docs/mcp-client-config.md` if you need manual overrides.
3. Ensure `INTERCEPTOR_BRAIN_STORE` points to this repo's local store file.
4. Run `brain_get_engineer_preferences`.
5. Set your default with `brain_set_engineer_preferences`.

## Session start checklist

1. Run `brain_help` (optional reminder).
2. Run `brain_handoff` for current phase.
3. Start work using `brain_begin_feature` (recommended) or manual task flow.

## Implementation gate policy

- Before changing code, run `brain_require_task`.
- If strict mode is enabled, task must be `in_progress`.
- If gate fails:
  - create task (`brain_create_task`)
  - start task (`brain_start_task`)
  - re-run gate

## Decision logging policy

When an architectural choice is made, log it immediately:

- auth strategy (JWT vs sessions)
- data consistency approach (transaction/outbox)
- caching strategy
- error boundary and retry strategy

Tool: `brain_log_decision`

## Session end checklist

1. Run `brain_update_session` with:
   - `doneItems`
   - `nextItems`
   - `watchouts`
2. Verify next engineer can continue with a single `brain_handoff` call.

## Suggested phase mapping

- `discovery`: design spikes, options, constraints
- `implementation`: coding and integration
- `review`: test hardening, quality checks
- `release`: readiness, rollout notes
