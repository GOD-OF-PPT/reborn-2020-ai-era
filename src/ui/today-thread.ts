import type {GamePanelProps} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import {openingFocusFor,playerThread,type OpeningFocus,type PlayerThreadView,type ThreadResultRef} from './player-thread.ts'
import {seasonRecollection,type SeasonRecollectionView} from './season-thread.ts'
import {videoFocusOpen} from './video-player-thread.ts'
import {courseFocusOpen} from './course-player-thread.ts'
import {isCoursePreparationThread,isCourseContinuityThread} from './course-continuity.ts'
import {relayFocusOpen,relayFocusFor,relayBusinessTarget} from './relay-player-thread.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export type TodayThreadInput=Pick<GamePanelProps,'view'|'features'>
export type TodayThreadClassification='entry'|'active'|'carry'|'result'|'history'|'invalid'|'other'
export interface TodayThreadItem{
 readonly focus:OpeningFocus
 readonly classification:'active'|'carry'
 readonly title:string
 readonly line:string
 readonly originQuarter:string|null
 readonly wait?:NonNullable<PlayerThreadView['wait']>
 readonly inspect:PlayerThreadView['inspect']
 readonly sourceRefs:readonly ThreadResultRef[]
 readonly relayContinuation?:TodayRelayContinuation
}
export interface TodayRelayContinuation{readonly kind:'period'|'support'|'audit'|'application'|'audience'|'task'|'money'|'unknown';readonly label:string}
export interface TodayDirection{readonly id:'work'|'life'|'market'|'video'|'course'|'relay';readonly label:string;readonly line:string;readonly screen:Screen}
export interface TodayThreadView{
 readonly source:{readonly runId:string;readonly revision:number;readonly date:string;readonly quarter:string}
 readonly primary:{readonly thread:PlayerThreadView;readonly classification:TodayThreadClassification;readonly supported:boolean;readonly originQuarter:string|null;readonly sourceRefs:readonly ThreadResultRef[]}
 readonly title:string
 readonly line:string
 readonly question:string
 readonly ongoing:readonly TodayThreadItem[]
 readonly directions:readonly TodayDirection[]
 readonly remaining:SeasonRecollectionView['remaining']
 readonly wait:NonNullable<PlayerThreadView['wait']>|null
 readonly responsibilityOverrideNeeded:boolean
}

