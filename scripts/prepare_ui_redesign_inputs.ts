import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignCodec,createCampaignRun} from '../src/application/campaign.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {evidenceDirectory} from './evidence-output.ts'
import {fileURLToPath} from 'node:url'
import {join} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)),output=evidenceDirectory(root,'d02-inputs.json'),codec=createCampaignCodec(),sha=(s:string)=>createHash('sha256').update(s).digest('hex')
const requested=[{source:'goal-1/evidence/t13-reviewed/regression/course/t11-s02-technical_employee-final.json',revision:73,name:'d02-input-course.json'},{source:'goal-1/evidence/t13-reviewed/regression/video/t10-video-technical_employee-final.json',revision:62,name:'d02-input-video.json'}],inputs=[]
mkdirSync(output,{recursive:true})
for(const item of requested){
 const raw=readFileSync(join(root,item.source),'utf8'),target=codec.import(raw),creation=target.receipts[0]!
 if(target.origin!=='normal'||creation.kind!=='CreateRun')throw Error('NORMAL_SOURCE_REQUIRED')
 let run=createCampaignRun({runId:target.runId,actorId:target.actorId,commandId:creation.commandId,backgroundId:target.backgroundId,seed:target.seed,playerProfile:target.playerProfile}),prefix=''
 for(const receipt of target.receipts.slice(1)){
  if(run.revision===item.revision)prefix=codec.export(run)
  const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},result=evaluateCommand(run,command,codec.registry,run.actorId)
  if(result.status!=='proposed')throw Error('SOURCE_REPLAY_FAILED:'+receipt.commandId)
  run=result.nextRun
 }
 if(codec.export(run)!==codec.export(target)||!prefix)throw Error('SOURCE_FINAL_MISMATCH')
 writeFileSync(join(output,item.name),prefix,{flag:'wx'});inputs.push({...item,sourceSha256:sha(raw),sha256:sha(prefix),normalEnginePrehistory:true,sourceFinalReplayByteEqual:true})
}
writeFileSync(join(output,'d02-inputs.json'),JSON.stringify({taskId:'D02',scope:'Exact normal command prefix replay; no editing funds, dates, permissions or schema. Prehistory is engine, subsequent actions require native UI.',inputs},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({inputs:inputs.length,result:'PASS'}))
