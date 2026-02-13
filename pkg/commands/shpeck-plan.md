---
description: Generate or update plan.md for the active context
---

# shpeck-plan

Read `.spec/{active_context}/spec.md` and append a new implementation plan section to `.spec/{active_context}/.dev/plan.md`.

The plan is a sequenced list of operations that `shpeck-code` can execute to fulfill the spec.

## Goal

Create a plan that is:
- **Sequenced**: provides a logical order of operations (e.g., "Add test before implementation").
- **Mapped**: every task must map directly to a requirement or acceptance criterion in `spec.md`.
- **Atomic**: tasks should be small enough to be understood and executed by `shpeck-code`.
- **Spec-bound**: the plan must not exceed the boundaries defined in `spec.md` (especially the "Out of Scope" section).

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If not, fail with: "Shpeck not initialized. Run `shpeck init` first."
2. Verify `active_context` is set in `.shpeck.toml`. If not, fail with: "No active context. Run `shpeck-new` or `shpeck switch` first."
3. Verify `.spec/{active_context}/` exists. If not, fail with: "Active context directory missing. Run `shpeck status --all` to inspect contexts."
4. Read `.spec/{active_context}/context.toml` and determine `type`.
   - If missing or invalid, fail with: "Context metadata missing/invalid: `.spec/{active_context}/context.toml`."
   - `type` may be `ticket` or `draft`. (`shpeck-plan` supports both.)
5. Read `.spec/{active_context}/spec.md`.
   - If missing, fail with: "Missing spec.md. Run `shpeck-spec` first."
   - Parse the first line as `Version: N`. If N is missing/invalid or equals `0`, fail with: "Spec has no content. Run `shpeck-spec` first."

## Pre-Planning Scope Check

Before generating the plan, verify:

1. **Boundaries exist?** Does `spec.md` have an "Out of Scope (MUST NOT)" section?
   - If missing: Add one with inferred boundaries before proceeding.
   - If the correct boundaries are genuinely unclear, ask a targeted question before editing `spec.md`.
   - If you add this section, treat it as a meaningful spec change and increment `Version:`.

2. **Minimal viable?** For each planned task, ask:
   - Is this required by the spec, or am I adding it because it "seems right"?
   - Would a senior engineer reviewing this ask "why did you touch this"?

3. **AI-slop check.** Flag yourself if you're about to:
   - Add tests for modules not mentioned in the spec
   - Create abstractions "for reusability"
   - Add error handling beyond what's specified
   - Refactor code that's adjacent to but not part of the change

If you catch yourself doing any of these: Remove them from the plan, or ask the user if they genuinely want the scope expanded.

## Flow

### Load Inputs

1. Read `.spec/{active_context}/spec.md` and note the current `Version: N`.
2. Read `.spec/{active_context}/.dev/research.md` if it exists.
   - If it does not exist, create it (empty). This file is append-only.
3. Read `.spec/{active_context}/.dev/plan.md` if it exists.
   - If it does not exist, create it (empty). This file is append-only.

If you added/modified the "Out of Scope (MUST NOT)" section in `spec.md` during the pre-planning scope check, re-read `spec.md` and update your noted `Version: N` before writing the plan section.

### Synthesize Plan

Draft a sequence of operations. A good Shpeck plan follows this general rhythm:
1. **Verification Prep**: Identify or create the test files/suites needed to prove success.
2. **Implementation Sequence**: The order of file modifications (e.g., interfaces first, then logic, then callers).
3. **Verification**: Explicit steps to run tests and lints.

#### Planning Constraints

- **Spec Fidelity**: Every task must be traceable to a requirement or acceptance criterion in `spec.md`.
- **Out of Scope Respect**: Ensure no task touches anything excluded by "Out of Scope (MUST NOT)".
- **No Research Tasks**: Do not put "explore" tasks in the plan. If planning reveals unknowns or assumptions, record them in `.dev/research.md` and:
  - if they are non-blocking: proceed with a plan that does not depend on them, OR
  - if they are blocking: stop and ask the user a targeted question.

### Write to `plan.md`

`.dev/plan.md` is **append-only**. Each run of `shpeck-plan` appends a new section.

The new section MUST follow this format:

```markdown
---
Timestamp: YYYY-MM-DDTHH:MM:SS±HH:MM
Spec Version: N
---

## Plan

### 1. [Component/Layer Name]
- [ ] Task 1 (maps to requirement X)
- [ ] Task 2 (maps to requirement Y)

### 2. Verification
- [ ] Run `npm test path/to/test.ts`
- [ ] Run `npm run lint`
```

## Post-Plan Validation

After generating the plan, self-review against these criteria:

1. **Every task maps to spec** - No task exists that isn't directly required by `spec.md`
2. **Out of Scope respected** - No task touches items in the "Out of Scope" section
3. **No phantom requirements** - No task exists because it "seems necessary" without spec backing
4. **Acceptance criteria concrete** - Every task has a clear "done" condition

If genuinely uncertain whether a task is in scope, ask for clarification before proceeding.

## Completion

Report:
- The spec version the plan was generated against.
- Location: `.spec/{active_context}/.dev/plan.md`
- Next suggested command: "Run `shpeck-code` to execute the implementation plan."

## Example Output

```
Plan generated and appended to .spec/xyz-1234/.dev/plan.md.
- Based on spec.md Version: 3
- 5 implementation tasks mapped to spec requirements
- 2 verification steps added

Next: Run `shpeck-code` to execute the implementation plan.
```

## Notes

- `shpeck-plan` only writes local Shpeck artifacts; it may run with a dirty tracked working tree.
- Avoid including long code blocks in the plan; use file paths and concise descriptions of the logic to be implemented.
