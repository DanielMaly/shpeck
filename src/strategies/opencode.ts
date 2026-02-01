import { join } from 'node:path'

import type { ToolStrategy } from './types'

export const opencodeStrategy: ToolStrategy = {
  tool: 'opencode',
  getToolDirLine(): string {
    return '.opencode/'
  },
  getToolDirPath(repoRoot: string): string {
    return join(repoRoot, '.opencode')
  },
  getRulesPlan(repoRoot: string) {
    return {
      rulesPath: join(repoRoot, '.opencode', 'shpeck-rules.md'),
    }
  },
  getSettingsPath(repoRoot: string): string {
    return join(repoRoot, '.opencode', 'opencode.json')
  },
  getCommandDestPath(repoRoot: string, _commandName: string, fileName: string): string {
    return join(repoRoot, '.opencode', 'commands', fileName)
  },
  getGitExcludeLines(): string[] {
    return ['.opencode/']
  },
}
