import { expect,it } from 'vitest'
import { createMarketFixture,MARKET_FIXTURE,stockOrder } from '../testing/market-fixture.ts'
import { accountPosition,accountFunds,metricsFor } from '../core/ledger.ts'
import { projectRun,evaluateCommand } from '../core/commands.ts'
import { projectMarket } from '../core/market-projection.ts'
import { canonicalJson } from '../core/identity.ts'
import { playNormalMarketQuarter } from '../testing/market-normal-scenario.ts'
import { CAMPAIGN_CONTENT } from '../content/campaign.ts'
import { fixtureEvent } from '../testing/world-fixture.ts'

it('executes F06 through real orders; unsettled sale cash cannot fund purchases',()=>{
 const f=createMarketFixture();let r=f.apply(f.run,'PlaceStockOrder',stockOrder());expect(accountFunds(r.economy.ledger,'personal')).toMatchObject({cashFen:2600000,heldFen:1001000});expect(r.market?.fills).toHaveLength(0)
 r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});expect(r.market?.positions[0]?.quantity).toBe(1000);expect(f.preview(r,'PlaceStockOrder',stockOrder({side:'sell',quoteId:'p0',limitPriceFen:1200})).reasonCodes).toContain('INSUFFICIENT_SETTLED_SHARES')
 r=f.apply(r,'AdvanceTime',{date:'2020-01-03'});r=f.apply(r,'PlaceStockOrder',stockOrder({side:'sell',quoteId:'p0',limitPriceFen:1200}));r=f.apply(r,'AdvanceTime',{date:'2020-01-04'});expect(accountPosition(r.economy.ledger,'personal')).toMatchObject({cashFen:1599000,receivableFen:1198800,investmentValueFen:0});expect(f.preview(r,'PlaceStockOrder',stockOrder({quoteId:'p1',quantity:2000,limitPriceFen:1200})).reasonCodes).toContain('INSUFFICIENT_AVAILABLE_FUNDS')
 r=f.apply(r,'AdvanceTime',{date:'2020-01-05'});expect(accountPosition(r.economy.ledger,'personal').cashFen).toBe(2797800);expect(metricsFor(r.economy.ledger,'personal','market:personal')).toMatchObject({incomeFen:1200000,costFen:1002200,profitFen:197800});expect(projectRun(r).budget.spent).toBe(0)
})

it('converts the same planned reservation, partially fills shared volume, then cancels only the remainder',()=>{
 const catalog={...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,overrides:p.overrides.map(o=>({...o,volume:i===0?400:2000}))}))};const f=createMarketFixture(catalog);let r=f.apply(f.run,'PlanStockOrder',stockOrder());const id=r.market!.orders[0]!.id,reserve=r.market!.orders[0]!.reservationId;expect(accountFunds(r.economy.ledger,'personal').heldFen).toBe(1001000)
 r=f.apply(r,'SubmitStockOrder',{orderId:id,quoteId:'initial-2020-01-01'});expect(r.market!.orders[0]!.reservationId).toBe(reserve);expect(r.economy.ledger.reservations.find(r=>r.id===reserve)?.kind).toBe('order');expect(accountFunds(r.economy.ledger,'personal')).toMatchObject({heldFen:1001000});r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});expect(r.market!.orders[0]).toMatchObject({remaining:600,status:'partially_filled',feesPaidFen:1000});expect(accountFunds(r.economy.ledger,'personal').heldFen).toBe(600000)
 r=f.apply(r,'CancelStockOrder',{orderId:id});expect(accountFunds(r.economy.ledger,'personal').heldFen).toBe(0);expect(r.market!.positions[0]).toMatchObject({quantity:400,buyFeesFen:1000});expect(accountPosition(r.economy.ledger,'personal').cashFen).toBe(2199000)
})

it('keeps sequence priority and shares volume across competing orders; expiry releases unused cash',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,overrides:p.overrides.map(o=>({...o,volume:i===0?300:0}))}))});let r=f.apply(f.run,'PlaceStockOrder',stockOrder({quantity:200,validUntil:'p0'}));r=f.apply(r,'PlaceStockOrder',stockOrder({quantity:200,validUntil:'p0'}));r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});expect(r.market?.orders.map(o=>[o.status,o.remaining])).toEqual([['filled',0],['expired',100]]);expect(r.market?.fills.map(o=>o.quantity)).toEqual([200,100]);expect(accountFunds(r.economy.ledger,'personal').heldFen).toBe(0)
})

