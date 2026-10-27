import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {RelaySceneChoice,RelayNextServiceConditions} from './RelaySceneChoice.tsx'
import {relayNextServiceContract} from './relay-next-service-contract.ts'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft} from './relay-scene-draft.ts'
import {createRelayResponseDraftMemory} from './relay-response-draft.ts'
import {relayDraftScopeForTarget} from './RelayServiceChoice.tsx'
import source115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-23-reentered-new115-exact.json?raw'

const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0,ids:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=>state(()=> 'next-contract-'+(++hooks.ids))[0],useEffect:()=>{},useMemo:<T,>(factory:()=>T)=>factory()}
})
function mounted<T>(key:string,render:()=>T):T{const previous=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return render()}finally{hooks.current=previous;hooks.index=index}}
type Element=ReactElement<Record<string,unknown>>
const driven=new Set(['RelayNextServiceConditions','RelayResponseEditor','RelayRenewFields','RelayServiceChoice','RelayServiceFields','RelayDraftResources','RelayDraftDate','CommandButton'])
function elements(value:unknown,path:string):Element[]{
 if(Array.isArray(value))return value.flatMap((child,index)=>elements(child,path+'/'+index))
 if(!isValidElement<Record<string,unknown>>(value))return []
 const own=[value,...elements(value.props.children,path+'/children'),...elements(value.props.footer,path+'/footer')]
 if(typeof value.type==='function'&&driven.has(value.type.name)){const component=value.type as (props:Record<string,unknown>)=>unknown;own.push(...elements(mounted(path+':'+component.name,()=>component(value.props)),path+'/render'))}
 return own
}
function text(value:unknown):string{if(typeof value==='string'||typeof value==='number')return String(value);if(Array.isArray(value))return value.map(text).join('');return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
type Business=Extract<RelaySceneTarget,{kind:'business'}>
let controller:GameController,store:IndexedDbRunStore,frame:PlayingView,features:PlayFeatures,business:Business,period:Extract<RelaySceneTarget,{kind:'period'}>
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'next-service-original115'})
 let sequence=0;controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'next-contract-'+(++sequence)})
 await controller.initialize();await controller.importNew(source115);frame=controller.snapshot.view!;features=frame.features as unknown as PlayFeatures
 const v=features.relay!,b=v.businesses[0]!,s=v.stations.find(st=>st.businessId===b.id)!,p=v.periods.find(p=>p.businessId===b.id&&p.status==='closed')!
 business={kind:'business',runId:frame.runId,accountId:b.accountId,businessId:b.id,stationId:s.id};period={...business,kind:'period',periodId:p.id}
 expect(frame.revision).toBe(115);expect(frame.date).toBe('2025-04-09');expect(controller.exportSaved()).toBe(source115)
},20000)
afterAll(async()=>{await controller.close();await store.close()})
function props():GamePanelProps{return {controller,view:frame,features,accountId:business.accountId,request:vi.fn<GamePanelProps['request']>(),textOnly:true,relayDraftMemory:createRelaySceneDraftMemory(frame.runId),relayResponseDraftMemory:createRelayResponseDraftMemory(frame.runId)}}
function ui(name:string,p:GamePanelProps,direct=false){
 const onInspect=vi.fn(),onTargetChange=vi.fn(),onClose=vi.fn();let tree:unknown
 const refresh=()=>{tree=mounted(name,()=>direct?RelayNextServiceConditions({p,target:business,onInspect,onClose}):RelaySceneChoice({p,target:period,onInspect,onTargetChange,children:open=><button type="button" onClick={()=>open('next-service')}>打开同企业新期条件</button>}))},all=()=>elements(tree,name)
 refresh()
 return {refresh,all,onInspect,onTargetChange,onClose,setProps(next:GamePanelProps){p=next;refresh()},text:()=>all().map(e=>[typeof e.props.title==='string'?e.props.title:'',text(e.props.children)].join(' ')).join(' '),
  button(label:string){const e=all().find(e=>e.type==='button'&&text(e.props.children).includes(label));if(!e)throw Error('NEXT_CONTRACT_BUTTON_REQUIRED:'+label);return e},
  click(label:string){const e=all().find(e=>e.type==='button'&&text(e.props.children).includes(label));if(!e||e.props.disabled||typeof e.props.onClick!=='function')throw Error('NEXT_CONTRACT_ENABLED_BUTTON_REQUIRED:'+label);e.props.onClick();refresh()},
  pick(id:string){const label=all().find(e=>e.type==='label'&&e.key===id),input=label&&elements(label,name+'/pick').find(e=>e.type==='input'&&e.props.type==='radio');if(!input||input.props.disabled||typeof input.props.onChange!=='function')throw Error('NEXT_CONTRACT_EXACT_CUSTOMER_REQUIRED:'+id);input.props.onChange({target:{checked:true}});refresh()},
  edit(label:string,value:string){const field=all().find(e=>e.type==='label'&&text(e.props.children).includes(label)),input=field&&elements(field,name+'/edit').find(e=>e.type==='input'||e.type==='select');if(!input||typeof input.props.onChange!=='function')throw Error('NEXT_CONTRACT_EDIT_REQUIRED:'+label);input.props.onChange({target:{value}});refresh()},
  value(label:string){const field=all().find(e=>e.type==='label'&&text(e.props.children).includes(label)),input=field&&elements(field,name+'/value').find(e=>e.type==='input'||e.type==='select');return input?.props.value},
 }
}

