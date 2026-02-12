import { describe, expect, test } from 'bun:test'

import { applyFrontmatter, parseMarkdownWithFrontmatter } from '../../src/utils'

describe('frontmatter', () => {
  test('parses existing frontmatter', () => {
    const input = '---\ndescription: Hello\n---\n\n# Title\n'
    const parsed = parseMarkdownWithFrontmatter(input)

    expect(parsed.hasFrontmatter).toBe(true)
    expect(parsed.data).toEqual({ description: 'Hello' })
    expect(parsed.content).toContain('# Title')
  })

  test('parses markdown without frontmatter', () => {
    const input = '# Title\n'
    const parsed = parseMarkdownWithFrontmatter(input)
    expect(parsed.hasFrontmatter).toBe(false)
    expect(parsed.data).toEqual({})
    expect(parsed.content).toBe(input)
  })

  test('applies tool frontmatter and overrides existing keys', () => {
    const input = '---\ndescription: A\nkeep: true\n---\n\n# Body\n'
    const out = applyFrontmatter(input, { description: 'B', custom: 'value' })

    expect(out).toContain('description: B')
    expect(out).toContain('keep: true')
    expect(out).toContain('custom: value')
    expect(out).toContain('# Body')
  })

  test('returns raw content when merged frontmatter is empty', () => {
    const input = '# Body\n'
    expect(applyFrontmatter(input, null)).toBe(input)
    expect(applyFrontmatter(input, {})).toBe(input)
  })
})
