---
description: Convert a draft context into a ticket context
---

# shpeck-promote

Draft-only command: convert the active draft context into a ticket context while preserving the context directory name. Supports linking to an existing ticket or creating a new one via integration.

## Goal

- Add a `ticket_key` to the context and switch the type to `ticket`.
- Populate `ticket.md` from the external ticket (fetch, paste, or creation result).
- Leave the existing `spec.md` and `.dev/` history intact.

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If missing: fail with "Shpeck not initialized. Run `shpeck init` first."
2. Verify `active_context` is set and `.spec/{active_context}/` exists. If missing: fail with "No active context. Run `shpeck-new` or `shpeck switch`."
3. Read `.spec/{active_context}/context.toml`.
   - If missing/invalid: fail with "Context metadata missing/invalid: `.spec/{active_context}/context.toml`."
   - **Require** `type = "draft"`. If already `ticket`: fail with "shpeck-promote is draft-only. Current context is already a ticket."
4. Read global learnings if present: `.spec/.global/conventions.md`, `.spec/.global/architecture.md`, `.spec/.global/tooling.md`, `.spec/.global/gotchas.md` (contextual awareness only; no writes).
5. Ensure `.spec/{active_context}/ticket.md` does **not** exist yet. If it exists, prompt to confirm overwrite; default is **fail** to avoid clobbering unexpected data.

Notes:
- `shpeck-promote` may run with a dirty working tree. It only writes local Shpeck artifacts.
- The context directory name remains unchanged; the `ticket_key` in `context.toml` provides traceability.

## Flow

### 1) Collect Inputs & Path Selection
- Display current `context_name`.
- **Prompt:** "Link to an existing ticket or create a new one?" (Options: `Existing`, `Create`).

### 2) Acquire Ticket Content

#### Path A: Create New Ticket
- **Pre-requisite:** Check if external ticket integration is available/configured.
  - If NOT available: warn user "No ticket integration found. Switching to Manual Create/Paste flow." -> Go to Path B (manual paste).
- **Drafting:**
  - Read `.spec/{active_context}/spec.md`.
  - Extract `Summary` and `Context` sections to draft a Title and Description.
  - If `spec.md` is empty/stub, use `context_name` as title and generic "Work from draft context {context_name}" as description.
- **User Review:**
  - Present the drafted Title and Description.
  - **Prompt:** "Edit ticket details before creation?" (Allow user to refine text).
- **Execution:**
  - Call integration to create the ticket.
  - Capture the returned `ticket_key` and final ticket body.

#### Path B: Existing Ticket
- **Prompt:** "Enter the Ticket Key:" (store as `ticket_key`; normalize lowercase copy for `context.toml`).
- **Fetch Content:**
  - **Integration available:** Attempt to fetch ticket details by key.
  - **No integration / Fetch failed:** Prompt user to **paste** the ticket content verbatim.

### 3) Update Context Metadata
- Rewrite `.spec/{active_context}/context.toml` with:
  - `type = "ticket"`
  - `ticket_key = "<key>"` (from creation result or user input)
- Preserve any other existing fields.

### 4) Create `ticket.md`
- Write `.spec/{active_context}/ticket.md` with two sections:
  - `# External Ticket` — verbatim content from creation result, fetch, or paste.
  - `# Local Notes` — empty section for user annotations; keep append-only in later commands.
- Do not modify `spec.md` during promotion.

### 5) Confirmation
- Report the promotion result:
  - Context name (unchanged)
  - Ticket Key: `{ticket_key}` (verify this is linked)
  - Location: `.spec/{active_context}/ticket.md`
  - Reminder: "Context is now in Ticket mode."

## Completion

State success and next steps:
- "Context promoted to ticket: {context_name} ({ticket_key})"
- Suggest: 
  - If ticket was just created: "Run `shpeck-spec` to ensure spec aligns with the new ticket (no sync needed)."
  - If linked to existing: "Run `shpeck-spec` to review alignment."
  - Then proceed to `shpeck-plan`.

## Notes

- Promotion is irreversible through this command. To revert, manually edit `context.toml` and remove `ticket.md` (not recommended).
- `spec.md` version is unchanged by promotion; future `shpeck-spec` runs should maintain versioning rules.
