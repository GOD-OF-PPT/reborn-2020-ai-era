import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {workHistoryReading,type WorkHistoryReading} from './work-history-copy.ts'
import {WorkHistoryRecord} from './WorkHistoryRecord.tsx'
import {isValidElement,type ReactElement} from 'react'

// Normal in-memory proposals, public facts and original reading actions only.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'work-history-ui',actorId:'player',commandId:'create',seed:'work-history-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'history-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run:GameRun){const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};const p:GamePanelProps={view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']};const focus:OpeningFocus={runId:run.runId,kind:'work',accountId:'personal',entityId:view.operations?.employment[0]?.id??null};return {p,focus,thread:playerThread(p,focus)}}
function until(run:GameRun,date:string){for(let n=0;n<30;n++){const w=context(run).p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.costFen||c.actionPoints)throw Error('EXPECTED_FREE_ORIGINAL_REPLY');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const work=act(act(initial,'SkipOffer',{offerId:context(initial).p.features.firstOrder.offerId}),'WorkQuarter'),april=until(work,'2020-04-01')

const hooks=vi.hoisted(()=>({slots:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.slots))hooks.slots[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.slots[i] as T,(next:T|((old:T)=>T))=>{hooks.slots[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.slots[i] as T):next}] as const}}})
afterEach(()=>{hooks.slots=[];hooks.index=0})
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer)]:[]
const words=(n:unknown):string=>typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function reading(){const {p,thread}=context(april);return workHistoryReading(p,thread)!}
function driver(value=reading()){const onClose=vi.fn(),onToday=vi.fn(),onExplanation=vi.fn();return {onClose,onToday,onExplanation,draw:(v=value)=>{hooks.index=0;return WorkHistoryRecord({value:v,onClose,onToday,onExplanation})}}}
function click(tree:unknown,label:string){const button=nodes(tree).find(n=>n.type==='button'&&words(n.props.children)===label)!;expect(button).toBeDefined();(button.props.onClick as ()=>void)()}

it('reads the exact old employment and all three actual wages while the new quarter already has work',()=>{
 const {p,thread}=context(act(april,'WorkQuarter')),v=workHistoryReading(p,thread)!,old=p.view.operations!.employment[0]!
 expect(v.quarter).toBe('2020-Q1');expect(v.currentQuarter).toBe('2020-Q2');expect(v.limit).toBe(old.limit);expect(v.segments).toEqual(old.segments)
 expect(v.wages.map(row=>[row.date,row.amountFen])).toEqual([['2020-01-31',800000],['2020-02-29',800000],['2020-03-31',800000]])
 expect(v.totalFen).toBe(2400000);expect(v.key).toBe(JSON.stringify([p.view.runId,'personal',old.id]))
 const html=renderToStaticMarkup(<WorkHistoryRecord value={v} onClose={vi.fn()} onToday={vi.fn()} onExplanation={vi.fn()}/>);expect(html).toContain('2020-Q1 · 工作手记');expect(html).toContain('¥24,000');expect(html).toContain('至原安排边界');expect(html).not.toContain('选择一个片段')
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('keeps zero-valued public wage rows and rejects unrelated or current records',()=>{
 const {p,thread}=context(april),ops=p.view.operations!,zero={...ops.payroll[0]!,id:'zero-public-row',amountFen:0,operationId:null},v=workHistoryReading({...p,view:{...p.view,operations:{...ops,payroll:[...ops.payroll,zero]}}},thread)!
 expect(v.wages.find(row=>row.id===zero.id)?.amountFen).toBe(0);expect(v.totalFen).toBe(2400000)
 expect(workHistoryReading(p,{...thread,focus:{...thread.focus,runId:'other'}})).toBeNull();expect(workHistoryReading(p,{...thread,focusScope:'current'})).toBeNull()
})

it('shows the complete ordinary receipt directly without a pointless first page',()=>{
 const ui=driver(),tree=ui.draw(),text=words(tree.props.children)
 expect(tree.props.layout).toBe('direct');expect(text).toContain('2020-01-01');expect(text).toContain('2020-04-01');expect(text).toContain('2020-01-31');expect(text).toContain('2020-02-29');expect(text).toContain('2020-03-31');expect(text.match(/¥8,000/g)).toHaveLength(3)
 expect(nodes(tree).filter(n=>n.type==='nav')).toHaveLength(0)
})

it('pages long original histories without dropping rows and resets reading position for another identity',()=>{
 const v=reading(),long:WorkHistoryReading={...v,segments:[...v.segments,...Array.from({length:4},(_,i)=>({from:'2020-02-0'+(i+1),to:'2020-02-0'+(i+2)}))],wages:[...v.wages,{id:'fourth',date:'2020-03-31',amountFen:0}]},ui=driver(long)
 let tree=ui.draw();click(tree,'下一组工资');tree=ui.draw();expect(words(tree.props.children)).toContain('¥0');expect(words(tree.props.children)).not.toContain('2020-01-31')
 click(tree,'下一组在岗片段');tree=ui.draw();expect(words(tree.props.children)).toContain('2020-02-04');expect(words(tree.props.children)).not.toContain('2020-01-01')
 tree=ui.draw({...long,key:'another-original-work'});expect(words(tree.props.children)).toContain('2020-01-01');expect(words(tree.props.children)).toContain('2020-01-31')
})

it('keeps closing, Today and full explanation as three distinct read-only actions',()=>{
 const ui=driver(),tree=ui.draw();click(tree,'合上手记');expect(ui.onClose).toHaveBeenCalledTimes(1);expect(ui.onToday).not.toHaveBeenCalled();expect(ui.onExplanation).not.toHaveBeenCalled()
 click(tree,'回到今天 →');expect(ui.onToday).toHaveBeenCalledTimes(1);click(tree,'查看完整说明与原册 ↗');expect(ui.onExplanation).toHaveBeenCalledTimes(1)
})
