import {createCampaignCodec,campaignRelay,campaignStory,campaignRuntime,campaignOperations,campaignMarket} from '../src/application/campaign.ts'
import {evaluateCommand,previewCommand} from '../src/core/commands.ts'
import {accountFunds,accountPosition} from '../src/core/ledger.ts'
import {actionBudget} from '../src/core/economy.ts'
import {projectRelay} from '../src/core/relay-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {projectWorkbench} from '../src/application/workbench-projection.ts'
import {relayPrefixPublicReadiness} from '../src/testing/relay-prefix-readiness.ts'
import {RELAY_SHAPES,RELAY_CORE_CHECKPOINTS,type RelayCoreCase,type RelayShapeIdentity} from '../src/testing/relay-shape-types.ts'
import type {CommandEnvelope,GameRun} from '../src/core/run-types.ts'
import type {CommandPreview} from '../src/core/commands.ts'
import {ROOT,ORIGINAL_REGISTRATION,PREFIX_DIRECTORY,AUDIT_DIRECTORY,P1_ANCHOR,IDENTITIES,
 anchoredText,readText,check,equal,sha,hashFiles,guardHashes,relayShapeSourceNames,strict,createFrom,commandsOf,putMember,type FileRef,type MemberRef} from './relay-shape-evidence.ts'

interface OriginalAttempt {command:CommandEnvelope;before:{revision:number;sha256:string};outcome:'accepted'|'rejected'|'unresolved';after:{revision:number;sha256:string};reasonCodes?:readonly string[]}
interface OriginalPreview {command:CommandEnvelope;preview:CommandPreview;revision:number;beforeSha256:string;afterSha256:string}
interface OriginalMilestone extends FileRef {name:string;revision:number;date:string}
interface OriginalEvidence {identity:RelayShapeIdentity;status:string;initial:FileRef;final:FileRef;milestones:OriginalMilestone[];attempts:OriginalAttempt[];previews:OriginalPreview[];trace:unknown[];requestJournal:string;publicRelay:unknown;publicStory:unknown;publicWorkbench:unknown}
interface PrefixRow extends RelayShapeIdentity {status:string;evidence:FileRef}
interface OriginalCore {id:string;identityId:string;backgroundId:string;seed:string;supplierId:string;offerKind:string;unitPriceFen:number;customerMode:string;supportMode:string;requiredCheckpoints:readonly string[];[key:string]:unknown}
export interface RelayShapePrefixAuthority {identity:RelayShapeIdentity;row:PrefixRow;evidence:OriginalEvidence;evidenceFile:string}

