import {addDays} from '../core/calendar.ts'
import {actionBudget} from '../core/economy.ts'
import {dayBefore} from '../core/operations-calendar.ts'
import type {GameRun} from '../core/run-types.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {assertCourseCashDelta, assertCourseMoney} from './course-shape-assertions.ts'
import {requireCritical, type CourseCriticalContext, type CourseCriticalDefinition} from './course-critical-context.ts'

type Context = CourseCriticalContext
const resources = ['player-production']

export function oneDayLateStageStart(dueAt: string, stageDays: number): string {
 requireCritical(Number.isSafeInteger(stageDays) && stageDays > 0, 'LIFECYCLE_POSITIVE_STAGE_DAYS_REQUIRED')
 let startAt = addDays(dueAt, 1)
 for (let day = 0; day < stageDays; day++) startAt = dayBefore(startAt)
 return startAt
}

function course(ctx: Context, id?: string) {
 const row = id === undefined ? ctx.course().courses[0] : ctx.course().courses.find(c => c.id === id)
 requireCritical(row, 'LIFECYCLE_PUBLIC_COURSE_REQUIRED')
 return row
}
function cohort(ctx: Context, id?: string) {
 const row = id === undefined ? ctx.course().cohorts[0] : ctx.course().cohorts.find(c => c.id === id)
 requireCritical(row, 'LIFECYCLE_PUBLIC_COHORT_REQUIRED')
 return row
}
function company(ctx: Context, businessId: string) {
 const row = ctx.course().businesses.find(b => b.id === businessId)
 requireCritical(row, 'LIFECYCLE_PUBLIC_COMPANY_REQUIRED')
 return row
}
function action(run: GameRun, job: ProductionJob) {
 const row = run.economy.actions.find(a => a.definition.id === job.actionId)
 requireCritical(row, 'LIFECYCLE_JOB_ACTION_REQUIRED')
 return row
}
function currentJob(ctx: Context, jobId: string) {
 const row = ctx.h.run.operations?.jobs.find(j => j.id === jobId)
 requireCritical(row, 'LIFECYCLE_ACTUAL_JOB_REQUIRED')
 return row
}
function student(ctx: Context, cohortId: string, personId?: string) {
 const row = cohort(ctx, cohortId).students.find(e => e.paidRemainingFen > 0 && (personId === undefined || e.personId === personId))
 requireCritical(row, 'LIFECYCLE_ACTUAL_PAID_STUDENT_REQUIRED')
 return row
}
function sum(values: readonly number[]) { return values.reduce((n, value) => n + value, 0) }
function paidIdentity(ctx: Context, conversionId: string) {
 const row = ctx.h.run.video?.conversions.find(c => c.id === conversionId)
 requireCritical(row, 'LIFECYCLE_ORIGINAL_CONVERSION_REQUIRED')
 return {id: row.id, personId: row.personId, productVersion: row.productVersion, sourceId: row.sourceId, outcome: row.outcome}
}
function accounting(ctx: Context, cohortId: string, before: GameRun) {
 const money = assertCourseMoney(ctx.h.run, cohortId)
 return {money, cash: assertCourseCashDelta(before, ctx.h.run, money.accountId)}
}
function interruptRunning(ctx: Context, jobId: string, prefix: string) {
 const planned = currentJob(ctx, jobId)
 ctx.at(planned.startAt)
 const running = currentJob(ctx, jobId), beforeAction = action(ctx.h.run, running), before = ctx.h.run
 ctx.check(running.status === 'running' && beforeAction.status === 'executed' && beforeAction.executedAt === running.startAt,
  prefix + '-actually-started', {job: running, action: beforeAction})
 const budget = actionBudget(before.economy, running.startAt)
 ctx.h.send('InterruptJob', {jobId})
 const stopped = currentJob(ctx, jobId), afterAction = action(ctx.h.run, stopped)
 const expenses = ctx.h.run.economy.ledger.receipts.filter(r => r.kind === 'expense').map(r => JSON.parse(r.signature) as Record<string, unknown>)
 const cost = expenses.filter(r => r.referenceId === running.actionId)
 ctx.check(stopped.status === 'interrupted' && stopped.releasedAt === ctx.now()
  && afterAction.status === 'interrupted' && afterAction.executedAt === beforeAction.executedAt
  && JSON.stringify(afterAction.definition) === JSON.stringify(beforeAction.definition)
  && JSON.stringify(actionBudget(ctx.h.run.economy, running.startAt)) === JSON.stringify(budget)
  && (beforeAction.definition.costFen === 0 ? cost.length === 0 : cost.length === 1 && cost[0]?.amountFen === beforeAction.definition.costFen),
  prefix + '-spent-cost-ap-retained', {job: stopped, action: afterAction, budget, cost,
   cash: assertCourseCashDelta(before, ctx.h.run, beforeAction.definition.accountId)})
 return {job: running, before}
}

