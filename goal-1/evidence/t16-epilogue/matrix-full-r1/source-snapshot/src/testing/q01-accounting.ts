import { accountFunds, applyLedger, createLedger } from '../core/ledger.ts'
import { applyEconomy, createEconomy, type ActionDefinition, type EconomyOperation } from '../core/economy.ts'
import { advanceEconomicTime } from '../core/economic-time.ts'
import { createTimeline, queueEvent, type DayPhase } from '../core/timeline.ts'

/** Fixed accounting fixture. It neither matches orders nor unlocks the normal game. */
export function runQ01Accounting() {
  const ledger = applyLedger(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01'), { id: 'opening', date: '2020-01-01', sourceEventId: 'spec:Q01', kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen: 3_000_000 })
  let state = createEconomy(ledger)
  let timeline = createTimeline<EconomyOperation>('2020-01-01')
  function schedule(operation: EconomyOperation, phase: DayPhase, priority = 0) {
    timeline = queueEvent(timeline, { instanceId: operation.id, date: operation.date, phase, priority, payload: operation })
  }
  for (const date of ['2020-01-01', '2020-02-01', '2020-03-01']) schedule({ id: `living:${date}`, date, sourceEventId: 'spec:Q01', kind: 'due_expense', accountId: 'personal', counterpartyId: 'world', obligationId: `living-due:${date}`, amountFen: 400_000 }, 'due_obligations')
  for (const date of ['2020-01-31', '2020-02-29', '2020-03-31']) schedule({ id: `salary:${date}`, date, sourceEventId: 'spec:Q01', kind: 'income', accountId: 'personal', counterpartyId: 'world', amountFen: 800_000 }, 'certain_receipts')
  const initialSnapshot = { state, timeline }
  const openingDay = advanceEconomicTime(timeline, state, { date: '2020-01-01', phase: 'due_obligations' })
  state = openingDay.state
  timeline = openingDay.timeline
  const actions: readonly ActionDefinition[] = [
    { id: 'work', definitionId: 'fixture:work', accountId: 'personal', counterpartyId: 'world', actionPoints: 2, costFen: 0, cashReservationId: 'work-funds', startAt: '2020-01-01', completeAt: '2020-03-31', settlementAt: '2020-03-31' },
    { id: 'research', definitionId: 'fixture:research', accountId: 'personal', counterpartyId: 'world', actionPoints: 1, costFen: 0, cashReservationId: 'research-funds', startAt: '2020-01-02', completeAt: '2020-01-02', settlementAt: '2020-01-02' },
    { id: 'study', definitionId: 'fixture:study', accountId: 'personal', counterpartyId: 'world', actionPoints: 1, costFen: 300_000, cashReservationId: 'study-funds', startAt: '2020-01-03', completeAt: '2020-01-10', settlementAt: '2020-01-10' },
  ]
  for (const action of actions) {
    state = applyEconomy(state, { id: `reserve:${action.id}`, date: '2020-01-01', sourceEventId: 'spec:Q01', kind: 'reserve_action', action })
    schedule({ id: `execute:${action.id}`, date: action.startAt, sourceEventId: 'spec:Q01', kind: 'execute_action', actionId: action.id }, 'player_actions')
    schedule({ id: `finish:${action.id}`, date: action.completeAt, sourceEventId: 'spec:Q01', kind: 'complete_action', actionId: action.id }, 'player_actions', 10)
  }
  schedule({ id: 'investment', date: '2020-01-10', sourceEventId: 'spec:Q01', kind: 'acquire_asset', accountId: 'personal', counterpartyId: 'world', investmentId: 'sim-position', assetId: 'SIM-AI01', classification: 'simulation', amountFen: 1_200_000 }, 'market_matching')
  schedule({ id: 'mark-value', date: '2020-03-31', sourceEventId: 'spec:Q01', kind: 'value_asset', accountId: 'personal', investmentId: 'sim-position', valueFen: 1_100_000 }, 'market_matching')
  const cashTrace = [{ date: '2020-01-01', cashFen: accountFunds(state.ledger, 'personal').cashFen }]
  for (const date of ['2020-01-03', '2020-01-10', '2020-01-31', '2020-02-01', '2020-02-29', '2020-03-01', '2020-03-31']) {
    const result = advanceEconomicTime(timeline, state, { date })
    if (result.status !== 'advanced') throw new Error(`Q01 fixture paused at ${result.timeline.cursor.date}`)
    state = result.state
    timeline = result.timeline
    cashTrace.push({ date, cashFen: accountFunds(state.ledger, 'personal').cashFen })
  }
  return { initialSnapshot, state, timeline, cashTrace }
}
