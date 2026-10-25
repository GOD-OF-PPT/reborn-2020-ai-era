import {useRef,useState,type Dispatch,type SetStateAction} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {RelaySceneDraftSlot} from './relay-scene-draft.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {isoDate} from '../core/calendar.ts'
import {parseMoneyInput} from './money-input.ts'
import {playableThrough} from './game-text.ts'

export type RelayPreparationSlot='open'|'capital'|'basics'|'materials'|'application'|'adapter'|'marketing'|'offer'|'customers'|'customer-funds'|'supplier-funds'
export type RelayChoiceDraftSlot=RelaySceneDraftSlot|RelayPreparationSlot
export const isRelayPreparationSlot=(slot:unknown):slot is RelayPreparationSlot=>typeof slot==='string'&&['open','capital','basics','materials','application','adapter','marketing','offer','customers','customer-funds','supplier-funds'].includes(slot)
export interface RelayPreparationScope{
 readonly accountId:string
 readonly businessId:string|null
 readonly stationId:string|null
 readonly applicationId:string|null
 readonly audienceId:string|null
 readonly customerId:string|null
 readonly periodId:string|null
 readonly jobId:string|null
 readonly meterId:string|null
 readonly slot:RelayPreparationSlot
}
export interface RelayPreparationDraft{
 amount:string
 resources:string[]
 startAt:string
 supplierId:string
 segment:''|'ai_learners'|'local_merchants'|'lifestyle'
 marketingMode:''|'paid'|'video_referral'
 videoCohortIds:string[]
 offerKind:''|'low_margin'|'managed_support'
 unitPrice:string
 audienceId:string
 offerId:string
 personIds:string[]
 paymentMode:''|'prepaid'|'postpaid'
 creditLimit:string
 termEnd:string
 customerId:string
}
export const emptyRelayPreparationDraft=():RelayPreparationDraft=>({amount:'',resources:[],startAt:'',supplierId:'',segment:'',marketingMode:'',videoCohortIds:[],offerKind:'',unitPrice:'',audienceId:'',offerId:'',personIds:[],paymentMode:'',creditLimit:'',termEnd:'',customerId:''})
const copy=(draft:RelayPreparationDraft):RelayPreparationDraft=>({...draft,resources:[...draft.resources],videoCohortIds:[...draft.videoCohortIds],personIds:[...draft.personIds]})
export function relayPreparationDraftKey(runId:string,scope:RelayPreparationScope):string{
 return JSON.stringify([runId,scope.accountId,scope.businessId,scope.stationId,scope.applicationId,scope.audienceId,scope.customerId,scope.periodId,scope.jobId,scope.meterId,scope.slot])
}
export function relayPreparationAnchor(target:RelaySceneTarget|null,slot:RelayPreparationSlot):string{
 return 'relay-preparation:'+slot+':'+(target===null?'entry':target.businessId+':'+target.kind+':'+(target.kind==='application'?target.applicationId:target.kind==='audience'?target.audienceId:target.kind==='customer'?target.customerId:target.kind==='period'?target.periodId+':'+(target.jobId??target.meterId??'current'):'station'))
}
export interface RelayPreparationDraftMemory{
 read(runId:string,scope:RelayPreparationScope):RelayPreparationDraft|undefined
 write(runId:string,scope:RelayPreparationScope,draft:RelayPreparationDraft):boolean
}
/** A life owns this UI-only map; revision, dates and pages never change draft identity. */
export function createRelayPreparationDraftMemory(runId:string):RelayPreparationDraftMemory{
 const drafts=new Map<string,RelayPreparationDraft>()
 return {
  read(requested,scope){if(requested!==runId)return undefined;const value=drafts.get(relayPreparationDraftKey(runId,scope));return value?copy(value):undefined},
  write(requested,scope,draft){if(requested!==runId)return false;drafts.set(relayPreparationDraftKey(runId,scope),copy(draft));return true},
 }
}
export type RelayPreparationDraftUpdate=Dispatch<SetStateAction<RelayPreparationDraft>>
export function useRelayPreparationDraft(runId:string,scope:RelayPreparationScope|null,memory?:RelayPreparationDraftMemory):readonly [RelayPreparationDraft,RelayPreparationDraftUpdate]{
 const key=scope?relayPreparationDraftKey(runId,scope):JSON.stringify([runId,null]),read=()=>scope?memory?.read(runId,scope)??emptyRelayPreparationDraft():emptyRelayPreparationDraft()
 const [stored,setStored]=useState(()=>({key,draft:read()})),draft=scope?memory?.read(runId,scope)??(stored.key===key?stored.draft:read()):read(),latest=useRef({key,draft})
 latest.current={key,draft}
 const update:RelayPreparationDraftUpdate=value=>{
  if(!scope)return
  const previous=memory?.read(runId,scope)??(latest.current.key===key?latest.current.draft:read()),next=copy(typeof value==='function'?value(copy(previous)):value)
  memory?.write(runId,scope,next);latest.current={key,draft:next};setStored({key,draft:next})
 }
 return [draft,update]
}
type Input=Pick<GamePanelProps,'view'|'features'|'accountId'>
export function relayPreparationScopeForTarget(p:Input,target:RelaySceneTarget|null,slot:RelayPreparationSlot):{scope:RelayPreparationScope|null;reason:string|null}{
 const empty={applicationId:null,audienceId:null,customerId:null,periodId:null,jobId:null,meterId:null}
 if(slot==='open'){
  if(target!==null||p.accountId!=='personal'||!p.view.accounts.some(a=>a.accountId==='personal'))return {scope:null,reason:'新站须明确从个人自有资金入口准备；没有改用另一份账。'}
  return {scope:{accountId:'personal',businessId:null,stationId:null,...empty,slot},reason:null}
 }
 const resolved=resolveRelaySceneTarget(p.features.relay,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(!target||resolved.status!=='valid')return {scope:null,reason:resolved.reason??'先明确选择这间中转站，再准备眼前一步。'}
 return {scope:{accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,...empty,...(target.kind==='application'?{applicationId:target.applicationId}:target.kind==='audience'?{audienceId:target.audienceId}:target.kind==='customer'?{customerId:target.customerId}:target.kind==='period'?{periodId:target.periodId,jobId:target.jobId??null,meterId:target.meterId??null}:{}),slot},reason:null}
}
const unique=(values:readonly string[])=>new Set(values).size===values.length
const validDate=(value:string)=>{try{isoDate(value);return true}catch{return false}}
/** Zero credit is a real explicit choice; an empty field is never converted to zero. */
const creditAmount=(value:string)=>/^0+(?:\.0{1,2})?$/.test(value)?0:parseMoneyInput(value)
export function relayPreparationDraftIssue(p:Input,target:RelaySceneTarget|null,slot:RelayPreparationSlot,draft:RelayPreparationDraft):string|null{
 const checked=relayPreparationScopeForTarget(p,target,slot);if(checked.reason)return checked.reason
 const relay=p.features.relay;if(!relay)return '当前没有可核的中转经营记录。'
 if(['open','capital','customer-funds','supplier-funds'].includes(slot)&&parseMoneyInput(draft.amount)===null)return '先明确填写这一次的金额（元），不自动投入或充值。'
 const scheduled=slot==='basics'||slot==='materials'||slot==='application'||slot==='adapter'||slot==='marketing'&&draft.marketingMode==='paid'
 if(scheduled){
  if(!draft.resources.length)return '先明确选择本次实际资源。'
  if(!unique(draft.resources)||draft.resources.some(id=>!relay.resources.some(r=>r.id===id)))return '原资源已不可用或重复，草稿保留，请明确重选；没有改给本人。'
  if(!validDate(draft.startAt)||draft.startAt<p.view.date||draft.startAt>playableThrough)return '先明确选择有效开工日；过期日期保留，没有改成今天。'
 }
 if(slot==='application'||slot==='adapter'||slot==='supplier-funds'){
  if(!draft.supplierId||!relay.catalog.suppliers.some(s=>s.id===draft.supplierId))return '先明确选择这一次的供应。'
  const application=target?.kind==='application'?relay.applications.find(a=>a.id===target.applicationId):null
  if(application&&application.supplierId!==draft.supplierId)return '这里仍是这份申请的供应；请回到本站再明确选择另一家。'
 }
 if(slot==='marketing'){
  if(!['ai_learners','local_merchants','lifestyle'].includes(draft.segment))return '先明确选择想了解的客群。'
  if(!['paid','video_referral'].includes(draft.marketingMode))return '先明确选择付费获客或已有视频受众。'
  if(draft.marketingMode==='video_referral'&&(!draft.videoCohortIds.length||!unique(draft.videoCohortIds)||draft.videoCohortIds.some(id=>!relay.videoCohorts.some(c=>c.id===id&&c.segment===draft.segment&&c.date<=p.view.date))))return '原视频来源为空、重复或已不符合所选客群；保留草稿，请明确重选。'
 }
 if(slot==='offer'){
  if(!relay.catalog.offers.some(o=>o.id===draft.offerKind))return '先明确选择这一次的收费方案。'
  if(!/^\d+$/.test(draft.unitPrice)||!Number.isSafeInteger(Number(draft.unitPrice))||Number(draft.unitPrice)<1)return '先明确填写用量单价（分/千模拟token）。'
 }
 if(slot==='customers'){
  const audience=relay.audiences.find(a=>a.id===draft.audienceId&&a.businessId===target!.businessId&&a.completedAt!==null)
  if(!audience||target?.kind==='audience'&&target.audienceId!==audience.id)return '先明确选择本站已实际形成的原潜客名单；没有换成最新一批。'
  if(!relay.offers.some(o=>o.id===draft.offerId&&o.businessId===target!.businessId))return '先明确选择已保存报价；没有换成最新报价。'
  if(!draft.personIds.length||!unique(draft.personIds)||draft.personIds.some(id=>!audience.members.includes(id)))return '先逐位明确选择这份名单中的潜客；失效选择保留，没有按人数截取或过滤。'
  if(draft.personIds.some(id=>relay.customers.some(c=>c.personId===id)))return '所选身份已有原客户记录，请明确调整名单；没有重复签约或代删此人。'
  if(!['prepaid','postpaid'].includes(draft.paymentMode))return '先明确选择预付或后付条件。'
  if(draft.paymentMode==='postpaid'&&creditAmount(draft.creditLimit)===null)return '先明确填写每位客户的后付信用上限（元，可明确填0）。'
  if(!validDate(draft.termEnd)||draft.termEnd<p.view.date||draft.termEnd>playableThrough)return '先明确选择有效合同期限；原日期保留，没有自动顺延。'
 }
 if(slot==='customer-funds'){
  if(!relay.customers.some(c=>c.id===draft.customerId&&c.businessId===target!.businessId&&c.closedAt===null)||target?.kind==='customer'&&draft.customerId!==target.customerId)return '先明确选择这位未关闭的本站原客户；没有换人充值。'
 }
 return null
}
export interface RelayPreparationCommand{readonly kind:string;readonly payload:unknown;readonly label:string;readonly confirm:true}
export function relayPreparationDraftCommand(p:Input,target:RelaySceneTarget|null,slot:RelayPreparationSlot,draft:RelayPreparationDraft):RelayPreparationCommand|null{
 if(relayPreparationDraftIssue(p,target,slot,draft))return null
 const businessId=target?.businessId,assignment={resources:[...draft.resources],startAt:draft.startAt},amountFen=parseMoneyInput(draft.amount)
 const result=(kind:string,payload:unknown,label:string):RelayPreparationCommand=>({kind,payload,label,confirm:true})
 switch(slot){
  case 'open':return result('OpenRelayStation',{capitalFen:amountFen!},'核对自有资本，准备这间中转站')
  case 'capital':return result('FundBusiness',{businessId,amountFen:amountFen!},'核对个人追加给本站的资本')
  case 'basics':case 'materials':return result('StartRelayPreparation',{businessId,preparation:slot,...assignment},slot==='basics'?'核对技术学习的时间与投入':'核对供应申请材料的时间与投入')
  case 'application':return result('ApplyRelaySupply',{businessId,supplierId:draft.supplierId,...assignment},'核对这家供应的申请与投入')
  case 'adapter':return result('StartRelayAdapter',{businessId,supplierId:draft.supplierId,...assignment},'核对这家供应的独立适配')
  case 'marketing':return result('StartRelayMarketing',{businessId,segment:draft.segment,mode:draft.marketingMode,...(draft.marketingMode==='paid'?assignment:{videoCohortIds:[...draft.videoCohortIds]})},draft.marketingMode==='paid'?'核对这次付费获客':'核对这些已有视频受众的需求')
  case 'offer':return result('SetRelayOffer',{businessId,offerKind:draft.offerKind,unitPriceFen:Number(draft.unitPrice)},'核对仅供后续签约的报价')
  case 'customers':return result('SignRelayCustomers',{businessId,audienceId:draft.audienceId,offerId:draft.offerId,personIds:[...draft.personIds],termEnd:draft.termEnd,mode:draft.paymentMode,creditLimitFen:draft.paymentMode==='postpaid'?creditAmount(draft.creditLimit)!:0},'核对这几位客户、收款条件与期限')
  case 'customer-funds':return result('RechargeRelayCustomer',{customerId:draft.customerId,amountFen:amountFen!},'核对这位客户的独立充值')
  case 'supplier-funds':return result('TopUpRelaySupplier',{businessId,supplierId:draft.supplierId,amountFen:amountFen!},'核对自有资金转为供应资产')
 }
}
