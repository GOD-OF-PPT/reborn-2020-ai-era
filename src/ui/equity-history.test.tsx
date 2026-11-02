import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import paidRaw from '../../goal-1/evidence/t17-acceptance-40/equity-history-r449/normal129-input.json?raw'
import pendingRaw from '../../goal-1/evidence/t17-acceptance-40/follow-native-r153/saved121-public-round-undecided.json?raw'
import signRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeEquitySign.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {addDays} from '../core/calendar.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {equityFollowHistory} from './equity-follow-history.ts'
import {createEquityDraftMemory} from './equity-draft.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Original normal prefixes and Controller/IDB transitions. The hook surface
// checks component callbacks/disclosure, not DOM layout, effects or Native.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return[values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useCallback:<T,>(fn:T)=>fn,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useId:()=>hooks.scope,useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown,details=true):Element[]=>Array.isArray(v)?v.flatMap(x=>elements(x,details)):isValidElement<Record<string,unknown>>(v)?[v,...(!details&&v.type==='details'?[]:elements(v.props.children,details))]:[]
const text=(v:unknown,details=true):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(x=>text(x,details)).join(''):isValidElement<Record<string,unknown>>(v)?!details&&v.type==='details'?'':text(v.props.children,details):''
function draw<T,>(scope:string,create:()=>T):T{hooks.scope=scope;hooks.index=0;return create()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ORIGINAL_ENABLED_CALLBACK_REQUIRED');return fn(...args)}
async function setup(id:string,raw:string,faulty=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='u6-history-'+id,locks=new MemoryWriterAccess();let armed=false
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks})
 await controller.initialize();await controller.importNew(raw)
 return{controller,store,locks,fault,arm:()=>{armed=true}}
}
type Harness=Awaited<ReturnType<typeof setup>>
let paid:Harness,pending:Harness,declined:Harness,defaulted:Harness,offered:Harness,unopened:Harness,putAside:Harness,expired:Harness,failed:Harness,reader:GameController
const props=(controller:GameController):GamePanelProps=>{const view=controller.snapshot.view!;return{controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),equityDraftMemory:createEquityDraftMemory()}}
const agreement=(p:GamePanelProps)=>p.features.deepseek!.agreements[0]!
const target=(p:GamePanelProps,kind:'agreement'|'negotiation'='agreement'):EquitySceneTarget=>{const row=kind==='agreement'?agreement(p):p.features.deepseek!.negotiations[0]!;return{runId:p.view.runId,accountId:'personal',businessId:row.businessId,kind,recordId:row.id}}
const send=async(h:Harness,kind:string,payload:unknown)=>{const result=await h.controller.submit(h.controller.prepare(kind,payload));expect(result.status).toBe('saved')}
async function advance(h:Harness,date:string){for(let n=0;n<12;n++){const p=props(h.controller);if(p.view.date>=date)return;const pause=p.features.workbench.pause;if(pause){expect(pause.reason).toBe('CONTENT_DECISION_PENDING');const events=p.features.workbench.events.filter(e=>e.isBlocking);expect(events).toHaveLength(1);const choices=events[0]!.choices.filter(c=>c.isDefault);expect(choices).toHaveLength(1);await send(h,'ChooseEvent',{instanceId:events[0]!.id,choiceId:choices[0]!.id})}else await send(h,'AdvanceTime',{date})}throw Error('BOUNDED_ORIGINAL_TIME_REQUIRED')}
function near(p:GamePanelProps,intent:EquityChoiceIntent,kind:'agreement'|'negotiation'='agreement',scope='near'){
 const callbacks={onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()},render=()=>draw(scope,()=>EquitySceneChoice({p,target:target(p,kind),intent,...callbacks}));let tree=render()
 const button=(label:string)=>elements(tree).find(e=>e.type==='button'&&text(e).startsWith(label))!
 const command=(kind:string,face=true)=>elements(tree,!face).filter(e=>e.type===CommandButton&&e.props.kind===kind)
 return{tree:()=>tree,render:()=>{tree=render();return tree},button,command,callbacks}
}
beforeAll(async()=>{
 paid=await setup('paid',paidRaw);pending=await setup('pending',pendingRaw);declined=await setup('declined',pendingRaw);defaulted=await setup('defaulted',pendingRaw);offered=await setup('offered',signRaw);unopened=await setup('unopened',signRaw);putAside=await setup('put-aside',signRaw);expired=await setup('expired',signRaw);failed=await setup('failed',pendingRaw,true)
 await send(declined,'FollowEquityRound',{agreementId:agreement(props(declined.controller)).id,amountFen:0});await advance(defaulted,'2025-09-16')
 await send(unopened,'SignEquityAgreement',{negotiationId:props(unopened.controller).features.deepseek!.negotiations[0]!.id});await send(putAside,'DeclineEquityTerms',{negotiationId:props(putAside.controller).features.deepseek!.negotiations[0]!.id})
 await advance(expired,addDays(props(expired.controller).features.deepseek!.negotiations[0]!.expiresAt,1))
 reader=new GameController({codec:createCampaignCodec(),store:paid.store,locks:paid.locks});await reader.initialize();await reader.continueLife(paid.controller.snapshot.view!.runId)
})
beforeEach(()=>hooks.slots.clear())
afterAll(async()=>{await reader?.close();for(const h of [paid,pending,declined,defaulted,offered,unopened,putAside,expired,failed]){await h?.controller.close(true);await h?.store.close()}})

