import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {hashValue} from '../../../src/core/hash.ts'
const root=process.cwd(),dir=join(root,'goal-1/evidence/t15-native-followup-01'),sha=v=>createHash('sha256').update(v).digest('hex'),codec=createCampaignCodec(),report=JSON.parse(readFileSync(join(dir,'native-navigation-probe.json'),'utf8')),freeze=JSON.parse(readFileSync(join(root,'goal-1/evidence/t15-native-r3-source-freeze.json'),'utf8'))
function check(ok,message){if(!ok)throw Error(message)}
for(const [file,hash] of Object.entries(freeze.sha256))check(sha(readFileSync(join(root,file)))===hash,'SOURCE_CHANGED:'+file)
const cases=[]
for(const artifact of report.exports){
 const raw=readFileSync(join(dir,artifact.file),'utf8');check(sha(raw)===artifact.sha256,'EXPORT_CHANGED')
 const final=codec.import(raw),creation=final.receipts[0];check(final.origin==='normal'&&creation.kind==='CreateRun','NORMAL_PREFIX_REQUIRED')
 let run=createCampaignRun({runId:final.runId,actorId:final.actorId,commandId:creation.commandId,backgroundId:final.backgroundId,seed:final.seed,playerProfile:final.playerProfile})
 check(hashValue(run.receipts[0])===hashValue(creation),'CREATION_MISMATCH')
 const commands=[]
 for(const receipt of final.receipts.slice(1)){
  const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},result=evaluateCommand(run,command,codec.registry,run.actorId)
  check(result.status==='proposed','COMMAND_NOT_PROPOSED');run=result.nextRun;commands.push(command)
 }
 check(codec.export(run)===raw&&codec.export(final)===raw,'NORMAL_PREFIX_NOT_BYTE_EQUAL')
 cases.push({file:artifact.file,runId:run.runId,revision:run.revision,sha256:sha(raw),commands,result:'BYTE_EQUAL'})
}
check(report.exports[1].sha256===report.exports[2].sha256&&report.exports[1].sha256===report.exports[3].sha256,'CANDIDATE_CHANGED_AFTER_NAVIGATION_OR_RETRY')
const artifacts=readdirSync(dir).filter(f=>!['replay-audit.json'].includes(f)).map(file=>({file,sha256:sha(readFileSync(join(dir,file)))}))
const result={scope:'new navigation probe export replay and artifact integrity only; native environment gates remain unverified',result:'FOUR_EXPORTS_FULL_PREFIX_BYTE_EQUAL',baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reproduceCommand:'rtk proxy node --experimental-strip-types goal-1/evidence/t15-native-followup-01/replay-probe.mjs',sourceFreeze:'t15-native-r3-source-freeze.json',sourceUnchanged:true,cases,artifacts,nativeAcceptanceComplete:false,pending:report.pending}
writeFileSync(join(dir,'replay-audit.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({exports:cases.length,fullPrefixByteEqual:true,sourceUnchanged:true,nativeAcceptanceComplete:false,pending:report.pending}))
