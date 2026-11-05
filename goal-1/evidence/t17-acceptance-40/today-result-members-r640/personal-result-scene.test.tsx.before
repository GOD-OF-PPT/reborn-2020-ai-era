import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {completedDayChoice} from './completed-day-choice.ts'
import {personalResultScene} from './personal-result-scene.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {SceneTimeNotice,SceneEcho} from './SceneEcho.tsx'
import {RoomTableau} from './RoomTableau.tsx'

// Normal in-memory gameplay/public UI; no persistence APIs or saved fixtures.
const captured=vi.hoisted(()=>({notice:null as ComponentProps<typeof SceneTimeNotice>|null,room:null as ComponentProps<typeof RoomTableau>|null}))
vi.mock('./SceneEcho.tsx',async original=>{const actual=await original<typeof import('./SceneEcho.tsx')>();return {...actual,SceneTimeNotice:(p:ComponentProps<typeof actual.SceneTimeNotice>)=>{captured.notice=p;return <actual.SceneTimeNotice {...p}/>}}})
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{captured.room=p;return <actual.RoomTableau {...p}/>}}})
afterEach(()=>{captured.notice=null;captured.room=null;vi.clearAllMocks()})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'result-scene-ui',actorId:'player',commandId:'create',seed:'result-scene-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'result-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(r));return r.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
function complete(run:GameRun,date='2020-01-08',throughDeadline=true){
 let old=run,next=run
 if(throughDeadline&&next.timeline.cursor.date<'2020-01-06'&&date>'2020-01-06')next=act(next,'AdvanceTime',{date:'2020-01-06'})
 for(let i=0;i<4&&next.timeline.cursor.date<date;i++){old=next;next=act(next,'AdvanceTime',{date})}
 if(next.timeline.cursor.date!==date)throw Error('ACTUAL_DATE_REQUIRED')
 const before=view(old),after=view(next),receipt=after.receipts.at(-1)!,feedback=inspectPublicWaitTransition(before,after)
 const result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:date,before,lastBefore:before,lastSaved:after,current:after,steps:[{commandId:receipt.commandId,date:after.date,revisionBefore:before.revision,revisionAfter:after.revision}],feedback,failed:null}
 return {run:next,before,after,result,notice:waitSceneResult(result,after)!}
}
function input(e:ReturnType<typeof complete>){const features=e.after.features as unknown as PlayFeatures;return {view:e.after,features,controller:{snapshot:{view:e.after,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(e.run,command,registry,e.run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller'],request:vi.fn(),accountId:'personal'} satisfies GamePanelProps}
function focus(p:GamePanelProps):OpeningFocus{const job=p.features.life.jobs[0]!;if(job.kind!=='rest'&&job.kind!=='workspace')throw Error('PERSONAL_FOCUS_REQUIRED');return {runId:p.view.runId,kind:'life',accountId:'personal',entityId:job.id,selection:job.kind}}


function ctx(e:ReturnType<typeof complete>,f?:OpeningFocus){const p=input(e),selected=f??focus(p),thread=playerThread(p,selected),today=todayThread(p,selected)!,next=completedDayChoice(p,today)!;return {e,p,selected,thread,next,notice:{date:p.view.date,...e.notice}}}
function life(kind:'rest'|'workspace'){return ctx(complete(act(initial,'StartLifeWork',{kind,personId:null,reference:null})))}
function study(definitionId:string){const run=act(initial,'ResearchMarket',{definitionId}),date=(view(run).features as unknown as PlayFeatures).market.researches[0]!.completeAt,e=complete(run,date),p=input(e),f:OpeningFocus={runId:p.view.runId,kind:'market',accountId:'personal',entityId:p.features.market.researches[0]!.id,entityKind:'research'};return ctx(e,f)}
function render(c:ReturnType<typeof ctx>,notice:typeof c.notice|null=c.notice){const onClose=vi.fn(),accountName=()=> '个人账户',recordAction=<button type="button" onClick={vi.fn()}>原阅读入口</button>,feedback=notice?<SceneTimeNotice {...notice} compact onClose={onClose} accountName={accountName} recordAction={recordAction}/>:null,html=renderToStaticMarkup(<OpeningMoment p={c.p} focus={c.selected} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={feedback}/>);return {html,onClose,accountName,recordAction,notice:captured.notice,room:captured.room!}}

it.each(['rest','workspace'] as const)('combines the actual completed %s and real original cost/AP into one first layer while the title asks for the next choice',kind=>{
 const c=life(kind),before=JSON.stringify(c.p.view),v=personalResultScene(c.p,c.thread,c.next,c.notice)!,r=render(c),facts=renderToStaticMarkup(<>{r.room.facts}</>)
 expect(v.title).toBe(kind==='rest'?'歇过之后，想怎样继续？':'住处变好了，接下来呢？');expect(v.brief).toBe((kind==='rest'?'休整结束':'桌椅与照明已改善')+' · 已付'+(kind==='rest'?'¥0':'¥3,000')+' / 已用1点；行动不返还，不产生收入。');expect(r.html).toContain(v.title);expect(r.html).toContain(v.brief!);expect(facts).toBe('');expect(r.html).toContain('安排接下来的日子');expect(JSON.stringify(c.p.view)).toBe(before);expect(c.p.request).not.toHaveBeenCalled()
})
it.each(['market-overview','market-foundation-course','simulation-special-study'])('reads a proven %s once, with its actual next question and original qualification/boundary',id=>{
 const c=study(id),v=personalResultScene(c.p,c.thread,c.next,c.notice)!,r=render(c)
 expect(v.title).toBe('研究有了结果，接下来呢？');expect(v.brief).toBe(id==='market-overview'?'公开线索已整理；买卖仍由你决定。':id==='market-foundation-course'?'已取得本局模拟规则研习资格；买卖仍须显选。':'已取得本局模拟试验段资格；不保证标的可交易。');expect(r.html.split(v.brief!)).toHaveLength(2);expect(renderToStaticMarkup(<>{r.room.facts}</>)).toBe('');expect(c.p.request).not.toHaveBeenCalled()
})
it('changes only the displayed brief and retains exact full text/frame/close/account and reading references',()=>{
 const c=life('workspace'),original=JSON.stringify(c.notice),r=render(c),actual=r.notice!
 expect(actual.text).toBe(c.notice.text);expect(actual.frame).toBe(c.notice.frame);expect(actual.onClose).toBe(r.onClose);expect(actual.accountName).toBe(r.accountName);expect(actual.recordAction).toBe(r.recordAction);expect(actual.brief).toBe(personalResultScene(c.p,c.thread,c.next,c.notice)!.brief)
 const full=renderToStaticMarkup(<SceneEcho text={actual.text} frame={actual.frame} onClose={vi.fn()} accountName={r.accountName}/>);expect(full).toContain('2020-01-08');expect(full).toContain('预留行动');expect(full).toContain('已用行动');expect(full).toContain('桌椅与照明已经改善');actual.onClose();expect(r.onClose).toHaveBeenCalledOnce();expect(JSON.stringify(c.notice)).toBe(original)
})
it.each(['rest','workspace'] as const)('keeps the same %s next question after dismiss and restores all original dated facts',kind=>{
 const c=life(kind),shown=render(c),closed=render(c,null),question=personalResultScene(c.p,c.thread,c.next)!.title
 expect(shown.html).toContain(question);expect(closed.html).toContain(question);expect(closed.html).toContain('2020-01-08已完成 · 已付'+(kind==='rest'?'¥0':'¥3,000'));expect(closed.html).not.toContain('休整结束 · 已付');expect(closed.html).toContain('安排接下来的日子');expect(closed.html).toContain('翻阅这一段的记录与代价')
})
it('keeps extra responsibilities, unfamiliar narration, changed cash/AP or stale frames in the complete original first layer',()=>{
 const c=life('workspace'),f=c.notice.frame
 for(const notice of [{...c.notice,text:c.notice.text+' 原款¥500仍未收。'},{...c.notice,brief:'另一份原安排已有实际结果。'},{...c.notice,frame:{...f,pointsBefore:f.pointsBefore+1}},{...c.notice,frame:{...f,accounts:f.accounts.map(a=>({...a,before:a.before!+100}))}},{...c.notice,date:'2020-01-09'}]){
  expect(personalResultScene(c.p,c.thread,c.next,notice)!.brief).toBeNull();const r=render(c,notice);expect(r.notice!.text).toBe(notice.text);expect(renderToStaticMarkup(<>{r.room.facts}</>)).toContain('已付¥3,000 / 已用1点')
 }
})
it('leaves proven parallel completion text and costs visible, without guessing its membership from a sentence',()=>{
 const run=act(act(initial,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-foundation-course'}),c=ctx(complete(run)),r=render(c)
 expect(personalResultScene(c.p,c.thread,c.next,c.notice)!.brief).toBeNull();expect(r.notice!.brief).toBe(c.notice.brief);expect(r.html).toContain('桌椅与照明已改善；规则研习资格已取得。');expect(renderToStaticMarkup(<>{r.room.facts}</>)).toContain('已付¥3,000 / 已用1点')
})
it('keeps the next question about existing work when the completed life has one original continuation',()=>{
 const run=act(act(initial,'WorkQuarter'),'StartLifeWork',{kind:'rest',personId:null,reference:null}),c=ctx(complete(run)),v=personalResultScene(c.p,c.thread,c.next,c.notice)!,r=render(c)
 expect(c.next.kind).toBe('focus');expect(v.title).toBe('歇过之后，手头的事还在。');expect(r.html).toContain('继续本季工作');expect(r.html).toContain('核对后推进');expect(c.p.request).not.toHaveBeenCalled()
})
it('rejects stale or unrelated source and history, keeping unknown entitlement or original object explanations intact',()=>{
 const c=study('market-foundation-course')
 expect(personalResultScene(c.p,c.thread,{...c.next,revision:c.next.revision-1},c.notice)).toBeNull();expect(personalResultScene(c.p,{...c.thread,focusScope:'history'},c.next,c.notice)).toBeNull();expect(personalResultScene(c.p,c.thread,{...c.next,sourceId:'other'},c.notice)).toBeNull()
 const p={...c.p,features:{...c.p.features,market:{...c.p.features.market,permissions:c.p.features.market.permissions.filter(a=>a.sourceId!==c.selected.entityId)}}};expect(personalResultScene(p,c.thread,c.next,c.notice)).toBeNull()
})
