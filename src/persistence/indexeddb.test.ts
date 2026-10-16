import { describe, expect, it } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { createInitialRun } from '../application/bootstrap.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { createBaseRegistry, evaluateCommand } from '../core/commands.ts'
import { accountFunds } from '../core/ledger.ts'
import { RunCodec } from './codec.ts'
import { IndexedDbRunStore } from './indexeddb.ts'
import { abortAfterHeadWrite } from '../testing/abort-after-write.ts'

const registry = createBaseRegistry(BOOTSTRAP_VERSIONS)
const codec = new RunCodec(registry, ['technical_employee', 'content_employee'])
const input = { runId: 'run1', actorId: 'player', commandId: 'create1', seed: 'seed', backgroundId: 'technical_employee' }

describe('atomic IndexedDB run store', () => {
  it('stores a consistent snapshot/receipt/log bundle and preserves the prior snapshot as backup', async () => {
    const factory = new IDBFactory()
    const store = new IndexedDbRunStore({ factory, keyRange: IDBKeyRange, name: 't04-store', codec })
    const initial = createInitialRun(input)
    const created = await store.create(initial)
    expect(created.record.generation).toBe(1)
    const result = evaluateCommand(initial, { runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }, registry, 'player')
    if (result.status !== 'proposed') throw new Error('proposal expected')
    const committed = await store.commit(result, created.record.generation)
    expect(committed.record.run.revision).toBe(2)
    expect(accountFunds(committed.record.run.economy.ledger, 'personal').cashFen).toBe(2_200_000)
    const loaded = await store.load('run1')
    expect(loaded).toEqual(committed.record)
    expect((await store.loadBackup('run1'))?.run).toEqual(initial)
    await store.close()
  })

  it('restores an older snapshot explicitly while preventing an old same-revision writer from overwriting it', async () => {
    const store = new IndexedDbRunStore({ factory: new IDBFactory(), keyRange: IDBKeyRange, name: 't04-restore', codec })
    const initial = createInitialRun(input)
    await store.create(initial)
    const file = codec.export(initial)
    const proposal = evaluateCommand(initial, { runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }, registry, 'player')
    if (proposal.status !== 'proposed') throw new Error('proposal expected')
    await store.commit(proposal, 1)
    const restored = await store.importSave(file, { importId: 'restore1', actorId: 'player', mode: 'replace', expectedRevision: 2, expectedGeneration: 2 })
    expect(restored.record.run).toEqual(initial)
    expect(restored.record.generation).toBe(3)
    await expect(store.commit(proposal, 1)).rejects.toThrow('STALE_REVISION')
    const replayed = await store.commit(proposal, 3)
    expect(replayed.record.run).toEqual(proposal.nextRun)
    const duplicate = await store.importSave(file, { importId: 'restore1', actorId: 'player', mode: 'replace', expectedRevision: 2, expectedGeneration: 2 })
    expect(duplicate.duplicate).toBe(true)
    expect(duplicate.record.run).toEqual(proposal.nextRun)
    await store.close()
  })

  it('rejects transaction abort after the head put succeeds and rolls back the entire bundle', async () => {
    const factory = new IDBFactory()
    const store = new IndexedDbRunStore({ factory, keyRange: IDBKeyRange, name: 't04-abort', codec })
    const initial = createInitialRun(input)
    await store.create(initial)
    const fault = abortAfterHeadWrite(factory, 't04-abort')
    const failing = new IndexedDbRunStore({ factory: fault.factory, keyRange: IDBKeyRange, name: 't04-abort', codec })
    const proposal = evaluateCommand(initial, { runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }, registry, 'player')
    if (proposal.status !== 'proposed') throw new Error('proposal expected')
    await expect(failing.commit(proposal, 1)).rejects.toThrow('SAVE_ABORTED')
    expect(fault.trace).toEqual({ writeSucceeded: true, abortIssued: true })
    expect((await store.load('run1'))?.run).toEqual(initial)
    expect(await store.loadBackup('run1')).toBeNull()
    const retried = await failing.commit(proposal, 1)
    expect(retried.record.run).toEqual(proposal.nextRun)
    await failing.close()
    await store.close()
  })

  it('allows one conflicting revision winner while deduplicating the same concurrent command', async () => {
    const factory = new IDBFactory()
    const first = new IndexedDbRunStore({ factory, keyRange: IDBKeyRange, name: 't04-race', codec })
    const second = new IndexedDbRunStore({ factory, keyRange: IDBKeyRange, name: 't04-race', codec })
    const initial = createInitialRun(input)
    await first.create(initial)
    const a = evaluateCommand(initial, { runId: 'run1', actorId: 'player', commandId: 'a', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }, registry, 'player')
    const b = evaluateCommand(initial, { runId: 'run1', actorId: 'player', commandId: 'b', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-03-01' } }, registry, 'player')
    if (a.status !== 'proposed' || b.status !== 'proposed') throw new Error('proposals expected')
    const results = await Promise.allSettled([first.commit(a, 1), second.commit(b, 1)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    const current = await first.load('run1')
    if (!current) throw new Error('stored run expected')
    const same = evaluateCommand(current.run, { runId: 'run1', actorId: 'player', commandId: 'same', expectedRevision: 2, kind: 'SetPrivateNote', payload: { text: 'one receipt' } }, registry, 'player')
    if (same.status !== 'proposed') throw new Error('proposal expected')
    const duplicate = await Promise.all([first.commit(same, current.generation), second.commit(same, current.generation)])
    expect(duplicate.filter((result) => result.duplicate)).toHaveLength(1)
    expect((await first.load('run1'))?.run.revision).toBe(3)
    await first.close()
    await second.close()
  })
})