it('refuses stale quotes, already observed matching points and malformed lots without mutating the run',()=>{
 const f=createMarketFixture();const r=f.apply(f.run,'AdvanceTime',{date:'2020-01-02'}),before=canonicalJson(r);expect(f.preview(r,'PlaceStockOrder',stockOrder()).reasonCodes).toContain('STALE_QUOTE');expect(f.preview(r,'PlaceStockOrder',stockOrder({quoteId:'p0',validUntil:'p0'})).reasonCodes).toContain('NO_FUTURE_MATCHING_POINT');expect(f.preview(r,'PlaceStockOrder',stockOrder({quoteId:'p0',quantity:1})).reasonCodes).toContain('INVALID_STOCK_LOT');expect(canonicalJson(r)).toBe(before)
 const next=f.apply(r,'PlaceStockOrder',stockOrder({quoteId:'p0',limitPriceFen:1200}));expect(next.market?.orders[0]?.eligibleIndex).toBe(1);expect(next.market?.fills).toHaveLength(0)
})

it.each(['suspended','data_unavailable','zero_volume'] as const)('never invents a fill for %s',status=>{
 const f=createMarketFixture({...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map(p=>({...p,overrides:p.overrides.map(o=>({...o,status:status==='zero_volume'?'open':status,priceFen:status==='data_unavailable'?null:o.priceFen,volume:status==='zero_volume'?0:o.volume}))}))});let r=f.apply(f.run,'PlaceStockOrder',stockOrder({validUntil:'p0'}));r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});expect(r.market?.fills).toHaveLength(0);expect(r.market?.orders[0]?.status).toBe('expired');expect(accountFunds(r.economy.ledger,'personal').heldFen).toBe(0)
})

it('reports unknown current market values separately from last known ledger values',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,dataAvailable:i===0}))});let r=f.apply(f.run,'PlaceStockOrder',stockOrder());r=f.apply(r,'AdvanceTime',{date:'2020-01-04'});expect(projectMarket(r,f.market.catalog)?.positions[0]).toMatchObject({valueFen:null,valuationStatus:'data_unavailable',lastKnownValueFen:1000000});expect(projectRun(r).accounts[0]).toMatchObject({netAssetsFen:null,investmentValueFen:null,lastKnownInvestmentValueFen:1000000})
})

it('requires a simulated entitlement and refuses every real historical mode request',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,initialEntitlements:[]});expect(f.preview(f.run,'PlaceStockOrder',stockOrder()).reasonCodes).toContain('MARKET_QUALIFICATION_REQUIRED');expect(f.preview(f.run,'UseHistoricalReplay',{}).reasonCodes).toContain('HISTORICAL_DATA_NOT_VERIFIED')
})

it('amends by cancel and replace with a fresh sequence and retains executed fills',()=>{
 const f=createMarketFixture();let r=f.apply(f.run,'PlaceStockOrder',stockOrder());const old=r.market!.orders[0]!.id;r=f.apply(r,'AmendStockOrder',{orderId:old,quantity:200,limitPriceFen:1000,quoteId:'initial-2020-01-01',validUntil:'p2'});expect(r.market?.orders[0]).toMatchObject({status:'cancelled',reason:'REPLACED'});expect(r.market?.orders[1]).toMatchObject({replacesId:old,sequence:2});expect(accountFunds(r.economy.ledger,'personal').heldFen).toBe(201000)
})

it('does not consume any random domain for previews, projections, plans or cancellations',()=>{
 const f=createMarketFixture();let r=f.run;const random=canonicalJson(r.random);for(let i=0;i<3;i++){f.preview(r,'PlaceStockOrder',stockOrder());projectMarket(r,f.market.catalog)}r=f.apply(r,'PlaceStockOrder',stockOrder());r=f.apply(r,'CancelStockOrder',{orderId:r.market!.orders[0]!.id});expect(canonicalJson(r.random)).toBe(random)
 const without=f.apply(f.run,'AdvanceTime',{date:'2020-01-04'}),withOrders=f.apply(r,'AdvanceTime',{date:'2020-01-04'});expect(withOrders.random).toEqual(without.random);expect(withOrders.market?.quotes).toEqual(without.market?.quotes)
})

