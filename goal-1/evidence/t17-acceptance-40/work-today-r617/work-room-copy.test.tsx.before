import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {roomMoment} from './RoomMoment.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {DayThreadAction} from './DayThreadAction.tsx'
import {workRoomCopy} from './work-room-copy.ts'

// Normal kernel proposals and public UI projections; no storage or codec use.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'work-room-ui',actorId:'player',commandId:'create',seed:'work-room-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId)
 if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_PROPOSAL: '+JSON.stringify(result))
 return result.nextRun
}
const initialFeatures=registry.runtime!.project!(initial) as unknown as PlayFeatures
const working=act(act(initial,'SkipOffer',{offerId:initialFeatures.firstOrder.offerId}),'WorkQuarter')
const interrupted=act(working,'AdvanceTime',{date:'2020-01-31'})
const event=interrupted.world!.instances.find(e=>e.status==='pending')!
const deferred=act(interrupted,'ChooseEvent',{instanceId:event.id,choiceId:'defer'})
const paid=act(deferred,'AdvanceTime',{date:'2020-01-31'})
function context(run=working){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
 const view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const request=vi.fn(),requestWait=vi.fn()
 const controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId),clockCommitments:()=>{throw Error('UI_CHECK_EXPECTS_ORIGINAL_CONFIRMATION')}} as unknown as GamePanelProps['controller']
 const p:GamePanelProps={view,features,controller,request,requestWait,accountId:'personal'}
 const focus:OpeningFocus={kind:'work',runId:view.runId,accountId:'personal',entityId:view.operations!.employment[0]!.id}
 return {p,focus,thread:playerThread(p,focus)}
}
function render(p:GamePanelProps,focus:OpeningFocus,feedback?:string){return renderToStaticMarkup(<OpeningMoment p={p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} feedback={feedback} onNavigate={vi.fn()} onExplore={vi.fn()}/>)}

it('keeps the unpaid work scene concise and preserves the original wait, fee review and active-choice entry',()=>{
 const {p,focus,thread}=context(),html=render(p,focus,'这一季的工作已经安排好。')
 expect(workRoomCopy(p,thread)?.title).toBe('工作之外，想做点什么？')
 expect(html).toContain('工资按在岗日结算，尚未到账')
 expect(html).toContain('在岗 · 按月结薪')
 expect(html).toContain('等工作回响 · 2020-01-31')
 expect(html).toContain('核对后推进 · 2020-01-31')
 expect(html).toContain('安排工作之外的时间')
 expect(html).toContain('环顾房间')
 expect(html).toContain('翻开手记')
 expect(html).toContain('这一季的工作已经安排好。')
 expect(html).not.toContain('查看不会补发工资或恢复行动')
 expect(p.request).not.toHaveBeenCalled()
 expect(p.requestWait).not.toHaveBeenCalled()
})

it('shows actual payroll after month end without declaring the whole work quarter finished',()=>{
 const {p,focus,thread}=context(paid)
 expect(p.view.date).toBe('2020-01-31')
 const copy=workRoomCopy(p,thread)!
 expect(copy.title).toBe('工资到了，工作还在继续。')
 expect(copy.line).toContain('2020-01-31工资实收¥8,000')
 expect(copy.line).not.toContain('本季累计')
 expect(copy.stage).toBe('在岗 · 按月结薪')
 const html=render(p,focus,'本次同时结算生活费。')
 expect(html).toContain('本次同时结算生活费。')
 expect(html).toContain('等工作回响 · 2020-02-29')
})

it('describes an explicit stop separately from the already received wages',()=>{
 const {p,thread}=context(act(paid,'QuitWork')),copy=workRoomCopy(p,thread)!
 expect(copy.title).toBe('这段工作，先告一段落。')
 expect(copy.line).toContain('工资实收¥8,000')
 expect(copy.line).toContain('已用行动不返还')
 expect(copy.stage).toBe('已停止 · 记录保留')
})

it('keeps the original record and full description available for history or uncertain source identity',()=>{
 const {p,thread}=context(paid)
 expect(workRoomCopy(p,{...thread,focusScope:'history'})).toBeNull()
 expect(workRoomCopy(p,{...thread,focus:{...thread.focus,runId:'another-life'}})).toBeNull()
 expect(workRoomCopy(p,{...thread,focus:{...thread.focus,entityId:'missing'}})).toBeNull()
 const period=p.view.operations!.employment[0]!,duplicate={...p,view:{...p.view,operations:{...p.view.operations!,employment:[period,period]}}}
 expect(workRoomCopy(duplicate,thread)).toBeNull()
 expect(thread.detail).toContain('查看不会补发工资或恢复行动')
 expect(thread.inspect.target?.recordId).toBe(period.id)
})

it('does not total ambiguous or unreferenced salary rows',()=>{
 const {p,thread}=context(paid),row=p.view.operations!.payroll.find(r=>r.kind==='salary')!
 for(const payroll of [[row,row],[{...row,operationId:null}],[{...row,amountFen:Number.NaN}]]){
  expect(workRoomCopy({...p,view:{...p.view,operations:{...p.view.operations!,payroll}}},thread)).toBeNull()
 }
})

it('leaves an intervening real decision ahead of the shortened work scene',()=>{
 const {p,thread}=context(interrupted)
 expect(p.view.date).toBe('2020-01-22')
 expect(thread.responsibilityOverrideNeeded).toBe(true)
 expect(workRoomCopy(p,thread)).toBeNull()
})

