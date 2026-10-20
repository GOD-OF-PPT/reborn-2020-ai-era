import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {join} from 'node:path'
import {createCampaignCodec} from '../src/application/campaign.ts'
import type {GameRun} from '../src/core/run-types.ts'
import {COURSE_CRITICAL_CASES} from '../src/testing/course-critical-cases.ts'
import {criticalAuthority, earnCriticalPrefix} from './course-critical-prefix.ts'
import {runCriticalBranch, replayCriticalAttempts, type CriticalAttempt, type CriticalMilestone} from './course-critical-run.ts'
import {ROOT, IDENTITIES, CRITICAL_STRATEGIES, CriticalEvidenceWriter, archiveMembers, check, guardHashes,
 criticalSourceNames, hashFiles, putMember, sha, type FileRef, type CriticalArchive} from './course-critical-evidence.ts'

const writer = new CriticalEvidenceWriter('matrix', 'course-critical-results.json')
const authority = criticalAuthority(COURSE_CRITICAL_CASES)
const strategies = CRITICAL_STRATEGIES
const sourceHashes = hashFiles(criticalSourceNames(authority.originalRuntimeHashes))
const guard = () => { guardHashes(sourceHashes); guardHashes(authority.inputHashes) }
const definitions = authority.ordered
const registered = IDENTITIES.flatMap(identity => definitions.map((definition, index) => ({
 rowId: identity.name + '--' + definition.id, identity: identity.name, backgroundId: identity.backgroundId,
 seed: identity.seed, caseId: definition.id, sourceRevision: definition.sourceRevision,
 purpose: definition.purpose, requiredChecks: definition.requiredChecks,
 folder: identity.name + '/critical-' + String(index + 1).padStart(2, '0'),
})))
check(registered.length === 90 && new Set(registered.map(row => row.rowId)).size === 90, 'EXACT_ORIGINAL_90_REGISTRATION_REQUIRED')
check(sha(readFileSync(join(ROOT, 'goal-1/input.md'))) === '20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1', 'ORIGINAL_GOAL_INPUT_CHANGED')
writer.json('registration.json', {scope: 'P3 original 45 critical conditions by the two original seed0 backgrounds, exactly 90. Original 288 and supplemental72 are retained separately; no P4, browser, compatibility or human acceptance.',
 baseCommit: execFileSync('rtk', ['proxy', 'git', 'rev-parse', 'HEAD'], {cwd: ROOT, encoding: 'utf8'}).trim(),
 originalRegistrationCommit: authority.originalRegistrationCommit, originalRegistration: authority.originalRegistration,
 registered, sourceHashes, inputHashes: authority.inputHashes,
 strategyTexts: Object.fromEntries(strategies.map(name => [name, readFileSync(join(ROOT, name), 'utf8')])),
 fatalPolicy: 'Unknown exceptions, missed targets and output failures remain failed; later registered rows are explicitly unexecuted. No seed replacement, rule change, hidden outcome policy or generic finite downgrade.',
 replayScope: 'Actual from-Create fixed prefix, separate exact envelope replay, full raw/money checks. Later independent audit also re-executes the same registered scenario target assertions; target semantics receive separate static cross-review.'})