const supported=(thread:PlayerThreadView)=>['free','work','life','market','video','relay'].includes(thread.focus.kind)||isCourseContinuityThread(thread)
type RelayFocus=Extract<OpeningFocus,{kind:'relay'}>
type RelayContinuation=TodayRelayContinuation&{readonly title?:string;readonly line?:string;readonly wait?:NonNullable<PlayerThreadView['wait']>;readonly sourceRefs?:readonly ThreadResultRef[]}
const one=<T,>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
const validDate=(value:string|null|undefined):value is string=>{try{isoDate(value);return true}catch{return false}}
const nonnegative=(value:number)=>Number.isSafeInteger(value)&&value>=0
const unresolvedRelay:RelayContinuation={kind:'unknown',label:'先核对本站原责任的来源',title:'原站的责任来源，仍需核对。',line:'原任务、款项或主体来源尚不能唯一核定；没有新增服务，也不能把未知写成旧责任已经清除。'}
function jobContinuation(job:ProductionJob):RelayContinuation{
 const support=job.definitionId.startsWith('relay-support-'),audit=job.definitionId==='relay-meter-audit',quote=job.definitionId==='relay-requote',name=support?'原支持':audit?'原复核':quote?'原报价谈判':job.definitionId==='relay-service'?'原服务':['relay-preparation','relay-adapter'].includes(job.definitionId)?'原准备工作':'原经营任务',date=job.status==='planned'?job.startAt:job.completeAt
 return {kind:support?'support':audit?'audit':'task',label:'继续这份'+name,title:'这份'+name+'仍按原安排继续。',line:job.startAt+'—'+job.completeAt+'的原任务'+(job.status==='planned'?'已经安排，尚未开工。':'已经实际开工，仍在进行。')+'查看不会重新付费、返行动或新增服务。',wait:{date,label:job.status==='planned'?'等这份'+name+'开工':'等这份'+name+'反馈'},sourceRefs:[{kind:'job',id:job.id,date:job.startAt}]}
}
function businessContinuation(p:TodayThreadInput,target:RelaySceneTarget,jobs?:readonly ProductionJob[]):RelayContinuation|null{
 const v=p.features.relay,business=v&&one(v.businesses.filter(b=>b.id===target.businessId)),account=one(p.view.accounts.filter(a=>a.accountId===target.accountId)),finance=one(p.features.workbench.finance.filter(a=>a.accountId===target.accountId))
 if(!v||!business||!account||!finance||account.cashFen!==finance.cashFen||account.payableFen!==finance.payableFen||!nonnegative(finance.accruedCostFen))return unresolvedRelay
 const active=[...(jobs??p.view.operations?.jobs.filter(j=>j.businessId===target.businessId&&['planned','running'].includes(j.status))??[])].sort((a,b)=>a.status===b.status?a.startAt.localeCompare(b.startAt):a.status==='running'?-1:1)
 if(new Set(active.map(j=>j.id)).size!==active.length||active.some(j=>!validDate(j.startAt)||!validDate(j.completeAt)||j.completeAt<j.startAt||j.businessId!==target.businessId))return unresolvedRelay
 if(active.length)return jobContinuation(active[0]!)
 for(const q of v.quotes.filter(q=>q.businessId===business.id&&q.completedAt!==null)){
  if(!validDate(q.completedAt)||q.completedAt>p.view.date||!validDate(q.effectiveAt))return unresolvedRelay
  if(q.effectiveAt<=p.view.date)continue
  const job=one(p.view.operations?.jobs.filter(j=>j.id===q.jobId&&j.businessId===business.id)??[])
  if(!job||job.definitionId!=='relay-requote'||job.status!=='completed'||q.job?.id!==job.id||q.job.businessId!==business.id||q.job.status!=='completed'||q.job.actionId!==job.actionId||q.job.startAt!==job.startAt||q.job.completeAt!==job.completeAt||job.completeAt>q.completedAt||!q.customerIds.length||new Set(q.customerIds).size!==q.customerIds.length||q.customerIds.some(id=>v.customers.filter(c=>c.id===id&&c.businessId===business.id).length!==1)||q.responses.length!==q.customerIds.length||new Set(q.responses.map(r=>r.customerId)).size!==q.customerIds.length||q.responses.some(r=>!q.customerIds.includes(r.customerId)||typeof r.accepted!=='boolean'))return unresolvedRelay
  if(q.responses.some(r=>r.accepted))return {kind:'task',label:'等这份已谈妥的原报价生效',title:'原报价已经谈妥，仍等自己的生效日。',line:'实际接受者的未来报价到'+q.effectiveAt+'才生效；旧价格与已经发生的原账不追改，没有自动安排新一期。',wait:{date:q.effectiveAt,label:'等原报价生效'},sourceRefs:[{kind:'job',id:q.jobId,date:q.completedAt}]}
 }
 const customers=v.customers.filter(c=>c.businessId===business.id),invoices=v.receivables.filter(i=>customers.some(c=>c.id===i.customerId)),history=v.casebook
 if(customers.some(c=>!nonnegative(c.balance.receivableFen))||invoices.some(i=>![i.amountFen,i.collectedFen,i.reversedFen].every(nonnegative)||i.amountFen<i.collectedFen+i.reversedFen))return unresolvedRelay
 const receivable=invoices.reduce((sum,i)=>sum+i.amountFen-i.collectedFen-i.reversedFen,0)
 if(receivable!==customers.reduce((sum,c)=>sum+c.balance.receivableFen,0))return unresolvedRelay
 const ready=history?.status==='ready'&&history.runId===p.view.runId&&history.revision===p.view.revision&&history.asOf===p.view.date
 if(history&&!ready)return unresolvedRelay
 const debts=ready?history.obligationHistory.filter(o=>o.scopeBusinessId===business.id&&o.accountId===business.accountId&&o.remainingFen>0):finance.obligations.filter(o=>o.businessId===business.id&&o.remainingFen>0)
 if(debts.some(o=>!nonnegative(o.remainingFen)||!validDate(o.date))||business.company&&v.businesses.filter(b=>b.accountId===business.accountId).length===1&&debts.reduce((sum,o)=>sum+o.remainingFen,0)!==account.payableFen)return unresolvedRelay
 if(receivable>0||debts.length)return {kind:'money',label:'核对本站原款与旧义务',title:'本站仍有原款与旧义务，分别核对。',line:'原客户净未收'+moneyText(receivable)+'；本站原义务尚欠'+moneyText(debts.reduce((sum,o)=>sum+o.remainingFen,0))+'。到期、实收和付款各按自己的原记录；这不是一份新服务，也不要求为回今天先清空余额。'}
 // Ordinary operation/preparation, retained customer protection and unused
 // supplier assets are available directions, not another service promise.
 return null
}
function relayContinuation(p:TodayThreadInput,focus:RelayFocus):RelayContinuation|null{
 const target=focus.relayTarget,v=p.features.relay
 if(!target||!v)return null
 const resolved=resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:focus.accountId,operations:p.view.operations})
 if(resolved.status!=='valid')return null
 if(target.kind==='business')return businessContinuation(p,target)
 if(target.kind==='customer')return resolved.customer!.balance.receivableFen>0?{kind:'money',label:'核对这位原客户的款项与旧约'}:null
 if(target.kind==='application')return resolved.job&&['planned','running'].includes(resolved.job.status)?{...jobContinuation(resolved.job),kind:'application',label:'等这份原供应申请回信',title:'原供应申请仍在等回信。'}:!resolved.application!.read&&resolved.job?.status==='completed'?{kind:'application',label:'亲读这份原供应回信'}:null
 if(target.kind==='audience')return relayFocusOpen(p,focus)?{...(resolved.job?jobContinuation(resolved.job):{}),kind:'audience',label:'等这份原获客反馈',title:'这份原获客安排仍在继续。'}:null
 if(resolved.job&&['planned','running'].includes(resolved.job.status))return jobContinuation(resolved.job)
 const period=resolved.period!,support=period.supportJob
 if(support&&['interrupted','cancelled'].includes(support.status)&&(period.feePostedAt===null||period.compensatedAt===null))return validDate(support.completeAt)&&support.completeAt>p.view.date?{kind:'support',label:'等这期原支持的后果结算',line:'原支持已经停止，已用投入不退；仍等'+support.completeAt+'原结算，不是免费补做，也不预告收入或赔付。',wait:{date:support.completeAt,label:'等原支持后果结算'}}:unresolvedRelay
 if(!relayFocusOpen(p,focus))return null
 const active=[period.job,period.supportJob,...v.auditJobs.filter(a=>a.businessId===target.businessId&&a.periodIds.includes(period.id)).map(a=>a.job)].filter((job):job is ProductionJob=>!!job&&['planned','running'].includes(job.status))
 if(active.length){const value=jobContinuation(active[0]!);return {...value,kind:active[0]!.id===period.jobId?'period':value.kind,label:active[0]!.id===period.jobId?'继续这期原服务':active[0]!.id===period.supportJobId?'继续这期原支持':'继续这份原复核'}}
 return {kind:'money',label:'核对这期原款、计量与旧责任'}
}

