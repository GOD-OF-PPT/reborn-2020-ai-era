import { requireRule } from './errors.ts'

export type IsoDate = string

function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export function isoDate(value: unknown): IsoDate {
  requireRule(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'INVALID_DATE')
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  requireRule(year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month), 'INVALID_DATE')
  return value
}

function formatDate(year: number, month: number, day: number): IsoDate {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function addDays(value: IsoDate, count: number): IsoDate {
  isoDate(value)
  requireRule(Number.isSafeInteger(count) && count >= 0 && count <= 3_652_058, 'INVALID_DAY_COUNT')
  let year = Number(value.slice(0, 4))
  let month = Number(value.slice(5, 7))
  let day = Number(value.slice(8, 10))
  let remaining = count
  while (remaining > 0) {
    const restOfMonth = daysInMonth(year, month) - day
    if (remaining <= restOfMonth) {
      day += remaining
      break
    }
    remaining -= restOfMonth + 1
    day = 1
    month += 1
    if (month === 13) { month = 1; year += 1 }
    requireRule(year <= 9999, 'DATE_OUT_OF_RANGE')
  }
  return formatDate(year, month, day)
}

export function monthEnd(value: IsoDate): IsoDate {
  isoDate(value)
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  return formatDate(year, month, daysInMonth(year, month))
}

export function quarterOf(value: IsoDate): string {
  isoDate(value)
  return `${value.slice(0, 4)}-Q${Math.ceil(Number(value.slice(5, 7)) / 3)}`
}
