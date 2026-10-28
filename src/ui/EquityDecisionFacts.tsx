import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {GamePanelProps} from './game-types.ts'
import {moneyText} from './game-text.ts'

type Props={command:CommandEnvelope;preview:CommandPreview;view:Pick<GamePanelProps['view'],'runId'|'revision'|'date'|'accounts'>;features:Pick<GamePanelProps['features'],'deepseek'>;accountName:(id:string)=>string}
const one=<T,>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
const amount=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0

/** Captured with the original confirmation. It neither reads the controller
 * nor computes a new quote, fee, permission or committed cash result. */
export function EquityDecisionFacts({command,preview,view,features,accountName}:Props){
 if(!['AcceptEquityExit','CollectEquityExit'].includes(command.kind))return null
 const bad=(reason:string)=><section className="warning-box"><h3>先核对这笔原转让款</h3><p>{reason} 请返回这份原记录重新核对；没有换成另一笔款项。</p></section>
 if(command.runId!==view.runId||command.expectedRevision!==view.revision)return bad('这份确认已经不属于眼前的原记录。')
 const body=typeof command.payload==='object'&&command.payload!==null&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:{},v=features.deepseek
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
