import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/capital-current-audit-r437',parent='93b826f286b51fc561c8bcf7f3588d09f2814c95'
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('ACTUAL_PARENT_AND_ACTIVE_AUDIT_REQUIRED')
const result=json(root+'/result.json'),terminal=json(root+'/terminal.json'),journal=json(root+'/journal-provenance.json'),source=json(root+'/source416.json')
if(terminal.exitCode!==0||!result.fullOriginalWireRoundTripExact||!result.allNormalizedCommandFingerprintsAndReceiptDatesExact||!journal.decodedRowsExactlyEqualPreviouslyAuditedArray||!journal.rawBytesPreserved||hash(fs.readFileSync(root+'/audit-journal-original.jsonl'))!==journal.originalPrefixSha256||!fs.readFileSync(root+'/tasks.md','utf8').includes('- [x]'))throw Error('ACTUAL_COMPLETE_AUDIT_REQUIRED')
for(const row of source.files)if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256)throw Error('ORIGINAL_SOURCE_CHANGED')
for(const row of json(root+'/preservation.json').fullSeals)verifySeal(row.root)
verifySeal('goal-1/evidence/t17-acceptance-40/scene-reading-r433')
fs.writeFileSync(root+'/stopped.json',JSON.stringify({at:new Date().toISOString(),producer:root,stopped:true,scope:'This independent read-only audit only',capturedRevision:401,newGameCommands:0,capital432StillActive:true,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
fs.writeFileSync(root+'/sealed-evidence.json',JSON.stringify({at:new Date().toISOString(),selfExcluded:'sealed-evidence.json',...tree(root)},null,2)+'\n',{flag:'wx'})
const seal=verifySeal(root),paths=['tasks.md','validation.md','continuation.md','commit-readback437.json','closeout437.mjs','stopped.json','sealed-evidence.json'].map(name=>root+'/'+name).sort(),rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(staged)!==JSON.stringify(paths))throw Error('EXACT_CLOSURE_INDEX_REQUIRED')
proof(rows);git(['commit','-m','Record and seal the independent current capital audit'])
const commit=git(['rev-parse','HEAD']).toString().trim();proof(rows,commit)
const all=[...tree(root).files.map(row=>row.path),root+'/sealed-evidence.json'].sort().map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))})),readback=proof(all,commit)
if(git(['diff','--cached','--name-only']).length)throw Error('INDEX_NOT_EMPTY')
verifySeal(root)
const report={at:new Date().toISOString(),implementation:json(root+'/commit-readback437.json').commit,provenance:parent,closure:commit,seal,readback,indexEmpty:true,notPushed:true,productChanges:0,groupComplete:true,normalBoardComplete:false,wholeU6Complete:false,compatibility:0}
fs.writeFileSync('.delivery/t17-u6-current-audit437-closure.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log({implementation:report.implementation,provenance:parent,closure:commit,files:seal.ordinaryFiles,dirs:seal.directories,marker:seal.marker.sha256,readback,indexEmpty:true})
