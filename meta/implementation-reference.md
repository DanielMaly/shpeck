# Shpeck: Implementation Reference

This document provides detailed content blocks that MUST be included in command files (`pkg/commands/*.md`) and agent instructions (`pkg/AGENTS.md`) when they are implemented.

This is implementation guidance, not normative specification. Normative workflow behavior is defined in `meta/process-spec.md`.

---

## 1. Global Agent Instructions (`pkg/AGENTS.md`)

The following sections MUST be included in `pkg/AGENTS.md`.

### 1.1 TODO Discipline

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

### 1.3 LSP Tool Usage

```markdown
## LSP Tool Usage

Prefer LSP tools over text manipulation:

| Task | Tool | Why |
|------|------|-----|
| Rename symbol | `lsp_rename` | Catches all references across files |
| Find usages | `lsp_find_references` | More reliable than grep for code symbols |
| Navigate to definition | `lsp_goto_definition` | Handles aliases and re-exports |
| Check for errors | `lsp_diagnostics` | Catches type errors before runtime |

Text-based find-and-replace for symbol renames is FORBIDDEN.
```

### 1.4 Scope Discipline

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

### 1.5 Updating Global Learnings

```markdown
## Updating Global Learnings

When you discover something that applies beyond this specific task:

1. **Convention discovered** -> Append to `.spec/.global/conventions.md`
2. **Architecture insight** -> Append to `.spec/.global/architecture.md`  
3. **Tooling command** -> Append to `.spec/.global/tooling.md`
4. **Gotcha/pitfall** -> Append to `.spec/.global/gotchas.md`

Format: `- [YYYY-MM-DD] <learning>`

Only add learnings that are:
- **Verified**: You confirmed it's true through code inspection or testing
- **Generalizable**: Applies beyond this specific ticket
- **Non-obvious**: Not already documented in project README or config files

Task-specific findings still go in `.dev/research.md` - global files are for codebase-wide insights only.
```

---

## 2. Command: `shpeck-refine`

### 2.1 Parallel Exploration

```markdown
## Parallel Exploration

For comprehensive research on complex tickets, spawn parallel exploration tasks:

### When to Use Parallel Exploration
- Ticket touches multiple modules or systems
- Unfamiliar libraries or frameworks mentioned
- Need to understand both current behavior AND target behavior

### Pattern

1. **Launch parallel tasks** for different aspects:
   ```
   Task(subagent_type="explore", prompt="Find all usages of [feature] in this codebase")
   Task(subagent_type="explore", prompt="Identify existing patterns for [type of change]")  
   Task(subagent_type="explore", prompt="Search for related tests")
   ```

2. **Continue initial exploration** while tasks run - don't block waiting

3. **Collect results** when needed for synthesis

4. **Synthesize findings** into `.dev/research.md` with clear attribution

### Subagent Types for Exploration

| Type | Use For |
|------|---------|
| `explore` | Fast contextual grep within this codebase |
| `general` | Deeper analysis requiring reasoning |

### Anti-Patterns
- Launching parallel tasks for trivial tickets (overkill)
- Waiting synchronously for each task (defeats parallelism)
- Forgetting to synthesize results into research.md
```

### 2.2 Delegation for Research

```markdown
## Delegation for Research

| Need | Approach |
|------|----------|
| External docs lookup | Task with prompt focused on library/API documentation |
| Fast codebase pattern search | Task with `subagent_type="explore"` |
| Deep architectural analysis | Do directly or delegate to `general` with reasoning focus |

For most research, direct exploration is sufficient. Delegate when you need 
specialized focus or parallel investigation.
```

### 2.3 Research Output Format

```markdown
## Research Output Format

Structure your findings in `.dev/research.md` using these sections:

| Section | Purpose |
|---------|---------|
| Summary | 1-2 paragraph overview |
| Relevant Code Locations | File paths with line numbers |
| Existing Patterns | How similar things are done here |
| Constraints Discovered | Technical limitations found |
| Open Questions | Ambiguities needing clarification |
| Recommendations | Suggested approach |

This structure helps subsequent commands (`shpeck-spec`, `shpeck-plan`) extract relevant context efficiently.
```