/** Actual public arrangements decide whether a result is also still an ongoing commitment. */
function classification(p:TodayThreadInput,thread:PlayerThreadView):TodayThreadClassification{
 if(thread.focusStatus==='invalid')return 'invalid'
 const f=thread.focus,id=f.entityId,w=p.features.workbench
 if(!supported(thread))return 'other'
 if(f.kind==='free'||id===null||thread.focusScope==='entry')return 'entry'
 let open=false
 if(f.kind==='video')open=videoFocusOpen(p,f)
 else if(f.kind==='relay'){
  open=relayContinuation(p,f)!==null
  if(!open&&f.relayTarget?.kind==='business'&&p.features.relay?.businesses.some(b=>b.id===f.relayTarget!.businessId&&['discovered','preparing','operating','paused'].includes(b.lifecycle)))return 'entry'
 }
 else if(f.kind==='course')open=courseFocusOpen(p,f)
 else if(f.kind==='work'){
  const period=p.view.operations?.employment.find(row=>row.id===id)
  open=!!period&&period.quarter===w.quarter&&!w.atQuarterEnd&&p.view.date<period.limit&&period.segments.some(segment=>segment.from<=p.view.date&&(segment.to===null||segment.to>p.view.date))
 }else if(f.kind==='life'){
  const job=p.features.life.jobs.find(row=>row.id===id),promise=p.features.life.promises.find(row=>row.id===id)
  if(promise?.status==='offered')return 'entry'
  open=job?.status==='running'||promise?.status==='accepted'
 }else if(f.kind==='market'){
  const m=p.features.market,order=m.orders.find(row=>row.id===id),research=m.researches.find(row=>row.id===id),settlement=m.settlements.find(row=>row.id===id),position=m.positions.find(row=>row.id===id)
  open=!!order&&['planned','pending','partially_filled'].includes(order.status)
   ||research?.status==='running'||!!settlement&&settlement.paidAt===null||!!position&&position.quantity>0
   ||!!order&&m.fills.some(fill=>fill.orderId===order.id&&m.settlements.some(row=>row.accountId===f.accountId&&row.sourceId===fill.id&&row.paidAt===null))
 }
 if(open)return thread.focusQuarter!==null&&thread.focusQuarter<w.quarter?'carry':'active'
 return thread.focusScope==='history'?'history':'result'
}

