import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {addDays} from '../core/calendar.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {RelayResponseEditor} from './RelayResponseEditor.tsx'
import {createRelayResponseDraftMemory,emptyRelayResponseDraft,relayResponseContext,relayResponseDraftCommand,relayResponseDraftIssue,relayResponseDraftKey,relayResponseScopeForTarget,type RelayResponseDraft,type RelayResponseScope,type RelayResponseSubject} from './relay-response-draft.ts'
import beforeCollectionRaw from '../../goal-1/evidence/t17-acceptance-36/chrome-service-r2/r7-05-saved86-after-original-wait.json?raw'

// This is an existing normal-history export. It supplies real original IDs and
// rules for handler/command checks; it is not new Native or complete-Create proof.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++,values=hooks.current
  if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0]}
})
function mounted<T>(name:string,render:()=>T):T{
 const previous=hooks.current,index=hooks.index
 hooks.current=hooks.slots.get(name)??[];hooks.slots.set(name,hooks.current);hooks.index=0
 try{return render()}finally{hooks.current=previous;hooks.index=index}
}
type Element=ReactElement<Record<string,unknown>>
const driven=new Set(['RelayRenewFields','RelayRequoteFields','CommandButton'])
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(value))return []
 const own=[value,...elements(value.props.children)]
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
function driver(render:()=>unknown){
 let tree:unknown
 const refresh=()=>{tree=render()};refresh()
 return {refresh,text:()=>elements(tree).map(element=>text(element)).join(' '),all:()=>elements(tree),
  button(label:string){const button=elements(tree).find(element=>element.type==='button'&&text(element.props.children).includes(label));if(!button)throw Error('BUTTON_REQUIRED:'+label);return button},
  click(label:string){const button=elements(tree).find(element=>element.type==='button'&&text(element.props.children).includes(label));if(!button||button.props.disabled||typeof button.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);button.props.onClick();refresh()},
  edit(label:string,value:string){const field=elements(tree).find(element=>element.type==='label'&&text(element.props.children).includes(label)),input=field&&elements(field).find(element=>element.type==='input'||element.type==='select');if(!input||input.props.disabled||typeof input.props.onChange!=='function')throw Error('EDITABLE_FIELD_REQUIRED:'+label);input.props.onChange({target:{value}});refresh()},
  check(label:string,checked:boolean){const field=elements(tree).find(element=>element.type==='label'&&text(element.props.children).includes(label)),input=field&&elements(field).find(element=>element.type==='input'&&element.props.type==='checkbox');if(!input||input.props.disabled||typeof input.props.onChange!=='function')throw Error('CHECKBOX_REQUIRED:'+label);input.props.onChange({target:{checked}});refresh()},
 }
}
let actual:{controller:GameController;store:IndexedDbRunStore}
beforeAll(async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'relay-response-original86'})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'relay-response-original86-'+(++sequence)})
 await controller.initialize();await controller.importNew(beforeCollectionRaw)
 actual={controller,store}
},20000)
afterAll(async()=>{if(actual){await actual.controller.close();await actual.store.close()}})
function props():GamePanelProps{
 const view=actual.controller.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay!.businesses[0]!
 return {controller:actual.controller,view,features,accountId:business.accountId,request:vi.fn(),relayResponseDraftMemory:createRelayResponseDraftMemory(view.runId)}
}
function businessTarget(p:GamePanelProps):RelaySceneTarget{
 const business=p.features.relay!.businesses[0]!,station=p.features.relay!.stations.find(row=>row.businessId===business.id)!
 return {kind:'business',runId:p.view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id}
}
function receivable(p:GamePanelProps){
 const target=businessTarget(p),relay=p.features.relay!,ids=new Set(relay.customers.filter(row=>row.businessId===target.businessId).map(row=>row.id))
 const invoice=relay.receivables.find(row=>ids.has(row.customerId)&&row.dueAt<=p.view.date&&row.amountFen-row.collectedFen-row.reversedFen>=2&&relay.meters.some(meter=>meter.id===row.sourceId))
 if(!invoice)throw Error('REAL_DUE_METER_INVOICE_REQUIRED')
 const subject:RelayResponseSubject={kind:'receivable',id:invoice.id}
 return {target,invoice,subject}
}
const inputFen=(value:number)=>Math.floor(value/100)+'.'+String(value%100).padStart(2,'0')
function paymentFixture(p:GamePanelProps){
 const {target,invoice}=receivable(p),obligation={id:'response-public-obligation',accountId:target.accountId,businessId:target.businessId,contractId:invoice.customerId,counterpartyId:'world',date:addDays(p.view.date,7),sourceEventId:invoice.sourceId,originOperationId:invoice.operationId,kind:'expense' as const,amountFen:5000,remainingFen:3000,protectionReservationId:null}
 const workbench={...p.features.workbench,finance:p.features.workbench.finance.map(row=>row.accountId===target.accountId?{...row,obligations:[...row.obligations,obligation]}:row)}
 return {p:{...p,features:{...p.features,workbench}},target,obligation,subject:{kind:'obligation' as const,id:obligation.id}}
}