it('reaches old Q01 through normal employment, research, study and a real order without injected cash',()=>{
 const {run,actual}=playNormalMarketQuarter();expect(run.origin).toBe('normal');expect(actual).toMatchObject({cashFen:2700000,investmentValueFen:1100000,spent:4,minimumCashFen:1100000});expect(run.market?.orders[0]?.status).toBe('filled');expect(run.market?.positions[0]).toMatchObject({quantity:100,principalFen:1198800,buyFeesFen:1200});expect(run.economy.ledger.receipts.filter(r=>r.kind==='acquire_asset')).toHaveLength(0)
},20000)

it('cannot trade at the checkpoint whose new quote has already been seen during a world pause',()=>{
 const f=createMarketFixture(MARKET_FIXTURE,{...CAMPAIGN_CONTENT,events:[fixtureEvent],calendar:[{definitionId:'fixture',date:'2020-01-02',bindingId:'player',occurrenceId:'quote-pause'}]});let r=f.apply(f.run,'AdvanceTime',{date:'2020-01-02'});expect(r.market).toMatchObject({lastQuoteIndex:0,lastMatchedIndex:-1});expect(f.preview(r,'PlaceStockOrder',stockOrder({quoteId:'p0',validUntil:'p0'})).reasonCodes).toContain('NO_FUTURE_MATCHING_POINT');r=f.apply(r,'PlaceStockOrder',stockOrder({quoteId:'p0',limitPriceFen:1200}));r=f.apply(r,'ChooseEvent',{instanceId:r.world?.instances[0]?.id,choiceId:'skip'});r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});expect(r.market?.fills).toHaveLength(0);r=f.apply(r,'AdvanceTime',{date:'2020-01-04'});expect(r.market?.fills[0]?.checkpointId).toBe('p1')
})

it('pays one raw-price dividend on record-date holdings and never adds it again on settlement',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,dividends:[{id:'dividend',symbol:'SIM-AI01',recordAt:'2020-01-04',perShareFen:10,paymentDays:1}],checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>i===1?{...p,overrides:[]}:p)});let r=f.apply(f.run,'PlaceStockOrder',stockOrder());r=f.apply(r,'AdvanceTime',{date:'2020-01-04'});expect(r.market?.quotes[0]?.priceFen).toBe(990);expect(accountPosition(r.economy.ledger,'personal')).toMatchObject({cashFen:1599000,receivableFen:10000,investmentValueFen:990000});expect(metricsFor(r.economy.ledger,'personal','market:personal')).toMatchObject({incomeFen:10000,costFen:1000,profitFen:9000});r=f.apply(r,'AdvanceTime',{date:'2020-01-05'});r=f.apply(r,'AdvanceTime',{date:'2020-01-05'});expect(accountPosition(r.economy.ledger,'personal')).toMatchObject({cashFen:1609000,receivableFen:0});expect(metricsFor(r.economy.ledger,'personal','market:personal').incomeFen).toBe(10000)
})

it('locks sale shares across orders and releases the lock on cancellation',()=>{
 const f=createMarketFixture();let r=f.apply(f.run,'PlaceStockOrder',stockOrder());r=f.apply(r,'AdvanceTime',{date:'2020-01-03'});r=f.apply(r,'PlanStockOrder',stockOrder({side:'sell',quantity:600,quoteId:'p0'}));expect(f.preview(r,'PlaceStockOrder',stockOrder({side:'sell',quantity:500,quoteId:'p0'})).reasonCodes).toContain('INSUFFICIENT_SETTLED_SHARES');r=f.apply(r,'CancelStockOrder',{orderId:r.market?.orders[1]?.id});expect(f.preview(r,'PlaceStockOrder',stockOrder({side:'sell',quantity:1000,quoteId:'p0'})).allowed).toBe(true)
})

