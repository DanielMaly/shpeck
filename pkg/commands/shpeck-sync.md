---
description: Sync ticket content into the active context
---

# shpeck-sync

Ticket-only command: refresh the `# External Ticket` mirror inside `ticket.md` from the external system (or manual paste) without altering local notes or the spec. Always append a run log entry.

## Goal

- Fetch the latest external ticket body and overwrite only the `# External Ticket` section of `.spec/{context_name}/ticket.md`.
- Preserve the `# Local Notes` section verbatim (append-only in later workflows).
- Record the sync attempt and outcome in `.spec/{context_name}/.dev/run.md`.

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If missing: fail with "Shpeck not initialized. Run `shpeck init` first."
2. Verify `active_context` is set and `.spec/{active_context}/` exists. If missing: fail with "No active context. Run `shpeck-new` or `shpeck switch`."
3. Read `.spec/{active_context}/context.toml`.
   - If missing/invalid: fail with "Context metadata missing/invalid: `.spec/{active_context}/context.toml`."
   - Require `type = "ticket"`. If not: fail with "shpeck-sync is for ticket contexts only."
4. Ensure `.spec/{active_context}/ticket.md` exists. If missing: fail with "ticket.md missing. Run shpeck-promote or paste the ticket first."
5. Read global learnings if present: `.spec/.global/conventions.md`, `.spec/.global/architecture.md`, `.spec/.global/tooling.md`, `.spec/.global/gotchas.md` (awareness only; no writes).

Notes:
- `shpeck-sync` may run with a dirty working tree (local-only writes).
- This command never edits `spec.md`, `plan.md`, or code.

## Flow

### 1) Load Current Ticket
- Read `.spec/{active_context}/ticket.md`.
- Identify and preserve the existing `# Local Notes` section content (keep exact text). If missing, create an empty `# Local Notes` section when rewriting.

### 2) Acquire Latest External Ticket Content
- Check for configured ticket integration.
  - **If available:** fetch the ticket body by `ticket_key` from `context.toml`.
  - **If unavailable or fetch fails:** prompt the user to paste the full, verbatim external ticket content.
- Normalize line endings to LF; do not reflow text.

### 3) Rewrite `ticket.md`
- Write the file with exactly two sections in this order:
  1. `# External Ticket` — overwrite with fetched/pasted content (verbatim).
  2. `# Local Notes` — reuse the preserved notes (or empty if none existed).
- Do not insert analysis, summaries, or formatting changes beyond these sections.

### 4) Log in `.dev/run.md`
- Append an entry noting:
  - Timestamp
  - Command: `shpeck-sync`
  - Ticket key
  - Source: `integration` or `manual paste`
  - Outcome: `success` or error message
- Create `.spec/{active_context}/.dev/run.md` if absent (append-only).

### 5) Report
- Confirm completion with context name, ticket key, and source used.
- Remind the user that `spec.md` was not changed; run `shpeck-spec` if intent changed.

## Completion

State success and next steps:
- "ticket.md refreshed for {ticket_key} from {source}. Local notes preserved."
- Suggest:
  - If ticket intent materially changed: "Run `shpeck-spec` to realign the spec."
  - Otherwise: continue with `shpeck-plan` / `shpeck-verify` as needed.
