import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {read,sha,sources,dependencies,guard,repo,identityEqual,requireIdentity,sourceDiff,outputRoot,put,mkdir,json,receiptInventory,sourceRoleFor,requirePublicReadbackWiring} from './audit-io.mjs'

// Future-only freeze candidate. Running this file is not authorized by preparation.
if(process.argv.length!==6||process.argv[2]!=='--registry'||process.argv[4]!=='--output-dir')throw Error('EXPLICIT_ROOT_FROZEN_REGISTRY_AND_FRESH_OUTPUT_REQUIRED')
const registryPath=process.argv[3],directory=process.argv[5],registry=json(registryPath),output=outputRoot(directory)
if(registry.state!=='frozen'||registry.frozenBy!=='/root'||registry.scope!=='U4-B-only'||registry.outputDirectory!==directory)throw Error('ROOT_FINAL_FROZEN_CUT_REQUIRED')
if(!Array.isArray(registry.records)||!registry.records.length||!Array.isArray(registry.referenceFiles)||!Array.isArray(registry.producerCuts)||!registry.publicReadback||!registry.expectedReplay)throw Error('COMPLETE_FINAL_RECORDS_ROLE_BRANCH_AND_READBACK_CONTRACT_REQUIRED')
if(typeof registry.formalPlan!=='string'||!registry.formalPlan.trim()||typeof registry.formalTasks!=='string'||!registry.formalTasks.trim()||!Number.isSafeInteger(registry.newNativeCreates)||registry.newNativeCreates<0||!Number.isSafeInteger(registry.newNativeSavedCommands)||registry.newNativeSavedCommands<0)throw Error('EXPLICIT_FORMAL_PLAN_TASKS_AND_NATIVE_ROLE_TOTALS_REQUIRED')
if(fs.existsSync(output))throw Error('FORMAL_ROOT_MUST_NOT_EXIST')
const official=sources(),runtimeDependencies=dependencies(),baseline=json('goal-1/evidence/t17-acceptance-37/baseline.json')
if(sourceDiff(official,registry.officialSources??[]).length||official.length!==registry.expectedOfficialSourceCount)throw Error('FINAL_OFFICIAL_SOURCE_CUT_CHANGED')
if(runtimeDependencies.length!==registry.expectedDependencyFiles)throw Error('FINAL_DEPENDENCY_COUNT_CHANGED')
const p3=baseline.p3.map(r=>{const expected={path:r.path,bytes:r.bytes,sha256:r.sha256,mode:r.mode};requireIdentity(expected);return expected})
if(p3.length!==26)throw Error('ORIGINAL_P326_REQUIRED')
const referenceRows=[read(registryPath).identity,requireIdentity(registry.publicReadback).identity,...registry.referenceFiles.map(r=>requireIdentity(r).identity),...registry.producerCuts.map(r=>requireIdentity(r).identity)]
const cutFiles=new Map()
for(const row of registry.producerCuts){const cut=JSON.parse(requireIdentity(row).bytes.toString('utf8')),stop=cut.explicitProducerStop??cut.last,files=cut.tree?.files??cut.files?.files
 const closedReader=row.captureRole==='closed_physical_reader'&&stop?.type==='reader-closed'
 if((stop?.type!=='producer-stop'&&!closedReader)||!Array.isArray(files))throw Error('EXPLICIT_COMPLETED_PRODUCER_OR_CLOSED_READER_CUT_REQUIRED:'+row.path)
 for(const file of files){requireIdentity(file);cutFiles.set(file.path,file);referenceRows.push(file)}
}
const readbackReferences=requirePublicReadbackWiring(registry.publicReadbackWiring,registry.records)
referenceRows.push(...readbackReferences)
const recordKeys=new Set(),destinationKeys=new Set(),originalInputRows=[],manifestCache=new Map(),journalRoles=[]
for(const record of registry.records){
 if(typeof record.key!=='string'||recordKeys.has(record.key)||typeof record.branchId!=='string'||typeof record.auditRole!=='string'||typeof record.source!=='string'||!record.source.trim()||!/^chrome-[a-zA-Z0-9-]+$/.test(record.snapshotFolder)||!/^[a-zA-Z0-9_.-]+\.json$/.test(record.snapshotFile))throw Error('EXPLICIT_UNIQUE_RECORD_ROLE_BRANCH_REQUIRED')
 sourceRoleFor(record);recordKeys.add(record.key);const destination=record.snapshotFolder+'/'+record.snapshotFile;if(destinationKeys.has(destination))throw Error('DUPLICATE_SNAPSHOT_DESTINATION');destinationKeys.add(destination)
 requireIdentity(record.identity);originalInputRows.push(record.identity)
 if(record.origin!=='historical_source_reference'&&!identityEqual(cutFiles.get(record.identity.path),record.identity))throw Error('CAPTURE_NOT_IN_EXACT_STOPPED_PRODUCER_CUT:'+record.key)
 if(record.manifest){const manifest=requireIdentity(record.manifest.identity);if(!manifestCache.has(record.manifest.identity.path))manifestCache.set(record.manifest.identity.path,manifest);const lines=manifest.bytes.toString('utf8').split('\n').filter(Boolean),line=lines[record.manifest.line-1],row=line?JSON.parse(line):null
  if(!row||sha(line)!==record.manifest.lineSha256||row.file!==path.basename(record.identity.path)||row.origin!==record.origin||row.source!==record.source||row.bytes!==record.identity.bytes||row.sha256!==record.identity.sha256||row.runId!==record.runId||row.revision!==record.revision)throw Error('EXACT_ORIGINAL_MANIFEST_LINE_REQUIRED:'+record.key)
 }else if(record.origin!=='historical_source_reference')throw Error('CAPTURE_WITH_ORIGINAL_MANIFEST_REQUIRED')
}
const derivedDependencies=[]
for(const dependency of registry.derivedInputDependencies??[]){
 if(dependency.role!=='derived_normal_prefix_input_only'||dependency.newNativeCreates!==0||dependency.newNativeSavedCommands!==0||registry.records.some(r=>r.identity.path===dependency.identity.path))throw Error('DERIVED_PREFIX_IS_INPUT_DEPENDENCY_NOT_NATIVE_CAPTURE')
 const raw=requireIdentity(dependency.identity),provenance=JSON.parse(requireIdentity(dependency.provenance).bytes.toString('utf8')),result=JSON.parse(requireIdentity(dependency.result).bytes.toString('utf8'))
 if(provenance.role!=='derived_normal_prefix'||provenance.fullEndpointByteEqual!==true||provenance.newNativeCreates!==0||provenance.newNativeCommands!==0||provenance.persistentHeadWrites!==0||result.passed!==true||result.full118ByteEqual!==true||result.prefixPublished!==true||result.newNativeCreates!==0||result.newNativeCommands!==0||result.persistentHeadWrites!==0||!identityEqual(result.prefix,raw.identity)||provenance.selectedPrefix?.bytes!==raw.identity.bytes||provenance.selectedPrefix?.sha256!==raw.identity.sha256)throw Error('PASSED_ORIGINAL_COMPLETE_PREFIX_PROVENANCE_REQUIRED')
 originalInputRows.push(raw.identity);referenceRows.push(dependency.provenance,dependency.result,provenance.source,provenance.originalManifest.identity,provenance.originalSeal);derivedDependencies.push(dependency)
}
for(const value of manifestCache.values())originalInputRows.push(value.identity)
for(const journal of registry.journals??[]){const original=requireIdentity(journal.identity);if(journal.producerStopped!==true||typeof journal.auditRole!=='string')throw Error('STOPPED_JOURNAL_ROLE_REQUIRED');originalInputRows.push(original.identity);journalRoles.push(journal)}
const inventory=receiptInventory(registry.records),expected=registry.expectedReplay
if(expected.creationHistories!==inventory.creationHistories||expected.uniqueHistoricalCommands!==inventory.uniquePostCreatePrefixes||expected.artifactRows!==inventory.artifactRows||expected.literalImportBufferRows!==registry.records.filter(r=>r.origin==='import_buffer').length)throw Error('ROOT_EXPECTATION_MUST_MATCH_SAVED_METADATA_INVENTORY')
for(const group of registry.byteEqualGroups??[]){const rows=group.map(key=>registry.records.find(r=>r.key===key));if(rows.some(r=>!r)||rows.some(r=>r.identity.bytes!==rows[0].identity.bytes||r.identity.sha256!==rows[0].identity.sha256))throw Error('DECLARED_ALIAS_GROUP_NOT_BYTE_EQUAL')}
for(const group of registry.distinctBranchPairs??[]){const a=registry.records.find(r=>r.key===group[0]),b=registry.records.find(r=>r.key===group[1]);if(!a||!b||a.branchId===b.branchId||a.identity.sha256===b.identity.sha256)throw Error('DIFFERENT_BRANCHES_NOT_EXPLICIT')}
guard(path.dirname(output));fs.mkdirSync(output);guard(output)
put(output,'input.md',read('goal-1/evidence/t17-acceptance-37/input.md').bytes)
put(output,'plan.md',registry.formalPlan);put(output,'tasks.md',registry.formalTasks);put(output,'root-registry.snapshot.json',read(registryPath).bytes)
mkdir(output,'input');const snapshots=[],groups=new Map()
for(const record of registry.records){if(!groups.has(record.snapshotFolder))groups.set(record.snapshotFolder,[]);groups.get(record.snapshotFolder).push(record)}
for(const [folder,records]of groups){mkdir(output,'input/'+folder);const lines=[];for(const record of records){const raw=requireIdentity(record.identity);put(output,'input/'+folder+'/'+record.snapshotFile,raw.bytes);snapshots.push(read(directory+'/input/'+folder+'/'+record.snapshotFile).identity);lines.push(JSON.stringify({file:record.snapshotFile,origin:record.origin,source:record.source,bytes:record.identity.bytes,sha256:record.identity.sha256,runId:record.runId,revision:record.revision}))}put(output,'input/'+folder+'/exports.jsonl',lines.join('\n')+'\n');snapshots.push(read(directory+'/input/'+folder+'/exports.jsonl').identity)}
for(let i=0;i<journalRoles.length;i++){put(output,'journal-'+String(i+1).padStart(2,'0')+'.snapshot.jsonl',requireIdentity(journalRoles[i].identity).bytes);snapshots.push(read(directory+'/journal-'+String(i+1).padStart(2,'0')+'.snapshot.jsonl').identity)}
put(output,'role-ledger.json',{records:registry.records.map(r=>({key:r.key,origin:r.origin,sourceRole:sourceRoleFor(r),sourceRoleMapping:r.sourceRoleMapping??null,auditRole:r.auditRole,captureRole:r.captureRole??null,sourceClaimCorrection:r.sourceClaimCorrection??null,branchId:r.branchId,runId:r.runId,revision:r.revision,identity:r.identity,newNativeSavedCommands:r.newNativeSavedCommands??null,notCountedAsNew:r.notCountedAsNew??null})),byteEqualGroups:registry.byteEqualGroups??[],distinctBranchPairs:registry.distinctBranchPairs??[],newNativeCreates:registry.newNativeCreates,newNativeSavedCommands:registry.newNativeSavedCommands,limit:'New-command totals are Root-declared Native scope, checked later against independent public readback; metadata-prefix counts are historical replay work, not new gameplay.'})
put(output,'receipt-metadata-inventory.json',inventory)
put(output,'derived-input-dependencies.json',{dependencies:derivedDependencies,notReplayCaptureRows:true,newNativeCreates:0,newNativeSavedCommands:0})
const here=path.dirname(fileURLToPath(import.meta.url)),helperNames=['audit-io.mjs','freeze-final-cut.mjs','run-once-candidate.mjs'].map(n=>path.relative(repo,path.join(here,n)).split(path.sep).join('/'))
const references=[...referenceRows,...helperNames.map(n=>read(n).identity),read('goal-1/evidence/t17-acceptance-36/normal-continuity-audit-r1/io.mjs').identity,read('scripts/browser_evidence_guard.mjs').identity,...['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.core.json','vite.config.ts'].filter(n=>fs.existsSync(path.join(repo,n))).map(n=>read(n).identity)]
const originalInputs=[...new Map(originalInputRows.map(r=>[r.path,r])).values()]
if(sourceDiff(official,sources()).length||sourceDiff(runtimeDependencies,dependencies()).length)throw Error('SOURCE_OR_RUNTIME_CHANGED_DURING_FINAL_FREEZE')
for(const row of [...p3,...references,...originalInputs,...snapshots])requireIdentity(row)
put(output,'frozen-contract.json',{at:new Date().toISOString(),directory,rootRegistry:read(registryPath).identity,officialSources:official,dependencies:runtimeDependencies,p3,references,originalInputs,snapshots,expectedReplay:expected,publicReadback:registry.publicReadback,publicReadbackWiring:registry.publicReadbackWiring,derivedInputDependencies:derivedDependencies,records:registry.records,journals:journalRoles,scriptPolicy:'Original verifier is unchanged and uses dynamic sourceHashes. Canonical Create command executes only after Root separate GO and independent review. Readback is a separately registered reviewed script.',sourceCount:official.length,newNativeCreates:registry.newNativeCreates,newNativeSavedCommands:registry.newNativeSavedCommands,preparationDoesNotAuthorizeExecution:true})
console.log(JSON.stringify({preparedFinalCut:true,directory,officialSources:official.length,p3:p3.length,dependencies:runtimeDependencies.length,inventory:{creationHistories:inventory.creationHistories,uniquePostCreatePrefixes:inventory.uniquePostCreatePrefixes,artifactRows:inventory.artifactRows},formalExecutionStarted:false}))