it('consumes research time and cost; interrupted research never grants a qualification',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,initialEntitlements:[],researches:[{id:'access',actionPoints:1,costFen:10000,days:2,entitlementId:'sim-basic',explanation:'虚构模拟许可'}]});let r=f.apply(f.run,'ResearchMarket',{definitionId:'access'});expect(r.market?.permissions).toHaveLength(0);expect(projectRun(r).budget.spent).toBe(1);r=f.apply(r,'StopMarketResearch',{researchId:r.market?.researches[0]?.id});r=f.apply(r,'AdvanceTime',{date:'2020-01-03'});expect(accountPosition(r.economy.ledger,'personal').cashFen).toBe(2590000);expect(r.market?.permissions).toHaveLength(0);expect(f.preview(r,'PlaceStockOrder',stockOrder({quoteId:'p0'})).reasonCodes).toContain('MARKET_QUALIFICATION_REQUIRED')
 const g=createMarketFixture({...MARKET_FIXTURE,initialEntitlements:[],researches:[{id:'access',actionPoints:1,costFen:10000,days:2,entitlementId:'sim-basic',explanation:'虚构模拟许可'}]});let complete=g.apply(g.run,'ResearchMarket',{definitionId:'access'});complete=g.apply(complete,'AdvanceTime',{date:'2020-01-03'});expect(g.preview(complete,'PlaceStockOrder',stockOrder({quoteId:'p0'})).allowed).toBe(true)
})

it.each(['not_listed','no_rule','delisted'])('does not substitute a price or rule for %s',status=>{
 const asset={...MARKET_FIXTURE.assets[0],...(status==='not_listed'?{listedAt:'2020-02-01'}:status==='delisted'?{delistedAt:'2020-01-02'}:{regimes:[{...MARKET_FIXTURE.assets[0]!.regimes[0],to:'2020-01-01'}]})};const f=createMarketFixture({...MARKET_FIXTURE,assets:[asset]});if(status==='not_listed')expect(f.preview(f.run,'PlaceStockOrder',stockOrder()).reasonCodes).toContain('ASSET_NOT_LISTED');else {let r=f.apply(f.run,'PlaceStockOrder',stockOrder({validUntil:'p0'}));r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});expect(r.market?.fills).toHaveLength(0);expect(r.market?.quotes[0]).toMatchObject({status,priceFen:null})}
})

it('charges a minimum fee once across multiple fills and blocks closure until the sale receivable settles',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,overrides:p.overrides.map(o=>({...o,priceFen:1000,volume:i===0?400:2000}))}))});let r=f.apply(f.run,'PlaceStockOrder',stockOrder());r=f.apply(r,'AdvanceTime',{date:'2020-01-04'});expect(r.market?.fills.map(f=>f.feeFen)).toEqual([1000,0]);expect(r.market?.orders[0]).toMatchObject({remaining:0,status:'filled',feesPaidFen:1000})
 const g=createMarketFixture();let c=g.apply(g.run,'DiscoverBusiness',{definitionId:'course-studio'});const business=c.operations!.businesses[0]!;c=g.apply(c,'FundBusiness',{businessId:business.id,amountFen:1500000});c=g.apply(c,'PlaceStockOrder',stockOrder({accountId:business.accountId}));c=g.apply(c,'AdvanceTime',{date:'2020-01-03'});c=g.apply(c,'PlaceStockOrder',stockOrder({accountId:business.accountId,side:'sell',quoteId:'p0',limitPriceFen:1200}));c=g.apply(c,'AdvanceTime',{date:'2020-01-04'});c=g.apply(c,'WindDownBusiness',{businessId:business.id});expect(evaluateCommand(c,g.command(c,'CloseBusiness',{businessId:business.id}),g.registry,'player')).toMatchObject({status:'rejected',reasonCodes:['UNSETTLED_BUSINESS_ASSETS']});c=g.apply(c,'AdvanceTime',{date:'2020-01-05'});c=g.apply(c,'CloseBusiness',{businessId:business.id});expect(c.operations?.businesses[0]?.lifecycle).toBe('closed');expect(accountPosition(c.economy.ledger,business.accountId).cashFen).toBe(0)
},15000)

