import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {relayJourneyAction} from './relay-journey.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {RelayPreparationEditor,RelayPreparationSchedule} from './RelayPreparationEditor.tsx'
import {createRelayPreparationDraftMemory,emptyRelayPreparationDraft,relayPreparationDraftCommand,relayPreparationDraftIssue,relayPreparationDraftKey,relayPreparationScopeForTarget,type RelayPreparationSlot} from './relay-preparation-draft.ts'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft} from './relay-scene-draft.ts'
import {RelayAuditEditor,RelayDraftDate,RelayServiceChoice,relayDraftScopeForTarget} from './RelayServiceChoice.tsx'
import RelayPanel,{relayPanelTargetLocation} from './RelayPanel.tsx'
import beforeOpenRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0065.json?raw'
import beforeCustomersRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0080.json?raw'
import serviceReadyRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'
import marketingRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0075.json?raw'

// Existing generated normal Create prefixes, not new Chrome or complete-history
// evidence. Hooks below drive actual JSX handlers without asserting browser layout.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++,values=hooks.current
  if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=> 'relay-preparation-handler',useEffect:()=>{}}
})
function mounted<T>(name:string,render:()=>T):T{
 const previous=hooks.current,index=hooks.index
 hooks.current=hooks.slots.get(name)??[];hooks.slots.set(name,hooks.current);hooks.index=0
 try{return render()}finally{hooks.current=previous;hooks.index=index}
}
type Element=ReactElement<Record<string,unknown>>
const driven=new Set(['PreparationFields','SelectField','SupplierField','MarketingFields','CustomerFields','RelayPreparationSchedule','RelayServiceFields','RelayDraftResources','RelayDraftDate','CommandButton'])
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(value))return []
 const own=[value,...elements(value.props.children),...elements(value.props.footer)]
 if(typeof value.type==='function'&&driven.has(value.type.name)){
  const component=value.type as (props:Record<string,unknown>)=>unknown
  own.push(...elements(mounted('child:'+component.name+':'+String(value.key),()=>component(value.props))))
 }
 return own
}
function text(value:unknown):string{
 if(typeof value==='string'||typeof value==='number')return String(value)
 if(Array.isArray(value))return value.map(text).join('')
 return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
}
function invoke(element:Element,name:string):unknown{
 if(typeof element.type!=='function')throw Error('ACTUAL_COMPONENT_REQUIRED')
 const component=element.type as (props:Record<string,unknown>)=>unknown
 return mounted(name,()=>component(element.props))
}
function driver(render:()=>unknown){
 let tree:unknown
 const refresh=()=>{tree=render()};refresh()
 return {refresh,all:()=>elements(tree),text:()=>elements(tree).map(element=>text(element)).join(' '),
  click(label:string){const button=elements(tree).find(element=>element.type==='button'&&text(element.props.children).includes(label));if(!button||button.props.disabled||typeof button.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);button.props.onClick();refresh()},
  edit(label:string,value:string|boolean){const field=elements(tree).find(element=>element.type==='label'&&text(element.props.children).includes(label)),input=field&&elements(field).find(element=>element.type==='input'||element.type==='select');if(!input||input.props.disabled||typeof input.props.onChange!=='function')throw Error('EDITABLE_FIELD_REQUIRED:'+label);input.props.onChange({target:{value:typeof value==='string'?value:'',checked:value===true}});refresh()},
 }
}
async function fixture(raw:string,name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.importNew(raw)
 const runId=controller.snapshot.view!.runId,relayPreparationDraftMemory=createRelayPreparationDraftMemory(runId),relayDraftMemory=createRelaySceneDraftMemory(runId)
 const props=(personal=false):GamePanelProps=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay!.businesses[0];return {controller,view,features,accountId:personal?'personal':business?.accountId??'personal',request:vi.fn(),relayPreparationDraftMemory,relayDraftMemory}}
 const target=():RelaySceneTarget=>{const p=props(),business=p.features.relay!.businesses[0]!,station=p.features.relay!.stations.find(row=>row.businessId===business.id)!;return {kind:'business',runId:p.view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id}}
 return {controller,store,props,target}
}
let opening:Awaited<ReturnType<typeof fixture>>,customers:Awaited<ReturnType<typeof fixture>>,service:Awaited<ReturnType<typeof fixture>>
beforeAll(async()=>{opening=await fixture(beforeOpenRaw,'relay-preparation-open');customers=await fixture(beforeCustomersRaw,'relay-preparation-customers');service=await fixture(serviceReadyRaw,'relay-preparation-service')},20000)
afterAll(async()=>{for(const item of [opening,customers,service])if(item){await item.controller.close();await item.store.close()}})

