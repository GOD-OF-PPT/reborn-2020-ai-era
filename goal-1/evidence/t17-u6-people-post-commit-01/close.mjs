import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/people-choice-r441',post='goal-1/evidence/t17-u6-people-post-commit-01',feature='f2efe456da1fed68d6f34c8d3df60bbeac1729c1'
if(git(['rev-parse','HEAD']).toString().trim()!==feature||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('EXACT_FEATURE_AND_ACTIVE_GROUP_REQUIRED')
const status=json(root+'/publish-status.json'),source=json(root+'/snapshot446.json'),main=json(root+'/main-native446.json'),preserved=json(root+'/preservation-after-feature446.json')
if(!status.taskComplete||!status.mainUpdated||status.mainSource!==446||status.wholeU6Complete||!fs.readFileSync(root+'/tasks.md','utf8').includes('- [x] 权益近景')||!main.beforeAfterBytesSame||!main.readingLayersClosed||preserved.fullSeals.length!==56)throw Error('VERIFIED_LIMITED_DELIVERY_REQUIRED')
for(const item of preserved.fullSeals)verifySeal(item.root)
for(const name of source.owned){const row=source.files.find(r=>r.path===name);if(hash(fs.readFileSync(name))!==row.sha256||hash(fs.readFileSync(path.join(source.target,name)))!==row.sha256)throw Error('OWNED446_CHANGED:'+name)}
if(!fs.readFileSync(root+'/main129-before446.ui-export.json').equals(fs.readFileSync(root+'/main129-after446.ui-export.json')))throw Error('MAIN129_CHANGED')
const at=new Date().toISOString(),delivery={at,feature,source:446,ownedSource:source.owned,mainSource:446,mainOrigin:main.mainOrigin,taskComplete:true,wholeU6Complete:false,wholeGoalComplete:false,compatibility:0,humanAcceptance:0,notPushed:true,normalCapitalProcessStillActive:47783,scope:'Only people-choice internal UI task; full U6 and later responsibilities retained'}
fs.writeFileSync(root+'/delivery.json',JSON.stringify(delivery,null,2)+'\n',{flag:'wx'})
fs.writeFileSync(root+'/terminal.json',JSON.stringify({at,stage:'limited_people_choice_delivered',taskComplete:true,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
fs.writeFileSync(root+'/stopped.json',JSON.stringify({at,reason:'People-choice producer finished; no append after full seal. Active normal-capital producer remains separate.'},null,2)+'\n',{flag:'wx'})
const snapshot=tree(root);fs.writeFileSync(root+'/sealed-evidence.json',JSON.stringify({at,...snapshot,selfExcluded:'sealed-evidence.json',scope:delivery.scope,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
const seal=verifySeal(root),paths=[...source.owned,...tree(root).files.map(r=>r.path),root+'/sealed-evidence.json',...tree(post).files.map(r=>r.path)].sort(),rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();if(!staged.length||staged.some(name=>!paths.includes(name)))throw Error('EXACT_CLOSURE_DELTA_REQUIRED')
const index=proof(rows);git(['commit','-m','Record verified people-choice delivery and preserve evidence'])
const closure=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',closure]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(delta)!==JSON.stringify(staged)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_CLOSURE_COMMIT_REQUIRED')
const readback=proof(rows,closure);verifySeal(root);for(const item of preserved.fullSeals)verifySeal(item.root)
const report={at:new Date().toISOString(),feature,closure,source:446,allOwnedPaths:paths.length,changedPaths:staged.length,index,readback,seal,indexEmpty:true,notPushed:true,oldFullSeals:56,newFullSeals:57,taskComplete:true,wholeU6Complete:false,wholeGoalComplete:false,mainSource:446,compatibility:0}
fs.writeFileSync(post+'/readback.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log({feature,closure,owned:paths.length,delta:staged.length,ordinaryFiles:seal.ordinaryFiles,seal:seal.marker.sha256,indexEmpty:true,wholeU6Complete:false,notPushed:true})
