import {afterAll,beforeAll,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import actual146 from '../../goal-1/evidence/t17-acceptance-40/equity-season-repair-r177/original146-native-collection-input.json?raw'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {createCampaignCodec,campaignMarket} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {prepareEquity,signedEquity,offeredEquityExit,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {equitySeasonEchoes,equitySeasonContinuations} from './equity-season-echoes.ts'
import {moneyText} from './game-text.ts'
import type {SeasonInput} from './season-thread.ts'
import type {PlayFeatures} from './game-types.ts'

// Fixed-outcome fixtures below prove public state fidelity, not normal balance,
// Chrome or human play. Actual146 is a separate immutable original Native input.
function p(h:ReturnType<typeof createDeepseekFixture>):SeasonInput{
 return {view:{...projectRun(h.run),saveStatus:'saved',hasCandidate:false,readOnly:false},features:{deepseek:projectDeepseek(h.run,h.deepseek),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog),sceneCommands:projectSceneCommands(h.run)}} as unknown as SeasonInput
}
let reader:GameController,store:IndexedDbRunStore
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-original-equity-collection'});reader=new GameController({codec,store,locks:new MemoryWriterAccess()});await reader.initialize();await reader.importNew(actual146)})
afterAll(async()=>{await reader?.close();await store?.close()})

it.each(['declined','defaulted'] as const)('distinguishes a real %s zero round from payment, refunds and an invented active choice',decision=>{
 const {h}=signedEquity({},'financial',2000000);h.send('AdvanceTime',{date:'2025-09-01'})
 const a=h.run.deepseek!.agreements[0]!
 const pending=equitySeasonContinuations(p(h)).find(row=>row.focus?.kind==='equity'&&row.focus.equityTarget?.kind==='agreement')!
 expect(pending.continuation).toBe('choice');expect(pending.urgent).toBe(false)
 if(decision==='declined')h.send('FollowEquityRound',{agreementId:a.id,amountFen:0});else h.send('AdvanceTime',{date:'2025-09-16'})
 const before=h.codec.export(h.run),nodes=equitySeasonEchoes(p(h)),node=nodes.find(n=>n.id.startsWith('equity-follow:'))!
 expect(h.run.deepseek!.agreements[0]!.followDecision).toBe(decision);expect(node).toBeDefined();expect(node.line).toContain('新增付款0元、新增股份0股');expect(node.line).toContain('1562500');expect(node.line).toContain('不是退款或现金收入')
 expect(node.sourceRefs.some(r=>r.kind==='command')).toBe(decision==='declined');expect(node.title).toContain(decision==='declined'?'明确保留现金':'期限已到');expect(h.codec.export(h.run)).toBe(before)
})

it('records a failed terms response and the separate deliberate refusal without claiming shares or a second principal payment',()=>{
 const {h,negotiation}=prepareEquity({parameters:{negotiationAcceptBps:0}},'financial',2000000)
 const response=equitySeasonEchoes(p(h)).find(n=>n.id==='equity-terms-response:'+negotiation.id)!
 expect(response.title).toContain('没有接受');expect(response.line).toContain(moneyText(50000));expect(response.line).toContain(moneyText(2000000));expect(response.line).toContain('答复本身不签署')
 h.send('DeclineEquityTerms',{negotiationId:negotiation.id});const before=h.codec.export(h.run),nodes=equitySeasonEchoes(p(h))
 expect(nodes.some(n=>n.id.startsWith('equity-terms-declined:'))).toBe(true);expect(nodes.some(n=>n.id.startsWith('equity-signed:'))).toBe(false);expect(h.codec.export(h.run)).toBe(before)
})

it('keeps a paid unverified broker fee distinct from a report, funding and ownership',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2025-04-01'});h.send('EnableCounterfactualEquity',{acknowledge:true});h.send('OpenEquityDesk',{});const b=h.run.operations!.businesses.at(-1)!
 h.send('DiscoverEquityInvitation',{businessId:b.id,source:'broker'});const i=h.run.deepseek!.invitations[0]!;h.send('PayUnverifiedBrokerFee',{invitationId:i.id})
 const before=h.codec.export(h.run),nodes=equitySeasonEchoes(p(h)),fee=nodes.find(n=>n.id.startsWith('equity-broker:'))!
 expect(fee).toBeDefined();expect(fee.line).toContain(moneyText(100000));expect(fee.line).toContain('不生成股份');expect(nodes.some(n=>n.id.startsWith('equity-report:')||n.id.startsWith('equity-signed:'))).toBe(false)
 expect(h.codec.export(h.run)).toBe(before)
 h.send('RejectEquityInvitation',{invitationId:i.id});expect(equitySeasonEchoes(p(h)).some(n=>n.id.startsWith('equity-invitation-declined:'))).toBe(true);expect(before).not.toBe(h.codec.export(h.run))
})

