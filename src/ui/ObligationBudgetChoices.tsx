import {useEffect,useRef,useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {obligationSceneKey,type ObligationSceneTarget} from './obligation-scene.ts'
import {obligationBudgetReading} from './obligation-budget-reading.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import './obligation-budget-choice.css'
type Context={key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];features:GamePanelProps['features'];session:string|undefined}
export function ObligationBudgetChoices({p,target}:{p:GamePanelProps;target:ObligationSceneTarget}){
 const reading=obligationBudgetReading(p,target),live=useRef(true),context=useRef<Context|null>(null),slot=useRef<{context:Context;index:number;key:string}|null>(null),[at,setAt]=useState<{context:Context;index:number}|null>(null),key=obligationSceneKey(target)
 if(!context.current||context.current.key!==key||context.current.owner!==p.controller||context.current.view!==p.view||context.current.features!==p.features||context.current.session!==p.controller.runtimeSession)context.current={key,owner:p.controller,view:p.view,features:p.features,session:p.controller.runtimeSession}
 const source=context.current,shown=at?.context===source&&reading.status==='ready',index=shown?Math.max(0,Math.min(at.index,reading.plans.length-1)):0,plan=reading.status==='ready'?reading.plans[index]:undefined
 if(!shown||!plan)slot.current=null;else if(!slot.current||slot.current.context!==source||slot.current.index!==index||slot.current.key!==plan.key)slot.current={context:source,index,key:plan.key}
 const active=slot.current,current=()=>live.current&&context.current===source,ownsPage=()=>current()&&active!==null&&slot.current===active
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const choose=(next:number)=>makeSharedAction(p,'翻看原预算',()=>setAt({context:source,index:next}),{allowReadOnly:true,canActivate:ownsPage}).activate(),close=()=>{if(current())setAt(null)}
 if(reading.status==='unavailable')return <p className="obligation-budget-source" role="status">{reading.reason}</p>
 if(!reading.plans.length)return reading.unknown?<p className="obligation-budget-source" role="status">部分原计划预留来源尚待核对，请翻看完整原账。</p>:null
 if(reading.availableFen>=reading.remainingFen)return null
 return <><button type="button" className="obligation-budget-open" onClick={()=>makeSharedAction(p,'看看能松开的预算',()=>setAt({context:source,index:0}),{allowReadOnly:true,canActivate:current}).activate()}>看看能松开的预算 ↗</button>{shown&&plan?<Dialog title="先松开哪一份预算？" layout="direct" className="obligation-budget-paper" onClose={close} footer={<div className="obligation-budget-footer"><button type="button" onClick={close}>回到这笔付款，保留金额</button><nav aria-label="逐份翻看原预算"><button type="button" disabled={index===0} onClick={()=>choose(index-1)}>← 上一份</button><span>{index+1} / {reading.plans.length}</span><button type="button" disabled={index===reading.plans.length-1} onClick={()=>choose(index+1)}>下一份 →</button></nav></div>}>
  <p className="obligation-budget-context">这笔原款还欠{moneyText(reading.remainingFen)} · 当前可花{moneyText(reading.availableFen)}</p>
  <section className="obligation-budget-plan" aria-label="这份原未提交计划"><p>未提交的模拟买入计划 · {plan.writtenAt}写下</p><h3>{plan.name}</h3><dl><div><dt>原股数</dt><dd>{plan.quantity}股</dd></div><div><dt>原限价</dt><dd>{moneyText(plan.limitFen)}</dd></div><div><dt>实际预留</dt><dd>{moneyText(plan.heldFen)}</dd></div><div><dt>已成交</dt><dd>0股</dd></div></dl><p>撤回只释放这份原占用，不产生收入。原款仍由你另行决定付款。</p><CommandButton {...p} request={(...args)=>{if(ownsPage())p.request(...args)}} kind="CancelStockOrder" payload={{orderId:plan.id}} label="核对撤回这份未提交计划" confirm/></section>
  {reading.otherHeldFen>0?<p className="obligation-budget-other">另有{moneyText(reading.otherHeldFen)}原占用，仍留在完整原账。</p>:null}{reading.unknown?<p className="obligation-budget-other">部分计划来源尚待核对，没有用它们猜测可释放金额。</p>:null}
 </Dialog>:null}</>
}
