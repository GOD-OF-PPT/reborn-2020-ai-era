import {StoryRuntime} from '../core/story.ts'
import {createStoryHandlers} from './story-commands.ts'
import {projectStory} from '../core/story-projection.ts'
import {DeepseekRuntime} from '../core/deepseek.ts'
import {createDeepseekHandlers} from './deepseek-commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {projectRoutines} from '../core/routine-projection.ts'
import {RoutineRuntime} from '../core/routines.ts'
import {createRoutineHandlers} from './routine-commands.ts'
import { RelayRuntime } from '../core/relay.ts'
import {createRelayHandlers} from './relay-commands.ts'
import { CourseRuntime } from '../core/course.ts'
import { createCourseHandlers } from './course-commands.ts'
import { projectCourse } from '../core/course-projection.ts'
import { VideoRuntime } from '../core/video.ts'
import { createVideoHandlers } from './video-commands.ts'
import { projectVideo } from '../core/video-projection.ts'
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

export function composeCampaignRuntime(pack:unknown,catalog:unknown,marketCatalog?:unknown,withVideo:unknown=false,withCourse:unknown=false,withRelay:unknown=false,withRoutines:boolean=false,withDeepseek:unknown=false,withStory:boolean=false){
 const operations:OperationsRuntime=new OperationsRuntime(catalog,(model,id,date)=>runtime.capabilityReasons(model,'player',id,date),(model,id,from,to,jobId,businessId)=>{story?.jobConstraint(model,id,from,to,jobId,businessId);video?.jobConstraint(model,id,from,to);course?.jobConstraint(model,id,from,to);relay?.jobConstraint(model,id,from,to)},(model,id)=>{video?.closeConstraint(model,id);course?.closeConstraint(model,id);relay?.closeConstraint(model,id);deepseek?.closeConstraint(model,id);story?.closeConstraint(model,id)},(model,date)=>syncRoutes(model,date))
 const video=withVideo?new VideoRuntime(operations,(model,id,date)=>runtime.capabilityReasons(model,'player',id,date),withVideo===true?undefined:withVideo):null,market=marketCatalog===undefined?null:new MarketRuntime(marketCatalog)
 const course=withCourse?(requireRule(video,'COURSE_VIDEO_RUNTIME_REQUIRED'),new CourseRuntime(operations,video,(model,id,date)=>runtime.capabilityReasons(model,'player',id,date),withCourse===true?undefined:withCourse)):null
 const relay=withRelay?(requireRule(video,'RELAY_VIDEO_RUNTIME_REQUIRED'),new RelayRuntime(operations,video,(model,id,date)=>runtime.capabilityReasons(model,'player',id,date),withRelay===true?undefined:withRelay)):null
 const deepseek=withDeepseek?(requireRule(video,'DEEPSEEK_VIDEO_RUNTIME_REQUIRED'),new DeepseekRuntime(operations,video,(model,id,date)=>runtime.capabilityReasons(model,'player',id,date),withDeepseek===true?undefined:withDeepseek)):null
 function syncRoutes(model:import('../core/operations-types.ts').OperatingModel,date:string){let next=video?.sync(model,date)??model;next=course?.sync(next,date)??next;next=relay?.sync(next,date)??next;next=deepseek?.sync(next,date)??next;return story?.synchronize(next,date)??next}
 const story=withStory?new StoryRuntime(operations):null
 const extension:RuntimeExtension={worldUpdated:(state,event)=>{let current=state;const newEvents:import('../core/timeline.ts').ScheduledEvent<import('../core/content-types.ts').RunOperation>[]=[];const updates:NonNullable<RuntimeExtension['worldUpdated']>[]=[...(course?[course.worldUpdated.bind(course)]:[]),...(relay?[relay.worldUpdated.bind(relay)]:[]),...(story?[story.worldUpdated.bind(story)]:[])];for(const update of updates){const result=update(current,event);current=result.state;newEvents.push(...result.newEvents??[])}return {state:current,newEvents}},reduce:(state,event)=>event.payload.kind==='story_event'?(requireRule(story,'STORY_HANDLER_REQUIRED'),story.reduce(state,event)):event.payload.kind==='deepseek_event'?(requireRule(deepseek,'DEEPSEEK_HANDLER_REQUIRED'),deepseek.reduce(state,event)):event.payload.kind==='relay_event'?(requireRule(relay,'RELAY_HANDLER_REQUIRED'),relay.reduce(state,event)):event.payload.kind==='course_event'?(requireRule(course,'COURSE_HANDLER_REQUIRED'),course.reduce(state,event)):event.payload.kind==='video_event'?(requireRule(video,'VIDEO_HANDLER_REQUIRED'),video.reduce(state,event)):event.payload.kind==='market_event'?(requireRule(market,'MARKET_HANDLER_REQUIRED'),market.reduce(state,event)):(()=>{const result=operations.reduce(state,event);return {...result,state:syncRoutes(result.state,event.date)}})(),hasEntitlement:(state,bindingId,id,date)=>(video?.hasEntitlement(state,bindingId,id,date)??false)||(relay?.hasEntitlement(state,bindingId,id,date)??false)||(deepseek?.hasEntitlement(state,bindingId,id,date)??false),capacityAvailable:operations.capacityAvailable.bind(operations),validate:(run)=>{operations.validate(run);if(story)story.validate(run);else requireRule(run.story===null,'STORY_HANDLER_REQUIRED');if(routine)routine.validate(run);else requireRule(run.routines===null,'ROUTINE_HANDLER_REQUIRED');if(deepseek)deepseek.validate(run);else requireRule(run.deepseek===null,'DEEPSEEK_HANDLER_REQUIRED');if(relay)relay.validate(run);else requireRule(run.relay===null,'RELAY_HANDLER_REQUIRED');if(course)course.validate(run);else requireRule(run.course===null,'COURSE_HANDLER_REQUIRED');if(video)video.validate(run);else requireRule(run.video===null,'VIDEO_HANDLER_REQUIRED');if(market)market.validate(run);else requireRule(run.market===null,'MARKET_HANDLER_REQUIRED')}}
 const runtime:WorldRuntime=new WorldRuntime(pack,extension),routine=withRoutines?new RoutineRuntime(operations,relay,runtime,[...createOperatingHandlers(operations),...(course?createCourseHandlers(course):[]),...(relay?createRelayHandlers(relay):[])]):null
 requireRule(operations.catalog.businesses.every(b=>b.capabilities.every(id=>runtime.pack.capabilities.some(c=>c.id===id))&&(b.preparationKey===null||runtime.pack.preparationKeys.includes(b.preparationKey))),'INVALID_OPERATING_QUALIFICATION_REFERENCE');requireRule(operations.catalog.offers.every(o=>o.caseKey===null||runtime.pack.preparationKeys.includes(o.caseKey)),'INVALID_CONTRACT_CASE_REFERENCE');return {runtime,operations,market,video,course,relay,routine,deepseek,story}
}
const composition=composeCampaignRuntime(CAMPAIGN_CONTENT,OPERATIONS_CONTENT,MARKET_CONTENT,true,true,true,true,true,true)
export const campaignStory=composition.story!
export const campaignDeepseek=composition.deepseek!
export const campaignRoutine=composition.routine!
export const campaignRelay=composition.relay!
export const campaignCourse=composition.course!
export const campaignVideo=composition.video!
export const campaignRuntime=composition.runtime
export const campaignOperations=composition.operations
export const campaignMarket=composition.market!
export const CAMPAIGN_VERSIONS: VersionSet = { ...BOOTSTRAP_VERSIONS, rulesVersion: 'rules-t14-story-v1', contentVersion: 'world-story-work-v1', contentHash: hashValue({ bootstrap: BOOTSTRAP_CONTENT, pack: campaignRuntime.pack, operations:campaignOperations.catalog,firstOrder:FIRST_ORDER,market:campaignMarket.catalog,video:campaignVideo.catalog,course:campaignCourse.catalog,relay:campaignRelay.catalog,routines:campaignRoutine.catalog,deepseek:campaignDeepseek.catalog,story:campaignStory.catalog }) }
const allowed = () => ({ allowed: true, reasonCodes: [], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 })

