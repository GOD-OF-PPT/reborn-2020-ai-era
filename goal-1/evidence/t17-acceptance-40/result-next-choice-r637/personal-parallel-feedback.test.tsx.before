import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {savedSceneResult} from './scene-result.ts'
import {personalParallelFeedback} from './personal-parallel-feedback.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {TodayScene} from './TodayScene.tsx'
import {todayThread} from './today-thread.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {SceneTimeNotice,SceneEcho} from './SceneEcho.tsx'

// Original normal in-memory commands/public feedback, no persistence APIs.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'parallel-result-ui',actorId:'player',commandId:'create',seed:'parallel-result-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
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


const begun=(kind:'rest'|'workspace'='rest',definitionId='market-foundation-course',from=initial)=>act(act(from,'StartLifeWork',{kind,personId:null,reference:null}),'ResearchMarket',{definitionId})
const cause=(e:ReturnType<typeof complete>)=>savedSceneResult('AdvanceTime','等原反馈',e.before,e.after,{includeCash:false})
const short=(e:ReturnType<typeof complete>)=>personalParallelFeedback(e.before,e.after,cause(e),e.result.feedback.filter(f=>f.attention==='pause'))
it.each(['rest','workspace'] as const)('names both the actual %s and research qualification while preserving the original full explanation and resource frame',kind=>{
 const e=complete(begun(kind)),before=JSON.stringify(e.result),brief=short(e)!
 expect(brief).toBe((kind==='rest'?'休整结束':'桌椅与照明已改善')+'；规则研习资格已取得。');expect(e.notice.brief).toBe(brief);expect(e.notice.text).toContain('1项市场研究已完成');expect(e.notice.text).toContain(kind==='rest'?'1次休整已经结束':'桌椅与照明已经改善');expect(e.notice.text).toContain('这次'+(kind==='rest'?'休整已经结束':'桌椅与照明改善已经完成'));expect(e.notice.frame.accounts[0]!.before).toBe(e.notice.frame.accounts[0]!.after);expect(e.notice.frame.pointsBefore).toBe(e.notice.frame.pointsAfter)
 const html=renderToStaticMarkup(<SceneEcho text={e.notice.text} frame={e.notice.frame} onClose={vi.fn()} accountName={()=>'个人账户'}/>);expect(html).toContain('预留行动');expect(html).toContain('已用行动');expect(html).toContain('2020-01-08');expect(html).toContain('不是未来价格');expect(JSON.stringify(e.result)).toBe(before)
})
it('reuses the short original producer in both the same-life room and Today, keeping primary and original full reading',()=>{
 const e=complete(begun()),p=input(e),f=focus(p),onClose=vi.fn(),feedback=<SceneTimeNotice date={e.after.date} {...e.notice} compact onClose={onClose} accountName={()=>'个人账户'}/>,today=todayThread(p,f)!
 const html=renderToStaticMarkup(<OpeningMoment p={p} focus={f} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={feedback}/>),now=renderToStaticMarkup(<TodayScene p={p} today={today} headingRef={null} feedback={feedback} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>);
 for(const text of [html,now]){expect(text).toContain('休整结束；规则研习资格已取得。');expect(text).toContain('细看回响');expect(text).toContain('收起这次时间回响');expect(text).not.toContain('1项市场研究已完成，只整理')}
 expect(html).toContain('回到今天');expect(now).toContain('工作，还是留点时间给自己');expect(p.request).not.toHaveBeenCalled();expect(onClose).not.toHaveBeenCalled();expect(playerThread(p,f).focus.entityId).toBe(f.entityId)
})
it('names two legitimate research results with the same completed personal work and verifies each original qualification source',()=>{
 const run=act(begun('workspace'),'ResearchMarket',{definitionId:'simulation-special-study'}),e=complete(run),brief=short(e)!
 expect(brief).toContain('桌椅与照明已改善');expect(brief).toContain('规则研习资格已取得');expect(brief).toContain('试验段研习资格已取得');expect(e.after.budget.available).toBe(1)
 const f=e.after.features as unknown as PlayFeatures,missing={...e.after,features:{...f,market:{...f.market,permissions:f.market.permissions.filter(p=>p.id!=='sim-experimental-access')}}};expect(personalParallelFeedback(e.before,missing,cause(e),e.result.feedback)).toBeNull()
})
it('keeps changed original identities, money, dates, definition, duplicate jobs or missing/extra feedback on the original reading',()=>{
 const e=complete(begun()),f=e.after.features as unknown as PlayFeatures,c=cause(e),rows=e.result.feedback.filter(r=>r.attention==='pause'),j=f.life.jobs[0]!
 const changes=[{...e.after,runId:'other'},{...e.after,revision:e.after.revision+1},{...e.after,date:'2020-01-09'},{...e.after,features:{...f,life:{...f.life,asOf:'2020-01-07'}}},{...e.after,features:{...f,life:{...f.life,jobs:[j,j]}}},{...e.after,features:{...f,life:{...f.life,jobs:[{...j,costFen:j.costFen+100}]}}},{...e.after,features:{...f,market:{...f.market,researches:f.market.researches.map(r=>({...r,definitionId:'unverified-study'}))}}}]
 for(const current of changes)expect(personalParallelFeedback(e.before,current,c,rows)).toBeNull()
 for(const feedback of [rows.slice(1),[...rows,rows[0]!],rows.map((r,n)=>n?r:{...r,label:r.label+'另有款项'}),[...rows,{...rows[0]!,sourceId:'other',kind:'responsibility' as const}]])expect(personalParallelFeedback(e.before,e.after,c,feedback)).toBeNull()
 for(const text of [c+'另有原约定。',c.replace('研究已完成','研究未完成')])expect(personalParallelFeedback(e.before,e.after,text,rows)).toBeNull()
 expect(short(complete(act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null})))).toBeNull()
})
it('preserves the gross cash first sentence and full source when genuine living costs accompany the verified results',()=>{
 // Explicit cash rows are a UI boundary shape, not a legal monthly playthrough.
 const e=complete(begun()),before=e.result.before,features=e.after.features as unknown as PlayFeatures,account=features.workbench.finance.find(a=>a.accountId==='personal')!,payment={...account.transactions[0]!,id:'ui-existing-charge',sourceId:'ui-existing-charge',date:e.after.date,amountFen:-400000,businessId:null,contractId:null},current={...e.after,accounts:e.after.accounts.map(a=>a.accountId==='personal'?{...a,cashFen:a.cashFen-400000,availableFen:a.availableFen-400000}:a),features:{...features,workbench:{...features.workbench,finance:features.workbench.finance.map(a=>a.accountId==='personal'?{...a,cashFen:a.cashFen-400000,transactions:[...a.transactions,payment]}:a)}}},result={...e.result,lastSaved:current,current},notice=waitSceneResult(result,current)!
 expect(notice.brief).toContain('个人实际付出¥4,000');expect(notice.brief).toContain('休整结束；规则研习资格已取得');expect(notice.text).toContain('性质和逐笔来源仍按原账');expect(notice.frame.accounts[0]!.before).toBe(before.accounts[0]!.availableFen)
 const extra={...e.result.feedback[0]!,kind:'responsibility' as const,sourceId:'old-bill',key:'old-bill',label:'仍需面对原到期款¥500。'},full=waitSceneResult({...e.result,feedback:[...e.result.feedback,extra]},e.after)!
 expect(full.brief).toContain(extra.label);expect(full.brief).not.toContain('规则研习资格已取得');expect(full.text).toContain(extra.label)
})
it('does not replace uncertain cash, cross-quarter frames or explicit stop explanations',()=>{
 const e=complete(begun()),f=e.after.features as unknown as PlayFeatures,unknown={...e.after,features:{...f,workbench:{...f.workbench,finance:f.workbench.finance.map(a=>a.accountId==='personal'?{...a,cashFen:a.cashFen-100}:a)}}},reading=waitSceneResult({...e.result,lastSaved:unknown,current:unknown},unknown)!
 expect(reading.brief).toContain('新增现金来源尚未完整核定');expect(reading.brief).not.toContain('规则研习资格已取得')
 const stopped=waitSceneResult({...e.result,reasonCodes:['WAIT_STOP_REQUESTED']},e.after)!;expect(stopped.brief).toContain('按你的选择停下');expect(stopped.brief).not.toContain('规则研习资格已取得')
})
