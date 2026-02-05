---
description: Diagnose divergence between ticket, spec, and implementation
---

# shpeck-diagnose

Read-only command: trace a specific bug or unexpected behavior through the implementation, spec, and ticket layers to identify the source of misalignment.

## Goal

- Analyze a specific issue reported by the user.
- Trace the logic from **Implementation** (what code does) → **Spec** (what was planned) → **Ticket** (what was requested).
- Identify the "broken link" in the chain.
- Recommend a recovery path (e.g., "Update spec then plan", "Fix code to match spec").

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists. If missing: fail with "Shpeck not initialized."
2. Verify `active_context` is set and `.spec/{active_context}/` exists.
3. Read `.spec/{active_context}/context.toml` (valid types: `ticket` or `draft`).
4. Read global learnings: `.spec/.global/conventions.md`, `.spec/.global/architecture.md`, `.spec/.global/tooling.md`, `.spec/.global/gotchas.md`.
5. Read `.spec/{active_context}/spec.md`.

Notes:
- `shpeck-diagnose` runs with a dirty tree (it needs to see the current broken state).
- It does **not** modify code, spec, or plans. It only outputs analysis.

## Flow

### 1) Input Collection
- **Prompt:** "Describe the bug or unexpected behavior you are observing."
- **Prompt:** "Which files or components do you suspect are involved?" (optional).
- **Gather Context:**
  - Read `spec.md` (and `ticket.md` if ticket context).
  - Locate relevant code files based on user input or keyword search.

### 2) Trace Analysis (The "Why")

Trace the issue backwards through the layers. Stop at the first misalignment.

#### Layer 1: Code vs. Reality (Implementation)
- Does the code actually do what the user observes?
- Use `read` to inspect logic.
- *If Code matches User Observation (bug is confirmed in code):* Proceed to Layer 2.
- *If Code does NOT match User Observation:* The issue might be environment/data/misunderstanding. **Diagnosis:** "Code seems correct; investigate environment or usage."

#### Layer 2: Code vs. Spec
- Does `spec.md` describe the behavior found in the code?
- *If Spec says X but Code does Y:* **Diagnosis:** "Implementation Divergence." (The code is wrong).
- *If Spec says Y (and Code does Y):* The code matches the spec, but the behavior is still "wrong" according to the user. Proceed to Layer 3.

#### Layer 3: Spec vs. Ticket (Ticket Context Only)
- Does `ticket.md` request the behavior described in `spec.md`?
- *If Ticket says X but Spec says Y:* **Diagnosis:** "Spec Divergence." (The spec incorrectly translated the ticket).
- *If Ticket says Y (or implies it):* The spec matches the ticket.

#### Layer 4: Ticket vs. Intent (The "Root" Cause)
- If Code == Spec == Ticket, but the behavior is still "wrong", then the **Ticket** (or original intent) was flawed or ambiguous.
- **Diagnosis:** "Flawed Requirements" or "New Requirement Discovered."

### 3) Global Learnings (Gotchas)
- If the diagnosis reveals a non-obvious pitfall (e.g., "Library X silently swallows errors"), append it to `.spec/.global/gotchas.md`.
- Format: `- [YYYY-MM-DD] [DIAGNOSED] <gotcha description>`

### 4) Report & Recommendation

Output a concise diagnosis and the recommended fix.

| Diagnosis | Meaning | Recommendation |
| :--- | :--- | :--- |
| **Implementation Divergence** | Code != Spec | "Run `shpeck-code` to fix the implementation (or `shpeck-plan` if steps are missing)." |
| **Spec Divergence** | Spec != Ticket | "Edit `spec.md` to fix the error, then `shpeck-plan` -> `shpeck-code`." |
| **Flawed Requirements** | Ticket is wrong/vague | "Update `ticket.md` (or intent), then `shpeck-spec` -> `shpeck-plan` -> `shpeck-code`." |
| **Environment/Unknown** | Code looks right | "Investigate environment, data, or configuration. No code change recommended yet." |

## Completion

- Summarize the finding: "Root cause found in [Layer Name]."
- State the recommended command chain (e.g., "Recommended: `shpeck-spec` then `shpeck-plan`").
- Stop. Do not perform any further actions.
