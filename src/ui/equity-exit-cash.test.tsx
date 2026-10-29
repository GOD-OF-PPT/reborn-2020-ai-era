import {beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-season-repair-r177/original146-native-collection-input.json?raw'
import partialRaw from '../../goal-1/evidence/t17-acceptance-40/equity-exit-r213/normal145-partly-collected.json?raw'
import {createCampaignCodec,campaignDeepseek,campaignRuntime,campaignOperations,campaignMarket} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {equityJourney,type EquityJourneyContext} from './equity-journey.ts'
import {EquityPaper} from './EquityPaper.tsx'
import {moneyText} from './game-text.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Actual normal146 bytes, with explicit public-projection faults only. No
// saved state, original transaction or historical command is altered.
let v:ReturnType<typeof projectDeepseek>,context:EquityJourneyContext,target:EquitySceneTarget,exitId:string
let partial:{v:ReturnType<typeof projectDeepseek>;context:EquityJourneyContext;target:EquitySceneTarget}
beforeAll(()=>{
 const run=createCampaignCodec().import(raw),view=projectRun(run);v=projectDeepseek(run,campaignDeepseek)
 const e=v!.exits.find(e=>e.collectedFen>0&&e.receivable?.remainingFen===0)!,a=v!.agreements.find(a=>a.id===e.agreementId)!
 expect(e.collectionOperationIds).toHaveLength(2);exitId=e.id;target={runId:run.runId,accountId:a.accountId,businessId:a.businessId,kind:'exit',recordId:e.id}
 context={runId:run.runId,accountId:a.accountId,date:view.date,phase:run.phase,accounts:view.accounts,operations:run.operations!,finance:projectWorkbench(run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog).finance,source:{revision:view.revision,receipts:view.receipts},sceneCommands:projectSceneCommands(run)}
 const mid=createCampaignCodec().import(partialRaw),midView=projectRun(mid),midV=projectDeepseek(mid,campaignDeepseek)!,midE=midV.exits.find(e=>e.collectedFen>0&&e.receivable!.remainingFen>0)!,midA=midV.agreements.find(a=>a.id===midE.agreementId)!
 partial={v:midV,target:{runId:mid.runId,accountId:midA.accountId,businessId:midA.businessId,kind:'exit',recordId:midE.id},context:{runId:mid.runId,accountId:midA.accountId,date:midView.date,phase:mid.phase,accounts:midView.accounts,operations:mid.operations!,finance:projectWorkbench(mid,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog).finance,source:{revision:midView.revision,receipts:midView.receipts},sceneCommands:projectSceneCommands(mid)}}
})
it('retains the actual fully sourced cash receipt and its original date',()=>{
 const result=equityJourney(v,target,context)
 expect(result.phase).toBe('collected');expect(result.paper).toBe('receipt');expect(result.resultDate).toBe('2027-07-15');expect(result.line).toContain('实际银行现金已收到')
})
it('keeps the original paid record but does not issue a bank-cash receipt when its account source is unavailable',()=>{
 const result=equityJourney(v,target,{...context,finance:[]}),e=v!.exits.find(e=>e.id===exitId)!
 expect(result.phase).toBe('collection-source-unknown');expect(result.paper).toBe('kept');expect(result.resultDate).toBeNull();expect(result.line).not.toContain('实际银行现金已收到');expect(result.line).toContain('来源仍待核对')
 expect(result.facts.join(' ')).toContain(moneyText(e.collectedFen));expect(result.facts.join(' ')).toContain('原款记录')
 const html=renderToStaticMarkup(<EquityPaper p={{view:{readOnly:false,hasCandidate:false,saveStatus:'saved',busy:false}}} journey={result} binding={{label:result.action.label,disabled:false,reason:null,activate:()=>{throw Error('READING_MUST_NOT_ACT')}}}/>)
 expect(html).not.toContain('equity-cash-receipt');expect(html).not.toContain('实际收齐');expect(html).toContain('现金来源待核')
})
it('preserves the separately verified collection when another original transaction is missing',()=>{
 const e=v!.exits.find(e=>e.id===exitId)!,account=context.finance.find(f=>f.accountId===target.accountId)!,known=account.transactions.find(t=>t.id===e.collectionOperationIds[0])!
 const finance=context.finance.map(f=>f.accountId===target.accountId?{...f,transactions:f.transactions.filter(t=>t.id!==e.collectionOperationIds[1])}:f),result=equityJourney(v,target,{...context,finance})
 expect(result.phase).toBe('collection-source-unknown');expect(result.facts.join(' ')).toContain('已核现金'+moneyText(known.amountFen));expect(result.facts.join(' ')).toContain('原款记录');expect(result.facts.join(' ')).toContain(moneyText(e.collectedFen));expect(result.resultDate).toBeNull()
})
it('retains the original legal remaining-collection action while a previous paid source is unavailable',()=>{
 const valid=equityJourney(partial.v,partial.target,partial.context),unknown=equityJourney(partial.v,partial.target,{...partial.context,finance:[]})
 expect(valid.phase).toBe('collection');expect(valid.title).toContain('收过一部分');expect(unknown.phase).toBe('collection-source-partial');expect(unknown.action).toMatchObject({kind:'choice',intent:'collect'});expect(unknown.decisionOpen).toBe(true);expect(unknown.resultDate).toBeNull();expect(unknown.facts.join(' ')).toContain('未收¥3,448.35')
})
it('keeps duplicate accounts, wrong transaction sources and foreign command headers from producing a cash-complete receipt',()=>{
 const e=v!.exits.find(e=>e.id===exitId)!,account=context.finance.find(f=>f.accountId===target.accountId)!
 const variants:EquityJourneyContext[]=[
  {...context,finance:[...context.finance,account]},
  {...context,finance:context.finance.map(f=>f.accountId===target.accountId?{...f,transactions:f.transactions.map(t=>e.collectionOperationIds.includes(t.id)?{...t,sourceId:'another-exit'}:t)}:f)},
  {...context,sceneCommands:{...context.sceneCommands!,runId:'another-life'}},
 ]
 for(const c of variants){const r=equityJourney(v,target,c);expect(r.phase).toBe('collection-source-unknown');expect(r.paper).toBe('kept');expect(r.line).not.toContain('实际银行现金已收到');expect(r.resultDate).toBeNull()}
})
