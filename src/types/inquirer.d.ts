declare module 'inquirer' {
  export type PromptModule = {
    prompt<T extends Record<string, unknown> = Record<string, unknown>>(
      questions: unknown
    ): Promise<T>
  }

  const inquirer: PromptModule
  export default inquirer
}
