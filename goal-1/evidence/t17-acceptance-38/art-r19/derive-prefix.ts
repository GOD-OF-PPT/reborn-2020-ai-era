import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignRun,createCampaignCodec} from '../../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../../src/core/commands.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const root='goal-1/evidence/t17-acceptance-38/art-r19',input='goal-1/evidence/t17-acceptance-38/chrome-deployment-r18/u5-r18-14-new81-full-deployment-collected-and-real-improved-room.json',raw=readFileSync(input,'utf8'),codec=createCampaignCodec(),original=codec.import(raw),sha=(s:string)=>createHash('sha256').update(s).digest('hex'),driverHash=sha(readFileSync(root+'/derive-prefix.ts','utf8'))
const first=original.receipts[0]!,outputs=new Map<number,string>()
let run=createCampaignRun({runId:original.runId,actorId:original.actorId,commandId:first.commandId,backgroundId:original.backgroundId,seed:original.seed,playerProfile:original.playerProfile}),commands=0
for(const receipt of original.receipts.slice(1)){
 const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},result=evaluateCommand(run,command,codec.registry,original.actorId)
 if(result.status!=='proposed')throw Error('ORIGINAL_PREFIX_REJECTED:'+receipt.commandId)
 run=codec.import(codec.export(result.nextRun));commands++
 if(run.revision===74||run.revision===75)outputs.set(run.revision,codec.export(run))
}
if(codec.export(run)!==raw||outputs.size!==2||sha(readFileSync(root+'/derive-prefix.ts','utf8'))!==driverHash)throw Error('ORIGINAL81_NOT_BYTE_EQUAL_OR_DRIVER_CHANGED')
const rows=[]
for(const [revision,text]of outputs){
 const file='replayed-original-native-prefix'+revision+'.json',row={file,origin:'reconstructed_normal_prefix_not_physical',source:'Intermediate of exact full Create replay of original physical81; no seed/params/grant changes; not direct physical export or new Native command',runId:run.runId,revision,bytes:Buffer.byteLength(text),sha256:sha(text)}
 guard(root);writeFileSync(root+'/'+file,text,{flag:'wx'});guard(root);writeFileSync(root+'/exports.jsonl',JSON.stringify(row)+'\n',{flag:'a'});rows.push(row)
}
guard(root);writeFileSync(root+'/replay-result.json',JSON.stringify({at:new Date().toISOString(),scope:'Original full Create byte-exact prefix reconstruction for current art verification; not new Native creation or physical74/75 readback',input,originalBytes:Buffer.byteLength(raw),originalSha256:sha(raw),final81ByteEqual:true,executedCommands:commands,driverHash,newNativeCreate:0,newNativeCommands:0,rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({final81ByteEqual:true,executedCommands:commands,reconstructed:[...outputs.keys()],newNativeCommands:0}))
