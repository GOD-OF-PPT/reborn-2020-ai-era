import {appendFileSync,existsSync,lstatSync,readFileSync,readdirSync,realpathSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {dirname,isAbsolute,join,relative,resolve,sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import {gunzipSync} from 'node:zlib'
import {evidenceDirectory} from './evidence-output.ts'
import {assertFreshVideoEvidencePath} from './video-shape-output.ts'
import {createCampaignCodec,createCampaignRun,campaignCourse,campaignVideo,campaignStory} from '../src/application/campaign.ts'
import {projectCourse} from '../src/core/course-projection.ts'
import {projectVideo} from '../src/core/video-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {canonicalJson} from '../src/core/identity.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {actionBudget} from '../src/core/economy.ts'
import {addDays,quarterOf} from '../src/core/calendar.ts'
import {STORY_CONTENT} from '../src/content/story.ts'
import {COURSE_SHAPES,type CourseShape} from '../src/testing/course-shape-scenario.ts'
import {assertCourseCashDelta,assertCourseMoney} from '../src/testing/course-shape-assertions.ts'
import type {CommandEnvelope,GameRun} from '../src/core/run-types.ts'

type JsonObject=Record<string,unknown>
interface FileRef{file:string;bytes:number;sha256:string}
interface MemberRef{member:string;bytes:number;sha256:string}
interface ArchiveRef{encoding:'xz';file:string;storedBytes:number;storedSha256:string;containerBytes:number;containerSha256:string;members:{name:string;bytes:number;sha256:string}[]}
interface Identity{name:string;backgroundId:string;seed:string}
interface RegisteredRow{rowId:string;identity:string;backgroundId:string;seed:string;shape:CourseShape;folder:string;originalRow:FileRef&{rowId:string;commit:string;status:string}}
interface PrefixRow{name:string;backgroundId:string;seed:string;status:string;initial:FileRef;final:FileRef;commands:CommandEnvelope[];milestones:(FileRef&{name:string;revision:number;date:string})[];publicCourse:unknown;publicVideo:unknown;publicStory:unknown}
interface Attempt{index:number;command:CommandEnvelope;sourceRevision:number;sourceDate:string;status:string;revisionAfter:number|null;dateAfter:string|null;reasonCodes:string[]|null;error:string|null}
interface Milestone{name:string;revision:number;date:string;raw:MemberRef;moneyEvidence:unknown[];cashEvidence:unknown[]}
interface EarnedPrefix{run:GameRun;raw:string;row:PrefixRow;milestones:number;readiness:unknown}
interface CaseAudit{rowId:string;identity:string;shape:CourseShape;status:'verified'|'missing'|'partial'|'invalid';sourceStatus:string|null;executionStatus:string|null;error:string|null;accepted:number;rejected:number;actualClosedShape:boolean;positiveDelegatedBusiness:boolean;helpedRetainedStudents:number;monitoringComplete:boolean;proof:FileRef|null}

function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
function object(value:unknown,code:string):JsonObject{check(value!==null&&typeof value==='object'&&!Array.isArray(value),code);return value as JsonObject}
function list(value:unknown,code:string):unknown[]{check(Array.isArray(value),code);return value}
function text(value:unknown,code:string):string{check(typeof value==='string',code);return value}
function integer(value:unknown,code:string):number{check(typeof value==='number'&&Number.isSafeInteger(value)&&value>=0,code);return value}
function hashText(value:unknown,code:string):string{const hash=text(value,code);check(/^[a-f0-9]{64}$/.test(hash),code);return hash}
function hashMap(value:unknown,code:string):Record<string,string>{return Object.fromEntries(Object.entries(object(value,code)).map(([file,hash])=>[file,hashText(hash,code+':'+file)]))}
function same(actual:unknown,expected:unknown,code:string){check(canonicalJson(actual)===canonicalJson(expected),code)}
function unique(values:readonly string[],code:string){check(new Set(values).size===values.length,code)}
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex')
const root=realpathSync(fileURLToPath(new URL('../',import.meta.url)))
const prefixDirectory='goal-1/evidence/t17-acceptance-05/prefix-r1'
const readinessFile='goal-1/evidence/t17-acceptance-05/readiness-r1/course-prefix-readiness.json'
const prefixCommit='1938030714f5318287910a5f57d976c412d553b9'
const originalDirectory='goal-1/evidence/t17-acceptance-06/matrix-r2'
const originalCommit='0679d645da0a41cb1d84551ed638dcae44a38f52'
const MAX_CONTAINER_BYTES=256*1024*1024
const MAX_MEMBER_BYTES=12*1024*1024
const identities:Identity[]=['technical_employee','content_employee'].flatMap(backgroundId=>['t16-campaign-0','t16-campaign-1','t16-campaign-2'].map(seed=>({name:backgroundId+'-'+seed,backgroundId,seed})))
const codec=createCampaignCodec()
const inputHashes:Record<string,string>={}
const sourceHashes:Record<string,string>={}
const setupErrors:string[]=[]
const prefixes=new Map<string,EarnedPrefix>()
const prefixAudits:unknown[]=[]
const rows:CaseAudit[]=[]

/** Lexical scope and every physical ancestor are checked before reading evidence. */
function projectFile(file:string,scope?:string){
 check(file!==''&&!isAbsolute(file)&&!/[\r\n\0]/.test(file),'PROJECT_RELATIVE_FILE_REQUIRED')
 const path=resolve(root,file),name=relative(root,path).split(sep).join('/')
 check(name===file&&name!==''&&!name.startsWith('../')&&name!=='..','NONCANONICAL_PROJECT_FILE:'+file)
 if(scope)check(name.startsWith(scope+'/'),'EVIDENCE_INPUT_SCOPE_ESCAPE:'+file)
 let cursor=path
 for(;;){check(!lstatSync(cursor).isSymbolicLink(),'EVIDENCE_SYMLINK:'+file);if(cursor===root)break;const parent=dirname(cursor);check(parent!==cursor,'PROJECT_ANCESTOR_ESCAPE');cursor=parent}
 check(lstatSync(path).isFile(),'REGULAR_EVIDENCE_FILE_REQUIRED:'+file)
 check(realpathSync(path)===path,'PHYSICAL_EVIDENCE_PATH_CHANGED:'+file)
 return path
}
function readBytes(file:string,scope?:string){const bytes=readFileSync(projectFile(file,scope));inputHashes[file]=sha(bytes);return bytes}
function readText(file:string,scope?:string){const bytes=readBytes(file,scope),raw=bytes.toString('utf8');check(Buffer.from(raw,'utf8').equals(bytes),'EVIDENCE_MUST_BE_EXACT_UTF8:'+file);return raw}
function readJson(file:string,scope?:string){return object(JSON.parse(readText(file,scope)),'JSON_OBJECT_REQUIRED:'+file)}
function fileRef(value:unknown):FileRef{const ref=object(value,'FILE_DESCRIPTOR_REQUIRED');return {file:text(ref.file,'FILE_NAME_REQUIRED'),bytes:integer(ref.bytes,'FILE_BYTES_REQUIRED'),sha256:hashText(ref.sha256,'FILE_SHA_REQUIRED')}}
function memberRef(value:unknown):MemberRef{const ref=object(value,'MEMBER_DESCRIPTOR_REQUIRED');return {member:text(ref.member,'MEMBER_NAME_REQUIRED'),bytes:integer(ref.bytes,'MEMBER_BYTES_REQUIRED'),sha256:hashText(ref.sha256,'MEMBER_SHA_REQUIRED')}}
function readOriginal(base:string,ref:FileRef){const raw=readText(base+'/'+ref.file,base);check(Buffer.byteLength(raw)===ref.bytes&&sha(raw)===ref.sha256,'ORIGINAL_FILE_BYTES_CHANGED:'+ref.file);return raw}
function outputFile(file:string){
 const path=resolve(output,file),name=relative(output,path)
 check(name!==''&&name!=='..'&&!name.startsWith('..'+sep)&&!isAbsolute(name),'AUDIT_OUTPUT_ESCAPE')
 let ancestor=dirname(path)
 for(;;){const info=lstatSync(ancestor);check(info.isDirectory()&&!info.isSymbolicLink(),'AUDIT_OUTPUT_PARENT_SYMLINK');check(!existsSync(join(ancestor,'sealed-evidence.json')),'AUDIT_OUTPUT_PARENT_SEALED');if(ancestor===root)break;const parent=dirname(ancestor);check(parent!==ancestor,'AUDIT_OUTPUT_ANCESTOR_ESCAPE');ancestor=parent}
 if(existsSync(path))check(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink(),'AUDIT_OUTPUT_FILE_SYMLINK')
 return path
}
function saveJson(file:string,value:unknown):FileRef{const raw=JSON.stringify(value,null,2)+'\n';writeFileSync(outputFile(file),raw,{flag:'wx'});return {file,bytes:Buffer.byteLength(raw),sha256:sha(raw)}}
function snapshotDirectory(directory:string):Record<string,string>{
 const result:Record<string,string>={}
 function visit(dir:string){for(const entry of readdirSync(join(root,dir),{withFileTypes:true})){const file=dir+'/'+entry.name;check(!entry.isSymbolicLink(),'INPUT_TREE_SYMLINK:'+file);if(entry.isDirectory())visit(file);else{check(entry.isFile(),'INPUT_TREE_NONREGULAR:'+file);result[file]=sha(readFileSync(projectFile(file)))}}}
 visit(directory);return result
}
function productionFiles(directory:string):string[]{return readdirSync(join(root,directory),{withFileTypes:true}).flatMap(entry=>{check(!entry.isSymbolicLink(),'SOURCE_SYMLINK');return entry.isDirectory()?productionFiles(directory+'/'+entry.name):entry.name.endsWith('.ts')&&!entry.name.includes('.test.')?[directory+'/'+entry.name]:[]})}
function anchored(file:string,commit:string,scope:string){const raw=readBytes(file,scope),committed=execFileSync('rtk',['proxy','git','show',commit+':'+file],{cwd:root,maxBuffer:64*1024*1024});check(raw.equals(committed),'COMMITTED_INPUT_ANCHOR_CHANGED:'+file);return object(JSON.parse(raw.toString('utf8')),'ANCHORED_JSON_OBJECT_REQUIRED')}
function commandsOf(run:GameRun):CommandEnvelope[]{return run.receipts.slice(1).map(receipt=>({...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}))}
function commandList(value:unknown):CommandEnvelope[]{return list(value,'COMMAND_ARRAY_REQUIRED').map(value=>{const command=object(value,'COMMAND_ENVELOPE_REQUIRED');text(command.runId,'COMMAND_RUN_REQUIRED');text(command.actorId,'COMMAND_ACTOR_REQUIRED');text(command.commandId,'COMMAND_ID_REQUIRED');text(command.kind,'COMMAND_KIND_REQUIRED');integer(command.expectedRevision,'COMMAND_REVISION_REQUIRED');check(Object.hasOwn(command,'payload'),'COMMAND_PAYLOAD_REQUIRED');return command as unknown as CommandEnvelope})}
const normalized=(commands:readonly CommandEnvelope[])=>commands.map(command=>({...command,payload:codec.registry.normalize(command.kind,command.payload)}))
function strictRaw(raw:string,code:string){const run=codec.import(raw);check(codec.export(run)===raw,'STRICT_CODEC_ORIGINAL_BYTES_CHANGED:'+code);return run}
function views(run:GameRun){const course=projectCourse(run,campaignCourse),video=projectVideo(run,campaignVideo);check(course&&video,'PUBLIC_COURSE_VIDEO_REQUIRED');return {course,video,story:projectStory(run,campaignStory)}}
function roundTrip(run:GameRun){const raw=codec.export(run);return {raw,run:strictRaw(raw,'replayed-revision-'+run.revision)}}

function readinessOf(run:GameRun){
 const {course,video,story}=views(run)
 const topics=(['image_workflows','video_workflows'] as const).map(topic=>{
  const foundation=course.courses.find(c=>c.topicId===topic&&c.edition==='foundation'),studies=course.studies.filter(s=>s.predecessorId===foundation?.id&&s.completedAt!==null&&s.job?.status==='completed')
  check(foundation&&foundation.graduateCount>0&&studies.some(s=>s.members.length>0),'ACTUAL_GRADUATION_AND_NEW_DEMAND_REQUIRED:'+topic)
  return {topic,foundationId:foundation.id,graduates:foundation.graduateCount,studies:studies.map(s=>({id:s.id,members:s.members.length,completedAt:s.completedAt,jobId:s.job!.id}))}
 })
 const business=course.businesses.find(b=>b.lifecycle==='operating');check(business,'OPERATING_COURSE_COMPANY_REQUIRED')
 const first=course.cases.filter(c=>c.kind==='first_order'),licensed=course.cases.filter(c=>c.kind==='video'&&c.licensed&&course.licenses.some(l=>l.businessId===business.id&&l.caseId===c.id&&l.job?.status==='completed'))
 check(first.length>0&&licensed.length>0,'TWO_ACTUALLY_PAID_CASES_AND_COMPANY_MATERIAL_RIGHTS_REQUIRED')
 const deployment=story.deployments.find(d=>d.businessId===business.id&&d.lifecycle==='active'&&d.activeFrom!==null&&d.currentGrant?.level==='approval'&&d.currentGrant.scopes.includes('course_support')&&!d.currentGrant.externalDelegation)
 check(deployment?.observedBusinessResult,'ACTUAL_APPROVAL_ASSISTED_BUSINESS_RESULT_REQUIRED')
 const assisted=deployment.supportResults.filter(r=>r.mode==='assisted_group'&&r.status==='completed'&&(r.actualCostFen<r.manualCostFen||r.completeAt<addDays(r.startAt,r.manualDays)))
 check(assisted.length>0,'ACTUAL_ASSISTED_COST_OR_TIME_ADVANTAGE_REQUIRED')
 return {topics,businessId:business.id,accountId:business.accountId,firstPaidCaseIds:first.map(c=>c.id),licensedPaidVideoCaseIds:licensed.map(c=>c.id),actualPaidVideoCases:video.contracts.filter(c=>c.paidCase).map(c=>({id:c.id,paymentAt:c.paymentAt})),approvalDeploymentId:deployment.id,actualAssistedResults:assisted}
}

function earnPrefixes(registration:JsonObject){
 check(registration.prefixDirectory===prefixDirectory&&registration.readinessDirectory==='goal-1/evidence/t17-acceptance-05/readiness-r1'&&registration.prerequisiteCommit===prefixCommit,'FIXED_P1_INPUTS_REQUIRED')
 const summary=anchored(prefixDirectory+'/course-prefix-results.json',prefixCommit,'goal-1/evidence/t17-acceptance-05'),readiness=anchored(readinessFile,prefixCommit,'goal-1/evidence/t17-acceptance-05')
 check(summary.registered===6&&summary.completed===6&&summary.fullMatrixRegistered===378&&summary.fullMatrixBranchesExecuted===0,'ORIGINAL_SIX_PREFIX_REGISTRATION_REQUIRED')
 check(readiness.inputDirectory===prefixDirectory&&readiness.registered===6&&readiness.ready===6&&readiness.notReady===0,'FIXED_SIX_READINESS_REQUIRED')
 same(summary.sourceHashes,readiness.sourceHashes,'PREFIX_READINESS_SOURCE_BINDING_CHANGED')
 for(const [file,hash] of Object.entries(hashMap(summary.sourceHashes,'PREFIX_SOURCE_HASHES_REQUIRED')))check(sha(readFileSync(projectFile(file)))===hash,'PREFIX_RUNTIME_CHANGED:'+file)
 for(const [file,hash] of Object.entries(hashMap(readiness.inputHashes,'READINESS_INPUT_HASHES_REQUIRED')))check(sha(readBytes(file,'goal-1/evidence/t17-acceptance-05'))===hash,'READINESS_INPUT_CHANGED:'+file)
 check(sha(readFileSync(projectFile('scripts/verify_course_prefix_readiness.ts')))===readiness.verifierSha256,'READINESS_VERIFIER_SOURCE_CHANGED')
 const inputRows=list(summary.results,'PREFIX_RESULTS_REQUIRED').map(value=>object(value,'PREFIX_ROW_REQUIRED'))
 const readyRows=list(readiness.rows,'READINESS_ROWS_REQUIRED').map(value=>object(value,'READINESS_ROW_REQUIRED'))
 check(inputRows.length===6&&readyRows.length===6,'EXACT_SIX_PREFIX_ROWS_REQUIRED');unique(inputRows.map(row=>text(row.name,'PREFIX_IDENTITY_REQUIRED')),'DUPLICATE_PREFIX');unique(readyRows.map(row=>text(row.name,'READY_IDENTITY_REQUIRED')),'DUPLICATE_READY_PREFIX')
 for(const identity of identities){
  try{
   const value=inputRows.find(row=>row.name===identity.name),ready=readyRows.find(row=>row.name===identity.name)
   check(value&&value.backgroundId===identity.backgroundId&&value.seed===identity.seed&&value.status==='completed','FIXED_NORMAL_PREFIX_REQUIRED:'+identity.name)
   const row=value as unknown as PrefixRow
   const initial=readOriginal(prefixDirectory,fileRef(row.initial)),final=readOriginal(prefixDirectory,fileRef(row.final)),actual=strictRaw(final,identity.name)
   strictRaw(initial,identity.name+':Create')
   check(ready?.ready===true&&ready.rawSha256===sha(final),'READINESS_EXACT_RAW_REQUIRED')
   check(actual.origin==='normal'&&actual.phase==='playing'&&actual.backgroundId===identity.backgroundId&&actual.seed===identity.seed&&actual.timeline.cursor.date==='2025-04-08','PREFIX_NORMAL_IDENTITY_OR_DATE_CHANGED')
   const commands=commandList(row.commands);same(commandsOf(actual),commands,'P1_AUTHORITATIVE_COMMANDS_CHANGED')
   const milestones=list(row.milestones,'P1_MILESTONES_REQUIRED').map(value=>{const milestone=object(value,'P1_MILESTONE_REQUIRED'),ref=fileRef(value);return {...ref,name:text(milestone.name,'P1_MILESTONE_NAME_REQUIRED'),revision:integer(milestone.revision,'P1_MILESTONE_REVISION_REQUIRED'),date:text(milestone.date,'P1_MILESTONE_DATE_REQUIRED'),raw:readOriginal(prefixDirectory,ref)}})
   check(milestones.length===25,'ALL_ORIGINAL_TWENTY_FIVE_P1_MILESTONES_REQUIRED')
   unique(milestones.map(m=>m.name),'DUPLICATE_P1_MILESTONE_NAME')
   const first=actual.receipts[0];check(first,'ACTUAL_CREATE_RECEIPT_REQUIRED')
   let replay=createCampaignRun({runId:actual.runId,actorId:actual.actorId,commandId:first.commandId,backgroundId:actual.backgroundId,seed:actual.seed,playerProfile:actual.playerProfile}),raw=codec.export(replay)
   check(raw===initial,'P1_CREATE_ORIGINAL_BYTES_CHANGED')
   const matched=new Set<string>()
   const compare=()=>{for(const milestone of milestones.filter(m=>m.revision===replay.revision)){check(milestone.date===replay.timeline.cursor.date&&milestone.raw===raw,'P1_EVERY_MILESTONE_BYTES_CHANGED:'+identity.name+':'+milestone.name);matched.add(milestone.name)}}
   compare()
   for(const command of commands){const result=evaluateCommand(replay,command,codec.registry,replay.actorId);check(result.status==='proposed','P1_EXACT_COMMAND_NOT_PROPOSED:'+command.commandId);const strict=roundTrip(result.nextRun);replay=strict.run;raw=strict.raw;compare()}
   check(raw===final&&matched.size===milestones.length,'P1_FULL_CREATE_AND_ALL_MILESTONES_REQUIRED')
   const publicViews=views(replay);same(publicViews.course,row.publicCourse,'P1_PUBLIC_COURSE_CHANGED');same(publicViews.video,row.publicVideo,'P1_PUBLIC_VIDEO_CHANGED');same(publicViews.story,row.publicStory,'P1_PUBLIC_STORY_CHANGED')
   const independentReadiness=readinessOf(replay)
   prefixes.set(identity.name,{run:replay,raw,row,milestones:milestones.length,readiness:independentReadiness})
   prefixAudits.push({...identity,status:'verified',initial:row.initial,final:row.final,commands:commands.length,milestones:matched.size,independentReadiness,fullCreateAndEveryOriginalMilestoneBytesEqual:true})
  }catch(error){prefixAudits.push({...identity,status:'invalid',error:String(error)});setupErrors.push('P1:'+identity.name+':'+String(error))}
 }
}

const inputArgument=process.env.COURSE_DELEGATED_INPUT_DIRECTORY
check(inputArgument,'EXPLICIT_COURSE_DELEGATED_INPUT_DIRECTORY_REQUIRED')
const inputPath=resolve(root,inputArgument),inputName=relative(root,inputPath).split(sep).join('/')
check(/^goal-1\/evidence\/t17-acceptance-08\/matrix-r[1-9][0-9]*$/.test(inputName),'FIXED_ROOT08_MATRIX_INPUT_REQUIRED')
check(realpathSync(inputPath)===inputPath&&!lstatSync(inputPath).isSymbolicLink(),'INPUT_DIRECTORY_SYMLINK_OR_ESCAPE')
assertFreshVideoEvidencePath(root,process.argv.slice(2))
const output=evidenceDirectory(root,'course-delegated-verification.json')
check(readdirSync(output).length===0,'EMPTY_FRESH_DELEGATED_VERIFICATION_OUTPUT_REQUIRED')
const outputFromInput=relative(inputPath,output)
check(outputFromInput==='..'||outputFromInput.startsWith('..'+sep)||isAbsolute(outputFromInput),'VERIFICATION_OUTPUT_MUST_NOT_BE_INSIDE_INPUT')
const inputTreeBefore=snapshotDirectory(inputName)
writeFileSync(outputFile('progress.jsonl'),'',{flag:'wx'})
const progress=(value:unknown)=>{appendFileSync(outputFile('progress.jsonl'),JSON.stringify(value)+'\n');console.log(JSON.stringify(value))}

function archiveRef(value:unknown):ArchiveRef{
 const ref=object(value,'XZ_DESCRIPTOR_REQUIRED');check(ref.encoding==='xz'&&ref.file==='case-evidence.xz','ORIGINAL_XZ_CASE_ARCHIVE_REQUIRED')
 const members=list(ref.members,'XZ_MEMBER_INDEX_REQUIRED').map(value=>{const member=object(value,'XZ_MEMBER_INDEX_ROW_REQUIRED');return {name:text(member.name,'XZ_MEMBER_INDEX_NAME_REQUIRED'),bytes:integer(member.bytes,'XZ_MEMBER_INDEX_BYTES_REQUIRED'),sha256:hashText(member.sha256,'XZ_MEMBER_INDEX_SHA_REQUIRED')}})
 unique(members.map(m=>m.name),'DUPLICATE_XZ_INDEX_MEMBER');check(members.length>0&&members.length<=512,'XZ_INDEX_MEMBER_LIMIT')
 return {encoding:'xz',file:ref.file,storedBytes:integer(ref.storedBytes,'XZ_STORED_BYTES_REQUIRED'),storedSha256:hashText(ref.storedSha256,'XZ_STORED_SHA_REQUIRED'),containerBytes:integer(ref.containerBytes,'XZ_CONTAINER_BYTES_REQUIRED'),containerSha256:hashText(ref.containerSha256,'XZ_CONTAINER_SHA_REQUIRED'),members}
}
function unpack(folder:string,descriptor:ArchiveRef){
 check(descriptor.storedBytes<=MAX_CONTAINER_BYTES+1024*1024&&descriptor.containerBytes<=MAX_CONTAINER_BYTES,'XZ_DECLARED_SIZE_LIMIT')
 const file=inputName+'/'+folder+'/'+descriptor.file,path=projectFile(file,inputName)
 check(lstatSync(path).size===descriptor.storedBytes,'XZ_ARCHIVE_SIZE_CHANGED:'+folder)
 const stored=readBytes(file,inputName);check(sha(stored)===descriptor.storedSha256,'XZ_ARCHIVE_BYTES_CHANGED:'+folder)
 const container=execFileSync('rtk',['proxy','python3',join(root,'scripts/evidence_xz_bundle.py'),'unpack','--input',path],{cwd:root,maxBuffer:MAX_CONTAINER_BYTES+1024*1024})
 check(container.length===descriptor.containerBytes&&sha(container)===descriptor.containerSha256,'XZ_CONTAINER_BYTES_CHANGED:'+folder)
 const raw=container.toString('utf8');check(Buffer.from(raw,'utf8').equals(container),'XZ_CONTAINER_UTF8_CHANGED')
 const bundle=object(JSON.parse(raw),'XZ_CONTAINER_OBJECT_REQUIRED');check(bundle.format==='course-evidence-bundle-v1','XZ_FORMAT_REQUIRED')
 same(Object.keys(bundle).sort(),['format','members'],'XZ_CONTAINER_EXTRA_FIELDS')
 const members=new Map<string,string>()
 for(const value of list(bundle.members,'XZ_MEMBERS_REQUIRED')){
  const member=object(value,'XZ_MEMBER_REQUIRED');same(Object.keys(member).sort(),['name','raw'],'XZ_MEMBER_EXTRA_FIELDS')
  const name=text(member.name,'XZ_MEMBER_NAME_REQUIRED'),valueRaw=text(member.raw,'XZ_MEMBER_RAW_REQUIRED')
  check(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)&&!members.has(name),'XZ_MEMBER_NAME_OR_DUPLICATE')
  check(Buffer.byteLength(valueRaw)<=MAX_MEMBER_BYTES,'XZ_MEMBER_SIZE_LIMIT')
  members.set(name,valueRaw)
 }
 same([...members.keys()].sort(),descriptor.members.map(m=>m.name).sort(),'XZ_EXACT_MEMBER_SET_CHANGED')
 for(const ref of descriptor.members){const member=members.get(ref.name);check(member!==undefined&&Buffer.byteLength(member)===ref.bytes&&sha(member)===ref.sha256,'XZ_ORIGINAL_MEMBER_BYTES_CHANGED:'+ref.name)}
 return members
}
function memberRaw(members:Map<string,string>,ref:MemberRef){const raw=members.get(ref.member);check(raw!==undefined&&Buffer.byteLength(raw)===ref.bytes&&sha(raw)===ref.sha256,'CASE_MEMBER_REFERENCE_CHANGED:'+ref.member);return raw}
function actualAttempts(value:unknown):Attempt[]{return list(value,'ACTUAL_ATTEMPTS_REQUIRED').map((value,index)=>{
 const attempt=object(value,'ATTEMPT_REQUIRED'),commands=commandList([attempt.command])
 check(attempt.index===index,'ATTEMPTS_MUST_HAVE_ORIGINAL_CONTIGUOUS_INDEX')
 const status=text(attempt.status,'ATTEMPT_STATUS_REQUIRED');check(['attempted','committed','rejected','exception','committed_with_exception'].includes(status),'UNKNOWN_ATTEMPT_STATUS')
 const reasonCodes=attempt.reasonCodes===null?null:list(attempt.reasonCodes,'REJECTION_REASONS_REQUIRED').map(reason=>text(reason,'REJECTION_REASON_REQUIRED'))
 check(commands[0],'EXACT_ATTEMPT_COMMAND_REQUIRED')
 return {index,command:commands[0],sourceRevision:integer(attempt.sourceRevision,'ATTEMPT_SOURCE_REVISION_REQUIRED'),sourceDate:text(attempt.sourceDate,'ATTEMPT_SOURCE_DATE_REQUIRED'),status,revisionAfter:attempt.revisionAfter===null?null:integer(attempt.revisionAfter,'ATTEMPT_RESULT_REVISION_REQUIRED'),dateAfter:attempt.dateAfter===null?null:text(attempt.dateAfter,'ATTEMPT_RESULT_DATE_REQUIRED'),reasonCodes,error:attempt.error===null?null:text(attempt.error,'ATTEMPT_ERROR_REQUIRED')}
})}
function auditJournal(raw:string,attempts:readonly Attempt[]){
 check(raw===''||raw.endsWith('\n'),'ACTUAL_JOURNAL_MUST_HAVE_COMPLETE_LINES')
 const lines=raw===''?[]:raw.slice(0,-1).split('\n').map(line=>object(JSON.parse(line),'JOURNAL_OBJECT_REQUIRED'))
 check(lines.length===attempts.length*2,'ACTUAL_JOURNAL_ATTEMPT_RESULT_COUNT_CHANGED')
 for(const attempt of attempts){
  const start=lines[attempt.index*2],end=lines[attempt.index*2+1]
  check(start?.event==='attempt'&&end?.event==='result','ACTUAL_JOURNAL_ORDER_CHANGED')
  const {event:_start,...started}=start,{event:_end,...finished}=end
  same(started,{...attempt,status:'attempted',revisionAfter:null,dateAfter:null,reasonCodes:null,error:null},'JOURNAL_EXACT_PREEXECUTION_ENVELOPE_CHANGED:'+attempt.index)
  same(finished,attempt,'JOURNAL_ACTUAL_RESULT_CHANGED:'+attempt.index)
 }
}
function allAP(run:GameRun){
 const dates=new Set(run.economy.actions.map(a=>a.definition.startAt));dates.add(run.timeline.cursor.date)
 return [...dates].sort().map(date=>actionBudget(run.economy,date)).filter((row,index,all)=>all.findIndex(other=>other.quarter===row.quarter)===index).map(row=>{check(row.spent+row.reserved<=4,'ACTUAL_AP_OVER_FOUR:'+row.quarter);return row})
}
function moneyAt(prefix:EarnedPrefix,run:GameRun){
 const base=views(prefix.run).course,current=views(run).course,old=new Set(base.cohorts.map(c=>c.id))
 return {moneyEvidence:current.cohorts.filter(c=>!old.has(c.id)).map(c=>assertCourseMoney(run,c.id)),cashEvidence:base.businesses.map(b=>assertCourseCashDelta(prefix.run,run,b.accountId)),allControlledAccountCashEvidence:prefix.run.controlledAccountIds.map(accountId=>assertCourseCashDelta(prefix.run,run,accountId)),actionBudgets:allAP(run)}
}
function verifyCollectorPrefix(identity:Identity,prefix:EarnedPrefix){
 const file=inputName+'/'+identity.name+'/prefix-create-replay.json'
 check(existsSync(join(root,file)),'COLLECTOR_PREFIX_PROOF_MISSING:'+identity.name)
 const proof=readJson(file,inputName);check(proof.status==='verified','COLLECTOR_PREFIX_PROOF_NOT_COMPLETE:'+identity.name)
 same(proof.commands,prefix.row.commands,'COLLECTOR_P1_COMMANDS_CHANGED');same(proof.milestones,prefix.row.milestones,'COLLECTOR_P1_MILESTONES_CHANGED')
 for(const [key,expected] of [['initial',readOriginal(prefixDirectory,prefix.row.initial)],['final',prefix.raw]] as const){
  const descriptor=object(proof[key],'PREFIX_GZIP_DESCRIPTOR_REQUIRED');check(descriptor.encoding==='gzip','PREFIX_ORIGINAL_GZIP_ENCODING_REQUIRED')
  const stored=readBytes(inputName+'/'+text(descriptor.file,'PREFIX_GZIP_FILE_REQUIRED'),inputName)
  check(stored.length===descriptor.storedBytes&&sha(stored)===descriptor.storedSha256,'COLLECTOR_PREFIX_STORED_BYTES_CHANGED')
  const raw=gunzipSync(stored,{maxOutputLength:MAX_MEMBER_BYTES})
  check(raw.length===descriptor.uncompressedBytes&&sha(raw)===descriptor.uncompressedSha256&&raw.equals(Buffer.from(expected,'utf8')),'COLLECTOR_CREATE_PREFIX_ORIGINAL_BYTES_CHANGED')
 }
}

function fixedShapes(){
 const products=['intro_recorded','practical_cohort','enterprise_training'],topics=['image_workflows','video_workflows'],editions=['foundation','advanced']
 check(COURSE_SHAPES.length===48,'ORIGINAL_FORTY_EIGHT_SHAPES_REQUIRED');unique(COURSE_SHAPES.map(s=>s.id),'ORIGINAL_SHAPE_IDS_MUST_BE_UNIQUE')
 const ids=products.flatMap(p=>topics.flatMap(t=>editions.flatMap(e=>['self_small','guided_group','assisted_group','delegated_group'].map(s=>[p,t,e,s].join('--')))))
 same(COURSE_SHAPES.map(s=>s.id).sort(),ids.sort(),'ORIGINAL48_CARTESIAN_SET_CHANGED')
 const shapes=products.flatMap(productId=>topics.flatMap(topicId=>editions.map(edition=>{
  const found=COURSE_SHAPES.filter(s=>s.productId===productId&&s.topicId===topicId&&s.edition===edition&&s.supportMode==='delegated_group')
  check(found.length===1&&found[0],'EXACT_ORIGINAL_DELEGATED_SHAPE_REQUIRED');return found[0]
 })))
 check(shapes.length===12,'EXACT_TWELVE_DELEGATED_SHAPES_REQUIRED');return shapes
}
const shapes=fixedShapes()
const expectedRows=identities.flatMap(identity=>shapes.map(shape=>({rowId:identity.name+'--'+shape.id,identity:identity.name,backgroundId:identity.backgroundId,seed:identity.seed,shape,folder:identity.name+'/shape-'+String(COURSE_SHAPES.findIndex(s=>s.id===shape.id)+1).padStart(2,'0')})))
function registrationRows(registration:JsonObject):RegisteredRow[]{
 const actual=list(registration.registered,'FIXED72_REGISTRATION_REQUIRED').map(value=>object(value,'REGISTRATION_ROW_REQUIRED'))
 check(actual.length===72,'EXACT72_REGISTRATION_REQUIRED');unique(actual.map(row=>text(row.rowId,'REGISTERED_ROW_ID_REQUIRED')),'DUPLICATE_REGISTERED_PAIR')
 return expectedRows.map(expected=>{
  const row=actual.find(row=>row.rowId===expected.rowId);check(row,'REGISTERED_ORIGINAL_PAIR_MISSING:'+expected.rowId)
  for(const key of ['rowId','identity','backgroundId','seed','folder'] as const)check(row[key]===expected[key],'REGISTERED_FIXED_IDENTITY_CHANGED:'+key)
  same(row.shape,expected.shape,'REGISTERED_ORIGINAL_SHAPE_CHANGED')
  const original=object(row.originalRow,'ORIGINAL288_ASSOCIATION_REQUIRED'),ref=fileRef(original)
  const oldId=expected.folder
  check(original.rowId===oldId&&ref.file===originalDirectory+'/'+oldId+'/shape-evidence.json','ORIGINAL288_ROW_ASSOCIATION_CHANGED')
  const raw=readText(ref.file,originalDirectory);check(Buffer.byteLength(raw)===ref.bytes&&sha(raw)===ref.sha256,'ORIGINAL288_ROW_BYTES_CHANGED')
  const committed=execFileSync('rtk',['proxy','git','show',originalCommit+':'+ref.file],{cwd:root,maxBuffer:MAX_MEMBER_BYTES})
  check(committed.equals(Buffer.from(raw,'utf8')),'ORIGINAL288_ROW_COMMITTED_ANCHOR_CHANGED')
  const old=object(JSON.parse(raw),'ORIGINAL288_RECORD_REQUIRED');check(old.identity===expected.identity&&old.folder===oldId,'ORIGINAL288_IDENTITY_CHANGED');same(old.shape,expected.shape,'ORIGINAL288_SHAPE_CHANGED')
  check(original.commit===registration.originalMatrixCommit&&original.status==='policy_refused'&&old.status==='policy_refused','ORIGINAL288_RECORDED_REFUSAL_OR_ANCHOR_CHANGED')
  return {...expected,originalRow:{...ref,rowId:oldId,commit:text(original.commit,'ORIGINAL_MATRIX_COMMIT_REQUIRED'),status:'policy_refused'}}
 })
}

function riskCommand(before:GameRun,after:GameRun,command:CommandEnvelope){
 if(command.kind!=='StartRiskTask'&&command.kind!=='ConfirmRiskAssessment')return null
 const payload=object(command.payload,'RISK_COMMAND_PAYLOAD_REQUIRED'),incidentId=text(payload.incidentId,'RISK_INCIDENT_ID_REQUIRED')
 const old=projectStory(before,campaignStory).incidents.find(i=>i.id===incidentId),current=projectStory(after,campaignStory).incidents.find(i=>i.id===incidentId)
 check(old&&current,'ACTUAL_RISK_INCIDENT_REQUIRED')
 if(command.kind==='ConfirmRiskAssessment'){
  const job=old.jobs.investigate
  check(job?.status==='completed'&&job.result!==null&&job.completeAt<=before.timeline.cursor.date,'ASSESSMENT_REQUIRES_ACTUAL_COMPLETED_INDEPENDENT_WORK')
  check(current.verdict===job.result,'ASSESSMENT_MUST_MATCH_ACTUAL_PUBLIC_RESULT')
  return {kind:'confirmed-assessment',commandId:command.commandId,revision:after.revision,date:after.timeline.cursor.date,incidentId,job,verdict:current.verdict,stage:current.stage,deadline:current.deadline,strictlyBeforeDefault:before.timeline.cursor.date<current.deadline}
 }
 check(payload.kind==='investigate','SUPPLEMENT_MUST_NOT_INVENT_OTHER_RISK_WORK')
 const job=current.jobs.investigate,terms=STORY_CONTENT.jobs.investigate
 check(job&&job.id!==old.jobs.investigate?.id&&job.status==='running'&&job.result===null,'ACTUAL_NEW_INVESTIGATION_REQUIRED')
 const business=views(before).course.businesses.find(b=>old.businessIds.includes(b.id)&&b.accountId===payload.accountId)
 check(business&&before.controlledAccountIds.includes(business.accountId)&&job.accountId===business.accountId&&job.businessId===business.id,'INVESTIGATION_MUST_USE_REAL_BOUND_CONTROLLED_COMPANY')
 check(job.resourceId===payload.resourceId&&job.resourceId==='player-production','ORIGINAL_PAID_INVESTIGATION_RESOURCE_REQUIRED')
 check(job.startAt===before.timeline.cursor.date&&job.completeAt===addDays(job.startAt,terms.days)&&job.costFen===terms.costFen&&job.actionPoints===terms.points,'INVESTIGATION_ACTUAL_DATE_COST_AP_TERMS_CHANGED')
 const actions=after.economy.actions.filter(a=>!before.economy.actions.some(old=>old.definition.id===a.definition.id))
 check(actions.length===1&&actions[0],'ONE_REAL_INVESTIGATION_ACTION_REQUIRED')
 const action=actions[0]
 check(action.definition.definitionId==='story-investigate'&&action.definition.accountId===job.accountId&&action.definition.businessId===job.businessId&&action.definition.startAt===job.startAt&&action.definition.completeAt===job.completeAt&&action.definition.costFen===job.costFen&&action.definition.actionPoints===job.actionPoints&&action.status==='executed'&&action.executedAt===job.startAt,'INVESTIGATION_ORIGINAL_ACTION_REQUIRED')
 const metrics=after.economy.ledger.metrics.filter(m=>m.kind==='cost'&&m.accountId===job.accountId&&m.referenceId===action.definition.id)
 check(metrics.length===1&&metrics[0]?.deltaFen===job.costFen,'INVESTIGATION_ACTUAL_COST_METRIC_REQUIRED')
 const cash=assertCourseCashDelta(before,after,job.accountId)
 check(cash.transactionDeltaFen===-job.costFen,'INVESTIGATION_MUST_PAY_REAL_CASH_NOW')
 const previousBudget=actionBudget(before.economy,job.startAt),budget=actionBudget(after.economy,job.startAt)
 check(budget.spent===previousBudget.spent+job.actionPoints&&budget.reserved===previousBudget.reserved,'INVESTIGATION_MUST_CONSUME_REAL_QUARTER_AP')
 return {kind:'paid-investigation',commandId:command.commandId,revision:after.revision,date:after.timeline.cursor.date,incidentId,job,deadline:current.deadline,willCompleteStrictlyBeforeDefault:job.completeAt<current.deadline,actualCash:cash,quarterBudget:budget}
}
function publicBusiness(prefix:EarnedPrefix,run:GameRun,shape:CourseShape){
 const baseline=views(prefix.run).course,current=views(run).course
 const courses=current.courses.filter(c=>!baseline.courses.some(old=>old.id===c.id)),cohorts=current.cohorts.filter(c=>!baseline.cohorts.some(old=>old.id===c.id))
 const course=courses[0],cohort=cohorts[0]
 const actualClosedShape=courses.length===1&&!!course&&course.productId===shape.productId&&course.topicId===shape.topicId&&course.edition===shape.edition&&cohorts.length===1&&!!cohort&&cohort.courseId===course.id&&cohort.students.length>0&&cohort.closedAt!==null&&cohort.stages.length===2&&cohort.stages.every(s=>s.deliveredAt!==null)&&cohort.supportJobs.some(s=>!s.recovery&&s.mode==='delegated_group'&&s.job?.status==='completed')
 const helpedRetainedStudents=cohorts.reduce((n,c)=>n+c.students.filter(s=>s.paidRemainingFen>0&&s.outcome==='helped'&&s.refundedFen===0).length,0)
 return {courseIds:courses.map(c=>c.id),cohortIds:cohorts.map(c=>c.id),actualClosedShape,enrolledStudents:cohorts.reduce((n,c)=>n+c.students.length,0),helpedRetainedStudents,positiveDelegatedBusiness:actualClosedShape&&helpedRetainedStudents>0,closedAt:cohort?.closedAt??null,originalDelegatedSupports:cohorts.flatMap(c=>c.supportJobs.filter(s=>!s.recovery&&s.mode==='delegated_group').map(s=>({cohortId:c.id,jobId:s.jobId,job:s.job}))),stages:cohort?.stages??[]}
}
const knownFiniteCodes=new Set(['actual_command_refused','finite_2025_action_window_exhausted','three_actual_qualification_refusals_or_finite_attempt_limit','finite_2025_qualification_window_exhausted','actual_advanced_demand_missing','actual_no_eligible_demand','finite_2025_schedule_unavailable','actual_no_unconverted_learners','actual_authorized_support_interrupted','actual_cohort_debt_unpaid','actual_independent_violation_finite_stop','actual_public_risk_no_current_legal_investigation_window'])
const knownCommandRefusals=new Set(['INSUFFICIENT_ACTION_POINTS','INSUFFICIENT_AVAILABLE_FUNDS','INSUFFICIENT_CAPACITY','COURSE_SUPPORT_UNAVAILABLE','OVERDUE_OBLIGATION','AGENT_INDEPENDENT_RISK_PENDING','AGENT_NOT_READY_FOR_BUSINESS','AGENT_SERVICE_FEE_OVERDUE','AGENT_CASH_LIMIT_EXCEEDED','AGENT_SCOPE_NOT_AUTHORIZED','AGENT_DEPLOYMENT_NOT_ACTIVE','AGENT_EXPANSION_NOT_AUTHORIZED'])
function verifyFinite(record:JsonObject,run:GameRun,attempts:readonly Attempt[],prefix:EarnedPrefix){
 if(record.executionStatus!=='policy_refused'){check(record.policyRefusal===null,'NONFINITE_CASE_MUST_NOT_CLAIM_FINITE_REFUSAL');return null}
 const refusal=object(record.policyRefusal,'FINITE_REFUSAL_RECORD_REQUIRED'),code=text(refusal.code,'FINITE_REFUSAL_CODE_REQUIRED')
 check(knownFiniteCodes.has(code),'UNKNOWN_FAILURE_MUST_REMAIN_FATAL:'+code)
 const detail=refusal.detail,course=views(run).course,story=projectStory(run,campaignStory)
 if(code==='actual_command_refused'){
  const rejected=attempts.filter(a=>a.status==='rejected').at(-1);check(rejected?.reasonCodes?.length&&rejected.reasonCodes.every(r=>knownCommandRefusals.has(r)),'FINITE_COMMAND_REFUSAL_NEEDS_REAL_REJECTION')
  const supplied=object(detail,'FINITE_COMMAND_DETAIL_REQUIRED');same(supplied.payload,rejected.command.payload,'FINITE_REJECTION_PAYLOAD_CHANGED');same(supplied.reasons,rejected.reasonCodes,'FINITE_REJECTION_REASONS_CHANGED');check(supplied.kind===rejected.command.kind&&supplied.date===rejected.sourceDate,'FINITE_REJECTION_IDENTITY_CHANGED')
 }
 if(code==='actual_independent_violation_finite_stop')check(story.incidents.some(i=>i.verdict==='violation'&&i.deploymentIds.every(id=>story.deployments.find(d=>d.id===id)?.stoppedAt!==null)&&i.liabilities!==null),'FINITE_VIOLATION_MUST_HAVE_PUBLIC_VERDICT_OWNED_STOP_AND_RECORDED_LIABILITIES')
 const fresh=course.cohorts.filter(c=>!views(prefix.run).course.cohorts.some(old=>old.id===c.id))
 if(code==='actual_authorized_support_interrupted')check(fresh.some(c=>c.supportJobs.some(s=>!s.recovery&&s.job?.status!=='completed')),'FINITE_INTERRUPTION_NEEDS_ACTUAL_ORIGINAL_INCOMPLETE_SUPPORT')
 if(code==='actual_cohort_debt_unpaid')check(fresh.some(c=>c.closedAt===null&&run.economy.ledger.obligations.some(o=>o.contractId===c.id&&o.remainingFen>0)),'FINITE_UNPAID_COHORT_NEEDS_REAL_REMAINING_DEBT')
 if(code==='actual_no_eligible_demand')check(course.audiences.some(a=>a.eligibleMembers.length===0&&!views(prefix.run).course.audiences.some(old=>old.id===a.id)),'FINITE_NO_DEMAND_NEEDS_ACTUAL_EMPTY_AUDIENCE')
 return {code,detail,classification:'original-finite-policy-refusal',note:'The exact accepted/rejected command history and full terminal bytes are independently checked. A bounded scheduling refusal is retained as that policy result, not proof that every possible strategy is impossible.'}
}

function auditCase(registration:RegisteredRow):CaseAudit{
 const base:CaseAudit={rowId:registration.rowId,identity:registration.identity,shape:registration.shape,status:'missing',sourceStatus:null,executionStatus:null,error:null,accepted:0,rejected:0,actualClosedShape:false,positiveDelegatedBusiness:false,helpedRetainedStudents:0,monitoringComplete:false,proof:null}
 const folderFile=inputName+'/'+registration.folder,indexFile=folderFile+'/case-index.json'
 if(!existsSync(join(root,indexFile))){
  if(existsSync(join(root,folderFile))){
   base.status='partial';base.error='NO_COMPLETE_EXTERNAL_CASE_INDEX; any existing journal/raw recovery is retained, never invented.'
   const journal=folderFile+'/command-attempts.jsonl',recovery=folderFile+'/recovery-members.json',failure=folderFile+'/case-failure.json'
   const present=[journal,recovery,failure].filter(file=>existsSync(join(root,file))).map(file=>({file,bytes:readBytes(file,inputName).length,sha256:inputHashes[file]}))
   base.proof=saveJson('case-'+String(expectedRows.findIndex(r=>r.rowId===registration.rowId)+1).padStart(2,'0')+'.json',{...base,availableOriginalArtifacts:present,scope:'Read-only recovery inventory. Missing terminal or index is not a reconstructed successful run.'})
  }else base.error='REGISTERED_CASE_NOT_WRITTEN'
  return base
 }
 try{
  const prefix=prefixes.get(registration.identity);check(prefix,'AUDITOR_HAS_NOT_EARNED_THIS_CREATE_PREFIX')
  const index=readJson(indexFile,inputName)
  for(const key of ['rowId','identity','backgroundId','seed','folder'] as const)check(index[key]===registration[key],'CASE_INDEX_REGISTERED_IDENTITY_CHANGED:'+key)
  same(index.shape,registration.shape,'CASE_INDEX_ORIGINAL_SHAPE_CHANGED')
  const archive=archiveRef(index.archive),members=unpack(registration.folder,archive),caseRef=memberRef(index.caseEvidence)
  check(caseRef.member==='case-evidence.json','FULL_CASE_RECORD_MEMBER_REQUIRED')
  const record=object(JSON.parse(memberRaw(members,caseRef)),'FULL_ORIGINAL_CASE_RECORD_REQUIRED')
  for(const key of ['rowId','identity','backgroundId','seed','folder'] as const)check(record[key]===registration[key],'CASE_RECORD_REGISTERED_IDENTITY_CHANGED:'+key)
  same(record.shape,registration.shape,'CASE_RECORD_ORIGINAL_SHAPE_CHANGED')
  same(record.originalRow,registration.originalRow,'CASE_RECORD_ORIGINAL288_LINK_CHANGED');same(index.originalRow,registration.originalRow,'CASE_INDEX_ORIGINAL288_LINK_CHANGED')
  base.sourceStatus=text(index.status,'CASE_STATUS_REQUIRED');base.executionStatus=text(record.executionStatus,'CASE_EXECUTION_STATUS_REQUIRED')
  check(['completed','policy_refused','fatal'].includes(base.sourceStatus)&&['completed','policy_refused','fatal'].includes(base.executionStatus),'CASE_FAILURE_CLASSIFICATION_REQUIRED')
  check(record.status===base.sourceStatus,'CASE_RECORD_INDEX_STATUS_CHANGED')
  const prefixRef=memberRef(object(record.earnedPrefix,'EARNED_PREFIX_RECORD_REQUIRED').raw)
  check(prefixRef.member==='earned-prefix.json'&&memberRaw(members,prefixRef)===prefix.raw,'CASE_WHOLE_EARNED_PREFIX_BYTES_CHANGED')
  const terminalRef=memberRef(record.terminal);same(terminalRef,memberRef(index.terminal),'CASE_TERMINAL_INDEX_CHANGED')
  check(terminalRef.member===(base.executionStatus==='completed'?'final.json':'partial.json'),'EXECUTION_STATUS_TERMINAL_MEMBER_CHANGED')
  const terminalRaw=memberRaw(members,terminalRef),terminal=strictRaw(terminalRaw,registration.rowId+':terminal')
  const terminalSource=object(record.terminalSource,'TERMINAL_SOURCE_REQUIRED')
  check(terminal.revision===record.revision&&terminal.timeline.cursor.date===record.date&&index.revision===terminal.revision&&index.date===terminal.timeline.cursor.date&&terminalSource.revision===terminal.revision&&terminalSource.date===terminal.timeline.cursor.date,'TERMINAL_ACTUAL_REVISION_DATE_CHANGED')
  check(terminal.origin==='normal'&&terminal.runId===prefix.run.runId&&terminal.backgroundId===registration.backgroundId&&terminal.seed===registration.seed&&terminal.timeline.cursor.date<='2025-12-31','NORMAL_FIXED_CASE_IDENTITY_OR_DATE_CHANGED')
  const attempts=actualAttempts(record.attempts);same(record.actualAttempts,attempts,'FULL_ATTEMPT_ALIASES_CHANGED')
  const journal=members.get('command-attempts.jsonl');check(journal!==undefined,'ORIGINAL_ACTUAL_JOURNAL_MEMBER_REQUIRED');auditJournal(journal,attempts)
  check(readText(folderFile+'/command-attempts.jsonl',inputName)===journal,'ACTUAL_DISK_JOURNAL_DIFFERS_FROM_BUNDLED_ORIGINAL')
  const milestones:Milestone[]=list(record.milestones,'ALL_MILESTONES_REQUIRED').map(value=>{const m=object(value,'MILESTONE_REQUIRED');return {name:text(m.name,'MILESTONE_NAME_REQUIRED'),revision:integer(m.revision,'MILESTONE_REVISION_REQUIRED'),date:text(m.date,'MILESTONE_DATE_REQUIRED'),raw:memberRef(m.raw),moneyEvidence:list(m.moneyEvidence,'MILESTONE_MONEY_ARRAY_REQUIRED'),cashEvidence:list(m.cashEvidence,'MILESTONE_CASH_ARRAY_REQUIRED')}})
  unique(milestones.map(m=>m.name),'MILESTONE_NAMES_MUST_BE_UNIQUE');unique(milestones.map(m=>m.raw.member),'MILESTONE_RAW_MEMBERS_MUST_BE_UNIQUE')
  const expectedMembers=['earned-prefix.json','command-attempts.jsonl','case-evidence.json',terminalRef.member,...milestones.map(m=>m.raw.member)]
  unique(expectedMembers,'CASE_RAW_REFERENCE_ALIAS');same([...members.keys()].sort(),expectedMembers.sort(),'ALL_XZ_RAW_MEMBERS_MUST_BE_REFERENCED_EXACTLY')
  const declaredRawMembers=list(record.rawMembers,'COMPLETE_RAW_MEMBER_TABLE_REQUIRED').map(memberRef)
  unique(declaredRawMembers.map(ref=>ref.member),'DUPLICATE_DECLARED_RAW_MEMBER')
  const actualRawMembers=[...members].filter(([member])=>member!=='case-evidence.json').map(([member,raw])=>({member,bytes:Buffer.byteLength(raw),sha256:sha(raw)}))
  same(declaredRawMembers.sort((a,b)=>a.member.localeCompare(b.member)),actualRawMembers.sort((a,b)=>a.member.localeCompare(b.member)),'DECLARED_RAW_MEMBER_TABLE_DIFFERS_FROM_COMPLETE_ORIGINALS')
  const checkedMilestones:unknown[]=[],atRevision=new Map<number,{raw:string;milestones:Milestone[]}>()
  for(const milestone of milestones){
   const raw=memberRaw(members,milestone.raw),run=strictRaw(raw,registration.rowId+':'+milestone.name)
   check(run.revision===milestone.revision&&run.timeline.cursor.date===milestone.date&&run.runId===prefix.run.runId&&run.origin==='normal','MILESTONE_IDENTITY_DATE_CHANGED')
   const old=atRevision.get(run.revision);check(!old||old.raw===raw,'SAME_REVISION_MUST_HAVE_EXACT_SAME_RAW')
   if(old)old.milestones.push(milestone);else atRevision.set(run.revision,{raw,milestones:[milestone]})
   const actual=moneyAt(prefix,run);same(actual.moneyEvidence,milestone.moneyEvidence,'MILESTONE_INDEPENDENT_MONEY_PROOF_CHANGED:'+milestone.name);same(actual.cashEvidence,milestone.cashEvidence,'MILESTONE_INDEPENDENT_CASH_PROOF_CHANGED:'+milestone.name)
   checkedMilestones.push({name:milestone.name,revision:run.revision,date:run.timeline.cursor.date,raw:milestone.raw,...actual})
  }
  const matched=new Set<string>(),accepted:CommandEnvelope[]=[],riskEvidence:unknown[]=[],riskTrace=list(record.riskTrace,'PUBLIC_RISK_TRACE_REQUIRED').map(value=>object(value,'PUBLIC_RISK_TRACE_ROW_REQUIRED')),matchedRiskTrace=new Set<number>()
  let replay=strictRaw(prefix.raw,'self-earned-prefix'),replayRaw=prefix.raw
  const inspect=()=>{
   const expected=atRevision.get(replay.revision)
   if(expected){check(expected.raw===replayRaw,'INDEPENDENT_SUFFIX_MILESTONE_BYTES_CHANGED:'+replay.revision);for(const milestone of expected.milestones)matched.add(milestone.name)}
   for(let i=0;i<riskTrace.length;i++){
    const row=riskTrace[i];check(row,'RISK_TRACE_ROW_REQUIRED');if(row.revision!==replay.revision)continue
    check(row.date===replay.timeline.cursor.date,'PUBLIC_RISK_TRACE_SOURCE_DATE_CHANGED')
    const detail=object(row.detail,'PUBLIC_RISK_TRACE_DETAIL_REQUIRED'),story=projectStory(replay,campaignStory),incident=story.incidents.find(c=>c.id===detail.incidentId)
    if(row.kind==='public-signal'){check(incident,'SIGNAL_ACTUAL_INCIDENT_REQUIRED');check(incident.signals.some(s=>canonicalJson(s)===canonicalJson(detail.signal)),'TRACE_SIGNAL_MUST_ACTUALLY_EXIST');check(detail.deadline===incident.deadline,'SIGNAL_DEADLINE_CHANGED')}
    if(row.kind==='actual-paid-investigation'){check(incident?.jobs.investigate,'TRACE_ACTUAL_INVESTIGATION_REQUIRED');same(incident.jobs.investigate,detail.job,'TRACE_ACTUAL_PAID_JOB_CHANGED');check(detail.deadline===incident.deadline&&detail.willCompleteStrictlyBeforeDefault===(incident.jobs.investigate.completeAt<incident.deadline),'TRACE_INVESTIGATION_DEADLINE_FLAG_CHANGED')}
    if(row.kind==='actual-completed-assessment'){check(incident?.jobs.investigate?.status==='completed','TRACE_ACTUAL_COMPLETED_ASSESSMENT_REQUIRED');same(incident.jobs.investigate,detail.job,'TRACE_ASSESSMENT_JOB_CHANGED');check(detail.verdict===incident.verdict&&detail.stage===incident.stage&&detail.deadline===incident.deadline&&detail.strictlyBeforeDefault===(replay.timeline.cursor.date<incident.deadline),'TRACE_ACTUAL_ASSESSMENT_CHANGED')}
    if(row.kind==='actual-monitoring-cutoff')check(detail.target==='2025-12-31'&&detail.actualDate===replay.timeline.cursor.date&&detail.phase===replay.timeline.cursor.phase,'TRACE_MONITORING_DATE_CHANGED')
    matchedRiskTrace.add(i)
   }
  }
  inspect()
  for(const attempt of attempts){
   check(attempt.sourceRevision===replay.revision&&attempt.sourceDate===replay.timeline.cursor.date,'EXACT_ATTEMPT_SOURCE_REVISION_DATE_CHANGED')
   check(attempt.command.runId===replay.runId&&attempt.command.expectedRevision===replay.revision&&attempt.command.actorId===replay.actorId,'EXACT_ATTEMPT_ENVELOPE_CHANGED')
   check(attempt.command.kind!=='WorkQuarter','SUPPLEMENT_EXPLICIT_WORK_FALSE_POLICY_CHANGED')
   const before=replay,beforeRaw=codec.export(before),result=evaluateCommand(before,attempt.command,codec.registry,before.actorId)
   if(attempt.status==='rejected'){
    check(result.status==='rejected','ACTUAL_REJECTION_MUST_REPLAY_AS_REJECTED');same(result.reasonCodes,attempt.reasonCodes,'ACTUAL_REJECTED_REASON_CODES_CHANGED')
    check(codec.export(before)===beforeRaw&&attempt.revisionAfter===before.revision&&attempt.dateAfter===before.timeline.cursor.date,'REJECTED_ATTEMPT_MUST_KEEP_COMPLETE_RAW_AND_IDENTITY')
    base.rejected++;continue
   }
   check(attempt.status==='committed'||attempt.status==='committed_with_exception','UNKNOWN_EXCEPTION_CANNOT_BE_COUNTED_AS_REPLAYED_REFUSAL')
   check(result.status==='proposed','ACTUAL_ACCEPTED_ENVELOPE_NO_LONGER_PROPOSED')
   const strict=roundTrip(result.nextRun);replay=strict.run;replayRaw=strict.raw
   check(replay.revision===attempt.revisionAfter&&replay.timeline.cursor.date===attempt.dateAfter,'ACTUAL_ACCEPTED_RESULT_IDENTITY_CHANGED')
   check(replay.timeline.cursor.date>=before.timeline.cursor.date&&replay.timeline.cursor.date<='2025-12-31','ACTUAL_SUFFIX_MUST_NOT_BACKDATE_OR_EXTEND_NORMAL_TIMELINE')
   allAP(replay);const risk=riskCommand(before,replay,attempt.command);if(risk)riskEvidence.push(risk)
   accepted.push(attempt.command);base.accepted++;inspect()
  }
  check(replayRaw===terminalRaw&&matched.size===milestones.length,'INDEPENDENT_FULL_TERMINAL_OR_ALL_MILESTONES_BYTES_CHANGED')
  check(matchedRiskTrace.size===riskTrace.length,'PUBLIC_RISK_TRACE_HAS_UNREPLAYED_SOURCE_REVISION')
  const authoritative=commandsOf(terminal),prefixLength=prefix.row.commands.length,suffix=authoritative.slice(prefixLength)
  same(authoritative.slice(0,prefixLength),prefix.row.commands,'CASE_MUST_NOT_REWRITE_EARNED_PREFIX_COMMANDS');same(authoritative,commandList(record.commands),'FULL_ACTUAL_COMMANDS_CHANGED')
  same(suffix,commandList(record.suffixCommands),'AUTHORITATIVE_SUFFIX_COMMANDS_CHANGED')
  same(normalized(accepted),suffix,'EXACT_ACCEPTED_ATTEMPTS_MISSING_EXTRA_OR_CHANGED')
  same(normalized(commandList(record.harnessRecordedSuffix)),suffix,'HARNESS_SUFFIX_DISAGREES_WITH_ORIGINAL_RECEIPT_DEFAULTS')
  check(base.rejected===record.actualRejectedCommands&&base.rejected===index.actualRejectedCommands&&base.accepted===index.suffixCommands,'ACTUAL_COMMAND_COUNTS_CHANGED')
  const publicViews=views(terminal);same(publicViews.course,record.publicCourse,'TERMINAL_RECOMPUTED_PUBLIC_COURSE_CHANGED');same(publicViews.video,record.publicVideo,'TERMINAL_RECOMPUTED_PUBLIC_VIDEO_CHANGED');same(publicViews.story,record.publicStory,'TERMINAL_RECOMPUTED_PUBLIC_STORY_CHANGED')
  const originalStoryJobs=new Set(projectStory(prefix.run,campaignStory).jobs.map(j=>j.id)),investigations=publicViews.story.jobs.filter(j=>j.kind==='investigate'&&!originalStoryJobs.has(j.id))
  const starts=riskEvidence.map(value=>object(value,'INDEPENDENT_RISK_EVIDENCE_REQUIRED')).filter(value=>value.kind==='paid-investigation')
  check(starts.length===investigations.length,'EVERY_ACTUAL_INVESTIGATION_NEEDS_INDEPENDENT_CASH_AP_DATE_PROOF')
  const investigationsByQuarter=[...new Set(investigations.map(j=>quarterOf(j.startAt)))].sort().map(quarter=>({quarter,actualAP:investigations.filter(j=>quarterOf(j.startAt)===quarter).reduce((n,j)=>n+j.actionPoints,0),actualCostFen:investigations.filter(j=>quarterOf(j.startAt)===quarter).reduce((n,j)=>n+j.costFen,0),jobs:investigations.filter(j=>quarterOf(j.startAt)===quarter).map(j=>j.id)}))
  const business=publicBusiness(prefix,terminal,registration.shape),money=moneyAt(prefix,terminal),monitoringComplete=terminal.timeline.cursor.date==='2025-12-31'&&terminal.timeline.cursor.phase==='snapshot'
  for(const key of ['actualClosedShape','enrolledStudents','helpedRetainedStudents'] as const){check(record[key]===business[key]&&index[key]===business[key],'ACTUAL_BUSINESS_COUNT_OR_STAGE_CHANGED:'+key)}
  check(record.monitoringComplete===monitoringComplete&&index.monitoringComplete===monitoringComplete,'ACTUAL_YEAR_END_MONITORING_FLAG_CHANGED')
  const completedAt=record.businessCompletedAt
  if(completedAt!==null){check(typeof completedAt==='string'&&business.actualClosedShape&&business.closedAt!==null&&completedAt>=business.closedAt&&completedAt<=terminal.timeline.cursor.date,'BUSINESS_COMPLETED_AT_NEEDS_REAL_CLOSED_BUSINESS');check(milestones.some(m=>m.date===completedAt&&publicBusiness(prefix,strictRaw(memberRaw(members,m.raw),'business-completed-at'),registration.shape).actualClosedShape),'BUSINESS_COMPLETED_AT_NEEDS_FULL_RAW_MILESTONE')}
  check(record.positiveDelegatedBusiness===(business.positiveDelegatedBusiness&&completedAt!==null)&&index.positiveDelegatedBusiness===record.positiveDelegatedBusiness,'ACTUAL_POSITIVE_DELEGATED_BUSINESS_FLAG_CHANGED')
  if(base.executionStatus==='completed')check(business.actualClosedShape&&completedAt!==null,'COMPLETED_CASE_WITHOUT_REAL_ENROLLMENT_TWO_STAGES_ORIGINAL_DELEGATED_SUPPORT_CLOSE')
  if(base.sourceStatus!=='fatal')check(monitoringComplete,'NONFATAL_CASE_HAS_NOT_ACTUALLY_MONITORED_THROUGH_YEAR_END')
  const finite=verifyFinite(record,terminal,attempts,prefix)
  check(codec.export(prefix.run)===prefix.raw,'AUDITOR_EARNED_PREFIX_MUTATED_AFTER_BRANCH')
  Object.assign(base,{status:'verified',actualClosedShape:business.actualClosedShape,positiveDelegatedBusiness:business.positiveDelegatedBusiness&&completedAt!==null,helpedRetainedStudents:business.helpedRetainedStudents,monitoringComplete})
  const failureFile=folderFile+'/case-failure.json'
  let collectorFailure:JsonObject|null=null
  if(existsSync(join(root,failureFile))){collectorFailure=readJson(failureFile,inputName);check(collectorFailure.rowId===registration.rowId&&collectorFailure.status==='fatal','COLLECTOR_WRAPPER_FAILURE_IDENTITY_CHANGED');base.sourceStatus='fatal';base.error=text(collectorFailure.error,'COLLECTOR_WRAPPER_ERROR_REQUIRED')}
  base.proof=saveJson('case-'+String(expectedRows.findIndex(r=>r.rowId===registration.rowId)+1).padStart(2,'0')+'.json',{...base,archive,index:{file:indexFile,bytes:readBytes(indexFile,inputName).length,sha256:inputHashes[indexFile]},checkedRawMembers:archive.members,prefixFinal:prefix.row.final,independentlyReplayedAccepted:base.accepted,independentlyReplayedRejected:base.rejected,allOriginalMilestonesMatched:matched.size,originalMilestones:checkedMilestones,business,money,riskEvidence,investigationsByQuarter,finite,collectorFailure,publicCourse:publicViews.course,publicVideo:publicViews.video,publicStory:publicViews.story,fullOriginalTerminal:terminalRef,scope:'Independent full Create-prefix and exact attempted suffix audit. Public results and integer accounting are recomputed; collector booleans are never accepted as evidence. Late investigations, later finite stops and unverified external control remain explicit.'})
  return base
 }catch(error){base.status='invalid';base.error=String(error);return base}
}

function guard(){
 for(const [file,hash] of Object.entries({...sourceHashes,...inputHashes}))check(sha(readFileSync(projectFile(file)))===hash,'AUDIT_SOURCE_OR_ORIGINAL_INPUT_DRIFT:'+file)
}
function freezeSources(registration:JsonObject){
 const registeredHashes=hashMap(registration.sourceHashes,'FROZEN_SOURCE_HASHES_REQUIRED')
 const required=[...productionFiles('src/core'),...productionFiles('src/application'),...productionFiles('src/content'),...productionFiles('src/persistence'),'src/testing/story-harness.ts','src/testing/course-shape-scenario.ts','src/testing/course-delegated-scenario.ts','src/testing/course-shape-assertions.ts','scripts/collect_course_delegated_evidence.ts','scripts/verify_course_delegated_evidence.ts','scripts/evidence_xz_bundle.py','scripts/evidence-output.ts','scripts/video-shape-output.ts','package.json','package-lock.json','tsconfig.json','tsconfig.core.json','tsconfig.app.json','tsconfig.node.json','goal-1/evidence/t17-acceptance-08/input.md','goal-1/evidence/t17-acceptance-08/plan.md','goal-1/evidence/t17-acceptance-08/policy-r1.md']
 for(const file of required)check(Object.hasOwn(registeredHashes,file),'FROZEN_REQUIRED_SOURCE_MISSING:'+file)
 const strategies=list(registration.strategyFiles,'FROZEN_STRATEGIES_REQUIRED').map(file=>text(file,'STRATEGY_FILE_REQUIRED')),texts=object(registration.strategyTexts,'STRATEGY_ORIGINAL_TEXTS_REQUIRED')
 for(const file of strategies){check(Object.hasOwn(registeredHashes,file),'STRATEGY_HASH_MISSING');check(readText(file)===texts[file],'STRATEGY_ORIGINAL_BYTES_CHANGED:'+file)}
 for(const [file,hash] of Object.entries(registeredHashes)){check(sha(readFileSync(projectFile(file)))===hash,'FROZEN_SOURCE_CHANGED:'+file);sourceHashes[file]=hash}
 for(const [file,hash] of Object.entries(hashMap(registration.sourceInputHashes,'FROZEN_ORIGINAL_INPUT_HASHES_REQUIRED')))check(sha(readBytes(file))===hash,'FROZEN_ORIGINAL_INPUT_CHANGED:'+file)
 const anchoredInputs=hashMap(registration.anchoredInputs,'P1_ANCHORED_INPUTS_REQUIRED')
 for(const file of [prefixDirectory+'/course-prefix-results.json',readinessFile])check(anchoredInputs[file]===sha(readBytes(file,'goal-1/evidence/t17-acceptance-05')),'REGISTERED_P1_ANCHOR_CHANGED')
 check(sha(readBytes('goal-1/input.md'))==='20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1','ORIGINAL_GOAL_INPUT_CHANGED')
}
function originalMatrix(registration:JsonObject){
 check(registration.originalDirectory===originalDirectory&&registration.originalCoreRegistered===288&&registration.fullMatrixRegistered===378&&registration.criticalRegistered===90&&registration.criticalBranchesExecuted===0&&registration.delegatedRegistered===72,'ORIGINAL_MATRIX_SCOPE_MUST_NOT_SHRINK')
 const originalRegistration=anchored(originalDirectory+'/registration.json',originalCommit,originalDirectory),originalSummary=anchored(originalDirectory+'/course-shape-results.json',originalCommit,originalDirectory)
 const originalRows=list(originalRegistration.registered,'ORIGINAL288_REGISTRATION_REQUIRED').map(value=>object(value,'ORIGINAL288_REGISTERED_ROW_REQUIRED'))
 const originalResults=list(originalSummary.results,'ORIGINAL288_RESULTS_REQUIRED').map(value=>object(value,'ORIGINAL288_RESULT_REQUIRED'))
 check(originalRows.length===288&&originalResults.length===288&&originalSummary.registered===288,'EXACT_ORIGINAL288_INPUTS_REQUIRED')
 const expected=identities.flatMap(identity=>COURSE_SHAPES.map(shape=>({identity:identity.name,shape})))
 const pair=(row:JsonObject)=>text(row.identity,'ORIGINAL288_IDENTITY_REQUIRED')+'--'+text(object(row.shape,'ORIGINAL288_SHAPE_REQUIRED').id,'ORIGINAL288_SHAPE_ID_REQUIRED')
 unique(originalRows.map(pair),'ORIGINAL288_DUPLICATE_REGISTRATION');unique(originalResults.map(pair),'ORIGINAL288_DUPLICATE_RESULT')
 same(originalRows.map(pair).sort(),expected.map(row=>row.identity+'--'+row.shape.id).sort(),'ORIGINAL288_REGISTRATION_SET_CHANGED')
 same(originalResults.map(pair).sort(),expected.map(row=>row.identity+'--'+row.shape.id).sort(),'ORIGINAL288_RESULT_SET_CHANGED')
 return {registration:originalRegistration,summary:originalSummary,originalCommit,collectorOriginalMatrixCommit:registration.originalMatrixCommit}
}
function verifySummary(summary:JsonObject,registered:readonly RegisteredRow[],originalInputs:unknown){
 check(summary.registered===72&&summary.recorded===72&&summary.originalCoreRegistered===288&&summary.fullMatrixRegistered===378&&summary.criticalRegistered===90&&summary.criticalBranchesExecuted===0,'SUMMARY_ORIGINAL_SCOPE_CHANGED')
 same(summary.sourceHashes,sourceHashes,'SUMMARY_FROZEN_SOURCE_HASHES_CHANGED')
 same(summary.sourceInputHashes,originalInputs,'SUMMARY_ORIGINAL_INPUT_HASH_MAP_CHANGED')
 const recorded=list(summary.results,'SUMMARY_ALL72_RESULTS_REQUIRED').map(value=>object(value,'SUMMARY_ROW_REQUIRED'))
 check(recorded.length===72,'SUMMARY_EXACT72_ROWS_REQUIRED');unique(recorded.map(row=>text(row.rowId,'SUMMARY_ROW_ID_REQUIRED')),'SUMMARY_DUPLICATE_PAIR')
 same(recorded.map(row=>row.rowId).sort(),registered.map(row=>row.rowId).sort(),'SUMMARY_REGISTERED_PAIR_SET_CHANGED')
 for(const registration of registered){
  const row=recorded.find(row=>row.rowId===registration.rowId),audit=rows.find(row=>row.rowId===registration.rowId);check(row&&audit,'SUMMARY_REGISTERED_ROW_MISSING')
  check(row.identity===registration.identity&&row.folder===registration.folder,'SUMMARY_REGISTERED_IDENTITY_CHANGED');same(row.shape,registration.shape,'SUMMARY_REGISTERED_SHAPE_CHANGED');same(row.originalRow,registration.originalRow,'SUMMARY_ORIGINAL288_LINK_CHANGED')
  if(row.evidence!==null){const ref=fileRef(row.evidence),raw=readText(inputName+'/'+ref.file,inputName);check(ref.file===registration.folder+'/case-index.json'&&Buffer.byteLength(raw)===ref.bytes&&sha(raw)===ref.sha256,'SUMMARY_EXTERNAL_INDEX_BYTES_CHANGED')}
  if(audit.status==='verified'){
   check(row.status===audit.sourceStatus&&row.suffixCommands===audit.accepted&&row.actualRejectedCommands===audit.rejected,'SUMMARY_RECOMPUTED_COMMAND_COUNTS_OR_STATUS_CHANGED')
   check(row.actualClosedShape===audit.actualClosedShape&&row.helpedRetainedStudents===audit.helpedRetainedStudents&&row.positiveDelegatedBusiness===audit.positiveDelegatedBusiness&&row.monitoringComplete===audit.monitoringComplete,'SUMMARY_RECOMPUTED_BUSINESS_RESULTS_CHANGED')
   const index=readJson(inputName+'/'+registration.folder+'/case-index.json',inputName);same(row.archive,index.archive,'SUMMARY_EXTERNAL_ARCHIVE_DESCRIPTOR_CHANGED')
  }else if(audit.status==='missing')check(row.status==='unexecuted_due_to_fatal'&&row.evidence===null&&row.archive===null&&row.suffixCommands===0&&row.actualRejectedCommands===0,'MISSING_ORIGINAL_CASE_MUST_NOT_CLAIM_EXECUTION')
 }
 const count=(status:string)=>recorded.filter(row=>row.status===status).length
 check(summary.completed===count('completed')&&summary.policyRefused===count('policy_refused')&&summary.fatal===count('fatal')&&summary.unexecutedDueToFatal===count('unexecuted_due_to_fatal')&&summary.attempted===72-count('unexecuted_due_to_fatal'),'SUMMARY_ACTUAL_STATUS_TOTALS_CHANGED')
 const allVerified=rows.every(row=>row.status==='verified')
 if(allVerified){
  check(summary.actualAcceptedSuffixCommands===rows.reduce((n,row)=>n+row.accepted,0)&&summary.actualRejectedCommands===rows.reduce((n,row)=>n+row.rejected,0),'SUMMARY_ACTUAL_COMMAND_TOTALS_CHANGED')
  check(summary.actualClosedBusinesses===rows.filter(row=>row.sourceStatus!=='fatal'&&row.actualClosedShape).length&&summary.positiveDelegatedBusinesses===rows.filter(row=>row.sourceStatus!=='fatal'&&row.positiveDelegatedBusiness).length&&summary.monitoringCompleted===rows.filter(row=>row.monitoringComplete).length,'SUMMARY_ACTUAL_BUSINESS_TOTALS_CHANGED')
  const coverage=list(summary.shapeCoverage,'SUMMARY_ALL12_SHAPE_COVERAGE_REQUIRED').map(value=>object(value,'SUMMARY_COVERAGE_ROW_REQUIRED'))
  check(coverage.length===12,'SUMMARY_EXACT12_COVERAGE_REQUIRED');unique(coverage.map(row=>text(object(row.shape,'COVERAGE_SHAPE_REQUIRED').id,'COVERAGE_SHAPE_ID_REQUIRED')),'DUPLICATE_SUMMARY_COVERAGE')
  for(const shape of shapes){
   const group=rows.filter(row=>row.shape.id===shape.id),row=coverage.find(row=>object(row.shape,'COVERAGE_SHAPE_REQUIRED').id===shape.id);check(row,'SUMMARY_ORIGINAL_SHAPE_COVERAGE_MISSING')
   const actualClosed=group.filter(row=>row.sourceStatus!=='fatal'&&row.actualClosedShape).length,positive=group.filter(row=>row.sourceStatus!=='fatal'&&row.positiveDelegatedBusiness).length
   check(row.registered===6&&row.completed===group.filter(row=>row.sourceStatus==='completed').length&&row.policyRefused===group.filter(row=>row.sourceStatus==='policy_refused').length&&row.fatal===group.filter(row=>row.sourceStatus==='fatal').length&&row.unexecutedDueToFatal===0&&row.actualClosedBusinesses===actualClosed&&row.positiveDelegatedBusinesses===positive&&row.hasActualClosedShape===(actualClosed>0)&&row.hasRetainedHelpedLearner===(positive>0)&&row.monitoringCompleted===group.filter(row=>row.monitoringComplete).length,'SUMMARY_ACTUAL_PER_SHAPE_COVERAGE_CHANGED:'+shape.id)
  }
  check(summary.all12HaveActualClosedShape===shapes.every(s=>rows.some(r=>r.shape.id===s.id&&r.sourceStatus!=='fatal'&&r.actualClosedShape))&&summary.all12HaveRetainedHelpedLearner===shapes.every(s=>rows.some(r=>r.shape.id===s.id&&r.sourceStatus!=='fatal'&&r.positiveDelegatedBusiness)),'SUMMARY_ALL12_POSITIVE_COVERAGE_CHANGED')
 }
 return {status:allVerified?'verified':'crosschecked-available-evidence-only',recorded:recorded.length,sourceStatuses:{completed:count('completed'),policyRefused:count('policy_refused'),fatal:count('fatal'),unexecutedDueToFatal:count('unexecuted_due_to_fatal')}}
}

let registration:JsonObject|null=null,registered:RegisteredRow[]=[],matrixLink:unknown=null,summaryAudit:unknown=null
try{
 registration=readJson(inputName+'/registration.json',inputName)
 freezeSources(registration);matrixLink=originalMatrix(registration);registered=registrationRows(registration)
 saveJson('audit-registration.json',{inputDirectory:inputName,registered,sourceHashes,sourceInputHashes:registration.sourceInputHashes,sourceInputTree:inputTreeBefore,verifierSha256:sha(readFileSync(projectFile('scripts/verify_course_delegated_evidence.ts'))),scope:'Exactly the same six normal identities and twelve original delegated course shapes. Original 288 and full 378 are preserved; this verifier has no browser, compatibility or human-playtest scope.'})
 progress({type:'independent-prefix-replay-start',registered:72,prefixes:6})
 earnPrefixes(registration)
 for(const identity of identities){const prefix=prefixes.get(identity.name);if(prefix){try{verifyCollectorPrefix(identity,prefix)}catch(error){setupErrors.push('COLLECTOR_PREFIX:'+identity.name+':'+String(error))}}}
 progress({type:'independent-prefix-replay-complete',verified:prefixes.size,originalMilestones:prefixAudits.reduce<number>((n,row)=>n+(object(row,'PREFIX_AUDIT_REQUIRED').status==='verified'?integer(object(row,'PREFIX_AUDIT_REQUIRED').milestones,'PREFIX_AUDIT_MILESTONES_REQUIRED'):0),0)})
 for(const row of registered){guard();const audit=auditCase(row);rows.push(audit);progress({type:'case-audit',...audit});guard()}
 const expectedArchives=registered.filter(row=>existsSync(join(inputPath,row.folder,'case-index.json'))).map(row=>inputName+'/'+row.folder+'/case-evidence.xz').sort()
 same(Object.keys(inputTreeBefore).filter(file=>file.endsWith('.xz')).sort(),expectedArchives,'UNINDEXED_OR_MISSING_ACTUAL_XZ_ARCHIVE_SET')
 const summaryFile=inputName+'/course-delegated-results.json'
 if(existsSync(join(root,summaryFile)))summaryAudit=verifySummary(readJson(summaryFile,inputName),registered,registration.sourceInputHashes)
 else{summaryAudit={status:'missing',reason:'Collector summary was not written; original registration and every available case/index/journal remain independently inventoried.'};setupErrors.push('COLLECTOR_SUMMARY_MISSING')}
 guard()
 same(snapshotDirectory(inputName),inputTreeBefore,'ORIGINAL_MATRIX_INPUT_FILE_SET_OR_BYTES_CHANGED_DURING_AUDIT')
}catch(error){setupErrors.push(String(error))}
for(const expected of expectedRows)if(!rows.some(row=>row.rowId===expected.rowId))rows.push({...expected,status:'missing',sourceStatus:null,executionStatus:null,error:'NOT_INDEPENDENTLY_INSPECTED_AFTER_SETUP_OR_GUARD_FAILURE',accepted:0,rejected:0,actualClosedShape:false,positiveDelegatedBusiness:false,helpedRetainedStudents:0,monitoringComplete:false,proof:null})
try{guard();same(snapshotDirectory(inputName),inputTreeBefore,'ORIGINAL_MATRIX_FINAL_INPUT_DRIFT')}catch(error){setupErrors.push('FINAL_GUARD:'+String(error))}
const shapeCoverage=shapes.map(shape=>{
 const group=rows.filter(row=>row.shape.id===shape.id),valid=group.filter(row=>row.status==='verified'&&row.sourceStatus!=='fatal')
 return {shape,registered:6,verified:group.filter(row=>row.status==='verified').length,missing:group.filter(row=>row.status==='missing').length,partial:group.filter(row=>row.status==='partial').length,invalid:group.filter(row=>row.status==='invalid').length,finiteRefusals:valid.filter(row=>row.executionStatus==='policy_refused').length,actualClosedBusinesses:valid.filter(row=>row.actualClosedShape).length,positiveDelegatedBusinesses:valid.filter(row=>row.positiveDelegatedBusiness).length,hasActualClosedShape:valid.some(row=>row.actualClosedShape),hasRetainedHelpedLearner:valid.some(row=>row.positiveDelegatedBusiness)}
})
const evidenceValid=setupErrors.length===0&&prefixes.size===6&&rows.every(row=>row.status==='verified'&&row.sourceStatus!=='fatal')
const all12HaveRetainedHelpedLearner=shapeCoverage.every(row=>row.hasRetainedHelpedLearner)
const result={scope:'Independent P2-S2 evidence verification only. Six complete normal prefixes are actually earned again from Create; exact accepted/rejected suffix envelopes and every complete raw milestone/terminal are replayed. This does not close P3/P4, whole P2/5b/T17/goal, compatibility or human/asset acceptance.',inputDirectory:inputName,registered:72,verified:rows.filter(row=>row.status==='verified').length,missing:rows.filter(row=>row.status==='missing').length,partial:rows.filter(row=>row.status==='partial').length,invalid:rows.filter(row=>row.status==='invalid').length,completed:rows.filter(row=>row.status==='verified'&&row.sourceStatus==='completed').length,finiteRefusals:rows.filter(row=>row.status==='verified'&&row.executionStatus==='policy_refused').length,fatal:rows.filter(row=>row.sourceStatus==='fatal').length,unknown:rows.filter(row=>row.status==='invalid'||row.sourceStatus===null).length,actualAcceptedSuffixCommands:rows.reduce((n,row)=>n+row.accepted,0),actualRejectedCommands:rows.reduce((n,row)=>n+row.rejected,0),evidenceValid,all12HaveRetainedHelpedLearner,positiveCoverageComplete:evidenceValid&&all12HaveRetainedHelpedLearner,originalCoreRegistered:288,fullMatrixRegistered:378,criticalRegistered:90,criticalBranchesExecuted:0,prefixAudits,matrixLink,summaryAudit,shapeCoverage,sourceHashes,inputHashes,originalInputFileSetAndHashes:inputTreeBefore,setupErrors,rows}
saveJson('course-delegated-verification.json',result)
progress({type:'complete',registered:72,verified:result.verified,missing:result.missing,partial:result.partial,invalid:result.invalid,fatal:result.fatal,evidenceValid,all12HaveRetainedHelpedLearner,setupErrors})
if(!evidenceValid||!all12HaveRetainedHelpedLearner)process.exitCode=1


