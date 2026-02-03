import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import inquirer from 'inquirer'

import { getToolStrategy } from '../strategies'
import type { ToolChoice } from '../types/tool-choice'
import {
  ShpeckError,
  applyFrontmatter,
  assertRepoRoot,
  deepMerge,
  ensureDir,
  findPkgDir,
  isPlainObject,
  parseJson,
  pathExists,
  readTextFile,
  readTextFileIfExists,
  readTomlFile,
  stringifyJson,
  upsertTopLevelTomlString,
  writeTextFile,
  writeTomlFile,
} from '../utils'

export type InitOptions = {
  tool: ToolChoice
  trunk?: string
  replace?: boolean
}

const GLOBAL_STUBS = {
  'conventions.md':
    '# Codebase Conventions\n\n' +
    '<!-- Coding patterns, naming conventions, style rules discovered during development -->\n' +
    '<!-- Format: - [YYYY-MM-DD] <convention> -->\n\n' +
    '## Naming\n\n' +
    '## File Organization  \n\n' +
    '## Patterns\n',
  'architecture.md':
    '# Architecture\n\n' +
    '<!-- System structure, module boundaries, data flow patterns -->\n' +
    '<!-- Format: - [YYYY-MM-DD] <insight> -->\n\n' +
    '## Module Boundaries\n\n' +
    '## Data Flow\n\n' +
    '## Key Abstractions\n',
  'tooling.md':
    '# Tooling\n\n' +
    '<!-- Build, test, deploy commands and environment requirements -->\n' +
    '<!-- Format: - [YYYY-MM-DD] <command/requirement> -->\n\n' +
    '## Commands\n\n' +
    '## CI/CD\n\n' +
    '## Environment\n',
  'gotchas.md':
    '# Gotchas & Pitfalls\n\n' +
    '<!-- Non-obvious behaviors, past mistakes, debugging tips -->\n' +
    '<!-- Format: - [YYYY-MM-DD] <gotcha> -->\n\n' +
    '## Non-Obvious Behaviors\n\n' +
    '## Past Mistakes\n\n' +
    '## Debugging Tips\n',
} as const

type ToolConfig = {
  frontmatter: Record<string, unknown>
  settings: Record<string, unknown>
}

async function readToolConfig(pkgDir: string, tool: ToolChoice): Promise<ToolConfig> {
  const configPath = join(pkgDir, 'tool-config', `${tool}.json`)
  const raw = await readTextFile(configPath)
  const parsed = parseJson<unknown>(raw, configPath)

  if (!isPlainObject(parsed)) {
    throw new ShpeckError(`Invalid tool config (${configPath}): expected an object`)
  }

  const frontmatterRaw = parsed.frontmatter
  const frontmatter = isPlainObject(frontmatterRaw)
    ? (frontmatterRaw as Record<string, unknown>)
    : {}

  const settingsRaw = parsed.settings
  if (!isPlainObject(settingsRaw)) {
    throw new ShpeckError(`Invalid tool config (${configPath}): settings must be an object`)
  }

  return { frontmatter, settings: settingsRaw as Record<string, unknown> }
}

async function listPkgCommandFiles(pkgCommandsDir: string): Promise<string[]> {
  const entries = await readdir(pkgCommandsDir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))
}

async function ensureGitExcludeLine(repoRoot: string, line: string): Promise<void> {
  const excludePath = join(repoRoot, '.git', 'info', 'exclude')
  await ensureDir(dirname(excludePath))

  const existing = (await readTextFileIfExists(excludePath)) ?? ''
  const existingLines = existing.split(/\r?\n/)
  const hasLine = existingLines.some((l) => l.trim() === line)
  if (hasLine) return

  const prefix = existing.length === 0 || existing.endsWith('\n') ? '' : '\n'
  await writeTextFile(excludePath, `${existing}${prefix}${line}\n`)
}

async function ensureGlobalStubFiles(repoRoot: string): Promise<void> {
  const specDir = join(repoRoot, '.spec')
  await ensureDir(specDir)

  const globalDir = join(specDir, '.global')
  await ensureDir(globalDir)

  for (const [fileName, content] of Object.entries(GLOBAL_STUBS)) {
    const filePath = join(globalDir, fileName)
    if (await pathExists(filePath)) continue
    await writeTextFile(filePath, content)
  }
}

async function ensureShpeckToml(repoRoot: string, trunk?: string): Promise<void> {
  const path = join(repoRoot, '.shpeck.toml')
  const existing = await readTextFileIfExists(path)

  if (existing === null) {
    const resolvedTrunk = trunk ?? 'main'
    await writeTomlFile(path, `trunk_branch = ${JSON.stringify(resolvedTrunk)}\n`)
    return
  }

  const data = await readTomlFile<Record<string, unknown>>(path)
  if (data === null || !trunk) return

  const updated = upsertTopLevelTomlString(data.text, 'trunk_branch', trunk)
  if (updated !== data.text) await writeTomlFile(path, updated)
}

