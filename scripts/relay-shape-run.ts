import {readFileSync} from 'node:fs'
import {createCampaignCodec,campaignRelay,campaignStory,campaignRuntime,campaignOperations,campaignMarket} from '../src/application/campaign.ts'
import {evaluateCommand,previewCommand} from '../src/core/commands.ts'
import {projectRelay} from '../src/core/relay-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {projectWorkbench} from '../src/application/workbench-projection.ts'
import {StoryHarness} from '../src/testing/story-harness.ts'
import {runRelayShape,RelayShapePolicyRefusal} from '../src/testing/relay-shape-scenario.ts'
import {assertRelayShapeMoney,assessRelayShape} from '../src/testing/relay-shape-assertions.ts'
import type {RelayCoreCase,RelayShape} from '../src/testing/relay-shape-types.ts'
import type {GameRun,CommandEnvelope} from '../src/core/run-types.ts'
import {RelayShapeEvidenceWriter,putMember,commandsOf,check,equal,sha,type RelayShapeFingerprint,type RelayShapeAttempt,type RelayShapeMilestone,type RelayShapeRecord,type FileRef} from './relay-shape-evidence.ts'

export interface RelayShapeUnverifiedDiagnostic {
 readonly stage:string;readonly sequence:number|null;readonly format:'diagnostic-json-not-save'
 readonly raw:string|null;readonly serializationError:string|null;readonly candidateExportRaw:string|null
}
export interface RelayShapeBranchFailureSnapshot {
 readonly caseId:string;readonly sourceRaw:string;readonly members:ReadonlyMap<string,string>
 readonly attempts:readonly RelayShapeAttempt[];readonly milestones:readonly RelayShapeMilestone[];readonly record:RelayShapeRecord|null
 readonly lastVerified:{readonly raw:string;readonly fingerprint:RelayShapeFingerprint}|null
 readonly primaryError:string;readonly secondaryErrors:readonly {stage:string;error:string}[]
 readonly unverified:readonly RelayShapeUnverifiedDiagnostic[]
 readonly journal:{readonly file:string;readonly raw:string|null;readonly error:string|null}
}
export class RelayShapeBranchFailure extends Error {
 readonly snapshot:RelayShapeBranchFailureSnapshot
 constructor(snapshot:RelayShapeBranchFailureSnapshot,cause:unknown){super(snapshot.primaryError,{cause});this.name='RelayShapeBranchFailure';this.snapshot=snapshot}
}
function diagnostic(stage:string,sequence:number|null,value:unknown,candidateExportRaw:string|null=null):RelayShapeUnverifiedDiagnostic {
 let raw:string|null=null,serializationError:string|null=null
 try{raw=JSON.stringify(value)??null;if(raw===null)serializationError='NO_JSON_DIAGNOSTIC_REPRESENTATION'}catch(caught){serializationError=String(caught)}
 return {stage,sequence,format:'diagnostic-json-not-save',raw,serializationError,candidateExportRaw}
}