it('publishes the original115 earliest28-day window and six exact short contracts before any four-step service filling',()=>{
 const p=props(),before=controller.exportSaved(),contract=relayNextServiceContract(p,business),screen=ui('short115-first',p)
 expect(contract.window).toEqual({from:'2025-04-10',to:'2025-05-08',minimumTermEnd:'2025-05-07'});expect(contract.customers).toHaveLength(6);expect(contract.customers.every(c=>c.coverage==='short')).toBe(true)
 expect(contract.customers.map(c=>c.id)).toEqual(p.features.relay!.customers.filter(c=>c.businessId===business.businessId).map(c=>c.id))
 screen.click('打开同企业新期条件');expect(screen.text()).toContain('2025-04-10');expect(screen.text()).toContain('2025-05-08');expect(screen.text()).toContain('2025-05-07');expect(screen.text()).toContain('目前没有一份已核原合同能覆盖')
 const radios=screen.all().filter(e=>e.type==='input'&&e.props.type==='radio');expect(radios).toHaveLength(6);expect(radios.every(e=>e.props.checked===false)).toBe(true)
 expect(screen.all().some(e=>e.type==='input'&&e.props.type==='checkbox')).toBe(false);expect(screen.button('明确核对这位原客户的续签条件').props.disabled).toBe(true)
 for(const c of p.features.relay!.customers){expect(screen.text()).toContain(c.termEnd);expect(screen.text()).toContain(c.activeTerms.sourceId)}
 expect(screen.text()).toContain('客户保护');expect(screen.text()).toContain('本季可用3点');expect(p.request).not.toHaveBeenCalled();expect(screen.onTargetChange).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
})

it('opens one explicitly selected original customer renewal, keeps an empty new promise and returns without touching either service draft or period bookmark',()=>{
 const p=props(),customer=p.features.relay!.customers[1]!,scope=relayDraftScopeForTarget(p,business,'service').scope!,draft={...emptyRelaySceneDraft(),customerIds:[customer.id],maxUnits:'12345',maxSupplierCost:'12.34'}
 p.relayDraftMemory!.write(p.view.runId,scope,draft)
 const screen=ui('renew115-cancel-and-return',p);screen.click('打开同企业新期条件');screen.pick(customer.id);screen.click('明确核对这位原客户的续签条件')
 expect(screen.text()).toContain('这份客户约定，还愿意怎样继续？');expect(screen.value('本次新有效期')).toBe('');expect(screen.value('本次续签收款条件')).toBe('')
 screen.edit('本次新有效期','2025-05-31');screen.edit('本次续签收款条件','postpaid');screen.edit('本次新后付信用上限','100')
 screen.click('返回同企业新期条件，保留两份草稿');expect(p.relayDraftMemory!.read(p.view.runId,scope)).toEqual(draft);screen.click('明确核对这位原客户的续签条件');expect(screen.value('本次新有效期')).toBe('2025-05-31');expect(screen.value('本次新后付信用上限')).toBe('100')
 screen.click('翻看同企业原册，保留两份草稿');expect(screen.onInspect).toHaveBeenCalledExactlyOnceWith(business,'service');expect(screen.onTargetChange).not.toHaveBeenCalled()
 const returned=ui('renew115-after-book-remount',p);returned.click('打开同企业新期条件');returned.pick(customer.id);returned.click('明确核对这位原客户的续签条件');expect(returned.value('本次新有效期')).toBe('2025-05-31');expect(returned.onTargetChange).not.toHaveBeenCalled()
 expect(p.relayDraftMemory!.read(p.view.runId,scope)).toEqual(draft);expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source115)
})

it('uses the existing RenewRelayCustomer preview and original confirm payload without charging or starting a service during preparation',()=>{
 const p=props(),customer=p.features.relay!.customers[1]!,screen=ui('renew115-original-command',p,true)
 screen.pick(customer.id);screen.click('明确核对这位原客户的续签条件');screen.edit('本次新有效期','2025-05-31');screen.edit('本次续签收款条件','postpaid');screen.edit('本次新后付信用上限','100')
 const payload={customerId:customer.id,termEnd:'2025-05-31',mode:'postpaid',creditLimitFen:10000}
 expect(controller.preview(controller.prepare('RenewRelayCustomer',payload)).allowed).toBe(true)
 screen.click('核对这位客户新的期限与收款条件');expect(p.request).toHaveBeenCalledExactlyOnceWith('RenewRelayCustomer',payload,'核对这位客户新的期限与收款条件',true)
 expect(controller.exportSaved()).toBe(source115);expect(screen.onTargetChange).not.toHaveBeenCalled()
})

