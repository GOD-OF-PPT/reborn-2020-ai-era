import {createRoutineHandlers} from '../application/routine-commands.ts'
import {CAMPAIGN_CONTENT} from '../content/campaign.ts'
import {OPERATIONS_CONTENT} from '../content/operations.ts'
import {composeCampaignRuntime,createCampaignRegistry} from '../application/campaign.ts'
import {createOperatingHandlers} from '../application/operations-commands.ts'
import {createVideoHandlers} from '../application/video-commands.ts'
import {createRelayHandlers} from '../application/relay-commands.ts'
import {createGameRun} from '../core/run.ts'
import {createLedger,applyLedger} from '../core/ledger.ts'
import {createEconomy} from '../core/economy.ts'
import {createTimeline} from '../core/timeline.ts'
import {BOOTSTRAP_VERSIONS} from '../content/bootstrap.ts'
import {hashValue} from '../core/hash.ts'
import {evaluateCommand,previewCommand} from '../core/commands.ts'
import {RunCodec} from '../persistence/codec.ts'
import type {RunOperation} from '../core/content-types.ts'
import type {RelayParameters} from '../core/relay-schema.ts'
export function createRelayFixture(options:{cashFen?:number;seed?:string;parameters?:Partial<RelayParameters>;withRoutines?:boolean}={}){
 const pack={...CAMPAIGN_CONTENT,calendar:[]},catalog={...OPERATIONS_CONTENT,businesses:OPERATIONS_CONTENT.businesses.map(b=>b.id==='relay-station'?{...b,company:false,minCashFen:0,monthlyMaintenanceFen:0}:b)},parameters={applicationAcceptBps:10000,trafficBps:10000,billingErrorBps:0,faultMode:'none',unitCostFen:6,monthlyUnits:300000,...options.parameters},composition=composeCampaignRuntime(pack,catalog,undefined,true,false,parameters,options.withRoutines===true),{runtime,operations}=composition,relay=composition.relay!,video=composition.video!
 const input={runId:'relay-fixture',actorId:'player',commandId:'fixture-create',backgroundId:'technical_employee',seed:options.seed??'relay-fixture-v1'},world=runtime.initialWorld([{id:'player',kind:'player',accountId:'personal',businessId:null,route:null,contractId:null,personId:null,capacityUnits:1}],input.backgroundId),ops=operations.initial(input.backgroundId),versions={...BOOTSTRAP_VERSIONS,rulesVersion:'rules-t12-fixture-v1',contentVersion:'relay-fixture-v1',contentHash:hashValue({world:runtime.pack,operations:operations.catalog,video:video.catalog,relay:relay.catalog,...(composition.routine?{routines:composition.routine.catalog}:{})})},ledger=applyLedger(createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2020-01-01'),{id:'fixture:opening',sourceEventId:'fixture:relay',date:'2020-01-01',kind:'opening_cash',accountId:'personal',counterpartyId:'world',amountFen:options.cashFen??1610000}),initial=createGameRun(input,{origin:'fixture',personalAccountId:'personal',controlledAccountIds:['personal'],economy:createEconomy(ledger),timeline:createTimeline<RunOperation>('2020-01-01'),world,operations:ops,video:video.initial(input.seed),relay:relay.initial(),routines:composition.routine?.initial()??null},versions),scheduled=operations.scheduleOffers(runtime.schedule(initial)),base=createGameRun(input,{origin:'fixture',personalAccountId:'personal',controlledAccountIds:['personal'],economy:scheduled.economy,timeline:scheduled.timeline,world,operations:ops,video:initial.video,relay:initial.relay,routines:initial.routines},versions),registry=createCampaignRegistry(runtime,versions,[...createOperatingHandlers(operations),...createVideoHandlers(video),...createRelayHandlers(relay),...(composition.routine?createRoutineHandlers(composition.routine,versions):[])]),codec=new RunCodec(registry,['technical_employee','content_employee'])
 let current=base;const commands:unknown[]=[];const command=(kind:string,payload:unknown)=>({runId:current.runId,actorId:'player',commandId:`relay-${current.revision}`,expectedRevision:current.revision,kind,payload})
 function send(kind:string,payload:unknown){const c=command(kind,payload),result=evaluateCommand(current,c,registry,'player');if(result.status!=='proposed')throw Error(JSON.stringify({kind,payload,result}));commands.push(c);current=codec.import(codec.export(result.nextRun));return current}
 return {get run(){return current},initial:base,commands,send,preview:(kind:string,payload:unknown)=>previewCommand(current,command(kind,payload),registry,'player'),codec,registry,relay,video,runtime,operations}
}
