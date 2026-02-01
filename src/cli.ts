import { Command, CommanderError } from 'commander'
import { runInit } from './commands/init'
import { runStatus } from './commands/status'
import { runSwitch } from './commands/switch'
import { type ToolChoice, isToolChoice } from './types/tool-choice'
import { GitError, ShpeckError, toErrorMessage } from './utils'

function normalizeTool(value: string): ToolChoice {
  const normalized = value.toLowerCase()
  if (isToolChoice(normalized)) {
    return normalized
  }
  throw new ShpeckError(`Invalid tool "${value}". Expected "opencode" or "claude".`)
}

export async function main(argv: string[]): Promise<void> {
  const program = new Command()
  program
    .name('shpeck')
    .description('Spec-Driven Development workflow CLI')
    .showHelpAfterError()
    .showSuggestionAfterError()

  program
    .command('init')
    .description('Initialize Shpeck in the current repo')
    .requiredOption('--tool <name>', 'Tool to install (opencode|claude)')
    .option('--trunk <branch>', 'Trunk branch name')
    .option('--replace', 'Overwrite existing tool files without prompt', false)
    .action(async (options) => {
      const tool = normalizeTool(options.tool)
      await runInit({
        tool,
        trunk: options.trunk,
        replace: Boolean(options.replace),
      })
    })

  program
    .command('switch')
    .description('Switch active context')
    .argument('[context_name]', 'Context name to activate')
    .action(async (contextName) => {
      await runSwitch(contextName)
    })

  program
    .command('status')
    .description('Show Shpeck status')
    .option('--all', 'List all contexts', false)
    .action(async (options) => {
      await runStatus({ all: Boolean(options.all) })
    })

  program.exitOverride()

  try {
    await program.parseAsync(argv)
  } catch (err) {
    if (
      err instanceof CommanderError &&
      (err.code === 'commander.helpDisplayed' || err.code === 'commander.version')
    ) {
      return
    }

    if (err instanceof ShpeckError || err instanceof GitError) {
      console.error(`\x1b[31m${err.message}\x1b[0m`)
      process.exit(err.exitCode || 1)
    }

    if (err instanceof Error) {
      console.error(err.stack ?? err.message)
      process.exit(1)
    }

    console.error(toErrorMessage(err))
    process.exit(1)
  }
}
