import { describe, expect, it } from 'vitest'
import { actionBudget, applyEconomy, createEconomy } from './economy.ts'
import { accountFunds, applyLedger, createLedger } from './ledger.ts'

function initialEconomy(cashFen = 1_000_000) {
  const ledger = createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01')
  return createEconomy(applyLedger(ledger, { id: 'opening', kind: 'opening_cash', date: '2020-01-01', sourceEventId: 'fixture', accountId: 'personal', counterpartyId: 'world', amountFen: cashFen }))
}

const study = { id: 'study', definitionId: 'study-template', accountId: 'personal', counterpartyId: 'world', actionPoints: 1, costFen: 100_000, cashReservationId: 'study-funds', startAt: '2020-01-05', completeAt: '2020-01-12', settlementAt: '2020-01-20' }
function stamp(id: string, date = '2020-01-01') { return { id, date, sourceEventId: 'fixture' } }

describe('funded action lifecycle', () => {
  it('reserves, executes and completes an action without charging twice', () => {
    let state = initialEconomy()
    state = applyEconomy(state, { ...stamp('reserve-study'), kind: 'reserve_action', action: study })
    expect(accountFunds(state.ledger, 'personal')).toMatchObject({ cashFen: 1_000_000, availableFen: 900_000 })
    expect(actionBudget(state, '2020-01-01')).toMatchObject({ spent: 0, reserved: 1, available: 3 })
    state = applyEconomy(state, { ...stamp('start-study', '2020-01-05'), kind: 'execute_action', actionId: 'study' })
    expect(state.actions[0]?.status).toBe('executed')
    expect(accountFunds(state.ledger, 'personal').cashFen).toBe(900_000)
    expect(actionBudget(state, '2020-01-05')).toMatchObject({ spent: 1, reserved: 0, available: 3 })
    state = applyEconomy(state, { ...stamp('finish-study', '2020-01-12'), kind: 'complete_action', actionId: 'study' })
    expect(state.actions[0]?.status).toBe('completed')
    expect(accountFunds(state.ledger, 'personal').cashFen).toBe(900_000)
  })

  it('cancels only an unexecuted plan, returning its funds and reserved attention (Q02)', () => {
    const original = initialEconomy()
    let state = applyEconomy(original, { ...stamp('reserve-study'), kind: 'reserve_action', action: study })
    state = applyEconomy(state, { ...stamp('cancel-study', '2020-01-02'), kind: 'cancel_action', actionId: 'study' })
    expect(accountFunds(state.ledger, 'personal')).toMatchObject({ cashFen: 1_000_000, availableFen: 1_000_000 })
    expect(actionBudget(state, '2020-01-02').available).toBe(4)
    expect(state.actions[0]?.status).toBe('cancelled')
    expect(original.actions).toHaveLength(0)
  })

  it('enforces a shared four-point budget and leaves failed reservations atomic', () => {
    let state = initialEconomy()
    state = applyEconomy(state, { ...stamp('reserve-all'), kind: 'reserve_action', action: { ...study, actionPoints: 4 } })
    expect(() => applyEconomy(state, { ...stamp('fifth'), kind: 'reserve_action', action: { ...study, id: 'extra', cashReservationId: 'extra-funds' } })).toThrow('INSUFFICIENT_ACTION_POINTS')
    expect(actionBudget(state, '2020-01-01').available).toBe(0)
    const poor = initialEconomy(0)
    expect(() => applyEconomy(poor, { ...stamp('unfunded'), kind: 'reserve_action', action: study })).toThrow('INSUFFICIENT_AVAILABLE_FUNDS')
    expect(actionBudget(poor, '2020-01-01').available).toBe(4)
    expect(poor.actions).toHaveLength(0)
  })

  it('keeps spent points and costs after interruption and does not complete early', () => {
    let state = applyEconomy(initialEconomy(), { ...stamp('reserve'), kind: 'reserve_action', action: study })
    state = applyEconomy(state, { ...stamp('execute', '2020-01-05'), kind: 'execute_action', actionId: 'study' })
    const execute = { ...stamp('execute', '2020-01-05'), kind: 'execute_action', actionId: 'study' } as const
    expect(applyEconomy(state, execute)).toEqual(state)
    expect(() => applyEconomy(state, { ...stamp('early', '2020-01-06'), kind: 'complete_action', actionId: 'study' })).toThrow('ACTION_NOT_COMPLETE_YET')
    expect(() => applyEconomy(state, { ...stamp('cancel', '2020-01-06'), kind: 'cancel_action', actionId: 'study' })).toThrow('ACTION_CANNOT_BE_CANCELLED')
    state = applyEconomy(state, { ...stamp('interrupt', '2020-01-06'), kind: 'interrupt_action', actionId: 'study' })
    expect(accountFunds(state.ledger, 'personal').cashFen).toBe(900_000)
    expect(actionBudget(state, '2020-01-06')).toMatchObject({ spent: 1, available: 3 })
    expect(actionBudget(state, '2020-04-01')).toMatchObject({ spent: 0, available: 4 })
    expect(() => applyEconomy(state, { ...stamp('late-complete', '2020-01-20'), kind: 'complete_action', actionId: 'study' })).toThrow('ACTION_NOT_EXECUTED')
  })

  it('keeps drafts free and rechecks the target quarter when rescheduling a reserved plan', () => {
    let state = applyEconomy(initialEconomy(), { ...stamp('draft'), kind: 'draft_action', action: study })
    expect(actionBudget(state, '2020-01-01').available).toBe(4)
    expect(accountFunds(state.ledger, 'personal').availableFen).toBe(1_000_000)
    const april = { ...study, startAt: '2020-04-05', completeAt: '2020-04-12', settlementAt: '2020-04-20' }
    state = applyEconomy(state, { ...stamp('move-to-april', '2020-01-02'), kind: 'reschedule_action', actionId: 'study', startAt: april.startAt, completeAt: april.completeAt, settlementAt: april.settlementAt })
    state = applyEconomy(state, { ...stamp('reserve-april', '2020-01-02'), kind: 'reserve_action', action: april })
    state = applyEconomy(state, { ...stamp('fill-q1', '2020-01-02'), kind: 'reserve_action', action: { ...study, id: 'q1-work', actionPoints: 4, costFen: 0, cashReservationId: 'q1-funds' } })
    expect(() => applyEconomy(state, { ...stamp('move-back', '2020-01-03'), kind: 'reschedule_action', actionId: 'study', startAt: '2020-03-05', completeAt: '2020-03-12', settlementAt: '2020-03-20' })).toThrow('INSUFFICIENT_ACTION_POINTS')
    expect(actionBudget(state, '2020-04-01')).toMatchObject({ reserved: 1, available: 3 })
  })

  it('validates account bindings even for a zero-cost action', () => {
    const state = initialEconomy()
    expect(() => applyEconomy(state, { ...stamp('unknown-owner'), kind: 'reserve_action', action: { ...study, accountId: 'missing', costFen: 0 } })).toThrow('EXPECTED_OWNED_ACCOUNT')
    expect(state.actions).toHaveLength(0)
  })

  it('rejects a raw funds release that would leave a reserved action unfunded', () => {
    const state = applyEconomy(initialEconomy(), { ...stamp('reserve'), kind: 'reserve_action', action: study })
    expect(() => applyEconomy(state, { ...stamp('orphan-release'), kind: 'release_reservation', accountId: 'personal', reservationId: 'study-funds' })).toThrow('ACTION_RESERVATION_CHANGED')
    expect(accountFunds(state.ledger, 'personal').availableFen).toBe(900_000)
    expect(state.actions[0]?.status).toBe('reserved')
  })

  it('keeps both money and points unchanged if a later freeze prevents execution', () => {
    let state = applyEconomy(initialEconomy(), { ...stamp('reserve'), kind: 'reserve_action', action: study })
    state = applyEconomy(state, { ...stamp('freeze', '2020-01-02'), kind: 'reserve_cash', accountId: 'personal', reservationId: 'risk-freeze', bucket: 'frozen', originId: 'risk', amountFen: 950_000 })
    expect(() => applyEconomy(state, { ...stamp('execute', '2020-01-05'), kind: 'execute_action', actionId: 'study' })).toThrow('INSUFFICIENT_AVAILABLE_FUNDS')
    expect(state.actions[0]?.status).toBe('reserved')
    expect(actionBudget(state, '2020-01-05')).toMatchObject({ spent: 0, reserved: 1 })
    expect(accountFunds(state.ledger, 'personal').cashFen).toBe(1_000_000)
  })

  it('charges a cross-quarter action at its actual start and completes it without new-quarter points', () => {
    const action = { ...study, startAt: '2020-03-31', completeAt: '2020-04-07', settlementAt: '2020-04-08' }
    let state = applyEconomy(initialEconomy(), { ...stamp('reserve'), kind: 'reserve_action', action })
    expect(() => applyEconomy(state, { ...stamp('early', '2020-03-30'), kind: 'execute_action', actionId: 'study' })).toThrow('ACTION_START_DATE_MISMATCH')
    state = applyEconomy(state, { ...stamp('start', '2020-03-31'), kind: 'execute_action', actionId: 'study' })
    state = applyEconomy(state, { ...stamp('complete', '2020-04-07'), kind: 'complete_action', actionId: 'study' })
    expect(actionBudget(state, '2020-03-31').spent).toBe(1)
    expect(actionBudget(state, '2020-04-07').available).toBe(4)
    expect(accountFunds(state.ledger, 'personal').cashFen).toBe(900_000)
  })

  it('permits an explicitly classified recovery action while retaining debt and charging real resources', () => {
    let state = applyEconomy(initialEconomy(100_000), { ...stamp('due-living'), kind: 'due_expense', accountId: 'personal', counterpartyId: 'world', obligationId: 'living', amountFen: 400_000 })
    const recovery = { ...study, costFen: 50_000, fundingPurpose: 'recovery' } as const
    state = applyEconomy(state, { ...stamp('reserve-recovery'), kind: 'reserve_action', action: recovery })
    state = applyEconomy(state, { ...stamp('execute-recovery', '2020-01-05'), kind: 'execute_action', actionId: 'study' })
    expect(accountFunds(state.ledger, 'personal').cashFen).toBe(50_000)
    expect(actionBudget(state, '2020-01-05').spent).toBe(1)
    expect(state.ledger.obligations[0]?.remainingFen).toBe(400_000)
  })
})
