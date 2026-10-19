import { createVideoFixture } from './video-fixture.ts';
import { addDays } from '../core/calendar.ts';
import type { GameRun } from '../core/run-types.ts';
import { accountFunds, metricsFor } from '../core/ledger.ts';
export function replayVideoF02() {
    const f = createVideoFixture();
    let run = f.run;
    let beforeFirstCollection: GameRun | undefined;
    const start = f.codec.export(run), send = (kind: string, payload: unknown) => { run = f.apply(run, kind, payload); };
    send('OpenVideoChannel', { name: '本地店铺样片', segment: 'local_merchants' });
    const channel = run.video!.channels[0]!;
    send('StartVideoMarketing', { channelId: channel.id, resources: ['player-production'], startAt: '2020-01-01' });
    send('AdvanceTime', { date: '2020-01-08' });
    const cohort = run.video!.cohorts[0]!;
    for (let n = 0; n < 3; n++) {
        send('AcceptVideoCommission', { channelId: channel.id, cohortId: cohort.id, clientId: cohort.qualifiedMembers[n], modeId: 'manual', materialId: 'original', resources: ['player-production'], startAt: run.timeline.cursor.date });
        const contract = run.video!.contracts[n]!, work = run.video!.works.find(w => w.id === contract.workId)!;
        send('AdvanceTime', { date: run.operations!.jobs.find(j => j.id === work.jobId)!.completeAt });
        send('ReviewVideoOutput', { workId: work.id, disclosure: 'manual' });
        send('SubmitVideoCommission', { contractId: contract.id });
        send('AdvanceTime', { date: addDays(run.timeline.cursor.date, 2) });
        if (n === 1)
            send('AdvanceTime', { date: '2020-04-01' });
        send('ReworkVideo', { workId: work.id, resources: ['player-production'], startAt: run.timeline.cursor.date });
        send('AdvanceTime', { date: addDays(run.timeline.cursor.date, 7) });
        send('ReviewVideoOutput', { workId: work.id, disclosure: 'manual' });
        send('SubmitVideoCommission', { contractId: contract.id });
        send('AdvanceTime', { date: addDays(run.timeline.cursor.date, 2) });
        if (n === 0)
            beforeFirstCollection = run;
        send('AdvanceTime', { date: addDays(run.timeline.cursor.date, 7) });
    }
    return { f, run, beforeFirstCollection, start, end: f.codec.export(run), commands: f.commands, result: { funds: accountFunds(run.economy.ledger, 'personal'), metrics: metricsFor(run.economy.ledger, 'personal', channel.businessId) } };
}
