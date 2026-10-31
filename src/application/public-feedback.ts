import type {RunSession} from './session.ts'
import type {WorkbenchProjection} from './workbench-projection.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import type {StoryProjection} from '../core/story-projection.ts'
import type {VideoProjection} from '../core/video-projection.ts'
import type {CourseProjection} from '../core/course-projection.ts'
import type {RelayProjection} from '../core/relay-projection.ts'
import type {DeepseekProjection} from '../core/deepseek-projection.ts'
import type {projectMarket} from '../core/market-projection.ts'

type View=RunSession['view']
/** A projection of one executed logical step; it carries no claim of persistence. */
export type WaitMeaningView=Pick<View,'runId'|'revision'|'date'|'features'|'operations'|'receipts'>
type Features={readonly workbench?:WorkbenchProjection;readonly life?:LifeProjection;readonly story?:StoryProjection;readonly video?:VideoProjection;readonly course?:CourseProjection;readonly relay?:RelayProjection;readonly deepseek?:DeepseekProjection;readonly market?:ReturnType<typeof projectMarket>;readonly firstOrder?:{readonly offerId:string;readonly status:string}}
export interface PublicFeedback {
 readonly key:string
 readonly kind:'responsibility'|'job'|'invitation'|'result'|'course-update'|'terms'|'quarter'|'receivable'
 readonly sourceId:string
 readonly label:string
 /** Retained money remains visible without making optional collection a daily interruption. */
 readonly attention:'pause'|'retain'
}
const features=(view:WaitMeaningView)=>view.features as Features
type FeedbackMap=Map<string,PublicFeedback>

/** Describe current public responsibilities; this does not grant or withdraw command permission. */
export function publicResponsibilities(view:WaitMeaningView):readonly PublicFeedback[]{
 const f=features(view),w=f.workbench,rows:PublicFeedback[]=[]
 const add=(sourceId:string,label:string)=>rows.push({key:'responsibility:'+sourceId,kind:'responsibility',sourceId,label,attention:'pause'})
 if(w?.pause)add(w.pause.instanceId,'有一件事，需要亲自回应。')
 if(w?.progression.requiresDelivery)add(f.firstOrder?.offerId??view.runId,'原作品已经做好，等待你的决定。')
 for(const e of w?.events??[])if(e.isBlocking||e.presentation!=='ordinary')add(e.id,e.title)
 for(const a of w?.finance??[]){
  if(a.protectionShortfallFen>0||a.commitmentShortfallFen>0)add(a.accountId,'原款或已经答应的支出，需要先核对。')
  for(const o of a.obligations)if(o.remainingFen>0&&o.date<=view.date)add(o.id,'一笔原应付已经到期。')
 }
 for(const risk of f.story?.incidents??[])if(risk.resolvedAt===null&&!['normal','resolved'].includes(risk.stage))add(risk.id,'有一项独立风险，需要亲自面对。')
 return rows.filter((row,index,all)=>all.findIndex(other=>other.key===row.key)===index)
}

