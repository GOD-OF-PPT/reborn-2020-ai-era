import type {Dispatch,SetStateAction} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {CoursePreparationStep} from './course-scene-progress.ts'
import {CommandButton} from './CommandButton.tsx'
import {addDays,isoDate} from '../core/calendar.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {moneyText,playableThrough} from './game-text.ts'
import {parseMoneyInput} from './money-input.ts'
import {useCourseSceneDraft,type CourseSceneDraft} from './course-scene-draft.ts'

export type CoursePreparationCommand={kind:string;payload:Record<string,unknown>;label:string;confirm:boolean}
/** Only committed facts ink a step. Picking a card never spends or schedules. */
export function CoursePreparationTrail({step}:{step:CoursePreparationStep}){
 const completed=step.phase==='fund'?0:step.phase==='outline'||step.phase==='waiting'?1:2
 return <ol className="preparation-trail" aria-label="这间教室的实际准备进度">{['建立教室分账','写出教学大纲','决定启用教室'].map((text,index)=><li key={text} data-state={index<completed?'done':index===completed?'current':'later'}><span aria-hidden="true">{index<completed?'✓':String(index+1).padStart(2,'0')}</span>{text}</li>)}</ol>
}
export function coursePreparationCommand(p:GamePanelProps,step:CoursePreparationStep,draft:CourseSceneDraft):CoursePreparationCommand|null{
 const course=p.features.course
 if(!course||!p.view.accounts.some(a=>a.accountId===p.accountId))return null
 const command=(kind:string,payload:Record<string,unknown>,label:string):CoursePreparationCommand=>({kind,payload,label,confirm:true})
 if(step.phase==='fund'){
  const amount=parseMoneyInput(draft.capital)
  return p.accountId==='personal'&&amount!==null&&amount>=200000?command('OpenCourseStudio',{capitalFen:amount},'核对这笔自有资金，再准备教室'):null
 }
 const business=course.businesses.find(b=>b.id===step.businessId)
 if(!business||business.accountId!==p.accountId)return null
 if(step.phase==='activate')return command('ActivateBusiness',{businessId:business.id},'核对条件，启用这间教室')
 if(step.phase!=='outline'||draft.resources.length!==1||!course.resources.some(r=>r.id===draft.resources[0]))return null
 try{isoDate(draft.startAt);if(draft.startAt<p.view.date||draft.startAt>playableThrough)return null;addDays(draft.startAt,7)}catch{return null}
 return command('StartCourseOutline',{businessId:business.id,resources:[...draft.resources],startAt:draft.startAt},'留出这段时间，认真写大纲')
}
export function CoursePreparationFields({p,step,draft,setDraft}:{p:GamePanelProps;step:CoursePreparationStep;draft:CourseSceneDraft;setDraft:Dispatch<SetStateAction<CourseSceneDraft>>}){
 const course=p.features.course,business=course?.businesses.find(b=>b.id===step.businessId),resources=course?.resources??[]
 const selected=draft.resources.length===1?draft.resources[0]:'',edit=(patch:Partial<CourseSceneDraft>)=>setDraft(old=>({...old,...patch}))
 let finish:string|null=null
 try{isoDate(draft.startAt);if(draft.startAt>=p.view.date&&draft.startAt<=playableThrough)finish=addDays(draft.startAt,7)}catch{/* Keep invalid local input visible. */}
 if(step.phase==='fund')return <>
  <p>个人当前可花{moneyText(p.view.accounts.find(a=>a.accountId==='personal')?.availableFen)}。至少转入¥2,000自有资金；这是分到账户里的资本，不是成本或收入。写大纲还需¥100，启用时账户仍须有¥2,000；启用后每月¥100维护，样课和答疑另算。</p>
  <div className="preparation-picks preparation-capital" role="group" aria-label="选择这次留给教室的自有资金">{['2100','5000','10000'].map(value=><button type="button" key={value} aria-pressed={draft.capital===value} onClick={()=>edit({capital:value})}><span>留出{moneyText(Number(value)*100)}准备教室</span><small>{value==='2100'?'写大纲后，留下¥2,000':'先核对转账，再决定'}</small></button>)}</div>
  <label className="field preparation-amount">也可以自己决定金额（元）<input inputMode="decimal" value={draft.capital} onChange={e=>edit({capital:e.target.value})} placeholder="填写这次转入的自有资金"/></label><p className="preparation-hint">看看和调整都不会转账；继续后仍需确认。</p>
 </>
 if(step.phase==='activate')return <><p>已有教学大纲与营业准备会直接复用，无须重新付费写大纲。</p><p>启用时仍核对这间教室可花至少¥2,000、当天初始产能与工具资格。启用本身不另收固定费、不耗行动；之后按实际在营日期承担每月¥100维护。</p><p>这一步没有学生、预售款或教学收入；案例和样课还需独立准备。</p></>
 return <>
  <p>{business?.company?'这间教室的企业账户':'经营账户'}可花{moneyText(business?.funds.availableFen)}。本次大纲¥100 · 1点 · 7日；大纲完成以后，还要另行决定启用、案例和样课。</p>
  <div className="course-schedule-fields"><div><label className="field">谁来写这份教学大纲<select value={selected} onChange={e=>edit({resources:e.target.value?[e.target.value]:[]})}><option value="">请明确选择执笔人</option>{resources.map(r=><option key={r.id} value={r.id}>{r.id==='player-production'?'由我自己来写':courseResourceLabel(r.id,resources,p.view.operations?.workers)}</option>)}</select></label>{selected&&!resources.some(r=>r.id===selected)?<p className="course-paper-warning">之前选择的执笔人现不可用，请重新选择。</p>:null}</div>
  <div><label className="field">从哪一天开始写？<input type="date" min={p.view.date} max={playableThrough} value={draft.startAt} onChange={e=>edit({startAt:e.target.value})}/></label><button type="button" className="course-paper-direction" onClick={()=>edit({startAt:p.view.date})}>明确从今天 {p.view.date} 开始</button></div></div>
  <p className="preparation-hint">{finish?`${draft.startAt}开始 → ${finish}预计写完；预计不等于实际完成。`:draft.startAt&&draft.startAt<p.view.date?'草稿里的开工日已经过去，请重新选择日期。':'先选执笔人和日期；不会替你默认安排。'}资金、共享四点与资源冲突会在确认时核对。</p>
 </>
}
export function CoursePreparation({p,step}:{p:GamePanelProps;step:CoursePreparationStep}){
 const [draft,setDraft]=useCourseSceneDraft(p.view.runId,{accountId:p.accountId,businessId:step.businessId??null,courseId:null,slot:step.phase==='fund'?'entry':'outline'},p.courseDraftMemory)
 const command=coursePreparationCommand(p,step,draft)
 return <section className="scene-action scene-action-card course-preparation" aria-label="准备这间教室"><span className="scene-choice-overline">桌上的第一份教案</span><strong data-book-chapter={step.phase==='fund'?'给教室留一笔自己的钱':'把真正做过的事，写成教学大纲'}>{step.phase==='fund'?'给教室留一笔自己的钱':step.phase==='activate'?'决定是否启用这间教室':'把真正做过的事，写成教学大纲'}</strong><CoursePreparationTrail step={step}/><CoursePreparationFields p={p} step={step} draft={draft} setDraft={setDraft}/>{command?<CommandButton {...p} {...command} className="scene-decision-main"/>:null}</section>
}
