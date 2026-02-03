import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { runCommand } from './_helpers/exec'
import { createTempDir, removeTempDir } from './_helpers/tmp'

const repoRoot = join(import.meta.dir, '..')
const cliPath = join(repoRoot, 'bin', 'shpeck.ts')

describe('shpeck init (integration)', () => {
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

  test('enforces repo root precondition', async () => {
    const subdir = join(dir, 'sub')
    await mkdir(subdir)

    const { exitCode, stderr } = await runCommand(['bun', cliPath, 'init', '--tool', 'opencode'], {
      cwd: subdir,
      allowNonZeroExit: true,
    })

    expect(exitCode).toBeGreaterThan(0)
    expect(stderr).toContain('Command must run in repo root.')
  })

  test('creates protected paths and excludes (and installs opencode assets)', async () => {
    const { exitCode } = await runCommand(['bun', cliPath, 'init', '--tool', 'opencode'], {
      cwd: dir,
    })
    expect(exitCode).toBe(0)

    // protected paths
    const toml = await readFile(join(dir, '.shpeck.toml'), 'utf8')
    expect(toml).toContain('trunk_branch = "main"')
    expect(toml).not.toContain('active_context')

    const conventions = await readFile(join(dir, '.spec', '.global', 'conventions.md'), 'utf8')
    expect(conventions).toContain('# Codebase Conventions')

    // tool assets
    const rules = await readFile(join(dir, '.opencode', 'shpeck-rules.md'), 'utf8')
    expect(rules).toContain('## TODO Discipline (NON-NEGOTIABLE)')

    const cmd = await readFile(join(dir, '.opencode', 'commands', 'shpeck-new.md'), 'utf8')
    expect(cmd).toContain('agent: shpeck')

    const settings = await readFile(join(dir, '.opencode', 'opencode.json'), 'utf8')
    expect(settings).toContain('"$schema"')

    // git exclude
    const exclude = await readFile(join(dir, '.git', 'info', 'exclude'), 'utf8')
    expect(exclude).toContain('.spec/')
    expect(exclude).toContain('.shpeck.toml')
    expect(exclude).toContain('.opencode/')
  })

  test('installs claude assets in expected locations', async () => {
    const { exitCode } = await runCommand(['bun', cliPath, 'init', '--tool', 'claude'], {
      cwd: dir,
    })
    expect(exitCode).toBe(0)

    const rules = await readFile(join(dir, '.claude', 'shpeck-rules.md'), 'utf8')
    expect(rules).toContain('## TODO Discipline (NON-NEGOTIABLE)')

    const localMd = await readFile(join(dir, 'CLAUDE.local.md'), 'utf8')
    expect(localMd).toContain('@.claude/shpeck-rules.md')

    const skill = await readFile(join(dir, '.claude', 'skills', 'shpeck-new', 'SKILL.md'), 'utf8')
    expect(skill).toContain('disable-model-invocation: true')

    const settings = await readFile(join(dir, '.claude', 'settings.json'), 'utf8')
    expect(settings).toContain('"permissions"')
    expect(settings).toContain('Bash(rm -rf .spec:*)')

    const exclude = await readFile(join(dir, '.git', 'info', 'exclude'), 'utf8')
    expect(exclude).toContain('.claude/')
    expect(exclude).toContain('CLAUDE.local.md')
  })

  test('updates trunk_branch only when --trunk is provided', async () => {
    await runCommand(['bun', cliPath, 'init', '--tool', 'opencode', '--trunk', 'trunk'], {
      cwd: dir,
    })

    const a = await readFile(join(dir, '.shpeck.toml'), 'utf8')
    expect(a).toContain('trunk_branch = "trunk"')

    // should not change without --trunk
    await runCommand(['bun', cliPath, 'init', '--tool', 'opencode', '--replace'], { cwd: dir })
    const b = await readFile(join(dir, '.shpeck.toml'), 'utf8')
    expect(b).toContain('trunk_branch = "trunk"')
  })

  test('without --replace, declines overwrite prompt and does not change tool assets', async () => {
    await runCommand(['bun', cliPath, 'init', '--tool', 'opencode'], { cwd: dir })

    const sentinelPath = join(dir, '.opencode', 'commands', 'shpeck-new.md')
    await writeFile(sentinelPath, 'SENTINEL\n', 'utf8')

    const { exitCode } = await runCommand(['bun', cliPath, 'init', '--tool', 'opencode'], {
      cwd: dir,
      // respond "no" to overwrite prompt
      stdin: 'n\n',
    })
    expect(exitCode).toBe(0)

    const after = await readFile(sentinelPath, 'utf8')
    expect(after).toBe('SENTINEL\n')
  })

  test('--replace overwrites non-settings files and merges settings', async () => {
    await runCommand(['bun', cliPath, 'init', '--tool', 'opencode'], { cwd: dir })

    const settingsPath = join(dir, '.opencode', 'opencode.json')
    await writeFile(
      settingsPath,
      `${JSON.stringify({ instructions: ['custom.md'], scalar: 'keep', watcher: { ignore: [] } }, null, 2)}\n`,
      'utf8'
    )

    const cmdPath = join(dir, '.opencode', 'commands', 'shpeck-new.md')
    await writeFile(cmdPath, 'SENTINEL\n', 'utf8')

    await runCommand(['bun', cliPath, 'init', '--tool', 'opencode', '--replace'], { cwd: dir })

    // non-settings overwritten
    const cmd = await readFile(cmdPath, 'utf8')
    expect(cmd).not.toBe('SENTINEL\n')

    // settings merged (preserve existing scalars and array items)
    const settings = JSON.parse(await readFile(settingsPath, 'utf8')) as Record<string, unknown>
    const settingsWatcher = settings.watcher as Record<string, unknown>
    expect(settings.scalar).toBe('keep')
    expect(settings.instructions).toEqual(['custom.md', '.opencode/shpeck-rules.md'])
    expect(settingsWatcher.ignore).toEqual(['.spec/**'])
  })
})
