import {readFileSync, writeFileSync, lstatSync, existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {resolve, dirname, basename} from 'node:path'
import {createCampaignCodec, campaignCourse} from '../../../src/application/campaign.ts'
import {projectCourse} from '../../../src/core/course-projection.ts'
import {canonicalJson} from '../../../src/core/identity.ts'
import {actionBudget} from '../../../src/core/economy.ts'
import {assertCourseMoney, assertCourseCashDelta} from '../../../src/testing/course-shape-assertions.ts'
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs'

const task = fileURLToPath(new URL('./', import.meta.url)), root = fileURLToPath(new URL('../../../', import.meta.url))
const outputJson = resolve(task, 'browser-business-readback-r1.json'), outputMd = resolve(task, 'browser-business-readback-r1.md')
const sha = value => createHash('sha256').update(value).digest('hex')
const check = (value, code) => {if (!value) throw Error(code)}
const same = (a, b) => canonicalJson(a) === canonicalJson(b)
const inputs = {}, sources = {}
function regular(path) {
 for (let current = path;; current = dirname(current)) {
  check(!lstatSync(current).isSymbolicLink(), 'READBACK_INPUT_SYMLINK')
  if (current === root.replace(/\/$/, '')) break
  check(dirname(current) !== current, 'READBACK_INPUT_OUTSIDE_REPOSITORY')
 }
 check(lstatSync(path).isFile(), 'READBACK_INPUT_MUST_BE_REGULAR')
 return path
}
function read(name) {
 const raw = readFileSync(regular(resolve(root, name)))
 inputs[name] = {bytes: raw.length, sha256: sha(raw)}
 return raw
}
function readJson(name) {return JSON.parse(read(name).toString('utf8'))}
function guardOutput() {
 assertBrowserEvidenceWritable(task)
 check(!existsSync(outputJson) && !existsSync(outputMd), 'FRESH_BROWSER_BUSINESS_READBACK_OUTPUT_REQUIRED')
}
guardOutput()
const report = {scope: 'Current readonly exact public-export bytes, pure Codec import/export and public course/accounting facts. No Create, command evaluation, long replay, screenshot/UI/build/storage injection or compatibility test.',
 startedUtc: new Date().toISOString(), files: [], checks: [], facts: {}, errors: [], passed: false,
 newCreatesExecuted: 0, newCommandsExecuted: 0, fullNormalReplaysExecuted: 0, compatibilityTests: 0}
const readerRaw = readFileSync(fileURLToPath(import.meta.url))
report.readerSource = {file: 'goal-1/evidence/t17-acceptance-10/browser-business-readback-r1.mjs', bytes: readerRaw.length, sha256: sha(readerRaw)}
const checkFact = (value, code, detail = null) => {check(value, code); report.checks.push({code, detail})}
const roles = {
 'chrome-prod-r1/r73-prod-text-before-import.json': 'input_buffer_not_new_saved_outcome',
 'chrome-prod-r1/r73-after-readonly-navigation.json': 'saved_public_export_after_readonly_navigation',
 'chrome-prod-r1/r83-closed-before-reload.json': 'saved_production_result_before_reload',
 'chrome-prod-r1/r83-after-reload.json': 'saved_production_result_after_reload',
 'chrome-dev-r1/r73-dev-import-text-before-import.json': 'input_buffer_not_new_saved_outcome',
 'chrome-dev-r1/r74-unsaved-candidate.json': 'unsaved_candidate_not_physical_commit',
 'chrome-dev-r1/r73-old-saved-during-abort.json': 'old_saved_public_export_while_candidate_pending',
 'chrome-dev-r1/r89-three-phase-refunds-update-support-closed.json': 'saved_dev_result_with_three_actual_refunds',
 'chrome-physical-r1/r73-independent-physical-during-abort.json': 'independent_readonly_old_physical_readback',
 'chrome-physical-r1/r74-physical-after-candidate-retry.json': 'independent_physical_readback_after_candidate_retry',
 'chrome-physical-r1/r89-independent-after-reload.json': 'independent_readonly_dev_result_after_reload',
}
const rawByKey = new Map(), runByKey = new Map(), unique = new Map()
try {
 const coverage = readJson('goal-1/evidence/t17-acceptance-10/coverage-r1/coverage-results.json')
 const expectedSources = coverage.actualRuntimeDependencyClosure.hashes
 const financeName = 'goal-1/evidence/t17-acceptance-10/finance-source-freeze-r1.json'
 const finance = readJson(financeName)
 for (const [name, expected] of Object.entries(expectedSources)) {
  const raw = readFileSync(regular(resolve(root, name)))
  check(sha(raw) === expected && finance[name]?.sha256 === expected, 'CURRENT_RUNTIME_CODEC_OR_CONFIG_DEPENDENCY_DRIFT:' + name)
  sources[name] = {bytes: raw.length, sha256: expected}
 }
 const helperName = 'src/testing/course-shape-assertions.ts', helperRaw = readFileSync(regular(resolve(root, helperName)))
 check(sha(helperRaw) === finance[helperName].sha256, 'READONLY_ACCOUNTING_HELPER_CHANGED')
 sources[helperName] = {bytes: helperRaw.length, sha256: sha(helperRaw)}
 const financeDrift = []
 for (const [name, expected] of Object.entries(finance)) {
  const actual = sha(readFileSync(regular(resolve(root, name))))
  if (actual !== expected.sha256) financeDrift.push({file: name, originalSha256: expected.sha256, currentSha256: actual, actualCodecDependency: Object.hasOwn(expectedSources, name)})
 }
 report.sourceBinding = {runtimeCodecConfigDependencies: Object.keys(expectedSources).length,
  sameCurrentActualClosure: true, readonlyAccountingHelperBound: true,
  originalFinanceFreezeEntries: Object.keys(finance).length, fullFreezeAllSame: financeDrift.length === 0,
  nonRuntimeHistoricalOrUiChanges: financeDrift,
  scope: 'Only the actual campaign/codec closure and accounting helper must remain identical. UI repairs are separate; full355 source sameness is never inferred.'}
 const codec = createCampaignCodec()
 for (const folder of ['chrome-prod-r1', 'chrome-dev-r1', 'chrome-physical-r1']) {
  const journalName = 'goal-1/evidence/t17-acceptance-10/' + folder + '/exports.jsonl'
  const journal = read(journalName).toString('utf8')
  for (const line of journal.split('\n').filter(Boolean)) {
   const row = JSON.parse(line), key = folder + '/' + row.file
   check(basename(row.file) === row.file && Object.hasOwn(roles, key) && !rawByKey.has(key), 'UNASSIGNED_OR_DUPLICATE_EXISTING_EXPORT_ROLE:' + key)
   const name = 'goal-1/evidence/t17-acceptance-10/' + key, data = read(name), raw = data.toString('utf8')
   check(Buffer.from(raw).equals(data) && data.length === row.bytes && sha(data) === row.sha256, 'RECORDED_FULL_EXPORT_BYTES_CHANGED:' + key)
   let decoded = unique.get(row.sha256)
   if (decoded) check(decoded.raw === raw, 'DUPLICATE_HASH_DIFFERENT_COMPLETE_TEXT')
   else {
    const run = codec.import(raw)
    check(codec.export(run) === raw && run.origin === 'normal', 'PURE_CODEC_EXACT_NORMAL_ROUNDTRIP_FAILED:' + key)
    const publicCourse = projectCourse(run, campaignCourse)
    check(publicCourse && codec.export(run) === raw, 'PUBLIC_COURSE_READ_MUTATED_ORIGINAL')
    const cohort = publicCourse.cohorts[0]
    check(cohort, 'ACTUAL_PUBLIC_COHORT_REQUIRED')
    const money = assertCourseMoney(run, cohort.id)
    decoded = {raw, run, publicCourse, cohort, money}
    unique.set(row.sha256, decoded)
   }
   check(decoded.run.revision === row.revision, 'RECORDED_REVISION_CHANGED:' + key)
   rawByKey.set(key, raw); runByKey.set(key, decoded)
   report.files.push({file: name, label: row.label, recordedOrigin: row.origin, recordedSource: row.source,
    role: roles[key], bytes: row.bytes, sha256: row.sha256, revision: decoded.run.revision,
    runId: decoded.run.runId, backgroundId: decoded.run.backgroundId, seed: decoded.run.seed,
    date: decoded.run.timeline.cursor.date, phase: decoded.run.timeline.cursor.phase,
    pureCodecExactRoundTrip: true, identicalRawValidationKey: row.sha256})
  }
 }
 checkFact(rawByKey.size === 11 && unique.size === 4, 'EXACT_ELEVEN_EXPORTS_FOUR_COMPLETE_RAW_STATES', {files: rawByKey.size, uniqueCompleteTexts: unique.size})
 const originalName = 'goal-1/evidence/t17-acceptance-05/prefix-r1/technical_employee-t16-campaign-0/image-cohort-planned.json'
 const original = read(originalName).toString('utf8')
 checkFact(sha(original) === '9ff4d066dd3b617993570e064daf2f0474a204060fdf0ec22822510731c84d75'
  && [...rawByKey].filter(([key]) => key.includes('/r73-')).every(([, raw]) => raw === original),
 'ALL_FIVE_R73_INPUT_SAVED_AND_PHYSICAL_BYTES_EQUAL_ORIGINAL', {originalFile: originalName, originalBytes: Buffer.byteLength(original)})
 const pairs = [
  ['chrome-dev-r1/r74-unsaved-candidate.json', 'chrome-physical-r1/r74-physical-after-candidate-retry.json', 'CANDIDATE74_EQUALS_RETRIED_PHYSICAL74'],
  ['chrome-prod-r1/r83-closed-before-reload.json', 'chrome-prod-r1/r83-after-reload.json', 'PROD83_RELOAD_PRESERVES_COMPLETE_ORIGINAL'],
  ['chrome-dev-r1/r89-three-phase-refunds-update-support-closed.json', 'chrome-physical-r1/r89-independent-after-reload.json', 'DEV89_READONLY_RELOAD_PRESERVES_COMPLETE_ORIGINAL'],
 ]
 for (const [first, second, label] of pairs) checkFact(rawByKey.get(first) === rawByKey.get(second), label, {first, second, sha256: sha(rawByKey.get(first))})
 const base = runByKey.get('chrome-dev-r1/r73-old-saved-during-abort.json')
 const candidate = runByKey.get('chrome-dev-r1/r74-unsaved-candidate.json')
 checkFact(base.cohort.students.length === 0 && candidate.cohort.students.length === 20
  && candidate.money.payments.length === 1 && candidate.money.contract.prepaidFen === 1998000
  && candidate.money.contract.recognizedIncomeFen === 0
  && candidate.money.company.cashFen - base.money.company.cashFen === 1998000
  && candidate.money.company.availableFen === base.money.company.availableFen,
  'CANDIDATE_PREPAYMENT_IS_PROTECTED_NOT_PROFIT_OR_FREE_CASH', {sourceStudents: base.cohort.students.length,
   candidateStudents: candidate.cohort.students.length, prepaidFen: candidate.money.contract.prepaidFen,
   incomeFen: candidate.money.contract.recognizedIncomeFen, originalAvailableFen: base.money.company.availableFen,
   candidateAvailableFen: candidate.money.company.availableFen})
 function facts(key) {
  const value = runByKey.get(key), {run, cohort, publicCourse, money} = value
  const c = publicCourse.courses.find(c => c.id === cohort.courseId)
  const actions = new Map(run.economy.actions.map(a => [a.definition.id, a]))
  const supports = cohort.supportJobs.map(slot => ({recovery: slot.recovery, mode: slot.mode, job: slot.job,
   action: slot.job ? actions.get(slot.job.actionId) : null}))
  const refunds = money.refunds.map(refund => {
   const students = money.students.filter(s => refund.personIds.includes(s.personId))
   const operations = refund.operationIds.map(id => money.financial.find(op => op.id === id))
   const debt = money.obligations.filter(o => refund.operationIds.includes(o.originOperationId))
   const payableIds = new Set(debt.map(o => o.id))
   const cash = run.economy.ledger.transactions.filter(t => payableIds.has(t.referenceId))
   const paidFen = debt.reduce((n, d) => n + d.amountFen - d.remainingFen, 0)
   check(paidFen === refund.undeliveredFen + refund.deliveredFen, 'ORIGINAL_REFUND_HAS_UNPAID_CASH_BALANCE:' + key)
   return {refund, students, operations, refundObligations: debt, actualCashPaidFen: paidFen, actualCashTransactions: cash}
  })
  return {file: key, revision: run.revision, date: run.timeline.cursor.date, phase: run.timeline.cursor.phase,
   runId: run.runId, versions: run.versions, status: cohort.status, closedAt: cohort.closedAt,
   originalStudents: cohort.students.length, outcomes: Object.fromEntries(['helped','refunded','pending','needs_recovery'].map(outcome => [outcome, cohort.students.filter(s => s.outcome === outcome).length])),
   recoveredStudents: cohort.students.filter(s => s.recovered).map(s => s.personId), stages: money.stages,
   paymentBatches: money.payments, refunds, support: supports, updates: publicCourse.updates,
   courseVersions: c.versions, coursePaused: c.paused, contract: money.contract,
   cohortProtection: money.reservations, unpaidCohortFen: money.independentChecks.unpaidCohortFen,
   feeFen: money.feeFen, feePostedAt: money.feePostedAt,
   currentQuarterBudget: actionBudget(run.economy, run.timeline.cursor.date), allQuarterBudgets: money.quarters,
   companyCashFen: money.company.cashFen, companyAvailableFen: money.company.availableFen,
   personalCashFen: run.economy.ledger.accounts.find(a => a.id === 'personal').balanceFen,
   actualCompanyCashDeltaFromOriginal73: assertCourseCashDelta(base.run, run, money.accountId),
   independentAccountingChecks: money.independentChecks,
   commandsAfterOriginal73: run.receipts.filter(r => r.revisionAfter > 73).map(r => ({commandId: r.commandId, revision: r.revisionAfter, date: r.date, kind: r.kind, payload: JSON.parse(r.payloadSignature).payload}))}
 }
 const prod = facts('chrome-prod-r1/r83-closed-before-reload.json'), dev = facts('chrome-dev-r1/r89-three-phase-refunds-update-support-closed.json')
 report.facts = {productionLateUpdate: prod, devTimelyUpdateAndThreeRefunds: dev}
 for (const value of [prod, dev]) {
  checkFact(value.originalStudents === 20 && value.support.length === 2 && value.support.every(s => s.mode === 'guided_group'
   && s.job.status === 'completed' && s.action.definition.costFen === 300000 && s.action.definition.actionPoints === 1)
   && value.support.some(s => !s.recovery && s.job.startAt === '2023-04-01' && s.job.completeAt === '2023-04-08')
   && value.support.some(s => s.recovery && s.job.startAt === '2023-04-08' && s.job.completeAt === '2023-04-15'),
   'ACTUAL_ORIGINAL_SUPPORT_AND_PAID_RECOVERY:' + value.revision, {revision: value.revision, originalStudents: value.originalStudents, recoveredStudents: value.recoveredStudents.length})
  checkFact(value.closedAt === '2023-04-16' && value.status === 'closed' && value.unpaidCohortFen === 0
   && value.contract.prepaidFen === 0 && value.cohortProtection.every(r => r.amountFen === 0),
   'ACTUAL_ORIGINAL_FEE_WINDOW_CLOSE_AND_NO_UNPAID_COHORT:' + value.revision, {revision: value.revision, closedAt: value.closedAt, feeFen: value.feeFen})
 }
 checkFact(prod.date === '2023-04-22' && prod.outcomes.refunded === 20 && prod.outcomes.helped === 0
  && prod.refunds.length === 1 && prod.refunds[0].refund.deliveredFen === 1998000 && prod.refunds[0].refund.undeliveredFen === 0
  && prod.feeFen === 0 && prod.contract.recognizedIncomeFen === 0 && prod.updates[0].defaulted
  && prod.updates[0].resolution === 'refunded' && prod.updates[0].resolvedAt === '2023-04-16'
  && prod.courseVersions.at(-1).date === '2023-04-22' && prod.recoveredStudents.length === 3,
  'LATE_REFRESH_DOES_NOT_UNDO_ORIGINAL_TWENTY_LEARNER_REFUNDS', {defaultedAtDue: prod.updates[0].dueAt,
   refundAt: prod.updates[0].resolvedAt, lateRefreshCompletedAt: prod.courseVersions.at(-1).date, feeFen: prod.feeFen})
 const refundShapes = dev.refunds.map(r => [r.refund.undeliveredFen, r.refund.deliveredFen])
 checkFact(same(refundShapes, [[99900,0],[49950,49950],[0,99900]])
  && new Set(dev.refunds.flatMap(r => r.refund.personIds)).size === 3
  && dev.outcomes.refunded === 3 && dev.outcomes.helped === 17 && dev.recoveredStudents.length === 2
  && dev.contract.recognizedIncomeFen === 1698300 && dev.feeFen === 84915
  && !dev.updates[0].defaulted && dev.updates[0].resolution === 'refreshed' && dev.updates[0].resolvedAt === '2023-03-21',
  'THREE_REAL_PHASE_REFUNDS_ORIGINAL_REFERENCES_AND_TIMELY_REFRESH', {refundShapes, retainedStudents: 17,
   netOriginalIncomeFen: dev.contract.recognizedIncomeFen, feeFen: dev.feeFen, updateResolvedAt: dev.updates[0].resolvedAt})
 checkFact(prod.currentQuarterBudget.available === 1 && dev.currentQuarterBudget.available === 2
  && prod.companyCashFen === 902259 && dev.companyCashFen === 2515644
  && prod.personalCashFen === dev.personalCashFen && dev.personalCashFen === 13590000,
  'ACTUAL_CASH_DATE_AND_ACTION_POINT_RESULTS', {production: {cashFen: prod.companyCashFen, date: prod.date, availableAP: prod.currentQuarterBudget.available},
   dev: {cashFen: dev.companyCashFen, date: dev.date, availableAP: dev.currentQuarterBudget.available}, personalCashFen: dev.personalCashFen})
 for (const [name, ref] of Object.entries(sources)) check(sha(readFileSync(regular(resolve(root, name)))) === ref.sha256, 'READBACK_ACTUAL_CODEC_SOURCE_CHANGED_DURING_CHECK:' + name)
 for (const [name, ref] of Object.entries(inputs)) check(sha(readFileSync(regular(resolve(root, name)))) === ref.sha256, 'READBACK_EXISTING_INPUT_CHANGED:' + name)
 check(sha(readFileSync(fileURLToPath(import.meta.url))) === report.readerSource.sha256, 'READBACK_READER_SOURCE_CHANGED')
 report.inputRoleCounts = {inputBuffers: report.files.filter(f => f.role === 'input_buffer_not_new_saved_outcome').length,
  unsavedCandidates: report.files.filter(f => f.role === 'unsaved_candidate_not_physical_commit').length,
  otherProductReadbacks: report.files.filter(f => !['input_buffer_not_new_saved_outcome','unsaved_candidate_not_physical_commit'].includes(f.role)).length}
 report.pureCodecDistinctOriginalTexts = unique.size
 report.passed = true
} catch (error) {report.errors.push(String(error))}
report.sourceHashes = sources
report.inputHashes = inputs
report.endedUtc = new Date().toISOString()
report.notProvenHere = ['Browser actions/visuals and real IndexedDB abort are source-labeled evidence supplied by the main task, not observed independently by this file reader.',
 'Full normal Create/command-prefix replay remains assigned to verify_normal_browser_exports.', 'UI/build/whole5b/human/compatibility acceptance is outside this readback.']
guardOutput()
const json = JSON.stringify(report, null, 2) + '\n'
writeFileSync(outputJson, json, {flag:'wx'})
check(readFileSync(outputJson, 'utf8') === json, 'READBACK_REPORT_RAW_CHANGED')
const md = `# Chrome原文业务只读核 R1\n\n限定结果：${report.passed ? '通过' : '未通过'}。现有导出${report.files.length}行，纯Codec严格往返${report.pureCodecDistinctOriginalTexts ?? 0}种完整原文；未执行新Create、游戏命令、完整前缀重放、浏览器动作或兼容测试。\n\n` +
 (report.passed ? `2份导入缓冲、1份未保存candidate和8份其余产品读回分列，不能把11次导出算成11次保存。全部旧r73等于原P1字节；candidate74等于重试后独立physical74，prod83重载及dev89独立只读重载均完整原文相同。\n\n生产分支20人原支持和3人付费补支持实际完成，但H004更新逾期：Apr16全20人退回19980元已交付原款，收入/手续费为0，Apr22才完成的迟更新没有追回退款。最终公司现金9022.59元、余1AP；这不是正常保留20人或课程盈利。\n\nDEV分支三名不同学员在交付前、半程、全交付后各退999元，未交付/已交付分别为999/0、499.50/499.50、0/999元，均引用原付款或原阶段。及时Mar21完成更新，17人保留、2人实际补支持，净原收入16983元、手续费849.15元，Apr16关闭且班期欠款/保护归零；公司现金25156.44元、余2AP。两个反事实个人现金均135900元，不跨分支相加或称本班利润。\n\n实际campaign/Codec/config的122文件及只读账务helper字节核定；全finance冻结${report.sourceBinding.originalFinanceFreezeEntries}项是否全部相同：${report.sourceBinding.fullFreezeAllSame}，非运行时/UI差异逐项在JSON单列，没有把正在修缮的UI源冒充全同。\n\n` : `错误：${report.errors.join('; ')}\n\n`) +
 `JSON：browser-business-readback-r1.json，${Buffer.byteLength(json)}字节，SHA256 ${sha(json)}。\n\n本核对不替代实际画面、存储失败机制、build、完整正常前缀重放或整个5b。原导出与所有旧封存文件未改；[杠精审查]限定${report.passed ? '通过' : '未通过'}，未混淆输入/候选/物理读回、及时/逾期、现金/收入/利润，兼容开发测试0。\n`
assertBrowserEvidenceWritable(task)
writeFileSync(outputMd, md.replace(/\\n/g, '\n'), {flag:'wx'})
console.log(JSON.stringify({file: 'goal-1/evidence/t17-acceptance-10/browser-business-readback-r1.json', bytes: Buffer.byteLength(json), sha256: sha(json), passed: report.passed, files: report.files.length, errors: report.errors, newCreatesExecuted: 0, newCommandsExecuted: 0}))
if (!report.passed) process.exitCode = 1