it('starts each preparation slot empty and isolates copies by life, account, original child and slot',()=>{
 const p=customers.props(),target=customers.target(),memory=createRelayPreparationDraftMemory(p.view.runId),scope=relayPreparationScopeForTarget(p,target,'customers').scope!,draft={...emptyRelayPreparationDraft(),personIds:['chosen-person'],amount:'123.45'}
 expect(emptyRelayPreparationDraft()).toMatchObject({amount:'',resources:[],startAt:'',supplierId:'',audienceId:'',offerId:'',personIds:[],paymentMode:'',termEnd:''})
 expect(memory.write(p.view.runId,scope,draft)).toBe(true);draft.personIds.push('outside-mutation')
 expect(memory.read(p.view.runId,scope)?.personIds).toEqual(['chosen-person'])
 const read=memory.read(p.view.runId,scope)!;read.personIds.length=0
 expect(memory.read(p.view.runId,scope)?.personIds).toEqual(['chosen-person'])
 expect(memory.read('another-life',scope)).toBeUndefined();expect(memory.write('another-life',scope,draft)).toBe(false)
 for(const changed of [{slot:'offer' as const},{accountId:'another-account'},{audienceId:'another-original-audience'},{stationId:'another-station'}])expect(memory.read(p.view.runId,{...scope,...changed})).toBeUndefined()
 expect(relayPreparationDraftKey(p.view.runId,scope)).not.toContain(p.view.date)
 for(const slot of ['open','capital','basics','materials','application','adapter','marketing','offer','customers','customer-funds','supplier-funds'] as const)expect(relayPreparationDraftCommand(slot==='open'?opening.props(true):p,slot==='open'?null:target,slot,emptyRelayPreparationDraft())).toBeNull()
})

it('requires deliberate capital before the original open confirmation and does not close the editor on preview',()=>{
 hooks.slots.clear()
 const p=opening.props(true),before=opening.controller.exportSaved(),close=vi.fn(),request=vi.fn(),ui=driver(()=>mounted('open',()=>RelayPreparationEditor({p:{...p,request},target:null,slot:'open',onClose:close})))
 expect(ui.all().filter(element=>element.type==='input').every(element=>element.props.value==='')).toBe(true)
 expect(request).not.toHaveBeenCalled();ui.edit('个人投入新站的自有资本','10000');ui.click('核对自有资本，准备这间中转站')
 expect(request).toHaveBeenCalledExactlyOnceWith('OpenRelayStation',{capitalFen:1000000},'核对自有资本，准备这间中转站',true)
 expect(close).not.toHaveBeenCalled();expect(opening.controller.exportSaved()).toBe(before)
 const wrongAccount={...p,accountId:'missing-account'}
 expect(relayPreparationScopeForTarget(wrongAccount,null,'open').scope).toBeNull()
})

it('retains invalid dates and original choices instead of supplying today, a worker, a supplier or the latest offer',()=>{
 const p=customers.props(),target=customers.target(),bad={...emptyRelayPreparationDraft(),resources:['missing-worker'],startAt:'2020-01-01',supplierId:'missing-supplier',audienceId:'missing-audience',offerId:'missing-offer',personIds:['missing-person']}
 expect(relayPreparationDraftIssue(p,target,'application',bad)).toContain('原资源')
 const staleDate={...bad,resources:['player-production']}
 expect(relayPreparationDraftIssue(p,target,'application',staleDate)).toContain('过期日期保留')
 expect(relayPreparationDraftCommand(p,target,'application',staleDate)).toBeNull()
 expect(staleDate).toMatchObject({startAt:'2020-01-01',supplierId:'missing-supplier'})
 expect(relayPreparationDraftIssue(p,target,'customers',bad)).toContain('没有换成最新一批')
 const audience=p.features.relay!.audiences.find(row=>row.completedAt!==null)!
 expect(relayPreparationDraftIssue(p,target,'customers',{...bad,audienceId:audience.id})).toContain('没有换成最新报价')
})

