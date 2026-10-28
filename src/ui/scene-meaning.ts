import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {SeasonRecollectionView} from './season-thread.ts'
import {resolveCourseFocus} from './course-player-thread.ts'
import {resolveRelaySceneTarget,relayTargetEntity} from './relay-scene-target.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {addDays,quarterOf} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export type SceneMeaningInput=Pick<GamePanelProps,'view'|'features'|'accountId'>
export interface MeaningSourceRef{readonly kind:string;readonly id:string;readonly date:string|null}
export interface SceneMeaning{
 readonly title:string
 readonly situation:string
 readonly question:string|null
 readonly sourceRefs:readonly MeaningSourceRef[]
}
const one=<T>(rows:readonly T[]):T|null=>rows.length===1?rows[0]!:null
const meaning=(title:string,situation:string,question:string|null,sourceRefs:readonly MeaningSourceRef[]):SceneMeaning=>({title,situation,question,sourceRefs:sourceRefs.map(ref=>({...ref}))})
const ref=(kind:string,id:string,date:string|null):MeaningSourceRef=>({kind,id,date})
const active=(status:string)=>status==='planned'||status==='running'

function courseMeaning(p:SceneMeaningInput,thread:PlayerThreadView):SceneMeaning|null{
 const f=thread.focus
 if(f.kind!=='course'||!f.courseTarget||resolveCourseFocus(p,f).reason)return null
 const t=f.courseTarget,v=p.features.course!
 if(t.kind!=='course'&&t.kind!=='cohort')return null
 const course=one(v.courses.filter(c=>c.id===t.courseId&&c.businessId===t.businessId))
 if(!course||course.createdAt>p.view.date)return null
 const refs=[ref('course',course.id,course.createdAt)]
 if(t.kind==='course'){
  const business=one(v.businesses.filter(business=>business.id===course.businessId))
  // A completed sample survives a stop; it does not make new enrollment current.
  if(course.paused||business?.lifecycle!=='operating')return null
  const sampleId=t.sampleJobId??course.sampleJobId
  const job=one(p.view.operations?.jobs.filter(j=>j.id===sampleId&&j.businessId===course.businessId)??[])
  if(course.status!=='ready'||!job||job.status!=='completed'||job.completeAt>p.view.date||job.id!==course.sampleJobId)return null
  refs.push(ref('job',job.id,job.completeAt))
  const cohorts=v.cohorts.filter(co=>co.courseId===course.id&&co.createdAt<=p.view.date)
  if(cohorts.length){
   refs.push(...cohorts.map(co=>ref('cohort',co.id,co.createdAt)))
   const open=cohorts.some(co=>co.closedAt===null)
   return meaning('样课留在这里，原班的记录也还在。',open?'这份准备已有班期，原教学、支持与退款仍须按各自记录继续。':'这份准备已有实际班期记录；旧购买身份和费用不会因再看样课重置。','先了解谁可能需要这堂课，还是合上教案看看今天？',refs)
  }
  return meaning('样课做好了。',course.name+'已经留下，还没有班期或学员承诺。','先了解谁可能需要这堂课，还是把今天留给自己？',refs)
 }
 if(t.jobId!==undefined)return null // A historical attempt is not the later whole-class result.
 const co=one(v.cohorts.filter(co=>co.id===t.cohortId&&co.courseId===course.id))
 if(!co||co.createdAt>p.view.date)return null
 refs.push(ref('cohort',co.id,co.createdAt))
 const retained=co.students.filter(s=>s.paidRemainingFen>0),delivered=co.stages.filter(s=>s.deliveredAt!==null&&s.deliveredAt<=p.view.date).length
 if(co.closedAt!==null){
  if(co.closedAt>p.view.date)return null
  refs.push(ref('cohort-close',co.id,co.closedAt))
  const refunded=co.students.reduce((sum,s)=>sum+s.refundedFen,0)
  return meaning(co.students.length===0?'这一班，没有等来学员。':retained.length===0?'这一班，按原退款记录收尾了。':'这一班，已经按原记录收好了。',co.closedAt+'实际收尾；'+retained.length+'名学员留存'+(refunded>0?'，已记退款'+moneyText(refunded)+'，实付与待付仍看原账':'')+'。原费用与购买身份保留。','下次还想承担怎样的承诺，还是先回到自己的生活？',refs)
 }
 const unresolved=course.unresolvedUpdates.filter(update=>update.resolvedAt===null)
 const stage=co.stages.find(s=>s.deliveredAt===null)
 const product=one(v.catalog.products.filter(product=>product.id===course.productId))
 const refresh=one(COURSE_JOBS.filter(job=>job.id===`course-refresh-${course.productId}-${course.topicId}`))
 const runningStage=stage?(co.stageJobs[stage.index]?.some(job=>job?.status==='running'&&job.startAt<=p.view.date&&job.completeAt<=stage.dueAt)??false):false
 // An unstarted teaching reservation cannot bypass a currently required update.
 // Use an optimistic lower bound: a future planned refresh can be cancelled and
 // rescheduled; an already running refresh might finish sooner than a new one.
 const earliestRefresh=refresh?course.refreshes.filter(row=>!row.applied&&row.job&&active(row.job.status)&&row.job.completeAt>=p.view.date)
  .reduce((date,row)=>row.job!.completeAt<date?row.job!.completeAt:date,addDays(p.view.date,refresh.durationDays)):null
 const earliestTeaching=unresolved.length?earliestRefresh:p.view.date
 // A public deadline plus mandatory published durations can disprove feasibility.
 // This is neither a forecast of a hidden event nor permission to execute a repair.
 const cannotFinish=retained.length>0&&(co.teachingCancelled||!!stage&&!!product&&!runningStage&&earliestTeaching!==null&&addDays(earliestTeaching,product.stageDays)>stage.dueAt)
 if(cannotFinish){
  refs.push(...unresolved.map(update=>ref('course-update',update.id,update.dueAt)))
  return meaning('这次已经来不及按原约定交完。',co.startAt+'班已交出'+delivered+'/'+co.stages.length+'段；原教学期限、已耗投入与学员退款责任仍在。','先核对停止与原退款收尾，还是暂不新增承诺、看看生活？',refs)
 }
 if(thread.stage==='course-cohort-update-required'&&unresolved.length){
  refs.push(...unresolved.map(update=>ref('course-update',update.id,update.dueAt)))
  const dueAt=unresolved.map(update=>update.dueAt).sort()[0]!
  return meaning(retained.length?'旧课有更新，学员还在等。':'这堂课有更新，先看看答应过什么。',retained.length+'名学员仍在，已交出'+delivered+'/'+co.stages.length+'段；课后支持至'+co.supportCompleteAt+'。','更新期限'+dueAt+'；这一周怎样留给旧课和自己？',refs)
 }
 return meaning(thread.title,co.startAt+'班，'+retained.length+'名留存学员，已交出'+delivered+'/'+co.stages.length+'段；原支持和退款期限照常。',retained.length?'接下来的时间怎样留给教学和自己？':'先核对原班安排，还是今天暂不增加新的承诺？',refs)
}