/** Every generated proposal is retained before import, commitment, journals or accounting can fail. */
class RecordingHarness extends StoryHarness {
 readonly attempts:RelayShapeAttempt[]=[]
 readonly secondaryErrors:{stage:string;error:string}[]=[];readonly unverified:RelayShapeUnverifiedDiagnostic[]=[]
 primaryError:string|null=null;lastVerified:RelayShapeBranchFailureSnapshot['lastVerified']=null
 readonly members:Map<string,string>;readonly original:GameRun;readonly shape:RelayShape
 readonly writer:RelayShapeEvidenceWriter;readonly folder:string;readonly caseId:string
 constructor(sourceRaw:string,row:RelayCoreCase,writer:RelayShapeEvidenceWriter,members:Map<string,string>){
  const codec=createCampaignCodec(),source=codec.import(sourceRaw);super({priorRun:source})
  this.members=members;this.original=source;this.shape=row.shape;this.writer=writer;this.folder=row.folder;this.caseId=row.id
  check(this.codec.export(source)===sourceRaw,'RELAY_SHAPE_SOURCE_STRICT_IMPORT_CHANGED')
  this.lastVerified={raw:sourceRaw,fingerprint:{revision:source.revision,date:source.timeline.cursor.date,sha256:sha(sourceRaw)}}
 }
 fingerprint():RelayShapeFingerprint{return {revision:this.run.revision,date:this.run.timeline.cursor.date,sha256:sha(this.codec.export(this.run))}}
 override command(kind:string,payload:unknown):CommandEnvelope{return {...super.command(kind,payload),commandId:'relay-core-'+this.caseId+'-'+this.run.revision}}
 #attempt(kind:string,payload:unknown,commandId:string,expectedRejection=false){
  const command={...this.command(kind,payload),commandId},before=this.run,beforeRaw=this.codec.export(before)
  const fingerprint={revision:before.revision,date:before.timeline.cursor.date,sha256:sha(beforeRaw)}
  const attempt:RelayShapeAttempt={sequence:this.attempts.length+1,command,before:fingerprint,status:'attempted',after:fingerprint,reasonCodes:[],error:null,proposedCandidate:null,preview:null,money:{before:null,after:null},...(expectedRejection?{expectedRejection:true}:{})}
  this.attempts.push(attempt);this.writer.append(this.folder+'/requests.jsonl',{type:'attempted',...attempt})
  let proposal:GameRun|null=null,candidateRaw:string|null=null
  try{
   attempt.money.before=assertRelayShapeMoney(this.original,before,this.shape)
   if(kind==='StartRelayServicePeriod'){
    const value=previewCommand(before,command,this.codec.registry,before.actorId),afterSha256=sha(this.codec.export(before))
    check(afterSha256===fingerprint.sha256,'RELAY_SHAPE_PREVIEW_CHANGED_COMPLETE_OLD_RAW')
    attempt.preview={value,beforeSha256:fingerprint.sha256,afterSha256};this.writer.append(this.folder+'/requests.jsonl',{type:'previewed',sequence:attempt.sequence,command,preview:attempt.preview})
   }
   const result=evaluateCommand(before,command,this.codec.registry,before.actorId)
   if(result.status==='proposed'){
    proposal=result.nextRun;candidateRaw=this.codec.export(proposal)
    attempt.proposedCandidate=putMember(this.members,'candidate-'+String(attempt.sequence).padStart(5,'0')+'.json',candidateRaw)
   }
   check(this.run===before&&this.codec.export(before)===beforeRaw,'RELAY_SHAPE_EVALUATION_CHANGED_OLD_RAW')
   if(result.status==='rejected'){
    attempt.status='rejected';attempt.reasonCodes=[...result.reasonCodes];attempt.money.after=assertRelayShapeMoney(this.original,this.run,this.shape)
    this.writer.append(this.folder+'/requests.jsonl',{type:'result',...attempt})
    if(expectedRejection)return result.reasonCodes
    throw Error(JSON.stringify({date:before.timeline.cursor.date,kind,payload,result}))
   }
   check(result.status==='proposed','RELAY_SHAPE_UNEXPECTED_EXISTING_RECEIPT')
   check(candidateRaw!==null&&attempt.proposedCandidate!==null,'RELAY_SHAPE_GENERATED_PROPOSAL_NOT_RETAINED')
   if(expectedRejection)throw Error('RELAY_SHAPE_EXPECTED_REJECTION_WAS_PROPOSED')
   const decoded=this.codec.import(candidateRaw);check(this.codec.export(decoded)===candidateRaw,'RELAY_SHAPE_PROPOSAL_STRICT_IMPORT_CHANGED')
   this.run=decoded
   const after={revision:decoded.revision,date:decoded.timeline.cursor.date,sha256:sha(candidateRaw)}
   this.lastVerified={raw:candidateRaw,fingerprint:after}
   this.commands.push(command);attempt.status='accepted';attempt.after=after
   attempt.money.after=assertRelayShapeMoney(this.original,this.run,this.shape)
   this.writer.append(this.folder+'/requests.jsonl',{type:'result',...attempt})
   return this.run
  }catch(caught){
   this.primaryError??=String(caught)
   if(proposal!==null&&attempt.proposedCandidate===null)this.unverified.push(diagnostic('proposal-not-retained',attempt.sequence,proposal,candidateRaw))
   if(attempt.status!=='rejected'){attempt.error=String(caught);attempt.status=this.run.revision>before.revision?'committed_with_exception':'exception'}
   let afterVerified=true
   try{attempt.after=this.fingerprint()}catch(fingerprintError){afterVerified=false;this.secondaryErrors.push({stage:'attempt-after-fingerprint',error:String(fingerprintError)});this.unverified.push(diagnostic('attempt-after-unverified',attempt.sequence,this.run))}
   try{
    if(attempt.status!=='rejected')this.writer.append(this.folder+'/requests.jsonl',afterVerified?{type:'exception',...attempt}:{type:'exception-after-unverified',sequence:attempt.sequence,command,error:attempt.error,after:null})
   }catch(journalError){this.secondaryErrors.push({stage:'attempt-exception-journal',error:String(journalError)})}
   throw caught
  }
 }
 override sendAs(kind:string,payload:unknown,commandId:string):GameRun{const value=this.#attempt(kind,payload,commandId);check('runId' in value,'RELAY_SHAPE_SEND_RETURNED_REJECTION');return value}
 override reject(kind:string,payload:unknown):readonly string[]{const value=this.#attempt(kind,payload,this.command(kind,payload).commandId,true);check(Array.isArray(value),'RELAY_SHAPE_REJECT_RETURNED_ACCEPTANCE');return value}
}

/** One registered branch only. Importing this module never starts a matrix. */
export function runRelayShapeBranch(row:RelayCoreCase,sourceRaw:string,writer:RelayShapeEvidenceWriter,progress:(value:unknown)=>void=()=>{}){
 const members=new Map<string,string>(),milestones:RelayShapeMilestone[]=[],names=new Set<string>()
 let h:RecordingHarness|null=null,record:RelayShapeRecord|null=null,executionError:string|null=null
 try{
 const codec=createCampaignCodec()
 const source=putMember(members,'source.json',sourceRaw)
 const harness=new RecordingHarness(sourceRaw,row,writer,members);h=harness
 const sourceCommands=commandsOf(h.original)
 let status:RelayShapeRecord['status']='completed',error:string|null=null,policyDetail:unknown=null,assessment:RelayShapeRecord['assessment']=null,outputError:string|null=null
 try{
  writer.requireSpace();writer.mkdir(row.folder);writer.text(row.folder+'/requests.jsonl','')
  progress({type:'case-start',caseId:row.id,identity:row.identity.name,shape:row.shape})
  runRelayShape(h,row.shape,{milestone(name,run){
   check(!names.has(name),'DUPLICATE_RELAY_SHAPE_MILESTONE_NAME');names.add(name)
   const raw=codec.export(run),ref=putMember(members,'milestone-'+String(milestones.length+1).padStart(3,'0')+'.json',raw)
   milestones.push({name,revision:run.revision,date:run.timeline.cursor.date,raw:ref,money:assertRelayShapeMoney(harness.original,run,row.shape)})
  }})
 }catch(caught){error=String(caught);executionError=error;if(caught instanceof RelayShapePolicyRefusal){status='policy_refused';policyDetail={code:caught.code,detail:caught.detail}}else status='fatal'}
 check(h.secondaryErrors.length===0&&h.unverified.length===0,'RELAY_SHAPE_EXCEPTION_REQUIRES_FAILURE_SNAPSHOT')
 const actual=h.run,raw=codec.export(actual)
 try{
  assessment=assessRelayShape(h.original,actual,row.shape)
  if(status==='completed')check(assessment.positive&&assessment.checkpoints.length===10&&assessment.checkpoints.every(c=>c.status==='passed'),'COMPLETED_RELAY_SHAPE_MISSING_POSITIVE_OR_ORIGINAL_CHECKPOINTS')
 }catch(caught){status='fatal';error=(error?error+'; ':'')+String(caught)}
 const full=commandsOf(actual),suffix=full.slice(sourceCommands.length)
 try{
  equal(full.slice(0,sourceCommands.length),sourceCommands,'RELAY_SHAPE_REWROTE_P1_RECEIPTS')
  equal(suffix,h.attempts.filter(a=>a.status==='accepted'||a.status==='committed_with_exception').map(a=>({...a.command,payload:codec.registry.normalize(a.command.kind,a.command.payload)})),'RELAY_SHAPE_ACCEPTED_SUFFIX_RECEIPTS_MISMATCH')
  check(codec.export(h.original)===sourceRaw,'RELAY_SHAPE_MUTATED_ORIGINAL_SOURCE')
 }catch(caught){status='fatal';error=(error?error+'; ':'')+String(caught)}
 const terminal=putMember(members,status==='completed'?'final.json':'partial.json',raw)
 record={caseId:row.id,identity:row.identity,shape:row.shape,status,error,policyDetail,source,terminal,attempts:h.attempts,milestones,
  publicRelay:projectRelay(actual,campaignRelay),publicStory:projectStory(actual,campaignStory),publicWorkbench:projectWorkbench(actual,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog),assessment,suffixCommands:suffix}
 let journal:FileRef|null=null
 try{const text=readFileSync(writer.path(row.folder+'/requests.jsonl'),'utf8');journal={file:row.folder+'/requests.jsonl',bytes:Buffer.byteLength(text),sha256:sha(text)};putMember(members,'requests.jsonl',text)}catch(caught){outputError=String(caught)}
 putMember(members,'case-record.json',JSON.stringify(record,null,2)+'\n')
 return {record,members,run:actual,raw,journal,outputError}
 }catch(caught){
  const primaryError=h?.primaryError??executionError??String(caught),secondaryErrors=[...(h?.secondaryErrors??[])],unverified=[...(h?.unverified??[])]
  if(String(caught)!==primaryError)secondaryErrors.push({stage:'branch-finalization',error:String(caught)})
  if(h!==null)unverified.push(diagnostic('branch-exit-current-run',null,h.run))
  if(record!==null){try{JSON.stringify(record)}catch(recordError){secondaryErrors.push({stage:'recovery-record-serialization',error:String(recordError)});unverified.push(diagnostic('unserializable-case-record',null,record));record=null}}
  const journal:{file:string;raw:string|null;error:string|null}={file:row.folder+'/requests.jsonl',raw:null,error:null}
  try{journal.raw=readFileSync(writer.path(journal.file),'utf8')}catch(journalError){journal.error=String(journalError);secondaryErrors.push({stage:'recovery-journal-read',error:journal.error})}
  throw new RelayShapeBranchFailure({caseId:row.id,sourceRaw,members,attempts:h?.attempts??[],milestones,record,lastVerified:h?.lastVerified??null,primaryError,secondaryErrors,unverified,journal},caught)
 }
}
export type RelayShapeBranchExecution=ReturnType<typeof runRelayShapeBranch>
