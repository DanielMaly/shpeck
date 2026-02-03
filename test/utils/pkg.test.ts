import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, realpath, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { findPkgDirFrom } from '../../src/utils'
import { createTempDir, removeTempDir } from '../_helpers/tmp'

describe('findPkgDir', () => {
  let dir = ''

  beforeEach(async () => {
    dir = await realpath(await createTempDir())
  })

  afterEach(async () => {
    if (dir) await removeTempDir(dir)
  })

  test('finds pkg directory bounded by manifest search', async () => {
    const startDir = join(dir, 'a', 'b', 'c')
    await mkdir(startDir, { recursive: true })
    await mkdir(join(dir, 'pkg'))
    await writeFile(join(dir, 'package.json'), '{"name":"shpeck"}\n', 'utf8')

    const resolvedStart = await realpath(startDir)
    const found = await findPkgDirFrom(resolvedStart, dir)
    expect(found).toBe(join(dir, 'pkg'))
  })
})
