import {lstatSync,openSync,closeSync,fstatSync,readSync,writeFileSync,fsyncSync,readdirSync,constants} from 'node:fs'
import {dirname,join,resolve,relative,isAbsolute,basename} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {isDeepStrictEqual} from 'node:util'
import {spawnSync} from 'node:child_process'
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs'

// Fixed local P2-R1 physical readback. No game imports, replay, archive unpacking or server action.
const ROOT=fileURLToPath(new URL('../../../',import.meta.url)),TASK='goal-1/evidence/t17-acceptance-18',MATRIX=TASK+'/matrix-r1'
const matrix=join(ROOT,MATRIX),task=join(ROOT,TASK),sealName='sealed-evidence.json',receiptName='matrix-r1-readback.json'
const freezeName=TASK+'/freeze-r1.json',execution=TASK+'/matrix-r1-execution'
const FREEZE_SHA='e70b059a5fd466f627e387a755e8960823b3fd5eba513bb5f18ae02a25517aa9'
const expectedArgv=['rtk','proxy','node','--max-old-space-size=1536','--experimental-strip-types','scripts/collect_relay_shape_evidence.ts','--output-dir',MATRIX]
const expectedStart='2026-10-22T03:21:57.021495+00:00',checked=new Map(),expectedFiles=new Set(),expectedDirectories=new Set(['cases','prefixes'])
const check=(value,code)=>{if(!value)throw Error(code)}
const equal=(a,b,code)=>check(isDeepStrictEqual(a,b),code)
const sha=value=>createHash('sha256').update(value).digest('hex')
const hashPattern=/^[0-9a-f]{64}$/
function pathIn(base,name){
 check(typeof name==='string'&&name.length>0&&!isAbsolute(name)&&!/[\\\r\n\0]/.test(name)&&name.split('/').every(p=>p&&p!=='.'&&p!=='..'),'SAFE_RELATIVE_PATH_REQUIRED:'+name)
 const path=resolve(base,name),inside=relative(base,path)
 check(inside!==''&&inside!=='..'&&!inside.startsWith('../')&&!isAbsolute(inside),'PATH_ESCAPE:'+name)
 return path
}
function physicalParents(path){
 for(let current=dirname(path);;current=dirname(current)){
  const s=lstatSync(current);check(s.isDirectory()&&!s.isSymbolicLink(),'PHYSICAL_PARENT_REQUIRED:'+current)
  if(current===dirname(current))break
 }
}
function outputGuard(dir,allowOwnSeal=false){
 for(let current=dir;;current=dirname(current)){
  const s=lstatSync(current);check(s.isDirectory()&&!s.isSymbolicLink(),'PHYSICAL_OUTPUT_DIRECTORY_REQUIRED:'+current)
  const marker=join(current,sealName)
  check(!lstatSync(marker,{throwIfNoEntry:false})||(allowOwnSeal&&current===matrix),'SEALED_OUTPUT_ANCESTOR:'+current)
  if(current===dirname(current))break
 }
 if(!allowOwnSeal)assertBrowserEvidenceWritable(dir)
}
const identity=s=>[s.dev,s.ino,s.mode,s.nlink,s.size,s.mtimeMs,s.ctimeMs].join(':')
function readPhysical(path,keepBytes=false){
 physicalParents(path)
 const before=lstatSync(path);check(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1,'SINGLE_REGULAR_FILE_REQUIRED:'+path)
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK),hash=createHash('sha256'),chunks=[]
 let total=0
 try{
  check(identity(fstatSync(fd))===identity(before),'FILE_OPEN_IDENTITY_CHANGED:'+path)
  const block=Buffer.allocUnsafe(1024*1024)
  for(;;){const n=readSync(fd,block,0,block.length,null);if(!n)break;hash.update(block.subarray(0,n));total+=n;if(keepBytes)chunks.push(Buffer.from(block.subarray(0,n)))}
  check(identity(fstatSync(fd))===identity(before),'FILE_READ_IDENTITY_CHANGED:'+path)
 }finally{closeSync(fd)}
 check(identity(lstatSync(path))===identity(before)&&total===before.size,'FILE_PATH_CHANGED:'+path)
 const ref={bytes:total,sha256:hash.digest('hex'),mode:(before.mode&0o7777).toString(8)}
 const previous=checked.get(path);if(previous)equal(ref,previous,'PHYSICAL_FILE_CHANGED_BETWEEN_READS:'+path);else checked.set(path,ref)
 return keepBytes?{...ref,raw:Buffer.concat(chunks)}:ref
}
function json(path){const value=readPhysical(path,true),text=value.raw.toString('utf8');check(Buffer.from(text).equals(value.raw),'JSON_UTF8_BYTES_CHANGED:'+path);return JSON.parse(text)}
function fileRef(base,ref,expectedName=null){
 check(ref&&typeof ref==='object'&&Number.isSafeInteger(ref.bytes)&&ref.bytes>=0&&hashPattern.test(ref.sha256),'COMPLETE_FILE_REF_REQUIRED')
 if(expectedName!==null)check(ref.file===expectedName,'EXACT_FILE_REF_PATH_REQUIRED:'+expectedName)
 const path=pathIn(base,ref.file),actual=readPhysical(path)
 check(actual.bytes===ref.bytes&&actual.sha256===ref.sha256,'FILE_REF_BYTES_OR_SHA_CHANGED:'+ref.file)
 return actual
}
function expectFile(name){expectedFiles.add(name);return pathIn(matrix,name)}
function guardFreeze(freeze){
 check(Object.keys(freeze.sourceHashes).length===151&&Object.keys(freeze.inputHashes).length===247,'EXACT_FROZEN_MAP_COUNTS_REQUIRED')
 for(const [label,map]of [['source',freeze.sourceHashes],['input',freeze.inputHashes]])for(const [name,hash]of Object.entries(map)){
  check(hashPattern.test(hash),'FROZEN_SHA_REQUIRED:'+name)
  check(readPhysical(pathIn(ROOT,name)).sha256===hash,'FROZEN_'+label.toUpperCase()+'_DRIFT:'+name)
 }
 equal(Object.keys(freeze.sources).sort(),Object.keys(freeze.sourceHashes).sort(),'SOURCE_SNAPSHOT_SET_CHANGED')
 for(const [name,ref]of Object.entries(freeze.sources)){
  check(ref.sha256===freeze.sourceHashes[name],'SOURCE_SNAPSHOT_FROZEN_SHA_CHANGED:'+name)
  const actual=fileRef(task,{file:ref.snapshot,bytes:ref.bytes,sha256:ref.sha256})
  check(actual.sha256===freeze.sourceHashes[name],'SOURCE_SNAPSHOT_CHANGED:'+name)
 }
 for(const ref of freeze.verificationFiles)fileRef(task,ref)
}
function archives(folder,items,prefix){
 check(Array.isArray(items)&&items.length>0,'NONEMPTY_ARCHIVE_LIST_REQUIRED:'+folder)
 const members=new Map()
 items.forEach((a,n)=>{
  check(a.encoding==='xz'&&a.file===prefix+'-part-'+String(n+1).padStart(3,'0')+'.xz','ORDERED_FIXED_XZ_PART_REQUIRED:'+folder)
  check(Number.isSafeInteger(a.storedBytes)&&a.storedBytes>0&&hashPattern.test(a.storedSha256)&&Number.isSafeInteger(a.containerBytes)&&a.containerBytes>0&&a.containerBytes<=256*1024*1024&&hashPattern.test(a.containerSha256),'COMPLETE_ARCHIVE_DESCRIPTOR_REQUIRED:'+folder)
  fileRef(matrix,{file:folder+'/'+a.file,bytes:a.storedBytes,sha256:a.storedSha256});expectFile(folder+'/'+a.file)
  check(Array.isArray(a.members)&&a.members.length>0&&a.members.length<=512,'BOUNDED_COMPLETE_MEMBER_LIST_REQUIRED:'+folder)
  for(const m of a.members){
   check(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(m.name)&&!members.has(m.name)&&Number.isSafeInteger(m.bytes)&&m.bytes>=0&&m.bytes<=12*1024*1024&&hashPattern.test(m.sha256),'UNIQUE_COMPLETE_MEMBER_DESCRIPTOR_REQUIRED:'+folder)
   members.set(m.name,{bytes:m.bytes,sha256:m.sha256})
  }
 })
 return members
}
function memberRef(members,ref){check(ref&&typeof ref.member==='string'&&members.has(ref.member),'REFERENCED_MEMBER_MISSING');equal(members.get(ref.member),{bytes:ref.bytes,sha256:ref.sha256},'MEMBER_REF_DESCRIPTOR_CHANGED:'+ref.member)}
function inlineMember(members,name,raw){equal(members.get(name),{bytes:Buffer.byteLength(raw),sha256:sha(raw)},'INLINE_MEMBER_DESCRIPTOR_CHANGED:'+name)}
function scan(allowOwnSeal=false){
 const files={},directories=[],directoryModes={}
 const walk=(dir,name='')=>{
  outputGuard(dir,allowOwnSeal)
  if(name){directories.push(name);directoryModes[name]=(lstatSync(dir).mode&0o7777).toString(8)}
  for(const entry of readdirSync(dir).sort()){
   const item=name?name+'/'+entry:entry,path=join(dir,entry),s=lstatSync(path)
   if(item===sealName&&allowOwnSeal)continue
   check(!s.isSymbolicLink(),'SYMLINK_IN_MATRIX:'+item)
   if(s.isDirectory())walk(path,item);else{check(s.isFile(),'NONREGULAR_IN_MATRIX:'+item);files[item]=readPhysical(path)}
  }
 }
 walk(matrix)
 equal(Object.keys(files).sort(),[...expectedFiles].sort(),'EXACT_PHYSICAL_FILE_SET_CHANGED')
 equal(directories.sort(),[...expectedDirectories].sort(),'EXACT_PHYSICAL_DIRECTORY_SET_CHANGED')
 return {rootMode:(lstatSync(matrix).mode&0o7777).toString(8),directories,directoryModes,files}
}
function freshJson(base,name,value){
 outputGuard(base)
 const path=pathIn(base,name),raw=Buffer.from(JSON.stringify(value,null,2)+'\n')
 check(!lstatSync(path,{throwIfNoEntry:false}),'FRESH_EXCLUSIVE_OUTPUT_REQUIRED:'+name)
 const fd=openSync(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW|constants.O_NONBLOCK,0o644)
 let own
 try{own=fstatSync(fd);check(own.isFile()&&own.nlink===1,'OWN_REGULAR_OUTPUT_REQUIRED');writeFileSync(fd,raw);fsyncSync(fd)}finally{closeSync(fd)}
 const actual=readPhysical(path,true);check(actual.raw.equals(raw),'OUTPUT_BYTES_READBACK_CHANGED:'+name)
 check(lstatSync(path).ino===own.ino&&lstatSync(path).dev===own.dev,'OUTPUT_INODE_CHANGED:'+name)
 return {file:relative(ROOT,path),bytes:actual.bytes,sha256:actual.sha256,mode:actual.mode}
}
function main(){
 check(process.argv.length===2,'FIXED_MATRIX_R1_NO_ARGUMENTS_REQUIRED')
 outputGuard(task);outputGuard(matrix)
 check(!lstatSync(join(task,receiptName),{throwIfNoEntry:false}),'FRESH_READBACK_RECEIPT_REQUIRED')
 const indexed=spawnSync('rtk',['proxy','git','ls-files','-z','--',MATRIX],{cwd:ROOT,encoding:'utf8'})
 check(indexed.status===0&&!indexed.error&&indexed.stdout.length===0,'UNTRACKED_UNINDEXED_MATRIX_REQUIRED')
 const running=json(pathIn(ROOT,execution+'/running.json')),terminal=json(pathIn(ROOT,execution+'/terminal.json'))
 for(const v of [running,terminal]){equal(v.argv,expectedArgv,'FIXED_COLLECTOR_ARGV_CHANGED');check(v.driverPid===5741&&v.rtkPid===5742&&v.startedAt===expectedStart&&v.freezeSha256===FREEZE_SHA,'FIXED_COLLECTOR_EXECUTION_IDENTITY_CHANGED')}
 check(terminal.exitCode===0&&typeof terminal.endedAt==='string'&&Number.isFinite(Date.parse(terminal.endedAt))&&Date.parse(terminal.endedAt)>=Date.parse(expectedStart)&&Number.isFinite(terminal.wallSeconds)&&terminal.wallSeconds>=0,'ACTUAL_COLLECTOR_TERMINAL_ZERO_REQUIRED')
 const processResult=spawnSync('rtk',['proxy','ps','-axo','pid=,ppid=,args='],{cwd:ROOT,encoding:'utf8',maxBuffer:8*1024*1024})
 check(processResult.status===0&&!processResult.error,'READ_ONLY_PROCESS_OBSERVATION_FAILED')
 const processRows=processResult.stdout.split('\n').flatMap(line=>{
  const match=/^\s*(\d+)\s+(\d+)\s+(.+)$/.exec(line);if(!match)return []
  const tokens=match[3].trim().split(/\s+/),executable=basename(tokens[0])
  const collectorArgvMatch=(executable==='rtk'&&isDeepStrictEqual(tokens.slice(1),expectedArgv.slice(1)))||(executable==='node'&&isDeepStrictEqual(tokens.slice(1),expectedArgv.slice(3)))
  return [{pid:Number(match[1]),ppid:Number(match[2]),collectorArgvMatch}]
 })
 const active=processRows.filter(row=>row.collectorArgvMatch)
 check(active.length===0,'EXACT_COLLECTOR_ARGV_STILL_ACTIVE_DO_NOT_SEAL:'+JSON.stringify(active))
 const historicalProcessReadback=[5742,5743].map(pid=>processRows.find(row=>row.pid===pid)??{pid,present:false})
 const freezePath=pathIn(ROOT,freezeName);check(readPhysical(freezePath).sha256===FREEZE_SHA,'FIXED_FREEZE_IDENTITY_CHANGED')
 const freeze=json(freezePath);guardFreeze(freeze)
 const self=fileURLToPath(import.meta.url);readPhysical(self)
 for(const file of ['stdout.txt','stderr.txt'])readPhysical(pathIn(ROOT,execution+'/'+file))
 const originalName='goal-1/evidence/t17-acceptance-12/registration-r1.json',original=json(pathIn(ROOT,originalName))
 const registration=json(expectFile('registration.json')),summary=json(expectFile('relay-shape-results.json'));readPhysical(expectFile('progress.jsonl'))
 for(const value of [registration,summary]){equal(value.sourceHashes,freeze.sourceHashes,'SOURCE_MAP_NOT_THE_FIXED_FREEZE');equal(value.inputHashes,freeze.inputHashes,'INPUT_MAP_NOT_THE_FIXED_FREEZE')}
 check(summary.passed===true&&summary.finalGuardError===null&&summary.registered===288&&summary.recorded===288&&summary.executed===288&&summary.fatal===0&&summary.notExecuted===0,'COLLECTOR_COMPLETE_ZERO_FATAL_SUMMARY_REQUIRED')
 check(original.coreCases.length===288&&original.identities.length===6&&registration.prefixAnchor==='4c0d6ac'&&freeze.prefixAnchor==='4c0d6ac','ORIGINAL_FIXED_SCOPE_REQUIRED')
 const identities=original.identities.map(i=>({name:i.backgroundId+'-'+i.seed,backgroundId:i.backgroundId,seed:i.seed})),checkpoints=original.coreCases[0].requiredCheckpoints
 check(checkpoints.length===10&&new Set(checkpoints).size===10,'ORIGINAL_TEN_CHECKPOINTS_REQUIRED')
 equal(registration.identities,identities,'ORIGINAL_SIX_IDENTITIES_CHANGED');equal(registration.originalCases,original.coreCases,'ORIGINAL_288_REGISTRATION_CHANGED');equal(registration.requiredCheckpoints,checkpoints,'ORIGINAL_TEN_CHECKPOINTS_CHANGED')
 equal(registration.cases.map(c=>c.id),freeze.originalCaseIds,'FROZEN_288_ID_ORDER_CHANGED')
 const tuples=new Map(identities.map(i=>[i.name,new Set()]))
 original.coreCases.forEach((old,n)=>{
  const row=registration.cases[n],identity=identities.find(i=>i.backgroundId===old.backgroundId&&i.seed===old.seed)
  check(old.id==='RLY-C'+String(n+1).padStart(3,'0')&&row.id===old.id&&row.identityId===old.identityId&&row.folder==='cases/'+old.id,'ORIGINAL_CASE_ID_OR_FOLDER_CHANGED')
  equal(row.identity,identity,'ORIGINAL_CASE_IDENTITY_CHANGED');equal(old.requiredCheckpoints,checkpoints,'ORIGINAL_CASE_CHECKPOINT_SET_CHANGED')
  const shape={id:[old.supplierId,old.offerKind,old.customerMode,old.supportMode].join('--'),supplierId:old.supplierId,offerKind:old.offerKind,unitPriceFen:old.unitPriceFen,customerMode:old.customerMode,supportMode:old.supportMode}
  equal(row.shape,shape,'ORIGINAL_CASE_TUPLE_CHANGED');const set=tuples.get(identity.name);check(!set.has(shape.id),'DUPLICATE_ORIGINAL_CASE_TUPLE');set.add(shape.id)
 })
 check(registration.cases.length===288&&[...tuples.values()].every(s=>s.size===48),'SIX_EXACT_ORIGINAL_48_TUPLES_REQUIRED')
 check(Array.isArray(summary.prefixProofs)&&summary.prefixProofs.length===6,'SIX_PREFIX_PROOFS_REQUIRED')
 const prefixTerminals=new Map(),prefixRows=[]
 summary.prefixProofs.forEach((proof,n)=>{
  const identity=identities[n],folder='prefixes/'+identity.name;expectedDirectories.add(folder)
  equal(proof.identity,identity,'PREFIX_PROOF_IDENTITY_CHANGED');check(proof.status==='verified','PREFIX_NOT_VERIFIED')
  fileRef(matrix,proof.index,folder+'/prefix-index.json');const index=json(expectFile(folder+'/prefix-index.json')),record=index.record
  equal(index.identity,identity,'PREFIX_INDEX_IDENTITY_CHANGED');equal(record.identity,identity,'PREFIX_RECORD_IDENTITY_CHANGED');equal(proof.archives,index.archives,'PREFIX_ARCHIVE_PROOF_CHANGED')
  check(record.status==='verified'&&record.error===null&&record.readiness.ready===true,'PREFIX_READINESS_NOT_VERIFIED')
  equal(record.matchedOriginalMilestones,record.originalMilestones.map(m=>m.name),'PREFIX_ORIGINAL_MILESTONES_NOT_ALL_MATCHED')
  check(freeze.inputHashes[record.sourceEvidence]===record.sourceEvidenceSha256,'PREFIX_SOURCE_NOT_FROZEN')
  const members=archives(folder,index.archives,'prefix-evidence');memberRef(members,record.initial);memberRef(members,record.terminal)
  inlineMember(members,'prefix-record.json',JSON.stringify(record,null,2)+'\n')
  fileRef(matrix,index.journal,folder+'/requests.jsonl');expectFile(index.journal.file)
  equal(members.get('requests.jsonl'),{bytes:index.journal.bytes,sha256:index.journal.sha256},'PREFIX_JOURNAL_MEMBER_CHANGED')
  equal([...members.keys()].sort(),[record.initial.member,record.terminal.member,'prefix-record.json','requests.jsonl'].sort(),'PREFIX_EXACT_MEMBER_SET_CHANGED')
  prefixTerminals.set(identity.name,record.terminal);prefixRows.push({identity:identity.name,status:record.status,acceptedCommands:record.acceptedCommands.length,matchedOriginalMilestones:record.matchedOriginalMilestones.length,index:proof.index})
 })
 check(Array.isArray(summary.results)&&summary.results.length===288,'ALL_ORIGINAL_288_RESULT_ROWS_REQUIRED')
 const rows=[]
 summary.results.forEach((row,n)=>{
  const registered=registration.cases[n],folder=registered.folder;expectedDirectories.add(folder)
  check(row.caseId===registered.id&&row.identity===registered.identity.name&&row.shapeId===registered.shape.id&&['completed','policy_refused'].includes(row.status)&&row.recovery===null,'RESULT_ID_OR_STATUS_CHANGED')
  fileRef(matrix,row.index,folder+'/case-index.json');const index=json(expectFile(folder+'/case-index.json')),record=index.record
  check(index.caseId===row.caseId&&record.caseId===row.caseId&&record.status===row.status,'CASE_INDEX_OR_RECORD_ID_STATUS_CHANGED')
  equal(index.identity,registered.identity,'CASE_INDEX_IDENTITY_CHANGED');equal(record.identity,registered.identity,'CASE_RECORD_IDENTITY_CHANGED');equal(index.shape,registered.shape,'CASE_INDEX_SHAPE_CHANGED');equal(record.shape,registered.shape,'CASE_RECORD_SHAPE_CHANGED')
  equal(row.error,record.error,'CASE_RESULT_ERROR_CHANGED')
  const positive=record.status==='completed'&&record.assessment?.positive===true
  check(row.positive===positive,'FINITE_AND_POSITIVE_MUST_REMAIN_SEPARATE')
  check(record.assessment!==null,'ACTUAL_CASE_ASSESSMENT_REQUIRED');equal(record.assessment.checkpoints.map(c=>c.name),checkpoints,'CASE_TEN_CHECKPOINTS_CHANGED')
  if(record.status==='completed')check(positive&&record.error===null&&record.assessment.checkpoints.every(c=>c.status==='passed'),'COMPLETED_CASE_CHECKPOINTS_NOT_PASSED')
  const members=archives(folder,index.archives,'case-evidence'),names=new Set(['case-record.json','requests.jsonl'])
  for(const ref of [record.source,record.terminal,...record.milestones.map(m=>m.raw),...record.attempts.flatMap(a=>a.proposedCandidate?[a.proposedCandidate]:[])]){memberRef(members,ref);names.add(ref.member)}
  const prefix=prefixTerminals.get(row.identity);check(record.source.bytes===prefix.bytes&&record.source.sha256===prefix.sha256,'CASE_SOURCE_NOT_VERIFIED_PREFIX_TERMINAL')
  inlineMember(members,'case-record.json',JSON.stringify(record,null,2)+'\n');equal([...members.keys()].sort(),[...names].sort(),'CASE_EXACT_MEMBER_SET_CHANGED')
  fileRef(matrix,index.journal,folder+'/requests.jsonl');expectFile(index.journal.file)
  equal(members.get('requests.jsonl'),{bytes:index.journal.bytes,sha256:index.journal.sha256},'CASE_JOURNAL_MEMBER_CHANGED')
  rows.push({caseId:row.caseId,status:row.status,positive,index:row.index,archives:index.archives.length,members:members.size})
 })
 const count=status=>rows.filter(r=>r.status===status).length,positive=rows.filter(r=>r.positive).length
 check(summary.closed===count('completed')&&summary.finite===count('policy_refused')&&summary.closed+summary.finite===288&&summary.positive===positive&&summary.all288Positive===(positive===288),'ACTUAL_FINITE_POSITIVE_SUMMARY_COUNTS_CHANGED')
 const before=scan();guardFreeze(freeze)
 for(const [path,ref]of [...checked])equal(readPhysical(path),ref,'BINDING_CHANGED_BEFORE_SEAL:'+path)
 outputGuard(matrix)
 const seal=freshJson(matrix,sealName,{task:'5c-P2 original288 matrix-r1',scope:'Physical collector byte preservation after its actual terminal0; independent six-Create/288-suffix audit has NOT been performed by this helper. Finite and positive remain separate.',selfExcluded:true,observedAt:new Date().toISOString(),freeze:{file:freezeName,sha256:FREEZE_SHA},collector:{running:execution+'/running.json',terminal:execution+'/terminal.json',driverPid:5741,rtkPid:5742,nodePidFromHistoricalHandoff:5743,exitCode:0,argv:expectedArgv},counts:{registered:288,executed:288,completed:summary.closed,finite:summary.finite,positive},prefixes:prefixRows,...before})
 // The newly written own marker is permitted only for subsequent readback; no original is changed.
 guardFreeze(freeze);equal(scan(true),before,'PHYSICAL_MATRIX_CHANGED_AFTER_SEAL')
 for(const [path,ref]of [...checked])equal(readPhysical(path),ref,'BINDING_CHANGED_AFTER_SEAL:'+path)
 const receipt=freshJson(task,receiptName,{scope:'Fixed matrix-r1 physical readback/seal only; independent game audit remains pending.',passed:true,observedAt:new Date().toISOString(),seal,freezeSha256:FREEZE_SHA,sourceCount:151,inputCount:247,allSourceInputBytesSameBeforeAndAfter:true,historicalProcessReadback,physicalFiles:Object.keys(before.files).length,physicalDirectories:before.directories.length,physicalBytes:Object.values(before.files).reduce((n,f)=>n+f.bytes,0),completed:summary.closed,finite:summary.finite,positive,prefixes:prefixRows,rows,archiveMemberBoundary:'Stored XZ files read in full and SHA/length matched; all member refs matched descriptor entries. This helper does not decompress or replay members.',compatibilityDevelopmentTests:0})
 console.log(JSON.stringify({passed:true,seal,receipt,completed:summary.closed,finite:summary.finite,positive,independentGameAudit:'not_executed_by_this_helper'}))
}
try{main()}catch(caught){console.error(JSON.stringify({passed:false,scope:'matrix-r1 physical readback/seal',error:String(caught),markerIfAlreadyWritten:'Retain it; a marker alone is not successful post-seal readback. Do not overwrite or auto-remove any evidence.'}));process.exitCode=1}
