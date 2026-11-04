import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {workWaitReading,type WorkWaitReading} from './work-wait-reading.ts'
import {WorkWaitCue} from './WorkWaitCue.tsx'
import {Dialog} from './Dialog.tsx'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'

// Normal in-memory proposals, public facts and original reading actions only.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'work-history-ui',actorId:'player',commandId:'create',seed:'work-history-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'history-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run:GameRun){const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};const p:GamePanelProps={view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']};const focus:OpeningFocus={runId:run.runId,kind:'work',accountId:'personal',entityId:view.operations?.employment[0]?.id??null};return {p,focus,thread:playerThread(p,focus)}}
function until(run:GameRun,date:string){for(let n=0;n<30;n++){const w=context(run).p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.costFen||c.actionPoints)throw Error('EXPECTED_FREE_ORIGINAL_REPLY');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const work=act(act(initial,'SkipOffer',{offerId:context(initial).p.features.firstOrder.offerId}),'WorkQuarter'),april=until(work,'2020-04-01')


const hooks=vi.hoisted(()=>({slots:[] as unknown[],index:0}))
const captured=vi.hoisted(()=>({room:null as Record<string,unknown>|null}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.slots))hooks.slots[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.slots[i] as T,(next:T|((old:T)=>T))=>{hooks.slots[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.slots[i] as T):next}] as const},useEffect:()=>{}}})
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{captured.room=p as unknown as Record<string,unknown>;return <actual.RoomTableau {...p}/>}}})
afterEach(()=>{hooks.slots=[];hooks.index=0;captured.room=null})
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer)]:[]
const words=(n:unknown):string=>typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
const resting=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),parallel=act(resting,'ResearchMarket',{definitionId:'market-overview'})
function read(run=parallel){const c=context(run);return {...c,value:workWaitReading(c.p,c.thread)}}

it('orders the actual public research, rest and wage dates without changing the original clock',()=>{
 const {p,focus,thread,value:v}=read();expect(p.view.budget.available).toBe(0)
 expect(v?.items.map(row=>[row.label,row.date])).toEqual([['公开资料','2020-01-02'],['休整','2020-01-08'],['工资回响','2020-01-31']]);expect(thread.wait?.date).toBe('2020-01-31')
 const html=renderToStaticMarkup(<OpeningMoment p={p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 expect(nodes(captured.room!.context).some(n=>n.type===WorkWaitCue)).toBe(true);expect(html).toContain('预计 2020-01-02');expect(html).toContain('预计 2020-01-08');expect(html).toContain('预计 2020-01-31')
 expect(html).toContain('核对后推进 · 2020-01-08');expect(html.match(/class="clock-advance clock-advance-room"/g)).toHaveLength(1);expect(p.requestWait).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
})

it('removes only actually completed activities as the same run reaches their real dates',()=>{
 const jan2=until(parallel,'2020-01-02'),first=read(jan2)
 expect(first.p.features.market.researches[0]!.status).toBe('completed');expect(first.value?.items.map(row=>row.label)).toEqual(['休整','工资回响'])
 const jan8=until(jan2,'2020-01-08'),last=read(jan8);expect(last.p.features.life.jobs.find(j=>j.kind==='rest')!.status).toBe('completed');expect(last.value).toBeNull()
 const history=context(april);expect(workWaitReading(history.p,history.thread)).toBeNull()
})

it('keeps simultaneous original dates separate and does not invent an order within the day',()=>{
 const c=read(act(resting,'ResearchMarket',{definitionId:'market-foundation-course'}))
 expect(c.value?.items.filter(row=>row.date==='2020-01-08').map(row=>row.label).sort()).toEqual(['休整','规则研习'])
 expect(c.value?.items).toHaveLength(3)
})

it('preserves exact original targets when each date is inspected and never advances time',()=>{
 const {p,value:v}=read(),navigate=vi.fn(),tree=WorkWaitCue({p,value:v!,onNavigate:navigate}),buttons=nodes(tree).filter(n=>n.type==='button'&&n.props.className==='work-wait-note')
 for(const [i,button] of buttons.entries()){(button.props.onClick as ()=>void)();expect(navigate).toHaveBeenNthCalledWith(i+1,v!.items[i]!.screen,v!.items[i]!.target)}
 expect(v!.items[0]!.target.recordId).toBe(p.features.market.researches[0]!.id)
 expect(v!.items[1]!.target).toMatchObject({accountId:'personal',recordId:p.features.life.jobs[0]!.id,lifeSelection:'rest'})
 expect(p.requestWait).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
})

it('returns to the original stage for duplicate, unknown or invalid sources',()=>{
 const {p,thread}=read(),job=p.features.life.jobs[0]!,research=p.features.market.researches[0]!
 expect(workWaitReading({...p,features:{...p.features,life:{...p.features.life,jobs:[job,job]}}},thread)).toBeNull()
 expect(workWaitReading({...p,features:{...p.features,market:{...p.features.market,researches:[{...research,completeAt:'bad-date'}]}}},thread)).toBeNull()
 expect(workWaitReading({...p,features:{...p.features,market:{...p.features.market,researches:[{...research,definitionId:'unknown'}]}}},thread)).toBeNull()
 expect(workWaitReading(p,{...thread,focus:{...thread.focus,runId:'another-life'}})).toBeNull()
 expect(workWaitReading(p,{...thread,responsibilityOverrideNeeded:true})).toBeNull()
})

it('makes every extra date reachable by groups and closes the reading for another identity',()=>{
 const {p,value:v}=read(),many:WorkWaitReading={...v!,items:[...v!.items,...v!.items.map(row=>({...row,key:'extra-'+row.key,title:'另一个原记录 · '+row.title}))]},navigate=vi.fn(),draw=(value=many)=>{hooks.index=0;return WorkWaitCue({p,value,onNavigate:navigate})}
 let tree=draw();expect(nodes(tree).filter(n=>n.props.className==='work-wait-note')).toHaveLength(3)
 const more=nodes(tree).find(n=>n.props.className==='work-wait-more')!;(more.props.onClick as ()=>void)();tree=draw();let dialog=nodes(tree).find(n=>n.type===Dialog)!
 expect(words(dialog.props.children)).not.toContain('另一个原记录')
 const next=nodes(dialog).find(n=>n.type==='button'&&words(n.props.children)==='下一组日期')!;(next.props.onClick as ()=>void)();dialog=nodes(draw()).find(n=>n.type===Dialog)!
 expect(words(dialog.props.children)).toContain('另一个原记录');expect(nodes(dialog).filter(n=>n.props.className==='work-wait-note')).toHaveLength(3)
 expect(nodes(draw({...many,key:'other-work'})).some(n=>n.type===Dialog)).toBe(false);expect(p.request).not.toHaveBeenCalled()
})
