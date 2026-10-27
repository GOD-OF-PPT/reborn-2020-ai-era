import {quarterOf} from '../core/calendar.ts'
import {deepseekId} from '../core/deepseek-state.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus,PlayerThreadView} from './player-thread.ts'
import {ecosystemJourney,type EcosystemJourneyContext} from './ecosystem-journey.ts'
import {ecosystemTargetEntity,resolveEcosystemSceneTarget,type EcosystemSceneTarget} from './ecosystem-scene-target.ts'

export type EcosystemThreadInput={
 readonly view:Pick<GamePanelProps['view'],'runId'|'revision'|'date'|'phase'|'accounts'|'operations'|'receipts'|'saveStatus'|'hasCandidate'|'readOnly'>
 readonly features:Pick<GamePanelProps['features'],'deepseek'>&{readonly workbench:Pick<GamePanelProps['features']['workbench'],'quarter'|'routes'|'finance'>}
}
type Input=EcosystemThreadInput
export type EcosystemOpeningFocus=Extract<OpeningFocus,{kind:'ecosystem'}>
type Scene=Pick<PlayerThreadView,'stage'|'object'|'title'|'line'|'detail'|'outcome'|'inspect'|'resultRefs'|'command'|'secondaryCommand'|'wait'>
export function ecosystemSceneContext(p:Input,accountId:string):EcosystemJourneyContext{
 const transactions=p.features.workbench.finance.find(a=>a.accountId===accountId)?.transactions
 return {runId:p.view.runId,accountId,accounts:p.view.accounts,operations:p.view.operations,date:p.view.date,materialsReady:p.features.workbench.routes.find(r=>r.id==='deepseek_opportunity')?.requirements.preparationReady===true,finance:p.features.workbench.finance,...(transactions?{transactions}:{})}
}
export function ecosystemFocusFor(p:Input,target:EcosystemSceneTarget|null=null,accountId?:string):EcosystemOpeningFocus{
 return {kind:'ecosystem',runId:p.view.runId,accountId:accountId??target?.accountId??'personal',entityId:target?ecosystemTargetEntity(target):null,ecosystemTarget:target,...(target?{businessId:target.businessId}:{})}
}
export function resolveEcosystemFocus(p:Input,focus:EcosystemOpeningFocus):{focus:EcosystemOpeningFocus;reason:string|null}{
 const bad=(reason:string)=>({focus,reason}),target=focus.ecosystemTarget
 if(focus.runId!==p.view.runId)return bad('这份生态关注来自另一段人生，请重新选择。')
 if(target===null)return focus.accountId==='personal'&&focus.entityId===null&&focus.businessId===undefined?{focus,reason:null}:bad('尚未选择生态企业的方向不能绑定另一主体。')
 const resolved=resolveEcosystemSceneTarget(p.features.deepseek,target,ecosystemSceneContext(p,focus.accountId))
 if(resolved.reason)return bad(resolved.reason)
 if(focus.businessId!==target.businessId||focus.entityId!==ecosystemTargetEntity(target))return bad('原生态关注与完整记录身份不一致，没有替换对象。')
 return {focus,reason:null}
}
export const ecosystemJourneyFor=(p:Input,f:EcosystemOpeningFocus)=>ecosystemJourney(p.features.deepseek,f.ecosystemTarget,ecosystemSceneContext(p,f.accountId))
export function ecosystemFocusQuarter(p:Input,f:EcosystemOpeningFocus):string|null{
 if(f.ecosystemTarget===null)return p.features.workbench.quarter
 const from=ecosystemJourneyFor(p,f).originDate
 return from?quarterOf(from):null
}
export function ecosystemFocusOpen(p:Input,f:EcosystemOpeningFocus):boolean{
 if(resolveEcosystemFocus(p,f).reason)return false
 const journey=ecosystemJourneyFor(p,f),b=journey.resolution.business
 return journey.active||f.ecosystemTarget?.kind==='business'&&!!b&&(b.lifecycle==='preparing'||b.funds.receivableFen>0||b.funds.payableFen>0)
}
export const ecosystemFocusResultDate=(p:Input,f:EcosystemOpeningFocus)=>ecosystemJourneyFor(p,f).resultDate

