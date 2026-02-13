import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, realpath, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { runCommand } from './_helpers/exec'
import { createTempDir, removeTempDir } from './_helpers/tmp'

const repoRoot = join(import.meta.dir, '..')
const cliPath = join(repoRoot, 'bin', 'shpeck.ts')

describe('shpeck status (integration)', () => {
  const originalCwd = process.cwd()
  let dir = ''

  beforeEach(async () => {
    dir = await realpath(await createTempDir())
    await runCommand(['git', 'init', '-q'], { cwd: dir })
    await runCommand(['git', 'config', 'user.email', 'you@example.com'], { cwd: dir })
    await runCommand(['git', 'config', 'user.name', 'Your Name'], { cwd: dir })
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    if (dir) await removeTempDir(dir)
  })

  test('no .shpeck.toml => active context is none', async () => {
    const { exitCode, stdout } = await runCommand(['bun', cliPath, 'status'], { cwd: dir })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Active context: none')
  })

  test('spec version parsing and invalid/missing cases', async () => {
    await mkdir(join(dir, '.spec', 'ctx', '.dev'), { recursive: true })
    await writeFile(
      join(dir, '.shpeck.toml'),
      'trunk_branch = "main"\nactive_context = "ctx"\n',
      'utf8'
    )

    // missing spec.md => unknown
    {
      const { stdout } = await runCommand(['bun', cliPath, 'status'], { cwd: dir })
      expect(stdout).toContain('Spec version: unknown')
    }

    // invalid first line => unknown
    await writeFile(join(dir, '.spec', 'ctx', 'spec.md'), 'Version: 0\n', 'utf8')
    {
      const { stdout } = await runCommand(['bun', cliPath, 'status'], { cwd: dir })
      expect(stdout).toContain('Spec version: unknown')
    }

    // valid first line => N
    await writeFile(join(dir, '.spec', 'ctx', 'spec.md'), 'Version: 12\nmore\n', 'utf8')
    {
      const { stdout } = await runCommand(['bun', cliPath, 'status'], { cwd: dir })
      expect(stdout).toContain('Spec version: 12')
    }
  })

  test('git status clean/dirty ignores untracked', async () => {
    await writeFile(join(dir, 'tracked.txt'), 'a\n', 'utf8')
    await runCommand(['git', 'add', 'tracked.txt'], { cwd: dir })
    await runCommand(['git', 'commit', '-m', 'init', '--no-gpg-sign'], { cwd: dir })

    // untracked file should not make it dirty
    await writeFile(join(dir, 'untracked.txt'), 'u\n', 'utf8')
    {
      const { stdout } = await runCommand(['bun', cliPath, 'status'], { cwd: dir })
      expect(stdout).toContain('Working tree: clean')
    }

    // modify tracked file -> dirty
    await writeFile(join(dir, 'tracked.txt'), 'b\n', 'utf8')
    {
      const { stdout } = await runCommand(['bun', cliPath, 'status'], { cwd: dir })
      expect(stdout).toContain('Working tree: dirty')
    }
  })

  test('--all orders contexts and reports recursive mtime', async () => {
    await mkdir(join(dir, '.spec', 'b', '.dev'), { recursive: true })
    await mkdir(join(dir, '.spec', 'a', '.dev'), { recursive: true })

    // ensure different mtimes by writing in sequence
    await writeFile(join(dir, '.spec', 'a', 'context.toml'), 'type = "ticket"\n', 'utf8')
    await writeFile(join(dir, '.spec', 'b', 'context.toml'), 'type = "draft"\n', 'utf8')

    // nested file so recursive mtime must include it
    await mkdir(join(dir, '.spec', 'a', 'nested'), { recursive: true })
    await writeFile(join(dir, '.spec', 'a', 'nested', 'x.txt'), 'x\n', 'utf8')

    const { exitCode, stdout } = await runCommand(['bun', cliPath, 'status', '--all'], { cwd: dir })
    expect(exitCode).toBe(0)

    const lines = stdout
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0)

    const contextsHeaderIndex = lines.findIndex((l) => l === 'Contexts:')
    expect(contextsHeaderIndex).toBeGreaterThanOrEqual(0)

    const contextLines = lines.slice(contextsHeaderIndex + 1)
    expect(contextLines.length).toBeGreaterThanOrEqual(2)

    // alphabetical ordering: a before b
    expect(contextLines[0].startsWith('a\t')).toBe(true)
    expect(contextLines[1].startsWith('b\t')).toBe(true)

    // include type field
    expect(contextLines[0]).toContain('\tticket\t')
    expect(contextLines[1]).toContain('\tdraft\t')

    // include RFC3339 mtime
    const rfc3339Re = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
    expect(rfc3339Re.test(contextLines[0])).toBe(true)
    expect(rfc3339Re.test(contextLines[1])).toBe(true)
  })
})
