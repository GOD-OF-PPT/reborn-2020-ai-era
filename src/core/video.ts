import { addDays } from './calendar.ts';
import { applyEconomy, type EconomyOperation } from './economy.ts';
import { accountFunds, contractBalance } from './ledger.ts';
import { requireRule } from './errors.ts';
import { hashValue } from './hash.ts';
import { freezeFact, revealFact } from './facts.ts';
import { queueEvent, type ScheduledEvent } from './timeline.ts';
import { VIDEO_CONTENT } from '../content/video.ts';
import type { OperationsRuntime } from './operations.ts';
import type { OperatingContext, OperatingModel } from './operations-types.ts';
import type { RuleModel, GameRun } from './run-types.ts';
import type { RunOperation } from './content-types.ts';
import { videoStateSchema, type VideoState, type VideoWork, type VideoContract, type VideoEvent, type VideoContext, videoParametersSchema, type VideoParameters } from './video-schema.ts';
import { assertVideo } from './video-validation.ts';
export const videoId = (...p: string[]) => `vid:${hashValue(p).slice(0, 32)}`;
export type VideoIntent = {
    readonly kind: string;
    readonly [key: string]: unknown;
};
const stateOf = (m: {
    readonly video?: VideoState | null;
}) => { requireRule(m.video, 'VIDEO_NOT_CONFIGURED'); return m.video; };
const emptyPreview = () => ({ allowed: true, reasonCodes: [] as readonly string[], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 });
const string = (v: unknown) => { requireRule(typeof v === 'string', 'INVALID_VIDEO_PAYLOAD'); return v; };
const resources = (v: unknown) => { requireRule(Array.isArray(v) && v.every(x => typeof x === 'string'), 'INVALID_VIDEO_RESOURCES'); return v as string[]; };
const productionId = (p: string, m: string, r: string) => `video-make-${p}-${m}-${r}`;
export class VideoRuntime {
    readonly catalog: Omit<typeof VIDEO_CONTENT, keyof VideoParameters> & VideoParameters;
    readonly hash: string;
    readonly operations: OperationsRuntime;
    readonly capabilityReasons: (m: OperatingContext, id: string, date: string) => readonly string[];
    constructor(operations: OperationsRuntime, capabilityReasons: (m: OperatingContext, id: string, date: string) => readonly string[], parameters: unknown = { commercial: VIDEO_CONTENT.commercial, qualityDefectBps: VIDEO_CONTENT.qualityDefectBps, marketingMatchBps: VIDEO_CONTENT.marketingMatchBps, applicationAcceptBps: VIDEO_CONTENT.applicationAcceptBps, revisionCount: null }) { const parsed = videoParametersSchema.safeParse(parameters); requireRule(parsed.success, 'INVALID_VIDEO_PARAMETERS'); this.catalog = { ...VIDEO_CONTENT, ...parsed.data }; this.hash = hashValue(this.catalog); this.operations = operations; this.capabilityReasons = capabilityReasons; }
    qualityDefect(mode: string, roll: number): boolean { return mode !== 'manual' && BigInt(roll) * 10000n < BigInt(this.catalog.qualityDefectBps) * 4294967296n; }
    revisionsFor(roll: number): number { return this.catalog.revisionCount ?? roll % 4; }
    initial(seed: string): VideoState { return { version: this.catalog.version, catalogHash: this.hash, audienceKey: hashValue(['audience', seed]), channels: [], works: [], publications: [], applications: [], marketing: [], cohorts: [], conversions: [], contracts: [], settlements: [] }; }
    validate(run: GameRun): void { assertVideo(this, run); }
    channel(m: VideoContext, id: string) { const c = stateOf(m).channels.find(c => c.id === id); requireRule(c, 'VIDEO_CHANNEL_NOT_FOUND'); this.operations.business(m, c.businessId); return c; }
    work(m: VideoContext, id: string) { const w = stateOf(m).works.find(w => w.id === id); requireRule(w, 'VIDEO_WORK_NOT_FOUND'); this.channel(m, w.channelId); return w; }
    contract(m: VideoContext, id: string) { const c = stateOf(m).contracts.find(c => c.id === id); requireRule(c, 'VIDEO_CONTRACT_NOT_FOUND'); this.channel(m, c.channelId); return c; }
    #patch<T extends OperatingModel>(m: T, fields: Partial<VideoState>): T { return { ...m, video: { ...stateOf(m), ...fields } }; }
    #log<T extends OperatingModel>(m: T, id: string, date: string, sourceId: string, text: string): T { requireRule(m.operations, 'OPERATIONS_NOT_CONFIGURED'); return { ...m, operations: { ...m.operations, logs: [...m.operations.logs, { id, date, sourceEventId: sourceId, text, visibility: 'visible', parentIds: [] }] } }; }
    #post<T extends OperatingModel>(m: T, op: EconomyOperation): T { return this.#log({ ...m, economy: applyEconomy(m.economy, op) }, op.id, op.date, op.sourceEventId, `视频账目：${op.kind}`); }
    #fact<T extends OperatingModel>(m: T, id: string, date: string): T { return { ...m, ...freezeFact(m, { id: videoId('fact', id), sourceEventId: id, date, domain: 'opportunity' }) }; }
    #roll(m: OperatingModel, id: string) { const f = m.facts.find(f => f.id === id); requireRule(f, 'VIDEO_FACT_MISSING'); return f.roll; }
    #event(type: VideoEvent['type'], entityId: string, date: string, version = 0): ScheduledEvent<RunOperation> { return { instanceId: videoId(type, entityId, String(version)), date, phase: type === 'collect' ? 'certain_receipts' : 'player_actions', priority: type === 'deadline' ? 300 : 200, payload: { kind: 'video_event', type, entityId, date, version } }; }
    #queue(m: RuleModel, e: ScheduledEvent<RunOperation>): RuleModel { return { ...m, timeline: queueEvent(m.timeline, e) }; }
    #active(m: VideoContext, channelId: string) { const channel = this.channel(m, channelId), b = this.operations.business(m, channel.businessId); requireRule(b.lifecycle === 'operating' && !m.world?.stoppedBindings.includes(b.id), 'VIDEO_NEW_WORK_PAUSED'); return channel; }
    #jobDone(m: VideoContext, id: string) { return m.operations?.jobs.some(j => j.id === id && j.status === 'completed') ?? false; }
    permission(m: VideoContext, channelId: string, program: string, date: string) { return stateOf(m).applications.find(a => a.channelId === channelId && a.program === program && a.approved === true && a.decidedAt !== null && a.decidedAt <= date && a.expiresAt !== null && date < a.expiresAt); }
    hasEntitlement(m: OperatingContext, bindingId: string, id: string, date: string): boolean { return bindingId === 'player' && (m.video?.applications.some(a => this.catalog.programs.some(p => p.id === a.program && p.entitlement === id) && a.approved === true && a.decidedAt !== null && a.decidedAt <= date && a.expiresAt !== null && date < a.expiresAt) ?? false); }
    jobConstraint(m: OperatingContext, definitionId: string, from: string, to: string): void {
        if (!definitionId.startsWith('video-make-'))
            return;
        const mode = this.catalog.modes.find(mode => definitionId.includes(`-${mode.id}-`));
        requireRule(mode, 'VIDEO_MODE_NOT_FOUND');
        for (let day = from; day < to; day = addDays(day, 1))
            requireRule(this.capabilityReasons(m, mode.capability, day).length === 0, 'VIDEO_MODE_QUALIFICATION_REQUIRED');
    }
    closeConstraint(m: OperatingContext, businessId: string): void {
        if (!m.video)
            return;
        const ids = m.video.channels.filter(c => c.businessId === businessId).map(c => c.id);
        requireRule(!m.video.contracts.some(c => ids.includes(c.channelId) && !['settled', 'cancelled'].includes(c.status)) && !m.video.publications.some(p => ids.includes(p.channelId) && p.measuredAt === null) && !m.video.settlements.some(s => ids.includes(s.channelId) && s.collectedAt === null) && !m.video.conversions.some(c => c.productVersion === 'affiliate-tool-v1' && c.outcome === 'ordered' && m.video!.publications.some(p => p.id === c.sourceId && ids.includes(p.channelId))), 'VIDEO_UNSETTLED_OBLIGATIONS');
    }
    #routePreview(m: VideoContext, i: VideoIntent, definitionId: string, channelId: string, date: string) { const c = this.channel(m, channelId); return this.operations.inspectRouteJob(m, c.businessId, definitionId, resources(i.resources), string(i.startAt), date); }
    inspect(m: VideoContext & {
        readonly phase?: RuleModel['phase'];
    }, i: VideoIntent, date: string) {
        const s = stateOf(m);
        requireRule(m.phase === undefined || m.phase === 'playing' || ['ExitVideoCommission', 'AbandonVideoWork', 'UnlistVideo', 'CollectVideoSettlement', 'ReviewVideoOutput', 'ReworkVideo', 'PublishVideo', 'SubmitVideoCommission', 'NegotiateVideoCommission'].includes(i.kind), 'RUN_NOT_PLAYING');
        switch (i.kind) {
            case 'OpenVideoChannel': {
                requireRule(s.channels.length < 12, 'VIDEO_CHANNEL_LIMIT');
                const b = i.businessId === undefined ? m.operations?.businesses.find(b => b.definitionId === 'manual-content' && b.lifecycle === 'operating') : this.operations.business(m, string(i.businessId));
                if (b)
                    requireRule(b.route === 'ai_video' && b.lifecycle === 'operating', 'VIDEO_BUSINESS_NOT_ACTIVE');
                else
                    requireRule(!m.operations?.businesses.some(b => b.definitionId === 'manual-content' && b.lifecycle !== 'closed') && accountFunds(m.economy.ledger, 'personal').availableFen >= 50000, 'VIDEO_STARTUP_UNAVAILABLE');
                break;
            }
            case 'StartVideoWork': {
                this.#active(m, string(i.channelId));
                requireRule(s.works.length < 240, 'VIDEO_WORK_LIMIT');
                return this.#routePreview(m, i, productionId(string(i.productId), string(i.modeId), string(i.materialId)), string(i.channelId), date);
            }
            case 'StartVideoMarketing': {
                this.#active(m, string(i.channelId));
                requireRule(s.marketing.filter(x => x.channelId === i.channelId).length < 24, 'VIDEO_MARKETING_LIMIT');
                return this.#routePreview(m, i, 'video-marketing', string(i.channelId), date);
            }
            case 'ApplyVideoProgram': {
                const c = this.#active(m, string(i.channelId));
                const p = this.catalog.programs.find(p => p.id === i.program);
                requireRule(p && date >= p.from && (p.anchorId === null || m.world?.anchors.some(a => a.id === p.anchorId)), 'VIDEO_PROGRAM_NOT_AVAILABLE');
                requireRule(!this.permission(m, c.id, p.id, date) && !s.applications.some(a => a.channelId === c.id && a.program === p.id && (a.decidedAt === null || addDays(a.appliedAt, 90) > date)), 'VIDEO_PROGRAM_ALREADY_APPLIED');
                if (p.id === 'ads' || p.id === 'affiliate') {
                    const members = new Set(s.cohorts.filter(x => x.channelId === c.id).flatMap(c => c.members));
                    requireRule(s.publications.filter(p => p.channelId === c.id && p.measuredAt !== null).length >= 2 && members.size >= 50, 'VIDEO_PORTFOLIO_REQUIRED');
                }
                return this.#routePreview(m, i, p.jobId, c.id, date);
            }
            case 'DecideVideoProgram': {
                const a = s.applications.find(a => a.id === i.applicationId);
                requireRule(a && a.decidedAt !== null && this.#jobDone(m, a.jobId), 'VIDEO_APPLICATION_NOT_READY');
                break;
            }
            case 'ReviewVideoOutput': {
                const w = this.work(m, string(i.workId));
                requireRule(w.abandonedAt === null && this.#jobDone(m, w.jobId) && w.correctionJobs.every(j => this.#jobDone(m, j)), 'VIDEO_OUTPUT_NOT_READY');
                requireRule(!w.defect || w.qualityCorrectionJobs.length > 0, 'VIDEO_CORRECTION_REQUIRED');
                requireRule(i.disclosure === (w.modeId === 'manual' ? 'manual' : w.modeId === 'image_assisted' ? 'ai_assisted' : 'synthetic'), 'VIDEO_DISCLOSURE_REQUIRED');
                requireRule(w.reviewedVersion !== w.version, 'VIDEO_ALREADY_REVIEWED');
                break;
            }
            case 'ReworkVideo': {
                const w = this.work(m, string(i.workId));
                requireRule(w.abandonedAt === null && this.#jobDone(m, w.jobId) && w.correctionJobs.every(j => this.#jobDone(m, j)) && !s.publications.some(p => p.workId === w.id), 'VIDEO_REWORK_UNAVAILABLE');
                const c = w.contractId === null ? null : this.contract(m, w.contractId);
                requireRule((c?.status === 'revision' && c.revisions < c.requiredRevisions) || ((c === null || c.status === 'production') && w.defect && w.qualityCorrectionJobs.length === 0), 'VIDEO_REWORK_NOT_REQUESTED');
                requireRule(w.version < 10, 'VIDEO_REWORK_LIMIT');
                if (c)
                    requireRule(addDays(string(i.startAt), 7) <= c.dueAt, 'VIDEO_DEADLINE_MISSED');
                return this.#routePreview(m, i, 'video-rework', w.channelId, date);
            }
            case 'PublishVideo': {
                const w = this.work(m, string(i.workId));
                requireRule(date < this.catalog.labelEffectiveAt || w.modeId === 'manual' || i.label === true, 'VIDEO_2025_LABEL_REQUIRED');
                this.#active(m, w.channelId);
                requireRule(w.contractId === null && w.abandonedAt === null && w.reviewedVersion === w.version && w.disclosure !== null && this.#jobDone(m, w.jobId) && w.correctionJobs.every(j => this.#jobDone(m, j)) && !s.publications.some(p => p.workId === w.id), 'VIDEO_NOT_PUBLISHABLE');
                break;
            }
            case 'UnlistVideo': {
                requireRule(s.publications.some(p => p.id === i.publicationId && p.unlistedAt === null), 'VIDEO_PUBLICATION_NOT_ACTIVE');
                break;
            }
            case 'AcceptVideoCommission': {
                const c = this.#active(m, string(i.channelId));
                const cohort = s.cohorts.find(x => x.id === i.cohortId && x.channelId === c.id);
                requireRule(cohort && cohort.qualifiedMembers.includes(string(i.clientId)), 'VIDEO_CLIENT_NOT_QUALIFIED');
                requireRule(!s.conversions.some(x => x.personId === i.clientId && x.productVersion === 'commercial-v1'), 'AUDIENCE_ALREADY_CONVERTED');
                requireRule(addDays(string(i.startAt), this.operations.catalog.jobs.find(j => j.id === productionId('commercial', string(i.modeId), string(i.materialId)))?.durationDays ?? 999) <= addDays(date, this.catalog.commercial.deadlineDays), 'VIDEO_DEADLINE_MISSED');
                return this.#routePreview(m, i, productionId('commercial', string(i.modeId), string(i.materialId)), c.id, date);
            }
            case 'SubmitVideoCommission': {
                const c = this.contract(m, string(i.contractId)), w = this.work(m, c.workId);
                requireRule(['production', 'revision'].includes(c.status) && date <= c.dueAt && w.reviewedVersion === w.version && w.version > c.submittedVersion && this.#jobDone(m, w.jobId) && w.correctionJobs.every(j => this.#jobDone(m, j)), 'VIDEO_DELIVERY_NOT_READY');
                break;
            }
            case 'NegotiateVideoCommission': {
                const c = this.contract(m, string(i.contractId));
                requireRule(c.status === 'revision' && c.revisions >= c.includedRevisions && !c.negotiated, 'VIDEO_NEGOTIATION_NOT_AVAILABLE');
                requireRule(addDays(string(i.startAt), 3) <= c.dueAt, 'VIDEO_DEADLINE_MISSED');
                return this.#routePreview(m, i, 'video-negotiate', c.channelId, date);
            }
            case 'ExitVideoCommission': {
                const c = this.contract(m, string(i.contractId));
                requireRule(!['delivered', 'settled', 'cancelled'].includes(c.status), 'VIDEO_CONTRACT_CANNOT_EXIT');
                break;
            }
            case 'CollectVideoSettlement': {
                const c = s.contracts.find(c => c.id === i.settlementId);
                const p = s.settlements.find(p => p.id === i.settlementId);
                requireRule((c?.status === 'delivered' && c.paymentAt !== null && c.paymentAt <= date) || (p && p.collectedAt === null && p.dueAt <= date), 'VIDEO_PAYMENT_NOT_DUE');
                break;
            }
            case 'AbandonVideoWork': {
                const w = this.work(m, string(i.workId));
                requireRule(w.contractId === null && w.abandonedAt === null && !s.publications.some(p => p.workId === w.id), 'VIDEO_WORK_CANNOT_ABANDON');
                break;
            }
            default: requireRule(false, 'UNKNOWN_VIDEO_COMMAND');
        }
        return emptyPreview();
    }
    #plan(m: RuleModel, i: VideoIntent, channelId: string, definitionId: string, id: string) { return this.operations.planRouteJob(m, this.channel(m, channelId).businessId, definitionId, resources(i.resources), string(i.startAt), id); }
    #newWork(m: RuleModel, i: VideoIntent, id: string, contractId: string | null): RuleModel { let next = this.#fact(m, id, m.timeline.cursor.date); const jobId = videoId('job', id); next = this.#plan(next, i, string(i.channelId), productionId(string(i.productId), string(i.modeId), string(i.materialId)), jobId); const factId = videoId('fact', id); const w: VideoWork = { id, channelId: string(i.channelId), productId: i.productId as VideoWork['productId'], modeId: i.modeId as VideoWork['modeId'], materialId: i.materialId as VideoWork['materialId'], jobId, contractId, createdAt: m.timeline.cursor.date, version: 1, reviewedVersion: 0, disclosure: null, factId, defect: this.qualityDefect(string(i.modeId), this.#roll(next, factId)), correctionJobs: [], qualityCorrectionJobs: [], abandonedAt: null }; return this.#patch(next, { works: [...stateOf(next).works, w] }); }
    apply(m: RuleModel, i: VideoIntent, commandId: string): RuleModel {
        const date = m.timeline.cursor.date;
        this.inspect(m, i, date);
        let next = m;
        const s = stateOf(m), id = videoId(commandId, i.kind);
        switch (i.kind) {
            case 'OpenVideoChannel': {
                let b = i.businessId === undefined ? m.operations?.businesses.find(b => b.definitionId === 'manual-content' && b.lifecycle === 'operating') : this.operations.business(m, string(i.businessId));
                if (!b) {
                    next = this.operations.apply(next, { kind: 'DiscoverBusiness', definitionId: 'manual-content' }, `${commandId}:discover`);
                    b = next.operations!.businesses.at(-1)!;
                    next = this.operations.apply(next, { kind: 'PrepareBusiness', businessId: b.id }, `${commandId}:prepare`);
                    next = this.operations.apply(next, { kind: 'ActivateBusiness', businessId: b.id }, `${commandId}:activate`);
                }
                next = this.#patch(next, { channels: [...s.channels, { id, businessId: b.id, name: string(i.name), segment: i.segment as VideoState['channels'][number]['segment'], createdAt: date, reputation: 50 }] });
                break;
            }
            case 'StartVideoWork':
                next = this.#newWork(next, i, id, null);
                break;
            case 'StartVideoMarketing':
                next = this.#fact(next, id, date);
                next = this.#plan(next, i, string(i.channelId), 'video-marketing', videoId('job', id));
                next = this.#patch(next, { marketing: [...s.marketing, { id, channelId: string(i.channelId), jobId: videoId('job', id), factId: videoId('fact', id), cohortId: null, completedAt: null }] });
                break;
            case 'ApplyVideoProgram': {
                const p = this.catalog.programs.find(p => p.id === i.program)!;
                next = this.#fact(next, id, date);
                next = this.#plan(next, i, string(i.channelId), p.jobId, videoId('job', id));
                next = this.#patch(next, { applications: [...s.applications, { id, channelId: string(i.channelId), program: p.id, jobId: videoId('job', id), factId: videoId('fact', id), appliedAt: date, decidedAt: null, approved: null, expiresAt: null }] });
                break;
            }
            case 'DecideVideoProgram': {
                const a = s.applications.find(a => a.id === i.applicationId)!;
                next = { ...next, ...revealFact(next, a.factId, a.approved ? '本局虚构审核通过；不代表现实资格' : '本局虚构审核未通过，可在90天后重新投入申请') };
                break;
            }
            case 'ReviewVideoOutput': {
                const w = this.work(next, string(i.workId));
                next = this.#patch(next, { works: s.works.map(old => old.id === w.id ? { ...old, reviewedVersion: old.version, disclosure: i.disclosure as VideoWork['disclosure'] } : old) });
                next = { ...next, ...revealFact(next, w.factId, '人工复核完成；材料来源和AI使用说明已记录') };
                break;
            }
            case 'ReworkVideo': {
                const w = this.work(next, string(i.workId));
                const quality = w.defect && w.qualityCorrectionJobs.length === 0;
                next = this.#plan(next, i, w.channelId, 'video-rework', videoId('job', id));
                next = this.#patch(next, { works: s.works.map(old => old.id === w.id ? { ...old, version: old.version + 1, reviewedVersion: 0, disclosure: null, correctionJobs: [...old.correctionJobs, videoId('job', id)], qualityCorrectionJobs: quality ? [...old.qualityCorrectionJobs, videoId('job', id)] : old.qualityCorrectionJobs } : old), contracts: s.contracts.map(c => c.id === w.contractId ? { ...c, status: 'production', revisions: c.revisions + (quality ? 0 : 1) } : c) });
                break;
            }
            case 'PublishVideo': {
                const w = this.work(next, string(i.workId));
                next = this.#fact(next, id, date);
                const permission = i.monetization === 'none' ? undefined : this.permission(next, w.channelId, string(i.monetization), date);
                const measureAt = addDays(date, 7);
                next = this.#patch(next, { publications: [...s.publications, { id, workId: w.id, channelId: w.channelId, publishedAt: date, measureAt, monetization: i.monetization as VideoState['publications'][number]['monetization'], labelAttached: i.label === true, retentionBps: 0, qualified: permission !== undefined && permission.expiresAt !== null && measureAt < permission.expiresAt, permissionId: permission !== undefined && permission.expiresAt !== null && measureAt < permission.expiresAt ? permission.id : null, factId: videoId('fact', id), measuredAt: null, unlistedAt: null, views: 0, followers: 0, qualifiedInquiries: 0, cohortId: null, settlementId: null }] });
                next = this.#queue(next, this.#event('metrics', id, measureAt));
                break;
            }
            case 'UnlistVideo':
                next = this.#patch(next, { publications: s.publications.map(p => p.id === i.publicationId ? { ...p, unlistedAt: date } : p) });
                break;
            case 'AcceptVideoCommission': {
                const terms = this.catalog.commercial;
                const workId = videoId('work', id), channel = this.channel(next, string(i.channelId)), b = this.operations.business(next, channel.businessId);
                next = this.#fact(next, id, date);
                next = this.#newWork(next, { ...i, productId: 'commercial' }, workId, id);
                if (terms.prepaymentFen > 0)
                    next = this.#post(next, { id: videoId('prepay', id), sourceEventId: id, date, kind: 'receive_prepayment', accountId: b.accountId, counterpartyId: 'world', businessId: b.id, contractId: id, reservationId: videoId('protection', id), amountFen: terms.prepaymentFen });
                const c: VideoContract = { id, channelId: channel.id, clientId: string(i.clientId), cohortId: string(i.cohortId), productVersion: 'commercial-v1', priceFen: terms.priceFen, prepaymentFen: terms.prepaymentFen, feeBps: terms.feeBps, acceptedAt: date, dueAt: addDays(date, terms.deadlineDays), workId, status: 'production', requiredRevisions: this.revisionsFor(this.#roll(next, videoId('fact', id))), revisions: 0, includedRevisions: terms.includedRevisions, submittedVersion: 0, reviewSequence: 0, submittedAt: null, reviewedAt: null, settledAt: null, paymentAt: null, feePosted: false, negotiationJobId: null, negotiationFactId: null, negotiation: null, negotiated: false, negotiationOutcome: null, factId: videoId('fact', id) };
                next = this.#patch(next, { contracts: [...s.contracts, c], conversions: [...s.conversions, { id: videoId('conversion', id), personId: c.clientId, productVersion: c.productVersion, sourceId: id, date, outcome: 'ordered' }] });
                next = this.#queue(next, this.#event('deadline', id, addDays(c.dueAt, 1)));
                break;
            }
            case 'SubmitVideoCommission': {
                const c = this.contract(next, string(i.contractId)), w = this.work(next, c.workId);
                next = this.#patch(next, { contracts: s.contracts.map(old => old.id === c.id ? { ...old, status: 'review', submittedVersion: w.version, reviewSequence: old.reviewSequence + 1, submittedAt: date } : old) });
                next = this.#queue(next, this.#event('customer', c.id, addDays(date, this.catalog.commercial.reviewDays), c.reviewSequence + 1));
                break;
            }
            case 'NegotiateVideoCommission': {
                const c = this.contract(next, string(i.contractId));
                next = this.#fact(next, id, date);
                next = this.#plan(next, i, c.channelId, 'video-negotiate', videoId('job', id));
                next = this.#patch(next, { contracts: s.contracts.map(old => old.id === c.id ? { ...old, status: 'negotiating', negotiated: true, negotiationJobId: videoId('job', id), negotiationFactId: videoId('fact', id), negotiation: i.proposal as VideoContract['negotiation'] } : old) });
                break;
            }
            case 'ExitVideoCommission':
                next = this.#exit(next, this.contract(next, string(i.contractId)), date, id);
                break;
            case 'CollectVideoSettlement':
                next = this.#collect(next, string(i.settlementId), date);
                break;
            case 'AbandonVideoWork': {
                const w = this.work(next, string(i.workId));
                for (const jobId of [w.jobId, ...w.correctionJobs])
                    if (next.operations?.jobs.some(j => j.id === jobId && ['planned', 'running'].includes(j.status)))
                        next = this.operations.apply(next, { kind: 'InterruptJob', jobId }, `${commandId}:${jobId}`);
                next = this.#patch(next, { works: s.works.map(old => old.id === w.id ? { ...old, abandonedAt: date } : old) });
                break;
            }
        }
        next = this.#log(next, id, date, id, `视频决策：${i.kind}`);
        const gap = next.economy.ledger.obligations.find(o => o.remainingFen > 0 && !m.economy.ledger.obligations.some(old => old.id === o.id && old.remainingFen > 0));
        if (gap && next.timeline.pause === null)
            next = { ...next, timeline: { ...next.timeline, pause: { instanceId: gap.originOperationId, reason: 'CASH_SHORTFALL', source: 'command' } } };
        return next;
    }
    audiencePlan(m: VideoContext, sourceId: string, roll: number, marketing: boolean) { const publication = stateOf(m).publications.find(p => p.id === sourceId); const original = !marketing && stateOf(m).works.some(w => w.id === publication?.workId && w.productId === 'original_series'); return { memberCount: marketing ? 80 : (original ? 110 : 60) + roll % 61, qualificationStride: original ? 5 : 10 }; }
    audienceMembers(m: VideoContext, segment: string, offset: number, count: number): string[] { return Array.from({ length: Math.min(240, count) }, (_, n) => videoId('person', stateOf(m).audienceKey, segment, String((n + offset) % 240))); }
    #cohort<T extends OperatingModel>(m: T, channelId: string, sourceId: string, date: string, roll: number, marketing: boolean): {
        state: T;
        cohort: VideoState['cohorts'][number];
    } { const c = this.channel(m, channelId); const plan = this.audiencePlan(m, sourceId, roll, marketing); const members = this.audienceMembers(m, c.segment, roll % 240, plan.memberCount); const qualified = marketing ? (BigInt(roll) * 10000n < BigInt(this.catalog.marketingMatchBps) * 4294967296n ? members.slice(0, 3) : members.slice(0, 1)) : members.filter((_, n) => n % plan.qualificationStride === 0); const cohort = { id: videoId('cohort', sourceId), channelId, sourceId, date, segment: c.segment, members, qualifiedMembers: qualified }; return { state: this.#patch(m, { cohorts: [...stateOf(m).cohorts, cohort] }), cohort }; }
    sync<T extends OperatingModel>(m: T, date: string): T {
        if (!m.video)
            return m;
        let next = m;
        for (const a of stateOf(next).applications.filter(a => a.decidedAt === null && next.operations?.jobs.some(j => j.id === a.jobId && ['interrupted', 'cancelled'].includes(j.status))))
            next = this.#patch(next, { applications: stateOf(next).applications.map(old => old.id === a.id ? { ...old, decidedAt: date, approved: false, expiresAt: null } : old) });
        for (const a of stateOf(next).applications.filter(a => a.decidedAt === null && this.#jobDone(next, a.jobId))) {
            const job = next.operations!.jobs.find(j => j.id === a.jobId)!;
            const approved = BigInt(this.#roll(next, a.factId)) * 10000n < BigInt(this.catalog.applicationAcceptBps) * 4294967296n;
            next = this.#patch(next, { applications: stateOf(next).applications.map(old => old.id === a.id ? { ...old, decidedAt: job.completeAt, approved, expiresAt: approved ? addDays(job.completeAt, 365) : null } : old) });
        }
        for (const item of stateOf(next).marketing.filter(x => x.completedAt === null && this.#jobDone(next, x.jobId))) {
            const result = this.#cohort(next, item.channelId, item.id, date, this.#roll(next, item.factId), true);
            next = this.#patch(result.state, { marketing: stateOf(result.state).marketing.map(x => x.id === item.id ? { ...x, completedAt: date, cohortId: result.cohort.id } : x) });
            next = { ...next, ...revealFact(next, item.factId, '营销结束，合格询价已入受众库；尚无收入') };
            next = this.#log(next, videoId('marketing-complete', item.id), date, item.id, '营销完成，播放/询价不等于收入');
        }
        for (const c of stateOf(next).contracts.filter(c => c.status === 'negotiating' && c.negotiationJobId !== null && this.#jobDone(next, c.negotiationJobId))) {
            const accepted = this.#roll(next, c.negotiationFactId!) % 4 !== 0;
            next = this.#patch(next, { contracts: stateOf(next).contracts.map(old => old.id === c.id ? { ...old, status: 'revision', negotiationOutcome: accepted ? 'accepted' : 'rejected', priceFen: accepted && c.negotiation === 'price' ? old.priceFen + 30000 : old.priceFen, requiredRevisions: accepted && c.negotiation === 'scope' ? old.revisions : old.requiredRevisions, submittedVersion: accepted && c.negotiation === 'scope' ? 0 : old.submittedVersion, submittedAt: accepted && c.negotiation === 'scope' ? null : old.submittedAt } : old) });
            next = { ...next, ...revealFact(next, c.negotiationFactId!, accepted ? '客户接受本次条款谈判' : '客户拒绝修改条款；仍可返工或退出') };
            next = this.#log(next, videoId('negotiated', c.id), date, c.id, accepted ? '客户条款已调整' : '客户条款谈判失败，原义务保留');
        }
        for (const c of stateOf(next).contracts.filter(c => c.status === 'negotiating' && c.negotiationJobId !== null && next.operations?.jobs.some(j => j.id === c.negotiationJobId && ['interrupted', 'cancelled'].includes(j.status))))
            next = this.#patch(next, { contracts: stateOf(next).contracts.map(old => old.id === c.id ? { ...old, status: 'revision', negotiationOutcome: 'interrupted' } : old) });
        return next;
    }
    #exit<T extends OperatingModel>(m: T, c: VideoContract, date: string, id: string): T {
        let next = m;
        const w = this.work(m, c.workId);
        for (const jobId of [w.jobId, ...w.correctionJobs, c.negotiationJobId].filter((j): j is string => j !== null)) {
            const job = next.operations?.jobs.find(j => j.id === jobId);
            if (job && ['planned', 'running'].includes(job.status)) {
                const actionOp: EconomyOperation = { id: videoId('interrupt', id, jobId), sourceEventId: jobId, date, kind: job.status === 'planned' ? 'cancel_action' : 'interrupt_action', actionId: job.actionId };
                next = this.#post(next, actionOp);
                next = { ...next, operations: { ...next.operations!, jobs: next.operations!.jobs.map(j => j.id === job.id ? { ...j, status: job.status === 'planned' ? 'cancelled' : 'interrupted', releasedAt: date } : j) } };
            }
        }
        const b = this.operations.business(next, this.channel(next, c.channelId).businessId), balance = next.economy.ledger.contracts.find(x => x.id === c.id);
        if (balance && balance.prepaidFen > 0)
            next = this.#post(next, { id: videoId('refund', id), sourceEventId: c.id, date, kind: 'refund_undelivered', accountId: b.accountId, businessId: b.id, contractId: c.id, amountFen: balance.prepaidFen, obligationId: videoId('refund-due', id), referenceId: videoId('prepay', c.id) });
        return this.#patch(next, { contracts: stateOf(next).contracts.map(old => old.id === c.id ? { ...old, status: 'cancelled', negotiationOutcome: old.negotiationJobId !== null && next.operations?.jobs.some(j => j.id === old.negotiationJobId && ['interrupted', 'cancelled'].includes(j.status)) ? 'interrupted' : old.negotiationOutcome } : old), channels: stateOf(next).channels.map(ch => ch.id === c.channelId ? { ...ch, reputation: Math.max(0, ch.reputation - 5) } : ch) });
    }
    #collect<T extends OperatingModel>(m: T, id: string, date: string): T {
        const s = stateOf(m), c = s.contracts.find(c => c.id === id), p = s.settlements.find(p => p.id === id);
        requireRule((c?.status === 'delivered' && c.paymentAt !== null && date >= c.paymentAt) || (p && p.collectedAt === null && date >= p.dueAt), 'VIDEO_PAYMENT_NOT_DUE');
        const channel = this.channel(m, c?.channelId ?? p!.channelId), b = this.operations.business(m, channel.businessId), balance = contractBalance(m.economy.ledger, id);
        let next = m;
        if (balance.receivableFen > 0)
            next = this.#post(next, { id: videoId('collect', id), sourceEventId: id, date, kind: 'collect_receivable', accountId: b.accountId, businessId: b.id, contractId: id, amountFen: balance.receivableFen });
        const fee = c ? Number(BigInt(c.priceFen) * BigInt(c.feeBps) / 10000n) : p!.feeFen;
        if (fee > 0)
            next = this.#post(next, { id: videoId('fee', id), sourceEventId: id, date, kind: 'due_expense', accountId: b.accountId, businessId: b.id, counterpartyId: 'world', obligationId: videoId('fee-due', id), amountFen: fee });
        return this.#patch(next, { contracts: stateOf(next).contracts.map(old => old.id === id ? { ...old, status: 'settled', settledAt: date, feePosted: true } : old), settlements: stateOf(next).settlements.map(old => old.id === id ? { ...old, collectedAt: date } : old) });
    }
    #recognize<T extends OperatingModel>(m: T, p: VideoState['publications'][number], kind: 'ads' | 'affiliate', amountFen: number, gmv: number, retained: number, returned: number, date: string): {
        state: T;
        event: ScheduledEvent<RunOperation> | null;
    } {
        if (amountFen === 0)
            return { state: m, event: null };
        const id = videoId('settlement', p.id), channel = this.channel(m, p.channelId), b = this.operations.business(m, channel.businessId), dueAt = addDays(date, 14), feeFen = Number(BigInt(amountFen) * BigInt(this.catalog.platformFeeBps) / 10000n);
        let next = this.#post(m, { id: videoId('credit', id), sourceEventId: id, date, kind: 'deliver_on_credit', accountId: b.accountId, businessId: b.id, contractId: id, counterpartyId: 'world', amountFen });
        next = this.#patch(next, { settlements: [...stateOf(next).settlements, { id, channelId: p.channelId, publicationId: p.id, kind, grossMerchandiseFen: gmv, amountFen, feeFen, confirmedAt: date, dueAt, collectedAt: null, retained, returned }], publications: stateOf(next).publications.map(old => old.id === p.id ? { ...old, settlementId: id } : old) });
        return { state: next, event: this.#event('collect', id, dueAt) };
    }
    reduce(m: OperatingModel, event: ScheduledEvent<RunOperation>) {
        const op = event.payload;
        requireRule(op.kind === 'video_event', 'INVALID_VIDEO_EVENT');
        let next = m;
        const s = stateOf(m), date = event.date, newEvents: ScheduledEvent<RunOperation>[] = [];
        let skippedReason: string | undefined;
        if (op.type === 'metrics') {
            const p = s.publications.find(p => p.id === op.entityId);
            requireRule(p && p.measureAt === date && p.measuredAt === null, 'INVALID_VIDEO_MEASUREMENT');
            const w = this.work(next, p.workId), roll = this.#roll(next, p.factId);
            const visibleDays = p.unlistedAt === null ? 7 : Array.from({ length: 7 }, (_, n) => addDays(p.publishedAt, n)).filter(day => day < p.unlistedAt!).length;
            const views = Math.floor((w.productId === 'hotspot' ? 5000 + roll % 20000 : 1000 + roll % 5000) * visibleDays / 7);
            let cohort: VideoState['cohorts'][number] | null = null;
            if (views > 0) {
                const result = this.#cohort(next, p.channelId, p.id, date, roll, false);
                next = result.state;
                cohort = result.cohort;
            }
            next = this.#patch(next, { publications: stateOf(next).publications.map(old => old.id === p.id ? { ...old, measuredAt: date, views, retentionBps: views === 0 ? 0 : w.productId === 'original_series' ? 6000 + roll % 3001 : 2000 + roll % 4001, followers: cohort?.members.length ?? 0, qualifiedInquiries: cohort?.qualifiedMembers.length ?? 0, cohortId: cohort?.id ?? null } : old) });
            if (p.qualified && p.monetization === 'ads') {
                const result = this.#recognize(next, p, 'ads', Math.floor(views / 100) * 100, 0, 0, 0, date);
                next = result.state;
                if (result.event)
                    newEvents.push(result.event);
            }
            if (p.qualified && p.monetization === 'affiliate' && cohort) {
                const eligible = cohort.qualifiedMembers.filter(personId => !stateOf(next).conversions.some(x => x.personId === personId && x.productVersion === 'affiliate-tool-v1'));
                next = this.#patch(next, { conversions: [...stateOf(next).conversions, ...eligible.map(personId => ({ id: videoId('conversion', p.id, personId), personId, productVersion: 'affiliate-tool-v1', sourceId: p.id, date, outcome: 'ordered' as const }))] });
                newEvents.push(this.#event('affiliate_close', p.id, addDays(date, 7)));
            }
            next = { ...next, ...revealFact(next, p.factId, `播放${views}；本次发布收益资格${p.qualified ? '有效' : '无'}；平台规则为本局虚构条款`) };
        }
        if (op.type === 'affiliate_close') {
            const p = s.publications.find(p => p.id === op.entityId);
            requireRule(p && p.measuredAt !== null && date === addDays(p.measuredAt, 7), 'INVALID_VIDEO_RETURN_WINDOW');
            const sales = s.conversions.filter(c => c.sourceId === p.id && c.outcome === 'ordered');
            const returned = sales.filter(c => parseInt(hashValue([c.personId, p.factId]).slice(0, 8), 16) % 4 === 0).length, retained = sales.length - returned;
            next = this.#patch(next, { conversions: s.conversions.map(c => c.sourceId === p.id && c.outcome === 'ordered' ? { ...c, outcome: parseInt(hashValue([c.personId, p.factId]).slice(0, 8), 16) % 4 === 0 ? 'returned' : 'retained' } : c) });
            const result = this.#recognize(next, p, 'affiliate', retained * this.catalog.affiliateCommissionFen, sales.length * this.catalog.affiliateUnitPriceFen, retained, returned, date);
            next = result.state;
            if (result.event)
                newEvents.push(result.event);
        }
        if (op.type === 'customer') {
            const c = s.contracts.find(c => c.id === op.entityId);
            requireRule(c, 'VIDEO_CONTRACT_NOT_FOUND');
            if (c.status === 'cancelled' || op.version !== c.reviewSequence)
                skippedReason = 'VIDEO_REVIEW_SUPERSEDED';
            else {
                requireRule(c.status === 'review' && c.submittedAt !== null && date === addDays(c.submittedAt, this.catalog.commercial.reviewDays), 'INVALID_VIDEO_CUSTOMER_REVIEW');
                if (c.revisions < c.requiredRevisions) {
                    next = this.#patch(next, { contracts: s.contracts.map(old => old.id === c.id ? { ...old, status: 'revision', reviewedAt: date } : old) });
                    if (date > c.dueAt) {
                        next = this.#exit(next, this.contract(next, c.id), date, event.instanceId);
                        next = this.#log(next, videoId('late-review-exit', event.instanceId), date, c.id, '客户仍要求修改且最晚提交日已过，按原条款退款退出');
                    }
                }
                else {
                    const b = this.operations.business(next, this.channel(next, c.channelId).businessId);
                    if (c.prepaymentFen > 0)
                        next = this.#post(next, { id: videoId('deliver-prepay', c.id), sourceEventId: c.id, date, kind: 'deliver_prepaid', accountId: b.accountId, businessId: b.id, contractId: c.id, amountFen: c.prepaymentFen });
                    if (c.priceFen > c.prepaymentFen)
                        next = this.#post(next, { id: videoId('credit', c.id), sourceEventId: c.id, date, kind: 'deliver_on_credit', accountId: b.accountId, businessId: b.id, contractId: c.id, counterpartyId: 'world', amountFen: c.priceFen - c.prepaymentFen });
                    const paymentAt = addDays(date, this.catalog.commercial.paymentDays);
                    next = this.#patch(next, { contracts: stateOf(next).contracts.map(old => old.id === c.id ? { ...old, status: 'delivered', reviewedAt: date, paymentAt } : old), channels: stateOf(next).channels.map(ch => ch.id === c.channelId ? { ...ch, reputation: Math.min(100, ch.reputation + 2) } : ch) });
                    newEvents.push(this.#event('collect', c.id, paymentAt));
                }
                next = { ...next, ...revealFact(next, c.factId, `客户条款固定：包含${c.includedRevisions}轮修改；后续按本次任务与条款复核`) };
            }
        }
        if (op.type === 'deadline') {
            const c = s.contracts.find(c => c.id === op.entityId);
            requireRule(c && date === addDays(c.dueAt, 1), 'INVALID_VIDEO_DEADLINE');
            if (['delivered', 'settled', 'cancelled'].includes(c.status))
                skippedReason = 'VIDEO_CONTRACT_FINISHED';
            else if (c.status === 'review' && c.submittedAt !== null && c.submittedAt <= c.dueAt)
                skippedReason = 'VIDEO_REVIEW_IN_PROGRESS';
            else
                next = this.#exit(next, c, date, event.instanceId);
        }
        if (op.type === 'collect') {
            const c = s.contracts.find(c => c.id === op.entityId), p = s.settlements.find(p => p.id === op.entityId);
            if (c?.status === 'settled' || p?.collectedAt !== null && p !== undefined)
                skippedReason = 'VIDEO_ALREADY_COLLECTED';
            else
                next = this.#collect(next, op.entityId, date);
        }
        next = this.#log(next, event.instanceId, date, op.entityId, `视频进展：${skippedReason ?? op.type}`);
        const gap = next.economy.ledger.obligations.some(o => o.remainingFen > 0 && !m.economy.ledger.obligations.some(old => old.id === o.id && old.remainingFen > 0));
        return { state: next, newEvents, ...(skippedReason ? { skippedReason } : {}), ...(gap ? { pauseReason: 'CASH_SHORTFALL' } : {}) };
    }
}
export { videoStateSchema };
