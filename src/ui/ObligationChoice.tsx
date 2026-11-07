import {useEffect,useRef} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {obligationSceneKey,resolveObligationScene,type ObligationSceneTarget} from './obligation-scene.ts'
import {DebtPayment} from './Obligations.tsx'
import {CashGapDecision} from './CashGapDecision.tsx'
import {cashGapReading} from './cash-gap-reading.ts'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import './obligation-choice.css'
type Props={p:GamePanelProps;target:ObligationSceneTarget;drafts:ReadonlyMap<string,string>;onDraft:(key:string,amount:string)=>void;onClose:()=>void;onInspect:(accountId:string)=>void}
/** One original debt, its original input and independent confirmation. */
export function ObligationChoice({p,target,drafts,onDraft,onClose,onInspect}:Props){
 const value=resolveObligationScene(p,target),live=useRef(true),scope=useRef<{key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;draft:Props['onDraft'];close:Props['onClose'];inspect:Props['onInspect']}|null>(null),key=obligationSceneKey(target)
 if(!scope.current||scope.current.key!==key||scope.current.owner!==p.controller||scope.current.view!==p.view||scope.current.session!==p.controller.runtimeSession||scope.current.draft!==onDraft||scope.current.close!==onClose||scope.current.inspect!==onInspect)scope.current={key,owner:p.controller,view:p.view,session:p.controller.runtimeSession,draft:onDraft,close:onClose,inspect:onInspect}
 const source=scope.current,current=()=>live.current&&scope.current===source
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 const close=()=>{if(current())onClose()},inspect=()=>makeSharedAction(p,'翻看这份原账',()=>onInspect(target.kind==='payment'?target.accountId:p.accountId),{allowReadOnly:true,canActivate:current}).activate()
 const pause=p.features.workbench.pause,gap=cashGapReading(p),footer=<div className="obligation-choice-footer">{value.status==='payment'&&pause?.reason==='CASH_SHORTFALL'&&gap?<CommandButton {...p} kind="AcknowledgeCashGap" payload={{instanceId:pause.instanceId}} label={gap.label}/>:<button type="button" onClick={close}>先合上，回到刚才的事</button>}<button type="button" onClick={inspect}>翻看这份原账 ↗</button></div>
 return <Dialog title={value.status==='payment'?'这笔到期款，准备怎样处理？':value.status==='pause'?'接着过今天，旧事照原约。':'重新核对这份原责任'} layout="direct" className="obligation-choice-paper" onClose={close} footer={footer}>
  {value.status==='invalid'?<p role="status" className="obligation-choice-unknown">{value.reason}</p>:value.status==='pause'?<CashGapDecision p={p} hasDebts={false}/>:<>
   <p className="obligation-choice-kicker">{value.debt.kind==='loan_principal'?'原借款本金':value.debt.kind==='refund_undelivered'||value.debt.kind==='refund_delivered'?'已确认的原退款':'已经发生的原支出'} · 分次支付仍关联同一笔</p>
   <DebtPayment props={{...p,accountId:value.debt.accountId}} debt={value.debt} {...(drafts.has(value.draftKey)?{draftAmount:drafts.get(value.draftKey)!}:{})} onAmount={amount=>{makeSharedAction(p,'调整本次原款金额',()=>onDraft(value.draftKey,amount),{allowReadOnly:true,canActivate:current}).activate()}}/>
   <p className="obligation-choice-boundary">本次支付仍须确认。{value.account.prepaidLiabilityFen>0?'该账户客户保护'+moneyText(value.account.prepaidLiabilityFen)+'，可用范围由原付款资格核对。':'原款性质与其它安排继续按各自原账。'}</p>
  </>}
 </Dialog>
}
