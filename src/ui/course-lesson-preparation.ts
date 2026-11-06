import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {courseFocusFor,courseSceneContext,resolveCourseFocus} from './course-player-thread.ts'
import {courseSceneProgress,type CourseSceneTarget} from './course-scene-progress.ts'
import {addDays,quarterOf} from '../core/calendar.ts'
import type {ComponentProps} from 'react'
import type {SceneTimeNotice} from './SceneEcho.tsx'
import {COURSE_JOBS} from '../content/course.ts'

const stages=new Map([['course-draft','课程方案 · 样课尚未制作'],['course-tool-required','工具前提 · 仍待实际取得'],['course-rights-required','案例使用范围 · 仍待核对'],['course-license-planned','使用范围已安排 · 尚未开工'],['course-license-running','使用范围准备中 · 尚未完成'],['course-sample-planned','样课已安排 · 尚未开工'],['course-sample-running','样课制作中 · 尚未完成'],['course-sample-cancelled','这次样课已取消 · 原预留按原账释放'],['course-sample-interrupted','这次样课已中断 · 已耗成本与行动保留'],['course-sample-completed','这次样课已完成 · 原条件另核'],['course-ready','样课已完成 · 招生另行决定']])
/** A smaller reading surface; the original rules and actions remain the authority. */
export function courseLessonReading(p:GamePanelProps,thread:PlayerThreadView){
 const f=thread.focus,v=p.features.course,w=p.features.workbench
 if(p.view.phase!=='playing'||!v||f.kind!=='course'||f.accountId!==p.accountId||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const t=f.courseTarget,stageLabel=stages.get(thread.stage)
 if(!t||t.kind!=='course'||!stageLabel||p.view.accounts.filter(a=>a.accountId===p.accountId).length!==1)return null
 const b=v.businesses.find(b=>b.id===t.businessId),c=v.courses.find(c=>c.id===t.courseId&&c.businessId===t.businessId),progress=courseSceneProgress(v,p.view.date,t,courseSceneContext(p))
 if(!b||b.lifecycle!=='operating'||!c||!['draft','building','ready'].includes(c.status)||progress?.phase!==thread.stage||progress.historical)return null
 const image=p.features.video?.modes.find(mode=>mode.id==='image_assisted'),imageReady=!!image&&p.view.date>=image.from,apps=p.features.video?.applications.filter(a=>a.program==='image_rights')??[],latest=apps.at(-1),owners=latest?p.features.video?.channels.filter(channel=>channel.id===latest.channelId)??[]:[],owner=owners.length===1?owners[0]:undefined,unread=imageReady&&c.topicId==='image_workflows'&&['course-draft','course-tool-required'].includes(thread.stage)&&latest?.job?.status==='completed'&&!latest.resultRead,needs=imageReady&&thread.stage==='course-tool-required'&&c.topicId==='image_workflows'&&c.qualificationReasons.length===1&&c.qualificationReasons[0]==='MISSING_ENTITLEMENT:local_model_rights_and_hardware',tool=needs||unread
 const waiting=needs&&!!owner&&latest?.job?.definitionId==='video-apply-image_rights'&&['planned','running'].includes(latest.job.status)&&apps.filter(a=>a.job&&['planned','running'].includes(a.job.status)).length===1,toolWait=waiting&&latest?.job&&owner?{date:latest.job.status==='planned'?latest.job.startAt:latest.job.completeAt,label:latest.job.status==='planned'?'等图像工具准备实际开工':'等图像工具的真实回信',accountId:owner.accountId}:null,toolCommand=unread&&latest?.job?.definitionId==='video-apply-image_rights'&&owner&&apps.filter(a=>a.job?.status==='completed'&&!a.resultRead).length===1?{applicationId:latest.id,accountId:owner.accountId,label:'读'+owner.name+'的图像工具回信'}:null,grant=imageReady&&c.topicId==='image_workflows'&&thread.stage==='course-draft'&&c.qualificationReasons.length===0&&latest?.job?.status==='completed'&&latest.job.definitionId==='video-apply-image_rights'&&latest.resultRead&&latest.approved===true&&latest.expiresAt!==null&&p.view.date<latest.expiresAt,denied=needs&&latest?.job?.status==='completed'&&latest.job.definitionId==='video-apply-image_rights'&&latest.resultRead&&latest.approved===false,expired=needs&&latest?.resultRead&&latest.approved===true&&latest.expiresAt!==null&&p.view.date>=latest.expiresAt
 const paying=owner?.accountId==='personal'?'个人账户':owner?owner.name+'的账户':'原账号'
 return {title:unread?'先读工具回信，再准备样课。':waiting?latest?.job?.status==='planned'?'图像工具已排进日历。':'图像工具准备中，先等回信。':grant?'图像工具已备好，接着做样课。':denied?'工具申请未获准，课程还在。':expired?'原工具条件已到期，课程还在。':tool?'先准备图像工具，再制作样课。':thread.title,
  line:unread?'有一份实际图像工具回信还没读过；课程方案和案例都在。':waiting?latest?.job?.status==='planned'?paying+'已安排原工具准备，尚未实际开工。':paying+'已承担图像准备直接费用¥1,000与原行动1点；样课尚未制作。':grant?'原图像工具回信已经读过，实际条件有效至'+latest?.expiresAt+'；这堂课的样课仍需亲手制作。':denied?'原申请已经读到未获准的结果，直接费用¥1,000和原1点不返还。':expired?'原有效日为'+latest?.expiresAt+'，新申请仍须重新显选；课程与案例保留。':tool?'课程方案已经留下，图像工具的使用条件还需实际取得。':thread.line,
  detail:unread?'阅读这份原回信不重新付款或延长有效期。':waiting&&latest?.job?'原准备'+latest.job.startAt+'—'+latest.job.completeAt+'；'+(latest.job.status==='planned'?'¥1,000及原开工季1点仍按原安排预留，尚未实付。':'工资与维护另按原日期发生。')+'实际结果要等回信，尚未制作样课。':denied&&latest?'原规则最早'+addDays(latest.appliedAt,90)+'可重新申请，仍须另一次投入。也可以先留下课程，安排工作与生活。':tool?'先选原创作账号、人手和日期。图像条件的原准备¥1,000 · 1点 · 7日，须实际等待并读审核回信；尚未制作样课。':thread.detail,
  stageLabel:unread?'原回信待阅读 · 尚未新增制作':waiting?latest?.job?.status==='planned'?'原图像准备已安排 · 尚未开工':'图像准备已开工 · 已承担¥1,000/1点':grant?'实际图像条件已备 · 样课尚未制作':denied?'原申请未获准 · 已耗费用与行动保留':expired?'原图像条件已到期 · 新申请另定':stageLabel,tool,toolWait,toolCommand}
}
export function courseLessonPreparationPage(p:GamePanelProps,target:CourseSceneTarget|null,page:string){
 const v=p.features.course
 if(p.view.phase!=='playing'||!v||!target||!['studio','outline','license','course'].includes(target.kind)||!['tool','cases','definition','license','sample'].includes(page)||p.view.date<v.catalog.availableAt||p.view.accounts.filter(a=>a.accountId===p.accountId).length!==1)return false
 if(page==='definition'&&v.catalog.products.length!==3||page==='sample'&&target.kind!=='course')return false
 if(page==='tool'&&(target.kind!=='course'||!v.courses.some(c=>c.id===target.courseId&&c.businessId===target.businessId&&c.topicId==='image_workflows')||!p.features.video?.modes.some(mode=>mode.id==='image_assisted'&&p.view.date>=mode.from)))return false
 const focus=courseFocusFor(p,target,p.accountId),progress=courseSceneProgress(v,p.view.date,target,courseSceneContext(p))
 return !resolveCourseFocus(p,focus).reason&&!progress?.invalidReason&&!progress?.historical&&v.businesses.some(b=>b.id===target.businessId&&b.accountId===p.accountId&&b.lifecycle==='operating')
}

/** An exact original future plan already names these dates; no notice, cost, or action is removed. */
export function courseSamplePlanCoversLine(p:GamePanelProps,thread:PlayerThreadView,notice:Pick<ComponentProps<typeof SceneTimeNotice>,'date'|'text'|'brief'|'frame'>,line:string){
 const reading=courseLessonReading(p,thread),v=p.features.course,f=thread.focus,last=p.view.receipts.at(-1),frame=notice.frame
 if(!reading||!v||f.kind!=='course'||f.courseTarget?.kind!=='course'||thread.stage!=='course-sample-planned'||thread.focusScope!=='current'||p.view.busy||p.view.readOnly||p.view.hasCandidate||p.view.saveStatus!=='saved'||last?.kind!=='BuildCourseSample'||last.revisionAfter!==p.view.revision||notice.date!==p.view.date||!frame)return false
 const target=f.courseTarget,lessons=v.courses.filter(c=>c.id===target.courseId&&c.businessId===target.businessId),c=lessons[0],job=c?.job,b=c?v.businesses.find(b=>b.id===c.businessId):undefined,definition=job?COURSE_JOBS.find(d=>d.id===job.definitionId):undefined
 if(lessons.length!==1||!c||!b||!job||!definition||job.id!==c.sampleJobId||job.status!=='planned'||job.definitionId!==`course-sample-${c.productId}-${c.topicId}`||job.businessId!==c.businessId||quarterOf(job.startAt)<=quarterOf(p.view.date)||b.accountId!==f.accountId)return false
 if(v.courses.filter(other=>other.name===c.name&&other.job?.startAt===job.startAt&&other.job.completeAt===job.completeAt).length!==1)return false
 const brief=`「${c.name}」的这次样课${job.startAt}—${job.completeAt}，已安排，尚未开工；资金与行动按原预留。`,original=brief+'制作、完成和招生分别记录，尚未产生学费收入。',expected=`${c.name} · ${job.startAt}—${job.completeAt}。`
 if(line!==expected||thread.line!==expected||notice.text!==original||notice.brief!==undefined&&notice.brief!==brief)return false
 const accounts=p.view.accounts.filter(a=>a.accountId===b.accountId),rows=frame.accounts.filter(a=>a.id===b.accountId),a=rows[0]
 return accounts.length===1&&rows.length===1&&!!a&&a.before!==null&&a.before-a.after===definition.costFen&&a.after===accounts[0]!.availableFen&&frame.accounts.every(row=>row.id===b.accountId||row.before===row.after)&&!frame.quarterChanged&&frame.dateBefore===p.view.date&&frame.dateAfter===p.view.date&&frame.pointsBefore===frame.pointsAfter&&frame.pointsAfter===p.view.budget.available&&frame.reservedBefore===frame.reservedAfter&&frame.reservedAfter===p.view.budget.reserved&&frame.spentBefore===frame.spentAfter&&frame.spentAfter===p.view.budget.spent
}
