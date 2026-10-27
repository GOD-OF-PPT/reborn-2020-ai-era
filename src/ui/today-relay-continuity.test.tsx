import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {todayThread} from './today-thread.ts'
import {TodayScene} from './TodayScene.tsx'
import {relayBusinessTarget,relayFocusFor,relayFocusOpen} from './relay-player-thread.ts'
import type {OpeningFocus} from './player-thread.ts'
import {moneyText} from './game-text.ts'
import source115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-22-new115-quote-actually-effective-no-cash-ap-change.json?raw'
import source95 from '../../goal-1/evidence/t17-acceptance-37/chrome-service-stop-r6/s05-saved95-zeroap-stopped-period-original-support-retained.json?raw'
import source89 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n09-r4-saved89-support-actual-completion.json?raw'
import source111 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a20-saved111-explicit-future-requote-planned.json?raw'

// Existing normal Native captures, kept as separate historical branches. The
// original controller/public producer runs only when this test is executed.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0,ids:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=>state(()=> 'today-relay-'+(++hooks.ids))[0],useEffect:()=>{},useImperativeHandle:()=>{},useMemo:<T,>(factory:()=>T)=>factory()}
})
function mounted<T>(key:string,render:()=>T):T{const previous=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return render()}finally{hooks.current=previous;hooks.index=index}}
type Element=ReactElement<Record<string,unknown>>
const drawers=new Set(['VideoSceneChoice','CourseSceneChoice','MarketSceneChoice']),driven=new Set(['RoomTableau','OpeningObject','ClockAdvance','CommandButton'])
function elements(value:unknown,path:string):Element[]{
 if(Array.isArray(value))return value.flatMap((child,index)=>elements(child,path+'/'+index))
 if(!isValidElement<Record<string,unknown>>(value))return []
 // These three route drawers are closed in this test. Their unrelated open
 // callbacks are not exercised; TodayScene's own continuation is real.
 if(typeof value.type==='function'&&drawers.has(value.type.name)&&typeof value.props.children==='function')return elements(value.props.children(()=>{}),path+'/closed-drawer')
 const own=[value,...elements(value.props.children,path+'/children')]
 if(typeof value.type==='function'&&driven.has(value.type.name)){const component=value.type as (props:Record<string,unknown>)=>unknown;own.push(...elements(mounted(path+':'+component.name,()=>component(value.props)),path+'/render'))}
 return own
}
function text(value:unknown):string{if(typeof value==='string'||typeof value==='number')return String(value);if(Array.isArray(value))return value.map(text).join('');return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
type Frame={controller:GameController;view:PlayingView;features:PlayFeatures;raw:string}
let current:Frame,stopped:Frame,supportDone:Frame,quoted:Frame
const frames:Frame[]=[]
async function load(raw:string,revision:number):Promise<Frame>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'today-relay-original-'+revision})
 let sequence=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'today-relay-'+revision+'-'+(++sequence)})
 await controller.initialize();await controller.importNew(raw)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,frame={controller,view,features,raw}
 expect(view.revision).toBe(revision);expect(controller.exportSaved()).toBe(raw);expect(features.relay!.casebook!.status).toBe('ready');expect(features.relay!.businesses).toHaveLength(1)
 frames.push(frame);return frame
}
beforeAll(async()=>{current=await load(source115,115);stopped=await load(source95,95);supportDone=await load(source89,89);quoted=await load(source111,111)},20000)
afterAll(async()=>{for(const frame of frames)await frame.controller.close()})
const props=(frame=current):GamePanelProps=>({controller:frame.controller,view:frame.view,features:frame.features,accountId:'personal',request:vi.fn<GamePanelProps['request']>(),textOnly:true})
function identity(p:GamePanelProps){const business=p.features.relay!.businesses[0]!,target=relayBusinessTarget(p,business.id);if(!target)throw Error('REAL_UNIQUE_RELAY_TARGET_REQUIRED');return target}
function periodPin(p:GamePanelProps):OpeningFocus{const target=identity(p),period=p.features.relay!.periods.find(period=>period.businessId===target.businessId)!;return relayFocusFor(p,{...target,kind:'period',periodId:period.id})}
function renderToday(name:string,p:GamePanelProps,pin:OpeningFocus){
 const today=todayThread(p,pin)!,onFocus=vi.fn(),onPrepare=vi.fn(),onNavigate=vi.fn(),onResume=vi.fn(),tree=mounted(name,()=>TodayScene({p,today,headingRef:{current:null},onFocus,onPrepare,onNavigate,onResume,onExplore:()=>{},onRecollection:()=>{}})),all=elements(tree,name),tableau=all.find(e=>typeof e.type==='function'&&e.type.name==='RoomTableau')
 if(!tableau)throw Error('ACTUAL_TODAY_TABLEAU_REQUIRED')
 const main=elements(tableau.props.decisions,name+'/decisions').find(e=>e.type==='div'&&e.props.className==='command moment-decision moment-primary'),button=main&&elements(main,name+'/main').find(e=>e.type==='button'),object=all.find(e=>e.type==='button'&&e.props.className==='opening-object')
 if(!button||!object)throw Error('SAME_ACTION_TODAY_CONTROLS_REQUIRED')
 return {today,all,button,object,onFocus,onPrepare,onNavigate,onResume,text:()=>all.map(e=>text(e.props.children)).join(' ')}
}
function force(node:Element){if(typeof node.props.onClick!=='function')throw Error('REAL_TODAY_HANDLER_REQUIRED');node.props.onClick()}

