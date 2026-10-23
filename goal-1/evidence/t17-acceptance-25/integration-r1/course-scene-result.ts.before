import type {PlayFeatures,PlayingView} from './game-types.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {moneyText} from './game-text.ts'

const active=(job:ProductionJob|null|undefined)=>job?.status==='planned'||job?.status==='running'
const completed=(before:ProductionJob|null|undefined,after:ProductionJob|null|undefined,date:string)=>!!before&&!!after&&before.id===after.id&&active(before)&&after.status==='completed'&&after.completeAt<=date
const scheduled=(job:ProductionJob)=>`${job.startAt}—${job.completeAt}，${job.status==='planned'?'已安排，尚未开工；资金与行动按原预留':'已实际开工；费用与行动按原账记下'}`

/** A saved public transition names its actual course object; a date alone proves no completion. */
export function courseSceneResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 if(!previous||previous.runId!==current.runId||current.revision<=previous.revision||current.saveStatus!=='saved'||current.hasCandidate)return null
 const before=(previous.features as unknown as PlayFeatures).course,after=(current.features as unknown as PlayFeatures).course
 if(!before||!after)return null
 if(kind==='OpenCourseStudio'){
  const added=after.businesses.filter(b=>!before.businesses.some(old=>old.id===b.id))
  if(added.length===1)return `课程分账已建立，转入自有资本${moneyText(added[0]!.funds.cashFen)}。这是个人资金转入，不是经营收入；大纲、启用和样课仍各自决定。`
 }
 if(kind==='ActivateBusiness'){
  const changed=after.businesses.filter(b=>b.lifecycle==='operating'&&before.businesses.some(old=>old.id===b.id&&old.lifecycle!=='operating'))
  if(changed.length===1)return '这间课程工作室已按原准备条件启用。维护费开始按实际在营日期结算；课程方案、样课和招生仍是不同决定。'
 }
 if(kind==='StartCourseOutline'){
  const added=after.outlines.filter(o=>!before.outlines.some(old=>old.id===o.id)&&active(o.job))
  if(added.length===1)return `这份大纲${scheduled(added[0]!.job!)}。真正完成后才留下准备记录，还没有做成样课或招收学员。`
 }
 if(kind==='DefineCourse'){
  const added=after.courses.filter(c=>!before.courses.some(old=>old.id===c.id)&&c.status==='draft')
  if(added.length===1)return `「${added[0]!.name}」已记为课程方案。案例和教学范围保留在同一份教案里；尚未完成样课，也没有招生或学费收入。`
 }
 if(kind==='LicenseCourseMaterials'){
  const added=after.licenses.filter(l=>!before.licenses.some(old=>old.id===l.id)&&active(l.job))
  if(added.length===1)return `这项课程素材范围的准备${scheduled(added[0]!.job!)}。它绑定本工作室与原案例；实际完成前不算已取得课程使用范围。`
 }
 if(kind==='BuildCourseSample'){
  const changed=after.courses.filter(c=>active(c.job)&&before.courses.some(old=>old.id===c.id&&old.sampleJobId!==c.sampleJobId))
  if(changed.length===1)return `「${changed[0]!.name}」的这次样课${scheduled(changed[0]!.job!)}。制作、完成和招生分别记录，尚未产生学费收入。`
 }
 if(kind!=='AdvanceTime')return null
 const facts:string[]=[]
 for(const outline of after.outlines){
  if(completed(before.outlines.find(o=>o.id===outline.id)?.job,outline.job,current.date))facts.push('这份大纲已实际完成，启用仍须独立核对原工作室条件')
 }
 for(const license of after.licenses){
  if(completed(before.licenses.find(l=>l.id===license.id)?.job,license.job,current.date))facts.push('这项原案例的课程使用范围准备已实际完成，只适用于记录中的工作室与案例')
 }
 for(const course of after.courses){
  const old=before.courses.find(c=>c.id===course.id)
  if(old&&old.status!=='ready'&&course.status==='ready'&&completed(old.job,course.job,current.date))facts.push(`「${course.name}」的样课已实际完成；当前工具资格、素材范围与更新条件仍须核对，尚未因此招生或确认学费收入`)
 }
 return facts.length?facts.join('；')+'。':null
}
