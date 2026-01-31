import { ShpeckError } from "./errors";

export type GitRunOptions = {
  cwd?: string;
  allowNonZeroExit?: boolean;
};

export type GitRunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export class GitError extends ShpeckError {
  readonly args: string[];
  readonly cwd: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;

  constructor(params: {
    args: string[];
    cwd: string;
    exitCode: number;
    stdout: string;
    stderr: string;
  }) {
    const { args, cwd, exitCode, stdout, stderr } = params;
    const details = [
      `git ${args.join(" ")}`,
      `cwd: ${cwd}`,
      `exit: ${exitCode}`,
      stderr.trim() ? `stderr: ${stderr.trim()}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    super(details, exitCode || 1);
    this.name = "GitError";
    this.args = args;
    this.cwd = cwd;
    this.exitCode = exitCode;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

export async function runGit(args: string[], opts: GitRunOptions = {}): Promise<GitRunResult> {
  const cwd = opts.cwd ?? process.cwd();
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0 && !opts.allowNonZeroExit) {
    throw new GitError({ args, cwd, exitCode, stdout, stderr });
  }

  return { exitCode, stdout, stderr };
}