function refundOne(ctx: Context, prefix: string, phase: 'before' | 'half' | 'after') {
 const co = cohort(ctx), selected = student(ctx, co.id), before = ctx.h.run
 const old = assertCourseMoney(before, co.id), budget = actionBudget(before.economy, ctx.now())
 const [first, second] = selected.delivered
 ctx.check(phase === 'before' ? first === 0 && second === 0
  : phase === 'half' ? first === Math.ceil(selected.priceFen / 2) && second === 0
  : first === Math.ceil(selected.priceFen / 2) && second === Math.floor(selected.priceFen / 2),
  prefix + '-delivery-shape', {personId: selected.personId, priceFen: selected.priceFen,
   delivered: selected.delivered, stages: old.stages, payments: old.payments})
 const oldRefundIds = new Set(old.refunds.map(r => r.id))
 ctx.h.send('RefundCourseLearners', {cohortId: co.id, personIds: [selected.personId], reason: 'P3原付费学员依法退款'})
 const proof = assertCourseMoney(ctx.h.run, co.id), refund = proof.refunds.find(r => !oldRefundIds.has(r.id))
 requireCritical(refund, 'LIFECYCLE_NEW_REFUND_REQUIRED')
 const selectedAfter = cohort(ctx, co.id).students.find(e => e.id === selected.id)
 const payment = old.payments.find(p => p.id === selected.paymentBatchId)
 requireCritical(selectedAfter && payment, 'LIFECYCLE_ORIGINAL_PAYMENT_REQUIRED')
 const operations = refund.operationIds.map(id => proof.financial.find(r => r.id === id))
 const unearned = selected.priceFen - first - second
 ctx.check(refund.mode === 'full' && refund.personIds.length === 1 && refund.personIds[0] === selected.personId
  && refund.undeliveredFen === unearned && refund.deliveredFen === first + second
  && operations.length === (unearned > 0 ? 1 : 0) + (first > 0 ? 1 : 0) + (second > 0 ? 1 : 0)
  && operations.every(op => op && (op.kind === 'refund_undelivered'
   ? op.referenceId === payment.operationId && op.amountFen === unearned
   : op.kind === 'refund_delivered' && old.stages.some(stage => stage.operationId === op.referenceId
    && op.amountFen === selected.delivered[stage.index]))),
  prefix + '-original-payment-stage-references', {refund, operations, payment, stages: old.stages})
 const debtDelta = sum(proof.obligations.map(o => o.remainingFen)) - sum(old.obligations.map(o => o.remainingFen))
 const cash = assertCourseCashDelta(before, ctx.h.run, proof.accountId)
 ctx.check(selectedAfter.paidRemainingFen === 0 && selectedAfter.refundedFen === selected.priceFen
  && JSON.stringify(selectedAfter.delivered) === JSON.stringify(selected.delivered)
  && proof.contract?.prepaidFen === (old.contract?.prepaidFen ?? 0) - unearned
  && proof.contract?.recognizedIncomeFen === (old.contract?.recognizedIncomeFen ?? 0) - first - second
  && cash.transactionDeltaFen === -selected.priceFen + debtDelta
  && JSON.stringify(actionBudget(ctx.h.run.economy, ctx.now())) === JSON.stringify(budget),
  prefix + '-money-protection-zero-ap', {money: proof, cash, debtDelta, budget})
 const conversion = paidIdentity(ctx, selected.conversionId)
 ctx.check(conversion.personId === selected.personId && conversion.productVersion === selected.productKey
  && conversion.sourceId === selected.id && conversion.outcome === 'returned',
  prefix + '-purchase-identity-retained', conversion)
 return {cohortId: co.id, personId: selected.personId, proof}
}

