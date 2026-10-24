import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {relaySceneProgress,type RelaySceneProgress} from './relay-scene-progress.ts'
import {Dialog} from './Dialog.tsx'
import {moneyText,lifecycleText} from './game-text.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import type {RelaySceneDraftSlot} from './relay-scene-draft.ts'
import {RelayAuditEditor,RelayServiceChoice,relayChoiceContext} from './RelayServiceChoice.tsx'

/** Opening an original ticket is optional; it never performs or confirms an operation. */
export function RelayServiceLetter({p,progress,onNext,onFullRecord}:{p:GamePanelProps;progress:RelaySceneProgress;onNext:()=>void;onFullRecord:()=>void}){
 const [open,setOpen]=useState(false)
 const period=p.features.relay?.periods.find(c=>c.id===progress.periodId)
 if(!period)return null
 return <><aside className="relay-scene-stub" aria-label="灯下这段原服务">
  <div className="relay-stub-caption"><span>灯下的服务单 / 本局虚构</span><span>{progress.periodIndex+1} / {progress.periodIds.length}</span></div>
  <div className="relay-stub-links"><button type="button" onClick={()=>setOpen(true)}><time>{period.from}</time><span aria-hidden="true">—</span><time>{period.to}</time><span>展开这份原约定 ↗</span></button>{progress.periodIds.length>1?<button type="button" onClick={onNext}>翻到另一段原服务 →</button>:null}</div>
 </aside>{open?<Dialog title="灯下的原服务单" onClose={()=>setOpen(false)}><RelayServiceRecord p={p} progress={progress} onFullRecord={()=>{setOpen(false);onFullRecord()}}/></Dialog>:null}</>
}

/** Full public facts stay in the ticket and the original book, including interrupted obligations. */
export function RelayServiceRecord({p,progress,onFullRecord}:{p:GamePanelProps;progress:RelaySceneProgress;onFullRecord:()=>void}){
 const relay=p.features.relay,period=relay?.periods.find(c=>c.id===progress.periodId)
 if(!relay||!period)return null
 const pending=relay.meters.filter(m=>m.periodId===period.id&&m.auditedUnits!==null&&m.auditedUnits!==m.reportedUnits&&m.correctionId===null).length
 const support=period.supportJob
 const supportLine=support?.status==='completed'?'原支持已实际完成':support?.status==='running'?`原支持仍在进行，${support.completeAt}预计完成`:support?.status==='planned'?`原支持留在${support.startAt}—${support.completeAt}`:support?'原支持已经中断，仍须核对赔付与旧承诺':'原支持记录仍待核对'
 return <section className="relay-service-record" aria-label="这段服务的完整公开记录">
  <div className="risk-letter-heading"><span>灯下的服务单 / 本局虚构</span><span>{progress.periodIndex+1} / {progress.periodIds.length}</span></div>
  <h2>{period.from}—{period.to}</h2>
  <p>{period.customerIds.length}位原客户 · {period.supplierIds.map(id=>relay.catalog.suppliers.find(s=>s.id===id)?.label??'原供应').join(' → ')}</p>
  <p>已记录{period.observedDays}/{relay.catalog.serviceDays}日 · 报告用量{period.reportedUnits} · 有停止或不足原因{period.failedDays}日。报告不代替独立复核。</p>
  <p>{supportLine}；{pending?`${pending}条已复核差额尚待更正`:`已实际复核${period.auditedMeters}条计量`}。客户未消费余额与应收应付仍在原账。</p>
  <div className="button-row"><button type="button" onClick={onFullRecord}>核对这段服务、客户与原账 ↗</button></div>
 </section>
}