function bookPreparation(p:GamePanelProps,target:RelaySceneTarget,slot:RelayPreparationSlot):unknown{
 const page=invoke(RelayPanel({...p,initialTarget:target,initialDraftSlot:slot}),'book-scope'),business=elements(page).find(element=>element.props.businessId===target.businessId&&typeof element.props.onSelectTarget==='function')
 if(!business)throw Error('ACTUAL_BOOK_BUSINESS_REQUIRED')
 const content=invoke(business,'book-business'),direct=elements(content).find(element=>element.type===RelayPreparationEditor&&element.props.slot===slot)
 if(direct)return invoke(direct,'book-preparation:'+slot)
 const intake=elements(content).find(element=>typeof element.type==='function'&&element.type.name==='RelayIntake')
 const editor=intake&&elements(invoke(intake,'book-intake')).find(element=>element.type===RelayPreparationEditor&&element.props.slot===slot)
 if(!editor)throw Error('ACTUAL_SHARED_BOOK_EDITOR_REQUIRED')
 return invoke(editor,'book-preparation:'+slot)
}
it('shares exact preparation selections with the actual original book and refuses a stale mounted command',()=>{
 hooks.slots.clear()
 const p=customers.props(),target=customers.target(),request=vi.fn(),input={...p,request},ui=driver(()=>mounted('offer-near',()=>RelayPreparationEditor({p:input,target,slot:'offer'})))
 ui.edit('仅供后续签约的收费方案','managed_support');ui.edit('用量单价','7')
 const scope=relayPreparationScopeForTarget(p,target,'offer').scope!,book=driver(()=>bookPreparation(input,target,'offer'))
 expect(book.all().find(element=>element.type==='input')?.props.value).toBe('7')
 book.edit('用量单价','8')
 ui.click('核对仅供后续签约的报价')
 expect(request).not.toHaveBeenCalled();expect(ui.text()).toContain('草稿已在另一页调整')
 ui.click('核对仅供后续签约的报价')
 expect(request).toHaveBeenCalledExactlyOnceWith('SetRelayOffer',{businessId:target.businessId,offerKind:'managed_support',unitPriceFen:8},'核对仅供后续签约的报价',true)
 expect(p.relayPreparationDraftMemory!.read(p.view.runId,scope)?.unitPrice).toBe('8')
})

it('signs explicitly selected non-leading people with their chosen original quote and retains the last page when confirmation is cancelled',async()=>{
 hooks.slots.clear()
 const p=customers.props(),target=customers.target(),before=customers.controller.exportSaved(),relay=p.features.relay!,audience=relay.audiences.find(row=>row.completedAt!==null&&row.members.length>=3)!,offer=relay.offers[0]!,people=[audience.members[2]!,audience.members[0]!],request=vi.fn(),close=vi.fn(),input={...p,request},ui=driver(()=>mounted('customers-near',()=>RelayPreparationEditor({p:input,target,slot:'customers',onClose:close})))
 ui.edit('本次使用的实际潜客名单',audience.id);ui.edit('本次明确使用的已保存报价',offer.id);ui.click('继续看下一步')
 ui.edit('潜客3',true);ui.edit('潜客1',true);ui.click('继续看下一步')
 ui.edit('本次明确收款条件','prepaid');ui.edit('本批合同有效至','2025-03-01');ui.click('核对这几位客户、收款条件与期限')
 const payload={businessId:target.businessId,audienceId:audience.id,offerId:offer.id,personIds:people,termEnd:'2025-03-01',mode:'prepaid',creditLimitFen:0}
 expect(request).toHaveBeenCalledExactlyOnceWith('SignRelayCustomers',payload,'核对这几位客户、收款条件与期限',true)
 expect(close).not.toHaveBeenCalled();expect(ui.text()).toContain('第3/3步');expect(customers.controller.exportSaved()).toBe(before)
 expect(customers.controller.preview(customers.controller.prepare('SignRelayCustomers',payload)).allowed).toBe(true)
 expect((await customers.controller.submit(customers.controller.prepare('SignRelayCustomers',payload))).status).toBe('saved')
 const saved=customers.props(),actual=saved.features.relay!.customers.filter(row=>row.originAudienceId===audience.id)
 expect(actual.map(row=>row.personId)).toEqual(people);expect(actual.every(row=>row.balance.prepaidFen===0&&row.balance.recognizedIncomeFen===0)).toBe(true)
 expect(saved.features.relay!.periods).toHaveLength(0);expect(saved.view.date).toBe(p.view.date)
 expect(relayJourneyAction(saved,{...target,kind:'audience',audienceId:audience.id}).intent).toBe('next')
},20000)

