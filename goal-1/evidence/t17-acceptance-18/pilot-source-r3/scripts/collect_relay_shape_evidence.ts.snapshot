import {readFileSync} from 'node:fs'
import {runRelayShapeBranch,RelayShapeBranchFailure,type RelayShapeBranchExecution} from './relay-shape-run.ts'
import {loadRelayShapeAuthority,replayRelayShapePrefix} from './relay-shape-prefix.ts'
import {ROOT,POLICY_FILE,RelayShapeEvidenceWriter,archiveMembers,putMember,guardHashes,check,sha,
 type RelayShapeCaseIndex,type RelayShapeResultRow,type RelayShapeSummary,type FileRef} from './relay-shape-evidence.ts'
import {RELAY_CORE_CHECKPOINTS} from '../src/testing/relay-shape-types.ts'

const writer=new RelayShapeEvidenceWriter('matrix','relay-shape-results.json'),authority=loadRelayShapeAuthority()
writer.text('progress.jsonl','')
const progress=(value:unknown)=>{writer.append('progress.jsonl',value);console.log(JSON.stringify(value))}
writer.json('registration.json',{scope:'P2 original fixed288 relay core. Counterfactual branches of six independently re-earned normal P1 histories; not62critical/22routine/browser/human.',
 prefixAnchor:authority.prefixAnchor,identities:authority.identities,cases:authority.cases,originalCases:authority.originalCases,requiredCheckpoints:RELAY_CORE_CHECKPOINTS,
 sourceHashes:authority.sourceHashes,inputHashes:authority.inputHashes,policyFile:POLICY_FILE,policyText:readFileSync(ROOT+'/'+POLICY_FILE,'utf8'),
 storage:'Full canonical source/candidates/milestones/terminal in ordered framed lossless XZ; old219 P1 expected original files remain anchored by references.',
 fatalPolicy:'Retain partial/requests/candidates; stop later fixed rows; never splice later successes.',compatibilityDevelopmentTests:0})
