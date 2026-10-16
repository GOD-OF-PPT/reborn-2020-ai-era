import { readFileSync,writeFileSync,readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evidenceDirectory } from './evidence-output.ts'
import { playNormalMarketQuarter } from '../src/testing/market-normal-scenario.ts'
import { createMarketFixture,MARKET_FIXTURE,stockOrder } from '../src/testing/market-fixture.ts'
import { accountPosition,metricsFor } from '../src/core/ledger.ts'
import { projectMarket } from '../src/core/market-projection.ts'
import type { GameRun } from '../src/core/run-types.ts'
import type { RunCodec } from '../src/persistence/codec.ts'

const root=fileURLToPath(new URL('../',import.meta.url)),names=['t08-normal-q01','t08-f06-orders','t08-partial-cancel','t08-unknown-price','t08-dividend']
const output=evidenceDirectory(root,'t08-market-evidence.json',names.flatMap(n=>[`${n}-initial.json`,`${n}-final.json`]))
const sha=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex')
const cases:unknown[]=[]
function record(name:string,initial:GameRun,run:GameRun,codec:RunCodec,commands:readonly unknown[],expected:Record<string,unknown>,actual:Record<string,unknown>,scope:string){
 for(const key of Object.keys(expected))if(JSON.stringify(expected[key])!==JSON.stringify(actual[key]))throw new Error(JSON.stringify({name,key,expected,actual}))
 const first=codec.export(initial)+'\n',last=codec.export(run)+'\n';writeFileSync(join(output,`${name}-initial.json`),first);writeFileSync(join(output,`${name}-final.json`),last)
 cases.push({name,origin:run.origin,backgroundId:run.backgroundId,seed:run.seed,versions:run.versions,initial:{file:`${name}-initial.json`,sha256:sha(first)},final:{file:`${name}-final.json`,sha256:sha(last)},commands,expected,actual,scope})
}
const normal=playNormalMarketQuarter();record(names[0],normal.initial,normal.run,normal.codec,normal.commands,{cashFen:2700000,investmentValueFen:1100000,minimumCashFen:1100000,spent:4},normal.actual,'normal_start_no_injection_Q01_distinct_from_UX01_and_S01')
for(const name of names.slice(1)){
 const catalog=name==='t08-partial-cancel'?{...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,overrides:p.overrides.map(o=>({...o,volume:i===0?400:2000}))}))}:name==='t08-unknown-price'?{...MARKET_FIXTURE,checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>({...p,dataAvailable:i===0}))}:name==='t08-dividend'?{...MARKET_FIXTURE,dividends:[{id:'dividend',symbol:'SIM-AI01',recordAt:'2020-01-04',perShareFen:10,paymentDays:1}],checkpoints:MARKET_FIXTURE.checkpoints.map((p,i)=>i===1?{...p,overrides:[]}:p)}:MARKET_FIXTURE
 const f=createMarketFixture(catalog);let run=f.apply(f.run,name==='t08-partial-cancel'?'PlanStockOrder':'PlaceStockOrder',stockOrder());if(name==='t08-partial-cancel')run=f.apply(run,'SubmitStockOrder',{orderId:run.market!.orders[0]!.id,quoteId:'initial-2020-01-01'})
 run=f.apply(run,'AdvanceTime',{date:'2020-01-02'});const intermediate:unknown[]=[]
 if(name==='t08-partial-cancel')run=f.apply(run,'CancelStockOrder',{orderId:run.market!.orders[0]!.id})
 if(name==='t08-f06-orders'){run=f.apply(run,'AdvanceTime',{date:'2020-01-03'});run=f.apply(run,'PlaceStockOrder',stockOrder({side:'sell',quoteId:'p0',limitPriceFen:1200}));run=f.apply(run,'AdvanceTime',{date:'2020-01-04'});intermediate.push({date:'2020-01-04',...accountPosition(run.economy.ledger,'personal')});run=f.apply(run,'AdvanceTime',{date:'2020-01-05'})}
 if(name==='t08-unknown-price')run=f.apply(run,'AdvanceTime',{date:'2020-01-04'})
 if(name==='t08-dividend'){run=f.apply(run,'AdvanceTime',{date:'2020-01-04'});intermediate.push({date:'2020-01-04',...accountPosition(run.economy.ledger,'personal'),market:projectMarket(run,f.market.catalog)});run=f.apply(run,'AdvanceTime',{date:'2020-01-05'})}
 const position=accountPosition(run.economy.ledger,'personal'),market=projectMarket(run,f.market.catalog),metrics=metricsFor(run.economy.ledger,'personal','market:personal');const expected=name==='t08-f06-orders'?{cashFen:2797800,receivableFen:0,investmentValueFen:0,profitFen:197800}:name==='t08-partial-cancel'?{cashFen:2199000,heldFen:0,investmentValueFen:400000}:name==='t08-unknown-price'?{cashFen:1599000,currentValueFen:null,valuationStatus:'data_unavailable'}:{cashFen:1609000,receivableFen:0,investmentValueFen:990000,incomeFen:10000}
 const actual={...position,...metrics,currentValueFen:market?.positions[0]?.valueFen??null,valuationStatus:market?.positions[0]?.valuationStatus??null,market,intermediate}
 record(name,f.run,run,f.codec,f.commands,expected,actual,'explicit_fixture_opens_after_400000_initial_living_cost_cash_2600000_F06_profit_same_as_3000000_ledger_example')
}
function sources(directory:string):string[]{return readdirSync(join(root,directory),{withFileTypes:true}).flatMap(item=>item.isDirectory()?sources(`${directory}/${item.name}`):/\.tsx?$/.test(item.name)?[`${directory}/${item.name}`]:[])}
const paths=[...sources('src'),'scripts/collect_market_evidence.ts','scripts/evidence-output.ts','scripts/validate_content.ts','package.json','package-lock.json','tsconfig.core.json','vitest.config.ts']
writeFileSync(join(output,'t08-market-evidence.json'),JSON.stringify({taskId:'T08',evidenceType:'integration_replay',baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),caseIds:['Q01:normal_orders','Q06','Q07','Q08','Q28','F06','Q19:projection','Q33:atomic_candidate'],reproduceCommand:'npm run evidence:market',sourceHashes:Object.fromEntries(paths.map(path=>[path,sha(readFileSync(join(root,path)))])),cases,notCovered:['S01_complete_half_year','playable_ui','browser_acceptance','real_historical_data_and_rules','full_campaign','original_png','human_playtest']},null,2)+'\n')
console.log(JSON.stringify({file:join(output,'t08-market-evidence.json'),cases:names},null,2))
