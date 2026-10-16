import { expect, it } from 'vitest'
import { createCampaignRun, createCampaignRegistry, createCampaignCodec, campaignRuntime } from './campaign.ts'
import { evaluateCommand, previewCommand, projectRun } from '../core/commands.ts'
import { canonicalJson } from '../core/identity.ts'
import type { GameRun } from '../core/run-types.ts'
import { createWorldFixture, fixturePack, fixtureEvent } from '../testing/world-fixture.ts'
import { projectWorld } from '../core/world-projection.ts'
import { accountPosition } from '../core/ledger.ts'

const input = { runId: 'campaign-test', actorId: 'player', commandId: 'create-campaign', backgroundId: 'technical_employee', seed: 'campaign-seed' }
const registry = createCampaignRegistry()
const codec = createCampaignCodec()
function send(run: GameRun, kind: string, payload: unknown): GameRun {
  const command = { runId: run.runId, actorId: run.actorId, commandId: `command-${run.revision}`, expectedRevision: run.revision, kind, payload }
  const result = evaluateCommand(run, command, registry, 'player')
  if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
  return codec.import(codec.export(result.nextRun))
}
it('starts a real seven-day preparation, charges once and grants readiness only on completion', () => {
  let run = send(createCampaignRun(input), 'AdvanceTime', { date: '2020-01-22' })
  const instance = run.world?.instances[0]
  if (!instance) throw new Error('instance expected')
  const command = { runId: run.runId, actorId: run.actorId, commandId: 'prepare', expectedRevision: run.revision, kind: 'ChooseEvent', payload: { instanceId: instance.id, choiceId: 'prepare' } }
  const before = canonicalJson(run)
  expect(previewCommand(run, command, registry, 'player')).toMatchObject({ allowed: true, actionPoints: 1 })
  expect(canonicalJson(run)).toBe(before)
  run = send(run, 'ChooseEvent', command.payload)
  expect(run.world?.jobs[0]?.status).toBe('running')
  expect(run.world?.preparations).toHaveLength(0)
  expect(projectRun(run).budget.spent).toBe(1)
  run = send(run, 'AdvanceTime', { date: '2020-01-28' })
  expect(run.world?.preparations).toHaveLength(0)
  run = send(run, 'AdvanceTime', { date: '2020-01-29' })
  expect(run.world?.jobs[0]?.status).toBe('completed')
  expect(run.world?.preparations[0]?.key).toBe('manual_case')
  expect(projectRun(run).budget.spent).toBe(1)
  expect(campaignRuntime.capabilityReasons(run, 'player', 'gpt3_api', run.timeline.cursor.date)).toContain('CAPABILITY_NOT_YET_AVAILABLE')
})

it('expires with a real free stop branch at zero cash and zero action points', () => {
  const fixture = createWorldFixture(fixturePack, true)
  const execute = (run: GameRun, kind: string, payload: unknown) => {
    const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `f-${run.revision}`, expectedRevision: run.revision, kind, payload }, fixture.registry, 'player')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    return fixture.codec.import(fixture.codec.export(result.nextRun))
  }
  let run = execute(fixture.run, 'AdvanceTime', { date: '2020-01-02' })
  const instance = run.world?.instances[0]
  if (!instance) throw new Error('instance expected')
  const random = canonicalJson(run.random)
  expect(previewCommand(run, { runId: run.runId, actorId: 'player', commandId: 'try-paid', expectedRevision: run.revision, kind: 'ChooseEvent', payload: { instanceId: instance.id, choiceId: 'act' } }, fixture.registry, 'player').reasonCodes).toContain('INSUFFICIENT_ACTION_POINTS')
  run = execute(run, 'DeferEventDecision', { instanceId: instance.id })
  run = execute(run, 'AdvanceTime', { date: '2020-01-06' })
  expect(run.world?.instances[0]).toMatchObject({ status: 'resolved', resolution: 'default', choiceId: 'skip', resolvedAt: '2020-01-05' })
  expect(run.world?.stoppedBindings).toEqual(['player'])
  expect(run.world?.evidence).toHaveLength(0)
  expect(run.world?.preparations).toHaveLength(0)
  expect(run.timeline.cursor.date).toBe('2020-01-06')
  expect(canonicalJson(run.random)).toBe(random)
  expect(projectRun(run).accounts[0]?.cashFen).toBe(0)
  expect(projectRun(run).budget.spent).toBe(4)
})

