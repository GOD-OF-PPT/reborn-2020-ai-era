import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText,playableThrough} from './game-text.ts'
import {RELAY_JOBS} from '../content/relay.ts'
import {relayResponseContext,relayResponseDraftCommand,relayResponseDraftIssue,useRelayResponseDraft,type RelayResponseDraft,type RelayResponseDraftUpdate,type RelayResponseMode,type RelayResponseSubject} from './relay-response-draft.ts'

export interface RelayResponseEditorView{readonly title:string;readonly body:ReactNode;readonly actions:ReactNode}
export interface RelayResponseEditorProps{
 p:GamePanelProps
 target:RelaySceneTarget
 subject:RelayResponseSubject
 mode:RelayResponseMode
 blockedReason?:string|null|undefined
 children?:((view:RelayResponseEditorView)=>ReactNode)|undefined
}
const titles:Record<RelayResponseMode,string>={collect:'这张原单，这次先收多少？','customer-refund':'这位客户，退还多少未消费原款？','supplier-refund':'这条供应，取回多少本站资产？',renew:'这份客户约定，还愿意怎样继续？',requote:'和哪些原客户，谈一份未来报价？',pay:'这张原欠款，这次先付多少？'}
const amountLabels:Partial<Record<RelayResponseMode,string>>={collect:'本次收取金额（元）','customer-refund':'本次退还客户金额（元）','supplier-refund':'本次取回供应资产（元）',pay:'本次支付原欠款金额（元）'}
const allLabels:Partial<Record<RelayResponseMode,string>>={collect:'填入本单全部净未收','customer-refund':'填入这位客户全部未消费余额','supplier-refund':'填入此供应全部未用资产',pay:'填入这张原欠款全部未结额'}
const fenInput=(value:number)=>Math.floor(value/100)+'.'+String(value%100).padStart(2,'0')

