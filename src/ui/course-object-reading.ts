import type {GamePanelProps} from './game-types.ts'
import {courseSceneProgress,courseTargetReason,type CourseSceneTarget} from './course-scene-progress.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export type CourseObjectGroup='classes'|'courses'|'preparation'
export interface CourseObjectEntry{readonly key:string;readonly group:CourseObjectGroup;readonly target:CourseSceneTarget;readonly title:string;readonly kind:string;readonly date:string|null;readonly dateLabel:string;readonly state:string;readonly wait:{readonly date:string;readonly label:string}|null}
export interface CourseObjectReading{readonly key:string;readonly businessId:string;readonly entries:readonly CourseObjectEntry[]}
const dateKnown=(date:string)=>{try{return isoDate(date)===date}catch{return false}}

/** A same-owner reading of public objects. It never chooses an object or computes an outcome. */
export function courseObjectReading(p:GamePanelProps,target:CourseSceneTarget|null):CourseObjectReading|null{
 const v=p.features.course,operations=p.view.operations
 if(p.view.phase!=='playing'||!v||!target||!operations||p.view.accounts.filter(a=>a.accountId===p.accountId).length!==1||courseTargetReason(v,target,{operations}))return null
 const owners=v.businesses.filter(b=>b.id===target.businessId),originals=operations.businesses.filter(b=>b.id===target.businessId)
 if(owners.length!==1||originals.length!==1||owners[0]!.accountId!==p.accountId||originals[0]!.accountId!==p.accountId||originals[0]!.definitionId!=='course-studio')return null
 const business=owners[0]!,entries:CourseObjectEntry[]=[]
 const add=(group:CourseObjectGroup,t:CourseSceneTarget,title:string,kind:string,date:string|null,dateLabel:string)=>{
  const progress=courseSceneProgress(v,p.view.date,t,{operations})
  if(!title.trim()||date!==null&&!dateKnown(date)||courseTargetReason(v,t,{operations})||!progress||progress.invalidReason)return false
  entries.push({key:JSON.stringify(t),group,target:t,title,kind,date,dateLabel,state:progress.title,wait:progress.wait??null});return true
 }
 const lessons=v.courses.filter(c=>c.businessId===business.id)
 // An unresolvable source remains in the complete original reader, never replaced by another lesson.
 if(v.cohorts.some(co=>v.courses.filter(c=>c.id===co.courseId).length!==1)||v.audiences.some(a=>v.courses.filter(c=>c.id===a.courseId).length!==1))return null
 const classes=v.cohorts.filter(co=>lessons.some(c=>c.id===co.courseId)).slice().sort((a,b)=>Number(a.closedAt!==null)-Number(b.closedAt!==null)||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id))
 for(const co of classes){const lesson=lessons.find(c=>c.id===co.courseId)!;if(!add('classes',{kind:'cohort',businessId:business.id,courseId:lesson.id,cohortId:co.id},lesson.name+' · '+co.startAt+'班','班期 · 原价'+moneyText(co.priceFen)+'/人',co.createdAt,'写下班约'))return null}
 for(const c of lessons){if(!add('courses',{kind:'course',businessId:business.id,courseId:c.id,...(c.sampleJobId?{sampleJobId:c.sampleJobId}:{})},c.name,'课程',c.createdAt,'留下方案'))return null}
 for(const a of v.audiences.filter(a=>lessons.some(c=>c.id===a.courseId))){const c=lessons.find(c=>c.id===a.courseId)!;if(!add('courses',{kind:'audience',businessId:business.id,courseId:c.id,audienceId:a.id},c.name+' · 受众与报价','受众 · 报价'+moneyText(a.priceFen)+'/人',a.createdAt,'开始接触'))return null}
 if(!add('preparation',{kind:'studio',businessId:business.id},'这间教室与营业准备','教室',business.activeFrom??business.history[0]?.date??null,business.activeFrom?'实际启用':'留下记录'))return null
 for(const o of v.outlines.filter(o=>o.businessId===business.id)){if(!add('preparation',{kind:'outline',businessId:business.id,outlineId:o.id},'亲手写下的教学大纲','大纲',o.job?.startAt??null,'原安排开工'))return null}
 for(const l of v.licenses.filter(l=>l.businessId===business.id)){if(!add('preparation',{kind:'license',businessId:business.id,licenseId:l.id},'这份案例的课程使用范围','使用范围',l.job?.startAt??null,'原安排开工'))return null}
 if(new Set(entries.map(e=>e.key)).size!==entries.length)return null
 return {key:JSON.stringify([p.view.runId,p.accountId,business.id]),businessId:business.id,entries}
}
