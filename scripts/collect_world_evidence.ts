import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { campaignRuntime, createCampaignRun, createCampaignCodec, createCampaignRegistry } from '../src/application/campaign.ts'
import { CAMPAIGN_CONTENT } from '../src/content/campaign.ts'
import { createWorldFixture } from '../src/testing/world-fixture.ts'
import { evaluateCommand, previewCommand, type CommandRegistry } from '../src/core/commands.ts'
import type { GameRun } from '../src/core/run-types.ts'
import type { RunCodec } from '../src/persistence/codec.ts'
import type { WorldRuntime } from '../src/core/world.ts'
import { accountPosition } from '../src/core/ledger.ts'
import { evidenceDirectory } from './evidence-output.ts'
import { canonicalJson } from '../src/core/identity.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = evidenceDirectory(root, 't05-world-evidence.json', ['t05-clock-technical_employee', 't05-clock-content_employee', 't05-funded-content', 't05-zero-resource'].flatMap((name) => [`${name}-initial.json`, `${name}-final.json`]))
const hash = (input: string | Uint8Array) => createHash('sha256').update(input).digest('hex')
type CaseContext = { run: GameRun; codec: RunCodec; registry: CommandRegistry; runtime: WorldRuntime }
function drive(name: string, context: CaseContext, policy: 'prepare' | 'deadline', target: string) {
  let run = context.run
  const initial = context.codec.export(run) + '\n'
  const commands = []
  for (let count = 0; run.timeline.cursor.date !== target || run.timeline.pause !== null; count += 1) {
    if (count > 300) throw new Error('clock did not progress')
    let kind = 'AdvanceTime'
    let payload: unknown = { date: target }
    if (run.timeline.pause?.reason === 'CASH_SHORTFALL') { kind = 'AcknowledgeCashGap'; payload = { instanceId: run.timeline.pause.instanceId } }
    else if (run.timeline.pause?.reason === 'CONTENT_DECISION_PENDING') {
      const instance = run.world?.instances.find((item) => item.openedBy === run.timeline.pause?.instanceId)
      if (!instance) throw new Error('paused event missing')
      if (policy === 'deadline') { kind = 'DeferEventDecision'; payload = { instanceId: instance.id } }
      else { kind = 'ChooseEvent'; payload = { instanceId: instance.id, choiceId: 'prepare' } }
    }
    const command = { runId: run.runId, actorId: run.actorId, commandId: `${name}-${run.revision}`, expectedRevision: run.revision, kind, payload }
    const preview = previewCommand(run, command, context.registry, run.actorId)
    if (!preview.allowed) throw new Error(JSON.stringify({ name, command, preview }))
    const result = evaluateCommand(run, command, context.registry, run.actorId)
    if (result.status !== 'proposed') throw new Error(JSON.stringify({ name, result }))
    commands.push({ command, preview, revisionAfter: result.nextRun.revision })
    run = result.nextRun
  }
  const final = context.codec.export(run) + '\n'
  if (context.codec.export(context.codec.import(final)) + '\n' !== final) throw new Error('roundtrip mismatch')
  const marketRandomUnchanged = canonicalJson(run.random.streams.market) === canonicalJson(context.run.random.streams.market)
  if (!marketRandomUnchanged) throw new Error('content changed the market random stream')
  const files = { initial: `${name}-initial.json`, final: `${name}-final.json` }
  writeFileSync(join(directory, files.initial), initial)
  writeFileSync(join(directory, files.final), final)
  return { name, origin: run.origin, scope: policy === 'prepare' ? 'funded_content_fixture_not_normal_campaign' : 'clock_and_deadline_only_not_playable_campaign', seed: run.seed, backgroundId: run.backgroundId, versions: run.versions, target, files, initialSha256: hash(initial), finalSha256: hash(final), commands, expected: { date: target, readNews: 0, marketRandomUnchanged: true, eventResolution: policy === 'deadline' ? 'default' : 'chosen' }, actual: { date: run.timeline.cursor.date, marketRandomUnchanged, position: accountPosition(run.economy.ledger, run.personalAccountId), anchorIds: run.world?.anchors.map((item) => item.id), readNews: run.world?.newsRead.length, eventResults: run.world?.instances.map((item) => ({ id: item.id, definitionId: item.definitionId, resolution: item.resolution, choiceId: item.choiceId, reason: item.reason })), jobs: run.world?.jobs.map((item) => ({ id: item.id, status: item.status })), preparations: run.world?.preparations, marketRandom: run.random.streams.market } }
}

