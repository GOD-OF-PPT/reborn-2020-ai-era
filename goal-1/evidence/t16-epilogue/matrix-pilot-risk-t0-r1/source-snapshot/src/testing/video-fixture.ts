import { CAMPAIGN_CONTENT } from '../content/campaign.ts';
import { OPERATIONS_CONTENT } from '../content/operations.ts';
import { VIDEO_CONTENT } from '../content/video.ts';
import { composeCampaignRuntime, createCampaignRegistry } from '../application/campaign.ts';
import { createOperatingHandlers } from '../application/operations-commands.ts';
import { createVideoHandlers } from '../application/video-commands.ts';
import { createGameRun } from '../core/run.ts';
import { createLedger, applyLedger } from '../core/ledger.ts';
import { createEconomy } from '../core/economy.ts';
import { createTimeline } from '../core/timeline.ts';
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts';
import { hashValue } from '../core/hash.ts';
import { RunCodec } from '../persistence/codec.ts';
import { evaluateCommand } from '../core/commands.ts';
import type { GameRun } from '../core/run-types.ts';
import type { RunOperation } from '../core/content-types.ts';
import type { VideoParameters } from '../core/video-schema.ts';
export const VIDEO_FIXTURE_PARAMETERS: VideoParameters = { commercial: { ...VIDEO_CONTENT.commercial, prepaymentFen: 0 }, qualityDefectBps: VIDEO_CONTENT.qualityDefectBps, marketingMatchBps: 10000, applicationAcceptBps: 10000, revisionCount: 1 };
/** Independent F02 accounting fixture: no living costs, employment or unpaid staff. Not a normal start. */
export function createVideoFixture(options: {
    seed?: string;
    parameters?: VideoParameters;
    cashFen?: number;
} = {}) {
    const input = { runId: 'video-fixture', actorId: 'player', commandId: 'create-fixture', backgroundId: 'technical_employee', seed: options.seed ?? 'video-fixture-seed' };
    const { runtime, operations, video: optionalVideo } = composeCampaignRuntime({ ...CAMPAIGN_CONTENT, calendar: [] }, OPERATIONS_CONTENT, undefined, options.parameters ?? VIDEO_FIXTURE_PARAMETERS);
    const video = optionalVideo!;
    const versions = { ...BOOTSTRAP_VERSIONS, rulesVersion: 'rules-t10-fixture', contentVersion: 'video-fixture-v1', contentHash: hashValue({ world: runtime.pack, operations: operations.catalog, video: video.catalog }) };
    const world = runtime.initialWorld([{ id: 'player', kind: 'player', accountId: 'personal', businessId: null, route: null, contractId: null, personId: null, capacityUnits: 1 }], input.backgroundId), opState = operations.initial(input.backgroundId), videoState = video.initial(input.seed);
    const ledger = applyLedger(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01'), { id: 'fixture:opening', date: '2020-01-01', sourceEventId: 'fixture:video-f02', kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen: options.cashFen ?? 2000000 });
    const base = createGameRun(input, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: createEconomy(ledger), timeline: createTimeline<RunOperation>('2020-01-01'), world, operations: opState, video: videoState }, versions);
    const model = operations.scheduleOffers(runtime.schedule(base));
    const run = createGameRun(input, { origin: 'fixture', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: model.economy, timeline: model.timeline, world, operations: opState, video: videoState }, versions);
    const registry = createCampaignRegistry(runtime, versions, [...createOperatingHandlers(operations), ...createVideoHandlers(video)]), codec = new RunCodec(registry, ['technical_employee', 'content_employee']), commands: unknown[] = [];
    function apply(state: GameRun, kind: string, payload: unknown) {
        const command = { runId: state.runId, actorId: 'player', commandId: `vid-${state.revision}`, expectedRevision: state.revision, kind, payload };
        const result = evaluateCommand(state, command, registry, 'player');
        if (result.status !== 'proposed')
            throw new Error(JSON.stringify({ kind, payload, result }));
        commands.push(command);
        return codec.import(codec.export(result.nextRun));
    }
    return { run, apply, registry, codec, video, runtime, operations, commands };
}
