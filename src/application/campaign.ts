import { z } from 'zod'
import { createInitialRun } from './bootstrap.ts'
import { BOOTSTRAP_CONTENT, BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { CAMPAIGN_CONTENT } from '../content/campaign.ts'
import { WorldRuntime } from '../core/world.ts'
import { createBaseRegistry, defineCommand } from '../core/commands.ts'
import { createGameRun } from '../core/run.ts'
import { hashValue } from '../core/hash.ts'
import { requireRule } from '../core/errors.ts'
import { idSchema } from '../core/record-schemas.ts'
import type { CreateRunInput, RuleModel, VersionSet } from '../core/run-types.ts'
import { RunCodec } from '../persistence/codec.ts'

export const campaignRuntime = new WorldRuntime(CAMPAIGN_CONTENT)
export const CAMPAIGN_VERSIONS: VersionSet = { ...BOOTSTRAP_VERSIONS, rulesVersion: 'rules-t05-world-v1', contentVersion: campaignRuntime.pack.version, contentHash: hashValue({ bootstrap: BOOTSTRAP_CONTENT, pack: campaignRuntime.pack }) }
const allowed = () => ({ allowed: true, reasonCodes: [], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 })

export function createCampaignRegistry(runtime: WorldRuntime = campaignRuntime, versions: VersionSet = CAMPAIGN_VERSIONS) {
  const choose = defineCommand('ChooseEvent', z.strictObject({ instanceId: idSchema, choiceId: idSchema }), (view, payload) => runtime.inspect(view, payload.instanceId, payload.choiceId, view.date), (model, payload) => ({ model: runtime.choose(model, payload.instanceId, payload.choiceId), summary: '事件选择已处理', domain: 'content' }))
  const defer = defineCommand('DeferEventDecision', z.strictObject({ instanceId: idSchema }), (view, payload) => {
    const instance = view.world?.instances.find((item) => item.id === payload.instanceId)
    requireRule(instance?.status === 'pending' && view.pause?.instanceId === instance.openedBy && view.pause.reason === 'CONTENT_DECISION_PENDING', 'EVENT_NOT_PAUSED')
    return allowed()
  }, (model, payload) => ({ model: runtime.defer(model, payload.instanceId), summary: '暂缓处理，期限仍有效，届时执行默认分支', domain: 'content' }))
  const interrupt = defineCommand('InterruptPreparation', z.strictObject({ jobId: idSchema }), (view, payload) => { requireRule(view.world?.jobs.some((job) => job.id === payload.jobId && job.status === 'running'), 'JOB_NOT_RUNNING'); return allowed() }, (model, payload) => ({ model: runtime.interrupt(model, payload.jobId), summary: '准备任务已中断，已发生成本保留', domain: 'content' }))
  const read = defineCommand('ReadNews', z.strictObject({ anchorId: idSchema }), (view, payload) => { requireRule(view.world?.anchors.some((anchor) => anchor.id === payload.anchorId), 'NEWS_NOT_YET_OCCURRED'); return allowed() }, (model, payload) => { requireRule(model.world, 'WORLD_NOT_CONFIGURED'); return { model: { ...model, world: { ...model.world, newsRead: [...new Set([...model.world.newsRead, payload.anchorId])] } }, summary: '新闻阅读状态已记录', domain: 'notes' } })
  const favorite = defineCommand('FavoriteMemory', z.strictObject({ memoryId: idSchema, favorite: z.boolean() }), (view, payload) => { requireRule(view.world && runtime.pack.memories.some((memory) => memory.id === payload.memoryId), 'UNKNOWN_MEMORY'); return allowed() }, (model, payload) => { requireRule(model.world, 'WORLD_NOT_CONFIGURED'); return { model: { ...model, world: { ...model.world, favoriteMemories: payload.favorite ? [...new Set([...model.world.favoriteMemories, payload.memoryId])] : model.world.favoriteMemories.filter((id) => id !== payload.memoryId) } }, summary: '记忆收藏已更新', domain: 'notes' } })
  return createBaseRegistry(versions, [choose, defer, interrupt, read, favorite], runtime)
}

export function createCampaignRun(input: CreateRunInput) {
  const base = createInitialRun(input)
  const world = campaignRuntime.initialWorld([{ id: 'player', kind: 'player', accountId: 'personal', businessId: null, route: null, contractId: null, personId: null, capacityUnits: 1 }], input.backgroundId)
  const model: RuleModel = campaignRuntime.schedule({ ...base, world })
  const run = createGameRun(input, { origin: 'normal', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: model.economy, timeline: model.timeline, world }, CAMPAIGN_VERSIONS)
  campaignRuntime.validate(run)
  return run
}
export function createCampaignCodec() { return new RunCodec(createCampaignRegistry(), BOOTSTRAP_CONTENT.profiles.map((profile) => profile.id)) }
