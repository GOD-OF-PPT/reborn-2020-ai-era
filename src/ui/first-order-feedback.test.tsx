import {expect,it,vi} from 'vitest'
import type {ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {PlayingView,PlayFeatures,GamePanelProps} from './game-types.ts'
import {firstOrderWaitBrief,firstOrderPaidFacts} from './first-order-feedback.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {savedSceneResult} from './scene-result.ts'
import {sceneCashResult} from './scene-cash-result.ts'
import {openingAttempt} from './opening-attempt.ts'
import {OpeningAttemptAction} from './OpeningAttemptAction.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {playerThread} from './player-thread.ts'
import {SceneTimeNotice} from './SceneEcho.tsx'

// Normal in-memory first-order proposals and public UI composition only.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'first-feedback-ui',actorId:'player',commandId:'create',seed:'first-feedback-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'first_order'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'first-feedback-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(r));return r.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
const planned=act(initial,'StartFirstOrder'),running=act(planned,'AdvanceTime',{date:'2020-01-05'}),ready=act(running,'AdvanceTime',{date:'2020-01-19'}),contractId=(view(ready).features as unknown as PlayFeatures).firstOrder.contractId,submitted=act(ready,'SubmitDelivery',{contractId}),paid=act(submitted,'AdvanceTime',{date:'2020-01-20'})
function echo(a:GameRun,b:GameRun){
 const before=view(a),after=view(b),receipt=after.receipts.at(-1)!,feedback=inspectPublicWaitTransition(before,after),result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:after.date,before,lastBefore:before,lastSaved:after,current:after,steps:[{commandId:receipt.commandId,date:after.date,revisionBefore:before.revision,revisionAfter:after.revision}],feedback,failed:null},old=before.features as unknown as PlayFeatures,current=after.features as unknown as PlayFeatures
 const cash=sceneCashResult(old.workbench.finance,current.workbench.finance,before.date,after.date,()=> '个人'),cause=savedSceneResult('AdvanceTime','原等待',before,after,{includeCash:false})
 return {run:b,before,after,result,cash,cause,notice:waitSceneResult(result,after)!}
}
function input(e=echo(submitted,paid)):GamePanelProps{return {view:e.after,features:e.after.features as unknown as PlayFeatures,controller:{snapshot:{view:e.after,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(e.run,command,registry,e.run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller'],request:vi.fn(),accountId:'personal'}}

it('names the actual production start and keeps the complete cash explanation and original reservation change',()=>{
 const e=echo(planned,running)
 expect(e.notice.brief).toBe('这份短片开工了 · 制作已付¥500。')
 expect(e.notice.text).toContain('个人实际付出¥500');expect(e.notice.text).toContain('原安排已经实际开始。')
 expect(e.notice.frame).toMatchObject({pointsBefore:3,pointsAfter:3,reservedBefore:1,reservedAfter:0,spentBefore:0,spentAfter:1})
 expect(e.notice.text).toContain('日历从2020-01-01走到2020-01-05。')
})

it('states the real ready-to-deliver result once while keeping the original delivery responsibility',()=>{
 const e=echo(running,ready),before=JSON.stringify(e.result.feedback)
 expect(e.notice.brief).toBe('短片做完了，等你亲手交给客户。')
 expect(e.notice.text).toContain('原作品已经做好，等待你的决定。');expect(e.notice.text).toContain('下一步，要由你亲手交给客户。')
 expect(e.result.feedback.some(row=>row.kind==='responsibility')).toBe(true);expect(JSON.stringify(e.result.feedback)).toBe(before)
 expect(playerThread(input(e)).command).toMatchObject({kind:'SubmitDelivery',payload:{contractId}})
})

it('shows one actual customer payment in the brief, preserves gross cash/full cost text and restores scene facts after dismissal',()=>{
 const e=echo(submitted,paid),p=input(e),thread=playerThread(p),notice={date:p.view.date,...e.notice},original=JSON.stringify(e.result)
 expect(e.notice.brief).toBe('客户付来了¥1,300，这笔手工单收好了。')
 expect(e.notice.text).toContain('个人实际收到¥1,300');expect(e.notice.text).toContain('制作成本¥500，这一单净得¥800。')
 expect(e.notice.frame.accounts[0]).toMatchObject({before:2550000,after:2680000})
 expect(firstOrderPaidFacts(p,thread,notice)).toEqual(['制作成本¥500 · 本单净额¥800。']);expect(JSON.stringify(e.result)).toBe(original)
 const props={p,focus:thread.focus,onFocus:vi.fn(),headingRef:null,fallback:roomMoment(p),onNavigate:vi.fn(),onExplore:vi.fn()},shown=renderToStaticMarkup(<OpeningMoment {...props} feedback={<SceneTimeNotice {...notice} compact accountName={()=>'个人账户'} onClose={vi.fn()}/>}/>),closed=renderToStaticMarkup(<OpeningMoment {...props} feedback={null}/>)
 expect(shown).toContain('客户付来了¥1,300');expect(shown).not.toContain('实收¥1,300 · 制作成本');expect(shown).toContain('制作成本¥500 · 本单净额¥800');expect(closed).toContain('实收¥1,300 · 制作成本¥500')
 expect(shown).toContain('收到客户付款');expect(closed).toContain('收到客户付款')
})

it('retains another current responsibility in the main brief rather than collapsing to the first-order success',()=>{
 const e=echo(submitted,paid),extra={key:'responsibility:another',kind:'responsibility' as const,sourceId:'another',label:'另一笔原应付¥200已经到期。',attention:'pause' as const},feedback=[...e.result.feedback,extra],notice=waitSceneResult({...e.result,feedback},e.after)!,p=input(e)
 expect(firstOrderWaitBrief(e.before,e.after,e.cash,e.cause,feedback)).toBeNull();expect(notice.brief).toContain(extra.label);expect(notice.text).toContain(extra.label)
 expect(firstOrderPaidFacts(p,playerThread(p),{date:e.after.date,...notice})).toBeNull()
})

it('keeps unrecognized labels, duplicate keys and different original identities in the original result',()=>{
 const e=echo(submitted,paid),row=e.result.feedback[0]!
 for(const rows of [[{...row,sourceId:'other'}],[{...row,label:row.label+'另有原款。'}],[row,row],[{...row,attention:'retain' as const}]])expect(firstOrderWaitBrief(e.before,e.after,e.cash,e.cause,rows)).toBeNull()
 expect(firstOrderWaitBrief({...e.before,runId:'other-life'},e.after,e.cash,e.cause,e.result.feedback)).toBeNull()
 const f=e.after.features as unknown as PlayFeatures,foreign={...e.after,features:{...f,firstOrder:{...f.firstOrder,contractId:'other'}}}
 expect(firstOrderWaitBrief(e.before,foreign,e.cash,e.cause,e.result.feedback)).toBeNull()
})

it('does not infer a payment from a quote, aggregate cash or a changed ledger source',()=>{
 const e=echo(submitted,paid),f=e.after.features as unknown as PlayFeatures
 expect(firstOrderWaitBrief(e.before,e.after,'个人本次另收了其他款。',e.cause,e.result.feedback)).toBeNull()
 const changed={...e.after,features:{...f,workbench:{...f.workbench,finance:f.workbench.finance.map(a=>({...a,transactions:a.transactions.map(t=>t.sourceId===contractId?{...t,sourceId:'other-customer'}:t)}))}}}
 expect(firstOrderWaitBrief(e.before,changed,e.cash,e.cause,e.result.feedback)).toBeNull()
 const moneyUnknown={...e.after,features:{...f,firstOrder:{...f.firstOrder,result:{...f.firstOrder.result,paymentFen:Number.NaN}}}}
 expect(firstOrderWaitBrief(e.before,moneyUnknown,e.cash,e.cause,e.result.feedback)).toBeNull()
 const p=input(e),notice={date:p.view.date,...e.notice,frame:{...e.notice.frame,accounts:e.notice.frame.accounts.map(a=>({...a,before:a.before!+100}))}}
 expect(firstOrderPaidFacts(p,playerThread(p),notice)).toBeNull()
})

it('keeps the original Today action binding while removing only the redundant navigation caption',()=>{
 const e=echo(submitted,paid),p=input(e),attempt=openingAttempt(p)!,onToday=vi.fn(),props={p,attempt,date:null,waitLabel:'原等待',openOffer:vi.fn(),openMarket:vi.fn(),openFree:vi.fn(),openNext:vi.fn(),onToday,inspect:vi.fn()}
 let primary:Parameters<Parameters<typeof OpeningAttemptAction>[0]['children']>[0]=null
 OpeningAttemptAction({...props,children:value=>{primary=value;return null}})
 const selected=primary as unknown as {binding:{label:string;activate:()=>void};main:ReactElement}
 expect(selected.binding.label).toBe('收好结果，回到今天')
 const html=renderToStaticMarkup(selected.main);expect(html).not.toContain('保留这份委托与原书签');expect(html).not.toContain('<small>')
 selected.binding.activate();expect(onToday).toHaveBeenCalledOnce();expect(p.request).not.toHaveBeenCalled()
})

it('does not shorten a generic acknowledgement into an additional reward or transaction',()=>{
 const e=echo(planned,running)
 expect(firstOrderWaitBrief(e.before,e.after,e.cash,e.cause+'另有新情况。',e.result.feedback)).toBeNull()
 const changed={...e.after,budget:{...e.after.budget,spent:e.after.budget.spent+1}}
 expect(firstOrderWaitBrief(e.before,changed,e.cash,e.cause,e.result.feedback)).toBeNull()
})
