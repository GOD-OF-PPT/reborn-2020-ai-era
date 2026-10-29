import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {dsAssignment} from '../testing/deepseek-scenarios.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {projectRun,previewCommand} from '../core/commands.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {equityJourney} from './equity-journey.ts'
import {EquityPaper} from './EquityPaper.tsx'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import {equityInvitationState} from './equity-invitation-ui.ts'

// Original fixed-outcome fixtures prove state/UI causality, not normal wealth,
// browser execution, undisclosed outcomes, or human comprehension.
function invitation(){
 const h=createDeepseekFixture({parameters:{invitationAuthorityBps:0}})
 h.send('AdvanceTime',{date:'2025-04-01'});h.send('EnableCounterfactualEquity',{acknowledge:true});h.send('OpenEquityDesk',{})
 const b=h.run.operations!.businesses.at(-1)!;h.send('DiscoverEquityInvitation',{businessId:b.id,source:'broker'})
 return{h,b,id:h.run.deepseek!.invitations.at(-1)!.id}
}
function scene(s:ReturnType<typeof invitation>){const {h,b,id}=s,run=h.run;return equityJourney(projectDeepseek(run,h.deepseek),{runId:run.runId,accountId:b.accountId,businessId:b.id,kind:'invitation',recordId:id},{runId:run.runId,accountId:b.accountId,date:run.timeline.cursor.date,accounts:run.controlledAccountIds.map(accountId=>({accountId})),operations:run.operations!,finance:projectWorkbench(run,h.runtime,h.operations.catalog,campaignMarket.catalog).finance,source:{revision:run.revision,receipts:projectRun(run).receipts},sceneCommands:projectSceneCommands(run)})}
it('ends an actual failed investigation and directly lets the same invitation be refused or retained without another wait',()=>{
 const s=invitation();s.h.send('PayUnverifiedBrokerFee',{invitationId:s.id});s.h.send('InvestigateEquityInvitation',{invitationId:s.id,...dsAssignment('2025-04-01')});s.h.send('AdvanceTime',{date:'2025-04-08'})
 const before=s.h.codec.export(s.h.run),j=scene(s);expect(j.phase).toBe('diligence-rejected');expect(j.purpose).toContain('调查已经结束');expect(j.finishWhen).toContain('不再等');expect(j.action).toMatchObject({kind:'command',command:'RejectEquityInvitation',payload:{invitationId:s.id},confirm:true});expect(s.h.preview('RejectEquityInvitation',{invitationId:s.id}).allowed).toBe(true);expect(j.facts.join(' ')).toContain('¥1,000');expect(j.directCosts?.paidFen).toBe(200000);expect(s.h.codec.export(s.h.run)).toBe(before)
})
it('makes an explicitly rejected invitation about its ended request and retained costs rather than future verification',()=>{
 const s=invitation();s.h.send('PayUnverifiedBrokerFee',{invitationId:s.id});s.h.send('RejectEquityInvitation',{invitationId:s.id});const j=scene(s)
 expect(j.purpose).toContain('已经拒绝');expect(j.finishWhen).toContain('不再等');expect(j.resultDate).toBe('2025-04-01');expect(j.action.kind).toBe('today');expect(j.facts.join(' ')).toContain('¥1,000')
})
it('distinguishes actual failed-authority paper from verified approval and preserves the meaning in text-only or protected views',()=>{
 const s=invitation();s.h.send('InvestigateEquityInvitation',{invitationId:s.id,...dsAssignment('2025-04-01')});s.h.send('AdvanceTime',{date:'2025-04-08'});const j=scene(s),view={readOnly:true,hasCandidate:false,saveStatus:'read_only' as const,busy:false},binding={label:j.action.label,disabled:false,reason:null,activate:()=>{throw Error('READ_ONLY_ART')}}
 const html=renderToStaticMarkup(<EquityPaper p={{view}} journey={j} binding={binding}/>);expect(html).toContain('data-equity-invitation="unverified-authority"');expect(html).toContain('授权未核实');expect(html).toContain('invitation-unverified-authority');expect(html).toContain('只读 · 原记录保留')
 const text=renderToStaticMarkup(<EquityPaper p={{view,textOnly:true}} journey={j} binding={binding}/>);expect(text).toContain('授权未核实');expect(text).not.toContain('<svg')
 const unknown=renderToStaticMarkup(<EquityPaper p={{view}} journey={j} binding={binding} unavailable/>);expect(unknown).not.toContain('授权未核实')
})
it('captures the same invitation and1000 service fee without treating it as principal, approval or a new investigation',()=>{
 const s=invitation(),{h}=s,view=projectRun(h.run),command={runId:h.run.runId,actorId:h.run.actorId,commandId:'capture-broker-original',expectedRevision:h.run.revision,kind:'PayUnverifiedBrokerFee',payload:{invitationId:s.id}},preview=previewCommand(h.run,command,h.registry,h.run.actorId),before=h.codec.export(h.run)
 expect(preview.allowed).toBe(true);const html=renderToStaticMarkup(<EquityDecisionFacts command={command} preview={preview} view={view} features={{deepseek:projectDeepseek(h.run,h.deepseek)}} accountName={()=> '个人账户'}/>);expect(html).toContain('¥1,000');expect(html).toContain('中间服务费');expect(html).toContain('不产生股份');expect(html).toContain('2025-04-01');expect(h.codec.export(h.run)).toBe(before)
})
it('keeps a rejected invitation and its still-planned investigation as simultaneous actual facts',()=>{
 const s=invitation();s.h.send('InvestigateEquityInvitation',{invitationId:s.id,...dsAssignment('2025-04-10')});s.h.send('RejectEquityInvitation',{invitationId:s.id});const j=scene(s)
 expect(j.phase).toBe('invitation-closed-with-task');expect(j.resolution.job?.status).toBe('planned');expect(j.action).toMatchObject({kind:'wait',date:'2025-04-10'});expect(j.line).toContain('不等于调查任务自动取消')
})

