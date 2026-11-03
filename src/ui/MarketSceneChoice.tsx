import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {parseMoneyInput} from './money-input.ts'
import {playableThrough} from './game-text.ts'
import {MarketStockPicker} from './MarketStockPicker.tsx'
import {MarketOrderTerms,MarketOrderRules} from './MarketOrderTerms.tsx'
import {MarketExpiryPicker} from './MarketExpiryPicker.tsx'

export type MarketSceneDraft={accountId:string;symbol:string;side:''|'buy'|'sell';quantity:string;price:string;expiry:string;quoteId:string|null}

/** Parsing is local; affordability, quote ownership, fees and permissions remain original rule decisions. */
export function marketDraftPayload(draft:MarketSceneDraft,p:Pick<GamePanelProps,'view'|'features'>){
 const m=p.features.market,stock=m.stocks.find(s=>s.symbol===draft.symbol),quantity=/^\d+$/.test(draft.quantity)?Number(draft.quantity):0,price=parseMoneyInput(draft.price)
 if(!p.view.accounts.some(a=>a.accountId===draft.accountId)||!stock||!draft.side||!Number.isSafeInteger(quantity)||quantity<=0||quantity>1000000000||price===null||price<=0||!draft.quoteId||draft.quoteId!==m.quoteId||!m.matchingCalendar.some(c=>c.id===draft.expiry))return null
 return {accountId:draft.accountId,symbol:stock.symbol,side:draft.side,quantity,limitPriceFen:price,quoteId:draft.quoteId,validUntil:draft.expiry}
}

/** A UI bookmark gate never replaces the game's real permission and quote checks. */
export function marketSceneSubmissionLock(p:GamePanelProps,symbol:string,blockedReason?:string|null):string|null{
 if(blockedReason)return blockedReason
 const stock=p.features.market.stocks.find(s=>s.symbol===symbol)
 if(!stock||!stock.qualified||stock.status!=='open'||stock.priceFen===null||!stock.rule)return '这只股票的交易状态、公开报价、本局资格或交易规则尚不满足提交条件。'
 if(p.view.busy||p.controller.snapshot.busy||p.view.readOnly||p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.date>=playableThrough)return '当前只读、有未保存操作、正在保存或已到年代边界，不能提交新的交易。'
 return null
}

export function MarketSceneChoice({p,onFullRecord,children,blockedReason=null}:{p:GamePanelProps;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode;blockedReason?:string|null}){
 const [open,setOpen]=useState(false),[page,setPage]=useState<'stock'|'terms'>('stock')
 const [draft,setDraft]=useState<MarketSceneDraft>({accountId:'',symbol:'',side:'',quantity:'',price:'',expiry:'',quoteId:p.features.market.quoteId})
 const [expiryOpen,setExpiryOpen]=useState(false),[rulesOpen,setRulesOpen]=useState(false)
 const close=useCallback(()=>{setOpen(false);setExpiryOpen(false);setRulesOpen(false)},[])
 const openedRevision=useRef(p.view.revision),m=p.features.market
 useEffect(()=>{if(open&&(p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.revision!==openedRevision.current&&p.view.saveStatus==='saved'))close()},[open,p.view.revision,p.view.saveStatus,p.view.hasCandidate,close])
 useEffect(()=>{if(blockedReason)close()},[blockedReason,close])
 const stock=m.stocks.find(s=>s.symbol===draft.symbol),position=m.positions.find(s=>s.accountId===draft.accountId&&s.symbol===draft.symbol)
 const payload=marketDraftPayload(draft,p),quoteChanged=draft.quoteId!==m.quoteId
 const lockReason=marketSceneSubmissionLock(p,draft.symbol,blockedReason),locked=lockReason!==null
 const accountName=(id:string)=>id==='personal'?'个人账户':p.features.workbench.routes.find(r=>r.accountId===id)?.name??'经营账户'
 const edit=<K extends keyof MarketSceneDraft>(key:K,value:MarketSceneDraft[K])=>setDraft(old=>({...old,[key]:value}))
 return <>{children(()=>{if(blockedReason)return;openedRevision.current=p.view.revision;setOpen(true)})}{open?<>
 <Dialog key={page} title={page==='stock'?'选择股票与账户':'这笔买卖，准备怎么做？'} layout="direct" className={'market-scene-choice '+(page==='stock'?'market-stock-dialog':'market-order-dialog')} onClose={close} footer={page==='stock'?<div className="encounter-actions encounter-fixed-actions"><button type="button" className="primary" disabled={!!blockedReason||!stock||!draft.accountId} onClick={()=>setPage('terms')}>填写买卖条件 →</button><button type="button" onClick={()=>{close();onFullRecord()}}>查看全部行情、委托与持仓</button></div>:<div className="encounter-actions order-actions">{payload&&!locked?<><CommandButton {...p} kind="PlaceStockOrder" payload={payload} label={'核对并提交'+(draft.side==='sell'?'卖单':'买单')} confirm primary/><CommandButton {...p} kind="PlanStockOrder" payload={payload} label="只预留为计划，暂不下单" confirm/></>:<button type="button" disabled>{locked?'当前不能提交交易':'请先填完买卖条件'}</button>}<button type="button" onClick={()=>{setExpiryOpen(false);setRulesOpen(false);setPage('stock')}}>返回选择账户或股票</button></div>}>
  {page==='stock'?<p className="market-stock-context">虚构个股 · 非历史实盘 · 报价截至{m.asOf??'尚未公开'}。填写不下单，成交仍等后续撮合。</p>:null}
  {quoteChanged?<section className="warning-box"><p>报价已经更新，股数和限价草稿仍保留。请重新核对当前公开报价与到期日期。</p><button type="button" onClick={()=>edit('quoteId',m.quoteId)}>核对这次新报价</button></section>:null}
  {page==='stock'?<MarketStockPicker stocks={m.stocks} accounts={p.view.accounts} accountId={draft.accountId} symbol={draft.symbol} accountName={accountName} onAccount={id=>edit('accountId',id)} onStock={symbol=>edit('symbol',symbol)}/>:stock?<MarketOrderTerms stock={stock} accountName={accountName(draft.accountId)} availableFen={p.view.accounts.find(account=>account.accountId===draft.accountId)?.availableFen??null} asOf={m.asOf} draft={draft} calendar={m.matchingCalendar} sellable={Math.max(0,(position?.settledQuantity??0)-(position?.reservedQuantity??0))} complete={payload!==null} lockReason={lockReason} onSide={side=>edit('side',side)} onQuantity={value=>edit('quantity',value)} onPrice={value=>edit('price',value)} onUseQuote={()=>{if(stock.priceFen!==null)edit('price',(stock.priceFen/100).toFixed(2))}} onExpiry={()=>setExpiryOpen(true)} onRules={()=>setRulesOpen(true)}/>:<p>这份股票资料暂不可用，请返回重新选择。</p>}
 </Dialog>
 {expiryOpen&&page==='terms'?<MarketExpiryPicker calendar={m.matchingCalendar} selectedId={draft.expiry} onSelect={id=>edit('expiry',id)} onClose={()=>setExpiryOpen(false)}/>:null}
 {rulesOpen&&page==='terms'&&stock?<Dialog title={stock.name+' · 完整交易规则'} onClose={()=>setRulesOpen(false)} footer={<div className="expiry-footer"><button type="button" onClick={()=>setRulesOpen(false)}>回到买卖条件</button></div>}><MarketOrderRules stock={stock} asOf={m.asOf}/></Dialog>:null}
 </>:null}</>
}
