import { requireRule } from './errors.ts'

export function identifier(value: unknown): string {
  requireRule(typeof value === 'string' && value.length <= 512 && /^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(value), 'INVALID_ID')
  return value
}

export function canonicalJson(value: unknown, depth = 0): string {
  requireRule(depth <= 32, 'INVALID_PAYLOAD')
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    requireRule(Number.isFinite(value), 'INVALID_PAYLOAD')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item, depth + 1)).join(',')}]`
  requireRule(typeof value === 'object' && value !== null, 'INVALID_PAYLOAD')
  const prototype = Object.getPrototypeOf(value)
  requireRule(prototype === Object.prototype || prototype === null, 'INVALID_PAYLOAD')
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(Reflect.get(value, key), depth + 1)}`).join(',')}}`
}
