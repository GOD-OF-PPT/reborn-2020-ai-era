import type {GamePanelProps} from './game-types.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {playableThrough} from './game-text.ts'

type Input=Pick<GamePanelProps,'view'|'features'|'accountId'>
export interface RelayNextServiceCustomer{
 readonly id:string
 readonly number:number
 readonly termEnd:string
 readonly coverage:'covers'|'short'|'closed'|'unknown'
 readonly reason:string
 readonly termsKnown:boolean
}
export interface RelayNextServiceContract{
 readonly window:{readonly from:string;readonly to:string;readonly minimumTermEnd:string}|null
 readonly customers:readonly RelayNextServiceCustomer[]
 readonly reason:string|null
}
/** A public contract prerequisite, never a permission preview or a proposed service date. */
export function relayNextServiceContract(p:Input,target:RelaySceneTarget):RelayNextServiceContract{
 const unavailable=(reason:string):RelayNextServiceContract=>({window:null,customers:[],reason})
 const v=p.features.relay,r=resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(!v||target.kind!=='business'||r.status!=='valid')return unavailable(r.reason??'原企业与站点尚未唯一核对；没有换到别处拟新约。')
 let window:NonNullable<RelayNextServiceContract['window']>
 try{
  isoDate(p.view.date)
  if(!Number.isSafeInteger(v.catalog.serviceDays)||v.catalog.serviceDays<=0)return unavailable('原服务日数尚待核对，没有用默认日数补齐。')
  const from=addDays(p.view.date,1),to=addDays(from,v.catalog.serviceDays)
  isoDate(from);isoDate(to)
  if(from>playableThrough)return unavailable('最早开工已经超过原可安排日期上限；原约与旧责任仍保留。')
  window={from,to,minimumTermEnd:addDays(from,v.catalog.serviceDays-1)}
 }catch{return unavailable('原当前日期或服务窗口尚待核对；没有猜一个新的开工日。')}
 const own=v.customers.filter(c=>c.businessId===target.businessId)
 const customers=own.map((c,index):RelayNextServiceCustomer=>{
  let termsKnown=false
  try{termsKnown=isoDate(c.activeTerms.effectiveAt)<=p.view.date&&typeof c.activeTerms.sourceId==='string'&&c.activeTerms.sourceId.trim().length>0&&Number.isSafeInteger(c.activeTerms.unitPriceFen)&&c.activeTerms.unitPriceFen>=0&&Number.isSafeInteger(c.activeTerms.serviceFeeFen)&&c.activeTerms.serviceFeeFen>=0}catch{/* Public source remains unknown. */}
  const base={id:c.id,number:index+1,termEnd:c.termEnd,termsKnown}
  if(v.customers.filter(row=>row.id===c.id).length!==1)return {...base,coverage:'unknown',reason:'原客户身份重复，先核对原册；没有换成另一位。'}
  try{
   isoDate(c.signedAt);isoDate(c.termEnd)
   if(c.closedAt!==null){isoDate(c.closedAt);if(c.closedAt>p.view.date)throw Error('FUTURE_CLOSE');return {...base,coverage:'closed',reason:'原合同已关闭；若要重谈，仍须显选这位客户的原续签。'}}
   if(!termsKnown)return {...base,coverage:'unknown',reason:'当前有效报价的原来源尚待核对，不把未知当作可服务。'}
   if(c.signedAt>window.from||window.to>addDays(c.termEnd,1))return {...base,coverage:'short',reason:'原期限不能覆盖最早服务窗口；先决定是否续签，不自动顺延。'}
   return {...base,coverage:'covers',reason:'原期限可覆盖最早窗口；资金、行动、供应与实际所选日期仍须原核对。'}
  }catch{return {...base,coverage:'unknown',reason:'原签约、期限或关闭日期尚待核对，不把未知当作已到期或零。'}}
 })
 return {window,customers,reason:null}
}
