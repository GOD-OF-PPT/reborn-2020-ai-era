import type {OpeningFirstOrderView} from './opening-attempt.ts'

export interface FirstOrderStage {
 readonly key:string
 readonly label:string
 readonly mark:string
 readonly tone:'active'|'complete'|'attention'|'closed'
}
const stage=(key:string,label:string,mark:string,tone:FirstOrderStage['tone']='active'):FirstOrderStage=>({key,label,mark,tone})

/** One presentation of an already resolved original attempt. This does not
 * advance a stage, authorize an action or infer an unseen customer response. */
export function firstOrderStage(first:OpeningFirstOrderView,threadStage:string):FirstOrderStage|null {
 if(first.phase==='letter'&&first.status==='available')return stage('offer','待你答复','◇')
 if(first.phase==='planned'&&first.status==='planned')return stage('planned','已安排 · 等开工','◇')
 if(first.phase==='running'&&first.status==='running')return stage('running','正在制作','●')
 if(first.phase==='delivery'&&first.status==='awaiting_submission'&&!first.needsAttention)return stage('delivery','制作完成 · 待提交','↗')
 if(first.phase==='feedback'&&first.status==='review')return stage('review','已交作品 · 等回信','…')
 if(first.phase==='feedback'&&first.status==='delivered'&&first.result.confirmedIncomeFen>0&&first.result.paymentFen===0)return stage('accepted','已验收 · 等付款','✓')
 if(first.phase==='paid'&&first.status==='settled'&&!first.needsAttention&&first.receipt&&Number.isSafeInteger(first.result.paymentFen)&&first.result.paymentFen>0&&first.receipt.amountFen===first.result.paymentFen)return stage('paid','已实际收款','✓','complete')
 if(first.phase!=='non-success')return null
 if(threadStage==='missed'&&first.status==='awaiting_submission'&&first.needsAttention)return stage('missed','交付已逾期 · 仍需处理','!','attention')
 if(first.status==='interrupted'&&first.needsAttention)return stage('interrupted','制作已中断 · 仍需处理','!','attention')
 if(first.status==='declined')return stage('declined','已婉拒 · 未接单','—','closed')
 if(first.status==='skipped')return stage('skipped','已略过 · 未接单','—','closed')
 if(first.status==='expired'||first.status==='unavailable')return stage('expired','报价已到期','—','closed')
 if(first.status==='cancelled')return stage('cancelled','已取消 · 原记录保留','—','closed')
 if(first.status==='rejected')return stage('rejected','未获验收 · 原记录保留','—','closed')
 return null
}
