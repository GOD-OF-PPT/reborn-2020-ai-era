import oldSave from '../../goal-1/evidence/t04-save-initial.json?raw'
import { expect, it } from 'vitest'
import { createCampaignRun, createCampaignRegistry, createCampaignCodec } from '../application/campaign.ts'
import { evaluateCommand } from '../core/commands.ts'
import { hashValue } from '../core/hash.ts'

const registry = createCampaignRegistry()
const codec = createCampaignCodec()
const initial = createCampaignRun({ runId: 'world-codec', actorId: 'player', commandId: 'create-codec', seed: 'world-codec-seed', backgroundId: 'technical_employee' })
it.each(['missing-anchor', 'missing-calendar', 'missing-deadline', 'foreign-binding', 'forged-access', 'unknown-field', 'removed-world'])('rejects a resigned invalid world save: %s', (variant) => {
  const result = evaluateCommand(initial, { runId: initial.runId, actorId: 'player', commandId: 'advance', expectedRevision: 1, kind: 'AdvanceTime', payload: { date: '2020-01-22' } }, registry, 'player')
  if (result.status !== 'proposed') throw new Error('proposal expected')
  const raw = JSON.parse(codec.export(result.nextRun))
  if (variant === 'missing-anchor') raw.state.timeline.pending = raw.state.timeline.pending.filter((event: { instanceId: string }) => event.instanceId !== 'anchor:H002')
  if (variant === 'missing-calendar') raw.state.timeline.pending = raw.state.timeline.pending.filter((event: { instanceId: string }) => event.instanceId !== 'calendar:PREP-API')
  if (variant === 'missing-deadline') raw.state.timeline.pending = raw.state.timeline.pending.filter((event: { payload: { kind: string } }) => event.payload.kind !== 'expire_content_event')
  if (variant === 'foreign-binding') raw.state.world.instances[0].bindingId = 'another-player'
  if (variant === 'forged-access') raw.state.world.entitlements.push({ id: 'api_beta_access', bindingId: 'player', acquiredAt: '2020-01-01', expiresAt: null, sourceEventId: 'bootstrap:profile' })
  if (variant === 'unknown-field') raw.state.world.evaluate = 'not code'
  if (variant === 'removed-world') raw.state.world = null
  const { checksum: ignored, ...body } = raw
  expect(ignored).toBeTruthy()
  raw.checksum = hashValue(body)
  expect(() => codec.import(JSON.stringify(raw))).toThrow()
  expect(codec.import(codec.export(initial))).toEqual(initial)
})
it('explicitly refuses the preserved T04 schema', () => {
  expect(() => codec.import(oldSave)).toThrow('UNSUPPORTED_SCHEMA_VERSION')
})
