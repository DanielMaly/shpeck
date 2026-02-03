export const TOOL_CHOICES = ['opencode', 'claude'] as const

export type ToolChoice = (typeof TOOL_CHOICES)[number]

export function isToolChoice(value: string): value is ToolChoice {
  return TOOL_CHOICES.includes(value as ToolChoice)
}
