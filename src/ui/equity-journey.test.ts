import {expect,it} from 'vitest'
import {campaignMarket} from '../application/campaign.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectRun} from '../core/commands.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {prepareEquity,signedEquity,offeredEquityExit,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {equityJourney,type EquityJourneyContext} from './equity-journey.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// These original fixed-outcome/funded fixtures check public UI causality only.
// They do not establish a normal-life or browser route, balance or human fun.
const contexts=new WeakMap<object,Map<string,EquityJourneyContext>>()
function context(h:ReturnType<typeof createDeepseekFixture>,accountId='personal'):EquityJourneyContext{
 let rows=contexts.get(h.run);if(!rows){rows=new Map();contexts.set(h.run,rows)}
 const cached=rows.get(accountId);if(cached)return cached
 const value:EquityJourneyContext={runId:h.run.runId,accountId,date:h.run.timeline.cursor.date,accounts:h.run.controlledAccountIds.map(accountId=>({accountId})),operations:h.run.operations!,finance:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog).finance,source:{revision:h.run.revision,receipts:projectRun(h.run).receipts},sceneCommands:projectSceneCommands(h.run)}
 rows.set(accountId,value);return value
}
function target(h:ReturnType<typeof createDeepseekFixture>,businessId:string,kind:Exclude<EquitySceneTarget['kind'],'business'>,recordId:string):EquitySceneTarget{
 return {runId:h.run.runId,accountId:h.run.operations!.businesses.find(b=>b.id===businessId)!.accountId,businessId,kind,recordId}
}

it('offers only explicit fictional participation before any desk, money or shares exist',()=>{
 const h=createDeepseekFixture(),before=h.codec.export(h.run),scene=equityJourney(projectDeepseek(h.run,h.deepseek),null,context(h))
 expect(scene.phase).toBe('boundary');expect(scene.action).toMatchObject({kind:'command',command:'EnableCounterfactualEquity',payload:{acknowledge:true},confirm:true})
 expect(h.codec.export(h.run)).toBe(before)
 h.send('EnableCounterfactualEquity',{acknowledge:true})
 expect(equityJourney(projectDeepseek(h.run,h.deepseek),null,context(h))).toMatchObject({phase:'entry',action:{kind:'choice',intent:'actors'}})
 expect(h.run.deepseek!.agreements).toHaveLength(0);expect(h.run.operations!.businesses).toHaveLength(0)
 expect(h.preview('OpenEquityDesk',{}).allowed).toBe(false)
})

it('waits on the original relationship job, shows actual cost state and ends preparation without claiming shares',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2025-04-01'});h.send('EnableCounterfactualEquity',{acknowledge:true});h.send('OpenEquityDesk',{})
 const b=h.run.operations!.businesses.at(-1)!;h.send('StartEquityRelationship',{businessId:b.id,...dsAssignment('2025-04-01')})
 const p=h.run.deepseek!.preparations[0]!,t=target(h,b.id,'preparation',p.id),view=()=>equityJourney(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(view().action).toEqual({kind:'wait',date:'2025-04-08',label:'等这份关系准备实际完成'})
 expect(view().facts.join(' ')).toContain('开工季度1点');expect(view().directCosts?.paidFen).toBe(50000)
 h.send('AdvanceTime',{date:'2025-04-08'})
 const before=h.codec.export(h.run),done=view()
 expect(done).toMatchObject({phase:'preparation-completed',outcome:'actual',resultDate:'2025-04-08',active:false,action:{kind:'choice',intent:'business'}})
 expect(done.line).toContain('没有因此多出股份');expect(h.codec.export(h.run)).toBe(before)
})