it('keeps one copied canonical draft across entry paths but isolates life, owner, ticket and response',()=>{
 const scope:RelayResponseScope={accountId:'account',businessId:'business',stationId:'station',mode:'collect',subjectKind:'receivable',subjectId:'invoice'},memory=createRelayResponseDraftMemory('life'),draft={...emptyRelayResponseDraft(),amount:'12.34',customerIds:['c'],resources:['r']}
 expect(emptyRelayResponseDraft()).toEqual({amount:'',termEnd:'',paymentMode:'',creditLimit:'',customerIds:[],offerKind:'',unitPrice:'',resources:[],startAt:'',effectiveAt:''})
 expect(memory.write('life',scope,draft)).toBe(true);draft.customerIds.push('outside');draft.resources.push('outside')
 const read=memory.read('life',scope)!
 expect(read.customerIds).toEqual(['c']);expect(read.resources).toEqual(['r']);read.resources.length=0
 expect(memory.read('life',scope)?.resources).toEqual(['r'])
 expect(memory.read('other-life',scope)).toBeUndefined();expect(memory.write('other-life',scope,draft)).toBe(false)
 for(const changed of [{accountId:'other-account'},{businessId:'other-business'},{stationId:'other-station'},{mode:'renew' as const},{subjectId:'other-invoice'},{subjectKind:'customer' as const}])expect(memory.read('life',{...scope,...changed})).toBeUndefined()
})

it('resolves the same real invoice from business, customer, period and meter without splitting its draft',()=>{
 const p=props(),{target,invoice,subject}=receivable(p),relay=p.features.relay!,meter=relay.meters.find(row=>row.id===invoice.sourceId)!
 const targets:RelaySceneTarget[]=[target,{...target,kind:'customer',customerId:invoice.customerId},{...target,kind:'period',periodId:meter.periodId},{...target,kind:'period',periodId:meter.periodId,meterId:meter.id}]
 const scopes=targets.map(selected=>relayResponseScopeForTarget(p,selected,subject,'collect'))
 expect(scopes.every(row=>row.reason===null&&row.scope!==null)).toBe(true)
 expect(new Set(scopes.map(row=>relayResponseDraftKey(p.view.runId,row.scope!))).size).toBe(1)
 const memory=p.relayResponseDraftMemory!,draft={...emptyRelayResponseDraft(),amount:'0.01'}
 memory.write(p.view.runId,scopes[0]!.scope!,draft)
 expect(memory.read(p.view.runId,scopes.at(-1)!.scope!)).toEqual(draft)
 expect(relayResponseScopeForTarget({...p,view:{...p.view,revision:p.view.revision+1,date:addDays(p.view.date,1)}},target,subject,'collect').scope).toEqual(scopes[0]!.scope)
})

