import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {inspectPublicWaitTransition} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {sceneStatusNotice,waitCauseBrief} from './scene-feedback-copy.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {personalDayProgressBrief} from './personal-day-copy.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {SceneTimeNotice} from './SceneEcho.tsx'

// UI result assembly from normal in-memory kernel proposals. No controller
// submission, storage construction, codec, import/export or persistence test.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'scene-feedback-ui',actorId:'player',commandId:'create',seed:'scene-feedback-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId)
 if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_PROPOSAL: '+JSON.stringify(result))
 return result.nextRun
}
function view(run:GameRun):PlayingView{return {...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
function echo(beforeRun:GameRun,afterRun:GameRun){
 const before=view(beforeRun),after=view(afterRun),receipt=after.receipts.at(-1)!
 const result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:'2020-03-31',before,lastBefore:before,lastSaved:after,current:after,steps:[{commandId:receipt.commandId,date:after.date,revisionBefore:before.revision,revisionAfter:after.revision}],feedback:inspectPublicWaitTransition(before,after),failed:null}
 return {before,after,result,notice:waitSceneResult(result,after)!}
}

it('shows the actual offer deadline instead of a bare date during a work wait',()=>{
 const working=act(initial,'WorkQuarter'),expired=act(working,'AdvanceTime',{date:'2020-01-06'}),e=echo(working,expired)
 expect(e.after.date).toBe('2020-01-06')
 expect(e.notice.brief).toBe('委托答复期限已过。')
 expect(e.notice.text).toContain('那份原委托，有了新的实际反馈。')
 expect(e.notice.text).toContain('日历从2020-01-01走到2020-01-06。')
 expect(e.notice.text).toContain('剩下的安排仍在原日历里')
})

it('keeps the same resting activity and expected completion beside the newly meaningful deadline',()=>{
 const resting=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),expired=act(resting,'AdvanceTime',{date:'2020-01-06'}),e=echo(resting,expired),features=e.after.features as unknown as PlayFeatures
 const controller={snapshot:{view:e.after,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(expired,command,registry,expired.actorId),clockCommitments:()=>{throw Error('ORIGINAL_CONFIRMATION_REQUIRED')}} as unknown as GamePanelProps['controller']
 const p:GamePanelProps={view:e.after,features,controller,request:vi.fn(),accountId:'personal'},focus:OpeningFocus={kind:'life',runId:e.after.runId,accountId:'personal',entityId:features.life.jobs[0]!.id,selection:'rest'}
 const notice={date:e.after.date,...e.notice},thread=playerThread(p,focus)
 expect(personalDayProgressBrief(p,thread,notice)).toBe('委托答复期限已过。休整还在继续，预计2020-01-08结束。')
 const html=renderToStaticMarkup(<OpeningMoment p={p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={<SceneTimeNotice {...notice} compact accountName={()=>'个人'} onClose={vi.fn()}/>}/>)
 expect(html).toContain('委托答复期限已过。休整还在继续，预计2020-01-08结束。')
 expect(html).toContain('细看回响')
})

it('keeps actual wage cash concise while retaining payroll provenance in the full echo',()=>{
 const features=registry.runtime!.project!(initial) as unknown as PlayFeatures
 const working=act(act(initial,'SkipOffer',{offerId:features.firstOrder.offerId}),'WorkQuarter'),stopped=act(working,'AdvanceTime',{date:'2020-01-31'}),event=stopped.world!.instances.find(row=>row.status==='pending')!,resumed=act(stopped,'ChooseEvent',{instanceId:event.id,choiceId:'defer'}),paid=act(resumed,'AdvanceTime',{date:'2020-01-31'}),e=echo(resumed,paid)
 expect(e.after.date).toBe('2020-01-31')
 expect(e.notice.brief).toContain('个人实际收到¥8,000')
 expect(e.notice.brief).not.toContain('原工作已经留下实际工资记录')
 expect(e.notice.text).toContain('原工作已经留下实际工资记录')
 expect(e.notice.brief).not.toContain('2020-01-31。')
 expect(e.notice.text).toContain('日历从2020-01-22走到2020-01-31。')
})

it('preserves authored cause sentences and avoids inventing a single cause for multiple public changes',()=>{
 const working=act(initial,'WorkQuarter'),expired=act(working,'AdvanceTime',{date:'2020-01-06'}),e=echo(working,expired),before=e.before.features as unknown as PlayFeatures,after=e.after.features as unknown as PlayFeatures
 const cause='2020-01-06，已支付¥100，另有原责任待回应。'
 expect(waitCauseBrief(e.after.date,cause,e.result.feedback,before.firstOrder,after.firstOrder)).toBe(cause)
 const fallback='2020-01-06。已经确认的安排按真实日期发生，眼前又多了一次选择。'
 const multiple=[...e.result.feedback,{key:'another',kind:'job' as const,sourceId:'another',label:'另一项实际反馈。',attention:'pause' as const}]
 expect(waitCauseBrief(e.after.date,fallback,multiple,before.firstOrder,after.firstOrder)).toBe('已经确认的安排按真实日期发生，眼前又多了一次选择。')
 expect(waitCauseBrief(e.after.date,fallback,e.result.feedback,{...before.firstOrder,offerId:'other'},after.firstOrder)).toBe('那份原委托，有了新的实际反馈。')
})

it('retires only fact-free generic success notices, including their exact producer form',()=>{
 for(const notice of ['已保存你的安排。详情以当前状态和账本为准。','事件选择已处理','经营指令已处理：WorkQuarter','模拟市场指令已处理：PlaceStockOrder'])expect(sceneStatusNotice(notice)).toBeNull()
 expect(sceneStatusNotice(null)).toBeNull()
})

it('shows one supplied responsibility once when it is both the stop reason and the important notice',()=>{
 const working=act(initial,'WorkQuarter'),expired=act(working,'AdvanceTime',{date:'2020-01-06'}),e=echo(working,expired)
 // Isolated UI-composition input, not evidence of a new gameplay obligation.
 const label='一笔原应付已经到期。',feedback=[{key:'ui-responsibility',kind:'responsibility' as const,sourceId:'ui-obligation',label,attention:'pause' as const}]
 const notice=waitSceneResult({...e.result,feedback},e.after)!
 expect(notice.brief).toBe(label)
 expect(notice.text).toContain(label)
})

it('keeps concrete consequences, responsibility messages and unfamiliar text',()=>{
 for(const notice of ['已收到工资¥8,000。','行动不足，请重新安排。','客户支持费仍待结清。','事件选择已处理：支付¥200。','经营指令已处理：WorkQuarter；实际收到¥8,000。'])expect(sceneStatusNotice(notice)).toBe(notice)
 expect(sceneStatusNotice('中转决策已保存：ReadRelaySupplyDecision')).toContain('原许可和下一步条件')
})
