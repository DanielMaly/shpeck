---
description: Execute the most recent plan for the active context
---

# shpeck-code

Execute the implementation tasks defined in the most recent plan section of `.dev/plan.md`.

## Goal

Turn the plan into code with:
- **Safety**: Verify constraints before touching code.
- **Precision**: Execute *only* what is in the plan (no scope creep).
- **Verification**: Ensure changes compile and pass tests.
- **Traceability**: Log execution results.

## Preflight

Before starting:
1. **Standard Checks**:
   - Verify `.shpeck.toml` exists.
   - Verify `active_context` is set and resolves to a directory.
2. **Branch Safety**:
   - Read `trunk_branch` from `.shpeck.toml` (default to `main` if missing).
   - Get current git branch.
   - **FAIL** if current branch == trunk branch. "Safety Violation: Cannot run shpeck-code on trunk. Switch to a feature branch."
3. **Tree State**:
   - Check for uncommitted changes to tracked files (`git status --porcelain`).
   - **FAIL** if dirty. "Working tree dirty. Commit or stash changes before running shpeck-code." (Untracked files are ignored).
4. **Plan Freshness**:
   - Read `.spec/{active_context}/spec.md` -> extract `Version: N`.
   - Read `.spec/{active_context}/.dev/plan.md` -> find the *last* plan section.
   - Extract the spec version referenced in that plan section header (e.g., "Plan v... (Spec vN)").
   - **FAIL** if plan version != spec version. "Plan is stale (Spec vN vs Plan Spec vM). Run `shpeck-plan` first."

## Flow

### Confirm Scope
- Display the tasks from the most recent plan section.
- **Prompt**: "Proceed with implementation?"

### Execution Loop
For each task in the plan:
1. **Context**: Read relevant files defined in the task.
2. **Implement**: Apply changes using `edit` or `write`.
   - **Strict Adherence**: Follow the "Scope Discipline" rules below.
   - **Refactoring**: Use LSP tools (`lsp_rename`) for renames. Never use text replace for symbols.
3. **Verify Step**:
   - Run `lsp_diagnostics` on changed files. Fix errors immediately.

### Verification (Post-Implementation)
Once all tasks are complete:
1. **LSP Check**: Run `lsp_diagnostics` on all modified files one last time.
2. **Build/Test**:
   - Check `.spec/.global/tooling.md` for build/test commands.
   - If not found, check project config (`package.json`, `Cargo.toml`, etc.) to infer them.
   - Run the build/test commands.
   - **Note**: Pre-existing test failures are acceptable if unrelated, but *new* failures must be fixed.

### Logging
Append a run summary to `.spec/{active_context}/.dev/run.md`:
```markdown
# Run [YYYY-MM-DD HH:MM]
- Spec Version: N
- Plan Executed: [Summary of tasks]
- Outcome: [Success/Failure]
- Verification: [Test results/LSP status]
- Changes: [List of files modified]
```

## Scope Discipline (BLOCKING)

During implementation, you MUST NOT:

| Anti-Pattern | Example | Instead |
|--------------|---------|---------|
| Scope inflation | "While I'm here, I'll also fix..." | Stop. Only do what's in the plan. |
| Premature abstraction | "I'll extract this to a utility..." | Inline it. Abstract later if needed. |
| Over-validation | Adding 10 null checks "just in case" | Match existing code's validation level. |
| Gold-plating | "This would be better with caching" | Implement what's specced. Note improvement for future. |
| Drive-by refactoring | "This variable name is confusing" | Leave it. It's not in scope. |

**The Bugfix Rule**: When fixing a bug, fix ONLY the bug. Do not:
- Refactor surrounding code
- Add "missing" tests for other functionality
- Improve error messages elsewhere
- Clean up nearby code style

If you find yourself wanting to do any of these: note it in `.dev/run.md` as a follow-up suggestion, but **DO NOT DO IT NOW**.

## Implementation Boundaries

Before each code change, verify:
- [ ] This change is in the plan
- [ ] This change doesn't touch "Out of Scope" items
- [ ] I'm not improving adjacent code "while I'm here"

If you want to make a change not in the plan:
1. STOP
2. Note it in `.dev/run.md` as a suggested follow-up
3. Ask user if they want to expand scope
4. Only proceed if explicitly approved

## Refactoring Safety

When renaming symbols or refactoring:

1. **Prepare**: Use `lsp_prepare_rename` to validate the rename is safe
2. **Execute**: Use `lsp_rename` for cross-file symbol renames - NEVER use find-and-replace
3. **Verify**: Run `lsp_diagnostics` on ALL changed files before marking complete

## Global Learnings

During implementation, you may discover:
- **Gotchas** (unexpected behaviors, edge cases) -> `.spec/.global/gotchas.md`
- **Tooling** (build commands, test commands) -> `.spec/.global/tooling.md`

Record these for future work.

## Completion
Report:
- Success/Failure of the run.
- Summary of verification results (LSP, Tests).
- Location of the log: `.dev/run.md`.
- Next suggested command: "Run `shpeck-verify` to double-check against the spec, or `shpeck-explain` to prepare the PR."