it('rejects wrong owners, mismatched children, duplicate or missing invoice sources without another-row fallback',()=>{
 const p=props(),{target,invoice,subject}=receivable(p),relay=p.features.relay!,meter=relay.meters.find(row=>row.id===invoice.sourceId)!,other=relay.customers.find(row=>row.businessId===target.businessId&&row.id!==invoice.customerId)!,draft={...emptyRelayResponseDraft(),amount:'0.01'}
 for(const selected of [{...target,runId:'different-life'},{...target,accountId:'different-account'},{...target,stationId:'different-station'},{...target,kind:'customer' as const,customerId:other.id},{...target,kind:'period' as const,periodId:meter.periodId,meterId:'missing-meter'}])expect(relayResponseDraftCommand(p,selected,subject,'collect',draft)).toBeNull()
 const variants=[{...relay,receivables:[...relay.receivables,{...invoice}]},{...relay,receivables:relay.receivables.map(row=>row.id===invoice.id?{...row,sourceId:'missing-source'}:row)},{...relay,receivables:relay.receivables.map(row=>row.id===invoice.id?{...row,customerId:other.id}:row)}]
 for(const variant of variants)expect(relayResponseDraftCommand({...p,features:{...p.features,relay:variant}},target,subject,'collect',draft)).toBeNull()
 expect(relayResponseDraftCommand(p,target,{kind:'customer',id:invoice.customerId},'collect',draft)).toBeNull()
 expect(relayResponseDraftCommand({...p,view:{...p.view,accounts:p.view.accounts.filter(row=>row.accountId!==target.accountId)}},target,subject,'collect',draft)).toBeNull()
})

it('accepts only an explicit positive integer-fen amount within this original net receivable and its due date',()=>{
 const p=props(),{target,invoice,subject}=receivable(p),relay=p.features.relay!,remaining=invoice.amountFen-invoice.collectedFen-invoice.reversedFen,amount=Math.floor(remaining/2)
 expect(relayResponseDraftCommand(p,target,subject,'collect',{...emptyRelayResponseDraft(),amount:inputFen(amount)})).toEqual({kind:'CollectRelayReceivable',payload:{receivableId:invoice.id,amountFen:amount},label:'核对这张原单，本次只收显选金额',confirm:true})
 for(const value of ['', '0','-1','0.001','NaN','Infinity','1e2',inputFen(remaining+1)])expect(relayResponseDraftCommand(p,target,subject,'collect',{...emptyRelayResponseDraft(),amount:value})).toBeNull()
 const future={...relay,receivables:relay.receivables.map(row=>row.id===invoice.id?{...row,dueAt:addDays(p.view.date,1)}:row)}
 expect(relayResponseDraftIssue({...p,features:{...p.features,relay:future}},target,subject,'collect',{...emptyRelayResponseDraft(),amount:'0.01'})).toContain('尚未到期')
 const reversed={...relay,receivables:relay.receivables.map(row=>row.id===invoice.id?{...row,reversedFen:row.amountFen-row.collectedFen}:row)}
 expect(relayResponseDraftCommand({...p,features:{...p.features,relay:reversed}},target,subject,'collect',{...emptyRelayResponseDraft(),amount:'0.01'})).toBeNull()
})

