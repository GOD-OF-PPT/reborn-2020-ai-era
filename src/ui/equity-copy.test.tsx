import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createRef} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-shared-closure-r221/normal75-input.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {equityStageCopy} from './equity-stage-copy.ts'
import {equityJourneyFor,equityFocusFor} from './equity-player-thread.ts'
import {EquityMoment} from './EquityMoment.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {prepareEquity,signedEquity,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {campaignMarket} from '../application/campaign.ts'
import {equityReportBrief} from './equity-invitation-result.ts'
import {waitSceneResult} from './wait-scene-result.ts'
import {EquityPaper} from './EquityPaper.tsx'

// Real normal prefix and original controller transitions; fake IDB/SSR are
// explicitly model evidence, not a browser or a human readability approval.
let controller:GameController,store:IndexedDbRunStore,p:GamePanelProps,focus:ReturnType<typeof equityFocusFor>
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-copy-normal'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw);const v=controller.snapshot.view!.features as unknown as PlayFeatures,b=v.deepseek!.businesses.find(b=>b.definitionId==='deepseek-investor')!;expect((await controller.submit(controller.prepare('DiscoverEquityInvitation',{businessId:b.id,source:'broker'}))).status).toBe('saved');const i=(controller.snapshot.view!.features as unknown as PlayFeatures).deepseek!.invitations.at(-1)!;expect((await controller.submit(controller.prepare('PayUnverifiedBrokerFee',{invitationId:i.id}))).status).toBe('saved');const view=controller.snapshot.view!;p={controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn()};focus=equityFocusFor(p,{runId:view.runId,accountId:'personal',businessId:b.id,kind:'invitation',recordId:i.id})})
afterAll(async()=>{await controller?.close();await store?.close()})
it('keeps the real1000 payment and original deadline while replacing repeated explanations with a short current action',()=>{const before=controller.exportSaved(),j=equityJourneyFor(p,focus),copy=equityStageCopy(p,j);expect(copy.heading).toBe('一封还没查清的介绍');expect(copy.line).toBe('先核实来历，也可以把它收好。');expect(copy.action).toBe('调查，还是拒绝？');expect(copy.facts).toContain('已付中间费¥1,000');expect(copy.facts).toContain('邀请有效至 2025-04-20');expect(copy.facts.join(' ')).not.toContain('不能把它当作投资本金');expect(j.facts.join(' ')).toContain('不能把它当作投资本金');expect(controller.exportSaved()).toBe(before)})
it('renders the short action and a direct original notebook while preserving same-life state and actual fee',()=>{const before=controller.exportSaved(),html=renderToStaticMarkup(<EquityMoment p={p} focus={focus!} headingRef={createRef<HTMLHeadingElement>()} onFocus={vi.fn()} onNavigate={vi.fn()} onExplore={vi.fn()}/>);expect(html).toContain('调查，还是拒绝？');expect(html).toContain('先过自己的日子');expect(html).toContain('翻开手记');expect(html).toContain('¥1,000');expect(html).not.toContain('持股、原款和未完任务都按自己的记录继续');expect(html).not.toContain('没有默认');expect(controller.exportSaved()).toBe(before)})
it('keeps an unknown payment source visible rather than calling it zero or silently deleting it to shorten the screen',()=>{const missing={...p,features:{...p.features,workbench:{...p.features.workbench,finance:[]}}},j=equityJourneyFor(missing,focus),copy=equityStageCopy(missing,j);expect(copy.facts.join(' ')).toContain('来源尚待核对');expect(copy.facts.join(' ')).not.toContain('已付中间费¥0');expect(copy.facts.join(' ')).toContain('不能按零')})

