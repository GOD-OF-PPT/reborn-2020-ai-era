import {afterEach,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import {addDays} from '../core/calendar.ts'
import {dayBefore,quarterLimit} from '../core/operations-calendar.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {videoClientSettlementReading} from './video-client-settlement.ts'
import {VideoClientReceipt} from './VideoClientReceipt.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {VideoInquiryChoices} from './VideoInquiryChoices.tsx'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
import {moneyText} from './game-text.ts'
import {roomReaderReturns} from './room-reader-navigation.ts'
// Normal in-memory commands and public projections; no persistence, replay or failure tests.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const};return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=> 'client-receipt-ui'}})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
function elements(v:unknown):Element[]{if(Array.isArray(v))return v.flatMap(elements);if(!isValidElement<Record<string,unknown>>(v))return [];return [v,...elements(v.props.children),...elements(v.props.footer)]}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'first-video-ui',actorId:'player',commandId:'create',seed:'first-video-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:Record<string,unknown>){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'first-video-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind+':'+run.timeline.cursor.date+':'+JSON.stringify(result));return result.nextRun}
function input(run:GameRun):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
function advance(run:GameRun,target:string){for(let n=0;n<100;n++){const p=input(run),w=p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking),choice=e?.choices.find(c=>c.isDefault);if(w.pause.reason!=='CONTENT_DECISION_PENDING'||!e||!choice||choice.costFen!==0||choice.actionPoints!==0)throw Error('PUBLIC_ZERO_DEFAULT_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:choice.id});continue}if(p.view.date===target&&run.timeline.cursor.phase==='snapshot')return run;const limit=quarterLimit(p.view.date);run=act(run,'AdvanceTime',{date:target<limit?target:p.view.date===dayBefore(limit)?limit:dayBefore(limit)})}throw Error('NORMAL_ADVANCE_BOUND')}
let settled:GameRun,arranged:GameRun,channelId:string,workId:string,contractId:string
beforeAll(()=>{
 let run=act(initial,'OpenVideoChannel',{name:'本地日常',segment:'local_merchants'});channelId=input(run).features.video!.channels[0]!.id;run=act(run,'StartVideoWork',{channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'});run=advance(run,'2020-01-08');const sample=input(run).features.video!.works[0]!;run=act(run,'ReviewVideoOutput',{workId:sample.id,disclosure:'manual'});run=act(run,'PublishVideo',{workId:sample.id,monetization:'none',label:false});run=advance(run,'2020-01-15');const lead=input(run).features.video!.channels[0]!.leads[0]!;run=act(run,'AcceptVideoCommission',{channelId,clientId:lead.personId,cohortId:lead.cohortId,modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-15'});arranged=run;contractId=input(run).features.video!.contracts[0]!.id;workId=input(run).features.video!.contracts[0]!.workId;
 for(let n=0;n<50;n++){
  const p=input(run),v=p.features.video!,c=v.contracts.find(c=>c.id===contractId)!,work=v.works.find(w=>w.id===workId)!;
  if(c.status==='settled'){settled=run;return}
  if(c.status==='review'){run=advance(run,addDays(c.submittedAt!,v.catalog.commercial.reviewDays));continue}
  if(c.status==='delivered'){if(p.view.date<c.paymentAt!)run=advance(run,c.paymentAt!);else run=act(run,'CollectVideoSettlement',{settlementId:c.id});continue}
  const active=[work.production,...work.corrections].find(j=>j&&['planned','running'].includes(j.status));if(active){run=advance(run,active.completeAt);continue}
  if(c.status==='revision'&&work.version===c.submittedVersion){if(p.view.budget.available<1){run=advance(run,quarterLimit(p.view.date));continue}run=act(run,'ReworkVideo',{workId,resources:['player-production'],startAt:p.view.date});continue}
  if(work.reviewedVersion!==work.version){run=act(run,'ReviewVideoOutput',{workId,disclosure:'manual'});continue}
  run=act(run,'SubmitVideoCommission',{contractId})
 }
 throw Error('NORMAL_PUBLIC_ORDER_BOUND')
},120000)
function context(run=settled){const p=input(run),focus=openingFocusFor(p,'video',{accountId:'personal',videoTarget:{channelId,workId,contractId}})!;return {p,focus,thread:playerThread(p,focus)}}
function financeChanged(c:ReturnType<typeof context>,change:(f:GamePanelProps['features']['workbench']['finance'][number])=>GamePanelProps['features']['workbench']['finance'][number]):GamePanelProps{return {...c.p,features:{...c.p.features,workbench:{...c.p.features.workbench,finance:c.p.features.workbench.finance.map(f=>f.accountId==='personal'?change(f):f)}}}}
function action(c:ReturnType<typeof context>,today=vi.fn(),choose=vi.fn(),result=vi.fn()){hooks.index=0;return {today,choose,result,rows:elements(VideoThreadAction({p:c.p,thread:c.thread,active:true,date:null,waitLabel:'',onChoose:choose,onResult:result,onToday:today,children:value=>value?.main}))}}

it('reconciles a real fully paid normal order without using the whole account income or costs',()=>{
 const c=context(),r=videoClientSettlementReading(c.p,c.thread)!,work=c.p.features.video!.works.find(w=>w.id===workId)!;expect(r).toMatchObject({receivedFen:300000,prepaymentFen:90000,balanceFen:210000,directPaidFen:90000+30000*work.corrections.length,feePaidFen:15000});expect(r.settledAt).toBe(c.p.features.video!.contracts[0]!.settledAt);expect(c.p.request).not.toHaveBeenCalled()
 const v=c.p.features.video!,p={...c.p,features:{...c.p.features,video:{...v,channels:v.channels.map(channel=>({...channel,metrics:{...channel.metrics,incomeFen:9999999,costFen:8888888}}))}}};expect(videoClientSettlementReading(p,c.thread)).toEqual(r)
})
it('keeps known cash and fees when a direct-cost source is missing, never silently replacing it with zero',()=>{
 const c=context(),work=c.p.features.video!.works.find(w=>w.id===workId)!,p=financeChanged(c,f=>({...f,metrics:f.metrics.filter(m=>m.referenceId!==work.production!.actionId)})),r=videoClientSettlementReading(p,c.thread)!;expect(r).toMatchObject({receivedFen:300000,directPaidFen:null,feePaidFen:15000});expect(words(VideoClientReceipt({value:r}))).toContain('直接投入来源待核');expect(c.p.request).not.toHaveBeenCalled()
})
it('keeps known cash and direct costs when an actual fee payment source is missing',()=>{
 const c=context(),p=financeChanged(c,f=>({...f,transactions:f.transactions.filter(tx=>!(tx.sourceId===contractId&&tx.amountFen<0))})),r=videoClientSettlementReading(p,c.thread)!;expect(r.receivedFen).toBe(300000);expect(r.directPaidFen).not.toBeNull();expect(r.feePaidFen).toBeNull();expect(words(VideoClientReceipt({value:r}))).toContain('实付来源待核')
})
it('an explicit zero original fee is distinct from an unproven payment source',()=>{
 const c=context(),v=c.p.features.video!,changed=financeChanged(c,f=>({...f,metrics:f.metrics.filter(m=>!(m.kind==='cost'&&m.sourceEventId===contractId)),transactions:f.transactions.filter(tx=>!(tx.sourceId===contractId&&tx.amountFen<0))})),p={...changed,features:{...changed.features,video:{...v,contracts:v.contracts.map(k=>({...k,feeBps:0}))}}};expect(videoClientSettlementReading(p,c.thread)!.feePaidFen).toBe(0)
})
it('retains original responsibility and reading paths for unpaid, pending, duplicate, foreign or historical identities',()=>{
 const c=context(),v=c.p.features.video!;expect(videoClientSettlementReading(context(arranged).p,context(arranged).thread)).toBeNull()
 for(const contracts of [[...v.contracts,v.contracts[0]!],v.contracts.map(k=>({...k,paidCase:false})),v.contracts.map(k=>({...k,feePosted:false}))])expect(videoClientSettlementReading({...c.p,features:{...c.p.features,video:{...v,contracts}}},c.thread)).toBeNull()
 const duplicate=financeChanged(c,f=>({...f,transactions:[...f.transactions,f.transactions.find(tx=>tx.sourceId===contractId&&tx.amountFen>0)!]}));expect(videoClientSettlementReading(duplicate,c.thread)).toBeNull()
 const unpaid=financeChanged(c,f=>({...f,contracts:f.contracts.map(k=>k.id===contractId?{...k,receivableFen:1}:k)}));expect(videoClientSettlementReading(unpaid,c.thread)).toBeNull()
 for(const thread of [{...c.thread,focusScope:'history' as const},{...c.thread,responsibilityOverrideNeeded:true},{...c.thread,stage:'video-unknown'},{...c.thread,focus:{...c.thread.focus,runId:'foreign-run'}}])expect(videoClientSettlementReading(c.p,thread)).toBeNull();expect(videoClientSettlementReading({...c.p,accountId:'other-account'},c.thread)).toBeNull()
})
it('a cost-to-cash mismatch remains a visible cost-source gap while the original paid order stays readable',()=>{
 const c=context(),work=c.p.features.video!.works.find(w=>w.id===workId)!,p=financeChanged(c,f=>({...f,transactions:f.transactions.filter(tx=>!f.metrics.some(m=>m.operationId===tx.id&&m.referenceId===work.production!.actionId))}));expect(videoClientSettlementReading(p,c.thread)).toMatchObject({receivedFen:300000,directPaidFen:null})
})
it('the thought and the receipt paper use exactly the same direct Today action',()=>{
 const c=context(),today=vi.fn(),choose=vi.fn(),result=vi.fn(),node=VideoEncounter({p:c.p,thread:c.thread,date:null,waitLabel:'',onChoose:choose,onResult:result,onToday:today});if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(node))throw Error('THREAD_REQUIRED');hooks.index=0;const rows=elements(VideoThreadAction(node.props)),button=rows.find(n=>n.type==='button')!,paper=rows.find(n=>n.type===OpeningObject)!;expect(words(button)).toBe('01合上这一单，回到今天→');expect(paper.props.onActivate).toBe(button.props.onClick);expect(paper.props.stageLabel).toBe('本单已结');expect(rows.some(n=>n.type===VideoClientReceipt)).toBe(true);(paper.props.onActivate as ()=>void)();(button.props.onClick as ()=>void)();expect(today).toHaveBeenCalledTimes(2);expect(result).not.toHaveBeenCalled();expect(choose).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled()
})
it('a new inquiry and all original account options remain explicit UI choices, with old callbacks retired',()=>{
 const c=context(),today=vi.fn(),choose=vi.fn(),result=vi.fn(),a=action(c,today,choose,result),inquiry=a.rows.find(n=>n.type==='button'&&words(n).includes('再听一份询价'))!,more=a.rows.find(n=>n.type==='button'&&words(n).includes('其他选择'))!;expect(inquiry).toBeDefined();(inquiry.props.onClick as ()=>void)();expect(choose).toHaveBeenCalledExactlyOnceWith('commission');(more.props.onClick as ()=>void)();expect(result).toHaveBeenCalledOnce();const old=a.rows.find(n=>n.type==='button')!;action({...c,thread:{...c.thread,focus:{...c.thread.focus,entityId:'another-object'}}},today,choose,result);action(c,today,choose,result);(old.props.onClick as ()=>void)();expect(today).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled()
})
it('paused or no-inquiry accounts can return to life without acquiring a new customer or resume command',()=>{
 const c=context(),v=c.p.features.video!,changed={...c,p:{...c.p,features:{...c.p.features,video:{...v,channels:v.channels.map(k=>({...k,lifecycle:'paused' as const}))}}}},rows=action(changed).rows;expect(words(rows)).toContain('回到今天');expect(words(rows)).not.toContain('再听一份询价');expect(changed.p.request).not.toHaveBeenCalled()
})
it('the original next inquiry surface still has no selected customer or automatically accepted order',()=>{
 const c=context();hooks.index=0;let open:((action?:'commission')=>void)|undefined;const draw=()=>{hooks.index=0;return elements(VideoSceneChoice({p:c.p,target:{channelId,workId,contractId},children:fn=>{open=fn;return null}}))};draw();open!('commission');const rows=draw(),dialog=rows.find(n=>n.type===Dialog)!,paper=rows.find(n=>n.type===VideoInquiryChoices)!;expect(dialog.props.layout).toBe('direct');expect(paper.props.selected).toBeNull();expect(rows.some(n=>n.type===CommandButton)).toBe(false);expect(c.p.request).not.toHaveBeenCalled()
})
it('the actual room and route read the same receipt, preserving the selected owner and original Clock',()=>{
 const c=context(),r=videoClientSettlementReading(c.p,c.thread)!;hooks.index=0;const route=NarrativeScene({...c.p,screen:'video',headingRef:null,personId:'tang-ying',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null,videoTarget:{channelId,workId,contractId}});expect(words(elements(route).find(n=>n.type==='h1'))).toBe(r.title);const surface=elements(route).find(n=>typeof n.type==='function'&&n.type.name==='SceneChoiceSurface')!;expect(surface.props.direct).toBe(true)
 hooks.values=[];hooks.index=0;let tree:unknown=OpeningMoment({p:{...c.p,accountId:'other-reading-filter'},focus:c.focus,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(c.p),onNavigate:vi.fn(),onExplore:vi.fn()});const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);for(let n=0;n<12;n++){const wrap=elements(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrap)break;tree=(wrap.props.children as (v:unknown)=>unknown)(choices.has((wrap.type as {name:string}).name)?vi.fn():null)}const room=elements(tree).find(n=>n.type===RoomTableau)!;expect(words(room.props.heading)).toContain(r.title);expect(words(room.props.context)).toContain('本单已结');expect(elements(room.props.facts).some(n=>n.type===VideoClientReceipt)).toBe(true);expect((room.props.object as ReactElement<Record<string,unknown>>).props.stageLabel).toBe('本单已结');expect(c.p.request).not.toHaveBeenCalled()
})

