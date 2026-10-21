import {readFileSync,writeFileSync,readdirSync,existsSync,realpathSync,lstatSync,openSync,fstatSync,closeSync,constants} from 'node:fs'
import {join,resolve,relative,basename,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {evidenceDirectory} from '../../../scripts/evidence-output.ts'
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {hashValue} from '../../../src/core/hash.ts'
import {canonicalJson} from '../../../src/core/identity.ts'
import type {GameRun} from '../../../src/core/run-types.ts'

// D09 R2 tool fork: original full Create replay unchanged; source-bound input buffers have a separate exact terminal-LF identity.
import {classifyAuditText} from './audit-input-boundary-r2.mjs'
// Original scripts/verify_normal_browser_exports.ts and every public raw stay unchanged.
const root=fileURLToPath(new URL('../../../',import.meta.url)),argument=process.env.NATIVE_EXPORT_INPUT_DIRECTORY
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
const bindingsFile='goal-1/evidence/t17-acceptance-14/audit-input-bindings-r2.json'
type Binding={folder:string;file:string;origin:'import_buffer';sourceFile:string;bytes:number;sha256:string;terminalLf:0|1}
const bindings=JSON.parse(readFileSync(join(root,bindingsFile),'utf8')) as Record<string,Binding>,usedBindings=new Set<string>()
const ownSources=['goal-1/evidence/t17-acceptance-14/verify_normal_browser_exports-r2.ts','goal-1/evidence/t17-acceptance-14/audit-input-boundary-r2.mjs',bindingsFile,'goal-1/evidence/t17-acceptance-14/run-browser-audit-r2.py']
for(const file of ownSources)sourceHashes[file]=sha(readFileSync(join(root,file)))
const boundIdentities=new Map<string,string>()
function boundSourcePath(file:string){
 if(typeof file!=='string'||!file.startsWith('goal-1/evidence/')||file.split('/').some(p=>!p||p==='.'||p==='..')||file.includes('\\'))throw Error('CANONICAL_BOUND_PROJECT_SOURCE_REQUIRED')
 const path=join(root,file)
 for(let current=path;current!==resolve(root);current=resolve(current,'..'))if(lstatSync(current).isSymbolicLink())throw Error('BOUND_SOURCE_SYMLINK_REJECTED')
 if(!lstatSync(path).isFile()||realpathSync(path)!==path)throw Error('REGULAR_BOUND_SOURCE_REQUIRED')
 return path
}
function readBoundSourceStable(file:string){
 const path=boundSourcePath(file),before=lstatSync(path)
 const identity=(s:ReturnType<typeof lstatSync>)=>JSON.stringify([s.dev,s.ino,s.mode,s.size,s.mtimeMs,s.ctimeMs])
 const expected=identity(before),known=boundIdentities.get(file)
 if(known!==undefined&&known!==expected)throw Error('BOUND_SOURCE_PHYSICAL_IDENTITY_CHANGED')
 const descriptor=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK)
 let text:string
 try{
  if(identity(fstatSync(descriptor))!==expected)throw Error('BOUND_SOURCE_CHANGED_BEFORE_READ')
  text=readFileSync(descriptor,'utf8')
  if(identity(fstatSync(descriptor))!==expected)throw Error('BOUND_SOURCE_CHANGED_DURING_READ')
 }finally{closeSync(descriptor)}
 if(boundSourcePath(file)!==path||identity(lstatSync(path))!==expected)throw Error('BOUND_SOURCE_PATH_CHANGED_DURING_READ')
 boundIdentities.set(file,expected);return text
}
function originalBindingSource(binding:Binding){
 const text=readBoundSourceStable(binding.sourceFile);inputHashes[binding.sourceFile]=sha(text);return text
}
const comparisons:Array<{comparison:string;byteEqual:boolean;originalSourceEqual:boolean|null;originalTerminalLfSeparately:boolean;originalTerminalLfCount:number|null;bytes:number;sha256:string;canonicalBytes:number;canonicalSha256:string}>=[]
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
  if(codec.export(node.run)!==node.raw)throw Error('MUTATED_FULL_CREATE_PREFIX:'+key)
  const binding=bindings[key]
  if(binding)usedBindings.add(key)
  const comparison=classifyAuditText({folder:name,file,origin:row.origin,text,replayedCanonical:node.raw,
   ...(binding?{binding,sourceText:originalBindingSource(binding)}:{})})
  comparisons.push(comparison)
  if(row.origin==='import_buffer')inputBuffers++
  records.push({folder:name,file,recordedOrigin:row.origin,recordedUISource:row.source,runId:run.runId,revision:run.revision,phase:run.phase,sha256:sha(text),bytes:Buffer.byteLength(text),fullNormalCreatePrefixByteEqual:comparison.byteEqual,fullNormalCreateCanonicalPrefixEqual:true,comparison,boundSourceFile:binding?.sourceFile??null})
 }
}
if(!records.length)throw Error('NO_RECORDED_PUBLIC_EXPORTS')
if(canonicalJson([...usedBindings].sort())!==canonicalJson(Object.keys(bindings).sort()))throw Error('EXACT_BOUND_INPUT_BUFFER_SET_REQUIRED')
if(canonicalJson(names)!==canonicalJson(folders()))throw Error('NATIVE_INPUT_FOLDERS_CHANGED_DURING_AUDIT')
for(const [file,hash]of Object.entries({...sourceHashes,...inputHashes}))if(!boundIdentities.has(file)&&sha(readFileSync(join(root,file)))!==hash)throw Error('AUDIT_SOURCE_OR_INPUT_CHANGED:'+file)
for(const file of boundIdentities.keys())if(sha(readBoundSourceStable(file))!==inputHashes[file])throw Error('BOUND_SOURCE_FINAL_BYTES_CHANGED:'+file)
const report={scope:'D09 R2 same full normal Create replay; all non-buffer public exports require original byte equality. Every import buffer must exactly match its bound original source and the full replay canonical text, allowing only its explicitly registered single terminal LF. Original two LF buffers remain byte-unequal to canonical exports and are reported separately. This is bytes/replay evidence, not browser visuals or human acceptance.',head:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),inputDirectory:inputName,sourceHashes,inputHashes,creations:trees.size,executedUniqueCommands:executed,files:records.length,inputBuffers,records,passed:true,allByteEqual:comparisons.every(c=>c.byteEqual),allCanonicalReplayMatches:true,allNonBufferBytesEqual:true,allInputBufferOriginalSourcesEqual:true,boundSourcePhysicalIdentitiesUnchanged:true,boundSourceCount:boundIdentities.size,sourceBoundSingleTerminalLfDifferences:comparisons.filter(c=>c.originalTerminalLfSeparately).length,notCovered:['human playtest','original three PNG','real200percent/native beforeunload/mobile acceptance','whole Q/X or whole goal completion']}
writeFileSync(join(output,'normal-browser-export-audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({creations:trees.size,executedUniqueCommands:executed,files:records.length,inputBuffers,passed:report.passed,allByteEqual:report.allByteEqual,allCanonicalReplayMatches:report.allCanonicalReplayMatches,allNonBufferBytesEqual:report.allNonBufferBytesEqual,allInputBufferOriginalSourcesEqual:report.allInputBufferOriginalSourcesEqual,sourceBoundSingleTerminalLfDifferences:report.sourceBoundSingleTerminalLfDifferences}))
