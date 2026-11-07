import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {VideoSceneChoice,type VideoChoiceAction} from './VideoSceneChoice.tsx'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {videoInquiryChoiceReading,videoPublicationFeedbackReading} from './video-publication-feedback.ts'
import {VideoPublicationFeedback} from './VideoPublicationFeedback.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
// Normal gameplay evaluated in memory; no storage/codec/import/export/replay/fault tests.
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
 let activate:((intent?:VideoChoiceAction)=>void)|undefined
 const onTarget=vi.fn((next:VideoSceneTarget)=>{target=next}),inspect=vi.fn()
 const render=()=>{hooks.index=0;return elements(VideoSceneChoice({p,...(target?{target}:{}),onTargetChange:onTarget,onInspect:inspect,children:fn=>{activate=fn;return null}}))}
 const click=(label:string)=>{const rows=render(),dialog=rows.find(n=>n.type===Dialog),scope=dialog?elements(dialog):rows,node=scope.find(n=>n.type==='button'&&words(n.props.children)===label);if(!node||node.props.disabled||typeof node.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);node.props.onClick()}
 const fill=(value:string)=>{const node=render().find(n=>n.type==='input'&&!n.props.type)!;if(!node||typeof node.props.onChange!=='function')throw Error('NAME_FIELD_REQUIRED');node.props.onChange({target:{value}})}
 const audience=(index:number)=>{const node=render().filter(n=>n.type==='input'&&String(n.props.name).endsWith('segment'))[index]!;(node.props.onChange as ()=>void)()}
 const select=(suffix:string,label:string)=>{const wrap=render().find(n=>n.type==='label'&&words(n).startsWith(label)&&elements(n).some(e=>e.type==='input'&&String(e.props.name).endsWith(suffix)));const node=elements(wrap).find(n=>n.type==='input'&&n.props.type==='radio');if(!node||typeof node.props.onChange!=='function')throw Error('RADIO_REQUIRED:'+suffix+':'+label);node.props.onChange()}
 const set=(type:string,value:string)=>{const node=render().find(n=>n.type===type||(n.type==='input'&&n.props.type===type));if(!node||typeof node.props.onChange!=='function')throw Error('FIELD_REQUIRED:'+type);node.props.onChange({target:{value}})}
 render();return {p,onTarget,inspect,render,click,fill,audience,select,set,open:(intent?:VideoChoiceAction)=>{render();activate!(intent)},dialog:()=>render().find(n=>n.type===Dialog)}
}