it('binds the actual2496 record to the same round and original committed command without using today or current shares as the old payment',()=>{
 const p=props(paid.controller),a=agreement(p),before=paid.controller.exportSaved();expect(p.view.origin).toBe('normal');expect(equityFollowHistory(p,a)).toEqual({state:'participated',date:'2025-09-01',amountFen:249600,reason:null});expect(a.shares).toBe(2812)
 const {sceneCommands:_omitted,...withoutCommands}=p.features,missing={...p,features:withoutCommands};expect(equityFollowHistory(missing,a).state).toBe('unknown')
 const wrong={...p,features:{...p.features,deepseek:{...p.features.deepseek!,rounds:p.features.deepseek!.rounds.filter(r=>r.date!==a.followAt)}}};expect(equityFollowHistory(wrong,a).state).toBe('unknown')
 const future={...a,followAt:'2026-01-01'};expect(equityFollowHistory(p,future)).toMatchObject({state:'unknown',date:null,amountFen:null})
 expect(paid.controller.exportSaved()).toBe(before)
})

it('shows the saved payment and two real destinations on the paid history, with the original zero action retained only in details',()=>{
 const p=props(paid.controller),before=paid.controller.exportSaved(),ui=near(p,'follow'),face=text(ui.tree(),false)
 expect(ui.tree().props.title).toBe('这轮投入，已经留下记录。');expect(face).toContain('本轮已追加本金¥2,496');expect(face).toContain('2025-09-01');expect(face).toContain('当前仍持2812 / 1562500股');expect(face).not.toContain('付款 ¥0');expect(face).not.toContain('追加投入');expect(ui.command('FollowEquityRound')).toHaveLength(0)
 const all=ui.command('FollowEquityRound',false);expect(all).toHaveLength(1);expect(all[0]!.props.payload).toEqual({agreementId:agreement(p).id,amountFen:0});expect(all[0]!.props.confirm).toBe(true)
 invoke(ui.button('回到这份持股'),'onClick');expect(ui.callbacks.onIntent).toHaveBeenCalledWith('holding');expect(p.request).not.toHaveBeenCalled();expect(paid.controller.exportSaved()).toBe(before)
})

it('keeps an explicit zero decision separate from automatic expiry and never turns either into a new comparison',()=>{
 for(const [h,state,label,date]of [[declined,'declined','本轮选择不追加','2025-09-01'],[defaulted,'defaulted','本轮没有追加付款','2025-09-15']] as const){
  const p=props(h.controller),before=h.controller.exportSaved(),history=equityFollowHistory(p,agreement(p)),ui=near(p,'follow','agreement',state),face=text(ui.tree(),false)
  expect(history).toMatchObject({state,date,amountFen:0});expect(face).toContain(label);expect(face).toContain(date);expect(face).not.toContain('追加投入');expect(ui.command('FollowEquityRound')).toHaveLength(0);expect(h.controller.exportSaved()).toBe(before)
 }
})

it('labels a genuinely unopened round as before, preserving the original holding and no fabricated recorded payment',()=>{
 const p=props(unopened.controller),before=unopened.controller.exportSaved(),ui=near(p,'follow'),face=text(ui.tree(),false)
 expect(equityFollowHistory(p,agreement(p))).toMatchObject({state:'before',date:null,amountFen:null});expect(ui.tree().props.title).toBe('这轮融资还没有开放。');expect(face).not.toContain('本轮已追加本金');expect(face).not.toContain('原记录 ·');expect(ui.command('FollowEquityRound')).toHaveLength(0);expect(unopened.controller.exportSaved()).toBe(before)
 const holding=near(p,'holding','agreement','before-holding');expect(text(holding.tree(),false)).toContain('看看融资安排');expect(text(holding.tree(),false)).not.toContain('查看已经发生的决定');invoke(holding.button('看看融资安排'),'onClick');expect(holding.callbacks.onIntent).toHaveBeenCalledWith('follow')
})

