import { describe, expect, it } from 'vitest'
import { createInitialRun } from '../application/bootstrap.ts'
import { createBaseRegistry, evaluateCommand, previewCommand, projectRun } from './commands.ts'
import { accountFunds } from './ledger.ts'
import { canonicalJson } from './identity.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { createGameRun } from './run.ts'
import { applyEconomy } from './economy.ts'
import { queueEvent } from './timeline.ts'

const input = { runId: 'run1', actorId: 'player', commandId: 'create1', seed: 'seed', backgroundId: 'technical_employee' }
const registry = createBaseRegistry(BOOTSTRAP_VERSIONS)

describe('versioned commands', () => {
  it('advances once, returns a prior receipt before revision checks, and rejects changed intent', () => {
    const run = createInitialRun(input)
    const command = { commandId: 'advance1', runId: run.runId, actorId: 'player', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }
    const result = evaluateCommand(run, command, registry, 'player')
    expect(result.status).toBe('proposed')
    if (result.status !== 'proposed') throw new Error('proposal expected')
    expect(accountFunds(result.nextRun.economy.ledger, 'personal').cashFen).toBe(2_200_000)
    expect(result.nextRun.revision).toBe(2)
    expect(evaluateCommand(result.nextRun, { ...command, expectedRevision: 0 }, registry, 'player')).toMatchObject({ status: 'duplicate', receipt: result.receipt })
    expect(evaluateCommand(result.nextRun, { ...command, payload: { date: '2020-03-01' } }, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['COMMAND_ID_REUSED'] })
    expect(evaluateCommand(result.nextRun, { ...command, commandId: 'new-command' }, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['STALE_REVISION'] })
    const before = canonicalJson(run)
    expect(previewCommand(run, command, registry, 'player').allowed).toBe(true)
    expect(canonicalJson(run)).toBe(before)
    expect(JSON.stringify(projectRun(run))).not.toContain('seed')
  })

  it('rejects foreign identity, malformed data and raw money commands before mutation', () => {
    const run = createInitialRun(input)
    const command = { commandId: 'note1', runId: run.runId, actorId: 'player', expectedRevision: 1, kind: 'SetPrivateNote', payload: { text: 'private <script>not code</script>' } }
    expect(evaluateCommand(run, { ...command, runId: 'another-run' }, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['WRONG_RUN'] })
    expect(evaluateCommand(run, { ...command, actorId: 'someone-else' }, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['FORBIDDEN_ACTOR'] })
    expect(evaluateCommand(run, { ...command, payload: { text: 'x', costFen: 0 } }, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['INVALID_PAYLOAD'] })
    expect(evaluateCommand(run, { ...command, expectedRevision: true }, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['INVALID_COMMAND'] })
    expect(evaluateCommand(run, { ...command, kind: 'income', payload: { amountFen: 999999 } }, registry, 'player')).toEqual({ status: 'rejected', reasonCodes: ['UNKNOWN_COMMAND'] })
    const result = evaluateCommand(run, command, registry, 'player')
    if (result.status !== 'proposed') throw new Error('proposal expected')
    expect(result.nextRun.privateNotes).toBe(command.payload.text)
    expect(result.nextRun.random).toEqual(run.random)
    expect(projectRun(result.nextRun)).not.toHaveProperty('privateNotes')
    expect(run.privateNotes).toBe('')
  })

  it('continues time after cancelling a funded action whose timers were already queued', () => {
    const base = createInitialRun(input)
    const action = { id: 'study', definitionId: 'fixture:study', accountId: 'personal', counterpartyId: 'world', actionPoints: 1, costFen: 100_000, cashReservationId: 'study-funds', startAt: '2020-01-05', completeAt: '2020-01-12', settlementAt: '2020-01-12' }
    const economy = applyEconomy(base.economy, { id: 'reserve-study', date: '2020-01-01', sourceEventId: 'fixture', kind: 'reserve_action', action })
    let timeline = queueEvent(base.timeline, { instanceId: 'start-study', date: action.startAt, phase: 'player_actions', priority: 0, payload: { id: 'start-study', date: action.startAt, sourceEventId: 'fixture', kind: 'execute_action', actionId: action.id } })
    timeline = queueEvent(timeline, { instanceId: 'finish-study', date: action.completeAt, phase: 'player_actions', priority: 0, payload: { id: 'finish-study', date: action.completeAt, sourceEventId: 'fixture', kind: 'complete_action', actionId: action.id } })
    const run = createGameRun({ ...input, runId: 'cancel-run' }, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy, timeline }, BOOTSTRAP_VERSIONS)
    const cancelled = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: 'cancel-study', expectedRevision: 1, kind: 'CancelAction', payload: { actionId: action.id } }, registry, 'player')
    if (cancelled.status !== 'proposed') throw new Error('cancel proposal expected')
    const advanced = evaluateCommand(cancelled.nextRun, { runId: run.runId, actorId: 'player', commandId: 'advance-after-cancel', expectedRevision: 2, kind: 'AdvanceTime', payload: { date: '2020-01-15' } }, registry, 'player')
    expect(advanced.status).toBe('proposed')
    if (advanced.status !== 'proposed') throw new Error('advance proposal expected')
    expect(accountFunds(advanced.nextRun.economy.ledger, 'personal').cashFen).toBe(2_600_000)
    expect(advanced.nextRun.timeline.receipts.filter((receipt) => receipt.skippedReason === 'ACTION_CANCELLED')).toHaveLength(2)
  })
})
