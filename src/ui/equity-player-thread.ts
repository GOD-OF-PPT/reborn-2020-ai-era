import {quarterOf} from '../core/calendar.ts'
import {deepseekId} from '../core/deepseek-state.ts'
import {operatingId} from '../core/operations-calendar.ts'
import type {SceneCommand} from '../application/scene-commands.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus,PlayerThreadView} from './player-thread.ts'
import {equityJourney,type EquityJourneyContext} from './equity-journey.ts'
import {equityTargetEntity,resolveEquitySceneTarget,type EquitySceneTarget} from './equity-scene-target.ts'

export type EquityThreadInput={
 readonly view:Pick<GamePanelProps['view'],'runId'|'revision'|'date'|'phase'|'accounts'|'operations'|'receipts'|'saveStatus'|'hasCandidate'|'readOnly'>
 readonly features:Pick<GamePanelProps['features'],'deepseek'|'sceneCommands'>&{readonly workbench:Pick<GamePanelProps['features']['workbench'],'quarter'|'finance'>}
}
type Input=EquityThreadInput
export type EquityOpeningFocus={readonly kind:'equity';readonly runId:string;readonly accountId:string;readonly entityId:string|null;readonly businessId?:string;readonly equityTarget:EquitySceneTarget|null}
type Scene=Pick<PlayerThreadView,'stage'|'object'|'title'|'line'|'detail'|'outcome'|'inspect'|'resultRefs'|'command'|'secondaryCommand'|'wait'>
export function equitySceneContext(p:Input,accountId:string):EquityJourneyContext{return {runId:p.view.runId,accountId,date:p.view.date,accounts:p.view.accounts,operations:p.view.operations,finance:p.features.workbench.finance,source:{revision:p.view.revision,receipts:p.view.receipts},...(p.features.sceneCommands?{sceneCommands:p.features.sceneCommands}:{})}}
export function equityFocusFor(p:Input,target:EquitySceneTarget|null=null,accountId?:string):EquityOpeningFocus{return {kind:'equity',runId:p.view.runId,accountId:accountId??target?.accountId??'personal',entityId:target?equityTargetEntity(target):null,equityTarget:target,...(target?{businessId:target.businessId}:{})}}
export function resolveEquityFocus(p:Input,focus:EquityOpeningFocus):{focus:EquityOpeningFocus;reason:string|null}{
 if(focus.runId!==p.view.runId)return {focus,reason:'这份架空权益关注来自另一段人生，请重新选择。'}
 const target=focus.equityTarget
 if(target===null)return {focus,reason:focus.accountId==='personal'&&focus.entityId===null&&focus.businessId===undefined?resolveEquitySceneTarget(p.features.deepseek,null,equitySceneContext(p,focus.accountId)).reason:'尚未选择权益主体的方向不能绑定另一账户。'}
 const r=resolveEquitySceneTarget(p.features.deepseek,target,equitySceneContext(p,focus.accountId))
 return {focus,reason:r.reason??(focus.businessId!==target.businessId||focus.entityId!==equityTargetEntity(target)?'原权益关注与完整记录身份不一致，没有换对象。':null)}
}
export const equityJourneyFor=(p:Input,f:EquityOpeningFocus)=>equityJourney(p.features.deepseek,f.equityTarget,equitySceneContext(p,f.accountId))
export function equityFocusQuarter(p:Input,f:EquityOpeningFocus):string|null{if(f.equityTarget===null)return p.features.workbench.quarter;const date=equityJourneyFor(p,f).originDate;try{return date?quarterOf(date):null}catch{return null}}
export function equityCurrentDecision(p:Input,f:EquityOpeningFocus):boolean{
 if(resolveEquityFocus(p,f).reason)return false
 const j=equityJourneyFor(p,f),t=f.equityTarget
 return j.decisionOpen||t?.kind==='business'&&j.resolution.business?.lifecycle!=='closed'||t?.kind==='agreement'&&!!j.resolution.agreement&&(j.resolution.agreement.shares>0||j.resolution.agreement.followDecision==='pending')||t?.kind==='exit'&&(j.resolution.exit?.receivable?.remainingFen??0)>0
}
/** Relevant current holdings are recoverable without presenting them as unfinished work. */
export function equityFocusOpen(p:Input,f:EquityOpeningFocus):boolean{return resolveEquityFocus(p,f).reason===null&&(equityJourneyFor(p,f).active||equityCurrentDecision(p,f))}
export const equityFocusResultDate=(p:Input,f:EquityOpeningFocus)=>equityJourneyFor(p,f).resultDate
export function equityPlayerScene(p:Input,f:EquityOpeningFocus):Scene{
 const j=equityJourneyFor(p,f),r=j.resolution,t=f.equityTarget
 const resultRefs:Scene['resultRefs']=[...(t?[{kind:t.kind,id:equityTargetEntity(t),date:j.originDate}]:[]),...(r.job?[{kind:'job' as const,id:r.job.id,date:r.job.startAt}]:[])]
 const a=j.action
 return {stage:'equity-'+j.phase,object:j.object,title:j.title,line:j.line,detail:j.facts.join(' '),outcome:j.outcome,resultRefs,
  inspect:{screen:'deepseek',label:'翻阅这份架空权益与原账',target:{deepseekPane:'equity',equityTarget:t,accountId:f.accountId,...(t?{recordId:equityTargetEntity(t)}:{}),openRecord:true}},
  ...(a.kind==='wait'?{wait:{date:a.date,label:a.label}}:a.kind==='command'?{command:{kind:a.command,payload:a.payload,label:a.label,confirm:a.confirm}}:{})}
}
export function equityFocusTargets(p:Input):readonly {target:EquitySceneTarget;date:string|null;label:string}[]{
 const v=p.features.deepseek;if(!v)return []
 const rows:{target:EquitySceneTarget;date:string|null;label:string}[]=[]
 for(const b of v.businesses.filter(b=>['deepseek-investor','ecosystem-service'].includes(b.definitionId))){
  const identity={runId:p.view.runId,accountId:b.accountId,businessId:b.id}
  const add=(kind:Exclude<EquitySceneTarget['kind'],'business'>,recordId:string,date:string|null,label:string)=>rows.push({target:{...identity,kind,recordId},date,label})
  rows.push({target:{...identity,kind:'business'},date:b.history[0]?.date??null,label:b.company?'这份生态企业的架空参与准备':'这份个人架空参与准备'})
  for(const r of v.preparations.filter(r=>r.businessId===b.id&&['relationship','eligibility'].includes(r.kind)))add('preparation',r.id,r.job?.startAt??null,r.kind==='relationship'?'这份原关系准备':'这份本局参与资格')
  for(const r of v.invitations.filter(r=>r.businessId===b.id))add('invitation',r.id,r.createdAt,(r.source==='referral'?'原合作介绍':'原未核中间人')+'的架空邀请')
  for(const r of v.negotiations.filter(r=>r.businessId===b.id))add('negotiation',r.id,r.createdAt,'这份'+(r.kind==='new_capital'?'新增资本':'老股转让')+'原条款')
  for(const r of v.agreements.filter(r=>r.businessId===b.id))add('agreement',r.id,r.signedAt,'这份已签署的明确架空协议')
  for(const r of v.governance.filter(r=>r.businessId===b.id))add('governance',r.id,r.createdAt,r.policy==='independent_audit'?'这次资本用途核对提案':'这次用途与接手方提案')
  for(const r of v.exits.filter(r=>r.businessId===b.id))add('exit',r.id,r.createdAt,'这笔原买方询价、转让与款项')
 }
 return rows
}

