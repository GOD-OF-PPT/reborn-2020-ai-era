import { requireRule } from './errors.ts'

export const MONEY_LIMIT = 9_000_000_000_000
export type MoneyFen = number

export function money(value: unknown): MoneyFen {
  requireRule(typeof value === 'number' && Number.isSafeInteger(value), 'INVALID_MONEY')
  requireRule(value >= 0 && value <= MONEY_LIMIT, 'MONEY_OUT_OF_RANGE')
  return value
}

export function signedMoney(value: unknown): number {
  requireRule(typeof value === 'number' && Number.isSafeInteger(value), 'INVALID_MONEY')
  requireRule(Math.abs(value) <= MONEY_LIMIT, 'MONEY_OUT_OF_RANGE')
  return value
}

export function sumMoney(values: readonly number[], signed = false): number {
  const total = values.reduce((sum, value) => sum + BigInt(signedMoney(value)), 0n)
  requireRule(total >= BigInt(signed ? -MONEY_LIMIT : 0) && total <= BigInt(MONEY_LIMIT), 'MONEY_OUT_OF_RANGE')
  return Number(total)
}

export function cumulativeFee(previousBaseFen: number, addedBaseFen: number, basisPoints: number): number {
  money(previousBaseFen)
  money(addedBaseFen)
  requireRule(Number.isInteger(basisPoints) && basisPoints >= 0 && basisPoints <= 10000, 'INVALID_RATE')
  const total = sumMoney([previousBaseFen, addedBaseFen])
  const rounded = (base: number) => (BigInt(base) * BigInt(basisPoints) + 5000n) / 10000n
  return Number(rounded(total) - rounded(previousBaseFen))
}
