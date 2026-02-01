import { describe, expect, test } from 'bun:test'

import { claudeStrategy } from '../../src/strategies'

describe('claudeStrategy', () => {
  const root = '/repo'

  test('provides tool metadata and paths', () => {
    expect(claudeStrategy.tool).toBe('claude')
    expect(claudeStrategy.getToolDirLine()).toBe('.claude/')
    expect(claudeStrategy.getToolDirPath(root)).toBe('/repo/.claude')
  })

  test('provides rules plan', () => {
    expect(claudeStrategy.getRulesPlan(root)).toEqual({
      rulesPath: '/repo/.claude/shpeck-rules.md',
      localInstructionsPath: '/repo/CLAUDE.local.md',
      localInstructionsLine: '@.claude/shpeck-rules.md',
    })
  })

  test('provides settings and command destinations', () => {
    expect(claudeStrategy.getSettingsPath(root)).toBe('/repo/.claude/settings.json')
    expect(claudeStrategy.getCommandDestPath(root, 'shpeck-new', 'shpeck-new.md')).toBe(
      '/repo/.claude/skills/shpeck-new/SKILL.md'
    )
  })

  test('provides git exclude lines', () => {
    expect(claudeStrategy.getGitExcludeLines()).toEqual(['.claude/', 'CLAUDE.local.md'])
  })
})
