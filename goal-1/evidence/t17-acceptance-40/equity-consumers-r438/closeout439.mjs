import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/equity-consumers-r438',parent='0491672ca68f740643e51374a214afc461a5faff',source=json(root+'/snapshot439.json'),owned=json(root+'/baseline.json').owned
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json'))throw Error('ACTUAL_FEATURE_PARENT_REQUIRED')
const cases=json(root+'/current-case-evidence.json'),first=json(root+'/current50-r1.cases.json'),target=json(root+'/entry-locator-r2.result.json'),type=json(root+'/r439-type.result.json'),observation=json(root+'/interruption-observation.json')
if(cases.reusedCases!==333||cases.targetedRerunCases!==3||cases.oneWholeGreenBatch||first.passed!==334||first.failed!==2||target.exitCode!==0||type.exitCode!==0||!json(root+'/main-restored436.json').all276HttpBytesExact||!fs.readFileSync(root+'/tasks.md','utf8').includes('- [x]'))throw Error('ACTUAL_SCOPED_COMPLETION_REQUIRED')
for(const row of source.files)if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256)throw Error('FROZEN_SOURCE_CHANGED')
for(const name of owned)if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256)throw Error('OWNED_SOURCE_CHANGED')
if(hash(fs.readFileSync('goal-1/evidence/t17-acceptance-40/normal-capital-recovery-r432/execution-r1/head.current.json'))!==observation.sha256)throw Error('OBSERVED_CANONICAL_HEAD_CHANGED')
for(const row of json(root+'/preservation.json').fullSeals)verifySeal(row.root)
verifySeal('goal-1/evidence/t17-acceptance-40/scene-reading-r433');verifySeal('goal-1/evidence/t17-acceptance-40/capital-current-audit-r437')
fs.writeFileSync(root+'/terminal.json',JSON.stringify({at:new Date().toISOString(),isProcessExitRecord:false,scope:'Consumer functional group completion record',groupComplete:true,firstFullBatch:{source:436,exitCode:1,passed:334,failed:2},targetedCompleteFile:{source:439,exitCode:0,passed:3},typeCheckExitCode:0,currentEvidence:{reused:333,rerun:3,oneWholeGreenBatch:false},capitalProcess:'observed stopped at saved417; exit code unknown',wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
fs.writeFileSync(root+'/stopped.json',JSON.stringify({at:new Date().toISOString(),producer:root,stopped:true,scope:'This consumer verification group only',groupComplete:true,normalCapitalRecoveryStillRequired:true,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
fs.writeFileSync(root+'/sealed-evidence.json',JSON.stringify({at:new Date().toISOString(),selfExcluded:'sealed-evidence.json',...tree(root)},null,2)+'\n',{flag:'wx'})
const seal=verifySeal(root),names=['tasks.md','validation.md','continuation.md','resume-input-20261102.md','commit-readback439.json','interruption-observation.json','main-restored436.json','closeout439.mjs','terminal.json','stopped.json','sealed-evidence.json'],paths=names.map(name=>root+'/'+name).sort(),rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort()
if(JSON.stringify(staged)!==JSON.stringify(paths))throw Error('EXACT_RECORD_INDEX_REQUIRED')
proof(rows);git(['commit','-m','Seal consumer verification and record interrupted capital continuation'])
const commit=git(['rev-parse','HEAD']).toString().trim();proof(rows,commit)
const all=[...owned,...tree(root).files.map(row=>row.path),root+'/sealed-evidence.json'].sort().map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))})),readback=proof(all,commit)
if(git(['diff','--cached','--name-only']).length)throw Error('INDEX_NOT_EMPTY')
verifySeal(root)
const result={at:new Date().toISOString(),feature:parent,closure:commit,source:439,seal,readback,indexEmpty:true,notPushed:true,groupComplete:true,productChanges:0,normalCapitalRecoveryFrom417Required:true,wholeU6Complete:false,compatibility:0}
fs.writeFileSync('.delivery/t17-u6-consumers439-closure.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log({feature:parent,closure:commit,files:seal.ordinaryFiles,dirs:seal.directories,marker:seal.marker.sha256,readback,indexEmpty:true})
