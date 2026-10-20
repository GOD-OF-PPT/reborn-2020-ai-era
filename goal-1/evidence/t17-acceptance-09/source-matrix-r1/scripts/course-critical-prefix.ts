import {createCampaignCodec} from '../src/application/campaign.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import type {CommandEnvelope} from '../src/core/run-types.ts'
import type {CourseCriticalDefinition} from '../src/testing/course-critical-context.ts'
import {BASE_COMMIT, IDENTITIES, ORIGINAL_REGISTRATION, PREFIX_DIRECTORY, CriticalEvidenceWriter,
 anchoredText, archiveMembers, check, commandsOf, createFrom, equal, guardHashes, hashFiles,
 putMember, readText, sha, strict, type FileRef, type MemberRef} from './course-critical-evidence.ts'

interface OriginalMilestone extends FileRef {readonly name: string; readonly revision: number; readonly date: string}
interface OriginalPrefix {
 readonly name: string; readonly backgroundId: string; readonly seed: string; readonly status: string
 readonly initial: FileRef; readonly final: FileRef; readonly commands: readonly CommandEnvelope[]
 readonly milestones: readonly OriginalMilestone[]; readonly fullCreateAndMilestoneBytesEqual: boolean
}
interface OriginalSummary {
 readonly registered: number; readonly completed: number; readonly allExecutedBytesEqual: boolean
 readonly sourceHashes: Record<string, string>; readonly results: readonly OriginalPrefix[]
}
export function criticalAuthority(definitions: readonly CourseCriticalDefinition[]) {
 const rawRegistration = anchoredText(ORIGINAL_REGISTRATION)
 const old = JSON.parse(rawRegistration) as {critical: string[]; criticalIdentities: unknown;
  registeredCore: number; registeredCritical: number; registeredTotal: number}
 check(old.registeredCore === 288 && old.registeredCritical === 90 && old.registeredTotal === 378 &&
  old.critical.length === 45 && new Set(old.critical).size === 45, 'ORIGINAL_288_PLUS_90_SCOPE_REQUIRED')
 equal(old.criticalIdentities, IDENTITIES.map(({backgroundId, seed}) => ({backgroundId, seed})), 'EXACT_TWO_ORIGINAL_SEED0_IDENTITIES_REQUIRED')
 equal([...definitions.map(definition => definition.id)].sort(), [...old.critical].sort(), 'ORIGINAL_45_CRITICAL_IDS_CHANGED')
 const ordered = old.critical.map(id => {
  const definition = definitions.find(value => value.id === id)
  check(definition, 'ORIGINAL_CRITICAL_DEFINITION_MISSING:' + id)
  return definition
 })
 const summaryFile = PREFIX_DIRECTORY + '/course-prefix-results.json'
 const summary = JSON.parse(anchoredText(summaryFile)) as OriginalSummary
 check(summary.registered === 6 && summary.completed === 6 && summary.allExecutedBytesEqual, 'COMPLETE_ORIGINAL_SIX_P1_ANCHOR_REQUIRED')
 guardHashes(summary.sourceHashes)
 const inputNames = [ORIGINAL_REGISTRATION, summaryFile]
 const prefixes = IDENTITIES.map(identity => {
  const row = summary.results.find(value => value.name === identity.name)
  check(row && row.backgroundId === identity.backgroundId && row.seed === identity.seed && row.status === 'completed' &&
   row.fullCreateAndMilestoneBytesEqual && row.milestones.length === 25, 'ORIGINAL_SEED0_FULL_PREFIX_REQUIRED:' + identity.name)
  for (const descriptor of [row.initial, row.final, ...row.milestones]) {
   check(!descriptor.file.split('/').includes('..'), 'ORIGINAL_PREFIX_REFERENCE_ESCAPE')
   const file = PREFIX_DIRECTORY + '/' + descriptor.file, raw = readText(file)
   check(Buffer.byteLength(raw) === descriptor.bytes && sha(raw) === descriptor.sha256, 'FULL_ORIGINAL_PREFIX_REFERENCE_CHANGED:' + file)
   inputNames.push(file)
  }
  return {identity, row}
 })
 return {originalRegistrationCommit: BASE_COMMIT, originalRegistration: old, ordered, prefixes,
  originalRuntimeHashes: summary.sourceHashes, inputHashes: hashFiles(inputNames)}
}

/** Keep every available original member when either the archive or index cannot be written. */
export function persistCriticalPrefix(writer: CriticalEvidenceWriter, identity: typeof IDENTITIES[number],
 members: ReadonlyMap<string, string>, record: unknown) {
 try {
  const archive = archiveMembers(writer, identity.name + '/prefix-evidence.xz', members)
  const index = writer.json(identity.name + '/prefix-index.json', {identity, record, archive})
  return {archive, index}
 } catch (caught) {
  try {
   writer.json(identity.name + '/prefix-output-recovery.json', {identity, phase: 'prefix archive or index',
    originalError: String(caught), record, completeOriginalMembers: [...members].map(([name, raw]) => ({name, raw})),
    scope: 'Complete available original text after prefix output failure; not a completed prefix or successful audit.'})
  } catch (recoveryError) {
   console.error(JSON.stringify({type: 'prefix-full-original-recovery-output-failed', identity: identity.name,
    originalError: String(caught), recoveryError: String(recoveryError)}))
  }
  throw caught
 }
}

