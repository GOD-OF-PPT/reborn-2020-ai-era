import { requireRule } from './errors.ts'
import { hashValue } from './hash.ts'

export type RandomWords = readonly [number, number, number, number]
export const RNG_ALGORITHM = 'xoshiro128ss-1.1-sha256-be32-v1'
export const RANDOM_DOMAINS = ['world', 'market', 'opportunity', 'crisis'] as const
export type RandomDomain = typeof RANDOM_DOMAINS[number]
export interface RandomStream { readonly words: RandomWords; readonly draws: number }
export interface RandomState {
  readonly algorithm: typeof RNG_ALGORITHM
  readonly streams: Readonly<Record<RandomDomain, RandomStream>>
}

export function assertRandomWords(words: RandomWords): void {
  requireRule(words.length === 4 && words.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffffffff) && words.some((word) => word !== 0), 'INVALID_RANDOM_STATE')
}

function rotate(value: number, bits: number): number { return ((value << bits) | (value >>> (32 - bits))) >>> 0 }

/** xoshiro128** 1.1; reference: https://prng.di.unimi.it/xoshiro128starstar.c */
export function stepXoshiro(words: RandomWords): { readonly value: number; readonly words: RandomWords } {
  assertRandomWords(words)
  let [a, b, c, d] = words
  const value = Math.imul(rotate(Math.imul(b, 5) >>> 0, 7), 9) >>> 0
  const shifted = (b << 9) >>> 0
  c = (c ^ a) >>> 0
  d = (d ^ b) >>> 0
  b = (b ^ c) >>> 0
  a = (a ^ d) >>> 0
  c = (c ^ shifted) >>> 0
  d = rotate(d, 11)
  return { value, words: [a, b, c, d] }
}

export function createRandom(seed: string): RandomState {
  requireRule(typeof seed === 'string' && seed.length > 0 && seed.length <= 256, 'INVALID_SEED')
  const stream = (domain: RandomDomain): RandomStream => {
    const digest = hashValue([RNG_ALGORITHM, seed, domain])
    const word = (offset: number) => Number.parseInt(digest.slice(offset, offset + 8), 16)
    const words: RandomWords = [word(0), word(8), word(16), word(24)]
    return { words: words.some((word) => word !== 0) ? words : [0, 0, 0, 1], draws: 0 }
  }
  return { algorithm: RNG_ALGORITHM, streams: { world: stream('world'), market: stream('market'), opportunity: stream('opportunity'), crisis: stream('crisis') } }
}

export function assertRandom(random: RandomState): void {
  requireRule(random.algorithm === RNG_ALGORITHM, 'UNSUPPORTED_RNG_VERSION')
  for (const domain of RANDOM_DOMAINS) {
    assertRandomWords(random.streams[domain].words)
    requireRule(Number.isSafeInteger(random.streams[domain].draws) && random.streams[domain].draws >= 0, 'INVALID_RANDOM_COUNTER')
  }
}

export function drawRandom(random: RandomState, domain: RandomDomain): { readonly value: number; readonly random: RandomState } {
  assertRandom(random)
  requireRule(RANDOM_DOMAINS.includes(domain), 'INVALID_RANDOM_DOMAIN')
  const stream = random.streams[domain]
  requireRule(stream.draws < Number.MAX_SAFE_INTEGER, 'RANDOM_COUNTER_EXHAUSTED')
  const next = stepXoshiro(stream.words)
  return { value: next.value, random: { ...random, streams: { ...random.streams, [domain]: { words: next.words, draws: stream.draws + 1 } } } }
}
