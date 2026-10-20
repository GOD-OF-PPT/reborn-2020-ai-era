import {addDays} from '../core/calendar.ts'
import {actionBudget} from '../core/economy.ts'
import {hashValue} from '../core/hash.ts'
import {accountFunds} from '../core/ledger.ts'
import {assertCourseCashDelta, assertCourseMoney} from './course-shape-assertions.ts'
import {requireCritical, type CourseCriticalContext, type CourseCriticalDefinition} from './course-critical-context.ts'

type PublicCourse = ReturnType<CourseCriticalContext['course']>['courses'][number]
type PublicCohort = ReturnType<CourseCriticalContext['course']>['cohorts'][number]
type SupportMode = 'guided_group' | 'assisted_group' | 'delegated_group'
const resources = ['player-production']

function course(ctx: CourseCriticalContext, id: string): PublicCourse {
 const value = ctx.course().courses.find(c => c.id === id)
 requireCritical(value, 'RISK_CRITICAL_COURSE_REQUIRED')
 return value
}
function cohort(ctx: CourseCriticalContext, id: string): PublicCohort {
 const value = ctx.course().cohorts.find(c => c.id === id)
 requireCritical(value, 'RISK_CRITICAL_COHORT_REQUIRED')
 return value
}
function latestCohort(ctx: CourseCriticalContext) {
 const value = ctx.course().cohorts.at(-1)
 requireCritical(value, 'RISK_CRITICAL_ORIGINAL_COHORT_REQUIRED')
 return value
}
function videoCourse(ctx: CourseCriticalContext) {
 const value = ctx.course().courses.find(c => c.topicId === 'video_workflows' && c.edition === 'foundation')
 requireCritical(value, 'RISK_CRITICAL_ORIGINAL_VIDEO_COURSE_REQUIRED')
 return value
}
function deployment(ctx: CourseCriticalContext, businessId: string) {
 const value = ctx.story().deployments.find(d => d.businessId === businessId)
 requireCritical(value, 'RISK_CRITICAL_ORIGINAL_DEPLOYMENT_REQUIRED')
 return value
}
function accountId(ctx: CourseCriticalContext, businessId: string) {
 const value = ctx.course().businesses.find(b => b.id === businessId)
 requireCritical(value, 'RISK_CRITICAL_ORIGINAL_PAYER_REQUIRED')
 return value.accountId
}
function money(ctx: CourseCriticalContext, cohortId: string, label: string) {
 const proof = assertCourseMoney(ctx.h.run, cohortId)
 const cash = assertCourseCashDelta(ctx.original, ctx.h.run, proof.accountId)
 ctx.check(proof.independentChecks.allFinancialIdentitiesPassed && cash.allCashIdentitiesPassed,
  label, {cohortId, ...proof.independentChecks, transactionDeltaFen: cash.transactionDeltaFen})
 return proof
}
function identity(students: PublicCohort['students']) {
 return students.map(s => ({id: s.id, personId: s.personId, paymentBatchId: s.paymentBatchId,
  conversionId: s.conversionId, productKey: s.productKey}))
}
function originalPeople(ctx: CourseCriticalContext, co: PublicCohort) {
 const people = co.availablePeople.slice(0, 20)
 ctx.check(people.length === 20, 'ORIGINAL_TWENTY_PUBLIC_PEOPLE_REQUIRED', {cohortId: co.id, people})
 return people
}
function freshVideoAudience(ctx: CourseCriticalContext) {
 const c = videoCourse(ctx)
 ctx.h.send('CreateCourseAudience', {courseId: c.id, mode: 'video_referral', priceFen: 19900,
  videoCohortIds: ctx.course().videoCohorts.filter(v => v.segment === 'ai_learners').map(v => v.id)})
 const audience = ctx.course().audiences.at(-1)
 requireCritical(audience && audience.courseId === c.id, 'RISK_CRITICAL_ACTUAL_VIDEO_AUDIENCE_REQUIRED')
 const people = audience.eligibleMembers.slice(0, 20)
 ctx.check(people.length === 20, 'VIDEO_CLEAR_SCOPE_ORIGINAL_TWENTY_PUBLIC_PEOPLE', {people, audienceId: audience.id})
 return {c, audience, people}
}
function teachVideo(ctx: CourseCriticalContext, cohortId: string) {
 ctx.h.send('StartCourseStage', {cohortId, index: 0, resources, startAt: '2024-10-09'})
 ctx.at('2024-10-16')
 ctx.h.send('StartCourseStage', {cohortId, index: 1, resources, startAt: '2024-10-16'})
 ctx.at('2024-10-23')
 const co = cohort(ctx, cohortId)
 ctx.check(co.stages.every(s => s.deliveredAt !== null && s.amountFen > 0),
  'VIDEO_TWO_ORIGINAL_STAGES_ACTUALLY_DELIVERED', {cohortId, stages: co.stages})
}

