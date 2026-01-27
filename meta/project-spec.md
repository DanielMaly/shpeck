# Shpeck: Project Technical Specification

This document specifies the implementation requirements for the `shpeck` CLI tool.

Normative language: the terms MUST, MUST NOT, SHOULD, and MAY are used as described in RFC 2119.

## 1. Scope
`shpeck` is a local-only CLI tool that bootstraps and manages the Spec-Driven Development (SDD) workflow defined in `meta/process-spec.md`.

This spec covers:
1. **Script command implementation** (executed directly by the `shpeck` CLI):
   - `shpeck init`
   - `shpeck switch`
   - `shpeck status`

2. **Package structure and asset distribution** for agent commands:
   - Package contents (`pkg/` directory structure)
   - Asset transformation and installation rules
   - Tool-specific configuration file formats

The **behavior and workflow semantics** of agent commands (shpeck-new, shpeck-sync, etc.) are defined in `meta/process-spec.md` and are out of scope for this document.

## 2. Technology
- Runtime MUST be Bun.
- Language MUST be TypeScript.
- Distribution MUST be an npm package (installable via `npm`, `pnpm`, or `bun`).

## 3. External Libraries
The implementation MUST use these libraries (no substitutes):
- CLI parsing: `commander`
- Interactive prompts: `inquirer`

File operations MUST use Bun APIs and/or Node-compatible `fs` APIs available in Bun (for recursive directory operations).

Git operations MUST be implemented by spawning `git` subprocesses (no libgit2 bindings).

## 4. Definitions
- Repo root: the directory returned by `git rev-parse --show-toplevel`.
- Working directory: `process.cwd()`.
- Tool directory:
  - `opencode` => `.opencode/`
  - `claude` => `.claude/`
- Protected paths: `.shpeck.toml` and `.spec/`.
  - These paths receive special handling during `shpeck init` (see Section 5.1.3).
  - `shpeck init` MUST NOT delete or replace these paths entirely.
  - `shpeck init` MAY create or update individual settings within these paths as specified in Section 5.1.3.

## 5. Command Behavior

### 5.1 `shpeck init`
Initializes Shpeck in the current repository.

#### 5.1.1 Preconditions
- `shpeck init` MUST run in the repo root.
- The repo root MUST be determined by running `git rev-parse --show-toplevel`.
- If the command fails, or if `process.cwd()` is not equal to the repo root path (string-equal after resolving symlinks), the command MUST exit with a non-zero code and an error message.

#### 5.1.2 Arguments
- `--tool <name>` is REQUIRED.
  - The value MUST be case-insensitive (e.g., `Opencode` is treated as `opencode`).
  - Valid normalized values are exactly `opencode` and `claude`.
- `--trunk <branch>` is OPTIONAL.
  - Default value MUST be `main` when `.shpeck.toml` is created by this run.
  - If `.shpeck.toml` already exists and `--trunk` is not provided, `trunk_branch` MUST NOT be modified.
- `--replace` is OPTIONAL.
  - When present, `shpeck init` MUST NOT prompt for confirmation when tool directory already exists.

Invalid flags or invalid values MUST cause a non-zero exit code.

#### 5.1.3 Effects
Given `toolDir` determined from `--tool`:

1) Protected paths
- `.shpeck.toml` handling:
  - If `.shpeck.toml` does not exist, the command MUST create it.
    - The file MUST be valid TOML.
    - It MUST set `trunk_branch` to the resolved value of `--trunk`.
    - It MUST NOT set `active_context`.
  - If `.shpeck.toml` exists:
    - If `--trunk` is provided, the command MUST update `trunk_branch` to that value.
    - If `--trunk` is not provided, the command MUST NOT modify `.shpeck.toml`.
    - Any updates MUST preserve all other keys and values (including `active_context`).
- `.spec/` handling:
  - If `.spec/` does not exist, the command MUST create it as an empty directory.
  - If `.spec/` exists, the command MUST NOT delete, rename, or modify it or any of its contents.

2) Tool assets
- The package MUST ship a `pkg/` directory.

- `shpeck init` MUST install tool assets into `toolDir` as specified in Section 7 (including any required transformations).
- The command MUST create any required parent directories under `toolDir`.
- When asset installation proceeds:
  - For each non-settings destination file written by Section 7.1 and 7.2, the destination file MUST be overwritten if it already exists.
  - For the tool settings file (Section 7.3), the command MUST apply the merge behavior specified in Section 7.3 (not a full overwrite).
- The command MUST NOT delete or rename `toolDir`.
- The command MUST NOT delete or rename any existing files or directories under `toolDir`.