it('does not invent a service promise from actual115 operation, retained protection or supplier assets after returning to Today',()=>{
 const p=props(),pin=periodPin(p),beforePin=JSON.stringify(pin),business=identity(p),today=todayThread(p,pin)!,relay=p.features.relay!,finance=p.features.workbench.finance.find(a=>a.accountId===business.accountId)!
 expect(p.view.date).toBe('2025-04-09');expect(relay.periods.every(period=>period.status==='closed')).toBe(true);expect(relay.businesses[0]!.lifecycle).toBe('operating')
 expect(relay.customers.some(customer=>customer.balance.prepaidFen>0)).toBe(true);expect(relay.supplyOptions.some(option=>(option.credit?.remainingFen??0)>0)).toBe(true)
 expect(relayFocusOpen(p,relayFocusFor(p,business))).toBe(true);expect(today.ongoing.filter(item=>item.focus.kind==='relay')).toEqual([])
 expect(today.primary.thread.focus).toEqual(pin);expect(today.directions.some(direction=>direction.id==='relay')).toBe(true);expect(today.remaining.some(item=>item.id.startsWith('relay-customer:'))).toBe(true)
 expect(finance.accruedCostFen).toBeGreaterThan(0);expect(today.remaining.find(item=>item.id==='today-relay-accrual:'+business.accountId)?.line).toContain(moneyText(finance.accruedCostFen));expect(today.line).toContain('未出账成本仍在原账')
 expect(today.wait?.date).toBe(playableAdvanceDate(p.features.workbench,p.view.date,p.features.workbench.progression.nextDate!))
 const ui=renderToday('actual115-without-false-service',p,pin)
 expect(text(ui.button)).toContain('给生活留一段真实的日子');expect(ui.text()).not.toContain('继续这期原服务');expect(ui.object.props.onClick).toBe(ui.button.props.onClick)
 expect(JSON.stringify(pin)).toBe(beforePin);expect(p.request).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(source115)
})

