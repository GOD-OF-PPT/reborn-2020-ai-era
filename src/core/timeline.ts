import { isoDate, type IsoDate } from './calendar.ts'
import { requireRule } from './errors.ts'
import { canonicalJson, identifier } from './identity.ts'

export const DAY_PHASES = ['world_update', 'certain_receipts', 'due_obligations', 'player_actions', 'market_matching', 'snapshot'] as const
export type DayPhase = typeof DAY_PHASES[number]
export interface TimePoint {
  readonly date: IsoDate
  readonly phase: DayPhase | 'before'
  readonly priority: number
  readonly instanceId: string
}
export interface ScheduledEvent<Payload> {
  readonly instanceId: string
  readonly date: IsoDate
  readonly phase: DayPhase
  readonly priority: number
  readonly payload: Payload
}
export interface EventReceipt {
  readonly instanceId: string
  readonly signature: string
  readonly date: IsoDate
  readonly phase: DayPhase
  readonly pauseReason: string | null
  readonly skippedReason?: string
}
export interface Timeline<Payload> {
  readonly cursor: TimePoint
  readonly pending: readonly ScheduledEvent<Payload>[]
  readonly receipts: readonly EventReceipt[]
  readonly pause: { readonly instanceId: string; readonly reason: string } | null
}

function phaseRank(phase: TimePoint['phase']): number { return phase === 'before' ? -1 : DAY_PHASES.indexOf(phase) }
export function compareTimePoints(a: TimePoint, b: TimePoint): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  if (a.phase !== b.phase) return phaseRank(a.phase) < phaseRank(b.phase) ? -1 : 1
  if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1
  return a.instanceId === b.instanceId ? 0 : a.instanceId < b.instanceId ? -1 : 1
}

export function createTimeline<Payload>(date: IsoDate): Timeline<Payload> {
  isoDate(date)
  return { cursor: { date, phase: 'before', priority: 0, instanceId: '' }, pending: [], receipts: [], pause: null }
}

export function acknowledgePause<Payload>(timeline: Timeline<Payload>, instanceId: string): Timeline<Payload> {
  requireRule(timeline.pause?.instanceId === instanceId, 'PAUSE_REFERENCE_MISMATCH')
  return { ...timeline, pause: null }
}

export function queueEvent<Payload>(timeline: Timeline<Payload>, event: ScheduledEvent<Payload>): Timeline<Payload> {
  identifier(event.instanceId); isoDate(event.date)
  requireRule(DAY_PHASES.includes(event.phase), 'INVALID_DAY_PHASE')
  requireRule(Number.isSafeInteger(event.priority) && Math.abs(event.priority) < Number.MAX_SAFE_INTEGER, 'INVALID_EVENT_PRIORITY')
  const signature = canonicalJson(event)
  const pending = timeline.pending.find((item) => item.instanceId === event.instanceId)
  const receipt = timeline.receipts.find((item) => item.instanceId === event.instanceId)
  if (pending || receipt) {
    requireRule((pending ? canonicalJson(pending) : receipt?.signature) === signature, 'EVENT_ID_REUSED')
    return timeline
  }
  requireRule(compareTimePoints(event, timeline.cursor) > 0, 'EVENT_BEHIND_CURSOR')
  const snapshot: ScheduledEvent<Payload> = JSON.parse(signature)
  return { ...timeline, pending: [...timeline.pending, snapshot].sort(compareTimePoints) }
}

export function checkedAdvanceTarget(timeline: { readonly cursor: TimePoint }, target: { readonly date: IsoDate; readonly phase?: DayPhase }): TimePoint {
  isoDate(target.date)
  const phase = target.phase ?? 'snapshot'
  requireRule(DAY_PHASES.includes(phase), 'INVALID_DAY_PHASE')
  const point: TimePoint = { date: target.date, phase, priority: Number.MAX_SAFE_INTEGER, instanceId: '' }
  requireRule(compareTimePoints(point, timeline.cursor) >= 0, 'CANNOT_REWIND_TIME')
  return point
}

export function advanceTimeline<State, Payload>(
  timeline: Timeline<Payload>, state: State, target: { readonly date: IsoDate; readonly phase?: DayPhase },
  reduce: (state: State, event: ScheduledEvent<Payload>) => { readonly state: State; readonly pauseReason?: string; readonly skippedReason?: string; readonly newEvents?: readonly ScheduledEvent<Payload>[] },
  maxEvents = 10000,
): { readonly timeline: Timeline<Payload>; readonly state: State; readonly status: 'advanced' | 'paused' } {
  const point = checkedAdvanceTarget(timeline, target)
  requireRule(Number.isInteger(maxEvents) && maxEvents > 0 && maxEvents <= 10000, 'INVALID_EVENT_LIMIT')
  if (timeline.pause !== null) return { timeline, state, status: 'paused' }
  let current = timeline
  let model = state
  let processed = 0
  while (current.pending.length > 0) {
    const event = current.pending[0]
    requireRule(event, 'INVALID_EVENT_QUEUE')
    if (compareTimePoints(event, point) > 0) break
    requireRule(processed < maxEvents, 'EVENT_PROCESSING_LIMIT')
    processed += 1
    const result = reduce(model, event)
    model = result.state
    requireRule(result.pauseReason === undefined || (typeof result.pauseReason === 'string' && result.pauseReason.length > 0 && result.pauseReason.length <= 512), 'INVALID_PAUSE_REASON')
    requireRule(result.skippedReason === undefined || (typeof result.skippedReason === 'string' && result.skippedReason.length > 0 && result.skippedReason.length <= 512 && result.pauseReason === undefined), 'INVALID_SKIP_REASON')
    const pause = result.pauseReason === undefined ? null : { instanceId: event.instanceId, reason: result.pauseReason }
    current = { cursor: { date: event.date, phase: event.phase, priority: event.priority, instanceId: event.instanceId }, pending: current.pending.slice(1), receipts: [...current.receipts, { instanceId: event.instanceId, signature: canonicalJson(event), date: event.date, phase: event.phase, pauseReason: pause?.reason ?? null, ...(result.skippedReason === undefined ? {} : { skippedReason: result.skippedReason }) }], pause }
    for (const followUp of result.newEvents ?? []) current = queueEvent(current, followUp)
    if (pause !== null) return { timeline: current, state: model, status: 'paused' }
  }
  return { timeline: { ...current, cursor: point }, state: model, status: 'advanced' }
}
