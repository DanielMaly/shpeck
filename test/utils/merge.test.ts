import { describe, expect, test } from 'bun:test'

import { deepMerge } from '../../src/utils'

describe('deepMerge', () => {
  test('keeps target scalar when defined', () => {
    expect(deepMerge('a', 'b')).toBe('a')
    expect(deepMerge(0, 1)).toBe(0)
    expect(deepMerge(false, true)).toBe(false)
    expect(deepMerge(null, 'x')).toBeNull()
  })

  test('uses source when target is undefined', () => {
    expect(deepMerge<string | undefined>(undefined, 'b')).toBe('b')
    expect(deepMerge<Record<string, unknown> | undefined>(undefined, { a: 1 })).toEqual({ a: 1 })
    expect(deepMerge<unknown[] | undefined>(undefined, [1, 2])).toEqual([1, 2])
  })

  test('recursively merges objects and preserves target scalars', () => {
    const target: Record<string, unknown> = {
      a: 1,
      b: {
        keep: 't',
        add: 't',
      },
    }
    const source: Record<string, unknown> = {
      a: 999,
      b: {
        keep: 's',
        newKey: 's',
      },
      c: 3,
    }

    expect(deepMerge(target, source)).toEqual({
      a: 1,
      b: {
        keep: 't',
        add: 't',
        newKey: 's',
      },
      c: 3,
    })
  })

  test('concats arrays and dedupes primitives (preserve first occurrence)', () => {
    expect(deepMerge([1, 2], [2, 3, 1])).toEqual([1, 2, 3])
    expect(deepMerge(['a'], ['a', 'b'])).toEqual(['a', 'b'])
  })

  test('dedupes array objects by deep equality (preserve target order)', () => {
    const target = [{ a: 1 }, { a: 2 }]
    const source = [{ a: 1 }, { a: 3 }, { a: 2 }]
    expect(deepMerge(target, source)).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }])
  })

  test('merges nested arrays inside objects', () => {
    const target = { watcher: { ignore: ['.spec/**'] } }
    const source = { watcher: { ignore: ['.spec/**', 'dist/**'] } }
    expect(deepMerge(target, source)).toEqual({ watcher: { ignore: ['.spec/**', 'dist/**'] } })
  })
})
