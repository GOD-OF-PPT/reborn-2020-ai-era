import { z } from 'zod'
import { createInitialRun } from '../application/bootstrap.ts'
import { createGameRun } from '../core/run.ts'
import { createBaseRegistry, defineCommand } from '../core/commands.ts'
import { actionBudget, applyEconomy } from '../core/economy.ts'
import { revealFact } from '../core/facts.ts'
import { requireRule } from '../core/errors.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { RunCodec } from '../persistence/codec.ts'

/** Paid investigation fixture; unavailable in the normal application registry. */
export function createFactFixture(runId = 'fact-run') {
  const input = { runId, actorId: 'player', commandId: 'create-fact-run', seed: 'fixed-fact-seed', backgroundId: 'technical_employee' }
  const base = createInitialRun(input)
  const versions = { ...BOOTSTRAP_VERSIONS, rulesVersion: 'rules-t04-fixture' }
  const run = createGameRun(input, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: base.economy, timeline: base.timeline, initialFacts: [{ id: 'fact1', domain: 'crisis', sourceEventId: 'fixture:event', date: '2020-01-01' }] }, versions)
  const inspect = defineCommand('InspectSignal', z.strictObject({ factId: z.literal('fact1') }), (view) => {
    requireRule(!view.evidence.some((item) => item.id === 'fact1'), 'FACT_ALREADY_REVEALED')
    requireRule(actionBudget(view.economy, view.date).available >= 1, 'INSUFFICIENT_ACTION_POINTS')
    return { allowed: true, reasonCodes: [], actionPoints: 1, upfrontCostFen: 0, releasedFen: 0 }
  }, (model, payload, context) => {
    const action = { id: `inspect:${context.commandId}`, definitionId: 'fixture:inspect', accountId: 'personal', counterpartyId: 'world', actionPoints: 1, costFen: 0, cashReservationId: `inspect-funds:${context.commandId}`, startAt: context.date, completeAt: context.date, settlementAt: context.date }
    let economy = applyEconomy(model.economy, { id: `command:${context.commandId}:reserve`, date: context.date, sourceEventId: 'fixture:inspect', kind: 'reserve_action', action })
    economy = applyEconomy(economy, { id: `command:${context.commandId}:execute`, date: context.date, sourceEventId: 'fixture:inspect', kind: 'execute_action', actionId: action.id })
    economy = applyEconomy(economy, { id: `command:${context.commandId}:complete`, date: context.date, sourceEventId: 'fixture:inspect', kind: 'complete_action', actionId: action.id })
    const fact = model.facts.find((item) => item.id === payload.factId)
    requireRule(fact, 'FACT_NOT_FOUND')
    const revealed = revealFact({ random: model.random, facts: model.facts }, payload.factId, fact.roll % 2 === 0 ? '独立记录A已核实' : '独立记录B已核实')
    return { model: { ...model, economy, ...revealed }, domain: 'investigation', summary: '已完成一次有代价核验' }
  })
  const registry = createBaseRegistry(versions, [inspect])
  return { run, registry, codec: new RunCodec(registry, ['technical_employee', 'content_employee']) }
}