it('keeps an interrupted real preparation and its paid cost as a stopped outcome',()=>{
 const h=createDeepseekFixture();h.send('AdvanceTime',{date:'2025-04-01'});h.send('EnableCounterfactualEquity',{acknowledge:true});h.send('OpenEquityDesk',{});const b=h.run.operations!.businesses.at(-1)!
 h.send('StartEquityRelationship',{businessId:b.id,...dsAssignment('2025-04-01')});const prep=h.run.deepseek!.preparations[0]!;h.send('InterruptJob',{jobId:prep.jobId})
 const before=h.codec.export(h.run),nodes=equitySeasonEchoes(p(h)),stop=nodes.find(n=>n.id==='equity-job-stop:'+prep.jobId)!
 expect(stop.title).toContain('已经停下');expect(stop.line).toContain(moneyText(50000));expect(stop.line).toContain('没有记作实际完成');expect(nodes.some(n=>n.id==='equity-preparation:'+prep.id)).toBe(false);expect(h.codec.export(h.run)).toBe(before)
})

it.each([true,false])('publishes only the actual finite governance reply, approved=%s, after the real meeting finishes',approved=>{
 const {h,agreement}=signedEquity({parameters:{governanceAcceptBps:approved?10000:0}},'board');h.send('AdvanceTime',{date:'2025-07-01'});h.send('ProposeEquityGovernance',{agreementId:agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')})
 expect(equitySeasonEchoes(p(h)).some(n=>n.id.startsWith('equity-governance:'))).toBe(false)
 const task=equitySeasonContinuations(p(h)).find(row=>row.continuation==='task')!
 expect(task.focus).toMatchObject({kind:'equity',equityTarget:{kind:'governance',recordId:h.run.deepseek!.governance[0]!.id}});expect(task.dueAt).toBe('2025-07-08')
 h.send('AdvanceTime',{date:'2025-07-08'});const before=h.codec.export(h.run),node=equitySeasonEchoes(p(h)).find(n=>n.id.startsWith('equity-governance:'))!
 expect(node.title).toContain(approved?'实际通过':'没有通过');expect(node.line).toContain(moneyText(50000));expect(node.line).toContain('不等于单方控制');expect(h.codec.export(h.run)).toBe(before)
})

it('retains a real no-buyer response and its inquiry cost without inventing a sale',()=>{
 const {h}=offeredEquityExit({parameters:{buyerAcceptBps:0}}),before=h.codec.export(h.run),nodes=equitySeasonEchoes(p(h)),node=nodes.find(n=>n.id.startsWith('equity-buyer:'))!
 expect(node.title).toContain('没有找到愿意');expect(node.line).toContain(moneyText(50000));expect(nodes.some(n=>n.id.startsWith('equity-sale:')||n.id.startsWith('equity-collected:'))).toBe(false);expect(h.codec.export(h.run)).toBe(before)
})

it('keeps the actual original partial and final cash receipts separate from the earlier credit and each other',()=>{
 const view=reader.snapshot.view!,input:SeasonInput={view,features:view.features as unknown as PlayFeatures},before=reader.exportSaved(),nodes=equitySeasonEchoes(input),sale=nodes.find(n=>n.id.startsWith('equity-sale:'))!,paid=nodes.filter(n=>n.id.startsWith('equity-collected:')).sort((a,b)=>a.sequence!-b.sequence!)
 expect(paid).toHaveLength(2);expect(sale.line).toContain('形成原净应收'+moneyText(689670));expect(sale.line).toContain('转让本身不等于收到现金')
 expect(paid[0]!.line).toContain('实收'+moneyText(344835));expect(paid[0]!.line).toContain('尚余'+moneyText(344835));expect(paid[1]!.line).toContain('尚余'+moneyText(0));expect(paid[0]!.date).toBe('2027-07-15');expect(paid[1]!.date).toBe('2027-07-15')
 expect(paid[1]!.sequence).toBeGreaterThan(paid[0]!.sequence!);expect(paid.every(n=>n.inspect.target?.openRecord&&n.inspect.target.equityTarget?.kind==='exit')).toBe(true);expect(reader.exportSaved()).toBe(before)
 const missing={...input,features:{...input.features,sceneCommands:{...input.features.sceneCommands!,commands:input.features.sceneCommands!.commands.filter(c=>c.commandId!==paid[0]!.sourceRefs.find(ref=>ref.kind==='command')!.id)}}}
 const known=equitySeasonEchoes(missing).filter(n=>n.id.startsWith('equity-collected:'))
 expect(known).toHaveLength(1);expect(known[0]!.line).toContain('序列尚未核全');expect(known[0]!.line).not.toContain('截至本次收款后');expect(reader.exportSaved()).toBe(before)
})

it('rejects duplicate round sources and a stale published revision while preserving an independently known original signature',()=>{
 const {h}=signedEquity({},'financial',2000000);h.send('AdvanceTime',{date:'2025-09-01'});const a=h.run.deepseek!.agreements[0]!;h.send('FollowEquityRound',{agreementId:a.id,amountFen:249600})
 const input=p(h),v=input.features.deepseek!,round=v.rounds.find(r=>r.date==='2025-09-01')!,before=h.codec.export(h.run),duplicate={...input,features:{...input.features,deepseek:{...v,rounds:[...v.rounds,round]}}}
 const nodes=equitySeasonEchoes(duplicate);expect(nodes.some(n=>n.id.startsWith('equity-follow:'))).toBe(false);expect(nodes.some(n=>n.id==='equity-signed:'+a.id)).toBe(true)
 const stale={...input,features:{...input.features,sceneCommands:{...input.features.sceneCommands!,committedRevision:input.view.revision-1}}}
 expect(equitySeasonEchoes(stale)).toEqual([]);expect(h.codec.export(h.run)).toBe(before)
})

it('keeps an unpaid original equity credit separate from a retained holding and leaves its collection voluntary',()=>{
 const {h,exit}=offeredEquityExit();h.send('AcceptEquityExit',{exitId:exit.id,shares:1000})
 const e=h.run.deepseek!.exits[0]!;h.send('AdvanceTime',{date:e.dueAt!})
 const input=p(h),before=h.codec.export(h.run),rows=equitySeasonContinuations(input),money=rows.find(row=>row.continuation==='money')!,holding=rows.find(row=>row.continuation==='retained')!
 expect(money).toBeDefined();expect(money.urgent).toBe(false);expect(money.dueAt).toBe(e.dueAt);expect(money.line).toContain('实际收取须另行选择');expect(money.inspect.target?.equityTarget).toMatchObject({kind:'exit',recordId:exit.id})
 expect(holding).toBeDefined();expect(holding.line).toContain('不要求新增付款');expect(h.codec.export(h.run)).toBe(before)
})
