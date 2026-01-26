# Shpeck

**Spec-Driven Development for Real Codebases**

Shpeck is a workflow framework that helps developers work through complex changes in messy, brownfield codebases by maintaining a clear separation between *what you're building* (intent) and *how you're building it* (implementation).

## What Problem Does This Solve?

Developing in complex, legacy ("brownfield") codebases with AI agents often leads to **intent drift**. You start with a clear ticket, but as the agent explores, it can get lost in technical debt, hallucinate patterns, or lose track of original requirements during long sessions.

Shpeck provides a **structured middle layer** for your development workflow:

- **The Context Gap**: Tickets are often too vague for an agent, while code is too dense. Shpeck's `spec.md` acts as a "middle-tier" source of truth that defines exactly how a feature should work *in your specific codebase*.
- **AI Amnesia**: Long agent sessions often result in the AI losing track of the original plan. Shpeck persists research findings, technical specs, and execution logs locally, ensuring the agent always has the correct "brain state" across restarts.
- **The Brownfield Surprise**: Real-world code is messy. Shpeck formalizes the "Discovery → Update Spec → Re-plan" cycle. When the agent finds a blocker, it doesn't just "patch and pray"—it updates the technical authority first.
- **Zero Repo Pollution**: Shpeck artifacts are strictly local. You get the benefits of Spec-Driven Development without cluttering your team's git history with temporary notes or implementation drafts.

## Core Philosophy

**Shpeck is a development aid, not a project artifact.** All Shpeck files are local-only and never committed to version control. Think of it as your personal lab notebook for navigating complex changes.

### Key Principles

1. **Intent vs Implementation**: External tickets define *what* to build. The technical spec defines *how*. These are kept separate but aligned.

2. **Discovery-Driven**: You don't need perfect understanding upfront. Research findings, plan revisions, and execution logs accumulate as you work through a task.

3. **Brownfield-Native**: Assumes existing patterns, technical debt, and surprising discoveries. The workflow expects iteration and refinement.

4. **Explicit Context Switching**: Work on multiple tasks without branch-naming gymnastics. Explicitly switch between contexts rather than inferring from branch names.

## How It Works

### The Three Layers

```
External Ticket (Intent Authority)
       ↓
   ticket.md (Local working copy)
       ↓
    spec.md (Implementation Authority)
       ↓
  Your Code (Reality)
```

### Context Workspaces

Each task (ticket or draft) gets its own **context** — a directory containing:

```
.spec/{context-name}/
  ├── context.toml          # Metadata (type, ticket reference)
  ├── ticket.md             # Local copy of the ticket (if applicable)
  ├── spec.md               # Technical specification (versioned)
  ├── reviewers.md          # Generated PR description
  └── .dev/                 # Your working notes (append-only)
      ├── research.md       # Findings and rationale
      ├── plan.md           # Step-by-step plans
      └── run.md            # Execution logs
```

**Key insight**: The `.dev/` directory grows as you work, tracking the evolution of your understanding during active development.

### Two Types of Contexts

- **Ticket contexts**: Tied to an external ticket (Jira, Linear, etc.). The ticket defines intent.
- **Draft contexts**: Standalone exploratory work. The spec defines both intent and implementation.

## Typical Workflow

### Starting New Work

1. Create a context (ticket or draft)
2. If ticket: sync the ticket content locally
3. Research the codebase to understand constraints
4. Generate/refine the technical spec based on findings
5. Create an implementation plan
6. Execute the plan (code changes)
7. Verify implementation matches spec
8. Generate PR description for reviewers

### Handling Surprises

Real codebases surprise you. When the implementation reveals new constraints:

1. Document findings in `research.md`
2. Update `spec.md` (increments version automatically)
3. Generate new plan against updated spec
4. Continue coding

If the surprise changes *intent*, update `ticket.md` first (and ideally the external ticket), then flow changes into the spec.

## What Shpeck Is Not

**Not for:**
- Multi-ticket dependency coordination (stacked PRs)
- Sharing context between developers (contexts are per-machine)
- Automatic code generation (it's a structured workflow, not autopilot)
- Projects that don't use git

**Not intended to:**
- Replace your ticket system
- Replace code review
- Automatically compress/archive long-lived working notes

## Prerequisites

- A git repository (Shpeck relies on diffs and branch management)
- An AI-powered coding agent (OpenCode, Claude Code, or similar)
- Comfort with local-only, machine-specific development artifacts

## Strengths

- **Brownfield-friendly**: Designed for messy, real-world codebases
- **Separation of concerns**: Intent, specification, and implementation are clearly delineated
- **Structured iteration**: Formalize the research → spec → plan → code cycle
- **Low ceremony**: Local-only means no commit/review overhead for Shpeck artifacts
- **Flexible**: Works with any branch naming convention, any ticket system

## Limitations

- Local contexts don't sync between machines or developers
- Append-only `.dev/` logs can grow large on long-lived branches (manual cleanup required)
- Requires discipline to keep ticket/spec/code alignment intact
- Single-context-at-a-time model (no automatic dependency management)

## Who Should Use This?

Shpeck is for developers who:
- Work on complex or unfamiliar codebases
- Need to bridge business requirements and technical implementation
- Want structured thinking without heavy process overhead
- Use AI-powered coding agents and want better workflows for them
- Prefer explicit workflow steps over ad-hoc prompting

---

**Current Version**: v1.11  
**Status**: Specification complete, implementation pending