it('includes known financial effects in the same precondition check used for preview and submit', () => {
  const event = { ...fixtureEvent, choices: [{ ...fixtureEvent.choices[0], actionPoints: 0, effects: [{ op: 'postLedgerTransaction', transaction: { kind: 'expense', accountId: '$owner', counterpartyId: 'world', amountFen: 3_000_000 } }] }, fixtureEvent.choices[1]] }
  const fixture = createWorldFixture({ ...fixturePack, events: [event] })
  const advanced = evaluateCommand(fixture.run, { runId: fixture.run.runId, actorId: 'player', commandId: 'advance', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-01-02' } }, fixture.registry, 'player')
  if (advanced.status !== 'proposed') throw new Error('proposal expected')
  const run = advanced.nextRun
  const command = { runId: run.runId, actorId: 'player', commandId: 'act', expectedRevision: run.revision, kind: 'ChooseEvent', payload: { instanceId: run.world?.instances[0]?.id, choiceId: 'act' } }
  expect(previewCommand(run, command, fixture.registry, 'player').allowed).toBe(false)
  expect(evaluateCommand(run, command, fixture.registry, 'player').status).toBe('rejected')
})

it('advances every historical anchor without opening news, while keeping missing access and unpaid duties', () => {
  let run = createCampaignRun(input)
  const initialMarket = canonicalJson(run.random.streams.market)
  let steps = 0
  while (run.timeline.cursor.date !== '2025-12-31' || run.timeline.pause !== null) {
    if (++steps > 300) throw new Error('clock failed to progress')
    let kind = 'AdvanceTime'
    let payload: unknown = { date: '2025-12-31' }
    if (run.timeline.pause?.reason === 'CASH_SHORTFALL') { kind = 'AcknowledgeCashGap'; payload = { instanceId: run.timeline.pause.instanceId } }
    else if (run.timeline.pause?.reason === 'CONTENT_DECISION_PENDING') {
      const instance = run.world?.instances.find((item) => item.openedBy === run.timeline.pause?.instanceId)
      if (!instance) throw new Error('pending instance expected')
      kind = 'ChooseEvent'; payload = { instanceId: instance.id, choiceId: campaignRuntime.definition(instance.definitionId).defaultChoiceId }
    }
    const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `clock-${run.revision}`, expectedRevision: run.revision, kind, payload }, registry, 'player')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    run = result.nextRun
  }
  expect(run.world?.anchors).toHaveLength(11)
  expect(new Set(run.world?.anchors.map((anchor) => anchor.id)).size).toBe(11)
  expect(run.world?.newsRead).toHaveLength(0)
  expect(canonicalJson(run.random.streams.market)).toBe(initialMarket)
  expect(campaignRuntime.capabilityReasons(run, 'player', 'gpt3_api', '2025-12-31')).toEqual(['MISSING_ENTITLEMENT:api_beta_access'])
  expect(campaignRuntime.capabilityReasons(run, 'player', 'deepseek_counterfactual_equity', '2025-12-31')).toHaveLength(3)
  // A bill that cannot be fully paid remains due; no implicit partial payment.
  expect(accountPosition(run.economy.ledger, 'personal')).toMatchObject({ cashFen: 200_000, payableFen: 26_000_000 })
  expect(codec.import(codec.export(run))).toEqual(run)
}, 20000)

it('leaves costs and spent action points after an interrupted preparation, without awarding its completion', () => {
  const event = { ...fixtureEvent, choices: [{ ...fixtureEvent.choices[0], costFen: 100_000, effects: [{ op: 'startJob', durationDays: 7, capacityUnits: 1, onComplete: [{ op: 'recordPreparation', key: 'ready' }] }] }, fixtureEvent.choices[1]] }
  const fixture = createWorldFixture({ ...fixturePack, events: [event] })
  const apply = (run: GameRun, kind: string, payload: unknown) => {
    const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `j-${run.revision}`, expectedRevision: run.revision, kind, payload }, fixture.registry, 'player')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    return fixture.codec.import(fixture.codec.export(result.nextRun))
  }
  let run = apply(fixture.run, 'AdvanceTime', { date: '2020-01-02' })
  run = apply(run, 'ChooseEvent', { instanceId: run.world?.instances[0]?.id, choiceId: 'act' })
  run = apply(run, 'InterruptPreparation', { jobId: run.world?.jobs[0]?.id })
  run = apply(run, 'AdvanceTime', { date: '2020-01-10' })
  expect(run.world?.jobs[0]?.status).toBe('interrupted')
  expect(run.world?.preparations).toHaveLength(0)
  expect(projectRun(run).budget.spent).toBe(1)
  expect(accountPosition(run.economy.ledger, 'personal').cashFen).toBe(2_500_000)
})

