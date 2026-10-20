import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {dirname, join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createCampaignCodec, createCampaignRun} from '../../../src/application/campaign.ts'
import {projectRun} from '../../../src/core/commands.ts'
import {runCriticalBranch} from '../../../scripts/course-critical-run.ts'
import {assertFreshVideoEvidencePath} from '../../../scripts/video-shape-output.ts'
import {evidenceDirectory} from '../../../scripts/evidence-output.ts'

const root = realpathSync(fileURLToPath(new URL('../../../', import.meta.url)))
const task = 'goal-1/evidence/t17-acceptance-09'
const output = assertFreshVideoEvidencePath(root, process.argv.slice(2))
const outputName = relative(root, output).split('\\').join('/')
if (!new RegExp('^' + task + '/candidate-preservation-(red|green)-r[1-9][0-9]*$').test(outputName))
 throw Error('FRESH_FIXED_CANDIDATE_CANARY_OUTPUT_REQUIRED')
for (let current = dirname(output);; current = dirname(current)) {
 if (existsSync(current)) {
  const stat = lstatSync(current)
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw Error('CANARY_ANCESTOR_LINK_OR_NON_DIRECTORY')
  if (existsSync(join(current, 'sealed-evidence.json'))) throw Error('CANARY_ANCESTOR_SEALED')
 }
 if (current === root) break
 if (dirname(current) === current) throw Error('CANARY_OUTSIDE_REPOSITORY')
}
const actualOutput = evidenceDirectory(root, 'report.json')
if (actualOutput !== output) throw Error('CANARY_OUTPUT_IDENTITY_CHANGED')
const hash = raw => createHash('sha256').update(raw).digest('hex')
const refs = []
function save(name, raw) {
 const path = join(output, name)
 writeFileSync(path, raw, {flag: 'wx'})
 const returned = readFileSync(path)
 if (!returned.equals(Buffer.from(raw))) throw Error('CANARY_RAW_WRITE_READBACK_CHANGED:' + name)
 const ref = {file: name, bytes: returned.length, sha256: hash(returned)}
 refs.push(ref)
 return ref
}
function json(name, value) { return save(name, JSON.stringify(value, null, 2) + '\n') }
const sourceNames = ['scripts/course-critical-run.ts', 'src/testing/course-critical-context.ts',
 task + '/candidate-preservation-tests.mjs', task + '/candidate-preservation-test-plan.md',
 task + '/source-protocol-preflight-r2/course-critical-run.ts']
const sourceHashes = Object.fromEntries(sourceNames.map(name => [name, hash(readFileSync(join(root, name)))]))
const codec = createCampaignCodec()
const initial = createCampaignRun({runId: 'p3-candidate-preservation-canary', actorId: 'player', commandId: 'create',
 backgroundId: 'technical_employee', seed: 't16-campaign-0'})
const sourceRaw = codec.export(initial)
save('source.json', sourceRaw)
const fault = 'CANARY_RESULT_JOURNAL_FAILURE'
const results = []

