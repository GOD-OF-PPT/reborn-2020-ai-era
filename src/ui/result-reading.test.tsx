import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {waitFeedbackReading} from './wait-feedback-reading.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {savedSceneResult} from './scene-result.ts'
import {personalResultFacts,personalStartNoticeExpired} from './personal-day-copy.ts'
import {researchRoomBrief} from './research-room-copy.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {SceneTimeNotice} from './SceneEcho.tsx'

// Pure UI on normal in-memory proposals; no controllers, codecs or storage.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'result-reading-ui',actorId:'player',commandId:'create',seed:'result-reading-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
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
function personal(kind:'rest'|'workspace'='rest'){return complete(act(initial,'StartLifeWork',{kind,personId:null,reference:null}))}
function input(e:ReturnType<typeof complete>){const features=e.after.features as unknown as PlayFeatures;return {view:e.after,features,controller:{snapshot:{view:e.after,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(e.run,command,registry,e.run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller'],request:vi.fn(),accountId:'personal'} satisfies GamePanelProps}
function focus(p:GamePanelProps):OpeningFocus{const job=p.features.life.jobs[0]!;if(job.kind!=='rest'&&job.kind!=='workspace')throw Error('PERSONAL_FOCUS_REQUIRED');return {runId:p.view.runId,kind:'life',accountId:'personal',entityId:job.id,selection:job.kind}}

it.each(['rest','workspace'] as const)('removes only the redundant generic job add-on after the exact %s completion',kind=>{
 const e=personal(kind),p=input(e),thread=playerThread(p,focus(p)),before=JSON.stringify(e.result.feedback),notice={date:e.after.date,...e.notice}
 expect(e.result.feedback.some(row=>row.label==='一份原工作已经有了实际结果。')).toBe(true)
 expect(e.notice.text).not.toContain('一份原工作已经有了实际结果')
 expect(e.notice.text).toContain(kind==='rest'?'1次休整已经结束':'桌椅与照明已经改善')
 expect(e.notice.text).toContain('日历从2020-01-06走到2020-01-08。')
 expect(personalResultFacts(p,thread,notice)).toBe(`已付${kind==='rest'?'¥0':'¥3,000'} / 已用1点；行动不返还，不产生收入。`)
 expect(e.notice.frame.accounts[0]!.after).toBe(kind==='rest'?2600000:2300000)
 expect(JSON.stringify(e.result.feedback)).toBe(before)
})

it.each(['market-overview','market-foundation-course','simulation-special-study'])('keeps the exact %s result and existing qualified room brief after deduplication',definitionId=>{
 const started=act(initial,'ResearchMarket',{definitionId}),projected=view(started).features as unknown as PlayFeatures,study=projected.market.researches[0]!,e=complete(started,study.completeAt),p=input(e)
 const f:OpeningFocus={runId:p.view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:study.id},thread=playerThread(p,f)
 expect(e.notice.text).toContain('个人账户：1项市场研究已完成');expect(e.notice.text).not.toContain('原研究有了实际进展')
 const brief=researchRoomBrief(p,thread,{date:e.after.date,...e.notice})
 expect(brief).not.toBeNull();expect(brief).toContain(definitionId==='market-overview'?'公开研究笔记已完成':definitionId==='market-foundation-course'?'已取得本局模拟规则研习资格':'已取得本局模拟试验段资格')
})

it('names both real parallel completions without dropping either consequence',()=>{
 const started=act(act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-foundation-course'}),e=complete(started)
 expect(e.notice.text).toContain('1次休整已经结束');expect(e.notice.text).toContain('1项市场研究已完成')
 expect(e.notice.text).toContain('这次休整已经结束。');expect(e.notice.text).toContain('模拟交易规则研习已经完成；买卖仍由你决定。')
 expect(e.notice.text).not.toContain('一份原工作已经有了实际结果')
 const p=input(e);expect(personalResultFacts(p,playerThread(p,focus(p)),{date:e.after.date,...e.notice})).toBeNull()
})

it('retains extra responsibilities, money text and unfamiliar feedback byte for byte',()=>{
 const e=personal(),cause=savedSceneResult('AdvanceTime','原等待',e.before,e.after,{includeCash:false}),label='另有原应付¥500，期限2020-01-10。',extra={key:'known-responsibility',kind:'responsibility' as const,sourceId:'ui-original-bill',label,attention:'pause' as const}
 const rows=[...e.result.feedback,extra],words=waitFeedbackReading(e.before,e.after,cause,rows)
 expect(words).toContain(label)
 const notice=waitSceneResult({...e.result,feedback:rows},e.after)!,p=input(e)
 expect(notice.text).toContain(label);expect(notice.brief).toContain(label);expect(personalResultFacts(p,playerThread(p,focus(p)),{date:e.after.date,...notice})).toBeNull()
 const unknown={...e.result.feedback[0]!,label:'一份原工作已经有了实际结果。另有¥100仍待核对。'}
 expect(waitFeedbackReading(e.before,e.after,cause,[unknown])).toEqual([unknown.label])
})

it('leaves missing, duplicate or changed object identities in the original reading',()=>{
 const e=personal(),cause=savedSceneResult('AdvanceTime','原等待',e.before,e.after,{includeCash:false}),row=e.result.feedback.find(r=>r.kind==='job')!,features=e.after.features as unknown as PlayFeatures
 for(const changed of [{...row,sourceId:'missing'},{...row,key:'job:'+row.sourceId+':"running"'},{...row,attention:'retain' as const}])expect(waitFeedbackReading(e.before,e.after,cause,[changed])).toEqual([row.label])
 const duplicated={...e.after,features:{...features,life:{...features.life,jobs:[...features.life.jobs,...features.life.jobs]}}}
 expect(waitFeedbackReading(e.before,duplicated,cause,[row])).toEqual([row.label])
 expect(waitFeedbackReading({...e.before,runId:'other-life'},e.after,cause,[row])).toEqual([row.label])
 const altered={...e.after,features:{...features,life:{...features.life,jobs:features.life.jobs.map(j=>({...j,originCommandId:'another-origin'}))}}}
 expect(waitFeedbackReading(e.before,altered,cause,[row])).toEqual([row.label])
})

it('shows one current completion date while the full echo is visible and restores it when closed',()=>{
 const e=personal(),p=input(e),f=focus(p),props={p,focus:f,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(p),onNavigate:vi.fn(),onExplore:vi.fn()}
 const shown=renderToStaticMarkup(<OpeningMoment {...props} feedback={<SceneTimeNotice date={e.after.date} {...e.notice} compact accountName={()=>'个人账户'} onClose={vi.fn()}/>}/>),closed=renderToStaticMarkup(<OpeningMoment {...props} feedback={null}/>)
 expect(shown).toContain('2020-01-08，1次休整已经结束');expect(shown).not.toContain('2020-01-08已完成 · 已付')
 expect(shown).toContain('已付¥0 / 已用1点；行动不返还，不产生收入。');expect(closed).toContain('2020-01-08已完成 · 已付¥0')
 for(const html of [shown,closed]){expect(html).toContain('回到今天');expect(html).toContain('查看这次生活安排与原记录')}
})

it('retires the fact-free start acknowledgement only beside its own current personal task',()=>{
 const run=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),v=view(run),e={...personal(),run,after:v},p=input(e),thread=playerThread(p,focus(p)),ack='生活工作已实际开始；完成与场景仍按真实日期处理。'
 expect(personalStartNoticeExpired(p,ack,thread)).toBe(true)
 expect(personalStartNoticeExpired(p,ack)).toBe(false)
 expect(personalStartNoticeExpired(p,'原生活安排已付款¥300，另有责任待回应。',thread)).toBe(false)
 const other=playerThread(p,{runId:p.view.runId,kind:'work',accountId:'personal',entityId:null});expect(personalStartNoticeExpired(p,ack,other)).toBe(false)
})

it('retains the actual mixed expiry feedback when one direct kernel step crosses both dates',()=>{
 const e=complete(act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'2020-01-08',false),p=input(e)
 expect(e.notice.text).toContain('那份原委托，有了新的实际反馈。');expect(e.notice.text).toContain('日历从2020-01-01走到2020-01-08。')
 expect(personalResultFacts(p,playerThread(p,focus(p)),{date:e.after.date,...e.notice})).toBeNull()
})
