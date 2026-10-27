import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../../src/core/commands.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
const root='goal-1/evidence/t17-acceptance-38/guard-and-reading-r21',codec=createCampaignCodec(),base=readFileSync('goal-1/evidence/t17-acceptance-38/normal-service-r13/technical_employee-before-contract.json','utf8'),last=readFileSync(root+'/normal-end-wait.json','utf8'),final=codec.import(last),sha=(s:string)=>createHash('sha256').update(s).digest('hex')
let run=codec.import(base),eve:string|null=null
if(JSON.stringify(run.receipts)!==JSON.stringify(final.receipts.slice(0,run.receipts.length)))throw Error('ORIGINAL_BASE_PREFIX_REQUIRED')
for(const receipt of final.receipts.slice(run.receipts.length)){
 const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},result=evaluateCommand(run,command,codec.registry,run.actorId)
 if(result.status!=='proposed')throw Error('ORIGINAL_NORMAL_PREFIX_REJECTED')
 run=codec.import(codec.export(result.nextRun));if(run.revision===final.revision-1)eve=codec.export(run)
}
if(!eve||codec.export(run)!==last||codec.import(eve).timeline.cursor.date!=='2025-12-30')throw Error('NORMAL_EVE_OR_FINAL_BYTES_MISMATCH')
guard(root);writeFileSync(root+'/normal-end-eve.json',eve,{flag:'wx'});guard(root);writeFileSync(root+'/end-eve-result.json',JSON.stringify({at:new Date().toISOString(),scope:'Exact replay of the actual normal model branch, not Native',originalEndSha256:sha(last),originalEndByteEqual:true,eveBytes:Buffer.byteLength(eve),eveSha256:sha(eve),newNativeCommands:0,newNativeCreate:0},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({normalEndByteEqual:true,eveDate:'2025-12-30',bytes:Buffer.byteLength(eve)}))
