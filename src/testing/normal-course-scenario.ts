import { createCampaignRun, createCampaignCodec, campaignRuntime } from '../application/campaign.ts';
import { evaluateCommand } from '../core/commands.ts';
import { addDays, quarterOf } from '../core/calendar.ts';
import { quarterLimit, dayBefore } from '../core/operations-calendar.ts';
import { accountFunds, accountPosition, metricsFor } from '../core/ledger.ts';
export function replayNormalCourse(backgroundId: string) {
    const input = { runId: `normal-course-${backgroundId}`, actorId: 'player', commandId: 'create', backgroundId, seed: 'normal-course-s02-v1' }, codec = createCampaignCodec();
    let run = createCampaignRun(input);
    const initial = run, commands: unknown[] = [];
    const send = (kind: string, payload: unknown) => { const command = { runId: run.runId, actorId: 'player', commandId: `normal-course-${run.revision}`, expectedRevision: run.revision, kind, payload }, r = evaluateCommand(run, command, codec.registry, 'player'); if (r.status !== 'proposed')
        throw new Error(JSON.stringify({ kind, payload, result: r })); commands.push(command); run = codec.import(codec.export(r.nextRun)); };
    const advance = (target: string) => { for (let n = 0; n < 100; n++) {
        if (run.timeline.pause) {
            if (run.timeline.pause.reason !== 'CONTENT_DECISION_PENDING')
                throw new Error(JSON.stringify(run.timeline.pause));
            const instance = run.world!.instances.find(i => i.openedBy === run.timeline.pause?.instanceId)!;
            send('ChooseEvent', { instanceId: instance.id, choiceId: campaignRuntime.definition(instance.definitionId).defaultChoiceId });
        }
        else if (run.timeline.cursor.date < target || run.timeline.cursor.phase !== 'snapshot')
            send('AdvanceTime', { date: target });
        else
            return;
    } throw new Error('normal course clock guard'); };
    send('WorkQuarter', {});
    send('StartFirstOrder', {});
    advance('2020-01-19');
    const paidCase = run.operations!.contracts[0]!;
    send('SubmitDelivery', { contractId: paidCase.id });
    advance('2020-01-20');
    while (quarterOf(run.timeline.cursor.date) !== '2022-Q2') {
        advance(dayBefore(quarterLimit(run.timeline.cursor.date)));
        advance(quarterLimit(run.timeline.cursor.date));
        send('WorkQuarter', {});
    }
    advance('2022-04-02');
    send('OpenVideoChannel', { name: '普通人的工具学习记录', segment: 'ai_learners' });
    const channel = run.video!.channels[0]!;
    send('StartVideoWork', { channelId: channel.id, productId: 'original_series', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: '2022-04-02' });
    advance('2022-04-16');
    send('ReviewVideoOutput', { workId: run.video!.works[0]!.id, disclosure: 'manual' });
    send('PublishVideo', { workId: run.video!.works[0]!.id, monetization: 'none' });
    advance('2022-04-23');
    while (quarterOf(run.timeline.cursor.date) !== '2022-Q3') {
        advance(dayBefore(quarterLimit(run.timeline.cursor.date)));
        advance(quarterLimit(run.timeline.cursor.date));
        send('WorkQuarter', {});
    }
    advance('2022-08-22');
    send('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: '2022-08-22' });
    advance('2022-08-29');
    send('DecideVideoProgram', { applicationId: run.video!.applications.at(-1)!.id });
    advance('2022-09-30');
    advance('2022-10-01');
    send('WorkQuarter', {});
    if (!run.video!.applications.at(-1)!.approved) {
        advance('2022-11-21');
        send('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: '2022-11-21' });
        advance('2022-11-28');
        send('DecideVideoProgram', { applicationId: run.video!.applications.at(-1)!.id });
    }
    advance('2022-11-30');
    send('OpenCourseStudio', { capitalFen: 2000000 });
    const business = run.operations!.businesses.find(b => b.definitionId === 'course-studio')!;
    send('StartCourseOutline', { businessId: business.id, resources: ['player-production'], startAt: '2022-12-01' });
    advance('2022-12-08');
    send('ActivateBusiness', { businessId: business.id });
    advance('2023-01-01');
    const sliceInitial = run;
    if (!run.video!.applications.at(-1)!.approved) {
        advance('2023-02-21');
        send('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: '2023-02-21' });
        advance('2023-02-28');
        send('DecideVideoProgram', { applicationId: run.video!.applications.at(-1)!.id });
    }
    if (!run.video!.applications.at(-1)!.approved)
        throw new Error('fixed normal strategy has not gained access; retain failure rather than select another seed');
    send('DefineCourse', { businessId: business.id, name: '从真实交付案例开始的图像实作', productId: 'practical_cohort', topicId: 'image_workflows', edition: 'foundation', segment: 'ai_learners', cases: [{ kind: 'first_order', id: paidCase.id }], consent: true });
    const course = run.course!.courses[0]!, sampleStart = addDays(run.timeline.cursor.date, 1);
    send('BuildCourseSample', { courseId: course.id, resources: ['player-production'], startAt: sampleStart });
    advance(addDays(sampleStart, 14));
    if (run.course!.updates.some(u => u.courseId === course.id && u.resolvedAt === null)) {
        send('StartCourseRefresh', { courseId: course.id, resources: ['player-production'], startAt: run.timeline.cursor.date });
        advance(addDays(run.timeline.cursor.date, 7));
        send('ResumeCourseEnrollment', { courseId: course.id });
    }
    send('CreateCourseAudience', { courseId: course.id, mode: 'video_referral', priceFen: 99900, videoCohortIds: [run.video!.cohorts[0]!.id] });
    const audience = run.course!.audiences[0]!;
    if (audience.eligibleMembers.length < 20)
        throw new Error('fixed normal strategy has insufficient actual learners');
    const startAt = addDays(run.timeline.cursor.date, 2), endAt = addDays(startAt, 35), supportStartAt = quarterLimit(endAt);
    send('PlanCourseCohort', { courseId: course.id, audienceId: audience.id, startAt, endAt, supportStartAt, seatLimit: 20, supportMode: 'guided_group', resources: ['player-production'], promise: 'clear_scope' });
    const cohort = run.course!.cohorts[0]!;
    send('EnrollCourseAudience', { cohortId: cohort.id, personIds: audience.eligibleMembers.slice(0, 20) });
    send('StartCourseStage', { cohortId: cohort.id, index: 0, resources: ['player-production'], startAt });
    advance(addDays(startAt, 10));
    send('StartCourseStage', { cohortId: cohort.id, index: 1, resources: ['player-production'], startAt: run.timeline.cursor.date });
    advance(addDays(run.timeline.cursor.date, 10));
    if (run.timeline.cursor.date < '2023-03-14') {
        advance('2023-03-14');
        send('StartCourseRefresh', { courseId: course.id, resources: ['player-production'], startAt: '2023-03-14' });
        advance('2023-03-21');
    }
    advance(cohort.supportCompleteAt);
    const complaints = run.course!.enrollments.filter(e => e.cohortId === cohort.id && e.outcome === 'needs_recovery');
    if (complaints.length > 0) {
        send('StartCourseRecovery', { cohortId: cohort.id, supportMode: 'guided_group', resources: ['player-production'], startAt: run.timeline.cursor.date });
        advance(addDays(run.timeline.cursor.date, 7));
    }
    advance(addDays(cohort.refundUntil, 1));
    const closed = run;
    if (run.timeline.cursor.date <= '2023-06-30')
        advance('2023-06-30');
    return { initial, sliceInitial, closed, run, commands, versions: run.versions, seed: input.seed, result: { origin: run.origin, backgroundId, closedAt: closed.course!.cohorts[0]!.closedAt, personal: accountFunds(run.economy.ledger, 'personal'), business: accountPosition(run.economy.ledger, business.accountId), courseMetrics: metricsFor(run.economy.ledger, business.accountId, business.id, '2023-01-01'), learners: run.course!.enrollments.length, recovered: run.course!.enrollments.filter(e => e.recovered).length, paidCase: paidCase.id, videoOriginCohort: run.video!.cohorts[0]!.id, salaryPayments: run.operations!.payroll.filter(p => p.kind === 'salary' && p.amountFen > 0).length } };
}
