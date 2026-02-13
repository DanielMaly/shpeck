---
description: Verify implementation against spec (and ticket when applicable)
---

# shpeck-verify

Run a self-review of the current working tree and branch against `spec.md` (and `ticket.md` for ticket contexts). `shpeck-verify` is read-only: it reports gaps and violations but does not change files or git state.

## Goal

Surface alignment and drift:
- **Intent Alignment (ticket contexts):** `ticket.md` vs `spec.md`
- **Plan Alignment:** Plan covers spec requirements & implementation follows plan
- **Spec Fidelity:** implementation vs `spec.md`
- **Scope Guard:** flag touches to "Out of Scope (MUST NOT)" items
- **Conventions:** capture verified patterns discovered during review

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If missing: fail with "Shpeck not initialized. Run `shpeck init` first."
2. Verify `active_context` is set and `.spec/{active_context}/` exists. If missing: fail with "No active context. Run `shpeck-new` or `shpeck switch`."
3. Read `.spec/{active_context}/context.toml` → determine `type` (`ticket` or `draft`). If missing/invalid: fail with "Context metadata missing/invalid: `.spec/{active_context}/context.toml`."
4. Read `.spec/{active_context}/spec.md`.
   - Parse first line `Version: N`. If missing/invalid/0: fail with "Spec has no content. Run `shpeck-spec` first."
5. For ticket contexts: ensure `.spec/{active_context}/ticket.md` exists. If missing: fail with "ticket.md missing for ticket context. Run `shpeck-sync` or add the ticket copy."

Notes:
- `shpeck-verify` may run with a dirty working tree (tracked or untracked changes are allowed).
- This command never generates `reviewers.md`.

## Flow

### Collect State
- Determine current git branch and trunk branch from `.shpeck.toml` (for context only; verification is allowed on any branch).
- Gather diffs to understand implementation surface area:
  - `git status --short` (changed files summary)
  - `git diff --stat` (optional) to size changes
- Read `spec.md` fully, focusing on requirements and the "Out of Scope (MUST NOT)" section.
- Read `.spec/{active_context}/.dev/plan.md` (last section).

### Intent Verification (ticket contexts only)
- Compare `ticket.md` against `spec.md` for intent/acceptance drift.
- Flag mismatches explicitly, e.g.: "Ticket expects X, spec defines Y". Do not rewrite files; report for correction (update ticket/spec as needed outside this command).

### Plan vs Spec Alignment
- Check the most recent plan section in `.dev/plan.md`.
- **Version Check**: Does the plan reference the current `spec.md` version?
- **Coverage Check**: Does the plan cover all requirements in `spec.md`?
- Flag if the plan is stale or missing requirements.

### Implementation Verification
- **Impl vs Plan**: Did we implement what was planned? Are there extra files changed that were not in the plan?
- **Impl vs Spec**: For each requirement in `spec.md`, identify corresponding code changes. Confirm they exist and match the described behavior/contracts.
- Flag deviations or missing coverage, e.g.: "Spec requires validation A; no implementation or tests found touching <path>."

### Out of Scope Verification (BLOCKING)

When verifying implementation against spec:

1. Read the "Out of Scope (MUST NOT)" section from `spec.md`
2. For each exclusion, verify no code changes touch that area
3. Flag any violations explicitly:
   ```
   SCOPE VIOLATION: spec.md excludes "Refactoring existing auth code" 
   but changes were made to src/auth/service.ts
   ```

Scope violations MUST be reported to the user for resolution before the PR can proceed.

### Report
Produce a concise report to the user with sections:
- **Verified**: items that match (ticket→spec, plan→spec, spec→impl)
- **Deviations**: mismatches or missing implementations
- **Scope Violations**: any touches to "Out of Scope" items (call these out clearly)
- **Follow-ups**: recommended next actions (e.g., run `shpeck-plan` to realign, update `ticket.md`/`spec.md`)

### Stop
DO NOT attempt to implement any suggestions or fix any discrepancies.

## Output Expectations

State the current spec version, context type, and where relevant, the branch used for diffs. Clearly list files implicated in deviations or scope violations. End with suggested next steps (e.g., "Update spec/ticket", "Regenerate plan", "Re-run shpeck-code").
