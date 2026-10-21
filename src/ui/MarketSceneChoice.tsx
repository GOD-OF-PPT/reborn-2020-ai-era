import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {parseMoneyInput} from './money-input.ts'
import {moneyText,playableThrough} from './game-text.ts'

export type MarketSceneDraft={accountId:string;symbol:string;side:''|'buy'|'sell';quantity:string;price:string;expiry:string;quoteId:string|null}
const exposure={compute:'算力设备',interconnect:'通信互联',application:'模型应用',data:'数据服务',media:'内容传媒'}

/** Parsing is local; affordability, quote ownership, fees and permissions remain original rule decisions. */
export function marketDraftPayload(draft:MarketSceneDraft,p:Pick<GamePanelProps,'view'|'features'>){
 const m=p.features.market,stock=m.stocks.find(s=>s.symbol===draft.symbol),quantity=/^\d+$/.test(draft.quantity)?Number(draft.quantity):0,price=parseMoneyInput(draft.price)
 if(!p.view.accounts.some(a=>a.accountId===draft.accountId)||!stock||!draft.side||!Number.isSafeInteger(quantity)||quantity<=0||quantity>1000000000||price===null||price<=0||!draft.quoteId||draft.quoteId!==m.quoteId||!m.matchingCalendar.some(c=>c.id===draft.expiry))return null
 return {accountId:draft.accountId,symbol:stock.symbol,side:draft.side,quantity,limitPriceFen:price,quoteId:draft.quoteId,validUntil:draft.expiry}
}