### 2.4 Global Learnings Write

```markdown
## Global Learnings

During research, you will discover codebase-wide insights. Record them:

- **Conventions** (naming, patterns, style) -> `.spec/.global/conventions.md`
- **Architecture** (module boundaries, data flow) -> `.spec/.global/architecture.md`
- **Tooling** (commands, CI/CD, environment) -> `.spec/.global/tooling.md`
- **Gotchas** (non-obvious behaviors, pitfalls) -> `.spec/.global/gotchas.md`

These persist across contexts and benefit future work.
```

---

## 3. Command: `shpeck-spec`

### 3.1 Out of Scope Section

```markdown
## Out of Scope Section (REQUIRED)

Every `spec.md` MUST include an "Out of Scope (MUST NOT)" section listing explicit exclusions.

Example:
```markdown
## Out of Scope (MUST NOT)

- [ ] Refactoring existing auth code (fix only what's broken)
- [ ] Adding tests for unrelated modules
- [ ] Creating new abstractions or utilities
- [ ] Performance optimization beyond the ticket scope
- [ ] Documentation changes outside affected files
```

These items are FORBIDDEN from implementation. `shpeck-verify` will check for violations.

Infer reasonable boundaries based on:
- The ticket's explicit scope
- Areas adjacent to but not part of the change
- Common scope-creep patterns (see global AGENTS.md Scope Discipline)

If genuinely uncertain whether specific items are in or out of scope, ask for clarification.
```

### 3.2 Global Learnings Write

```markdown
## Global Learnings

During spec generation, you may discover architectural insights. Record them in `.spec/.global/architecture.md`.
```

---

## 4. Command: `shpeck-plan`

### 4.1 Pre-Planning Scope Check

```markdown
## Pre-Planning Scope Check

Before generating the plan, verify:

1. **Boundaries exist?** Does `spec.md` have an "Out of Scope" section?
   - If missing: Add one with inferred boundaries before proceeding.

2. **Minimal viable?** For each planned task, ask:
   - Is this required by the spec, or am I adding it because it "seems right"?
   - Would a senior engineer reviewing this ask "why did you touch this?"

3. **AI-slop check.** Flag yourself if you're about to:
   - Add tests for modules not mentioned in the ticket
   - Create abstractions "for reusability"
   - Add error handling beyond what's specified
   - Refactor code that's adjacent to but not part of the change

If you catch yourself doing any of these: Remove them from the plan, or ask the user if they genuinely want the scope expanded.
```

### 4.2 Post-Plan Validation

```markdown
## Post-Plan Validation

After generating the plan, self-review against these criteria:

1. **Every task maps to spec** - No task exists that isn't directly required by `spec.md`
2. **Out of Scope respected** - No task touches items in the "Out of Scope" section
3. **No phantom requirements** - No task exists because it "seems necessary" without spec backing
4. **Acceptance criteria concrete** - Every task has a clear "done" condition

If genuinely uncertain whether a task is in scope, ask for clarification before proceeding.
```

---

## 5. Command: `shpeck-code`

### 5.1 Scope Discipline

Include the Scope Discipline anti-pattern table from Section 1.4 (global AGENTS.md). Additionally:

```markdown
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
```

### 5.2 Refactoring Safety / LSP Verification

```markdown
## Refactoring Safety

When renaming symbols or refactoring:

1. **Prepare**: Use `lsp_prepare_rename` to validate the rename is safe
2. **Execute**: Use `lsp_rename` for cross-file symbol renames - NEVER use find-and-replace
3. **Verify**: Run `lsp_diagnostics` on ALL changed files before marking complete

### Verification Checklist
- [ ] `lsp_diagnostics` returns no new errors on changed files
- [ ] If project has build command, it passes
- [ ] If project has test command, tests pass (or only pre-existing failures)

Completing `shpeck-code` without LSP verification on changed files is a FAILURE.
```

### 5.3 Delegation for Complex Implementations

```markdown
## Delegation for Complex Implementations

For large implementations, delegate subtasks appropriately:

### When to Delegate

| Situation | Action |
|-----------|--------|
| UI component work | Delegate with `subagent_type="general"`, note "frontend/UI task" in prompt |
| Single-file simple change | Do directly - delegation overhead not worth it |
| Complex multi-file logic | Delegate with clear boundaries per subtask |
| Stuck after 2 failed attempts | Delegate to fresh context OR consult for debugging help |

### Delegation Prompt Structure

When delegating, provide:
1. **TASK**: Specific, atomic goal
2. **CONTEXT**: Relevant file paths, existing patterns from `.spec/.global/`
3. **CONSTRAINTS**: What NOT to change, boundaries to respect
4. **VERIFICATION**: How to confirm success

### After Delegation

ALWAYS verify delegated work:
- Read the changed files
- Run `lsp_diagnostics`  
- Confirm it matches the spec requirement

Never trust "I'm done" - verify independently.
```

### 5.4 Global Learnings Write

```markdown
## Global Learnings

During implementation, you may discover:
- **Gotchas** (unexpected behaviors, edge cases) -> `.spec/.global/gotchas.md`
- **Tooling** (build commands, test commands) -> `.spec/.global/tooling.md`

Record these for future work.
```

---

## 6. Command: `shpeck-diagnose`

### 6.1 Global Learnings Write

```markdown
## Global Learnings

Bug investigation often reveals non-obvious behaviors. Record discovered gotchas in `.spec/.global/gotchas.md`.

Format: `- [YYYY-MM-DD] [BUG] <gotcha description>`

This helps future debugging efforts avoid the same pitfalls.
```

---

## 7. Command: `shpeck-verify`

### 7.1 Out of Scope Violation Check

```markdown
## Out of Scope Verification

When verifying implementation against spec:

1. Read the "Out of Scope (MUST NOT)" section from `spec.md`
2. For each exclusion, verify no code changes touch that area
3. Flag any violations explicitly:
   ```
   SCOPE VIOLATION: spec.md excludes "Refactoring existing auth code" 
   but changes were made to src/auth/service.ts
   ```

Scope violations MUST be reported to the user for resolution before the PR can proceed.
```

### 7.2 Global Learnings Write

```markdown
## Global Learnings

Verification may reveal undocumented conventions. Record them in `.spec/.global/conventions.md`.

Format: `- [YYYY-MM-DD] [VERIFIED] <convention description>`
```

---

## 8. Global Learning File Templates

These templates are used by `shpeck init` to create `.spec/.global/` stub files.

### 8.1 conventions.md

```markdown
# Codebase Conventions

<!-- Coding patterns, naming conventions, style rules discovered during development -->
<!-- Format: - [YYYY-MM-DD] <convention> -->

## Naming

## File Organization  

## Patterns
```

### 8.2 architecture.md

```markdown
# Architecture

<!-- System structure, module boundaries, data flow patterns -->
<!-- Format: - [YYYY-MM-DD] <insight> -->

## Module Boundaries

## Data Flow

## Key Abstractions
```

### 8.3 tooling.md

```markdown
# Tooling

<!-- Build, test, deploy commands and environment requirements -->
<!-- Format: - [YYYY-MM-DD] <command/requirement> -->

## Commands

## CI/CD

## Environment
```

### 8.4 gotchas.md

```markdown
# Gotchas & Pitfalls

<!-- Non-obvious behaviors, past mistakes, debugging tips -->
<!-- Format: - [YYYY-MM-DD] <gotcha> -->

## Non-Obvious Behaviors

## Past Mistakes

## Debugging Tips
```
