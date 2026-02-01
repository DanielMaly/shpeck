import { describe, expect, test } from 'bun:test'

import { ShpeckError } from '../../src/utils/errors'
import { parseToml, upsertTopLevelTomlString } from '../../src/utils/toml'

describe('toml', () => {
  test('upserts an existing top-level string key and preserves comments', () => {
    const input = `# header\ntrunk_branch = "main" # comment\nactive_context = "foo"\n\n[section]\nk = "v"\n`
    const out = upsertTopLevelTomlString(input, 'trunk_branch', 'develop')

    expect(out).toContain('# header')
    expect(out).toContain('trunk_branch = "develop" # comment')
    expect(out).toContain('active_context = "foo"')
    expect(out).toContain('[section]')
    expect(out).toContain('k = "v"')
  })

  test('appends missing key with correct newline handling', () => {
    const input = `trunk_branch = "main"`
    const out = upsertTopLevelTomlString(input, 'active_context', 'ddmuk-1234')
    expect(out).toBe(`trunk_branch = "main"\nactive_context = "ddmuk-1234"\n`)
  })

  test('parseToml throws ShpeckError with context', () => {
    expect(() => parseToml('a =', 'ctx.toml')).toThrow(ShpeckError)
    expect(() => parseToml('a =', 'ctx.toml')).toThrow('Invalid TOML (ctx.toml):')
  })
})