writer.requireSpace();writer.mkdir('prefixes');writer.mkdir('cases')
const results:RelayShapeResultRow[]=[],prefixProofs:unknown[]=[];let fatal:string|null=null
const earnedPrefixes=new Map<string,Pick<ReturnType<typeof replayRelayShapePrefix>,'run'|'raw'>>()
const guard=()=>{guardHashes(authority.sourceHashes);guardHashes(authority.inputHashes)}
for(const identity of authority.identities){
 let prefix:ReturnType<typeof replayRelayShapePrefix>|null=null
 if(fatal===null){
  const folder='prefixes/'+identity.name
  try{
   guard();writer.requireSpace();writer.mkdir(folder);writer.text(folder+'/requests.jsonl','')
   prefix=replayRelayShapePrefix(authority,identity,value=>{writer.append(folder+'/requests.jsonl',value);progress(value)})
   const journalRaw=readFileSync(writer.path(folder+'/requests.jsonl'),'utf8')
   putMember(prefix.members,'requests.jsonl',journalRaw)
   const archives=archiveMembers(writer,folder+'/prefix-evidence.xz',prefix.members)
   const index=writer.json(folder+'/prefix-index.json',{identity,record:prefix.record,archives,journal:{file:folder+'/requests.jsonl',bytes:Buffer.byteLength(journalRaw),sha256:sha(journalRaw)}})
   prefixProofs.push({identity,status:prefix.status,index,archives})
   if(prefix.status!=='verified'||prefix.run===null||prefix.raw===null)fatal=prefix.record.error??'RELAY_P1_PREFIX_REPLAY_FAILED'
   else earnedPrefixes.set(identity.name,{run:prefix.run,raw:prefix.raw})
  }catch(caught){
   fatal=String(caught);let recovery:FileRef|null=null
   try{recovery=writer.json(folder+'/prefix-failure-recovery.json',{identity,error:fatal,record:prefix?.record??null,completeOriginalMembers:prefix?[...prefix.members].map(([name,raw])=>({name,raw})):[],partialRaw:prefix?.raw??null})}
   catch(recoveryError){console.error(JSON.stringify({type:'prefix-recovery-output-failed',identity:identity.name,error:String(recoveryError),originalError:fatal}))}
   prefixProofs.push({identity,status:'failed',error:fatal,recovery})
  }
 }else prefixProofs.push({identity,status:'not_executed',error:fatal})
}
for(const row of authority.cases){
  const identity=row.identity,prefix=earnedPrefixes.get(identity.name)
  if(fatal!==null||earnedPrefixes.size!==6||!prefix||prefix.run===null||prefix.raw===null){results.push({caseId:row.id,identity:identity.name,shapeId:row.shape.id,status:'not_executed',positive:false,index:null,error:fatal??'NO_VERIFIED_P1_PREFIX',recovery:null});continue}
  let execution:RelayShapeBranchExecution|null=null,index:FileRef|null=null,recovery:FileRef|null=null
  try{
   guardHashes(authority.sourceHashes);writer.requireSpace()
   execution=runRelayShapeBranch(row,prefix.raw,writer,progress)
   check(execution.journal!==null&&execution.outputError===null,'RELAY_BRANCH_OUTPUT_INCOMPLETE:'+execution.outputError)
   check(execution.run.origin==='normal'&&execution.record.identity.name===identity.name,'RELAY_BRANCH_ORIGINAL_NORMAL_IDENTITY_CHANGED')
   const archives=archiveMembers(writer,row.folder+'/case-evidence.xz',execution.members)
   const caseIndex:RelayShapeCaseIndex={caseId:row.id,identity,shape:row.shape,record:execution.record,archives,journal:execution.journal}
   index=writer.json(row.folder+'/case-index.json',caseIndex)
   const record=execution.record
   results.push({caseId:row.id,identity:identity.name,shapeId:row.shape.id,status:record.status,positive:record.status==='completed'&&record.assessment?.positive===true,index,error:record.error,recovery:null})
   if(record.status==='fatal')fatal=record.error??'RELAY_SHAPE_UNKNOWN_FATAL'
   progress({type:'case-result',caseId:row.id,status:record.status,positive:record.status==='completed'&&record.assessment?.positive===true,index,attempts:record.attempts.length})
  }catch(caught){
   const error=String(caught);fatal=error
   const snapshot=caught instanceof RelayShapeBranchFailure?caught.snapshot:null,availableMembers=execution?.members??snapshot?.members
   const recoveryPayload={row,error,record:execution?.record??snapshot?.record??null,completeOriginalMembers:availableMembers?[...availableMembers].map(([name,raw])=>({name,raw})):[],originalSource:prefix.raw,
    ...(snapshot?{branchFailure:{...snapshot,members:undefined},lastVerifiedCanonical:snapshot.lastVerified,attempts:snapshot.attempts,milestones:snapshot.milestones}:{}),scope:'Complete available originals after failure; not complete or green.'}
   try{
    try{recovery=writer.json(row.folder+'/case-failure-recovery.json',recoveryPayload)}
    catch(primaryRecoveryError){recovery=writer.json('cases/'+row.id+'-failure-recovery.json',{...recoveryPayload,primaryRecoveryError:String(primaryRecoveryError)})}
   }
   catch(recoveryError){console.error(JSON.stringify({type:'case-complete-original-recovery-output-failed',caseId:row.id,error:String(recoveryError),originalError:error}))}
   const previous=results.findIndex(r=>r.caseId===row.id),failure:RelayShapeResultRow={caseId:row.id,identity:identity.name,shapeId:row.shape.id,status:'fatal',positive:false,index,error,recovery}
   if(previous>=0)results[previous]=failure;else results.push(failure)
   try{progress({type:'case-fatal',caseId:row.id,error,recovery})}catch(progressError){console.error(JSON.stringify({type:'case-fatal-progress-output-failed',caseId:row.id,error:String(progressError)}))}
  }
}
let finalGuardError:string|null=null;try{guard()}catch(caught){finalGuardError=String(caught);fatal??=finalGuardError}
check(results.length===288,'ALL_ORIGINAL_288_ROWS_MUST_REMAIN_RECORDED')
const count=(status:RelayShapeResultRow['status'])=>results.filter(r=>r.status===status).length
const summary:RelayShapeSummary={registered:288,recorded:results.length,executed:288-count('not_executed'),closed:count('completed'),finite:count('policy_refused'),fatal:count('fatal'),notExecuted:count('not_executed'),positive:results.filter(r=>r.positive).length,
 sourceHashes:authority.sourceHashes,inputHashes:authority.inputHashes,results,prefixProofs}
writer.json('relay-shape-results.json',{...summary,finalGuardError,passed:fatal===null&&summary.fatal===0&&summary.notExecuted===0,all288Positive:summary.positive===288,scope:'Only original288 P2 outcomes; finite and positive separate.62/22/whole5c/T17/goal open.',compatibilityDevelopmentTests:0})
console.log(JSON.stringify({registered:288,executed:summary.executed,closed:summary.closed,finite:summary.finite,fatal:summary.fatal,notExecuted:summary.notExecuted,positive:summary.positive,finalGuardError}))
if(fatal!==null||summary.fatal||summary.notExecuted||finalGuardError)process.exitCode=1
