import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, writeFile, utimes } from 'node:fs/promises'
import { join } from 'node:path'

import { getRecursiveMtimeMs, walkFilesRecursive } from '../../src/utils'
import { createTempDir, removeTempDir } from '../_helpers/tmp'

describe('fs', () => {
  let dir = ''

  beforeEach(async () => {
    dir = await createTempDir()
  })

  afterEach(async () => {
    if (dir) await removeTempDir(dir)
  })

  test('walkFilesRecursive yields all files under the directory', async () => {
    const a = join(dir, 'a.txt')
    const bDir = join(dir, 'b')
    const b = join(bDir, 'b.txt')
    const cDir = join(bDir, 'c')
    const c = join(cDir, 'c.txt')

    await mkdir(cDir, { recursive: true })
    await writeFile(a, 'a', 'utf8')
    await writeFile(b, 'b', 'utf8')
    await writeFile(c, 'c', 'utf8')

    const got: string[] = []
    for await (const p of walkFilesRecursive(dir)) got.push(p)

    expect(new Set(got)).toEqual(new Set([a, b, c]))
  })

  test('getRecursiveMtimeMs returns the latest mtimeMs', async () => {
    const older = join(dir, 'older.txt')
    const newerDir = join(dir, 'nested')
    const newer = join(newerDir, 'newer.txt')

    await mkdir(newerDir, { recursive: true })
    await writeFile(older, 'older', 'utf8')
    await writeFile(newer, 'newer', 'utf8')

    const now = Date.now()
    const olderTime = new Date(now - 10_000)
    const newerTime = new Date(now - 5_000)

    await utimes(older, olderTime, olderTime)
    await utimes(newer, newerTime, newerTime)

    const latest = await getRecursiveMtimeMs(dir)
    expect(latest).toBeGreaterThanOrEqual(newerTime.getTime())
    expect(latest).toBeLessThan(newerTime.getTime() + 2_000)
  })
})
