import { expect, it } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { createWorldFixture } from '../testing/world-fixture.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { RunSession } from './session.ts'
import { abortAfterHeadWrite } from '../testing/abort-after-write.ts'
import { MemoryWriterAccess } from '../testing/memory-writer-access.ts'

it('does not publish world evidence before the entire state/receipt/cause transaction commits', async () => {
  const fixture = createWorldFixture()
  const factory = new IDBFactory()
  const store = new IndexedDbRunStore({ factory, keyRange: IDBKeyRange, name: 't05-world-session', codec: fixture.codec })
  await store.create(fixture.run)
  const locks = new MemoryWriterAccess()
  const options = { codec: fixture.codec, registry: fixture.registry, locks, runId: fixture.run.runId, actorId: 'player' }
  const initial = await RunSession.open({ ...options, store })
  expect((await initial.submit({ runId: fixture.run.runId, actorId: 'player', commandId: 'open-event', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-01-02' } })).status).toBe('saved')
  const current = fixture.codec.import(initial.exportSaved())
  await initial.close()
  const fault = abortAfterHeadWrite(factory, store.name)
  const failing = new IndexedDbRunStore({ factory: fault.factory, keyRange: IDBKeyRange, name: store.name, codec: fixture.codec })
  const session = await RunSession.open({ ...options, store: failing })
  const command = { runId: fixture.run.runId, actorId: 'player', commandId: 'investigate', expectedRevision: 2, kind: 'ChooseEvent', payload: { instanceId: current.world?.instances[0]?.id, choiceId: 'act' } }
  expect((await session.submit(command)).status).toBe('unsaved')
  expect(fault.trace).toEqual({ writeSucceeded: true, abortIssued: true })
  expect(session.view.world?.evidence).toHaveLength(0)
  expect(session.view.evidence).toHaveLength(0)
  expect(session.view.budget.spent).toBe(0)
  expect(fixture.codec.import(session.exportCandidate()).world?.evidence).toHaveLength(1)
  expect((await store.load(current.runId))?.run).toEqual(current)
  expect((await session.retry()).status).toBe('saved')
  expect(session.view.world?.evidence).toHaveLength(1)
  expect(session.view.budget.spent).toBe(1)
  const saved = (await store.load(current.runId))?.run
  expect(saved?.random).toEqual(current.random)
  expect(saved?.facts[0]?.roll).toBe(current.facts[0]?.roll)
  expect((await session.submit(command)).status).toBe('duplicate')
  await session.close(); await failing.close(); await store.close()
})
