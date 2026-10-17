import { expect, it } from 'vitest'
import { createLedger, contractBalance } from './ledger.ts'
import { createEconomy, applyEconomy } from './economy.ts'
import { createTimeline } from './timeline.ts'
import { createGameRun } from './run.ts'
import { WorldRuntime } from './world.ts'
import { createCampaignRegistry } from '../application/campaign.ts'
import { RunCodec } from '../persistence/codec.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { evaluateCommand } from './commands.ts'
import { fixtureEvent, fixturePack } from '../testing/world-fixture.ts'
import type { RunOperation, WorldBinding } from './content-types.ts'
import { createRandom } from './random.ts'
import type { GameRun } from './run-types.ts'
import { projectWorld } from './world-projection.ts'

it('binds conditions and a free stop/default obligation to one course without erasing either prepayment', () => {
  const event = { ...fixtureEvent, scope: { binding: 'business', businessKind: 'ai_course' }, choices: [{ ...fixtureEvent.choices[0], effects: [{ op: 'recordCause', text: 'isolated positive path' }] }, { ...fixtureEvent.choices[1], effects: [{ op: 'pauseNewContracts' }, { op: 'recordObligation', amountFen: 300_000, counterpartyId: 'world', dueInDays: 0 }] }] }
  const runtime = new WorldRuntime({ ...fixturePack, events: [event], calendar: [{ definitionId: 'fixture', date: '2020-01-02', bindingId: 'course-one', occurrenceId: 'open-course-one' }], capabilities: [{ id: 'manual', anchorId: null, availableAt: '2020-01-01', entitlementIds: [], classification: 'fictional', route: null }] })
  let economy = createEconomy(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }, { id: 'account-one', kind: 'business' }, { id: 'account-two', kind: 'business' }], '2020-01-01'))
  for (const suffix of ['one', 'two']) economy = applyEconomy(economy, { id: `prepay-${suffix}`, date: '2020-01-01', sourceEventId: 'fixture', kind: 'receive_prepayment', accountId: `account-${suffix}`, counterpartyId: 'world', businessId: `business-${suffix}`, contractId: `contract-${suffix}`, reservationId: `protection-${suffix}`, amountFen: 100_000 })
  const world = runtime.initialWorld(['one', 'two'].map((suffix): WorldBinding => ({ id: `course-${suffix}`, kind: 'business', accountId: `account-${suffix}`, businessId: `business-${suffix}`, route: 'ai_course', contractId: `contract-${suffix}`, personId: null, capacityUnits: 1 })))
  const model = runtime.schedule({ controlledAccountIds: ['personal', 'account-one', 'account-two'], phase: 'playing', economy, timeline: createTimeline<RunOperation>('2020-01-01'), random: createRandom('scope-seed'), facts: [], privateNotes: '', world, operations: null,market:null,video:null,course:null,relay:null,routines:null,deepseek:null })
  const versions = { ...BOOTSTRAP_VERSIONS, contentVersion: runtime.pack.version, contentHash: runtime.hash, rulesVersion: 'scope-fixture' }
  let run = createGameRun({ runId: 'scope-fixture', actorId: 'player', commandId: 'create-scope', backgroundId: 'technical_employee', seed: 'scope-seed' }, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: model.controlledAccountIds, economy, timeline: model.timeline, world }, versions)
  const registry = createCampaignRegistry(runtime, versions)
  const codec = new RunCodec(registry, ['technical_employee'])
  const apply = (state: GameRun, kind: string, payload: unknown) => {
    const result = evaluateCommand(state, { runId: state.runId, actorId: 'player', commandId: `s-${state.revision}`, expectedRevision: state.revision, kind, payload }, registry, 'player')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    return codec.import(codec.export(result.nextRun))
  }
  run = apply(run, 'AdvanceTime', { date: '2020-01-02' })
  const opened = run
  expect(runtime.conditionReasons(run, 'course-one', { op: 'all', conditions: [{ op: 'businessKindIs', route: 'ai_course' }, { op: 'contractStateIs', state: 'unfulfilled' }, { op: 'capacityGte', units: 1, durationDays: 7 }, { op: 'dateInWindow', from: '2020-01-01', to: '2020-01-03' }, { op: 'flagEquals', key: 'ready', value: false }, { op: 'not', condition: { op: 'hasEntitlement', entitlementId: 'approved_access' } }, { op: 'any', conditions: [{ op: 'availableFundsGte', amountFen: 1 }, { op: 'hasCapability', capabilityId: 'manual' }] }] }, '2020-01-02')).toEqual([])
  const beforeOne = contractBalance(run.economy.ledger, 'contract-one')
  const beforeTwo = contractBalance(run.economy.ledger, 'contract-two')
  run = apply(run, 'ChooseEvent', { instanceId: run.world?.instances[0]?.id, choiceId: 'skip' })
  expect(run.world?.stoppedBindings).toEqual(['course-one'])
  expect(contractBalance(run.economy.ledger, 'contract-one')).toEqual(beforeOne)
  expect(contractBalance(run.economy.ledger, 'contract-two')).toEqual(beforeTwo)
  expect(run.economy.ledger.obligations).toHaveLength(1)
  expect(run.economy.ledger.obligations[0]).toMatchObject({ accountId: 'account-one', businessId: 'business-one', contractId: 'contract-one', remainingFen: 300_000 })
  expect(projectWorld(run, runtime).obligations).toHaveLength(1)
  expect(run.timeline.pause).toMatchObject({ reason: 'CASH_SHORTFALL', source: 'command' })
  run = apply(run, 'AcknowledgeCashGap', { instanceId: run.timeline.pause?.instanceId })
  expect(run.economy.ledger.obligations[0]?.remainingFen).toBe(300_000)
  const deferred = apply(opened, 'DeferEventDecision', { instanceId: opened.world?.instances[0]?.id })
  const expired = apply(deferred, 'AdvanceTime', { date: '2020-01-06' })
  expect(expired.timeline.cursor.date).toBe('2020-01-05')
  expect(expired.timeline.pause?.reason).toBe('CASH_SHORTFALL')
  expect(expired.world?.instances[0]?.resolution).toBe('default')
})
import { createWorldFixture } from '../testing/world-fixture.ts'
import { campaignVideo } from '../application/campaign.ts'
it('refuses video state when only the world clock has been configured',()=>{const f=createWorldFixture();expect(()=>f.runtime.validate({...f.run,video:campaignVideo.initial(f.run.seed)})).toThrow('VIDEO_RUNTIME_REQUIRED')})
