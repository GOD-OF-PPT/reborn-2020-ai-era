import { describe, expect, it } from 'vitest'
import { createRandom, drawRandom, stepXoshiro, type RandomWords } from './random.ts'

describe('versioned game randomness', () => {
  it('matches the reviewed C reference vector with unsigned 32-bit arithmetic', () => {
    const initial = [1, 2, 3, 4] as const
    const first = stepXoshiro(initial)
    expect(first).toEqual({ value: 11520, words: [7, 0, 1026, 12288] })
    let words: RandomWords = initial
    const values: number[] = []
    for (let i = 0; i < 8; i += 1) {
      const next = stepXoshiro(words)
      words = next.words
      values.push(next.value)
    }
    expect(values).toEqual([11520, 0, 5927040, 70819200, 2031721883, 1637235492, 1287239034, 3734860849])
    expect(initial).toEqual([1, 2, 3, 4])
  })

  it('derives independent domains and resumes the exact stream from serialized state', () => {
    const initial = createRandom('same-seed')
    const market = drawRandom(initial, 'market')
    const irrelevant = drawRandom(initial, 'opportunity')
    expect(drawRandom(irrelevant.random, 'market')).toEqual({ value: market.value, random: { ...market.random, streams: { ...market.random.streams, opportunity: irrelevant.random.streams.opportunity } } })
    expect(drawRandom(JSON.parse(JSON.stringify(market.random)), 'market')).toEqual(drawRandom(market.random, 'market'))
    expect(initial.streams.market.draws).toBe(0)
    expect(createRandom('same-seed')).toEqual(initial)
    expect(createRandom('other-seed')).not.toEqual(initial)
  })
})
