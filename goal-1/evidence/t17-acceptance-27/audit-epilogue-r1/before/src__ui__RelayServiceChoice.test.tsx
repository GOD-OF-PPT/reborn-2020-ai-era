import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {RelayAuditEditor,RelayDraftDate,RelayDraftResources,RelayServiceChoice,RelayServiceFields,relayAuditDraftCommand,relayDraftScopeForTarget,relayServiceDraftCommand} from './RelayServiceChoice.tsx'
import {RelaySceneChoice,RelayTargetPicker} from './RelaySceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft} from './relay-scene-draft.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import RelayPanel,{relayPanelTargetLocation} from './RelayPanel.tsx'
import readyRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'
import plannedRaw from '../../goal-1/evidence/t17-acceptance-11/chrome-relay-fault-r12/r92-normal-for-service-abort-text-before-import.json?raw'

// Real handlers and original controller/codec. Hook storage models mounted instances,
// not browser layout, effects, human understanding or full normal-history replay.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++,values=hooks.current
  if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=> 'relay-handler',useEffect:()=>{}}
})
function mounted<T>(name:string,render:()=>T):T{
 const previous=hooks.current,index=hooks.index
 hooks.current=hooks.slots.get(name)??[];hooks.slots.set(name,hooks.current);hooks.index=0
 try{return render()}finally{hooks.current=previous;hooks.index=index}
}
type Element=ReactElement<Record<string,unknown>>
const childrenToDrive=new Set<unknown>([RelayServiceFields,RelayDraftResources,RelayDraftDate,RelayServiceChoice,RelayAuditEditor,RelayTargetPicker,CommandButton])
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(value))return []
 const own=[value,...elements(value.props.children),...elements(value.props.footer)]
 if(childrenToDrive.has(value.type)&&typeof value.type==='function'){
  const component=value.type as (props:Record<string,unknown>)=>unknown
  own.push(...elements(mounted('child:'+component.name,()=>component(value.props))))
 }
 return own
}
function text(value:unknown):string{
 if(typeof value==='string'||typeof value==='number')return String(value)
 if(Array.isArray(value))return value.map(text).join('')
 return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
}
function handle(element:Element,event:'onClick'|'onChange',value?:string|boolean){
 const action=element.props[event];if(typeof action!=='function')throw Error('VISIBLE_HANDLER_REQUIRED')
 if(event==='onClick'){if(element.props.disabled)throw Error('ENABLED_VISIBLE_BUTTON_REQUIRED');action()}
 else action({target:{value:typeof value==='string'?value:'',checked:value===true}})
}
function driver(render:()=>unknown){
 let tree:unknown
 const refresh=()=>{tree=render()};refresh()
 return {
  refresh,all:()=>elements(tree),
  click(label:string){const button=elements(tree).find(e=>e.type==='button'&&text(e.props.children).includes(label));if(!button)throw Error('VISIBLE_BUTTON_REQUIRED:'+label);handle(button,'onClick');refresh()},
  edit(label:string,value:string|boolean){const field=elements(tree).find(e=>e.type==='label'&&text(e.props.children).includes(label)),input=field&&elements(field).find(e=>e.type==='input'||e.type==='select');if(!input)throw Error('VISIBLE_FIELD_REQUIRED:'+label);handle(input,'onChange',value);refresh()},
  text:()=>text(tree),
 }
}
/** Follow the actual book's public JSX to its original business/period and shared editor. */
function originalBookEditor(p:GamePanelProps,target:RelaySceneTarget,slot:'service'|'audit'='service'){
 const invoke=(element:Element,name:string)=>{
  if(typeof element.type!=='function')throw Error('ACTUAL_BOOK_COMPONENT_REQUIRED')
  const component=element.type as (props:Record<string,unknown>)=>unknown
  return mounted(name,()=>component(element.props))
 }
 const page=invoke(RelayPanel({...p,initialTarget:target,initialDraftSlot:slot}),'original-book-scope'),business=elements(page).find(e=>e.props.businessId===target.businessId&&typeof e.props.onSelectTarget==='function')
 if(!business)throw Error('ORIGINAL_BOOK_BUSINESS_REQUIRED')
 let content=invoke(business,'original-book-business')
 if(slot==='audit'){
  const period=elements(content).find(e=>target.kind==='period'&&e.props.periodId===target.periodId&&typeof e.props.onSelectTarget==='function')
  if(!period)throw Error('ORIGINAL_BOOK_PERIOD_REQUIRED')
  content=invoke(period,'original-book-period')
 }
 const editor=elements(content).find(e=>e.type===(slot==='service'?RelayServiceChoice:RelayAuditEditor))
 if(!editor)throw Error('ORIGINAL_SHARED_BOOK_EDITOR_REQUIRED')
 return invoke(editor,'original-book-editor:'+slot)
}
async function fixture(raw:string,name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`${name}-${++sequence}`})
 await controller.initialize();await controller.importNew(raw)
 const props=()=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay!.businesses[0]!;return {controller,view,features,accountId:business.accountId,request:vi.fn(),relayDraftMemory:createRelaySceneDraftMemory(view.runId)} satisfies GamePanelProps}
 const p=props(),relay=p.features.relay!,business=relay.businesses[0]!,station=relay.stations.find(s=>s.businessId===business.id)!
 const target:RelaySceneTarget={kind:'business',runId:p.view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id}
 return {controller,store,p,target,props}
}
let ready:Awaited<ReturnType<typeof fixture>>,planned:Awaited<ReturnType<typeof fixture>>
beforeAll(async()=>{
 ready=await fixture(readyRaw,'relay-scene-ready');planned=await fixture(plannedRaw,'relay-scene-planned')
 // Only an affected original-clock suffix, not a fabricated public meter.
 for(let count=0;planned.controller.snapshot.view!.date<'2025-01-29'&&count<4;count++)expect((await planned.controller.submit(planned.controller.prepare('AdvanceTime',{date:'2025-01-29'}))).status).toBe('saved')
 expect(planned.controller.snapshot.view!.date).toBe('2025-01-29');planned.p=planned.props()
},20000)
afterAll(async()=>{for(const f of [ready,planned])if(f){await f.controller.close();await f.store.close()}})