/** Delays the original support, never the feedback-to-remedy window or a completed job. */
function delayedComplaint(ctx: CourseCriticalContext) {
 const {c, audience, people} = freshVideoAudience(ctx), d = deployment(ctx, c.businessId)
 ctx.check(ctx.now() === '2024-10-08' && d.currentGrant?.level === 'approval',
  'DELAYED_ACTUAL_APPROVAL_BEFORE_ORIGINAL_PLAN', {deploymentId: d.id, grant: d.currentGrant})
 ctx.h.send('PlanCourseCohort', {courseId: c.id, audienceId: audience.id, startAt: '2024-10-09',
  endAt: '2024-10-30', supportStartAt: '2025-01-02', seatLimit: 20,
  supportMode: 'assisted_group', deploymentId: d.id, resources, promise: 'clear_scope'})
 const co = latestCohort(ctx)
 ctx.h.send('EnrollCourseAudience', {cohortId: co.id, personIds: people})
 teachVideo(ctx, co.id)
 const beforeRefresh = identity(cohort(ctx, co.id).students)
 ctx.at('2024-12-26')
 ctx.check(course(ctx, c.id).unresolvedUpdates.some(u => u.anchorId === 'H008'),
  'DELAYED_H008_ACTUALLY_OCCURRED', {courseId: c.id})
 ctx.h.send('StartCourseRefresh', {courseId: c.id, resources, startAt: '2024-12-26'})
 ctx.at('2025-01-02')
 const refresh = course(ctx, c.id).refreshes.at(-1)
 ctx.check(refresh?.job?.status === 'completed' && refresh.job.completeAt === '2025-01-02'
  && !course(ctx, c.id).unresolvedUpdates.some(u => u.anchorId === 'H008')
  && hashValue(identity(cohort(ctx, co.id).students)) === hashValue(beforeRefresh),
  'DELAYED_H008_REAL_REFRESH_WITHOUT_REBILLING', {refresh, cohortId: co.id})
 ctx.at('2025-01-06')
 const feedback = cohort(ctx, co.id), originalSupport = feedback.supportJobs.find(s => !s.recovery)
 const complaints = feedback.students.filter(s => s.paidRemainingFen > 0 && s.outcome === 'needs_recovery')
 ctx.check(originalSupport?.mode === 'assisted_group' && originalSupport.job?.status === 'completed'
  && originalSupport.job.startAt === '2025-01-02' && originalSupport.job.completeAt === '2025-01-06'
  && feedback.assessmentAt === '2025-01-06' && complaints.length > 0,
  'DELAYED_ORIGINAL_COMPLAINTS_REAL', {cohortId: co.id, originalSupport,
   complaints: identity(complaints), remedyDueAt: feedback.remedyDueAt})
 const q4 = actionBudget(ctx.h.run.economy, '2024-12-31')
 const q1 = actionBudget(ctx.h.run.economy, ctx.now())
 ctx.check(q4.spent + q4.reserved === 4 && q1.available >= 1,
  'DELAYED_REAL_FOUR_POINT_BUDGET', {q4, q1})
 money(ctx, co.id, 'DELAYED_ORIGINAL_MONEY_IDENTITIES')
 return {courseId: c.id, cohortId: co.id, businessId: c.businessId, deploymentId: d.id,
  complaints: identity(complaints), students: identity(feedback.students)}
}

