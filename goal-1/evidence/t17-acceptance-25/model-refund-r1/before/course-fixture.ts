import { COURSE_CONTENT } from '../content/course.ts';
import { CAMPAIGN_CONTENT } from '../content/campaign.ts';
import { OPERATIONS_CONTENT } from '../content/operations.ts';
import { composeCampaignRuntime, createCampaignRegistry } from '../application/campaign.ts';
import { createOperatingHandlers } from '../application/operations-commands.ts';
import { createVideoHandlers } from '../application/video-commands.ts';
import { createCourseHandlers } from '../application/course-commands.ts';
import { createFirstOrderHandler } from '../application/first-order.ts';
import { createGameRun } from '../core/run.ts';
import { createLedger, applyLedger } from '../core/ledger.ts';
import { createEconomy } from '../core/economy.ts';
import { createTimeline } from '../core/timeline.ts';
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts';
import { VIDEO_CONTENT } from '../content/video.ts';
import { hashValue } from '../core/hash.ts';
import { evaluateCommand, previewCommand } from '../core/commands.ts';
import { RunCodec } from '../persistence/codec.ts';
import type { RunOperation } from '../core/content-types.ts';
import type { CourseParameters } from '../core/course-schema.ts';
/** Explicit isolated preconditions: no living/salary/maintenance, image access must be earned through the video workflow.
 * Cases, video audiences and samples still have to be produced with real commands. */
export function createCourseFixture(options: {
    cashFen?: number;
    seed?: string;
    parameters?: CourseParameters;
    updates?: boolean;
} = {}) {
    const parameters = options.parameters ?? { matchBps: 10000, helpedBps: 10000, feeBps: 500 };
    const pack = { ...CAMPAIGN_CONTENT, anchors: CAMPAIGN_CONTENT.anchors.map(a => ({ ...a, enabled: a.enabled && (options.updates === true || !COURSE_CONTENT.updateAnchorIds.some(id => id === a.id)) })), calendar: [], initialEntitlements: CAMPAIGN_CONTENT.initialEntitlements };
    const catalog = { ...OPERATIONS_CONTENT, businesses: OPERATIONS_CONTENT.businesses.map(b => b.id === 'course-studio' ? { ...b, company: false, minCashFen: 0, monthlyMaintenanceFen: 0 } : b) };
    const composition = composeCampaignRuntime(pack, catalog, undefined, { commercial: VIDEO_CONTENT.commercial, qualityDefectBps: 0, marketingMatchBps: 10000, applicationAcceptBps: 10000, revisionCount: 0 }, parameters), { runtime, operations } = composition, video = composition.video!, course = composition.course!;
    const input = { runId: 'course-fixture', actorId: 'player', commandId: 'fixture-create', backgroundId: 'technical_employee', seed: options.seed ?? 'course-fixture-v1' }, world = runtime.initialWorld([{ id: 'player', kind: 'player', accountId: 'personal', businessId: null, route: null, contractId: null, personId: null, capacityUnits: 1 }], input.backgroundId), opState = operations.initial(input.backgroundId), videoState = video.initial(input.seed), courseState = course.initial(), versions = { ...BOOTSTRAP_VERSIONS, rulesVersion: 'rules-t11-fixture-v1', contentVersion: 'course-fixture-v1', contentHash: hashValue({ world: runtime.pack, operations: operations.catalog, video: video.catalog, course: course.catalog }) };
    const ledger = applyLedger(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01'), { id: 'fixture:opening', sourceEventId: 'fixture:course', date: '2020-01-01', kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen: options.cashFen ?? 1955000 }), base = createGameRun(input, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: createEconomy(ledger), timeline: createTimeline<RunOperation>('2020-01-01'), world, operations: opState, video: videoState, course: courseState }, versions), model = operations.scheduleOffers(runtime.schedule(base)), run = createGameRun(input, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: model.economy, timeline: model.timeline, world, operations: opState, video: videoState, course: courseState }, versions);
    const registry = createCampaignRegistry(runtime, versions, [...createOperatingHandlers(operations), createFirstOrderHandler(operations, runtime), ...createVideoHandlers(video), ...createCourseHandlers(course)]), codec = new RunCodec(registry, ['technical_employee', 'content_employee']);
    let current = run;
    const commands: unknown[] = [];
    const command = (kind: string, payload: unknown) => ({ runId: current.runId, actorId: 'player', commandId: `course-${current.revision}`, expectedRevision: current.revision, kind, payload });
    function send(kind: string, payload: unknown) { const c = command(kind, payload), result = evaluateCommand(current, c, registry, 'player'); if (result.status !== 'proposed')
        throw new Error(JSON.stringify({ kind, payload, result })); commands.push(c); current = codec.import(codec.export(result.nextRun)); return current; }
    return { get run() { return current; }, initial: run, commands, send, preview: (kind: string, payload: unknown) => previewCommand(current, command(kind, payload), registry, 'player'), codec, registry, course, video, runtime, operations };
}
