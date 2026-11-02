import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/business-entry-r447',parent='d94ed326be97a58aec3708d0f643e99d081b3518',source=json(root+'/snapshot448.json'),ownedSource=source.owned.filter(name=>name.startsWith('src/'))
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_ACTIVE448_PARENT_REQUIRED')
for(const name of ['entry-final.result.json','r448-type.result.json','r448-build.result.json'])if(json(root+'/'+name).exitCode!==0)throw Error('ENGINEERING_PASS_REQUIRED')
const tests=json(root+'/entry-final.vitest.json'),native=json(root+'/native-result448.json'),main=json(root+'/main-native448.json'),relocation=json(root+'/native-download-relocation.json')
if(!tests.success||tests.numPassedTests!==126||tests.numFailedTests||tests.testResults.length!==16||!native.qa448.wholeWireUnchanged||!native.qa448.primaryAndPaperSameBusinessConditions||!native.qa448.cancelAndReopenSameDraft||!native.qa448.originalWinddownConfirmReadAndCancelled||!main.beforeAfterBytesSame||!main.nativeSavePanelRecoveryVerifiedAfterUserUnlock||!main.readingLayersClosed||!main.workAndRestEnabled||main.newMainCoreCommands!==0||!relocation.wholeNativeDownloadEqualsBothCurrentUiExports)throw Error('LIMITED_NATIVE_AND_USER_PROTECTION_REQUIRED')
for(const row of source.files)if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256)throw Error('FROZEN448_CHANGED:'+row.path)
for(const name of source.owned)if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256)throw Error('OWNED_WT_CHANGED:'+name)
const preserved=json(root+'/preservation-after-native-download-recovery.json');if(preserved.fullSeals.length!==57)throw Error('ORIGINAL57_REQUIRED');for(const row of preserved.fullSeals)verifySeal(row.root)
if(!json(root+'/source-and-scope448.json').workerSameAs446And416)throw Error('WORKER_CHANGED')
const original=fs.readFileSync(root+'/main129-before448.ui-export.json');if(!original.equals(fs.readFileSync(root+'/main129-after448.ui-export.json'))||!original.equals(fs.readFileSync(root+'/native-main129-download.json')))throw Error('THREE_ACTUAL_MAIN129_INPUTS_CHANGED')
const paths=[...new Set([...ownedSource,...tree(root).files.map(row=>row.path)])].sort()
fs.writeFileSync(root+'/commit448-owned.json',JSON.stringify({at:new Date().toISOString(),parent,source:448,paths,sourcePaths:ownedSource,fixtureSeparate:true,selfExcluded:'commit448-owned.json',compatibility:0,wholeU6Complete:false},null,2)+'\n',{flag:'wx'})
paths.push(root+'/commit448-owned.json');paths.sort();const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();if(!staged.length||staged.some(name=>!paths.includes(name)))throw Error('EXACT_OWNED_DELTA_REQUIRED')
const index=proof(rows);git(['commit','-m','Open ongoing business choices directly and align scene copy'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(delta)!==JSON.stringify(staged)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_COMMIT_DELTA_REQUIRED')
const readback=proof(rows,commit),report={at:new Date().toISOString(),commit,parent,ownedPaths:paths.length,changedPaths:staged.length,sourcePaths:ownedSource.length,index,readback,indexEmpty:true,notPushed:true,source:448,mainSource:448,taskVerificationComplete:true,wholeU6Complete:false,compatibility:0}
fs.writeFileSync(root+'/commit448-readback.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log({commit,owned:paths.length,changed:staged.length,source:ownedSource.length,indexEmpty:true,notPushed:true})