function recovery(ctx: CourseCriticalContext, mode: SupportMode) {
 const target = delayedComplaint(ctx)
 const terms = mode === 'guided_group' ? {costFen: 300000, days: 7}
  : mode === 'assisted_group' ? {costFen: 150000, days: 4} : {costFen: 100000, days: 2}
 if (mode === 'delegated_group') {
  const d = deployment(ctx, target.businessId)
  const actualAssisted = d.supportResults.find(r => r.mode === 'assisted_group'
   && r.status === 'completed' && r.paidCostFen === 150000 && r.manualCostFen === 300000
   && r.startAt === '2025-01-02' && r.completeAt === '2025-01-06')
  ctx.check(d.observedBusinessResult && actualAssisted
   && cohort(ctx, target.cohortId).stages.some(s => s.amountFen > 0),
   'DELEGATED_REAL_ASSISTED_RESULT_BEFORE_EXPANSION', {deploymentId: d.id, actualAssisted})
  const economy = hashValue(ctx.h.run.economy)
  ctx.h.send('SetHengxingAuthority', {deploymentId: d.id, businessId: target.businessId,
   level: 'cross_flow', scopes: ['course_support', 'external_service_commitments'], cashLimitFen: 500000,
   expiresAt: '2025-12-31', externalDelegation: true, consent: true})
  const expanded = deployment(ctx, target.businessId)
  ctx.check(expanded.currentGrant?.level === 'cross_flow'
   && expanded.currentGrant.externalDelegation && expanded.externalDelegations.length === 1
   && hashValue(ctx.h.run.economy) === economy,
   'DELEGATED_SEPARATE_EXPLICIT_EXPANSION_NO_FREE_MONEY_OR_AP', {grant: expanded.currentGrant})
 }
 const payer = accountId(ctx, target.businessId), beforeCash = accountFunds(ctx.h.run.economy.ledger, payer).cashFen
 ctx.h.send('StartCourseRecovery', {cohortId: target.cohortId, supportMode: mode,
  deploymentId: mode === 'guided_group' ? null : target.deploymentId, resources, startAt: ctx.now()})
 const slot = cohort(ctx, target.cohortId).supportJobs.find(s => s.recovery)
 requireCritical(slot?.job, 'RISK_CRITICAL_ACTUAL_RECOVERY_JOB_REQUIRED')
 const action = ctx.h.run.economy.actions.find(a => a.definition.id === slot.job!.actionId)
 ctx.check(slot.mode === mode && slot.job.status === 'running' && slot.job.startAt === '2025-01-06'
  && slot.job.completeAt === addDays('2025-01-06', terms.days)
  && slot.job.completeAt <= cohort(ctx, target.cohortId).remedyDueAt
  && action?.definition.costFen === terms.costFen && action.definition.actionPoints === 1
  && beforeCash - accountFunds(ctx.h.run.economy.ledger, payer).cashFen === terms.costFen,
  'RECOVERY_MODE_REAL_PAID_TERMS', {mode, slot, actualCostFen: action?.definition.costFen,
   actualActionPoints: action?.definition.actionPoints})
 if (mode !== 'guided_group') {
  const result = deployment(ctx, target.businessId).supportResults.find(r => r.jobId === slot.job!.id)
  ctx.check(result?.mode === mode && result.paidCostFen === terms.costFen,
   'RECOVERY_ORIGINAL_AUTHORIZED_SUPPORT_USE', {mode, result})
 }
 ctx.at(addDays(slot.job.completeAt, -1))
 ctx.check(target.complaints.every(old => cohort(ctx, target.cohortId).students.some(s => s.id === old.id
  && s.personId === old.personId && s.outcome === 'needs_recovery' && !s.recovered)),
  'RECOVERY_NOT_COMPLETED_EARLY', {mode, complaints: target.complaints})
 ctx.at(slot.job.completeAt)
 const completed = cohort(ctx, target.cohortId)
 ctx.check(completed.supportJobs.some(s => s.recovery && s.mode === mode && s.job?.id === slot.job!.id
  && s.job.status === 'completed') && target.complaints.every(old => completed.students.some(s => s.id === old.id
   && s.personId === old.personId && s.paymentBatchId === old.paymentBatchId && s.conversionId === old.conversionId
   && s.recovered && s.outcome === 'helped' && s.paidRemainingFen > 0))
  && hashValue(identity(completed.students)) === hashValue(target.students),
  'RECOVERY_ORIGINAL_COMPLAINTS_ACTUALLY_HELPED', {mode, cohortId: target.cohortId,
   recovered: completed.students.filter(s => s.recovered).map(s => s.personId)})
 ctx.at(addDays(completed.refundUntil, 1))
 const final = cohort(ctx, target.cohortId)
 ctx.check(final.closedAt !== null && final.students.every(s => s.outcome === 'helped' && s.refundedFen === 0),
  'RECOVERY_ORIGINAL_WINDOW_ACTUAL_CLOSE', {mode, closedAt: final.closedAt, feeFen: final.feeFen})
 if (mode === 'delegated_group') {
  const d = deployment(ctx, target.businessId), incidents = ctx.story().incidents.filter(i => i.deploymentIds.includes(d.id))
  ctx.check(d.externalDelegations.length === 1 && d.externalDelegations.every(e => e.revocationVerifiedAt === null)
   && incidents.every(i => !i.controlVerified && i.resolvedAt === null),
   'DELEGATED_EXTERNAL_CONTROL_REMAINS_UNVERIFIED', {deploymentId: d.id,
    externalDelegations: d.externalDelegations,
    incidents: incidents.map(i => ({id: i.id, stage: i.stage, verdict: i.verdict, signals: i.signals,
     controlVerified: i.controlVerified, resolvedAt: i.resolvedAt, currentLiabilities: i.currentLiabilities}))})
 }
 money(ctx, target.cohortId, 'RECOVERY_FINAL_MONEY_IDENTITIES')
}