function relayMeaning(p:SceneMeaningInput,thread:PlayerThreadView):SceneMeaning|null{
 const f=thread.focus
 if(f.kind!=='relay'||!f.relayTarget||f.entityId!==relayTargetEntity(f.relayTarget)||f.businessId!==f.relayTarget.businessId)return null
 const r=resolveRelaySceneTarget(p.features.relay,f.relayTarget,{runId:p.view.runId,accountId:f.accountId,operations:p.view.operations})
 if(r.status!=='valid'||!r.period||f.relayTarget.kind!=='period'||f.relayTarget.jobId!==undefined||f.relayTarget.meterId!==undefined)return null
 const period=r.period,v=p.features.relay!,support=period.supportJob
 if(period.job?.status!=='completed'||period.job.completeAt>p.view.date||!support||!active(support.status))return null
 const meters=v.meters.filter(m=>m.periodId===period.id),sources=new Set([period.id,...meters.map(m=>m.id)])
 const corrections=v.corrections.filter(c=>meters.some(m=>m.id===c.meterId))
 if(meters.some(m=>m.correctionId!==null&&corrections.filter(c=>c.id===m.correctionId&&c.meterId===m.id).length!==1)
  ||corrections.some(c=>c.date>p.view.date||meters.filter(m=>m.id===c.meterId&&m.correctionId===c.id).length!==1))return null
 const invoices:NonNullable<SceneMeaningInput['features']['relay']>['receivables'][number][]=[]
 for(const invoice of v.receivables){
  const linked=corrections.filter(c=>c.operationIds.includes(invoice.operationId)||c.id===invoice.sourceId)
  if(linked.length>1)return null
  const correction=linked[0]
  // Current corrections bill against their original meter (relay.#charge).
  // The public operation relation also keeps a correction source explicit;
  // an inconsistent relation must not silently become a zero balance.
  if(correction&&(!correction.operationIds.includes(invoice.operationId)||![correction.id,correction.meterId].includes(invoice.sourceId)))return null
  if(!sources.has(invoice.sourceId)&&!correction)continue
  if(!period.customerIds.includes(invoice.customerId)||invoice.date>p.view.date)return null
  invoices.push(invoice)
 }
 const future=invoices.filter(i=>i.dueAt>p.view.date).reduce((sum,i)=>sum+i.amountFen-i.collectedFen-i.reversedFen,0)
 const due=invoices.filter(i=>i.dueAt<=p.view.date).reduce((sum,i)=>sum+i.amountFen-i.collectedFen-i.reversedFen,0)
 const collected=invoices.reduce((sum,i)=>sum+i.collectedFen,0)
 const refs=[ref('period',period.id,period.createdAt),ref('job',support.id,support.startAt),...corrections.map(c=>ref('correction',c.id,c.date)),...invoices.map(i=>ref('receivable',i.id,i.date))]
 const supportLine=support.status==='planned'?'原支持'+support.startAt+'才开工':'原支持仍在进行，预计'+support.completeAt+'完成'
 return meaning('服务走完这一段，原支持还在。',supportLine+'；本期原单累计实收'+moneyText(collected)+'，未到期'+moneyText(future)+(due>0?'，到期待收'+moneyText(due):'，当前无到期待收原单')+'。计量仍须按原复核记录核对。',due>0?'先核对到期原款，还是继续原支持、暂不新增安排？':'等原支持或原单到期，还是先把日子留给生活？',refs)
}

