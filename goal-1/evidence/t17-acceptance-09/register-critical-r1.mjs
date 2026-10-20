import {writeFileSync, readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {COURSE_CRITICAL_CASES} from '../../../src/testing/course-critical-cases.ts'
import {criticalAuthority} from '../../../scripts/course-critical-prefix.ts'
import {IDENTITIES, criticalSourceNames, hashFiles} from '../../../scripts/course-critical-evidence.ts'

const authority = criticalAuthority(COURSE_CRITICAL_CASES)
const registered = IDENTITIES.flatMap(identity => authority.ordered.map((definition, index) => ({
 rowId: identity.name + '--' + definition.id, identity: identity.name, backgroundId: identity.backgroundId,
 seed: identity.seed, caseId: definition.id, sourceRevision: definition.sourceRevision, purpose: definition.purpose,
 requiredChecks: definition.requiredChecks, folder: identity.name + '/critical-' + String(index + 1).padStart(2, '0'),
})))
if (registered.length !== 90 || new Set(registered.map(row => row.rowId)).size !== 90) throw Error('EXACT_ORIGINAL90_REQUIRED')
const report = {scope: 'Execution-before registration only. Original fixed90 IDs/normal identities/early sources and actual expected checks; no GameRun Create or business commands executed.',
 originalRegistrationCommit: authority.originalRegistrationCommit, registeredCount: 90,
 originalCoreRegistered: 288, originalCriticalRegistered: 90, originalFullMatrixRegistered: 378,
 registered, sourceHashes: hashFiles(criticalSourceNames(authority.originalRuntimeHashes)),
 inputHashes: authority.inputHashes, original90GameExecutions: 0}
const output = fileURLToPath(new URL('./pre-registration-r1.json', import.meta.url))
writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'})
if (readFileSync(output, 'utf8') !== JSON.stringify(report, null, 2) + '\n') throw Error('PREREGISTRATION_BYTES_CHANGED')
console.log(JSON.stringify({registered: 90, definitions: authority.ordered.length, identities: IDENTITIES.length,
 sourceFiles: Object.keys(report.sourceHashes).length, originalInputs: Object.keys(report.inputHashes).length,
 original90GameExecutions: 0}))
