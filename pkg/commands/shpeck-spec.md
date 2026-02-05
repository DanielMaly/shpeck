---
description: Generate or update spec.md for the active context
---

# shpeck-spec

Generate or update `.spec/{active_context}/spec.md`, incrementing `Version:` only when the spec meaningfully changes.

This command produces the technical source-of-truth used by `shpeck-plan`, `shpeck-code`, and `shpeck-verify`.

## Goal

Create a spec that is:
- **Concrete**: defines behavior and constraints precisely enough to plan and verify.
- **Brownfield-aware**: respects existing architecture and established patterns.
- **Aligned**: does not change intent relative to the ticket (ticket contexts).
- **Bounded**: includes an explicit "Out of Scope (MUST NOT)" section.
- **Verifiable**: includes acceptance criteria expressed as tests and/or concrete observable code changes.

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If not, fail with: "Shpeck not initialized. Run `shpeck init` first."
2. Verify `active_context` is set in `.shpeck.toml`. If not, fail with: "No active context. Run `shpeck-new` or `shpeck switch` first."
3. Verify `.spec/{active_context}/` exists. If not, fail with: "Active context directory missing. Run `shpeck status --all` to inspect contexts."
4. Read `.spec/{active_context}/context.toml` and determine `type`:
   - If missing or invalid, fail with: "Context metadata missing/invalid: `.spec/{active_context}/context.toml`."
5. Read `.spec/.global/conventions.md`, `.spec/.global/architecture.md`, `.spec/.global/tooling.md`, `.spec/.global/gotchas.md` if they exist.

Context-specific checks:
- If `type = "ticket"`:
  - Verify `.spec/{active_context}/ticket.md` exists. If not, fail with: "Missing ticket.md. Run `shpeck-sync` to populate it (or recreate the context)."
- If `type = "draft"`:
  - `ticket.md` is not required.

## Flow

### 1. Interpret User Input (Change Requests)

If the user provided arguments (e.g., `/shpeck-spec Change error message text`), treat them as a **requested change** to the current spec.

Examples of valid change requests:
- "Change it so that class X is split into classes Y and Z with a parent class"
- "Add a test case for when service A returns 503"
- "Actually, I would like the error message to say something else"

If the user provided no arguments:
- If `spec.md` is empty or `Version: 0`, generate the first real spec content.
- Otherwise, treat this as a "refresh/normalize" run (ensure required sections exist; reconcile with research/ticket as needed) without inventing new requirements.

### 2. Load Inputs

1. Read `.spec/{active_context}/spec.md` if it exists.
   - Parse the first line as `Version: N`.
   - Treat `Version: 0` as an unpopulated stub (from `shpeck-new`).
2. Read `.spec/{active_context}/.dev/research.md` if it exists.
   - If it does not exist, create it (empty). This file is append-only.
3. If `type = "ticket"`: read `.spec/{active_context}/ticket.md` and extract:
   - the ticket key from `context.toml` (`ticket_key`)
   - any ticket URL if it is present in `ticket.md` content (do not guess)

### 3. Authority Rules (NON-NEGOTIABLE)

#### Ticket contexts: intent vs implementation authority

- The external ticket (mirrored in `ticket.md`) is the authority for **intent**.
- `spec.md` is the authority for **implementation details only**.
- `spec.md` MUST NOT change intent/acceptance relative to `ticket.md`.

If the requested change (from user arguments) appears to change intent/acceptance relative to `ticket.md`:
1. STOP.
2. Ask the user to confirm the intended change in meaning (this is an intent clarification, not a technical detail).
3. Append the user-confirmed clarification to `.spec/{active_context}/ticket.md` under `# Local Notes` (append-only; do not modify the "External Ticket" mirror).
4. Then update `spec.md` accordingly.

#### Draft contexts: spec is the authority

- For drafts, `spec.md` defines both intent and implementation.
- Still avoid guessing when intent is genuinely ambiguous.

### 4. Ambiguity Threshold (Ask Only When It Matters)

Ask only when:
- the ticket language supports multiple plausible interpretations that materially change behavior, OR
- there is a direct conflict between ticket claims and verified reality, OR
- a critical constraint (permissions/rollout/backward compatibility) is unclear and changes the spec substantially.