it('keeps refund amounts tied to the selected public customer or supplier pool without mistaking a changed payment mode for erased protection',()=>{
 const p=props(),target=businessTarget(p),relay=p.features.relay!,customer=relay.customers.find(row=>row.businessId===target.businessId)!,supplier=relay.catalog.suppliers[0]!,old=relay.supplyOptions.find(row=>row.businessId===target.businessId&&row.supplierId===supplier.id)!
 // These public snapshot variants probe ownership/amount handling only. They do
 // not claim the changed balances were earned or newly saved by this test.
 const variant={...relay,customers:relay.customers.map(row=>row.id===customer.id?{...row,mode:'postpaid' as const,balance:{...row.balance,prepaidFen:12345}}:row),supplyOptions:relay.supplyOptions.map(row=>row===old?{...row,credit:{id:'response-test-pool',accountId:target.accountId,businessId:target.businessId,counterpartyId:'world',paidFen:4000,remainingFen:4000}}:row)}
 const input={...p,features:{...p.features,relay:variant}}
 expect(relayResponseDraftCommand(input,target,{kind:'customer',id:customer.id},'customer-refund',{...emptyRelayResponseDraft(),amount:'12.34'})).toMatchObject({kind:'RefundRelayBalance',payload:{customerId:customer.id,amountFen:1234},confirm:true})
 expect(relayResponseDraftCommand(input,target,{kind:'customer',id:customer.id},'customer-refund',{...emptyRelayResponseDraft(),amount:'123.46'})).toBeNull()
 expect(relayResponseDraftCommand(input,target,{kind:'supplier',id:supplier.id},'supplier-refund',{...emptyRelayResponseDraft(),amount:'10'})).toMatchObject({kind:'RefundRelaySupplier',payload:{businessId:target.businessId,supplierId:supplier.id,amountFen:1000},confirm:true})
 expect(relayResponseDraftCommand(input,target,{kind:'supplier',id:supplier.id},'supplier-refund',{...emptyRelayResponseDraft(),amount:'40.01'})).toBeNull()
 const wrong={...variant,supplyOptions:variant.supplyOptions.map(row=>row.supplierId===supplier.id?{...row,credit:row.credit?{...row.credit,accountId:'other-account'}:null}:row)}
 expect(relayResponseDraftCommand({...p,features:{...p.features,relay:wrong}},target,{kind:'supplier',id:supplier.id},'supplier-refund',{...emptyRelayResponseDraft(),amount:'1'})).toBeNull()
})

it('requires every new renewal term and every requote selection without silently removing stale people or resources',()=>{
 const p=props(),target=businessTarget(p),relay=p.features.relay!,customer=relay.customers.find(row=>row.businessId===target.businessId&&row.closedAt===null)!,subject:RelayResponseSubject={kind:'customer',id:customer.id},renew={...emptyRelayResponseDraft(),termEnd:addDays(customer.termEnd,1),paymentMode:'postpaid' as const}
 expect(relayResponseDraftCommand(p,target,subject,'renew',emptyRelayResponseDraft())).toBeNull()
 expect(relayResponseDraftCommand(p,target,subject,'renew',renew)).toBeNull()
 expect(relayResponseDraftCommand(p,target,subject,'renew',{...renew,creditLimit:'0'})).toMatchObject({kind:'RenewRelayCustomer',payload:{customerId:customer.id,termEnd:renew.termEnd,mode:'postpaid',creditLimitFen:0},confirm:true})
 expect(relayResponseDraftCommand(p,target,subject,'renew',{...renew,paymentMode:'prepaid',creditLimit:'old field stays'})).toMatchObject({payload:{mode:'prepaid',creditLimitFen:0}})
 const quote:RelayResponseDraft={...emptyRelayResponseDraft(),customerIds:[customer.id],offerKind:'low_margin',unitPrice:'3',resources:['player-production'],startAt:p.view.date,effectiveAt:addDays(p.view.date,8)},business:RelayResponseSubject={kind:'business',id:target.businessId}
 expect(relayResponseDraftCommand(p,target,business,'requote',quote)).toEqual({kind:'StartRelayRequote',payload:{businessId:target.businessId,customerIds:[customer.id],offerKind:'low_margin',unitPriceFen:3,effectiveAt:quote.effectiveAt,resources:['player-production'],startAt:quote.startAt},label:'核对这些原客户的未来报价谈判',confirm:true})
 const missing={...quote,customerIds:[customer.id,'gone-customer']}
 expect(relayResponseDraftIssue(p,target,business,'requote',missing)).toContain('未代你删选');expect(missing.customerIds).toEqual([customer.id,'gone-customer'])
 expect(relayResponseDraftCommand(p,target,business,'requote',{...quote,resources:['gone-resource']})).toBeNull()
 expect(relayResponseDraftCommand(p,target,business,'requote',{...quote,startAt:'2000-01-01'})).toBeNull()
})

