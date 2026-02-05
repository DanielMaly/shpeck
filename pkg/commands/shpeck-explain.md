# Command: shpeck-explain

Generate a PR description (`reviewers.md`) by synthesizing the intent (Ticket), the agreement (Spec), and the reality (Code Diff).

## Metadata
- **Agent**: `shpeck-explain`
- **Scope**: Current Context
- **Permissions**: Read-Only (except `reviewers.md`), Exec (git diff)
- **Preconditions**:
  - Active Context selected
  - Clean working tree (tracked files)
  - Not on trunk branch

## 1. Global Agent Instructions

### 1.1 TODO Discipline (NON-NEGOTIABLE)

```markdown
## TODO Discipline (NON-NEGOTIABLE)

For any multi-step task:
1. Create todos IMMEDIATELY before starting work - break down into atomic steps
2. Mark exactly ONE todo as `in_progress` at a time
3. Mark `completed` IMMEDIATELY after finishing each step (never batch completions)
4. DO NOT respond to the user until ALL todos are marked completed

If you stop with incomplete todos, you have FAILED the task. The user sees your todo 
list as a progress indicator - incomplete todos signal incomplete work.

### Anti-Patterns (BLOCKING)
- Skipping todos on multi-step tasks - user has no visibility
- Batch-completing multiple todos at once - defeats real-time tracking
- Proceeding without marking `in_progress` - unclear what you're working on
- Finishing without completing all todos - task appears incomplete
```

### 1.2 Global Codebase Context

```markdown
## Global Codebase Context

Before starting work on ANY Shpeck command, check for global learnings:

1. READ `.spec/.global/conventions.md` if it exists - follow these patterns
2. READ `.spec/.global/architecture.md` if it exists - respect boundaries  
3. READ `.spec/.global/tooling.md` if it exists - use correct commands
4. READ `.spec/.global/gotchas.md` if it exists - avoid known pitfalls

These files contain accumulated wisdom from previous work across all contexts.
Violating documented conventions or repeating documented mistakes is a FAILURE.
```

### 1.3 Scope Discipline

```markdown
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

If you find yourself wanting to do any of these: note it in `.dev/run.md` as a follow-up suggestion, but DO NOT DO IT NOW.
```

## 2. Command Workflow

### 2.1 Preconditions & Context

1.  **Load Config**: Read `.shpeck.toml` to get `trunk_branch` (default: `main`) and `active_context`.
2.  **Verify Branch**: Ensure current branch is NOT the trunk branch. If it is, FAIL.
3.  **Verify Clean Tree**: Run `git status --porcelain -uno`. If output is not empty, FAIL (User must commit or stash tracked changes first).
4.  **Load Artifacts**: Read:
    -   `.spec/{context}/ticket.md` (if exists)
    -   `.spec/{context}/spec.md`
    -   `.spec/{context}/.dev/plan.md`
    -   `.spec/{context}/.dev/run.md` (for test results/verification logs)

### 2.2 Diff Analysis

Run `git diff {trunk_branch}...HEAD` to capture the actual changes.
-   If diff is massive (>1000 lines), prioritize `git diff --stat` and key implementation files.
-   Identify:
    -   Key files changed.
    -   Nature of changes (additions, deletions, refactors).
    -   Any "Out of Scope" areas touched (warning).

### 2.3 Synthesis

Draft the PR description (`reviewers.md`) with the following structure:

1.  **Title**: Concise summary (from Ticket or Spec).
2.  **Summary**: High-level explanation of the change.
3.  **Rationale**: Why was this done? (Source: `ticket.md`).
4.  **Changes**: Technical summary of implementation (Source: `spec.md` + Diff).
5.  **Verification**: How was it tested? (Source: `.dev/run.md` logs).
6.  **Out of Scope**: Explicitly list items from `spec.md`'s "Out of Scope" section to reassure reviewers.

### 2.4 Output

Overwrite `.spec/{context}/reviewers.md` with the generated content.
-   **Note**: Always overwrite. This file is ephemeral and generated.

### 2.5 Global Learnings Write

```markdown
## Global Learnings

During explanation generation, you may discover:
- **Conventions** (naming, patterns, style) -> `.spec/.global/conventions.md`
- **Architecture** (module boundaries, data flow) -> `.spec/.global/architecture.md`

Record these for future work if they are generalizable and verified.
```
