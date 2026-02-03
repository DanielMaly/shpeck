import { realpath } from 'node:fs/promises'

import { ShpeckError } from './errors'
import { runGit } from './git'

export async function getRepoRoot(): Promise<string> {
  const { stdout } = await runGit(['rev-parse', '--show-toplevel'])
  const root = stdout.trim()
  if (!root) throw new ShpeckError('git rev-parse --show-toplevel returned empty output')
  return root
}

export async function assertRepoRoot(): Promise<{ repoRoot: string; cwd: string }> {
  const [repoRootRaw, cwdRaw] = await Promise.all([getRepoRoot(), Promise.resolve(process.cwd())])
  const [repoRoot, cwd] = await Promise.all([realpath(repoRootRaw), realpath(cwdRaw)])
  if (repoRoot !== cwd) {
    throw new ShpeckError(`Command must run in repo root.\nrepo root: ${repoRoot}\ncwd: ${cwd}`)
  }
  return { repoRoot, cwd }
}
