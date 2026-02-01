export async function main(argv: string[]): Promise<void> {
  const args = argv.slice(2)
  const command = args[0]

  if (!command || command === '-h' || command === '--help') {
    console.log('shpeck (scaffold)')
    console.log('')
    console.log('Commands: init, switch, status')
    console.log('')
    console.log('Note: command behavior is not implemented yet.')
    return
  }

  console.error(`shpeck: command not implemented: ${command}`)
  process.exitCode = 1
}
