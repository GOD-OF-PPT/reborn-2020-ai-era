import {readFileSync,writeFileSync,readdirSync,existsSync,realpathSync} from 'node:fs'
import {join,resolve,relative,basename,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {evidenceDirectory} from './evidence-output.ts'
import {createCampaignRun,createCampaignCodec} from '../src/application/campaign.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {hashValue} from '../src/core/hash.ts'
import {canonicalJson} from '../src/core/identity.ts'
import type {GameRun} from '../src/core/run-types.ts'

// Generalizes the executed T16 complete-prefix audit. Browser operations stay in CUA.
const root=fileURLToPath(new URL('../',import.meta.url)),argument=process.env.NATIVE_EXPORT_INPUT_DIRECTORY
if(!argument||process.argv.length!==4||process.argv[2]!=='--output-dir')throw Error('EXPLICIT_NATIVE_INPUT_AND_FRESH_OUTPUT_REQUIRED')
const input=resolve(root,argument),inputName=relative(root,input).split('\\').join('/')
if(!inputName.startsWith('goal-1/evidence/'))throw Error('NATIVE_INPUT_MUST_BE_A_PROJECT_EVIDENCE_DIRECTORY')
const realInput=realpathSync(input),realInputName=relative(realpathSync(root),realInput).split('\\').join('/')
if(!realInputName.startsWith('goal-1/evidence/'))throw Error('NATIVE_INPUT_MUST_BE_A_PROJECT_EVIDENCE_DIRECTORY')
function readInput(path:string){const name=relative(realInput,realpathSync(path));if(name.startsWith('..')||isAbsolute(name))throw Error('NATIVE_INPUT_SYMLINK_ESCAPES_DIRECTORY');return readFileSync(path,'utf8')}
const output=evidenceDirectory(root,'normal-browser-export-audit.json')
if(existsSync(join(output,'normal-browser-export-audit.json')))throw Error('FRESH_NATIVE_AUDIT_OUTPUT_REQUIRED')
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex'),codec=createCampaignCodec()
function paths(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?paths(dir+'/'+d.name):/\.ts$/.test(d.name)&&!d.name.includes('.test.')?[dir+'/'+d.name]:[])}
const sourceHashes=Object.fromEntries([...paths('src/core'),...paths('src/application'),...paths('src/content'),...paths('src/persistence'),'scripts/verify_normal_browser_exports.ts','scripts/evidence-output.ts'].map(p=>[p,sha(readFileSync(join(root,p)))]))
const folders=()=>readdirSync(input,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name.startsWith('chrome-')).map(d=>d.name).sort()
const names=folders(),inputHashes:Record<string,string>={},seen=new Set<string>()
type Prefix={run:GameRun;raw:string;commandText:string;children:Map<string,Prefix>}
const trees=new Map<string,Prefix>(),records:unknown[]=[];let executed=0,inputBuffers=0
for(const name of names){
 const folder=join(input,name),journal=join(folder,'exports.jsonl');if(!existsSync(journal))continue
 const lines=readInput(journal);inputHashes[relative(root,journal)]=sha(lines)
 for(const line of lines.split('\n').filter(Boolean)){
  const row=JSON.parse(line),file=String(row.file),path=join(folder,file),key=name+'/'+file
  if(basename(file)!==file||!/^[a-zA-Z0-9_.-]+\.json$/.test(file)||seen.has(key))throw Error('INVALID_OR_DUPLICATE_NATIVE_EXPORT_PATH')
  seen.add(key)
  const text=readInput(path);if(sha(text)!==row.sha256||Buffer.byteLength(text)!==row.bytes)throw Error('RECORDED_EXPORT_BYTES_MISMATCH')
  inputHashes[relative(root,path)]=sha(text)
  const run=codec.import(text);if(run.origin!=='normal')throw Error('FULL_BROWSER_AUDIT_REQUIRES_NORMAL_CREATION')
  const first=run.receipts[0]!,creationText=canonicalJson({signature:first.payloadSignature,commandId:first.commandId,versions:run.versions}),identity=hashValue(creationText)
  const known=trees.get(identity);let node:Prefix
  if(known)node=known
  else{const initial=createCampaignRun({runId:run.runId,actorId:run.actorId,commandId:first.commandId,backgroundId:run.backgroundId,seed:run.seed,playerProfile:run.playerProfile}),raw=codec.export(initial);node={run:codec.import(raw),raw,commandText:creationText,children:new Map()};trees.set(identity,node)}
  if(node.commandText!==creationText)throw Error('CREATION_IDENTITY_COLLISION')
  for(const receipt of run.receipts.slice(1)){
   const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},commandText=canonicalJson(command),key=hashValue(command)
   const cached:Prefix|undefined=node.children.get(key)
   if(cached){if(cached.commandText!==commandText||codec.export(cached.run)!==cached.raw)throw Error('MUTATED_OR_MISMATCHED_EARNED_PREFIX');node=cached;continue}
   const result=evaluateCommand(node.run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error('FULL_NORMAL_PREFIX_REJECTED:'+JSON.stringify({file,commandId:receipt.commandId,result}))
   const raw=codec.export(result.nextRun),next:Prefix={run:codec.import(raw),raw,commandText,children:new Map()};node.children.set(key,next);node=next;executed++
  }
  if(codec.export(node.run)!==node.raw||node.raw!==text)throw Error('FULL_CREATE_PREFIX_BYTE_MISMATCH:'+key)
  if(row.origin==='import_buffer')inputBuffers++
  records.push({folder:name,file,recordedOrigin:row.origin,recordedUISource:row.source,runId:run.runId,revision:run.revision,phase:run.phase,sha256:sha(text),bytes:Buffer.byteLength(text),fullNormalCreatePrefixByteEqual:true})
 }
}
if(!records.length)throw Error('NO_RECORDED_PUBLIC_EXPORTS')
if(canonicalJson(names)!==canonicalJson(folders()))throw Error('NATIVE_INPUT_FOLDERS_CHANGED_DURING_AUDIT')
for(const [file,hash]of Object.entries({...sourceHashes,...inputHashes}))if(sha(readFileSync(join(root,file)))!==hash)throw Error('AUDIT_SOURCE_OR_INPUT_CHANGED:'+file)
const report={scope:'Current engine full creation replay of individually source-labeled public Chrome exports. This audits bytes, not the browser interaction or visual evidence. Input buffers are not new saved outcomes.',head:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),inputDirectory:inputName,sourceHashes,inputHashes,creations:trees.size,executedUniqueCommands:executed,files:records.length,inputBuffers,records,allByteEqual:true,notCovered:['human playtest','original three PNG','real200percent/native beforeunload/mobile acceptance','whole Q/X or whole goal completion']}
writeFileSync(join(output,'normal-browser-export-audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({creations:trees.size,executedUniqueCommands:executed,files:records.length,inputBuffers,allByteEqual:true}))
