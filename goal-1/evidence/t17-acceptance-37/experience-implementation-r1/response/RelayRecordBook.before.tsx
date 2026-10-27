import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {relayRecordRows,relayRecordKindLabel,type RelayRecordRow} from './relay-records.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {RelayResponseEditor,type RelayResponseEditorView} from './RelayResponseEditor.tsx'
import type {RelayResponseMode,RelayResponseSubject} from './relay-response-draft.ts'
import {RelayPreparationEditor} from './RelayPreparationEditor.tsx'
import type {RelayPreparationSlot,RelayChoiceDraftSlot} from './relay-preparation-draft.ts'
import {RelayAuditEditor} from './RelayServiceChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {isoDate} from '../core/calendar.ts'
import {relayReviewDate,relayReviewLabel,relayDeferredFeedback} from './relay-scene-clock.ts'
import {relayTicketAudit,relayTicketCorrection} from './relay-ticket-command.ts'
import {relayPaperFor,type RelayPaperSelection} from './relay-continuity.ts'
import {RelayServicePaper} from './RelayServicePaper.tsx'
import {moneyText} from './game-text.ts'
import {makeSharedAction} from './shared-action.ts'
import {revealBookTarget} from './ScreenBook.tsx'
import {relaySceneProgress,relayAuditableMeters} from './relay-scene-progress.ts'
import './relay-record-book.css'

export interface RelayRecordBookView{title:string;body:ReactNode;actions:ReactNode}
type Editor=
 |{kind:'response';mode:RelayResponseMode;subject:RelayResponseSubject;target:RelaySceneTarget}
 |{kind:'audit';target:RelaySceneTarget}
 |{kind:'preparation';slot:RelayPreparationSlot;target:RelaySceneTarget}
 |false
type Reading={scope:string;key:string|undefined;picker:boolean;filter:string;draft:string|null;editor:Editor|undefined;evidence:boolean}
type Props={
 p:GamePanelProps
 target:RelaySceneTarget
 initialRecordKey?:string|undefined
 original?:boolean|undefined
 blockedReason?:string|null|undefined
 onFullRecord?:((target:RelaySceneTarget,recordKey:string,slot?:RelayChoiceDraftSlot)=>void)|undefined
 children?:((view:RelayRecordBookView)=>ReactNode)|undefined
}

function quoteEffectiveDate(p:GamePanelProps,target:RelaySceneTarget,row:RelayRecordRow):string|null{
 const v=p.features.relay
 if(!v||row.kind!=='quote'||!row.quoteId||!row.jobId)return null
 if(resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations}).status!=='valid')return null
 const quotes=v.quotes.filter(q=>q.id===row.quoteId&&q.businessId===target.businessId&&q.jobId===row.jobId),q=quotes.length===1?quotes[0]:undefined
 const jobs=p.view.operations?.jobs.filter(j=>j.id===row.jobId&&j.businessId===target.businessId)??[],job=jobs.length===1?jobs[0]:undefined
 if(!q||!job||job.status!=='completed'||q.completedAt===null||q.job?.id!==job.id||q.job.businessId!==target.businessId||q.job.status!=='completed')return null
 try{isoDate(p.view.date);isoDate(q.completedAt);isoDate(q.effectiveAt);isoDate(job.completeAt)}catch{return null}
 if(job.completeAt>q.completedAt||q.completedAt>p.view.date||q.effectiveAt<=p.view.date||!q.customerIds.length||new Set(q.customerIds).size!==q.customerIds.length)return null
 if(q.customerIds.some(id=>v.customers.filter(c=>c.id===id&&c.businessId===target.businessId).length!==1)||q.responses.length!==q.customerIds.length||new Set(q.responses.map(r=>r.customerId)).size!==q.customerIds.length||q.responses.some(r=>!q.customerIds.includes(r.customerId)||typeof r.accepted!=='boolean')||!q.responses.some(r=>r.accepted))return null
 return q.effectiveAt
}

