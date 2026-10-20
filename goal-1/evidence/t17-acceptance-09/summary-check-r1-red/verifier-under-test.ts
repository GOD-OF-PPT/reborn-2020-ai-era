import {existsSync, lstatSync, readFileSync, readdirSync, realpathSync} from 'node:fs'
import {join, relative, resolve} from 'node:path'
import {createCampaignCodec} from '../src/application/campaign.ts'
import type {GameRun} from '../src/core/run-types.ts'
import {COURSE_CRITICAL_CASES} from '../src/testing/course-critical-cases.ts'
import {criticalAuthority, earnCriticalPrefix} from './course-critical-prefix.ts'
import {runCriticalBranch, type CriticalAttempt} from './course-critical-run.ts'
import {ROOT, TASK, IDENTITIES, CriticalEvidenceWriter, check, criticalSourceNames, equal, guardHashes,
 memberRaw, object, putMember, readJson, readText, sha, unpackArchive, type CriticalArchive} from './course-critical-evidence.ts'

const requestedInput = process.env.COURSE_CRITICAL_INPUT_DIRECTORY
check(requestedInput, 'EXPLICIT_COURSE_CRITICAL_INPUT_DIRECTORY_REQUIRED')
const input = resolve(ROOT, requestedInput), inputName = relative(ROOT, input).split('\\').join('/')
check(new RegExp('^' + TASK + '/matrix-r[1-9][0-9]*$').test(inputName) && realpathSync(input) === input &&
 lstatSync(input).isDirectory() && !lstatSync(input).isSymbolicLink(), 'FIXED_REGULAR_ROOT09_MATRIX_INPUT_REQUIRED')
const writer = new CriticalEvidenceWriter('audit', 'course-critical-verification.json')
writer.text('progress.jsonl', '')
const progress = (value: unknown) => { writer.append('progress.jsonl', value); console.log(JSON.stringify(value)) }
function snapshot(directory: string): Record<string, string> {
 return Object.fromEntries(readdirSync(join(ROOT, directory), {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))
  .flatMap(entry => {
   const name = directory + '/' + entry.name
   check(!entry.isSymbolicLink(), 'MATRIX_INPUT_SYMLINK_FORBIDDEN:' + name)
   if (entry.isDirectory()) return Object.entries(snapshot(name))
   check(entry.isFile(), 'MATRIX_INPUT_NONREGULAR_FORBIDDEN:' + name)
   return [[name, sha(readFileSync(join(ROOT, name)))]]
  }))
}
const inputBefore = snapshot(inputName)
const seal = readJson(inputName + '/sealed-evidence.json') as {selfExcluded: unknown; files: Record<string, {bytes: number; sha256: string}>}
equal(seal.selfExcluded, ['sealed-evidence.json'], 'SELF_EXCLUDED_COMPLETE_MATRIX_SEAL_REQUIRED')
equal(Object.keys(inputBefore).sort(), [...Object.keys(seal.files).map(name => inputName + '/' + name), inputName + '/sealed-evidence.json'].sort(), 'SEALED_MATRIX_EXACT_LEAF_SET_CHANGED')
for (const [name, evidence] of Object.entries(seal.files)) {
 const raw = readFileSync(join(input, name))
 check(raw.length === evidence.bytes && sha(raw) === evidence.sha256, 'SEALED_MATRIX_ORIGINAL_BYTES_CHANGED:' + name)
}
const authority = criticalAuthority(COURSE_CRITICAL_CASES), definitions = authority.ordered
const header = readJson(inputName + '/registration.json') as {registered: unknown; sourceHashes: Record<string, string>; inputHashes: Record<string, string>; strategyTexts: Record<string, string>}
const expectedRows = IDENTITIES.flatMap(identity => definitions.map((definition, index) => ({
 rowId: identity.name + '--' + definition.id, identity: identity.name, backgroundId: identity.backgroundId,
 seed: identity.seed, caseId: definition.id, sourceRevision: definition.sourceRevision,
 purpose: definition.purpose, requiredChecks: definition.requiredChecks,
 folder: identity.name + '/critical-' + String(index + 1).padStart(2, '0'),
})))
equal(header.registered, expectedRows, 'INDEPENDENT_EXACT_ORIGINAL90_REGISTRATION_CHANGED')
equal(Object.keys(header.sourceHashes).sort(), criticalSourceNames(authority.originalRuntimeHashes), 'REQUIRED_CRITICAL_SOURCE_BINDING_SET_CHANGED')
equal(header.inputHashes, authority.inputHashes, 'ORIGINAL_CRITICAL_INPUT_BINDINGS_CHANGED')
for (const [name, raw] of Object.entries(header.strategyTexts)) check(readText(name) === raw, 'ORIGINAL_REGISTERED_CRITICAL_STRATEGY_TEXT_CHANGED:' + name)
const guard = () => { guardHashes(header.sourceHashes); guardHashes(header.inputHashes); guardHashes(inputBefore) }
guard()
writer.json('audit-registration.json', {scope: 'Independent second execution from Create with the same registered scenario assertions; exact original attempt journals, all raw members and independent accounting are recomputed. Static cross-review assesses target semantics separately. No browser, compatibility, human or whole-goal claim.',
 inputDirectory: inputName, expectedRows, sourceHashes: header.sourceHashes, inputHashes: header.inputHashes, fullOriginalInputHashes: inputBefore})
