/// <reference types="bun-types" />

export async function runCommand(
  argv: string[],
  opts: { cwd: string; allowNonZeroExit?: boolean; stdin?: string }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(argv, {
    cwd: opts.cwd,
    ...(opts.stdin ? { stdin: 'pipe' } : {}),
    stdout: 'pipe',
    stderr: 'pipe',
  })

  if (opts.stdin) {
    proc.stdin.write(opts.stdin)
    proc.stdin.end()
  }

  const stdoutPromise = new Response(proc.stdout).text()
  const stderrPromise = new Response(proc.stderr).text()
  const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise])
  const exitCode = await proc.exited

  if (exitCode !== 0 && !opts.allowNonZeroExit) {
    throw new Error(`Command failed (exit ${exitCode}): ${argv.join(' ')}\n${stderr.trim()}`)
  }

  return { exitCode, stdout, stderr }
}