export function earnCriticalPrefix(writer: CriticalEvidenceWriter, prefix: ReturnType<typeof criticalAuthority>['prefixes'][number],
 definitions: readonly CourseCriticalDefinition[], progress: (value: unknown) => void) {
 const {identity, row} = prefix, codec = createCampaignCodec(), members = new Map<string, string>()
 const expectedInitial = readText(PREFIX_DIRECTORY + '/' + row.initial.file)
 const expectedFinal = readText(PREFIX_DIRECTORY + '/' + row.final.file)
 const decoded = codec.import(expectedInitial)
 let current = strict(createFrom(decoded), codec)
 const created = current.run
 check(current.raw === expectedInitial && current.run.backgroundId === identity.backgroundId && current.run.seed === identity.seed,
  'ACTUAL_CRITICAL_CREATE_BYTES_OR_IDENTITY_CHANGED')
 const initial = putMember(members, 'initial.json', current.raw)
 const wanted = new Set([...definitions.map(definition => definition.sourceRevision), ...row.milestones.map(milestone => milestone.revision)])
 const checkpoints: {revision: number; date: string; raw: MemberRef}[] = [], ownRaw = new Map<number, string>()
 const matched = new Set<string>(), journal: unknown[] = []
 writer.mkdir(identity.name)
 const journalFile = identity.name + '/prefix-attempts.jsonl'
 writer.text(journalFile, '')
 const inspect = () => {
  for (const milestone of row.milestones.filter(milestone => milestone.revision === current.run.revision)) {
   const expected = readText(PREFIX_DIRECTORY + '/' + milestone.file)
   check(expected === current.raw && current.run.timeline.cursor.date === milestone.date, 'ACTUAL_CREATE_ORIGINAL_MILESTONE_CHANGED:' + milestone.name)
   matched.add(milestone.name)
  }
  if (wanted.has(current.run.revision) && !ownRaw.has(current.run.revision)) {
   ownRaw.set(current.run.revision, current.raw)
   checkpoints.push({revision: current.run.revision, date: current.run.timeline.cursor.date,
    raw: putMember(members, 'checkpoint-' + current.run.revision + '.json', current.raw)})
  }
 }
 inspect()
 let error: string | null = null
 try {
  for (const [index, command] of row.commands.entries()) {
   const start = {event: 'attempt', sequence: index + 1, command, sourceRevision: current.run.revision,
    sourceDate: current.run.timeline.cursor.date}
   writer.append(journalFile, start)
   journal.push(start)
   const result = evaluateCommand(current.run, command, codec.registry, current.run.actorId)
   if (result.status !== 'proposed') {
    const failure = {event: 'result', sequence: index + 1, result}
    writer.append(journalFile, failure); journal.push(failure)
    throw Error('ACTUAL_FIXED_PREFIX_COMMAND_NOT_PROPOSED:' + JSON.stringify({command, result}))
   }
   current = strict(result.nextRun, codec)
   const outcome = {event: 'result', sequence: index + 1, status: 'accepted', revision: current.run.revision,
    date: current.run.timeline.cursor.date, rawSha256: sha(current.raw)}
   writer.append(journalFile, outcome); journal.push(outcome)
   inspect()
   if ((index + 1) % 25 === 0) progress({type: 'actual-prefix-commands', identity: identity.name, accepted: index + 1})
  }
  check(current.raw === expectedFinal && matched.size === 25 && [...wanted].every(revision => ownRaw.has(revision)),
   'COMPLETE_ACTUAL_CREATE_OR_CRITICAL_CHECKPOINT_MISSING')
  equal(commandsOf(current.run), row.commands, 'ORIGINAL_PREFIX_FULL_COMMANDS_CHANGED')
 } catch (caught) { error = String(caught) }
 const final = putMember(members, error === null ? 'final.json' : 'partial.json', current.raw)
 putMember(members, 'prefix-attempts.jsonl', readText(writer.name + '/' + journalFile))
 const record = {...identity, status: error === null ? 'verified' : 'failed', error, initial, final, checkpoints,
  originalAnchor: {initial: row.initial, final: row.final, milestones: row.milestones},
  originalMilestonesMatched: [...matched], acceptedCommands: journal.filter(entry =>
   typeof entry === 'object' && entry !== null && 'status' in entry && entry.status === 'accepted').length,
  commands: row.commands, scope: 'Actually execute original fixed normal command history from Create; old raw is an expected byte anchor, never a free starting state.'}
 putMember(members, 'prefix-record.json', JSON.stringify(record, null, 2) + '\n')
 const {archive, index} = persistCriticalPrefix(writer, identity, members, record)
 if (error !== null) throw Error('CRITICAL_PREFIX_FAILED_WITH_SAVED_PARTIAL:' + error)
 return {identity, initial: created, raw: current.raw, checkpoints: ownRaw, record, archive, index}
}