it('keeps all forced and risk items while applying the ordinary 1+2 display budget without drawing randomness', () => {
  const events = Array.from({ length: 10 }, (_, index) => ({ ...fixtureEvent, id: `e-${index}`, presentation: index < 2 ? 'mandatory' : index === 2 ? 'risk' : 'ordinary', pausesTime: false }))
  const fixture = createWorldFixture({ ...fixturePack, events, calendar: events.map((event) => ({ definitionId: event.id, date: '2020-01-02', bindingId: 'player', occurrenceId: `open-${event.id}` })) })
  const result = evaluateCommand(fixture.run, { runId: fixture.run.runId, actorId: 'player', commandId: 'advance', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-01-02' } }, fixture.registry, 'player')
  if (result.status !== 'proposed') throw new Error('proposal expected')
  const before = canonicalJson(result.nextRun)
  const view = projectWorld(result.nextRun, fixture.runtime)
  expect(view.main).not.toBeNull()
  expect(view.side).toHaveLength(2)
  expect(view.ordinaryArchive).toHaveLength(4)
  expect(view.mandatoryAndRisk).toHaveLength(3)
  expect(view.totalPendingEvents).toBe(10)
  expect(JSON.stringify(view)).not.toContain('factId')
  expect(canonicalJson(result.nextRun)).toBe(before)
})

it('preserves the two initial skill profiles without granting model access or equity', () => {
  const technical = createCampaignRun(input)
  const content = createCampaignRun({ ...input, runId: 'content-profile', backgroundId: 'content_employee' })
  expect(campaignRuntime.capabilityReasons(technical, 'player', 'basic_programming', '2020-01-01')).toEqual([])
  expect(campaignRuntime.capabilityReasons(content, 'player', 'audience_research', '2020-01-01')).toEqual([])
  expect(campaignRuntime.capabilityReasons(content, 'player', 'basic_programming', '2020-01-01')).toEqual(['MISSING_ENTITLEMENT:basic_programming'])
  expect(technical.world?.entitlements.map((item) => item.id)).toEqual(['basic_programming'])
  expect(content.world?.entitlements.map((item) => item.id)).toEqual(['audience_research'])
})

it('grants only an explicitly authored fixture permission and expires it independently of publication', () => {
  const fixture = createWorldFixture({ ...fixturePack,
    sources: [{ id: 'H001', url: 'https://openai.com/index/openai-api/', checkedAt: '2026-10-16', status: 'verified', scope: '2020-06-11 private beta announcement; fixture approval is fictional' }],
    anchors: [{ id: 'H001', classification: 'historical', title: 'API私有测试公告', sourceIds: ['H001'], actualDate: '2020-06-11', publishedAt: '2020-06-11', availableAt: '2020-06-11', access: 'private_beta', enabled: true }],
    capabilities: [{ id: 'fixture-beta', anchorId: 'H001', availableAt: '2020-06-11', entitlementIds: ['approved_access'], classification: 'historical', route: 'api_relay' }],
    events: [{ ...fixtureEvent, choices: [{ ...fixtureEvent.choices[0], effects: [{ op: 'grantEntitlement', entitlementId: 'approved_access', validDays: 2 }] }, fixtureEvent.choices[1]] }],
    calendar: [{ definitionId: 'fixture', date: '2020-06-11', bindingId: 'player', occurrenceId: 'open-fixture' }],
  })
  const apply = (run: GameRun, kind: string, payload: unknown) => {
    const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `q-${run.revision}`, expectedRevision: run.revision, kind, payload }, fixture.registry, 'player')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    return fixture.codec.import(fixture.codec.export(result.nextRun))
  }
  expect(fixture.runtime.capabilityReasons(fixture.run, 'player', 'fixture-beta', '2020-01-01')).toContain('CAPABILITY_NOT_YET_AVAILABLE')
  let run = apply(fixture.run, 'AdvanceTime', { date: '2020-06-11' })
  expect(fixture.runtime.capabilityReasons(run, 'player', 'fixture-beta', '2020-06-11')).toEqual(['MISSING_ENTITLEMENT:approved_access'])
  run = apply(run, 'ChooseEvent', { instanceId: run.world?.instances[0]?.id, choiceId: 'act' })
  expect(fixture.runtime.capabilityReasons(run, 'player', 'fixture-beta', '2020-06-11')).toEqual([])
  run = apply(run, 'AdvanceTime', { date: '2020-06-13' })
  expect(fixture.runtime.capabilityReasons(run, 'player', 'fixture-beta', '2020-06-13')).toEqual(['MISSING_ENTITLEMENT:approved_access'])
  expect(run.world?.anchors).toHaveLength(1)
})