it('retains preparation drafts without requesting on readonly, candidate and stale snapshots',()=>{
 hooks.slots.clear()
 const p=service.props(),target=service.target(),request=vi.fn(),scope=relayPreparationScopeForTarget(p,target,'capital').scope!,draft={...emptyRelayPreparationDraft(),amount:'1000'}
 p.relayPreparationDraftMemory!.write(p.view.runId,scope,draft)
 // Explicit display-policy variants, not new saved or native states.
 for(const [name,view] of [['readonly',{...p.view,readOnly:true}],['candidate',{...p.view,hasCandidate:true}],['stale',{...p.view}]] as const){
  const ui=driver(()=>mounted('guard-'+name,()=>RelayPreparationEditor({p:{...p,view,request},target,slot:'capital'})))
  const button=ui.all().find(element=>element.type==='button'&&text(element).includes('核对个人追加给本站'))
  expect(button?.props.disabled).toBe(true)
  expect(request).not.toHaveBeenCalled();expect(p.relayPreparationDraftMemory!.read(p.view.runId,scope)).toEqual(draft)
 }
})

it('keeps service step four and audit fields open through their original confirmations',async()=>{
 hooks.slots.clear()
 const p=service.props(),target=service.target(),relay=p.features.relay!,customer=relay.customers.find(row=>row.mode==='postpaid')!,scope=relayDraftScopeForTarget(p,target,'service').scope!,draft={...emptyRelaySceneDraft(),customerIds:[customer.id],supplierIds:['cedar-direct'],resources:['player-production'],startAt:'2025-01-28',maxUnits:'2800',maxSupplierCost:'100',supportMode:'guided' as const},request=vi.fn(),close=vi.fn()
 p.relayDraftMemory!.write(p.view.runId,scope,draft)
 const ui=driver(()=>mounted('service-confirm',()=>RelayServiceChoice({p:{...p,request},target,onClose:close})))
 ui.click('继续核对下一步');ui.click('继续核对下一步');ui.click('继续核对下一步');ui.click('核对这期服务与已经约定的支持')
 expect(close).not.toHaveBeenCalled();expect(ui.text()).toContain('第4/4步');expect(request).toHaveBeenCalledTimes(1)
 const [kind,payload]=request.mock.calls[0]!
 expect((await service.controller.submit(service.controller.prepare(kind,payload))).status).toBe('saved')
 for(let n=0;n<4&&service.controller.snapshot.view!.date<'2025-01-29';n++)expect((await service.controller.submit(service.controller.prepare('AdvanceTime',{date:'2025-01-29'}))).status).toBe('saved')
 const current=service.props(),period=current.features.relay!.periods[0]!,periodTarget:RelaySceneTarget={...target,kind:'period',periodId:period.id},auditScope=relayDraftScopeForTarget(current,periodTarget,'audit').scope!
 expect(current.features.relay!.meters.some(row=>row.periodId===period.id)).toBe(true)
 current.relayDraftMemory!.write(current.view.runId,auditScope,{...emptyRelaySceneDraft(),resources:['player-production'],startAt:current.view.date})
 const auditRequest=vi.fn(),auditClose=vi.fn(),audit=driver(()=>mounted('audit-confirm',()=>RelayAuditEditor({p:{...current,request:auditRequest},target:periodTarget,onClose:auditClose})))
 // This period and its promised support still occupy the original resource/AP.
 // Explicitly choose a later free quarter; do not turn the disabled preview free.
 audit.edit('实际开工日期','2025-04-01')
 audit.click('核对这份已有计量的复核委托')
 expect(auditRequest).toHaveBeenCalledTimes(1);expect(auditClose).not.toHaveBeenCalled();expect(audit.all().find(element=>element.type==='input'&&element.props.type==='date')?.props.value).toBe('2025-04-01')
},20000)

