import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {relaySceneProgress,type RelaySceneProgress} from './relay-scene-progress.ts'
import {Dialog} from './Dialog.tsx'
import {moneyText,lifecycleText} from './game-text.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {isRelayPreparationSlot,type RelayChoiceDraftSlot} from './relay-preparation-draft.ts'
import {RelayPreparationEditor} from './RelayPreparationEditor.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {relayReviewDate,relayReviewLabel,relayDeferredFeedback} from './relay-scene-clock.ts'
import {relayJourneyAction,relayJourneyScene,relayClosedPeriodTarget,type RelayChoiceIntent} from './relay-journey.ts'
import {RELAY_JOBS} from '../content/relay.ts'
import {RelayAuditEditor,RelayServiceChoice,relayChoiceContext} from './RelayServiceChoice.tsx'
import {RelayRecordBook,relayRecordSuggestedKey} from './RelayRecordBook.tsx'
import {relayRecordRows} from './relay-records.ts'
import {relayCasebookRecordId} from './relay-record-memory.ts'
import {RelayResponseEditor} from './RelayResponseEditor.tsx'
import {relayNextServiceContract} from './relay-next-service-contract.ts'
import {makeSharedAction} from './shared-action.ts'

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
  const add=(t:RelaySceneTarget,title:string,line:string)=>{if(resolveRelaySceneTarget(relay,t,context).status==='valid')rows.push({target:t,title,line})}
  for(const application of relay.applications.filter(row=>row.businessId===business.id))add({...identity,kind:'application',applicationId:application.id},'供应回信 · '+application.appliedAt,application.read?'已经亲读的原结果，许可与适配另核。':'原申请与尚未亲读的回信，不预告批准或拒绝。')
  for(const audience of relay.audiences.filter(row=>row.businessId===business.id))add({...identity,kind:'audience',audienceId:audience.id},'需求回信 · '+audience.createdAt,audience.completedAt===null?'获客尚未实际完成。':audience.members.length+'位原潜客，签约另行显选。')
  for(const customer of relay.customers.filter(row=>row.businessId===business.id))add({...identity,kind:'customer',customerId:customer.id},'客户约定 · '+customer.signedAt+' · '+customer.personId.slice(-6)+' · '+(customer.mode==='prepaid'?'预付余额'+moneyText(customer.balance.prepaidFen):'后付信用'+moneyText(customer.creditLimitFen)),(customer.closedAt?'原合同已关闭；':'原合同至'+customer.termEnd+'；')+'原应收'+moneyText(customer.balance.receivableFen)+'，充值、服务和收款分别决定。')
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
 onInspect:(target:RelaySceneTarget|null,slot?:RelayChoiceDraftSlot,recordId?:string)=>void
 onToday?:(()=>void)|undefined
 onLife?:(()=>void)|undefined
 children:(open:(intent?:RelayChoiceIntent)=>void)=>ReactNode
}
type NextServiceProps={p:GamePanelProps;target:Extract<RelaySceneTarget,{kind:'business'}>;blockedReason?:string|null|undefined;onInspect:RelaySceneChoiceProps['onInspect'];onClose:()=>void;onPickAnother?:(()=>void)|undefined}
/** A renewal is another explicit original response, never a change of the room's bookmark. */
export function RelayNextServiceConditions({p,target,blockedReason,onInspect,onClose,onPickAnother}:NextServiceProps){
 const scope=JSON.stringify([p.view.runId,target]),[selected,setSelected]=useState<{scope:string;id:string|null}>({scope,id:null}),[renewing,setRenewing]=useState<{scope:string;id:string}|null>(null),name=useId()
 const contract=relayNextServiceContract(p,target),v=p.features.relay,business=v?.businesses.find(b=>b.id===target.businessId),service=RELAY_JOBS.find(job=>job.id==='relay-service')!
 const pick=selected.scope===scope?selected.id:null,renewId=renewing?.scope===scope?renewing.id:null,customer=renewId?v?.customers.filter(c=>c.id===renewId&&c.businessId===target.businessId):[]
 const read=(activate:()=>void)=>makeSharedAction(p,'核对同企业新一期的原条件',activate,{allowReadOnly:true}).activate(),busy=makeSharedAction(p,'核对同企业新一期的原条件',()=>{},{allowReadOnly:true}).disabled
 const same=contract.reason===null&&!!business,terms=contract.reason===null?v?.customers.filter(c=>c.businessId===target.businessId)??[]:[],canDraft=contract.customers.some(c=>c.coverage==='covers')
 const inspect=()=>read(()=>onInspect(target,'service'))
 const pickAnother=onPickAnother?<button type="button" disabled={busy} onClick={()=>read(onPickAnother)}>明确翻选另一份原服务</button>:null
 const introduction=<section aria-label="拟新一期前，先看清当前条件"><p>这是一次新的服务约定。已有原期与未完约定继续保留，客户余额仍需留给客户；客户、线路顺序、预算与支持都由你明确选择。</p>
  {same&&business?<><p>本站{lifecycleText[business.lifecycle]}；当前可花{moneyText(business.funds.availableFen)}，客户保护{moneyText(business.funds.prepaidLiabilityFen)}，供应资产{moneyText(business.funds.supplierPrepaidFen)}。本季可用{p.view.budget.available}点，开工和支持要分别留出所在季度的时间。</p>
  <p>服务本身需{moneyText(service.costFen)}、{service.actionPoints}点、{v!.catalog.serviceDays}日；支持方式与额外投入另行显选。期限够用后，资金、供应、资源和所选日期还要一起核对。</p></>:null}
  {contract.window?<p role="status">今天之后最早可明确安排{contract.window.from}—{contract.window.to}，后者是原服务结束边界；按原合同规则，有效期至少须到{contract.window.minimumTermEnd}。这里没有替你填入开工日或续签日期。</p>:<p role="status" className="warning-box">{contract.reason}</p>}
  {same&&!canDraft?<p role="status">目前没有一份已核原合同能覆盖这个最早窗口。先明确核对一位原客户的续签条件，或合上保留草稿；先把原期限谈清，再写新的服务安排。</p>:same?<p>已有原合同能覆盖最早窗口，可以直接显选本期客户，不强制续签。选更晚日期仍需重新核对覆盖范围。</p>:null}
  {same?<fieldset><legend>若要续签，先明确选择一位原客户</legend>{contract.customers.map(c=><label className="radio-line" key={c.id}><input type="radio" name={name} checked={pick===c.id} disabled={busy} onChange={()=>read(()=>setSelected({scope,id:c.id}))}/><span>客户{c.number} · 原合同至{c.termEnd}<small>{c.reason}</small></span></label>)}</fieldset>:null}
  {same?<button type="button" disabled={busy||pick===null||terms.filter(c=>c.id===pick).length!==1} onClick={()=>{if(pick!==null&&terms.filter(c=>c.id===pick).length===1)read(()=>setRenewing({scope,id:pick}))}}>明确核对这位原客户的续签条件</button>:null}
  <details><summary>核对客户当前有效条款与旧余额</summary>{terms.map((c,index)=>{const condition=contract.customers.find(row=>row.id===c.id),known=condition?.termsKnown===true;return <p key={c.id}>客户{index+1} · 合同至{c.termEnd}{condition?.coverage==='closed'?' · 原合同已关闭':condition&&condition.coverage!=='unknown'&&c.termEnd<p.view.date?' · 已过原期限，续签须另行决定':''}；{known?'当前用量价'+moneyText(c.activeTerms.unitPriceFen)+'，周期支持基准'+moneyText(c.activeTerms.serviceFeeFen)+'，生效于'+c.activeTerms.effectiveAt+'；原来源 '+c.activeTerms.sourceId:'当前有效报价需回原合同核对'}；原预款仍保护{moneyText(c.balance.prepaidFen)}，原应收{moneyText(c.balance.receivableFen)}。</p>})}<p>谈妥但尚未生效的新报价不替换当前价；旧计量与原支持不重算。</p></details>
 </section>
 if(renewId&&same&&customer?.length===1)return <RelayResponseEditor p={p} target={target} subject={{kind:'customer',id:renewId}} mode="renew" blockedReason={blockedReason}>{view=><Dialog title={view.title} className="opening-paper relay-choice-paper" onClose={()=>read(()=>setRenewing(null))} footer={<>{view.actions}<button type="button" onClick={()=>read(()=>setRenewing(null))}>返回同企业新期条件，保留两份草稿</button><button type="button" disabled={busy} onClick={inspect}>翻看同企业原册，保留两份草稿</button><button type="button" onClick={onClose}>合上续签，仍留原期书签</button></>}>
  <p>只核客户{contract.customers.find(c=>c.id===renewId)?.number}的原续签；没有开新服务、收款或清除旧余额。取消后仍回同一企业的新期条件，原期书签不变。</p>{view.body}
 </Dialog>}</RelayResponseEditor>
 if(renewId&&(!same||customer?.length!==1))return <Dialog title="先找回，这位原客户" className="opening-paper relay-choice-paper" onClose={onClose} footer={<><button type="button" onClick={()=>read(()=>setRenewing(null))}>返回原企业条件，明确重选</button><button type="button" onClick={onClose}>合上，保留原期书签</button></>}><p role="status" className="warning-box">原来选择的续签客户已经不能唯一核对；没有换成另一位，也没有继续另一份服务。</p></Dialog>
 if(!same||!canDraft)return <Dialog title="先看清，新一期能否守住原约" className="opening-paper relay-choice-paper" onClose={onClose} footer={<><button type="button" disabled={busy} onClick={inspect}>翻看同企业原册，保留这份草稿</button>{pickAnother}<button type="button" onClick={onClose}>先合上，保留草稿与原期书签</button></>}>{blockedReason?<p role="status" className="warning-box">{blockedReason}</p>:null}{introduction}{renewId?<p role="status" className="warning-box">原来选择的续签客户已经不能唯一核对；没有换成另一位。</p>:null}</Dialog>
 return <RelayServiceChoice p={p} target={target} blockedReason={blockedReason} onInspect={onInspect} onClose={onClose}>{view=><Dialog title={view.title} className="opening-paper relay-choice-paper" onClose={onClose} footer={<>{view.actions}{pickAnother}</>}>{introduction}{view.body}</Dialog>}</RelayServiceChoice>
}

