import { describe, expect, it } from 'vitest'
import { createInitialRun } from './bootstrap.ts'
import { accountFunds } from '../core/ledger.ts'

describe('run bootstrap', () => {
  it('creates a versioned run after opening-day obligations without promising unearned salary', () => {
    const input = { runId: 'run1', actorId: 'player', commandId: 'create1', seed: 'seed', backgroundId: 'technical_employee' }
    const run = createInitialRun(input)
    expect(run.revision).toBe(1)
    expect(accountFunds(run.economy.ledger, 'personal').cashFen).toBe(2_600_000)
    expect(run.timeline.pending).toHaveLength(71)
    expect(run.receipts[0]?.kind).toBe('CreateRun')
    expect(run.versions.contentHash).toMatch(/^[0-9a-f]{64}$/)
    expect(createInitialRun(input)).toEqual(run)
  })
})