function ongoing(p:TodayThreadInput):TodayThreadItem[]{
 const base={runId:p.view.runId,accountId:'personal',entityId:null},candidates:OpeningFocus[]=[],items:TodayThreadItem[]=[],seen=new Set<string>(),relayFacts=new Map<string,RelayContinuation>()
 for(const period of p.features.workbench.employment)candidates.push({...base,kind:'work',entityId:period.id})
 for(const job of p.features.life.jobs.filter(row=>row.status==='running'&&row.promiseId===null))candidates.push({...base,kind:'life',selection:job.personId??(job.kind==='workspace'?'workspace':'rest'),entityId:job.id})
 for(const promise of p.features.life.promises.filter(row=>row.status==='accepted'))candidates.push({...base,kind:'life',selection:promise.personId,entityId:promise.id})
 for(const order of p.features.market.orders)candidates.push({...base,kind:'market',accountId:order.accountId,entityKind:'order',entityId:order.id})
 for(const settlement of p.features.market.settlements.filter(row=>row.paidAt===null))candidates.push({...base,kind:'market',accountId:settlement.accountId,entityKind:'settlement',entityId:settlement.id})
 for(const position of p.features.market.positions.filter(row=>row.quantity>0))candidates.push({...base,kind:'market',accountId:position.accountId,entityKind:'position',entityId:position.id})
 for(const research of p.features.market.researches.filter(row=>row.status==='running'))candidates.push({...base,kind:'market',entityKind:'research',entityId:research.id})
 const video=p.features.video
 if(video){
  const addVideo=(target:Parameters<typeof openingFocusFor>[2])=>{const candidate=openingFocusFor(p,'video',target);if(candidate)candidates.push(candidate)}
  for(const contract of video.contracts)addVideo({videoTarget:{channelId:contract.channelId,workId:contract.workId,contractId:contract.id}})
  for(const work of video.works.filter(row=>row.contractId===null))addVideo({videoTarget:{channelId:work.channelId,workId:work.id}})
  for(const marketing of video.marketing)addVideo({videoTarget:{channelId:marketing.channelId,marketingId:marketing.id}})
 }
 const course=p.features.course
 if(course){
  const addCourse=(target:NonNullable<Extract<OpeningFocus,{kind:'course'}>['courseTarget']>)=>{const candidate=openingFocusFor(p,'course',{courseTarget:target});if(candidate)candidates.push(candidate)}
  for(const business of course.businesses.filter(b=>b.lifecycle==='preparing'&&!course.outlines.some(o=>o.businessId===b.id&&o.job&&['planned','running'].includes(o.job.status))))addCourse({kind:'studio',businessId:business.id})
  for(const outline of course.outlines.filter(o=>o.job&&['planned','running'].includes(o.job.status)))addCourse({kind:'outline',businessId:outline.businessId,outlineId:outline.id})
  for(const lesson of course.courses.filter(c=>['draft','building'].includes(c.status)))addCourse({kind:'course',businessId:lesson.businessId,courseId:lesson.id,...(lesson.sampleJobId?{sampleJobId:lesson.sampleJobId}:{})})
  for(const license of course.licenses.filter(l=>l.job&&['planned','running'].includes(l.job.status)&&!course.courses.some(c=>['draft','building'].includes(c.status)&&c.businessId===l.businessId&&c.cases.some(ref=>ref.id===l.caseId))))addCourse({kind:'license',businessId:license.businessId,licenseId:license.id})
  for(const audience of course.audiences.filter(a=>a.job&&['planned','running'].includes(a.job.status))){const lesson=course.courses.find(c=>c.id===audience.courseId);if(lesson)addCourse({kind:'audience',businessId:lesson.businessId,courseId:lesson.id,audienceId:audience.id})}
  for(const cohort of course.cohorts.filter(co=>co.closedAt===null)){const lesson=course.courses.find(c=>c.id===cohort.courseId);if(lesson)addCourse({kind:'cohort',businessId:lesson.businessId,courseId:lesson.id,cohortId:cohort.id})}
  for(const lesson of course.courses.filter(c=>c.refreshes.some(r=>!r.applied&&r.job&&['planned','running'].includes(r.job.status))&&!course.cohorts.some(co=>co.courseId===c.id&&co.closedAt===null)))addCourse({kind:'course',businessId:lesson.businessId,courseId:lesson.id})
 }
 const relay=p.features.relay
 if(relay){
  for(const business of relay.businesses){
   const baseTarget=relayBusinessTarget(p,business.id)
   if(!baseTarget)continue
   const periods=relay.periods.filter(period=>period.businessId===business.id)
   let hasOpenChild=false
    const add=(target:NonNullable<Extract<OpeningFocus,{kind:'relay'}>['relayTarget']>)=>{const focus=relayFocusFor(p,target),facts=relayContinuation(p,focus);if(facts){candidates.push(focus);relayFacts.set(JSON.stringify(focus),facts);hasOpenChild=true}}
   for(const period of periods)add({...baseTarget,kind:'period',periodId:period.id})
   for(const application of relay.applications.filter(row=>row.businessId===business.id))add({...baseTarget,kind:'application',applicationId:application.id})
   for(const audience of relay.audiences.filter(row=>row.businessId===business.id))add({...baseTarget,kind:'audience',audienceId:audience.id})
    const childJobs=new Set([...periods.flatMap(p=>[p.jobId,p.supportJobId]),...relay.auditJobs.filter(a=>a.businessId===business.id).map(a=>a.jobId),...relay.applications.filter(a=>a.businessId===business.id).map(a=>a.jobId),...relay.audiences.filter(a=>a.businessId===business.id).flatMap(a=>a.jobId?[a.jobId]:[])])
    const uncovered=p.view.operations?.jobs.filter(j=>j.businessId===business.id&&['planned','running'].includes(j.status)&&!childJobs.has(j.id))??[]
    if(!hasOpenChild||uncovered.length){const facts=businessContinuation(p,baseTarget,uncovered),focus=relayFocusFor(p,baseTarget);if(facts){candidates.push(focus);relayFacts.set(JSON.stringify(focus),facts)}}
  }
 }
 for(const focus of candidates){
  const thread=playerThread(p,focus),state=classification(p,thread)
  if(state!=='active'&&state!=='carry')continue
  if(thread.focus.kind==='market'&&thread.focus.entityKind==='settlement'){
   const settlement=p.features.market.settlements.find(row=>row.id===thread.focus.entityId)
   // One sale stays one continuing choice. Its complete settlement remains in remaining/the original book.
   if(settlement?.kind==='sale'&&items.some(item=>item.focus.kind==='market'&&item.focus.entityKind==='order'&&item.focus.accountId===settlement.accountId
    &&p.features.market.fills.some(fill=>fill.id===settlement.sourceId&&fill.orderId===item.focus.entityId)))continue
  }
  const key=JSON.stringify([thread.focus.kind,thread.focus.accountId,thread.focus.entityId])
  if(seen.has(key))continue
  seen.add(key)
   const relay=thread.focus.kind==='relay'?relayFacts.get(JSON.stringify(thread.focus))??relayContinuation(p,thread.focus):null
   const feedback=relay?.wait??thread.wait
   items.push({focus:thread.focus,classification:state,title:relay?.title??thread.title,line:relay?.line??thread.line,originQuarter:thread.focusQuarter,inspect:thread.inspect,sourceRefs:(relay?.sourceRefs??thread.resultRefs).map(ref=>({...ref})),...(feedback?{wait:{...feedback}}:{}),...(relay?{relayContinuation:{kind:relay.kind,label:relay.label}}:{})})
 }
 return items
}