export function createCampaignRegistry(runtime: WorldRuntime = campaignRuntime, versions: VersionSet = CAMPAIGN_VERSIONS, extra:readonly CommandHandler[]=runtime===campaignRuntime?[...createOperatingHandlers(campaignOperations),createFirstOrderHandler(campaignOperations,campaignRuntime),...createMarketHandlers(campaignMarket),...createVideoHandlers(campaignVideo),...createCourseHandlers(campaignCourse),...createRelayHandlers(campaignRelay),...createRoutineHandlers(campaignRoutine,versions),...createDeepseekHandlers(campaignDeepseek),...createStoryHandlers(campaignStory)]:[]) {
  const choose = defineCommand('ChooseEvent', z.strictObject({ instanceId: idSchema, choiceId: idSchema }), (view, payload) => runtime.inspect(view, payload.instanceId, payload.choiceId, view.date), (model, payload) => ({ model: runtime.choose(model, payload.instanceId, payload.choiceId), summary: '事件选择已处理', domain: 'content' }))
  const defer = defineCommand('DeferEventDecision', z.strictObject({ instanceId: idSchema }), (view, payload) => {
    const instance = view.world?.instances.find((item) => item.id === payload.instanceId)
    requireRule(instance?.status === 'pending' && view.pause?.instanceId === instance.openedBy && view.pause.reason === 'CONTENT_DECISION_PENDING', 'EVENT_NOT_PAUSED')
    return allowed()
  }, (model, payload) => ({ model: runtime.defer(model, payload.instanceId), summary: '暂缓处理，期限仍有效，届时执行默认分支', domain: 'content' }))
  const interrupt = defineCommand('InterruptPreparation', z.strictObject({ jobId: idSchema }), (view, payload) => { requireRule(view.world?.jobs.some((job) => job.id === payload.jobId && job.status === 'running'), 'JOB_NOT_RUNNING'); return allowed() }, (model, payload) => ({ model: runtime.interrupt(model, payload.jobId), summary: '准备任务已中断，已发生成本保留', domain: 'content' }))
  const read = defineCommand('ReadNews', z.strictObject({ anchorId: idSchema }), (view, payload) => { requireRule(view.world?.anchors.some((anchor) => anchor.id === payload.anchorId), 'NEWS_NOT_YET_OCCURRED'); return allowed() }, (model, payload) => { requireRule(model.world, 'WORLD_NOT_CONFIGURED'); return { model: { ...model, world: { ...model.world, newsRead: [...new Set([...model.world.newsRead, payload.anchorId])] } }, summary: '新闻阅读状态已记录', domain: 'notes' } })
  const favorite = defineCommand('FavoriteMemory', z.strictObject({ memoryId: idSchema, favorite: z.boolean() }), (view, payload) => { requireRule(view.world && runtime.pack.memories.some((memory) => memory.id === payload.memoryId), 'UNKNOWN_MEMORY'); return allowed() }, (model, payload) => { requireRule(model.world, 'WORLD_NOT_CONFIGURED'); return { model: { ...model, world: { ...model.world, favoriteMemories: payload.favorite ? [...new Set([...model.world.favoriteMemories, payload.memoryId])] : model.world.favoriteMemories.filter((id) => id !== payload.memoryId) } }, summary: '记忆收藏已更新', domain: 'notes' } })
  const registryRuntime=runtime===campaignRuntime?{advance:runtime.advance.bind(runtime),validate:runtime.validate.bind(runtime),guard:campaignStory.guard.bind(campaignStory),project:(run:GameRun)=>({story:projectStory(run,campaignStory),deepseek:projectDeepseek(run,campaignDeepseek),relay:projectRelay(run,campaignRelay),routines:projectRoutines(run,campaignRoutine),course:projectCourse(run,campaignCourse),video:projectVideo(run,campaignVideo),firstOrder:projectFirstOrder(run),market:projectMarket(run,campaignMarket.catalog),workbench:projectWorkbench(run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog)})}:runtime
  return createBaseRegistry(versions, [choose, defer, interrupt, read, favorite,...extra], registryRuntime)
}

