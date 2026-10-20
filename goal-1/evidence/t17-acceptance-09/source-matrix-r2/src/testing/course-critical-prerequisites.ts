import {addDays, monthEnd, quarterOf} from '../core/calendar.ts'
import {projectRun} from '../core/commands.ts'
import {actionBudget} from '../core/economy.ts'
import {quarterLimit} from '../core/operations-calendar.ts'
import {assertCourseCashDelta, assertCourseMoney} from './course-shape-assertions.ts'
import {requireCritical, type CourseCriticalContext, type CourseCriticalDefinition} from './course-critical-context.ts'

type Context = CourseCriticalContext
type PublicCourse = ReturnType<Context['course']>['courses'][number]
const SELF = 'player-production'

function publicOperations(ctx: Context) {
 const operations = projectRun(ctx.h.run).operations
 requireCritical(operations, 'CRITICAL_PUBLIC_OPERATIONS_REQUIRED')
 return operations
}
function business(ctx: Context) {
 const result = ctx.course().businesses.find(row => row.lifecycle === 'operating')
 requireCritical(result, 'CRITICAL_OPERATING_COURSE_BUSINESS_REQUIRED')
 return result
}
function firstCase(ctx: Context) {
 const result = ctx.course().cases.find(row => row.kind === 'first_order')
 requireCritical(result, 'CRITICAL_REAL_PAID_FIRST_CASE_REQUIRED')
 return {kind: result.kind, id: result.id}
}
function licensedCase(ctx: Context) {
 const result = ctx.course().cases.find(row => row.kind === 'video' && row.licensed)
 requireCritical(result, 'CRITICAL_REAL_PAID_LICENSED_VIDEO_REQUIRED')
 return {kind: result.kind, id: result.id}
}
function definition(ctx: Context, name: string, productId = 'intro_recorded', topicId = 'image_workflows') {
 return {businessId: business(ctx).id, name, productId, topicId, edition: 'foundation', segment: 'ai_learners',
  cases: [firstCase(ctx)], consent: true, predecessorId: null, studyId: null}
}
function define(ctx: Context, payload: ReturnType<typeof definition>) {
 const before = new Set(ctx.course().courses.map(row => row.id))
 ctx.h.send('DefineCourse', payload)
 const added = ctx.course().courses.filter(row => !before.has(row.id))
 requireCritical(added.length === 1 && added[0], 'CRITICAL_ONE_REAL_DEFINED_COURSE_REQUIRED')
 return added[0]
}
function ready(ctx: Context) {
 const course = ctx.course().courses.find(row => row.productId === 'practical_cohort'
  && row.topicId === 'image_workflows' && row.edition === 'foundation' && row.status === 'ready')
 requireCritical(course && !course.paused && course.unresolvedUpdates.length === 0,
  'CRITICAL_ORIGINAL_READY_UNPAUSED_COURSE_REQUIRED')
 return course
}
function product(ctx: Context, course: PublicCourse) {
 const result = ctx.course().catalog.products.find(row => row.id === course.productId)
 requireCritical(result, 'CRITICAL_ORIGINAL_PRODUCT_REQUIRED')
 return result
}
function referralPayload(ctx: Context, course: PublicCourse, priceFen: number) {
 const sources = ctx.course().videoCohorts.filter(row => row.segment === course.segment && row.date <= ctx.now())
 requireCritical(sources.length > 0 && sources.some(row => row.members > 0), 'CRITICAL_REAL_REFERRAL_SOURCE_REQUIRED')
 return {courseId: course.id, mode: 'video_referral', priceFen, videoCohortIds: sources.map(row => row.id)}
}
function audience(ctx: Context, payload: ReturnType<typeof referralPayload>) {
 const old = new Set(ctx.course().audiences.map(row => row.id))
 ctx.h.send('CreateCourseAudience', payload)
 const added = ctx.course().audiences.filter(row => !old.has(row.id))
 requireCritical(added.length === 1 && added[0], 'CRITICAL_ONE_REAL_AUDIENCE_REQUIRED')
 return added[0]
}
function schedule(ctx: Context, course: PublicCourse) {
 const p = product(ctx, course), startAt = addDays(ctx.now(), 2)
 const endAt = addDays(startAt, Math.max(21, p.stageDays * 2))
 return {courseId: course.id, startAt, endAt, supportStartAt: quarterLimit(endAt),
  resources: [SELF], supportMode: 'guided_group', promise: 'clear_scope', deploymentId: null}
}
function completedAudience(ctx: Context, course: PublicCourse) {
 const result = ctx.course().audiences.find(row => row.courseId === course.id
  && row.completedAt !== null && row.eligibleMembers.length > 0)
 requireCritical(result, 'CRITICAL_ORIGINAL_COMPLETED_NONEMPTY_AUDIENCE_REQUIRED')
 return result
}
function jobCost(ctx: Context, actionId: string, accountId: string) {
 return ctx.h.run.economy.ledger.metrics.filter(row => row.referenceId === actionId
  && row.accountId === accountId && row.kind === 'cost').reduce((total, row) => total + row.deltaFen, 0)
}
function priceBoundary(id: string, boundary: 'min' | 'max', offset: -1 | 0 | 1): CourseCriticalDefinition {
 const accepted = offset === 0, check = id + (accepted ? '-accepted-frozen-price' : '-rejected-out-of-range')
 return {id, sourceRevision: 71, purpose: '原产品价格端点及越界原子拒绝',
  requiredChecks: accepted ? [check] : [check, check + '-complete-raw-unchanged'],
  run(ctx: Context) {
   const course = ready(ctx), p = product(ctx, course)
   const price = (boundary === 'min' ? p.minPriceFen : p.maxPriceFen) + offset
   const payload = referralPayload(ctx, course, price)
   if (!accepted) {ctx.reject('CreateCourseAudience', payload, 'COURSE_PRICE_OUT_OF_RANGE', check); return}
   const result = audience(ctx, payload)
   ctx.check(result.courseId === course.id && result.mode === 'video_referral' && result.priceFen === price
    && result.completedAt === ctx.now() && result.job === null, check, result)
  }}
}
function capacityRejection(id: string, mode: 'self_small' | 'guided_group'): CourseCriticalDefinition {
 const check = id + '-specific-capacity-guard'
 return {id, sourceRevision: 72, purpose: '完成受众和合法日期下的单资源原容量上限',
  requiredChecks: [check, check + '-complete-raw-unchanged'], run(ctx: Context) {
   const course = ready(ctx), p = product(ctx, course), target = completedAudience(ctx, course)
   ctx.reject('PlanCourseCohort', {...schedule(ctx, course), audienceId: target.id, supportMode: mode,
    seatLimit: (mode === 'self_small' ? p.selfCapacity : p.capacity) + 1},
   'COURSE_SUPPORT_CAPACITY_EXCEEDED', check)
  }}
}

