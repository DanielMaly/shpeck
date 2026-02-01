import deepEqual from 'fast-deep-equal'

import { isPlainObject } from './object'

function dedupeArray(values: unknown[]): unknown[] {
  const out: unknown[] = []
  for (const v of values) {
    const exists = out.some((x) => {
      const a = x as unknown
      const b = v as unknown
      if (typeof a !== 'object' || a === null) return a === b
      if (typeof b !== 'object' || b === null) return false
      return deepEqual(a, b)
    })
    if (!exists) out.push(v)
  }
  return out
}

// Deep-merge rules (meta/project-spec.md §7.3.3)
// - Object: recursively merge child keys
// - Array: concat target+source, then dedupe (preserve first occurrence)
// - Scalar: target wins if defined; otherwise source
export function deepMerge<TTarget>(target: TTarget, source: unknown): TTarget {
  if (Array.isArray(target) && Array.isArray(source)) {
    return dedupeArray([...(target as unknown[]), ...(source as unknown[])]) as TTarget
  }

  if (isPlainObject(target) && isPlainObject(source)) {
    const out: Record<string, unknown> = { ...(target as Record<string, unknown>) }
    for (const [k, v] of Object.entries(source)) {
      if (k in out) {
        out[k] = deepMerge(out[k], v)
      } else {
        out[k] = v
      }
    }
    return out as TTarget
  }

  // Scalars and mismatched types
  return (target !== undefined ? target : (source as TTarget)) as TTarget
}
