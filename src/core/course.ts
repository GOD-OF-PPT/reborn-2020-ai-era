import { addDays } from './calendar.ts';
import { applyEconomy, actionBudget, type EconomyOperation } from './economy.ts';
import { accountFunds } from './ledger.ts';
import { cumulativeFee, sumMoney, money } from './money.ts';
import { requireRule } from './errors.ts';
import { hashValue } from './hash.ts';
import { queueEvent, type ScheduledEvent } from './timeline.ts';
import { COURSE_CONTENT } from '../content/course.ts';
import { courseParametersSchema, type CourseParameters, type CourseState, type Course, type CourseCohort, type CourseEnrollment, type CourseEvent, type CourseContext } from './course-schema.ts';
import type { OperationsRuntime } from './operations.ts';
import type { VideoRuntime } from './video.ts';
import type { OperatingContext, OperatingModel } from './operations-types.ts';
import type { RuleModel, GameRun } from './run-types.ts';
import type { RunOperation } from './content-types.ts';
import { assertCourse } from './course-validation.ts';
export const courseId = (...parts: string[]) => `crs:${hashValue(parts).slice(0, 32)}`;
export type CourseIntent = {
    readonly kind: string;
    readonly [key: string]: unknown;
};
const str = (v: unknown) => { requireRule(typeof v === 'string', 'INVALID_COURSE_PAYLOAD'); return v; };
const num = (v: unknown) => { requireRule(typeof v === 'number' && Number.isSafeInteger(v), 'INVALID_COURSE_PAYLOAD'); return v; };
const ids = (v: unknown) => { requireRule(Array.isArray(v) && v.every(x => typeof x === 'string'), 'INVALID_COURSE_PAYLOAD'); return v as string[]; };
const sOf = (m: {
    readonly course?: CourseState | null;
}) => { requireRule(m.course, 'COURSE_NOT_CONFIGURED'); return m.course; };
export const enrollmentRefund = (e: Pick<CourseEnrollment, 'refundedUnearned' | 'refundedDelivered'>) => sumMoney([e.refundedUnearned, ...e.refundedDelivered]);
export const enrollmentPaid = (e: Pick<CourseEnrollment, 'priceFen' | 'refundedUnearned' | 'refundedDelivered'>) => e.priceFen - enrollmentRefund(e);
export const firstHalf = (price: number) => Number((BigInt(price) + 1n) / 2n);
const preview = () => ({ allowed: true, reasonCodes: [] as readonly string[], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 });
export class CourseRuntime {
    readonly operations: OperationsRuntime;
    readonly video: VideoRuntime;
    readonly catalog: Omit<typeof COURSE_CONTENT, keyof CourseParameters> & CourseParameters;
    readonly hash: string;
    readonly capabilities: (m: OperatingContext, id: string, date: string) => readonly string[];
    constructor(operations: OperationsRuntime, video: VideoRuntime, capabilities: (m: OperatingContext, id: string, date: string) => readonly string[], parameters: unknown = { matchBps: COURSE_CONTENT.matchBps, helpedBps: COURSE_CONTENT.helpedBps, feeBps: COURSE_CONTENT.feeBps }) { const parsed = courseParametersSchema.safeParse(parameters); requireRule(parsed.success, 'INVALID_COURSE_PARAMETERS'); this.operations = operations; this.video = video; this.capabilities = capabilities; this.catalog = { ...COURSE_CONTENT, ...parsed.data }; this.hash = hashValue(this.catalog); }
    initial(): CourseState { return { version: this.catalog.version, catalogHash: this.hash, outlines: [], licenses: [], studies: [], courses: [], audiences: [], cohorts: [], enrollments: [], payments: [], refunds: [], updates: [] }; }
    validate(run: GameRun) { assertCourse(this, run); }
    course(m: CourseContext, id: string) { const c = sOf(m).courses.find(c => c.id === id); requireRule(c, 'COURSE_NOT_FOUND'); this.business(m, c.businessId); return c; }
    cohort(m: CourseContext, id: string) { const c = sOf(m).cohorts.find(c => c.id === id); requireRule(c, 'COURSE_COHORT_NOT_FOUND'); this.course(m, c.courseId); return c; }
    business(m: OperatingContext, id: string) { const b = this.operations.business(m, id); requireRule(b.route === 'ai_course', 'COURSE_BUSINESS_REQUIRED'); return b; }
    product(c: Course) { return this.catalog.products.find(p => p.id === c.productId)!; }
    topic(c: Course) { return this.catalog.topics.find(t => t.id === c.topicId)!; }
    productKey(topic: string, edition: string) { return `course:${topic}:${edition}`; }
    #patch<T extends OperatingModel>(m: T, fields: Partial<CourseState>): T { return { ...m, course: { ...sOf(m), ...fields } }; }
    #log<T extends OperatingModel>(m: T, id: string, date: string, source: string, text: string): T { requireRule(m.operations, 'OPERATIONS_REQUIRED'); return { ...m, operations: { ...m.operations, logs: [...m.operations.logs, { id, date, sourceEventId: source, text, parentIds: [], visibility: 'visible' }] } }; }
    #post<T extends OperatingModel>(m: T, op: EconomyOperation): T { return this.#log({ ...m, economy: applyEconomy(m.economy, op) }, op.id, op.date, op.sourceEventId, `课程账目：${op.kind}`); }
    #event(type: CourseEvent['type'], entityId: string, date: string, index = 0): ScheduledEvent<RunOperation> { return { instanceId: courseId(type, entityId, String(index)), date, phase: 'player_actions', priority: type === 'fee_close' ? 400 : 250, payload: { kind: 'course_event', type, entityId, date, index } }; }
    #queue(m: RuleModel, e: ScheduledEvent<RunOperation>): RuleModel { return { ...m, timeline: queueEvent(m.timeline, e) }; }
    #done(m: CourseContext, id: string) { return m.operations?.jobs.some(j => j.id === id && j.status === 'completed') ?? false; }
    #jobPreview(m: CourseContext, i: CourseIntent, businessId: string, definitionId: string, date: string) { return this.operations.inspectRouteJob(m, businessId, definitionId, ids(i.resources), str(i.startAt), date); }
    #plan(m: RuleModel, i: CourseIntent, businessId: string, definitionId: string, id: string) { return this.operations.planRouteJob(m, businessId, definitionId, ids(i.resources), str(i.startAt), id); }
    anchors(m: CourseContext) { return (m.world?.anchors ?? []).filter(a => this.catalog.updateAnchorIds.some(id => id === a.id)).map(a => a.id); }
    unresolved(m: CourseContext, id: string) { return sOf(m).updates.filter(u => u.courseId === id && u.resolvedAt === null); }
    #active(m: CourseContext, c: Course) { requireRule(this.business(m, c.businessId).lifecycle === 'operating' && !m.world?.stoppedBindings.includes(c.businessId) && !c.paused && c.status === 'ready', 'COURSE_NEW_ENROLLMENT_PAUSED'); requireRule(this.unresolved(m, c.id).length === 0, 'COURSE_UPDATE_REQUIRED'); }
    caseInfo(m: CourseContext, ref: {
        kind: string;
        id: string;
    }) {
        if (ref.kind === 'first_order') {
            const c = m.operations?.contracts.find(c => c.id === ref.id);
            requireRule(c?.status === 'settled' && c.caseKey !== null && c.settledAt !== null, 'COURSE_PAID_CASE_REQUIRED');
            return { licensed: false, paidAt: c.settledAt };
        }
        const c = m.video?.contracts.find(c => c.id === ref.id);
        requireRule(c?.status === 'settled' && c.feePosted && c.settledAt !== null && !m.economy.ledger.obligations.some(o => o.sourceEventId === c.id && o.remainingFen > 0), 'COURSE_PAID_CASE_REQUIRED');
        const w = m.video!.works.find(w => w.id === c.workId);
        requireRule(w, 'COURSE_CASE_WORK_MISSING');
        return { licensed: w.materialId === 'licensed', paidAt: c.settledAt };
    }
    #caseRights(m: CourseContext, c: Course) {
        for (const ref of c.cases)
            if (this.caseInfo(m, ref).licensed)
                requireRule(sOf(m).licenses.some(l => l.businessId === c.businessId && l.caseId === ref.id && this.#done(m, l.jobId)), 'COURSE_MATERIAL_RIGHTS_REQUIRED');
    }
    originVideoCohorts(m: CourseContext, audienceId: string, personId: string) { const a = sOf(m).audiences.find(a => a.id === audienceId)!; return a.sourceCohortIds.filter(id => m.video?.cohorts.some(co => co.id === id && co.members.includes(personId))).slice(0, 1); }
    people(m: CourseContext, cohortId: string) { return sOf(m).enrollments.filter(e => e.cohortId === cohortId); }
    graduates(m: CourseContext, course: Course) { return sOf(m).enrollments.filter(e => e.productKey === course.productKey && enrollmentRefund(e) === 0 && e.outcome === 'helped' && sOf(m).cohorts.some(c => c.id === e.cohortId && c.closedAt !== null && c.stages.every(st => st.deliveredAt !== null))).map(e => e.personId); }
    #capacity(m: CourseContext, c: CourseCohort, completed = false, recoveryOnly = false) { return c.slots.filter(slot => (!recoveryOnly || slot.recovery) && m.operations?.jobs.some(j => j.id === slot.jobId && (completed ? j.status === 'completed' : ['planned', 'running', 'completed'].includes(j.status)))).reduce((total, s) => total + s.capacity, 0); }
    score(m: CourseContext, personId: string, key: string, purpose: string) { requireRule(m.video, 'COURSE_AUDIENCE_REQUIRED'); return parseInt(hashValue([m.video.audienceKey, personId, key, purpose]).slice(0, 8), 16); }
    eligible(m: CourseContext, c: Course, people: readonly string[], price: number, promise = 'clear_scope') { const base = this.product(c).basePriceFen; const bps = Math.min(10000, Number(BigInt(this.catalog.matchBps) * BigInt(base) / BigInt(price)) + (promise === 'accelerated_results' ? 1500 : 0)); const advanced = c.edition === 'advanced' ? sOf(m).studies.find(s => s.id === c.studyId)?.members ?? [] : null; return people.filter(p => (advanced === null || advanced.includes(p)) && BigInt(this.score(m, p, c.productKey, 'demand')) * 10000n < BigInt(bps) * 4294967296n); }
    qualificationForJob(m: OperatingContext, definitionId: string, from: string, to: string) {
        if (!definitionId.startsWith('course-sample-') && !definitionId.startsWith('course-stage-') && !definitionId.startsWith('course-refresh-'))
            return;
        const topic = this.catalog.topics.find(t => definitionId.endsWith(t.id));
        requireRule(topic, 'COURSE_TOPIC_REQUIRED');
        for (let day = from; day < to; day = addDays(day, 1))
            requireRule(this.capabilities(m, topic.capability, day).length === 0, 'COURSE_TOOL_QUALIFICATION_REQUIRED');
    }
    jobConstraint(m: OperatingContext, definitionId: string, from: string, to: string) {
        this.qualificationForJob(m, definitionId, from, to);
        if (definitionId.startsWith('course-stage-') && m.course) {
            const cohorts = m.course.cohorts.filter(c => c.stages.some(s => s.attempts.some(a => m.operations?.jobs.some(j => j.id === a.jobId && j.definitionId === definitionId && j.startAt === from && j.completeAt === to))));
            for (const co of cohorts)
                requireRule(!m.course.updates.some(u => u.courseId === co.courseId && u.resolvedAt === null), 'COURSE_UPDATE_REQUIRED');
        }
    }
    closeConstraint(m: OperatingContext, businessId: string) {
        if (!m.course)
            return;
        const courseIds = m.course.courses.filter(c => c.businessId === businessId).map(c => c.id);
        requireRule(!m.course.cohorts.some(c => courseIds.includes(c.courseId) && c.closedAt === null), 'COURSE_UNSETTLED_OBLIGATIONS');
    }
    inspect(m: CourseContext & {
        readonly phase?: RuleModel['phase'];
    }, i: CourseIntent, date: string) {
        const s = sOf(m);
        requireRule(m.phase === undefined || m.phase === 'playing' || ['PauseNewEnrollment', 'StopCourseSales', 'RefundCourseLearners', 'RetireCourse'].includes(i.kind), 'RUN_NOT_PLAYING');
        switch (i.kind) {
            case 'OpenCourseStudio':
                requireRule(date >= this.catalog.availableAt && this.capabilities(m, 'chatgpt_announcement', date).length === 0, 'COURSE_NOT_AVAILABLE');
                requireRule(!m.operations?.businesses.some(b => b.definitionId === 'course-studio' && b.lifecycle !== 'closed'), 'COURSE_STUDIO_EXISTS');
                requireRule(accountFunds(m.economy.ledger, 'personal').availableFen >= num(i.capitalFen), 'INSUFFICIENT_AVAILABLE_FUNDS');
                break;
            case 'StartCourseOutline': {
                const b = this.business(m, str(i.businessId));
                requireRule(date >= this.catalog.availableAt, 'COURSE_NOT_AVAILABLE');
                return this.#jobPreview(m, i, b.id, 'course-outline', date);
            }
            case 'LicenseCourseMaterials': {
                const b = this.business(m, str(i.businessId));
                requireRule(this.caseInfo(m, { kind: str(i.caseKind), id: str(i.caseId) }).licensed, 'COURSE_LICENSE_NOT_NEEDED');
                return this.#jobPreview(m, i, b.id, 'course-material-license', date);
            }
            case 'StudyAdvancedCourseDemand': {
                const c = this.course(m, str(i.courseId));
                requireRule(c.edition === 'foundation' && this.graduates(m, c).length > 0, 'COURSE_GRADUATES_REQUIRED');
                return this.#jobPreview(m, i, c.businessId, 'course-demand-study', date);
            }
            case 'DefineCourse': {
                const b = this.business(m, str(i.businessId));
                requireRule(b.lifecycle === 'operating' && date >= this.catalog.availableAt, 'COURSE_NOT_AVAILABLE');
                requireRule(m.world?.preparations.some(p => p.key === 'teaching_outline' && p.bindingId === 'player'), 'COURSE_OUTLINE_REQUIRED');
                const refs = i.cases as {
                    kind: string;
                    id: string;
                }[];
                requireRule(refs.length > 0 && new Set(refs.map(r => r.id)).size === refs.length, 'COURSE_PAID_CASE_REQUIRED');
                refs.forEach(r => this.caseInfo(m, r));
                if (i.productId === 'enterprise_training')
                    requireRule(refs.length >= 2, 'COURSE_DEEP_CASES_REQUIRED');
                requireRule(s.courses.length < 96, 'COURSE_LIBRARY_LIMIT');
                if (i.edition === 'advanced') {
                    const old = this.course(m, str(i.predecessorId)), study = s.studies.find(x => x.id === i.studyId);
                    requireRule(old.edition === 'foundation' && old.topicId === i.topicId && study?.predecessorId === old.id && study.completedAt !== null && study.members.length > 0, 'COURSE_NEW_DEMAND_REQUIRED');
                }
                break;
            }
            case 'BuildCourseSample': {
                const c = this.course(m, str(i.courseId));
                requireRule(c.status === 'draft' || c.status === 'building' && c.sampleJobId !== null && m.operations?.jobs.some(j => j.id === c.sampleJobId && ['interrupted', 'cancelled'].includes(j.status)), 'COURSE_SAMPLE_ALREADY_PLANNED');
                this.#caseRights(m, c);
                return this.#jobPreview(m, i, c.businessId, `course-sample-${c.productId}-${c.topicId}`, date);
            }
            case 'StartCourseRefresh': {
                const c = this.course(m, str(i.courseId));
                requireRule((c.status === 'ready' || c.status === 'retired' && c.versions.length > 0) && !c.refreshJobs.some(r => !r.applied && m.operations?.jobs.some(j => j.id === r.jobId && ['planned', 'running'].includes(j.status))), 'COURSE_REFRESH_UNAVAILABLE');
                this.#caseRights(m, c);
                return this.#jobPreview(m, i, c.businessId, `course-refresh-${c.productId}-${c.topicId}`, date);
            }
            case 'CreateCourseAudience': {
                const c = this.course(m, str(i.courseId)), p = this.product(c);
                this.#active(m, c);
                requireRule(num(i.priceFen) >= p.minPriceFen && num(i.priceFen) <= p.maxPriceFen, 'COURSE_PRICE_OUT_OF_RANGE');
                if (i.mode === 'paid')
                    return this.#jobPreview(m, i, c.businessId, 'course-marketing', date);
                const refs = ids(i.videoCohortIds);
                requireRule(refs.length > 0 && refs.every(id => m.video?.cohorts.some(co => co.id === id && co.segment === c.segment && co.date <= date)), 'COURSE_VIDEO_AUDIENCE_REQUIRED');
                break;
            }
            case 'PlanCourseCohort': {
                const c = this.course(m, str(i.courseId));
                this.#active(m, c);
                const a = s.audiences.find(a => a.id === i.audienceId && a.courseId === c.id && a.completedAt !== null);
                requireRule(a && a.eligibleMembers.length > 0, 'COURSE_AUDIENCE_NOT_READY');
                const start = str(i.startAt), end = str(i.endAt), support = str(i.supportStartAt);
                requireRule(start > date && end >= addDays(start, Math.max(21, this.product(c).stageDays * 2)) && end <= addDays(start, 90) && support >= end && support <= addDays(end, 90), 'COURSE_INVALID_SCHEDULE');
                const res = ids(i.resources);
                requireRule(res.length >= 1 && res.length <= 3 && new Set(res).size === res.length, 'COURSE_INVALID_SUPPORT_PLAN');
                const p = this.product(c), cap = i.supportMode === 'self_small' ? p.selfCapacity : p.capacity;
                requireRule(num(i.seatLimit) <= res.length * cap, 'COURSE_SUPPORT_CAPACITY_EXCEEDED');
                const supportDef = this.operations.catalog.jobs.find(j => j.id === `course-support-${c.productId}-${str(i.supportMode)}`)!;
                requireRule(actionBudget(m.economy, support).available >= supportDef.actionPoints * res.length, 'INSUFFICIENT_ACTION_POINTS');
                requireRule(accountFunds(m.economy.ledger, this.business(m, c.businessId).accountId).availableFen >= supportDef.costFen * res.length, 'INSUFFICIENT_AVAILABLE_FUNDS');
                const check = m;
                for (const resource of res) {
                    const result = this.operations.inspectRouteJob(check, c.businessId, `course-support-${c.productId}-${str(i.supportMode)}`, [resource], support, date);
                    requireRule(result.allowed, 'COURSE_SUPPORT_UNAVAILABLE');
                }
                return { ...preview(), actionPoints: supportDef.actionPoints * res.length, upfrontCostFen: supportDef.costFen * res.length, actionDate: support };
            }
            case 'EnrollCourseAudience': {
                const co = this.cohort(m, str(i.cohortId)), c = this.course(m, co.courseId);
                this.#active(m, c);
                requireRule(co.status === 'open' && !co.enrollmentPaused && date < co.startAt, 'COURSE_ENROLLMENT_CLOSED');
                const a = s.audiences.find(a => a.id === co.audienceId)!;
                const people = ids(i.personIds), eligiblePeople = new Set(this.eligible(m, c, a.members, co.priceFen, co.promise));
                requireRule(people.length > 0 && new Set(people).size === people.length && people.every(id => eligiblePeople.has(id)), 'COURSE_LEARNER_NOT_ELIGIBLE');
                requireRule(!people.some(id => m.video?.conversions.some(x => x.personId === id && x.productVersion === c.productKey)), 'AUDIENCE_ALREADY_CONVERTED');
                const active = this.people(m, co.id).filter(e => enrollmentPaid(e) > 0).length;
                requireRule(active + people.length <= co.seatLimit && active + people.length <= this.#capacity(m, co), 'COURSE_SUPPORT_CAPACITY_EXCEEDED');
                requireRule(!m.economy.ledger.obligations.some(o => o.accountId === this.business(m, c.businessId).accountId && o.remainingFen > 0 && o.date <= date), 'OVERDUE_OBLIGATION');
                const amountFen = money(Number(BigInt(co.priceFen) * BigInt(people.length)));
                return { ...preview(), receivedPrepaymentFen: amountFen, protectedIncreaseFen: amountFen };
            }
            case 'StartCourseStage': {
                const co = this.cohort(m, str(i.cohortId)), c = this.course(m, co.courseId), index = num(i.index);
                requireRule(!co.teachingCancelled && co.closedAt === null && index >= 0 && index < 2, 'COURSE_STAGE_UNAVAILABLE');
                const stage = co.stages[index]!;
                requireRule(stage.deliveredAt === null && stage.attempts.length < 3 && !stage.attempts.some(a => m.operations?.jobs.some(j => j.id === a.jobId && ['planned', 'running'].includes(j.status))), 'COURSE_STAGE_ALREADY_PLANNED');
                requireRule(index === 0 || co.stages[0]!.deliveredAt !== null, 'COURSE_PREVIOUS_STAGE_REQUIRED');
                requireRule(str(i.startAt) >= co.startAt && addDays(str(i.startAt), this.product(c).stageDays) <= stage.dueAt, 'COURSE_STAGE_DEADLINE_MISSED');
                requireRule(this.unresolved(m, c.id).length === 0, 'COURSE_UPDATE_REQUIRED');
                return this.#jobPreview(m, i, c.businessId, `course-stage-${c.productId}-${c.topicId}`, date);
            }
            case 'StartCourseRecovery': {
                const co = this.cohort(m, str(i.cohortId)), c = this.course(m, co.courseId);
                requireRule(co.closedAt === null && co.slots.filter(s => s.recovery).length < 3, 'COURSE_RECOVERY_UNAVAILABLE');
                const def = `course-support-${c.productId}-${str(i.supportMode)}`, d = this.operations.catalog.jobs.find(j => j.id === def)!;
                requireRule(addDays(str(i.startAt), d.durationDays) <= co.remedyDueAt, 'COURSE_RECOVERY_DEADLINE_MISSED');
                return this.#jobPreview(m, i, c.businessId, def, date);
            }
            case 'RefundCourseLearners': {
                const co = this.cohort(m, str(i.cohortId));
                requireRule(co.closedAt === null && date <= co.refundUntil, 'COURSE_REFUND_WINDOW_CLOSED');
                const people = ids(i.personIds);
                requireRule(people.length > 0 && new Set(people).size === people.length && people.every(id => this.people(m, co.id).some(e => e.personId === id && enrollmentPaid(e) > 0)), 'COURSE_REFUND_NOT_DUE');
                break;
            }
            case 'PauseNewEnrollment':
            case 'ResumeCourseEnrollment':
            case 'StopCourseSales':
            case 'RetireCourse': {
                const c = this.course(m, str(i.courseId));
                if (i.kind === 'ResumeCourseEnrollment') {
                    requireRule(c.status === 'ready' && this.unresolved(m, c.id).length === 0 && this.business(m, c.businessId).lifecycle === 'operating', 'COURSE_UPDATE_REQUIRED');
                }
                else
                    requireRule(c.status !== 'retired', 'COURSE_RETIRED');
                break;
            }
            default: requireRule(false, 'UNKNOWN_COURSE_COMMAND');
        }
        return preview();
    }
    apply(m: RuleModel, i: CourseIntent, commandId: string): RuleModel {
        const date = m.timeline.cursor.date;
        this.inspect(m, i, date);
        let next = m;
        const s = sOf(m), id = courseId(commandId, i.kind);
        switch (i.kind) {
            case 'OpenCourseStudio': {
                next = this.operations.apply(next, { kind: 'DiscoverBusiness', definitionId: 'course-studio' }, `${commandId}:discover`);
                const b = next.operations!.businesses.at(-1)!;
                next = this.operations.apply(next, { kind: 'FundBusiness', businessId: b.id, amountFen: num(i.capitalFen) }, `${commandId}:fund`);
                next = this.operations.apply(next, { kind: 'PrepareBusiness', businessId: b.id }, `${commandId}:prepare`);
                break;
            }
            case 'StartCourseOutline': {
                next = this.#plan(next, i, str(i.businessId), 'course-outline', courseId('job', id));
                next = this.#patch(next, { outlines: [...s.outlines, { id, businessId: str(i.businessId), jobId: courseId('job', id) }] });
                break;
            }
            case 'LicenseCourseMaterials': {
                next = this.#plan(next, i, str(i.businessId), 'course-material-license', courseId('job', id));
                next = this.#patch(next, { licenses: [...s.licenses, { id, businessId: str(i.businessId), caseId: str(i.caseId), jobId: courseId('job', id) }] });
                break;
            }
            case 'StudyAdvancedCourseDemand': {
                const c = this.course(next, str(i.courseId));
                next = this.#plan(next, i, c.businessId, 'course-demand-study', courseId('job', id));
                next = this.#patch(next, { studies: [...s.studies, { id, businessId: c.businessId, predecessorId: c.id, jobId: courseId('job', id), members: [...new Set(this.graduates(next, c))], completedAt: null }] });
                break;
            }
            case 'DefineCourse': {
                const c: Course = { id, businessId: str(i.businessId), name: str(i.name), productId: i.productId as Course['productId'], topicId: i.topicId as Course['topicId'], edition: i.edition as Course['edition'], productKey: this.productKey(str(i.topicId), str(i.edition)), segment: i.segment as Course['segment'], createdAt: date, cases: i.cases as Course['cases'], consent: true, predecessorId: i.predecessorId as string | null, studyId: i.studyId as string | null, status: 'draft', paused: false, sampleJobId: null, sampleAttempts: [], sampleAnchorIds: [], versions: [], refreshJobs: [] };
                next = this.#patch(next, { courses: [...s.courses, c] });
                break;
            }
            case 'BuildCourseSample': {
                const c = this.course(next, str(i.courseId)), jobId = courseId('job', id);
                next = this.#plan(next, i, c.businessId, `course-sample-${c.productId}-${c.topicId}`, jobId);
                next = this.#patch(next, { courses: s.courses.map(old => old.id === c.id ? { ...old, status: 'building', sampleJobId: jobId, sampleAttempts: [...old.sampleAttempts, jobId], sampleAnchorIds: this.anchors(next) } : old) });
                break;
            }
            case 'StartCourseRefresh': {
                const c = this.course(next, str(i.courseId)), jobId = courseId('job', id);
                next = this.#plan(next, i, c.businessId, `course-refresh-${c.productId}-${c.topicId}`, jobId);
                next = this.#patch(next, { courses: s.courses.map(old => old.id === c.id ? { ...old, refreshJobs: [...old.refreshJobs, { jobId, targetAnchorIds: this.anchors(next), applied: false }] } : old) });
                break;
            }
            case 'CreateCourseAudience': {
                const c = this.course(next, str(i.courseId));
                let members: string[] = [], completedAt: string | null = null, jobId: string | null = null;
                if (i.mode === 'paid') {
                    jobId = courseId('job', id);
                    next = this.#plan(next, i, c.businessId, 'course-marketing', jobId);
                }
                else {
                    members = [...new Set(next.video!.cohorts.filter(co => ids(i.videoCohortIds).includes(co.id)).flatMap(co => co.members))];
                    completedAt = date;
                }
                next = this.#patch(next, { audiences: [...s.audiences, { id, courseId: c.id, mode: i.mode as 'paid' | 'video_referral', priceFen: num(i.priceFen), createdAt: date, jobId, sourceCohortIds: i.mode === 'video_referral' ? ids(i.videoCohortIds) : [], completedAt, members, eligibleMembers: completedAt === null ? [] : this.eligible(next, c, members, num(i.priceFen)) }] });
                break;
            }
            case 'PlanCourseCohort': {
                const c = this.course(next, str(i.courseId)), a = s.audiences.find(a => a.id === i.audienceId)!, p = this.product(c), mode = i.supportMode as 'self_small' | 'guided_group', definitionId = `course-support-${c.productId}-${mode}`, d = this.operations.catalog.jobs.find(j => j.id === definitionId)!, supportCompleteAt = addDays(str(i.supportStartAt), d.durationDays), slots: CourseCohort['slots'] = [];
                for (const [n, resource] of ids(i.resources).entries()) {
                    const jobId = courseId('support', id, String(n));
                    next = this.#plan(next, { kind: i.kind, resources: [resource], startAt: i.supportStartAt }, c.businessId, definitionId, jobId);
                    slots.push({ jobId, mode, capacity: mode === 'self_small' ? p.selfCapacity : p.capacity, recovery: false });
                }
                const co: CourseCohort = { id, courseId: c.id, audienceId: a.id, createdAt: date, startAt: str(i.startAt), endAt: str(i.endAt), seatLimit: num(i.seatLimit), priceFen: a.priceFen, promise: i.promise as CourseCohort['promise'], supportCompleteAt, remedyDueAt: addDays(supportCompleteAt, 7), refundUntil: addDays(supportCompleteAt, 7), slots, stages: [{ index: 0, dueAt: addDays(str(i.startAt), 14), attempts: [], deliveredAt: null, operationId: null, amountFen: 0 }, { index: 1, dueAt: str(i.endAt), attempts: [], deliveredAt: null, operationId: null, amountFen: 0 }], status: 'open', enrollmentPaused: false, teachingCancelled: false, supportSatisfied: false, assessmentAt: null, feePostedAt: null, feeFen: 0, closedAt: null };
                next = this.#patch(next, { cohorts: [...s.cohorts, co] });
                for (const stage of co.stages)
                    next = this.#queue(next, this.#event('stage_due', id, addDays(stage.dueAt, 1), stage.index));
                next = this.#queue(next, this.#event('support_due', id, addDays(co.supportCompleteAt, 1)));
                next = this.#queue(next, this.#event('remedy_due', id, addDays(co.remedyDueAt, 1)));
                next = this.#queue(next, this.#event('fee_close', id, addDays(co.refundUntil, 1)));
                break;
            }
            case 'EnrollCourseAudience': {
                const co = this.cohort(next, str(i.cohortId)), c = this.course(next, co.courseId), b = this.business(next, c.businessId), people = ids(i.personIds), amountFen = money(Number(BigInt(co.priceFen) * BigInt(people.length))), entries = people.map(personId => ({ id: courseId('student', id, personId), cohortId: co.id, courseId: c.id, personId, productKey: c.productKey, originAudienceId: co.audienceId, originCohortIds: this.originVideoCohorts(next, co.audienceId, personId), conversionId: courseId('conversion', id, personId), paymentBatchId: id, paidAt: date, priceFen: co.priceFen, delivered: [0, 0] as [
                        number,
                        number
                    ], refundedDelivered: [0, 0] as [
                        number,
                        number
                    ], refundedUnearned: 0, helpRoll: this.score(next, personId, c.productKey, 'learning'), outcome: 'pending' as const, recovered: false }));
                next = this.#post(next, { id: courseId('prepay', id), sourceEventId: co.id, date, kind: 'receive_prepayment', accountId: b.accountId, businessId: b.id, contractId: co.id, counterpartyId: 'world', reservationId: courseId('protection', co.id), amountFen });
                next = this.#patch(next, { enrollments: [...s.enrollments, ...entries], payments: [...s.payments, { id, cohortId: co.id, date, personIds: people, amountFen, operationId: courseId('prepay', id) }] });
                next = { ...next, video: { ...next.video!, conversions: [...next.video!.conversions, ...entries.map(e => ({ id: e.conversionId, personId: e.personId, productVersion: c.productKey, sourceId: e.id, date, outcome: 'ordered' as const }))] } };
                break;
            }
            case 'StartCourseStage': {
                const co = this.cohort(next, str(i.cohortId)), c = this.course(next, co.courseId), jobId = courseId('job', id), index = num(i.index);
                next = this.#plan(next, i, c.businessId, `course-stage-${c.productId}-${c.topicId}`, jobId);
                next = this.#patch(next, { cohorts: s.cohorts.map(old => old.id === co.id ? { ...old, status: 'teaching', stages: old.stages.map(stage => stage.index === index ? { ...stage, attempts: [...stage.attempts, { jobId, revision: c.versions.at(-1)!.revision }] } : stage) } : old) });
                break;
            }
            case 'StartCourseRecovery': {
                const co = this.cohort(next, str(i.cohortId)), c = this.course(next, co.courseId), mode = i.supportMode as 'self_small' | 'guided_group', jobId = courseId('job', id);
                next = this.#plan(next, i, c.businessId, `course-support-${c.productId}-${mode}`, jobId);
                next = this.#patch(next, { cohorts: s.cohorts.map(old => old.id === co.id ? { ...old, slots: [...old.slots, { jobId, mode, capacity: mode === 'self_small' ? this.product(c).selfCapacity : this.product(c).capacity, recovery: true }] } : old) });
                break;
            }
            case 'RefundCourseLearners':
                next = this.#refund(next, this.cohort(next, str(i.cohortId)), ids(i.personIds), 'full', str(i.reason), date, id);
                break;
            case 'PauseNewEnrollment':
            case 'StopCourseSales':
            case 'ResumeCourseEnrollment':
            case 'RetireCourse': {
                const c = this.course(next, str(i.courseId));
                next = this.#patch(next, { courses: s.courses.map(old => old.id === c.id ? { ...old, paused: i.kind !== 'ResumeCourseEnrollment', status: i.kind === 'RetireCourse' ? 'retired' : old.status } : old) });
                break;
            }
        }
        next = this.#log(next, id, date, id, `课程决策：${i.kind}`);
        next = { ...this.sync(next, date), timeline: next.timeline };
        const gap = next.economy.ledger.obligations.find(o => o.remainingFen > 0 && !m.economy.ledger.obligations.some(old => old.id === o.id && old.remainingFen > 0));
        if (gap && next.timeline.pause === null)
            next = { ...next, timeline: { ...next.timeline, pause: { instanceId: gap.originOperationId, reason: 'CASH_SHORTFALL', source: 'command' } } };
        return next;
    }
    #refund<T extends OperatingModel>(m: T, co: CourseCohort, people: readonly string[], mode: 'full' | 'undelivered', reason: string, date: string, id: string): T {
        const c = this.course(m, co.courseId), b = this.business(m, c.businessId), selected = this.people(m, co.id).filter(e => people.includes(e.personId) && enrollmentPaid(e) > 0);
        if (selected.length === 0)
            return m;
        let next = m;
        const unearned = sumMoney(selected.map(e => e.priceFen - sumMoney(e.delivered) - e.refundedUnearned)), delivered = mode === 'full' ? [0, 1].map(index => sumMoney(selected.map(e => e.delivered[index]! - e.refundedDelivered[index]!))) : [0, 0], operationIds: string[] = [];
        for (const batch of sOf(next).payments.filter(p => p.cohortId === co.id)) {
            const amount = sumMoney(selected.filter(e => e.paymentBatchId === batch.id).map(e => e.priceFen - sumMoney(e.delivered) - e.refundedUnearned));
            if (amount > 0) {
                const opId = courseId('refund-unearned', id, batch.id);
                next = this.#post(next, { id: opId, sourceEventId: co.id, date, kind: 'refund_undelivered', accountId: b.accountId, businessId: b.id, contractId: co.id, amountFen: amount, obligationId: courseId('refund-due', opId), referenceId: batch.operationId });
                operationIds.push(opId);
            }
        }
        for (const index of [0, 1])
            if (delivered[index]! > 0) {
                const stage = co.stages[index]!;
                requireRule(stage.operationId, 'COURSE_REFUND_STAGE_MISSING');
                const opId = courseId('refund-earned', id, String(index));
                next = this.#post(next, { id: opId, sourceEventId: co.id, date, kind: 'refund_delivered', settlement: 'cash', accountId: b.accountId, businessId: b.id, contractId: co.id, amountFen: delivered[index]!, obligationId: courseId('refund-due', opId), reservationId: courseId('refund-protection', opId), referenceId: stage.operationId });
                operationIds.push(opId);
            }
        const selectedIds = new Set(selected.map(e => e.id));
        next = this.#patch(next, { enrollments: sOf(next).enrollments.map(e => selectedIds.has(e.id) ? { ...e, refundedUnearned: e.priceFen - sumMoney(e.delivered), refundedDelivered: mode === 'full' ? [...e.delivered] as [
                    number,
                    number
                ] : e.refundedDelivered, outcome: mode === 'full' ? 'refunded' : 'partial' } : e), refunds: [...sOf(next).refunds, { id, cohortId: co.id, date, personIds: selected.map(e => e.personId), mode, reason, undeliveredFen: unearned, deliveredFen: sumMoney(delivered), operationIds }] });
        next = { ...next, video: { ...next.video!, conversions: next.video!.conversions.map(v => selected.some(e => e.conversionId === v.id) ? { ...v, outcome: 'returned' } : v) } };
        return next;
    }
    #coverUpdates<T extends OperatingModel>(m: T, c: Course, anchorIds: readonly string[], date: string): T { return this.#patch(m, { updates: sOf(m).updates.map(u => u.courseId === c.id && u.resolvedAt === null && anchorIds.includes(u.anchorId) ? { ...u, resolvedAt: date, resolution: 'refreshed' } : u) }); }
    sync<T extends OperatingModel>(m: T, date: string): T {
        if (!m.course)
            return m;
        let next = m;
        for (const o of sOf(next).outlines.filter(o => this.#done(next, o.jobId))) {
            requireRule(next.world, 'WORLD_REQUIRED');
            const job = next.operations!.jobs.find(j => j.id === o.jobId)!;
            if (!next.world.preparations.some(p => p.key === 'teaching_outline' && p.sourceEventId === o.jobId))
                next = { ...next, world: { ...next.world, preparations: [...next.world.preparations, { key: 'teaching_outline', bindingId: 'player', date: job.completeAt, sourceEventId: o.jobId }] } };
        }
        for (const study of sOf(next).studies.filter(s => s.completedAt === null && this.#done(next, s.jobId))) {
            const parent = this.course(next, study.predecessorId), job = next.operations!.jobs.find(j => j.id === study.jobId)!;
            next = this.#patch(next, { studies: sOf(next).studies.map(s => s.id === study.id ? { ...s, completedAt: job.completeAt, members: s.members.filter(id => BigInt(this.score(next, id, this.productKey(parent.topicId, 'advanced'), 'new-need')) * 10000n < BigInt(this.catalog.matchBps) * 4294967296n) } : s) });
        }
        for (const c of sOf(next).courses) {
            if (c.status === 'building' && c.sampleJobId !== null && this.#done(next, c.sampleJobId)) {
                const job = next.operations!.jobs.find(j => j.id === c.sampleJobId)!;
                next = this.#patch(next, { courses: sOf(next).courses.map(old => old.id === c.id ? { ...old, status: 'ready', versions: [{ revision: 1, jobId: job.id, date: job.completeAt, anchorIds: old.sampleAnchorIds }] } : old) });
                next = this.#coverUpdates(next, c, c.sampleAnchorIds, job.completeAt);
            }
            for (const refresh of c.refreshJobs.filter(r => !r.applied && this.#done(next, r.jobId))) {
                const current = this.course(next, c.id), job = next.operations!.jobs.find(j => j.id === refresh.jobId)!;
                next = this.#patch(next, { courses: sOf(next).courses.map(old => old.id === c.id ? { ...old, versions: [...old.versions, { revision: (current.versions.at(-1)?.revision ?? 0) + 1, jobId: job.id, date: job.completeAt, anchorIds: refresh.targetAnchorIds }], refreshJobs: old.refreshJobs.map(r => r.jobId === job.id ? { ...r, applied: true } : r) } : old) });
                next = this.#coverUpdates(next, c, refresh.targetAnchorIds, job.completeAt);
                next = this.#log(next, courseId('refreshed', job.id), job.completeAt, c.id, '七天课程更新已实际完成，原学生不再收费');
            }
        }
        for (const a of sOf(next).audiences.filter(a => a.completedAt === null && a.jobId !== null && this.#done(next, a.jobId))) {
            const c = this.course(next, a.courseId), job = next.operations!.jobs.find(j => j.id === a.jobId)!;
            const members = this.video.audienceMembers(next, c.segment, 0, 240);
            next = this.#patch(next, { audiences: sOf(next).audiences.map(old => old.id === a.id ? { ...old, completedAt: job.completeAt, members, eligibleMembers: this.eligible(next, c, members, a.priceFen) } : old) });
        }
        for (const oldCo of sOf(next).cohorts.filter(c => c.closedAt === null)) {
            let co = this.cohort(next, oldCo.id), c = this.course(next, co.courseId), b = this.business(next, c.businessId);
            for (const stage of co.stages.filter(st => st.deliveredAt === null)) {
                const finished = stage.attempts.find(a => this.#done(next, a.jobId));
                if (!finished || co.teachingCancelled)
                    continue;
                const job = next.operations!.jobs.find(j => j.id === finished.jobId)!;
                const people = this.people(next, co.id).filter(e => enrollmentPaid(e) > 0), amount = sumMoney(people.map(e => stage.index === 0 ? firstHalf(e.priceFen) : e.priceFen - firstHalf(e.priceFen))), operationId = amount > 0 ? courseId('deliver', co.id, String(stage.index)) : null;
                if (operationId)
                    next = this.#post(next, { id: operationId, sourceEventId: co.id, date: job.completeAt, kind: 'deliver_prepaid', accountId: b.accountId, businessId: b.id, contractId: co.id, amountFen: amount });
                next = this.#patch(next, { enrollments: sOf(next).enrollments.map(e => people.some(p => p.id === e.id) ? { ...e, delivered: stage.index === 0 ? [firstHalf(e.priceFen), e.delivered[1]] : [e.delivered[0], e.priceFen - firstHalf(e.priceFen)] } : e), cohorts: sOf(next).cohorts.map(old => old.id === co.id ? { ...old, stages: old.stages.map(st => st.index === stage.index ? { ...st, deliveredAt: job.completeAt, amountFen: amount, operationId } : st) } : old) });
                next = this.#log(next, courseId('stage-taught', co.id, String(stage.index)), job.completeAt, co.id, `第${stage.index + 1}阶段已实际交付，确认${amount}分`);
                co = this.cohort(next, co.id);
            }
            const paid = this.people(next, co.id).filter(e => enrollmentPaid(e) > 0), capacity = this.#capacity(next, co, true);
            if (capacity >= paid.length && paid.length > 0 && co.assessmentAt === null && co.stages.every(st => st.deliveredAt !== null)) {
                const helpedBps = Math.max(0, this.catalog.helpedBps - (co.promise === 'accelerated_results' ? 2000 : 0));
                next = this.#patch(next, { cohorts: sOf(next).cohorts.map(old => old.id === co.id ? { ...old, supportSatisfied: true, assessmentAt: date } : old), enrollments: sOf(next).enrollments.map(e => e.cohortId === co.id && enrollmentPaid(e) > 0 ? { ...e, outcome: BigInt(e.helpRoll) * 10000n < BigInt(helpedBps) * 4294967296n ? 'helped' : 'needs_recovery' } : e) });
            }
            co = this.cohort(next, co.id);
            const complaints = this.people(next, co.id).filter(e => e.outcome === 'needs_recovery' && enrollmentPaid(e) > 0);
            if (complaints.length > 0 && this.#capacity(next, co, true, true) >= complaints.length)
                next = this.#patch(next, { enrollments: sOf(next).enrollments.map(e => complaints.some(p => p.id === e.id) ? { ...e, recovered: true, outcome: 'helped' } : e) });
            co = this.cohort(next, co.id);
            if (co.feePostedAt !== null && !next.economy.ledger.obligations.some(o => o.contractId === co.id && o.remainingFen > 0)) {
                next = this.#patch(next, { cohorts: sOf(next).cohorts.map(old => old.id === co.id ? { ...old, status: 'closed', closedAt: date } : old) });
            }
        }
        return next;
    }
    worldUpdated(m: OperatingModel, event: ScheduledEvent<RunOperation>) {
        if (!m.course || event.payload.kind !== 'world_anchor')
            return { state: m };
        const anchorId = event.payload.anchorId, date = event.date;
        if (!this.catalog.updateAnchorIds.some(id => id === anchorId))
            return { state: m };
        let next = m;
        const newEvents: ScheduledEvent<RunOperation>[] = [];
        for (const c of sOf(next).courses.filter(c => (c.status !== 'retired' || sOf(next).cohorts.some(co => co.courseId === c.id && co.closedAt === null && this.people(next, co.id).some(e => enrollmentPaid(e) > 0))) && !sOf(next).updates.some(u => u.courseId === c.id && u.anchorId === anchorId))) {
            const id = courseId('update', c.id, anchorId), dueAt = addDays(date, 7), affected = sOf(next).cohorts.filter(co => co.courseId === c.id && co.closedAt === null && this.people(next, co.id).some(e => enrollmentPaid(e) > 0)).map(co => co.id);
            next = this.#patch(next, { updates: [...sOf(next).updates, { id, courseId: c.id, anchorId, occurredAt: date, dueAt, affectedCohortIds: affected, settledCohortIds: [], resolvedAt: null, resolution: null, defaulted: false }] });
            newEvents.push(this.#event('update_due', id, addDays(dueAt, 1)));
            next = this.#log(next, id, date, anchorId, '同一历史发布节点改变课程前提，需要更新或停止新招生');
        }
        return { state: next, newEvents };
    }
    reduce(m: OperatingModel, event: ScheduledEvent<RunOperation>) {
        const op = event.payload;
        requireRule(op.kind === 'course_event', 'INVALID_COURSE_EVENT');
        let next = m;
        const date = event.date;
        if (op.type === 'update_due') {
            const u = sOf(next).updates.find(u => u.id === op.entityId);
            requireRule(u && date === addDays(u.dueAt, 1), 'INVALID_COURSE_UPDATE_DEADLINE');
            if (u.resolvedAt === null)
                next = this.#patch(next, { courses: sOf(next).courses.map(c => c.id === u.courseId ? { ...c, paused: true } : c), updates: sOf(next).updates.map(old => old.id === u.id ? { ...old, defaulted: true } : old) });
        }
        else {
            let co = this.cohort(next, op.entityId);
            const c = this.course(next, co.courseId), people = this.people(next, co.id).filter(e => enrollmentPaid(e) > 0);
            if (op.type === 'stage_due') {
                requireRule(date === addDays(co.stages[op.index]!.dueAt, 1), 'INVALID_COURSE_STAGE_DEADLINE');
                if (co.stages[op.index]!.deliveredAt === null && !co.teachingCancelled) {
                    next = this.#refund(next, co, people.map(e => e.personId), 'undelivered', '未按期完成教学，退回未交付部分', date, event.instanceId);
                    next = this.#patch(next, { cohorts: sOf(next).cohorts.map(old => old.id === co.id ? { ...old, teachingCancelled: true, enrollmentPaused: true, status: 'winding_down' } : old) });
                }
            }
            if (op.type === 'support_due') {
                requireRule(date === addDays(co.supportCompleteAt, 1), 'INVALID_COURSE_SUPPORT_DEADLINE');
                if (people.length > 0 && (!co.supportSatisfied || people.some(e => e.outcome === 'needs_recovery'))) {
                    next = this.#patch(next, { cohorts: sOf(next).cohorts.map(old => old.id === co.id ? { ...old, status: 'remedy', enrollmentPaused: true } : old) });
                    next = this.#log(next, courseId('support-issue', co.id), date, co.id, '已有学员的支持或学习目标尚未兑现，可补交付或退款');
                }
            }
            if (op.type === 'remedy_due') {
                requireRule(date === addDays(co.remedyDueAt, 1), 'INVALID_COURSE_REMEDY_DEADLINE');
                const unresolved = this.people(next, co.id).filter(e => enrollmentPaid(e) > 0 && (!co.supportSatisfied || e.outcome === 'needs_recovery'));
                next = this.#refund(next, co, unresolved.map(e => e.personId), 'full', '答疑整改期限已过，按约定退款', date, event.instanceId);
            }
            if (op.type === 'fee_close') {
                requireRule(date === addDays(co.refundUntil, 1), 'INVALID_COURSE_FEE_DATE');
                for (const update of this.unresolved(next, c.id).filter(u => u.affectedCohortIds.includes(co.id))) {
                    next = this.#refund(next, co, this.people(next, co.id).filter(e => enrollmentPaid(e) > 0).map(e => e.personId), 'full', '旧学员更新承诺未兑现，退款收尾', date, courseId('update-refund', update.id, co.id));
                    next = this.#patch(next, { updates: sOf(next).updates.map(u => u.id === update.id ? { ...u, settledCohortIds: [...new Set([...u.settledCohortIds, co.id])], ...(u.affectedCohortIds.every(id => id === co.id || u.settledCohortIds.includes(id)) ? { resolvedAt: date, resolution: 'refunded' as const } : {}) } : u) });
                }
                const b = this.business(next, c.businessId), income = next.economy.ledger.contracts.find(b => b.id === co.id)?.recognizedIncomeFen ?? 0, fee = cumulativeFee(0, income, this.catalog.feeBps);
                if (fee > 0)
                    next = this.#post(next, { id: courseId('fee', co.id), sourceEventId: co.id, date, kind: 'due_expense', accountId: b.accountId, businessId: b.id, contractId: co.id, counterpartyId: 'world', obligationId: courseId('fee-due', co.id), amountFen: fee });
                next = this.#patch(next, { cohorts: sOf(next).cohorts.map(old => old.id === co.id ? { ...old, feePostedAt: date, feeFen: fee, status: 'settling' } : old) });
                next = { ...next, video: { ...next.video!, conversions: next.video!.conversions.map(v => this.people(next, co.id).some(e => e.conversionId === v.id && enrollmentRefund(e) === 0) ? { ...v, outcome: 'retained' } : v) } };
            }
        }
        next = this.sync(next, date);
        next = this.#log(next, event.instanceId, date, op.entityId, `课程期限处理：${op.type}`);
        const gap = next.economy.ledger.obligations.some(o => o.remainingFen > 0 && !m.economy.ledger.obligations.some(old => old.id === o.id && old.remainingFen > 0));
        return { state: next, ...(gap ? { pauseReason: 'CASH_SHORTFALL' } : {}) };
    }
}
