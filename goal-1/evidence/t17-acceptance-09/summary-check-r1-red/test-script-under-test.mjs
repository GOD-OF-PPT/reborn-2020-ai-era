import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {assertCriticalSummary} from '../../../scripts/course-critical-summary.ts'
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs'

const task = fileURLToPath(new URL('./', import.meta.url))
const root = fileURLToPath(new URL('../../../', import.meta.url))
const args = process.argv.slice(2)
if (args.length !== 2 || args[0] !== '--label' || !/^r[1-9][0-9]*-(red|green)$/.test(args[1])) throw Error('FRESH_SUMMARY_TEST_LABEL_REQUIRED')
const label = args[1], output = resolve(task, 'summary-check-' + label)
assertBrowserEvidenceWritable(task)
mkdirSync(output)
assertBrowserEvidenceWritable(output)
const sha = value => createHash('sha256').update(value).digest('hex')
const put = (name, raw) => {
 assertBrowserEvidenceWritable(output)
 const path = resolve(output, name)
 writeFileSync(path, raw, {flag: 'wx'})
 const stored = readFileSync(path)
 if (!stored.equals(Buffer.from(raw))) throw Error('SUMMARY_FIXTURE_OUTPUT_READBACK_CHANGED:' + name)
 return {file: name, bytes: stored.length, sha256: sha(stored)}
}
const putJson = (name, value) => put(name, JSON.stringify(value, null, 2) + '\n')
const helperRaw = readFileSync(resolve(root, 'scripts/course-critical-summary.ts'), 'utf8')
const verifierRaw = readFileSync(resolve(root, 'scripts/verify_course_critical_evidence.ts'), 'utf8')
const legacyStart = '// BEGIN ORIGINAL INLINE CONDITIONS'
const legacyEnd = '// END ORIGINAL INLINE CONDITIONS'
let legacyInlineExactCopy = null
if (helperRaw.includes(legacyStart)) {
 const extracted = helperRaw.slice(helperRaw.indexOf(legacyStart) + legacyStart.length, helperRaw.indexOf(legacyEnd)).trim()
 const original = verifierRaw.slice(verifierRaw.indexOf(' check(summary.registered ==='), verifierRaw.indexOf('\n} catch (caught) { setupErrors.push(String(caught)) }')).trim()
 legacyInlineExactCopy = extracted === original
 if (!legacyInlineExactCopy) throw Error('LEGACY_SUMMARY_INLINE_COPY_MUST_BE_EXACT')
 put('original-inline-conditions.txt', original + '\n')
}
if (label.endsWith('-red') && legacyInlineExactCopy !== true) throw Error('RED_MUST_EXECUTE_EXACT_ORIGINAL_INLINE_CONDITIONS')
const sources = {
 helper: put('helper-under-test.ts', helperRaw),
 verifier: put('verifier-under-test.ts', verifierRaw),
 testScript: put('test-script-under-test.mjs', readFileSync(fileURLToPath(import.meta.url), 'utf8')),
 plan: put('test-plan-under-test.md', readFileSync(resolve(task, 'summary-check-test-plan.md'), 'utf8')),
}
const registrationRaw = readFileSync(new URL('../t17-acceptance-04/course-shape-coverage-registration.json', import.meta.url), 'utf8')
const critical = JSON.parse(registrationRaw).critical
if (critical.length !== 45 || new Set(critical).size !== 45) throw Error('FIXTURE_ORIGINAL_45_IDS_REQUIRED')
const identities = ['technical_employee', 'content_employee'].map(backgroundId => ({name: backgroundId + '-t16-campaign-0', backgroundId, seed: 't16-campaign-0'}))
const descriptor = (name, text) => ({file: name, bytes: Buffer.byteLength(text), sha256: sha(text)})
const archive = (name, key) => ({encoding: 'xz', file: name,
 storedBytes: 32 + key.length, storedSha256: sha('synthetic-xz-only:' + key),
 containerBytes: 64 + key.length, containerSha256: sha('synthetic-container-only:' + key),
 members: [{name: 'synthetic-metadata-only.json', bytes: key.length, sha256: sha(key)}]})
