import { describe, expect, it } from 'vitest'
import { createInitialRun } from '../application/bootstrap.ts'
import { createBaseRegistry, evaluateCommand } from '../core/commands.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { RunCodec } from './codec.ts'
import { hashValue } from '../core/hash.ts'
import { MAX_SAVE_BYTES } from './codec.ts'
import { createFactFixture } from '../testing/fact-run.ts'
import { previewCommand, projectRun } from '../core/commands.ts'
import { canonicalJson } from '../core/identity.ts'
import { createGameRun } from '../core/run.ts'
import { applyEconomy } from '../core/economy.ts'
import { queueEvent } from '../core/timeline.ts'
import { defineCommand } from '../core/commands.ts'
import { z } from 'zod'

const registry = createBaseRegistry(BOOTSTRAP_VERSIONS)
const codec = new RunCodec(registry, ['technical_employee', 'content_employee'])
const input = { runId: 'run1', actorId: 'player', commandId: 'create1', seed: 'seed', backgroundId: 'technical_employee' }

describe('strict save envelope', () => {
  it('keeps a skipped start receipt valid after the running action is interrupted later', () => {
    const base = createInitialRun(input)
    const action = { id: 'study', definitionId: 'fixture:study', accountId: 'personal', counterpartyId: 'world', actionPoints: 1, costFen: 0, cashReservationId: 'study-funds', startAt: '2020-01-01', completeAt: '2020-01-12', settlementAt: '2020-01-12' }
    let economy = applyEconomy(base.economy, { id: 'reserve-study', date: action.startAt, sourceEventId: 'fixture', kind: 'reserve_action', action })
    economy = applyEconomy(economy, { id: 'start-study', date: action.startAt, sourceEventId: 'fixture', kind: 'execute_action', actionId: action.id })
    const timeline = queueEvent(base.timeline, { instanceId: 'duplicate-start', date: '2020-01-02', phase: 'player_actions', priority: 0, payload: { id: 'duplicate-start', date: '2020-01-02', sourceEventId: 'fixture', kind: 'execute_action', actionId: action.id } })
    const interrupt = defineCommand('InterruptFixture', z.strictObject({}), () => ({ allowed: true, reasonCodes: [], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 }), (model, _payload, context) => ({ model: { ...model, economy: applyEconomy(model.economy, { id: 'interrupt-study', date: context.date, sourceEventId: 'fixture', kind: 'interrupt_action', actionId: action.id }) }, summary: 'fixture interruption', domain: 'actions' }))
    const localRegistry = createBaseRegistry(BOOTSTRAP_VERSIONS, [interrupt])
    const localCodec = new RunCodec(localRegistry, ['technical_employee'])
    const run = createGameRun(input, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy, timeline }, BOOTSTRAP_VERSIONS)
    const identity = { runId: input.runId, actorId: input.actorId }
    const advanced = evaluateCommand(run, { ...identity, expectedRevision: 1, commandId: 'advance', kind: 'AdvanceTime', payload: { date: '2020-01-02' } }, localRegistry, 'player')
    if (advanced.status !== 'proposed') throw new Error('advance proposal expected')
    expect(localCodec.import(localCodec.export(advanced.nextRun))).toEqual(advanced.nextRun)
    const interrupted = evaluateCommand(advanced.nextRun, { ...identity, expectedRevision: 2, commandId: 'interrupt', kind: 'InterruptFixture', payload: {} }, localRegistry, 'player')
    if (interrupted.status !== 'proposed') throw new Error('interrupt proposal expected')
    expect(localCodec.import(localCodec.export(interrupted.nextRun))).toEqual(interrupted.nextRun)
  })

  it('round-trips versioned state and command receipts without replaying effects', () => {
    const initial = createInitialRun(input)
    const result = evaluateCommand(initial, { runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }, registry, 'player')
    if (result.status !== 'proposed') throw new Error('proposal expected')
    const text = codec.export(result.nextRun)
    const loaded = codec.import(text)
    expect(loaded).toEqual(result.nextRun)
    expect(loaded.random).toEqual(initial.random)
    expect(evaluateCommand(loaded, { runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 0, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }, registry, 'player').status).toBe('duplicate')
  })

  it.each(['boolean-money', 'fraction-money', 'extra-field', 'missing-account', 'duplicate-account', 'invalid-date'])('rejects a resigned but malformed save: %s', (variant) => {
    const raw = JSON.parse(codec.export(createInitialRun(input)))
    if (variant === 'boolean-money') raw.state.economy.ledger.accounts[0].balanceFen = true
    if (variant === 'fraction-money') raw.state.economy.ledger.accounts[0].balanceFen = 1.5
    if (variant === 'extra-field') raw.state.economy.ledger.accounts[0].eval = 'do not execute'
    if (variant === 'missing-account') raw.state.timeline.pending[0].payload.accountId = 'missing'
    if (variant === 'duplicate-account') raw.state.economy.ledger.accounts.push(raw.state.economy.ledger.accounts[0])
    if (variant === 'invalid-date') raw.state.timeline.cursor.date = '2021-02-29'
    const { checksum: ignored, ...body } = raw
    expect(ignored).toBeTruthy()
    raw.checksum = hashValue(body)
    expect(() => codec.import(JSON.stringify(raw))).toThrow()
  })

  it('rejects a cursor that cannot be produced by the timeline', () => {
    const raw = JSON.parse(codec.export(createInitialRun(input)))
    raw.state.timeline.cursor.priority = 1
    raw.state.timeline.cursor.instanceId = 'nonexistent-event'
    const { checksum: ignored, ...body } = raw
    expect(ignored).toBeTruthy()
    raw.checksum = hashValue(body)
    expect(() => codec.import(JSON.stringify(raw))).toThrow('INVALID_CLOCK_CURSOR')
  })

  it('refuses corrupt, higher-version, incompatible and oversized files with explicit errors', () => {
    const original = codec.export(createInitialRun(input))
    const corrupt = JSON.parse(original)
    corrupt.checksum = '0'.repeat(64)
    expect(() => codec.import(JSON.stringify(corrupt))).toThrow('CORRUPT_SAVE')
    const future = JSON.parse(original)
    future.saveVersion = 2
    expect(() => codec.import(JSON.stringify(future))).toThrow('INVALID_SAVE_ENVELOPE')
    future.saveVersion = 3
    expect(() => codec.import(JSON.stringify(future))).toThrow('UNSUPPORTED_SAVE_VERSION')
    const content = JSON.parse(original)
    content.contentHash = 'f'.repeat(64)
    expect(() => codec.import(JSON.stringify(content))).toThrow('INCOMPATIBLE_CONTENT')
    expect(() => codec.import(' '.repeat(MAX_SAVE_BYTES + 1))).toThrow('SAVE_TOO_LARGE')
    expect(codec.export(codec.import(original))).toBe(original)
  })

  it('preserves frozen facts and random state through paid investigation, preview and import', () => {
    const fixture = createFactFixture()
    const before = canonicalJson(fixture.run)
    const command = { runId: fixture.run.runId, actorId: 'player', commandId: 'inspect1', expectedRevision: 1, kind: 'InspectSignal', payload: { factId: 'fact1' } }
    expect(previewCommand(fixture.run, command, fixture.registry, 'player').actionPoints).toBe(1)
    expect(canonicalJson(fixture.run)).toBe(before)
    expect(projectRun(fixture.run).evidence).toHaveLength(0)
    const proposal = evaluateCommand(fixture.run, command, fixture.registry, 'player')
    if (proposal.status !== 'proposed') throw new Error('proposal expected')
    expect(proposal.nextRun.random).toEqual(fixture.run.random)
    expect(proposal.nextRun.facts[0]?.roll).toBe(fixture.run.facts[0]?.roll)
    expect(proposal.nextRun.economy.actions.filter((action) => action.status === 'completed')).toHaveLength(1)
    const loaded = fixture.codec.import(fixture.codec.export(proposal.nextRun))
    expect(loaded).toEqual(proposal.nextRun)
    expect(JSON.stringify(projectRun(loaded))).not.toContain('roll')
  })
})
