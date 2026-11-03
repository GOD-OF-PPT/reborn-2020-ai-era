import type {GamePanelProps} from './game-types.ts'
import {moneyText} from './game-text.ts'
import './market-stock-picker.css'

type Stock=GamePanelProps['features']['market']['stocks'][number]
type Props={stocks:readonly Stock[];accounts:GamePanelProps['view']['accounts'];accountId:string;symbol:string;accountName:(id:string)=>string;onAccount:(id:string)=>void;onStock:(symbol:string)=>void}
const exposure={compute:'算力设备',interconnect:'通信互联',application:'模型应用',data:'数据服务',media:'内容传媒'}

/** Public display state only. Submission authority stays in the original market preview. */
export function marketStockStatus(stock:Stock):string{
 if(stock.status==='not_listed')return '尚未上市'
 if(stock.status==='delisted')return '已退市'
 if(stock.status==='suspended')return '停牌中'
 if(stock.status==='no_rule'||!stock.rule)return '交易规则待核'
 if(stock.status==='data_unavailable'||stock.priceFen===null)return '暂无可用报价'
 return '当前公开报价'
}

export function MarketStockPicker({stocks,accounts,accountId,symbol,accountName,onAccount,onStock}:Props){
 return <section className="market-stock-picker">
  <label className="field">这次使用的账户<select value={accountId} onChange={event=>onAccount(event.target.value)}><option value="">请选择账户</option>{accounts.map(account=><option key={account.accountId} value={account.accountId}>{accountName(account.accountId)} · 可花{moneyText(account.availableFen)}</option>)}</select></label>
  <div className="market-stock-cards" aria-label="选择这次买卖的股票">
   {stocks.map(stock=><button key={stock.symbol} type="button" aria-label={'选择模拟标的 · '+stock.name} aria-pressed={symbol===stock.symbol} data-unavailable={stock.status!=='open'||!stock.qualified||stock.priceFen===null||!stock.rule?'true':undefined} onClick={()=>onStock(stock.symbol)}>
    <small className="market-stock-category">{stock.exposure?exposure[stock.exposure]:'模拟试验段'}</small>
    <span className="market-stock-main"><strong>{stock.name}</strong><span>{stock.priceFen===null?'暂无报价':moneyText(stock.priceFen)}</span></span>
    <small className="market-stock-state">{marketStockStatus(stock)}{!stock.qualified?' · 缺本局资格':''}</small>
   </button>)}
   {!stocks.length?<p>当前没有可查看的报价。</p>:null}
  </div>
 </section>
}