/** The age of a business or an unanswered lead is not a promise to perform work. */
export function ecosystemCurrentDecision(p:Input,f:EcosystemOpeningFocus):boolean{
 if(resolveEcosystemFocus(p,f).reason)return false
 const t=f.ecosystemTarget,j=ecosystemJourneyFor(p,f),b=j.resolution.business
 if(t?.kind==='lead')return j.resolution.lead?.status==='open'&&j.resolution.lead.expiresAt>=p.view.date
 const c=j.resolution.contract
 if(c&&['completed','cancelled'].includes(c.status)&&(t?.kind==='contract'||t?.kind==='delivery'&&(j.resolution.delivery?.remainingFen??0)>0))return (c.balance?.receivableFen??0)>0||p.features.workbench.finance.some(a=>a.accountId===f.accountId&&a.obligations.some(o=>o.businessId===c.businessId&&o.contractId===c.id&&o.remainingFen>0))
 return t?.kind==='business'&&!!b&&b.lifecycle!=='closed'&&!p.view.operations?.jobs.some(job=>job.businessId===b.id&&['planned','running'].includes(job.status))
}

export function ecosystemPlayerScene(p:Input,f:EcosystemOpeningFocus):Scene{
 const journey=ecosystemJourneyFor(p,f),r=journey.resolution,t=f.ecosystemTarget
 const refKind:Record<EcosystemSceneTarget['kind'],Scene['resultRefs'][number]['kind']>={business:'business',contract:'contract',delivery:'receivable',lead:'lead',adapter:'adapter',preparation:'preparation',outreach:'outreach'}
 const resultRefs:Scene['resultRefs']=[...(t?[{kind:refKind[t.kind],id:ecosystemTargetEntity(t),date:journey.originDate}]:[]),...(r.job?[{kind:'job' as const,id:r.job.id,date:r.job.startAt}]:[])]
 const action=journey.action
 return {stage:'ecosystem-'+journey.phase,object:journey.object,title:journey.title,line:journey.line,detail:journey.facts.join(' '),outcome:journey.outcome,resultRefs,
  inspect:{screen:'deepseek',label:'翻阅这份生态合作与原账',target:{deepseekPane:'ecosystem',accountId:f.accountId,ecosystemTarget:t,...(t?{recordId:ecosystemTargetEntity(t)}:{}),openRecord:true}},
  ...(action.kind==='wait'?{wait:{date:action.date,label:action.label}}:action.kind==='command'?{command:{kind:action.command,payload:action.payload,label:action.label,confirm:action.confirm}}:{})}
}

/** All candidates are explicit UI choices. A list neither executes nor changes the saved focus. */
export function ecosystemFocusTargets(p:Input):readonly {target:EcosystemSceneTarget;date:string|null;label:string}[]{
 const v=p.features.deepseek;if(!v)return []
 const result:{target:EcosystemSceneTarget;date:string|null;label:string}[]=[]
 for(const b of v.businesses.filter(b=>b.definitionId==='ecosystem-service')){
  const identity={runId:p.view.runId,accountId:b.accountId,businessId:b.id},add=(kind:Exclude<EcosystemSceneTarget['kind'],'business'>,id:string,date:string|null,label:string)=>result.push({target:{...identity,kind,recordId:id},date,label})
  result.push({target:{...identity,kind:'business'},date:b.history[0]?.date??null,label:'原生态企业的准备与约定'})
  for(const row of v.preparations.filter(r=>r.businessId===b.id&&['materials','basics'].includes(r.kind)))add('preparation',row.id,row.job?.startAt??null,row.kind==='materials'?'这份服务材料':'这次技术学习')
  for(const row of v.adapters.filter(r=>r.businessId===b.id))add('adapter',row.id,row.consentedAt,(v.catalog.models.find(m=>m.id===row.modelId)?.label??'原模型')+' / '+(row.purpose==='deployment'?'部署':'培训')+'原用途适配')
  for(const row of v.outreaches.filter(r=>r.businessId===b.id))add('outreach',row.id,row.job?.startAt??null,'这次原需求研究')
  for(const row of v.leads.filter(r=>r.businessId===b.id))add('lead',row.id,row.createdAt,'客户'+(v.leads.findIndex(l=>l.personId===row.personId)+1)+'的原需求')
  for(const row of v.contracts.filter(r=>r.businessId===b.id)){
   add('contract',row.id,row.acceptedAt,(row.productId==='deployment'?'部署':'培训')+'合作 / '+row.modelId)
   for(const d of v.deliveries.filter(d=>d.contractId===row.id))add('delivery',d.id,d.date,(d.stage==='production'?'已验收生产':'已完成支持')+'的原款')
  }
 }
 return result
}

