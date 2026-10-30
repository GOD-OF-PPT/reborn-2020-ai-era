import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
const out='goal-1/evidence/t17-acceptance-40/save-cumulative-r349',native=out+'/native-r352',hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex'),start=Date.now(),reports:any[]=[]
if(fs.existsSync(out+'/stopped.json'))throw Error('ACTIVE_PARENT_REQUIRED')
const before=fs.readFileSync(native+'/actual329-before.json','utf8'),after=fs.readFileSync(native+'/actual330-after-cancel.json','utf8')
if(before!==fs.readFileSync('goal-1/evidence/t17-acceptance-40/save-chain-r348/native-r1/actual329-jun30-writer.json','utf8'))throw Error('ORIGINAL329_CHANGED')
for(const [label,file]of [['original347','goal-1/evidence/t17-acceptance-40/save-chain-r348/snapshot347.json'],['current351',out+'/snapshot351.json']] as const){
 const s=JSON.parse(fs.readFileSync(file,'utf8')),exact=()=>s.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(s.target,r.path)))===r.sha256)
 if(!exact())throw Error('EXACT_SOURCE_REQUIRED')
 const at=(p:string)=>import(pathToFileURL(path.join(s.target,'src',p)).href),[{createCampaignCodec},{evaluateCommand,projectRun},{canonicalJson}]=await Promise.all([at('application/campaign.ts'),at('core/commands.ts'),at('core/identity.ts')]),codec=createCampaignCodec(),original=codec.import(before),actual=codec.import(after)
 if(original.revision!==329||actual.revision!==330||actual.runId!==original.runId||actual.seed!==original.seed||canonicalJson(actual.receipts.slice(0,original.receipts.length))!==canonicalJson(original.receipts)||codec.export(original)!==before||codec.export(actual)!==after)throw Error('ACTUAL_ORIGINAL_PREFIX_OR_CANONICAL_CHANGED')
 const last=actual.receipts.at(-1),command={...JSON.parse(last.payloadSignature),commandId:last.commandId,expectedRevision:last.revisionBefore},t=Date.now()
 console.log(JSON.stringify({phase:'native330-audit',label,command}))
 if(label==='original347'){
  const result=evaluateCommand(original,command,codec.registry,original.actorId)
  if(result.status!=='proposed'||codec.export(result.nextRun)!==after)throw Error('WHOLE_ORIGINAL347_RESULT_CHANGED')
 }
 const view=projectRun(actual)
 reports.push({label,source:s.target,sourceRows:s.files.length,sourceExact:exact(),command,oldSourceActualCommandReplayed:label==='original347',current351Authority:'actual Chrome save plus exact canonical codec readback; no duplicate replay',allOriginalAndCurrentCanonicalWireBytesEqual:true,afterBytes:Buffer.byteLength(after),afterSha256:hash(after),date:view.date,budget:view.budget,accounts:view.accounts,wallMs:Date.now()-t})
}
fs.writeFileSync(out+'/native330-audit.json',JSON.stringify({at:new Date().toISOString(),reports,wallMs:Date.now()-start,newAuthorSavedCommands:0,actualNewNativeCommands:1,fullCreateNotRerun:true,scope:'Actual original329 to native330, exact original347 replay and current351 canonical readback; not Native fault injection, full Create or human',compatibility:0,wholeU6Complete:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase:'complete',allWireBytesEqual:true,wallMs:Date.now()-start}))
