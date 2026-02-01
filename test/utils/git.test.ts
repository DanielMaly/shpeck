import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { realpath } from 'node:fs/promises'

import { GitError, runGit } from '../../src/utils/git'
import { runCommand } from '../_helpers/exec'
import { createTempDir, removeTempDir } from '../_helpers/tmp'

describe('git', () => {
  let dir = ''

  beforeEach(async () => {
    dir = await realpath(await createTempDir())
    await runCommand(['git', 'init', '-q'], { cwd: dir })
  })

  afterEach(async () => {
    if (dir) await removeTempDir(dir)
  })

  test('runGit returns stdout/stderr/exitCode', async () => {
    const res = await runGit(['rev-parse', '--show-toplevel'], { cwd: dir })
    expect(res.exitCode).toBe(0)
    expect(res.stdout.trim()).toBe(dir)
    expect(typeof res.stderr).toBe('string')
  })

  test('runGit throws GitError on non-zero exit by default', async () => {
    const promise = runGit(['rev-parse', '--verify', 'refs/heads/this-branch-does-not-exist'], {
      cwd: dir,
    })
    await expect(promise).rejects.toBeInstanceOf(GitError)

    try {
      await promise
    } catch (err) {
      const ge = err as GitError
      expect(ge.exitCode).not.toBe(0)
      expect(ge.cwd).toBe(dir)
      expect(ge.args).toEqual(['rev-parse', '--verify', 'refs/heads/this-branch-does-not-exist'])
      expect(ge.message).toContain('git rev-parse --verify refs/heads/this-branch-does-not-exist')
      expect(ge.message).toContain(`cwd: ${dir}`)
    }
  })

  test('runGit does not throw when allowNonZeroExit is set', async () => {
    const res = await runGit(['rev-parse', '--verify', 'refs/heads/this-branch-does-not-exist'], {
      cwd: dir,
      allowNonZeroExit: true,
    })
    expect(res.exitCode).not.toBe(0)
  })
})
