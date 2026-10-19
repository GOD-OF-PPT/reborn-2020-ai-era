import { requireRule } from './errors.ts'
import type { VersionSet } from './run-types.ts'

export function assertCompatible(actual: VersionSet, expected: VersionSet): void {
  requireRule(actual.schemaVersion === expected.schemaVersion, 'UNSUPPORTED_SCHEMA_VERSION')
  requireRule(actual.rulesVersion === expected.rulesVersion, 'INCOMPATIBLE_RULES_VERSION')
  requireRule(actual.contentVersion === expected.contentVersion && actual.contentHash === expected.contentHash, 'INCOMPATIBLE_CONTENT')
  requireRule(actual.rngAlgorithmVersion === expected.rngAlgorithmVersion, 'UNSUPPORTED_RNG_VERSION')
}