type ChoiceRow={target:RelaySceneTarget;title:string;line:string}
export function relayChoiceRows(p:GamePanelProps):ChoiceRow[]{
 const relay=p.features.relay;if(!relay)return []
 const rows:ChoiceRow[]=[]
 for(const business of relay.businesses){
  const stations=relay.stations.filter(s=>s.businessId===business.id),station=stations.length===1?stations[0]:undefined
  if(!station||!p.view.accounts.some(a=>a.accountId===business.accountId))continue
  const identity={runId:p.view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id},context={...relayChoiceContext(p),accountId:business.accountId},target:RelaySceneTarget={...identity,kind:'business'}
  if(resolveRelaySceneTarget(relay,target,context).status!=='valid')continue
  rows.push({target,title:(business.company?'企业中转站':'个人中转分账')+' · '+business.id.slice(-6),line:(lifecycleText[business.lifecycle]??business.lifecycle)+'；新一期仍需明确选择客户、供应和支持。'})
  for(const period of relay.periods.filter(row=>row.businessId===business.id)){
   const periodTarget:RelaySceneTarget={...identity,kind:'period',periodId:period.id}
   if(resolveRelaySceneTarget(relay,periodTarget,context).status==='valid')rows.push({target:periodTarget,title:period.from+'—'+period.to+'原服务',line:(business.company?'企业':'个人')+' · '+business.id.slice(-6)+' · '+(period.status==='closed'?'本期已结，旧记录仍保留':'原支持与账单仍沿原约定')})
  }
 }
 return rows
}
const bookmarkLocked=(p:GamePanelProps)=>p.view.busy||p.controller.snapshot.busy||p.view.hasCandidate||p.view.saveStatus==='conflict'
export function RelayTargetPicker({p,current,onConfirm}:{p:GamePanelProps;current:RelaySceneTarget|null|undefined;onConfirm:(target:RelaySceneTarget|null)=>void}){
 const name=useId(),key=p.view.runId+'|'+JSON.stringify(current),[choice,setChoice]=useState<{key:string;value:RelaySceneTarget|null|undefined}>({key,value:undefined}),pick=choice.key===key?choice.value:undefined,rows=relayChoiceRows(p)
 return <section className="relay-target-picker"><fieldset><legend>预看不会换对象，明确翻开才选中</legend>{rows.map(row=><label className="radio-line" key={JSON.stringify(row.target)}><input type="radio" name={name} checked={JSON.stringify(pick)===JSON.stringify(row.target)} onChange={()=>setChoice({key,value:row.target})}/><span>{row.title}<small>{row.line}</small></span></label>)}<label className="radio-line"><input type="radio" name={name} checked={pick===null} onChange={()=>setChoice({key,value:null})}/><span>明确准备新站<small>只回原资本与资格入口，不开站、不充值。</small></span></label>{!rows.length?<p>尚无可核的原中转企业或账期；没有替你找到另一条线路。</p>:null}</fieldset><button type="button" disabled={pick===undefined||bookmarkLocked(p)} onClick={()=>{if(pick!==undefined&&!bookmarkLocked(p))onConfirm(pick)}}>明确翻开这一份</button></section>
}
export interface RelaySceneChoiceProps{
 p:GamePanelProps
 target:RelaySceneTarget|null|undefined
 blockedReason?:string|null|undefined
 onTargetChange?:((target:RelaySceneTarget|null)=>void)|undefined
 onInspect:(target:RelaySceneTarget|null,slot?:RelaySceneDraftSlot)=>void
 children:(open:(slot?:RelaySceneDraftSlot)=>void)=>ReactNode
}
/** One picker and the same two editors serve the room, narrative scene and original book. */
export function RelaySceneChoice({p,target,blockedReason,onTargetChange,onInspect,children}:RelaySceneChoiceProps){
 const sourceKey=p.view.runId+'|'+JSON.stringify(target),source=useRef({key:sourceKey,version:0})
 if(source.current.key!==sourceKey)source.current={key:sourceKey,version:source.current.version+1}
 const [local,setLocal]=useState<{version:number;target:RelaySceneTarget|null|undefined}>({version:source.current.version,target}),current=onTargetChange?target:local.version===source.current.version?local.target:target
 const scopedP=!onTargetChange&&local.version===source.current.version&&local.target!==target&&current?{...p,accountId:current.accountId}:p
 const resolution=current===undefined?null:resolveRelaySceneTarget(scopedP.features.relay,current,relayChoiceContext(scopedP)),progress=relaySceneProgress(scopedP.features.relay,scopedP.view.date,current,relayChoiceContext(scopedP))
 const [open,setOpen]=useState(false),[picker,setPicker]=useState(false),[requested,setRequested]=useState<RelaySceneDraftSlot|undefined>(undefined),openedRevision=useRef(p.view.revision)
 useEffect(()=>{if(p.view.hasCandidate||p.view.saveStatus==='conflict'||open&&p.view.revision!==openedRevision.current&&p.view.saveStatus==='saved')setOpen(false)},[p.view.hasCandidate,p.view.saveStatus,p.view.revision,open])
 const choose=(next:RelaySceneTarget|null)=>{if(bookmarkLocked(p))return;setLocal({version:source.current.version,target:next});onTargetChange?.(next);setPicker(false);setRequested(undefined)}
 const activate=(slot?:RelaySceneDraftSlot)=>{openedRevision.current=p.view.revision;setRequested(slot);setPicker(current===undefined||resolution?.status!=='valid');setOpen(true)}
 const inspect=(value:RelaySceneTarget|null,slot?:RelaySceneDraftSlot)=>{setOpen(false);onInspect(value,slot)}
 const slot=requested??progress?.intent??undefined,valid=resolution?.status==='valid'&&current!==null&&current!==undefined
 const original=valid&&current.kind==='period'&&current.jobId!==undefined
 const editable=valid&&!original&&(slot==='service'?current.kind==='business':slot==='audit'?current.kind==='period':false)
 let content:ReactNode=null
 if(open&&picker)content=<Dialog title="先找回，同一份原服务" className="opening-paper relay-choice-paper" onClose={()=>setOpen(false)}><p role="status">{resolution?.reason??'明确选择原企业或账期；翻阅不会安排服务或充值。'}</p><RelayTargetPicker p={p} current={current} onConfirm={choose}/><button type="button" onClick={()=>setOpen(false)}>先合上，不换对象</button></Dialog>
 else if(open&&editable&&current)content=slot==='service'?<RelayServiceChoice p={scopedP} target={current} blockedReason={blockedReason} onInspect={inspect} onClose={()=>setOpen(false)}>{view=><Dialog title={view.title} className="opening-paper relay-choice-paper" onClose={()=>setOpen(false)} footer={<>{view.actions}<button type="button" onClick={()=>setPicker(true)}>明确翻选另一份原服务</button></>}>{view.body}</Dialog>}</RelayServiceChoice>:<RelayAuditEditor p={scopedP} target={current} blockedReason={blockedReason} onInspect={inspect} onClose={()=>setOpen(false)}>{view=><Dialog title={view.title} className="opening-paper relay-choice-paper" onClose={()=>setOpen(false)} footer={<>{view.actions}<button type="button" onClick={()=>setPicker(true)}>明确翻选另一份原服务</button></>}>{view.body}</Dialog>}</RelayAuditEditor>
 else if(open){
  const job=resolution?.job,meter=resolution?.meter,period=resolution?.period,customer=resolution?.customer,business=resolution?.business
  const nextBusiness=valid&&current?{kind:'business' as const,runId:current.runId,accountId:current.accountId,businessId:current.businessId,stationId:current.stationId}:null
  const nextPeriod=valid&&current?.kind==='period'?{kind:'period' as const,runId:current.runId,accountId:current.accountId,businessId:current.businessId,stationId:current.stationId,periodId:current.periodId}:null
  content=<Dialog title={job?'这份原任务，仍有自己的日期':meter?'原计量，和它真正的依据':'灯下，这一份原服务'} className="opening-paper relay-choice-paper" onClose={()=>setOpen(false)} footer={<div className="button-row"><button type="button" onClick={()=>inspect(current??null)}>翻开同对象的完整原册 ↗</button><button type="button" onClick={()=>setPicker(true)}>明确翻选原企业或账期</button><button type="button" onClick={()=>setOpen(false)}>先合上</button></div>}>
   {blockedReason?<p role="status" className="warning-box">{blockedReason}</p>:null}{progress?<><h3>{progress.title}</h3><p>{progress.line}</p><p>{progress.choice.line}</p></>:null}
   {job?<p>{job.status==='planned'?'已预留，尚未开工':job.status==='running'?'正在进行，尚未完成':job.status==='completed'?'原任务已经实际完成':'原任务已停止，旧成本仍保留'} · {job.startAt}—{job.completeAt}。{resolution?.audit?'该次原批次覆盖'+resolution.audit.meterCount+'条已有计量；不是后来新发生的请求。':''}</p>:null}
   {meter?<p>{meter.date} · 原报告{meter.reportedUnits} · {meter.auditedUnits===null?'实计待独立复核':'原已复核实计'+meter.auditedUnits} · {meter.correctionId?'原更正已追加':'原量、原价与未处理责任保留'}。</p>:null}
   {period&&progress?<RelayServiceRecord p={scopedP} progress={progress} onFullRecord={()=>inspect(current??null)}/>:customer?<p>原客户合同{customer.signedAt}—{customer.termEnd}；未消费余额{moneyText(customer.balance.prepaidFen)}，已到期原应收{moneyText(customer.dueReceivableFen)}。签约、余额、收入与收款分别发生。</p>:business?<p>本站可花{moneyText(business.funds.availableFen)}；客户保护、供应资产和应付各留原账，没有合成另一份利润。</p>:<p>这里是新站入口；原资本、技术和供应条件仍须分别确认。</p>}
   {original&&nextPeriod?<button type="button" onClick={()=>choose(nextPeriod)}>明确回到本期已有记录，再决定下一步</button>:null}
   {requested==='service'&&nextBusiness&&current?.kind!=='business'?<button type="button" onClick={()=>{choose(nextBusiness);setRequested('service')}}>明确为这间站拟定另一份新服务</button>:null}
  </Dialog>
 }
 return <>{children(activate)}{content}</>
}

/** Older audit entry points resolve their original period, then use the same explicit editor. */
export function RelayAuditChoice({p,audit,onFullRecord,children}:{p:GamePanelProps;audit:NonNullable<RelaySceneProgress['audit']>;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode}){
 const relay=p.features.relay,business=relay?.businesses.find(b=>b.id===audit.businessId),stations=relay?.stations.filter(s=>s.businessId===audit.businessId)??[],target:RelaySceneTarget|null=business&&stations.length===1?{kind:'period',runId:p.view.runId,accountId:business.accountId,businessId:business.id,stationId:stations[0]!.id,periodId:audit.periodId}:null
 return <RelaySceneChoice p={p} target={target} onInspect={onFullRecord}>{open=>children(()=>open('audit'))}</RelaySceneChoice>
}
