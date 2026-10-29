import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t16-epilogue/native-exit-prefix/normal-before-exit-accept.json?raw'
import finishedRaw from '../../goal-1/evidence/t16-epilogue/asset-a01/normal-asset-finished.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {evaluateCommand} from '../core/commands.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import App from './App.tsx'
import {EndingStage} from './EndingStage.tsx'
import {EquityMoment} from './EquityMoment.tsx'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {Dialog} from './Dialog.tsx'
import {equityFocusFor,equityJourneyFor} from './equity-player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {ClockCommandDetails} from './ClockCommandDetails.tsx'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Real App callbacks + normal Controller/IDB; this driver does not run DOM,
// effects, Chrome or a human playtest. Cases create their own committed source.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=>hooks.scope,useSyncExternalStore:<T,>(_subscribe:unknown,get:()=>T)=>get(),useMemo:<T,>(create:()=>T,deps:readonly unknown[])=>{const slot=state<{deps:readonly unknown[];value:T}|null>(null),old=slot[0];if(old&&old.deps.length===deps.length&&deps.every((d,i)=>Object.is(d,old.deps[i])))return old.value;const next={deps:[...deps],value:create()};slot[1](next);return next.value}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children),...elements(v.props.footer)]:[]
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''
function render<T,>(scope:string,create:()=>T):T{hooks.scope=scope;hooks.index=0;return create()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_CALLBACK_REQUIRED:'+name);return fn(...args)}
async function setup(id:string,source=raw,faulty=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='u6-tail-'+id;let armed=false,n=0
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`u6-tail-${id}-${++n}`})
 await controller.initialize();await controller.importNew(source)
 const draw=()=>render('app-'+id,()=>elements(App({controller,focusPreferenceStorage:{getItem:()=>null,setItem:()=>{throw Error('TAIL_MUST_NOT_WRITE_A_NEW_SEASON_PREFERENCE')}}})))
 const scene=()=>draw().find(e=>e.type===EquityMoment)!,p=()=>scene().props.p as GamePanelProps
 const open=()=>{const ending=draw().find(e=>typeof e.props.onOpenEquity==='function')!,page=render('ending-'+id,()=>Reflect.apply(EndingStage,undefined,[ending.props])),button=elements(page).find(e=>e.type==='button'&&text(e.props.children)==='看看原持股、买方与款项 ↗')!;invoke(button,'onClick')}
 const select=(target:EquitySceneTarget)=>invoke(scene(),'onFocus',equityFocusFor(p(),target))
 const confirm=async(label:string)=>{
  const modal=draw().find(e=>e.type===Dialog&&e.props.title===label)!,button=elements(modal).find(e=>e.type==='button'&&text(e.props.children)==='就这样决定 →')!,spy=vi.spyOn(controller,'submit')
  invoke(button,'onClick');const result=await spy.mock.results.at(-1)!.value
  // Let the original App dispatch/finally settle its pending confirmation.
  // The Controller promise alone does not complete that UI callback chain.
  await new Promise(resolve=>setTimeout(resolve,0));spy.mockRestore();return result
 }
 return {codec,store,controller,draw,scene,p,open,select,confirm,fault,arm:()=>{armed=true},close:async()=>{await controller.close();await store.close()}}
}
let reading:Awaited<ReturnType<typeof setup>>,failed:Awaited<ReturnType<typeof setup>>,prefix:{sale:string;due:string;target:EquitySceneTarget}
beforeAll(async()=>{
 reading=await setup('reading');failed=await setup('abort',raw,true)
 const view=reading.controller.snapshot.view!,p:GamePanelProps={controller:reading.controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('PREFIX_READING_MUST_NOT_ACT')}},target=quote(p),codec=reading.codec
 let model=codec.import(raw)
 const step=(kind:string,payload:unknown,commandId:string)=>{const result=evaluateCommand(model,{runId:model.runId,actorId:model.actorId,expectedRevision:model.revision,commandId,kind,payload},codec.registry,model.actorId);if(result.status!=='proposed')throw Error('ORIGINAL_NORMAL_PREFIX_REJECTED:'+kind);model=codec.validateRun(result.nextRun)}
 step('AcceptEquityExit',{exitId:target.kind==='exit'?target.recordId:'',shares:1000},'u6-tail-prefix-sale')
 const sale=codec.export(model),due=model.deepseek!.exits.find(e=>target.kind==='exit'&&e.id===target.recordId)!.dueAt!
 step('AdvanceEpilogueTime',{date:due},'u6-tail-prefix-wait')
 prefix={sale,due:codec.export(model),target}
})
afterAll(async()=>{for(const h of [reading,failed])if(h)await h.close()})
beforeEach(()=>hooks.slots.clear())
function quote(p:GamePanelProps):EquitySceneTarget{
 const rows=p.features.deepseek!.exits.filter(e=>e.buyerWilling===true&&!e.quoteExpired&&e.operationId===null);expect(rows).toHaveLength(1)
 const e=rows[0]!,a=p.features.deepseek!.agreements.find(a=>a.id===e.agreementId)!
 return {runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'exit',recordId:e.id}
}
const cash=(p:GamePanelProps)=>p.view.accounts.find(a=>a.accountId==='personal')!.cashFen

