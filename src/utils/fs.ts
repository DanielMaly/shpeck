import { mkdir, readdir, lstat, readFile, writeFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

export async function readTextFile(path: string): Promise<string> {
  return await readFile(path, 'utf8')
}

export async function readTextFileIfExists(path: string): Promise<string | null> {
  if (!(await pathExists(path))) return null
  return await readTextFile(path)
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await writeFile(path, content, 'utf8')
}

export async function* walkFilesRecursive(rootDir: string): AsyncGenerator<string> {
  const entries = await readdir(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name)
    if (entry.isDirectory()) {
      yield* walkFilesRecursive(fullPath)
      continue
    }
    yield fullPath
  }
}

export async function getRecursiveMtimeMs(rootDir: string): Promise<number> {
  let latest = 0
  for await (const filePath of walkFilesRecursive(rootDir)) {
    const st = await lstat(filePath)
    latest = Math.max(latest, st.mtimeMs)
  }
  return latest
}
