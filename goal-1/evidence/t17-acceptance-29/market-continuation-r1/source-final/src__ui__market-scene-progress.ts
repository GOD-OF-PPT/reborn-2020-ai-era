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
  const fillIds=new Set(m.fills.filter(fill=>fill.orderId===order.id&&fill.date<=date).map(fill=>fill.id))
  const ownUnpaid=unpaid.filter(settlement=>settlement.kind==='sale'&&settlement.symbol===order.symbol&&fillIds.has(settlement.sourceId)),originalSettlement=ownUnpaid[0]
  const cashDate=originalSettlement?(originalSettlement.dueAt<date?date:originalSettlement.dueAt):undefined
  const cashLine=originalSettlement?`另有${ownUnpaid.length}笔已成交原款仍待交收；最近一笔${moneyText(originalSettlement.amountFen)}于${originalSettlement.dueAt}交收，眼下仍不可花。`:''
   if(order.status==='planned')return {...base,order,active:true,phase:'planned',title:'这份判断，还只是一张计划。',line:name+'：'+terms+'。资金或股份仍在预留，委托还没有进入市场。',choice:{title:'把这份计划交进模拟市场',line:(order.side==='buy'?'已冻结'+moneyText(order.cashHeldFen):'已预留'+order.remaining+'股')+'，提交不会再占用一遍；只能从之后的撮合日尝试成交。',label:'提交这份模拟委托'},...(m.quoteId?{command:{kind:'SubmitStockOrder',payload:{orderId:order.id,quoteId:m.quoteId},confirm:true}}:{}),secondaryCommand:{kind:'CancelStockOrder',payload:{orderId:order.id},confirm:false}}
  if(order.status==='pending'||order.status==='partially_filled'){
   const matchingDate=m.matchingCalendar.find(c=>c.date>=date)?.date
   const waitingForCash=cashDate!==undefined&&(matchingDate===undefined||cashDate<=matchingDate),next=waitingForCash?cashDate:matchingDate
    return {...base,order,active:true,phase:order.status==='pending'?'pending':'partial',title:filled?'只成交了一部分，余下仍由你决定。':'委托已经发出，等下一次撮合。',line:name+'：'+terms+'。'+(order.reason?'上次未继续成交：'+(lifecycleText[order.reason]??'当前成交条件未满足')+'。':'')+'挂单不保证成交，卖出委托也还不是到账。'+cashLine,choice:{title:'看看已成交多少，还有多少在等',line:(order.side==='buy'?'尚冻结'+moneyText(order.cashHeldFen):'尚预留'+order.remaining+'股')+'；撤回余量只释放这笔预留，不是收入，已经成交的股份和费用保留。',label:'查看这份委托与成交'},secondaryCommand:{kind:'CancelStockOrder',payload:{orderId:order.id},confirm:false},...(next?{nextDate:next,waitLabel:waitingForCash?'等这份委托已成交原款交收':'等这份委托的下一次撮合'}:{})}
  }
  if(originalSettlement)return {...base,order,settlement:originalSettlement,active:true,phase:'settlement',title:order.status==='filled'?'这份委托已成交，款项还在交收。':'委托余量已停止，原成交款仍待交收。',line:name+'：'+terms+'。'+cashLine,choice:{title:'沿原委托核对已成交的原款',line:'交收仍按原日期进入原账户；查看或撤回余量不会提前到账，也不会重做成交。',label:'查看这份委托与原交收'},nextDate:cashDate!,waitLabel:'等这份委托已成交原款交收'}
   return {...base,order,phase:'history',title:order.status==='filled'?'这份委托，已经成交。':'这份委托，已经停止等待。',line:name+'：'+terms+'。'+(lifecycleText[order.status]??order.status)+'；费用、余股和交收仍在账上。',choice:{title:'回看当时的委托与结果',line:'过去的成交不能重做；下一次买卖，仍由你重新决定。',label:'翻阅这份委托与成交记录'}}
 }
 const settlement=settlements.find(s=>s.id===selected)
 if(settlement){
  const paid=settlement.paidAt!==null
   return {...base,settlement,active:!paid,phase:'settlement',title:paid?'这笔款，已经到账。':settlement.kind==='sale'?'卖出的款，还在交收途中。':'模拟分红，还在等到账。',line:(m.stocks.find(q=>q.symbol===settlement.symbol)?.name??settlement.symbol)+' · '+(settlement.kind==='sale'?'卖股款':'模拟分红')+moneyText(settlement.amountFen)+'，'+(paid?settlement.paidAt+'已进入下单账户。':settlement.dueAt+'交收，眼下仍不可花。'),choice:{title:'看看这笔交收的来由',line:'成交、费用、应收与现金分别记账；等款项到账不会替你发起新交易。',label:'查看这笔成交与交收'},...(!paid?{nextDate:settlement.dueAt<date?date:settlement.dueAt,waitLabel:'等这笔款交收'}:{})}
 }
  if(research?.id===selected)return {...base,accountId:'personal',active:true,phase:'research',title:'给市场里的线索，留些整理的时间。',line:research.startAt+'—'+research.completeAt+'，你正在整理公开资料。研究不会揭示未来价格，也不会替你买入。',choice:{title:'看看正在研究什么',line:'费用与行动由个人承担；中断不退回已经投入的钱和行动。',label:'查看这次研究与材料'},nextDate:research.completeAt,waitLabel:'等这次公开研究完成'}
 const position=positions.find(p=>p.id===selected)
 if(position)return {...base,phase:'position',title:'持有的是一份判断，浮盈还不是现金。',line:(m.stocks.find(q=>q.symbol===position.symbol)?.name??position.symbol)+' · 持有'+position.quantity+'股，可售'+Math.max(0,position.settledQuantity-position.reservedQuantity)+'股；含买费成本'+moneyText(position.costIncludingBuyFeesFen)+'。'+(position.valuationStatus==='data_unavailable'?'当前数据不足，最后已知价值不能作为当前成交价。':'当前模拟市值'+moneyText(position.valueFen)+'，未实现盈亏'+moneyText(position.unrealizedProfitFen)+'。'),choice:{title:'给下一次买卖留下明确边界',line:'数量、限价和到期点由你选择。卖出后仍须分别等待成交与原交收。',label:'选择一份新的模拟委托'}}
 return {...base,phase:'opening',title:'先留好生活，再给判断一个边界。',line:'只有截至'+(m.asOf??date)+'的公开模拟报价。未来价格未知，新闻不会让交易倒回过去。',choice:{title:'挑一份值得承担的判断',line:'自己选账户、标的、方向、股数、限价与到期撮合点。可以预留为计划，也可以先保留现金。',label:'选择一份模拟委托'}}
}