const codec = createCampaignCodec(), rows: unknown[] = [], prefixAudits: unknown[] = [], setupErrors: string[] = []
let verified = 0, invalid = 0, missing = 0, accepted = 0, rejected = 0, fullMembers = 0, matchedMilestones = 0
try {
 for (const identity of IDENTITIES) {
  guard(); writer.requireSpace(2 * 1024 * 1024 * 1024)
  const original = authority.prefixes.find(value => value.identity.name === identity.name)
  check(original, 'ORIGINAL_NORMAL_SEED0_PREFIX_REQUIRED')
  progress({type: 'independent-prefix-start', identity: identity.name})
  const prefixIndex = readJson(inputName + '/' + identity.name + '/prefix-index.json') as {
   identity: unknown; record: ReturnType<typeof earnCriticalPrefix>['record']; archive: CriticalArchive}
  equal(prefixIndex.identity, identity, 'PRODUCER_ORIGINAL_PREFIX_IDENTITY_CHANGED')
  const producerPrefix = unpackArchive(inputName + '/' + identity.name + '/prefix-evidence.xz', prefixIndex.archive)
  const own = earnCriticalPrefix(writer, original, definitions, progress)
  check(memberRaw(producerPrefix, own.record.initial) === codec.export(own.initial) &&
   memberRaw(producerPrefix, own.record.final) === own.raw, 'INDEPENDENT_FULL_CREATE_INITIAL_OR_FINAL_CHANGED')
  equal(prefixIndex.record, own.record, 'INDEPENDENT_COMPLETE_PREFIX_RECORD_CHANGED')
  check(producerPrefix.get('prefix-record.json') === JSON.stringify(own.record, null, 2) + '\n', 'FULL_ORIGINAL_PREFIX_RECORD_BYTES_CHANGED')
  check(producerPrefix.get('prefix-attempts.jsonl') === readText(writer.name + '/' + identity.name + '/prefix-attempts.jsonl'), 'FULL_ORIGINAL_PREFIX_JOURNAL_BYTES_CHANGED')
  for (const checkpoint of own.record.checkpoints) check(memberRaw(producerPrefix, checkpoint.raw) === own.checkpoints.get(checkpoint.revision), 'FULL_ORIGINAL_EARLY_CHECKPOINT_CHANGED')
  equal([...producerPrefix.keys()].sort(), ['initial.json', 'final.json', 'prefix-record.json', 'prefix-attempts.jsonl',
   ...own.record.checkpoints.map(checkpoint => checkpoint.raw.member)].sort(), 'ORIGINAL_PREFIX_COMPLETE_MEMBER_SET_CHANGED')
  prefixAudits.push({identity: identity.name, status: 'verified', actualFromCreateCommands: own.record.acceptedCommands,
   originalMilestones: own.record.originalMilestonesMatched.length, originalRawMembers: producerPrefix.size, proof: own.index})
  progress({type: 'independent-prefix-complete', identity: identity.name, originalMilestones: 25, actualCommands: own.record.acceptedCommands})
  for (const registered of expectedRows.filter(row => row.identity === identity.name)) {
   guard(); writer.requireSpace()
   const position = expectedRows.findIndex(row => row.rowId === registered.rowId) + 1
   const definition = definitions.find(value => value.id === registered.caseId)
   check(definition, 'INDEPENDENT_ORIGINAL_CRITICAL_DEFINITION_MISSING')
   const ownedSource = own.checkpoints.get(registered.sourceRevision)
   check(ownedSource, 'INDEPENDENT_ACTUAL_EARLY_SOURCE_MISSING')
   const indexName = inputName + '/' + registered.folder + '/case-index.json'
   if (!existsSync(join(ROOT, indexName))) {
    missing++; rows.push({...registered, status: 'missing', error: 'ORIGINAL_CASE_INDEX_MISSING'})
    progress({type: 'case-audit', rowId: registered.rowId, status: 'missing'})
    continue
   }
   const actualMembers = new Map<string, string>(), actualJournal: string[] = []
   let actualRun: GameRun = codec.import(ownedSource)
   let result: ReturnType<typeof runCriticalBranch> | null = null
   try {
    const index = readJson(indexName) as typeof registered & {status: string; error: string | null;
     acceptedCommands: number; rejectedCommands: number; targetChecks: number; exactAttemptReplay: unknown; archive: CriticalArchive}
    equal(Object.fromEntries(Object.keys(registered).map(key => [key, object(index, 'CRITICAL_INDEX_REQUIRED')[key]])), registered, 'ORIGINAL_CASE_IDENTITY_OR_TARGET_CHANGED')
    check(index.status === 'target_verified' && index.error === null, 'COLLECTOR_TARGET_NOT_VERIFIED')
    const members = unpackArchive(inputName + '/' + registered.folder + '/case-evidence.xz', index.archive)
    const originalRecordRaw = members.get('case-record.json')
    check(originalRecordRaw !== undefined, 'FULL_ORIGINAL_CRITICAL_CASE_RECORD_REQUIRED')
    const originalRecord = JSON.parse(originalRecordRaw) as ReturnType<typeof runCriticalBranch>['record']
    check(memberRaw(members, originalRecord.source) === ownedSource, 'ORIGINAL_CASE_MUST_USE_ACTUALLY_EARNED_EARLY_SOURCE')
    const journal = (event: string, attempt: CriticalAttempt) => actualJournal.push(JSON.stringify({event, ...attempt}) + '\n')
    result = runCriticalBranch(definition, ownedSource, {
     before(attempt) { journal('attempt', attempt) },
     after(attempt, run) { actualRun = run; journal('result', attempt) },
    }, actualMembers)
    actualRun = result.run
    check(result.record.status === 'target_verified' && result.record.error === null, 'INDEPENDENT_REGISTERED_TARGET_ASSERTION_FAILED:' + String(result.record.error))
    putMember(actualMembers, 'command-attempts.jsonl', actualJournal.join(''))
    putMember(actualMembers, 'case-record.json', JSON.stringify(result.record, null, 2) + '\n')
    check(actualMembers.get('case-record.json') === originalRecordRaw, 'COMPLETE_ORIGINAL_TARGET_RECORD_OR_ACCOUNTING_BYTES_CHANGED')
    equal([...actualMembers.keys()].sort(), [...members.keys()].sort(), 'INDEPENDENT_EXACT_FULL_CASE_MEMBER_SET_CHANGED')
    for (const [name, raw] of members) check(actualMembers.get(name) === raw, 'INDEPENDENT_FULL_ORIGINAL_MEMBER_BYTES_CHANGED:' + name)
    check(readText(inputName + '/' + registered.folder + '/command-attempts.jsonl') === actualJournal.join(''), 'ORIGINAL_EXTERNAL_JOURNAL_BYTES_CHANGED')
    check(index.acceptedCommands === result.record.acceptedCommands && index.rejectedCommands === result.record.rejectedCommands &&
     index.targetChecks === result.record.observations.length, 'INDEPENDENT_REAL_ATTEMPT_OR_TARGET_COUNTS_CHANGED')
    equal(index.exactAttemptReplay, {status: 'verified-exact-actual-history', accepted: result.record.acceptedCommands,
     rejected: result.record.rejectedCommands, milestones: result.record.milestones.length, terminalMatched: true}, 'COLLECTOR_EXACT_REPLAY_TOTALS_DISAGREE_WITH_INDEPENDENT_ACTUAL_EXECUTION')
    const proof = writer.json('case-' + String(position).padStart(2, '0') + '.json', {...registered, status: 'verified',
     source: result.record.source, terminal: result.record.terminal, archive: index.archive,
     actualAcceptedCommands: result.record.acceptedCommands, actualRejectedCommands: result.record.rejectedCommands,
     actualTargetAssertions: result.record.observations, completeOriginalMembersCompared: index.archive.members,
     independentlyRecomputedMilestones: result.record.milestones.length,
     finalMoney: result.record.finalMoney, exactFullRecordBytes: {bytes: Buffer.byteLength(originalRecordRaw), sha256: sha(originalRecordRaw)},
     scope: 'Same registered target assertions independently re-executed from an independently earned normal source; complete original requests, expected reasons, raw and accounting matched. This does not prove P4, UI or whole-goal completion.'})
    verified++; accepted += result.record.acceptedCommands; rejected += result.record.rejectedCommands
    fullMembers += members.size; matchedMilestones += result.record.milestones.length
    rows.push({...registered, status: 'verified', proof, accepted: result.record.acceptedCommands, rejected: result.record.rejectedCommands})
    progress({type: 'case-audit', rowId: registered.rowId, status: 'verified', accepted: result.record.acceptedCommands, rejected: result.record.rejectedCommands, proof})
   } catch (caught) {
    invalid++
    const error = String(caught)
    const recovery = writer.json('case-' + String(position).padStart(2, '0') + '-failure.json', {...registered,
     status: 'invalid', error, actualRecord: result?.record ?? null, lastActualOriginalRaw: codec.export(actualRun),
     completeAvailableOriginalMembers: [...actualMembers].map(([name, raw]) => ({name, raw})), actualJournal})
    rows.push({...registered, status: 'invalid', error, recovery})
    progress({type: 'case-audit', rowId: registered.rowId, status: 'invalid', error, recovery})
   }
   guard()
  }
 }
 const summary = readJson(inputName + '/course-critical-results.json') as {registered: number; recorded: number;
  attempted: number; targetVerified: number; failed: number; unexecutedDueToFatal: number;
  actualAcceptedCommands: number; actualRejectedCommands: number; results: unknown[]; fatal: unknown; finalGuardError: unknown}
 check(summary.registered === 90 && summary.recorded === 90 && summary.attempted === 90 && summary.targetVerified === verified &&
  summary.failed === 0 && summary.unexecutedDueToFatal === 0 && summary.fatal === null && summary.finalGuardError === null,
  'FULL_ORIGINAL_COLLECTOR_TOTALS_DISAGREE_WITH_INDEPENDENT_RESULTS')
 check(summary.actualAcceptedCommands === accepted && summary.actualRejectedCommands === rejected, 'ORIGINAL_REAL_ATTEMPT_TOTALS_CHANGED')
 check(summary.results.length === 90, 'COMPLETE_ORIGINAL_SUMMARY_ROWS_REQUIRED')
 for (const registered of expectedRows) {
  const originalRow = summary.results.map(value => object(value, 'ORIGINAL_SUMMARY_ROW_REQUIRED')).find(value => value.rowId === registered.rowId)
  const audited = rows.map(value => object(value, 'AUDIT_ROW_REQUIRED')).find(value => value.rowId === registered.rowId)
  check(originalRow && audited && originalRow.status === 'target_verified' && audited.status === 'verified' &&
   originalRow.acceptedCommands === audited.accepted && originalRow.rejectedCommands === audited.rejected,
   'ORIGINAL_SUMMARY_ROW_NOT_INDEPENDENTLY_REPRODUCED:' + registered.rowId)
 }
} catch (caught) { setupErrors.push(String(caught)) }
try { guard(); equal(snapshot(inputName), inputBefore, 'COMPLETE_ORIGINAL_MATRIX_TREE_CHANGED_DURING_AUDIT') }
catch (caught) { setupErrors.push('FINAL_GUARD:' + String(caught)) }
for (const expected of expectedRows) if (!rows.some(value => object(value, 'AUDIT_RESULT_REQUIRED').rowId === expected.rowId)) {
 missing++; rows.push({...expected, status: 'missing', error: 'NOT_INSPECTED_AFTER_SETUP_OR_GUARD_FAILURE'})
}
const passed = verified === 90 && invalid === 0 && missing === 0 && prefixAudits.length === 2 && setupErrors.length === 0
writer.json('course-critical-verification.json', {scope: 'P3 original90 independent re-execution and full original-byte/accounting audit only; original288/supplemental72 and P4/whole5b/T17/goal remain distinct. No compatibility, browser, assets or human-playtest acceptance.',
 inputDirectory: inputName, registered: 90, verified, invalid, missing, accepted, rejected, fullMembers, matchedMilestones,
 allOriginal90TargetsVerified: passed, prefixAudits, sourceHashes: header.sourceHashes, inputHashes: header.inputHashes,
 originalInputFileSetAndHashes: inputBefore, setupErrors, rows})
progress({type: 'complete', registered: 90, verified, invalid, missing, allOriginal90TargetsVerified: passed, setupErrors})
if (!passed) process.exitCode = 1
