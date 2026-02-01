import type { ToolChoice } from '../types/tool-choice'

export { claudeStrategy } from './claude'
export { opencodeStrategy } from './opencode'
import { claudeStrategy } from './claude'
import { opencodeStrategy } from './opencode'
import type { ToolStrategy } from './types'

const STRATEGIES: Record<ToolChoice, ToolStrategy> = {
  opencode: opencodeStrategy,
  claude: claudeStrategy,
}

export function getToolStrategy(tool: ToolChoice): ToolStrategy {
  return STRATEGIES[tool]
}

export type { ToolStrategy, RuleInstallPlan } from './types'
