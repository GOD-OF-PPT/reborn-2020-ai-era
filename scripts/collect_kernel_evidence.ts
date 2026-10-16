import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runQ01Accounting } from '../src/testing/q01-accounting.ts'
import { accountPosition } from '../src/core/ledger.ts'
import { actionBudget } from '../src/core/economy.ts'
import { canonicalJson } from '../src/core/identity.ts'
import { evidenceDirectory } from './evidence-output.ts'
import { BOOTSTRAP_VERSIONS } from '../src/content/bootstrap.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const outputDirectory = evidenceDirectory(root, 't03-kernel-evidence.json', ['t03-q01-initial.json', 't03-q01-final.json'])
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const result = runQ01Accounting()
const initial = canonicalJson(result.initialSnapshot) + '\n'
const final = canonicalJson({ state: result.state, timeline: result.timeline }) + '\n'
const repeated = runQ01Accounting()
if (canonicalJson({ state: repeated.state, timeline: repeated.timeline }) + '\n' !== final) throw new Error('Kernel fixture is not deterministic')
const position = accountPosition(result.state.ledger, 'personal')
if (position.cashFen !== 2_700_000 || position.investmentValueFen !== 1_100_000 || Math.min(...result.cashTrace.map((row) => row.cashFen)) !== 1_100_000) throw new Error('Q01 accounting fixture mismatch')

const sources = ['src/core/errors.ts', 'src/core/identity.ts', 'src/core/money.ts', 'src/core/calendar.ts', 'src/core/ledger.ts', 'src/core/economy.ts', 'src/core/timeline.ts', 'src/core/economic-time.ts', 'src/testing/q01-accounting.ts', 'scripts/collect_kernel_evidence.ts', 'tsconfig.core.json', 'package.json', 'package-lock.json', 'planning/playable-spec.json', 'planning/implementation-baseline.json']
const record = {
  taskId: 'T03', checkpointId: 'C03', caseId: 'Q01', evidenceType: 'integration',
  scope: 'accounting_kernel_only_not_order_matching_or_browser_acceptance',
  fixtureVersion: 'q01-accounting-v1', rulesVersion: BOOTSTRAP_VERSIONS.rulesVersion,
  seed: null, randomness: 'none_consumed_in_this_accounting_fixture',
  runtime: { node: process.version, runner: 'node --experimental-strip-types' },
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(sources.map((name) => [name, hash(readFileSync(join(root, name)))])),
  reproduceCommand: 'npm run evidence:kernel',
  initialSnapshot: { file: 't03-q01-initial.json', sha256: hash(initial) },
  finalSnapshot: { file: 't03-q01-final.json', sha256: hash(final) },
  commandSequence: result.state.receipts.map((receipt) => JSON.parse(receipt.signature)),
  cashTrace: result.cashTrace, minimumCashFen: Math.min(...result.cashTrace.map((row) => row.cashFen)),
  actual: { position, actionBudget: actionBudget(result.state, '2020-03-31') },
  expected: { cashFen: 2_700_000, investmentValueFen: 1_100_000, netAssetsFen: 3_800_000, actionPointsSpent: 4 },
  repeatedSnapshotEqual: true,
  notCovered: ['market_orders_and_matching', 'employment_eligibility', 'runId_revision_atomic_persistence', 'content_runtime', 'capacity_jobs', 'browser_gameplay', 'full_campaign', 'playtest'],
}
writeFileSync(join(outputDirectory, 't03-q01-initial.json'), initial)
writeFileSync(join(outputDirectory, 't03-q01-final.json'), final)
writeFileSync(join(outputDirectory, 't03-kernel-evidence.json'), JSON.stringify(record, null, 2) + '\n')
console.log(JSON.stringify({ evidence: join(outputDirectory, 't03-kernel-evidence.json'), initialSha256: hash(initial), finalSha256: hash(final), position, actionBudget: record.actual.actionBudget, repeatedSnapshotEqual: true }, null, 2))
