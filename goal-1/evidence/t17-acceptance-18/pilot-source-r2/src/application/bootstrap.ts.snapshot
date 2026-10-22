import { addDays, monthEnd } from '../core/calendar.ts'
import { createLedger, applyLedger } from '../core/ledger.ts'
import { createEconomy, type EconomyOperation } from '../core/economy.ts'
import { createTimeline, queueEvent } from '../core/timeline.ts'
import { advanceEconomicTime } from '../core/economic-time.ts'
import { createGameRun } from '../core/run.ts'
import type { CreateRunInput } from '../core/run-types.ts'
import { requireRule } from '../core/errors.ts'
import { BOOTSTRAP_CONTENT, BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'

export function createInitialRun(input: CreateRunInput) {
  const profile = BOOTSTRAP_CONTENT.profiles.find((item) => item.id === input.backgroundId)
  requireRule(profile, 'UNKNOWN_BACKGROUND')
  const date = BOOTSTRAP_CONTENT.startDate
  const ledger = applyLedger(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], date), { id: 'bootstrap:opening', date, sourceEventId: 'bootstrap:profile', kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen: profile.initialCashFen })
  let timeline = createTimeline<EconomyOperation>(date)
  let month: string = date
  while (month <= BOOTSTRAP_CONTENT.endDate) {
    const operation: EconomyOperation = { id: `living:${month}`, date: month, sourceEventId: 'bootstrap:living', kind: 'due_expense', accountId: 'personal', counterpartyId: 'world', obligationId: `living-due:${month}`, amountFen: profile.monthlyLivingCostFen }
    timeline = queueEvent(timeline, { instanceId: operation.id, date: month, phase: 'due_obligations', priority: 0, payload: operation })
    month = addDays(monthEnd(month), 1)
  }
  const initial = advanceEconomicTime(timeline, createEconomy(ledger), { date, phase: 'due_obligations' })
  return createGameRun(input, { origin: 'normal', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: initial.state, timeline: initial.timeline }, BOOTSTRAP_VERSIONS)
}
