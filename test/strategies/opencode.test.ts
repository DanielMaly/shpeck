import { describe, expect, test } from 'bun:test'

import { opencodeStrategy } from '../../src/strategies'

describe('opencodeStrategy', () => {
  const root = '/repo'

  test('provides tool metadata and paths', () => {
    expect(opencodeStrategy.tool).toBe('opencode')
    expect(opencodeStrategy.getToolDirLine()).toBe('.opencode/')
    expect(opencodeStrategy.getToolDirPath(root)).toBe('/repo/.opencode')
  })

  test('provides rules plan', () => {
    expect(opencodeStrategy.getRulesPlan(root)).toEqual({
      rulesPath: '/repo/.opencode/shpeck-rules.md',
    })
  })

  test('provides settings and command destinations', () => {
    expect(opencodeStrategy.getSettingsPath(root)).toBe('/repo/.opencode/opencode.json')
    expect(opencodeStrategy.getCommandDestPath(root, 'shpeck-new', 'shpeck-new.md')).toBe(
      '/repo/.opencode/commands/shpeck-new.md'
    )
  })

  test('provides git exclude lines', () => {
    expect(opencodeStrategy.getGitExcludeLines()).toEqual(['.opencode/'])
  })
})
