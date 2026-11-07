import {useEffect,useRef} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {VideoClientReplyReading} from './video-client-reply.ts'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import './video-client-reply.css'

export function VideoClientReplyFacts({reading:r}:{reading:VideoClientReplyReading}){return <section className="video-client-reply-facts" aria-label="原客户修改与实际投入"><p>{r.line}</p><p>原第{r.version}版 · 已安排修改{r.revisions}轮 / 原含{r.included}轮</p><p>原回信{r.reviewedAt} · 最迟{r.dueAt}提交</p></section>}
type Props={p:GamePanelProps;contextKey:string;reading:VideoClientReplyReading;onRework:()=>void;onPrice:()=>void;onScope:()=>void}
/** These are choices of response, never execution or a forecast of client approval. */
export function VideoClientReplyChoices({p,contextKey,reading:r,onRework,onPrice,onScope}:Props){
 const live=useRef(true),scope=useRef<{key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;rework:Props['onRework'];price:Props['onPrice'];scope:Props['onScope']}|null>(null),key=JSON.stringify([contextKey,r])
 if(!scope.current||scope.current.key!==key||scope.current.owner!==p.controller||scope.current.view!==p.view||scope.current.session!==p.controller.runtimeSession||scope.current.rework!==onRework||scope.current.price!==onPrice||scope.current.scope!==onScope)scope.current={key,owner:p.controller,view:p.view,session:p.controller.runtimeSession,rework:onRework,price:onPrice,scope:onScope}
 const source=scope.current;useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const bind=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:()=>live.current&&scope.current===source}),rework=bind('再修一轮',onRework),price=bind('试谈加价¥300',onPrice),range=bind('试谈缩小范围',onScope)
 return <section className="video-client-reply-choices" aria-label="比较这次修改的完整回应">
  <VideoClientReplyFacts reading={r}/><p className="video-client-reply-quote">约定报价{moneyText(r.priceFen)} · 原预款{moneyText(r.prepaymentFen)}</p>
  <div className="video-client-reply-actions"><button type="button" className="video-client-reply-rework" disabled={rework.disabled} onClick={rework.activate}><strong>再修一轮</strong><span>新增{moneyText(r.rework.costFen)} · {r.rework.points}点 · {r.rework.days}日</span><small>{r.reworkTotalFen===null?'原资源与日期继续前核对。':'修完这轮，直接投入参考'+moneyText(r.reworkTotalFen)+'。'}</small></button>
   <div className="video-client-reply-talk"><p>也可以先谈条件</p><button type="button" disabled={!r.canNegotiate||price.disabled} onClick={price.activate}><strong>试谈加价¥300</strong><small>谈妥才调整报价，原单仍须验收。</small></button><button type="button" disabled={!r.canNegotiate||range.disabled} onClick={range.activate}><strong>试谈缩小范围</strong><small>不保证接受，谈妥仍须亲手重提。</small></button><p>本次现金{moneyText(r.negotiation.costFen)} · {r.negotiation.points}点 · {r.negotiation.days}日；客户可能拒绝。</p>{r.negotiationReason?<p className="video-client-reply-condition">{r.negotiationReason}</p>:null}</div>
  </div>{rework.reason?<p className="reason">{rework.reason}</p>:null}<p className="video-client-reply-boundary">原期限与已耗费用继续；生活、工资和维护仍按日历结算。</p>
 </section>
}
