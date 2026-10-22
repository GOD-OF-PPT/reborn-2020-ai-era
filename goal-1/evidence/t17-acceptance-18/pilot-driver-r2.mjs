import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {loadRelayShapeAuthority} from '../../../scripts/relay-shape-prefix.ts'
import {runRelayShapeBranch,RelayShapeBranchFailure} from '../../../scripts/relay-shape-run.ts'
import {replayRelayShapeCase} from '../../../scripts/verify_relay_shape_evidence.ts'
import {RelayShapeEvidenceWriter,archiveMembers,unpackArchive,anchoredText,PREFIX_DIRECTORY,ROOT,check,guardHashes,sha} from '../../../scripts/relay-shape-evidence.ts'

const writer=new RelayShapeEvidenceWriter('matrix','pilot-results.json'),authority=loadRelayShapeAuthority()
const ids=['RLY-C001','RLY-C022','RLY-C043','RLY-C032','RLY-C224']
writer.text('progress.jsonl','');writer.mkdir('cases')
const progress=value=>{writer.append('progress.jsonl',value);console.log(JSON.stringify(value))}
writer.json('pilot-registration.json',{scope:'Five independent integration pilots from exact sealed earned P1 raw. No new Create claim, not formal 288 execution, never merged into matrix-r1.',ids,
 sourceHashes:authority.sourceHashes,inputHashes:authority.inputHashes,driver:{file:'goal-1/evidence/t17-acceptance-18/pilot-driver-r2.mjs',sha256:sha(readFileSync(fileURLToPath(import.meta.url)))},
 fundingAndDates:'Original frozen policy-r1 unchanged; pilot fatal stops remaining registered pilot IDs.',normalPrefixAnchor:authority.prefixAnchor})
const rows=[];let fatal=null
for(const id of ids){
 if(fatal!==null){rows.push({caseId:id,status:'not_executed_due_to_pilot_fatal',error:fatal});continue}
 let execution=null
 try{
  guardHashes(authority.sourceHashes);guardHashes(authority.inputHashes);writer.requireSpace()
  const row=authority.cases.find(c=>c.id===id);check(row,'ORIGINAL_PILOT_ID_REQUIRED')
  const prefix=authority.prefixes.find(p=>p.identity.name===row.identity.name);check(prefix,'ORIGINAL_PILOT_PREFIX_REQUIRED')
  const sourceRaw=anchoredText(PREFIX_DIRECTORY+'/'+prefix.evidence.final.file)
  execution=runRelayShapeBranch(row,sourceRaw,writer,progress)
  check(execution.journal&&execution.outputError===null,'COMPLETE_PILOT_JOURNAL_REQUIRED')
  const archives=archiveMembers(writer,row.folder+'/case-evidence.xz',execution.members)
  const index={caseId:row.id,identity:row.identity,shape:row.shape,record:execution.record,archives,journal:execution.journal}
  const indexRef=writer.json(row.folder+'/case-index.json',index),members=new Map()
  for(const archive of archives)for(const [member,raw]of unpackArchive(writer.name+'/'+row.folder+'/'+archive.file,archive)){
   check(!members.has(member),'PILOT_DUPLICATE_COMPLETE_ARCHIVE_MEMBER');members.set(member,raw)
  }
  const originalIndex=JSON.parse(readFileSync(writer.path(indexRef.file),'utf8'))
  const journalText=readFileSync(writer.path(execution.journal.file),'utf8')
  const audit=replayRelayShapeCase(row,sourceRaw,originalIndex,members,journalText)
  const proof=writer.json(row.folder+'/pilot-suffix-audit.json',audit)
  const result={caseId:id,status:execution.record.status,error:execution.record.error,classification:audit.classification,positive:audit.positive,index:indexRef,proof,
   actualDate:execution.run.timeline.cursor.date,attempts:execution.record.attempts.length,checkpoints:execution.record.assessment?.checkpoints.map(c=>({name:c.name,status:c.status}))??[]}
  rows.push(result);progress({type:'pilot-result',...result})
  if(execution.record.status==='fatal'||audit.classification==='invalid_or_unproven')fatal=execution.record.error??'PILOT_INDEPENDENT_SUFFIX_NOT_VERIFIED'
 }catch(caught){
  fatal=String(caught)
  try{writer.json('pilot-failure-'+id+'.json',{caseId:id,error:fatal,record:execution?.record??null,failureSnapshot:caught instanceof RelayShapeBranchFailure?{...caught.snapshot,members:undefined}:null,completeAvailableMembers:[...(execution?.members??(caught instanceof RelayShapeBranchFailure?caught.snapshot.members:new Map()))].map(([name,raw])=>({name,raw}))})}
  catch(recoveryError){console.error(JSON.stringify({type:'pilot-recovery-write-failed',caseId:id,error:String(recoveryError),originalError:fatal}))}
  rows.push({caseId:id,status:'pilot_failure',error:fatal});progress({type:'pilot-failure',caseId:id,error:fatal})
 }
}
guardHashes(authority.sourceHashes);guardHashes(authority.inputHashes)
writer.json('pilot-results.json',{scope:'Only five preregistered integration pilots; formal288 and six new Create replays still pending.',registered:5,recorded:rows.length,passed:fatal===null,error:fatal,rows,formalCoreBranchesAccepted:0,compatibilityDevelopmentTests:0})
console.log(JSON.stringify({type:'pilot-complete',registered:5,recorded:rows.length,passed:fatal===null,error:fatal,formalCoreBranchesAccepted:0,root:ROOT}))
if(fatal!==null)process.exitCode=1
