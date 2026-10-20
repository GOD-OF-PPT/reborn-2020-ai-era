import {canonicalJson} from '../src/core/identity.ts'
import type {CriticalArchive, FileRef} from './course-critical-evidence.ts'

export interface CriticalSummaryResultRow {
 readonly rowId: string
 readonly identity: string
 readonly caseId: string
 readonly folder: string
 readonly sourceRevision: number
 readonly status: 'target_verified'
 readonly error: null
 readonly acceptedCommands: number
 readonly rejectedCommands: number
 readonly targetChecks: number
 readonly revision: number
 readonly date: string
 readonly evidence: FileRef
 readonly archive: CriticalArchive
 readonly recovery: null
 readonly exactAttemptReplay: unknown
}
export interface CriticalPrefixSummaryProof {
 readonly identity: string
 readonly status: 'verified'
 readonly commands: number
 readonly originalMilestones: number
 readonly index: FileRef
 readonly archive: CriticalArchive
}
export interface CriticalSummaryExpectation {
 readonly rows: readonly CriticalSummaryResultRow[]
 readonly prefixProofs: readonly CriticalPrefixSummaryProof[]
 readonly sourceHashes: Readonly<Record<string, string>>
 readonly inputHashes: Readonly<Record<string, string>>
}
function check(value: unknown, code: string): asserts value { if (!value) throw Error(code) }
function object(value: unknown, code: string): Record<string, unknown> {
 check(value !== null && typeof value === 'object' && !Array.isArray(value), code)
 return {...value}
}
function equal(actual: unknown, expected: unknown, code: string) {
 check(canonicalJson(actual) === canonicalJson(expected), code)
}

/** Pure metadata check; expected rows and file references must come from the completed independent audit. */
export function assertCriticalSummary(input: unknown, expected: CriticalSummaryExpectation) {
 check(expected.rows.length === 90 && new Set(expected.rows.map(row => row.rowId)).size === 90
  && expected.rows.every(row => row.status === 'target_verified' && row.error === null && row.recovery === null
   && Number.isSafeInteger(row.acceptedCommands) && row.acceptedCommands >= 0
   && Number.isSafeInteger(row.rejectedCommands) && row.rejectedCommands >= 0
   && Number.isSafeInteger(row.targetChecks) && row.targetChecks > 0
   && row.revision === row.sourceRevision + row.acceptedCommands
   && row.evidence.file === row.folder + '/case-index.json' && row.archive.encoding === 'xz'
   && row.archive.file === 'case-evidence.xz'), 'INDEPENDENT_SUMMARY_EXPECTATION_INCOMPLETE')
 check(expected.prefixProofs.length === 2 && new Set(expected.prefixProofs.map(prefix => prefix.identity)).size === 2
  && expected.prefixProofs.every(prefix => prefix.status === 'verified' && prefix.originalMilestones === 25
   && prefix.index.file === prefix.identity + '/prefix-index.json'
   && prefix.archive.encoding === 'xz' && prefix.archive.file === 'prefix-evidence.xz'),
  'INDEPENDENT_SUMMARY_PREFIX_EXPECTATION_INCOMPLETE')
 const summary = object(input, 'COMPLETE_ORIGINAL_SUMMARY_OBJECT_REQUIRED')
 equal(Object.keys(summary).sort(), ['scope', 'registered', 'recorded', 'attempted', 'targetVerified',
  'failed', 'unexecutedDueToFatal', 'actualAcceptedCommands', 'actualRejectedCommands',
  'allOriginal90TargetsVerified', 'fatal', 'finalGuardError', 'prefixProofs', 'sourceHashes', 'inputHashes', 'results'].sort(),
  'ORIGINAL_SUMMARY_EXACT_FIELDS_CHANGED')
 check(summary.scope === 'P3 original90 only. Exact target assertions, command acceptance/rejection, full original text and accounting; P4/whole5b/T17/goal and compatibility/human/assets remain incomplete.',
  'ORIGINAL_SUMMARY_SCOPE_CHANGED')
 const accepted = expected.rows.reduce((n, row) => n + row.acceptedCommands, 0)
 const rejected = expected.rows.reduce((n, row) => n + row.rejectedCommands, 0)
 check(summary.registered === 90 && summary.recorded === 90 && summary.attempted === 90 && summary.targetVerified === 90 &&
  summary.failed === 0 && summary.unexecutedDueToFatal === 0 && summary.fatal === null && summary.finalGuardError === null,
  'FULL_ORIGINAL_COLLECTOR_TOTALS_DISAGREE_WITH_INDEPENDENT_RESULTS')
 check(summary.actualAcceptedCommands === accepted && summary.actualRejectedCommands === rejected, 'ORIGINAL_REAL_ATTEMPT_TOTALS_CHANGED')
 check(summary.allOriginal90TargetsVerified === true, 'ORIGINAL_SUMMARY_ALL_TARGETS_FLAG_CHANGED')
 equal(summary.sourceHashes, expected.sourceHashes, 'ORIGINAL_SUMMARY_SOURCE_BINDING_CHANGED')
 equal(summary.inputHashes, expected.inputHashes, 'ORIGINAL_SUMMARY_INPUT_BINDING_CHANGED')
 equal(summary.prefixProofs, expected.prefixProofs, 'ORIGINAL_SUMMARY_PREFIX_PROOFS_CHANGED')
 check(Array.isArray(summary.results) && summary.results.length === 90, 'COMPLETE_ORIGINAL_SUMMARY_ROWS_REQUIRED')
 for (const [index, registered] of expected.rows.entries()) {
  const originalRow = object(summary.results[index], 'ORIGINAL_SUMMARY_ROW_REQUIRED')
  equal(originalRow, registered, 'ORIGINAL_SUMMARY_ROW_NOT_INDEPENDENTLY_REPRODUCED:' + registered.rowId)
 }
 return {status: 'verified-complete-collector-summary' as const, registered: 90, recorded: 90,
  accepted, rejected, prefixProofs: expected.prefixProofs.length,
  sourceBindings: Object.keys(expected.sourceHashes).length, inputBindings: Object.keys(expected.inputHashes).length,
  fullResultRowsCompared: true as const}
}
