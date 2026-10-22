import {readFileSync} from 'node:fs'
import {RunCodec} from '../../../src/persistence/codec.ts'
import {createCampaignCodec} from '../../../src/application/campaign.ts'
import {runRelayShapeBranch,RelayShapeBranchFailure} from '../../../scripts/relay-shape-run.ts'
import {loadRelayShapeAuthority} from '../../../scripts/relay-shape-prefix.ts'
import {RelayShapeEvidenceWriter,archiveMembers,unpackArchive,anchoredText,PREFIX_DIRECTORY,check,sha} from '../../../scripts/relay-shape-evidence.ts'

const authority=loadRelayShapeAuthority(),row=authority.cases.find(c=>c.id==='RLY-C001')
check(row,'ORIGINAL_C001_REQUIRED')
const prefix=authority.prefixes.find(p=>p.identity.name===row.identity.name)
check(prefix,'ORIGINAL_C001_PREFIX_REQUIRED')
const sourceRaw=anchoredText(PREFIX_DIRECTORY+'/'+prefix.evidence.final.file),original=createCampaignCodec().import(sourceRaw)
const writer=new RelayShapeEvidenceWriter('matrix','failure-probe-results.json')
writer.json('failure-probe-registration.json',{scope:'Two controlled serializer failures in isolated probe process; exact P1 source; no new Create/formal288/browser/compatibility claim.',caseId:row.id,sourceSha256:sha(sourceRaw),sourceHashes:authority.sourceHashes,inputHashes:authority.inputHashes,modes:['candidate-before-old-guard','after-first-accepted-result']})
writer.mkdir('probes')
const originalExport=RunCodec.prototype.export,rows=[]
for(const mode of ['candidate-before-old-guard','after-first-accepted-result']){
 const probeRow={...row,folder:'probes/'+mode}
 let candidateGenerated=false,armed=false,injected=0,failure=null,execution=null
 const append=writer.append.bind(writer)
 writer.append=(name,value)=>{const result=append(name,value);if(mode==='after-first-accepted-result'&&value.type==='result'&&value.status==='accepted')armed=true;return result}
 RunCodec.prototype.export=function(run){
  if(run.runId===original.runId&&((mode==='candidate-before-old-guard'&&candidateGenerated&&run.revision===original.revision)||(mode==='after-first-accepted-result'&&armed&&run.revision>original.revision))){injected++;throw Error('CONTROLLED_SERIALIZER_FAILURE_'+mode)}
  const raw=originalExport.call(this,run)
  if(run.runId===original.runId&&run.revision>original.revision)candidateGenerated=true
  return raw
 }
 try{execution=runRelayShapeBranch(probeRow,sourceRaw,writer)}catch(caught){failure=caught}
 finally{RunCodec.prototype.export=originalExport;writer.append=append}
 if(!(failure instanceof RelayShapeBranchFailure))writer.json('unexpected-return-'+mode+'.json',{error:failure===null?null:String(failure),record:execution?.record??null,completeMembers:execution?[...execution.members].map(([name,raw])=>({name,raw})):[]})
 check(failure instanceof RelayShapeBranchFailure,'ENRICHED_BRANCH_FAILURE_REQUIRED_'+mode)
 const snapshot=failure.snapshot
 check(injected>=2,'ORIGINAL_AND_FINALIZATION_FAILURES_MUST_BE_ACTUAL')
 check(snapshot.caseId===row.id&&snapshot.sourceRaw===sourceRaw,'FAILED_ORIGINAL_IDENTITY_CHANGED')
 check(snapshot.members.size>1&&snapshot.members.get('source.json')===sourceRaw,'FAILED_MEMBERS_NOT_PRESERVED')
 const candidate=snapshot.members.get('candidate-00001.json')
 check(typeof candidate==='string','VALID_GENERATED_CANDIDATE_MUST_SURVIVE_OLD_GUARD_FAILURE')
 const codec=createCampaignCodec(),decoded=codec.import(candidate)
 check(codec.export(decoded)===candidate&&decoded.revision===original.revision+1,'GENERATED_CANDIDATE_NOT_STRICT_CANONICAL')
 check(snapshot.lastVerified!==null&&codec.export(codec.import(snapshot.lastVerified.raw))===snapshot.lastVerified.raw,'LAST_VERIFIED_MUST_REMAIN_CANONICAL')
 const accepted=snapshot.attempts.filter(a=>a.status==='accepted'||a.status==='committed_with_exception').length
 if(mode==='candidate-before-old-guard'){check(accepted===0&&snapshot.lastVerified.raw===sourceRaw,'UNPUBLISHED_PROPOSAL_MUST_NOT_REPLACE_LAST_VERIFIED')}
 else{check(accepted===1&&snapshot.lastVerified.raw===candidate,'LAST_ACCEPTED_CANDIDATE_MUST_SURVIVE_FINISH_FAILURE')}
 const journal=readFileSync(writer.path(probeRow.folder+'/requests.jsonl'),'utf8')
 check(journal===snapshot.journal.raw&&journal.includes('attempted'),'ACTUAL_WRITE_AHEAD_JOURNAL_REQUIRED')
 const recovery=writer.json(probeRow.folder+'/probe-recovery.json',{scope:'Actual controlled failure originals; no valid terminal or game acceptance claim.',primaryError:snapshot.primaryError,secondaryErrors:snapshot.secondaryErrors,lastVerified:snapshot.lastVerified,attempts:snapshot.attempts,milestones:snapshot.milestones,unverified:snapshot.unverified,journal:snapshot.journal,completeOriginalMembers:[...snapshot.members].map(([name,raw])=>({name,raw}))})
 const archives=archiveMembers(writer,probeRow.folder+'/failure-originals.xz',snapshot.members)
 let members=0
 for(const archive of archives)for(const [name,raw]of unpackArchive(writer.name+'/'+probeRow.folder+'/'+archive.file,archive)){check(snapshot.members.get(name)===raw,'FAILURE_ORIGINAL_BYTES_DROPPED');members++}
 check(members===snapshot.members.size,'FAILURE_MEMBER_COUNT_CHANGED')
 rows.push({mode,passed:true,injected,accepted,candidateRevision:decoded.revision,lastVerifiedRevision:snapshot.lastVerified.fingerprint.revision,attempts:snapshot.attempts.length,milestones:snapshot.milestones.length,members,recovery,archives,secondaryErrors:snapshot.secondaryErrors,unverifiedCount:snapshot.unverified.length})
}
check(RunCodec.prototype.export===originalExport,'PROBE_EXPORT_METHOD_NOT_RESTORED')
writer.json('failure-probe-results.json',{passed:true,rows,formalCoreBranchesAccepted:0,newCreateReplays:0,compatibilityDevelopmentTests:0,scope:'Only controlled failure-path preservation; original game/source codec file never modified.'})
console.log(JSON.stringify({passed:true,rows:rows.map(({mode,injected,accepted,members})=>({mode,injected,accepted,members})),formalCoreBranchesAccepted:0}))
