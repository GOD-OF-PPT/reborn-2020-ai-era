import type {GamePanelProps} from './game-types.ts'
import type {MarketSceneDraft} from './MarketSceneChoice.tsx'
import {marketExpiryLabel,type MarketExpiryEntry} from './MarketExpiryPicker.tsx'
import {moneyText} from './game-text.ts'
import './market-order-terms.css'

type Stock=GamePanelProps['features']['market']['stocks'][number]
type Props={stock:Stock;accountName:string;availableFen:number|null;asOf:string|null;draft:MarketSceneDraft;calendar:readonly MarketExpiryEntry[];sellable:number;complete:boolean;lockReason:string|null;onSide:(side:'buy'|'sell')=>void;onQuantity:(value:string)=>void;onPrice:(value:string)=>void;onUseQuote:()=>void;onExpiry:()=>void;onRules:()=>void}
const range=(stock:Stock)=>stock.lowerFen===null&&stock.upperFen===null?'没有固定限价范围':'可填'+moneyText(stock.lowerFen)+'—'+moneyText(stock.upperFen)
const unavailable=(stock:Stock)=>stock.status==='not_listed'?'当前尚未上市':stock.status==='suspended'?'当前停牌':'当前没有可用的公开报价'

export function MarketOrderRules({stock,asOf}:{stock:Stock;asOf:string|null}){
 return <><p>虚构个股 · 简化模拟市场 · 非历史实盘。报价截至{asOf??'尚未公开'}。</p>
  {stock.status==='open'&&stock.priceFen!==null?<p>当前报价{moneyText(stock.priceFen)}；{range(stock)}。限价不保证成交，仍须等待后续合法撮合。</p>:<p>{unavailable(stock)}，不能提交这份交易。草稿可以保留，未来是否可交易以当时公开情况与交易规则为准。</p>}
  {stock.rule?<p>交易单位{stock.rule.lotSize}股；佣金{stock.rule.commissionBps/100}%、最低{moneyText(stock.rule.minimumCommissionFen)}。买后{stock.rule.shareLagDays}个日历日可售，卖款{stock.rule.cashLagDays}日交收；下一步会核对实际费用、资金与行动点。</p>:<p>当前交易规则未知，不能提交。</p>}
  <p>填写和返回都不会下单。买卖方向、股数、限价和原撮合日均须显选；最终提交或预留计划仍分别确认。</p>
 </>
}

/** Controlled draft fields; no parsing, pricing or permission authority is introduced here. */
export function MarketOrderTerms({stock,accountName,availableFen,asOf,draft,calendar,sellable,complete,lockReason,onSide,onQuantity,onPrice,onUseQuote,onExpiry,onRules}:Props){
 const invalidExpiry=draft.expiry!==''&&!calendar.some(entry=>entry.id===draft.expiry)
 return <section className="market-order-terms">
  <div className="order-context"><h3>{stock.name}</h3><span>{accountName}{availableFen!==null?' · 可花'+moneyText(availableFen):''}</span></div>
  <p className="order-quote">{stock.status==='open'&&stock.priceFen!==null?<>报价{moneyText(stock.priceFen)} · {range(stock)} · 截至{asOf}</>:<>{unavailable(stock)}，不能提交；草稿可以保留。</>}</p>
  <fieldset className="order-sides"><legend>这次买入，还是卖出？</legend><button type="button" aria-pressed={draft.side==='buy'} onClick={()=>onSide('buy')}><strong>买入这只股票</strong><small>先预留资金，后续才可能成交</small></button><button type="button" aria-pressed={draft.side==='sell'} onClick={()=>onSide('sell')}><strong>卖出已有股份</strong><small>当前可售{sellable}股，卖款另等交收</small></button></fieldset>
  <div className="order-fields"><label className="field">{draft.side==='buy'?'买入股数':draft.side==='sell'?'卖出股数':'买卖股数'}<input aria-label={draft.side==='buy'?'买入股数':draft.side==='sell'?'卖出股数':'买卖股数'} inputMode="numeric" value={draft.quantity} onChange={event=>onQuantity(event.target.value)} placeholder="请填写股数"/></label><div><label className="field">{draft.side==='buy'?'最高买价（元/股）':draft.side==='sell'?'最低卖价（元/股）':'每股限价（元）'}<input aria-label={draft.side==='buy'?'最高买价（元/股）':draft.side==='sell'?'最低卖价（元/股）':'每股限价（元）'} inputMode="decimal" value={draft.price} onChange={event=>onPrice(event.target.value)} placeholder="请填写限价"/></label>{stock.priceFen!==null?<button type="button" className="order-text-action" onClick={onUseQuote}>以当前报价{moneyText(stock.priceFen)}填写限价</button>:null}</div><div className="field"><span>委托有效至</span><button type="button" className="order-expiry-button" data-invalid={invalidExpiry?'true':undefined} aria-label={'选择委托到期日 · '+marketExpiryLabel(calendar,draft.expiry)} onClick={onExpiry}>{marketExpiryLabel(calendar,draft.expiry)} <span aria-hidden="true">↗</span></button></div></div>
  <div className="order-rules-line">{stock.rule?<p>{stock.rule.lotSize}股为交易单位 · 佣金{stock.rule.commissionBps/100}%（最低{moneyText(stock.rule.minimumCommissionFen)}） · 买后{stock.rule.shareLagDays}日可售，卖款{stock.rule.cashLagDays}日交收。</p>:<p>交易规则未知，暂不能提交。</p>}<button type="button" className="order-text-action" onClick={onRules}>完整交易规则 ↗</button></div>
  {lockReason?<p className="order-lock" role="status">{lockReason}草稿可以保留，提交仍须通过交易规则核对。</p>:!complete?<p className="order-help">选好方向，填完股数、限价与到期日；下一步再核对资金、费用和行动。</p>:<p className="order-help">限价不保证成交。填写和返回不会下单，下一步仍需独立确认。</p>}
 </section>
}
