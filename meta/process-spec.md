# Shpeck: Brownfield Spec-Driven Development Framework (v1.11)

## 1. Philosophy & Scope
Shpeck is a spec-driven development (SDD) workflow for brownfield, messy, complex codebases. It bridges high-level intent (tickets) and low-level code while allowing working understanding to evolve as technical realities are discovered.

Shpeck artifacts are a development aid, not a project artifact. They are intentionally local-only.

**Non-Goals:**
- Multi-ticket dependency coordination (stacked PRs, prerequisite tickets).
- Multi-developer context sharing (contexts are per-machine, intentionally).
- Automatic compaction of append-only context logs. Long-lived branches may accumulate large `.dev/` files; delete and re-initialize the context if this becomes problematic.

## 2. Core Constraints & Rules
1. **Git is required.** Shpeck assumes a git repo; verification/review relies on diffs.
2. **Local-only artifacts.** `.spec/`, `.shpeck.toml`, and tool config directories are never committed.
3. **Init must run once.** `npx shpeck init` must be run at least once in the repo root before other commands.
4. **Intent vs implementation authority (constrained).**
   - The external ticket is the authority for intent.
   - `ticket.md` is the local working copy of intent.
   - `spec.md` is the source of truth for implementation details only.
   - **Constraint:** `spec.md` must not change intent/acceptance relative to `ticket.md`. If intent needs to change, update `ticket.md` first (and the external ticket if available) before continuing.
   - **Draft contexts:** `spec.md` is the sole authority for both intent and implementation. The constraint above does not apply.
5. **Brownfield-native.** Existing patterns and debt are expected; research and refinement precede code.
6. **Trunk constraint.** Repos must have a trunk branch configured (default: `main`).
7. **Explicit context switching.** Shpeck does not infer context from branch names. Users must run `shpeck switch` when changing contexts.

## 3. Local File Structure
The presence of `.shpeck.toml` indicates Shpeck has been initialized locally for this repo.

### 3.1 Repo-Local Config
`.shpeck.toml` holds local repo state.

```toml
active_context = "ddmuk-1234"   # Current context directory name
trunk_branch = "main"           # Default; set during init
```

Notes:
- `active_context` identifies the current working context. Commands (other than `shpeck init`, `shpeck status`, `shpeck switch`, and `shpeck-new`) refuse to run if no context is active.
- `trunk_branch` identifies the trunk branch for diff comparisons. Defaults to `main` if not specified during init.

### 3.2 Tool Config Directory
Shpeck writes rules and command definitions into a tool-specific config directory. This directory is local-only (not committed).

| Tool     | Config Directory |
|----------|------------------|
| Opencode | `.opencode/`     |
| Claude Code | `.claude/`    |

### 3.3 Context Workspace

```
.shpeck.toml                    # Local config (not committed)
.<tool>/                        # Tool-specific config (not committed)
.spec/
  └── {context_name}/           # e.g., ddmuk-1234 or spike-new-cache
      ├── context.toml          # Context metadata (type, ticket_key if applicable)
      ├── ticket.md             # Local copy of ticket (ticket contexts only)
      ├── spec.md               # Technical spec (mutable)
      ├── reviewers.md          # PR description text (generated)
      └── .dev/                 # Ephemeral context (append-only)
          ├── research.md       # Findings & rationale
          ├── plan.md           # Plan sections (references spec version)
          └── run.md            # Execution log
```

### 3.4 Context Metadata
Each context directory contains `context.toml`:

```toml
type = "ticket"                 # "ticket" or "draft"
ticket_key = "DDMUK-1234"       # Present only for ticket contexts
```

**Cleanup:** Shpeck does not automatically remove stale contexts. Users delete stale `.spec/**` directories manually; `shpeck status --all` helps identify them.

## 4. Naming & Context Resolution

### 4.1 Terminology
- `ticket_key`: Ticket identifier as it appears in the ticket system (e.g., `DDMUK-1234`).
- `context_name`: Directory name for a context (e.g., `ddmuk-1234`, `spike-new-cache`).
- `active_context`: The currently selected context, stored in `.shpeck.toml`.

### 4.2 Context Types
- **Ticket context:** Associated with an external ticket. Has `ticket.md`. Context type is `ticket` in `context.toml`.
- **Draft context:** Standalone work without an external ticket. No `ticket.md`. Context type is `draft` in `context.toml`.

### 4.3 Context Resolution
Context is explicit, not inferred from branch names. The active context is stored in `.shpeck.toml.active_context` and points to a directory under `.spec/`.

Users must run `shpeck switch` to change contexts. This decouples branch naming conventions from Shpeck's operation — teams can use whatever branch naming scheme they prefer.

**Note:** After rebasing or pulling significant upstream changes, run `shpeck-verify` to check for drift between spec and code.

## 5. Artifact Definitions

