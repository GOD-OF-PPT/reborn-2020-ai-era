import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {relayRecordRows} from './relay-records.ts'
import {RelayRecordBook,relayRecordNeedsReply} from './RelayRecordBook.tsx'
import {relayRecordReading,relayRecordProtectionText,relayRecordQuoteEffectiveDate} from './relay-record-meaning.ts'
import {createRelayRecordMemory} from './relay-record-memory.ts'
import {createRelayResponseDraftMemory} from './relay-response-draft.ts'
import {moneyText} from './game-text.ts'
import source86 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r1/n07-original86-after-ui-restore.json?raw'
import source114 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a22-saved114-requote-accepted-before-effective.json?raw'
import source115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-22-new115-quote-actually-effective-no-cash-ap-change.json?raw'

// Actual captures are used through their original public producer. These are
// different historical branches, not one concatenated Native experience.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0,ids:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=>state(()=> 'reading-meaning-'+(++hooks.ids))[0],useEffect:()=>{},useMemo:<T,>(factory:()=>T)=>factory()}
})
function mounted<T>(key:string,render:()=>T):T{const previous=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return render()}finally{hooks.current=previous;hooks.index=index}}
type Element=ReactElement<Record<string,unknown>>
const driven=new Set(['RelayRecordBook','RelayResponseEditor','CommandButton','ClockAdvance'])
function elements(value:unknown,path:string):Element[]{
 if(Array.isArray(value))return value.flatMap((child,index)=>elements(child,path+'/'+index))
 if(!isValidElement<Record<string,unknown>>(value))return []
 const own=[value,...elements(value.props.children,path+'/children')]
 if(typeof value.type==='function'&&driven.has(value.type.name)){const component=value.type as (props:Record<string,unknown>)=>unknown;own.push(...elements(mounted(path+':'+component.name,()=>component(value.props)),path+'/render'))}
 return own
}
function text(value:unknown):string{if(typeof value==='string'||typeof value==='number')return String(value);if(Array.isArray(value))return value.map(text).join('');return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
function reader(name:string,p:GamePanelProps,target:RelaySceneTarget,key:string){
 let tree:unknown
 const refresh=()=>{tree=mounted(name,()=>RelayRecordBook({p,target,initialRecordKey:key,children:view=><>{view.body}{view.actions}</>}))},all=()=>elements(tree,name)
 refresh()
 const labels=()=>all().filter(e=>e.type==='label'&&elements(e,name+'/radio').some(e=>e.type==='input'&&e.props.type==='radio'))
 return {all,refresh,text:()=>all().map(e=>text(e.props.children)).join(' '),keys:()=>labels().map(e=>e.key),
  button(label:string){const e=all().find(e=>e.type==='button'&&text(e.props.children).includes(label));if(!e)throw Error('MEANING_BUTTON_REQUIRED:'+label);return e},
  click(label:string){const e=all().find(e=>e.type==='button'&&text(e.props.children).includes(label));if(!e||e.props.disabled||typeof e.props.onClick!=='function')throw Error('MEANING_ENABLED_BUTTON_REQUIRED:'+label);e.props.onClick();refresh()},
  filter(value:string){const e=all().find(e=>e.type==='select');if(!e||e.props.disabled||typeof e.props.onChange!=='function')throw Error('MEANING_FILTER_REQUIRED');e.props.onChange({target:{value}});refresh()},
  pick(key:string){const parent=labels().find(e=>e.key===key),input=parent&&elements(parent,name+'/picked').find(e=>e.type==='input'&&e.props.type==='radio');if(!input||typeof input.props.onChange!=='function')throw Error('EXACT_MEANING_RECORD_KEY_REQUIRED:'+key);input.props.onChange();refresh()},
  edit(label:string,value:string){const parent=all().find(e=>e.type==='label'&&text(e.props.children).includes(label)),input=parent&&elements(parent,name+'/field').find(e=>e.type==='input');if(!input||input.props.disabled||typeof input.props.onChange!=='function')throw Error('MEANING_RESPONSE_FIELD_REQUIRED');input.props.onChange({target:{value}});refresh()},
  value(label:string){const parent=all().find(e=>e.type==='label'&&text(e.props.children).includes(label)),input=parent&&elements(parent,name+'/value').find(e=>e.type==='input');return input?.props.value},
 }
}
type BusinessTarget=Extract<RelaySceneTarget,{kind:'business'}>
type Relay=NonNullable<PlayFeatures['relay']>
type Frame={controller:GameController;view:PlayingView;features:PlayFeatures;raw:string;target:BusinessTarget}
const frames:Frame[]=[]
let original:Frame,futureQuote:Frame,current:Frame
async function load(raw:string,revision:number):Promise<Frame>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'record-reading-'+revision})
 let sequence=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'record-reading-'+revision+'-'+(++sequence)})
 await controller.initialize();await controller.importNew(raw)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
 expect(view.revision).toBe(revision);expect(controller.exportSaved()).toBe(raw);expect(features.relay!.casebook!.status).toBe('ready');expect(features.relay!.businesses).toHaveLength(1)
 const business=features.relay!.businesses[0]!,stations=features.relay!.stations.filter(s=>s.businessId===business.id)
 expect(stations).toHaveLength(1)
 const target:BusinessTarget={kind:'business',runId:view.runId,accountId:business.accountId,businessId:business.id,stationId:stations[0]!.id},frame={controller,view,features,raw,target}
 frames.push(frame);return frame
}
beforeAll(async()=>{original=await load(source86,86);futureQuote=await load(source114,114);current=await load(source115,115);expect(current.view.date).toBe('2025-04-09');expect(futureQuote.view.date).toBe('2025-04-08')},20000)
afterAll(async()=>{for(const frame of frames)await frame.controller.close()})
function props(frame=current):GamePanelProps{return {controller:frame.controller,view:frame.view,features:frame.features,accountId:frame.target.accountId,request:vi.fn<GamePanelProps['request']>(),textOnly:true,relayRecordMemory:createRelayRecordMemory(frame.view.runId),relayResponseDraftMemory:createRelayResponseDraftMemory(frame.view.runId)}}
function rows(p:GamePanelProps,target:RelaySceneTarget){const result=relayRecordRows(p,target);if(result.reason)throw Error(result.reason);return result.rows}
function assets(p:GamePanelProps,target=current.target){const all=rows(p,target),customer=p.features.relay!.customers.find(c=>c.businessId===target.businessId&&c.balance.prepaidFen>0&&c.dueReceivableFen===0)!,supplier=p.features.relay!.supplyOptions.find(o=>o.businessId===target.businessId&&(o.credit?.remainingFen??0)>0&&o.outstandingFen===0)!;expect(customer).toBeDefined();expect(supplier).toBeDefined();return {customer,supplier,customerRow:all.find(r=>r.kind==='customer'&&r.customerId===customer.id)!,supplierRow:all.find(r=>r.kind==='supplier'&&r.supplierId===supplier.supplierId)!,all}}
function alter(p:GamePanelProps,update:(relay:Relay)=>Relay):GamePanelProps{const features={...p.features,relay:update(p.features.relay!)};return {...p,features,view:{...p.view,features:features as unknown as PlayingView['features']}}}