const expectedRows = identities.flatMap(identity => critical.map((caseId, index) => {
 const rowId = identity.name + '--' + caseId, folder = identity.name + '/critical-' + String(index + 1).padStart(2, '0')
 const acceptedCommands = 2 + index % 5, rejectedCommands = index % 3, targetChecks = 3 + index % 4
 const exactAttemptReplay = {status: 'verified-exact-actual-history', accepted: acceptedCommands,
  rejected: rejectedCommands, milestones: targetChecks, terminalMatched: true}
 const archiveRef = archive('case-evidence.xz', rowId)
 const caseIndexText = JSON.stringify({classification: 'synthetic metadata fixture only', rowId, identity,
  caseId, acceptedCommands, rejectedCommands, targetChecks, archive: archiveRef, exactAttemptReplay}) + '\n'
 return {rowId, identity: identity.name, caseId, folder, sourceRevision: 69 + index,
  status: 'target_verified', error: null, acceptedCommands, rejectedCommands, targetChecks,
  revision: 69 + index + acceptedCommands, date: '2025-01-14',
  evidence: descriptor(folder + '/case-index.json', caseIndexText), archive: archiveRef, recovery: null, exactAttemptReplay}
}))
const expected = {rows: expectedRows, prefixProofs: identities.map((identity, index) => ({
 identity: identity.name, status: 'verified', commands: 145 + index, originalMilestones: 25,
 index: descriptor(identity.name + '/prefix-index.json', 'synthetic prefix index only:' + identity.name),
 archive: archive('prefix-evidence.xz', identity.name),
})), sourceHashes: {'scripts/synthetic-source-only.ts': sha('synthetic source only')},
 inputHashes: {'goal-1/evidence/synthetic-original-only.json': sha('synthetic original only')}}
