import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInitialRun } from '../src/application/bootstrap.ts'
import { createBaseRegistry, evaluateCommand, previewCommand, projectRun } from '../src/core/commands.ts'
import { BOOTSTRAP_VERSIONS } from '../src/content/bootstrap.ts'
import { RunCodec } from '../src/persistence/codec.ts'
import { canonicalJson } from '../src/core/identity.ts'
import { accountFunds } from '../src/core/ledger.ts'
import { createFactFixture } from '../src/testing/fact-run.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const registry = createBaseRegistry(BOOTSTRAP_VERSIONS)
const codec = new RunCodec(registry, ['technical_employee', 'content_employee'])
const input = { runId: 't04-evidence', actorId: 'player', commandId: 'create-evidence', seed: 't04-evidence-seed', backgroundId: 'technical_employee' }
const initial = createInitialRun(input)
const command = { runId: input.runId, actorId: input.actorId, commandId: 'advance-evidence', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-02-01' } }
const before = codec.export(initial)
const preview = previewCommand(initial, command, registry, 'player')
if (codec.export(initial) !== before || !preview.allowed) throw new Error('preview mutated state or failed')
const proposal = evaluateCommand(initial, command, registry, 'player')
if (proposal.status !== 'proposed') throw new Error('advance proposal expected')
const after = codec.export(proposal.nextRun)
const loaded = codec.import(after)
if (codec.export(loaded) !== after || accountFunds(loaded.economy.ledger, 'personal').cashFen !== 2_200_000) throw new Error('save roundtrip failed')
const duplicate = evaluateCommand(loaded, { ...command, expectedRevision: 0 }, registry, 'player')
const changed = evaluateCommand(loaded, { ...command, payload: { date: '2020-03-01' } }, registry, 'player')
const stale = evaluateCommand(loaded, { ...command, commandId: 'new-old-revision' }, registry, 'player')
if (duplicate.status !== 'duplicate' || changed.status !== 'rejected' || changed.reasonCodes[0] !== 'COMMAND_ID_REUSED' || stale.status !== 'rejected' || stale.reasonCodes[0] !== 'STALE_REVISION') throw new Error('command protection failed')

const fixture = createFactFixture('t04-evidence-fact')
const investigation = { runId: fixture.run.runId, actorId: 'player', commandId: 'inspect-evidence', expectedRevision: 1, kind: 'InspectSignal', payload: { factId: 'fact1' } }
const factBefore = fixture.codec.export(fixture.run)
const factPreview = previewCommand(fixture.run, investigation, fixture.registry, 'player')
const investigated = evaluateCommand(fixture.run, investigation, fixture.registry, 'player')
if (investigated.status !== 'proposed' || factPreview.actionPoints !== 1 || fixture.codec.export(fixture.run) !== factBefore) throw new Error('investigation failed')
const factAfter = fixture.codec.export(investigated.nextRun)
if (canonicalJson(fixture.run.random) !== canonicalJson(investigated.nextRun.random) || projectRun(fixture.codec.import(factAfter)).evidence.length !== 1 || projectRun(investigated.nextRun).budget.spent !== 1) throw new Error('investigation fact/cost mismatch')

const directory = 'goal-1/evidence/'
const snapshots = { 't04-save-initial.json': before, 't04-save-final.json': after, 't04-fact-initial.json': factBefore, 't04-fact-final.json': factAfter }
for (const [name, value] of Object.entries(snapshots)) writeFileSync(join(root, directory, name), value + '\n')
function sourcesIn(directory: string): string[] {
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourcesIn(`${directory}/${entry.name}`) : /\.tsx?$/.test(entry.name) ? [`${directory}/${entry.name}`] : [])
}
const sources = [...sourcesIn('src'), 'scripts/collect_save_evidence.ts', 'tests/t04-storage.html', 'package.json', 'package-lock.json', 'tsconfig.core.json'].sort()
const browser = JSON.parse(readFileSync(join(root, directory, 't04-browser-native.json'), 'utf8'))
if (browser.taskId !== 'T04' || browser.nativeFactory !== true || browser.passed !== browser.total || browser.total !== 46) throw new Error('native report must pass')
const record = {
  taskId: 'T04', evidenceType: 'integration', caseIds: ['Q19:fact_rng_subcase', 'Q24:save_revision_import', 'Q34:strict_data_subcase', 'Q37:domain_isolation_subcase'],
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), runtime: { node: process.version },
  reproduceCommand: 'npm run evidence:save', input, versions: BOOTSTRAP_VERSIONS,
  sourceHashes: Object.fromEntries(sources.map((name) => [name, hash(readFileSync(join(root, name)))])),
  snapshots: Object.fromEntries(Object.entries(snapshots).map(([name, value]) => [name, { sha256: hash(value + '\n'), checksum: JSON.parse(value).checksum }])),
  commandSequence: [command, { ...command, expectedRevision: 0 }, { ...command, payload: { date: '2020-03-01' } }, { ...command, commandId: 'new-old-revision' }],
  actual: { preview, cashFen: accountFunds(loaded.economy.ledger, 'personal').cashFen, revision: loaded.revision, duplicate: duplicate.status, changed: changed.reasonCodes, stale: stale.reasonCodes, roundtripEqual: true, randomUnchanged: canonicalJson(initial.random) === canonicalJson(loaded.random) },
  expected: { cashFen: 2_200_000, revision: 2, duplicate: 'duplicate', changed: ['COMMAND_ID_REUSED'], stale: ['STALE_REVISION'], roundtripEqual: true, randomUnchanged: true },
  investigation: { rulesVersion: fixture.run.versions.rulesVersion, seed: fixture.run.seed, command: investigation, preview: factPreview, actionPointsSpent: projectRun(investigated.nextRun).budget.spent, visibleEvidence: projectRun(investigated.nextRun).evidence, randomUnchanged: true, scope: 'isolated_fixture_not_normal_gameplay' },
  browserEvidence: { file: 't04-browser-native.json', sha256: hash(readFileSync(join(root, directory, 't04-browser-native.json'))), screenshot: 't04-browser-native.jpg', screenshotSha256: hash(readFileSync(join(root, directory, 't04-browser-native.jpg'))), passed: browser.passed, total: browser.total },
  notCovered: ['full_business_or_world', 'playable_ui', 'real_two_tabs_product_flow', 'actual_close_dialog', 'quota_eviction_power_loss', 'full_campaign', 'original_png', 'human_playtest'],
}
writeFileSync(join(root, directory, 't04-save-evidence.json'), JSON.stringify(record, null, 2) + '\n')
console.log(JSON.stringify({ evidence: directory + 't04-save-evidence.json', cashFen: record.actual.cashFen, revision: record.actual.revision, browserChecks: `${browser.passed}/${browser.total}`, investigationCost: record.investigation.actionPointsSpent }, null, 2))
