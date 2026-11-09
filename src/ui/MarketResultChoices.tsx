import {useEffect,useRef} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {MarketSceneProgress} from './market-scene-progress.ts'
import {isoDate} from '../core/calendar.ts'
import {makeSharedAction} from './shared-action.ts'
const date=(s:string)=>{try{return isoDate(s)===s}catch{return false}}
const quantity=(n:number)=>Number.isSafeInteger(n)&&n>=0
/** This reading selects a UI destination, never a trading or collection permission. */
export function marketResultReading(p:GamePanelProps,progress:MarketSceneProgress){
 if(p.view.phase!=='playing'||p.features.workbench.pause||p.features.workbench.progression.requiresDelivery||progress.accountId!==p.accountId||!progress.entityId||p.view.accounts.filter(a=>a.accountId===p.accountId).length!==1)return null
 const m=p.features.market,id=progress.entityId,base=[p.view.runId,p.accountId,progress.phase,id]
 if(progress.phase==='position'){
  const rows=m.positions.filter(row=>row.id===id),row=rows[0]
  if(rows.length!==1||!row||row.accountId!==p.accountId||!quantity(row.quantity)||row.quantity===0||!quantity(row.settledQuantity)||!quantity(row.reservedQuantity)||row.reservedQuantity>row.settledQuantity||row.settledQuantity>row.quantity)return null
  return {key:JSON.stringify([...base,row.symbol,row.quantity,row.settledQuantity,row.reservedQuantity]),title:row.reservedQuantity>0?'持仓已有安排，先过今天？':'这份持仓，先留着？',label:row.reservedQuantity>0?'保留原委托，回到今天':'保留持仓，回到今天',line:row.reservedQuantity>0?'当前持有'+row.quantity+'股，其中'+row.reservedQuantity+'股已为原卖单预留；原委托仍按原撮合日等待。':'当前持有'+row.quantity+'股，可售'+(row.settledQuantity-row.reservedQuantity)+'股。股份先留着，今天的时间仍由你安排。'}
 }
 const order=progress.order,orders=order?m.orders.filter(row=>row.id===order.id):[]
 if(order&&(orders.length!==1||orders[0]!==order||order.id!==id||order.accountId!==p.accountId||!date(order.submittedAt)||order.submittedAt>p.view.date))return null
 if(progress.phase==='settlement'&&progress.settlement){
  const value=progress.settlement,rows=m.settlements.filter(row=>row.id===value.id)
  if(rows.length!==1||rows[0]!==value||value.accountId!==p.accountId||!order&&id!==value.id||!date(value.dueAt)||value.paidAt!==null&&(!date(value.paidAt)||value.paidAt<value.dueAt||value.paidAt>p.view.date))return null
  const paid=value.paidAt!==null
  return {key:JSON.stringify([...base,value.id,value.sourceId,value.dueAt,value.paidAt]),title:paid?'原款到账，接下来呢？':value.kind==='sale'?'卖出了，等原款到账。':'这笔模拟分红，还在等到账。',label:paid?'收好交收记录，回到今天':'先回到今天，原款照约等待',line:paid?'已经发生的收款留在原账，下一次投入由你另行决定。':'这笔原款仍按'+value.dueAt+'交收，也可以先去安排生活。'}
 }
 if(progress.phase==='history'&&order&&!progress.active&&['filled','cancelled','expired','rejected'].includes(order.status)&&quantity(order.quantity)&&order.quantity>0&&quantity(order.remaining)&&order.remaining<=order.quantity&&(order.status!=='filled'||order.remaining===0)){
  const filled=order.status==='filled'
  return {key:JSON.stringify([...base,order.status,order.side,order.remaining]),title:filled?order.side==='buy'?'股份买到了，接下来呢？':'这笔卖出，已有结果。':'这次判断，先收起来。',label:filled?'收好本单，回到今天':'这次先停手，回到今天',line:'成交、费用和未结的原款仍在记录里，接下来也可以把时间留给生活。'}
 }
 return null
}
type Props={p:GamePanelProps;progress:MarketSceneProgress;onToday:()=>void;onOrder?:()=>void}
type Owner={key:string;view:GamePanelProps['view'];features:GamePanelProps['features'];controller:GamePanelProps['controller'];session:string|undefined;today:Props['onToday'];order:Props['onOrder']}
export function MarketResultChoices({p,progress,onToday,onOrder}:Props){
 const reading=marketResultReading(p,progress),owner=useRef<Owner|null>(null),live=useRef(true)
 const key=reading?.key??'unavailable'
 if(!owner.current||owner.current.key!==key||owner.current.view!==p.view||owner.current.features!==p.features||owner.current.controller!==p.controller||owner.current.session!==p.controller.runtimeSession||owner.current.today!==onToday||owner.current.order!==onOrder)owner.current={key,view:p.view,features:p.features,controller:p.controller,session:p.controller.runtimeSession,today:onToday,order:onOrder}
 const source=owner.current,current=()=>live.current&&owner.current===source&&marketResultReading(p,progress)?.key===key
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 if(!reading)return null
 const today=makeSharedAction(p,reading.label,onToday,{allowReadOnly:true,canActivate:current}),order=onOrder?makeSharedAction(p,'选择一份模拟委托',onOrder,{allowReadOnly:true,canActivate:current}):null
 return <><button type="button" className="scene-choice market-result-choice" aria-label={today.label} disabled={today.disabled} onClick={today.activate}><strong>{today.label}</strong><span className="scene-choice-line">{reading.line}</span><span className="scene-choice-end">回到今天 <span aria-hidden="true">↗</span></span>{today.reason?<span className="reason">{today.reason}</span>:null}</button>{order?<button type="button" className="scene-choice market-result-choice" aria-label={order.label} disabled={order.disabled} onClick={order.activate}><strong>再作一次买卖判断</strong><span className="scene-choice-line">先选账户、股票与买卖条件，投入仍须独立确认。</span><span className="scene-choice-end">选择股票与买卖条件 <span aria-hidden="true">→</span></span>{order.reason?<span className="reason">{order.reason}</span>:null}</button>:null}</>
}
