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
export function requirePublicReadbackWiring(wiring,records){
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
   for(const record of manifest.records){requireIdentity(record.identity);if(!frozen.inputs.some(input=>identityEqual(input,record.identity)))throw Error('INHERITED_RAW_NOT_IN_FROZEN_INPUTS');const actual=records.filter(row=>identityEqual(row.identity,record.identity)&&r.recordKeys.includes(row.key));if(!actual.length)throw Error('INHERITED_RAW_MISSING_FINAL_RECORD_ROLE')}
   references.push(...manifest.records.map(record=>record.identity))
  }
 }
 for(const scope of ['positive_service','negative_stop_and_atomic','current_r7_facts'])if(!ids.has(scope))throw Error('REQUIRED_BRANCH_READBACK_MISSING:'+scope)
 for(const r of wiring.requirements)if(!['positive_service','negative_stop_and_atomic'].includes(r.scope)&&r.mode!=='fresh_readback')throw Error('EXISTING_JSON_READBACK_CANNOT_COVER_CURRENT_R7_FACTS')
 return references
}
export function validatePublicReadbackResult(report,contract,contractIdentity){
 requirePublicReadbackWiring(contract.publicReadbackWiring,contract.records)
 if(report?.passed!==true||report.auditDirectory!==contract.directory||!identityEqual(report.contract,contractIdentity)||!Array.isArray(report.coverage)||report.coverage.length!==contract.publicReadbackWiring.requirements.length)throw Error('EXACT_CONTRACT_PUBLIC_READBACK_RESULT_REQUIRED')
 const canonicalKeys=a=>JSON.stringify([...a].sort())
 for(const required of contract.publicReadbackWiring.requirements){
  const matches=report.coverage.filter(r=>r.scope===required.scope),row=matches.length===1?matches[0]:null
  if(!row||row.mode!==required.mode||row.passed!==true||!Array.isArray(row.recordKeys)||canonicalKeys(row.recordKeys)!==canonicalKeys(required.recordKeys)||row.checks!==required.expectedChecks||row.passedChecks!==row.checks||row.failedChecks!==0)throw Error('PUBLIC_READBACK_SCOPE_RESULT_MISMATCH:'+required.scope)
  if(required.mode==='inherited_result'&&(!identityEqual(row.reusedResult,required.inheritance.result)||!identityEqual(row.reusedFacts,required.inheritance.facts)))throw Error('EXACT_INHERITED_READBACK_IDENTITIES_REQUIRED')
 }
 return true
}