3) Tool directory handling
- If `toolDir` does not exist, the command MUST create it and then proceed with asset installation.
- If `toolDir` exists:
  - With `--replace`: the command MUST proceed with asset installation without prompting.
  - Without `--replace`:
    - The command MUST determine whether any destination file written by Section 7 already exists.
    - If no such destination file exists, the command MUST proceed with asset installation without prompting.
    - If at least one such destination file exists, the command MUST prompt exactly:
      - `Shpeck files already exist in <toolDir>. Overwrite? [y/N]`
      - If the user answers yes: the command MUST proceed with asset installation.
      - If the user answers no (or presses enter): the command MUST NOT install any tool assets and MUST continue to step (4).

4) Git exclude
- The command MUST ensure the file `.git/info/exclude` exists.
- The command MUST ensure the following lines exist in `.git/info/exclude` (idempotent; do not add duplicates):
  - `.spec/`
  - `.shpeck.toml`
  - `<toolDir>` (exactly `.opencode/` or `.claude/`)
- The command MUST NOT modify `.gitignore`.

#### 5.1.4 Exit codes
- Exit code MUST be 0 on success.
- Exit code MUST be non-zero on any precondition failure, invalid arguments, filesystem error, or git error.

### 5.2 `shpeck switch [context_name]`
Sets the active context in `.shpeck.toml`.

#### 5.2.1 Preconditions
- `shpeck switch` MUST run in the repo root (same definition and check as `shpeck init`).
- `.shpeck.toml` MUST exist; otherwise the command MUST exit non-zero and instruct the user to run `shpeck init`.
- `.spec/` MUST exist; otherwise the command MUST exit non-zero and instruct the user to run `shpeck init`.

#### 5.2.2 Behavior
- If `context_name` is provided:
  - The command MUST verify `.spec/<context_name>/` exists and is a directory.
  - If it does not exist, the command MUST exit non-zero.
  - If it exists, the command MUST set `.shpeck.toml.active_context` to `<context_name>`.
- If `context_name` is not provided:
  - The command MUST list all direct child directories of `.spec/`.
  - If no directories exist, the command MUST exit non-zero.
  - The command MUST present the directory names in alphabetical order via `inquirer`.
  - After selection, the command MUST set `.shpeck.toml.active_context` to the selected name.

`.shpeck.toml` updates MUST preserve all other keys and values.

### 5.3 `shpeck status [--all]`
Displays current repo and Shpeck state.

#### 5.3.1 Preconditions
- `shpeck status` MUST run in the repo root (same definition and check as `shpeck init`).

#### 5.3.2 Data sources
- Active context:
  - If `.shpeck.toml` does not exist, active context is considered unset.
  - If `.shpeck.toml.active_context` is missing or empty, active context is considered unset.
- Context metadata:
  - When active context is set and `.spec/<active_context>/context.toml` exists, `type` MUST be read from it.
  - If `context.toml` is missing or `type` is missing/invalid, type MUST be reported as `unknown`.
- Spec version:
  - When active context is set and `.spec/<active_context>/spec.md` exists, the tool MUST parse the first line.
  - If the first line matches `Version: N` where `N` is a positive base-10 integer, that integer MUST be reported.
  - Otherwise, version MUST be reported as `unknown`.
- Last plan timestamp:
  - When active context is set and `.spec/<active_context>/.dev/plan.md` exists, the timestamp MUST be the filesystem modification time (mtime) of that file.
  - Otherwise it MUST be reported as `none`.
- Git branch:
  - MUST be obtained via `git rev-parse --abbrev-ref HEAD`.
- Git working tree status:
  - MUST be `clean` if `git status --porcelain --untracked-files=no` returns empty output.
  - MUST be `dirty` otherwise.
  - Untracked files MUST be ignored when determining clean/dirty.

#### 5.3.3 Output requirements
- Default output MUST include:
  - Active context name (or `none`)
  - Context type (`ticket`, `draft`, or `unknown`)
  - Spec version (`N`, `unknown`, or `none`)
  - Last plan timestamp (`RFC3339`, or `none`)
  - Current git branch
  - Working tree status (`clean` or `dirty`)

- With `--all`:
  - The command MUST list all direct child directories of `.spec/` in alphabetical order.
  - For each context directory, it MUST report:
    - Context name
    - Context type (same rules as above)
    - Context modification time (mtime), which is the latest mtime of any file within the context directory (recursive).

## 6. Package Assets (`pkg/`)

The npm package MUST include a top-level directory `pkg/`.

### 6.1 Directory Structure

```
pkg/
├── AGENTS.md
├── commands/
│   ├── shpeck-new.md
│   ├── shpeck-sync.md
│   ├── shpeck-refine.md
│   ├── shpeck-spec.md
│   ├── shpeck-plan.md
│   ├── shpeck-code.md
│   ├── shpeck-diagnose.md
│   ├── shpeck-verify.md
│   ├── shpeck-explain.md
│   └── shpeck-promote.md
└── tool-config/
    ├── opencode.json
    └── claude.json
```