export const COURSE_CRITICAL_RISK: readonly CourseCriticalDefinition[] = [
 {
  id: 'assisted-without-grant', sourceRevision: 128,
  purpose: '实际辅助支持命令缺部署授权时拒绝，原班期与整档不变',
  requiredChecks: ['ASSISTED_MISSING_GRANT_REJECTED', 'ASSISTED_MISSING_GRANT_REJECTED-complete-raw-unchanged'],
  run(ctx: CourseCriticalContext) {
   ctx.reject('PlanCourseCohort', {...ctx.originalPayload('PlanCourseCohort'),
    supportMode: 'assisted_group', deploymentId: null}, 'AGENT_DEPLOYMENT_REQUIRED', 'ASSISTED_MISSING_GRANT_REJECTED')
  },
 },
 {
  id: 'delegated-without-expansion', sourceRevision: 128,
  purpose: '原approval授权不等于已授对外委托，实际更便宜委托支持拒绝',
  requiredChecks: ['DELEGATED_WITHOUT_EXPANSION_REJECTED', 'DELEGATED_WITHOUT_EXPANSION_REJECTED-complete-raw-unchanged'],
  run(ctx: CourseCriticalContext) {
   const co = latestCohort(ctx), d = deployment(ctx, course(ctx, co.courseId).businessId)
   ctx.check(d.currentGrant?.level === 'approval' && !d.currentGrant.externalDelegation,
    'DELEGATED_ORIGINAL_APPROVAL_ONLY', {grant: d.currentGrant})
   ctx.reject('PlanCourseCohort', {...ctx.originalPayload('PlanCourseCohort'), supportMode: 'delegated_group',
    deploymentId: d.id}, 'AGENT_EXPANSION_NOT_AUTHORIZED', 'DELEGATED_WITHOUT_EXPANSION_REJECTED')
  },
 },
 {
  id: 'stop-grant-old', sourceRevision: 133,
  purpose: '真实停止本方权限取消原待支持，已交付、旧学员、费用与退款责任保留',
  requiredChecks: ['STOP_OLD_AUTHORITY_AND_ORIGINAL_SUPPORT_STOPPED', 'STOP_OLD_STUDENTS_AND_DELIVERIES_RETAINED',
   'STOP_OLD_NEW_ASSISTED_REJECTED', 'STOP_OLD_DEFAULT_REFUND_AND_COSTS_RETAINED', 'STOP_OLD_FINAL_MONEY_IDENTITIES'],
  run(ctx: CourseCriticalContext) {
   const co = latestCohort(ctx), c = course(ctx, co.courseId), d = deployment(ctx, c.businessId)
   const originalSupport = co.supportJobs.find(s => !s.recovery)
   ctx.check(co.stages.every(s => s.deliveredAt !== null && s.amountFen > 0)
    && originalSupport?.job?.status === 'planned' && d.externalDelegations.length === 0,
    'STOP_OLD_ACTUAL_TWO_DELIVERIES_AND_PENDING_APPROVAL_SUPPORT', {cohortId: co.id, originalSupport})
   ctx.h.send('StopHengxingAuthority', {deploymentId: d.id})
   const stopped = deployment(ctx, c.businessId), after = cohort(ctx, co.id)
   // The owned stop receipt is current evidence, not an agency profile or a future strategy input.
   const report = ctx.h.run.story?.reports.find(r => r.deploymentId === d.id
    && r.sourceEventId === ctx.h.run.receipts.at(-1)?.commandId)
   ctx.check(stopped.lifecycle === 'stopped' && stopped.stoppedAt === ctx.now() && stopped.currentGrant === null
    && after.supportJobs.find(s => s.job?.id === originalSupport.job!.id)?.job?.status === 'cancelled'
    && report?.independent === false && stopped.billedServiceFen > 0,
    'STOP_OLD_AUTHORITY_AND_ORIGINAL_SUPPORT_STOPPED', {deployment: stopped, report})
   ctx.check(hashValue(identity(after.students)) === hashValue(identity(co.students))
    && hashValue(after.stages) === hashValue(co.stages) && after.refundUntil === co.refundUntil
    && after.remedyDueAt === co.remedyDueAt && after.closedAt === null,
    'STOP_OLD_STUDENTS_AND_DELIVERIES_RETAINED', {cohortId: co.id, refundUntil: after.refundUntil})
   ctx.reject('StartCourseRecovery', {cohortId: co.id, supportMode: 'assisted_group', deploymentId: d.id,
    resources, startAt: ctx.now()}, 'AGENT_NOT_READY_FOR_BUSINESS', 'STOP_OLD_NEW_ASSISTED_REJECTED')
   ctx.at(addDays(co.refundUntil, 1))
   const final = cohort(ctx, co.id), finalDeployment = deployment(ctx, c.businessId)
   ctx.check(final.closedAt !== null && final.students.length === co.students.length
    && final.students.every(s => s.outcome === 'refunded' && s.paidRemainingFen === 0)
    && finalDeployment.setupCostFen === d.setupCostFen && finalDeployment.billedServiceFen === stopped.billedServiceFen
    && finalDeployment.externalDelegations.length === 0 && report.independent === false,
    'STOP_OLD_DEFAULT_REFUND_AND_COSTS_RETAINED', {cohortId: co.id, feeFen: final.feeFen,
     setupCostFen: finalDeployment.setupCostFen, serviceFeeFen: finalDeployment.billedServiceFen,
     externalRevocation: 'not_applicable_no_external_scope_was_granted'})
   money(ctx, co.id, 'STOP_OLD_FINAL_MONEY_IDENTITIES')
  },
 },
 {
  id: 'accelerated-promise', sourceRevision: 126,
  purpose: '加速承诺以原公开受众真实招生/教学/支持，观察实际反馈并保留原退款边界',
  requiredChecks: ['ACCELERATED_PUBLIC_REACH_NOT_REDUCED', 'ACCELERATED_PROMISE_ACTUAL_FEEDBACK', 'ACCELERATED_FINAL_MONEY_IDENTITIES'],
  run(ctx: CourseCriticalContext) {
   const {c, audience, people} = freshVideoAudience(ctx), d = deployment(ctx, c.businessId)
   ctx.h.send('PlanCourseCohort', {courseId: c.id, audienceId: audience.id, startAt: '2024-10-09',
    endAt: '2024-10-30', supportStartAt: '2024-11-01', seatLimit: 20, supportMode: 'assisted_group',
    deploymentId: d.id, resources, promise: 'accelerated_results'})
   const co = latestCohort(ctx)
   ctx.check(co.promise === 'accelerated_results' && audience.eligibleMembers.every(id => co.availablePeople.includes(id)),
    'ACCELERATED_PUBLIC_REACH_NOT_REDUCED', {clearScopeEligible: audience.eligibleMembers.length,
     acceleratedEligible: co.availablePeople.length,
     additionalPeople: co.availablePeople.filter(id => !audience.eligibleMembers.includes(id))})
   ctx.h.send('EnrollCourseAudience', {cohortId: co.id, personIds: people})
   teachVideo(ctx, co.id)
   ctx.at(co.supportCompleteAt)
   const feedback = cohort(ctx, co.id)
   ctx.check(feedback.assessmentAt === co.supportCompleteAt && feedback.students.length === people.length
    && feedback.students.every(s => ['helped', 'needs_recovery'].includes(s.outcome)),
    'ACCELERATED_PROMISE_ACTUAL_FEEDBACK', {cohortId: co.id, promise: feedback.promise,
     students: feedback.students.map(s => ({personId: s.personId, outcome: s.outcome}))})
   const complaints = feedback.students.filter(s => s.paidRemainingFen > 0 && s.outcome === 'needs_recovery')
   if (complaints.length) ctx.h.send('RefundCourseLearners', {cohortId: co.id,
    personIds: complaints.map(s => s.personId), reason: '按实际加速承诺学习反馈退还原剩余学费，保留本产品原购买身份与已付成本'})
   ctx.at(addDays(feedback.refundUntil, 1))
   ctx.check(cohort(ctx, co.id).closedAt !== null, 'ACCELERATED_ORIGINAL_WINDOW_CLOSED', {cohortId: co.id})
   money(ctx, co.id, 'ACCELERATED_FINAL_MONEY_IDENTITIES')
  },
 },
 {
  id: 'recovery-self', sourceRevision: 134,
  purpose: '实际投诉出现后自答疑14日超过原7日整改窗口，独立精确拒绝而非伪造正向',
  requiredChecks: ['SELF_RECOVERY_ORIGINAL_COMPLAINTS_AND_REAL_DEADLINE', 'SELF_RECOVERY_DEADLINE_REJECTED',
   'SELF_RECOVERY_DEADLINE_REJECTED-complete-raw-unchanged'],
  run(ctx: CourseCriticalContext) {
   const co = latestCohort(ctx), complaints = co.students.filter(s => s.paidRemainingFen > 0 && s.outcome === 'needs_recovery')
   ctx.check(complaints.length > 0 && addDays(ctx.now(), 14) > co.remedyDueAt,
    'SELF_RECOVERY_ORIGINAL_COMPLAINTS_AND_REAL_DEADLINE', {cohortId: co.id,
     complaints: identity(complaints), startAt: ctx.now(), actualCompleteAt: addDays(ctx.now(), 14), remedyDueAt: co.remedyDueAt})
   ctx.reject('StartCourseRecovery', {cohortId: co.id, supportMode: 'self_small', deploymentId: null,
    resources, startAt: ctx.now()}, 'COURSE_RECOVERY_DEADLINE_MISSED', 'SELF_RECOVERY_DEADLINE_REJECTED')
  },
 },
 ...(['guided_group', 'assisted_group', 'delegated_group'] as const).map((mode): CourseCriticalDefinition => ({
  id: mode === 'guided_group' ? 'recovery-guided' : mode === 'assisted_group' ? 'recovery-assisted' : 'recovery-delegated',
  sourceRevision: 126, purpose: `原公开投诉出现后实际${mode}补支持，原费用/天数/授权及学员身份不改`,
  requiredChecks: ['DELAYED_ORIGINAL_COMPLAINTS_REAL', 'DELAYED_REAL_FOUR_POINT_BUDGET',
   'RECOVERY_MODE_REAL_PAID_TERMS', 'RECOVERY_NOT_COMPLETED_EARLY', 'RECOVERY_ORIGINAL_COMPLAINTS_ACTUALLY_HELPED',
   'RECOVERY_ORIGINAL_WINDOW_ACTUAL_CLOSE', 'RECOVERY_FINAL_MONEY_IDENTITIES',
   ...(mode === 'delegated_group' ? ['DELEGATED_REAL_ASSISTED_RESULT_BEFORE_EXPANSION',
    'DELEGATED_SEPARATE_EXPLICIT_EXPANSION_NO_FREE_MONEY_OR_AP', 'DELEGATED_EXTERNAL_CONTROL_REMAINS_UNVERIFIED'] : []),
   ...(mode !== 'guided_group' ? ['RECOVERY_ORIGINAL_AUTHORIZED_SUPPORT_USE'] : [])],
  run(ctx: CourseCriticalContext) { recovery(ctx, mode) },
 })),
 {
  id: 'default-remedy', sourceRevision: 134,
  purpose: '真实原投诉未补救时按原期限自动退原款，正常学员/成本/购买身份保留',
  requiredChecks: ['DEFAULT_REAL_ORIGINAL_COMPLAINTS', 'DEFAULT_REAL_REMEDY_STATE',
   'DEFAULT_ONLY_ORIGINAL_COMPLAINTS_REFUNDED', 'DEFAULT_NO_MANUAL_REMEDY_OR_REFUND', 'DEFAULT_FINAL_MONEY_IDENTITIES'],
  run(ctx: CourseCriticalContext) {
   const co = latestCohort(ctx), complaints = co.students.filter(s => s.paidRemainingFen > 0 && s.outcome === 'needs_recovery')
   const satisfied = co.students.filter(s => s.paidRemainingFen > 0 && s.outcome === 'helped')
   const startCommands = ctx.h.commands.length
   ctx.check(complaints.length > 0 && satisfied.length > 0 && co.supportSatisfied,
    'DEFAULT_REAL_ORIGINAL_COMPLAINTS', {cohortId: co.id, complaints: identity(complaints), satisfied: satisfied.map(s => s.personId)})
   ctx.at(addDays(co.supportCompleteAt, 1))
   ctx.check(cohort(ctx, co.id).status === 'remedy' && cohort(ctx, co.id).enrollmentPaused,
    'DEFAULT_REAL_REMEDY_STATE', {cohortId: co.id, remedyDueAt: co.remedyDueAt})
   ctx.at(addDays(co.remedyDueAt, 1))
   const final = cohort(ctx, co.id)
   ctx.check(final.closedAt !== null && hashValue(identity(final.students)) === hashValue(identity(co.students))
    && complaints.every(old => final.students.some(s => s.id === old.id && s.outcome === 'refunded'
     && s.paidRemainingFen === 0 && s.refundedFen === old.paidRemainingFen))
    && satisfied.every(old => final.students.some(s => s.id === old.id && s.outcome === 'helped'
     && s.refundedFen === 0 && s.paidRemainingFen === old.paidRemainingFen)),
    'DEFAULT_ONLY_ORIGINAL_COMPLAINTS_REFUNDED', {cohortId: co.id, closedAt: final.closedAt,
     refundedPeople: final.students.filter(s => s.outcome === 'refunded').map(s => s.personId), feeFen: final.feeFen})
   ctx.check(!ctx.h.commands.slice(startCommands).some(c => ['StartCourseRecovery', 'RefundCourseLearners'].includes(c.kind)),
    'DEFAULT_NO_MANUAL_REMEDY_OR_REFUND')
   money(ctx, co.id, 'DEFAULT_FINAL_MONEY_IDENTITIES')
  },
 },
 {
  id: 'two-batches-enrollment', sourceRevision: 73,
  purpose: '两个真实报名批次共用原20席，原款保护累加而不提前确认收入或重复转化',
  requiredChecks: ['TWO_BATCHES_ACTUAL_ORIGINAL_PAYMENTS', 'TWO_BATCHES_REPEAT_PERSON_REJECTED', 'TWO_BATCHES_MONEY_IDENTITIES'],
  run(ctx: CourseCriticalContext) {
   const co = latestCohort(ctx), people = originalPeople(ctx, co)
   ctx.h.send('EnrollCourseAudience', {cohortId: co.id, personIds: people.slice(0, 10)})
   money(ctx, co.id, 'FIRST_BATCH_ORIGINAL_MONEY_IDENTITIES')
   ctx.h.send('EnrollCourseAudience', {cohortId: co.id, personIds: people.slice(10)})
   const proof = money(ctx, co.id, 'TWO_BATCHES_MONEY_IDENTITIES')
   ctx.check(proof.payments.length === 2 && proof.payments.every(p => p.personIds.length === 10)
    && proof.payments.reduce((n, p) => n + p.amountFen, 0) === co.priceFen * 20
    && proof.contract?.prepaidFen === co.priceFen * 20 && proof.contract.recognizedIncomeFen === 0
    && proof.students.length === 20 && new Set(proof.students.map(s => s.conversionId)).size === 20,
    'TWO_BATCHES_ACTUAL_ORIGINAL_PAYMENTS', {cohortId: co.id, payments: proof.payments,
     prepaidFen: proof.contract?.prepaidFen, recognizedIncomeFen: proof.contract?.recognizedIncomeFen})
   ctx.reject('EnrollCourseAudience', {cohortId: co.id, personIds: people.slice(0, 1)},
    'AUDIENCE_ALREADY_CONVERTED', 'TWO_BATCHES_REPEAT_PERSON_REJECTED')
  },
 },
 {
  id: 'pause-resume', sourceRevision: 73,
  purpose: '暂停只阻新招生、保留原学员与教学；明确恢复不自动收费，另次报名才收原款',
  requiredChecks: ['PAUSE_ORIGINAL_STUDENTS_AND_SUPPORT_RETAINED', 'PAUSE_NEW_ENROLLMENT_REJECTED',
   'PAUSE_OLD_TEACHING_STILL_ALLOWED', 'RESUME_DOES_NOT_IMPLICITLY_ENROLL', 'RESUME_SEPARATE_ACTUAL_SECOND_BATCH',
   'PAUSE_RESUME_FINAL_MONEY_IDENTITIES'],
  run(ctx: CourseCriticalContext) {
   const co = latestCohort(ctx), people = originalPeople(ctx, co)
   ctx.h.send('EnrollCourseAudience', {cohortId: co.id, personIds: people.slice(0, 10)})
   const paid = cohort(ctx, co.id), economy = hashValue(ctx.h.run.economy)
   ctx.h.send('PauseNewEnrollment', {courseId: co.courseId})
   const paused = cohort(ctx, co.id)
   ctx.check(course(ctx, co.courseId).paused && hashValue(identity(paused.students)) === hashValue(identity(paid.students))
    && hashValue(paused.supportJobs) === hashValue(paid.supportJobs) && hashValue(ctx.h.run.economy) === economy,
    'PAUSE_ORIGINAL_STUDENTS_AND_SUPPORT_RETAINED', {cohortId: co.id, studentCount: paused.students.length})
   ctx.reject('EnrollCourseAudience', {cohortId: co.id, personIds: people.slice(10)},
    'COURSE_NEW_ENROLLMENT_PAUSED', 'PAUSE_NEW_ENROLLMENT_REJECTED')
   ctx.h.send('StartCourseStage', {cohortId: co.id, index: 0, resources, startAt: co.startAt})
   ctx.check(course(ctx, co.courseId).paused && cohort(ctx, co.id).stageJobs[0]?.some(j => j?.status === 'planned'),
    'PAUSE_OLD_TEACHING_STILL_ALLOWED', {cohortId: co.id, stage: cohort(ctx, co.id).stages[0]})
   const beforeResume = money(ctx, co.id, 'PAUSE_OLD_TEACHING_MONEY_IDENTITIES')
   const beforeResumeEconomy = hashValue(ctx.h.run.economy)
   ctx.h.send('ResumeCourseEnrollment', {courseId: co.courseId})
   ctx.check(!course(ctx, co.courseId).paused && cohort(ctx, co.id).students.length === 10
    && hashValue(ctx.h.run.economy) === beforeResumeEconomy,
    'RESUME_DOES_NOT_IMPLICITLY_ENROLL', {cohortId: co.id, originalPayments: beforeResume.payments.length})
   ctx.h.send('EnrollCourseAudience', {cohortId: co.id, personIds: people.slice(10)})
   const final = money(ctx, co.id, 'PAUSE_RESUME_FINAL_MONEY_IDENTITIES')
   ctx.check(final.students.length === 20 && final.payments.length === 2
    && final.contract?.prepaidFen === co.priceFen * 20 && final.contract.recognizedIncomeFen === 0,
    'RESUME_SEPARATE_ACTUAL_SECOND_BATCH', {cohortId: co.id, students: final.students.length,
     paymentBatches: final.payments.length, prepaidFen: final.contract?.prepaidFen})
  },
 },
]
