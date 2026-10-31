import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'

const root='goal-1/evidence/t17-acceptance-40/interaction-runtime-r354',native=root+'/native-r1',hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex'),started=Date.now(),reports:any[]=[]
if(fs.existsSync(root+'/stopped.json')||fs.existsSync(native+'/stopped.json'))throw Error('ACTIVE_PRODUCER_REQUIRED')
const before=fs.readFileSync(native+'/actual330-before.json','utf8'),after=fs.readFileSync(native+'/actual333-after.json','utf8'),backup=fs.readFileSync(native+'/actual332-backup.json','utf8')
if(hash(before)!=='e2c4fb73c8012ced2b4602c1b347287c34baf97fe519e3276553a3aeed079b33'||hash(after)!=='81fd365fd9113d43ebf7a940db98f5365537c0c3cb42d37a4e89ce80615d90dc')throw Error('EXACT_ACTUAL_NATIVE_INPUTS_REQUIRED')
for(const [label,file] of [['original351','goal-1/evidence/t17-acceptance-40/save-cumulative-r349/snapshot351.json'],['final371',root+'/snapshot371.json']] as const){
 const source=JSON.parse(fs.readFileSync(file,'utf8')),exact=()=>source.files.every((row:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
 if(!exact())throw Error('EXACT_FROZEN_SOURCE_REQUIRED')
 const at=(name:string)=>import(pathToFileURL(path.join(source.target,'src',name)).href)
 const [{createCampaignCodec},{evaluateCommand,projectRun},{canonicalJson}]=await Promise.all([at('application/campaign.ts'),at('core/commands.ts'),at('core/identity.ts')]),codec=createCampaignCodec(),old=codec.import(before),actual=codec.import(after),previous=codec.import(backup)
 if(old.revision!==330||actual.revision!==333||previous.revision!==332||actual.runId!==old.runId||actual.seed!==old.seed||canonicalJson(actual.receipts.slice(0,old.receipts.length))!==canonicalJson(old.receipts)||codec.export(old)!==before||codec.export(actual)!==after||codec.export(previous)!==backup)throw Error('ORIGINAL_PREFIX_OR_CANONICAL_WIRE_CHANGED')
 const receipts=actual.receipts.slice(old.receipts.length),commands=receipts.map((receipt:any)=>({...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}))
 if(commands.length!==3||commands.some((command:any)=>command.kind!=='AdvanceTime'))throw Error('EXACT_THREE_ACTUAL_TIME_COMMANDS_REQUIRED')
 if(label==='original351'){
  let run=old
  for(const command of commands){
   console.log(JSON.stringify({phase:'original-native-suffix',command}))
   const result=evaluateCommand(run,command,codec.registry,old.actorId)
   if(result.status!=='proposed')throw Error('ORIGINAL_COMMAND_REFUSED')
   run=result.nextRun
   if(run.revision===332&&codec.export(run)!==backup)throw Error('WHOLE_ACTUAL_BACKUP_CHANGED')
  }
  if(codec.export(run)!==after)throw Error('WHOLE_ACTUAL_NATIVE_RESULT_CHANGED')
 }
 const view=projectRun(actual)
 reports.push({label,source:source.target,sourceRows:source.files.length,sourceExact:exact(),commands,originalSuffixReplayed:label==='original351',canonicalWireAndOriginalPrefixExact:true,backup332Exact:true,actual333:{bytes:Buffer.byteLength(after),sha256:hash(after),date:view.date,budget:view.budget,accounts:view.accounts}})
}
fs.writeFileSync(root+'/native333-audit.json',JSON.stringify({at:new Date().toISOString(),wallMs:Date.now()-started,reports,actualNativeCommands:3,newAuthorSavedCommands:0,newImports:0,fullCreateNotRerun:true,notNativeFaultInjection:true,notPerformanceAcceptance:true,compatibility:0,wholeU6Complete:false},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({phase:'complete',originalSuffixAndFullWireExact:true,wallMs:Date.now()-started}))
