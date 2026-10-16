import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceDirectory } from './evidence-output.ts';
import { createCampaignCodec, createCampaignRun } from '../src/application/campaign.ts';
import { evaluateCommand } from '../src/core/commands.ts';
const root = fileURLToPath(new URL('../', import.meta.url)), input = join(root, 'goal-1/evidence'), output = evidenceDirectory(root, 't10-browser-replay-audit.json'), codec = createCampaignCodec(), sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex'), report = JSON.parse(readFileSync(join(input, 't10-browser-native.json'), 'utf8')) as {
    exports: {
        file: string;
        sha256: string;
    }[];
    checks: {
        pass: boolean;
    }[];
}, cases = [];
if (report.exports.length !== 8 || report.checks.some(c => !c.pass))
    throw new Error('INCOMPLETE_NATIVE_VIDEO_REPORT');
for (const item of report.exports) {
    const raw = readFileSync(join(input, item.file), 'utf8');
    if (sha(raw) !== item.sha256)
        throw new Error('NATIVE_EXPORT_HASH_MISMATCH');
    const final = codec.import(raw);
    if (final.origin !== 'normal' || final.receipts[0]?.kind !== 'CreateRun')
        throw new Error('NOT_NORMAL_NATIVE_RUN');
    const creation = final.receipts[0];
    let run = createCampaignRun({ runId: final.runId, actorId: final.actorId, commandId: creation.commandId, backgroundId: final.backgroundId, seed: final.seed, playerProfile: final.playerProfile });
    if (run.receipts[0]?.payloadSignature !== creation.payloadSignature)
        throw new Error('NATIVE_INITIAL_CONTRACT_MISMATCH');
    const initialHash = sha(codec.export(run)), commands = [];
    for (const receipt of final.receipts.slice(1)) {
        const identity = JSON.parse(receipt.payloadSignature), command = { ...identity, commandId: receipt.commandId, expectedRevision: receipt.revisionBefore }, result = evaluateCommand(run, command, codec.registry, run.actorId);
        if (result.status !== 'proposed')
            throw new Error(JSON.stringify({ file: item.file, command, result }));
        commands.push(command);
        run = result.nextRun;
    }
    const replay = codec.export(run), expected = codec.export(final);
    if (replay !== expected || expected !== raw)
        throw new Error('NATIVE_VIDEO_REPLAY_MISMATCH:' + item.file);
    cases.push({ file: item.file, sha256: sha(raw), runId: final.runId, origin: final.origin, backgroundId: final.backgroundId, seed: final.seed, versions: final.versions, initial: { type: 'reconstructed_by_current_create_contract_and_matched_to_actual_creation_receipt', sha256: initialHash }, commands, expectedStateHash: sha(expected), actualReplayHash: sha(replay), result: 'PASS' });
}
const equality = [['t10-final-native-paid.json', 't10-final-native-reloaded.json'], ['t10-final-native-candidate.json', 't10-final-native-retried.json']].map(([a, b]) => { if (readFileSync(join(input, a!), 'utf8') !== readFileSync(join(input, b!), 'utf8'))
    throw new Error('NATIVE_RETRY_OR_RELOAD_CHANGED_STATE'); return { first: a, last: b, byteEqual: true }; });
function sources(dir: string): string[] { return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(i => i.isDirectory() ? sources(`${dir}/${i.name}`) : /\.(tsx?|css)$/.test(i.name) ? [`${dir}/${i.name}`] : []); }
const paths = [...sources('src'), 'scripts/verify_video_browser_evidence.ts', 'scripts/evidence-output.ts', 'package.json', 'package-lock.json', 'index.html', 'vitest.config.ts', 'tsconfig.core.json'];
writeFileSync(join(output, 't10-browser-replay-audit.json'), JSON.stringify({ taskId: 'T10', evidenceType: 'audit_of_actual_native_UI_exports', baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), reproduceCommand: 'npm run evidence:video-browser-audit', sourceHashes: Object.fromEntries(paths.map(path => [path, sha(readFileSync(join(root, path)))])), cases, equality, notCovered: ['draft_v1_is_excluded', 'human_playtest', 'real_200_percent_zoom', 'original_png', 'full_campaign'] }, null, 2) + '\n');
console.log(JSON.stringify({ cases: cases.length, byteEqualPairs: equality.length, result: 'PASS' }, null, 2));
