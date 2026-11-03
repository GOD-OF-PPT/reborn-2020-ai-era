import {isoDate} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {MarketOrderPaperPhase} from './DayContinuityPaper.tsx'
import {lifecycleText,moneyText} from './game-text.ts'

export interface MarketOrderRoomCopy {object:string;title:string;stage:string;facts:readonly string[];paperPhase:MarketOrderPaperPhase}
const dateValid=(value:string)=>{try{return isoDate(value)===value}catch{return false}}
const amountValid=(value:number)=>Number.isSafeInteger(value)&&value>=0
const sum=(values:readonly number[])=>values.reduce((total,value)=>total+value,0)

/** Short scene facts for one public order. The original thread keeps the full
 * record and owns its commands, waiting dates and historical navigation. */
export function marketOrderRoomCopy(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView):MarketOrderRoomCopy|null {
 const focus=thread.focus,market=p.features.market,date=p.view.date
 if(focus.kind!=='market'||focus.entityKind!=='order'||focus.runId!==p.view.runId||thread.focusStatus==='invalid'||!['current','carry'].includes(thread.focusScope)||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||p.features.workbench.atQuarterEnd||!dateValid(date))return null
 const orders=market.orders.filter(order=>order.id===focus.entityId)
 if(orders.length!==1)return null
 const order=orders[0]!
 if(order.accountId!==focus.accountId||p.view.accounts.filter(account=>account.accountId===order.accountId).length!==1||!dateValid(order.submittedAt)||order.submittedAt>date)return null
 if(![order.quantity,order.remaining,order.limitPriceFen,order.cashHeldFen,order.grossFilledFen,order.feesPaidFen].every(amountValid)||order.quantity<=0||order.limitPriceFen<=0||order.remaining>order.quantity)return null
 const fills=market.fills.filter(fill=>fill.orderId===order.id),filled=order.quantity-order.remaining
 if(new Set(fills.map(fill=>fill.id)).size!==fills.length||fills.some(fill=>!dateValid(fill.date)||fill.date>date||![fill.quantity,fill.grossFen,fill.feeFen].every(amountValid)||fill.quantity===0))return null
 if(sum(fills.map(fill=>fill.quantity))!==filled||sum(fills.map(fill=>fill.grossFen))!==order.grossFilledFen||sum(fills.map(fill=>fill.feeFen))!==order.feesPaidFen)return null
 const active=['planned','pending','partially_filled'].includes(order.status)
 if((order.status==='planned'||order.status==='pending')&&filled!==0||order.status==='partially_filled'&&(filled===0||order.remaining===0)||order.status==='filled'&&order.remaining!==0||!active&&order.cashHeldFen!==0)return null
 const side=order.side==='buy'?'买入':'卖出',name=market.stocks.find(stock=>stock.symbol===order.symbol)?.name??order.symbol
 const object=name+' · 模拟'+(order.side==='buy'?'买单':'卖单')
 const origin=thread.focusScope==='carry'&&thread.focusQuarter?'始于'+thread.focusQuarter+' · ':''
 const terms=`${side}${order.quantity}股 · 限价${moneyText(order.limitPriceFen)}`
 const reserved=order.side==='buy'?'资金预留'+moneyText(order.cashHeldFen):'股份预留'+order.remaining+'股'
 const filledLine=`本单已${side}${filled}股 · 成交额${moneyText(order.grossFilledFen)} · 费用${moneyText(order.feesPaidFen)}。`
 let received=0,waiting=0
 if(order.side==='sell'){
  for(const fill of fills){
   if(fill.grossFen<fill.feeFen)return null
   const rows=market.settlements.filter(row=>row.id===fill.receivableId||row.sourceId===fill.id)
   if(fill.receivableId===null){if(rows.length)return null;received+=fill.grossFen-fill.feeFen;continue}
   if(rows.length!==1)return null
   const row=rows[0]!
   if(row.id!==fill.receivableId||row.sourceId!==fill.id||row.accountId!==order.accountId||row.symbol!==order.symbol||row.kind!=='sale'||!amountValid(row.amountFen)||row.amountFen!==fill.grossFen-fill.feeFen||!dateValid(row.dueAt)||row.dueAt<fill.date||row.paidAt!==null&&(!dateValid(row.paidAt)||row.paidAt<row.dueAt||row.paidAt>date))return null
   if(row.paidAt===null)waiting+=row.amountFen;else received+=row.amountFen
  }
  if(!amountValid(received)||!amountValid(waiting))return null
 }
 const cash=order.side==='sell'&&filled>0?`卖款实收${moneyText(received)}${waiting>0?' · 待交收'+moneyText(waiting)+'，目前不可花':'（扣除本单费用后）'}。`:null
 const reason=order.reason?'上次未继续成交：'+(lifecycleText[order.reason]??'当前成交条件未满足')+'。':null
 if(order.status==='planned')return {object,title:'这份计划，要交出去吗？',stage:'计划 · 尚未提交',paperPhase:'planned',facts:[origin+terms+'。',reserved+'，尚未成交；提交沿用原预留。']}
 if(order.status==='pending')return {object,title:'委托已发出，等市场回应。',stage:'已提交 · 等待撮合',paperPhase:'pending',facts:[origin+terms+' · 尚未成交。',reserved+'；撤回只释放预留，不是收入。',...(reason?[reason]:[])]}
 if(order.status==='partially_filled')return {object,title:'成交了一部分，余下继续等吗？',stage:'部分成交 · 余量待定',paperPhase:'partial',facts:[origin+filledLine,`余${order.remaining}股 · ${reserved}；撤回不改变原成交。`,...(cash?[cash]:[]),...(reason?[reason]:[])]}
 const stopped=order.status==='cancelled'||order.status==='expired'
 if(!stopped&&order.status!=='filled')return null
 const stoppedLine=stopped?`未成交${order.remaining}股已${order.status==='expired'?'到期':'撤回'}，预留已解除；原成交与费用保留。`:null
 return {object,title:waiting>0?stopped?'余量已停，等原卖款到账。':'卖出了，等原卖款到账。':stopped?'这份委托，先收起来。':order.side==='buy'?'股份买到了，日子继续。':'卖款到了，接下来怎么安排？',stage:waiting>0?(stopped?'余量已停 · 原款待交收':'已成交 · 原款待交收'):stopped?(order.status==='expired'?'已到期 · 记录保留':'已撤回 · 记录保留'):'本单已成交',paperPhase:waiting>0?'settlement':stopped?'stopped':'filled',facts:[origin+(filled>0?filledLine:terms+' · 未成交。'),...(stoppedLine?[stoppedLine]:[]),...(cash?[cash]:order.side==='buy'&&filled>0?['买入成为股份，不是收入；持仓与可售数量可翻原册。']:[])]}
}

/** Disambiguate a real hand-made offer deadline while reading a stock order.
 * An unfamiliar or richer echo retains its full original first layer. */
export function marketOrderWaitBrief(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView,notice:{date:string;text:string;brief?:string}):string|null {
 if(notice.date!==p.view.date||notice.brief!=='委托答复期限已过。'||!notice.text.includes('那份原委托，有了新的实际反馈。')||p.features.firstOrder.status!=='expired')return null
 const copy=marketOrderRoomCopy(p,thread)
 if(!copy||!['planned','pending','partial'].includes(copy.paperPhase))return null
 return '手工小单的答复期限已过。'+(copy.paperPhase==='planned'?'这份模拟委托仍未提交。':copy.paperPhase==='partial'?'这份模拟委托的余量仍待撮合。':'这份模拟委托仍待撮合。')
}
