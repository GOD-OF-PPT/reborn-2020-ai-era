import { expect,it } from 'vitest'
import { createCampaignRun,createCampaignRegistry } from './campaign.ts'
import { evaluateCommand } from '../core/commands.ts'
import { projectCashForecast } from './cash-forecast.ts'
import { canonicalJson } from '../core/identity.ts'

it('forecasts only committed income and spending, without turning an unaccepted first order into money',()=>{
 let run=createCampaignRun({runId:'forecast',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'forecast-seed'})
 const initial=projectCashForecast(run,'personal');expect(initial).toMatchObject({minimumAvailableFen:1800000,earliestGap:null});expect(initial.flows.every(f=>f.amountFen<=0)).toBe(true)
 const registry=createCampaignRegistry(),result=evaluateCommand(run,{runId:run.runId,actorId:'player',commandId:'work',expectedRevision:1,kind:'WorkQuarter',payload:{}},registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify(result));run=result.nextRun
 const before=canonicalJson(run),forecast=projectCashForecast(run,'personal');expect(forecast).toMatchObject({minimumAvailableFen:2600000,earliestGap:null,endingAvailableFen:4200000});expect(forecast.flows.filter(f=>f.amountFen>0).map(f=>f.amountFen)).toEqual([800000,800000,800000]);expect(canonicalJson(run)).toBe(before)
})
