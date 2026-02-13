---
description: Explore codebase and append research to the active context
---

# shpeck-refine

Explore the codebase to validate ticket requirements against technical reality. This command is for **research only**—it does not modify the spec or code.

## Goal

Turn `ticket.md` from a statement of intent into a set of **verified technical facts** and **explicit unknowns**, so `shpeck-spec` can be written without guessing.

Success looks like:
1. Primary change locations are identified (files/lines).
2. Current vs. Desired behavior is clearly contrasted.
3. Risks and constraints are enumerated.
4. Open questions are phrased for decision-making.
5. A recommended implementation direction is chosen (or explicitly blocked).

## Assumptions Policy (BLOCKING)

- **No Guessing:** Treat anything not backed by code citations, runtime output, or existing docs as unknown.
- **Ask, Don't Assume:** If evidence is missing or conflicting, ask the user.
- **Conflict Resolution:** If the ticket says X but code does Y, document the mismatch and ask the user which is authoritative.

## Preflight

Before starting:
1. Verify `.shpeck.toml` exists.
2. Verify `active_context` is set in `.shpeck.toml`.
3. Verify `.spec/{active_context}/` exists.
4. Verify `.spec/{active_context}/context.toml` contains `type = "ticket"`.
   - If `type = "draft"`, fail with: "shpeck-refine is for ticket contexts only. For drafts, use shpeck-spec directly."

## Flow

### 1. Context Loading & Intent Confirmation

1. Read `.spec/{active_context}/ticket.md` to understand requirements.
2. Read `.spec/{active_context}/.dev/research.md` (if it exists) to see previous findings.
3. If `.dev/research.md` does not exist, create it.
4. **Checkpoint:** Paraphrase the goal and acceptance criteria in 3-6 bullets.
   - Ask the user to confirm your understanding.
   - Ask: "Are there any specific constraints (rollout, backward compatibility, performance) I should look for?"

### 2. Exploration Strategy

Analyze the ticket complexity to decide on an approach. Use these **Key Questions** to drive exploration:
- **Location:** Where does the current behavior live? (Entry points, data flow, ownership).
- **Reality Check:** What is the *verified* current behavior vs. the ticket's claim?
- **Patterns:** What existing patterns (API style, error handling, UI) must we follow?
- **Precedents:** What tests or similar features already exist?
- **Constraints:** What non-obvious limits exist (permissions, migration risks)?

**Strategy Selection:**
- **Simple Ticket**: Changes limited to 1-2 files or a known pattern? Use direct tools (`grep`, `glob`, `read`, `lsp_find_references`).
- **Complex Ticket**: Changes touching multiple systems, unfamiliar libs, or ambiguous scope? Use **Parallel Exploration**.

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

## Delegation for Research

| Need | Approach |
|------|----------|
| External docs lookup | Task with prompt focused on library/API documentation |
| Fast codebase pattern search | Task with `subagent_type="explore"` |
| Deep architectural analysis | Do directly or delegate to `general` with reasoning focus |

For most research, direct exploration is sufficient. Delegate when you need 
specialized focus or parallel investigation.

### 3. Checkpoint: Initial Findings

After the first pass of exploration:
1. Present the top 3 candidate touch points (files/modules).
2. List the top known unknowns.
3. **Ask the user:** "Do these look like the right areas? Shall I proceed with deep analysis on these, or look elsewhere?"
4. If multiple implementation approaches are visible, present them (Option A vs B) and ask for preference.

### 4. Synthesis & Output

Synthesize all findings into a structured entry in `.dev/research.md`.

## Research Output Format

Structure your findings in `.dev/research.md` using these sections. Ensure **Evidence Labeling**: tag findings as `[Verified]` (with code ref), `[Observed]` (command output), or `[Input]` (user provided).

| Section | Purpose |
|---------|---------|
| Summary | 1-2 paragraph overview |
| Relevant Code Locations | File paths with line numbers (Required) |
| Existing Patterns | How similar things are done here |
| Constraints Discovered | Technical limitations found |
| Open Questions | Ambiguities needing clarification (Phrase for decision-making) |
| Recommendations | Suggested approach (Must include minimum touch points) |

This structure helps subsequent commands (`shpeck-spec`, `shpeck-plan`) extract relevant context efficiently.

**Note:** Append to `.dev/research.md`; do not overwrite existing entries unless they are obsolete.

## Possible Outcomes

Conclude the command by determining the state of the request:

1.  **Ready**: Ticket is feasible and fully understood.
    -   *Action*: Append findings + "Recommended Approach".
    -   *Next*: `shpeck-spec`.

2.  **Underspecified**: Key requirements are vague.
    -   *Action*: Append "Open Questions" + suggested `ticket.md` clarifications.
    -   *Next*: User updates ticket or answers questions.

3.  **Conflict**: Ticket says X, code does Y.
    -   *Action*: Document mismatch with citations.
    -   *Next*: Ask user: "Update intent (ticket) or force implementation change?"

4.  **Feasibility Blocker**: Major risk found (e.g., dependency missing, architecture incompatibility).
    -   *Action*: Document the blocker and Options A/B.
    -   *Next*: Wait for user decision.

5.  **Scope Too Large**: Work exceeds a single spec/plan cycle.
    -   *Action*: Recommend slicing boundaries.
    -   *Next*: User splits ticket or authorizes large scope.

## Completion

Report:
- Summary of key findings (files found, patterns identified).
- Location of research: `.spec/{active_context}/.dev/research.md`.
- Next suggested command: "Run `shpeck-spec` to generate the technical specification."

## Example Output

```
Research complete.
- Identified 3 relevant files in src/auth/
- Found existing pattern for timeout handling in src/utils/timer.ts
- Documented 1 potential gotcha regarding race conditions

Detailed findings appended to .spec/proj-1234/.dev/research.md

Next: Run `shpeck-spec` to generate the technical specification.
```