/** Only public-projection fields are indexed. Meter rows, private facts and future queues are never read. */
function feedbackStates(view:WaitMeaningView):FeedbackMap{
 const f=features(view),rows:FeedbackMap=new Map()
 const add=(kind:PublicFeedback['kind'],sourceId:string,state:unknown,label:string,attention:PublicFeedback['attention']='pause')=>{
  const key=kind+':'+sourceId+':'+JSON.stringify(state)
  rows.set(key,{key,kind,sourceId,label,attention})
 }
 for(const row of publicResponsibilities(view))rows.set(row.key,row)
 const jobs=[...(view.operations?.jobs??[]),...(f.workbench?.preparationJobs??[]),...(f.life?.jobs??[]),...(f.story?.jobs??[])]
 for(const job of jobs)add('job',job.id,job.status,job.status==='completed'?'一份原工作已经有了实际结果。':job.status==='running'?'原安排已经实际开始。':job.status==='planned'?'一份原安排已经留下。':'一份原工作的状态发生了变化。')
 if(f.firstOrder)add('result',f.firstOrder.offerId,f.firstOrder.status,'那份原委托，有了新的实际反馈。')
 for(const order of f.market?.orders??[])add('result',order.id,order.status,'原模拟委托，有了实际进展。')
 for(const fill of f.market?.fills??[])add('result',fill.id,'filled','原模拟委托形成了实际成交；成交与交收仍分开。')
 for(const settlement of f.market?.settlements??[])add('result',settlement.id,settlement.paidAt,settlement.paidAt===null?'原投资留下了待交收的原款，还没有到账。':'原投资的这笔交收已经实际付款。')
 for(const research of f.market?.researches??[])add('job',research.id,research.status,'原研究有了实际进展。')
 for(const promise of f.life?.promises??[])add('invitation',promise.id,[promise.status,promise.responseCommandId],promise.status==='offered'?'生活里有一份新的邀请，可以看看。':'一份个人约定，有了实际变化。')
 for(const e of f.workbench?.events??[])if(e.isBlocking||e.presentation!=='ordinary'||e.choices.some(choice=>choice.actionPoints>0||choice.costFen>0))add('result',e.id,'available',e.title)
 for(const c of f.video?.contracts??[])add('result',c.id,[c.status,c.reviewedAt,c.paymentAt],'原视频委托，有了实际反馈。')
 for(const p of f.video?.publications??[])if(typeof p.measuredAt==='string')add('result',p.id,p.measuredAt,'原发布已经有了实际统计；统计与收入仍分开。')
 for(const m of f.video?.marketing??[])if(typeof m.completedAt==='string')add('result',m.id,m.completedAt,'原账号的需求研究，有了实际反馈。')
 for(const c of f.course?.courses??[]){
  add('result',c.id,[c.status,c.paused],'这份原课程，有了实际变化。')
  // A newly disclosed update is meaningful even before the player reads its details.
  if(c.unresolvedUpdates.length)add('course-update',c.id,c.unresolvedUpdates,'这份原课程出现了新的更新事项。')
 }
 for(const a of f.course?.audiences??[])if(typeof a.completedAt==='string')add('result',a.id,a.completedAt,'原课程的受众与报价，有了实际反馈。')
 for(const c of f.course?.cohorts??[])add('result',c.id,[c.status,c.closedAt,c.supportSatisfied,c.teachingCancelled,c.stages.map(s=>s.deliveredAt)],'原班期的教学、支持或收尾，有了实际变化。')
 for(const a of f.relay?.audiences??[])if(typeof a.completedAt==='string')add('result',a.id,a.completedAt,'原服务的需求研究，有了实际反馈。')
 for(const p of f.relay?.periods??[]){
  const issue=Number.isSafeInteger(p.failedDays)&&p.failedDays>=0?p.failedDays>0?'issue':'clear':'unknown'
  add('result',p.id,[p.status,p.feePostedAt,p.compensatedAt],'原服务或支持，有了实际反馈。')
  if(issue==='issue')add('responsibility',p.id,'reported-service-problem','这份原服务出现了需要核对的情况。')
  else if(issue==='unknown')add('responsibility',p.id,'unknown-service-summary','这份原服务的报告来源仍需核对。')
 }
 for(const q of f.relay?.quotes??[])if(typeof q.completedAt==='string')add('terms',q.id,q.completedAt,'原报价谈判已经有了实际答复。')
 for(const c of f.relay?.customers??[])add('terms',c.id,c.activeTerms.id,'原客户的有效条款发生了变化；旧用量仍按原价。')
 for(const c of f.deepseek?.contracts??[])add('result',c.id,[c.status,c.deliveredAt,c.supportPostedAt,c.cancelledAt],'原生态合作，有了实际反馈。')
 for(const invitation of f.deepseek?.invitations??[])add('invitation',invitation.id,[invitation.status,invitation.reportAt],invitation.status==='expired'?'原邀请的回应窗口已经结束。':'原架空邀请有了可查看的实际变化。',invitation.status==='expired'?'retain':'pause')
 for(const negotiation of f.deepseek?.negotiations??[])add('terms',negotiation.id,[negotiation.respondedAt,negotiation.expired,negotiation.closedKind],negotiation.expired?'原谈判的回应窗口已经结束。':'原谈判有了实际答复。',negotiation.expired?'retain':'pause')
 for(const agreement of f.deepseek?.agreements??[])add('terms',agreement.id,[agreement.followDecision,agreement.locked,agreement.shares,agreement.totalShares],agreement.followDecision==='defaulted'?'原跟投窗口已结束，没有自动付款。':'原权益或跟投窗口有了实际变化。',agreement.followDecision==='defaulted'?'retain':'pause')
 for(const governance of f.deepseek?.governance??[])add('terms',governance.id,governance.resolvedAt,governance.resolvedAt===null?'原治理安排还在进行。':'原治理安排已有实际表决结果。')
 for(const policy of f.deepseek?.policies??[])add('terms',policy.governanceId,[policy.policy,policy.date,policy.date<=view.date],policy.date<=view.date?'原先谈妥的治理安排已经实际生效。':'原治理安排已经留下生效日期。')
 for(const exit of f.deepseek?.exits??[]){
  add('terms',exit.id,[exit.responseAt,exit.quoteExpired,exit.operationId],exit.quoteExpired?'原转让报价的窗口已经结束。':'原转让询价有了实际变化。',exit.quoteExpired?'retain':'pause')
  if(exit.receivable&&exit.receivable.remainingFen>0&&exit.receivable.dueAt<=view.date)add('receivable',exit.receivable.id,'due','这笔原股权转让款已到期，未收款仍保留。','retain')
 }
 if(f.workbench){
  add('quarter',f.workbench.quarter,f.workbench.atQuarterEnd,f.workbench.atQuarterEnd?'本季已经走到结果，原约仍保留。':'新一季已经到了，旧约仍按原对象继续。')
 }
 for(const payroll of view.operations?.payroll??[])if(payroll.kind==='salary'&&payroll.amountFen>0)add('result',payroll.id,payroll.amountFen,'原工作已经留下实际工资记录。')
 for(const d of f.deepseek?.deliveries??[])if(d.remainingFen>0&&d.dueAt<=view.date)add('receivable',d.id,'due','一笔自己的原款已经到期，仍可先继续原安排。','retain')
 for(const d of f.relay?.receivables??[])if(d.amountFen>d.collectedFen+d.reversedFen&&d.dueAt<=view.date)add('receivable',d.id,'due','一笔自己的原单已经到期，未收款仍保留。','retain')
 return rows
}

/** Read-only meaning for one actual original time command, never a prediction or a new focus. */
export function publicFeedbackSince(previous:View,current:View):readonly PublicFeedback[]{
 if(previous.saveStatus!=='saved'||previous.hasCandidate||current.saveStatus!=='saved'||current.hasCandidate)return []
 return inspectPublicWaitTransition(previous,current)
}

/** Classify an actual original execution from public fields only. The caller
 * must commit before publishing these meanings or any working projection.
 */
export function inspectPublicWaitTransition(previous:WaitMeaningView,current:WaitMeaningView):readonly PublicFeedback[]{
 if(current.runId!==previous.runId||current.revision!==previous.revision+1||current.date<previous.date||current.receipts.length!==previous.receipts.length+1)return []
 const last=current.receipts.at(-1)
 if(last?.kind!=='AdvanceTime'||last.revisionAfter!==current.revision||!previous.receipts.every((r,i)=>{const next=current.receipts[i];return next?.commandId===r.commandId&&next.kind===r.kind&&next.revisionAfter===r.revisionAfter}))return []
 const before=feedbackStates(previous),after=feedbackStates(current)
 return [...after.values()].filter(row=>!before.has(row.key))
}
