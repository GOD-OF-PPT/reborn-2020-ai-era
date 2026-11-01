import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread} from './player-thread.ts'
import {relayBusinessTarget,relayFocusFor} from './relay-player-thread.ts'
import {relayClosedPeriodTarget} from './relay-journey.ts'
import {RelayEncounter} from './RelayEncounter.tsx'
import {RelayThreadAction} from './RelayThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {renderToStaticMarkup} from 'react-dom/server'
import actual115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-22-new115-quote-actually-effective-no-cash-ap-change.json?raw'
import actualStopped95 from '../../goal-1/evidence/t17-acceptance-37/chrome-service-stop-r6/s05-saved95-zeroap-stopped-period-original-support-retained.json?raw'

type Element=ReactElement<Record<string,unknown>>
const elements=(node:unknown):Element[]=>Array.isArray(node)?node.flatMap(elements):isValidElement<Record<string,unknown>>(node)?[node,...elements(node.props.children)]:[]
const text=(node:unknown):string=>typeof node==='string'||typeof node==='number'?String(node):Array.isArray(node)?node.map(text).join(''):isValidElement<Record<string,unknown>>(node)?text(node.props.children):''
let controller:GameController,store:IndexedDbRunStore,p:GamePanelProps,target:ReturnType<typeof relayBusinessTarget>,raw:string
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'closure-actual115'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(actual115)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay!.businesses[0]!
 p={view,features,controller,accountId:business.accountId,request:vi.fn()};target=relayBusinessTarget(p,business.id);raw=controller.exportSaved()
},20000)
afterAll(async()=>{await controller?.close();await store?.close()})
function closedTarget(){return {...target!,kind:'period' as const,periodId:p.features.relay!.periods[0]!.id}}
function encounter(input=p){const selected=closedTarget(),focus=relayFocusFor(input,selected),thread=playerThread(input,focus),today=vi.fn(),choose=vi.fn(),node=RelayEncounter({p:input,thread,target:selected,date:null,waitLabel:'',onToday:today,onChoose:choose});const tree=RelayThreadAction(node.props),rows=elements(tree),paper=rows.find(e=>e.type===OpeningObject),button=rows.find(e=>e.type==='button'&&text(e).includes('合上这一期，回到今天'));return {tree,rows,paper,button,today,choose}}

it('closes this actual finished reading directly through the same thought and foreground action without another command',()=>{
 const ui=encounter(),paper=ui.paper!.props as ComponentProps<typeof OpeningObject>
 expect(ui.button).toBeDefined();expect(ui.button!.props.onClick).toBe(paper.onActivate);expect(paper.actionLabel).toBe('合上这一期，回到今天')
 expect(ui.button!.props.disabled).toBe(false);(ui.button!.props.onClick as ()=>void)();paper.onActivate()
 expect(ui.today).toHaveBeenCalledTimes(2);expect(ui.choose).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
 const next=ui.rows.find(e=>e.type==='button'&&text(e)==='看看下一期需要哪些条件')!;(next.props.onClick as ()=>void)();expect(ui.choose).toHaveBeenCalledWith('next-service');expect(controller.exportSaved()).toBe(raw)
})

it('keeps one explicit old-record link and puts the actual next choice on the finished room rather than another next-summary menu',()=>{
 const focus=relayFocusFor(p,closedTarget()),html=renderToStaticMarkup(<OpeningMoment p={p} headingRef={null} fallback={roomMoment(p)} focus={focus} onFocus={()=>{}} focusQuarter="2025-Q1" feedback="已从本机存档继续。" onNavigate={()=>{}} onExplore={()=>{}}/>)
 expect(html).toContain('合上这一期，回到今天');expect(html).toContain('看看下一期需要哪些条件');expect(html.match(/>翻原票与回执/g)).toHaveLength(1)
 expect(html).not.toContain('看看本期还留下什么，再决定下一步');expect(html).not.toContain('正在回看2025-Q1，今天仍是')
 expect(html).toContain('2025-Q1');expect(html).toContain('本账户客户未消费保护');expect(html).toContain('供应资产')
 expect(html).toContain('已从本机存档继续。');expect(html.indexOf('已从本机存档继续。')).toBeGreaterThan(html.indexOf('翻原票与回执'))
 expect(controller.exportSaved()).toBe(raw);expect(p.request).not.toHaveBeenCalled()
})