it('a mismatched cost-to-cash source remains a source gap rather than borrowing another payment',()=>{
 const c=context(),work=c.p.features.video!.works.find(w=>w.id===workId)!,p=financeChanged(c,f=>({...f,transactions:f.transactions.map(tx=>f.metrics.some(m=>m.operationId===tx.id&&m.referenceId===work.production!.actionId)?{...tx,sourceId:'another-source'}:tx)}));expect(videoClientSettlementReading(p,c.thread)).toMatchObject({receivedFen:300000,directPaidFen:null,feePaidFen:15000})
})

it('the layout used beside a full echo preserves every known amount, date and source gap without shrinking the type',()=>{
 const c=context(),r=videoClientSettlementReading(c.p,c.thread)!;
 for(const value of [r,{...r,directPaidFen:null,feePaidFen:null}]){const full=words(VideoClientReceipt({value})),compact=words(VideoClientReceipt({value,condensed:true}));for(const text of [moneyText(value.receivedFen),moneyText(value.prepaymentFen),moneyText(value.balanceFen),value.settledAt,'日常费用另记']){expect(full).toContain(text);expect(compact).toContain(text)}if(value.directPaidFen===null){expect(compact).toContain('直接投入来源待核');expect(compact).toContain('实付来源待核')}else{expect(compact).toContain(moneyText(value.directPaidFen));expect(compact).toContain(moneyText(value.feePaidFen))}}
})
it('a full existing echo remains intact while the room arranges the same receipt more compactly',()=>{
 const c=context(),note=<p>这段日子，另一份经营的费用和生活变化也必须保留。</p>;hooks.values=[];hooks.index=0;let tree:unknown=OpeningMoment({p:c.p,focus:c.focus,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(c.p),feedback:note,onNavigate:vi.fn(),onExplore:vi.fn()});const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);for(let n=0;n<12;n++){const wrap=elements(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrap)break;tree=(wrap.props.children as (v:unknown)=>unknown)(choices.has((wrap.type as {name:string}).name)?vi.fn():null)}const room=elements(tree).find(n=>n.type===RoomTableau)!,receipt=elements(room.props.facts).find(n=>n.type===VideoClientReceipt)!;expect(elements(room.props.feedback)).toContain(note);expect(receipt.props.condensed).toBe(true);expect(receipt.props.value).toEqual(videoClientSettlementReading(c.p,c.thread));expect(c.p.request).not.toHaveBeenCalled()
})