const summary = {
 scope: 'P3 original90 only. Exact target assertions, command acceptance/rejection, full original text and accounting; P4/whole5b/T17/goal and compatibility/human/assets remain incomplete.',
 registered: 90, recorded: 90, attempted: 90, targetVerified: 90, failed: 0, unexecutedDueToFatal: 0,
 actualAcceptedCommands: expectedRows.reduce((n, row) => n + row.acceptedCommands, 0),
 actualRejectedCommands: expectedRows.reduce((n, row) => n + row.rejectedCommands, 0),
 allOriginal90TargetsVerified: true, fatal: null, finalGuardError: null,
 prefixProofs: expected.prefixProofs, sourceHashes: expected.sourceHashes, inputHashes: expected.inputHashes, results: expectedRows,
}
const clone = value => JSON.parse(JSON.stringify(value))
const rowError = 'ORIGINAL_SUMMARY_ROW_NOT_INDEPENDENTLY_REPRODUCED:'
const cases = [{id: 'valid-full-original90-metadata', mutate() {}, expected: 'accepted', errorPrefix: null}]
const bad = (id, mutate, errorPrefix = rowError) => cases.push({id, mutate, expected: 'rejected', errorPrefix})
bad('wrong-summary-identity', s => {s.results[0].identity = identities[1].name})
bad('wrong-summary-case-id', s => {s.results[0].caseId = 'wrong-case'})
bad('wrong-summary-folder', s => {s.results[0].folder = 'wrong-folder'})
bad('wrong-summary-source-revision', s => {s.results[0].sourceRevision++})
bad('wrong-summary-archive-reference', s => {s.results[0].archive.file = 'wrong-archive.xz'})
bad('wrong-summary-archive-hash', s => {s.results[0].archive.storedSha256 = sha('wrong archive')})
bad('wrong-summary-index-reference', s => {s.results[0].evidence.file = 'wrong-index.json'})
bad('wrong-summary-index-bytes', s => {s.results[0].evidence.bytes++})
bad('wrong-summary-index-hash', s => {s.results[0].evidence.sha256 = sha('wrong index')})
bad('wrong-summary-terminal-revision', s => {s.results[0].revision++})
bad('wrong-summary-terminal-date', s => {s.results[0].date = '2025-01-15'})
bad('wrong-summary-target-count', s => {s.results[0].targetChecks++})
bad('summary-has-error', s => {s.results[0].error = 'real failure retained'})
bad('summary-has-recovery', s => {s.results[0].recovery = {file: 'failed.json', bytes: 1, sha256: sha('failed')}})
bad('wrong-summary-exact-replay', s => {s.results[0].exactAttemptReplay.terminalMatched = false})
bad('wrong-summary-source-binding', s => {s.sourceHashes['scripts/synthetic-source-only.ts'] = sha('changed source')}, 'ORIGINAL_SUMMARY_SOURCE_BINDING_CHANGED')
bad('wrong-summary-input-binding', s => {s.inputHashes['goal-1/evidence/synthetic-original-only.json'] = sha('changed input')}, 'ORIGINAL_SUMMARY_INPUT_BINDING_CHANGED')
bad('wrong-prefix-status', s => {s.prefixProofs[0].status = 'failed'}, 'ORIGINAL_SUMMARY_PREFIX_PROOFS_CHANGED')
bad('wrong-prefix-index-reference', s => {s.prefixProofs[0].index.sha256 = sha('wrong prefix index')}, 'ORIGINAL_SUMMARY_PREFIX_PROOFS_CHANGED')
bad('wrong-prefix-archive-reference', s => {s.prefixProofs[0].archive.file = 'wrong-prefix.xz'}, 'ORIGINAL_SUMMARY_PREFIX_PROOFS_CHANGED')
bad('wrong-all-targets-flag', s => {s.allOriginal90TargetsVerified = false}, 'ORIGINAL_SUMMARY_ALL_TARGETS_FLAG_CHANGED')
bad('unknown-summary-row-field', s => {s.results[0].unknownEvidence = 'not registered'})
bad('wrong-summary-row-order', s => {[s.results[0], s.results[1]] = [s.results[1], s.results[0]]})
bad('wrong-summary-scope', s => {s.scope = 'whole game accepted'}, 'ORIGINAL_SUMMARY_SCOPE_CHANGED')
bad('unknown-summary-top-level-field', s => {s.unknownAcceptance = true}, 'ORIGINAL_SUMMARY_EXACT_FIELDS_CHANGED')
bad('wrong-total-target-count', s => {s.targetVerified--}, 'FULL_ORIGINAL_COLLECTOR_TOTALS_DISAGREE_WITH_INDEPENDENT_RESULTS')
bad('wrong-total-accepted-count', s => {s.actualAcceptedCommands++}, 'ORIGINAL_REAL_ATTEMPT_TOTALS_CHANGED')
bad('missing-summary-row', s => {s.results.pop()}, 'COMPLETE_ORIGINAL_SUMMARY_ROWS_REQUIRED')
bad('duplicate-summary-row', s => {s.results[1] = clone(s.results[0])})
bad('failed-summary-row', s => {s.results[0].status = 'failed'})
bad('summary-fatal-retained', s => {s.fatal = 'original fatal'}, 'FULL_ORIGINAL_COLLECTOR_TOTALS_DISAGREE_WITH_INDEPENDENT_RESULTS')
const fixture = putJson('complete-synthetic-metadata-fixture.json', {classification: 'Synthetic complete90 metadata only; no GameRun, real archive or original scenario execution.',
 original45Registration: {bytes: Buffer.byteLength(registrationRaw), sha256: sha(registrationRaw)}, expected, summary,
 cases: cases.map(({id, expected, errorPrefix}) => ({id, expected, errorPrefix}))})
const results = cases.map(test => {
 const value = clone(summary)
 test.mutate(value)
 let result = null, error = null
 try {result = assertCriticalSummary(value, clone(expected))} catch (caught) {error = String(caught)}
 const actual = error === null ? 'accepted' : 'rejected'
 return {id: test.id, expected: test.expected, actual, errorPrefix: test.errorPrefix,
  passed: actual === test.expected && (test.errorPrefix === null || error?.includes(test.errorPrefix) === true),
  error, result, changedSummarySha256: sha(JSON.stringify(value))}
})
const report = {label, classification: 'Pure synthetic metadata regression; not original90 GameRun or browser acceptance.',
 legacyInlineExactCopy, sources, fixture, cases: results.length, passed: results.filter(r => r.passed).length,
 failed: results.filter(r => !r.passed).length, results}
const reportRef = putJson('results.json', report)
console.log(JSON.stringify({...reportRef, cases: report.cases, passed: report.passed, failed: report.failed,
 legacyInlineExactCopy, rejectedMutations: results.filter(r => r.expected === 'rejected' && r.actual === 'rejected').length}))
if (report.failed !== 0) process.exitCode = 1
