import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {todayResearchReading} from './today-research-reading.ts'
import {TodayScene} from './TodayScene.tsx'
import {SceneTimeNotice,committedEcho} from './SceneEcho.tsx'
import {savedSceneResult} from './scene-result.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {waitSceneResult} from './wait-scene-result.ts'

// Normal in-memory proposals and the original public receipt producers only.
// No store, codec, import/export or stored-run fixtures.
const capture=vi.hoisted(()=>({notice:null as ComponentProps<typeof SceneTimeNotice>|null}))
vi.mock('./SceneEcho.tsx',async original=>{const actual=await original<typeof import('./SceneEcho.tsx')>();return {...actual,SceneTimeNotice:(p:ComponentProps<typeof actual.SceneTimeNotice>)=>{capture.notice=p;return <actual.SceneTimeNotice {...p}/>}}})
afterEach(()=>{capture.notice=null;vi.clearAllMocks()})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'today-research-ui',actorId:'player',commandId:'create',seed:'today-research-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'study-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
const working=act(initial,'WorkQuarter')
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
function input(run:GameRun):GamePanelProps{const v=view(run);return {view:v,features:v.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view:v,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function context(run:GameRun){const p=input(run),focus:OpeningFocus={runId:p.view.runId,kind:'work',accountId:'personal',entityId:p.view.operations!.employment[0]!.id},today=todayThread(p,focus)!;return {p,focus,today}}
function start(definitionId='market-overview',before=working){const run=act(before,'ResearchMarket',{definitionId}),c=context(run),text=savedSceneResult('ResearchMarket','原研究',view(before),c.p.view),frame=committedEcho(view(before),c.p.view);if(!frame)throw Error('ACTUAL_FRAME_REQUIRED');return {run,...c,notice:{date:c.p.view.date,text,brief:text,frame}}}
function reading(beforeRun:GameRun,run:GameRun){const before=view(beforeRun),current=view(run),receipt=current.receipts.at(-1)!,result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:current.date,before,lastBefore:before,lastSaved:current,current,steps:[{commandId:receipt.commandId,date:current.date,revisionBefore:before.revision,revisionAfter:current.revision}],feedback:inspectPublicWaitTransition(before,current),failed:null},notice={date:current.date,...waitSceneResult(result,current)!};return {run,...context(run),notice}}
function finish(started:ReturnType<typeof start>){let run=started.run,before=run;const target=started.p.features.market.researches.at(-1)!.completeAt;if(target>'2020-01-06'&&run.timeline.cursor.date<'2020-01-06')run=act(run,'AdvanceTime',{date:'2020-01-06'});for(let n=0;n<10&&run.timeline.cursor.date<target;n++){before=run;run=act(run,'AdvanceTime',{date:target})}if(run.timeline.cursor.date!==target)throw Error('ACTUAL_COMPLETION_REQUIRED');return reading(before,run)}

it.each([['market-overview','公开研究笔记','¥0'],['market-foundation-course','模拟规则研习笔记','¥3,000'],['simulation-special-study','模拟试验段研习笔记','¥100']] as const)('names the %s start with actually paid cost/used points and its original expected completion', (id,name,cost)=>{
 const c=start(id),r=todayResearchReading(c.p,c.today,c.notice)!,study=c.p.features.market.researches[0]!,original=JSON.stringify(c.notice)
 expect(r).toEqual({sourceId:study.id,brief:name+'已开始 · 已付'+cost+' / 已用1点。预计'+study.completeAt+'完成。'});expect(r.brief).not.toContain('已取得');expect(JSON.stringify(c.notice)).toBe(original);expect(c.p.request).not.toHaveBeenCalled()
})
it.each(['market-overview','market-foundation-course','simulation-special-study'] as const)('uses the actual %s completion and original permission source, without promising a trade',id=>{
 const c=finish(start(id)),r=todayResearchReading(c.p,c.today,c.notice)!,study=c.p.features.market.researches[0]!
 expect(r).not.toBeNull();expect(study.status).toBe('completed');expect(r.sourceId).toBe(study.id)
 if(id==='market-overview')expect(r.brief).toBe('公开研究笔记已完成 · 不揭示未来价格，买卖仍须显选。')
 else{expect(r.brief).toContain('已取得本局');expect(c.p.features.market.permissions.some(row=>row.sourceId===study.id&&row.date===study.completeAt)).toBe(true);const p={...c.p,features:{...c.p.features,market:{...c.p.features.market,permissions:c.p.features.market.permissions.filter(row=>row.sourceId!==study.id)}}};expect(todayResearchReading(p,c.today,c.notice)).toBeNull()}
 expect(c.p.request).not.toHaveBeenCalled();expect(c.p.requestWait).not.toHaveBeenCalled()
})
it('reads the same receipt while life remains selected and while its own research remains selected, without changing the pin',()=>{
 const c=start('market-overview',act(working,'StartLifeWork',{kind:'rest',personId:null,reference:null})),life:OpeningFocus={runId:c.p.view.runId,kind:'life',accountId:'personal',selection:'rest',entityId:c.p.features.life.jobs[0]!.id},research:OpeningFocus={runId:c.p.view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:c.p.features.market.researches[0]!.id}
 for(const f of [life,research]){const t=todayThread(c.p,f)!,pin=JSON.stringify(t.primary.thread.focus);expect(todayResearchReading(c.p,t,c.notice)?.brief).toContain('公开研究笔记已开始');expect(JSON.stringify(t.primary.thread.focus)).toBe(pin)}
 expect(c.p.view.budget.available).toBe(0);expect(c.p.request).not.toHaveBeenCalled()
})
it('retains original text/frame/accountName/close and reading callbacks while changing only the compact brief',()=>{
 const c=start(),onClose=vi.fn(),read=vi.fn(),accountName=()=> '个人账户',recordAction=<button type="button" onClick={read}>原记录入口</button>,html=renderToStaticMarkup(<TodayScene p={c.p} today={c.today} headingRef={null} feedback={<SceneTimeNotice {...c.notice} compact onClose={onClose} accountName={accountName} recordAction={recordAction}/>} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>),actual=capture.notice!
 expect(actual.brief).toBe(todayResearchReading(c.p,c.today,c.notice)!.brief);expect(actual.text).toBe(c.notice.text);expect(actual.frame).toBe(c.notice.frame);expect(actual.accountName).toBe(accountName);expect(actual.onClose).toBe(onClose);expect(actual.recordAction).toBe(recordAction)
 expect(html).toContain(actual.brief!);expect(html).toContain('细看回响');expect(html).toContain('原记录入口');expect(html).toContain('收起这次时间回响');expect(html).toContain('不新增安排，让原日子继续');actual.onClose();recordAction.props.onClick();expect(onClose).toHaveBeenCalledTimes(1);expect(read).toHaveBeenCalledTimes(1);expect(c.p.request).not.toHaveBeenCalled()
})
it('keeps mixed original money, extra responsibility, non-equivalent text and uncertain payment frames in the original reading',()=>{
 const c=start('market-foundation-course'),extra=' 另有原客户款¥100仍待核对。'
 for(const notice of [{...c.notice,text:c.notice.text+extra,brief:c.notice.brief+extra},{...c.notice,brief:'已经免费取得规则资格。'},{...c.notice,date:'2020-01-02'},{...c.notice,frame:null},{...c.notice,frame:{...c.notice.frame,quarterChanged:true}},{...c.notice,frame:{...c.notice.frame,accounts:c.notice.frame.accounts.map(row=>({...row,after:row.after-100}))}}])expect(todayResearchReading(c.p,c.today,notice)).toBeNull()
 const mixed={...c.notice,text:c.notice.text+extra,brief:c.notice.brief+extra},onClose=vi.fn(),html=renderToStaticMarkup(<TodayScene p={c.p} today={c.today} headingRef={null} feedback={<SceneTimeNotice {...mixed} compact onClose={onClose} accountName={()=>'个人账户'}/>} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>);expect(capture.notice!.brief).toBe(mixed.brief);expect(capture.notice!.text).toBe(mixed.text);expect(html).toContain('原客户款¥100仍待核对');expect(c.p.request).not.toHaveBeenCalled()
})
it('does not replace history, another real research, duplicate candidates or stale Today sources',()=>{
 const c=start(),t=c.today,study=c.p.features.market.researches[0]!
 for(const today of [{...t,source:{...t.source,revision:t.source.revision-1}},{...t,source:{...t.source,quarter:'2020-Q2'}},{...t,responsibilityOverrideNeeded:true},{...t,primary:{...t.primary,thread:{...t.primary.thread,focusScope:'history' as const}}}])expect(todayResearchReading(c.p,today,c.notice)).toBeNull()
 expect(todayResearchReading({...c.p,features:{...c.p.features,market:{...c.p.features.market,researches:[study,study]}}},t,c.notice)).toBeNull()
 const completed=finish(c),second=start('market-foundation-course',completed.run),oldFocus:OpeningFocus={runId:second.p.view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:study.id},oldToday=todayThread(second.p,oldFocus)!;expect(oldToday.primary.thread.focusStatus).not.toBe('invalid');expect(todayResearchReading(second.p,oldToday,second.notice)).toBeNull()
})
it('keeps a real old offer expiry distinct while the paid study still runs',()=>{
 const c=start('market-foundation-course'),run=act(c.run,'AdvanceTime',{date:'2020-01-06'}),step=reading(c.run,run)
 expect(step.p.features.market.researches[0]!.status).toBe('running');expect(step.notice.text).toContain('那份原委托，有了新的实际反馈');expect(todayResearchReading(step.p,step.today,step.notice)).toBeNull()
})