/** The same explicit response is rendered in the ticket and in the complete original book. */
export function RelayResponseEditor({p,target,subject,mode,blockedReason,children}:RelayResponseEditorProps){
 const context=relayResponseContext(p,target,subject,mode),[draft,update]=useRelayResponseDraft(p.view.runId,context.scope,p.relayResponseDraftMemory)
 const issue=context.reason??relayResponseDraftIssue(p,target,subject,mode,draft),command=issue?null:relayResponseDraftCommand(p,target,subject,mode,draft)
 const relay=p.features.relay,customer=context.customer,invoice=context.receivable,supplier=context.supplier,option=context.supplyOption,obligation=context.obligation,title=titles[mode]??'先找回这份原票'
 const customerNumber=customer&&relay?relay.customers.filter(row=>row.businessId===target.businessId).findIndex(row=>row.id===customer.id)+1:null
 const remaining=invoice?invoice.amountFen-invoice.collectedFen-invoice.reversedFen:null
 const maximum=mode==='collect'?remaining:mode==='customer-refund'?customer?.balance.prepaidFen:mode==='supplier-refund'?option?.credit?.remainingFen??0:mode==='pay'?obligation?.remainingFen:undefined
 const facts:ReactNode=invoice?<>
  <p>客户{customerNumber}的这一张原单 · 开单{invoice.date} · 原到期日{invoice.dueAt}。</p>
  <p>原金额{moneyText(invoice.amountFen)}；累计实收{moneyText(invoice.collectedFen)}；累计冲回{moneyText(invoice.reversedFen)}；净未收{moneyText(remaining!)}。</p>
  <p>这次只办理这张原单的显选金额；到账不重复确认收入，其余原单仍留在原账。</p>
 </>:customer?<>
  <p>客户{customerNumber} · 原合同{customer.signedAt}—{customer.termEnd} · {customer.mode==='prepaid'?'当前为先充值后消费':'当前为后付信用，上限'+moneyText(customer.creditLimitFen)}。</p>
  <p>尚未消费的原余额{moneyText(customer.balance.prepaidFen)}仍受保护；原应收{moneyText(customer.balance.receivableFen)}，其中已到期{moneyText(customer.dueReceivableFen)}。</p>
  {mode==='customer-refund'?<p>此处退还未消费原款；已经消费后的差额沿原更正另核。退款登记、实际付出和仍待付款分别保留，释放保护不产生利润。</p>:<p>这次只核新期限与收款条件，不自动充值或安排服务。原条款、已消费票据和仍存的旧预款保护不会被清掉。</p>}
 </>:obligation?<>
  <p>这张原欠款 · 原日期{obligation.date}{obligation.date>p.view.date?'尚未到期':'已经到期'} · 原金额{moneyText(obligation.amountFen)} · 当前未结{moneyText(obligation.remainingFen)}。</p>
  <p>本次只用这份原账户，按显选金额支付已有责任，不重复确认成本。其余未结额继续关联原单，可花与保护范围仍按原核对决定。</p>
  <p>{obligation.businessId===null?'这张原单未单列企业身份，按已核原账户归属处理；不冒称眼前本期新增费用。':'这张原单属于本站，具体来源仍留在它自己的原记录。'}</p>
 </>:supplier?<>
  <p>{supplier.label} · 本站未用预付/调账贷项资产{moneyText(option?.credit?.remainingFen??0)}；该供应原未付{moneyText(option?.outstandingFen??0)}。</p>
  <p>这是一间站跨期共用的资产池，不全属于眼前这期。取回是自有资金回到原账户，不是服务收入；原消耗成本、应付与客户保护继续分列。</p>
 </>:null
 const body=<section className="stack relay-response-body" aria-label={title}>
  {blockedReason?<p role="status" className="warning-box">{blockedReason}</p>:null}
  {context.reason?<p role="status" className="warning-box">{context.reason}</p>:<>
   {facts}
   {mode==='collect'||mode==='customer-refund'||mode==='supplier-refund'||mode==='pay'?<>
    <label className="field">{amountLabels[mode]}<input inputMode="decimal" autoComplete="off" value={draft.amount} onChange={event=>update(old=>({...old,amount:event.target.value}))}/></label>
    <button type="button" disabled={maximum===undefined||maximum===null||!Number.isSafeInteger(maximum)||maximum<=0} onClick={()=>{if(maximum!==undefined&&maximum!==null&&Number.isSafeInteger(maximum)&&maximum>0)update(old=>({...old,amount:fenInput(maximum)}))}}>{allLabels[mode]}</button>
    <p className="field-help">填入全部只改这次填写；看清之后，仍由你另行确认。</p>
   </>:mode==='renew'?<RelayRenewFields p={p} draft={draft} update={update}/>:<RelayRequoteFields p={p} target={target} draft={draft} update={update}/>}
   {issue?<p role="status" className="field-help">{issue}</p>:null}
  </>}
 </section>
 // Display text is not a permission gate. The original CommandButton owns the
 // current snapshot check, rule preview, confirmation and request binding.
 const actions=command?<CommandButton {...p} {...command}/>:<button type="button" disabled>先填清这次回应，再核对决定</button>
 const view={title,body,actions}
 return children?children(view):<section className="stack relay-response-editor" aria-label={title}><h3>{title}</h3>{body}{actions}</section>
}

export function RelayRenewFields({p,draft,update}:{p:GamePanelProps;draft:RelayResponseDraft;update:RelayResponseDraftUpdate}){
 return <div className="stack relay-renew-fields">
  <label className="field">本次新有效期<input type="date" min={p.view.date} max={playableThrough} value={draft.termEnd} onChange={event=>update(old=>({...old,termEnd:event.target.value}))}/></label>
  <label className="field">本次续签收款条件<select value={draft.paymentMode} onChange={event=>{const mode=event.target.value;if(mode==='prepaid'||mode==='postpaid')update(old=>({...old,paymentMode:mode}))}}><option value="" disabled>明确选择预付或后付</option><option value="prepaid">先充值后消费</option><option value="postpaid">后付信用</option></select></label>
  {draft.paymentMode==='postpaid'?<label className="field">本次新后付信用上限（元，可填0）<input inputMode="decimal" autoComplete="off" value={draft.creditLimit} onChange={event=>update(old=>({...old,creditLimit:event.target.value}))}/></label>:draft.paymentMode==='prepaid'?<p>明确选择先充值后消费，本次后付信用为0；已有旧预款与原应收继续留在原账。</p>:null}
  <p>新期限须晚于原期限；最长续签窗口及当前旧约条件仍由原核对决定。过期填写保留，不自动改成今天。</p>
 </div>
}

