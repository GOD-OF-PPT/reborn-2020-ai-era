import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {SceneTimeNotice} from './SceneEcho.tsx'
import {workOutcome} from './work-outcome.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'

// Normal in-memory proposals, public facts and original reading actions only.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'work-history-ui',actorId:'player',commandId:'create',seed:'work-history-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'history-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run:GameRun){const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};const p:GamePanelProps={view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']};const focus:OpeningFocus={runId:run.runId,kind:'work',accountId:'personal',entityId:view.operations?.employment[0]?.id??null};return {p,focus,thread:playerThread(p,focus)}}
function until(run:GameRun,date:string){for(let n=0;n<30;n++){const w=context(run).p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.costFen||c.actionPoints)throw Error('EXPECTED_FREE_ORIGINAL_REPLY');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const work=act(act(initial,'SkipOffer',{offerId:context(initial).p.features.firstOrder.offerId}),'WorkQuarter')


const captured=vi.hoisted(()=>({room:null as Record<string,unknown>|null}))
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{captured.room=p as unknown as Record<string,unknown>;return <actual.RoomTableau {...p}/>}}})
afterEach(()=>{captured.room=null})
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer),...nodes(n.props.recordAction)]:[]
const words=(n:unknown):string=>typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function complete(run:GameRun,date:string,ready:(p:GamePanelProps)=>boolean){let beforeRun=run
 for(let n=0;n<40;n++){const c=context(run);if(c.p.view.date>=date&&ready(c.p))break;const w=c.p.features.workbench;if(w.pause){const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;if(choice.costFen||choice.actionPoints)throw Error('FREE_ORIGINAL_REPLY_REQUIRED');run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}beforeRun=run;run=act(run,'AdvanceTime',{date})}
 const c=context(run),before=context(beforeRun).p.view,after=c.p.view,last=after.receipts.at(-1)!
 if(!ready(c.p)||last.kind!=='AdvanceTime')throw Error('ACTUAL_COMPLETION_REQUIRED')
 const result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:date,before,lastBefore:before,lastSaved:after,current:after,steps:[{commandId:last.commandId,date:after.date,revisionBefore:before.revision,revisionAfter:after.revision}],feedback:inspectPublicWaitTransition(before,after),failed:null},reading=waitSceneResult(result,after)
 if(!reading)throw Error('ORIGINAL_READING_REQUIRED')
 return {run,...c,notice:{date:after.date,...reading}}
}
const restStarted=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),bothStarted=act(restStarted,'ResearchMarket',{definitionId:'market-overview'})
const study=complete(bothStarted,'2020-01-02',p=>p.features.market.researches.some(r=>r.status==='completed'))
const rested=complete(study.run,'2020-01-08',p=>p.features.life.jobs.some(j=>j.kind==='rest'&&j.status==='completed'))
function render(c:typeof study,visible=true){const navigate=vi.fn(),html=renderToStaticMarkup(<OpeningMoment p={c.p} focus={c.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={navigate} onExplore={vi.fn()} feedback={visible?<SceneTimeNotice {...c.notice} compact onClose={vi.fn()} accountName={()=>'个人'}/>:null}/>);return {html,navigate,room:captured.room!}}

it('turns the actual public-study completion into its own record and a separate market reading',()=>{
 const original=JSON.stringify(study.notice),outcome=workOutcome(study.p,study.thread,study.notice)!
 expect(outcome.brief).toBe('公开资料已整理好；买卖仍由你决定。');expect(outcome.record.target.recordId).toBe(study.p.features.market.researches[0]!.id);expect(outcome.next).toEqual({label:'看看模拟判断',screen:'market',target:{accountId:'personal'}});expect(JSON.stringify(study.notice)).toBe(original)
 const {html,navigate,room}=render(study),notice=nodes(room.feedback).find(n=>n.type===SceneTimeNotice)!
 expect(notice.props.text).toBe(study.notice.text);expect(notice.props.frame).toBe(study.notice.frame);expect(html).toContain('研究记录 ↗');expect(html).toContain(outcome.brief)
 const read=nodes(notice.props.recordAction).find(n=>n.type==='button')!;(read.props.onClick as ()=>void)();expect(navigate).toHaveBeenLastCalledWith('market',outcome.record.target)
 const next=nodes(room.decisions).find(n=>n.type==='button'&&words(n.props.children).includes('看看模拟判断'))!;(next.props.onClick as ()=>void)();expect(navigate).toHaveBeenLastCalledWith('market',{accountId:'personal'});expect(study.p.request).not.toHaveBeenCalled();expect(study.p.requestWait).not.toHaveBeenCalled()
})

it('keeps the real rest cost and original job, then leads explicitly to people without making a promise',()=>{
 const outcome=workOutcome(rested.p,rested.thread,rested.notice)!,job=rested.p.features.life.jobs.find(j=>j.kind==='rest')!
 expect(outcome.brief).toBe('休整已完成 · 原投入¥0 / 1点。');expect(outcome.record.target).toEqual({accountId:'personal',recordId:job.id,lifeSelection:'rest',returnToRoom:true})
 const {html,navigate,room}=render(rested);expect(html).toContain('休整记录 ↗');expect(html).toContain('核对后推进 · 2020-01-31');expect(html.match(/class="clock-advance clock-advance-room"/g)).toHaveLength(1)
 const next=nodes(room.decisions).find(n=>n.type==='button'&&words(n.props.children).includes('看看相识的人'))!;(next.props.onClick as ()=>void)();expect(navigate).toHaveBeenCalledExactlyOnceWith('life',{accountId:'personal',lifeSelection:'person'});expect(rested.p.request).not.toHaveBeenCalled()
})

it('reports the already-paid workspace cost rather than pretending it is a new completion charge',()=>{
 const begun=act(work,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),c=complete(begun,'2020-01-08',p=>p.features.life.jobs.some(j=>j.kind==='workspace'&&j.status==='completed')),outcome=workOutcome(c.p,c.thread,c.notice)!
 expect(outcome.brief).toBe('住处改善已完成 · 原投入¥3,000 / 1点。');expect(c.notice.frame.accounts.every(a=>a.before===a.after)).toBe(true);expect(outcome.record.target.lifeSelection).toBe('workspace')
 const {html,room}=render(c);expect(html).toContain('安排工作之外的时间');expect(nodes(room.decisions).some(n=>n.type==='button'&&words(n.props.children).includes('看看相识的人'))).toBe(false);expect(html.match(/class="clock-advance clock-advance-room"/g)).toHaveLength(1)
})

it('keeps simultaneous completions, actual living costs and extra narration in the original full reading',()=>{
 const mixed=complete(act(restStarted,'ResearchMarket',{definitionId:'market-foundation-course'}),'2020-01-08',p=>p.features.life.jobs.some(j=>j.status==='completed')&&p.features.market.researches.some(r=>r.status==='completed'))
 expect(workOutcome(mixed.p,mixed.thread,mixed.notice)).toBeNull()
 const before=act(until(work,'2020-01-31'),'ResearchMarket',{definitionId:'market-overview'}),paid=complete(before,'2020-02-01',p=>p.features.market.researches.some(r=>r.status==='completed'))
 expect(paid.notice.frame.accounts.some(a=>a.before!==a.after)).toBe(true);expect(workOutcome(paid.p,paid.thread,paid.notice)).toBeNull()
 expect(workOutcome(study.p,study.thread,{...study.notice,text:study.notice.text+' 另有原义务待核对。'})).toBeNull()
})

it('retires only the contextual shortcuts when the echo is put away and leaves the original work navigation intact',()=>{
 const withEcho=render(rested),without=render(rested,false)
 expect(withEcho.html).toContain('休整记录 ↗');expect(without.html).not.toContain('休整记录 ↗');expect(without.html).toContain('回到今天，看看其它安排');expect(without.html).toContain('翻开手记');expect(without.html).toContain('等工作回响 · 2020-01-31')
 expect(workOutcome(rested.p,{...rested.thread,focusScope:'history'},rested.notice)).toBeNull()
})
