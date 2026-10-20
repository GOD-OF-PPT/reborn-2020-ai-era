import {appendFileSync,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,realpathSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {basename,dirname,isAbsolute,join,relative,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {gzipSync,gunzipSync} from 'node:zlib'
import {evidenceDirectory} from './evidence-output.ts'
import {assertFreshVideoEvidencePath as assertFreshCourseEvidencePath} from './video-shape-output.ts'
import {COURSE_SHAPES,CourseShapePolicyRefusal,type CourseShape} from '../src/testing/course-shape-scenario.ts'
import {DelegatedCourseHarness,runDelegatedCourseShape} from '../src/testing/course-delegated-scenario.ts'
import {assertCourseCashDelta,assertCourseMoney} from '../src/testing/course-shape-assertions.ts'
import {createCampaignRun,createCampaignCodec,campaignCourse,campaignVideo,campaignStory} from '../src/application/campaign.ts'
import {projectCourse} from '../src/core/course-projection.ts'
import {projectVideo} from '../src/core/video-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {canonicalJson} from '../src/core/identity.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {actionBudget} from '../src/core/economy.ts'
import {accountPosition} from '../src/core/ledger.ts'
import type {CommandEnvelope,GameRun} from '../src/core/run-types.ts'

interface OriginalRaw{file:string;bytes:number;sha256:string}
interface PrefixMilestone extends OriginalRaw{name:string;revision:number;date:string}
interface PrefixRow{
 name:string;backgroundId:string;seed:string;status:string;fullCreateAndMilestoneBytesEqual:boolean
 initial:OriginalRaw;final:OriginalRaw;commands:CommandEnvelope[];milestones:PrefixMilestone[]
 publicCourse:unknown;publicVideo:unknown;publicStory:unknown
}
interface PrefixSummary{
 registered:number;completed:number;fullMatrixRegistered:number;fullMatrixBranchesExecuted:number
 allExecutedBytesEqual:boolean;sourceHashes:Record<string,string>;results:PrefixRow[]
}
interface Readiness{
 inputDirectory:string;inputHashes:Record<string,string>;sourceHashes:Record<string,string>
 verifierSha256:string;registered:number;ready:number;notReady:number;fullMatrixBranchesExecuted:number
 rows:{name:string;ready:boolean;rawSha256:string}[]
}
interface GzipRaw{
 file:string;encoding:'gzip';uncompressedBytes:number;uncompressedSha256:string
 storedBytes:number;storedSha256:string;losslessReadbackEqual:true
}
interface RawMember{member:string;bytes:number;sha256:string}
interface ArchiveMember{name:string;bytes:number;sha256:string}
interface ArchiveDescriptor{
 encoding:'xz';file:string;storedBytes:number;storedSha256:string
 containerBytes:number;containerSha256:string;members:ArchiveMember[]
}
interface Identity{name:string;backgroundId:string;seed:string}
interface OriginalRow extends OriginalRaw{rowId:string;commit:string;status:string}
interface Registration{
 rowId:string;identity:string;backgroundId:string;seed:string;shape:CourseShape;folder:string;originalRow:OriginalRow
}
type AttemptStatus='attempted'|'committed'|'rejected'|'exception'|'committed_with_exception'
interface ActualAttempt{
 index:number;command:CommandEnvelope;sourceRevision:number;sourceDate:string
 status:AttemptStatus;revisionAfter:number|null;dateAfter:string|null;reasonCodes:string[]|null;error:string|null
}
type PublicCourse=NonNullable<ReturnType<typeof projectCourse>>
type MoneyEvidence=ReturnType<typeof assertCourseMoney>
interface ShapeMilestone{
 name:string;revision:number;date:string;raw:RawMember;moneyEvidence:MoneyEvidence[]
 cashEvidence:ReturnType<typeof assertCourseCashDelta>[]
 independentMoneyStatus:'pending'|'passed'|'failed';independentMoneyError:string|null
}
type ResultStatus='completed'|'policy_refused'|'fatal'|'unexecuted_due_to_fatal'
interface ResultRow{
 rowId:string;identity:string;shape:CourseShape;folder:string;originalRow:OriginalRow;status:ResultStatus;error:string|null
 suffixCommands:number;actualRejectedCommands:number;suffixReplayBytesEqual:boolean;rejectedReplayEqual:boolean
 actualClosedShape:boolean;enrolledStudents:number;helpedRetainedStudents:number;positiveDelegatedBusiness:boolean
 businessCompletedAt:string|null;monitoringComplete:boolean;revision:number|null;date:string|null
 evidence:OriginalRaw|null;archive:ArchiveDescriptor|null;recovery:OriginalRaw|null
}

function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
const root=realpathSync(fileURLToPath(new URL('../',import.meta.url)))
const proposedOutput=assertFreshCourseEvidencePath(root,process.argv.slice(2))
check(/^goal-1\/evidence\/t17-acceptance-08\/matrix-r[1-9][0-9]*$/.test(relative(root,proposedOutput).split('\\').join('/')),'FIXED_ROOT08_FRESH_MATRIX_OUTPUT_REQUIRED')
const output=evidenceDirectory(root,'course-delegated-results.json')
check(readdirSync(output).length===0,'EMPTY_FRESH_COURSE_DELEGATED_OUTPUT_REQUIRED')
const prefixDirectory='goal-1/evidence/t17-acceptance-05/prefix-r1'
const readinessDirectory='goal-1/evidence/t17-acceptance-05/readiness-r1'
const originalDirectory='goal-1/evidence/t17-acceptance-06/matrix-r2'
const prerequisiteCommit='1938030714f5318287910a5f57d976c412d553b9'
const originalMatrixCommit='7975ae73526b8c17e185012518a2724bfd04308f'
// tasks.md is intentionally mutable progress; the actual policy and plan are frozen.
const strategyFiles=['goal-1/evidence/t17-acceptance-08/input.md','goal-1/evidence/t17-acceptance-08/plan.md','goal-1/evidence/t17-acceptance-08/policy-r1.md','goal-1/evidence/t17-acceptance-08/baseline.json']
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex')
const sourceInputHashes:Record<string,string>={}
function safeProjectFile(file:string){
 check(!isAbsolute(file),'PROJECT_RELATIVE_FILE_REQUIRED')
 const physical=realpathSync(resolve(root,file)),name=relative(root,physical).split('\\').join('/')
 check(name!==''&&name!=='..'&&!name.startsWith('../')&&!isAbsolute(name),'PROJECT_FILE_ESCAPE')
 check(name===relative(root,resolve(root,file)).split('\\').join('/'),'PROJECT_INPUT_SYMLINK_FORBIDDEN')
 return {physical,name}
}
function fixedInputText(file:string){
 const path=safeProjectFile(file)
 check(path.name.startsWith('goal-1/evidence/t17-acceptance-05/')||path.name.startsWith(originalDirectory+'/'),'FIXED_ORIGINAL_COURSE_INPUT_REQUIRED')
 const bytes=readFileSync(path.physical);sourceInputHashes[path.name]=sha(bytes);return bytes.toString('utf8')
}
function originalRaw(base:string,descriptor:OriginalRaw){
 check(typeof descriptor.file==='string'&&typeof descriptor.sha256==='string'&&Number.isSafeInteger(descriptor.bytes),'P1_RAW_DESCRIPTOR_REQUIRED')
 const file=join(base,descriptor.file),raw=fixedInputText(file)
 check(sha(raw)===descriptor.sha256&&Buffer.byteLength(raw)===descriptor.bytes,'P1_ORIGINAL_RAW_BYTES_CHANGED:'+file)
 return raw
}
/** Every write checks all ancestors again; an existing partial is never replaced. */
function writablePath(name:string){
 const target=resolve(output,name),path=relative(output,target)
 check(path!==''&&path!=='..'&&!path.startsWith('../')&&!isAbsolute(path),'OUTPUT_ESCAPE')
 let current=dirname(target)
 for(;;){
  if(existsSync(current)){
   const info=lstatSync(current);check(info.isDirectory()&&!info.isSymbolicLink(),'OUTPUT_DIRECTORY_SYMLINK_OR_NON_DIRECTORY')
   check(!existsSync(join(current,'sealed-evidence.json')),'EVIDENCE_SEALED_USE_NEW_ROOT')
  }
  if(current===root)break
  const parent=dirname(current);check(parent!==current,'OUTPUT_PROJECT_ANCESTOR_REQUIRED');current=parent
 }
 if(existsSync(target))check(lstatSync(target).isFile()&&!lstatSync(target).isSymbolicLink(),'OUTPUT_FILE_SYMLINK_OR_NON_FILE')
 return target
}
function makeDirectory(name:string){const path=writablePath(name);check(!existsSync(path),'FRESH_CASE_OR_IDENTITY_DIRECTORY_REQUIRED');mkdirSync(path)}
function saveText(name:string,raw:string):OriginalRaw{
 writeFileSync(writablePath(name),raw,{flag:'wx'});check(readFileSync(writablePath(name),'utf8')===raw,'WRITTEN_EVIDENCE_BYTES_CHANGED:'+name)
 return {file:name,bytes:Buffer.byteLength(raw),sha256:sha(raw)}
}
const saveJson=(name:string,value:unknown)=>saveText(name,JSON.stringify(value,null,2)+'\n')
function saveRaw(name:string,raw:string):GzipRaw{
 const file=name+'.gz',original=Buffer.from(raw,'utf8'),stored=gzipSync(original,{level:9})
 writeFileSync(writablePath(file),stored,{flag:'wx'})
 const readback=readFileSync(writablePath(file));check(readback.equals(stored),'GZIP_STORED_BYTES_CHANGED:'+file)
 check(gunzipSync(readback).equals(original),'GZIP_ORIGINAL_BYTES_CHANGED:'+file)
 return {file,encoding:'gzip',uncompressedBytes:original.length,uncompressedSha256:sha(original),storedBytes:stored.length,storedSha256:sha(stored),losslessReadbackEqual:true}
}
function sourceFiles(directory:string):string[]{
 return readdirSync(join(root,directory),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sourceFiles(directory+'/'+entry.name):entry.name.endsWith('.ts')&&!entry.name.includes('.test.')?[directory+'/'+entry.name]:[])
}
function commandsOf(run:GameRun):CommandEnvelope[]{
 return run.receipts.slice(1).map(receipt=>({...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}))
}
function strictRoundTrip(run:GameRun,codec:ReturnType<typeof createCampaignCodec>){
 const raw=codec.export(run),decoded=codec.import(raw);check(codec.export(decoded)===raw,'STRICT_DELEGATED_CODEC_BYTES_CHANGED');return {run:decoded,raw}
}
function publicViews(run:GameRun){
 const course=projectCourse(run,campaignCourse),video=projectVideo(run,campaignVideo)
 check(course&&video,'PUBLIC_COURSE_AND_VIDEO_REQUIRED');return {course,video,story:projectStory(run,campaignStory)}
}
function committedInput(file:string,commit:string){
 const raw=fixedInputText(file),committed=execFileSync('rtk',['proxy','git','show',commit+':'+file],{cwd:root,maxBuffer:32*1024*1024})
 check(sha(raw)===sha(committed),'COMMITTED_ORIGINAL_INPUT_ANCHOR_CHANGED:'+file);return raw
}
const prefixSummary=JSON.parse(committedInput(prefixDirectory+'/course-prefix-results.json',prerequisiteCommit)) as PrefixSummary
const readiness=JSON.parse(committedInput(readinessDirectory+'/course-prefix-readiness.json',prerequisiteCommit)) as Readiness
const anchoredInputs=Object.fromEntries([prefixDirectory+'/course-prefix-results.json',readinessDirectory+'/course-prefix-readiness.json'].map(file=>[file,sourceInputHashes[file]!]))
check(prefixSummary.registered===6&&prefixSummary.completed===6&&prefixSummary.allExecutedBytesEqual&&prefixSummary.fullMatrixRegistered===378&&prefixSummary.fullMatrixBranchesExecuted===0,'SIX_ORIGINAL_REPLAYED_P1_PREFIXES_REQUIRED')
check(readiness.inputDirectory===prefixDirectory&&readiness.registered===6&&readiness.ready===6&&readiness.notReady===0&&readiness.fullMatrixBranchesExecuted===0,'SIX_FIXED_READINESS_PREFIXES_REQUIRED')
check(canonicalJson(prefixSummary.sourceHashes)===canonicalJson(readiness.sourceHashes),'P1_READINESS_RUNTIME_BINDING_CHANGED')
for(const [file,hash]of Object.entries(prefixSummary.sourceHashes))check(sha(readFileSync(safeProjectFile(file).physical))===hash,'P1_RUNTIME_SOURCE_CHANGED:'+file)
for(const [file,hash]of Object.entries(readiness.inputHashes))check(sha(fixedInputText(file))===hash,'P1_READINESS_INPUT_CHANGED:'+file)
check(sha(readFileSync(join(root,'scripts/verify_course_prefix_readiness.ts')))===readiness.verifierSha256,'P1_READINESS_VERIFIER_SOURCE_CHANGED')
const identities:Identity[]=['technical_employee','content_employee'].flatMap(backgroundId=>['t16-campaign-0','t16-campaign-1','t16-campaign-2'].map(seed=>({name:backgroundId+'-'+seed,backgroundId,seed})))
check(COURSE_SHAPES.length===48&&new Set(COURSE_SHAPES.map(shape=>shape.id)).size===48,'FORTY_EIGHT_UNIQUE_ORIGINAL_SHAPES_REQUIRED')
const shapes=COURSE_SHAPES.filter(shape=>shape.supportMode==='delegated_group')
check(shapes.length===12&&shapes.every(shape=>(COURSE_SHAPES.indexOf(shape)+1)%4===0),'EXACT_ORIGINAL_TWELVE_DELEGATED_SHAPES_REQUIRED')
check(prefixSummary.results.length===6&&new Set(prefixSummary.results.map(row=>row.name)).size===6&&readiness.rows.length===6&&new Set(readiness.rows.map(row=>row.name)).size===6,'EXACT_SIX_P1_ROWS_REQUIRED')
const loadedPrefixes=new Map<string,{row:PrefixRow;initial:string;final:string;milestones:Map<number,string>}>()
for(const identity of identities){
 const row=prefixSummary.results.find(value=>value.name===identity.name),ready=readiness.rows.find(value=>value.name===identity.name)
 check(row&&row.backgroundId===identity.backgroundId&&row.seed===identity.seed&&row.status==='completed'&&row.fullCreateAndMilestoneBytesEqual,'ORIGINAL_FIXED_PREFIX_IDENTITY_REQUIRED:'+identity.name)
 check(ready?.ready&&ready.rawSha256===row.final.sha256,'EXACT_PREFIX_READINESS_REQUIRED:'+identity.name)
 check(row.milestones.length===25,'ALL_TWENTY_FIVE_ORIGINAL_P1_MILESTONES_REQUIRED:'+identity.name)
 const initial=originalRaw(prefixDirectory,row.initial),final=originalRaw(prefixDirectory,row.final),milestones=new Map<number,string>()
 for(const milestone of row.milestones){
  const raw=originalRaw(prefixDirectory,milestone),old=milestones.get(milestone.revision)
  check(old===undefined||old===raw,'P1_MILESTONE_REVISION_CHANGED:'+identity.name);milestones.set(milestone.revision,raw)
 }
 loadedPrefixes.set(identity.name,{row,initial,final,milestones})
}
for(const name of ['registration.json','course-shape-results.json'])committedInput(originalDirectory+'/'+name,originalMatrixCommit)
const registered:Registration[]=identities.flatMap(identity=>shapes.map(shape=>{
 const originalFolder=identity.name+'/shape-'+String(COURSE_SHAPES.indexOf(shape)+1).padStart(2,'0')
 const file=originalDirectory+'/'+originalFolder+'/shape-evidence.json',raw=committedInput(file,originalMatrixCommit)
 const old=JSON.parse(raw) as {identity?:unknown;shape?:unknown;status?:unknown}
 check(old.identity===identity.name&&canonicalJson(old.shape)===canonicalJson(shape)&&old.status==='policy_refused','EXACT_ORIGINAL_DELEGATED_REFUSAL_ROW_REQUIRED:'+file)
 return {rowId:identity.name+'--'+shape.id,identity:identity.name,backgroundId:identity.backgroundId,seed:identity.seed,shape,folder:originalFolder,originalRow:{file,bytes:Buffer.byteLength(raw),sha256:sha(raw),rowId:originalFolder,commit:originalMatrixCommit,status:'policy_refused'}}
}))
check(registered.length===72&&new Set(registered.map(row=>row.rowId)).size===72,'EXACT_72_DELEGATED_REGISTRATION_REQUIRED')
const paths=[...sourceFiles('src/core'),...sourceFiles('src/application'),...sourceFiles('src/content'),...sourceFiles('src/persistence'),...Object.keys(prefixSummary.sourceHashes),'src/testing/story-harness.ts','src/testing/course-shape-scenario.ts','src/testing/course-delegated-scenario.ts','src/testing/course-shape-assertions.ts','scripts/collect_course_shape_evidence.ts','scripts/collect_course_delegated_evidence.ts','scripts/verify_course_delegated_evidence.ts','scripts/verify_course_prefix_readiness.ts','scripts/evidence_xz_bundle.py','scripts/evidence-output.ts','scripts/video-shape-output.ts','package.json','package-lock.json','tsconfig.json','tsconfig.core.json','tsconfig.app.json','tsconfig.node.json',...strategyFiles]
const sourceHashes=Object.fromEntries([...new Set(paths)].sort().map(file=>[file,sha(readFileSync(safeProjectFile(file).physical))]))
const guardSources=()=>{for(const [file,hash]of Object.entries({...sourceHashes,...sourceInputHashes}))check(sha(readFileSync(safeProjectFile(file).physical))===hash,'DELEGATED_SOURCE_OR_ORIGINAL_INPUT_DRIFT:'+file)}
saveJson('registration.json',{
 scope:'P2-S2: only the original twelve delegated course shapes by the same six earned normal identities. Original 288 results remain unchanged.',
 baseCommit:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),prefixDirectory,readinessDirectory,originalDirectory,prerequisiteCommit,originalMatrixCommit,anchoredInputs,sourceInputHashes,sourceHashes,
 strategyFiles,strategyTexts:Object.fromEntries(strategyFiles.map(file=>[file,readFileSync(join(root,file),'utf8')])),registered,delegatedRegistered:72,originalCoreRegistered:288,fullMatrixRegistered:378,criticalRegistered:90,criticalBranchesExecuted:0,
 rawEncoding:'Self-contained course-evidence-bundle-v1 XZ: exact prefix, every actual milestone, terminal, full record JSON, and the original attempt journal. Raw references are member/bytes/sha256; external indexes alone describe archives.',
 fatalPolicy:'Persist every attempt before execution. Retain partial logs and raw members on any failure, including mkdir/harness/terminal/archive/index errors. Unknown errors stop subsequent rows, which remain unexecuted_due_to_fatal. No replacement seed or overwrite.',
 positivePolicy:'Actual enrollment, both delivered stages, original delegated job completed, closed refund/fee window and at least one retained helped learner. Completed business with zero helped learners is not positive. Later public risk control is recorded separately; year-end monitoring does not prove all external responsibility restored.',
 notCovered:['original P3 90 critical branches','P4','browser persistence or visuals','compatibility (currently prohibited)','human playtests','original missing PNG bytes','whole 5b/T17/QX/goal completion']
})
saveText('progress.jsonl','')
const progress=(value:unknown)=>{appendFileSync(writablePath('progress.jsonl'),JSON.stringify(value)+'\n');console.log(JSON.stringify(value))}
const codec=createCampaignCodec()
const normalizedCommands=(commands:readonly CommandEnvelope[])=>commands.map(command=>({...command,payload:codec.registry.normalize(command.kind,command.payload)}))
function companyTrace(run:GameRun,baseline:PublicCourse){
 const current=projectCourse(run,campaignCourse);check(current,'PUBLIC_COURSE_TRACE_REQUIRED')
 return current.businesses.map(business=>{const before=baseline.businesses.find(row=>row.id===business.id);return {businessId:business.id,accountId:business.accountId,funds:business.funds,metrics:business.metrics,deltaCostFen:business.metrics.costFen-(before?.metrics.costFen??0),deltaAccruedCostFen:business.metrics.accruedCostFen-(before?.metrics.accruedCostFen??0),deltaIncomeFen:business.metrics.incomeFen-(before?.metrics.incomeFen??0)}})
}
function rejectedReason(error:unknown,command:CommandEnvelope):string[]|null{
 try{
  const value=JSON.parse(error instanceof Error?error.message:String(error)) as {kind?:unknown;payload?:unknown;result?:{status?:unknown;reasonCodes?:unknown}}
  if(value.kind===command.kind&&canonicalJson(value.payload)===canonicalJson(command.payload)&&value.result?.status==='rejected'&&Array.isArray(value.result.reasonCodes)&&value.result.reasonCodes.every((reason):reason is string=>typeof reason==='string'))return value.result.reasonCodes
 }catch{/* An exception is not evidence of an authoritative command rejection. */}
 return null
}
class RecordingHarness extends DelegatedCourseHarness{
 readonly attempts:ActualAttempt[]=[]
 readonly trace:unknown[]=[]
 readonly baseline:PublicCourse
 readonly folder:string
 constructor(prefix:GameRun,folder:string){
  super({priorRun:prefix});this.folder=folder;this.baseline=publicViews(prefix).course
  saveText(folder+'/command-attempts.jsonl','')
 }
 override sendAs(kind:string,payload:unknown,commandId:string){
  const command=JSON.parse(canonicalJson({...this.command(kind,payload),commandId})) as CommandEnvelope
  const before=this.run,attempt:ActualAttempt={index:this.attempts.length,command,sourceRevision:before.revision,sourceDate:before.timeline.cursor.date,status:'attempted',revisionAfter:null,dateAfter:null,reasonCodes:null,error:null}
  this.attempts.push(attempt)
  appendFileSync(writablePath(this.folder+'/command-attempts.jsonl'),JSON.stringify({event:'attempt',...attempt})+'\n')
  let result:GameRun
  try{
   result=super.sendAs(kind,payload,commandId)
  }catch(error){
   attempt.error=String(error);attempt.reasonCodes=rejectedReason(error,command)
   attempt.status=this.run.receipts.at(-1)?.commandId===commandId&&this.run.revision>before.revision?'committed_with_exception':attempt.reasonCodes?'rejected':'exception'
   attempt.revisionAfter=this.run.revision;attempt.dateAfter=this.run.timeline.cursor.date
   appendFileSync(writablePath(this.folder+'/command-attempts.jsonl'),JSON.stringify({event:'result',...attempt})+'\n')
   throw error
  }
  // Logging/projection failures are wrapper failures, not a second engine result.
  attempt.status='committed';attempt.revisionAfter=result.revision;attempt.dateAfter=result.timeline.cursor.date
  appendFileSync(writablePath(this.folder+'/command-attempts.jsonl'),JSON.stringify({event:'result',...attempt})+'\n')
  this.trace.push({commandId,kind,revision:result.revision,date:result.timeline.cursor.date,phase:result.timeline.cursor.phase,actionBudget:actionBudget(result.economy,result.timeline.cursor.date),accounts:result.controlledAccountIds.map(accountId=>({accountId,...accountPosition(result.economy.ledger,accountId)})),companies:companyTrace(result,this.baseline)})
  if(this.attempts.length%10===0)progress({type:'actual-command',folder:this.folder,kind,revision:result.revision,date:result.timeline.cursor.date,suffixAttempts:this.attempts.length})
  return result
 }
}
function putMember(members:Map<string,string>,name:string,raw:string):RawMember{
 check(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)&&!members.has(name),'UNIQUE_FLAT_RAW_MEMBER_REQUIRED:'+name)
 members.set(name,raw);return {member:name,bytes:Buffer.byteLength(raw),sha256:sha(raw)}
}
function archiveMembers(folder:string,members:Map<string,string>):ArchiveDescriptor{
 const file=folder+'/case-evidence.xz',absolute=writablePath(file)
 const container=JSON.stringify({format:'course-evidence-bundle-v1',members:[...members].map(([name,raw])=>({name,raw}))})
 const stdout=execFileSync('rtk',['proxy','python3','scripts/evidence_xz_bundle.py','pack','--output',absolute],{cwd:root,input:container,encoding:'utf8',maxBuffer:32*1024*1024})
 const descriptor=JSON.parse(stdout) as ArchiveDescriptor
 check(descriptor.encoding==='xz'&&descriptor.file===basename(absolute),'XZ_EXTERNAL_DESCRIPTOR_REQUIRED')
 check(descriptor.containerBytes===Buffer.byteLength(container)&&descriptor.containerSha256===sha(container),'XZ_CONTAINER_IDENTITY_CHANGED')
 check(canonicalJson(descriptor.members)===canonicalJson([...members].map(([name,raw])=>({name,bytes:Buffer.byteLength(raw),sha256:sha(raw)}))),'XZ_MEMBER_SET_OR_ORIGINAL_BYTES_CHANGED')
 const stored=readFileSync(absolute);check(stored.length===descriptor.storedBytes&&sha(stored)===descriptor.storedSha256,'XZ_STORED_BYTES_CHANGED')
 return descriptor
}
function earnedPrefix(identity:Identity,folder:string){
 guardSources()
 const input=loadedPrefixes.get(identity.name);check(input,'REGISTERED_P1_INPUT_REQUIRED')
 const actual=codec.import(input.final)
 check(codec.export(actual)===input.final&&actual.origin==='normal'&&actual.backgroundId===identity.backgroundId&&actual.seed===identity.seed&&actual.timeline.cursor.date==='2025-04-08'&&actual.phase==='playing','STRICT_NORMAL_PREFIX_REQUIRED')
 check(canonicalJson(commandsOf(actual))===canonicalJson(input.row.commands),'RECORDED_P1_COMMANDS_CHANGED')
 const first=actual.receipts[0];check(first,'ORIGINAL_CREATE_RECEIPT_REQUIRED')
 let replay=createCampaignRun({runId:actual.runId,actorId:actual.actorId,commandId:first.commandId,backgroundId:actual.backgroundId,seed:actual.seed,playerProfile:actual.playerProfile}),replayRaw=codec.export(replay)
 check(replayRaw===input.initial,'P1_ORIGINAL_CREATE_BYTES_MISMATCH')
 const initial=saveRaw(folder+'/create-initial.json',replayRaw),matchedRevisions=new Set<number>()
 const compareMilestone=()=>{const expected=input.milestones.get(replay.revision);if(expected!==undefined){check(expected===replayRaw,'P1_CREATE_MILESTONE_BYTES_MISMATCH:'+replay.revision);matchedRevisions.add(replay.revision)}}
 compareMilestone()
 try{
  for(const command of input.row.commands){
   const result=evaluateCommand(replay,command,codec.registry,replay.actorId)
   check(result.status==='proposed','P1_CREATE_COMMAND_REJECTED:'+JSON.stringify({command,result}))
   const strict=strictRoundTrip(result.nextRun,codec);replay=strict.run;replayRaw=strict.raw;compareMilestone()
  }
  check(replayRaw===input.final&&matchedRevisions.size===input.milestones.size,'P1_FULL_CREATE_OR_MILESTONE_BYTES_MISMATCH')
  const views=publicViews(replay)
  check(canonicalJson(views.course)===canonicalJson(input.row.publicCourse)&&canonicalJson(views.video)===canonicalJson(input.row.publicVideo)&&canonicalJson(views.story)===canonicalJson(input.row.publicStory),'P1_REPLAY_PUBLIC_PROJECTION_MISMATCH')
  guardSources()
  const proof=saveJson(folder+'/prefix-create-replay.json',{...identity,status:'verified',inputFinal:input.row.final,initial,final:saveRaw(folder+'/earned-prefix.json',replayRaw),commands:input.row.commands,milestones:input.row.milestones,matchedRevisions:[...matchedRevisions],fullCreateAndEveryP1MilestoneBytesEqual:true})
  return {run:replay,raw:replayRaw,commands:input.row.commands,views,proof}
 }catch(error){
  saveJson(folder+'/prefix-create-replay.json',{...identity,status:'fatal',error:String(error),initial,partial:saveRaw(folder+'/prefix-replay-partial.json',replayRaw),replayedThroughRevision:replay.revision,matchedRevisions:[...matchedRevisions],inputFinal:input.row.final});throw error
 }
}

