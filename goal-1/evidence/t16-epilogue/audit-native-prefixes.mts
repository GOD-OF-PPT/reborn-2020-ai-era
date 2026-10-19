import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {join,basename} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {hashValue} from '../../../src/core/hash.ts'
import {canonicalJson} from '../../../src/core/identity.ts'
import type {GameRun} from '../../../src/core/run-types.ts'

if(existsSync(new URL('./sealed-evidence.json',import.meta.url)))throw Error('EVIDENCE_SEALED_USE_NEW_ROOT')
const root=fileURLToPath(new URL('../../../',import.meta.url)),here=fileURLToPath(new URL('./',import.meta.url)),suffix=process.argv[2]
if(!suffix||!/^a[0-9]+$/.test(suffix))throw Error('USE_FRESH_AUDIT_SUFFIX')
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex'),codec=createCampaignCodec()
function paths(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?paths(dir+'/'+d.name):/\.ts$/.test(d.name)&&!d.name.includes('.test.')?[dir+'/'+d.name]:[])}
const frozen=Object.fromEntries([...paths('src/core'),...paths('src/application'),...paths('src/content'),...paths('src/persistence'),'goal-1/evidence/t16-epilogue/audit-native-prefixes.mts'].map(p=>[p,sha(readFileSync(join(root,p)))]))
type Node={run:GameRun;raw:string;commandText:string;children:Map<string,Node>}
const trees=new Map<string,Node>(),records:unknown[]=[];let executed=0
for(const name of readdirSync(here,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name.startsWith('chrome-')).map(d=>d.name)){
 const folder=join(here,name),journal=join(folder,'exports.jsonl');let lines:string
 try{lines=readFileSync(journal,'utf8')}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')continue;throw error}
 for(const line of lines.trim().split('\n').filter(Boolean)){
  const row=JSON.parse(line),file=String(row.file);if(basename(file)!==file)throw Error('INVALID_EXPORT_FILE')
  const text=readFileSync(join(folder,file),'utf8');if(sha(text)!==row.sha256||Buffer.byteLength(text)!==row.bytes)throw Error('RECORDED_EXPORT_BYTES_MISMATCH')
  const run=codec.import(text);if(run.origin!=='normal')throw Error('NATIVE_AUDIT_REQUIRES_NORMAL_ORIGIN')
  const first=run.receipts[0]!,identity=hashValue({createId:first.commandId,createSignature:first.payloadSignature,versions:run.versions}),creationText=canonicalJson({signature:first.payloadSignature,commandId:first.commandId,versions:run.versions})
  let node=trees.get(identity)
  if(!node){const initial=createCampaignRun({runId:run.runId,actorId:run.actorId,commandId:first.commandId,backgroundId:run.backgroundId,seed:run.seed,playerProfile:run.playerProfile}),raw=codec.export(initial);node={run:codec.import(raw),raw,commandText:creationText,children:new Map()};trees.set(identity,node)}
  if(node.commandText!==creationText)throw Error('CREATION_IDENTITY_COLLISION')
  for(const receipt of run.receipts.slice(1)){
   const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},commandText=canonicalJson(command),key=hashValue(command),cached=node.children.get(key)
   if(cached){if(cached.commandText!==commandText||codec.export(cached.run)!==cached.raw)throw Error('MUTATED_OR_MISMATCHED_EARNED_PREFIX');node=cached;continue}
   const result=evaluateCommand(node.run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error('FULL_NORMAL_PREFIX_REJECTED:'+JSON.stringify({file,receipt:receipt.commandId,result}))
   const raw=codec.export(result.nextRun),next:Node={run:codec.import(raw),raw,commandText,children:new Map()};node.children.set(key,next);node=next;executed++
  }
  if(node.raw!==text)throw Error('FULL_CREATE_PREFIX_BYTE_MISMATCH:'+file)
  records.push({folder:name,file,origin:row.origin,source:row.source,runId:run.runId,revision:run.revision,phase:run.phase,sha256:sha(text),fullNormalCreatePrefixByteEqual:true})
 }
}
for(const [file,hash]of Object.entries(frozen))if(sha(readFileSync(join(root,file)))!==hash)throw Error('SOURCE_CHANGED_DURING_AUDIT:'+file)
const result={scope:'Actual public normal exports and import buffers separately identified; same-identity prefixes reused only after actual evaluation and full codec validation in this invocation; input buffers are not new native saves',sourceHashes:frozen,creations:trees.size,executedUniqueCommands:executed,files:records.length,records}
writeFileSync(join(here,'native-prefix-audit-'+suffix+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({creations:trees.size,executedUniqueCommands:executed,files:records.length,allByteEqual:true}))