### 5.1 Top-Level Files
- `context.toml`: Context metadata (type and ticket_key if applicable).
- `ticket.md`: Local ticket file (ticket contexts only). Contains a verbatim "External Ticket" mirror (overwritten by `shpeck-sync`) plus optional local notes.
- `spec.md`: Mutable technical specification.
  - The first line must be `Version: N` where N is a positive integer, starting at 1.
  - **Simplified versioning:** any change to `spec.md` increments the version.
  - The version is referenced by `plan.md` to track which spec version a plan was generated against.
- `reviewers.md`: Generated PR description content.
  - **Constraint:** `reviewers.md` is generated output and is overwritten on each shpeck-explain run; manual edits will be lost.
  - Generated only by `shpeck-explain`. Overwritten on each run.

### 5.2 `.dev/` Files (Append-Only)
Files in `.dev/` are append-only for Shpeck commands that write to them. Read-only commands (`shpeck-diagnose`, `shpeck-verify`) do not write to `.dev/`. Users may manually edit or truncate these files if recovery is needed.
- `research.md`: Findings and rationale.
- `plan.md`: Plan sections. Each plan section records the `spec.md` version it was generated against.
- `run.md`: Execution log (what ran, what changed, test results, acknowledgments).

### 5.3 Content Guidance (Keep It Separated)
To reduce duplication:
- `spec.md` (state): interfaces, schemas, contracts, business rules, constraints, expected behavior.
- `plan.md` (sequence): order of operations, touch points, checkpoints.
- `research.md` (rationale): exploration findings, tradeoffs, why decisions were made.

## 6. Recovery Workflow

### 6.1 Discarding Uncommitted Changes
If `shpeck-code` produces incorrect results and you want to discard uncommitted changes:
1. Discard changes with a scoped restore (example: `git restore <files>`).
2. Run `shpeck-diagnose` to identify any remaining misalignment between ticket/spec/code.
3. If spec needs adjustment, edit `spec.md` manually and increment the version.
4. Run `shpeck-plan` to generate a new plan, then `shpeck-code` to re-implement.

**Limitation:** This workflow applies to uncommitted changes only. For committed changes, revert manually (e.g., `git revert` or `git reset`) and then follow the same diagnosis/plan/code flow.

## 7. Workflow & Commands
Shpeck has two interfaces:
- Script subcommands: `shpeck init`, `shpeck status`, `shpeck switch`.
- CLI agent commands: everything else, named `shpeck-{action}`.

### 7.1 Local Bootstrap (Script)
`shpeck init --tool=<tool-name> [--trunk=<trunk-branch>] [--replace]`:
- Creates `.spec/` and `.shpeck.toml` if missing.
- If `.shpeck.toml` is created by this run: sets `trunk_branch` to the provided value or defaults to `main`.
- If `.shpeck.toml` already exists: sets `trunk_branch` only if `--trunk` is explicitly provided; otherwise does not modify `.shpeck.toml`.
- Writes tool rules/command definitions into `.<tool>/`.
- **Note:** `<tool-name>` is case-insensitive (e.g. `Opencode`, `claude`).
- **Interactive:** Prompts to merge/overwrite existing tool files unless `--replace` is used.
- Adds local-only ignore rules to `.git/info/exclude` for `.spec/`, `.shpeck.toml`, and `.<tool>/`.

`shpeck status`:
- Prints key state: active context, context type, spec version (if present), last plan timestamp, current branch, dirty tree status.
- Does not require an active context.

`shpeck status --all`:
- Lists all `.spec/` contexts, their types, and last modification time.

`shpeck switch <context_name>`:
- Sets `.shpeck.toml.active_context` to the specified context.
- Fails if `.spec/{context_name}/` does not exist.

`shpeck switch` (no argument):
- Interactively lists available contexts and prompts user to select one.

### 7.2 Mandatory Preflight (All Agent Commands)
Every `shpeck-{action}` command that requires an active context begins with preflight checks:
- `.shpeck.toml` exists.
- Active context is set and resolves to an existing `.spec/{context_name}/` directory.
- Context type matches command requirements (where applicable).

Preflight is deterministic in checks, but commands may still include explicit user gates (approvals/acknowledgments).

### 7.3 Safety Rule
To reduce constant negotiation in messy repos:
- Commands that modify git-tracked files (`shpeck-code`) require a clean working tree.
- Commands that produce PR text (`shpeck-explain`) require a clean working tree.
- Commands that only read or write local-only Shpeck artifacts (`shpeck-sync`, `shpeck-refine`, `shpeck-spec`, `shpeck-plan`, `shpeck-verify`, `shpeck-diagnose`) may run with a dirty tree.

**Note:** "Clean working tree" means no uncommitted changes to tracked files. Untracked files are ignored.

**Note:** Shpeck does not manage commits. Users commit at their discretion. Multiple `shpeck-code` runs are permitted, but each run must start from a clean tracked tree (commit/stash/restore between runs).

### 7.4 Context Requirements

