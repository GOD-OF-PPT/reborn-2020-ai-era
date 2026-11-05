import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {todayThread} from './today-thread.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {personInvitationLine,personTimeReading} from './person-time-reading.ts'
import {NarrativeScene} from './NarrativeScene.tsx'
import {TodayScene} from './TodayScene.tsx'
import {SceneTimeNotice} from './SceneEcho.tsx'

// Normal in-memory proposals and public reading only; no persistence fixtures.
const captured=vi.hoisted(()=>({notices:[] as Record<string,unknown>[]}))
vi.mock('./SceneEcho.tsx',async original=>{const actual=await original<typeof import('./SceneEcho.tsx')>();return {...actual,SceneTimeNotice:(p:ComponentProps<typeof actual.SceneTimeNotice>)=>{captured.notices.push(p as unknown as Record<string,unknown>);return <actual.SceneTimeNotice {...p}/>}}})
afterEach(()=>{captured.notices=[]})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'person-time-ui',actorId:'player',commandId:'create',seed:'person-time-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'person-time-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
function input(run:GameRun):GamePanelProps{const v=view(run);return {view:v,features:v.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view:v,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function reading(beforeRun:GameRun,run:GameRun){const before=view(beforeRun),current=view(run),last=current.receipts.at(-1)!,result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:current.date,before,lastBefore:before,lastSaved:current,current,steps:[{commandId:last.commandId,date:current.date,revisionBefore:before.revision,revisionAfter:current.revision}],feedback:inspectPublicWaitTransition(before,current),failed:null},p=input(run),notice={date:current.date,...waitSceneResult(result,current)!},progress=lifeSceneProgress(p.features.life,current.date,'tang-ying');return {p,notice,progress}}
function until(run:GameRun,date:string){let before=run;for(let i=0;i<100;i++){if(run.timeline.cursor.date>=date)return {run,before};const w=input(run).features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,choice=e.choices.find(c=>c.isDefault)!;if(choice.costFen||choice.actionPoints)throw Error('EXPECTED_FREE_DEFAULT');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:choice.id});continue}before=run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const started=act(initial,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),met=act(started,'AdvanceTime',{date:'2020-01-04'}),offered=reading(started,met),promise=offered.progress.promise!,accepted=act(met,'AcceptLifePromise',{promiseId:promise.id,consent:true}),working=act(accepted,'FulfillLifePromise',{promiseId:promise.id}),afterOffer=act(working,'AdvanceTime',{date:'2020-01-06'}),finished=until(afterOffer,'2020-01-07'),fulfilled=reading(finished.before,finished.run),expiredStep=until(act(met,'AdvanceTime',{date:'2020-01-06'}),'2020-01-19'),expired=reading(expiredStep.before,expiredStep.run),beforeDeadline=until(accepted,'2020-02-17').run,missedRun=act(beforeDeadline,'AdvanceTime',{date:'2020-02-18'}),missed=reading(beforeDeadline,missedRun)
function scene(c:ReturnType<typeof reading>){const dismiss=vi.fn(),props:ComponentProps<typeof NarrativeScene>={...c.p,screen:'life',lifeMode:'person',personId:'tang-ying',headingRef:null,onPerson:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onOpen:vi.fn(),onNavigate:vi.fn(),onDismissReceipt:dismiss,receipt:c.notice.text,receiptBrief:c.notice.brief,receiptKind:'AdvanceTime',echoFrame:c.notice.frame};return {html:renderToStaticMarkup(<NarrativeScene {...props}/>),dismiss}}

