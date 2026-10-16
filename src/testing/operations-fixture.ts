import { CAMPAIGN_CONTENT } from '../content/campaign.ts'
import { OPERATIONS_CONTENT } from '../content/operations.ts'
import { composeCampaignRuntime,createCampaignRegistry } from '../application/campaign.ts'
import { createOperatingHandlers } from '../application/operations-commands.ts'
import { createInitialRun } from '../application/bootstrap.ts'
import { createGameRun } from '../core/run.ts'
import { BOOTSTRAP_VERSIONS } from '../content/bootstrap.ts'
import { hashValue } from '../core/hash.ts'
import { RunCodec } from '../persistence/codec.ts'
import { evaluateCommand } from '../core/commands.ts'
import type { GameRun } from '../core/run-types.ts'
export const OPERATING_FIXTURE_CATALOG={...OPERATIONS_CONTENT,version:'operating-fixture-v1',businesses:[{id:'fixture-company',route:'ai_video',company:true,capabilities:['manual_editing'],preparationKey:null,minCashFen:50000,capacityUnits:1,monthlyMaintenanceFen:0,requiresPreparationJob:false}],jobs:[...OPERATIONS_CONTENT.jobs,{id:'fixture-production',purpose:'production',routes:['ai_video'],skill:'general',durationDays:3,actionPoints:1,costFen:50000,output:'fixture-delivery'}],offers:['one','two'].map(name=>({id:`fixture-offer-${name}`,route:'ai_video',from:'2020-01-01',to:'2020-03-01',jobDefinitionId:'fixture-production',priceFen:130000,prepaymentFen:100000,deliveryDueAt:'2020-03-31',reviewDays:1,paymentDays:1,acceptBps:10000}))}
export function createOperationsFixture(catalog:unknown=OPERATING_FIXTURE_CATALOG){
 const {runtime,operations}=composeCampaignRuntime({...CAMPAIGN_CONTENT,calendar:[]},catalog)
 const versions={...BOOTSTRAP_VERSIONS,rulesVersion:'rules-t06-fixture',contentVersion:'operations-fixture-v1',contentHash:hashValue({world:runtime.pack,operations:operations.catalog})}
 const input={runId:'operating-fixture',actorId:'player',commandId:'create-fixture',backgroundId:'technical_employee',seed:'operating-fixture-seed'}
 const base=createInitialRun(input);const world=runtime.initialWorld([{id:'player',kind:'player',accountId:'personal',businessId:null,route:null,contractId:null,personId:null,capacityUnits:1}],input.backgroundId)
 const state=operations.initial(input.backgroundId);const model=runtime.schedule({...base,world,operations:state})
 const registry=createCampaignRegistry(runtime,versions,createOperatingHandlers(operations));const codec=new RunCodec(registry,['technical_employee','content_employee'])
 const run=createGameRun(input,{origin:'fixture',personalAccountId:'personal',controlledAccountIds:['personal'],economy:model.economy,timeline:model.timeline,world,operations:state},versions)
 const commands:unknown[]=[]
 function apply(current:GameRun,kind:string,payload:unknown){const command={runId:current.runId,actorId:'player',commandId:`op-${current.revision}`,expectedRevision:current.revision,kind,payload};const result=evaluateCommand(current,command,registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify(result));commands.push(command);return codec.import(codec.export(result.nextRun))}
 return {run,runtime,operations,registry,codec,apply,commands}
}
