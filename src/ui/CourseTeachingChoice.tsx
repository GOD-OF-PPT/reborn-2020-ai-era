import {defaultWaitDate,defaultWaitLabel} from './default-wait-window.ts'
import {useEffect,useId,useRef,useState,type Dispatch,type SetStateAction,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {courseSceneProgress,courseTargetReason,courseStageLatestStart,type CourseSceneTarget} from './course-scene-progress.ts'
import {useCourseTeachingDraft,type CourseTeachingDraft,type CourseTeachingDraftSlot,type CourseTeachingDraftScope} from './course-teaching-draft.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {useCommandPreview} from './use-controller-read.ts'
import {ClockAdvance} from './ClockAdvance.tsx'
import {courseStageWaitDate} from './course-stage-wait.ts'
import {courseWaitDate} from './course-wait-date.ts'
import {courseCohortFinancials} from './CourseTeachingDetails.tsx'
import {COURSE_JOBS} from '../content/course.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {sumMoney} from '../core/money.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {parseMoneyInput} from './money-input.ts'
import {moneyText,playableThrough,reasonText} from './game-text.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {agentSupportMode,supportModeText} from './AgentSupportChoice.tsx'
import './course-teaching.css'
import './course-audience-choice.css'

export type CourseTeachingIntent=CourseTeachingDraftSlot|'record'|'next'|'targets'
export type CourseTeachingCommand={kind:string;payload:Record<string,unknown>;label:string;confirm:boolean}
type Props={p:GamePanelProps;target:CourseSceneTarget|null;onTarget?:(target:CourseSceneTarget|null)=>void;onInspect?:(target:CourseSceneTarget|null,slot?:CourseTeachingDraftSlot)=>void;onToday?:()=>void;onLife?:()=>void;blockedReason?:string|null;children?:(open:(intent?:CourseTeachingIntent)=>void)=>ReactNode}
type Page=CourseTeachingIntent|'targets'|'audience-quote'|'audience-sources'|'audience-schedule'|'plan-support'|'enroll-people'|'stop'|'more'|'details'
const supportModes=['self_small','guided_group','assisted_group','delegated_group'] as const
const uniqueIds=(ids:readonly string[],min=1,max=240)=>ids.length>=min&&ids.length<=max&&ids.every(id=>id.length>0)&&new Set(ids).size===ids.length
type EnrollmentSource={seatLimit:number;students:readonly {paidRemainingFen:number}[];availablePeople:readonly string[]}
/** An explicit batch only fills the draft. Invalid old selections are never filtered or truncated. */
export function courseEnrollmentBatch(cohort:EnrollmentSource,selectedIds:readonly string[]){
 const active=cohort.students.filter(student=>student.paidRemainingFen>0).length
 const remainingSeats=Math.max(0,cohort.seatLimit-active)
 const issue=!Number.isSafeInteger(cohort.seatLimit)||cohort.seatLimit<1||cohort.seatLimit>240||!uniqueIds(cohort.availablePeople,0,Number.MAX_SAFE_INTEGER)?'本班名额或原意向暂不可核，请翻原记录。'
  :new Set(selectedIds).size!==selectedIds.length?'本稿里有重复选择，请明确核对；没有替你去重。'
  :selectedIds.some(id=>!cohort.availablePeople.includes(id))?'本稿有人已不属于当前可报名意向，请明确重选；没有替你换人。'
  :selectedIds.length>remainingSeats?'本稿已选'+selectedIds.length+'人，超过班额余'+remainingSeats+'席，请明确减少。':null
 const added:string[]=[]
 if(issue===null)for(const id of cohort.availablePeople){if(added.length>=remainingSeats-selectedIds.length)break;if(!selectedIds.includes(id))added.push(id)}
 return {remainingSeats,active,addCount:added.length,issue,personIds:issue===null?[...selectedIds,...added]:null}
}
const validDate=(value:string,current:string,through=playableThrough)=>{try{isoDate(value);return value>=current&&value<=through}catch{return false}}
const context=(p:GamePanelProps)=>({operations:p.view.operations,preparationReady:p.features.workbench.routes.find(r=>r.id==='ai_course')?.requirements.preparationReady===true})
function selected(p:GamePanelProps,target:CourseSceneTarget|null){
 const v=p.features.course
 if(!v||!target||!['course','audience','cohort'].includes(target.kind)||courseTargetReason(v,target,context(p)))return null
 const id='courseId' in target?target.courseId:null,lesson=v.courses.find(c=>c.id===id&&c.businessId===target.businessId),business=v.businesses.find(b=>b.id===target.businessId)
 if(!lesson||!business)return null
 const cohort=target.kind==='cohort'?v.cohorts.find(c=>c.id===target.cohortId&&c.courseId===lesson.id):undefined
 const audience=target.kind==='audience'?v.audiences.find(a=>a.id===target.audienceId&&a.courseId===lesson.id):cohort?v.audiences.find(a=>a.id===cohort.audienceId&&a.courseId===lesson.id):undefined
 return {v,lesson,business,cohort,audience}
}
export function courseTeachingContextReason(p:Pick<GamePanelProps,'view'|'features'|'accountId'>,target:CourseSceneTarget|null):string|null{
 if(!p.view.accounts.some(a=>a.accountId===p.accountId))return '当前账户已不可用，请先明确选回这门课与账户。'
 if(!target)return '先明确选择一门课程、受众或班期；没有替你选择第一班。'
 const reason=courseTargetReason(p.features.course,target,{operations:p.view.operations});if(reason)return reason
 const b=p.features.course?.businesses.find(b=>b.id===target.businessId)
 return b?.accountId!==p.accountId?'这份教学承诺与当前账户不一致，请明确选回原对象。':null
}
export function courseTeachingBookmarkLock(p:GamePanelProps,blockedReason?:string|null):string|null{
 if(blockedReason)return blockedReason
 const live=p.controller.snapshot.view
 if(live&&(live.runId!==p.view.runId||live.revision!==p.view.revision))return '记录已经更新，请重新核对这份班期草稿。'
 if(p.view.busy||p.controller.snapshot.busy)return '正在保存这一步，请稍候。'
 if(p.view.hasCandidate||live?.hasCandidate||p.view.saveStatus==='conflict'||live?.saveStatus==='conflict'||p.view.saveStatus==='unsaved'||live?.saveStatus==='unsaved')return '原候选或冲突尚未处理；这份草稿与原班期仍保留。'
 return null
}
export function courseTeachingSubmissionLock(p:GamePanelProps,blockedReason?:string|null):string|null{
 const locked=courseTeachingBookmarkLock(p,blockedReason);if(locked)return locked
 if(p.view.readOnly||p.controller.snapshot.view?.readOnly)return '当前仅可翻阅，不能提交教学、收款或退款决定。'
 if(p.features.workbench.pause!==null||p.features.workbench.progression.requiresDelivery)return '先面对日历里的原责任，再回这份教学承诺。'
 return null
}
export function courseTeachingReasonText(code:string):string{
 if(code==='INSUFFICIENT_ACTION_POINTS')return '所选开工季度的行动不足；可保留草稿或核对其他真实日期，推进沿途费用仍发生。'
 if(code==='WORLD_RELEASE_NOT_OCCURRED'||code==='CAPABILITY_NOT_YET_AVAILABLE')return '这项工具在当前年代尚未开放。'
 if(code.startsWith('MISSING_ENTITLEMENT:'))return '需要对应的实际访问资格；申请与阅读获准仍要独立完成。'
 const line=reasonText(code);return line.startsWith('操作未完成')?'仍有原条件未满足，请翻完整记录核对。':line
}
/** Compose explicit public choices only. Original parser/preview/confirmation retain every eligibility rule. */
export function courseTeachingDraftCommand(p:GamePanelProps,draft:CourseTeachingDraft,intent:CourseTeachingIntent,target:CourseSceneTarget|null):CourseTeachingCommand|null{
 const s=selected(p,target);if(!s||courseTeachingContextReason(p,target))return null
 const {v,lesson,business,cohort,audience}=s
 const command=(kind:string,payload:Record<string,unknown>,label:string):CourseTeachingCommand=>({kind,payload,label,confirm:true})
 if(intent==='capital'){
  const amount=parseMoneyInput(draft.capital)
  return amount!==null&&business.company?command('FundBusiness',{businessId:business.id,amountFen:amount},'核对个人给这门课追加的自有资金'):null
 }
 if(intent!=='refresh'&&(target?.kind==='cohort'&&target.jobId!==undefined||target?.kind==='course'&&target.sampleJobId!==undefined&&target.sampleJobId!==lesson.sampleJobId))return null
 const resources=(max=1)=>uniqueIds(draft.resources,1,max)&&draft.resources.every(id=>v.resources.some(r=>r.id===id))
 const assignment=()=>validDate(draft.startAt,p.view.date,p.view.phase==='epilogue'?p.view.date:playableThrough)&&resources()?{resources:[...draft.resources],startAt:draft.startAt}:null
 const deployment=()=>{
  if(!supportModes.some(mode=>mode===draft.supportMode))return false
  if(!agentSupportMode(draft.supportMode))return draft.deploymentId===null
  const d=p.features.story.deployments.find(d=>d.id===draft.deploymentId&&d.businessId===business.id&&d.lifecycle==='active'&&d.currentGrant?.scopes.includes('course_support'))
  return !!d&&(draft.supportMode!=='delegated_group'||d.currentGrant?.level==='cross_flow')
 }
 if(intent==='audience'){
  if(target?.kind!=='course')return null
  const price=parseMoneyInput(draft.price),product=v.catalog.products.find(c=>c.id===lesson.productId)
  if(price===null||!product||price<product.minPriceFen||price>product.maxPriceFen)return null
  if(draft.audienceMode==='video_referral')return uniqueIds(draft.sourceIds,1,96)&&draft.sourceIds.every(id=>v.videoCohorts.some(co=>co.id===id&&co.segment===lesson.segment&&co.date<=p.view.date))?command('CreateCourseAudience',{courseId:lesson.id,mode:'video_referral',priceFen:price,videoCohortIds:[...draft.sourceIds]},'核对已有受众对这门课的实际意向'):null
  const a=assignment();return draft.audienceMode==='paid'&&a?command('CreateCourseAudience',{courseId:lesson.id,mode:'paid',priceFen:price,...a},'核对这门课的报价与付费推广安排'):null
 }
 if(intent==='plan'){
  if(target?.kind!=='audience'||!audience||audience.completedAt===null||!resources(3)||!deployment()||!validDate(draft.startAt,p.view.date)||draft.startAt<=p.view.date||!validDate(draft.endAt,p.view.date)||!validDate(draft.supportStartAt,p.view.date)||!/^\d+$/.test(draft.seatLimit))return null
  const count=Number(draft.seatLimit)
  if(!Number.isSafeInteger(count)||count<1||count>240||!['clear_scope','accelerated_results'].includes(draft.promise))return null
  return command('PlanCourseCohort',{courseId:lesson.id,audienceId:audience.id,startAt:draft.startAt,endAt:draft.endAt,supportStartAt:draft.supportStartAt,seatLimit:count,supportMode:draft.supportMode,deploymentId:draft.deploymentId,resources:[...draft.resources],promise:draft.promise},'核对本班承诺与真实支持预留')
 }
 if(intent==='refresh'){
  const a=assignment();return a?command('StartCourseRefresh',{courseId:lesson.id,...a},'核对这门课的原学生更新安排'):null
 }
 if(target?.kind!=='cohort'||!cohort)return null
 if(intent==='enroll')return uniqueIds(draft.personIds)&&draft.personIds.every(id=>cohort.availablePeople.includes(id))?command('EnrollCourseAudience',{cohortId:cohort.id,personIds:[...draft.personIds]},'核对这批学员的受保护预款'):null
 if(intent==='refund')return uniqueIds(draft.personIds)&&draft.personIds.every(id=>cohort.students.filter(s=>s.personId===id&&s.paidRemainingFen>0).length===1)&&draft.reason.trim().length>0&&draft.reason.trim().length<=200?command('RefundCourseLearners',{cohortId:cohort.id,personIds:[...draft.personIds],reason:draft.reason.trim()},'核对所选学员的原阶段退款'):null
 const a=assignment();if(!a)return null
 if(intent==='stage:0'||intent==='stage:1')return command('StartCourseStage',{cohortId:cohort.id,index:intent==='stage:0'?0:1,...a},'核对第'+(intent==='stage:0'?1:2)+'段实际教学安排')
 if(intent==='recovery'&&deployment())return command('StartCourseRecovery',{cohortId:cohort.id,supportMode:draft.supportMode,deploymentId:draft.deploymentId,...a},'核对这次补支持与整改期限')
 return null
}
function scopeFor(p:GamePanelProps,target:CourseSceneTarget|null,slot:CourseTeachingDraftSlot):CourseTeachingDraftScope{
 const s=selected(p,target),co=s?.cohort
 return {accountId:p.accountId,businessId:s?.business.id??target?.businessId??'',courseId:s?.lesson.id??'',audienceId:slot==='plan'?s?.audience?.id??null:['enroll','stage:0','stage:1','recovery','refund'].includes(slot)?co?.audienceId??null:null,cohortId:['enroll','stage:0','stage:1','recovery','refund'].includes(slot)?co?.id??null:null,slot}
}
function courseTeachingJob(s:NonNullable<ReturnType<typeof selected>>,slot:CourseTeachingDraftSlot,draft:CourseTeachingDraft){
 const {lesson}=s,id=slot==='audience'?'course-marketing':slot==='stage:0'||slot==='stage:1'?`course-stage-${lesson.productId}-${lesson.topicId}`:slot==='plan'||slot==='recovery'?`course-support-${lesson.productId}-${draft.supportMode}`:slot==='refresh'?`course-refresh-${lesson.productId}-${lesson.topicId}`:''
 return COURSE_JOBS.find(j=>j.id===id)
}
function terms(s:NonNullable<ReturnType<typeof selected>>,slot:CourseTeachingDraftSlot,draft:CourseTeachingDraft,current:string){
 const job=courseTeachingJob(s,slot,draft);if(!job)return '请先明确本次方式，再核对真实投入。'
 const date=slot==='plan'?draft.supportStartAt:draft.startAt,count=slot==='plan'?draft.resources.length:1
 let completion:string|null=null;try{if(validDate(date,current))completion=addDays(date,job.durationDays)}catch{/* Keep the selected local date. */}
 return `${slot==='plan'?'本次原支持预留':'本次安排'}基准${moneyText(job.costFen*count)} · ${job.actionPoints*count}点 · ${job.durationDays}日${count>1?' · '+count+'份原资源':''}。${completion?'预计'+completion+'完成；预计不等于实际完成。':'请明确资源与有效日期。'}工资与沿途费用另按原日期发生。`
}
type EditorProps={p:GamePanelProps;draft:CourseTeachingDraft;setDraft:Dispatch<SetStateAction<CourseTeachingDraft>>}
function Resources({p,draft,setDraft,multiple=false}:{multiple?:boolean}&EditorProps){
 const name=useId(),resources=p.features.course?.resources??[]
 const toggle=(id:string,checked:boolean)=>setDraft(old=>({...old,resources:checked?old.resources.includes(id)?old.resources:[...old.resources,id]:old.resources.filter(value=>value!==id)}))
 return <fieldset className="teaching-paper-choices"><legend>{multiple?'明确选择1—3份实际支持资源':'这次由谁实际承担'}</legend>{resources.map(r=><label key={r.id}><input type={multiple?'checkbox':'radio'} name={name} checked={draft.resources.includes(r.id)} onChange={e=>multiple?toggle(r.id,e.target.checked):setDraft(old=>({...old,resources:[r.id]}))}/><span>{r.id==='player-production'?'由我自己承担':courseResourceLabel(r.id,resources,p.view.operations?.workers)}</span></label>)}{draft.resources.some(id=>!resources.some(r=>r.id===id))?<p className="teaching-warning">原选择中有资源已不可用，请明确清除或重选。</p>:null}{draft.resources.length>3?<p className="teaching-warning">本班最多选择三份资源，请明确保留哪些安排。</p>:null}<button type="button" className="teaching-link" onClick={()=>setDraft(old=>({...old,resources:[]}))}>清除这次资源选择</button></fieldset>
}
function DateField({p,draft,setDraft,field='startAt',label='从哪天开始',min,max}:{field?:'startAt'|'endAt'|'supportStartAt';label?:string;min?:string;max?:string}&EditorProps){
 const first=min&&min>p.view.date?min:p.view.date,through=max??(p.view.phase==='epilogue'?p.view.date:playableThrough)
 return <div><label className="field">{label}<input type="date" min={min??p.view.date} max={through} readOnly={p.view.phase==='epilogue'} value={draft[field]} onChange={e=>{const value=e.target.value;setDraft(old=>({...old,[field]:value}))}}/></label>{field==='startAt'?<button type="button" className="teaching-link" disabled={first>through} onClick={()=>setDraft(old=>({...old,startAt:first}))}>{first===p.view.date?'明确选择今天 '+first:'明确从 '+first+' 起安排'}</button>:null}{draft[field]&&draft[field]<p.view.date?<p className="teaching-warning">草稿日期{draft[field]}已经过去，请重新选择；没有改成今天。</p>:null}</div>
}
function Support({p,draft,setDraft,businessId}:{businessId:string}&EditorProps){
 const deployments=p.features.story.deployments.filter(d=>d.businessId===businessId&&d.lifecycle==='active'&&d.currentGrant?.scopes.includes('course_support'))
 const choices=deployments.filter(d=>draft.supportMode!=='delegated_group'||d.currentGrant?.level==='cross_flow')
 return <><label className="field">准备怎样承担支持<select value={draft.supportMode} onChange={e=>{const mode=e.target.value;setDraft(old=>({...old,supportMode:mode,deploymentId:null}))}}><option value="">请明确选择支持方式</option>{supportModes.map(mode=><option value={mode} key={mode}>{supportModeText[mode]}</option>)}</select></label>{agentSupportMode(draft.supportMode)?<><label className="field">本次明确使用哪项已有部署<select value={draft.deploymentId??''} onChange={e=>{const id=e.target.value;setDraft(old=>({...old,deploymentId:id||null}))}}><option value="">请明确选择本主体已有权限</option>{choices.map(d=><option key={d.id} value={d.id}>{d.id.slice(-6)} · {d.currentGrant?.level==='cross_flow'?'跨流程':d.currentGrant?.level==='limited'?'有限步骤':'逐项确认'} · 至{d.currentGrant?.expiresAt}</option>)}</select></label><p>代理只使用已有许可；原额度、实际日期和所有槽位仍须预览核对，不自动申请或扩权。</p>{!choices.length?<p className="teaching-warning">没有本次可选择的原权限。仍可明确改选手动支持，或翻原记录独立处理权限。</p>:null}</>:null}</>
}
export function CourseTeachingRecord({p,target}:{p:GamePanelProps;target:CourseSceneTarget}){
 const s=selected(p,target);if(!s)return <p>原教学对象暂不可核，请明确重新选择。</p>
 const progress=courseSceneProgress(s.v,p.view.date,target,context(p)),{lesson,cohort:co,audience:a}=s,money=co?courseCohortFinancials(s.v,p.view,co.id):null
 const job=target.kind==='cohort'&&target.jobId?p.view.operations?.jobs.find(j=>j.id===target.jobId):target.kind==='audience'?a?.job:undefined
 return <section className="teaching-record-leaf"><h3>{lesson.name}{co?' · '+co.startAt+'班':''}</h3><p>{progress?.title}</p><p>{progress?.line}</p><p className="teaching-terms">{progress?.choice.line}</p>{job?<p>{job.status==='planned'?'已安排，尚未实际开工':job.status==='running'?'正在进行，尚未实际完成':job.status==='completed'?'原任务已实际完成':'原任务已停止'} · {job.startAt}—{job.completeAt}。</p>:null}{a?<p>本份受众报价{moneyText(a.priceFen)}；{a.completedAt===null?'实际意向尚未形成。':'实际覆盖'+a.members.length+'人，当前基础意向'+a.eligibleMembers.length+'人；还须独立报名。'}</p>:null}{co?<>{progress?.historical?<p>以下学员与钱款为截至{p.view.date}的本班汇总；这次尝试仍按自己的日期回看。</p>:null}<p>冻结单价{moneyText(co.priceFen)} · 最多{co.seatLimit}人 · {co.startAt}开课 / {co.endAt}前完成教学；原支持至{co.supportCompleteAt}，整改与退款窗口至{co.refundUntil}。</p><ol className="teaching-stage-slips">{co.stages.map(stage=><li key={stage.index} data-state={stage.deliveredAt?'actual':'pending'}>第{stage.index+1}段 · {stage.deliveredAt?stage.deliveredAt+'实际交付，本段确认'+moneyText(stage.amountFen):'最晚'+stage.dueAt+'实际完成'}</li>)}</ol>{co.supportJobs.map(slot=><p key={slot.jobId}>{slot.recovery?'补支持':'已经预留的原支持'} · {supportModeText[slot.mode]} · 容量{slot.capacity} · {slot.job?.startAt}—{slot.job?.completeAt} · {slot.job?.status==='completed'?'已实际完成':slot.job?.status==='planned'?'已预留':slot.job?.status==='running'?'正在进行':'原任务已停止'}。</p>)}<p>{co.assessmentAt?'实际学习反馈：'+co.students.filter(s=>s.paidRemainingFen>0&&s.outcome==='helped').length+'人已达到原约定，'+co.students.filter(s=>s.paidRemainingFen>0&&s.outcome==='needs_recovery').length+'人仍需帮助。':'学习反馈尚未形成；不提前判断哪位学员会需要补帮助。'}</p>{money?<><p className="teaching-receipt">本班收到预款{moneyText(money.receivedFen)}；尚未交付预款{moneyText(money.unearnedFen)}，原保护占款{moneyText(money.protectedFen)}；已确认教学收入{moneyText(money.recognizedFen)}（已扣退款冲减）。阶段确认不重复收款。</p><p>已登记退款{moneyText(money.refundRegisteredFen)} · 实际已退{moneyText(money.refundPaidFen)} · 仍应付退款{moneyText(money.refundDueFen)}。{co.feePostedAt?'原结算费已列账'+moneyText(money.feePostedFen)+'，实际已付'+moneyText(money.feePaidFen)+'、待付'+moneyText(money.feeDueFen):'原结算费仍待退款窗口后实际列账'}。</p>{money.totalDueFen>0?<p className="teaching-warning">本班仍有{moneyText(money.totalDueFen)}原应付，保护和欠款不因停课或换页消失，请翻原账处理。</p>:null}</>:<p className="teaching-warning">本班钱款明细暂不可完整核对，请翻原账；没有将未知金额写成零。</p>}<p>{co.closedAt?'本班已于'+co.closedAt+'按原窗口实际结清；学习与退款结果仍保留。':co.feePostedAt?'费用已列账，本班仍在结算中；没有当作已全部付清。':'本班尚未结清，原支持、退款与窗口继续。'}</p></>:null}{progress?.historical?<p className="teaching-warning">这里是明确选中的原任务；没有换到最新尝试。请先明确翻回本班当前安排，再决定新投入。</p>:null}</section>
}
export function CourseTeachingChoice({p,target,onTarget,onInspect,onToday,onLife,blockedReason,children}:Props){
 const key=JSON.stringify(target),source=useRef({key,version:0})
 if(source.current.key!==key)source.current={key,version:source.current.version+1}
 const [local,setLocal]=useState({version:source.current.version,value:target}),current=onTarget?target:local.version===source.current.version?local.value:target
 const [open,setOpen]=useState(false),[page,setPage]=useState<Page>('record'),[slot,setSlot]=useState<CourseTeachingDraftSlot>('audience'),[pick,setPick]=useState<CourseSceneTarget|null>(null),[stop,setStop]=useState<{source:string;jobId:string}|null>(null)
 const [sourceLeaf,setSourceLeaf]=useState({version:source.current.version,index:0})
 const sourceIndex=sourceLeaf.version===source.current.version?sourceLeaf.index:0
 const openedRevision=useRef(p.view.revision),name=useId(),s=selected(p,current),progress=current?courseSceneProgress(p.features.course,p.view.date,current,context(p)):null
 const [draft,setDraft]=useCourseTeachingDraft(p.view.runId,scopeFor(p,current,slot),p.courseTeachingDraftMemory)
 const edit=(patch:Partial<CourseTeachingDraft>)=>setDraft(old=>({...old,...patch})),choose=(next:CourseSceneTarget|null)=>{if(courseTeachingBookmarkLock(p,blockedReason))return false;setLocal({version:source.current.version,value:next});onTarget?.(next);return true}
 const identityReason=courseTeachingContextReason(p,current),lock=courseTeachingSubmissionLock(p,blockedReason)??identityReason,bookmarkLock=courseTeachingBookmarkLock(p,blockedReason)
 useEffect(()=>{if(blockedReason||p.view.hasCandidate||p.view.saveStatus==='conflict'||open&&p.view.revision!==openedRevision.current&&p.view.saveStatus==='saved')setOpen(false)},[blockedReason,p.view.hasCandidate,p.view.saveStatus,p.view.revision,open])
 const refreshActive=s?.lesson.refreshes.some(refresh=>refresh.job&&['planned','running'].includes(refresh.job.status))??false
 const show=(intent:CourseTeachingIntent)=>{setStop(null);if(intent==='refresh'&&refreshActive){setPage('record');return}if(intent!=='record'&&intent!=='next'&&intent!=='targets')setSlot(intent);setPage(intent)}
 const activate=(intent?:CourseTeachingIntent)=>{if(blockedReason)return;openedRevision.current=p.view.revision;setPick(null);setStop(null);const next=intent??(progress?.historical||s?.cohort?.closedAt!=null?'next':progress?.teachingIntent??'record');if(next==='targets'||!s||identityReason||progress?.invalidReason){setPage('targets')}else if(next==='refresh'&&refreshActive){setPage('record')}else if(current?.kind==='cohort'&&current.jobId!==undefined&&next!=='record'&&next!=='next'&&next!=='capital'&&next!=='refresh'){setPage('next')}else{if(next!=='record'&&next!=='next')setSlot(next);setPage(next)}setOpen(true)}
 // The original confirmation may be cancelled. Keep this exact editor and draft
 // beneath it until an actual saved revision or failed candidate closes it.
 const request:GamePanelProps['request']=(kind,payload,label,confirm)=>{if(courseTeachingSubmissionLock(p,blockedReason)||courseTeachingContextReason(p,current)||!selected(p,current))return;p.request(kind,payload,label,confirm)}
 const submit=(command:CourseTeachingCommand)=>lock?<button type="button" disabled>{command.label}</button>:<CommandButton {...p} {...command} request={request} reasonText={courseTeachingReasonText} primary/>
 const inspect=()=>{setOpen(false);onInspect?.(current,['record','next','targets','stop','more','details'].includes(page)?undefined:slot)}
 const command=courseTeachingDraftCommand(p,draft,slot,current),co=s?.cohort,a=s?.audience
 const enrollmentBatch=co?courseEnrollmentBatch(co,draft.personIds):null
 let enrollmentQuote:{receivedFen:number;protectedFen:number}|null=null
 const enrollmentPreview=useCommandPreview(p.controller,p.view,(page==='enroll'||page==='enroll-people')&&command?.kind==='EnrollCourseAudience'&&!lock?{runId:p.view.runId,actorId:'player',commandId:'course-enrollment-display',expectedRevision:p.view.revision,kind:command.kind,payload:command.payload}:null)
 if((page==='enroll'||page==='enroll-people')&&command?.kind==='EnrollCourseAudience'&&!lock){
  const preview=enrollmentPreview.preview
  if(preview.allowed&&typeof preview.receivedPrepaymentFen==='number'&&typeof preview.protectedIncreaseFen==='number')enrollmentQuote={receivedFen:preview.receivedPrepaymentFen,protectedFen:preview.protectedIncreaseFen}
 }
 const ordinaryDate=progress?.wait?.date??defaultWaitDate(p.features.workbench,typeof p.requestWait==='function'),safeDate=progress?.phase==='course-stage-needed'?courseStageWaitDate(p.features.workbench,p.view.date,progress,typeof p.requestWait==='function'):progress?.wait?courseWaitDate(p.features.workbench,p.view.date,ordinaryDate,typeof p.requestWait==='function'):p.features.workbench.pause===null&&!p.features.workbench.progression.requiresDelivery?playableAdvanceDate(p.features.workbench,p.view.date,ordinaryDate):null
 const stoppedJob=stop?.source===JSON.stringify(current)?p.view.operations?.jobs.find(j=>j.id===stop.jobId&&j.businessId===s?.business.id&&['planned','running'].includes(j.status)):undefined
 const records:CourseSceneTarget[]=p.features.course?[...p.features.course.courses.filter(c=>c.status==='ready').map(c=>({kind:'course' as const,businessId:c.businessId,courseId:c.id})),...p.features.course.audiences.map(a=>({kind:'audience' as const,businessId:p.features.course!.courses.find(c=>c.id===a.courseId)!.businessId,courseId:a.courseId,audienceId:a.id})),...p.features.course.cohorts.map(co=>({kind:'cohort' as const,businessId:p.features.course!.courses.find(c=>c.id===co.courseId)!.businessId,courseId:co.courseId,cohortId:co.id}))].filter(t=>courseTargetReason(p.features.course,t,context(p))===null):[]
 const originalJobs=[...(co?[...co.stageJobs.flat().filter(j=>j!==null),...co.supportJobs.flatMap(slot=>slot.job?[slot.job]:[])]:a?.job?[a.job]:[]),...(s?.lesson.refreshes.flatMap(refresh=>refresh.job?[refresh.job]:[])??[])]
 const liveJobs=originalJobs.filter((job,index)=>['planned','running'].includes(job.status)&&originalJobs.findIndex(original=>original.id===job.id)===index)
 const selectNewAudience=()=>{if(s&&choose({kind:'course',businessId:s.business.id,courseId:s.lesson.id}))show('audience')}
 const summaryPage=page==='record'||page==='next',money=co?courseCohortFinancials(s?.v??null,p.view,co.id):null
 const returnToClass=()=>{if(current?.kind==='cohort'&&choose({kind:'cohort',businessId:current.businessId,courseId:current.courseId,cohortId:current.cohortId}))show('record')}
 const leave=(callback:(()=>void)|undefined)=>{if(!callback||courseTeachingBookmarkLock(p,blockedReason))return;setOpen(false);callback()}
 const currentDecision=progress?.teachingIntent
 const urgentDecision=co&&(co.teachingCancelled||progress?.phase==='course-stage-overdue'||progress?.phase==='course-recovery-needed')
 const refundSide=co&&co.closedAt===null&&p.view.date<=co.refundUntil&&co.students.some(student=>student.paidRemainingFen>0)&&current?.kind==='cohort'&&current.jobId===undefined&&!(currentDecision==='refund'&&(!progress?.wait||urgentDecision)&&!(money&&money.totalDueFen>0&&onInspect))
 const matchingSources=s?.v.videoCohorts.filter(source=>source.segment===s.lesson.segment&&source.date<=p.view.date)??[],product=s?.v.catalog.products.find(product=>product.id===s.lesson.productId)
 const quotedPrice=parseMoneyInput(draft.price),priceReady=quotedPrice!==null&&!!product&&quotedPrice>=product.minPriceFen&&quotedPrice<=product.maxPriceFen
 const sourcePages=Math.max(1,Math.ceil(matchingSources.length/2)),sourcePage=Math.min(sourceIndex,sourcePages-1)
 const audiencePaper=!!s&&s.lesson.status==='ready'&&!co&&!identityReason&&!progress?.invalidReason&&!progress?.historical&&!s.lesson.unresolvedUpdates.length&&(page!=='audience-schedule'||s.v.resources.length<=2)&&(['audience','audience-quote','audience-sources','audience-schedule','capital'].includes(page)||summaryPage&&current?.kind==='audience'&&['course-audience-planned','course-audience-running','course-audience-ready','course-audience-empty'].includes(progress?.phase??''))
 let primary:ReactNode=null
 if(page==='targets')primary=<button type="button" className="primary" disabled={!pick||bookmarkLock!==null} onClick={()=>{if(pick&&choose(pick))show('record')}}>明确选择这一份承诺</button>
 else if(summaryPage){
  if(current?.kind==='cohort'&&current.jobId!==undefined&&progress?.historical)primary=<button type="button" className="primary" disabled={bookmarkLock!==null} onClick={returnToClass}>翻回这一班，决定接下来的事 →</button>
  else if(co?.closedAt!==null&&co?.closedAt!==undefined&&onToday)primary=<button type="button" className="primary" disabled={bookmarkLock!==null} onClick={()=>leave(onToday)}>收好这一班，回到今天 →</button>
  else if(money&&money.totalDueFen>0&&onInspect)primary=<button type="button" className="primary" disabled={bookmarkLock!==null} onClick={inspect}>翻开本班未付原账，核对责任 →</button>
  else if(currentDecision&&(!progress?.wait||urgentDecision))primary=<button type="button" className="primary" disabled={bookmarkLock!==null} onClick={()=>show(currentDecision)}>{progress!.choice.label} →</button>
  else if(current?.kind==='audience'&&!co&&!progress?.wait)primary=<button type="button" className="primary" disabled={bookmarkLock!==null} onClick={selectNewAudience}>为这门课另拟一份受众方案 →</button>
  else if(!lock&&safeDate&&co?.closedAt==null)primary=<ClockAdvance p={{...p,request}} date={safeDate} label={(progress?.wait?safeDate===progress.wait.date?progress.wait.label:'先到日历上的这一日':defaultWaitLabel(p.features.workbench,typeof p.requestWait==='function','不新增安排，让原日子继续'))+' · '+safeDate}/>
 }
 else if(page==='more'||page==='details')primary=<button type="button" className="primary" onClick={()=>show('record')}>回到眼前这一步 →</button>
 else if(page==='stop')primary=stoppedJob?submit({kind:'InterruptJob',payload:{jobId:stoppedJob.id},label:'核对停止这次安排，保留原责任',confirm:true}):<button type="button" disabled>原任务已变化，请翻回原记录核对</button>
 else if(page==='audience')primary=<button type="button" className="primary" disabled={!['paid','video_referral'].includes(draft.audienceMode)} onClick={()=>setPage('audience-quote')}>为这次接触，拟一份报价 →</button>
 else if(page==='audience-quote')primary=<button type="button" className="primary" disabled={!priceReady||!['paid','video_referral'].includes(draft.audienceMode)} onClick={()=>setPage(draft.audienceMode==='paid'?'audience-schedule':'audience-sources')}>{draft.audienceMode==='paid'?'留出推广的人手与日期':'逐份选择已有受众来源'} →</button>
 else if(page==='plan')primary=<button type="button" className="primary" disabled={!draft.startAt||!draft.endAt||!draft.seatLimit||!draft.promise} onClick={()=>setPage('plan-support')}>再决定这份支持由谁承担 →</button>
 else primary=command?submit(command):<button type="button" disabled>{page==='refresh'?'先选人手和开工日，再核对安排':'先明确本页选择，再核对承诺'}</button>
 const footer=<div className="teaching-footer">{primary}{summaryPage?<>{refundSide?<button type="button" disabled={bookmarkLock!==null} onClick={()=>show('refund')}>也可核对本班原退款</button>:co?.closedAt!=null&&onToday?onLife?<button type="button" disabled={bookmarkLock!==null} onClick={()=>leave(onLife)}>把余下的日子留给生活</button>:null:onToday?<button type="button" disabled={bookmarkLock!==null} onClick={()=>leave(onToday)}>先不新增安排，回到今天</button>:<button type="button" onClick={()=>setPage('details')}>翻看这份原记录</button>}<button type="button" onClick={()=>setPage('more')}>其他选择与完整原记录 ↗</button></>:page==='targets'||page==='more'||page==='details'?null:page==='enroll-people'?<button type="button" onClick={()=>setPage('enroll')}>返回本班名单</button>:page==='plan-support'?<button type="button" onClick={()=>setPage('plan')}>返回本班承诺</button>:page==='audience-schedule'||page==='audience-sources'?<button type="button" onClick={()=>setPage('audience-quote')}>返回本次报价</button>:page==='audience-quote'?<button type="button" onClick={()=>setPage('audience')}>返回接触方式</button>:page==='capital'&&audiencePaper?<button type="button" onClick={()=>show('audience')}>回到同一门课的受众准备</button>:<button type="button" onClick={()=>show('record')}>返回这份原记录</button>}<button type="button" onClick={()=>setOpen(false)}>先合上，保留草稿</button>{onInspect&&!summaryPage?<button type="button" className="teaching-link" onClick={inspect}>翻开同对象的完整原册 ↗</button>:null}</div>
 const title=page==='next'?(co?'这一班之后，怎样继续？':'这份回应之后，怎样继续？'):page==='more'?'原来的承诺与其他选择':page==='details'?(co?'这一班的学员与完整原账':'这份受众的完整原记录'):page==='targets'?'先选回这一份教学承诺':page==='capital'?'为这门课，再留多少自己的钱？':page==='audience'?'这堂课，先让谁真正看见？':page==='audience-quote'?'这一堂课，怎样开口报价？':page==='audience-sources'?'从已有的相遇，接着往下走':page==='audience-schedule'?'为这次推广，留出人手与日子':page==='plan'?'这一班，我明确答应什么？':page==='plan-support'?'这些人，需要我怎样承担支持？':page==='enroll-people'?'逐位核对原受众意向':page==='enroll'?'这一班，明确接下哪几位？':page==='stage:0'||page==='stage:1'?'为第'+(page==='stage:0'?1:2)+'段课留出日子':page==='recovery'?'还有人没跟上，这次怎样补帮助？':page==='refund'?'按已经交付的部分，核对这次退款':page==='refresh'?'工具变了，先照顾原来的学员':page==='stop'?'要停下这次安排吗？':current?.kind==='audience'?'这份回应，接下来怎样继续？':'这一班，与答应过的人'
 const selectedPeople=co?draft.personIds.map(id=>co.students.find(s=>s.personId===id)):[],refundQuote=selectedPeople.every(Boolean)?(()=>{try{return sumMoney(selectedPeople.map(s=>s!.paidRemainingFen))}catch{return null}})():null

 const marketingGap=s?Math.max(0,s.v.catalog.marketingCostFen-s.business.funds.availableFen):null
 return <>{children?children(activate):<button type="button" onClick={()=>activate()}>走近这一班的承诺 ↗</button>}{open?<Dialog title={title} className={"opening-paper course-teaching-paper"+(audiencePaper?" course-audience-paper":"")} layout={audiencePaper?'direct':'book'} onClose={()=>setOpen(false)} footer={footer}><p className="teaching-kicker">{audiencePaper&&['audience','audience-quote','audience-sources','audience-schedule'].includes(page)?<span className="audience-leaf">{page==='audience'?'01 接触方式':page==='audience-quote'?'02 拟定报价':'03 '+(page==='audience-sources'?'原受众来源':'投入与日期')} · </span>:null}{p.view.date} · {s?.lesson.name??'尚未明确选择教学对象'}{co?' · '+co.startAt+'班':''}</p>{lock?<p role="status" className="teaching-warning">{lock}</p>:null}{progress?.invalidReason&&progress.invalidReason!==lock?<p className="teaching-warning">{progress.invalidReason}</p>:null}{!summaryPage&&co?<p className="teaching-terms">{money?'本班原保护'+moneyText(money.protectedFen)+'；':'本班保护金额待翻原账核对；'}原支持至{co.supportCompleteAt}，退款窗口至{co.refundUntil}，原责任继续。</p>:null}{!summaryPage&&s?.lesson.unresolvedUpdates.length?<p className="teaching-warning">原课程更新最早期限{s.lesson.unresolvedUpdates.map(update=>update.dueAt).sort()[0]}，没有因本次新选择解除。</p>:null}{!summaryPage&&money&&money.totalDueFen>0?<p className="teaching-warning">本班仍有{moneyText(money.totalDueFen)}原应付（其中退款{moneyText(money.refundDueFen)}），当前原保护{moneyText(money.protectedFen)}；原账与期限不因本次新安排消失。</p>:null}
  {page==='targets'?<fieldset className="teaching-paper-choices"><legend>预看不会更换书签，明确选择才放到眼前</legend>{records.map(t=>{const lesson=p.features.course!.courses.find(c=>c.id===('courseId' in t?t.courseId:'')),record=t.kind==='audience'?p.features.course!.audiences.find(a=>a.id===t.audienceId):undefined,cohort=t.kind==='cohort'?p.features.course!.cohorts.find(co=>co.id===t.cohortId):undefined;return <label key={JSON.stringify(t)}><input type="radio" name={name+'target'} checked={JSON.stringify(pick)===JSON.stringify(t)} onChange={()=>setPick(t)}/><span>{lesson?.name}<small>{cohort?cohort.startAt+'班 · '+(cohort.closedAt?'原班已结清':'原承诺仍在'):record?record.createdAt+'受众记录 · 报价'+moneyText(record.priceFen):'样课已经准备好，新的班期另定'}</small></span></label>})}{!records.length?<p>当前没有可核的课程或班期。原记录和生活仍可翻阅，没有自动开班。</p>:null}</fieldset>:null}
  {page==='capital'&&s?<><p>这门课当前可花{moneyText(s.business.funds.availableFen)}；个人当前可花{moneyText(p.view.accounts.find(a=>a.accountId==='personal')?.availableFen)}。只转入你这次明确选择的自有资金，不是收入或额外利润。</p><label className="field">本次从个人转入多少元<input inputMode="decimal" value={draft.capital} onChange={e=>edit({capital:e.target.value})}/></label><p>推广、支持、工资与维护仍分别承担；未来学员预款不能替代现在的自有资金。</p></>:null}
  {(page==='audience-quote'||page==='audience-schedule')&&s&&draft.audienceMode==='paid'?<p role="status" aria-label="本次付费推广的资金核对" className={marketingGap!==null&&marketingGap>0?'teaching-warning':'teaching-terms'}>{page==='audience-schedule'?<>教室可花{moneyText(s.business.funds.availableFen)}；推广费{moneyText(s.v.catalog.marketingCostFen)}{marketingGap!==null&&marketingGap>0?<>，尚差{moneyText(marketingGap)}，当前不能提交；可返回报价另核自有资金。</>:<>，可花资金可覆盖，仍须原确认。</>}未来学费和客户保护不能支付当前投入。</>:<>本次推广{moneyText(s.v.catalog.marketingCostFen)} · 1点 · 7日；本教室当前可花{moneyText(s.business.funds.availableFen)}。{marketingGap!==null&&marketingGap>0?<>仅推广费还差{moneyText(marketingGap)}，当前不能提交这次推广。可保留草稿，或另行确认自己的资金投入。</>:<>当前可花可覆盖这笔推广费；资源、资格、日期及沿途费用仍须原确认核对。</>}未来学费和客户保护不能支付现在的投入。</>}</p>:null}
  {(page==='audience-quote'&&draft.audienceMode==='video_referral'||page==='audience-sources')&&s?<p className="teaching-terms" aria-label="当前公开的视频来源">{matchingSources.length?'当前有'+matchingSources.length+'份本课同受众的公开既有来源，仍须逐份显选；':'当前没有本课同受众的公开既有来源，不把未知画成可用；'}本次实际意向、报名与收入尚未发生。</p>:null}
  {page==='audience'&&s?<><p>{s.lesson.status==='ready'?'样课已经做好。先想一想，要从哪里遇见需要它的人。':'先核对原来的课程准备，再决定这次受众与报价；这里没有提前完成样课。'}</p><fieldset className="teaching-paper-choices audience-mode-choices"><legend>这次通过什么原途径认识受众</legend><label><input type="radio" name={name+'audience'} checked={draft.audienceMode==='paid'} onChange={()=>edit({audienceMode:'paid'})}/><span>为本课做一次付费推广<small>{moneyText(s.v.catalog.marketingCostFen)} · 1点 · 7日，实际完成后才看意向。</small></span></label><label><input type="radio" name={name+'audience'} checked={draft.audienceMode==='video_referral'} onChange={()=>edit({audienceMode:'video_referral'})}/><span>核对已有同受众的视频记录<small>本课同受众的实际记录{matchingSources.length}份，逐份选择，不自动借用；仍须独立核对。</small></span></label></fieldset><p className="audience-boundary">这一步只拟方案；推广、实际意向、开班与报名分别发生，不保证收入。</p></>:null}
  {page==='audience-quote'&&s?<><p>本课为{product?.label}；可报价{moneyText(product?.minPriceFen)}—{moneyText(product?.maxPriceFen)}。报价影响实际意向，不保证报名。</p><label className="field">这次面向受众的课程报价（元）<input inputMode="decimal" value={draft.price} onChange={e=>edit({price:e.target.value})}/></label>{draft.price&&!priceReady?<p className="teaching-warning">请按这门课的原报价范围填写；没有替你改价。</p>:null}<p className="audience-boundary">{draft.audienceMode==='paid'?'本次推广实际完成后，才看有多少人愿意进一步了解。':'只核对你明确选择的实际视频受众，来源与购买资格仍须原确认。'}现在没有报名，也没有学费收入。</p><button type="button" className="teaching-link" onClick={()=>show('capital')}>先核对是否追加自己的资金</button>{current?.kind!=='course'?<button type="button" className="teaching-link" onClick={selectNewAudience}>明确回到这门课，准备另一份受众方案</button>:null}</>:null}
  {page==='audience-sources'&&s&&draft.audienceMode==='video_referral'?<fieldset className="teaching-paper-choices"><legend>明确选择已有来源，不自动借用别的受众</legend>{matchingSources.slice(sourcePage*2,sourcePage*2+2).map((source,index)=><label key={source.id}><input type="checkbox" checked={draft.sourceIds.includes(source.id)} onChange={e=>{const checked=e.target.checked;setDraft(old=>({...old,sourceIds:checked?old.sourceIds.includes(source.id)?old.sourceIds:[...old.sourceIds,source.id]:old.sourceIds.filter(id=>id!==source.id)}))}}/><span>已有受众{sourcePage*2+index+1} · {source.date} · 实际{source.members}人</span></label>)}{!matchingSources.length?<p className="teaching-warning">没有本课同受众的已有记录，不会借用另一群人；可明确改选付费推广或先保留准备。</p>:null}{draft.sourceIds.some(id=>!matchingSources.some(source=>source.id===id))?<p className="teaching-warning">草稿里的原来源已不匹配，仍保留原选择；请明确清除或重选，没有换成另一个视频记录。</p>:null}{sourcePages>1?<div className="audience-source-leaves"><button type="button" disabled={sourcePage===0} onClick={()=>setSourceLeaf({version:source.current.version,index:sourcePage-1})}>← 前两份</button><span>第{sourcePage+1}/{sourcePages}页 · 本稿已选{draft.sourceIds.length}份</span><button type="button" disabled={sourcePage===sourcePages-1} onClick={()=>setSourceLeaf({version:source.current.version,index:sourcePage+1})}>后两份 →</button></div>:null}{draft.sourceIds.length?<button type="button" className="teaching-link" onClick={()=>edit({sourceIds:[]})}>明确清除这次来源选择</button>:null}</fieldset>:null}
  {page==='audience-schedule'&&s?<><p className="audience-quote-slip">拟报价{moneyText(quotedPrice??undefined)}；推广由课程自有资金承担，实际完成才形成意向，尚未报名或收取预售款。</p><div className="audience-schedule-fields"><Resources p={p} draft={draft} setDraft={setDraft}/><DateField p={p} draft={draft} setDraft={setDraft}/></div><p className="teaching-terms">{terms(s,'audience',draft,p.view.date)}</p></>:null}
  {page==='plan'&&s&&a?<><p>沿这份实际受众记录的报价冻结单价{moneyText(a.priceFen)}；已有基础意向{a.eligibleMembers.length}人。班额还要核对真实支持容量，这一步没有收款。</p><div className="teaching-fields"><DateField p={p} draft={draft} setDraft={setDraft} label="本班从哪天开课" min={addDays(p.view.date,1)}/><DateField p={p} draft={draft} setDraft={setDraft} field="endAt" label="最迟哪天完成两段教学"/></div><label className="field">本班最多明确接下多少人<input inputMode="numeric" value={draft.seatLimit} onChange={e=>edit({seatLimit:e.target.value})}/></label><label className="field">这一次作出怎样的原承诺<select value={draft.promise} onChange={e=>edit({promise:e.target.value})}><option value="">请明确选择本班承诺</option><option value="clear_scope">明确范围与练习目标</option><option value="accelerated_results">更激进的加速承诺 · 更多意向及投诉风险</option></select></label><p>两段教学须各自留出真实资源和日期；支持也要先预留，不能等收预款后才准备。</p></>:null}
  {page==='plan-support'&&s?<><Support p={p} draft={draft} setDraft={setDraft} businessId={s.business.id}/><Resources p={p} draft={draft} setDraft={setDraft} multiple/><DateField p={p} draft={draft} setDraft={setDraft} field="supportStartAt" label="原支持从哪天开始"/><p className="teaching-terms">{terms(s,'plan',draft,p.view.date)}</p>{draft.supportMode&&product?<p>所选方式每份资源容量{draft.supportMode==='self_small'?product.selfCapacity:product.capacity}人；名额还受实际在岗、日期与权限核对。保存班期即预留这些支持，不会再要求重复安排原支持。</p>:null}</>:null}
  {page==='enroll'&&co&&a&&enrollmentBatch?<><p>本班冻结单价{moneyText(co.priceFen)}；班额上限{co.seatLimit}，当前有{enrollmentBatch.active}位仍留存原款的学员。</p><p className="teaching-terms">班额余{enrollmentBatch.remainingSeats}席 · 本稿已选{draft.personIds.length}人。实际支持容量与购买资格仍须最终核对。</p>{enrollmentBatch.issue?<p className="teaching-warning">{enrollmentBatch.issue}</p>:null}<button type="button" className="teaching-link" disabled={enrollmentBatch.issue!==null||enrollmentBatch.addCount===0||bookmarkLock!==null} onClick={()=>setDraft(old=>{const batch=courseEnrollmentBatch(co,old.personIds);return batch.issue===null&&batch.addCount>0&&batch.personIds?{...old,personIds:batch.personIds}:old})}>{enrollmentBatch.addCount>0?(draft.personIds.length?'保留已选'+draft.personIds.length+'位，再按原记录补'+enrollmentBatch.addCount+'位':'按原记录先选'+enrollmentBatch.addCount+'位，留待核对'):'本班当前没有可补的名单名额'}</button><button type="button" className="teaching-link" onClick={()=>setPage('enroll-people')}>逐位翻全部{co.availablePeople.length}名原意向 ↗</button><button type="button" className="teaching-link" onClick={()=>setDraft(old=>({...old,personIds:[]}))}>明确清除本稿名单</button>{draft.personIds.length?<fieldset className="teaching-paper-choices"><legend>本班拟接名单 · 仍是草稿</legend><div className="button-row">{draft.personIds.map((id,index)=><button type="button" key={id+':'+index} onClick={()=>setDraft(old=>{const removeIndex=old.personIds.indexOf(id);return removeIndex<0?old:{...old,personIds:old.personIds.filter((_,position)=>position!==removeIndex)}})}>{a.members.includes(id)?'原受众意向'+(a.members.indexOf(id)+1):'原名单第'+(index+1)+'项（需重核）'} · 移除</button>)}</div></fieldset>:<p>还没有替你选择任何人。可以先按原记录拟一份名单，也可逐位翻看。</p>}{enrollmentQuote?<p className="teaching-receipt">拟收学员预款{moneyText(enrollmentQuote.receivedFen)}，拟增加保护{moneyText(enrollmentQuote.protectedFen)}；本次教学收入为¥0。确认并保存成功后才发生，不是已经收款。</p>:<p>名单仍在草稿；拟预款与保护须在原条件允许后核对，这份草稿尚未新增报名或收款。</p>}<p>这里只整理这一次明确接下的人，不改变本班价格、日期或原支持。支持至{co.supportCompleteAt}，退款窗口至{co.refundUntil}。</p></>:null}
  {page==='enroll-people'&&co&&a&&enrollmentBatch?<><p>本班冻结单价{moneyText(co.priceFen)}；目前{co.availablePeople.length}名实际未购意向，班额余{enrollmentBatch.remainingSeats}席。本稿已选{draft.personIds.length}人，本次尚未新增报名或收款。</p><fieldset className="teaching-paper-choices"><legend>逐位核对全部原名单</legend>{co.availablePeople.map(id=><label key={id}><input type="checkbox" checked={draft.personIds.includes(id)} onChange={e=>{const checked=e.target.checked;setDraft(old=>({...old,personIds:checked?old.personIds.includes(id)?old.personIds:[...old.personIds,id]:old.personIds.filter(value=>value!==id)}))}}/><span>原受众意向{a.members.indexOf(id)+1}</span></label>)}</fieldset><button type="button" className="teaching-link" onClick={()=>setDraft(old=>({...old,personIds:[...co.availablePeople]}))}>全选原列表的{co.availablePeople.length}人（不按班额截短）</button><button type="button" className="teaching-link" onClick={()=>setDraft(old=>({...old,personIds:[]}))}>清除这次名单</button><p>已选{draft.personIds.length}人；名单不会按班额自动截短，最终仍须原预览允许。支持至{co.supportCompleteAt}，退款窗口至{co.refundUntil}。</p>{enrollmentBatch.issue?<p className="teaching-warning">{enrollmentBatch.issue}</p>:null}</>:null}
  {(page==='stage:0'||page==='stage:1')&&co&&s?<><p>第{page==='stage:0'?1:2}段最晚{co.stages[page==='stage:0'?0:1]!.dueAt}实际完成；开工不确认教学收入。</p><p className="teaching-terms">{terms(s,page,draft,p.view.date)}</p><Resources p={p} draft={draft} setDraft={setDraft}/><DateField p={p} draft={draft} setDraft={setDraft} min={co.startAt>p.view.date?co.startAt:p.view.date} max={courseStageLatestStart(co.stages[page==='stage:0'?0:1]!.dueAt,product?.stageDays??0)}/><p>最晚须在原完成期限前留足{product?.stageDays}日；第二段仍须第一段真实交付。实际完成按原规则释放保护并确认收入，不另造一次收款。</p></>:null}
  {page==='recovery'&&co&&s?<><p>本班整改期限{co.remedyDueAt}；只回应已公开的实际学习反馈，不能保证用支持换来新收入。</p><Support p={p} draft={draft} setDraft={setDraft} businessId={s.business.id}/><p className="teaching-terms">{terms(s,'recovery',draft,p.view.date)}</p><Resources p={p} draft={draft} setDraft={setDraft}/><DateField p={p} draft={draft} setDraft={setDraft}/><p>原补支持尝试、费用与退款窗口继续保留；不自动扩权或给免费行动。</p></>:null}
  {page==='refund'&&co?<><p>退款窗口至{co.refundUntil}。按原学员和阶段完整核对；未交付预款与已交付收入冲减分开，资金不足保留应付。</p><fieldset className="teaching-paper-choices"><legend>明确选择这次要处理的原学员</legend>{co.students.map((student,index)=><label key={student.id}><input type="checkbox" checked={draft.personIds.includes(student.personId)} disabled={student.paidRemainingFen<=0} onChange={e=>{const checked=e.target.checked;setDraft(old=>({...old,personIds:checked?old.personIds.includes(student.personId)?old.personIds:[...old.personIds,student.personId]:old.personIds.filter(id=>id!==student.personId)}))}}/><span>本班学员{index+1}<small>当前未退原款{moneyText(student.paidRemainingFen)}；已交付{moneyText(student.delivered[0]+student.delivered[1])}；{student.outcome==='helped'?'已公开达到约定':student.outcome==='needs_recovery'?'仍需补帮助':'原状态继续核对'}。</small></span></label>)}</fieldset><button type="button" className="teaching-link" onClick={()=>setDraft(old=>({...old,personIds:co.students.filter(student=>student.paidRemainingFen>0).map(student=>student.personId)}))}>明确选择本班全部仍有原款的学员</button><button type="button" className="teaching-link" onClick={()=>edit({personIds:[]})}>清除这次退款名单</button><label className="field">这次退款的实际原因<input value={draft.reason} maxLength={200} onChange={e=>edit({reason:e.target.value})}/></label><p>当前明确选{draft.personIds.length}人{refundQuote!==null?' · 应退原款'+moneyText(refundQuote):' · 原对象需重新核对'}；这是应退金额，不是已实际付清。</p>{draft.personIds.some(id=>!co.students.some(student=>student.personId===id&&student.paidRemainingFen>0))?<p className="teaching-warning">名单已有变化，请明确清除或重选；不会过滤后按更少人退款。</p>:null}</>:null}
  {page==='refresh'&&s?<><p>这次有{s.lesson.unresolvedUpdates.length}项内容要更新。翻看纸页，选好人手和开工日；已经买过课的学员不再交一次学费，购买记录保留。</p><p className="teaching-terms">{terms(s,'refresh',draft,p.view.date)}</p><Resources p={p} draft={draft} setDraft={setDraft}/><DateField p={p} draft={draft} setDraft={setDraft}/></>:null}
  {page==='stop'?<p>{stoppedJob?stoppedJob.startAt+'—'+stoppedJob.completeAt+'这次原安排将交原确认核对。':''}未执行的预留与已实际发生的成本分别处理；本班教学、支持、退款和欠款不会因停止任务消失。</p>:null}
  {summaryPage&&s&&current?<section className="teaching-current-step" aria-label="这一份承诺的当前一步">
   <h3>{progress?.title}</h3><p>{progress?.line}</p><p className="teaching-terms">{progress?.choice.line}</p>
   {progress?.phase==='course-stage-needed'&&!lock&&safeDate?<details><summary>暂缓教学，先核对还能等到哪天</summary><p>等待不会替你安排这段课；最晚开工日和已经答应的期限仍在。</p><ClockAdvance p={{...p,request}} date={safeDate} label={'先不安排教学，沿原日历继续 · '+safeDate}/></details>:null}
   {a&&!co&&!audiencePaper?<p>本份原报价{moneyText(a.priceFen)}；{a.completedAt===null?'实际受众尚未形成，不是报名或收入。':'实际覆盖'+a.members.length+'人，基础意向'+a.eligibleMembers.length+'人；还须明确开班和实际报名。'}</p>:null}
   {co?<><p>截至{p.view.date}，本班{co.students.filter(student=>student.paidRemainingFen>0).length}位仍留存原款的学员；两段教学{co.stages.filter(stage=>stage.deliveredAt!==null).length}/2已实际交付。原支持至{co.supportCompleteAt}，整改至{co.remedyDueAt}，退款窗口至{co.refundUntil}。</p>
    {money?<><p className="teaching-receipt">已收预款{moneyText(money.receivedFen)} · 待交付预款{moneyText(money.unearnedFen)} · 仍受保护{moneyText(money.protectedFen)}；教学收入{moneyText(money.recognizedFen)}。</p><p>已登记退款{moneyText(money.refundRegisteredFen)} · 已退{moneyText(money.refundPaidFen)} · 待退{moneyText(money.refundDueFen)}。{co.feePostedAt?'结算费'+moneyText(money.feePostedFen)+'，已付'+moneyText(money.feePaidFen)+'、待付'+moneyText(money.feeDueFen):'结算费待退款窗口结束后列账'}。</p>{money.totalDueFen>0?<p className="teaching-warning">本班仍有{moneyText(money.totalDueFen)}原应付；旧责任与保护继续保留，请翻完整原账处理。</p>:null}</>:<p className="teaching-warning">本班钱款暂不可完整核对，请翻原账；未知金额没有记成零。</p>}
    {co.assessmentAt?<p>实际学习反馈：{co.students.filter(student=>student.paidRemainingFen>0&&student.outcome==='helped').length}人已达到原约定，{co.students.filter(student=>student.paidRemainingFen>0&&student.outcome==='needs_recovery').length}人仍需帮助；反馈与新收费资格分开。</p>:null}
    {co.closedAt?<p>本班已于{co.closedAt}收尾。学员、退款与费用留在这份班期记录里；下一班由你另作决定。</p>:null}
   </>:null}
   {s.lesson.unresolvedUpdates.length?<p className="teaching-warning">这门课仍有{ s.lesson.unresolvedUpdates.length}项原更新责任；最早期限{ s.lesson.unresolvedUpdates.map(update=>update.dueAt).sort()[0]}，原教学、支持与退款仍须承担。</p>:null}
   {progress?.historical?<p className="teaching-warning">正在翻看明确选中的原任务，尚未换到本班当前安排。先明确翻回同一班，才能选择下一次投入。</p>:null}
  </section>:null}
  {page==='details'&&s&&current?<CourseTeachingRecord p={p} target={current}/>:null}
  {page==='more'&&s&&current?<div className="teaching-directions">
   <button type="button" onClick={()=>setPage('details')}>翻看这份承诺的全部学员与原账</button>
   {onToday?<button type="button" disabled={bookmarkLock!==null} onClick={()=>leave(onToday)}>先不新增安排，回到今天</button>:null}
   {onLife?<button type="button" disabled={bookmarkLock!==null} onClick={()=>leave(onLife)}>把余下的日子留给生活</button>:null}
   {current.kind==='cohort'&&current.jobId!==undefined?<button type="button" disabled={bookmarkLock!==null} onClick={returnToClass}>明确翻回本班当前的安排</button>:<>
    {currentDecision?<button type="button" onClick={()=>show(currentDecision)}>{progress!.choice.label}</button>:null}
    {co&&co.closedAt===null?<><button type="button" onClick={()=>show('refund')}>核对所选学员的原阶段退款</button><button type="button" onClick={()=>{setPick(null);setPage('targets')}}>显选本课其他受众或班期</button></>:null}
    {current.kind==='course'||co?.closedAt!=null?<button type="button" disabled={bookmarkLock!==null} onClick={selectNewAudience}>以这门课明确准备一次受众方案</button>:s.audience?<button type="button" disabled={bookmarkLock!==null} onClick={()=>{if(choose({kind:'audience',businessId:s.business.id,courseId:s.lesson.id,audienceId:s.audience!.id}))show('record')}}>明确翻看这份原受众与报价</button>:null}
   </>}
   {liveJobs.map(task=><button type="button" key={task.id} onClick={()=>{setStop({source:JSON.stringify(current),jobId:task.id});setPage('stop')}}>核对停止{task.startAt}—{task.completeAt}的原安排<small>实际成本与旧学生责任保留。</small></button>)}
   <button type="button" onClick={()=>show('capital')}>只核对是否追加这门课的自有资金</button>
   {s.lesson.unresolvedUpdates.length&&!refreshActive?<button type="button" onClick={()=>show('refresh')}>回应本课已有的原更新责任</button>:null}
   <button type="button" onClick={()=>{setPick(null);setPage('targets')}}>明确翻选另一份课程、受众或班期</button>
  </div>:null}
 </Dialog>:null}</>
}
