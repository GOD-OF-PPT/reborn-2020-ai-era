import { describe, expect, it } from 'vitest'
import { addDays, isoDate, monthEnd, quarterOf } from './calendar.ts'

describe('calendar dates', () => {
  it('advances leap days and quarter/year boundaries without a local clock', () => {
    expect(addDays('2020-02-28', 1)).toBe('2020-02-29')
    expect(addDays('2020-02-29', 1)).toBe('2020-03-01')
    expect(addDays('2020-12-31', 1)).toBe('2021-01-01')
    expect(monthEnd('2020-02-01')).toBe('2020-02-29')
    expect(quarterOf('2020-04-01')).toBe('2020-Q2')
    expect(() => isoDate('2021-02-29')).toThrow('INVALID_DATE')
    expect(() => isoDate('2020-01-01T00:00:00Z')).toThrow('INVALID_DATE')
  })

  it('applies Gregorian century rules and refuses overflowing years', () => {
    expect(addDays('1900-02-28', 1)).toBe('1900-03-01')
    expect(addDays('2000-02-28', 1)).toBe('2000-02-29')
    expect(() => addDays('9999-12-31', 1)).toThrow('DATE_OUT_OF_RANGE')
    expect(() => addDays('2020-01-01', -1)).toThrow('INVALID_DAY_COUNT')
  })

  it.each(['0000-01-01', '2020-13-01', '2020-00-01', '2020-04-31', true])('rejects invalid calendar input %s', (value) => {
    expect(() => isoDate(value)).toThrow('INVALID_DATE')
  })
})
