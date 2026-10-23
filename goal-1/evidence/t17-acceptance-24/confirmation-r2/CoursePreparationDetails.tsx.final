import type {CommandEnvelope} from '../core/run-types.ts'
import type {CourseProjection} from '../core/course-projection.ts'
import type {WorkerInstance} from '../core/operations-types.ts'
import type {PlayingView} from './game-types.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {moneyText} from './game-text.ts'

type Props={command:CommandEnvelope;course:CourseProjection;workers?:readonly WorkerInstance[]|undefined;view?:PlayingView|undefined;accountName?:((id:string)=>string)|undefined}
const kinds=new Set(['DefineCourse','StartCourseOutline','LicenseCourseMaterials','BuildCourseSample','ActivateBusiness'])
const segments:Readonly<Record<string,string>>={ai_learners:'AI学习者',local_merchants:'本地商家',lifestyle:'生活方式受众'}
const unique=<T,>(rows:readonly T[],match:(row:T)=>boolean)=>{const found=rows.filter(match);return found.length===1?found[0]:undefined}
const record=(value:unknown):Record<string,unknown>|null=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null
const recheck=()=> <p className="warning-box">这次课程准备的对象或所选条件已不可核对，请返回重新选择。</p>

/** Captured confirmation facts only: no command, fee calculation or future result is produced here. */
export function CoursePreparationDetails({command,course,workers,view,accountName}:Props){
 if(!kinds.has(command.kind))return null
 const p=record(command.payload)
 if(command.kind==='ActivateBusiness'&&!course?.businesses.some(b=>b.id===p?.businessId)&&!view?.operations?.businesses.some(b=>b.id===p?.businessId&&b.route==='ai_course'))return null
 if(command.kind==='ActivateBusiness'&&p&&view){
  const original=unique(view.operations?.businesses??[],b=>b.id===p.businessId)
  if(original&&original.route!=='ai_course')return null
 }
 if(!p||!course||!view||command.runId!==view.runId||command.expectedRevision!==view.revision||view.readOnly||view.hasCandidate)return recheck()
 const lesson=command.kind==='BuildCourseSample'&&typeof p.courseId==='string'?unique(course.courses,c=>c.id===p.courseId):undefined
 const businessId=lesson?.businessId??p.businessId
 if(typeof businessId!=='string')return recheck()
 const business=unique(course.businesses,b=>b.id===businessId),original=unique(view.operations?.businesses??[],b=>b.id===businessId)
 if(!business||!original||business.route!=='ai_course'||original.route!==business.route||business.definitionId!==original.definitionId||business.company!==original.company||business.accountId!==original.accountId||!unique(view.accounts,a=>a.accountId===business.accountId)||business.company&&business.accountId==='personal')return recheck()
 const account=accountName?.(business.accountId)??(business.company?'这间教室的企业账户':'这间教室的经营分账')
 const identity=<p>{account} · {business.history[0]?.date??'日期待核对'}筹备的课程工作室。</p>
 const paidCase=(ref:unknown)=>{
  const value=record(ref)
  if(!value||value.kind!=='first_order'&&value.kind!=='video'||typeof value.id!=='string')return undefined
  return unique(course.cases,c=>c.kind===value.kind&&c.id===value.id)
 }
 const rights=(ref:NonNullable<ReturnType<typeof paidCase>>)=>{
  if(!ref.licensed)return '本案例不需另办这项课程素材许可；仍须保留来源与匿名化说明。'
  const licenses=course.licenses.filter(l=>l.businessId===business.id&&l.caseId===ref.id&&l.job?.businessId===business.id&&l.job.definitionId==='course-material-license')
  if(licenses.some(l=>l.job?.status==='completed'))return '本单授权与课程使用范围分别记录；本工作室的课程使用范围已实际完成。'
  if(licenses.some(l=>l.job?.status==='planned'||l.job?.status==='running'))return '本单授权不直接授予课程使用范围；课程许可正在办理，尚未实际完成。'
  return '本单授权不直接授予课程使用范围；还须另行安排并实际完成本工作室的课程许可。'
 }
 if(command.kind==='ActivateBusiness')return <section className="confirmation-context course-preparation-terms"><h3>启用这间教室之后</h3>{identity}<p>大纲与营业准备沿现有记录复用。启用后按实际在营日期承担每月{moneyText(business.monthlyMaintenanceFen)}维护，工资与已有义务另计。</p><p>启用不等于样课完成，也不替你招生或确认学费收入。</p></section>
 if(command.kind==='DefineCourse'){
  const product=typeof p.productId==='string'?unique(course.catalog.products,item=>item.id===p.productId):undefined,topic=typeof p.topicId==='string'?unique(course.catalog.topics,item=>item.id===p.topicId):undefined
  const segment=typeof p.segment==='string'?segments[p.segment]:undefined,refs=Array.isArray(p.cases)?p.cases:[],cases=refs.map(paidCase)
  if(typeof p.name!=='string'||!p.name.trim()||p.name.trim().length>80||!product||!topic||!segment||p.edition!=='foundation'&&p.edition!=='advanced'||p.consent!==true||refs.length<1||refs.length>3||product.id==='enterprise_training'&&refs.length<2||cases.some(c=>!c)||new Set(cases.map(c=>c!.id)).size!==cases.length)return recheck()
  const predecessor=p.edition==='advanced'?unique(course.courses,c=>c.id===p.predecessorId):undefined
  const study=p.edition==='advanced'?unique(course.studies,s=>s.id===p.studyId&&s.predecessorId===predecessor?.id&&s.completedAt!==null):undefined
  if(p.edition==='advanced'&&(!predecessor||!study))return recheck()
  return <section className="confirmation-context course-preparation-terms"><h3>这次留下的课程方案</h3><p><strong>{p.name}</strong> · {product.label} · {topic.label} · 面向{segment} · {p.edition==='advanced'?'进阶课程':'基础课程'}。</p>{identity}{cases.map((ref,index)=>ref?<p key={ref.kind+ref.id}>案例{index+1} · {ref.label}。{rights(ref)}</p>:null)}{predecessor?<p>衔接「{predecessor.name}」与已经完成的新需求研究；维护修订不产生再次收费资格。</p>:null}<p>你已同意只使用有权使用的案例和匿名化说明，不编造客户或教学资历。本次只定义方案，不制作样课、不招生、不收学费。</p></section>
 }
 const ref=command.kind==='LicenseCourseMaterials'?paidCase({kind:p.caseKind,id:p.caseId}):undefined
 if(command.kind==='LicenseCourseMaterials'&&(!ref||!ref.licensed))return recheck()
 if(command.kind==='BuildCourseSample'&&(!lesson||!unique(course.catalog.products,c=>c.id===lesson.productId)||!unique(course.catalog.topics,c=>c.id===lesson.topicId)))return recheck()
 const refs=lesson?.cases.map(paidCase)??[]
 if(lesson&&(!refs.length||refs.some(c=>!c)))return recheck()
 const resources=p.resources
 if(!Array.isArray(resources)||resources.length!==1||typeof resources[0]!=='string')return recheck()
 const resource=resources[0]
 if(!unique(course.resources,r=>r.id===resource))return recheck()
 const resourceLabel=resource==='player-production'?command.kind==='StartCourseOutline'?'由我自己来写':command.kind==='BuildCourseSample'?'由我自己制作样课':'由我自己准备':courseResourceLabel(resource,course.resources,workers)
 const jobId=command.kind==='StartCourseOutline'?'course-outline':command.kind==='LicenseCourseMaterials'?'course-material-license':lesson?`course-sample-${lesson.productId}-${lesson.topicId}`:''
 const job=unique(COURSE_JOBS,item=>item.id===jobId)
 if(!job||typeof p.startAt!=='string')return recheck()
 let completeAt:string
 try{isoDate(p.startAt);if(p.startAt<view.date)return recheck();completeAt=addDays(p.startAt,job.durationDays)}catch{return recheck()}
 const title=command.kind==='StartCourseOutline'?'这次安排的教学大纲':command.kind==='LicenseCourseMaterials'?'这次安排的课程素材使用范围':'这次安排的实际样课'
 return <section className="confirmation-context course-preparation-terms"><h3>{title}</h3>{lesson?<p><strong>{lesson.name}</strong> · {course.catalog.products.find(item=>item.id===lesson.productId)!.label} · {course.catalog.topics.find(item=>item.id===lesson.topicId)!.label}。</p>:null}{identity}{ref?<p>本次素材案例 · {ref.label}。{rights(ref)}</p>:null}<p>{command.kind==='StartCourseOutline'?'执笔资源':'准备资源'}：{resourceLabel}。开工{p.startAt} → 预计{completeAt}完成（{job.durationDays}日）。</p>{refs.map((info,index)=>info?<p key={info.kind+info.id}>案例{index+1} · {info.label}。{rights(info)}</p>:null)}<p>预计日期不等于实际完成；资金与行动按上方本次确认预留或使用。{command.kind==='StartCourseOutline'?'大纲完成后，启用、案例与样课仍分别决定。':command.kind==='LicenseCourseMaterials'?'本次任务须实际完成才留下新的许可记录，既有许可仍保留。':'工具资格须覆盖每一天制作；样课完成不等于已经招生或取得学费收入。'}</p></section>
}
