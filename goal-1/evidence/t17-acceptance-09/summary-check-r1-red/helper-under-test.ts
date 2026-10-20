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
interface LegacySummary {
 registered: number; recorded: number; attempted: number; targetVerified: number
 failed: number; unexecutedDueToFatal: number; fatal: unknown; finalGuardError: unknown
 actualAcceptedCommands: number; actualRejectedCommands: number; results: unknown[]
}
function check(value: unknown, code: string): asserts value { if (!value) throw Error(code) }
function object(value: unknown, code: string): Record<string, unknown> {
 check(value !== null && typeof value === 'object' && !Array.isArray(value), code)
 return {...value}
}
function equal(actual: unknown, expected: unknown, code: string) {
 check(canonicalJson(actual) === canonicalJson(expected), code)
}

/** Initial red-test version: the original inline algorithm is retained verbatim below. */
export function assertCriticalSummary(input: unknown, expected: CriticalSummaryExpectation) {
 const summary = input as LegacySummary
 const expectedRows = expected.rows
 const verified = expected.rows.length
 const accepted = expected.rows.reduce((n, row) => n + row.acceptedCommands, 0)
 const rejected = expected.rows.reduce((n, row) => n + row.rejectedCommands, 0)
 const rows = expected.rows.map(row => ({...row, status: 'verified', accepted: row.acceptedCommands, rejected: row.rejectedCommands}))
 // BEGIN ORIGINAL INLINE CONDITIONS
 check(summary.registered === 90 && summary.recorded === 90 && summary.attempted === 90 && summary.targetVerified === verified &&
  summary.failed === 0 && summary.unexecutedDueToFatal === 0 && summary.fatal === null && summary.finalGuardError === null,
  'FULL_ORIGINAL_COLLECTOR_TOTALS_DISAGREE_WITH_INDEPENDENT_RESULTS')
 check(summary.actualAcceptedCommands === accepted && summary.actualRejectedCommands === rejected, 'ORIGINAL_REAL_ATTEMPT_TOTALS_CHANGED')
 check(summary.results.length === 90, 'COMPLETE_ORIGINAL_SUMMARY_ROWS_REQUIRED')
 for (const registered of expectedRows) {
  const originalRow = summary.results.map(value => object(value, 'ORIGINAL_SUMMARY_ROW_REQUIRED')).find(value => value.rowId === registered.rowId)
  const audited = rows.map(value => object(value, 'AUDIT_ROW_REQUIRED')).find(value => value.rowId === registered.rowId)
  check(originalRow && audited && originalRow.status === 'target_verified' && audited.status === 'verified' &&
   originalRow.acceptedCommands === audited.accepted && originalRow.rejectedCommands === audited.rejected,
   'ORIGINAL_SUMMARY_ROW_NOT_INDEPENDENTLY_REPRODUCED:' + registered.rowId)
 }
 // END ORIGINAL INLINE CONDITIONS
 return {status: 'verified-complete-collector-summary', registered: 90, recorded: summary.recorded,
  prefixProofs: expected.prefixProofs.length, fullResultRowsCompared: false}
}