/** Follow only the unique public effect of this original committed command. Time and browsing never select a record. */
export function ecosystemFocusFromSaved(previous:Input,current:Input,kind:string,body:Record<string,unknown>,existing:EcosystemOpeningFocus|null=null):EcosystemOpeningFocus|null{
 const before=previous.features.deepseek,v=current.features.deepseek,view=current.view,last=view.receipts.at(-1)
 if(!before||!v||previous.view.runId!==view.runId||view.revision!==previous.view.revision+1||view.saveStatus!=='saved'||view.hasCandidate||view.readOnly||view.phase!=='playing'||last?.kind!==kind||last.revisionAfter!==view.revision)return null
 const expectedId=deepseekId(last.commandId,kind),business=(id:string)=>v.businesses.find(b=>b.id===id&&b.definitionId==='ecosystem-service')
 const target=(businessId:string,kind:EcosystemSceneTarget['kind'],recordId?:string):EcosystemSceneTarget|null=>{const b=business(businessId);if(!b)return null;const identity={runId:view.runId,accountId:b.accountId,businessId};return kind==='business'?{...identity,kind}:recordId?{...identity,kind,recordId}:null}
 const added=<T extends {id:string}>(old:readonly T[],rows:readonly T[],matches:(row:T)=>boolean):T|null=>{const found=rows.filter(row=>row.id===expectedId&&!old.some(o=>o.id===row.id)&&matches(row));return found.length===1?found[0]!:null}
 const assignment=(job:{startAt:string;resources:readonly string[]}|null)=>{const resources=body.resources;return !!job&&job.startAt===body.startAt&&Array.isArray(resources)&&resources.length===job.resources.length&&job.resources.every((id,index)=>resources[index]===id)}
 let next:EcosystemSceneTarget|null=null
 if(kind==='OpenEcosystemService'){
  const rows=v.businesses.filter(b=>b.definitionId==='ecosystem-service'&&!before.businesses.some(old=>old.id===b.id)),capital=body.capitalFen,oldPersonal=previous.view.accounts.find(a=>a.accountId==='personal'),personal=view.accounts.find(a=>a.accountId==='personal')
  if(rows.length===1&&typeof capital==='number'&&Number.isSafeInteger(capital)&&capital>0&&rows[0]!.funds.cashFen===capital&&oldPersonal&&personal&&oldPersonal.cashFen-personal.cashFen===capital)next=target(rows[0]!.id,'business')
 }
 if(kind==='StartEcosystemPreparation'){const row=added(before.preparations,v.preparations,r=>r.businessId===body.businessId&&r.kind===body.preparation&&assignment(r.job));if(row)next=target(row.businessId,'preparation',row.id)}
 if(kind==='StartEcosystemAdaptation'){const row=added(before.adapters,v.adapters,r=>r.businessId===body.businessId&&r.modelId===body.modelId&&r.purpose===body.productId&&body.acceptSimulationTerms===true&&assignment(r.job));if(row)next=target(row.businessId,'adapter',row.id)}
 if(kind==='StartEcoOutreach'){const cohorts=body.sourceCohortIds;const row=added(before.outreaches,v.outreaches,r=>r.businessId===body.businessId&&r.modelId===body.modelId&&r.productId===body.productId&&r.mode===body.mode&&Array.isArray(cohorts)&&r.sourceCohortIds.length===cohorts.length&&r.sourceCohortIds.every((id,i)=>id===cohorts[i])&&assignment(r.job));if(row)next=target(row.businessId,'outreach',row.id)}
 if(kind==='AcceptEcoContract'){const row=added(before.contracts,v.contracts,r=>r.leadId===body.leadId&&r.scope===body.scope&&assignment(r.productionJob));if(row)next=target(row.businessId,'contract',row.id)}
 if(['SubmitEcoDelivery','StartEcoRemediation','CancelEcoContract'].includes(kind)){
  const row=v.contracts.find(c=>c.id===body.contractId),old=before.contracts.find(c=>c.id===body.contractId)
  const changed=row&&old&&row.businessId===old.businessId&&(kind==='SubmitEcoDelivery'?old.submittedAt===null&&row.submittedAt===view.date&&row.status==='review':kind==='StartEcoRemediation'?old.remediationJobId===null&&row.remediationJobId===expectedId&&assignment(row.remediationJob):old.status!=='cancelled'&&row.status==='cancelled'&&row.cancelledAt===view.date)
  if(changed)next=target(row.businessId,'contract',row.id)
 }
 if(kind==='DeclineEcoLead'){const row=v.leads.find(l=>l.id===body.leadId),old=before.leads.find(l=>l.id===body.leadId);if(row&&old&&old.status==='open'&&row.status==='declined')next=target(row.businessId,'lead',row.id)}
 if(kind==='CollectEcoReceivable'){
  const d=v.deliveries.find(d=>d.id===body.deliveryId),old=before.deliveries.find(d=>d.id===body.deliveryId),c=d?v.contracts.find(c=>c.id===d.contractId):null,b=c?business(c.businessId):null
  const transactions=b?current.features.workbench.finance.find(f=>f.accountId===b.accountId)?.transactions.filter(tx=>tx.id===expectedId&&tx.sourceId===d?.id&&tx.contractId===c?.id&&tx.businessId===b.id&&tx.amountFen===body.amountFen)??[]:[]
  if(d&&old&&c&&b&&Number.isSafeInteger(body.amountFen)&&typeof body.amountFen==='number'&&body.amountFen>0&&old.remainingFen-d.remainingFen===body.amountFen&&transactions.length===1)next=target(b.id,'delivery',d.id)
 }
 if(['ActivateBusiness','StopEcosystemService','ResumeBusiness','WindDownBusiness','CloseBusiness'].includes(kind)){
  const row=typeof body.businessId==='string'?business(body.businessId):null,old=before.businesses.find(b=>b.id===body.businessId)
  if(row&&old&&row.history.length===old.history.length+1&&row.history.at(-1)?.sourceId===(kind==='StopEcosystemService'?expectedId:last.commandId))next=target(row.id,'business')
 }
 if((kind==='InterruptJob'||kind==='RescheduleJob')&&typeof body.jobId==='string'){
  const old=previous.view.operations?.jobs.find(j=>j.id===body.jobId),now=view.operations?.jobs.find(j=>j.id===body.jobId)
  if(old&&now&&JSON.stringify(old)!==JSON.stringify(now)){
   const candidates:EcosystemSceneTarget[]=[]
   for(const r of v.preparations.filter(r=>r.jobId===body.jobId&&['materials','basics'].includes(r.kind))){const t=target(r.businessId,'preparation',r.id);if(t)candidates.push(t)}
   for(const r of v.adapters.filter(r=>r.jobId===body.jobId)){const t=target(r.businessId,'adapter',r.id);if(t)candidates.push(t)}
   for(const r of v.outreaches.filter(r=>r.jobId===body.jobId)){const t=target(r.businessId,'outreach',r.id);if(t)candidates.push(t)}
   for(const c of v.contracts.filter(c=>[c.productionJobId,c.remediationJobId,c.supportJobId].includes(body.jobId as string))){const t=target(c.businessId,'contract',c.id);if(t)candidates.push(t)}
   if(candidates.length===1)next=candidates[0]!
  }
 }
 if(!next)return null
 const focus=ecosystemFocusFor(current,next),checked=resolveEcosystemFocus(current,focus)
 if(checked.reason)return null
 if(existing?.ecosystemTarget&&existing.runId===view.runId&&existing.businessId===next.businessId&&!resolveEcosystemFocus(previous,existing).reason){
  const t=existing.ecosystemTarget,candidateContract=checked.focus.ecosystemTarget?.kind==='contract'?v.contracts.find(c=>c.id===ecosystemTargetEntity(checked.focus.ecosystemTarget!)):checked.focus.ecosystemTarget?.kind==='delivery'?v.contracts.find(c=>v.deliveries.some(d=>d.id===ecosystemTargetEntity(checked.focus.ecosystemTarget!)&&d.contractId===c.id)):null
  if(t.kind==='contract'&&candidateContract?.id===t.recordId||t.kind===next.kind&&ecosystemTargetEntity(t)===ecosystemTargetEntity(next))return existing
 }
 return checked.focus
}
