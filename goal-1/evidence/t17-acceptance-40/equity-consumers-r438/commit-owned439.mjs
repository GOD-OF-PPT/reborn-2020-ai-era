import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/equity-consumers-r438',parent='220499c9d0f988237429dbc77f92f88d6e50db65',s=json(root+'/snapshot439.json'),owned=json(root+'/baseline.json').owned
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_ACTIVE_PARENT_REQUIRED')
const cases=json(root+'/current-case-evidence.json'),first=json(root+'/current50-r1.cases.json')
if(cases.cases!==336||cases.reusedCases!==333||cases.targetedRerunCases!==3||cases.oneWholeGreenBatch||first.failed!==2||!first.priorCaseMultisetRetained||json(root+'/entry-locator-r2.result.json').exitCode!==0||json(root+'/r439-type.result.json').exitCode!==0||!json(root+'/main-reuse436.json').indexByteEqualOriginal436)throw Error('ACTUAL_SCOPED_RESULTS_REQUIRED')
if(JSON.stringify(owned)!==JSON.stringify(['src/ui/App.deepseek-entry.test.tsx']))throw Error('EXACT_SINGLE_TEST_CHANGE_REQUIRED')
for(const row of s.files)if(hash(fs.readFileSync(path.join(s.target,row.path)))!==row.sha256)throw Error('FROZEN_SOURCE_CHANGED:'+row.path)
for(const name of owned)if(hash(fs.readFileSync(name))!==s.files.find(row=>row.path===name)?.sha256)throw Error('OWNED_WT_CHANGED')
for(const row of json(root+'/preservation.json').fullSeals)verifySeal(row.root)
verifySeal('goal-1/evidence/t17-acceptance-40/scene-reading-r433');verifySeal('goal-1/evidence/t17-acceptance-40/capital-current-audit-r437')
const paths=[...owned,...tree(root).files.map(row=>row.path)].sort()
fs.writeFileSync(root+'/commit-owned-paths439.json',JSON.stringify({at:new Date().toISOString(),parent,paths,selfExcluded:'commit-owned-paths439.json',ownedSource:owned,productChanges:0,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(root+'/commit-owned-paths439.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(staged)!==JSON.stringify(paths))throw Error('EXACT_OWNED_INDEX_REQUIRED')
const index=proof(rows);git(['commit','-m','Verify current equity consumers and update the concise entry locator'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(delta)!==JSON.stringify(paths)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_COMMIT_SCOPE_REQUIRED')
const readback=proof(rows,commit),result={at:new Date().toISOString(),commit,parent,paths:paths.length,sourcePaths:owned.length,index,readback,indexEmpty:true,notPushed:true,productChanges:0,wholeU6Complete:false,compatibility:0}
fs.writeFileSync(root+'/commit-readback439.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(result)
