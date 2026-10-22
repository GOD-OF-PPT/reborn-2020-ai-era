import { requireRule } from './errors.ts'
import { canonicalJson } from './identity.ts'

export function assertJsonInput(value: unknown): void {
  let nodes = 0
  function visit(item: unknown, depth: number): void {
    nodes += 1
    requireRule(depth <= 32 && nodes <= 300000, 'JSON_LIMIT_EXCEEDED')
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return
    if (typeof item === 'number') { requireRule(Number.isFinite(item), 'INVALID_JSON_VALUE'); return }
    requireRule(typeof item === 'object' && item !== null, 'INVALID_JSON_VALUE')
    requireRule(Object.getOwnPropertySymbols(item).length === 0, 'INVALID_JSON_VALUE')
    const array = Array.isArray(item)
    requireRule(Object.getPrototypeOf(item) === (array ? Array.prototype : Object.prototype) || (!array && Object.getPrototypeOf(item) === null), 'INVALID_JSON_VALUE')
    const names = Object.getOwnPropertyNames(item).filter((name) => !array || name !== 'length')
    requireRule(names.length <= 100000 && (!array || names.length === item.length), 'JSON_LIMIT_EXCEEDED')
    for (const name of names) {
      requireRule(name !== '__proto__' && name !== 'constructor' && name !== 'prototype', 'INVALID_JSON_VALUE')
      if (array) requireRule(/^(0|[1-9]\d*)$/.test(name) && Number(name) < item.length, 'INVALID_JSON_VALUE')
      const descriptor = Object.getOwnPropertyDescriptor(item, name)
      requireRule(descriptor && 'value' in descriptor && descriptor.enumerable, 'INVALID_JSON_VALUE')
      visit(descriptor.value, depth + 1)
    }
  }
  visit(value, 0)
}

export function copyJson<T>(value: T): T { return JSON.parse(canonicalJson(value)) }
