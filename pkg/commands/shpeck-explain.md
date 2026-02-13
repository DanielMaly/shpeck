---
description: Generate PR description (reviewers.md) from current state
---

# shpeck-explain

Generate a PR description (`reviewers.md`) by synthesizing the intent (Ticket), the agreement (Spec), and the reality (Code Diff).

## Goal

Produce a PR-ready description in `reviewers.md` that:
- Explains **what** changed (from the diff)
- Explains **why** it changed (from ticket/spec)
- Demonstrates **verification** (from run logs)
- Clarifies **boundaries** (from "Out of Scope" section)

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If not, fail with: "Shpeck not initialized. Run `shpeck init` first."
2. Verify `active_context` is set in `.shpeck.toml`. If not, fail with: "No active context. Run `shpeck-new` or `shpeck switch` first."
3. Verify `.spec/{active_context}/` exists. If not, fail with: "Active context directory missing. Run `shpeck status --all` to inspect contexts."
4. Read `.spec/{active_context}/context.toml` and determine `type`.
   - If missing or invalid, fail with: "Context metadata missing/invalid: `.spec/{active_context}/context.toml`."
   - `type` may be `ticket` or `draft`. (`shpeck-explain` supports both.)
5. **Branch Safety**:
   - Read `trunk_branch` from `.shpeck.toml` (default to `main` if missing).
   - Get current git branch.
   - **FAIL** if current branch == trunk branch. "Safety Violation: Cannot run shpeck-explain on trunk. Switch to a feature branch."
6. **Tree State**:
   - Check for uncommitted changes to tracked files (`git status --porcelain -uno`).
   - **FAIL** if dirty. "Working tree dirty. Commit changes before running shpeck-explain." (Untracked files are ignored).

## Flow

### Load Artifacts

Read the following files:
1. `.spec/{active_context}/spec.md`
   - If missing, fail with: "Missing spec.md. Run `shpeck-spec` first."
   - Parse the first line as `Version: N`. If N is missing/invalid or equals `0`, fail with: "Spec has no content. Run `shpeck-spec` first."
2. `.spec/{active_context}/ticket.md` (if context type is `ticket`)
   - Extract ticket key from `context.toml` (`ticket_key`)
3. `.spec/{active_context}/.dev/plan.md` (if exists)
4. `.spec/{active_context}/.dev/run.md` (if exists, for test results/verification logs)

### Diff Analysis

Run `git diff {trunk_branch}...HEAD` to capture the actual changes.
- If diff is massive (>1000 lines), prioritize `git diff --stat` and key implementation files.
- Identify:
  - Key files changed
  - Nature of changes (additions, deletions, refactors)
  - Any "Out of Scope" areas touched (flag as warning)

### Synthesis

Draft the PR description (`reviewers.md`) with the following structure:

1. **Title**: Concise summary (from Ticket or Spec)
2. **Summary**: High-level explanation of the change
3. **Rationale**: Why was this done? (Source: `ticket.md` for ticket contexts, `spec.md` summary for drafts)
4. **Changes**: Technical summary of implementation (Source: `spec.md` + Diff)
5. **Verification**: How was it tested? (Source: `.dev/run.md` logs)
6. **Out of Scope**: Explicitly list items from `spec.md`'s "Out of Scope" section to reassure reviewers

### Output

Write `.spec/{active_context}/reviewers.md` with the generated content.
- **Note**: This file is ephemeral and generated. It is always overwritten on each run.

## Completion

Report:
- Location of generated file: `.spec/{active_context}/reviewers.md`
- Summary of what was included (ticket key if applicable, spec version, number of files changed)
- Next suggested action: "Copy content from reviewers.md into your PR description, or use it as a starting point for further refinement."

## Example Output

```
PR description generated.
- Written to .spec/xyz-1234/reviewers.md
- Based on spec.md Version: 3
- Analyzed diff: 8 files changed, 247 insertions(+), 42 deletions(-)
- Included verification results from .dev/run.md

Next: Copy content from reviewers.md into your PR description.
```

## Notes

- `shpeck-explain` requires a clean tracked working tree (precondition enforced).
- The generated `reviewers.md` is a starting point. Users may edit it before pasting into the actual PR.
- For draft contexts, the rationale comes from `spec.md` rather than `ticket.md`.