it('keeps the real4500 preparation cost separate from accepted terms and the later actually acquired asset',()=>{
 const {h,b,negotiation}=prepareEquity(),t=target(h,b.id,'negotiation',negotiation.id),scene=()=>equityJourney(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 const offered=scene();expect(offered).toMatchObject({phase:'terms-accepted',outcome:'actual',action:{kind:'choice',intent:'terms'}})
 expect(offered.directCosts?.paidFen).toBe(450000);expect(offered.facts.join(' ')).toContain('¥4,500');expect(h.run.deepseek!.agreements).toHaveLength(0)
 h.send('SignEquityAgreement',{negotiationId:negotiation.id});const a=h.run.deepseek!.agreements[0]!,holding=equityJourney(projectDeepseek(h.run,h.deepseek),target(h,b.id,'agreement',a.id),context(h,b.accountId))
 expect(holding).toMatchObject({phase:'holding',paper:'holding',active:false,outcome:'actual'});expect(holding.directCosts?.paidFen).toBe(450000);expect(holding.facts.join(' ')).toContain('账面值');expect(holding.facts.join(' ')).toContain('不能花');expect(holding.finishWhen).toContain('不要求清空记录')
 expect(scene()).toMatchObject({phase:'terms-closed',action:{kind:'today'}})
})

it('keeps an actually refused negotiation with spent costs and no sign command or automatic replacement',()=>{
 const {h,b,negotiation}=prepareEquity({parameters:{negotiationAcceptBps:0}}),t=target(h,b.id,'negotiation',negotiation.id),before=h.codec.export(h.run)
 const scene=equityJourney(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(scene).toMatchObject({phase:'terms-rejected',outcome:'non-success',action:{kind:'choice',intent:'terms'}})
 expect(scene.directCosts?.paidFen).toBe(450000);expect(scene.title).not.toContain('条件谈妥');expect(h.run.deepseek!.agreements).toHaveLength(0);expect(h.codec.export(h.run)).toBe(before)
})

it('does not turn an actual no-buyer reply into quote expiry or steal the selected exit for a new follow window',()=>{
 const {h,b,exit}=offeredEquityExit({parameters:{buyerAcceptBps:0}}),t=target(h,b.id,'exit',exit.id)
 h.send('AdvanceTime',{date:'2025-09-01'});const before=h.codec.export(h.run),scene=equityJourney(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(scene).toMatchObject({phase:'no-buyer',outcome:'non-success',paper:'kept',action:{kind:'today'}})
 expect(scene.title).not.toContain('报价已经');expect(scene.resolution.agreement?.followDecision).toBe('pending');expect(scene.resolution.exit?.id).toBe(exit.id);expect(h.codec.export(h.run)).toBe(before)
})

it('preserves actual partial shares, original due date and partial cash before producing a real fully paid receipt',()=>{
 const {h,b,agreement,exit}=offeredEquityExit(),t=target(h,b.id,'exit',exit.id),scene=()=>equityJourney(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(scene()).toMatchObject({phase:'quote',paper:'quote',action:{kind:'choice',intent:'exit-accept'}})
 h.send('AcceptEquityExit',{exitId:exit.id,shares:1000});const due=h.run.deepseek!.exits[0]!.dueAt!
 expect(scene()).toMatchObject({phase:'receivable',paper:'receivable',action:{kind:'wait',date:due}})
 h.send('AdvanceTime',{date:due});const credit=scene().resolution.exit!.receivable!.amountFen,part=Math.floor(credit/2)
 expect(scene()).toMatchObject({phase:'collection',action:{kind:'choice',intent:'collect'}})
 h.send('CollectEquityExit',{exitId:exit.id,amountFen:part})
 expect(scene().resolution.exit?.receivable?.remainingFen).toBe(credit-part);expect(scene().paper).toBe('receivable');expect(scene().resolution.agreement?.shares).toBe(agreement.shares-1000)
 h.send('CollectEquityExit',{exitId:exit.id,amountFen:credit-part})
 const before=h.codec.export(h.run),paid=scene()
 expect(paid).toMatchObject({phase:'collected',paper:'receipt',outcome:'actual',resultDate:due,active:false,action:{kind:'today'}})
 expect(paid.directCosts?.paidFen).toBe(500000);expect(paid.resolution.agreement?.shares).toBe(agreement.shares-1000);expect(h.codec.export(h.run)).toBe(before)
})

it('keeps unknown cash provenance unknown and rejects a falsely zeroed receivable before rendering collected cash',()=>{
 const {h,b,exit}=offeredEquityExit(),t=target(h,b.id,'exit',exit.id);h.send('AcceptEquityExit',{exitId:exit.id,shares:1000})
 const v=projectDeepseek(h.run,h.deepseek)!,c=context(h,b.accountId),missing={...c,finance:[]}
 expect(equityJourney(v,t,missing).directCosts).toMatchObject({paidFen:null,reservedFen:null})
 expect(equityJourney(v,t,missing).facts.join(' ')).toContain('不能把未知金额按零')
 const wrong={...v,exits:v.exits.map(e=>({...e,receivable:e.receivable?{...e.receivable,remainingFen:0}:null}))}
 expect(equityJourney(wrong,t,c)).toMatchObject({phase:'unknown',paper:'stopped',resolution:{status:'invalid'}})
})

it('keeps a completed governance result separate from an unfinished vote and from the retained holding',()=>{
 const {h,b,agreement}=signedEquity({},'board');h.send('AdvanceTime',{date:'2025-07-01'});h.send('ProposeEquityGovernance',{agreementId:agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')})
 const g=h.run.deepseek!.governance[0]!,t=target(h,b.id,'governance',g.id),scene=()=>equityJourney(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(scene().outcome).toBe('pending');expect(scene().title).not.toContain('已经按原范围通过')
 h.send('AdvanceTime',{date:'2025-07-08'})
 expect(scene()).toMatchObject({phase:'governance-result',outcome:'actual',paper:'governance',resultDate:'2025-07-08',action:{kind:'today'}})
 expect(projectDeepseek(h.run,h.deepseek)!.auditedProjectReport).not.toBeNull()
})

it('retains the real investigation after its invitation expires rather than claiming that the job was cancelled',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2025-07-01'});h.send('EnableCounterfactualEquity',{acknowledge:true});h.send('OpenEquityDesk',{})
 const b=h.run.operations!.businesses.at(-1)!;h.send('DiscoverEquityInvitation',{businessId:b.id,source:'broker'})
 const i=h.run.deepseek!.invitations[0]!
 h.send('InvestigateEquityInvitation',{invitationId:i.id,...dsAssignment('2025-09-30')});h.send('AdvanceTime',{date:'2025-09-30'})
 const before=h.codec.export(h.run),scene=equityJourney(projectDeepseek(h.run,h.deepseek),target(h,b.id,'invitation',i.id),context(h,b.accountId))
 expect(scene).toMatchObject({phase:'invitation-closed-with-task',active:true,outcome:'pending',action:{kind:'wait',date:'2025-10-07'}})
 expect(scene.resolution.invitation?.status).toBe('expired');expect(scene.resolution.job?.status).toBe('running');expect(scene.line).toContain('不等于调查任务自动取消');expect(h.codec.export(h.run)).toBe(before)
})

it('does not offer real signature after the invitation expired during an otherwise accepted late negotiation',()=>{
 const {h,b,invitation}=prepareEquity();h.send('AdvanceTime',{date:'2025-07-01'})
 h.send('StartEquityNegotiation',{invitationId:invitation.id,acquisitionKind:'secondary',termsId:'liquidity',amountFen:800000,...dsAssignment('2025-07-01')})
 const n=h.run.deepseek!.negotiations.at(-1)!;h.send('AdvanceTime',{date:'2025-07-08'})
 const scene=equityJourney(projectDeepseek(h.run,h.deepseek),target(h,b.id,'negotiation',n.id),context(h,b.accountId))
 expect(scene).toMatchObject({phase:'terms-invitation-closed',outcome:'non-success',decisionOpen:false,action:{kind:'today'}})
 expect(scene.resolution.negotiation?.accepted).toBe(true);expect(scene.resolution.invitation?.status).toBe('expired')
 expect(h.preview('SignEquityAgreement',{negotiationId:n.id}).allowed).toBe(false)
 expect(h.preview('DeclineEquityTerms',{negotiationId:n.id}).allowed).toBe(true)
})

it('shows the actual broker cash separately and obtains free rejection dates only from same-source public command records',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2025-04-01'});h.send('EnableCounterfactualEquity',{acknowledge:true});h.send('OpenEquityDesk',{})
 const b=h.run.operations!.businesses.at(-1)!;h.send('DiscoverEquityInvitation',{businessId:b.id,source:'broker'})
 const i=h.run.deepseek!.invitations[0]!,t=target(h,b.id,'invitation',i.id)
 h.send('PayUnverifiedBrokerFee',{invitationId:i.id})
 const paid=equityJourney(projectDeepseek(h.run,h.deepseek),t,context(h,b.accountId))
 expect(paid.facts.join(' ')).toContain('中间服务费已付¥1,000');expect(paid.directCosts?.paidFen).toBe(0)
 h.send('RejectEquityInvitation',{invitationId:i.id});const c=context(h,b.accountId),v=projectDeepseek(h.run,h.deepseek)
 expect(equityJourney(v,t,c)).toMatchObject({phase:'invitation-closed',resultDate:'2025-04-01',action:{kind:'today'}})
 expect(equityJourney(v,t,{...c,source:{...c.source!,revision:c.source!.revision-1}}).resultDate).toBeNull()
})