it('enters a finite original-object scene and keeps new preparations, investment and governance out of its choices',()=>{
 const h=reading,before=h.controller.exportSaved();h.open()
 const entry=h.p(),entryFocus=h.scene().props.focus as ReturnType<typeof equityFocusFor>
 expect(equityJourneyFor(entry,entryFocus).phase).toBe('tail-entry')
 const noop=vi.fn(),choice=(target:EquitySceneTarget|null,intent:Parameters<typeof EquitySceneChoice>[0]['intent'])=>render('tail-choice-'+intent,()=>EquitySceneChoice({p:entry,target,intent,onClose:noop,onChoose:noop,onIntent:noop,onInspect:noop,onToday:noop}))
 expect(elements(choice(null,'objects')).some(e=>e.type===CommandButton)).toBe(false)
 const target=quote(entry);h.select(target);expect(h.p().view.phase).toBe('epilogue')
 const business=equityJourneyFor(entry,equityFocusFor(entry,{runId:target.runId,accountId:target.accountId,businessId:target.businessId,kind:'business'}))
 expect(business.title).toContain('原主体');expect(business.line).toContain('不开始新的关系');expect(business.action).toMatchObject({kind:'choice',intent:'business'})
 for(const intent of ['prepare','discover','negotiate','governance'] as const){const tree=choice(target,intent);expect(text(tree)).toContain('尾声只处理原来的事项');expect(elements(tree).some(e=>e.type===CommandButton)).toBe(false)}
 const moment=render('tail-quote',()=>Reflect.apply(EquityMoment,undefined,[h.scene().props])),tableau=elements(moment).find(e=>e.props.decisions!==undefined)!
 expect(text(tableau.props.context)).toContain('2025年第四季');expect(text(tableau.props.context)).toContain('原事项 2027-07-01');expect(text(tableau.props.context)).not.toContain('2027-Q3')
 expect(h.controller.exportSaved()).toBe(before)
})

it('keeps the original quote identity after an actual partial transfer without treating the credit as cash',async()=>{
 const h=await setup('sale')
 try{
  h.open();const t=quote(h.p());h.select(t)
  const before=h.p(),a=before.features.deepseek!.agreements[0]!,budget=before.view.budget,label='核对本笔部分转让'
  before.request('AcceptEquityExit',{exitId:t.kind==='exit'?t.recordId:'',shares:1000},label,true)
  const decision=h.draw().find(e=>e.type===Dialog&&e.props.title===label)!,saleFacts=elements(decision).find(e=>e.type===EquityDecisionFacts)!
  expect(saleFacts.props.view).toBe(before.view);expect((saleFacts.props.preview as {privateSale:{shares:number;netReceivableFen:number}}).privateSale).toMatchObject({shares:1000,netReceivableFen:689670})
  expect((await h.confirm(label)).status).toBe('saved')
  let p=h.p(),f=h.scene().props.focus as ReturnType<typeof equityFocusFor>,j=equityJourneyFor(p,f)
  expect(f.equityTarget).toEqual(t);expect(j.phase).toBe('receivable');expect(cash(p)).toBe(cash(before));expect(p.view.budget).toEqual(budget)
  expect(p.features.deepseek!.agreements.find(r=>r.id===a.id)!.shares).toBe(a.shares-1000)
  expect(p.controller.preview(p.controller.prepare('CollectEquityExit',{exitId:t.kind==='exit'?t.recordId:'',amountFen:1})).reasonCodes).toContain('EQUITY_EXIT_NOT_DUE')
  expect((await h.store.load(p.view.runId))!.run).toEqual(JSON.parse(h.controller.exportSaved()).state)
 }finally{await h.close()}
})

it('uses the legal next finite date for an original credit and keeps its money, budget and selected identity through waiting',async()=>{
 // This prefix is independently rebuilt by original legal core commands. It
 // is not the output of another test and is not claimed as App/native input.
 const h=await setup('waiting',prefix.sale)
 try{
  h.open();h.select(prefix.target);let p=h.p();const before=p,budget=p.view.budget,f=h.scene().props.focus as ReturnType<typeof equityFocusFor>,credit=equityJourneyFor(p,f).resolution.exit!.receivable!,due=credit.dueAt
  const moment=render('tail-wait',()=>Reflect.apply(EquityMoment,undefined,[h.scene().props])),clock=elements(moment).find(e=>e.type===ClockAdvance)!
  expect(clock.props.date).toBe(p.features.journey!.nextTailDate);expect(clock.props.date).toBe(due)
  p.request('AdvanceTime',{date:due},'等这笔原款到期',true)
  const modal=h.draw().find(e=>e.type===Dialog&&String(e.props.title).startsWith('沿原事项继续至'))!
  const details=elements(modal).find(e=>e.type===CommandDetails)!
  expect(details.props.clock).toMatchObject({runId:p.view.runId,sourceRevision:p.view.revision,target:due})
  const detailTree=Reflect.apply(CommandDetails,undefined,[details.props])
  expect(elements(detailTree).some(e=>e.type===ClockCommandDetails&&e.props.projection===details.props.clock)).toBe(true)
  expect((await h.confirm(String(modal.props.title))).status).toBe('saved')
  p=h.p();const j=equityJourneyFor(p,h.scene().props.focus as ReturnType<typeof equityFocusFor>);expect(j.phase).toBe('collection');expect(p.view.date).toBe(due);expect(cash(p)).toBe(cash(before));expect(p.view.budget).toEqual(budget)
  expect((h.scene().props.focus as ReturnType<typeof equityFocusFor>).equityTarget).toEqual(prefix.target)
  expect((await h.store.load(p.view.runId))!.run).toEqual(JSON.parse(h.controller.exportSaved()).state)
 }finally{await h.close()}
})

