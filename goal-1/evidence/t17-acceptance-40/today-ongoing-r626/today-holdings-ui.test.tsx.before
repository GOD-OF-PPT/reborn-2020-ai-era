import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {openingFocusFor} from './player-thread.ts'
import {todayThread,todayReadingGroups} from './today-thread.ts'
import {TodayScene} from './TodayScene.tsx'
import {TodayHoldings} from './TodayHoldings.tsx'
import {Dialog} from './Dialog.tsx'

// Normal in-memory gameplay projections plus a local React callback driver.
// No controller submission, storage, codec, import/export or reload checks.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useImperativeHandle:()=>{},useCallback:<T,>(callback:T)=>callback,useMemo:<T,>(factory:()=>T)=>factory(),useId:()=> 'today-held-ui'}
})
function mounted<T>(key:string,fn:()=>T):T{const previous=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return fn()}finally{hooks.current=previous;hooks.index=index}}
afterEach(()=>hooks.slots.clear())
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown,path='root'):Element[]{
 if(Array.isArray(value))return value.flatMap((child,index)=>elements(child,path+'/'+index))
 if(!isValidElement<Record<string,unknown>>(value))return []
 if(typeof value.type==='function'&&['VideoSceneChoice','CourseSceneChoice','MarketSceneChoice'].includes(value.type.name)&&typeof value.props.children==='function')return elements(value.props.children(()=>{}),path+'/drawer')
 const own=[value,...elements(value.props.children,path+'/children')]
 if(typeof value.type==='function'&&value.type.name==='RoomTableau')for(const key of ['heading','facts','decisions','record','object'])own.push(...elements(value.props[key],path+'/'+key))
 if(typeof value.type==='function'&&['OpeningObject','ClockAdvance','CommandButton','TodayHoldings','TodayLifeChoices'].includes(value.type.name)){const fn=value.type as (props:Record<string,unknown>)=>unknown;own.push(...elements(mounted(path,()=>fn(value.props)),path+'/render'))}
 return own
}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'today-held-ui',actorId:'player',commandId:'create',seed:'today-held-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'investment'}})
const features=(run:GameRun)=>registry.runtime!.project!(run) as unknown as PlayFeatures
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'held-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(result));return result.nextRun}
function until(run:GameRun,date:string,ready:(run:GameRun)=>boolean=()=>true){for(let n=0;n<30;n++){const f=features(run);if(f.workbench.pause){const event=f.workbench.events.find(row=>row.isBlocking)!,choice=event.choices.find(row=>row.isDefault)!;run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}if(run.timeline.cursor.date>=date&&ready(run))return run;run=act(run,'AdvanceTime',{date})}throw Error('NORMAL_CALENDAR_LIMIT')}
function orderPayload(run:GameRun,side:'buy'|'sell'='buy'){const market=features(run).market,stock=market.stocks.find(row=>row.symbol==='SIM-AI02')!;return {accountId:'personal',symbol:stock.symbol,side,quantity:600,limitPriceFen:side==='buy'?stock.upperFen!:stock.lowerFen!,quoteId:market.quoteId!,validUntil:market.matchingCalendar[2]!.id}}
const pending=act(initial,'PlaceStockOrder',orderPayload(initial)),orderId=features(pending).market.orders[0]!.id
const partial=until(pending,'2020-01-10',run=>features(run).market.orders[0]!.status==='partially_filled')
const filled=until(partial,'2020-01-20',run=>features(run).market.orders[0]!.status==='filled')
const working=act(filled,'WorkQuarter'),resting=act(filled,'StartLifeWork',{kind:'rest',personId:null,reference:null})
const sellable=until(filled,'2020-01-21'),selling=act(sellable,'PlaceStockOrder',orderPayload(sellable,'sell')),saleId=features(selling).market.orders.at(-1)!.id
const sold=until(selling,'2020-01-31',run=>features(run).market.orders.at(-1)!.status==='filled')
const paid=until(sold,'2020-02-01',run=>features(run).market.settlements.some(row=>row.paidAt!==null))
function context(run=filled,id=orderId){
 const projected=registry.runtime!.project!(run),f=projected as unknown as PlayFeatures,view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const request=vi.fn(),requestWait=vi.fn(),controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
 const p:GamePanelProps={view,features:f,controller,request,requestWait,accountId:'personal'},focus=openingFocusFor(p,'market',{accountId:'personal',recordId:id})!
 return {p,focus,today:todayThread(p,focus)!}
}
function driver(run=filled,id=orderId){
 const {p,focus,today}=context(run,id),onFocus=vi.fn(),onPrepare=vi.fn(),onResume=vi.fn(),onNavigate=vi.fn()
 const render=()=>elements(mounted('scene',()=>TodayScene({p,today,headingRef:null,onFocus,onPrepare,onResume,onNavigate,onExplore:vi.fn(),onRecollection:vi.fn()})))
 const tableau=()=>render().find(row=>typeof row.type==='function'&&row.type.name==='RoomTableau')!
 const click=(label:string)=>{const node=render().find(row=>row.type==='button'&&(words(row.props.children)===label||row.props['aria-label']===label));if(!node||typeof node.props.onClick!=='function')throw Error('VISIBLE_BUTTON_REQUIRED: '+label);node.props.onClick()}
 return {p,focus,today,onFocus,onPrepare,onResume,onNavigate,render,tableau,click}
}

