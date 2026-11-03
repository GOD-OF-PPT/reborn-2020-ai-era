import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/exploration-clarity-r480'
const parent='a84283854b8426f216c76e2d916a188bcd910ad1'
const source=json(root+'/snapshot481.json')
if(git(['rev-parse','HEAD']).toString().trim()!==parent || git(['diff','--cached','--name-only']).length || fs.existsSync(root+'/stopped.json')) throw Error('EXACT_ACTIVE_UI_WIP_REQUIRED')
for(const kind of ['type','build']){
  const result=json(root+'/r481-'+kind+'.result.json')
  if(result.exitCode!==0 || !result.sourceExact) throw Error('FINAL_ENGINEERING_REQUIRED')
}
const tests=json(root+'/final-room-regression.vitest.json')
if(!tests.success || tests.numFailedTests || tests.numPendingTests || tests.testResults.length!==4) throw Error('FINAL_RELATED_TESTS_REQUIRED')
const control=json(root+'/source-and-baseline481.json')
if(Object.keys(control.sameTwoPreexistingAssertionFailures).length!==2 || !control.coreRulesSaveAndAssetsByteEqual) throw Error('BASELINE_FAILURES_AND_SCOPE_REQUIRED')
for(const row of source.files) if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256) throw Error('FROZEN_UI_SOURCE_CHANGED')
for(const name of source.owned) if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256) throw Error('OWNED_UI_SOURCE_CHANGED')
const preservationPath='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/preservation-exploration-before-wip.json'
const seals=json(preservationPath).fullSeals
if(seals.length!==74) throw Error('EXACT74_REQUIRED')
for(const row of seals) verifySeal(row.root)
const paths=[...new Set([...source.owned,...tree(root).files.map(row=>row.path),preservationPath])].sort()
fs.writeFileSync(root+'/wip-owned.json',JSON.stringify({at:new Date().toISOString(),parent,source:481,paths,selfExcluded:'wip-owned.json',candidateNativeVerificationPending:true,mainUpdated:false,taskComplete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(root+'/wip-owned.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths])
const staged=git(['diff','--cached','--name-only','-z']).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(!staged.length || staged.some(name=>!paths.includes(name))) throw Error('EXACT_UI_WIP_DELTA_REQUIRED')
const index=proof(rows)
git(['commit','-m','WIP: make room exploration choices and shortcuts visible'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(JSON.stringify(delta)!==JSON.stringify(staged) || git(['diff','--cached','--name-only']).length) throw Error('EXACT_COMMIT_DELTA_REQUIRED')
const readback=proof(rows,commit)
fs.writeFileSync(root+'/wip-readback.json',JSON.stringify({at:new Date().toISOString(),commit,parent,source:481,sourcePaths:source.owned,owned:paths.length,delta:staged.length,index,readback,indexEmpty:true,notPushed:true,relatedCases:tests.numPassedTests,candidateNativeVerificationPending:true,mainUpdated:false,taskComplete:false,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
console.log({commit,owned:paths.length,delta:staged.length,relatedCases:tests.numPassedTests,candidateNativeVerificationPending:true,mainUpdated:false,indexEmpty:true,notPushed:true,taskComplete:false})
