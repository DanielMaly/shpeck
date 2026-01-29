# Future Improvements

Potential enhancements that would require relaxing Shpeck's prompt-only constraint. These are not planned for implementation but documented for consideration if the architecture evolves.

---

## Runtime Hooks

If Shpeck gains runtime code (e.g., an OpenCode/Claude Code plugin), hooks could enforce behaviors that prompts can only request.

### PostToolUse Hook: TODO Enforcement
Intercept after every tool call. If incomplete todos exist, inject a system reminder forcing the agent to continue before responding. Currently we rely on prompt instructions; a hook would make this non-bypassable.

### PreToolUse Hook: Scope Boundary Enforcement
Before file edits, check if the target path is in the "Out of Scope" section of `spec.md`. Block the edit with a clear error rather than relying on post-hoc verification.

### PostToolUse Hook: LSP Verification
After any file write, automatically run `lsp_diagnostics` and surface errors immediately. Currently agents must remember to verify; a hook would make it automatic.

---

## Multi-Agent Orchestration

### Dedicated Plan Reviewer Agent
A separate agent (or model) that reviews plans before execution, looking for:
- Tasks not backed by spec requirements
- Scope creep indicators (abstraction, gold-plating)
- Missing acceptance criteria

This creates adversarial review without human involvement. The planner and reviewer would iterate until the plan passes validation.

### Background Research Agents
Long-running research tasks that continue while the user works on other things:
- Codebase indexing for faster future searches
- Dependency vulnerability scanning
- Pattern extraction from commit history

Results would feed into `.spec/.global/` automatically.

### Model Routing
Route different task types to optimized models:
- Quick lookups → fast/cheap model
- Complex reasoning → capable model  
- UI/visual work → vision-capable model

Currently Shpeck is model-agnostic; routing would require runtime infrastructure.

---

## Shared Learnings

### Team-Wide Global Learnings
Currently `.spec/.global/` is local-only. Options for sharing:
- Separate `.shpeck-shared/` directory that IS committed
- Sync mechanism to a team knowledge base
- Export/import commands for manual sharing

### Automatic Learning Extraction
Parse commit messages, PR descriptions, and code review comments to automatically populate global learnings. Would require integration with git hosting platform APIs.

---

## Open Questions

1. **Plugin vs. standalone tool?** If we add runtime features, should Shpeck become an OpenCode/Claude Code plugin, or remain a standalone CLI that happens to have hooks?

2. **Backwards compatibility?** How do we ensure prompt-only users aren't disadvantaged if runtime features are added? The core workflow should remain functional without hooks.

3. **Complexity budget?** Each runtime feature adds maintenance burden and potential failure modes. What's the threshold where added capability justifies added complexity?