it('reports completed time and original paid resources alongside the new invitation',()=>{
 const c=offered,before=JSON.stringify(c.notice),short=personTimeReading(c.p,c.progress,c.notice)!
 expect(c.progress.stage).toBe('offered');expect(short.brief).toContain('已付¥200 / 已用1点');expect(short.brief).toContain('有一份新邀请')
 const {html,dismiss}=scene(c),actual=captured.notices.at(-1)!
 expect(html).toContain(short.brief);expect(html).toContain('邀请：留出一次陪伴');expect(html).not.toContain('留出一次已经答应的陪伴；');expect(html).toContain('看清约定后答应');expect(html).toContain('以后仍需个人¥300');expect(html).toContain('2020-01-18前回应');expect(actual.text).toBe(c.notice.text);expect(actual.frame).toBe(c.notice.frame)
 ;(actual.onClose as ()=>void)();expect(dismiss).toHaveBeenCalledTimes(1);expect(JSON.stringify(c.notice)).toBe(before);expect(c.p.request).not.toHaveBeenCalled()
})
it('keeps fulfilled, expired and missed promises semantically distinct with actual original records',()=>{
 for(const [c,word] of [[fulfilled,'已兑现'],[expired,'已过回应期限'],[missed,'已到期未兑现']] as const){const short=personTimeReading(c.p,c.progress,c.notice)!;expect(short?.brief,JSON.stringify(c.notice)).toContain(word);expect(scene(c).html).toContain(short.brief);expect(c.p.request).not.toHaveBeenCalled()}
 expect(personTimeReading(fulfilled.p,fulfilled.progress,fulfilled.notice)!.brief).toContain('原投入¥300 / 1点')
 expect(personTimeReading(missed.p,missed.progress,missed.notice)!.brief).not.toContain('已付¥300');expect(missed.progress.job).toBeNull()
})
it('supports another actual shared activity without inventing another annual invitation',()=>{
 const declined=act(met,'DeclineLifePromise',{promiseId:promise.id}),april=until(declined,'2020-04-02').run,again=act(april,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),completed=until(again,'2020-04-05'),c=reading(completed.before,completed.run),short=personTimeReading(c.p,c.progress,c.notice)!
 expect(c.progress.stage).toBe('completed');expect(c.progress.promise).toBeNull();expect(short?.brief,JSON.stringify(c.notice)).toContain('这次相处已完成');expect(short.brief).not.toContain('新邀请');expect(short.brief).toContain('¥200')
})
it('only adapts Today when its original current promise identity still matches',()=>{
 const c=fulfilled,focus={runId:c.p.view.runId,kind:'life' as const,accountId:'personal',selection:'tang-ying' as const,entityId:promise.id},today=todayThread(c.p,focus)!,onClose=vi.fn(),accountName=()=> '个人账户',feedback=<SceneTimeNotice {...c.notice} compact onClose={onClose} accountName={accountName}/>,render=(t= today)=>renderToStaticMarkup(<TodayScene p={c.p} today={t} headingRef={null} feedback={feedback} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/> )
 const html=render(),actual=captured.notices.at(-1)!
 expect(html).toContain('原投入¥300 / 1点');expect(actual.text).toBe(c.notice.text);expect(actual.frame).toBe(c.notice.frame);expect(actual.onClose).toBe(onClose);expect(actual.accountName).toBe(accountName)
 expect(render({...today,primary:{...today.primary,thread:{...today.primary.thread,focusScope:'history'}}})).not.toContain('原投入¥300 / 1点')
 expect(personTimeReading(c.p,c.progress,c.notice,'another')).toBeNull();expect(render({...today,source:{...today.source,quarter:'2020-Q2'}})).not.toContain('原投入¥300 / 1点')
})
it('preserves mixed money, other responsibilities, future dates, duplicate and wrong-person sources',()=>{
 const c=offered,frame=c.notice.frame
 for(const notice of [{...c.notice,text:c.notice.text+' 另一笔原款尚未处理。'},{...c.notice,date:'2020-01-05'},{...c.notice,brief:'别的事情有变化。'},{...c.notice,frame:null},{...c.notice,frame:{...frame,quarterChanged:true}},{...c.notice,frame:{...frame,accounts:frame.accounts.map(a=>({...a,after:a.after-100}))}}])expect(personTimeReading(c.p,c.progress,notice)).toBeNull()
 expect(personTimeReading(c.p,{...c.progress,selection:'linzhou'},c.notice)).toBeNull();expect(personTimeReading(c.p,{...c.progress,person:{...c.progress.person!,known:false}},c.notice)).toBeNull()
 expect(personTimeReading({...c.p,features:{...c.p.features,life:{...c.p.features.life,promises:[...c.p.features.life.promises,promise]}}},c.progress,c.notice)).toBeNull()
 const mixed={...c,notice:{...c.notice,text:c.notice.text+' 原责任仍需回应。'}};expect(scene(mixed).html).not.toContain('已付¥200 / 已用1点。有一份新邀请')
})
it('keeps a withdrawn-invitation public UI example separate from player failure',()=>{
 // A public reading-shape example, not a legal NPC withdrawal on this January date.
 const c=expired,original=c.progress.promise!,row={...original,status:'npc_declined' as const},life={...c.p.features.life,promises:c.p.features.life.promises.map(p=>p.id===row.id?row:p),people:c.p.features.life.people.map(person=>person.id===row.personId?{...person,promises:person.promises.map(p=>p.id===row.id?row:p)}:person)},p={...c.p,features:{...c.p.features,life}},progress=lifeSceneProgress(life,p.view.date,'tang-ying'),cause=p.view.date+'，与唐萤的约定由对方按自己的安排撤回尚未接受的邀请，不记玩家失约。',oldCause=p.view.date+'，1份尚未接受的邀请已到期，没有自动接受、付款或完成。',notice={...c.notice,text:c.notice.text.replace(oldCause,cause),brief:c.notice.brief.replace(oldCause,cause)}
 expect(personTimeReading(p,progress,notice)?.brief).toBe('唐萤撤回尚未接受的邀请；不记作你失约。')
})

it('retains a genuinely mixed original command that also contains the earlier first-offer expiry',()=>{
 const run=act(working,'AdvanceTime',{date:'2020-01-07'}),c=reading(working,run)
 expect(c.notice.text).toContain('那份原委托，有了新的实际反馈。');expect(personTimeReading(c.p,c.progress,c.notice)).toBeNull()
})

it('keeps an unaccepted invitation’s current wording after its echo closes, while preserving the original title',()=>{
 const c=offered,props:ComponentProps<typeof NarrativeScene>={...c.p,screen:'life',lifeMode:'person',personId:'tang-ying',headingRef:null,onPerson:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onOpen:vi.fn(),onNavigate:vi.fn(),receipt:null},html=renderToStaticMarkup(<NarrativeScene {...props}/>)
 expect(html).toContain('邀请：留出一次陪伴');expect(html).toContain('接受后仍要另行安排');expect(html).toContain('以后仍需个人¥300');expect(c.progress.person!.promiseTerms.title).toBe('留出一次已经答应的陪伴')
 expect(personInvitationLine(fulfilled.p,fulfilled.progress)).toBeNull();expect(c.p.request).not.toHaveBeenCalled()
})
