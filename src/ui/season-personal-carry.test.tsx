import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {seasonRecollection} from './season-thread.ts'
import {seasonTurnReading} from './season-turn.ts'
import {seasonPersonalCarry} from './season-personal-carry.ts'
import {SeasonRecollection} from './SeasonRecollection.tsx'
import {SeasonTurnSummary} from './SeasonTurnSummary.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {todayThread} from './today-thread.ts'
import {todayChoiceBoard} from './today-choice-board.ts'

// Normal in-memory gameplay and public UI callbacks only; no stores or codecs.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const rows=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,rows);const i=hooks.index++;if(!(i in rows))rows[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [rows[i] as T,(next:T|((old:T)=>T))=>{rows[i]=typeof next==='function'?(next as (old:T)=>T)(rows[i] as T):next}] as const};return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useMemo:<T,>(factory:()=>T)=>factory()}})
afterEach(()=>{hooks.slots.clear();hooks.scope='';hooks.index=0})
const scoped=<T,>(key:string,fn:()=>T)=>{hooks.scope=key;hooks.index=0;return fn()}
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'season-carry-ui',actorId:'player',commandId:'create',seed:'season-carry-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'turn-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
function props(run:GameRun):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function until(run:GameRun,date:string){for(let n=0;n<25;n++){const w=props(run).features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.actionPoints||c.costFen)throw Error('ORIGINAL_FREE_REPLY_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date&&(date!=='2020-03-31'||w.atQuarterEnd))return run;run=act(run,'AdvanceTime',{date})}throw Error('ORIGINAL_TIME_BOUND')}
const skipped=act(initial,'SkipOffer',{offerId:props(initial).features.firstOrder.offerId})
const workspace=act(skipped,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),late=until(workspace,'2020-03-27'),rest=act(late,'StartLifeWork',{kind:'rest',personId:null,reference:null}),running=act(rest,'ResearchMarket',{definitionId:'market-foundation-course'}),end=until(running,'2020-03-31'),next=until(end,'2020-04-01')
function driver(p=props(end)) {const onClose=vi.fn(),onToday=vi.fn(),onNavigate=vi.fn();return {p,onClose,onToday,onNavigate,draw:(current=p)=>scoped('leaf',()=>SeasonRecollection({p:current,onClose,onToday,onNavigate}))}}


it('closes a normal quarter with two original personal arrangements, keeping actual costs and expected dates separate from completion',()=>{
 const p=props(end),season=seasonRecollection(p)!,turn=seasonTurnReading(p,season)!,before=JSON.stringify(p.view)
 expect(p.view.date).toBe('2020-03-31');expect(season.closed).toBe(true);expect(turn.situation).toContain('1段生活安排实际完成');expect(turn.nextDate).toBe('2020-04-01');expect(turn.pending).toHaveLength(2);expect(turn.carry).toHaveLength(2)
 const life=turn.carry!.find(c=>c.focus.kind==='life')!,research=turn.carry!.find(c=>c.focus.kind==='market')!;expect(life).toMatchObject({label:'自己的休整',stage:'进行中',from:'2020-03-27',through:'2020-04-03',quarter:'2020-Q1',lines:['已付¥0 / 已用1点']});expect(research).toMatchObject({label:'规则研习',stage:'研习中',from:'2020-03-27',through:'2020-04-03',quarter:'2020-Q1'});expect(research.lines.join('')).not.toContain('已付');expect(p.view.budget.available).toBe(1)
 const html=renderToStaticMarkup(<SeasonTurnSummary value={turn}/>);expect(html).toContain('带到下一季');expect(html).toContain('尚未完成 · 原投入保留');expect(html).toContain('不揭示未来价格');expect(html).not.toContain('已取得');expect(html).not.toContain('这次安排从');expect(JSON.stringify(p.view)).toBe(before);expect(p.request).not.toHaveBeenCalled()
})
it('reaches the same original objects in Q2, retaining Q1 origins and completing only on the actual dates',()=>{
 const p=props(next),turn=seasonTurnReading(props(end),seasonRecollection(props(end))!)!,old=turn.carry!.find(c=>c.focus.kind==='life')!,today=todayThread(p,old.focus)!,board=todayChoiceBoard(p,today)!
 expect(p.view.date).toBe('2020-04-01');expect(p.features.workbench.quarter).toBe('2020-Q2');expect(p.view.budget.available).toBe(4);expect(p.view.operations!.employment).toHaveLength(0);expect(board.items).toHaveLength(2)
 for(const card of board.items){expect(card.originQuarter).toBe('2020-Q1');expect(card.date).toBe('2020-04-03');expect(turn.carry!.some(o=>o.focus.entityId===card.focus.entityId&&o.from==='2020-03-27')).toBe(true)}
 const done=props(until(next,'2020-04-03'));expect(done.features.life.jobs.find(j=>j.id===old.focus.entityId)?.status).toBe('completed');expect(done.features.market.researches[0]!.status).toBe('completed');expect(done.view.budget.available).toBe(4);expect(done.view.accounts.find(a=>a.accountId==='personal')!.availableFen).toBe(p.view.accounts.find(a=>a.accountId==='personal')!.availableFen)
 expect(todayChoiceBoard(done,todayThread(done,old.focus)!)).toBeNull();expect(seasonTurnReading(p,seasonRecollection(p,'2020-Q1'))).toBeNull();expect(p.request).not.toHaveBeenCalled()
})
it('preserves the real work wage result alongside two cross-quarter personal tasks without renewing employment',()=>{
 const work=act(skipped,'WorkQuarter'),before=until(work,'2020-03-27'),life=act(before,'StartLifeWork',{kind:'rest',personId:null,reference:null}),study=act(life,'ResearchMarket',{definitionId:'market-foundation-course'}),closed=props(until(study,'2020-03-31')),turn=seasonTurnReading(closed,seasonRecollection(closed))!
 expect(turn.carry).toHaveLength(2);expect(turn.situation).toContain('实际工资¥24,000');expect(closed.view.budget.available).toBe(0);const q2=props(until(until(study,'2020-03-31'),'2020-04-01'));expect(q2.view.operations!.employment.filter(e=>e.quarter==='2020-Q2')).toHaveLength(0)
})
it('keeps parent promise identity and its real child cost/completion plus original deadline',()=>{
 let run=until(skipped,'2020-03-27');run=act(run,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});run=until(run,'2020-03-30');const promise=props(run).features.life.promises[0]!;run=act(run,'AcceptLifePromise',{promiseId:promise.id,consent:true});run=act(run,'FulfillLifePromise',{promiseId:promise.id});run=act(run,'ResearchMarket',{definitionId:'market-foundation-course'});const p=props(until(run,'2020-03-31')),turn=seasonTurnReading(p,seasonRecollection(p))!,card=turn.carry!.find(c=>c.focus.kind==='life')!,job=p.features.life.jobs.find(j=>j.promiseId===promise.id)!
 expect(card.focus.entityId).toBe(promise.id);expect(card.label).toBe('答应唐萤的事');expect(card.lines).toEqual(['已付¥300 / 已用1点','原约定最晚'+promise.deadline]);expect(card.through).toBe(job.completeAt);expect(card.stage).toBe('兑现中');expect(card.focus.entityId).not.toBe(job.id)
})
it('keeps every original full record accessible and the original single quarter Clock with no duplicate request',()=>{
 const ui=driver(),short=ui.draw();expect(short.props.layout).toBe('direct');expect(nodes(short).filter(n=>n.type===ClockAdvance)).toHaveLength(1);expect(nodes(short).find(n=>n.type===SeasonTurnSummary)?.props.value).toEqual(seasonTurnReading(ui.p,seasonRecollection(ui.p)))
 const open=nodes(short).find(n=>n.type==='button'&&words(n.props.children)==='翻阅全部回响、旧约与原账 ↗')!;(open.props.onClick as ()=>void)();const full=ui.draw(),all=words(full.props.children);expect(full.props.layout).toBeUndefined();for(const item of seasonRecollection(ui.p)!.remaining)expect(all).toContain(item.line)
 const back=nodes(full).find(n=>n.type==='button'&&words(n.props.children)==='回到季末交接')!;(back.props.onClick as ()=>void)();expect(ui.draw().props.layout).toBe('direct');expect(ui.p.request).not.toHaveBeenCalled();expect(ui.p.requestWait).not.toHaveBeenCalled()
})
it('refuses missing, duplicate, modified or extra unknown/money duties instead of hiding them in personal papers',()=>{
 const p=props(end),season=seasonRecollection(p)!,item=season.remaining[0]!
 for(const remaining of [season.remaining.slice(1),[...season.remaining,item],season.remaining.map((i,n)=>n?i:{...i,line:i.line+'另有旧款'}),season.remaining.map((i,n)=>n?i:{...i,dueAt:'2020-04-02'}),[...season.remaining,{...item,id:'unknown',continuation:'unknown' as const}],[...season.remaining,{...item,id:'money',continuation:'money' as const}],[...season.remaining,{...item,id:'strong',urgent:true}]]){
  const value={...season,remaining};expect(seasonPersonalCarry(p,value,remaining)).toBeNull();expect(seasonTurnReading(p,value)).toBeNull()
 }
 const malformed={...p,features:{...p.features,life:{...p.features.life,jobs:p.features.life.jobs.map(j=>j.status==='running'?{...j,costFen:-1}:j)}}};expect(seasonTurnReading(malformed,seasonRecollection(malformed))).toBeNull()
 const stale={...season,asOf:'2020-03-30'};expect(seasonTurnReading(p,stale)).toBeNull();expect(seasonTurnReading(p,{...season,closeSourceId:'wrong'})).toBeNull();expect(seasonTurnReading(props(next),seasonRecollection(props(next),'2020-Q1'))).toBeNull()
})

it('keeps three legal running personal originals on one handoff without dropping any item',()=>{
 const all=act(running,'ResearchMarket',{definitionId:'simulation-special-study'}),p=props(until(all,'2020-03-31')),season=seasonRecollection(p)!,turn=seasonTurnReading(p,season)!
 expect(turn.carry).toHaveLength(3);expect(turn.pending).toHaveLength(3);expect(p.view.budget.available).toBe(0);expect(turn.carry!.map(i=>i.label).sort()).toEqual(['自己的休整','规则研习','试验研习'].sort());for(const card of turn.carry!)expect(season.remaining.some(i=>i.id===card.id&&i.focus?.entityId===card.focus.entityId)).toBe(true)
 const html=renderToStaticMarkup(<SeasonTurnSummary value={turn}/>);for(const card of turn.carry!)expect(html).toContain(card.label)
})
it('does not name unknown research definitions, stale life dates or altered original source references',()=>{
 const p=props(end),season=seasonRecollection(p)!,unknown={...p,features:{...p.features,market:{...p.features.market,researches:p.features.market.researches.map(r=>({...r,definitionId:'unknown-original-definition'}))}}},stale={...p,features:{...p.features,life:{...p.features.life,asOf:'2020-03-30'}}}
 expect(seasonTurnReading(unknown,seasonRecollection(unknown))).toBeNull();expect(seasonTurnReading(stale,seasonRecollection(stale))).toBeNull();expect(seasonTurnReading(p,{...season,remaining:season.remaining.map((item,index)=>index?item:{...item,sourceRefs:[]})})).toBeNull()
})