export const COURSE_CRITICAL_PREREQUISITES: readonly CourseCriticalDefinition[] = [
 {id: 'case-missing', sourceRevision: 87, purpose: '保留空案例 schema 边界与真实未回款案例业务边界',
  requiredChecks: ['empty-case-schema', 'empty-case-schema-complete-raw-unchanged',
   'unpaid-case-business-guard', 'unpaid-case-business-guard-complete-raw-unchanged'], run(ctx: Context) {
   const video = ctx.video(), unpaid = video.contracts.find(row => row.settledAt === null
    && !row.feePosted && video.works.some(work => work.id === row.workId && work.materialId === 'licensed'))
   requireCritical(unpaid && !ctx.course().cases.some(row => row.id === unpaid.id), 'CRITICAL_REAL_UNPAID_VIDEO_REQUIRED')
   const payload = definition(ctx, '未回款案例边界')
   ctx.reject('DefineCourse', {...payload, cases: []}, 'INVALID_PAYLOAD', 'empty-case-schema')
   ctx.reject('DefineCourse', {...payload, cases: [{kind: 'video', id: unpaid.id}]},
    'COURSE_PAID_CASE_REQUIRED', 'unpaid-case-business-guard')
  }},
 {id: 'enterprise-case-count', sourceRevision: 67, purpose: '企业内训必须两个真实已付案例',
  requiredChecks: ['enterprise-one-paid-case', 'enterprise-one-paid-case-complete-raw-unchanged'], run(ctx: Context) {
   ctx.reject('DefineCourse', definition(ctx, '企业单案例边界', 'enterprise_training'),
    'COURSE_DEEP_CASES_REQUIRED', 'enterprise-one-paid-case')
  }},
 {id: 'material-rights-missing', sourceRevision: 99, purpose: '已付许可视频仍须同主体的独立课程素材权利',
  requiredChecks: ['missing-course-use-rights', 'missing-course-use-rights-complete-raw-unchanged'], run(ctx: Context) {
   const ref = licensedCase(ctx), b = business(ctx)
   requireCritical(!ctx.course().licenses.some(row => row.businessId === b.id && row.caseId === ref.id
    && row.job?.status === 'completed'), 'CRITICAL_MISSING_RIGHTS_CHECKPOINT_REQUIRED')
   const course = define(ctx, {...definition(ctx, '未获课程素材权利'), cases: [firstCase(ctx), ref]})
   ctx.reject('BuildCourseSample', {courseId: course.id, resources: [SELF], startAt: addDays(ctx.now(), 1)},
    'COURSE_MATERIAL_RIGHTS_REQUIRED', 'missing-course-use-rights')
  }},
 {id: 'material-rights-interrupted', sourceRevision: 106, purpose: '真实已开工许可中断保留成本且不授予课程素材权利',
  requiredChecks: ['license-actually-running', 'license-interrupted-retains-cost-ap',
   'interrupted-course-use-rights', 'interrupted-course-use-rights-complete-raw-unchanged'], run(ctx: Context) {
   const ref = licensedCase(ctx), b = business(ctx)
   const license = ctx.course().licenses.find(row => row.businessId === b.id && row.caseId === ref.id
    && row.job?.status === 'planned')
   requireCritical(license?.job, 'CRITICAL_ORIGINAL_PLANNED_LICENSE_REQUIRED')
   const originalJob = license.job, beforeStart = ctx.h.run
   const plannedBudget = actionBudget(beforeStart.economy, originalJob.startAt)
   ctx.at(originalJob.startAt)
   const running = ctx.course().licenses.find(row => row.id === license.id)?.job
   const before = actionBudget(ctx.h.run.economy, originalJob.startAt)
   const startCash = assertCourseCashDelta(beforeStart, ctx.h.run, b.accountId)
   ctx.check(running?.status === 'running' && running.startAt === ctx.now()
    && startCash.transactionDeltaFen === -30000 && before.spent === plannedBudget.spent + 1
    && before.reserved === plannedBudget.reserved - 1,
   'license-actually-running', {running, startCash, plannedBudget, runningBudget: before})
   const beforeInterrupt = ctx.h.run
   ctx.h.send('InterruptJob', {jobId: originalJob.id})
   const interrupted = ctx.course().licenses.find(row => row.id === license.id)?.job
   const action = ctx.h.run.economy.actions.find(row => row.definition.id === originalJob.actionId)
   const after = actionBudget(ctx.h.run.economy, originalJob.startAt)
   const interruptCash = assertCourseCashDelta(beforeInterrupt, ctx.h.run, b.accountId)
   ctx.check(interrupted?.status === 'interrupted' && interrupted.releasedAt === ctx.now()
    && action?.status === 'interrupted' && action.definition.actionPoints === 1
    && action.definition.costFen === 30000 && jobCost(ctx, originalJob.actionId, b.accountId) === 30000
    && after.spent === before.spent && after.reserved === before.reserved && interruptCash.transactionDeltaFen === 0,
   'license-interrupted-retains-cost-ap', {job: interrupted, action, before, after, interruptCash})
   const course = define(ctx, {...definition(ctx, '许可中断后样课'), cases: [firstCase(ctx), ref]})
   ctx.reject('BuildCourseSample', {courseId: course.id, resources: [SELF], startAt: addDays(ctx.now(), 1)},
    'COURSE_MATERIAL_RIGHTS_REQUIRED', 'interrupted-course-use-rights')
  }},
 {id: 'qualification-missing', sourceRevision: 67, purpose: '正常早期视频工具未开放资格时样课原子拒绝',
  requiredChecks: ['video-qualification-publicly-unavailable', 'missing-tool-qualification',
   'missing-tool-qualification-complete-raw-unchanged'], run(ctx: Context) {
   const course = define(ctx, definition(ctx, '视频资格缺失边界', 'intro_recorded', 'video_workflows'))
   ctx.check(course.qualificationReasons.length > 0, 'video-qualification-publicly-unavailable',
    {date: ctx.now(), reasons: course.qualificationReasons})
   ctx.reject('BuildCourseSample', {courseId: course.id, resources: [SELF], startAt: addDays(ctx.now(), 1)},
    'COURSE_TOOL_QUALIFICATION_REQUIRED', 'missing-tool-qualification')
  }},
 {id: 'audience-paid', sourceRevision: 71, purpose: '真实付费营销的现金/AP和实际完成前后受众',
  requiredChecks: ['paid-marketing-start-cost-ap', 'paid-marketing-not-completed-early', 'paid-marketing-real-completion'],
  run(ctx: Context) {
   const course = ready(ctx), b = business(ctx), p = product(ctx, course)
   const old = new Set(ctx.course().audiences.map(row => row.id)), before = ctx.h.run
   const budgetBefore = actionBudget(before.economy, ctx.now())
   ctx.h.send('CreateCourseAudience', {courseId: course.id, mode: 'paid', priceFen: p.basePriceFen,
    resources: [SELF], startAt: ctx.now()})
   const added = ctx.course().audiences.filter(row => !old.has(row.id)), target = added[0]
   requireCritical(added.length === 1 && target?.job, 'CRITICAL_REAL_PAID_MARKETING_JOB_REQUIRED')
   const job = target.job, action = ctx.h.run.economy.actions.find(row => row.definition.id === job.actionId)
   const cash = assertCourseCashDelta(before, ctx.h.run, b.accountId), budgetAfter = actionBudget(ctx.h.run.economy, ctx.now())
   ctx.check(job.status === 'running' && job.startAt === ctx.now() && job.completeAt === addDays(ctx.now(), 7)
    && job.resources.length === 1 && job.resources[0] === SELF && action?.definition.costFen === 600000
    && action.definition.actionPoints === 1 && jobCost(ctx, job.actionId, b.accountId) === 600000
    && cash.transactionDeltaFen === -600000 && budgetAfter.spent === budgetBefore.spent + 1
    && business(ctx).metrics.incomeFen === b.metrics.incomeFen,
   'paid-marketing-start-cost-ap', {job, action, cash, budgetBefore, budgetAfter})
   ctx.check(target.completedAt === null && target.members.length === 0 && target.eligibleMembers.length === 0,
    'paid-marketing-not-completed-early', target)
   ctx.at(job.completeAt)
   const completed = ctx.course().audiences.find(row => row.id === target.id)
   ctx.check(completed?.job?.status === 'completed' && completed.completedAt === job.completeAt
    && completed.members.length > 0 && completed.eligibleMembers.length > 0
    && completed.eligibleMembers.every(person => completed.members.includes(person))
    && new Set(completed.members).size === completed.members.length
    && business(ctx).metrics.incomeFen === b.metrics.incomeFen,
   'paid-marketing-real-completion', completed)
  }},
 {id: 'audience-referral', sourceRevision: 71, purpose: '真实同分群免费转介不消费现金/AP或提前造付费成果',
  requiredChecks: ['referral-source-and-actual-audience', 'referral-zero-cash-ap'], run(ctx: Context) {
   const course = ready(ctx), b = business(ctx), payload = referralPayload(ctx, course, product(ctx, course).basePriceFen)
   const sources = ctx.course().videoCohorts.filter(row => payload.videoCohortIds.includes(row.id))
   const before = ctx.h.run, budgetBefore = actionBudget(before.economy, ctx.now())
   const actual = audience(ctx, payload), cash = assertCourseCashDelta(before, ctx.h.run, b.accountId)
   ctx.check(actual.completedAt === ctx.now() && actual.job === null && actual.jobId === null
    && actual.sourceCohortIds.length === sources.length && sources.every(row => actual.sourceCohortIds.includes(row.id))
    && actual.members.length > 0 && actual.members.length <= sources.reduce((n, row) => n + row.members, 0)
    && new Set(actual.members).size === actual.members.length
    && actual.eligibleMembers.every(person => actual.members.includes(person)),
   'referral-source-and-actual-audience', {sources, actual, identityUnionIndependentlyRecomputed: false})
   const budgetAfter = actionBudget(ctx.h.run.economy, ctx.now())
   ctx.check(cash.transactionDeltaFen === 0 && cash.appendedTransactionCount === 0
    && budgetAfter.spent === budgetBefore.spent && budgetAfter.reserved === budgetBefore.reserved,
   'referral-zero-cash-ap', {cash, budgetBefore, budgetAfter})
  }},
 priceBoundary('price-min', 'min', 0),
 priceBoundary('price-max', 'max', 0),
 priceBoundary('price-below', 'min', -1),
 priceBoundary('price-above', 'max', 1),
 capacityRejection('self-capacity-over', 'self_small'),
 capacityRejection('product-capacity-over', 'guided_group'),
 {id: 'three-resources-capacity', sourceRevision: 85, purpose: '真实招聘计薪的本人加两雇员与三份原支持容量/费用/AP',
  requiredChecks: ['three-resources-self-funded-owner-transfer', 'three-resources-real-hiring-cost-ap',
   'three-resources-over-limit', 'three-resources-over-limit-complete-raw-unchanged',
   'three-resources-capacity-reserved', 'three-resources-wages-actually-paid'], run(ctx: Context) {
   const course = ready(ctx), b = business(ctx), p = product(ctx, course), startDate = ctx.now()
   requireCritical(startDate === '2023-04-16' && quarterOf(startDate) === '2023-Q2', 'CRITICAL_REAL_CLOSED_Q2_CHECKPOINT_REQUIRED')
   requireCritical(ctx.course().cohorts.some(row => row.courseId === course.id && row.closedAt !== null),
    'CRITICAL_ORIGINAL_ACTUAL_CLOSED_IMAGE_COHORT_REQUIRED')
   const personal = projectRun(ctx.h.run).accounts.find(row => row.accountId === 'personal')
   requireCritical(personal && personal.availableFen >= 1500000, 'CRITICAL_REAL_PERSONAL_CAPITAL_REQUIRED')
   const fundingBefore = ctx.h.run, incomeBefore = b.metrics.incomeFen
   ctx.h.send('FundBusiness', {businessId: b.id, amountFen: 1500000})
   const companyFunding = assertCourseCashDelta(fundingBefore, ctx.h.run, b.accountId)
   const personalFunding = assertCourseCashDelta(fundingBefore, ctx.h.run, 'personal')
   ctx.check(companyFunding.transactionDeltaFen === 1500000 && personalFunding.transactionDeltaFen === -1500000
    && business(ctx).metrics.incomeFen === incomeBefore,
   'three-resources-self-funded-owner-transfer', {companyFunding, personalFunding, incomeBefore})
   const hireBefore = ctx.h.run, budgetBefore = actionBudget(hireBefore.economy, ctx.now())
   requireCritical(budgetBefore.available >= 2, 'CRITICAL_TWO_REAL_HIRING_AP_REQUIRED')
   for (const definitionId of ['editor-lin', 'assistant-zhou'])
    ctx.h.send('HireWorker', {businessId: b.id, definitionId})
   const workers = publicOperations(ctx).workers.filter(row => row.sponsorBusinessId === b.id && row.to === null
    && (row.definitionId === 'editor-lin' || row.definitionId === 'assistant-zhou'))
   requireCritical(workers.length === 2 && new Set(workers.map(row => row.definitionId)).size === 2,
    'CRITICAL_TWO_ACTUAL_HIRED_WORKERS_REQUIRED')
   const hireCash = assertCourseCashDelta(hireBefore, ctx.h.run, b.accountId)
   const budgetAfter = actionBudget(ctx.h.run.economy, ctx.now())
   ctx.check(hireCash.transactionDeltaFen === -100000 && budgetAfter.spent === budgetBefore.spent + 2
    && workers.every(row => row.from === startDate && row.units === 1
     && row.monthlyWageFen === (row.definitionId === 'editor-lin' ? 300000 : 250000)),
   'three-resources-real-hiring-cost-ap', {workers, hireCash, budgetBefore, budgetAfter})
   const target = audience(ctx, referralPayload(ctx, course, p.basePriceFen))
   requireCritical(target.completedAt !== null && target.eligibleMembers.length > 0, 'CRITICAL_THREE_RESOURCES_AUDIENCE_REQUIRED')
   const resources = [SELF, ...workers.map(row => row.id)]
   const payload = {courseId: course.id, audienceId: target.id, startAt: '2023-07-01', endAt: '2023-07-22',
    supportStartAt: '2023-10-01', resources, supportMode: 'guided_group', promise: 'clear_scope', deploymentId: null}
   ctx.reject('PlanCourseCohort', {...payload, seatLimit: p.capacity * 3 + 1},
    'COURSE_SUPPORT_CAPACITY_EXCEEDED', 'three-resources-over-limit')
   const old = new Set(ctx.course().cohorts.map(row => row.id)), planBefore = ctx.h.run
   const supportBudgetBefore = actionBudget(planBefore.economy, payload.supportStartAt)
   ctx.h.send('PlanCourseCohort', {...payload, seatLimit: p.capacity * 3})
   const added = ctx.course().cohorts.filter(row => !old.has(row.id)), cohort = added[0]
   requireCritical(added.length === 1 && cohort, 'CRITICAL_THREE_RESOURCE_COHORT_REQUIRED')
   const money = assertCourseMoney(ctx.h.run, cohort.id), planCash = assertCourseCashDelta(planBefore, ctx.h.run, b.accountId)
   const supportBudgetAfter = actionBudget(ctx.h.run.economy, payload.supportStartAt)
   const support = cohort.supportJobs, actions = support.map(slot => ctx.h.run.economy.actions.find(row => row.definition.id === slot.job?.actionId))
   ctx.check(cohort.seatLimit === 120 && support.length === 3 && support.every(slot => !slot.recovery
     && slot.capacity === p.capacity && slot.job?.status === 'planned' && slot.job.startAt === payload.supportStartAt
     && slot.job.completeAt === '2023-10-08' && slot.job.resources.length === 1
     && resources.includes(slot.job.resources[0] ?? ''))
    && new Set(support.flatMap(slot => slot.job?.resources ?? [])).size === 3
    && actions.every(action => action?.status === 'reserved' && action.definition.costFen === 300000 && action.definition.actionPoints === 1)
    && supportBudgetAfter.reserved === supportBudgetBefore.reserved + 3
    && supportBudgetAfter.spent + supportBudgetAfter.reserved <= 4 && planCash.transactionDeltaFen === 0
    && money.company.heldFen - businessFrom(planBefore, b.id).funds.heldFen === 900000,
   'three-resources-capacity-reserved', {cohort, money, actions, planCash, supportBudgetBefore, supportBudgetAfter,
    actualEnrolledStudents: cohort.students.length, capacityIsNotEnrolledCount: true})
   const payrollBefore = ctx.h.run
   ctx.at(monthEnd(startDate))
   const payroll = publicOperations(ctx).payroll.filter(row => row.kind === 'wage'
    && workers.some(worker => worker.id === row.entityId) && row.month === startDate.slice(0, 7))
   const ledger = ctx.h.run.economy.ledger
   const wageProof = workers.map(worker => {
    const monthDays = Number(monthEnd(worker.from).slice(-2)), paidDays = monthDays - Number(worker.from.slice(-2)) + 1
    const expected = Number(BigInt(worker.monthlyWageFen) * BigInt(paidDays) / BigInt(monthDays))
    const row = payroll.find(item => item.entityId === worker.id)
    const obligation = ledger.obligations.find(item => item.originOperationId === row?.operationId)
    const paid = obligation ? -ledger.transactions.filter(tx => tx.referenceId === obligation.id)
     .flatMap(tx => tx.lines.filter(line => line.accountId === b.accountId)).reduce((n, line) => n + line.deltaFen, 0) : 0
    return {worker, expected, payroll: row ?? null, obligation: obligation ?? null, paid}
   })
   const payrollCash = assertCourseCashDelta(payrollBefore, ctx.h.run, b.accountId)
   ctx.check(payroll.length === 2 && wageProof.every(row => row.expected > 0 && row.payroll?.amountFen === row.expected
     && row.payroll.operationId !== null && row.obligation?.accountId === b.accountId
     && row.obligation.amountFen === row.expected && row.obligation.remainingFen === 0 && row.paid === row.expected)
    && payrollCash.transactionDeltaFen <= -wageProof.reduce((n, row) => n + row.expected, 0)
    && !ledger.obligations.some(row => row.accountId === b.accountId && row.date <= ctx.now() && row.remainingFen > 0),
   'three-resources-wages-actually-paid', {wageProof, payrollCash, currentCourseMoney: assertCourseMoney(ctx.h.run, cohort.id),
    futureTeachingAndSupportExecuted: false})
  }},
]

function businessFrom(run: Context['h']['run'], businessId: string) {
 const accounts = projectRun(run).accounts
 const b = projectRun(run).operations?.businesses.find(row => row.id === businessId)
 requireCritical(b, 'CRITICAL_BEFORE_BUSINESS_REQUIRED')
 const funds = accounts.find(row => row.accountId === b.accountId)
 requireCritical(funds, 'CRITICAL_BEFORE_BUSINESS_FUNDS_REQUIRED')
 return {business: b, funds}
}
