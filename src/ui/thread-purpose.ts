import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {resolveCourseFocus} from './course-player-thread.ts'
import {relayJourneyAction,relayJourneyScene} from './relay-journey.ts'
import {resolveRelaySceneTarget,relayTargetEntity} from './relay-scene-target.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {relayTicketAudit} from './relay-ticket-command.ts'
import {ecosystemJourneyFor} from './ecosystem-player-thread.ts'
import {equityJourneyFor} from './equity-player-thread.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
type Thread=Pick<PlayerThreadView,'focus'|'focusScope'|'stage'|'outcome'|'responsibilityOverrideNeeded'>
export interface ThreadPurpose{readonly attempt:string;readonly finishWhen:string}
const purpose=(attempt:string,finishWhen:string):ThreadPurpose=>({attempt,finishWhen})
type RelayTaskKind='materials'|'basics'|'adapter'|'marketing'|'application'
const relayTaskLabels:Record<RelayTaskKind,string>={materials:'申请材料',basics:'技术基础',adapter:'供应适配',marketing:'获客任务',application:'供应审查'}
const relayTaskBoundary:Record<RelayTaskKind,string>={materials:'材料完成后，供应申请仍须另定。',basics:'技术准备不等于材料、申请或许可。',adapter:'本次适配完成后，获客与服务仍须另定。',marketing:'实际名单、报价、签约与充值分别决定。',application:'审查完成后还要亲读回信，不预告批准。'}
function relayTaskPurpose(kind:RelayTaskKind,job:ProductionJob,history:boolean):ThreadPurpose{
 const label=relayTaskLabels[kind],boundary=relayTaskBoundary[kind],origin=history?'回看':'',dates=job.startAt+'—'+job.completeAt
 if(job.status==='planned')return purpose(origin+'给这次'+label+'留出真实的日子。',job.startAt+'原定开工、'+job.completeAt+'预计完成；'+boundary)
 if(job.status==='running')return purpose(origin+'把这次'+label+'按原安排认真做完。',dates+'的'+label+'须实际完成；'+boundary)
 if(job.status==='completed')return purpose(origin+'这次'+label+'已经实际完成，收好原记录。',job.completeAt+'实际完成；'+boundary)
 return purpose(origin+'这次'+label+'已经'+(job.status==='cancelled'?'取消':'中断')+'，原记录仍在。',(job.releasedAt??job.startAt)+'已停止；原投入与旧约按原账保留，下一次须重新决定。')
}
/** An active business task must be the same original job in both public projections. */
function relayPublicJob(p:Input,businessId:string,source:ProductionJob|null,jobId:string,definitionId:string):ProductionJob|null{
 const rows=p.view.operations?.jobs.filter(j=>j.id===jobId)??[],job=rows[0]
 if(rows.length!==1||!source||!job||source.id!==jobId||job.businessId!==businessId||job.definitionId!==definitionId)return null
 return source.businessId===job.businessId&&source.definitionId===job.definitionId&&source.contractId===job.contractId&&source.actionId===job.actionId
  &&source.status===job.status&&source.startAt===job.startAt&&source.completeAt===job.completeAt&&source.releasedAt===job.releasedAt&&source.outputId===job.outputId
  &&source.resources.length===job.resources.length&&source.resources.every((id,index)=>id===job.resources[index])?job:null
}
function relayObjectPurpose(p:Input,thread:Thread):ThreadPurpose|null{
 const f=thread.focus;if(f.kind!=='relay'||!f.relayTarget)return null
 const v=p.features.relay,t=f.relayTarget,r=resolveRelaySceneTarget(v,t,{runId:p.view.runId,accountId:f.accountId,operations:p.view.operations})
 if(!v||r.status!=='valid'||f.runId!==p.view.runId||f.businessId!==t.businessId||f.entityId!==relayTargetEntity(t))return purpose('先核对这份服务的原对象。','明确重新选择可核对的同一主体与原任务，没有换成另一份安排。')
 const history=thread.focusScope==='history',active=(job:ProductionJob|null)=>job?.status==='planned'||job?.status==='running'
 const applicationPurpose=(a:NonNullable<typeof r.application>,job:ProductionJob):ThreadPurpose=>{
  if(!a.read){
   if(job.status!=='completed')return relayTaskPurpose('application',job,history)
   return purpose((history?'回看并':'')+'亲手读这封已经到达的原回信。',job.completeAt+'原审查已实际完成；读信才知实际结果，申请不保证批准。')
  }
  if(a.approved===true)return purpose((history?'回看':'核对')+'这封已经亲读的原许可回信。',a.decisionAt+'原回信已知'+(a.expiresAt?'，许可记录至'+a.expiresAt:'')+'；今天的适配与启用条件仍须另核。')
  if(a.approved===false)return purpose((history?'回看':'收好')+'这份已经亲读、未获许可的原回信。',a.decisionAt+'原拒绝已知，实际成本保留；另作申请或转向仍由你决定。')
  return purpose('核对这封已经亲读的原回信。','本份公开结果仍待核对，没有把未知许可说成批准。')
 }
 if(r.application&&r.job)return applicationPurpose(r.application,r.job)
 if(r.audience&&r.job&&r.audience.completedAt===null)return relayTaskPurpose('marketing',r.job,history)
 if(r.period&&r.meter){
  const meter=r.meter
  const existing=relayTicketAudit({...p,accountId:f.accountId},t)
  if(existing.reason)return purpose('先核对这一张票已经留下的复核依据。',existing.reason)
  if(existing.job&&existing.batch)return purpose('留出这一张票已经委托的独立核对时间。',existing.job.startAt+'—'+existing.job.completeAt+'是同一份原委托；完整批次'+existing.batch.meterCount+'条，实际完成后才看实计，不重复安排。')
  if(meter.correctionId!==null){
   const rows=v.corrections.filter(c=>c.id===meter.correctionId&&c.meterId===meter.id&&c.date<=p.view.date)
   return rows.length===1?purpose('收好这一张原票和已经追加的更正。',rows[0]!.date+'已留下本票更正；原量、原价与其它票保留，新增应收应付仍按自己的原日期。'):purpose('先核对这一张原票的更正依据。','原附票尚未唯一对齐；没有替换另一张，也不宣布款项已结清。')
  }
  if(meter.auditedUnits===null)return purpose((history?'回看':'核对')+'这一张已经发生、实计待核的原票。','明确选择原资源和日期后才能委托本票复核；阅读报告不产生实计、差额或收入。')
  if(meter.auditedUnits!==meter.reportedUnits)return purpose('只回应这一张已经查出差额的原票。','按同一份实际复核明确决定本票更正；整期其它计量、原支持与应收应付分别继续。')
  return purpose('收好这一张报告与实计相符的原票。','本票已独立核对相符，可以停留；不强迫制造金额调整，其它原票与账款另核。')
 }
 if(r.period&&r.job){
  const job=r.job,support=job.id===r.period.supportJobId,label=r.audit?'这批原计量复核':support?'这一份原支持':'这一份原服务'
  const subset=r.audit?v.audits.filter(a=>a.jobId===r.audit!.jobId&&v.meters.some(m=>m.id===a.meterId&&m.periodId===r.period!.id)).length:0
  const scope=r.audit?'完整原批次'+r.audit.meterCount+'条，其中'+subset+'条属于当前原期；后来计量另核。':support?'完成的是这一份支持；用量、退款、费用和实际回款仍分别处理。':'服务与原支持是两份任务，核账与实收也分别继续。'
  if(job.status==='planned')return purpose('把'+label+'留在原定的日子里。',job.startAt+'原定开工、'+job.completeAt+'预计完成；预留不是完成。'+scope)
  if(job.status==='running')return purpose('按原资源把'+label+'认真做完。',job.completeAt+'是这份原任务的预计反馈日；须实际完成才呈现结果。'+scope)
  if(job.status==='completed')return purpose('收好已经实际完成的'+label+'。',job.completeAt+'已完成这份原任务。'+scope)
  return purpose(label+(job.status==='cancelled'?'未开工已取消，原记录仍在。':'已经中断，先看清留下什么。'),(job.releasedAt??job.startAt)+'已停止；原预留、实际投入与旧责任分别核对，等待不会免费补做。'+scope)
 }
 if(t.kind!=='business')return null
 const jobs:{kind:RelayTaskKind;job:ProductionJob|null}[]=[]
 if(thread.stage==='relay-preparation')for(const row of v.preparations.filter(row=>row.businessId===t.businessId&&active(row.job)))jobs.push({kind:row.kind,job:relayPublicJob(p,t.businessId,row.job,row.jobId,row.kind==='basics'?'relay-basics':'relay-preparation')})
 if(thread.stage==='relay-supply'){
  for(const row of v.applications.filter(row=>row.businessId===t.businessId&&active(row.job)))jobs.push({kind:'application',job:relayPublicJob(p,t.businessId,row.job,row.jobId,'relay-application')})
  for(const row of v.adapters.filter(row=>row.businessId===t.businessId&&active(row.job)))jobs.push({kind:'adapter',job:relayPublicJob(p,t.businessId,row.job,row.jobId,'relay-adapter')})
 }
 if(thread.stage==='relay-marketing')for(const row of v.audiences.filter(row=>row.businessId===t.businessId&&active(row.job)))jobs.push({kind:'marketing',job:relayPublicJob(p,t.businessId,row.job,row.jobId!,'relay-marketing')})
 if(jobs.length===1&&jobs[0]!.job)return relayTaskPurpose(jobs[0]!.kind,jobs[0]!.job!,history)
 if(jobs.length)return purpose('先明确这次要继续的原准备任务。','同站有多项安排或原任务不能唯一核对，请翻回具体申请、适配或获客；没有挑最新一份。')
 if(thread.stage==='relay-supplier-letter'){
  const replies=v.applications.filter(a=>a.businessId===t.businessId&&!a.read&&a.job?.status==='completed'&&a.job.completeAt<=p.view.date)
  if(replies.length===1){const a=replies[0]!,job=relayPublicJob(p,t.businessId,a.job,a.jobId,'relay-application');if(job)return applicationPurpose(a,job)}
 }
 return null
}

