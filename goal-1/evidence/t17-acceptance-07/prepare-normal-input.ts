import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { createCampaignRun, createCampaignCodec, campaignCourse, campaignStory } from '../../../src/application/campaign.ts';
import { evaluateCommand } from '../../../src/core/commands.ts';
import { projectCourse } from '../../../src/core/course-projection.ts';
import { projectStory } from '../../../src/core/story-projection.ts';
import { actionBudget } from '../../../src/core/economy.ts';
import type { GameRun, CommandEnvelope } from '../../../src/core/run-types.ts';
import { assertBrowserEvidenceWritable } from '../../../scripts/browser_evidence_guard.mjs';

const output = dirname(fileURLToPath(import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const scriptFile = relative(root, fileURLToPath(import.meta.url));
const inputFile = 'goal-1/evidence/t17-acceptance-06/matrix-r2/technical_employee-t16-campaign-0/shape-04/milestone-04.json.gz';
const expectedStoredSha = '1073b59abe2290ba57e9d6969968cc5e1deb3a408fe3b0b74c62f110cb2c2d90';
const expectedRawSha = '771bb22ea649b34adefcf8122fd3af0175452f4f0b7e79fc7d03128e2acb70c9';
const inputTarget = join(output, 'ui-input.json');
const auditTarget = join(output, 'input-replay-audit.json');
const startedAt = new Date().toISOString();
const exactCommand = ['rtk', 'proxy', 'node', '--experimental-strip-types', '--experimental-transform-types', scriptFile];
const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
function check(condition: unknown, code: string): asserts condition { if (!condition) throw new Error(code); }
function ensureDestination() {
    assertBrowserEvidenceWritable(output);
    for (const file of [inputTarget, auditTarget]) check(!existsSync(file) && lstatSync(file, { throwIfNoEntry: false }) === undefined, 'FRESH_INPUT_AND_AUDIT_REQUIRED');
}
function sourceFiles(folder: string): string[] {
    return readdirSync(join(root, folder), { withFileTypes: true }).flatMap(entry => {
        const file = folder + '/' + entry.name;
        check(!entry.isSymbolicLink(), 'SOURCE_SYMLINK_REJECTED:' + file);
        return entry.isDirectory() ? sourceFiles(file) : entry.name.endsWith('.ts') && !entry.name.includes('.test.') ? [file] : [];
    });
}
function sourceNames() {
    return [...['src/core', 'src/application', 'src/content', 'src/persistence'].flatMap(sourceFiles),
        scriptFile, 'scripts/browser_evidence_guard.mjs', 'package.json', 'package-lock.json',
        'tsconfig.json', 'tsconfig.core.json', 'tsconfig.app.json', 'tsconfig.node.json'].sort();
}
check(process.argv.length === 2, 'THIS_PREPARER_USES_ONLY_ITS_FIXED_FRESH_ROOT');
ensureDestination();
const names = sourceNames();
const sourceHashes = Object.fromEntries(names.map(file => [file, sha(readFileSync(join(root, file)))]));
let sourceGuardCalls = 0;
function guardSources() {
    check(JSON.stringify(sourceNames()) === JSON.stringify(names), 'SOURCE_FILE_SET_CHANGED');
    for (const file of names) check(sha(readFileSync(join(root, file))) === sourceHashes[file], 'SOURCE_CHANGED:' + file);
    check(sha(readFileSync(join(root, inputFile))) === expectedStoredSha, 'SOURCE_MILESTONE_BYTES_CHANGED');
    sourceGuardCalls++;
}
const steps: { commandId: string; kind: string; revisionBefore: number; revisionAfter: number; date: string; rawBytes: number; sha256: string }[] = [];
let creationEvidence: unknown = null;
let latestRevision: number | null = null;
let auditWritten = false;
try {
    guardSources();
    const stored = readFileSync(join(root, inputFile));
    check(stored.length === 206714 && sha(stored) === expectedStoredSha, 'FIXED_COMPRESSED_INPUT_MISMATCH');
    const bytes = gunzipSync(stored), raw = bytes.toString('utf8');
    check(bytes.length === 1687997 && sha(bytes) === expectedRawSha && Buffer.from(raw, 'utf8').equals(bytes), 'FIXED_NORMAL_INPUT_MISMATCH');
    const codec = createCampaignCodec(), original = codec.import(raw), first = original.receipts[0];
    check(codec.export(original) === raw && original.origin === 'normal' && original.revision === 154 && original.timeline.cursor.date === '2025-04-22', 'FIXED_MILESTONE_IDENTITY_MISMATCH');
    check(first?.kind === 'CreateRun' && original.receipts.length === 154, 'COMPLETE_CREATE_RECEIPTS_REQUIRED');
    const create = JSON.parse(first.payloadSignature) as { runId: string; actorId: string; kind: string; payload: { backgroundId: string; origin: string; seed: string; playerProfile: GameRun['playerProfile'] } };
    check(create.runId === original.runId && create.actorId === original.actorId && create.kind === 'CreateRun'
        && create.payload.origin === 'normal' && create.payload.backgroundId === 'technical_employee' && create.payload.seed === 't16-campaign-0', 'ORIGINAL_CREATION_IDENTITY_MISMATCH');
    guardSources();
    let replay = createCampaignRun({ runId: create.runId, actorId: create.actorId, commandId: first.commandId,
        backgroundId: create.payload.backgroundId, seed: create.payload.seed, playerProfile: create.payload.playerProfile });
    let replayRaw = codec.export(replay);
    replay = codec.import(replayRaw);
    check(codec.export(replay) === replayRaw && replay.receipts[0]?.payloadSignature === first.payloadSignature, 'CREATION_INITIAL_STATE_OR_STRICT_BYTES_MISMATCH');
    guardSources();
    creationEvidence = { runId: replay.runId, actorId: replay.actorId, backgroundId: replay.backgroundId, seed: replay.seed,
        commandId: first.commandId, revision: replay.revision, date: replay.timeline.cursor.date,
        rawBytes: Buffer.byteLength(replayRaw), sha256: sha(replayRaw), originalCreatePayloadAndInitialStateHashEqual: true };
    latestRevision = replay.revision;
    for (const receipt of original.receipts.slice(1)) {
        guardSources();
        const identity = JSON.parse(receipt.payloadSignature) as Pick<CommandEnvelope, 'runId' | 'actorId' | 'kind' | 'payload'>;
        const command: CommandEnvelope = { ...identity, commandId: receipt.commandId, expectedRevision: receipt.revisionBefore };
        check(command.runId === original.runId && command.actorId === original.actorId && command.kind === receipt.kind
            && replay.revision === receipt.revisionBefore, 'ORIGINAL_COMMAND_IDENTITY_OR_ORDER_CHANGED:' + receipt.commandId);
        const result = evaluateCommand(replay, command, codec.registry, original.actorId);
        check(result.status === 'proposed', 'ORIGINAL_CREATE_REPLAY_REJECTED:' + receipt.commandId + ':' + (result.status === 'rejected' ? result.reasonCodes.join(',') : result.status));
        replayRaw = codec.export(result.nextRun);
        replay = codec.import(replayRaw);
        check(codec.export(replay) === replayRaw && replay.revision === receipt.revisionAfter
            && replay.timeline.cursor.date === receipt.date && replay.receipts.at(-1)?.payloadSignature === receipt.payloadSignature,
            'STRICT_STEP_OR_ORIGINAL_RECEIPT_CHANGED:' + receipt.commandId);
        guardSources();
        latestRevision = replay.revision;
        steps.push({ commandId: command.commandId, kind: command.kind, revisionBefore: receipt.revisionBefore,
            revisionAfter: replay.revision, date: replay.timeline.cursor.date, rawBytes: Buffer.byteLength(replayRaw), sha256: sha(replayRaw) });
        if (steps.length % 25 === 0) console.log(JSON.stringify({ type: 'input-create-replay-progress', executed: steps.length, total: 153, revision: replay.revision, date: replay.timeline.cursor.date }));
    }
    check(steps.length === 153 && replayRaw === raw && Buffer.from(replayRaw).equals(bytes), 'FULL_CREATE_ORIGINAL_INPUT_BYTES_MISMATCH');
    const course = projectCourse(replay, campaignCourse), story = projectStory(replay, campaignStory);
    check(course && course.cohorts.length === 2 && !course.cohorts.some(cohort => cohort.courseId === course.courses.at(-1)?.id)
        && replay.receipts.at(-1)?.kind === 'SetHengxingAuthority', 'NOT_THE_EXPANDED_UNPLANNED_COURSE_MILESTONE');
    const deployment = story.deployments.find(row => row.businessId === 'ops:6b1fbedd3e88f5d918759df76852860e');
    check(deployment?.lifecycle === 'active' && deployment.currentGrant?.level === 'cross_flow' && deployment.observedBusinessResult, 'EARNED_EXPLICIT_SCOPE_REQUIRED');
    const business = course.businesses.find(row => row.id === deployment.businessId);
    check(business && business.accountId === 'ops:410a7bc61916ad67229d817efdd2079a', 'BOUND_COMPANY_REQUIRED');
    guardSources(); ensureDestination();
    writeFileSync(inputTarget, bytes, { flag: 'wx' });
    check(readFileSync(inputTarget).equals(bytes), 'WRITTEN_UI_INPUT_NOT_ORIGINAL_BYTES');
    guardSources();
    assertBrowserEvidenceWritable(output);
    const audit = { scope: 'One earned normal UI input verified from original CreateRun through all 153 non-Create receipts. This is input preparation, not new browser play or the 72 supplemental course strategy results.',
        passed: true, command: exactCommand, startedAt, finishedAt: new Date().toISOString(), node: process.version,
        input: { sourceFile: inputFile, storedBytes: stored.length, storedSha256: expectedStoredSha, rawBytes: bytes.length, rawSha256: expectedRawSha },
        creation: creationEvidence, executedCommands: steps.length, steps, final: { runId: replay.runId, actorId: replay.actorId,
            origin: replay.origin, revision: replay.revision, date: replay.timeline.cursor.date, phase: replay.phase,
            versions: replay.versions, lastCommand: replay.receipts.at(-1)?.kind, cohortCount: course.cohorts.length, newCourseNotPlanned: true,
            company: { businessId: business.id, accountId: business.accountId, funds: business.funds, metrics: business.metrics },
            budget: actionBudget(replay.economy, replay.timeline.cursor.date), deployment: { id: deployment.id, lifecycle: deployment.lifecycle,
                observedBusinessResult: deployment.observedBusinessResult, currentGrant: deployment.currentGrant } },
        output: { file: 'ui-input.json', bytes: bytes.length, sha256: sha(readFileSync(inputTarget)), originalBytesEqual: true },
        sourceHashes, finalSourceHashes: Object.fromEntries(names.map(file => [file, sha(readFileSync(join(root, file)))])), sourceGuardCalls,
        sourceGuardPolicy: 'Entire declared core/application/content/persistence/config/preparer/guard file set and exact hashes checked before and after Create and every replayed command; source gzip also checked each time. UI files excluded because this input preparer does not import them.',
        fullCreateReplayByteEqual: true, hiddenFactsUsedForDecisions: false, newFixtures: 0, outOfHistoryMoneyOrActionPointsInjected: 0,
        browserExecutions: 0, compatibilityDevelopmentOrTests: false, supplemental72StrategiesExecuted: 0 };
    writeFileSync(auditTarget, JSON.stringify(audit, null, 2) + '\n', { flag: 'wx' }); auditWritten = true;
    console.log(JSON.stringify({ type: 'input-create-replay-complete', executed: steps.length, revision: replay.revision, date: replay.timeline.cursor.date,
        uiInput: relative(root, inputTarget), sha256: expectedRawSha, companyAvailableFen: business.funds.availableFen,
        actionBudget: audit.final.budget, sourceGuardCalls, audit: relative(root, auditTarget) }));
} catch (error) {
    const failed = { scope: 'Failed or incomplete preparation of one original normal UI input; no passing replay or browser claim.', passed: false,
        command: exactCommand, startedAt, finishedAt: new Date().toISOString(), error: String(error), creation: creationEvidence,
        executedCommands: steps.length, latestRevision, steps, sourceHashes, sourceGuardCalls, uiInputExists: existsSync(inputTarget),
        browserExecutions: 0, compatibilityDevelopmentOrTests: false, supplemental72StrategiesExecuted: 0 };
    if (!auditWritten && !existsSync(auditTarget)) { assertBrowserEvidenceWritable(output); writeFileSync(auditTarget, JSON.stringify(failed, null, 2) + '\n', { flag: 'wx' }); }
    throw error;
}