it('classifies the actual115 protected customer balance as retained and unused supplier credit as optional without changing original rows',()=>{
 const p=props(),{customerRow,supplierRow,all}=assets(p),before=JSON.stringify(all),account=p.view.accounts.find(a=>a.accountId===current.target.accountId)!
 expect(relayRecordReading(p,current.target,customerRow)).toMatchObject({meaning:'retained',unknown:false});expect(relayRecordReading(p,current.target,supplierRow)).toMatchObject({meaning:'optional',unknown:false})
 expect(relayRecordNeedsReply(p,current.target,customerRow)).toBe(false);expect(relayRecordNeedsReply(p,current.target,supplierRow)).toBe(false)
 expect(relayRecordProtectionText(p,current.target)).toContain(moneyText(account.prepaidLiabilityFen));expect(relayRecordProtectionText(p,current.target)).toContain(moneyText(account.protectionRequiredFen));expect(relayRecordProtectionText(p,current.target)).toContain('不要求为翻页或离开退清')
 expect(JSON.stringify(rows(p,current.target))).toBe(before);expect(current.controller.exportSaved()).toBe(source115)
})

it('keeps all actual115 rows reachable across four reading groups and original kind filters with protection always visible',()=>{
 const p=props(),{customerRow,supplierRow,all}=assets(p),start=all.find(r=>r.kind==='service')!,ui=reader('actual115-reading-filters',p,current.target,start.key)
 ui.click('翻另一张同对象的原票');expect(ui.keys()).not.toContain(customerRow.key);expect(ui.keys()).not.toContain(supplierRow.key);expect(ui.text()).toContain('未消费客户预款');expect(ui.text()).toContain('正常留存不要求')
 ui.filter('meaning:optional');expect(ui.keys()).toContain(supplierRow.key);ui.pick(supplierRow.key);ui.click('明确翻开这一张原票');expect(ui.text()).toContain('可选处理');expect(ui.text()).toContain('正常留存不是未完成任务');expect(ui.button('核对这项供应，本次取回多少本站资产')).toBeDefined()
 ui.click('翻另一张同对象的原票');ui.filter('meaning:retained');expect(ui.keys()).toContain(customerRow.key)
 ui.filter('');expect([...ui.keys()].sort()).toEqual(all.map(r=>r.key).sort());ui.filter('customer');expect([...ui.keys()].sort()).toEqual(all.filter(r=>r.kind==='customer').map(r=>r.key).sort())
 ui.pick(customerRow.key);ui.filter('supplier');expect(ui.button('明确翻开这一张原票').props.disabled).toBe(true);expect(ui.text()).toContain('没有代换')
 expect(p.request).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(source115)
})

