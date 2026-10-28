import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {GamePanelProps} from './game-types.ts'
import {moneyText} from './game-text.ts'
import {addDays} from '../core/calendar.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'

type Props={command:CommandEnvelope;preview:CommandPreview;view:Pick<GamePanelProps['view'],'runId'|'revision'|'date'|'accounts'>;features:Pick<GamePanelProps['features'],'deepseek'>;accountName:(id:string)=>string}
const one=<T,>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
const amount=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0

/** Captured with the original confirmation. It neither reads the controller
 * nor computes a new quote, fee, permission or committed cash result. */
export function EquityDecisionFacts({command,preview,view,features,accountName}:Props){
 if(!['StartEquityNegotiation','SignEquityAgreement','AcceptEquityExit','CollectEquityExit'].includes(command.kind))return null
 const capital=command.kind==='StartEquityNegotiation'||command.kind==='SignEquityAgreement'
 const bad=(reason:string)=><section className="warning-box"><h3>{capital?'先核对这份原参与条件':'先核对这笔原转让款'}</h3><p>{reason} 请返回这份原记录重新核对；没有换成另一笔款项。</p></section>
 if(command.runId!==view.runId||command.expectedRevision!==view.revision)return bad('这份确认已经不属于眼前的原记录。')
 const body=typeof command.payload==='object'&&command.payload!==null&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:{},v=features.deepseek
 if(capital){
  const signing=command.kind==='SignEquityAgreement',n=signing&&typeof body.negotiationId==='string'?one(v?.negotiations.filter(n=>n.id===body.negotiationId)??[]):undefined
  const invitationId=signing?n?.invitationId:body.invitationId,i=typeof invitationId==='string'?one(v?.invitations.filter(i=>i.id===invitationId)??[]):undefined
  const b=i?one(v?.businesses.filter(b=>b.id===i.businessId)??[]):undefined,termsId=signing?n?.termsId:body.termsId,t=one(v?.catalog.terms.filter(t=>t.id===termsId)??[])
  const principal=signing?n?.amountFen:body.amountFen,acquisition=signing?n?.kind:body.acquisitionKind
  if(!preview.allowed||!i||!b||!t||view.accounts.filter(a=>a.accountId===b.accountId).length!==1||!amount(principal)||principal<=0||!amount(preview.upfrontCostFen)||!amount(t.lockDays)||!['new_capital','secondary'].includes(String(acquisition))||signing&&(!n||n.businessId!==b.id||n.accepted!==true||n.closedAt!==null||n.expired||!amount(n.shares)||n.shares===0||preview.upfrontCostFen!==principal))return bad('本次本金、原邀请、条款或付款主体尚未完整核定。')
  const method=acquisition==='new_capital'?'新增项目资本':'支付老股卖方，不增加项目资本',rights=(t.board?'一席董事，无单方控制；':'无董事权；')+(t.preemptive?'有原跟投权，仍须另行决定；':'无跟投权；')+(t.transferConsent?'转让仍须原同意与独立买方。':'不承诺转让同意。')
  if(signing)return <section className="equity-decision-facts" aria-label="本次原协议的实际付款"><p className="command-introduction">{accountName(b.accountId)} · {view.date} · 本次实际支付{moneyText(principal)}，取得{n!.shares}模拟股；原{t.label}，锁定{t.lockDays}日。</p><dl className="command-facts"><div><dt>本次实际支付本金</dt><dd>{moneyText(principal)}</dd></div><div><dt>原协议模拟股数</dt><dd>{n!.shares}股</dd></div><div><dt>取得方式</dt><dd>{method}</dd></div><div><dt>本次行动占用</dt><dd>{preview.actionPoints}点</dd></div></dl><p>{rights} 原条款有效至{n!.expiresAt}；原邀请有效至{i.expiresAt}。</p><p>保存成功后，现金才转为这份投资资产；账面值不能花。原调查和谈判费用已经发生，本次不重复支付，也不保证收入或退出。</p></section>
  const resources=Array.isArray(body.resources)?body.resources.map(id=>one(v?.resources.filter(r=>r.id===id)??[])):[],job=DEEPSEEK_JOBS.find(j=>j.id==='deepseek-negotiation')
  if(typeof body.startAt!=='string'||body.startAt<view.date||preview.actionDate!==undefined&&preview.actionDate!==body.startAt||!resources.length||resources.some(r=>!r)||new Set(body.resources as string[]).size!==resources.length||!job)return bad('本次原资源、开工日或谈判安排尚未完整核定。')
  let expectedReply:string
  try{expectedReply=addDays(body.startAt,job.durationDays)}catch{return bad('本次原开工日期尚未完整核定。')}
  return <section className="equity-decision-facts" aria-label="本次原谈判的实际选择"><p className="command-introduction">{accountName(b.accountId)} · {body.startAt}开工，按原安排{expectedReply}等回应 · 开工季度{preview.actionPoints}点。</p><dl className="command-facts"><div><dt>拟议本金，尚未付款</dt><dd>{moneyText(principal)}</dd></div><div><dt>取得方式</dt><dd>{method}</dd></div><div><dt>{body.startAt>view.date?'本次先预留谈判预算':'本次实际谈判支出'}</dt><dd>{moneyText(preview.upfrontCostFen)}</dd></div><div><dt>已选权利与锁定</dt><dd>{t.label} · {t.lockDays}日</dd></div></dl><p>原资源：{resources.map(r=>r!.label).join('、')}。{rights}</p><p>这次只安排谈判，不支付{moneyText(principal)}本金，也不获得股份。对方仍可能拒绝；只有以后另行确认签署并实际保存，才支付本金、取得股份。{body.startAt>view.date?'当前只预留本次预算，实际开工才支付和使用开工季度行动。':''}</p></section>
 }
 const exit=typeof body.exitId==='string'?one(v?.exits.filter(e=>e.id===body.exitId)??[]):undefined
 const agreement=exit?one(v?.agreements.filter(a=>a.id===exit.agreementId&&a.businessId===exit.businessId)??[]):undefined
 const business=agreement?one(v?.businesses.filter(b=>b.id===agreement.businessId&&b.accountId===agreement.accountId)??[]):undefined
 if(!exit||!agreement||!business||view.accounts.filter(a=>a.accountId===agreement.accountId).length!==1)return bad('原报价、协议或收款账户尚未唯一核定。')
 const context=(next='')=><p className="command-introduction">{accountName(agreement.accountId)} · {view.date} · 本次使用{preview.actionPoints}点{next?' · '+next:''}</p>
 if(command.kind==='AcceptEquityExit'){
  const sale=preview.privateSale
  if(!sale||!amount(body.shares)||body.shares<=0||sale.shares!==body.shares||![sale.grossFen,sale.feeFen,sale.netReceivableFen].every(amount)||sale.grossFen-sale.feeFen!==sale.netReceivableFen||body.shares>agreement.shares)return bad('本次股数、原累计费用或净应收尚未完整核定。')
  return <section className="equity-decision-facts" aria-label="本次原转让的实际承担">{context('最早收款'+sale.dueAt+'；确认后余'+(agreement.shares-sale.shares)+'股，现金暂不增加')}<dl className="command-facts"><div><dt>本次实际转让</dt><dd>{sale.shares}模拟股</dd></div><div><dt>原报价总价</dt><dd>{moneyText(sale.grossFen)}</dd></div><div><dt>从价款扣除的转让费</dt><dd>{moneyText(sale.feeFen)}</dd></div><div><dt>形成净应收，尚未到账</dt><dd>{moneyText(sale.netReceivableFen)}</dd></div></dl><p>最早{sale.dueAt}才可收取；确认当下现金不增加，本次即时现金支出{moneyText(preview.upfrontCostFen)}。未转的{agreement.shares-sale.shares}股与原记录保留。</p></section>
 }
 const credit=exit.receivable,value=body.amountFen
 if(!credit||!amount(value)||value<=0||!amount(credit.remainingFen)||value>credit.remainingFen||!amount(exit.collectedFen))return bad('本次拟收金额或本笔原未收余额尚未完整核定。')
 return <section className="equity-decision-facts" aria-label="本次原款的实际收取">{context()}<dl className="command-facts"><div><dt>本次实际收取现金</dt><dd>{moneyText(value)}</dd></div><div><dt>收后仍待收取</dt><dd>{moneyText(credit.remainingFen-value)}</dd></div></dl><p>本笔原未收{moneyText(credit.remainingFen)}，原先已收{moneyText(exit.collectedFen)}；约定日期{credit.dueAt}。本次新增费用{moneyText(preview.upfrontCostFen)}。</p><p>确认保存后才增加本次现金，不重复确认投资收益；未收余款与原持股继续保留。</p></section>
}