const channelId=input(one).features.video!.channels[0]!.id
const production=act(one,'StartVideoWork',{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'})
const workId=input(production).features.video!.works[0]!.id,target={channelId,workId}
function advanceTo(run:GameRun,date:string){for(let n=0;input(run).view.date<date&&n<5;n++)run=act(run,'AdvanceTime',{date});expect(input(run).view.date).toBe(date);return run}
const completed=advanceTo(production,'2020-01-08'),reviewed=act(completed,'ReviewVideoOutput',{workId,disclosure:'manual'}),published=act(reviewed,'PublishVideo',{workId,monetization:'none',label:false}),measured=advanceTo(published,'2020-01-15')
function context(run:GameRun,t:VideoSceneTarget=target){const p=input(run),focus=openingFocusFor(p,'video',{accountId:'personal',videoTarget:t})!;return {p,focus,thread:playerThread(p,focus)}}
it('uses the measured facts of this publication, distinguishes current leads and never uses channel totals',()=>{
 const c=context(measured),pub=c.p.features.video!.publications[0]!,r=videoPublicationFeedbackReading(c.p,c.thread)!;expect(r).toMatchObject({views:pub.views,inquiries:pub.qualifiedInquiries,measuredAt:'2020-01-15',currentLeads:c.p.features.video!.channels[0]!.leads.length});expect(r.moneyLine).toContain('本次没有平台应收');expect(c.p.request).not.toHaveBeenCalled();expect(pub.measuredAt).not.toBeNull()
 const video=c.p.features.video!,changed={...c.p,features:{...c.p.features,video:{...video,channels:video.channels.map(channel=>({...channel,qualifiedInquiries:987654,audience:654321,leads:channel.leads.slice(1)}))}}},different=videoPublicationFeedbackReading(changed,c.thread)!;expect(different.inquiries).toBe(pub.qualifiedInquiries);expect(different.currentLeads).toBe(Math.max(0,r.currentLeads-1));expect(different.views).toBe(pub.views)
})
it('keeps the original pending lifecycle and rejects unknown dates, repeated publications and foreign or historical identities',()=>{
 for(const run of [production,completed,reviewed,published]){const c=context(run);expect(videoPublicationFeedbackReading(c.p,c.thread)).toBeNull()}
 const c=context(measured),v=c.p.features.video!,pub=v.publications[0]!
 for(const publications of [[pub,pub],[{...pub,measuredAt:'2020-02-01'}],[{...pub,views:-1}],[{...pub,qualifiedInquiries:NaN}]])expect(videoPublicationFeedbackReading({...c.p,features:{...c.p.features,video:{...v,publications}}},c.thread)).toBeNull()
 for(const thread of [{...c.thread,focusScope:'history' as const},{...c.thread,stage:'video-unknown'},{...c.thread,responsibilityOverrideNeeded:true},{...c.thread,focus:{...c.thread.focus,runId:'foreign-run'}}])expect(videoPublicationFeedbackReading(c.p,thread)).toBeNull();expect(videoPublicationFeedbackReading({...c.p,accountId:'foreign-account'},c.thread)).toBeNull()
})
it('zero feedback and no remaining leads stay honest without manufacturing a customer or revenue',()=>{
 const c=context(measured),v=c.p.features.video!,p={...c.p,features:{...c.p.features,video:{...v,channels:v.channels.map(channel=>({...channel,leads:[]})),publications:v.publications.map(pub=>({...pub,views:0,qualifiedInquiries:0}))}}},r=videoPublicationFeedbackReading(p,c.thread)!;expect(r.title).toBe('这一版，暂时没有回声。');expect(r).toMatchObject({views:0,inquiries:0,currentLeads:0,canReply:false});expect(words(VideoPublicationFeedback({value:r}))).toContain('询价还不是订单');expect(p.request).not.toHaveBeenCalled()
})
it('the actual facts paper keeps date, two original measures and the money boundary',()=>{
 const c=context(measured),r=videoPublicationFeedbackReading(c.p,c.thread)!,rows=elements(VideoPublicationFeedback({value:r}));expect(words(rows)).toContain('2020-01-15');expect(rows.filter(n=>n.type==='dd')).toHaveLength(2);expect(words(rows)).toContain(r.views.toLocaleString('zh-CN'));expect(words(rows)).toContain('没有平台应收');expect(rows.filter(n=>n.type==='button')).toHaveLength(0)
})
it('a current operating account can choose a real inquiry directly while the paper and thought share the exact handler',()=>{
 const c=context(measured),choose=vi.fn(),today=vi.fn(),result=vi.fn(),e=VideoEncounter({p:c.p,thread:c.thread,date:null,waitLabel:'',onChoose:choose,onResult:result,onToday:today});if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(e))throw Error('THREAD_REQUIRED');hooks.index=0;const rows=elements(VideoThreadAction(e.props)),buttons=rows.filter(n=>n.type==='button'),paper=rows.find(n=>n.type===OpeningObject)!,hasLeads=c.p.features.video!.channels[0]!.leads.length>0;expect(paper.props.onActivate).toBe(buttons[0]!.props.onClick);expect(paper.props.stageLabel).toBe('反馈已到');expect(rows.some(n=>n.type===VideoPublicationFeedback)).toBe(true);(paper.props.onActivate as ()=>void)();expect(hasLeads?choose:today).toHaveBeenCalledOnce();expect(c.p.request).not.toHaveBeenCalled()
})
it('a paused account can read feedback and return to life without acquiring an inquiry action',()=>{
 const c=context(measured),v=c.p.features.video!,p={...c.p,features:{...c.p.features,video:{...v,channels:v.channels.map(channel=>({...channel,lifecycle:'paused' as const}))}}},r=videoPublicationFeedbackReading(p,c.thread)!;expect(r.canReply).toBe(false);hooks.index=0;const rows=elements(VideoThreadAction({p,thread:c.thread,active:true,date:null,waitLabel:'',onChoose:vi.fn(),onResult:vi.fn(),onToday:vi.fn(),children:primary=>primary?.main}));expect(words(rows)).not.toContain('挑一位询价者');expect(words(rows)).toContain('回到今天')
})
it('retires an old direct-inquiry callback when focus, callback ownership or the committed view changes',()=>{
 const c=context(measured),choose=vi.fn(),result=vi.fn(),today=vi.fn(),render=(thread=c.thread,selected=choose)=>{hooks.index=0;return elements(VideoThreadAction({p:c.p,thread,active:true,date:null,waitLabel:'',onChoose:selected,onResult:result,onToday:today,children:primary=>primary?.main})).find(n=>n.type==='button')!},old=render();render({...c.thread,focus:{...c.thread.focus,entityId:'another-work'}});(old.props.onClick as ()=>void)();expect(choose).not.toHaveBeenCalled();const current=render();render(c.thread,vi.fn());(current.props.onClick as ()=>void)();expect(choose).not.toHaveBeenCalled();const last=render();Object.assign(c.p.controller.snapshot,{view:{...c.p.view,revision:c.p.view.revision+1}});(last.props.onClick as ()=>void)();expect(choose).not.toHaveBeenCalled()
})
it('the direct choice still opens the original explicit client selector and never accepts a commission by viewing',()=>{
 const c=context(measured),ui=driver(measured,target);ui.open('commission');expect(ui.dialog()?.props.title).toBe('这次，回应哪一份询价？');expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').every(n=>n.props.checked===false)).toBe(true);expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);expect(c.p.request).not.toHaveBeenCalled();expect(ui.p.request).not.toHaveBeenCalled()
})
it('room and route consume the same actual result while an unrelated valid account filter does not change the room owner',()=>{
 const c=context(measured);hooks.values=[];hooks.index=0;const route=NarrativeScene({...c.p,screen:'video',headingRef:null,personId:'tang-ying',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null,videoTarget:target}),reading=videoPublicationFeedbackReading(c.p,c.thread)!;expect(words(elements(route).find(n=>n.type==='h1'))).toBe(reading.title)
 hooks.values=[];hooks.index=0;let tree:unknown=OpeningMoment({p:{...c.p,accountId:'other-reading-filter'},focus:c.focus,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(c.p),onNavigate:vi.fn(),onExplore:vi.fn()});const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);for(let n=0;n<12;n++){const wrapper=elements(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrapper)break;tree=(wrapper.props.children as (v:unknown)=>unknown)(choices.has((wrapper.type as {name:string}).name)?vi.fn():null)}const room=elements(tree).find(n=>n.type===RoomTableau)!;expect(words(room.props.heading)).toContain(reading.title);expect(words(room.props.context)).toContain('反馈已到');expect(elements(room.props.facts).some(n=>n.type===VideoPublicationFeedback)).toBe(true);expect((room.props.object as ReactElement<Record<string,unknown>>).props.stageLabel).toBe('反馈已到')
})

