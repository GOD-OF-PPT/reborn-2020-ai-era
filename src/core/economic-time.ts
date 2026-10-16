import { applyEconomy, type EconomyOperation, type EconomyState } from './economy.ts'
import { requireRule } from './errors.ts'
import { advanceTimeline, type DayPhase, type Timeline } from './timeline.ts'
import type { IsoDate } from './calendar.ts'

export function advanceEconomicTime(timeline: Timeline<EconomyOperation>, state: EconomyState, target: { readonly date: IsoDate; readonly phase?: DayPhase }) {
  requireRule(state.asOf <= timeline.cursor.date, 'ECONOMY_AHEAD_OF_CLOCK')
  const result = advanceTimeline(timeline, state, target, (model, event) => {
    requireRule(event.payload.date === event.date, 'EVENT_OPERATION_DATE_MISMATCH')
    const next = applyEconomy(model, event.payload)
    const receipt = next.ledger.receipts.find((item) => item.id === event.payload.id)
    const obligationId = 'obligationId' in event.payload ? event.payload.obligationId : null
    const stillDue = next.ledger.obligations.some((item) => item.remainingFen > 0 && (item.originOperationId === event.payload.id || item.id === obligationId))
    return { state: next, ...(receipt?.status === 'due' && stillDue ? { pauseReason: 'CASH_SHORTFALL' } : {}) }
  })
  const asOf = result.timeline.cursor.date
  return { ...result, state: { ...result.state, asOf, ledger: { ...result.state.ledger, asOf } } }
}
