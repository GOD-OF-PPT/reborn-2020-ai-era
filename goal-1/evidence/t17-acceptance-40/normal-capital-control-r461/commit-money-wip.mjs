import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const parent='35ba64a530bc26a86864c3ae5c042650de47de23'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461'
const phase=root+'/money-sum-r464'
const source=json(phase+'/snapshot469.json')
if(git(['rev-parse','HEAD']).toString().trim()!==parent || git(['diff','--cached','--name-only']).length || fs.existsSync(root+'/stopped.json') || fs.existsSync(phase+'/stopped.json')) throw Error('ACTIVE_EXACT_PARENT_REQUIRED')
for(const name of ['r469-type.result.json','r469-build.result.json']) {
  const result=json(phase+'/'+name)
  if(result.exitCode!==0 || !result.sourceExact) throw Error('FINAL_ENGINEERING_PASS_REQUIRED')
}
const tests=json(phase+'/final-money-consumers.vitest.json')
if(tests.testResults.length!==31 || tests.numTotalTests!==246 || tests.numPassedTests!==246 || tests.numFailedTests || tests.numPendingTests || !tests.success) throw Error('EXACT_FINAL246_REQUIRED')
const old=json(phase+'/original-final-contract.vitest.json')
if(old.numTotalTests!==19 || old.numPassedTests!==19 || old.numFailedTests || old.numPendingTests || !old.success) throw Error('ORIGINAL_FINAL19_REQUIRED')
for(const row of source.files) if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256) throw Error('FROZEN469_CHANGED')
for(const name of source.owned) if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256) throw Error('OWNED_SOURCE_CHANGED')
const scope=json(phase+'/source-scope469.json')
if(!scope.noOtherChanges || !scope.originalBigIntBodyVerbatim || !scope.moneyProductByteEqualToMeasured466) throw Error('SOURCE_SCOPE_REQUIRED')
const preservation=json(root+'/preservation-money-pre-replay-r467.json')
if(preservation.fullSeals.length!==69) throw Error('ORIGINAL69_REQUIRED')
for(const row of preservation.fullSeals) verifySeal(row.root)
const launch=json(root+'/execution-launch.json')
if(hash(fs.readFileSync(root+'/run605.ts'))!==launch.driverSha256) throw Error('ORIGINAL_LIVE_DRIVER_CHANGED')
if(fs.existsSync(phase+'/replay613-result.json') || fs.existsSync(phase+'/replay613-failure.json')) throw Error('REPLAY_TERMINAL_USE_ACCEPTANCE_OR_REPAIR_INSTEAD')
const replay=json(phase+'/replay613-started.json')
try {process.kill(replay.pid,0)} catch {throw Error('SPECIFIC_CANDIDATE_REPLAY_MUST_BE_LIVE')}
const excluded=name=>name.startsWith(phase+'/replay613') || name===phase+'/candidate613.json' || name===phase+'/different-candidate613.json'
const extras=['money-freeze.mjs','money-check.mjs','money-engineering.mjs','money-benchmark.mjs','money-benchmark-isolated.mjs','money-benchmark-heat.mjs','money-benchmark-final.mjs','money-benchmark-isolated-final.mjs','money-jit-probe.mjs','money-old-control.mjs','money-replay613.mjs','commit-money-wip.mjs','plan.md','tasks.md','continuation.md','preservation-money-pre-replay-r467.json'].map(name=>root+'/'+name)
const paths=[...new Set([...source.owned,...tree(phase).files.map(row=>row.path).filter(name=>!excluded(name)),...extras])].sort()
if(paths.some(excluded)) throw Error('ACTIVE_REPLAY_OUTPUTS_EXCLUDED')
fs.writeFileSync(phase+'/wip-owned.json',JSON.stringify({at:new Date().toISOString(),parent,paths,selfExcluded:'wip-owned.json',source:469,pendingFullOriginal613Difference:true,notFormalPerformancePass:true,taskComplete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(phase+'/wip-owned.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths])
const staged=git(['diff','--cached','--name-only','-z']).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(!staged.length || staged.some(name=>!paths.includes(name))) throw Error('EXACT_WIP_DELTA_REQUIRED')
const index=proof(rows)
git(['commit','-m','WIP: bound exact money sums while validating long-save replay'])
const commit=git(['rev-parse','HEAD']).toString().trim()
const delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(JSON.stringify(delta)!==JSON.stringify(staged) || git(['diff','--cached','--name-only']).length) throw Error('EXACT_COMMIT_DELTA_REQUIRED')
const readback=proof(rows,commit)
fs.writeFileSync(phase+'/wip-readback.json',JSON.stringify({at:new Date().toISOString(),commit,parent,source:469,owned:paths.length,delta:staged.length,sourcePaths:source.owned,index,readback,indexEmpty:true,notPushed:true,pendingFullOriginal613Difference:true,notFormalPerformancePass:true,taskComplete:false,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
console.log({commit,owned:paths.length,delta:staged.length,consumers:'246/246',taskComplete:false,pendingFullDifference:true,indexEmpty:true,notPushed:true})
