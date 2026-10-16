import { expect,it } from 'vitest'
import { createOperationsFixture } from '../testing/operations-fixture.ts'
import { campaignMarket } from './campaign.ts'
import { projectWorkbench } from './workbench-projection.ts'
import { canonicalJson } from '../core/identity.ts'
import { createMarketFixture,MARKET_FIXTURE,stockOrder } from '../testing/market-fixture.ts'
import { CAMPAIGN_CONTENT } from '../content/campaign.ts'
import { fixtureEvent } from '../testing/world-fixture.ts'
import { playableAdvanceDate } from './playable-advance.ts'

it('includes earned unbilled employee costs without deducting cash or mixing the company with its owner',()=>{
 const f=createOperationsFixture();let run=f.apply(f.run,'DiscoverBusiness',{definitionId:'fixture-company'});const business=run.operations!.businesses[0]!
 run=f.apply(run,'FundBusiness',{businessId:business.id,amountFen:900000});run=f.apply(run,'PrepareBusiness',{businessId:business.id});run=f.apply(run,'ActivateBusiness',{businessId:business.id});run=f.apply(run,'HireWorker',{businessId:business.id,definitionId:'editor-lin'});run=f.apply(run,'AdvanceTime',{date:'2020-01-15'})
 const before=canonicalJson(run),projection=projectWorkbench(run,f.runtime,f.operations.catalog,campaignMarket.catalog),company=projection.finance.find(f=>f.accountId===business.accountId)!,personal=projection.finance.find(f=>f.accountId==='personal')!
 expect(company).toMatchObject({cashFen:850000,postedCostFen:50000,accruedCostFen:145161,costFen:195161,profitFen:-195161,netAssetsFen:704839});expect(personal.cashFen).toBe(1700000);expect(canonicalJson(run)).toBe(before)
})
it('finishes remaining June phases and now permits July without changing the original S01 result',()=>{
 const f=createMarketFixture(MARKET_FIXTURE,{...CAMPAIGN_CONTENT,events:[fixtureEvent],calendar:[{definitionId:'fixture',date:'2020-06-30',bindingId:'player',occurrenceId:'preview-last-day'}]});let run=f.apply(f.run,'AdvanceTime',{date:'2020-06-30'});expect(run.timeline.pause).not.toBeNull();run=f.apply(run,'ChooseEvent',{instanceId:run.world!.instances[0]!.id,choiceId:'skip'});const before=projectWorkbench(run,f.runtime,f.operations.catalog,f.market.catalog);expect(before.atQuarterEnd).toBe(false);expect(playableAdvanceDate(before,run.timeline.cursor.date,'2020-06-30')).toBe('2020-06-30');run=f.apply(run,'AdvanceTime',{date:'2020-06-30'});const after=projectWorkbench(run,f.runtime,f.operations.catalog,f.market.catalog);expect(after.atQuarterEnd).toBe(true);expect(playableAdvanceDate(after,run.timeline.cursor.date,'2020-07-01')).toBe('2020-07-01')
})
it('can partially then fully pay a command-created cash gap and release only the resolved pause',()=>{
 const expense={...fixtureEvent,choices:[{...fixtureEvent.choices[0],actionPoints:0,effects:[{op:'postLedgerTransaction',transaction:{kind:'due_expense',accountId:'$owner',counterpartyId:'world',obligationId:'fixture-cash-gap',amountFen:2500000}}]},fixtureEvent.choices[1]]};const f=createMarketFixture(MARKET_FIXTURE,{...CAMPAIGN_CONTENT,events:[expense],calendar:[{definitionId:'fixture',date:'2020-01-02',bindingId:'player',occurrenceId:'immediate-gap'}]});let run=f.apply(f.run,'PlanStockOrder',stockOrder({quantity:100}));run=f.apply(run,'AdvanceTime',{date:'2020-01-02'});run=f.apply(run,'ChooseEvent',{instanceId:run.world!.instances[0]!.id,choiceId:'act'});expect(run.timeline.pause).toMatchObject({reason:'CASH_SHORTFALL',source:'command'});const due=run.economy.ledger.obligations.find(o=>o.remainingFen>0)!;run=f.apply(run,'PayObligation',{accountId:'personal',obligationId:due.id,amountFen:1000000});expect(run.timeline.pause).not.toBeNull();run=f.apply(run,'CancelStockOrder',{orderId:run.market!.orders[0]!.id});run=f.apply(run,'PayObligation',{accountId:'personal',obligationId:due.id,amountFen:1500000});expect(run.timeline.pause).toBeNull();expect(run.economy.ledger.obligations.find(o=>o.id===due.id)?.remainingFen).toBe(0);run=f.apply(run,'AdvanceTime',{date:'2020-01-02'});expect(run.economy.ledger.accounts.find(a=>a.id==='personal')?.balanceFen).toBe(100000)
})
it('stops at an already quoted but unmatched current-day point for orders submitted before the news pause',()=>{
 const f=createMarketFixture(MARKET_FIXTURE,{...CAMPAIGN_CONTENT,events:[fixtureEvent],calendar:[{definitionId:'fixture',date:'2020-01-02',bindingId:'player',occurrenceId:'same-day-pause'}]});let run=f.apply(f.run,'PlaceStockOrder',stockOrder());run=f.apply(run,'AdvanceTime',{date:'2020-01-02'});run=f.apply(run,'ChooseEvent',{instanceId:run.world!.instances[0]!.id,choiceId:'skip'});const w=projectWorkbench(run,f.runtime,f.operations.catalog,f.market.catalog);expect(w.progression).toMatchObject({nextDate:'2020-01-02',quarterTarget:'2020-01-02'});run=f.apply(run,'AdvanceTime',{date:w.progression.quarterTarget});expect(run.market?.fills[0]?.checkpointId).toBe('p0');expect(run.market?.lastMatchedIndex).toBe(0);expect(run.timeline.cursor.date).toBe('2020-01-02')
})