for (const mode of ['unexpected-proposal', 'accepted', 'rejected']) {
 mkdirSync(join(output, mode))
 const members = new Map(), journal = [], checks = []
 let actualCallbackRaw = null
 const expectedRejection = mode !== 'accepted'
 const definition = {id: 'tool-only-' + mode, sourceRevision: 1,
  purpose: 'Independent protocol canary; outside original45 and original90', requiredChecks: ['unreached-after-fault'],
  run(ctx) {
   if (mode === 'accepted') ctx.h.send('WorkQuarter', {})
   else if (mode === 'rejected') ctx.reject('WorkQuarter', {canaryUnexpectedField: true}, 'INVALID_PAYLOAD')
   else ctx.reject('WorkQuarter', {}, 'INTENTIONALLY_NONMATCHING_CANARY_REASON')
  }}
 const execution = runCriticalBranch(definition, sourceRaw, {
  before(attempt) { journal.push(JSON.stringify({event: 'attempt', ...attempt}) + '\n') },
  after(attempt, actualRun) {
   actualCallbackRaw = codec.export(actualRun)
   journal.push(JSON.stringify({event: 'result', ...attempt}) + '\n')
   throw Error(fault)
  },
 }, members)
 const add = (code, passed, detail = null) => checks.push({code, passed: Boolean(passed), detail})
 const attempt = execution.record.attempts[0]
 add('exactly-one-real-attempt', execution.record.attempts.length === 1)
 add('expected-rejection-intent-preserved', attempt?.expectedRejection === expectedRejection)
 add('before-and-result-observed', journal.length === 2)
 add('injected-callback-failure-retained', execution.record.status === 'failed' && execution.record.error === 'Error: ' + fault,
  {status: execution.record.status, error: execution.record.error})
 add('complete-source-member-unchanged', members.get('source.json') === sourceRaw && codec.export(initial) === sourceRaw)
 add('complete-terminal-member-equals-actual-run', members.get(execution.record.terminal.member) === execution.raw
  && codec.export(execution.run) === execution.raw && execution.record.terminal.member === 'partial.json')
 const candidateRaw = members.get('unexpected-candidate-1.json')
 if (mode === 'unexpected-proposal') {
  add('actual-result-unexpected-proposal', attempt?.status === 'unexpected_proposal')
  add('proposal-never-committed', execution.raw === sourceRaw && actualCallbackRaw === sourceRaw && execution.run.revision === 1)
  add('unexpected-candidate-retained-before-callback-failure', typeof candidateRaw === 'string')
  let candidate = null, candidateError = null
  if (candidateRaw !== undefined) {
   try {
    candidate = codec.import(candidateRaw)
    add('candidate-complete-strict-roundtrip', codec.export(candidate) === candidateRaw)
   } catch (error) { candidateError = String(error); add('candidate-complete-strict-roundtrip', false, candidateError) }
  } else add('candidate-complete-strict-roundtrip', false, 'MISSING_ACTUAL_PROPOSED_CANDIDATE')
  add('candidate-real-workquarter-result', candidate?.revision === 2 && candidate.runId === initial.runId
   && candidate.backgroundId === initial.backgroundId && candidate.seed === initial.seed
   && candidate.receipts.length === 2 && candidate.receipts.at(-1)?.kind === 'WorkQuarter'
   && projectRun(candidate).budget.spent === 2, candidateError)
 } else if (mode === 'accepted') {
  add('actual-result-accepted', attempt?.status === 'accepted' && execution.record.acceptedCommands === 1)
  add('accepted-last-actual-state-preserved', execution.run.revision === 2 && actualCallbackRaw === execution.raw
   && execution.raw !== sourceRaw && codec.export(codec.import(execution.raw)) === execution.raw
   && execution.run.receipts.at(-1)?.kind === 'WorkQuarter' && projectRun(execution.run).budget.spent === 2)
  add('accepted-has-no-unexpected-candidate', candidateRaw === undefined)
 } else {
  add('actual-specific-rejection-preserved', attempt?.status === 'rejected'
   && JSON.stringify(attempt.reasonCodes) === JSON.stringify(['INVALID_PAYLOAD']) && execution.record.rejectedCommands === 1)
  add('rejected-complete-raw-unchanged', execution.raw === sourceRaw && actualCallbackRaw === sourceRaw && execution.run.revision === 1)
  add('rejected-has-no-proposed-candidate', candidateRaw === undefined)
 }
 for (const [name, raw] of members) save(mode + '/' + name, raw)
 save(mode + '/observed-callback-journal.jsonl', journal.join(''))
 json(mode + '/case-record.json', execution.record)
 const result = {mode, passed: checks.every(check => check.passed), checks,
  status: execution.record.status, actualRevision: execution.run.revision,
  sourceSha256: hash(sourceRaw), actualRawSha256: hash(execution.raw),
  candidate: candidateRaw === undefined ? null : {bytes: Buffer.byteLength(candidateRaw), sha256: hash(candidateRaw)}}
 results.push(result)
 json(mode + '/checks.json', result)
}
const sourceHashesAfter = Object.fromEntries(sourceNames.map(name => [name, hash(readFileSync(join(root, name)))]))
const sourceUnchangedDuringRun = JSON.stringify(sourceHashesAfter) === JSON.stringify(sourceHashes)
const passed = sourceUnchangedDuringRun && results.every(result => result.passed)
const report = {scope: 'Three real normal-Create single-command protocol canaries only. Injected synchronous callback failure; not a real ENOSPC, original45/90, complete prefix, UI or compatibility execution.',
 node: process.version, actualInvocation: [process.execPath, ...process.execArgv, ...process.argv.slice(1)],
 outputDirectory: outputName, sourceHashes, sourceHashesAfter, sourceUnchangedDuringRun,
 initial: {revision: initial.revision, origin: initial.origin, runId: initial.runId, backgroundId: initial.backgroundId, seed: initial.seed},
 canaries: results.length, passedCanaries: results.filter(result => result.passed).length,
 failedCanaries: results.filter(result => !result.passed).length, passed, results,
 selfExcluded: ['report.json'], files: [...refs]}
json('report.json', report)
console.log(JSON.stringify({outputDirectory: outputName, canaries: results.length,
 passedCanaries: report.passedCanaries, failedCanaries: report.failedCanaries, passed,
 failureCodes: results.flatMap(result => result.checks.filter(check => !check.passed).map(check => result.mode + ':' + check.code)),
 reportSha256: hash(readFileSync(join(output, 'report.json')))}))
if (!passed) process.exitCode = 1