it('charges the declared cost and a distinct financial effect exactly once and reports both in preview', () => {
  const event = { ...fixtureEvent, choices: [{ ...fixtureEvent.choices[0], costFen: 1000, effects: [{ op: 'postLedgerTransaction', transaction: { kind: 'expense', accountId: '$owner', counterpartyId: 'world', amountFen: 2000 } }] }, fixtureEvent.choices[1]] }
  const fixture = createWorldFixture({ ...fixturePack, events: [event] })
  const advanced = evaluateCommand(fixture.run, { runId: fixture.run.runId, actorId: 'player', commandId: 'advance', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-01-02' } }, fixture.registry, 'player')
  if (advanced.status !== 'proposed') throw new Error('proposal expected')
  const command = { runId: fixture.run.runId, actorId: 'player', commandId: 'act', expectedRevision: 2, kind: 'ChooseEvent', payload: { instanceId: advanced.nextRun.world?.instances[0]?.id, choiceId: 'act' } }
  expect(previewCommand(advanced.nextRun, command, fixture.registry, 'player').upfrontCostFen).toBe(3000)
  const chosen = evaluateCommand(advanced.nextRun, command, fixture.registry, 'player')
  if (chosen.status !== 'proposed') throw new Error('choice expected')
  const loaded = fixture.codec.import(fixture.codec.export(chosen.nextRun))
  expect(accountPosition(loaded.economy.ledger, 'personal').cashFen).toBe(2_597_000)
  expect(evaluateCommand(loaded, command, fixture.registry, 'player').status).toBe('duplicate')
})

it('keeps a failed completion atomic and lets the clock continue without granting partial readiness', () => {
  const event = { ...fixtureEvent, choices: [{ ...fixtureEvent.choices[0], costFen: 1000, effects: [{ op: 'startJob', durationDays: 7, capacityUnits: 1, onComplete: [{ op: 'recordPreparation', key: 'ready' }, { op: 'postLedgerTransaction', transaction: { kind: 'expense', accountId: '$owner', counterpartyId: 'world', amountFen: 3_000_000 } }] }] }, fixtureEvent.choices[1]] }
  const fixture = createWorldFixture({ ...fixturePack, events: [event] })
  let run = fixture.run
  for (const [kind, payload] of [['AdvanceTime', { date: '2020-01-02' }], ['ChooseEvent', null], ['AdvanceTime', { date: '2020-01-10' }]] as const) {
    const actual = payload ?? { instanceId: run.world?.instances[0]?.id, choiceId: 'act' }
    const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `failure-${run.revision}`, expectedRevision: run.revision, kind, payload: actual }, fixture.registry, 'player')
    expect(result.status).toBe('proposed')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    run = fixture.codec.import(fixture.codec.export(result.nextRun))
  }
  expect(run.timeline.cursor.date).toBe('2020-01-10')
  expect(run.world?.preparations).toHaveLength(0)
  expect(run.world?.jobs[0]?.status).toBe('interrupted')
  expect(accountPosition(run.economy.ledger, 'personal').cashFen).toBe(2_599_000)
  expect(projectRun(run).budget.spent).toBe(1)
})

