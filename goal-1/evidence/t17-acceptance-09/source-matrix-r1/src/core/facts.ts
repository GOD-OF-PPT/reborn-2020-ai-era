import { isoDate, type IsoDate } from './calendar.ts'
import { requireRule } from './errors.ts'
import { identifier } from './identity.ts'
import { drawRandom, RANDOM_DOMAINS, type RandomDomain, type RandomState } from './random.ts'

export interface FrozenFact {
  readonly id: string
  readonly domain: RandomDomain
  readonly sourceEventId: string
  readonly createdAt: IsoDate
  readonly roll: number
  readonly evidence: string | null
}
export interface FactState { readonly random: RandomState; readonly facts: readonly FrozenFact[] }
export interface FactDescriptor { readonly id: string; readonly domain: RandomDomain; readonly sourceEventId: string; readonly date: IsoDate }

export function freezeFact(state: FactState, descriptor: FactDescriptor): FactState {
  identifier(descriptor.id); identifier(descriptor.sourceEventId); isoDate(descriptor.date)
  requireRule(RANDOM_DOMAINS.includes(descriptor.domain), 'INVALID_RANDOM_DOMAIN')
  const previous = state.facts.find((fact) => fact.id === descriptor.id)
  if (previous) {
    requireRule(previous.domain === descriptor.domain && previous.sourceEventId === descriptor.sourceEventId, 'FACT_ID_REUSED')
    return state
  }
  const draw = drawRandom(state.random, descriptor.domain)
  return { random: draw.random, facts: [...state.facts, { id: descriptor.id, domain: descriptor.domain, sourceEventId: descriptor.sourceEventId, createdAt: descriptor.date, roll: draw.value, evidence: null }] }
}

export function revealFact(state: FactState, factId: string, evidence: string): FactState {
  requireRule(typeof evidence === 'string' && evidence.length > 0 && evidence.length <= 4000, 'INVALID_EVIDENCE')
  const fact = state.facts.find((item) => item.id === factId)
  requireRule(fact, 'FACT_NOT_FOUND')
  requireRule(fact.evidence === null || fact.evidence === evidence, 'EVIDENCE_ALREADY_FIXED')
  if (fact.evidence === evidence) return state
  return { ...state, facts: state.facts.map((item) => item.id === factId ? { ...item, evidence } : item) }
}

export function visibleFacts(facts: readonly FrozenFact[]) {
  return facts.filter((fact) => fact.evidence !== null).map((fact) => ({ id: fact.id, sourceEventId: fact.sourceEventId, evidence: fact.evidence }))
}