it('keeps direct explicit service selection available when one original contract already covers the earliest window, without forcing renewal or choosing customers',()=>{
 const base=props(),v=base.features.relay!,customer=v.customers[0]!,changed={...base.features,relay:{...v,customers:v.customers.map(c=>c.id===customer.id?{...c,termEnd:'2025-05-07'}:c)}},p={...base,features:changed,view:{...base.view,features:changed as unknown as PlayingView['features']}}
 // Bounded public-display contract boundary, never a submitted renewal or a normal save.
 const contract=relayNextServiceContract(p,business),screen=ui('one-contract-covers-boundary',p,true)
 expect(contract.customers[0]!.coverage).toBe('covers');expect(contract.customers.slice(1).every(c=>c.coverage==='short')).toBe(true)
 expect(screen.text()).toContain('不强制续签');expect(screen.all().some(e=>e.type==='input'&&e.props.type==='checkbox')).toBe(true);expect(screen.all().filter(e=>e.type==='input'&&e.props.type==='checkbox').every(e=>e.props.checked===false)).toBe(true)
 expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source115)
})

it.each(['readOnly','candidate','conflict','stale'] as const)('preserves the original %s write protection at the renewal response',protection=>{
 const base=props(),view={...base.view,revision:protection==='stale'?base.view.revision-1:base.view.revision,readOnly:protection==='readOnly',hasCandidate:protection==='candidate',saveStatus:protection==='conflict'?'conflict' as const:base.view.saveStatus},locked=new Proxy(controller,{get(target,key){if(key==='snapshot')return {...target.snapshot,view};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}}),p={...base,view,controller:protection==='stale'?controller:locked},screen=ui('locked-renew-'+protection,p,true),customer=p.features.relay!.customers[1]!
 if(protection==='readOnly'){
  screen.pick(customer.id);screen.click('明确核对这位原客户的续签条件');screen.edit('本次新有效期','2025-05-31');screen.edit('本次续签收款条件','postpaid');screen.edit('本次新后付信用上限','100')
  const button=screen.button('核对这位客户新的期限与收款条件');expect(button.props.disabled).toBe(true);if(typeof button.props.onClick==='function')button.props.onClick()
 }else{expect(screen.all().filter(e=>e.type==='input'&&e.props.type==='radio').every(e=>e.props.disabled===true)).toBe(true);expect(screen.button('明确核对这位原客户的续签条件').props.disabled).toBe(true)}
 expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source115)
})

it.each(['date','duration','term','terms-source','foreign'] as const)('keeps %s unknown without inventing an eligible customer or changing the original owner',variant=>{
 const base=props(),v=base.features.relay!,changed={...base.features,relay:{...v,catalog:variant==='duration'?{...v.catalog,serviceDays:0}:v.catalog,customers:variant==='term'||variant==='terms-source'?v.customers.map(c=>({...c,...(variant==='term'?{termEnd:'2025-02-30'}:{activeTerms:{...c.activeTerms,sourceId:''}})})):v.customers}},p={...base,features:changed,view:{...base.view,features:changed as unknown as PlayingView['features'],date:variant==='date'?'2025-02-30':base.view.date}},target=variant==='foreign'?{...business,accountId:'another-account'}:business,result=relayNextServiceContract(p,target)
 if(variant==='date'||variant==='duration'||variant==='foreign'){expect(result.reason).not.toBeNull();expect(result.window).toBeNull()}else expect(result.customers.every(c=>c.coverage==='unknown')).toBe(true)
 expect(result.customers.some(c=>c.coverage==='covers')).toBe(false);expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source115)
})


it('keeps a lost explicitly selected renewal customer unavailable rather than swapping customer or entering another service form',()=>{
 const p=props(),customer=p.features.relay!.customers[1]!,screen=ui('selected-renewal-lost',p,true)
 screen.pick(customer.id);screen.click('明确核对这位原客户的续签条件')
 const changed={...p.features,relay:{...p.features.relay!,customers:p.features.relay!.customers.filter(c=>c.id!==customer.id)}}
 screen.setProps({...p,features:changed,view:{...p.view,features:changed as unknown as PlayingView['features']}})
 expect(screen.text()).toContain('原来选择的续签客户已经不能唯一核对');expect(screen.text()).toContain('没有换成另一位');expect(screen.all().some(e=>e.type==='input')).toBe(false)
 expect(screen.onTargetChange).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source115)
})
