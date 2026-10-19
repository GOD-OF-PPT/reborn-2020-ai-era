import { MARKET_CONTENT } from '../content/market.ts'
import { CAMPAIGN_CONTENT } from '../content/campaign.ts'
import { OPERATIONS_CONTENT } from '../content/operations.ts'
import { composeCampaignRuntime,createCampaignRegistry } from '../application/campaign.ts'
import { createOperatingHandlers } from '../application/operations-commands.ts'
import { createMarketHandlers } from '../application/market-commands.ts'
import { createInitialRun } from '../application/bootstrap.ts'
import { createGameRun } from '../core/run.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { hashValue } from '../core/hash.ts'
import { RunCodec } from '../persistence/codec.ts'
import { evaluateCommand,previewCommand } from '../core/commands.ts'
import type { GameRun } from '../core/run-types.ts'

export const MARKET_FIXTURE={...MARKET_CONTENT,version:'market-fixture-v1',assets:[{...MARKET_CONTENT.assets[0],initialPriceFen:1000,requiredEntitlement:'sim-basic',regimes:[{from:'2020-01-01',to:'2025-12-31',ruleId:'fixture-rule',driftBps:0,volatilityBps:0}]}],rules:[{id:'fixture-rule',label:'虚构F06制度',lotSize:100,bandBps:5000,commissionBps:10,minimumCommissionFen:1000,sellTaxBps:0,shareLagDays:1,cashLagDays:1,allowOddLotSale:true}],dividends:[],checkpoints:['2020-01-02','2020-01-04','2020-01-06'].map((date,index)=>({id:`p${index}`,date,dataAvailable:true,overrides:[{symbol:'SIM-AI01',priceFen:index===0?1000:1200,referencePriceFen:index===0?1000:1200,volume:2000,status:'open'}],announcements:[]}))}
export function createMarketFixture(catalog:unknown=MARKET_FIXTURE,worldPack:unknown={...CAMPAIGN_CONTENT,calendar:[]}){
 const {runtime,operations,market}=composeCampaignRuntime(worldPack,OPERATIONS_CONTENT,catalog);if(!market)throw new Error('market required')
 const versions={...BOOTSTRAP_VERSIONS,rulesVersion:'rules-t08-fixture',contentVersion:'market-fixture-v1',contentHash:hashValue({world:runtime.pack,operations:operations.catalog,market:market.catalog})}
 const input={runId:'market-fixture',actorId:'player',commandId:'create-market',backgroundId:'technical_employee',seed:'market-fixture-seed'}
 const base=createInitialRun(input),world=runtime.initialWorld([{id:'player',kind:'player',accountId:'personal',businessId:null,route:null,contractId:null,personId:null,capacityUnits:1}],input.backgroundId),state=operations.initial(input.backgroundId),initialMarket=market.initial();const model=market.schedule(operations.scheduleOffers(runtime.schedule({...base,world,operations:state,market:initialMarket})))
 const registry=createCampaignRegistry(runtime,versions,[...createOperatingHandlers(operations),...createMarketHandlers(market)]),codec=new RunCodec(registry,['technical_employee','content_employee'])
 const run=createGameRun(input,{origin:'fixture',personalAccountId:'personal',controlledAccountIds:['personal'],economy:model.economy,timeline:model.timeline,world,operations:state,market:initialMarket},versions)
 const commands:unknown[]=[]
 const command=(run:GameRun,kind:string,payload:unknown)=>({runId:run.runId,actorId:'player',commandId:`market-${run.revision}`,expectedRevision:run.revision,kind,payload})
 function apply(current:GameRun,kind:string,payload:unknown){const cmd=command(current,kind,payload),result=evaluateCommand(current,cmd,registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify(result));commands.push(cmd);return codec.import(codec.export(result.nextRun))}
 const preview=(run:GameRun,kind:string,payload:unknown)=>previewCommand(run,command(run,kind,payload),registry,'player')
 return {run,runtime,operations,market,registry,codec,apply,preview,command,commands}
}
export function stockOrder(overrides:Record<string,unknown>={}){return {accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:1000,limitPriceFen:1000,quoteId:'initial-2020-01-01',validUntil:'p2',...overrides}}