/** Public context for reading a decision. It never selects, disables or executes one. */
export function sceneMeaning(p:SceneMeaningInput,thread:PlayerThreadView):SceneMeaning|null{
 const f=thread.focus
 if(p.view.phase!=='playing'||thread.focusStatus==='invalid'||thread.focusScope==='invalid'||f.runId!==p.view.runId||f.accountId!==p.accountId||p.view.accounts.filter(a=>a.accountId===f.accountId).length!==1)return null
 if(f.kind==='course')return courseMeaning(p,thread)
 if(f.kind==='relay')return relayMeaning(p,thread)
 if(f.kind==='first-order'){
  const first=p.features.firstOrder
  const contract=one(p.view.operations?.contracts.filter(c=>c.id===first.contractId&&c.businessId===first.businessId)??[])
  if(f.accountId!=='personal'||!contract||f.entityId!==contract.id||f.businessId!==undefined&&f.businessId!==contract.businessId||first.result.paymentFen<=0||!contract.settledAt||contract.settledAt>p.view.date)return null
  return meaning('第一笔回款，已经留下来了。','这份手工单实际收到'+moneyText(first.result.paymentFen)+'；制作成本'+moneyText(first.result.directCostFen)+'，本单净额'+moneyText(first.result.netOrderFen)+'。','接下来留时间给工作和生活，还是再了解另一种尝试？',[ref('contract',contract.id,contract.settledAt)])
 }
 if(f.kind==='work'){
  const job=one(p.view.operations?.employment.filter(row=>row.id===f.entityId)??[])
  if(f.accountId!=='personal'||f.businessId!==undefined||!job||!job.segments.length||job.segments[0]!.from>p.view.date)return null
  const wages=p.view.operations!.payroll.filter(row=>row.kind==='salary'&&row.entityId===job.id&&row.amountFen>0&&row.through<=p.view.date)
  const refs=[ref('employment',job.id,job.segments[0]!.from),...wages.map(row=>ref('payroll',row.id,row.through))]
  const amount=wages.reduce((sum,row)=>sum+row.amountFen,0)
  if(thread.focusScope==='history')return meaning('这段工作的日子，留在原季度。',job.quarter+'实际工资'+moneyText(amount)+'；回看不续约，也不重记收入。','合上旧页回到今天，再决定新的工作与生活吗？',refs)
  return meaning(wages.length?'工资收到过，日子仍在继续。':'工作已经留下了真实安排。',(wages.length?'本段实际工资'+moneyText(amount)+'；':'')+'原在岗日与共享行动照常，副业和生活仍可组合。','余下的时间，是给自己的安排，还是先继续原来的节奏？',refs)
 }
 if(f.kind==='life'){
  const job=one(p.features.life.jobs.filter(job=>job.id===f.entityId))
  if(f.accountId!=='personal'||f.businessId!==undefined||!job||job.startAt>p.view.date||job.personId!==null&&!p.features.life.people.some(person=>person.id===job.personId&&person.known)||job.personId!==null&&job.personId!==f.selection||job.personId===null&&job.kind!==f.selection)return null
  const refs=[ref('job',job.id,job.status==='completed'?job.completeAt:job.releasedAt??job.startAt)]
  if(job.status==='running')return meaning(thread.focusScope==='carry'?'上季给自己的安排，仍在继续。':'给这段生活留下的时间，还在继续。',job.startAt+'—'+job.completeAt+'的原安排尚未完成；实际投入'+moneyText(job.costFen)+'保留。','先等这次原反馈，还是看看今天还能怎样安排？',refs)
  if(job.status==='completed'&&job.completeAt<=p.view.date)return meaning(thread.focusScope==='history'?'这段生活，留在已经走过的日子。':'这一次，真正给生活留了时间。',job.completeAt+'实际完成，投入'+moneyText(job.costFen)+'；结果不返还行动，也不产生收入。','接下来仍留一点时间给自己，还是回到原来的工作与约定？',refs)
  return null
 }
 return null
}

