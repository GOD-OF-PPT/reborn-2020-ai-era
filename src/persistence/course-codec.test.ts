import { beforeAll, expect, it } from 'vitest';
import { replayCourseF03 } from '../testing/course-scenarios.ts';
import { hashValue } from '../core/hash.ts';
import { queueEvent } from '../core/timeline.ts';
import { courseId } from '../core/course.ts';
import { createCampaignCodec } from '../application/campaign.ts';
import oldVideo from '../../goal-1/evidence/t10-final-native-paid.json?raw';
let scenario: ReturnType<typeof replayCourseF03>;
beforeAll(() => { scenario = replayCourseF03(); }, 60000);
it.each(['fake-progress', 'fake-refund', 'different-person', 'duplicate-purchase', 'unowned-cohort', 'knowledge-version', 'support-capacity', 'price', 'paid-case', 'video-rights-early', 'orphan-timer', 'fee', 'unearned-income', 'false-upgrade'])('rejects a resigned inconsistent course save: %s', (variant) => {
    const raw = JSON.parse(scenario.end), s = raw.state.course;
    if (variant === 'fake-progress')
        s.enrollments[0].delivered[0]++;
    if (variant === 'fake-refund')
        s.enrollments[0].refundedDelivered[0]--;
    if (variant === 'different-person')
        s.enrollments[0].personId = 'not-in-audience';
    if (variant === 'duplicate-purchase')
        s.enrollments.push({ ...s.enrollments[0], id: 'another-student-record' });
    if (variant === 'unowned-cohort')
        s.cohorts[0].courseId = 'unowned-course';
    if (variant === 'knowledge-version')
        s.courses[0].productKey = 'course:image_workflows:fake-version';
    if (variant === 'support-capacity')
        s.cohorts[0].slots[0].capacity = 999;
    if (variant === 'price')
        s.enrollments[0].priceFen++;
    if (variant === 'paid-case')
        s.courses[0].cases[0].id = 'not-a-paid-case';
    if (variant === 'video-rights-early')
        s.courses[0].topicId = 'video_workflows';
    if (variant === 'orphan-timer') raw.state.timeline=queueEvent(raw.state.timeline,{instanceId:courseId('stage_due','missing-class','0'),date:'2023-04-17',phase:'player_actions',priority:250,payload:{kind:'course_event',type:'stage_due',entityId:'missing-class',date:'2023-04-17',index:0}});
    if (variant === 'fee')
        s.cohorts[0].feeFen++;
    if (variant === 'unearned-income')
        s.cohorts[0].stages[0].amountFen++;
    if (variant === 'false-upgrade')
        s.courses[0].edition = 'advanced';
    const { checksum: _, ...body } = raw;
    raw.checksum = hashValue(body);
    expect(() => scenario.h.codec.import(JSON.stringify(raw))).toThrow(variant==='orphan-timer'?'ORPHAN_COURSE_TIMER':undefined);
    expect(scenario.h.codec.export(scenario.h.codec.import(scenario.end))).toBe(scenario.end);
});
it('preserves and refuses the old schema7 video export explicitly', () => { const codec = createCampaignCodec(), before = hashValue(oldVideo); expect(() => codec.import(oldVideo)).toThrow('UNSUPPORTED_SCHEMA_VERSION'); expect(hashValue(oldVideo)).toBe(before); });
