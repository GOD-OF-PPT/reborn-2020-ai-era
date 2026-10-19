import { createCampaignRun, createCampaignCodec, campaignRuntime } from '../application/campaign.ts';
import { evaluateCommand } from '../core/commands.ts';
import { addDays, quarterOf } from '../core/calendar.ts';
import { quarterLimit, dayBefore } from '../core/operations-calendar.ts';
import { accountFunds } from '../core/ledger.ts';
/** No fixture funds, no injected access; ordinary employment pays actual living costs. */
export function replayNormalVideo(backgroundId: string) {
    const codec = createCampaignCodec(), input = { runId: `normal-video-${backgroundId}`, actorId: 'player', commandId: 'create', backgroundId, seed: 'normal-video-access-v1' };
    let run = createCampaignRun(input);
    const initial = run, commands: unknown[] = [];
    function send(kind: string, payload: unknown) {
        const command = { runId: run.runId, actorId: 'player', commandId: `normal-video-${run.revision}`, expectedRevision: run.revision, kind, payload };
        const result = evaluateCommand(run, command, codec.registry, 'player');
        if (result.status !== 'proposed')
            throw new Error(JSON.stringify({ kind, payload, result }));
        commands.push(command);
        run = codec.import(codec.export(result.nextRun));
    }
    function advance(target: string) {
        for (let n = 0; n < 100; n++) {
            if (run.timeline.pause) {
                if (run.timeline.pause.reason !== 'CONTENT_DECISION_PENDING')
                    throw new Error('normal video path unexpectedly short of cash');
                const event = run.world!.instances.find(i => i.openedBy === run.timeline.pause?.instanceId)!;
                send('ChooseEvent', { instanceId: event.id, choiceId: campaignRuntime.definition(event.definitionId).defaultChoiceId });
            }
            else if (run.timeline.cursor.date < target || run.timeline.cursor.phase !== 'snapshot')
                send('AdvanceTime', { date: target });
            else
                return;
        }
        throw new Error('normal advance guard');
    }
    send('WorkQuarter', {});
    send('OpenVideoChannel', { name: '普通上班族的AI观察', segment: 'ai_learners' });
    const channel = run.video!.channels[0]!;
    send('StartVideoWork', { channelId: channel.id, productId: 'hotspot', modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: '2020-01-01' });
    advance('2020-01-08');
    send('ReviewVideoOutput', { workId: run.video!.works[0]!.id, disclosure: 'manual' });
    send('PublishVideo', { workId: run.video!.works[0]!.id, monetization: 'ads' });
    advance('2020-01-15');
    while (quarterOf(run.timeline.cursor.date) !== '2023-Q1') {
        advance(dayBefore(quarterLimit(run.timeline.cursor.date)));
        advance(quarterLimit(run.timeline.cursor.date));
        send('WorkQuarter', {});
    }
    advance('2023-01-02');
    send('ApplyVideoProgram', { channelId: channel.id, program: 'image_rights', resources: ['player-production'], startAt: run.timeline.cursor.date });
    advance('2023-01-09');
    send('DecideVideoProgram', { applicationId: run.video!.applications.at(-1)!.id });
    const approval = run.video!.applications.at(-1)!;
    if (!approval.approved)
        throw new Error('fixed full-path seed approval failed; retain this result rather than substitute a seed');
    send('StartVideoWork', { channelId: channel.id, productId: 'original_series', modeId: 'image_assisted', materialId: 'licensed', resources: ['player-production'], startAt: run.timeline.cursor.date });
    advance('2023-01-16');
    const work = run.video!.works.at(-1)!;
    if (work.defect) {
        advance('2023-04-01');
        send('ReworkVideo', { workId: work.id, resources: ['player-production'], startAt: '2023-04-01' });
        advance('2023-04-08');
    }
    send('ReviewVideoOutput', { workId: work.id, disclosure: 'ai_assisted' });
    send('PublishVideo', { workId: work.id, monetization: 'none' });
    advance(addDays(run.timeline.cursor.date, 7));
    return { initial, run, commands, seed: input.seed, versions: run.versions, result: { origin: run.origin, backgroundId, cashFen: accountFunds(run.economy.ledger, 'personal').cashFen, granted: approval.approved, videoWorks: run.video!.works.length, publications: run.video!.publications.length, salaryPayments: run.operations!.payroll.filter(p => p.kind === 'salary' && p.amountFen > 0).length, firstPublicationIncomeFen: run.video!.publications[0]!.settlementId === null ? 0 : -1 } };
}
