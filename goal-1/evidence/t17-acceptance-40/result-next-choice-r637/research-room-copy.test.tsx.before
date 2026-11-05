import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {researchRoomCopy,researchRoomBrief,researchWaitLabel} from './research-room-copy.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {committedEcho,SceneTimeNotice} from './SceneEcho.tsx'
import {savedSceneResult} from './scene-result.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {DayThreadAction} from './DayThreadAction.tsx'
import type {SharedActionBinding} from './shared-action.ts'

// Normal in-memory proposals and public UI only; no store/controller submission.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'research-room-ui',actorId:'player',commandId:'create',seed:'research-room-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'step-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(result));return result.nextRun}
function view(run:GameRun):PlayingView{return {...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
function context(run:GameRun){const v=view(run),features=v.features as unknown as PlayFeatures,controller={snapshot:{view:v,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller'];const p:GamePanelProps={view:v,features,controller,request:vi.fn(),accountId:'personal'},research=features.market.researches[0]!,focus:OpeningFocus={runId:run.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:research.id};return {p,research,focus,thread:playerThread(p,focus)}}
function start(id:string){const run=act(initial,'ResearchMarket',{definitionId:id}),ctx=context(run),before=view(initial),after=ctx.p.view;return {run,...ctx,notice:{date:after.date,text:savedSceneResult('ResearchMarket','原研究',before,after),frame:committedEcho(before,after)}}}
function finish(run:GameRun){let before=run;const date=run.market!.researches[0]!.completeAt;if(run.timeline.cursor.date<'2020-01-06'&&date>'2020-01-06')run=act(run,'AdvanceTime',{date:'2020-01-06'});for(let n=0;n<10&&run.timeline.cursor.date<date;n++){before=run;run=act(run,'AdvanceTime',{date})}if(run.market!.researches[0]!.status!=='completed')throw Error('ACTUAL_COMPLETION_REQUIRED');const ctx=context(run),old=view(before),after=ctx.p.view,receipt=after.receipts.at(-1)!,result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:date,before:old,lastBefore:old,lastSaved:after,current:after,steps:[{commandId:receipt.commandId,date,revisionBefore:old.revision,revisionAfter:after.revision}],feedback:inspectPublicWaitTransition(old,after),failed:null};return {run,...ctx,notice:{date,...waitSceneResult(result,after)!}}}

it.each([['market-overview','公开研究笔记','¥0'],['market-foundation-course','模拟规则研习笔记','¥3,000'],['simulation-special-study','模拟试验段研习笔记','¥100']] as const)('names the actual %s purpose and reports only its paid cost and used points', (id,name,cost)=>{
 const c=start(id),copy=researchRoomCopy(c.p,c.thread),before=JSON.stringify(c.notice)
 expect(copy?.object).toBe(name);expect(copy?.stage).toBe('研习中 · 等待结果')
 expect(researchRoomBrief(c.p,c.thread,c.notice)).toBe(name+'已开始 · 已付'+cost+' / 已用1点。')
 expect(JSON.stringify(c.notice)).toBe(before)
 expect(copy?.facts.join(' ')).not.toContain('已取得')
})

it.each(['market-overview','market-foundation-course','simulation-special-study'] as const)('shows %s completion and any actual permission from its original source',id=>{
 const c=finish(start(id).run),copy=researchRoomCopy(c.p,c.thread),brief=researchRoomBrief(c.p,c.thread,c.notice)
 expect(copy?.stage).toBe('已完成 · 笔记保留');expect(copy?.facts.join(' ')).toContain(c.research.completeAt)
 expect(brief,JSON.stringify(c.notice)).not.toBeNull()
 if(id==='market-overview')expect(brief).toContain('公开研究笔记已完成')
 else{expect(brief).toContain('已取得本局');expect(c.p.features.market.permissions.some(row=>row.sourceId===c.research.id&&row.date===c.research.completeAt)).toBe(true)}
})

it('keeps mixed or unfamiliar completion narration and every original frame untouched',()=>{
 const c=finish(start('market-overview').run),text=c.notice.text+' 另有原客户款尚待处理。'
 expect(researchRoomBrief(c.p,c.thread,{...c.notice,text})).toBeNull()
 expect(researchRoomBrief(c.p,c.thread,{...c.notice,brief:'实际收到¥100。'+c.notice.brief})).toBeNull()
 expect(researchRoomBrief(c.p,c.thread,{...c.notice,frame:{...c.notice.frame,pointsBefore:c.notice.frame.pointsBefore+1}})).toBeNull()
 const account=c.notice.frame.accounts[0]!
 expect(researchRoomBrief(c.p,c.thread,{...c.notice,frame:{...c.notice.frame,accounts:[{...account,before:account.after+100}]}})).toBeNull()
})

it('does not use current terms as paid cash when ledger or frame evidence disagrees',()=>{
 const c=start('market-foundation-course')
 expect(researchRoomBrief(c.p,c.thread,{...c.notice,text:c.notice.text+' 另有实际支出。'})).toBeNull()
 expect(researchRoomBrief(c.p,c.thread,{...c.notice,frame:{...c.notice.frame!,spentBefore:c.notice.frame!.spentBefore+1}})).toBeNull()
 const changed={...c.p,features:{...c.p.features,workbench:{...c.p.features.workbench,finance:c.p.features.workbench.finance.map(row=>row.accountId==='personal'?{...row,metrics:[]}:row)}}}
 expect(researchRoomBrief(changed,c.thread,c.notice)).toBeNull()
 const changedReceipt={...c.p,view:{...c.p.view,receipts:c.p.view.receipts.map((row,index)=>index===c.p.view.receipts.length-1?{...row,commandId:'other'}:row)}}
 expect(researchRoomBrief(changedReceipt,c.thread,c.notice)).toBeNull()
})

it('requires the same known research and actual permission source, leaving history and unknown records alone',()=>{
 const c=finish(start('market-foundation-course').run)
 expect(researchRoomCopy(c.p,{...c.thread,focus:{...c.focus,runId:'other'}})).toBeNull()
 expect(researchRoomCopy(c.p,{...c.thread,focusScope:'history'})).toBeNull()
 expect(researchRoomCopy({...c.p,features:{...c.p.features,market:{...c.p.features.market,permissions:c.p.features.market.permissions.filter(row=>row.sourceId!==c.research.id)}}},c.thread)).toBeNull()
 expect(researchRoomCopy({...c.p,features:{...c.p.features,market:{...c.p.features.market,researches:[c.research,c.research]}}},c.thread)).toBeNull()
})

it('keeps a stopped research distinct from completion and does not shorten an unbound stop receipt',()=>{
 const started=start('market-overview'),run=act(started.run,'StopMarketResearch',{researchId:started.research.id}),c=context(run),notice={date:c.p.view.date,text:savedSceneResult('StopMarketResearch','停止原研究',view(started.run),c.p.view),frame:committedEcho(view(started.run),c.p.view)}
 expect(researchRoomCopy(c.p,c.thread)?.stage).toBe('已中断 · 原记录保留')
 expect(researchRoomCopy(c.p,c.thread)?.facts.join(' ')).toContain('已用的钱和行动不返还')
 expect(researchRoomBrief(c.p,c.thread,notice)).toBeNull()
})

it('renders the actual short start echo, retains full reading and offers life after completion',()=>{
 const c=start('market-overview'),feedback=<SceneTimeNotice {...c.notice} compact onClose={vi.fn()} accountName={()=>'个人'}/>
 const html=renderToStaticMarkup(<OpeningMoment p={c.p} focus={c.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={feedback}/>)
 expect(html).toContain('公开研究笔记已开始 · 已付¥0 / 已用1点。');expect(html).toContain('细看回响')
 expect(html).toContain('预计2020-01-02完成；期间仍可安排生活')
 const done=finish(c.run),result=renderToStaticMarkup(<OpeningMoment p={done.p} focus={done.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(done.p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 expect(result).toContain('收好笔记，想想今天');expect(result).toContain('看看生活');expect(result).toContain('翻阅这一段的记录与代价')
})

it('binds the completed research object and primary choice to the original Today callback without making a command',()=>{
 const c=finish(start('market-overview').run),onToday=vi.fn();let binding:SharedActionBinding|undefined
 DayThreadAction({p:c.p,thread:c.thread,active:true,result:true,date:null,waitLabel:'',onToday,children:primary=>{binding=primary?.binding;return primary?.main}})
 expect(binding?.label).toBe('收好笔记，想想今天');binding!.activate();expect(onToday).toHaveBeenCalledOnce();expect(c.p.request).not.toHaveBeenCalled()
})

it('retains a real mixed research and offer-expiry result rather than shortening away another event',()=>{
 const started=start('market-foundation-course'),run=act(started.run,'AdvanceTime',{date:'2020-01-08'}),c=context(run),before=view(started.run),after=c.p.view,receipt=after.receipts.at(-1)!,result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:after.date,before,lastBefore:before,lastSaved:after,current:after,steps:[{commandId:receipt.commandId,date:after.date,revisionBefore:before.revision,revisionAfter:after.revision}],feedback:inspectPublicWaitTransition(before,after),failed:null},notice={date:after.date,...waitSceneResult(result,after)!}
 expect(notice.text).toContain('那份原委托，有了新的实际反馈。')
 expect(researchRoomBrief(c.p,c.thread,notice)).toBeNull()
})


it.each([['market-overview','等公开资料整理好'],['market-foundation-course','等规则研习完成'],['simulation-special-study','等试验研习完成']] as const)('names the original %s wait only at its actual target', (id,label)=>{
 const c=start(id)
 expect(researchWaitLabel(c.p,c.thread,c.research.completeAt,'原等待')).toBe(label)
 expect(researchWaitLabel(c.p,c.thread,'2020-01-01','先到原反馈')).toBe('先到原反馈')
 expect(researchWaitLabel(c.p,{...c.thread,focusScope:'history'},c.research.completeAt,'回看')).toBe('回看')
 const html=renderToStaticMarkup(<OpeningMoment p={c.p} focus={c.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 expect(html).toContain(label+' · '+c.research.completeAt)
})

it('identifies the real old hand-made offer deadline without calling the running study overdue',()=>{
 const started=start('market-foundation-course'),run=act(started.run,'AdvanceTime',{date:'2020-01-06'}),c=context(run),before=view(started.run),after=c.p.view,receipt=after.receipts.at(-1)!,result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:'2020-01-08',before,lastBefore:before,lastSaved:after,current:after,steps:[{commandId:receipt.commandId,date:after.date,revisionBefore:before.revision,revisionAfter:after.revision}],feedback:inspectPublicWaitTransition(before,after),failed:null},notice={date:after.date,...waitSceneResult(result,after)!}
 const brief=researchRoomBrief(c.p,c.thread,notice)
 expect(brief,JSON.stringify(notice)).toBe('手工小单的答复期限已过；这份研习仍在继续。')
 expect(researchRoomBrief(c.p,c.thread,{...notice,text:notice.text+' 另有一项责任。'})).toBeNull()
 expect(researchRoomBrief(c.p,c.thread,{...notice,brief:'已实际支付¥100。'})).toBeNull()
 expect(researchRoomBrief(c.p,c.thread,{...notice,frame:{...notice.frame,spentBefore:0}})).toBeNull()
 const html=renderToStaticMarkup(<OpeningMoment p={c.p} focus={c.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={<SceneTimeNotice {...notice} compact onClose={vi.fn()} accountName={()=>'个人'}/>}/>)
 expect(html).toContain(brief!);expect(html).toContain('预计2020-01-08完成')
})

it.each(['market-foundation-course','simulation-special-study'] as const)('shows the actual %s qualification once and restores the dated fact after the echo is closed',id=>{
 const c=finish(start(id).run),copy=researchRoomCopy(c.p,c.thread)!,phrase=copy.resultEcho!,render=(notice:typeof c.notice|null)=>renderToStaticMarkup(<OpeningMoment p={c.p} focus={c.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={notice?<SceneTimeNotice {...notice} compact onClose={vi.fn()} accountName={()=>'个人'}/>:null}/>)
 const withEcho=render(c.notice),without=render(null),mixed=render({...c.notice,text:c.notice.text+' 另有原款待核对。'})
 expect(withEcho.split(phrase)).toHaveLength(2)
 expect(withEcho).not.toContain(c.research.completeAt+'已完成 · '+phrase)
 expect(without).toContain(c.research.completeAt+'已完成 · '+phrase)
 expect(mixed).toContain(c.research.completeAt+'已完成 · '+phrase)
 expect(withEcho).toContain('细看回响');expect(withEcho).toContain('翻阅这一段的记录与代价')
})

it('keeps the public-study decision boundary when the short completion sentence is not equivalent',()=>{
 const c=finish(start('market-overview').run),html=renderToStaticMarkup(<OpeningMoment p={c.p} focus={c.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(c.p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={<SceneTimeNotice {...c.notice} compact onClose={vi.fn()} accountName={()=>'个人'}/>}/>)
 expect(html).toContain('公开线索已整理；买卖仍由你决定。')
})