/** A relevant but unmatchable original command returns []; unrelated commands return null. */
export function equityCommandFocus(p:Input,c:SceneCommand):readonly OpeningFocus[]|null{
 const v=p.features.deepseek,f=c.identifiers,id=deepseekId(c.commandId,c.kind)
 const by=(kind:EquitySceneTarget['kind'],recordId:string|undefined)=>equityFocusTargets(p).filter(row=>row.target.kind===kind&&equityTargetEntity(row.target)===recordId).map(row=>equityFocusFor(p,row.target)).filter(focus=>resolveEquityFocus(p,focus).reason===null)
 if(c.kind==='EnableCounterfactualEquity')return v?.counterfactualEnabledAt===c.date?[equityFocusFor(p)]:[]
 if(c.kind==='OpenEquityDesk')return by('business',operatingId(deepseekId(id,'discover'),'DiscoverBusiness'))
 if(c.kind==='StartEquityRelationship'||c.kind==='StartEquityEligibility')return by('preparation',v?.preparations.find(r=>r.id===id&&r.businessId===f.businessId)?.id)
 if(c.kind==='DiscoverEquityInvitation')return by('invitation',v?.invitations.find(r=>r.id===id&&r.businessId===f.businessId)?.id)
 if(['PayUnverifiedBrokerFee','InvestigateEquityInvitation','RejectEquityInvitation'].includes(c.kind))return by('invitation',f.invitationId)
 if(c.kind==='StartEquityNegotiation')return by('negotiation',v?.negotiations.find(r=>r.id===id&&r.invitationId===f.invitationId)?.id)
 if(c.kind==='DeclineEquityTerms')return by('negotiation',f.negotiationId)
 if(c.kind==='SignEquityAgreement')return by('agreement',v?.agreements.find(r=>r.id===id&&r.negotiationId===f.negotiationId)?.id)
 if(c.kind==='FollowEquityRound')return by('agreement',f.agreementId)
 if(c.kind==='ProposeEquityGovernance')return by('governance',v?.governance.find(r=>r.id===id&&r.agreementId===f.agreementId)?.id)
 if(c.kind==='RequestEquityExit')return by('exit',v?.exits.find(r=>r.id===id&&r.agreementId===f.agreementId)?.id)
 if(c.kind==='AcceptEquityExit'||c.kind==='CollectEquityExit')return by('exit',f.exitId)
 if(c.kind==='InterruptJob'||c.kind==='RescheduleJob'){
  const rows=equityFocusTargets(p).filter(row=>resolveEquitySceneTarget(v,row.target,equitySceneContext(p,row.target.accountId)).job?.id===f.jobId)
  return rows.length?rows.map(row=>equityFocusFor(p,row.target)):null
 }
 return null
}