export function loadRelayShapeAuthority(){
 const registration=JSON.parse(anchoredText(ORIGINAL_REGISTRATION)) as {coreCases:OriginalCore[];fixedDimensions:{coreTotal:number;perIdentity:number};identities:{id:string;backgroundId:string;seed:string}[]}
 check(registration.fixedDimensions.coreTotal===288&&registration.fixedDimensions.perIdentity===48&&registration.coreCases.length===288,'ORIGINAL_288_RELAY_REGISTRATION_REQUIRED')
 equal(registration.identities.map(({backgroundId,seed})=>({backgroundId,seed})),IDENTITIES.map(({backgroundId,seed})=>({backgroundId,seed})),'ORIGINAL_SIX_RELAY_IDENTITY_ORDER_CHANGED')
 const cases:RelayCoreCase[]=registration.coreCases.map((row,index)=>{
  check(row.id==='RLY-C'+String(index+1).padStart(3,'0'),'EXACT_ORIGINAL_RELAY_CASE_ID_CHANGED')
  equal(row.requiredCheckpoints,RELAY_CORE_CHECKPOINTS,'ORIGINAL_TEN_RELAY_CHECKPOINTS_CHANGED')
  const identity=IDENTITIES.find(i=>i.backgroundId===row.backgroundId&&i.seed===row.seed),shape=RELAY_SHAPES.find(s=>s.supplierId===row.supplierId&&s.offerKind===row.offerKind&&s.customerMode===row.customerMode&&s.supportMode===row.supportMode&&s.unitPriceFen===row.unitPriceFen)
  check(identity&&shape&&row.identityId===row.backgroundId+'--'+row.seed,'REGISTERED_RELAY_IDENTITY_OR_TUPLE_MISMATCH')
  return {id:row.id,identityId:row.identityId,identity,shape,folder:'cases/'+row.id}
 })
 for(const identity of IDENTITIES){const own=cases.filter(c=>c.identity.name===identity.name);check(own.length===48,'EXACT_48_CASES_PER_IDENTITY_REQUIRED');equal(own.map(c=>c.shape.id).sort(),RELAY_SHAPES.map(s=>s.id).sort(),'EXACT_48_RELAY_TUPLES_REQUIRED')}
 const summaryName=PREFIX_DIRECTORY+'/relay-prefix-results.json',auditName=AUDIT_DIRECTORY+'/relay-prefix-readiness.json'
 const summary=JSON.parse(anchoredText(summaryName)) as {registered:number;recorded:number;completed:number;fatal:number;results:PrefixRow[];sourceHashes:Record<string,string>}
 const audit=JSON.parse(anchoredText(auditName)) as {passed:boolean;positiveReady:number;audited:number;rows:{identity:RelayShapeIdentity;classification:string}[]}
 check(summary.registered===6&&summary.recorded===6&&summary.completed===6&&summary.fatal===0&&audit.passed&&audit.audited===6&&audit.positiveReady===6,'SEALED_P1_SIX_READY_SOURCE_REQUIRED')
 const inputs=new Set([ORIGINAL_REGISTRATION,summaryName,auditName,'goal-1/evidence/t17-acceptance-17/sealed-evidence.json'])
 const prefixes=IDENTITIES.map(identity=>{
  const row=summary.results.find(r=>r.name===identity.name);check(row&&row.status==='completed'&&row.backgroundId===identity.backgroundId&&row.seed===identity.seed,'EXACT_P1_IDENTITY_MISSING')
  check(audit.rows.some(r=>r.identity.name===identity.name&&r.classification==='verified_ready'),'ORIGINAL_P1_READY_AUDIT_ROW_MISSING')
  const evidenceFile=PREFIX_DIRECTORY+'/'+row.evidence.file,evidenceText=anchoredText(evidenceFile)
  check(Buffer.byteLength(evidenceText)===row.evidence.bytes&&sha(evidenceText)===row.evidence.sha256,'P1_ORIGINAL_EVIDENCE_REFERENCE_CHANGED')
  const evidence=JSON.parse(evidenceText) as OriginalEvidence;equal(evidence.identity,identity,'P1_CASE_IDENTITY_CHANGED');check(evidence.status==='completed','P1_CASE_NOT_COMPLETED')
  inputs.add(evidenceFile);inputs.add(PREFIX_DIRECTORY+'/'+evidence.requestJournal)
  for(const descriptor of [evidence.initial,evidence.final,...evidence.milestones]){
   const name=PREFIX_DIRECTORY+'/'+descriptor.file,text=anchoredText(name)
   check(Buffer.byteLength(text)===descriptor.bytes&&sha(text)===descriptor.sha256,'P1_FULL_ORIGINAL_RAW_REFERENCE_CHANGED:'+name);inputs.add(name)
  }
  return {identity,row,evidence,evidenceFile}
 })
 const inputHashes=hashFiles([...inputs]),sourceHashes=hashFiles(relayShapeSourceNames(summary.sourceHashes))
 guardHashes(summary.sourceHashes)
 return {cases,identities:IDENTITIES,prefixes,originalRegistration:registration,originalCases:registration.coreCases,prefixAnchor:P1_ANCHOR,
  sourceHashes,inputHashes,oldRuntimeHashes:summary.sourceHashes,root:ROOT}
}
export type RelayShapeAuthority=ReturnType<typeof loadRelayShapeAuthority>
export interface RelayShapePrefixProof {
 readonly identity:RelayShapeIdentity;readonly status:'verified'|'failed';readonly error:string|null
 readonly sourceEvidence:string;readonly sourceEvidenceSha256:string
 readonly initial:MemberRef|null;readonly terminal:MemberRef|null
 readonly originalInitial:FileRef;readonly originalFinal:FileRef;readonly originalMilestones:readonly OriginalMilestone[]
 readonly matchedOriginalMilestones:readonly string[];readonly attempts:readonly unknown[];readonly acceptedCommands:readonly CommandEnvelope[]
 readonly previewsMatched:number;readonly traceMatched:number;readonly readiness:ReturnType<typeof relayPrefixPublicReadiness>|null
}