const cases = []
for (const backgroundId of ['technical_employee', 'content_employee']) {
  const run = createCampaignRun({ runId: `t05-${backgroundId}`, actorId: 'player', commandId: 'create-evidence', backgroundId, seed: `t05-clock-${backgroundId}` })
  const record = drive(`t05-clock-${backgroundId}`, { run, codec: createCampaignCodec(), registry: createCampaignRegistry(), runtime: campaignRuntime }, 'deadline', '2025-12-31')
  if (record.actual.anchorIds?.length !== 11 || record.actual.readNews !== 0 || record.actual.eventResults?.some((item) => item.resolution !== 'default' || item.reason !== 'DEADLINE_REACHED') || record.actual.position.cashFen !== 200_000 || record.actual.position.payableFen !== 26_000_000) throw new Error('clock/default fixture mismatch')
  cases.push({ ...record, expected: { ...record.expected, cashFen: 200_000, payableFen: 26_000_000, anchors: 11, deadlineDefaults: 5 } })
}
const funded = drive('t05-funded-content', createWorldFixture(CAMPAIGN_CONTENT, false, 50_000_000), 'prepare', '2025-12-31')
if (funded.actual.jobs?.length !== 5 || funded.actual.jobs.some((job) => job.status !== 'completed') || funded.actual.preparations?.length !== 5 || funded.actual.position.cashFen !== 24_190_000) throw new Error('funded content fixture mismatch')
cases.push({ ...funded, expected: { ...funded.expected, cashFen: 24_190_000, completedJobs: 5, preparations: 5 } })
const zero = drive('t05-zero-resource', createWorldFixture(undefined, true), 'deadline', '2020-01-06')
if (zero.actual.position.cashFen !== 0 || zero.actual.preparations?.length !== 0 || zero.actual.eventResults?.[0]?.resolution !== 'default') throw new Error('zero-resource default mismatch')
cases.push({ ...zero, expected: { ...zero.expected, cashFen: 0, preparations: 0, defaultCount: 1 } })
function sources(directory: string): string[] { return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((item) => item.isDirectory() ? sources(`${directory}/${item.name}`) : /\.tsx?$/.test(item.name) ? [`${directory}/${item.name}`] : []) }
const paths = [...sources('src'), 'scripts/validate_content.ts', 'scripts/collect_world_evidence.ts', 'scripts/collect_kernel_evidence.ts', 'scripts/collect_save_evidence.ts', 'scripts/evidence-output.ts', 'package.json', 'package-lock.json', 'tsconfig.core.json', 'vitest.config.ts', 'goal-1/evidence/t05-source-observations.json'].sort()
const evidence = { taskId: 'T05', evidenceType: 'integration_replay', baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), caseIds: ['Q15:gates_only', 'Q17:world_clock_only', 'Q19:fixed_facts', 'Q35:command_protocol', 'Q36:preparation_only', 'Q37:domain_isolation', 'Q40:default', 'X07:preparation_only', 'X11:projection_only'], reproduceCommand: 'npm run evidence:world', runtime: { node: process.version }, sourceHashes: Object.fromEntries(paths.map((name) => [name, hash(readFileSync(join(root, name)))])), cases, notCovered: ['employment_and_business_capacity', 'five_route_business_delivery', 'local_history_intervention', 'complete_24_quarter_gameplay', 'browser_ui', 'original_png', 'human_playtest'], fixtureWarning: 'Funded case receives 50,000,000 fen only in an origin=fixture host setup, not in normal gameplay. Clock cases deliberately have no salary scheduling before T06.' }
writeFileSync(join(directory, 't05-world-evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({ evidence: 'goal-1/evidence/t05-world-evidence.json', cases: cases.map((item) => ({ name: item.name, commands: item.commands.length, anchors: item.actual.anchorIds?.length, jobs: item.actual.jobs?.length, cashFen: item.actual.position.cashFen })) }, null, 2))