Do NOT ask as a checklist exercise about optional edge cases. Focus on resolving meaning and scope.

### 5. Write or Update `spec.md`

Write a spec that is explicit enough for planning and verification, but does not include step-by-step execution (that belongs in `plan.md`).

At minimum, the generated spec MUST include:
1. A valid version line: `Version: N` as the first line (N >= 1).
2. Ticket reference for ticket contexts:
   - `Ticket: {ticket_key}`
   - `Ticket URL: ...` only if present in `ticket.md` content; omit otherwise.
3. Acceptance criteria (see below).
4. An "Out of Scope (MUST NOT)" section (required; see below).

Recommended spec structure (remove sections that truly do not apply):

- `# Technical Spec`
- `## Context`
- `## Summary`
- `## Current Behavior`
- `## Desired Behavior`
- `## Requirements`
- `## Interfaces / Data / Contracts` (only if relevant)
- `## Constraints` (only if grounded in ticket, global learnings, or verified findings)
- `## Acceptance Criteria` (REQUIRED)
- `## Out of Scope (MUST NOT)` (REQUIRED)

#### Acceptance Criteria (REQUIRED)

Every `spec.md` MUST include acceptance criteria that can be verified via:
- test changes (unit/integration/service tests) and/or
- clear, observable code changes (diff-visible outcomes).

Examples of acceptable criteria:
- "A unit test covers the 503 case from service A and asserts retry/backoff behavior (or lack thereof)."
- "The error message text changes from 'X' to 'Y' in the user-visible surface."
- "There is now an API Client class that has 100% test coverage and conforms to the Swagger documentation."
- "Class X is replaced by Y/Z with a shared parent, and callers are updated accordingly."

Do not write a plan or task list here. Keep criteria as "what proves this is done".

## Out of Scope (MUST NOT)

Every `spec.md` MUST include an "Out of Scope" section listing explicit exclusions.

Use checkbox format:

```markdown
## Out of Scope (MUST NOT)

- [ ] Refactoring adjacent code not required for this change
- [ ] Adding tests unrelated to this change
- [ ] Introducing new abstractions/utilities without spec requirement
- [ ] Performance optimizations beyond what the ticket requires
- [ ] Documentation changes outside the touched surface area
```

Infer reasonable boundaries based on the ticket scope and common scope-creep patterns.
If you are genuinely uncertain whether a boundary item is in or out of scope, ask the user rather than guessing.

### 6. Version Bump Rules

- Increment `Version:` only if the spec meaningfully changes.
- If regenerating the spec produces no content changes (aside from the version line), do not write a new version.

Practical rule:
- Compare the new spec body (everything after the first line) to the existing spec body.
- If identical, leave `spec.md` untouched.
- If different, write the new spec and set `Version:` to:
  - `1` if the existing version is `0` or missing/invalid
  - otherwise `oldVersion + 1`

### 7. Global Learnings (Optional)

If you discover a verified, generalizable learning that applies beyond this context, append it to the appropriate global file:
- conventions -> `.spec/.global/conventions.md`
- architecture -> `.spec/.global/architecture.md`
- tooling -> `.spec/.global/tooling.md`
- gotchas -> `.spec/.global/gotchas.md`

Do not add task-specific notes to global learnings.

## Completion

Report:
- Whether the spec was updated or already up to date
- The resulting spec version
- Location: `.spec/{active_context}/spec.md`
- Next suggested command: "Run `shpeck-plan` to generate an implementation plan from the spec."

## Example Output

```
Spec updated.
- Updated .spec/xyz-1234/spec.md to Version: 2
- Added/updated Acceptance Criteria and Out of Scope boundaries

Next: Run `shpeck-plan` to generate an implementation plan from the spec.
```

## Notes

- Ticket contexts: if intent must change, update `ticket.md` first (and ideally the external ticket), then regenerate the spec.
- Draft contexts: the spec defines both intent and implementation; keep it explicit and testable.
- `shpeck-spec` only writes local Shpeck artifacts; it may run with a dirty tracked working tree.
