import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { runCommand } from './_helpers/exec'

const repoRoot = path.resolve(import.meta.dir, '..')
const cliPath = path.join(repoRoot, 'bin', 'shpeck.ts')

describe('cli smoke', () => {
  it('renders help output', async () => {
    const { exitCode, stdout } = await runCommand(['bun', cliPath, '--help'], {
      cwd: repoRoot,
    })

    expect(exitCode).toBe(0)
    expect(stdout).toContain('Usage: shpeck')
  })

  it('fails on unknown command', async () => {
    const { exitCode, stderr } = await runCommand(['bun', cliPath, 'nope'], {
      cwd: repoRoot,
      allowNonZeroExit: true,
    })

    expect(exitCode).toBeGreaterThan(0)
    expect(stderr.length).toBeGreaterThan(0)
  })

  it('fails if init is called without --tool', async () => {
    const { exitCode, stderr } = await runCommand(['bun', cliPath, 'init'], {
      cwd: repoRoot,
      allowNonZeroExit: true,
    })

    expect(exitCode).toBeGreaterThan(0)
    expect(stderr).toContain("required option '--tool <name>' not specified")
  })
})
