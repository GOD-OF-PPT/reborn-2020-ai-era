import { describe, expect, it } from 'vitest'
import { hashText, hashValue } from './hash.ts'

describe('canonical payload hashes', () => {
  it('uses SHA256 and ignores object key insertion order without ignoring values', () => {
    expect(hashText('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(hashValue({ b: 2, a: 1 })).toBe(hashValue({ a: 1, b: 2 }))
    expect(hashValue({ a: 2, b: 2 })).not.toBe(hashValue({ a: 1, b: 2 }))
  })
})
