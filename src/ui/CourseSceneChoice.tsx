import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {courseSceneProgress,courseTargetReason,type CourseSceneTarget,type CoursePreparationStep} from './course-scene-progress.ts'
import {useCourseSceneDraft,type CourseSceneDraft,type CourseSceneDraftSlot,type CourseDraftCase} from './course-scene-draft.ts'
import {CoursePreparationFields,coursePreparationCommand,type CoursePreparationCommand} from './CoursePreparation.tsx'
import {courseResourceLabel} from './course-resource-labels.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {moneyText,playableThrough,lifecycleText,reasonText} from './game-text.ts'
import './course-play.css'
import './course-studio-preparation.css'
import {courseStudioPreparationPage} from './course-studio-reading.ts'
import {courseLessonPreparationPage} from './course-lesson-preparation.ts'
import './course-lesson-preparation.css'
import {CourseImageToolChoice} from './CourseImageToolChoice.tsx'
import {CourseTeachingChoice,type CourseTeachingIntent} from './CourseTeachingChoice.tsx'
import type {CourseTeachingDraftSlot} from './course-teaching-draft.ts'
import {CourseObjectChoices} from './CourseObjectChoices.tsx'
import {courseObjectReading} from './course-object-reading.ts'

export type CourseChoiceIntent='tool'|'fund'|'outline'|'activate'|'define'|'license'|'sample'|'record'|'next'|'objects'|'audience'|'plan'|'current-class'
type PreparationIntent=Exclude<CourseChoiceIntent,'audience'|'plan'|'current-class'>
type Page='tool'|'objects'|'fund'|'outline'|'activate'|'cases'|'definition'|'license'|'sample'|'record'|'next'
type Props={p:GamePanelProps;target:CourseSceneTarget|null;onTarget?:(target:CourseSceneTarget|null)=>void;onInspect?:(target:CourseSceneTarget|null,slot?:CourseSceneDraftSlot,teachingSlot?:CourseTeachingDraftSlot)=>void;onToday?:()=>void;onLife?:()=>void;onToolAccount?:()=>void;blockedReason?:string|null;children?:(open:(intent?:CourseChoiceIntent)=>void)=>ReactNode}
const segments=[['ai_learners','AI学习者'],['local_merchants','本地商家'],['lifestyle','生活方式受众']] as const
const sameCase=(a:CourseDraftCase,b:CourseDraftCase)=>a.kind===b.kind&&a.id===b.id
const context=(p:GamePanelProps)=>({preparationReady:p.features.workbench.routes.find(r=>r.id==='ai_course')?.requirements.preparationReady??false,operations:p.view.operations})
export function courseSceneContextReason(p:Pick<GamePanelProps,'features'|'accountId'|'view'>,target:CourseSceneTarget|null):string|null{
 if(!p.view.accounts.some(a=>a.accountId===p.accountId))return '当前查看账户已不可用，请先明确选择教室与账户。'
 if(!target)return p.accountId==='personal'?null:'请明确选择这间教室，或切回个人账户准备新教室。'
 const business=p.features.course?.businesses.find(b=>b.id===target.businessId)
 return business&&business.accountId!==p.accountId?'这份教案与当前查看账户不一致，请重新选择教室。':null
}
export function courseSceneBookmarkLock(p:GamePanelProps,blockedReason?:string|null):string|null{
 if(blockedReason)return blockedReason
 const committed=p.controller.snapshot.view
 if(committed&&(committed.runId!==p.view.runId||committed.revision!==p.view.revision))return '记录已更新，请重新核对这份草稿。'
 if(p.view.busy||p.controller.snapshot.busy)return '正在记下这一步，请稍候。'
 if(p.view.hasCandidate||p.view.saveStatus==='conflict')return '上一笔决定尚未保存，请先处理原候选；草稿仍保留。'
 return null
}
export function courseSceneSubmissionLock(p:GamePanelProps,blockedReason?:string|null):string|null{
 const locked=courseSceneBookmarkLock(p,blockedReason);if(locked)return locked
 if(p.view.readOnly)return '当前仅可翻阅，不能提交教学准备。'
 if(p.features.workbench.pause!==null||p.features.workbench.progression.requiresDelivery)return '先回应日历里需要处理的事，再回到这份教案。'
 return null
}
export function courseSceneReasonText(code:string):string{
 if(code==='INSUFFICIENT_ACTION_POINTS')return '本季行动点已不足；翻阅与推进本身不另耗行动，途中费用照常发生。'
 if(code==='WORLD_RELEASE_NOT_OCCURRED'||code==='CAPABILITY_NOT_YET_AVAILABLE')return '这项工具在当前年代尚未开放，请先核对开放日期。'
 if(code.startsWith('MISSING_ENTITLEMENT:'))return '需先取得对应访问资格；申请后仍须阅读实际获准的回信。'
 const line=reasonText(code)
 return line.startsWith('操作未完成')?'还有条件需要核对，请翻开完整记录查看。':line
}
/** Only explicitly selected public identities become original command payloads. */
export function courseDraftCommand(p:GamePanelProps,draft:CourseSceneDraft,intent:CourseChoiceIntent,target:CourseSceneTarget|null,licenseCase?:CourseDraftCase|null):CoursePreparationCommand|null{
 const v=p.features.course;if(!v||courseSceneContextReason(p,target))return null
 if(target&&courseTargetReason(v,target,context(p)))return null
 if(intent==='fund')return v.businesses.some(b=>b.lifecycle!=='closed')?null:coursePreparationCommand(p,{phase:'fund'},draft)
 if(!target)return null
 const business=v.businesses.find(b=>b.id===target.businessId);if(!business)return null
 if(intent==='outline'||intent==='activate')return coursePreparationCommand(p,{phase:intent,businessId:business.id},draft)
 const command=(kind:string,payload:Record<string,unknown>,label:string):CoursePreparationCommand=>({kind,payload,label,confirm:true})
 if(intent==='define'){
  const refs=draft.cases.filter(ref=>v.cases.some(c=>sameCase(c as CourseDraftCase,ref)))
  if(!draft.name.trim()||draft.name.trim().length>80||!v.catalog.products.some(c=>c.id===draft.productId)||!v.catalog.topics.some(c=>c.id===draft.topicId)||!segments.some(([id])=>id===draft.segment)||!draft.consent||refs.length!==draft.cases.length||refs.length<1||refs.length>3||new Set(refs.map(r=>r.kind+'|'+r.id)).size!==refs.length||draft.productId==='enterprise_training'&&refs.length<2)return null
  return command('DefineCourse',{businessId:business.id,name:draft.name.trim(),productId:draft.productId,topicId:draft.topicId,edition:'foundation',segment:draft.segment,cases:refs.map(r=>({...r})),consent:true},'核对案例，留下这门课的方案')
 }
 try{isoDate(draft.startAt);if(draft.startAt<p.view.date||draft.startAt>playableThrough)return null}catch{return null}
 if(draft.resources.length!==1||!v.resources.some(r=>r.id===draft.resources[0]))return null
 const assignment={resources:[...draft.resources],startAt:draft.startAt}
 if(intent==='license'){
  if(!licenseCase||!v.cases.some(c=>sameCase(c as CourseDraftCase,licenseCase)&&c.licensed))return null
  if(target.kind==='course'&&!v.courses.find(c=>c.id===target.courseId&&c.businessId===business.id)?.cases.some(ref=>sameCase(ref as CourseDraftCase,licenseCase)))return null
  if(target.kind==='license'&&!v.licenses.some(l=>l.id===target.licenseId&&l.caseId===licenseCase.id))return null
  if(v.licenses.some(l=>l.businessId===business.id&&l.caseId===licenseCase.id&&l.job&&['planned','running','completed'].includes(l.job.status)))return null
  return command('LicenseCourseMaterials',{businessId:business.id,caseKind:licenseCase.kind,caseId:licenseCase.id,...assignment},'核对这份案例的课程使用范围')
 }
 if(intent!=='sample'||target.kind!=='course')return null
 const c=v.courses.find(c=>c.id===target.courseId&&c.businessId===business.id)
 if(!c||target.sampleJobId!==undefined&&target.sampleJobId!==c.sampleJobId)return null
 return command('BuildCourseSample',{courseId:c.id,...assignment},'核对这门课的实际样课安排')
}
export function courseScheduleCaption(p:GamePanelProps,draft:CourseSceneDraft,intent:'sample'|'license',target:CourseSceneTarget|null):string{
 const c=target?.kind==='course'?p.features.course?.courses.find(c=>c.id===target.courseId&&c.businessId===target.businessId):undefined
 const job=COURSE_JOBS.find(j=>j.id===(intent==='license'?'course-material-license':c?`course-sample-${c.productId}-${c.topicId}`:''))
 if(!job)return '请先明确选择课程，再核对本次制作投入。'
 let completion:string|null=null
 try{isoDate(draft.startAt);if(draft.startAt>=p.view.date)completion=addDays(draft.startAt,job.durationDays)}catch{/* The draft stays unchanged until explicitly corrected. */}
 return `${intent==='license'?'本次课程使用范围':'本次样课'}直接成本${moneyText(job.costFen)} · ${job.actionPoints}点 · ${job.durationDays}日。${completion?'预计'+completion+'完成；预计不等于实际完成。':'请选择有效开工日，再看预计完成日期。'}${intent==='sample'?'工具资格须覆盖每一天制作；样课完成不等于招生或学费收入。':'需要实际完成后，才能用于这间教室的样课；本单素材授权不会自动延伸。'}`
}
export function CourseSceneRecord({p,target}:{p:GamePanelProps;target:CourseSceneTarget}){
 const v=p.features.course,progress=courseSceneProgress(v,p.view.date,target,context(p))
 if(!v||!progress)return <p>这份教学准备暂不可达，请重新选择。</p>
 const b=v.businesses.find(b=>b.id===target.businessId),c=target.kind==='course'?v.courses.find(c=>c.id===target.courseId&&c.businessId===target.businessId):undefined
 const job=target.kind==='outline'?v.outlines.find(o=>o.id===target.outlineId)?.job:target.kind==='license'?v.licenses.find(l=>l.id===target.licenseId)?.job:target.kind==='course'?p.view.operations?.jobs.find(j=>j.id===(target.sampleJobId??c?.sampleJobId)):undefined
 const jobDefinition=job?COURSE_JOBS.find(definition=>definition.id===job.definitionId):undefined
 return <section className="course-record-leaf"><h3>{c?.name??'这间教室的教学准备'}</h3><p>{progress.title}</p><p>{progress.line}</p><p className="course-paper-terms">{progress.choice.line}</p>{job?<p>{job.status==='planned'?'已预留，尚未开工':job.status==='running'?'正在准备，尚未完成':job.status==='completed'?'已实际完成':'这次安排已停下'} · {job.startAt}—{job.completeAt}。{job.status==='planned'?'开工前按原安排预留，尚未实际付款或使用行动。':'已经实际发生的成本与行动照原账保留。'}</p>:null}{job&&jobDefinition?<p className="course-paper-terms">{job.status==='planned'?`本任务已预留直接投入${moneyText(jobDefinition.costFen)} · ${jobDefinition.actionPoints}点，尚未开工。`:job.status==='running'||job.status==='completed'?`本任务直接成本${moneyText(jobDefinition.costFen)} · ${jobDefinition.actionPoints}点；工资与维护另按实际日期发生。`:`这次安排约定直接投入${moneyText(jobDefinition.costFen)} · ${jobDefinition.actionPoints}点；已耗成本与未执行预留的释放分别见资金记录。`}</p>:null}{c?<><p>{v.catalog.products.find(product=>product.id===c.productId)?.label} · {v.catalog.topics.find(topic=>topic.id===c.topicId)?.label} · {c.cases.length}份已付案例。</p>{c.cases.map((ref,index)=>{const info=v.cases.find(r=>sameCase(r as CourseDraftCase,ref as CourseDraftCase));return <p key={ref.kind+ref.id}>案例{index+1} · {info?.label??'案例记录待核对'} · {info?.licensed?v.licenses.some(l=>l.businessId===c.businessId&&l.caseId===ref.id&&l.job?.status==='completed')?'本教室课程使用范围已实际完成':'本教室课程使用范围仍待实际完成':'自行保留来源与匿名化说明'}。</p>})}</>:null}{b?<p>本教室可花{moneyText(b.funds.availableFen)}；启用后的每月¥100维护按实际在营日结算，未来学费不支付当前制作。</p>:null}{progress.historical?<p className="course-paper-warning">正在翻看这门课较早的一次样课尝试；这里不安排新的样课。</p>:null}{progress.phase==='course-ready'?<p className="course-paper-receipt">{c&&v.cohorts.some(co=>co.courseId===c.id)?'样课记录已实际完成；已有班期的教学、支持与退款责任仍继续保留。':'样课已经实际准备好，尚未招生。获客、价格、班额和支持仍需另外决定。'}</p>:null}</section>
}
function ScheduleFields({p,draft,setDraft}:{p:GamePanelProps;draft:CourseSceneDraft;setDraft:(draft:CourseSceneDraft)=>void}){
 const v=p.features.course,selected=draft.resources.length===1?draft.resources[0]:''
 return <div className="course-schedule-fields"><div><label className="field">这次由谁实际准备<select value={selected} onChange={e=>setDraft({...draft,resources:e.target.value?[e.target.value]:[]})}><option value="">请明确选择本人或已有员工</option>{v?.resources.map(r=><option key={r.id} value={r.id}>{r.id==='player-production'?'由我自己准备':courseResourceLabel(r.id,v.resources,p.view.operations?.workers)}</option>)}</select></label>{selected&&!v?.resources.some(r=>r.id===selected)?<p className="course-paper-warning">之前选择的资源现不可用，请重新选择。</p>:null}</div><div><label className="field">从哪一天开始<input type="date" value={draft.startAt} min={p.view.date} max={playableThrough} onChange={e=>setDraft({...draft,startAt:e.target.value})}/></label><button type="button" className="course-paper-direction" onClick={()=>setDraft({...draft,startAt:p.view.date})}>明确从今天 {p.view.date} 开始</button>{draft.startAt&&draft.startAt<p.view.date?<p className="course-paper-warning">草稿里的开工日已经过去，请重新选择日期。</p>:null}</div></div>
}
export function CourseSceneChoice({p,target,onTarget,onInspect,onToday,onLife,onToolAccount,blockedReason,children}:Props){
 const source=JSON.stringify(target),controlled=onTarget!==undefined
 const [,refreshTarget]=useState(0),binding=useRef({source,controlled,value:target})
 if(binding.current.source!==source||binding.current.controlled!==controlled)binding.current={source,controlled,value:target}
 const current=controlled?target:binding.current.value
 const [open,setOpen]=useState(false),[page,setPage]=useState<Page>('objects'),[pick,setPick]=useState<CourseSceneTarget|null>(null),[licenseCase,setLicenseCase]=useState<CourseDraftCase|null>(null),[fullObjects,setFullObjects]=useState(false)
 const openedRevision=useRef(p.view.revision),name=useId(),v=p.features.course,progress=courseSceneProgress(v,p.view.date,current,context(p)),hasOpenStudio=v?.businesses.some(b=>b.lifecycle!=='closed')??false
 const business=v?.businesses.find(b=>b.id===current?.businessId),course=current?.kind==='course'?v?.courses.find(c=>c.id===current.courseId&&c.businessId===current.businessId):undefined
 const slot=page==='fund'?'entry':page==='outline'||page==='activate'?'outline':page==='license'&&licenseCase?`license:${licenseCase.kind}:${licenseCase.id}` as const:page==='sample'?'sample':'definition'
 const [draft,setDraft]=useCourseSceneDraft(p.view.runId,{accountId:p.accountId,businessId:current?.businessId??null,courseId:slot==='sample'&&current?.kind==='course'?current.courseId:null,slot},p.courseDraftMemory)
 const edit=(patch:Partial<CourseSceneDraft>)=>setDraft(old=>({...old,...patch}))
 const contextReason=courseSceneContextReason(p,current),lock=courseSceneSubmissionLock(p,blockedReason)??contextReason??progress?.invalidReason??null,bookmarkLock=courseSceneBookmarkLock(p,blockedReason)
 const directPreparation=!contextReason&&!progress?.invalidReason&&courseStudioPreparationPage(p,current,page)
 const lessonPreparation=!contextReason&&!progress?.invalidReason&&courseLessonPreparationPage(p,current,page)
 const lessonKey=JSON.stringify([p.view.runId,p.accountId,current?.businessId]),[lessonLeaf,setLessonLeaf]=useState<{key:string;value:'form'|'content'|'promise'}|null>(null),definitionLeaf=lessonLeaf?.key===lessonKey?lessonLeaf.value:'form'
 const [caseLeaf,setCaseLeaf]=useState<{key:string;value:number}|null>(null),casePages=Math.max(1,Math.ceil((v?.cases.length??0)/2)),casePage=caseLeaf?.key===lessonKey?Math.min(Math.max(0,caseLeaf.value),casePages-1):0
 const originalCases=v?.cases.map((ref,index)=>({ref,index}))??[],visibleCases=lessonPreparation?originalCases.slice(casePage*2,casePage*2+2):originalCases
 const definitionProductReady=v?.catalog.products.some(product=>product.id===draft.productId)??false
 const definitionContentReady=definitionProductReady&&draft.name.trim().length>0&&draft.name.trim().length<=80&&(v?.catalog.topics.some(topic=>topic.id===draft.topicId)??false)
 useEffect(()=>{if(blockedReason||p.view.hasCandidate||p.view.saveStatus==='conflict'||open&&p.view.revision!==openedRevision.current&&p.view.saveStatus==='saved')setOpen(false)},[blockedReason,p.view.hasCandidate,p.view.saveStatus,p.view.revision,open])
 const choose=(next:CourseSceneTarget|null)=>{if(courseSceneBookmarkLock(p,blockedReason))return false;binding.current.value=next;refreshTarget(value=>value+1);onTarget?.(next);return true}
 const inferredPage=():Page=>!current||contextReason||progress?.invalidReason?'objects':progress?.phase==='course-outline-needed'?'outline':progress?.phase==='course-activate'?'activate':progress?.phase==='course-define'?'cases':progress?.phase==='course-draft'?'sample':progress?.phase==='course-ready'||progress?.outcome==='non-success'||course?.status==='ready'&&progress?.phase==='course-paused'?'next':'record'
 const activate=(intent?:PreparationIntent)=>{if(blockedReason)return;openedRevision.current=p.view.revision;setPick(null);setFullObjects(false);if(!intent&&!contextReason&&!progress?.invalidReason&&!progress?.historical&&current?.kind==='course'&&course&&progress?.phase==='course-rights-required'&&missingLicense.length===1){const ref=missingLicense[0]!;setLicenseCase({kind:ref.kind as CourseDraftCase['kind'],id:ref.id});setPage('license');setOpen(true);return}setPage(contextReason||progress?.invalidReason||intent==='fund'&&hasOpenStudio?'objects':intent==='define'?'cases':intent==='license'?'record':intent??inferredPage());setOpen(true)}
 const request:GamePanelProps['request']=(kind,payload,label,confirm)=>{if(courseSceneSubmissionLock(p,blockedReason)||courseSceneContextReason(p,current)||current&&courseTargetReason(p.features.course,current,context(p)))return;p.request(kind,payload,label,confirm)}
 const submit=(command:CoursePreparationCommand)=>lock?<button type="button" disabled>{command.label}</button>:<CommandButton {...p} {...command} request={request} primary reasonText={courseSceneReasonText}/>
 const inspect=()=>{setOpen(false);onInspect?.(current,['fund','outline','activate','cases','definition','license','sample'].includes(page)?slot:undefined)}
 const intent=page==='definition'?'define':page==='fund'||page==='outline'||page==='activate'||page==='sample'||page==='license'?page:'record'
 const command=courseDraftCommand(p,draft,intent,current,licenseCase)
 const prep:CoursePreparationStep={phase:page==='fund'?'fund':page==='activate'?'activate':'outline',...(current?{businessId:current.businessId}:{})}
 const wait=progress?.wait,safeWait=wait&&p.features.workbench.pause===null&&!p.features.workbench.progression.requiresDelivery?playableAdvanceDate(p.features.workbench,p.view.date,wait.date):null
 const job=current?.kind==='outline'?v?.outlines.find(o=>o.id===current.outlineId)?.job:current?.kind==='license'?v?.licenses.find(l=>l.id===current.licenseId)?.job:current?.kind==='course'?p.view.operations?.jobs.find(j=>j.id===(current.sampleJobId??course?.sampleJobId)):undefined
 const records:CourseSceneTarget[]=v?[...v.businesses.map(b=>({kind:'studio' as const,businessId:b.id})),...v.outlines.map(o=>({kind:'outline' as const,businessId:o.businessId,outlineId:o.id})),...v.licenses.map(l=>({kind:'license' as const,businessId:l.businessId,licenseId:l.id})),...v.courses.map(c=>({kind:'course' as const,businessId:c.businessId,courseId:c.id,...(c.sampleJobId?{sampleJobId:c.sampleJobId}:{})}))]:[]
 const objectReading=page==='objects'&&!contextReason?courseObjectReading(p,current):null,directObjects=objectReading!==null&&!fullObjects
 const selectionContext=JSON.stringify([p.view.runId,p.accountId,current,page,open,fullObjects]),selectionOwner=useRef<{key:string;view:GamePanelProps['view'];owner:GamePanelProps['controller'];onTarget:typeof onTarget}|null>(null)
 if(!selectionOwner.current||selectionOwner.current.key!==selectionContext||selectionOwner.current.view!==p.view||selectionOwner.current.owner!==p.controller||selectionOwner.current.onTarget!==onTarget)selectionOwner.current={key:selectionContext,view:p.view,owner:p.controller,onTarget}
 const selectionSource=selectionOwner.current
 const selectObject=(next:CourseSceneTarget)=>{
  if(selectionOwner.current!==selectionSource||!open||page!=='objects'||fullObjects||!objectReading||p.controller.snapshot.view!==p.view||courseSceneBookmarkLock(p,blockedReason)||courseTargetReason(v,next,context(p))||!objectReading.entries.some(e=>e.key===JSON.stringify(next)))return
  if(choose(next))setOpen(false)
 }
 const selectedCases=course?.cases??draft.cases,missingLicense=selectedCases.filter(ref=>v?.cases.some(info=>sameCase(info as CourseDraftCase,ref as CourseDraftCase)&&info.licensed)&&!v?.licenses.some(l=>l.businessId===business?.id&&l.caseId===ref.id&&l.job&&['planned','running','completed'].includes(l.job.status)))
 const activeLicenses=v?.licenses.filter(l=>l.businessId===business?.id&&selectedCases.some(ref=>ref.id===l.caseId)&&l.job&&['planned','running'].includes(l.job.status))??[]
 let primary:ReactNode=null
 if(page==='objects')primary=<button type="button" className="primary" disabled={!pick||bookmarkLock!==null} onClick={()=>{if(pick&&choose(pick)){setPage('record')}}}>明确翻看这一份</button>
 else if(page==='cases')primary=<button type="button" className="primary" disabled={!draft.cases.length||draft.cases.length>3} onClick={()=>setPage('definition')}>带着这些经历，想清这堂课 →</button>
 else if(page==='definition'&&lessonPreparation&&definitionLeaf==='form')primary=<button type="button" className="primary" disabled={!definitionProductReady} onClick={()=>setLessonLeaf({key:lessonKey,value:'content'})}>给这堂课起个名字 →</button>
 else if(page==='definition'&&lessonPreparation&&definitionLeaf==='content')primary=<button type="button" className="primary" disabled={!definitionContentReady} onClick={()=>setLessonLeaf({key:lessonKey,value:'promise'})}>接着，想清谁会来听 →</button>
 else if(command)primary=submit(command)
 else if(page==='record'&&!lock&&progress?.command)primary=submit({...progress.command,label:progress.choice.label})
 else if(page==='record'&&!lock&&wait&&safeWait)primary=<ClockAdvance p={{...p,request}} date={safeWait} label={(safeWait===wait.date?wait.label:'先到日历上的下一处反馈')+' · '+safeWait}/>
 else if(['fund','outline','activate','definition','license','sample'].includes(page))primary=<button type="button" disabled>先明确本页条件，再核对承诺</button>
 const title=page==='next'?'这一份准备之后，怎样继续？':page==='objects'?directObjects?'这间教室，想翻回哪一段？':'翻回这次想准备的那一堂课':page==='fund'?'给这间教室，留一笔自己的钱':page==='outline'?'把做过的事，认真写成大纲':page==='activate'?'准备已经留下，要启用这间教室吗？':page==='cases'?'想把哪一段真实经历教给别人？':page==='definition'?'这堂课，想让谁学会什么？':page==='license'?'这份案例，能用于这一堂课吗？':page==='sample'?'给这一堂课，做一份真正的样课':'这份教案，与已经付出的日子'
 const footer=<div className="course-choice-footer">{directObjects?null:primary}{page==='record'&&job&&['planned','running'].includes(job.status)?submit({kind:'InterruptJob',payload:{jobId:job.id},label:'核对停止这次准备，保留已耗成本',confirm:true}):null}<button type="button" onClick={()=>setOpen(false)}>先合上，保留草稿</button>{directObjects?<button type="button" className="course-record-link" onClick={()=>setFullObjects(true)}>翻选全部教室与原记录 ↗</button>:objectReading&&fullObjects?<button type="button" className="course-record-link" onClick={()=>setFullObjects(false)}>回到这间教室的经历 ↗</button>:null}{page!=='objects'?<button type="button" className="course-record-link" onClick={()=>{setPick(null);setPage('objects')}}>翻选另一份教案 ↗</button>:null}{onInspect?<button type="button" className="course-record-link" onClick={inspect}>翻看课程、资金与全部责任 ↗</button>:null}</div>
 // Keep the preparation hooks stable when an actual saved sample becomes ready.
 // Teaching owns its own children and drafts; the supplied object is never replaced here.
 const teaching=current?.kind==='audience'||current?.kind==='cohort'||current?.kind==='course'&&course?.status==='ready'&&(progress?.phase==='course-update-required'||progress?.phase.startsWith('course-refresh'))&&!progress?.historical
 if(teaching)return <CourseTeachingChoice p={p} target={current} onTarget={choose} blockedReason={blockedReason??null} {...(onToday?{onToday}:{})} {...(onLife?{onLife}:{})} {...(onInspect?{onInspect:(next:CourseSceneTarget|null,teachingSlot?:CourseTeachingDraftSlot)=>onInspect(next,undefined,teachingSlot)}:{})} {...(children?{children:(open:(intent?:CourseTeachingIntent)=>void)=>children(intent=>open(intent==='objects'?'targets':intent==='record'||intent==='next'||intent==='plan'||intent==='current-class'?intent:undefined))}:{})}/>
 const dispatch=(openTeaching?:((intent?:CourseTeachingIntent)=>void))=>(intent?:CourseChoiceIntent)=>{
  if(intent!=='audience'){activate(intent==='current-class'||intent==='plan'?'record':intent);return}
  if(blockedReason||courseSceneBookmarkLock(p,blockedReason))return
  if(openTeaching&&current?.kind==='course'&&course?.status==='ready'&&progress?.phase==='course-ready'&&!progress.historical&&!contextReason&&!progress.invalidReason){setOpen(false);openTeaching('audience');return}
  activate('record')
 }
 const render=(openTeaching?:((intent?:CourseTeachingIntent)=>void))=><>{children?children(dispatch(openTeaching)):<button type="button" onClick={()=>activate()}>走近这份教案 ↗</button>}{open&&page!=='tool'?<Dialog title={title} className={'opening-paper course-choice-paper'+(directObjects?' course-object-paper':'')+(directPreparation||lessonPreparation?' course-studio-preparation':'')+(lessonPreparation?' course-lesson-preparation':'')} layout={directObjects||directPreparation||lessonPreparation?'direct':'book'} onClose={()=>setOpen(false)} footer={footer}><p className="course-paper-kicker">{p.view.date} · {directPreparation&&page==='fund'?'自有资本 · 尚未转入':business?'这间教室 · '+(lifecycleText[business.lifecycle]??'状态待核对'):'尚未选择教室'}{course?' · '+course.name:''}{lessonPreparation?<span className="course-lesson-leaf"> · {page==='cases'?'从亲历说起':page==='definition'?definitionLeaf==='form'?'怎样教':definitionLeaf==='content'?'想教会什么':'谁会来听':page==='license'?'案例使用范围':'制作样课'}</span>:null}</p>{lock?<p role="status" className="course-paper-warning">{lock}</p>:null}
  {page==='next'&&current?<><h3>{course?.name??'这间教室的教学准备'}</h3><p>{progress?.line}</p><p>{progress?.choice.line}</p>{business?<p>本教室可花{moneyText(business.funds.availableFen)}；维护、旧班与已发生费用仍按原日期和记录继续。</p>:null}{business&&(business.funds.payableFen>0||business.funds.prepaidLiabilityFen>0||business.funds.protectionShortfallFen>0||business.funds.commitmentShortfallFen>0)?<p className="course-paper-warning">尚未履约保护款{moneyText(business.funds.prepaidLiabilityFen)} · 未结应付{moneyText(business.funds.payableFen)}。原资金缺口和承诺须先在原账与日历处理，回到今天不会清除。</p>:null}<div className="course-paper-directions">
   {progress?.phase==='course-ready'&&openTeaching?<button type="button" disabled={bookmarkLock!==null} onClick={()=>{setOpen(false);openTeaching('audience')}}>先看看谁会需要这一堂课<small>只打开原受众与报价选择，不自动推广、开班或收款。</small></button>:null}
   {course&&['draft','building'].includes(course.status)&&progress?.outcome==='non-success'&&!progress.historical?<button type="button" disabled={bookmarkLock!==null} onClick={()=>setPage('sample')}>重新核对这份样课的资源与日期<small>已耗成本与原尝试保留，新样课仍须新的真实投入。</small></button>:null}
   {current.kind==='license'&&progress?.outcome==='non-success'&&!progress.historical&&v?.cases.some(ref=>ref.id===v.licenses.find(l=>l.id===current.licenseId)?.caseId)?<button type="button" disabled={bookmarkLock!==null} onClick={()=>{const license=v?.licenses.find(l=>l.id===current.licenseId),ref=v?.cases.find(c=>c.id===license?.caseId);if(ref){setLicenseCase({kind:ref.kind as CourseDraftCase['kind'],id:ref.id});setPage('license')}}}>重新核对这份案例的课程使用范围<small>保留原停止记录与已耗成本；重新选择资源、日期，再确认新的投入。</small></button>:null}
   {business?.lifecycle==='preparing'?<button type="button" disabled={bookmarkLock!==null} onClick={()=>{if(choose({kind:'studio',businessId:business.id}))setPage('outline')}}>回到这间教室的大纲准备<small>重新核对执笔人、日期和原准备条件，不自动开工。</small></button>:null}
   {business?.lifecycle==='operating'?<details><summary>还有别的教学准备与经营选择</summary><button type="button" disabled={bookmarkLock!==null} onClick={()=>{if(choose({kind:'studio',businessId:business.id}))setPage('cases')}}>为这间教室构思另一堂课<small>原教案保留；重新核对案例、名称与范围，不自动定义新课。</small></button>{submit({kind:'PauseBusiness',payload:{businessId:business.id},label:'核对暂停接新业务，保留旧约定',confirm:true})}</details>:null}
   {onToday?<button type="button" disabled={bookmarkLock!==null} onClick={()=>{setOpen(false);onToday()}}>先不新增安排，回到今天<small>这份教案、原书签与费用都保留。</small></button>:null}
   {onLife?<button type="button" disabled={bookmarkLock!==null} onClick={()=>{setOpen(false);onLife()}}>把余下的日子留给生活<small>只翻阅生活与相识的人，新的生活投入另行决定。</small></button>:null}
  </div><details><summary>翻阅这份准备的实际记录</summary><CourseSceneRecord p={p} target={current}/></details></>:null}
  {page==='objects'?directObjects&&objectReading?<CourseObjectChoices reading={objectReading} date={p.view.date} locked={bookmarkLock} onChoose={selectObject}/>:<><p>先明确一份已有教案，或准备自己的教室。只翻阅不会转账、开工或接下旧班。</p><fieldset className="course-paper-choices"><legend>选择要放到眼前的教学准备</legend>{records.map((record,index)=>{const c=record.kind==='course'?v?.courses.find(c=>c.id===record.courseId):null,b=v?.businesses.find(b=>b.id===record.businessId);return <label key={JSON.stringify(record)}><input type="radio" name={name+'object'} checked={JSON.stringify(pick)===JSON.stringify(record)} onChange={()=>setPick(record)}/><span>{c?.name??(record.kind==='studio'?'工作室':record.kind==='outline'?'教学大纲':'课程素材使用范围')+' '+(index+1)}<small>{b?.company?'独立企业账户':'经营分账'} · {b?lifecycleText[b.lifecycle]:'账户待核对'}{c?' · '+c.createdAt+'留下的方案':''}</small></span></label>})}</fieldset>{!records.length?<p>还没有课程工作室。实际已付的手工小单也可以成为案例，不必先经营视频。</p>:null}<button type="button" className="course-paper-direction" disabled={bookmarkLock!==null||hasOpenStudio||p.accountId!=='personal'||!p.view.accounts.some(a=>a.accountId==='personal')} onClick={()=>{if(choose(null))setPage('fund')}}>明确用个人自有资金准备新教室 →</button>{hasOpenStudio?<p>已有尚未关闭的课程工作室，请先明确选择它；若想另开一间，须先在完整记录里处理原收尾与旧责任。</p>:null}{p.accountId!=='personal'?<p>准备新教室请先切回个人账户；已有教室可在上方明确选择。</p>:null}</>:null}
  {page==='fund'||page==='outline'||page==='activate'?<CoursePreparationFields p={p} step={prep} draft={draft} setDraft={setDraft}/>:null}
  {page==='cases'?<><p>选1—3份已经实际付款的案例；企业内训至少两份。手工经验能成为起点，AI教学还须另做样课、核对工具资格。</p><fieldset className="course-paper-choices"><legend>把真正做过的事，留进这一堂课</legend>{visibleCases.map(({ref,index})=><label key={ref.kind+ref.id}><input type="checkbox" checked={draft.cases.some(r=>sameCase(r,ref as CourseDraftCase))} onChange={e=>edit({cases:e.target.checked?[...draft.cases,{kind:ref.kind as CourseDraftCase['kind'],id:ref.id}]:draft.cases.filter(r=>!sameCase(r,ref as CourseDraftCase))})}/><span>案例 {index+1} · {ref.label}<small>{ref.licensed?'本单授权素材还需这间教室独立取得课程使用范围。':'保留来源，使用匿名化说明。'}</small></span></label>)}</fieldset>{lessonPreparation?<nav className="course-case-leaves" aria-label="翻选全部真实案例"><button type="button" disabled={casePage===0} onClick={()=>setCaseLeaf({key:lessonKey,value:casePage-1})}>← 前两份</button><span>已选{draft.cases.length}份 · {casePage+1}/{casePages}</span><button type="button" disabled={casePage+1>=casePages} onClick={()=>setCaseLeaf({key:lessonKey,value:casePage+1})}>后两份 →</button></nav>:null}{!v?.cases.length?<p className="course-paper-warning">还没有已付案例。先完成手工小单或视频商单的验收、付款与费用，再回来准备。</p>:null}{draft.cases.length>3?<p className="course-paper-warning">本方案最多选择三份案例，请明确留下哪些经历。</p>:null}</>:null}
  {page==='definition'&&lessonPreparation&&definitionLeaf==='form'?<><p>先比较怎样教；样课要亲手做完，招生与教学承诺仍另定。</p><fieldset className="course-paper-choices course-product-picks"><legend>你想怎样把经验讲明白？</legend>{v?.catalog.products.map(product=>{const sample=COURSE_JOBS.find(job=>job.id.startsWith('course-sample-'+product.id+'-'));return <label key={product.id}><input type="radio" name={name+'product'} checked={draft.productId===product.id} onChange={()=>edit({productId:product.id})}/><span>{product.label}<small>{sample?`样课${moneyText(sample.costFen)} · ${sample.actionPoints}点 · ${sample.durationDays}日`:'样课投入仍须原确认'}{product.id==='enterprise_training'?' · 至少两份案例':''}</small></span></label>})}</fieldset><button type="button" className="course-paper-direction" onClick={()=>setPage('cases')}>返回调整案例 →</button></>:null}
  {page==='definition'&&lessonPreparation&&definitionLeaf==='content'?<><p>{v?.catalog.products.find(product=>product.id===draft.productId)?.label} · 先说清楚，想教会别人什么。</p><div className="course-definition-content"><label className="field">这堂课的名字<input value={draft.name} maxLength={80} onChange={e=>edit({name:e.target.value})}/></label><label className="field">教哪种工具方法<select value={draft.topicId} onChange={e=>edit({topicId:e.target.value})}><option value="">请明确选择工具主题</option>{v?.catalog.topics.map(topic=><option key={topic.id} value={topic.id}>{topic.label}</option>)}</select></label></div><button type="button" className="course-paper-direction" onClick={()=>setLessonLeaf({key:lessonKey,value:'form'})}>返回比较课程形式 →</button></>:null}
  {page==='definition'&&lessonPreparation&&definitionLeaf==='promise'?<><label className="field">想回应谁的需要<select value={draft.segment} onChange={e=>edit({segment:e.target.value})}><option value="">请明确选择受众</option>{segments.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><p>已选{draft.cases.length}份实际已付案例。这里只留下方案，不招学生、不收学费；样课投入另行确认。</p>{draft.productId==='enterprise_training'&&draft.cases.length<2?<p className="course-paper-warning">企业内训需要至少两份案例，请返回补选。</p>:null}<label className="course-paper-check"><input type="checkbox" checked={draft.consent} onChange={e=>edit({consent:e.target.checked})}/>只使用有权使用的案例与匿名化说明，不编造客户或教学资历</label><div className="course-definition-return"><button type="button" className="course-paper-direction" onClick={()=>setLessonLeaf({key:lessonKey,value:'content'})}>返回调整课名与主题 →</button><button type="button" className="course-paper-direction" onClick={()=>setPage('cases')}>返回调整案例 →</button></div></>:null}
  {page==='definition'&&!lessonPreparation?<><label className="field">这堂课的名字<input value={draft.name} maxLength={80} onChange={e=>edit({name:e.target.value})}/></label><div className="course-definition-fields"><label className="field">用什么形式教<select value={draft.productId} onChange={e=>edit({productId:e.target.value})}><option value="">请明确选择课程形式</option>{v?.catalog.products.map(product=><option key={product.id} value={product.id}>{product.label}</option>)}</select></label><label className="field">教哪种工具方法<select value={draft.topicId} onChange={e=>edit({topicId:e.target.value})}><option value="">请明确选择工具主题</option>{v?.catalog.topics.map(topic=><option key={topic.id} value={topic.id}>{topic.label}</option>)}</select></label><label className="field">想回应谁的需要<select value={draft.segment} onChange={e=>edit({segment:e.target.value})}><option value="">请明确选择受众</option>{segments.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div><p>已选{draft.cases.length}份实际已付案例。这里只留下方案，不招学生、不收学费；样课投入另行确认。</p>{draft.productId==='enterprise_training'&&draft.cases.length<2?<p className="course-paper-warning">企业内训需要至少两份案例，请返回补选。</p>:null}<label className="course-paper-check"><input type="checkbox" checked={draft.consent} onChange={e=>edit({consent:e.target.checked})}/>只使用有权使用的案例与匿名化说明，不编造客户或教学资历</label><button type="button" className="course-paper-direction" onClick={()=>setPage('cases')}>返回调整案例 →</button></>:null}
  {page==='license'||page==='sample'?<><p className="course-paper-terms">{courseScheduleCaption(p,draft,page,current)}</p>{page==='license'?<p>{licenseCase&&selectedCases.some(ref=>sameCase(ref as CourseDraftCase,licenseCase))?'案例'+(selectedCases.findIndex(ref=>sameCase(ref as CourseDraftCase,licenseCase))+1)+' · ':'眼前的案例 · '}{v?.cases.find(ref=>licenseCase&&sameCase(ref as CourseDraftCase,licenseCase))?.label??'请重新核对案例来源'}。只为这间教室准备课程使用范围，不会自动授权给其他课程业务。</p>:null}<ScheduleFields p={p} draft={draft} setDraft={setDraft}/><p>由这间教室承担费用；未来学费不能支付今天的制作。共享四点、资源冲突与每一天工具资格仍会在确认时核对。</p></>:null}
  {page==='record'&&current?<><CourseSceneRecord p={p} target={current}/>{courseLessonPreparationPage(p,current,'tool')?<button type="button" className="course-paper-direction" onClick={()=>setPage('tool')}>翻看这堂课的图像工具准备与原回信 →</button>:null}{!progress?.invalidReason&&!contextReason&&!progress?.historical?<div className="course-paper-directions">{business?.lifecycle==='preparing'&&!progress?.wait&&!progress?.command?<button type="button" onClick={()=>setPage('outline')}>另选执笔人与日期，安排大纲</button>:null}{business?.lifecycle==='operating'&&current.kind==='studio'?<button type="button" onClick={()=>setPage('cases')}>从真实案例构思这一堂新课</button>:null}{activeLicenses.map(l=><button type="button" key={l.id} onClick={()=>{if(choose({kind:'license',businessId:l.businessId,licenseId:l.id}))setPage('record')}}>翻看这份已经安排的课程使用范围<small>{l.job?.startAt}—{l.job?.completeAt} · 尚未实际完成，不重复付费安排。</small></button>)}{missingLicense.map(ref=><button type="button" key={ref.kind+ref.id} onClick={()=>{setLicenseCase({kind:ref.kind as CourseDraftCase['kind'],id:ref.id});setPage('license')}}>核对案例{selectedCases.findIndex(selected=>sameCase(selected as CourseDraftCase,ref as CourseDraftCase))+1}的课程使用范围<small>¥300 · 1点 · 7日，需实际完成。</small></button>)}{course&&(course.status==='draft'||course.status==='building'&&job&&['interrupted','cancelled'].includes(job.status))&&['course-draft','course-sample-interrupted','course-sample-cancelled','course-tool-required'].includes(progress?.phase??'')?<button type="button" onClick={()=>setPage('sample')}>明确选择这份样课的资源与日期<small>资格与材料仍需通过实际确认，不提前开工。</small></button>:null}{current.kind==='license'&&job?.status==='completed'?v?.courses.filter(c=>c.businessId===current.businessId&&c.cases.some(ref=>ref.id===v.licenses.find(l=>l.id===current.licenseId)?.caseId)).map(c=><button type="button" key={c.id} onClick={()=>{if(choose({kind:'course',businessId:c.businessId,courseId:c.id,...(c.sampleJobId?{sampleJobId:c.sampleJobId}:{})}))setPage('record')}}>带着这份使用范围，回到{c.name}</button>):null}{current.kind==='outline'&&job?.status==='completed'&&business?.lifecycle==='operating'?<button type="button" onClick={()=>{if(choose({kind:'studio',businessId:current.businessId}))setPage('cases')}}>带着这份大纲，构思一堂新课</button>:null}</div>:null}</>:null}
 </Dialog>:null}{current?.kind==='course'?<CourseImageToolChoice p={p} target={current} open={open&&page==='tool'} lock={lock} request={request} onClose={()=>setOpen(false)} {...(onToolAccount?{onAccount:()=>{setOpen(false);onToolAccount()}}:{})}/>:null}</>
 return current?.kind==='course'&&course?.status==='ready'&&!progress?.historical?<CourseTeachingChoice p={p} target={current} onTarget={choose} blockedReason={blockedReason??null} {...(onToday?{onToday}:{})} {...(onLife?{onLife}:{})} {...(onInspect?{onInspect:(next:CourseSceneTarget|null,teachingSlot?:CourseTeachingDraftSlot)=>onInspect(next,undefined,teachingSlot)}:{})}>{openTeaching=>render(openTeaching)}</CourseTeachingChoice>:render()
}
