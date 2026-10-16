import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceDirectory } from './evidence-output.ts';
import { replayCourseF03, replayCourseF05 } from '../src/testing/course-scenarios.ts';
import { replayNormalCourse } from '../src/testing/normal-course-scenario.ts';
import { createCampaignCodec } from '../src/application/campaign.ts';
const root = fileURLToPath(new URL('../', import.meta.url)), output = evidenceDirectory(root, 't11-course-evidence.json'), sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex'), cases: unknown[] = [];
function snapshots(id: string, states: Record<string, string>) { return Object.fromEntries(Object.entries(states).map(([stage, raw]) => { const file = `t11-${id}-${stage}.json`, text = raw + '\n'; writeFileSync(join(output, file), text); return [stage, { file, sha256: sha(text) }]; })); }
const f03 = replayCourseF03(), f05 = replayCourseF05();
if (f03.result.metrics.profitFen !== 2302900 || f03.result.funds.cashFen !== 4302900 || f03.result.funds.heldFen !== 0)
    throw new Error('F03 failed');
if (f05.result.cashFen !== 800000 || f05.result.heldFen !== 500000 || f05.result.availableFen !== 300000)
    throw new Error('F05 failed');
cases.push({ id: 'F03', origin: 'fixture', seed: f03.h.run.seed, versions: f03.h.run.versions, scope: 'isolated financial window Jan1-Apr16; actual prehistory separately retained, no living/salary/maintenance, fixed demand/help outcome, no waived employee wage', snapshots: snapshots('f03', { prehistoryInitial: f03.h.codec.export(f03.h.initial), initial: f03.start, prepayment: f03.prepaid, half: f03.half, final: f03.end }), prehistoryCommands: f03.h.commands.slice(0, f03.startCommands), commands: f03.h.commands.slice(f03.startCommands), expected: { incomeFen: 3582000, costFen: 1279100, profitFen: 2302900, cashFen: 4302900, heldFen: 0 }, actual: { ...f03.result.metrics, cashFen: f03.result.funds.cashFen, heldFen: f03.result.funds.heldFen } });
cases.push({ id: 'F05', origin: 'fixture', seed: f05.h.run.seed, versions: f05.h.run.versions, scope: 'isolated zero-cash snapshot with actual prehistory assets; partial delivery then paid seven-day refresh, not instant completion', snapshots: snapshots('f05', { prehistoryInitial: f05.h.codec.export(f05.h.initial), initial: f05.start, final: f05.end }), prehistoryCommands: f05.h.commands.slice(0, f05.startCommands), commands: f05.h.commands.slice(f05.startCommands), expected: { cashFen: 800000, heldFen: 500000, availableFen: 300000 }, actual: f05.result });
for (const profile of ['technical_employee', 'content_employee']) {
    const r = replayNormalCourse(profile), codec = createCampaignCodec();
    if (r.result.origin !== 'normal' || !r.result.closedAt || r.result.learners !== 20)
        throw new Error('Normal S02 failed');
    cases.push({ id: `S02-${profile}`, origin: 'normal', seed: r.seed, versions: r.versions, snapshots: snapshots('s02-' + profile, { initial: codec.export(r.initial), sliceInitial: codec.export(r.sliceInitial), closed: codec.export(r.closed), final: codec.export(r.run) }), commands: r.commands, expected: { normalOpeningOnly: true, actualSalaryAndLiving: true, separateCompany: true, realVideoOrigin: true, learners: 20, courseClosed: true }, actual: r.result });
}
function sources(dir: string): string[] { return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(i => i.isDirectory() ? sources(`${dir}/${i.name}`) : /\.(tsx?|css)$/.test(i.name) ? [`${dir}/${i.name}`] : []); }
const paths = [...sources('src'), 'scripts/collect_course_evidence.ts', 'scripts/evidence-output.ts', 'scripts/validate_content.ts', 'package.json', 'package-lock.json', 'index.html', 'vitest.config.ts', 'tsconfig.core.json'];
writeFileSync(join(output, 't11-course-evidence.json'), JSON.stringify({ taskId: 'T11', evidenceType: 'integration_replay', baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), caseIds: ['S02', 'F03', 'F05', 'Q11', 'Q12', 'Q26', 'Q31-course', 'Q36', 'Q39-course'], reproduceCommand: 'npm run evidence:course -- --output-dir <fresh-directory>', sourceHashes: Object.fromEntries(paths.map(p => [p, sha(readFileSync(join(root, p)))])), cases, notCovered: ['native_browser_unless_separate_report', 'all_24_quarters', 'other_three_routes', 'real_training_or_payments', 'original_png', 'human_playtest', 'balance'] }, null, 2) + '\n');
console.log(JSON.stringify({ file: join(output, 't11-course-evidence.json'), cases: cases.length, f03: f03.result.metrics, f05: f05.result }, null, 2));
