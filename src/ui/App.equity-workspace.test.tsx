import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeEquitySign.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import DeepseekPanel from './DeepseekPanel.tsx'
import EquityPanel from './EquityPanel.tsx'
import {EquityMoment} from './EquityMoment.tsx'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import {Dialog} from './Dialog.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Actual App/book callbacks and original normal Controller/IDB. The hook
// driver deliberately leaves DOM/effects/Chrome and human comprehension unproven.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=>hooks.scope,useSyncExternalStore:<T,>(_subscribe:unknown,get:()=>T)=>get(),useMemo:<T,>(create:()=>T,deps:readonly unknown[])=>{const slot=state<{deps:readonly unknown[];value:T}|null>(null),old=slot[0];if(old&&old.deps.length===deps.length&&deps.every((d,i)=>Object.is(d,old.deps[i])))return old.value;const row={deps:[...deps],value:create()};slot[1](row);return row.value}}
})
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{return Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]}
function text(value:unknown):string{return typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(typeof fn!=='function'||e.props.disabled)throw Error('ACTUAL_ENABLED_CALLBACK_REQUIRED:'+name);return fn(...args)}
function run<T,>(scope:string,create:()=>T):T{hooks.scope=scope;hooks.index=0;return create()}
async function setup(id:string,faulty=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='u6-app-workspace-'+id,locks=new MemoryWriterAccess();let armed=false,n=0
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks,id:()=>`u6-app-${id}-${++n}`})
 await controller.initialize();await controller.importNew(raw)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,negotiation=features.deepseek!.negotiations.filter(n=>n.accepted===true&&n.closedAt===null)
 expect(negotiation).toHaveLength(1)
 const original=negotiation[0]!,b=features.deepseek!.businesses.find(b=>b.id===original.businessId)!,target:EquitySceneTarget={runId:view.runId,accountId:b.accountId,businessId:b.id,kind:'negotiation',recordId:original.id}
 const storage=new Map<string,string>(),render=()=>run('app-'+id,()=>elements(App({controller,focusPreferenceStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{storage.set(key,value)}}})))
 const room=(tree=render())=>tree.find(e=>e.type===CinematicRoom)!,scene=(tree=render())=>tree.find(e=>e.type===EquityMoment)!
 const book=(tree=render())=>tree.find(e=>e.type===Dialog&&String(e.props.className).includes('workspace-deepseek'))!
 const pane=(tree=render())=>tree.find(e=>e.props.initialPane!==undefined&&typeof e.props.onPaneChange==='function')!
 return {codec,store,controller,locks,fault,target,b,original,view,features,render,room,scene,book,pane,arm:()=>{armed=true},close:async()=>{await controller.close();await store.close()}}
}
let normal:Awaited<ReturnType<typeof setup>>,failed:Awaited<ReturnType<typeof setup>>
beforeAll(async()=>{normal=await setup('normal');failed=await setup('failed',true)})
afterAll(async()=>{if(normal)await normal.close();if(failed)await failed.close()})
beforeEach(()=>hooks.slots.clear())

it('keeps a legacy reading ID and resolves its exact original negotiation in both App and book',()=>{
 const h=normal,before=h.controller.exportSaved()
 invoke(h.room(),'onNavigate','deepseek',{accountId:h.b.accountId,deepseekPane:'equity',recordId:h.original.id,openRecord:true})
 const tree=h.render(),pane=h.pane(tree),focus=h.scene(tree).props.focus as {equityTarget:EquitySceneTarget}
 expect(focus.equityTarget).toEqual(h.target);expect(pane.props.initialFocusId).toBe(h.original.id);expect(pane.props).not.toHaveProperty('initialEquityTarget')
 const props=pane.props as unknown as Parameters<typeof DeepseekPanel>[0],book=run('legacy-deepseek',()=>DeepseekPanel(props)),equity=elements(book).find(e=>e.props.initialFocusId===h.original.id&&e.props.assignment!==undefined)!
 const ledger=run('legacy-equity',()=>EquityPanel(equity.props as unknown as Parameters<typeof EquityPanel>[0]))
 expect(text(ledger)).not.toContain('先找回原来这一份权益记录')
 expect(elements(ledger).filter(e=>e.type==='section'&&e.props.id===h.original.id)).toHaveLength(1)
 invoke(h.book(),'onClose');expect(h.room()).toBeDefined();expect(h.scene()).toBeUndefined()
 expect(h.controller.exportSaved()).toBe(before)
})