it('keeps an existing platform amount on its original settlement path and preserves the no-qualification money explanation',()=>{
 const c=context(measured),v=c.p.features.video!,pub=v.publications[0]!,row={id:'public-settlement',channelId:pub.channelId,publicationId:pub.id,kind:'ads' as const,grossMerchandiseFen:0,amountFen:10000,feeFen:500,confirmedAt:'2020-01-15',dueAt:'2020-01-22',collectedAt:null,retained:0,returned:0};
 for(const collectedAt of [null,'2020-01-15'])expect(videoPublicationFeedbackReading({...c.p,features:{...c.p.features,video:{...v,settlements:[{...row,collectedAt}]}}},c.thread)).toBeNull()
 const missingRights={...c.p,features:{...c.p.features,video:{...v,publications:[{...pub,monetization:'ads' as const,qualified:false}]}}};expect(videoPublicationFeedbackReading(missingRights,c.thread)!.moneyLine).toContain('未取得对应收益资格');expect(c.p.request).not.toHaveBeenCalled()
})

it('an explicitly chosen inquiry section keeps its next purpose after closing preparation without pretending it is an accepted order',()=>{
 const c=context(measured,{channelId,section:'leads'}),reading=videoInquiryChoiceReading(c.p,c.thread);expect(reading).not.toBeNull();expect(reading!.stage).toBe('询价准备 · 尚未接单');expect(c.p.features.video!.contracts).toHaveLength(0);hooks.index=0;const choose=vi.fn(),rows=elements(VideoThreadAction({p:c.p,thread:c.thread,active:true,date:null,waitLabel:'',onChoose:choose,onResult:vi.fn(),onToday:vi.fn(),children:primary=>primary?.main})),button=rows.find(n=>n.type==='button')!;expect(words(button)).toContain('继续核对委托安排');(button.props.onClick as ()=>void)();expect(choose).toHaveBeenCalledExactlyOnceWith('commission');expect(c.p.request).not.toHaveBeenCalled();expect(videoInquiryChoiceReading(c.p,context(measured,target).thread)).toBeNull();expect(videoInquiryChoiceReading(c.p,{...c.thread,focusScope:'history'})).toBeNull()
})

it('the inquiry preparation keeps the original published Clock and known costs available without accepting a client',()=>{
 const c=context(measured,{channelId,section:'leads'});hooks.values=[];hooks.index=0;let tree:unknown=OpeningMoment({p:c.p,focus:c.focus,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(c.p),onNavigate:vi.fn(),onExplore:vi.fn()});const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);for(let n=0;n<12;n++){const wrapper=elements(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrapper)break;tree=(wrapper.props.children as (v:unknown)=>unknown)(choices.has((wrapper.type as {name:string}).name)?vi.fn():null)}const room=elements(tree).find(n=>n.type===RoomTableau)!,clock=elements(room.props.decisions).find(n=>n.type===ClockAdvance);expect(clock).toBeDefined();expect(clock!.props.date).toBe(c.p.features.workbench.progression.nextDate);expect(c.p.request).not.toHaveBeenCalled()
})