/** Each caller executes all six itself; no builder/policy call or cross-CLI result cache. */
export function replayRelayShapePrefix(authority:RelayShapeAuthority,identity:RelayShapeIdentity,progress:(value:unknown)=>void=()=>{}){
 const source=authority.prefixes.find(p=>p.identity.name===identity.name);check(source,'REGISTERED_P1_PREFIX_REQUIRED')
 const e=source.evidence,codec=createCampaignCodec(),members=new Map<string,string>(),acceptedCommands:CommandEnvelope[]=[],attempts:unknown[]=[]
 let run:GameRun|null=null,raw:string|null=null,initialRaw:string|null=null,error:string|null=null,initial:MemberRef|null=null,terminal:MemberRef|null=null,previewsMatched=0,traceMatched=0,readiness:ReturnType<typeof relayPrefixPublicReadiness>|null=null
 const matched=new Set<string>(),milestoneNames=new Set<string>()
 try{
  guardHashes(authority.inputHashes);guardHashes(authority.sourceHashes)
  const expectedInitial=readText(PREFIX_DIRECTORY+'/'+e.initial.file),decoded=codec.import(expectedInitial)
  check(decoded.origin==='normal'&&decoded.backgroundId===identity.backgroundId&&decoded.seed===identity.seed,'P1_NORMAL_CREATION_IDENTITY_CHANGED')
  const state=strict(createFrom(decoded),codec);run=state.run;raw=state.raw;initialRaw=raw
  check(raw===expectedInitial,'P1_CREATE_COMPLETE_ORIGINAL_BYTES_CHANGED');initial=putMember(members,'initial.json',raw)
  const journal=readText(PREFIX_DIRECTORY+'/'+e.requestJournal),expectedJournal:string[]=[]
  for(const attempt of e.attempts){
   expectedJournal.push(JSON.stringify({type:'attempted',command:attempt.command,before:attempt.before})+'\n')
   for(const preview of e.previews.filter(p=>p.command.commandId===attempt.command.commandId&&p.command.expectedRevision===attempt.command.expectedRevision))expectedJournal.push(JSON.stringify({type:'previewed',...preview})+'\n')
   check(attempt.outcome==='accepted'||attempt.outcome==='rejected','P1_UNRESOLVED_REQUEST_CANNOT_EARN_PREFIX')
   expectedJournal.push(JSON.stringify(attempt.outcome==='accepted'?{type:'accepted',command:attempt.command,after:attempt.after}:{type:'rejected',command:attempt.command,reasonCodes:attempt.reasonCodes??[],after:attempt.after})+'\n')
  }
  check(journal===expectedJournal.join(''),'P1_EXACT_WRITE_AHEAD_JOURNAL_CHANGED')
  for(const m of e.milestones){check(!milestoneNames.has(m.name),'P1_DUPLICATE_MILESTONE_NAME');milestoneNames.add(m.name)}
  const inspect=()=>{
   check(run&&raw!==null,'P1_CURRENT_REPLAY_REQUIRED')
   for(const milestone of e.milestones.filter(m=>m.revision===run!.revision)){
    const original=readText(PREFIX_DIRECTORY+'/'+milestone.file);check(original===raw&&milestone.date===run.timeline.cursor.date,'P1_FULL_MILESTONE_BYTES_CHANGED:'+milestone.name);matched.add(milestone.name)
   }
   for(const p of e.previews.filter(p=>p.revision===run!.revision)){
    check(p.beforeSha256===sha(raw)&&p.afterSha256===sha(raw),'P1_PREVIEW_OLD_STATE_CHANGED');equal(previewCommand(run,p.command,codec.registry,run.actorId),p.preview,'P1_PUBLIC_PREVIEW_CHANGED');check(codec.export(run)===raw,'P1_PREVIEW_MUTATED_RAW');previewsMatched++
   }
  }
  inspect()
  for(const [index,attempt]of e.attempts.entries()){
   check(run&&raw!==null,'P1_REPLAY_STATE_REQUIRED');const before=run,beforeRaw=raw
   const actualAttempt={command:attempt.command,before:{revision:before.revision,date:before.timeline.cursor.date,sha256:sha(beforeRaw)},status:'attempted',after:null as {revision:number;date:string;sha256:string}|null,error:null as string|null,proposedCandidate:null as MemberRef|null,independentOriginalBytesMatched:false};attempts.push(actualAttempt)
   // The callback must persist the exact request before evaluation; a write error prevents evaluation.
   progress({type:'prefix-attempt',identity:identity.name,sequence:index+1,command:attempt.command,before:actualAttempt.before})
   check(attempt.before.revision===before.revision&&attempt.before.sha256===sha(beforeRaw),'P1_ATTEMPT_BEFORE_CHANGED')
   try{
   const result=evaluateCommand(before,attempt.command,codec.registry,before.actorId);check(codec.export(before)===beforeRaw,'P1_REQUEST_MUTATED_OLD_RAW')
   if(attempt.outcome==='accepted'){
    check(result.status==='proposed','P1_ORIGINAL_ACCEPTANCE_CHANGED')
    const candidateRaw=codec.export(result.nextRun)
    try{const decoded=codec.import(candidateRaw);check(codec.export(decoded)===candidateRaw,'P1_PROPOSAL_IMPORT_BYTES_CHANGED');run=decoded;raw=candidateRaw}
    catch(caught){actualAttempt.proposedCandidate=putMember(members,'unexpected-candidate-'+String(index+1).padStart(5,'0')+'.json',candidateRaw);throw caught}
    acceptedCommands.push(attempt.command);actualAttempt.status='accepted'
    const trace=e.trace[traceMatched++],business=run.operations!.businesses.find(b=>b.route==='api_relay')
    equal(trace,{kind:attempt.command.kind,revision:run.revision,date:run.timeline.cursor.date,personal:accountFunds(run.economy.ledger,'personal'),company:business?accountPosition(run.economy.ledger,business.accountId):null,actionPoints:actionBudget(run.economy,run.timeline.cursor.date)},'P1_ORIGINAL_PUBLIC_FINANCE_AP_TRACE_CHANGED')
    inspect()
   }else{if(result.status==='proposed')actualAttempt.proposedCandidate=putMember(members,'unexpected-candidate-'+String(index+1).padStart(5,'0')+'.json',codec.export(result.nextRun));check(result.status==='rejected','P1_ORIGINAL_REJECTION_CHANGED');equal(result.reasonCodes,attempt.reasonCodes??[],'P1_ORIGINAL_REJECTION_REASON_CHANGED');actualAttempt.status='rejected'}
   check(attempt.after.revision===run.revision&&attempt.after.sha256===sha(raw),'P1_ATTEMPT_AFTER_CHANGED')
   actualAttempt.independentOriginalBytesMatched=true
   actualAttempt.after={revision:run.revision,date:run.timeline.cursor.date,sha256:sha(raw)}
   progress({type:'prefix-result',identity:identity.name,sequence:index+1,...actualAttempt})
   }catch(caught){actualAttempt.status=run.revision>before.revision?'committed_with_exception':'exception';actualAttempt.error=String(caught);actualAttempt.after={revision:run.revision,date:run.timeline.cursor.date,sha256:sha(raw)};progress({type:'prefix-exception',identity:identity.name,sequence:index+1,...actualAttempt});throw caught}
   if((index+1)%25===0)progress({type:'prefix-replay',identity:identity.name,attempts:index+1,revision:run.revision})
  }
  check(run&&raw!==null&&raw===readText(PREFIX_DIRECTORY+'/'+e.final.file),'P1_FINAL_FULL_ORIGINAL_BYTES_CHANGED')
  check(matched.size===e.milestones.length&&previewsMatched===e.previews.length&&traceMatched===e.trace.length,'P1_ALL_MILESTONES_PREVIEWS_TRACES_REQUIRED')
  equal(projectRelay(run,campaignRelay),e.publicRelay,'P1_PUBLIC_RELAY_CHANGED');equal(projectStory(run,campaignStory),e.publicStory,'P1_PUBLIC_STORY_CHANGED');equal(projectWorkbench(run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog),e.publicWorkbench,'P1_PUBLIC_WORKBENCH_CHANGED')
  equal(commandsOf(run),acceptedCommands.map(c=>({...c,payload:codec.registry.normalize(c.kind,c.payload)})),'P1_FULL_ORIGINAL_RECEIPT_COMMANDS_CHANGED')
  readiness=relayPrefixPublicReadiness(run,acceptedCommands);check(readiness.ready,'P1_CURRENT_PUBLIC_READINESS_NOT_MET')
 }catch(caught){error=String(caught)}
 if(raw!==null)terminal=putMember(members,error===null?'final.json':'partial.json',raw)
 const record:RelayShapePrefixProof={identity,status:error===null?'verified':'failed',error,sourceEvidence:source.evidenceFile,sourceEvidenceSha256:source.row.evidence.sha256,initial,terminal,
  originalInitial:e.initial,originalFinal:e.final,originalMilestones:e.milestones,matchedOriginalMilestones:[...matched],attempts,acceptedCommands,previewsMatched,traceMatched,readiness}
 putMember(members,'prefix-record.json',JSON.stringify(record,null,2)+'\n')
 return {status:record.status,identity,run,raw,initialRaw,members,record}
}
