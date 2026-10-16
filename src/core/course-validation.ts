import { courseStateSchema, courseEventSchema } from './course-schema.ts';
import { requireRule } from './errors.ts';
import { hashValue } from './hash.ts';
import { addDays } from './calendar.ts';
import { sumMoney, cumulativeFee } from './money.ts';
import { courseId, enrollmentPaid, enrollmentRefund, firstHalf, type CourseRuntime } from './course.ts';
import type { GameRun } from './run-types.ts';
export function assertCourse(runtime: CourseRuntime, run: GameRun) {
    requireRule(courseStateSchema.safeParse(run.course).success && run.course, 'INVALID_COURSE_STATE');
    const s = run.course, date = run.timeline.cursor.date, ops = run.operations;
    requireRule(ops && run.video && s.version === runtime.catalog.version && s.catalogHash === runtime.hash, 'COURSE_CONTEXT_MISMATCH');
    const lists = [s.outlines, s.licenses, s.studies, s.courses, s.audiences, s.cohorts, s.enrollments, s.payments, s.refunds, s.updates];
    for (const list of lists)
        requireRule(new Set(list.map(x => x.id)).size === list.length, 'DUPLICATE_COURSE_ID');
    if (lists.every(list => list.length === 0)) {
        requireRule(!ops.jobs.some(j => j.definitionId.startsWith('course-')) && !run.timeline.pending.some(e => e.payload.kind === 'course_event') && !run.timeline.receipts.some(r => r.signature.includes('"kind":"course_event"')), 'INVALID_EMPTY_COURSE_STATE');
        return;
    }
    const financial = new Map(run.economy.ledger.receipts.map(r => [r.id, JSON.parse(r.signature) as Record<string, unknown>])), job = (id: string) => { const j = ops.jobs.find(j => j.id === id); requireRule(j, 'COURSE_JOB_MISSING'); return j; }, knownJobs = new Set<string>();
    const ownJob = (id: string, businessId: string, definition: string) => { const j = job(id); requireRule(j.businessId === businessId && j.definitionId === definition && j.contractId === null, 'COURSE_JOB_MISMATCH'); knownJobs.add(id); if (['planned', 'running', 'completed'].includes(j.status))
        runtime.qualificationForJob(run, definition, j.startAt, j.completeAt); return j; };
    const timers = [...run.timeline.pending.filter(e => e.payload.kind === 'course_event'), ...run.timeline.receipts.filter(r => r.signature.includes('"kind":"course_event"')).map(r => JSON.parse(r.signature) as {
            instanceId: string;
            date: string;
            phase: string;
            priority: number;
            payload: unknown;
        })].map(e => { const p = courseEventSchema.safeParse(e.payload); requireRule(p.success && p.data.date === e.date && e.instanceId === courseId(p.data.type, p.data.entityId, String(p.data.index)) && e.phase === 'player_actions' && e.priority === (p.data.type === 'fee_close' ? 400 : 250), 'INVALID_COURSE_TIMER'); return { ...e, payload: p.data }; }), timer = (type: string, id: string, at: string, index = 0) => requireRule(timers.some(e => e.payload.type === type && e.payload.entityId === id && e.date === at && e.payload.index === index), 'MISSING_COURSE_TIMER');
    for (const o of s.outlines) {
        runtime.business(run, o.businessId);
        const j = ownJob(o.jobId, o.businessId, 'course-outline');
        if (j.status === 'completed')
            requireRule(run.world?.preparations.some(p => p.key === 'teaching_outline' && p.sourceEventId === j.id && p.date === j.completeAt), 'COURSE_OUTLINE_PROOF_MISSING');
    }
    for (const l of s.licenses) {
        runtime.business(run, l.businessId);
        ownJob(l.jobId, l.businessId, 'course-material-license');
        requireRule(run.video.contracts.some(c => c.id === l.caseId && c.status === 'settled' && run.video!.works.some(w => w.id === c.workId && w.materialId === 'licensed')), 'COURSE_LICENSE_CASE_MISMATCH');
    }
    for (const study of s.studies) {
        const c = runtime.course(run, study.predecessorId), j = ownJob(study.jobId, study.businessId, 'course-demand-study');
        requireRule(c.edition === 'foundation' && c.businessId === study.businessId && study.members.every(id => runtime.graduates(run, c).includes(id)), 'INVALID_COURSE_DEMAND_STUDY');
        if (study.completedAt !== null)
            requireRule(j.status === 'completed' && study.completedAt === j.completeAt && study.completedAt <= date, 'INVALID_COURSE_DEMAND_COMPLETION');
    }
    for (const c of s.courses) {
        const b = runtime.business(run, c.businessId);
        requireRule(c.createdAt >= runtime.catalog.availableAt && c.createdAt <= date && c.cases.length >= 1 && c.cases.length <= 3 && new Set(c.cases.map(r => r.id)).size === c.cases.length && c.productKey === runtime.productKey(c.topicId, c.edition), 'INVALID_COURSE_PRODUCT');
        for (const ref of c.cases)
            requireRule(runtime.caseInfo(run, ref).paidAt <= c.createdAt, 'COURSE_CASE_NOT_YET_PAID');
        if (c.productId === 'enterprise_training')
            requireRule(c.cases.length >= 2, 'COURSE_DEEP_CASES_REQUIRED');
        if (c.edition === 'advanced')
            requireRule(s.studies.some(st => st.id === c.studyId && st.predecessorId === c.predecessorId && st.completedAt !== null && st.completedAt <= c.createdAt && st.members.length > 0) && s.courses.some(old => old.id === c.predecessorId && old.topicId === c.topicId && old.edition === 'foundation'), 'COURSE_NEW_DEMAND_REQUIRED');
        else
            requireRule(c.studyId === null && c.predecessorId === null, 'INVALID_COURSE_PREDECESSOR');
        for (const id of c.sampleAttempts)
            ownJob(id, b.id, `course-sample-${c.productId}-${c.topicId}`);
        requireRule(c.sampleJobId === null ? c.sampleAttempts.length === 0 : c.sampleAttempts.at(-1) === c.sampleJobId, 'INVALID_COURSE_SAMPLE_HISTORY');
        for (const r of c.refreshJobs) {
            const j = ownJob(r.jobId, b.id, `course-refresh-${c.productId}-${c.topicId}`);
            if (r.applied)
                requireRule(j.status === 'completed' && c.versions.some(v => v.jobId === j.id), 'COURSE_REFRESH_NOT_COMPLETED');
        }
        for (const ref of c.cases)
            if (runtime.caseInfo(run, ref).licensed)
                for (const v of c.versions)
                    requireRule(s.licenses.some(l => l.businessId === c.businessId && l.caseId === ref.id && job(l.jobId).status === 'completed' && job(l.jobId).completeAt <= job(v.jobId).startAt), 'COURSE_MATERIAL_RIGHTS_REQUIRED');
        for (const [index, v] of c.versions.entries()) {
            const j = job(v.jobId);
            requireRule(v.revision === index + 1 && j.status === 'completed' && v.date === j.completeAt && v.date <= date && v.anchorIds.every(id => run.world?.anchors.some(a => a.id === id && a.happenedAt <= j.startAt)), 'INVALID_COURSE_VERSION');
            if (index === 0)
                requireRule(v.jobId === c.sampleJobId && hashValue(v.anchorIds) === hashValue(c.sampleAnchorIds), 'INVALID_COURSE_SAMPLE_VERSION');
            else
                requireRule(c.refreshJobs.some(r => r.jobId === v.jobId && r.applied && hashValue(r.targetAnchorIds) === hashValue(v.anchorIds)), 'INVALID_COURSE_REFRESH_VERSION');
        }
        if (c.status === 'ready')
            requireRule(c.versions.length > 0, 'COURSE_SAMPLE_REQUIRED');
        if (b.lifecycle === 'closed')
            runtime.closeConstraint(run, b.id);
    }
    for (const a of s.audiences) {
        const c = runtime.course(run, a.courseId);
        requireRule(a.createdAt <= date && a.priceFen >= runtime.product(c).minPriceFen && a.priceFen <= runtime.product(c).maxPriceFen && new Set(a.members).size === a.members.length, 'INVALID_COURSE_AUDIENCE');
        if (a.jobId !== null) {
            const j = ownJob(a.jobId, c.businessId, 'course-marketing');
            requireRule(a.mode === 'paid' && a.sourceCohortIds.length === 0, 'INVALID_COURSE_AUDIENCE_JOB');
            if (a.completedAt !== null)
                requireRule(j.status === 'completed' && a.completedAt === j.completeAt && hashValue(a.members) === hashValue(runtime.video.audienceMembers(run, c.segment, 0, 240)), 'COURSE_MARKETING_NOT_COMPLETED');
        }
        else {
            requireRule(a.mode === 'video_referral' && a.completedAt === a.createdAt && a.sourceCohortIds.length > 0, 'COURSE_VIDEO_AUDIENCE_REQUIRED');
            const expected = [...new Set(run.video.cohorts.filter(co => a.sourceCohortIds.includes(co.id) && co.segment === c.segment && co.date <= a.createdAt).flatMap(co => co.members))];
            requireRule(a.sourceCohortIds.every(id => run.video!.cohorts.some(co => co.id === id && co.segment === c.segment && co.date <= a.createdAt)) && hashValue(expected) === hashValue(a.members), 'INVALID_COURSE_VIDEO_REFERRAL');
        }
        requireRule(a.completedAt === null ? a.members.length === 0 && a.eligibleMembers.length === 0 : a.completedAt <= date && hashValue(a.eligibleMembers) === hashValue(runtime.eligible(run, c, a.members, a.priceFen)), 'INVALID_COURSE_DEMAND');
    }
    for (const co of s.cohorts) {
        const c = runtime.course(run, co.courseId), a = s.audiences.find(a => a.id === co.audienceId);
        requireRule(a?.courseId === c.id && a.completedAt !== null && a.completedAt <= co.createdAt && co.createdAt < co.startAt && co.startAt < co.endAt && co.priceFen === a.priceFen && co.stages[0]?.dueAt === addDays(co.startAt, 14) && co.stages[1]?.dueAt === co.endAt && co.refundUntil === co.remedyDueAt && co.remedyDueAt === addDays(co.supportCompleteAt, 7), 'INVALID_COURSE_COHORT');
        let initialCapacity = 0;
        for (const slot of co.slots) {
            const j = ownJob(slot.jobId, c.businessId, `course-support-${c.productId}-${slot.mode}`), capacity = slot.mode === 'self_small' ? runtime.product(c).selfCapacity : runtime.product(c).capacity;
            requireRule(slot.capacity === capacity && j.completeAt <= co.remedyDueAt, 'INVALID_COURSE_SUPPORT_SLOT');
            if (!slot.recovery) {
                initialCapacity += capacity;
                requireRule(j.completeAt === co.supportCompleteAt && j.startAt >= co.endAt && j.startAt <= addDays(co.endAt, 90), 'INVALID_COURSE_SUPPORT_SCHEDULE');
            }
        }
        requireRule(co.seatLimit <= initialCapacity, 'COURSE_SUPPORT_CAPACITY_EXCEEDED');
        const students = runtime.people(run, co.id);
        requireRule(students.length <= co.seatLimit + students.filter(e => enrollmentPaid(e) === 0).length, 'COURSE_TOO_MANY_STUDENTS');
        for (const stage of co.stages) {
            requireRule(stage.index === co.stages.indexOf(stage), 'INVALID_COURSE_STAGE_INDEX');
            for (const attempt of stage.attempts) {
                const j = ownJob(attempt.jobId, c.businessId, `course-stage-${c.productId}-${c.topicId}`);
                requireRule(j.startAt >= co.startAt && j.completeAt <= stage.dueAt && c.versions.some(v => v.revision === attempt.revision && v.date <= j.startAt), 'INVALID_COURSE_STAGE_JOB');
            }
            if (stage.deliveredAt !== null) {
                requireRule(stage.deliveredAt <= date && stage.attempts.some(a => job(a.jobId).status === 'completed' && job(a.jobId).completeAt === stage.deliveredAt), 'COURSE_STAGE_NOT_COMPLETED');
                const amount = sumMoney(students.map(e => e.delivered[stage.index]!));
                requireRule(stage.amountFen === amount && (amount === 0 ? stage.operationId === null : financial.get(stage.operationId!)?.kind === 'deliver_prepaid' && financial.get(stage.operationId!)?.amountFen === amount && financial.get(stage.operationId!)?.contractId === co.id), 'COURSE_STAGE_AMOUNT_MISMATCH');
            }
            else
                requireRule(stage.amountFen === 0 && stage.operationId === null, 'PREMATURE_COURSE_DELIVERY');
            timer('stage_due', co.id, addDays(stage.dueAt, 1), stage.index);
        }
        const bal = run.economy.ledger.contracts.find(b => b.id === co.id), earned = sumMoney(students.map(e => sumMoney(e.delivered) - sumMoney(e.refundedDelivered))), prepaid = sumMoney(students.map(e => e.priceFen - sumMoney(e.delivered) - e.refundedUnearned));
        requireRule(students.length === 0 ? bal === undefined : bal?.businessId === c.businessId && bal.recognizedIncomeFen === earned && bal.prepaidFen === prepaid, 'COURSE_FINANCIAL_BALANCE_MISMATCH');
        timer('support_due', co.id, addDays(co.supportCompleteAt, 1));
        timer('remedy_due', co.id, addDays(co.remedyDueAt, 1));
        timer('fee_close', co.id, addDays(co.refundUntil, 1));
        if (co.assessmentAt !== null)
            requireRule(co.assessmentAt <= date && co.supportSatisfied && co.stages.every(st => st.deliveredAt !== null) && co.slots.filter(slot => job(slot.jobId).status === 'completed').reduce((n, slot) => n + slot.capacity, 0) >= students.filter(e => enrollmentPaid(e) > 0).length, 'INVALID_COURSE_ASSESSMENT');
        if (co.feePostedAt !== null) {
            requireRule(co.feePostedAt === addDays(co.refundUntil, 1) && co.feePostedAt <= date && co.feeFen === cumulativeFee(0, earned, runtime.catalog.feeBps) && (co.feeFen === 0 || financial.get(courseId('fee', co.id))?.amountFen === co.feeFen), 'INVALID_COURSE_FEE');
        }
        if (co.closedAt !== null)
            requireRule(co.status === 'closed' && co.feePostedAt !== null && co.closedAt >= co.feePostedAt && co.closedAt <= date && prepaid === 0 && !run.economy.ledger.obligations.some(o => o.contractId === co.id && o.remainingFen > 0), 'COURSE_CLOSED_WITH_OBLIGATIONS');
    }
    const eligibleByCohort = new Map(s.cohorts.map(co => { const c = runtime.course(run, co.courseId), a = s.audiences.find(a => a.id === co.audienceId)!; return [co.id, new Set(runtime.eligible(run, c, a.members, co.priceFen, co.promise))]; }));
    for (const e of s.enrollments) {
        const co = runtime.cohort(run, e.cohortId), c = runtime.course(run, e.courseId), a = s.audiences.find(a => a.id === co.audienceId)!, batch = s.payments.find(b => b.id === e.paymentBatchId);
        requireRule(co.courseId === c.id && e.productKey === c.productKey && e.originAudienceId === a.id && e.paidAt >= a.completedAt! && e.paidAt < co.startAt && e.paidAt <= date && e.priceFen === co.priceFen && eligibleByCohort.get(co.id)!.has(e.personId) && hashValue(e.originCohortIds) === hashValue(runtime.originVideoCohorts(run, a.id, e.personId)) && e.helpRoll === runtime.score(run, e.personId, c.productKey, 'learning') && batch?.cohortId === co.id && batch.personIds.includes(e.personId) && batch.date === e.paidAt, 'INVALID_COURSE_ENROLLMENT');
        requireRule(enrollmentRefund(e) <= e.priceFen && e.refundedUnearned <= e.priceFen - sumMoney(e.delivered) && e.refundedDelivered.every((n, index) => n <= e.delivered[index]!) && e.delivered[0] <= firstHalf(e.priceFen) && e.delivered[1] <= e.priceFen - firstHalf(e.priceFen), 'INVALID_COURSE_STUDENT_BALANCE');
        for (const [index, amount] of e.delivered.entries())
            if (amount > 0)
                requireRule(co.stages[index]?.deliveredAt !== null && e.paidAt <= co.stages[index]!.deliveredAt!, 'PREMATURE_COURSE_STUDENT_DELIVERY');
        const conversion = run.video.conversions.find(v => v.id === e.conversionId);
        requireRule(conversion?.sourceId === e.id && conversion.personId === e.personId && conversion.productVersion === e.productKey && conversion.date === e.paidAt && conversion.outcome === (enrollmentRefund(e) > 0 ? 'returned' : co.feePostedAt !== null ? 'retained' : 'ordered'), 'COURSE_CONVERSION_MISSING');
        if (e.outcome === 'helped' || e.outcome === 'needs_recovery') {
            requireRule(co.assessmentAt !== null && co.stages.every(st => st.deliveredAt !== null) && e.delivered.every(n => n > 0) && enrollmentRefund(e) === 0, 'COURSE_LEARNING_NOT_ASSESSED');
            const success = BigInt(e.helpRoll) * 10000n < BigInt(Math.max(0, runtime.catalog.helpedBps - (co.promise === 'accelerated_results' ? 2000 : 0))) * 4294967296n;
            requireRule(e.recovered ? e.outcome === 'helped' : e.outcome === (success ? 'helped' : 'needs_recovery'), 'COURSE_LEARNING_RESULT_MISMATCH');
        }
        if (e.recovered)
            requireRule(co.slots.some(slot => slot.recovery && job(slot.jobId).status === 'completed'), 'COURSE_RECOVERY_PROOF_MISSING');
    }
    requireRule(new Set(s.enrollments.map(e => [e.personId, e.productKey].join(':'))).size === s.enrollments.length, 'DUPLICATE_COURSE_PURCHASE');
    for (const p of s.payments) {
        const co = runtime.cohort(run, p.cohortId), amount = sumMoney(s.enrollments.filter(e => e.paymentBatchId === p.id).map(e => e.priceFen)), op = financial.get(p.operationId);
        requireRule(p.date < co.startAt && p.date <= date && p.amountFen === amount && p.personIds.length === s.enrollments.filter(e => e.paymentBatchId === p.id).length && op?.kind === 'receive_prepayment' && op.amountFen === amount && op.contractId === co.id && op.date === p.date, 'INVALID_COURSE_PAYMENT');
    }
    for (const r of s.refunds) {
        runtime.cohort(run, r.cohortId);
        requireRule(r.date <= date && r.personIds.every(id => s.enrollments.some(e => e.cohortId === r.cohortId && e.personId === id)) && r.operationIds.every(id => financial.get(id)?.contractId === r.cohortId && financial.get(id)?.date === r.date), 'INVALID_COURSE_REFUND');
        const unearned = sumMoney(r.operationIds.filter(id => financial.get(id)?.kind === 'refund_undelivered').map(id => financial.get(id)!.amountFen as number)), earned = sumMoney(r.operationIds.filter(id => financial.get(id)?.kind === 'refund_delivered').map(id => financial.get(id)!.amountFen as number));
        requireRule(unearned === r.undeliveredFen && earned === r.deliveredFen, 'COURSE_REFUND_AMOUNT_MISMATCH');
    }
    const refundTally = new Map(s.enrollments.map(e => [e.id, { undelivered: 0, delivered: [0, 0] }]));
    let refundDate = '0001-01-01';
    for (const r of s.refunds) {
        requireRule(r.date >= refundDate && new Set(r.personIds).size === r.personIds.length, 'INVALID_COURSE_REFUND_ORDER');
        refundDate = r.date;
        const co = runtime.cohort(run, r.cohortId);
        let unearned = 0, earned = 0;
        for (const personId of r.personIds) {
            const e = s.enrollments.find(e => e.cohortId === co.id && e.personId === personId)!;
            requireRule(e.paidAt <= r.date, 'COURSE_REFUND_BEFORE_PAYMENT');
            const tally = refundTally.get(e.id)!, given = e.delivered.map((amount, index) => co.stages[index]!.deliveredAt !== null && co.stages[index]!.deliveredAt! <= r.date ? amount : 0), left = e.priceFen - sumMoney(given) - tally.undelivered;
            requireRule(left >= 0, 'COURSE_REFUND_SOURCE_MISMATCH');
            unearned += left;
            tally.undelivered += left;
            if (r.mode === 'full')
                for (const index of [0, 1]) {
                    const amount = given[index]! - tally.delivered[index]!;
                    requireRule(amount >= 0, 'COURSE_REFUND_SOURCE_MISMATCH');
                    earned += amount;
                    tally.delivered[index] = given[index]!;
                }
        }
        requireRule(unearned === r.undeliveredFen && earned === r.deliveredFen, 'COURSE_STUDENT_REFUND_MISMATCH');
    }
    for (const e of s.enrollments) {
        const tally = refundTally.get(e.id)!;
        requireRule(tally.undelivered === e.refundedUnearned && hashValue(tally.delivered) === hashValue(e.refundedDelivered), 'COURSE_STUDENT_REFUND_MISMATCH');
    }
    for (const u of s.updates) {
        const c = runtime.course(run, u.courseId);
        requireRule(runtime.catalog.updateAnchorIds.some(id => id === u.anchorId) && run.world?.anchors.some(a => a.id === u.anchorId && a.happenedAt === u.occurredAt) && u.occurredAt >= c.createdAt && u.dueAt === addDays(u.occurredAt, 7) && u.affectedCohortIds.every(id => s.cohorts.some(co => co.id === id && co.courseId === c.id)), 'INVALID_COURSE_UPDATE');
        requireRule(new Set(u.affectedCohortIds).size === u.affectedCohortIds.length && new Set(u.settledCohortIds).size === u.settledCohortIds.length && u.settledCohortIds.every(id => u.affectedCohortIds.includes(id)), 'INVALID_COURSE_UPDATE_HISTORY');
        timer('update_due', u.id, addDays(u.dueAt, 1));
        if (u.resolvedAt !== null)
            requireRule(u.resolvedAt <= date && (u.resolution === 'refreshed' ? c.versions.some(v => v.date === u.resolvedAt && v.anchorIds.includes(u.anchorId)) : u.affectedCohortIds.every(id => u.settledCohortIds.includes(id) && s.enrollments.filter(e => e.cohortId === id).every(e => enrollmentPaid(e) === 0))), 'INVALID_COURSE_UPDATE_RESOLUTION');
    }
    for (const j of ops.jobs.filter(j => j.definitionId.startsWith('course-')))
        requireRule(knownJobs.has(j.id), 'ORPHAN_COURSE_JOB');
    for (const t of timers) {
        if (t.payload.type === 'update_due')
            requireRule(s.updates.some(u => u.id === t.payload.entityId), 'ORPHAN_COURSE_UPDATE_TIMER');
        else
            requireRule(s.cohorts.some(co => co.id === t.payload.entityId) && (t.payload.type !== 'stage_due' || t.payload.index < 2), 'ORPHAN_COURSE_TIMER');
    }
}
