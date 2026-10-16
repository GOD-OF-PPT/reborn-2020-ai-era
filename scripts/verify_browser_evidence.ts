import { readFileSync,writeFileSync,readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evidenceDirectory } from './evidence-output.ts'
import { createCampaignCodec } from '../src/application/campaign.ts'
import { evaluateCommand } from '../src/core/commands.ts'

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'goal-1/evidence'),output=evidenceDirectory(root,'t09-browser-replay-audit.json'),codec=createCampaignCodec(),sha=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex')
const pairs=[['technical-initial','technical-final'],['content-initial','content-final'],['investment-initial','investment-quarter'],['investment-initial','investment-final'],['content-investment-initial','content-investment-final'],['fault-old','fault-candidate'],['fault-old','fault-retried'],['income-old','income-candidate'],['income-old','income-retried'],['production-initial','production-final'],['production-initial','production-current'],['recovery-initial','recovery-gap'],['recovery-initial','recovery-deferred'],['recovery-initial','recovery-final']]
const cases=[]
for(const [first,last] of pairs){const firstFile=`t09-browser-${first}.json`,lastFile=`t09-browser-${last}.json`,firstText=readFileSync(join(input,firstFile),'utf8'),lastText=readFileSync(join(input,lastFile),'utf8');let run=codec.import(firstText);const final=codec.import(lastText),commands=[]
 if(run.runId!==final.runId)throw new Error('BROWSER_RUN_ID_MISMATCH')
 for(const receipt of final.receipts.slice(run.revision)){const identity=JSON.parse(receipt.payloadSignature),command={...identity,commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},result=evaluateCommand(run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw new Error(JSON.stringify({first,last,command,result}));commands.push(command);run=result.nextRun}
 const replay=codec.export(run),expected=codec.export(final);if(replay!==expected)throw new Error(`BROWSER_REPLAY_MISMATCH:${last}`)
 cases.push({name:last,initial:{file:firstFile,sha256:sha(firstText)},final:{file:lastFile,sha256:sha(lastText)},versions:run.versions,seed:run.seed,origin:run.origin,commands,expectedStateHash:sha(expected),actualReplayHash:sha(replay),result:'PASS',scope:'audit_of_actual_UI_exported_commands_not_a_replacement_for_browser_interaction'})
}
function sources(directory:string):string[]{return readdirSync(join(root,directory),{withFileTypes:true}).flatMap(item=>item.isDirectory()?sources(`${directory}/${item.name}`):/\.(tsx?|css)$/.test(item.name)?[`${directory}/${item.name}`]:[])}
const paths=[...sources('src'),'scripts/verify_browser_evidence.ts','scripts/evidence-output.ts','index.html','package.json','package-lock.json','vitest.config.ts','tsconfig.core.json']
writeFileSync(join(output,'t09-browser-replay-audit.json'),JSON.stringify({taskId:'T09',checkpointId:'C09',evidenceType:'browser_export_replay_audit',baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),reproduceCommand:'npm run evidence:browser-audit',sourceHashes:Object.fromEntries(paths.map(path=>[path,sha(readFileSync(join(root,path)))])),cases,notCovered:['human_playtest','real_browser_200_percent_zoom','native_beforeunload_popup_visual_confirmation','full_campaign']},null,2)+'\n')
console.log(JSON.stringify({cases:cases.length,result:'PASS',file:join(output,'t09-browser-replay-audit.json')},null,2))
