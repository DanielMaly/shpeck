import { join } from 'node:path'

import type { ToolStrategy } from './types'

export const claudeStrategy: ToolStrategy = {
  tool: 'claude',
  getToolDirLine(): string {
    return '.claude/'
  },
  getToolDirPath(repoRoot: string): string {
    return join(repoRoot, '.claude')
  },
  getRulesPlan(repoRoot: string) {
    return {
      rulesPath: join(repoRoot, '.claude', 'shpeck-rules.md'),
      localInstructionsPath: join(repoRoot, 'CLAUDE.local.md'),
      localInstructionsLine: '@.claude/shpeck-rules.md',
    }
  },
  getSettingsPath(repoRoot: string): string {
    return join(repoRoot, '.claude', 'settings.json')
  },
  getCommandDestPath(repoRoot: string, commandName: string): string {
    return join(repoRoot, '.claude', 'skills', commandName, 'SKILL.md')
  },
  getGitExcludeLines(): string[] {
    return ['.claude/', 'CLAUDE.local.md']
  },
}
