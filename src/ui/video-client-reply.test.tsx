import {afterEach,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import {addDays} from '../core/calendar.ts'
import {dayBefore,quarterLimit} from '../core/operations-calendar.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {videoClientReplyForTarget,videoClientReplyReading} from './video-client-reply.ts'
import {VideoClientReplyChoices,VideoClientReplyFacts} from './VideoClientReplyChoices.tsx'
import {VideoSceneChoice,type VideoChoiceAction} from './VideoSceneChoice.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {Dialog} from './Dialog.tsx'
// Public normal commands and local UI only; no codec/store/archives/replay or failure injection.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const};return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=> 'reply-ui'}})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
function elements(v:unknown):Element[]{if(Array.isArray(v))return v.flatMap(elements);if(!isValidElement<Record<string,unknown>>(v))return [];const rows=[v,...elements(v.props.children),...elements(v.props.footer)];if(v.type===VideoClientReplyChoices)rows.push(...elements(VideoClientReplyChoices(v.props as unknown as ComponentProps<typeof VideoClientReplyChoices>)));return rows}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry()
function act(run:GameRun,kind:string,payload:Record<string,unknown>){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'reply-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind+':'+run.timeline.cursor.date+':'+JSON.stringify(result));return result.nextRun}
function input(run:GameRun):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
function advance(run:GameRun,target:string){for(let n=0;n<100;n++){const p=input(run),w=p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking),choice=e?.choices.find(c=>c.isDefault);if(w.pause.reason!=='CONTENT_DECISION_PENDING'||!e||!choice||choice.costFen!==0||choice.actionPoints!==0)throw Error('PUBLIC_ZERO_DEFAULT_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:choice.id});continue}if(p.view.date===target&&run.timeline.cursor.phase==='snapshot')return run;const limit=quarterLimit(p.view.date);run=act(run,'AdvanceTime',{date:target<limit?target:p.view.date===dayBefore(limit)?limit:dayBefore(limit)})}throw Error('NORMAL_ADVANCE_BOUND')}
function current(run:GameRun){const p=input(run),c=p.features.video!.contracts[0]!,target={channelId:c.channelId,workId:c.workId,contractId:c.id},focus=openingFocusFor(p,'video',{accountId:'personal',videoTarget:target})!;return {p,c,target,focus,thread:playerThread(p,focus)}}
let firstReply:GameRun,eligibleReply:GameRun,usedReply:GameRun,pendingTalk:GameRun
beforeAll(()=>{
 const evidence=[] as {seed:string;publicState:string;revisions:number}[]
 for(let seedIndex=0;seedIndex<8;seedIndex++){
  const seed='reply-normal-'+seedIndex;let run=createCampaignRun({runId:seed,actorId:'player',commandId:'create',seed,backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}});run=act(run,'OpenVideoChannel',{name:'真实修改的作品',segment:'local_merchants'});const channelId=input(run).features.video!.channels[0]!.id;run=act(run,'StartVideoWork',{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'});run=advance(run,'2020-01-08');const sample=input(run).features.video!.works[0]!;run=act(run,'ReviewVideoOutput',{workId:sample.id,disclosure:'manual'});run=act(run,'PublishVideo',{workId:sample.id,monetization:'none',label:false});run=advance(run,'2020-01-15');const lead=input(run).features.video!.channels[0]!.leads[0]!;run=act(run,'AcceptVideoCommission',{channelId,clientId:lead.personId,cohortId:lead.cohortId,modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-15'});
  for(let n=0;n<50;n++){
   const p=input(run),v=p.features.video!,c=v.contracts[0]!,work=v.works.find(w=>w.id===c.workId)!;
   if(c.status==='settled'){evidence.push({seed,publicState:'settled-without-extra-reply',revisions:c.revisions});break}
   if(c.status==='revision'){
    if(!firstReply)firstReply=run
    if(c.revisions>=c.includedRevisions&&!c.negotiated){eligibleReply=run;evidence.push({seed,publicState:'actual-extra-reply',revisions:c.revisions});break}
   }
   if(c.status==='review'){run=advance(run,addDays(c.submittedAt!,v.catalog.commercial.reviewDays));continue}
   if(c.status==='delivered'){run=p.view.date<c.paymentAt!?advance(run,c.paymentAt!):act(run,'CollectVideoSettlement',{settlementId:c.id});continue}
   const job=[work.production,...work.corrections].find(j=>j&&['planned','running'].includes(j.status));if(job){run=advance(run,job.completeAt);continue}
   if(c.status==='revision'&&work.version===c.submittedVersion){if(p.view.budget.available<1){run=advance(run,quarterLimit(p.view.date));continue}run=act(run,'ReworkVideo',{workId:work.id,resources:['player-production'],startAt:p.view.date});continue}
   if(work.reviewedVersion!==work.version){run=act(run,'ReviewVideoOutput',{workId:work.id,disclosure:'manual'});continue}
   run=act(run,'SubmitVideoCommission',{contractId:c.id})
  }
  if(eligibleReply)break
 }
 if(!firstReply||!eligibleReply)throw Error('NORMAL_PUBLIC_REPLY_COVERAGE_MISSING')
 const c=current(eligibleReply);pendingTalk=act(eligibleReply,'NegotiateVideoCommission',{contractId:c.c.id,proposal:'price',resources:['player-production'],startAt:c.p.view.date});usedReply=advance(pendingTalk,addDays(c.p.view.date,3));console.log(JSON.stringify({publicCoverage:evidence,firstReplyDate:input(firstReply).view.date,eligibleDate:c.p.view.date,usedDate:input(usedReply).view.date,storageTests:0,compatibility:0}))
},120000)
function driver(run=firstReply,change?:(p:GamePanelProps)=>GamePanelProps){const c=current(run),p=change?.(c.p)??c.p;Object.assign(p.controller.snapshot,{view:p.view});let target:VideoSceneTarget=c.target,activate:((intent?:VideoChoiceAction)=>void)|undefined;const onTarget=vi.fn((next:VideoSceneTarget)=>{target=next}),inspect=vi.fn(),render=()=>{hooks.index=0;return elements(VideoSceneChoice({p,target,onTargetChange:onTarget,onInspect:inspect,children:fn=>{activate=fn;return null}}))};const click=(label:string)=>{const node=render().find(n=>n.type==='button'&&words(n)===label);if(!node||node.props.disabled||typeof node.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);node.props.onClick()};const set=(type:string,value:string)=>{const node=render().find(n=>n.type===type||n.type==='input'&&n.props.type===type);if(!node||typeof node.props.onChange!=='function')throw Error('FIELD_REQUIRED:'+type);node.props.onChange({target:{value}})};render();return {p,c,onTarget,inspect,render,click,set,open:()=>{render();activate!()},dialog:()=>render().find(n=>n.type===Dialog)}}

it('reads the actual original revision, paid cost and both original response budgets without predicting acceptance',()=>{
 const c=current(firstReply),r=videoClientReplyReading(c.p,c.thread)!;expect(r).toMatchObject({version:c.p.features.video!.works.find(w=>w.id===c.c.workId)!.version,priceFen:300000,prepaymentFen:90000,directPaidFen:90000,rework:{costFen:30000,points:1,days:7},negotiation:{costFen:0,points:1,days:3},canNegotiate:false});expect(r.negotiationReason).toContain('原包含');expect(c.p.request).not.toHaveBeenCalled()
})
it('compares responses directly, keeps original negotiation disabled once with its shared reason and retains independent exit confirmation',()=>{
 const ui=driver();ui.open();expect(ui.dialog()?.props.layout).toBe('direct');const rows=ui.render(),price=rows.find(n=>n.type==='button'&&words(n).includes('试谈加价¥300'))!;expect(price.props.disabled).toBe(true);expect(words(rows)).toContain('本次现金¥0');expect(words(rows)).toContain('客户可能拒绝');expect(rows.find(n=>n.type===CommandButton)?.props).toMatchObject({kind:'ExitVideoCommission',payload:{contractId:ui.c.c.id},confirm:true});expect(ui.p.request).not.toHaveBeenCalled()
})
it('rework uses the original explicit resource/date payload and returns to the same response with its draft',()=>{
 const ui=driver();ui.open();ui.click('再修一轮新增¥300 · 1点 · 7日修完这轮，直接投入参考¥1,200。');expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.dialog()?.props.title).toBe('给这次修改，留出日子');expect(ui.render().find(n=>n.type==='select')?.props.value).toBe('');expect(ui.render().find(n=>n.type==='input'&&n.props.type==='date')?.props.value).toBe('');ui.set('select','player-production');ui.set('date',addDays(ui.p.view.date,1));let cmd=ui.render().find(n=>n.type===CommandButton)!;expect(cmd.props).toMatchObject({kind:'ReworkVideo',payload:{workId:ui.c.c.workId,resources:['player-production'],startAt:addDays(ui.p.view.date,1)},confirm:true});ui.click('← 换一种回应');expect(ui.dialog()?.props.title).toBe('先看清修改，再决定怎么回应');ui.click('再修一轮新增¥300 · 1点 · 7日修完这轮，直接投入参考¥1,200。');cmd=ui.render().find(n=>n.type===CommandButton)!;expect(cmd.props.payload).toMatchObject({startAt:addDays(ui.p.view.date,1),resources:['player-production']});expect(ui.p.request).not.toHaveBeenCalled()
})
it('actual extra modification permits each original proposal separately and keeps zero cash distinct from a possible extra quote',()=>{
 const ui=driver(eligibleReply);ui.open();ui.click('试谈加价¥300谈妥才调整报价，原单仍须验收。');ui.set('select','player-production');ui.click('明确从今天 '+ui.p.view.date+' 开始');let cmd=ui.render().find(n=>n.type===CommandButton)!;expect(cmd.props).toMatchObject({kind:'NegotiateVideoCommission',payload:{contractId:ui.c.c.id,proposal:'price',resources:['player-production'],startAt:ui.p.view.date},confirm:true});expect(previewCommand(eligibleReply,{runId:eligibleReply.runId,actorId:eligibleReply.actorId,commandId:'original-price-preview',expectedRevision:eligibleReply.revision,kind:String(cmd.props.kind),payload:cmd.props.payload},registry,eligibleReply.actorId).allowed).toBe(true);ui.click('← 换一种回应');ui.click('试谈缩小范围不保证接受，谈妥仍须亲手重提。');cmd=ui.render().find(n=>n.type===CommandButton)!;expect(cmd.props.payload).toMatchObject({proposal:'scope',startAt:ui.p.view.date,resources:['player-production']});expect(ui.p.request).not.toHaveBeenCalled()
})
it('an already used real negotiation cannot be purchased again and an in-progress negotiation stays on its original wait',()=>{
 const c=current(usedReply),r=videoClientReplyReading(c.p,c.thread)!;expect(r.canNegotiate).toBe(false);expect(r.negotiationReason).toContain('已用过');expect(r.directPaidFen).toBe(120000);expect(videoClientReplyForTarget(current(pendingTalk).p,current(pendingTalk).target)).toBeNull()
})
it('a missing paid-cost source stays unknown while the original quote and prepayment remain visible',()=>{
 const c=current(firstReply),v=c.p.features.video!,work=v.works.find(w=>w.id===c.c.workId)!,p={...c.p,features:{...c.p.features,workbench:{...c.p.features.workbench,finance:c.p.features.workbench.finance.map(f=>({...f,metrics:f.metrics.filter(m=>m.referenceId!==work.production!.actionId)}))}}},r=videoClientReplyForTarget(p,c.target)!;expect(r.directPaidFen).toBeNull();expect(r.line).toContain('来源待核');expect(r).toMatchObject({priceFen:300000,prepaymentFen:90000});expect(c.p.request).not.toHaveBeenCalled()
})
it('mismatched, duplicated, historical and unsupported contexts retain the complete original path',()=>{
 const c=current(firstReply),v=c.p.features.video!;expect(videoClientReplyForTarget(c.p,{...c.target,workId:v.works.find(w=>w.id!==c.c.workId)!.id})).toBeNull();expect(videoClientReplyForTarget({...c.p,features:{...c.p.features,video:{...v,contracts:[...v.contracts,v.contracts[0]!]}}},c.target)).toBeNull();expect(videoClientReplyForTarget({...c.p,accountId:'other-account'},c.target)).toBeNull();for(const t of [{...c.thread,focusScope:'history' as const},{...c.thread,legacyFallbackRequired:true},{...c.thread,responsibilityOverrideNeeded:true},{...c.thread,focus:{...c.thread.focus,runId:'foreign-run'}},{...c.thread,focus:{...c.thread.focus,entityId:'other-object'}},{...c.thread,focus:{...c.thread.focus,businessId:'other-business'}}])expect(videoClientReplyReading(c.p,t)).toBeNull()
})
it('zero original actions can inspect but the unchanged current rework preview refuses commitment',()=>{
 const run=act(firstReply,'WorkQuarter',{}),ui=driver(run);expect(ui.p.view.budget.available).toBe(0);ui.open();const rework=ui.render().find(n=>n.type==='button'&&words(n).startsWith('再修一轮'))!;(rework.props.onClick as ()=>void)();ui.set('select','player-production');ui.click('明确从今天 '+ui.p.view.date+' 开始');const cmd=ui.render().find(n=>n.type===CommandButton)!;expect(previewCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'zero-actions-preview',expectedRevision:run.revision,kind:String(cmd.props.kind),payload:cmd.props.payload},registry,run.actorId).allowed).toBe(false);expect(ui.p.request).not.toHaveBeenCalled()
})
it('read-only inspection retains the original submission lock on response arrangements',()=>{
 const ui=driver(firstReply,p=>({...p,view:{...p.view,readOnly:true,readOnlyReason:'ANOTHER_WRITER',saveStatus:'read_only'}}));ui.open();const rework=ui.render().find(n=>n.type==='button'&&words(n).startsWith('再修一轮'))!;(rework.props.onClick as ()=>void)();ui.set('select','player-production');ui.click('明确从今天 '+ui.p.view.date+' 开始');expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);expect(words(ui.render())).toContain('不能提交视频安排');expect(ui.p.request).not.toHaveBeenCalled()
})
it('the reply thought and physical letter share one original comparison action',()=>{
 const c=current(firstReply),choose=vi.fn(),node=VideoEncounter({p:c.p,thread:c.thread,date:null,waitLabel:'',onChoose:choose,onResult:vi.fn(),onToday:vi.fn()});if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(node))throw Error('THREAD_REQUIRED');hooks.index=0;const rows=elements(VideoThreadAction(node.props)),main=rows.find(n=>n.type==='button')!,paper=rows.find(n=>n.type===OpeningObject)!;expect(paper.props.onActivate).toBe(main.props.onClick);expect(paper.props.stageLabel).toBe('客户回信 · 待回应');expect(rows.some(n=>n.type===VideoClientReplyFacts)).toBe(true);(main.props.onClick as ()=>void)();(paper.props.onActivate as ()=>void)();expect(choose).toHaveBeenCalledTimes(2);expect(c.p.request).not.toHaveBeenCalled()
})
it('old proposal callbacks retire across owner context A to B to A',()=>{
 const c=current(eligibleReply),r=videoClientReplyReading(c.p,c.thread)!,rework=vi.fn(),price=vi.fn(),scope=vi.fn(),draw=(contextKey:string)=>{hooks.index=0;return elements(VideoClientReplyChoices({p:c.p,contextKey,reading:r,onRework:rework,onPrice:price,onScope:scope}))},old=draw('A').find(n=>n.type==='button'&&words(n).includes('试谈加价'))!;draw('B');draw('A');(old.props.onClick as ()=>void)();expect(price).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled()
})
it('the room and route share the same actual reply purpose, original Clock and explicit original-reader return',()=>{
 const c=current(firstReply),r=videoClientReplyReading(c.p,c.thread)!;hooks.index=0;const route=NarrativeScene({...c.p,screen:'video',headingRef:null,personId:'tang-ying',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null,videoTarget:c.target});expect(words(elements(route).find(n=>n.type==='h1'))).toBe(r.title);hooks.values=[];hooks.index=0;let tree:unknown=OpeningMoment({p:c.p,focus:c.focus,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(c.p),onNavigate:vi.fn(),onExplore:vi.fn()});const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);for(let n=0;n<12;n++){const wrap=elements(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrap)break;tree=(wrap.props.children as (v:unknown)=>unknown)(choices.has((wrap.type as {name:string}).name)?vi.fn():null)}const room=elements(tree).find(n=>n.type===RoomTableau)!;expect(words(room.props.heading)).toContain(r.title);expect(elements(room.props.facts).some(n=>n.type===VideoClientReplyFacts)).toBe(true);expect(elements(room.props.decisions).some(n=>n.type===ClockAdvance)).toBe(true);expect(c.p.request).not.toHaveBeenCalled()
})
