import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {DayThreadAction} from './DayThreadAction.tsx'
import {workHistoryCopy} from './work-history-copy.ts'

// Normal in-memory proposals, public facts and original reading actions only.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'work-history-ui',actorId:'player',commandId:'create',seed:'work-history-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'history-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run:GameRun){const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};const p:GamePanelProps={view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']};const focus:OpeningFocus={runId:run.runId,kind:'work',accountId:'personal',entityId:view.operations?.employment[0]?.id??null};return {p,focus,thread:playerThread(p,focus)}}
function until(run:GameRun,date:string){for(let n=0;n<30;n++){const w=context(run).p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.costFen||c.actionPoints)throw Error('EXPECTED_FREE_ORIGINAL_REPLY');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const work=act(act(initial,'SkipOffer',{offerId:context(initial).p.features.firstOrder.offerId}),'WorkQuarter'),april=until(work,'2020-04-01')
function render(p:GamePanelProps,focus:OpeningFocus,feedback?:string){return renderToStaticMarkup(<OpeningMoment p={p} focus={focus} focusQuarter="2020-Q1" onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} feedback={feedback} onToday={vi.fn()} onNavigate={vi.fn()} onExplore={vi.fn()}/>)}

it('shows old actual wages once while preserving today’s separate full consequence and navigation',()=>{
 const {p,focus,thread}=context(april),copy=workHistoryCopy(p,thread)!,html=render(p,focus,'今天实际支付生活费¥4,000；原约定仍在。')
 expect(thread.focusScope).toBe('history');expect(copy.object).toBe('2020-Q1 · 工作手记')
 expect(copy.line).toBe('工资实收合计¥24,000。最近一笔：2020-03-31 · ¥8,000。')
 expect(html).toContain(copy.line);expect(html).toContain('今天的回响');expect(html).toContain('今天实际支付生活费¥4,000；原约定仍在。')
 expect(html).toContain('回到今天');expect(html).toContain('翻看2020-Q1的原工作记录');expect(html).toContain('翻开手记');expect(html).toContain('环顾房间')
 expect(html).not.toContain('正在回看2020-Q1，今天仍是');expect(html).not.toContain('查看不会补发工资或恢复行动')
 expect(thread.detail).toContain('查看不会补发工资或恢复行动');expect(thread.line).toContain('截至2020-04-01')
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('does not imply the current quarter has no work when a new employment already exists',()=>{
 const {p,focus,thread}=context(act(april,'WorkQuarter')),copy=workHistoryCopy(p,thread)!,html=render(p,focus)
 expect(p.view.operations!.employment).toHaveLength(2);expect(p.view.budget.available).toBe(2)
 expect(copy.next).toBe('旧工资不计入本季收入；回到今天，查看当前安排。');expect(html).not.toContain('当前季度的工作仍须另行决定')
 expect(copy.line).toContain('¥24,000');expect(copy.line).not.toContain('尚未到账')
 const latest=p.view.operations!.employment.find(e=>e.quarter==='2020-Q2')!,now=playerThread(p,{...focus,entityId:latest.id})
 expect(workHistoryCopy(p,now)).toBeNull();expect(now.focusScope).toBe('current')
})

it('preserves the real partial wage for a job stopped after its first working day',()=>{
 const {p,thread}=context(until(act(work,'QuitWork'),'2020-04-01')),copy=workHistoryCopy(p,thread)!
 expect(copy.line).toBe('工资实收合计¥258.06。最近一笔：2020-01-31 · ¥258.06。');expect(copy.line).not.toContain('¥24,000')
})

it('keeps uncertain, duplicate or unrelated source rows in the original full presentation',()=>{
 const {p,thread}=context(april),ops=p.view.operations!,period=ops.employment[0]!,salary=ops.payroll.find(row=>row.kind==='salary')!
 for(const t of [{...thread,focusScope:'current' as const},{...thread,responsibilityOverrideNeeded:true},{...thread,focusQuarter:'2020-Q2'},{...thread,focus:{...thread.focus,runId:'other'}}])expect(workHistoryCopy(p,t)).toBeNull()
 expect(workHistoryCopy({...p,view:{...p.view,operations:{...ops,employment:[period,period]}}},thread)).toBeNull()
 for(const payroll of [[salary,salary],[{...salary,operationId:null}],[{...salary,through:'2020-04-30'}],[{...salary,amountFen:Number.NaN}]])expect(workHistoryCopy({...p,view:{...p.view,operations:{...ops,payroll}}},thread)).toBeNull()
 expect(workHistoryCopy({...p,view:{...p.view,date:'bad-date'}},thread)).toBeNull()
})

it('retains the original history paper’s Today action with no work or time command',()=>{
 const {p,thread}=context(april),today=vi.fn();let activate:(()=>void)|undefined
 const html=renderToStaticMarkup(<DayThreadAction p={p} thread={thread} active result date={null} waitLabel="原日历" onToday={today}>{primary=>{activate=primary?.binding.activate;return primary?.main}}</DayThreadAction>)
 expect(html).toContain('回到今天');activate!();expect(today).toHaveBeenCalledTimes(1);expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
 expect(thread.inspect.target).toMatchObject({accountId:'personal',recordId:thread.focus.entityId})
})