it('preserves an explicitly conflicting account rather than adopting the target owner in the reader',()=>{
 const h=normal,other=h.view.accounts.find(a=>a.accountId!==h.b.accountId)!.accountId,before=h.controller.exportSaved()
 invoke(h.room(),'onNavigate','deepseek',{accountId:other,deepseekPane:'equity',equityTarget:h.target,recordId:h.original.id,openRecord:true})
 const pane=h.pane(),scene=h.scene(),focus=scene.props.focus as {accountId:string;equityTarget:EquitySceneTarget}
 expect(pane.props.accountId).toBe(other);expect(focus.accountId).toBe(other);expect(focus.equityTarget).toEqual(h.target)
 const p=pane.props as unknown as GamePanelProps,ledger=run('wrong-owner-book',()=>EquityPanel({...p,assignment:{resources:[],startAt:''},initialTarget:h.target}))
 expect(text(ledger)).toContain('原权益对象与当前账户不匹配');expect(elements(ledger).some(e=>e.props.kind==='SignEquityAgreement')).toBe(false)
 const originalBook=run('wrong-owner-outer-book',()=>DeepseekPanel(pane.props as unknown as Parameters<typeof DeepseekPanel>[0]))
 expect(elements(originalBook).some(e=>e.props.className==='route-introduction')).toBe(false)
 expect(elements(originalBook).filter(e=>e.props.initialTarget===h.target&&e.props.assignment!==undefined)).toHaveLength(1)
 expect(h.controller.exportSaved()).toBe(before)
})

it('retains a missing legacy record as an invalid focus with no write action until explicit re-selection',()=>{
 const h=normal,before=h.controller.exportSaved()
 invoke(h.room(),'onNavigate','deepseek',{accountId:h.b.accountId,deepseekPane:'equity',recordId:'missing-original-record',openRecord:true})
 const pane=h.pane(),scene=h.scene(),focus=scene.props.focus as {entityId:string;equityTarget:null}
 expect(focus.entityId).toBe('missing-original-record');expect(focus.equityTarget).toBeNull();expect(pane.props).not.toHaveProperty('initialEquityTarget')
 const p=pane.props as unknown as GamePanelProps,ledger=run('missing-original-book',()=>EquityPanel({...p,assignment:{resources:[],startAt:''},initialFocusId:'missing-original-record'}))
 expect(text(ledger)).toContain('先找回原来这一份');expect(elements(ledger).some(e=>typeof e.props.kind==='string')).toBe(false)
 const moment=run('missing-original-moment',()=>Reflect.apply(EquityMoment,undefined,[scene.props]))
 const tableau=elements(moment).find(e=>e.props.decisions!==undefined)!
 expect(text(tableau.props.decisions)).toContain('明确重选这份权益原记录')
 expect((tableau.props.object as Element).props.unavailable).toBe(true)
 expect(text(tableau.props.context)).not.toContain('先选原个人准备分账')
 expect(text(tableau.props.facts)).not.toContain('权益直接费用')
 expect(elements(tableau.props.decisions).some(e=>typeof e.props.kind==='string')).toBe(false)
 invoke(h.book(),'onClose')
 const record=elements(tableau.props.record).find(e=>e.type==='button')!;invoke(record,'onClick')
 expect(h.pane().props.initialFocusId).toBe('missing-original-record');expect(h.pane().props).not.toHaveProperty('initialEquityTarget');invoke(h.book(),'onClose')
 const main=elements(tableau.props.decisions).find(e=>e.type==='button'&&text(e.props.children).includes('明确重选'))!;invoke(main,'onClick')
 const reopened=run('missing-original-moment',()=>Reflect.apply(EquityMoment,undefined,[scene.props])),choice=elements(reopened).find(e=>e.type===EquitySceneChoice)!
 expect(choice.props.sourceInvalid).toBe(true)
 const choices=run('missing-choices',()=>Reflect.apply(EquitySceneChoice,undefined,[choice.props]))
 expect(elements(choices).some(e=>typeof e.props.kind==='string')).toBe(false)
 expect(text(choices)).toContain('重新选择关注')

 expect(h.controller.exportSaved()).toBe(before)
})

it('notifies App when the original book changes participation pane and explicitly selects its original actor',()=>{
 const h=normal,before=h.controller.exportSaved()
 invoke(h.room(),'onNavigate','deepseek',{accountId:'personal',openRecord:true})
 const original=h.pane(),props=original.props as unknown as Parameters<typeof DeepseekPanel>[0],book=run('pane-switch',()=>DeepseekPanel(props)),button=elements(book).find(e=>e.type==='button'&&text(e.props.children)==='直接投资（明确架空）')!
 invoke(button,'onClick');const now=h.pane();expect(now.props.initialPane).toBe('equity')
 const updated=run('pane-switch',()=>DeepseekPanel(now.props as unknown as Parameters<typeof DeepseekPanel>[0])),equity=elements(updated).find(e=>e.props.assignment!==undefined&&typeof e.props.onTargetChange==='function')!
 const ledger=run('actor-select',()=>EquityPanel(equity.props as unknown as Parameters<typeof EquityPanel>[0])),owner=elements(ledger).find(e=>e.type==='label'&&text(e.props.children).startsWith('明确选择新邀请与谈判的准备主体'))!,select=elements(owner).find(e=>e.type==='select')!
 invoke(select,'onChange',{currentTarget:{value:h.b.id}})
 const focus=h.scene().props.focus as {equityTarget:EquitySceneTarget}
 expect(focus.equityTarget).toEqual({runId:h.view.runId,accountId:h.b.accountId,businessId:h.b.id,kind:'business'})
 invoke(h.book(),'onClose');expect(h.room()).toBeDefined();expect((h.room().props.openingFocus as {equityTarget:EquitySceneTarget}).equityTarget).toEqual(focus.equityTarget);expect(h.controller.exportSaved()).toBe(before)
})