function unresolvedOriginal(ctx: Context) {
 const c = course(ctx), co = cohort(ctx)
 const update = ctx.course().updates.find(u => u.courseId === c.id && u.resolvedAt === null && u.affectedCohortIds.includes(co.id))
 requireCritical(update, 'LIFECYCLE_ACTUAL_OLD_STUDENT_UPDATE_REQUIRED')
 return {c, co, update}
}
function refreshOriginal(ctx: Context, prefix: string) {
 const {c, co, update} = unresolvedOriginal(ctx), before = ctx.h.run
 const old = assertCourseMoney(before, co.id), oldVersions = c.versions.length
 const oldStudents = co.students.map(e => ({id: e.id, personId: e.personId, conversionId: e.conversionId, paymentBatchId: e.paymentBatchId, priceFen: e.priceFen}))
 ctx.check(update.occurredAt <= ctx.now() && update.anchorId === 'H004' && old.students.length > 0,
  prefix + '-actual-old-student-update', {update, students: oldStudents})
 ctx.h.send('StartCourseRefresh', {courseId: c.id, resources, startAt: ctx.now()})
 const refresh = course(ctx, c.id).refreshes.at(-1), job = refresh?.job
 requireCritical(job, 'LIFECYCLE_ACTUAL_REFRESH_JOB_REQUIRED')
 const currentAction = action(ctx.h.run, job)
 ctx.check(job.status === 'running' && job.completeAt === addDays(job.startAt, 7)
  && currentAction.status === 'executed' && currentAction.definition.costFen === 200000
  && currentAction.definition.actionPoints === 1,
  prefix + '-paid-seven-day-refresh', {job, action: currentAction})
 ctx.at(job.completeAt)
 const after = course(ctx, c.id), result = ctx.course().updates.find(u => u.id === update.id)
 const proof = assertCourseMoney(ctx.h.run, co.id)
 ctx.check(after.versions.length === oldVersions + 1 && after.versions.at(-1)?.jobId === job.id
  && result?.resolvedAt === job.completeAt && result.resolution === 'refreshed'
  && JSON.stringify(cohort(ctx, co.id).students.map(e => ({id: e.id, personId: e.personId, conversionId: e.conversionId,
   paymentBatchId: e.paymentBatchId, priceFen: e.priceFen}))) === JSON.stringify(oldStudents)
  && JSON.stringify(proof.payments) === JSON.stringify(old.payments)
  && proof.contract?.prepaidFen === old.contract?.prepaidFen
  && proof.contract?.recognizedIncomeFen === old.contract?.recognizedIncomeFen,
  prefix + '-free-original-students-version', {courseId: c.id, versions: after.versions, update: result,
   ...accounting(ctx, co.id, before)})
}
function teachOriginal(ctx: Context, cohortId: string) {
 for (const index of [0, 1] as const) {
  const co = cohort(ctx, cohortId)
  ctx.h.send('StartCourseStage', {cohortId, index, resources, startAt: index === 0 ? co.startAt : ctx.now()})
  const attempt = cohort(ctx, cohortId).stages[index]?.attempts.at(-1)
  requireCritical(attempt, 'LIFECYCLE_ORIGINAL_STAGE_ATTEMPT_REQUIRED')
  ctx.at(currentJob(ctx, attempt.jobId).completeAt)
 }
}
function newKnowledgeOffer(ctx: Context, productId: 'intro_recorded' | 'practical_cohort', businessId: string, prefix: string) {
 const old = course(ctx), oldCohort = cohort(ctx)
 const paidPeople = oldCohort.students.filter(e => e.paidRemainingFen > 0).map(e => e.personId)
 const existingCourses = new Set(ctx.course().courses.map(c => c.id))
 ctx.h.send('DefineCourse', {...ctx.originalPayload('DefineCourse'), businessId, productId, name: 'P3同知识身份边界-' + prefix})
 const c = ctx.course().courses.find(row => !existingCourses.has(row.id))
 requireCritical(c, 'LIFECYCLE_NEW_REAL_COURSE_REQUIRED')
 const before = ctx.h.run
 ctx.h.send('BuildCourseSample', {courseId: c.id, resources, startAt: ctx.now()})
 const job = course(ctx, c.id).job
 requireCritical(job, 'LIFECYCLE_NEW_SAMPLE_JOB_REQUIRED')
 ctx.at(job.completeAt)
 const p = ctx.course().catalog.products.find(p => p.id === productId)
 requireCritical(p, 'LIFECYCLE_PRODUCT_REQUIRED')
 ctx.check(course(ctx, c.id).status === 'ready' && currentJob(ctx, job.id).status === 'completed'
  && c.productKey === old.productKey && job.completeAt === addDays(job.startAt, p.sampleDays)
  && action(ctx.h.run, job).definition.costFen === p.sampleCostFen,
  prefix + '-new-real-sample-same-knowledge', {oldCourseId: old.id, newCourseId: c.id, job,
   action: action(ctx.h.run, job), cash: assertCourseCashDelta(before, ctx.h.run, company(ctx, businessId).accountId)})
 ctx.h.send('CreateCourseAudience', {...ctx.originalPayload('CreateCourseAudience'), courseId: c.id, priceFen: p.basePriceFen})
 const audience = ctx.course().audiences.filter(a => a.courseId === c.id).at(-1)
 requireCritical(audience, 'LIFECYCLE_NEW_PUBLIC_AUDIENCE_REQUIRED')
 const personId = audience.eligibleMembers.find(id => paidPeople.includes(id))
 ctx.check(personId !== undefined && audience.completedAt !== null && audience.sourceCohortIds.length > 0,
  prefix + '-original-person-still-eligible', {personId, eligibleMembers: audience.eligibleMembers, sourceCohortIds: audience.sourceCohortIds})
 const startAt = addDays(ctx.now(), 1), endAt = addDays(startAt, 21)
 ctx.h.send('PlanCourseCohort', {courseId: c.id, audienceId: audience.id, startAt, endAt,
  supportStartAt: '2023-07-01', seatLimit: 20, supportMode: 'guided_group', deploymentId: null, resources, promise: 'clear_scope'})
 const planned = ctx.course().cohorts.filter(co => co.courseId === c.id).at(-1)
 requireCritical(planned, 'LIFECYCLE_NEW_COHORT_REQUIRED')
 ctx.reject('EnrollCourseAudience', {cohortId: planned.id, personIds: [personId]}, 'AUDIENCE_ALREADY_CONVERTED', prefix + '-global-purchase-identity-rejected')
 ctx.check(planned.students.length === 0 && assertCourseMoney(ctx.h.run, planned.id).payments.length === 0
  && cohort(ctx, oldCohort.id).students.length === oldCohort.students.length,
  prefix + '-no-new-prepayment', {oldCohortId: oldCohort.id, newCohortId: planned.id,
   money: assertCourseMoney(ctx.h.run, planned.id), support: planned.supportJobs})
}