it('keeps a completed purchase readable without calling the retained position another promise',()=>{
 const ui=driver(),before=JSON.stringify(ui.today.ongoing),groups=todayReadingGroups(ui.today.ongoing)
 expect(groups.continuing).toHaveLength(0);expect(groups.holdings).toHaveLength(1)
 expect(ui.today.line).toBe('原持仓仍保留，今天的安排由你选择。')
 expect(words(ui.tableau().props.heading)).toContain('持仓留着，今天想怎么过？')
 expect(words(ui.tableau().props.facts)).toContain('持仓留在原账上')
 expect(words(ui.tableau().props.facts)).not.toContain('已经答应的事')
 expect(JSON.stringify(ui.today.ongoing)).toBe(before)
 expect(ui.render().some(row=>row.props['aria-label']==='工作，还是留点时间给自己？')).toBe(true)
 expect(ui.p.request).not.toHaveBeenCalled()
})

it('counts the unfilled remainder once and keeps the existing shares in the holdings group',()=>{
 const ui=driver(partial),groups=todayReadingGroups(ui.today.ongoing)
 expect(groups.continuing).toHaveLength(1);expect(groups.holdings).toHaveLength(1)
 expect(groups.continuing[0]!.focus.entityId).toBe(orderId)
 expect(groups.continuing[0]!.wait?.date).toBe('2020-01-20')
 expect(words(ui.tableau().props.facts)).not.toContain('2件已经答应的事')
 ui.click('回到这份模拟委托');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(groups.continuing[0]!.focus)
 expect(ui.p.request).not.toHaveBeenCalled()
})

it('keeps parallel work ahead of a new life suggestion while leaving holdings visible',()=>{
 const ui=driver(working),groups=todayReadingGroups(ui.today.ongoing)
 expect(groups.continuing).toHaveLength(1);expect(groups.continuing[0]!.focus.kind).toBe('work')
 expect(groups.holdings).toHaveLength(1)
 expect(words(ui.tableau().props.facts)).toContain('还有1件已经答应的事')
 ui.click('继续这季的工作');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(groups.continuing[0]!.focus)
})

it('opens retained shares separately, preserves their full facts and returns to the same position',()=>{
 const ui=driver(),held=todayReadingGroups(ui.today.ongoing).holdings[0]!,position=ui.p.features.market.positions[0]!
 ui.click('翻看保留的持仓 · 1份 ↗')
 const dialog=ui.render().find(row=>row.type===Dialog)!,content=ui.render().map(row=>words(row.props.children)).join(' ')
 expect(dialog.props.layout).toBe('direct')
 expect(content).toContain('保留的持仓');expect(content).toContain('股份留在原账户，也可以照常安排生活')
 expect(content).toContain(held.line);expect(content).toContain('持有600股')
 expect(content).not.toContain('仍在继续的事')
 ui.click('查看这份持仓');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(held.focus)
 expect(held.focus.entityId).toBe(position.id);expect(ui.onPrepare).not.toHaveBeenCalled();expect(ui.p.request).not.toHaveBeenCalled()
})