it('retains the actual115 refund decision, original payload and same-customer amount draft after classifying its balance as retained',()=>{
 const p=props(),{customer,customerRow}=assets(p),ui=reader('actual115-retained-customer-refund',p,current.target,customerRow.key),before=current.controller.exportSaved()
 expect(ui.text()).toContain('留存依据');ui.click('核对这位客户，本次退还多少未消费原款');ui.edit('本次退还客户金额','0.01');ui.click('先收起本次填写，仍留这张原票');expect(ui.text()).toContain(customerRow.title)
 ui.click('核对这位客户，本次退还多少未消费原款');expect(ui.value('本次退还客户金额')).toBe('0.01');const button=ui.button('核对退还这位客户的未消费原款');expect(button.props.disabled).toBe(false);ui.click('核对退还这位客户的未消费原款')
 expect(p.request).toHaveBeenCalledExactlyOnceWith('RefundRelayBalance',{customerId:customer.id,amountFen:1},'核对退还这位客户的未消费原款',true)
 expect(current.controller.preview(current.controller.prepare('RefundRelayBalance',{customerId:customer.id,amountFen:1})).allowed).toBe(true);expect(current.controller.exportSaved()).toBe(before)
})

it('distinguishes real86 due invoices, future invoices, active support and uncommissioned meters without reading hidden actual units',()=>{
 const p=props(original),all=rows(p,original.target),v=p.features.relay!,due=all.find(r=>r.kind==='receivable'&&v.receivables.some(i=>i.id===r.receivableId&&i.dueAt<=p.view.date&&i.amountFen>i.collectedFen+i.reversedFen))!,future=all.find(r=>r.kind==='receivable'&&v.receivables.some(i=>i.id===r.receivableId&&i.dueAt>p.view.date&&i.amountFen>i.collectedFen+i.reversedFen))!,support=all.find(r=>r.kind==='support'&&p.view.operations!.jobs.some(j=>j.id===r.jobId&&j.status==='running'))!,meter=all.find(r=>r.kind==='meter'&&v.meters.some(m=>m.id===r.meterId&&m.supplierId!==null&&m.auditedUnits===null))!
 expect(relayRecordReading(p,original.target,due).meaning).toBe('respond');expect(relayRecordReading(p,original.target,future).meaning).toBe('waiting');expect(relayRecordReading(p,original.target,support).meaning).toBe('waiting');expect(relayRecordReading(p,original.target,meter).meaning).toBe('optional')
 expect(relayRecordNeedsReply(p,original.target,meter)).toBe(false);expect(v.meters.every(m=>m.auditedUnits===null)).toBe(true)
 const unserved=all.filter(r=>r.kind==='meter'&&v.meters.some(m=>m.id===r.meterId&&m.supplierId===null));expect(unserved.length).toBeGreaterThan(0);expect(unserved.every(r=>relayRecordReading(p,original.target,r).meaning==='retained')).toBe(true)
 const ui=reader('actual86-future-and-optional',p,original.target,support.key);ui.click('翻另一张同对象的原票');ui.filter('meaning:optional');expect(ui.keys()).toContain(meter.key);ui.pick(meter.key);ui.click('明确翻开这一张原票');expect(ui.text()).toContain('尚未委托，不冒充正在等');expect(ui.button('为这一张已发生的原票，安排独立复核')).toBeDefined()
 expect(p.request).not.toHaveBeenCalled();expect(original.controller.exportSaved()).toBe(source86)
})

