import {afterEach,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {videoFirstAttemptReading} from './video-first-attempt.ts'
import {videoAccountAttemptReading,videoChannelAttemptReading} from './video-account-attempt.ts'
import {VideoFirstAttemptAction} from './VideoFirstAttemptAction.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {addDays,quarterOf} from '../core/calendar.ts'
import {dayBefore,quarterLimit} from '../core/operations-calendar.ts'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {VideoFirstAccountForm} from './VideoFirstAccountForm.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {Dialog} from './Dialog.tsx'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {type VideoSceneTarget} from './video-scene-progress.ts'

// Normal in-memory gameplay and local React callbacks; no store, codec,
// controller submission, import/export, failure injection or reload checks.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=> 'first-video-ui'}
})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
function elements(v:unknown):Element[]{
 if(Array.isArray(v))return v.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(v))return []
 const rows=[v,...elements(v.props.children),...elements(v.props.footer)]
 if(v.type===VideoFirstAccountForm)rows.push(...elements(v.props.audience),...elements(v.props.nameField),...elements(v.props.terms))
 return rows
}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'first-video-ui',actorId:'player',commandId:'create',seed:'first-video-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:Record<string,unknown>){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'first-video-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind);return result.nextRun}
const one=act(initial,'OpenVideoChannel',{name:'本地日常',segment:'local_merchants'})
function input(run=initial):GamePanelProps{
 const projected=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {view,features:projected as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}
}
function driver(run=initial,initialTarget?:VideoSceneTarget,change?:(p:GamePanelProps)=>GamePanelProps){
 const base=input(run),p=change?.(base)??base;Object.assign(p.controller.snapshot,{view:p.view})
 let target=initialTarget
 let activate:((intent?:'select-account'|'channel')=>void)|undefined
 const onTarget=vi.fn((next:VideoSceneTarget)=>{target=next}),inspect=vi.fn()
 const render=()=>{hooks.index=0;return elements(VideoSceneChoice({p,...(target?{target}:{}),onTargetChange:onTarget,onInspect:inspect,children:fn=>{activate=fn;return null}}))}
 const click=(label:string)=>{const rows=render(),dialog=rows.find(n=>n.type===Dialog),scope=dialog?elements(dialog):rows,node=scope.find(n=>n.type==='button'&&words(n.props.children)===label);if(!node||node.props.disabled||typeof node.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);node.props.onClick()}
 const fill=(value:string)=>{const node=render().find(n=>n.type==='input'&&!n.props.type)!;if(!node||typeof node.props.onChange!=='function')throw Error('NAME_FIELD_REQUIRED');node.props.onChange({target:{value}})}
 const audience=(index:number)=>{const node=render().filter(n=>n.type==='input'&&String(n.props.name).endsWith('segment'))[index]!;(node.props.onChange as ()=>void)()}
 render();return {p,onTarget,inspect,render,click,fill,audience,open:(intent?:'select-account'|'channel')=>{render();activate!(intent)},dialog:()=>render().find(n=>n.type===Dialog)}
}


