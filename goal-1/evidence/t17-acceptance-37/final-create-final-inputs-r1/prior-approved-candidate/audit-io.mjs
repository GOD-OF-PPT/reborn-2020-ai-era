import fs from 'node:fs'
import path from 'node:path'
import {read,sha,sources,dependencies,guard,repo} from '../../t17-acceptance-36/normal-continuity-audit-r1/io.mjs'
export {read,sha,sources,dependencies,guard,repo}
export const identityEqual=(a,b)=>a?.path===b?.path&&a?.bytes===b?.bytes&&a?.sha256===b?.sha256&&a?.mode===b?.mode
export function requireIdentity(row){const data=read(row.path);if(!identityEqual(row,data.identity))throw Error('REGISTERED_FILE_CHANGED:'+row.path);return data}
export function outputRoot(relative){const result=path.resolve(repo,relative);if(!/^goal-1\/evidence\/t17-acceptance-37\/full-create-audit-r[1-9][0-9]*$/.test(relative)||!result.startsWith(repo+path.sep))throw Error('FRESH_SIBLING_FORMAL_ROOT_REQUIRED');guard(path.dirname(result));return result}
export function put(output,name,value){const destination=path.resolve(output,name);if(!destination.startsWith(output+path.sep))throw Error('OWNED_FORMAL_OUTPUT_REQUIRED');guard(path.dirname(destination));fs.writeFileSync(destination,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
export function mkdir(output,name){const destination=path.resolve(output,name);if(!destination.startsWith(output+path.sep))throw Error('OWNED_FORMAL_SUBDIRECTORY_REQUIRED');guard(path.dirname(destination));if(fs.existsSync(destination))throw Error('FRESH_SUBDIRECTORY_REQUIRED:'+name);fs.mkdirSync(destination);guard(destination)}
export const json=name=>JSON.parse(read(name).bytes.toString('utf8'))
export function sourceDiff(a,b){const first=new Map(a.map(r=>[r.path,r])),last=new Map(b.map(r=>[r.path,r]));return [...new Set([...first.keys(),...last.keys()])].filter(name=>!identityEqual(first.get(name),last.get(name)))}

/** Saved receipt metadata only; this does not import a codec, inspect hidden state or run commands. */
export function receiptInventory(records){
 const roots=new Set(),prefixes=new Set(),details=[]
 for(const record of records){const bytes=requireIdentity(record.identity).bytes,envelope=JSON.parse(bytes.toString('utf8')),state=envelope.state,receipts=state?.receipts
  if(!Array.isArray(receipts)||receipts[0]?.kind!=='CreateRun'||state.origin!=='normal'||envelope.runId!==record.runId||envelope.revision!==record.revision)throw Error('ORIGINAL_NORMAL_RECEIPT_METADATA_REQUIRED:'+record.key)
  const root=JSON.stringify([envelope.runId,receipts[0].commandId,receipts[0].payloadSignature,envelope.schemaVersion,envelope.rulesVersion,envelope.contentHash]);roots.add(root);let prefix=root
  const metadata=receipts.map(row=>{if(typeof row.kind!=='string'||typeof row.commandId!=='string'||typeof row.payloadSignature!=='string'||!Number.isSafeInteger(row.revisionBefore)||!Number.isSafeInteger(row.revisionAfter))throw Error('INVALID_SAVED_RECEIPT_METADATA');return {kind:row.kind,commandId:row.commandId,revisionBefore:row.revisionBefore,revisionAfter:row.revisionAfter,payloadSignatureSha256:sha(row.payloadSignature)}})
  for(const row of metadata.slice(1)){prefix+='\0'+JSON.stringify(row);prefixes.add(sha(prefix))}
  details.push({key:record.key,branchId:record.branchId,auditRole:record.auditRole,runId:record.runId,revision:record.revision,receiptMetadata:metadata,bytes:record.identity.bytes,sha256:record.identity.sha256})
 }
 return {creationHistories:roots.size,uniquePostCreatePrefixes:prefixes.size,artifactRows:records.length,details,method:'Pure saved receipt ID/kind/revision/signature hash inventory. No codec/projection/command/future/RNG execution or future state access.'}
}
export function bindings(contract){return {officialSources:sources(),dependencies:dependencies(),p3:contract.p3.map(r=>read(r.path).identity),references:contract.references.map(r=>read(r.path).identity),inputs:contract.originalInputs.map(r=>read(r.path).identity),snapshots:contract.snapshots.map(r=>read(r.path).identity)}}
export function bindingDiff(before,after){return Object.fromEntries(Object.keys(before).map(key=>[key,sourceDiff(before[key],after[key])]))}

// Future-only metadata/readback protocol adapters. No financial algorithm or product import.
export function sourceRoleFor(record){
 const expected=record.origin==='native_saved_ui'?'saved_ui':record.origin
 if(record.sourceRole!==expected)throw Error('EXPLICIT_SOURCE_ROLE_REQUIRED:'+record.key)
 if(record.origin==='native_saved_ui'){
  const m=record.sourceRoleMapping
  if(!record.manifest||m?.from!=='native_saved_ui'||m.to!=='saved_ui'||m.rule!=='exact_original_manifest_and_stopped_producer_cut'||m.manifestPath!==record.manifest.identity.path||m.manifestLine!==record.manifest.line||m.manifestLineSha256!==record.manifest.lineSha256||typeof m.explanation!=='string'||!m.explanation.trim())throw Error('EVIDENCED_NATIVE_SAVED_UI_ROLE_MAPPING_REQUIRED:'+record.key)
 }
 return expected
}
export function requirePublicReadbackWiring(wiring,records,producerPolicy){
 if(wiring?.apiVersion!=='u4b-public-readback-v1'||!Array.isArray(wiring.requirements)||!wiring.requirements.length)throw Error('FIXED_PUBLIC_READBACK_WIRING_REQUIRED')
 const ids=new Set(),known=new Set(records.map(r=>r.key)),references=[]
 for(const r of wiring.requirements){
  if(typeof r.scope!=='string'||ids.has(r.scope)||!['inherited_result','fresh_readback'].includes(r.mode)||!Array.isArray(r.recordKeys)||!r.recordKeys.length||new Set(r.recordKeys).size!==r.recordKeys.length||r.recordKeys.some(k=>!known.has(k))||!Number.isSafeInteger(r.expectedChecks)||r.expectedChecks<1)throw Error('EXACT_READBACK_SCOPE_RECORD_KEYS_AND_CHECK_COUNT_REQUIRED')
  ids.add(r.scope)
  if(r.mode==='inherited_result'){
   const fixedChecks=r.scope==='positive_service'?35:r.scope==='negative_stop_and_atomic'?31:null
   if(fixedChecks===null||r.expectedChecks!==fixedChecks)throw Error('ONLY_EXACT_POSITIVE35_OR_NEGATIVE_STOP31_MAY_BE_INHERITED')
   for(const key of ['result','facts','manifest','frozenInputs','script','terminal'])references.push(requireIdentity(r.inheritance?.[key]).identity)
   const result=json(r.inheritance.result.path)
   if(result.passed!==true||result.exitCode!==0||result.checks!==fixedChecks||result.passedChecks!==fixedChecks||result.failedChecks?.length!==0||result.error!==null)throw Error('PASSED_FIXED_JSON_READBACK_ARTIFACT_REQUIRED')
   const manifest=json(r.inheritance.manifest.path),frozen=json(r.inheritance.frozenInputs.path)
   if(!Array.isArray(manifest.records)||!Array.isArray(frozen.inputs)||manifest.records.length!==result.rawRows)throw Error('EXACT_INHERITED_CAPTURE_MANIFEST_REQUIRED')
   for(const input of frozen.inputs)references.push(requireIdentity(input).identity)
   const expectedKeys=[]
   for(const record of manifest.records){
    requireIdentity(record.identity);if(!frozen.inputs.some(input=>identityEqual(input,record.identity)))throw Error('INHERITED_RAW_NOT_IN_FROZEN_INPUTS')
    const actual=records.filter(row=>identityEqual(row.identity,record.identity)&&identityEqual(row.manifest?.identity,record.manifest?.identity)&&row.manifest?.line===(record.manifest?.line??record.manifest?.line1)&&row.manifest?.lineSha256===record.manifest?.lineSha256&&row.origin===record.origin&&row.source===record.source&&row.runId===record.runId&&row.revision===record.revision)
    if(actual.length!==1)throw Error('INHERITED_EXACT_ORIGINAL_CAPTURE_NOT_UNIQUE')
    expectedKeys.push(actual[0].key)
   }
   requireStringSet(r.recordKeys,expectedKeys,'INHERITED_SCOPE_MUST_EQUAL_EXACT_ORIGINAL_CAPTURE_KEYS')
   references.push(...manifest.records.map(record=>record.identity))
  }
 }
 for(const scope of ['positive_service','negative_stop_and_atomic'])if(!ids.has(scope))throw Error('REQUIRED_BRANCH_READBACK_MISSING:'+scope)
 requireFreshProducerScopes(producerPolicy,records,wiring)
 for(const r of wiring.requirements)if(!['positive_service','negative_stop_and_atomic'].includes(r.scope)&&r.mode!=='fresh_readback')throw Error('EXISTING_JSON_READBACK_CANNOT_COVER_CURRENT_R7_FACTS')
 return references
}
export function validatePublicReadbackResult(report,contract,contractIdentity){
 requirePublicReadbackWiring(contract.publicReadbackWiring,contract.records,contract.finalProducerSet)
 if(report?.passed!==true||report.auditDirectory!==contract.directory||!identityEqual(report.contract,contractIdentity)||!Array.isArray(report.coverage)||report.coverage.length!==contract.publicReadbackWiring.requirements.length)throw Error('EXACT_CONTRACT_PUBLIC_READBACK_RESULT_REQUIRED')
 const canonicalKeys=a=>JSON.stringify([...a].sort())
 for(const required of contract.publicReadbackWiring.requirements){
  const matches=report.coverage.filter(r=>r.scope===required.scope),row=matches.length===1?matches[0]:null
  if(!row||row.mode!==required.mode||row.passed!==true||!Array.isArray(row.recordKeys)||canonicalKeys(row.recordKeys)!==canonicalKeys(required.recordKeys)||row.checks!==required.expectedChecks||row.passedChecks!==row.checks||row.failedChecks!==0)throw Error('PUBLIC_READBACK_SCOPE_RESULT_MISMATCH:'+required.scope)
  if(required.mode==='fresh_readback')requireStringSet(row.producerDirectories,required.producerDirectories,'FRESH_RESULT_PRODUCER_SET_CHANGED')
  if(required.mode==='inherited_result'&&(!identityEqual(row.reusedResult,required.inheritance.result)||!identityEqual(row.reusedFacts,required.inheritance.facts)))throw Error('EXACT_INHERITED_READBACK_IDENTITIES_REQUIRED')
 }
 return true
}

// Filesystem/metadata guards shared by builder, freeze and final result checks.
export function requireStringSet(actual,expected,label){
 if(!Array.isArray(actual)||!Array.isArray(expected)||actual.some(x=>typeof x!=='string')||expected.some(x=>typeof x!=='string')||new Set(actual).size!==actual.length||new Set(expected).size!==expected.length||actual.length!==expected.length||actual.some(x=>!expected.includes(x)))throw Error(label)
}
export function requireIdentitySet(actual,expected,label){
 if(!Array.isArray(actual)||!Array.isArray(expected)||new Set(actual.map(r=>r.path)).size!==actual.length||new Set(expected.map(r=>r.path)).size!==expected.length||actual.length!==expected.length||sourceDiff(actual,expected).length)throw Error(label)
}
export function requireFinalProducerSet(policy,producers){
 const base=['chrome-main-r1','chrome-main-r2','chrome-main-r3','chrome-main-r4','chrome-main-r5','chrome-main-r6','chrome-negative-atomic-r6','chrome-negative-physical-r6','chrome-service-stop-r6','chrome-support-interrupt-r6'].map(n=>'goal-1/evidence/t17-acceptance-37/'+n)
 const requiredFresh=['chrome-main-r7','chrome-main-r8'].map(n=>'goal-1/evidence/t17-acceptance-37/'+n)
 if(policy?.declaredCompleteBy!=='/root'||policy.finalInventoryComplete!==true)throw Error('ROOT_FINAL_ALL_PRODUCERS_DECLARATION_REQUIRED')
 requireStringSet(policy.completeDirectories,producers.map(p=>p.directory),'FINAL_PRODUCER_LIST_MUST_EQUAL_ALL_SPEC_PRODUCERS')
 if([...base,...requiredFresh].some(d=>!policy.completeDirectories.includes(d))||!Array.isArray(policy.freshDirectories)||new Set(policy.freshDirectories).size!==policy.freshDirectories.length||requiredFresh.some(d=>!policy.freshDirectories.includes(d))||policy.freshDirectories.some(d=>!policy.completeDirectories.includes(d))||policy.completeDirectories.some(d=>!base.includes(d)&&!policy.freshDirectories.includes(d)))throw Error('R7_R8_AND_ALL_LATER_PRODUCERS_MUST_HAVE_FRESH_FACTS')
}
export function requireFreshProducerScopes(policy,records,wiring){
 if(!policy||!Array.isArray(policy.freshDirectories)||!Array.isArray(policy.completeDirectories))throw Error('FINAL_PRODUCER_COVERAGE_POLICY_REQUIRED')
 const assigned=[]
 for(const row of records){const directory=path.posix.dirname(row.identity.path);if(row.producerDirectory!==directory||!policy.completeDirectories.includes(directory))throw Error('CAPTURE_ORIGINAL_PRODUCER_DIRECTORY_REQUIRED')}
 for(const scope of wiring.requirements.filter(r=>r.mode==='fresh_readback')){
  if(!Array.isArray(scope.producerDirectories)||!scope.producerDirectories.length||new Set(scope.producerDirectories).size!==scope.producerDirectories.length||scope.producerDirectories.some(d=>!policy.freshDirectories.includes(d)))throw Error('FRESH_SCOPE_EXPLICIT_NEW_PRODUCERS_REQUIRED')
  const expected=records.filter(r=>scope.producerDirectories.includes(r.producerDirectory)).map(r=>r.key)
  if(!expected.length)throw Error('FRESH_PRODUCER_MUST_HAVE_ACTUAL_CAPTURE_ROWS')
  requireStringSet(scope.recordKeys,expected,'FRESH_SCOPE_MUST_EQUAL_PRODUCER_COMPLETE_CAPTURE_KEYS')
  assigned.push(...scope.producerDirectories)
 }
 requireStringSet(assigned,policy.freshDirectories,'EVERY_FRESH_PRODUCER_MUST_BE_COVERED_EXACTLY_ONCE')
}
export function requireProducerTree(cutIdentity){
 const data=requireIdentity(cutIdentity),cut=JSON.parse(data.bytes.toString('utf8')),tree=cut.tree??cut.files,base=cut.directory
 if(typeof base!=='string'||!/^goal-1\/evidence\/t17-acceptance-37\/chrome-[a-zA-Z0-9-]+$/.test(base)||!Array.isArray(tree?.files)||!Array.isArray(tree.directories)||!Array.isArray(tree.directoryModes))throw Error('COMPLETE_PRODUCER_TREE_WITH_DIRECTORY_MODES_REQUIRED')
 const actual={files:[],directories:[],directoryModes:[]}
 const visit=relative=>{const absolute=path.resolve(repo,relative),stat=fs.lstatSync(absolute);if(stat.isSymbolicLink())throw Error('PRODUCER_TREE_SYMLINK_FORBIDDEN:'+relative);if(stat.isDirectory()){actual.directories.push(relative);actual.directoryModes.push({path:relative,mode:stat.mode&0o777});for(const name of fs.readdirSync(absolute).sort())visit(relative+'/'+name)}else if(stat.isFile())actual.files.push(read(relative).identity);else throw Error('PRODUCER_TREE_SPECIAL_FILE_FORBIDDEN:'+relative)}
 visit(base)
 requireIdentitySet(actual.files,tree.files,'PRODUCER_TREE_FILE_SET_BYTES_OR_MODE_CHANGED')
 requireStringSet(actual.directories,tree.directories,'PRODUCER_TREE_DIRECTORY_SET_CHANGED')
 requireStringSet(tree.directoryModes.map(r=>r.path),tree.directories,'PRODUCER_CUT_DIRECTORY_MODE_SET_INCOMPLETE')
 if(!tree.directories.includes(base)||actual.directoryModes.some(r=>tree.directoryModes.find(x=>x.path===r.path)?.mode!==r.mode))throw Error('PRODUCER_TREE_DIRECTORY_MODE_CHANGED')
 return {cut,identity:data.identity,tree:actual}
}
export function requireMutableFinalReferences(references,declared){
 const target='goal-1/evidence/t17-acceptance-37/tasks.md',rows=references.filter(r=>r.path===target),policies=declared??[]
 if(rows.length&&policies.filter(p=>p.role==='final_snapshot_until_runner_terminal'&&identityEqual(p.identity,rows[0])).length!==1)throw Error('CURRENT_TASKS_REQUIRES_EXPLICIT_MUTABLE_FINAL_SNAPSHOT')
 for(const p of policies){if(p.role!=='final_snapshot_until_runner_terminal'||!references.some(r=>identityEqual(r,p.identity)))throw Error('MUTABLE_FINAL_REFERENCE_POLICY_MISMATCH');requireIdentity(p.identity)}
}
export function requireDerivedPrefixProof(d){
 if(d.role!=='derived_normal_prefix_input_only'||d.newNativeCreates!==0||d.newNativeSavedCommands!==0)throw Error('DERIVED_INPUT_ONLY_ROLE_REQUIRED')
 const before=requireIdentity(d.sourceBefore),after=requireIdentity(d.sourceAfter),contractData=requireIdentity(d.executionContract),terminal=json(requireIdentity(d.terminal).identity.path),raw=requireIdentity(d.identity),result=json(requireIdentity(d.result).identity.path),provenance=json(requireIdentity(d.provenance).identity.path)
 const prefixRoot='goal-1/evidence/t17-acceptance-37/audit-input-prefix-run-r1/',proofSHA='9c3955b277b025c76d7c8db3d675b2af12aa6d7eab97508adc42c6480773e7bc'
 if(before.identity.path!==prefixRoot+'source-before.json'||after.identity.path!==prefixRoot+'source-after.json'||before.identity.bytes!==270321||after.identity.bytes!==270321||before.identity.sha256!==proofSHA||after.identity.sha256!==proofSHA||!before.bytes.equals(after.bytes))throw Error('EXACT_HISTORICAL_DERIVATION_WINDOW_PROOFS_REQUIRED')
 const first=JSON.parse(before.bytes.toString('utf8')),last=JSON.parse(after.bytes.toString('utf8')),historical=JSON.parse(contractData.bytes.toString('utf8'))
 for(const key of ['officialSources','dependencies','p3','references','authority'])requireIdentitySet(first[key],last[key],'HISTORICAL_DERIVATION_WINDOW_CHANGED:'+key)
 if(first.officialSources.length!==127||first.dependencies.length!==901||first.p3.length!==26||first.references.length!==37||first.authority.length!==3||!first.authority.some(r=>identityEqual(r,contractData.identity)))throw Error('ORIGINAL_127_901_P326_REFERENCE_AUTHORITY_WINDOW_REQUIRED')
 for(const key of ['officialSources','dependencies','p3','references'])requireIdentitySet(first[key],historical[key],'HISTORICAL_CONTRACT_WINDOW_MISMATCH:'+key)
 const oldTasks=first.references.find(r=>r.path==='goal-1/evidence/t17-acceptance-37/tasks.md')
 if(oldTasks?.bytes!==5618||oldTasks.sha256!=='6a6df5f55f853bbee631db0ade7479905443b321c405e1771715f6126bb31bd6')throw Error('HISTORICAL_TASKS_IDENTITY_MUST_STAY_HISTORICAL')
 if(result.passed!==true||result.error!==null||result.full118ByteEqual!==true||result.prefixPublished!==true||result.actualHistoricalCreateAttempts!==1||result.actualHistoricalCreateCompletions!==1||result.attemptedHistoricalPostCreateCommands!==117||result.successfulHistoricalPostCreateCommands!==117||result.proposedHistoricalCommands!==117||result.newNativeCreates!==0||result.newNativeCommands!==0||result.persistentHeadWrites!==0||terminal.exitCode!==0||terminal.passed!==true||!result.differences||['officialSources','dependencies','p3','references','authority'].some(k=>!Array.isArray(result.differences[k])||result.differences[k].length!==0)||!identityEqual(result.prefix,raw.identity))throw Error('ORIGINAL_DERIVATION_SUCCESS_COUNTS_AND_EMPTY_DIFFERENCES_REQUIRED')
 if(provenance.role!=='derived_normal_prefix'||provenance.fullEndpointByteEqual!==true||provenance.newNativeCreates!==0||provenance.newNativeCommands!==0||provenance.persistentHeadWrites!==0||provenance.selectedPrefix?.bytes!==raw.identity.bytes||provenance.selectedPrefix?.sha256!==raw.identity.sha256||!identityEqual(provenance.source,historical.original)||!identityEqual(provenance.originalManifest?.identity,historical.originalManifest?.identity)||!identityEqual(provenance.originalSeal,historical.originalSeal))throw Error('ORIGINAL_DERIVED_PREFIX_PROVENANCE_REQUIRED')
 // These proof files and immutable authority/originals are current references.
 // first.references are historical facts: never require today's tasks/source to equal them.
 return [d.identity,d.provenance,d.result,d.sourceBefore,d.sourceAfter,d.executionContract,d.terminal,...first.authority,historical.original,historical.originalManifest.identity,historical.originalSeal].map(r=>requireIdentity(r).identity)
}