it('keeps the pending zero and actual2496 original payload, whole-share quote and confirmation intact',()=>{
 const p=props(pending.controller),before=pending.controller.exportSaved(),ui=near(p,'follow');expect(equityFollowHistory(p,agreement(p)).state).toBe('pending');expect(text(ui.tree(),false)).toContain('追加投入');expect(ui.command('FollowEquityRound')[0]!.props.payload).toEqual({agreementId:agreement(p).id,amountFen:0})
 invoke(ui.button('试算一笔投入'),'onClick');ui.render();const input=elements(ui.tree()).find(e=>e.type==='input'&&e.props.inputMode==='decimal')!;invoke(input,'onChange',{currentTarget:{value:'2496'}});ui.render()
 const original=ui.command('FollowEquityRound')[0]!;expect(original.props.payload).toEqual({agreementId:agreement(p).id,amountFen:249600});expect(original.props.confirm).toBe(true);expect(text(ui.tree(),false)).toContain('新增312股')
 const rendered=CommandButton(original.props as unknown as Parameters<typeof CommandButton>[0]),pay=elements(rendered).find(e=>e.type==='button')!;invoke(pay,'onClick');expect(p.request).toHaveBeenCalledWith('FollowEquityRound',{agreementId:agreement(p).id,amountFen:249600},expect.any(String),true);expect(pending.controller.exportSaved()).toBe(before)
})

it('keeps current sign and decline on the face, but moves closed and expired original refusals into the original details',()=>{
 const live=props(offered.controller),liveBefore=offered.controller.exportSaved(),liveUi=near(live,'terms','negotiation','offered'),sign=liveUi.command('SignEquityAgreement'),decline=liveUi.command('DeclineEquityTerms');expect(sign).toHaveLength(1);expect(decline).toHaveLength(1);expect(liveUi.command('SignEquityAgreement',false)).toHaveLength(1);expect(sign[0]!.props.payload).toEqual({negotiationId:live.features.deepseek!.negotiations[0]!.id});expect(sign[0]!.props.confirm).toBe(true);expect(offered.controller.exportSaved()).toBe(liveBefore)
 const current=props(expired.controller),before=expired.controller.exportSaved(),expiredUi=near(current,'terms','negotiation','expired')
 expect(expiredUi.command('SignEquityAgreement')).toHaveLength(0);expect(expiredUi.command('DeclineEquityTerms')).toHaveLength(0);expect(expiredUi.command('SignEquityAgreement',false)).toHaveLength(1);expect(text(expiredUi.tree(),false)).toContain('回到今天');expect(expired.controller.exportSaved()).toBe(before)
 const closed=near(props(putAside.controller),'terms','negotiation','put-aside');expect(closed.command('SignEquityAgreement')).toHaveLength(0);expect(closed.command('DeclineEquityTerms')).toHaveLength(0);expect(text(closed.tree(),false)).toContain('当时报价')
 const signed=near(props(paid.controller),'terms','negotiation','signed');expect(signed.command('SignEquityAgreement')).toHaveLength(0);expect(signed.command('DeclineEquityTerms')).toHaveLength(0)
})

it('permits read-only history navigation while keeping missing committed provenance visibly unknown',()=>{
 const p=props(reader),before=reader.exportSaved(),ui=near(p,'follow','agreement','reader');expect(p.view.readOnly).toBe(true);invoke(ui.button('回到今天'),'onClick');expect(ui.callbacks.onToday).toHaveBeenCalledOnce();expect(p.request).not.toHaveBeenCalled();expect(reader.exportSaved()).toBe(before)
 const source=props(paid.controller),{sceneCommands:_omitted,...withoutCommands}=source.features,missing={...source,features:withoutCommands},unknown=near(missing,'follow','agreement','unknown');expect(unknown.tree().props.title).toBe('先核对这轮原记录。');expect(text(unknown.tree(),false)).toContain('暂时无法核实');expect(text(unknown.tree(),false)).not.toContain('本轮已追加本金')
})

it('publishes a historical zero result only after the exact original retry succeeds following a real head write abort',async()=>{
 const p=props(failed.controller),before=failed.controller.exportSaved(),ui=near(p,'follow','agreement','failure'),oldCompare=ui.button('试算一笔投入');failed.arm()
 expect((await failed.controller.submit(failed.controller.prepare('FollowEquityRound',{agreementId:agreement(p).id,amountFen:0}))).status).toBe('unsaved');expect(failed.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(failed.controller.exportSaved()).toBe(before)
 const click=oldCompare.props.onClick as ()=>void;click();ui.render();expect(elements(ui.tree()).some(e=>e.type==='input'&&e.props.inputMode==='decimal')).toBe(false);expect(p.request).not.toHaveBeenCalled()
 const candidate=failed.controller.exportCandidate();expect((await failed.controller.retry()).status).toBe('saved');expect(failed.controller.exportSaved()).toBe(candidate);const after=props(failed.controller);expect(equityFollowHistory(after,agreement(after)).state).toBe('declined');expect(text(near(after,'follow','agreement','saved').tree(),false)).toContain('本轮选择不追加')
})