| Command            | Requires active context? | Context type restriction |
|-------------------|--------------------------|--------------------------|
| `shpeck init`     | No                       | —                        |
| `shpeck status`   | No                       | —                        |
| `shpeck switch`   | No                       | —                        |
| `shpeck-new`      | No                       | —                        |
| `shpeck-promote`  | Yes                      | Draft only               |
| `shpeck-sync`     | Yes                      | Ticket only              |
| `shpeck-refine`   | Yes                      | Ticket only              |
| `shpeck-spec`     | Yes                      | Any                      |
| `shpeck-plan`     | Yes                      | Any                      |
| `shpeck-code`     | Yes                      | Any                      |
| `shpeck-diagnose` | Yes                      | Any                      |
| `shpeck-verify`   | Yes                      | Any                      |
| `shpeck-explain`  | Yes                      | Any                      |

### 7.5 `shpeck-new` (Context Creation)
`shpeck-new`:
- Prompts: "Is this for a ticket or a draft?"
- **If ticket:**
  - Prompts for `ticket_key`.
  - Derives `context_name` (lowercase normalized form of ticket_key).
  - Creates `.spec/{context_name}/` with `context.toml` (type=ticket, ticket_key).
  - Populates `ticket.md` via integration or paste flow.
  - Creates stub `spec.md`.
- **If draft:**
  - Prompts for `context_name` (must be safe for directory names).
  - Creates `.spec/{context_name}/` with `context.toml` (type=draft).
  - Creates stub `spec.md`.

In both cases:
- Sets `.shpeck.toml.active_context` to the new context.
- Optionally offers to create and switch to a new git branch (user provides branch name).

### 7.6 `shpeck-promote` (Draft to Ticket)
Draft-only: converts a draft context to a ticket context.
- Prompts for `ticket_key`.
- Updates `context.toml` to type=ticket and adds ticket_key.
- Creates `ticket.md` via integration or paste flow.
- Context directory keeps its original name; `ticket_key` in `context.toml` provides traceability.

### 7.7 `shpeck-sync`
Ticket-only: pull external ticket content and update the verbatim "External Ticket" mirror in `ticket.md`. Pure fetch/paste — no analysis or comparison. Logs outcome in `.dev/run.md`.

### 7.8 `shpeck-refine`
Ticket-only: explore the codebase and append findings to `.dev/research.md`. This is the only command that compares ticket content to the codebase. May surface ambiguities or suggest clarifications to `ticket.md` based on technical discoveries (e.g., "the ticket says X but the code already does Y"), but the primary output is research, not ticket updates.

### 7.9 `shpeck-spec`
Generate or update `spec.md`, incrementing `Version:`.
- **Ticket contexts:** generates from `ticket.md` and `.dev/research.md`.
- **Draft contexts:** interactive flow where the user describes intent conversationally; the command shapes it into spec format and may append codebase findings/rationale to `.dev/research.md`.

### 7.10 `shpeck-plan`
Read `spec.md` and append a new plan section to `.dev/plan.md`. The plan section records the current `spec.md` version.
If planning uncovers unknowns/assumptions, record them in `.dev/research.md` (rationale) rather than expanding `spec.md`.

### 7.11 `shpeck-code`
Execute the most recent plan.
- **Precondition:** The most recent plan section's recorded spec version must match the current `spec.md` version. If not, fails with a message to run `shpeck-plan` first.
- **Precondition:** Must not be on the configured trunk branch (`.shpeck.toml.trunk_branch`).
- Prompts for confirmation before proceeding.
- Runs relevant tests and logs results in `.dev/run.md`.

### 7.12 `shpeck-diagnose`
Read-only analysis of divergence between ticket, spec, and implementation.
- User describes a bug or unexpected behavior.
- Command traces the issue through layers (implementation -> spec -> ticket).
- Outputs a diagnosis indicating which layer(s) are misaligned.
- Provides a recommended action path using existing commands.
- **Does not make changes** — diagnosis only.

### 7.13 `shpeck-verify`
Self-review changes.
- Ticket contexts: compare `ticket.md` vs `spec.md` and flag mismatches.
- Compare implementation (working tree state) against `spec.md` and flag deviations.
- May identify issues that require further `shpeck-plan` -> `shpeck-code` cycles.
- Does not generate `reviewers.md`.

**Note:** For draft contexts, only compares implementation against `spec.md` (no ticket comparison).

**Contrast with `shpeck-diagnose`:** `verify` is a general health check. `diagnose` requires user input describing a specific problem to trace.

### 7.14 `shpeck-explain`
Generate `reviewers.md` from current state.
- Reads `spec.md`, `ticket.md` (if present), `.dev/` files, and the current git diff against trunk.
- Produces a PR-ready description in `reviewers.md`.
- Preconditions: must be on a non-trunk branch and have a clean tracked working tree (untracked files ignored). User is responsible for running it when the implementation is ready.
