import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/capital-current-audit-r437',parent='9e2e152ae7c8220b23c5a9e24f07aabcc5e37cdf'
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_ACTIVE_PARENT_REQUIRED')
const result=json(root+'/result.json'),terminal=json(root+'/terminal.json'),capture=json(root+'/capture.json'),s=json(root+'/source416.json')
if(terminal.exitCode!==0||result.savedRevision!==401||result.newJournalRows!==29||!result.fullOriginalWireRoundTripExact||!result.original372CompleteReceiptPrefixExact||!result.allNormalizedCommandFingerprintsAndReceiptDatesExact||result.newGameCommands!==0||hash(fs.readFileSync(root+'/audit-input.json'))!==capture.sha256)throw Error('ACTUAL_COMPLETE_AUDIT_REQUIRED')
for(const row of s.files)if(hash(fs.readFileSync(path.join(s.target,row.path)))!==row.sha256)throw Error('EXACT_SOURCE416_REQUIRED')
for(const row of json(root+'/preservation.json').fullSeals)verifySeal(row.root)
verifySeal('goal-1/evidence/t17-acceptance-40/scene-reading-r433')
const paths=tree(root).files.map(row=>row.path).sort()
fs.writeFileSync(root+'/commit-owned-paths437.json',JSON.stringify({at:new Date().toISOString(),parent,paths,selfExcluded:'commit-owned-paths437.json',productChanges:0,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(root+'/commit-owned-paths437.json');paths.sort()
if(paths.some(name=>!name.startsWith(root+'/')))throw Error('AUDIT_ROOT_ONLY_REQUIRED')
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths])
const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(staged)!==JSON.stringify(paths))throw Error('EXACT_OWNED_INDEX_REQUIRED')
const index=proof(rows)
git(['commit','-m','Audit actual normal capital continuation and protected customer funds'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(delta)!==JSON.stringify(paths)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_COMMIT_SCOPE_REQUIRED')
const readback=proof(rows,commit),report={at:new Date().toISOString(),commit,parent,paths:paths.length,index,readback,indexEmpty:true,notPushed:true,productChanges:0,wholeU6Complete:false,compatibility:0}
fs.writeFileSync(root+'/commit-readback437.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(report)