it('keeps deliberately selected service fields through near/book instances and submits only that original payload',async()=>{
 hooks.slots.clear()
 const {p,target,controller}=ready,before=controller.exportSaved(),relay=p.features.relay!,customer=relay.customers.find(c=>c.mode==='postpaid')!,customerNumber=relay.customers.findIndex(c=>c.id===customer.id)+1,inspect=vi.fn(),close=vi.fn(),request=vi.fn(),input={...p,request}
 const ui=driver(()=>mounted('service',()=>RelayServiceChoice({p:input,target,onInspect:inspect,onClose:close})))
 expect(p.relayDraftMemory!.read(p.view.runId,relayDraftScopeForTarget(p,target,'service').scope!)).toBeUndefined()
 ui.edit('客户'+customerNumber,true);ui.click('继续核对下一步')
 ui.edit(relay.catalog.suppliers.find(s=>s.id==='cedar-direct')!.label,true);ui.click('继续核对下一步')
 ui.edit(relay.resources.find(r=>r.id==='player-production')!.label,true);ui.edit('实际开工日期','2025-01-28');ui.click('继续核对下一步')
 ui.edit('本期用量容量上限','2800');ui.edit('本期供应成本授权上限','100');ui.edit('明确选择已约定的支持','guided')
 const scope=relayDraftScopeForTarget(p,target,'service').scope!,draft=p.relayDraftMemory!.read(p.view.runId,scope)!
 expect(draft).toMatchObject({customerIds:[customer.id],supplierIds:['cedar-direct'],resources:['player-production'],startAt:'2025-01-28',maxUnits:'2800',maxSupplierCost:'100',supportMode:'guided'})
 expect(request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
 ui.click('翻看同企业原册');expect(inspect).toHaveBeenCalledWith(target,'service')
 const book=driver(()=>originalBookEditor(input,target))
 book.click('继续核对下一步');book.click('继续核对下一步');book.click('继续核对下一步')
 expect(p.relayDraftMemory!.read(p.view.runId,scope)).toEqual(draft)
 const expected=relayServiceDraftCommand(p,target,draft)!
 expect(controller.preview(controller.prepare(expected.kind,expected.payload)).allowed).toBe(true)
 book.click('核对这期服务与已经约定的支持')
 expect(request).toHaveBeenCalledExactlyOnceWith(expected.kind,expected.payload,expected.label,true)
 expect(controller.exportSaved()).toBe(before)
 expect((await controller.submit(controller.prepare(expected.kind,expected.payload))).status).toBe('saved')
 const saved=controller.snapshot.view!,actual=(saved.features as unknown as PlayFeatures).relay!.periods.at(-1)!
 expect(saved.revision).toBe(p.view.revision+1);expect(actual.customerIds).toEqual([customer.id]);expect(actual.from).toBe(draft.startAt);expect(actual.supportMode).toBe('guided')
 expect(p.relayDraftMemory!.read(p.view.runId,scope)).toEqual(draft)
},20000)

it('previews another original period without changing the confirmed service or its unfinished draft',()=>{
 hooks.slots.clear()
 const {p,target,controller}=planned,before=controller.exportSaved(),period=p.features.relay!.periods[0]!,chosen=vi.fn(),inspect=vi.fn(),draft={...emptyRelaySceneDraft(),startAt:'2025-02-03',maxUnits:'4567'}
 const scope=relayDraftScopeForTarget(p,target,'service').scope!
 p.relayDraftMemory!.write(p.view.runId,scope,draft)
 const ui=driver(()=>mounted('wrapper',()=>RelaySceneChoice({p,target,onTargetChange:chosen,onInspect:inspect,children:open=><button type="button" onClick={()=>open('service')}>打开这份安排</button>})))
 ui.click('打开这份安排');ui.click('明确翻选另一份原服务')
 const label=ui.all().find(e=>e.type==='label'&&text(e).includes(period.from+'—'+period.to)),radio=label&&elements(label).find(e=>e.type==='input'&&e.props.type==='radio')
 if(!radio)throw Error('ACTUAL_PERIOD_RADIO_REQUIRED')
 handle(radio,'onChange');ui.refresh();expect(chosen).not.toHaveBeenCalled()
 ui.click('先合上，不换对象');ui.click('打开这份安排')
 ui.click('翻看同企业原册');expect(inspect).toHaveBeenCalledWith(target,'service')
 expect(p.relayDraftMemory!.read(p.view.runId,scope)).toEqual(draft);expect(controller.exportSaved()).toBe(before)
})

it('keeps actual meter scope and dates, and denies stale, readonly or candidate handler submissions',()=>{
 hooks.slots.clear()
 const {p,target,controller}=planned,relay=p.features.relay!,period=relay.periods[0]!,meter=relay.meters[0]!,before=controller.exportSaved()
 const exact:RelaySceneTarget={...target,kind:'period',periodId:period.id,meterId:meter.id},scope=relayDraftScopeForTarget(p,exact,'audit').scope!,draft={...emptyRelaySceneDraft(),resources:['player-production'],startAt:'2025-02-03'},inspect=vi.fn(),request=vi.fn()
 expect(relayPanelTargetLocation(p,exact)).toEqual({reason:null,anchor:'relay-meter:'+meter.id})
 expect(relayPanelTargetLocation(p,{...exact,meterId:'missing-original-meter'}).anchor).toBeNull()
 p.relayDraftMemory!.write(p.view.runId,scope,draft)
 const expected=relayAuditDraftCommand(p,exact,draft)!
 expect(expected.payload).toEqual({meterId:meter.id,resources:['player-production'],startAt:'2025-02-03'})
 const ui=driver(()=>mounted('audit',()=>RelayAuditEditor({p:{...p,request},target:exact,onInspect:inspect})))
 ui.click('翻看同一期原计量');expect(inspect).toHaveBeenCalledWith(exact,'audit');expect(p.relayDraftMemory!.read(p.view.runId,scope)).toEqual(draft)
 for(const blocked of [{readOnly:true},{hasCandidate:true,saveStatus:'unsaved' as const},{revision:p.view.revision+1}]){
  const view={...p.view,...blocked},tree=originalBookEditor({...p,view,request},exact,'audit'),button=elements(tree).find(e=>e.type===CommandButton)
  if(!button)throw Error('ORIGINAL_AUDIT_COMMAND_REQUIRED')
  const defensive=button.props.request as GamePanelProps['request'];defensive(expected.kind,expected.payload,expected.label,true)
 }
 expect(request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
 p.relayDraftMemory!.write(p.view.runId,scope,{...draft,startAt:'2025-01-01'})
 const expired=mounted('past-audit',()=>RelayAuditEditor({p,target:exact}))
 expect(elements(expired).map(e=>text(e)).join('')).toContain('没有自动改值');expect(relayAuditDraftCommand(p,exact,p.relayDraftMemory!.read(p.view.runId,scope)!)).toBeNull()
 expect(p.relayDraftMemory!.read(p.view.runId,scope)?.startAt).toBe('2025-01-01')
})

it('accepts an explicit zero supplier budget through the real handler while empty or malformed input never becomes zero',async()=>{
 const actual=await fixture(readyRaw,'relay-explicit-zero-budget')
 try{
  hooks.slots.clear()
  const {p,target,controller}=actual,request=vi.fn(),customer=p.features.relay!.customers.find(c=>c.mode==='postpaid')!,scope=relayDraftScopeForTarget(p,target,'service').scope!,before=controller.exportSaved(),beforeFunds=p.features.relay!.businesses[0]!.funds
  // This is an explicitly entered UI draft, not a mutation of the imported run.
  const draft={...emptyRelaySceneDraft(),customerIds:[customer.id],supplierIds:['cedar-direct'],resources:['player-production'],startAt:'2025-01-28',maxUnits:'2800',supportMode:'guided' as const}
  p.relayDraftMemory!.write(p.view.runId,scope,draft)
  const ui=driver(()=>mounted('zero-budget',()=>RelayServiceChoice({p:{...p,request},target})))
  ui.click('继续核对下一步');ui.click('继续核对下一步');ui.click('继续核对下一步')
  for(const invalid of ['', ' ', '-0', '-1', '0.000', '1e2', 'NaN', 'Infinity']){
   ui.edit('本期供应成本授权上限',invalid)
   expect(relayServiceDraftCommand(p,target,p.relayDraftMemory!.read(p.view.runId,scope)!)).toBeNull()
   expect(ui.all().some(e=>e.type===CommandButton&&e.props.kind==='StartRelayServicePeriod')).toBe(false)
  }
  expect(request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
  for(const explicit of ['0','0.00']){
   ui.edit('本期供应成本授权上限',explicit)
   const control=ui.all().find(e=>e.type===CommandButton&&e.props.kind==='StartRelayServicePeriod')
   expect(control,'an explicitly entered zero must expose the original preview action').toBeDefined()
   const expected=relayServiceDraftCommand(p,target,p.relayDraftMemory!.read(p.view.runId,scope)!)!
   expect(expected.payload).toMatchObject({maxSupplierCostFen:0})
   expect(controller.preview(controller.prepare(expected.kind,expected.payload))).toMatchObject({allowed:true,actionPoints:2,upfrontCostFen:450000})
   ui.click('核对这期服务与已经约定的支持')
   expect(request).toHaveBeenLastCalledWith(expected.kind,expected.payload,expected.label,true)
  }
  expect(request).toHaveBeenCalledTimes(2);expect(controller.exportSaved()).toBe(before)
  const command=relayServiceDraftCommand(p,target,p.relayDraftMemory!.read(p.view.runId,scope)!)!
  expect((await controller.submit(controller.prepare(command.kind,command.payload))).status).toBe('saved')
  const saved=controller.snapshot.view!,savedRelay=(saved.features as unknown as PlayFeatures).relay!,period=savedRelay.periods[0]!,savedFunds=savedRelay.businesses[0]!.funds
  expect(period.maxSupplierCostFen).toBe(0);expect(period.job?.definitionId).toBe('relay-service');expect(period.supportJob?.definitionId).toBe('relay-support-guided')
  expect(savedFunds.cashFen).toBe(beforeFunds.cashFen);expect(savedFunds.heldFen-beforeFunds.heldFen).toBe(450000);expect(savedFunds.availableFen).toBe(beforeFunds.availableFen-450000)
  // Future service and support reserve their original fees; actual service starts on its original date.
  for(let count=0;(controller.snapshot.view!.features as unknown as PlayFeatures).relay!.periods[0]!.job?.status==='planned'&&count<4;count++)expect((await controller.submit(controller.prepare('AdvanceTime',{date:'2025-01-28'}))).status).toBe('saved')
  const started=(controller.snapshot.view!.features as unknown as PlayFeatures).relay!,startedFunds=started.businesses[0]!.funds
  expect(started.periods[0]!.job?.status).toBe('running');expect(startedFunds.cashFen).toBe(beforeFunds.cashFen-300000);expect(startedFunds.heldFen-beforeFunds.heldFen).toBe(150000)
 }finally{await actual.controller.close();await actual.store.close()}
},20000)
