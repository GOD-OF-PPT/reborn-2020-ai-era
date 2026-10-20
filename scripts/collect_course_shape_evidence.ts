import {appendFileSync,mkdirSync,readFileSync,readdirSync,realpathSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {isAbsolute,join,relative,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {gzipSync,gunzipSync} from 'node:zlib'
import {evidenceDirectory} from './evidence-output.ts'
import {assertFreshVideoEvidencePath as assertFreshCourseEvidencePath} from './video-shape-output.ts'
import {COURSE_SHAPES,CourseShapePolicyRefusal,runCourseShape,type CourseShape} from '../src/testing/course-shape-scenario.ts'
import {assertCourseCashDelta,assertCourseMoney} from '../src/testing/course-shape-assertions.ts'
import {StoryHarness} from '../src/testing/story-harness.ts'
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
interface Identity{name:string;backgroundId:string;seed:string}
type AttemptStatus='attempted'|'committed'|'rejected'|'exception'|'committed_with_exception'
interface ActualAttempt{
 index:number;command:CommandEnvelope;sourceRevision:number;sourceDate:string
 status:AttemptStatus;revisionAfter:number|null;dateAfter:string|null;reasonCodes:string[]|null;error:string|null
}
type PublicCourse=NonNullable<ReturnType<typeof projectCourse>>
type MoneyEvidence=ReturnType<typeof assertCourseMoney>
interface ShapeMilestone{
 name:string;revision:number;date:string;raw:GzipRaw;moneyEvidence:MoneyEvidence[]
 cashEvidence:ReturnType<typeof assertCourseCashDelta>[]
 independentMoneyStatus:'pending'|'passed'|'failed';independentMoneyError:string|null
}
type ResultStatus='completed'|'policy_refused'|'fatal'|'unexecuted_due_to_fatal'

function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
const root=realpathSync(fileURLToPath(new URL('../',import.meta.url)))
assertFreshCourseEvidencePath(root,process.argv.slice(2))
const output=evidenceDirectory(root,'course-shape-results.json')
check(readdirSync(output).length===0,'EMPTY_FRESH_COURSE_SHAPE_OUTPUT_REQUIRED')
const prefixDirectory='goal-1/evidence/t17-acceptance-05/prefix-r1'
const readinessDirectory='goal-1/evidence/t17-acceptance-05/readiness-r1'
const prerequisiteCommit='1938030714f5318287910a5f57d976c412d553b9'
const policyFile='goal-1/evidence/t17-acceptance-06/policy-r1.md'
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex')
const sourceInputHashes:Record<string,string>={}
function safeProjectFile(file:string){
 check(!isAbsolute(file),'PROJECT_RELATIVE_FILE_REQUIRED')
 const physical=realpathSync(resolve(root,file)),name=relative(root,physical).split('\\').join('/')
 check(name!==''&&name!=='..'&&!name.startsWith('../')&&!isAbsolute(name),'PROJECT_FILE_ESCAPE')
 return {physical,name}
}
function inputText(file:string){
 const path=safeProjectFile(file)
 check(path.name.startsWith('goal-1/evidence/t17-acceptance-05/'),'FIXED_P1_INPUT_REQUIRED')
 const bytes=readFileSync(path.physical);sourceInputHashes[path.name]=sha(bytes);return bytes.toString('utf8')
}
function originalRaw(base:string,descriptor:OriginalRaw){
 check(typeof descriptor.file==='string'&&typeof descriptor.sha256==='string'&&Number.isSafeInteger(descriptor.bytes),'P1_RAW_DESCRIPTOR_REQUIRED')
 const file=join(base,descriptor.file),raw=inputText(file)
 check(sha(raw)===descriptor.sha256&&Buffer.byteLength(raw)===descriptor.bytes,'P1_ORIGINAL_RAW_BYTES_CHANGED:'+file)
 return raw
}
function saveJson(name:string,value:unknown){
 const raw=JSON.stringify(value,null,2)+'\n';writeFileSync(join(output,name),raw,{flag:'wx'})
 return {file:name,bytes:Buffer.byteLength(raw),sha256:sha(raw)}
}
/** Compression retains every original byte; readback is checked before advertising the artifact. */
function saveRaw(name:string,raw:string):GzipRaw{
 const file=name+'.gz',original=Buffer.from(raw,'utf8'),stored=gzipSync(original,{level:9})
 writeFileSync(join(output,file),stored,{flag:'wx'})
 const readback=readFileSync(join(output,file));check(readback.equals(stored),'GZIP_STORED_BYTES_CHANGED:'+file)
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
 const raw=codec.export(run),decoded=codec.import(raw);check(codec.export(decoded)===raw,'STRICT_COURSE_SHAPE_CODEC_BYTES_CHANGED');return {run:decoded,raw}
}
function publicViews(run:GameRun){
 const course=projectCourse(run,campaignCourse),video=projectVideo(run,campaignVideo)
 check(course&&video,'PUBLIC_COURSE_AND_VIDEO_REQUIRED')
 return {course,video,story:projectStory(run,campaignStory)}
}
const prefixSummary=JSON.parse(inputText(prefixDirectory+'/course-prefix-results.json')) as PrefixSummary
const readiness=JSON.parse(inputText(readinessDirectory+'/course-prefix-readiness.json')) as Readiness
const anchoredInputs:Record<string,string>={}
for(const file of [prefixDirectory+'/course-prefix-results.json',readinessDirectory+'/course-prefix-readiness.json']){
 const committed=execFileSync('rtk',['proxy','git','show',prerequisiteCommit+':'+file],{cwd:root,maxBuffer:32*1024*1024})
 const expected=sha(committed);check(sourceInputHashes[file]===expected,'P1_COMMITTED_INPUT_ANCHOR_CHANGED:'+file);anchoredInputs[file]=expected
}
check(prefixSummary.registered===6&&prefixSummary.completed===6&&prefixSummary.allExecutedBytesEqual&&prefixSummary.fullMatrixRegistered===378&&prefixSummary.fullMatrixBranchesExecuted===0,'SIX_ORIGINAL_REPLAYED_P1_PREFIXES_REQUIRED')
check(readiness.inputDirectory===prefixDirectory&&readiness.registered===6&&readiness.ready===6&&readiness.notReady===0&&readiness.fullMatrixBranchesExecuted===0,'SIX_FIXED_READINESS_PREFIXES_REQUIRED')
check(canonicalJson(prefixSummary.sourceHashes)===canonicalJson(readiness.sourceHashes),'P1_READINESS_RUNTIME_BINDING_CHANGED')
for(const [file,hash]of Object.entries(prefixSummary.sourceHashes))check(sha(readFileSync(safeProjectFile(file).physical))===hash,'P1_RUNTIME_SOURCE_CHANGED:'+file)
for(const [file,hash]of Object.entries(readiness.inputHashes))check(sha(inputText(file))===hash,'P1_READINESS_INPUT_CHANGED:'+file)
check(sha(readFileSync(join(root,'scripts/verify_course_prefix_readiness.ts')))===readiness.verifierSha256,'P1_READINESS_VERIFIER_SOURCE_CHANGED')

const identities:Identity[]=['technical_employee','content_employee'].flatMap(backgroundId=>['t16-campaign-0','t16-campaign-1','t16-campaign-2'].map(seed=>({name:backgroundId+'-'+seed,backgroundId,seed})))
const products=['intro_recorded','practical_cohort','enterprise_training'] as const,topics=['image_workflows','video_workflows'] as const,editions=['foundation','advanced'] as const,supports=['self_small','guided_group','assisted_group','delegated_group'] as const
check(COURSE_SHAPES.length===48&&new Set(COURSE_SHAPES.map(shape=>shape.id)).size===48,'FORTY_EIGHT_UNIQUE_ORIGINAL_SHAPES_REQUIRED')
const shapes:CourseShape[]=products.flatMap(productId=>topics.flatMap(topicId=>editions.flatMap(edition=>supports.map(supportMode=>{
 const matched=COURSE_SHAPES.filter(shape=>shape.productId===productId&&shape.topicId===topicId&&shape.edition===edition&&shape.supportMode===supportMode)
 check(matched.length===1&&matched[0],'ORIGINAL_COURSE_SHAPE_MISSING_OR_DUPLICATE');return matched[0]
}))))
check(prefixSummary.results.length===6&&new Set(prefixSummary.results.map(row=>row.name)).size===6&&readiness.rows.length===6&&new Set(readiness.rows.map(row=>row.name)).size===6,'EXACT_SIX_P1_ROWS_REQUIRED')
const loadedPrefixes=new Map<string,{row:PrefixRow;initial:string;final:string;milestones:Map<number,string>}>()
for(const identity of identities){
 const row=prefixSummary.results.find(value=>value.name===identity.name),ready=readiness.rows.find(value=>value.name===identity.name)
 check(row&&row.backgroundId===identity.backgroundId&&row.seed===identity.seed&&row.status==='completed'&&row.fullCreateAndMilestoneBytesEqual,'ORIGINAL_FIXED_PREFIX_IDENTITY_REQUIRED:'+identity.name)
 check(ready?.ready&&ready.rawSha256===row.final.sha256,'EXACT_PREFIX_READINESS_REQUIRED:'+identity.name)
 const initial=originalRaw(prefixDirectory,row.initial),final=originalRaw(prefixDirectory,row.final),milestones=new Map<number,string>()
 for(const milestone of row.milestones){
  const raw=originalRaw(prefixDirectory,milestone),old=milestones.get(milestone.revision)
  check(old===undefined||old===raw,'P1_MILESTONE_REVISION_CHANGED:'+identity.name)
  milestones.set(milestone.revision,raw)
 }
 loadedPrefixes.set(identity.name,{row,initial,final,milestones})
}
const paths=[...sourceFiles('src/core'),...sourceFiles('src/application'),...sourceFiles('src/content'),...sourceFiles('src/persistence'),...Object.keys(prefixSummary.sourceHashes),'src/testing/story-harness.ts','src/testing/course-shape-scenario.ts','src/testing/course-shape-assertions.ts','scripts/collect_course_shape_evidence.ts','scripts/verify_course_prefix_readiness.ts','scripts/evidence-output.ts','scripts/video-shape-output.ts','package.json','package-lock.json','tsconfig.json','tsconfig.core.json','tsconfig.app.json','tsconfig.node.json',policyFile]
const sourceHashes=Object.fromEntries([...new Set(paths)].sort().map(file=>[file,sha(readFileSync(safeProjectFile(file).physical))]))
const registered=identities.flatMap(identity=>shapes.map((shape,index)=>({identity:identity.name,backgroundId:identity.backgroundId,seed:identity.seed,shape,folder:identity.name+'/shape-'+String(index+1).padStart(2,'0')})))
check(registered.length===288,'EXACT_288_CORE_REGISTRATION_REQUIRED')
saveJson('registration.json',{scope:'T17 5b P2: 48 original core course shapes by six fixed actually earned normal identities, exactly 288 registered rows.',baseCommit:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),prefixDirectory,readinessDirectory,prerequisiteCommit,anchoredInputs,sourceInputHashes,sourceHashes,policyFile,policyText:readFileSync(join(root,policyFile),'utf8'),rawEncoding:'lossless gzip; every artifact records original and stored bytes/hash and is gunzipped after writing to compare all original bytes',registered,fullMatrixRegistered:378,coreRegistered:288,criticalRegistered:90,criticalBranchesExecuted:0,fatalPolicy:'Record the original attempted envelope, error, accepted suffix and current partial raw. Stop subsequent fixed rows on unknown errors; preserve their unexecuted_due_to_fatal registration. Never replace a seed or overwrite earlier output.',notCovered:['P3 90 critical branches','browser persistence or visuals','compatibility (currently prohibited)','human playtests','original missing PNG bytes','whole 5b/T17/QX/goal completion']})
writeFileSync(join(output,'progress.jsonl'),'',{flag:'wx'})
const progress=(value:unknown)=>{appendFileSync(join(output,'progress.jsonl'),JSON.stringify(value)+'\n');console.log(JSON.stringify(value))}
const codec=createCampaignCodec()
// Exact attempts and normalized authoritative receipts are both retained. Defaults are
// supplied only by the unchanged original registry, never by a hand-written projection.
const normalizedCommands=(commands:readonly CommandEnvelope[])=>commands.map(command=>({...command,payload:codec.registry.normalize(command.kind,command.payload)}))

function companyTrace(run:GameRun,baseline:PublicCourse){
 const current=projectCourse(run,campaignCourse);check(current,'PUBLIC_COURSE_TRACE_REQUIRED')
 return current.businesses.map(business=>{const before=baseline.businesses.find(row=>row.id===business.id);return {businessId:business.id,accountId:business.accountId,funds:business.funds,metrics:business.metrics,deltaCostFen:business.metrics.costFen-(before?.metrics.costFen??0),deltaAccruedCostFen:business.metrics.accruedCostFen-(before?.metrics.accruedCostFen??0),deltaIncomeFen:business.metrics.incomeFen-(before?.metrics.incomeFen??0)}})
}
function rejectedReason(error:unknown,command:CommandEnvelope):string[]|null{
 try{
  const value=JSON.parse(error instanceof Error?error.message:String(error)) as {kind?:unknown;payload?:unknown;result?:{status?:unknown;reasonCodes?:unknown}}
  if(value.kind===command.kind&&canonicalJson(value.payload)===canonicalJson(command.payload)&&value.result?.status==='rejected'&&Array.isArray(value.result.reasonCodes)&&value.result.reasonCodes.every((reason):reason is string=>typeof reason==='string'))return value.result.reasonCodes
 }catch{/* A non-command exception must remain fatal, never an invented refusal. */}
 return null
}
class RecordingHarness extends StoryHarness{
 readonly attempts:ActualAttempt[]=[]
 readonly trace:unknown[]=[]
 readonly baseline:PublicCourse
 readonly folder:string
 constructor(prefix:GameRun,folder:string){
  super({priorRun:prefix});this.folder=folder;this.baseline=publicViews(prefix).course
  writeFileSync(join(output,folder,'command-attempts.jsonl'),'',{flag:'wx'})
 }
 override sendAs(kind:string,payload:unknown,commandId:string){
  const command=JSON.parse(canonicalJson({...this.command(kind,payload),commandId})) as CommandEnvelope
  const before=this.run,attempt:ActualAttempt={index:this.attempts.length,command,sourceRevision:before.revision,sourceDate:before.timeline.cursor.date,status:'attempted',revisionAfter:null,dateAfter:null,reasonCodes:null,error:null}
  this.attempts.push(attempt)
  // Persist the exact attempted identity before calling any mutating command.
  appendFileSync(join(output,this.folder,'command-attempts.jsonl'),JSON.stringify({event:'attempt',...attempt})+'\n')
  try{
   const result=super.sendAs(kind,payload,commandId);attempt.status='committed';attempt.revisionAfter=result.revision;attempt.dateAfter=result.timeline.cursor.date
   appendFileSync(join(output,this.folder,'command-attempts.jsonl'),JSON.stringify({event:'result',...attempt})+'\n')
   this.trace.push({commandId,kind,revision:result.revision,date:result.timeline.cursor.date,phase:result.timeline.cursor.phase,actionBudget:actionBudget(result.economy,result.timeline.cursor.date),accounts:result.controlledAccountIds.map(accountId=>({accountId,...accountPosition(result.economy.ledger,accountId)})),companies:companyTrace(result,this.baseline)})
   if(this.attempts.length%10===0)progress({type:'actual-command',folder:this.folder,kind,revision:result.revision,date:result.timeline.cursor.date,suffixAttempts:this.attempts.length})
   return result
  }catch(error){
   attempt.error=String(error);attempt.reasonCodes=rejectedReason(error,command)
   attempt.status=this.run.receipts.at(-1)?.commandId===commandId&&this.run.revision>before.revision?'committed_with_exception':attempt.reasonCodes?'rejected':'exception'
   attempt.revisionAfter=this.run.revision;attempt.dateAfter=this.run.timeline.cursor.date
   appendFileSync(join(output,this.folder,'command-attempts.jsonl'),JSON.stringify({event:'result',...attempt})+'\n')
   throw error
  }
 }
}

function earnedPrefix(identity:Identity,folder:string){
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
  saveJson(folder+'/prefix-create-replay.json',{...identity,status:'verified',inputFinal:input.row.final,initial,final:saveRaw(folder+'/earned-prefix.json',replayRaw),commands:input.row.commands,milestones:input.row.milestones,matchedRevisions:[...matchedRevisions],fullCreateAndEveryP1MilestoneBytesEqual:true})
  return {run:replay,raw:replayRaw,commands:input.row.commands,views}
 }catch(error){
  saveJson(folder+'/prefix-create-replay.json',{...identity,status:'fatal',error:String(error),initial,partial:saveRaw(folder+'/prefix-replay-partial.json',replayRaw),replayedThroughRevision:replay.revision,matchedRevisions:[...matchedRevisions],inputFinal:input.row.final})
  throw error
 }
}

