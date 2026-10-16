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
import type { CreateRunInput, RuleModel, VersionSet,GameRun } from '../core/run-types.ts'
import { RunCodec } from '../persistence/codec.ts'
import { OPERATIONS_CONTENT } from '../content/operations.ts'
import { OperationsRuntime } from '../core/operations.ts'
import { createFirstOrderHandler,projectFirstOrder } from './first-order.ts'
import { FIRST_ORDER } from '../content/first-order.ts'
import { createOperatingHandlers } from './operations-commands.ts'
import type { CommandHandler } from '../core/commands.ts'
import { MarketRuntime } from '../core/market.ts'
import { MARKET_CONTENT } from '../content/market.ts'
import { createMarketHandlers } from './market-commands.ts'
import { projectMarket } from '../core/market-projection.ts'
import type { RuntimeExtension } from '../core/operations-types.ts'
import { projectWorkbench } from './workbench-projection.ts'

export function composeCampaignRuntime(pack:unknown,catalog:unknown,marketCatalog?:unknown){
 const operations:OperationsRuntime=new OperationsRuntime(catalog,(model,id,date):readonly string[]=>runtime.capabilityReasons(model,'player',id,date));const market=marketCatalog===undefined?null:new MarketRuntime(marketCatalog)
 const extension:RuntimeExtension={reduce:(state,event)=>event.payload.kind==='market_event'?(requireRule(market,'MARKET_HANDLER_REQUIRED'),market.reduce(state,event)):operations.reduce(state,event),capacityAvailable:operations.capacityAvailable.bind(operations),validate:(run)=>{operations.validate(run);if(market)market.validate(run);else requireRule(run.market===null,'MARKET_HANDLER_REQUIRED')}}
 const runtime:WorldRuntime=new WorldRuntime(pack,extension);requireRule(operations.catalog.businesses.every(b=>b.capabilities.every(id=>runtime.pack.capabilities.some(c=>c.id===id))&&(b.preparationKey===null||runtime.pack.preparationKeys.includes(b.preparationKey))),'INVALID_OPERATING_QUALIFICATION_REFERENCE');requireRule(operations.catalog.offers.every(o=>o.caseKey===null||runtime.pack.preparationKeys.includes(o.caseKey)),'INVALID_CONTRACT_CASE_REFERENCE');return {runtime,operations,market}
}
const composition=composeCampaignRuntime(CAMPAIGN_CONTENT,OPERATIONS_CONTENT,MARKET_CONTENT)
export const campaignRuntime=composition.runtime
export const campaignOperations=composition.operations
export const campaignMarket=composition.market!
export const CAMPAIGN_VERSIONS: VersionSet = { ...BOOTSTRAP_VERSIONS, rulesVersion: 'rules-t09-playable-v1', contentVersion: 'world-playable-work-v1', contentHash: hashValue({ bootstrap: BOOTSTRAP_CONTENT, pack: campaignRuntime.pack, operations:campaignOperations.catalog,firstOrder:FIRST_ORDER,market:campaignMarket.catalog }) }
const allowed = () => ({ allowed: true, reasonCodes: [], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 })

export function createCampaignRegistry(runtime: WorldRuntime = campaignRuntime, versions: VersionSet = CAMPAIGN_VERSIONS, extra:readonly CommandHandler[]=runtime===campaignRuntime?[...createOperatingHandlers(campaignOperations),createFirstOrderHandler(campaignOperations,campaignRuntime),...createMarketHandlers(campaignMarket)]:[]) {
  const choose = defineCommand('ChooseEvent', z.strictObject({ instanceId: idSchema, choiceId: idSchema }), (view, payload) => runtime.inspect(view, payload.instanceId, payload.choiceId, view.date), (model, payload) => ({ model: runtime.choose(model, payload.instanceId, payload.choiceId), summary: '事件选择已处理', domain: 'content' }))
  const defer = defineCommand('DeferEventDecision', z.strictObject({ instanceId: idSchema }), (view, payload) => {
    const instance = view.world?.instances.find((item) => item.id === payload.instanceId)
    requireRule(instance?.status === 'pending' && view.pause?.instanceId === instance.openedBy && view.pause.reason === 'CONTENT_DECISION_PENDING', 'EVENT_NOT_PAUSED')
    return allowed()
  }, (model, payload) => ({ model: runtime.defer(model, payload.instanceId), summary: '暂缓处理，期限仍有效，届时执行默认分支', domain: 'content' }))
  const interrupt = defineCommand('InterruptPreparation', z.strictObject({ jobId: idSchema }), (view, payload) => { requireRule(view.world?.jobs.some((job) => job.id === payload.jobId && job.status === 'running'), 'JOB_NOT_RUNNING'); return allowed() }, (model, payload) => ({ model: runtime.interrupt(model, payload.jobId), summary: '准备任务已中断，已发生成本保留', domain: 'content' }))
  const read = defineCommand('ReadNews', z.strictObject({ anchorId: idSchema }), (view, payload) => { requireRule(view.world?.anchors.some((anchor) => anchor.id === payload.anchorId), 'NEWS_NOT_YET_OCCURRED'); return allowed() }, (model, payload) => { requireRule(model.world, 'WORLD_NOT_CONFIGURED'); return { model: { ...model, world: { ...model.world, newsRead: [...new Set([...model.world.newsRead, payload.anchorId])] } }, summary: '新闻阅读状态已记录', domain: 'notes' } })
  const favorite = defineCommand('FavoriteMemory', z.strictObject({ memoryId: idSchema, favorite: z.boolean() }), (view, payload) => { requireRule(view.world && runtime.pack.memories.some((memory) => memory.id === payload.memoryId), 'UNKNOWN_MEMORY'); return allowed() }, (model, payload) => { requireRule(model.world, 'WORLD_NOT_CONFIGURED'); return { model: { ...model, world: { ...model.world, favoriteMemories: payload.favorite ? [...new Set([...model.world.favoriteMemories, payload.memoryId])] : model.world.favoriteMemories.filter((id) => id !== payload.memoryId) } }, summary: '记忆收藏已更新', domain: 'notes' } })
  const registryRuntime=runtime===campaignRuntime?{advance:runtime.advance.bind(runtime),validate:runtime.validate.bind(runtime),project:(run:GameRun)=>({firstOrder:projectFirstOrder(run),market:projectMarket(run,campaignMarket.catalog),workbench:projectWorkbench(run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog)})}:runtime
  return createBaseRegistry(versions, [choose, defer, interrupt, read, favorite,...extra], registryRuntime)
}

export function createCampaignRun(input: CreateRunInput) {
  const base = createInitialRun(input)
  const world = campaignRuntime.initialWorld([{ id: 'player', kind: 'player', accountId: 'personal', businessId: null, route: null, contractId: null, personId: null, capacityUnits: 1 }], input.backgroundId)
  const operations=campaignOperations.initial(input.backgroundId)
  const market=campaignMarket.initial()
  const model: RuleModel = campaignMarket.schedule(campaignOperations.scheduleOffers(campaignRuntime.schedule({ ...base, world,operations,market })))
  const run = createGameRun(input, { origin: 'normal', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: model.economy, timeline: model.timeline, world,operations,market }, CAMPAIGN_VERSIONS)
  campaignRuntime.validate(run)
  return run
}
export function createCampaignCodec() { return new RunCodec(createCampaignRegistry(), BOOTSTRAP_CONTENT.profiles.map((profile) => profile.id)) }
