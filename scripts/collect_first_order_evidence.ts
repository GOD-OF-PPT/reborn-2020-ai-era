import { readFileSync,writeFileSync,readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evidenceDirectory } from './evidence-output.ts'
import { createCampaignRun,createCampaignCodec } from '../src/application/campaign.ts'
import { projectFirstOrder } from '../src/application/first-order.ts'
import { FIRST_ORDER } from '../src/content/first-order.ts'
import { evaluateCommand } from '../src/core/commands.ts'

const root=fileURLToPath(new URL('../',import.meta.url)),names=['t07-technical-success','t07-content-success','t07-declined','t07-skipped','t07-expired','t07-interrupted','t07-unsubmitted']
const output=evidenceDirectory(root,'t07-first-order-evidence.json',names.flatMap(name=>[`${name}-initial.json`,`${name}-final.json`]))
const sha=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex')
const cases=[]
for(const name of names){const backgroundId=name==='t07-content-success'?'content_employee':'technical_employee',success=name.endsWith('success');const codec=createCampaignCodec(),registry=codec.registry;const initial=createCampaignRun({runId:name,actorId:'player',commandId:'create',seed:`${name}-seed`,backgroundId});let run=initial;const commands=[]
 const apply=(kind:string,payload:unknown)=>{const command={runId:run.runId,actorId:'player',commandId:`${name}-${run.revision}`,expectedRevision:run.revision,kind,payload};const result=evaluateCommand(run,command,registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify({name,result,command}));commands.push(command);run=codec.import(codec.export(result.nextRun))}
 apply('WorkQuarter',{})
 if(success||name==='t07-interrupted'||name==='t07-unsubmitted'){apply('StartFirstOrder',{});if(name==='t07-interrupted'){apply('AdvanceTime',{date:'2020-01-10'});const view=projectFirstOrder(run);apply('InterruptJob',{jobId:view.jobId});apply('CancelContract',{contractId:view.contractId})}else {apply('AdvanceTime',{date:success?'2020-01-19':'2020-01-20'});const view=projectFirstOrder(run);if(success){apply('SubmitDelivery',{contractId:view.contractId});apply('AdvanceTime',{date:'2020-01-20'})}else apply('CancelContract',{contractId:view.contractId})}}
 else if(name!=='t07-expired')apply(name==='t07-declined'?'DeclineOffer':'SkipOffer',{offerId:FIRST_ORDER.id})
 while(run.timeline.cursor.date!=='2020-03-31'||run.timeline.pause){if(run.timeline.pause?.reason==='CONTENT_DECISION_PENDING'){const instance=run.world?.instances.find(i=>i.openedBy===run.timeline.pause?.instanceId);apply('ChooseEvent',{instanceId:instance?.id,choiceId:success&&instance?.definitionId==='PREP-CASE'?'prepare':'defer'})}else apply('AdvanceTime',{date:'2020-03-31'})}
 const view=projectFirstOrder(run);const expected={cashFen:success?(backgroundId==='technical_employee'?4280000:3680000):(name==='t07-interrupted'||name==='t07-unsubmitted'?4150000:4200000),minimumCashFen:success||name==='t07-interrupted'||name==='t07-unsubmitted'?2550000:2600000,paymentFen:success?130000:0,directCostFen:success||name==='t07-interrupted'||name==='t07-unsubmitted'?50000:0,paidCaseAvailable:success,spent:success?4:name==='t07-interrupted'||name==='t07-unsubmitted'?3:2}
 if(view.cashFen!==expected.cashFen||view.minimumCashFen!==expected.minimumCashFen||view.result.paymentFen!==expected.paymentFen||view.result.directCostFen!==expected.directCostFen||view.paidCaseAvailable!==expected.paidCaseAvailable||view.budget.spent!==expected.spent)throw new Error(JSON.stringify({name,expected,view}))
 const first=codec.export(initial)+'\n',last=codec.export(run)+'\n';writeFileSync(join(output,`${name}-initial.json`),first);writeFileSync(join(output,`${name}-final.json`),last)
 cases.push({name,origin:run.origin,backgroundId,seed:run.seed,versions:run.versions,initial:{file:`${name}-initial.json`,sha256:sha(first)},final:{file:`${name}-final.json`,sha256:sha(last)},commands,expected,actual:view,scope:'normal_start_first_quarter_not_full_campaign_or_browser_acceptance'})
}
function sources(directory:string):string[]{return readdirSync(join(root,directory),{withFileTypes:true}).flatMap(item=>item.isDirectory()?sources(`${directory}/${item.name}`):/\.tsx?$/.test(item.name)?[`${directory}/${item.name}`]:[])}
const paths=[...sources('src'),'scripts/collect_first_order_evidence.ts','scripts/evidence-output.ts','scripts/validate_content.ts','package.json','package-lock.json','tsconfig.core.json','vitest.config.ts']
writeFileSync(join(output,'t07-first-order-evidence.json'),JSON.stringify({taskId:'T07',evidenceType:'integration_replay',baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),caseIds:['UX01','BG-CONTENT-Q1-ORDER','X01:manual_order','X02:free_decline','Q04:dedupe','Q19:projection','Q33:failed_candidate','Q40:offer_default'],reproduceCommand:'npm run evidence:first-order',sourceHashes:Object.fromEntries(paths.map(path=>[path,sha(readFileSync(join(root,path)))])),cases,notCovered:['market_matching','S01_complete_half_year','playable_ui','browser_acceptance','video_rework','full_campaign','original_png','human_playtest']},null,2)+'\n')
console.log(JSON.stringify({file:join(output,'t07-first-order-evidence.json'),cases:cases.map(c=>({name:c.name,commands:c.commands.length,actualCashFen:c.actual.cashFen,minimumCashFen:c.actual.minimumCashFen,paymentFen:c.actual.result.paymentFen}))},null,2))