it('keeps the actual95 stopped service support and independent audit promises, zero AP and original clock intact',()=>{
 const p=props(stopped),pin=periodPin(p),today=todayThread(p,pin)!,relay=today.ongoing.filter(item=>item.focus.kind==='relay'),period=p.features.relay!.periods[0]!
 expect(p.view.budget.available).toBe(0);expect(period.job!.status).toBe('interrupted');expect(period.supportJob!.status).toBe('planned');expect(p.features.relay!.auditJobs.some(a=>a.job?.status==='planned')).toBe(true)
 expect(relay).toHaveLength(1);expect(relay[0]!.focus).toEqual(pin);expect(relay[0]!.relayContinuation).toMatchObject({kind:'support',label:'继续这期原支持'});expect(relay[0]!.wait?.date).toBe(period.supportJob!.startAt)
 expect(today.remaining.some(item=>item.sourceRefs.some(ref=>ref.kind==='job'&&ref.id===period.supportJobId))).toBe(true)
 const ui=renderToday('actual95-support-is-still-promised',p,pin)
 expect(text(ui.button)).toContain('继续这期原支持');expect(ui.object.props.onClick).toBe(ui.button.props.onClick);force(ui.button);force(ui.object)
 expect(ui.onFocus).toHaveBeenCalledTimes(2);expect(ui.onFocus).toHaveBeenNthCalledWith(1,pin);expect(ui.onFocus).toHaveBeenNthCalledWith(2,pin);expect(p.request).not.toHaveBeenCalled();expect(stopped.controller.exportSaved()).toBe(source95)
})

it('keeps the actual89 planned audit after support completion without adding an extra operating-business service',()=>{
 const p=props(supportDone),pin=periodPin(p),today=todayThread(p,pin)!,period=p.features.relay!.periods[0]!,audit=p.features.relay!.auditJobs.find(a=>a.job?.status==='planned')!,relay=today.ongoing.filter(item=>item.focus.kind==='relay')
 expect(period.supportJob!.status).toBe('completed');expect(p.view.budget).toMatchObject({available:0,reserved:1});expect(relay).toHaveLength(1)
 expect(relay[0]!.relayContinuation).toMatchObject({kind:'audit',label:'继续这份原复核'});expect(relay[0]!.wait?.date).toBe(audit.job!.startAt);expect(relay[0]!.sourceRefs).toContainEqual({kind:'job',id:audit.jobId,date:audit.job!.startAt})
 expect(today.remaining.some(item=>item.sourceRefs.some(ref=>ref.kind==='job'&&ref.id===audit.jobId))).toBe(true)
 expect(supportDone.controller.exportSaved()).toBe(source89)
})

it('uses the real111 future quote job as a quote continuation rather than naming it a new service period',()=>{
 const p=props(quoted),target=identity(p),pin=relayFocusFor(p,target),today=todayThread(p,pin)!,quote=p.features.relay!.quotes.find(q=>q.completedAt===null)!,relay=today.ongoing.filter(item=>item.focus.kind==='relay')
 expect(quote.responses).toEqual([]);expect(quote.job!.status).toBe('planned');expect(relay).toHaveLength(1);expect(relay[0]!.focus).toEqual(pin)
 expect(relay[0]!.sourceRefs).toContainEqual({kind:'job',id:quote.jobId,date:quote.job!.startAt});expect(relay[0]!.wait?.date).toBe('2025-04-01')
 const ui=renderToday('actual111-business-quote-continuation',p,pin)
 expect(text(ui.button)).toContain('继续这份原报价谈判');expect(ui.text()).not.toContain('继续这期原服务');expect(ui.object.props.onClick).toBe(ui.button.props.onClick);force(ui.object);expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(pin)
 expect(p.request).not.toHaveBeenCalled();expect(quoted.controller.exportSaved()).toBe(source111)
})

it('keeps an explicitly public preparation direction separate when no actual new task was arranged',()=>{
 // Lifecycle-only public counterexample, never imported or saved.
 const base=props(),target=identity(base),features={...base.features,relay:{...base.features.relay!,businesses:base.features.relay!.businesses.map(b=>b.id===target.businessId?{...b,lifecycle:'preparing' as const}:b)}},p={...base,features,view:{...base.view,features:features as unknown as PlayingView['features'],operations:{...base.view.operations!,businesses:base.view.operations!.businesses.map(b=>b.id===target.businessId?{...b,lifecycle:'preparing' as const}:b)}}},pin=relayFocusFor(p,target),today=todayThread(p,pin)!
 expect(today.primary.classification).toBe('entry');expect(today.ongoing.filter(item=>item.focus.kind==='relay')).toEqual([]);expect(today.directions.some(direction=>direction.id==='relay')).toBe(true)
 expect(today.remaining.some(item=>item.id.startsWith('relay-customer:'))).toBe(true);expect(p.request).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(source115)
})

