import type {GamePanelProps} from './game-types.ts'
import {currentDueReading} from './cash-gap-reading.ts'
import {moneyText} from './game-text.ts'
type Scope=Pick<GamePanelProps,'view'|'features'>
type Debt=GamePanelProps['features']['workbench']['finance'][number]['obligations'][number]
export type ObligationSceneTarget={readonly kind:'payment';readonly runId:string;readonly accountId:string;readonly obligationId:string;readonly businessId:string|null;readonly contractId:string|null;readonly originOperationId:string;readonly sourceEventId:string;readonly dueAt:string;readonly originalFen:number}|{readonly kind:'cash-pause';readonly runId:string;readonly instanceId:string}
export function obligationSceneKey(t:ObligationSceneTarget):string{return t.kind==='cash-pause'?JSON.stringify([t.kind,t.runId,t.instanceId]):JSON.stringify([t.kind,t.runId,t.accountId,t.obligationId,t.businessId,t.contractId,t.originOperationId,t.sourceEventId,t.dueAt,t.originalFen])}
function targetFor(p:Scope,d:Debt):ObligationSceneTarget{return {kind:'payment',runId:p.view.runId,accountId:d.accountId,obligationId:d.id,businessId:d.businessId,contractId:d.contractId,originOperationId:d.originOperationId,sourceEventId:d.sourceEventId,dueAt:d.date,originalFen:d.amountFen}}
export function obligationTargetFor(p:Scope,debt:Debt):ObligationSceneTarget|null{
 const matches=currentDueReading(p)?.debts.filter(d=>d.id===debt.id&&d.accountId===debt.accountId&&d.date<=p.view.date)??[]
 return matches.length===1&&JSON.stringify(matches[0])===JSON.stringify(debt)?targetFor(p,matches[0]!):null
}
export function cashPauseTarget(p:Scope):ObligationSceneTarget|null{const pause=p.features.workbench.pause;return pause?.reason==='CASH_SHORTFALL'?{kind:'cash-pause',runId:p.view.runId,instanceId:pause.instanceId}:null}
/** Several real debts require explicit selection; never pick the first. */
export function singleObligationTarget(p:Scope):ObligationSceneTarget|null{const current=currentDueReading(p);if(!current)return null;const due=current.debts.filter(d=>d.date<=p.view.date);return due.length===1?targetFor(p,due[0]!):due.length===0?cashPauseTarget(p):null}
export function resolveObligationScene(p:Scope,target:ObligationSceneTarget){
 const invalid=(reason:string)=>({status:'invalid' as const,reason})
 if(target.runId!==p.view.runId)return invalid('这份责任不属于当前人生，请重新选择原款。')
 if(target.kind==='cash-pause'){const actual=cashPauseTarget(p);return actual&&obligationSceneKey(actual)===obligationSceneKey(target)?{status:'pause' as const}:invalid('这次停点已经变化，请回到当前责任重新核对。')}
 const current=currentDueReading(p);if(!current)return invalid('原款来源尚待核对，请翻看完整原账；没有替你换到另一笔。')
 const rows=current.debts.filter(d=>d.id===target.obligationId&&d.accountId===target.accountId),debt=rows[0],account=p.view.accounts.find(a=>a.accountId===target.accountId),finance=current.finance.find(f=>f.accountId===target.accountId)
 if(rows.length!==1||!debt||obligationSceneKey(targetFor(p,debt))!==obligationSceneKey(target)||debt.date>p.view.date||!account||!finance||account.availableFen!==finance.availableFen)return invalid('这笔到期款已变化或不再待付，请按当前原账重新选择。')
 return {status:'payment' as const,debt,account,finance,draftKey:obligationSceneKey(target)+'|'+debt.remainingFen}
}
export function obligationSceneMoment(p:Scope){
 if(p.features.workbench.pause?.reason!=='CASH_SHORTFALL')return null
 const target=singleObligationTarget(p);if(!target)return null;const value=resolveObligationScene(p,target);if(value.status==='invalid')return null
 if(value.status==='pause')return {target,title:'款项已处理，接着过今天。',line:'当前已无未付到期款，原停点还等你确认。',detail:'确认只处理停点，日历仍停在今天。',label:'确认这次暂停'}
 const owner=value.debt.accountId==='personal'?'个人账户':p.features.workbench.routes.find(r=>r.accountId===value.debt.accountId)?.name??'原企业账户'
 return {target,title:'这笔支出，到了要面对的时候。',line:owner+' · 尚欠'+moneyText(value.debt.remainingFen)+' · '+value.debt.date+'到期',detail:'该账户当前可花'+moneyText(value.account.availableFen)+'；部分支付与继续原日子分别决定。',label:'核对这笔到期款'}
}
