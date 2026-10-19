import { createCampaignRun,createCampaignCodec } from '../application/campaign.ts'
import { evaluateCommand,projectRun } from '../core/commands.ts'
import { projectFirstOrder } from '../application/first-order.ts'
export function playNormalMarketQuarter(){
 const codec=createCampaignCodec(),registry=codec.registry,initial=createCampaignRun({runId:'normal-q01-market',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'normal-q01-market-seed'});let run=initial;const commands:unknown[]=[]
 const apply=(kind:string,payload:unknown)=>{const command={runId:run.runId,actorId:'player',commandId:`q01-${run.revision}`,expectedRevision:run.revision,kind,payload};const result=evaluateCommand(run,command,registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify({command,result}));commands.push(command);run=codec.import(codec.export(result.nextRun))}
 apply('WorkQuarter',{});apply('AdvanceTime',{date:'2020-01-02'});apply('ResearchMarket',{definitionId:'market-overview'});apply('AdvanceTime',{date:'2020-01-03'});apply('ResearchMarket',{definitionId:'market-foundation-course'});apply('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen:11988,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-01-10'})
 while(run.timeline.cursor.date!=='2020-03-31'||run.timeline.pause){if(run.timeline.pause?.reason==='CONTENT_DECISION_PENDING'){const instance=run.world?.instances.find(i=>i.openedBy===run.timeline.pause?.instanceId);apply('ChooseEvent',{instanceId:instance?.id,choiceId:'defer'})}else apply('AdvanceTime',{date:'2020-03-31'})}
 return {initial,run,commands,codec,actual:{...projectRun(run).accounts[0],spent:projectRun(run).budget.spent,minimumCashFen:projectFirstOrder(run).minimumCashFen}}
}