it('binds explicit partial payment to the original obligation and account without inventing a future-due prohibition',()=>{
 // The original86 history has no unpaid obligation. This public snapshot fixture
 // probes the editor contract; it is not a newly incurred or paid business debt.
 const fixture=paymentFixture(props()),{p,target,obligation,subject}=fixture,relay=p.features.relay!,meter=relay.meters.find(row=>row.id===obligation.sourceEventId)!,draft={...emptyRelayResponseDraft(),amount:'10'}
 expect(obligation.date>p.view.date).toBe(true)
 expect(relayResponseDraftCommand(p,target,subject,'pay',draft)).toEqual({kind:'PayObligation',payload:{accountId:target.accountId,obligationId:obligation.id,amountFen:1000},label:'核对这张原欠款，本次只付显选金额',confirm:true})
 const period:RelaySceneTarget={...target,kind:'period',periodId:meter.periodId,meterId:meter.id},stationScope=relayResponseScopeForTarget(p,target,subject,'pay').scope!,periodScope=relayResponseScopeForTarget(p,period,subject,'pay').scope!
 expect(relayResponseDraftKey(p.view.runId,periodScope)).toBe(relayResponseDraftKey(p.view.runId,stationScope))
 expect(relayResponseDraftCommand(p,target,subject,'pay',{...draft,amount:'30.01'})).toBeNull()
 expect(relayResponseDraftCommand(p,target,subject,'pay',{...draft,amount:''})).toBeNull()
 const finance=p.features.workbench.finance
 for(const changed of [{...obligation,accountId:'other-account'},{...obligation,businessId:'other-business'},{...obligation,remainingFen:0}]){
  const workbench={...p.features.workbench,finance:finance.map(row=>row.accountId===target.accountId?{...row,obligations:row.obligations.map(old=>old.id===obligation.id?changed:old)}:row)}
  expect(relayResponseDraftCommand({...p,features:{...p.features,workbench}},target,subject,'pay',draft)).toBeNull()
 }
 const duplicate={...p.features.workbench,finance:finance.map(row=>row.accountId===target.accountId?{...row,obligations:[...row.obligations,obligation]}:row)}
 expect(relayResponseDraftCommand({...p,features:{...p.features,workbench:duplicate}},target,subject,'pay',draft)).toBeNull()
 const other=relay.customers.find(row=>row.businessId===target.businessId&&row.id!==obligation.contractId)!
 expect(relayResponseDraftCommand(p,{...target,kind:'customer',customerId:other.id},subject,'pay',draft)).toBeNull()
})

it('uses an undeclared-business obligation only when its controlled company account identifies this station uniquely',()=>{
 const {p,target,obligation,subject}=paymentFixture(props()),business=p.features.relay!.businesses.find(row=>row.id===target.businessId)!
 expect(business.company).toBe(true)
 const workbench={...p.features.workbench,finance:p.features.workbench.finance.map(row=>row.accountId===target.accountId?{...row,obligations:row.obligations.map(old=>old.id===obligation.id?{...old,businessId:null}:old)}:row)},input={...p,features:{...p.features,workbench}},draft={...emptyRelayResponseDraft(),amount:'1'}
 expect(relayResponseDraftCommand(input,target,subject,'pay',draft)).toMatchObject({kind:'PayObligation',payload:{accountId:target.accountId,obligationId:obligation.id,amountFen:100},confirm:true})
 const duplicateOwner={...p.view.operations!,businesses:[...p.view.operations!.businesses,{...p.view.operations!.businesses.find(row=>row.id===target.businessId)!,id:'another-company-for-same-account'}]}
 expect(relayResponseDraftCommand({...input,view:{...p.view,operations:duplicateOwner}},target,subject,'pay',draft)).toBeNull()
})

