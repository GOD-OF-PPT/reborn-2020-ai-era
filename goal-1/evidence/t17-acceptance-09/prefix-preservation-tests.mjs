import {readFileSync, writeFileSync, existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {createCampaignRun, createCampaignCodec} from '../../../src/application/campaign.ts'
import {CriticalEvidenceWriter, archiveMembers} from '../../../scripts/course-critical-evidence.ts'
import * as prefixModule from '../../../scripts/course-critical-prefix.ts'

const task = fileURLToPath(new URL('./', import.meta.url))
const [mode, label] = process.argv.slice(2)
if (!['legacy', 'current'].includes(mode) || !/^r[12]$/.test(label ?? '')) throw Error('EXPLICIT_FIXTURE_MODE_AND_LABEL_REQUIRED')
const digest = text => ({bytes: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex')})
const source = readFileSync(new URL('../../../scripts/course-critical-prefix.ts', import.meta.url), 'utf8')
const excerpt = ["const archive = archiveMembers(writer, identity.name + '/prefix-evidence.xz', members)",
 "const index = writer.json(identity.name + '/prefix-index.json', {identity, record, archive})"]
if (mode === 'legacy' && !excerpt.every(line => source.includes(line))) throw Error('LEGACY_FINALIZE_EXCERPT_NO_LONGER_MATCHES')
const identity = {name: 'prefix-fixture', backgroundId: 'technical_employee', seed: 't16-campaign-0'}
const codec = createCampaignCodec()
const actualInitial = createCampaignRun({runId: 'prefix-preservation-fixture-' + label, actorId: 'player', commandId: 'create',
 backgroundId: identity.backgroundId, seed: identity.seed})
const initial = codec.export(actualInitial)
const members = new Map([['initial.json', initial], ['complete-notes.txt', '完整成员\n原文不删减，失败不冒充成功。\n'],
 ['prefix-attempts.jsonl', '']])
const record = {scope: 'Small prefix persistence seam only; actual normal Create, business commands0, not the full P1 prefix.',
 initial: digest(initial), memberNames: [...members.keys()]}
const rows = []
const originalArgv = process.argv
for (const [index, kind] of ['normal', 'archive-collision', 'index-collision'].entries()) {
 const number = (label === 'r1' ? 9801 : 9901) + index
 const output = 'goal-1/evidence/t17-acceptance-09/matrix-r' + number
 process.argv = [originalArgv[0], originalArgv[1], '--output-dir', output]
 const writer = new CriticalEvidenceWriter('matrix', 'fixture.json')
 process.argv = originalArgv
 writer.mkdir(identity.name)
 const occupiedName = kind === 'archive-collision' ? identity.name + '/prefix-evidence.xz'
  : kind === 'index-collision' ? identity.name + '/prefix-index.json' : null
 const occupied = '{"ownedFixtureOccupied":true}\n'
 if (occupiedName) writer.text(occupiedName, occupied)
 let error = null, persisted = null
 try {
  if (mode === 'legacy') {
   // Same two calls as the source excerpt; no replacement of the full prefix algorithm.
   const archive = archiveMembers(writer, identity.name + '/prefix-evidence.xz', members)
   const index = writer.json(identity.name + '/prefix-index.json', {identity, record, archive})
   persisted = {archive, index}
  } else {
   if (typeof prefixModule.persistCriticalPrefix !== 'function') throw Error('CURRENT_PREFIX_PERSISTENCE_REQUIRED')
   persisted = prefixModule.persistCriticalPrefix(writer, identity, members, record)
  }
 } catch (caught) { error = String(caught) }
 const recoveryName = writer.output + '/' + identity.name + '/prefix-output-recovery.json'
 const recoveryRaw = existsSync(recoveryName) ? readFileSync(recoveryName, 'utf8') : null
 const recovery = recoveryRaw === null ? null : JSON.parse(recoveryRaw)
 const originalMembers = [...members].map(([name, raw]) => ({name, raw}))
 const fullOriginalPreserved = recovery !== null && JSON.stringify(recovery.completeOriginalMembers) === JSON.stringify(originalMembers)
 const occupiedUnchanged = occupiedName === null || readFileSync(writer.output + '/' + occupiedName, 'utf8') === occupied
 const passed = kind === 'normal' ? error === null && persisted !== null && recovery === null
  : error !== null && fullOriginalPreserved && occupiedUnchanged
 rows.push({kind, output, error, persisted, recovery: recoveryRaw === null ? null : {...digest(recoveryRaw), file: recoveryName},
  fullOriginalPreserved, occupiedUnchanged, passed})
}
process.argv = originalArgv
const result = {scope: 'Small actual filesystem/XZ prefix-finalization seam, not original90 or full P1 execution; no business, browser or compatibility commands.',
 mode, label, prefixSource: digest(source), legacyExcerpt: mode === 'legacy' ? excerpt : null,
 actualNormalCreates: 1, businessCommands: 0, cases: rows, passed: rows.every(row => row.passed)}
writeFileSync(task + 'prefix-preservation-results-' + label + '.json', JSON.stringify(result, null, 2) + '\n', {flag: 'wx'})
console.log(JSON.stringify({mode, label, passed: result.passed, results: rows.map(row => ({kind: row.kind, passed: row.passed,
 fullOriginalPreserved: row.fullOriginalPreserved, occupiedUnchanged: row.occupiedUnchanged}))}))
if (!result.passed) process.exitCode = 1
