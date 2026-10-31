import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'

const root='goal-1/evidence/t17-acceptance-40/wait-feedback-r373',started=Date.now(),hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex')
if(fs.existsSync(root+'/stopped.json')||fs.existsSync(root+'/native-r1/stopped.json'))throw Error('ACTIVE_B5_REQUIRED')
const source=JSON.parse(fs.readFileSync(root+'/snapshot392.json','utf8')),original=JSON.parse(fs.readFileSync('goal-1/evidence/t17-acceptance-40/interaction-runtime-r354/snapshot372.json','utf8')),red=JSON.parse(fs.readFileSync(root+'/large-budget-red.json','utf8'))
const exact=(s:typeof source)=>s.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(s.target,r.path)))===r.sha256)
assert(exact(source)&&exact(original))
const protectedRules=original.files.filter((r:{path:string})=>r.path.startsWith('src/core/')||['src/application/campaign.ts','src/persistence/codec.ts','src/persistence/save-limits.ts'].includes(r.path))
for(const row of protectedRules)assert.equal(source.files.find((r:{path:string})=>r.path===row.path)?.sha256,row.sha256)
const beforeWire=fs.readFileSync(root+'/native-r1/actual-before.json','utf8'),candidateWire=fs.readFileSync(root+'/native-r1/actual-candidate-before-fix.json','utf8')
assert.equal(hash(beforeWire),red.before.sha256);assert.equal(hash(candidateWire),red.candidate.sha256)
const at=(s:typeof source,n:string)=>import(pathToFileURL(path.join(s.target,'src',n)).href)
const [{createCampaignCodec},{evaluateCommand},{IndexedDbRunStore},{captureWaitCheckpoint},{abortAfterHeadWrite},{assertJsonInput}]=await Promise.all([at(source,'application/campaign.ts'),at(original,'core/commands.ts'),at(source,'persistence/indexeddb.ts'),at(source,'persistence/wait-checkpoint.ts'),at(source,'testing/abort-after-write.ts'),at(source,'core/json-input.ts')])
const codec=createCampaignCodec(),factory=new IDBFactory(),name='b5-real-native-budget-392',fault=abortAfterHeadWrite(factory,name,(row:unknown)=>(row as {envelope?:{revision?:number}}).envelope?.revision===337),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name}),faulty=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name})
try{
 console.log(JSON.stringify({phase:'import-original-actual333-into-isolated-store'}))
 const imported=await physical.importSave(beforeWire,{importId:'actual333-budget-baseline',actorId:'player',mode:'create'}),baseRun=imported.record.run,generation=imported.record.generation
 assert.equal(baseRun.revision,333);assert.equal(generation,1)
 assert.equal(await physical.exportStored(baseRun.runId),beforeWire)
 const commands=red.commands.map((c:{payload:{date:string}})=>({...c,payload:{date:c.payload.date}}))
 let run=baseRun,previousRun=baseRun,evaluations=0
 for(const command of commands){
  console.log(JSON.stringify({phase:'original372-actual-command-prefix',commandId:command.commandId,from:run.revision,to:command.payload.date}))
  previousRun=run
  const proposal=evaluateCommand(run,command,codec.registry,baseRun.actorId);evaluations++
  assert.equal(proposal.status,'proposed');run=codec.validateRun(proposal.nextRun)
 }
 assert.equal(previousRun.revision,336);assert.equal(run.revision,337)
 console.log(JSON.stringify({phase:'full-original-candidate-wire-comparison'}))
 assert.equal(codec.export(run),candidateWire)
 const previousWire=codec.export(previousRun)
 fs.writeFileSync(root+'/author-original336.json',previousWire,{flag:'wx'})
 const checkpoint={baseRun,previousRun,proposal:{status:'proposed',previousRevision:336,nextRun:run,receipt:run.receipts.at(-1)},commands}
 const captured=captureWaitCheckpoint(checkpoint)
 assert.equal(captured.count,4);assert.equal(captured.baseRevision,333)
 const ordinaryOversize={a:Array(100000).fill(0),b:Array(100000).fill(0),c:Array(100000).fill(0)}
 assert.throws(()=>assertJsonInput(ordinaryOversize),/JSON_LIMIT_EXCEEDED/)
 console.log(JSON.stringify({phase:'real-head-put-success-then-abort-same-candidate337'}))
 await assert.rejects(faulty.commitCheckpoint(checkpoint,generation),/SAVE_ABORTED/)
 assert.deepEqual(fault.trace,{writeSucceeded:true,abortIssued:true})
 assert.equal(await physical.exportStored(baseRun.runId),beforeWire)
 assert.equal((await physical.load(baseRun.runId))?.run.revision,333)
 assert.equal(await physical.loadBackup(baseRun.runId),null)
 console.log(JSON.stringify({phase:'retry-storage-of-the-same-candidate-without-evaluation'}))
 const committed=await physical.commitCheckpoint(checkpoint,generation)
 assert.equal(evaluations,4);assert.equal(committed.record.generation,5)
 const loaded=await physical.load(baseRun.runId),backup=await physical.loadBackup(baseRun.runId)
 assert.equal(codec.export(loaded.run),candidateWire);assert.equal(backup.generation,4);assert.equal(codec.export(backup.run),previousWire)
 assert.equal(await physical.exportStored(baseRun.runId),candidateWire)
 const duplicate=await physical.commitCheckpoint(checkpoint,generation)
 assert.equal(duplicate.duplicate,true);assert.equal(duplicate.record.generation,5)
 assert.equal(codec.export(duplicate.record.run),candidateWire);assert.equal(evaluations,4)
 assert(exact(source)&&exact(original))
 const report={at:new Date().toISOString(),wallMs:Date.now()-started,source:source.target,sourceRows:source.files.length,sourceExact:true,originalEvaluator:original.target,protectedRuleFilesExact:protectedRules.length,before:red.before,candidate:{...red.candidate,savedInAuthorStore:true,savedInNative:false},originalCommandEvaluations:evaluations,commands,completeCandidateWireEqual:true,adjacentBackup:{revision:336,bytes:Buffer.byteLength(previousWire),sha256:hash(previousWire),generation:4},actualPutAbort:fault.trace,old333PhysicalAndNoBackupAfterAbortExact:true,sameCandidateStoredAfterRetryWithoutEvaluation:true,duplicateDoesNotOverwrite:true,logicalGeneration:{base:1,final:5},ordinaryCommand300kBudgetStillRejects:true,limitsUnchanged:true,notNativeRetry:true,newNativeCommands:0,compatibility:0,wholeU6Complete:false}
 fs.writeFileSync(root+'/large-budget-fixed.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
 console.log(JSON.stringify({phase:'complete',originalCandidateAndBackupExact:true,actualAbortAndSameCandidateStorageRetry:true,wallMs:Date.now()-started}))
}finally{await faulty.close();await physical.close()}