/** A class result may lead to today; an old attempt or an unpaid promise may not stand in for it. */
export function courseAttemptClosed(p:Input,thread:Thread):boolean{
 const f=thread.focus,t=f.kind==='course'?f.courseTarget:null
 if(f.kind!=='course'||!t||t.kind!=='cohort'||t.jobId!==undefined||thread.focusScope==='invalid'||thread.responsibilityOverrideNeeded||resolveCourseFocus(p,f).reason)return false
 const co=p.features.course?.cohorts.find(co=>co.id===t.cohortId&&co.courseId===t.courseId)
 const finance=p.features.workbench.finance.find(a=>a.accountId===f.accountId)
 if(!co?.closedAt||!finance||finance.obligations.some(o=>o.contractId===co.id&&o.remainingFen>0))return false
 return ![...co.stageJobs.flat(),...co.supportJobs.map(s=>s.job)].some(j=>j?.status==='planned'||j?.status==='running')
}

/** Copy follows committed public objects. It neither finishes a business nor creates another workflow. */
export function threadPurpose(p:Input,thread:Thread):ThreadPurpose{
 const {focus,stage,outcome}=thread
 if(thread.focusScope==='invalid')return purpose('先找回这份原对象，再决定眼前的一步。','明确重新选择有效的原对象；不会自动接受或替换安排。')
 if(stage==='review-choice')return purpose('先回看本季已经安排的事，再决定把注意力留给哪里。','明确选择一件实际安排；翻阅不重新付费或承诺。')
 const relayObject=focus.kind==='relay'?relayObjectPurpose(p,thread):null
 if(relayObject)return relayObject
 if(thread.focusScope==='history'&&!courseAttemptClosed(p,thread))return purpose(outcome==='non-success'?'回看这次未完成的原尝试，再核对留下的责任。':'回看这次原尝试的实际经过，再决定今天怎样继续。','看清原记录即可合上留页；同对象的当前承诺仍须另行核对。')
 if(focus.kind==='equity'){const journey=equityJourneyFor(p,focus);return purpose(journey.purpose,journey.finishWhen)}
 if(focus.kind==='ecosystem'){const journey=ecosystemJourneyFor(p,focus);return purpose(journey.purpose,journey.finishWhen)}
 if(focus.kind==='first-order'){
  if(stage==='paid')return purpose('收好这笔真实回款，再决定手艺和生活怎样继续。','本单已实际回款；下一份委托、工作或生活都须另行选择。')
  if(outcome==='non-success')return purpose('看清这次小单停在哪里，保留实际成本与旧约定。','核对未完成的结果和原责任后，可以转向；不把停止记成回款。')
  if(stage==='delivery')return purpose('把已经做好的这份作品，亲手交给原客户。','等客户真实复核与原款到账；制作完成还不是这次尝试的终点。')
  if(stage==='waiting')return purpose('等这份已交作品的客户反馈与实际付款。','看见原验收与实收，或原拒绝结果，再决定下一步。')
  return purpose(stage==='offer'?'决定是否用这笔手工委托，试试自己的手艺。':'把答应的这份手工作品认真做完，再亲手提交。','看见这份原单的实际结果；不要求继续接单。')
 }
 if(focus.kind==='market'){
  if(stage==='market-position')return purpose('核对这份实际持仓和生活储备，再决定是否继续持有。','看清持仓与原占款即可暂作停留；不会自动卖出或结束投资。')
  if(stage==='market-settlement'){
   const own=p.features.market.settlements.find(s=>s.id===focus.entityId),fills=new Set(p.features.market.fills.filter(fill=>fill.orderId===focus.entityId).map(fill=>fill.id))
   const unpaid=own?own.accountId===focus.accountId&&own.paidAt===null:p.features.market.settlements.some(s=>s.accountId===focus.accountId&&s.paidAt===null&&fills.has(s.sourceId))
   return unpaid?purpose('等这笔原成交款按期进入原账户，暂不把应收拿来花。','核对原交收实际到账；剩余持仓与下一次买卖仍另行决定。'):purpose('收好这笔已经交收的原款，再核对生活储备。','本笔实际交收可作停留点；其他持仓和委托并未自动结束。')
  }
  if(stage==='market-research')return purpose('给这份公开资料留出研究时间，再决定是否下单。','等这次研究实际完成或明确中断；买卖仍须独立选择。')
  if(stage.startsWith('market-research-'))return purpose(outcome==='non-success'?'看清这次研究的中断与已耗投入。':'收好这次已经完成的公开研究，买不买仍自己决定。','看清本次研究结果即可停留；研究不会揭示未来价格或替你下单。')
  if(stage==='market-history')return purpose(outcome==='non-success'?'收好这份停止等待的原委托，核对已发生的成交。':'看清这份原委托的实际撮合，再决定是否继续承担。','这份委托的结果可作停留点；持仓、费用与原交收各自保留。')
  return purpose(stage==='market-opening'?'先留好生活储备，再决定是否承担一份模拟投资判断。':'守住这份原委托的边界，看看真实撮合会留下什么。','看见实际撮合或明确撤回、不买；持仓和未交收款不会因此消失。')
 }
 if(focus.kind==='work'){
  const period=p.view.operations?.employment.find(e=>e.id===focus.entityId),w=p.features.workbench
  const active=period?.quarter===w.quarter&&!w.atQuarterEnd&&p.view.date<period.limit&&period.segments.some(s=>s.to===null)
  if(stage==='work-offer')return purpose('决定这季是否保留工作，也为生活留些余地。','明确本季安排后，等原在岗日的工资反馈；工作和副业不必二选一。')
  if(active)return purpose('继续这段原工作，核对工资和留给生活的时间。','看清一次工资反馈即可暂作停留；本季仍在岗，后续沿原日历继续。')
  return purpose('收好这段原季度的在岗与工资记录，再决定接下来的日子。','原季度工作与实收核清即可停留；新季度工作须另行决定。')
 }
 if(focus.kind==='life'){
  if(outcome==='actual')return purpose('收好这次已经发生的生活经历，再决定下一段日子。','看见这次安排的实际结果即可停留；新的邀请与承诺不自动接受。')
  if(outcome==='non-success')return purpose('看清这次未完成的生活安排，回应仍在的约定。','核对原成本、关系与未完承诺；不把中断或失约当作完成。')
  return purpose(outcome==='pending'?'把已经答应的这段日子留好，等实际经历发生。':'选一件愿意认真留出时间的人或事。','看见本次安排的实际结果；不要求把生活邀请全部做完。')
 }
 if(focus.kind==='course'){
  if(courseAttemptClosed(p,thread))return purpose(outcome==='non-success'?'本班已按实际退款结果收尾，接下来怎样过日子由你决定。':'本班的学习与原账已经收好，接下来怎样过日子由你决定。','本班已实际结清；可以回到今天，新班仍须另行确认。')
  if(stage==='course-cohort-closed'||stage==='course-cohort-settling')return purpose('把本班原钱款与仍在的责任核对清楚。','原退款、费用与任务都核清后才收好本班；企业其它责任仍保留。')
  if(stage==='course-refund-window')return purpose('留住本班原退款窗口，收好已经发生的学习反馈。','等原窗口结束，再核清原结算、退款与费用。')
  if(outcome==='non-success')return purpose('看清这次课程安排停在哪里，核对实际留下的约定。','按原记录核对任务、支持、退款或有限收尾；不把停止记成完成。')
  if(stage.includes('refresh')||stage.includes('update-required'))return purpose('把这门旧课的原更新接住，保留已有学员的承诺。','这次原更新实际完成并核对旧期限；它不代替教学、支持或退款。')
  if(stage.startsWith('course-recovery')||stage.startsWith('course-support'))return purpose('回应本班实际学习反馈，把答应的支持认真做完。','看到原支持或补救的实际反馈；退款窗口与结算仍须继续核对。')
  if(stage.startsWith('course-stage'))return purpose('把本班答应的教学按原日期交出，保留支持与退款责任。','本段实际交付可作反馈点；还须核对下一段、支持与原退款窗口。')
  if(stage.startsWith('course-cohort'))return purpose('看清这班具体学员与已约定的日子，再承担下一步。','实际完成本班教学、支持并核清原款；报名和预款不是终点。')
  if(stage.startsWith('course-audience'))return purpose('看清这份原报价留下的真实需求，再决定是否开班。','实际受众结果可作停留点；班额、支持、报名和预款仍须另行决定。')
  if(stage==='course-ready')return purpose('样课已经真正准备好，再决定是否承担学员的承诺。','这份准备可到此停留；招生、班期与收费仍须另行选择。')
  if(stage.includes('outline')||stage.includes('preparation'))return purpose('先把这间教室的真实大纲与营业准备留下来。','本次原准备实际完成可作停留点；启用、样课和招生仍分别决定。')
  if(stage==='course-activate')return purpose('大纲与准备已经留下，再决定是否启用这间教室。','实际启用可作停留点；仍未定义课程、完成样课或向学员收费。')
  if(stage==='course-define')return purpose('从已经做过的真实案例，明确这门课想教什么。','课程方案明确后即可停留；定义不等于样课完成，也没有招生。')
  if(stage.includes('rights')||stage.includes('license'))return purpose('把这门课的案例使用范围按原许可核对清楚。','本次原许可实际完成即可停留；样课、招生与收入另定。')
  if(stage.includes('tool'))return purpose('核对这门课当前公开的工具资格，再决定是否继续。','原资格实际可核后再安排样课，不把申请当作批准。')
  if(stage==='course-paused')return purpose('保留这份已暂停的课程，核对恢复条件与旧承诺。','明确恢复、继续暂停或原收尾；已有学员与费用不会自动清除。')
  return purpose('从真实案例准备这一堂课，先把大纲与样课做扎实。','样课实际完成、权利和资格可核，便可收好这份准备；不自动招生。')
 }
 if(focus.kind==='video'){
  if(outcome==='non-success')return purpose('看清这份作品停在哪里，把原商单和费用收好。','核对原退款、欠费与有限退出；停止不等于验收或实收。')
  if(stage==='video-settled'||stage==='video-platform-paid')return purpose('收好这份作品的真实回款，再决定投入或回到生活。','本单实际回款可作停留点；原费用与账号其它责任仍须核对。')
  if(stage.includes('marketing'))return purpose('看清本账号这次推广留下的真实需求，再决定接谁的委托。','实际询价结果即可停留；推广不是订单，客户仍须自己选。')
  if(stage==='video-published')return purpose('看清这份原发布的实际反馈，再决定作品和生活怎样继续。','实际统计可作反馈点；播放不是现金，原平台应收仍须分别核对。')
  if(stage==='video-affiliate-window'||stage.startsWith('video-platform-'))return purpose('等这份原发布的实际留存与交收，不把流量当作钱。','看到原观察或实际交收结果；退款、费用与下一次发布仍另核。')
  if(['video-revision','video-negotiating','video-quality'].includes(stage))return purpose('回应这一版已经公开的问题，核对修改范围与真实代价。','看见原客户反馈或明确有限退出；返工和谈判都不是自动验收。')
  if(['video-client-review','video-payment-wait'].includes(stage))return purpose('等这份已交作品的真实验收与原款到账。','原验收与实际付款分别核对；还未到账的钱不能提前花。')
  return purpose('把这份具体作品认真做出来，再决定交给谁、发到哪里。','看到本作品的真实客户或发布反馈即可停留；不自动接下一单。')
 }
 if(focus.kind==='relay'){
  if((focus.relayTarget===null||['business','audience','customer'].includes(focus.relayTarget.kind))&&['relay-opening','relay-preparation','relay-supply','relay-marketing','relay-intake','relay-terms','relay-funding','relay-planning','relay-records'].includes(stage)){
   const next=relayJourneyScene(relayJourneyAction({...p,accountId:focus.accountId},focus.relayTarget))
   if(next)return purpose(next.title,next.finishWhen)
  }
  if(stage==='relay-opening')return purpose('先明确这次要继续的原服务，或另作新准备。','明确翻选同一份原对象即可继续核对；没有自动开站、签约或充值。')
  if(focus.relayTarget?.kind==='audience'){
   const t=focus.relayTarget,signed=p.features.relay?.customers.some(c=>c.businessId===t.businessId&&c.originAudienceId===t.audienceId)
   return signed?purpose('这次显选客户的原约定已留下，再核对服务与生活的安排。','不必签完整份名单；充值与新的服务仍分别显选，也可以先回生活。'):purpose('收好这次实际需求回信，再决定是否承担新的约定。','本次需求结果可作停留点；没有自动签约，新的投入仍由你决定。')
  }
  if(focus.relayTarget?.kind==='customer')return purpose('收好这位原客户的约定与原账，再决定接下来承担什么。','本次合同与余额可作停留点；服务、充值、收款与续约仍分别决定。')
  if(stage==='relay-period-closed')return purpose('收好这一期实际服务与原账，再决定还想承担什么。','本期结清可作停留点；客户余额、供应资产与企业旧责任另列。')
  if(outcome==='non-success'||stage==='relay-stopping'||stage==='relay-closed')return purpose('看清停下后的原服务、余额和责任，再决定怎样收尾。','原支持、退款与欠款按实际记录处理；停站不会清债。')
  if(stage==='relay-supplier-letter'||stage==='relay-supply')return purpose('把这份原供应申请与回信核对清楚，再决定服务承诺。','亲读实际回信并核对原适配；申请完成不等于已经获批。')
  if(['relay-service','relay-planned'].includes(stage))return purpose('把这一期答应客户的服务按原资源和预算走完。','服务实际结束是一处反馈点；原支持、核账与收款仍分别继续。')
  if(stage==='relay-support')return purpose('把这一期原支持认真做完，不让服务结束代替兑现。','看见原支持实际结果，再核对原计量、退款与到期款。')
  if(['relay-audit-ready','relay-audit-waiting','relay-correction'].includes(stage))return purpose('核对这一期已发生的原计量，只回应实际公开的差额。','独立复核与必要更正完成可作反馈点；应收应付仍按原单日期。')
  if(['relay-collection','relay-settling'].includes(stage))return purpose('按原到期日收好客户原款，核对供应和支持两边的账。','实际收款与未付责任分别核清；不把本期收入当作企业全部结清。')
  if(stage==='relay-market-change')return purpose('核对本站已经公开的供应与市场变化，保留原合同。','读清本次已发生变化即可停留；未来报价、供应和授权仍须另行决定。')
  if(stage==='relay-paused')return purpose('看清本站暂停了什么，以及仍要继续的原约定。','明确恢复或有限收尾；暂停新合同或交通都不清除旧支持和账款。')
  if(stage==='relay-records')return purpose('回看这一份原服务记录，再明确今天要继续的事。','看清本对象的原日期与实际结果即可停留；新委托仍须另行选择。')
  return purpose('先核清供应和具体客户，再决定这一期愿意承担什么。','准备、许可和客户承诺核清后再安排服务；不自动签约或充值。')
 }
 return purpose('把这一季留给自己愿意承担的安排。','明确选择工作、生活、投资或暂缓；不要求经营任何一条路线。')
}
