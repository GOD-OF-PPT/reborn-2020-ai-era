import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {committedEcho} from './SceneEcho.tsx'
import {TodayScene} from './TodayScene.tsx'
import {personalDayProgressBrief,personalRestCompleted,personalStartNoticeExpired} from './personal-day-copy.ts'

// Only kernel proposals and UI projections. Storage and codec APIs are unused.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'personal-feedback-ui',actorId:'player',commandId:'create',seed:'personal-feedback-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown){
  const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ui-step-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId)
  if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_GAMEPLAY_PROPOSAL')
  return result.nextRun
}
const started=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null})
const midway=act(started,'AdvanceTime',{date:'2020-01-06'})
const completed=act(midway,'AdvanceTime',{date:'2020-01-08'})
function props(run:GameRun):GamePanelProps{
  const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
  const view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
  const controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
  return {view,features,controller,request:vi.fn(),accountId:'personal'}
}
function focus(p:GamePanelProps):OpeningFocus{
  const job=p.features.life.jobs.find(row=>row.kind==='rest')!
  return {kind:'life',runId:p.view.runId,accountId:'personal',entityId:job.id,selection:'rest'}
}
function context(){
  const before=props(started),p=props(midway),thread=playerThread(p,focus(p)),frame=committedEcho(before.view,p.view)!
  const notice={date:p.view.date,text:'日历从2020-01-01走到2020-01-06。',brief:p.view.date+'。',frame}
  return {p,thread,notice}
}

it('adds the current personal job and expected end date to a date-only intermediate echo',()=>{
  const {p,thread,notice}=context()
  expect(personalDayProgressBrief(p,thread,notice)).toBe('休整还在继续，预计2020-01-08结束。')
  expect(notice.text).toBe('日历从2020-01-01走到2020-01-06。')
})

it('leaves money, action changes, richer event text and another date untouched',()=>{
  const {p,thread,notice}=context()
  for(const alternative of [
    {...notice,brief:'收到工资¥8,000。'},
    {...notice,date:'2020-01-05'},
    {...notice,frame:{...notice.frame,pointsAfter:notice.frame.pointsAfter-1}},
    {...notice,frame:{...notice.frame,accounts:notice.frame.accounts.map(row=>({...row,after:row.after+1}))}},
    {...notice,frame:{...notice.frame,dateBefore:'invalid-date'}},
  ])expect(personalDayProgressBrief(p,thread,alternative)).toBeNull()
})

it('requires the unique current personal job rather than an old or ambiguous record',()=>{
  const {p,thread,notice}=context(),job=p.features.life.jobs[0]!
  expect(personalDayProgressBrief(p,{...thread,focusScope:'history'},notice)).toBeNull()
  expect(personalDayProgressBrief(p,{...thread,focus:{...thread.focus,runId:'another-run'}},notice)).toBeNull()
  expect(personalDayProgressBrief({...p,features:{...p.features,life:{...p.features.life,jobs:[job,job]}}},thread,notice)).toBeNull()
  const ended=props(completed)
  expect(personalDayProgressBrief(ended,playerThread(ended,focus(ended)),{...notice,date:ended.view.date,brief:ended.view.date+'。'})).toBeNull()
})

function renderToday(p:GamePanelProps){
  const today=todayThread(p,focus(p))!
  return renderToStaticMarkup(<TodayScene p={p} today={today} headingRef={null} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>)
}
it('offers an explicit work direction after actual rest while retaining the completed result',()=>{
  const p=props(completed),thread=playerThread(p,focus(p))
  expect(personalRestCompleted(p,thread)).toBe(true)
  const html=renderToday(p)
  expect(html).toContain('歇过之后，想从哪里开始？')
  expect(html).toContain('看看这季的工作')
  expect(html).toContain('今天的日历 看看这季的工作')
  expect(html).toContain('2020-01-08实际完成')
  expect(p.request).not.toHaveBeenCalled()
})

it('keeps parallel work ahead of a new work suggestion',()=>{
  const working=props(act(completed,'WorkQuarter',{})),html=renderToday(working)
  expect(html).toContain('继续这季的工作')
  expect(html).not.toContain('歇过之后，想从哪里开始？')
  expect(working.request).not.toHaveBeenCalled()
})


it('expires only the generic life-start notice after its running work has ended',()=>{
  const notice='生活工作已实际开始；完成与场景仍按真实日期处理。'
  expect(personalStartNoticeExpired(props(started),notice)).toBe(false)
  expect(personalStartNoticeExpired(props(completed),notice)).toBe(true)
  expect(personalStartNoticeExpired(props(completed),'收到工资¥8,000。')).toBe(false)
  expect(personalStartNoticeExpired(props(completed),'原来的责任仍需回应。')).toBe(false)
})

it('keeps an explicitly reported original offer update beside the ongoing personal activity',()=>{
  const {p,thread,notice}=context()
  expect(p.features.firstOrder.status).toBe('expired')
  const text='2020-01-06。已经确认的安排按真实日期发生，眼前又多了一次选择。 那份原委托，有了新的实际反馈。'
  expect(personalDayProgressBrief(p,thread,{...notice,text})).toBe('委托答复期限已过。休整还在继续，预计2020-01-08结束。')
})