it('rejects overlapping preparation capacity and schedules a referenced follow-up only once', () => {
  const first = { ...fixtureEvent, choices: [{ ...fixtureEvent.choices[0], effects: [{ op: 'startJob', durationDays: 7, capacityUnits: 1, onComplete: [{ op: 'recordPreparation', key: 'ready' }] }, { op: 'scheduleEvent', definitionId: 'second', delayDays: 1 }] }, fixtureEvent.choices[1]] }
  const second = { ...fixtureEvent, id: 'second', choices: [{ ...fixtureEvent.choices[0], effects: [{ op: 'startJob', durationDays: 7, capacityUnits: 1, onComplete: [{ op: 'recordPreparation', key: 'ready' }] }] }, fixtureEvent.choices[1]] }
  const fixture = createWorldFixture({ ...fixturePack, events: [first, second] })
  const apply = (run: GameRun, kind: string, payload: unknown) => {
    const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `c-${run.revision}`, expectedRevision: run.revision, kind, payload }, fixture.registry, 'player')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    return fixture.codec.import(fixture.codec.export(result.nextRun))
  }
  let run = apply(fixture.run, 'AdvanceTime', { date: '2020-01-02' })
  run = apply(run, 'ChooseEvent', { instanceId: run.world?.instances[0]?.id, choiceId: 'act' })
  run = apply(run, 'AdvanceTime', { date: '2020-01-03' })
  expect(run.world?.instances).toHaveLength(2)
  const secondId = run.world?.instances[1]?.id
  const command = { runId: run.runId, actorId: 'player', commandId: 'overlap', expectedRevision: run.revision, kind: 'ChooseEvent', payload: { instanceId: secondId, choiceId: 'act' } }
  expect(previewCommand(run, command, fixture.registry, 'player').reasonCodes).toContain('INSUFFICIENT_CAPACITY')
  expect(evaluateCommand(run, command, fixture.registry, 'player').status).toBe('rejected')
  run = apply(run, 'ChooseEvent', { instanceId: secondId, choiceId: 'skip' })
  run = apply(run, 'AdvanceTime', { date: '2020-01-10' })
  expect(run.world?.jobs).toHaveLength(1)
  expect(run.world?.jobs[0]?.status).toBe('completed')
  expect(run.world?.preparations).toHaveLength(1)
})

it('makes memory favorites and news reading free without rerolling or triggering future news', () => {
  let run = createCampaignRun(input)
  const random = canonicalJson(run.random)
  run = send(run, 'FavoriteMemory', { memoryId: 'MEM-CONTENT', favorite: true })
  expect(projectWorld(run, campaignRuntime).memories[0]?.favorite).toBe(true)
  expect(canonicalJson(run.random)).toBe(random)
  expect(projectRun(run).budget.spent).toBe(0)
  const command = { runId: run.runId, actorId: 'player', commandId: 'future-news', expectedRevision: run.revision, kind: 'ReadNews', payload: { anchorId: 'H001' } }
  expect(evaluateCommand(run, command, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['NEWS_NOT_YET_OCCURRED'] })
  expect(projectWorld(run, campaignRuntime).news).toHaveLength(0)
})

it('uses the free default for a mutually exclusive follow-up after the first branch was accepted', () => {
  const first = { ...fixtureEvent, exclusiveGroup: 'one-branch', choices: [{ ...fixtureEvent.choices[0], effects: [{ op: 'recordCause', text: 'first branch accepted' }, { op: 'scheduleEvent', definitionId: 'second', delayDays: 1 }] }, fixtureEvent.choices[1]] }
  const second = { ...fixtureEvent, id: 'second', exclusiveGroup: 'one-branch' }
  const fixture = createWorldFixture({ ...fixturePack, events: [first, second] })
  let run = fixture.run
  for (const [kind, payload] of [['AdvanceTime', { date: '2020-01-02' }], ['ChooseEvent', null], ['AdvanceTime', { date: '2020-01-04' }]] as const) {
    const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `exclusive-${run.revision}`, expectedRevision: run.revision, kind, payload: payload ?? { instanceId: run.world?.instances[0]?.id, choiceId: 'act' } }, fixture.registry, 'player')
    if (result.status !== 'proposed') throw new Error(JSON.stringify(result))
    run = fixture.codec.import(fixture.codec.export(result.nextRun))
  }
  expect(run.world?.instances[1]).toMatchObject({ status: 'resolved', resolution: 'default', choiceId: 'skip', reason: 'EXCLUSIVE_GROUP_BUSY' })
  expect(run.timeline.cursor.date).toBe('2020-01-04')
  expect(projectRun(run).budget.spent).toBe(1)
})
