import { readFileSync,writeFileSync,readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evidenceDirectory } from './evidence-output.ts'
import { playNormalInvestmentHalfYear } from '../src/testing/playable-scenarios.ts'
import { createCampaignCodec } from '../src/application/campaign.ts'

const root=fileURLToPath(new URL('../',import.meta.url)),profiles=['technical_employee','content_employee'],names=profiles.flatMap(id=>['initial','quarter','final'].map(stage=>`t09-s01-${id}-${stage}.json`)),output=evidenceDirectory(root,'t09-playable-evidence.json',names)
const sha=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex'),cases=[]
for(const profile of profiles){const result=await playNormalInvestmentHalfYear(profile),codec=createCampaignCodec(),snapshots:Record<string,{file:string;sha256:string}>={}
 for(const [stage,run] of Object.entries({initial:result.initial,quarter:result.quarterSave,final:result.final})){const name=`t09-s01-${profile}-${stage}.json`,text=codec.export(run)+'\n';writeFileSync(join(output,name),text);snapshots[stage]={file:name,sha256:sha(text)}}
 const expected={quarterCashFen:profile==='technical_employee'?2700000:2100000,quarterInvestmentFen:1100000,quarterMinimumFen:1100000,quarterSpent:4,halfYearCashFen:profile==='technical_employee'?3900000:2700000,halfYearShares:100,halfYearQuarterSpent:2,salaryPayments:6,marketPoints:18}
 const actual={quarterCashFen:result.quarter.cashFen,quarterInvestmentFen:result.quarter.investmentValueFen,quarterMinimumFen:result.quarter.minimumCashFen,quarterSpent:result.quarter.spent,halfYearCashFen:result.actual.cashFen,halfYearShares:result.actual.quantity,halfYearQuarterSpent:result.actual.quarterSpent,salaryPayments:result.actual.salaryPayments,marketPoints:result.actual.marketPoints}
 if(JSON.stringify(expected)!==JSON.stringify(actual)||result.final.origin!=='normal')throw new Error(JSON.stringify({profile,expected,actual}))
 cases.push({name:`S01-${profile}`,origin:result.final.origin,seed:result.seed,versions:result.versions,snapshots,commands:result.commands,expected,actual,rejections:result.rejections,boundary:result.boundary,scope:'normal_committed_controller_and_IDB_adapter_not_native_browser_or_full_campaign'})
}
function sources(directory:string):string[]{return readdirSync(join(root,directory),{withFileTypes:true}).flatMap(item=>item.isDirectory()?sources(`${directory}/${item.name}`):/\.(tsx?|css)$/.test(item.name)?[`${directory}/${item.name}`]:[])}
const paths=[...sources('src'),'scripts/collect_playable_evidence.ts','scripts/evidence-output.ts','scripts/validate_content.ts','index.html','package.json','package-lock.json','vitest.config.ts','tsconfig.core.json']
writeFileSync(join(output,'t09-playable-evidence.json'),JSON.stringify({taskId:'T09',checkpointId:'C09',evidenceType:'integration_replay',baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),caseIds:['S01','Q01','Q02','Q03','Q06','Q08','Q19','Q30','X02'],reproduceCommand:'npm run evidence:playable',sourceHashes:Object.fromEntries(paths.map(path=>[path,sha(readFileSync(join(root,path)))])),cases,notCovered:['full_business_routes','full_campaign','native_popup_visual_confirmation','real_browser_200_percent_zoom','original_png','human_playtest']},null,2)+'\n')
console.log(JSON.stringify({file:join(output,'t09-playable-evidence.json'),cases:cases.map(c=>({name:c.name,commands:c.commands.length,actual:c.actual}))},null,2))
