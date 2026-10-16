import { describe, expect, it } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { createInitialRun } from './bootstrap.ts'
import { createBaseRegistry, evaluateCommand } from '../core/commands.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { RunCodec } from '../persistence/codec.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { MemoryWriterAccess } from '../testing/memory-writer-access.ts'
import { abortAfterHeadWrite } from '../testing/abort-after-write.ts'
import { RunSession } from './session.ts'

const registry = createBaseRegistry(BOOTSTRAP_VERSIONS)
const codec = new RunCodec(registry, ['technical_employee', 'content_employee'])
const input = { runId: 'run1', actorId: 'player', commandId: 'create1', seed: 'seed', backgroundId: 'technical_employee' }

describe('saved-state session', () => {
  it('keeps a failed candidate visibly unsaved, blocks new mutations, exports it and retries once', async () => {
    const factory = new IDBFactory()
    const original = new IndexedDbRunStore({ factory, keyRange: IDBKeyRange, name: 't04-session', codec })
    await original.create(createInitialRun(input))
    const fault = abortAfterHeadWrite(factory, 't04-session')
    const failing = new IndexedDbRunStore({ factory: fault.factory, keyRange: IDBKeyRange, name: 't04-session', codec })
    const session = await RunSession.open({ store: failing, codec, registry, locks: new MemoryWriterAccess(), runId: 'run1', actorId: 'player' })
    const command = { runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }
    expect((await session.submit(command)).status).toBe('unsaved')
    expect(session.view.saveStatus).toBe('unsaved')
    expect(session.view.accounts[0]?.cashFen).toBe(2_600_000)
    expect(session.view.pendingRevision).toBe(2)
    expect(session.savedView.accounts[0]?.cashFen).toBe(2_600_000)
    expect(session.view.receipts).toHaveLength(1)
    expect(session.needsUnsavedWarning).toBe(true)
    expect((await session.submit({ ...command, commandId: 'next-command' })).reasonCodes).toEqual(['UNSAVED_CANDIDATE'])
    expect(codec.import(session.exportCandidate()).revision).toBe(2)
    expect((await original.load('run1'))?.run.revision).toBe(1)
    expect((await session.retry()).status).toBe('saved')
    expect(session.view.saveStatus).toBe('saved')
    expect(session.view.receipts).toHaveLength(2)
    expect(session.needsUnsavedWarning).toBe(false)
    expect((await session.submit(command)).status).toBe('duplicate')
    await session.close()
    await original.close()
    await failing.close()
  })

  it('coalesces reentrant/in-flight duplicates and isolates a failing view observer', async () => {
    const store = new IndexedDbRunStore({ factory: new IDBFactory(), keyRange: IDBKeyRange, name: 't04-inflight', codec })
    await store.create(createInitialRun(input))
    const session = await RunSession.open({ store, codec, registry, locks: new MemoryWriterAccess(), runId: 'run1', actorId: 'player' })
    const command = { runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }
    let repeated: ReturnType<RunSession['submit']> | null = null
    session.subscribe((view) => {
      if (view.saveStatus === 'saving' && repeated === null) repeated = session.submit({ ...command, expectedRevision: 0 })
    })
    session.subscribe((view) => { if (view.saveStatus === 'saving') throw new Error('observer failure must not interrupt the commit') })
    const first = await session.submit(command)
    if (repeated === null) throw new Error('repeat expected')
    expect(await repeated).toEqual(first)
    expect((await store.load('run1'))?.run.revision).toBe(2)
    expect(session.view.busy).toBe(false)
    expect(session.view.accounts[0]?.cashFen).toBe(2_200_000)
    await session.close(); await store.close()
  })

  it('keeps a second session read-only until it can acquire the writer lease and reload', async () => {
    const store = new IndexedDbRunStore({ factory: new IDBFactory(), keyRange: IDBKeyRange, name: 't04-leases', codec })
    await store.create(createInitialRun(input))
    const locks = new MemoryWriterAccess()
    const first = await RunSession.open({ store, codec, registry, locks, runId: 'run1', actorId: 'player' })
    const second = await RunSession.open({ store, codec, registry, locks, runId: 'run1', actorId: 'player' })
    expect(second.view.readOnly).toBe(true)
    const note = { runId: 'run1', actorId: 'player', commandId: 'note1', expectedRevision: 1, kind: 'SetPrivateNote', payload: { text: 'only the writer changes state' } }
    expect((await second.submit(note)).reasonCodes).toEqual(['READ_ONLY_SESSION'])
    expect((await first.submit(note)).status).toBe('saved')
    await first.close()
    await second.reload()
    expect(second.view.readOnly).toBe(false)
    expect(second.view.revision).toBe(2)
    await second.close(); await store.close()
  })

  it('keeps a conflicting candidate exportable and requires explicit discard before reload', async () => {
    const factory = new IDBFactory()
    const original = new IndexedDbRunStore({ factory, keyRange: IDBKeyRange, name: 't04-conflict', codec })
    const initial = createInitialRun(input)
    await original.create(initial)
    const fault = abortAfterHeadWrite(factory, original.name)
    const failing = new IndexedDbRunStore({ factory: fault.factory, keyRange: IDBKeyRange, name: original.name, codec })
    const session = await RunSession.open({ store: failing, codec, registry, locks: new MemoryWriterAccess(), runId: 'run1', actorId: 'player' })
    await session.submit({ runId: 'run1', actorId: 'player', commandId: 'advance1', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } })
    const external = evaluateCommand(initial, { runId: 'run1', actorId: 'player', commandId: 'external-note', expectedRevision: 1, kind: 'SetPrivateNote', payload: { text: 'another accepted command' } }, registry, 'player')
    if (external.status !== 'proposed') throw new Error('proposal expected')
    await original.commit(external, 1)
    expect((await session.retry()).status).toBe('conflict')
    expect(codec.import(session.exportCandidate()).timeline.cursor.date).toBe('2020-02-01')
    await expect(session.reload()).rejects.toThrow('UNSAVED_CANDIDATE_EXISTS')
    await session.reload({ discardCandidate: true })
    expect(session.view.hasCandidate).toBe(false)
    expect(session.view.revision).toBe(2)
    expect(session.view.date).toBe('2020-01-01')
    await session.close(); await original.close(); await failing.close()
  })
})
