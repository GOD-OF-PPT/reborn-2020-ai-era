import { WorldRuntime } from '../core/world.ts'
import { createInitialRun } from '../application/bootstrap.ts'
import { createCampaignRegistry } from '../application/campaign.ts'
import { createGameRun } from '../core/run.ts'
import { hashValue } from '../core/hash.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { RunCodec } from '../persistence/codec.ts'
import { applyEconomy } from '../core/economy.ts'

export const fixtureEvent = { id: 'fixture', title: '隔离选择', classification: 'fictional', sourceIds: [], effectiveWindow: { from: '2020-01-01', to: '2025-12-31' }, scope: { binding: 'player', businessKind: null }, trigger: { op: 'all', conditions: [] }, priority: 10, exclusiveGroup: null, hiddenFactsPolicy: { mode: 'fixed_at_instance_creation', domain: 'opportunity' }, choices: [{ id: 'act', label: '调查', condition: { op: 'all', conditions: [] }, actionPoints: 1, costFen: 0, effects: [{ op: 'recordEvidence', evidenceId: 'clue', mode: 'fixed_fact', text: '独立线索已记录' }] }, { id: 'skip', label: '停止新增承诺', condition: { op: 'all', conditions: [] }, actionPoints: 0, costFen: 0, effects: [{ op: 'pauseNewContracts' }, { op: 'recordCause', text: '未领取额外成果' }] }], defaultChoiceId: 'skip', followUpPolicy: 'explicit_effects', responseDays: 3, presentation: 'mandatory', pausesTime: true }
export const fixturePack = { version: 'world-fixture-v1', sources: [], anchors: [], capabilities: [], entitlementIds: ['approved_access'], preparationKeys: ['ready'], events: [fixtureEvent], calendar: [{ definitionId: 'fixture', date: '2020-01-02', bindingId: 'player', occurrenceId: 'open-fixture' }], memories: [] }
export function createWorldFixture(pack: unknown = fixturePack, empty = false, extraFixtureCashFen = 0) {
  const runtime = new WorldRuntime(pack)
  const versions = { ...BOOTSTRAP_VERSIONS, rulesVersion: 'rules-t05-fixture', contentVersion: runtime.pack.version, contentHash: hashValue(runtime.pack) }
  const input = { runId: 'world-fixture', actorId: 'player', commandId: 'fixture-create', backgroundId: 'technical_employee', seed: 'world-fixture-seed' }
  const base = createInitialRun(input)
  let economy = base.economy
  if (extraFixtureCashFen > 0) economy = applyEconomy(economy, { id: 'fixture-funds', date: '2020-01-01', sourceEventId: 'fixture', kind: 'income', accountId: 'personal', counterpartyId: 'world', amountFen: extraFixtureCashFen })
  if (empty) {
    economy = applyEconomy(economy, { id: 'use-cash', date: '2020-01-01', sourceEventId: 'fixture', kind: 'expense', accountId: 'personal', counterpartyId: 'world', amountFen: 2_600_000 })
    const action = { id: 'use-actions', definitionId: 'fixture', accountId: 'personal', counterpartyId: 'world', actionPoints: 4, costFen: 0, cashReservationId: 'use-actions-funds', startAt: '2020-01-01', completeAt: '2020-01-01', settlementAt: '2020-01-01' }
    economy = applyEconomy(economy, { id: 'reserve-actions', date: '2020-01-01', sourceEventId: 'fixture', kind: 'reserve_action', action })
    economy = applyEconomy(economy, { id: 'execute-actions', date: '2020-01-01', sourceEventId: 'fixture', kind: 'execute_action', actionId: action.id })
    economy = applyEconomy(economy, { id: 'complete-actions', date: '2020-01-01', sourceEventId: 'fixture', kind: 'complete_action', actionId: action.id })
  }
  const world = runtime.initialWorld([{ id: 'player', kind: 'player', accountId: 'personal', businessId: null, route: null, contractId: null, personId: null, capacityUnits: 1 }], input.backgroundId)
  const scheduled = runtime.schedule({ ...base, economy, world })
  const run = createGameRun(input, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy, timeline: scheduled.timeline, world }, versions)
  const registry = createCampaignRegistry(runtime, versions)
  return { runtime, registry, run, codec: new RunCodec(registry, ['technical_employee']) }
}
