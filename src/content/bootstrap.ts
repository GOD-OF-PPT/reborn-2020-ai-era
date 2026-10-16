import { hashValue } from '../core/hash.ts'
import { RNG_ALGORITHM } from '../core/random.ts'
import type { VersionSet } from '../core/run-types.ts'

/** Versioned fictional working values, transcribed from contract 20, not loaded from planning. */
export const BOOTSTRAP_CONTENT = {
  version: 'bootstrap-work-v5', startDate: '2020-01-01', endDate: '2025-12-31',
  profiles: [
    { id: 'technical_employee', initialCashFen: 3_000_000, monthlyLivingCostFen: 400_000, monthlySalaryFen: 800_000 },
    { id: 'content_employee', initialCashFen: 3_000_000, monthlyLivingCostFen: 400_000, monthlySalaryFen: 600_000 },
  ],
} as const

export const BOOTSTRAP_VERSIONS: VersionSet = {
  schemaVersion: 5, rulesVersion: 'rules-t08-core-v1', contentVersion: BOOTSTRAP_CONTENT.version,
  contentHash: hashValue(BOOTSTRAP_CONTENT), rngAlgorithmVersion: RNG_ALGORITHM,
}
