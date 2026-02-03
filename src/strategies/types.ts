import type { ToolChoice } from '../types/tool-choice'

export type RuleInstallPlan = {
  rulesPath: string
  localInstructionsPath?: string
  localInstructionsLine?: string
}

export interface ToolStrategy {
  readonly tool: ToolChoice
  getToolDirLine(): string
  getToolDirPath(repoRoot: string): string
  getRulesPlan(repoRoot: string): RuleInstallPlan
  getSettingsPath(repoRoot: string): string
  getCommandDestPath(repoRoot: string, commandName: string, fileName: string): string
  getGitExcludeLines(): string[]
}
