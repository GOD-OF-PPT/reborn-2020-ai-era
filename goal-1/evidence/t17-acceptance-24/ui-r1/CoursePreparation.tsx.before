import {useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {CoursePreparationStep} from './course-scene-progress.ts'
import {CommandButton} from './CommandButton.tsx'
import {addDays} from '../core/calendar.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {moneyText,playableThrough} from './game-text.ts'
import {parseMoneyInput} from './money-input.ts'

/** Only committed facts ink a step. Picking a card never spends or schedules. */
export function CoursePreparationTrail({step}:{step:CoursePreparationStep}){
 const completed=step.phase==='fund'?0:step.phase==='outline'||step.phase==='waiting'?1:2
 return <ol className="preparation-trail" aria-label="这间教室的实际准备进度">{['建立教室分账','写出教学大纲','决定启用教室'].map((text,index)=><li key={text} data-state={index<completed?'done':index===completed?'current':'later'}><span aria-hidden="true">{index<completed?'✓':String(index+1).padStart(2,'0')}</span>{text}</li>)}</ol>
}

export function CoursePreparation({p,step}:{p:GamePanelProps;step:CoursePreparationStep}){
 const [capital,setCapital]=useState(''),[resource,setResource]=useState(''),[date,setDate]=useState({source:p.view.date,value:p.view.date})
 const startAt=date.source===p.view.date?date.value:p.view.date,amount=parseMoneyInput(capital)
 const course=p.features.course,business=course?.businesses.find(b=>b.id===step.businessId)
 const available=p.view.accounts.find(a=>a.accountId==='personal')?.availableFen
 const job=p.view.operations?.jobs.find(j=>j.id===step.jobId)
 const resources=course?.resources??[]
 const selected=resources.some(r=>r.id===resource)?resource:''
 const validDate=/^\d{4}-\d{2}-\d{2}$/.test(startAt)&&startAt>=p.view.date&&startAt<=playableThrough
 let finish:string|null=null
 if(validDate){try{finish=addDays(startAt,7)}catch{/* An invalid local draft cannot schedule a command. */}}
 const outlinePayload=business&&selected&&finish?{businessId:business.id,resources:[selected],startAt}:null
 return <section className="scene-action scene-action-card course-preparation" aria-label="准备这间教室">
  <span className="scene-choice-overline">桌上的第一份教案</span>
  <strong data-book-chapter={step.phase==='fund'?'给教室留一笔自己的钱':'把真正做过的事，写成教学大纲'}>{step.phase==='fund'?'给教室留一笔自己的钱':'把真正做过的事，写成教学大纲'}</strong>
  <CoursePreparationTrail step={step}/>
  {step.phase==='fund'?<>
   <p className="scene-choice-line">个人当前可花{moneyText(available)}。至少转入¥2,000自有资金；这是分到账户里的资本，不是成本或收入。写大纲还需¥100，启用时账户仍须有¥2,000；启用后每月¥100维护，样课和答疑另算。</p>
   <div className="preparation-picks preparation-capital" role="group" aria-label="选择这次留给教室的自有资金">{['2100','5000','10000'].map(value=><CommandButton {...p} key={value} kind="OpenCourseStudio" payload={{capitalFen:Number(value)*100}} label={'留出'+moneyText(Number(value)*100)+'准备教室'} confirm><span>留给这间教室</span><strong>{moneyText(Number(value)*100)}</strong><small>{value==='2100'?'写大纲后，留下¥2,000':'先核对转账，再决定'}</small></CommandButton>)}</div>
   <details className="preparation-custom"><summary>自己决定另一笔金额</summary><label className="field preparation-amount">也可以自己决定金额（元）<input inputMode="decimal" value={capital} onChange={e=>setCapital(e.target.value)} placeholder="填写这次转入的自有资金"/></label>{amount!==null&&amount>=200000?<CommandButton {...p} kind="OpenCourseStudio" payload={{capitalFen:amount}} label="用这笔自有资金准备教室" confirm className="scene-decision-main"/>:<p className="preparation-hint">先填写至少¥2,000。看看和调整都不会转账。</p>}</details>
  </>:<>
   <p className="scene-choice-line">{business?.company?'这间教室的企业账户':'原经营账户'}可花{moneyText(business?.funds.availableFen)}。大纲准备需要¥100、1点和7日；准备好大纲以后，还要另行决定启用、案例和样课。</p>
   {job?<p>上一份大纲任务：{job.startAt}—{job.completeAt}；原成本与记录仍保留。</p>:null}
   <div className="preparation-picks preparation-resources" role="group" aria-label="谁来写这份教学大纲">{resources.map(r=><button type="button" key={r.id} aria-pressed={selected===r.id} onClick={()=>setResource(r.id)}><span>{selected===r.id?'已选这位执笔人':'选择执笔人'}</span><strong>{r.id==='player-production'?'由我自己来写':courseResourceLabel(r.id,resources,p.view.operations?.workers)}</strong><small>{r.id==='player-production'?'留出我自己的实际时间':'原工资与共享排程照常核对'}</small></button>)}</div>
   <label className="field preparation-amount">从哪一天开始写？<input type="date" min={p.view.date} max={playableThrough} value={startAt} onChange={e=>setDate({source:p.view.date,value:e.target.value})} onBlur={e=>setDate({source:p.view.date,value:e.currentTarget.value})}/></label>
   <p className="preparation-hint">{finish?`${startAt}开始 → ${finish}预计写完。`:'请选择有效的开工日期。'}行动占用、实际资源冲突与资金由原规则在确认时核对。</p>
   {outlinePayload?<CommandButton {...p} kind="StartCourseOutline" payload={outlinePayload} label="留出这段时间，认真写大纲" confirm className="scene-decision-main"/>:<p className="preparation-hint">先选执笔人和日期；不会替你默认安排。</p>}
  </>}
 </section>
}
