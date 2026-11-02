import fs from 'node:fs'
import path from 'node:path'
import {json,hash,tree,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume-r440',parent='34edf2a36154bb6e6dd91b4ecc82d65d9325fa99',baseline=json(root+'/baseline.json'),s=json(root+'/source416.json')
if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).length||fs.existsSync(root+'/stopped.json')||fs.existsSync(root+'/wip-readback.json'))throw Error('SINGLE_ACTIVE_WIP_PARENT_REQUIRED')
const audit=json(root+'/result.json'),cursor=json(root+'/cursor-check.json'),launch=json(root+'/execution-launch.json')
if(json(root+'/audit-terminal.json').exitCode!==0||audit.savedRevision!==417||audit.newJournalRows!==45||!audit.fullOriginalWireRoundTripExact||!cursor.all20Exact||!cursor.advanceExact||cursor.passed!==7||json(root+'/selector-check.json').passed!==6)throw Error('ACTUAL_AUDIT_AND_CURSOR_CHECKS_REQUIRED')
for(const [name,key]of[['run.ts','driverSha256'],['paused-default-choice.ts','selectorSha256'],['calendar-offsets.ts','calendarSha256']])if(hash(fs.readFileSync(root+'/'+name))!==launch[key])throw Error('LIVE_DRIVER_CHANGED:'+name)
for(const row of s.files)if(hash(fs.readFileSync(path.join(s.target,row.path)))!==row.sha256)throw Error('ORIGINAL_SOURCE_CHANGED')
for(const row of baseline.seals)verifySeal(row.root)
const old=verifySeal(json(root+'/old-execution-seal.json').seal.root)
const excluded=new Set(['execution.stdout.log','execution.stderr.log','execution-terminal.json','wip-readback.json','wip-owned-paths.json'])
const current=tree(root).files.map(row=>row.path).filter(name=>{const local=path.relative(root,name);return !excluded.has(local)&&(!local.startsWith('execution-r1/')||['execution-r1/input.md','execution-r1/plan.md','execution-r1/tasks.md'].includes(local))})
const paths=[...current,...tree(old.root).files.map(row=>row.path),old.root+'/sealed-evidence.json'].sort()
if(new Set(paths).size!==paths.length||paths.some(name=>!name.startsWith(root+'/')&&!name.startsWith(old.root+'/')))throw Error('EXACT_WIP_OWNERSHIP_REQUIRED')
fs.writeFileSync(root+'/wip-owned-paths.json',JSON.stringify({at:new Date().toISOString(),parent,paths,selfExcluded:'wip-owned-paths.json',activeHeadAndLogsExcluded:true,originalStrategyRetained:true,productChanges:0,completeCapitalGoal:false,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(root+'/wip-owned-paths.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths]);const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(staged)!==JSON.stringify(paths))throw Error('EXACT_INDEX_REQUIRED')
const index=proof(rows);git(['commit','-m','Resume the original normal capital strategy from canonical save417'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(delta)!==JSON.stringify(paths)||git(['diff','--cached','--name-only']).length)throw Error('EXACT_COMMIT_SCOPE_REQUIRED')
const readback=proof(rows,commit),result={at:new Date().toISOString(),commit,parent,paths:paths.length,index,readback,indexEmpty:true,notPushed:true,productChanges:0,activeHeadAndLogsExcluded:true,completeCapitalGoal:false,wholeU6Complete:false,compatibility:0}
fs.writeFileSync(root+'/wip-readback.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(result)
