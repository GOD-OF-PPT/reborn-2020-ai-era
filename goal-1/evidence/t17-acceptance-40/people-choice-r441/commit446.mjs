import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/people-choice-r441',parent='a6a11bec1a3a4c36b5d51706acc585686ecc6a62',source=json(root+'/snapshot446.json')
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_ACTIVE446_PARENT_REQUIRED')
for(const name of ['people-r3.result.json','r446-type.result.json','r446-build.result.json'])if(json(root+'/'+name).exitCode!==0)throw Error('ENGINEERING_PASS_REQUIRED')
const tests=json(root+'/people-r3.vitest.json'),native=json(root+'/native-result446.json'),main=json(root+'/main-native446.json')
if(!tests.success||tests.numPassedTests!==52||tests.numFailedTests||!native.qa446.wholeWireUnchanged||!native.qa446.cancelAndReopenSameDraft||!main.beforeAfterBytesSame||!main.readingLayersClosed||!main.workAndRestEnabled||main.newMainCoreCommands!==0)throw Error('LIMITED_NATIVE_AND_USER_PROTECTION_REQUIRED')
for(const row of source.files)if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256)throw Error('FROZEN446_CHANGED:'+row.path)
for(const name of source.owned)if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256)throw Error('OWNED_WT_CHANGED:'+name)
const preservation=json(root+'/preservation-before-final446.json');if(preservation.fullSeals.length!==56)throw Error('ORIGINAL56_SEALS_REQUIRED');for(const row of preservation.fullSeals)verifySeal(row.root)
if(!json(root+'/source-and-worker446.json').workerSameAs436And416)throw Error('WORKER_CHANGED')
if(!fs.readFileSync(root+'/main129-before446.ui-export.json').equals(fs.readFileSync(root+'/main129-after446.ui-export.json')))throw Error('MAIN129_CHANGED')
const paths=[...source.owned,...tree(root).files.map(row=>row.path)].sort()
fs.writeFileSync(root+'/commit446-owned.json',JSON.stringify({at:new Date().toISOString(),parent,source:446,paths,sourcePaths:source.owned,selfExcluded:'commit446-owned.json',compatibility:0,wholeU6Complete:false},null,2)+'\n',{flag:'wx'})
paths.push(root+'/commit446-owned.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort()
if(!staged.length||staged.some(name=>!paths.includes(name)))throw Error('EXACT_OWNED_DELTA_REQUIRED')
const index=proof(rows);git(['commit','-m','Make equity staffing choices readable in one decision page'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(delta)!==JSON.stringify(staged)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_COMMIT_DELTA_REQUIRED')
const readback=proof(rows,commit),report={at:new Date().toISOString(),commit,parent,ownedPaths:paths.length,changedPaths:staged.length,sourcePaths:source.owned.length,index,readback,indexEmpty:true,notPushed:true,source:446,mainSource:446,taskVerificationComplete:true,wholeU6Complete:false,compatibility:0}
fs.writeFileSync(root+'/commit446-readback.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log({commit,owned:paths.length,changed:staged.length,source:source.owned.length,indexEmpty:true,notPushed:true})
