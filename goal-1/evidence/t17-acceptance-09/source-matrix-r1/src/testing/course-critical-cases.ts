import {COURSE_CRITICAL_PREREQUISITES} from './course-critical-prerequisites.ts'
import {COURSE_CRITICAL_LIFECYCLE} from './course-critical-lifecycle.ts'
import {COURSE_CRITICAL_RISK} from './course-critical-risk.ts'
import {requireCritical, type CourseCriticalDefinition} from './course-critical-context.ts'

/** The authority's order is applied by the CLI; this registry may not drop or replace an ID. */
export const COURSE_CRITICAL_CASES: readonly CourseCriticalDefinition[] = [
 ...COURSE_CRITICAL_PREREQUISITES, ...COURSE_CRITICAL_LIFECYCLE, ...COURSE_CRITICAL_RISK,
]
requireCritical(COURSE_CRITICAL_CASES.length === 45 &&
 new Set(COURSE_CRITICAL_CASES.map(definition => definition.id)).size === 45, 'EXACT_45_CRITICAL_DEFINITIONS_REQUIRED')
for (const definition of COURSE_CRITICAL_CASES) {
 requireCritical(Number.isSafeInteger(definition.sourceRevision) && definition.sourceRevision >= 1,
  'ACTUAL_NORMAL_SOURCE_REVISION_REQUIRED:' + definition.id)
 requireCritical(definition.requiredChecks.length > 0 && definition.requiredChecks.every(code => code.length > 0),
  'EXPLICIT_CRITICAL_TARGET_CHECKS_REQUIRED:' + definition.id)
}
