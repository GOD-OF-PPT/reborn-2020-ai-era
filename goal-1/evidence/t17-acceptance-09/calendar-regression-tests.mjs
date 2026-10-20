import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {addDays} from '../../../src/core/calendar.ts'

const args = process.argv.slice(2)
assert.equal(args.length, 4)
assert.equal(args[0], '--mode')
assert.equal(args[2], '--label')
const mode = args[1], label = args[3]
assert.ok(mode === 'old' || mode === 'helper')
assert.match(label, /^r[1-9][0-9]*$/)
const sourcePath = fileURLToPath(new URL('../../../src/testing/course-critical-lifecycle.ts', import.meta.url))
const source = readFileSync(sourcePath, 'utf8')
const sha = raw => createHash('sha256').update(raw).digest('hex')
const sourceSha256 = sha(source)
let calculate
if (mode === 'old') {
 assert.equal((source.match(/addDays\(stage\.dueAt, 1 - p\.stageDays\)/g) ?? []).length, 2,
  'OLD_TWO_ACTUAL_CALL_SITES_REQUIRED')
 calculate = (dueAt, stageDays) => addDays(dueAt, 1 - stageDays)
} else {
 const module = await import('../../../src/testing/course-critical-lifecycle.ts')
 assert.equal(typeof module.oneDayLateStageStart, 'function')
 calculate = module.oneDayLateStageStart
}
const cases = [
 {name: 'original-stage0', dueAt: '2023-02-01', stageDays: 10, expectedStart: '2023-01-23', expectedComplete: '2023-02-02', classStart: '2023-01-18'},
 {name: 'original-stage1', dueAt: '2023-02-22', stageDays: 10, expectedStart: '2023-02-13', expectedComplete: '2023-02-23', classStart: '2023-01-18'},
 {name: 'seven-same-month', dueAt: '2023-05-20', stageDays: 7, expectedStart: '2023-05-14', expectedComplete: '2023-05-21'},
 {name: 'seven-cross-month', dueAt: '2023-05-01', stageDays: 7, expectedStart: '2023-04-25', expectedComplete: '2023-05-02'},
 {name: 'fourteen-same-month', dueAt: '2023-07-30', stageDays: 14, expectedStart: '2023-07-17', expectedComplete: '2023-07-31'},
 {name: 'fourteen-cross-year', dueAt: '2025-01-01', stageDays: 14, expectedStart: '2024-12-19', expectedComplete: '2025-01-02'},
 {name: 'ten-leap-day', dueAt: '2024-02-29', stageDays: 10, expectedStart: '2024-02-20', expectedComplete: '2024-03-01'},
 {name: 'seven-cross-leap-month', dueAt: '2024-03-01', stageDays: 7, expectedStart: '2024-02-24', expectedComplete: '2024-03-02'},
 {name: 'fourteen-from-leap-day', dueAt: '2024-03-13', stageDays: 14, expectedStart: '2024-02-29', expectedComplete: '2024-03-14'},
 {name: 'seven-common-year', dueAt: '2023-03-01', stageDays: 7, expectedStart: '2023-02-23', expectedComplete: '2023-03-02'},
 {name: 'seven-century-common-year', dueAt: '1900-03-01', stageDays: 7, expectedStart: '1900-02-23', expectedComplete: '1900-03-02'},
 {name: 'seven-four-century-leap-year', dueAt: '2000-03-01', stageDays: 7, expectedStart: '2000-02-24', expectedComplete: '2000-03-02'},
 {name: 'fourteen-end-year', dueAt: '2023-12-31', stageDays: 14, expectedStart: '2023-12-18', expectedComplete: '2024-01-01'},
 {name: 'one-day-nonnegative-control', dueAt: '2023-02-01', stageDays: 1, expectedStart: '2023-02-01', expectedComplete: '2023-02-02'},
]
const output = fileURLToPath(new URL('calendar-regression-' + label + '/', import.meta.url))
mkdirSync(output)
const results = cases.map(test => {
 const row = {...test, status: 'failed', actualStart: null, actualComplete: null, error: null}
 try {
  row.actualStart = calculate(test.dueAt, test.stageDays)
  row.actualComplete = addDays(row.actualStart, test.stageDays)
  assert.equal(row.actualStart, test.expectedStart)
  assert.equal(row.actualComplete, test.expectedComplete)
  assert.equal(row.actualComplete, addDays(test.dueAt, 1))
  if (test.classStart !== undefined) assert.ok(row.actualStart >= test.classStart)
  row.status = 'passed'
 } catch (error) { row.error = String(error) }
 return row
})
assert.equal(sha(readFileSync(sourcePath)), sourceSha256, 'DATE_SOURCE_CHANGED_DURING_REGRESSION')
const passed = results.filter(row => row.status === 'passed').length, failed = results.length - passed
const report = {mode, label, source: 'src/testing/course-critical-lifecycle.ts', sourceSha256,
 total: results.length, passed, failed, exitCode: failed ? 1 : 0, results,
 scope: 'Pure literal date regression only. No GameRun was created, no commands or original90 scenarios were executed, no browser or compatibility work.'}
const raw = JSON.stringify(report, null, 2) + '\n'
writeFileSync(new URL('calendar-regression-' + label + '/report.json', import.meta.url), raw, {flag: 'wx'})
console.log(JSON.stringify({mode, label, total: results.length, passed, failed, exitCode: report.exitCode,
 sourceSha256, reportBytes: Buffer.byteLength(raw), reportSha256: sha(raw)}))
process.exitCode = report.exitCode
