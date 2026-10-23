import type {GamePanelProps,SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import {screenForRoute} from './Navigation.tsx'
import {moneyText,reasonText,wishes} from './game-text.ts'
import {sceneThreads} from './scene-thread-notes.ts'
import {openingFocusAfterSave,playerThread,type OpeningFocus} from './player-thread.ts'
import {videoTargetEntity} from './video-player-thread.ts'
import {courseFocusFor,courseSceneContext} from './course-player-thread.ts'
import {courseTargetReason,type CourseSceneTarget} from './course-scene-progress.ts'

export type SeasonInput=Pick<GamePanelProps,'view'|'features'>
type Inspect={screen:Screen;label:string;target?:SceneTarget}
export interface SeasonSourceRef{readonly kind:string;readonly id:string;readonly date:string|null}
export interface SeasonFocusChoice{
 readonly id:string;readonly title:string;readonly line:string;readonly stage:string
 readonly originQuarter:string|null;readonly date:string|null;readonly nextDate:string|null
 readonly focus:OpeningFocus;readonly scope:'entry'|'current'|'carry'|'history';readonly disabledReason:string|null
}
export interface SeasonEchoNode{readonly id:string;readonly date:string;readonly title:string;readonly line:string;readonly sourceRefs:readonly SeasonSourceRef[];readonly inspect:Inspect}
export interface SeasonPendingItem{readonly id:string;readonly title:string;readonly line:string;readonly dueAt:string|null;readonly accountId:string|null;readonly urgent:boolean;readonly sourceRefs:readonly SeasonSourceRef[];readonly focus:OpeningFocus|null;readonly inspect:Inspect}
export interface SeasonRecollectionView{
 readonly quarter:string;readonly from:string;readonly through:string;readonly asOf:string
 readonly closed:boolean;readonly atQuarterEnd:boolean;readonly closeSourceId:string|null
 readonly nodes:readonly SeasonEchoNode[];readonly allNodes:readonly SeasonEchoNode[];readonly remaining:readonly SeasonPendingItem[]
 readonly nextQuestion:string;readonly nextQuarterDate:string|null
}
const focusId=(f:OpeningFocus)=>[f.kind,f.accountId,f.entityId??('selection' in f?f.selection:'entry')].join('|')

/** Choosing a bookmark is separate from executing any of its original commands. */
export function seasonFocusChoices(p:SeasonInput):readonly SeasonFocusChoice[]{
 const {view,features:f}=p,rows:SeasonFocusChoice[]=[],base={runId:view.runId,accountId:'personal',entityId:null}
 const add=(focus:OpeningFocus,date:string|null=null,title?:string)=>{
  const thread=playerThread(p,focus),id=focusId(thread.focus)
  const prior=rows.findIndex(row=>row.id===id)
  if(prior!==-1){if(rows[prior]!.date===null&&date!==null)rows[prior]={...rows[prior]!,date};return}
  rows.push({id,title:title??thread.title,line:thread.line+' '+thread.detail,stage:thread.stage,originQuarter:thread.focusQuarter,date,nextDate:thread.wait?.date??null,focus:thread.focus,scope:thread.focusScope==='invalid'?'entry':thread.focusScope,disabledReason:thread.invalidReason})
 }
 add({...base,kind:'work'},null,'本季的工作与生活底线')
 add({...base,kind:'life',selection:'rest'},null,'留一段时间给自己')
 add({...base,kind:'life',selection:'workspace'},null,'眼前的住处与原改善记录')
 for(const person of f.life.people.filter(x=>x.known))add({...base,kind:'life',selection:person.id},null,'与'+person.name+'的原安排')
 for(const account of view.accounts)add({...base,kind:'market',accountId:account.accountId},null,(account.accountId==='personal'?'自己的':'原经营账户的')+'投资判断')
 add({...base,kind:'first-order',entityId:f.firstOrder.contractId??f.firstOrder.offerId},f.firstOrder.dates.startAt,'那份手工单与实际结果')
 add({...base,kind:'video',videoTarget:null},null,'从一个真实账号与视频尝试开始')
 add({...base,kind:'course',courseTarget:null},null,'从一份明确的课程准备开始')
 for(const business of f.course?.businesses??[])add(courseFocusFor(p,{kind:'studio',businessId:business.id}),business.history[0]?.date??null,'原课程工作室 · '+business.id.slice(-6))
 for(const outline of f.course?.outlines??[])add(courseFocusFor(p,{kind:'outline',businessId:outline.businessId,outlineId:outline.id}),outline.job?.startAt??null,'这份原教学大纲')
 for(const license of f.course?.licenses??[])add(courseFocusFor(p,{kind:'license',businessId:license.businessId,licenseId:license.id}),license.job?.startAt??null,'这份原课程素材使用范围')
 for(const course of f.course?.courses??[]){
  add(courseFocusFor(p,{kind:'course',businessId:course.businessId,courseId:course.id}),course.createdAt,course.name+' · 原课程方案')
  for(const id of course.sampleAttempts){const job=view.operations?.jobs.find(j=>j.id===id);add(courseFocusFor(p,{kind:'course',businessId:course.businessId,courseId:course.id,sampleJobId:id}),job?.startAt??null,course.name+' · 原样课尝试')}
 }
 for(const audience of f.course?.audiences??[]){const c=f.course!.courses.find(c=>c.id===audience.courseId);if(c)add(courseFocusFor(p,{kind:'audience',businessId:c.businessId,courseId:c.id,audienceId:audience.id}),audience.createdAt,c.name+' · 原受众与报价')}
 for(const co of f.course?.cohorts??[]){const c=f.course!.courses.find(c=>c.id===co.courseId);if(!c)continue;add(courseFocusFor(p,{kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id}),co.createdAt,c.name+' · '+co.startAt+'班');for(const job of [...co.stageJobs.flat(),...co.supportJobs.map(s=>s.job)])if(job)add(courseFocusFor(p,{kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id,jobId:job.id}),job.startAt,c.name+' · 本班原教学或支持安排')}
 for(const channel of f.video?.channels??[])add({...base,kind:'video',accountId:channel.accountId,businessId:channel.businessId,entityId:channel.id,videoTarget:{channelId:channel.id}},channel.createdAt,channel.name+' · 原视频账号')
 for(const work of f.video?.works??[]){const channel=f.video!.channels.find(c=>c.id===work.channelId);if(channel){const t={channelId:channel.id,workId:work.id,...(work.contractId?{contractId:work.contractId}:{})};add({...base,kind:'video',accountId:channel.accountId,businessId:channel.businessId,entityId:videoTargetEntity(t),videoTarget:t},work.production?.startAt??null)}}
 for(const marketing of f.video?.marketing??[]){const channel=f.video!.channels.find(c=>c.id===marketing.channelId);if(channel)add({...base,kind:'video',accountId:channel.accountId,businessId:channel.businessId,entityId:marketing.id,videoTarget:{channelId:channel.id,marketingId:marketing.id}},marketing.job?.startAt??null)}
 for(const period of view.operations?.employment??[])add({...base,kind:'work',entityId:period.id},period.segments[0]?.from??null,period.quarter+' · 原工作安排')
 for(const job of f.life.jobs)add({...base,kind:'life',selection:job.personId??(job.kind==='workspace'?'workspace':'rest'),entityId:job.id},job.startAt)
 for(const promise of f.life.promises)add({...base,kind:'life',selection:promise.personId,entityId:promise.id},promise.offeredAt)
 for(const order of f.market.orders)add({...base,kind:'market',accountId:order.accountId,entityId:order.id,entityKind:'order'},order.submittedAt)
 for(const settlement of f.market.settlements)add({...base,kind:'market',accountId:settlement.accountId,entityId:settlement.id,entityKind:'settlement'},settlement.dueAt)
 for(const position of f.market.positions)add({...base,kind:'market',accountId:position.accountId,entityId:position.id,entityKind:'position'})
 for(const research of f.market.researches)add({...base,kind:'market',entityId:research.id,entityKind:'research'},research.startAt)
 return rows
}
export const focusCandidates=seasonFocusChoices

/** A pinned primary survives temporary responsibilities and explicitly chosen side activities. */
export function seasonFocusAfterSave(previous:SeasonInput,current:SeasonInput,kind:string,payload:unknown,existing:OpeningFocus|null,pinned=true):OpeningFocus|null{
 // An invalid public identity needs an explicit choice; a side action must not repair its pin.
 if(existing!==null&&playerThread(previous,existing).focusStatus==='invalid')return existing
 const candidate=openingFocusAfterSave(previous,current,kind,payload,existing)
 if(!pinned||existing===null||candidate===existing||candidate===null)return candidate
 if(existing.kind==='course'&&candidate.kind==='course'&&existing.runId===candidate.runId&&existing.courseTarget===null&&kind==='OpenCourseStudio')return candidate
 if(existing.runId!==current.view.runId||candidate.kind!==existing.kind||candidate.accountId!==existing.accountId)return existing
 if(existing.kind==='life'&&(candidate.kind!=='life'||existing.selection!==candidate.selection))return existing
 // Refreshing the outcome of the same object is not a new primary selection or quarter.
 if(candidate.entityId===existing.entityId)return existing
 if(existing.kind==='video'&&candidate.kind==='video'){
  const old=existing.videoTarget,next=candidate.videoTarget
  if(old===null)return candidate
  if(next?.channelId!==old.channelId)return existing
  if(!old.workId&&!old.contractId&&!old.marketingId)return candidate
  if(old.marketingId&&kind==='AcceptVideoCommission'&&current.features.video?.marketing.some(m=>m.id===old.marketingId&&m.cohortId===current.features.video!.contracts.find(c=>c.id===next.contractId)?.cohortId))return candidate
  return existing
 }
 if(existing.kind==='course'&&candidate.kind==='course'){
  const old=existing.courseTarget,next=candidate.courseTarget
  if(!old||!next||old.businessId!==next.businessId)return existing
  if(old.kind==='studio'&&['StartCourseOutline','DefineCourse','LicenseCourseMaterials'].includes(kind))return candidate
  if(old.kind==='outline'&&next.kind==='studio'&&kind==='ActivateBusiness')return candidate
  if(old.kind==='outline'&&next.kind==='course'&&kind==='DefineCourse')return candidate
  if(old.kind==='license'&&next.kind==='course'&&kind==='DefineCourse'){
   const license=previous.features.course?.licenses.find(l=>l.id===old.licenseId)
   return current.features.course?.courses.some(c=>c.id===next.courseId&&c.cases.some(ref=>ref.id===license?.caseId))?candidate:existing
  }
  if(old.kind==='course'&&next.kind==='course'&&old.courseId===next.courseId&&kind==='BuildCourseSample')return candidate
  if(old.kind==='course'&&next.kind==='audience'&&old.courseId===next.courseId&&kind==='CreateCourseAudience'&&(old.sampleJobId===undefined||previous.features.course?.courses.some(c=>c.id===old.courseId&&c.sampleJobId===old.sampleJobId&&c.job?.status==='completed')))return candidate
  if(old.kind==='audience'&&next.kind==='cohort'&&old.courseId===next.courseId&&kind==='PlanCourseCohort'&&current.features.course?.cohorts.some(co=>co.id===next.cohortId&&co.audienceId===old.audienceId))return candidate
  if(old.kind==='cohort'&&next.kind==='cohort'&&old.cohortId===next.cohortId&&old.courseId===next.courseId)return existing
  return existing
 }
 const entry=existing.entityId===null||existing.kind==='life'&&existing.entityId===existing.selection
 const firstEntry=existing.kind==='first-order'&&previous.features.firstOrder.contractId===null&&existing.entityId===previous.features.firstOrder.offerId
 if(entry||firstEntry)return candidate
 if(existing.kind==='market'&&kind==='AmendStockOrder'&&current.features.market.orders.some(o=>o.id===candidate.entityId&&o.accountId===existing.accountId&&o.replacesId===existing.entityId))return candidate
 return existing
}

function remainingItems(p:SeasonInput):SeasonPendingItem[]{
 const {view,features:f}=p,w=f.workbench,rows:SeasonPendingItem[]=[],base={runId:view.runId,accountId:'personal',entityId:null}
 const add=(row:SeasonPendingItem)=>{if(!rows.some(x=>x.id===row.id))rows.push(row)}
 const object=(focus:OpeningFocus,dueAt:string|null,ref:SeasonSourceRef)=>{const thread=playerThread(p,focus);add({id:focusId(focus),title:thread.title,line:thread.line+' '+thread.detail,dueAt,accountId:focus.accountId,urgent:dueAt!==null&&dueAt<view.date,sourceRefs:[ref],focus:thread.focus,inspect:thread.inspect})}
 for(const event of w.events.filter(e=>e.isBlocking||e.presentation!=='ordinary'))add({id:'event:'+event.id,title:event.title,line:`${event.createdAt}出现，最迟${event.expiresAt}回应；${event.isBlocking?'时间正等待你的决定。':'原选择与期限仍在。'}`,dueAt:event.expiresAt,accountId:event.accountId,urgent:event.isBlocking||event.expiresAt<=view.date,sourceRefs:[{kind:'event',id:event.id,date:event.createdAt}],focus:null,inspect:{screen:'quarter',label:'翻看这封原来信与可用选择',target:{accountId:event.accountId}}})
 if(w.pause)add({id:'pause:'+w.pause.instanceId,title:'日历停在一件需要面对的事上',line:w.pause.reason==='CONTENT_DECISION_PENDING'?'原来信正等待回应；读过不会自动选择，也不会清除旧责任。':reasonText(w.pause.reason),dueAt:null,accountId:null,urgent:true,sourceRefs:[{kind:'pause',id:w.pause.instanceId,date:null}],focus:null,inspect:{screen:w.pause.reason==='STORY_RISK_DECISION_PENDING'?'story':'quarter',label:'查看暂停原因与原处理入口'}})
 for(const account of w.finance){
  for(const debt of account.obligations)add({id:'obligation:'+debt.id,title:'原账户仍有待付义务',line:`${debt.date}到期，仍未付${moneyText(debt.remainingFen)}；原付款与延期处置分别决定。`,dueAt:debt.date,accountId:account.accountId,urgent:debt.date<=view.date,sourceRefs:[{kind:'obligation',id:debt.id,date:debt.date}],focus:null,inspect:{screen:'finance',label:'核对这份原账与待付义务',target:{accountId:account.accountId}}})
  if(account.protectionShortfallFen>0||account.commitmentShortfallFen>0)add({id:'shortfall:'+account.accountId,title:'当前有真实的承诺资金缺口',line:`保护或承诺不足${moneyText(Math.max(account.protectionShortfallFen,account.commitmentShortfallFen))}，不是已经清偿。`,dueAt:view.date,accountId:account.accountId,urgent:true,sourceRefs:[{kind:'account',id:account.accountId,date:view.date}],focus:null,inspect:{screen:'finance',label:'查看当前资金缺口',target:{accountId:account.accountId}}})
 }
 const first=f.firstOrder
 if(first.contractId&&!['settled','cancelled'].includes(String(first.status)))object({...base,kind:'first-order',entityId:first.contractId},first.dates.submitBy,{kind:'contract',id:first.contractId,date:first.dates.startAt})
 for(const job of f.life.jobs.filter(j=>j.status==='running'&&j.promiseId===null))object({...base,kind:'life',selection:job.personId??(job.kind==='workspace'?'workspace':'rest'),entityId:job.id},job.completeAt,{kind:'job',id:job.id,date:job.startAt})
 for(const promise of f.life.promises.filter(o=>o.status==='accepted'))object({...base,kind:'life',selection:promise.personId,entityId:promise.id},promise.deadline,{kind:'promise',id:promise.id,date:promise.acceptedAt})
 for(const order of f.market.orders.filter(o=>['planned','pending','partially_filled'].includes(o.status))){
  const expiry=f.market.matchingCalendar[order.expiresIndex-(f.market.stocks[0]?.index??-1)-1]?.date??null
  object({...base,kind:'market',accountId:order.accountId,entityId:order.id,entityKind:'order'},expiry,{kind:'order',id:order.id,date:order.submittedAt})
 }
 for(const settlement of f.market.settlements.filter(s=>s.paidAt===null))object({...base,kind:'market',accountId:settlement.accountId,entityId:settlement.id,entityKind:'settlement'},settlement.dueAt,{kind:'settlement',id:settlement.id,date:settlement.dueAt})
 for(const research of f.market.researches.filter(r=>r.status==='running'))object({...base,kind:'market',entityId:research.id,entityKind:'research'},research.completeAt,{kind:'research',id:research.id,date:research.startAt})
 for(const c of f.video?.contracts.filter(c=>c.status!=='cancelled'&&(c.status!=='settled'||!c.paidCase))??[]){const channel=f.video!.channels.find(x=>x.id===c.channelId);if(channel){const focus:OpeningFocus={...base,kind:'video',accountId:channel.accountId,businessId:channel.businessId,entityId:c.id,videoTarget:{channelId:channel.id,workId:c.workId,contractId:c.id}},thread=playerThread(p,focus);add({id:'video-contract:'+c.id,title:thread.title,line:thread.line+' '+thread.detail+` 原报价${moneyText(c.priceFen)}、原预款${moneyText(c.prepaymentFen)}不是利润，原最晚提交${c.dueAt}；当前保护、应收与未付费用以原账为准。`,dueAt:c.status==='delivered'?c.paymentAt:c.dueAt,accountId:channel.accountId,urgent:c.dueAt<view.date,sourceRefs:[{kind:'contract',id:c.id,date:c.acceptedAt}],focus,inspect:thread.inspect})}}
 for(const choice of seasonFocusChoices(p).filter(choice=>choice.focus.kind==='video')){
  const focus=choice.focus;if(focus.kind!=='video'||focus.videoTarget===null)continue
  const t=focus.videoTarget,work=f.video!.works.find(w=>w.id===t.workId),marketing=f.video!.marketing.find(m=>m.id===t.marketingId),contract=f.video!.contracts.find(c=>c.id===t.contractId)
  const jobs=[...(work?[work.production,...work.corrections]:[]),marketing?.job,...(contract?.negotiationJobId?[view.operations?.jobs.find(j=>j.id===contract.negotiationJobId)]:[])]
  for(const job of jobs)if(job&&['planned','running'].includes(job.status)){const thread=playerThread(p,focus);add({id:'operation-job:'+job.id,title:thread.title,line:`${job.startAt}—${job.completeAt}；原资源、成本和行动保留，尚未完成。`,dueAt:job.completeAt,accountId:focus.accountId,urgent:false,sourceRefs:[{kind:'job',id:job.id,date:job.startAt}],focus,inspect:thread.inspect})}
 }
 const courseObjects:{target:CourseSceneTarget;jobId:string}[]=[
  ...(f.course?.outlines??[]).map(o=>({target:{kind:'outline' as const,businessId:o.businessId,outlineId:o.id},jobId:o.jobId})),
  ...(f.course?.licenses??[]).map(l=>({target:{kind:'license' as const,businessId:l.businessId,licenseId:l.id},jobId:l.jobId})),
  ...(f.course?.courses??[]).flatMap(c=>c.sampleAttempts.map(id=>({target:{kind:'course' as const,businessId:c.businessId,courseId:c.id,sampleJobId:id},jobId:id}))),
  ...(f.course?.audiences??[]).flatMap(a=>{const c=f.course!.courses.find(c=>c.id===a.courseId);return a.jobId&&c?[{target:{kind:'audience' as const,businessId:c.businessId,courseId:c.id,audienceId:a.id},jobId:a.jobId}]:[]}),
  ...(f.course?.cohorts??[]).flatMap(co=>{const c=f.course!.courses.find(c=>c.id===co.courseId);return c?[...co.stageJobs.flat(),...co.supportJobs.map(s=>s.job)].flatMap(j=>j?[{target:{kind:'cohort' as const,businessId:c.businessId,courseId:c.id,cohortId:co.id,jobId:j.id},jobId:j.id}]:[]):[]})
 ]
 for(const {target,jobId} of courseObjects){const job=view.operations?.jobs.find(j=>j.id===jobId);if(!job||!['planned','running'].includes(job.status)||courseTargetReason(f.course,target,courseSceneContext(p)))continue;const focus=courseFocusFor(p,target),thread=playerThread(p,focus);add({id:'operation-job:'+job.id,title:thread.title,line:`${job.startAt}—${job.completeAt}；原任务尚未实际完成，已收保护款、教学确认和退款仍按本对象原记录分别核对。`,dueAt:job.completeAt,accountId:focus.accountId,urgent:false,sourceRefs:[{kind:'job',id:job.id,date:job.startAt}],focus,inspect:thread.inspect})}
 for(const update of f.course?.updates.filter(u=>u.resolvedAt===null)??[]){const c=f.course!.courses.find(c=>c.id===update.courseId);if(!c)continue;const focus=courseFocusFor(p,{kind:'course',businessId:c.businessId,courseId:c.id});add({id:'update:'+update.id,title:'原课程的工具前提仍待处理',line:`${c.name}更新期限${update.dueAt}；旧学生与新招生限制继续，未被新的准备对象隐藏。`,dueAt:update.dueAt,accountId:focus.accountId,urgent:update.dueAt<=view.date,sourceRefs:[{kind:'update',id:update.id,date:update.occurredAt}],focus,inspect:{screen:'course',label:'翻看原课程更新与旧承诺',target:{accountId:focus.accountId,courseTarget:focus.courseTarget,recordId:c.id+'-course',openRecord:true}}})}
 for(const co of f.course?.cohorts.filter(co=>co.closedAt===null)??[]){const c=f.course!.courses.find(c=>c.id===co.courseId);if(!c)continue;const focus=courseFocusFor(p,{kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id});add({id:'cohort:'+co.id,title:co.startAt+'开班的原课程仍有责任',line:`${c.name}教学至${co.endAt}、支持至${co.supportCompleteAt}、退款窗口至${co.refundUntil}；新准备不会清除这期原学员与责任。`,dueAt:co.refundUntil,accountId:focus.accountId,urgent:false,sourceRefs:[{kind:'cohort',id:co.id,date:co.createdAt}],focus,inspect:{screen:'course',label:'翻看这期原学生、支持与退款',target:{accountId:focus.accountId,courseTarget:focus.courseTarget,recordId:co.id,openRecord:true}}})}
 for(const job of w.preparationJobs.filter(j=>j.status==='running'))add({id:'preparation:'+job.id,title:job.title,line:`原准备从${job.startAt}至${job.completeAt}，仍未完成；下一步沿原日历与准备记录。`,dueAt:job.completeAt,accountId:job.accountId,urgent:false,sourceRefs:[{kind:'preparation',id:job.id,date:job.startAt}],focus:null,inspect:{screen:'quarter',label:'翻看这项原准备',target:{accountId:job.accountId}}})
 for(const job of view.operations?.jobs.filter(j=>j.id!==first.jobId&&['planned','running'].includes(j.status))??[]){
  const business=view.operations?.businesses.find(b=>b.id===job.businessId)
  add({id:'operation-job:'+job.id,title:'原经营工作仍在继续',line:`${job.startAt}—${job.completeAt}；安排还没有成为完成结果。`,dueAt:job.completeAt,accountId:business?.accountId??null,urgent:false,sourceRefs:[{kind:'job',id:job.id,date:job.startAt}],focus:null,inspect:{screen:business?screenForRoute(business.route):'quarter',label:'翻看这项工作的原记录',...(business?{target:{accountId:business.accountId}}:{})}})
 }
 // Original specialized business responsibilities stay reachable without pretending S2 has their new UI.
 for(const item of sceneThreads(f,view.date).filter(t=>t.screen!=='life')){
  const id=item.id.slice(item.id.indexOf(':')+1)
  add({id:item.id,title:item.title,line:item.detail+' 请翻阅对应业务的全部原记录。',dueAt:null,accountId:null,urgent:item.screen==='story',sourceRefs:[{kind:'record',id,date:null}],focus:null,inspect:{screen:item.screen,label:'翻看这项责任的全部原记录',...(item.personId?{target:{personId:item.personId}}:{})}})
 }
 return rows
}

/** Recollection is an explanation of public dated records, never a stored score or a balance-delta guess. */
export function seasonRecollection(p:SeasonInput,quarter=p.features.workbench.quarter):SeasonRecollectionView|null{
 const {view,features:f}=p,w=f.workbench
 if(!/^202[0-5]-Q[1-4]$/.test(quarter)||quarter>w.quarter)return null
 const chapter=f.journey?.chapters.find(c=>c.id===quarter);if(!chapter)return null
 const from=chapter.from,end=chapter.through,through=view.date<end?view.date:end
 const closed=chapter.closedAt!==null&&chapter.closeSourceId!==null&&chapter.closedAt<=view.date&&(quarter<w.quarter||w.atQuarterEnd)
 const inPeriod=(date:string|null)=>date!==null&&date>=from&&date<=through
 const allNodes:SeasonEchoNode[]=[]
 const add=(node:SeasonEchoNode)=>{if(inPeriod(node.date)&&!allNodes.some(x=>x.id===node.id))allNodes.push(node)}
 for(const payroll of view.operations?.payroll??[])if(payroll.kind==='salary'&&payroll.amountFen>0)add({id:payroll.id,date:payroll.through,title:'按实际在岗日，工资已经收到',line:`本次实际工资${moneyText(payroll.amountFen)}；它与经营利润、持仓浮盈分别记录。`,sourceRefs:[{kind:'payroll',id:payroll.id,date:payroll.through},...(payroll.operationId?[{kind:'operation',id:payroll.operationId,date:payroll.through}]:[])],inspect:{screen:'quarter',label:'翻看这段原工作与工资记录',target:{accountId:'personal',recordId:payroll.entityId}}})
 const first=f.firstOrder
 if(first.contractId)for(const tx of w.finance.find(a=>a.accountId==='personal')?.transactions??[])if(tx.amountFen>0&&(tx.contractId===first.contractId||tx.sourceId===first.contractId))add({id:tx.id,date:tx.date,title:'手工单的客户款实际到账',line:`本次实收${moneyText(tx.amountFen)}；原制作成本${moneyText(first.result.directCostFen)}、本单净额${moneyText(first.result.netOrderFen)}。工资与其他收支没有算入本单。`,sourceRefs:[{kind:'payment',id:tx.id,date:tx.date},{kind:'contract',id:first.contractId,date:tx.date}],inspect:{screen:'quarter',label:'翻看这份原手工单',target:{accountId:'personal',recordId:first.contractId}}})
 for(const job of f.life.jobs){
  if(job.status==='completed'&&!f.life.promises.some(o=>o.status==='fulfilled'&&o.completionJobId===job.id))add({id:'life-result:'+job.id,date:job.completeAt,title:'一段留给生活的时间已经完成',line:`原安排${job.startAt}—${job.completeAt}；原费用${moneyText(job.costFen)}、${job.actionPoints}点已经按原开工日承担，完成不返还行动或增加收入。`,sourceRefs:[{kind:'job',id:job.id,date:job.completeAt},{kind:'command',id:job.originCommandId,date:job.startAt}],inspect:{screen:'life',label:'翻看这次原生活工作',target:{accountId:'personal',recordId:job.id,...(job.personId?{personId:job.personId,lifeSelection:'person' as const}:{lifeSelection:job.kind==='workspace'?'workspace' as const:'rest' as const})}}})
  if(job.status==='interrupted'&&job.releasedAt)add({id:'life-stop:'+job.id,date:job.releasedAt,title:'这次生活安排在半路停下',line:`已用${job.actionPoints}点与实际费用${moneyText(job.costFen)}保留，没有记作完成。`,sourceRefs:[{kind:'job',id:job.id,date:job.releasedAt}],inspect:{screen:'life',label:'翻看中断的原工作',target:{accountId:'personal',recordId:job.id,...(job.personId?{personId:job.personId,lifeSelection:'person' as const}:{lifeSelection:job.kind==='workspace'?'workspace' as const:'rest' as const})}}})
 }
 for(const promise of f.life.promises)if(promise.resolvedAt&&['fulfilled','missed','npc_declined'].includes(promise.status))add({id:'promise-result:'+promise.id,date:promise.resolvedAt,title:promise.status==='fulfilled'?'答应的事，已经实际兑现':promise.status==='missed'?'原约定没有按期兑现':'对方也有自己的安排',line:promise.status==='fulfilled'?'兑现来自原实际工作；接受邀请和实际完成各有自己的日期。':promise.status==='missed'?'原失约与已发生成本保留，不因回顾清除。':'对方撤回尚未接受的邀请，不记玩家失约，也没有自动新增费用。',sourceRefs:[{kind:'promise',id:promise.id,date:promise.resolvedAt},...(promise.resolutionSourceId?[{kind:'source',id:promise.resolutionSourceId,date:promise.resolvedAt}]:[])],inspect:{screen:'life',label:'翻看这项原约定',target:{accountId:'personal',personId:promise.personId,lifeSelection:'person',recordId:promise.id}}})
 for(const fill of f.market.fills){
  const order=f.market.orders.find(o=>o.id===fill.orderId);if(!order)continue
  add({id:fill.id,date:fill.date,title:order.side==='buy'?'一份模拟买入实际成交':'一份模拟卖出实际成交',line:`实际成交${fill.quantity}股，成交额${moneyText(fill.grossFen)}、费用${moneyText(fill.feeFen)}。成交、可售股份、交收和现金分别核对，持仓浮盈不是到账。`,sourceRefs:[{kind:'fill',id:fill.id,date:fill.date},{kind:'order',id:order.id,date:order.submittedAt}],inspect:{screen:'market',label:'翻看这份原委托与成交',target:{accountId:order.accountId,recordId:order.id}}})
 }
 for(const settlement of f.market.settlements)if(settlement.paidAt)add({id:settlement.id,date:settlement.paidAt,title:settlement.kind==='sale'?'模拟卖款已实际交收':'模拟分红已实际到账',line:`${moneyText(settlement.amountFen)}已进入原账户；它不是新的免费本金或额外行动。`,sourceRefs:[{kind:'settlement',id:settlement.id,date:settlement.paidAt}],inspect:{screen:'market',label:'翻看这笔原交收',target:{accountId:settlement.accountId,recordId:settlement.id}}})
 for(const research of f.market.researches)if(research.status==='completed')add({id:'research-result:'+research.id,date:research.completeAt,title:'公开研究已实际完成',line:'整理完成的是原公开资料；没有替你买股，也没有揭示未来价格。',sourceRefs:[{kind:'research',id:research.id,date:research.completeAt}],inspect:{screen:'market',label:'翻看这项原研究',target:{accountId:'personal',recordId:research.id}}})
 for(const o of f.course?.outlines??[])if(o.job?.status==='completed'){const focus=courseFocusFor(p,{kind:'outline',businessId:o.businessId,outlineId:o.id});add({id:'course-outline:'+o.id,date:o.job.completeAt,title:'这份原教学大纲已实际完成',line:'完成的是原大纲与准备；启用、样课和招生仍各自决定，没有教学收入。',sourceRefs:[{kind:'outline',id:o.id,date:o.job.completeAt},{kind:'job',id:o.job.id,date:o.job.completeAt}],inspect:{screen:'course',label:'翻看原大纲与投入',target:{accountId:focus.accountId,courseTarget:focus.courseTarget,openRecord:true}}})}
 for(const l of f.course?.licenses??[])if(l.job?.status==='completed'){const focus=courseFocusFor(p,{kind:'license',businessId:l.businessId,licenseId:l.id});add({id:'course-license:'+l.id,date:l.job.completeAt,title:'原案例的课程使用范围已实际准备',line:'本工作室的课程素材任务实际完成；没有继承成另一主体权利、完成样课或招收学生。',sourceRefs:[{kind:'license',id:l.id,date:l.job.completeAt},{kind:'job',id:l.job.id,date:l.job.completeAt}],inspect:{screen:'course',label:'翻看这份原课程使用范围',target:{accountId:focus.accountId,courseTarget:focus.courseTarget,openRecord:true}}})}
 for(const c of f.course?.courses??[]){const general=courseFocusFor(p,{kind:'course',businessId:c.businessId,courseId:c.id});add({id:'course-defined:'+c.id,date:c.createdAt,title:'这门原课程方案已经留下',line:c.name+'已有明确案例、形式与主题；方案没有代替实际样课或新增招生。',sourceRefs:[{kind:'course',id:c.id,date:c.createdAt}],inspect:{screen:'course',label:'翻看这门原课程方案',target:{accountId:general.accountId,courseTarget:general.courseTarget,openRecord:true}}});for(const id of c.sampleAttempts){const j=view.operations?.jobs.find(j=>j.id===id&&j.businessId===c.businessId);if(!j||!['completed','interrupted','cancelled'].includes(j.status))continue;const date=j.status==='completed'?j.completeAt:j.releasedAt;if(!date)continue;const target:CourseSceneTarget={kind:'course',businessId:c.businessId,courseId:c.id,sampleJobId:id};add({id:'course-sample:'+id,date,title:j.status==='completed'?'这份原样课已实际完成':'这份原样课安排已经停下',line:c.name+'的原样课任务按实际状态留存；成本、行动、权利与工具资格分别核对，未增加学费或教学收入。',sourceRefs:[{kind:'sample',id,date},{kind:'course',id:c.id,date}],inspect:{screen:'course',label:'翻看这份原样课尝试',target:{accountId:general.accountId,courseTarget:target,openRecord:true}}})}}
 for(const a of f.course?.audiences??[]){if(!a.completedAt)continue;const c=f.course!.courses.find(c=>c.id===a.courseId);if(!c)continue;const focus=courseFocusFor(p,{kind:'audience',businessId:c.businessId,courseId:c.id,audienceId:a.id});add({id:'course-audience:'+a.id,date:a.completedAt,title:'这份原课程受众已留下实际反馈',line:`${c.name}原报价${moneyText(a.priceFen)}；实际覆盖${a.members.length}人、基础意向${a.eligibleMembers.length}人，尚未因此报名或确认收入。`,sourceRefs:[{kind:'audience',id:a.id,date:a.completedAt}],inspect:{screen:'course',label:'翻看原受众报价与实际反馈',target:{accountId:focus.accountId,courseTarget:focus.courseTarget,openRecord:true}}})}
 for(const co of f.course?.cohorts??[]){
  const c=f.course!.courses.find(c=>c.id===co.courseId);if(!c)continue
  const focus=courseFocusFor(p,{kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id}),inspect:Inspect={screen:'course',label:'翻看这期原班级、学员与原账',target:{accountId:focus.accountId,courseTarget:focus.courseTarget,openRecord:true}},source={kind:'cohort',id:co.id,date:co.createdAt}
  add({id:'course-plan:'+co.id,date:co.createdAt,title:'这期班额与原支持已经约定',line:`${c.name} · ${co.startAt}班，原单价${moneyText(co.priceFen)}、上限${co.seatLimit}名；未来支持资金、行动和资源已预留，还不是报名或收入。`,sourceRefs:[source],inspect})
  const batches=new Set(co.students.map(s=>s.paymentBatchId))
  for(const batchId of batches){const people=co.students.filter(s=>s.paymentBatchId===batchId),date=people[0]!.paidAt;add({id:'course-enroll:'+batchId,date,title:'本班实际收受了学费预款',line:`${people.length}名原学员，原预款${moneyText(people.reduce((n,s)=>n+s.priceFen,0))}；当次全额保护，不是确认收入。后续教学与退款分别保留。`,sourceRefs:people.map(s=>({kind:'enrollment',id:s.id,date:s.paidAt})),inspect})}
  for(const stage of co.stages)if(stage.deliveredAt)add({id:'course-stage:'+co.id+':'+stage.index,date:stage.deliveredAt,title:'本班第'+(stage.index+1)+'阶段已实际交付',line:`原阶段确认${moneyText(stage.amountFen)}并释放对应保护；没有再收一遍学费，后续原退款仍可冲减收入。`,sourceRefs:[{kind:'cohort',id:co.id,date:stage.deliveredAt},...(stage.operationId?[{kind:'operation',id:stage.operationId,date:stage.deliveredAt}]:[])],inspect})
  for(const slot of co.supportJobs){const job=slot.job;if(!job||!['completed','interrupted','cancelled'].includes(job.status))continue;const date=job.status==='completed'?job.completeAt:job.releasedAt;if(!date)continue;add({id:'course-support:'+job.id,date,title:(slot.recovery?'这次补支持':'本班原支持')+(job.status==='completed'?'已实际完成':'已停下，原责任仍在'),line:'原支持任务按实际状态留存；学员公开反馈、退款与费用另核，不因任务结束保证每个人得到帮助。',sourceRefs:[{kind:'job',id:job.id,date}],inspect:{...inspect,target:{accountId:focus.accountId,courseTarget:{kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id,jobId:job.id},openRecord:true}}})}
  if(co.assessmentAt)add({id:'course-feedback:'+co.id,date:co.assessmentAt,title:'本班留下实际学习反馈',line:`原反馈已公开；当前仍需帮助${co.students.filter(s=>s.outcome==='needs_recovery'&&s.paidRemainingFen>0).length}人。补支持和退款以实际后续记录为准，不预报隐藏结果。`,sourceRefs:[{kind:'cohort',id:co.id,date:co.assessmentAt}],inspect})
  for(const refund of f.course!.refunds.filter(r=>r.cohortId===co.id))add({id:'course-refund:'+refund.id,date:refund.date,title:'本班原退款处理已经登记',line:`未交付退回${moneyText(refund.undeliveredFen)}、已交付冲减${moneyText(refund.deliveredFen)}；退款记录不等于现金已付清，仍须核对原应付。`,sourceRefs:[{kind:'refund',id:refund.id,date:refund.date},...refund.operationIds.map(id=>({kind:'operation',id,date:refund.date}))],inspect})
  if(co.feePostedAt)add({id:'course-fee:'+co.id,date:co.feePostedAt,title:'本班原结算费已登记',line:`原结算费${moneyText(co.feeFen)}按留存确认收入5%登记；费用入账不是付款，也不是整班已经结清。`,sourceRefs:[{kind:'cohort',id:co.id,date:co.feePostedAt}],inspect})
  if(co.closedAt)add({id:'course-close:'+co.id,date:co.closedAt,title:'这期原班级已实际收尾',line:`${c.name}的学习与退款事实、原成本和购买身份仍在；收尾不产生新回款或再次收费资格。`,sourceRefs:[{kind:'cohort',id:co.id,date:co.closedAt}],inspect})
 }
 for(const work of f.video?.works??[]){const channel=f.video!.channels.find(c=>c.id===work.channelId);if(!channel)continue;const t={channelId:channel.id,workId:work.id,...(work.contractId?{contractId:work.contractId}:{})};for(const job of [work.production,...work.corrections])if(job?.status==='completed')add({id:'video-job:'+job.id,date:job.completeAt,title:'这份视频的原制作实际完成',line:'实际完成的是原制作或返工；人工核对、客户验收与回款仍分别发生。',sourceRefs:[{kind:'job',id:job.id,date:job.completeAt},{kind:'work',id:work.id,date:job.completeAt}],inspect:{screen:'video',label:'翻看原作品与制作资源',target:{accountId:channel.accountId,videoTarget:t}}})}
 for(const m of f.video?.marketing??[]){const channel=f.video!.channels.find(c=>c.id===m.channelId);if(m.completedAt&&channel)add({id:'video-marketing:'+m.id,date:m.completedAt,title:'这份原视频推广已实际结束',line:'结束的是原推广任务；实际询价仍须核对、显选，不记作客户成交或收入。',sourceRefs:[{kind:'marketing',id:m.id,date:m.completedAt},{kind:'job',id:m.jobId,date:m.completedAt}],inspect:{screen:'video',label:'翻看这份原推广与询价',target:{accountId:channel.accountId,videoTarget:{channelId:channel.id,marketingId:m.id}}}})}
 for(const c of f.video?.contracts??[]){const channel=f.video!.channels.find(x=>x.id===c.channelId);if(!channel)continue;const target={accountId:channel.accountId,videoTarget:{channelId:channel.id,workId:c.workId,contractId:c.id}}
  if(c.reviewedAt)add({id:'video-review:'+c.id+':'+c.reviewedAt,date:c.reviewedAt,title:'原视频商单留下客户复核记录',line:'复核日期来自原合同；提交、认可、应收和实际回款没有合并。',sourceRefs:[{kind:'contract',id:c.id,date:c.reviewedAt}],inspect:{screen:'video',label:'翻看原客户反馈与条款',target}})
  if(c.settledAt){const payments=w.finance.find(a=>a.accountId===channel.accountId)?.transactions.filter(tx=>tx.date===c.settledAt&&tx.amountFen>0&&(tx.contractId===c.id||tx.sourceId===c.id))??[];add({id:'video-paid:'+c.id,date:c.settledAt,title:'这份视频商单已登记实际结算',line:payments.length?`本次原收款流水合计${moneyText(payments.reduce((n,tx)=>n+tx.amountFen,0))}；原预款、制作成本及费用另列。${c.paidCase?'':'原账仍有未付责任。'}`:'原合同已记录结算；实际预款、余款及费用逐项以原账核对，不按余额差补收入。',sourceRefs:[{kind:'contract',id:c.id,date:c.settledAt},...payments.map(tx=>({kind:'payment',id:tx.id,date:tx.date}))],inspect:{screen:'video',label:'翻看这份原单的结算与费用',target}})}
 }
 allNodes.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id))
 const nodes:SeasonEchoNode[]=[],kinds=new Set<string>()
 for(const node of allNodes){const kind=node.sourceRefs[0]?.kind??node.id;if(!kinds.has(kind)){nodes.push(node);kinds.add(kind)}if(nodes.length===3)break}
 for(const node of allNodes){if(nodes.length===3)break;if(!nodes.includes(node))nodes.push(node)}
 const remaining=remainingItems(p),wish=wishes[view.playerProfile.wishId]
 const nextQuarterDate=quarter===w.quarter&&w.atQuarterEnd?w.progression.nextQuarterDate:null
 const nextQuestion=quarter==='2025-Q4'?`六年之后，怎样守住“${wish}”？有限尾声只处理原来的事，不再开启新的季度或补充行动。`:`${nextQuarterDate?'下一季':'接下来'}，怎样让日子更接近“${wish}”？${remaining.length?'原来的约定仍在，可以先收好它们，再决定新的投入。':'可以继续熟悉的节奏，也可以重新选择把时间留给哪里。'}`
 return {quarter,from,through,asOf:view.date,closed,atQuarterEnd:quarter===w.quarter&&w.atQuarterEnd,closeSourceId:closed?chapter.closeSourceId:null,nodes,allNodes,remaining,nextQuestion,nextQuarterDate}
}
