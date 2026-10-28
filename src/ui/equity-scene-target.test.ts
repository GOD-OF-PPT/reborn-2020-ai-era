import {expect,it} from 'vitest'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {prepareEquity,signedEquity,offeredEquityExit,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {isEquitySceneTarget,resolveEquitySceneTarget,type EquitySceneContext,type EquitySceneTarget} from './equity-scene-target.ts'

// Original fixed-outcome rule fixtures verify the public identity boundary only.
// They are not normal campaign, Native, human or economic-balance evidence.
function context(h:ReturnType<typeof prepareEquity>['h'],accountId:string):EquitySceneContext{
 return {runId:h.run.runId,accountId,date:h.run.timeline.cursor.date,accounts:h.run.controlledAccountIds.map(accountId=>({accountId})),operations:h.run.operations!}
}
function target(h:ReturnType<typeof prepareEquity>['h'],businessId:string,kind:Exclude<EquitySceneTarget['kind'],'business'>,recordId:string):EquitySceneTarget{
 return {runId:h.run.runId,accountId:h.run.operations!.businesses.find(b=>b.id===businessId)!.accountId,businessId,kind,recordId}
}

it('keeps the original invitation, complete negotiation and both preparations readable without changing the fixture',()=>{
 const {h,b,invitation,negotiation}=prepareEquity(),v=projectDeepseek(h.run,h.deepseek)!,before=h.codec.export(h.run),c=context(h,b.accountId)
 const i=resolveEquitySceneTarget(v,target(h,b.id,'invitation',invitation.id),c)
 expect(i.status).toBe('valid');expect(i.invitation?.id).toBe(invitation.id);expect(i.job?.id).toBe(i.invitation!.diligenceJobId)
 const n=resolveEquitySceneTarget(v,target(h,b.id,'negotiation',negotiation.id),c)
 expect(n.status).toBe('valid');expect(n.negotiation?.id).toBe(negotiation.id);expect(n.invitation?.id).toBe(invitation.id)
 for(const p of v.preparations){const r=resolveEquitySceneTarget(v,target(h,b.id,'preparation',p.id),c);expect(r.status).toBe('valid');expect(r.preparation?.id).toBe(p.id);expect(r.job?.id).toBe(p.jobId)}
 expect(resolveEquitySceneTarget(v,null,c)).toMatchObject({status:'entry',business:null,agreement:null})
 expect(h.codec.export(h.run)).toBe(before)
})

it('never substitutes a different life, account, missing record, ambiguous subject or stale original task',()=>{
 const {h,b,invitation}=prepareEquity(),v=projectDeepseek(h.run,h.deepseek)!,t=target(h,b.id,'invitation',invitation.id),c=context(h,b.accountId),before=h.codec.export(h.run)
 for(const bad of [{...t,runId:'another-life'},{...t,accountId:'another-account'},{...t,recordId:'no-such-original-invitation'},{...t,businessId:'another-business'}])expect(resolveEquitySceneTarget(v,bad,c)).toMatchObject({status:'invalid',business:null,invitation:null,agreement:null})
 expect(resolveEquitySceneTarget(v,t,{...c,accountId:'another-account'}).status).toBe('invalid')
 expect(resolveEquitySceneTarget({...v,businesses:[...v.businesses,v.businesses.find(x=>x.id===b.id)!]},t,c).status).toBe('invalid')
 expect(resolveEquitySceneTarget(v,t,{...c,accounts:[...c.accounts,{accountId:b.accountId}]}).status).toBe('invalid')
 const changed={...v,invitations:v.invitations.map(i=>i.id===invitation.id?{...i,diligenceJob:i.diligenceJob?{...i.diligenceJob,resources:['not-the-original-resource']}:null}:i)}
 expect(resolveEquitySceneTarget(changed,t,c).status).toBe('invalid')
 expect(resolveEquitySceneTarget(v,null,{...c,accountId:'unselected-company'}).status).toBe('invalid')
 expect(h.codec.export(h.run)).toBe(before)
})

it('rejects incomplete or accessor-backed targets without reading a getter or granting another kind',()=>{
 let read=false
 const valid={kind:'business',runId:'life',accountId:'personal',businessId:'desk'}
 expect(isEquitySceneTarget(valid)).toBe(true)
 for(const value of [{...valid,kind:'agreement'},{...valid,kind:'adapter',recordId:'eco-adapter'},{...valid,extra:'ignored-owner'},Object.create(valid),null,[]])expect(isEquitySceneTarget(value)).toBe(false)
 const getter={...valid,get recordId(){read=true;return 'unexpected'}}
 expect(isEquitySceneTarget(getter)).toBe(false);expect(read).toBe(false)
})

it('retains a rejected original invitation and refuses mismatched agreement assets or duplicate parent negotiations',()=>{
 const prepared=prepareEquity(),{h,b,invitation}=prepared
 h.send('RejectEquityInvitation',{invitationId:invitation.id})
 expect(resolveEquitySceneTarget(projectDeepseek(h.run,h.deepseek),target(h,b.id,'invitation',invitation.id),context(h,b.accountId))).toMatchObject({status:'valid',invitation:{status:'declined'}})
 const signed=signedEquity(),v=projectDeepseek(signed.h.run,signed.h.deepseek)!,t=target(signed.h,signed.b.id,'agreement',signed.agreement.id),c=context(signed.h,signed.b.accountId)
 expect(resolveEquitySceneTarget(v,t,c)).toMatchObject({status:'valid',agreement:{id:signed.agreement.id}})
 const wrong={...v,agreements:v.agreements.map(a=>({...a,asset:a.asset?{...a.asset,accountId:'not-the-original-owner'}:null}))}
 expect(resolveEquitySceneTarget(wrong,t,c)).toMatchObject({status:'invalid',agreement:null})
 expect(resolveEquitySceneTarget({...v,negotiations:[...v.negotiations,v.negotiations[0]!]},t,c).status).toBe('invalid')
})

it('follows the original partial transfer and due partial collection while preserving the remaining shares and record identity',()=>{
 const {h,b,agreement,exit}=offeredEquityExit(),t=target(h,b.id,'exit',exit.id),project=()=>projectDeepseek(h.run,h.deepseek),resolve=()=>resolveEquitySceneTarget(project(),t,context(h,b.accountId))
 expect(resolve()).toMatchObject({status:'valid',exit:{id:exit.id,buyerWilling:true},agreement:{id:agreement.id}})
 h.send('AcceptEquityExit',{exitId:exit.id,shares:1000})
 const sold=resolve();expect(sold.status).toBe('valid');expect(sold.exit?.soldShares).toBe(1000);expect(sold.agreement?.shares).toBe(agreement.shares-1000)
 const originalDue=sold.exit!.dueAt!,credit=sold.exit!.receivable!.remainingFen
 h.send('AdvanceTime',{date:originalDue});const amount=Math.floor(credit/2)
 h.send('CollectEquityExit',{exitId:exit.id,amountFen:amount})
 expect(resolve().exit?.receivable?.remainingFen).toBe(credit-amount)
 const before=h.codec.export(h.run);expect(resolve().target).toEqual(t);expect(h.codec.export(h.run)).toBe(before)
 h.send('CollectEquityExit',{exitId:exit.id,amountFen:credit-amount})
 expect(resolve()).toMatchObject({status:'valid',exit:{receivable:{remainingFen:0}},agreement:{shares:agreement.shares-1000}})
})

it('keeps an actually completed governance response with its original agreement rather than a different proposal',()=>{
 const {h,b,agreement}=signedEquity({},'board')
 h.send('AdvanceTime',{date:'2025-07-01'});h.send('ProposeEquityGovernance',{agreementId:agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')})
 const g=h.run.deepseek!.governance[0]!,t=target(h,b.id,'governance',g.id)
 const pending=resolveEquitySceneTarget(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(pending).toMatchObject({status:'valid',governance:{approved:null}})
 h.send('AdvanceTime',{date:'2025-07-08'})
 const result=resolveEquitySceneTarget(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(result).toMatchObject({status:'valid',agreement:{id:agreement.id},governance:{id:g.id,approved:true}})
})
