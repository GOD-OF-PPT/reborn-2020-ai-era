import {CAMPAIGN_CONTENT} from '../content/campaign.ts'
import {OPERATIONS_CONTENT} from '../content/operations.ts'
import {composeCampaignRuntime,createCampaignRegistry} from '../application/campaign.ts'
import {createOperatingHandlers} from '../application/operations-commands.ts'
import {createVideoHandlers} from '../application/video-commands.ts'
import {createDeepseekHandlers} from '../application/deepseek-commands.ts'
import {createGameRun} from '../core/run.ts'
import {createLedger,applyLedger} from '../core/ledger.ts'
import {createEconomy} from '../core/economy.ts'
import {createTimeline} from '../core/timeline.ts'
import {BOOTSTRAP_VERSIONS} from '../content/bootstrap.ts'
import {hashValue} from '../core/hash.ts'
import {evaluateCommand,previewCommand} from '../core/commands.ts'
import {RunCodec} from '../persistence/codec.ts'
import type {RunOperation} from '../core/content-types.ts'
import type {DeepseekParameters} from '../core/deepseek-schema.ts'
export function createDeepseekFixture(options:{cashFen?:number;seed?:string;parameters?:Partial<DeepseekParameters>;backgroundId?:string}={}){
 const pack={...CAMPAIGN_CONTENT,calendar:[]},catalog={...OPERATIONS_CONTENT,businesses:OPERATIONS_CONTENT.businesses.map(b=>b.id==='ecosystem-service'?{...b,minCashFen:0,monthlyMaintenanceFen:0}:b)},parameters={proposalAcceptBps:10000,deliveryAcceptBps:10000,invitationAuthorityBps:10000,financingConsentBps:10000,negotiationAcceptBps:10000,buyerAcceptBps:10000,governanceAcceptBps:10000,...options.parameters},composition=composeCampaignRuntime(pack,catalog,undefined,true,false,false,false,parameters),{runtime,operations}=composition,deepseek=composition.deepseek!,video=composition.video!
 const input={runId:'deepseek-fixture',actorId:'player',commandId:'fixture-create',backgroundId:options.backgroundId??'technical_employee',seed:options.seed??'deepseek-fixture-v1'},world=runtime.initialWorld([{id:'player',kind:'player',accountId:'personal',businessId:null,route:null,contractId:null,personId:null,capacityUnits:1}],input.backgroundId),ops=operations.initial(input.backgroundId),versions={...BOOTSTRAP_VERSIONS,rulesVersion:'rules-t13-fixture-v1',contentVersion:'deepseek-fixture-v1',contentHash:hashValue({world:runtime.pack,operations:operations.catalog,video:video.catalog,deepseek:deepseek.catalog})},ledger=applyLedger(createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2020-01-01'),{id:'fixture:opening',sourceEventId:'fixture:deepseek',date:'2020-01-01',kind:'opening_cash',accountId:'personal',counterpartyId:'world',amountFen:options.cashFen??300000000}),initial=createGameRun(input,{origin:'fixture',personalAccountId:'personal',controlledAccountIds:['personal'],economy:createEconomy(ledger),timeline:createTimeline<RunOperation>('2020-01-01'),world,operations:ops,video:video.initial(input.seed),deepseek:deepseek.initial()},versions),scheduled=operations.scheduleOffers(runtime.schedule(initial)),base=createGameRun(input,{origin:'fixture',personalAccountId:'personal',controlledAccountIds:['personal'],economy:scheduled.economy,timeline:scheduled.timeline,world,operations:ops,video:initial.video,deepseek:initial.deepseek},versions),registry=createCampaignRegistry(runtime,versions,[...createOperatingHandlers(operations),...createVideoHandlers(video),...createDeepseekHandlers(deepseek)]),codec=new RunCodec(registry,['technical_employee','content_employee'])
 let current=base;const commands:unknown[]=[];const command=(kind:string,payload:unknown)=>({runId:current.runId,actorId:'player',commandId:`deepseek-${current.revision}`,expectedRevision:current.revision,kind,payload})
 function send(kind:string,payload:unknown){const c=command(kind,payload),result=evaluateCommand(current,c,registry,'player');if(result.status!=='proposed')throw Error(JSON.stringify({kind,payload,result}));commands.push(c);current=codec.import(codec.export(result.nextRun));return current}
 return {get run(){return current},initial:base,commands,send,preview:(kind:string,payload:unknown)=>previewCommand(current,command(kind,payload),registry,'player'),codec,registry,deepseek,video,runtime,operations}
}
