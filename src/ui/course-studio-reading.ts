import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {courseFocusFor,courseSceneContext,resolveCourseFocus} from './course-player-thread.ts'
import {courseSceneProgress,type CourseSceneTarget} from './course-scene-progress.ts'

export interface CourseStudioReading{readonly title:string;readonly line:string;readonly stageLabel:string;readonly choice:'fund'|'outline'|'define'|'objects'|null;readonly label:string;readonly caption:string;readonly detail?:string}
const stages=new Set(['course-outline-needed','course-outline-planned','course-outline-running','course-outline-completed','course-activate','course-define'])
/** A reading of this original preparation; all permissions still belong to the original preview. */
export function courseStudioReading(p:GamePanelProps,thread:PlayerThreadView):CourseStudioReading|null{
 const f=thread.focus,v=p.features.course,w=p.features.workbench
 if(p.view.phase!=='playing'||!v||f.kind!=='course'||f.accountId!==p.accountId||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['entry','current','carry'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||p.view.accounts.filter(a=>a.accountId===p.accountId).length!==1||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const t=f.courseTarget
 if(t===null){if(thread.stage!=='course-entry'||p.accountId!=='personal'||p.view.date<v.catalog.availableAt||v.businesses.length||v.courses.length)return null;return {title:'先给这间教室，留一点自己的余地。',line:'资本、大纲和启用，各由你亲自决定；还没有学生或学费。',stageLabel:'尚未留钱 · 未建教室',choice:'fund',label:'看看留给教室的这笔钱',caption:'至少¥2,000自有资本；转账、写大纲和样课分别确认。'}}
 if(!['studio','outline'].includes(t.kind)||!stages.has(thread.stage))return null
 const b=v.businesses.find(b=>b.id===t.businessId)
 if(!b||!['preparing','operating'].includes(b.lifecycle)||courseSceneProgress(v,p.view.date,t,courseSceneContext(p))?.phase!==thread.stage)return null
 if(v.courses.some(c=>c.businessId===b.id)){
  if(t.kind!=='studio'||b.lifecycle!=='operating'||thread.stage!=='course-define')return null
  const hasClass=v.cohorts.some(co=>v.courses.some(c=>c.id===co.courseId&&c.businessId===b.id))
  return {title:hasClass?'这间教室，后来怎样了？':'这间教室，接着教什么？',line:hasClass?'翻回班期，看看约定、进度与已发生的事。':'先翻已有教案与课程，再决定接下来的一次尝试。',detail:'挑一份已有课程或教学经历，看看它现在走到哪一步。',stageLabel:hasClass?'教室已启用 · 已有班期':'教室已启用 · 已有课程',choice:'objects',label:hasClass?'翻回课程与班期':'翻选已有教案与课程',caption:'查看同教室的准备与课程，新的安排另作决定。'}
 }
 const ready=b.lifecycle==='operating'&&(thread.stage==='course-define'||t.kind==='outline'&&thread.stage==='course-outline-completed')
 if(ready)return {title:'教室准备好了，接着想一堂课。',line:'大纲和教室都已留下；先挑真实案例，再决定想教什么。',stageLabel:'教室已启用 · 尚未定义新课',choice:'define',label:'带着大纲，构思这一堂课',caption:'从亲手做过的事开始。'}
 const label=thread.stage==='course-outline-needed'?'选择执笔人和开工日':thread.inspect.label
 return {title:thread.title,line:thread.line,stageLabel:thread.stage==='course-outline-needed'?'资金已留 · 待写大纲':thread.stage==='course-outline-planned'?'大纲已安排 · 尚未开工':thread.stage==='course-outline-running'?'大纲准备中 · 尚未完成':'大纲已完成 · 待独立启用',choice:thread.stage==='course-outline-needed'?'outline':null,label,caption:thread.stage==='course-outline-needed'?'¥100 · 1点 · 7日；人手和日期仍由你显选。':''}
}
export function courseStudioPreparationPage(p:GamePanelProps,target:CourseSceneTarget|null,page:string):boolean{
 const v=p.features.course
 if(p.view.phase!=='playing'||!v||p.view.date<v.catalog.availableAt||!['fund','outline','activate'].includes(page))return false
 const focus=courseFocusFor(p,target,p.accountId)
 if(resolveCourseFocus(p,focus).reason||p.view.accounts.filter(a=>a.accountId===p.accountId).length!==1)return false
 if(page==='fund')return target===null&&p.accountId==='personal'&&!v.businesses.some(b=>b.lifecycle!=='closed')
 if(!target||!['studio','outline'].includes(target.kind))return false
 const b=v.businesses.find(b=>b.id===target.businessId)
 return b?.accountId===p.accountId&&b.lifecycle==='preparing'&&!courseSceneProgress(v,p.view.date,target,courseSceneContext(p))?.invalidReason
}
