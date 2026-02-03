import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ShpeckError } from './errors'
import { pathExists } from './fs'

export async function findPkgDirFrom(startDir: string, limitDir?: string | null): Promise<string> {
  let current = startDir

  while (true) {
    const candidate = join(current, 'pkg')
    if (await pathExists(candidate)) return candidate

    if (limitDir && current === limitDir) break
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }

  throw new ShpeckError(
    'Could not locate shpeck package assets (missing pkg/ directory in installed package)'
  )
}

export async function findPkgDir(): Promise<string> {
  // Start from this file location and walk up until we find pkg/.
  // This works in both dev (repo) and installed-package layouts.
  const startDir = dirname(fileURLToPath(import.meta.url))
  return await findPkgDirFrom(startDir)
}
