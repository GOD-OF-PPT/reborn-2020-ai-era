import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'

const root='goal-1/evidence/t17-acceptance-40/wait-feedback-r373',native=root+'/native-r1',started=Date.now(),hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex')
assert(!fs.existsSync(root+'/stopped.json')&&!fs.existsSync(native+'/stopped.json'))
const original=JSON.parse(fs.readFileSync('goal-1/evidence/t17-acceptance-40/interaction-runtime-r354/snapshot372.json','utf8')),source=JSON.parse(fs.readFileSync(root+'/snapshot397.json','utf8'))
const exact=(s:typeof source)=>s.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(s.target,r.path)))===r.sha256)
assert(exact(original)&&exact(source))
const protectedFiles=original.files.filter((r:{path:string})=>r.path.startsWith('src/core/')||['src/application/campaign.ts','src/persistence/codec.ts','src/persistence/save-limits.ts'].includes(r.path))
for(const row of protectedFiles)assert.equal(source.files.find((r:{path:string})=>r.path===row.path)?.sha256,row.sha256)
const pinned=JSON.parse(fs.readFileSync(native+'/branchC-files-pinned.json','utf8'))
assert.equal(pinned.sourceRevision,397);assert.equal(pinned.separateNativeVerificationBranch,true)
const inputs=[{file:'actual-before.json',revision:333,sha:'81fd365fd9113d43ebf7a940db98f5365537c0c3cb42d37a4e89ce80615d90dc'},...pinned.files].map(row=>({...row,wire:fs.readFileSync(native+'/'+row.file,'utf8')}))
assert.deepEqual(inputs.map(row=>row.revision),[333,339,340])
for(const row of inputs){assert.equal(hash(row.wire),row.sha);assert.equal(JSON.parse(row.wire).revision,row.revision)}
const at=(s:typeof source,n:string)=>import(pathToFileURL(path.join(s.target,'src',n)).href)
const [{createCampaignCodec},{evaluateCommand,projectRun},{canonicalJson},{relaySupportSettlement},{relayBusinessTarget},{relayAuditableMeters}]=await Promise.all([at(original,'application/campaign.ts'),at(original,'core/commands.ts'),at(original,'core/identity.ts'),at(source,'ui/relay-support-settlement.ts'),at(source,'ui/relay-player-thread.ts'),at(source,'ui/relay-scene-progress.ts')])
const codec=createCampaignCodec()
console.log(JSON.stringify({phase:'validate-original333-and-actual340'}))
const before=codec.import(inputs[0]!.wire),actual=codec.import(inputs.at(-1)!.wire)
assert.equal(before.revision,333);assert.equal(actual.revision,340);assert.equal(actual.runId,before.runId);assert.equal(actual.seed,before.seed)
assert.equal(canonicalJson(actual.receipts.slice(0,before.receipts.length)),canonicalJson(before.receipts))
const commands=actual.receipts.slice(before.receipts.length).map((r:{payloadSignature:string;commandId:string;revisionBefore:number})=>({...JSON.parse(r.payloadSignature),commandId:r.commandId,expectedRevision:r.revisionBefore}))
assert.equal(commands.length,7);assert(commands.every((c:{kind:string})=>c.kind==='AdvanceTime'))
const rejected337=JSON.parse(fs.readFileSync(root+'/large-budget-red.json','utf8')).commands.map((c:{commandId:string})=>c.commandId)
assert(commands.every((c:{commandId:string})=>!rejected337.includes(c.commandId)))
const priorA=JSON.parse(fs.readFileSync(root+'/native394-exact-suffix-audit.json','utf8')).commands.map((c:{commandId:string})=>c.commandId)
assert(commands.every((c:{commandId:string})=>!priorA.includes(c.commandId)))
const priorB=JSON.parse(fs.readFileSync(root+'/native396-branchB-exact-suffix-audit.json','utf8')).commands.map((c:{commandId:string})=>c.commandId)
assert(commands.every((c:{commandId:string})=>!priorB.includes(c.commandId)))
let run=before
for(const command of commands){
 console.log(JSON.stringify({phase:'original372-exact-native-prefix',commandId:command.commandId,from:run.revision,date:command.payload.date}))
 const result=evaluateCommand(run,command,codec.registry,before.actorId);assert.equal(result.status,'proposed');run=result.nextRun
 const targets=inputs.filter(row=>row.revision===run.revision)
 if(targets.length){const wire=codec.export(run);for(const target of targets)assert.equal(wire,target.wire)}
}
assert.equal(run.revision,340)
const projection=codec.registry.runtime.project(actual),view={...projectRun(actual),features:projection,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null},periods=projection.relay.periods.filter((p:{supportJob?:{status:string;completeAt:string}})=>p.supportJob?.status==='completed'&&p.supportJob.completeAt===view.date)
assert.equal(periods.length,1)
const period=periods[0],businessTarget=relayBusinessTarget({view,features:projection},period.businessId);assert(businessTarget)
const target={...businessTarget,kind:'period',periodId:period.id},settlement=relaySupportSettlement({view,features:projection,accountId:target.accountId},target)
assert.equal(settlement.status,'known')
const operationIds=new Set(settlement.sourceRefs.filter((r:{kind:string})=>r.kind==='operation').map((r:{id:string})=>r.id)),incomeOperations=projection.relay.casebook.operations.filter((o:{id:string})=>operationIds.has(o.id)).map((o:{id:string;kind:string;amountFen:number})=>({id:o.id,kind:o.kind,amountFen:o.amountFen}))
assert(exact(original)&&exact(source))
const report={at:new Date().toISOString(),wallMs:Date.now()-started,originalEvaluator:original.target,nativeSource:source.target,sourceExact:true,protectedRuleFilesExact:protectedFiles.length,inputs:inputs.map(({wire,...row})=>({...row,bytes:Buffer.byteLength(wire)})),commands,actualNativeCommands:7,separateNativeVerificationBranch:true,noManualStopInThisBranch:true,completeFinal340AndAdjacent339Exact:true,priorTwoBranchesCommandsNotMerged:true,uncommitted337NotMerged:true,settlement:{periodId:period.id,businessId:period.businessId,accountId:target.accountId,supportCompleteAt:period.supportJob.completeAt,incomeFen:settlement.incomeFen,compensationCostFen:settlement.compensationCostFen,compensationPaidFen:settlement.compensationPaidFen,compensationDueFen:settlement.compensationDueFen,incomeOperations,auditableSuppliedRecords:relayAuditableMeters(projection.relay,period.id).length},newAuthorStoreWrites:0,fullCreateNotRerun:true,notHumanPlaytest:true,notPerformanceAcceptance:true,compatibility:0,wholeU6Complete:false}
fs.writeFileSync(root+'/native397-branchC-exact-suffix-audit.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({phase:'complete',allActualBranchWiresAndAdjacentBackupExact:true,wallMs:Date.now()-started}))
