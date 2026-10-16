import { describe, expect, it } from 'vitest'
import { advanceEconomicTime } from './economic-time.ts'
import { applyLedger, accountFunds, accountPosition, createLedger } from './ledger.ts'
import { actionBudget, applyEconomy, createEconomy, type EconomyOperation } from './economy.ts'
import { acknowledgePause, createTimeline, queueEvent } from './timeline.ts'
import { runQ01Accounting } from '../testing/q01-accounting.ts'

describe('economic time integration', () => {
  it('pauses before a future salary can cover an earlier gap and keeps the debt on resume (Q03)', () => {
    const ledger = applyLedger(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01'), { id: 'opening', date: '2020-01-01', sourceEventId: 'fixture', kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen: 100_000 })
    let timeline = createTimeline<EconomyOperation>('2020-01-01')
    timeline = queueEvent(timeline, { instanceId: 'living', date: '2020-01-01', phase: 'due_obligations', priority: 0, payload: { id: 'living', date: '2020-01-01', sourceEventId: 'fixture', kind: 'due_expense', accountId: 'personal', counterpartyId: 'world', obligationId: 'living-due', amountFen: 400_000 } })
    timeline = queueEvent(timeline, { instanceId: 'salary', date: '2020-01-31', phase: 'certain_receipts', priority: 0, payload: { id: 'salary', date: '2020-01-31', sourceEventId: 'fixture', kind: 'income', accountId: 'personal', counterpartyId: 'world', amountFen: 800_000 } })
    const paused = advanceEconomicTime(timeline, createEconomy(ledger), { date: '2020-01-31' })
    expect(paused.status).toBe('paused')
    expect(paused.timeline.cursor.date).toBe('2020-01-01')
    expect(accountFunds(paused.state.ledger, 'personal').cashFen).toBe(100_000)
    const resumed = advanceEconomicTime(acknowledgePause(paused.timeline, 'living'), paused.state, { date: '2020-01-31' })
    expect(accountFunds(resumed.state.ledger, 'personal').cashFen).toBe(900_000)
    expect(resumed.state.ledger.obligations[0]?.remainingFen).toBe(400_000)
    expect(resumed.state.asOf).toBe('2020-01-31')
  })

  it('executes the Q01 accounting sequence by actual dates and keeps investment value separate', () => {
    const result = runQ01Accounting()
    expect(result.cashTrace.map((item) => item.cashFen)).toEqual([2_600_000, 2_300_000, 1_100_000, 1_900_000, 1_500_000, 2_300_000, 1_900_000, 2_700_000])
    expect(Math.min(...result.cashTrace.map((item) => item.cashFen))).toBe(1_100_000)
    expect(accountPosition(result.state.ledger, 'personal')).toMatchObject({ cashFen: 2_700_000, investmentValueFen: 1_100_000, netAssetsFen: 3_800_000 })
    expect(actionBudget(result.state, '2020-03-31')).toMatchObject({ spent: 4, available: 0 })
    expect(result.state.actions.every((item) => item.status === 'completed')).toBe(true)
    expect(runQ01Accounting()).toEqual(result)
    expect(advanceEconomicTime(result.timeline, result.state, { date: '2020-03-31' }).state).toEqual(result.state)
  })

  it('rejects an event that tries to post a future operation at an earlier checkpoint', () => {
    const ledger = createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01')
    const timeline = queueEvent(createTimeline<EconomyOperation>('2020-01-01'), { instanceId: 'future-cash', date: '2020-01-01', phase: 'certain_receipts', priority: 0, payload: { id: 'salary', date: '2020-01-31', sourceEventId: 'fixture', kind: 'income', accountId: 'personal', counterpartyId: 'world', amountFen: 800_000 } })
    expect(() => advanceEconomicTime(timeline, createEconomy(ledger), { date: '2020-01-31' })).toThrow('EVENT_OPERATION_DATE_MISMATCH')
    expect(accountFunds(ledger, 'personal').cashFen).toBe(0)
  })

  it('does not show a stale cash gap when a replayed due operation has already been paid', () => {
    let state = createEconomy(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01'))
    const due = { id: 'living', date: '2020-01-01', sourceEventId: 'fixture', kind: 'due_expense', accountId: 'personal', counterpartyId: 'world', obligationId: 'living-due', amountFen: 400_000 } as const
    state = applyEconomy(state, due)
    state = applyEconomy(state, { id: 'actual-receipt', date: '2020-01-01', sourceEventId: 'fixture', kind: 'income', accountId: 'personal', counterpartyId: 'world', amountFen: 400_000 })
    state = applyEconomy(state, { id: 'payment', date: '2020-01-01', sourceEventId: 'fixture', kind: 'pay_obligation', accountId: 'personal', obligationId: 'living-due', amountFen: 400_000 })
    const timeline = queueEvent(createTimeline<EconomyOperation>('2020-01-01'), { instanceId: 'replayed-due', date: '2020-01-01', phase: 'due_obligations', priority: 0, payload: due })
    const result = advanceEconomicTime(timeline, state, { date: '2020-01-01' })
    expect(result.status).toBe('advanced')
    expect(accountFunds(result.state.ledger, 'personal').cashFen).toBe(0)
    expect(result.state.ledger.obligations[0]?.remainingFen).toBe(0)
  })
})