export function relayRecordNeedsReply(p:GamePanelProps,target:RelaySceneTarget,row:RelayRecordRow):boolean{
 const v=p.features.relay
 if(!v)return false
 if(row.attention==='due'||row.attention==='known')return true
 if(row.kind==='quote'&&quoteEffectiveDate(p,target,row)!==null)return true
 if(row.jobId&&p.view.operations?.jobs.some(j=>j.id===row.jobId&&j.businessId===target.businessId&&['planned','running'].includes(j.status)))return true
 if(row.kind==='application')return v.applications.some(a=>a.id===row.applicationId&&!a.read&&a.job?.status==='completed')
 if(row.kind==='receivable')return v.receivables.some(i=>i.id===row.receivableId&&i.amountFen>i.collectedFen+i.reversedFen)
 if(row.kind==='customer')return v.customers.some(c=>c.id===row.customerId&&c.businessId===target.businessId&&(c.balance.prepaidFen>0||c.dueReceivableFen>0))
 if(row.kind==='supplier')return v.supplyOptions.some(s=>s.businessId===target.businessId&&s.supplierId===row.supplierId&&((s.credit?.remainingFen??0)>0||s.outstandingFen>0))
 const history=v.casebook?.status==='ready'&&v.casebook.runId===p.view.runId&&v.casebook.revision===p.view.revision&&v.casebook.asOf===p.view.date?v.casebook:null
 if(row.kind==='obligation')return history?history.obligationHistory.some(o=>o.id===row.obligationId&&o.scopeBusinessId===target.businessId&&o.remainingFen>0):p.features.workbench.finance.some(f=>f.accountId===target.accountId&&f.obligations.some(o=>o.id===row.obligationId&&o.remainingFen>0))
 if(row.kind==='refund'&&history){const refund=v.refunds.find(r=>r.id===row.refundId);return !!refund&&history.obligationHistory.some(o=>o.scopeBusinessId===target.businessId&&refund.operationIds.includes(o.originOperationId)&&o.remainingFen>0)}
 // An unreviewed report is available to read; it is not a task already commissioned or a due payment.
 return false
}

export function relayRecordSuggestedKey(p:GamePanelProps,target:RelaySceneTarget,rows:readonly RelayRecordRow[]):string|undefined{
 const exact=rows.filter(row=>target.kind==='application'?row.kind==='application'&&row.applicationId===target.applicationId
  :target.kind==='audience'?row.kind==='audience'&&row.audienceId===target.audienceId
  :target.kind==='customer'?row.kind==='customer'&&row.customerId===target.customerId
  :target.kind==='period'?target.meterId!==undefined?row.kind==='meter'&&row.meterId===target.meterId
   :target.jobId!==undefined?['service','support','audit'].includes(row.kind)&&row.jobId===target.jobId
   :row.kind==='service'&&row.periodId===target.periodId:false)
 if(target.kind==='period'&&target.jobId===undefined&&target.meterId===undefined){
  const v=p.features.relay,r=resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
  if(!v||r.status!=='valid'||!r.period)return undefined
  const progress=relaySceneProgress(v,p.view.date,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations}),period=r.period
  if(progress?.phase==='correction')return rows.find(row=>row.kind==='meter'&&row.periodId===period.id&&row.attention==='known')?.key
  if(progress?.phase==='collection'){
   const customerId=progress.command?.kind==='CollectRelayDue'?progress.command.payload.customerId:undefined
   return rows.find(row=>row.kind==='receivable'&&row.periodId===period.id&&row.attention==='due'&&(customerId===undefined||row.customerId===customerId))?.key
  }
  const jobId=progress?.phase==='audit-waiting'?v.auditJobs.filter(a=>a.businessId===target.businessId&&a.periodIds.includes(period.id)&&a.job&&['planned','running'].includes(a.job.status)):[]
  if(jobId.length>1)return undefined
  const fallback=[period.job,period.supportJob].filter(j=>j&&['planned','running'].includes(j.status)).sort((a,b)=>a!.status!==b!.status?(a!.status==='running'?-1:1):a!.startAt<b!.startAt?-1:a!.startAt>b!.startAt?1:0)[0]??null
  const job=jobId[0]?.job??(progress?.phase==='support'?period.supportJob:progress&&['planned','service'].includes(progress.phase)?period.job:fallback)
  if(job){const current=rows.filter(row=>['service','support','audit'].includes(row.kind)&&row.jobId===job.id);return current.length===1?current[0]!.key:undefined}
  if(progress?.phase==='audit-ready'){
   const eligible=new Set(relayAuditableMeters(v,period.id).map(m=>m.id))
   const report=rows.find(row=>row.kind==='meter'&&row.periodId===period.id&&row.meterId!==undefined&&eligible.has(row.meterId))
   if(report)return report.key
  }
  if(progress?.phase==='settling'){
   const unpaid=rows.filter(row=>row.kind==='receivable'&&row.periodId===period.id&&v.receivables.some(i=>i.id===row.receivableId&&i.amountFen>i.collectedFen+i.reversedFen))
   unpaid.sort((a,b)=>{const x=v.receivables.find(i=>i.id===a.receivableId)!.dueAt,y=v.receivables.find(i=>i.id===b.receivableId)!.dueAt;return x<y?-1:x>y?1:a.key<b.key?-1:a.key>b.key?1:0})
   if(unpaid.length)return unpaid[0]!.key
  }
 }
 // A parent may suggest a reading. A specified child never falls back to another ticket.
 return target.kind==='business'?(rows.find(row=>relayRecordNeedsReply(p,target,row))??rows[0])?.key:exact.length===1?exact[0]!.key:undefined
}
function paperSelection(row:RelayRecordRow):RelayPaperSelection|undefined{
 switch(row.kind){
  case 'receivable':case 'refund':case 'supplier':case 'correction':case 'obligation':case 'audit':case 'meter':return {kind:row.kind,recordId:row.recordId}
  default:return undefined
 }
}