it('retains the original shared date request and confirmation when the work paper is activated',()=>{
 const {p,thread}=context(),date=thread.wait!.date
 let activate:(()=>void)|undefined
 renderToStaticMarkup(<DayThreadAction p={p} thread={thread} active result={false} date={date} waitLabel="等工作回响" onToday={vi.fn()}>{primary=>{activate=primary?.binding.activate;return primary?.main}}</DayThreadAction>)
 expect(activate).toBeDefined()
 activate!()
 expect(p.requestWait).toHaveBeenCalledExactlyOnceWith('2020-01-31',expect.stringContaining('等工作回响'),true)
 expect(p.request).not.toHaveBeenCalled()
})


function advanceNormally(run:GameRun,date:string){
 for(let step=0;step<12;step++){
  const w=context(run).p.features.workbench
  if(w.pause){const event=w.events.find(e=>e.isBlocking),choice=event?.choices.find(c=>c.isDefault);if(!event||!choice||choice.actionPoints!==0||choice.costFen!==0)throw Error('ORIGINAL_ZERO_COST_RESPONSE_REQUIRED');run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(run.timeline.cursor.date>=date)return run
  run=act(run,'AdvanceTime',{date})
 }
 throw Error('ORIGINAL_TIME_BOUND_EXCEEDED')
}
const fullWork=act(act(act(initial,'WorkQuarter'),'ResearchMarket',{definitionId:'market-overview'}),'StartLifeWork',{kind:'rest',personId:null,reference:null})
const reservedWork=act(act(act(initial,'WorkQuarter'),'ResearchMarket',{definitionId:'market-overview'}),'StartFirstOrder')

it('guides a real exhausted work quarter toward its original wait and reading without offering new action spending',()=>{
 const {p,focus,thread}=context(fullWork),copy=workRoomCopy(p,thread)!,html=render(p,focus)
 expect(p.view.budget).toMatchObject({available:0,spent:4,reserved:0})
 expect(copy.title).toBe('这季的四点已用完，工作照常继续。');expect(copy.line).toContain('仍可翻阅生活，或等下一次回响')
 expect(copy.line).not.toContain('生活与副业仍可安排')
 expect(p.features.life.jobs.find(job=>job.kind==='rest')?.completeAt).toBe('2020-01-08')
 for(const text of ['等下一次反馈（最迟） · 2020-01-08','核对后推进 · 2020-01-08','看看生活','环顾房间','翻开手记'])expect(html).toContain(text)
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('distinguishes original reserved work points from actually used points',()=>{
 const {p,thread}=context(reservedWork),copy=workRoomCopy(p,thread)!
 expect(p.view.budget).toMatchObject({available:0,spent:3,reserved:1})
 expect(copy.title).toBe('这季的行动已排满，工作照常继续。');expect(copy.title).not.toContain('已用完')
 expect(copy.line).toContain('尚未到账');expect(copy.line).not.toContain('生活与副业仍可安排')
})

it('keeps today’s real wage receipt visible at zero actions and treats it as history on a later actual day',()=>{
 const salaryRun=advanceNormally(fullWork,'2020-01-31'),today=context(salaryRun),now=workRoomCopy(today.p,today.thread)!
 expect(now.title).toBe('工资到了，工作还在继续。');expect(now.line).toContain('2020-01-31工资实收¥8,000');expect(now.line).toContain('仍可翻阅生活')
 expect(now.line).not.toContain('最近一笔')
 const later=context(advanceNormally(salaryRun,'2020-02-02')),copy=workRoomCopy(later.p,later.thread)!
 expect(copy.title).toBe('这季的四点已用完，工作照常继续。');expect(copy.line).toContain('最近一笔：2020-01-31工资实收¥8,000')
 expect(copy.title).not.toContain('工资到了');expect(later.p.view.budget.available).toBe(0)
 const html=render(later.p,later.focus,'另一件准备仍需按自己的日期发生。')
 expect(html).toContain('另一件准备仍需按自己的日期发生。');expect(html).toContain('等工作回响 · 2020-02-29');expect(html).toContain('看看生活')
})

it('keeps older pay as a dated fact while remaining actions invite another choice',()=>{
 const {p,thread}=context(advanceNormally(paid,'2020-02-02')),copy=workRoomCopy(p,thread)!
 expect(p.view.budget.available).toBe(2);expect(copy.title).toBe('工作照常，接下来怎样安排？')
 expect(copy.line).toBe('最近一笔：2020-01-31工资实收¥8,000。')
})

it('keeps the selected quarter’s original payroll total on the next actual payday',()=>{
 const {p,thread}=context(advanceNormally(paid,'2020-02-29')),copy=workRoomCopy(p,thread)!
 expect(copy.title).toBe('工资到了，工作还在继续。');expect(copy.line).toBe('2020-02-29工资实收¥8,000 · 本季累计¥16,000。')
})

it('keeps an ambiguous action budget neutral instead of inventing remaining or exhausted points',()=>{
 const {p,thread}=context(),changed={...p,view:{...p.view,budget:{...p.view.budget,available:0}}},copy=workRoomCopy(changed,thread)!
 expect(copy.title).toBe('这季的工作，仍在继续。');expect(copy.line).toBe('工资按在岗日结算，尚未到账。')
})
