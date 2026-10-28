import {expect,it} from 'vitest'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {prepareEquity,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {equityFocusFor,equityFocusFromSaved,equityCommandFocus,equityFocusTargets,resolveEquityFocus,equityJourneyFor,type EquityThreadInput,type EquityOpeningFocus} from './equity-player-thread.ts'

// Public projections from original fixed-outcome fixtures; save flags below
// describe model snapshots only, not IndexedDB/Native persistence acceptance.
const snapshots=new WeakMap<object,EquityThreadInput>()
function input(h:ReturnType<typeof createDeepseekFixture>):EquityThreadInput{
 const cached=snapshots.get(h.run);if(cached)return cached
 const value:EquityThreadInput={view:{...projectRun(h.run),saveStatus:'saved',hasCandidate:false,readOnly:false},features:{deepseek:projectDeepseek(h.run,h.deepseek),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog),sceneCommands:projectSceneCommands(h.run)}}
 snapshots.set(h.run,value);return value
}

it('follows the exact original enabled desk, relationship, invitation, report, eligibility, terms and signed holding',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2025-04-01'})
 let focus:EquityOpeningFocus|null=null
 const save=(kind:string,body:Record<string,unknown>)=>{const before=input(h);h.send(kind,body);const after=input(h),next=equityFocusFromSaved(before,after,kind,body,focus);if(next)focus=next;return {before,after,next}}
 expect(save('EnableCounterfactualEquity',{acknowledge:true}).next).toMatchObject({kind:'equity',entityId:null,equityTarget:null})
 const desk=save('OpenEquityDesk',{}).next!,b=h.run.operations!.businesses.at(-1)!
 expect(desk).toMatchObject({businessId:b.id,accountId:b.accountId,equityTarget:{kind:'business',businessId:b.id}})
 expect(save('StartEquityRelationship',{businessId:b.id,...dsAssignment('2025-04-01')}).next?.equityTarget?.kind).toBe('preparation')
 expect(save('AdvanceTime',{date:'2025-04-08'}).next).toBeNull()
 const invited=save('DiscoverEquityInvitation',{businessId:b.id,source:'referral'}).next!,invitation=h.run.deepseek!.invitations[0]!
 expect(invited.entityId).toBe(invitation.id)
 expect(save('InvestigateEquityInvitation',{invitationId:invitation.id,...dsAssignment('2025-04-08')}).next?.entityId).toBe(invitation.id)
 save('AdvanceTime',{date:'2025-04-15'})
 expect(save('StartEquityEligibility',{businessId:b.id,...dsAssignment('2025-04-15')}).next?.equityTarget?.kind).toBe('preparation')
 save('AdvanceTime',{date:'2025-04-22'})
 const proposal={invitationId:invitation.id,acquisitionKind:'new_capital',termsId:'financial',amountFen:2000000,...dsAssignment('2025-04-22')}
 const terms=save('StartEquityNegotiation',proposal).next!,n=h.run.deepseek!.negotiations[0]!
 expect(terms.entityId).toBe(n.id);save('AdvanceTime',{date:'2025-04-29'})
 expect(save('SignEquityAgreement',{negotiationId:n.id}).next).toMatchObject({entityId:h.run.deepseek!.agreements[0]!.id,equityTarget:{kind:'agreement'}})
 const saved=focus!,beforeRead=h.codec.export(h.run)
 expect(equityJourneyFor(input(h),saved).phase).toBe('holding')
 const publicCommands=projectSceneCommands(h.run)
 const open=publicCommands.commands.find(c=>c.kind==='OpenEquityDesk')!,signed=publicCommands.commands.find(c=>c.kind==='SignEquityAgreement')!
 expect(equityCommandFocus(input(h),open)?.[0]).toMatchObject({businessId:b.id,equityTarget:{kind:'business'}})
 expect(equityCommandFocus(input(h),signed)?.[0]).toEqual(saved)
 expect(JSON.stringify(publicCommands)).not.toMatch(/amountFen|resources|startAt|acquisitionKind|termsId|authorityFactId|financingConsent/)
 expect(h.codec.export(h.run)).toBe(beforeRead)
})

it('does not follow uncommitted, read-only, wrong-body or stale-life source snapshots',()=>{
 const {h,b,invitation}=prepareEquity();h.send('AdvanceTime',{date:'2025-07-01'})
 const before=input(h),prior=equityFocusFor(before,{runId:h.run.runId,accountId:b.accountId,businessId:b.id,kind:'invitation',recordId:invitation.id})
 const body={invitationId:invitation.id,acquisitionKind:'secondary',termsId:'liquidity',amountFen:800000,...dsAssignment('2025-07-01')}
 h.send('StartEquityNegotiation',body);const after=input(h)
 expect(equityFocusFromSaved(before,after,'StartEquityNegotiation',body,prior)?.equityTarget?.kind).toBe('negotiation')
 expect(equityFocusFromSaved(before,{...after,view:{...after.view,hasCandidate:true}},'StartEquityNegotiation',body,prior)).toBeNull()
 expect(equityFocusFromSaved(before,{...after,view:{...after.view,saveStatus:'unsaved'}},'StartEquityNegotiation',body,prior)).toBeNull()
 expect(equityFocusFromSaved(before,{...after,view:{...after.view,readOnly:true}},'StartEquityNegotiation',body,prior)).toBeNull()
 expect(equityFocusFromSaved(before,after,'StartEquityNegotiation',{...body,amountFen:1600000},prior)).toBeNull()
 expect(equityFocusFromSaved({...before,view:{...before.view,runId:'foreign-life'}},after,'StartEquityNegotiation',body,prior)).toBeNull()
})

it('keeps explicit invalid identities invalid and lists original objects without selecting the latest record',()=>{
 const {h,b,invitation}=prepareEquity(),p=input(h),t={runId:h.run.runId,accountId:b.accountId,businessId:b.id,kind:'invitation' as const,recordId:invitation.id},before=h.codec.export(h.run)
 const focus=equityFocusFor(p,t),foreign={...focus,runId:'foreign-life'},missing={...focus,equityTarget:{...t,recordId:'not-the-original-invitation'},entityId:'not-the-original-invitation'}
 expect(resolveEquityFocus(p,focus).reason).toBeNull();expect(resolveEquityFocus(p,foreign).reason).not.toBeNull();expect(resolveEquityFocus(p,missing).reason).not.toBeNull()
 const objects=equityFocusTargets(p)
 expect(objects.some(o=>o.target.kind==='invitation'&&o.target.recordId===invitation.id)).toBe(true)
 expect(objects.some(o=>o.target.kind==='negotiation')).toBe(true)
 expect(equityFocusFor(p).equityTarget).toBeNull();expect(h.codec.export(h.run)).toBe(before)
})
