import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { runCommand } from './_helpers/exec'
import { createTempDir, removeTempDir } from './_helpers/tmp'

const repoRoot = join(import.meta.dir, '..')
const cliPath = join(repoRoot, 'bin', 'shpeck.ts')

describe('shpeck switch (integration)', () => {
  const originalCwd = process.cwd()
  let dir = ''

  beforeEach(async () => {
    dir = await realpath(await createTempDir())
    await runCommand(['git', 'init', '-q'], { cwd: dir })
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    if (dir) await removeTempDir(dir)
  })

  test('fails if .shpeck.toml is missing', async () => {
    await mkdir(join(dir, '.spec'))

    const { exitCode, stderr } = await runCommand(['bun', cliPath, 'switch', 'any'], {
      cwd: dir,
      allowNonZeroExit: true,
    })

    expect(exitCode).toBeGreaterThan(0)
    expect(stderr).toContain('Missing .shpeck.toml. Run "shpeck init" first.')
  })

  test('fails if .spec/ is missing', async () => {
    await writeFile(join(dir, '.shpeck.toml'), 'trunk_branch = "main"\n', 'utf8')

    const { exitCode, stderr } = await runCommand(['bun', cliPath, 'switch', 'any'], {
      cwd: dir,
      allowNonZeroExit: true,
    })

    expect(exitCode).toBeGreaterThan(0)
    expect(stderr).toContain('Missing .spec/ directory. Run "shpeck init" first.')
  })

  test('with arg: fails if context dir is missing', async () => {
    await writeFile(join(dir, '.shpeck.toml'), 'trunk_branch = "main"\n', 'utf8')
    await mkdir(join(dir, '.spec'))

    const { exitCode, stderr } = await runCommand(['bun', cliPath, 'switch', 'missing-ctx'], {
      cwd: dir,
      allowNonZeroExit: true,
    })

    expect(exitCode).toBeGreaterThan(0)
    expect(stderr).toContain('Context "missing-ctx" does not exist in .spec/')
  })

  test('with arg: sets active_context when context dir exists', async () => {
    await writeFile(join(dir, '.shpeck.toml'), 'trunk_branch = "main"\n', 'utf8')
    await mkdir(join(dir, '.spec', 'ddmuk-1234'), { recursive: true })

    const { exitCode } = await runCommand(['bun', cliPath, 'switch', 'ddmuk-1234'], {
      cwd: dir,
    })
    expect(exitCode).toBe(0)

    const toml = await readFile(join(dir, '.shpeck.toml'), 'utf8')
    expect(toml).toContain('active_context = "ddmuk-1234"')
    expect(toml).toContain('trunk_branch = "main"')
  })

  test('without arg: prompts and selects first context alphabetically', async () => {
    await writeFile(join(dir, '.shpeck.toml'), 'trunk_branch = "main"\n', 'utf8')
    await mkdir(join(dir, '.spec', 'b-context'), { recursive: true })
    await mkdir(join(dir, '.spec', 'a-context'), { recursive: true })

    // Inquirer list prompts select the first choice by default; newline confirms.
    const { exitCode } = await runCommand(['bun', cliPath, 'switch'], {
      cwd: dir,
      stdin: '\n',
    })
    expect(exitCode).toBe(0)

    const toml = await readFile(join(dir, '.shpeck.toml'), 'utf8')
    expect(toml).toContain('active_context = "a-context"')
  })
})