function wait(p:TodayThreadInput):TodayThreadView['wait']{
 const w=p.features.workbench
 if(w.pause||w.progression.requiresDelivery||w.atQuarterEnd&&w.progression.nextQuarterDate===null)return null
 const requested=w.atQuarterEnd?w.progression.nextQuarterDate:w.progression.nextDate
 if(!requested)return null
 try{return {date:playableAdvanceDate(w,p.view.date,requested),label:w.atQuarterEnd?'核对旧约定，进入下一季':'让已确认的日子继续'}}catch{return null}
}

const directions:readonly TodayDirection[]=[
 {id:'work',label:'看看今天的工作安排',line:'先核对本季是否已在岗，再决定新的工作；原工资与行动分别保留。',screen:'quarter'},
 {id:'life',label:'给生活留一段日子',line:'休整、住处与原来认识的人，仍由你明确选择时间和投入。',screen:'life'},
 {id:'video',label:'给自己的视频尝试留一段时间',line:'显选账号、作品和客户，原制作与平台结算继续；新的投入仍要确认。',screen:'video'},
 {id:'course',label:'把做过的事，认真准备成一堂课',line:'显选教案、已付案例与样课；资金、权利、工具资格和日期仍须核对，不自动招生。',screen:'course'},
 {id:'relay',label:'看看谁需要一份可靠的服务',line:'显选资本、供应和客户承诺，实际服务与核账后再决定下一次投入。',screen:'relay'},
 {id:'market',label:'想想这笔钱的去处',line:'核对公开研究、原委托和持仓，再决定是否承担下一份模拟交易。',screen:'market'},
]

