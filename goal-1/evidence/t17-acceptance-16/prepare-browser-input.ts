import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs'

const root=new URL('./',import.meta.url),source=new URL('../t17-acceptance-05/prefix-r1/content_employee-t16-campaign-2/image-studio-open.json',root)
assertBrowserEvidenceWritable(root.pathname)
const text=readFileSync(source,'utf8'),codec=createCampaignCodec(),original=codec.import(text),first=original.receipts[0]!
let run=createCampaignRun({runId:original.runId,actorId:original.actorId,commandId:first.commandId,backgroundId:original.backgroundId,seed:original.seed,playerProfile:original.playerProfile}),before:string|null=null,executed=0
for(const receipt of original.receipts.slice(1)){
 const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}
 if(command.kind==='OpenCourseStudio')before=codec.export(run)
 const result=evaluateCommand(run,command,codec.registry,run.actorId)
 if(result.status!=='proposed')throw Error('ORIGINAL_CREATE_REPLAY_REJECTED')
 run=codec.import(codec.export(result.nextRun));executed++
}
if(codec.export(run)!==text||!before)throw Error('SOURCE_COMPLETE_BYTES_NOT_REPRODUCED')
assertBrowserEvidenceWritable(root.pathname)
writeFileSync(new URL('normal-before-course-studio.json',root),before,{flag:'wx'})
const sha=(s:string)=>createHash('sha256').update(s).digest('hex')
writeFileSync(new URL('normal-before-course-studio-source.json',root),JSON.stringify({source:source.pathname,sourceSha256:sha(text),sourceBytes:Buffer.byteLength(text),fullCreateReplayByteEqual:true,commands:executed,selectedPrefixRevision:codec.import(before).revision,selectedPrefixSha256:sha(before),selectedPrefixBytes:Buffer.byteLength(before),scope:'Original earned prefix immediately before OpenCourseStudio, replayed from Create; no history edit or injected resources.'},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({sourceByteEqual:true,commands:executed,selectedRevision:codec.import(before).revision}))