it('keeps stopped and expired invitations distinct and allows the original interrupted investigation to be explicitly prepared again',()=>{
 const stopped=invitation();stopped.h.send('InvestigateEquityInvitation',{invitationId:stopped.id,...dsAssignment('2025-04-10')});const job=stopped.h.run.deepseek!.invitations[0]!.diligenceJobId!;stopped.h.send('InterruptJob',{jobId:job});const j=scene(stopped);expect(equityInvitationState(j.resolution)).toBe('stopped');expect(j.purpose).toContain('已经停下');expect(j.finishWhen).toContain('不再等');expect(stopped.h.preview('InvestigateEquityInvitation',{invitationId:stopped.id,...dsAssignment('2025-04-11')}).allowed).toBe(true)
 const expired=invitation();expired.h.send('AdvanceTime',{date:'2025-07-01'});const end=scene(expired);expect(equityInvitationState(end.resolution)).toBe('expired');expect(end.purpose).toContain('已经到期');expect(end.action.kind).toBe('today')
})
it('keeps unstarted, running and closed-but-running investigation states separate without inventing a report',()=>{
 const s=invitation();expect(equityInvitationState(scene(s).resolution)).toBe('unread');s.h.send('InvestigateEquityInvitation',{invitationId:s.id,...dsAssignment('2025-04-10')});expect(equityInvitationState(scene(s).resolution)).toBe('planned');s.h.send('AdvanceTime',{date:'2025-04-10'});expect(equityInvitationState(scene(s).resolution)).toBe('running');s.h.send('RejectEquityInvitation',{invitationId:s.id});const both=scene(s);expect(equityInvitationState(both.resolution)).toBe('closed-running');expect(both.resolution.invitation!.reportAt).toBeNull();expect(both.action.kind).toBe('wait')
})

it('repeats the explicitly selected introduction source in its original zero-cost confirmation instead of a generic acknowledgement',()=>{
 const s=invitation(),{h,b}=s,view=projectRun(h.run),command={runId:h.run.runId,actorId:h.run.actorId,commandId:'capture-specific-introduction',expectedRevision:h.run.revision,kind:'DiscoverEquityInvitation',payload:{businessId:b.id,source:'referral'}},before=h.codec.export(h.run)
 h.send('StartEquityRelationship',{businessId:b.id,...dsAssignment('2025-04-01')});h.send('AdvanceTime',{date:'2025-04-08'})
 const current={...command,expectedRevision:h.run.revision},context=projectRun(h.run),features={deepseek:projectDeepseek(h.run,h.deepseek)},preview=previewCommand(h.run,current,h.registry,h.run.actorId),captureBefore=h.codec.export(h.run);expect(preview.allowed).toBe(true)
 const html=renderToStaticMarkup(<EquityDecisionFacts command={current} preview={preview} view={context} features={features} accountName={()=> '个人账户'}/>);expect(html).toContain('已有实际合作或关系的介绍');expect(html).toContain('本次费用¥0');expect(html).toContain('没有安排调查')
 const stale=renderToStaticMarkup(<EquityDecisionFacts command={command} preview={preview} view={context} features={features} accountName={()=> '个人账户'}/>);expect(stale).toContain('先核对这一封原邀请');expect(stale).not.toContain('听一次已有')
 const unknown=renderToStaticMarkup(<EquityDecisionFacts command={{...current,payload:{...current.payload,source:'unknown'}}} preview={preview} view={context} features={features} accountName={()=> '个人账户'}/>);expect(unknown).toContain('本次介绍的来源')
 expect(view.revision).toBeLessThan(context.revision);expect(before).not.toBe(captureBefore);expect(h.codec.export(h.run)).toBe(captureBefore)
})

it('retains already verified authority when only financing consent failed, without claiming that the known side was lost',()=>{
 const h=createDeepseekFixture({parameters:{invitationAuthorityBps:10000,financingConsentBps:0}});h.send('AdvanceTime',{date:'2025-04-01'});h.send('EnableCounterfactualEquity',{acknowledge:true});h.send('OpenEquityDesk',{});const b=h.run.operations!.businesses.at(-1)!;h.send('StartEquityRelationship',{businessId:b.id,...dsAssignment('2025-04-01')});h.send('AdvanceTime',{date:'2025-04-08'});h.send('DiscoverEquityInvitation',{businessId:b.id,source:'referral'});const id=h.run.deepseek!.invitations.at(-1)!.id;h.send('InvestigateEquityInvitation',{invitationId:id,...dsAssignment('2025-04-08')});h.send('AdvanceTime',{date:'2025-04-15'});const j=scene({h,b,id});expect(j.resolution.invitation).toMatchObject({authority:true,financingConsent:false});expect(equityInvitationState(j.resolution)).toBe('unwilling');expect(j.purpose).toContain('授权已核实');expect(j.purpose).toContain('没有可确认的融资意愿');expect(j.purpose).not.toContain('没有据此取得授权')
})