it('expires an old-regime order rather than silently adopting new lot and fee rules',()=>{
 const old=MARKET_FIXTURE.rules[0]!,next={...old,id:'new-rule',lotSize:10,minimumCommissionFen:0,commissionBps:20};const asset={...MARKET_FIXTURE.assets[0],regimes:[{from:'2020-01-01',to:'2020-01-03',ruleId:old.id,driftBps:0,volatilityBps:0},{from:'2020-01-04',to:'2025-12-31',ruleId:next.id,driftBps:0,volatilityBps:0}]};const f=createMarketFixture({...MARKET_FIXTURE,rules:[old,next],assets:[asset],checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,overrides:p.overrides.map(o=>({...o,volume:i===0?0:2000}))}))});let r=f.apply(f.run,'PlaceStockOrder',stockOrder());r=f.apply(r,'AdvanceTime',{date:'2020-01-04'});expect(r.market?.orders[0]).toMatchObject({status:'expired',reason:'RULE_CHANGED'});expect(accountFunds(r.economy.ledger,'personal').heldFen).toBe(0);r=f.apply(r,'PlaceStockOrder',stockOrder({quoteId:'p1',quantity:10,limitPriceFen:1200}));r=f.apply(r,'AdvanceTime',{date:'2020-01-06'});expect(r.market?.fills[0]).toMatchObject({quantity:10,grossFen:12000,feeFen:24})
})

it('conserves weighted cost and buy fees across partial sales until the final share is sold',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,checkpoints:[...MARKET_FIXTURE.checkpoints,{...MARKET_FIXTURE.checkpoints[2]!,id:'p3',date:'2020-01-08'}].map((p,i)=>({...p,overrides:p.overrides.map(o=>({...o,priceFen:i===0?1001:i===1?1002:1200,volume:2000}))}))});let r=f.apply(f.run,'PlaceStockOrder',stockOrder({quantity:100,limitPriceFen:1100}));r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});r=f.apply(r,'PlaceStockOrder',stockOrder({quantity:100,quoteId:'p0',limitPriceFen:1100}));r=f.apply(r,'AdvanceTime',{date:'2020-01-05'});r=f.apply(r,'PlaceStockOrder',stockOrder({quantity:100,side:'sell',quoteId:'p1',limitPriceFen:1200}));r=f.apply(r,'AdvanceTime',{date:'2020-01-06'});expect(r.market?.positions[0]).toMatchObject({quantity:100,principalFen:100150,buyFeesFen:1000});r=f.apply(r,'PlaceStockOrder',stockOrder({quantity:100,side:'sell',quoteId:'p2',limitPriceFen:1200,validUntil:'p3'}));r=f.apply(r,'AdvanceTime',{date:'2020-01-08'});expect(r.market?.positions[0]).toMatchObject({quantity:0,principalFen:0,buyFeesFen:0});expect(r.market?.fills.filter(f=>f.realizedProfitFen!==null).map(f=>f.realizedProfitFen)).toEqual([17850,17850])
})

it('keeps missing quotes unavailable until a fresh explicit reference is supplied',()=>{
 const f=createMarketFixture({...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,dataAvailable:i!==0,overrides:p.overrides.map(o=>({...o,referencePriceFen:i===2?1200:null}))}))});let r=f.apply(f.run,'AdvanceTime',{date:'2020-01-04'});expect(r.market?.quotes[0]).toMatchObject({priceFen:null,status:'data_unavailable'});r=f.apply(r,'AdvanceTime',{date:'2020-01-06'});expect(r.market?.quotes[0]).toMatchObject({priceFen:1200,status:'open'})
})

it('returns detached public market data that cannot mutate the committed run or its catalog',()=>{
 const f=createMarketFixture();let r=f.apply(f.run,'PlaceStockOrder',stockOrder());r=f.apply(r,'AdvanceTime',{date:'2020-01-02'});const before=canonicalJson(r),catalog=canonicalJson(f.market.catalog),view=projectMarket(r,f.market.catalog)!;Reflect.set(view.fills[0]!,'quantity',999);Reflect.set(view.stocks[0]!.rule!,'lotSize',1);expect(canonicalJson(r)).toBe(before);expect(canonicalJson(f.market.catalog)).toBe(catalog)
})