export function createCampaignRun(input: CreateRunInput) {
  const base = createInitialRun(input)
  const world = campaignRuntime.initialWorld([{ id: 'player', kind: 'player', accountId: 'personal', businessId: null, route: null, contractId: null, personId: null, capacityUnits: 1 }], input.backgroundId)
  const operations=campaignOperations.initial(input.backgroundId)
  const market=campaignMarket.initial()
  const video=campaignVideo.initial(input.seed)
  const course=campaignCourse.initial()
  const relay=campaignRelay.initial()
  const routines=campaignRoutine.initial()
  const deepseek=campaignDeepseek.initial()
 const story=campaignStory.initial()
  const model: RuleModel = campaignStory.schedule(campaignMarket.schedule(campaignOperations.scheduleOffers(campaignRuntime.schedule({ ...base, world,operations,market,video,course,relay,routines,deepseek,story }))))
  const run = createGameRun(input, { origin: 'normal', personalAccountId: 'personal', controlledAccountIds: ['personal'], economy: model.economy, timeline: model.timeline, world,operations,market,video,course,relay,routines,deepseek,story }, CAMPAIGN_VERSIONS)
  campaignRuntime.validate(run)
  return run
}
export function createCampaignCodec() { return new RunCodec(createCampaignRegistry(), BOOTSTRAP_CONTENT.profiles.map((profile) => profile.id)) }
