import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {todayResultReading} from './today-result-reading.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {TodayScene} from './TodayScene.tsx'
import {SceneTimeNotice} from './SceneEcho.tsx'

// UI from normal kernel proposals only. No store, codec or imported snapshots.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'today-result-ui',actorId:'player',commandId:'create',seed:'today-result-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'first_order'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'today-result-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(r));return r.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
function input(run:GameRun):GamePanelProps{const v=view(run);return {view:v,features:v.features as unknown as PlayFeatures,controller:{snapshot:{view:v,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller'],request:vi.fn(),accountId:'personal'}}
function receipt(beforeRun:GameRun,run:GameRun,focus:OpeningFocus){
 const before=view(beforeRun),p=input(run),current=p.view,last=current.receipts.at(-1)!,result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:current.date,before,lastBefore:before,lastSaved:current,current,steps:[{commandId:last.commandId,date:current.date,revisionBefore:before.revision,revisionAfter:current.revision}],feedback:inspectPublicWaitTransition(before,current),failed:null}
 return {p,today:todayThread(p,focus)!,notice:{date:current.date,...waitSceneResult(result,current)!}}
}
function firstOrder(withWork=false){
 const start=withWork?act(initial,'WorkQuarter'):initial,planned=act(start,'StartFirstOrder'),running=act(planned,'AdvanceTime',{date:'2020-01-05'}),ready=act(running,'AdvanceTime',{date:'2020-01-19'}),contractId=input(ready).features.firstOrder.contractId!,submitted=act(ready,'SubmitDelivery',{contractId}),paid=act(submitted,'AdvanceTime',{date:'2020-01-20'})
 return receipt(submitted,paid,{runId:paid.runId,kind:'first-order',accountId:'personal',entityId:contractId})
}
function personal(kind:'rest'|'workspace'){
 const started=act(initial,'StartLifeWork',{kind,personId:null,reference:null}),middle=act(started,'AdvanceTime',{date:'2020-01-06'}),completed=act(middle,'AdvanceTime',{date:'2020-01-08'}),job=input(completed).features.life.jobs.find(j=>j.kind===kind)!
 return receipt(middle,completed,{runId:completed.runId,kind:'life',accountId:'personal',entityId:job.id,selection:kind})
}
function scene(c:ReturnType<typeof firstOrder>,show=true,compact=true){
 const onFocus=vi.fn(),onPrepare=vi.fn(),onResume=vi.fn(),feedback=show?<SceneTimeNotice {...c.notice} compact={compact} accountName={()=>'个人账户'} onClose={vi.fn()}/>:null
 const html=renderToStaticMarkup(<TodayScene p={c.p} today={c.today} headingRef={null} feedback={feedback} onFocus={onFocus} onPrepare={onPrepare} onResume={onResume} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>)
 return {html,onFocus,onPrepare,onResume,feedback}
}

it('invites the next choice after the actual first receipt and avoids repeating its visible amount',()=>{
 const c=firstOrder(),before=JSON.stringify(c.today),notice=JSON.stringify(c.notice),reading=todayResultReading(c.p,c.today,c.notice)!
 expect(reading).toEqual({title:'接下来的日子，想怎样过？',line:'制作成本¥500 · 本单净额¥800。'})
 const shown=scene(c)
 expect(shown.html).toContain('接下来的日子，想怎样过？');expect(shown.html).toContain('客户付来了¥1,300');expect(shown.html).toContain('制作成本¥500 · 本单净额¥800')
 expect(shown.html).not.toContain('这份手工单实际收到¥1,300');expect(shown.html).toContain('回到书签');expect(shown.html).toContain('工作，还是留点时间给自己？')
 expect(JSON.stringify(c.today)).toBe(before);expect(JSON.stringify(c.notice)).toBe(notice);expect(shown.onFocus).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled()
})

it('restores the complete original fact when the echo closes without changing the next-choice heading',()=>{
 const c=firstOrder(),reading=todayResultReading(c.p,c.today),closed=scene(c,false)
 expect(reading).toEqual({title:'接下来的日子，想怎样过？'})
 expect(closed.html).toContain('接下来的日子，想怎样过？');expect(closed.html).toContain('这份手工单实际收到¥1,300；制作成本¥500，本单净额¥800')
 expect(closed.html).not.toContain('客户付来了¥1,300，这笔手工单收好了。')
})

it.each(['rest','workspace'] as const)('keeps actual %s costs and action visible, with complete dates restored after dismissal',kind=>{
 const c=personal(kind),reading=todayResultReading(c.p,c.today,c.notice)!,shown=scene(c),closed=scene(c,false)
 expect(reading.title).toBe(kind==='rest'?'歇过之后，想从哪里开始？':'住处变好了，接下来呢？')
 expect(reading.line).toBe(`已付${kind==='rest'?'¥0':'¥3,000'} / 已用1点；行动不返还，不产生收入。`)
 expect(shown.html).toContain(reading.line!);expect(closed.html).toContain('2020-01-08实际完成，投入'+(kind==='rest'?'¥0':'¥3,000'))
 expect(closed.html).toContain(reading.title);expect(shown.onPrepare).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled()
})

it('keeps original ongoing work in front of a completed side order',()=>{
 const c=firstOrder(true)
 expect(c.today.ongoing.some(item=>item.focus.kind==='work')).toBe(true)
 expect(todayResultReading(c.p,c.today,c.notice)).toBeNull()
 const html=scene(c).html;expect(html).toContain('工作还在继续，今天怎么过？');expect(html).not.toContain('接下来的日子，想怎样过？')
})

it('retains history, responsibility and a stale source in their original reading',()=>{
 const c=firstOrder()
 for(const source of [{...c.today.source,runId:'other'},{...c.today.source,revision:c.today.source.revision+1},{...c.today.source,date:'2020-01-21'},{...c.today.source,quarter:'2020-Q2'}])expect(todayResultReading(c.p,{...c.today,source},c.notice)).toBeNull()
 expect(todayResultReading(c.p,{...c.today,responsibilityOverrideNeeded:true},c.notice)).toBeNull()
 expect(todayResultReading(c.p,{...c.today,primary:{...c.today.primary,classification:'history'}},c.notice)).toBeNull()
 expect(todayResultReading(c.p,{...c.today,primary:{...c.today.primary,classification:'active'}},c.notice)).toBeNull()
})

it('keeps the full fact for a mixed, foreign-date or noncompact echo',()=>{
 const c=firstOrder(),mixed={...c.notice,text:c.notice.text+' 另一笔原欠款仍待处理。'},wrongDate={...c.notice,date:'2020-01-19'}
 expect(todayResultReading(c.p,c.today,mixed)?.line).toBeUndefined();expect(todayResultReading(c.p,c.today,wrongDate)?.line).toBeUndefined()
 const noncompact=scene(c,true,false);expect(noncompact.html).toContain('这份手工单实际收到¥1,300')
 const mixedScene=scene({...c,notice:mixed});expect(mixedScene.html).toContain('这份手工单实际收到¥1,300')
})

it('does not claim a next-result reading for an unresolved first-order source',()=>{
 const c=firstOrder(),first=c.p.features.firstOrder
 const foreign={...c.p,features:{...c.p.features,firstOrder:{...first,contractId:'another'}}}
 expect(todayResultReading(foreign,c.today,c.notice)).toBeNull()
 const unpaid={...c.p,features:{...c.p.features,firstOrder:{...first,result:{...first.result,paymentFen:0}}}}
 expect(todayResultReading(unpaid,c.today,c.notice)).toBeNull()
})