function fixtureProps(h:ReturnType<typeof signedEquity>['h']):GamePanelProps{
 const view=projectRun(h.run),features={deepseek:projectDeepseek(h.run,h.deepseek),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog),sceneCommands:projectSceneCommands(h.run)} as unknown as PlayFeatures
 return{view,features,accountId:'personal'} as GamePanelProps
}
it('does not offer signature in the short name of an actually rejected negotiation',()=>{
 const sample=prepareEquity({parameters:{negotiationAcceptBps:0}}),q=fixtureProps(sample.h),t={runId:q.view.runId,accountId:'personal',businessId:sample.b.id,kind:'negotiation' as const,recordId:sample.negotiation.id},j=equityJourneyFor(q,equityFocusFor(q,t))
 expect(sample.h.preview('SignEquityAgreement',{negotiationId:sample.negotiation.id}).allowed).toBe(false);expect(equityStageCopy(q,j).action).toBe('看看这次回应');expect(equityStageCopy(q,j).action).not.toContain('签署')
})
it('keeps the zero-only original follow choice after an actual full transfer, rather than inviting a new contribution',()=>{
 const sample=signedEquity({},'liquidity',800000),{h,b,agreement}=sample;h.send('AdvanceTime',{date:'2025-08-01'});h.send('RequestEquityExit',{agreementId:agreement.id,shares:agreement.shares,...dsAssignment('2025-08-01')});h.send('AdvanceTime',{date:'2025-08-08'});h.send('AcceptEquityExit',{exitId:h.run.deepseek!.exits[0]!.id,shares:agreement.shares});h.send('AdvanceTime',{date:'2025-09-01'});const q=fixtureProps(h),j=equityJourneyFor(q,equityFocusFor(q,{runId:q.view.runId,accountId:'personal',businessId:b.id,kind:'agreement',recordId:agreement.id}))
 expect(j.phase).toBe('follow-without-holding');expect(h.preview('FollowEquityRound',{agreementId:agreement.id,amountFen:800}).allowed).toBe(false);expect(h.preview('FollowEquityRound',{agreementId:agreement.id,amountFen:0}).allowed).toBe(true);expect(equityStageCopy(q,j).action).toBe('核对旧融资')
})
it('uses one actual report sentence only for a pure original report wait and preserves mixed feedback separately',async()=>{
 const invitation=p.features.deepseek!.invitations[0]!;expect((await controller.submit(controller.prepare('InvestigateEquityInvitation',{invitationId:invitation.id,...dsAssignment('2025-01-20')}))).status).toBe('saved');const before=controller.snapshot.view!,result=await controller.waitForFeedback(controller.prepare('AdvanceTime',{date:'2025-01-27'})),current=controller.snapshot.view!,v=current.features as unknown as PlayFeatures,report=v.deepseek!.invitations.find(i=>i.id===invitation.id)!,brief=equityReportBrief(before,current,result.feedback.filter(f=>f.attention==='pause'))
 expect(report.reportAt).toBe('2025-01-27');expect(brief).toBe(report.authority===false?'调查回信了：这次没能核实授权。':report.financingConsent===false?'授权已核实，对方暂不愿融资。':'授权与有条件融资意愿已核实。');expect(waitSceneResult(result,current)?.brief).toBe(brief)
 expect(equityReportBrief(before,current,[...result.feedback,{kind:'job',sourceId:'another-actual-life-job',key:'different-result',label:'另一件事也完成了',attention:'pause'}])).toBeNull()
 expect(equityReportBrief(before,current,[...result.feedback,{kind:'invitation',sourceId:'another-invitation',key:'different-invitation',label:'另一封邀请也有变化',attention:'pause'}])).toBeNull()
 const q={...p,view:current,features:v},j=equityJourneyFor(q,equityFocusFor(q,{runId:current.runId,accountId:'personal',businessId:invitation.businessId,kind:'invitation',recordId:invitation.id}))
 if(!report.authority||!report.financingConsent){expect(j.action).toMatchObject({kind:'command',command:'RejectEquityInvitation',payload:{invitationId:invitation.id},confirm:true});expect(equityStageCopy(q,j).action).toBe('拒绝这封邀请')}
})

it('does not keep an active future invitation deadline after the original invitation has actually been refused',()=>{
 const sample=prepareEquity(),{h,b,invitation}=sample;h.send('RejectEquityInvitation',{invitationId:invitation.id});const q=fixtureProps(h),j=equityJourneyFor(q,equityFocusFor(q,{runId:q.view.runId,accountId:'personal',businessId:b.id,kind:'invitation',recordId:invitation.id})),copy=equityStageCopy(q,j)
 expect(j.resolution.invitation?.status).toBe('declined');expect(copy.facts.join(' ')).not.toContain('邀请有效至');const html=renderToStaticMarkup(<EquityPaper p={{view:q.view}} journey={j} binding={{label:copy.action,disabled:false,reason:null,activate:()=>{throw Error('READ_ONLY_PAPER')}}}/>);expect(html).toContain('实际拒绝 '+q.view.date);expect(html).not.toContain('邀请至 '+invitation.expiresAt)
})
