import { beforeAll, expect, it } from 'vitest';
import { replayVideoF02 } from '../testing/video-scenarios.ts';
import { createVideoFixture } from '../testing/video-fixture.ts';
import { hashValue } from '../core/hash.ts';
import oldPlayable from '../../goal-1/evidence/t09-s01-technical_employee-initial.json?raw';
let paid = '', codec = createVideoFixture().codec;
beforeAll(() => { const result = replayVideoF02(); paid = result.end; codec = result.f.codec; }, 30000);
it.each(['price', 'revision', 'prepay', 'qualification', 'conversion', 'conversion-id', 'audience', 'job', 'timer', 'income', 'channel-owner', 'quality-as-client', 'review-identity', 'unreleased-product'])('refuses a resigned inconsistent video save: %s', (variant) => {
    const raw = JSON.parse(paid), s = raw.state.video;
    if (variant === 'price')
        s.contracts[0].priceFen++;
    if (variant === 'revision')
        s.contracts[0].revisions = 0;
    if (variant === 'prepay')
        s.contracts[0].prepaymentFen = 100;
    if (variant === 'qualification')
        s.contracts[0].requiredRevisions = 0;
    if (variant === 'conversion')
        s.conversions.push({ ...s.conversions[0], id: 'duplicate-person' });
    if (variant === 'conversion-id') s.conversions[1].id=s.conversions[0].id;
    if (variant === 'audience')
        s.cohorts[0].members[0] = 'made-up-person';
    if (variant === 'job')
        s.works[0].jobId = 'unowned-job';
    if (variant === 'timer')
        raw.state.timeline.receipts = raw.state.timeline.receipts.filter((r: {
            signature: string;
        }) => !(JSON.parse(r.signature).payload.type === 'customer' && JSON.parse(r.signature).payload.entityId === s.contracts[0].id));
    if (variant === 'income')
        s.contracts[0].settledAt = '2020-01-01';
    if (variant === 'channel-owner')
        s.channels[0].businessId = 'other-business';
    if (variant === 'quality-as-client')
        s.works[0].qualityCorrectionJobs = [s.works[0].correctionJobs[0]];
    if (variant === 'review-identity')
        s.contracts[0].reviewSequence = 99;
    if (variant === 'unreleased-product')
        s.contracts[0].productVersion = 'commercial-v2';
    const { checksum: _, ...body } = raw;
    raw.checksum = hashValue(body);
    expect(() => codec.import(JSON.stringify(raw))).toThrow();
    expect(codec.export(codec.import(paid))).toBe(paid);
});
it('explicitly refuses and preserves the old schema6 export', () => { const before = hashValue(oldPlayable); expect(() => codec.import(oldPlayable)).toThrow('UNSUPPORTED_SCHEMA_VERSION'); expect(hashValue(oldPlayable)).toBe(before); });
import draftVideo from '../../goal-1/evidence/t10-draft-negotiation.json?raw';
it('preserves and explicitly refuses the intermediate native v1 video draft under final v2 rules', () => { const before = hashValue(draftVideo); expect(() => codec.import(draftVideo)).toThrow('UNSUPPORTED_SCHEMA_VERSION'); expect(hashValue(draftVideo)).toBe(before); });
import { createCampaignRun, createCampaignCodec } from '../application/campaign.ts';
import { queueEvent } from '../core/timeline.ts';
import { videoId } from '../core/video.ts';
it('rejects orphan video events even when the domain contains no channel', () => { const codec = createCampaignCodec(), run = createCampaignRun({ runId: 'empty-video-orphan', actorId: 'player', commandId: 'create', seed: 'empty-video', backgroundId: 'technical_employee' }); const timeline = queueEvent(run.timeline, { instanceId: videoId('metrics', 'orphan', '0'), date: '2020-01-02', phase: 'player_actions', priority: 200, payload: { kind: 'video_event', type: 'metrics', entityId: 'orphan', date: '2020-01-02', version: 0 } }); expect(() => codec.export({ ...run, timeline })).toThrow('INVALID_EMPTY_VIDEO_STATE'); });