it('starts the payment input empty and keeps its explicit fill while the original preview refuses a merely forged public debt',()=>{
 const {p,target,obligation,subject}=paymentFixture(props()),request=vi.fn(),before=actual.controller.exportSaved(),ui=driver(()=>mounted('response-public-payment',()=>RelayResponseEditor({p:{...p,request},target,subject,mode:'pay'})))
 expect(ui.all().find(row=>row.type==='input'&&row.props.inputMode==='decimal')?.props.value).toBe('')
 ui.click('填入这张原欠款全部未结额')
 expect(ui.all().find(row=>row.type==='input'&&row.props.inputMode==='decimal')?.props.value).toBe(inputFen(obligation.remainingFen))
 const scope=relayResponseScopeForTarget(p,target,subject,'pay').scope!
 expect(p.relayResponseDraftMemory!.read(p.view.runId,scope)?.amount).toBe('30.00')
 const button=ui.button('核对这张原欠款，本次只付显选金额');expect(button.props.disabled).toBe(true)
 if(typeof button.props.onClick!=='function')throw Error('ORIGINAL_BINDING_REQUIRED')
 button.props.onClick();expect(request).not.toHaveBeenCalled();expect(actual.controller.exportSaved()).toBe(before)
})

it('keeps entered money through near/book remounts and explicit all-filling without performing or confirming a game command',()=>{
 const p=props(),{target,invoice,subject}=receivable(p),before=actual.controller.exportSaved(),request=vi.fn(),input={...p,request}
 const near=driver(()=>mounted('response-near',()=>RelayResponseEditor({p:input,target,subject,mode:'collect'})))
 const field=near.all().find(row=>row.type==='input'&&row.props.inputMode==='decimal')!
 expect(field.props.value).toBe('');expect(request).not.toHaveBeenCalled()
 near.edit('本次收取金额','0.01')
 const customer:RelaySceneTarget={...target,kind:'customer',customerId:invoice.customerId},book=driver(()=>mounted('response-book',()=>RelayResponseEditor({p:input,target:customer,subject,mode:'collect'})))
 expect(book.all().find(row=>row.type==='input'&&row.props.inputMode==='decimal')?.props.value).toBe('0.01')
 book.click('填入本单全部净未收')
 near.refresh();expect(near.all().find(row=>row.type==='input'&&row.props.inputMode==='decimal')?.props.value).toBe(inputFen(invoice.amountFen-invoice.collectedFen-invoice.reversedFen))
 expect(request).not.toHaveBeenCalled();expect(actual.controller.exportSaved()).toBe(before)
})

it('shows retained unavailable requote selections until the player explicitly removes them',()=>{
 const p=props(),target=businessTarget(p),relay=p.features.relay!,customer=relay.customers.find(row=>row.businessId===target.businessId&&row.closedAt===null)!,subject:RelayResponseSubject={kind:'business',id:target.businessId},scope=relayResponseScopeForTarget(p,target,subject,'requote').scope!,draft={...emptyRelayResponseDraft(),customerIds:[customer.id,'gone-customer'],resources:['gone-resource']}
 p.relayResponseDraftMemory!.write(p.view.runId,scope,draft)
 const request=vi.fn(),ui=driver(()=>mounted('response-stale-quote',()=>RelayResponseEditor({p:{...p,request},target,subject,mode:'requote'})))
 expect(ui.text()).toContain('未代你从谈判名单删去');expect(ui.text()).toContain('未自动换给本人')
 expect(p.relayResponseDraftMemory!.read(p.view.runId,scope)?.customerIds).toEqual([customer.id,'gone-customer'])
 ui.click('明确移除这位不可用的原客户');ui.click('明确移除这项不可用的原资源')
 expect(p.relayResponseDraftMemory!.read(p.view.runId,scope)).toMatchObject({customerIds:[customer.id],resources:[]})
 expect(request).not.toHaveBeenCalled()
})

