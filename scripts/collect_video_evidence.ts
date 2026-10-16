import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceDirectory } from './evidence-output.ts';
import { replayVideoF02 } from '../src/testing/video-scenarios.ts';
import { replayNormalVideo } from '../src/testing/normal-video-scenario.ts';
import { createCampaignCodec } from '../src/application/campaign.ts';
const root = fileURLToPath(new URL('../', import.meta.url)), names = ['f02', 'technical_employee', 'content_employee'].flatMap(id => ['initial', 'final'].map(stage => `t10-video-${id}-${stage}.json`)), output = evidenceDirectory(root, 't10-video-evidence.json', names), sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
const cases: unknown[] = [];
function snapshots(id: string, initial: string, final: string) { return Object.fromEntries(Object.entries({ initial, final }).map(([stage, raw]) => { const file = `t10-video-${id}-${stage}.json`, text = raw + '\n'; writeFileSync(join(output, file), text); return [stage, { file, sha256: sha(text) }]; })); }
const f02 = replayVideoF02(), expected = { incomeFen: 900000, costFen: 465000, profitFen: 435000, cashFen: 2435000, heldFen: 0, paidContracts: 3 }, actual = { ...f02.result.metrics, cashFen: f02.result.funds.cashFen, heldFen: f02.result.funds.heldFen, paidContracts: f02.run.video!.contracts.filter(c => c.status === 'settled').length };
if (JSON.stringify(expected) !== JSON.stringify(actual))
    throw new Error(JSON.stringify({ expected, actual }));
cases.push({ id: 'F02', evidenceType: 'integration_replay', origin: 'fixture', fixtureTerms: { noLivingCosts: true, noEmployment: true, noWorkers: true, prepaymentFen: 0, requiredRevisions: 1, quarterActionPoints: [4, 3] }, seed: f02.run.seed, versions: f02.run.versions, snapshots: snapshots('f02', f02.start, f02.end), commands: f02.commands, expected, actual });
for (const profile of ['technical_employee', 'content_employee']) {
    const result = replayNormalVideo(profile), codec = createCampaignCodec();
    if (result.result.origin !== 'normal' || !result.result.granted || result.result.firstPublicationIncomeFen !== 0 || result.result.publications !== 2)
        throw new Error(JSON.stringify(result.result));
    cases.push({ id: `normal-${profile}`, evidenceType: 'integration_replay', origin: 'normal', seed: result.seed, versions: result.versions, snapshots: snapshots(profile, codec.export(result.initial), codec.export(result.run)), commands: result.commands, expected: { normalOpeningOnly: true, actualLivingAndSalary: true, qualifyingJob: true, firstPublicationIncomeFen: 0, publications: 2 }, actual: result.result });
}
function sources(dir: string): string[] { return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(item => item.isDirectory() ? sources(`${dir}/${item.name}`) : /\.(tsx?|css)$/.test(item.name) ? [`${dir}/${item.name}`] : []); }
const paths = [...sources('src'), 'scripts/collect_video_evidence.ts', 'scripts/evidence-output.ts', 'scripts/validate_content.ts', 'package.json', 'package-lock.json', 'index.html', 'vitest.config.ts', 'tsconfig.core.json'];
const report = { taskId: 'T10', evidenceType: 'integration_replay', baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), caseIds: ['P015', 'F02', 'Q09', 'Q10', 'Q39-video-only'], reproduceCommand: 'npm run evidence:video', sourceHashes: Object.fromEntries(paths.map(path => [path, sha(readFileSync(join(root, path)))])), cases, notCovered: ['course_conversion', 'all_five_routes', 'normal_24_quarter_ending', 'native_browser_unless_separate_report', 'original_png', 'human_playtest', 'real_video_generation_or_platform_income'] };
writeFileSync(join(output, 't10-video-evidence.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ file: join(output, 't10-video-evidence.json'), cases: cases.length, f02: actual }, null, 2));