it('keeps each original marketing record anchored with its actual wait and interrupt handlers beside the shared editors',async()=>{
 hooks.slots.clear()
 const original=await fixture(marketingRaw,'relay-marketing-original-record')
 try{
  const p=original.props(),base=original.target(),audience=p.features.relay!.audiences.find(row=>row.businessId===base.businessId&&row.job&&['planned','running'].includes(row.job.status))!,target:RelaySceneTarget={...base,kind:'audience',audienceId:audience.id},before=original.controller.exportSaved(),request=vi.fn(),input={...p,request}
  expect(audience).toBeDefined();expect(audience.completedAt).toBeNull()
  expect(relayPanelTargetLocation(p,target)).toEqual({reason:null,anchor:audience.id})
  const page=invoke(RelayPanel({...input,initialTarget:target}),'marketing-book-scope'),business=elements(page).find(element=>element.props.businessId===target.businessId&&typeof element.props.onSelectTarget==='function')!
  const content=invoke(business,'marketing-book-business'),intake=elements(content).find(element=>typeof element.type==='function'&&element.type.name==='RelayIntake')!,intakeContent=invoke(intake,'marketing-book-intake'),record=elements(intakeContent).find(element=>element.type==='article'&&element.props.id===audience.id)!
  expect(record).toBeDefined();expect(text(record)).toContain('付费获客');expect(text(record)).toContain(audience.createdAt);expect(text(record)).toContain('尚未实际完成')
  expect(elements(intakeContent).filter(element=>element.type===RelayPreparationEditor).map(element=>element.props.slot)).toEqual(['marketing','offer','customers'])
  const job=elements(record).find(element=>typeof element.type==='function'&&element.type.name==='RelayJob'&&element.props.job===audience.job)!,ui=driver(()=>invoke(job,'marketing-original-job'))
  expect(ui.text()).toContain(audience.job!.startAt);expect(ui.text()).toContain(audience.job!.completeAt)
  ui.click('推进到本项中转任务完成')
  expect(request).toHaveBeenLastCalledWith('AdvanceTime',{date:audience.job!.completeAt},'推进到本项中转任务实际完成')
  ui.click('停止此任务，保留已有费用和义务')
  expect(request).toHaveBeenLastCalledWith('InterruptJob',{jobId:audience.job!.id},'停止此任务，保留已有费用和义务',true)
  expect(original.controller.exportSaved()).toBe(before)
  const command=original.controller.prepare('InterruptJob',{jobId:audience.job!.id})
  expect(original.controller.preview(command).allowed).toBe(true)
  expect((await original.controller.submit(command)).status).toBe('saved')
  const saved=original.props(),actual=saved.features.relay!.audiences.find(row=>row.id===audience.id)!
  expect(['cancelled','interrupted']).toContain(actual.job!.status);expect(actual.completedAt).toBeNull();expect(actual.members).toHaveLength(0)
  expect(saved.view.date).toBe(p.view.date);expect(saved.features.relay!.businesses[0]!.metrics.incomeFen).toBe(p.features.relay!.businesses[0]!.metrics.incomeFen)
 }finally{await original.controller.close();await original.store.close()}
},20000)

it('sets the next quarter only through an explicit date choice without submitting or supplying resources',()=>{
 const p=opening.props(true),before=opening.controller.exportSaved(),request=vi.fn(),input={...p,request}
 expect(p.view.date).toBe('2024-07-02')
 let preparation=emptyRelayPreparationDraft()
 const prep=driver(()=>RelayPreparationSchedule({p:input,draft:preparation,setDraft:value=>{preparation=typeof value==='function'?value(preparation):value}}))
 expect(prep.all().find(element=>element.type==='input'&&element.props.type==='date')?.props.value).toBe('')
 prep.click('明确留到下一季 · 2024-10-01')
 expect(preparation).toEqual({...emptyRelayPreparationDraft(),startAt:'2024-10-01'})
 prep.edit('实际开工日期','2024-10-08');expect(preparation.startAt).toBe('2024-10-08')
 prep.click('明确选择今天');expect(preparation.startAt).toBe(p.view.date)
 for(const service of [false,true]){
  let draft=emptyRelaySceneDraft()
  const date=driver(()=>RelayDraftDate({p:input,draft,service,setDraft:value=>{draft=typeof value==='function'?value(draft):value}}))
  date.click('明确留到下一季 · 2024-10-01')
  expect(draft).toEqual({...emptyRelaySceneDraft(),startAt:'2024-10-01'})
  date.click(service?'明确留到明天':'明确选择今天')
  expect(draft.startAt).toBe(service?'2024-07-03':'2024-07-02')
 }
 expect(request).not.toHaveBeenCalled();expect(opening.controller.exportSaved()).toBe(before)
})
