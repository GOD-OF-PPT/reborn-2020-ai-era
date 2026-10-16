import { describe, expect, it } from 'vitest'
import { freezeFact, revealFact, visibleFacts } from './facts.ts'
import { createRandom } from './random.ts'

describe('fixed instance facts', () => {
  it('draws only at creation and reveals evidence without exposing raw truth or rerolling', () => {
    const initial = { random: createRandom('facts-seed'), facts: [] }
    const descriptor = { id: 'fact1', domain: 'crisis', sourceEventId: 'event1', date: '2020-01-01' } as const
    const created = freezeFact(initial, descriptor)
    expect(freezeFact(created, { ...descriptor, date: '2020-01-02' })).toEqual(created)
    expect(created.random.streams.crisis.draws).toBe(1)
    expect(visibleFacts(created.facts)).toEqual([])
    const revealed = revealFact(created, 'fact1', '独立记录已核实')
    expect(revealed.random).toEqual(created.random)
    expect(visibleFacts(revealed.facts)).toEqual([{ id: 'fact1', sourceEventId: 'event1', evidence: '独立记录已核实' }])
    expect(JSON.stringify(visibleFacts(revealed.facts))).not.toContain('roll')
    expect(revealFact(JSON.parse(JSON.stringify(revealed)), 'fact1', '独立记录已核实')).toEqual(revealed)
  })
})