/** One original ticket and its response. The complete catalogue is a deliberate reading choice. */
export function RelayRecordBook({p,target,initialRecordKey,original=false,blockedReason,onFullRecord,children}:Props){
 const model=relayRecordRows(p,target),rows=model.rows,scope=JSON.stringify([p.view.runId,p.accountId,target,initialRecordKey??null])
 const initial=()=>initialRecordKey??p.relayRecordMemory?.read(target)??relayRecordSuggestedKey(p,target,rows)
 const [stored,setStored]=useState<Reading>(()=>({scope,key:initial(),picker:false,filter:'open',draft:null,editor:undefined,evidence:false}))
 const reading:Reading=stored.scope===scope?stored:{scope,key:initial(),picker:false,filter:'open',draft:null,editor:undefined,evidence:false}
 const read=(activate:()=>void)=>makeSharedAction(p,'翻阅同一份原票',activate,{allowReadOnly:true}).activate()
 const update=(patch:Partial<Reading>)=>read(()=>setStored({...reading,...patch}))
 const selected=rows.filter(row=>row.key===reading.key),row=selected.length===1?selected[0]:undefined
 const bookId=useId(),radioName=useId(),evidenceId=useId(),evidence=useRef<HTMLDetailsElement>(null),responseRef=useRef<HTMLDivElement>(null),factsRef=useRef<HTMLElement>(null),pickerRef=useRef<HTMLElement>(null),unavailableRef=useRef<HTMLParagraphElement>(null)
 const context={runId:p.view.runId,accountId:p.accountId,operations:p.view.operations},resolved=resolveRelaySceneTarget(p.features.relay,target,context)
 const businessTarget:RelaySceneTarget={kind:'business',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId}
 const v=p.features.relay,valid=resolved.status==='valid'&&model.reason===null&&!!v
 const busy=makeSharedAction(p,'翻阅同一份原票',()=>{},{allowReadOnly:true}).disabled
 useEffect(()=>{
  if(stored.scope!==scope)setStored(reading)
  if(valid&&row)read(()=>{p.relayRecordMemory?.write(target,row.key)})
 },[scope,reading.key,valid,p.relayRecordMemory])
 const choose=(key:string)=>read(()=>{if(!rows.some(row=>row.key===key))return;setStored({...reading,key,picker:false,draft:null,editor:undefined,evidence:false});p.relayRecordMemory?.write(target,key)})
 const inspect=(next:RelaySceneTarget,key:string,slot?:RelayChoiceDraftSlot)=>read(()=>onFullRecord?.(next,key,slot))
 const inspectHere=()=>read(()=>{setStored({...reading,evidence:true});if(evidence.current){evidence.current.open=true;revealBookTarget(evidence.current,evidenceId)}})
 const actionTarget=row?.ownership==='station'?businessTarget:row?.target??target
 const customer=row?.customerId?v?.customers.find(c=>c.id===row.customerId&&c.businessId===target.businessId):undefined
 const invoice=row?.receivableId?v?.receivables.find(i=>i.id===row.receivableId&&i.customerId===row.customerId):undefined
 const debt=row?.obligationId?p.features.workbench.finance.find(f=>f.accountId===target.accountId)?.obligations.find(o=>o.id===row.obligationId):undefined
 const defaultEditor:Editor|undefined=row?.kind==='receivable'&&invoice&&invoice.dueAt<=p.view.date&&invoice.amountFen>invoice.collectedFen+invoice.reversedFen
  ?{kind:'response',mode:'collect',subject:{kind:'receivable',id:invoice.id},target:actionTarget}
  :row?.kind==='obligation'&&debt&&debt.remainingFen>0?{kind:'response',mode:'pay',subject:{kind:'obligation',id:debt.id},target:actionTarget}:undefined
 const editor=reading.editor===undefined?defaultEditor:reading.editor
 const responseKey=editor?editor.kind==='response'?JSON.stringify([editor.kind,editor.mode,editor.subject]):editor.kind==='preparation'?editor.kind+':'+editor.slot:editor.kind:''
 useEffect(()=>{
  if(!original)return
  const control=responseRef.current?.querySelector<HTMLElement>('input,select,textarea')
  const node=control?.closest<HTMLElement>('label')??control??responseRef.current??factsRef.current??pickerRef.current??unavailableRef.current
  if(!node)return
  if(!node.id)node.id=bookId+'-entry'
  read(()=>revealBookTarget(node,node.id))
 },[original,scope,reading.key,responseKey,p.view,valid])
 const response=(mode:RelayResponseMode,subject:RelayResponseSubject,owner=actionTarget)=>update({editor:{kind:'response',mode,subject,target:owner}})
 const prepare=(slot:RelayPreparationSlot,owner=actionTarget)=>update({editor:{kind:'preparation',slot,target:owner}})
 const finish=(view:RelayRecordBookView)=>children?children(view):<section className="relay-ticket-book" aria-label={view.title}><h3>{view.title}</h3>{view.actions}{view.body}</section>
 if(!valid)return finish({title:'这份原票，需要先核对来源',body:<p ref={unavailableRef} id={bookId+'-unavailable'} className="warning-box" role="status">{model.reason??resolved.reason??'原中转资料尚未取得；没有换到另一张票。'}</p>,actions:null})
 const selectedMissing=reading.key!==undefined&&!row
 const changeTicket=<button type="button" disabled={busy} onClick={()=>update({picker:true,draft:null})}>翻另一张同对象的原票</button>
 if(reading.picker||!row){
  const kinds=[...new Set(rows.map(r=>r.kind))],openRows=rows.filter(r=>relayRecordNeedsReply(p,target,r)),visible=reading.filter==='open'?openRows:reading.filter?rows.filter(r=>r.kind===reading.filter):rows,picked=rows.find(r=>r.key===reading.draft),visiblePick=picked&&visible.some(r=>r.key===picked.key)
  return finish({title:'这份约定里，先翻哪一张原票？',body:<section ref={pickerRef} id={bookId+'-picker'} className="relay-ticket-picker">
   {blockedReason?<p className="warning-box" role="status">{blockedReason}</p>:null}
   {selectedMissing?<p className="warning-box" role="status">原来指定的票现已不能唯一找到；没有换成第一张。请明确重选，或保留原关注去核对完整原册。</p>:!rows.length?<p role="status">这份对象暂没有取得可核的逐票明细；没有把空白说成责任已经结清。</p>:null}
   <p>只翻同一人生、账户与中转站的原记录；选择票根不会收付款、改日期或接受新约定。</p>
   <label className="field">在同对象内按票种翻阅<select value={reading.filter} disabled={busy} onChange={e=>update({filter:e.target.value})}><option value="open">仍需回应或正在等 · {openRows.length}</option><option value="">全部原票，含已结记录 · {rows.length}</option>{kinds.map(kind=><option key={kind} value={kind}>{relayRecordKindLabel(kind)} · {rows.filter(r=>r.kind===kind).length}</option>)}</select></label>
   {!visible.length&&reading.filter==='open'?<p role="status">这份原约当前没有列到待回应或正在等的票；仍可明确翻看全部原票和已结依据。未复核计量另按票种翻阅，不冒充已委托的等待。</p>:null}
   <fieldset><legend>先预看，再明确翻开</legend>{visible.map(r=><label className="radio-line" key={r.key}><input type="radio" name={radioName} checked={reading.draft===r.key} onChange={()=>update({draft:r.key})}/><span>{r.title}<small>{r.state} · {r.ownership==='station'?'本站旁账，非全部归本期':'这一对象的原记录'}</small>{[...new Set(r.summary??[])].filter(line=>line!==r.state).slice(0,2).map((line,index)=><small key={index}>{line}</small>)}</span></label>)}</fieldset>
   {picked?<p role="status">待翻开：{picked.title}。{!visiblePick?'当前筛选没有这张票，请明确重选或查看全部；没有代换。':''}</p>:null}
   {!original&&onFullRecord?<button type="button" disabled={busy} onClick={()=>inspect(target,reading.key??'')}>先核对同对象的完整原册 ↗</button>:null}
  </section>,actions:<div className="button-row"><button type="button" disabled={!picked||!visiblePick||busy} onClick={()=>{if(picked&&visiblePick&&!busy)choose(picked.key)}}>明确翻开这一张原票</button>{row?<button type="button" onClick={()=>update({picker:false,draft:null})}>仍留原来这一张</button>:null}</div>})
 }
 const art=relayPaperFor(p,target,paperSelection(row)),ownerNote=row.ownership==='station'?'这是本站同主体的旁账，未全部归入眼前本期。':'这一张票仍属于原来的对象。'
 const sourceMeters=row.kind==='receivable'&&row.meterId?rows.filter(r=>r.kind==='meter'&&r.meterId===row.meterId):[]
 const sourceInvoices=row.kind==='meter'&&row.meterId?rows.filter(r=>r.kind==='receivable'&&r.meterId===row.meterId):[]
 const facts=<section ref={factsRef} id={bookId+'-facts'} className="relay-ticket-facts" aria-label="这张原票的记录与依据">
  <div className="relay-ticket-heading"><span>{relayRecordKindLabel(row.kind)} / 本局虚构</span><span>{row.date??'本站当前原账'}</span></div>
  {art&&!p.textOnly?<div className="relay-ticket-illustration"><RelayServicePaper art={art}/></div>:null}
  <p className="relay-ticket-state" data-attention={row.attention}>{row.state}</p><p className="relay-ticket-owner">{ownerNote}</p>
  {[...new Set(row.summary??[])].filter(line=>line!==row.state).map((line,index)=><p key={'summary-'+index}>{line.startsWith('原日程 ')&&line.endsWith('；'+row.state)?line.slice(0,-('；'+row.state).length):line}</p>)}
  {sourceMeters.length===1?<button type="button" onClick={()=>choose(sourceMeters[0]!.key)}>翻看这张原单对应的原计量票</button>:null}
  {sourceInvoices.map(invoiceRow=><button type="button" key={invoiceRow.key} onClick={()=>choose(invoiceRow.key)}>翻回对应原单：{invoiceRow.title}</button>)}
  {row.lines.length?<details ref={evidence} id={evidenceId} open={reading.evidence} onToggle={event=>update({evidence:event.currentTarget.open})} className="relay-ticket-evidence"><summary>逐项核对这张票的完整原依据</summary>{row.lines.map((line,index)=><p key={index}>{line}</p>)}</details>:null}
 </section>
 const bookFooter=<div className="relay-ticket-reading-actions">{original?<button type="button" disabled={busy} onClick={inspectHere}>展开这张票的完整原依据 ↗</button>:onFullRecord?<button type="button" disabled={busy} onClick={()=>inspect(row.target??target,row.key)}>翻到同对象完整原册中的这一张 ↗</button>:null}</div>
 const body=(content?:ReactNode,more?:ReactNode)=><section className="relay-ticket-book" id={bookId}>{blockedReason?<p className="warning-box" role="status">{blockedReason}</p>:null}{content}{facts}{more}{bookFooter}</section>
 if(editor){
  const wrap=(view:RelayResponseEditorView)=>{
   const actions=<div className="relay-ticket-response-actions">{view.actions}<button type="button" onClick={()=>update({editor:false})}>先收起本次填写，仍留这张原票</button>{changeTicket}</div>
   const content=body(<div ref={responseRef} data-relay-ticket-response="true">{view.body}{!children?actions:null}</div>)
   return children?finish({title:view.title,body:content,actions}):<section className="relay-ticket-book" aria-label={view.title}><h3>{view.title}</h3>{content}</section>
  }
  if(editor.kind==='response')return <RelayResponseEditor p={p} target={editor.target} subject={editor.subject} mode={editor.mode} blockedReason={blockedReason}>{wrap}</RelayResponseEditor>
  if(editor.kind==='audit')return <RelayAuditEditor p={p} target={editor.target} blockedReason={blockedReason} onInspect={next=>{if(next)inspect(next,row.key)}}>{wrap}</RelayAuditEditor>
  return <RelayPreparationEditor p={p} target={editor.target} slot={editor.slot} blockedReason={blockedReason} onInspect={(next,slot)=>{if(next)inspect(next,row.key,slot)}}>{wrap}</RelayPreparationEditor>
 }
 const meterTarget:RelaySceneTarget|undefined=row.kind==='meter'&&row.meterId&&row.periodId?{...businessTarget,kind:'period',periodId:row.periodId,meterId:row.meterId}:undefined
 const existing=meterTarget?relayTicketAudit(p,meterTarget):null
 const job=row.jobId?p.view.operations?.jobs.find(j=>j.id===row.jobId&&j.businessId===target.businessId):existing?.job??undefined
  const effectiveDate=quoteEffectiveDate(p,target,row)
  const nextDate=job&&(job.status==='planned'||job.status==='running')?(job.status==='planned'?job.startAt:job.completeAt):effectiveDate??(invoice&&invoice.amountFen>invoice.collectedFen+invoice.reversedFen&&invoice.dueAt>p.view.date?invoice.dueAt:null)
 const next=nextDate?relayReviewDate(p,playableAdvanceDate(p.features.workbench,p.view.date,nextDate)):null
 const correction=meterTarget?relayTicketCorrection(p,meterTarget):null
 const batchRows=existing?.job?rows.filter(r=>r.kind==='audit'&&r.jobId===existing.job!.id):[]
 const deferred=job&&(job.status==='planned'||job.status==='running')?relayDeferredFeedback(p,meterTarget??row.target??target):null
 const auditNotice=existing?.job&&existing.batch?<p role="status">这张票已在{existing.job.startAt}—{existing.job.completeAt}的同一份复核中，完整批次{existing.batch.meterCount}条；实际完成后才看实计，不重复委托。</p>:existing?.reason?<p className="warning-box" role="status">{existing.reason}</p>:null
 const actions=<div className="relay-ticket-decisions">
   {next?<ClockAdvance p={p} date={next} label={relayReviewLabel(p,next,effectiveDate?next===effectiveDate?'等这份已谈妥的原报价生效':'先到原日历停点，再等这份报价生效':job?'到这份原任务的下一反馈':'先到这笔原款的约定日期')+' · '+next}/>:null}
  {row.kind==='meter'&&meterTarget&&!existing?.job&&!existing?.reason&&v.meters.find(m=>m.id===row.meterId)?.auditedUnits===null?<button type="button" onClick={()=>update({editor:{kind:'audit',target:meterTarget}})}>为这一张已发生的原票，安排独立复核</button>:null}
  {correction?.command?<CommandButton {...p} {...correction.command}/>:correction?.reason?<p className="field-help" role="status">{correction.reason}</p>:null}
  {row.kind==='receivable'&&invoice&&invoice.amountFen>invoice.collectedFen+invoice.reversedFen&&invoice.dueAt<=p.view.date?<button type="button" onClick={()=>response('collect',{kind:'receivable',id:invoice.id})}>核对这张原单，本次先收多少</button>:null}
  {row.kind==='customer'&&customer?<>
   {customer.dueReceivableFen>0?<CommandButton {...p} kind="CollectRelayDue" payload={{customerId:customer.id}} label={'核对客户'+(v.customers.filter(c=>c.businessId===target.businessId).findIndex(c=>c.id===customer.id)+1)+'全部到期原款 · '+moneyText(customer.dueReceivableFen)} confirm/>:null}
   {customer.balance.prepaidFen>0?<button type="button" onClick={()=>response('customer-refund',{kind:'customer',id:customer.id})}>核对这位客户，本次退还多少未消费原款</button>:null}
  </>:null}
  {row.kind==='supplier'&&row.supplierId?<><button type="button" onClick={()=>response('supplier-refund',{kind:'supplier',id:row.supplierId!},businessTarget)}>核对这项供应，本次取回多少本站资产</button><button type="button" onClick={()=>prepare('supplier-funds',businessTarget)}>另核一笔自有供应预付</button></>:null}
  {row.kind==='obligation'&&debt&&debt.remainingFen>0?<button type="button" onClick={()=>response('pay',{kind:'obligation',id:debt.id})}>核对这笔旧义务，本次偿还多少</button>:null}
  {changeTicket}
 </div>
 const more=<>
  {deferred&&deferred.date!==next?<section className="relay-ticket-other"><p>也可以先继续这份已公开的原安排；待收款原单仍保留，不会自动收钱。原费用、交付和季度屏障继续核对。</p><ClockAdvance p={p} date={deferred.date} label={deferred.label+' · '+deferred.date}/></section>:null}
  {row.kind==='customer'&&customer?<details className="relay-ticket-other"><summary>这份客户原约的其它决定</summary><button type="button" onClick={()=>prepare('customer-funds',row.target??target)}>另核这位客户的一次充值</button><button type="button" onClick={()=>response('renew',{kind:'customer',id:customer.id})}>重新写清这位客户的续签条件</button><button type="button" onClick={()=>response('requote',{kind:'business',id:target.businessId},businessTarget)}>和本站原客户，谈一份未来报价</button><CommandButton {...p} kind="CloseRelayCustomer" payload={{customerId:customer.id}} label="旧责任结清后，关闭这位客户的原合同" confirm/></details>:null}
  {batchRows.length===1?<button type="button" onClick={()=>choose(batchRows[0]!.key)}>翻开这一次已委托的完整复核批次</button>:null}
  {job&&(job.status==='planned'||job.status==='running')||row.kind==='service'&&row.periodId?<details className="relay-ticket-other"><summary>若要停下，先核对这份原任务与留下的责任</summary>{job&&(job.status==='planned'||job.status==='running')?<CommandButton {...p} kind="InterruptJob" payload={{jobId:job.id}} label={row.kind==='support'?'停止这一份原支持，保留费用和旧责任':row.kind==='audit'||existing?.job?'中断这一次原复核，保留投入与原记录':'停止这份原任务，保留费用和旧责任'} confirm/>:null}{row.kind==='service'&&row.periodId?<CommandButton {...p} kind="StopRelayPeriod" payload={{periodId:row.periodId}} label="停止本期后续请求，原支持和旧款继续" confirm/>:null}</details>:null}
 </>
 return finish({title:row.title,body:body(auditNotice,more),actions})
}