it('keeps the actual accepted114 quote in waiting and the actually effective115 quote in original evidence',()=>{
 const quoteId='rly:ae174caa5b7cf8e01f7c66c6191aa1ff',p=props(futureQuote),qrow=rows(p,futureQuote.target).find(r=>r.quoteId===quoteId)!,effective=props(),erow=rows(effective,current.target).find(r=>r.quoteId===quoteId)!
 expect(relayRecordReading(p,futureQuote.target,qrow).meaning).toBe('waiting');expect(relayRecordQuoteEffectiveDate(p,futureQuote.target,qrow)).toBe('2025-04-09');expect(relayRecordNeedsReply(p,futureQuote.target,qrow)).toBe(true)
 expect(relayRecordReading(effective,current.target,erow).meaning).toBe('retained');expect(relayRecordQuoteEffectiveDate(effective,current.target,erow)).toBeNull();expect(relayRecordNeedsReply(effective,current.target,erow)).toBe(false)
 expect(futureQuote.controller.exportSaved()).toBe(source114);expect(current.controller.exportSaved()).toBe(source115)
})

it.each(['future','due','missing-history','wrong-owner','wrong-target'] as const)('preserves conservative public obligation meaning for %s without changing permission',variant=>{
 // Explicit public-view counterexamples. They are never imported or saved.
 const base=props(),all=rows(base,current.target),source=all.find(r=>r.kind==='obligation')!,h=base.features.relay!.casebook!,debt=h.obligationHistory.find(o=>o.id===source.obligationId)!
 expect(source).toBeDefined();expect(debt).toBeDefined()
 const patched=alter(base,v=>({...v,casebook:{...h,status:variant==='missing-history'?'unavailable':'ready',obligationHistory:h.obligationHistory.map(o=>o.id===debt.id?{...o,amountFen:75,remainingFen:75,date:variant==='future'?'2025-04-10':'2025-04-08',scopeBusinessId:variant==='wrong-owner'?'other-business':o.scopeBusinessId}:o)}})),target=variant==='wrong-target'?{...current.target,accountId:'other-account'}:current.target,result=relayRecordReading(patched,target,source)
 expect(result.meaning).toBe(variant==='future'?'waiting':'respond');if(variant!=='future'&&variant!=='due'){expect(result.unknown).toBe(true);expect(result.reason).toContain('不把未知当作零')}
 expect(patched.request).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(source115)
})