it('allows stable readonly navigation but blocks an unsaved candidate, conflict, busy or stale binding from changing the scene',()=>{
 const frame=(view:GamePanelProps['view'],snapshotView=view):GamePanelProps=>({...p,view,controller:new Proxy(controller,{get(object,key){if(key==='snapshot')return {...object.snapshot,view:snapshotView,busy:view.busy};const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value}})})
 const read=encounter(frame({...p.view,readOnly:true,saveStatus:'read_only'}));expect(read.button!.props.disabled).toBe(false);(read.button!.props.onClick as ()=>void)();expect(read.today).toHaveBeenCalledOnce()
 for(const [view,snapshot] of [
  [{...p.view,hasCandidate:true,saveStatus:'unsaved' as const},undefined],
  [{...p.view,saveStatus:'conflict' as const},undefined],
  [{...p.view,busy:true},undefined],
  [p.view,{...p.view}],
 ] as const){const ui=encounter(frame(view,snapshot??view));expect(ui.button!.props.disabled).toBe(true);(ui.button!.props.onClick as ()=>void)();(ui.paper!.props.onActivate as ()=>void)();expect(ui.today).not.toHaveBeenCalled();expect(ui.choose).not.toHaveBeenCalled()}
 expect(controller.exportSaved()).toBe(raw);expect(p.request).not.toHaveBeenCalled()
})

it('does not turn a wrong owner, missing period or specific old task into the finished-period exit',()=>{
 const selected=closedTarget(),base=relayClosedPeriodTarget(p,selected);expect(base).toEqual(target)
 for(const invalid of [{...selected,runId:'other-life'},{...selected,accountId:'personal'},{...selected,stationId:'missing-station'},{...selected,periodId:'missing-period'},{...selected,jobId:p.features.relay!.periods[0]!.jobId},{...selected,meterId:p.features.relay!.meters[0]!.id}])expect(relayClosedPeriodTarget(p,invalid)).toBeNull()
 // A copied public status is only a display-policy counterexample, never a saved history.
 const period=p.features.relay!.periods[0]!,ongoing={...p,features:{...p.features,relay:{...p.features.relay!,periods:p.features.relay!.periods.map(row=>row.id===period.id?{...row,status:'settling' as const}:row)}}}
 expect(relayClosedPeriodTarget(ongoing,selected)).toBeNull();expect(controller.exportSaved()).toBe(raw)
})

it('offers the original remaining wait directly after requests stop, without treating waiting as free support or reopening a next-summary menu',async()=>{
 const codec=createCampaignCodec(),otherStore=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'closure-stopped95'}),other=new GameController({codec,store:otherStore,locks:new MemoryWriterAccess()})
 try{
  await other.initialize();await other.importNew(actualStopped95);const view=other.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay!.businesses[0]!,base=relayBusinessTarget({view,features},business.id)!,selected={...base,kind:'period' as const,periodId:features.relay!.periods[0]!.id},input:GamePanelProps={view,features,controller:other,accountId:base.accountId,request:vi.fn()},thread=playerThread(input,relayFocusFor(input,selected)),today=vi.fn(),choose=vi.fn()
  expect(thread.wait).toBeDefined();expect(features.relay!.periods[0]!.stoppedAt).not.toBeNull();expect(view.budget.available).toBe(0)
  const node=RelayThreadAction({p:input,thread,target:selected,active:true,date:thread.wait!.date,waitLabel:thread.wait!.label,onToday:today,onChoose:choose,children:()=>null})
  expect(isValidElement(node)&&node.type).toBe(ClockAdvance)
  if(!isValidElement<ComponentProps<typeof ClockAdvance>>(node))throw Error('ORIGINAL_CLOCK_REQUIRED')
  expect(node.props.p).toBe(input);expect(node.props.date).toBe(thread.wait!.date);expect(node.props.label).toContain(thread.wait!.label)
  expect(choose).not.toHaveBeenCalled();expect(today).not.toHaveBeenCalled();expect(input.request).not.toHaveBeenCalled();expect(other.exportSaved()).toBe(actualStopped95)
 }finally{await other.close();await otherStore.close()}
})
