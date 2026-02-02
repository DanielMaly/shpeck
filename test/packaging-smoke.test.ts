import { afterEach, describe, expect, test } from 'bun:test'
import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { runCommand } from './_helpers/exec'

const repoRoot = path.resolve(import.meta.dir, '..')

describe('packaging smoke', () => {
  let tarballPath: string | null = null

  afterEach(async () => {
    if (tarballPath) {
      await unlink(tarballPath).catch(() => {})
      tarballPath = null
    }
  })

  test('npm pack tarball includes bin/, src/, and pkg/', async () => {
    const { exitCode, stdout } = await runCommand(['npm', 'pack', '--silent'], {
      cwd: repoRoot,
    })
    expect(exitCode).toBe(0)

    const lines = stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const tarballName = lines.length > 0 ? lines[lines.length - 1] : ''

    expect(tarballName).toBeTruthy()
    tarballPath = path.join(repoRoot, tarballName)

    const { exitCode: tarExit, stdout: listing } = await runCommand(['tar', '-tf', tarballPath], {
      cwd: repoRoot,
    })
    expect(tarExit).toBe(0)

    const entries = listing
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    expect(entries).toContain('package/package.json')
    expect(entries).toContain('package/bin/shpeck.ts')
    expect(entries).toContain('package/src/cli.ts')
    expect(entries).toContain('package/pkg/shpeck-rules.md')
    expect(entries).toContain('package/pkg/tool-config/opencode.json')
    expect(entries).toContain('package/pkg/commands/shpeck-new.md')
  })
})
