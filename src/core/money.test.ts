import { describe, expect, it } from 'vitest'
import { cumulativeFee, money, sumMoney } from './money.ts'

describe('integer money', () => {
  it('calculates a fee at the money limit without a floating point product', () => {
    expect(cumulativeFee(0, 9_000_000_000_000, 9999)).toBe(8_999_100_000_000)
  })

  it.each([true, false, 0.5, NaN, Infinity, -1, 9_000_000_000_001])('rejects invalid or out-of-range money %s', (value) => {
    expect(() => money(value)).toThrow()
  })

  it('rounds one obligation cumulatively rather than paying extra for split charges', () => {
    expect(cumulativeFee(0, 1, 5000) + cumulativeFee(1, 1, 5000)).toBe(1)
    expect(() => sumMoney([9_000_000_000_000, 1])).toThrow('MONEY_OUT_OF_RANGE')
  })

  it.each([-1, 10001, 0.5, NaN])('rejects invalid basis points %s', (rate) => {
    expect(() => cumulativeFee(0, 100, rate)).toThrow('INVALID_RATE')
  })
})
