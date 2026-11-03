import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume623-r474'
const phase=root+'/receipt-cache-r475'
const earlier='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461'
const parent='5ed5fc52c68b38be6618d631be498b253ad9c07d'
const source=json(phase+'/snapshot479.json')
if(git(['rev-parse','HEAD']).toString().trim()!==parent || git(['diff','--cached','--name-only']).length || fs.existsSync(phase+'/stopped.json')) throw Error('EXACT_ACTIVE_WIP_PARENT_REQUIRED')
const full=json(phase+'/final-ledger-consumers.vitest.json'),target=json(phase+'/final-cache-budget479.vitest.json')
if(!full.success || full.numPassedTests!==251 || full.numFailedTests || full.numPendingTests || !target.success || target.numPassedTests!==17 || target.numFailedTests || target.numPendingTests) throw Error('GREEN_FUNCTIONAL_CHECKS_REQUIRED')
const equivalence=json(phase+'/source-equivalence477-479.json')
if(!equivalence.allRuntimeConfigAssetFilesByteEqual || equivalence.onlyDifference.length!==1) throw Error('EXPLICIT_FINAL_RUNTIME_EQUIVALENCE_REQUIRED')
for(const name of ['r479-type.result.json','r477-build.result.json']){
  const report=json(phase+'/'+name)
  if(report.exitCode!==0 || !report.sourceExact) throw Error('ENGINEERING_CHECKS_REQUIRED')
}
const actual=json(phase+'/actual-components.json')
if(!actual.allFortyWholeLedgerPrefixesEqualToOriginal464 || actual.actualReceiptOperations!==40 || !actual.baselineUnchanged || actual.passes[1].parseCalls!==14388 || !actual.sourceExact) throw Error('REAL_COMPONENT_PROOF_REQUIRED')
for(const row of source.files) if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256) throw Error('FROZEN479_CHANGED')
for(const name of source.owned) if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256) throw Error('OWNED_SOURCE_CHANGED')
const preserved=json(earlier+'/preservation-cache-before-wip479.json').fullSeals
if(preserved.length!==74) throw Error('EXACT74_REQUIRED')
for(const row of preserved) verifySeal(row.root)
if(fs.existsSync(phase+'/replay624-result.json') || fs.existsSync(phase+'/replay624-failure.json')) throw Error('REPLAY_TERMINAL_REQUIRES_ACCEPTANCE_OR_REPAIR_REVIEW')
const replay=json(phase+'/replay624-started.json')
process.kill(replay.pid,0)

const excluded=name=>name.startsWith(phase+'/replay624') || name===phase+'/candidate624.json'
const extras=['cache-freeze.mjs','cache-check.mjs','cache-engineering.mjs','cache-actual-components.mjs','cache-replay624.mjs','commit-cache-wip.mjs','input.md','plan.md','tasks.md','continuation.md','validation-progress.md','interruption-intake.json','interrupted-execution-seal.json'].map(name=>root+'/'+name)
const checkpointPrepared=tree(root+'/checkpoint624').files.map(row=>row.path)
const stoppedExecution=tree(root+'/execution-r1').files.map(row=>row.path)
const paths=[...new Set([...source.owned,...tree(phase).files.map(row=>row.path).filter(name=>!excluded(name)),...extras,...checkpointPrepared,...stoppedExecution,root+'/execution-r1/sealed-evidence.json',root+'/audit624.mjs',earlier+'/preserve.mjs',earlier+'/preservation-receipt-cache-start.json',earlier+'/preservation-cache-before-wip479.json'])].sort()
if(paths.some(excluded) || paths.includes('goal-1/plan.md') || paths.includes('goal-1/tasks.md')) throw Error('ACTIVE_REPLAY_AND_MIXED_MASTERS_EXCLUDED')
fs.writeFileSync(phase+'/wip-owned.json',JSON.stringify({at:new Date().toISOString(),parent,source:479,paths,selfExcluded:'wip-owned.json',original624FullReplayPending:true,taskComplete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(phase+'/wip-owned.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths])
const staged=git(['diff','--cached','--name-only','-z']).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(!staged.length || staged.some(name=>!paths.includes(name))) throw Error('EXACT_WIP_DELTA_REQUIRED')
const index=proof(rows)
git(['commit','-m','WIP: preserve bounded receipt parsing reuse across long ledger scans'])
const commit=git(['rev-parse','HEAD']).toString().trim()
const delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(JSON.stringify(delta)!==JSON.stringify(staged) || git(['diff','--cached','--name-only']).length) throw Error('EXACT_COMMIT_DELTA_REQUIRED')
const readback=proof(rows,commit)
fs.writeFileSync(phase+'/wip-readback.json',JSON.stringify({at:new Date().toISOString(),commit,parent,source:479,sourcePaths:source.owned,owned:paths.length,delta:staged.length,index,readback,indexEmpty:true,notPushed:true,original624FullReplayPending:true,taskComplete:false,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
console.log({commit,owned:paths.length,delta:staged.length,source:479,actualRepeatedParses:14388,original624FullReplayPending:true,indexEmpty:true,notPushed:true,taskComplete:false})