/** Every entrance keeps the original identity and the same explicit editor. */
export function RelaySceneChoice({p,target,blockedReason,onTargetChange,onInspect,onToday,onLife,children}:RelaySceneChoiceProps){
 const sourceKey=p.view.runId+'|'+JSON.stringify(target),source=useRef({key:sourceKey,version:0})
 if(source.current.key!==sourceKey)source.current={key:sourceKey,version:source.current.version+1}
 const [local,setLocal]=useState<{version:number;target:RelaySceneTarget|null|undefined}>({version:source.current.version,target}),current=onTargetChange?target:local.version===source.current.version?local.target:target
 const scopedP=!onTargetChange&&local.version===source.current.version&&local.target!==target?{...p,accountId:current?.accountId??'personal'}:p
 const resolution=current===undefined?null:resolveRelaySceneTarget(scopedP.features.relay,current,relayChoiceContext(scopedP)),progress=relaySceneProgress(scopedP.features.relay,scopedP.view.date,current,relayChoiceContext(scopedP))
 const [open,setOpen]=useState(false),[picker,setPicker]=useState(false),[requested,setRequested]=useState<RelayChoiceIntent|undefined>(undefined),openedRevision=useRef(p.view.revision)
 useEffect(()=>{if(p.view.hasCandidate||p.view.saveStatus==='conflict'||open&&p.view.revision!==openedRevision.current&&p.view.saveStatus==='saved')setOpen(false)},[p.view.hasCandidate,p.view.saveStatus,p.view.revision,open])
 const choose=(next:RelaySceneTarget|null)=>{if(bookmarkLocked(p))return;setLocal({version:source.current.version,target:next});onTargetChange?.(next);setPicker(false);setRequested(undefined)}
 const activate=(intent?:RelayChoiceIntent)=>{openedRevision.current=p.view.revision;setRequested(intent);setPicker(intent==='objects'||current===undefined||resolution?.status==='invalid');setOpen(true)}
 const inspect=(value:RelaySceneTarget|null,slot?:RelayChoiceDraftSlot,recordId?:string)=>{setOpen(false);if(recordId!==undefined)onInspect(value,slot,recordId);else onInspect(value,slot)}
 const journey=relayJourneyAction(scopedP,current),slot=requested??journey.intent,valid=resolution?.status==='valid'&&current!==null&&current!==undefined
 const decision=progress&&!progress.historical&&!progress.wait&&!progress.command?relayJourneyScene(journey):null
 const original=valid&&current.kind==='period'&&(current.jobId!==undefined||current.meterId!==undefined)
 const editable=valid&&!original&&(slot==='service'?current.kind==='business':slot==='audit'?current.kind==='period':false)
 const close=()=>setOpen(false),business=resolution?.business
 const businessTarget:RelaySceneTarget|null=valid?{kind:'business',runId:current.runId,accountId:current.accountId,businessId:current.businessId,stationId:current.stationId}:null
 const select=(next:RelaySceneTarget|null,intent?:RelayChoiceIntent)=>{choose(next);setRequested(intent)}
 let content:ReactNode=null
 if(open&&picker)content=<Dialog title="先找回，同一份原服务" className="opening-paper relay-choice-paper" onClose={close}><p role="status">{resolution?.reason??'明确选择原站点、回信、客户或账期；翻阅不签约、不充值。'}</p><RelayTargetPicker p={p} current={current} onConfirm={next=>select(next,next===null?'open':undefined)}/><button type="button" onClick={close}>先合上，不换对象</button></Dialog>
 else if(open&&valid&&current&&slot==='record'){
  const exact=current.kind==='application'||current.kind==='audience'||current.kind==='period'&&(current.meterId!==undefined||current.jobId!==undefined)
  const key=exact?relayRecordSuggestedKey(scopedP,current,relayRecordRows(scopedP,current).rows):undefined
  content=<RelayRecordBook p={scopedP} target={current} initialRecordKey={key} blockedReason={blockedReason} onFullRecord={(next,record,preparation)=>inspect(next,preparation,record?relayCasebookRecordId(record):undefined)}>{view=><Dialog title={view.title} className="opening-paper relay-choice-paper" onClose={close} footer={<>{view.actions}<button type="button" onClick={close}>先合上，保留原票与填写</button></>}>{view.body}</Dialog>}</RelayRecordBook>
 }
 else if(open&&slot==='next-service'){
  const nextTarget=relayClosedPeriodTarget(scopedP,current)
  content=nextTarget?<RelayNextServiceConditions p={scopedP} target={nextTarget} blockedReason={blockedReason} onInspect={inspect} onClose={close} onPickAnother={()=>setPicker(true)}/>:<Dialog title="先找回，这一期的实际结果" className="opening-paper relay-choice-paper" onClose={close}><p role="status">原期来源或状态已经变化；没有换到另一间站，也没有沿旧画面拟新约。先翻回同一份原记录，再明确决定。</p><button type="button" onClick={close}>回到原场景，不新增安排</button></Dialog>
 }
 else if(open&&isRelayPreparationSlot(slot)&&current!==undefined&&resolution?.status!=='invalid')content=<RelayPreparationEditor p={scopedP} target={current} slot={slot} blockedReason={blockedReason} onInspect={inspect} onClose={close}>{view=><Dialog title={view.title} className="opening-paper relay-choice-paper" onClose={close} footer={<>{view.actions}<button type="button" onClick={()=>setRequested('more')}>看看本站的其他选择</button></>}>{view.body}</Dialog>}</RelayPreparationEditor>
 else if(open&&editable&&current)content=slot==='service'&&current.kind==='business'?<RelayNextServiceConditions p={scopedP} target={current} blockedReason={blockedReason} onInspect={inspect} onClose={close} onPickAnother={()=>setPicker(true)}/>:<RelayAuditEditor p={scopedP} target={current} blockedReason={blockedReason} onInspect={inspect} onClose={close}>{view=><Dialog title={view.title} className="opening-paper relay-choice-paper" onClose={close} footer={<>{view.actions}<button type="button" onClick={()=>setPicker(true)}>明确翻选另一份原服务</button></>}>{view.body}</Dialog>}</RelayAuditEditor>
 else if(open){
  const job=resolution?.job,meter=resolution?.meter,period=resolution?.period,customer=resolution?.customer
  const nextPeriod=valid&&current.kind==='period'?{kind:'period' as const,runId:current.runId,accountId:current.accountId,businessId:current.businessId,stationId:current.stationId,periodId:current.periodId}:null
  const waitDate=p.view.phase==='playing'&&!p.features.workbench.atQuarterEnd&&progress?.wait&&p.features.workbench.pause===null&&!p.features.workbench.progression.requiresDelivery?relayReviewDate(scopedP,playableAdvanceDate(p.features.workbench,p.view.date,progress.wait.date)):null
  const deferred=progress?.command?.kind==='CollectRelayDue'?relayDeferredFeedback(scopedP,current):null
  const options:readonly [RelayChoiceDraftSlot,string][]=[['capital','核对本站自有资本'],['basics','补齐服务技术基础'],['materials','准备供应申请材料'],['application','选择供应并准备申请'],['adapter','选择已许可线路并实际适配'],['marketing','选择客群与获客方式'],['offer','写明报价与服务方案'],['customers','显选原报价与具体潜客签约'],['customer-funds','核对一位客户的本次充值'],['supplier-funds','核对一项供应的自有预付'],['service','另拟一期服务与支持']]
  content=<Dialog title={slot==='next'?'这一段之后，把日子留给什么':slot==='more'?'这间站，仍由你决定怎样经营':job?'这份原任务，仍有自己的日期':meter?'原计量，和它真正的依据':'灯下，这一份原服务'} className="opening-paper relay-choice-paper" onClose={close} footer={<button type="button" onClick={close}>先合上，不新增安排</button>}>
   {blockedReason?<p role="status" className="warning-box">{blockedReason}</p>:null}
   {progress?<><h3>{decision?.title??progress.title}</h3><p>{decision?.line??progress.line}</p>{decision?<p>这一步想做到：{decision.finishWhen}</p>:null}</>:null}
   {job?<p>{job.status==='planned'?'已预留，尚未开工':job.status==='running'?'正在进行，尚未完成':job.status==='completed'?'原任务已经实际完成':'原任务已停止，已耗成本仍保留'} · {job.startAt}—{job.completeAt}。{resolution?.audit?'该次原批次覆盖'+resolution.audit.meterCount+'条已有计量，后来请求仍另核。':''}</p>:null}
   {meter?<p>{meter.date} · 原报告{meter.reportedUnits} · {meter.auditedUnits===null?'实计待独立复核':'原已复核实计'+meter.auditedUnits} · {meter.correctionId?'原更正已追加':'原量、原价与未处理责任保留'}。</p>:null}
   {period&&progress?<RelayServiceRecord p={scopedP} progress={progress} onFullRecord={()=>inspect(current??null)}/>:customer?<p>原合同{customer.signedAt}—{customer.termEnd}；未消费余额{moneyText(customer.balance.prepaidFen)}，已到期原应收{moneyText(customer.dueReceivableFen)}。签约、保护、收入与收款分别发生。</p>:business?<p>本站可花{moneyText(business.funds.availableFen)}；客户保护{moneyText(business.funds.prepaidLiabilityFen)}、供应资产{moneyText(business.funds.supplierPrepaidFen)}、应收{moneyText(business.funds.receivableFen)}、应付{moneyText(business.funds.payableFen)}。</p>:<p>先显选个人自有资金与当前资格，开站不代表完成准备、获客或收入。</p>}
   {original&&nextPeriod?<button type="button" disabled={bookmarkLocked(p)} onClick={()=>select(nextPeriod)}>明确回到本期当前记录，再决定下一步</button>:null}
   {deferred?<ClockAdvance p={scopedP} date={deferred.date} label={deferred.label+' · '+deferred.date}/>:null}
   {slot==='record'&&journey.command?<CommandButton {...scopedP} {...journey.command} label={journey.label}/>:null}
   {slot==='next'&&progress?.wait&&waitDate?<ClockAdvance p={scopedP} date={waitDate} label={relayReviewLabel(scopedP,waitDate,waitDate===progress.wait.date?progress.wait.label:'先到日历上的这一日')+' · '+waitDate}/>:null}
   {slot==='more'&&businessTarget?options.map(([intent,label])=><button type="button" key={intent} disabled={bookmarkLocked(p)} onClick={()=>select(intent==='customers'&&current?.kind==='audience'||intent==='customer-funds'&&current?.kind==='customer'?current:businessTarget,intent)}>{label}</button>):null}
   {slot!=='more'&&businessTarget&&current?.kind!=='business'&&!original?<button type="button" disabled={bookmarkLocked(p)} onClick={()=>select(businessTarget)}>继续核对本站的当前准备与约定</button>:null}
   {slot!=='more'&&businessTarget?<button type="button" disabled={bookmarkLocked(p)} onClick={()=>setRequested('more')}>核对新的尝试、收缩或停止方式</button>:null}
   {valid?<button type="button" onClick={()=>setRequested('record')}>翻开同一对象的原票，逐项回应</button>:null}
   {slot==='more'&&businessTarget&&business?.lifecycle==='operating'?<CommandButton {...scopedP} kind="PauseBusiness" payload={{businessId:businessTarget.businessId}} label="先暂停接受新合同，保留已有责任" confirm/>:null}
   {slot==='more'&&businessTarget&&business?.lifecycle!=='closed'&&business?.lifecycle!=='winding_down'?<CommandButton {...scopedP} kind="StopRelayStation" payload={{businessId:businessTarget.businessId}} label="核对并停站收尾，旧余额与欠款保留" confirm/>:null}
   {onToday?<button type="button" disabled={bookmarkLocked(p)} onClick={()=>{close();onToday()}}>回到今天，看看接下来的日子</button>:null}
   {onLife?<button type="button" disabled={bookmarkLocked(p)} onClick={()=>{close();onLife()}}>看看自己的生活安排</button>:null}
   <button type="button" onClick={()=>inspect(current??null)}>翻开同对象的完整原册 ↗</button>
   <button type="button" onClick={()=>setPicker(true)}>明确翻选另一份原对象</button>
  </Dialog>
 }
 return <>{children(activate)}{content}</>
}

/** Older audit entry points resolve their original period, then use the same explicit editor. */
export function RelayAuditChoice({p,audit,onFullRecord,children}:{p:GamePanelProps;audit:NonNullable<RelaySceneProgress['audit']>;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode}){
 const relay=p.features.relay,business=relay?.businesses.find(b=>b.id===audit.businessId),stations=relay?.stations.filter(s=>s.businessId===audit.businessId)??[],target:RelaySceneTarget|null=business&&stations.length===1?{kind:'period',runId:p.view.runId,accountId:business.accountId,businessId:business.id,stationId:stations[0]!.id,periodId:audit.periodId}:null
 return <RelaySceneChoice p={p} target={target} onInspect={onFullRecord}>{open=>children(()=>open('audit'))}</RelaySceneChoice>
}
