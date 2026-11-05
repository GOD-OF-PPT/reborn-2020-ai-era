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
import {savedSceneResult} from './scene-result.ts'
import {personalParallelFeedback,personalParallelResults} from './personal-parallel-feedback.ts'
import {parallelResultReading,todayPersonalResultReading} from './personal-result-reading.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {TodayScene} from './TodayScene.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {SceneTimeNotice,SceneEcho} from './SceneEcho.tsx'
import {RoomTableau} from './RoomTableau.tsx'

// Original normal in-memory gameplay and public UI. No store/codec/import/export.
const capture=vi.hoisted(()=>({notice:null as ComponentProps<typeof SceneTimeNotice>|null,room:null as ComponentProps<typeof RoomTableau>|null}))
vi.mock('./SceneEcho.tsx',async original=>{const actual=await original<typeof import('./SceneEcho.tsx')>();return {...actual,SceneTimeNotice:(p:ComponentProps<typeof actual.SceneTimeNotice>)=>{capture.notice=p;return <actual.SceneTimeNotice {...p}/>}}})
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{capture.room=p;return <actual.RoomTableau {...p}/>}}})
afterEach(()=>{capture.notice=null;capture.room=null;vi.clearAllMocks()})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'result-members-ui',actorId:'player',commandId:'create',seed:'result-members-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
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


const begun=(kind:'rest'|'workspace'='workspace',working=false)=>{const from=working?act(initial,'WorkQuarter'):initial;return act(act(from,'StartLifeWork',{kind,personId:null,reference:null}),'ResearchMarket',{definitionId:'market-foundation-course'})}
function ctx(e:ReturnType<typeof complete>,selection:'life'|'research'|'work'='life'){const p=input(e),f:OpeningFocus=selection==='life'?focus(p):selection==='research'?{runId:p.view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:p.features.market.researches[0]!.id}:{runId:p.view.runId,kind:'work',accountId:'personal',entityId:p.view.operations!.employment[0]!.id},thread=playerThread(p,f),today=todayThread(p,f)!,notice={date:p.view.date,...e.notice};return {e,p,f,thread,today,notice}}
const readNotice=():ComponentProps<typeof SceneTimeNotice>|null=>capture.notice
const readRoom=():ComponentProps<typeof RoomTableau>|null=>capture.room
function render(c:ReturnType<typeof ctx>,scene:'room'|'today'='room',notice:typeof c.notice|null=c.notice){capture.notice=null;capture.room=null;const onClose=vi.fn(),accountName=()=> '个人账户',recordAction=<button type="button" onClick={vi.fn()}>原结果记录</button>,feedback=notice?<SceneTimeNotice {...notice} compact onClose={onClose} accountName={accountName} recordAction={recordAction}/>:null,html=renderToStaticMarkup(scene==='room'?<OpeningMoment p={c.p} focus={c.f} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={feedback}/>:<TodayScene p={c.p} today={c.today} headingRef={null} feedback={feedback} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>);return {html,onClose,accountName,recordAction,notice:readNotice(),room:readRoom()!}}

