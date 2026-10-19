import { createInitialRun } from '../application/bootstrap.ts'
import { RunSession, guardUnsavedClose } from '../application/session.ts'
import { createBaseRegistry, evaluateCommand } from '../core/commands.ts'
import { accountFunds } from '../core/ledger.ts'
import { hashValue } from '../core/hash.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { RunCodec } from '../persistence/codec.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { WebWriterAccess } from '../persistence/writer-lock.ts'
import { abortAfterHeadWrite } from './abort-after-write.ts'
import { createFactFixture } from './fact-run.ts'

const button = document.getElementById('run-checks')
const output = document.getElementById('result')
const status = document.getElementById('status')
if (!(button instanceof HTMLButtonElement) || !output || !status) throw new Error('Diagnostic page elements missing')
const runButton = button
const resultOutput = output
const statusOutput = status

async function runChecks() {
  const checks: { name: string; passed: boolean; actual: unknown; expected: unknown }[] = []
  function check(name: string, actual: unknown, expected: unknown) {
    const passed = JSON.stringify(actual) === JSON.stringify(expected)
    checks.push({ name, passed, actual, expected })
    if (!passed) throw new Error(`${name}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`)
  }
  const name = `reborn-t04-native-${crypto.randomUUID()}`
  const registry = createBaseRegistry(BOOTSTRAP_VERSIONS)
  const codec = new RunCodec(registry, ['technical_employee', 'content_employee'])
  const factory = globalThis.indexedDB
  const keyRange = globalThis.IDBKeyRange
  const locks = new WebWriterAccess()
  const stores: IndexedDbRunStore[] = []
  const sessions: RunSession[] = []
  const store = new IndexedDbRunStore({ factory, keyRange, name, codec })
  stores.push(store)
  let removeCloseGuard: (() => void) | null = null
  try {
    check('secure localhost context', isSecureContext, true)
    check('native IndexedDB available', typeof factory.open, 'function')
    check('native Web Locks available', typeof navigator.locks?.request, 'function')
    const initial = createInitialRun({ runId: 'native-run', actorId: 'player', commandId: 'native-create', seed: 'native-persistence-seed', backgroundId: 'technical_employee' })
    await store.create(initial)
    const originalFile = codec.export(initial)
    const fault = abortAfterHeadWrite(factory, name)
    const failing = new IndexedDbRunStore({ factory: fault.factory, keyRange, name, codec })
    stores.push(failing)
    const session = await RunSession.open({ store: failing, codec, registry, locks, runId: initial.runId, actorId: 'player' })
    sessions.push(session)
    check('first session owns native writer lock', session.view.readOnly, false)
    removeCloseGuard = guardUnsavedClose(session)
    const command = { runId: initial.runId, actorId: 'player', commandId: 'native-advance', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }
    const first = session.submit(command)
    const duplicate = session.submit({ ...command, expectedRevision: 0 })
    check('failed request remains unsaved', (await first).status, 'unsaved')
    check('concurrent same intent shares failure', (await duplicate).status, 'unsaved')
    check('head put really succeeded before abort', fault.trace, { writeSucceeded: true, abortIssued: true })
    check('no premature saved state', session.view.saveStatus, 'unsaved')
    check('public cash stays at committed snapshot', session.view.accounts[0]?.cashFen, 2_600_000)
    check('no premature success receipt', session.view.receipts.length, 1)
    check('candidate export keeps computed next state', accountFunds(codec.import(session.exportCandidate()).economy.ledger, 'personal').cashFen, 2_200_000)
    check('old native snapshot/receipt/log bundle survives abort', (await store.load(initial.runId))?.run.revision, 1)
    check('abort leaves no new backup', await store.loadBackup(initial.runId), null)
    check('new commands blocked while candidate exists', (await session.submit({ ...command, commandId: 'blocked' })).reasonCodes, ['UNSAVED_CANDIDATE'])
    const closeSignal = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(closeSignal)
    check('unsaved close-warning signal is installed', closeSignal.defaultPrevented, true)
    check('retry saves same candidate', (await session.retry()).status, 'saved')
    check('cash published after transaction complete', session.view.accounts[0]?.cashFen, 2_200_000)
    check('one success receipt after retry', session.view.receipts.length, 2)
    check('retry clears warning', session.needsUnsavedWarning, false)
    removeCloseGuard(); removeCloseGuard = null
    await session.close()
    await failing.close()
    const reopened = new IndexedDbRunStore({ factory, keyRange, name, codec })
    stores.push(reopened)
    check('new native connection reloads committed snapshot', (await reopened.load(initial.runId))?.run.revision, 2)

    const writer = await RunSession.open({ store: reopened, codec, registry, locks, runId: initial.runId, actorId: 'player' })
    const reader = await RunSession.open({ store, codec, registry, locks, runId: initial.runId, actorId: 'player' })
    sessions.push(writer, reader)
    check('second session is read-only', reader.view.readOnly, true)
    const note = { runId: initial.runId, actorId: 'player', commandId: 'native-note', expectedRevision: 2, kind: 'SetPrivateNote', payload: { text: 'fixture <script>not executable</script>' } }
    check('read-only session cannot mutate', (await reader.submit(note)).reasonCodes, ['READ_ONLY_SESSION'])
    check('writer can save literal text', (await writer.submit(note)).status, 'saved')
    check('private note remains literal data', codec.import(writer.exportSaved()).privateNotes, note.payload.text)
    check('public view omits private note', JSON.stringify(writer.view).includes(note.payload.text), false)
    await writer.close()
    await reader.reload()
    check('reader can take released native lock after reload', reader.view.readOnly, false)
    const beforeRestore = await store.load(initial.runId)
    check('restore starting revision', beforeRestore?.run.revision, 3)
    await reader.restore(originalFile, 'native-restore')
    check('explicit restore preserves selected revision', reader.view.revision, 1)
    check('restore advances physical generation', (await store.load(initial.runId))?.generation, 4)
    check('restore backs up prior state', (await store.loadBackup(initial.runId))?.run.revision, 3)
    const oldProposal = evaluateCommand(initial, command, registry, 'player')
    if (oldProposal.status !== 'proposed') throw new Error('proposal expected')
    let stale = ''
    try { await store.commit(oldProposal, 1) } catch (error) { stale = error instanceof Error ? error.message : String(error) }
    check('same game revision cannot bypass storage generation', stale, 'STALE_REVISION')
    check('selected branch can replay its command', (await reader.submit(command)).status, 'saved')
    const duplicateImport = await store.importSave(originalFile, { importId: 'native-restore', actorId: 'player', mode: 'replace', expectedRevision: 3, expectedGeneration: 3 })
    check('duplicate import does not rewind a later accepted command', { duplicate: duplicateImport.duplicate, revision: duplicateImport.record.run.revision }, { duplicate: true, revision: 2 })
    const prior = hashValue((await store.load(initial.runId))?.run)
    const invalid = JSON.parse(originalFile)
    invalid.saveVersion = 999
    let incompatible = ''
    try { await store.importSave(JSON.stringify(invalid), { importId: 'invalid-import', actorId: 'player', mode: 'replace', expectedRevision: 2, expectedGeneration: 5 }) } catch (error) { incompatible = error instanceof Error ? error.message : String(error) }
    check('higher save version is rejected', incompatible, 'UNSUPPORTED_SAVE_VERSION')
    check('invalid import keeps entire previous bundle', hashValue((await store.load(initial.runId))?.run), prior)
    await reader.close()

    const fixture = createFactFixture('native-facts')
    const factStore = new IndexedDbRunStore({ factory, keyRange, name, codec: fixture.codec })
    stores.push(factStore)
    await factStore.create(fixture.run)
    const factFault = abortAfterHeadWrite(factory, name)
    const factFailing = new IndexedDbRunStore({ factory: factFault.factory, keyRange, name, codec: fixture.codec })
    stores.push(factFailing)
    const investigator = await RunSession.open({ store: factFailing, codec: fixture.codec, registry: fixture.registry, locks, runId: fixture.run.runId, actorId: 'player' })
    sessions.push(investigator)
    const inspect = { runId: fixture.run.runId, actorId: 'player', commandId: 'native-inspect', expectedRevision: 1, kind: 'InspectSignal', payload: { factId: 'fact1' } }
    const randomBefore = hashValue(fixture.run.random)
    check('preview declares the investigation cost', investigator.preview(inspect).actionPoints, 1)
    check('investigation failure is unsaved', (await investigator.submit(inspect)).status, 'unsaved')
    check('uncommitted hidden evidence is not published', investigator.view.evidence.length, 0)
    check('uncommitted cost is not advertised as saved', investigator.view.budget.spent, 0)
    check('investigation retry saves once', (await investigator.retry()).status, 'saved')
    check('saved investigation spends one real point', investigator.view.budget.spent, 1)
    check('evidence becomes visible only after commit', investigator.view.evidence.length, 1)
    const loadedFact = await factStore.load(fixture.run.runId)
    check('native save does not reroll investigation truth', loadedFact?.run.facts[0]?.roll, fixture.run.facts[0]?.roll)
    check('native save preserves random streams', hashValue(loadedFact?.run.random), randomBefore)
    check('fact export/import preserves full state', hashValue(fixture.codec.import(investigator.exportSaved())), hashValue(loadedFact?.run))
    check('public projection contains no raw random field', Object.hasOwn(investigator.view, 'random'), false)
    await investigator.close()
    return { taskId: 'T04', evidenceType: 'browser-native-storage', database: name, origin: location.origin, secureContext: isSecureContext, nativeFactory: factory === globalThis.indexedDB, total: checks.length, passed: checks.filter((item) => item.passed).length, checks, beforeUnloadScope: 'synthetic cancelable signal, not an actual navigation dialog', notCovered: ['playable_game_ui', 'browser_close_dialog', 'full_campaign', 'quota_eviction_power_loss', 'human_playtest'] }
  } finally {
    removeCloseGuard?.()
    for (const session of sessions.reverse()) await session.close({ discardCandidate: true })
    for (const store of stores.reverse()) await store.close()
  }
}

runButton.addEventListener('click', () => {
  runButton.disabled = true
  statusOutput.textContent = '验证进行中…'
  void runChecks().then((report) => {
    resultOutput.textContent = JSON.stringify(report, null, 2)
    statusOutput.textContent = `${report.passed}/${report.total} 原生存储检查通过`
  }).catch((error: unknown) => {
    statusOutput.textContent = '原生存储检查失败'
    resultOutput.textContent = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error)
  }).finally(() => { runButton.disabled = false })
})