/** Keep a historical quarter's results separate from responsibilities as of today. */
export function seasonMeaning(p:SceneMeaningInput,season:SeasonRecollectionView):SceneMeaning|null{
 if(p.view.phase!=='playing'||season.asOf!==p.view.date||season.from>season.through||season.through>p.view.date||quarterOf(season.from)!==season.quarter||quarterOf(season.through)!==season.quarter)return null
 const personalEmployment=new Set(p.view.operations?.employment.map(row=>row.id)??[])
 const wages=p.view.operations?.payroll.filter(row=>row.kind==='salary'&&personalEmployment.has(row.entityId)&&row.amountFen>0&&row.through>=season.from&&row.through<=season.through)??[]
 const life=p.features.life.jobs.filter(job=>job.status==='completed'&&job.completeAt>=season.from&&job.completeAt<=season.through)
 const first=p.features.firstOrder,contract=p.view.operations?.contracts.find(c=>c.id===first.contractId)
 const firstPaid=first.result.paymentFen>0&&contract?.settledAt&&contract.settledAt>=season.from&&contract.settledAt<=season.through
 const refs=[...wages.map(row=>ref('payroll',row.id,row.through)),...life.map(job=>ref('job',job.id,job.completeAt)),...(firstPaid?[ref('contract',contract.id,contract.settledAt)]:[])]
 if(!refs.length)return null
 const facts=[...(wages.length?['实际工资'+moneyText(wages.reduce((sum,row)=>sum+row.amountFen,0))]:[]),...(firstPaid?['手工单实际回款'+moneyText(first.result.paymentFen)]:[]),...(life.length?[life.length+'段生活安排实际完成']:[])]
 const history=season.quarter!==p.features.workbench.quarter
 return meaning(history?'这一季的选择，留在过去的日子。':'这季的选择，已经留下了真实结果。',facts.join('；')+'。'+(history?'上面是'+season.quarter+'的结果；':'')+'仍需面对的约定另按今天'+p.view.date+'核对。',season.remaining.length?'先续上仍答应的事，还是暂不新增承诺、给生活留余地？':wages.length?'下一段日子仍保留工作节奏，还是给自己的安排留些余地？':'继续这次尝试，还是把下一段时间留给工作或生活？',refs)
}
