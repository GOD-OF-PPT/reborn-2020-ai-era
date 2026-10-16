import { requireRule } from './errors.ts';
import { addDays } from './calendar.ts';
import { contractBalance } from './ledger.ts';
import { videoStateSchema, videoEventSchema } from './video-schema.ts';
import { hashValue } from './hash.ts';
import type { GameRun } from './run-types.ts';
import type { VideoRuntime } from './video.ts';
import { videoId } from './video.ts';
export function assertVideo(runtime: VideoRuntime, run: GameRun): void {
    requireRule(videoStateSchema.safeParse(run.video).success && run.video, 'INVALID_VIDEO_STATE');
    const s = run.video, date = run.timeline.cursor.date;
    requireRule(s.version === runtime.catalog.version && s.catalogHash === runtime.hash && s.audienceKey === hashValue(['audience', run.seed]), 'VIDEO_CONTEXT_MISMATCH');
    const ops = run.operations;
    requireRule(ops, 'VIDEO_OPERATIONS_REQUIRED');
    requireRule(new Set(s.conversions.map(c=>c.id)).size===s.conversions.length,'DUPLICATE_VIDEO_ID');
    const courseConversion=(x:typeof s.conversions[number])=>run.course?.enrollments.some(e=>e.id===x.sourceId&&e.conversionId===x.id&&e.personId===x.personId&&e.productKey===x.productVersion)??false;
    requireRule(new Set(s.conversions.map(c=>[c.personId,c.productVersion].join(':'))).size===s.conversions.length,'DUPLICATE_VIDEO_CONVERSION');
    // An untouched video domain has no records to cross-join. Receipt signatures
    // are canonical JSON (checked by the codec); still reject every orphan timer
    // or video job instead of parsing the market's entire history again.
    if (s.channels.length === 0) {
        requireRule([s.works, s.publications, s.applications, s.marketing, s.cohorts, s.contracts, s.settlements].every(rows => rows.length === 0)&&s.conversions.every(courseConversion) && !ops.jobs.some(j => j.definitionId.startsWith('video-')) && !run.timeline.pending.some(e => e.payload.kind === 'video_event') && !run.timeline.receipts.some(r => r.signature.includes('"kind":"video_event"')), 'INVALID_EMPTY_VIDEO_STATE');
        return;
    }
    const financial = new Map(run.economy.ledger.receipts.map(r => [r.id, JSON.parse(r.signature) as Record<string, unknown>]));
    const job = (id: string) => { const j = ops.jobs.find(j => j.id === id); requireRule(j, 'VIDEO_JOB_MISSING'); return j; };
    const fact = (id: string, sourceId: string) => { const f = run.facts.find(f => f.id === id && f.sourceEventId === sourceId && f.domain === 'opportunity'); requireRule(f && f.createdAt <= date, 'VIDEO_FACT_MISSING'); return f; };
    const timers = [...run.timeline.pending, ...run.timeline.receipts.map(r => JSON.parse(r.signature) as {
            instanceId: string;
            date: string;
            payload: unknown;
        })].filter(e => typeof e.payload === 'object' && e.payload !== null && 'kind' in e.payload && e.payload.kind === 'video_event').map(e => { const parsed = videoEventSchema.safeParse(e.payload); requireRule(parsed.success && parsed.data.date === e.date, 'INVALID_VIDEO_TIMER'); return { ...e, payload: parsed.data }; });
    const timer = (type: string, id: string, at: string, version = 0) => requireRule(timers.some(e => e.payload.type === type && e.payload.entityId === id && e.date === at && e.payload.version === version && e.instanceId === videoId(type, id, String(version))), 'MISSING_VIDEO_TIMER');
    for (const rows of [s.channels, s.works, s.publications, s.applications, s.marketing, s.cohorts, s.contracts, s.settlements])
        requireRule(new Set(rows.map(x => x.id)).size === rows.length, 'DUPLICATE_VIDEO_ID');
    requireRule(new Set(s.publications.map(p => p.workId)).size === s.publications.length && new Set(s.conversions.map(c => [c.personId, c.productVersion].join(':'))).size === s.conversions.length, 'DUPLICATE_VIDEO_CONVERSION');
    for (const c of s.channels) {
        const b = ops.businesses.find(b => b.id === c.businessId);
        requireRule(b && b.route === 'ai_video' && run.controlledAccountIds.includes(b.accountId) && c.createdAt <= date, 'INVALID_VIDEO_CHANNEL');
        if (b.lifecycle === 'closed')
            runtime.closeConstraint(run, b.id);
    }
    for (const w of s.works) {
        const c = runtime.channel(run, w.channelId), j = job(w.jobId);
        requireRule(j.businessId === c.businessId && j.contractId === null && j.definitionId === `video-make-${w.productId}-${w.modeId}-${w.materialId}` && w.createdAt <= j.startAt && w.createdAt <= date && w.version === w.correctionJobs.length + 1 && w.reviewedVersion <= w.version, 'INVALID_VIDEO_WORK');
        const f = fact(w.factId, w.id);
        requireRule(w.defect === runtime.qualityDefect(w.modeId, f.roll), 'INVALID_VIDEO_DEFECT');
        requireRule(w.qualityCorrectionJobs.length <= 1 && w.qualityCorrectionJobs.every(id => w.correctionJobs.includes(id)) && (w.qualityCorrectionJobs.length === 0 || w.defect), 'INVALID_VIDEO_QUALITY_CORRECTION');
        for (const id of w.correctionJobs) {
            const correction = job(id);
            requireRule(correction.definitionId === 'video-rework' && correction.businessId === c.businessId && correction.startAt >= j.completeAt, 'INVALID_VIDEO_CORRECTION');
        }
        if (w.reviewedVersion === w.version)
            requireRule(j.status === 'completed' && w.correctionJobs.every(id => job(id).status === 'completed') && w.disclosure === (w.modeId === 'manual' ? 'manual' : w.modeId === 'image_assisted' ? 'ai_assisted' : 'synthetic') && (!w.defect || w.qualityCorrectionJobs.length > 0), 'INVALID_VIDEO_REVIEW');
        if (j.status === 'completed' || j.status === 'running' || j.status === 'planned')
            runtime.jobConstraint(run, j.definitionId, j.startAt, j.completeAt);
        if (w.contractId !== null)
            requireRule(s.contracts.some(c => c.id === w.contractId && c.workId === w.id), 'VIDEO_CONTRACT_MISSING');
        if (w.abandonedAt !== null)
            requireRule(w.abandonedAt <= date && w.contractId === null && !s.publications.some(p => p.workId === w.id), 'INVALID_VIDEO_ABANDONMENT');
    }
    for (const a of s.applications) {
        const c = runtime.channel(run, a.channelId), p = runtime.catalog.programs.find(p => p.id === a.program), j = job(a.jobId), f = fact(a.factId, a.id);
        requireRule(p && j.businessId === c.businessId && j.definitionId === p.jobId && a.appliedAt >= p.from && a.appliedAt <= j.startAt && a.appliedAt <= date && (p.anchorId === null || run.world?.anchors.some(x => x.id === p.anchorId && x.happenedAt <= a.appliedAt)), 'INVALID_VIDEO_APPLICATION');
        if (p.id === 'ads' || p.id === 'affiliate') {
            const population = new Set(s.cohorts.filter(co => co.channelId === c.id && co.date <= a.appliedAt).flatMap(co => co.members));
            requireRule(s.publications.filter(pub => pub.channelId === c.id && pub.measuredAt !== null && pub.measuredAt <= a.appliedAt).length >= 2 && population.size >= 50, 'INVALID_VIDEO_APPLICATION_PORTFOLIO');
        }
        if (a.decidedAt !== null)
            requireRule(a.decidedAt <= date && ((j.status === 'completed' && a.decidedAt === j.completeAt && a.approved === (BigInt(f.roll) * 10000n < BigInt(runtime.catalog.applicationAcceptBps) * 4294967296n) && a.expiresAt === (a.approved ? addDays(a.decidedAt, 365) : null)) || (['interrupted', 'cancelled'].includes(j.status) && a.approved === false && a.expiresAt === null)), 'INVALID_VIDEO_PERMISSION');
        else
            requireRule(j.status !== 'completed' && a.approved === null && a.expiresAt === null, 'UNDECIDED_VIDEO_PERMISSION');
    }
    for (const m of s.marketing) {
        const c = runtime.channel(run, m.channelId), j = job(m.jobId);
        fact(m.factId, m.id);
        requireRule(j.businessId === c.businessId && j.definitionId === 'video-marketing', 'INVALID_VIDEO_MARKETING');
        if (m.completedAt !== null)
            requireRule(j.status === 'completed' && m.completedAt === j.completeAt && s.cohorts.some(c => c.id === m.cohortId && c.sourceId === m.id), 'INVALID_VIDEO_MARKETING_RESULT');
    }
    for (const c of s.cohorts) {
        const channel = runtime.channel(run, c.channelId), source = s.marketing.find(m => m.id === c.sourceId) || s.publications.find(p => p.id === c.sourceId);
        requireRule(source && source.channelId === c.channelId && c.segment === channel.segment && c.date <= date, 'INVALID_VIDEO_COHORT');
        const f = fact(source.factId, source.id), marketing = s.marketing.some(m => m.id === source.id), plan = runtime.audiencePlan(run, source.id, f.roll, marketing), expected = runtime.audienceMembers(run, c.segment, f.roll % 240, plan.memberCount);
        requireRule(hashValue(c.members) === hashValue(expected) && new Set(c.members).size === c.members.length && c.qualifiedMembers.every(id => c.members.includes(id)), 'INVALID_VIDEO_AUDIENCE');
        const qualified = marketing ? (BigInt(f.roll) * 10000n < BigInt(runtime.catalog.marketingMatchBps) * 4294967296n ? expected.slice(0, 3) : expected.slice(0, 1)) : expected.filter((_, n) => n % plan.qualificationStride === 0);
        requireRule(hashValue(c.qualifiedMembers) === hashValue(qualified), 'INVALID_VIDEO_QUALIFIED_AUDIENCE');
    }
    for (const c of s.contracts) {
        const ch = runtime.channel(run, c.channelId), w = runtime.work(run, c.workId), cohort = s.cohorts.find(x => x.id === c.cohortId), f = fact(c.factId, c.id);
        requireRule(cohort?.channelId === ch.id && cohort.qualifiedMembers.includes(c.clientId) && w.contractId === c.id && w.productId === 'commercial' && w.channelId === c.channelId && cohort.date <= c.acceptedAt && w.createdAt === c.acceptedAt && c.acceptedAt <= date && c.dueAt === addDays(c.acceptedAt, runtime.catalog.commercial.deadlineDays) && c.prepaymentFen === runtime.catalog.commercial.prepaymentFen && c.feeBps === runtime.catalog.commercial.feeBps && c.includedRevisions === runtime.catalog.commercial.includedRevisions && c.revisions === w.correctionJobs.length - w.qualityCorrectionJobs.length, 'INVALID_VIDEO_CONTRACT');
        let negotiationSuccess = false;
        if (c.negotiated) {
            requireRule(c.negotiationJobId !== null && c.negotiationFactId !== null && c.negotiation !== null, 'INVALID_VIDEO_NEGOTIATION');
            requireRule(job(c.negotiationJobId).definitionId === 'video-negotiate', 'INVALID_VIDEO_NEGOTIATION');
            const nf = run.facts.find(f => f.id === c.negotiationFactId);
            requireRule(nf, 'VIDEO_FACT_MISSING');
            negotiationSuccess = job(c.negotiationJobId).status === 'completed' && nf.roll % 4 !== 0;
            requireRule(c.negotiationOutcome === (job(c.negotiationJobId).status === 'completed' ? (negotiationSuccess ? 'accepted' : 'rejected') : ['interrupted', 'cancelled'].includes(job(c.negotiationJobId).status) ? 'interrupted' : null), 'INVALID_VIDEO_NEGOTIATION_OUTCOME');
        }
        else
            requireRule(c.negotiationJobId === null && c.negotiationFactId === null && c.negotiation === null && c.negotiationOutcome === null, 'INVALID_VIDEO_NEGOTIATION');
        requireRule(c.priceFen === runtime.catalog.commercial.priceFen + (negotiationSuccess && c.negotiation === 'price' ? 30000 : 0) && c.requiredRevisions === (negotiationSuccess && c.negotiation === 'scope' ? c.revisions : runtime.revisionsFor(f.roll)), 'INVALID_VIDEO_CONTRACT_TERMS');
        timer('deadline', c.id, addDays(c.dueAt, 1));
        if (c.prepaymentFen > 0) {
            const op = financial.get(videoId('prepay', c.id));
            requireRule(op?.kind === 'receive_prepayment' && op.amountFen === c.prepaymentFen && op.contractId === c.id, 'VIDEO_PREPAYMENT_MISSING');
        }
        if (c.status === 'review')
            requireRule(c.submittedAt !== null && c.submittedVersion === w.version && w.reviewedVersion === w.version, 'INVALID_VIDEO_SUBMISSION');
        if (c.submittedAt !== null)
            requireRule(c.submittedAt <= c.dueAt, 'VIDEO_LATE_SUBMISSION');
        if (c.submittedAt !== null)
            timer('customer', c.id, addDays(c.submittedAt, runtime.catalog.commercial.reviewDays), c.reviewSequence);
        if (['delivered', 'settled'].includes(c.status)) {
            requireRule(c.reviewedAt !== null && c.revisions >= c.requiredRevisions && c.paymentAt === addDays(c.reviewedAt, runtime.catalog.commercial.paymentDays) && contractBalance(run.economy.ledger, c.id).recognizedIncomeFen === c.priceFen, 'INVALID_VIDEO_ACCEPTANCE');
            timer('collect', c.id, c.paymentAt!);
        }
        if (c.status === 'settled') {
            requireRule(c.settledAt !== null && c.paymentAt !== null && c.settledAt >= c.paymentAt && c.settledAt <= date && contractBalance(run.economy.ledger, c.id).receivableFen === 0 && c.feePosted, 'INVALID_VIDEO_COLLECTION');
            requireRule(financial.get(videoId('fee', c.id))?.amountFen === Number(BigInt(c.priceFen) * BigInt(c.feeBps) / 10000n), 'VIDEO_FEE_MISSING');
        }
        if (c.status === 'cancelled')
            requireRule(!run.economy.ledger.contracts.some(b => b.id === c.id && b.prepaidFen > 0), 'VIDEO_REFUND_MISSING');
        requireRule(s.conversions.some(x => x.personId === c.clientId && x.productVersion === c.productVersion && x.sourceId === c.id), 'VIDEO_CONVERSION_MISSING');
    }
    for (const p of s.publications) {
        const w = runtime.work(run, p.workId);
        requireRule(w.channelId === p.channelId && w.contractId === null && w.reviewedVersion === w.version && p.publishedAt >= job(w.jobId).completeAt && p.publishedAt <= date && p.measureAt === addDays(p.publishedAt, 7) && (p.publishedAt < runtime.catalog.labelEffectiveAt || w.modeId === 'manual' || p.labelAttached) && (p.unlistedAt === null || p.unlistedAt >= p.publishedAt && p.unlistedAt <= date), 'INVALID_VIDEO_PUBLICATION');
        const pf = fact(p.factId, p.id);
        if (p.measuredAt !== null) {
            const days = p.unlistedAt === null ? 7 : Array.from({ length: 7 }, (_, n) => addDays(p.publishedAt, n)).filter(day => day < p.unlistedAt!).length;
            const expectedViews = Math.floor((w.productId === 'hotspot' ? 5000 + pf.roll % 20000 : 1000 + pf.roll % 5000) * days / 7);
            requireRule(p.views === expectedViews && p.retentionBps === (expectedViews === 0 ? 0 : w.productId === 'original_series' ? 6000 + pf.roll % 3001 : 2000 + pf.roll % 4001), 'INVALID_VIDEO_METRICS');
        }
        const permission = p.permissionId === null ? undefined : s.applications.find(a => a.id === p.permissionId);
        requireRule(p.qualified === (permission !== undefined) && (permission === undefined || permission.channelId === p.channelId && permission.program === p.monetization && permission.approved === true && permission.decidedAt !== null && permission.decidedAt <= p.publishedAt && permission.expiresAt !== null && p.measureAt < permission.expiresAt), 'INVALID_VIDEO_MONETIZATION');
        timer('metrics', p.id, p.measureAt);
        if (p.measuredAt === null)
            requireRule(p.views === 0 && p.followers === 0 && p.qualifiedInquiries === 0 && p.cohortId === null && p.settlementId === null, 'PREMATURE_VIDEO_METRICS');
        else {
            requireRule(p.measuredAt === p.measureAt && p.measuredAt <= date, 'INVALID_VIDEO_MEASUREMENT');
            if (p.views > 0)
                requireRule(s.cohorts.some(c => c.id === p.cohortId && c.sourceId === p.id && c.members.length === p.followers && c.qualifiedMembers.length === p.qualifiedInquiries), 'VIDEO_COHORT_MISSING');
            if (p.qualified && p.monetization === 'affiliate' && p.views > 0)
                timer('affiliate_close', p.id, addDays(p.measureAt, 7));
        }
        if (!p.qualified)
            requireRule(p.settlementId === null, 'UNQUALIFIED_VIDEO_INCOME');
    }
    for (const c of s.conversions) {
        requireRule(c.date <= date, 'FUTURE_VIDEO_CONVERSION');
        if (c.productVersion === 'commercial-v1')
            requireRule(s.contracts.some(x => x.id === c.sourceId && x.clientId === c.personId), 'INVALID_VIDEO_CONVERSION');
        else if(c.productVersion.startsWith('course:'))requireRule(courseConversion(c),'INVALID_COURSE_CONVERSION');
        else {
            const p = s.publications.find(p => p.id === c.sourceId), cohort = s.cohorts.find(co => co.id === p?.cohortId);
            requireRule(c.productVersion === 'affiliate-tool-v1' && p?.qualified && p.monetization === 'affiliate' && cohort?.qualifiedMembers.includes(c.personId), 'INVALID_VIDEO_CONVERSION');
        }
    }
    for (const st of s.settlements) {
        const p = s.publications.find(p => p.id === st.publicationId);
        requireRule(p?.settlementId === st.id && p.qualified && p.monetization === st.kind && p.channelId === st.channelId && st.confirmedAt <= date && st.dueAt === addDays(st.confirmedAt, 14) && st.feeFen === Number(BigInt(st.amountFen) * BigInt(runtime.catalog.platformFeeBps) / 10000n) && contractBalance(run.economy.ledger, st.id).recognizedIncomeFen === st.amountFen, 'INVALID_VIDEO_SETTLEMENT');
        const sales = s.conversions.filter(c => c.sourceId === p.id);
        requireRule(st.amountFen === (st.kind === 'ads' ? Math.floor(p.views / 100) * 100 : sales.filter(c => c.outcome === 'retained').length * runtime.catalog.affiliateCommissionFen), 'INVALID_VIDEO_SETTLEMENT_AMOUNT');
        timer('collect', st.id, st.dueAt);
        if (st.collectedAt !== null)
            requireRule(st.collectedAt >= st.dueAt && st.collectedAt <= date && contractBalance(run.economy.ledger, st.id).receivableFen === 0 && (st.feeFen === 0 || financial.get(videoId('fee', st.id))?.amountFen === st.feeFen), 'INVALID_VIDEO_COLLECTION');
    }
    for (const e of timers) {
        const op = e.payload;
        requireRule(e.instanceId === videoId(op.type, op.entityId, String(op.version)), 'INVALID_VIDEO_TIMER_ID');
        if (op.type === 'customer' || op.type === 'deadline')
            requireRule(s.contracts.some(c => c.id === op.entityId), 'VIDEO_TIMER_OWNER_MISSING');
        else if (op.type === 'collect')
            requireRule(s.contracts.some(c => c.id === op.entityId) || s.settlements.some(s => s.id === op.entityId), 'VIDEO_TIMER_OWNER_MISSING');
        else
            requireRule(s.publications.some(p => p.id === op.entityId), 'VIDEO_TIMER_OWNER_MISSING');
    }
}
