import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {campaignMarket} from '../application/campaign.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectRun,previewCommand} from '../core/commands.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {signedEquity,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {equityJourney} from './equity-journey.ts'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import {EquityPaper} from './EquityPaper.tsx'
import {equityGovernanceMark} from './equity-governance-ui.ts'

// Fixed-outcome funded fixtures are explicit model/UI evidence. They are not
// normal wealth, a Chrome/App governance route, balance or human acceptance.
function meeting(approved=true){
 const s=signedEquity({parameters:{governanceAcceptBps:approved?10000:0}},'board')
 s.h.send('AdvanceTime',{date:'2025-07-01'})
 return s
}
function scene(s:ReturnType<typeof meeting>,projection?:ReturnType<typeof projectDeepseek>){
 const {h,b}=s,run=h.run,g=run.deepseek!.governance.at(-1)!
 return equityJourney(projection??projectDeepseek(run,h.deepseek),{runId:run.runId,accountId:b.accountId,businessId:b.id,kind:'governance',recordId:g.id},{runId:run.runId,accountId:b.accountId,date:run.timeline.cursor.date,accounts:run.controlledAccountIds.map(accountId=>({accountId})),operations:run.operations!,finance:projectWorkbench(run,h.runtime,h.operations.catalog,campaignMarket.catalog).finance,source:{revision:run.revision,receipts:projectRun(run).receipts},sceneCommands:projectSceneCommands(run)})
}
it('ends the actual audit purpose after a passed vote, retaining the holding instead of asking to propose again',()=>{
 const s=meeting();s.h.send('ProposeEquityGovernance',{agreementId:s.agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')});s.h.send('AdvanceTime',{date:'2025-07-08'})
 const before=s.h.codec.export(s.h.run),result=scene(s)
 expect(result.purpose).toContain('已经开放');expect(result.purpose).not.toContain('提出有限的提案');expect(result.finishWhen).toContain('本次已经结束');expect(result.action.kind).toBe('today')
 expect(s.h.codec.export(s.h.run)).toBe(before)
})
it('ends an actually refused vote with its retained costs and no remaining vote to wait for',()=>{
 const s=meeting(false);s.h.send('ProposeEquityGovernance',{agreementId:s.agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')});s.h.send('AdvanceTime',{date:'2025-07-08'})
 const result=scene(s)
 expect(result.purpose).toContain('未获通过');expect(result.finishWhen).toContain('不必再等本次表决');expect(result.outcome).toBe('non-success');expect(result.action.kind).toBe('today')
})
it('repeats the exact chosen policy, actual budget, resources and dates in the captured original meeting confirmation',()=>{
 const {h,agreement}=meeting(),view=projectRun(h.run),features={deepseek:projectDeepseek(h.run,h.deepseek)},command={runId:h.run.runId,actorId:h.run.actorId,commandId:'confirm-original-meeting',expectedRevision:h.run.revision,kind:'ProposeEquityGovernance',payload:{agreementId:agreement.id,policy:'commercial_scope',...dsAssignment('2025-07-02')}},preview=previewCommand(h.run,command,h.registry,h.run.actorId)
 expect(preview.allowed).toBe(true)
 const before=h.codec.export(h.run),html=renderToStaticMarkup(<EquityDecisionFacts command={command} preview={preview} view={view} features={features} accountName={()=> '个人账户'}/>)
 expect(html).toContain('本次有限提案');expect(html).toContain('限定研究用途与接手方');expect(html).toContain('2025-07-02');expect(html).toContain('2025-07-09');expect(html).toContain('¥500');expect(html).toContain('本人实际日期产能');expect(html).toContain('尚未表决')
 expect(h.codec.export(h.run)).toBe(before)
})

it('distinguishes an approved restriction from its next-day effect without rewriting an old vote or pretending it already applies today',()=>{
 const s=meeting();s.h.send('ProposeEquityGovernance',{agreementId:s.agreement.id,policy:'commercial_scope',...dsAssignment('2025-07-01')});s.h.send('AdvanceTime',{date:'2025-07-08'})
 expect(scene(s).line).toContain('已通过，自2025-07-09起');expect(scene(s).line).not.toContain('已生效')
 s.h.send('AdvanceTime',{date:'2025-07-09'});expect(scene(s).line).toContain('已生效');expect(scene(s).line).toContain('旧报价不追改');expect(scene(s).resultDate).toBe('2025-07-08')
})

it('keeps both a cancelled plan and an interrupted running meeting without manufacturing a vote',()=>{
 for(const planned of [true,false]){
  const s=meeting();s.h.send('ProposeEquityGovernance',{agreementId:s.agreement.id,policy:'independent_audit',...dsAssignment(planned?'2025-07-10':'2025-07-01')})
  const g=s.h.run.deepseek!.governance[0]!
  expect(equityGovernanceMark(scene(s))).toBe(planned?'planned':'running')
  s.h.send('InterruptJob',{jobId:g.jobId});const result=scene(s)
  expect(result.purpose).toContain('已经停下');expect(result.resultDate).toBeNull();expect(result.resolution.governance).toMatchObject({approved:null,resolvedAt:null});expect(result.finishWhen).toContain('没有表决结果');expect(equityGovernanceMark(result)).toBe('stopped')
 }
})

it('uses distinct actual vote marks and keeps their meaning in text-only and protected views',()=>{
 for(const approved of [true,false]){
  const s=meeting(approved);s.h.send('ProposeEquityGovernance',{agreementId:s.agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')});s.h.send('AdvanceTime',{date:'2025-07-08'})
  const journey=scene(s),mark=approved?'approved':'rejected',binding={label:journey.action.label,disabled:false,reason:null,activate:()=>{throw Error('ART_READING_MUST_NOT_ACT')}}
  const view={readOnly:true,hasCandidate:false,saveStatus:'read_only' as const,busy:false},html=renderToStaticMarkup(<EquityPaper p={{view,textOnly:false}} journey={journey} binding={binding}/>)
  expect(html).toContain('data-equity-governance="'+mark+'"');expect(html).toContain('vote-'+mark);expect(html).toContain(approved?'本次有限通过':'本次未通过');expect(html).toContain('只读 · 原记录保留')
  const text=renderToStaticMarkup(<EquityPaper p={{view,textOnly:true}} journey={journey} binding={binding}/>);expect(text).not.toContain('<svg');expect(text).toContain(approved?'本次有限通过':'本次未通过')
  const unknown=renderToStaticMarkup(<EquityPaper p={{view}} journey={journey} binding={binding} unavailable/>);expect(unknown).toContain('data-equity-governance="unknown"');expect(unknown).not.toContain('本次有限通过');expect(unknown).not.toContain('本次未通过')
 }
})

it('refuses to replace missing or ambiguous policy/account/resource sources in the original confirmation',()=>{
 const {h,agreement}=meeting(),view=projectRun(h.run),v=projectDeepseek(h.run,h.deepseek)!,command={runId:h.run.runId,actorId:h.run.actorId,commandId:'confirm-original-policy-guards',expectedRevision:h.run.revision,kind:'ProposeEquityGovernance',payload:{agreementId:agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')}},preview=previewCommand(h.run,command,h.registry,h.run.actorId)
 const cases:[typeof command,{deepseek:typeof v},typeof view][]=[
  [{...command,payload:{...command.payload,policy:'unknown'}},{deepseek:v},view],
  [command,{deepseek:{...v,agreements:[...v.agreements,v.agreements[0]!]}},view],
  [command,{deepseek:v},{...view,accounts:[...view.accounts,view.accounts[0]!]}],
  [{...command,payload:{...command.payload,resources:['unknown-resource']}},{deepseek:v},view],
  [{...command,expectedRevision:view.revision-1},{deepseek:v},view],
 ]
 for(const [c,features,context] of cases){
  const html=renderToStaticMarkup(<EquityDecisionFacts command={c} preview={preview} view={context} features={features} accountName={()=> '个人账户'}/>);expect(html).toContain('先核对这份原会议安排');expect(html).not.toContain('本次有限提案')
 }
})

it('keeps an unknown policy on its own meeting date without substituting the invitation or publishing a vote stamp',()=>{
 const s=meeting();s.h.send('ProposeEquityGovernance',{agreementId:s.agreement.id,policy:'independent_audit',...dsAssignment('2025-07-01')});s.h.send('AdvanceTime',{date:'2025-07-08'})
 const v=projectDeepseek(s.h.run,s.h.deepseek)!,fault={...v,governance:v.governance.map(g=>({...g,policy:'unrecognized' as typeof g.policy}))},before=s.h.codec.export(s.h.run),journey=scene(s,fault)
 expect(journey.phase).toBe('governance-unknown');expect(journey.originDate).toBe('2025-07-01');expect(journey.resultDate).toBeNull();expect(equityGovernanceMark(journey)).toBe('unknown')
 const html=renderToStaticMarkup(<EquityPaper p={{view:{readOnly:false,hasCandidate:false,saveStatus:'saved',busy:false}}} journey={journey} binding={{label:journey.action.label,disabled:true,reason:null,activate:()=>{}}}/> )
 expect(html).toContain('原会议来源 2025-07-01');expect(html).not.toContain('实际表决');expect(html).not.toContain('vote-approved');expect(s.h.codec.export(s.h.run)).toBe(before)
})
