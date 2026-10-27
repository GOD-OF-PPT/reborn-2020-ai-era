import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {repo,read,json,sha,guard,requireIdentity,identityEqual,sources,dependencies,sourceDiff,receiptInventory,sourceRoleFor,requirePublicReadbackWiring,requireFinalProducerSet,requireProducerTree,requireIdentitySet,requireDerivedPrefixProof,requireMutableFinalReferences} from './audit-io.mjs'

// FUTURE filesystem-only builder. Root must supply a final spec after R7 stops.
// No product/codec/registry/verifier/readback import or process spawning occurs.
if(process.argv.length!==6||process.argv[2]!=='--spec'||process.argv[4]!=='--fresh-registry-output')throw Error('EXPLICIT_ROOT_FINAL_SPEC_AND_FRESH_REGISTRY_REQUIRED')
const specPath=process.argv[3],freshRegistryOutput=process.argv[5],specData=read(specPath),spec=JSON.parse(specData.bytes.toString('utf8'))
const root='goal-1/evidence/t17-acceptance-37',output=path.resolve(repo,freshRegistryOutput),outputRelative=path.relative(repo,output).split(path.sep).join('/')
if(process.version!=='v22.12.0'||spec.authorizedBy!=='/root'||spec.operation!=='build_final_registry_metadata_only'||spec.freshRegistryOutput!==freshRegistryOutput||outputRelative!==freshRegistryOutput||!outputRelative.startsWith(root+'/')||!/^[a-zA-Z0-9_.-]+\.json$/.test(path.basename(output)))throw Error('EXACT_ROOT_BUILDER_AUTHORITY_REQUIRED')
guard(path.dirname(output));if(fs.existsSync(output))throw Error('FRESH_REGISTRY_OUTPUT_MUST_NOT_EXIST')
if(!Array.isArray(spec.producers)||!Array.isArray(spec.recordRoles)||!spec.publicReadback||!spec.publicReadbackWiring||!Array.isArray(spec.referenceFiles)||!Array.isArray(spec.derivedInputDependencies)||!Array.isArray(spec.nativeContributions)||typeof spec.formalPlan!=='string'||!spec.formalPlan.trim()||typeof spec.formalTasks!=='string'||!spec.formalTasks.trim())throw Error('FINAL_SOURCE_ROLES_DERIVED_READBACK_AND_PLAN_REQUIRED')
if(!/^goal-1\/evidence\/t17-acceptance-37\/full-create-audit-r[1-9][0-9]*$/.test(spec.auditDirectory))throw Error('FRESH_FORMAL_DIRECTORY_NAME_REQUIRED')
requireFinalProducerSet(spec.finalProducerSet,spec.producers)
const roleKeys=spec.recordRoles.map(r=>r.key)
if(new Set(roleKeys).size!==roleKeys.length)throw Error('UNIQUE_EXPLICIT_CAPTURE_ROLE_KEYS_REQUIRED')
const originalRows=[],references=[specData.identity],producerCuts=[],journals=[],records=[],seenKeys=new Set(),nativeEvidence=[]
const official=sources(),runtime=dependencies()
for(const producer of spec.producers){
 if(typeof producer.directory!=='string'||!/^goal-1\/evidence\/t17-acceptance-37\/chrome-[a-zA-Z0-9-]+$/.test(producer.directory)||!['stopped_writer','closed_physical_reader'].includes(producer.captureRole))throw Error('EXPLICIT_PRODUCER_DIRECTORY_ROLE_REQUIRED')
 const observed=requireProducerTree(producer.cut),cutData={identity:observed.identity},cut=observed.cut,last=cut.explicitProducerStop??cut.last,files=observed.tree.files
 if(cut.directory!==producer.directory||!Array.isArray(files)||producer.captureRole==='stopped_writer'&&last?.type!=='producer-stop'||producer.captureRole==='closed_physical_reader'&&last?.type!=='reader-closed')throw Error('ACTUAL_COMPLETE_PRODUCER_STOP_OR_READER_CLOSE_REQUIRED:'+producer.directory)
 guard(producer.directory)
 const index=new Map()
 for(const file of files){if(index.has(file.path))throw Error('DUPLICATE_CUT_FILE_IDENTITY');requireIdentity(file);index.set(file.path,file);references.push(file)}
 const manifestPath=producer.directory+'/exports.jsonl',manifest=read(manifestPath)
 if(!identityEqual(index.get(manifestPath),manifest.identity))throw Error('EXACT_COMPLETE_MANIFEST_NOT_IN_CUT')
 references.push(cutData.identity);originalRows.push(manifest.identity)
 producerCuts.push({...cutData.identity,directory:producer.directory,captureRole:producer.captureRole})
 if(producer.captureRole==='stopped_writer'){
  if(!Number.isSafeInteger(last.newGameplayCommands)||last.newGameplayCommands<0)throw Error('EXACT_NATIVE_NEW_SAVE_CONTRIBUTION_REQUIRED')
  nativeEvidence.push({directory:producer.directory,newNativeSavedCommands:last.newGameplayCommands})
 }
 const journalPath=producer.directory+'/native-progress.jsonl'
 if(fs.existsSync(path.resolve(repo,journalPath))){const journal=read(journalPath);if(!identityEqual(index.get(journalPath),journal.identity))throw Error('STOPPED_OR_CLOSED_JOURNAL_NOT_IN_CUT');journals.push({identity:journal.identity,producerStopped:true,auditRole:producer.captureRole==='closed_physical_reader'?'original_closed_physical_reader_journal':'original_stopped_writer_journal'})}
 const lines=manifest.bytes.toString('utf8').split('\n').filter(Boolean)
 for(let i=0;i<lines.length;i++){
  const entry=JSON.parse(lines[i]),file=entry.file,key=path.basename(producer.directory)+':'+file
  if(typeof file!=='string'||path.basename(file)!==file||!/^[a-zA-Z0-9_.-]+\.json$/.test(file)||seenKeys.has(key)||typeof entry.origin!=='string'||typeof entry.source!=='string'||typeof entry.runId!=='string'||!Number.isSafeInteger(entry.revision)||producer.captureRole==='closed_physical_reader'&&entry.origin!=='physical_readonly')throw Error('EXACT_ORIGINAL_CAPTURE_LITERAL_REQUIRED')
  seenKeys.add(key)
  const role=spec.recordRoles.filter(r=>r.key===key)
  if(role.length!==1||typeof role[0].branchId!=='string'||!role[0].branchId.trim()||typeof role[0].auditRole!=='string'||!role[0].auditRole.trim()||!Number.isSafeInteger(role[0].newNativeSavedCommands)||role[0].newNativeSavedCommands<0||typeof role[0].notCountedAsNew!=='string')throw Error('EVERY_ORIGINAL_CAPTURE_NEEDS_EXPLICIT_ROLE_BRANCH_AND_NEWNESS')
  const chosen=role[0],raw=read(producer.directory+'/'+file)
  if(!identityEqual(index.get(raw.identity.path),raw.identity)||entry.bytes!==raw.identity.bytes||entry.sha256!==raw.identity.sha256)throw Error('RAW_CAPTURE_BYTES_NOT_EXACT_ORIGINAL_CUT')
  const recordedManifest={identity:manifest.identity,line:i+1,lineSha256:sha(lines[i])}
  const record={key,producerDirectory:producer.directory,identity:raw.identity,manifest:recordedManifest,origin:entry.origin,source:entry.source,sourceRole:chosen.sourceRole,auditRole:chosen.auditRole,branchId:chosen.branchId,runId:entry.runId,revision:entry.revision,snapshotFolder:path.basename(producer.directory),snapshotFile:file,captureRole:producer.captureRole,captureCut:cutData.identity,newNativeSavedCommands:chosen.newNativeSavedCommands,notCountedAsNew:chosen.notCountedAsNew}
  if(entry.origin==='native_saved_ui')record.sourceRoleMapping={from:'native_saved_ui',to:'saved_ui',rule:'exact_original_manifest_and_stopped_producer_cut',manifestPath,manifestLine:i+1,manifestLineSha256:recordedManifest.lineSha256,cut:cutData.identity,explanation:chosen.sourceRoleExplanation}
  sourceRoleFor(record)
  if(chosen.sourceClaimCorrection){const correction=requireIdentity(chosen.sourceClaimCorrection.identity),line=correction.bytes.toString('utf8').split('\n').filter(Boolean)[chosen.sourceClaimCorrection.line-1],event=line?JSON.parse(line):null;if(!line||sha(line)!==chosen.sourceClaimCorrection.lineSha256||event?.type!=='source-label-correction'||event.file!==file)throw Error('EXACT_ORIGINAL_SOURCE_LABEL_CORRECTION_REQUIRED');record.sourceClaimCorrection=chosen.sourceClaimCorrection;references.push(correction.identity)}
  if(file==='s09-saved98-stopped-service-one-day-full-support-fee.json'&&!record.sourceClaimCorrection)throw Error('KNOWN_ORIGINAL_COMPENSATION_SOURCE_CORRECTION_MUST_REMAIN_VISIBLE')
  records.push(record);originalRows.push(raw.identity)
 }
}
if(seenKeys.size!==roleKeys.length||roleKeys.some(key=>!seenKeys.has(key)))throw Error('NO_EXTRA_OR_OMITTED_FINAL_CAPTURE_ROLES')
for(const contribution of spec.nativeContributions){if(!Number.isSafeInteger(contribution.newNativeCreates)||contribution.newNativeCreates<0||!Number.isSafeInteger(contribution.newNativeSavedCommands)||contribution.newNativeSavedCommands<0||typeof contribution.evidence!=='string'||!contribution.evidence.trim())throw Error('ROOT_NATIVE_CONTRIBUTION_DISCLOSURE_REQUIRED')}
if(new Set(spec.nativeContributions.map(r=>r.directory)).size!==spec.nativeContributions.length||spec.nativeContributions.length!==spec.producers.length)throw Error('EVERY_PRODUCER_NATIVE_CONTRIBUTION_REQUIRED')
for(const producer of spec.producers){const contribution=spec.nativeContributions.find(c=>c.directory===producer.directory),actual=nativeEvidence.find(c=>c.directory===producer.directory);if(!contribution||contribution.newNativeSavedCommands!==(actual?.newNativeSavedCommands??0)||producer.captureRole==='closed_physical_reader'&&contribution.newNativeCreates!==0)throw Error('ROOT_NATIVE_SAVE_COUNTS_MUST_MATCH_STOPPED_PRODUCER')}
const totalCreates=spec.nativeContributions.reduce((n,c)=>n+c.newNativeCreates,0),totalSaves=spec.nativeContributions.reduce((n,c)=>n+c.newNativeSavedCommands,0)
if(spec.newNativeCreates!==totalCreates||spec.newNativeSavedCommands!==totalSaves)throw Error('ROOT_NATIVE_TOTALS_MUST_MATCH_EXPLICIT_PRODUCER_CONTRIBUTIONS')
for(const dependency of spec.derivedInputDependencies){if(records.some(r=>r.identity.path===dependency.identity.path))throw Error('DERIVED_PREFIX_NOT_A_NATIVE_CAPTURE');references.push(...requireDerivedPrefixProof(dependency))}
references.push(requireIdentity(spec.publicReadback).identity,...requirePublicReadbackWiring(spec.publicReadbackWiring,records,spec.finalProducerSet),...spec.referenceFiles.map(r=>requireIdentity(r).identity))
const inventory=receiptInventory(records),aliases=new Map()
for(const record of records){const key=record.identity.bytes+':'+record.identity.sha256;if(!aliases.has(key))aliases.set(key,[]);aliases.get(key).push(record)}
const byteEqualGroups=[...aliases.values()].filter(group=>group.length>1).map(group=>{const first=requireIdentity(group[0].identity).bytes;if(group.some(row=>!requireIdentity(row.identity).bytes.equals(first)))throw Error('ALIAS_BYTES_DIFFER_DESPITE_HASH');return group.map(r=>r.key)})
const here=path.dirname(fileURLToPath(import.meta.url));references.push(read(path.relative(repo,fileURLToPath(import.meta.url)).split(path.sep).join('/')).identity);for(const n of ['audit-io.mjs','freeze-final-cut.mjs','run-once-candidate.mjs'])references.push(read(path.relative(repo,path.join(here,n)).split(path.sep).join('/')).identity)
requireMutableFinalReferences(references,spec.mutableFinalReferences)
const registry={state:'frozen',frozenBy:'/root',scope:'U4-B-only',outputDirectory:spec.auditDirectory,formalPlan:spec.formalPlan,formalTasks:spec.formalTasks,officialSources:official,runtimeDependencies:runtime,finalProducerSet:spec.finalProducerSet,mutableFinalReferences:spec.mutableFinalReferences??[],expectedOfficialSourceCount:official.length,expectedDependencyFiles:runtime.length,records,producerCuts,journals,referenceFiles:[...new Map(references.map(r=>[r.path,r])).values()],derivedInputDependencies:spec.derivedInputDependencies,publicReadback:spec.publicReadback,publicReadbackWiring:spec.publicReadbackWiring,expectedReplay:{creationHistories:inventory.creationHistories,uniqueHistoricalCommands:inventory.uniquePostCreatePrefixes,artifactRows:inventory.artifactRows,literalImportBufferRows:records.filter(r=>r.origin==='import_buffer').length},newNativeCreates:totalCreates,newNativeSavedCommands:totalSaves,byteEqualGroups,distinctBranchPairs:spec.distinctBranchPairs??[],sourceRoleCounts:Object.fromEntries([...new Set(records.map(r=>r.sourceRole))].map(role=>[role,records.filter(r=>r.sourceRole===role).length])),literalOriginCounts:Object.fromEntries([...new Set(records.map(r=>r.origin))].map(origin=>[origin,records.filter(r=>r.origin===origin).length])),nativeContributions:spec.nativeContributions,policy:'Original origin/source strings and verifier are unchanged. Old literal inputBuffers counts import_buffer only; role ledger separately preserves current_buffer/candidate/physical/backup/reentry. This filesystem registry is not formal replay, does not create a GO and never reclassifies a derived dependency as Native.'}
if(sourceDiff(official,sources()).length||sourceDiff(runtime,dependencies()).length)throw Error('SOURCE_OR_RUNTIME_CHANGED_DURING_REGISTRY_METADATA_BUILD')
for(const identity of [...references,...originalRows])requireIdentity(identity)
for(const producer of spec.producers)requireProducerTree(producer.cut)
guard(path.dirname(output));fs.writeFileSync(output,JSON.stringify(registry,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({registry:read(freshRegistryOutput).identity,formalFreezeExecuted:false,formalReplayExecuted:false,publicReadbackExecuted:false,rootGoCreated:false}))