writer.text('progress.jsonl', '')
const progress = (value: unknown) => { writer.append('progress.jsonl', value); console.log(JSON.stringify(value)) }
const codec = createCampaignCodec()
interface ResultRow {
 rowId: string; identity: string; caseId: string; folder: string; sourceRevision: number
 status: 'target_verified' | 'failed' | 'unexecuted_due_to_fatal'; error: string | null
 acceptedCommands: number; rejectedCommands: number; targetChecks: number
 revision: number | null; date: string | null; evidence: FileRef | null; archive: CriticalArchive | null
 recovery: FileRef | null; exactAttemptReplay: unknown
}
const results: ResultRow[] = [], prefixProofs: unknown[] = []
let fatal: string | null = null
for (const identity of IDENTITIES) {
 let prefix: ReturnType<typeof earnCriticalPrefix> | null = null
 if (fatal === null) {
  try {
   guard()
   const freeBytes = writer.requireSpace(2 * 1024 * 1024 * 1024)
   progress({type: 'prefix-start', identity: identity.name, freeBytes})
   const original = authority.prefixes.find(value => value.identity.name === identity.name)
   check(original, 'REGISTERED_ORIGINAL_CRITICAL_PREFIX_REQUIRED')
   prefix = earnCriticalPrefix(writer, original, definitions, progress)
   prefixProofs.push({identity: identity.name, status: 'verified', commands: prefix.record.acceptedCommands,
    originalMilestones: prefix.record.originalMilestonesMatched.length, index: prefix.index, archive: prefix.archive})
   progress({type: 'prefix-complete', identity: identity.name, commands: prefix.record.acceptedCommands,
    originalMilestones: prefix.record.originalMilestonesMatched.length})
  } catch (caught) {
   fatal = String(caught)
   prefixProofs.push({identity: identity.name, status: 'failed', error: fatal})
   progress({type: 'prefix-failed', identity: identity.name, error: fatal})
  }
 }
 for (const row of registered.filter(value => value.identity === identity.name)) {
  const result: ResultRow = {rowId: row.rowId, identity: row.identity, caseId: row.caseId, folder: row.folder,
   sourceRevision: row.sourceRevision, status: 'unexecuted_due_to_fatal', error: fatal,
   acceptedCommands: 0, rejectedCommands: 0, targetChecks: 0, revision: null, date: null,
   evidence: null, archive: null, recovery: null, exactAttemptReplay: null}
  results.push(result)
  if (fatal !== null || prefix === null) continue
  const definition = definitions.find(value => value.id === row.caseId)
  check(definition, 'REGISTERED_CRITICAL_TARGET_MISSING')
  const sourceRaw = prefix.checkpoints.get(row.sourceRevision)
  check(sourceRaw, 'ACTUALLY_EARNED_EARLY_CRITICAL_CHECKPOINT_MISSING')
  const members = new Map<string, string>(), actualAttempts: CriticalAttempt[] = [], actualMilestones: CriticalMilestone[] = []
  let lastActual: GameRun = codec.import(sourceRaw), execution: ReturnType<typeof runCriticalBranch> | null = null
  let phase = 'source-and-space-guard'
  try {
   guard(); const freeBytes = writer.requireSpace()
   writer.mkdir(row.folder); writer.text(row.folder + '/command-attempts.jsonl', '')
   progress({type: 'critical-start', ...row, freeBytes})
   phase = 'actual-registered-scenario'
   execution = runCriticalBranch(definition, sourceRaw, {
    before(attempt) {
     actualAttempts.push({...attempt})
     writer.append(row.folder + '/command-attempts.jsonl', {event: 'attempt', ...attempt})
    },
    after(attempt, run) {
     lastActual = run
     const started = actualAttempts.at(-1)
     check(started?.sequence === attempt.sequence, 'JOURNAL_RESULT_WITHOUT_ACTUAL_ATTEMPT')
     Object.assign(started, attempt)
     writer.append(row.folder + '/command-attempts.jsonl', {event: 'result', ...attempt})
    },
    milestone(milestone) { actualMilestones.push(milestone) },
   }, members)
   lastActual = execution.run
   check(execution.record.status === 'target_verified' || execution.record.status === 'failed', 'KNOWN_CRITICAL_EXECUTION_STATUS_REQUIRED')
   result.status = execution.record.status
   result.error = execution.record.error
   result.acceptedCommands = execution.record.acceptedCommands; result.rejectedCommands = execution.record.rejectedCommands
   result.targetChecks = execution.record.observations.length
   result.revision = execution.record.finalRevision; result.date = execution.record.finalDate
   phase = 'separate-exact-attempt-replay'
   result.exactAttemptReplay = replayCriticalAttempts(execution.record, members)
   phase = 'full-archive'
   putMember(members, 'command-attempts.jsonl', readFileSync(writer.path(row.folder + '/command-attempts.jsonl'), 'utf8'))
   putMember(members, 'case-record.json', JSON.stringify(execution.record, null, 2) + '\n')
   result.archive = archiveMembers(writer, row.folder + '/case-evidence.xz', members)
   result.evidence = writer.json(row.folder + '/case-index.json', {...row, status: result.status,
    error: result.error, acceptedCommands: result.acceptedCommands, rejectedCommands: result.rejectedCommands,
    targetChecks: result.targetChecks, exactAttemptReplay: result.exactAttemptReplay, archive: result.archive})
   guard()
   if (result.status !== 'target_verified') fatal = result.error ?? 'REGISTERED_CRITICAL_TARGET_NOT_VERIFIED'
   progress({type: 'critical-complete', ...result})
  } catch (caught) {
   result.status = 'failed'; result.error = String(caught); fatal = result.error
   result.acceptedCommands = actualAttempts.filter(attempt => attempt.status === 'accepted').length
   result.rejectedCommands = actualAttempts.filter(attempt => attempt.status === 'rejected').length
   result.revision = lastActual.revision; result.date = lastActual.timeline.cursor.date
   try {
    if (!members.has('last-original.json')) putMember(members, 'last-original.json', codec.export(lastActual))
    result.recovery = writer.json(row.folder + '/case-failure-recovery.json', {row, phase, error: result.error,
     actualAttempts, actualMilestones, executionRecord: execution?.record ?? null,
     completeOriginalMembers: [...members].map(([name, raw]) => ({name, raw})),
     scope: 'Complete available actual original text retained after failure; this is not a verified target or complete audit.'})
   } catch (recoveryError) { console.error(JSON.stringify({type: 'critical-recovery-output-failed', rowId: row.rowId, error: String(recoveryError), originalError: result.error})) }
   try { progress({type: 'critical-failed', phase, ...result}) }
   catch (progressError) { console.error(JSON.stringify({type: 'critical-failure-progress-output-failed', error: String(progressError), originalError: result.error})) }
  }
 }
}
let finalGuardError: string | null = null
try { guard() } catch (caught) { finalGuardError = String(caught); fatal ??= finalGuardError }
const count = (status: ResultRow['status']) => results.filter(row => row.status === status).length
const summary = {scope: 'P3 original90 only. Exact target assertions, command acceptance/rejection, full original text and accounting; P4/whole5b/T17/goal and compatibility/human/assets remain incomplete.',
 registered: 90, recorded: results.length, attempted: results.filter(row => row.status !== 'unexecuted_due_to_fatal').length,
 targetVerified: count('target_verified'), failed: count('failed'), unexecutedDueToFatal: count('unexecuted_due_to_fatal'),
 actualAcceptedCommands: results.reduce((total, row) => total + row.acceptedCommands, 0),
 actualRejectedCommands: results.reduce((total, row) => total + row.rejectedCommands, 0),
 allOriginal90TargetsVerified: count('target_verified') === 90 && fatal === null,
 fatal, finalGuardError, prefixProofs, sourceHashes, inputHashes: authority.inputHashes, results}
writer.json('course-critical-results.json', summary)
progress({type: 'complete', registered: 90, targetVerified: summary.targetVerified, failed: summary.failed,
 unexecutedDueToFatal: summary.unexecutedDueToFatal, fatal})
if (!summary.allOriginal90TargetsVerified) process.exitCode = 1
