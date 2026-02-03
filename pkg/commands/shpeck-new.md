---
description: Create a new Shpeck context
---

# shpeck-new

Create a new context for ticket-driven or draft work.

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If not, fail with: "Shpeck not initialized. Run `shpeck init` first."
2. Read `.spec/.global/conventions.md`, `.spec/.global/architecture.md`, `.spec/.global/tooling.md`, `.spec/.global/gotchas.md` if they exist.

## Flow

### 1. Determine Context Type

**If the user provided arguments** (e.g., `/shpeck-new Fix the login timeout bug`), treat this as initial intent. Store it for later use.

Ask the user:
> Is this for a ticket or a draft?

Options:
- **Ticket** — linked to an external ticket (Jira, Linear, GitHub Issue, etc.)
- **Draft** — standalone work, no external ticket

### 2a. Ticket Context

#### 2a.1. Get Ticket Key
Ask the user: "Please provide the ticket identifier (e.g., `PROJ-1234`, `#456`):"

#### 2a.2. Derive Context Name
Normalize the ticket key to lowercase, replacing non-alphanumeric characters with hyphens:
- `PROJ-1234` → `proj-1234`
- `#456` → `456`
- `BUG-789-fix-auth` → `bug-789-fix-auth`

#### 2a.3. Check for Conflicts
If `.spec/{context_name}/` already exists, fail with: "Context `{context_name}` already exists. Use `shpeck switch {context_name}` to resume work on it."

#### 2a.4. Fetch Ticket Content (try in order)
1. **MCP tools**: If you have access to Jira, Linear, GitHub, or similar MCP tools, use them to fetch the ticket by key.
2. **WebFetch**: If MCP tools unavailable, ask the user: "Please provide the ticket URL:" and fetch with `webfetch`.
3. **Paste fallback**: If both above fail or aren't available, ask the user: "Please paste the ticket content:"

#### 2a.5. Create Context Directory
Create `.spec/{context_name}/`.

#### 2a.6. Write `context.toml`
```toml
type = "ticket"
ticket_key = "{TICKET_KEY}"
```

#### 2a.7. Write `ticket.md`
```markdown
# External Ticket

<!-- This section is managed by shpeck-sync. Manual edits will be overwritten. -->

{PASTED_OR_FETCHED_TICKET_CONTENT}

---

# Local Notes

<!-- Your notes, clarifications, and context go here. This section is preserved by shpeck-sync. -->

```

#### 2a.8. Write Stub `spec.md`
```markdown
Version: 0
```

### 2b. Draft Context

#### 2b.1. Get Context Name
Ask the user: "Please provide a context name (lowercase, alphanumeric with hyphens only, e.g., `spike-new-cache`, `refactor-auth`):"

#### 2b.2. Capture Initial Intent
If the user provided arguments when invoking the command, use those. Otherwise, ask: "Please provide a one-liner describing what you're working on:"

Store this intent for the spec stub.

#### 2b.3. Check for Conflicts
If `.spec/{context_name}/` already exists, fail with: "Context `{context_name}` already exists. Use `shpeck switch {context_name}` to resume work on it."

#### 2b.4. Create Context Directory
Create `.spec/{context_name}/`.

#### 2b.5. Write `context.toml`
```toml
type = "draft"
```

#### 2b.6. Write Stub `spec.md`
```markdown
Version: 0

<!-- Initial intent: {USER_PROVIDED_DESCRIPTION} -->
```

### 3. Activate Context

Update `.shpeck.toml`:
```toml
active_context = "{context_name}"
```

### 4. Offer Git Branch

Ask the user:
> Would you like to create a git branch for this work?

If yes:
1. Suggest branch name based on context type:
   - Ticket: `feature/{context_name}`
   - Draft: `draft/{context_name}`
2. Let the user accept or provide their own name.
3. Create and switch to the branch: `git checkout -b {branch_name}`.

If no, skip.

## Completion

Report:
- Context type created (ticket or draft)
- Context name and path
- Whether a branch was created
- Next suggested command:
  - For tickets: "Run `shpeck-refine` to explore the codebase"
  - For drafts: "Run `shpeck-spec` to define what you're building"

## Example Output

```
Created ticket context 'proj-1234' at .spec/proj-1234/
✓ Created ticket.md from external ticket
✓ Created stub spec.md (Version: 0)
✓ Updated .shpeck.toml active_context = "proj-1234"
✓ Created branch 'feature/proj-1234' and switched to it

Next: Run `shpeck-refine` to explore the codebase
```

## Notes

- Version 0 indicates an empty/unpopulated spec. `shpeck-spec` will increment to Version 1 when generating the first spec content.
- Context directories are created under `.spec/`. All files within are local-only and never committed.
- Ticket content fetched via MCP or WebFetch should preserve formatting as much as possible.
- For drafts, the initial intent comment in spec.md helps `shpeck-spec` generate appropriate content.
