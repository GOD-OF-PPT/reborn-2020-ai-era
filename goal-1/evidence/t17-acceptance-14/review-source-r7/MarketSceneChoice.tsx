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
 return <>{children(()=>{openedRevision.current=p.view.revision;setOpen(true)})}{open?<Dialog title="给这份判断，留下明确的边界" className="market-scene-choice" onClose={()=>setOpen(false)}>
  <p className="encounter-overline">虚构个股 / 简化模拟市场 / 非历史实盘</p>
  <p>只使用截至{m.asOf}的公开报价。选定的限价是边界，不是保证成交的价格；阅读和返回不会提交交易。</p>
  {quoteChanged?<section className="warning-box"><p>报价已经更新。你写下的股数和限价仍保留，须重新核对当前公开报价及到期点。</p><button type="button" onClick={()=>edit('quoteId',m.quoteId)}>按当前公开报价重新核对</button></section>:null}
  {page==='stock'?<section className="market-pick">
   <label className="field">用哪份钱承担这次判断<select value={draft.accountId} onChange={e=>edit('accountId',e.target.value)}><option value="">先选一个账户</option>{p.view.accounts.map(a=><option key={a.accountId} value={a.accountId}>{accountName(a.accountId)} · 可花{moneyText(a.availableFen)}</option>)}</select></label>
   <div className="market-scene-stocks" aria-label="这次判断的模拟标的">{m.stocks.map(s=><button key={s.symbol} type="button" aria-label={'选择模拟标的 · '+s.name} aria-pressed={draft.symbol===s.symbol} onClick={()=>edit('symbol',s.symbol)}><small>{s.exposure?exposure[s.exposure]:'模拟试验段'}</small><strong>{s.name}</strong><span>{moneyText(s.priceFen)}</span><small>{s.status==='open'?'当前公开报价':s.status==='suspended'?'当前停牌':s.priceFen===null?'当前数据不足':'当前不可交易'}{!s.qualified?' · 缺本局资格':''}</small></button>)}</div>
   <div className="encounter-actions"><button type="button" disabled={!stock||!draft.accountId} onClick={()=>setPage('terms')}>给这份判断写下边界 →</button><button type="button" onClick={()=>{setOpen(false);onFullRecord()}}>先翻看全部行情、原委托与仓位</button></div>
  </section>:stock?<section className="market-terms">
   <h3>{stock.name} · {accountName(draft.accountId)}</h3>
   {stock.status==='open'&&stock.priceFen!==null?<p>这次公开报价{moneyText(stock.priceFen)}；{stock.lowerFen===null&&stock.upperFen===null?'本段没有固定限价边界。':'本次原限价范围'+moneyText(stock.lowerFen)+'—'+moneyText(stock.upperFen)+'。'}写下价格只表达你的边界，实际成交仍等后续合法撮合。</p>:<p className="warning-box">{stock.status==='not_listed'?'当前尚未上市':stock.status==='suspended'?'当前停牌':'当前没有可用的公开报价'}，不能提交这份交易。草稿可以保留，未来是否可交易以当时公开情况与原规则为准。</p>}
   <fieldset className="market-side-choice"><legend>这一次，想怎样安排</legend><button type="button" aria-pressed={draft.side==='buy'} onClick={()=>edit('side','buy')}>买入一份判断<span>先占用原资金，后续才尝试成交</span></button><button type="button" aria-pressed={draft.side==='sell'} onClick={()=>edit('side','sell')}>卖出已有股份<span>当前可售{Math.max(0,(position?.settledQuantity??0)-(position?.reservedQuantity??0))}股，款项另等交收</span></button></fieldset>
   <div className="market-intent-fields"><label className="field">明确股数<input inputMode="numeric" value={draft.quantity} onChange={e=>edit('quantity',e.target.value)} placeholder="由你填写股数"/></label><label className="field">每股限价（元）<input inputMode="decimal" value={draft.price} onChange={e=>edit('price',e.target.value)} placeholder="由你填写价格"/></label><label className="field">这次等到哪个撮合点<select value={draft.expiry} onChange={e=>edit('expiry',e.target.value)}><option value="">选择原到期撮合点</option>{m.matchingCalendar.map(c=><option key={c.id} value={c.id}>{c.date}</option>)}</select></label></div>
   {stock.priceFen!==null?<button className="scene-text-action" type="button" onClick={()=>edit('price',(stock.priceFen!/100).toFixed(2))}>明确采用当前公开报价{moneyText(stock.priceFen)}作为限价</button>:null}
   {stock.rule?<p>原交易单位{stock.rule.lotSize}股；佣金{stock.rule.commissionBps/100}%、最低{moneyText(stock.rule.minimumCommissionFen)}。买后{stock.rule.shareLagDays}个日历日可售，卖款{stock.rule.cashLagDays}日交收；费用和可用资金由原确认逐项裁定。</p>:<p className="warning-box">当前原规则未知，不能提交。</p>}
   {!payload?<p className="field-help">账户、标的、方向、正整数股数、正限价和原撮合期限都须明确；未完成的草稿不会成为委托。</p>:null}
   <div className="encounter-actions">{payload&&!locked?<><CommandButton {...p} kind="PlaceStockOrder" payload={payload} label={'核对并提交这份模拟'+(draft.side==='sell'?'卖单':'买单')} confirm primary/><CommandButton {...p} kind="PlanStockOrder" payload={payload} label="只预留为计划，暂不提交市场" confirm/></>:<button type="button" disabled>{locked?'当前仅能翻阅这份交易草稿':'先把这份判断写清楚'}</button>}<button type="button" onClick={()=>setPage('stock')}>返回调整账户或标的</button></div>
   {locked?<p className="warning-box">{stockUnavailable?'当前标的的交易状态、公开报价、本局资格或原规则尚不满足提交条件。':'当前只读、未保存候选、保存中或已到原日期边界，不能提交新的交易。'}草稿可以保留，提交仍须通过原规则核对。</p>:null}
  </section>:null}
 </Dialog>:null}</>
}