it('routes a real partial collection through the original explicit request, saves that amount once, and rejects its stale old binding',async()=>{
 const p=props(),{target,invoice,subject}=receivable(p),remaining=invoice.amountFen-invoice.collectedFen-invoice.reversedFen,amount=Math.floor(remaining/2),request=vi.fn(),before=actual.controller.exportSaved(),oldBusiness=p.features.relay!.businesses.find(row=>row.id===target.businessId)!,oldCustomer=p.features.relay!.customers.find(row=>row.id===invoice.customerId)!
 const ui=driver(()=>mounted('response-actual-partial',()=>RelayResponseEditor({p:{...p,request},target,subject,mode:'collect'})))
 ui.edit('本次收取金额',inputFen(amount));const button=ui.button('核对这张原单，本次只收显选金额')
 expect(button.props.disabled).toBe(false);ui.click('核对这张原单，本次只收显选金额')
 expect(request).toHaveBeenCalledExactlyOnceWith('CollectRelayReceivable',{receivableId:invoice.id,amountFen:amount},'核对这张原单，本次只收显选金额',true)
 expect(actual.controller.exportSaved()).toBe(before)
 const command=actual.controller.prepare('CollectRelayReceivable',{receivableId:invoice.id,amountFen:amount})
 expect(actual.controller.preview(command).allowed).toBe(true);expect((await actual.controller.submit(command)).status).toBe('saved')
 const current=props(),saved=current.features.relay!,updated=saved.receivables.find(row=>row.id===invoice.id)!,business=saved.businesses.find(row=>row.id===target.businessId)!,customer=saved.customers.find(row=>row.id===invoice.customerId)!
 expect(updated.collectedFen-invoice.collectedFen).toBe(amount);expect(updated.amountFen-updated.collectedFen-updated.reversedFen).toBe(remaining-amount)
 expect(business.funds.cashFen-oldBusiness.funds.cashFen).toBe(amount);expect(customer.balance.recognizedIncomeFen).toBe(oldCustomer.balance.recognizedIncomeFen)
 expect(current.view.date).toBe(p.view.date);expect(current.view.budget).toEqual(p.view.budget)
 if(typeof button.props.onClick!=='function')throw Error('ORIGINAL_BINDING_REQUIRED')
 button.props.onClick();expect(request).toHaveBeenCalledTimes(1)
})

it('keeps valid original response drafts while the original binding blocks candidate, read-only and conflict snapshots',()=>{
 const p=props(),{target,subject}=receivable(p),scope=relayResponseScopeForTarget(p,target,subject,'collect').scope!,draft={...emptyRelayResponseDraft(),amount:'0.01'},before=actual.controller.exportSaved()
 p.relayResponseDraftMemory!.write(p.view.runId,scope,draft)
 for(const patch of [{hasCandidate:true},{readOnly:true,saveStatus:'read_only' as const},{saveStatus:'conflict' as const}]){
  const request=vi.fn(),input={...p,view:{...p.view,...patch},request},ui=driver(()=>mounted('response-locked-'+JSON.stringify(patch),()=>RelayResponseEditor({p:input,target,subject,mode:'collect'}))),button=ui.button('核对这张原单，本次只收显选金额')
  expect(button.props.disabled).toBe(true)
  if(typeof button.props.onClick!=='function')throw Error('ORIGINAL_BINDING_REQUIRED')
  button.props.onClick();expect(request).not.toHaveBeenCalled();expect(p.relayResponseDraftMemory!.read(p.view.runId,scope)).toEqual(draft)
 }
 expect(actual.controller.exportSaved()).toBe(before)
})
