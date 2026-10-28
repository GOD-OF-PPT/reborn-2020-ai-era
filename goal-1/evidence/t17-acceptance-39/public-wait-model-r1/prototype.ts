import fs from 'node:fs'
import path from 'node:path'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignRun,createCampaignCodec} from '../../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../../src/core/commands.ts'
import {canonicalJson} from '../../../../src/core/identity.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {playableAdvanceDate} from '../../../../src/application/playable-advance.ts'
import {publicFeedbackSince} from '../../../../src/application/public-feedback.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
const root='goal-1/evidence/t17-acceptance-39',out=root+'/public-wait-model-r1',source=root+'/chrome-result-r3/r3-03-actual20-explicit-rest-completed.json',raw=fs.readFileSync(source,'utf8'),codec=createCampaignCodec(),original=codec.import(raw),first=original.receipts[0]!
const put=(name:string,data:string)=>{guard(path.resolve(out));fs.writeFileSync(out+'/'+name,data,{flag:'wx'})}
let run=createCampaignRun({runId:original.runId,actorId:original.actorId,commandId:first.commandId,backgroundId:original.backgroundId,seed:original.seed,playerProfile:original.playerProfile}),prefix19=''
for(const receipt of original.receipts.slice(1)){
 const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},result=evaluateCommand(run,command,codec.registry,original.actorId)
 if(result.status!=='proposed')throw Error('ORIGINAL_CREATE_REPLAY_REJECTED')
 run=codec.import(codec.export(result.nextRun))
 if(run.revision===19)prefix19=codec.export(run)
}
if(codec.export(run)!==raw||!prefix19)throw Error('ORIGINAL_FULL_BYTES_NOT_EQUAL')
put('reconstructed-original19.json',prefix19)
put('full-create-source-proof.json',JSON.stringify({source,scope:'Original actualNative20 completeCreate replay; reconstructed19 is a model prefix, not a physical export',commands:original.receipts.length-1,fullBytesEqual:true},null,2)+'\n')
const store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-public-wait-model-r1'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:(()=>{let n=0;return()=> 'cux09-wait-model-r1-'+(++n)})()})
await controller.initialize();await controller.importNew(prefix19)
const rows:unknown[]=[],goal='2020-04-11';let firstPause:unknown=null
try{
 for(let i=0;i<16;i++){
  const before=controller.snapshot.view!,w=before.features.workbench as import('../../../../src/application/workbench-projection.ts').WorkbenchProjection
  if(before.date>=goal)break
  if(w.pause||w.progression.requiresDelivery)throw Error('PUBLIC_RESPONSIBILITY_STOP')
  const requested=w.progression.nextDate<=goal?w.progression.nextDate:goal,date=playableAdvanceDate(w,before.date,requested),command=controller.prepare('AdvanceTime',{date})
  if(!controller.preview(command).allowed)throw Error('ORIGINAL_PREVIEW_REJECTED')
  const result=await controller.submit(command)
  if(result.status!=='saved')throw Error('ORIGINAL_SAVE_NOT_SAVED')
  const current=controller.snapshot.view!,feedback=publicFeedbackSince(before,current),row={commandId:command.commandId,date:current.date,revision:current.revision,publicOpaqueNextDate:w.progression.nextDate,feedback:feedback.map(f=>({kind:f.kind,sourceId:f.sourceId,attention:f.attention,label:f.label}))}
  rows.push(row)
  if(firstPause===null&&feedback.some(f=>f.attention==='pause')){firstPause=row;put('first-public-feedback-saved.json',controller.exportSaved())}
 }
 const finalRaw=controller.exportSaved(),final=codec.import(finalRaw)
 if(controller.snapshot.view!.date!==goal)throw Error('GOAL_NOT_REACHED_WITHIN_BOUND')
 const fields=['economy','operations','market','video','course','relay','deepseek','life','story','journey','random','world'] as const
 const equality=fields.map(field=>({field,equal:canonicalJson(final[field])===canonicalJson(original[field])}))
 put('final-stepped-model.json',finalRaw)
 put('result.json',JSON.stringify({at:new Date().toISOString(),scope:'Standalone author normal model prototype using only original controller AdvanceTime and public view differences. No production wait controller or UI loop yet; no Native or newCreate.',source,startRevision:19,goal,steps:rows,firstPause,criticalStateEqualityToOriginalOneCommand:equality,allCriticalStateEqual:equality.every(r=>r.equal),newNativeCommands:0,productionLoopImplemented:false,compatibility:0},null,2)+'\n')
 console.log(JSON.stringify({steps:rows.length,firstPause,criticalStateEquality:equality,productionLoopImplemented:false}))
}finally{await controller.close();await store.close()}