it('the actual room original-record handoff explicitly retains the room origin without submitting a game command',()=>{
 const c=context(),navigate=vi.fn(),focus=vi.fn(),explore=vi.fn();const draw=()=>{hooks.index=0;let tree:unknown=OpeningMoment({p:c.p,focus:c.focus,onFocus:focus,headingRef:null,fallback:roomMoment(c.p),onNavigate:navigate,onExplore:explore});const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);for(let n=0;n<12;n++){const wrap=elements(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrap)break;tree=(wrap.props.children as (v:unknown)=>unknown)(choices.has((wrap.type as {name:string}).name)?vi.fn():null)}return {tree,room:elements(tree).find(n=>n.type===RoomTableau)!}};hooks.values=[];const first=draw(),record=elements(first.room.props.record).find(n=>n.type==='button')!;(record.props.onClick as ()=>void)();const original=elements(draw().tree).find(n=>n.type===Dialog)!,full=elements(original).find(n=>n.type==='button'&&words(n)==='翻开这件事的完整原册 ↗')!;(full.props.onClick as ()=>void)();expect(navigate).toHaveBeenCalledExactlyOnceWith('video',{accountId:'personal',videoTarget:{channelId,workId,contractId},openRecord:true,returnToRoom:true});expect(roomReaderReturns('video',navigate.mock.calls[0]![1])).toBe(true);expect(c.p.request).not.toHaveBeenCalled()
})
it('the original finance and explicit life/market reading origins remain distinct from ordinary route navigation',()=>{
 expect(roomReaderReturns('finance')).toBe(true);expect(roomReaderReturns('deepseek')).toBe(true);expect(roomReaderReturns('market',{returnToRoom:true})).toBe(true);expect(roomReaderReturns('life',{returnToRoom:true})).toBe(true);expect(roomReaderReturns('video',{openRecord:true})).toBe(false);expect(roomReaderReturns('video')).toBe(false);expect(roomReaderReturns('room',{returnToRoom:true})).toBe(false)
})