### 6.2 Instructions File (`pkg/AGENTS.md`)

- MUST contain markdown instructions for the AI assistant.
- MUST be tool-agnostic (no tool-specific syntax).

### 6.3 Command Files (`pkg/commands/*.md`)

- Each file MUST contain the command body as markdown.
- Each file MAY contain a `description` field in YAML frontmatter.
- Tool-specific frontmatter (e.g., `agent`, `disable-model-invocation`) MUST NOT appear in these files.
- Tool-specific frontmatter MUST be defined in `pkg/tool-config/<tool>.json`.

### 6.4 Tool Config Files (`pkg/tool-config/*.json`)

Each tool config file MUST be valid JSON with the following structure:

```json
{
  "frontmatter": {
    "<command-name>": {
      "<field>": "<value>"
    }
  },
  "settings": {
    // Tool-specific settings to merge into the tool's settings file
  }
}
```

#### 6.4.1 `pkg/tool-config/opencode.json`

MUST define:
- `frontmatter`: OpenCode-specific YAML frontmatter fields per command.
- `settings`: Content to merge into `.opencode/opencode.json`.

The `settings` object MUST include:
- `"$schema": "https://opencode.ai/config.json"`
- `"instructions"` array referencing `.opencode/AGENTS.md`
- `"watcher.ignore"` array containing `.spec/**`

#### 6.4.2 `pkg/tool-config/claude.json`

MUST define:
- `frontmatter`: Claude Code-specific YAML frontmatter fields per command.
- `settings`: Content to merge into `.claude/settings.json`.

The `settings.permissions.deny` array MUST include:
- `"Bash(rm -rf .spec:*)"`
- `"Bash(rm .spec:*)"`
- `"Bash(rm -rf .shpeck.toml:*)"`
- `"Bash(rm .shpeck.toml:*)"`

## 7. Asset Copy Behavior

This section specifies how `shpeck init` transforms and copies assets from `pkg/` to the tool directory.

### 7.1 Instructions File

| Tool | Source | Destination |
|------|--------|-------------|
| `opencode` | `pkg/AGENTS.md` | `.opencode/AGENTS.md` |
| `claude` | `pkg/AGENTS.md` | `.claude/CLAUDE.md` |

The file MUST be copied without modification.

### 7.2 Command Files

#### 7.2.1 For `--tool opencode`

For each file `pkg/commands/<name>.md`:

1. Read file content (may include minimal frontmatter).
2. Look up `frontmatter.<name>` from `pkg/tool-config/opencode.json` (where `<name>` excludes `.md`).
3. If tool-specific frontmatter exists:
   - Parse any existing frontmatter from the file.
   - Merge tool-specific frontmatter (tool-specific values override file values).
   - Serialize merged frontmatter as YAML.
   - Prepend to file body.
4. Write result to `.opencode/commands/<name>.md`.

#### 7.2.2 For `--tool claude`

For each file `pkg/commands/<name>.md`:

1. Read file content (may include minimal frontmatter).
2. Look up `frontmatter.<name>` from `pkg/tool-config/claude.json` (where `<name>` excludes `.md`).
3. If tool-specific frontmatter exists:
   - Parse any existing frontmatter from the file.
   - Merge tool-specific frontmatter (tool-specific values override file values).
   - Serialize merged frontmatter as YAML.
   - Prepend to file body.
4. Create directory `.claude/skills/<name>/` (where `<name>` excludes `.md`).
5. Write result to `.claude/skills/<name>/SKILL.md`.

### 7.3 Settings File

#### 7.3.1 Target Locations

| Tool | Settings File Location |
|------|------------------------|
| `opencode` | `.opencode/opencode.json` |
| `claude` | `.claude/settings.json` |

#### 7.3.2 Merge Behavior

1. Read `settings` object from `pkg/tool-config/<tool>.json`.
2. If target settings file does not exist:
   - Write the `settings` object as the file content.
3. If target settings file exists:
   - Parse existing JSON.
   - Deep-merge source `settings` into existing object using the rules below.
   - Write merged result back to target file.

#### 7.3.3 Deep-Merge Rules

| Field Type | Merge Behavior |
|------------|----------------|
| Object | Recursively merge child keys. |
| Array | Concatenate source array to target array, then deduplicate (preserve first occurrence). |
| Scalar (string, number, boolean, null) | Target value wins if defined; otherwise use source value. |

**Deduplication for arrays**: Two values are considered duplicates if they are strictly equal (`===`) for primitives, or deeply equal for objects.

#### 7.3.4 Preservation Guarantee

The merge MUST NOT:
- Remove any existing keys from the target file.
- Overwrite any existing scalar values in the target file.
- Remove any existing array elements from the target file.

The merge MUST:
- Add new keys from source that do not exist in target.
- Add new array elements from source that do not exist in target.
- Recursively merge nested objects.
