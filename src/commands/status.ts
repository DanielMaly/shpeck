import { lstat, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import {
  assertRepoRoot,
  getRecursiveMtimeMs,
  pathExists,
  readTextFileIfExists,
  readTomlFile,
  runGit,
} from '../utils'

export type StatusOptions = {
  all?: boolean
}

type ContextType = 'ticket' | 'draft' | 'unknown'

function toIsoString(ms: number): string {
  return new Date(ms).toISOString()
}

async function readActiveContext(repoRoot: string): Promise<string | null> {
  const tomlPath = join(repoRoot, '.shpeck.toml')
  const data = await readTomlFile<Record<string, unknown>>(tomlPath)
  if (data === null) return null

  const raw = data.data.active_context
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed ? trimmed : null
}

async function readContextType(repoRoot: string, contextName: string): Promise<ContextType> {
  const contextTomlPath = join(repoRoot, '.spec', contextName, 'context.toml')
  const raw = await readTextFileIfExists(contextTomlPath)
  if (raw === null) return 'unknown'

  try {
    const parsed = Bun.TOML.parse(raw) as Record<string, unknown>
    const t = parsed.type
    return t === 'ticket' || t === 'draft' ? t : 'unknown'
  } catch {
    return 'unknown'
  }
}

async function readSpecVersion(repoRoot: string, contextName: string): Promise<string> {
  const specPath = join(repoRoot, '.spec', contextName, 'spec.md')
  const raw = await readTextFileIfExists(specPath)
  if (raw === null) return 'unknown'

  const firstLine = raw.split(/\r?\n/)[0]?.trim() ?? ''
  const m = /^Version:\s*([1-9]\d*)$/.exec(firstLine)
  return m ? m[1] : 'unknown'
}

async function readLastPlanTimestamp(repoRoot: string, contextName: string): Promise<string> {
  const planPath = join(repoRoot, '.spec', contextName, '.dev', 'plan.md')
  if (!(await pathExists(planPath))) return 'none'
  const st = await lstat(planPath)
  return toIsoString(st.mtimeMs)
}

async function readGitBranch(repoRoot: string): Promise<string> {
  const { stdout } = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: repoRoot,
    allowNonZeroExit: true,
  })
  const branch = stdout.trim()
  return branch || 'unknown'
}

async function readGitWorkingTreeStatus(repoRoot: string): Promise<'clean' | 'dirty'> {
  const { stdout } = await runGit(['status', '--porcelain', '--untracked-files=no'], {
    cwd: repoRoot,
  })
  return stdout.trim().length === 0 ? 'clean' : 'dirty'
}

async function listContextDirs(repoRoot: string): Promise<string[]> {
  const specDir = join(repoRoot, '.spec')
  if (!(await pathExists(specDir))) return []
  const entries = await readdir(specDir, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))
}

export async function runStatus(options: StatusOptions): Promise<void> {
  const { repoRoot } = await assertRepoRoot()

  const activeContext = await readActiveContext(repoRoot)
  const branch = await readGitBranch(repoRoot)
  const workingTree = await readGitWorkingTreeStatus(repoRoot)

  const ctxType = activeContext ? await readContextType(repoRoot, activeContext) : 'unknown'
  const specVersion = activeContext ? await readSpecVersion(repoRoot, activeContext) : 'none'
  const lastPlan = activeContext ? await readLastPlanTimestamp(repoRoot, activeContext) : 'none'

  const lines: string[] = []
  lines.push(`Active context: ${activeContext ?? 'none'}`)
  lines.push(`Context type: ${ctxType}`)
  lines.push(`Spec version: ${specVersion}`)
  lines.push(`Last plan timestamp: ${lastPlan}`)
  lines.push(`Git branch: ${branch}`)
  lines.push(`Working tree: ${workingTree}`)

  if (options.all) {
    const contexts = await listContextDirs(repoRoot)
    lines.push('')
    lines.push('Contexts:')

    if (contexts.length === 0) {
      lines.push('none')
    } else {
      for (const name of contexts) {
        const type = await readContextType(repoRoot, name)
        const mtimeMs = await getRecursiveMtimeMs(join(repoRoot, '.spec', name))
        const mtime = mtimeMs > 0 ? toIsoString(mtimeMs) : 'none'
        lines.push(`${name}\t${type}\t${mtime}`)
      }
    }
  }

  console.log(lines.join('\n'))
}