it('collects an original due credit in explicit partial amounts before returning to the same object from the finite review',async()=>{
 const h=await setup('collection',prefix.due)
 try{
  h.open();h.select(prefix.target);let p=h.p(),j=equityJourneyFor(p,h.scene().props.focus as ReturnType<typeof equityFocusFor>);const t=prefix.target,credit=j.resolution.exit!.receivable!,budget=p.view.budget,part=Math.floor(credit.amountFen/2)
  for(const [index,amountFen] of [part,credit.amountFen-part].entries()){
   const old=h.p(),payLabel='核对第'+(index+1)+'笔原款';old.request('CollectEquityExit',{exitId:t.kind==='exit'?t.recordId:'',amountFen},payLabel,true)
   const decision=h.draw().find(e=>e.type===Dialog&&e.props.title===payLabel)!,facts=elements(decision).find(e=>e.type===EquityDecisionFacts)!
   expect(facts.props.view).toBe(old.view);expect((facts.props.command as {payload:{amountFen:number}}).payload.amountFen).toBe(amountFen)
   expect((await h.confirm(payLabel)).status).toBe('saved');p=h.p();expect(cash(p)-cash(old)).toBe(amountFen)
   j=equityJourneyFor(p,h.scene().props.focus as ReturnType<typeof equityFocusFor>);expect(j.phase).toBe(index===0?'collection':'collected')
  }
  expect(j.action).toMatchObject({kind:'today',label:'收好原记录，回到尾声'});expect(p.view.budget).toEqual(budget)
  expect((await h.store.load(p.view.runId))!.run).toEqual(JSON.parse(h.controller.exportSaved()).state)
  invoke(h.scene(),'onToday');expect(h.draw().some(e=>typeof e.props.onOpenEquity==='function')).toBe(true)
  h.open();expect((h.scene().props.focus as ReturnType<typeof equityFocusFor>).equityTarget).toEqual(t)
  expect(equityJourneyFor(h.p(),h.scene().props.focus as ReturnType<typeof equityFocusFor>).phase).toBe('collected')
 }finally{await h.close()}
})

it('retains the original quote after a real head.put abort and changes paper only after retrying the exact candidate',async()=>{
 const h=failed
  h.open();const t=quote(h.p());h.select(t);const before=h.controller.exportSaved(),p=h.p();h.arm()
  p.request('AcceptEquityExit',{exitId:t.kind==='exit'?t.recordId:'',shares:1000},'核对未保存的部分转让',true)
  expect((await h.confirm('核对未保存的部分转让')).status).toBe('unsaved')
  expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(h.controller.exportSaved()).toBe(before)
  expect(equityJourneyFor(h.p(),h.scene().props.focus as ReturnType<typeof equityFocusFor>).phase).toBe('quote')
  expect((await h.store.load(p.view.runId))!.run).toEqual(JSON.parse(before).state)
  const candidate=h.controller.exportCandidate(),retry=h.draw().find(e=>e.type==='button'&&text(e.props.children)==='重试保存原候选')!,spy=vi.spyOn(h.controller,'retry')
  invoke(retry,'onClick');await spy.mock.results.at(-1)!.value;await Promise.resolve();spy.mockRestore()
  expect(h.controller.exportSaved()).toBe(candidate);expect(equityJourneyFor(h.p(),h.scene().props.focus as ReturnType<typeof equityFocusFor>).phase).toBe('receivable')
  expect((await h.store.load(p.view.runId))!.run).toEqual(JSON.parse(candidate).state)
})

it('keeps an archived life on its original review until the independent resume confirmation succeeds',async()=>{
 const h=await setup('finished',finishedRaw)
 try{const before=h.controller.exportSaved(),ending=h.draw().find(e=>typeof e.props.onOpenEquity==='function')!,page=render('finished-review',()=>Reflect.apply(EndingStage,undefined,[ending.props]));expect(elements(page).some(e=>e.type==='button'&&text(e.props.children).includes('看看原持股'))).toBe(false);expect(h.scene()).toBeUndefined();expect(h.controller.exportSaved()).toBe(before)}finally{await h.close()}
})
