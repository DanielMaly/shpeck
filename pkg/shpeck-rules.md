# Shpeck Rules (Local-Only)

This repo uses **Shpeck**: a local-only, spec-driven development (SDD) workflow for brownfield codebases.

Shpeck introduces a set of local artifacts (primarily under `.spec/`) that help an agent move from intent -> research -> spec -> plan -> code -> verification -> PR explanation, while keeping scope tight and respecting existing codebase conventions.

These artifacts are a development aid, not a project artifact. They are intentionally local-only and are not committed.

## What Shpeck Files Mean

- `.shpeck.toml`: local repo state (active context, trunk branch).
- `.spec/<context>/`: the active working context directory.
- `.spec/<context>/ticket.md` (ticket contexts only): local working copy of external ticket intent.
- `.spec/<context>/spec.md`: technical spec.
  - Ticket contexts: `spec.md` is the source of truth for implementation details, but MUST NOT change intent/acceptance relative to `ticket.md`.
  - Draft contexts: `spec.md` is the source of truth for both intent and implementation.
- `.spec/<context>/.dev/`: append-only logs for research (`research.md`), planning (`plan.md`), and execution (`run.md`).
- `.spec/.global/`: cross-context learnings.
  - READ these before starting work; they override generic assumptions.
  - Write to them only when you discover something verified, generalizable, and non-obvious.

## Shpeck Tenets (Process-Spec Backed)

- **Init is required:** if `.shpeck.toml` and `.spec/` are missing, the repo has not been initialized; the user must run `shpeck init` before agent commands that expect Shpeck state.
- **Local-only means local-only:** never ask to commit or include `.spec/`, `.shpeck.toml`, or tool config dirs (e.g. `.opencode/`, `.claude/`) in a PR.
- **Intent authority is constrained:** in ticket contexts, `ticket.md` defines intent; `spec.md` defines implementation details and MUST NOT change intent/acceptance relative to `ticket.md`.
- **Context is explicit:** read `.shpeck.toml` and use the configured active context; never infer context from branch names.
- **Out-of-scope is binding:** treat `spec.md` "Out of Scope (MUST NOT)" as a hard prohibition; do not implement or refactor excluded areas.
- **Spec/version gates matter:** if the workflow requires spec version alignment (e.g. executing the most recent plan against the current `spec.md`), stop when versions do not match and direct the user to the correct Shpeck command.
- **Git safety rule:** commands that modify tracked files or generate PR text require a clean tracked working tree (untracked files ignored).
- **Trunk discipline:** respect the configured trunk branch (`.shpeck.toml.trunk_branch`); do not do implementation work that is supposed to happen off-trunk while currently on trunk.

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

## Global Codebase Context

Before starting work on ANY Shpeck command, check for global learnings:

1. READ `.spec/.global/conventions.md` if it exists - follow these patterns
2. READ `.spec/.global/architecture.md` if it exists - respect boundaries
3. READ `.spec/.global/tooling.md` if it exists - use correct commands
4. READ `.spec/.global/gotchas.md` if it exists - avoid known pitfalls

These files contain accumulated wisdom from previous work across all contexts.
Violating documented conventions or repeating documented mistakes is a FAILURE.

## LSP Tool Usage

Prefer LSP tools over text manipulation:

| Task | Tool | Why |
|------|------|-----|
| Rename symbol | `lsp_rename` | Catches all references across files |
| Find usages | `lsp_find_references` | More reliable than grep for code symbols |
| Navigate to definition | `lsp_goto_definition` | Handles aliases and re-exports |
| Check for errors | `lsp_diagnostics` | Catches type errors before runtime |

Text-based find-and-replace for symbol renames is FORBIDDEN.

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
