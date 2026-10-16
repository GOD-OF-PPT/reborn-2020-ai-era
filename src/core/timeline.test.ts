import { describe, expect, it } from 'vitest'
import { acknowledgePause, advanceTimeline, createTimeline, DAY_PHASES, queueEvent, type DayPhase } from './timeline.ts'

describe('date-ordered timeline', () => {
  it('processes every same-day phase and orders equal priorities by stable instance ID (Q30)', () => {
    let timeline = createTimeline<string>('2020-01-01')
    for (const phase of [...DAY_PHASES].reverse()) {
      timeline = queueEvent(timeline, { instanceId: `${phase}:b`, date: '2020-01-01', phase, priority: 10, payload: `${phase}:b` })
      timeline = queueEvent(timeline, { instanceId: `${phase}:a`, date: '2020-01-01', phase, priority: 10, payload: `${phase}:a` })
    }
    const result = advanceTimeline(timeline, [] as string[], { date: '2020-01-01' }, (state, event) => ({ state: [...state, event.payload] }))
    expect(result.state).toEqual(DAY_PHASES.flatMap((phase: DayPhase) => [`${phase}:a`, `${phase}:b`]))
    expect(result.timeline.pending).toHaveLength(0)
    expect(result.timeline.receipts).toHaveLength(12)
    expect(result.status).toBe('advanced')
    expect(timeline.receipts).toHaveLength(0)
  })

  it('stops at a required decision and resumes without replaying the processed event', () => {
    let timeline = createTimeline<string>('2020-01-01')
    timeline = queueEvent(timeline, { instanceId: 'due', date: '2020-01-01', phase: 'due_obligations', priority: 0, payload: 'due' })
    timeline = queueEvent(timeline, { instanceId: 'salary', date: '2020-01-31', phase: 'certain_receipts', priority: 0, payload: 'salary' })
    const reduce = (state: string[], event: { payload: string }) => ({ state: [...state, event.payload], ...(event.payload === 'due' ? { pauseReason: 'CASH_SHORTFALL' } : {}) })
    const paused = advanceTimeline(timeline, [] as string[], { date: '2020-01-31' }, reduce)
    expect(paused.status).toBe('paused')
    expect(paused.state).toEqual(['due'])
    expect(advanceTimeline(paused.timeline, paused.state, { date: '2020-01-31' }, reduce).state).toEqual(['due'])
    expect(() => acknowledgePause(paused.timeline, 'wrong')).toThrow('PAUSE_REFERENCE_MISMATCH')
    const resumed = advanceTimeline(acknowledgePause(paused.timeline, 'due'), paused.state, { date: '2020-01-31' }, reduce)
    expect(resumed.state).toEqual(['due', 'salary'])
    expect(resumed.timeline.receipts).toHaveLength(2)
  })

  it('processes newly scheduled follow-ups before advancing past their dates', () => {
    const timeline = queueEvent(createTimeline<string>('2020-01-01'), { instanceId: 'start', date: '2020-01-01', phase: 'world_update', priority: 0, payload: 'start' })
    const result = advanceTimeline(timeline, [] as string[], { date: '2020-01-31' }, (state, event) => ({
      state: [...state, event.payload],
      ...(event.payload === 'start' ? { newEvents: [{ instanceId: 'follow-up', date: '2020-01-05', phase: 'due_obligations', priority: 0, payload: 'follow-up' }] } : { pauseReason: 'DECISION_REQUIRED' }),
    }))
    expect(result.status).toBe('paused')
    expect(result.timeline.cursor.date).toBe('2020-01-05')
    expect(result.state).toEqual(['start', 'follow-up'])
  })

  it('keeps event identities stable before and after processing', () => {
    const event = { instanceId: 'news', date: '2020-01-01', phase: 'world_update', priority: 0, payload: { value: 1 } } as const
    let timeline = queueEvent(createTimeline<{ readonly value: number }>('2020-01-01'), event)
    expect(queueEvent(timeline, event)).toEqual(timeline)
    expect(() => queueEvent(timeline, { ...event, payload: { value: 2 } })).toThrow('EVENT_ID_REUSED')
    const result = advanceTimeline(timeline, 0, { date: '2020-01-01' }, (state, item) => ({ state: state + item.payload.value }))
    timeline = result.timeline
    expect(queueEvent(timeline, event)).toEqual(timeline)
    expect(() => queueEvent(timeline, { ...event, instanceId: 'late-news' })).toThrow('EVENT_BEHIND_CURSOR')
    expect(() => advanceTimeline(timeline, result.state, { date: '2019-12-31' }, (state) => ({ state }))).toThrow('CANNOT_REWIND_TIME')
  })

  it('takes a data snapshot rather than keeping a mutable queued payload', () => {
    const event = { instanceId: 'fixed-fact', date: '2020-01-01', phase: 'world_update', priority: 0, payload: { value: 1 } } as const
    const data = { ...event, payload: { value: 1 } }
    const timeline = queueEvent(createTimeline<{ value: number }>('2020-01-01'), data)
    data.payload.value = 99
    expect(timeline.pending[0]?.payload.value).toBe(1)
  })

  it('rejects an unbounded follow-up chain without modifying the input timeline', () => {
    const timeline = queueEvent(createTimeline<number>('2020-01-01'), { instanceId: 'step:0', date: '2020-01-01', phase: 'world_update', priority: 0, payload: 0 })
    expect(() => advanceTimeline(timeline, 0, { date: '2020-01-01' }, (state, event) => ({ state: state + 1, newEvents: [{ ...event, instanceId: `step:${state + 1}`, priority: state + 1, payload: state + 1 }] }), 3)).toThrow('EVENT_PROCESSING_LIMIT')
    expect(timeline.receipts).toHaveLength(0)
    expect(timeline.pending).toHaveLength(1)
  })
})
