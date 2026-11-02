import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/business-entry-r447',post='goal-1/evidence/t17-u6-business-entry-post-commit-01',feature='7fe9dd59373f375bc6b473515c9adb1c4d0c7991'
if(git(['rev-parse','HEAD']).toString().trim()!==feature||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_FEATURE_AND_ACTIVE_GROUP_REQUIRED')
const status=json(root+'/delivery-status.json'),source=json(root+'/snapshot448.json'),main=json(root+'/main-native448.json'),preserved=json(root+'/preservation-after-feature448.json'),ownedSource=source.owned.filter(name=>name.startsWith('src/'))
if(!status.taskComplete||!status.mainUpdated||status.mainSource!==448||!status.nativeDownloadFileVerified||status.wholeU6Complete||!fs.readFileSync(root+'/tasks.md','utf8').includes('- [x] 修复活任务主体')||!main.beforeAfterBytesSame||!main.nativeSavePanelRecoveryVerifiedAfterUserUnlock||!main.readingLayersClosed||preserved.fullSeals.length!==57)throw Error('VERIFIED_LIMITED_DELIVERY_REQUIRED')
for(const row of preserved.fullSeals)verifySeal(row.root)
for(const name of source.owned){const row=source.files.find(r=>r.path===name);if(hash(fs.readFileSync(name))!==row.sha256||hash(fs.readFileSync(path.join(source.target,name)))!==row.sha256)throw Error('OWNED448_CHANGED:'+name)}
const original=fs.readFileSync(root+'/main129-before448.ui-export.json');for(const name of ['main129-after448.ui-export.json','native-main129-download.json'])if(!original.equals(fs.readFileSync(root+'/'+name)))throw Error('MAIN129_CHANGED:'+name)
const at=new Date().toISOString(),delivery={at,feature,source:448,ownedSource,mainSource:448,mainOrigin:main.mainOrigin,taskComplete:true,wholeU6Complete:false,wholeGoalComplete:false,compatibility:0,humanAcceptance:0,notPushed:true,normalCapitalProcessStillActive:47783,scope:'Only business-entry internal UI task; full U6 and all later responsibilities retained'}
fs.writeFileSync(root+'/delivery.json',JSON.stringify(delivery,null,2)+'\n',{flag:'wx'})
fs.writeFileSync(root+'/terminal.json',JSON.stringify({at,stage:'limited_business_entry_delivered',taskComplete:true,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
fs.writeFileSync(root+'/stopped.json',JSON.stringify({at,reason:'Business-entry producer completed; no append after full seal. Active normal-capital producer stays separate.'},null,2)+'\n',{flag:'wx'})
const snapshot=tree(root);fs.writeFileSync(root+'/sealed-evidence.json',JSON.stringify({at,...snapshot,selfExcluded:'sealed-evidence.json',scope:delivery.scope,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
const seal=verifySeal(root),paths=[...new Set([...ownedSource,...tree(root).files.map(r=>r.path),root+'/sealed-evidence.json',...tree(post).files.map(r=>r.path)])].sort(),rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();if(!staged.length||staged.some(name=>!paths.includes(name)))throw Error('EXACT_CLOSURE_DELTA_REQUIRED')
const index=proof(rows);git(['commit','-m','Record verified business-entry delivery and seal evidence'])
const closure=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',closure]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(delta)!==JSON.stringify(staged)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_CLOSURE_COMMIT_REQUIRED')
const readback=proof(rows,closure);verifySeal(root);for(const row of preserved.fullSeals)verifySeal(row.root)
const report={at:new Date().toISOString(),feature,closure,source:448,allOwnedPaths:paths.length,changedPaths:staged.length,index,readback,seal,indexEmpty:true,notPushed:true,oldFullSeals:57,newFullSeals:58,taskComplete:true,wholeU6Complete:false,wholeGoalComplete:false,mainSource:448,compatibility:0}
fs.writeFileSync(post+'/readback.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log({feature,closure,owned:paths.length,delta:staged.length,ordinaryFiles:seal.ordinaryFiles,seal:seal.marker.sha256,indexEmpty:true,wholeU6Complete:false,notPushed:true})
