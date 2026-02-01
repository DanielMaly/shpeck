import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, realpath } from 'node:fs/promises'
import { join } from 'node:path'

import { ShpeckError } from '../../src/utils'
import { assertRepoRoot, getRepoRoot } from '../../src/utils'
import { runCommand } from '../_helpers/exec'
import { createTempDir, removeTempDir } from '../_helpers/tmp'

describe('repo', () => {
  const originalCwd = process.cwd()
  let dir = ''

  beforeEach(async () => {
    dir = await realpath(await createTempDir())
    await runCommand(['git', 'init', '-q'], { cwd: dir })
    process.chdir(dir)
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    if (dir) await removeTempDir(dir)
  })

  test('getRepoRoot returns repo root', async () => {
    const root = await getRepoRoot()
    expect(root).toBe(dir)
  })

  test('assertRepoRoot passes in repo root', async () => {
    expect(assertRepoRoot()).resolves.toEqual({ repoRoot: dir, cwd: dir })
  })

  test('assertRepoRoot throws when cwd is not repo root', async () => {
    const subdir = join(dir, 'sub')
    await mkdir(subdir)
    process.chdir(subdir)

    expect(assertRepoRoot()).rejects.toBeInstanceOf(ShpeckError)
    expect(assertRepoRoot()).rejects.toThrow('Command must run in repo root.')
  })
})