export const COURSE_CRITICAL_LIFECYCLE: readonly CourseCriticalDefinition[] = [
 {id: 'deadline-stage0', sourceRevision: 74, purpose: '首段完成日越过原due，命中原日历守卫',
  requiredChecks: ['deadline-stage0-actual-paid-no-attempt', 'deadline-stage0-exact-one-day-late-calendar', 'deadline-stage0-exact-deadline-rejection'], run(ctx: Context) {
   const co = cohort(ctx), c = course(ctx), p = ctx.course().catalog.products.find(p => p.id === c.productId), stage = co.stages[0]
   requireCritical(stage && p, 'LIFECYCLE_STAGE_ZERO_REQUIRED')
   ctx.check(co.students.some(e => e.paidRemainingFen > 0) && stage.attempts.length === 0 && stage.deliveredAt === null,
    'deadline-stage0-actual-paid-no-attempt', {cohortId: co.id, stage, money: assertCourseMoney(ctx.h.run, co.id)})
   const startAt = oneDayLateStageStart(stage.dueAt, p.stageDays), completeAt = addDays(startAt, p.stageDays)
   ctx.check(completeAt === addDays(stage.dueAt, 1) && startAt >= co.startAt,
    'deadline-stage0-exact-one-day-late-calendar', {startAt, completeAt, stageDays: p.stageDays, dueAt: stage.dueAt, classStartAt: co.startAt})
   ctx.reject('StartCourseStage', {cohortId: co.id, index: 0, resources, startAt},
    'COURSE_STAGE_DEADLINE_MISSED', 'deadline-stage0-exact-deadline-rejection')
  }},
 {id: 'deadline-stage1', sourceRevision: 76, purpose: '首段实交后次段完成日越过end，不能由前段守卫代替',
  requiredChecks: ['deadline-stage1-real-first-delivery', 'deadline-stage1-exact-one-day-late-calendar', 'deadline-stage1-exact-deadline-rejection'], run(ctx: Context) {
   const co = cohort(ctx), c = course(ctx), p = ctx.course().catalog.products.find(p => p.id === c.productId), stage = co.stages[1]
   requireCritical(stage && p, 'LIFECYCLE_STAGE_ONE_REQUIRED')
   ctx.check(co.stages[0]?.deliveredAt !== null && co.stages[0]?.amountFen !== 0 && stage.attempts.length === 0,
    'deadline-stage1-real-first-delivery', {stages: co.stages, money: assertCourseMoney(ctx.h.run, co.id)})
   const startAt = oneDayLateStageStart(stage.dueAt, p.stageDays), completeAt = addDays(startAt, p.stageDays)
   ctx.check(completeAt === addDays(stage.dueAt, 1) && startAt >= co.startAt,
    'deadline-stage1-exact-one-day-late-calendar', {startAt, completeAt, stageDays: p.stageDays, dueAt: stage.dueAt, classStartAt: co.startAt})
   ctx.reject('StartCourseStage', {cohortId: co.id, index: 1, resources, startAt},
    'COURSE_STAGE_DEADLINE_MISSED', 'deadline-stage1-exact-deadline-rejection')
  }},
 {id: 'interrupt-sample', sourceRevision: 70, purpose: '原样课真实运行后中断，不能产生免费样课版本',
  requiredChecks: ['interrupt-sample-actually-started', 'interrupt-sample-spent-cost-ap-retained', 'interrupt-sample-no-completed-version'], run(ctx: Context) {
   const c = course(ctx), job = c.job
   requireCritical(job, 'LIFECYCLE_ORIGINAL_SAMPLE_REQUIRED')
   interruptRunning(ctx, job.id, 'interrupt-sample')
   ctx.at(job.completeAt)
   const after = course(ctx, c.id)
   ctx.check(currentJob(ctx, job.id).status === 'interrupted' && after.status === 'building'
    && after.versions.length === 0 && after.sampleAttempts.includes(job.id), 'interrupt-sample-no-completed-version',
    {courseId: after.id, status: after.status, versions: after.versions, job: currentJob(ctx, job.id)})
  }},
 {id: 'interrupt-stage', sourceRevision: 74, purpose: '授课真实开工中断，未授课不认收入且到期依法退未交付',
  requiredChecks: ['interrupt-stage-actually-started', 'interrupt-stage-spent-cost-ap-retained', 'interrupt-stage-no-earned-income', 'interrupt-stage-due-unearned-refund'], run(ctx: Context) {
   const co = cohort(ctx)
   ctx.h.send('StartCourseStage', {cohortId: co.id, index: 0, resources, startAt: co.startAt})
   const attempt = cohort(ctx, co.id).stages[0]?.attempts.at(-1)
   requireCritical(attempt, 'LIFECYCLE_STAGE_ATTEMPT_REQUIRED')
   const stopped = interruptRunning(ctx, attempt.jobId, 'interrupt-stage')
   ctx.at(stopped.job.completeAt)
   let proof = assertCourseMoney(ctx.h.run, co.id)
   ctx.check(proof.stages[0]?.deliveredAt === null && proof.stages[0]?.amountFen === 0
    && proof.contract?.recognizedIncomeFen === 0 && proof.incomeMetrics.length === 0,
    'interrupt-stage-no-earned-income', proof)
   ctx.at(addDays(co.stages[0]!.dueAt, 1))
   proof = assertCourseMoney(ctx.h.run, co.id)
   ctx.check(cohort(ctx, co.id).teachingCancelled && proof.students.every(e => e.refundedUnearned === e.priceFen)
    && proof.refunds.some(r => r.mode === 'undelivered') && proof.contract?.prepaidFen === 0
    && currentJob(ctx, attempt.jobId).status === 'interrupted', 'interrupt-stage-due-unearned-refund', proof)
  }},
 {id: 'interrupt-support', sourceRevision: 81, purpose: '原支持真实开始后中断，已交学费及支持/补救责任不消失',
  requiredChecks: ['interrupt-support-actually-started', 'interrupt-support-spent-cost-ap-retained', 'interrupt-support-no-assessment-responsibility-retained'], run(ctx: Context) {
   const co = cohort(ctx), slot = co.supportJobs.find(s => !s.recovery)
   requireCritical(slot?.job, 'LIFECYCLE_ORIGINAL_SUPPORT_REQUIRED')
   interruptRunning(ctx, slot.job.id, 'interrupt-support')
   ctx.at(addDays(slot.job.completeAt, 1))
   const after = cohort(ctx, co.id)
   ctx.check(!after.supportSatisfied && after.assessmentAt === null && after.status === 'remedy'
    && after.students.some(e => e.paidRemainingFen > 0) && after.students.every(e => e.outcome === 'pending')
    && currentJob(ctx, slot.job.id).status === 'interrupted' && after.closedAt === null,
    'interrupt-support-no-assessment-responsibility-retained', {cohortId: co.id, supportSatisfied: after.supportSatisfied,
     assessmentAt: after.assessmentAt, status: after.status, ...accounting(ctx, co.id, ctx.original)})
  }},
 {id: 'refund-before', sourceRevision: 74, purpose: '未交付全额预款依法退回原付款，不冲不存在收入',
  requiredChecks: ['refund-before-delivery-shape', 'refund-before-original-payment-stage-references', 'refund-before-money-protection-zero-ap', 'refund-before-purchase-identity-retained'],
  run(ctx: Context) { refundOne(ctx, 'refund-before', 'before') }},
 {id: 'refund-half', sourceRevision: 76, purpose: '半程退款逐项引用原已交付收入及原未交付预款',
  requiredChecks: ['refund-half-delivery-shape', 'refund-half-original-payment-stage-references', 'refund-half-money-protection-zero-ap', 'refund-half-purchase-identity-retained'],
  run(ctx: Context) { refundOne(ctx, 'refund-half', 'half') }},
 {id: 'refund-after', sourceRevision: 78, purpose: '两段完课后窗口内退款冲两笔原收入，保留交付历史',
  requiredChecks: ['refund-after-delivery-shape', 'refund-after-original-payment-stage-references', 'refund-after-money-protection-zero-ap', 'refund-after-purchase-identity-retained'],
  run(ctx: Context) { refundOne(ctx, 'refund-after', 'after') }},
 {id: 'refund-window-closed', sourceRevision: 85, purpose: '真实闭窗后拒绝退款且完整原文不变',
  requiredChecks: ['refund-window-closed-actual-window', 'refund-window-closed-exact-refusal'], run(ctx: Context) {
   const co = cohort(ctx), selected = student(ctx, co.id)
   ctx.check(ctx.now() > co.refundUntil && co.feePostedAt !== null, 'refund-window-closed-actual-window', assertCourseMoney(ctx.h.run, co.id))
   ctx.reject('RefundCourseLearners', {cohortId: co.id, personIds: [selected.personId], reason: 'P3闭窗真实尝试'},
    'COURSE_REFUND_WINDOW_CLOSED', 'refund-window-closed-exact-refusal')
  }},
 {id: 'same-person-format', sourceRevision: 85, purpose: '同知识改变产品形式仍保留全局购买身份',
  requiredChecks: ['same-person-format-new-real-sample-same-knowledge', 'same-person-format-original-person-still-eligible', 'same-person-format-global-purchase-identity-rejected', 'same-person-format-no-new-prepayment'],
  run(ctx: Context) { newKnowledgeOffer(ctx, 'intro_recorded', course(ctx).businessId, 'same-person-format') }},
 {id: 'same-person-new-business', sourceRevision: 85, purpose: '真实关闭再新开公司不洗掉同知识购买身份，开业转资单列',
  requiredChecks: ['same-person-new-business-original-closed', 'same-person-new-business-real-opening-transfer', 'same-person-new-business-real-outline', 'same-person-new-business-new-real-sample-same-knowledge', 'same-person-new-business-original-person-still-eligible', 'same-person-new-business-global-purchase-identity-rejected', 'same-person-new-business-no-new-prepayment'], run(ctx: Context) {
   const old = course(ctx), oldCompany = company(ctx, old.businessId)
   ctx.check(cohort(ctx).closedAt !== null, 'same-person-new-business-original-closed', assertCourseMoney(ctx.h.run, cohort(ctx).id))
   ctx.h.send('WindDownBusiness', {businessId: oldCompany.id})
   ctx.h.send('CloseBusiness', {businessId: oldCompany.id})
   const beforeOpen = ctx.h.run, oldIds = new Set(ctx.course().businesses.map(b => b.id)), capitalFen = 2000000
   ctx.h.send('OpenCourseStudio', {capitalFen})
   const b = ctx.course().businesses.find(b => !oldIds.has(b.id))
   requireCritical(b, 'LIFECYCLE_NEW_COMPANY_REQUIRED')
   const opened = ctx.h.run, transfers = opened.economy.ledger.receipts.slice(beforeOpen.economy.ledger.receipts.length)
    .filter(r => r.kind === 'owner_transfer').map(r => JSON.parse(r.signature) as Record<string, unknown>)
   ctx.check(b.id !== oldCompany.id && b.accountId !== oldCompany.accountId && b.lifecycle === 'preparing'
    && b.funds.cashFen === capitalFen && transfers.length === 1 && transfers[0]?.accountId === 'personal'
    && transfers[0]?.targetAccountId === b.accountId && transfers[0]?.amountFen === capitalFen,
    'same-person-new-business-real-opening-transfer', {oldBusinessId: oldCompany.id, newBusinessId: b.id,
     accountId: b.accountId, transfers, personalCash: assertCourseCashDelta(beforeOpen, opened, 'personal')})
   ctx.h.send('StartCourseOutline', {businessId: b.id, resources, startAt: ctx.now()})
   const outline = ctx.course().outlines.find(o => o.businessId === b.id)
   requireCritical(outline?.job, 'LIFECYCLE_NEW_OUTLINE_REQUIRED')
   ctx.at(outline.job.completeAt)
   ctx.h.send('ActivateBusiness', {businessId: b.id})
   ctx.check(currentJob(ctx, outline.job.id).status === 'completed' && company(ctx, b.id).lifecycle === 'operating'
    && action(ctx.h.run, outline.job).definition.costFen === 10000 && action(ctx.h.run, outline.job).definition.actionPoints === 1,
    'same-person-new-business-real-outline', {job: currentJob(ctx, outline.job.id),
     cashFromActualOpen: assertCourseCashDelta(opened, ctx.h.run, b.accountId)})
   newKnowledgeOffer(ctx, 'practical_cohort', b.id, 'same-person-new-business')
  }},
 {id: 'same-person-after-refund', sourceRevision: 74, purpose: '真实退款不恢复该知识产品的购买资格',
  requiredChecks: ['same-person-after-refund-purchase-identity-retained', 'same-person-after-refund-exact-refusal'], run(ctx: Context) {
   const result = refundOne(ctx, 'same-person-after-refund', 'before')
   ctx.reject('EnrollCourseAudience', {cohortId: result.cohortId, personIds: [result.personId]},
    'AUDIENCE_ALREADY_CONVERTED', 'same-person-after-refund-exact-refusal')
  }},
 {id: 'advanced-without-study', sourceRevision: 69, purpose: '真实基础课ID但没有新需求研究时不能售卖进阶版',
  requiredChecks: ['advanced-without-study-real-parent-no-study', 'advanced-without-study-exact-refusal'], run(ctx: Context) {
   const c = course(ctx)
   ctx.check(c.edition === 'foundation' && !ctx.course().studies.some(st => st.predecessorId === c.id),
    'advanced-without-study-real-parent-no-study', {courseId: c.id, edition: c.edition, studies: ctx.course().studies})
   ctx.reject('DefineCourse', {...ctx.originalPayload('DefineCourse'), name: 'P3未调研进阶课', edition: 'advanced', predecessorId: c.id, studyId: null},
    'COURSE_NEW_DEMAND_REQUIRED', 'advanced-without-study-exact-refusal')
  }},
 {id: 'update-free-original', sourceRevision: 79, purpose: '旧学员真实付费更新只改版本不再收学费或洗产品身份',
  requiredChecks: ['update-free-original-actual-old-student-update', 'update-free-original-paid-seven-day-refresh', 'update-free-original-free-original-students-version'],
  run(ctx: Context) { refreshOriginal(ctx, 'update-free-original') }},
 {id: 'update-default', sourceRevision: 79, purpose: '更新违约真实暂停并依法退款原旧学员，不以暂停清责任',
  requiredChecks: ['update-default-actual-expiry', 'update-default-resume-rejected', 'update-default-old-money-refunded'], run(ctx: Context) {
   const {c, co, update} = unresolvedOriginal(ctx), before = ctx.h.run
   ctx.at(addDays(update.dueAt, 1))
   const expired = ctx.course().updates.find(u => u.id === update.id)
   ctx.check(expired?.defaulted && expired.resolvedAt === null && course(ctx, c.id).paused,
    'update-default-actual-expiry', {update: expired, courseId: c.id, paused: course(ctx, c.id).paused})
   ctx.reject('ResumeCourseEnrollment', {courseId: c.id}, 'COURSE_UPDATE_REQUIRED', 'update-default-resume-rejected')
   ctx.at(addDays(co.refundUntil, 1))
   const proof = assertCourseMoney(ctx.h.run, co.id), settled = ctx.course().updates.find(u => u.id === update.id)
   ctx.check(proof.students.every(e => sum(e.refundedDelivered) + e.refundedUnearned === e.priceFen)
    && proof.contract?.recognizedIncomeFen === 0 && proof.contract.prepaidFen === 0 && proof.feeFen === 0
    && settled?.resolution === 'refunded' && settled.settledCohortIds.includes(co.id),
    'update-default-old-money-refunded', {update: settled, ...accounting(ctx, co.id, before)})
  }},
 {id: 'update-interrupted', sourceRevision: 79, purpose: '更新真实开工后中断保留成本，不产生新版本或解除旧承诺',
  requiredChecks: ['update-interrupted-actually-started', 'update-interrupted-spent-cost-ap-retained', 'update-interrupted-no-version-default'], run(ctx: Context) {
   const {c, co, update} = unresolvedOriginal(ctx), versionCount = c.versions.length
   ctx.h.send('StartCourseRefresh', {courseId: c.id, resources, startAt: ctx.now()})
   const job = course(ctx, c.id).refreshes.at(-1)?.job
   requireCritical(job, 'LIFECYCLE_NEW_REFRESH_REQUIRED')
   interruptRunning(ctx, job.id, 'update-interrupted')
   ctx.at(addDays(update.dueAt, 1))
   const after = course(ctx, c.id), unresolved = ctx.course().updates.find(u => u.id === update.id)
   ctx.check(after.versions.length === versionCount && after.refreshes.some(r => r.jobId === job.id && !r.applied)
    && unresolved?.resolvedAt === null && unresolved.defaulted && after.paused
    && currentJob(ctx, job.id).status === 'interrupted' && cohort(ctx, co.id).students.some(e => e.paidRemainingFen > 0),
    'update-interrupted-no-version-default', {courseId: c.id, versions: after.versions, refreshes: after.refreshes,
     update: unresolved, money: assertCourseMoney(ctx.h.run, co.id)})
  }},
 {id: 'stop-sales-old', sourceRevision: 74, purpose: '停售只禁止新收款，原两段教学/更新/支持和闭窗责任继续',
  requiredChecks: ['stop-sales-old-original-contract-retained', 'stop-sales-old-new-audience-rejected', 'stop-sales-old-actual-two-stages', 'stop-sales-old-final-original-obligations'], run(ctx: Context) {
   const c = course(ctx), co = cohort(ctx), before = ctx.h.run, old = assertCourseMoney(before, co.id)
   ctx.h.send('StopCourseSales', {courseId: c.id})
   const stopped = assertCourseMoney(ctx.h.run, co.id)
   ctx.check(course(ctx, c.id).paused && JSON.stringify(stopped.students) === JSON.stringify(old.students)
    && JSON.stringify(stopped.contract) === JSON.stringify(old.contract) && JSON.stringify(stopped.jobs) === JSON.stringify(old.jobs),
    'stop-sales-old-original-contract-retained', stopped)
   ctx.reject('CreateCourseAudience', ctx.originalPayload('CreateCourseAudience'), 'COURSE_NEW_ENROLLMENT_PAUSED', 'stop-sales-old-new-audience-rejected')
   teachOriginal(ctx, co.id)
   ctx.check(cohort(ctx, co.id).stages.every(stage => stage.deliveredAt !== null && stage.amountFen > 0),
    'stop-sales-old-actual-two-stages', assertCourseMoney(ctx.h.run, co.id))
   ctx.at('2023-03-14')
   refreshOriginal(ctx, 'stop-sales-old-refresh')
   ctx.at(addDays(co.refundUntil, 1))
   const after = cohort(ctx, co.id)
   ctx.check(course(ctx, c.id).paused && after.supportJobs.some(s => !s.recovery && s.job?.status === 'completed')
    && after.feePostedAt === addDays(co.refundUntil, 1) && (after.closedAt !== null
     || ctx.h.run.economy.ledger.obligations.some(o => o.contractId === co.id && o.remainingFen > 0)),
    'stop-sales-old-final-original-obligations', accounting(ctx, co.id, before))
  }},
 {id: 'retire-old', sourceRevision: 79, purpose: '退役保留旧款/支持/更新，更新可付费完成但不能借Resume复活销售',
  requiredChecks: ['retire-old-original-duty-retained', 'retire-old-new-audience-rejected', 'retire-old-resume-rejected', 'retire-old-free-original-students-version', 'retire-old-retirement-persists'], run(ctx: Context) {
   const {c, co, update} = unresolvedOriginal(ctx), old = assertCourseMoney(ctx.h.run, co.id)
   ctx.h.send('RetireCourse', {courseId: c.id})
   ctx.check(course(ctx, c.id).status === 'retired' && course(ctx, c.id).paused
    && JSON.stringify(assertCourseMoney(ctx.h.run, co.id).students) === JSON.stringify(old.students)
    && ctx.course().updates.some(u => u.id === update.id && u.resolvedAt === null)
    && cohort(ctx, co.id).supportJobs.some(s => s.job?.status === 'planned'), 'retire-old-original-duty-retained',
    {update, money: assertCourseMoney(ctx.h.run, co.id)})
   ctx.reject('CreateCourseAudience', ctx.originalPayload('CreateCourseAudience'), 'COURSE_NEW_ENROLLMENT_PAUSED', 'retire-old-new-audience-rejected')
   ctx.reject('ResumeCourseEnrollment', {courseId: c.id}, 'COURSE_UPDATE_REQUIRED', 'retire-old-resume-rejected')
   refreshOriginal(ctx, 'retire-old')
   ctx.at(addDays(co.refundUntil, 1))
   ctx.check(course(ctx, c.id).status === 'retired' && course(ctx, c.id).paused
    && cohort(ctx, co.id).supportJobs.some(s => !s.recovery && s.job?.status === 'completed')
    && cohort(ctx, co.id).feePostedAt !== null, 'retire-old-retirement-persists', assertCourseMoney(ctx.h.run, co.id))
  }},
 {id: 'wind-down-old', sourceRevision: 74, purpose: '关业先保留原学员义务，未交付退款/闭窗后才合法Close',
  requiredChecks: ['wind-down-old-original-obligations-retained', 'wind-down-old-premature-close-rejected', 'wind-down-old-unearned-refund', 'wind-down-old-settled-then-closed'], run(ctx: Context) {
   const c = course(ctx), co = cohort(ctx), b = company(ctx, c.businessId), before = ctx.h.run
   const old = assertCourseMoney(before, co.id)
   ctx.h.send('WindDownBusiness', {businessId: b.id})
   const wound = assertCourseMoney(ctx.h.run, co.id)
   ctx.check(company(ctx, b.id).lifecycle === 'winding_down' && cohort(ctx, co.id).closedAt === null
    && JSON.stringify(wound.students) === JSON.stringify(old.students)
    && JSON.stringify(wound.contract) === JSON.stringify(old.contract)
    && cohort(ctx, co.id).supportJobs.every(s => s.job?.status === 'cancelled'),
    'wind-down-old-original-obligations-retained', wound)
   ctx.reject('CloseBusiness', {businessId: b.id}, 'COURSE_UNSETTLED_OBLIGATIONS', 'wind-down-old-premature-close-rejected')
   ctx.at(addDays(co.stages[0]!.dueAt, 1))
   const refunded = assertCourseMoney(ctx.h.run, co.id)
   ctx.check(refunded.students.every(e => e.refundedUnearned === e.priceFen) && refunded.contract?.prepaidFen === 0
    && refunded.contract.recognizedIncomeFen === 0 && cohort(ctx, co.id).teachingCancelled,
    'wind-down-old-unearned-refund', refunded)
   ctx.at(addDays(co.refundUntil, 1))
   const final = assertCourseMoney(ctx.h.run, co.id)
   ctx.check(final.closedAt !== null && final.feePostedAt !== null && final.feeFen === 0
    && final.obligations.every(o => o.remainingFen === 0), 'wind-down-old-settled-before-close', final)
   ctx.h.send('CloseBusiness', {businessId: b.id})
   ctx.check(company(ctx, b.id).lifecycle === 'closed' && company(ctx, b.id).funds.cashFen === 0
    && cohort(ctx, co.id).students.length === co.students.length, 'wind-down-old-settled-then-closed',
    {businessId: b.id, ...accounting(ctx, co.id, before), personalCash: assertCourseCashDelta(before, ctx.h.run, 'personal')})
  }},
 {id: 'zero-ap-refund', sourceRevision: 80, purpose: '真实四点耗尽仍能0AP退款，绝不等同0现金',
  requiredChecks: ['zero-ap-refund-actual-four-spent', 'zero-ap-refund-money-protection-zero-ap', 'zero-ap-refund-still-zero'], run(ctx: Context) {
   const budget = actionBudget(ctx.h.run.economy, ctx.now())
   ctx.check(budget.spent === 4 && budget.available === 0 && budget.reserved === 0,
    'zero-ap-refund-actual-four-spent', {budget, money: assertCourseMoney(ctx.h.run, cohort(ctx).id)})
   refundOne(ctx, 'zero-ap-refund', 'after')
   ctx.check(JSON.stringify(actionBudget(ctx.h.run.economy, ctx.now())) === JSON.stringify(budget),
    'zero-ap-refund-still-zero', {budget: actionBudget(ctx.h.run.economy, ctx.now()), cashIsNotAssumedZero: company(ctx, course(ctx).businessId).funds})
  }},
]