it('opens life choices without making a new promise, then uses the original rest confirmation',()=>{
 const ui=driver()
 ui.click('工作，还是留点时间给自己？')
 const dialog=ui.render().find(row=>row.type===Dialog)!
 expect(dialog.props.title).toBe('今天，怎样安排这段日子？');expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onFocus).not.toHaveBeenCalled()
 ui.click('核对并留出七天休整')
 expect(ui.p.request).toHaveBeenCalledExactlyOnceWith('StartLifeWork',{kind:'rest',personId:null,reference:null},'核对并留出七天休整',true)
})

it('keeps an actual personal activity ahead of retained shares',()=>{
 const ui=driver(resting),groups=todayReadingGroups(ui.today.ongoing)
 expect(groups.continuing[0]!.focus.kind).toBe('life');expect(groups.holdings).toHaveLength(1)
 ui.click('继续这段生活安排');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(groups.continuing[0]!.focus)
})

it('names unpaid original sale proceeds as money, not another new commitment or freely spendable cash',()=>{
 const ui=driver(sold,saleId),groups=todayReadingGroups(ui.today.ongoing)
 expect(groups.continuing).toHaveLength(1);expect(groups.holdings).toHaveLength(0)
 expect(groups.continuing[0]!.marketContinuation).toEqual({kind:'money',label:'核对这份委托的原交收'})
 expect(words(ui.tableau().props.heading)).toContain('这些原款，仍要分别核对')
 expect(words(ui.tableau().props.facts)).toContain('眼下仍不可花')
 ui.click('核对这份委托的原交收');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(groups.continuing[0]!.focus)
 const after=context(paid,saleId);expect(todayReadingGroups(after.today.ongoing).continuing).toHaveLength(0)
})

it('retains the research identity and names the actual next action',()=>{
 const run=act(filled,'ResearchMarket',{definitionId:'market-overview'}),ui=driver(run),groups=todayReadingGroups(ui.today.ongoing)
 expect(groups.continuing).toHaveLength(1);expect(groups.continuing[0]!.focus).toMatchObject({kind:'market',entityKind:'research'})
 ui.click('继续这份公开研究');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(groups.continuing[0]!.focus)
})

it('browses full retained positions one at a time and chooses only the explicitly opened identity',()=>{
 const first=todayReadingGroups(context().today.ongoing).holdings[0]!,second={...first,focus:{...first.focus,entityId:'ui-second-position'},line:'第二份公开持仓的完整说明。'},onChoose=vi.fn()
 // Isolated reading-list counterexample, not a fabricated financial run.
 const render=()=>elements(mounted('held-reader',()=>TodayHoldings({items:[first,second],onChoose})))
 const click=(label:string)=>{const node=render().find(row=>row.type==='button'&&words(row.props.children)===label)!;(node.props.onClick as ()=>void)()}
 expect(render().map(row=>words(row.props.children)).join(' ')).toContain(first.line)
 click('下一份 →');expect(onChoose).not.toHaveBeenCalled()
 expect(render().map(row=>words(row.props.children)).join(' ')).toContain(second.line)
 click('查看这份持仓');expect(onChoose).toHaveBeenCalledExactlyOnceWith(second.focus)
})

it('keeps the selected position through reordering and asks for an explicit choice if it disappears',()=>{
 const first=todayReadingGroups(context().today.ongoing).holdings[0]!,second={...first,focus:{...first.focus,entityId:'ui-second-position'},line:'第二份公开持仓的完整说明。'},onChoose=vi.fn()
 let items=[first,second]
 const render=()=>elements(mounted('held-reader',()=>TodayHoldings({items,onChoose})))
 render();items=[second,first]
 expect(render().map(row=>words(row.props.children)).join(' ')).toContain(first.line)
 items=[second]
 expect(render().map(row=>words(row.props.children)).join(' ')).toContain('刚才的持仓已变化，请明确重新选择')
 expect(render().some(row=>row.type==='button'&&words(row.props.children)==='查看这份持仓')).toBe(false)
 expect(onChoose).not.toHaveBeenCalled()
})