/** Only the exact saved public effect may follow a new original promise. */
export function equityFocusFromSaved(previous:Input,current:Input,kind:string,body:Record<string,unknown>,existing:EquityOpeningFocus|null=null):EquityOpeningFocus|null{
 const before=previous.features.deepseek,v=current.features.deepseek,view=current.view,last=view.receipts.at(-1)
 if(!before||!v||previous.view.runId!==view.runId||view.revision!==previous.view.revision+1||view.saveStatus!=='saved'||view.hasCandidate||view.readOnly||view.phase!=='playing'||last?.kind!==kind||last.revisionAfter!==view.revision||existing&&resolveEquityFocus(previous,existing).reason)return null
 const id=deepseekId(last.commandId,kind),added=<T extends {id:string}>(old:readonly T[],rows:readonly T[],test:(r:T)=>boolean)=>{const found=rows.filter(r=>r.id===id&&!old.some(o=>o.id===r.id)&&test(r));return found.length===1?found[0]!:null}
 const make=(businessId:string,kind:EquitySceneTarget['kind'],recordId?:string):EquitySceneTarget|null=>{const found=v.businesses.filter(b=>b.id===businessId);if(found.length!==1)return null;const b=found[0]!,identity={runId:view.runId,accountId:b.accountId,businessId};return kind==='business'?{...identity,kind}:recordId?{...identity,kind,recordId}:null}
 const assignment=(job:{startAt:string;resources:readonly string[]}|null)=>!!job&&job.startAt===body.startAt&&Array.isArray(body.resources)&&job.resources.length===body.resources.length&&job.resources.every((r,i)=>r===(body.resources as unknown[])[i])
 let next:EquitySceneTarget|null=null
 if(kind==='EnableCounterfactualEquity'&&body.acknowledge===true&&before.counterfactualEnabledAt===null&&v.counterfactualEnabledAt===view.date)return existing??equityFocusFor(current)
 if(kind==='OpenEquityDesk'){
  const expected=operatingId(deepseekId(id,'discover'),'DiscoverBusiness'),rows=v.businesses.filter(b=>b.id===expected&&b.definitionId==='deepseek-investor'&&!before.businesses.some(o=>o.id===b.id))
  if(rows.length===1&&rows[0]!.accountId==='personal')next=make(rows[0]!.id,'business')
 }
 if(kind==='StartEquityRelationship'||kind==='StartEquityEligibility'){const row=added(before.preparations,v.preparations,r=>r.businessId===body.businessId&&r.kind===(kind==='StartEquityRelationship'?'relationship':'eligibility')&&assignment(r.job));if(row)next=make(row.businessId,'preparation',row.id)}
 if(kind==='DiscoverEquityInvitation'){const row=added(before.invitations,v.invitations,r=>r.businessId===body.businessId&&r.source===body.source);if(row)next=make(row.businessId,'invitation',row.id)}
 if(['PayUnverifiedBrokerFee','InvestigateEquityInvitation','RejectEquityInvitation'].includes(kind)){
  const rows=v.invitations.filter(r=>r.id===body.invitationId&&before.invitations.some(old=>old.id===r.id&&old.businessId===r.businessId&&(kind==='PayUnverifiedBrokerFee'?old.brokerPaymentId===null&&r.brokerPaymentId===id:kind==='InvestigateEquityInvitation'?r.diligenceJobId===id&&assignment(r.diligenceJob):old.status==='open'&&r.status==='declined')))
  if(rows.length===1)next=make(rows[0]!.businessId,'invitation',rows[0]!.id)
 }
 if(kind==='StartEquityNegotiation'){const row=added(before.negotiations,v.negotiations,r=>r.invitationId===body.invitationId&&r.kind===body.acquisitionKind&&r.termsId===body.termsId&&r.amountFen===body.amountFen&&assignment(r.job));if(row)next=make(row.businessId,'negotiation',row.id)}
 if(kind==='DeclineEquityTerms'){const rows=v.negotiations.filter(r=>r.id===body.negotiationId&&r.closedKind==='declined'&&r.closedAt===view.date&&before.negotiations.some(old=>old.id===r.id&&old.closedAt===null));if(rows.length===1)next=make(rows[0]!.businessId,'negotiation',rows[0]!.id)}
 if(kind==='SignEquityAgreement'){const row=added(before.agreements,v.agreements,r=>r.negotiationId===body.negotiationId&&r.signedAt===view.date);if(row)next=make(row.businessId,'agreement',row.id)}
 if(kind==='FollowEquityRound'){const rows=v.agreements.filter(r=>r.id===body.agreementId&&r.followAt===view.date&&r.followAmountFen===body.amountFen&&['declined','participated'].includes(r.followDecision??'')&&before.agreements.some(old=>old.id===r.id&&old.followDecision==='pending'));if(rows.length===1)next=make(rows[0]!.businessId,'agreement',rows[0]!.id)}
 if(kind==='ProposeEquityGovernance'){const row=added(before.governance,v.governance,r=>r.agreementId===body.agreementId&&r.policy===body.policy&&assignment(r.job));if(row)next=make(row.businessId,'governance',row.id)}
 if(kind==='RequestEquityExit'){const row=added(before.exits,v.exits,r=>r.agreementId===body.agreementId&&r.shares===body.shares&&assignment(r.job));if(row)next=make(row.businessId,'exit',row.id)}
 if(kind==='AcceptEquityExit'||kind==='CollectEquityExit'){
  const rows=v.exits.filter(r=>r.id===body.exitId&&before.exits.some(old=>old.id===r.id&&old.businessId===r.businessId&&(kind==='AcceptEquityExit'?old.operationId===null&&r.operationId===id&&r.soldShares===body.shares:r.collectionOperationIds.includes(id)&&!old.collectionOperationIds.includes(id)&&typeof body.amountFen==='number'&&r.collectedFen-old.collectedFen===body.amountFen&&old.receivable&&r.receivable&&old.receivable.remainingFen-r.receivable.remainingFen===body.amountFen)))
  if(rows.length===1)next=make(rows[0]!.businessId,'exit',rows[0]!.id)
 }
 if(!next&&existing&&['InterruptJob','RescheduleJob'].includes(kind)&&equityJourneyFor(previous,existing).resolution.job?.id===body.jobId)next=existing.equityTarget
 if(!next&&existing&&['FundBusiness','WindDownBusiness','CloseBusiness','PauseBusiness','ResumeBusiness'].includes(kind)&&existing.businessId===body.businessId)next=existing.equityTarget
 if(!next)return null
 const focus=equityFocusFor(current,next)
 return resolveEquityFocus(current,focus).reason===null?focus:null
}
