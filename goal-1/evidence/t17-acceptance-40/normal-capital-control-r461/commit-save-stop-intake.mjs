import fs from 'node:fs'
import {json,hash,ident,blobOid,proof,git,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',post=root+'/ledger-prefix-post-commit-01',parent='56f7116b831f83a4e9e0da207ee62e95895eed2c'
if(git(['rev-parse','HEAD']).toString().trim()!==parent || git(['diff','--cached','--name-only']).length || fs.existsSync(root+'/stopped.json')) throw Error('EXACT_ACTIVE_PARENT_REQUIRED')
const intake=json(post+'/original-save-limit-stop-intake.json')
if(intake.actualProcessExitCode!==1 || !intake.originalProcessGone || !intake.physicalHeadMatchesAuthorLastSaved || !intake.independent623FullCodecAuditPending || intake.lastSaved.revision!==623 || intake.pendingUnsavedCommand.commandId!=='normal-capital-v2:624') throw Error('EXACT_UNSAVED624_FAILURE_INTAKE_REQUIRED')
if(!fs.readFileSync(post+'/last-saved623.json').equals(fs.readFileSync(root+'/execution-r1/head.current.json')) || hash(fs.readFileSync(post+'/last-saved623.json'))!==intake.lastSaved.sha256) throw Error('PRESERVED_ACTUAL623_BYTES_REQUIRED')
for(const row of [...intake.closedExecutionFiles,...intake.outsideClosedExecutionFiles]) {
  const now=ident(row.path)
  if(now.bytes!==row.bytes || now.sha256!==row.sha256 || now.mode!==row.mode) throw Error('STOPPED_ORIGINAL_ARTIFACT_CHANGED:'+row.path)
}
const seals=json(root+'/preservation-ledger-prefix-sealed.json').fullSeals
if(seals.length!==71) throw Error('EXACT71_REQUIRED')
for(const row of seals) verifySeal(row.root)
const paths=[...['readback.json','final.json','last-saved623.json','pending624.json','original-save-limit-stop-intake.json','verification-adjustment.json'].map(name=>post+'/'+name),...['commit-save-stop-intake.mjs','plan.md','tasks.md','continuation.md','validation-progress.md'].map(name=>root+'/'+name)].sort()
if(paths.some(name=>name.startsWith('src/') || name.startsWith(root+'/execution-r1/') || name==='goal-1/plan.md' || name==='goal-1/tasks.md')) throw Error('NO_PRODUCT_OR_UNAUDITED_OLD_OUTPUT_STAGING')
fs.writeFileSync(post+'/intake-owned.json',JSON.stringify({at:new Date().toISOString(),parent,paths,selfExcluded:'intake-owned.json',lastSaved623IndependentAuditPending:true,original624NotSaved:true,productChanges:0,parentTaskComplete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
paths.push(post+'/intake-owned.json');paths.sort()
const rows=paths.map(name=>({...ident(name),oid:blobOid(fs.readFileSync(name))}))
git(['add','-f','--',...paths])
const staged=git(['diff','--cached','--name-only','-z']).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(!staged.length || staged.some(name=>!paths.includes(name))) throw Error('EXACT_INTAKE_DELTA_REQUIRED')
const index=proof(rows)
git(['commit','-m','Preserve the last saved state after the encoded save-size failure'])
const commit=git(['rev-parse','HEAD']).toString().trim(),delta=git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split(String.fromCharCode(0)).filter(Boolean).sort()
if(JSON.stringify(delta)!==JSON.stringify(staged) || git(['diff','--cached','--name-only']).length) throw Error('EXACT_COMMIT_DELTA_REQUIRED')
const readback=proof(rows,commit)
fs.writeFileSync(post+'/intake-readback.json',JSON.stringify({at:new Date().toISOString(),commit,parent,owned:paths.length,delta:staged.length,index,readback,indexEmpty:true,notPushed:true,lastSavedRevision:623,pendingUnsavedRevision:624,independent623AuditPending:true,productChanges:0,parentTaskComplete:false,wholeU6Complete:false,compatibility:0},null,2)+'\n',{flag:'wx'})
console.log({commit,owned:paths.length,delta:staged.length,lastSaved:623,pendingUnsaved:624,independentAuditPending:true,productChanges:0,indexEmpty:true,notPushed:true,parentTaskComplete:false})
