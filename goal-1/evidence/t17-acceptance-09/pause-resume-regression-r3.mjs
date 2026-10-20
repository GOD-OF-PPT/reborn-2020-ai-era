import {mkdirSync, readFileSync, readdirSync, lstatSync, writeFileSync} from 'node:fs'
import {join, basename} from 'node:path'
import {fileURLToPath} from 'node:url'
import {COURSE_CRITICAL_CASES} from '../../../src/testing/course-critical-cases.ts'
import {runCriticalBranch, replayCriticalAttempts} from '../../../scripts/course-critical-run.ts'
import {unpackArchive, sha} from '../../../scripts/course-critical-evidence.ts'

const task = fileURLToPath(new URL('./', import.meta.url))
const matrix = join(task, 'matrix-r2')
const seal = JSON.parse(readFileSync(join(matrix, 'sealed-evidence.json'), 'utf8'))
function guardMatrix() {
 const leaves = []
 function visit(directory, prefix = '') {
  for (const name of readdirSync(directory)) {
   const file = join(directory, name), relative = prefix + name, stat = lstatSync(file)
   if (stat.isSymbolicLink()) throw Error('MATRIX_LINK_FORBIDDEN')
   if (stat.isDirectory()) visit(file, relative + '/')
   else if (stat.isFile()) leaves.push(relative)
   else throw Error('MATRIX_REGULAR_FILE_REQUIRED')
  }
 }
 visit(matrix)
 if (JSON.stringify(leaves.sort()) !== JSON.stringify([...Object.keys(seal.files), 'sealed-evidence.json'].sort())) throw Error('MATRIX_SET_CHANGED')
 for (const [name, ref] of Object.entries(seal.files)) {
  const raw = readFileSync(join(matrix, name))
  if (raw.length !== ref.bytes || sha(raw) !== ref.sha256) throw Error('MATRIX_BYTES_CHANGED:' + name)
 }
}
guardMatrix()
const folder = 'technical_employee-t16-campaign-0/critical-45'
const index = JSON.parse(readFileSync(join(matrix, folder, 'case-index.json'), 'utf8'))
const original = unpackArchive('goal-1/evidence/t17-acceptance-09/matrix-r2/' + folder + '/' + index.archive.file, index.archive)
const oldRecord = JSON.parse(original.get('case-record.json'))
if (oldRecord.status !== 'failed' || oldRecord.caseId !== 'pause-resume' || !oldRecord.error.includes('COURSE_ENROLLMENT_CLOSED')) throw Error('ACTUAL_R2_RED_REQUIRED')
const definition = COURSE_CRITICAL_CASES.find(row => row.id === 'pause-resume')
if (!definition || definition.sourceRevision !== 73) throw Error('ORIGINAL_TARGET_AND_SOURCE_REQUIRED')
const output = join(task, 'pause-resume-regression-r3')
mkdirSync(output)
const execution = runCriticalBranch(definition, original.get('source.json'))
let replay = null, replayError = null
try { replay = replayCriticalAttempts(execution.record, execution.members) }
catch (error) { replayError = String(error) }
for (const [name, raw] of execution.members) {
 if (name !== basename(name)) throw Error('SINGLE_MEMBER_FILE_REQUIRED')
 writeFileSync(join(output, name), raw, {flag: 'wx'})
}
writeFileSync(join(output, 'case-record.json'), JSON.stringify(execution.record, null, 2) + '\n', {flag: 'wx'})
const members = Object.fromEntries([...execution.members].map(([name, raw]) => [name, {bytes: Buffer.byteLength(raw), sha256: sha(raw)}]))
for (const [name, ref] of Object.entries(members)) {
 const raw = readFileSync(join(output, name))
 if (raw.length !== ref.bytes || sha(raw) !== ref.sha256) throw Error('NEW_MEMBER_READBACK_CHANGED:' + name)
}
guardMatrix()
const passed = execution.record.status === 'target_verified' && replay?.status === 'verified-exact-actual-history' && replay.terminalMatched && replayError === null
const report = {scope: 'One real pause-resume regression using unmodified original R2 from-Create-earned r73. No new Create or prefix execution; not any of fresh original90/P3 acceptance, browser or compatibility.',
 oldR2Status: oldRecord.status, oldR2Error: oldRecord.error, sourceSha256: sha(original.get('source.json')),
 currentRiskSourceSha256: sha(readFileSync('src/testing/course-critical-risk.ts')), requiredChecks: definition.requiredChecks,
 status: execution.record.status, error: execution.record.error, passed, acceptedCommands: execution.record.acceptedCommands,
 rejectedCommands: execution.record.rejectedCommands, observations: execution.record.observations.length,
 replay, replayError, originalR2SealedFilesUnchanged: Object.keys(seal.files).length, members, exitCode: passed ? 0 : 1}
writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'})
console.log(JSON.stringify({passed, status: report.status, acceptedCommands: report.acceptedCommands, rejectedCommands: report.rejectedCommands,
 observations: report.observations, replay, error: report.error, replayError}))
if (!passed) process.exitCode = 1