const results:{identity:string;shape:CourseShape;status:ResultStatus;error:string|null;suffixCommands:number;actualRejectedCommands:number;suffixReplayBytesEqual:boolean;actualClosedShape:boolean;helpedRetainedStudents:number;evidence:{file:string;bytes:number;sha256:string}|null}[]=[]
const prefixProofs:unknown[]=[]
let fatal:string|null=null
for(const identity of identities){
 let prefix:ReturnType<typeof earnedPrefix>|null=null
 if(!fatal){
  mkdirSync(join(output,identity.name));progress({type:'prefix-create-start',...identity})
  try{prefix=earnedPrefix(identity,identity.name);prefixProofs.push({identity:identity.name,status:'verified',revision:prefix.run.revision,commands:prefix.commands.length,rawSha256:sha(prefix.raw)});progress({type:'prefix-create-verified',identity:identity.name,revision:prefix.run.revision,commands:prefix.commands.length})}
  catch(error){fatal=String(error);prefixProofs.push({identity:identity.name,status:'fatal',error:fatal});progress({type:'prefix-create-fatal',identity:identity.name,error:fatal})}
 }
 for(const registration of registered.filter(row=>row.identity===identity.name)){
  const {shape,folder}=registration
  if(fatal||!prefix){results.push({identity:identity.name,shape,status:'unexecuted_due_to_fatal',error:fatal??'NO_VERIFIED_EARNED_PREFIX',suffixCommands:0,actualRejectedCommands:0,suffixReplayBytesEqual:false,actualClosedShape:false,helpedRetainedStudents:0,evidence:null});continue}
  mkdirSync(join(output,folder));progress({type:'shape-start',identity:identity.name,shape:shape.id})
  const h=new RecordingHarness(codec.import(prefix.raw),folder),prefixCohorts=new Set(prefix.views.course.cohorts.map(cohort=>cohort.id)),milestones:ShapeMilestone[]=[],milestoneRaw=new Map<number,string>(),milestoneNames=new Set<string>()
  let status:ResultStatus='completed',error:string|null=null,policyRefusal:{code:string;detail:unknown}|null=null
  try{
   runCourseShape(h,shape,{milestone(name,run){
    check(name.length>0&&!milestoneNames.has(name),'UNIQUE_ACTUAL_SHAPE_MILESTONE_REQUIRED');milestoneNames.add(name)
    const raw=codec.export(run),old=milestoneRaw.get(run.revision);check(old===undefined||old===raw,'SHAPE_MILESTONE_REVISION_CHANGED');milestoneRaw.set(run.revision,raw)
    const stored=saveRaw(folder+'/milestone-'+String(milestones.length+1).padStart(2,'0')+'.json',raw)
    const entry:ShapeMilestone={name,revision:run.revision,date:run.timeline.cursor.date,raw:stored,moneyEvidence:[],cashEvidence:[],independentMoneyStatus:'pending',independentMoneyError:null}
    milestones.push(entry)
    try{
     for(const cohort of run.course?.cohorts??[])if(!prefixCohorts.has(cohort.id))entry.moneyEvidence.push(assertCourseMoney(run,cohort.id))
     for(const business of prefix!.views.course.businesses)entry.cashEvidence.push(assertCourseCashDelta(prefix!.run,run,business.accountId))
     entry.independentMoneyStatus='passed'
    }catch(caught){entry.independentMoneyStatus='failed';entry.independentMoneyError=String(caught);throw caught}
    progress({type:'actual-shape-milestone',identity:identity.name,shape:shape.id,name,revision:run.revision,date:run.timeline.cursor.date})
   }})
  }catch(caught){
   error=String(caught)
   if(caught instanceof CourseShapePolicyRefusal){status='policy_refused';policyRefusal={code:caught.code,detail:caught.detail}}
   else{status='fatal';fatal=error}
  }
  const executionStatus=status,actual=h.run,actualRaw=codec.export(actual),allActualCommands=commandsOf(actual),suffix=allActualCommands.slice(prefix.commands.length)
  const terminal=saveRaw(folder+'/'+(executionStatus==='completed'?'final':'partial')+'.json',actualRaw)
  let suffixReplayBytesEqual=false,rejectedReplayEqual=false,rejectedReplayCount=0,replayed=codec.import(prefix.raw),replayRaw=prefix.raw
  const replayedMilestones=new Set<number>(),acceptedReplayCommands:CommandEnvelope[]=[]
  try{
   check(codec.export(prefix.run)===prefix.raw,'EARNED_PREFIX_MUTATED')
   check(canonicalJson(allActualCommands.slice(0,prefix.commands.length))===canonicalJson(prefix.commands),'SHAPE_REWROTE_PREFIX_COMMANDS')
   check(canonicalJson(normalizedCommands(h.commands))===canonicalJson(allActualCommands),'HARNESS_COMMANDS_DISAGREE_WITH_ACTUAL_RECEIPTS')
   for(const attempt of h.attempts){
    check(attempt.sourceRevision===replayed.revision&&attempt.sourceDate===replayed.timeline.cursor.date,'SUFFIX_ATTEMPT_SOURCE_CHANGED')
    const before=codec.export(replayed),result=evaluateCommand(replayed,attempt.command,codec.registry,replayed.actorId)
    if(attempt.status==='rejected'){
     check(result.status==='rejected'&&canonicalJson(result.reasonCodes)===canonicalJson(attempt.reasonCodes),'ACTUAL_REJECTION_REPLAY_MISMATCH')
     check(codec.export(replayed)===before,'REJECTED_COMMAND_MUTATED_PREFIX');rejectedReplayCount++;continue
    }
    if(attempt.status!=='committed'&&attempt.status!=='committed_with_exception'){rejectedReplayEqual=false;throw Error('NON_COMMAND_EXCEPTION_IS_NOT_A_REPLAYED_REFUSAL:'+attempt.index)}
    check(result.status==='proposed','ACCEPTED_SUFFIX_REPLAY_REJECTED:'+JSON.stringify({command:attempt.command,result}))
    const strict=strictRoundTrip(result.nextRun,codec);replayed=strict.run;replayRaw=strict.raw;acceptedReplayCommands.push(attempt.command)
    check(replayed.revision===attempt.revisionAfter&&replayed.timeline.cursor.date===attempt.dateAfter,'ACTUAL_COMMAND_RESULT_IDENTITY_CHANGED')
    const expected=milestoneRaw.get(replayed.revision);if(expected!==undefined){check(expected===replayRaw,'ACTUAL_SHAPE_MILESTONE_REPLAY_MISMATCH:'+replayed.revision);replayedMilestones.add(replayed.revision)}
   }
   check(canonicalJson(normalizedCommands(acceptedReplayCommands))===canonicalJson(suffix),'ACTUAL_SUFFIX_COMMANDS_MISSING_OR_EXTRA')
   check(replayRaw===actualRaw&&replayedMilestones.size===milestoneRaw.size,'FINAL_SUFFIX_OR_MILESTONE_BYTES_MISMATCH')
   check(codec.export(prefix.run)===prefix.raw,'EARNED_PREFIX_CHANGED_AFTER_SUFFIX_REPLAY');suffixReplayBytesEqual=true;rejectedReplayEqual=rejectedReplayCount===h.attempts.filter(attempt=>attempt.status==='rejected').length
  }catch(caught){status='fatal';error=(error?error+'; ':'')+String(caught);fatal=error}
  const views=publicViews(actual),newCourses=views.course.courses.filter(course=>!prefix!.views.course.courses.some(old=>old.id===course.id)),newCohorts=views.course.cohorts.filter(cohort=>!prefixCohorts.has(cohort.id))
  const actualClosedShape=newCourses.length===1&&newCourses[0]?.productId===shape.productId&&newCourses[0].topicId===shape.topicId&&newCourses[0].edition===shape.edition&&newCohorts.length===1&&newCohorts[0]?.courseId===newCourses[0].id&&newCohorts[0].closedAt!==null&&newCohorts[0].stages.every(stage=>stage.deliveredAt!==null)&&newCohorts[0].supportJobs.some(slot=>!slot.recovery&&slot.mode===shape.supportMode&&slot.job?.status==='completed')
  const helpedRetainedStudents=newCohorts.reduce((sum,cohort)=>sum+cohort.students.filter(student=>student.paidRemainingFen>0&&student.outcome==='helped'&&student.refundedFen===0).length,0)
  if(status==='completed'&&!actualClosedShape){status='fatal';error='COMPLETED_SHAPE_MISSING_ORIGINAL_ACTUAL_DELIVERY_SUPPORT_OR_CLOSE';fatal=error}
  const record={...registration,status,executionStatus,error,policyRefusal,origin:actual.origin,runId:actual.runId,revision:actual.revision,date:actual.timeline.cursor.date,earnedPrefix:{input:loadedPrefixes.get(identity.name)!.row.final,rawSha256:sha(prefix.raw),revision:prefix.run.revision,fromCreateVerified:true},terminal,suffixCommands:suffix,harnessRecordedSuffix:h.commands.slice(prefix.commands.length),actualAttempts:h.attempts,actualRejectedCommands:h.attempts.filter(attempt=>attempt.status==='rejected').length,milestones,trace:h.trace,publicCourse:views.course,publicVideo:views.video,publicStory:views.story,suffixReplayBytesEqual,rejectedReplayEqual,rejectedReplayCount,replayedMilestoneRevisions:[...replayedMilestones],actualClosedShape,helpedRetainedStudents,prefixUnchanged:codec.export(prefix.run)===prefix.raw,scope:'One original course shape from the actually earned fixed normal prefix. Lossless whole raw records are stored; public trace does not extract hidden facts, profiles or learning rolls. A closed shape is not a guarantee of profit, learning for every student, or safe external control.'}
  const evidence=saveJson(folder+'/shape-evidence.json',record)
  results.push({identity:identity.name,shape,status,error,suffixCommands:suffix.length,actualRejectedCommands:record.actualRejectedCommands,suffixReplayBytesEqual,actualClosedShape,helpedRetainedStudents,evidence})
  progress({type:'shape-result',identity:identity.name,shape:shape.id,status,error,revision:actual.revision,date:actual.timeline.cursor.date,suffixCommands:suffix.length,actualRejectedCommands:record.actualRejectedCommands,suffixReplayBytesEqual,actualClosedShape,helpedRetainedStudents})
 }
}
for(const [file,hash]of Object.entries({...sourceHashes,...sourceInputHashes}))check(sha(readFileSync(safeProjectFile(file).physical))===hash,'COURSE_SHAPE_SOURCE_OR_P1_INPUT_DRIFT:'+file)
check(results.length===288,'ALL_ORIGINAL_288_ROWS_MUST_REMAIN_REGISTERED')
const shapeCoverage=shapes.map(shape=>{const matching=results.filter(row=>row.shape.id===shape.id);return {shape,registered:matching.length,completed:matching.filter(row=>row.status==='completed').length,policyRefused:matching.filter(row=>row.status==='policy_refused').length,fatal:matching.filter(row=>row.status==='fatal').length,unexecutedDueToFatal:matching.filter(row=>row.status==='unexecuted_due_to_fatal').length,hasActualClosedShape:matching.some(row=>row.status==='completed'&&row.actualClosedShape),hasRetainedHelpedLearner:matching.some(row=>row.status==='completed'&&row.actualClosedShape&&row.helpedRetainedStudents>0)}})
const summary={scope:'P2 288 original fixed core course rows only. Whole Create prefixes and accepted/rejected suffix attempts are independently checked against complete original bytes. P3 and whole 5b/T17/QX/goal remain pending.',registered:288,recorded:results.length,attempted:results.filter(row=>row.status!=='unexecuted_due_to_fatal').length,completed:results.filter(row=>row.status==='completed').length,policyRefused:results.filter(row=>row.status==='policy_refused').length,fatal:results.filter(row=>row.status==='fatal').length,unexecutedDueToFatal:results.filter(row=>row.status==='unexecuted_due_to_fatal').length,actualAcceptedSuffixCommands:results.reduce((sum,row)=>sum+row.suffixCommands,0),actualRejectedCommands:results.reduce((sum,row)=>sum+row.actualRejectedCommands,0),allExecutedSuffixBytesEqual:results.filter(row=>row.status!=='unexecuted_due_to_fatal').every(row=>row.suffixReplayBytesEqual),all48HaveActualClosedShape:shapeCoverage.every(row=>row.hasActualClosedShape),all48HaveRetainedHelpedLearner:shapeCoverage.every(row=>row.hasRetainedHelpedLearner),fullMatrixRegistered:378,criticalRegistered:90,criticalBranchesExecuted:0,prefixProofs,shapeCoverage,sourceHashes,sourceInputHashes,results}
saveJson('course-shape-results.json',summary)
progress({type:'complete',registered:summary.registered,attempted:summary.attempted,completed:summary.completed,policyRefused:summary.policyRefused,fatal:summary.fatal,unexecutedDueToFatal:summary.unexecutedDueToFatal,allExecutedSuffixBytesEqual:summary.allExecutedSuffixBytesEqual,all48HaveActualClosedShape:summary.all48HaveActualClosedShape})
if(summary.fatal||summary.unexecutedDueToFatal||!summary.allExecutedSuffixBytesEqual||summary.completed===0)process.exitCode=1
