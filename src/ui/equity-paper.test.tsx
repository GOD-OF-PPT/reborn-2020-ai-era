import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {signedEquity,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {equityJourney} from './equity-journey.ts'
import {EquityPaper} from './EquityPaper.tsx'

// Original fixed-outcome/funded fixture, only for public material/state fidelity.
// No normal route, native rendering, real save failure or human art claim.
function read(s:ReturnType<typeof signedEquity>){
 const {h,b,agreement}=s,view=projectRun(h.run),v=projectDeepseek(h.run,h.deepseek),target={runId:h.run.runId,accountId:b.accountId,businessId:b.id,kind:'agreement' as const,recordId:agreement.id}
 return equityJourney(v,target,{runId:h.run.runId,accountId:b.accountId,date:view.date,accounts:view.accounts,operations:view.operations,finance:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog).finance,source:{revision:view.revision,receipts:view.receipts},sceneCommands:projectSceneCommands(h.run)})
}
const p={view:{readOnly:false,hasCandidate:false,saveStatus:'saved' as const,busy:false}},binding={label:'核对同一份原选择',disabled:false,reason:null,activate:vi.fn()}

it('uses the distinct holding book with a real closed lock, then changes shape and copy only when its original lock has ended',()=>{
 const s=signedEquity({},'liquidity',800000),before=s.h.codec.export(s.h.run),locked=read(s),html=renderToStaticMarkup(<EquityPaper p={p} journey={locked} binding={binding}/>)
 expect(locked.resolution.agreement?.locked).toBe(true);expect(html).toContain('equity-holding-book-v1.png');expect(html).toContain('data-equity-lock="locked"');expect(html).toContain('仍锁定至');expect(html).not.toContain('equity-open-shackle')
 expect(s.h.codec.export(s.h.run)).toBe(before)
 s.h.send('AdvanceTime',{date:'2025-08-01'})
 const after=s.h.codec.export(s.h.run),unlocked=read(s),open=renderToStaticMarkup(<EquityPaper p={p} journey={unlocked} binding={binding}/>)
 expect(unlocked.resolution.agreement?.locked).toBe(false);expect(open).toContain('data-equity-lock="unlocked"');expect(open).toContain('equity-open-shackle');expect(open).toContain('锁定期已到');expect(open).not.toContain('仍锁定至')
 expect(s.h.codec.export(s.h.run)).toBe(after);expect(binding.activate).not.toHaveBeenCalled()
})

it('keeps a bad selected identity neutral instead of painting its otherwise valid source as a new intention or known holding',()=>{
 const s=signedEquity({},'liquidity',800000),before=s.h.codec.export(s.h.run),journey=read(s),html=renderToStaticMarkup(<EquityPaper p={p} journey={journey} binding={binding} unavailable/>)
 expect(html).toContain('原记录尚待核对');expect(html).toContain('data-unavailable="true"');expect(html).toContain('data-equity-lock="none"')
 for(const wrong of ['尚未承诺的参与想法','仍持1000','仍锁定至','equity-holding-book-v1.png','实际收齐'])expect(html).not.toContain(wrong)
 expect(s.h.codec.export(s.h.run)).toBe(before)
})

it('keeps retained transfer records distinct from current ownership and from an actually paid cash receipt',()=>{
 const s=signedEquity({},'liquidity',800000),{h,b,agreement}=s
 h.send('AdvanceTime',{date:'2025-08-01'});h.send('RequestEquityExit',{agreementId:agreement.id,shares:agreement.shares,...dsAssignment('2025-08-01')})
 h.send('AdvanceTime',{date:'2025-08-08'});const exit=h.run.deepseek!.exits[0]!
 h.send('AcceptEquityExit',{exitId:exit.id,shares:agreement.shares})
 const before=h.codec.export(h.run),journey=read(s),html=renderToStaticMarkup(<EquityPaper p={p} journey={journey} binding={binding}/>)
 expect(journey.phase).toBe('disposed');expect(journey.resolution.agreement?.shares).toBe(0);expect(journey.resultDate).toBe('2025-08-08')
 expect(html).toContain('原持股已全部转出，原款分别核对');expect(html).toContain('实际转出 2025-08-08');expect(html).toContain('data-equity-lock="none"')
 expect(html).not.toContain('equity-holding-book-v1.png');expect(html).not.toContain('本笔原款已收齐');expect(html).not.toContain('equity-cash-receipt')
 expect(projectDeepseek(h.run,h.deepseek)!.exits.find(e=>e.businessId===b.id)!.receivable!.remainingFen).toBeGreaterThan(0)
 expect(h.codec.export(h.run)).toBe(before)
})

it('keeps the same meaningful lock text in text mode and the original committed object under readonly/candidate protection',()=>{
 const s=signedEquity({},'liquidity',800000),journey=read(s)
 const text=renderToStaticMarkup(<EquityPaper p={{...p,textOnly:true}} journey={journey} binding={binding}/>)
 expect(text).not.toContain('<img');expect(text).not.toContain('<svg');expect(text).toContain('仍锁定至');expect(text).toContain('估值不能花')
 const readonly=renderToStaticMarkup(<EquityPaper p={{view:{...p.view,readOnly:true,saveStatus:'read_only'}}} journey={journey} binding={binding}/>)
 expect(readonly).toContain('只读 · 原记录保留');expect(readonly).toContain('data-equity-lock="locked"')
 const candidate=renderToStaticMarkup(<EquityPaper p={{view:{...p.view,hasCandidate:true,saveStatus:'unsaved'}}} journey={journey} binding={{...binding,disabled:true}}/>)
 expect(candidate).toContain('尚未保存 · 仍是上次物件');expect(candidate).toContain('data-equity-lock="locked"');expect(candidate).toContain('disabled=""')
})
