import {beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,projectRun} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {openingFocusFor,playerThread,type OpeningFocus} from './player-thread.ts'
import {todayThread,type TodayThreadInput} from './today-thread.ts'
import {dayPerspectiveCurrent} from './day-perspective.ts'
import {videoPaperFor} from './video-continuity.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {OpeningAttemptAction} from './OpeningAttemptAction.tsx'
import {DayThreadAction} from './DayThreadAction.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {RelayThreadAction} from './RelayThreadAction.tsx'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {CourseSceneChoice} from './CourseSceneChoice.tsx'
import {RelaySceneChoice} from './RelaySceneChoice.tsx'
import paidSource from '../../goal-1/evidence/t17-acceptance-03/video-matrix-r1/technical_employee-t16-campaign-2/affiliate-final.json?raw'

// Actual handlers and public models only; effects/DOM geometry/browser are not simulated.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 return {...actual,useEffect:()=>{},useId:()=> 'video-day-handler',useState:<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [hooks.values[index] as T,(value:T|((previous:T)=>T))=>{hooks.values[index]=typeof value==='function'?(value as (previous:T)=>T)(hooks.values[index] as T):value}]
 }}
})
const never=()=>{throw Error('READING_MUST_NOT_COMMAND')}
function history(name:string,source?:string){
 const codec=createCampaignCodec(),creation={runId:'u3-video-day-'+name,actorId:'player',commandId:'create-'+name,backgroundId:'technical_employee',seed:'u3-video-day-'+name,playerProfile:{wishId:'autonomy' as const,approach:'free' as const}}
 let run:GameRun=source?codec.import(source):createCampaignRun(creation)
 const p=():TodayThreadInput=>{const features=codec.registry.runtime!.project!(run);return {features:features as unknown as PlayFeatures,view:{...projectRun(run),features,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}}
 const send=(kind:string,payload:unknown)=>{
  const command={runId:run.runId,actorId:run.actorId,commandId:'u3-video-day-'+name+'-'+run.revision,expectedRevision:run.revision,kind,payload},result=evaluateCommand(run,command,codec.registry,run.actorId)
  expect(result.status,JSON.stringify({kind,payload,result})).toBe('proposed');if(result.status!=='proposed')throw Error('ORIGINAL_NORMAL_COMMAND_REQUIRED')
  run=codec.import(codec.export(result.nextRun))
 }
 const advance=(date:string,ready:()=>boolean=()=>p().view.date>=date)=>{for(let n=0;n<35;n++){
  const current=p(),w=current.features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(ready())return
  const boundary=w.progression.quarterTarget;send('AdvanceTime',{date:boundary&&boundary>current.view.date&&boundary<date?boundary:date})
 }throw Error('NORMAL_VIDEO_DAY_CLOCK_LIMIT')}
 return {codec,p,send,advance,raw:()=>codec.export(run)}
}
async function mounted(h:ReturnType<typeof history>,name:string){
 const store=new IndexedDbRunStore({codec:h.codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u3-video-day-'+name})
 const controller=new GameController({codec:h.codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(h.raw())
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:never}}
 return {controller,p,close:()=>controller.close()}
}
let publication:Awaited<ReturnType<typeof preparePublication>>|undefined,paid:ReturnType<typeof history>|undefined,quarter:Awaited<ReturnType<typeof prepareQuarter>>|undefined
async function preparePublication(){
 const h=history('publish');h.send('OpenVideoChannel',{name:'这份真实发布',segment:'local_merchants'})
 const channel=h.p().features.video!.channels[0]!
 h.send('StartVideoWork',{channelId:channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-02'})
 const work=h.p().features.video!.works[0]!
 h.advance(work.production!.completeAt,()=>h.p().features.video!.works[0]!.production!.status==='completed')
 h.send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'})
 return {...await mounted(h,'publish'),workId:work.id}
}
async function prepareQuarter(kind:'work'|'video'){
 const h=history('quarter-'+kind)
 if(kind==='work')h.send('WorkQuarter',{})
 else{h.send('OpenVideoChannel',{name:'跨季仍待完成的原作品',segment:'local_merchants'});h.send('StartVideoWork',{channelId:h.p().features.video!.channels[0]!.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-03-28'})}
 h.advance('2020-03-31',()=>h.p().features.workbench.atQuarterEnd)
 return mounted(h,'quarter-'+kind)
}
beforeEach(async({task})=>{
 publication=undefined;paid=undefined;quarter=undefined;hooks.values=[];hooks.index=0
 if(task.name==='leaves Today only after the actual original PublishVideo commit')publication=await preparePublication()
 if(task.name==='keeps the original paid platform history separate from an explicitly bounded unpaid display counterexample'){
  paid=history('paid-history',paidSource);expect(paid.p().view.origin).toBe('normal');paid.advance('2025-07-01')
 }
 if(task.name==='shares the quarter decision between the main control and original work object')quarter=await prepareQuarter('work')
 if(task.name==='shares the quarter decision between the main control and original video object')quarter=await prepareQuarter('video')
})

it('leaves Today only after the actual original PublishVideo commit',async()=>{
 if(!publication)throw Error('NORMAL_PUBLICATION_FIXTURE_REQUIRED')
 const h=publication
 try{
  const before=h.p(),perspective={runId:before.view.runId,revision:before.view.revision},raw=h.controller.exportSaved(),payload={workId:h.workId,monetization:'none',label:false},command=h.controller.prepare('PublishVideo',payload)
  expect(h.controller.preview(command).allowed).toBe(true)
  expect(dayPerspectiveCurrent(h.controller.snapshot.view!,perspective)).toBe(true)
  expect(h.controller.exportSaved()).toBe(raw)
  // The actual UI keeps the committed view during a candidate; this bounded view is not a saved publication.
  expect(dayPerspectiveCurrent({...before.view,hasCandidate:true,saveStatus:'unsaved'},perspective)).toBe(true)
  expect((await h.controller.submit(command)).status).toBe('saved')
  const current=h.p(),focus=openingFocusFor(current,'video',{videoTarget:{channelId:current.features.video!.works.find(work=>work.id===h.workId)!.channelId,workId:h.workId}})!
  expect(dayPerspectiveCurrent(current.view,perspective)).toBe(false)
  expect(current.features.video!.publications.find(row=>row.workId===h.workId)).toMatchObject({monetization:'none',measuredAt:null})
  expect(videoPaperFor(playerThread(current,focus))).toEqual({phase:'feedback'})
  expect(dayPerspectiveCurrent(current.view,{...perspective,runId:'other-life'})).toBe(false)
 }finally{await h.close()}
})

it('keeps the original paid platform history separate from an explicitly bounded unpaid display counterexample',()=>{
 if(!paid)throw Error('ORIGINAL_NORMAL_PAID_HISTORY_REQUIRED')
 const p=paid.p(),settlement=p.features.video!.settlements.find(row=>row.id==='vid:a0b73dcbaedf81be13435a0ba5492877')!,publication=p.features.video!.publications.find(row=>row.id===settlement.publicationId)!,raw=paid.raw()
 expect(settlement).toMatchObject({amountFen:9000,feeFen:450,collectedAt:'2025-05-06'})
 const focus=openingFocusFor(p,'video',{videoTarget:{channelId:settlement.channelId,workId:publication.workId,section:'publications'}})!
 expect(todayThread(p,focus)!.primary.classification).toBe('history')
 expect(todayThread(p,focus)!.ongoing.some(row=>row.focus.entityId===publication.workId)).toBe(false)
 expect(videoPaperFor(playerThread(p,focus))).toEqual({phase:'history'})
 // Public-model counterexample only. Cash, permissions and original raw are untouched;
 // this is never imported or represented as a new legitimate financial state.
 const variant:TodayThreadInput={...p,features:{...p.features,video:{...p.features.video!,settlements:p.features.video!.settlements.map(row=>row.id===settlement.id?{...row,collectedAt:null}:row)}}}
 const pending=todayThread(variant,focus)!,thread=playerThread(variant,focus)
 expect(pending.primary.classification).toBe('carry')
 expect(pending.ongoing.find(row=>row.focus.entityId===publication.workId)).toMatchObject({classification:'carry',focus:{accountId:focus.accountId}})
 expect(thread).toMatchObject({stage:'video-platform-collect',outcome:'pending',command:{kind:'CollectVideoSettlement',payload:{settlementId:settlement.id}}})
 expect(videoPaperFor(thread)).toEqual({phase:'settlement'})
 expect(paid.raw()).toBe(raw)
})

type Element=ReactElement<Record<string,unknown>>
const wrappers=new Set<unknown>([MarketSceneChoice,VideoSceneChoice,CourseSceneChoice,RelaySceneChoice])
const actionWrappers=new Set<unknown>([OpeningAttemptAction,DayThreadAction,VideoThreadAction,CourseThreadAction,RelayThreadAction])
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(value))return []
 if(wrappers.has(value.type)&&typeof value.props.children==='function')return elements(value.props.children(()=>{}))
 // Preserve the real wrapper's active/inactive contract and shared action;
 // do not invent a primary node just to make the quarter lookup succeed.
 if(actionWrappers.has(value.type)&&typeof value.type==='function'){
  const action=value.type as (props:Record<string,unknown>)=>unknown
  return elements(action(value.props))
 }
 return [value,...elements(value.props.children)]
}
function text(value:unknown):string{return typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
it.each(['work','video'] as const)('shares the quarter decision between the main control and original %s object',async kind=>{
 if(!quarter)throw Error('NORMAL_QUARTER_FIXTURE_REQUIRED')
 const h=quarter
 try{
  const p=h.p(),focus:OpeningFocus=kind==='work'?{runId:p.view.runId,accountId:'personal',kind:'work',entityId:p.view.operations!.employment[0]!.id}:openingFocusFor(p,'video',{videoTarget:{channelId:p.features.video!.works[0]!.channelId,workId:p.features.video!.works[0]!.id}})!,onRecollection=vi.fn(),raw=h.controller.exportSaved()
  expect(p.features.workbench.atQuarterEnd).toBe(true)
  const render=(props:GamePanelProps)=>{hooks.index=0;return OpeningMoment({p:props,headingRef:null,fallback:roomMoment(props),focus,onFocus:never,onNavigate:never,onExplore:never,onRecollection})}
  const nodes=elements(render(p)),main=nodes.find(node=>node.type==='button'&&text(node.props.children).includes('看看这一季，真实留下了什么'))!,object=nodes.find(node=>node.type===OpeningObject)!
  expect(main).toBeDefined();expect(main.props.onClick).toBe(object.props.onActivate)
  expect(main.props.disabled).toBe(false);expect(object.props.disabled).toBe(false)
  if(typeof main.props.onClick!=='function')throw Error('ORIGINAL_QUARTER_HANDLER_REQUIRED')
  main.props.onClick();expect(onRecollection).toHaveBeenCalledTimes(1)
  if(typeof object.props.onActivate!=='function')throw Error('ORIGINAL_OBJECT_HANDLER_REQUIRED')
  object.props.onActivate();expect(onRecollection).toHaveBeenCalledTimes(2)
  const candidate={...p,view:{...p.view,hasCandidate:true,saveStatus:'unsaved' as const}},blocked=elements(render(candidate)),blockedMain=blocked.find(node=>node.type==='button'&&text(node.props.children).includes('看看这一季，真实留下了什么'))!,blockedObject=blocked.find(node=>node.type===OpeningObject)!
  expect(blockedMain.props.disabled).toBe(true);expect(blockedObject.props.disabled).toBe(true)
  expect(blockedMain.props.onClick).toBe(blockedObject.props.onActivate)
  if(typeof blockedMain.props.onClick!=='function')throw Error('PROTECTED_QUARTER_HANDLER_REQUIRED')
  blockedMain.props.onClick();expect(onRecollection).toHaveBeenCalledTimes(2)
  expect(candidate.view).toMatchObject({runId:p.view.runId,revision:p.view.revision,date:p.view.date})
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{hooks.values=[];await h.close()}
})
