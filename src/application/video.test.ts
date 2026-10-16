import { expect, it } from 'vitest';
import { createCampaignRun, createCampaignCodec } from './campaign.ts';
import { evaluateCommand } from '../core/commands.ts';
import { metricsFor } from '../core/ledger.ts';
it('produces and publishes a real manual work; unqualified views generate no money', () => {
    const codec = createCampaignCodec();
    let run = createCampaignRun({ runId: 'video-views', actorId: 'player', commandId: 'create', backgroundId: 'technical_employee', seed: 'video-views-seed' });
    const send = (kind: string, payload: unknown) => {
        const result = evaluateCommand(run, { runId: run.runId, actorId: 'player', commandId: `video-${run.revision}`, expectedRevision: run.revision, kind, payload }, codec.registry, 'player');
        if (result.status !== 'proposed')
            throw new Error(JSON.stringify({ kind, result }));
        run = codec.import(codec.export(result.nextRun));
    };
    send('OpenVideoChannel', { name: '公开工具观察', segment: 'ai_learners' });
    const channel = run.video!.channels[0]!;
    send('StartVideoWork', { channelId: channel.id, productId: 'hotspot', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: '2020-01-01' });
    const work = run.video!.works[0]!;
    expect(run.operations!.jobs.find(j => j.id === work.jobId)?.status).toBe('running');
    expect(run.video!.publications).toHaveLength(0);
    send('AdvanceTime', { date: '2020-01-08' });
    send('ReviewVideoOutput', { workId: work.id, disclosure: 'manual' });
    send('PublishVideo', { workId: work.id, monetization: 'ads' });
    send('AdvanceTime', { date: '2020-01-15' });
    expect(run.video!.publications[0]!.views).toBeGreaterThan(0);
    expect(metricsFor(run.economy.ledger, 'personal', channel.businessId).incomeFen).toBe(0);
    expect(run.economy.ledger.accounts[0]!.balanceFen).toBe(2540000);
});
import { replayVideoF02 } from '../testing/video-scenarios.ts';
import { createVideoFixture, VIDEO_FIXTURE_PARAMETERS } from '../testing/video-fixture.ts';
import { previewCommand } from '../core/commands.ts';
import { accountFunds, contractBalance } from '../core/ledger.ts';
import { actionBudget } from '../core/economy.ts';
import { addDays } from '../core/calendar.ts';
import { hashValue } from '../core/hash.ts';
import { projectVideo } from '../core/video-projection.ts';
it('replays the independent F02 ledger through three real commissions and paid rework across two quarters', () => {
    const { run, result } = replayVideoF02();
    expect(result.metrics).toEqual({ incomeFen: 900000, costFen: 465000, profitFen: 435000 });
    expect(result.funds.cashFen).toBe(2435000);
    expect(result.funds.heldFen).toBe(0);
    expect(run.video!.contracts.every(c => c.status === 'settled' && c.revisions === 1)).toBe(true);
    expect(run.operations!.jobs.filter(j => j.definitionId === 'video-rework')).toHaveLength(3);
    expect(actionBudget(run.economy, '2020-03-31').spent).toBe(4);
    expect(actionBudget(run.economy, '2020-06-30').spent).toBe(3);
    expect(run.economy.ledger.obligations.every(o => o.remainingFen === 0)).toBe(true);
}, 30000);
function harness(options: Parameters<typeof createVideoFixture>[0] = {}) { const f = createVideoFixture(options); let run = f.run; return { ...f, get run() { return run; }, send(kind: string, payload: unknown) { run = f.apply(run, kind, payload); }, preview(kind: string, payload: unknown) { return previewCommand(run, { runId: run.runId, actorId: 'player', commandId: `probe-${run.revision}`, expectedRevision: run.revision, kind, payload }, f.registry, 'player'); } }; }
function open(h: ReturnType<typeof harness>) { h.send('OpenVideoChannel', { name: '原创工作室', segment: 'local_merchants' }); return h.run.video!.channels[0]!; }
function marketing(h: ReturnType<typeof harness>, channelId: string) { h.send('StartVideoMarketing', { channelId, resources: ['player-production'], startAt: h.run.timeline.cursor.date }); h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) }); return h.run.video!.cohorts.at(-1)!; }
function sponsor(h: ReturnType<typeof harness>, channelId: string, cohort: ReturnType<typeof marketing>) { h.send('AcceptVideoCommission', { channelId, cohortId: cohort.id, clientId: cohort.qualifiedMembers[0], modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: h.run.timeline.cursor.date }); return h.run.video!.contracts.at(-1)!; }
function finishAndSubmit(h: ReturnType<typeof harness>, id: string) { const c = h.run.video!.contracts.find(c => c.id === id)!, w = h.run.video!.works.find(w => w.id === c.workId)!; const end = [w.jobId, ...w.correctionJobs].map(id => h.run.operations!.jobs.find(j => j.id === id)!.completeAt).sort().at(-1)!; h.send('AdvanceTime', { date: end }); h.send('ReviewVideoOutput', { workId: w.id, disclosure: 'manual' }); h.send('SubmitVideoCommission', { contractId: id }); h.send('AdvanceTime', { date: addDays(end, 2) }); }
it('Q10 rejects overlapping video jobs, protects deposits and retains spent costs when exiting an interrupted rework', () => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, commercial: { ...VIDEO_FIXTURE_PARAMETERS.commercial, prepaymentFen: 90000 } } }), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    expect(accountFunds(h.run.economy.ledger, 'personal').heldFen).toBe(90000);
    expect(contractBalance(h.run.economy.ledger, c.id).recognizedIncomeFen).toBe(0);
    expect(h.preview('StartVideoWork', { channelId: channel.id, productId: 'hotspot', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: h.run.timeline.cursor.date }).reasonCodes).toContain('INSUFFICIENT_CAPACITY');
    finishAndSubmit(h, c.id);
    expect(h.run.video!.contracts[0]!.status).toBe('revision');
    h.send('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    expect(h.preview('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date }).allowed).toBe(false);
    expect(actionBudget(h.run.economy, h.run.timeline.cursor.date).spent).toBe(3);
    h.send('WindDownBusiness', { businessId: channel.businessId });
    expect(h.preview('CloseBusiness', { businessId: channel.businessId }).reasonCodes).toContain('VIDEO_UNSETTLED_OBLIGATIONS');
    h.send('ExitVideoCommission', { contractId: c.id });
    h.send('CloseBusiness', { businessId: channel.businessId });
    expect(contractBalance(h.run.economy.ledger, c.id).prepaidFen).toBe(0);
    expect(metricsFor(h.run.economy.ledger, 'personal', channel.businessId).costFen).toBe(180000);
}, 20000);
it('does not convert the same qualified client twice, even after cancellation or reopening a channel', () => {
    const h = harness(), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    h.send('ExitVideoCommission', { contractId: c.id });
    expect(h.preview('AcceptVideoCommission', { channelId: channel.id, cohortId: cohort.id, clientId: c.clientId, modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: h.run.timeline.cursor.date }).reasonCodes).toContain('AUDIENCE_ALREADY_CONVERTED');
    h.send('WindDownBusiness', { businessId: channel.businessId });
    h.send('CloseBusiness', { businessId: channel.businessId });
    h.send('OpenVideoChannel', { name: '重开的店铺账号', segment: 'local_merchants' });
    expect(h.run.video!.conversions[0]!.personId).toBe(c.clientId);
    expect(h.run.video!.conversions).toHaveLength(1);
});
it('exposes only revealed defects and responses; inspecting and projecting do not draw random numbers', () => {
    const h = harness();
    const c = open(h), before = hashValue(h.run);
    for (let n = 0; n < 4; n++) {
        projectVideo(h.run, h.video);
        h.preview('StartVideoWork', { channelId: c.id, productId: 'hotspot', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: '2020-01-01' });
    }
    expect(hashValue(h.run)).toBe(before);
    h.send('StartVideoWork', { channelId: c.id, productId: 'hotspot', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: '2020-01-01' });
    expect(projectVideo(h.run, h.video)!.works[0]!.defectKnown).toBeNull();
    expect(projectVideo(h.run, h.video)!.works[0]).not.toHaveProperty('factId');
});
it('gates image and video tools by actual world date and separately earned access, including expiry', () => {
    const h = harness({ cashFen: 5000000 });
    const channel = open(h);
    expect(h.preview('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: '2020-01-01' }).reasonCodes).toContain('VIDEO_PROGRAM_NOT_AVAILABLE');
    expect(h.preview('StartVideoWork', { channelId: channel.id, productId: 'hotspot', modeId: 'generative_video', materialId: 'original', resources: ['player-production'], startAt: '2020-01-01' }).reasonCodes).toContain('VIDEO_MODE_QUALIFICATION_REQUIRED');
    h.send('AdvanceTime', { date: '2022-08-22' });
    expect(h.runtime.capabilityReasons(h.run, 'player', 'stable_diffusion_local', '2022-08-22')).toContain('MISSING_ENTITLEMENT:local_model_rights_and_hardware');
    h.send('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: '2022-08-22' });
    expect(h.preview('DecideVideoProgram', { applicationId: h.run.video!.applications[0]!.id }).allowed).toBe(false);
    h.send('AdvanceTime', { date: '2022-08-29' });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications[0]!.id });
    expect(h.runtime.capabilityReasons(h.run, 'player', 'stable_diffusion_local', '2022-08-29')).toEqual([]);
    h.send('StartVideoWork', { channelId: channel.id, productId: 'hotspot', modeId: 'image_assisted', materialId: 'licensed', resources: ['player-production'], startAt: '2022-08-29' });
    h.send('AdvanceTime', { date: '2022-09-05' });
    const w = h.run.video!.works[0]!;
    expect(h.preview('ReviewVideoOutput', { workId: w.id, disclosure: 'manual' }).allowed).toBe(false);
    if (w.defect) {
        h.send('ReworkVideo', { workId: w.id, resources: ['player-production'], startAt: '2022-09-05' });
        h.send('AdvanceTime', { date: '2022-09-12' });
    }
    h.send('ReviewVideoOutput', { workId: w.id, disclosure: 'ai_assisted' });
    h.send('AdvanceTime', { date: '2024-06-06' });
    expect(h.runtime.capabilityReasons(h.run, 'player', 'stable_diffusion_local', '2024-06-06')).toContain('MISSING_ENTITLEMENT:local_model_rights_and_hardware');
    expect(h.runtime.capabilityReasons(h.run, 'player', 'kling_video', '2024-06-06')).toContain('MISSING_ENTITLEMENT:kling_access');
    h.send('ApplyVideoProgram', { channelId: channel.id, program: 'video_access', resources: ['player-production'], startAt: '2024-06-06' });
    h.send('AdvanceTime', { date: '2024-06-13' });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications.at(-1)!.id });
    h.send('StartVideoWork', { channelId: channel.id, productId: 'hotspot', modeId: 'generative_video', materialId: 'original', resources: ['player-production'], startAt: '2024-06-13' });
}, 30000);
function publishSample(h: ReturnType<typeof harness>, channelId: string, monetization: 'none' | 'ads' | 'affiliate' = 'none') {
    h.send('StartVideoWork', { channelId, productId: 'hotspot', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    const w = h.run.video!.works.at(-1)!;
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    h.send('ReviewVideoOutput', { workId: w.id, disclosure: 'manual' });
    h.send('PublishVideo', { workId: w.id, monetization });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    return h.run.video!.publications.at(-1)!;
}
it('separates portfolio, program approval, measured ad income and actual platform payout without retroactive qualification', () => {
    const h = harness(), c = open(h);
    expect(h.preview('ApplyVideoProgram', { channelId: c.id, program: 'ads', resources: ['player-production'], startAt: h.run.timeline.cursor.date }).reasonCodes).toContain('VIDEO_PORTFOLIO_REQUIRED');
    publishSample(h, c.id, 'ads');
    publishSample(h, c.id, 'ads');
    expect(h.run.video!.settlements).toHaveLength(0);
    h.send('ApplyVideoProgram', { channelId: c.id, program: 'ads', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications.at(-1)!.id });
    const before = accountFunds(h.run.economy.ledger, 'personal').cashFen, p = publishSample(h, c.id, 'ads'), st = h.run.video!.settlements[0]!;
    expect(p.qualified).toBe(true);
    expect(st.amountFen).toBeGreaterThan(0);
    expect(accountFunds(h.run.economy.ledger, 'personal').cashFen).toBe(before - 60000);
    expect(contractBalance(h.run.economy.ledger, st.id).receivableFen).toBe(st.amountFen);
    expect(h.preview('CollectVideoSettlement', { settlementId: st.id }).reasonCodes).toContain('VIDEO_PAYMENT_NOT_DUE');
    h.send('UnlistVideo', { publicationId: p.id });
    h.send('AdvanceTime', { date: st.dueAt });
    expect(accountFunds(h.run.economy.ledger, 'personal').cashFen).toBe(before - 60000 + st.amountFen - st.feeFen);
    expect(h.run.video!.publications.slice(0, 2).every(p => p.settlementId === null)).toBe(true);
}, 20000);
it('Q39 keeps finite shared audience identities and one affiliate purchase per product version, including returns', () => {
    const h = harness(), c = open(h);
    publishSample(h, c.id);
    publishSample(h, c.id);
    h.send('ApplyVideoProgram', { channelId: c.id, program: 'affiliate', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications.at(-1)!.id });
    publishSample(h, c.id, 'affiliate');
    expect(h.run.video!.settlements).toHaveLength(0);
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    const first = h.run.video!.conversions.length;
    expect(first).toBeGreaterThan(0);
    expect(h.run.video!.conversions.every(x => x.outcome !== 'ordered')).toBe(true);
    h.send('AdvanceTime', { date: '2020-04-01' });
    publishSample(h, c.id, 'affiliate');
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    expect(new Set(h.run.video!.conversions.map(c => c.personId + ':' + c.productVersion)).size).toBe(h.run.video!.conversions.length);
    expect(h.run.video!.cohorts.every(co => co.members.every(id => h.video.audienceMembers(h.run, 'local_merchants', 0, 240).includes(id)))).toBe(true);
    for (const st of h.run.video!.settlements)
        expect(st.amountFen).toBe(st.retained * 1000);
    expect(h.run.video!.settlements[0]!.grossMerchandiseFen).toBe(first * 10000);
}, 20000);
it('handles a third client revision with paid negotiation, a finite deadline default and no free accepted output', () => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, revisionCount: 3 } }), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    finishAndSubmit(h, c.id);
    h.send('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    finishAndSubmit(h, c.id);
    h.send('NegotiateVideoCommission', { contractId: c.id, proposal: 'scope', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 3) });
    expect(h.run.video!.contracts[0]!.negotiated).toBe(true);
    expect(actionBudget(h.run.economy, h.run.timeline.cursor.date).spent).toBe(4);
    expect(h.preview('NegotiateVideoCommission', { contractId: c.id, proposal: 'price', resources: ['player-production'], startAt: h.run.timeline.cursor.date }).allowed).toBe(false);
    h.send('AdvanceTime', { date: addDays(c.dueAt, 1) });
    expect(h.run.video!.contracts[0]!.status).toBe('cancelled');
    expect(metricsFor(h.run.economy.ledger, 'personal', channel.businessId).incomeFen).toBe(0);
}, 20000);
it('allows stopping at zero action points and keeps prepaid refunds and physical job interruption consistent', () => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, commercial: { ...VIDEO_FIXTURE_PARAMETERS.commercial, prepaymentFen: 90000 } } });
    h.send('WorkQuarter', {});
    const channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    expect(actionBudget(h.run.economy, h.run.timeline.cursor.date).available).toBe(0);
    h.send('ExitVideoCommission', { contractId: c.id });
    h.send('WindDownBusiness', { businessId: channel.businessId });
    h.send('CloseBusiness', { businessId: channel.businessId });
    expect(h.run.operations!.jobs.at(-1)!.status).toBe('interrupted');
    expect(contractBalance(h.run.economy.ledger, c.id).prepaidFen).toBe(0);
});
import { replayNormalVideo } from '../testing/normal-video-scenario.ts';
it.each(['technical_employee', 'content_employee'])('reaches qualified image-assisted video from a normal %s start with actual living costs', (profile) => {
    const { run, result } = replayNormalVideo(profile);
    expect(result.origin).toBe('normal');
    expect(result.granted).toBe(true);
    expect(result.videoWorks).toBe(2);
    expect(result.publications).toBe(2);
    expect(result.firstPublicationIncomeFen).toBe(0);
    expect(result.salaryPayments).toBeGreaterThanOrEqual(36);
    expect(result.cashFen).toBeGreaterThan(0);
    expect(run.economy.ledger.openingPosted).toEqual(['personal']);
    expect(run.economy.ledger.receipts.filter(r => r.kind === 'opening_cash')).toHaveLength(1);
}, 60000);
it('retains failed and interrupted access applications without a permanent stuck application', () => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, applicationAcceptBps: 0 } }), c = open(h);
    h.send('AdvanceTime', { date: '2022-08-22' });
    h.send('ApplyVideoProgram', { channelId: c.id, program: 'image_rights', resources: ['player-production'], startAt: '2022-08-22' });
    const a = h.run.video!.applications[0]!;
    h.send('InterruptJob', { jobId: a.jobId });
    expect(h.run.video!.applications[0]!.approved).toBe(false);
    h.send('AdvanceTime', { date: '2022-11-20' });
    h.send('ApplyVideoProgram', { channelId: c.id, program: 'image_rights', resources: ['player-production'], startAt: '2022-11-20' });
    h.send('AdvanceTime', { date: '2022-11-27' });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications.at(-1)!.id });
    expect(h.run.video!.applications.at(-1)!.approved).toBe(false);
    expect(h.runtime.capabilityReasons(h.run, 'player', 'stable_diffusion_local', '2022-11-27')).toContain('MISSING_ENTITLEMENT:local_model_rights_and_hardware');
}, 20000);
it('applies the 2025 synthetic-label effective date prospectively and keeps production access separate', () => {
    const h = harness({ cashFen: 5000000 }), c = open(h);
    h.send('AdvanceTime', { date: '2025-08-01' });
    h.send('ApplyVideoProgram', { channelId: c.id, program: 'video_access', resources: ['player-production'], startAt: '2025-08-01' });
    h.send('AdvanceTime', { date: '2025-08-08' });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications[0]!.id });
    const make = () => {
        h.send('StartVideoWork', { channelId: c.id, productId: 'hotspot', modeId: 'generative_video', materialId: 'original', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
        const w = h.run.video!.works.at(-1)!;
        h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 5) });
        if (w.defect) {
            h.send('ReworkVideo', { workId: w.id, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
            h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
        }
        h.send('ReviewVideoOutput', { workId: w.id, disclosure: 'synthetic' });
        return w.id;
    };
    const before = make();
    h.send('PublishVideo', { workId: before, monetization: 'none' });
    expect(h.run.video!.publications[0]!.labelAttached).toBe(false);
    h.send('AdvanceTime', { date: '2025-10-01' });
    const after = make();
    expect(h.preview('PublishVideo', { workId: after, monetization: 'none' }).reasonCodes).toContain('VIDEO_2025_LABEL_REQUIRED');
    h.send('PublishVideo', { workId: after, monetization: 'none', label: true });
    expect(h.run.video!.publications[1]!.labelAttached).toBe(true);
}, 20000);
it('does not let winding down erase an unmeasured publication or an affiliate return window', () => {
    const h = harness(), c = open(h);
    publishSample(h, c.id);
    publishSample(h, c.id);
    h.send('ApplyVideoProgram', { channelId: c.id, program: 'affiliate', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications[0]!.id });
    const pub = publishSample(h, c.id, 'affiliate');
    h.send('WindDownBusiness', { businessId: c.businessId });
    expect(h.preview('CloseBusiness', { businessId: c.businessId }).reasonCodes).toContain('VIDEO_UNSETTLED_OBLIGATIONS');
    h.send('AdvanceTime', { date: addDays(pub.measureAt, 7) });
    expect(h.run.video!.conversions.every(c => c.outcome !== 'ordered')).toBe(true);
    const st = h.run.video!.settlements.at(-1);
    if (st)
        h.send('AdvanceTime', { date: st.dueAt });
    h.send('CloseBusiness', { businessId: c.businessId });
}, 20000);
it('resubmits the same reviewed work after accepted scope negotiation using a new review identity', () => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, revisionCount: 3 } }), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    finishAndSubmit(h, c.id);
    h.send('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    finishAndSubmit(h, c.id);
    const version = h.run.video!.works[0]!.version;
    h.send('NegotiateVideoCommission', { contractId: c.id, proposal: 'scope', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 3) });
    expect(h.run.video!.contracts[0]!.negotiationOutcome).toBe('accepted');
    const random = hashValue(h.run.random);
    h.send('SubmitVideoCommission', { contractId: c.id });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 2) });
    expect(h.run.video!.contracts[0]!.status).toBe('delivered');
    expect(h.run.video!.works[0]!.version).toBe(version);
    expect(h.run.video!.contracts[0]!.reviewSequence).toBe(3);
    expect(hashValue(h.run.random)).toBe(random);
    expect(h.run.timeline.receipts.filter(r => JSON.parse(r.signature).payload.type === 'customer')).toHaveLength(3);
}, 20000);
it('charges AI material quality correction without spending the client modification allowance', () => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, qualityDefectBps: 10000 } }), channel = open(h);
    h.send('AdvanceTime', { date: '2023-01-01' });
    h.send('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: '2023-01-01' });
    h.send('AdvanceTime', { date: '2023-01-08' });
    h.send('DecideVideoProgram', { applicationId: h.run.video!.applications[0]!.id });
    const cohort = marketing(h, channel.id);
    h.send('AcceptVideoCommission', { channelId: channel.id, cohortId: cohort.id, clientId: cohort.qualifiedMembers[0], modeId: 'image_assisted', materialId: 'original', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    const c = h.run.video!.contracts[0]!, work = h.run.video!.works[0]!;
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    expect(h.preview('ReviewVideoOutput', { workId: work.id, disclosure: 'ai_assisted' }).reasonCodes).toContain('VIDEO_CORRECTION_REQUIRED');
    h.send('ReworkVideo', { workId: work.id, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 7) });
    h.send('ReviewVideoOutput', { workId: work.id, disclosure: 'ai_assisted' });
    expect(h.run.video!.contracts[0]!.revisions).toBe(0);
    expect(h.run.video!.works[0]!.qualityCorrectionJobs).toHaveLength(1);
    expect(h.run.video!.works[0]!.version).toBe(2);
    h.send('SubmitVideoCommission', { contractId: c.id });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 2) });
    expect(h.run.video!.contracts[0]!.status).toBe('revision');
    expect(h.run.video!.contracts[0]!.revisions).toBe(0);
}, 20000);
it('has a finite stop path at actual zero cash without manufacturing a completed work', () => {
    const h = harness({ cashFen: 60000 }), c = open(h);
    h.send('StartVideoWork', { channelId: c.id, productId: 'hotspot', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: '2020-01-01' });
    expect(accountFunds(h.run.economy.ledger, 'personal').cashFen).toBe(0);
    const w = h.run.video!.works[0]!;
    h.send('AbandonVideoWork', { workId: w.id });
    h.send('WindDownBusiness', { businessId: c.businessId });
    h.send('CloseBusiness', { businessId: c.businessId });
    expect(h.run.operations!.jobs[0]!.status).toBe('interrupted');
    expect(h.run.video!.publications).toHaveLength(0);
    expect(metricsFor(h.run.economy.ledger, 'personal', c.businessId).incomeFen).toBe(0);
});
it('can exit or hit the finite deadline during a pending negotiation without losing refund duties', () => {
    for (const exit of ['explicit', 'deadline'] as const) {
        const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, revisionCount: 3, commercial: { ...VIDEO_FIXTURE_PARAMETERS.commercial, prepaymentFen: 90000 } } }), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
        finishAndSubmit(h, c.id);
        h.send('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
        finishAndSubmit(h, c.id);
        const startAt = exit === 'deadline' ? addDays(c.dueAt, 0) : h.run.timeline.cursor.date;
        if (exit === 'deadline')
            h.send('AdvanceTime', { date: startAt });
        if (exit === 'explicit') {
            h.send('NegotiateVideoCommission', { contractId: c.id, proposal: 'scope', resources: ['player-production'], startAt });
            h.send('ExitVideoCommission', { contractId: c.id });
            expect(h.run.video!.contracts[0]!.negotiationOutcome).toBe('interrupted');
        }
        else
            h.send('AdvanceTime', { date: addDays(c.dueAt, 1) });
        expect(h.run.video!.contracts[0]!.status).toBe('cancelled');
        expect(contractBalance(h.run.economy.ledger, c.id).prepaidFen).toBe(0);
        expect(metricsFor(h.run.economy.ledger, 'personal', channel.businessId).incomeFen).toBe(0);
    }
}, 20000);
it('collects a negotiated price increase only after all remaining revisions and charges the corresponding fee', () => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, revisionCount: 3 } }), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    finishAndSubmit(h, c.id);
    h.send('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    finishAndSubmit(h, c.id);
    h.send('NegotiateVideoCommission', { contractId: c.id, proposal: 'price', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 3) });
    expect(h.run.video!.contracts[0]!.negotiationOutcome).toBe('accepted');
    expect(h.run.video!.contracts[0]!.priceFen).toBe(330000);
    expect(h.run.video!.contracts[0]!.status).toBe('revision');
    expect(metricsFor(h.run.economy.ledger, 'personal', channel.businessId).incomeFen).toBe(0);
    h.send('AdvanceTime', { date: '2020-04-01' });
    for (let n = 0; n < 2; n++) {
        h.send('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
        finishAndSubmit(h, c.id);
    }
    const ready = h.run.video!.contracts[0]!;
    expect(ready.status).toBe('delivered');
    h.send('AdvanceTime', { date: ready.paymentAt });
    expect(h.run.video!.contracts[0]!.status).toBe('settled');
    expect(metricsFor(h.run.economy.ledger, 'personal', channel.businessId)).toEqual({ incomeFen: 330000, costFen: 256500, profitFen: 73500 });
    expect(accountFunds(h.run.economy.ledger, 'personal').cashFen).toBe(2073500);
}, 20000);
it('retains original terms after a fixed rejected negotiation and still permits a protected-deposit exit', () => {
    const h = harness({ seed: 'video-negotiation-rejected-5', parameters: { ...VIDEO_FIXTURE_PARAMETERS, revisionCount: 3, commercial: { ...VIDEO_FIXTURE_PARAMETERS.commercial, prepaymentFen: 90000 } } }), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    finishAndSubmit(h, c.id);
    h.send('ReworkVideo', { workId: c.workId, resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    finishAndSubmit(h, c.id);
    h.send('NegotiateVideoCommission', { contractId: c.id, proposal: 'price', resources: ['player-production'], startAt: h.run.timeline.cursor.date });
    h.send('AdvanceTime', { date: addDays(h.run.timeline.cursor.date, 3) });
    expect(h.run.video!.contracts[0]!.negotiationOutcome).toBe('rejected');
    expect(h.run.video!.contracts[0]!.priceFen).toBe(300000);
    expect(h.preview('SubmitVideoCommission', { contractId: c.id }).allowed).toBe(false);
    expect(h.preview('NegotiateVideoCommission', { contractId: c.id, proposal: 'scope', resources: ['player-production'], startAt: h.run.timeline.cursor.date }).allowed).toBe(false);
    h.send('ExitVideoCommission', { contractId: c.id });
    expect(contractBalance(h.run.economy.ledger, c.id).prepaidFen).toBe(0);
    expect(metricsFor(h.run.economy.ledger, 'personal', channel.businessId).incomeFen).toBe(0);
}, 20000);
it('gives original series a real audience and inquiry advantage in exchange for higher cost, time and fewer views', () => {
    const outcomes = (['hotspot', 'original_series'] as const).map(productId => { const h = harness(), c = open(h); h.send('StartVideoWork', { channelId: c.id, productId, modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: '2020-01-01' }); const work = h.run.video!.works[0]!, job = h.run.operations!.jobs[0]!; h.send('AdvanceTime', { date: job.completeAt }); h.send('ReviewVideoOutput', { workId: work.id, disclosure: 'manual' }); h.send('PublishVideo', { workId: work.id, monetization: 'none' }); h.send('AdvanceTime', { date: addDays(job.completeAt, 7) }); return { publication: h.run.video!.publications[0]!, channel: projectVideo(h.run, h.video)!.channels[0]!, cost: metricsFor(h.run.economy.ledger, 'personal', c.businessId).costFen, completeAt: job.completeAt }; });
    const [hotspot, original] = outcomes;
    if (!hotspot || !original)
        throw new Error('Both product outcomes are required');
    expect(original.publication.followers).toBe(hotspot.publication.followers + 50);
    expect(original.publication.qualifiedInquiries).toBeGreaterThan(hotspot.publication.qualifiedInquiries);
    expect(original.publication.views).toBeLessThan(hotspot.publication.views);
    expect(original.publication.retentionBps).toBeGreaterThanOrEqual(hotspot.publication.retentionBps);
    expect(original.cost).toBe(90000);
    expect(hotspot.cost).toBe(60000);
    expect(original.completeAt).toBe('2020-01-15');
    expect(hotspot.completeAt).toBe('2020-01-08');
    expect(original.channel.originalBrandWorks).toBe(1);
    expect(hotspot.channel.originalBrandWorks).toBe(0);
    expect(original.channel.metrics.incomeFen).toBe(0);
});
it.each([0, 1])('keeps an on-time final-day submission in review, with %s later revision request(s)', (revisionCount) => {
    const h = harness({ parameters: { ...VIDEO_FIXTURE_PARAMETERS, revisionCount, commercial: { ...VIDEO_FIXTURE_PARAMETERS.commercial, prepaymentFen: 90000, deadlineDays: 17 } } }), channel = open(h), cohort = marketing(h, channel.id), c = sponsor(h, channel.id, cohort);
    h.send('AdvanceTime', { date: c.dueAt });
    h.send('ReviewVideoOutput', { workId: c.workId, disclosure: 'manual' });
    h.send('SubmitVideoCommission', { contractId: c.id });
    h.send('AdvanceTime', { date: addDays(c.dueAt, 1) });
    expect(h.run.video!.contracts[0]!.status).toBe('review');
    h.send('AdvanceTime', { date: addDays(c.dueAt, 2) });
    expect(h.run.video!.contracts[0]!.reviewedAt).toBe(addDays(c.dueAt, 2));
    if (revisionCount === 0) {
        expect(h.run.video!.contracts[0]!.status).toBe('delivered');
        h.send('AdvanceTime', { date: h.run.video!.contracts[0]!.paymentAt });
        expect(accountFunds(h.run.economy.ledger, 'personal').cashFen).toBe(2135000);
    }
    else {
        expect(h.run.video!.contracts[0]!.status).toBe('cancelled');
        expect(contractBalance(h.run.economy.ledger, c.id).prepaidFen).toBe(0);
        expect(metricsFor(h.run.economy.ledger, 'personal', channel.businessId).incomeFen).toBe(0);
        expect(accountFunds(h.run.economy.ledger, 'personal').cashFen).toBe(1850000);
    }
}, 20000);
it('starts and expires program access on actual task completion, independently of when the result is read', () => {
    const h = harness(), channel = open(h);
    h.send('AdvanceTime', { date: '2022-08-22' });
    h.send('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: '2022-08-22' });
    const application = h.run.video!.applications[0]!;
    h.send('AdvanceTime', { date: '2022-08-29' });
    expect(h.run.video!.applications[0]).toMatchObject({ decidedAt: '2022-08-29', approved: true, expiresAt: '2023-08-29' });
    expect(h.runtime.capabilityReasons(h.run, 'player', 'stable_diffusion_local', '2022-08-29')).toEqual([]);
    h.send('AdvanceTime', { date: '2024-01-01' });
    h.send('DecideVideoProgram', { applicationId: application.id });
    expect(h.run.video!.applications[0]!.expiresAt).toBe('2023-08-29');
    expect(h.runtime.capabilityReasons(h.run, 'player', 'stable_diffusion_local', '2024-01-01')).toContain('MISSING_ENTITLEMENT:local_model_rights_and_hardware');
    expect(projectVideo(h.run, h.video)!.applications[0]!.resultRead).toBe(true);
}, 20000);