it('retains a precisely owned public old payable under its own money caption without disguising it as a new service',()=>{
 // Public original-obligation variant. It is not a new payment or GameRun.
 const base=props(),target=identity(base),h=base.features.relay!.casebook!,source=h.obligationHistory.find(o=>o.scopeBusinessId===target.businessId&&o.accountId===target.accountId)!
 expect(source).toBeDefined()
 const debt={...source,date:'2025-04-10',amountFen:25,remainingFen:25},features={...base.features,relay:{...base.features.relay!,casebook:{...h,obligationHistory:h.obligationHistory.map(o=>o.id===debt.id?debt:o)}},workbench:{...base.features.workbench,finance:base.features.workbench.finance.map(a=>a.accountId===target.accountId?{...a,payableFen:25,obligations:[...a.obligations,debt]}:a)}},p={...base,features,view:{...base.view,features:features as unknown as PlayingView['features'],accounts:base.view.accounts.map(a=>a.accountId===target.accountId?{...a,payableFen:25}:a)}},pin=relayFocusFor(p,target),today=todayThread(p,pin)!
 expect(today.ongoing.filter(item=>item.focus.kind==='relay')).toHaveLength(1);expect(today.ongoing.find(item=>item.focus.kind==='relay')!.relayContinuation).toMatchObject({kind:'money',label:'核对本站原款与旧义务'})
 expect(today.remaining.some(item=>item.id==='obligation:'+debt.id)).toBe(true)
 const ui=renderToday('public-old-payable-caption',p,pin)
 expect(text(ui.button)).toContain('核对本站原款与旧义务');expect(ui.text()).toContain('这些原款，仍要分别核对');expect(ui.text()).toContain(moneyText(25));expect(ui.text()).not.toContain('继续这期原服务')
 expect(p.request).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(source115)
})

it('preserves unknown original finance and invalid pin identities instead of declaring the old responsibilities empty',()=>{
 const base=props(),target=identity(base),features={...base.features,workbench:{...base.features.workbench,finance:base.features.workbench.finance.filter(a=>a.accountId!==target.accountId)}},p={...base,features,view:{...base.view,features:features as unknown as PlayingView['features']}},pin=relayFocusFor(p,target),today=todayThread(p,pin)!
 expect(today.ongoing.find(item=>item.focus.kind==='relay')!.relayContinuation).toMatchObject({kind:'unknown',label:'先核对本站原责任的来源'});expect(today.ongoing.find(item=>item.focus.kind==='relay')!.line).toContain('不能把未知写成旧责任已经清除')
 const ui=renderToday('public-unknown-finance',p,pin);expect(text(ui.button)).toContain('先核对本站原责任的来源');expect(ui.text()).not.toContain('继续这期原服务')
 const invalid:OpeningFocus={...pin,runId:'another-original-life'},bad=todayThread(base,invalid)!
 expect(bad.primary.classification).toBe('invalid');expect(bad.primary.thread.focus).toEqual(invalid);expect(p.request).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(source115)
})

it('keeps Today continuation as a readonly UI choice and blocks the same control during a candidate without altering the stored pin or clock',()=>{
 const base=props(quoted),pin=relayFocusFor(base,identity(base)),raw=quoted.controller.exportSaved()
 for(const patch of [{readOnly:true,saveStatus:'read_only' as const},{hasCandidate:true}]){
  const view={...base.view,...patch},controller=new Proxy(base.controller,{get(target,key){if(key==='snapshot')return {...target.snapshot,view};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}}),p={...base,view,controller,request:vi.fn<GamePanelProps['request']>()},ui=renderToday('protected-today-'+JSON.stringify(patch),p,pin)
  expect(ui.object.props.onClick).toBe(ui.button.props.onClick);expect(ui.button.props.disabled).toBe('hasCandidate' in patch)
  force(ui.button);expect(ui.onFocus).toHaveBeenCalledTimes('hasCandidate' in patch?0:1);expect(ui.today.primary.thread.focus).toEqual(pin);expect(p.request).not.toHaveBeenCalled()
 }
 expect(quoted.controller.exportSaved()).toBe(raw)
})
