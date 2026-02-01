import { describe, expect, test } from 'bun:test'

import { isPlainObject } from '../../src/utils'

describe('isPlainObject', () => {
  test('accepts plain objects', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1 })).toBe(true)
    expect(isPlainObject(Object.create(null) as object)).toBe(true)
  })

  test('rejects arrays and non-plain objects', () => {
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject(() => {})).toBe(false)
    expect(isPlainObject(null)).toBe(false)
  })
})
