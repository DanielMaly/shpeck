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
