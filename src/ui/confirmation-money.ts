import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
export function confirmationMoney(command:CommandEnvelope,preview:CommandPreview){
 if(command.kind==='RefundCourseLearners')return {label:'本次新增操作费用（学员退款另列）',amountFen:preview.upfrontCostFen}
 const p=typeof command.payload==='object'&&command.payload!==null?command.payload as Record<string,unknown>:{}
 const amount=(key:string)=>typeof p[key]==='number'&&Number.isSafeInteger(p[key])&&(p[key] as number)>=0?p[key] as number:null
 if(command.kind==='StartLifeWork'||command.kind==='FulfillLifePromise')return {label:'现在从个人账户实际支付的生活成本',amountFen:preview.upfrontCostFen}
 if(command.kind==='AcceptLifePromise')return {label:'本次接受的即时费用（后续工作与支出另行安排）',amountFen:0}
 if(['StartHengxingDeployment','StartLinzhouWork','StartAgentPreparation'].includes(command.kind))return {label:'本次开始时实际支付的自有成本',amountFen:preview.upfrontCostFen}
 if(command.kind==='StopHengxingAuthority')return {label:'本次新增服务承诺（已用费用另结）',amountFen:0}
 if(command.kind==='SetHengxingAuthority')return {label:'本次授权本身的费用（支持预算另列）',amountFen:0}
 if(command.kind==='StartRiskTask')return {label:'本次独立工作成本（原已用费另结）',amountFen:preview.upfrontCostFen-(preview.accruedServiceFeeFen??0)}
 if(command.kind==='FundBusiness'||command.kind==='DistributeProfit')return {label:command.kind==='FundBusiness'?'个人转入企业的资本（不是费用）':'从企业转回的已可分配资金',amountFen:amount('amountFen')}
 if(['OpenEcosystemService','OpenCourseStudio','OpenRelayStation'].includes(command.kind))return {label:'转入新企业的自有资本（不计收入或费用）',amountFen:amount('capitalFen')}
 if(command.kind==='SignEquityAgreement'||command.kind==='FollowEquityRound')return {label:'投资本金支付（不计经营费用）',amountFen:preview.upfrontCostFen}
 if(command.kind==='PayObligation')return {label:'偿还原有义务（不再确认一遍费用）',amountFen:amount('amountFen')}
 if(command.kind==='AdvanceTime'||command.kind==='AdvanceEpilogueTime')return {label:'推进本身费用（途中原费用逐项列在下方）',amountFen:preview.upfrontCostFen}
 if(command.kind==='AcceptEquityExit')return {label:'本次即时现金支出（转让费用从价款扣除）',amountFen:preview.upfrontCostFen}
 if(command.kind==='CancelEcoContract')return {label:'本次支持赔偿义务（现金不足则保留应付）',amountFen:preview.upfrontCostFen}
 if(command.kind==='StartFirstOrder')return {label:'安排时预留的自有资金（开工后才付制作费）',amountFen:preview.upfrontCostFen}
 if(command.kind.includes('StockOrder'))return {label:'新增资金预算（预留不等于成交）',amountFen:preview.upfrontCostFen}
 if(typeof p.startAt==='string'||preview.actionDate!==undefined)return {label:'需准备或预留的自有资金',amountFen:preview.upfrontCostFen}
 return {label:'本次确定费用',amountFen:preview.upfrontCostFen}
}