export function RelayRequoteFields({p,target,draft,update}:{p:GamePanelProps;target:RelaySceneTarget;draft:RelayResponseDraft;update:RelayResponseDraftUpdate}){
 const relay=p.features.relay
 if(!relay)return <p role="status">原客户和报价资料尚未取得。</p>
 const allCustomers=relay.customers.filter(row=>row.businessId===target.businessId),available=allCustomers.filter(row=>row.closedAt===null)
 const unavailableCustomers=draft.customerIds.filter(id=>available.filter(row=>row.id===id).length!==1),unavailableResources=draft.resources.filter(id=>relay.resources.filter(row=>row.id===id).length!==1),definition=RELAY_JOBS.find(row=>row.id==='relay-requote')
 const toggle=(key:'customerIds'|'resources',id:string,checked:boolean)=>update(old=>({...old,[key]:checked?[...old[key],id]:old[key].filter(value=>value!==id)}))
 return <div className="stack relay-requote-fields">
  <p>旧账单与已确认的本期支持报价保持原约定。客户可以拒绝未来方案；新的价格不是已经取得的收入。</p>
  <fieldset><legend>这次明确想谈哪些原客户</legend>{available.map(customer=><label className="radio-line" key={customer.id}><input type="checkbox" checked={draft.customerIds.includes(customer.id)} onChange={event=>toggle('customerIds',customer.id,event.target.checked)}/><span>客户{allCustomers.findIndex(row=>row.id===customer.id)+1} · 原合同至{customer.termEnd}<small>{customer.mode==='prepaid'?'先充值后消费':'后付信用'}；已有原价与旧票据保留</small></span></label>)}</fieldset>
  {unavailableCustomers.map((id,index)=><p className="warning-box" key={id+':'+index}>一位原选择现已不可用，未代你从谈判名单删去。<button type="button" onClick={()=>update(old=>({...old,customerIds:old.customerIds.filter(value=>value!==id)}))}>明确移除这位不可用的原客户</button><small>原引用 {id}</small></p>)}
  <label className="field">本次拟谈收费方案<select value={draft.offerKind} onChange={event=>{const choice=event.target.value;if(choice==='managed_support'||choice==='low_margin')update(old=>({...old,offerKind:choice}))}}><option value="" disabled>明确写下未来方案</option>{relay.catalog.offers.map(offer=><option key={offer.id} value={offer.id}>{offer.id==='managed_support'?'实际支持完成后收服务费':'纯用量方案'}</option>)}</select></label>
  <label className="field">本次拟谈用量单价（分/千模拟token）<input type="number" min="1" max="100" value={draft.unitPrice} onChange={event=>update(old=>({...old,unitPrice:event.target.value}))}/></label>
  <fieldset><legend>本次实际谈判资源</legend>{relay.resources.map(resource=><label className="radio-line" key={resource.id}><input type="checkbox" checked={draft.resources.includes(resource.id)} onChange={event=>toggle('resources',resource.id,event.target.checked)}/><span>{resource.label}</span></label>)}</fieldset>
  {unavailableResources.map((id,index)=><p className="warning-box" key={id+':'+index}>一项原资源现已不可用，未自动换给本人。<button type="button" onClick={()=>update(old=>({...old,resources:old.resources.filter(value=>value!==id)}))}>明确移除这项不可用的原资源</button><small>原引用 {id}</small></p>)}
  <label className="field">本次谈判开工日<input type="date" min={p.view.date} max={playableThrough} value={draft.startAt} onChange={event=>update(old=>({...old,startAt:event.target.value}))}/></label>
  <label className="field">本次未来报价最早生效日<input type="date" min={p.view.date} max={playableThrough} value={draft.effectiveAt} onChange={event=>update(old=>({...old,effectiveAt:event.target.value}))}/></label>
  {definition?<p>这次原谈判{moneyText(definition.costFen)}、{definition.actionPoints}点、{definition.durationDays}日；员工工资和已有安排另计。未来报价至少在原开工后第8日生效，且仍须符合各客户原期限，由原核对裁定。</p>:null}
 </div>
}