/** A read-only view of today. It neither replaces the primary pin nor executes any direction. */
export function todayThread(p:TodayThreadInput,focus?:OpeningFocus|null,focusQuarter?:string|null):TodayThreadView|null{
 if(p.view.phase!=='playing')return null
 const season=seasonRecollection(p)
 // Missing public chapter context must fall back, never claim that its responsibilities are empty.
 if(!season)return null
 const thread=playerThread(p,focus,focusQuarter),state=classification(p,thread),current=ongoing(p),remaining=[...season.remaining]
 const relayAccounts=new Set(p.features.relay?.businesses.map(b=>b.accountId)??[])
 for(const account of p.features.workbench.finance.filter(a=>relayAccounts.has(a.accountId)&&a.accruedCostFen>0))remaining.push({id:'today-relay-accrual:'+account.accountId,title:'本账户已有尚未出账的原成本',line:'截至'+p.view.date+'本账户已发生未出账成本'+moneyText(account.accruedCostFen)+'，可能包括原维护与在岗工资等；不是一份新服务，也不是此刻保证支付的现金额。',dueAt:null,accountId:account.accountId,urgent:false,sourceRefs:[{kind:'account',id:account.accountId,date:p.view.date}],focus:null,inspect:{screen:'finance',label:'核对原维护、工资与完整账户原账',target:{accountId:account.accountId}}})
 return {
  source:{runId:p.view.runId,revision:p.view.revision,date:p.view.date,quarter:p.features.workbench.quarter},
  primary:{thread,classification:state,supported:supported(thread),originQuarter:thread.focusQuarter,sourceRefs:thread.resultRefs.map(ref=>({...ref}))},
   title:'回到今天，慢慢决定',line:(current.length?current.some(item=>item.relayContinuation&&['money','unknown'].includes(item.relayContinuation.kind))?'原安排与仍待核对的旧事项继续保留；今天的去向由你决定。':'已经答应的事仍照原约定继续；今天的去向由你决定。':'旧结果留在原记录。接下来的日子，可以重新选择。')+(remaining.some(item=>item.id.startsWith('today-relay-accrual:'))?'已发生的原维护、工资等未出账成本仍在原账，不因回到今天清除。':''),
   question:thread.focus.kind==='video'&&(state==='result'||state==='history')?'接下来是回应已有询价、做另一份作品，还是暂不新增制作？原结果与未完约定都留着。':thread.focus.kind==='course'&&(state==='result'||state==='history')?isCoursePreparationThread(thread)?'这份教学准备留下后，是先看下一步、另备一份教案，还是把日子留给生活？样课与招生、学费仍分别决定。':thread.focus.courseTarget?.kind==='cohort'?'这一班已经发生的学习与钱款都留着。先续上未完承诺，还是不再新增安排，把日子留给生活？':'这次实际受众已经留下。是否作出开班承诺、另定受众，或先回生活，仍由你明确决定。':season.nextQuestion,ongoing:current,directions:directions.map(direction=>({...direction})),remaining,wait:wait(p),responsibilityOverrideNeeded:thread.responsibilityOverrideNeeded,
 }
}