function advance(run:GameRun,date:string){for(let n=0;n<12&&run.timeline.cursor.date<date;n++)run=act(run,'AdvanceTime',{date});expect(run.timeline.cursor.date).toBe(date);return run}
function career(run:GameRun,target:string){for(let n=0;n<600;n++){const p=input(run),w=p.features.workbench,date=p.view.date;if(w.pause){if(w.pause.reason!=='CONTENT_DECISION_PENDING')throw Error('UNHANDLED_NORMAL_PAUSE:'+w.pause.reason);const e=w.events.find(e=>e.isBlocking),choice=e?.choices.find(c=>c.isDefault);if(!e||!choice||choice.costFen!==0||choice.actionPoints!==0)throw Error('PUBLIC_ZERO_DEFAULT_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:choice.id});continue}const limit=quarterLimit(date),employed=p.view.operations?.employment.some(e=>e.quarter===quarterOf(date)&&e.segments.some(s=>s.to===null));if(!employed&&date<dayBefore(limit)&&p.view.budget.available>=2){run=act(run,'WorkQuarter',{});continue}if(date===target&&run.timeline.cursor.phase==='snapshot')return run;run=act(run,'AdvanceTime',{date:target<limit?target:date===dayBefore(limit)?limit:dayBefore(limit)})}throw Error('NORMAL_CAREER_BOUND')}
let bare:GameRun,pending:GameRun,unread:GameRun,prepared:GameRun,working:GameRun,channelId:string
beforeAll(()=>{
 let r=act(initial,'StartFirstOrder',{});r=advance(r,'2020-01-19');r=act(r,'SubmitDelivery',{contractId:input(r).features.firstOrder.contractId!});r=advance(r,'2020-01-20');r=career(r,'2022-12-07');r=act(r,'OpenVideoChannel',{name:'已经准备的账号',segment:'local_merchants'});bare=r;channelId=input(r).features.video!.channels[0]!.id;
 pending=act(r,'ApplyVideoProgram',{channelId,program:'image_rights',resources:['player-production'],startAt:input(r).view.date});unread=career(pending,addDays(input(r).view.date,7));r=act(unread,'DecideVideoProgram',{applicationId:input(unread).features.video!.applications[0]!.id});prepared=career(r,'2023-10-15');working=act(prepared,'StartVideoWork',{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2023-10-15'});
},120000)
function context(run=prepared){const p=input(run),c=p.features.video!.channels[0]!,focus=openingFocusFor(p,'video',{accountId:c.accountId,videoTarget:{channelId:c.id}})!;if(focus.kind!=='video')throw Error('VIDEO_REQUIRED');return {p,c,focus,thread:playerThread(p,focus)}}

it('connects an established bare account with settled original manual work and read tool preparation to the first video choice',()=>{
 const c=context(),reading=videoAccountAttemptReading(c.p,c.thread)!;expect(videoFirstAttemptReading(c.p,c.focus)).toBeNull();expect(reading).toMatchObject({channelId,title:'第一份作品，还是先认识观众？',sample:{costFen:60000,points:1,days:7}});expect(c.c.metrics.incomeFen).toBe(130000);expect(c.c.metrics.costFen).toBeGreaterThan(0);expect(reading.line).toContain('历史确认收入¥1,300');expect(reading.line).toContain('已发生成本');expect(c.p.request).not.toHaveBeenCalled()
 expect(videoChannelAttemptReading(context(bare).p,context(bare).focus)).not.toBeNull()
})
it('preserves unread or unfinished original application handling, and leaves real video attempts on their original path',()=>{
 for(const r of [pending,unread,working]){const c=context(r);expect(videoChannelAttemptReading(c.p,c.focus)).toBeNull()}
 const c=context();expect(c.p.features.video!.applications[0]!.resultRead).toBe(true);expect(c.p.request).not.toHaveBeenCalled()
})
it('rejects orphan, duplicate, unclosed or foreign business histories rather than hiding an uncertain responsibility',()=>{
 const c=context(),p=c.p,ops=p.view.operations!,app=p.features.video!.applications[0]!,video=p.features.video!;
 const mutations:GamePanelProps[]=[
 {...p,view:{...p.view,operations:{...ops,jobs:[...ops.jobs,{...ops.jobs[0]!,id:'orphan-job'}]}}},
 {...p,view:{...p.view,operations:{...ops,contracts:ops.contracts.map(k=>({...k,status:'delivered' as const}))}}},
 {...p,view:{...p.view,operations:{...ops,businesses:[]}}},
 {...p,features:{...p.features,video:{...video,applications:[app,app]}}},
 {...p,features:{...p.features,video:{...video,applications:[{...app,resultRead:false}]}}},
 {...p,features:{...p.features,video:{...video,applications:[{...app,jobId:'missing'}]}}},
 {...p,features:{...p.features,video:{...video,channels:[{...c.c,audience:1}]}}},
 {...p,accountId:'different-account'},
 ];for(const changed of mutations)expect(videoChannelAttemptReading(changed,c.focus)).toBeNull()
 for(const focus of [{...c.focus,runId:'other-run'},{...c.focus,videoTarget:{channelId:'missing'}},{...c.focus,videoTarget:{channelId,section:'publications' as const}}])expect(videoChannelAttemptReading(p,focus)).toBeNull()
})
it('keeps historical, unknown and mandatory-responsibility threads on their original complete view',()=>{
 const c=context();for(const thread of [{...c.thread,stage:'video-unknown'},{...c.thread,focusScope:'history' as const},{...c.thread,legacyFallbackRequired:true},{...c.thread,responsibilityOverrideNeeded:true}])expect(videoAccountAttemptReading(c.p,thread)).toBeNull()
})
it('preserves the original strict new-account reading and its explicit resource/date command',()=>{
 const c=context(one);expect(videoChannelAttemptReading(c.p,c.focus)).toEqual(videoFirstAttemptReading(c.p,c.focus));expect(videoFirstAttemptReading(c.p,c.focus)).not.toBeNull();expect(c.p.request).not.toHaveBeenCalled()
})
it('uses the same first sample action for the thought and physical paper, without a game command',()=>{
 const c=context(),choose=vi.fn(),encounter=VideoEncounter({p:c.p,thread:c.thread,date:null,waitLabel:'',onChoose:choose,onResult:vi.fn(),onToday:vi.fn()});if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(encounter))throw Error('ACTION_REQUIRED');const node=VideoThreadAction(encounter.props);if(!isValidElement<ComponentProps<typeof VideoFirstAttemptAction>>(node)||node.type!==VideoFirstAttemptAction)throw Error('FIRST_ATTEMPT_REQUIRED');hooks.index=0;const rows=elements(VideoFirstAttemptAction(node.props)),button=rows.find(n=>n.type==='button')!,object=rows.find(n=>n.type===OpeningObject)!;expect(object.props.onActivate).toBe(button.props.onClick);(button.props.onClick as ()=>void)();(object.props.onActivate as ()=>void)();expect(choose.mock.calls).toEqual([['sample'],['sample']]);expect(c.p.request).not.toHaveBeenCalled()
})
it('keeps radio preview explicit and closes only the known bare account selector to the scene comparison',()=>{
 for(const r of [one,prepared,working]){hooks.values=[];const ui=driver(r);ui.open('select-account');const radios=ui.render().filter(n=>n.type==='input'&&String(n.props.name).endsWith('channel'));expect(radios[0]!.props.checked).toBe(false);(radios[0]!.props.onChange as ()=>void)();expect(ui.onTarget).not.toHaveBeenCalled();expect(ui.dialog()).toBeDefined();ui.click('明确选择这个账号');expect(ui.onTarget).toHaveBeenCalledExactlyOnceWith({channelId:ui.p.features.video!.channels[0]!.id});expect(Boolean(ui.dialog())).toBe(r===working);expect(ui.p.request).not.toHaveBeenCalled()}
})
it('the actual route consumes the same public reading while an unfinished work keeps the original complete path',()=>{
 for(const r of [prepared,working]){hooks.values=[];hooks.index=0;const c=context(r),tree=NarrativeScene({...c.p,screen:'video',headingRef:null,personId:'tang-ying',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null,videoTarget:{channelId}}),surface=elements(tree).find(n=>typeof n.type==='function'&&n.type.name==='SceneChoiceSurface')!;expect(surface.props.direct).toBe(r===prepared);expect(c.p.request).not.toHaveBeenCalled()}
})

it('the room title, stage and facts follow the same selected video owner as its action despite another valid account filter',()=>{
 const run=act(prepared,'OpenCourseStudio',{capitalFen:210000}),c=context(run),accountId=c.p.features.course!.businesses[0]!.accountId,p={...c.p,accountId};expect(accountId).not.toBe(c.focus.accountId);expect(videoAccountAttemptReading(p,c.thread)).toBeNull();hooks.values=[];hooks.index=0;
 let tree:unknown=OpeningMoment({p,focus:c.focus,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(p),onNavigate:vi.fn(),onExplore:vi.fn()});
 const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);
 for(let n=0;n<12;n++){const wrapper=elements(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrapper)break;tree=(wrapper.props.children as (v:unknown)=>unknown)(choices.has((wrapper.type as {name:string}).name)?vi.fn():null)}
 const room=elements(tree).find(n=>n.type===RoomTableau)!;expect(room).toBeDefined();expect(words(room.props.heading)).toContain('第一份作品，还是先认识观众？');expect(words(room.props.context)).toContain('第一份作品 · 待选择');expect((room.props.object as ReactElement<Record<string,unknown>>).props.stageLabel).toBe('第一份作品 · 待选择');expect(c.p.request).not.toHaveBeenCalled()
})
