import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignRun,createCampaignCodec} from '../../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../../src/core/commands.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const out='goal-1/evidence/t17-acceptance-39/fresh-primary-r64'
const input='goal-1/evidence/t17-acceptance-39/chrome-fresh-mainline-r13/f85-mainrun-life-started15-old-primary-defect.json'
const text=fs.readFileSync(input,'utf8'),codec=createCampaignCodec(),actual=codec.import(text),first=actual.receipts[0]!
if(actual.revision!==15||actual.origin!=='normal')throw Error('ACTUAL_NORMAL_NATIVE15_REQUIRED')
let run=createCampaignRun({runId:actual.runId,actorId:actual.actorId,commandId:first.commandId,backgroundId:actual.backgroundId,seed:actual.seed,playerProfile:actual.playerProfile})
let before:string|null=null
for(const receipt of actual.receipts.slice(1)){
 const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}
 if(receipt.revisionBefore===14)before=codec.export(run)
 const result=evaluateCommand(run,command,codec.registry,actual.actorId)
 if(result.status!=='proposed')throw Error('ACTUAL_PREFIX_REJECTED:'+receipt.commandId)
 run=codec.import(codec.export(result.nextRun))
}
const replayed=codec.export(run)
if(replayed!==text||before===null)throw Error('FULL_NATIVE_CREATE_REPLAY_NOT_EQUAL')
guard(out)
fs.writeFileSync(out+'/model-original-prefix14.json',before,{flag:'wx'})
fs.writeFileSync(out+'/replayed-original15.json',replayed,{flag:'wx'})
fs.writeFileSync(out+'/result.json',JSON.stringify({input,runId:run.runId,creation:'actual Native Home; original full commands replayed unchanged',replayedCommands:actual.receipts.length-1,before14:'model-derived exact original prefix, not a Native14 export',after15:'byte-identical to actual Native15',afterSha256:createHash('sha256').update(replayed).digest('hex'),allByteEqual:true,newNativeCommands:0,compatibility:0},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({runId:run.runId,replayedCommands:actual.receipts.length-1,allByteEqual:true,before14Derived:true,newNativeCommands:0}))
