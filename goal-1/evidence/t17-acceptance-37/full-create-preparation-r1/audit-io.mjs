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