it('captures original negotiation and signing choices in the actual App confirmation and cancels without paying or changing rights',()=>{
 const h=normal,before=h.controller.exportSaved()
 invoke(h.room(),'onNavigate','deepseek',{accountId:h.b.accountId,deepseekPane:'equity',equityTarget:h.target})
 const p=h.scene().props.p as GamePanelProps
 for(const [kind,body] of [['StartEquityNegotiation',{invitationId:h.original.invitationId,acquisitionKind:'secondary',termsId:'liquidity',amountFen:800000,resources:['player-production'],startAt:h.view.date}],['SignEquityAgreement',{negotiationId:h.original.id}]] as const){
  p.request(kind,body,'逐项核对原选择',true)
  const modal=h.render().find(e=>e.type===Dialog&&e.props.title==='逐项核对原选择')!,facts=elements(modal).find(e=>e.type===EquityDecisionFacts)!
  expect(facts).toBeDefined();expect(facts.props.view).toBe(h.controller.snapshot.view);expect(facts.props.features).toBe(h.controller.snapshot.view!.features)
  expect(facts.props.command).toMatchObject({kind,payload:body,expectedRevision:93});expect(facts.props.preview).toMatchObject({allowed:true})
  invoke(elements(modal).find(e=>e.type==='button'&&text(e.props.children)==='返回调整')!,'onClick')
  expect(h.controller.exportSaved()).toBe(before)
 }
})

it('retains the actual old terms after head.put abort, then follows only the original retry to its new agreement',async()=>{
 const h=failed,before=h.controller.exportSaved()
 const submit=vi.spyOn(h.controller,'submit'),retryCall=vi.spyOn(h.controller,'retry');
 invoke(h.room(),'onNavigate','deepseek',{accountId:h.b.accountId,deepseekPane:'equity',equityTarget:h.target})
 const scene=h.scene(),request=scene.props.p as GamePanelProps
 h.arm();request.request('SignEquityAgreement',{negotiationId:h.original.id},'本次实际签署',true)
 const modal=h.render().find(e=>e.type===Dialog&&e.props.title==='本次实际签署')!,decide=elements(modal).find(e=>e.type==='button'&&text(e.props.children)==='就这样决定 →')!
 invoke(decide,'onClick')
 expect((await submit.mock.results.at(-1)!.value).status).toBe('unsaved')
 // Wait for the original App dispatch/finally as well as the real Controller.
 await new Promise(resolve=>setTimeout(resolve,0))
 expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(h.controller.snapshot.view!.revision).toBe(93);expect(h.controller.exportSaved()).toBe(before)
 expect(h.controller.exportCandidate()).not.toBe(before);expect((h.scene().props.focus as {equityTarget:EquitySceneTarget}).equityTarget).toEqual(h.target)
 // load already verifies the full envelope, receipt and log bundle. Compare
 // its entire state with the actual exported state without sealing it again.
 const physical=await h.store.load(h.view.runId);expect(physical).not.toBeNull();expect(physical!.run).toEqual(JSON.parse(before).state)
 const retry=h.render().find(e=>e.type==='button'&&text(e.props.children)==='重试保存原候选')!;invoke(retry,'onClick')
 expect((await retryCall.mock.results.at(-1)!.value).status).toBe('saved')
 await new Promise(resolve=>setTimeout(resolve,0))
 const current=h.controller.snapshot.view!,agreement=(current.features as unknown as PlayFeatures).deepseek!.agreements[0]!,focus=h.scene().props.focus as {equityTarget:EquitySceneTarget}
 expect(current.revision).toBe(94);expect(current.hasCandidate).toBe(false);expect(focus.equityTarget).toEqual({runId:current.runId,accountId:agreement.accountId,businessId:agreement.businessId,kind:'agreement',recordId:agreement.id})
 expect((await h.store.load(current.runId))!.run).toEqual(JSON.parse(h.controller.exportSaved()).state)
 expect(submit).toHaveBeenCalledTimes(1);expect(retryCall).toHaveBeenCalledTimes(1)
 submit.mockRestore();retryCall.mockRestore();
})

// Continue the exact same committed retry, with a separate bounded verification
// of reader ownership. No assertion or source step is dropped from the scenario.
it('keeps the same actually retried agreement readonly in a second controller',async()=>{
 const h=failed,current=h.controller.snapshot.view!,saved=h.controller.exportSaved()
 expect(current.revision).toBe(94);expect(current.hasCandidate).toBe(false)
 const reader=new GameController({codec:h.codec,store:h.store,locks:h.locks})
 try{await reader.initialize();await reader.continueLife(current.runId);expect(reader.snapshot.view!.readOnly).toBe(true);expect(reader.snapshot.view!.readOnlyReason).toBe('ANOTHER_WRITER');expect(reader.exportSaved()).toBe(saved);expect(reader.preview(reader.prepare('SignEquityAgreement',{negotiationId:h.original.id})).allowed).toBe(false);expect(h.codec.export((await h.store.load(current.runId))!.run)).toBe(saved)}finally{await reader.close()}
})