export function MarketSceneChoice({p,onFullRecord,children}:{p:GamePanelProps;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode}){
 const [open,setOpen]=useState(false),[page,setPage]=useState<'stock'|'terms'>('stock')
 const [draft,setDraft]=useState<MarketSceneDraft>({accountId:'',symbol:'',side:'',quantity:'',price:'',expiry:'',quoteId:p.features.market.quoteId})
 const openedRevision=useRef(p.view.revision),m=p.features.market
 useEffect(()=>{if(open&&(p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.revision!==openedRevision.current&&p.view.saveStatus==='saved'))setOpen(false)},[open,p.view.revision,p.view.saveStatus,p.view.hasCandidate])
 const stock=m.stocks.find(s=>s.symbol===draft.symbol),position=m.positions.find(s=>s.accountId===draft.accountId&&s.symbol===draft.symbol)
 const payload=marketDraftPayload(draft,p),quoteChanged=draft.quoteId!==m.quoteId
 const stockUnavailable=!stock||!stock.qualified||stock.status!=='open'||stock.priceFen===null||!stock.rule
 const locked=p.view.busy||p.controller.snapshot.busy||p.view.readOnly||p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.date>=playableThrough||stockUnavailable
 const accountName=(id:string)=>id==='personal'?'个人账户':p.features.workbench.routes.find(r=>r.accountId===id)?.name??'经营账户'
 const edit=<K extends keyof MarketSceneDraft>(key:K,value:MarketSceneDraft[K])=>setDraft(old=>({...old,[key]:value}))
 return <>{children(()=>{openedRevision.current=p.view.revision;setOpen(true)})}{open?<Dialog key={page} title={page==='stock'?'选择股票与账户':'填写这次买卖的条件'} className="market-scene-choice" onClose={()=>setOpen(false)} footer={page==='stock'?<div className="encounter-actions encounter-fixed-actions"><button type="button" className="primary" disabled={!stock||!draft.accountId} onClick={()=>setPage('terms')}>填写买卖条件 →</button><button type="button" onClick={()=>{setOpen(false);onFullRecord()}}>查看全部行情、委托与持仓</button></div>:undefined}>
  <p className="encounter-overline">虚构个股 · 简化模拟市场 · 非历史实盘</p>
  <p>报价截至{m.asOf}。限价由你填写，成交还要等后续撮合；填写和返回都不会下单。</p>
  {quoteChanged?<section className="warning-box"><p>报价已经更新，股数和限价草稿仍保留。请重新核对当前公开报价与到期日期。</p><button type="button" onClick={()=>edit('quoteId',m.quoteId)}>核对这次新报价</button></section>:null}
  {page==='stock'?<section className="market-pick">
   <label className="field">这次使用的账户<select value={draft.accountId} onChange={e=>edit('accountId',e.target.value)}><option value="">请选择账户</option>{p.view.accounts.map(a=><option key={a.accountId} value={a.accountId}>{accountName(a.accountId)} · 可花{moneyText(a.availableFen)}</option>)}</select></label>
   <div className="market-scene-stocks" aria-label="选择这次买卖的股票">{m.stocks.map(s=><button key={s.symbol} type="button" aria-label={'选择模拟标的 · '+s.name} aria-pressed={draft.symbol===s.symbol} onClick={()=>edit('symbol',s.symbol)}><small>{s.exposure?exposure[s.exposure]:'模拟试验段'}</small><strong>{s.name}</strong><span>{moneyText(s.priceFen)}</span><small>{s.status==='open'?'当前公开报价':s.status==='suspended'?'当前停牌':s.priceFen===null?'当前数据不足':'当前不可交易'}{!s.qualified?' · 缺本局资格':''}</small></button>)}</div>
  </section>:stock?<section className="market-terms">
   <h3>{stock.name} · {accountName(draft.accountId)}</h3>
   {stock.status==='open'&&stock.priceFen!==null?<p>当前报价{moneyText(stock.priceFen)}；{stock.lowerFen===null&&stock.upperFen===null?'本段没有固定限价范围。':'本次可填价格范围'+moneyText(stock.lowerFen)+'—'+moneyText(stock.upperFen)+'。'}限价不保证成交，仍须等待后续合法撮合。</p>:<p className="warning-box">{stock.status==='not_listed'?'当前尚未上市':stock.status==='suspended'?'当前停牌':'当前没有可用的公开报价'}，不能提交这份交易。草稿可以保留，未来是否可交易以当时公开情况与交易规则为准。</p>}
   <fieldset className="market-side-choice"><legend>这次买入，还是卖出？</legend><button type="button" aria-pressed={draft.side==='buy'} onClick={()=>edit('side','buy')}>买入这只股票<span>先预留资金，后续才可能成交</span></button><button type="button" aria-pressed={draft.side==='sell'} onClick={()=>edit('side','sell')}>卖出已有股份<span>当前可售{Math.max(0,(position?.settledQuantity??0)-(position?.reservedQuantity??0))}股，卖款另等交收</span></button></fieldset>
   <div className="market-intent-fields"><label className="field">{draft.side==='buy'?'买入股数':draft.side==='sell'?'卖出股数':'买卖股数'}<input inputMode="numeric" value={draft.quantity} onChange={e=>edit('quantity',e.target.value)} placeholder="请填写股数"/></label><label className="field">{draft.side==='buy'?'最高买价（元/股）':draft.side==='sell'?'最低卖价（元/股）':'每股限价（元）'}<input inputMode="decimal" value={draft.price} onChange={e=>edit('price',e.target.value)} placeholder="请填写限价"/></label><label className="field">委托有效至<select value={draft.expiry} onChange={e=>edit('expiry',e.target.value)}><option value="">请选择到期日期</option>{m.matchingCalendar.map(c=><option key={c.id} value={c.id}>{c.date}</option>)}</select></label></div>
   {stock.priceFen!==null?<button className="scene-text-action" type="button" onClick={()=>edit('price',(stock.priceFen!/100).toFixed(2))}>以当前报价{moneyText(stock.priceFen)}填写限价</button>:null}
   {stock.rule?<p>交易单位{stock.rule.lotSize}股；佣金{stock.rule.commissionBps/100}%、最低{moneyText(stock.rule.minimumCommissionFen)}。买后{stock.rule.shareLagDays}个日历日可售，卖款{stock.rule.cashLagDays}日交收；下一步会核对实际费用、资金与行动点。</p>:<p className="warning-box">当前交易规则未知，不能提交。</p>}
   {!payload?<p className="field-help">请选择账户、股票和买卖方向，填写正整数股数、正限价与到期日期。填完前不会下单。</p>:null}
   <div className="encounter-actions">{payload&&!locked?<><CommandButton {...p} kind="PlaceStockOrder" payload={payload} label={'核对并提交'+(draft.side==='sell'?'卖单':'买单')} confirm primary/><CommandButton {...p} kind="PlanStockOrder" payload={payload} label="只预留为计划，暂不下单" confirm/></>:<button type="button" disabled>{locked?'当前不能提交交易':'请先填完买卖条件'}</button>}<button type="button" onClick={()=>setPage('stock')}>返回选择账户或股票</button></div>
   {locked?<p className="warning-box">{stockUnavailable?'这只股票的交易状态、公开报价、本局资格或交易规则尚不满足提交条件。':'当前只读、有未保存操作、正在保存或已到年代边界，不能提交新的交易。'}草稿可以保留，提交仍须通过交易规则核对。</p>:null}
  </section>:null}
 </Dialog>:null}</>
}