const results:ResultRow[]=[],prefixProofs:unknown[]=[]
let fatal:string|null=null
for(const identity of identities){
 let prefix:ReturnType<typeof earnedPrefix>|null=null
 if(!fatal){
  try{
   makeDirectory(identity.name);progress({type:'prefix-create-start',...identity});prefix=earnedPrefix(identity,identity.name)
   prefixProofs.push({identity:identity.name,status:'verified',revision:prefix.run.revision,commands:prefix.commands.length,rawSha256:sha(prefix.raw),evidence:prefix.proof});progress({type:'prefix-create-verified',identity:identity.name,revision:prefix.run.revision,commands:prefix.commands.length})
  }catch(error){
   fatal=String(error);prefixProofs.push({identity:identity.name,status:'fatal',error:fatal})
   try{progress({type:'prefix-create-fatal',identity:identity.name,error:fatal})}catch(loggingError){console.error(JSON.stringify({type:'prefix-fatal-logging-error',identity:identity.name,error:String(loggingError),originalError:fatal}))}
  }
 }
 for(const registration of registered.filter(row=>row.identity===identity.name)){
  const {shape,folder}=registration
  const result:ResultRow={rowId:registration.rowId,identity:identity.name,shape,folder,originalRow:registration.originalRow,status:'unexecuted_due_to_fatal',error:fatal??'NO_VERIFIED_EARNED_PREFIX',suffixCommands:0,actualRejectedCommands:0,suffixReplayBytesEqual:false,rejectedReplayEqual:false,actualClosedShape:false,enrolledStudents:0,helpedRetainedStudents:0,positiveDelegatedBusiness:false,businessCompletedAt:null,monitoringComplete:false,revision:null,date:null,evidence:null,archive:null,recovery:null}
  results.push(result)
  if(fatal||!prefix)continue
  const earned=prefix,members=new Map<string,string>(),prefixCohorts=new Set(earned.views.course.cohorts.map(cohort=>cohort.id)),milestones:ShapeMilestone[]=[],milestoneRaw=new Map<number,string>(),milestoneNames=new Set<string>()
  let h:RecordingHarness|null=null,executionStatus:ResultStatus='unexecuted_due_to_fatal',policyRefusal:{code:string;detail:unknown}|null=null,terminal:RawMember|null=null,recordedCase:RawMember|null=null
  let phase='before-case',rejectedReplayCount=0,replayedMilestoneRevisions:number[]=[]
  const earnedRaw=putMember(members,'earned-prefix.json',earned.raw)
  const captureTerminal=()=>{
   if(!h)return null
   const raw=codec.export(h.run)
   if(terminal){check(members.get(terminal.member)===raw,'TERMINAL_CHANGED_AFTER_CAPTURE');return terminal}
   terminal=putMember(members,executionStatus==='completed'?'final.json':'partial.json',raw);return terminal
  }
  const captureJournal=()=>{
   const file=join(output,folder,'command-attempts.jsonl')
   if(existsSync(file)&&!members.has('command-attempts.jsonl'))putMember(members,'command-attempts.jsonl',readFileSync(file,'utf8'))
  }
  const caseRecord=()=>{
   const actual=h?.run,views=actual?publicViews(actual):null,commands=actual?commandsOf(actual):[],suffix=commands.slice(earned.commands.length)
   return {...registration,status:result.status,executionStatus,error:result.error,policyRefusal,origin:actual?.origin??null,runId:actual?.runId??null,revision:actual?.revision??null,date:actual?.timeline.cursor.date??null,
    terminalSource:actual?{revision:actual.revision,date:actual.timeline.cursor.date}:null,
    earnedPrefix:{input:loadedPrefixes.get(identity.name)!.row.final,raw:earnedRaw,rawSha256:sha(earned.raw),revision:earned.run.revision,fromCreateVerified:true,proof:earned.proof},terminal,
    commands,suffixCommands:suffix,harnessRecordedSuffix:h?.commands.slice(earned.commands.length)??[],actualAttempts:h?.attempts??[],attempts:h?.attempts??[],actualRejectedCommands:result.actualRejectedCommands,
    rawMembers:[...members].map(([member,raw])=>({member,bytes:Buffer.byteLength(raw),sha256:sha(raw)})),
    milestones,trace:h?.trace??[],riskTrace:h?.riskTrace??[],businessCompletedAt:h?.businessCompletedAt??null,monitoringComplete:h?.monitoringComplete??false,
    publicCourse:views?.course??null,publicVideo:views?.video??null,publicStory:views?.story??null,suffixReplayBytesEqual:result.suffixReplayBytesEqual,rejectedReplayEqual:result.rejectedReplayEqual,rejectedReplayCount,replayedMilestoneRevisions,
    actualClosedShape:result.actualClosedShape,enrolledStudents:result.enrolledStudents,helpedRetainedStudents:result.helpedRetainedStudents,positiveDelegatedBusiness:result.positiveDelegatedBusiness,prefixUnchanged:codec.export(earned.run)===earned.raw,
    scope:'One original delegated shape from an independently earned fixed normal prefix. Exact raw members are complete, not a projection of hidden state. Positive business and later public risk outcomes are distinct; no guarantee of profit, universal learning, or externally restored authority.'}
  }
  try{
   guardSources();phase='mkdir';makeDirectory(folder);progress({type:'shape-start',rowId:registration.rowId,identity:identity.name,shape:shape.id,originalRow:registration.originalRow.rowId})
   phase='harness';h=new RecordingHarness(codec.import(earned.raw),folder);result.status='completed';result.error=null
   phase='actual-scenario';executionStatus='completed'
   try{
    runDelegatedCourseShape(h,shape,{milestone(name,run){
     check(name.length>0&&!milestoneNames.has(name),'UNIQUE_ACTUAL_SHAPE_MILESTONE_REQUIRED');milestoneNames.add(name)
     const raw=codec.export(run),old=milestoneRaw.get(run.revision);check(old===undefined||old===raw,'SHAPE_MILESTONE_REVISION_CHANGED');milestoneRaw.set(run.revision,raw)
     const stored=putMember(members,'milestone-'+String(milestones.length+1).padStart(2,'0')+'.json',raw)
     const entry:ShapeMilestone={name,revision:run.revision,date:run.timeline.cursor.date,raw:stored,moneyEvidence:[],cashEvidence:[],independentMoneyStatus:'pending',independentMoneyError:null};milestones.push(entry)
     try{
      for(const cohort of run.course?.cohorts??[])if(!prefixCohorts.has(cohort.id))entry.moneyEvidence.push(assertCourseMoney(run,cohort.id))
      for(const business of earned.views.course.businesses)entry.cashEvidence.push(assertCourseCashDelta(earned.run,run,business.accountId))
      entry.independentMoneyStatus='passed'
     }catch(caught){entry.independentMoneyStatus='failed';entry.independentMoneyError=String(caught);throw caught}
     progress({type:'actual-shape-milestone',rowId:registration.rowId,identity:identity.name,shape:shape.id,name,revision:run.revision,date:run.timeline.cursor.date})
    }})
   }catch(caught){
    result.error=String(caught)
    if(caught instanceof CourseShapePolicyRefusal){result.status='policy_refused';policyRefusal={code:caught.code,detail:caught.detail}}
    else{result.status='fatal';fatal=result.error}
   }
   executionStatus=result.status;phase='terminal';captureTerminal();captureJournal()
   const actual=h.run,actualRaw=codec.export(actual),allActualCommands=commandsOf(actual),suffix=allActualCommands.slice(earned.commands.length)
   result.revision=actual.revision;result.date=actual.timeline.cursor.date;result.suffixCommands=suffix.length;result.actualRejectedCommands=h.attempts.filter(attempt=>attempt.status==='rejected').length
   result.businessCompletedAt=h.businessCompletedAt;result.monitoringComplete=h.monitoringComplete
   phase='exact-suffix-replay'
   let replayed=codec.import(earned.raw),replayRaw=earned.raw
   const replayedMilestones=new Set<number>(),acceptedReplayCommands:CommandEnvelope[]=[]
   check(codec.export(earned.run)===earned.raw,'EARNED_PREFIX_MUTATED')
   check(canonicalJson(allActualCommands.slice(0,earned.commands.length))===canonicalJson(earned.commands),'SHAPE_REWROTE_PREFIX_COMMANDS')
   check(canonicalJson(normalizedCommands(h.commands))===canonicalJson(allActualCommands),'HARNESS_COMMANDS_DISAGREE_WITH_ACTUAL_RECEIPTS')
   const compareMilestone=()=>{const expected=milestoneRaw.get(replayed.revision);if(expected!==undefined){check(expected===replayRaw,'ACTUAL_SHAPE_MILESTONE_REPLAY_MISMATCH:'+replayed.revision);replayedMilestones.add(replayed.revision)}}
   compareMilestone()
   for(const attempt of h.attempts){
    check(attempt.sourceRevision===replayed.revision&&attempt.sourceDate===replayed.timeline.cursor.date,'SUFFIX_ATTEMPT_SOURCE_CHANGED')
    const before=codec.export(replayed),evaluated=evaluateCommand(replayed,attempt.command,codec.registry,replayed.actorId)
    if(attempt.status==='rejected'){
     check(evaluated.status==='rejected'&&canonicalJson(evaluated.reasonCodes)===canonicalJson(attempt.reasonCodes),'ACTUAL_REJECTION_REPLAY_MISMATCH')
     check(codec.export(replayed)===before&&attempt.revisionAfter===replayed.revision&&attempt.dateAfter===replayed.timeline.cursor.date,'REJECTED_COMMAND_MUTATED_OR_CHANGED_IDENTITY');rejectedReplayCount++;continue
    }
    check(attempt.status==='committed'||attempt.status==='committed_with_exception','NON_COMMAND_EXCEPTION_IS_NOT_A_REPLAYED_REFUSAL:'+attempt.index)
    check(evaluated.status==='proposed','ACCEPTED_SUFFIX_REPLAY_REJECTED:'+JSON.stringify({command:attempt.command,result:evaluated}))
    const strict=strictRoundTrip(evaluated.nextRun,codec);replayed=strict.run;replayRaw=strict.raw;acceptedReplayCommands.push(attempt.command)
    check(replayed.revision===attempt.revisionAfter&&replayed.timeline.cursor.date===attempt.dateAfter,'ACTUAL_COMMAND_RESULT_IDENTITY_CHANGED');compareMilestone()
   }
   check(canonicalJson(normalizedCommands(acceptedReplayCommands))===canonicalJson(suffix),'ACTUAL_SUFFIX_COMMANDS_MISSING_OR_EXTRA')
   check(replayRaw===actualRaw&&replayedMilestones.size===milestoneRaw.size,'FINAL_SUFFIX_OR_MILESTONE_BYTES_MISMATCH')
   check(codec.export(earned.run)===earned.raw,'EARNED_PREFIX_CHANGED_AFTER_SUFFIX_REPLAY')
   result.suffixReplayBytesEqual=true;result.rejectedReplayEqual=rejectedReplayCount===result.actualRejectedCommands;replayedMilestoneRevisions=[...replayedMilestones]
   phase='public-business-and-terminal-money'
   const views=publicViews(actual),newCourses=views.course.courses.filter(course=>!earned.views.course.courses.some(old=>old.id===course.id)),newCohorts=views.course.cohorts.filter(cohort=>!prefixCohorts.has(cohort.id))
   for(const cohort of newCohorts)assertCourseMoney(actual,cohort.id)
   for(const business of earned.views.course.businesses)assertCourseCashDelta(earned.run,actual,business.accountId)
   result.enrolledStudents=newCohorts.reduce((sum,cohort)=>sum+cohort.students.length,0)
   result.actualClosedShape=newCourses.length===1&&newCourses[0]?.productId===shape.productId&&newCourses[0].topicId===shape.topicId&&newCourses[0].edition===shape.edition&&newCohorts.length===1&&newCohorts[0]?.courseId===newCourses[0].id&&newCohorts[0].students.length>0&&newCohorts[0].closedAt!==null&&newCohorts[0].stages.length===2&&newCohorts[0].stages.every(stage=>stage.deliveredAt!==null)&&newCohorts[0].supportJobs.some(slot=>!slot.recovery&&slot.mode==='delegated_group'&&slot.job?.status==='completed')
   result.helpedRetainedStudents=newCohorts.reduce((sum,cohort)=>sum+cohort.students.filter(student=>student.paidRemainingFen>0&&student.outcome==='helped'&&student.refundedFen===0).length,0)
   result.positiveDelegatedBusiness=result.actualClosedShape&&result.helpedRetainedStudents>0&&h.businessCompletedAt!==null
   if(result.status==='completed')check(result.actualClosedShape&&h.businessCompletedAt!==null,'COMPLETED_DELEGATED_SHAPE_MISSING_ACTUAL_ENROLLMENT_DELIVERY_ORIGINAL_SUPPORT_OR_CLOSE')
   if(result.status!=='fatal')check(h.monitoringComplete,'NONFATAL_CASE_MUST_COMPLETE_ACTUAL_YEAR_END_MONITORING')
   phase='source-after-case';guardSources()
   phase='case-record';recordedCase=putMember(members,'case-evidence.json',JSON.stringify(caseRecord(),null,2)+'\n')
   phase='archive';result.archive=archiveMembers(folder,members)
   phase='case-index';result.evidence=saveJson(folder+'/case-index.json',{...registration,status:result.status,error:result.error,revision:result.revision,date:result.date,archive:result.archive,terminal,caseEvidence:recordedCase,suffixCommands:result.suffixCommands,actualRejectedCommands:result.actualRejectedCommands,suffixReplayBytesEqual:result.suffixReplayBytesEqual,rejectedReplayEqual:result.rejectedReplayEqual,actualClosedShape:result.actualClosedShape,enrolledStudents:result.enrolledStudents,helpedRetainedStudents:result.helpedRetainedStudents,positiveDelegatedBusiness:result.positiveDelegatedBusiness,businessCompletedAt:result.businessCompletedAt,monitoringComplete:result.monitoringComplete})
   phase='after-index-source-guard';guardSources()
   progress({type:'shape-result',...result})
  }catch(caught){
   result.status='fatal';result.error=(result.error?result.error+'; ':'')+String(caught);fatal=result.error
   if(h){result.revision=h.run.revision;result.date=h.run.timeline.cursor.date;result.suffixCommands=commandsOf(h.run).length-earned.commands.length;result.actualRejectedCommands=h.attempts.filter(attempt=>attempt.status==='rejected').length;result.businessCompletedAt=h.businessCompletedAt;result.monitoringComplete=h.monitoringComplete}
   // Recovery is deliberately outside the success archive/index path. Existing artifacts
   // and their recorded status remain intact; the wrapper failure is an additional fact.
   try{
    if(!existsSync(join(output,folder)))makeDirectory(folder)
    captureTerminal();captureJournal()
    if(!recordedCase)recordedCase=putMember(members,'case-evidence.json',JSON.stringify(caseRecord(),null,2)+'\n')
    const failure={...registration,status:'fatal',phase,error:result.error,revision:result.revision,date:result.date,archive:result.archive,evidence:result.evidence,terminal,caseEvidence:recordedCase}
    putMember(members,'collector-failure.json',JSON.stringify(failure,null,2)+'\n')
    // Engine/audit failures still get a self-contained XZ when possible. A failed
    // archive is never retried in place or overwritten, even if its write was partial.
    if(!result.archive&&phase!=='archive'&&!existsSync(join(output,folder,'case-evidence.xz')))result.archive=archiveMembers(folder,members)
    if(result.archive&&!existsSync(join(output,folder,'case-index.json')))result.evidence=saveJson(folder+'/case-index.json',{...registration,status:'fatal',error:result.error,revision:result.revision,date:result.date,archive:result.archive,terminal,caseEvidence:recordedCase,suffixCommands:result.suffixCommands,actualRejectedCommands:result.actualRejectedCommands,suffixReplayBytesEqual:result.suffixReplayBytesEqual,rejectedReplayEqual:result.rejectedReplayEqual,actualClosedShape:result.actualClosedShape,enrolledStudents:result.enrolledStudents,helpedRetainedStudents:result.helpedRetainedStudents,positiveDelegatedBusiness:result.positiveDelegatedBusiness,businessCompletedAt:result.businessCompletedAt,monitoringComplete:result.monitoringComplete})
    // A failed pack/index must not lose the in-memory partial. This exceptional
    // recovery container preserves every exact string, including the original journal.
    if(!result.archive||!result.evidence)result.recovery=saveJson(folder+'/recovery-members.json',{format:'course-evidence-bundle-v1',members:[...members].map(([name,raw])=>({name,raw}))})
    saveJson(folder+'/case-failure.json',{...failure,recovery:result.recovery})
   }catch(preservationError){
    console.error(JSON.stringify({type:'fatal-partial-preservation-failed',rowId:registration.rowId,phase,error:String(preservationError),originalError:result.error,journal:folder+'/command-attempts.jsonl',registeredRowsRetained:true}))
    // Even recovery packing may fail. Keep the already captured original strings
    // independently; absent/unserializable snapshots stay absent rather than invented.
    try{
     captureJournal()
     if(!existsSync(join(output,folder,'recovery-members.json')))result.recovery=saveJson(folder+'/recovery-members.json',{format:'course-evidence-bundle-v1',members:[...members].map(([name,raw])=>({name,raw}))})
     if(!existsSync(join(output,folder,'case-failure.json')))saveJson(folder+'/case-failure.json',{...registration,status:'fatal',phase,error:result.error,preservationError:String(preservationError),revision:result.revision,date:result.date,archive:result.archive,evidence:result.evidence,recovery:result.recovery,terminal,caseEvidence:recordedCase})
    }catch(lastError){console.error(JSON.stringify({type:'fatal-recovery-write-failed',rowId:registration.rowId,error:String(lastError),originalError:result.error,registration:'registration.json',journal:folder+'/command-attempts.jsonl'}))}
   }
   try{progress({type:'shape-fatal',phase,...result})}catch(loggingError){console.error(JSON.stringify({type:'fatal-logging-failed',rowId:registration.rowId,error:String(loggingError),originalError:result.error}))}
  }
 }
}
let finalGuardError:string|null=null
try{guardSources()}catch(error){finalGuardError=String(error);fatal=fatal??finalGuardError}
check(results.length===72,'ALL_ORIGINAL_72_DELEGATED_ROWS_MUST_REMAIN_REGISTERED')
const shapeCoverage=shapes.map(shape=>{
 const matching=results.filter(row=>row.shape.id===shape.id)
 return {shape,registered:matching.length,completed:matching.filter(row=>row.status==='completed').length,policyRefused:matching.filter(row=>row.status==='policy_refused').length,fatal:matching.filter(row=>row.status==='fatal').length,unexecutedDueToFatal:matching.filter(row=>row.status==='unexecuted_due_to_fatal').length,actualClosedBusinesses:matching.filter(row=>row.status!=='fatal'&&row.actualClosedShape).length,positiveDelegatedBusinesses:matching.filter(row=>row.status!=='fatal'&&row.positiveDelegatedBusiness).length,hasActualClosedShape:matching.some(row=>row.status!=='fatal'&&row.actualClosedShape),hasRetainedHelpedLearner:matching.some(row=>row.status!=='fatal'&&row.positiveDelegatedBusiness),monitoringCompleted:matching.filter(row=>row.monitoringComplete).length}
})
const summary={
 scope:'Only P2-S2 original twelve delegated shapes × six unchanged normal identities. Original 288 results, P3/P4 and whole T17/goal responsibilities are preserved. Later risk control and actual business completion are independently reported.',
 registered:72,recorded:results.length,attempted:results.filter(row=>row.status!=='unexecuted_due_to_fatal').length,completed:results.filter(row=>row.status==='completed').length,policyRefused:results.filter(row=>row.status==='policy_refused').length,fatal:results.filter(row=>row.status==='fatal').length,fatalError:fatal,finalGuardError,unexecutedDueToFatal:results.filter(row=>row.status==='unexecuted_due_to_fatal').length,
 actualAcceptedSuffixCommands:results.reduce((sum,row)=>sum+row.suffixCommands,0),actualRejectedCommands:results.reduce((sum,row)=>sum+row.actualRejectedCommands,0),allExecutedSuffixBytesEqual:results.filter(row=>row.status!=='unexecuted_due_to_fatal').every(row=>row.suffixReplayBytesEqual&&row.rejectedReplayEqual),
 actualClosedBusinesses:results.filter(row=>row.status!=='fatal'&&row.actualClosedShape).length,positiveDelegatedBusinesses:results.filter(row=>row.status!=='fatal'&&row.positiveDelegatedBusiness).length,monitoringCompleted:results.filter(row=>row.monitoringComplete).length,all12HaveActualClosedShape:shapeCoverage.every(row=>row.hasActualClosedShape),all12HaveRetainedHelpedLearner:shapeCoverage.every(row=>row.hasRetainedHelpedLearner),
 originalCoreRegistered:288,fullMatrixRegistered:378,criticalRegistered:90,criticalBranchesExecuted:0,prefixProofs,shapeCoverage,sourceHashes,sourceInputHashes,results
}
try{
 saveJson('course-delegated-results.json',summary)
 progress({type:'complete',registered:summary.registered,attempted:summary.attempted,completed:summary.completed,policyRefused:summary.policyRefused,fatal:summary.fatal,unexecutedDueToFatal:summary.unexecutedDueToFatal,positiveDelegatedBusinesses:summary.positiveDelegatedBusinesses,monitoringCompleted:summary.monitoringCompleted,allExecutedSuffixBytesEqual:summary.allExecutedSuffixBytesEqual,all12HaveRetainedHelpedLearner:summary.all12HaveRetainedHelpedLearner})
}catch(error){console.error(JSON.stringify({type:'summary-write-fatal',error:String(error),registered:72,recorded:results.length,registration:'registration.json'}));process.exitCode=1}
if(fatal||summary.fatal||summary.unexecutedDueToFatal||!summary.allExecutedSuffixBytesEqual||!summary.all12HaveRetainedHelpedLearner)process.exitCode=1
