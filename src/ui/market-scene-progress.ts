import type {PlayFeatures} from './game-types.ts'
import {lifecycleText,moneyText} from './game-text.ts'

type Market=PlayFeatures['market']
type Command={kind:string;payload:unknown;confirm:boolean}
export type MarketSceneProgress={
 phase:'opening'|'planned'|'pending'|'partial'|'settlement'|'research'|'position'|'history'
 title:string;line:string;choice:{title:string;line:string;label:string}
 command?:Command;secondaryCommand?:Command;nextDate?:string;waitLabel?:string
 active:boolean;accountId:string;entityId:string|null;entityIds:string[];entityIndex:number
 order:Market['orders'][number]|null;settlement:Market['settlements'][number]|null
}

/** Only already-public quotes, original orders and real settlement dates select this scene. */
export function marketSceneProgress(m:Market,date:string,accountId:string,preferredId?:string|null):MarketSceneProgress{
 const orders=m.orders.filter(o=>o.accountId===accountId),settlements=m.settlements.filter(s=>s.accountId===accountId)
 const positions=m.positions.filter(p=>p.accountId===accountId)
 const activeOrders=orders.filter(o=>['planned','pending','partially_filled'].includes(o.status))
 const unpaid=settlements.filter(s=>s.paidAt===null).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.id.localeCompare(b.id))
 const research=m.researches.filter(r=>r.status==='running').sort((a,b)=>a.completeAt.localeCompare(b.completeAt)||a.id.localeCompare(b.id))[0]
 const ids=[...activeOrders.map(o=>o.id),...unpaid.map(s=>s.id),...(research?[research.id]:[]),...positions.map(p=>p.id),...orders.filter(o=>!activeOrders.includes(o)).map(o=>o.id),...settlements.filter(s=>s.paidAt!==null).map(s=>s.id)]
 const selected=preferredId&&ids.includes(preferredId)?preferredId:activeOrders.find(o=>o.status==='planned')?.id??unpaid[0]?.id??activeOrders[0]?.id??research?.id??positions[0]?.id??orders.at(-1)?.id??settlements.at(-1)?.id??null
 const base={accountId,entityId:selected,entityIds:ids,entityIndex:selected===null?-1:ids.indexOf(selected),order:null,settlement:null,active:false}
 const order=orders.find(o=>o.id===selected)
 if(order){
  const name=m.stocks.find(q=>q.symbol===order.symbol)?.name??order.symbol
  const side=order.side==='buy'?'买入':'卖出',filled=order.quantity-order.remaining
  const terms=side+order.quantity+'股 · 限价'+moneyText(order.limitPriceFen)+' · 已成交'+filled+'股 / 余'+order.remaining+'股'
  if(order.status==='planned')return {...base,order,active:true,phase:'planned',title:'这份判断，还只是一张计划。',line:name+'：'+terms+'。原预留继续保留，尚未进入撮合。',choice:{title:'把原计划交进模拟市场',line:'原冻结'+moneyText(order.cashHeldFen)+'不会再冻结一遍；提交后只能在后续撮合点尝试成交。',label:'核对并提交这份原计划'},...(m.quoteId?{command:{kind:'SubmitStockOrder',payload:{orderId:order.id,quoteId:m.quoteId},confirm:true}}:{}),secondaryCommand:{kind:'CancelStockOrder',payload:{orderId:order.id},confirm:false}}
  if(order.status==='pending'||order.status==='partially_filled'){
   const next=m.matchingCalendar.find(c=>c.date>=date)?.date
   return {...base,order,active:true,phase:order.status==='pending'?'pending':'partial',title:filled?'只成交了一部分，余下仍由你决定。':'委托已经发出，等下一次撮合。',line:name+'：'+terms+'。'+(order.reason?'上次未继续成交：'+(lifecycleText[order.reason]??'当前成交条件未满足')+'。':'')+'挂单不是已经买到，卖出委托也不是到账。',choice:{title:'把成交与余量分开看',line:'尚冻结'+moneyText(order.cashHeldFen)+'；已经成交的股份和费用保留，撤余量只释放原冻结，不是收入。',label:'查看这份原委托与成交'},secondaryCommand:{kind:'CancelStockOrder',payload:{orderId:order.id},confirm:false},...(next?{nextDate:next,waitLabel:'等这份委托的下一次撮合'}:{})}
  }
  return {...base,order,phase:'history',title:order.status==='filled'?'这份委托，已经留下实际成交。':'这份委托，已经停止等待。',line:name+'：'+terms+'。'+(lifecycleText[order.status]??order.status)+'；原费用、余股和交收继续留在原账。',choice:{title:'回看当时的委托与结果',line:'过去的成交不能重做；也可以明确选择一份新的判断。',label:'翻看原委托与成交记录'}}
 }
 const settlement=settlements.find(s=>s.id===selected)
 if(settlement){
  const paid=settlement.paidAt!==null
  return {...base,settlement,active:!paid,phase:'settlement',title:paid?'这笔原款，已经实际交收。':settlement.kind==='sale'?'卖出的款，还在交收途中。':'原模拟分红，还在等实际到账。',line:(m.stocks.find(q=>q.symbol===settlement.symbol)?.name??settlement.symbol)+' · '+(settlement.kind==='sale'?'原卖股款':'原模拟分红')+moneyText(settlement.amountFen)+'，'+(paid?settlement.paidAt+'已进入原账户。':settlement.dueAt+'按原日序交收，眼下仍不可花。'),choice:{title:'核对这笔原交收',line:'原成交、费用、应收与实际现金分别保留；等待不授权新的交易。',label:'查看原成交与交收'},...(!paid?{nextDate:settlement.dueAt<date?date:settlement.dueAt,waitLabel:'等这笔原款交收'}:{})}
 }
 if(research?.id===selected)return {...base,accountId:'personal',active:true,phase:'research',title:'公开线索，要花真实的日子去整理。',line:research.startAt+'—'+research.completeAt+'，个人研究实际进行中。它不会揭示未来价格，也不会替你买入。',choice:{title:'看看这次研究与原材料',line:'个人费用与行动已经按原安排发生；中断不退回已经投入的资源。',label:'查看这次原研究'},nextDate:research.completeAt,waitLabel:'等这次公开研究完成'}
 const position=positions.find(p=>p.id===selected)
 if(position)return {...base,phase:'position',title:'持有的是一份判断，浮盈还不是现金。',line:(m.stocks.find(q=>q.symbol===position.symbol)?.name??position.symbol)+' · 持有'+position.quantity+'股，可售'+Math.max(0,position.settledQuantity-position.reservedQuantity)+'股；含买费成本'+moneyText(position.costIncludingBuyFeesFen)+'。'+(position.valuationStatus==='data_unavailable'?'当前数据不足，最后已知价值不能作为当前成交价。':'当前模拟市值'+moneyText(position.valueFen)+'，未实现盈亏'+moneyText(position.unrealizedProfitFen)+'。'),choice:{title:'给下一次买卖留下明确边界',line:'数量、限价和到期点由你选择。卖出后仍须分别等待成交与原交收。',label:'选择一份新的模拟委托'}}
 return {...base,phase:'opening',title:'先留好生活，再给判断一个边界。',line:'只有截至'+(m.asOf??date)+'的公开模拟报价。未来价格未知，新闻不会让交易倒回过去。',choice:{title:'挑一份值得承担的判断',line:'自己选账户、标的、方向、股数、限价与到期撮合点。可以预留为计划，也可以先保留现金。',label:'选择一份模拟委托'}}
}
