import { expect, it } from 'vitest'
import { loadContentPack } from './content-schema.ts'
import { fixturePack, createWorldFixture } from '../testing/world-fixture.ts'

it('rejects arbitrary operators and a default branch that charges resources', () => {
  const event = { id: 'test', title: '准备选择', classification: 'fictional', sourceIds: [], effectiveWindow: { from: '2020-01-01', to: '2020-12-31' }, scope: { binding: 'player', businessKind: null }, trigger: { op: 'all', conditions: [] }, priority: 1, exclusiveGroup: null, hiddenFactsPolicy: { mode: 'none', domain: 'opportunity' }, choices: [{ id: 'skip', label: '暂不开始', condition: { op: 'all', conditions: [] }, actionPoints: 0, costFen: 0, effects: [{ op: 'recordCause', text: '没有新承诺' }] }], defaultChoiceId: 'skip', followUpPolicy: 'explicit_effects', responseDays: 3, presentation: 'ordinary', pausesTime: true }
  const pack = { version: 'test-v1', sources: [], anchors: [], capabilities: [], entitlementIds: [], preparationKeys: [], events: [event], calendar: [], memories: [] }
  expect(loadContentPack(pack).events).toHaveLength(1)
  expect(() => loadContentPack({ ...pack, events: [{ ...event, trigger: { op: 'eval', code: 'process.exit()' } }] })).toThrow('INVALID_CONTENT_PACK')
  expect(() => loadContentPack({ ...pack, events: [{ ...event, choices: [{ ...event.choices[0], costFen: 1 }] }] })).toThrow('DEFAULT_REQUIRES_RESOURCES')
})

it('rejects a scope mismatch or foreign spending account before a run can start', () => {
  const pack = JSON.parse(JSON.stringify(fixturePack))
  pack.events[0].scope.binding = 'business'
  expect(() => createWorldFixture(pack)).toThrow('CONTENT_SCOPE_MISMATCH')
  pack.events[0].scope.binding = 'player'
  pack.events[0].choices[0].effects = [{ op: 'postLedgerTransaction', transaction: { kind: 'expense', accountId: 'another-player', counterpartyId: 'world', amountFen: 1 } }]
  expect(() => createWorldFixture(pack)).toThrow('EFFECT_ACCOUNT_NOT_BOUND')
  pack.events[0].choices[0].effects = [{ op: 'postLedgerTransaction', transaction: { kind: 'acquire_asset', accountId: '$owner', counterpartyId: 'world', investmentId: 'unqualified-equity', assetId: 'DeepSeek', classification: 'historical', amountFen: 1 } }]
  expect(() => loadContentPack(pack)).toThrow('INVALID_CONTENT_PACK')
})

it.each(['missing-default', 'unknown-preparation', 'missing-follow-up', 'unsafe-default', 'cycle', 'negative-priority', 'premature-completion', 'free-reveal'])('rejects an invalid authored pack before play: %s', (variant) => {
  const pack = JSON.parse(JSON.stringify(fixturePack))
  const event = pack.events[0]
  if (variant === 'missing-default') event.defaultChoiceId = 'missing'
  if (variant === 'unknown-preparation') event.trigger = { op: 'flagEquals', key: 'unregistered.path', value: true }
  if (variant === 'missing-follow-up') event.choices[0].effects = [{ op: 'scheduleEvent', definitionId: 'missing', delayDays: 1 }]
  if (variant === 'unsafe-default') event.choices[1].effects = [{ op: 'postLedgerTransaction', transaction: { kind: 'income', accountId: '$owner', counterpartyId: 'world', amountFen: 100 } }]
  if (variant === 'cycle') event.choices[0].effects = [{ op: 'scheduleEvent', definitionId: event.id, delayDays: 1 }]
  if (variant === 'negative-priority') event.priority = -2000
  if (variant === 'premature-completion') event.choices[0].effects = [{ op: 'startJob', durationDays: 7, capacityUnits: 1, onComplete: [] }, { op: 'recordPreparation', key: 'ready' }]
  if (variant === 'free-reveal') event.choices[0].actionPoints = 0
  expect(() => loadContentPack(pack)).toThrow()
})
