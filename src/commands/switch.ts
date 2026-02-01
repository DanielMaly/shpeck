import { lstat, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import inquirer from 'inquirer'

import {
  ShpeckError,
  assertRepoRoot,
  pathExists,
  readTomlFile,
  upsertTopLevelTomlString,
  writeTomlFile,
} from '../utils'

async function listSpecContextDirs(specDir: string): Promise<string[]> {
  const entries = await readdir(specDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function ensureContextDir(specDir: string, contextName: string): Promise<void> {
  const contextPath = join(specDir, contextName)
  if (!(await pathExists(contextPath))) {
    throw new ShpeckError(`Context "${contextName}" does not exist in .spec/`)
  }

  const stats = await lstat(contextPath)
  if (!stats.isDirectory()) {
    throw new ShpeckError(`Context "${contextName}" is not a directory in .spec/`)
  }
}

async function updateActiveContext(tomlPath: string, contextName: string): Promise<void> {
  const data = await readTomlFile<Record<string, unknown>>(tomlPath)
  if (data === null) {
    throw new ShpeckError('Missing .shpeck.toml. Run "shpeck init" first.')
  }

  const updated = upsertTopLevelTomlString(data.text, 'active_context', contextName)
  if (updated !== data.text) {
    await writeTomlFile(tomlPath, updated)
  }
}

export async function runSwitch(contextName?: string): Promise<void> {
  const { repoRoot } = await assertRepoRoot()

  const tomlPath = join(repoRoot, '.shpeck.toml')
  if (!(await pathExists(tomlPath))) {
    throw new ShpeckError('Missing .shpeck.toml. Run "shpeck init" first.')
  }

  const specDir = join(repoRoot, '.spec')
  if (!(await pathExists(specDir))) {
    throw new ShpeckError('Missing .spec/ directory. Run "shpeck init" first.')
  }

  if (contextName) {
    await ensureContextDir(specDir, contextName)
    await updateActiveContext(tomlPath, contextName)
    return
  }

  const contexts = await listSpecContextDirs(specDir)
  if (contexts.length === 0) {
    throw new ShpeckError('No contexts found in .spec/.')
  }

  const { selectedContext } = await inquirer.prompt<{ selectedContext: string }>([
    {
      type: 'list',
      name: 'selectedContext',
      message: 'Select a context to activate',
      choices: contexts,
    },
  ])

  await updateActiveContext(tomlPath, selectedContext)
}
