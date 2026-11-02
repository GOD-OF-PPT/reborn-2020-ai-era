import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/people-choice-r441',parent='443a87e46a895b54874e283ded34673c37059a8b',source=json(root+'/snapshot443.json'),owned=json(root+'/baseline.json').owned
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_ACTIVE_WIP_PARENT_REQUIRED')
for(const name of ['people-functional.result.json','r443-type.result.json','r443-build.result.json'])if(json(root+'/'+name).exitCode!==0)throw Error('ACTUAL_ENGINEERING_PASS_REQUIRED:'+name)
const tests=json(root+'/people-functional.vitest.json'),status=json(root+'/publish-status.json')
if(!tests.success||tests.numPassedTests!==52||tests.numFailedTests!==0||status.taskComplete||status.mainUpdated||status.nativeVisualAndInputAcceptanceComplete)throw Error('WIP_SCOPE_REQUIRED')
for(const row of source.files)if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256)throw Error('FROZEN_SOURCE_CHANGED')
for(const name of owned)if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256)throw Error('OWNED_WT_CHANGED:'+name)
for(const row of json(root+'/preservation-before-wip.json').fullSeals)verifySeal(row.root)
if(!json(root+'/source-and-worker.json').workerSameAs436And416)throw Error('UNCHANGED_WORKER_REQUIRED')
const paths=[...owned,...tree(root).files.map(row=>row.path)].sort()
fs.writeFileSync(root+'/wip-owned-paths.json',JSON.stringify({at:new Date().toISOString(),parent,paths,selfExcluded:'wip-owned-paths.json',ownedSource:owned,source:443,nativeNotYetVerified:true,mainSourceStill436:true,taskComplete:false,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(root+'/wip-owned-paths.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(staged)!==JSON.stringify(paths))throw Error('EXACT_OWNED_INDEX_REQUIRED')
const index=proof(rows);git(['commit','-m','Prepare explicit people choices for equity assignments as WIP'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(delta)!==JSON.stringify(paths)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_COMMIT_SCOPE_REQUIRED')
const readback=proof(rows,commit),report={at:new Date().toISOString(),commit,parent,paths:paths.length,sourcePaths:owned.length,index,readback,indexEmpty:true,notPushed:true,taskComplete:false,nativeNotYetVerified:true,mainSourceStill436:true,wholeU6Complete:false,compatibility:0}
fs.writeFileSync(root+'/wip-readback.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(report)