it('produces the complete actual memberships from the same original two-sided proof and retains the original brief API',()=>{
 const e=complete(begun()),cause=savedSceneResult('AdvanceTime','原等待',e.before,e.after,{includeCash:false}),rows=e.result.feedback.filter(r=>r.attention==='pause'),v=personalParallelResults(e.before,e.after,cause,rows)!,proof=e.notice.personalResults!
 expect(v.brief).toBe(personalParallelFeedback(e.before,e.after,cause,rows));expect(e.notice.brief).toBe(v.brief);expect(proof.members).toEqual(v.results.members);expect(proof).toMatchObject({runId:e.after.runId,revision:e.after.revision,date:e.after.date,text:e.notice.text,brief:e.notice.brief});expect(proof.frame).toBe(e.notice.frame)
 const life=proof.members.find(m=>m.kind==='life')!;expect(life).toMatchObject({kind:'life',work:'workspace',costFen:300000,actionPoints:1,completeAt:'2020-01-08'});expect(proof.members.find(m=>m.kind==='research')).toMatchObject({definitionId:'market-foundation-course',entitlementId:'sim-researched',completeAt:'2020-01-08'});expect(e.notice.text).toContain('桌椅与照明已经改善');expect(e.notice.text).toContain('1项市场研究已完成')
})
it.each(['life','research'] as const)('shows complete real result and original life investment once in room and Today while %s is selected',selection=>{
 const c=ctx(complete(begun()),selection),before=JSON.stringify(c.p.view),v=parallelResultReading(c.p,c.thread,c.notice)!
 expect(v.coversSelected).toBe(true);expect(v.brief).toBe('桌椅与照明已改善（原投入¥3,000 / 1点）；规则研习资格已取得。已用行动不返还，买卖仍由你决定。')
 for(const scene of ['room','today'] as const){const r=render(c,scene);expect(r.html).toContain(v.brief);expect(r.html.split('原投入¥3,000 / 1点')).toHaveLength(2);expect(renderToStaticMarkup(<>{r.room.facts}</>)).toBe('');expect(r.html).toContain(scene==='room'?'安排接下来的日子':'工作，还是留点时间给自己？');expect(r.notice!.personalResults).toBe(c.notice.personalResults);expect(c.p.request).not.toHaveBeenCalled()}
 expect(JSON.stringify(c.p.view)).toBe(before)
})
it('retains exact original raw text/frame/close/account and reader references through the new composed rendering',()=>{
 const c=ctx(complete(begun())),r=render(c),v=r.notice!
 expect(v.text).toBe(c.notice.text);expect(v.frame).toBe(c.notice.frame);expect(v.onClose).toBe(r.onClose);expect(v.accountName).toBe(r.accountName);expect(v.recordAction).toBe(r.recordAction);expect(v.personalResults).toBe(c.notice.personalResults)
 const full=renderToStaticMarkup(<SceneEcho text={v.text} frame={v.frame} onClose={vi.fn()} accountName={r.accountName}/>);expect(full).toContain('2020-01-08');expect(full).toContain('已用行动');expect(full).toContain('桌椅与照明已经改善');expect(full).toContain('不是未来价格');v.onClose();expect(r.onClose).toHaveBeenCalledOnce();expect(c.p.request).not.toHaveBeenCalled()
})
it('rejects missing/duplicate/foreign/cost/action/date/entitlement membership and different original notices without collapsing their old explanations',()=>{
 const c=ctx(complete(begun())),n=c.notice,p=n.personalResults!
 const altered=[{...p,runId:'other'},{...p,revision:p.revision-1},{...p,date:'2020-01-09'},{...p,members:p.members.slice(1)},{...p,members:[p.members[0]!,p.members[0]!]},{...p,members:p.members.map(m=>({...m,actionId:'unbound-original-action'}))},{...p,members:p.members.map(m=>m.kind==='life'?{...m,costFen:m.costFen+100}:m)},{...p,members:p.members.map(m=>m.kind==='research'?{...m,entitlementId:'unverified-right'}:m)},{...p,frame:{...n.frame}}]
 for(const proof of altered)expect(parallelResultReading(c.p,c.thread,{...n,personalResults:proof})).toBeNull()
 for(const notice of [{...n,text:n.text+' 原客户款¥500尚待处理。'},{...n,brief:n.brief+' 另一件事。'},{...n,date:'2020-01-09'}]){expect(parallelResultReading(c.p,c.thread,notice)).toBeNull();const r=render(c,'room',notice);expect(r.notice!.text).toBe(notice.text);expect(renderToStaticMarkup(<>{r.room.facts}</>)).toContain('已付¥3,000 / 已用1点')}
 const missing={...c.p,features:{...c.p.features,market:{...c.p.features.market,permissions:[]}}};expect(parallelResultReading(missing,c.thread,n)).toBeNull()
})
it('keeps original work facts and continuation in Today while reporting the parallel personal results',()=>{
 const c=ctx(complete(begun('rest',true)),'work'),v=parallelResultReading(c.p,c.thread,c.notice)!,r=render(c,'today')
 expect(v.coversSelected).toBe(false);expect(r.html).toContain('休整结束（原投入¥0 / 1点）');expect(r.html).toContain('规则研习资格已取得');expect(r.html).toContain('工作还在继续，今天怎么过');expect(renderToStaticMarkup(<>{r.room.facts}</>)).toContain('本季尚无工资实收');expect(r.html).toContain('继续这季的工作')
})
it('does not use changed current quoted study cost as an historical actual payment or infer a profit',()=>{
 const c=ctx(complete(begun())),quoted={...c.p,features:{...c.p.features,workbench:{...c.p.features.workbench,researches:c.p.features.workbench.researches.map(r=>({...r,costFen:999900}))}}},v=parallelResultReading(quoted,c.thread,c.notice)!
 expect(v.brief).toContain('原投入¥3,000 / 1点');expect(v.brief).not.toContain('9,999');expect(v.brief).not.toContain('利润');expect(v.brief).not.toContain('研究已付')
})
it('keeps the same Today result question after dismiss and restores current selected original date/cost or qualification',()=>{
 for(const selection of ['life','research'] as const){const c=ctx(complete(begun()),selection),shown=render(c,'today'),closed=render(c,'today',null);expect(shown.html).toContain(selection==='life'?'住处变好了，接下来呢？':'研究有了结果，接下来呢？');expect(closed.html).toContain(selection==='life'?'住处变好了，接下来呢？':'研究有了结果，接下来呢？');expect(closed.html).toContain('2020-01-08');expect(closed.html).toContain(selection==='life'?'投入¥3,000':'已取得本局模拟规则研习资格');expect(c.p.request).not.toHaveBeenCalled()}
})
it('reuses the single-result composition in Today without another cost paragraph and keeps original facts on dismissal',()=>{
 const e=complete(act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null})),c=ctx(e),shown=render(c,'today'),closed=render(c,'today',null)
 expect(shown.html).toContain('歇过之后，想怎样继续？');expect(shown.html).toContain('休整结束 · 已付¥0 / 已用1点');expect(renderToStaticMarkup(<>{shown.room.facts}</>)).toBe('');expect(closed.html).toContain('2020-01-08实际完成，投入¥0');expect(closed.html).toContain('歇过之后，想怎样继续？')
})
it('does not discard an extra or unfamiliar Today situation even when original membership is valid',()=>{
 const c=ctx(complete(begun())),extra='2020-01-08实际完成，投入¥3,000；结果不返还行动，也不产生收入。另有原保护款。',v=todayPersonalResultReading(c.p,c.today,c.notice,extra)!
 expect(v.brief).not.toBeNull();expect(v.coversSituation).toBe(false);expect(todayPersonalResultReading(c.p,{...c.today,source:{...c.today.source,revision:c.p.view.revision-1}},c.notice,extra)).toBeNull();expect(parallelResultReading(c.p,{...c.thread,focusScope:'history'},c.notice)).toBeNull()
})

it('retains real gross cash paid and received even when the available amount has no net change, without a collapsible membership proof',()=>{
 // Explicit public-ledger UI boundary shape, not a legal monthly campaign claim.
 const e=complete(begun()),features=e.after.features as unknown as PlayFeatures,finance=features.workbench.finance.find(a=>a.accountId==='personal')!,sample=finance.transactions[0]!,current={...e.after,features:{...features,workbench:{...features.workbench,finance:features.workbench.finance.map(a=>a.accountId==='personal'?{...a,transactions:[...a.transactions,{...sample,id:'shape-paid',sourceId:'shape-paid',date:e.after.date,amountFen:-400000},{...sample,id:'shape-received',sourceId:'shape-received',date:e.after.date,amountFen:400000}]}:a)}}},reading=waitSceneResult({...e.result,lastSaved:current,current},current)!
 expect(reading.frame.accounts[0]!.before).toBe(reading.frame.accounts[0]!.after);expect(reading.brief).toContain('个人实际付出¥4,000，另收到¥4,000');expect(reading.personalResults).toBeUndefined();expect(reading.text).toContain('性质和逐笔来源仍按原账')
})