async function installToolAssets(repoRoot: string, options: InitOptions): Promise<void> {
  const strategy = getToolStrategy(options.tool)
  const toolDirLine = strategy.getToolDirLine()
  const toolDirPath = strategy.getToolDirPath(repoRoot)

  const pkgDir = await findPkgDir()
  const pkgCommandsDir = join(pkgDir, 'commands')
  const pkgRulesPath = join(pkgDir, 'shpeck-rules.md')
  const toolConfig = await readToolConfig(pkgDir, options.tool)

  const commandFiles = await listPkgCommandFiles(pkgCommandsDir)
  const settingsDestPath = strategy.getSettingsPath(repoRoot)
  const rulesPlan = strategy.getRulesPlan(repoRoot)

  const commandDestPaths = commandFiles.map((fileName) => {
    const name = fileName.slice(0, -'.md'.length)
    return strategy.getCommandDestPath(repoRoot, name, fileName)
  })

  const toolDirExists = await pathExists(toolDirPath)
  if (!toolDirExists) {
    await ensureDir(toolDirPath)
  }

  if (toolDirExists && !options.replace) {
    const existingDests = [
      rulesPlan.rulesPath,
      settingsDestPath,
      ...commandDestPaths,
      ...(rulesPlan.localInstructionsPath ? [rulesPlan.localInstructionsPath] : []),
    ]
    const anyExists = await (async () => {
      for (const p of existingDests) {
        if (await pathExists(p)) return true
      }
      return false
    })()

    if (anyExists) {
      const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Shpeck files already exist in ${toolDirLine}. Overwrite? [y/N]`,
          default: false,
        },
      ])

      if (!overwrite) return
    }
  }

  // (7.1) rules file
  const rulesContent = await readTextFile(pkgRulesPath)
  await ensureDir(dirname(rulesPlan.rulesPath))
  await writeTextFile(rulesPlan.rulesPath, rulesContent)

  if (rulesPlan.localInstructionsPath && rulesPlan.localInstructionsLine) {
    const existing = (await readTextFileIfExists(rulesPlan.localInstructionsPath)) ?? ''
    const lines = existing.split(/\r?\n/)
    const hasLine = lines.some((line) => line.trim() === rulesPlan.localInstructionsLine)
    if (!hasLine) {
      const suffix = existing.length === 0 || existing.endsWith('\n') ? '' : '\n'
      const nextContent = `${existing}${suffix}${rulesPlan.localInstructionsLine}\n`
      await writeTextFile(rulesPlan.localInstructionsPath, nextContent)
    }
  }

  // (7.2) command files
  for (const fileName of commandFiles) {
    const srcPath = join(pkgCommandsDir, fileName)
    const srcContent = await readTextFile(srcPath)

    const name = fileName.slice(0, -'.md'.length)
    const toolFrontmatter = toolConfig.frontmatter[name]
    const overrides = isPlainObject(toolFrontmatter)
      ? (toolFrontmatter as Record<string, unknown>)
      : undefined

    const outContent = overrides ? applyFrontmatter(srcContent, overrides) : srcContent

    const destPath = strategy.getCommandDestPath(repoRoot, name, fileName)
    await ensureDir(dirname(destPath))
    await writeTextFile(destPath, outContent)
  }

  // (7.3) settings file merge
  if (!(await pathExists(settingsDestPath))) {
    await writeTextFile(settingsDestPath, stringifyJson(toolConfig.settings))
    return
  }

  const existingText = await readTextFile(settingsDestPath)
  const existingJson = parseJson<unknown>(existingText, settingsDestPath)

  if (!isPlainObject(existingJson)) {
    throw new ShpeckError(`Invalid settings file (${settingsDestPath}): expected a JSON object`)
  }

  const merged = deepMerge(existingJson as Record<string, unknown>, toolConfig.settings)
  await writeTextFile(settingsDestPath, stringifyJson(merged))
}

export async function runInit(options: InitOptions): Promise<void> {
  const { repoRoot } = await assertRepoRoot()
  const strategy = getToolStrategy(options.tool)

  // (5.1.3-1) protected paths
  await ensureGlobalStubFiles(repoRoot)
  await ensureShpeckToml(repoRoot, options.trunk)

  // (5.1.3-2/3) tool assets + tool dir handling
  await installToolAssets(repoRoot, options)

  // (5.1.3-4) git exclude
  await ensureGitExcludeLine(repoRoot, '.spec/')
  await ensureGitExcludeLine(repoRoot, '.shpeck.toml')
  for (const line of strategy.getGitExcludeLines()) {
    await ensureGitExcludeLine(repoRoot, line)
  }
}