it('keeps an explicitly missing record missing and a stable readonly balance readable while its original refund remains disabled',()=>{
 const base=props(),{customerRow}=assets(base),view={...base.view,readOnly:true,saveStatus:'read_only' as const},controller=new Proxy(base.controller,{get(target,key){if(key==='snapshot')return {...target.snapshot,view};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}}),p={...base,controller,view,request:vi.fn<GamePanelProps['request']>()},ui=reader('readonly-retained-balance',p,current.target,customerRow.key)
 expect(ui.text()).toContain('留存依据');expect(ui.text()).toContain('未消费客户预款');ui.click('核对这位客户，本次退还多少未消费原款');const button=ui.button('核对退还这位客户的未消费原款');expect(button.props.disabled).toBe(true)
 if(typeof button.props.onClick!=='function')throw Error('ORIGINAL_READONLY_REFUND_HANDLER_REQUIRED')
 button.props.onClick();expect(p.request).not.toHaveBeenCalled()
 base.relayRecordMemory!.write(current.target,customerRow.key)
 const missing=reader('explicit-missing-record',base,current.target,'customer:missing-original');expect(missing.text()).toContain('原来指定的票现已不能唯一找到');expect(missing.all().some(e=>e.type==='input'&&e.props.inputMode==='decimal')).toBe(false)
 expect(current.controller.exportSaved()).toBe(source115)
})

it('does not turn a candidate or an unexplained receivable balance into a cleared retained obligation',()=>{
 const base=props(),{customer,customerRow}=assets(base),changed=alter(base,v=>({...v,customers:v.customers.map(c=>c.id===customer.id?{...c,balance:{...c.balance,receivableFen:1}}:c)})),classification=relayRecordReading(changed,current.target,customerRow)
 expect(classification).toMatchObject({meaning:'respond',unknown:true});expect(classification.reason).toContain('不把未知当作零')
 const view={...base.view,hasCandidate:true},controller=new Proxy(base.controller,{get(target,key){if(key==='snapshot')return {...target.snapshot,view};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}}),p={...base,view,controller,request:vi.fn<GamePanelProps['request']>()},ui=reader('candidate-retained-balance',p,current.target,customerRow.key)
 expect(ui.text()).toContain('留存依据');expect(ui.text()).toContain('未消费客户预款');ui.click('核对这位客户，本次退还多少未消费原款');expect(ui.all().some(e=>e.type==='input'&&e.props.inputMode==='decimal')).toBe(false)
 expect(p.request).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(source115)
})

it('retains the disclosed settlement wait after an original support interruption rather than calling its consequences complete',()=>{
 // Public-view stopped-support counterexample, not another normal save.
 const base=props(original),support=rows(base,original.target).find(row=>row.kind==='support'&&base.view.operations!.jobs.some(job=>job.id===row.jobId&&job.status==='running'))!,job=base.view.operations!.jobs.find(job=>job.id===support.jobId)!,stopped={...job,status:'interrupted' as const,releasedAt:base.view.date},scoped=alter(base,v=>({...v,periods:v.periods.map(period=>period.supportJobId===job.id?{...period,supportJob:stopped}:period)}))
 const p={...scoped,view:{...scoped.view,operations:{...base.view.operations!,jobs:base.view.operations!.jobs.map(old=>old.id===job.id?stopped:old)}}}
 const result=relayRecordReading(p,original.target,support)
 expect(result).toMatchObject({meaning:'waiting',unknown:false});expect(result.reason).toContain('原结算日 '+job.completeAt);expect(result.reason).toContain('不是免费补做支持');expect(result.reason).toContain('不预告结算金额')
 expect(p.request).not.toHaveBeenCalled();expect(original.controller.exportSaved()).toBe(source86)
})
