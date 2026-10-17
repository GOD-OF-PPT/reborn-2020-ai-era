import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {join,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from './evidence-output.ts'
import {createCampaignCodec,createCampaignRun} from '../src/application/campaign.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {hashValue} from '../src/core/hash.ts'
import type {GameRun} from '../src/core/run-types.ts'
const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'goal-1/evidence'),output=evidenceDirectory(root,'t14-browser-replay-audit.json'),sha=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex'),codec=createCampaignCodec()
const report=JSON.parse(readFileSync(join(input,'t14-browser-native.json'),'utf8')) as {exports:{file:string;role:string;sha256:string}[];checks:{id:string;pass:boolean}[];checksJournal:string;inputs:{file:string;sha256:string}[];equalPairs:[string,string][];iterationJournal?:string;iterationJournalHash?:string}
if(!report.exports.length||!report.checks.length||report.checks.some(c=>!c.pass))throw Error('INCOMPLETE_NATIVE_REPORT')
if(report.checksJournal!=='t14-browser-checks.jsonl')throw Error('INVALID_NATIVE_JOURNAL_PATH')
const journal=readFileSync(join(input,report.checksJournal),'utf8').trim().split('\n').map(line=>JSON.parse(line));if(hashValue(journal)!==hashValue(report.checks))throw Error('NATIVE_CHECK_JOURNAL_MISMATCH')
if(report.iterationJournal){if(report.iterationJournal!=='t14-browser-candidate-checks.jsonl')throw Error('INVALID_NATIVE_ITERATION_JOURNAL');const raw=readFileSync(join(input,report.iterationJournal),'utf8');if(sha(raw)!==report.iterationJournalHash)throw Error('NATIVE_ITERATION_JOURNAL_CHANGED');const latest=new Map<string,unknown>();for(const line of raw.trim().split('\n')){const row=JSON.parse(line);latest.set(row.id,row)}if(hashValue([...latest.values()])!==hashValue(report.checks))throw Error('FINAL_NATIVE_CHECKS_NOT_ACTUAL_LATEST_OBSERVATIONS')}
const inputRuns=report.inputs.map(item=>{
 if(isAbsolute(item.file)||item.file.split('/').some(p=>p==='..')||!item.file.endsWith('.json'))throw Error('INVALID_NATIVE_INPUT_PATH')
 const raw=readFileSync(join(input,item.file),'utf8');if(sha(raw)!==item.sha256)throw Error('NATIVE_INPUT_SOURCE_MISMATCH')
 const run=codec.import(raw);if(run.origin!=='normal')throw Error('NORMAL_INPUT_REQUIRED');return {file:item.file,run}
})
const cache=new Map<string,GameRun>(),cases=[];let evaluated=0
for(const item of report.exports){
 if(!/^t14-browser-[a-z0-9-]+\.json$/.test(item.file))throw Error('INVALID_NATIVE_EXPORT_PATH')
 const raw=readFileSync(join(input,item.file),'utf8');if(sha(raw)!==item.sha256)throw Error('NATIVE_EXPORT_HASH_MISMATCH')
 const final=codec.import(raw),creation=final.receipts[0]!;if(final.origin!=='normal'||creation.kind!=='CreateRun')throw Error('NORMAL_PREHISTORY_REQUIRED')
 let prefix=hashValue([creation.payloadSignature,creation.commandId,final.versions]),run=cache.get(prefix)
 if(!run){run=createCampaignRun({runId:final.runId,actorId:final.actorId,commandId:creation.commandId,backgroundId:final.backgroundId,seed:final.seed,playerProfile:final.playerProfile});if(run.receipts[0]!.payloadSignature!==creation.payloadSignature)throw Error('INITIAL_CONTRACT_MISMATCH');cache.set(prefix,run)}
 const commands=[]
 for(const receipt of final.receipts.slice(1)){
  const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},nextPrefix=hashValue([prefix,command]),cached=cache.get(nextPrefix)
  if(cached)run=cached;else{const result=evaluateCommand(run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify({file:item.file,command,result}));run=result.nextRun;cache.set(nextPrefix,run);evaluated++}
  prefix=nextPrefix;commands.push(command)
 }
 const replay=codec.export(run);if(replay!==raw||replay!==codec.export(final))throw Error('NATIVE_REPLAY_CHANGED:'+item.file)
 cases.push({file:item.file,role:item.role,origin:final.origin,seed:final.seed,versions:final.versions,commands,expectedStateHash:sha(raw),actualReplayHash:sha(replay),result:'PASS'})
}
const inputs=inputRuns.map(({file,run})=>{const canonical=codec.export(run),found=[...cache.values()].some(r=>r.runId===run.runId&&r.revision===run.revision&&codec.export(r)===canonical);if(!found)throw Error('INPUT_NOT_IDENTICAL_REPLAY_PREFIX:'+file);return {file,revision:run.revision,normalCommandPrefixByteEqual:true}})
const equality=report.equalPairs.map(([first,last])=>{if(!report.exports.some(e=>e.file===first)||!report.exports.some(e=>e.file===last)||readFileSync(join(input,first),'utf8')!==readFileSync(join(input,last),'utf8'))throw Error('NATIVE_RETRY_OR_RELOAD_CHANGED');return {first,last,byteEqual:true}})
function sources(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(i=>i.isDirectory()?sources(`${dir}/${i.name}`):/\.(tsx?|css)$/.test(i.name)?[`${dir}/${i.name}`]:[])}
const paths=[...sources('src'),'scripts/verify_story_browser_evidence.ts','scripts/collect_story_evidence.ts','scripts/evidence-output.ts','package.json','package-lock.json','index.html','vitest.config.ts','tsconfig.core.json']
writeFileSync(join(output,'t14-browser-replay-audit.json'),JSON.stringify({taskId:'T14',evidenceType:'audit_of_actual_UI_exports_with_normal_engine_prehistory',baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),reproduceCommand:'rtk proxy node --experimental-strip-types scripts/verify_story_browser_evidence.ts --output-dir <fresh-directory>',nativeChecks:report.checks.length,journalMatched:true,inputs,cachePolicy:'Only identical complete command prefixes keyed by creation/versions and every full envelope reuse immutable evaluated state. Every final export is compared byte for byte. Inputs must match an actual replay prefix.',nativeReportHash:sha(readFileSync(join(input,'t14-browser-native.json'))),sourceHashes:Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))])),evaluatedUniqueCommands:evaluated,cases,equality,notCovered:['native_full_2020_prehistory_for_imported_late_routes','native200percent_zoom','complete_person_life_interface','human_playtest','original_three_png','full_campaign_and_Q_X_acceptance']},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({cases:cases.length,inputs:inputs.length,equality:equality.length,evaluatedUniqueCommands:evaluated,result:'PASS'},null,2))
