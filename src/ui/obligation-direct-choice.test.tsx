import {afterEach,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayingView,PlayFeatures} from './game-types.ts'
import {currentDueReading} from './cash-gap-reading.ts'
import {obligationTargetFor,cashPauseTarget,singleObligationTarget,resolveObligationScene,obligationSceneKey,type ObligationSceneTarget} from './obligation-scene.ts'
import {ObligationChoice} from './ObligationChoice.tsx'
import {DebtPayment,Obligations} from './Obligations.tsx'
import {CommandButton} from './CommandButton.tsx'
import {CashGapDecision} from './CashGapDecision.tsx'
import {SceneAttention} from './NarrativeScene.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {OpeningObject} from './OpeningObject.tsx'
// Pure UI and public normal in-memory commands. No store, codec, archive,
// import/export, persistence construction, replay or failure injection.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const a=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const};return {...a,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=> 'obligation-ui'}})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'obligation-direct-normal',actorId:'player',commandId:'create',seed:'obligation-direct-normal',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'gap-ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind+':'+JSON.stringify(result));return result.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
function props(run:GameRun):GamePanelProps{const v=view(run);return {view:v,features:v.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view:v,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
let paused:GameRun,partial:GameRun,partialAcknowledged:GameRun,released:GameRun,paid:GameRun,paidAcknowledged:GameRun
beforeAll(()=>{
 let run=act(initial,'DeclineOffer',{offerId:'manual-first-2020'})
 run=act(run,'PlanStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:200,limitPriceFen:11988,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-03-31'})
 for(let n=0;n<12;n++){
  const p=props(run),w=p.features.workbench
  if(w.pause?.reason==='CASH_SHORTFALL'){paused=run;break}
  if(w.pause){const e=w.events.find(e=>e.isBlocking),c=e?.choices.find(c=>c.isDefault);if(!e||!c||c.costFen||c.actionPoints)throw Error('PUBLIC_FREE_DEFAULT_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id})}
  else run=act(run,'AdvanceTime',{date:'2020-02-01'})
 }
 if(!paused)throw Error('ACTUAL_PUBLIC_CASH_GAP_REQUIRED')
 const p=props(paused),debt=p.features.workbench.finance[0]!.obligations.find(d=>d.date<=p.view.date)!,order=p.features.market.orders.find(o=>o.status==='planned')!
 if(!debt||!order)throw Error('ORIGINAL_DEBT_AND_UNEXECUTED_PLAN_REQUIRED')
 partial=act(paused,'PayObligation',{accountId:debt.accountId,obligationId:debt.id,amountFen:100000})
 partialAcknowledged=act(partial,'AcknowledgeCashGap',{instanceId:p.features.workbench.pause!.instanceId})
 released=act(paused,'CancelStockOrder',{orderId:order.id})
 paid=act(released,'PayObligation',{accountId:debt.accountId,obligationId:debt.id,amountFen:debt.remainingFen})
 paidAcknowledged=act(paid,'AcknowledgeCashGap',{instanceId:p.features.workbench.pause!.instanceId})
},120000)
type Element=ReactElement<Record<string,unknown>>
function nodes(v:unknown):Element[]{if(Array.isArray(v))return v.flatMap(nodes);return isValidElement<Record<string,unknown>>(v)?[v,...nodes(v.props.children),...nodes(v.props.footer)]:[]}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
function target(run=paused){const p=props(run),debt=currentDueReading(p)!.debts.find(d=>d.date<=p.view.date)!;return obligationTargetFor(p,debt)!}
function driver(run=paused,accountId='personal'){const p={...props(run),accountId},drafts=new Map<string,string>(),closed=vi.fn(),inspect=vi.fn(),onDraft=vi.fn((key:string,amount:string)=>drafts.set(key,amount));let selected=target(run);const draw=(next=selected)=>{selected=next;hooks.index=0;const tree=ObligationChoice({p,target:selected,drafts,onDraft,onClose:closed,onInspect:inspect}),rows=nodes(tree),payment=rows.find(n=>n.type===DebtPayment);if(payment)rows.push(...nodes(DebtPayment(payment.props as unknown as ComponentProps<typeof DebtPayment>)));return {tree,rows}};return {p,drafts,closed,inspect,onDraft,draw}}
it('carries the same run, original account, debt and source from the room into one direct choice',()=>{
 const p=props(paused),t=target(),moment=roomMoment(p),value=resolveObligationScene(p,t)
 expect(value.status).toBe('payment');expect(moment.inspect?.obligationTarget).toEqual(t);expect(moment.inspect?.label).toBe('核对这笔到期款');expect(moment.line).toContain('¥4,000');expect(moment.detail).toContain('¥2,000.02');expect(p.request).not.toHaveBeenCalled()
})
it('a concrete responsibility entry opens the exact original debt without navigating the quarter directory',()=>{
 const p=props(paused),open=vi.fn(),choose=vi.fn();hooks.index=0;const rows=nodes(SceneAttention({p,onOpen:open,onObligation:choose})),button=rows.find(n=>n.type==='button'&&words(n)==='处理这笔义务')!;(button.props.onClick as ()=>void)();expect(choose).toHaveBeenCalledExactlyOnceWith(target());expect(open).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
})
it('preserves the legacy full-record route when an exact public target cannot be proved',()=>{
 const p=props(paused),open=vi.fn(),choose=vi.fn(),f=p.features.workbench.finance[0]!;const invalid={...p,features:{...p.features,workbench:{...p.features.workbench,finance:[f,f]}}};hooks.index=0;const rows=nodes(SceneAttention({p:invalid,onOpen:open,onObligation:choose})),button=rows.find(n=>n.type==='button'&&words(n)==='处理这笔义务')!;(button.props.onClick as ()=>void)();expect(choose).not.toHaveBeenCalled();expect(open).toHaveBeenCalledWith('quarter','personal')
})
it('uses the original amount control, original payload and independent payment confirmation',()=>{
 const ui=driver(),first=ui.draw();expect(first.tree.props.layout).toBe('direct');let command=first.rows.find(n=>n.type===CommandButton&&n.props.kind==='PayObligation')!;expect(command.props).toMatchObject({kind:'PayObligation',payload:{accountId:'personal',obligationId:(target() as Extract<ObligationSceneTarget,{kind:'payment'}>).obligationId,amountFen:400000},confirm:true})
 const input=first.rows.find(n=>n.type==='input')!;(input.props.onChange as (e:unknown)=>void)({target:{value:'1000'}});command=ui.draw().rows.find(n=>n.type===CommandButton&&n.props.kind==='PayObligation')!;expect(command.props.payload).toMatchObject({amountFen:100000});expect(ui.onDraft).toHaveBeenCalledOnce();expect(ui.p.request).not.toHaveBeenCalled()
})
it('keeps invalid decimal and explicit zero out of the original payment command',()=>{
 const ui=driver();for(const amount of ['','0','1.234']){const input=ui.draw().rows.find(n=>n.type==='input')!;(input.props.onChange as (e:unknown)=>void)({target:{value:amount}});const rows=ui.draw().rows;expect(rows.some(n=>n.type===CommandButton&&n.props.kind==='PayObligation')).toBe(false);expect(words(rows)).toContain('请输入大于0')}
})
it('keeps the same draft across close and original-ledger inspection without making a command',()=>{
 const ui=driver(),first=ui.draw(),input=first.rows.find(n=>n.type==='input')!;(input.props.onChange as (e:unknown)=>void)({target:{value:'123.45'}});ui.draw().tree.props.onClose();expect(ui.closed).toHaveBeenCalledOnce();const reading=ui.draw().rows.find(n=>n.type==='button'&&words(n)==='翻看这份原账 ↗')!;(reading.props.onClick as ()=>void)();expect(ui.inspect).toHaveBeenCalledExactlyOnceWith('personal');expect(ui.draw().rows.find(n=>n.type==='input')?.props.value).toBe('123.45');expect(ui.p.request).not.toHaveBeenCalled()
})
it('a real remaining-balance change becomes a new payment draft while preserving the old one',()=>{
 const before=resolveObligationScene(props(paused),target()),after=resolveObligationScene(props(partial),target());if(before.status!=='payment'||after.status!=='payment')throw Error('ACTUAL_PARTIAL_PAYMENT_REQUIRED');expect(before.draftKey).not.toBe(after.draftKey);expect(after.debt.remainingFen).toBe(300000);expect(obligationSceneKey(target())).toBe(obligationSceneKey(singleObligationTarget(props(partial))!))
})
it('after actual payment, the old payment target cannot silently switch to another debt or the pause',()=>{
 expect(resolveObligationScene(props(paid),target()).status).toBe('invalid');expect(singleObligationTarget(props(paid))).toEqual(cashPauseTarget(props(paid)));expect(roomMoment(props(paid)).inspect?.obligationTarget).toEqual(cashPauseTarget(props(paid)));expect(singleObligationTarget(props(paidAcknowledged))).toBeNull()
})
it('cash-only pause opens its original decision and an old pause identity expires',()=>{
 const p=props(paid),t=cashPauseTarget(p)!,draw=ObligationChoice({p,target:t,drafts:new Map(),onDraft:vi.fn(),onClose:vi.fn(),onInspect:vi.fn()});expect(nodes(draw).some(n=>n.type===CashGapDecision)).toBe(true);expect(nodes(draw).some(n=>n.type===DebtPayment)).toBe(false);expect(resolveObligationScene(props(paidAcknowledged),t).status).toBe('invalid')
})
it('foreign run, account, business or origin and duplicate sources never select another obligation',()=>{
 const p=props(paused),t=target();if(t.kind!=='payment')throw Error('PAYMENT_REQUIRED');for(const bad of [{...t,runId:'another-run'},{...t,accountId:'other-account'},{...t,businessId:'other-business'},{...t,originOperationId:'other-operation'},{...t,sourceEventId:'other-source'},{...t,originalFen:t.originalFen+1}])expect(resolveObligationScene(p,bad).status).toBe('invalid');const f=p.features.workbench.finance[0]!;expect(resolveObligationScene({...p,features:{...p.features,workbench:{...p.features.workbench,finance:[f,f]}}},t).status).toBe('invalid')
})
it('the explicit target owns the account even when the current reading shows another account',()=>{
 const ui=driver(paused,'another-reading-account');const command=ui.draw().rows.find(n=>n.type===CommandButton&&n.props.kind==='PayObligation')!;expect(command.props.payload).toMatchObject({accountId:'personal'});expect(resolveObligationScene(ui.p,target()).status).toBe('payment')
})
it('stale A to B to A callbacks cannot change the new draft or close its new reader',()=>{
 const ui=driver(),old=ui.draw(),input=old.rows.find(n=>n.type==='input')!,pause=cashPauseTarget(ui.p)!;ui.draw(pause);ui.draw(target());(input.props.onChange as (e:unknown)=>void)({target:{value:'99'}});old.tree.props.onClose();expect(ui.onDraft).not.toHaveBeenCalled();expect(ui.closed).not.toHaveBeenCalled()
})
it('the responsibility book uses explicit reading links while its default original payment fields remain intact',()=>{
 const p=props(paused),debts=currentDueReading(p)!.debts,select=vi.fn(),entry=Obligations({props:p,debts,onSelect:select}),button=nodes(entry).find(n=>n.type==='button')!;(button.props.onClick as ()=>void)();expect(select).toHaveBeenCalledExactlyOnceWith(debts[0]);expect(nodes(entry).some(n=>n.type===DebtPayment)).toBe(false);expect(nodes(Obligations({props:p,debts})).some(n=>n.type===DebtPayment)).toBe(true)
})
it('the room thought and its physical paper deliver the same original debt target',()=>{
 const p=props(paused),navigate=vi.fn();hooks.values=[];hooks.index=0;let tree:unknown=OpeningMoment({p,focus:null,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(p),onNavigate:navigate,onExplore:vi.fn()});const choices=new Set(['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice']),actions=new Set(['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction','DayThreadAction']);for(let n=0;n<12;n++){const wrap=nodes(tree).find(e=>typeof e.type==='function'&&(choices.has(e.type.name)||actions.has(e.type.name))&&typeof e.props.children==='function');if(!wrap)break;tree=(wrap.props.children as (v:unknown)=>unknown)(choices.has((wrap.type as {name:string}).name)?vi.fn():null)}const room=nodes(tree).find(n=>n.type===RoomTableau)!;expect(words(room.props.heading)).toContain('这笔支出');const buttons=nodes(room.props.decisions).filter(n=>n.type==='button');expect(buttons.length).toBeGreaterThan(0);const paper=nodes(room.props.object).find(n=>n.type===OpeningObject)!;expect(paper.props.onActivate).toBe(buttons[0]!.props.onClick);expect(paper.props.actionLabel).toBe('核对这笔到期款');(buttons[0]!.props.onClick as ()=>void)();(paper.props.onActivate as ()=>void)();expect(navigate).toHaveBeenCalledTimes(2);expect(navigate).toHaveBeenCalledWith('quarter',expect.objectContaining({obligationTarget:target()}));expect(p.request).not.toHaveBeenCalled()
})

it('acknowledging a real unpaid pause keeps the exact remaining debt actionable',()=>{
 const p=props(partialAcknowledged);expect(cashPauseTarget(p)).toBeNull();const value=resolveObligationScene(p,target());expect(value.status).toBe('payment');if(value.status==='payment')expect(value.debt.remainingFen).toBe(300000)
})
it('several real due debts require explicit selection instead of choosing the first in the scene',()=>{
 let run=partialAcknowledged
 for(let n=0;n<20;n++){
  const p=props(run),current=currentDueReading(p)!,due=current.debts.filter(d=>d.date<=p.view.date)
  if(due.length>1){expect(singleObligationTarget(p)).toBeNull();const choose=vi.fn();hooks.index=0;const buttons=nodes(SceneAttention({p,onOpen:vi.fn(),onObligation:choose})).filter(n=>n.type==='button'&&words(n)==='处理这笔义务');expect(buttons).toHaveLength(due.length);(buttons[1]!.props.onClick as ()=>void)();expect(choose).toHaveBeenCalledExactlyOnceWith(obligationTargetFor(p,due[1]!));return}
  const w=p.features.workbench
  if(w.pause){const e=w.events.find(e=>e.isBlocking),c=e?.choices.find(c=>c.isDefault);if(w.pause.reason!=='CONTENT_DECISION_PENDING'||!e||!c||c.costFen||c.actionPoints)throw Error('PUBLIC_FREE_RESPONSE_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id})}
  else run=act(run,'AdvanceTime',{date:'2020-03-01'})
 }
 throw Error('ACTUAL_MULTIPLE_DUE_DEBTS_REQUIRED')
},120000)
