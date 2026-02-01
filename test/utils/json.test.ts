import { describe, expect, test } from 'bun:test'

import { ShpeckError } from '../../src/utils/errors'
import { parseJson, stringifyJson } from '../../src/utils/json'

describe('json', () => {
  test('stringifyJson formats with 2 spaces and trailing newline', () => {
    const out = stringifyJson({ a: 1, b: [2] })
    expect(out.endsWith('\n')).toBe(true)
    expect(out).toContain('\n  "a": 1')
    expect(out).toContain('\n  "b": [')
    expect(out).toContain('\n    2')
  })

  test('parseJson throws ShpeckError with context', () => {
    expect(() => parseJson('{', 'ctx.json')).toThrow(ShpeckError)
    expect(() => parseJson('{', 'ctx.json')).toThrow('Invalid JSON (ctx.json):')
  })
})
