import {useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {resolveOperatingJob} from './operating-job-target.ts'
import {Dialog} from './Dialog.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {quarterOf,isoDate} from '../core/calendar.ts'
import {WaitStopControl} from './WaitStopControl.tsx'
import './operating-job-record.css'

export interface OperatingJobDraft{readonly resource:string;readonly date:string}
type Props={p:GamePanelProps;target:unknown;initialDraft:OperatingJobDraft;onDraftChange:(next:OperatingJobDraft)=>boolean;onClose:()=>void;onBusiness?:((businessId:string,accountId:string)=>void)|undefined}

/** One already committed original arrangement, never a new service or preparation. */
export function OperatingJobRecord({p,target,initialDraft,onDraftChange,onClose,onBusiness}:Props){
 const [draft,setDraft]=useState(initialDraft),r=resolveOperatingJob(p,target)
 const change=(next:OperatingJobDraft)=>makeSharedAction(p,'调整这份原安排',()=>{if(onDraftChange(next))setDraft(next)},{allowReadOnly:true}).activate()
 if(r.status!=='valid')return <Dialog title="先找回这份原安排" onClose={onClose}><p className="reason" role="status">{r.reason}</p><button type="button" onClick={onClose}>合上这一页，重新选择</button></Dialog>
 const {job,money,definition}=r,context={...p,accountId:r.target.accountId},active=job.status==='planned'||job.status==='running'
 const title=job.status==='planned'?r.title+'还没开工，要继续留着吗？':job.status==='running'?r.title+'正在做，要继续吗？':r.title+({completed:'已经做完。',cancelled:'已经取消。',interrupted:'已经中断。'}[job.status])
 const next=job.status==='planned'&&job.startAt>p.view.date?job.startAt:job.completeAt>p.view.date?job.completeAt:null
 const options=[{id:'player-production',label:'本人实际日期产能'},...(p.view.operations?.workers??[]).filter(w=>w.to===null).map(w=>({id:w.id,label:({'editor-lin':'林剪辑员','assistant-zhou':'周助理'} as Record<string,string>)[w.definitionId]??w.definitionId}))]
 const ready=options.some(o=>o.id===draft.resource)&&draft.date!==''
 const protectedState=p.view.readOnly||p.view.hasCandidate||p.view.saveStatus!=='saved'||p.view.busy||p.controller.snapshot.busy
 const businessAction=onBusiness?makeSharedAction(context,'翻这间企业的完整原册',()=>onBusiness(job.businessId,r.target.accountId),{allowReadOnly:true}):null
 const forecast=r.finance?.forecast,rawGap=forecast?.earliestGap
 let gap=rawGap??null,forecastInvalid=forecast!==undefined&&forecast.accountId!==r.target.accountId
 if(gap){try{isoDate(gap.date)}catch{forecastInvalid=true}if(!Number.isSafeInteger(gap.shortfallFen)||gap.shortfallFen<0||!['committed','conditional'].includes(gap.certainty))forecastInvalid=true}
 if(forecastInvalid)gap=null
 return <Dialog title={title} className="opening-paper operating-job-paper" onClose={onClose}>
  <p className="eyebrow">{r.target.accountId==='personal'?'个人账户':'企业账户 · '+r.target.accountId.slice(-6)} · 今天 {p.view.date}</p>
  {p.view.readOnly?<p className="reason">只读 · 可以翻阅，不能改变原安排。</p>:p.view.hasCandidate||p.view.saveStatus==='unsaved'?<p className="reason">原候选还未保存；这里保留旧安排，请合上纸页处理原候选。</p>:p.view.saveStatus==='conflict'?<p className="reason">存档冲突尚未处理；请合上纸页重新读取。</p>:p.view.busy||p.controller.snapshot.busy?<p className="reason">正在记下这一步，请稍候。</p>:null}
  {p.view.hasCandidate||p.view.saveStatus==='unsaved'||p.view.saveStatus==='conflict'?<button type="button" onClick={onClose}>回到存档恢复</button>:null}
  {p.features.workbench.pause?<><p className="reason">日历里还有原责任待处理，原安排仍保留。</p><button type="button" onClick={onClose}>先面对这件事</button></>:null}
  <p>{job.startAt}—{job.completeAt} · {job.resources.map((id,index)=>id==='player-production'?'自己':r.resourceLabels[index]).join('、')}</p>
  <dl className="command-facts">
   <div><dt>这次已经实付</dt><dd>{moneyText(money.paidFen)}</dd></div>
   <div><dt>尚未开工的原预留</dt><dd>{moneyText(money.reservedFen)}</dd></div>
  </dl>
  <p>原开工季度 {quarterOf(job.startAt)} · {definition.actionPoints}点</p>
  {money.reason?<p className="reason">{money.reason}</p>:null}
  <p>{job.status==='planned'?'日子留好了，还没有开工。':job.status==='running'?'投入已经发生，中断也不会退回。':job.status==='completed'?'投入与完成日期，都留在这一页。':job.status==='cancelled'?'还没开工就取消了，原预留已经解除。':'这份工作停下了，已经付出的费用与行动保留。'}</p>
  {active&&job.resources.some(id=>id!=='player-production')?<p>只停这份工作，员工仍按原聘用计薪。</p>:null}
  {gap?<p className="reason" role="status">{gap.certainty==='conditional'?'预算情景下可能不足':'按现有承诺预计不足'} · {gap.date} · 差额{moneyText(gap.shortfallFen)}。其它聘用与原约仍继续。</p>:forecastInvalid?<p className="reason" role="status">原账户资金情景来源待核对，未改用另一份账户的预测。</p>:null}
  {active?<div className="button-row">
   {next?<ClockAdvance p={context} date={next} label={job.status==='planned'?'等到这份安排开工':'等这份安排完成'} showReason={!protectedState}/>:<p>原任务日期已到；请核对原时钟停点，未代记完成。</p>}
   <CommandButton {...context} kind="InterruptJob" payload={{jobId:job.id}} label={job.status==='planned'?'取消这次未开工安排':'中断这次安排'} confirm showReason={!protectedState}/>
  </div>:<button type="button" className="scene-text-action" onClick={onClose}>收好这份记录</button>}
  <WaitStopControl active={p.controller.timeWait!==null} onStop={()=>p.controller.stopWaiting()}/>
  {p.controller.timeWait!==null?<p>先停下等候，原安排仍继续。</p>:null}
  <details><summary>原改期条件与完整任务手记</summary>
   <p>已付费用与已用行动不退；原预留只按对应任务与开工季度解除。工资、维护和其他合同各自继续。</p>
   <p>原人手：{r.resourceLabels.join('、')} · 原窗口 {job.startAt}—{job.completeAt} · {job.status==='planned'?'已预留':job.status==='running'?'进行中':job.status==='completed'?'实际完成':job.status==='cancelled'?'已取消':'已中断'}。</p>
   <label className="field">本次改期的人手<ResourceSelect options={options} value={draft.resource} emptyLabel="先明确选择原人手" onChange={resource=>change({...draft,resource})}/></label>
   <label className="field">本次改到哪一天<input type="date" min={p.view.date} value={draft.date} onChange={event=>change({...draft,date:event.currentTarget.value})}/></label>
   <button type="button" className="scene-text-action" onClick={()=>change({...draft,date:p.view.date})}>填入今天 · {p.view.date}</button>
   {draft.date&&draft.date<p.view.date?<p className="reason">草稿日期已过去，请重新核对；没有替你改成今天。</p>:null}
   <CommandButton {...context} kind="RescheduleJob" payload={{jobId:job.id,resources:draft.resource?[draft.resource]:[],startAt:draft.date}} label="核对这份原安排的改期" confirm showReason={!protectedState} renderAction={binding=><div className="command"><button type="button" disabled={binding.disabled||!ready} onClick={()=>{if(ready)binding.activate()}}>核对改期</button>{!ready?<small className="reason">先明确选择人手和日期。</small>:binding.reason&&!protectedState?<small className="reason">{binding.reason}</small>:null}</div>}/>
  </details>
  {businessAction&&r.business.definitionId==='ecosystem-service'?<button type="button" className="scene-text-action" disabled={businessAction.disabled} onClick={businessAction.activate}>{businessAction.label} ↗</button>:null}
 </Dialog>
}
