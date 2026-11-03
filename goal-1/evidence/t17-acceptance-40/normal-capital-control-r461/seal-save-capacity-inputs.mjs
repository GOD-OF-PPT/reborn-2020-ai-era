import fs from 'node:fs'
import path from 'node:path'
import cp from 'node:child_process'
import {deflateSync,inflateSync} from 'node:zlib'
import {json,hash,ident,tree,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',out=root+'/save-capacity-r471',execution=root+'/execution-r1',meta=json(out+'/source.json'),audit=json(out+'/audit623-result.json'),terminal=json(out+'/audit623-process-terminal.json'),intake=json(meta.intake)
if(fs.existsSync(out+'/stopped.json') || fs.existsSync(execution+'/sealed-evidence.json') || fs.existsSync(out+'/failed-execution-seal.json') || terminal.exitCode!==0 || !audit.entireOriginal623WireByteEqual || !audit.whole605ImmutablePrefixesEqual || !audit.all18OriginalCommandFingerprintsEqual || !audit.pending624Unsaved) throw Error('FRESH_AUDITED_FAILED_EXECUTION_REQUIRED')
if(!fs.existsSync(execution+'/stopped.json') || json(execution+'/terminal.json').failure!=='RuleError: SAVE_TOO_LARGE') throw Error('ORIGINAL_FAILURE_MUST_BE_TERMINAL')
for(const row of intake.closedExecutionFiles) {const now=ident(row.path);if(now.bytes!==row.bytes || now.sha256!==row.sha256 || now.mode!==row.mode)throw Error('OLD_EXECUTION_CHANGED:'+row.path)}
const preserveFile=root+'/preserve.mjs',before=fs.readFileSync(preserveFile,'utf8'),anchor='const report={'
if(before.split(anchor).length!==2 || before.includes("seals.push(verifySeal('"+execution+"'))")) throw Error('EXACT_PRESEAL71_HELPER_REQUIRED')
const raw=fs.readFileSync(meta.proposal624)
if(hash(raw)!==meta.proposal624Sha256 || raw.length!==meta.proposal624Bytes) throw Error('EXACT_ORIGINAL_UNWRITTEN624_REQUIRED')
const packed=deflateSync(raw,{level:9}),decoded=inflateSync(packed,{maxOutputLength:raw.length})
if(!decoded.equals(raw)) throw Error('ARCHIVE_MUST_RETAIN_EVERY_ORIGINAL_BYTE')
const archive=out+'/unwritten-proposal624.json.zlib'
fs.writeFileSync(archive,packed,{flag:'wx'})
const put=(name,value)=>fs.writeFileSync(out+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'})
put('proposal624-archive.json',{at:new Date().toISOString(),original:ident(meta.proposal624),archive:ident(archive),losslessByteReadback:true,archivalTransportOnlyNotGameSave:true,originalRawPreserved:true,node:process.version,compression:'Node zlib level9',proposalNotSaved:true,compatibility:0})
const summary={at:new Date().toISOString(),selfExcluded:'sealed-evidence.json',...tree(execution),scope:'Failed original execution exit1 SAVE_TOO_LARGE; actual623 independently audited;624 only unwritten original proposal; not normal2025 completion',source:'kernel416-codec459',actualExitCode:1,lastSavedRevision:623,pendingUnsavedRevision:624,compatibility:0}
fs.writeFileSync(execution+'/sealed-evidence.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'})
const sealed=verifySeal(execution)
put('failed-execution-seal.json',sealed)
fs.writeFileSync(preserveFile,before.replace(anchor,"seals.push(verifySeal('"+execution+"'));\n"+anchor))
const node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node',result=cp.spawnSync(node,[preserveFile,'save-inputs-sealed'],{encoding:'utf8'})
put('failed-execution-preservation-command.json',{exitCode:result.status,signal:result.signal,stdout:result.stdout,stderr:result.stderr})
if(result.status!==0 || json(root+'/preservation-save-inputs-sealed.json').fullSeals.length!==72) throw Error('EXACT72_PRESERVATION_REQUIRED')
console.log({originalExecutionSealed:true,ordinaryFiles:sealed.ordinaryFiles,fullPreservedSeals:72,unwritten624RawBytes:raw.length,archivalCompressedBytes:packed.length,archivalReadbackByteEqual:true,gameSaveProduced:false,newGameCommands:0,compatibility:0})
